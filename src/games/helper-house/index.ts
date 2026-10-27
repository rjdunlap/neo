/**
 * Helper House: put a sensor where it can see, pick the rule chip the empty row needs, tap Watch and see the house run
 * a whole day by itself while a friend reacts (level 1 wakes the door, level 2 lights the lamp at dusk, level 3 turns it
 * off again by morning). Rules: ./logic.ts; definition: docs/definitions/helper-house.md.
 */
import { Container, Graphics, Rectangle } from 'pixi.js';
import { Critter, CRITTERS } from '../../art/critter';
import { ink, swatch } from '../../art/palette';
import { Backdrop } from '../../art/scenery';
import { STYLES } from '../../audio/music';
import { sfx } from '../../audio/sfx';
import { draggable, type DragHandle } from '../../engine/drag';
import { onTap } from '../../engine/input';
import { Rng } from '../../engine/random';
import type { View } from '../../engine/view';
import { rangeFor, type BandLevels } from '../../progress/difficulty';
import { finish, RoundButton } from '../../ui/buttons';
import { arrowIcon, checkIcon } from '../../ui/icons';
import { WigglyIcon } from '../shared';
import type { Game, GameContext, GameModule, TouchIntent } from '../types';
import type { LineId } from '../../content/voice-script';
import { actionArt, bubbleArt, cardArt, House, iconArt, pauseArt, readingArt, sensorArt, SkyMark, socketArt, stepArt, stickerArt, tileArt, watchArt } from './art';
import {
  briefFor, centre, helpFor, HOUSE_COLORS, houseLayout, nextMove, offersSetup, openRows, placeSensor, planFor, runDay, sameBoard, setRow, solutions, SPECIES, STEPS, SUN_LEVELS, Tally, TILE,
  type Board, type Brief, type HouseLayout, type Outcome, type Pt, type Reading, type SensorKind, type Socket, type SunLevel,
} from './logic';

const LEVELS: BandLevels = {
  preschool: { min: 1, max: 1 },
  prek: { min: 1, max: 3 },
  school: { min: 2, max: 3 },
};

/** The friend stands about 250 tall at scale 1. */
const CRITTER_SCALE = 0.4;
/** Within a step: the sensor reads, the pulse leaves the sensor, reaches the card, reaches the helper, the helper acts. */
const PHASES = { read: 0.2, pulse: 0.35, card: 0.55, act: 0.75 };

interface Run {
  outcome: Outcome;
  /** The step being shown. */
  step: number;
  /** Seconds into the step. */
  t: number;
  /** Phases already shown for this step. */
  shown: Set<string>;
  paused: boolean;
  /** Step: finish this one step, then pause. */
  single: boolean;
}

interface Tile {
  node: Container;
  handle: DragHandle;
  kind: SensorKind | null;
  chip: SunLevel | null;
}

class HelperHouse implements Game {
  readonly brief: Brief;
  readonly tally = new Tally();
  board: Board;
  private history: Board[] = [];
  daysPlayed = 0;
  run: Run | null = null;
  busy = false;
  finished = false;
  offered = false;
  private alive = true;
  private epoch = 0;
  private clock = 0;
  private view: View;
  private relayout = false;
  layoutNow: HouseLayout | null = null;
  private readonly stepSeconds: number;

  private readonly backdrop: Backdrop;
  private readonly veil = new Graphics();
  private readonly board_ = new Container();
  private readonly glow = new Graphics();
  private house: House | null = null;
  private sky: SkyMark | null = null;
  private friend: Critter | null = null;
  private bubble: Container | null = null;
  private pulse: Graphics | null = null;
  socketNodes: Container[] = [];
  rowNodes: { reading: Container; action: Container }[] = [];
  tiles: Tile[] = [];
  watchButton: Container | null = null;
  stepButton: RoundButton | null = null;
  undoButton: RoundButton | null = null;
  offerButton: RoundButton | null = null;
  private nearSocket: number | null = null;

  constructor(private readonly ctx: GameContext) {
    this.view = ctx.view;
    this.brief = briefFor(ctx.level, ctx.rng);
    this.board = this.brief.board;
    this.stepSeconds = ctx.demo ? 0.6 : 0.9;
    this.backdrop = new Backdrop({ sky: [0xbfe6ff, 0xfff6e0], hills: [0xa9e0d6, 0xc5e7a8], horizon: 0.55, clouds: 2, sun: false, seed: 173 }, ctx.view);
    this.veil.eventMode = 'none';
    this.glow.eventMode = 'none';
    ctx.stage.addChild(this.backdrop, this.veil, this.board_);
  }

  private get level() {
    return this.brief.level;
  }

  start() {
    this.build();
    void this.ctx.instruct(`hh.instruct.${this.level}` as LineId);
  }

  destroy() {
    this.alive = false;
    for (const t of this.tiles) t.handle.destroy();
    this.tiles = [];
  }

  resize(v: View) {
    this.view = v;
    this.backdrop.resize(v);
    if (!this.layoutNow && !this.house) return;
    if (this.run || this.busy || this.finished) { this.relayout = true; return; }
    this.build();
  }

  // ——— Building ———

  /** Every node of the board, from the model and the layout. */
  private build() {
    this.epoch++;
    this.relayout = false;
    this.run = null;
    for (const t of this.tiles) t.handle.destroy();
    if (this.friend) this.ctx.untrack(this.friend);
    this.tiles = [];
    this.socketNodes = [];
    this.rowNodes = [];
    this.house = this.sky = this.friend = this.bubble = this.pulse = null;
    this.watchButton = this.stepButton = this.undoButton = this.offerButton = null;
    this.nearSocket = null;
    this.glow.removeFromParent();
    for (const c of this.board_.removeChildren()) c.destroy({ children: true });
    this.veil.clear();
    if (this.finished) return;
    const l = houseLayout(this.brief, this.view);
    this.layoutNow = l;
    if (!l) return;

    // The house, its sky mark and the friend.
    const house = new House({ w: l.house.w, h: l.house.h, lamp: this.level >= 2 }, this.brief.house);
    house.position.set(l.house.x, l.house.y);
    this.board_.addChild(house);
    this.house = house;
    const sky = new SkyMark(90);
    sky.position.set(l.house.x + l.house.w * (this.level >= 2 ? 0.14 : 0.88), l.house.y + 60);
    this.board_.addChild(sky);
    this.sky = sky;
    const friend = new Critter({ ...CRITTERS[this.brief.friend.species], color: this.brief.friend.color });
    friend.scale.set(CRITTER_SCALE);
    friend.position.set(l.house.x + house.friendAt.x, l.house.y + house.friendAt.y);
    friend.visible = this.level >= 2;
    this.board_.addChild(this.ctx.track(friend));
    this.friend = friend;

    // Sockets, with the placed sensor drawn in its socket.
    this.brief.sockets.forEach((_s, i) => {
      const r = l.sockets[i];
      const node = new Container();
      node.eventMode = 'none';
      node.position.copyFrom(centre(r));
      node.addChild(socketArt(r.w, true));
      this.board_.addChild(node);
      this.socketNodes.push(node);
    });
    // The reading bubble above the sensor's socket.
    const bubble = new Container();
    bubble.eventMode = 'none';
    bubble.visible = false;
    this.board_.addChild(bubble);
    this.bubble = bubble;

    // Rule rows: reading → action.
    this.board.rows.forEach((row, i) => {
      const r = l.rows[i];
      const reading = new Container();
      reading.position.copyFrom(centre(r.reading));
      const action = new Container();
      action.eventMode = 'none';
      action.position.copyFrom(centre(r.action));
      const arrow = new Graphics();
      arrow.eventMode = 'none';
      const ax = r.reading.x + r.reading.w;
      const ay = r.reading.y + r.reading.h / 2;
      arrow.moveTo(ax + 6, ay).lineTo(r.action.x - 6, ay).stroke({ width: 6, color: ink, cap: 'round' });
      arrow.moveTo(r.action.x - 18, ay - 12).lineTo(r.action.x - 6, ay).lineTo(r.action.x - 18, ay + 12).stroke({ width: 6, color: ink, cap: 'round', join: 'round' });
      if (!row.given) {
        reading.hitArea = new Rectangle(-r.reading.w / 2 - 6, -r.reading.h / 2 - 6, r.reading.w + 12, r.reading.h + 12);
        onTap(reading, () => this.cycleRow(i), { cooldown: 250 });
      } else {
        reading.eventMode = 'none';
      }
      this.board_.addChild(reading, arrow, action);
      this.rowNodes.push({ reading, action });
    });

    // The bench: sensors to place, or chips for the empty row.
    const benchKinds: (SensorKind | SunLevel)[] = this.level === 3 ? this.brief.chips : this.brief.sensors;
    benchKinds.forEach((k, i) => {
      const r = l.bench[i];
      const node = new Container();
      const isChip = this.level === 3;
      node.addChild(tileArt(r.w));
      node.addChild(isChip ? readingArt(k as SunLevel, r.w * 0.66) : sensorArt(k as SensorKind, r.w * 0.7));
      node.hitArea = new Rectangle(-r.w / 2 - 6, -r.h / 2 - 6, r.w + 12, r.h + 12);
      const at = centre(r);
      // A placed sensor sits in its socket instead of on the bench.
      const placedAt = !isChip && this.board.sensor.kind === k && this.board.sensor.socket !== null ? this.socketAt(this.board.sensor.socket) : null;
      node.position.copyFrom(placedAt ?? at);
      this.board_.addChild(node);
      const tile: Tile = { node, kind: isChip ? null : (k as SensorKind), chip: isChip ? (k as SunLevel) : null, handle: null as unknown as DragHandle };
      tile.handle = draggable(node, this.ctx.tw, {
        onPick: () => this.picked(tile),
        onMove: (x, y) => this.moved(tile, x, y),
        onDrop: (x, y) => this.dropped(tile, x, y),
      });
      if (isChip) onTap(node, () => this.tapChip(tile), { cooldown: 250 });
      this.tiles.push(tile);
    });

    // Controls.
    const watch = new Container();
    watch.position.copyFrom(centre(l.watch));
    watch.hitArea = new Rectangle(-l.watch.w / 2 - 8, -l.watch.h / 2 - 8, l.watch.w + 16, l.watch.h + 16);
    onTap(watch, () => this.watch(), { cooldown: 250 });
    this.board_.addChild(watch);
    this.watchButton = watch;
    this.stepButton = new RoundButton(stepArt(), swatch.white, l.step.w / 2, () => this.stepOnce());
    this.stepButton.position.copyFrom(centre(l.step));
    this.undoButton = new RoundButton(arrowIcon(-1), swatch.yellow, l.undo.w / 2, () => this.undo());
    this.undoButton.position.copyFrom(centre(l.undo));
    this.board_.addChild(this.stepButton, this.undoButton);
    if (this.offered && !this.run) {
      const offer = new RoundButton(checkIcon(), swatch.green, 60, () => this.acceptOffer());
      offer.position.set(l.house.x + l.house.w / 2, l.house.y + l.house.h * 0.62);
      this.board_.addChild(offer);
      this.offerButton = offer;
    }
    const pulse = new Graphics().circle(0, 0, 14).fill(swatch.yellow.fill).stroke({ width: 4, color: swatch.yellow.line });
    pulse.eventMode = 'none';
    pulse.visible = false;
    this.board_.addChild(pulse);
    this.pulse = pulse;
    this.board_.addChild(this.glow);
    this.redraw();
    this.showStill();
  }

  /** Where a socket's centre is. */
  private socketAt(socket: Socket): Pt {
    const i = this.brief.sockets.indexOf(socket);
    return centre(this.layoutNow!.sockets[i]);
  }

  /** The sockets, rows, Watch button and chips, from the model. */
  private redraw() {
    const l = this.layoutNow;
    if (!l) return;
    this.brief.sockets.forEach((s, i) => {
      const node = this.socketNodes[i];
      for (const c of node.removeChildren()) c.destroy();
      const filled = this.board.sensor.socket === s && this.board.sensor.kind !== null;
      node.addChild(socketArt(l.sockets[i].w, !filled, this.nearSocket === i));
      // A fixed sensor (level 3) has no bench tile, so the socket draws it.
      if (filled && !this.tiles.some((t) => t.kind === this.board.sensor.kind)) node.addChild(sensorArt(this.board.sensor.kind!, l.sockets[i].w * 0.7));
    });
    this.board.rows.forEach((row, i) => {
      const n = this.rowNodes[i];
      const lit = !!this.run && this.run.outcome.trace[this.run.step]?.matched === i && this.run.shown.has('card');
      for (const c of n.reading.removeChildren()) c.destroy();
      n.reading.addChild(cardArt(l.rows[i].reading.w, l.rows[i].reading.h, lit, row.reading === null));
      if (row.reading !== null) n.reading.addChild(readingArt(row.reading, 76));
      for (const c of n.action.removeChildren()) c.destroy();
      n.action.addChild(cardArt(l.rows[i].action.w, l.rows[i].action.h, lit), actionArt(row.action, 76));
    });
    const w = this.watchButton;
    if (w) {
      for (const c of w.removeChildren()) c.destroy();
      const running = !!this.run && !this.run.paused;
      w.addChild(finish({ w: l.watch.w, h: l.watch.h, corner: 30 }, running ? swatch.orange : swatch.green), running ? pauseArt() : watchArt());
    }
    if (this.undoButton) this.undoButton.alpha = this.history.length ? 1 : 0.45;
    if (this.stepButton) this.stepButton.alpha = this.run ? 1 : 0.7;
  }

  /** The house at rest: a dim morning, the helper off, the friend at its spot. */
  private showStill() {
    this.sky?.set(this.level === 1 ? 'bright' : 'dim');
    this.setVeil(this.level === 1 ? 'bright' : 'dim');
    this.house?.setDoor(0);
    this.house?.setLamp(false);
    this.house?.setInside(0);
    if (this.friend) {
      this.friend.visible = this.level >= 2;
      this.friend.alpha = 1;
      this.friend.setMood('calm');
    }
    if (this.bubble) this.bubble.visible = false;
    if (this.pulse) this.pulse.visible = false;
  }

  private setVeil(sun: SunLevel) {
    this.veil.clear();
    const a = sun === 'dark' ? 0.5 : sun === 'dim' ? 0.18 : 0;
    if (a > 0) this.veil.rect(-200, -200, this.view.w + 400, this.view.h + 400).fill({ color: 0x1d2552, alpha: a });
  }

  // ——— Placing sensors and chips ———

  private picked(tile: Tile) {
    if (this.finished || this.busy) { tile.handle.enabled = false; return; }
    if (this.run) this.stopRun();
    sfx.pop(6);
    tile.node.scale.set(1.06);
    this.board_.addChild(tile.node);
  }

  private moved(tile: Tile, x: number, y: number) {
    if (tile.kind === null) return;
    const i = this.nearestSocket(x, y);
    if (i !== this.nearSocket) { this.nearSocket = i; this.redraw(); }
  }

  private nearestSocket(x: number, y: number): number | null {
    const l = this.layoutNow;
    if (!l) return null;
    let best: number | null = null;
    let bd = TILE * 0.85;
    l.sockets.forEach((r, i) => {
      const c = centre(r);
      const d = Math.hypot(c.x - x, c.y - y);
      if (d < bd) { bd = d; best = i; }
    });
    return best;
  }

  private dropped(tile: Tile, x: number, y: number): boolean {
    tile.node.scale.set(1);
    this.nearSocket = null;
    if (this.finished || this.busy) return false;
    if (tile.kind !== null) {
      const i = this.nearestSocket(x, y);
      if (i === null) {
        // Back to the bench: a placed sensor leaves its socket.
        if (this.board.sensor.kind === tile.kind && this.board.sensor.socket !== null && this.level === 1) {
          this.change(placeSensor(this.board, 'eye', null), 'sensor');
          return true;
        }
        if (this.level === 2 && this.board.sensor.kind === tile.kind) {
          this.change(placeSensor(this.board, null, 'post'), 'sensor');
          return true;
        }
        this.redraw();
        return false;
      }
      sfx.tick();
      this.change(placeSensor(this.board, tile.kind, this.brief.sockets[i]), 'sensor');
      void this.ctx.say('hh.placed');
      return true;
    }
    const row = this.rowUnder(x, y);
    if (row === null) return false;
    sfx.tick();
    this.change(setRow(this.board, row, tile.chip), 'row');
    void this.ctx.say('hh.row-set');
    return true;
  }

  private rowUnder(x: number, y: number): number | null {
    const l = this.layoutNow;
    if (!l) return null;
    for (const i of openRows(this.board)) {
      const c = centre(l.rows[i].reading);
      if (Math.hypot(c.x - x, c.y - y) < TILE * 0.9) return i;
    }
    return null;
  }

  /** A tap on a chip puts it in the empty row (the first open row). */
  tapChip(tile: Tile) {
    if (this.finished || this.busy || tile.handle.dragging || tile.chip === null) return;
    if (this.run) this.stopRun();
    const [row] = openRows(this.board);
    if (row === undefined) return;
    sfx.tick();
    this.change(setRow(this.board, row, tile.chip), 'row');
    void this.ctx.say('hh.row-set');
  }

  /** A tap on an open row cycles its reading through the chips. */
  cycleRow(i: number) {
    if (this.finished || this.busy) return;
    if (this.run) this.stopRun();
    const now = this.board.rows[i].reading as SunLevel | null;
    const order = [...SUN_LEVELS].reverse();
    const next = now === null ? order[0] : order[(order.indexOf(now) + 1) % order.length];
    sfx.pop(8);
    this.change(setRow(this.board, i, next), 'row');
  }

  private change(board: Board, piece: 'sensor' | 'row') {
    this.history.push(this.board);
    this.board = board;
    this.tally.changed(piece);
    this.build();
  }

  undo() {
    if (this.finished || this.busy) return;
    if (this.run) this.stopRun();
    const b = this.history.pop();
    if (!b) return;
    this.board = b;
    this.tally.changed('sensor');
    this.tally.changed('row');
    sfx.pop(4);
    this.build();
  }

  /** The pause sheet's Start again: the opening board; Undo can bring the pieces back. Days and hints stay. */
  restart() {
    if (this.finished || this.busy) return;
    if (this.run) this.stopRun();
    if (sameBoard(this.board, this.brief.board)) return;
    this.history.push(this.board);
    this.board = this.brief.board;
    this.build();
  }

  // ——— Watching the day ———

  /** Watch starts the day; while it runs it pauses and resumes. */
  watch() {
    if (this.finished || this.busy) return;
    if (this.run) {
      this.run.paused = !this.run.paused;
      this.run.single = false;
      sfx.tick();
      this.redraw();
      return;
    }
    this.startRun();
    void this.ctx.say('hh.watch');
  }

  /** Step: start the day paused at its first step, or show the next step and pause again. */
  stepOnce() {
    if (this.finished || this.busy) return;
    if (!this.run) { this.startRun(); this.run!.paused = false; this.run!.single = true; this.redraw(); return; }
    this.run.paused = false;
    this.run.single = true;
    this.redraw();
  }

  private startRun() {
    const outcome = runDay(this.board, this.brief.day);
    this.run = { outcome, step: 0, t: 0, shown: new Set(), paused: false, single: false };
    this.showStill();
    if (this.friend && this.level === 1) this.friend.visible = false;
    this.offerButton?.destroy();
    this.offerButton = null;
    sfx.pluck(2);
    this.redraw();
  }

  /** A piece moved mid-day: the day stops where it is and the house goes back to rest. */
  private stopRun() {
    this.run = null;
    this.showStill();
    this.redraw();
  }

  private stepRun(dt: number) {
    const r = this.run;
    if (!r || r.paused) return;
    const t = r.outcome.trace[r.step];
    r.t += dt;
    const fire = (name: string, at: number) => {
      if (r.shown.has(name) || r.t < at) return false;
      r.shown.add(name);
      return true;
    };
    if (fire('world', 0)) {
      this.sky?.set(t.sun);
      this.setVeil(t.sun);
      if (this.level >= 2 && this.friend) this.friend.setMood(t.sun === 'dark' && !t.helperOn ? 'sad' : 'calm');
      if (t.arrived && this.friend) {
        this.friend.visible = true;
        this.friend.alpha = 1;
        this.friend.hop(0.6);
        this.friend.setMood('surprised', 0.5);
        sfx.knock();
      }
    }
    if (fire('read', PHASES.read)) this.showBubble(t.reading);
    if (fire('pulse', PHASES.pulse) && this.pulse) {
      this.pulse.visible = t.matched !== null;
    }
    if (this.pulse?.visible && t.matched !== null) {
      const from = this.sensorPoint();
      const card = this.rowNodes[t.matched].reading.position;
      const to = this.helperPoint();
      const k = Math.min(1, Math.max(0, (r.t - PHASES.pulse) / (PHASES.act - PHASES.pulse)));
      const a = k < 0.5 ? k * 2 : 1;
      const b = k < 0.5 ? 0 : (k - 0.5) * 2;
      const mid = { x: card.x, y: card.y };
      this.pulse.position.set(from.x + (mid.x - from.x) * a + (to.x - mid.x) * b, from.y + (mid.y - from.y) * a + (to.y - mid.y) * b);
    }
    if (fire('card', PHASES.card)) {
      if (t.matched !== null) sfx.marimba(t.matched === 0 ? 6 : 8, 0.3);
      this.redraw();
    }
    if (fire('act', PHASES.act)) {
      if (this.pulse) this.pulse.visible = false;
      this.showHelper(t.helperOn, t.opened, t.inside, t.waiting);
      if (this.level >= 2 && this.friend) this.friend.setMood(t.sun === 'dark' && !t.helperOn ? 'sad' : t.helperOn && t.sun === 'dark' ? 'happy' : 'calm');
    }
    if (r.t < this.stepSeconds) return;
    r.step++;
    r.t = 0;
    r.shown = new Set();
    this.redraw();
    if (r.step >= STEPS) { void this.dayEnded(r.outcome); return; }
    if (r.single) { r.paused = true; r.single = false; this.redraw(); }
  }

  private sensorPoint(): Pt {
    const s = this.board.sensor.socket;
    return s !== null && this.brief.sockets.includes(s) ? this.socketAt(s) : centre(this.layoutNow!.bench[0] ?? this.layoutNow!.house);
  }

  private helperPoint(): Pt {
    const h = this.house!;
    const at = this.level === 1 ? h.doorAt : h.lampAt;
    return { x: h.x + at.x, y: h.y + at.y };
  }

  private showBubble(reading: Reading) {
    const b = this.bubble;
    if (!b) return;
    for (const c of b.removeChildren()) c.destroy();
    b.addChild(bubbleArt(84), readingArt(reading, 60));
    const at = this.sensorPoint();
    b.position.set(at.x, at.y - TILE / 2 - 56);
    b.visible = true;
    sfx.pop(reading === 'near' || reading === 'bright' ? 9 : reading === 'dim' ? 7 : 5);
  }

  private showHelper(on: boolean, opened: boolean, inside: number, waiting: number) {
    const h = this.house;
    if (!h) return;
    if (this.level === 1) {
      h.setDoor(opened ? 1 : 0);
      h.setInside(inside);
      if (this.friend) {
        if (opened) {
          // In through the open door.
          this.friend.alpha = 0;
          this.friend.visible = false;
          sfx.whoosh();
        } else if (waiting > 0) {
          this.friend.visible = true;
          this.friend.setMood('sad');
        }
      }
      return;
    }
    h.setLamp(on);
  }

  private async dayEnded(o: Outcome) {
    this.run = null;
    this.daysPlayed++;
    this.redraw();
    if (o.met) { await this.celebrate(); return; }
    const lit = this.tally.failed(this.board, o.failure!);
    void this.ctx.say(`hh.${o.failure}` as LineId);
    if (lit) {
      sfx.boing();
      void this.ctx.say('hh.glow');
    }
    if (offersSetup(this.tally) && !this.offered) {
      this.offered = true;
      this.build();
      void this.ctx.say('hh.offer');
    } else if (this.relayout) {
      this.build();
    }
  }

  /** The helper did its job all day: the friend dances, the house stays as it ended, one sticker. */
  private async celebrate() {
    this.busy = true;
    for (const t of this.tiles) t.handle.enabled = false;
    sfx.tada();
    this.ctx.pet.cheer();
    const h = this.house;
    if (h) {
      const at = this.helperPoint();
      this.ctx.particles.burst(at.x, at.y, { colors: [swatch.yellow.fill, swatch.green.fill, 0xffffff], count: 12 });
    }
    if (this.friend) { this.friend.visible = true; this.friend.alpha = 1; this.friend.cheer(); }
    if (this.level === 1 && this.friend && h) {
      // The friends come out to dance in front of the door.
      this.friend.position.set(h.x + h.friendAt.x, h.y + h.friendAt.y);
    }
    await this.ctx.say('hh.done');
    if (!this.alive) return;
    this.finished = true;
    this.ctx.finish({ misses: 0, hints: this.tally.hints });
  }

  // ——— Help and the offer ———

  hintLabel = 'Show me';

  /** The pet's Show me: one hint a press. First the piece the board needs; then there is nothing more to place. */
  askForHint() {
    if (this.finished || this.busy) return;
    if (this.run) this.stopRun();
    const h = helpFor(this.board, this.brief, this.tally.presses + 1);
    if (h.placed === null) {
      void this.ctx.say('hh.help.done');
      return;
    }
    this.tally.help();
    this.history.push(this.board);
    this.board = h.board;
    this.tally.changed(h.placed);
    this.build();
    void this.ctx.say(h.placed === 'sensor' ? `hh.help.sensor.${this.level}` as LineId : 'hh.help.row');
  }

  /** Shall I set it up? Yes: the accepted board, and the day plays to its finish. */
  acceptOffer() {
    if (this.finished || this.busy || this.run) return;
    const right = solutions(this.brief)[0];
    if (!right) return;
    this.tally.offered();
    this.history.push(this.board);
    this.board = right;
    this.tally.changed('sensor');
    this.tally.changed('row');
    this.build();
    void this.ctx.say('hh.help.setup');
    this.startRun();
  }

  update(dt: number) {
    this.clock += dt;
    this.stepRun(dt);
    if (this.relayout && !this.busy && !this.finished && !this.run) this.build();
    this.glow.clear();
    const g = this.tally.glowing;
    if (!g || this.finished || !this.layoutNow) return;
    const r = 1 + 0.05 * Math.sin(this.clock * 5);
    if (g === 'sensor') {
      const l = this.layoutNow;
      const socketIndex = this.level === 1 ? this.brief.sockets.indexOf('door') : 0;
      const s = centre(l.sockets[socketIndex]);
      this.glow.circle(s.x, s.y, 76 * r).stroke({ width: 8, color: swatch.yellow.fill });
      const tile = this.tiles.find((t) => t.kind === (this.level === 1 ? 'eye' : 'sun'));
      if (tile && this.board.sensor.socket === null || (this.level === 2 && tile && this.board.sensor.kind !== 'sun')) {
        this.glow.circle(tile!.node.x, tile!.node.y, 76 * r).stroke({ width: 8, color: swatch.yellow.fill });
      }
    } else {
      const [row] = openRows(this.board);
      if (row === undefined) return;
      const c = centre(this.layoutNow.rows[row].reading);
      this.glow.roundRect(c.x - 80 * r, c.y - 70 * r, 160 * r, 140 * r, 22).stroke({ width: 8, color: swatch.yellow.fill });
    }
  }

  /** The ghost finger: drag the piece the goal needs, tap Watch; at level 3, Watch first, then the bright chip, then Watch. */
  autotouch(): TouchIntent | null {
    if (this.finished || this.run || this.busy || !this.layoutNow) return null;
    const m = nextMove(this.brief, this.board, this.daysPlayed);
    if ('watch' in m) return this.watchButton ? { tap: { on: this.watchButton } } : null;
    if ('place' in m) {
      const tile = this.tiles.find((t) => t.kind === m.place.kind);
      const to = this.socketAt(m.place.socket);
      return tile ? { drag: { on: tile.node }, to: { on: this.ctx.stage, x: to.x, y: to.y }, pause: 0.3 } : null;
    }
    const tile = this.tiles.find((t) => t.chip === m.chip);
    const to = centre(this.layoutNow.rows[m.row].reading);
    return tile ? { drag: { on: tile.node }, to: { on: this.ctx.stage, x: to.x, y: to.y }, pause: 0.3 } : null;
  }
}

class HouseIcon extends WigglyIcon {
  constructor() {
    super(iconArt());
  }
}

/** A seeded house with its lamp lit and a friend under it. */
function sticker(seed: number): Container {
  const rng = new Rng(seed);
  return stickerArt(rng.pick(HOUSE_COLORS), rng.pick(SPECIES), rng.pick(['teal', 'brown', 'orange', 'pink', 'blue', 'purple'] as const));
}

export const helperHouse: GameModule = {
  id: 'helper-house',
  name: 'Helper House',
  titleLine: 'game.helper-house',
  region: 'cozy-village',
  skills: ['systems', 'logic', 'cause-effect', 'testing'],
  bands: ['preschool', 'prek', 'school'],
  levels: (band) => rangeFor(LEVELS, band),
  describeLevel: (level) => planFor(level).name,
  music: STYLES.paint,
  coplayHint: 'One of you picks the sensor and the rule; the other says what the helper did at each step of the day.',
  offScreen: 'Be the Helper: one of you is the "sensor" who calls "someone\'s here!" or "it\'s dark!", and the other is the door or the lamp who answers only when the rule says so.',
  hubIcon: () => new HouseIcon(),
  touchDemo: true,
  sticker,
  create: (ctx) => new HelperHouse(ctx),
};
