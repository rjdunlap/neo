import { Circle, Container, Graphics, Rectangle, type FederatedPointerEvent } from 'pixi.js';
import { CRITTERS, Critter } from '../../art/critter';
import { swatch } from '../../art/palette';
import { Backdrop } from '../../art/scenery';
import { STYLES } from '../../audio/music';
import { sfx } from '../../audio/sfx';
import { draggable, type DragHandle } from '../../engine/drag';
import { onTap } from '../../engine/input';
import { Rng } from '../../engine/random';
import { ease } from '../../engine/tween';
import type { View } from '../../engine/view';
import { rangeFor, type BandLevels } from '../../progress/difficulty';
import { WigglyIcon } from '../shared';
import type { Game, GameContext, GameModule, TouchIntent } from '../types';
import { arrowArt, backArt, flowerArt, GEAR_COLORS, gearArt, gearPair, handleArt, miniMachine, panelArt, socketArt, trayArt } from './art';
import {
  centre, choiceLayout, dropsInGap, FLOWER_COLORS, FLOWERS, gapOf, GearTally, gearLayout, helpFor, inputOf, Machine, outputOf, phases,
  planFor, roundFor, TIP, toScreen, type GearLayout, type MachineSpec, type Plan, type Rect, type Step,
} from './logic';

const LEVELS: BandLevels = {
  lap: { min: 1, max: 1 },
  toddler: { min: 1, max: 1 },
  preschool: { min: 1, max: 2 },
  prek: { min: 2, max: 3 },
  school: { min: 3, max: 3 },
};

/** Seconds one quarter turn takes. */
const TURN_TIME = 0.3;
/** Finger travel below this is a press (a turn), not a drag. */
const PRESS_TRAVEL = 15;

interface Anim { from: number[]; delta: number[]; t: number; moved: boolean }

class GearGarden implements Game {
  readonly plan: Plan;
  readonly steps: Step[];
  readonly tally = new GearTally();
  index = 0;
  /** The machine on screen, or null while level 3's two panels wait for a choice. */
  machine: Machine | null = null;
  /** Level 3: which of the case's machines is open. */
  opened: 'a' | 'b' | null = null;
  finished = false;
  busy = false;
  anim: Anim | null = null;
  private queued: (1 | -1) | null = null;
  private alive = true;
  /** Bumped whenever the board is rebuilt, so a callback from an older board does nothing. */
  private epoch = 0;
  private clock = 0;
  private view: View;
  private layoutNow: GearLayout | null = null;
  private stillSaid = false;
  private directionSaid = false;
  private backShown = false;

  private readonly backdrop: Backdrop;
  private readonly board = new Container();
  private readonly glow = new Graphics();
  private readonly arrows = new Container();
  face: Container | null = null;
  back: Container | null = null;
  card: Container | null = null;
  panels: Container[] = [];
  loose: Container | null = null;
  private drag: DragHandle | null = null;
  private gears: (Container | null)[] = [];
  private handle: Graphics | null = null;
  private flower: Container | null = null;
  private visitor: Critter | null = null;
  private press = { x: 0, y: 0, travel: 0, on: false };

  constructor(private readonly ctx: GameContext) {
    this.view = ctx.view;
    this.plan = planFor(ctx.level);
    this.steps = roundFor(this.plan.level, ctx.rng);
    this.backdrop = new Backdrop({ sky: [0xcfe9ff, 0xf3fbff], hills: [swatch.green.light, 0xbfe39a], horizon: 0.55, clouds: 3, sun: true, seed: 211 }, ctx.view);
    for (const n of [this.glow, this.arrows]) n.eventMode = 'none';
    ctx.stage.addChild(this.backdrop, this.board);
  }

  start() {
    this.openStep();
    void this.ctx.instruct(this.plan.level === 1 ? 'gears.instruct.turn' : this.plan.level === 2 ? 'gears.instruct.gap' : 'gears.instruct.choose');
  }

  destroy() {
    this.alive = false;
    this.drag?.destroy();
    this.drag = null;
    if (this.visitor) this.ctx.untrack(this.visitor);
  }

  resize(v: View) {
    this.view = v;
    this.backdrop.resize(v);
    this.build();
  }

  private get step(): Step {
    return this.steps[this.index];
  }

  /** Level 3's two machines, open one first. */
  private get specs(): { open: MachineSpec | null; other: MachineSpec | null } {
    const s = this.step;
    if (s.kind === 'one') return { open: s.machine, other: null };
    if (!this.opened) return { open: null, other: null };
    return this.opened === 'a' ? { open: s.pair.a, other: s.pair.b } : { open: s.pair.b, other: s.pair.a };
  }

  /** The next machine (or case) of the round comes in. */
  private openStep() {
    this.tally.next(this.index);
    this.stillSaid = false;
    this.directionSaid = false;
    this.opened = null;
    const s = this.step;
    this.machine = s.kind === 'one' ? new Machine(s.machine) : null;
    this.build();
  }

  /** Level 3: open machine A or B (a fresh board; the other goes back to its picture). */
  private open(which: 'a' | 'b') {
    if (this.finished || this.anim || this.busy) return;
    const s = this.step;
    if (s.kind !== 'choice') return;
    this.tally.touched();
    this.stillSaid = false;
    this.directionSaid = false;
    this.opened = which;
    this.machine = new Machine(which === 'a' ? s.pair.a : s.pair.b);
    sfx.whoosh();
    this.build();
  }

  /** Every node of the board, rebuilt from the model. */
  private build() {
    this.epoch++;
    this.anim = null;
    this.queued = null;
    this.drag?.destroy();
    this.drag = null;
    this.loose = this.face = this.back = this.card = this.handle = this.flower = null;
    this.panels = [];
    this.gears = [];
    this.glow.removeFromParent();
    this.arrows.removeFromParent();
    this.arrows.removeChildren().forEach((c) => c.destroy({ children: true }));
    for (const c of this.board.removeChildren()) c.destroy({ children: true });
    if (this.finished) return;
    const { open, other } = this.specs;
    if (!open || !this.machine) return this.buildChoice();
    const l = gearLayout(this.view, open.board, other !== null);
    this.layoutNow = l;
    if (!l) return;
    const m = this.machine;
    const ph = phases(open.board);

    const face = new Container();
    const fc = centre(l.face);
    const panel = panelArt(l.face.w + 40, l.face.h + 40);
    panel.eventMode = 'none';
    panel.position.set(fc.x, fc.y);
    face.addChild(panel);
    face.hitArea = new Rectangle(l.face.x - 20, l.face.y - 20, l.face.w + 40, l.face.h + 40);
    onTap(face, () => this.pressTurn(1), { cooldown: 60 });
    this.board.addChild(face);
    this.face = face;

    const deco = new Container();
    deco.eventMode = 'none';
    face.addChild(deco);
    const gapIdx = gapOf(open.board);
    open.board.sockets.forEach((s, i) => {
      const at = toScreen(l, s);
      if (s.role === 'gap') {
        const hole = socketArt(l.r);
        hole.position.set(at.x, at.y);
        deco.addChild(hole);
        this.gears.push(null);
        return;
      }
      const g = gearArt(l.r, GEAR_COLORS[s.role]);
      g.position.set(at.x, at.y);
      g.rotation = ph[i] + (m.turns[i] * Math.PI) / 2;
      deco.addChild(g);
      this.gears.push(g);
    });
    const inAt = toScreen(l, open.board.sockets[inputOf(open.board)]);
    this.handle = handleArt(l.r);
    this.handle.position.set(inAt.x, inAt.y);
    deco.addChild(this.handle);
    const outAt = toScreen(l, open.board.sockets[outputOf(open.board)]);
    this.flower = flowerArt(open.flower, open.color, l.r, m.progress);
    this.flower.position.set(outAt.x, outAt.y);
    deco.addChild(this.flower);
    this.syncAngles(m.turns);

    if (gapIdx >= 0) {
      const tray = trayArt(l.tray.w);
      tray.eventMode = 'none';
      const tc = centre(l.tray);
      tray.position.set(tc.x, tc.y);
      this.board.addChild(tray);
    }

    const back = backArt(l.back.w);
    const bc = centre(l.back);
    back.position.set(bc.x, bc.y);
    back.hitArea = new Circle(0, 0, l.back.w / 2 + 6);
    onTap(back, () => {
      void this.bounce(back);
      this.pressTurn(-1);
    }, { cooldown: 60 });
    this.board.addChild(back);
    this.back = back;

    if (other && l.card) {
      const card = new Container();
      const cc = centre(l.card);
      card.position.set(cc.x, cc.y);
      const bg = panelArt(l.card.w, l.card.h);
      const pic = miniMachine(other.board.sockets, other.flower, other.color, 14);
      pic.scale.set(Math.min(1, (l.card.w - 20) / Math.max(1, pic.width)));
      bg.eventMode = pic.eventMode = 'none';
      card.addChild(bg, pic);
      card.hitArea = new Rectangle(-l.card.w / 2, -l.card.h / 2, l.card.w, l.card.h);
      onTap(card, () => this.open(this.opened === 'a' ? 'b' : 'a'));
      this.board.addChild(card);
      this.card = card;
    }

    this.board.addChild(this.arrows, this.glow);
    if (gapIdx >= 0) this.buildLoose(l, ph[gapIdx]);
  }

  private buildLoose(l: GearLayout, phase: number) {
    const m = this.machine!;
    const board = m.spec.board;
    const node = new Container();
    const g = gearArt(l.r, GEAR_COLORS.loose);
    g.eventMode = 'none';
    node.addChild(g);
    node.hitArea = new Circle(0, 0, TIP * l.r + 8);
    const tray = centre(l.tray);
    const gapAt = toScreen(l, board.sockets[gapOf(board)]);
    const at = m.looseIn ? gapAt : tray;
    node.position.set(at.x, at.y);
    node.rotation = m.looseIn ? phase + (m.turns[gapOf(board)] * Math.PI) / 2 : 0;
    this.board.addChild(node);
    this.board.addChild(this.glow);
    node.on('pointerdown', (e: FederatedPointerEvent) => {
      this.press = { x: e.global.x, y: e.global.y, travel: 0, on: true };
    });
    node.on('globalpointermove', (e: FederatedPointerEvent) => {
      if (this.press.on) this.press.travel = Math.max(this.press.travel, Math.hypot(e.global.x - this.press.x, e.global.y - this.press.y) / Math.max(0.01, this.view.scale));
    });
    const drag = draggable(node, this.ctx.tw, {
      onPick: () => {
        sfx.tick();
        this.tally.touched();
        this.stillSaid = false;
      },
      onDrop: (x, y) => this.dropLoose(x, y),
    });
    drag.home = m.looseIn ? { ...gapAt } : { ...tray };
    this.drag = drag;
    this.loose = node;
  }

  private dropLoose(x: number, y: number): boolean {
    const m = this.machine;
    const l = this.layoutNow;
    const pressed = this.press.on && this.press.travel < PRESS_TRAVEL;
    this.press.on = false;
    if (!m || !l || !this.drag || this.finished) return false;
    const board = m.spec.board;
    const gapAt = toScreen(l, board.sockets[gapOf(board)]);
    if (pressed) {
      // A press on the loose gear is a turn, like the rest of the face; the gear goes back where it was.
      this.pressTurn(1);
      return false;
    }
    if (dropsInGap(l, board, x, y)) {
      if (!m.looseIn) this.placeLoose();
      else this.loose!.position.set(gapAt.x, gapAt.y);
      return true;
    }
    if (m.looseIn) {
      m.place(false);
      this.drag.home = { ...centre(l.tray) };
    }
    void this.pulseGap();
    return false;
  }

  /** The loose gear clunks into the gap: it now touches both neighbours. */
  private placeLoose() {
    const m = this.machine!;
    const l = this.layoutNow!;
    const board = m.spec.board;
    const g = gapOf(board);
    const at = toScreen(l, board.sockets[g]);
    m.place(true);
    this.tally.placed();
    this.loose!.position.set(at.x, at.y);
    this.loose!.rotation = phases(board)[g] + (m.turns[g] * Math.PI) / 2;
    this.drag!.home = { ...at };
    sfx.clunk();
    this.ctx.particles.burst(at.x, at.y, { colors: [swatch.orange.fill, swatch.yellow.fill], count: 10 });
    void this.ctx.say('gears.snap');
  }

  private async pulseGap() {
    const m = this.machine;
    const l = this.layoutNow;
    if (!m || !l) return;
    const at = toScreen(l, m.spec.board.sockets[gapOf(m.spec.board)]);
    const ring = new Graphics().circle(0, 0, l.r).stroke({ width: 8, color: swatch.yellow.fill });
    ring.eventMode = 'none';
    ring.position.set(at.x, at.y);
    this.board.addChild(ring);
    const epoch = this.epoch;
    await this.ctx.tw.to(ring.scale, { x: 1.25, y: 1.25 }, { duration: 0.35, ease: ease.outBack });
    if (!this.alive || epoch !== this.epoch || ring.destroyed) return;
    ring.destroy();
  }

  private async bounce(n: Container) {
    await this.ctx.tw.to(n.scale, { x: 0.9, y: 0.9 }, { duration: 0.06 });
    if (this.alive && !n.destroyed) await this.ctx.tw.to(n.scale, { x: 1, y: 1 }, { duration: 0.15, ease: ease.outBack });
  }

  /** A tap on the face or Turn-back: the handle presses in now, the turn plays (or waits for the one in progress). */
  pressTurn(dir: 1 | -1) {
    if (this.finished || this.busy || !this.machine || this.machine.bloomed) return;
    if (this.handle) this.handle.scale.set(0.9);
    if (this.anim) { this.queued = dir; return; }
    this.turn(dir);
  }

  private turn(dir: 1 | -1) {
    const m = this.machine!;
    const from = [...m.turns];
    const { delta, moved } = m.turn(dir);
    this.anim = { from, delta, t: 0, moved };
    this.arrows.removeChildren().forEach((c) => c.destroy({ children: true }));
    sfx.ratchet(dir === 1 ? 3 : 1);
  }

  private syncAngles(turns: readonly number[]) {
    const m = this.machine;
    if (!m) return;
    const ph = phases(m.spec.board);
    const g = gapOf(m.spec.board);
    turns.forEach((t, i) => {
      const node = i === g ? (m.looseIn ? this.loose : null) : this.gears[i];
      if (node && !(i === g && this.drag?.dragging)) node.rotation = ph[i] + (t * Math.PI) / 2;
    });
    const inI = inputOf(m.spec.board);
    const outI = outputOf(m.spec.board);
    if (this.handle) this.handle.rotation = ph[inI] + (turns[inI] * Math.PI) / 2;
    if (this.flower) this.flower.rotation = (turns[outI] * Math.PI) / 2;
  }

  update(dt: number) {
    this.clock += dt;
    if (this.handle && this.handle.scale.x < 1) this.handle.scale.set(Math.min(1, this.handle.scale.x + dt * 0.8));
    const a = this.anim;
    if (a) {
      a.t = Math.min(1, a.t + dt / TURN_TIME);
      const f = ease.inOutSine(a.t);
      this.syncAngles(a.from.map((t, i) => t + f * a.delta[i]));
      if (a.t >= 1) {
        this.anim = null;
        this.turned(a);
      }
    }
    this.glow.clear();
    const m = this.machine;
    const l = this.layoutNow;
    if (this.tally.glowing && m && l && !m.looseIn && !this.finished) {
      const at = toScreen(l, m.spec.board.sockets[gapOf(m.spec.board)]);
      this.glow.circle(at.x, at.y, l.r * (1.15 + 0.06 * Math.sin(this.clock * 5))).stroke({ width: 8, color: swatch.yellow.fill });
      if (this.loose && !this.drag?.dragging) this.loose.rotation = Math.sin(this.clock * 9) * 0.12;
    }
  }

  /** A quarter turn has finished: arrows, sounds, the accounting, a bloom or the next queued turn. */
  private turned(a: Anim) {
    const m = this.machine!;
    const l = this.layoutNow!;
    const board = m.spec.board;
    const inI = inputOf(board);
    const outI = outputOf(board);
    const color = swatch.blue.line;
    const inArrow = arrowArt(l.r, a.delta[inI] > 0 ? 1 : -1, color);
    inArrow.position.copyFrom(toScreen(l, board.sockets[inI]));
    this.arrows.addChild(inArrow);
    if (a.moved) {
      const outArrow = arrowArt(l.r, a.delta[outI] > 0 ? 1 : -1, color);
      outArrow.position.copyFrom(toScreen(l, board.sockets[outI]));
      this.arrows.addChild(outArrow);
      this.redrawFlower();
      sfx.bell(2 + m.progress * 2);
      if (this.plan.level === 3 && !this.directionSaid) {
        this.directionSaid = true;
        void this.ctx.say(m.sameWay ? 'gears.same' : 'gears.other');
      }
    }
    const verdict = this.tally.turned(a.moved);
    if (!a.moved && !this.stillSaid && verdict === null) {
      this.stillSaid = true;
      void this.ctx.say('gears.still');
    }
    if (verdict === 'glow') void this.ctx.say('gears.hint');
    if (verdict === 'install') void this.autoPlace();
    if (m.bloomed) { this.queued = null; void this.bloom(); return; }
    const q = this.queued;
    this.queued = null;
    if (q) this.turn(q);
  }

  private redrawFlower() {
    const m = this.machine!;
    const l = this.layoutNow!;
    if (!this.flower) return;
    const parent = this.flower.parent!;
    const fresh = flowerArt(m.spec.flower, m.spec.color, l.r, m.progress);
    fresh.position.copyFrom(this.flower.position);
    fresh.rotation = this.flower.rotation;
    parent.addChild(fresh);
    this.flower.destroy({ children: true });
    this.flower = fresh;
  }

  /** The gear goes into the gap by itself (Show a hint, or the supported finish after the glow). */
  private async autoPlace() {
    const m = this.machine;
    const l = this.layoutNow;
    if (!m || !l || m.looseIn || !this.loose || this.drag?.dragging) return;
    this.busy = true;
    const epoch = this.epoch;
    const at = toScreen(l, m.spec.board.sockets[gapOf(m.spec.board)]);
    sfx.whoosh();
    await this.ctx.tw.to(this.loose, { x: at.x, y: at.y }, { duration: 0.5, ease: ease.inOutSine });
    if (!this.alive || epoch !== this.epoch) return;
    this.busy = false;
    this.placeLoose();
  }

  private async bloom() {
    const m = this.machine!;
    const l = this.layoutNow!;
    this.busy = true;
    const epoch = this.epoch;
    const outAt = toScreen(l, m.spec.board.sockets[outputOf(m.spec.board)]);
    sfx.tada();
    this.ctx.particles.burst(outAt.x, outAt.y, { colors: [swatch[FLOWER_COLORS[0]].fill, swatch.yellow.fill, swatch[m.spec.color].fill], count: 24 });
    this.ctx.pet.cheer();
    const pop = this.flower!;
    await this.ctx.tw.to(pop.scale, { x: 1.3, y: 1.3 }, { duration: 0.25, ease: ease.outBack });
    if (!this.alive || epoch !== this.epoch) return;
    void this.ctx.tw.to(pop.scale, { x: 1, y: 1 }, { duration: 0.2 });
    await this.visit(outAt, epoch);
    if (!this.alive || epoch !== this.epoch) return;
    await this.ctx.say('gears.bloom');
    if (!this.alive || epoch !== this.epoch) return;
    this.clearVisitor();
    this.busy = false;
    if (this.index + 1 >= this.steps.length) return this.finale();
    this.index++;
    this.openStep();
    if (this.plan.level === 3) void this.ctx.instruct('gears.instruct.choose');
  }

  /** A friend comes to sniff the flower. */
  private async visit(at: { x: number; y: number }, epoch: number) {
    const v = new Critter(CRITTERS[this.machine!.spec.visitor]);
    v.eventMode = 'none';
    v.scale.set(0.38);
    const side = at.x > this.view.w / 2 ? -1 : 1;
    v.position.set(side > 0 ? -80 : this.view.w + 80, Math.min(this.view.h - 20, at.y + (this.layoutNow!.r * 1.4)));
    this.ctx.stage.addChild(v);
    this.ctx.track(v);
    this.visitor = v;
    sfx.animal(({ duck: 'quack', cat: 'meow', pig: 'oink', dog: 'woof', bunny: 'hop', bear: 'growl' } as const)[this.machine!.spec.visitor as 'duck'] ?? 'hop');
    await this.ctx.tw.to(v, { x: at.x - side * this.layoutNow!.r * 1.5 }, { duration: 0.8, ease: ease.inOutSine });
    if (!this.alive || epoch !== this.epoch) return;
    v.cheer();
  }

  private clearVisitor() {
    if (!this.visitor) return;
    this.ctx.untrack(this.visitor);
    this.visitor.destroy({ children: true });
    this.visitor = null;
  }

  private async finale() {
    this.finished = true;
    this.build();
    const flowers: Container[] = [];
    const n = this.steps.length;
    this.steps.forEach((s, i) => {
      const spec = s.kind === 'one' ? s.machine : s.pair.a;
      const f = flowerArt(spec.flower, spec.color, 90, 4);
      f.eventMode = 'none';
      f.position.set(this.view.w / 2 + (i - (n - 1) / 2) * 220, this.view.h / 2);
      this.board.addChild(f);
      flowers.push(f);
    });
    for (const f of flowers) void this.wave(f);
    sfx.tada();
    await this.ctx.say('gears.done');
    if (!this.alive) return;
    this.ctx.finish({ misses: 0, hints: this.tally.hints });
  }

  private async wave(f: Container) {
    for (const r of [0.25, -0.25, 0.2, -0.2, 0]) {
      if (!this.alive || f.destroyed) return;
      await this.ctx.tw.to(f, { rotation: r }, { duration: 0.22, ease: ease.inOutSine });
    }
  }

  /** Level 3: two pictured machines, side by side (stacked upright). */
  private buildChoice() {
    const s = this.step;
    const rects = choiceLayout(this.view);
    if (s.kind !== 'choice' || !rects) return;
    (['a', 'b'] as const).forEach((which, i) => {
      const spec = s.pair[which];
      const r: Rect = rects[i];
      const node = new Container();
      const c = centre(r);
      node.position.set(c.x, c.y);
      const bg = panelArt(r.w, r.h);
      const pic = miniMachine(spec.board.sockets, spec.flower, spec.color, 34);
      pic.scale.set(Math.min(1, (r.w - 40) / Math.max(1, pic.width), (r.h - 40) / Math.max(1, pic.height)));
      bg.eventMode = pic.eventMode = 'none';
      node.addChild(bg, pic);
      node.hitArea = new Rectangle(-r.w / 2, -r.h / 2, r.w, r.h);
      onTap(node, () => {
        void this.bounce(node);
        this.open(which);
      });
      this.board.addChild(node);
      this.panels.push(node);
    });
  }

  /** The pause sheet's Show a hint: one hint per machine; before a choice, both panels wiggle and nothing counts. */
  askForHint() {
    if (this.finished || this.busy || this.drag?.dragging) return;
    const help = helpFor(this.machine);
    if (help === 'choose') {
      for (const p of this.panels) void this.bounce(p);
      void this.ctx.say('gears.instruct.choose');
      return;
    }
    this.tally.asked();
    void this.ctx.say(help === 'place' ? 'gears.hint' : 'gears.instruct.turn');
    if (help === 'place') void this.autoPlace();
    else this.pressTurn(1);
  }

  hintLabel = 'Show a hint';

  /** Start again: the same round from its first machine, hints kept. */
  restart() {
    if (this.finished) return;
    this.clearVisitor();
    this.busy = false;
    this.index = 0;
    this.openStep();
  }

  /** The ghost finger: open machine B, carry the loose gear to the gap, then tap the face (one Turn-back on the second flower). */
  autotouch(): TouchIntent | null {
    if (this.finished || this.busy || this.anim || this.drag?.dragging) return null;
    const help = helpFor(this.machine);
    if (help === 'choose') return this.panels[1] ? { tap: { on: this.panels[1] } } : null;
    const m = this.machine!;
    const l = this.layoutNow;
    if (!l) return null;
    if (help === 'place' && this.loose) {
      const at = toScreen(l, m.spec.board.sockets[gapOf(m.spec.board)]);
      return { drag: { on: this.loose }, to: { on: this.ctx.stage, x: at.x, y: at.y } };
    }
    if (this.plan.level === 1 && this.index === 1 && m.progress === 2 && !this.backShown && this.back) {
      this.backShown = true;
      return { tap: { on: this.back } };
    }
    if (!this.face) return null;
    const c = centre(l.face);
    return { tap: { on: this.face, x: c.x, y: c.y + l.r * 1.3 }, pause: 0.45 };
  }
}

class GearIcon extends WigglyIcon {
  private readonly pair: Container;
  private t = 0;
  constructor() {
    const pair = gearPair(52);
    pair.position.set(0, -70);
    const c = new Container();
    c.addChild(pair);
    super(c);
    this.pair = pair;
  }

  update(dt: number) {
    super.update(dt);
    this.t += dt;
    const [a, b, h] = this.pair.children;
    a.rotation = this.t * 0.6;
    b.rotation = -this.t * 0.6 + Math.PI / 12;
    h.rotation = this.t * 0.6;
  }
}

/** A seeded flower blooming on a gear. */
function sticker(seed: number): Container {
  const rng = new Rng(seed);
  const c = gearPair(60, 4, rng.pick(FLOWER_COLORS), rng.pick(FLOWERS));
  c.scale.set(1.1);
  return c;
}

export const gearGarden: GameModule = {
  id: 'gear-garden',
  name: 'Gear Garden',
  titleLine: 'game.gear-garden',
  region: 'tinker-lab',
  skills: ['cause-and-effect', 'simple-machines', 'gears', 'direction'],
  bands: ['lap', 'toddler', 'preschool', 'prek', 'school'],
  levels: (band) => rangeFor(LEVELS, band),
  describeLevel: (level) => planFor(level).name,
  music: STYLES.stickers,
  coplayHint: 'Take turns guessing: say "same way" or "other way" before she turns the handle, and let her check; then swap.',
  offScreen: 'Look for something at home that turns, and watch which way it goes.',
  hubIcon: () => new GearIcon(),
  touchDemo: true,
  sticker,
  create: (ctx) => new GearGarden(ctx),
};
