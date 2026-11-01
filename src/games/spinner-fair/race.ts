import { Circle, Container, Graphics, Polygon, Rectangle } from 'pixi.js';
import { cream, grass, ink, swatch, wood } from '../../art/palette';
import { Backdrop } from '../../art/scenery';
import { sfx } from '../../audio/sfx';
import { draggable, type DragHandle } from '../../engine/drag';
import { onTap } from '../../engine/input';
import { ease } from '../../engine/tween';
import type { View } from '../../engine/view';
import type { Game, GameContext, TouchIntent } from '../types';
import { hubCap, racerArt, spinner as spinnerArt, sw, wedgePiece, type SpinnerArt } from './art';
import {
  BIG, BTN_H, BTN_W, CHECK_W, countOf, give, isFair, makeRound, NAME_OF, nextGive, planFor, raceLayout, racePositions, RACER, spin,
  stopRotation, TRACK, WEDGE_DEG, WEDGES, wedgeAt, type Box, type Kind, type Plan, type RaceLayout, type SetSpec, type Wheel,
} from './logic';

/*
 * Spinner Fair level 5, Fair or unfair?: two critters share one wheel and race a step per spin they win. She says whether
 * the race is fair; if not, she hands wedges from one racer to the other until each has three, then Check; then six spins
 * she taps run the race. A wrong fair/unfair and an uneven Check are the only misses; moving wedges and the race are free.
 */

type Phase = 'ask' | 'even' | 'race';
type Button = 'fair' | 'unfair' | 'check';

interface Piece { index: number; kind: Kind; node: Container; drag: DragHandle }

export class RaceGame implements Game {
  readonly plan: Plan;
  readonly sets: SetSpec[];
  readonly hintLabel = 'Show me';
  setIndex = 0;
  phase: Phase = 'ask';
  /** The wheel as it is now (wedges move at the even phase). */
  wheel: Wheel;
  results: Kind[] = [];
  misses = 0;
  hints = 0;
  setMisses = 0;
  glowing = false;
  hinted = false;
  spinning = false;
  busy = false;
  finished = false;
  art!: SpinnerArt;
  pieces: Piece[] = [];
  racerNodes: Container[] = [];
  readonly buttons: Record<Button, Container> = { fair: new Container(), unfair: new Container(), check: new Container() };
  private L: RaceLayout;
  private clock = 0;
  private lastWedge = -1;
  private rebuild = false;
  private readonly backdrop: Backdrop;
  private readonly trackArt = new Graphics();
  private readonly racerLayer = new Container();
  private readonly spinLayer = new Container();
  private readonly glowRing = new Graphics();

  constructor(private readonly ctx: GameContext) {
    this.plan = planFor(ctx.level);
    this.sets = makeRound(ctx.level, ctx.rng);
    this.wheel = this.set.wheels[0];
    this.L = raceLayout(ctx.view);
    this.backdrop = new Backdrop({ sky: [cream, swatch.blue.light], hills: [grass, swatch.green.light], horizon: 0.36, clouds: 2, sun: true, seed: 85 }, ctx.view);
    this.trackArt.eventMode = this.glowRing.eventMode = 'none';
    this.drawButtons();
    ctx.stage.addChild(this.backdrop, this.trackArt, this.racerLayer, ...Object.values(this.buttons), this.spinLayer, this.glowRing);
    this.dressSet();
  }

  get set(): SetSpec { return this.sets[this.setIndex]; }
  get racers(): [Kind, Kind] { return this.set.racers!; }
  get positions() { return racePositions(this.racers, this.results); }
  /** What a scripted play reads. */
  get state() {
    return {
      level: this.plan.level, set: this.setIndex, phase: this.phase, racers: this.racers, wheel: this.wheel.slice(), counts: this.racers.map((k) => countOf(this.wheel, k)),
      fair: isFair(this.wheel, this.racers), results: this.results.slice(), positions: this.positions, spins: this.plan.spins,
      misses: this.misses, hints: this.hints, glowing: this.glowing, spinning: this.spinning, busy: this.busy, finished: this.finished,
    };
  }

  start() { void this.instruct(); }

  private instruct() {
    const [kind, other] = this.racers.map((k) => NAME_OF[k]);
    if (this.phase === 'ask') return this.ctx.instruct('sf.instruct.5', { kind, other });
    if (this.phase === 'even') return this.ctx.instruct('sf.make-fair');
    return this.ctx.instruct('sf.race-go');
  }

  destroy() {
    this.finished = true;
    for (const p of this.pieces) p.drag.destroy();
    this.ctx.tw.kill(this.art.wheel);
    for (const n of this.racerNodes) this.ctx.tw.kill(n);
  }

  // ---- building ----

  private drawButtons() {
    const plate = (b: Container, w: number, tint: { fill: number; line: number }) => {
      b.addChild(new Graphics().roundRect(-w / 2, -BTN_H / 2, w, BTN_H, 20).fill(0xffffff).stroke({ width: 6, color: tint.line }));
      b.hitArea = new Rectangle(-w / 2, -BTN_H / 2, w, BTN_H);
    };
    // Fair: a level seesaw. Unfair: a tipped one. Check: a tick.
    const seesaw = (tilt: number) => {
      const g = new Graphics();
      g.poly([-14, 30, 14, 30, 0, 8]).fill(wood.fill).stroke({ width: 4, color: wood.line, join: 'round' });
      const plank = new Graphics().roundRect(-52, -6, 104, 12, 6).fill(wood.light).stroke({ width: 4, color: wood.line })
        .circle(-40, -18, 11).fill(swatch.pink.fill).stroke({ width: 3, color: ink }).circle(40, -18, 11).fill(swatch.blue.fill).stroke({ width: 3, color: ink });
      plank.position.set(0, 4);
      plank.rotation = tilt;
      const c = new Container();
      c.addChild(g, plank);
      return c;
    };
    plate(this.buttons.fair, BTN_W, swatch.green);
    this.buttons.fair.addChild(seesaw(0));
    plate(this.buttons.unfair, BTN_W, swatch.red);
    this.buttons.unfair.addChild(seesaw(0.32));
    plate(this.buttons.check, CHECK_W, swatch.green);
    this.buttons.check.addChild(new Graphics().moveTo(-24, 0).lineTo(-6, 18).lineTo(26, -18).stroke({ width: 11, color: swatch.green.fill, cap: 'round', join: 'round' }));
    for (const b of ['fair', 'unfair', 'check'] as Button[]) onTap(this.buttons[b], () => this.press(b));
  }

  private dressSet() {
    if (this.art) { this.ctx.tw.kill(this.art.wheel); this.art.node.destroy({ children: true }); }
    for (const n of this.racerNodes) { this.ctx.tw.kill(n); n.destroy({ children: true }); }
    this.pieces = [];
    this.art = spinnerArt(this.wheel, BIG, { stand: false, bare: true });
    this.art.node.hitArea = new Circle(0, 0, BIG + 12);
    this.art.wheel.eventMode = 'passive';
    onTap(this.art.node, () => this.tapSpinner());
    this.spinLayer.addChild(this.art.node);
    this.buildPieces();
    this.racerNodes = this.racers.map((k) => {
      const n = racerArt(k, RACER);
      n.hitArea = new Rectangle(-RACER / 2, -RACER / 2, RACER, RACER);
      onTap(n, () => { sfx.pop(6); void this.ctx.say('sf.critter', { kind: NAME_OF[k] }); });
      this.racerLayer.addChild(n);
      return n;
    });
    this.resize(this.ctx.view);
  }

  /** One movable piece per wedge, in the wheel's frame; the hub caps them. */
  private buildPieces() {
    for (const p of this.pieces) { p.drag.destroy(); this.ctx.tw.kill(p.node); p.node.destroy({ children: true }); }
    this.art.wheel.removeChildren(1).forEach((c) => c.destroy({ children: true }));
    this.pieces = this.wheel.map((kind, index) => {
      const w = wedgePiece(kind, index, BIG);
      w.node.hitArea = new Polygon(w.points);
      this.art.wheel.addChild(w.node);
      const p: Piece = { index, kind, node: w.node, drag: null! };
      p.drag = draggable(w.node, this.ctx.tw, { lift: 0, keepGrab: true, onPick: () => sfx.pop(5), onDrop: (x, y) => this.dropWedge(p, x, y) });
      return p;
    });
    this.art.wheel.addChild(hubCap(BIG));
    this.syncDrags();
  }

  private syncDrags() {
    for (const p of this.pieces) p.drag.enabled = this.phase === 'even' && !this.busy && !this.finished;
  }

  // ---- play ----

  private press(b: Button) {
    if (this.finished) return;
    const n = this.buttons[b];
    this.ctx.tw.kill(n.scale);
    n.scale.set(1.08);
    void this.ctx.tw.to(n.scale, { x: 1, y: 1 }, { duration: 0.25, ease: ease.outBack });
    if (this.busy || this.spinning) return;
    if (b === 'check') { void this.check(); return; }
    if (this.phase !== 'ask') { sfx.pop(3); void this.instruct(); return; }
    const fair = isFair(this.wheel, this.racers);
    if ((b === 'fair') !== fair) {
      this.miss();
      void this.hearWrong('sf.count-wedges', { kind: NAME_OF[this.racers[0]], other: NAME_OF[this.racers[1]] });
      return;
    }
    void this.answered(fair);
  }

  private miss() {
    this.misses++; this.setMisses++;
    sfx.boing();
  }

  private async answered(fair: boolean) {
    this.busy = true;
    this.glowing = false;
    sfx.sparkle();
    const set = this.setIndex;
    if (fair) {
      await this.ctx.say('sf.fair');
      if (this.finished || set !== this.setIndex) return;
      this.toRace();
      return;
    }
    const [n, m] = this.racers.map((k) => String(countOf(this.wheel, k)));
    await this.ctx.say('sf.unfair', { kind: NAME_OF[this.racers[0]], other: NAME_OF[this.racers[1]], n, m });
    if (this.finished || set !== this.setIndex) return;
    this.phase = 'even';
    this.setMisses = 0;
    this.busy = false;
    this.syncDrags();
    void this.instruct();
  }

  /** A wedge let go: on the other racer it changes owner (the wheel re-sorts); anywhere else it goes back. Never counted. */
  private dropWedge(p: Piece, x: number, y: number): boolean {
    if (this.phase !== 'even' || this.busy || this.finished) return false;
    const at = this.ctx.stage.toLocal(this.art.wheel.toGlobal({ x, y }));
    const near = this.racerNodes.map((n, i) => ({ i, d: Math.hypot(n.x - at.x, n.y - at.y) })).sort((a, b) => a.d - b.d)[0];
    const to = this.racers[near.i];
    if (near.d > RACER / 2 + 60 || to === p.kind) return false;
    const next = give(this.wheel, this.racers, to);
    if (!next) { sfx.pop(2); void this.ctx.say('sf.keep-one'); return false; }
    this.handTo(next, near.i);
    p.node.visible = false;
    return true;
  }

  private handTo(next: Wheel, racer: number) {
    this.wheel = next;
    this.rebuild = true;
    const r = this.racerNodes[racer];
    sfx.bell(4 + racer * 3, 0.2);
    this.ctx.particles.burst(r.x, r.y, { kind: 'dot', colors: [sw(this.racers[racer]).fill, 0xffffff], count: 10, speed: [60, 150], gravity: 250, life: [0.3, 0.6] });
    this.ctx.tw.kill(r.scale);
    r.scale.set(1.12);
    void this.ctx.tw.to(r.scale, { x: 1, y: 1 }, { duration: 0.3, ease: ease.outBack });
    void this.ctx.say('sf.count-now', { n: String(countOf(next, this.racers[0])), m: String(countOf(next, this.racers[1])) });
  }

  private async check() {
    if (this.phase === 'race') { sfx.pop(3); void this.instruct(); return; }
    if (this.phase === 'ask') { sfx.pop(3); void this.ctx.say('sf.fair-first'); return; }
    if (this.pieces.some((p) => p.drag.dragging)) return;
    if (!isFair(this.wheel, this.racers)) {
      this.miss();
      const [n, m] = this.racers.map((k) => String(countOf(this.wheel, k)));
      void this.hearWrong('sf.uneven', { kind: NAME_OF[this.racers[0]], other: NAME_OF[this.racers[1]], n, m });
      return;
    }
    this.busy = true;
    this.glowing = false;
    this.syncDrags();
    sfx.sparkle();
    const set = this.setIndex;
    await this.ctx.say('sf.even-now');
    if (this.finished || set !== this.setIndex) return;
    this.toRace();
  }

  private toRace() {
    this.phase = 'race';
    this.busy = false;
    this.syncDrags();
    void this.instruct();
  }

  private async hearWrong(line: 'sf.count-wedges' | 'sf.uneven', vars: Record<string, string>) {
    const set = this.setIndex;
    await this.ctx.say(line, vars);
    if (this.finished || this.busy || set !== this.setIndex) return;
    if (this.setMisses >= 2 && !this.glowing) { this.lightHint(); await this.ctx.say('sf.help'); }
  }

  private lightHint() {
    this.glowing = true;
    if (!this.hinted) { this.hinted = true; this.hints++; }
  }

  /** The larger racer's wedges beyond three: the ones help points at. */
  get spare(): number[] {
    const to = nextGive(this.wheel, this.racers);
    if (!to) return [];
    const from = to === this.racers[0] ? this.racers[1] : this.racers[0];
    const extra = countOf(this.wheel, from) - WEDGES / 2;
    const idx = this.wheel.flatMap((k, i) => (k === from ? [i] : []));
    // The ones next to the other racer's section first.
    return (from === this.racers[0] ? idx.reverse() : idx).slice(0, extra);
  }

  /** Asked-for help: the glow on the next move (one hint per race); asked again, the ghost makes it. In the race it repeats the ask. */
  askForHint() {
    if (this.busy || this.finished || this.spinning || this.pieces.some((p) => p.drag.dragging)) return;
    if (this.phase === 'race') { void this.instruct(); return; }
    if (!this.glowing) { this.lightHint(); void this.ctx.say('sf.help'); return; }
    if (this.phase === 'ask') { this.press(isFair(this.wheel, this.racers) ? 'fair' : 'unfair'); return; }
    const to = nextGive(this.wheel, this.racers);
    if (!to) { this.press('check'); return; }
    const p = this.pieces[this.spare[0]];
    p.node.visible = false;
    this.handTo(give(this.wheel, this.racers, to)!, this.racers.indexOf(to));
  }

  private tapSpinner() {
    // A touch on a wedge reaches the spinner too; only the race's spins wiggle it, so a held wedge never jolts.
    if (this.finished || this.phase !== 'race') return;
    const node = this.art.node;
    this.ctx.tw.kill(node);
    node.rotation = 0.03;
    void this.ctx.tw.to(node, { rotation: 0 }, { duration: 0.3, ease: ease.outElastic });
    if (this.busy || this.spinning) return;
    void this.doSpin();
  }

  private async doSpin() {
    if (this.results.length >= this.plan.spins) { sfx.pop(2); void this.ctx.say('sf.no-more-spins'); return; }
    this.spinning = true;
    const set = this.setIndex;
    // The result is drawn first, honestly, from the seeded RNG; the wheel eases out onto it.
    const s = spin(this.ctx.rng);
    const from = this.art.wheel.rotation;
    this.lastWedge = wedgeAt(from);
    await this.ctx.tw.to(this.art.wheel, { rotation: stopRotation(from, s.angle, 2) }, { duration: this.results.length === 0 ? 1.8 : 1.2, ease: ease.outCubic });
    if (this.finished || set !== this.setIndex) return;
    this.spinning = false;
    const kind = this.wheel[s.wedge];
    this.results.push(kind);
    const i = this.racers.indexOf(kind);
    sfx.bell(3 + i * 3, 0.25);
    const to = this.L.racerAt(i, this.positions[i]);
    const n = this.racerNodes[i];
    this.ctx.tw.kill(n);
    void this.ctx.tw.to(n, { x: to.x, y: to.y }, { duration: 0.4, ease: ease.outBack });
    void this.ctx.say('sf.critter', { kind: NAME_OF[kind] });
    if (this.results.length >= this.plan.spins) await this.raceOver();
  }

  private async raceOver() {
    this.busy = true;
    const set = this.setIndex;
    await this.ctx.tw.wait(0.6);
    if (this.finished || set !== this.setIndex) return;
    const [a, b] = this.positions;
    sfx.tada();
    if (a === b) await this.ctx.say('sf.race-tie');
    else await this.ctx.say('sf.race-win', { kind: NAME_OF[this.racers[a > b ? 0 : 1]] });
    if (this.finished || set !== this.setIndex) return;
    await this.endSet();
  }

  private async endSet() {
    if (this.setIndex + 1 >= this.sets.length) {
      this.finished = true;
      sfx.bell(7, 0.35); sfx.bell(11, 0.3);
      await this.ctx.say('sf.done-race');
      await this.ctx.tw.wait(0.5);
      this.ctx.finish({ misses: this.misses, hints: this.hints });
      return;
    }
    await this.ctx.tw.wait(0.4);
    if (this.finished) return;
    this.setIndex++;
    this.wheel = this.set.wheels[0];
    this.results = [];
    this.phase = 'ask';
    this.setMisses = 0;
    this.hinted = false;
    this.glowing = false;
    this.dressSet();
    sfx.whoosh();
    await this.ctx.say('sf.next-race');
    if (this.finished) return;
    this.busy = false;
    void this.instruct();
  }

  // ---- shell hooks ----

  resize(view: View) {
    const L = this.L = raceLayout(view);
    this.backdrop.resize(view);
    this.art.node.position.set(L.spinner.x, L.spinner.y);
    const place = (n: Container, b: Box) => n.position.set(b.x, b.y);
    place(this.buttons.fair, L.fair); place(this.buttons.unfair, L.unfair); place(this.buttons.check, L.check);
    this.racerNodes.forEach((n, i) => { this.ctx.tw.kill(n); place(n, L.racerAt(i, this.positions[i])); });
    this.trackArt.clear();
    L.tracks.forEach((t, i) => {
      this.trackArt.roundRect(t.x - t.w / 2, t.y - t.h / 2, t.w, t.h, 30).fill({ color: 0xffffff, alpha: 0.55 }).stroke({ width: 4, color: sw(this.racers[i]).line, alpha: 0.6 });
      for (let s = 1; s <= TRACK; s++) {
        const b = L.racerAt(i, s);
        this.trackArt.circle(b.x, b.y, 10).fill({ color: sw(this.racers[i]).fill, alpha: 0.8 }).stroke({ width: 3, color: ink, alpha: 0.4 });
      }
      const f = L.racerAt(i, TRACK);
      const fx = L.portrait ? f.x + RACER / 2 - 10 : f.x, fy = L.portrait ? f.y : f.y - RACER / 2 + 10;
      this.trackArt.moveTo(fx, fy).lineTo(fx, fy - 46).stroke({ width: 5, color: ink })
        .poly([fx, fy - 46, fx + 30, fy - 37, fx, fy - 28]).fill(swatch.red.fill);
    });
  }

  update(dt: number) {
    this.clock += dt;
    if (this.rebuild) { this.rebuild = false; this.buildPieces(); }
    if (this.spinning) {
      const w = wedgeAt(this.art.wheel.rotation);
      if (w !== this.lastWedge) { this.lastWedge = w; sfx.tick(); }
    }
    const btnAlpha = (b: Button) => (b === 'check' ? (this.phase === 'even' ? 1 : 0.45) : this.phase === 'ask' ? 1 : 0.45);
    for (const b of ['fair', 'unfair', 'check'] as Button[]) this.buttons[b].alpha = btnAlpha(b);
    this.glowRing.clear();
    this.art.glow.clear();
    if (!this.glowing || this.finished || this.busy) return;
    const pulse = 7 + 3 * Math.sin(this.clock * 5);
    const ringBox = (b: Box) => this.glowRing.roundRect(b.x - b.w / 2 - pulse, b.y - b.h / 2 - pulse, b.w + 2 * pulse, b.h + 2 * pulse, 24).stroke({ width: 7, color: swatch.yellow.fill });
    if (this.phase === 'ask') { ringBox(isFair(this.wheel, this.racers) ? this.L.fair : this.L.unfair); return; }
    if (this.phase !== 'even') return;
    const to = nextGive(this.wheel, this.racers);
    if (!to) { ringBox(this.L.check); return; }
    for (const i of this.spare) {
      const a0 = ((i * WEDGE_DEG - 90) * Math.PI) / 180, a1 = (((i + 1) * WEDGE_DEG - 90) * Math.PI) / 180;
      this.art.glow.moveTo(0, 0).arc(0, 0, BIG + 4 + pulse * 0.5, a0, a1).closePath().stroke({ width: 9, color: swatch.yellow.fill, join: 'round' });
    }
    ringBox(this.L.racerAt(this.racers.indexOf(to), 0));
  }

  /** The ghost finger, answering from the picture: fair or unfair, wedges to the one with fewer, Check, then six spins. */
  autotouch(): TouchIntent | null {
    if (this.busy || this.finished || this.spinning || this.rebuild || this.pieces.some((p) => p.drag.dragging)) return null;
    if (this.phase === 'ask') return { tap: { on: this.buttons[isFair(this.wheel, this.racers) ? 'fair' : 'unfair'] }, pause: 0.8 };
    if (this.phase === 'race') return { tap: { on: this.art.node, y: -BIG / 2 }, pause: 0.3 };
    const to = nextGive(this.wheel, this.racers);
    if (!to) return { tap: { on: this.buttons.check }, pause: 0.8 };
    const p = this.pieces[this.spare[0]];
    const r = this.racerNodes[this.racers.indexOf(to)];
    const target = this.art.wheel.toLocal(r.getGlobalPosition());
    return { drag: { on: p.node }, to: { on: this.art.wheel, x: target.x, y: target.y }, lift: 0, pause: 0.7 };
  }
}
