import type { Rng } from '../../engine/random';

/**
 * Bouncy Launch, after Kass Basher, Toss the Turtle and the other launcher games: pull the
 * pet back on a big spring and let go. Farther pull, farther flight. Every landing is soft;
 * the ladder asks for a particular landing spot.
 */
export type LaunchMode = 'tap' | 'free' | 'star' | 'number' | 'compare' | 'predict' | 'friend' | 'planet';

export interface LaunchPlan {
  mode: LaunchMode;
  /** Launches in a round. */
  shots: number;
  name: string;
}

export const PLANS: LaunchPlan[] = [
  { mode: 'tap', shots: 5, name: 'Tap the spring: boing! The pet bounces and lands softly' },
  { mode: 'free', shots: 4, name: 'Pull back and let go; a bigger pull goes farther' },
  { mode: 'star', shots: 3, name: 'Land on the cloud with the star' },
  { mode: 'number', shots: 3, name: 'Land on a numbered cloud: "land on 3"' },
  { mode: 'compare', shots: 4, name: 'Farther or not as far as last time' },
  { mode: 'predict', shots: 4, name: 'Watch a shown pull and predict which cloud the pet will reach' },
];

/** Level 7, Feed the friend: the next free ID (the deep dive's Near or far will take the next one when it is built). */
export const FRIEND_LEVEL = 7;
export const FRIEND_PLAN: LaunchPlan = { mode: 'friend', shots: 3, name: 'Bring a friend a snack, learning from the last flight' };

export const PLANET_LEVEL = 12;
export const PLANET_PLAN: LaunchPlan = { mode: 'planet', shots: 3, name: 'The same pull on a light or a heavy planet: past the flag or before it?' };
const PLANS_BY_ID: Record<number, LaunchPlan> = Object.fromEntries([...PLANS.map((p, i) => [i + 1, p]), [FRIEND_LEVEL, FRIEND_PLAN], [PLANET_LEVEL, PLANET_PLAN]]);
export const planFor = (level: number) => PLANS_BY_ID[level] ?? PLANS[0];

export const LIGHT = 0.5;
export const HEAVY = 2;
export type Planet = 'light' | 'heavy';
export interface PlanetPair { base: number; planet: Planet }
export const gravityFor = (planet: Planet) => planet === 'light' ? LIGHT : HEAVY;
export const airtimeFor = (planet: Planet) => planet === 'light' ? 1.5 : 0.8;
/** Three distinct home flags and both toy worlds, in seeded order. */
export function planetPairs(rng: Rng): PlanetPair[] {
  const planets = rng.shuffle<Planet>(['light', 'heavy', rng.pick<Planet>(['light', 'heavy'])]);
  return rng.shuffle([0.2, 0.3, 0.4]).map((base, i) => ({ base, planet: planets[i] }));
}
/** Full-height regions split at the home flag, including the spring area. */
export const planetSide = (x: number, flagX: number): 'before' | 'past' => x < flagX ? 'before' : 'past';
export const planetBotLanding = (pair: PlanetPair) => reach(pullFor(pair.base), gravityFor(pair.planet));

/** Landing clouds, numbered 1 to 5 from nearest to farthest. */
export const PADS = 5;
/** The pull that counts at all, and the strongest pull. */
export const MIN_PULL = 30;
export const MAX_PULL = 170;

/** How far a pull sends the pet, as a fraction 0..1 of the way from the nearest landing to the farthest. */
export function reach(pull: number, gravity = 1): number {
  const t = (Math.min(MAX_PULL, Math.max(MIN_PULL, pull)) - MIN_PULL) / (MAX_PULL - MIN_PULL);
  // Linear distance: equal extra pulls travel equal extra distances.
  return t / gravity;
}

/** The pull needed to land at fraction `f` (the inverse of `reach`). */
export function pullFor(f: number): number {
  return MIN_PULL + Math.max(0, Math.min(1, f)) * (MAX_PULL - MIN_PULL);
}

/** Two plainly different pulls reveal the game's stated rule: the bigger pull lands farther away. */
export function revealsPullRule(landings: readonly number[], gap = 0.15, couch = false, course = false): boolean {
  return !couch && !course && landings.length >= 2 && Math.max(...landings) - Math.min(...landings) >= gap;
}

/** Where pad `i` (0-based) sits, as a fraction along the landing strip. */
export const padAt = (i: number) => (i + 0.5) / PADS;

/** Which pad a landing at fraction `f` touches, or -1 for the grass between. Pads are generous. */
export function padHit(f: number, width = 0.85): number {
  const i = Math.round(f * PADS - 0.5);
  if (i < 0 || i >= PADS) return -1;
  return Math.abs(f - padAt(i)) <= (width / PADS) / 2 ? i : -1;
}

/** The pads to aim for, one per shot, never the same twice running. */
export function targets(plan: LaunchPlan, rng: Rng): number[] {
  const out: number[] = [];
  for (let i = 0; i < plan.shots; i++) {
    let t = rng.int(0, PADS - 1);
    while (t === out[i - 1]) t = rng.int(0, PADS - 1);
    out.push(t);
  }
  return out;
}

/** Where a friend can stand along the strip, and how close a landing must be to feed it (as wide as a cloud). */
export const FRIEND_RANGE = { min: 0.12, max: 0.92 } as const;
export const FRIEND_WINDOW = 0.09;
/** Friends in one round stand at least this far apart, so each shot needs a different pull. */
export const FRIEND_GAP = 0.2;

/** Where the friend stands for each shot: seeded, anywhere on the grass, never close to the last spot or any earlier one. */
export function friendSpots(plan: LaunchPlan, rng: Rng): number[] {
  const out: number[] = [];
  while (out.length < plan.shots) {
    const f = Math.round(rng.range(FRIEND_RANGE.min, FRIEND_RANGE.max) * 100) / 100;
    if (out.every(o => Math.abs(o - f) >= FRIEND_GAP)) out.push(f);
  }
  return out;
}

/** Did the pet land close enough to the friend to share the snack? A miss says which way to go. */
export function judgeFriend(f: number, spot: number): Verdict {
  if (Math.abs(f - spot) <= FRIEND_WINDOW) return 'yes';
  return f < spot ? 'short' : 'long';
}

export type Verdict = 'yes' | 'short' | 'long';

/** Did a landing meet the ask? `last` is the previous landing for compare levels; `width` is how forgiving the clouds are. */
export function judge(plan: LaunchPlan, f: number, target: number, ask?: 'farther' | 'nearer', last?: number, width = 0.85): Verdict {
  // A prediction is an observation, rather than an accuracy test: every chosen answer gets to see its result.
  if (plan.mode === 'tap' || plan.mode === 'free' || plan.mode === 'predict' || plan.mode === 'planet') return 'yes';
  if (plan.mode === 'compare') {
    if (last === undefined) return 'yes';
    if (ask === 'farther') return f > last + 0.04 ? 'yes' : 'short';
    return f < last - 0.04 ? 'yes' : 'long';
  }
  const hit = padHit(f, width);
  if (hit === target) return 'yes';
  return f < padAt(target) ? 'short' : 'long';
}

/** Compare levels: after a far landing ask for nearer, after a near one ask for farther. */
export function nextAsk(last: number): 'farther' | 'nearer' {
  return last > 0.55 ? 'nearer' : 'farther';
}

/** How far back a capable child pulls the spring for launch number `shot` (from 0): the pull that lands on the target cloud, a different one each time on free levels, and a clear step farther or nearer than last time when asked. */
export function pullToTake(plan: LaunchPlan, shot: number, targets: readonly number[], last?: number, spots: readonly number[] = []): number {
  switch (plan.mode) {
    case 'tap':
      return 0;
    case 'free':
      // Short, long, middle, longer: a bigger pull goes farther, so the pulls are seen to differ.
      return pullFor([0.35, 0.8, 0.55, 0.95][shot % 4]);
    case 'star':
    case 'number':
      return pullFor(padAt(targets[shot]));
    case 'compare': {
      if (last === undefined) return pullFor(0.5);
      return pullFor(nextAsk(last) === 'farther' ? last + 0.3 : last - 0.3);
    }
    case 'friend':
      return pullFor(spots[shot]);
    case 'planet':
      return 0; // Planet Hop shows its own fixed pull; the bot chooses a region.
    case 'predict':
      // The child does not pull at this level; this is the fixed pull shown on screen.
      return pullFor(padAt(targets[shot]));
  }
}
