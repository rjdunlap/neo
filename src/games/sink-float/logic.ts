import type { swatch } from '../../art/palette';
import type { LineId } from '../../content/voice-script';
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

export type SinkMode = 'drop' | 'say' | 'guess' | 'sort' | 'shape';

export interface SinkPlan {
  mode: SinkMode;
  /** Things in the round, or experiments in shape mode. */
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
  { mode: 'shape', count: 2, surprises: false, name: 'Make the clay float: change its shape and test it' },
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

/**
 * Make it float (level 7): the same lump of clay pressed into a new shape. A hollow boat pushes away lots of water while
 * weighing the same, so the water holds it up; a flat pancake is still solid clay, and a boat with a hole lets the water in.
 * Clay is kept out of `THINGS` so the seeded pools of levels 1 to 6 and the journal stay as they were.
 */
export const CLAY_SHAPES = {
  flat: { floats: false, line: 'sink.clay-flat' },
  boat: { floats: true, line: 'sink.clay-boat' },
  leaky: { floats: false, line: 'sink.clay-leaky' },
} as const satisfies Record<string, { floats: boolean; line: LineId }>;
export type ClayShape = keyof typeof CLAY_SHAPES;
export const ALL_SHAPES = Object.keys(CLAY_SHAPES) as ClayShape[];

/** Clay colors from the palette; the two experiments of a round never share one. */
export const CLAY_COLORS = ['orange', 'purple', 'pink', 'green', 'red'] as const satisfies readonly (keyof typeof swatch)[];
export type ClayColor = (typeof CLAY_COLORS)[number];

export interface ClayExperiment {
  /** The three shape tiles, left to right. */
  order: ClayShape[];
  color: ClayColor;
}

/** The round's experiments: every shape on offer each time, in a seeded order, each in its own clay color. */
export function shapesFor(plan: SinkPlan, rng: Rng): ClayExperiment[] {
  const colors = rng.shuffle([...CLAY_COLORS]);
  return Array.from({ length: plan.count }, (_, i) => ({ order: rng.shuffle([...ALL_SHAPES]), color: colors[i % colors.length] }));
}
