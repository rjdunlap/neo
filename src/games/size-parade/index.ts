import { Container, Graphics, Rectangle } from 'pixi.js';
import { Critter, CRITTERS } from '../../art/critter';
import { cream, swatch } from '../../art/palette';
import { STYLES } from '../../audio/music';
import { sfx } from '../../audio/sfx';
import { draggable, type DragHandle } from '../../engine/drag';
import { onTap } from '../../engine/input';
import { Rng } from '../../engine/random';
import type { View } from '../../engine/view';
import { WigglyIcon } from '../shared';
import type { Game, GameContext, GameModule, TouchIntent } from '../types';
import { rangeFor, type BandLevels } from '../../progress/difficulty';
import {
  askRank, BIG_LITTLE_ASKS, CRITTER_H, CYCLE_SCALE, CYCLE_TAPS, cycleAt, dealSteps, dropSpot, FIT_PROPS, fitAsks, fitTry, FLAG_COLORS, type Friend, FRIEND_SCALE, FRIENDS,
  middleAsks, paradeLayout, pickRounds, propSize, type SizeAsk, sizePlan, sizeTouch, sizeWord, stepBell, stepScale, TARGET,
} from './logic';
import { fitPose, fitProp } from './props';

/** A friend at a step of the size scale: a ground shadow and the critter, both inside `body`, which hops and (at level 16) grows. */
function friend(step: number, animal: Friend, extra = 1): Container {
  const node = new Container(), body = new Container(), pet = new Critter(CRITTERS[animal]);
  pet.alive = false;
  const s = stepScale(step) * FRIEND_SCALE * extra;
  pet.scale.set(s);
  // The shadow scales with the friend, so size shows twice.
  body.addChild(new Graphics().ellipse(0, 6, 105 * s, 22 * s).fill({ color: 0x2b2b3a, alpha: 0.14 }), pet);
  node.addChild(body);
  return node;
}
const bodyOf = (node: Container): Container => node.children[0] as Container;
const friendHeight = (step: number, extra = 1): number => stepScale(step) * FRIEND_SCALE * extra * CRITTER_H;
function paradeArt(animal: Friend = 'duck'): Container {
  const c = new Container();
  for (let i = 0; i < 3; i++) { const f = friend(i * 2, animal); f.x = (i - 1) * 95; c.addChild(f); }
  return c;
}
interface Choice { rank: number; step: number; node: Container; drag?: DragHandle; placed: boolean }
class SizeParade implements Game {
  readonly plan;
  order: number[];
  /** Every size on the ground, whatever is asked for. */
  private readonly ranks: number[];
  private readonly asks: readonly SizeAsk[] | null;
  readonly choices: Choice[] = [];
  readonly slots: Container[] = [];
  /** The friends lined up so far, in line order, and their sizes: they march off together when the line is full. */
  private readonly line: { node: Container; step: number }[] = [];
  /** Friends strutting or marching off; destroyed when they leave the screen. */
  private readonly marchers: Container[] = [];
  private readonly background = new Graphics();
  private readonly ground = new Graphics();
  private readonly scenery = new Graphics();
  private readonly glow = new Graphics();
  private readonly hintsGlow = new Graphics();
  private readonly shelf = new Container();
  private readonly progress = new Graphics();
  /** Level 11: this round's prop, and the friend trying it (a copy; the row's friend stays on the ground), above the row. */
  private readonly fitLayer = new Container();
  private prop: Graphics | null = null;
  private tryNode: Container | null = null;
  private view: View;
  private animal: Friend;
  /** Which way the parade marches this round, and the flag's and bunting's colours. */
  private readonly direction: 1 | -1;
  private readonly flag: (typeof FLAG_COLORS)[number];
  private readonly bunting: (typeof FLAG_COLORS)[number];
  private step = 0;
  private rounds = 0;
  private wrong = 0;
  private misses = 0;
  private hints = 0;
  /** Level 16: taps on the one friend so far. */
  taps = 0;
  private busy = false;
  private done = false;
  private clock = 0;
  private pulse = 0;
  private lastGroundTap = -Infinity;
  private targetW: number = TARGET.w;

  constructor(private readonly ctx: GameContext) {
    this.view = ctx.view;
    this.plan = sizePlan(ctx.level);
    this.order = this.ranks = this.plan.mode === 'cycle' ? [0] : Array.from({ length: this.plan.count }, (_, i) => i);
    if (this.plan.mode !== 'cycle') this.order = this.plan.order === 'small' ? [...this.ranks] : [...this.ranks].reverse();
    this.asks = this.plan.middle ? middleAsks(ctx.rng) : this.plan.bigLittle ? BIG_LITTLE_ASKS : this.plan.mode === 'fit' ? fitAsks(ctx.rng) : null;
    this.animal = ctx.rng.pick(FRIENDS);
    this.direction = ctx.rng.chance(0.5) ? 1 : -1;
    this.flag = ctx.rng.pick(FLAG_COLORS);
    this.bunting = ctx.rng.pick(FLAG_COLORS.filter((c) => c !== this.flag));
    ctx.stage.addChild(this.background, this.ground, this.scenery, this.shelf, this.fitLayer, this.glow, this.hintsGlow, this.progress);
    // A tap on the sky or the ground is answered: every friend hops and the ask repeats. Drawings above it let taps through.
    onTap(this.background, () => this.groundTap());
    for (const g of [this.ground, this.scenery, this.shelf, this.fitLayer, this.glow, this.hintsGlow, this.progress]) g.eventMode = 'none';
    if (this.plan.mode === 'line') for (let i = 0; i < this.plan.count; i++) {
      const slot = new Container();
      slot.addChild(new Graphics().ellipse(0, 0, 66, 24).fill(swatch.white.fill).stroke({ width: 4, color: swatch.teal.line }));
      this.slots.push(slot); this.shelf.addChild(slot);
    }
    this.deal();
  }
  start() { this.instruction(); }
  private instruction() {
    const ask = this.ask();
    if (this.plan.mode === 'cycle') void this.ctx.instruct('size.cycle');
    else if (this.plan.mode === 'fit') void this.ctx.instruct('size.fit', { prop: this.propKind() });
    else if (this.plan.bigLittle) void this.ctx.instruct(ask === 'small' ? 'size.pick.little' : 'size.pick.big');
    else void this.ctx.instruct(this.plan.mode === 'line' ? 'size.line' : ask === 'middle' ? 'size.pick.middle' : 'size.pick', { size: sizeWord(this.plan, ask) });
  }
  /** The size asked for in this row: the middle in *Big, middle, little*, big or little at level 9, the fitting friend at 11, otherwise the plan's own. */
  private ask(): SizeAsk | undefined { return this.asks?.[this.rounds]; }
  /** Level 11: the prop of this row (a bed, then a chair, a bowl and a door). */
  private propKind() { return FIT_PROPS[Math.min(this.rounds, FIT_PROPS.length - 1)].kind; }
  /** Level 11: the friend of the row who fits its prop, and the prop's size for it. */
  private fitting(): Choice { return this.choices.find((c) => c.rank === this.order[0])!; }
  private propAt(): number { return propSize(this.propKind(), friendHeight(this.fitting().step)); }
  private groundTap() {
    if (this.busy || this.done) return;
    for (const c of this.choices) if (!c.placed && !c.drag?.dragging) this.hop(c.node);
    // A hand mashing the ground hops the friends every time but hears the ask once every few seconds.
    if (this.clock - this.lastGroundTap < 3) return;
    this.lastGroundTap = this.clock;
    sfx.tick(); this.instruction();
  }
  private hop(node: Container) {
    const body = bodyOf(node);
    if (!body || this.ctx.tw.busy(body)) return;
    void this.ctx.tw.to(body, { y: -26 }, { duration: 0.12 }).then(() => this.ctx.tw.to(body, { y: 0 }, { duration: 0.18 }));
  }
  /** The other friend answers a wrong tap at level 9: it wiggles and says its own size word. */
  private wiggle(node: Container) {
    const body = bodyOf(node);
    if (this.ctx.tw.busy(body)) return;
    void this.ctx.tw.to(body, { rotation: -0.14 }, { duration: 0.1 }).then(() => this.ctx.tw.to(body, { rotation: 0.14 }, { duration: 0.12 })).then(() => this.ctx.tw.to(body, { rotation: 0 }, { duration: 0.1 }));
  }
  /**
   * A friend walks across the front of the ground past the flag and off the screen in hops, then leaves; with `scale` on, each
   * landing drums (the march after a line, where the bell plays as each friend sets off).
   */
  private strut(node: Container, drum = false) {
    node.eventMode = 'none';
    this.marchers.push(node);
    const body = bodyOf(node), tw = this.ctx.tw;
    const run = async () => {
      const edge = this.direction > 0 ? this.view.w + 180 : -180, hops = 6, dx = (edge - node.x) / hops;
      for (let i = 0; i < hops; i++) {
        await Promise.all([
          tw.to(node, { x: node.x + dx }, { duration: 0.24 }),
          tw.to(body, { y: -22 }, { duration: 0.11 }).then(() => tw.to(body, { y: 0 }, { duration: 0.13 })).then(() => { if (drum) sfx.drum(0.2); }),
        ]);
      }
      this.marchers.splice(this.marchers.indexOf(node), 1);
      node.destroy({ children: true });
    };
    void run();
  }
  private deal() {
    for (const c of this.choices) { c.drag?.destroy(); this.ctx.tw.kill(c.node); this.ctx.tw.kill(c.node.scale); this.ctx.tw.kill(bodyOf(c.node)); c.node.destroy({ children: true }); }
    this.choices.length = 0;
    const ask = this.ask();
    if (ask) this.order = [askRank(ask, this.plan.count)];
    const steps = dealSteps(this.ctx.rng, this.plan, this.rounds, this.order[0]);
    const cycle = this.plan.mode === 'cycle';
    for (const rank of cycle ? [0] : this.ctx.rng.shuffle([...this.ranks])) {
      const step = cycle ? 0 : steps[rank];
      const node = friend(step, this.animal, cycle ? CYCLE_SCALE : 1);
      node.hitArea = new Rectangle(-TARGET.w / 2, -175, TARGET.w, TARGET.h);
      const choice: Choice = { rank, step, node, placed: false };
      this.ctx.stage.addChild(node);
      if (cycle) onTap(node, () => this.grow(choice));
      else if (this.plan.mode === 'pick' || this.plan.mode === 'fit') onTap(node, () => this.choose(choice));
      else choice.drag = draggable(node, this.ctx.tw, {
        onPick: () => sfx.tick(),
        onDrop: (x, y) => {
          if (this.busy || this.done || !this.slots[this.step]) return false;
          const spot = dropSpot(x, y, this.slots.map((s) => s.x), this.slots[this.step].y, this.step);
          if (spot === null) return false;
          if (spot === this.step) return this.choose(choice);
          // Another spot: not a wrong answer, the line fills from the glowing spot.
          sfx.tick(); this.pulse = 1;
          void this.ctx.say('size.spot');
          return false;
        },
      });
      this.choices.push(choice);
    }
    if (this.plan.mode === 'fit') {
      // The row's prop, sized for the friend who fits it, in the flag's colour.
      this.clearTry();
      this.prop?.destroy();
      this.prop = fitProp(this.propKind(), this.propAt(), this.flag);
      this.fitLayer.addChild(this.prop);
    }
    this.resize(this.view);
  }
  private clearTry() {
    const t = this.tryNode;
    if (!t) return;
    this.tryNode = null;
    this.ctx.tw.kill(t); this.ctx.tw.kill(bodyOf(t)); this.ctx.tw.kill(bodyOf(t).scale);
    t.destroy({ children: true });
  }
  /**
   * Level 11: a copy of the tapped friend hops up to the prop and tries it, in the pose the prop asks for. The one who fits settles
   * there until the next row; one too big lands with a thump, hanging over the end, and goes back; one too little sinks out of sight.
   */
  private tryProp(choice: Choice, result: ReturnType<typeof fitTry>) {
    this.clearTry();
    const kind = this.propKind(), size = this.propAt(), height = friendHeight(choice.step);
    const copy = friend(choice.step, this.animal), body = bodyOf(copy);
    body.children[0].visible = false;
    const pose = fitPose(kind, size, height);
    const tw = this.ctx.tw;
    copy.position.set(choice.node.x - this.fitLayer.x, choice.node.y - this.fitLayer.y);
    // A friend sits inside the bowl, behind its front, so one too little really disappears into it; the others try in front.
    if (kind === 'bowl') this.fitLayer.addChildAt(copy, 0); else this.fitLayer.addChild(copy);
    this.tryNode = copy;
    const run = async () => {
      await Promise.all([
        tw.to(copy, { x: pose.x, y: pose.y, rotation: pose.rotation }, { duration: 0.32 }),
        tw.to(body.scale, { x: pose.sx, y: pose.sy }, { duration: 0.32 }),
      ]);
      if (copy.destroyed) return;
      if (result === 'fits') return;
      if (result === 'big') {
        // A thump: the prop is too small under it.
        await tw.to(body.scale, { x: pose.sx * 1.1, y: pose.sy * 0.86 }, { duration: 0.1 });
        if (copy.destroyed) return;
        await tw.to(body.scale, { x: pose.sx, y: pose.sy }, { duration: 0.14 });
        if (copy.destroyed) return;
        await tw.wait(0.7);
        if (copy.destroyed) return;
        await tw.to(copy, { alpha: 0 }, { duration: 0.25 });
      } else {
        await tw.to(copy, { y: pose.y + size * 0.25, alpha: 0 }, { duration: 0.6 });
      }
      if (!copy.destroyed && this.tryNode === copy) this.clearTry();
    };
    void run();
  }
  /** Level 16: every tap makes the one friend a size bigger, then smaller, with its word; three cycles end the round. */
  private grow(choice: Choice) {
    if (this.busy || this.done) return;
    this.taps++;
    const { step, word } = cycleAt(this.taps);
    choice.step = step;
    const body = bodyOf(choice.node), s = stepScale(step) / stepScale(0);
    this.ctx.tw.kill(body.scale);
    void this.ctx.tw.to(body.scale, { x: s * 1.08, y: s * 0.94 }, { duration: 0.14 }).then(() => this.ctx.tw.to(body.scale, { x: s, y: s }, { duration: 0.16 }));
    if (word === 'bigger' || word === 'biggest') sfx.drum(); else sfx.squeak(word === 'littlest' ? 10 : 8);
    if (word) void this.ctx.say(`size.cycle.${word}`);
    this.resize(this.view);
    if (this.taps >= CYCLE_TAPS) this.finish();
  }
  private choose(choice: Choice): boolean {
    if (this.busy || this.done || choice.placed) return false;
    const ask = this.ask();
    if (choice.rank !== this.order[this.step]) {
      this.wrong++; sfx.boing();
      if (this.plan.mode === 'fit') {
        // The try is the consequence: the friend goes up and hangs over the end or vanishes into the prop.
        this.misses++;
        const result = fitTry(choice.rank, this.order[0]);
        this.tryProp(choice, result);
        void this.ctx.say(result === 'big' ? 'size.fit.big' : 'size.fit.little', { prop: this.propKind() });
      } else if (this.plan.bigLittle) {
        // The other friend answers too, with its own word. On the lap the first such touch in a question is free; the second glows the asked friend and counts a hint.
        this.wiggle(choice.node);
        void this.ctx.say(ask === 'small' ? 'size.other.big' : 'size.other.little');
        if (this.ctx.band !== 'lap') this.misses++;
      } else {
        this.misses++;
        void this.ctx.say(ask === 'middle' ? 'size.wrong.middle' : this.plan.mode === 'pick' ? 'size.wrong.pick' : 'size.wrong', { size: sizeWord(this.plan, ask) });
      }
      if (this.wrong === 2) { this.hints++; void this.ctx.say('size.hint'); }
      this.drawGlow(); return false;
    }
    if (this.plan.bigLittle) { if (ask === 'small') sfx.squeak(); else sfx.drum(); } else sfx.bell(stepBell(choice.step), 0.3);
    this.ctx.pet.cheer();
    this.wrong = 0;
    if (this.plan.mode === 'line') {
      choice.placed = true; choice.drag!.enabled = false; choice.node.visible = false;
      const copy = friend(choice.step, this.animal); copy.scale.set(0.8);
      this.slots[this.step].addChild(copy);
      this.line.push({ node: copy, step: choice.step });
      this.step++;
      if (this.step === this.order.length) this.finish();
      else void this.ctx.say('size.next');
    } else if (this.plan.mode === 'fit') {
      // Just right: the friend settles in the prop until the next prop is dealt.
      this.busy = true;
      this.tryProp(choice, 'fits');
      choice.node.visible = false;
      void this.ctx.say('size.fit.yes');
      this.rounds++;
      if (this.rounds === pickRounds(this.plan)) this.finish();
      else void this.ctx.tw.wait(1.4).then(() => { this.deal(); this.busy = false; this.instruction(); });
    } else {
      this.rounds++; this.busy = true;
      // The right friend struts off past the flag while the next row is dealt.
      this.choices.splice(this.choices.indexOf(choice), 1);
      this.strut(choice.node);
      if (this.rounds === pickRounds(this.plan)) this.finish();
      else void this.ctx.tw.wait(0.9).then(() => { this.deal(); this.busy = false; this.instruction(); });
    }
    this.drawGlow(); return true;
  }
  /** The finished line marches off in order, each friend setting off a beat after the last with its bell, so the line sounds like a scale. */
  private march() {
    this.line.forEach(({ node, step }, i) => {
      // A copy sits at its slot's origin, and the shelf is at the stage's: the slot's position is the copy's on the stage.
      const slot = node.parent;
      if (slot) { slot.removeChild(node); node.position.set(slot.x, slot.y); }
      this.ctx.stage.addChild(node);
      void this.ctx.tw.wait(0.18 * i).then(() => { sfx.bell(stepBell(step), 0.3); this.strut(node, true); });
    });
    this.line.length = 0;
  }
  private finish() {
    this.done = true; this.busy = true;
    void this.ctx.say(this.plan.mode === 'cycle' ? 'size.cycle.done' : this.plan.mode === 'fit' ? 'size.fit.done' : 'size.done');
    if (this.plan.mode === 'line') this.march();
    this.drawGlow();
    // The last marcher sets off at 0.72 s and hops for about 1.5 s; a strutting friend is off within 1.5 s.
    void this.ctx.tw.wait(this.plan.mode === 'line' ? 2.4 : 1.5).then(() => this.ctx.finish({ misses: this.misses, hints: this.hints }));
  }
  resize(v: View) {
    this.view = v;
    this.background.clear().rect(0, 0, v.w, v.h).fill(swatch.blue.light).rect(0, v.h * 0.5, v.w, v.h * 0.5).fill(swatch.green.light);
    const top = v.h - 265;
    this.ground.clear().roundRect(165, top, v.w - 210, 230, 45).fill(cream);
    // A flag on a pole where the parade heads, and bunting along the back of the ground, in this round's colours.
    const flag = swatch[this.flag], bunting = swatch[this.bunting], pole = this.direction > 0 ? v.w - 100 : 225;
    const sc = this.scenery.clear();
    sc.moveTo(pole, top + 12).lineTo(pole, top - 180).stroke({ width: 8, color: swatch.brown.line, cap: 'round' });
    sc.moveTo(pole, top - 180).lineTo(pole + this.direction * 92, top - 152).lineTo(pole, top - 124).closePath().fill(flag.fill).stroke({ width: 4, color: flag.line, join: 'round' });
    sc.circle(pole, top - 186, 9).fill(swatch.yellow.fill).stroke({ width: 3, color: swatch.yellow.line });
    const left = 205, right = v.w - 80, sag = 22;
    sc.moveTo(left, top - 60).quadraticCurveTo((left + right) / 2, top - 60 + sag * 2, right, top - 60).stroke({ width: 4, color: swatch.brown.line });
    for (let x = left + 35, i = 0; x < right - 20; x += 70, i++) {
      const t = (x - left) / (right - left), y = top - 60 + 2 * sag * 2 * t * (1 - t) + 2, c = i % 2 ? bunting : flag;
      sc.moveTo(x - 20, y).lineTo(x + 20, y).lineTo(x, y + 34).closePath().fill(c.fill).stroke({ width: 3, color: c.line, join: 'round' });
    }
    const layout = paradeLayout(this.choices.length, this.slots.length, v.w, this.plan.bigLittle ? 420 : 175);
    const xs = layout.friends;
    this.targetW = layout.targetW;
    this.choices.forEach((c, i) => {
      const p = { x: xs[i], y: v.h - 90 };
      if (c.drag) c.drag.home = p;
      if (this.plan.mode === 'cycle') {
        // The one friend's target grows with it and never shrinks below a row friend's.
        const h = friendHeight(c.step, CYCLE_SCALE), w = Math.max(TARGET.w, h * 0.9), th = Math.max(TARGET.h, h + 20);
        c.node.hitArea = new Rectangle(-w / 2, -th + 15, w, th);
      } else c.node.hitArea = new Rectangle(-this.targetW / 2, -175, this.targetW, TARGET.h);
      if (!c.drag?.dragging) { this.ctx.tw.kill(c.node); c.node.position.set(p.x, p.y); }
    });
    const spots = layout.spots;
    this.slots.forEach((s, i) => s.position.set(spots[i], v.h * 0.44));
    // The prop stands above the row, clear of the tallest friend's head.
    this.fitLayer.position.set(v.w / 2, v.h - 330);
    const g = this.progress.clear();
    if (this.plan.mode === 'cycle') {
      // One circle per cycle of growing and shrinking, filled as each finishes.
      for (let i = 0; i < 3; i++) g.circle(v.w / 2 + (i - 1) * 40, 125, 11).fill(i < Math.floor(this.taps / 4) ? swatch.teal.fill : swatch.white.fill);
    } else if (this.plan.mode === 'pick' || this.plan.mode === 'fit') {
      // A visual size cue reinforces the spoken comparison without identifying an answer's position.
      const n = pickRounds(this.plan);
      for (let i = 0; i < n; i++) g.circle(v.w / 2 + (i - (n - 1) / 2) * 40, 125, 11).fill(i < this.rounds ? swatch.teal.fill : swatch.white.fill);
      const ask = this.ask();
      if (this.plan.mode === 'fit') {
        // The prop is the cue.
      } else if (this.plan.bigLittle) {
        // Two circles, the asked one ringed.
        [22, 50].forEach((r, i) => g.circle(v.w / 2 + (i - 0.5) * 130, 290, r).fill(swatch.teal.fill).stroke({ width: 4, color: swatch.teal.line }));
        const i = ask === 'small' ? 0 : 1;
        g.circle(v.w / 2 + (i - 0.5) * 130, 290, [22, 50][i] + 12).stroke({ width: 7, color: swatch.yellow.line });
      } else if (ask) {
        // Three circles, the asked one ringed: the middle one has a bigger and a smaller beside it.
        [22, 36, 50].forEach((r, i) => g.circle(v.w / 2 + (i - 1) * 120, 290, r).fill(swatch.teal.fill).stroke({ width: 4, color: swatch.teal.line }));
        g.circle(v.w / 2 + (askRank(ask) - 1) * 120, 290, [22, 36, 50][askRank(ask)] + 12).stroke({ width: 7, color: swatch.yellow.line });
      } else {
        const big = this.plan.order === 'big';
        g.circle(v.w / 2 - 65, 290, big ? 24 : 50).circle(v.w / 2 + 65, 290, big ? 50 : 24).fill(swatch.teal.fill).stroke({ width: 4, color: swatch.teal.line });
        g.moveTo(v.w / 2 - 10, 290).lineTo(v.w / 2 + 15, 290).lineTo(v.w / 2 + 4, 278).moveTo(v.w / 2 + 15, 290).lineTo(v.w / 2 + 4, 302).stroke({ width: 6, color: swatch.teal.line });
      }
    } else {
      for (let i = 0; i < this.slots.length - 1; i++) {
        const x = (spots[i] + spots[i + 1]) / 2, y = v.h * 0.44;
        g.moveTo(x - 8, y - 10).lineTo(x + 4, y).lineTo(x - 8, y + 10).stroke({ width: 4, color: swatch.teal.line });
      }
    }
    this.drawGlow();
  }
  private drawGlow() {
    this.glow.clear(); this.hintsGlow.clear();
    if (this.done) return;
    if (this.plan.mode === 'line') { const p = this.slots[this.step]; this.glow.ellipse(p.x, p.y, 74, 34).stroke({ width: 7, color: swatch.yellow.line }); }
    if (this.wrong >= 2) { const c = this.choices.find((c) => c.rank === this.order[this.step])!, w = this.targetW + 6; this.hintsGlow.roundRect((c.drag?.home.x ?? c.node.x) - w / 2, (c.drag?.home.y ?? c.node.y) - 180, w, 200, 24).stroke({ width: 7, color: swatch.yellow.line }); }
  }
  /** The ghost finger: tap the biggest or smallest friend, carry the next friend in size to its place in the line, or (level 16) tap the one friend. */
  autotouch(): TouchIntent | null {
    if (this.busy || this.done) return null;
    if (this.plan.mode === 'cycle') { const c = this.choices[0]; return c ? { tap: { on: c.node, y: -friendHeight(c.step, CYCLE_SCALE) / 2 } } : null; }
    const i = sizeTouch(this.order, this.step, this.choices);
    if (i === null) return null;
    // A friend's body is the middle of its tap area; its feet are the origin.
    const body = { on: this.choices[i].node, y: -80 };
    return this.plan.mode === 'line' ? { drag: body, to: { on: this.slots[this.step] } } : { tap: body };
  }
  update(dt: number) {
    this.clock += dt; this.glow.alpha = this.hintsGlow.alpha = 0.7 + 0.3 * Math.sin(this.clock * 3);
    // The glowing spot swells once when a friend is put on another spot.
    this.pulse = Math.max(0, this.pulse - dt * 1.5);
    const p = this.slots[this.step];
    if (p) { this.glow.pivot.set(p.x, p.y); this.glow.position.set(p.x, p.y); this.glow.scale.set(1 + 0.3 * Math.sin(Math.PI * this.pulse)); }
  }
  destroy() {
    this.clearTry();
    this.choices.forEach((c) => { c.drag?.destroy(); this.ctx.tw.kill(bodyOf(c.node)); this.ctx.tw.kill(bodyOf(c.node).scale); });
    this.marchers.forEach((m) => { this.ctx.tw.kill(m); this.ctx.tw.kill(bodyOf(m)); });
  }
}
const LEVELS: BandLevels = {
  lap: { min: 9, max: 16, order: [16, 9] },
  toddler: { min: 1, max: 17, order: [9, 1, 2, 3, 4, 17] },
  preschool: { min: 3, max: 17, order: [3, 4, 17, 10, 5, 6, 11] },
  prek: { min: 5, max: 11, order: [5, 6, 11, 7, 8] },
  school: { min: 7, max: 8 },
};
export const sizeParade: GameModule = {
  id: 'size-parade', name: 'Size Parade', titleLine: 'game.size-parade', region: 'puzzle-peaks',
  skills: ['comparison', 'measurement', 'ordering'], bands: ['lap', 'toddler', 'preschool', 'prek', 'school'],
  levels: (b) => rangeFor(LEVELS, b),
  // Levels 16, 9, 17, 10 and 11 have high IDs and sit in the order where they fit; 16 is the lap's one growing friend, 9 its big-or-little pair, 17 the first drag a toddler meets, 11 the props after the lines of three.
  entryLevels: [9, 16, 17],
  describeLevel: (l) => sizePlan(l).name,
  music: STYLES.hub, coplayHint: 'Use your hands to show {name} small and big, then compare the friends.',
  offScreen: 'Line up three spoons or shoes from smallest to biggest, then reverse the line.',
  hubIcon: () => new WigglyIcon(paradeArt()), touchDemo: true, sticker: (seed) => paradeArt(new Rng(seed).pick(FRIENDS)), create: (ctx) => new SizeParade(ctx),
};
