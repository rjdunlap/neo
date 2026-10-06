import type { ColorName } from '../../art/palette';
import type { Rng } from '../../engine/random';

/**
 * Secret Code, after Mastermind and Neopets' Time Tunnel, made gentle: a door opens with a hidden
 * row of colored stones. Fill the slots and try the key. Each slot then shows a mark:
 * green (right stone, right place), yellow (that stone is in the code, but elsewhere; later
 * levels only) or gray (not in the code). Guesses are unlimited and stay visible above the door.
 *
 * A guess is an experiment, never a mistake in itself. What counts as a miss is ignoring a clue:
 * trying a stone again in a slot where an earlier guess already ruled it out.
 */
export interface CodePlan {
  slots: number;
  colors: number;
  /** Yellow marks for right-color-wrong-place; without them, a slot is only green or gray. */
  yellow: boolean;
  /** Whether a color may appear twice in the code. */
  repeats: boolean;
  codes: number;
  name: string;
}

export const PLANS: CodePlan[] = [
  { slots: 2, colors: 3, yellow: false, repeats: false, codes: 3, name: 'Two slots, three colors; each slot says yes or no' },
  { slots: 3, colors: 4, yellow: false, repeats: false, codes: 3, name: 'Three slots, four colors; each slot says yes or no' },
  { slots: 3, colors: 4, yellow: true, repeats: false, codes: 2, name: 'Yellow marks: the color is in the code, but in another slot' },
  { slots: 3, colors: 5, yellow: true, repeats: false, codes: 2, name: 'Three slots and five colors, with yellow marks' },
  { slots: 4, colors: 5, yellow: true, repeats: false, codes: 2, name: 'Four slots and five colors' },
  { slots: 3, colors: 4, yellow: true, repeats: true, codes: 2, name: 'A color can be used twice in the code' },
];

export const planFor = (level: number) => PLANS[Math.min(PLANS.length, Math.max(1, level)) - 1];

export const STONES: ColorName[] = ['red', 'blue', 'yellow', 'green', 'purple'];

export type Mark = 'green' | 'yellow' | 'gray';

export function makeCode(plan: CodePlan, rng: Rng): number[] {
  if (plan.repeats) {
    // Make sure there really is a repeat, so the new rule matters.
    for (;;) {
      const code = Array.from({ length: plan.slots }, () => rng.int(0, plan.colors - 1));
      if (new Set(code).size < plan.slots) return code;
    }
  }
  return rng.shuffle(Array.from({ length: plan.colors }, (_, i) => i)).slice(0, plan.slots);
}

/**
 * Marks for each slot of a guess. Green first; then yellow only for stones still unmatched in the
 * code (so a color is never marked yellow more times than it is missing). Without yellow, every
 * non-green slot is gray.
 */
export function score(code: number[], guess: number[], yellow: boolean): Mark[] {
  const marks: Mark[] = guess.map((g, i) => (g === code[i] ? 'green' : 'gray'));
  if (!yellow) return marks;
  const left = new Map<number, number>();
  code.forEach((c, i) => {
    if (marks[i] !== 'green') left.set(c, (left.get(c) ?? 0) + 1);
  });
  guess.forEach((g, i) => {
    if (marks[i] === 'green') return;
    const n = left.get(g) ?? 0;
    if (n > 0) {
      marks[i] = 'yellow';
      left.set(g, n - 1);
    }
  });
  return marks;
}

export interface Guess {
  stones: number[];
  marks: Mark[];
}

/**
 * Stones that a slot can no longer be: a gray or yellow mark in that slot rules that stone out
 * there; without yellow marks a gray means "not here" only. With yellow marks and no repeats, a
 * gray also rules the color out everywhere, unless the same color got a green or yellow elsewhere
 * in that guess (then the gray only means "no second one").
 */
export function ruledOut(plan: CodePlan, history: Guess[], slot: number): Set<number> {
  const out = new Set<number>();
  for (const g of history) {
    g.stones.forEach((s, i) => {
      if (g.marks[i] === 'green') return;
      if (i === slot) out.add(s);
      else if (plan.yellow && !plan.repeats && g.marks[i] === 'gray' && !g.stones.some((t, j) => t === s && g.marks[j] !== 'gray')) out.add(s);
    });
  }
  // A slot already solved rules out everything else.
  for (const g of history) if (g.marks[slot] === 'green') for (let c = 0; c < plan.colors; c++) if (c !== g.stones[slot]) out.add(c);
  return out;
}

/** Slots where the new guess ignores an earlier clue: each counts as one miss. */
export function ignoredClues(plan: CodePlan, history: Guess[], guess: number[]): number[] {
  return guess.map((s, i) => (ruledOut(plan, history, i).has(s) ? i : -1)).filter((i) => i >= 0);
}

/** Every code still possible after these guesses. */
export function candidates(plan: CodePlan, history: Guess[]): number[][] {
  const out: number[][] = [];
  const build = (prefix: number[]) => {
    if (prefix.length === plan.slots) {
      if (!plan.repeats && new Set(prefix).size < plan.slots) return;
      if (history.every((h) => score(prefix, h.stones, plan.yellow).join() === h.marks.join())) out.push(prefix);
      return;
    }
    for (let c = 0; c < plan.colors; c++) build([...prefix, c]);
  };
  build([]);
  return out;
}

/** A helpful next guess: one that agrees with every clue so far. */
export function suggestion(plan: CodePlan, history: Guess[], code: number[]): number[] {
  const all = candidates(plan, history);
  return all.find((c) => c.join() !== code.join()) && all.length > 1 ? all[0] : code;
}
