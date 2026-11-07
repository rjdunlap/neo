import type { ColorName } from '../../art/palette';
import type { Rng } from '../../engine/random';
import type { BandLevels } from '../../progress/difficulty';
import { advanceTrace, sampleStroke, type Point } from '../../learning/tracing/strokes';
import { showTheWay } from '../../learning/tracing/feedback';

/**
 * Cut Along: follow a dashed line from the paper's edge with big scissors, and the piece drops into the host's collage.
 * Everything a test can hold the screen to lives here: the ladder, the paper's place on the screen, every cut's path (both
 * ways round for a closed shape), the corridor, the level-1 marks and level 8's boards. The tracer itself is Letter Trails'.
 *
 * Paper units: the paper's shorter side is 1, so x runs 0–4/3 and y 0–1 (down) and a circle stays round.
 */

export const PAPER_W = 4 / 3;
/** Sample spacing along a cut, in paper units: about 11 logical units on the smallest paper. */
export const SPACING = 0.025;

export type Mode = 'snip' | 'cut' | 'fits' | 'two';

export interface CutPlan {
  mode: Mode;
  name: string;
  /** Pieces in a round (strips, ribbons, shapes or boards). */
  count: number;
}

export const PLANS: readonly CutPlan[] = [
  { mode: 'snip', name: 'Snip, snip: tap each thick mark to snip a fringe', count: 3 },
  { mode: 'cut', name: 'Cut the ribbon: one thick straight line', count: 3 },
  { mode: 'cut', name: 'Straight across: longer lines, level and slanted', count: 4 },
  { mode: 'cut', name: 'Zigzag and waves: lines that turn corners and bend', count: 4 },
  { mode: 'cut', name: 'Curves and a circle, cut either way round', count: 3 },
  { mode: 'cut', name: 'Corners: three of a square, a triangle, a door and a kite', count: 3 },
  { mode: 'cut', name: 'Picture shapes: three of heart, house, leaf, fish, cloud, star and moon', count: 3 },
  { mode: 'fits', name: 'The piece that fits: choose the outline for the gap, then cut it', count: 3 },
  { mode: 'cut', name: 'Round and round: spirals for a snail, a snake and a curly tail', count: 3 },
  { mode: 'two', name: 'Cut it in two: choose the line that makes the two pieces the picture needs, then cut it edge to edge', count: 3 },
];

export const LEVELS: BandLevels = {
  toddler: { min: 1, max: 2 },
  preschool: { min: 2, max: 5 },
  prek: { min: 4, max: 7 },
  school: { min: 6, max: 10 },
};

export const levelOf = (level: number): number => Math.max(1, Math.min(PLANS.length, Math.floor(level)));
export const planFor = (level: number): CutPlan => PLANS[levelOf(level) - 1];

/** Half the corridor's width, in paper units. It narrows by level and never widens. */
export function tolerance(level: number): number {
  const l = levelOf(level);
  return l <= 2 ? 0.11 : l <= 4 ? 0.09 : l <= 6 ? 0.08 : l === 7 ? 0.075 : 0.072;
}

/** Wandering off the line counts from level 3; levels 1–2 have no wrong touch. */
export const countsStrays = (level: number): boolean => levelOf(level) >= 3;

/* ---------------------------------------------------------------- layout */

export interface Rect { x: number; y: number; w: number; h: number }
export interface Layout {
  /** The paper's top-left corner and its shorter side, in logical units. */
  paper: Rect & { s: number };
  /** The host's collage, top-right. */
  picture: Rect;
}

/** A start ring's radius: 116 units across. */
export const RING_R = 58;
/** Room kept free beside the paper's left, right and bottom edges for a start ring. */
export const EDGE = 64;
const PAD = 24;
const MAX_S = 560;

/** The corner clearances every layout keeps: home and help top-left, the pet bottom-left. */
export const homeCorner = (): Rect => ({ x: 0, y: 0, w: 130, h: 210 });
export const petCorner = (v: { h: number }): Rect => ({ x: 0, y: v.h - 230, w: 170, h: 230 });

/** Where the paper and the picture go: the picture top-right, the paper beside it or under it, whichever is bigger. */
export function layoutFor(v: { w: number; h: number }): Layout {
  const P = Math.max(200, Math.min(280, Math.min(v.w, v.h) * 0.26));
  const picture = { x: v.w - PAD - P, y: PAD, w: P, h: P };
  const left = 170 + EDGE, bottom = v.h - EDGE;
  const fit = (x0: number, x1: number, y0: number, y1: number) => {
    const s = Math.min(MAX_S, y1 - y0, ((x1 - x0) * 3) / 4);
    return { s, x: (x0 + x1) / 2 - (s * PAPER_W) / 2, y: (y0 + y1) / 2 - s / 2 };
  };
  const beside = fit(left, picture.x - PAD - EDGE, PAD, bottom);
  const under = fit(left, v.w - PAD - EDGE, picture.y + P + 16, bottom);
  const best = beside.s >= under.s ? beside : under;
  return { paper: { x: best.x, y: best.y, w: best.s * PAPER_W, h: best.s, s: best.s }, picture };
}

/* ---------------------------------------------------------------- cuts */

/** What a cut-out becomes in the collage. */
export type PieceId =
  | 'grass' | 'tail' | 'plank' | 'mountain' | 'sea' | 'hill' | 'path' | 'sun' | 'window' | 'sail' | 'door' | 'kite'
  | 'heart' | 'house' | 'leaf' | 'fish' | 'cloud' | 'star' | 'moon' | 'roof' | 'shell' | 'snake' | 'coil' | 'cat-tail';

export type CutKind =
  | 'ribbon' | 'level' | 'slant' | 'zigzag' | 'wave' | 'hill' | 'scurve'
  | 'circle' | 'square' | 'triangle' | 'door' | 'kite' | 'heart' | 'house' | 'leaf' | 'fish' | 'cloud' | 'star' | 'moon' | 'roof-arch' | 'spiral' | 'split';

export interface Cut {
  kind: CutKind;
  piece: PieceId;
  closed: boolean;
  /** The sheet the cut is on, inside the paper (paper units). Every path starts on its edge. */
  sheet: Rect;
  /** Index of the joint where the lead-in meets a closed shape (0 for an open line). */
  lead: number;
  /** Sampled paths: one for an open line; for a closed shape `[cw, ccw]`, sharing the lead-in. */
  orders: Point[][];
  /** The real corners (zigzag points, a square's corners, the heart's dip, the fish's tail), as points on the path. */
  corners: Point[];
  /** A closed shape's outline (or a spiral's cut-out strip), for drawing the piece that drops out. */
  outline?: Point[];
  /** A spiral's centre and its innermost and outermost radii, for the rule tests. */
  spiral?: { cx: number; cy: number; inner: number; outer: number; turns: number };
}

const FULL: Rect = { x: 0, y: 0, w: PAPER_W, h: 1 };

function open(kind: CutKind, piece: PieceId, path: Point[], corners: Point[] = [], sheet = FULL, reverse = false): Cut {
  const p = reverse ? [...path].reverse() : path;
  return { kind, piece, closed: false, sheet, lead: 0, orders: [sampleStroke(p, SPACING)], corners };
}

/** A closed outline (its first point is the joint, listed one way round) reached by a straight lead-in from `from`. */
function closed(kind: CutKind, piece: PieceId, loop: Point[], from: Point, corners: Point[], sheet = FULL): Cut {
  const lead = sampleStroke([from, loop[0]], SPACING);
  const ring = [...loop, loop[0]];
  const cw = [...lead, ...sampleStroke(ring, SPACING).slice(1)];
  const ccw = [...lead, ...sampleStroke([...ring].reverse(), SPACING).slice(1)];
  return { kind, piece, closed: true, sheet, lead: lead.length - 1, orders: [cw, ccw], corners, outline: loop };
}

/** Points along `f(u)` for u in 0..1, close enough that the sampler keeps the curve. */
function curve(f: (u: number) => Point, n = 80): Point[] {
  return Array.from({ length: n + 1 }, (_, i) => f(i / n));
}

const place = (shape: Point[], cx: number, cy: number, r: number): Point[] => shape.map(([x, y]) => [cx + x * r, cy + y * r] as const);

/** Unit outlines in a −1..1 box, y down, each starting at its joint at the bottom. Corners are listed by index. */
type OutlineId = 'circle' | 'square' | 'triangle' | 'door' | 'kite' | 'heart' | 'house' | 'leaf' | 'fish' | 'cloud' | 'star' | 'moon' | 'arch';
export const OUTLINES: Record<OutlineId, { loop: Point[]; corners: number[] }> = {
  circle: { loop: curve((u) => [Math.sin(u * 2 * Math.PI), Math.cos(u * 2 * Math.PI)], 72).slice(0, -1), corners: [] },
  square: { loop: [[0, 1], [1, 1], [1, -1], [-1, -1], [-1, 1]], corners: [1, 2, 3, 4] },
  triangle: { loop: [[0, 0.8], [1, 0.8], [0, -1], [-1, 0.8]], corners: [1, 2, 3] },
  door: { loop: [[0, 1], [0.6, 1], [0.6, -1], [-0.6, -1], [-0.6, 1]], corners: [1, 2, 3, 4] },
  // A diamond kite, its joint at the bottom tip; the long half is below the cross.
  kite: { loop: [[0, 1], [0.75, -0.25], [0, -1], [-0.75, -0.25]], corners: [1, 2, 3] },
  arch: (() => {
    // A rounded-top piece: flat sides and bottom, a half circle on top (level 8's "round on top").
    const top = curve((u) => [Math.cos(u * Math.PI), -Math.sin(u * Math.PI)] as Point, 30).slice(1, -1);
    const loop: Point[] = [[0, 0.8], [1, 0.8], [1, 0], ...top, [-1, 0], [-1, 0.8]];
    return { loop, corners: [1, loop.length - 1] };
  })(),
  heart: (() => {
    // The classic heart curve, from the bottom cusp round through the dip at the top and back.
    const raw = curve((u) => {
      const t = Math.PI + u * 2 * Math.PI;
      return [16 * Math.sin(t) ** 3, -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t))];
    }, 120).slice(0, -1);
    const loop = raw.map(([x, y]) => [x / 17, (y - 2.5) / 14.5] as Point);
    return { loop, corners: [60] };
  })(),
  house: { loop: [[0, 1], [0.8, 1], [0.8, -0.45], [0, -1], [-0.8, -0.45], [-0.8, 1]], corners: [1, 2, 3, 4, 5] },
  leaf: {
    loop: [
      ...curve((u) => [0.62 * Math.sin(Math.PI * u), 1 - 2 * u] as Point, 40),
      ...curve((u) => [-0.62 * Math.sin(Math.PI * u), -1 + 2 * u] as Point, 40).slice(1, -1),
    ],
    corners: [40],
  },
  fish: (() => {
    // Facing left: the belly's lowest point is the joint, then the tail, the back and the nose.
    const belly1 = curve((u) => [-0.3 + 0.7 * u, 0.6 - 0.35 * u * u] as Point, 14);
    const tail: Point[] = [[1, 0.7], [0.66, 0], [1, -0.7], [0.4, -0.25]];
    const back = curve((u) => [0.4 - 1.4 * u, -0.25 + 0.25 * u - 0.45 * Math.sin(Math.PI * u)] as Point, 28).slice(1);
    const belly2 = curve((u) => [-1 + 0.7 * u, 0.6 * Math.sin((Math.PI / 2) * u)] as Point, 14).slice(1, -1);
    const loop = [...belly1, ...tail, ...back, ...belly2];
    const at = (p: Point) => loop.indexOf(p);
    return { loop, corners: [at(belly1.at(-1)!), at(tail[0]), at(tail[1]), at(tail[2]), at(tail[3]), at(back.at(-1)!)] };
  })(),
  star: (() => {
    // Five fat points (inner radius 0.6 of the outer), the joint in the notch between the two lower points.
    const loop: Point[] = Array.from({ length: 10 }, (_, i) => {
      const a = Math.PI / 2 + (i * Math.PI) / 5, r = i % 2 === 0 ? 0.6 : 1;
      return [r * Math.cos(a), r * Math.sin(a)] as Point;
    });
    return { loop, corners: [1, 2, 3, 4, 5, 6, 7, 8, 9] };
  })(),
  moon: (() => {
    // A crescent lying on its back, its tips up: the outer circle from the joint at the thick bottom to the left tip, the
    // inner circle (centre 0.8 up, radius 0.9) across to the right tip, then the outer circle back down. The tips meet at
    // about 50°, so the two arcs part quickly.
    const tx = (1 + 0.8 ** 2 - 0.9 ** 2) / 1.6, ty = Math.sqrt(1 - tx * tx);
    const alpha = Math.atan2(tx, ty), beta = Math.atan2(0.8 - tx, ty);
    const arc = (cx: number, cy: number, r: number, a0: number, a1: number, n: number) =>
      curve((u) => { const a = a0 + u * (a1 - a0); return [cx + r * Math.cos(a), cy + r * Math.sin(a)] as Point; }, n);
    const left = arc(0, 0, 1, Math.PI / 2, Math.PI + alpha, 24).slice(0, -1);
    const inner = arc(0, -0.8, 0.9, Math.PI - beta, beta, 36);
    const right = arc(0, 0, 1, -alpha, Math.PI / 2, 24).slice(1, -1);
    return { loop: [...left, ...inner, ...right], corners: [left.length, left.length + inner.length - 1] };
  })(),
  cloud: (() => {
    // A flat bottom and three bumps on top; the bumps meet in small dips.
    const bump = (x0: number, x1: number, h: number) => curve((u) => [x0 + (x1 - x0) * u, 0.1 - h * Math.sin(Math.PI * u)] as Point, 24).slice(1);
    const r = bump(0.95, 0.3, 0.45), m = bump(0.3, -0.4, 0.8), l = bump(-0.4, -0.95, 0.45);
    const loop: Point[] = [[0, 0.7], [0.95, 0.7], [0.95, 0.1], ...r, ...m, ...l, [-0.95, 0.7]];
    const at = (p: Point) => loop.indexOf(p);
    return { loop, corners: [1, at(r.at(-1)!), at(m.at(-1)!), loop.length - 1] };
  })(),
};

/** A shape outline placed on the paper at (cx, cy) with half-size r, reached by a lead-in from the paper's bottom edge. */
export function shapeCut(kind: OutlineId, piece: PieceId, cx: number, cy: number, r: number, cutKind?: CutKind): Cut {
  const o = OUTLINES[kind];
  const loop = place(o.loop, cx, cy, r);
  return closed(cutKind ?? (kind === 'arch' ? 'roof-arch' : kind), piece, loop, [loop[0][0], 1], o.corners.map((i) => loop[i]));
}

/** Level 9's ring spacing: more than twice the corridor and a sample apart, so one turn never shares another's corridor. */
export const RING_GAP = 0.17;
/** The innermost radius of a spiral: tight enough to turn, never so tight that a short chord skips the curl. */
export const INNER_R = 0.14;

/**
 * An Archimedean spiral turning inward from its outermost point (the far left, or the far right when mirrored), reached
 * by a straight lead-in up from the paper's bottom edge that meets it heading up, so the joint has no corner. It turns
 * clockwise on the paper (counterclockwise when mirrored) and ends at its inner radius; `outline` is the strip it cuts free.
 */
export function spiralCut(piece: PieceId, cx: number, cy: number, turns: number, mirror = false): Cut {
  const outer = INNER_R + RING_GAP * turns, sign = mirror ? -1 : 1;
  const at = (u: number, off = 0): Point => {
    const t = u * turns * 2 * Math.PI, r = outer - (outer - INNER_R) * u + off;
    return [cx - sign * r * Math.cos(t), cy - r * Math.sin(t)];
  };
  const spiral = curve((u) => at(u), Math.ceil(turns * 90));
  const start: Point = [cx - sign * outer, 1];
  const path = [...sampleStroke([start, spiral[0]], SPACING), ...sampleStroke(spiral, SPACING).slice(1)];
  // The strip the cut frees runs half a ring either side of the line, round to the centre.
  const half = RING_GAP / 2, n = Math.ceil(turns * 48);
  const side = (off: number) => Array.from({ length: n + 1 }, (_, i) => at(i / n, off));
  const outline = [...side(half), ...side(-Math.min(half, INNER_R * 0.8)).reverse()];
  return { kind: 'spiral', piece, closed: false, sheet: FULL, lead: 0, orders: [path], corners: [], outline, spiral: { cx, cy, inner: INNER_R, outer, turns } };
}

function zigzag(corners: number, rng: Rng): { path: Point[]; corners: Point[] } {
  const dx = PAPER_W / (corners + 1), a = 0.19, up = rng.int(0, 1) === 0;
  const path: Point[] = [[0, 0.5]];
  for (let i = 1; i <= corners; i++) path.push([i * dx, 0.5 + ((i % 2 === 1) === up ? -a : a)]);
  path.push([PAPER_W, 0.5]);
  return { path, corners: path.slice(1, -1) };
}

const wave = (k: number, amp: number, phase: number) => curve((u) => [u * PAPER_W, 0.5 + amp * Math.sin(phase + 2 * Math.PI * k * u)] as Point, 90);

/** The cuts for one round of levels 2–7, in order. Seeded: the same seed gives the same paper. */
export function cutsFor(level: number, rng: Rng): Cut[] {
  const l = levelOf(level), mid = PAPER_W / 2;
  const flip = () => rng.int(0, 1) === 1;
  switch (l) {
    case 2: {
      const sheet = { x: 0.2, y: 0.18, w: 0.93, h: 0.64 };
      return Array.from({ length: 3 }, () => open('ribbon', 'tail', [[sheet.x, 0.5], [sheet.x + sheet.w, 0.5]], [], sheet));
    }
    case 3: {
      const level = () => { const y = rng.range(0.4, 0.6); return open('level', 'plank', [[0, y], [PAPER_W, y]], [], FULL, flip()); };
      const slant = () => { const down = flip(), a = rng.range(0.25, 0.35); return open('slant', 'plank', [[0, down ? a : 1 - a], [PAPER_W, down ? 1 - a : a]], [], FULL, flip()); };
      return [level(), slant(), level(), slant()];
    }
    case 4: {
      const z = [zigzag(3, rng), zigzag(4, rng)];
      return [
        ...z.map((q) => open('zigzag', 'mountain', q.path, q.corners, FULL, flip())),
        open('wave', 'sea', wave(1.5, 0.12, rng.range(0, Math.PI)), [], FULL, flip()),
        open('wave', 'sea', wave(2, 0.1, rng.range(0, Math.PI)), [], FULL, flip()),
      ];
    }
    case 5:
      return [
        open('hill', 'hill', curve((u) => [u * PAPER_W, 0.78 - 0.46 * Math.sin(Math.PI * u)] as Point, 80), [], FULL, flip()),
        open('scurve', 'path', curve((u) => [u * PAPER_W, 0.5 + 0.22 * Math.sin(2 * Math.PI * u)] as Point, 90), [], FULL, flip()),
        shapeCut('circle', 'sun', mid, 0.45, 0.36),
      ];
    case 6: {
      const shapes: [OutlineId, PieceId, number, number][] = [
        ['square', 'window', 0.42, 0.31], ['triangle', 'sail', 0.4, 0.35], ['door', 'door', 0.42, 0.33], ['kite', 'kite', 0.42, 0.34],
      ];
      return rng.shuffle(shapes).slice(0, 3).map(([k, piece, cy, r]) => shapeCut(k, piece, mid, cy, r));
    }
    case 9:
      // A snail's shell, a snake, then a cat's curly tail or a second snake turning the other way.
      return [
        spiralCut('shell', mid + 0.02, 0.56, 1.5),
        spiralCut('snake', mid + 0.04, 0.53, 2),
        flip() ? spiralCut('cat-tail', mid + 0.06, 0.42, 1) : spiralCut('coil', mid - 0.04, 0.53, 2, true),
      ];
    default: {
      const kinds = rng.shuffle<PictureShape>([...PICTURE_SHAPES]).slice(0, 3);
      return kinds.map((k) => shapeCut(k, k, mid, 0.42, k === 'cloud' ? 0.42 : k === 'star' ? 0.36 : 0.34));
    }
  }
}

/** Level 7's outlines; a round cuts three of them. */
export const PICTURE_SHAPES = ['heart', 'house', 'leaf', 'fish', 'cloud', 'star', 'moon'] as const;
type PictureShape = (typeof PICTURE_SHAPES)[number];

/** The sheet's edge the ring sits on is where the path starts. */
export const startOf = (cut: Cut): Point => cut.orders[0][0];

/**
 * A move from `from` to `to` with the scissors at `progress`. Before the joint both orders are still open; the first move
 * that carries past the joint picks the way round. Returns the order to keep (null while undecided) and the new progress.
 */
export function chooseOrder(cut: Cut, order: number | null, progress: number, from: Point, to: Point, tol: number): { order: number | null; progress: number } {
  if (order !== null || cut.orders.length === 1) {
    const o = order ?? 0;
    return { order: cut.closed ? o : 0, progress: advanceTrace(cut.orders[o], progress, from, to, tol) };
  }
  const a = advanceTrace(cut.orders[0], progress, from, to, tol);
  const b = advanceTrace(cut.orders[1], progress, from, to, tol);
  // Coming up the lead-in, either way can creep a checkpoint or two past the joint (a hair of sideways wobble is enough).
  // Only a cut that has clearly left the joint along one side picks it.
  const joint = cut.orders[0][cut.lead];
  const away = (pts: Point[], i: number) => (i > cut.lead ? Math.hypot(pts[i][0] - joint[0], pts[i][1] - joint[1]) : 0);
  const da = away(cut.orders[0], a), db = away(cut.orders[1], b);
  if (Math.max(da, db) <= 1.5 * tol || da === db) return { order: null, progress: Math.min(cut.lead, Math.max(a, b)) };
  return da > db ? { order: 0, progress: a } : { order: 1, progress: b };
}

/** The points she has to reach: the chosen order, or the first one while undecided. */
export const pathOf = (cut: Cut, order: number | null): Point[] => cut.orders[order ?? 0];

/** The stretch the hint lights: the next 12 checkpoints from where the scissors wait. */
export const hintStretch = (points: readonly Point[], progress: number): Point[] => showTheWay(points, progress, 12);

/**
 * The ghost finger's route from `progress` to the end: the corners, and a point about every 0.15 paper units along a curve,
 * so a demonstration is not a hundred half-second legs. Each chord stays well inside the corridor.
 */
export function botRoute(cut: Cut, points: readonly Point[], progress: number): Point[] {
  const turns = new Set([cut.lead, ...cut.corners.map((c) => points.findIndex((p) => p[0] === c[0] && p[1] === c[1]))]);
  const out: Point[] = [points[progress]];
  let since = 0;
  for (let i = progress + 1; i < points.length; i++) {
    since += Math.hypot(points[i][0] - points[i - 1][0], points[i][1] - points[i - 1][1]);
    if (since >= 0.15 || turns.has(i) || i === points.length - 1) { out.push(points[i]); since = 0; }
  }
  return out;
}

/* ---------------------------------------------------------------- the picture */

/**
 * The host's picture a round fills. Each level has one or two, picked by seed; a theme changes the scene, where the pieces
 * go, their colour and what the pet says, never the cuts.
 */
export type Theme =
  | 'meadow' | 'hedgehog' | 'kite' | 'gift' | 'fence' | 'raft' | 'mountains' | 'river' | 'day' | 'night'
  | 'harbour' | 'pond' | 'garland' | 'boats' | 'garden' | 'twos';
export const THEMES: readonly (readonly Theme[])[] = [
  ['meadow', 'hedgehog'], ['kite', 'gift'], ['fence', 'raft'], ['mountains', 'river'], ['day', 'night'], ['harbour'], ['pond', 'garland'], ['boats'], ['garden'], ['twos'],
];
export const themeFor = (level: number, rng: Rng): Theme => rng.pick(THEMES[levelOf(level) - 1]);

/** Where a piece goes in the host's picture, in the picture's 0–1 units. */
export interface Slot { piece: PieceId; x: number; y: number; w: number; h: number }
type Spot = Omit<Slot, 'piece'>;

/** The slots a round's pieces fill, in round order (level 8: every gap, in a fixed order). */
export function slotsFor(level: number, theme: Theme, pieces: readonly PieceId[]): Slot[] {
  const at = (spots: readonly Spot[]) => pieces.map((piece, i) => ({ piece, ...spots[i] }));
  const by = (spots: Partial<Record<PieceId, Spot>>) => pieces.map((piece) => ({ piece, ...spots[piece]! }));
  switch (levelOf(level)) {
    case 1:
      return theme === 'hedgehog'
        ? at([{ x: 0.1, y: 0.36, w: 0.26, h: 0.16 }, { x: 0.36, y: 0.3, w: 0.26, h: 0.16 }, { x: 0.62, y: 0.36, w: 0.26, h: 0.16 }])
        : pieces.map((piece, i) => ({ piece, x: 0.04 + i * 0.32, y: 0.78, w: 0.3, h: 0.18 }));
    case 2:
      return theme === 'gift'
        ? pieces.map((piece, i) => ({ piece, x: 0.18, y: 0.42 + i * 0.13, w: 0.64, h: 0.12 }))
        : pieces.map((piece, i) => ({ piece, x: 0.36 + i * 0.12, y: 0.42 + i * 0.16, w: 0.2, h: 0.12 }));
    case 3:
      return theme === 'raft'
        ? pieces.map((piece, i) => ({ piece, x: 0.2 + i * 0.15, y: 0.4, w: 0.13, h: 0.34 }))
        : pieces.map((piece, i) => ({ piece, x: 0.12 + i * 0.21, y: 0.5, w: 0.13, h: 0.38 }));
    case 4:
      return theme === 'river'
        ? at([{ x: 0.08, y: 0.4, w: 0.42, h: 0.12 }, { x: 0.5, y: 0.4, w: 0.42, h: 0.12 }, { x: 0.02, y: 0.66, w: 0.96, h: 0.13 }, { x: 0.02, y: 0.8, w: 0.96, h: 0.13 }])
        : at([{ x: 0.04, y: 0.28, w: 0.48, h: 0.3 }, { x: 0.48, y: 0.24, w: 0.48, h: 0.34 }, { x: 0.02, y: 0.62, w: 0.96, h: 0.14 }, { x: 0.02, y: 0.78, w: 0.96, h: 0.14 }]);
    case 5:
      return by({ hill: { x: 0.04, y: 0.5, w: 0.92, h: 0.32 }, path: { x: 0.3, y: 0.72, w: 0.4, h: 0.24 }, sun: { x: 0.66, y: 0.06, w: 0.28, h: 0.28 } });
    case 6:
      return by({
        window: { x: 0.14, y: 0.46, w: 0.16, h: 0.16 }, door: { x: 0.36, y: 0.5, w: 0.14, h: 0.28 },
        sail: { x: 0.62, y: 0.26, w: 0.26, h: 0.36 }, kite: { x: 0.24, y: 0.04, w: 0.16, h: 0.22 },
      });
    case 7:
      return theme === 'garland'
        ? pieces.map((piece, i) => ({ piece, x: 0.06 + i * 0.31, y: 0.24 + (i === 1 ? 0.07 : 0), w: 0.26, h: 0.26 }))
        : pieces.map((piece, i) => ({ piece, x: 0.06 + i * 0.31, y: 0.3 + (i % 2) * 0.22, w: 0.26, h: 0.26 }));
    case 9:
      return by({
        shell: { x: 0.1, y: 0.48, w: 0.24, h: 0.24 }, snake: { x: 0.36, y: 0.74, w: 0.26, h: 0.2 },
        coil: { x: 0.68, y: 0.74, w: 0.26, h: 0.2 }, 'cat-tail': { x: 0.8, y: 0.3, w: 0.16, h: 0.3 },
      });
    case 10:
      // Two windows in the house, two sails on the boats, two boards in the fence; each board fills one pair.
      return [
        { piece: 'window', x: 0.1, y: 0.42, w: 0.12, h: 0.12 }, { piece: 'window', x: 0.3, y: 0.42, w: 0.12, h: 0.12 },
        { piece: 'sail', x: 0.55, y: 0.3, w: 0.15, h: 0.26 }, { piece: 'sail', x: 0.79, y: 0.3, w: 0.15, h: 0.26 },
        { piece: 'plank', x: 0.12, y: 0.74, w: 0.08, h: 0.22 }, { piece: 'plank', x: 0.32, y: 0.74, w: 0.08, h: 0.22 },
      ];
    default: {
      const gaps: Partial<Record<PieceId, Spot>> = {
        roof: { x: 0.06, y: 0.3, w: 0.4, h: 0.22 }, window: { x: 0.18, y: 0.6, w: 0.16, h: 0.16 },
        sun: { x: 0.7, y: 0.06, w: 0.22, h: 0.22 }, sail: { x: 0.62, y: 0.38, w: 0.26, h: 0.3 },
      };
      return (['roof', 'window', 'sun', 'sail'] as const).map((piece) => ({ piece, ...gaps[piece]! }));
    }
  }
}

const PIECE_COLOR: Record<PieceId, ColorName> = {
  grass: 'green', tail: 'pink', plank: 'brown', mountain: 'purple', sea: 'blue', hill: 'green', path: 'orange', sun: 'yellow',
  window: 'blue', sail: 'white', door: 'red', kite: 'purple', heart: 'red', house: 'orange', leaf: 'green', fish: 'orange',
  cloud: 'white', star: 'yellow', moon: 'yellow', roof: 'red', shell: 'orange', snake: 'green', coil: 'teal', 'cat-tail': 'orange',
};
const THEME_COLOR: Partial<Record<Theme, Partial<Record<PieceId, ColorName>>>> = {
  hedgehog: { grass: 'brown' }, gift: { tail: 'yellow' }, river: { mountain: 'white' }, garland: { cloud: 'teal' },
};
export const pieceColor = (theme: Theme, piece: PieceId): ColorName => THEME_COLOR[theme]?.[piece] ?? PIECE_COLOR[piece];

/** The pieces that get their own line in a theme; every other piece says its plain `cut.piece.<piece>` line. */
export const THEME_LINES: Partial<Record<Theme, readonly PieceId[]>> = {
  hedgehog: ['grass'], gift: ['tail'], raft: ['plank'], river: ['mountain', 'sea'], night: ['sun'], garland: PICTURE_SHAPES,
  twos: ['window', 'sail', 'plank'],
};
export const pieceLine = (theme: Theme, piece: PieceId): string =>
  THEME_LINES[theme]?.includes(piece) ? `cut.piece.${theme}.${piece}` : `cut.piece.${piece}`;

/* ---------------------------------------------------------------- level 1 */

export interface Mark { x: number; length: number }
/** The level-1 strip, inside the paper: five thick marks come up from its bottom edge. */
export const STRIP: Rect = { x: 0, y: 0.42, w: PAPER_W, h: 0.58 };
/** A mark's touch box, in logical units: at least 110 across and 140 tall from the strip's bottom edge. */
export const MARK_HIT = { w: 110, h: 140 };

export function fringeMarks(rng: Rng): Mark[] {
  return Array.from({ length: 5 }, (_, i) => ({ x: ((i + 0.5) / 5) * PAPER_W, length: rng.range(0.15, 0.2) }));
}

/** A mark's touch box in paper units, for a paper whose short side is `s` logical units. */
export function markBox(m: Mark, s: number): Rect {
  const w = MARK_HIT.w / s, h = Math.max(MARK_HIT.h / s, m.length + 0.04);
  return { x: m.x - w / 2, y: 1 - h, w, h };
}

/** The unsnipped mark under a touch at `p` (paper units), the nearest when boxes are close. */
export function markAt(marks: readonly Mark[], snipped: ReadonlySet<number>, p: Point, s: number): number | null {
  let best: number | null = null, bestD = Infinity;
  marks.forEach((m, i) => {
    if (snipped.has(i)) return;
    const b = markBox(m, s);
    if (p[0] < b.x || p[0] > b.x + b.w || p[1] < b.y || p[1] > b.y + b.h) return;
    const d = Math.abs(p[0] - m.x);
    if (d < bestD) { best = i; bestD = d; }
  });
  return best;
}

/* ---------------------------------------------------------------- level 8 */

/** What each outline is, for judging and for what the pet says differs. */
export type Silhouette = 'pointy' | 'flat' | 'round' | 'four';
export type Gap = 'roof' | 'sun' | 'window' | 'sail';
export const GAP_NEEDS: Record<Gap, Silhouette> = { roof: 'pointy', sail: 'pointy', sun: 'round', window: 'four' };
/** What she hears when an outline does not fit, keyed `<this one>-<the gap>`; every distractor pairing has a line. */
export const DIFFERS = {
  'flat-pointy': 'cut.differs.flat-pointy',
  'round-pointy': 'cut.differs.round-pointy',
  'four-round': 'cut.differs.four-round',
  'pointy-round': 'cut.differs.pointy-round',
  'round-four': 'cut.differs.round-four',
  'pointy-four': 'cut.differs.pointy-four',
} as const;
export type DiffersKey = keyof typeof DIFFERS;

export interface Board {
  gap: Gap;
  cuts: Cut[];
  silhouettes: Silhouette[];
  /** Index of the outline that fits. */
  fits: number;
}

const SHAPE_OF: Record<Silhouette, keyof typeof OUTLINES> = { pointy: 'triangle', flat: 'square', four: 'square', round: 'circle' };
const DISTRACTORS: Record<Gap, Silhouette[]> = { roof: ['flat', 'round'], sail: ['flat', 'round'], sun: ['four', 'pointy'], window: ['round', 'pointy'] };

/** Level 8's three boards: three gaps from four, two outlines on the first board, three on the others. */
export function boardsFor(rng: Rng): Board[] {
  const gaps = rng.shuffle(['roof', 'sun', 'window', 'sail'] as Gap[]).slice(0, 3);
  return gaps.map((gap, b) => {
    const n = b === 0 ? 2 : 3;
    const sil = rng.shuffle([GAP_NEEDS[gap], ...DISTRACTORS[gap].slice(0, n - 1)]);
    const r = n === 2 ? 0.22 : 0.15;
    const xs = n === 2 ? [0.35, PAPER_W - 0.35] : [0.22, PAPER_W / 2, PAPER_W - 0.22];
    const cuts = sil.map((s, i) => {
      const shape = s === 'round' && gap !== 'sun' ? 'arch' : SHAPE_OF[s];
      return shapeCut(shape, gapPiece(gap), xs[i], 0.45, r);
    });
    return { gap, cuts, silhouettes: sil, fits: sil.indexOf(GAP_NEEDS[gap]) };
  });
}

const gapPiece = (gap: Gap): PieceId => (gap === 'roof' ? 'roof' : gap);

export const judgeOutline = (board: Board, outline: number): boolean => outline === board.fits;

/** The line for an outline that does not fit its board's gap. */
export function differsLine(board: Board, outline: number): (typeof DIFFERS)[DiffersKey] {
  const mine = board.silhouettes[outline], need = GAP_NEEDS[board.gap];
  const key = `${mine === 'four' && need === 'pointy' ? 'flat' : mine}-${need}` as DiffersKey;
  return DIFFERS[key] ?? DIFFERS['flat-pointy'];
}

/** Cutting into a wrong outline is a miss once this share of it is cut (counting from its own start ring). */
export const WRONG_SHARE = 0.2;
export const wrongReached = (progress: number, length: number): boolean => progress >= Math.ceil((length - 1) * WRONG_SHARE);

/* ---------------------------------------------------------------- level 10 */

/** What one straight line cuts a sheet into. */
export type Pair = 'triangles' | 'squares' | 'strips';
/** The pair of gaps in the picture each kind fills. */
export const PAIR_PIECE: Record<Pair, PieceId> = { triangles: 'sail', squares: 'window', strips: 'plank' };
/** What she hears when a line makes the wrong pair, keyed `<what it makes>-<what the picture needs>`. */
export const MAKES = {
  'strips-triangles': 'cut.makes.strips-triangles',
  'squares-triangles': 'cut.makes.squares-triangles',
  'triangles-squares': 'cut.makes.triangles-squares',
  'strips-squares': 'cut.makes.strips-squares',
  'triangles-strips': 'cut.makes.triangles-strips',
  'squares-strips': 'cut.makes.squares-strips',
} as const;
export type MakesKey = keyof typeof MAKES;

export interface SplitLine { from: Point; to: Point; makes: Pair }
export interface SplitBoard {
  /** The cut paper shape: a square, or a rectangle twice as wide as tall. Every line runs edge to edge across it. */
  sheet: Rect;
  lines: SplitLine[];
  need: Pair;
  /** Index of the line that makes the pair the picture needs. */
  fits: number;
  /** Two cuts per line, one from each end, so a ring sits at both: line i is `cuts[2i]` and, reversed, `cuts[2i + 1]`. */
  cuts: Cut[];
}

/** Board 1's square and the rectangle of boards 2 and 3. Each keeps every ring at least 2 × `RING_R` from the next on the smallest paper, and clear of the paper's top edge. */
export const SQUARE_SHEET: Rect = { x: (PAPER_W - 0.78) / 2, y: 0.15, w: 0.78, h: 0.78 };
export const LONG_SHEET: Rect = { x: (PAPER_W - 1.2) / 2, y: 0.2, w: 1.2, h: 0.6 };

const isSquare = (sh: Rect) => Math.abs(sh.w - sh.h) < 1e-9;
const diagonal = (sh: Rect, up: boolean): SplitLine =>
  ({ from: [sh.x, up ? sh.y + sh.h : sh.y], to: [sh.x + sh.w, up ? sh.y : sh.y + sh.h], makes: 'triangles' });
/** Top to bottom through the middle: two strips from a square, two squares from the rectangle. */
const across = (sh: Rect): SplitLine =>
  ({ from: [sh.x + sh.w / 2, sh.y + sh.h], to: [sh.x + sh.w / 2, sh.y], makes: isSquare(sh) ? 'strips' : 'squares' });
/** Side to side through the middle: two strips. */
const along = (sh: Rect): SplitLine => ({ from: [sh.x, sh.y + sh.h / 2], to: [sh.x + sh.w, sh.y + sh.h / 2], makes: 'strips' });

/** The orders boards may ask in, so a round fills each pair of gaps once: the square can only make triangles or strips, and the two-line rectangle only squares or strips. */
export const NEED_ORDERS: readonly (readonly Pair[])[] = [
  ['triangles', 'squares', 'strips'], ['triangles', 'strips', 'squares'], ['strips', 'squares', 'triangles'],
];

/** Level 10's three boards: a square with two lines, the rectangle with two, then the rectangle with three. */
export function splitBoardsFor(rng: Rng): SplitBoard[] {
  const needs = rng.pick(NEED_ORDERS);
  const sheets = [SQUARE_SHEET, LONG_SHEET, LONG_SHEET];
  const lineSets = [
    [diagonal(SQUARE_SHEET, rng.int(0, 1) === 1), rng.int(0, 1) === 1 ? across(SQUARE_SHEET) : along(SQUARE_SHEET)],
    [across(LONG_SHEET), along(LONG_SHEET)],
    [diagonal(LONG_SHEET, rng.int(0, 1) === 1), across(LONG_SHEET), along(LONG_SHEET)],
  ];
  return sheets.map((sheet, b) => {
    const lines = rng.shuffle(lineSets[b]);
    const cuts = lines.flatMap((ln) => [open('split', PAIR_PIECE[needs[b]], [ln.from, ln.to], [], sheet), open('split', PAIR_PIECE[needs[b]], [ln.from, ln.to], [], sheet, true)]);
    return { sheet, lines, need: needs[b], fits: lines.findIndex((ln) => ln.makes === needs[b]), cuts };
  });
}

/** The line a level-10 cut belongs to, and the cut from that line's other end. */
export const lineOfCut = (i: number): number => i >> 1;
export const twinOf = (i: number): number => i ^ 1;

export const judgeLine = (board: SplitBoard, line: number): boolean => line === board.fits;

/** The line for a cut that makes the wrong pair. */
export function makesLine(board: SplitBoard, line: number): (typeof MAKES)[MakesKey] {
  return MAKES[`${board.lines[line].makes}-${board.need}` as MakesKey];
}

/** The two pieces a straight edge-to-edge line cuts the sheet into (each a polygon, one either side of the line). */
export function splitSheet(sheet: Rect, line: SplitLine): [Point[], Point[]] {
  const rect: Point[] = [[sheet.x, sheet.y], [sheet.x + sheet.w, sheet.y], [sheet.x + sheet.w, sheet.y + sheet.h], [sheet.x, sheet.y + sheet.h]];
  const [a, b] = [line.from, line.to], e = 1e-9;
  const side = (p: Point) => (b[0] - a[0]) * (p[1] - a[1]) - (b[1] - a[1]) * (p[0] - a[0]);
  const clip = (sign: number): Point[] => {
    const out: Point[] = [];
    rect.forEach((p, i) => {
      const q = rect[(i + 1) % rect.length], sp = sign * side(p), sq = sign * side(q);
      if (sp >= -e) out.push(p);
      if ((sp > e && sq < -e) || (sp < -e && sq > e)) { const t = sp / (sp - sq); out.push([p[0] + t * (q[0] - p[0]), p[1] + t * (q[1] - p[1])]); }
    });
    return out;
  };
  return [clip(1), clip(-1)];
}

/* ---------------------------------------------------------------- feel */

/** The blades open and shut every 24 logical units of progress. */
export const SNIP_EVERY = 24;
/** The sticker's paper shape for a seed. */
export const STICKER_SHAPES = ['heart', 'leaf', 'cloud', 'house', 'fish', 'circle'] as const;
export const stickerShape = (seed: number) => STICKER_SHAPES[Math.floor(Math.abs(seed)) % STICKER_SHAPES.length];

/** Arc length along a path up to index i. */
export function lengthTo(points: readonly Point[], i: number): number {
  let d = 0;
  for (let k = 1; k <= i && k < points.length; k++) d += Math.hypot(points[k][0] - points[k - 1][0], points[k][1] - points[k - 1][1]);
  return d;
}
