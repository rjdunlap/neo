import type { swatch } from '../../art/palette';
import type { LineId } from '../../content/voice-script';
import type { Rng } from '../../engine/random';
import type { BandLevels } from '../../progress/difficulty';

/**
 * Things to drop in the water. `obvious` ones behave the way a toddler expects; the others
 * (a floating apple, a big floating log, a sinking coin) are the surprises for older children.
 * Only things whose behaviour in plain tap water is never in doubt: no crayons, buttons, soaking sponges, open cups
 * or fruit that varies.
 */
export const THINGS = {
  duck: { floats: true, obvious: true },
  boat: { floats: true, obvious: true },
  ball: { floats: true, obvious: true },
  feather: { floats: true, obvious: true },
  leaf: { floats: true, obvious: false },
  apple: { floats: true, obvious: false },
  log: { floats: true, obvious: false },
  ice: { floats: true, obvious: false },
  rock: { floats: false, obvious: true },
  key: { floats: false, obvious: true },
  marble: { floats: false, obvious: true },
  coin: { floats: false, obvious: false },
  spoon: { floats: false, obvious: false },
  paperclip: { floats: false, obvious: false },
} as const;
export type Thing = keyof typeof THINGS;
export const ALL_THINGS = Object.keys(THINGS) as Thing[];
export const floats = (t: Thing) => THINGS[t].floats;

/** What the voice and the journal call a thing, where its key is not already the word. */
const WORDS: Partial<Record<Thing, string>> = { ice: 'ice cube', paperclip: 'paper clip' };
export const thingWord = (t: Thing) => WORDS[t] ?? t;

/** The basket or button that is right for a thing (the how-to card's ghost finger sorts and guesses with it). */
export const rightBasket = (t: Thing): 'float' | 'sink' => (floats(t) ? 'float' : 'sink');

export type SinkMode = 'drop' | 'say' | 'guess' | 'sort' | 'shape' | 'pair' | 'salt';

export interface SinkPlan {
  mode: SinkMode;
  /** Things in the round, experiments in shape mode, pairs in pair mode, or part 2's questions in salt mode. */
  count: number;
  /** Include the surprising things. */
  surprises: boolean;
  name: string;
}

/**
 * The plans by level ID. ID 8 is reserved for Garden Raft, so level 9 sits between 5 and 6 (pre-K) and between 6 and 7
 * (school) through the bands' `order` in `SINK_LEVELS`.
 */
export const SINK_PLANS: Record<number, SinkPlan> = {
  1: { mode: 'drop', count: 5, surprises: false, name: 'Tap things to drop them in the water and watch' },
  2: { mode: 'say', count: 5, surprises: false, name: 'Drop things in and hear whether they float or sink' },
  3: {
    mode: 'guess',
    count: 5,
    surprises: false,
    name: 'Guess float or sink, then test it (guesses are never wrong answers)',
  },
  4: { mode: 'sort', count: 5, surprises: false, name: 'Sort familiar things into float and sink baskets' },
  5: {
    mode: 'sort',
    count: 6,
    surprises: true,
    name: 'Sort things including surprises, like a floating apple',
  },
  6: { mode: 'guess', count: 6, surprises: true, name: 'Guess and test surprising things' },
  7: { mode: 'shape', count: 2, surprises: false, name: 'Make the clay float: change its shape and test it' },
  9: {
    mode: 'pair',
    count: 3,
    surprises: false,
    name: 'Big and small: watch the big one, guess the small one of the same stuff, then test it',
  },
  10: {
    mode: 'salt',
    count: 4,
    surprises: false,
    name: 'Salty or fresh: compare two tanks, then test to find the salty one',
  },
};
export const SINK_IDS = Object.keys(SINK_PLANS).map(Number);

export const SINK_LEVELS: BandLevels = {
  lap: { min: 1, max: 2 },
  toddler: { min: 2, max: 4 },
  preschool: { min: 3, max: 5 },
  prek: { min: 4, max: 9, order: [4, 5, 9, 6] },
  school: { min: 5, max: 10, order: [5, 6, 9, 7, 10] },
};

/** A built level's plan; an unbuilt ID (8, Garden Raft) or one above the top falls to the nearest built ID below it. */
export const sinkPlan = (level: number): SinkPlan => {
  const below = SINK_IDS.filter((id) => id <= level);
  return SINK_PLANS[below.length ? below[below.length - 1] : SINK_IDS[0]];
};

/**
 * Big and small (level 9): two things of one stuff at two sizes. The big one is shown going in; she guesses the small one.
 * Size never changes it. The small members are kept out of `THINGS` so the seeded pools of levels 1 to 6 and the journal
 * stay as they were. `size` is the scale each is drawn at.
 */
export const PAIRS = {
  wood: {
    floats: true,
    big: { thing: 'log', word: 'log', size: 1.3 },
    small: { art: 'twig', word: 'twig', size: 0.75 },
    line: 'sink.pair-wood',
  },
  stone: {
    floats: false,
    big: { thing: 'rock', word: 'rock', size: 1.3 },
    small: { art: 'pebble', word: 'pebble', size: 0.75 },
    line: 'sink.pair-stone',
  },
  ball: {
    floats: true,
    big: { thing: 'ball', word: 'ball', size: 1.4 },
    small: { art: 'little-ball', word: 'ball', size: 0.6 },
    line: 'sink.pair-ball',
  },
} as const satisfies Record<
  string,
  {
    floats: boolean;
    big: { thing: Thing; word: string; size: number };
    small: { art: string; word: string; size: number };
    line: LineId;
  }
>;
export type PairKind = keyof typeof PAIRS;
export type SmallArt = (typeof PAIRS)[PairKind]['small']['art'];
export const ALL_PAIRS = Object.keys(PAIRS) as PairKind[];

/** The round's pairs: distinct, in a seeded order. */
export const pairsFor = (plan: SinkPlan, rng: Rng): PairKind[] =>
  rng.shuffle([...ALL_PAIRS]).slice(0, Math.min(plan.count, ALL_PAIRS.length));

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
export const CLAY_COLORS = [
  'orange',
  'purple',
  'pink',
  'green',
  'red',
] as const satisfies readonly (keyof typeof swatch)[];
export type ClayColor = (typeof CLAY_COLORS)[number];

export interface ClayExperiment {
  /** The three shape tiles, left to right. */
  order: ClayShape[];
  color: ClayColor;
}

/** The round's experiments: every shape on offer each time, in a seeded order, each in its own clay color. */
export function shapesFor(plan: SinkPlan, rng: Rng): ClayExperiment[] {
  const colors = rng.shuffle([...CLAY_COLORS]);
  return Array.from({ length: plan.count }, (_, i) => ({
    order: rng.shuffle([...ALL_SHAPES]),
    color: colors[i % colors.length],
  }));
}

/**
 * Salty or fresh (level 10): the same thing in two waters. Salt mixed into water makes the same amount of water heavier, so
 * it pushes up harder: a duck sits higher, and an egg that sinks in plain water floats. The egg and the shaker are kept out
 * of `THINGS` so the seeded pools of levels 1 to 6 and the journal stay as they were.
 */
export type Water = 'fresh' | 'salty';
export type SaltTest = 'duck' | 'egg';
export type Side = 'left' | 'right';

/** How far each thing sits under the surface in logical units, or null where it sinks. The duck's rise is drawn bigger than life. */
export const SALT_DEPTHS: Record<SaltTest, Record<Water, number | null>> = {
  duck: { fresh: 26, salty: 6 },
  egg: { fresh: null, salty: 40 },
};
export const floatsIn = (test: SaltTest, water: Water) => SALT_DEPTHS[test][water] !== null;

export interface SaltQuestion {
  salty: Side;
  test: SaltTest;
}
export interface SaltRound {
  /** Part 1: the tank the shaker stands beside. */
  shown: Side;
  /** Part 2: the egg first, the duck last. */
  questions: SaltQuestion[];
}

/** A round: both sides salty at least once in part 2, never three of the same side in a row. */
export function saltRoundFor(plan: SinkPlan, rng: Rng): SaltRound {
  const shown: Side = rng.pick(['left', 'right'] as Side[]);
  for (;;) {
    const sides = Array.from({ length: plan.count }, () => rng.pick(['left', 'right'] as Side[]));
    if (new Set(sides).size < 2 && plan.count > 1) continue;
    if (sides.some((s, i) => i >= 2 && s === sides[i - 1] && s === sides[i - 2])) continue;
    return {
      shown,
      questions: sides.map((salty, i) => ({ salty, test: i === plan.count - 1 ? 'duck' : 'egg' })),
    };
  }
}
