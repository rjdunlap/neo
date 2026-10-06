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
];
export function bugPuzzle(plan: BugPlan, rng: Rng): { model: BugSpot[]; targets: BugSpot[] } {
  const palette = rng.shuffle(Array.from({ length: plan.colors }, (_, i) => i));
  const spots: BugSpot[] = [];
  for (let row = 0; row < plan.rows; row++) for (let col = 0; col < plan.columns; col++) {
    const x = plan.columns === 1 ? 94 : 72 + col * 116;
    const y = (row - (plan.rows - 1) / 2) * 116;
    spots.push({ x: -x, y, token: palette[spots.length % palette.length] });
    if (plan.mode !== 'mirror') spots.push({ x, y, token: palette[spots.length % palette.length] });
  }
  return { model: spots, targets: spots.map((s) => ({ ...s, x: plan.mode === 'mirror' ? -s.x : s.x })) };
}
