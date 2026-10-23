import { spread } from '../../engine/view';

export interface SizePlan { count: number; order: 'big' | 'small'; mode: 'pick' | 'line'; name: string; /** Some questions ask for the middle one. */ middle?: boolean }
export const SIZE_PLANS: readonly SizePlan[] = [
  { count: 2, order: 'big', mode: 'pick', name: 'Find the bigger of two friends' },
  { count: 2, order: 'small', mode: 'pick', name: 'Find the smaller of two friends' },
  { count: 3, order: 'big', mode: 'pick', name: 'Find the biggest of three friends' },
  { count: 4, order: 'small', mode: 'pick', name: 'Find the smallest of four friends' },
  { count: 3, order: 'small', mode: 'line', name: 'Line up three friends, smallest first' },
  { count: 3, order: 'big', mode: 'line', name: 'Line up three friends, biggest first' },
  { count: 5, order: 'small', mode: 'line', name: 'Line up five friends, smallest first' },
  { count: 5, order: 'big', mode: 'line', name: 'Line up five friends, biggest first' },
];
/** Levels with high IDs, placed among the first eight by a band's `order`: 17 *Two in a line* and 10 *Big, middle, little*. */
export const TWO_IN_A_LINE: SizePlan = { count: 2, order: 'small', mode: 'line', name: 'Line up two friends, smaller first' };
export const MIDDLE_ONE: SizePlan = { count: 3, order: 'big', mode: 'pick', middle: true, name: 'Find the middle-sized friend of three' };
export const sizePlan = (level: number): SizePlan =>
  level === 17 ? TWO_IN_A_LINE : level === 10 ? MIDDLE_ONE : SIZE_PLANS[Math.max(0, Math.min(SIZE_PLANS.length - 1, level - 1))];

export type SizeAsk = 'big' | 'middle' | 'small';
/** The four questions of *Big, middle, little*: at least two ask for the middle, so it is not the only answer. */
export function middleAsks(rng: { shuffle<T>(a: T[]): T[]; pick<T>(a: readonly T[]): T }): SizeAsk[] {
  const extra = rng.pick(['big', 'small'] as const), other = rng.pick(['big', 'middle', 'small'] as const);
  return rng.shuffle<SizeAsk>(['middle', 'middle', extra, other]);
}
/** The rank (of three) an ask names. */
export const askRank = (ask: SizeAsk): number => ask === 'small' ? 0 : ask === 'middle' ? 1 : 2;

/** Ranks describe size only; shuffling position or changing the animal cannot change the answer. */
export function sizeOrder(count: number, order: 'big' | 'small'): number[] {
  const ranks = Array.from({ length: count }, (_, i) => i);
  return order === 'small' ? ranks : ranks.reverse();
}
export function sizeScale(rank: number, count: number): number { return 0.42 + 0.58 * rank / Math.max(1, count - 1); }

/**
 * What a capable child touches next: the friend whose size is the next answer (the biggest or smallest in the pick levels,
 * the next one in the line in the line-up levels), by its place among the friends on the ground. Friends already in the line
 * are not touched again, and a wrong friend never is.
 */
export function sizeTouch(order: number[], step: number, friends: { rank: number; placed: boolean }[]): number | null {
  const i = friends.findIndex((f) => f.rank === order[step] && !f.placed);
  return i < 0 ? null : i;
}

/** A friend is a `Critter` drawn at this scale times its size; a critter's body is 250 tall at scale 1 (`bodyPath`). */
export const FRIEND_SCALE = 0.59;
export const CRITTER_H = 250;
/** Every friend's tap rectangle, whatever its size: the smallest is as easy to touch as the biggest. */
export const TARGET = { w: 154, h: 190 };

/** The size word asked for: comparative between two friends (bigger, smaller), superlative among more. */
export function sizeWord(plan: { count: number; order: 'big' | 'small' }, ask?: SizeAsk): string {
  if (ask === 'middle') return 'middle-sized';
  if (ask) return ask === 'big' ? 'biggest' : 'smallest';
  if (plan.count === 2) return plan.order === 'big' ? 'bigger' : 'smaller';
  return plan.order === 'big' ? 'biggest' : 'smallest';
}

/** The chime for a friend: a pentatonic step by its place on the five-step size scale, the biggest lowest. */
export function sizeBell(rank: number, count: number): number {
  return 9 - Math.round((4 * rank) / Math.max(1, count - 1));
}

/** Where the friends stand and the line's spots sit across a view `w` wide, and how wide a friend's target may be without overlapping its neighbour. */
export function paradeLayout(friends: number, spots: number, w: number) {
  const xs = spread(friends, 165, w - 40, 175);
  const step = xs.length > 1 ? xs[1] - xs[0] : Infinity;
  return { friends: xs, targetW: Math.min(TARGET.w, step), spots: spread(spots, 130, w - 70, 165) };
}

/**
 * Which spot a dropped friend lands on: the glowing spot when the drop is within reach of it (as generous as ever), otherwise
 * the nearest other spot within half a spot's spacing, or null for a drop away from the line.
 */
export function dropSpot(x: number, y: number, spots: number[], spotY: number, glowing: number): number | null {
  if (Math.abs(y - spotY) > 95) return null;
  if (spots[glowing] !== undefined && Math.abs(x - spots[glowing]) <= 82) return glowing;
  const half = spots.length > 1 ? (spots[1] - spots[0]) / 2 : 82;
  let best: number | null = null;
  spots.forEach((s, i) => { if (Math.abs(x - s) <= half && (best === null || Math.abs(x - s) < Math.abs(x - spots[best]))) best = i; });
  return best;
}
