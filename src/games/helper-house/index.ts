/**
 * Helper House: put a sensor where it can see, pick the rule chip the empty row needs, tap Watch and see the house run
 * a whole day by itself while a friend reacts (level 1 wakes the door, level 2 lights the lamp at dusk, level 3 turns it
 * off again by morning, level 4 keeps a chilly nook comfy with a heater and a thermometer, level 5 moves the sun sensor out
 * of the lamp's own light, levels 6–7 drag lines on a warmth gauge so the nook stays comfy and the heater can rest).
 * Rules: ./logic.ts; definition: docs/definitions/helper-house.md.
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
import {
  actionArt, bubbleArt, cardArt, gaugeArt, gaugeLine, guessArt, House, iconArt, jarArt, lineRuleArt, lineTabArt, pauseArt, readingArt, sensorArt, SkyMark, socketArt, stepArt, stickerArt, tileArt,
  warmthFill, watchArt,
} from './art';
import {
  briefFor, centre, chipsFor, GAPS, gapAt, gapY, handleRect, helperFor, helpFor, HOUSE_COLORS, houseLayout, JAR, nextMove, offersSetup, onGauge, openRows, placeSensor, planFor, runDay, sameBoard, setLine,
  setRow, solutions, SPECIES, STEPS, Tally, TILE, warmthY, zoneOf,
  type Board, type Brief, type Chip, type GaugeLayout, type HouseLayout, type LinePiece, type Outcome, type Piece, type Pt, type Reading, type SensorKind, type Socket, type SunLevel, type Trace,
} from './logic';

const LEVELS: BandLevels = {
  preschool: { min: 1, max: 1 },
  prek: { min: 1, max: 3 },
  school: { min: 2, max: 7 },
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
  chip: Chip | null;
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
  /** Levels 4 and 6–7: the nook's warmth the thermometer (or the gauge) shows now. */
  warmthNow = 0;
  /** Levels 6–7: the line handles on the gauge, and where a dragged one would snap. */
  lineNodes: { piece: LinePiece; node: Container; handle: DragHandle }[] = [];
  private dragGap: { piece: LinePiece; gap: number } | null = null;
  gaugeColumn: Container | null = null;
  private gaugeDyn: Graphics | null = null;
  private jar: Container | null = null;
  /** Level 7: the pebbles dropped in the click jar so far today. */
  pebbles = 0;
  /** Level 6: the guess before the round's first day is still open (never scored or saved). */
  guessOpen = false;
  guessButtons: Container[] = [];
  /** Level 6: the first day's warmth, kept as a faint strip on the gauge. */
  private climb: number[] | null = null;

  constructor(private readonly ctx: GameContext) {
    this.view = ctx.view;
    this.brief = briefFor(ctx.level, ctx.rng);
    this.board = this.brief.board;
    this.warmthNow = this.brief.day.warmth;
    this.guessOpen = this.brief.level === 6;
    this.stepSeconds = ctx.demo ? 0.6 : 0.9;
    this.backdrop = new Backdrop({ sky: [0xbfe6ff, 0xfff6e0], hills: [0xa9e0d6, 0xc5e7a8], horizon: 0.55, clouds: 2, sun: false, seed: 173 }, ctx.view);
    this.veil.eventMode = 'none';
    this.glow.eventMode = 'none';
    ctx.stage.addChild(this.backdrop, this.veil, this.board_);
  }

  private get level() {
    return this.brief.level;
  }

  /** Level 4 is the nook: the sky stays a steady day and only the warmth changes. */
  private get nook() {
    return helperFor(this.level) === 'heater';
  }

  /** Levels 6–7: lines on the warmth gauge. */
  private get gauge() {
    return onGauge(this.level);
  }

  start() {
    this.build();
    void this.ctx.instruct(`hh.instruct.${this.level}` as LineId).then(() => {
      if (this.alive && this.guessOpen && !this.run) void this.ctx.say('hh.guess.ask');
    });
  }

  destroy() {
    this.alive = false;
    for (const t of this.tiles) t.handle.destroy();
    for (const n of this.lineNodes) n.handle.destroy();
    this.tiles = [];
    this.lineNodes = [];
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
    for (const n of this.lineNodes) n.handle.destroy();
    if (this.friend) this.ctx.untrack(this.friend);
    this.tiles = [];
    this.lineNodes = [];
    this.dragGap = null;
    this.gaugeColumn = this.gaugeDyn = this.jar = null;
    this.guessButtons = [];
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
    const house = new House({ w: l.house.w, h: l.house.h, lamp: this.level >= 2 && !this.nook, heater: this.nook, shed: this.level === 5 }, this.brief.house);
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
    const isChip = planFor(this.level).bench === 'chips';
    const benchKinds: (SensorKind | Chip)[] = isChip ? this.brief.chips : this.brief.sensors;
    benchKinds.forEach((k, i) => {
      const r = l.bench[i];
      const node = new Container();
      node.addChild(tileArt(r.w));
      node.addChild(isChip ? readingArt(k as Chip, r.w * 0.66) : sensorArt(k as SensorKind, r.w * 0.7));
      node.hitArea = new Rectangle(-r.w / 2 - 6, -r.h / 2 - 6, r.w + 12, r.h + 12);
      const at = centre(r);
      // A placed sensor sits in its socket instead of on the bench.
      const placedAt = !isChip && this.board.sensor.kind === k && this.board.sensor.socket !== null ? this.socketAt(this.board.sensor.socket) : null;
      node.position.copyFrom(placedAt ?? at);
      this.board_.addChild(node);
      const tile: Tile = { node, kind: isChip ? null : (k as SensorKind), chip: isChip ? (k as Chip) : null, handle: null as unknown as DragHandle };
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
    if (l.gauge) this.buildGauge(l.gauge, l);
    const pulse = new Graphics().circle(0, 0, 14).fill(swatch.yellow.fill).stroke({ width: 4, color: swatch.yellow.line });
    pulse.eventMode = 'none';
    pulse.visible = false;
    this.board_.addChild(pulse);
    this.pulse = pulse;
    this.board_.addChild(this.glow);
    this.redraw();
    this.showStill();
  }

  /** Levels 6–7: the gauge column (a tap moves the nearer line there), its line handles, the jar and the guess. */
  private buildGauge(g: GaugeLayout, l: HouseLayout) {
    const column = new Container();
    column.position.set(g.column.x, g.column.y);
    column.addChild(gaugeArt(g.column.w, g.pitch, GAPS + 1));
    column.hitArea = new Rectangle(-6, -6, g.column.w + 12, g.column.h + 12);
    onTap(column, (e) => this.tapGauge(column.toLocal(e.global).y + g.column.y), { cooldown: 250 });
    const dyn = new Graphics();
    dyn.eventMode = 'none';
    this.board_.addChild(column, dyn);
    this.gaugeColumn = column;
    this.gaugeDyn = dyn;
    const pieces: LinePiece[] = this.level === 6 ? ['line'] : ['on-line', 'off-line'];
    for (const piece of pieces) {
      const r = handleRect(g, piece, this.gapOf(piece));
      const node = new Container();
      node.addChild(lineTabArt(piece, r.w));
      node.hitArea = new Rectangle(-r.w / 2 - 6, -r.h / 2 - 6, r.w + 12, r.h + 12);
      node.position.copyFrom(centre(r));
      this.board_.addChild(node);
      const entry = { piece, node, handle: null as unknown as DragHandle };
      entry.handle = draggable(node, this.ctx.tw, {
        onPick: () => this.pickedLine(entry.handle),
        onMove: (_x, y) => this.movedLine(piece, node, y),
        onDrop: (_x, y) => this.droppedLine(piece, y),
      });
      this.lineNodes.push(entry);
    }
    if (g.jar) {
      const jar = new Container();
      jar.eventMode = 'none';
      jar.position.set(g.jar.x, g.jar.y);
      this.board_.addChild(jar);
      this.jar = jar;
    }
    if (this.guessOpen && !this.run) {
      // The guess: two picture buttons over the house; either one (or Watch) starts the first day.
      const size = 124;
      const cy = l.house.y + l.house.h * 0.42;
      (['faster', 'same'] as const).forEach((choice, i) => {
        const b = new Container();
        b.addChild(guessArt(choice, size));
        b.hitArea = new Rectangle(-size / 2 - 6, -size / 2 - 6, size + 12, size + 12);
        b.position.set(l.house.x + l.house.w / 2 + (i === 0 ? -1 : 1) * (size / 2 + 18), cy);
        onTap(b, () => this.guess(choice), { cooldown: 400 });
        this.board_.addChild(b);
        this.guessButtons.push(b);
      });
    }
  }

  /** A line's gap on the board now (or while dragged, where it would snap). */
  private gapOf(piece: LinePiece): number {
    if (this.dragGap?.piece === piece) return this.dragGap.gap;
    const lines = this.board.lines!;
    return piece === 'off-line' ? lines.off : lines.on;
  }

  private pickedLine(handle: DragHandle) {
    if (this.finished || this.busy) { handle.enabled = false; return; }
    if (this.run) this.stopRun();
    sfx.pop(6);
  }

  private movedLine(piece: LinePiece, node: Container, y: number) {
    const g = this.layoutNow?.gauge;
    if (!g) return;
    // The handle slides up and down its lane only; the line snaps to the nearest gap with a click.
    node.x = centre(handleRect(g, piece, 1)).x;
    const gap = gapAt(g, y);
    const snapped = setLine(this.board, piece, gap).lines!;
    const at = piece === 'off-line' ? snapped.off : snapped.on;
    if (this.dragGap?.gap !== at) {
      if (this.dragGap) sfx.tick();
      this.dragGap = { piece, gap: at };
      this.drawGauge();
    }
  }

  private droppedLine(piece: LinePiece, y: number): boolean {
    const g = this.layoutNow?.gauge;
    this.dragGap = null;
    if (!g || this.finished || this.busy) return false;
    const next = setLine(this.board, piece, gapAt(g, y));
    if (sameBoard(next, this.board)) { this.drawGauge(); return false; }
    sfx.tick();
    this.change(next, piece);
    return true;
  }

  /** A tap on the gauge column moves the nearer line to the tapped gap. */
  tapGauge(y: number) {
    const g = this.layoutNow?.gauge;
    if (!g || this.finished || this.busy || this.lineNodes.some((n) => n.handle.dragging)) return;
    if (this.run) this.stopRun();
    const gap = gapAt(g, y);
    const { on, off } = this.board.lines!;
    // The nearer line; when they sit together, a tap above pulls the off line up and a tap below the on line down.
    const dOn = Math.abs(gap - on);
    const dOff = Math.abs(gap - off);
    const piece: LinePiece = this.level === 6 ? 'line' : dOn < dOff ? 'on-line' : dOff < dOn ? 'off-line' : gap >= off ? 'off-line' : 'on-line';
    const next = setLine(this.board, piece, gap);
    if (sameBoard(next, this.board)) return;
    sfx.tick();
    this.change(next, piece);
  }

  /** Level 6's guess: spoken on touch-down, never counted, and it starts the first day. */
  guess(choice: 'faster' | 'same') {
    if (!this.guessOpen || this.finished || this.busy || this.run) return;
    sfx.pop(choice === 'faster' ? 9 : 6);
    void this.ctx.say(choice === 'faster' ? 'hh.guess.faster' : 'hh.guess.same');
    this.startRun();
  }

  /** The gauge's moving parts: the warmth fill, the first day's faint climb, today's climb so far, the lines; the jar's pebbles. */
  private drawGauge() {
    const g = this.layoutNow?.gauge;
    const d = this.gaugeDyn;
    if (!g || !d) return;
    d.clear();
    d.position.set(g.column.x, g.column.y);
    warmthFill(d, g.column.w, g.pitch, GAPS + 1, this.warmthNow);
    const dot = (step: number) => 16 + (step * (g.column.w - 32)) / (STEPS - 1);
    if (this.climb) for (let i = 0; i < this.climb.length; i++) d.circle(dot(i), warmthY(g, this.climb[i]) - g.column.y, 6).fill({ color: 0x8a93a6, alpha: 0.45 });
    const r = this.run;
    if (r) {
      const upto = r.shown.has('act') ? r.step : r.step - 1;
      for (let i = 0; i <= upto && i < STEPS; i++) d.circle(dot(i), warmthY(g, r.outcome.trace[i].warmth) - g.column.y, 7).fill(swatch.purple.fill).stroke({ width: 2, color: 0xffffff });
    }
    const glowing = this.tally.glowing;
    for (const n of this.lineNodes) {
      const gap = this.gapOf(n.piece);
      const y = gapY(g, gap) - g.column.y;
      const toLeft = n.piece !== 'off-line';
      gaugeLine(d, toLeft ? -16 : 0, toLeft ? g.column.w : g.column.w + 16, y, glowing === n.piece);
      if (!n.handle.dragging) n.node.position.copyFrom(centre(handleRect(g, n.piece, gap)));
    }
    if (this.jar && g.jar) {
      for (const c of this.jar.removeChildren()) c.destroy({ children: true });
      this.jar.addChild(jarArt(g.jar.w, g.jar.h, this.pebbles));
    }
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
      // A fixed sensor (levels 3–4) has no bench tile, so the socket draws it; the nook's thermometer shows the warmth now.
      if (filled && this.nook) node.addChild(readingArt(zoneOf(this.warmthNow), l.sockets[i].w * 0.8));
      else if (filled && !this.tiles.some((t) => t.kind === this.board.sensor.kind)) node.addChild(sensorArt(this.board.sensor.kind!, l.sockets[i].w * 0.7));
    });
    this.board.rows.forEach((row, i) => {
      const n = this.rowNodes[i];
      const lit = !!this.run && this.run.outcome.trace[this.run.step]?.matched === i && this.run.shown.has('card');
      for (const c of n.reading.removeChildren()) c.destroy();
      n.reading.addChild(cardArt(l.rows[i].reading.w, l.rows[i].reading.h, lit, row.reading === null && !this.gauge));
      if (row.reading !== null) n.reading.addChild(readingArt(row.reading, 76));
      else if (this.gauge) n.reading.addChild(lineRuleArt(i === 0 ? 'below' : 'above', 84));
      for (const c of n.action.removeChildren()) c.destroy();
      n.action.addChild(cardArt(l.rows[i].action.w, l.rows[i].action.h, lit), actionArt(row.action, 76, helperFor(this.level)));
    });
    const w = this.watchButton;
    if (w) {
      for (const c of w.removeChildren()) c.destroy();
      const running = !!this.run && !this.run.paused;
      w.addChild(finish({ w: l.watch.w, h: l.watch.h, corner: 30 }, running ? swatch.orange : swatch.green), running ? pauseArt() : watchArt());
    }
    this.drawGauge();
    if (this.undoButton) this.undoButton.alpha = this.history.length ? 1 : 0.45;
    if (this.stepButton) this.stepButton.alpha = this.run ? 1 : 0.7;
  }

  /** The house at rest: a dim morning, the helper off, the friend at its spot. */
  private showStill() {
    const steady = this.level === 1 || this.nook;
    this.sky?.set(steady ? 'bright' : 'dim');
    this.setVeil(steady ? 'bright' : 'dim');
    this.house?.setDoor(0);
    this.house?.setLamp(false);
    this.house?.setHeater(false);
    this.house?.setInside(0);
    this.pebbles = 0;
    if (this.nook && this.warmthNow !== this.brief.day.warmth) {
      this.warmthNow = this.brief.day.warmth;
      this.redraw();
    }
    if (this.friend) {
      this.friend.visible = this.level >= 2;
      this.friend.alpha = 1;
      this.friend.setMood(this.nook ? this.nookMood(this.warmthNow) : 'calm');
    }
    if (this.bubble) this.bubble.visible = false;
    if (this.pulse) this.pulse.visible = false;
  }

  /** The friend in the nook shivers (sad) when cool, is comfy (happy) when warm, and is startled when hot. */
  private nookMood(warmth: number) {
    const z = zoneOf(warmth);
    return z === 'cool' ? 'sad' as const : z === 'warm' ? 'happy' as const : 'surprised' as const;
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
        if (this.board.sensor.kind === tile.kind && this.board.sensor.socket !== null && (this.level === 1 || this.level === 5)) {
          this.change(placeSensor(this.board, tile.kind, null), 'sensor');
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
    this.change(setRow(this.board, row, tile.chip), row);
    void this.ctx.say(this.nook ? 'hh.row-set.4' : 'hh.row-set');
    return true;
  }

  /** The open row nearest a drop, within reach of its reading card. */
  private rowUnder(x: number, y: number): number | null {
    const l = this.layoutNow;
    if (!l) return null;
    let best: number | null = null;
    let bd = TILE * 0.9;
    for (const i of openRows(this.board)) {
      const c = centre(l.rows[i].reading);
      const d = Math.hypot(c.x - x, c.y - y);
      if (d < bd) { bd = d; best = i; }
    }
    return best;
  }

  /** A tap on a chip puts it in the first empty row (or the first open row when every row is filled). */
  tapChip(tile: Tile) {
    if (this.finished || this.busy || tile.handle.dragging || tile.chip === null) return;
    if (this.run) this.stopRun();
    const open = openRows(this.board);
    const row = open.find((i) => this.board.rows[i].reading === null) ?? open[0];
    if (row === undefined) return;
    sfx.tick();
    this.change(setRow(this.board, row, tile.chip), row);
    void this.ctx.say(this.nook ? 'hh.row-set.4' : 'hh.row-set');
  }

  /** A tap on an open row cycles its reading through the chips. */
  cycleRow(i: number) {
    if (this.finished || this.busy) return;
    if (this.run) this.stopRun();
    const now = this.board.rows[i].reading as Chip | null;
    const order = chipsFor(this.level);
    const next = now === null ? order[0] : order[(order.indexOf(now) + 1) % order.length];
    sfx.pop(8);
    this.change(setRow(this.board, i, next), i);
  }

  private change(board: Board, piece: Piece) {
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
    for (const i of openRows(b)) this.tally.changed(i);
    if (b.lines) for (const p of ['line', 'on-line', 'off-line'] as const) this.tally.changed(p);
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
    if (!this.gauge || this.daysPlayed > 0) void this.ctx.say('hh.watch');
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
    if (this.guessOpen) {
      // The guess closes when the first day starts, answered or not.
      this.guessOpen = false;
      for (const b of this.guessButtons) b.destroy({ children: true });
      this.guessButtons = [];
    }
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
    if (fire('world', 0) && !this.nook) {
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
      // Level 5: the lamp's own light switched it off in the dark; a low tick and the friend blinks at the flick.
      const flicked = this.level === 5 && t.sun === 'dark' && !t.helperOn && r.step > 0 && r.outcome.trace[r.step - 1].helperOn;
      // Level 7: each switch drops a pebble in the jar with a soft click, and the friend blinks awake; a ninth rolls out.
      const before = r.step > 0 ? r.outcome.trace[r.step - 1].helperOn : false;
      const clicked = this.level === 7 && t.helperOn !== before;
      if (clicked) {
        this.pebbles++;
        if (this.pebbles > JAR) sfx.marimba(1, 0.3);
        else sfx.tick();
        if (this.pebbles === 1 && this.daysPlayed === 0) void this.ctx.say('hh.click');
      }
      this.showHelper(t);
      if (clicked && this.friend) this.friend.setMood('surprised', 0.3);
      else if (this.nook && this.friend) this.friend.setMood(this.nookMood(t.warmth));
      else if (flicked && this.friend) { sfx.marimba(1, 0.3); this.friend.setMood('surprised', 0.4); }
      else if (this.level >= 2 && this.friend) this.friend.setMood(t.sun === 'dark' && !t.helperOn ? 'sad' : t.helperOn && t.sun === 'dark' ? 'happy' : 'calm');
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
    const g = this.layoutNow?.gauge;
    if (g) return { x: g.column.x + g.column.w / 2, y: warmthY(g, this.warmthNow) };
    const s = this.board.sensor.socket;
    return s !== null && this.brief.sockets.includes(s) ? this.socketAt(s) : centre(this.layoutNow!.bench[0] ?? this.layoutNow!.house);
  }

  private helperPoint(): Pt {
    const h = this.house!;
    const at = this.level === 1 ? h.doorAt : this.nook ? h.heaterAt : h.lampAt;
    return { x: h.x + at.x, y: h.y + at.y };
  }

  private showBubble(reading: Reading) {
    const b = this.bubble;
    // On the gauge the warmth itself is the reading: no bubble.
    if (!b || this.gauge) return;
    for (const c of b.removeChildren()) c.destroy();
    b.addChild(bubbleArt(84), readingArt(reading, 60));
    const at = this.sensorPoint();
    b.position.set(at.x, at.y - TILE / 2 - 56);
    b.visible = true;
    sfx.pop(reading === 'near' || reading === 'bright' ? 9 : reading === 'dim' ? 7 : 5);
  }

  private showHelper(t: Trace) {
    const { helperOn: on, opened, inside, waiting } = t;
    const h = this.house;
    if (!h) return;
    if (this.nook) {
      h.setHeater(on);
      this.warmthNow = t.warmth;
      this.redraw();
      return;
    }
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
    if (this.level === 6 && this.daysPlayed === 1) {
      // The guess's answer, whichever was picked; the first day's climb stays on the gauge to compare.
      this.climb = o.trace.map((t) => t.warmth);
      void this.ctx.say('hh.guess.truth');
    }
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
    const p = h.placed;
    const line: LineId = p === 'sensor' ? `hh.help.sensor.${this.level}` as LineId
      : p === 'line' ? 'hh.help.6' : p === 'on-line' ? 'hh.help.7.on' : p === 'off-line' ? 'hh.help.7.off'
        : this.nook ? `hh.help.row.4.${p === 0 ? 'on' : 'off'}` as LineId : 'hh.help.row';
    void this.ctx.say(line);
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
    for (const i of openRows(right)) this.tally.changed(i);
    if (right.lines) for (const p of ['line', 'on-line', 'off-line'] as const) this.tally.changed(p);
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
    if (g === null || this.finished || !this.layoutNow) return;
    const r = 1 + 0.05 * Math.sin(this.clock * 5);
    if (g === 'line' || g === 'on-line' || g === 'off-line') {
      // The line to move: its handle glows (the line itself is drawn yellow).
      const n = this.lineNodes.find((x) => x.piece === g);
      if (n) this.glow.roundRect(n.node.x - 70 * r, n.node.y - 70 * r, 140 * r, 140 * r, 26).stroke({ width: 8, color: swatch.yellow.fill });
    } else if (g === 'sensor' && this.level === 5) {
      // The sensor itself, wherever it sits: its place is the one thing to change.
      const tile = this.tiles.find((t) => t.kind === 'sun');
      if (tile) this.glow.circle(tile.node.x, tile.node.y, 76 * r).stroke({ width: 8, color: swatch.yellow.fill });
    } else if (g === 'sensor') {
      const l = this.layoutNow;
      const socketIndex = this.level === 1 ? this.brief.sockets.indexOf('door') : 0;
      const s = centre(l.sockets[socketIndex]);
      this.glow.circle(s.x, s.y, 76 * r).stroke({ width: 8, color: swatch.yellow.fill });
      const tile = this.tiles.find((t) => t.kind === (this.level === 1 ? 'eye' : 'sun'));
      if (tile && this.board.sensor.socket === null || (this.level === 2 && tile && this.board.sensor.kind !== 'sun')) {
        this.glow.circle(tile!.node.x, tile!.node.y, 76 * r).stroke({ width: 8, color: swatch.yellow.fill });
      }
    } else {
      const c = centre(this.layoutNow.rows[g].reading);
      this.glow.roundRect(c.x - 80 * r, c.y - 70 * r, 160 * r, 140 * r, 22).stroke({ width: 8, color: swatch.yellow.fill });
    }
  }

  /**
   * The ghost finger: drag the piece the goal needs, tap Watch; at level 3, Watch first, then the bright chip, then
   * Watch; at level 4, cool to the on row, warm to the off row, then Watch; at level 5, Watch (the lamp flickers), the
   * sensor up to the roof, then Watch; at level 6 the line down to gap 4, then Watch (it skips the guess); at level 7,
   * Watch (a pebble rolls out), the off line up one gap, then Watch.
   */
  autotouch(): TouchIntent | null {
    if (this.finished || this.run || this.busy || !this.layoutNow) return null;
    const m = nextMove(this.brief, this.board, this.daysPlayed);
    if ('watch' in m) return this.watchButton ? { tap: { on: this.watchButton } } : null;
    if ('line' in m) {
      const n = this.lineNodes.find((x) => x.piece === m.line);
      const g = this.layoutNow.gauge;
      if (!n || !g) return null;
      const to = centre(handleRect(g, m.line, m.gap));
      return { drag: { on: n.node }, to: { on: this.ctx.stage, x: to.x, y: to.y }, pause: 0.3 };
    }
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
  challenge: 'logic',
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
