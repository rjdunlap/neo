import { Container, Graphics, Rectangle } from 'pixi.js';
import { Critter, CRITTERS } from '../../art/critter';
import { cream, swatch, type Swatch } from '../../art/palette';
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
  askRank, BIG_LITTLE_ASKS, BOOT_COLORS, CRITTER_H, CYCLE_SCALE, CYCLE_TAPS, cycleAt, dealSteps, dropSpot, FIT_PROPS, fitAsks, fitTry, FLAG_COLORS, type Friend, FRIEND_SCALE, FRIENDS,
  gapMids, HIDDEN_LINES, hiddenStart, isSorted, mixedPair, pairTest, SWEEP_START, sweepAfter, sweepNext, type Sweep, type InsertAsk, insertAsks, insertGap, insertGapFor, insertLayout, insertLine, insertWhy, middleAsks, paradeLayout, pickRounds, propSize, SHADE_COLORS, SHADE_STEP,
  shades, type SizeAsk, sizePlan, sizeTouch, sizeWord, stepBell, stepScale, TARGET,
} from './logic';
import { fitPose, fitProp } from './props';

/** A friend at a step of the size scale (in one of five shades at level 15): a ground shadow and the critter, both inside `body`, which hops and (at level 16) grows. */
function friend(step: number, animal: Friend, extra = 1, shade?: Swatch): Container {
  const node = new Container(), body = new Container(), pet = new Critter(shade ? { ...CRITTERS[animal], shade } : CRITTERS[animal]);
  pet.alive = false;
  const s = stepScale(step) * FRIEND_SCALE * extra;
  pet.scale.set(s);
  // The shadow scales with the friend, so size shows twice.
  body.addChild(new Graphics().ellipse(0, 6, 105 * s, 22 * s).fill({ color: 0x2b2b3a, alpha: 0.14 }), pet);
  node.addChild(body);
  return node;
}
const bodyOf = (node: Container): Container => node.children[0] as Container;
/** Level 13: a friend behind the fence shows only its boots, one size for everyone; its shadow and body wait for the gate. */
function booted(node: Container, color: (typeof BOOT_COLORS)[number]) {
  const body = bodyOf(node), c = swatch[color];
  for (const child of body.children) child.visible = false;
  const boots = new Graphics();
  for (const side of [-1, 1]) {
    const x = side * 22;
    boots.roundRect(x - 11, -40, 22, 32, 6).fill(c.fill).stroke({ width: 3, color: c.line });
    boots.roundRect(x - 11 + side * 3 - (side < 0 ? 8 : 0), -16, 30, 16, 8).fill(c.fill).stroke({ width: 3, color: c.line });
  }
  body.addChild(boots);
}
/** Level 13: the fence comes down and the friends stand revealed, still in their boots. */
const unbooted = (node: Container) => { for (const child of bodyOf(node).children) child.visible = true; };
const friendHeight = (step: number, extra = 1): number => stepScale(step) * FRIEND_SCALE * extra * CRITTER_H;
function paradeArt(animal: Friend = 'duck'): Container {
  const c = new Container();
  for (let i = 0; i < 3; i++) { const f = friend(i * 2, animal); f.x = (i - 1) * 95; c.addChild(f); }
  return c;
}
interface Choice { rank: number; step: number; node: Container; drag?: DragHandle; placed: boolean; shade?: Swatch }
class SizeParade implements Game {
  readonly plan;
  order: number[];
  /** Every size on the ground, whatever is asked for. */
  private readonly ranks: number[];
  private readonly asks: readonly SizeAsk[] | null;
  readonly choices: Choice[] = [];
  readonly slots: Container[] = [];
  /** The friends lined up so far, in line order, and their bells: they march off together when the line is full. */
  private readonly line: { node: Container; bell: number }[] = [];
  /** Level 12: this round's four questions, the four friends already in the line, and the gap opened under the carried newcomer. */
  private readonly inserts: InsertAsk[] | null;
  readonly lineUp: Choice[] = [];
  openGap: number | null = null;
  /** Level 13: the friends' ranks in place order behind the fence, the place tapped first of a pair, and the ghost finger's sweep. */
  hidden: number[] | null = null;
  picked: number | null = null;
  sweep: Sweep = SWEEP_START;
  private readonly fence = new Graphics();
  private readonly gate = new Container();
  /** Level 15: the round's five shades, darkest first, and how many lines are done (darkest first, then lightest first; at 13, four friends then five). */
  private readonly shadeSet: Swatch[] | null;
  lines = 0;
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
  private lastOut = -Infinity;
  /** Level 13: what a pair test means is said once a line, then the swap or the wiggle speaks for itself. */
  private readonly said = new Set<'stay' | 'swap'>();
  private targetW: number = TARGET.w;

  constructor(private readonly ctx: GameContext) {
    this.view = ctx.view;
    this.plan = sizePlan(ctx.level);
    this.order = this.ranks = this.plan.mode === 'cycle' ? [0] : Array.from({ length: this.plan.count }, (_, i) => i);
    if (this.plan.mode !== 'cycle') this.order = this.plan.order === 'small' ? [...this.ranks] : [...this.ranks].reverse();
    this.asks = this.plan.middle ? middleAsks(ctx.rng) : this.plan.bigLittle ? BIG_LITTLE_ASKS : this.plan.mode === 'fit' ? fitAsks(ctx.rng) : null;
    this.inserts = this.plan.mode === 'insert' ? insertAsks(ctx.rng) : null;
    this.shadeSet = this.plan.shade ? shades(ctx.rng.pick(SHADE_COLORS)) : null;
    this.animal = ctx.rng.pick(FRIENDS);
    this.direction = ctx.rng.chance(0.5) ? 1 : -1;
    this.flag = ctx.rng.pick(FLAG_COLORS);
    this.bunting = ctx.rng.pick(FLAG_COLORS.filter((c) => c !== this.flag));
    ctx.stage.addChild(this.background, this.ground, this.scenery, this.fence, this.shelf, this.fitLayer, this.glow, this.hintsGlow, this.progress);
    // A tap on the sky or the ground is answered: every friend hops and the ask repeats. Drawings above it let taps through.
    onTap(this.background, () => this.groundTap());
    if (this.plan.mode === 'hidden') {
      // The gate: a picture of a little gate on a card, tapped when she thinks the line is in order.
      const card = new Graphics().roundRect(-75, -60, 150, 120, 24).fill(swatch.white.fill).stroke({ width: 5, color: swatch.brown.line });
      card.rect(-46, -34, 10, 70).rect(36, -34, 10, 70).fill(swatch.brown.fill);
      for (const x of [-26, -10, 6, 22]) card.roundRect(x - 1, -24, 12, 54, 4).fill(swatch.orange.light).stroke({ width: 2, color: swatch.brown.line });
      card.rect(-36, -12, 72, 8).rect(-36, 14, 72, 8).fill(swatch.brown.fill).circle(0, 1, 6).fill(swatch.yellow.fill).stroke({ width: 2, color: swatch.yellow.line });
      this.gate.addChild(card);
      this.gate.hitArea = new Rectangle(-75, -60, 150, 120);
      onTap(this.gate, () => this.openGate());
      ctx.stage.addChild(this.gate);
    }
    for (const g of [this.ground, this.scenery, this.fence, this.shelf, this.fitLayer, this.glow, this.hintsGlow, this.progress]) g.eventMode = 'none';
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
    else if (this.plan.mode === 'insert') void this.ctx.instruct('size.insert');
    else if (this.plan.mode === 'hidden') void this.ctx.instruct(this.lines === 0 ? 'size.hidden' : 'size.hidden.five');
    else if (this.plan.shade) void this.ctx.instruct(this.lines === 0 ? 'size.shade.dark' : 'size.shade.light');
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
    for (const c of [...this.choices, ...this.lineUp]) if ((!c.placed || this.plan.mode === 'insert') && !c.drag?.dragging) this.hop(c.node);
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
    if (this.plan.mode === 'insert') { this.dealInsert(); return; }
    if (this.plan.mode === 'hidden') { this.dealHidden(); return; }
    const ask = this.ask();
    if (ask) this.order = [askRank(ask, this.plan.count)];
    const steps = dealSteps(this.ctx.rng, this.plan, this.rounds, this.order[0]);
    const cycle = this.plan.mode === 'cycle';
    for (const rank of cycle ? [0] : this.ctx.rng.shuffle([...this.ranks])) {
      const step = cycle ? 0 : this.shadeSet ? SHADE_STEP : steps[rank], shade = this.shadeSet?.[rank];
      const node = friend(step, this.animal, cycle ? CYCLE_SCALE : 1, shade);
      node.hitArea = new Rectangle(-TARGET.w / 2, -175, TARGET.w, TARGET.h);
      const choice: Choice = { rank, step, node, placed: false, shade };
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
  /** Level 12: the line of four (the newcomer's rank left out) on the ground, and the newcomer walking in from the side. */
  private dealInsert() {
    for (const c of this.lineUp) { this.ctx.tw.kill(c.node); this.ctx.tw.kill(bodyOf(c.node)); c.node.destroy({ children: true }); }
    this.lineUp.length = 0;
    const ask = this.inserts![this.rounds];
    this.order = [ask.rank]; this.step = 0; this.openGap = null;
    for (const rank of insertLine(ask)) {
      // The five steps are the five ranks; a friend already in the line hops when touched, which is never a miss.
      const node = friend(rank, this.animal), c: Choice = { rank, step: rank, node, placed: true };
      onTap(node, () => { if (!this.busy && !this.done) { this.hop(node); sfx.tick(); } });
      this.ctx.stage.addChild(node); this.lineUp.push(c);
    }
    const node = friend(ask.rank, this.animal), choice: Choice = { rank: ask.rank, step: ask.rank, node, placed: false };
    choice.drag = draggable(node, this.ctx.tw, {
      onPick: () => sfx.tick(),
      onMove: (x, y) => this.openAt(this.busy || this.done ? null : insertGap(x, y, insertLayout(this.view.w, null).rest, this.lineY())),
      onDrop: (x, y) => this.insertDrop(choice, x, y),
    });
    this.ctx.stage.addChild(node); this.choices.push(choice);
    this.resize(this.view);
    // The newcomer walks in from the side the parade comes from.
    const home = choice.drag.home;
    node.x = this.direction > 0 ? -150 : this.view.w + 150;
    void this.ctx.tw.to(node, { x: home.x }, { duration: 0.7 });
  }
  /** Level 13: four (then five) friends behind the fence in a seeded order at least two swaps from sorted, each in its own boots. */
  private dealHidden() {
    const count = HIDDEN_LINES[this.lines], line = hiddenStart(this.ctx.rng, count), colors = this.ctx.rng.shuffle([...BOOT_COLORS]);
    this.hidden = line; this.picked = null; this.sweep = SWEEP_START; this.wrong = 0;
    line.forEach((rank, i) => {
      const step = Math.round(4 * rank / (count - 1)), node = friend(step, this.animal), c: Choice = { rank, step, node, placed: false };
      booted(node, colors[i]);
      onTap(node, () => this.pickFriend(c));
      this.ctx.stage.addChild(node); this.choices.push(c);
    });
    this.ctx.tw.kill(this.fence); this.fence.alpha = 1; this.fence.y = 0;
    this.resize(this.view);
  }
  /** Level 13: the first tap of a pair holds a friend; tapping it again lets go; a second friend runs the test. Never a miss. */
  private pickFriend(c: Choice) {
    if (this.busy || this.done || !this.hidden) return;
    const i = this.choices.indexOf(c);
    this.hop(c.node); sfx.tick();
    if (this.picked === null) this.picked = i;
    else if (this.picked === i) this.picked = null;
    else this.testPair(this.picked, i);
    this.drawGlow();
  }
  /** Level 13: the two friends swap places only if the left one is the bigger; otherwise they wiggle where they stand. */
  private testPair(a: number, b: number) {
    const [l, r] = a < b ? [a, b] : [b, a], { line, swapped } = pairTest(this.hidden!, l, r);
    const want = sweepNext(this.sweep);
    // The ghost finger's sweep follows its own pair; any other pair starts its sweep again from the left.
    this.sweep = want !== 'gate' && want[0] === l && want[1] === r ? sweepAfter(this.sweep, line.length, swapped) : SWEEP_START;
    this.picked = null; this.hidden = line;
    const left = this.choices[l], right = this.choices[r];
    if (!swapped) {
      this.wiggle(left.node); this.wiggle(right.node); sfx.pop(9);
      if (!this.said.has('stay')) { this.said.add('stay'); void this.ctx.say('size.hidden.stay'); }
      return;
    }
    this.choices[l] = right; this.choices[r] = left;
    sfx.whoosh();
    if (!this.said.has('swap')) { this.said.add('swap'); void this.ctx.say('size.hidden.swap'); }
    this.busy = true;
    const tw = this.ctx.tw, lx = left.node.x, rx = right.node.x;
    const hopTo = (node: Container, x: number) => Promise.all([
      tw.to(node, { x }, { duration: 0.4 }),
      tw.to(bodyOf(node), { y: -40 }, { duration: 0.2 }).then(() => tw.to(bodyOf(node), { y: 0 }, { duration: 0.2 })),
    ]);
    void Promise.all([hopTo(left.node, rx), hopTo(right.node, lx)]).then(() => { if (this.done) return; this.busy = false; this.drawGlow(); });
  }
  /**
   * Level 13: the gate opens only on a line littlest first. Then the fence comes down, the friends stand revealed and march off
   * in order; a mixed-up line keeps the gate shut (a miss), and a second shut gate wiggles the first mixed-up neighbours (a hint).
   */
  private openGate() {
    if (this.busy || this.done || !this.hidden) return;
    this.picked = null;
    const tw = this.ctx.tw;
    if (!isSorted(this.hidden)) {
      this.wrong++; this.misses++; sfx.boing();
      void tw.to(this.gate, { rotation: -0.1 }, { duration: 0.08 }).then(() => tw.to(this.gate, { rotation: 0.1 }, { duration: 0.1 })).then(() => tw.to(this.gate, { rotation: 0 }, { duration: 0.08 }));
      void this.ctx.say('size.hidden.wrong');
      if (this.wrong === 2) this.hints++;
      if (this.wrong >= 2) {
        const i = mixedPair(this.hidden)!;
        this.wiggle(this.choices[i].node); this.wiggle(this.choices[i + 1].node);
        void this.ctx.say('size.hidden.hint');
      }
      this.drawGlow(); return;
    }
    this.busy = true; this.wrong = 0; this.lines++; this.ctx.pet.cheer(); sfx.tada();
    void tw.to(this.fence, { y: 260, alpha: 0 }, { duration: 0.45 });
    const line = [...this.choices];
    this.choices.length = 0;
    line.forEach((c) => unbooted(c.node));
    this.hidden = null; this.drawGlow();
    void tw.wait(0.9).then(() => line.forEach((c, i) => void tw.wait(0.18 * i).then(() => { sfx.bell(stepBell(c.step), 0.3); this.strut(c.node, true); })));
    if (this.lines === HIDDEN_LINES.length) this.finish();
    else {
      void this.ctx.say('size.hidden.yes');
      void tw.wait(3).then(() => { this.said.clear(); this.deal(); this.busy = false; this.instruction(); });
    }
  }
  private lineY() { return this.view.h - 90; }
  /** Level 12: the friends of the line slide apart to open `gap` under the carried newcomer, or close up again. */
  private openAt(gap: number | null) {
    if (gap === this.openGap) return;
    this.openGap = gap;
    const xs = insertLayout(this.view.w, gap).xs;
    this.lineUp.forEach((c, i) => { this.ctx.tw.kill(c.node); void this.ctx.tw.to(c.node, { x: xs[i] }, { duration: 0.18 }); });
  }
  /**
   * Level 12: a drop beside the line is the gap nearest it. The right gap takes the newcomer and the whole line marches; a wrong
   * one sends it back with the reason, said of the friend beside the gap that shows it; a drop away from the line goes home.
   */
  private insertDrop(choice: Choice, x: number, y: number): boolean {
    const gap = this.busy || this.done ? null : insertGap(x, y, insertLayout(this.view.w, null).rest, this.lineY());
    if (gap === null) {
      this.openAt(null);
      if (!this.busy && !this.done) {
        sfx.tick();
        // Fiddling with the newcomer is answered every time but hears the reminder once every few seconds.
        if (this.clock - this.lastOut >= 3) { this.lastOut = this.clock; void this.ctx.say('size.insert.out'); }
      }
      return false;
    }
    const ask = this.inserts![this.rounds], why = insertWhy(ask, gap);
    if (why) {
      this.openAt(null);
      this.wrong++; this.misses++; sfx.boing();
      void this.ctx.tw.wait(0.45).then(() => this.wiggle(choice.node));
      this.hop(this.lineUp[why.friend].node);
      void this.ctx.say(`size.insert.${why.cmp}.${why.side}`);
      if (this.wrong === 2) { this.hints++; void this.ctx.say('size.insert.hint'); }
      this.drawGlow(); return false;
    }
    this.wrong = 0; sfx.bell(stepBell(choice.step), 0.3); this.ctx.pet.cheer();
    choice.placed = true; choice.drag!.enabled = false;
    this.rounds++; this.busy = true;
    this.openAt(gap);
    const five = insertLayout(this.view.w, gap).five, y0 = this.lineY();
    void this.ctx.tw.to(choice.node, { x: five[gap], y: y0 }, { duration: 0.25 });
    // The full line of five marches off in order, a bell for each, the next question dealt behind it.
    const line = [...this.lineUp];
    line.splice(gap, 0, choice);
    choice.drag!.destroy(); choice.drag = undefined;
    this.lineUp.length = 0; this.choices.length = 0;
    void this.ctx.tw.wait(0.5).then(() => line.forEach((c, i) => void this.ctx.tw.wait(0.18 * i).then(() => { sfx.bell(stepBell(c.step), 0.3); this.strut(c.node, true); })));
    if (this.rounds === this.inserts!.length) this.finish();
    else {
      void this.ctx.say('size.insert.yes');
      void this.ctx.tw.wait(2.2).then(() => { this.deal(); this.busy = false; this.instruction(); });
    }
    this.drawGlow(); return true;
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
        if (this.shadeSet) void this.ctx.say(this.lines === 0 ? 'size.shade.wrong.dark' : 'size.shade.wrong.light');
        else void this.ctx.say(ask === 'middle' ? 'size.wrong.middle' : this.plan.mode === 'pick' ? 'size.wrong.pick' : 'size.wrong', { size: sizeWord(this.plan, ask) });
      }
      if (this.wrong === 2) { this.hints++; void this.ctx.say('size.hint'); }
      this.drawGlow(); return false;
    }
    const bell = stepBell(this.shadeSet ? choice.rank : choice.step);
    if (this.plan.bigLittle) { if (ask === 'small') sfx.squeak(); else sfx.drum(); } else sfx.bell(bell, 0.3);
    this.ctx.pet.cheer();
    this.wrong = 0;
    if (this.plan.mode === 'line') {
      choice.placed = true; choice.drag!.enabled = false; choice.node.visible = false;
      const copy = friend(choice.step, this.animal, 1, choice.shade); copy.scale.set(0.8);
      this.slots[this.step].addChild(copy);
      this.line.push({ node: copy, bell });
      this.step++;
      if (this.step < this.order.length) void this.ctx.say('size.next');
      else if (this.shadeSet && this.lines === 0) {
        // Darkest first is done: it marches off, and the same five come back to line up lightest first.
        this.lines++; this.busy = true;
        void this.ctx.say('size.shade.yes');
        this.march();
        void this.ctx.tw.wait(2.4).then(() => { this.step = 0; this.order = [...this.order].reverse(); this.deal(); this.busy = false; this.instruction(); });
      } else this.finish();
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
    this.line.forEach(({ node, bell }, i) => {
      // A copy sits at its slot's origin, and the shelf is at the stage's: the slot's position is the copy's on the stage.
      const slot = node.parent;
      if (slot) { slot.removeChild(node); node.position.set(slot.x, slot.y); }
      this.ctx.stage.addChild(node);
      void this.ctx.tw.wait(0.18 * i).then(() => { sfx.bell(bell, 0.3); this.strut(node, true); });
    });
    this.line.length = 0;
  }
  private finish() {
    this.done = true; this.busy = true;
    void this.ctx.say(this.plan.mode === 'cycle' ? 'size.cycle.done' : this.plan.mode === 'fit' ? 'size.fit.done' : 'size.done');
    if (this.plan.mode === 'line') this.march();
    this.drawGlow();
    // The last marcher sets off at 0.72 s and hops for about 1.5 s; a strutting friend is off within 1.5 s.
    void this.ctx.tw.wait(this.plan.mode === 'line' || this.plan.mode === 'insert' ? 2.4 : this.plan.mode === 'hidden' ? 3.2 : 1.5).then(() => this.ctx.finish({ misses: this.misses, hints: this.hints }));
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
    const insert = this.plan.mode === 'insert';
    this.choices.forEach((c, i) => {
      // Level 12's newcomer waits above the line, clear of the tallest friend's head.
      const p = insert ? { x: v.w / 2, y: v.h - 330 } : { x: xs[i], y: v.h - 90 };
      if (c.drag) c.drag.home = p;
      if (this.plan.mode === 'cycle') {
        // The one friend's target grows with it and never shrinks below a row friend's.
        const h = friendHeight(c.step, CYCLE_SCALE), w = Math.max(TARGET.w, h * 0.9), th = Math.max(TARGET.h, h + 20);
        c.node.hitArea = new Rectangle(-w / 2, -th + 15, w, th);
      } else c.node.hitArea = new Rectangle(-this.targetW / 2, -175, this.targetW, TARGET.h);
      if (!c.drag?.dragging && !(insert && c.placed)) { this.ctx.tw.kill(c.node); c.node.position.set(p.x, p.y); }
    });
    if (insert) {
      const at = insertLayout(v.w, this.openGap).xs;
      this.lineUp.forEach((c, i) => { this.ctx.tw.kill(c.node); c.node.position.set(at[i], this.lineY()); c.node.hitArea = new Rectangle(-TARGET.w / 2, -175, TARGET.w, TARGET.h); });
    }
    const fence = this.fence.clear();
    if (this.plan.mode === 'hidden' && xs.length) {
      // A picket fence as tall as the biggest friend hides them all; only the boots show under its bottom rail.
      const x0 = xs[0] - 95, x1 = xs[xs.length - 1] + 95, y1 = v.h - 128, y0 = y1 - 200;
      for (let x = x0; x < x1 - 10; x += 34) fence.moveTo(x, y1).lineTo(x, y0 + 14).lineTo(x + 14, y0).lineTo(x + 28, y0 + 14).lineTo(x + 28, y1).closePath();
      fence.fill(swatch.orange.light).stroke({ width: 3, color: swatch.brown.line, join: 'round' });
      fence.rect(x0 - 6, y0 + 40, x1 - x0 + 12, 16).rect(x0 - 6, y1 - 46, x1 - x0 + 12, 16).fill(swatch.brown.fill).stroke({ width: 3, color: swatch.brown.line });
    }
    this.gate.position.set(v.w / 2, v.h - 400);
    const spots = layout.spots;
    this.slots.forEach((s, i) => s.position.set(spots[i], v.h * 0.44));
    // The prop stands above the row, clear of the tallest friend's head.
    this.fitLayer.position.set(v.w / 2, v.h - 330);
    const g = this.progress.clear();
    if (this.plan.mode === 'cycle') {
      // One circle per cycle of growing and shrinking, filled as each finishes.
      for (let i = 0; i < 3; i++) g.circle(v.w / 2 + (i - 1) * 40, 125, 11).fill(i < Math.floor(this.taps / 4) ? swatch.teal.fill : swatch.white.fill);
    } else if (this.plan.mode === 'hidden') {
      // One circle per line (four friends, then five), and a little circle then a big one with an arrow: littlest first.
      for (let i = 0; i < HIDDEN_LINES.length; i++) g.circle(v.w / 2 + (i - 0.5) * 40, 125, 11).fill(i < this.lines ? swatch.teal.fill : swatch.white.fill);
      g.circle(v.w / 2 - 60, 205, 18).circle(v.w / 2 + 60, 205, 36).fill(swatch.teal.fill).stroke({ width: 4, color: swatch.teal.line });
      g.moveTo(v.w / 2 - 22, 205).lineTo(v.w / 2 + 6, 205).lineTo(v.w / 2 - 6, 193).moveTo(v.w / 2 + 6, 205).lineTo(v.w / 2 - 6, 217).stroke({ width: 6, color: swatch.teal.line });
    } else if (insert) {
      // One circle per question; the line itself shows its order.
      for (let i = 0; i < 4; i++) g.circle(v.w / 2 + (i - 1.5) * 40, 125, 11).fill(i < this.rounds ? swatch.teal.fill : swatch.white.fill);
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
      if (this.shadeSet) {
        // The shade strip: five swatches from the first in the line to the last, an arrow after them.
        const strip = this.lines === 0 ? this.shadeSet : [...this.shadeSet].reverse();
        strip.forEach((c, i) => g.roundRect(v.w / 2 + (i - 2.5) * 52, 128, 44, 44, 10).fill(c.fill).stroke({ width: 3, color: c.line }));
        const ax = v.w / 2 + 2.5 * 52 + 6;
        g.moveTo(ax, 150).lineTo(ax + 30, 150).lineTo(ax + 18, 138).moveTo(ax + 30, 150).lineTo(ax + 18, 162).stroke({ width: 6, color: swatch.teal.line });
      }
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
    if (this.plan.mode === 'line') { const p = this.slots[this.step]; if (p) this.glow.ellipse(p.x, p.y, 74, 34).stroke({ width: 7, color: swatch.yellow.line }); }
    if (this.plan.mode === 'hidden') {
      // The friend held for a pair test is ringed in teal; after two shut gates the first mixed-up neighbours glow.
      const ring = (c: Choice, g: Graphics, color: number) => g.roundRect(c.node.x - this.targetW / 2, c.node.y - 180, this.targetW, 200, 24).stroke({ width: 7, color });
      if (this.picked !== null && this.choices[this.picked]) ring(this.choices[this.picked], this.glow, swatch.teal.line);
      const pair = this.hidden && this.wrong >= 2 && !this.busy ? mixedPair(this.hidden) : null;
      if (pair !== null) for (const c of [this.choices[pair], this.choices[pair + 1]]) ring(c, this.hintsGlow, swatch.yellow.line);
      return;
    }
    if (this.plan.mode === 'insert') {
      // After two wrong gaps the right one glows on the ground, between the friends it belongs between.
      const ask = this.inserts![this.rounds];
      if (this.wrong >= 2 && ask) { const x = gapMids(insertLayout(this.view.w, null).rest)[insertGapFor(ask)]; this.hintsGlow.ellipse(x, this.lineY() + 4, 46, 22).stroke({ width: 7, color: swatch.yellow.line }).moveTo(x, this.lineY() - 30).lineTo(x, this.lineY() - 170).stroke({ width: 7, color: swatch.yellow.line, cap: 'round' }); }
      return;
    }
    if (this.wrong >= 2) { const c = this.choices.find((c) => c.rank === this.order[this.step])!, w = this.targetW + 6; this.hintsGlow.roundRect((c.drag?.home.x ?? c.node.x) - w / 2, (c.drag?.home.y ?? c.node.y) - 180, w, 200, 24).stroke({ width: 7, color: swatch.yellow.line }); }
  }
  /** The ghost finger: tap the biggest or smallest friend, carry the next friend in size to its place in the line, or (level 16) tap the one friend. */
  autotouch(): TouchIntent | null {
    if (this.busy || this.done) return null;
    if (this.plan.mode === 'cycle') { const c = this.choices[0]; return c ? { tap: { on: c.node, y: -friendHeight(c.step, CYCLE_SCALE) / 2 } } : null; }
    if (this.plan.mode === 'hidden') {
      // Test neighbours left to right as the sweep says, never looking behind the fence; a held friend off the sweep is let go first.
      const next = sweepNext(this.sweep), body = (i: number) => ({ tap: { on: this.choices[i].node, y: -100 } });
      if (next === 'gate') return { tap: { on: this.gate } };
      if (this.picked === null) return body(next[0]);
      return this.picked === next[0] ? body(next[1]) : body(this.picked);
    }
    if (this.plan.mode === 'insert') {
      const c = this.choices[0], ask = this.inserts![this.rounds];
      if (!c || c.placed || !ask) return null;
      return { drag: { on: c.node, y: -80 }, to: { on: this.ground, x: gapMids(insertLayout(this.view.w, null).rest)[insertGapFor(ask)], y: this.lineY() } };
    }
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
    this.ctx.tw.kill(this.fence); this.ctx.tw.kill(this.gate);
    this.choices.forEach((c) => { c.drag?.destroy(); this.ctx.tw.kill(bodyOf(c.node)); this.ctx.tw.kill(bodyOf(c.node).scale); });
    this.lineUp.forEach((c) => { this.ctx.tw.kill(c.node); this.ctx.tw.kill(bodyOf(c.node)); });
    this.marchers.forEach((m) => { this.ctx.tw.kill(m); this.ctx.tw.kill(bodyOf(m)); });
  }
}
const LEVELS: BandLevels = {
  lap: { min: 9, max: 16, order: [16, 9] },
  toddler: { min: 1, max: 17, order: [9, 1, 2, 3, 4, 17] },
  preschool: { min: 3, max: 17, order: [3, 4, 17, 10, 5, 6, 11] },
  prek: { min: 5, max: 15, order: [5, 6, 11, 7, 8, 12, 15] },
  school: { min: 7, max: 15, order: [7, 8, 12, 13, 15] },
};
export const sizeParade: GameModule = {
  id: 'size-parade', name: 'Size Parade', titleLine: 'game.size-parade', region: 'puzzle-peaks',
  skills: ['comparison', 'measurement', 'ordering'], bands: ['lap', 'toddler', 'preschool', 'prek', 'school'],
  levels: (b) => rangeFor(LEVELS, b),
  // Levels 16, 9, 17, 10, 11, 12, 13 and 15 have high IDs and sit in the order where they fit; 16 is the lap's one growing friend, 9 its big-or-little pair, 17 the first drag a toddler meets, 11 the props after the lines of three, 12, 13 and 15 the lines after the lines of five.
  entryLevels: [9, 16, 17],
  describeLevel: (l) => sizePlan(l).name,
  music: STYLES.hub, coplayHint: 'Use your hands to show {name} small and big, then compare the friends.',
  offScreen: 'Line up three spoons or shoes from smallest to biggest, then reverse the line.',
  hubIcon: () => new WigglyIcon(paradeArt()), touchDemo: true, sticker: (seed) => paradeArt(new Rng(seed).pick(FRIENDS)), create: (ctx) => new SizeParade(ctx),
};
