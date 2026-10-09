import type { Rng } from '../../engine/random';

/**
 * Things to drop in the water. `obvious` ones behave the way a toddler expects; the others
 * (a floating apple, a sinking coin) are the surprises for older children.
 */
export const THINGS = {
  duck: { floats: true, obvious: true },
  boat: { floats: true, obvious: true },
  ball: { floats: true, obvious: true },
  leaf: { floats: true, obvious: false },
  apple: { floats: true, obvious: false },
  rock: { floats: false, obvious: true },
  key: { floats: false, obvious: true },
  coin: { floats: false, obvious: false },
  spoon: { floats: false, obvious: false },
} as const;
export type Thing = keyof typeof THINGS;
export const ALL_THINGS = Object.keys(THINGS) as Thing[];
export const floats = (t: Thing) => THINGS[t].floats;

/** The basket or button that is right for a thing (the how-to card's ghost finger sorts and guesses with it). */
export const rightBasket = (t: Thing): 'float' | 'sink' => (floats(t) ? 'float' : 'sink');

export type SinkMode = 'drop' | 'say' | 'guess' | 'sort';

export interface SinkPlan {
  mode: SinkMode;
  count: number;
  /** Include the surprising things. */
  surprises: boolean;
  name: string;
}

export const SINK_PLANS: SinkPlan[] = [
  { mode: 'drop', count: 5, surprises: false, name: 'Tap things to drop them in the water and watch' },
  { mode: 'say', count: 5, surprises: false, name: 'Drop things in and hear whether they float or sink' },
  { mode: 'guess', count: 5, surprises: false, name: 'Guess float or sink, then test it (guesses are never wrong answers)' },
  { mode: 'sort', count: 5, surprises: false, name: 'Sort familiar things into float and sink baskets' },
  { mode: 'sort', count: 6, surprises: true, name: 'Sort things including surprises, like a floating apple' },
  { mode: 'guess', count: 6, surprises: true, name: 'Guess and test surprising things' },
];

export const sinkPlan = (level: number) => SINK_PLANS[Math.max(0, Math.min(SINK_PLANS.length - 1, level - 1))];

/** The things for a round: always some floaters and some sinkers, surprises included when asked for. */
export function thingsFor(plan: SinkPlan, rng: Rng): Thing[] {
  const pool = ALL_THINGS.filter((t) => plan.surprises || THINGS[t].obvious);
  for (;;) {
    const pick = rng.shuffle([...pool]).slice(0, Math.min(plan.count, pool.length));
    const f = pick.filter(floats).length;
    const surprising = pick.some((t) => !THINGS[t].obvious);
    if (f > 0 && f < pick.length && (!plan.surprises || surprising)) return pick;
  }
}
