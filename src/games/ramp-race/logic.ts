import type { Rng } from '../../engine/random';

/**
 * Ramp Race: a toy car rolls down a ramp and across the floor. A higher ramp sends it farther;
 * a slippery floor lets it glide farther than a rough one. First explore, then pick the height
 * that stops the car on a star, then height and floor together, then fair tests: compare two
 * lanes while changing only one thing.
 *
 * The model is deliberately simple and explainable: distance = height × floor glide, in floor
 * marks. Nothing here pretends to be more than that.
 */
export type RampMode = 'explore' | 'height' | 'both' | 'fair';

export interface RampPlan {
  mode: RampMode;
  /** Rolls to explore, or stars / questions to answer. */
  rounds: number;
  name: string;
}

export const PLANS: RampPlan[] = [
  { mode: 'explore', rounds: 4, name: 'Change the ramp and roll the car: higher goes farther' },
  { mode: 'height', rounds: 3, name: 'Pick the ramp height that stops the car on the star' },
  { mode: 'both', rounds: 3, name: 'Ramp height and floor (carpet, wood, ice) together reach the star' },
  { mode: 'fair', rounds: 3, name: 'Fair tests: compare two lanes, changing only one thing' },
];

export const planFor = (level: number) => PLANS[Math.min(PLANS.length, Math.max(1, level)) - 1];

export const HEIGHTS = [2, 3, 4] as const;
export type Floor = 'carpet' | 'wood' | 'ice';
export const FLOORS: Floor[] = ['carpet', 'wood', 'ice'];
export const GLIDE: Record<Floor, number> = { carpet: 1, wood: 1.5, ice: 2.5 };

/** Floor marks the car travels from the bottom of the ramp. */
export const distance = (height: number, floor: Floor) => height * GLIDE[floor];

/** The longest roll, for scaling the floor to the screen. */
export const MAX_DISTANCE = distance(4, 'ice');

export interface Setup {
  height: number;
  floor: Floor;
}

/** Stars: on the 'height' level the floor is wood; on 'both' any combination may reach it. */
export function makeStars(plan: RampPlan, rng: Rng): number[] {
  const out: number[] = [];
  const options = plan.mode === 'height' ? HEIGHTS.map((h) => distance(h, 'wood')) : [...new Set(HEIGHTS.flatMap((h) => FLOORS.map((f) => distance(h, f))))];
  while (out.length < plan.rounds) {
    const d = rng.pick(options);
    if (!out.includes(d)) out.push(d);
  }
  return out;
}

/** Whether a roll stops on the star (the star is a little wider than a mark). */
export const onStar = (d: number, star: number) => Math.abs(d - star) < 0.3;

/** Every setup that reaches a star, so a hint can suggest one. */
export const waysTo = (star: number, floors: Floor[] = FLOORS): Setup[] =>
  HEIGHTS.flatMap((height) => floors.map((floor) => ({ height, floor }))).filter((s) => onStar(distance(s.height, s.floor), star));

/** A fair-test question: which thing to compare. */
export interface FairQuestion {
  compare: 'floor' | 'height';
}

export function makeQuestions(rng: Rng, n: number): FairQuestion[] {
  const order = rng.shuffle<FairQuestion['compare']>(['floor', 'height', rng.pick(['floor', 'height'] as const)]);
  return order.slice(0, n).map((compare) => ({ compare }));
}

/**
 * Is the test fair? Fair means exactly the thing being compared differs and everything else is the
 * same. Returns 'fair', 'same' (nothing differs, so there is nothing to compare) or 'unfair'.
 */
export function judgeFair(q: FairQuestion, a: Setup, b: Setup): 'fair' | 'same' | 'unfair' {
  const heightDiffers = a.height !== b.height;
  const floorDiffers = a.floor !== b.floor;
  if (!heightDiffers && !floorDiffers) return 'same';
  if (q.compare === 'floor') return floorDiffers && !heightDiffers ? 'fair' : 'unfair';
  return heightDiffers && !floorDiffers ? 'fair' : 'unfair';
}
