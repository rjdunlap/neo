import type { Rng } from '../../engine/random';
import type { BandLevels } from '../../progress/difficulty';

/**
 * Down We Go (docs/definitions/down-we-go.md), batch 1: levels 1 and 2. A dive is a rope of knots; `light[k]` is how many of the
 * sun dial's eight petals are open at knot `k` (never rising with depth, always 8 at the top). The seaweed sprout needs `need`
 * petals, and she plants it on the deepest ledge that still has that much. Petals are a pretend unit, not metres.
 */
export const PETALS = 8;
export type Water = 'clear' | 'cloudy';

export interface Dive {
  light: number[];
  need: number;
  water: Water;
}

export const LEVELS: BandLevels = { prek: { min: 1, max: 2 }, school: { min: 2, max: 4 } };

export const LEVEL_NAMES: Record<number, string> = {
  1: 'Down we go: ride the lantern past every knot, then plant the seaweed on the deepest ledge it can grow',
  2: 'Measure first: choose which knots to measure on a five-knot rope, then plant the seaweed as deep as it can live',
  3: 'Clear water, cloudy water: guess whether the seaweed lives deeper or not as deep in the next cove, then find its deepest ledge',
  4: 'Half each knot: choose the sun dial that fits a covered knot, from the rule that each knot leaves half the light',
};
export const describeLevel = (level: number): string => LEVEL_NAMES[level] ?? LEVEL_NAMES[1];

/** The two fading rules on an evenly knotted rope of five knots (level 3): clear leaves half each knot, cloudy a quarter. */
export const fade = (w: Water): number[] => (w === 'clear' ? [8, 4, 2, 1, 0] : [8, 2, 0, 0, 0]);
export const halfOf = (n: number): number => n / 2;

const dive = (light: number[], need: number): Dive => ({ light, need, water: 'clear' });

/** The authored dives, verbatim from the definition's table. */
export const AUTHORED: Record<number, Dive[]> = {
  1: [dive([8, 4, 0], 2), dive([8, 1, 0], 2), dive([8, 4, 2, 0], 2)],
  2: [dive([8, 8, 4, 1, 0], 4)],
};

export const canGrow = (d: Dive, k: number): boolean => d.light[k] >= d.need;

/** The largest knot where the sprout can grow (knot 0 always reads 8, so there is one). */
export function deepest(d: Dive): number {
  let best = 0;
  d.light.forEach((_, k) => {
    if (canGrow(d, k)) best = k;
  });
  return best;
}

const STEPS = [8, 4, 2, 1, 0];

/** A non-rising list of `n` readings from the dial's values, starting at 8. */
function randomLight(n: number, rng: Rng): number[] {
  const out = [8];
  while (out.length < n) {
    const prev = out[out.length - 1];
    out.push(rng.pick(STEPS.filter((s) => s <= prev)));
  }
  return out;
}

function fair(d: Dive): boolean {
  // At least one knot too dark, so the answer is never simply the bottom.
  return d.light.some((_, k) => !canGrow(d, k));
}

/** Level 1's seeded dive: three or four knots, need 2, a given answer knot with the rest dark. */
function levelOneDive(rng: Rng, answer?: number): Dive {
  const n = rng.int(3, 4);
  const a = answer !== undefined && answer <= n - 2 ? answer : rng.int(0, n - 2);
  const light = [8];
  for (let k = 1; k < n; k++) {
    const prev = light[k - 1];
    light.push(rng.pick(k <= a ? [8, 4, 2].filter((s) => s <= prev) : [1, 0].filter((s) => s <= prev)));
  }
  return dive(light, 2);
}

function levelTwoDive(rng: Rng, need: number): Dive {
  for (;;) {
    const d = dive(randomLight(5, rng), need);
    if (fair(d)) return d;
  }
}

/** A round's three dives. The authored ones open the level; the how-to demonstration plays the authored three at level 1. */
export function roundFor(level: number, rng: Rng, authored = false): Dive[] {
  if (level === 3) return covesFor(rng, authored);
  if (level === 1) {
    if (authored) return AUTHORED[1].map((d) => ({ ...d, light: [...d.light] }));
    const first = AUTHORED[1][0];
    for (;;) {
      const round = [{ ...first, light: [...first.light] }, levelOneDive(rng), levelOneDive(rng)];
      if (new Set(round.map(deepest)).size >= 2) return round;
    }
  }
  for (;;) {
    const needs = [4, rng.pick([1, 2, 4]), rng.pick([1, 2, 4])];
    const first = AUTHORED[2][0];
    const round = [
      { ...first, light: [...first.light] },
      levelTwoDive(rng, needs[1]),
      levelTwoDive(rng, needs[2]),
    ];
    const answers = round.map(deepest);
    if (new Set(needs).size >= 2 && answers.some((a) => a > 0)) return round;
  }
}

/** What a tap on a ledge means. `unmeasured`: a prediction, free. `dark`: its open dial shows too little, one miss. */
export type PlantResult = 'deepest' | 'shallower' | 'dark' | 'unmeasured-grows' | 'unmeasured-dark';

export function plantResult(d: Dive, k: number, measured: boolean): PlantResult {
  if (!measured) return canGrow(d, k) ? 'unmeasured-grows' : 'unmeasured-dark';
  if (!canGrow(d, k)) return 'dark';
  return k === deepest(d) ? 'deepest' : 'shallower';
}

/** The knot a hint sends the lantern to. */
export const hintKnot = (d: Dive): number => deepest(d);

/** The kind of a knot's light, for the once-only spoken line. */
export const lightKind = (n: number): 'lots' | 'less' | 'none' =>
  n >= 6 ? 'lots' : n >= 1 ? 'less' : 'none';

const cove = (water: Water, need: number): Dive => ({ light: fade(water), need, water });

/** Level 3's pair of coves: the same sprout in both; the authored round is clear then cloudy with need 2. */
export function covesFor(rng: Rng, authored = false): Dive[] {
  if (authored) return [cove('clear', 2), cove('cloudy', 2)];
  const need = rng.pick([1, 2, 4]);
  const first: Water = rng.pick(['clear', 'cloudy'] as Water[]);
  return [cove(first, need), cove(first === 'clear' ? 'cloudy' : 'clear', need)];
}

export type Compare = 'deeper' | 'same' | 'shallower';
/** The second dive's deepest knot against the first's. */
export function compare(a: Dive, b: Dive): Compare {
  const [x, y] = [deepest(a), deepest(b)];
  return y > x ? 'deeper' : y < x ? 'shallower' : 'same';
}

/** A level-4 dial question on the clear rope. `shown[k]`: a number is an open dial, null the covered one, undefined no dial. */
export interface DialQ {
  shown: (number | null | undefined)[];
  at: number;
  options: [number, number, number];
  answer: number;
  /** Whether the first thing asked is the next reading. */
  next: boolean;
}

const q = (shown: DialQ['shown'], wrong: [number, number], next: boolean): DialQ => {
  const at = shown.indexOf(null);
  const answer = fade('clear')[at];
  return { shown, at, answer, options: [answer, ...wrong] as [number, number, number], next };
};

/** The pool, verbatim from the definition's table (options here are unshuffled, the answer first). */
export const DIAL_POOL: DialQ[] = [
  q([8, 4, null], [0, 4], true),
  q([8, 4, 2, null], [0, 2], true),
  q([8, null, 2], [5, 2], false),
  q([undefined, 4, null, 1], [3, 1], false),
];

/** Three questions, a "next reading" first, none repeated, options shuffled. */
export function questionsFor(rng: Rng): DialQ[] {
  const nexts = DIAL_POOL.filter((d) => d.next);
  const first = rng.pick(nexts);
  const rest = rng.shuffle(DIAL_POOL.filter((d) => d !== first)).slice(0, 2);
  return [first, ...rest].map((d) => ({ ...d, options: rng.shuffle([...d.options]) as DialQ['options'] }));
}

/** The knot whose dial sits just above the cover, the one the hint halves. */
export const aboveKnot = (d: DialQ): number => d.at - 1;
