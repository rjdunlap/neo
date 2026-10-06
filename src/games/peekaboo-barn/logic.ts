import type { Rng } from '../../engine/random';

export const ANIMALS = ['cow', 'duck', 'pig', 'cat', 'dog', 'bunny', 'bear'] as const;
export type Animal = (typeof ANIMALS)[number];

export interface PeekPlan {
  /** free: tap to reveal. find: animals peek, "where's the cow?". remember: they show, hide, then the question. */
  mode: 'free' | 'find' | 'remember';
  spots: number;
  /** Reveals (free) or questions (find, remember). */
  goal: number;
}

export const PLANS: PeekPlan[] = [
  { mode: 'free', spots: 3, goal: 8 },
  { mode: 'free', spots: 4, goal: 12 },
  { mode: 'find', spots: 2, goal: 5 },
  { mode: 'find', spots: 3, goal: 6 },
  { mode: 'find', spots: 4, goal: 6 },
  { mode: 'remember', spots: 2, goal: 5 },
  { mode: 'remember', spots: 3, goal: 5 },
  { mode: 'remember', spots: 4, goal: 6 },
];

export const planFor = (level: number) => PLANS[Math.min(PLANS.length, Math.max(1, level)) - 1];

/** A different animal behind each hiding place. */
export const deal = (rng: Rng, spots: number): Animal[] => rng.shuffle([...ANIMALS]).slice(0, spots);

/** Who to ask for: someone hiding now, and not the same friend as last time. */
export function pickTarget(rng: Rng, present: readonly Animal[], last: Animal | null): Animal {
  const fresh = present.filter((a) => a !== last);
  return rng.pick(fresh.length ? fresh : present);
}

/** Free play: someone new sneaks in, never the same as anyone already out. */
export const newcomer = (rng: Rng, taken: readonly Animal[]): Animal => rng.pick(ANIMALS.filter((a) => !taken.includes(a)));
