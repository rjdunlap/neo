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

/** How near a plate's middle a piece must be let go to land on it. */
export const PLATE_REACH = 88;
/** The plate a piece let go at (x, y) lands on: the nearest one within reach, or -1 (it goes back to the tray). */
export function plateAt(plates: readonly { x: number; y: number }[], x: number, y: number): number {
  let nearest = -1, distance = PLATE_REACH;
  plates.forEach((p, i) => { const d = Math.hypot(x - p.x, y - p.y); if (d < distance) { distance = d; nearest = i; } });
  return nearest;
}
/**
 * The cut a capable child makes: of the cuts that share out evenly, the one with the fewest pieces (halves for two
 * sandwiches and four friends; quarters only when one sandwich has to reach four). A cut that leaves a friend short
 * is a miss when she serves it, so the ghost finger never makes one.
 */
export function fairCut(plan: { wholes: number; friends: number; cuts: readonly number[] }): number | undefined {
  return [...plan.cuts].sort((a, b) => a - b).find((c) => (plan.wholes * c) % plan.friends === 0);
}
