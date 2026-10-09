import type { Rng } from '../../engine/random';

/**
 * Frog Hop: a number line of lily pads. Find a number, then one more and one less, then adding
 * and taking away as hops along the line, then how many hops lie between two numbers, then a
 * longer line to 20. Nine pads show at a time; on the long line the view slides to fit.
 */
export type HopMode = 'find' | 'next' | 'add' | 'back' | 'gap' | 'big';

export interface HopPlan {
  mode: HopMode;
  /** Highest number on the line. */
  top: number;
  questions: number;
  name: string;
}

export const PLANS: HopPlan[] = [
  { mode: 'find', top: 8, questions: 5, name: 'Hop to a number on the line, 0 to 8' },
  { mode: 'next', top: 8, questions: 5, name: 'One more or one less: hop to the next number up or back' },
  { mode: 'add', top: 8, questions: 5, name: 'Start at a number and hop 1 to 4 more: where does the frog land?' },
  { mode: 'back', top: 8, questions: 5, name: 'Hop back 1 to 4: taking away on the line' },
  { mode: 'gap', top: 10, questions: 5, name: 'How many hops from one number to another? Choose a number card' },
  { mode: 'big', top: 20, questions: 5, name: 'A longer line to 20: hop on or back up to 6' },
];

export const planFor = (level: number) => PLANS[Math.min(PLANS.length, Math.max(1, level)) - 1];

/** Pads visible at once. */
export const WINDOW = 9;

export interface HopQuestion {
  /** Where the frog starts. */
  start: number;
  /** The pad that answers it (for 'gap', where the frog ends up). */
  target: number;
  /** Signed hops from start to target. */
  hops: number;
  /** For 'next': whether it asks for one more or one less. */
  ask?: 'more' | 'less';
  /** First pad in view. */
  lo: number;
}

/** The answer a child gives: a pad, or for 'gap' the number of hops. */
export const answerOf = (mode: HopMode, q: HopQuestion) => (mode === 'gap' ? Math.abs(q.hops) : q.target);

/** Number cards offered on 'gap' levels. */
export const GAP_CARDS = [1, 2, 3, 4, 5, 6];

/**
 * Which spot answers a question, for the couch bot and the how-to card's ghost finger: a lily pad counted from the first one
 * in view, or on 'gap' levels a number card by its place in `GAP_CARDS`. -1 when the answer is not on screen.
 */
export function answerSlot(mode: HopMode, q: HopQuestion, lo: number): number {
  const slot = mode === 'gap' ? GAP_CARDS.indexOf(answerOf('gap', q)) : q.target - lo;
  return slot >= 0 && slot < (mode === 'gap' ? GAP_CARDS.length : WINDOW) ? slot : -1;
}

function windowFor(top: number, a: number, b: number, rng: Rng): number {
  const min = Math.max(0, Math.max(a, b) - (WINDOW - 1));
  const max = Math.min(Math.min(a, b), top - (WINDOW - 1));
  return rng.int(min, Math.max(min, max));
}

export function makeQuestions(plan: HopPlan, rng: Rng): HopQuestion[] {
  const out: HopQuestion[] = [];
  let frog = 0;
  for (let i = 0; i < plan.questions; i++) {
    let q: HopQuestion;
    for (;;) {
      const top = plan.top;
      if (plan.mode === 'find') {
        const target = rng.int(0, top);
        q = { start: frog, target, hops: target - frog, lo: 0 };
      } else if (plan.mode === 'next') {
        const ask = rng.chance(0.5) ? 'more' : 'less';
        const start = ask === 'more' ? rng.int(0, top - 1) : rng.int(1, top);
        q = { start, target: start + (ask === 'more' ? 1 : -1), hops: ask === 'more' ? 1 : -1, ask, lo: 0 };
      } else if (plan.mode === 'add' || plan.mode === 'back') {
        const k = rng.int(1, 4);
        const start = plan.mode === 'add' ? rng.int(0, top - k) : rng.int(k, top);
        const hops = plan.mode === 'add' ? k : -k;
        q = { start, target: start + hops, hops, lo: 0 };
      } else if (plan.mode === 'gap') {
        const k = rng.int(1, 5);
        const start = rng.int(0, top - k);
        q = { start, target: start + k, hops: k, lo: 0 };
      } else {
        const k = rng.int(2, 6) * (rng.chance(0.6) ? 1 : -1);
        const start = k > 0 ? rng.int(0, top - k) : rng.int(-k, top);
        q = { start, target: start + k, hops: k, lo: 0 };
      }
      q.lo = windowFor(plan.top, q.start, q.target, rng);
      const prev = out[i - 1];
      // Never the same answer twice running, and the frog must actually move.
      if (q.target === q.start || (prev && answerOf(plan.mode, prev) === answerOf(plan.mode, q))) continue;
      break;
    }
    out.push(q);
    frog = q.target;
  }
  return out;
}
