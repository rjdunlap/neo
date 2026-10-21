import type { ShapeKind } from '../../art/shapes';
import type { Rng } from '../../engine/random';

export interface SorterPlan {
  holes: readonly ShapeKind[];
  pieces: number;
  /** Hole rims in the shape's color (a strong hint). */
  coded: boolean;
  /** Every piece the same color, so only the shape tells them apart. */
  sameColor: boolean;
  /** Pieces arrive tilted. */
  tilt: boolean;
  /** A spoken shape clue asks the player to find one matching shape. */
  clue?: boolean;
  /** Nothing can go wrong and every touch is answered: the box giggles, the floor wiggles a piece, a far drop plops. */
  everyTouch?: boolean;
  /** A short touch on a piece hops it into its hole by itself (a drag there works too). */
  tapIn?: boolean;
}

const FOUR: ShapeKind[] = ['circle', 'square', 'triangle', 'star'];
/** The six shapes levels 7 and 8 use, named here so a shape added to `SHAPES` cannot widen their lids. */
export const CLASSIC: readonly ShapeKind[] = ['circle', 'square', 'triangle', 'star', 'heart', 'hexagon'];
export const PLANS: SorterPlan[] = [
  { holes: ['circle'], pieces: 3, coded: true, sameColor: false, tilt: false, everyTouch: true },
  { holes: ['circle', 'square'], pieces: 4, coded: true, sameColor: false, tilt: false },
  { holes: ['circle', 'square', 'triangle'], pieces: 6, coded: true, sameColor: false, tilt: false },
  { holes: FOUR, pieces: 6, coded: true, sameColor: false, tilt: false },
  { holes: FOUR, pieces: 6, coded: false, sameColor: false, tilt: false },
  { holes: [...FOUR, 'heart'], pieces: 7, coded: false, sameColor: true, tilt: false },
  { holes: CLASSIC, pieces: 8, coded: false, sameColor: true, tilt: true },
  { holes: CLASSIC, pieces: CLASSIC.length, coded: false, sameColor: true, tilt: false, clue: true },
  // 9, Tap and in it goes: the lap entry and toddler's first rung.
  { holes: ['circle'], pieces: 3, coded: true, sameColor: false, tilt: false, everyTouch: true, tapIn: true },
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

/** Every hole gets at least one piece; the rest are random holes. Shuffled. */
export function pieceKinds(rng: Rng, plan: SorterPlan): ShapeKind[] {
  const kinds = [...plan.holes];
  while (kinds.length < plan.pieces) kinds.push(rng.pick(plan.holes));
  return rng.shuffle(kinds);
}

/** One spoken clue for each shape, in a seeded order. */
export const clueKinds = (rng: Rng, plan: SorterPlan): ShapeKind[] => rng.shuffle([...plan.holes]);

/** The lid's holes in rows of up to four (three when there are more), relative to the lid's top middle. */
export function holeLayout(plan: SorterPlan) {
  const n = plan.holes.length;
  const perRow = n <= 4 ? n : 3;
  const rows = Math.ceil(n / perRow);
  const holes = plan.holes.map((kind, i) => {
    const row = Math.floor(i / perRow);
    const inRow = Math.min(perRow, n - row * perRow);
    const col = i % perRow;
    return { kind, x: (col - (inRow - 1) / 2) * HOLE_GAP_X, y: 24 + row * HOLE_GAP_Y + 56 };
  });
  return { holes, w: Math.max(300, perRow * HOLE_GAP_X + 40), lidH: rows * HOLE_GAP_Y + 24 };
}

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
 * shape. Every piece has one (`pieceKinds` only makes kinds the plan has holes for).
 */
export const holeFor = <H extends { kind: ShapeKind }>(holes: readonly H[], kind: ShapeKind): H | undefined => holes.find((h) => h.kind === kind);

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
