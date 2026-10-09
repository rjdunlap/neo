import { Container, Graphics, Rectangle, type FederatedPointerEvent } from 'pixi.js';
import { swatch, type ColorName } from '../../art/palette';
import { Backdrop } from '../../art/scenery';
import { STYLES } from '../../audio/music';
import { sfx } from '../../audio/sfx';
import { palmOnGlass } from '../../engine/input';
import { Rng } from '../../engine/random';
import { ease } from '../../engine/tween';
import type { View } from '../../engine/view';
import { WigglyIcon } from '../shared';
import type { Game, GameContext, GameModule, TouchIntent } from '../types';
import { collapse, demoMove, DOT_COLORS, ensureMove, findLine, findSquare, makeGrid, planFor, popped, step, type Cell, type DotPlan, type Grid } from './logic';
import { rangeFor, type BandLevels } from '../../progress/difficulty';

const LEVELS: BandLevels = {
  lap: { min: 1, max: 1 },
  toddler: { min: 1, max: 2 },
  preschool: { min: 2, max: 4 },
  prek: { min: 3, max: 5 },
};

const GAP = 108;
const DOT_R = 34;

class DotLink implements Game {
  readonly plan: DotPlan;
  readonly palette: ColorName[];
  readonly target: ColorName | undefined;
  grid: Grid;
  dots: Graphics[][] = [];
  path: Cell[] = [];
  loop = false;
  progress = 0;
  misses = 0;
  hints = 0;
  busy = false;
  finished = false;

  private readonly backdrop: Backdrop;
  private readonly board = new Container();
  private readonly lines = new Graphics();
  private readonly layer = new Container();
  private readonly touch = new Container();
  private pointer: number | null = null;
  private wrongs = 0;
  private idle = 0;
  private clock = 0;
  private hintCells: Cell[] = [];

  constructor(private readonly ctx: GameContext) {
    this.plan = planFor(ctx.level);
    this.palette = ctx.rng.shuffle([...DOT_COLORS]).slice(0, this.plan.colors);
    this.target = this.plan.mode === 'color' ? this.palette[0] : undefined;
    this.grid = ensureMove(this.plan, makeGrid(this.plan, ctx.rng, this.palette), ctx.rng, this.target);
    this.backdrop = new Backdrop({ sky: [0xfde2f0, 0xfff4e3], hills: [0xc8ecb0, 0xa6de8e], horizon: 0.82, clouds: 2, seed: 81 }, ctx.view);
    this.board.addChild(this.lines, this.layer, this.touch);
    ctx.stage.addChild(this.backdrop, this.board);
    this.buildDots();

    this.touch.eventMode = 'static';
    this.touch.hitArea = new Rectangle(-GAP / 2, -GAP / 2, this.plan.cols * GAP, this.plan.rows * GAP);
    this.touch.on('pointerdown', (e: FederatedPointerEvent) => this.down(e));
    this.touch.on('globalpointermove', (e: FederatedPointerEvent) => e.pointerId === this.pointer && this.move(e));
    this.touch.on('pointerup', (e: FederatedPointerEvent) => e.pointerId === this.pointer && this.up());
    this.touch.on('pointerupoutside', (e: FederatedPointerEvent) => e.pointerId === this.pointer && this.up());
  }

  start() {
    const p = this.plan;
    switch (p.mode) {
      case 'tap':
        return void this.ctx.instruct('dots.tap');
      case 'pair':
        return void this.ctx.instruct('dots.pair');
      case 'color':
        return void this.ctx.instruct('dots.color', { n: p.goal, color: this.target! });
      case 'chain':
        return void this.ctx.instruct('dots.chain', { n: p.length! });
      case 'square':
        return void this.ctx.instruct('dots.square');
    }
  }

  private pos(c: Cell) {
    return { x: c.c * GAP, y: c.r * GAP };
  }

  private drawDot(g: Graphics, color: ColorName) {
    const sw = swatch[color];
    g.clear().circle(0, 0, DOT_R).fill(sw.fill).stroke({ width: 5, color: sw.line });
    g.circle(-10, -10, 9).fill({ color: 0xffffff, alpha: 0.5 });
  }

  private buildDots() {
    this.layer.removeChildren().forEach((c) => c.destroy());
    this.dots = this.grid.map((row, r) =>
      row.map((color, c) => {
        const g = new Graphics();
        this.drawDot(g, color);
        g.position.copyFrom(this.pos({ r, c }));
        this.layer.addChild(g);
        return g;
      }),
    );
  }

  resize(v: View) {
    this.backdrop.resize(v);
    const w = (this.plan.cols - 1) * GAP;
    const h = (this.plan.rows - 1) * GAP;
    const s = Math.min(1, (v.h - 150) / (h + GAP), (v.w - 260) / (w + GAP));
    this.board.scale.set(s);
    this.board.position.set(Math.max(190 + (GAP * s) / 2, (v.w - w * s) / 2), (v.h - h * s) / 2 + 20);
  }

  update(dt: number) {
    this.clock += dt;
    if (!this.busy && !this.finished && !this.path.length) {
      this.idle += dt;
      if (this.idle > 12 && !this.hintCells.length) this.hint();
    }
    // Hinted dots bob gently.
    this.dots.forEach((row, r) => row.forEach((g, c) => {
      const lit = this.hintCells.some((h) => h.r === r && h.c === c);
      const inPath = this.path.some((p) => p.r === r && p.c === c);
      const k = inPath ? 1.15 : lit ? 1 + 0.12 * Math.abs(Math.sin(this.clock * 5)) : 1;
      g.scale.x += (k - g.scale.x) * Math.min(1, dt * 12);
      g.scale.y = g.scale.x;
    }));
  }

  autotouch(): TouchIntent | null {
    if (this.busy || this.finished || this.path.length) return null;
    const move = demoMove(this.plan, this.grid, this.target);
    if (!move) return null;
    const spots = move.map((cell) => ({ on: this.touch, ...this.pos(cell) }));
    return move.length === 1
      ? { tap: spots[0], pause: 0.12 }
      : { trace: spots[0], via: spots.slice(1), pause: 0.12 };
  }

  destroy() {
    this.touch.removeAllListeners();
  }

  /** Which dot (if any) is under a board point; generous, so near misses still catch. */
  private cellAt(e: FederatedPointerEvent): Cell | null {
    const p = this.board.toLocal(e.global);
    const c = Math.round(p.x / GAP);
    const r = Math.round(p.y / GAP);
    if (r < 0 || c < 0 || r >= this.plan.rows || c >= this.plan.cols) return null;
    return Math.hypot(p.x - c * GAP, p.y - r * GAP) < GAP * 0.45 ? { r, c } : null;
  }

  private down(e: FederatedPointerEvent) {
    if (this.busy || this.finished || palmOnGlass()) return;
    const cell = this.cellAt(e);
    if (!cell) return;
    this.idle = 0;
    if (this.plan.mode === 'tap') {
      void this.pop([cell], false);
      return;
    }
    this.pointer = e.pointerId;
    this.path = [cell];
    this.loop = false;
    sfx.pop(5);
    this.drawLine();
  }

  private move(e: FederatedPointerEvent) {
    const cell = this.cellAt(e);
    if (!cell || this.loop) return;
    const result = step(this.grid, this.path, cell);
    if (result === 'extend') {
      this.path.push(cell);
      sfx.pop(5 + Math.min(8, this.path.length));
      if (this.plan.mode === 'chain') void this.ctx.say('count', { n: this.path.length });
    } else if (result === 'back') {
      this.path.pop();
      sfx.tick();
    } else if (result === 'loop') {
      this.loop = true;
      sfx.sparkle();
    }
    this.drawLine(e);
  }

  private drawLine(e?: FederatedPointerEvent) {
    const g = this.lines.clear();
    if (!this.path.length) return;
    const sw = swatch[this.grid[this.path[0].r][this.path[0].c]];
    const pts = this.path.map((c) => this.pos(c));
    if (this.loop) pts.push(pts[0]);
    else if (e) pts.push(this.board.toLocal(e.global));
    g.moveTo(pts[0].x, pts[0].y);
    for (const p of pts.slice(1)) g.lineTo(p.x, p.y);
    g.stroke({ width: 16, color: sw.line, cap: 'round', join: 'round' });
  }

  private up() {
    this.pointer = null;
    const path = this.path;
    const loop = this.loop;
    this.path = [];
    this.loop = false;
    this.lines.clear();
    if (path.length < 2) return;
    void this.judge(path, loop);
  }

  /** A finished line: pop it, then see if it counts toward the goal. */
  private async judge(path: Cell[], loop: boolean) {
    const color = this.grid[path[0].r][path[0].c];
    const p = this.plan;
    let counts = 0;
    let line: 'dots.notthat' | 'dots.longer' | 'dots.around' | null = null;
    if (p.mode === 'pair') counts = 1;
    else if (p.mode === 'color') {
      if (color === this.target) counts = loop ? popped(this.grid, path, true).length : path.length;
      else line = 'dots.notthat';
    } else if (p.mode === 'chain') {
      if (path.length >= p.length! || loop) counts = 1;
      else line = 'dots.longer';
    } else if (p.mode === 'square') {
      if (loop) counts = 1;
      else line = 'dots.around';
    }
    if (line) {
      this.misses++;
      this.wrongs++;
      sfx.boing();
      void this.ctx.say(line, { wrong: color, color: this.target ?? color, n: p.length ?? 2 });
      if (this.wrongs >= 2) this.hint();
    } else {
      this.wrongs = 0;
      this.hintCells = [];
    }
    await this.pop(path, loop, counts);
  }

  private async pop(path: Cell[], loop: boolean, counts = 1) {
    this.busy = true;
    const gone = popped(this.grid, path, loop);
    const tw = this.ctx.tw;
    for (const c of gone) {
      const g = this.dots[c.r][c.c];
      const at = this.ctx.stage.toLocal(this.board.toGlobal(g.position));
      this.ctx.particles.burst(at.x, at.y, { colors: [swatch[this.grid[c.r][c.c]].fill, 0xffffff], count: 5, speed: [60, 160], gravity: 200, size: [0.25, 0.4] });
      void tw.to(g.scale, { x: 0, y: 0 }, { duration: 0.18 });
    }
    sfx.pop(9);
    if (loop) sfx.tada();
    const before = this.progress;
    this.progress += counts;
    if (this.plan.mode === 'color' && counts) void this.ctx.say('count', { n: Math.min(this.plan.goal, this.progress) });
    else if (this.plan.mode !== 'color' && counts && this.plan.mode !== 'tap') void this.ctx.say('praise');
    await tw.wait(0.22);
    // Gravity: everything above falls into the gaps, new dots drop in from the top.
    const { grid, falls } = collapse(this.grid, gone, this.ctx.rng, this.palette);
    this.grid = ensureMove(this.plan, grid, this.ctx.rng, this.target);
    this.buildDots();
    for (const f of falls) {
      const g = this.dots[f.to][f.c];
      const to = g.y;
      g.y = f.from * GAP;
      void tw.to(g, { y: to }, { duration: 0.32, ease: ease.outBack });
    }
    // A repainted dot (to keep a move possible) just appears in place.
    await tw.wait(0.34);
    this.busy = false;
    if (this.progress >= this.plan.goal && before < this.plan.goal) void this.finale();
  }

  /** Light up a move that would count right now. */
  private hint() {
    const p = this.plan;
    const cells = p.mode === 'square' ? findSquare(this.grid) : findLine(this.grid, p.mode === 'chain' ? p.length! : 2, this.target);
    if (!cells) return;
    this.hintCells = cells;
    this.hints++;
    this.wrongs = 0;
  }

  private async finale() {
    if (this.finished) return;
    this.finished = true;
    sfx.tada();
    this.ctx.pet.cheer();
    const c = this.ctx.stage.toLocal(this.board.toGlobal({ x: ((this.plan.cols - 1) * GAP) / 2, y: ((this.plan.rows - 1) * GAP) / 2 }));
    this.ctx.particles.burst(c.x, c.y, { kind: 'star', colors: [0xffffff, 0xfff3a0, ...this.palette.map((k) => swatch[k].fill)], count: 30, speed: [150, 400], gravity: 0, life: [0.8, 1.2] });
    await this.ctx.say('dots.done');
    await this.ctx.tw.wait(0.8);
    this.ctx.finish({ misses: this.misses, hints: this.hints });
  }
}

class DotsIcon extends WigglyIcon {
  constructor() {
    const c = new Container();
    const g = new Graphics();
    const colors: ColorName[] = ['red', 'red', 'blue', 'yellow', 'red', 'blue', 'yellow', 'yellow', 'green'];
    g.moveTo(-60, -170).lineTo(0, -170).lineTo(-60, -110).stroke({ width: 10, color: swatch.red.line, cap: 'round', join: 'round' });
    colors.forEach((k, i) => g.circle(-60 + (i % 3) * 60, -170 + Math.floor(i / 3) * 60, 22).fill(swatch[k].fill).stroke({ width: 4, color: swatch[k].line }));
    c.addChild(g);
    super(c);
  }
}

function sticker(seed: number): Container {
  const rng = new Rng(seed);
  const c = new Container();
  const g = new Graphics();
  for (let i = 0; i < 5; i++) {
    const k = rng.pick(DOT_COLORS);
    g.circle((i - 2) * 46, (i % 2) * 30 - 15, 22).fill(swatch[k].fill).stroke({ width: 4, color: swatch[k].line });
  }
  c.addChild(g);
  return c;
}

export const dotLink: GameModule = {
  id: 'dot-link',
  name: 'Dot Link',
  titleLine: 'game.dot-link',
  region: 'rainbow-meadow',
  skills: ['colors', 'fine-motor', 'counting', 'planning'],
  bands: ['lap', 'toddler', 'preschool', 'prek'],
  levels: (band) => rangeFor(LEVELS, band),
  describeLevel: (level) => planFor(level).name,
  music: STYLES.paint,
  coplayHint: 'Trace the line together and count the dots as you go: "one, two, three, four!"',
  offScreen: 'Line up colored blocks or buttons, then count how many of each color.',
  hubIcon: () => new DotsIcon(),
  sticker,
  touchDemo: true,
  create: (ctx) => new DotLink(ctx),
};
