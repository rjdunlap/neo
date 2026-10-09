import type { Rng } from '../../engine/random';
export const PLANS = [
  { mode: 'share', wholes: 1, friends: 2, cuts: [2], name: 'Cut one sandwich in halves and share with two friends' },
  { mode: 'share', wholes: 1, friends: 4, cuts: [2,4], name: 'Find equal quarters for four friends' },
  { mode: 'share', wholes: 2, friends: 2, cuts: [2], name: 'Two sandwiches: two halves for each friend' },
  { mode: 'share', wholes: 2, friends: 4, cuts: [2,4], name: 'Share two sandwiches fairly; halves or quarters both work' },
  { mode: 'recipe', wholes: 0, friends: 0, cuts: [], name: 'Double a picture recipe: one berry and one apple become two each' },
  { mode: 'recipe', wholes: 0, friends: 0, cuts: [], name: 'Double two berries and one apple for a bigger fruit salad' },
] as const;
export const planFor = (l: number) => PLANS[Math.max(0,Math.min(PLANS.length-1,l-1))];
export const fair = (plates: number[], pieces: number) => pieces > 0 && plates.length > 0 && plates.every(n => n > 0 && n === pieces / plates.length);
export function nextPlate(plates: number[]) { return plates.indexOf(Math.min(...plates)); }
export function recipe(level: number, rng: Rng): [number,number] {
  return level <= 5 ? [1,1] : rng.chance(0.5) ? [2,1] : [1,2];
}
export const doubled = (base: number[], made: number[]) => base.length === made.length && base.every((n,i) => made[i] === n*2);
export const ingredientHint = (base: number[], made: number[]) => made.findIndex((n,i) => n !== base[i]*2);

export type KitchenTouch =
  | { kind: 'cut'; parts: number }
  | { kind: 'piece'; piece: number; plate: number }
  | { kind: 'ingredient'; ingredient: number }
  | { kind: 'undo' }
  | { kind: 'serve' };

/**
 * The next real control a capable child uses: choose a cut that can be shared equally, fill the least-full plate,
 * or add exactly what the doubled recipe still needs. `assignments` holds each cut piece's plate, or -1 in the tray.
 */
export function kitchenTouch(
  plan: { mode: string; wholes: number; friends: number; cuts: readonly number[] },
  split: number,
  assignments: readonly number[],
  base: readonly number[],
  made: readonly number[],
): KitchenTouch | null {
  if (plan.mode === 'share') {
    if (!split) {
      const parts = plan.cuts.find((cut) => (plan.wholes * cut) % plan.friends === 0);
      return parts === undefined ? null : { kind: 'cut', parts };
    }
    const piece = assignments.indexOf(-1);
    const counts = Array.from({ length: plan.friends }, (_, plate) => assignments.filter((p) => p === plate).length);
    if (piece >= 0) return { kind: 'piece', piece, plate: nextPlate(counts) };
    return fair(counts, assignments.length) ? { kind: 'serve' } : null;
  }
  const extra = made.findIndex((n, i) => n > (base[i] ?? 0) * 2);
  if (extra >= 0) return { kind: 'undo' };
  const ingredient = made.findIndex((n, i) => n < (base[i] ?? 0) * 2);
  return ingredient >= 0 ? { kind: 'ingredient', ingredient } : doubled([...base], [...made]) ? { kind: 'serve' } : null;
}
