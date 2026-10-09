import type { Rng } from '../../engine/random';

export type DuckMode = 'along' | 'make' | 'howmany' | 'add' | 'ten';

export interface DuckPlan {
  mode: DuckMode;
  /** Sets (along) or questions (everything else). */
  rounds: number;
  /** along: ducks per set. Otherwise the numbers asked about run from `min` to `max`. */
  max: number;
  min: number;
  /** make: show dots under the number on the sign. */
  dots?: boolean;
  /** add: mix in "some swim away". */
  subtract?: boolean;
}

export const PLANS: DuckPlan[] = [
  { mode: 'along', rounds: 2, min: 3, max: 3 },
  { mode: 'along', rounds: 2, min: 5, max: 5 },
  { mode: 'make', rounds: 4, min: 1, max: 3, dots: true },
  { mode: 'make', rounds: 4, min: 2, max: 5, dots: true },
  { mode: 'make', rounds: 4, min: 3, max: 6, dots: false },
  { mode: 'howmany', rounds: 5, min: 1, max: 5 },
  { mode: 'howmany', rounds: 5, min: 2, max: 8 },
  { mode: 'add', rounds: 5, min: 1, max: 5 },
  { mode: 'add', rounds: 5, min: 1, max: 10, subtract: true },
  // Early school: some ducks swim in; how many more fill the pond to ten?
  { mode: 'ten', rounds: 5, min: 3, max: 9 },
];

/** Make-ten rounds: how many ducks start in the pond, never the same twice running. */
export function tenStarts(rng: Rng, plan: DuckPlan): number[] {
  const out: number[] = [];
  while (out.length < plan.rounds) {
    const a = rng.int(plan.min, plan.max);
    if (a !== out.at(-1)) out.push(a);
  }
  return out;
}

export const planFor = (level: number) => PLANS[Math.min(PLANS.length, Math.max(1, level)) - 1];

/** Places on the pond for swimming ducks, relative to its middle. */
export const SLOTS: [number, number][] = [
  [0, -52],
  [-120, -48],
  [120, -48],
  [-60, 40],
  [60, 40],
  [-240, -36],
  [240, -36],
  [-180, 44],
  [180, 44],
  [0, 96],
];

/** Make mode: ducks waiting on the bank, always at least one more than asked for so stopping is a choice. */
export const bankSize = (plan: DuckPlan) => Math.min(7, plan.max + 1);

/** Three lily pads: the answer and two near neighbours, all between 1 and 10. */
export function padValues(rng: Rng, answer: number): number[] {
  const near = [answer - 2, answer - 1, answer + 1, answer + 2].filter((v) => v >= 1 && v <= 10);
  return rng.shuffle([answer, ...rng.shuffle(near).slice(0, 2)]);
}

/** An adding or taking-away story: `a` ducks swim in, then `b` more arrive or swim away. */
export interface PondStory {
  a: number;
  b: number;
  away: boolean;
  answer: number;
}

export function story(rng: Rng, plan: DuckPlan): PondStory {
  const away = !!plan.subtract && rng.chance(0.5);
  if (away) {
    const a = rng.int(2, Math.min(plan.max, 7));
    const b = rng.int(1, a - 1);
    return { a, b, away, answer: a - b };
  }
  const a = rng.int(1, plan.max - 1);
  const b = rng.int(1, Math.min(plan.max - a, 4));
  return { a, b, away, answer: a + b };
}

/**
 * What a capable child touches next: a duck on the bank, or lily pad number `pad` (counting from the left), or null while
 * she waits. Ducks: all of them (along), or only until there are as many swimming as the sign says (make). Pads: the one
 * with the answer. Always a right one, and never a duck too many.
 */
export type DuckMove = 'duck' | { pad: number };

export function duckMove(plan: DuckPlan, bank: number, swimming: number, want: number, pads: readonly number[], answer: number): DuckMove | null {
  if (plan.mode === 'along') return bank > 0 ? 'duck' : null;
  if (plan.mode === 'make') return bank > 0 && swimming < want ? 'duck' : null;
  const pad = pads.indexOf(answer);
  return pad >= 0 ? { pad } : null;
}
