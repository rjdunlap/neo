import { Container, Graphics, Rectangle, type FederatedPointerEvent } from 'pixi.js';
import { ink, swatch, wood, type ColorName } from '../../art/palette';
import { starPoints } from '../../art/shapes';
import { STYLES } from '../../audio/music';
import { sfx } from '../../audio/sfx';
import type { LineId } from '../../content/voice-script';
import { onTap, palmOnGlass } from '../../engine/input';
import { Rng } from '../../engine/random';
import type { View } from '../../engine/view';
import { rangeFor } from '../../progress/difficulty';
import { HINT_AFTER, hinted, newTally, type Tally } from '../../progress/coach';
import { WigglyIcon } from '../shared';
import type { Game, GameContext, GameModule, TouchIntent } from '../types';
import {
  BALL_R,
  BOARD_H,
  BOARD_W,
  BUTTON_SIZE,
  FLOOR,
  GOAL_R,
  LEVELS,
  PATH_STEP,
  SEG_R,
  describeLevel,
  makeRound,
  nextHintStroke,
  planFor,
  rampLayout,
  sampleStroke,
  simulate,
  type Point,
  type Puzzle,
  type RampPlan,
  type RunResult,
  type Segment,
  type Stroke,
} from './logic';

const INSTRUCT: Record<number, LineId> = {
  1: 'draw-a-ramp.instruct-1',
  2: 'draw-a-ramp.instruct-2',
  3: 'draw-a-ramp.instruct-3',
};
const RAMP_COLORS: ColorName[] = ['red', 'blue', 'green'];
const BUTTONS = ['go', 'undo', 'clear', 'hint'] as const;
type ButtonKind = (typeof BUTTONS)[number];

/** A wooden capsule: the same shape the solver collides with. */
function plank(g: Graphics, s: Segment) {
  g.moveTo(s.ax, s.ay)
    .lineTo(s.bx, s.by)
    .stroke({ width: s.r * 2 + 4, color: wood.line, cap: 'round' });
  g.moveTo(s.ax, s.ay)
    .lineTo(s.bx, s.by)
    .stroke({ width: s.r * 2 - 2, color: wood.fill, cap: 'round' });
}

function marbleArt(color: ColorName = 'red'): Container {
  const c = new Container();
  c.addChild(
    new Graphics()
      .circle(0, 0, BALL_R)
      .fill(swatch[color].fill)
      .stroke({ width: 4, color: swatch[color].line })
      .circle(-6, -7, 6)
      .fill({ color: 0xffffff, alpha: 0.7 }),
  );
  return c;
}

function balloonArt(): Container {
  const c = new Container();
  const ribbon = new Graphics().moveTo(0, GOAL_R - 8).quadraticCurveTo(14, GOAL_R + 24, -4, GOAL_R + 50);
  ribbon.stroke({ width: 4, color: swatch.purple.line });
  const body = new Graphics()
    .circle(0, 0, GOAL_R)
    .fill(swatch.yellow.fill)
    .stroke({ width: 5, color: swatch.yellow.line })
    .poly(starPoints(26, 11))
    .fill(swatch.orange.fill)
    .stroke({ width: 3, color: swatch.orange.line });
  c.addChild(ribbon, body);
  return c;
}

function rampLine(g: Graphics, pts: Point[], color: ColorName, alpha = 1) {
  if (pts.length < 2) return;
  g.moveTo(pts[0].x, pts[0].y);
  for (const p of pts.slice(1)) g.lineTo(p.x, p.y);
  g.stroke({ width: SEG_R * 2 + 4, color: swatch[color].line, cap: 'round', join: 'round', alpha });
  g.moveTo(pts[0].x, pts[0].y);
  for (const p of pts.slice(1)) g.lineTo(p.x, p.y);
  g.stroke({ width: SEG_R * 2 - 2, color: swatch[color].fill, cap: 'round', join: 'round', alpha });
}

function buttonArt(kind: ButtonKind): Container {
  const { w, h } = BUTTON_SIZE[kind];
  const color: ColorName = kind === 'go' ? 'green' : kind === 'hint' ? 'yellow' : 'blue';
  const c = new Container();
  const g = new Graphics()
    .roundRect(-w / 2, -h / 2 + 5, w, h, 24)
    .fill(swatch[color].line)
    .roundRect(-w / 2, -h / 2, w, h, 24)
    .fill(swatch[color].fill)
    .stroke({ width: 4, color: swatch[color].line });
  const icon = new Graphics();
  if (kind === 'go') icon.poly([-16, -24, 28, 0, -16, 24]).fill(0xffffff);
  else if (kind === 'undo') {
    icon
      .moveTo(14, 18)
      .quadraticCurveTo(30, -18, -8, -16)
      .stroke({ width: 9, color: 0xffffff, cap: 'round' });
    icon.poly([-6, -34, -30, -14, -4, 0]).fill(0xffffff);
  } else if (kind === 'clear') {
    icon
      .moveTo(-18, -18)
      .lineTo(18, 18)
      .moveTo(18, -18)
      .lineTo(-18, 18)
      .stroke({ width: 10, color: 0xffffff, cap: 'round' });
  } else {
    icon
      .circle(0, -8, 20)
      .fill(0xffffff)
      .roundRect(-10, 12, 20, 12, 4)
      .fill(swatch.yellow.line)
      .moveTo(-6, -8)
      .lineTo(0, 0)
      .lineTo(6, -8)
      .stroke({ width: 3, color: swatch.yellow.line });
  }
  c.addChild(g, icon);
  c.hitArea = new Rectangle(-w / 2, -h / 2, w, h);
  return c;
}

class Round implements Game {
  private readonly root = new Container();
  private readonly sky = new Graphics();
  private readonly board = new Container();
  private readonly boardBg = new Graphics();
  private readonly fixedG = new Graphics();
  private readonly trailG = new Graphics();
  private readonly rampsG = new Graphics();
  private readonly liveG = new Graphics();
  private readonly hintG = new Graphics();
  private readonly input = new Graphics();
  private readonly marble = marbleArt();
  private balloon = balloonArt();
  private readonly buttons = {} as Record<ButtonKind, Container>;

  private readonly plan: RampPlan;
  private readonly puzzles: Puzzle[];
  private index = 0;
  private strokes: Stroke[] = [];
  private history: Stroke[][] = [];
  private raw: Point[] = [];
  private grab: number | null = null;
  private run: { res: RunResult; t: number; played: Set<number> } | null = null;
  private fails = 0;
  private hintShown = false;
  private hintStroke: Stroke | null = null;
  private clock = 0;
  private busy = false;
  private done = false;
  private readonly tally: Tally = newTally();

  constructor(private readonly ctx: GameContext) {
    this.plan = planFor(ctx.level);
    this.puzzles = makeRound(this.plan, ctx.rng);
    this.board.addChild(
      this.boardBg,
      this.fixedG,
      this.trailG,
      this.rampsG,
      this.hintG,
      this.liveG,
      this.balloon,
      this.marble,
      this.input,
    );
    this.root.addChild(this.sky, this.board);
    for (const k of BUTTONS) {
      const b = buttonArt(k);
      this.buttons[k] = b;
      this.root.addChild(b);
    }
    ctx.stage.addChild(this.root);
    this.input.eventMode = 'static';
    this.input.hitArea = new Rectangle(0, 0, BOARD_W, BOARD_H);
    this.input.on('pointerdown', (e: FederatedPointerEvent) => this.down(e));
    this.input.on('globalpointermove', (e: FederatedPointerEvent) => this.move(e));
    this.input.on('pointerup', (e: FederatedPointerEvent) => this.up(e.pointerId));
    this.input.on('pointerupoutside', (e: FederatedPointerEvent) => this.up(e.pointerId));
    this.input.on('pointercancel', () => this.cancelStroke());
    ctx.listen(window, 'pointerup', (e) => this.up(e.pointerId));
    ctx.listen(window, 'pointercancel', () => this.cancelStroke());
    onTap(this.buttons.go, () => this.go(), { cooldown: 250 });
    onTap(this.buttons.undo, () => this.undo(), { cooldown: 200 });
    onTap(this.buttons.clear, () => this.clear(), { cooldown: 200 });
    onTap(this.buttons.hint, () => this.askForHint(), { cooldown: 300 });
    this.resize(ctx.view);
  }

  private get puzzle(): Puzzle {
    return this.puzzles[this.index];
  }

  start() {
    this.setupPuzzle();
    void this.ctx.instruct(INSTRUCT[this.plan.id] ?? INSTRUCT[1]);
  }

  // ---- Drawing ----

  private local(e: FederatedPointerEvent): Point {
    return this.board.toLocal(e.global);
  }

  private down(e: FederatedPointerEvent) {
    if (this.grab !== null || this.run || this.busy || this.done || palmOnGlass()) return;
    this.grab = e.pointerId;
    const p = this.local(e);
    this.raw = [p];
    this.clearHint();
    sfx.brush();
    this.drawLive();
  }

  private move(e: FederatedPointerEvent) {
    if (this.grab !== e.pointerId) return;
    const p = this.local(e);
    // Leaving the board ends the stroke, like lifting the finger.
    if (p.x < 0 || p.y < 0 || p.x > BOARD_W || p.y > BOARD_H) return this.up(e.pointerId);
    this.raw.push(p);
    this.drawLive();
  }

  private up(id: number) {
    if (this.grab === null || this.grab !== id) return;
    this.grab = null;
    const s = sampleStroke(this.raw, this.puzzle);
    this.raw = [];
    this.liveG.clear();
    if (!s) {
      void this.ctx.say('draw-a-ramp.drag-line');
      return;
    }
    if (this.strokes.length >= this.plan.maxStrokes) {
      if (this.plan.maxStrokes === 1) {
        this.history.push(this.strokes);
        this.strokes = [s];
      } else {
        void this.ctx.say('draw-a-ramp.full');
        this.pulse(this.buttons.undo);
        this.pulse(this.buttons.clear);
        return;
      }
    } else {
      this.history.push(this.strokes);
      this.strokes = [...this.strokes, s];
    }
    this.drawRamps();
    if (simulate(this.puzzle, this.strokes).hit) {
      this.pulse(this.buttons.go);
      void this.ctx.say('draw-a-ramp.ready-go');
    }
  }

  private cancelStroke() {
    this.grab = null;
    this.raw = [];
    this.liveG.clear();
  }

  private pulse(b: Container) {
    b.scale.set(1.12);
    void this.ctx.tw.to(b.scale, { x: 1, y: 1 }, { duration: 0.3 });
  }

  private drawLive() {
    const g = this.liveG.clear();
    const p = this.raw[0];
    if (!p) return;
    g.circle(p.x, p.y, 12).fill({ color: swatch[RAMP_COLORS[this.strokes.length % 3]].fill, alpha: 0.9 });
    rampLine(g, this.raw, RAMP_COLORS[this.strokes.length % 3], 0.8);
  }

  private drawRamps() {
    const g = this.rampsG.clear();
    this.strokes.forEach((s, i) => rampLine(g, s, RAMP_COLORS[i % 3]));
  }

  // ---- Buttons ----

  private undo() {
    if (this.busy || this.done) return;
    if (this.run) this.stopRun();
    const prev = this.history.pop();
    if (!prev) return;
    this.strokes = prev;
    this.drawRamps();
    this.clearHint();
    sfx.pop(3);
  }

  private clear() {
    if (this.busy || this.done) return;
    if (this.run) this.stopRun();
    if (!this.strokes.length) return;
    this.history.push(this.strokes);
    this.strokes = [];
    this.drawRamps();
    this.clearHint();
    sfx.pop(2);
  }

  /** The pause sheet's hint and the Hint button: a dashed ramp that works, counted once per puzzle. */
  askForHint() {
    if (this.busy || this.done || this.run) return;
    const h = nextHintStroke(this.puzzle, this.strokes);
    if (!h) {
      void this.ctx.say('draw-a-ramp.ready-go');
      this.pulse(this.buttons.go);
      return;
    }
    this.showHint(h);
  }

  private showHint(h: Stroke) {
    if (!this.hintShown) {
      this.hintShown = true;
      hinted(this.tally);
    }
    this.hintStroke = h;
    this.hintAlpha = 0;
    void this.ctx.say('draw-a-ramp.hint');
  }

  private hintAlpha = 0;

  private clearHint() {
    this.hintStroke = null;
    this.hintG.clear();
  }

  private drawHint() {
    const g = this.hintG.clear();
    const h = this.hintStroke;
    if (!h) return;
    const pulse = 0.55 + 0.35 * Math.sin(this.clock * 5);
    const alpha = Math.min(1, this.hintAlpha) * pulse;
    let carry = 0;
    for (let i = 1; i < h.length; i++) {
      const a = h[i - 1];
      const b = h[i];
      const d = Math.hypot(b.x - a.x, b.y - a.y);
      for (let at = carry; at < d; at += 22) {
        const x0 = a.x + ((b.x - a.x) * at) / d;
        const y0 = a.y + ((b.y - a.y) * at) / d;
        const e = Math.min(d, at + 12);
        g.moveTo(x0, y0).lineTo(a.x + ((b.x - a.x) * e) / d, a.y + ((b.y - a.y) * e) / d);
      }
      carry = 0;
    }
    g.stroke({ width: 8, color: swatch.purple.fill, alpha, cap: 'round' });
  }

  // ---- Runs ----

  private go() {
    if (this.busy || this.done) return;
    if (this.run) return;
    if (!this.strokes.length) {
      void this.ctx.say('draw-a-ramp.draw-first');
      this.pulse(this.buttons.go);
      return;
    }
    this.clearHint();
    sfx.pop(4);
    this.trailG.clear();
    this.run = { res: simulate(this.puzzle, this.strokes), t: 0, played: new Set() };
  }

  private stopRun() {
    this.run = null;
    this.marble.position.set(this.puzzle.start.x, this.puzzle.start.y);
    this.trailG.clear();
  }

  private at(i: number, frac: number, path: Point[]): Point {
    const a = path[Math.min(i, path.length - 1)];
    const b = path[Math.min(i + 1, path.length - 1)];
    return { x: a.x + (b.x - a.x) * frac, y: a.y + (b.y - a.y) * frac };
  }

  private stepRun(dt: number) {
    const r = this.run;
    if (!r) return;
    r.t += dt;
    const f = r.t / PATH_STEP;
    const i = Math.floor(f);
    const p = this.at(i, f - i, r.res.path);
    this.marble.position.set(p.x, p.y);
    const fixedCount = this.puzzle.fixed.length;
    r.res.firstTouch.forEach((touch, k) => {
      if (k < fixedCount || touch < 0 || touch > i || r.played.has(k)) return;
      r.played.add(k);
      sfx.marimba(r.played.size - 1 + 2);
    });
    if (i >= r.res.path.length - 1) this.endRun(r.res);
  }

  private endRun(res: RunResult) {
    this.run = null;
    if (res.hit) {
      void this.solved();
      return;
    }
    this.drawTrail(res.path);
    sfx.boing();
    this.fails++;
    const hitFixed = res.firstTouch.slice(1, this.puzzle.fixed.length).some((t) => t >= 0);
    void this.ctx.say(
      res.reason === 'stalled'
        ? 'draw-a-ramp.stalled'
        : hitFixed
          ? 'draw-a-ramp.blocked'
          : 'draw-a-ramp.short',
    );
    // The marble hops back to the chute; a missed run is a free experiment, never a miss.
    void this.ctx.tw.wait(0.5).then(() => {
      if (!this.ctx.alive || this.run || this.busy) return;
      this.marble.position.set(this.puzzle.start.x, this.puzzle.start.y);
    });
    if (this.fails >= HINT_AFTER && !this.hintShown) {
      const h = nextHintStroke(this.puzzle, this.strokes);
      if (h)
        void this.ctx.tw.wait(1.4).then(() => this.ctx.alive && !this.run && !this.busy && this.showHint(h));
    }
  }

  private drawTrail(path: Point[]) {
    const g = this.trailG.clear();
    path.forEach((p, i) => {
      if (i % 3 === 0) g.circle(p.x, p.y, 4).fill({ color: ink, alpha: 0.28 });
    });
  }

  private async solved() {
    this.busy = true;
    this.trailG.clear();
    const g = this.puzzle.goal;
    sfx.pop(9);
    sfx.sparkle();
    this.ctx.particles.burst(this.board.x + g.x, this.board.y + g.y, {
      colors: [swatch.yellow.fill, swatch.orange.fill, swatch.pink.fill, swatch.blue.fill],
      count: 30,
    });
    this.balloon.visible = false;
    this.marble.visible = false;
    void this.ctx.say('draw-a-ramp.pop');
    await this.ctx.tw.wait(1.6);
    if (!this.ctx.alive) return;
    if (this.index + 1 >= this.puzzles.length) {
      this.done = true;
      sfx.bell(4);
      void this.ctx.say('draw-a-ramp.done');
      await this.ctx.tw.wait(1.2);
      if (this.ctx.alive) this.ctx.finish({ misses: 0, hints: this.tally.hints });
      return;
    }
    this.index++;
    this.setupPuzzle();
    void this.ctx.instruct(INSTRUCT[this.plan.id] ?? INSTRUCT[1]);
  }

  private setupPuzzle() {
    const p = this.puzzle;
    this.strokes = [];
    this.history = [];
    this.fails = 0;
    this.hintShown = false;
    this.busy = false;
    this.run = null;
    this.clearHint();
    this.trailG.clear();
    this.rampsG.clear();
    const f = this.fixedG.clear();
    p.fixed.forEach((s) => plank(f, s));
    this.balloon.position.set(p.goal.x, p.goal.y);
    this.balloon.visible = true;
    this.marble.visible = true;
    this.marble.position.set(p.start.x, p.start.y);
  }

  // ---- Frame and layout ----

  update(dt: number) {
    this.clock += dt;
    this.balloon.y = this.puzzle.goal.y + Math.sin(this.clock * 2) * 4;
    this.stepRun(dt);
    if (this.hintStroke) {
      this.hintAlpha += dt * 2.5;
      this.drawHint();
    }
  }

  resize(view: View) {
    const l = rampLayout(view);
    this.board.position.set(l.board.x, l.board.y);
    this.sky.clear().rect(0, 0, view.w, view.h).fill(swatch.blue.light);
    this.boardBg
      .clear()
      .roundRect(-8, -8, BOARD_W + 16, BOARD_H + 16, 28)
      .fill(swatch.white.fill)
      .stroke({ width: 5, color: wood.line })
      .roundRect(0, 0, BOARD_W, BOARD_H, 22)
      .fill(swatch.teal.light)
      .roundRect(0, FLOOR, BOARD_W, BOARD_H - FLOOR, 12)
      .fill(swatch.green.fill);
    for (const k of BUTTONS) this.buttons[k].position.set(l[k].x, l[k].y);
  }

  // ---- The ghost finger ----

  autotouch(): TouchIntent | null {
    if (this.run || this.busy || this.done || this.grab !== null) return null;
    const p = this.puzzle;
    const spot = (q: Point) => ({ on: this.board, x: q.x, y: q.y });
    const next = nextHintStroke(p, this.strokes);
    if (!next) return this.strokes.length ? { tap: { on: this.buttons.go, x: 0, y: 0 } } : null;
    if (this.strokes.length >= this.plan.maxStrokes) return { tap: { on: this.buttons.clear, x: 0, y: 0 } };
    return {
      trace: spot(next[0]),
      via: next.slice(1).map(spot),
      receiver: this.input,
      pause: 0.4,
    };
  }

  destroy() {
    this.grab = null;
    this.run = null;
    this.root.destroy({ children: true });
  }
}

function picture(seed = 3): Container {
  const rng = new Rng(seed);
  const color = rng.pick<ColorName>(['red', 'blue', 'purple', 'orange']);
  const c = new Container();
  const g = new Graphics();
  rampLine(
    g,
    [
      { x: -70, y: 10 },
      { x: 40, y: 50 },
    ],
    'green',
  );
  rampLine(
    g,
    [
      { x: -70, y: -10 },
      { x: -20, y: -4 },
    ],
    'blue',
  );
  const m = marbleArt(color);
  m.scale.set(0.9);
  m.position.set(-62, -34);
  const b = balloonArt();
  b.scale.set(0.55);
  b.position.set(70, -10);
  c.addChild(g, m, b);
  c.addChild(new Graphics().roundRect(-90, 78, 180, 14, 7).fill(swatch.green.fill));
  c.scale.set(1);
  return c;
}

export const game: GameModule = {
  id: 'draw-a-ramp',
  name: 'Draw a Ramp',
  titleLine: 'game.draw-a-ramp',
  region: 'tinker-lab',
  challenge: 'space',
  skills: ['cause-and-effect', 'prediction', 'planning', 'revision'],
  bands: ['preschool', 'prek', 'school'],
  levels: (band) => rangeFor(LEVELS, band),
  describeLevel,
  music: STYLES.quiet,
  upright: true,
  touchDemo: true,
  coplayHint: 'Trace your finger through the air first to guess where the marble will roll before drawing.',
  offScreen:
    'Prop a cardboard tube or cereal box lid against books and roll a small ball into a paper cup. Try steeper and gentler slopes.',
  hubIcon: () => new WigglyIcon(picture()),
  sticker: (seed) => picture(seed),
  create: (ctx) => new Round(ctx),
};
