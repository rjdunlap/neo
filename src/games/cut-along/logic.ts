import type { Rng } from '../../engine/random';
import type { BandLevels } from '../../progress/difficulty';
import { advanceTrace, sampleStroke, type Point } from '../letter-trails/strokes';
import { showTheWay } from '../letter-trails/logic';

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

export type Mode = 'snip' | 'cut' | 'fits';

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
  { mode: 'cut', name: 'Corners: a square and a triangle', count: 3 },
  { mode: 'cut', name: 'Picture shapes: heart, house, leaf, fish or cloud', count: 3 },
  { mode: 'fits', name: 'The piece that fits: choose the outline for the gap, then cut it', count: 3 },
];

export const LEVELS: BandLevels = {
  toddler: { min: 1, max: 2 },
  preschool: { min: 2, max: 5 },
  prek: { min: 4, max: 7 },
  school: { min: 6, max: 8 },
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
  | 'grass' | 'tail' | 'plank' | 'mountain' | 'sea' | 'hill' | 'path' | 'sun' | 'window' | 'sail' | 'flag'
  | 'heart' | 'house' | 'leaf' | 'fish' | 'cloud' | 'roof';

export type CutKind =
  | 'ribbon' | 'level' | 'slant' | 'zigzag' | 'wave' | 'hill' | 'scurve'
  | 'circle' | 'square' | 'triangle' | 'heart' | 'house' | 'leaf' | 'fish' | 'cloud' | 'roof-arch';

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
  /** A closed shape's outline, for drawing the piece that drops out. */
  outline?: Point[];
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
export const OUTLINES: Record<'circle' | 'square' | 'triangle' | 'heart' | 'house' | 'leaf' | 'fish' | 'cloud' | 'arch', { loop: Point[]; corners: number[] }> = {
  circle: { loop: curve((u) => [Math.sin(u * 2 * Math.PI), Math.cos(u * 2 * Math.PI)], 72).slice(0, -1), corners: [] },
  square: { loop: [[0, 1], [1, 1], [1, -1], [-1, -1], [-1, 1]], corners: [1, 2, 3, 4] },
  triangle: { loop: [[0, 0.8], [1, 0.8], [0, -1], [-1, 0.8]], corners: [1, 2, 3] },
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
export function shapeCut(kind: keyof typeof OUTLINES, piece: PieceId, cx: number, cy: number, r: number, cutKind?: CutKind): Cut {
  const o = OUTLINES[kind];
  const loop = place(o.loop, cx, cy, r);
  return closed(cutKind ?? (kind === 'arch' ? 'roof-arch' : kind), piece, loop, [loop[0][0], 1], o.corners.map((i) => loop[i]));
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
      const third = flip();
      return [
        shapeCut('square', 'window', mid, 0.42, 0.31),
        shapeCut('triangle', 'sail', mid, 0.4, 0.35),
        third ? shapeCut('square', 'window', mid, 0.42, 0.31) : shapeCut('triangle', 'flag', mid, 0.4, 0.35),
      ];
    }
    default: {
      const kinds = rng.shuffle<'heart' | 'house' | 'leaf' | 'fish' | 'cloud'>(['heart', 'house', 'leaf', 'fish', 'cloud']).slice(0, 3);
      return kinds.map((k) => shapeCut(k, k, mid, 0.42, k === 'cloud' ? 0.42 : 0.34));
    }
  }
}

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
