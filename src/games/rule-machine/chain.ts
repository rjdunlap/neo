/**
 * Rule Machine level 6, *Two machines*: two small machines stand in a row, each wearing one card. For each of a
 * round's two pairs one car goes through by itself, she says on the pads what the next car will come out as, then
 * the cards drop to a shelf of four and she builds a pair that turns the watched car into a wanted one: the watched
 * pair the other way round (any pair that makes it is accepted). Rules and accounting: `logic.ts`; definition:
 * docs/definitions/rule-machine-5-6.md.
 */
import { Container, Graphics, Rectangle } from 'pixi.js';
import { cream, grass, ink, swatch } from '../../art/palette';
import { Backdrop } from '../../art/scenery';
import { sfx } from '../../audio/sfx';
import { draggable, type DragHandle } from '../../engine/drag';
import { onTap } from '../../engine/input';
import { ease } from '../../engine/tween';
import type { View } from '../../engine/view';
import type { Game, GameContext, TouchIntent } from '../types';
import { arrow, car, card, counters, numeral, pairMachine, ruleCard, type PairArt } from './art';
import {
  CAR_W,
  CARD_H,
  CARD_W,
  PAD,
  PAIR_HOPPER,
  SLOT,
  Score,
  apply,
  chain,
  chainOptions,
  fitting,
  layout,
  makeChainRound,
  nextCard,
  pairCounted,
  planFor,
  sameRule,
  type Box,
  type CardMove,
  type ChainPair,
  type Layout,
  type NumRule,
  type Plan,
  type Row,
} from './logic';

type Phase = 'watch' | 'predict' | 'build' | 'run' | 'between' | 'done';

type Vars = Record<string, number>;

/** A card's spoken name. */
function nameOf(r: NumRule): {
  id: 'rm.card.twice' | 'rm.card.three' | 'rm.card.take' | 'rm.card.plus';
  vars: Vars;
} {
  if (r.a === 2) return { id: 'rm.card.twice', vars: {} };
  if (r.a === 3) return { id: 'rm.card.three', vars: {} };
  return r.b < 0 ? { id: 'rm.card.take', vars: {} } : { id: 'rm.card.plus', vars: { n: r.b } };
}

/** What a card made of the car, as one spoken step ("Twice as many makes six."). */
function stepOf(
  r: NumRule,
  made: number,
): { id: `rm.chain.step.${'twice' | 'three' | 'take' | 'plus'}`; vars: Vars } {
  if (r.a === 2) return { id: 'rm.chain.step.twice', vars: { n: made } };
  if (r.a === 3) return { id: 'rm.chain.step.three', vars: { n: made } };
  return r.b < 0
    ? { id: 'rm.chain.step.take', vars: { n: made } }
    : { id: 'rm.chain.step.plus', vars: { b: r.b, n: made } };
}

/** How far above the wanted car a pair's other output lands, so both show. */
const STACK = 84;
/** The car standing on the link is a little smaller than the cars at the ends. */
const LINK_CAR = 92;

export class ChainGame implements Game {
  readonly plan: Plan;
  readonly pairs: ChainPair[];
  readonly score = new Score();
  index = 0;
  phase: Phase = 'watch';
  /** The table's rows for this pair: the watched car, the predicted car, then each pair she ran. */
  rows: Row[] = [];
  /** The build: the shelf card (by index) hanging in each slot. */
  slots: [number | null, number | null] = [null, null];
  /** Pairs run for this target so far (the first is free). */
  runs = 0;
  /** The predicted car stands on the link after a counted wrong pad. */
  held = false;
  finished = false;
  private readonly reduce =
    typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
  private layoutNow: Layout;
  private clock = 0;
  private idle = 0;
  private readonly backdrop: Backdrop;
  private readonly art: PairArt;
  private readonly tableLayer = new Container();
  private readonly cardLayer = new Container();
  private readonly padLayer = new Container();
  private readonly actors = new Container();
  private readonly glowRing = new Graphics();
  readonly hopperHit = new Container();
  /** The two cards hanging while she watches and predicts (taps speak them). */
  private hung: Container[] = [];
  /** The build's four shelf cards, by shelf index. */
  cardNodes: Container[] = [];
  private drags: DragHandle[] = [];
  padNodes: Container[] = [];
  private waiting: Container | null = null;
  private linkCar: Container | null = null;
  private output: Container | null = null;
  private outStacked = false;
  private wantedNode: Container | null = null;
  private wantedRing: Graphics | null = null;
  private chosen: number | null = null;
  private reveal: number | null = null;
  /** Where the card in hand was when it was touched. */
  private picked = { x: 0, y: 0 };

  constructor(private readonly ctx: GameContext) {
    this.plan = planFor(ctx.level);
    this.pairs = makeChainRound(ctx.rng);
    this.backdrop = new Backdrop(
      {
        sky: [cream, swatch.blue.light],
        hills: [grass, swatch.green.light],
        horizon: 0.3,
        clouds: 2,
        sun: true,
        seed: 211,
      },
      ctx.view,
    );
    this.art = pairMachine();
    this.glowRing.eventMode = 'none';
    this.actors.eventMode = 'none';
    this.hopperHit.hitArea = new Rectangle(-PAIR_HOPPER / 2, -PAIR_HOPPER / 2, PAIR_HOPPER, PAIR_HOPPER);
    onTap(this.hopperHit, () => this.tapHopper());
    this.layoutNow = layout(ctx.view, this.plan.level);
    ctx.stage.addChild(
      this.backdrop,
      this.tableLayer,
      this.art.node,
      this.cardLayer,
      this.padLayer,
      this.actors,
      this.hopperHit,
      this.glowRing,
    );
    this.dressPair();
  }

  get pair(): ChainPair {
    return this.pairs[this.index];
  }
  get busy(): boolean {
    return this.phase === 'run' || this.phase === 'between' || this.phase === 'done';
  }
  /** The open prediction's pads and which is right. */
  get options() {
    return chainOptions(this.pair);
  }
  /** The build's helpful move: a placed card to lift, or the shelf card for the next empty slot. */
  get next(): CardMove | null {
    const p = this.pair;
    return this.phase === 'build' ? nextCard(p.shelf, this.slots, p.n, p.target, p.reversed) : null;
  }

  /** What a scripted play reads. */
  get state() {
    const p = this.pair;
    const o = this.options;
    return {
      level: this.plan.level,
      machine: this.index,
      phase: this.phase,
      first: p.first,
      second: p.second,
      n: p.n,
      m: p.m,
      watched: p.watched,
      target: p.target,
      shelf: p.shelf.slice(),
      reversed: p.reversed.slice(),
      slots: this.slots.slice(),
      runs: this.runs,
      held: this.held,
      fitting: fitting(p.shelf, p.n, p.target),
      next: this.next,
      options: this.phase === 'predict' ? o.values : [],
      right: this.phase === 'predict' ? o.right : -1,
      rows: this.rows.slice(),
      misses: this.score.misses,
      hints: this.score.hints,
      glowing: this.score.glowing,
      finished: this.finished,
    };
  }

  start() {
    void this.ctx.instruct('rm.instruct.6');
  }

  destroy() {
    this.finished = true;
    for (const d of this.drags) d.destroy();
    this.drags = [];
    for (const b of this.art.bodies) this.ctx.tw.kill(b.scale);
    for (const c of [
      ...this.cardNodes,
      ...this.padNodes,
      ...this.hung,
      this.waiting,
      this.linkCar,
      this.output,
      this.wantedNode,
    ])
      if (c && !c.destroyed) {
        this.ctx.tw.kill(c);
        this.ctx.tw.kill(c.scale);
      }
  }

  /** True once this pair is no longer the one on screen (or the game has ended): an awaited step must stop. */
  private stale(index: number) {
    return this.finished || index !== this.index;
  }

  private t(seconds: number) {
    return this.reduce ? seconds / 2 : seconds;
  }

  // ---- a pair arrives ----

  private dressPair() {
    this.rows = [];
    this.slots = [null, null];
    this.runs = 0;
    this.held = false;
    this.chosen = null;
    this.reveal = null;
    this.score.newMachine();
    this.clearPads();
    this.clearCards();
    this.clearWanted();
    for (const c of [this.waiting, this.linkCar, this.output]) if (c) this.drop(c);
    this.waiting = this.linkCar = this.output = null;
    // Both cards hang from the start; a touch speaks one.
    const p = this.pair;
    this.hung = [p.first, p.second].map((rule) => {
      const node = ruleCard(rule);
      node.hitArea = new Rectangle(-SLOT / 2, -SLOT / 2, SLOT, SLOT);
      onTap(node, () => {
        const name = nameOf(rule);
        void this.ctx.say(name.id, name.vars);
      });
      this.cardLayer.addChild(node);
      return node;
    });
    this.phase = 'watch';
    this.idle = 0;
    this.bringCar(p.n);
    this.drawTable();
    this.resize(this.ctx.view);
  }

  /** A car rolls up to the hopper's mouth and waits there. */
  private bringCar(n: number) {
    const node = car(n, CAR_W - 10);
    const at = this.layoutNow.waitAt;
    node.position.set(at.x - 120, at.y);
    node.alpha = 0;
    this.actors.addChild(node);
    this.waiting = node;
    void this.ctx.tw.to(node, { x: at.x, alpha: 1 }, { duration: this.t(0.4), ease: ease.outQuad });
  }

  private drop(c: Container) {
    if (c.destroyed) return;
    this.ctx.tw.kill(c);
    this.ctx.tw.kill(c.scale);
    c.destroy({ children: true });
  }

  private clearPads() {
    for (const p of this.padNodes) this.drop(p);
    this.padNodes = [];
  }

  private clearCards() {
    for (const d of this.drags) d.destroy();
    this.drags = [];
    for (const c of [...this.cardNodes, ...this.hung]) this.drop(c);
    this.cardNodes = [];
    this.hung = [];
  }

  private clearWanted() {
    if (this.wantedNode) this.drop(this.wantedNode);
    this.wantedNode = null;
    this.wantedRing = null;
  }

  /** The table: the newest rows, and while she builds, the outlined wanted column after them. */
  private drawTable() {
    this.tableLayer.removeChildren().forEach((c) => c.destroy({ children: true }));
    const building = !!this.wantedNode;
    const shown = this.rows.slice(-(building ? 4 : 5));
    const column = (input: number, out: number, edge: number, i: number) => {
      const node = new Container();
      node.addChild(card(86, 146, edge));
      const a = car(input, 70),
        b = car(out, 70),
        down = arrow(26);
      a.position.set(0, -20);
      down.position.set(0, -4);
      b.position.set(0, 56);
      node.addChild(a, down, b);
      const box = this.layoutNow.columns[i];
      node.position.set(box.x, box.y);
      this.tableLayer.addChild(node);
    };
    shown.forEach((r, i) => column(r.in, r.out, swatch.teal.line, i));
    if (building) column(this.pair.n, this.pair.target, swatch.yellow.line, shown.length);
  }

  // ---- the pair runs ----

  /** One body chugs: a squash and a bell, the second machine's a pentatonic step above the first's. */
  private async chug(which: 0 | 1, index: number) {
    const body = this.art.bodies[which];
    sfx.bell(3 + which + this.rows.length, 0.25);
    this.ctx.tw.kill(body.scale);
    for (let k = 0; k < 2; k++) {
      body.scale.set(1.05, 0.95);
      await this.ctx.tw.to(body.scale, { x: 1, y: 1 }, { duration: this.t(0.18), ease: ease.outQuad });
      if (this.stale(index)) return;
    }
  }

  /** The waiting car drops into the hopper, the first machine runs, and the car stands on the link with its middle count. */
  private async toLink(first: NumRule, n: number, lead: boolean): Promise<boolean> {
    const index = this.index;
    const l = this.layoutNow;
    const w = this.waiting;
    this.waiting = null;
    if (this.output) this.rollAway();
    if (w) {
      this.ctx.tw.kill(w);
      await this.ctx.tw.to(
        w,
        { x: l.hopper.x, y: l.hopper.y + 30, alpha: 0 },
        { duration: this.t(0.3), ease: ease.inQuad },
      );
      if (this.stale(index)) return false;
      this.drop(w);
    }
    const said = lead ? this.ctx.say('rm.chain.went-in', { n }) : Promise.resolve();
    await this.chug(0, index);
    if (this.stale(index)) return false;
    const mid = apply(first, n);
    const node = car(mid, LINK_CAR);
    node.position.set(this.layoutNow.link!.x, this.layoutNow.link!.y);
    node.scale.set(0.6);
    this.actors.addChild(node);
    this.linkCar = node;
    sfx.pop(5);
    void this.ctx.tw.to(node.scale, { x: 1, y: 1 }, { duration: this.t(0.24), ease: ease.outBack });
    await said;
    if (this.stale(index)) return false;
    const step = stepOf(first, mid);
    await this.ctx.say(step.id, step.vars);
    return !this.stale(index);
  }

  /** The car on the link goes into the second machine and its output lands at the chute's end. */
  private async fromLink(second: NumRule, mid: number, stacked = false): Promise<boolean> {
    const index = this.index;
    // The middle pause holds at 0.4 seconds, reduced motion or not.
    await this.ctx.tw.wait(0.4);
    if (this.stale(index)) return false;
    const c = this.linkCar;
    this.linkCar = null;
    if (c) {
      this.ctx.tw.kill(c);
      this.ctx.tw.kill(c.scale);
      await this.ctx.tw.to(c, { x: c.x + 50, alpha: 0 }, { duration: this.t(0.25), ease: ease.inQuad });
      if (this.stale(index)) return false;
      this.drop(c);
    }
    await this.chug(1, index);
    if (this.stale(index)) return false;
    const out = apply(second, mid);
    const l = this.layoutNow;
    const node = car(out, CAR_W - 10);
    this.outStacked = stacked;
    node.position.set(l.out.x, l.out.y - (stacked ? STACK : 0));
    node.scale.set(0.6);
    this.actors.addChild(node);
    this.output = node;
    sfx.pop(6);
    this.ctx.particles.burst(l.out.x, l.out.y - 40, {
      kind: 'dot',
      colors: [swatch.yellow.fill, 0xffffff],
      count: 10,
      speed: [60, 160],
      gravity: 300,
      life: [0.25, 0.5],
    });
    void this.ctx.tw.to(node.scale, { x: 1, y: 1 }, { duration: this.t(0.24), ease: ease.outBack });
    const step = stepOf(second, out);
    await this.ctx.say(step.id, step.vars);
    return !this.stale(index);
  }

  /** The output at the chute rolls off to the siding. */
  private rollAway() {
    const o = this.output;
    if (!o) return;
    this.output = null;
    this.ctx.tw.kill(o);
    this.ctx.tw.kill(o.scale);
    void this.ctx.tw.to(o, { x: o.x + 80, alpha: 0 }, { duration: 0.3 }).then(() => this.drop(o));
  }

  private addRow(input: number, out: number) {
    this.rows.push({ in: input, out });
    this.drawTable();
  }

  // ---- watching ----

  private tapHopper() {
    if (this.finished || this.phase !== 'watch' || !this.waiting) return;
    this.waiting.scale.y *= 0.9;
    void this.runWatched();
  }

  private async runWatched() {
    const index = this.index;
    const p = this.pair;
    this.phase = 'run';
    if (!(await this.toLink(p.first, p.n, true))) return;
    if (!(await this.fromLink(p.second, chain(p.first, p.second, p.n).mid))) return;
    this.addRow(p.n, p.watched);
    await this.ctx.tw.wait(0.5);
    if (this.stale(index)) return;
    this.openPrediction();
  }

  // ---- predicting ----

  private openPrediction() {
    const p = this.pair;
    this.rollAway();
    this.bringCar(p.m);
    this.phase = 'predict';
    this.held = false;
    this.chosen = null;
    this.score.newAsk();
    this.clearPads();
    this.options.values.forEach((v, i) => {
      const node = new Container();
      node.addChild(card(PAD, PAD, swatch.yellow.line));
      const t = numeral(v, 52);
      t.position.set(0, -18);
      const dots = counters(v, 7);
      dots.position.set(0, 34);
      node.addChild(t, dots);
      node.hitArea = new Rectangle(-PAD / 2, -PAD / 2, PAD, PAD);
      onTap(node, () => this.tapPad(i));
      this.padNodes.push(node);
      this.padLayer.addChild(node);
    });
    this.placePads();
    void this.ctx.say('rm.chain.goes-in', { n: p.m });
  }

  private tapPad(i: number) {
    if (this.finished || this.phase !== 'predict') return;
    const node = this.padNodes[i];
    this.ctx.tw.kill(node.scale);
    node.scale.set(0.92);
    void this.ctx.tw.to(node.scale, { x: 1, y: 1 }, { duration: 0.25, ease: ease.outBack });
    this.idle = 0;
    const outcome = this.score.answer(i === this.options.right, true);
    if (outcome === 'right') {
      sfx.sparkle();
      this.chosen = i;
      void this.runPredicted();
      return;
    }
    sfx.boing();
    void this.hearWrongPad(outcome === 'glow');
  }

  /** A counted wrong pad: the car runs the first machine and stops on the link; the pads stay. */
  private async hearWrongPad(glow: boolean) {
    const index = this.index;
    const p = this.pair;
    this.phase = 'run';
    const mid = chain(p.first, p.second, p.m).mid;
    if (!this.held) {
      if (!(await this.toLink(p.first, p.m, false))) return;
      this.held = true;
    } else {
      const step = stepOf(p.first, mid);
      await this.ctx.say(step.id, step.vars);
      if (this.stale(index)) return;
    }
    this.phase = 'predict';
    const name = nameOf(p.second);
    await this.ctx.say(name.id, name.vars);
    if (this.stale(index) || this.phase !== 'predict') return;
    if (glow) await this.ctx.say('rm.help');
  }

  private async runPredicted() {
    const index = this.index;
    const p = this.pair;
    this.phase = 'run';
    const c = chain(p.first, p.second, p.m);
    if (!this.held && !(await this.toLink(p.first, p.m, false))) return;
    this.held = false;
    if (!(await this.fromLink(p.second, c.mid))) return;
    this.addRow(p.m, c.out);
    this.reveal = this.options.right;
    await this.ctx.tw.wait(0.9);
    if (this.stale(index)) return;
    this.reveal = null;
    this.clearPads();
    this.openBuild();
  }

  // ---- building ----

  /** The cards drop to a shelf of four, the watched car comes back, and the wanted car stands outlined at the chute. */
  private openBuild() {
    const p = this.pair;
    const l = this.layoutNow;
    this.rollAway();
    const from = [p.first, p.second].map((r) => p.shelf.findIndex((c) => sameRule(c, r)));
    this.clearCards();
    this.slots = [null, null];
    this.runs = 0;
    this.score.newAsk();
    p.shelf.forEach((rule, i) => {
      const node = ruleCard(rule);
      node.hitArea = new Rectangle(-CARD_W / 2, -CARD_H / 2, CARD_W, CARD_H);
      const home = l.shelf[i];
      const slot = from.indexOf(i);
      // The pair's own cards fall from their slots; the other two pop in on the shelf.
      if (slot >= 0) node.position.set(l.slots[slot].x, l.slots[slot].y);
      else {
        node.position.set(home.x, home.y);
        node.scale.set(0.6);
        void this.ctx.tw.to(node.scale, { x: 1, y: 1 }, { duration: 0.3, ease: ease.outBack });
      }
      const drag = draggable(node, this.ctx.tw, {
        onPick: () => {
          sfx.tick();
          this.picked = { x: node.x, y: node.y };
        },
        onDrop: (x, y) => this.dropCard(i, x, y),
      });
      drag.home = { x: home.x, y: home.y };
      if (slot >= 0) void drag.floatHome();
      this.drags.push(drag);
      this.cardNodes.push(node);
      this.cardLayer.addChild(node);
    });
    sfx.whoosh();
    const node = new Container();
    const ring = new Graphics()
      .roundRect(-CAR_W / 2 - 4, -104, CAR_W + 8, 116, 22)
      .stroke({ width: 7, color: swatch.yellow.fill });
    node.addChild(ring, car(p.target, CAR_W - 10));
    node.position.set(l.out.x, l.out.y);
    node.scale.set(0.6);
    void this.ctx.tw.to(node.scale, { x: 1, y: 1 }, { duration: 0.3, ease: ease.outBack });
    this.actors.addChild(node);
    this.wantedNode = node;
    this.wantedRing = ring;
    this.bringCar(p.n);
    this.drawTable();
    this.phase = 'build';
    void this.ctx.say('rm.chain.build', { n: p.n, m: p.watched, k: p.target });
  }

  /** Where a shelf card rests now: its slot, or its place on the shelf. */
  private homeOf(i: number): Box {
    const slot = this.slots.indexOf(i);
    return slot >= 0 ? this.layoutNow.slots[slot] : this.layoutNow.shelf[i];
  }

  /** A card let go: a tap hops it to the first empty slot or back to the shelf; a drag lands on the slot it is released near. */
  private dropCard(i: number, x: number, y: number): boolean {
    if (this.finished || this.phase !== 'build') return false;
    const at = this.slots.indexOf(i);
    // A tap is judged from where the card was touched, so one caught mid-hop still counts as a tap. A held card rides
    // 40 units above the finger once it moves at all, so a slow or wobbly press lands that much higher: still a tap.
    const dx = x - this.picked.x,
      dy = y - this.picked.y;
    if (Math.abs(dx) < 24 && dy < 24 && dy > -64)
      return at >= 0 ? this.liftCard(at as 0 | 1) : this.placeCard(i);
    const near = ([0, 1] as const)
      .map((s) => ({ s, d: Math.hypot(x - this.layoutNow.slots[s].x, y - this.layoutNow.slots[s].y) }))
      .filter((c) => c.d <= 120)
      .sort((a, b) => a.d - b.d)[0];
    if (!near || near.s === at) return false;
    // It swaps with the card already there (which takes this one's slot, or goes back to the shelf).
    const other = this.slots[near.s];
    if (at >= 0) this.slots[at] = other;
    this.slots[near.s] = i;
    this.settle();
    return true;
  }

  private placeCard(i: number, into?: 0 | 1): boolean {
    const slot = into !== undefined && this.slots[into] === null ? into : this.slots.indexOf(null);
    if (slot < 0) return false;
    this.slots[slot] = i;
    this.settle();
    return true;
  }

  private liftCard(slot: 0 | 1): boolean {
    this.slots[slot] = null;
    this.settle();
    return true;
  }

  /** Cards hop to where they now belong; a full pair runs after a short beat. */
  private settle() {
    sfx.tick();
    this.cardNodes.forEach((node, i) => {
      const home = this.homeOf(i);
      this.drags[i].home = { x: home.x, y: home.y };
      if (this.drags[i].dragging) return;
      this.ctx.tw.kill(node);
      void this.ctx.tw.to(node, { x: home.x, y: home.y }, { duration: 0.2, ease: ease.outBack });
    });
    if (this.slots[0] !== null && this.slots[1] !== null) void this.runBuilt();
  }

  private async runBuilt() {
    const index = this.index;
    const p = this.pair;
    this.phase = 'run';
    for (const d of this.drags) d.enabled = false;
    const [i, j] = this.slots as [number, number];
    const first = p.shelf[i],
      second = p.shelf[j];
    const c = chain(first, second, p.n);
    const right = fitting(p.shelf, p.n, p.target).some((f) => f[0] === i && f[1] === j);
    const watchedOrder = sameRule(first, p.first) && sameRule(second, p.second);
    const outcome = this.score.answer(right, pairCounted(this.runs));
    this.runs++;
    await this.ctx.tw.wait(0.4);
    if (this.stale(index)) return;
    if (!(await this.toLink(first, p.n, false))) return;
    if (!(await this.fromLink(second, c.mid, !right))) return;
    this.addRow(p.n, c.out);
    if (right) {
      // The output has rolled onto the wanted car: the outline goes, and it chimes.
      this.clearWanted();
      this.drawTable();
      sfx.sparkle();
      sfx.bell(9, 0.3);
      await this.ctx.tw.wait(0.8);
      if (this.stale(index)) return;
      await this.endPair();
      return;
    }
    sfx.boing();
    await this.ctx.say('rm.chain.want', { k: p.target });
    if (this.stale(index)) return;
    this.rollAway();
    this.bringCar(p.n);
    for (const slot of [0, 1] as const) this.wiggle(this.cardNodes[this.slots[slot]!]);
    for (const d of this.drags) d.enabled = true;
    this.phase = 'build';
    if (watchedOrder) await this.ctx.say('rm.chain.other-way');
    if (this.stale(index) || this.phase !== 'build') return;
    if (outcome === 'glow') await this.ctx.say('rm.help');
  }

  private wiggle(node: Container) {
    const x = node.x;
    this.ctx.tw.kill(node);
    void this.ctx.tw
      .to(node, { x: x + 8 }, { duration: 0.08 })
      .then(() =>
        node.destroyed ? undefined : this.ctx.tw.to(node, { x }, { duration: 0.12, ease: ease.outBack }),
      );
  }

  private async endPair() {
    this.phase = 'between';
    const index = this.index;
    if (this.index + 1 >= this.pairs.length) {
      this.phase = 'done';
      this.finished = true;
      sfx.bell(7, 0.35);
      sfx.bell(11, 0.3);
      await this.ctx.say('rm.done');
      await this.ctx.tw.wait(0.4);
      this.ctx.finish({ misses: this.score.misses, hints: this.score.hints });
      return;
    }
    await this.ctx.tw.wait(0.4);
    if (this.stale(index)) return;
    this.index++;
    sfx.whoosh();
    this.dressPair();
    await this.ctx.say('rm.new-machine');
  }

  // ---- help ----

  readonly hintLabel = 'Show me';

  /** The box the glow rings: the right pad, a placed card to lift, or the shelf card for the next empty slot. */
  private get helpBox(): Box | null {
    if (this.finished || this.busy) return null;
    if (this.phase === 'predict') return this.layoutNow.pads[this.options.right];
    const mv = this.next;
    if (!mv) return null;
    return mv.kind === 'lift' ? this.layoutNow.slots[mv.slot] : this.layoutNow.shelf[mv.card];
  }

  /** Asked-for help: the glow (one hint per pair); asked again, the ghost makes that one move. While watching it repeats the ask. */
  askForHint() {
    if (this.finished || this.busy) return;
    if (this.phase === 'watch' || !this.helpBox) {
      void this.ctx.instruct('rm.instruct.6');
      return;
    }
    if (this.score.showMe()) {
      void this.ctx.say('rm.help');
      return;
    }
    if (this.phase === 'predict') {
      this.tapPad(this.options.right);
      return;
    }
    const mv = this.next!;
    if (mv.kind === 'lift') this.liftCard(mv.slot);
    else this.placeCard(mv.card, mv.slot);
  }

  // ---- shell hooks ----

  private placePads() {
    this.padNodes.forEach((p, i) => {
      const b = this.layoutNow.pads[i];
      p.position.set(b.x, b.y);
    });
  }

  resize(view: View) {
    const l = (this.layoutNow = layout(view, this.plan.level));
    this.backdrop.resize(view);
    this.art.node.position.set(l.link!.x, l.body.y);
    this.hopperHit.position.set(l.hopper.x, l.hopper.y);
    this.hung.forEach((n, i) => n.position.set(l.slots[i].x, l.slots[i].y));
    this.cardNodes.forEach((n, i) => {
      const home = this.homeOf(i);
      this.drags[i].home = { x: home.x, y: home.y };
      if (this.drags[i].dragging) return;
      this.ctx.tw.kill(n);
      n.position.set(home.x, home.y);
    });
    this.placePads();
    this.drawTable();
    if (this.waiting) {
      this.ctx.tw.kill(this.waiting);
      this.waiting.position.set(l.waitAt.x, l.waitAt.y);
      this.waiting.alpha = 1;
    }
    if (this.linkCar) this.linkCar.position.set(l.link!.x, l.link!.y);
    if (this.output) this.output.position.set(l.out.x, l.out.y - (this.outStacked ? STACK : 0));
    if (this.wantedNode) this.wantedNode.position.set(l.out.x, l.out.y);
  }

  update(dt: number) {
    this.clock += dt;
    // The watched car goes in by itself after a short wait, as level 1's creatures do; a tap sends it sooner.
    if (this.phase === 'watch' && this.waiting && !this.finished) {
      this.idle += dt;
      if (this.idle > 4) {
        this.idle = 0;
        void this.runWatched();
      }
    }
    this.glowRing.clear();
    if (this.wantedRing) this.wantedRing.alpha = 0.65 + 0.35 * Math.sin(this.clock * 4);
    const ring = (b: Box, grow: number, width: number, color: number, alpha = 1) =>
      this.glowRing
        .roundRect(b.x - b.w / 2 - grow, b.y - b.h / 2 - grow, b.w + 2 * grow, b.h + 2 * grow, 22)
        .stroke({ width, color, alpha });
    if (this.reveal !== null) {
      // The truth beside her pick: the right pad ringed green.
      ring(this.layoutNow.pads[this.reveal], 8, 8, swatch.green.fill);
      if (this.chosen !== null && this.chosen !== this.reveal)
        ring(this.layoutNow.pads[this.chosen], 8, 5, ink, 0.35);
      return;
    }
    if (!this.score.glowing) return;
    const b = this.helpBox;
    if (b) ring(b, 7 + 3 * Math.sin(this.clock * 5), 7, swatch.yellow.fill);
  }

  autotouch(): TouchIntent | null {
    if (this.finished || this.busy) return null;
    if (this.phase === 'watch') return this.waiting ? { tap: { on: this.hopperHit } } : null;
    if (this.phase === 'predict') return { tap: { on: this.padNodes[this.options.right] } };
    const mv = this.next;
    if (!mv) return null;
    return { tap: { on: this.cardNodes[mv.kind === 'lift' ? this.slots[mv.slot]! : mv.card] } };
  }
}
