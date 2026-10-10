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
  /** Most friends that may already be asleep when a tap-everyone round opens (at least two stay awake). */
  asleep: number;
  name: string;
}

export const PLANS: NightPlan[] = [
  { mode: 'all', things: 4, requests: 0, asleep: 0, name: 'Tap each friend to say goodnight (4 things)' },
  { mode: 'all', things: 6, requests: 0, asleep: 2, name: 'Say goodnight to everyone in the room (6 things)' },
  { mode: 'named', things: 6, requests: 5, asleep: 0, name: 'Say goodnight to the one named: "the kitten"' },
  { mode: 'two', things: 6, requests: 3, asleep: 0, name: 'Two in order: "the clock, then the lamp"' },
];

export const planFor = (level: number) => PLANS[Math.min(PLANS.length, Math.max(1, level)) - 1];

/** Everything that can be in the room, in the order they appear. */
export const THINGS = ['lamp', 'teddy', 'kitten', 'clock', 'puppy', 'fish'] as const;
export type Thing = (typeof THINGS)[number];

/** The words spoken for each thing. */
export const NAMES: Record<Thing, string> = { lamp: 'lamp', teddy: 'teddy bear', kitten: 'kitten', clock: 'clock', puppy: 'puppy', fish: 'fish' };

/** Who is in the room this round and who is already asleep. */
export interface Night {
  /** The friends in the room, in `THINGS` order. */
  room: Thing[];
  /** Friends asleep when the round opens; always inside the room, with at least two left awake. */
  asleep: Thing[];
}

/** Draws this round's room (a seeded few of the six friends) and who starts asleep. */
export function makeNight(plan: NightPlan, rng: Rng): Night {
  const room = plan.things >= THINGS.length ? [...THINGS] : rng.shuffle([...THINGS]).slice(0, plan.things).sort((a, b) => THINGS.indexOf(a) - THINGS.indexOf(b));
  const most = Math.min(plan.asleep, room.length - 2);
  const asleep = most > 0 ? rng.shuffle([...room]).slice(0, rng.int(0, most)) : [];
  return { room, asleep };
}

/** Who to say goodnight to, as one or two things per request; every thing asked at most once per step. */
export function makeRequests(plan: NightPlan, rng: Rng, room: readonly Thing[]): Thing[][] {
  if (plan.mode === 'all') return [];
  const order = rng.shuffle([...room]);
  if (plan.mode === 'named') return order.slice(0, plan.requests).map((t) => [t]);
  return Array.from({ length: plan.requests }, (_, i) => [order[i * 2], order[i * 2 + 1]]);
}

/**
 * Who a capable child says goodnight to next, or null when she is waiting: the first friend in the room still awake (everyone,
 * in any order), or the one the voice named, one at a time and in the order asked. `asleep` holds the things already
 * asleep, `step` how far through this request she is. Always a right one.
 */
export function thingToTap(plan: NightPlan, request: readonly Thing[] | undefined, step: number, asleep: ReadonlySet<Thing>, room: readonly Thing[]): Thing | null {
  if (plan.mode === 'all') return room.find((t) => !asleep.has(t)) ?? null;
  return request?.[step] ?? null;
}
