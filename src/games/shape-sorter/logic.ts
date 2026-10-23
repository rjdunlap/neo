import { MORE_SHAPES, SHAPES, type ShapeKind } from '../../art/shapes';
import type { Rng } from '../../engine/random';

/** Little, middle, big. */
export type Size = 0 | 1 | 2;
/** How a sized hole and piece are drawn against `HOLE_R` and the piece's radius. */
export const SIZE_SCALE = [0.72, 1, 1.32] as const;

/** Hole kinds drawn per seed: `holes` are always in, the rest come from `pool`, never two kinds from one `apart` pair. */
export interface HoleDeal {
  pool: readonly ShapeKind[];
  count: number;
  /** At least this many all-curve kinds and straight-sided kinds. */
  curves?: number;
  straights?: number;
}

export interface SorterPlan {
  /** The holes, or with `deal` the kinds always in. */
  holes: readonly ShapeKind[];
  deal?: HoleDeal;
  pieces: number;
  /** Hole rims in the shape's color (a strong hint). */
  coded: boolean;
  /** Every piece the same color, so only the shape tells them apart. */
  sameColor: boolean;
  /** Pieces arrive tilted. */
  tilt: boolean;
  /** Tap to turn in 30° notches; upright holes require a symmetric fit. */
  turning?: boolean;
  /** A spoken shape clue asks the player to find one matching shape. */
  clue?: boolean;
  /** Nothing can go wrong and every touch is answered: the box giggles, the floor wiggles a piece, a far drop plops. */
  everyTouch?: boolean;
  /** A short touch on a piece hops it into its hole by itself (a drag there works too). */
  tapIn?: boolean;
  /** Pieces come a little bigger or smaller (0.85–1.15); any size of a kind fits its hole. */
  sizes?: boolean;
  /** One kind in three sizes, holes and pieces alike: the size is what to match. */
  sized?: boolean;
  /** The box says a property of a shape it swallows, now and then. */
  facts?: boolean;
  /** Several kinds share a target, by curve/corner class or corner count. */
  attribute?: 'curves' | 'count';
}

/** Every shape the sorter knows: the classic six and the later five. */
export const POOL: readonly ShapeKind[] = [...SHAPES, ...MORE_SHAPES];
/** Kinds with no straight side. */
export const CURVES: readonly ShapeKind[] = ['circle', 'oval', 'heart'];
/** Never on one lid: a turned square is a diamond. */
const APART: [ShapeKind, ShapeKind][] = [['square', 'diamond']];
/** Never on one lid at the clue level either, where a clue must name exactly one dealt shape. */
const CLUE_APART: [ShapeKind, ShapeKind][] = [
  ['circle', 'oval'],
  ['star', 'pentagon'],
  ['diamond', 'trapezoid'],
];
/** The kinds level 11 draws in three sizes. */
export const SIZE_POOL: readonly ShapeKind[] = ['circle', 'square', 'triangle', 'star', 'heart', 'hexagon', 'oval', 'pentagon'];

/** Heart mixes curves and corners; star has ten corners, so neither belongs in the counting pool. */
export const CORNERS: Record<ShapeKind, number> = { circle: 0, oval: 0, triangle: 3, square: 4, rectangle: 4, diamond: 4, trapezoid: 4, pentagon: 5, hexagon: 6, star: 10, heart: 1 };
export const ATTRIBUTE_POOL = POOL.filter((k) => k !== 'heart');
export const COUNT_POOL = ATTRIBUTE_POOL.filter((k) => k !== 'star');
export const FOUR_CORNERS = COUNT_POOL.filter((k) => CORNERS[k] === 4);
export const cornerClass = (kind: ShapeKind) => CORNERS[kind] === 0 ? 'curves' : 'corners';

const FOUR: ShapeKind[] = ['circle', 'square', 'triangle', 'star'];
/** Levels 7 and 8: six from the pool, a curve and straight sides among them; the count is pinned, so the pool can grow without widening a lid. */
const MIXED: HoleDeal = { pool: POOL, count: 6, curves: 1, straights: 2 };
export const PLANS: SorterPlan[] = [
  { holes: ['circle'], pieces: 3, coded: true, sameColor: false, tilt: false, everyTouch: true },
  { holes: ['circle', 'square'], pieces: 4, coded: true, sameColor: false, tilt: false },
  { holes: ['circle', 'square', 'triangle'], pieces: 6, coded: true, sameColor: false, tilt: false },
  { holes: FOUR, pieces: 6, coded: true, sameColor: false, tilt: false },
  { holes: FOUR, pieces: 6, coded: false, sameColor: false, tilt: false, facts: true },
  { holes: ['circle', 'square'], deal: { pool: POOL, count: 5 }, pieces: 7, coded: false, sameColor: true, tilt: false, sizes: true, facts: true },
  { holes: [], deal: MIXED, pieces: 8, coded: false, sameColor: true, tilt: true, sizes: true, facts: true },
  { holes: [], deal: MIXED, pieces: 6, coded: false, sameColor: true, tilt: false, clue: true },
  // 9, Tap and in it goes: the lap entry and toddler's first rung.
  { holes: ['circle'], pieces: 3, coded: true, sameColor: false, tilt: false, everyTouch: true, tapIn: true },
  // 10, Round or square: two holes by outline alone, between toddler's colour-coded two and three.
  { holes: ['circle', 'square'], pieces: 4, coded: false, sameColor: false, tilt: false },
  // 11, Big, middle, little: one kind in three sizes.
  { holes: [], pieces: 3, coded: false, sameColor: false, tilt: false, sized: true },
  // 12, Turn it to fit: three or four corner shapes, sometimes a circle for contrast.
  { holes: ['square', 'triangle', 'hexagon', 'star'], pieces: 4, coded: false, sameColor: true, tilt: false, turning: true },
  // 13–14 keep the drag, but several shape kinds share one target.
  { holes: [], pieces: 6, coded: false, sameColor: true, tilt: false, attribute: 'curves' },
  { holes: [], pieces: 7, coded: false, sameColor: true, tilt: false, attribute: 'count' },
];

/** A touch let go sooner than this (in seconds) is a tap. The ghost finger presses for 0.22 s. */
export const TAP_HOLD = 0.4;

/**
 * How far (in logical units) a tapped piece may have left its place on the floor: a still finger jumps it by up to its
 * radius plus the 40-unit lift once it moves at all, so a wobble stays a tap while a fling is a drag.
 */
export const TAP_REACH = 120;

/** A piece let go away from every hole: at a tap-in level, a quick touch that barely moved it is a tap, and the piece hops in. */
export const tapsIn = (plan: SorterPlan, heldFor: number, moved: number) => !!plan.tapIn && heldFor < TAP_HOLD && moved < TAP_REACH;

export const planFor = (level: number) => PLANS[Math.min(PLANS.length, Math.max(1, level)) - 1];

export const HOLE_R = 54;
/** How close (in logical units) a dropped piece must be to a hole's middle. */
export const SNAP = 100;
const HOLE_GAP_X = 150;
const HOLE_GAP_Y = 136;

export interface HoleSpec {
  kind: ShapeKind;
  /** Set only at the sized level: the hole takes only a piece of this size. */
  size?: Size;
  attribute?: 'curves' | 'corners' | number;
}

export interface PieceSpec {
  kind: ShapeKind;
  size?: Size;
  /** How big it is drawn, against the usual piece. */
  scale: number;
}

const clash = (pairs: [ShapeKind, ShapeKind][], kinds: readonly ShapeKind[], k: ShapeKind) =>
  pairs.some(([a, b]) => (k === a && kinds.includes(b)) || (k === b && kinds.includes(a)));

/** The lid's holes for one round: fixed for most levels, drawn from the pool at 6–8, one kind in three sizes at 11. */
export function dealHoles(rng: Rng, plan: SorterPlan): HoleSpec[] {
  if (plan.attribute === 'curves') return [{ kind: 'circle', attribute: 'curves' }, { kind: 'triangle', attribute: 'corners' }];
  if (plan.attribute === 'count') return (['circle', 'triangle', 'square', 'pentagon', 'hexagon'] as ShapeKind[]).map((kind) => ({ kind, attribute: CORNERS[kind] }));
  if (plan.turning) {
    const kinds = [...plan.holes];
    if (rng.chance(0.5)) kinds[rng.int(0, kinds.length - 1)] = 'circle';
    return kinds.map((kind) => ({ kind }));
  }
  if (plan.sized) {
    const kind = rng.pick(SIZE_POOL);
    return rng.shuffle([0, 1, 2] as Size[]).map((size) => ({ kind, size }));
  }
  const deal = plan.deal;
  if (!deal) return plan.holes.map((kind) => ({ kind }));
  const apart = plan.clue ? [...APART, ...CLUE_APART] : APART;
  for (;;) {
    const kinds = [...plan.holes];
    for (const k of rng.shuffle([...deal.pool])) {
      if (kinds.length >= deal.count) break;
      if (!kinds.includes(k) && !clash(apart, kinds, k)) kinds.push(k);
    }
    const curves = kinds.filter((k) => CURVES.includes(k)).length;
    if (kinds.length === deal.count && curves >= (deal.curves ?? 0) && kinds.length - curves >= (deal.straights ?? 0)) {
      return kinds.map((kind) => ({ kind }));
    }
  }
}

/** Every hole gets at least one piece; the rest are random holes. Shuffled. At 6–7 sizes vary, and a kind dealt twice comes once small and once big. */
export function pieceKinds(rng: Rng, plan: SorterPlan, holes: readonly HoleSpec[] = dealHoles(rng, plan)): PieceSpec[] {
  if (plan.attribute) {
    const kinds: ShapeKind[] = plan.attribute === 'curves'
      ? [rng.pick(['circle', 'oval'] as const), rng.pick(ATTRIBUTE_POOL.filter((k) => CORNERS[k] > 0))]
      : [rng.pick(['circle', 'oval'] as const), 'triangle', ...rng.shuffle([...FOUR_CORNERS]).slice(0, 2), 'pentagon', 'hexagon'];
    const pool = plan.attribute === 'curves' ? ATTRIBUTE_POOL : COUNT_POOL;
    while (kinds.length < plan.pieces) kinds.push(rng.pick(pool));
    return rng.shuffle(kinds.map((kind) => ({ kind, scale: 1 })));
  }
  if (plan.sized) return rng.shuffle(holes.map(({ kind, size }) => ({ kind, size, scale: SIZE_SCALE[size!] })));
  const kinds = holes.map((h) => h.kind);
  while (kinds.length < plan.pieces) kinds.push(rng.pick(holes).kind);
  const big = new Map<ShapeKind, boolean>();
  const pieces = kinds.map((kind) => {
    if (!plan.sizes) return { kind, scale: 1 };
    const next = big.has(kind) ? !big.get(kind) : rng.chance(0.5);
    big.set(kind, next);
    return { kind, scale: next ? rng.range(1.07, 1.15) : rng.range(0.85, 0.93) };
  });
  return rng.shuffle(pieces);
}

/** One spoken clue for each shape, in a seeded order. */
export const clueKinds = (rng: Rng, holes: readonly HoleSpec[]): ShapeKind[] => rng.shuffle(holes.map((h) => h.kind));

/** The target asks for an attribute, or the piece's own kind (and size at 11). */
export const fits = (hole: HoleSpec, piece: { kind: ShapeKind; size?: Size }) =>
  hole.attribute !== undefined
    ? typeof hole.attribute === 'number' ? CORNERS[piece.kind] === hole.attribute : cornerClass(piece.kind) === hole.attribute
    : hole.kind === piece.kind && (hole.size === undefined || hole.size === piece.size);

/** At the sized level, a piece on a hole of its kind but the wrong size: too big or too little. */
export const sizeMiss = (hole: HoleSpec, piece: { kind: ShapeKind; size?: Size }): 'big' | 'little' | null =>
  hole.size === undefined || piece.size === undefined || hole.kind !== piece.kind || hole.size === piece.size
    ? null
    : piece.size > hole.size
      ? 'big'
      : 'little';

/** A hole's drawn radius: sized holes by their size, and a little roomier where pieces vary in size. */
export const holeRadius = (plan: SorterPlan, hole: HoleSpec) =>
  plan.attribute === 'curves' ? 72 : hole.size !== undefined ? HOLE_R * SIZE_SCALE[hole.size] : plan.sizes ? HOLE_R * 1.1 : HOLE_R;

/** The lid's holes in rows of up to four (three when there are more), relative to the lid's top middle, spaced for the largest. */
export function holeLayout(plan: SorterPlan, specs: readonly HoleSpec[]) {
  const n = specs.length;
  const perRow = n <= 4 ? n : 3;
  const rows = Math.ceil(n / perRow);
  const maxR = Math.max(...specs.map((h) => holeRadius(plan, h)));
  const gapX = Math.max(HOLE_GAP_X, 2 * maxR + 40);
  const gapY = Math.max(HOLE_GAP_Y, 2 * maxR + 28);
  const top = 24 + Math.max(56, maxR + 2);
  const holes = specs.map((spec, i) => {
    const row = Math.floor(i / perRow);
    const inRow = Math.min(perRow, n - row * perRow);
    const col = i % perRow;
    return { ...spec, r: holeRadius(plan, spec), x: (col - (inRow - 1) / 2) * gapX, y: top + row * gapY };
  });
  return { holes, w: Math.max(300, perRow * gapX + 40), lidH: top + (rows - 1) * gapY + maxR + 26 };
}

/** One in three swallows (the second, fifth, eighth…) earns a spoken fact, where the plan has them. */
export const factDue = (plan: SorterPlan, placed: number) => !!plan.facts && placed % 3 === 2;

/** The box's front hangs this far below the lid's bottom edge (the lid overlaps the front by 10). */
export const BOX_FRONT = 110;
/** The floor starts this far down the view. */
export const FLOOR_AT = 0.66;

/** Where the box's lid starts: standing on the floor, but never higher than 40 units from the top. */
export const boxTopFor = (viewH: number, lidH: number) => Math.max(40, viewH * FLOOR_AT - lidH - BOX_FRONT);

/** The hole a piece was dropped on: the nearest one within reach, or none. */
export function holeAt<H extends { x: number; y: number }>(holes: readonly H[], x: number, y: number): H | undefined {
  let best: H | undefined;
  let bestD = SNAP;
  for (const h of holes) {
    const d = Math.hypot(h.x - x, h.y - y);
    if (d < bestD) [best, bestD] = [h, d];
  }
  return best;
}

/**
 * The hole a capable player takes a piece to, for the how-to card's ghost finger: the one with the piece's own
 * shape, size or attribute. Every piece has one (`pieceKinds` only makes pieces the dealt holes take).
 */
export const holeFor = <H extends HoleSpec>(holes: readonly H[], piece: { kind: ShapeKind; size?: Size }): H | undefined =>
  holes.find((h) => fits(h, piece));

/** The waiting thing nearest a touch, for a tap on the floor at level 1 to wiggle and name. */
export function nearest<T extends { x: number; y: number }>(items: readonly T[], x: number, y: number): T | undefined {
  let best: T | undefined;
  let bestD = Infinity;
  for (const it of items) {
    const d = Math.hypot(it.x - x, it.y - y);
    if (d < bestD) [best, bestD] = [it, d];
  }
  return best;
}

/** Misses since the last glow; a piece going in does not reset it, so a child who misses with a different piece each time still gets help. */
export interface SorterHelp {
  misses: number;
  hints: number;
  sinceGlow: number;
}

export const startHelp = (): SorterHelp => ({ misses: 0, hints: 0, sinceGlow: 0 });

/** A wrong drop: one miss, and every second one since the last glow lights the right hole (one hint). True when it glows. */
export function wrongDrop(h: SorterHelp): boolean {
  h.misses++;
  h.sinceGlow++;
  if (h.sinceGlow < 2) return false;
  h.sinceGlow = 0;
  h.hints++;
  return true;
}

/** Rotational periods in degrees; zero means every angle fits (a circle). */
export const TURN_PERIOD = { square: 90, triangle: 120, hexagon: 60, star: 72, circle: 0 } as const;
export type TurnKind = keyof typeof TURN_PERIOD;
export const TURN_NOTCH = Math.PI / 6;
export const TURN_TOLERANCE = Math.PI / 12;

/** Signed distance to the nearest symmetric fit, in radians. Handles wrapped and negative angles. */
export function turnOffset(kind: TurnKind, angle: number): number {
  const period = TURN_PERIOD[kind] * Math.PI / 180;
  if (!period) return 0;
  return ((angle + period / 2) % period + period) % period - period / 2;
}
export const turnFits = (kind: TurnKind, angle: number) => Math.abs(turnOffset(kind, angle)) <= TURN_TOLERANCE + 1e-9;
export const turnNext = (angle: number) => (angle + TURN_NOTCH) % (Math.PI * 2);
/** Start every corner shape out of fit, on the same notch grid the child can reach. */
export function turnStart(rng: Rng, kind: TurnKind): number {
  const notches = Array.from({ length: 12 }, (_, n) => n * TURN_NOTCH);
  return rng.pick(kind === 'circle' ? notches : notches.filter((a) => !turnFits(kind, a)));
}

/** One orientation miss; a second on this piece self-aligns it. A simultaneous glow is the same hint, never charged twice. */
export function wrongTurn(help: SorterHelp, piece: { turnMisses: number }): { glow: boolean; align: boolean } {
  const glow = wrongDrop(help);
  const align = ++piece.turnMisses >= 2;
  if (align && !glow) {
    help.hints++;
    help.sinceGlow = 0;
  }
  return { glow: glow || align, align };
}
