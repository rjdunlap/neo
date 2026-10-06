import type { Rng } from '../../engine/random';

/**
 * Goodnight Room, after "Goodnight Moon": a cosy bedroom at bedtime. Tap each thing to say
 * goodnight and it falls asleep; when everyone is asleep the lights go down and the stars come
 * out. Later the voice names who to say goodnight to, then two in order.
 */
export type NightMode = 'all' | 'named' | 'two';

export interface NightPlan {
  mode: NightMode;
  /** Things in the room. */
  things: number;
  /** Requests ('named' and 'two'). */
  requests: number;
  name: string;
}

export const PLANS: NightPlan[] = [
  { mode: 'all', things: 4, requests: 0, name: 'Tap each friend to say goodnight (4 things)' },
  { mode: 'all', things: 6, requests: 0, name: 'Say goodnight to everyone in the room (6 things)' },
  { mode: 'named', things: 6, requests: 5, name: 'Say goodnight to the one named: "the kitten"' },
  { mode: 'two', things: 6, requests: 3, name: 'Two in order: "the clock, then the lamp"' },
];

export const planFor = (level: number) => PLANS[Math.min(PLANS.length, Math.max(1, level)) - 1];

/** Everything that can be in the room, in the order they appear. */
export const THINGS = ['lamp', 'teddy', 'kitten', 'clock', 'puppy', 'fish'] as const;
export type Thing = (typeof THINGS)[number];

/** The words spoken for each thing. */
export const NAMES: Record<Thing, string> = { lamp: 'lamp', teddy: 'teddy bear', kitten: 'kitten', clock: 'clock', puppy: 'puppy', fish: 'fish' };

/** Who to say goodnight to, as one or two things per request; every thing asked at most once per step. */
export function makeRequests(plan: NightPlan, rng: Rng): Thing[][] {
  const room = THINGS.slice(0, plan.things);
  if (plan.mode === 'all') return [];
  const order = rng.shuffle([...room]);
  if (plan.mode === 'named') return order.slice(0, plan.requests).map((t) => [t]);
  return Array.from({ length: plan.requests }, (_, i) => [order[i * 2], order[i * 2 + 1]]);
}
