import { Circle, Container, Graphics, Rectangle } from 'pixi.js';
import { cream, ink, swatch, wood } from '../../art/palette';
import { starPoints } from '../../art/shapes';
import { STYLES } from '../../audio/music';
import type { LineId } from '../../content/voice-script';
import { sfx } from '../../audio/sfx';
import { draggable, type DragHandle } from '../../engine/drag';
import { onTap } from '../../engine/input';
import { Rng } from '../../engine/random';
import { ease } from '../../engine/tween';
import type { View } from '../../engine/view';
import { rangeFor } from '../../progress/difficulty';
import { WigglyIcon } from '../shared';
import type { Game, GameContext, GameModule, TouchIntent } from '../types';
import { entryId } from '../../content/journal';
import {
  LEVELS,
  bounced,
  chainTouch,
  gateMet,
  hintFor,
  makeBoards,
  planFor,
  predictedBell,
  solutions,
  trace,
  traces,
  turnHint,
  works,
  TAP_TO_TURN,
  WHICH_BELL,
  type ChainBoard,
  type ChainPlan,
  type Layout,
  type Marble,
  type Ramp,
  type Trace,
} from './logic';
import { rampStep, SKINS, skinFor, skinnable, skinVars, type Skin } from './skins';
import { BUTTON_HIT_R, chainLayout, COL_GAP, PART_HIT_R } from './layout';

const PART_R = 52;

/** A chunky wooden ramp. The pale groove shows exactly where the marble will leave it. */
export function rampArt(ramp: Ramp, loose = false): Container {
  const c = new Container();
  const fill = loose ? (ramp === 'left' ? swatch.purple.fill : swatch.teal.fill) : wood.fill;
  const line = loose ? (ramp === 'left' ? swatch.purple.line : swatch.teal.line) : wood.line;
  const g = new Graphics().roundRect(-48, -44, 96, 88, 22).fill(fill).stroke({ width: 6, color: line });
  const end = ramp === 'left' ? -34 : 34;
  g.moveTo(0, -28).lineTo(end, 25).stroke({ width: 18, color: cream, cap: 'round' });
  g.circle(0, -28, 10).fill(swatch.yellow.fill).stroke({ width: 3, color: swatch.yellow.line });
  g.circle(end, 25, 10).fill(swatch.blue.light).stroke({ width: 3, color: swatch.blue.line });
  c.addChild(g);
  c.hitArea = new Circle(0, 0, PART_HIT_R);
  return c;
}

/** Level 10's spring: a green pad on a coil in a wooden socket. Fixed, so it never takes a touch. */
export function springArt(): Container {
  const c = new Container();
  const g = new Graphics()
    .roundRect(-48, -44, 96, 88, 22)
    .fill(wood.fill)
    .stroke({ width: 6, color: wood.line });
  const coil = new Graphics().moveTo(-22, 30);
  [-22, 22, -22, 22, -22].forEach((x, i) => coil.lineTo(-x, 30 - (i + 1) * 10));
  coil.stroke({ width: 7, color: ink, cap: 'round', join: 'round' });
  const pad = new Graphics()
    .roundRect(-34, -34, 68, 18, 9)
    .fill(swatch.green.fill)
    .stroke({ width: 4, color: swatch.green.line });
  const base = new Graphics().roundRect(-30, 28, 60, 10, 5).fill(swatch.green.line);
  c.addChild(g, base, coil, pad);
  c.label = 'spring';
  return c;
}

/** The journal's spring card: a marble hopping off the spring over a ramp. */
export function chainJournalPicture(): Container {
  const c = new Container();
  const spring = springArt();
  const ramp = rampArt('left', false);
  ramp.position.set(0, 100);
  const arc = new Graphics()
    .moveTo(0, -40)
    .quadraticCurveTo(80, -60, 70, 100)
    .stroke({ width: 7, color: swatch.red.fill, alpha: 0.45, cap: 'round' });
  const marble = new Graphics()
    .circle(56, -50, 19)
    .fill(swatch.red.fill)
    .stroke({ width: 5, color: swatch.red.line });
  c.addChild(ramp, spring, arc, marble);
  return c;
}

const GATE_SHUT = 0.22;

/**
 * Level 11's gate: a yellow frame with a little bell badge, the chime's colours, around a wooden ramp. The ramp is a
 * faint outline while the gate is shut and turns solid when the chime opens it. Fixed, so it never takes a touch.
 */
export function gateArt(ramp: Ramp): Container {
  const c = new Container();
  const frame = new Graphics()
    .roundRect(-52, -50, 104, 100, 26)
    .fill({ color: swatch.yellow.light, alpha: 0.45 })
    .stroke({ width: 6, color: swatch.yellow.line });
  const inner = rampArt(ramp, false);
  inner.label = 'gate-ramp';
  inner.eventMode = 'none';
  inner.alpha = GATE_SHUT;
  const badge = bellArt(true);
  badge.scale.set(0.5);
  badge.position.set(-40, -40);
  c.addChild(frame, inner, badge);
  c.label = 'gate';
  return c;
}
/** A bell; level 9 gives each marble its own bell, tinted its colour with that marble on its face. */
function bellArt(small = false, marble?: { fill: number; line: number; light: number }): Container {
  const c = new Container();
  const s = small ? 0.72 : 1;
  const g = new Graphics();
  g.moveTo(-34 * s, 18 * s)
    .quadraticCurveTo(-28 * s, -35 * s, 0, -42 * s)
    .quadraticCurveTo(28 * s, -35 * s, 34 * s, 18 * s)
    .lineTo(42 * s, 28 * s)
    .lineTo(-42 * s, 28 * s)
    .closePath()
    .fill(marble?.light ?? swatch.yellow.fill)
    .stroke({ width: 6 * s, color: marble?.line ?? swatch.yellow.line, join: 'round' });
  if (marble) g.circle(0, -8, 15).fill(marble.fill).stroke({ width: 4, color: marble.line });
  g.circle(0, 37 * s, 10 * s)
    .fill(swatch.orange.fill)
    .stroke({ width: 4 * s, color: swatch.orange.line });
  g.roundRect(-12 * s, -53 * s, 24 * s, 15 * s, 7 * s)
    .fill(wood.fill)
    .stroke({ width: 4 * s, color: wood.line });
  c.addChild(g);
  return c;
}

/** A squirrel's bowl for the acorn: a round wooden bowl with a few acorn caps already in it. */
function bowlArt(): Container {
  const c = new Container();
  const g = new Graphics();
  g.moveTo(-44, -6)
    .quadraticCurveTo(-40, 34, 0, 34)
    .quadraticCurveTo(40, 34, 44, -6)
    .closePath()
    .fill(wood.fill)
    .stroke({ width: 6, color: wood.line, join: 'round' });
  g.ellipse(0, -6, 44, 11).fill(swatch.orange.light).stroke({ width: 5, color: wood.line });
  g.circle(-14, -9, 7).fill(swatch.orange.fill);
  g.circle(10, -8, 7).fill(swatch.orange.fill);
  c.addChild(g);
  return c;
}

/** A small pond for the duckling: blue water with a lily pad and a ripple. */
function pondArt(): Container {
  const c = new Container();
  const g = new Graphics();
  g.ellipse(0, 12, 58, 26).fill(swatch.blue.fill).stroke({ width: 6, color: swatch.blue.line });
  g.ellipse(0, 12, 34, 12).stroke({ width: 4, color: swatch.blue.light, alpha: 0.9 });
  g.ellipse(22, 8, 14, 7).fill(swatch.green.fill).stroke({ width: 3, color: swatch.green.line });
  c.addChild(g);
  return c;
}

/** The goal a machine shows for its skin; the marble keeps the bell. */
function goalArt(skin: Skin): Container {
  return skin.id === 'acorn' ? bowlArt() : skin.id === 'duckling' ? pondArt() : bellArt();
}

/** What rides the machine, drawn at the origin (the marble stays the red ball). */
function drawCargo(g: Graphics, skin: Skin) {
  g.clear();
  if (skin.id === 'acorn') {
    g.ellipse(0, 4, 15, 18).fill(swatch.orange.fill).stroke({ width: 5, color: swatch.orange.line });
    g.roundRect(-17, -16, 34, 13, 6).fill(wood.fill).stroke({ width: 4, color: wood.line });
  } else if (skin.id === 'duckling') {
    g.circle(0, 5, 17).fill(swatch.yellow.fill).stroke({ width: 5, color: swatch.yellow.line });
    g.circle(8, -12, 11).fill(swatch.yellow.fill).stroke({ width: 4, color: swatch.yellow.line });
    g.ellipse(21, -10, 8, 4).fill(swatch.orange.fill);
    g.circle(11, -15, 2.5).fill(ink);
  } else {
    g.circle(0, 0, 19).fill(swatch.red.fill).stroke({ width: 5, color: swatch.red.line });
  }
}

function roundButton(fill: number, line: number, picture: (g: Graphics) => void): Container {
  const c = new Container();
  const g = new Graphics()
    .circle(0, 5, 57)
    .fill({ color: ink, alpha: 0.16 })
    .circle(0, 0, 57)
    .fill(fill)
    .stroke({ width: 6, color: line });
  picture(g);
  c.addChild(g);
  c.hitArea = new Circle(0, 0, BUTTON_HIT_R);
  return c;
}

class ChainReaction implements Game {
  readonly plan: ChainPlan;
  readonly boards: ChainBoard[];
  index = -1;
  machine!: ChainBoard;
  placement: Layout = [];
  flipped: boolean[] = [];
  readonly turnNodes: Container[] = [];
  private turnGlow: number | null = null;
  misses = 0;
  hints = 0;
  busy = true;
  finished = false;

  readonly diagram = new Container();
  readonly parts: { node: Container; handle: DragHandle; home: { x: number; y: number } }[] = [];
  readonly runButton: Container;
  readonly helpButton: Container;

  private readonly panel = new Graphics();
  private readonly tracks = new Graphics();
  private readonly sockets = new Container();
  private readonly fixed = new Container();
  private readonly goal = new Container();
  private readonly startCup = new Graphics();
  private readonly marble = new Graphics()
    .circle(0, 0, 19)
    .fill(swatch.red.fill)
    .stroke({ width: 5, color: swatch.red.line });
  /** Level 9's second marble. */
  private readonly blueMarble = new Graphics()
    .circle(0, 0, 19)
    .fill(swatch.blue.fill)
    .stroke({ width: 5, color: swatch.blue.line });
  private readonly glow = new Graphics();
  private readonly trail = new Graphics();
  /** The last run of each marble on the board, kept for the trail and for watching again. */
  private lastTraces: Trace[] | null = null;
  private targetBell: Container | null = null;
  private blueBell: Container | null = null;
  /** Level 8's bells along the bottom, each a tap target for her prediction. */
  private bellNodes: { col: number; node: Container }[] = [];
  private picked: number | null = null;
  private readonly pickRing = new Graphics();
  private chimeBell: Container | null = null;
  private springNode: Container | null = null;
  /** Level 11's gate and the ramp inside it, which shows only once the chime has opened it. */
  private gateNode: Container | null = null;
  private gateRamp: Container | null = null;
  /** A run this round bounced on the spring, so the journal may file what it showed. */
  private sawSpring = false;
  private hinted: { piece: number; socket: number } | null = null;
  private settled = false;
  /** Level 8's help: the start cup glows while the pet says to follow the marble's way down with a finger. */
  private followHint = false;
  private top = 120;
  private gap = 92;
  private left = 180;
  /** The picture and words this machine wears; only plain machines leave the marble and the bell. */
  private skin: Skin = SKINS[0];
  private readonly skinOffset: number;

  constructor(private readonly ctx: GameContext) {
    this.plan = planFor(ctx.level);
    this.boards = makeBoards(this.plan, ctx.rng);
    this.skinOffset = ctx.rng.int(0, SKINS.length - 1);
    this.panel.eventMode =
      this.tracks.eventMode =
      this.sockets.eventMode =
      this.fixed.eventMode =
      this.goal.eventMode =
      this.glow.eventMode =
      this.trail.eventMode =
      this.pickRing.eventMode =
        'none';
    this.marble.visible = this.blueMarble.visible = false;
    this.diagram.addChild(
      this.panel,
      this.tracks,
      this.sockets,
      this.fixed,
      this.goal,
      this.trail,
      this.pickRing,
      this.startCup,
      this.marble,
      this.blueMarble,
      this.glow,
    );

    this.runButton = roundButton(swatch.green.fill, swatch.green.line, (g) => {
      g.poly([-18, -27, 30, 0, -18, 27])
        .fill(cream)
        .stroke({ width: 4, color: swatch.green.line, join: 'round' });
    });
    this.helpButton = roundButton(swatch.yellow.fill, swatch.yellow.line, (g) => {
      g.circle(0, -10, 19).stroke({ width: 8, color: ink });
      g.moveTo(-10, 6)
        .lineTo(-6, 22)
        .lineTo(6, 22)
        .lineTo(10, 6)
        .stroke({ width: 7, color: ink, cap: 'round', join: 'round' });
      g.moveTo(-7, 33).lineTo(7, 33).stroke({ width: 7, color: ink, cap: 'round' });
    });
    onTap(this.runButton, () => void this.run(), { cooldown: 400 });
    onTap(this.startCup, () => void this.watchAgain(), { cooldown: 400 });
    onTap(this.helpButton, () => this.help(), { cooldown: 500 });
    ctx.stage.addChild(this.diagram, this.runButton, this.helpButton);
  }

  start() {
    void this.next();
  }

  resize(v: View) {
    const L = chainLayout(v, this.plan.cols, this.plan.rows);
    this.left = L.left;
    this.top = L.top;
    this.gap = L.gap;
    this.runButton.position.set(L.run.x, L.run.y);
    this.helpButton.position.set(L.help.x, L.help.y);
    this.parts.forEach((part, i) => {
      part.home.x = L.home(i).x;
      part.home.y = L.home(i).y;
      part.handle.home = { ...part.home };
      const socket = this.placement[i];
      const at = socket === null || socket === undefined ? part.home : this.socketPosition(socket);
      part.node.position.set(at.x, at.y);
    });
    this.turnNodes.forEach((node, i) => {
      const at = this.machine.turn![i];
      node.position.set(this.colX(at.col), this.rowY(at.row));
    });
    if (this.machine) this.drawMachine();
  }

  update() {}

  /** Carry each ramp along a working design, then run the marble through the finished machine. */
  /** Guided first play points at the bot's next move: `autotouch` here only reads the board. */
  showMove(): TouchIntent | null {
    return this.autotouch();
  }

  autotouch(): TouchIntent | null {
    if (this.busy || this.finished || !this.machine) return null;
    if (this.plan.predict) {
      const bell = this.bellNodes.find((b) => b.col === predictedBell(this.machine));
      return this.picked === bell?.col
        ? { tap: { on: this.runButton } }
        : bell
          ? { tap: { on: bell.node } }
          : null;
    }
    const move = chainTouch(this.machine, this.placement, this.flipped);
    if (!move) return null;
    if (move.kind === 'run') return { tap: { on: this.runButton } };
    if (move.kind === 'flip') return { tap: { on: this.turnNodes[move.piece] } };
    const part = this.parts[move.piece];
    const at = this.socketPosition(move.socket);
    return part && !part.handle.dragging
      ? { drag: { on: part.node }, to: { on: this.ctx.stage, x: at.x, y: at.y } }
      : null;
  }

  destroy() {
    for (const p of this.parts) p.handle.destroy();
  }

  private colX(col: number) {
    return this.left + col * COL_GAP;
  }

  private rowY(row: number) {
    return this.top + (row + 1) * this.gap;
  }

  private socketPosition(socket: number) {
    const c = this.machine.sockets[socket];
    return { x: this.colX(c.col), y: this.rowY(c.row) };
  }

  /** Spoken lines carry the machine's cargo and goal words, so an acorn is never called a marble. */
  private say(id: LineId) {
    return this.ctx.say(id, skinVars(this.skin));
  }

  private instruct(id: LineId) {
    return this.ctx.instruct(id, skinVars(this.skin));
  }

  private async next() {
    this.busy = true;
    this.index++;
    this.hinted = null;
    this.lastTraces = null;
    this.picked = null;
    this.turnGlow = null;
    this.trail.clear();
    if (this.index >= this.boards.length) return void this.finale();
    this.machine = this.boards[this.index];
    this.skin = skinnable(this.plan) ? skinFor(this.skinOffset, this.index) : SKINS[0];
    drawCargo(this.marble, this.skin);
    this.placement = Array(this.machine.loose.length).fill(null);
    for (const p of this.parts) p.handle.destroy();
    this.parts.splice(0).forEach((p) => p.node.destroy({ children: true }));
    this.flipped = (this.machine.turn ?? []).map(() => false);
    this.turnNodes.splice(0).forEach((node) => node.destroy({ children: true }));
    this.machine.turn?.forEach((part, i) => {
      const node = new Container();
      node.addChild(rampArt(part.ramp, true));
      node.hitArea = new Rectangle(-52, -50, 104, 100);
      node.position.set(this.colX(part.col), this.rowY(part.row));
      onTap(node, () => this.flip(i));
      this.turnNodes.push(node);
      this.diagram.addChild(node);
    });
    this.diagram.addChild(this.glow);
    this.makeParts();
    // The first machine at level 1 shows the useful socket without counting it as assistance.
    if (this.ctx.level === 1 && this.index === 0) this.hinted = hintFor(this.machine, this.placement);
    this.drawMachine();
    this.diagram.alpha = 0;
    await this.ctx.tw.to(this.diagram, { alpha: 1 }, { duration: 0.3 });
    this.busy = false;
    this.drawGlow();
    if (this.index === 0)
      await this.instruct(
        this.plan.turn
          ? 'chain.turn-start'
          : this.plan.predict
            ? 'chain.predict-start'
            : this.plan.two
              ? 'chain.two-start'
              : this.plan.spring
                ? 'chain.spring-start'
                : this.plan.gate
                  ? 'chain.gate-start'
                  : this.plan.chime
                    ? 'chain.chime-start'
                    : 'chain.start',
      );
  }

  private flip(piece: number) {
    if (this.busy || this.finished) return;
    this.flipped[piece] = !this.flipped[piece];
    const node = this.turnNodes[piece];
    node.removeChildren().forEach((child) => child.destroy({ children: true }));
    const ramp = this.machine.turn![piece].ramp;
    const art = rampArt(this.flipped[piece] ? (ramp === 'left' ? 'right' : 'left') : ramp, true);
    art.eventMode = 'none';
    node.addChild(art);
    // The groove answers on touch-down, with a small scene-owned turn animation.
    art.rotation = this.flipped[piece] ? -0.12 : 0.12;
    void this.ctx.tw.to(art, { rotation: 0 }, { duration: 0.18 });
    this.turnGlow = null;
    this.drawGlow();
    sfx.pop(4 + piece * 2);
  }

  private makeParts() {
    this.machine.loose.forEach((ramp, piece) => {
      const node = rampArt(ramp, true);
      const home = chainLayout(this.ctx.view, this.plan.cols, this.plan.rows).home(piece);
      node.position.set(home.x, home.y);
      const handle = draggable(node, this.ctx.tw, {
        onPick: () => {
          if (this.busy || this.finished) return;
          this.placement[piece] = null;
          this.drawGlow();
          sfx.pop(3 + piece * 2);
        },
        onDrop: (x, y) => this.drop(piece, x, y),
      });
      this.parts.push({ node, handle, home });
      this.ctx.stage.addChild(node);
    });
  }

  private drop(piece: number, x: number, y: number): boolean {
    if (this.busy || this.finished) return false;
    const part = this.parts[piece];
    if (Math.hypot(x - part.home.x, y - part.home.y) < 85) {
      part.node.position.set(part.home.x, part.home.y);
      this.placement[piece] = null;
      sfx.pop(2);
      return true;
    }
    let socket = -1;
    let distance = Infinity;
    this.machine.sockets.forEach((_, i) => {
      const p = this.socketPosition(i);
      const d = Math.hypot(x - p.x, y - p.y);
      if (d < distance) {
        distance = d;
        socket = i;
      }
    });
    if (socket < 0 || distance > 76) return false;
    const other = this.placement.findIndex((s, i) => i !== piece && s === socket);
    if (other >= 0) {
      this.placement[other] = null;
      const old = this.parts[other];
      old.handle.home = { ...old.home };
      void old.handle.floatHome();
    }
    this.placement[piece] = socket;
    const at = this.socketPosition(socket);
    part.node.position.set(at.x, at.y);
    // An invalid later drop should return to the tray, not to the socket.
    part.handle.home = { ...part.home };
    if (this.hinted?.piece === piece && this.hinted.socket === socket) this.hinted = null;
    sfx.marimba(4 + piece * 2, 0.3);
    this.drawGlow();
    return true;
  }

  private drawMachine() {
    const bottom = this.top + (this.machine.rows + 1) * this.gap;
    const width = (this.machine.cols - 1) * COL_GAP + 120;
    this.panel
      .clear()
      .roundRect(this.left - 60, this.top - 58, width, bottom - this.top + 120, 30)
      .fill(wood.light)
      .stroke({ width: 7, color: wood.line });
    this.tracks.clear();
    for (let col = 0; col < this.machine.cols; col++) {
      this.tracks
        .moveTo(this.colX(col), this.top)
        .lineTo(this.colX(col), bottom)
        .stroke({ width: 5, color: wood.line, alpha: 0.22 });
      this.tracks
        .roundRect(this.colX(col) - 43, bottom - 8, 86, 34, 17)
        .fill({ color: cream, alpha: 0.75 })
        .stroke({ width: 3, color: wood.line, alpha: 0.35 });
    }
    this.startCup.clear();
    const starts = this.machine.blue ? [this.machine.start, this.machine.blue.start] : [this.machine.start];
    starts.forEach((start, m) => {
      const x = this.colX(start);
      this.startCup
        .moveTo(x - 38, this.top - 42)
        .lineTo(x - 17, this.top - 5)
        .lineTo(x + 17, this.top - 5)
        .lineTo(x + 38, this.top - 42)
        .fill(swatch.blue.light)
        .stroke({ width: 6, color: swatch.blue.line, join: 'round' });
      // With two marbles each cup shows which marble waits in it.
      if (this.machine.blue)
        this.startCup
          .circle(x, this.top - 30, 13)
          .fill(m ? swatch.blue.fill : swatch.red.fill)
          .stroke({ width: 4, color: m ? swatch.blue.line : swatch.red.line });
    });
    // Either cup replays the last run; with two cups one area spans both (the strip above the board holds nothing else).
    const lo = this.colX(Math.min(...starts)),
      hi = this.colX(Math.max(...starts));
    this.startCup.hitArea = new Rectangle(lo - 60, this.top - 80, hi - lo + 120, 104);

    this.sockets.removeChildren().forEach((c) => c.destroy({ children: true }));
    for (const cell of this.machine.sockets) {
      const spot = new Graphics()
        .circle(0, 0, PART_R)
        .fill({ color: cream, alpha: 0.78 })
        .stroke({ width: 6, color: wood.line, alpha: 0.65 });
      spot.circle(0, 0, 31).stroke({ width: 3, color: wood.line, alpha: 0.3 });
      spot.position.set(this.colX(cell.col), this.rowY(cell.row));
      this.sockets.addChild(spot);
    }
    this.fixed.removeChildren().forEach((c) => c.destroy({ children: true }));
    for (const part of this.machine.fixed) {
      const node = rampArt(part.ramp, false);
      node.position.set(this.colX(part.col), this.rowY(part.row));
      node.eventMode = 'none';
      this.fixed.addChild(node);
    }
    this.springNode = null;
    if (this.machine.spring) {
      this.springNode = springArt();
      this.springNode.position.set(this.colX(this.machine.spring.col), this.rowY(this.machine.spring.row));
      this.springNode.eventMode = 'none';
      this.fixed.addChild(this.springNode);
    }
    this.gateNode = this.gateRamp = null;
    if (this.machine.gate) {
      this.gateNode = gateArt(this.machine.gate.ramp);
      this.gateNode.position.set(this.colX(this.machine.gate.col), this.rowY(this.machine.gate.row));
      this.gateNode.eventMode = 'none';
      this.gateRamp = this.gateNode.getChildByLabel('gate-ramp');
      this.fixed.addChild(this.gateNode);
    }
    this.goal.removeChildren().forEach((c) => c.destroy({ children: true }));
    this.bellNodes.forEach((b) => b.node.destroy({ children: true }));
    this.bellNodes = [];
    if (this.machine.bells) {
      // Each bell is its own 104 by 140 target; neighbouring columns are 104 apart, so the areas meet but never overlap.
      for (const col of this.machine.bells) {
        const node = bellArt();
        node.position.set(this.colX(col), bottom - 32);
        node.hitArea = new Rectangle(-52, -84, 104, 140);
        onTap(node, () => this.pick(col), { cooldown: 250 });
        this.diagram.addChildAt(node, this.diagram.getChildIndex(this.pickRing) + 1);
        this.bellNodes.push({ col, node });
      }
      this.targetBell = this.bellNodes.find((b) => b.col === this.machine.target)!.node;
    } else {
      this.targetBell =
        this.skin.id === 'marble'
          ? bellArt(false, this.machine.blue ? swatch.red : undefined)
          : goalArt(this.skin);
      this.targetBell.position.set(this.colX(this.machine.target), bottom - 32);
      this.goal.addChild(this.targetBell);
    }
    this.blueBell = null;
    if (this.machine.blue) {
      this.blueBell = bellArt(false, swatch.blue);
      this.blueBell.position.set(this.colX(this.machine.blue.target), bottom - 32);
      this.goal.addChild(this.blueBell);
    }
    this.chimeBell = null;
    if (this.machine.chime) {
      this.chimeBell = bellArt(true);
      this.chimeBell.position.set(
        this.colX(this.machine.chime.col) + 42,
        this.rowY(this.machine.chime.row) - 34,
      );
      this.goal.addChild(this.chimeBell);
    }
    this.marble.position.set(this.colX(this.machine.start), this.top - 16);
    this.marble.visible = this.blueMarble.visible = false;
    this.drawPick();
    this.drawGlow();
  }

  /** Her prediction: tapping a bell rings its own little note and circles it. Any bell may be chosen; none is wrong. */
  private pick(col: number) {
    if (this.busy || this.finished || !this.plan.predict) return;
    this.picked = col;
    this.hinted = null;
    sfx.bell(2 + this.bellNodes.findIndex((b) => b.col === col) * 2, 0.18);
    this.drawPick();
    this.drawGlow();
  }

  private drawPick() {
    this.pickRing.clear();
    const bell = this.bellNodes.find((b) => b.col === this.picked);
    if (!bell) return;
    this.pickRing
      .roundRect(bell.node.x - 50, bell.node.y - 66, 100, 116, 26)
      .fill({ color: swatch.blue.light, alpha: 0.85 })
      .stroke({ width: 7, color: swatch.blue.line });
  }

  private drawGlow() {
    this.glow.clear();
    if (this.plan.predict) {
      if (this.followHint && !this.busy)
        this.glow
          .circle(this.colX(this.machine.start), this.top - 22, 58)
          .stroke({ width: 9, color: swatch.yellow.fill, alpha: 0.9 });
      return;
    }
    if (this.plan.turn) {
      if (this.turnGlow !== null && !this.busy) {
        const node = this.turnNodes[this.turnGlow];
        this.glow.circle(node.x, node.y, 59).stroke({ width: 9, color: swatch.yellow.fill, alpha: 0.9 });
      }
      return;
    }
    if (!this.hinted || this.busy) return;
    if (this.machine.gate && this.machine.chime && this.hintsChime()) {
      // Level 11's hint shows the chime's cell when the glowing ramp is the one that takes the marble there.
      const c = this.machine.chime;
      this.glow
        .circle(this.colX(c.col) + 42, this.rowY(c.row) - 34, 44)
        .fill({ color: swatch.yellow.light, alpha: 0.35 })
        .stroke({ width: 7, color: swatch.yellow.fill, alpha: 0.85 });
    }
    if (this.hintsSpring()) {
      // Level 10's hint also lights the spring's column when the ramp to place is the one that sends the marble onto it.
      const x = this.colX(this.machine.spring!.col);
      const bottom = this.top + (this.machine.rows + 1) * this.gap;
      this.glow
        .roundRect(x - 58, this.top - 10, 116, bottom - this.top - 20, 40)
        .fill({ color: swatch.yellow.light, alpha: 0.35 })
        .stroke({ width: 6, color: swatch.yellow.fill, alpha: 0.7 });
    }
    const socket = this.socketPosition(this.hinted.socket);
    const pulse = 62;
    this.glow.circle(socket.x, socket.y, pulse).stroke({ width: 9, color: swatch.yellow.fill, alpha: 0.9 });
    const part = this.parts[this.hinted.piece]?.node;
    if (part)
      this.glow.circle(part.x, part.y, pulse + 3).stroke({ width: 7, color: swatch.yellow.fill, alpha: 0.8 });
  }

  private help() {
    if (this.busy || this.finished) return;
    if (this.plan.predict) {
      // Following the way down is how a prediction is made, not assistance with an answer, so it is not counted.
      this.followHint = true;
      this.drawGlow();
      sfx.sparkle();
      return void this.say('chain.predict-hint');
    }
    if (this.plan.turn) {
      const piece = turnHint(this.machine, this.flipped);
      if (piece === null) return void this.say('chain.run-now');
      this.turnGlow = piece;
      this.hints++;
      this.drawGlow();
      sfx.sparkle();
      return void this.say('chain.turn-hint');
    }
    const hint = hintFor(this.machine, this.placement);
    if (!hint) return void this.say('chain.run-now');
    this.hinted = hint;
    this.hints++;
    this.drawGlow();
    sfx.sparkle();
    void this.say(
      this.hintsSpring()
        ? 'chain.spring-hint'
        : this.machine.spring
          ? 'chain.spring-hint-bell'
          : this.machine.gate
            ? this.hintsChime()
              ? 'chain.gate-hint'
              : 'chain.gate-hint-bell'
            : 'chain.hint',
    );
  }

  private async run() {
    if (this.busy || this.finished) return;
    if (this.plan.predict) return void this.runPrediction();
    if (this.placement.some((socket) => socket === null)) {
      sfx.boing();
      return void this.say('chain.parts');
    }
    this.busy = true;
    this.hinted = null;
    this.drawGlow();
    this.parts.forEach((p) => {
      p.handle.enabled = false;
    });
    const results = traces(this.machine, this.placement, this.flipped);
    this.lastTraces = results;
    if (results.some(bounced)) this.sawSpring = true;
    // Both marbles always run, one after the other, so a miss shows what each ramp did to each marble.
    for (const [m, result] of results.entries()) await this.animate(result, m as Marble);
    const bottom = this.top + (this.machine.rows + 1) * this.gap;
    if (works(this.machine, this.placement, this.flipped))
      return void this.success(this.machine.blue ? 'chain.two-rang' : 'chain.rang');
    this.drawTrail(results);
    sfx.boing();
    const [result, blue] = results;
    await this.say(
      blue
        ? result.success
          ? 'chain.two-blue'
          : blue.success
            ? 'chain.two-red'
            : 'chain.two-both'
        : this.machine.gate && gateMet(result) === 'shut'
          ? 'chain.gate-shut'
          : !result.chime && this.machine.chime
            ? 'chain.missed-chime'
            : result.end < this.machine.target
              ? 'chain.left'
              : 'chain.right',
    );
    await Promise.all(
      [this.marble, this.blueMarble]
        .filter((m) => m.visible)
        .map((m) => this.ctx.tw.to(m, { y: bottom - 10 }, { duration: 0.15, ease: ease.outBack })),
    );
    this.marble.visible = this.blueMarble.visible = false;
    this.setGate(false);
    this.parts.forEach((p) => {
      p.handle.enabled = true;
    });
    this.busy = false;
  }

  /**
   * Level 8: the marble runs the finished machine and rings its bell. A different bell from her choice is not a miss: the
   * pet says which bell rang, the trail stays to show why, and the next machine follows.
   */
  private async runPrediction() {
    if (this.picked === null) {
      sfx.pop(2);
      return void this.say('chain.predict-first');
    }
    this.busy = true;
    this.followHint = false;
    this.drawGlow();
    const result = trace(this.machine, []);
    this.lastTraces = [result];
    await this.animate(result);
    if (result.end === this.picked) return void this.success('chain.predict-right');
    this.drawTrail([result]);
    sfx.bell(4, 0.3);
    if (this.targetBell)
      await this.ctx.tw
        .to(this.targetBell.scale, { x: 1.15, y: 1.15 }, { duration: 0.12, ease: ease.outBack })
        .then(() => this.ctx.tw.to(this.targetBell!.scale, { x: 1, y: 1 }, { duration: 0.15 }));
    await this.say('chain.predict-other');
    await this.ctx.tw.wait(0.8);
    await this.ctx.tw.to(this.diagram, { alpha: 0 }, { duration: 0.3 });
    await this.next();
  }

  /** Tapping the start cup shows the last run again; it changes nothing and counts nothing. */
  private async watchAgain() {
    if (this.busy || this.finished || !this.lastTraces) return;
    const runs = this.lastTraces;
    this.busy = true;
    this.hinted = null;
    this.drawGlow();
    this.parts.forEach((p) => {
      p.handle.enabled = false;
    });
    for (const [m, result] of runs.entries()) await this.animate(result, m as Marble);
    this.drawTrail(runs);
    this.marble.visible = this.blueMarble.visible = false;
    this.setGate(false);
    this.parts.forEach((p) => {
      p.handle.enabled = true;
    });
    this.busy = false;
  }

  private async animate(result: Trace, which: Marble = 0) {
    const marble = which ? this.blueMarble : this.marble;
    if (!which) this.trail.clear();
    this.setGate(false);
    marble.visible = true;
    marble.position.set(
      this.colX(which && this.machine.blue ? this.machine.blue.start : this.machine.start),
      this.top - 18,
    );
    sfx.whoosh();
    let ramps = 0;
    for (const step of result.steps) {
      await this.ctx.tw.to(
        marble,
        { x: this.colX(step.col), y: this.rowY(step.row) - 15 },
        { duration: 0.28, ease: ease.inQuad },
      );
      if (
        this.machine.chime &&
        step.row === this.machine.chime.row &&
        step.col === this.machine.chime.col &&
        this.chimeBell
      ) {
        const bell = this.chimeBell;
        sfx.bell(6, 0.25);
        void this.ctx.tw
          .to(bell, { rotation: 0.18 }, { duration: 0.1 })
          .then(() => this.ctx.tw.to(bell, { rotation: -0.12 }, { duration: 0.12 }))
          .then(() => this.ctx.tw.to(bell, { rotation: 0 }, { duration: 0.1 }));
        // The chime opens the gate further down: its ramp slides in before the marble gets there.
        if (this.gateNode) await this.openGate();
      }
      if (step.spring) await this.bounce(marble, step.col, step.row);
      if (step.ramp) {
        sfx.marimba(rampStep(step.ramp, ramps++), 0.22);
        const next = step.col + (step.ramp === 'left' ? -1 : 1);
        await this.ctx.tw.to(
          marble,
          { x: this.colX(next), y: this.rowY(step.row) + this.gap * 0.55 },
          { duration: 0.3, ease: ease.inOutSine },
        );
      }
    }
    const bottom = this.top + (this.machine.rows + 1) * this.gap;
    await this.ctx.tw.to(
      marble,
      { x: this.colX(result.end), y: bottom - 25 },
      { duration: 0.32, ease: ease.inQuad },
    );
    const bell = which ? this.blueBell : this.machine.blue ? this.targetBell : null;
    if (bell && result.success) {
      sfx.bell(which ? 6 : 4, 0.25);
      void this.ctx.tw
        .to(bell.scale, { x: 1.12, y: 1.12 }, { duration: 0.1 })
        .then(() => this.ctx.tw.to(bell.scale, { x: 1, y: 1 }, { duration: 0.12 }));
    }
  }

  /** Show the gate's ramp solid (open) or faint (shut). */
  private setGate(open: boolean) {
    if (this.gateRamp) this.gateRamp.alpha = open ? 1 : GATE_SHUT;
  }

  private async openGate() {
    const gate = this.gateNode,
      ramp = this.gateRamp;
    if (!gate || !ramp) return;
    sfx.sparkle();
    void this.ctx.tw.to(ramp, { alpha: 1 }, { duration: 0.2 });
    await this.ctx.tw.to(gate.scale, { x: 1.12, y: 1.12 }, { duration: 0.12, ease: ease.outBack });
    await this.ctx.tw.to(gate.scale, { x: 1, y: 1 }, { duration: 0.12 });
  }

  /** In a working design, the hinted ramp comes before the chime, so it is the one that takes the marble there. */
  private hintsChime() {
    const { chime } = this.machine;
    const hinted = this.hinted;
    if (!chime || !hinted) return false;
    const cell = this.machine.sockets[hinted.socket];
    const way = solutions(this.machine).find((w) => w.includes(hinted.socket));
    if (!way) return false;
    const steps = trace(this.machine, way).steps;
    const at = steps.findIndex((st) => st.row === cell.row && st.col === cell.col);
    const rang = steps.findIndex((st) => st.row === chime.row && st.col === chime.col);
    return at >= 0 && rang >= 0 && at < rang;
  }

  /** The hinted socket is above the spring, so that ramp is the one that lands the marble on it. */
  private hintsSpring() {
    const spring = this.machine.spring;
    return !!spring && !!this.hinted && this.machine.sockets[this.hinted.socket].row < spring.row;
  }

  /** The spring squashes, then the marble hops out and over the next row's part, landing two rows down. */
  private async bounce(marble: Container, col: number, row: number) {
    const spring = this.springNode;
    if (spring) {
      await this.ctx.tw.to(spring.scale, { y: 0.7 }, { duration: 0.08 });
      void this.ctx.tw.to(spring.scale, { y: 1 }, { duration: 0.2, ease: ease.outBack });
    }
    sfx.pluck(9, 0.3);
    await this.ctx.tw.to(
      marble,
      { x: this.colX(col) + this.hopSide(col), y: this.rowY(row + 1) - 15 },
      { duration: 0.24, ease: ease.outQuad },
    );
    void this.ctx.tw
      .to(marble.scale, { x: 1.3, y: 1.3 }, { duration: 0.12 })
      .then(() => this.ctx.tw.to(marble.scale, { x: 1, y: 1 }, { duration: 0.12 }));
  }

  /** The hop swings half a column out (inward at the right wall) so it reads as going over the skipped part. */
  private hopSide(col: number) {
    return (col === this.machine.cols - 1 ? -1 : 1) * COL_GAP * 0.55;
  }

  /** A faint path of each marble's last run in its own colour, kept until the next run so the two can be compared. */
  private drawTrail(results: Trace[]) {
    const bottom = this.top + (this.machine.rows + 1) * this.gap;
    this.trail.clear();
    results.forEach((result, m) => {
      const start = m && this.machine.blue ? this.machine.blue.start : this.machine.start;
      this.trail.moveTo(this.colX(start), this.top - 18);
      for (const step of result.steps) {
        this.trail.lineTo(this.colX(step.col), this.rowY(step.row) - 15);
        if (step.spring)
          this.trail.lineTo(this.colX(step.col) + this.hopSide(step.col), this.rowY(step.row + 1) - 15);
        if (step.ramp)
          this.trail.lineTo(
            this.colX(step.col + (step.ramp === 'left' ? -1 : 1)),
            this.rowY(step.row) + this.gap * 0.55,
          );
      }
      this.trail.lineTo(this.colX(result.end), bottom - 25).stroke({
        width: 9,
        color: m ? swatch.blue.fill : swatch.red.fill,
        alpha: 0.35,
        cap: 'round',
        join: 'round',
      });
    });
  }

  private async success(line: LineId = 'chain.rang') {
    sfx.tada();
    const bells = [this.targetBell, this.blueBell].filter((b): b is Container => !!b);
    await Promise.all(
      bells.map((b) => this.ctx.tw.to(b.scale, { x: 1.18, y: 1.18 }, { duration: 0.12, ease: ease.outBack })),
    );
    await Promise.all(bells.map((b) => this.ctx.tw.to(b.scale, { x: 1, y: 1 }, { duration: 0.15 })));
    const at = { x: this.marble.x, y: this.marble.y };
    this.ctx.particles.burst(at.x, at.y, {
      kind: 'star',
      colors: [swatch.yellow.fill, swatch.orange.fill, 0xffffff],
      count: 20,
      speed: [120, 300],
      gravity: 140,
      life: [0.5, 0.9],
    });
    this.ctx.pet.cheer();
    await this.say(line);
    await this.ctx.tw.to(this.diagram, { alpha: 0 }, { duration: 0.3 });
    await this.next();
  }

  private async finale() {
    if (this.settled) return;
    this.settled = true;
    this.finished = true;
    sfx.tada();
    await this.say('chain.done');
    await this.ctx.tw.wait(0.4);
    this.ctx.finish({
      misses: this.misses,
      hints: this.hints,
      discoveries: this.sawSpring ? [entryId('chain-reaction', 'spring-skip')] : undefined,
    });
  }
}

class ChainIcon extends WigglyIcon {
  constructor() {
    const c = new Container();
    const a = rampArt('right', true);
    const b = rampArt('left', false);
    a.scale.set(0.78);
    b.scale.set(0.78);
    a.position.set(-45, -145);
    b.position.set(45, -70);
    const marble = new Graphics()
      .circle(-38, -205, 22)
      .fill(swatch.red.fill)
      .stroke({ width: 5, color: swatch.red.line });
    const bell = bellArt();
    bell.scale.set(0.65);
    bell.position.set(70, -12);
    c.addChild(a, b, marble, bell);
    super(c);
  }
}

function sticker(seed: number): Container {
  const rng = new Rng(seed);
  const c = new Container();
  c.addChild(
    new Graphics()
      .poly(starPoints(84, 70, 12))
      .fill(rng.chance(0.5) ? swatch.yellow.light : swatch.teal.light)
      .stroke({ width: 6, color: swatch.yellow.line, join: 'round' }),
  );
  const ramp = rampArt(rng.chance(0.5) ? 'left' : 'right', true);
  ramp.scale.set(0.72);
  ramp.position.set(-10, -5);
  c.addChild(ramp);
  c.addChild(
    new Graphics().circle(34, -55, 17).fill(swatch.red.fill).stroke({ width: 4, color: swatch.red.line }),
  );
  return c;
}

export const chainReaction: GameModule = {
  id: 'chain-reaction',
  name: 'Chain Reaction',
  titleLine: 'game.chain-reaction',
  region: 'tinker-lab',
  challenge: 'space',
  skills: ['prediction', 'cause-and-effect', 'planning', 'revision'],
  bands: ['prek', 'school'],
  upright: true,
  levels: (band) => rangeFor(LEVELS, band),
  entryLevels: [TAP_TO_TURN, WHICH_BELL],
  describeLevel: (level) => planFor(level).name,
  music: STYLES.paint,
  touchDemo: true,
  coplayHint: 'Before running it, trace the marble with a finger and predict where each ramp will send it.',
  offScreen:
    'Prop up a book as a ramp for a toy ball. Change one part of the setup, predict where the ball will go, then try it.',
  hubIcon: () => new ChainIcon(),
  sticker,
  create: (ctx) => new ChainReaction(ctx),
};
