import { Circle, Container, Graphics, Rectangle } from 'pixi.js';
import { cream, grass, ink, swatch } from '../../art/palette';
import { Backdrop } from '../../art/scenery';
import { STYLES } from '../../audio/music';
import { sfx } from '../../audio/sfx';
import { onTap } from '../../engine/input';
import { ease } from '../../engine/tween';
import type { View } from '../../engine/view';
import { rangeFor } from '../../progress/difficulty';
import { WigglyIcon, tile } from '../shared';
import type { Game, GameContext, GameModule, TouchIntent } from '../types';
import { block, face, glowSection, spinner as spinnerArt, sw, type SpinnerArt } from './art';
import {
  BAR_H, BIG, COL_W, FACE, LEVELS, NAME_OF, SMALL, kindsOf, layout, makeRound, planFor, spin, stickerSet, stopRotation,
  tallest, tally, wedgeAt, type Kind, type Layout, type Plan, type SetSpec,
} from './logic';
import { RaceGame } from './race';
import { SureGame } from './sure';

type Phase = 'spin' | 'ask' | 'pick';

class SpinnerFair implements Game {
  readonly plan: Plan;
  readonly sets: SetSpec[];
  setIndex = 0;
  phase: Phase;
  /** What each spin of the set landed on, in order. */
  results: Kind[] = [];
  misses = 0;
  hints = 0;
  /** Misses on the set or pick in play; the second lights the glow. */
  setMisses = 0;
  /** Help is showing for this set or pick (counted once). */
  glowing = false;
  hinted = false;
  spinning = false;
  busy = false;
  finished = false;
  /** Level 3: the spinner she picked (0 or 1), once picked. */
  picked: number | null = null;
  spinners: SpinnerArt[] = [];
  columns: Container[] = [];
  readonly favourite = new Container();
  private layoutNow: Layout;
  private clock = 0;
  private idle = 0;
  private lastWedge = -1;
  private readonly backdrop: Backdrop;
  private readonly spinLayer = new Container();
  private readonly barsPanel = new Graphics();
  private readonly barsNode = new Container();
  private readonly glowRing = new Graphics();

  constructor(private readonly ctx: GameContext) {
    this.plan = planFor(ctx.level);
    this.sets = makeRound(ctx.level, ctx.rng);
    this.phase = this.plan.ask === 'pick' ? 'pick' : 'spin';
    this.backdrop = new Backdrop({ sky: [cream, swatch.blue.light], hills: [grass, swatch.green.light], horizon: 0.36, clouds: 2, sun: true, seed: 83 }, ctx.view);
    this.barsPanel.eventMode = this.glowRing.eventMode = 'none';
    this.favourite.hitArea = new Rectangle(-60, -60, 120, 120);
    onTap(this.favourite, () => this.tapFavourite());
    this.layoutNow = layout(ctx.view, 3);
    ctx.stage.addChild(this.backdrop, this.barsPanel, this.barsNode, this.spinLayer, this.favourite, this.glowRing);
    this.dressSet();
  }

  get set(): SetSpec { return this.sets[this.setIndex]; }
  /** The spinner that spins now (the one of levels 1–2, or the picked one). */
  get wheel() { return this.set.wheels[this.picked ?? 0]; }
  get kinds(): Kind[] { return this.phase === 'pick' ? [] : kindsOf(this.wheel); }
  get counts(): number[] { return tally(this.kinds, this.results); }
  get main(): SpinnerArt { return this.spinners[this.picked ?? 0]; }
  /** What a scripted play reads. */
  get state() {
    return {
      level: this.plan.level, set: this.setIndex, phase: this.phase, results: this.results.slice(), kinds: this.kinds, counts: this.counts,
      spins: this.plan.spins, misses: this.misses, hints: this.hints, glowing: this.glowing, picked: this.picked,
      favourite: this.set.favourite ?? null, better: this.set.better ?? null, wheels: this.set.wheels, spinning: this.spinning, busy: this.busy, finished: this.finished,
    };
  }

  start() { void this.instruct(); }

  destroy() {
    this.finished = true;
    for (const s of this.spinners) { this.ctx.tw.kill(s.wheel); this.ctx.tw.kill(s.node); this.ctx.tw.kill(s.node.scale); }
  }

  private instruct() {
    if (this.plan.ask === 'see') return this.ctx.instruct('sf.instruct.1');
    if (this.plan.ask === 'most') return this.ctx.instruct(this.phase === 'ask' ? 'sf.most' : 'sf.instruct.2');
    const kind = NAME_OF[this.set.favourite!];
    return this.ctx.instruct(this.phase === 'pick' ? 'sf.instruct.3' : 'sf.spin-ten', { kind });
  }

  // ---- building a set ----

  private dressSet() {
    for (const s of this.spinners) { this.ctx.tw.kill(s.wheel); this.ctx.tw.kill(s.node); this.ctx.tw.kill(s.node.scale); s.node.destroy({ children: true }); }
    this.spinners = this.set.wheels.map((w, i) => {
      const art = spinnerArt(w, this.plan.ask === 'pick' ? SMALL : BIG);
      const r = this.plan.ask === 'pick' ? SMALL : BIG;
      art.node.hitArea = new Circle(0, 0, r + 12);
      onTap(art.node, () => this.tapSpinner(i));
      this.spinLayer.addChild(art.node);
      return art;
    });
    this.favourite.removeChildren().forEach((c) => c.destroy({ children: true }));
    this.favourite.visible = this.phase === 'pick';
    if (this.set.favourite) {
      const bubble = new Graphics().circle(0, 0, 60).fill(0xffffff).stroke({ width: 5, color: swatch.yellow.line });
      const heart = new Graphics().circle(-8, 0, 9).circle(8, 0, 9).poly([-16, 4, 16, 4, 0, 20]).fill(swatch.red.fill);
      heart.position.set(38, -40);
      this.favourite.addChild(bubble, face(this.set.favourite, 90), heart);
    }
    this.buildBars();
    this.resize(this.ctx.view);
  }

  /** The bars for the wheel that spins now: a column per critter, its face under it and a block per landing. */
  private buildBars() {
    this.barsNode.removeChildren().forEach((c) => c.destroy({ children: true }));
    this.columns = [];
    this.barsPanel.visible = this.phase !== 'pick';
    if (this.phase === 'pick') return;
    this.kinds.forEach((kind, i) => {
      const col = new Container();
      const f = face(kind, FACE - 6);
      f.position.set(0, FACE / 2);
      col.addChild(f, new Container());
      col.hitArea = new Rectangle(-COL_W / 2, -BAR_H, COL_W, BAR_H + FACE);
      onTap(col, () => this.tapColumn(i));
      this.columns.push(col);
      this.barsNode.addChild(col);
    });
    this.drawBlocks();
  }

  private get blockH() { return BAR_H / Math.max(8, this.plan.spins); }

  private drawBlocks() {
    const counts = this.counts;
    this.columns.forEach((col, i) => {
      const stack = col.children[1] as Container;
      stack.removeChildren().forEach((c) => c.destroy());
      for (let k = 0; k < counts[i]; k++) {
        const b = block(this.kinds[i], 80, this.blockH);
        b.position.set(0, -k * this.blockH);
        stack.addChild(b);
      }
    });
  }

  // ---- play ----

  private tapSpinner(i: number) {
    if (this.finished) return;
    const node = this.spinners[i].node;
    this.ctx.tw.kill(node);
    node.rotation = 0.04;
    void this.ctx.tw.to(node, { rotation: 0 }, { duration: 0.3, ease: ease.outElastic });
    if (this.busy || this.spinning) return;
    if (this.phase === 'pick') { void this.pick(i); return; }
    if (this.phase === 'ask') { sfx.pop(2); void this.ctx.say('sf.no-more-spins'); return; }
    void this.doSpin();
  }

  private async doSpin() {
    if (this.results.length >= this.plan.spins) { sfx.pop(2); void this.ctx.say('sf.no-more-spins'); return; }
    this.idle = 0;
    this.spinning = true;
    const set = this.setIndex;
    // The result is drawn first, honestly, from the game's seeded RNG; the wheel then eases out onto it.
    const s = spin(this.ctx.rng);
    const art = this.main;
    const from = art.wheel.rotation;
    const to = stopRotation(from, s.angle, this.results.length === 0 ? 3 : 2);
    this.lastWedge = wedgeAt(from);
    await this.ctx.tw.to(art.wheel, { rotation: to }, { duration: this.results.length === 0 ? 2 : 1.2, ease: ease.outCubic });
    if (this.finished || set !== this.setIndex) return;
    art.wheel.rotation = to % (Math.PI * 2);
    const kind = this.wheel[s.wedge];
    this.results.push(kind);
    this.spinning = false;
    const bar = this.kinds.indexOf(kind);
    sfx.bell(3 + bar * 2, 0.25);
    sfx.pop(3 + Math.min(8, this.counts[bar]));
    this.drawBlocks();
    const col = this.columns[bar];
    const top = col.toGlobal({ x: 0, y: -this.counts[bar] * this.blockH });
    const at = this.ctx.stage.toLocal(top);
    this.ctx.particles.burst(at.x, at.y, { kind: 'dot', colors: [sw(kind).fill, 0xffffff], count: 8, speed: [60, 150], gravity: 300, life: [0.25, 0.5] });
    this.ctx.tw.kill(col.scale);
    col.scale.set(1.08);
    void this.ctx.tw.to(col.scale, { x: 1, y: 1 }, { duration: 0.3, ease: ease.outBack });
    void this.ctx.say('sf.critter', { kind: NAME_OF[kind] });
    if (this.results.length >= this.plan.spins) await this.setSpun();
  }

  /** The set's spins are done: level 1 ends, level 2 asks, level 3 says what chance did. */
  private async setSpun() {
    this.busy = true;
    const set = this.setIndex;
    await this.ctx.tw.wait(0.6);
    if (this.finished || set !== this.setIndex) return;
    if (this.plan.ask === 'see') { await this.endSet(); return; }
    if (this.plan.ask === 'most') {
      this.phase = 'ask';
      this.busy = false;
      void this.instruct();
      return;
    }
    const fav = this.set.favourite!;
    const counts = this.counts;
    const favCount = counts[this.kinds.indexOf(fav)];
    const top = tallest(counts).map((i) => this.kinds[i]);
    if (top.includes(fav)) await this.ctx.say('sf.fav-won', { kind: NAME_OF[fav] });
    else await this.ctx.say('sf.still-better', { kind: NAME_OF[fav], other: NAME_OF[top[0]], n: favCount });
    if (this.finished) return;
    await this.endSet();
  }

  private tapColumn(i: number) {
    if (this.finished || this.busy) return;
    const col = this.columns[i];
    this.ctx.tw.kill(col.scale);
    col.scale.set(1.05);
    void this.ctx.tw.to(col.scale, { x: 1, y: 1 }, { duration: 0.25, ease: ease.outBack });
    if (this.phase !== 'ask') { sfx.pop(4); return; }
    const top = tallest(this.counts);
    if (top.includes(i)) { void this.rightMost(i, top); return; }
    this.misses++; this.setMisses++;
    sfx.boing();
    void this.hearWrong('sf.count-blocks');
  }

  private async rightMost(i: number, top: number[]) {
    this.busy = true;
    this.glowing = false;
    sfx.sparkle();
    const kind = this.kinds[i];
    if (top.length > 1) await this.ctx.say('sf.tie', { kind: NAME_OF[this.kinds[top[0]]], other: NAME_OF[this.kinds[top[1]]] });
    else await this.ctx.say('sf.right-most', { kind: NAME_OF[kind], n: this.counts[i] });
    if (this.finished) return;
    await this.endSet();
  }

  private async pick(i: number) {
    if (i !== this.set.better) {
      this.misses++; this.setMisses++;
      sfx.boing();
      void this.hearWrong('sf.more-of', { kind: NAME_OF[this.set.favourite!] });
      return;
    }
    this.busy = true;
    this.glowing = false;
    this.picked = i;
    sfx.bell(7, 0.3);
    const other = this.spinners[1 - i].node;
    other.eventMode = 'none';
    void this.ctx.tw.to(other, { alpha: 0 }, { duration: 0.35, ease: ease.outQuad }).then(() => { if (!other.destroyed) other.visible = false; });
    this.phase = 'spin';
    this.favourite.visible = false;
    this.buildBars();
    this.layoutNow = layout(this.ctx.view, this.kinds.length);
    this.placeBars();
    const node = this.main.node, l = this.layoutNow;
    this.ctx.tw.kill(node); this.ctx.tw.kill(node.scale);
    void this.ctx.tw.to(node.scale, { x: BIG / SMALL, y: BIG / SMALL }, { duration: 0.45, ease: ease.outBack });
    await this.ctx.tw.to(node, { x: l.spinner.x, y: l.spinner.y }, { duration: 0.45, ease: ease.outQuad });
    if (this.finished) return;
    await this.ctx.say('sf.picked', { kind: NAME_OF[this.set.favourite!] });
    if (this.finished) return;
    this.busy = false;
    void this.instruct();
  }

  private async hearWrong(line: 'sf.count-blocks' | 'sf.more-of', vars: Record<string, string> = {}) {
    const set = this.setIndex;
    await this.ctx.say(line, vars);
    if (this.finished || this.busy || set !== this.setIndex) return;
    if (this.setMisses >= 2 && !this.glowing) { this.lightHint(); await this.ctx.say('sf.help'); }
  }

  private lightHint() {
    this.glowing = true;
    if (!this.hinted) { this.hinted = true; this.hints++; }
  }

  readonly hintLabel = 'Show me';

  /** Asked-for help: the glow on the question's answer (one hint per set or pick); asked again, the ghost answers. During spins it repeats the ask. */
  askForHint() {
    if (this.busy || this.finished || this.spinning) return;
    if (this.phase === 'spin') { void this.instruct(); return; }
    if (!this.glowing) { this.lightHint(); void this.ctx.say('sf.help'); return; }
    if (this.phase === 'ask') this.tapColumn(tallest(this.counts)[0]);
    else this.tapSpinner(this.set.better!);
  }

  private tapFavourite() {
    if (this.finished || !this.set.favourite) return;
    sfx.bell(9, 0.2);
    void this.ctx.say('sf.favourite', { kind: NAME_OF[this.set.favourite] });
  }

  private async endSet() {
    this.busy = true;
    if (this.setIndex + 1 >= this.sets.length) {
      this.finished = true;
      sfx.bell(7, 0.35); sfx.bell(11, 0.3);
      await this.ctx.say('sf.done');
      await this.ctx.tw.wait(0.5);
      this.ctx.finish({ misses: this.misses, hints: this.hints });
      return;
    }
    await this.ctx.tw.wait(0.4);
    if (this.finished) return;
    this.setIndex++;
    this.results = [];
    this.setMisses = 0;
    this.hinted = false;
    this.glowing = false;
    this.picked = null;
    this.phase = this.plan.ask === 'pick' ? 'pick' : 'spin';
    this.dressSet();
    sfx.whoosh();
    await this.ctx.say('sf.next');
    if (this.finished) return;
    this.busy = false;
    void this.instruct();
  }

  // ---- shell hooks ----

  private placeBars() {
    const l = this.layoutNow;
    this.columns.forEach((col, i) => col.position.set(l.columns[i].x, l.base));
    this.barsPanel.clear();
    if (!this.columns.length) return;
    const left = l.columns[0].x - COL_W / 2 - 14, right = l.columns[l.columns.length - 1].x + COL_W / 2 + 14;
    this.barsPanel.roundRect(left, l.base - BAR_H - 16, right - left, BAR_H + FACE + 24, 20).fill({ color: 0xffffff, alpha: 0.75 });
    this.barsPanel.moveTo(left + 10, l.base).lineTo(right - 10, l.base).stroke({ width: 4, color: ink, alpha: 0.5 });
  }

  resize(view: View) {
    const l = this.layoutNow = layout(view, Math.max(1, this.phase === 'pick' ? 3 : this.kinds.length));
    this.backdrop.resize(view);
    if (this.phase === 'pick') this.spinners.forEach((s, i) => s.node.position.set(l.pair[i].x, l.pair[i].y));
    else {
      this.main.node.position.set(l.spinner.x, l.spinner.y);
      if (this.picked !== null) { this.ctx.tw.kill(this.main.node.scale); this.main.node.scale.set(BIG / SMALL); }
    }
    this.favourite.position.set(l.favourite.x, l.favourite.y);
    this.placeBars();
  }

  update(dt: number) {
    this.clock += dt;
    if (this.spinning) {
      const w = wedgeAt(this.main.wheel.rotation);
      if (w !== this.lastWedge) { this.lastWedge = w; sfx.tick(); }
    }
    // Level 1: after ten quiet seconds the pet spins once to show how; that spin counts toward the six.
    if (this.plan.ask === 'see' && !this.spinning && !this.busy && !this.finished && this.results.length < this.plan.spins) {
      this.idle += dt;
      if (this.idle > 10) void this.doSpin();
    }
    this.glowRing.clear();
    for (const s of this.spinners) s.glow.clear();
    if (!this.glowing || this.finished || this.busy) return;
    const pulse = 7 + 3 * Math.sin(this.clock * 5);
    if (this.phase === 'ask') {
      for (const i of tallest(this.counts)) {
        const c = this.columns[i];
        this.glowRing.roundRect(c.x - COL_W / 2 - pulse, c.y - BAR_H - pulse, COL_W + 2 * pulse, BAR_H + FACE + 2 * pulse, 22).stroke({ width: 7, color: swatch.yellow.fill });
      }
    } else if (this.phase === 'pick') {
      const s = this.spinners[this.set.better!];
      glowSection(s.glow, this.set.wheels[this.set.better!], this.set.favourite!, SMALL + pulse, s.wheel.rotation, 9);
    }
  }

  autotouch(): TouchIntent | null {
    if (this.busy || this.finished || this.spinning) return null;
    if (this.phase === 'spin') return { tap: { on: this.main.node }, pause: 0.3 };
    if (this.phase === 'ask') return { tap: { on: this.columns[tallest(this.counts)[0]], y: -BAR_H / 2 } };
    return { tap: { on: this.spinners[this.set.better!].node } };
  }
}

function icon(): Container {
  const c = new Container();
  const s = spinnerArt(['duck', 'duck', 'pig', 'pig', 'bunny', 'bunny'], 110);
  s.wheel.rotation = -0.5;
  s.node.position.set(0, -170);
  c.addChild(s.node);
  return c;
}

function sticker(seed: number): Container {
  const c = new Container();
  c.addChild(tile(260, 260, 'white'));
  const { wheel, counts } = stickerSet(seed);
  const s = spinnerArt(wheel, 62);
  s.node.position.set(-50, -40);
  c.addChild(s.node);
  kindsOf(wheel).forEach((kind, i) => {
    for (let k = 0; k < counts[i]; k++) {
      const b = block(kind, 30, 22);
      b.position.set(50 + i * 34, 60 - k * 22);
      c.addChild(b);
    }
  });
  return c;
}

export const spinnerFair: GameModule = {
  id: 'spinner-fair', name: 'Spinner Fair', titleLine: 'game.spinner-fair', region: 'counting-cove',
  skills: ['counting', 'data', 'graphs', 'comparing'], bands: ['preschool', 'prek', 'school'], levels: (b) => rangeFor(LEVELS, b),
  describeLevel: (l) => planFor(l).name,
  music: STYLES.hub,
  coplayHint: 'Spinner and counter: one of you taps the spins, the other says each critter and points at its bar before the block lands. Before a pick, ask: which would you choose for your favourite? Before a race, ask: is this fair, and how could we make it fair?',
  offScreen: 'Flip a coin twenty times and make a mark for each side. Was it fair? How could you tell?',
  hubIcon: () => new WigglyIcon(icon()), sticker,
  create: (ctx) => { const ask = planFor(ctx.level).ask; return ask === 'sure' ? new SureGame(ctx) : ask === 'fair' ? new RaceGame(ctx) : new SpinnerFair(ctx); },
  touchDemo: true,
};
