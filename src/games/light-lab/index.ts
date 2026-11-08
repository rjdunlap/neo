import { Circle, Container, Graphics, Rectangle, type FederatedPointerEvent } from 'pixi.js';
import { owlArt } from '../../art/animals';
import type { Critter } from '../../art/critter';
import { ink, swatch, wood } from '../../art/palette';
import { STYLES } from '../../audio/music';
import { sfx } from '../../audio/sfx';
import { nextSpot, routeStep, type Spot } from '../../couch/focus';
import { idle, type CouchControls } from '../../engine/controller';
import { draggable, type DragHandle } from '../../engine/drag';
import { onTap } from '../../engine/input';
import { ease } from '../../engine/tween';
import type { View } from '../../engine/view';
import { rangeFor } from '../../progress/difficulty';
import { label } from '../../ui/text';
import type { Game, GameContext, GameModule, TouchIntent } from '../types';
import { courseBoards, courseMinimum, isLightCourse } from './course';
import {
  beamEnd,
  boardWith,
  cloudCells,
  DROP_TILT,
  findLines,
  flowerCount,
  freeCells,
  hintMirror,
  hintThing,
  LEVELS,
  makePuzzle,
  materialPuzzle,
  materialsRound,
  meetsGoal,
  minTurns,
  mirrorAt,
  nearestPlacement,
  outcome,
  owlCell,
  placeHint,
  planFor,
  predictionChoices,
  shadowCells,
  solved,
  THING_WORDS,
  trace,
  traceAll,
  whyNot,
  whyNotMaterial,
  type BeamEnd,
  type LightPlan,
  type LightPuzzle,
  type MaterialRound,
  type Outcome,
  type Placed,
  type Stuff,
  type Tilt,
} from './logic';

import {
  Bloom,
  CARD_H,
  CARD_W,
  LightIcon,
  TINT_COLOR,
  cardArt,
  cloudArt,
  glassArt,
  halfMirrorArt,
  mirrorArt,
  objectArt,
  outcomeArt,
  rockArt,
  standArt,
  sticker,
  sunArt,
} from './art';

const CELL = 100;
/** The tray under the board on levels 8–9: its gap below the board, height and slot spacing. */
const TRAY_GAP = 34;
const TRAY_H = 124;
const TRAY_STEP = 140;
/** A drag that travels less than this from where it was picked up is a tap: on a placed mirror, it turns it. */
const TAP_SLOP = 24;
/** Level 10: a couch spot on a cloud cell rather than a mirror or the sun. */
const CLOUD = -100;
/** Level 11: the picture row (or tray) under the board: its gap, card size and spacing. */
const ROW_GAP = 30;
const CARD_STEP = 210;

/** A tray mirror: in the tray (`cell` null) or placed on the board. */
interface TrayMirror {
  node: Container;
  handle: DragHandle;
  slot: { x: number; y: number };
  cell: { x: number; y: number } | null;
  tilt: Tilt;
  moved: boolean;
}

class LightLab implements Game {
  readonly plan: LightPlan;
  puzzle!: LightPuzzle;
  tilts: Tilt[] = [];
  index = -1;
  misses = 0;
  hints = 0;
  busy = true;
  finished = false;
  /** Mirror nodes by thing index. */
  readonly mirrors = new Map<number, Container>();
  readonly sun = new Container();
  /** Levels 8–9: the mirrors in the tray or placed from it. */
  readonly trayMirrors: TrayMirror[] = [];

  private readonly board = new Container();
  private readonly floor = new Graphics();
  private readonly pieces = new Container();
  private readonly trayLayer = new Container();
  /** Level 10: the clouds by cell key, the beam where it shows outside them, and a wrong guess's ghost beam. */
  readonly clouds = new Map<string, Container>();
  private readonly cloudLayer = new Container();
  private readonly peek = new Graphics();
  private readonly ghost = new Container();
  /** Level 10's hint: the sun's row and the flower's column, glowing. */
  private findLine: { row: number; col: number } | null = null;
  /** The pale cell under a carried mirror, where it will land. */
  private readonly hover = new Graphics();
  private readonly beam = new Graphics();
  private readonly glow = new Graphics();
  private readonly blooms = new Map<number, Bloom>();
  private view: View;
  private wrongs = 0;
  private hinted = -1;
  /** Tray levels: the glowing cell for a mirror to go, or the glowing placed mirror to turn. */
  private hintCell: { x: number; y: number } | null = null;
  private hintTray: TrayMirror | null = null;
  private clock = 0;
  /** Couch face-off score: turns beyond the ones this board needs, plus shines that missed, added up (lower is better). */
  excess = 0;
  private taps = 0;
  private needed = 0;
  private shinesMissed = 0;
  // Couch play: a ring over the mirrors (and the sun on planning levels).
  private spots: (Spot & { thing: number })[] = [];
  private focus = 0;
  private couchOn = false;
  private readonly ring = new Graphics();
  private botWait = 1;
  private readonly predictionMarks = new Map<string, Container>();
  /** Couch challenge course: fixed boards in a row, scored by turns plus missed shines. Null in ordinary play, where boards are generated. */
  private readonly course: { boards: LightPuzzle[]; minimum: number } | null = null;
  /** Level 11: the round's boards, the picture row or tray under the board, the shadow wash, the owl and the glowing tray card. */
  readonly round: MaterialRound | null = null;
  readonly cards: Container[] = [];
  private readonly row = new Container();
  private readonly shadow = new Graphics();
  private owl: Critter | null = null;
  private hintCard = -1;
  private done: number[] = [];
  /** Tries already spent on the board we are resuming, so leaving and coming back cannot erase them. */
  private carry = 0;
  private carried = 0;
  private assisted = false;
  private told = false;
  private courseLine = '';

  private get predicting() {
    return this.plan.mode === 'predict' && this.index < 3;
  }
  /** Level 11: the first three boards are free guesses; the last two are judged choices. */
  private get guessing() {
    return this.plan.mode === 'materials' && this.index < 3;
  }
  private get choosing() {
    return this.plan.mode === 'materials' && this.index >= 3;
  }
  private get planning() {
    return this.plan.mode === 'plan' || (this.plan.mode === 'predict' && this.index >= 3);
  }

  constructor(private readonly ctx: GameContext) {
    this.view = ctx.view;
    this.plan = planFor(ctx.level);
    const run = ctx.couch?.course;
    if (run && isLightCourse(run.id)) {
      this.course = { boards: courseBoards(run.id), minimum: courseMinimum(run.id) };
      this.index = run.resume.board - 1;
      this.done = run.resume.done.slice();
      this.carry = run.resume.attempts;
      this.assisted = run.resume.assisted;
    }
    this.sun.addChild(sunArt());
    this.sun.hitArea = new Circle(0, 0, 55);
    onTap(this.sun, () => void this.shine(), { cooldown: 500 });
    this.beam.eventMode = 'none';
    this.glow.eventMode = 'none';
    this.ring.eventMode = 'none';
    this.hover.eventMode = 'none';
    this.peek.eventMode = 'none';
    this.ghost.eventMode = 'none';
    this.shadow.eventMode = 'none';
    if (this.plan.mode === 'materials') this.round = materialsRound(ctx.rng);
    this.board.addChild(
      this.floor,
      this.hover,
      this.shadow,
      this.beam,
      this.pieces,
      this.cloudLayer,
      this.peek,
      this.ghost,
      this.sun,
      this.trayLayer,
      this.row,
      this.glow,
      this.ring,
    );
    ctx.stage.addChild(this.board);
  }

  start() {
    void this.next();
  }

  resize(v: View) {
    this.view = v;
    if (!this.puzzle) return;
    const { cols, rows } = this.puzzle;
    const tall =
      rows * CELL + (this.puzzle.tray.length ? TRAY_GAP + TRAY_H : this.round ? ROW_GAP + CARD_H : 0);
    this.board.position.set((v.w - cols * CELL) / 2, Math.max(110, (v.h - tall) / 2 + 20));
  }

  update(dt: number) {
    this.clock += dt;
    const g = this.glow.clear();
    if (this.hinted >= 0 && !this.busy) {
      const t = this.puzzle.things[this.hinted];
      g.circle((t.x + 0.5) * CELL, (t.y + 0.5) * CELL, 46 + 4 * Math.sin(this.clock * 6)).stroke({
        width: 7,
        color: swatch.yellow.fill,
      });
    }
    if (this.hintCell && !this.busy) {
      const grow = 3 * Math.sin(this.clock * 6);
      g.roundRect(
        this.hintCell.x * CELL + 2 - grow,
        this.hintCell.y * CELL + 2 - grow,
        CELL - 4 + 2 * grow,
        CELL - 4 + 2 * grow,
        16,
      )
        .fill({ color: 0xfff3a0, alpha: 0.35 })
        .stroke({ width: 7, color: swatch.yellow.fill });
    }
    if (this.findLine && !this.busy) {
      const { cols, rows } = this.puzzle;
      const grow = 3 * Math.sin(this.clock * 6);
      g.roundRect(-grow, this.findLine.row * CELL - grow, cols * CELL + 2 * grow, CELL + 2 * grow, 22);
      g.roundRect(this.findLine.col * CELL - grow, -grow, CELL + 2 * grow, rows * CELL + 2 * grow, 22);
      g.fill({ color: 0xfff3a0, alpha: 0.2 }).stroke({ width: 7, color: swatch.yellow.fill });
    }
    if (this.hintCard >= 0 && !this.busy) {
      const c = this.cards[this.hintCard];
      const grow = 4 * Math.sin(this.clock * 6);
      g.roundRect(
        c.x - CARD_W / 2 - 8 - grow,
        c.y - CARD_H / 2 - 8 - grow,
        CARD_W + 16 + 2 * grow,
        CARD_H + 16 + 2 * grow,
        28,
      ).stroke({ width: 7, color: swatch.yellow.fill });
    }
    this.owl?.update(dt);
    if (this.hintTray?.cell && !this.busy && !this.hintTray.handle.dragging) {
      const c = this.at(this.hintTray.cell.x, this.hintTray.cell.y);
      g.circle(c.x, c.y, 46 + 4 * Math.sin(this.clock * 6)).stroke({ width: 7, color: swatch.yellow.fill });
    }
    const ring = this.ring.clear();
    const spot = this.couchOn && !this.busy && !this.finished ? this.spots[this.focus] : undefined;
    if (spot) {
      const c = this.at(spot.x, spot.y);
      ring.circle(c.x, c.y, 52 + 3 * Math.sin(this.clock * 6)).stroke({ width: 8, color: swatch.teal.line });
    }
    // On planning levels the sun pulses to show it can be tapped.
    if (this.planning && !this.busy) this.sun.scale.set(1 + 0.05 * Math.sin(this.clock * 4));
  }

  destroy() {
    this.clearTray();
  }

  /** Couch play: the stick moves the ring, the bottom button turns a mirror (or shines on the sun), the left button shines. */
  control(input: CouchControls) {
    this.couchOn = true;
    if (this.busy || this.finished || !this.spots.length) return;
    for (const p of input.players) {
      if (p.direction >= 0) this.focus = nextSpot(this.spots, this.focus, p.direction);
      if (p.undo) void this.shine();
      if (p.action) {
        const t = this.spots[this.focus].thing;
        if (t === CLOUD) void this.pick(this.spots[this.focus]);
        else if (t <= -2) void this.predict(predictionChoices(this.puzzle)[-t - 2]);
        else if (t < 0) void this.shine();
        else this.turn(t);
      }
    }
  }

  /** The "watch me" demo: turn each mirror on the way that still points the wrong way, then shine. */
  autoplay(dt: number): CouchControls {
    const out = idle();
    out.players[0].active = true;
    this.botWait -= dt;
    if (this.busy || this.finished || this.botWait > 0 || !this.spots.length) return out;
    const hidden = this.puzzle.things.find((t) => t.kind === 'mirror')!;
    const want = hintMirror(this.puzzle, this.tilts);
    const target =
      this.plan.mode === 'find'
        ? this.spots.findIndex((sp) => sp.x === hidden.x && sp.y === hidden.y)
        : this.predicting
          ? 0
          : want >= 0
            ? this.spots.findIndex((sp) => sp.thing === want)
            : this.spots.findIndex((sp) => sp.thing < 0);
    if (target < 0) return out;
    if (target === this.focus) {
      out.players[0].action = true;
      this.botWait = 1;
    } else {
      out.players[0].direction = routeStep(this.spots, this.focus, target);
      this.botWait = 0.45;
    }
    return out;
  }

  /**
   * The ghost finger on the how-to card: tap the mirror the solution still needs turned (the same one the hint names),
   * and on planning levels, with every mirror right, the sun to shine.
   */
  autotouch(): TouchIntent | null {
    if (this.busy || this.finished || !this.puzzle) return null;
    // Level 11: a guess may be any picture, so the demo taps the true one; a choice taps the thing that works.
    if (this.round) {
      const at = this.guessing
        ? (['through', 'bounce', 'stop'] as Outcome[]).indexOf(
            outcome(this.round.guesses[this.index].material),
          )
        : hintThing(this.round.choices[this.index - 3]);
      return this.cards[at] ? { tap: { on: this.cards[at] } } : null;
    }
    if (this.predicting) {
      const answer = predictionChoices(this.puzzle)[0];
      const target = answer && this.predictionMarks.get(answer.key);
      return target ? { tap: { on: target } } : null;
    }
    if (this.puzzle.tray.length) return this.trayTouch();
    if (this.plan.mode === 'find') {
      const m = this.puzzle.things.find((t) => t.kind === 'mirror')!;
      const cloud = this.clouds.get(`${m.x},${m.y}`);
      return cloud ? { tap: { on: cloud } } : null;
    }
    const want = hintMirror(this.puzzle, this.tilts);
    const mirror = want >= 0 ? this.mirrors.get(want) : undefined;
    if (mirror) return { tap: { on: mirror } };
    return this.planning ? { tap: { on: this.sun } } : null;
  }

  /** Tray levels: carry a mirror to the cell the hint names (from the tray, or a placed one the answer leaves out), turn what needs turning, then shine. */
  private trayTouch(): TouchIntent | null {
    const placed = this.placed();
    const h = placeHint(this.puzzle, this.tilts, placed);
    if (!h) return { tap: { on: this.sun } };
    if ('mirror' in h) return { tap: { on: this.mirrors.get(h.mirror)! } };
    if ('placed' in h) return { tap: { on: this.onBoard()[h.placed].node } };
    const near = nearestPlacement(this.puzzle, this.tilts, placed);
    const m =
      this.trayMirrors.find((t) => !t.cell) ??
      this.onBoard().find((t) => !near?.placed.some((w) => w.x === t.cell!.x && w.y === t.cell!.y));
    if (!m) return null;
    const to = this.at(h.cell.x, h.cell.y);
    return { drag: { on: m.node }, to: { on: this.board, x: to.x, y: to.y }, pause: 0.7 };
  }

  /** The placed tray mirrors, in tray order, with their cells. */
  private onBoard() {
    return this.trayMirrors.filter((m) => m.cell) as (TrayMirror & { cell: { x: number; y: number } })[];
  }

  private placed(): Placed[] {
    return this.onBoard().map((m) => ({ x: m.cell.x, y: m.cell.y, tilt: m.tilt }));
  }

  /** The board as it is now, placed mirrors included, and the tilts to match. */
  private current(): [LightPuzzle, Tilt[]] {
    return boardWith(this.puzzle, this.tilts, this.placed());
  }

  private at(x: number, y: number) {
    return { x: (x + 0.5) * CELL, y: (y + 0.5) * CELL };
  }

  private async next() {
    this.busy = true;
    this.index++;
    this.wrongs = 0;
    this.hinted = -1;
    this.hintCell = null;
    this.hintTray = null;
    this.findLine = null;
    this.hintCard = -1;
    if (this.index >= (this.course?.boards.length ?? this.plan.puzzles)) return void this.finale();
    this.puzzle = this.course
      ? this.course.boards[this.index]
      : this.round
        ? this.materialBoard()
        : makePuzzle(this.plan, this.ctx.rng);
    this.tilts = [...this.puzzle.start];
    this.build();
    this.carried = this.carry;
    this.carry = 0;
    this.resize(this.view);
    this.board.alpha = 0;
    await this.ctx.tw.to(this.board, { alpha: 1 }, { duration: 0.3 });
    this.busy = false;
    if (this.plan.mode === 'live') this.drawBeam();
    this.report();
    if (this.course) return this.courseInstruction();
    if (this.choosing) return this.ctx.instruct(`light.mat.ask.${this.round!.choices[this.index - 3].goal}`);
    if (this.told) return;
    this.told = true;
    if (this.round) return this.ctx.instruct('light.materials');
    if (this.plan.mode === 'find') return this.ctx.instruct('light.find');
    if (this.plan.tray) return this.ctx.instruct(this.plan.tray > 1 ? 'light.place.two' : 'light.place');
    if (this.plan.mode === 'predict') return this.ctx.instruct('light.predict');
    if (this.plan.split) return this.ctx.instruct('light.split');
    if (this.plan.glass) return this.ctx.instruct('light.color');
    if (this.plan.flowers === 2) return this.ctx.instruct('light.two');
    return this.ctx.instruct(this.plan.mode === 'live' ? 'light.live' : 'light.plan');
  }

  private build() {
    const p = this.puzzle;
    this.clearTray();
    this.pieces.removeChildren().forEach((c) => c.destroy({ children: true }));
    this.taps = 0;
    this.shinesMissed = 0;
    this.needed = minTurns(p, p.start);
    this.predictionMarks.clear();
    this.cloudLayer.removeChildren().forEach((c) => c.destroy({ children: true }));
    this.clouds.clear();
    this.peek.clear();
    if (this.plan.mode === 'find') {
      this.spots = cloudCells(p).map((c) => ({ ...c, thing: CLOUD }));
      this.focus = 0;
    } else if (this.predicting) {
      const choices = predictionChoices(p).slice(0, 3);
      this.spots = choices.map((end, i) => ({ x: end.targetX, y: end.targetY, thing: -2 - i }));
      this.focus = 0;
    } else {
      this.spots = p.things.flatMap((t, i) =>
        t.kind === 'mirror' || t.kind === 'half' ? [{ x: t.x, y: t.y, thing: i }] : [],
      );
      if (this.planning) this.spots.push({ x: p.sunCol, y: p.sunRow, thing: -1 });
      this.focus = Math.max(
        0,
        this.spots.findIndex((sp) => sp.thing === p.pathMirrors[0]),
      );
    }
    this.mirrors.clear();
    this.blooms.clear();
    this.beam.clear();
    const f = this.floor.clear();
    f.roundRect(-14, -14, p.cols * CELL + 28, p.rows * CELL + 28, 26)
      .fill(wood.light)
      .stroke({ width: 6, color: wood.line });
    for (let x = 0; x < p.cols; x++)
      for (let y = 0; y < p.rows; y++)
        f.roundRect(x * CELL + 4, y * CELL + 4, CELL - 8, CELL - 8, 14).fill(
          (x + y) % 2 ? 0xf3f7ff : 0xe8f0fb,
        );
    if (p.tray.length) this.buildTray(f);
    const s = this.at(p.sunCol, p.sunRow);
    this.sun.position.set(s.x, s.y);
    if (this.round) this.buildMaterials();
    p.things.forEach((t, i) => {
      const c = this.at(t.x, t.y);
      let node: Container;
      if (t.kind === 'mirror' || t.kind === 'half') {
        node = t.kind === 'half' ? halfMirrorArt() : mirrorArt();
        node.hitArea = new Circle(0, 0, CELL / 2);
        onTap(node, () => this.turn(i), { cooldown: 200 });
        node.children[1].rotation = this.tilts[i] === 0 ? Math.PI / 4 : -Math.PI / 4;
        this.mirrors.set(i, node);
      } else if (t.kind === 'rock') node = rockArt();
      else if (t.kind === 'glass') node = glassArt(t.tint);
      else if (t.kind === 'object') node = objectArt(t.name, t.tilt);
      else {
        const b = new Bloom(t.wants);
        this.blooms.set(i, b);
        node = b;
      }
      node.position.set(c.x, c.y);
      this.pieces.addChild(node);
    });
    if (this.predicting) for (const end of predictionChoices(p).slice(0, 3)) this.addPredictionMark(end);
    if (this.plan.mode === 'find') this.buildClouds();
  }

  /** Level 10: the flower is already lit; a cloud covers every other cell, and the beam shows only where it goes in and comes out. */
  private buildClouds() {
    for (const cell of cloudCells(this.puzzle)) {
      const c = cloudArt();
      const at = this.at(cell.x, cell.y);
      c.position.set(at.x, at.y);
      c.hitArea = new Rectangle(-CELL / 2, -CELL / 2, CELL, CELL);
      onTap(c, () => void this.pick(cell), { cooldown: 300 });
      this.cloudLayer.addChild(c);
      this.clouds.set(`${cell.x},${cell.y}`, c);
    }
    for (const b of this.blooms.values()) b.wake(this.ctx.tw);
    this.drawPeek();
  }

  /** The real beam, drawn only over cells with no cloud: half of each step lies in each of its two cells. */
  private drawPeek() {
    const g = this.peek.clear();
    if (!this.clouds.size) return;
    const p = this.puzzle;
    const cells = [{ x: p.sunCol, y: p.sunRow }, ...trace(p, p.solution).cells];
    const open = (c: { x: number; y: number }) => !this.clouds.has(`${c.x},${c.y}`);
    for (let i = 0; i + 1 < cells.length; i++) {
      const a = this.at(cells[i].x, cells[i].y);
      const b = this.at(cells[i + 1].x, cells[i + 1].y);
      const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
      // Into a cloud the beam shows for a little way, over its edge, then hides.
      const into = (from: { x: number; y: number }, to: { x: number; y: number }) => ({
        x: from.x + (to.x - from.x) * 0.45,
        y: from.y + (to.y - from.y) * 0.45,
      });
      const halves = [
        open(cells[i]) ? [a, mid] : open(cells[i + 1]) ? [into(mid, a), mid] : null,
        open(cells[i + 1]) ? [mid, b] : open(cells[i]) ? [mid, into(mid, b)] : null,
      ];
      for (const half of halves) {
        if (!half) continue;
        const [from, to] = half;
        g.moveTo(from.x, from.y)
          .lineTo(to.x, to.y)
          .stroke({ width: 22, color: TINT_COLOR.sun, alpha: 0.35, cap: 'round' });
        g.moveTo(from.x, from.y).lineTo(to.x, to.y).stroke({ width: 8, color: TINT_COLOR.sun, cap: 'round' });
      }
    }
  }

  /** A cloud puffs away: it can't be tapped again, and the couch ring leaves it. */
  private puff(key: string) {
    const c = this.clouds.get(key);
    if (!c) return;
    this.clouds.delete(key);
    c.eventMode = 'none';
    // The couch ring stays on the cloud it was on, or moves to the next one if that cloud puffed.
    const was = this.spots[this.focus];
    this.spots = this.spots.filter((sp) => `${sp.x},${sp.y}` !== key);
    const stay = this.spots.indexOf(was);
    this.focus = stay >= 0 ? stay : Math.min(this.focus, Math.max(0, this.spots.length - 1));
    const at = this.ctx.stage.toLocal(c.getGlobalPosition());
    this.ctx.particles.burst(at.x, at.y, {
      kind: 'dot',
      colors: [0xffffff, 0xe8f4ff],
      count: 10,
      speed: [60, 160],
      gravity: 0,
      life: [0.3, 0.6],
    });
    void this.ctx.tw.to(c.scale, { x: 1.35, y: 1.35 }, { duration: 0.3 });
    void this.ctx.tw
      .to(c, { alpha: 0 }, { duration: 0.3 })
      .then(() => !c.destroyed && c.destroy({ children: true }));
  }

  /**
   * Level 10: tap a cloud. The mirror's cell clears every cloud and the beam wakes the garden; a wrong cell is a miss, its
   * cloud puffs away and a pale ghost beam shows where a mirror there would send the light. Two misses glow the crossing lines.
   */
  private async pick(cell: { x: number; y: number }) {
    const key = `${cell.x},${cell.y}`;
    if (this.busy || this.finished || this.plan.mode !== 'find' || !this.clouds.has(key)) return;
    this.busy = true;
    this.puff(key);
    const m = this.puzzle.things.find((t) => t.kind === 'mirror')!;
    if (m.x === cell.x && m.y === cell.y) {
      sfx.tick();
      await this.ctx.tw.wait(0.35);
      for (const k of [...this.clouds.keys()]) this.puff(k);
      this.peek.clear();
      await this.ctx.tw.wait(0.3);
      return void this.win();
    }
    this.misses++;
    this.wrongs++;
    sfx.boing();
    this.drawPeek();
    await this.showGhost(cell);
    // The second miss goes straight to the glowing lines, which say more than another miss line would.
    if (this.wrongs >= 2 && !this.findLine) {
      this.findLine = findLines(this.puzzle);
      this.hints++;
      this.assisted = true;
      void this.ctx.say('light.find.hint');
    } else await this.ctx.say('light.find.miss');
    this.busy = false;
  }

  /** A pale mirror in the wrong cell and the beam it would make, travelling out, then fading. */
  private async showGhost(cell: { x: number; y: number }) {
    const [board, tilts] = mirrorAt(this.puzzle, cell);
    const route = trace(board, tilts);
    this.ghost.removeChildren().forEach((c) => c.destroy({ children: true }));
    this.ghost.alpha = 1;
    const line = new Graphics();
    const mirror = mirrorArt();
    const at = this.at(cell.x, cell.y);
    mirror.position.set(at.x, at.y);
    mirror.alpha = 0.6;
    mirror.children[1].rotation =
      tilts[board.things.findIndex((t) => t.kind === 'mirror')] === 0 ? Math.PI / 4 : -Math.PI / 4;
    this.ghost.addChild(line, mirror);
    const points = [
      this.at(this.puzzle.sunCol, this.puzzle.sunRow),
      ...route.cells.map((c) => this.at(c.x, c.y)),
    ];
    for (let n = 2; n <= points.length; n++) {
      line.clear().moveTo(points[0].x, points[0].y);
      for (const pt of points.slice(1, n)) line.lineTo(pt.x, pt.y);
      line.stroke({ width: 18, color: 0xffffff, alpha: 0.6, cap: 'round', join: 'round' });
      line.moveTo(points[0].x, points[0].y);
      for (const pt of points.slice(1, n)) line.lineTo(pt.x, pt.y);
      line.stroke({ width: 8, color: swatch.blue.fill, alpha: 0.75, cap: 'round', join: 'round' });
      await this.ctx.tw.wait(0.08);
    }
    await this.ctx.tw.wait(0.9);
    await this.ctx.tw.to(this.ghost, { alpha: 0 }, { duration: 0.4 });
    this.ghost.removeChildren().forEach((c) => c.destroy({ children: true }));
  }

  /** Levels 8–9: a wooden tray under the board holding the mirrors she places. */
  private buildTray(f: Graphics) {
    const p = this.puzzle;
    const n = p.tray.length;
    const w = n * TRAY_STEP + 20;
    const top = p.rows * CELL + TRAY_GAP;
    f.roundRect((p.cols * CELL - w) / 2, top, w, TRAY_H, 28)
      .fill(wood.fill)
      .stroke({ width: 6, color: wood.line });
    for (let k = 0; k < n; k++) {
      const slot = { x: (p.cols * CELL) / 2 + (k - (n - 1) / 2) * TRAY_STEP, y: top + TRAY_H / 2 };
      f.circle(slot.x, slot.y, 48).fill({ color: wood.light, alpha: 0.8 });
      const node = mirrorArt();
      node.position.set(slot.x, slot.y);
      node.hitArea = new Circle(0, 0, CELL / 2);
      const m: TrayMirror = { node, slot, cell: null, tilt: DROP_TILT, moved: false, handle: undefined! };
      let from = { x: 0, y: 0 };
      node.on('pointerdown', (e: FederatedPointerEvent) => {
        from = this.board.toLocal(e.global);
        m.moved = false;
      });
      node.on('globalpointermove', (e: FederatedPointerEvent) => {
        if (!m.handle.dragging) return;
        const at = this.board.toLocal(e.global);
        if (Math.hypot(at.x - from.x, at.y - from.y) > TAP_SLOP) m.moved = true;
      });
      m.handle = draggable(node, this.ctx.tw, {
        onPick: () => sfx.tick(),
        onMove: (x, y) => this.drawHover(m, x, y),
        onDrop: (x, y) => this.drop(m, x, y),
      });
      this.trayLayer.addChild(node);
      this.trayMirrors.push(m);
    }
  }

  private clearTray() {
    for (const m of this.trayMirrors) m.handle.destroy();
    this.trayMirrors.length = 0;
    this.trayLayer.removeChildren().forEach((c) => c.destroy({ children: true }));
    this.hover.clear();
  }

  /** The free cell nearest a carried mirror, or null when it is off the board (where it goes back to the tray). */
  private landing(m: TrayMirror, x: number, y: number) {
    const p = this.puzzle;
    if (x < -CELL / 4 || y < -CELL / 4 || x > p.cols * CELL + CELL / 4 || y > p.rows * CELL + CELL / 4)
      return null;
    const others = this.onBoard()
      .filter((o) => o !== m)
      .map((o) => ({ ...o.cell, tilt: o.tilt }));
    const cells = freeCells(p, others);
    let best = cells[0];
    for (const c of cells)
      if (
        Math.hypot((c.x + 0.5) * CELL - x, (c.y + 0.5) * CELL - y) <
        Math.hypot((best.x + 0.5) * CELL - x, (best.y + 0.5) * CELL - y)
      )
        best = c;
    return best ?? null;
  }

  private drawHover(m: TrayMirror, x: number, y: number) {
    const g = this.hover.clear();
    const c = m.moved ? this.landing(m, x, y) : null;
    if (c)
      g.roundRect(c.x * CELL + 4, c.y * CELL + 4, CELL - 8, CELL - 8, 14)
        .fill({ color: 0xfff3a0, alpha: 0.8 })
        .stroke({ width: 4, color: swatch.yellow.line, alpha: 0.6 });
  }

  /** Dropping is never wrong: a free cell takes the mirror, off the board it goes home to the tray, and a tap on a placed mirror turns it. */
  private drop(m: TrayMirror, x: number, y: number): boolean {
    this.hover.clear();
    if (this.busy || this.finished) return false;
    const settle = (cx: number, cy: number) => {
      const at = this.at(cx, cy);
      m.handle.home = at;
      void this.ctx.tw.to(m.node, { x: at.x, y: at.y }, { duration: 0.15, ease: ease.outBack });
    };
    if (m.cell && !m.moved) {
      settle(m.cell.x, m.cell.y);
      this.turnPlaced(m);
      return true;
    }
    const cell = this.landing(m, x, y);
    if (!cell) {
      m.cell = null;
      m.handle.home = { ...m.slot };
      this.setTrayTilt(m, DROP_TILT);
      if (this.hintTray === m) this.hintTray = null;
      this.beam.clear();
      return false;
    }
    const fresh = !m.cell;
    m.cell = cell;
    settle(cell.x, cell.y);
    if (fresh) this.setTrayTilt(m, DROP_TILT);
    this.taps++;
    sfx.tick();
    this.beam.clear();
    if (this.hintTray === m) this.hintTray = null;
    // A mirror on the glowing cell: if it lands the wrong way, the glow moves to it (still the same hint).
    if (this.hintCell && this.hintCell.x === cell.x && this.hintCell.y === cell.y) {
      this.hintCell = null;
      const want = nearestPlacement(this.puzzle, this.tilts, this.placed())?.placed.find(
        (w) => w.x === cell.x && w.y === cell.y,
      );
      if (want && want.tilt !== m.tilt) this.hintTray = m;
    }
    return true;
  }

  private setTrayTilt(m: TrayMirror, tilt: Tilt, animate = false) {
    m.tilt = tilt;
    const glass = m.node.children[1];
    const rotation = tilt === 0 ? Math.PI / 4 : -Math.PI / 4;
    if (animate) void this.ctx.tw.to(glass, { rotation }, { duration: 0.18, ease: ease.outBack });
    else glass.rotation = rotation;
  }

  private turnPlaced(m: TrayMirror) {
    this.taps++;
    this.setTrayTilt(m, (1 - m.tilt) as Tilt, true);
    sfx.tick();
    if (this.hintTray === m) this.hintTray = null;
    this.beam.clear();
  }

  private addPredictionMark(end: BeamEnd) {
    const c = new Container();
    const g = new Graphics()
      .circle(0, 0, 43)
      .fill({ color: 0xffffff, alpha: 0.78 })
      .stroke({ width: 7, color: swatch.teal.line });
    if (end.kind === 'rock') {
      g.poly([-20, 10, -15, -12, 0, -21, 18, -15, 21, 7, 12, 19, -10, 18])
        .fill(swatch.white.line)
        .stroke({ width: 3, color: ink, alpha: 0.55 });
    } else if (end.kind === 'edge') {
      const dirs: Record<number, [number, number]> = { 0: [24, 0], 1: [0, 24], 2: [-24, 0], 3: [0, -24] };
      const [dx, dy] = dirs[end.exit ?? 0];
      g.moveTo(-dx * 0.55, -dy * 0.55)
        .lineTo(dx * 0.55, dy * 0.55)
        .stroke({ width: 7, color: swatch.teal.line, cap: 'round' });
      g.poly([
        dx * 0.75,
        dy * 0.75,
        dx * 0.25 - dy * 0.28,
        dy * 0.25 + dx * 0.28,
        dx * 0.25 + dy * 0.28,
        dy * 0.25 - dx * 0.28,
      ]).fill(swatch.teal.line);
    }
    c.addChild(g);
    const at = this.at(end.targetX, end.targetY);
    c.position.set(at.x, at.y);
    c.hitArea = new Circle(0, 0, 50);
    onTap(c, () => void this.predict(end), { cooldown: 250 });
    this.pieces.addChild(c);
    this.predictionMarks.set(end.key, c);
  }

  /** Tap a mirror: it tilts the other way. Turning is always free; it is how you explore. */
  private turn(i: number) {
    if (this.busy || this.finished || this.predicting || this.plan.mode === 'find') return;
    this.taps++;
    this.report();
    this.tilts[i] = (1 - this.tilts[i]) as Tilt;
    const glass = this.mirrors.get(i)!.children[1];
    void this.ctx.tw.to(
      glass,
      { rotation: this.tilts[i] === 0 ? Math.PI / 4 : -Math.PI / 4 },
      { duration: 0.18, ease: ease.outBack },
    );
    sfx.tick();
    if (this.hinted === i) this.hinted = -1;
    if (this.plan.mode === 'live') {
      this.drawBeam();
      if (solved(this.puzzle, this.tilts)) void this.win();
    } else this.beam.clear();
  }

  /** The beam as far as it gets: full on live levels, or `upTo` steps from the sun while it is shining (every arm of a split beam together). */
  private drawBeam(upTo = Infinity) {
    const [board, tilts] = this.current();
    const t = traceAll(board, tilts);
    const g = this.beam.clear();
    for (const arm of t.arms) {
      // One line per color, so the soft glow doesn't stack up where segments meet.
      const shown = arm.cells.filter((c) => c.step <= upTo);
      const start = arm.from < 0 ? { x: this.puzzle.sunCol, y: this.puzzle.sunRow } : board.things[arm.from];
      let from = this.at(start.x, start.y);
      for (let i = 0; i < shown.length;) {
        const { tint, dim } = shown[i];
        const run = [from];
        while (i < shown.length && shown[i].tint === tint && !!shown[i].dim === !!dim)
          (run.push(this.at(shown[i].x, shown[i].y)), i++);
        // Level 11's cloudy things, and level 12's half-mirror, let a paler, thinner beam through.
        for (const [width, alpha] of dim
          ? [
              [14, 0.2],
              [5, 0.5],
            ]
          : [
              [22, 0.35],
              [8, 1],
            ]) {
          g.moveTo(run[0].x, run[0].y);
          for (const p of run.slice(1)) g.lineTo(p.x, p.y);
          g.stroke({ width, color: TINT_COLOR[tint], alpha, cap: 'round', join: 'round' });
        }
        from = run[run.length - 1];
      }
    }
    // Live levels wake flowers as the light reaches them.
    for (const [i, b] of this.blooms) {
      if (t.woken.includes(i) && upTo === Infinity) b.wake(this.ctx.tw);
      else if (this.plan.mode === 'live') b.sleep();
    }
    return t;
  }

  /** Planning levels: the sun shines, the beam travels, and either everything wakes or we see why not. */
  private async shine() {
    if (this.busy || this.finished || !this.planning || this.predicting) return;
    // A mirror still in the tray: a reminder, not a miss.
    if (this.trayMirrors.some((m) => !m.cell)) return void this.ctx.say('light.place.first');
    this.busy = true;
    this.sun.scale.set(1);
    sfx.whoosh();
    const [board, tilts] = this.current();
    const t = traceAll(board, tilts);
    const cells = t.arms.flatMap((a) => a.cells);
    const steps = Math.max(0, ...cells.map((c) => c.step));
    for (let n = 1; n <= steps; n++) {
      this.drawBeam(n);
      for (const c of cells.filter((c) => c.step === n)) {
        const i = board.things.findIndex((x) => x.x === c.x && x.y === c.y);
        if (i >= 0 && t.woken.includes(i)) {
          this.blooms.get(i)?.wake(this.ctx.tw);
          sfx.bell(7 + (n % 5), 0.25);
        }
      }
      // The split: a little burst of sparkle where both arms leave the half-mirror.
      for (const arm of t.arms) {
        if (arm.from < 0 || arm.cells[0]?.step !== n + 1) continue;
        const h = this.ctx.stage.toLocal(
          this.pieces.toGlobal(this.at(board.things[arm.from].x, board.things[arm.from].y)),
        );
        this.ctx.particles.burst(h.x, h.y, {
          kind: 'star',
          colors: [0xffffff, 0xfff3a0],
          count: 10,
          speed: [80, 200],
          gravity: 0,
          life: [0.3, 0.6],
        });
      }
      await this.ctx.tw.wait(0.09);
    }
    if (solved(board, tilts)) return void this.win();
    this.misses++;
    this.shinesMissed++;
    this.wrongs++;
    this.report();
    sfx.boing();
    const why = whyNot(board, tilts);
    const lines = {
      color: 'light.miss.color',
      sleeping: 'light.miss.sleeping',
      rock: 'light.miss.rock',
      unsplit: 'light.miss.unsplit',
      split: 'light.miss.split',
    } as const;
    await this.ctx.say(why in lines ? lines[why as keyof typeof lines] : 'light.miss.edge');
    if (this.wrongs >= 2 && this.puzzle.tray.length && !this.hintCell && !this.hintTray && this.hinted < 0)
      this.hintPlace();
    else if (this.wrongs >= 2 && !this.puzzle.tray.length && this.hinted < 0) {
      this.hinted = hintMirror(this.puzzle, this.tilts);
      if (this.hinted >= 0) {
        this.hints++;
        this.assisted = true;
        this.report();
        void this.ctx.say(
          this.puzzle.things[this.hinted].kind === 'half' ? 'light.hint.split' : 'light.hint',
        );
      }
    }
    await this.ctx.tw.wait(0.6);
    for (const b of this.blooms.values()) b.sleep();
    this.beam.clear();
    this.busy = false;
  }

  /** Tray levels' hint: the cell for a mirror along the nearest answer's beam, or the mirror to turn. */
  private hintPlace() {
    const h = placeHint(this.puzzle, this.tilts, this.placed());
    if (!h) return;
    this.hints++;
    if ('cell' in h) {
      this.hintCell = h.cell;
      void this.ctx.say('light.hint.cell');
      return;
    }
    if ('mirror' in h) this.hinted = h.mirror;
    else this.hintTray = this.onBoard()[h.placed];
    void this.ctx.say('light.hint');
  }

  /** A prediction is an experiment: show the route and explain the endpoint without a miss. */
  private async predict(choice?: BeamEnd) {
    if (this.busy || this.finished || !this.predicting || !choice) return;
    this.busy = true;
    const answer = beamEnd(this.puzzle, this.tilts);
    sfx.whoosh();
    const route = trace(this.puzzle, this.tilts);
    for (let n = 1; n <= route.cells.length; n++) {
      this.drawBeam(n);
      const cell = route.cells[n - 1];
      const i = this.puzzle.things.findIndex((thing) => thing.x === cell.x && thing.y === cell.y);
      if (i >= 0 && route.woken.includes(i)) this.blooms.get(i)?.wake(this.ctx.tw);
      await this.ctx.tw.wait(0.09);
    }
    const line =
      choice.key === answer.key
        ? 'light.predict.right'
        : answer.kind === 'rock'
          ? 'light.predict.rock'
          : 'light.predict.edge';
    await this.ctx.say(line);
    await this.ctx.tw.wait(0.8);
    for (const b of this.blooms.values()) b.sleep();
    this.beam.clear();
    this.board.alpha = 0;
    await this.next();
  }

  /** Level 11's board for this step: a guess's thing on the stand with both flowers, or an empty stand and the goal's target. */
  private materialBoard(): LightPuzzle {
    const r = this.round!;
    return this.index < 3
      ? materialPuzzle(r.board, r.guesses[this.index])
      : materialPuzzle(r.board, null, r.choices[this.index - 3].goal);
  }

  /** Level 11: the stand, the owl on a shade board, and the three guess pictures or the tray of things. */
  private buildMaterials() {
    const r = this.round!;
    this.shadow.clear();
    this.owl = null;
    this.row.removeChildren().forEach((c) => c.destroy({ children: true }));
    this.cards.length = 0;
    const stand = standArt();
    const s = this.at(r.board.stand, r.board.sunRow);
    stand.position.set(s.x, s.y);
    this.pieces.addChild(stand);
    const choice = this.choosing ? r.choices[this.index - 3] : null;
    if (choice?.goal === 'shade') {
      const owl = owlArt('brown');
      owl.setMood('sleepy');
      owl.scale.set(0.34);
      const o = this.at(owlCell(r.board).x, owlCell(r.board).y);
      owl.position.set(o.x, o.y + 44);
      owl.eventMode = 'none';
      this.pieces.addChild(owl);
      this.owl = owl;
    }
    const y = this.puzzle.rows * CELL + ROW_GAP + CARD_H / 2;
    const items: (Outcome | Stuff)[] = choice ? choice.tray : ['through', 'bounce', 'stop'];
    items.forEach((item, k) => {
      const card = new Container();
      card.addChild(cardArt());
      if (typeof item === 'string') card.addChild(outcomeArt(item));
      else card.addChild(objectArt(item.name, r.board.tilt));
      card.position.set((this.puzzle.cols * CELL) / 2 + (k - 1) * CARD_STEP, y);
      card.hitArea = new Rectangle(-CARD_W / 2, -CARD_H / 2, CARD_W, CARD_H);
      onTap(card, () => void (typeof item === 'string' ? this.guess(item, card) : this.choose(k)), {
        cooldown: 300,
      });
      this.row.addChild(card);
      this.cards.push(card);
    });
  }

  /** Touch-down feedback: the card lifts and glows. */
  private lift(card: Container) {
    card.scale.set(1.08);
    (card.children[0] as Graphics).tint = 0xfff6c8;
  }

  /** Level 11's shine: the beam travels, a dim beam wakes a flower softly, and a blocking thing's shadow fades in behind it. */
  private async shineThrough() {
    sfx.whoosh();
    const t = trace(this.puzzle, []);
    for (let n = 1; n <= t.cells.length; n++) {
      this.drawBeam(n);
      const c = t.cells[n - 1];
      const i = this.puzzle.things.findIndex((x) => x.x === c.x && x.y === c.y);
      if (i >= 0 && t.woken.includes(i)) {
        this.blooms.get(i)?.wake(this.ctx.tw, !!c.dim);
        sfx.bell(7 + (n % 5), 0.25);
      }
      const owl = owlCell(this.round!.board);
      if (this.owl && c.x === owl.x && c.y === owl.y) this.owl.setMood('surprised');
      await this.ctx.tw.wait(0.09);
    }
    if (t.end === 'rock') {
      const g = this.shadow.clear();
      for (const c of shadowCells(this.round!.board))
        g.roundRect(c.x * CELL + 4, c.y * CELL + 4, CELL - 8, CELL - 8, 14).fill({ color: ink, alpha: 0.25 });
      this.shadow.alpha = 0;
      await this.ctx.tw.to(this.shadow, { alpha: 1 }, { duration: 0.35 });
    }
  }

  /** A guess is an experiment: shine, say what happened (and "just as you guessed" when it did), never a miss. */
  private async guess(o: Outcome, card: Container) {
    if (this.busy || this.finished || !this.guessing) return;
    this.busy = true;
    this.lift(card);
    sfx.tick();
    void this.ctx.say(`light.mat.${o}`);
    const stuff = this.round!.guesses[this.index];
    await this.ctx.tw.wait(0.5);
    await this.shineThrough();
    await this.ctx.say(`light.mat.${stuff.material}`, { thing: THING_WORDS[stuff.name] });
    if (o === outcome(stuff.material)) await this.ctx.say('light.mat.guessed');
    await this.ctx.tw.wait(0.8);
    await this.ctx.tw.to(this.board, { alpha: 0 }, { duration: 0.3 });
    await this.next();
  }

  /** A choice: the thing slides onto the stand and the sun shines. Right finishes the board; wrong teaches, slides back and counts a miss. */
  private async choose(k: number) {
    if (this.busy || this.finished || !this.choosing) return;
    this.busy = true;
    const r = this.round!;
    const choice = r.choices[this.index - 3];
    const stuff = choice.tray[k];
    const card = this.cards[k];
    this.lift(card);
    sfx.tick();
    if (this.hintCard === k) this.hintCard = -1;
    this.puzzle = materialPuzzle(r.board, stuff, choice.goal);
    const thing = objectArt(stuff.name, r.board.tilt);
    const s = this.at(r.board.stand, r.board.sunRow);
    thing.position.set(card.x, card.y);
    this.pieces.addChild(thing);
    card.children[1].visible = false;
    await this.ctx.tw.to(thing, { x: s.x, y: s.y }, { duration: 0.35, ease: ease.outBack });
    await this.shineThrough();
    if (meetsGoal(r.board, choice.goal, stuff)) {
      for (const b of this.blooms.values()) {
        if (!b.awake) continue;
        const p = this.ctx.stage.toLocal(b.getGlobalPosition());
        this.ctx.particles.burst(p.x, p.y, {
          kind: 'star',
          colors: [0xffffff, 0xfff3a0, swatch.pink.light],
          count: 16,
          speed: [100, 280],
          gravity: 0,
          life: [0.5, 0.9],
        });
      }
      sfx.sparkle();
      this.ctx.pet.cheer();
      await this.ctx.say(choice.goal === 'shade' ? 'light.mat.owl.yay' : 'light.yay');
      await this.ctx.tw.wait(0.5);
      await this.ctx.tw.to(this.board, { alpha: 0 }, { duration: 0.3 });
      return void this.next();
    }
    this.misses++;
    this.wrongs++;
    sfx.boing();
    const why = whyNotMaterial(choice.goal, stuff.material)!;
    await this.ctx.say(`light.mat.miss.${why}`, { thing: THING_WORDS[stuff.name] });
    const hint = this.wrongs >= 2 && this.hintCard < 0;
    if (hint) {
      this.hintCard = hintThing(choice);
      this.hints++;
    }
    await this.ctx.tw.to(thing, { x: card.x, y: card.y }, { duration: 0.3 });
    thing.destroy({ children: true });
    if (!card.destroyed) {
      card.children[1].visible = true;
      card.scale.set(1);
      (card.children[0] as Graphics).tint = 0xffffff;
    }
    this.puzzle = materialPuzzle(r.board, null, choice.goal);
    for (const b of this.blooms.values()) b.sleep();
    this.owl?.setMood('sleepy');
    this.beam.clear();
    this.shadow.clear();
    this.busy = false;
    // Spoken once the glow can show (it waits for `busy` to clear).
    if (hint) void this.ctx.say('light.mat.hint');
  }

  private async win() {
    this.busy = true;
    this.excess += Math.max(0, this.taps - this.needed) + this.shinesMissed;
    if (this.course) {
      this.done.push(this.tries);
      this.report(true);
    }
    this.hinted = -1;
    this.hintCell = null;
    this.hintTray = null;
    this.findLine = null;
    this.drawBeam();
    for (const b of this.blooms.values()) {
      b.wake(this.ctx.tw);
      const p = this.ctx.stage.toLocal(b.getGlobalPosition());
      this.ctx.particles.burst(p.x, p.y, {
        kind: 'star',
        colors: [0xffffff, 0xfff3a0, swatch.pink.light],
        count: 16,
        speed: [100, 280],
        gravity: 0,
        life: [0.5, 0.9],
      });
    }
    sfx.sparkle();
    this.ctx.pet.cheer();
    // A course moves straight on after a short score; ordinary play praises.
    if (this.course) await this.boardScore();
    else {
      await this.ctx.say(this.plan.split && this.index === 0 ? 'light.split.yay' : 'light.yay');
      await this.ctx.tw.wait(0.5);
    }
    await this.ctx.tw.to(this.board, { alpha: 0 }, { duration: 0.3 });
    await this.next();
  }

  /** A course's boards differ: say what this one asks whenever it asks something new (one flower, two, or coloured glass). */
  private courseInstruction() {
    const p = this.puzzle;
    const line = p.things.some((t) => t.kind === 'glass')
      ? 'light.color'
      : flowerCount(p) === 2
        ? 'light.two'
        : 'light.plan';
    if (line === this.courseLine) return;
    this.courseLine = line;
    return this.ctx.instruct(line);
  }

  /** Turns on this board, missed shines and turns from before a reload included: what a course counts. */
  private get tries() {
    return this.carried + this.taps + this.shinesMissed;
  }

  /** Hand a course's numbers to the shell. `finished` means the board just ended, so none of its tries are "in progress". */
  private report(finished = false) {
    const run = this.ctx.couch?.course;
    if (!run || !this.course) return;
    run.progress({
      board: this.index,
      boards: this.course.boards.length,
      done: this.done.slice(),
      attempts: finished ? 0 : this.tries,
      par: this.needed,
      minimum: this.course.minimum,
      assisted: this.assisted,
    });
  }

  /** The score for the board just solved, over it for a moment. */
  private async boardScore() {
    const best = this.needed,
      total = this.course!.boards.length,
      n = this.tries;
    const text =
      n === best
        ? `Board ${this.index + 1} of ${total}: ${n} turns, the fewest possible!`
        : `Board ${this.index + 1} of ${total}: ${n} ${n === 1 ? 'turn' : 'turns'} (fewest ${best})`;
    const note = label(text, 34, ink);
    note.position.set((this.puzzle.cols * CELL) / 2, -56);
    note.alpha = 0;
    this.board.addChild(note);
    await this.ctx.tw.to(note, { alpha: 1 }, { duration: 0.2 });
    await this.ctx.tw.wait(1.2);
    await this.ctx.tw.to(note, { alpha: 0 }, { duration: 0.25 });
    note.destroy();
  }

  private async finale() {
    if (this.finished) return;
    this.finished = true;
    sfx.tada();
    await this.ctx.say(this.round ? 'light.mat.done' : 'light.done');
    await this.ctx.tw.wait(0.5);
    this.ctx.finish({ misses: this.misses, hints: this.hints, score: this.excess });
  }
}

export const lightLab: GameModule = {
  id: 'light-lab',
  liveController: true,
  name: 'Light Lab',
  titleLine: 'game.light-lab',
  region: 'tinker-lab',
  challenge: 'space',
  skills: ['spatial-reasoning', 'planning', 'cause-and-effect', 'light'],
  bands: ['prek', 'school'],
  levels: (band) => rangeFor(LEVELS, band),
  describeLevel: (level) => planFor(level).name,
  music: STYLES.hub,
  coplayHint:
    'Before shining, trace the path with your finger together: "The light goes here, bumps the mirror, and turns..."',
  offScreen:
    'Use a hand mirror to bounce a sunbeam onto the wall, then onto a toy. Or shine a torch through a glass, baking paper, cardboard and a foil lid.',
  hubIcon: () => new LightIcon(),
  touchDemo: true,
  sticker,
  create: (ctx) => new LightLab(ctx),
};
