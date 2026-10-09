import { SHAPES, type ShapeKind } from '../../art/shapes';
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
}

const FOUR: ShapeKind[] = ['circle', 'square', 'triangle', 'star'];
export const PLANS: SorterPlan[] = [
  { holes: ['circle'], pieces: 3, coded: true, sameColor: false, tilt: false },
  { holes: ['circle', 'square'], pieces: 4, coded: true, sameColor: false, tilt: false },
  { holes: ['circle', 'square', 'triangle'], pieces: 6, coded: true, sameColor: false, tilt: false },
  { holes: FOUR, pieces: 6, coded: true, sameColor: false, tilt: false },
  { holes: FOUR, pieces: 6, coded: false, sameColor: false, tilt: false },
  { holes: [...FOUR, 'heart'], pieces: 7, coded: false, sameColor: true, tilt: false },
  { holes: SHAPES, pieces: 8, coded: false, sameColor: true, tilt: true },
];

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
