import { Container, Graphics, Rectangle, type FederatedPointerEvent } from 'pixi.js';
import { cream, ink, swatch, type ColorName } from '../../art/palette';
import { Backdrop } from '../../art/scenery';
import { shapePath } from '../../art/shapes';
import { STYLES } from '../../audio/music';
import { sfx } from '../../audio/sfx';
import { palmOnGlass } from '../../engine/input';
import { Rng } from '../../engine/random';
import { ease } from '../../engine/tween';
import type { View } from '../../engine/view';
import { label } from '../../ui/text';
import { WigglyIcon } from '../shared';
import type { Game, GameContext, GameModule, TouchIntent } from '../types';
import {
  LEVELS,
  BIG_LEVEL,
  BUDDY_LEVEL,
  bigArrival,
  bigShown,
  BIG_FILL,
  buddyCounts,
  chainCounts,
  collapse,
  demoMove,
  DOT_COLORS,
  DOT_MARKS,
  ensureMove,
  findLine,
  findSquare,
  makeGrid,
  nearestCell,
  pickBuddy,
  planFor,
  popped,
  same,
  step,
  twoAdd,
  twoNeed,
  type Cell,
  type DotMark,
  type DotPlan,
  type Grid,
} from './logic';
import { rangeFor } from '../../progress/difficulty';

const GAP = 108;
const DOT_R = 34;
const MARK_R = 16;
/** Two colors: the sign's width at the right of the board, and one color's chip on it. */
const SIGN_W = 210;
const CHIP_W = 190;
const CHIP_H = 126;

/** The mark inside a dot, about 2r across and centered. Call fill/stroke after. */
function markPath(g: Graphics, mark: DotMark, r: number): Graphics {
  switch (mark) {
    case 'heart':
    case 'star':
      return shapePath(g, mark, r);
    case 'drop':
      return g
        .moveTo(0, -r * 1.1)
        .bezierCurveTo(r * 0.5, -r * 0.4, r * 0.9, 0, r * 0.9, r * 0.25)
        .bezierCurveTo(r * 0.9, r * 0.75, r * 0.5, r * 1, 0, r * 1)
        .bezierCurveTo(-r * 0.5, r * 1, -r * 0.9, r * 0.75, -r * 0.9, r * 0.25)
        .bezierCurveTo(-r * 0.9, 0, -r * 0.5, -r * 0.4, 0, -r * 1.1)
        .closePath();
    case 'leaf':
      return g
        .moveTo(-r * 0.85, r * 0.85)
        .bezierCurveTo(-r * 1.1, -r * 0.3, -r * 0.2, -r * 0.95, r * 0.95, -r * 0.95)
        .bezierCurveTo(r * 0.95, r * 0.2, r * 0.3, r * 1.1, -r * 0.85, r * 0.85)
        .closePath();
    case 'moon': {
      // A crescent: the outer circle's left half, back along a wider circle through the same tips.
      const d = r * 2.5;
      const inner = Math.hypot(r, d);
      const a = Math.atan2(r, d);
      const pts: number[] = [];
      for (let i = 0; i <= 12; i++) {
        const t = (3 * Math.PI) / 2 - (i / 12) * Math.PI;
        pts.push(r * 0.3 + Math.cos(t) * r, Math.sin(t) * r);
      }
      for (let i = 1; i < 12; i++) {
        const t = Math.PI - a + (i / 12) * 2 * a;
        pts.push(r * 0.3 + d + Math.cos(t) * inner, Math.sin(t) * inner);
      }
      return g.poly(pts);
    }
  }
}

class DotLink implements Game {
  readonly plan: DotPlan;
  readonly palette: ColorName[];
  /** Two colors: the two colors the sign names, in order. */
  readonly targets: ColorName[];
  /** Two colors: how many of each named color have counted so far. */
  have = [0, 0];
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
  private readonly sign = new Container();
  private pointer: number | null = null;
  private wrongs = 0;
  private idle = 0;
  private clock = 0;
  private hintCells: Cell[] = [];
  /** Buddy mode: the pair that wiggles from the start (not a hint) and the only line that links. */
  buddy: Cell[] = [];
  /** Big mode: the dots standing on the board (a popping one has left it), and how much bigger each is drawn. */
  standing: Cell[] = [];
  private readonly dotScale: number;

  constructor(private readonly ctx: GameContext) {
    this.plan = planFor(ctx.level);
    this.palette = ctx.rng.shuffle([...DOT_COLORS]).slice(0, this.plan.colors);
    this.targets = this.plan.mode === 'two' ? this.palette.slice(0, 2) : [];
    this.grid = ensureMove(this.plan, makeGrid(this.plan, ctx.rng, this.palette), ctx.rng, this.target);
    this.backdrop = new Backdrop(
      { sky: [0xfde2f0, 0xfff4e3], hills: [0xc8ecb0, 0xa6de8e], horizon: 0.82, clouds: 2, seed: 81 },
      ctx.view,
    );
    this.dotScale = this.plan.mode === 'big' ? 1.5 : 1;
    if (this.plan.mode === 'big') this.standing = BIG_FILL.slice(0, bigShown(0)).map((c) => ({ ...c }));
    this.board.addChild(this.lines, this.layer, this.touch);
    ctx.stage.addChild(this.backdrop, this.board, this.sign);
    this.sign.eventMode = 'none';
    this.drawSign();
    this.buildDots();
    this.chooseBuddy();

    this.touch.eventMode = 'static';
    this.touch.hitArea = new Rectangle(-GAP / 2, -GAP / 2, this.plan.cols * GAP, this.plan.rows * GAP);
    this.touch.on('pointerdown', (e: FederatedPointerEvent) => this.down(e));
    this.touch.on(
      'globalpointermove',
      (e: FederatedPointerEvent) => e.pointerId === this.pointer && this.move(e),
    );
    this.touch.on('pointerup', (e: FederatedPointerEvent) => e.pointerId === this.pointer && this.up());
    this.touch.on(
      'pointerupoutside',
      (e: FederatedPointerEvent) => e.pointerId === this.pointer && this.up(),
    );
  }

  /** The color a line must be to count now: level 3's color, or two colors' first color still short of its number. */
  get target(): ColorName | undefined {
    if (this.plan.mode === 'color') return this.palette[0];
    if (this.plan.mode === 'two') return this.targets[twoNeed(this.plan, this.have)];
    return undefined;
  }

  /** Two colors: each named color's dot, its number, and a row of little dots that fill as hers pop. */
  private drawSign() {
    for (const n of this.sign.removeChildren()) n.destroy({ children: true });
    const goals = this.plan.goals;
    if (!goals) return;
    goals.forEach((goal, i) => {
      const color = this.targets[i];
      const sw = swatch[color];
      const full = this.have[i] >= goal;
      const chip = new Container();
      chip.y = (i - 0.5) * (CHIP_H + 16);
      const back = new Graphics()
        .roundRect(-CHIP_W / 2, -CHIP_H / 2, CHIP_W, CHIP_H, 24)
        .fill(cream)
        .stroke({ width: full ? 7 : 4, color: full ? sw.line : 0xd9cbb4 });
      const dot = new Graphics();
      this.drawDot(dot, color);
      dot.position.set(-42, -20);
      dot.scale.set(0.85);
      const num = label(String(goal), 54, ink);
      num.position.set(34, -18);
      const pips = new Graphics();
      const step = Math.min(26, (CHIP_W - 30) / goal);
      for (let k = 0; k < goal; k++) {
        const x = (k - (goal - 1) / 2) * step;
        if (k < this.have[i]) pips.circle(x, 36, 9).fill(sw.fill).stroke({ width: 3, color: sw.line });
        else pips.circle(x, 36, 9).stroke({ width: 3, color: sw.line, alpha: 0.45 });
      }
      chip.addChild(back, dot, num, pips);
      this.sign.addChild(chip);
    });
  }

  start() {
    const p = this.plan;
    switch (p.mode) {
      case 'big':
        return void this.ctx.instruct('dots.big');
      case 'tap':
        return void this.ctx.instruct('dots.tap');
      case 'pair':
        return void this.ctx.instruct('dots.pair');
      case 'buddy':
        return void this.ctx.instruct('dots.buddy');
      case 'color':
        return void this.ctx.instruct('dots.color', { n: p.goal, color: this.target! });
      case 'two':
        return void this.ctx.instruct('dots.two', {
          n: p.goals![0],
          color: this.targets[0],
          m: p.goals![1],
          other: this.targets[1],
        });
      case 'chain':
        return void this.ctx.instruct(p.exactLength ? 'dots.exact' : 'dots.chain', { n: p.length! });
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
    g.circle(-19, -17, 6).fill({ color: 0xffffff, alpha: 0.5 });
    markPath(g, DOT_MARKS[color]!, MARK_R).fill(sw.light).stroke({ width: 3, color: sw.line, join: 'round' });
  }

  private buildDots() {
    this.layer.removeChildren().forEach((c) => c.destroy());
    this.dots = this.grid.map((row, r) =>
      row.map((color, c) => {
        const g = new Graphics();
        this.drawDot(g, color);
        g.position.copyFrom(this.pos({ r, c }));
        // Big mode: only the standing dots show; the other places wait for the pops that bring them.
        g.visible = this.plan.mode !== 'big' || this.isStanding({ r, c });
        this.layer.addChild(g);
        return g;
      }),
    );
  }

  resize(v: View) {
    this.backdrop.resize(v);
    const w = (this.plan.cols - 1) * GAP;
    const h = (this.plan.rows - 1) * GAP;
    // The small buddy board grows so each dot's catch area stays well over 100 units for a toddler.
    const s = Math.min(
      this.plan.mode === 'buddy' || this.plan.mode === 'big' ? 1.4 : 1,
      (v.h - 150) / (h + GAP),
      (v.w - 260) / (w + GAP),
    );
    // Two colors: the sign stands at the right, and the board centers in the room left of it.
    const sign = this.plan.mode === 'two' ? SIGN_W : 0;
    const fit = Math.min(s, (v.w - 260 - sign) / (w + GAP));
    this.board.scale.set(fit);
    this.board.position.set(
      Math.max(190 + (GAP * fit) / 2, (v.w - sign - w * fit) / 2),
      (v.h - h * fit) / 2 + 20,
    );
    this.sign.position.set(v.w - SIGN_W / 2 - 10, v.h / 2 + 20);
    // Big mode: the whole view is the touch, in board units.
    if (this.plan.mode === 'big')
      this.touch.hitArea = new Rectangle(-this.board.x / fit, -this.board.y / fit, v.w / fit, v.h / fit);
  }

  update(dt: number) {
    this.clock += dt;
    // Buddy's pair wiggles from the start and big mode's dot is the whole invitation, so neither counts a waiting hint.
    if (
      !this.busy &&
      !this.finished &&
      !this.path.length &&
      this.plan.mode !== 'buddy' &&
      this.plan.mode !== 'big'
    ) {
      this.idle += dt;
      if (this.idle > 12 && !this.hintCells.length) this.hint();
    }
    // Hinted dots bob gently.
    const big = this.plan.mode === 'big';
    this.dots.forEach((row, r) =>
      row.forEach((g, c) => {
        // Big mode: a popping dot shrinks by its own tween; an arriving one grows here and drops into its place.
        if (big) {
          if (!this.isStanding({ r, c })) return;
          g.y += (r * GAP - g.y) * Math.min(1, dt * 10);
        }
        const lit = [...this.hintCells, ...this.buddy].some((h) => h.r === r && h.c === c);
        const inPath = this.path.some((p) => p.r === r && p.c === c);
        const k = this.dotScale * (inPath ? 1.15 : lit ? 1 + 0.12 * Math.abs(Math.sin(this.clock * 5)) : 1);
        g.scale.x += (k - g.scale.x) * Math.min(1, dt * 12);
        g.scale.y = g.scale.x;
      }),
    );
  }

  autotouch(): TouchIntent | null {
    if (this.busy || this.finished || this.path.length) return null;
    if (this.plan.mode === 'big') {
      // A touch beside the nearest dot, off it, to show that anywhere pops.
      const cell = nearestCell(this.standing, 1, 1);
      if (!cell) return null;
      const { x, y } = this.pos(cell);
      return { tap: { on: this.touch, x: x + GAP * 0.8, y: y + GAP * 0.9 }, pause: 0.12 };
    }
    const move = demoMove(this.plan, this.grid, this.target, this.buddy);
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

  private isStanding(cell: Cell) {
    return this.standing.some((s) => same(s, cell));
  }

  private down(e: FederatedPointerEvent) {
    if (this.busy || this.finished || palmOnGlass()) return;
    if (this.plan.mode === 'big') return this.touchBig(e);
    const cell = this.cellAt(e);
    if (!cell) return;
    this.idle = 0;
    if (this.plan.mode === 'tap') {
      // Tap mode never judges a line, so a pop is what puts the waiting bob away.
      this.hintCells = [];
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

  /** Big mode: a touch anywhere sparkles under the finger and pops the standing dot nearest it. */
  private touchBig(e: FederatedPointerEvent) {
    if (this.progress >= this.plan.goal) return;
    const at = this.ctx.stage.toLocal(e.global);
    this.ctx.particles.burst(at.x, at.y, {
      colors: [0xffffff, 0xfff3a0],
      count: 4,
      speed: [40, 110],
      size: [0.2, 0.3],
    });
    const p = this.board.toLocal(e.global);
    const cell = nearestCell(this.standing, p.x / GAP, p.y / GAP);
    if (!cell) return void sfx.tick();
    void this.popBig(cell);
  }

  /** Big mode: the dot pops, a fresh one grows in its place, and the pop brings one more dot until the board is full. */
  private async popBig(cell: Cell) {
    this.standing = this.standing.filter((s) => !same(s, cell));
    const g = this.dots[cell.r][cell.c];
    const at = this.ctx.stage.toLocal(this.board.toGlobal(g.position));
    this.ctx.particles.burst(at.x, at.y, {
      colors: [swatch[this.grid[cell.r][cell.c]].fill, 0xffffff],
      count: 8,
      speed: [80, 200],
      gravity: 200,
      size: [0.3, 0.5],
    });
    void this.ctx.tw.to(g.scale, { x: 0, y: 0 }, { duration: 0.18 });
    this.progress++;
    sfx.pop(4 + Math.min(8, this.progress));
    const arrival = bigArrival(this.progress);
    if (this.progress >= this.plan.goal) {
      await this.ctx.tw.wait(0.22);
      return void this.finale();
    }
    await this.ctx.tw.wait(0.22);
    if (this.finished) return;
    this.arrive(cell);
    if (arrival && !this.isStanding(arrival)) this.arrive(arrival);
  }

  /** Big mode: a dot of a fresh color appears just above its place, small, and the frame loop grows and drops it in. */
  private arrive(cell: Cell) {
    this.grid[cell.r][cell.c] = this.ctx.rng.pick(this.palette);
    const g = this.dots[cell.r][cell.c];
    this.drawDot(g, this.grid[cell.r][cell.c]);
    g.scale.set(0.2);
    g.position.set(cell.c * GAP, cell.r * GAP - GAP * 0.6);
    g.visible = true;
    this.standing.push({ ...cell });
  }

  /** Buddy mode: wiggle a fresh pair after the board settles. */
  private chooseBuddy() {
    if (this.plan.mode === 'buddy') this.buddy = pickBuddy(this.grid, this.ctx.rng) ?? [];
  }

  /** Buddy mode: the wiggling pair pops; any other line shakes, stays, and points back at the buddies. */
  private async judgeBuddy(path: Cell[]) {
    if (buddyCounts(this.buddy, path)) {
      const pair = this.buddy;
      this.buddy = [];
      await this.pop(pair, false);
      return;
    }
    this.misses++;
    sfx.boing();
    void this.ctx.say('dots.buddyhint');
    for (const c of path) {
      const g = this.dots[c.r][c.c];
      const { x } = this.pos(c);
      void this.ctx.tw
        .to(g, { x: x + 10 }, { duration: 0.06 })
        .then(() => this.ctx.tw.to(g, { x: x - 10 }, { duration: 0.1 }))
        .then(() => this.ctx.tw.to(g, { x }, { duration: 0.06 }));
    }
  }

  /** A finished line: pop it, then see if it counts toward the goal. */
  private async judge(path: Cell[], loop: boolean) {
    if (this.plan.mode === 'buddy') return this.judgeBuddy(path);
    const color = this.grid[path[0].r][path[0].c];
    const p = this.plan;
    let counts = 0;
    let line: 'dots.notthat' | 'dots.longer' | 'dots.around' | 'dots.exact' | null = null;
    if (p.mode === 'pair' || p.mode === 'buddy') counts = 1;
    else if (p.mode === 'color') {
      if (color === this.target) counts = loop ? popped(this.grid, path, true).length : path.length;
      else line = 'dots.notthat';
    } else if (p.mode === 'two') {
      // A line of a named color counts toward its own number; another color, or one already full, counts nothing.
      const which = this.targets.indexOf(color);
      counts = twoAdd(p, this.have, which, loop ? popped(this.grid, path, true).length : path.length);
      if (counts) this.countTwo(which, counts);
      else line = 'dots.notthat';
    } else if (p.mode === 'chain') {
      if (chainCounts(p, path.length, loop)) counts = 1;
      else line = p.exactLength ? 'dots.exact' : 'dots.longer';
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
      this.ctx.particles.burst(at.x, at.y, {
        colors: [swatch[this.grid[c.r][c.c]].fill, 0xffffff],
        count: 5,
        speed: [60, 160],
        gravity: 200,
        size: [0.25, 0.4],
      });
      void tw.to(g.scale, { x: 0, y: 0 }, { duration: 0.18 });
    }
    sfx.pop(9);
    if (loop) sfx.tada();
    const before = this.progress;
    this.progress += counts;
    if (this.plan.mode === 'color' && counts)
      void this.ctx.say('count', { n: Math.min(this.plan.goal, this.progress) });
    else if (this.plan.mode !== 'color' && this.plan.mode !== 'two' && counts && this.plan.mode !== 'tap')
      void this.ctx.say('praise');
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
    this.chooseBuddy();
    this.busy = false;
    if (this.progress >= this.plan.goal && before < this.plan.goal) void this.finale();
  }

  /** Two colors: fill that color's little dots on the sign and say its count, or that it is full and what is left. */
  private countTwo(which: number, n: number) {
    this.have[which] += n;
    this.drawSign();
    const goals = this.plan.goals!;
    const need = twoNeed(this.plan, this.have);
    if (this.have[which] >= goals[which] && need >= 0)
      void this.ctx.say('dots.twonext', { color: this.targets[which], other: this.targets[need] });
    else void this.ctx.say('count', { n: this.have[which] });
  }

  /** Light up a move that would count right now. */
  private hint() {
    const p = this.plan;
    const cells =
      p.mode === 'square'
        ? findSquare(this.grid)
        : findLine(this.grid, p.mode === 'chain' ? p.length! : 2, this.target);
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
    const c = this.ctx.stage.toLocal(
      this.board.toGlobal({ x: ((this.plan.cols - 1) * GAP) / 2, y: ((this.plan.rows - 1) * GAP) / 2 }),
    );
    this.ctx.particles.burst(c.x, c.y, {
      kind: 'star',
      colors: [0xffffff, 0xfff3a0, ...this.palette.map((k) => swatch[k].fill)],
      count: 30,
      speed: [150, 400],
      gravity: 0,
      life: [0.8, 1.2],
    });
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
    g.moveTo(-60, -170)
      .lineTo(0, -170)
      .lineTo(-60, -110)
      .stroke({ width: 10, color: swatch.red.line, cap: 'round', join: 'round' });
    colors.forEach((k, i) =>
      g
        .circle(-60 + (i % 3) * 60, -170 + Math.floor(i / 3) * 60, 22)
        .fill(swatch[k].fill)
        .stroke({ width: 4, color: swatch[k].line }),
    );
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
    g.circle((i - 2) * 46, (i % 2) * 30 - 15, 22)
      .fill(swatch[k].fill)
      .stroke({ width: 4, color: swatch[k].line });
  }
  c.addChild(g);
  return c;
}

export const dotLink: GameModule = {
  id: 'dot-link',
  name: 'Dot Link',
  titleLine: 'game.dot-link',
  region: 'rainbow-meadow',
  challenge: 'hands',
  skills: ['colors', 'fine-motor', 'counting', 'planning'],
  bands: ['lap', 'toddler', 'preschool', 'prek'],
  levels: (band) => rangeFor(LEVELS, band),
  describeLevel: (level) => planFor(level).name,
  music: STYLES.paint,
  coplayHint: 'Trace the line together and count the dots as you go: "one, two, three, four!"',
  offScreen: {
    all: 'Line up colored blocks or buttons, then count how many of each color.',
    // Under 3: no buttons (small parts).
    lap: 'Line up colored blocks, then count how many of each color.',
    toddler: 'Line up colored blocks, then count how many of each color.',
  },
  hubIcon: () => new DotsIcon(),
  sticker,
  touchDemo: true,
  entryLevels: [BUDDY_LEVEL, BIG_LEVEL],
  create: (ctx) => new DotLink(ctx),
};
