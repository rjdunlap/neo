import type { Rng } from '../../engine/random';
import type { BandLevels } from '../../progress/difficulty';
import type { View } from '../../engine/view';

/**
 * Draw a Ramp's rules (docs/definitions/draw-a-ramp.md). Everything is in board units on a fixed 720 × 540 board that is
 * never scaled, y grows downward, time is in seconds. One collision primitive, a circle against a capsule, serves both the
 * ramps she draws and the fixed wooden pieces, stepped at a fixed 1/240 s so a run is bit-identical every time.
 */

export const BOARD_W = 720;
export const BOARD_H = 540;
export const BALL_R = 20;
export const GOAL_R = 44;
export const SEG_R = 8;
export const GRAVITY = 980;
export const SUBSTEP = 1 / 240;
export const MAX_SECONDS = 8;
export const WALL_BOUNCE = 0.45;
export const RAMP_BOUNCE = 0.25;
export const RESTING_VN = 40;
export const TANGENT_DRAG = 0.04;
export const STALL_SPEED = 12;
export const STALL_TIME = 0.6;
export const MIN_STROKE_LEN = 24;
export const SAMPLE_STEP = 20;
export const MAX_SEGS_PER_STROKE = 40;
export const R_KEEP_START = 44;
export const R_KEEP_GOAL = 58;
export const WALL_L = 20;
export const WALL_R = 700;
export const WALL_T = 20;
export const FLOOR = 520;
/** How far a drawn stroke's ends may be from a reference stroke's before a hint counts it as already drawn. */
export const HINT_MATCH = 48;
/** The path is recorded this often, in seconds, for playback and the dotted trail. */
export const PATH_STEP = 1 / 30;

export interface Point {
  x: number;
  y: number;
}
export interface Segment {
  ax: number;
  ay: number;
  bx: number;
  by: number;
  r: number;
}
export type Stroke = Point[];
export interface Start extends Point {
  vx: number;
  vy: number;
}

export interface Puzzle {
  level: number;
  start: Start;
  goal: Point;
  /** The starter shelf under the marble and any hurdles or shelves, all wooden capsules. */
  fixed: Segment[];
  /** A verified solution: the strokes `referenceStrokes` hands out. */
  ref: Stroke[];
}

export type RampMode = 'bridge' | 'over' | 'turn';
export interface RampPlan {
  id: number;
  maxStrokes: number;
  puzzlesPerRound: number;
  mode: RampMode;
}

export const LEVELS: BandLevels = {
  preschool: { min: 1, max: 2 },
  prek: { min: 1, max: 3 },
  school: { min: 2, max: 3 },
};

const PLANS: Record<number, RampPlan> = {
  1: { id: 1, maxStrokes: 1, puzzlesPerRound: 2, mode: 'bridge' },
  2: { id: 2, maxStrokes: 2, puzzlesPerRound: 2, mode: 'over' },
  3: { id: 3, maxStrokes: 3, puzzlesPerRound: 2, mode: 'turn' },
};

export const planFor = (level: number): RampPlan => PLANS[level] ?? PLANS[1];

export const describeLevel = (level: number) =>
  level === 2
    ? 'Over the block: draw one or two ramps that carry the marble over a wooden block to the balloon'
    : level === 3
      ? 'Turn it around: send the marble past a shelf, then bank it back under the shelf to the balloon'
      : 'Bridge the gap: draw one sloped ramp that rolls the marble to the star balloon';

// ---- Puzzles ----

const seg = (ax: number, ay: number, bx: number, by: number): Segment => ({ ax, ay, bx, by, r: SEG_R });

/** The short wooden shelf under the marble, tilted so it rolls off the right end at a steady pace. */
function shelf(sx: number, sy: number): Segment {
  return seg(sx - 30, sy + 28, sx + 60, sy + 40);
}

const pt = (x: number, y: number): Point => ({ x, y });

/** The authored first puzzle of each level. Reference strokes were found by a grid search over ramps and verified to still pop the balloon when either end moves 15 units (`logic.test.ts` checks it). */
function authored(level: number): Puzzle {
  if (level === 2) {
    const start = { x: 120, y: 120, vx: 0, vy: 0 };
    return {
      level,
      start,
      goal: pt(580, 400),
      fixed: [shelf(start.x, start.y), seg(360, 250, 360, 500)],
      ref: [[pt(160, 180), pt(380, 220)]],
    };
  }
  if (level === 3) {
    const start = { x: 130, y: 110, vx: 0, vy: 0 };
    return {
      level,
      start,
      goal: pt(180, 410),
      fixed: [shelf(start.x, start.y), seg(80, 290, 440, 290)],
      ref: [
        [pt(180, 170), pt(400, 190)],
        [pt(560, 320), pt(240, 440)],
      ],
    };
  }
  const start = { x: 120, y: 140, vx: 0, vy: 0 };
  return {
    level: 1,
    start,
    goal: pt(560, 340),
    fixed: [shelf(start.x, start.y)],
    ref: [[pt(160, 200), pt(380, 260)]],
  };
}

const mirrorPoint = (p: Point): Point => ({ x: BOARD_W - p.x, y: p.y });
const mirrorSeg = (s: Segment): Segment => ({ ...s, ax: BOARD_W - s.ax, bx: BOARD_W - s.bx });

/** The same puzzle flipped left to right (the marble then rolls the other way), reference strokes and all. */
export function mirrored(p: Puzzle): Puzzle {
  return {
    level: p.level,
    start: { ...p.start, x: BOARD_W - p.start.x, vx: -p.start.vx },
    goal: mirrorPoint(p.goal),
    fixed: p.fixed.map(mirrorSeg),
    ref: p.ref.map((s) => s.map(mirrorPoint)),
  };
}

/** A round: the authored puzzle and its mirror, in an order the seed picks. */
export function makeRound(plan: RampPlan, rng: Rng): Puzzle[] {
  const first = authored(plan.id);
  const pair = [first, mirrored(first)];
  if (rng.chance(0.5)) pair.reverse();
  return pair.slice(0, plan.puzzlesPerRound);
}

// ---- Strokes ----

const dist = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.y - b.y);
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

const length = (pts: Point[]) => pts.reduce((sum, p, i) => (i ? sum + dist(pts[i - 1], p) : 0), 0);

/**
 * A finger's raw points become a ramp: points inside the chute's or the balloon's keep-out circle are skipped, the rest are
 * kept on the board and thinned to one every SAMPLE_STEP along the line (at most MAX_SEGS_PER_STROKE segments). Null when
 * what is left is shorter than MIN_STROKE_LEN, a tap or a scribble in the keep-out.
 */
export function sampleStroke(raw: readonly Point[], puzzle: Puzzle): Stroke | null {
  // Walk the finger's line in small steps, so a fast flick across a keep-out circle cannot jump over it.
  const dense: Point[] = [];
  raw.forEach((p, i) => {
    const q = pt(clamp(p.x, WALL_L + SEG_R, WALL_R - SEG_R), clamp(p.y, WALL_T + SEG_R, FLOOR - SEG_R));
    const prev = dense[dense.length - 1] ?? (i ? null : q);
    if (i === 0) dense.push(q);
    else if (prev) {
      const n = Math.max(1, Math.ceil(dist(prev, q) / 4));
      for (let k = 1; k <= n; k++)
        dense.push(pt(prev.x + ((q.x - prev.x) * k) / n, prev.y + ((q.y - prev.y) * k) / n));
    }
  });
  // Keep the longest run that stays outside the chute's and the balloon's circles (a ramp is one piece).
  let kept: Point[] = [];
  let run: Point[] = [];
  const close = () => {
    if (length(run) > length(kept)) kept = run;
    run = [];
  };
  for (const q of dense) {
    if (dist(q, puzzle.start) < R_KEEP_START || dist(q, puzzle.goal) < R_KEEP_GOAL) close();
    else if (!run.length || dist(run[run.length - 1], q) > 0.5) run.push(q);
  }
  close();
  if (kept.length < 2 || length(kept) < MIN_STROKE_LEN) return null;
  const out: Point[] = [kept[0]];
  let carried = 0;
  for (let i = 1; i < kept.length; i++) {
    const a = kept[i - 1];
    const b = kept[i];
    const d = dist(a, b);
    let at = SAMPLE_STEP - carried;
    while (at <= d) {
      out.push(pt(a.x + ((b.x - a.x) * at) / d, a.y + ((b.y - a.y) * at) / d));
      at += SAMPLE_STEP;
    }
    carried = d - (at - SAMPLE_STEP);
  }
  const last = kept[kept.length - 1];
  if (dist(out[out.length - 1], last) > 4) out.push(last);
  if (out.length > MAX_SEGS_PER_STROKE + 1) out.length = MAX_SEGS_PER_STROKE + 1;
  return out.length >= 2 ? out : null;
}

export function strokeSegments(strokes: readonly Stroke[]): Segment[] {
  const out: Segment[] = [];
  for (const s of strokes)
    for (let i = 1; i < s.length; i++) out.push(seg(s[i - 1].x, s[i - 1].y, s[i].x, s[i].y));
  return out;
}

// ---- The run ----

export type RunReason = 'goal' | 'floor' | 'stalled' | 'timeout';
export interface RunResult {
  hit: boolean;
  reason: RunReason;
  /** The marble's centre every PATH_STEP seconds, from the start to `end`. */
  path: Point[];
  end: Point;
  /** For each drawn segment index (fixed pieces first), the first path index at which the marble touched it, or -1. */
  firstTouch: number[];
}

interface Ball {
  x: number;
  y: number;
  vx: number;
  vy: number;
}

/** Push the ball out of one capsule and reflect or cancel its velocity into it. True when they touched. */
function collide(b: Ball, s: Segment, dt: number): boolean {
  const abx = s.bx - s.ax;
  const aby = s.by - s.ay;
  const len2 = abx * abx + aby * aby;
  const t = len2 === 0 ? 0 : clamp(((b.x - s.ax) * abx + (b.y - s.ay) * aby) / len2, 0, 1);
  const cx = s.ax + abx * t;
  const cy = s.ay + aby * t;
  const dx = b.x - cx;
  const dy = b.y - cy;
  const d = Math.hypot(dx, dy);
  const reach = BALL_R + s.r;
  if (d >= reach) return false;
  const nx = d === 0 ? 0 : dx / d;
  const ny = d === 0 ? -1 : dy / d;
  b.x = cx + nx * reach;
  b.y = cy + ny * reach;
  const vn = b.vx * nx + b.vy * ny;
  if (vn < 0) {
    const k = Math.abs(vn) < RESTING_VN ? 1 : 1 + RAMP_BOUNCE;
    b.vx -= k * vn * nx;
    b.vy -= k * vn * ny;
  }
  const drag = Math.max(0, 1 - TANGENT_DRAG * dt);
  b.vx *= drag;
  b.vy *= drag;
  return true;
}

/** Roll the marble from the chute over the fixed pieces and her strokes until it pops the balloon, lands or settles. */
export function simulate(puzzle: Puzzle, strokes: readonly Stroke[]): RunResult {
  const segs = [...puzzle.fixed, ...strokeSegments(strokes)];
  const touched = segs.map(() => -1);
  const b: Ball = { x: puzzle.start.x, y: puzzle.start.y, vx: puzzle.start.vx, vy: puzzle.start.vy };
  const path: Point[] = [pt(b.x, b.y)];
  const reach = BALL_R + GOAL_R;
  const steps = Math.round(MAX_SECONDS / SUBSTEP);
  const every = Math.round(PATH_STEP / SUBSTEP);
  let slow = 0;
  let reason: RunReason = 'timeout';
  for (let i = 1; i <= steps; i++) {
    b.vy += GRAVITY * SUBSTEP;
    b.x += b.vx * SUBSTEP;
    b.y += b.vy * SUBSTEP;
    for (let k = 0; k < segs.length; k++) {
      if (collide(b, segs[k], SUBSTEP) && touched[k] < 0) touched[k] = path.length;
    }
    if (b.x - BALL_R < WALL_L) {
      b.x = WALL_L + BALL_R;
      if (b.vx < 0) b.vx = -b.vx * WALL_BOUNCE;
    } else if (b.x + BALL_R > WALL_R) {
      b.x = WALL_R - BALL_R;
      if (b.vx > 0) b.vx = -b.vx * WALL_BOUNCE;
    }
    if (b.y - BALL_R < WALL_T) {
      b.y = WALL_T + BALL_R;
      if (b.vy < 0) b.vy = -b.vy * WALL_BOUNCE;
    }
    if (i % every === 0) path.push(pt(b.x, b.y));
    if (Math.hypot(b.x - puzzle.goal.x, b.y - puzzle.goal.y) <= reach) {
      reason = 'goal';
      break;
    }
    if (b.y + BALL_R >= FLOOR) {
      reason = 'floor';
      break;
    }
    if (i * SUBSTEP > 0.5) {
      slow = Math.hypot(b.vx, b.vy) < STALL_SPEED ? slow + SUBSTEP : 0;
      if (slow >= STALL_TIME) {
        reason = 'stalled';
        break;
      }
    }
  }
  const end = pt(b.x, b.y);
  if (path.length === 0 || dist(path[path.length - 1], end) > 0.01) path.push(end);
  return { hit: reason === 'goal', reason, path, end, firstTouch: touched };
}

// ---- Help ----

export const referenceStrokes = (puzzle: Puzzle): Stroke[] => puzzle.ref.map((s) => s.map((p) => ({ ...p })));

const matches = (a: Stroke, b: Stroke) =>
  dist(a[0], b[0]) <= HINT_MATCH && dist(a[a.length - 1], b[b.length - 1]) <= HINT_MATCH;

/** The next reference ramp she has not drawn yet; null when what she has drawn already pops the balloon. */
export function nextHintStroke(puzzle: Puzzle, strokes: readonly Stroke[]): Stroke | null {
  if (simulate(puzzle, strokes).hit) return null;
  return referenceStrokes(puzzle).find((r) => !strokes.some((s) => matches(s, r))) ?? null;
}

// ---- Layout ----

export interface RampLayout {
  /** The top-left corner of the unscaled board. */
  board: Point;
  go: Point;
  undo: Point;
  clear: Point;
  hint: Point;
}
/** Tap sizes, width × height, in units. */
export const BUTTON_SIZE = {
  go: { w: 120, h: 100 },
  undo: { w: 110, h: 100 },
  clear: { w: 110, h: 100 },
  hint: { w: 100, h: 100 },
} as const;

/** The board and its four buttons, clear of the top shell buttons and the pet's bottom-left corner. */
export function rampLayout(view: Pick<View, 'w' | 'h' | 'upright'>): RampLayout {
  const cx = view.w / 2;
  if (view.upright) {
    const top = 160 + Math.max(0, Math.min(60, (view.h - 1024) / 4));
    const y = top + BOARD_H + 80;
    return {
      board: { x: cx - BOARD_W / 2, y: top },
      go: { x: cx - 210, y },
      undo: { x: cx - 70, y },
      clear: { x: cx + 70, y },
      hint: { x: cx + 210, y },
    };
  }
  const top = 104 + Math.max(0, (view.h - 768) / 4);
  const y = top + BOARD_H + 60;
  return {
    board: { x: cx - BOARD_W / 2, y: top },
    go: { x: cx - 210, y },
    undo: { x: cx - 70, y },
    clear: { x: cx + 70, y },
    hint: { x: cx + 210, y },
  };
}
