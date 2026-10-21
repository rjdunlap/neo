import type { Rng } from '../../engine/random';
import type { BandLevels } from '../../progress/difficulty';
import { advanceTrace, sampleStroke, type Point } from '../letter-trails/strokes';
import { showTheWay } from '../letter-trails/logic';

/**
 * Draw the Pattern: the pet starts a line or a pattern on a long paper strip, and she carries on from where it stopped.
 * Everything a test can hold the screen to lives here: the ladder, the strip's place on the screen, every stroke (the pet's
 * part, her part, a circle's two ways round, the two faint candidates of levels 7–8), the corridor and the stepping stones.
 * The tracer itself is Letter Trails'.
 *
 * Strip units: the strip's height is 1, so x runs 0–3.4 and y 0–1 (down), and a corridor is as wide one way as the other.
 */

export const STRIP_W = 3.4;
/** Sample spacing along a stroke, in strip units: about 5–7 logical units on the strip. */
export const SPACING = 0.025;

export type Mode = 'mark' | 'trace' | 'choose';

export interface Plan {
  mode: Mode;
  name: string;
  /** Strips in a round. */
  count: number;
}

export const PLANS: readonly Plan[] = [
  { mode: 'mark', name: 'Make a mark: any touch draws on the paper, four touches finish a strip', count: 3 },
  { mode: 'trace', name: 'Straight across, straight down: a long line, then short lines from the top', count: 2 },
  { mode: 'trace', name: 'Zigzag and wave: carry on the pattern the pet starts', count: 2 },
  { mode: 'trace', name: 'Round and round: a circle either way, then a row of loops', count: 2 },
  { mode: 'trace', name: 'From memory: the dashes fade, dots show where the pattern turns', count: 2 },
  { mode: 'trace', name: 'Cross, square, triangle: each line from its own ring, in order', count: 3 },
  { mode: 'choose', name: 'What comes next? Two kinds take turns; draw the one that continues', count: 2 },
  { mode: 'choose', name: 'Two, then one: patterns like hill, hill, dip; draw what comes next', count: 2 },
];

export const LEVELS: BandLevels = {
  lap: { min: 1, max: 2 },
  toddler: { min: 1, max: 3 },
  preschool: { min: 3, max: 5 },
  prek: { min: 5, max: 8 },
};

export const levelOf = (level: number): number => Math.max(1, Math.min(PLANS.length, Math.floor(level)));
export const planFor = (level: number): Plan => PLANS[levelOf(level) - 1];

/** Half the corridor's width, in strip units. It narrows by level and never widens. */
export function tolerance(level: number): number {
  const l = levelOf(level);
  return l <= 3 ? 0.18 : l === 4 ? 0.16 : 0.15;
}

/** Level 1 has no wrong touch: four lifted touches finish a strip. */
export const markCount = (plan: Plan): number => (plan.mode === 'mark' ? 4 : 0);

/* ---------------------------------------------------------------- layout */

export interface Rect { x: number; y: number; w: number; h: number }
export interface Layout {
  /** The strip's top-left corner and its height `s`, in logical units (it is `STRIP_W × s` wide). */
  strip: Rect & { s: number };
  /** The host's crayon picture, top-right. */
  picture: Rect;
}

/** A start ring's radius: 116 units across. */
export const RING_R = 58;
/** Room kept free above and below the strip, so a ring near its edge stays clear of the picture and the pet. */
export const EDGE = 24;
const PAD = 24;
const MAX_S = 280;

/** The corner clearances every layout keeps: home and help top-left, the pet bottom-left. */
export const homeCorner = (): Rect => ({ x: 0, y: 0, w: 130, h: 210 });
export const petCorner = (v: { h: number }): Rect => ({ x: 0, y: v.h - 230, w: 170, h: 230 });

/** The picture top-right; the strip across the middle, between the picture and the pet corner. */
export function layoutFor(v: { w: number; h: number }): Layout {
  const P = Math.max(200, Math.min(280, Math.min(v.w, v.h) * 0.26));
  const picture = { x: v.w - PAD - P, y: PAD, w: P, h: P };
  const top = Math.max(picture.y + P, homeCorner().h) + 16 + EDGE, bottom = v.h - 230 - EDGE;
  const s = Math.min(MAX_S, bottom - top, (v.w - 2 * PAD) / STRIP_W);
  const w = s * STRIP_W;
  return { strip: { x: (v.w - w) / 2, y: (top + bottom) / 2 - s / 2, w, h: s, s }, picture };
}

/* ---------------------------------------------------------------- units and strokes */

export type UnitKind = 'zig' | 'wave' | 'loop' | 'hill' | 'dip' | 'peak' | 'vee';
/** What a finished strip becomes in the picture. */
export type PieceId = 'meadow' | 'ground' | 'fence' | 'mountains' | 'sea' | 'sun' | 'sheep' | 'window' | 'house' | 'roof' | 'bridge' | 'bunting';

/** One unit's width along the strip: the strip holds five. */
export const UNIT_W = 0.6;
const BASE = 0.5;
/** The loops sit low so their lobes reach up: baseline, lobe size and roll (one lobe per unit). */
const LOOP_BASE = 0.85, LOOP_D = 0.36;
/** Loops roll further than other units, so one lobe's back stays two corridors from the next lobe's front. */
const LOOP_W = 0.72;
/** How far a hill, dip, peak or valley reaches from the baseline. */
const ARCH = 0.32;

/** Points along `f(u)` for u in 0..1, close enough that the sampler keeps the curve. */
function curve(f: (u: number) => Point, n = 40): Point[] {
  return Array.from({ length: n + 1 }, (_, i) => f(i / n));
}

/** One unit drawn from x0 and `w` wide, and its corners (the zig's peak and trough, a peak's or valley's tip). */
function unitPath(kind: UnitKind, x0: number, w = UNIT_W): { path: Point[]; corners: Point[] } {
  switch (kind) {
    case 'zig': {
      // Up to a peak, down to a trough, back up to the baseline; two units join in one straight leg.
      const peak: Point = [x0 + w / 4, 0.2], trough: Point = [x0 + (3 * w) / 4, 0.8];
      return { path: [[x0, BASE], peak, trough, [x0 + w, BASE]], corners: [peak, trough] };
    }
    case 'peak': case 'vee': {
      const tip: Point = [x0 + w / 2, BASE + (kind === 'peak' ? -ARCH : ARCH)];
      return { path: [[x0, BASE], tip, [x0 + w, BASE]], corners: [tip] };
    }
    case 'wave':
      return { path: curve((u) => [x0 + w * u, BASE - 0.2 * Math.sin(2 * Math.PI * u)]), corners: [] };
    case 'hill': case 'dip': {
      const sign = kind === 'hill' ? -1 : 1;
      return { path: curve((u) => [x0 + w * u, BASE + sign * ARCH * Math.sin(Math.PI * u)], 30), corners: [] };
    }
    case 'loop': {
      // A garland loop: along the baseline, up and back over itself, down through the crossing and on.
      const r = w / (2 * Math.PI);
      return {
        path: curve((u) => {
          const t = 2 * Math.PI * u;
          return [x0 + r * t + LOOP_D * Math.sin(t), LOOP_BASE - LOOP_D * (1 - Math.cos(t))];
        }, 80),
        corners: [],
      };
    }
  }
}

/** Where a unit starts and ends: the baseline (loops have their own). */
export const baseOf = (kind: UnitKind): number => (kind === 'loop' ? LOOP_BASE : BASE);

export interface Stroke {
  kind: UnitKind | 'line' | 'post' | 'circle' | 'cross-down' | 'cross-across' | 'square' | 'triangle' | 'free';
  /** One path, or two: a circle's two ways round, or levels 7–8's two candidates (the continuing one is `right`). */
  orders: Point[][];
  /** Points `0..lead` are the pet's part; her checkpoints run from `lead` to the end. */
  lead: number;
  /** The real corners (zigzag peaks and troughs, a square's and triangle's corners), as points on the path. */
  corners: Point[];
  /** Levels 7–8: which candidate continues the pattern, and the kind of each. */
  right?: number;
  kinds?: UnitKind[];
  /** Units in the pattern stroke, for the pet's spoken words (levels 3–5). */
  units?: UnitKind[];
}

export interface Strip {
  piece: PieceId;
  strokes: Stroke[];
  /** Levels 7–8: the pattern, for the pet's words and the rule it says after a wrong stroke. */
  pattern?: UnitKind[];
  /** Level 5: the dashes fade after the pet's part. */
  memory?: boolean;
}

const single = (kind: Stroke['kind'], path: Point[], lead = 0, corners: Point[] = []): Stroke => {
  const pts = sampleStroke(path, SPACING);
  return { kind, orders: [pts], lead: lead < 0 ? pts.length - 1 : lead, corners };
};

/** Join units into one stroke from x0; the pet draws the first `shown` units. */
export function patternStroke(kinds: readonly UnitKind[], shown: number, x0: number, w = UNIT_W): Stroke {
  const path: Point[] = [], corners: Point[] = [];
  kinds.forEach((k, i) => {
    const u = unitPath(k, x0 + i * w, w);
    path.push(...(i === 0 ? u.path : u.path.slice(1)));
    corners.push(...u.corners);
  });
  // A zig's last leg and the next zig's first leg are one straight line: the join is not a corner.
  const pts = sampleStroke(path, SPACING);
  const end = x0 + shown * w;
  const lead = shown === 0 ? 0 : pts.findIndex((p) => Math.abs(p[0] - end) < 1e-9 && Math.abs(p[1] - baseOf(kinds[0])) < 1e-9 && p !== pts[0]);
  return { kind: kinds[0], orders: [pts], lead: lead < 0 ? 0 : lead, corners, units: [...kinds] };
}

/** Five units along the strip, starting at x 0.2, end at 3.2. */
const X0 = 0.2;

/** The two candidates for one chosen unit at x0: the kind that continues the pattern and the other kind of the pair. */
export function choiceStroke(right: UnitKind, wrong: UnitKind, x0: number, w: number, rng: Rng): Stroke {
  const kinds: UnitKind[] = rng.int(0, 1) === 0 ? [right, wrong] : [wrong, right];
  const orders = kinds.map((k) => sampleStroke(unitPath(k, x0, w).path, SPACING));
  const corners = kinds.flatMap((k) => unitPath(k, x0, w).corners);
  return { kind: right, orders, lead: 0, corners, right: kinds.indexOf(right), kinds };
}

/* ---------------------------------------------------------------- patterns (levels 7–8) */

/**
 * Two unit kinds that take turns. Every pair is one that goes up and one that goes down, so the first move tells them
 * apart and the two faint candidates never share a corridor, even at level 8's narrow units.
 */
export const PAIRS: readonly (readonly [UnitKind, UnitKind])[] = [['hill', 'dip'], ['peak', 'vee'], ['peak', 'dip'], ['hill', 'vee']];
export type Shape = 'AB' | 'AAB' | 'ABB';

/** The repeating core for a shape over a pair. */
export function core(shape: Shape, a: UnitKind, b: UnitKind): UnitKind[] {
  return shape === 'AB' ? [a, b] : shape === 'AAB' ? [a, a, b] : [a, b, b];
}

/** The kind that continues a repeating pattern after the units shown so far. */
export function nextUnit(pattern: readonly UnitKind[], shown: number): UnitKind {
  return pattern[shown % pattern.length];
}

/** The pattern laid out to `total` units. */
export function patternUnits(core: readonly UnitKind[], total: number): UnitKind[] {
  return Array.from({ length: total }, (_, i) => core[i % core.length]);
}

/* ---------------------------------------------------------------- strips per level */

/** The strips for one round, in order. Seeded: the same seed gives the same strips. */
export function stripsFor(level: number, rng: Rng): Strip[] {
  const l = levelOf(level);
  switch (l) {
    case 1:
      return Array.from({ length: 3 }, () => ({
        piece: 'meadow' as const,
        strokes: [single('free', curve((u) => [X0 + 3 * u, BASE + 0.18 * Math.sin(rng.range(0, 1) + 3 * Math.PI * u)], 60), -1)],
      }));
    case 2: {
      const line = sampleStroke([[X0, BASE], [3.2, BASE]], SPACING);
      const posts = [0.8, 1.7, 2.6].map((x, i) => single('post', [[x, 0.25], [x, 0.85]], i === 0 ? -1 : 0));
      return [
        { piece: 'ground', strokes: [{ kind: 'line', orders: [line], lead: line.findIndex((p) => p[0] >= 1.2 - 1e-9), corners: [] }] },
        { piece: 'fence', strokes: posts },
      ];
    }
    case 3:
      return [
        { piece: 'mountains', strokes: [patternStroke(Array(5).fill('zig'), 2, X0)] },
        { piece: 'sea', strokes: [patternStroke(Array(5).fill('wave'), 2, X0)] },
      ];
    case 4: {
      const c = circle(1.7, 0.5, 0.36);
      return [
        { piece: 'sun', strokes: [{ kind: 'circle', orders: c, lead: 0, corners: [] }] },
        { piece: 'sheep', strokes: [patternStroke(Array(4).fill('loop'), 1, (STRIP_W - 4 * LOOP_W) / 2, LOOP_W)] },
      ];
    }
    case 5: {
      const kinds = rng.shuffle<'zig' | 'wave' | 'loop'>(['zig', 'wave', 'loop']).slice(0, 2);
      return kinds.map((k) => ({
        piece: PIECE_OF[k], memory: true,
        // Loops are as at level 4: four, the pet draws one.
        strokes: [k === 'loop' ? patternStroke(Array(4).fill(k), 1, (STRIP_W - 4 * LOOP_W) / 2, LOOP_W) : patternStroke(Array(5).fill(k), 2, X0)],
      }));
    }
    case 6: {
      const cx = 1.7;
      return [
        { piece: 'window', strokes: [single('cross-down', [[cx, 0.12], [cx, 0.88]]), single('cross-across', [[cx - 0.6, 0.5], [cx + 0.6, 0.5]])] },
        { piece: 'house', strokes: [single('square', [[cx - 0.36, 0.14], [cx - 0.36, 0.86], [cx + 0.36, 0.86], [cx + 0.36, 0.14], [cx - 0.36, 0.14]], 0, [[cx - 0.36, 0.86], [cx + 0.36, 0.86], [cx + 0.36, 0.14]])] },
        { piece: 'roof', strokes: [single('triangle', [[cx, 0.12], [cx - 0.5, 0.86], [cx + 0.5, 0.86], [cx, 0.12]], 0, [[cx - 0.5, 0.86], [cx + 0.5, 0.86]])] },
      ];
    }
    default: {
      const shapes: Shape[] = l === 7 ? ['AB', 'AB'] : rng.shuffle<Shape>(['AAB', 'ABB']);
      const pairs = rng.shuffle([...PAIRS]).slice(0, 2);
      return shapes.map((shape, i) => {
        const [p, q] = pairs[i];
        const [a, b] = rng.int(0, 1) === 0 ? [p, q] : [q, p];
        const pattern = core(shape, a, b);
        const shown = l === 7 ? 4 : 6;
        const total = shown + 3;
        // Seven or nine units: narrower units so the whole pattern fits the strip.
        const w = Math.min(UNIT_W, 3.2 / total);
        return { piece: i === 0 ? 'bridge' : 'bunting', pattern, strokes: choiceStrip(pattern, [a, b], shown, total, w, rng) };
      });
    }
  }
}

const PIECE_OF: Record<'zig' | 'wave' | 'loop', PieceId> = { zig: 'mountains', wave: 'sea', loop: 'sheep' };

/** A circle from the top, both ways round: counterclockwise first (going left, as the pet draws it), then clockwise. */
function circle(cx: number, cy: number, r: number): Point[][] {
  const ccw = sampleStroke(curve((u) => [cx - r * Math.sin(2 * Math.PI * u), cy - r * Math.cos(2 * Math.PI * u)], 96), SPACING);
  const cw = sampleStroke(curve((u) => [cx + r * Math.sin(2 * Math.PI * u), cy - r * Math.cos(2 * Math.PI * u)], 96), SPACING);
  return [ccw, cw];
}

/** Levels 7–8: the pet's units as one stroke, then one stroke per chosen unit with both candidates. */
function choiceStrip(pattern: readonly UnitKind[], pair: readonly [UnitKind, UnitKind], shown: number, total: number, w: number, rng: Rng): Stroke[] {
  const kinds = patternUnits(pattern, total);
  const x0 = (STRIP_W - total * w) / 2;
  const pet = patternStroke(kinds.slice(0, shown), shown, x0, w);
  pet.lead = pet.orders[0].length - 1;
  const out: Stroke[] = [pet];
  for (let i = shown; i < total; i++) {
    const right = kinds[i], wrong = right === pair[0] ? pair[1] : pair[0];
    out.push(choiceStroke(right, wrong, x0 + i * w, w, rng));
  }
  return out;
}

/* ---------------------------------------------------------------- tracing */

/**
 * A move from `from` to `to` with the crayon at `progress`. A circle's two ways round, and a chosen unit's two candidates,
 * share their start; the first move that clearly leaves the start along one picks it. Returns the order (null while
 * undecided) and the new progress.
 */
export function chooseOrder(stroke: Stroke, order: number | null, progress: number, from: Point, to: Point, tol: number): { order: number | null; progress: number } {
  if (order !== null || stroke.orders.length === 1) {
    const o = order ?? 0;
    return { order: o, progress: advanceTrace(stroke.orders[o], progress, from, to, tol) };
  }
  const a = advanceTrace(stroke.orders[0], progress, from, to, tol);
  const b = advanceTrace(stroke.orders[1], progress, from, to, tol);
  // A circle's two ways cover the same ring, so the way is told by how far round from the start each has come; two
  // candidates by how far each has left the other's path.
  const start = stroke.orders[0][0];
  const away = (o: number, i: number) => (stroke.right === undefined
    ? Math.hypot(stroke.orders[o][i][0] - start[0], stroke.orders[o][i][1] - start[1])
    : apart(stroke, o, i));
  const da = away(0, a), db = away(1, b);
  if (Math.max(da, db) <= 1.5 * tol || da === db) return { order: null, progress: Math.min(Math.max(a, b), forkOf(stroke, tol)) };
  return da > db ? { order: 0, progress: a } : { order: 1, progress: b };
}

/** How far a point on one order is from the other order's path (0 for a single path). */
export function apart(stroke: Stroke, order: number, index: number): number {
  if (stroke.orders.length === 1) return 0;
  const p = stroke.orders[order][index], other = stroke.orders[1 - order];
  let best = Infinity;
  for (let i = 1; i < other.length; i++) best = Math.min(best, segDist(p, other[i - 1], other[i]));
  return best;
}

function segDist(p: Point, a: Point, b: Point): number {
  const dx = b[0] - a[0], dy = b[1] - a[1];
  const t = Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / (dx * dx + dy * dy || 1)));
  return Math.hypot(p[0] - a[0] - dx * t, p[1] - a[1] - dy * t);
}

/** The last shared checkpoint while undecided: the index before either order is 1.5 corridors from the other. */
export function forkOf(stroke: Stroke, tol: number): number {
  if (stroke.orders.length === 1) return stroke.orders[0].length - 1;
  const n = Math.min(stroke.orders[0].length, stroke.orders[1].length);
  const start = stroke.orders[0][0];
  for (let i = 0; i < n; i++) {
    const out = stroke.right === undefined
      ? Math.hypot(stroke.orders[0][i][0] - start[0], stroke.orders[0][i][1] - start[1]) > 1.5 * tol
      : apart(stroke, 0, i) > 1.5 * tol || apart(stroke, 1, i) > 1.5 * tol;
    if (out) return Math.max(0, i - 1);
  }
  return n - 1;
}

/** The divergence of a candidate: the first checkpoint where it is two corridors from the other candidate. */
export function divergence(stroke: Stroke, order: number, tol: number): number {
  const pts = stroke.orders[order];
  for (let i = 0; i < pts.length; i++) if (apart(stroke, order, i) >= 2 * tol) return i;
  return pts.length - 1;
}

/** A wrong candidate is a miss once she has drawn this many checkpoints past its divergence. */
export const WRONG_AFTER = 4;
export const wrongReached = (stroke: Stroke, order: number, progress: number, tol: number): boolean =>
  stroke.right !== undefined && order !== stroke.right && progress >= divergence(stroke, order, tol) + WRONG_AFTER;

/** The points she has to reach: the chosen order, or the first one while undecided. */
export const pathOf = (stroke: Stroke, order: number | null): Point[] => stroke.orders[order ?? 0];

/** The stretch the hint lights: the next 12 checkpoints from where the crayon waits. */
export const hintStretch = (points: readonly Point[], progress: number): Point[] => showTheWay(points, progress, 12);

/**
 * Level 5's stepping stones: the points where the pattern turns (a peak, a trough, a loop's top), from `from` on.
 * A turn is where the path's height stops rising or falling.
 */
export function stones(points: readonly Point[], from = 0): Point[] {
  const out: Point[] = [];
  let dir = 0;
  for (let i = 1; i < points.length; i++) {
    const dy = points[i][1] - points[i - 1][1];
    const d = Math.abs(dy) < 1e-6 ? 0 : Math.sign(dy);
    if (d !== 0 && dir !== 0 && d !== dir && i - 1 >= from) out.push(points[i - 1]);
    if (d !== 0) dir = d;
  }
  out.push(points.at(-1)!);
  return out;
}

/** After a stray at level 5 the dashes come back for the next stretch: this many checkpoints. */
export const REVEAL = 24;

/**
 * The ghost finger's route from `progress` to the end: the corners, and a point about every 0.15 strip units along a
 * curve, so a demonstration is not a hundred short legs. Each chord stays well inside the corridor.
 */
export function botRoute(stroke: Stroke, points: readonly Point[], progress: number): Point[] {
  const turns = new Set(stroke.corners.map((c) => points.findIndex((p) => p[0] === c[0] && p[1] === c[1])));
  const out: Point[] = [points[progress]];
  let since = 0;
  for (let i = progress + 1; i < points.length; i++) {
    since += Math.hypot(points[i][0] - points[i - 1][0], points[i][1] - points[i - 1][1]);
    if (since >= 0.1 || turns.has(i) || i === points.length - 1) { out.push(points[i]); since = 0; }
  }
  return out;
}

/** Arc length along a path up to index i. */
export function lengthTo(points: readonly Point[], i: number): number {
  let d = 0;
  for (let k = 1; k <= i && k < points.length; k++) d += Math.hypot(points[k][0] - points[k - 1][0], points[k][1] - points[k - 1][1]);
  return d;
}

/** Level 1: a point inside the paper is a mark. */
export const onPaper = (p: Point): boolean => p[0] >= 0 && p[0] <= STRIP_W && p[1] >= 0 && p[1] <= 1;

/** The scratch plays every 22 logical units of drawing. */
export const SCRATCH_EVERY = 22;
/** The sticker's pattern for a seed. */
export const STICKER_KINDS: readonly UnitKind[] = ['zig', 'wave', 'loop', 'hill', 'peak'];
export const stickerKind = (seed: number): UnitKind => STICKER_KINDS[Math.floor(Math.abs(seed)) % STICKER_KINDS.length];
/** The sticker's pattern as points in a 0..1 box. */
export function stickerPath(kind: UnitKind): Point[] {
  const s = patternStroke(Array(4).fill(kind), 0, 0).orders[0];
  return s.map(([x, y]) => [x / (4 * UNIT_W), y] as Point);
}
