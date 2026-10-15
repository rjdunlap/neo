import type { ColorName } from '../../art/palette';
import type { ShapeKind } from '../../art/shapes';
import type { Rng } from '../../engine/random';

export const BUG_PLANS = [
  { mode: 'guided', rows: 1, columns: 1, colors: 2, name: 'Decorate two spots with matching colors' },
  { mode: 'guided', rows: 2, columns: 1, colors: 3, name: 'Match four colored shape outlines' },
  { mode: 'copy', rows: 2, columns: 1, colors: 3, name: 'Copy four spots from a model bug' },
  { mode: 'copy', rows: 3, columns: 1, colors: 4, name: 'Copy six spots from a model bug' },
  { mode: 'mirror', rows: 2, columns: 1, colors: 3, name: 'Mirror two spots onto the other wing' },
  { mode: 'mirror', rows: 3, columns: 1, colors: 4, name: 'Mirror three spots onto the other wing' },
  { mode: 'mirror', rows: 3, columns: 2, colors: 6, name: 'Mirror six spots, matching both shape and color' },
] as const;
export type BugPlan = (typeof BUG_PLANS)[number];
export interface BugToken { shape: ShapeKind; color: ColorName }
export interface BugSpot { x: number; y: number; token: number }
export const BUG_TOKENS: BugToken[] = [
  { shape: 'circle', color: 'blue' }, { shape: 'triangle', color: 'yellow' },
  { shape: 'square', color: 'pink' }, { shape: 'heart', color: 'purple' },
  { shape: 'circle', color: 'pink' }, { shape: 'square', color: 'blue' },
  { shape: 'star', color: 'red' }, { shape: 'hexagon', color: 'green' },
  { shape: 'triangle', color: 'blue' }, { shape: 'heart', color: 'pink' },
  { shape: 'circle', color: 'green' }, { shape: 'square', color: 'yellow' },
];

/**
 * The tokens a plan puts in the tray, drawn from the pool by seed. They are always different tokens; a plan of four or
 * fewer also keeps every shape and every color apart, so "the red star" is never one of two look-alikes. A bigger plan
 * may repeat a shape or a color, because telling those apart is part of it.
 */
export function pickTokens(plan: BugPlan, rng: Rng): number[] {
  let picked: number[] = [];
  // A greedy pass can dead-end on a small plan; the pool has plenty of ways through, so draw again.
  for (let attempt = 0; attempt < 50 && picked.length < plan.colors; attempt++) {
    picked = [];
    for (const i of rng.shuffle(BUG_TOKENS.map((_, k) => k))) {
      if (picked.length === plan.colors) break;
      const t = BUG_TOKENS[i];
      if (plan.colors <= 4 && picked.some((k) => BUG_TOKENS[k].shape === t.shape || BUG_TOKENS[k].color === t.color)) continue;
      picked.push(i);
    }
  }
  return picked;
}

export function bugPuzzle(plan: BugPlan, rng: Rng): { model: BugSpot[]; targets: BugSpot[]; tokens: number[] } {
  const palette = pickTokens(plan, rng);
  const spots: BugSpot[] = [];
  for (let row = 0; row < plan.rows; row++) for (let col = 0; col < plan.columns; col++) {
    const x = plan.columns === 1 ? 94 : 72 + col * 116;
    const y = (row - (plan.rows - 1) / 2) * 116;
    spots.push({ x: -x, y, token: palette[spots.length % palette.length] });
    if (plan.mode !== 'mirror') spots.push({ x, y, token: palette[spots.length % palette.length] });
  }
  return { model: spots, targets: spots.map((s) => ({ ...s, x: plan.mode === 'mirror' ? -s.x : s.x })), tokens: palette };
}

/** How near to a spot's middle a stamp can be let go to land in it: a little more than the outline, and clear of the neighbouring spots (116 apart). */
export const SLOT_REACH = 57;

/** The empty spot a stamp let go at (x, y) lands in, in the board's own units, if any. */
export function slotAt<S extends BugSpot & { filled: boolean }>(spots: readonly S[], x: number, y: number): S | undefined {
  return spots.find((s) => !s.filled && Math.hypot(x - s.x, y - s.y) < SLOT_REACH);
}

/**
 * What a capable child does next: stamp the first empty spot with the token it needs (the faint ghost, the model bug
 * or the mirrored wing shows which). The ghost finger follows this, so a test can check that every stamp lands.
 */
export function nextStamp<S extends BugSpot & { filled: boolean }>(spots: readonly S[]): S | undefined {
  return spots.find((s) => !s.filled);
}
