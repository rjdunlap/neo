import type { Rng } from '../../engine/random';

/**
 * Goodnight Room, after "Goodnight Moon": a cosy bedroom at bedtime. Tap each thing to say
 * goodnight and it falls asleep; when everyone is asleep the lights go down and the stars come
 * out. Later the voice names who to say goodnight to, then two in order.
 */
export type NightMode = 'all' | 'named' | 'two' | 'animals' | 'lightLast' | 'count' | 'color' | 'except';

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
  { mode: 'animals', things: 5, requests: 1, asleep: 0, name: 'Say goodnight to the animals, in any order' },
  { mode: 'lightLast', things: 6, requests: 1, asleep: 0, name: 'Say goodnight to everyone, keeping the light on until last' },
  { mode: 'count', things: 6, requests: 0, asleep: 0, name: 'Count out goodnights for 2–4 friends, choosing any awake friends' },
  { mode: 'color', things: 4, requests: 1, asleep: 0, name: 'Say goodnight to the orange or brown friends, in any order' },
  { mode: 'except', things: 6, requests: 1, asleep: 0, name: 'Say goodnight to everyone except the lamp or lantern: keep a night-light awake' },
];

export const planFor = (level: number) => PLANS[Math.min(PLANS.length, Math.max(1, level)) - 1];

/** Everything that can be in the room, in the order they appear. */
export const THINGS = ['lamp', 'teddy', 'kitten', 'clock', 'puppy', 'fish', 'lantern', 'cow', 'pig', 'duck', 'bunny', 'cat'] as const;
export type Thing = (typeof THINGS)[number];

/** The words spoken for each thing. */
export const NAMES: Record<Thing, string> = { lamp: 'lamp', teddy: 'teddy bear', kitten: 'kitten', clock: 'clock', puppy: 'puppy', fish: 'fish', lantern: 'lantern', cow: 'cow', pig: 'pig', duck: 'duck', bunny: 'bunny', cat: 'barn cat' };

/** Main colors and conspicuous trim, excluding tiny facial details and outlines.
 * In color rounds the fish's shelf is blue, so it cannot be mistaken for brown. */
export const COLORS: Record<Thing, { main: string; visible: readonly string[] }> = {
  lamp: { main: 'yellow', visible: ['yellow', 'brown'] },
  teddy: { main: 'brown', visible: ['brown'] },
  kitten: { main: 'orange', visible: ['orange'] },
  clock: { main: 'white', visible: ['white', 'brown'] },
  puppy: { main: 'brown', visible: ['brown', 'orange'] },
  fish: { main: 'orange', visible: ['orange', 'blue'] },
  lantern: { main: 'yellow', visible: ['yellow', 'brown'] },
  cow: { main: 'white', visible: ['white', 'pink', 'brown', 'yellow'] },
  pig: { main: 'pink', visible: ['pink'] },
  duck: { main: 'yellow', visible: ['yellow', 'orange'] },
  bunny: { main: 'white', visible: ['white', 'pink'] },
  cat: { main: 'orange', visible: ['orange'] },
};
/** The orange round excludes the puppy's orange ears; the brown round excludes wooden props. */
export const COLOR_ROUNDS = [
  { color: 'brown', friends: ['teddy', 'kitten', 'puppy', 'fish'] },
  { color: 'orange', friends: ['lamp', 'teddy', 'kitten', 'fish'] },
] as const;

/** Rooms have six spacious slots: four on the floor, one on the wall and one on a shelf. */
export const ROOMS = [
  { id: 'bedroom', friends: ['lamp', 'teddy', 'kitten', 'clock', 'puppy', 'fish'] },
  { id: 'barn', friends: ['cow', 'pig', 'duck', 'lantern', 'bunny', 'cat'] },
] as const;
export type NightRoom = (typeof ROOMS)[number];
export const SLOTS: readonly [number, number][] = [[0.22, 0.86], [0.4, 0.86], [0.58, 0.88], [0.42, 0.26], [0.78, 0.88], [0.66, 0.46]];
export const isLight = (thing: Thing) => thing === 'lamp' || thing === 'lantern';
export const isAnimal = (thing: Thing) => !['lamp', 'lantern', 'clock', 'teddy'].includes(thing);

/** A category round has two objects and three unmistakable living animals; no teddy. */
export interface Night {
  setting: NightRoom;
  room: Thing[];
  asleep: Thing[];
  /** Number of free-choice goodnights; counting rounds leave some friends awake. */
  targetCount: number;
  color: string | null;
}

export function makeNight(plan: NightPlan, rng: Rng): Night {
  if (plan.mode === 'color') {
    const choice = rng.pick([...COLOR_ROUNDS]);
    return { setting: ROOMS[0], room: [...choice.friends], asleep: [], targetCount: 4, color: choice.color };
  }
  // The barn has just one object, so category rounds use the bedroom.
  const setting = plan.mode === 'animals' ? ROOMS[0] : rng.pick([...ROOMS]);
  const order: readonly Thing[] = setting.friends;
  const pool: Thing[] = order.filter(t => plan.mode !== 'animals' || t !== 'teddy');
  const room = rng.shuffle(pool).slice(0, plan.things).sort((a, b) => order.indexOf(a) - order.indexOf(b));
  const most = Math.min(plan.asleep, room.length - 2);
  const asleep = most > 0 ? rng.shuffle([...room]).slice(0, rng.int(0, most)) : [];
  return { setting, room, asleep, targetCount: plan.mode === 'count' ? rng.int(2, 4) : room.length, color: null };
}

/** Who to say goodnight to, as one or two things per request; every thing asked at most once per step. */
export function makeRequests(plan: NightPlan, rng: Rng, room: readonly Thing[], color: string | null = null): Thing[][] {
  if (plan.mode === 'all' || plan.mode === 'count') return [];
  if (plan.mode === 'color') return [room.filter(t => COLORS[t].main === color)];
  if (plan.mode === 'except') return [room.filter(t => !isLight(t))];
  if (plan.mode === 'animals') return [room.filter(isAnimal)];
  if (plan.mode === 'lightLast') return [[...room.filter(t => !isLight(t)), ...room.filter(isLight)]];
  const order = rng.shuffle([...room]);
  if (plan.mode === 'named') return order.slice(0, plan.requests).map((t) => [t]);
  return Array.from({ length: plan.requests }, (_, i) => [order[i * 2], order[i * 2 + 1]]);
}

/**
 * Who a capable child says goodnight to next, or null when she is waiting: the first friend in the room still awake (everyone,
 * in any order), or the one the voice named, one at a time and in the order asked. `asleep` holds the things already
 * asleep, `step` how far through this request she is. Always a right one.
 */
export function thingToTap(plan: NightPlan, request: readonly Thing[] | undefined, step: number, asleep: ReadonlySet<Thing>, room: readonly Thing[], targetCount = room.length): Thing | null {
  if (plan.mode === 'count') return asleep.size < targetCount ? room.find(t => !asleep.has(t)) ?? null : null;
  if (plan.mode === 'all') return room.find((t) => !asleep.has(t)) ?? null;
  if (plan.mode === 'lightLast') return request?.find(t => !asleep.has(t) && (!isLight(t) || request.every(other => isLight(other) || asleep.has(other)))) ?? null;
  if (plan.mode === 'animals' || plan.mode === 'color' || plan.mode === 'except') return request?.find(t => !asleep.has(t)) ?? null;
  return request?.[step] ?? null;
}

/** A named request keeps its order; a category accepts any remaining member. */
export function acceptsTap(plan: NightPlan, request: readonly Thing[], step: number, asleep: ReadonlySet<Thing>, thing: Thing, targetCount = Infinity): boolean {
  if (asleep.has(thing)) return false;
  if (plan.mode === 'count') return asleep.size < targetCount;
  if (plan.mode === 'lightLast') return request.includes(thing) && (!isLight(thing) || request.every(t => isLight(t) || asleep.has(t)));
  return plan.mode === 'all' || ((plan.mode === 'animals' || plan.mode === 'color' || plan.mode === 'except') ? request.includes(thing) : request[step] === thing);
}
