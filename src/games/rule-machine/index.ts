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
import { arrow, badge, car, card, counters, creature, drawLights, machine, numeral, type MachineArt } from './art';
import {
  CAR_W, HOPPER, LEVELS, PAD, PICTURE, Score, apply, counted, isLook, layout, makeRound, pads, planFor, samePicture, stickerPair,
  type CountMachine, type Layout, type LookMachine, type Machine, type Picture, type Plan,
} from './logic';

type Phase = 'walk' | 'feed' | 'predict' | 'run' | 'between' | 'done';

/** A table column: what went in above an arrow above what came out. */
interface Column { node: Container }

const LOOK_LINE = { hat: 'rm.look.hat', blue: 'rm.look.blue', big: 'rm.look.big', spots: 'rm.look.spots' } as const;
/** Height of a creature standing at the hopper or chute. */
const STAND = 120;

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
  finished = false;
  private readonly reduce = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
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
  /** The creature or car waiting at the hopper, and the output standing at the chute. */
  private waiting: Container | null = null;
  private output: Container | null = null;
  private cars: Container[] = [];
  private drags: DragHandle[] = [];
  padNodes: Container[] = [];
  private columns: Column[] = [];

  constructor(private readonly ctx: GameContext) {
    this.plan = planFor(ctx.level);
    this.machines = makeRound(ctx.level, ctx.rng);
    this.backdrop = new Backdrop({ sky: [cream, swatch.blue.light], hills: [grass, swatch.green.light], horizon: 0.3, clouds: 2, sun: true, seed: 211 }, ctx.view);
    this.art = machine();
    this.glowRing.eventMode = 'none';
    this.hopperHit.hitArea = new Rectangle(-HOPPER / 2, -HOPPER / 2, HOPPER, HOPPER);
    onTap(this.hopperHit, () => this.tapHopper());
    this.layoutNow = layout(ctx.view, this.plan.level);
    ctx.stage.addChild(this.backdrop, this.tableLayer, this.art.node, this.hopperHit, this.trayLayer, this.padLayer, this.actors, this.glowRing);
    this.dressMachine();
  }

  get machine(): Machine { return this.machines[this.index]; }
  get look(): LookMachine { return this.machine as LookMachine; }
  get count(): CountMachine { return this.machine as CountMachine; }
  get isCounted(): boolean { return counted(this.plan, this.asked); }
  get busy(): boolean { return this.phase === 'run' || this.phase === 'between' || this.phase === 'done'; }

  /** The open question's options, in pad order, and which is right. */
  get options(): { values: (Picture | number)[]; right: number } | null {
    if (this.phase !== 'predict') return null;
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
      level: this.plan.level, machine: this.index, phase: this.phase, walked: this.walked, asked: this.asked, counted: this.isCounted,
      rule: this.machine.rule, rows: this.rows.slice(), fed: this.fed.slice(), carSlot: this.carSlot,
      tray: isLook(this.machine) ? [] : this.count.tray.slice(), options: o?.values ?? [], right: o?.right ?? -1,
      misses: this.score.misses, hints: this.score.hints, glowing: this.score.glowing, finished: this.finished,
    };
  }

  start() { void this.instruct(); }

  destroy() {
    this.finished = true;
    for (const d of this.drags) d.destroy();
    this.drags = [];
    this.ctx.tw.kill(this.art.node); this.ctx.tw.kill(this.art.node.scale);
    for (const c of [...this.cars, ...this.padNodes, this.waiting, this.output]) if (c) { this.ctx.tw.kill(c); this.ctx.tw.kill(c.scale); }
  }

  private instruct() {
    if (this.phase === 'predict') return this.ctx.instruct(this.plan.ask === 'look' ? 'rm.what-look' : 'rm.how-many');
    return this.ctx.instruct(this.plan.ask === 'look' ? 'rm.instruct.1' : 'rm.instruct.2');
  }

  // ---- building a machine ----

  private dressMachine() {
    this.art.badge.removeChildren().forEach((c) => c.destroy({ children: true }));
    const r = this.machine.rule;
    this.art.badge.addChild(r.kind === 'look' ? badge(r) : badge({ kind: 'num', b: r.b }));
    this.rows = [];
    this.walked = 0;
    this.asked = 0;
    this.fed = [];
    this.carSlot = null;
    this.score.newMachine();
    this.clearColumns();
    this.clearPads();
    for (const d of this.drags) d.destroy();
    this.drags = [];
    this.trayLayer.removeChildren().forEach((c) => c.destroy({ children: true }));
    this.cars = [];
    if (isLook(this.machine)) {
      this.phase = 'walk';
      this.bringCreature(this.machine.walkers[0]);
    } else {
      this.phase = 'feed';
      this.count.tray.forEach((n, slot) => {
        const node = car(n, CAR_W - 10);
        node.hitArea = new Rectangle(-CAR_W / 2, -100, CAR_W, 110);
        const drag = draggable(node, this.ctx.tw, { onPick: () => sfx.tick(), onDrop: (x, y) => this.dropCar(slot, x, y) });
        this.drags.push(drag);
        this.cars.push(node);
        this.trayLayer.addChild(node);
      });
    }
    this.drawLights();
    this.resize(this.ctx.view);
  }

  private drawLights() { drawLights(this.art.lights, this.rows.length, this.plan.walkers + this.plan.predictions); }

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
    void this.ctx.tw.to(node, { x: at.x, alpha: 1 }, { duration: this.reduce ? 0.2 : 0.5, ease: ease.outQuad });
  }

  private clearColumns() {
    for (const c of this.columns) c.node.destroy({ children: true });
    this.columns = [];
  }

  private clearPads() {
    for (const p of this.padNodes) { this.ctx.tw.kill(p); this.ctx.tw.kill(p.scale); p.destroy({ children: true }); }
    this.padNodes = [];
  }

  private addColumn(input: Picture | number, out: Picture | number) {
    const node = new Container();
    node.addChild(card(86, 146, swatch.teal.line));
    const pic = (v: Picture | number, y: number) => {
      if (typeof v === 'number') { const c = car(v, 70); c.position.set(0, y + 22); return c; }
      const c = creature(v, 44, false); c.position.set(0, y + 24); return c;
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
    const h = this.layoutNow.hopper, home = this.layoutNow.tray[slot];
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
    this.waiting = node;
    this.actors.addChild(node);
    const m = this.index;
    await this.ctx.tw.to(node, { x: at.x, y: at.y }, { duration: this.reduce ? 0.15 : 0.35, ease: ease.outQuad });
    if (this.finished || m !== this.index) return;
    this.trayLayer.visible = false;
    this.openQuestion();
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
    if (outcome === 'right') { sfx.sparkle(); this.chosen = i; void this.runPrediction(); return; }
    sfx.boing();
    if (outcome === 'free') { this.chosen = i; void this.ctx.say('rm.see'); void this.runPrediction(); return; }
    void this.hearWrong(outcome === 'glow');
  }

  private async hearWrong(glow: boolean) {
    const m = this.index, ask = this.asked;
    await this.reason();
    if (this.finished || m !== this.index || ask !== this.asked || this.phase !== 'predict') return;
    if (glow) await this.ctx.say('rm.help');
  }

  /** The spoken reason for a counted wrong: re-read what the machine has done. */
  private reason() {
    if (isLook(this.machine)) return this.ctx.say('rm.look-again');
    const last = this.rows[this.rows.length - 1] as { in: number; out: number };
    return this.ctx.say(this.count.rule.b === 1 ? 'rm.one-more' : 'rm.two-more', { n: last.in, m: last.out });
  }

  readonly hintLabel = 'Show me';

  /** Asked-for help: the glow on the right picture or pad (one hint per machine); asked again, the ghost taps it. Otherwise it repeats the ask. */
  askForHint() {
    if (this.finished || this.busy) return;
    if (this.phase !== 'predict') { void this.instruct(); return; }
    if (this.score.showMe()) { void this.ctx.say('rm.help'); return; }
    this.tapPad(this.options!.right);
  }

  // ---- the machine runs ----

  private async runWalker() {
    this.phase = 'run';
    const c = this.look.walkers[this.walked];
    await this.run({ creature: c, look: null }, { creature: c, look: this.look.rule.change });
    if (this.finished) return;
    this.walked++;
    if (this.walked < this.plan.walkers) { this.phase = 'walk'; this.bringCreature(this.look.walkers[this.walked]); return; }
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
    this.asked++;
    this.clearPads();
    if (this.asked >= this.plan.predictions) { await this.endMachine(); return; }
    if (isLook(this.machine)) { this.bringCreature(this.machine.waiting[this.asked]); this.openQuestion(); return; }
    this.carSlot = null;
    this.trayLayer.visible = true;
    this.phase = 'feed';
    void this.ctx.say('rm.send');
  }

  /** The input drops into the hopper, the machine chugs, and the output lands at the chute's end; the table gains a row. */
  private async run(input: Picture | number, out: Picture | number) {
    const m = this.index;
    const l = this.layoutNow;
    const t = this.reduce ? 0.6 : 1.2;
    const w = this.waiting;
    this.waiting = null;
    if (this.output) { const o = this.output; this.output = null; void this.ctx.tw.to(o, { x: o.x + 120, alpha: 0 }, { duration: 0.3 }).then(() => this.dropActor(o)); }
    if (w) {
      this.ctx.tw.kill(w);
      await this.ctx.tw.to(w, { x: l.hopper.x, y: l.hopper.y + 30, alpha: 0 }, { duration: t * 0.25, ease: ease.inQuad });
      if (this.finished) return;
      this.dropActor(w);
    }
    // The chug: one rising step per row of this machine.
    sfx.bell(2 + this.rows.length, 0.25);
    const body = this.art.node;
    this.ctx.tw.kill(body.scale);
    for (let k = 0; k < 3; k++) {
      body.scale.set(1.04, 0.96);
      await this.ctx.tw.to(body.scale, { x: 1, y: 1 }, { duration: t * 0.12, ease: ease.outQuad });
      if (this.finished || m !== this.index) return;
    }
    const node = typeof out === 'number' ? car(out, CAR_W - 10) : creature(out, STAND);
    if (typeof out !== 'number') this.ctx.track(node as Critter);
    node.position.set(l.out.x, l.out.y);
    node.scale.set(node.scale.x * 0.6);
    this.actors.addChild(node);
    this.output = node;
    const s = node.scale.x / 0.6;
    await this.ctx.tw.to(node.scale, { x: s, y: s }, { duration: t * 0.2, ease: ease.outBack });
    if (this.finished || m !== this.index) return;
    sfx.pop(6);
    this.ctx.particles.burst(l.out.x, l.out.y - 40, { kind: 'dot', colors: [swatch.yellow.fill, 0xffffff], count: 10, speed: [60, 160], gravity: 300, life: [0.25, 0.5] });
    if (typeof out !== 'number') (node as Critter).cheer();
    this.rows.push({ in: input, out });
    this.addColumn(input, out);
    this.drawLights();
    if (typeof out === 'number') await this.ctx.say('rm.ran', { n: input as number, m: out });
    else if (out.look) await this.ctx.say(LOOK_LINE[out.look]);
  }

  private dropActor(c: Container) {
    if (c.destroyed) return;
    this.ctx.tw.kill(c); this.ctx.tw.kill(c.scale);
    if ('cheer' in c) this.ctx.untrack(c as Critter);
    c.destroy({ children: true });
  }

  private async endMachine() {
    this.phase = 'between';
    const m = this.index;
    await this.ctx.tw.wait(0.6);
    if (this.finished || m !== this.index) return;
    if (this.output) { this.dropActor(this.output); this.output = null; }
    if (this.index + 1 >= this.machines.length) {
      this.phase = 'done';
      this.finished = true;
      sfx.bell(7, 0.35); sfx.bell(11, 0.3);
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
    this.columns.forEach((c, i) => { const b = this.layoutNow.columns[i]; c.node.position.set(b.x, b.y); });
  }

  private placePads() {
    this.padNodes.forEach((p, i) => { const b = this.layoutNow.pads[i]; p.position.set(b.x, b.y); });
  }

  resize(view: View) {
    const l = this.layoutNow = layout(view, this.plan.level);
    this.backdrop.resize(view);
    this.art.node.position.set(l.body.x, l.body.y);
    this.hopperHit.position.set(l.hopper.x, l.hopper.y);
    this.placeColumns();
    this.placePads();
    this.cars.forEach((c, slot) => {
      if (this.fed.includes(slot)) return;
      const b = l.tray[slot];
      c.position.set(b.x, b.y + 50);
      this.drags[slot].home = { x: c.x, y: c.y };
    });
    if (this.waiting) { this.ctx.tw.kill(this.waiting); this.waiting.position.set(l.waitAt.x, l.waitAt.y); this.waiting.alpha = 1; }
    if (this.output) this.output.position.set(l.out.x, l.out.y);
  }

  update(dt: number) {
    this.clock += dt;
    // Level 1: a walker goes in by itself after a short wait; tapping it sends it sooner.
    if (this.phase === 'walk' && this.waiting && !this.finished) {
      this.idle += dt;
      if (this.idle > (this.walked === 0 ? 3.5 : 2)) { this.idle = 0; void this.runWalker(); }
    }
    this.glowRing.clear();
    if (!this.score.glowing || this.phase !== 'predict') return;
    const b = this.layoutNow.pads[this.options!.right];
    const pulse = 7 + 3 * Math.sin(this.clock * 5);
    this.glowRing.roundRect(b.x - b.w / 2 - pulse, b.y - b.h / 2 - pulse, b.w + 2 * pulse, b.h + 2 * pulse, 22).stroke({ width: 7, color: swatch.yellow.fill });
  }

  autotouch(): TouchIntent | null {
    if (this.finished || this.busy) return null;
    if (this.phase === 'walk') return null;
    if (this.phase === 'feed') {
      const slot = this.count.tray.findIndex((_, i) => !this.fed.includes(i));
      const lowest = this.count.tray.map((n, i) => ({ n, i })).filter((c) => !this.fed.includes(c.i)).sort((a, b) => a.n - b.n)[0]?.i ?? slot;
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
  const inCar = car(input, 64), outCar = car(input + b, 64);
  inCar.position.set(-80, 100);
  outCar.position.set(80, 100);
  const a = new Graphics().moveTo(-36, 74).lineTo(36, 74).stroke({ width: 6, color: ink }).poly([30, 64, 46, 74, 30, 84]).fill(ink);
  c.addChild(m.node, inCar, a, outCar);
  return c;
}

export const ruleMachine: GameModule = {
  id: 'rule-machine', name: 'Rule Machine', titleLine: 'game.rule-machine', region: 'puzzle-peaks',
  skills: ['patterns', 'prediction', 'deduction', 'adding'], bands: ['prek', 'school'], levels: (b) => rangeFor(LEVELS, b),
  describeLevel: (l) => planFor(l).name,
  music: STYLES.hub,
  coplayHint: 'One of you sends things into the machine, the other says out loud what will come out before it runs.',
  offScreen: 'Guess my rule: one of you thinks of a rule ("I add two"), the other says numbers and hears what comes out, then guesses the rule.',
  hubIcon: () => new WigglyIcon(icon()), sticker, create: (ctx) => new RuleMachine(ctx),
  touchDemo: true,
};
