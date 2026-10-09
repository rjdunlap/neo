import { Circle, Container, Graphics } from 'pixi.js';
import { cream, ink, swatch, wood } from '../../art/palette';
import { starPoints } from '../../art/shapes';
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
import { chainTouch, hintFor, makeBoards, planFor, trace, type ChainBoard, type ChainPlan, type Layout, type Ramp } from './logic';

const LEVELS: BandLevels = {
  prek: { min: 1, max: 3 },
  school: { min: 3, max: 6 },
};

const COL_GAP = 104;
const PART_R = 52;

/** A chunky wooden ramp. The pale groove shows exactly where the marble will leave it. */
export function rampArt(ramp: Ramp, loose = false): Container {
  const c = new Container();
  const fill = loose ? (ramp === 'left' ? swatch.purple.fill : swatch.teal.fill) : wood.fill;
  const line = loose ? (ramp === 'left' ? swatch.purple.line : swatch.teal.line) : wood.line;
  const g = new Graphics()
    .roundRect(-48, -44, 96, 88, 22).fill(fill).stroke({ width: 6, color: line });
  const end = ramp === 'left' ? -34 : 34;
  g.moveTo(0, -28).lineTo(end, 25).stroke({ width: 18, color: cream, cap: 'round' });
  g.circle(0, -28, 10).fill(swatch.yellow.fill).stroke({ width: 3, color: swatch.yellow.line });
  g.circle(end, 25, 10).fill(swatch.blue.light).stroke({ width: 3, color: swatch.blue.line });
  c.addChild(g);
  c.hitArea = new Circle(0, 0, PART_R + 6);
  return c;
}

function bellArt(small = false): Container {
  const c = new Container();
  const s = small ? 0.72 : 1;
  const g = new Graphics();
  g.moveTo(-34 * s, 18 * s).quadraticCurveTo(-28 * s, -35 * s, 0, -42 * s).quadraticCurveTo(28 * s, -35 * s, 34 * s, 18 * s)
    .lineTo(42 * s, 28 * s).lineTo(-42 * s, 28 * s).closePath().fill(swatch.yellow.fill).stroke({ width: 6 * s, color: swatch.yellow.line, join: 'round' });
  g.circle(0, 37 * s, 10 * s).fill(swatch.orange.fill).stroke({ width: 4 * s, color: swatch.orange.line });
  g.roundRect(-12 * s, -53 * s, 24 * s, 15 * s, 7 * s).fill(wood.fill).stroke({ width: 4 * s, color: wood.line });
  c.addChild(g);
  return c;
}

function roundButton(fill: number, line: number, picture: (g: Graphics) => void): Container {
  const c = new Container();
  const g = new Graphics().circle(0, 5, 57).fill({ color: ink, alpha: 0.16 }).circle(0, 0, 57).fill(fill).stroke({ width: 6, color: line });
  picture(g);
  c.addChild(g);
  c.hitArea = new Circle(0, 0, 62);
  return c;
}

class ChainReaction implements Game {
  readonly plan: ChainPlan;
  readonly boards: ChainBoard[];
  index = -1;
  machine!: ChainBoard;
  placement: Layout = [];
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
  private readonly marble = new Graphics().circle(0, 0, 19).fill(swatch.red.fill).stroke({ width: 5, color: swatch.red.line });
  private readonly glow = new Graphics();
  private targetBell: Container | null = null;
  private chimeBell: Container | null = null;
  private hinted: { piece: number; socket: number } | null = null;
  private settled = false;
  private top = 120;
  private gap = 92;
  private left = 180;

  constructor(private readonly ctx: GameContext) {
    this.plan = planFor(ctx.level);
    this.boards = makeBoards(this.plan, ctx.rng);
    this.panel.eventMode = this.tracks.eventMode = this.sockets.eventMode = this.fixed.eventMode = this.goal.eventMode = this.glow.eventMode = 'none';
    this.marble.visible = false;
    this.diagram.addChild(this.panel, this.tracks, this.sockets, this.fixed, this.goal, this.startCup, this.marble, this.glow);

    this.runButton = roundButton(swatch.green.fill, swatch.green.line, (g) => {
      g.poly([-18, -27, 30, 0, -18, 27]).fill(cream).stroke({ width: 4, color: swatch.green.line, join: 'round' });
    });
    this.helpButton = roundButton(swatch.yellow.fill, swatch.yellow.line, (g) => {
      g.circle(0, -10, 19).stroke({ width: 8, color: ink });
      g.moveTo(-10, 6).lineTo(-6, 22).lineTo(6, 22).lineTo(10, 6).stroke({ width: 7, color: ink, cap: 'round', join: 'round' });
      g.moveTo(-7, 33).lineTo(7, 33).stroke({ width: 7, color: ink, cap: 'round' });
    });
    onTap(this.runButton, () => void this.run(), { cooldown: 400 });
    onTap(this.helpButton, () => this.help(), { cooldown: 500 });
    ctx.stage.addChild(this.diagram, this.runButton, this.helpButton);
  }

  start() {
    void this.next();
  }

  resize(v: View) {
    const span = (this.plan.cols - 1) * COL_GAP;
    this.left = Math.max(190, (v.w - 225 - span) / 2);
    this.top = 112;
    this.gap = Math.min(96, (Math.min(v.h - 90, 680) - this.top) / (this.plan.rows + 1));
    this.runButton.position.set(v.w - 100, 180);
    this.helpButton.position.set(v.w - 100, 305);
    this.parts.forEach((part, i) => {
      part.home.x = v.w - 100;
      part.home.y = 455 + i * 122;
      part.handle.home = { ...part.home };
      const socket = this.placement[i];
      const at = socket === null || socket === undefined ? part.home : this.socketPosition(socket);
      part.node.position.set(at.x, at.y);
    });
    if (this.machine) this.drawMachine();
  }

  update() {}

  /** Carry each ramp along a working design, then run the marble through the finished machine. */
  autotouch(): TouchIntent | null {
    if (this.busy || this.finished || !this.machine) return null;
    const move = chainTouch(this.machine, this.placement);
    if (!move) return null;
    if (move.kind === 'run') return { tap: { on: this.runButton } };
    const part = this.parts[move.piece];
    const at = this.socketPosition(move.socket);
    return part && !part.handle.dragging ? { drag: { on: part.node }, to: { on: this.ctx.stage, x: at.x, y: at.y } } : null;
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

  private async next() {
    this.busy = true;
    this.index++;
    this.hinted = null;
    if (this.index >= this.boards.length) return void this.finale();
    this.machine = this.boards[this.index];
    this.placement = Array(this.machine.loose.length).fill(null);
    for (const p of this.parts) p.handle.destroy();
    this.parts.splice(0).forEach((p) => p.node.destroy({ children: true }));
    this.makeParts();
    // The first machine at level 1 shows the useful socket without counting it as assistance.
    if (this.ctx.level === 1 && this.index === 0) this.hinted = hintFor(this.machine, this.placement);
    this.drawMachine();
    this.diagram.alpha = 0;
    await this.ctx.tw.to(this.diagram, { alpha: 1 }, { duration: 0.3 });
    this.busy = false;
    this.drawGlow();
    if (this.index === 0) await this.ctx.instruct(this.plan.chime ? 'chain.chime-start' : 'chain.start');
  }

  private makeParts() {
    this.machine.loose.forEach((ramp, piece) => {
      const node = rampArt(ramp, true);
      const home = { x: this.ctx.view.w - 100, y: 455 + piece * 122 };
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
      if (d < distance) { distance = d; socket = i; }
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
    this.panel.clear().roundRect(this.left - 60, this.top - 58, width, bottom - this.top + 120, 30)
      .fill(wood.light).stroke({ width: 7, color: wood.line });
    this.tracks.clear();
    for (let col = 0; col < this.machine.cols; col++) {
      this.tracks.moveTo(this.colX(col), this.top).lineTo(this.colX(col), bottom).stroke({ width: 5, color: wood.line, alpha: 0.22 });
      this.tracks.roundRect(this.colX(col) - 43, bottom - 8, 86, 34, 17).fill({ color: cream, alpha: 0.75 }).stroke({ width: 3, color: wood.line, alpha: 0.35 });
    }
    this.startCup.clear().moveTo(this.colX(this.machine.start) - 38, this.top - 42).lineTo(this.colX(this.machine.start) - 17, this.top - 5)
      .lineTo(this.colX(this.machine.start) + 17, this.top - 5).lineTo(this.colX(this.machine.start) + 38, this.top - 42)
      .fill(swatch.blue.light).stroke({ width: 6, color: swatch.blue.line, join: 'round' });

    this.sockets.removeChildren().forEach((c) => c.destroy({ children: true }));
    for (const cell of this.machine.sockets) {
      const spot = new Graphics().circle(0, 0, PART_R).fill({ color: cream, alpha: 0.78 }).stroke({ width: 6, color: wood.line, alpha: 0.65 });
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
    this.goal.removeChildren().forEach((c) => c.destroy({ children: true }));
    this.targetBell = bellArt();
    this.targetBell.position.set(this.colX(this.machine.target), bottom - 32);
    this.goal.addChild(this.targetBell);
    this.chimeBell = null;
    if (this.machine.chime) {
      this.chimeBell = bellArt(true);
      this.chimeBell.position.set(this.colX(this.machine.chime.col) + 42, this.rowY(this.machine.chime.row) - 34);
      this.goal.addChild(this.chimeBell);
    }
    this.marble.position.set(this.colX(this.machine.start), this.top - 16);
    this.drawGlow();
  }

  private drawGlow() {
    this.glow.clear();
    if (!this.hinted || this.busy) return;
    const socket = this.socketPosition(this.hinted.socket);
    const pulse = 62;
    this.glow.circle(socket.x, socket.y, pulse).stroke({ width: 9, color: swatch.yellow.fill, alpha: 0.9 });
    const part = this.parts[this.hinted.piece]?.node;
    if (part) this.glow.circle(part.x, part.y, pulse + 3).stroke({ width: 7, color: swatch.yellow.fill, alpha: 0.8 });
  }

  private help() {
    if (this.busy || this.finished) return;
    const hint = hintFor(this.machine, this.placement);
    if (!hint) return void this.ctx.say('chain.run-now');
    this.hinted = hint;
    this.hints++;
    this.drawGlow();
    sfx.sparkle();
    void this.ctx.say('chain.hint');
  }

  private async run() {
    if (this.busy || this.finished) return;
    if (this.placement.some((socket) => socket === null)) {
      sfx.boing();
      return void this.ctx.say('chain.parts');
    }
    this.busy = true;
    this.hinted = null;
    this.drawGlow();
    this.parts.forEach((p) => { p.handle.enabled = false; });
    const result = trace(this.machine, this.placement);
    this.marble.visible = true;
    this.marble.position.set(this.colX(this.machine.start), this.top - 18);
    sfx.whoosh();
    for (const step of result.steps) {
      await this.ctx.tw.to(this.marble, { x: this.colX(step.col), y: this.rowY(step.row) - 15 }, { duration: 0.28, ease: ease.inQuad });
      if (this.machine.chime && step.row === this.machine.chime.row && step.col === this.machine.chime.col && this.chimeBell) {
        const bell = this.chimeBell;
        sfx.bell(6, 0.25);
        void this.ctx.tw.to(bell, { rotation: 0.18 }, { duration: 0.1 }).then(() => this.ctx.tw.to(bell, { rotation: -0.12 }, { duration: 0.12 })).then(() => this.ctx.tw.to(bell, { rotation: 0 }, { duration: 0.1 }));
      }
      if (step.ramp) {
        sfx.marimba(step.ramp === 'left' ? 4 : 8, 0.22);
        const next = step.col + (step.ramp === 'left' ? -1 : 1);
        await this.ctx.tw.to(this.marble, { x: this.colX(next), y: this.rowY(step.row) + this.gap * 0.55 }, { duration: 0.3, ease: ease.inOutSine });
      }
    }
    const bottom = this.top + (this.machine.rows + 1) * this.gap;
    await this.ctx.tw.to(this.marble, { x: this.colX(result.end), y: bottom - 25 }, { duration: 0.32, ease: ease.inQuad });
    if (result.success) return void this.success();
    sfx.boing();
    await this.ctx.say(!result.chime && this.machine.chime ? 'chain.missed-chime' : result.end < this.machine.target ? 'chain.left' : 'chain.right');
    await this.ctx.tw.to(this.marble, { y: bottom - 10 }, { duration: 0.15, ease: ease.outBack });
    this.marble.visible = false;
    this.parts.forEach((p) => { p.handle.enabled = true; });
    this.busy = false;
  }

  private async success() {
    sfx.tada();
    if (this.targetBell) {
      await this.ctx.tw.to(this.targetBell.scale, { x: 1.18, y: 1.18 }, { duration: 0.12, ease: ease.outBack });
      await this.ctx.tw.to(this.targetBell.scale, { x: 1, y: 1 }, { duration: 0.15 });
    }
    const at = { x: this.marble.x, y: this.marble.y };
    this.ctx.particles.burst(at.x, at.y, { kind: 'star', colors: [swatch.yellow.fill, swatch.orange.fill, 0xffffff], count: 20, speed: [120, 300], gravity: 140, life: [0.5, 0.9] });
    this.ctx.pet.cheer();
    await this.ctx.say('chain.rang');
    await this.ctx.tw.to(this.diagram, { alpha: 0 }, { duration: 0.3 });
    await this.next();
  }

  private async finale() {
    if (this.settled) return;
    this.settled = true;
    this.finished = true;
    sfx.tada();
    await this.ctx.say('chain.done');
    await this.ctx.tw.wait(0.4);
    this.ctx.finish({ misses: this.misses, hints: this.hints });
  }
}

class ChainIcon extends WigglyIcon {
  constructor() {
    const c = new Container();
    const a = rampArt('right', true);
    const b = rampArt('left', false);
    a.scale.set(0.78); b.scale.set(0.78);
    a.position.set(-45, -145); b.position.set(45, -70);
    const marble = new Graphics().circle(-38, -205, 22).fill(swatch.red.fill).stroke({ width: 5, color: swatch.red.line });
    const bell = bellArt(); bell.scale.set(0.65); bell.position.set(70, -12);
    c.addChild(a, b, marble, bell);
    super(c);
  }
}

function sticker(seed: number): Container {
  const rng = new Rng(seed);
  const c = new Container();
  c.addChild(new Graphics().poly(starPoints(84, 70, 12)).fill(rng.chance(0.5) ? swatch.yellow.light : swatch.teal.light).stroke({ width: 6, color: swatch.yellow.line, join: 'round' }));
  const ramp = rampArt(rng.chance(0.5) ? 'left' : 'right', true);
  ramp.scale.set(0.72);
  ramp.position.set(-10, -5);
  c.addChild(ramp);
  c.addChild(new Graphics().circle(34, -55, 17).fill(swatch.red.fill).stroke({ width: 4, color: swatch.red.line }));
  return c;
}

export const chainReaction: GameModule = {
  id: 'chain-reaction',
  name: 'Chain Reaction',
  titleLine: 'game.chain-reaction',
  region: 'tinker-lab',
  skills: ['prediction', 'cause-and-effect', 'planning', 'revision'],
  bands: ['prek', 'school'],
  levels: (band) => rangeFor(LEVELS, band),
  describeLevel: (level) => planFor(level).name,
  music: STYLES.paint,
  touchDemo: true,
  coplayHint: 'Before running it, trace the marble with a finger and predict where each ramp will send it.',
  offScreen: 'Prop up a book as a ramp for a toy ball. Change one part of the setup, predict where the ball will go, then try it.',
  hubIcon: () => new ChainIcon(),
  sticker,
  create: (ctx) => new ChainReaction(ctx),
};
