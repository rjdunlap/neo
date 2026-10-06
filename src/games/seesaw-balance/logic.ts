import type { Rng } from '../../engine/random';

/**
 * Seesaw Balance, after Hasee Bounce and playground balance toys: put friends and blocks on a big
 * seesaw and watch it tip. The ladder goes from "make your friend go up" to heavier and lighter,
 * balancing with blocks, finding the heaviest of look-alike presents, making the same weight two ways,
 * and weighing a mystery box. Things sit on level trays at the ends, so only weight matters, never
 * how far out something sits.
 */
export type SeesawMode = 'up' | 'heavy' | 'level' | 'heaviest' | 'parts' | 'mystery';
export type Side = 'left' | 'right';

export interface SeesawPlan {
  mode: SeesawMode;
  rounds: number;
  boxes?: 2;
  name: string;
}

export const PLANS: SeesawPlan[] = [
  { mode: 'up', rounds: 4, name: 'Make a little friend go up: put a bigger friend on the other side' },
  { mode: 'heavy', rounds: 4, name: 'Heavy enough? Choose the friend who lifts the other side' },
  { mode: 'level', rounds: 3, name: 'Make the seesaw level with blocks (2 to 4)' },
  { mode: 'heaviest', rounds: 3, name: 'Test look-alike presents on the seesaw, then put the heaviest in the wagon' },
  { mode: 'parts', rounds: 3, name: 'Same weight, different pieces: match 4 to 7 with number weights' },
  { mode: 'mystery', rounds: 3, name: 'Weigh a mystery box with blocks, then say how heavy it is' },
  { mode: 'mystery', rounds: 3, boxes: 2, name: 'Two identical boxes: weigh both, then find the weight of one' },
];

export const planFor = (level: number) => PLANS[Math.min(PLANS.length, Math.max(1, level)) - 1];

export type ThingKind = 'friend' | 'block' | 'weight' | 'present' | 'box';

export interface Thing {
  kind: ThingKind;
  weight: number;
}

/** Friends by weight: the bigger the friend, the heavier. */
export const FRIEND_FOR = { 1: 'duck', 2: 'bunny', 3: 'pig', 4: 'bear' } as const;
export type FriendWeight = keyof typeof FRIEND_FOR;

export interface SeesawRound {
  /** Already sitting on the seesaw, and not movable. */
  fixed: Thing[];
  /** Where the fixed things sit. */
  fixedSide: Side;
  /** Waiting on the grass. */
  offered: Thing[];
  /** The number to say at the end of a mystery round, or the weight to match. */
  answer: number;
}

export const other = (side: Side): Side => (side === 'left' ? 'right' : 'left');
export const total = (things: readonly Thing[]) => things.reduce((sum, t) => sum + t.weight, 0);

/** Which side is down, or null when level. */
export function downSide(left: number, right: number): Side | null {
  return left === right ? null : left > right ? 'left' : 'right';
}

/** How far the seesaw leans, in radians: positive when the right side is down. A bigger difference leans more. */
export function tilt(left: number, right: number): number {
  const d = right - left;
  if (d === 0) return 0;
  return Math.sign(d) * Math.min(MAX_TILT, 0.1 + 0.04 * (Math.abs(d) - 1));
}
export const MAX_TILT = 0.24;

/** Comparing what the child added with what was already there. */
export type Weighing = 'under' | 'level' | 'over';
export const weigh = (fixed: number, added: number): Weighing => (added === fixed ? 'level' : added < fixed ? 'under' : 'over');

/** The ways to make `n` from some of the offered weights (each used once). */
export function ways(n: number, weights: readonly number[]): number[][] {
  const out: number[][] = [];
  const walk = (i: number, left: number, picked: number[]) => {
    if (left === 0) out.push(picked);
    if (left <= 0 || i >= weights.length) return;
    walk(i + 1, left - weights[i], [...picked, weights[i]]);
    walk(i + 1, left, picked);
  };
  walk(0, n, []);
  return out;
}

const friend = (weight: number): Thing => ({ kind: 'friend', weight });
const blocks = (n: number): Thing[] => Array.from({ length: n }, () => ({ kind: 'block', weight: 1 }));

export function makeRounds(plan: SeesawPlan, rng: Rng): SeesawRound[] {
  const rounds: SeesawRound[] = [];
  let last = 0;
  // A different number from last round where there is a choice, so each round is a fresh look.
  const fresh = (min: number, max: number) => {
    let n = rng.int(min, max);
    for (let tries = 0; n === last && max > min && tries < 10; tries++) n = rng.int(min, max);
    return (last = n);
  };
  for (let r = 0; r < plan.rounds; r++) {
    const fixedSide: Side = rng.chance(0.5) ? 'left' : 'right';
    switch (plan.mode) {
      case 'up': {
        const rider = fresh(1, 2);
        const bigger = rng.shuffle([2, 3, 4].filter((w) => w > rider)).slice(0, 2);
        rounds.push({ fixed: [friend(rider)], fixedSide, offered: rng.shuffle(bigger.map(friend)), answer: rider });
        break;
      }
      case 'heavy': {
        const rider = fresh(2, 3);
        const lighter = rng.int(1, rider - 1);
        const heavier = rng.int(rider + 1, 4);
        rounds.push({ fixed: [friend(rider)], fixedSide, offered: rng.shuffle([friend(lighter), friend(heavier)]), answer: rider });
        break;
      }
      case 'level': {
        const w = fresh(2, 4);
        rounds.push({ fixed: [friend(w)], fixedSide, offered: blocks(w + 2), answer: w });
        break;
      }
      case 'heaviest': {
        const weights = rng.shuffle([1, 2, 3, 4]).slice(0, 3);
        rounds.push({ fixed: [], fixedSide, offered: weights.map((weight) => ({ kind: 'present', weight })), answer: Math.max(...weights) });
        break;
      }
      case 'parts': {
        const n = fresh(4, 7);
        // Two weights that make n, set out on the seesaw; the child makes n another way or the same way.
        const pairs = ways(n, [1, 2, 3, 4]).filter((w) => w.length === 2);
        const pair = rng.pick(pairs);
        rounds.push({
          fixed: pair.map((weight) => ({ kind: 'weight', weight })),
          fixedSide,
          offered: rng.shuffle([1, 2, 3, 4]).map((weight) => ({ kind: 'weight', weight })),
          answer: n,
        });
        break;
      }
      case 'mystery': {
        const m = fresh(2, plan.boxes === 2 ? 3 : 5);
        rounds.push({ fixed: Array.from({ length: plan.boxes ?? 1 }, () => ({ kind: 'box', weight: m })), fixedSide, offered: blocks(plan.boxes === 2 ? 7 : 6), answer: m });
        break;
      }
    }
  }
  return rounds;
}

/** Three number choices: the answer and two near neighbours, all at least 1. */
export function numberChoices(rng: Rng, answer: number): number[] {
  const near = [answer - 2, answer - 1, answer + 1, answer + 2].filter((v) => v >= 1);
  return rng.shuffle([answer, ...rng.shuffle(near).slice(0, 2)]);
}
