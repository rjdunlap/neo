/**
 * Sorting Machine: send a critter through a toy machine and watch a sensor read it and a door answer (level 1), then
 * choose the sensor a sign asks for and Check it on every friend (level 2). Rules: ./logic.ts; definition:
 * docs/definitions/sorting-machine.md.
 */
import { Container, Graphics, Rectangle } from 'pixi.js';
import type { Critter } from '../../art/critter';
import { cream, ink, swatch } from '../../art/palette';
import { Backdrop } from '../../art/scenery';
import { STYLES } from '../../audio/music';
import { sfx } from '../../audio/sfx';
import { onTap } from '../../engine/input';
import { Rng } from '../../engine/random';
import { ease } from '../../engine/tween';
import type { View } from '../../engine/view';
import { rangeFor, type BandLevels } from '../../progress/difficulty';
import { finish, RoundButton } from '../../ui/buttons';
import { arrowIcon, checkIcon } from '../../ui/icons';
import { label } from '../../ui/text';
import { WigglyIcon } from '../shared';
import type { Game, GameContext, GameModule, TouchIntent } from '../types';
import type { LineId } from '../../content/voice-script';
import { cardArt, Door, doorMark, failBadge, fixtureCritter, iconArt, propPicture, sendArt, signArt, slotFrame, stickerArt, turtleArt, valueToken } from './art';
import {
  briefFor, centre, check, evaluate, helpFor, machineLayout, nextMove, planFor, PROPS, setSlot, slots, SPECIES, COLORS, Tally, wanted,
  type Brief, type MachineLayout, type Node, type Prop, type Pt, type Value,
} from './logic';

const LEVELS: BandLevels = {
  school: { min: 1, max: 2 },
};

/** The critters stand about 250 tall at scale 1; on a card they are a little over 100. */
const CRITTER_SCALE = 0.42;
/** A run's stages, in seconds: travel to the sensor, the token settling, the door answering, the walk home. */
const STAGE = [0.6, 0.5, 0.7, 0.5];

interface Run {
  fixture: number;
  value: Value;
  phase: number;
  t: number;
  /** Slow: the run rests here until Send is tapped again. */
  waiting: boolean;
  from: Pt;
}

class SortingMachine implements Game {
  readonly brief: Brief;
  readonly tally = new Tally();
  graph: Node;
  private history: Node[] = [];
  /** Per fixture: sent at least once this round. */
  sent: boolean[];
  /** Per fixture: the door's last answer (a result mark), or null. */
  results: (boolean | null)[];
  /** Fixtures a failed Check marked. */
  failing = new Set<number>();
  selected: number | null = null;
  pickerOpen = false;
  slow = false;
  busy = false;
  finished = false;
  run: Run | null = null;
  private alive = true;
  private epoch = 0;
  private clock = 0;
  private view: View;
  private relayout = false;
  layoutNow: MachineLayout | null = null;

  private readonly backdrop: Backdrop;
  private readonly board = new Container();
  private readonly glow = new Graphics();
  cardNodes: Container[] = [];
  critters: Critter[] = [];
  private marks: Container[] = [];
  private badges: Container[] = [];
  slotNode: Container | null = null;
  pickNodes: Container[] = [];
  private pickerLayer: Container | null = null;
  private door: Door | null = null;
  private token: Container | null = null;
  private sensorAt: Pt = { x: 0, y: 0 };
  private doorAt: Pt = { x: 0, y: 0 };
  sendButton: Container | null = null;
  checkButton: RoundButton | null = null;
  doneButton: RoundButton | null = null;
  undoButton: RoundButton | null = null;
  slowButton: Container | null = null;

  constructor(private readonly ctx: GameContext) {
    this.view = ctx.view;
    this.brief = briefFor(ctx.level, ctx.rng);
    this.graph = this.brief.graph;
    this.sent = this.brief.fixtures.map(() => false);
    this.results = this.brief.fixtures.map(() => null);
    this.backdrop = new Backdrop({ sky: [0xc8f0ec, 0xfff6e0], hills: [0xa9e0d6, 0xc5e7a8], horizon: 0.5, clouds: 2, sun: true, seed: 191 }, ctx.view);
    this.glow.eventMode = 'none';
    ctx.stage.addChild(this.backdrop, this.board);
  }

  private get level() {
    return this.brief.level;
  }

  /** The property the sign asks for (level 2), or level 1's fixed sensor. */
  private get askedProp(): Prop {
    const t = this.brief.target;
    return t.kind === 'sensor' && t.prop ? t.prop : this.brief.props[0];
  }

  private instruction(): LineId {
    if (this.level === 1) return 'sm.instruct.1';
    return `sm.instruct.${this.askedProp}` as LineId;
  }

  start() {
    this.build();
    void this.ctx.instruct(this.instruction());
  }

  destroy() {
    this.alive = false;
  }

  resize(v: View) {
    this.view = v;
    this.backdrop.resize(v);
    if (!this.layoutNow && !this.cardNodes.length) return;
    if (this.busy || this.finished) { this.relayout = true; return; }
    this.build();
  }

  /** Every node of the board, from the model and the layout. */
  private build() {
    this.epoch++;
    this.relayout = false;
    this.run = null;
    for (const c of this.critters) this.ctx.untrack(c);
    this.cardNodes = [];
    this.critters = [];
    this.marks = [];
    this.badges = [];
    this.pickNodes = [];
    this.slotNode = this.pickerLayer = this.door = this.token = null;
    this.sendButton = this.checkButton = this.doneButton = this.undoButton = this.slowButton = null;
    this.glow.removeFromParent();
    for (const c of this.board.removeChildren()) c.destroy({ children: true });
    if (this.finished) return;
    const l = machineLayout(this.level, this.view);
    this.layoutNow = l;
    if (!l) return;

    // The machine: cabinet, sensor (fixed or a slot), token, door.
    const machine = new Container();
    machine.eventMode = 'none';
    const mc = centre(l.machine);
    const cabinet = this.cabinet(l.machine.w, l.machine.h);
    cabinet.position.set(mc.x, mc.y);
    machine.addChild(cabinet);
    this.board.addChild(machine);
    const slotRect = l.slot ?? { x: mc.x - 58, y: l.machine.y + 24, w: 116, h: 116 };
    const sc = centre(slotRect);
    this.sensorAt = sc;
    const slot = new Container();
    const s = slots(this.graph)[0];
    const value = this.level === 1 ? this.brief.props[0] : (s?.value as Prop | null) ?? null;
    slot.addChild(slotFrame(slotRect.w, value === null));
    if (value !== null) {
      const pic = propPicture(value, slotRect.w * 0.62);
      pic.eventMode = 'none';
      slot.addChild(pic);
    }
    slot.position.set(sc.x, sc.y);
    if (this.level >= 2) {
      slot.hitArea = new Rectangle(-slotRect.w / 2 - 8, -slotRect.h / 2 - 8, slotRect.w + 16, slotRect.h + 16);
      onTap(slot, () => this.togglePicker(), { cooldown: 250 });
    } else {
      slot.eventMode = 'none';
    }
    this.board.addChild(slot);
    this.slotNode = slot;
    // The reading sits to the right of the sensor, inside the cabinet.
    const token = new Container();
    token.eventMode = 'none';
    token.position.set(Math.min(sc.x + slotRect.w / 2 + 44, l.machine.x + l.machine.w - 40), sc.y);
    token.visible = false;
    this.board.addChild(token);
    this.token = token;
    const door = new Door(l.door.w, l.door.h);
    door.eventMode = 'none';
    door.position.set(l.door.x + l.door.w / 2, l.door.y);
    this.board.addChild(door);
    this.door = door;
    this.doorAt = { x: l.door.x + l.door.w / 2, y: l.door.y + l.door.h };

    // The sign.
    if (l.sign) {
      const sign = signArt(this.askedProp, l.sign.w, l.sign.h);
      sign.eventMode = 'none';
      sign.position.copyFrom(centre(l.sign));
      this.board.addChild(sign);
    }

    // The fixtures: a card each, the critter standing on it, its marks beneath.
    this.brief.fixtures.forEach((_f, i) => {
      const r = l.fixtures[i];
      const c = centre(r);
      const card = new Container();
      card.addChild(cardArt(r.w, r.h, this.selected === i));
      card.position.set(c.x, c.y);
      card.hitArea = new Rectangle(-r.w / 2, -r.h / 2, r.w, r.h);
      onTap(card, () => this.select(i), { cooldown: 200 });
      this.board.addChild(card);
      this.cardNodes.push(card);
      const marks = new Container();
      marks.eventMode = 'none';
      marks.position.set(c.x, c.y + r.h / 2 - 22);
      this.board.addChild(marks);
      this.marks.push(marks);
      const badge = failBadge();
      badge.eventMode = 'none';
      badge.position.set(c.x + r.w / 2 - 18, c.y - r.h / 2 + 18);
      badge.visible = this.failing.has(i);
      this.board.addChild(badge);
      this.badges.push(badge);
    });
    const critterLayer = new Container();
    critterLayer.eventMode = 'none';
    this.board.addChild(critterLayer);
    this.brief.fixtures.forEach((f, i) => {
      const critter = fixtureCritter(f, this.brief.props);
      critter.scale.set(CRITTER_SCALE);
      critter.position.copyFrom(this.home(i));
      critterLayer.addChild(this.ctx.track(critter));
      this.critters.push(critter);
    });

    // Controls.
    const send = new Container();
    send.addChild(finish({ w: l.send.w, h: l.send.h, corner: 30 }, swatch.blue), sendArt());
    send.position.copyFrom(centre(l.send));
    send.hitArea = new Rectangle(-l.send.w / 2 - 8, -l.send.h / 2 - 8, l.send.w + 16, l.send.h + 16);
    onTap(send, () => this.send(), { cooldown: 250 });
    this.board.addChild(send);
    this.sendButton = send;
    if (l.check) {
      this.checkButton = new RoundButton(checkIcon(), swatch.green, l.check.w / 2, () => this.check());
      this.checkButton.position.copyFrom(centre(l.check));
      this.board.addChild(this.checkButton);
    }
    if (l.done) {
      this.doneButton = new RoundButton(checkIcon(), swatch.green, l.done.w / 2, () => this.done());
      this.doneButton.position.copyFrom(centre(l.done));
      this.board.addChild(this.doneButton);
    }
    if (l.undo) {
      this.undoButton = new RoundButton(arrowIcon(-1), swatch.yellow, l.undo.w / 2, () => this.undo());
      this.undoButton.position.copyFrom(centre(l.undo));
      this.board.addChild(this.undoButton);
    }
    const slow = new Container();
    slow.position.copyFrom(centre(l.slow));
    slow.hitArea = new Rectangle(-l.slow.w / 2, -l.slow.h / 2, l.slow.w, l.slow.h);
    onTap(slow, () => this.toggleSlow(), { cooldown: 250 });
    this.board.addChild(slow);
    this.slowButton = slow;
    this.drawSlow();
    this.board.addChild(this.glow);

    this.pickerLayer = new Container();
    this.board.addChild(this.pickerLayer);
    if (this.pickerOpen) this.openPicker();
    this.redraw();
  }

  private cabinet(w: number, h: number): Container {
    const g = new Graphics();
    g.roundRect(-w / 2 + 6, -h / 2 + 10, w, h, 28).fill({ color: 0x2b2440, alpha: 0.12 });
    g.roundRect(-w / 2, -h / 2, w, h, 28).fill(0xd6dbe6).stroke({ width: 6, color: 0x8a93a6 });
    g.roundRect(-w / 2 + 14, -h / 2 + 14, w - 28, h - 28, 20).stroke({ width: 3, color: 0xb3bac9 });
    for (const [x, y] of [[-w / 2 + 24, -h / 2 + 24], [w / 2 - 24, -h / 2 + 24], [-w / 2 + 24, h / 2 - 24], [w / 2 - 24, h / 2 - 24]]) g.circle(x, y, 6).fill(0x8a93a6);
    return g;
  }

  /** Where fixture i's critter stands when it is at home on its card. */
  private home(i: number): Pt {
    const r = this.layoutNow!.fixtures[i];
    return { x: r.x + r.w / 2, y: r.y + r.h - 26 };
  }

  /** The marks under every card, the Done button's dimness and the cards' lit state, from the model. */
  private redraw() {
    const l = this.layoutNow;
    if (!l) return;
    this.brief.fixtures.forEach((f, i) => {
      const m = this.marks[i];
      for (const c of m.removeChildren()) c.destroy();
      if (this.level >= 2) {
        const target = doorMark(wanted(f, this.brief), 30, true);
        target.position.set(-34, 0);
        m.addChild(target);
      }
      const r = this.results[i];
      if (r !== null) {
        const mark = doorMark(r, 32);
        mark.position.set(this.level >= 2 ? 30 : 0, 0);
        m.addChild(mark);
      }
      this.badges[i].visible = this.failing.has(i);
      const card = this.cardNodes[i];
      const plate = card.children[0];
      plate.destroy();
      card.addChildAt(cardArt(l.fixtures[i].w, l.fixtures[i].h, this.selected === i), 0);
    });
    if (this.doneButton) this.doneButton.alpha = this.sent.every((s) => s) ? 1 : 0.45;
  }

  private drawSlow() {
    const b = this.slowButton;
    if (!b) return;
    for (const c of b.removeChildren()) c.destroy();
    const l = this.layoutNow!;
    b.addChild(finish({ w: l.slow.w, h: l.slow.h, corner: 26 }, this.slow ? swatch.green : swatch.white, this.slow ? swatch.green.light : cream), turtleArt(this.slow));
  }

  private toggleSlow() {
    this.slow = !this.slow;
    sfx.tick();
    this.drawSlow();
  }

  // ——— Fixtures and sending ———

  select(i: number) {
    if (this.finished || this.run) return;
    this.selected = i;
    sfx.pop(6);
    this.critters[i].hop(0.6);
    this.redraw();
  }

  /** Send: run the selected friend; during a run, step a slow run on, or jump to its settled picture. */
  send() {
    if (this.finished) return;
    if (this.run) {
      if (this.run.waiting) { this.run.waiting = false; sfx.tick(); return; }
      this.settle();
      return;
    }
    if (this.selected === null) {
      void this.ctx.say('sm.pick-friend');
      for (const c of this.critters) c.hop(0.5);
      return;
    }
    this.startRun(this.selected);
  }

  private startRun(i: number) {
    if (this.run || this.finished) return;
    this.closePicker();
    const f = this.brief.fixtures[i];
    const value = evaluate(this.graph, f, this.brief);
    this.run = { fixture: i, value, phase: 0, t: 0, waiting: false, from: { x: this.critters[i].x, y: this.critters[i].y } };
    this.busy = true;
    if (this.token) this.token.visible = false;
    this.door?.setOpen(0);
    sfx.pluck(2);
  }

  /** The run's picture at its end: the reading shown, the door answered, the critter home, the mark recorded. */
  private settle() {
    const r = this.run;
    if (!r) return;
    this.showToken(r.value);
    this.door?.setOpen(r.value === true ? 1 : 0);
    this.critters[r.fixture].position.copyFrom(this.home(r.fixture));
    this.critters[r.fixture].alpha = 1;
    this.finishRun(r);
  }

  private finishRun(r: Run) {
    this.run = null;
    this.busy = false;
    this.sent[r.fixture] = true;
    if (r.value !== 'incomplete') this.results[r.fixture] = r.value;
    this.redraw();
    if (r.value === 'incomplete') void this.ctx.say('sm.pick-first');
    else if (this.level === 1) void this.ctx.say(r.value ? 'sm.door-open' : 'sm.door-shut');
    if (this.relayout) this.build();
  }

  private showToken(v: Value) {
    const t = this.token;
    if (!t) return;
    for (const c of t.removeChildren()) c.destroy();
    t.addChild(valueToken(v, 30));
    const text = label(v === true ? '1' : v === false ? '0' : '?', 22, ink);
    text.position.set(0, 44);
    t.addChild(text);
    t.visible = true;
  }

  /** The run, frame by frame: travel, reading, door, home. Slow waits for Send between stages. */
  private stepRun(dt: number) {
    const r = this.run;
    if (!r || r.waiting) return;
    r.t += dt;
    const critter = this.critters[r.fixture];
    const d = STAGE[r.phase];
    const k = Math.min(1, r.t / d);
    const e = ease.outQuad ? ease.outQuad(k) : k;
    if (r.phase === 0) {
      // To the sensor: up to the cabinet, under the reading.
      const to = { x: this.sensorAt.x, y: this.sensorAt.y + 120 };
      critter.position.set(r.from.x + (to.x - r.from.x) * e, r.from.y + (to.y - r.from.y) * e - Math.sin(k * Math.PI) * 40);
    } else if (r.phase === 1) {
      if (r.t === dt || !this.token?.visible) {
        this.showToken(r.value);
        sfx.pluck(r.value === true ? 6 : r.value === false ? 3 : 1);
        if (this.slow) void this.ctx.say(r.value === true ? 'sm.value-true' : r.value === false ? 'sm.value-false' : 'sm.value-incomplete');
      }
      this.token?.scale.set(1 + 0.25 * Math.sin(k * Math.PI));
    } else if (r.phase === 2) {
      if (r.value === true) {
        this.door?.setOpen(Math.min(1, k * 1.6));
        // Through the door and on, fading as it goes.
        const from = { x: this.sensorAt.x, y: this.sensorAt.y + 120 };
        critter.position.set(from.x + (this.doorAt.x - from.x) * e, from.y + (this.doorAt.y - from.y) * e);
        critter.alpha = 1 - Math.max(0, k - 0.6) / 0.4;
      } else {
        // A bump at the shut door.
        critter.x = this.sensorAt.x + Math.sin(k * Math.PI * 3) * 10 * (1 - k);
        if (r.t === dt && r.value === false) sfx.clunk();
      }
    } else {
      const home = this.home(r.fixture);
      const from = r.value === true ? this.doorAt : { x: this.sensorAt.x, y: this.sensorAt.y + 120 };
      critter.alpha = 1;
      critter.position.set(from.x + (home.x - from.x) * e, from.y + (home.y - from.y) * e - Math.sin(k * Math.PI) * 40);
    }
    if (k < 1) return;
    r.t = 0;
    r.phase++;
    if (r.phase >= STAGE.length) {
      critter.position.copyFrom(this.home(r.fixture));
      this.finishRun(r);
      return;
    }
    if (this.slow && r.phase <= 2) r.waiting = true;
  }

  // ——— The slot and its picker ———

  togglePicker() {
    if (this.finished || this.run || this.level < 2) return;
    if (this.pickerOpen) this.closePicker();
    else this.openPicker();
  }

  private openPicker() {
    const l = this.layoutNow;
    if (!l || !this.pickerLayer) return;
    this.pickerOpen = true;
    for (const c of this.pickerLayer.removeChildren()) c.destroy({ children: true });
    this.pickNodes = [];
    sfx.pop(8);
    this.brief.candidates.forEach((prop, i) => {
      const r = l.picks[i];
      const n = new Container();
      n.addChild(finish({ w: r.w, h: r.h, corner: 22 }, swatch.white, cream), propPicture(prop, r.w * 0.62));
      n.position.copyFrom(centre(r));
      n.hitArea = new Rectangle(-r.w / 2, -r.h / 2, r.w, r.h);
      onTap(n, () => this.pick(prop), { cooldown: 250 });
      this.pickerLayer!.addChild(n);
      this.pickNodes.push(n);
    });
  }

  private closePicker() {
    this.pickerOpen = false;
    this.pickNodes = [];
    if (this.pickerLayer) for (const c of this.pickerLayer.removeChildren()) c.destroy({ children: true });
  }

  pick(prop: Prop) {
    if (this.finished || this.run) return;
    this.history.push(this.graph);
    this.graph = setSlot(this.graph, 0, prop);
    this.closePicker();
    sfx.tick();
    this.afterChange();
    void this.ctx.say('sm.picked');
  }

  undo() {
    if (this.finished || this.run) return;
    const g = this.history.pop();
    if (!g) return;
    this.graph = g;
    this.closePicker();
    sfx.pop(4);
    this.afterChange();
  }

  /** The pause sheet's Start again: the opening machine; Undo can bring the choice back. Marks and counts stay. */
  restart() {
    if (this.finished || this.run) return;
    this.history.push(this.graph);
    this.graph = this.brief.graph;
    this.closePicker();
    this.afterChange();
  }

  /** The machine changed: the slot shows it, old badges go (the next Check judges afresh), the token clears. */
  private afterChange() {
    this.failing.clear();
    if (this.token) this.token.visible = false;
    this.build();
  }

  // ——— Check and Done ———

  check() {
    if (this.finished || this.run || this.level < 2) return;
    const v = check(this.graph, this.brief);
    if (v.status === 'incomplete') {
      void this.ctx.say('sm.pick-first');
      void this.pulseSlot();
      return;
    }
    if (v.status === 'pass') { void this.passed(); return; }
    sfx.boing();
    this.tally.miss();
    this.failing = new Set(v.rows);
    void this.ctx.say(`sm.check-fail.${this.askedProp}` as LineId);
    this.selected = v.rows[0];
    this.redraw();
    this.startRun(v.rows[0]);
  }

  /** Every friend gets the door the sign wants: the doors mark themselves, the friends hop, one sticker. */
  private async passed() {
    this.busy = true;
    const epoch = this.epoch;
    this.failing.clear();
    this.results = this.brief.fixtures.map((f) => wanted(f, this.brief));
    this.redraw();
    this.door?.setOpen(1);
    sfx.tada();
    this.ctx.pet.cheer();
    this.critters.forEach((c, i) => {
      c.hop(1);
      const at = this.home(i);
      this.ctx.particles.burst(at.x, at.y - 50, { colors: [swatch.yellow.fill, swatch.green.fill, 0xffffff], count: 8 });
    });
    await this.ctx.say('sm.check-pass');
    if (!this.alive || epoch !== this.epoch) return;
    this.finale();
  }

  /** Level 1's Done: both friends sent. Otherwise the unsent friend hops; nothing counts. */
  done() {
    if (this.finished || this.run || this.level !== 1) return;
    const i = this.sent.findIndex((s) => !s);
    if (i >= 0) {
      void this.ctx.say('sm.send-other');
      this.critters[i].hop(0.8);
      return;
    }
    void this.finishLevelOne();
  }

  private async finishLevelOne() {
    this.busy = true;
    const epoch = this.epoch;
    sfx.tada();
    this.ctx.pet.cheer();
    for (const c of this.critters) c.hop(1);
    await this.ctx.say('sm.done');
    if (!this.alive || epoch !== this.epoch) return;
    this.finale();
  }

  private finale() {
    this.finished = true;
    this.ctx.finish({ misses: this.tally.misses, hints: this.tally.hints });
  }

  private async pulseSlot() {
    const s = this.slotNode;
    if (!s) return;
    const epoch = this.epoch;
    await this.ctx.tw.to(s.scale, { x: 1.12, y: 1.12 }, { duration: 0.18, ease: ease.outBack });
    if (!this.alive || epoch !== this.epoch || s.destroyed) return;
    await this.ctx.tw.to(s.scale, { x: 1, y: 1 }, { duration: 0.2 });
  }

  // ——— Help ———

  hintLabel = 'Help me';

  /** The pet's Help: one hint a press. Level 1 hops the unsent friend; level 2 runs a telling friend, then installs the sensor. */
  askForHint() {
    if (this.finished || this.run) return;
    const presses = this.tally.help();
    if (this.level === 1) {
      const i = this.sent.findIndex((s) => !s);
      const who = i >= 0 ? i : 0;
      this.selected = who;
      this.critters[who].hop(0.9);
      this.redraw();
      void this.ctx.say('sm.help.send');
      return;
    }
    const h = helpFor(this.graph, this.brief, presses);
    if (h.kind === 'run') {
      this.selected = h.fixture;
      this.redraw();
      void this.ctx.say('sm.help.send');
      this.startRun(h.fixture);
      return;
    }
    this.history.push(this.graph);
    this.graph = h.graph;
    this.closePicker();
    this.afterChange();
    void this.ctx.say('sm.help.installed');
  }

  update(dt: number) {
    this.clock += dt;
    this.stepRun(dt);
    if (this.relayout && !this.busy && !this.finished && !this.run) this.build();
    this.glow.clear();
    if (!this.tally.glowing || !this.slotNode || this.finished) return;
    const r = 70 * (1 + 0.05 * Math.sin(this.clock * 5));
    this.glow.circle(this.slotNode.x, this.slotNode.y, r).stroke({ width: 8, color: swatch.yellow.fill });
  }

  /** The ghost finger: a telling friend, Send, the slot and its sensor, then Check (level 1: both friends, then Done). */
  autotouch(): TouchIntent | null {
    if (this.finished || this.run || this.busy || !this.layoutNow) return null;
    const m = nextMove(this.brief, this.graph, this.sent);
    if ('send' in m) {
      if (this.selected !== m.send) return { tap: { on: this.cardNodes[m.send] }, pause: 0.4 };
      return this.sendButton ? { tap: { on: this.sendButton } } : null;
    }
    if ('pick' in m) {
      if (!this.pickerOpen) return this.slotNode ? { tap: { on: this.slotNode }, pause: 0.4 } : null;
      const i = this.brief.candidates.indexOf(m.pick);
      return this.pickNodes[i] ? { tap: { on: this.pickNodes[i] } } : null;
    }
    if ('check' in m) return this.checkButton ? { tap: { on: this.checkButton } } : null;
    return this.doneButton ? { tap: { on: this.doneButton } } : null;
  }
}

class MachineIcon extends WigglyIcon {
  constructor() {
    super(iconArt());
  }
}

/** A seeded door with a critter in it. */
function sticker(seed: number): Container {
  const rng = new Rng(seed);
  return stickerArt(rng.pick(SPECIES), rng.pick(COLORS), rng.pick(PROPS));
}

export const sortingMachine: GameModule = {
  id: 'sorting-machine',
  name: 'Sorting Machine',
  titleLine: 'game.sorting-machine',
  region: 'tinker-lab',
  skills: ['logic', 'rules', 'testing', 'systems'],
  bands: ['school'],
  levels: (band) => rangeFor(LEVELS, band),
  describeLevel: (level) => planFor(level).name,
  music: STYLES.stickers,
  coplayHint: 'One of you reads the sign and chooses the part; the other sends the friends and says what the door did.',
  offScreen: 'Make a shoebox machine with a "hat" card slot and two paper doors, and send stuffed toys through: did the hat open it?',
  hubIcon: () => new MachineIcon(),
  touchDemo: true,
  sticker,
  create: (ctx) => new SortingMachine(ctx),
};
