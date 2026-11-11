import { Container, Graphics, Rectangle } from 'pixi.js';
import type { Critter } from '../../art/critter';
import { cream, grass, ink, swatch } from '../../art/palette';
import { Backdrop } from '../../art/scenery';
import { STYLES } from '../../audio/music';
import { sfx } from '../../audio/sfx';
import { draggable, type DragHandle } from '../../engine/drag';
import { onTap } from '../../engine/input';
import { ease } from '../../engine/tween';
import type { View } from '../../engine/view';
import { rangeFor } from '../../progress/difficulty';
import { WigglyIcon, tile } from '../shared';
import type { Game, GameContext, GameModule, TouchIntent } from '../types';
import {
  arrow,
  badge,
  car,
  card,
  counters,
  cover,
  creature,
  drawLights,
  hungBadge,
  machine,
  mysteryBadge,
  numeral,
  peekEye,
  ruleCard,
  windowView,
  type MachineArt,
} from './art';
import { ChainGame } from './chain';
import {
  CAR_W,
  CARD_H,
  CARD_W,
  HOPPER,
  LEVELS,
  PAD,
  PEEK,
  PICTURE,
  Score,
  apply,
  counted,
  direction,
  isLook,
  judgeCard,
  lastCar,
  layout,
  makeRound,
  openCards,
  pads,
  planFor,
  samePicture,
  settlingCar,
  stickerPair,
  type Box,
  type CountMachine,
  type Layout,
  type LookMachine,
  type Machine,
  type NumRule,
  type Picture,
  type Plan,
  type Row,
  type Wanted,
} from './logic';

type Phase = 'walk' | 'feed' | 'predict' | 'card' | 'run' | 'between' | 'done';

/** A card's spoken name, and the line that reads a row against it. */
function cardLine(r: NumRule) {
  if (r.a === 2) return { name: 'rm.card.twice', would: 'rm.would.twice' } as const;
  if (r.a === 3) return { name: 'rm.card.three', would: 'rm.would.three' } as const;
  return r.b < 0
    ? ({ name: 'rm.card.take', would: 'rm.would.take' } as const)
    : ({ name: 'rm.card.plus', would: 'rm.would.plus' } as const);
}

/** A card's spoken name (level 5's pool adds take two away). */
const cardName = (r: NumRule) => (r.a === 1 && r.b === -2 ? ('rm.card.take-two' as const) : cardLine(r).name);

/** A table column: what went in above an arrow above what came out. */
interface Column {
  node: Container;
}

const LOOK_LINE = {
  hat: 'rm.look.hat',
  blue: 'rm.look.blue',
  big: 'rm.look.big',
  spots: 'rm.look.spots',
} as const;
/** Level 5: how far left of the wanted car a wrong car's output lands. */
const BESIDE = 118;
/** Height of a creature standing at the hopper or chute. */
const STAND = 100;

class RuleMachine implements Game {
  readonly plan: Plan;
  readonly machines: Machine[];
  readonly score = new Score();
  index = 0;
  phase: Phase = 'walk';
  /** Level 1: walkers through so far on this machine. Level 2: unused. */
  walked = 0;
  /** Predictions answered on this machine (and the open one's index). */
  asked = 0;
  /** Level 2: the tray slot of the car at the hopper, and the slots already fed. */
  carSlot: number | null = null;
  fed: number[] = [];
  /** The table's rows for this machine. */
  rows: { in: Picture | number; out: Picture | number }[] = [];
  /** The pad or picture she chose on the open question (the truth runs beside it). */
  chosen: number | null = null;
  /** After a prediction's run, the right pad shown beside her choice. */
  reveal: number | null = null;
  /** Levels 3–4: the right card hangs on the machine. */
  hung = false;
  /** Level 4: the cover is lifted for the next run. */
  peeking = false;
  /** A table column ringed after a wrong card (the row that breaks it), and for how long. */
  private circled: { col: number; t: number } | null = null;
  finished = false;
  private readonly reduce =
    typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
  private layoutNow: Layout;
  private clock = 0;
  private idle = 0;
  private readonly backdrop: Backdrop;
  private readonly art: MachineArt;
  private readonly tableLayer = new Container();
  private readonly trayLayer = new Container();
  private readonly padLayer = new Container();
  private readonly actors = new Container();
  private readonly glowRing = new Graphics();
  private readonly hopperHit = new Container();
  private readonly shelfLayer = new Container();
  private readonly coverArt = cover();
  readonly peekNode = peekEye();
  shelfNodes: Container[] = [];
  /** The creature or car waiting at the hopper, and the output standing at the chute. */
  private waiting: Container | null = null;
  private output: Container | null = null;
  private outBeside = false;
  private cars: Container[] = [];
  private drags: DragHandle[] = [];
  padNodes: Container[] = [];
  private columns: Column[] = [];
  /** Level 5: the wanted car standing at the chute's end, its pulsing outline, and the table's open "? → wanted" column. */
  private wantedNode: Container | null = null;
  private wantedRing: Graphics | null = null;
  private openColumn: Container | null = null;

  constructor(private readonly ctx: GameContext) {
    this.plan = planFor(ctx.level);
    this.machines = makeRound(ctx.level, ctx.rng);
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
    this.art = machine();
    this.glowRing.eventMode = 'none';
    this.hopperHit.hitArea = new Rectangle(-HOPPER / 2, -HOPPER / 2, HOPPER, HOPPER);
    onTap(this.hopperHit, () => this.tapHopper());
    this.layoutNow = layout(ctx.view, this.plan.level);
    this.art.node.addChild(this.coverArt);
    this.peekNode.hitArea = new Rectangle(-PEEK / 2, -PEEK / 2, PEEK, PEEK);
    onTap(this.peekNode, () => this.tapPeek());
    ctx.stage.addChild(
      this.backdrop,
      this.tableLayer,
      this.shelfLayer,
      this.art.node,
      this.peekNode,
      this.hopperHit,
      this.trayLayer,
      this.padLayer,
      this.actors,
      this.glowRing,
    );
    this.dressMachine();
  }

  get machine(): Machine {
    return this.machines[this.index];
  }
  get look(): LookMachine {
    return this.machine as LookMachine;
  }
  get count(): CountMachine {
    return this.machine as CountMachine;
  }
  get back(): boolean {
    return this.plan.id === 'back';
  }
  /** Level 5: the wanted car on the table now (null elsewhere and between machines). */
  get wantedNow(): Wanted | null {
    if (!this.back || isLook(this.machine)) return null;
    return this.count.wanted?.[this.asked] ?? null;
  }
  /** The tray on screen: level 5 rolls a fresh one in for each wanted car. */
  get trayNow(): number[] {
    return isLook(this.machine) ? [] : (this.wantedNow?.tray ?? this.count.tray);
  }
  get isCounted(): boolean {
    return counted(this.plan, this.asked);
  }
  get busy(): boolean {
    return this.phase === 'run' || this.phase === 'between' || this.phase === 'done';
  }
  /** The table's rows as numbers (levels 2–4). */
  get numRows(): Row[] {
    return this.rows.filter((r): r is Row => typeof r.in === 'number');
  }
  /** Whether a card tap is heard now: level 3 once the shelf opens, level 4 while feeding until the card hangs. */
  get cardOpen(): boolean {
    if (this.hung || this.finished) return false;
    return this.plan.shelf === 'after'
      ? this.phase === 'card'
      : this.plan.shelf === 'start' && this.phase === 'feed';
  }
  /** The shelf cards that still fit every row. */
  get open(): NumRule[] {
    return isLook(this.machine) ? [] : openCards(this.count.shelf, this.numRows);
  }
  /** Level 4: the tray slot that tells the open cards apart (the hint's glow and the bot's car), while more than one fits. */
  get settling(): number | null {
    if (this.plan.shelf !== 'start' || this.hung) return null;
    const m = this.count;
    return settlingCar(m.shelf, this.numRows, m.tray, this.fed, m.rule);
  }
  get rightCard(): number {
    return isLook(this.machine)
      ? -1
      : this.count.shelf.findIndex((c) => c.a === this.count.rule.a && c.b === this.count.rule.b);
  }

  /** The open question's options, in pad order, and which is right. */
  get options(): { values: (Picture | number)[]; right: number } | null {
    if (this.phase !== 'predict' && !(this.phase === 'run' && this.padNodes.length)) return null;
    if (isLook(this.machine)) {
      const m = this.machine;
      const values = m.pictures[this.asked];
      const truth = { creature: m.waiting[this.asked], look: m.rule.change };
      return { values, right: values.findIndex((p) => samePicture(p, truth)) };
    }
    const m = this.count;
    const input = m.tray[this.carSlot!];
    const order = m.padOrders[this.asked];
    return { values: pads(apply(m.rule, input), order), right: order.indexOf(0) };
  }

  /** What a scripted play reads. */
  get state() {
    const o = this.options;
    return {
      level: this.plan.level,
      machine: this.index,
      phase: this.phase,
      walked: this.walked,
      asked: this.asked,
      counted: this.isCounted,
      rule: this.machine.rule,
      rows: this.rows.slice(),
      fed: this.fed.slice(),
      carSlot: this.carSlot,
      tray: this.trayNow.slice(),
      wanted: this.wantedNow?.out ?? null,
      answerSlot: this.wantedNow ? this.wantedNow.tray.indexOf(this.wantedNow.answer) : -1,
      options: o?.values ?? [],
      right: o?.right ?? -1,
      shelf: isLook(this.machine) ? [] : this.count.shelf.slice(),
      rightCard: this.rightCard,
      open: this.open.length,
      cardOpen: this.cardOpen,
      settling: this.settling,
      hung: this.hung,
      peeking: this.peeking,
      misses: this.score.misses,
      hints: this.score.hints,
      glowing: this.score.glowing,
      finished: this.finished,
    };
  }

  start() {
    void this.instruct();
  }

  destroy() {
    this.finished = true;
    for (const d of this.drags) d.destroy();
    this.drags = [];
    this.ctx.tw.kill(this.art.node);
    this.ctx.tw.kill(this.art.node.scale);
    for (const c of [
      ...this.cars,
      ...this.padNodes,
      ...this.shelfNodes,
      this.waiting,
      this.output,
      this.wantedNode,
    ])
      if (c && !c.destroyed) {
        this.ctx.tw.kill(c);
        this.ctx.tw.kill(c.scale);
      }
  }

  private instruct() {
    if (this.phase === 'predict')
      return this.ctx.instruct(this.plan.ask === 'look' ? 'rm.what-look' : 'rm.how-many');
    if (this.phase === 'card') return this.ctx.instruct('rm.which-card');
    // With the card on the machine, the last car is level 2's ask again.
    if (this.hung) return this.ctx.instruct('rm.instruct.2');
    if (this.back) return this.instructBack();
    return this.ctx.instruct(
      this.plan.ask === 'look'
        ? 'rm.instruct.1'
        : `rm.instruct.${Math.min(4, Math.max(2, this.plan.level)) as 2 | 3 | 4}`,
    );
  }

  /** Level 5: the instruction, then the open question, unless she has already answered it. */
  private async instructBack() {
    const m = this.index,
      ask = this.asked,
      rows = this.rows.length;
    await this.ctx.instruct('rm.instruct.5');
    if (this.finished || m !== this.index || ask !== this.asked || rows !== this.rows.length) return;
    if (this.phase === 'feed' && this.wantedNow) await this.ctx.say('rm.back.ask', { n: this.wantedNow.out });
  }

  // ---- building a machine ----

  private dressMachine() {
    this.art.badge.removeChildren().forEach((c) => c.destroy({ children: true }));
    const r = this.machine.rule;
    // Levels 3–4 keep the rule off the front until her card hangs there.
    if (r.kind === 'num' && this.back) {
      // Level 5: the card hangs from the start, and speaks itself on a touch.
      const hung = hungBadge(r);
      hung.hitArea = new Rectangle(-80, -75, 160, 100);
      onTap(hung, () => void this.ctx.say(cardName(r), { n: r.b }));
      this.art.badge.addChild(hung);
    } else
      this.art.badge.addChild(
        r.kind === 'look'
          ? badge(r)
          : this.plan.shelf !== 'none'
            ? mysteryBadge()
            : badge({ kind: 'num', b: r.b }),
      );
    this.hung = false;
    this.peeking = false;
    this.circled = null;
    this.coverArt.visible = this.plan.shelf === 'start';
    this.art.window.removeChildren().forEach((c) => c.destroy());
    this.buildShelf();
    this.rows = [];
    this.reveal = null;
    this.walked = 0;
    this.asked = 0;
    this.fed = [];
    this.carSlot = null;
    this.score.newMachine();
    this.clearColumns();
    this.clearPads();
    this.clearWanted();
    if (isLook(this.machine)) {
      this.buildTray([]);
      this.phase = 'walk';
      this.bringCreature(this.machine.walkers[0]);
    } else {
      this.phase = 'feed';
      this.buildTray(this.trayNow);
      if (this.back) this.showWanted();
    }
    this.drawLights();
    this.resize(this.ctx.view);
  }

  /** The tray's cars, replacing any already there (level 5 rolls a fresh tray in for each wanted car). */
  private buildTray(counts: readonly number[]) {
    for (const d of this.drags) d.destroy();
    this.drags = [];
    for (const c of this.cars)
      if (!c.destroyed) {
        this.ctx.tw.kill(c);
        this.ctx.tw.kill(c.scale);
      }
    this.trayLayer.removeChildren().forEach((c) => c.destroy({ children: true }));
    this.cars = [];
    counts.forEach((n, slot) => {
      const node = car(n, CAR_W - 10);
      node.hitArea = new Rectangle(-CAR_W / 2, -100, CAR_W, 110);
      const drag = draggable(node, this.ctx.tw, {
        onPick: () => sfx.tick(),
        onDrop: (x, y) => this.dropCar(slot, x, y),
      });
      this.drags.push(drag);
      this.cars.push(node);
      this.trayLayer.addChild(node);
    });
  }

  private clearWanted() {
    if (this.wantedNode && !this.wantedNode.destroyed) {
      this.ctx.tw.kill(this.wantedNode);
      this.ctx.tw.kill(this.wantedNode.scale);
      this.wantedNode.destroy({ children: true });
    }
    this.wantedNode = null;
    this.wantedRing = null;
    this.openColumn?.destroy({ children: true });
    this.openColumn = null;
  }

  /** Level 5: the wanted car stands outlined at the chute's end, and the table's open column reads "? → wanted". */
  private showWanted() {
    const w = this.wantedNow;
    if (!w) return;
    this.clearWanted();
    const node = new Container();
    const ring = new Graphics()
      .roundRect(-CAR_W / 2 - 4, -104, CAR_W + 8, 116, 22)
      .stroke({ width: 7, color: swatch.yellow.fill });
    node.addChild(ring, car(w.out, CAR_W - 10));
    node.eventMode = 'none';
    node.position.set(this.layoutNow.out.x, this.layoutNow.out.y);
    node.scale.set(0.6);
    void this.ctx.tw.to(node.scale, { x: 1, y: 1 }, { duration: 0.3, ease: ease.outBack });
    this.actors.addChild(node);
    this.wantedNode = node;
    this.wantedRing = ring;
    const col = new Container();
    col.addChild(card(86, 146, swatch.yellow.line));
    const q = numeral(0, 44);
    q.text = '?';
    q.position.set(0, -44);
    const a = arrow(26);
    a.position.set(0, -4);
    const out = car(w.out, 70);
    out.position.set(0, 56);
    col.addChild(q, a, out);
    this.openColumn = col;
    this.tableLayer.addChild(col);
    this.placeColumns();
  }

  /** Level 5: the next wanted car on this machine, with its fresh tray. */
  private nextWanted() {
    this.fed = [];
    this.carSlot = null;
    this.score.newAsk();
    this.buildTray(this.trayNow);
    this.showWanted();
    this.phase = 'feed';
    this.resize(this.ctx.view);
    sfx.whoosh();
    void this.ctx.say('rm.back.ask', { n: this.wantedNow!.out });
  }

  private drawLights() {
    drawLights(this.art.lights, Math.min(this.rows.length, this.plan.lights), this.plan.lights);
  }

  /** Levels 3–4: the three cards; shown at once beside the covered machine, after three rows at level 3. */
  private buildShelf() {
    for (const n of this.shelfNodes) {
      this.ctx.tw.kill(n);
      this.ctx.tw.kill(n.scale);
      n.destroy({ children: true });
    }
    this.shelfNodes = [];
    if (isLook(this.machine) || this.plan.shelf === 'none') {
      this.shelfLayer.visible = false;
      this.peekNode.visible = false;
      return;
    }
    this.count.shelf.forEach((rule, i) => {
      const node = ruleCard(rule);
      node.hitArea = new Rectangle(-CARD_W / 2, -CARD_H / 2, CARD_W, CARD_H);
      onTap(node, () => this.tapCard(i));
      this.shelfNodes.push(node);
      this.shelfLayer.addChild(node);
    });
    this.shelfLayer.visible = this.plan.shelf === 'start';
    this.peekNode.visible = this.plan.shelf === 'start';
  }

  /** A creature walks up to the hopper's mouth and waits there; tapping it (or the hopper) during the walk sends it sooner. */
  private bringCreature(c: Picture['creature']) {
    const node = creature({ creature: c, look: null }, STAND);
    this.ctx.track(node);
    node.hitArea = new Rectangle(-110, -260, 220, 280);
    onTap(node, () => this.tapHopper());
    const at = this.layoutNow.waitAt;
    node.position.set(at.x - 160, at.y);
    node.alpha = 0;
    this.actors.addChild(node);
    this.waiting = node;
    this.idle = 0;
    void this.ctx.tw.to(
      node,
      { x: at.x, alpha: 1 },
      { duration: this.reduce ? 0.2 : 0.5, ease: ease.outQuad },
    );
  }

  private clearColumns() {
    for (const c of this.columns) c.node.destroy({ children: true });
    this.columns = [];
  }

  private clearPads() {
    for (const p of this.padNodes) {
      this.ctx.tw.kill(p);
      this.ctx.tw.kill(p.scale);
      p.destroy({ children: true });
    }
    this.padNodes = [];
  }

  private addColumn(input: Picture | number, out: Picture | number) {
    const node = new Container();
    node.addChild(card(86, 146, swatch.teal.line));
    const pic = (v: Picture | number, y: number) => {
      if (typeof v === 'number') {
        const c = car(v, 70);
        c.position.set(0, y + 22);
        return c;
      }
      const c = creature(v, 44, false);
      c.position.set(0, y + 24);
      return c;
    };
    const a = arrow(26);
    node.addChild(pic(input, -42), a, pic(out, 34));
    a.position.set(0, -4);
    this.columns.push({ node });
    this.tableLayer.addChild(node);
    this.placeColumns();
  }

  // ---- input ----

  private tapHopper() {
    if (this.finished || this.phase !== 'walk' || !this.waiting) return;
    this.waiting.scale.y *= 0.9;
    void this.runWalker();
  }

  private dropCar(slot: number, x: number, y: number): boolean {
    if (this.finished || this.phase !== 'feed' || this.fed.includes(slot)) return false;
    const h = this.layoutNow.hopper,
      home = this.layoutNow.tray[slot];
    const nearHopper = Math.hypot(x - h.x, y - h.y) <= 160;
    const tapped = Math.hypot(x - home.x, y - (home.y + 50)) < 24;
    if (!nearHopper && !tapped) return false;
    void this.feedCar(slot);
    return true;
  }

  private async feedCar(slot: number) {
    this.phase = 'between';
    this.carSlot = slot;
    this.fed.push(slot);
    this.drags[slot].enabled = false;
    const node = this.cars[slot];
    this.ctx.tw.kill(node);
    sfx.pop(4);
    const at = this.layoutNow.waitAt;
    this.actors.addChild(node);
    const m = this.index;
    // Not `waiting` until it lands: a resize kills a waiting thing's tween, and this one is awaited.
    await this.ctx.tw.to(
      node,
      { x: at.x, y: at.y },
      { duration: this.reduce ? 0.15 : 0.35, ease: ease.outQuad },
    );
    if (this.finished || m !== this.index) return;
    this.waiting = node;
    node.position.set(this.layoutNow.waitAt.x, this.layoutNow.waitAt.y);
    if (this.plan.shelf === 'start' && !this.hung) {
      void this.runFed();
      return;
    }
    if (this.back) {
      void this.runBack();
      return;
    }
    this.trayLayer.visible = false;
    this.openQuestion();
  }

  /** Level 4 before the card: a fed car just runs (feeding is never judged), and she feeds again or taps a card. */
  private async runFed() {
    this.phase = 'run';
    const m = this.index;
    const n = this.count.tray[this.carSlot!];
    await this.run(n, apply(this.count.rule, n));
    if (this.finished || m !== this.index) return;
    this.carSlot = null;
    this.phase = 'feed';
    if (this.open.length === 1) void this.ctx.say('rm.tap-card');
  }

  /**
   * Level 5: the car she sent runs. The right one's output rolls onto the wanted outline and the "?" fills in; a wrong
   * one is a miss, its output lands beside the wanted car and its row is written, and the tray keeps the rest.
   */
  private async runBack() {
    this.phase = 'run';
    const m = this.index;
    const w = this.wantedNow!;
    const rule = this.count.rule;
    const n = w.tray[this.carSlot!];
    const out = apply(rule, n);
    const outcome = this.score.answer(n === w.answer, true);
    this.idle = 0;
    if (outcome === 'right') {
      await this.run(n, out, { quiet: true });
      if (this.finished || m !== this.index) return;
      this.clearWanted();
      this.placeColumns();
      sfx.sparkle();
      sfx.bell(9, 0.3);
      await this.ctx.say('rm.back.right', { n, m: out });
      if (this.finished || m !== this.index) return;
      await this.ctx.tw.wait(0.4);
      if (this.finished || m !== this.index) return;
      this.asked++;
      if (this.asked >= this.plan.wanted) {
        await this.endMachine();
        return;
      }
      this.rollAway();
      this.nextWanted();
      return;
    }
    await this.run(n, out, { quiet: true, beside: true });
    if (this.finished || m !== this.index) return;
    sfx.boing();
    await this.ctx.say('rm.back.want', { n, m: out, k: w.out });
    if (this.finished || m !== this.index) return;
    this.rollAway();
    this.carSlot = null;
    this.phase = 'feed';
    await this.ctx.say(direction(rule, n, w.out) === 'more' ? 'rm.back.more' : 'rm.back.fewer');
    if (this.finished || m !== this.index || this.phase !== 'feed') return;
    if (outcome === 'glow') await this.ctx.say('rm.help');
  }

  /** The output at the chute rolls off to the siding. */
  private rollAway() {
    const o = this.output;
    if (!o) return;
    this.output = null;
    this.ctx.tw.kill(o);
    this.ctx.tw.kill(o.scale);
    void this.ctx.tw.to(o, { x: o.x + 120, alpha: 0 }, { duration: 0.3 }).then(() => this.dropActor(o));
  }

  // ---- the shelf ----

  private tapCard(i: number) {
    if (!this.cardOpen) return;
    const node = this.shelfNodes[i];
    this.ctx.tw.kill(node.scale);
    node.scale.set(0.92);
    void this.ctx.tw.to(node.scale, { x: 1, y: 1 }, { duration: 0.25, ease: ease.outBack });
    this.idle = 0;
    const card = this.count.shelf[i];
    const verdict = judgeCard(card, this.count.shelf, this.numRows);
    if (verdict.kind === 'still-open') {
      // Never judged while the table cannot tell: a wiggle and the reason, nothing counted.
      sfx.tick();
      this.ctx.tw.kill(node);
      const x = this.layoutNow.shelf[i].x;
      void this.ctx.tw
        .to(node, { x: x + 8 }, { duration: 0.08 })
        .then(() =>
          node.destroyed ? undefined : this.ctx.tw.to(node, { x }, { duration: 0.12, ease: ease.outBack }),
        );
      void this.ctx.say('rm.still-fit');
      return;
    }
    const outcome = this.score.answer(verdict.kind === 'right', true);
    if (outcome === 'right') {
      sfx.sparkle();
      void this.hangCard();
      return;
    }
    sfx.boing();
    const row = this.numRows[verdict.kind === 'ruled-out' ? verdict.row : this.numRows.length - 1];
    this.circled = { col: verdict.kind === 'ruled-out' ? verdict.row : this.numRows.length - 1, t: 3 };
    void this.hearCardWrong(card, row, outcome === 'glow');
  }

  private async hearCardWrong(card: NumRule, row: Row, glow: boolean) {
    const m = this.index;
    await this.ctx.say(cardLine(card).would, { n: row.in, m: row.out, b: card.b, k: apply(card, row.in) });
    if (this.finished || m !== this.index || !this.cardOpen) return;
    if (glow) await this.ctx.say('rm.help');
  }

  /** The right card hangs on the machine's front; level 3 sends one more car, level 4 its last car by itself. */
  private async hangCard() {
    this.hung = true;
    this.phase = 'between';
    this.circled = null;
    const m = this.index;
    const rule = this.count.rule;
    this.art.badge.removeChildren().forEach((c) => c.destroy({ children: true }));
    this.art.badge.addChild(hungBadge(rule));
    this.shelfLayer.visible = false;
    this.peekNode.visible = false;
    // A Peek not yet used ends with the card: the last car runs covered.
    this.peeking = false;
    this.coverArt.visible = this.plan.shelf === 'start';
    sfx.bell(9, 0.3);
    sfx.bell(11, 0.25);
    const line = cardLine(rule);
    await this.ctx.say(line.name, { n: rule.b });
    if (this.finished || m !== this.index) return;
    await this.ctx.say('rm.hangs');
    if (this.finished || m !== this.index) return;
    if (this.plan.shelf === 'after') {
      this.trayLayer.visible = true;
      this.phase = 'feed';
      void this.ctx.say('rm.send');
      return;
    }
    const slot = lastCar(this.count.tray, this.fed);
    if (slot === null) {
      await this.endMachine();
      return;
    }
    // The last car is chosen for her (the lowest still on the tray): she predicts it with the card on the machine.
    this.asked = 0;
    void this.feedCar(slot);
  }

  private tapPeek() {
    if (this.finished || this.plan.shelf !== 'start' || this.hung || this.peeking || this.phase !== 'feed')
      return;
    this.peeking = true;
    this.peekNode.visible = false;
    this.coverArt.visible = false;
    this.score.peek();
    sfx.whoosh();
    void this.ctx.say('rm.peek');
  }

  private openQuestion() {
    this.phase = 'predict';
    this.chosen = null;
    this.score.newAsk();
    this.buildPads();
    void this.instruct();
  }

  private buildPads() {
    this.clearPads();
    const o = this.options!;
    o.values.forEach((v, i) => {
      const node = new Container();
      if (typeof v === 'number') {
        node.addChild(card(PAD, PAD, swatch.yellow.line));
        const t = numeral(v, 52);
        t.position.set(0, -18);
        const dots = counters(v, 7);
        dots.position.set(0, 34);
        node.addChild(t, dots);
        node.hitArea = new Rectangle(-PAD / 2, -PAD / 2, PAD, PAD);
      } else {
        node.addChild(card(PICTURE, PICTURE, swatch.yellow.line));
        const c = creature(v, 92, false);
        c.position.set(0, 58);
        node.addChild(c);
        node.hitArea = new Rectangle(-PICTURE / 2, -PICTURE / 2, PICTURE, PICTURE);
      }
      onTap(node, () => this.tapPad(i));
      this.padNodes.push(node);
      this.padLayer.addChild(node);
    });
    this.placePads();
  }

  private tapPad(i: number) {
    if (this.finished || this.phase !== 'predict') return;
    const node = this.padNodes[i];
    this.ctx.tw.kill(node.scale);
    node.scale.set(0.92);
    void this.ctx.tw.to(node.scale, { x: 1, y: 1 }, { duration: 0.25, ease: ease.outBack });
    const o = this.options!;
    const outcome = this.score.answer(i === o.right, this.isCounted);
    this.idle = 0;
    if (outcome === 'right') {
      sfx.sparkle();
      this.chosen = i;
      void this.runPrediction();
      return;
    }
    sfx.boing();
    if (outcome === 'free') {
      this.chosen = i;
      void this.ctx.say('rm.see');
      void this.runPrediction();
      return;
    }
    void this.hearWrong(outcome === 'glow');
  }

  private async hearWrong(glow: boolean) {
    const m = this.index,
      ask = this.asked;
    await this.reason();
    if (this.finished || m !== this.index || ask !== this.asked || this.phase !== 'predict') return;
    if (glow) await this.ctx.say('rm.help');
  }

  /** The spoken reason for a counted wrong: re-read what the machine has done. */
  private reason() {
    if (isLook(this.machine)) return this.ctx.say('rm.look-again');
    // Levels 3–4 never name the rule before her card does.
    if (this.plan.shelf !== 'none') return this.ctx.say(this.hung ? 'rm.look-card' : 'rm.look-table');
    const last = this.rows[this.rows.length - 1] as { in: number; out: number };
    return this.ctx.say(this.count.rule.b === 1 ? 'rm.one-more' : 'rm.two-more', { n: last.in, m: last.out });
  }

  readonly hintLabel = 'Show me';

  /**
   * The helpful move now: the right picture or pad; the right card on level 3's shelf; at level 4 the car that tells
   * the open cards apart, or the card once only one fits. Null while she is just sending cars.
   */
  get helpMove(): { kind: 'pad' | 'card' | 'car'; i: number } | null {
    if (this.finished || this.busy) return null;
    if (this.phase === 'predict') return { kind: 'pad', i: this.options!.right };
    const w = this.wantedNow;
    if (w && this.phase === 'feed') return { kind: 'car', i: w.tray.indexOf(w.answer) };
    if (!this.cardOpen) return null;
    const s = this.settling;
    return s !== null ? { kind: 'car', i: s } : { kind: 'card', i: this.rightCard };
  }

  /** Asked-for help: the glow on the helpful move (one hint per machine); asked again, the ghost makes it. Otherwise it repeats the ask. */
  askForHint() {
    if (this.finished || this.busy) return;
    const move = this.helpMove;
    if (!move) {
      void this.instruct();
      return;
    }
    if (this.score.showMe()) {
      void this.ctx.say('rm.help');
      return;
    }
    if (move.kind === 'pad') this.tapPad(move.i);
    else if (move.kind === 'card') this.tapCard(move.i);
    else void this.feedCar(move.i);
  }

  // ---- the machine runs ----

  private async runWalker() {
    this.phase = 'run';
    const c = this.look.walkers[this.walked];
    await this.run({ creature: c, look: null }, { creature: c, look: this.look.rule.change });
    if (this.finished) return;
    this.walked++;
    if (this.walked < this.plan.walkers) {
      this.phase = 'walk';
      this.bringCreature(this.look.walkers[this.walked]);
      return;
    }
    this.bringCreature(this.look.waiting[0]);
    this.openQuestion();
  }

  private async runPrediction() {
    this.phase = 'run';
    const m = this.index;
    if (isLook(this.machine)) {
      const c = this.machine.waiting[this.asked];
      await this.run({ creature: c, look: null }, { creature: c, look: this.machine.rule.change });
    } else {
      const n = this.count.tray[this.carSlot!];
      await this.run(n, apply(this.count.rule, n));
    }
    if (this.finished || m !== this.index) return;
    this.reveal = this.options?.right ?? null;
    await this.ctx.tw.wait(0.9);
    if (this.finished || m !== this.index) return;
    this.reveal = null;
    this.asked++;
    this.clearPads();
    if (this.asked >= this.plan.predictions) {
      await this.endMachine();
      return;
    }
    if (isLook(this.machine)) {
      this.bringCreature(this.machine.waiting[this.asked]);
      this.openQuestion();
      return;
    }
    this.carSlot = null;
    if (this.plan.shelf === 'after' && !this.hung && this.asked >= this.plan.cardAfter) {
      this.openShelf();
      return;
    }
    this.trayLayer.visible = true;
    this.phase = 'feed';
    void this.ctx.say('rm.send');
  }

  /** Level 3: three rows on the table, and the shelf of three cards comes down. */
  private openShelf() {
    this.phase = 'card';
    this.score.newAsk();
    this.trayLayer.visible = false;
    this.shelfLayer.visible = true;
    sfx.whoosh();
    void this.instruct();
  }

  /** The input drops into the hopper, the machine chugs, and the output lands at the chute's end; the table gains a row. */
  private async run(
    input: Picture | number,
    out: Picture | number,
    opts: { quiet?: boolean; beside?: boolean } = {},
  ) {
    const m = this.index;
    const l = this.layoutNow;
    const t = this.reduce ? 0.6 : 1.2;
    const w = this.waiting;
    this.waiting = null;
    if (this.output) {
      const o = this.output;
      this.output = null;
      void this.ctx.tw.to(o, { x: o.x + 120, alpha: 0 }, { duration: 0.3 }).then(() => this.dropActor(o));
    }
    if (w) {
      this.ctx.tw.kill(w);
      await this.ctx.tw.to(
        w,
        { x: l.hopper.x, y: l.hopper.y + 30, alpha: 0 },
        { duration: t * 0.25, ease: ease.inQuad },
      );
      if (this.finished) return;
      this.dropActor(w);
    }
    // The chug: one rising step per row of this machine. Levels 3–4 show the change in the window when it is not covered.
    sfx.bell(2 + this.rows.length, 0.25);
    const body = this.art.node;
    const see =
      typeof input === 'number' && this.plan.shelf !== 'none' && !this.coverArt.visible
        ? (this.machine.rule as NumRule)
        : null;
    const win = this.art.window;
    if (see) win.addChild(windowView(see, input as number, false));
    this.ctx.tw.kill(body.scale);
    for (let k = 0; k < 3; k++) {
      body.scale.set(1.04, 0.96);
      await this.ctx.tw.to(
        body.scale,
        { x: 1, y: 1 },
        { duration: t * (see ? 0.2 : 0.12), ease: ease.outQuad },
      );
      if (this.finished || m !== this.index) return;
      if (see && k === 1) {
        win.removeChildren().forEach((c) => c.destroy());
        win.addChild(windowView(see, input as number, true));
      }
    }
    const node = typeof out === 'number' ? car(out, CAR_W - 10) : creature(out, STAND);
    if (typeof out !== 'number') this.ctx.track(node as Critter);
    // Level 5: a wrong car's output lands on the chute beside the wanted car.
    this.outBeside = !!opts.beside;
    node.position.set(l.out.x - (opts.beside ? BESIDE : 0), l.out.y);
    node.scale.set(node.scale.x * 0.6);
    this.actors.addChild(node);
    this.output = node;
    const s = node.scale.x / 0.6;
    await this.ctx.tw.to(node.scale, { x: s, y: s }, { duration: t * 0.2, ease: ease.outBack });
    if (this.finished || m !== this.index) return;
    sfx.pop(6);
    this.ctx.particles.burst(l.out.x, l.out.y - 40, {
      kind: 'dot',
      colors: [swatch.yellow.fill, 0xffffff],
      count: 10,
      speed: [60, 160],
      gravity: 300,
      life: [0.25, 0.5],
    });
    if (typeof out !== 'number') (node as Critter).cheer();
    this.rows.push({ in: input, out });
    this.addColumn(input, out);
    this.drawLights();
    if (see) {
      // Peek lasts one run: the cover comes back down.
      win.removeChildren().forEach((c) => c.destroy());
      if (this.peeking) {
        this.peeking = false;
        this.coverArt.visible = true;
        if (!this.hung) this.peekNode.visible = true;
      }
    }
    if (opts.quiet) return;
    if (typeof out === 'number') await this.ctx.say('rm.ran', { n: input as number, m: out });
    else if (out.look) await this.ctx.say(LOOK_LINE[out.look]);
  }

  private dropActor(c: Container) {
    if (c.destroyed) return;
    this.ctx.tw.kill(c);
    this.ctx.tw.kill(c.scale);
    if ('cheer' in c) this.ctx.untrack(c as Critter);
    c.destroy({ children: true });
  }

  private async endMachine() {
    this.phase = 'between';
    const m = this.index;
    await this.ctx.tw.wait(0.6);
    if (this.finished || m !== this.index) return;
    if (this.output) {
      this.dropActor(this.output);
      this.output = null;
    }
    if (this.index + 1 >= this.machines.length) {
      this.phase = 'done';
      this.finished = true;
      sfx.bell(7, 0.35);
      sfx.bell(11, 0.3);
      await this.ctx.say('rm.done');
      await this.ctx.tw.wait(0.4);
      this.ctx.finish({ misses: this.score.misses, hints: this.score.hints });
      return;
    }
    this.index++;
    sfx.whoosh();
    this.trayLayer.visible = true;
    this.dressMachine();
    await this.ctx.say('rm.new-machine');
    if (this.finished) return;
    void this.instruct();
  }

  // ---- shell hooks ----

  private placeColumns() {
    // Level 5 can make more rows than the table has slots: the newest four show, then the open column.
    const hidden = this.back ? Math.max(0, this.columns.length - (this.openColumn ? 4 : 5)) : 0;
    this.columns.forEach((c, i) => {
      c.node.visible = i >= hidden;
      const b = this.layoutNow.columns[Math.max(0, i - hidden)];
      c.node.position.set(b.x, b.y);
    });
    if (this.openColumn) {
      const b = this.layoutNow.columns[this.columns.length - hidden];
      this.openColumn.position.set(b.x, b.y);
    }
  }

  private placePads() {
    this.padNodes.forEach((p, i) => {
      const b = this.layoutNow.pads[i];
      p.position.set(b.x, b.y);
    });
  }

  resize(view: View) {
    const l = (this.layoutNow = layout(view, this.plan.level));
    this.backdrop.resize(view);
    this.art.node.position.set(l.body.x, l.body.y);
    this.hopperHit.position.set(l.hopper.x, l.hopper.y);
    this.placeColumns();
    this.placePads();
    this.shelfNodes.forEach((n, i) => {
      this.ctx.tw.kill(n);
      const b = l.shelf[i];
      n.position.set(b.x, b.y);
    });
    this.peekNode.position.set(l.peek.x, l.peek.y);
    this.cars.forEach((c, slot) => {
      if (this.fed.includes(slot)) return;
      const b = l.tray[slot];
      c.position.set(b.x, b.y + 50);
      this.drags[slot].home = { x: c.x, y: c.y };
    });
    if (this.waiting) {
      this.ctx.tw.kill(this.waiting);
      this.waiting.position.set(l.waitAt.x, l.waitAt.y);
      this.waiting.alpha = 1;
    }
    if (this.output) this.output.position.set(l.out.x - (this.outBeside ? BESIDE : 0), l.out.y);
    if (this.wantedNode) this.wantedNode.position.set(l.out.x, l.out.y);
  }

  update(dt: number) {
    this.clock += dt;
    // Level 1: a walker goes in by itself after a short wait; tapping it sends it sooner.
    if (this.phase === 'walk' && this.waiting && !this.finished) {
      this.idle += dt;
      if (this.idle > (this.walked === 0 ? 3.5 : 2)) {
        this.idle = 0;
        void this.runWalker();
      }
    }
    this.glowRing.clear();
    if (this.wantedRing) this.wantedRing.alpha = 0.65 + 0.35 * Math.sin(this.clock * 4);
    if (this.reveal !== null) {
      // The truth beside her pick: the right one ringed green, her other pick (if any) ringed softly.
      const r = this.layoutNow.pads[this.reveal];
      this.glowRing
        .roundRect(r.x - r.w / 2 - 8, r.y - r.h / 2 - 8, r.w + 16, r.h + 16, 22)
        .stroke({ width: 8, color: swatch.green.fill });
      if (this.chosen !== null && this.chosen !== this.reveal) {
        const c = this.layoutNow.pads[this.chosen];
        this.glowRing
          .roundRect(c.x - c.w / 2 - 8, c.y - c.h / 2 - 8, c.w + 16, c.h + 16, 22)
          .stroke({ width: 5, color: ink, alpha: 0.35 });
      }
      return;
    }
    if (this.circled) {
      this.circled.t -= dt;
      const c = this.layoutNow.columns[this.circled.col];
      if (this.circled.t <= 0 || !c) this.circled = null;
      else
        this.glowRing
          .roundRect(c.x - c.w / 2 - 6, c.y - c.h / 2 - 6, c.w + 12, c.h + 12, 20)
          .stroke({ width: 6, color: swatch.red.fill });
    }
    if (!this.score.glowing) return;
    const move = this.helpMove;
    if (!move) return;
    const b: Box =
      move.kind === 'pad'
        ? this.layoutNow.pads[move.i]
        : move.kind === 'card'
          ? this.layoutNow.shelf[move.i]
          : { ...this.layoutNow.tray[move.i], y: this.layoutNow.tray[move.i].y + 10 };
    const pulse = 7 + 3 * Math.sin(this.clock * 5);
    this.glowRing
      .roundRect(b.x - b.w / 2 - pulse, b.y - b.h / 2 - pulse, b.w + 2 * pulse, b.h + 2 * pulse, 22)
      .stroke({ width: 7, color: swatch.yellow.fill });
  }

  autotouch(): TouchIntent | null {
    if (this.finished || this.busy) return null;
    if (this.phase === 'walk') return null;
    if (this.phase === 'card') return { tap: { on: this.shelfNodes[this.rightCard] } };
    if (this.phase === 'feed' && this.plan.shelf === 'start' && !this.hung) {
      const s = this.settling;
      if (s === null) return { tap: { on: this.shelfNodes[this.rightCard] } };
      return { drag: { on: this.cars[s], y: -40 }, to: { on: this.hopperHit } };
    }
    if (this.phase === 'feed' && this.wantedNow) {
      const w = this.wantedNow;
      return { drag: { on: this.cars[w.tray.indexOf(w.answer)], y: -40 }, to: { on: this.hopperHit } };
    }
    if (this.phase === 'feed') {
      const slot = this.count.tray.findIndex((_, i) => !this.fed.includes(i));
      const lowest =
        this.count.tray
          .map((n, i) => ({ n, i }))
          .filter((c) => !this.fed.includes(c.i))
          .sort((a, b) => a.n - b.n)[0]?.i ?? slot;
      return { drag: { on: this.cars[lowest], y: -40 }, to: { on: this.hopperHit } };
    }
    return { tap: { on: this.padNodes[this.options!.right] } };
  }
}

function icon(): Container {
  const c = new Container();
  const m = machine();
  m.node.scale.set(0.3);
  m.node.position.set(0, -120);
  const out = car(3, 70);
  out.position.set(95, -60);
  c.addChild(m.node, out);
  return c;
}

function sticker(seed: number): Container {
  const c = new Container();
  c.addChild(tile(260, 260, 'white'));
  const { input, b } = stickerPair(seed);
  const m = machine();
  m.badge.addChild(badge({ kind: 'num', b }));
  m.node.scale.set(0.38);
  m.node.position.set(0, -30);
  const inCar = car(input, 64),
    outCar = car(input + b, 64);
  inCar.position.set(-80, 100);
  outCar.position.set(80, 100);
  const a = new Graphics()
    .moveTo(-36, 74)
    .lineTo(36, 74)
    .stroke({ width: 6, color: ink })
    .poly([30, 64, 46, 74, 30, 84])
    .fill(ink);
  c.addChild(m.node, inCar, a, outCar);
  return c;
}

export const ruleMachine: GameModule = {
  id: 'rule-machine',
  name: 'Rule Machine',
  titleLine: 'game.rule-machine',
  region: 'puzzle-peaks',
  challenge: 'logic',
  skills: ['patterns', 'prediction', 'deduction', 'adding'],
  bands: ['prek', 'school'],
  levels: (b) => rangeFor(LEVELS, b),
  describeLevel: (l) => planFor(l).name,
  music: STYLES.hub,
  coplayHint:
    'One of you sends things into the machine, the other says out loud what will come out before it runs. With two machines, each of you hangs one card.',
  offScreen:
    'Guess my rule: one of you thinks of a rule ("I add two"), the other says numbers and hears what comes out, then guesses the rule. Then play it backwards: say what came out and ask what went in.',
  hubIcon: () => new WigglyIcon(icon()),
  sticker,
  create: (ctx) => (planFor(ctx.level).pair ? new ChainGame(ctx) : new RuleMachine(ctx)),
  touchDemo: true,
};
