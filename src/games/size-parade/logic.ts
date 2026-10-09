export const SIZE_PLANS = [
  { count: 2, order: 'big', mode: 'pick', name: 'Find the bigger of two friends' },
  { count: 2, order: 'small', mode: 'pick', name: 'Find the smaller of two friends' },
  { count: 3, order: 'big', mode: 'pick', name: 'Find the biggest of three friends' },
  { count: 4, order: 'small', mode: 'pick', name: 'Find the smallest of four friends' },
  { count: 3, order: 'small', mode: 'line', name: 'Line up three friends, smallest first' },
  { count: 3, order: 'big', mode: 'line', name: 'Line up three friends, biggest first' },
  { count: 5, order: 'small', mode: 'line', name: 'Line up five friends, smallest first' },
  { count: 5, order: 'big', mode: 'line', name: 'Line up five friends, biggest first' },
] as const;
export type SizePlan = (typeof SIZE_PLANS)[number];

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
