import { spread } from '../../engine/view';

export interface SizePlan {
  count: number; order: 'big' | 'small'; mode: 'pick' | 'line' | 'cycle'; name: string;
  /** Some questions ask for the middle one. */
  middle?: boolean;
  /** *Big one, little one*: the big one, then the little one, then the big one again, in plain words. */
  bigLittle?: boolean;
}
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
/**
 * Levels with high IDs, placed among the first eight by a band's `order`: 17 *Two in a line*, 10 *Big, middle, little*,
 * 9 *Big one, little one* (lap second, toddler first) and 16 *Big duck, little duck* (lap first).
 */
export const TWO_IN_A_LINE: SizePlan = { count: 2, order: 'small', mode: 'line', name: 'Line up two friends, smaller first' };
export const MIDDLE_ONE: SizePlan = { count: 3, order: 'big', mode: 'pick', middle: true, name: 'Find the middle-sized friend of three' };
export const BIG_LITTLE: SizePlan = { count: 2, order: 'big', mode: 'pick', bigLittle: true, name: 'Tap the big one, then the little one' };
export const SIZE_CYCLE: SizePlan = { count: 1, order: 'big', mode: 'cycle', name: 'Tap one friend to make it bigger, then smaller' };
export const sizePlan = (level: number): SizePlan =>
  level === 17 ? TWO_IN_A_LINE : level === 10 ? MIDDLE_ONE : level === 9 ? BIG_LITTLE : level === 16 ? SIZE_CYCLE
    : SIZE_PLANS[Math.max(0, Math.min(SIZE_PLANS.length - 1, level - 1))];
/** How many questions a pick level asks: three at *Big one, little one*, otherwise four. */
export const pickRounds = (plan: SizePlan): number => plan.bigLittle ? 3 : 4;

export type SizeAsk = 'big' | 'middle' | 'small';
/** The four questions of *Big, middle, little*: at least two ask for the middle, so it is not the only answer. */
export function middleAsks(rng: { shuffle<T>(a: T[]): T[]; pick<T>(a: readonly T[]): T }): SizeAsk[] {
  const extra = rng.pick(['big', 'small'] as const), other = rng.pick(['big', 'middle', 'small'] as const);
  return rng.shuffle<SizeAsk>(['middle', 'middle', extra, other]);
}
/** The three asks of *Big one, little one*: big and little alternate, the big one first. */
export const BIG_LITTLE_ASKS: readonly SizeAsk[] = ['big', 'small', 'big'];
/** The rank an ask names among `count` friends (the middle one is always of three). */
export const askRank = (ask: SizeAsk, count = 3): number => ask === 'small' ? 0 : ask === 'middle' ? 1 : count - 1;

/** Ranks describe size only; shuffling position or changing the animal cannot change the answer. */
export function sizeOrder(count: number, order: 'big' | 'small'): number[] {
  const ranks = Array.from({ length: count }, (_, i) => i);
  return order === 'small' ? ranks : ranks.reverse();
}
/** The five-step size scale every friend is drawn from: step 0 is the littlest, step 4 the biggest (2.4 times it). */
export const STEPS = 5;
export const stepScale = (step: number): number => 0.42 + 0.58 * step / (STEPS - 1);
/** `count` friends spread evenly over the scale: the ends are always dealt, so two friends differ 2.4 times. */
export const evenSteps = (count: number): number[] => Array.from({ length: count }, (_, rank) => Math.round((STEPS - 1) * rank / Math.max(1, count - 1)));
export function sizeScale(rank: number, count: number): number { return stepScale(evenSteps(count)[rank]); }
/** The asked friend is at least this much bigger or smaller than its neighbour in a dealt row, so a varied row is never a near call. */
export const MIN_RATIO = 1.3;
/** Every way to choose `count` of the five steps, littlest first. */
function combos(count: number, from = 0): number[][] {
  if (count === 0) return [[]];
  const out: number[][] = [];
  for (let s = from; s <= STEPS - count; s++) for (const rest of combos(count - 1, s + 1)) out.push([s, ...rest]);
  return out;
}
/**
 * The steps dealt to a row's ranks, littlest first. The line levels and a pick level's first row use the even spread, so the
 * first right answer needs no adult; later pick rows draw from the scale (two friends at least two steps apart; three or four
 * friends any distinct steps that keep the asked rank at least `MIN_RATIO` from each neighbour), so the picture changes while
 * the question stays the same.
 */
export function dealSteps(rng: { int(min: number, max: number): number; pick<T>(a: readonly T[]): T }, plan: SizePlan, row: number, asked = plan.order === 'small' ? 0 : plan.count - 1): number[] {
  if (plan.mode !== 'pick' || row === 0 || plan.bigLittle) return evenSteps(plan.count);
  if (plan.count === 2) { const lo = rng.int(0, STEPS - 3); return [lo, rng.int(lo + 2, STEPS - 1)]; }
  const fair = combos(plan.count).filter((steps) => [asked - 1, asked + 1].every((n) => steps[n] === undefined || Math.max(stepScale(steps[n]), stepScale(steps[asked])) / Math.min(stepScale(steps[n]), stepScale(steps[asked])) >= MIN_RATIO));
  return rng.pick(fair);
}

/** The eight friends who join the parade; a round's rows share one of them. */
export const FRIENDS = ['duck', 'bunny', 'cat', 'pip', 'cow', 'pig', 'bear', 'dog'] as const;
export type Friend = (typeof FRIENDS)[number];
/** The flag's and the bunting's colours, by seed. */
export const FLAG_COLORS = ['red', 'orange', 'yellow', 'green', 'teal', 'blue', 'purple', 'pink'] as const;

/**
 * *Big duck, little duck*: one friend grows a step on each tap, then shrinks, in a cycle of three sizes (littlest, middle,
 * biggest, middle), with the size word for each step. Three cycles end the round; nothing is asked and nothing is wrong.
 */
export const CYCLE: readonly { step: number; word: 'bigger' | 'biggest' | 'smaller' | 'littlest' }[] = [
  { step: 2, word: 'bigger' }, { step: 4, word: 'biggest' }, { step: 2, word: 'smaller' }, { step: 0, word: 'littlest' },
];
export const CYCLE_TAPS = CYCLE.length * 3;
/** The size after `taps` taps (tap 0 is the start, the littlest). */
export const cycleAt = (taps: number): { step: number; word: (typeof CYCLE)[number]['word'] | null } =>
  taps <= 0 ? { step: 0, word: null } : CYCLE[(taps - 1) % CYCLE.length];
/** The one friend of the cycle stands larger than a row's friends: its biggest size still fits a portrait view with the pet clear. */
export const CYCLE_SCALE = 2.6;

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
export function sizeWord(plan: { count: number; order: 'big' | 'small'; bigLittle?: boolean }, ask?: SizeAsk): string {
  if (ask === 'middle') return 'middle-sized';
  if (plan.bigLittle) return ask === 'small' ? 'little' : 'big';
  if (ask) return ask === 'big' ? 'biggest' : 'smallest';
  if (plan.count === 2) return plan.order === 'big' ? 'bigger' : 'smaller';
  return plan.order === 'big' ? 'biggest' : 'smallest';
}

/** The chime for a friend: a pentatonic step by its place on the five-step size scale, the biggest lowest. */
export function sizeBell(rank: number, count: number): number { return stepBell(evenSteps(count)[rank]); }
export const stepBell = (step: number): number => 9 - step;

/** Where the friends stand and the line's spots sit across a view `w` wide, and how wide a friend's target may be without overlapping its neighbour. */
export function paradeLayout(friends: number, spots: number, w: number, gap = 175) {
  const xs = spread(friends, 165, w - 40, gap);
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
