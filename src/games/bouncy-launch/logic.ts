import type { Rng } from '../../engine/random';
import type { BandLevels } from '../../progress/difficulty';

/**
 * Bouncy Launch, after Kass Basher, Toss the Turtle and the other launcher games: pull the
 * pet back on a big spring and let go. Farther pull, farther flight. Every landing is soft;
 * the ladder asks for a particular landing spot.
 */
export type LaunchMode =
  | 'tap'
  | 'free'
  | 'star'
  | 'number'
  | 'compare'
  | 'predict'
  | 'friend'
  | 'planet'
  | 'between'
  | 'nearfar'
  | 'meadow'
  | 'line';

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

/**
 * Level 13, Flower meadow (lap's opening): a touch anywhere bounces the pet, and each landing leaves a flower, so the
 * meadow fills because she touched. 13 was the next clear ID (11 is still unused and falls back to level 1).
 */
export const MEADOW_LEVEL = 13;
export const MEADOW_PLAN: LaunchPlan = {
  mode: 'meadow',
  shots: 5,
  name: 'Touch anywhere: the pet bounces, and each landing leaves a flower',
};

export const LEVELS: BandLevels = {
  // Lap opens on the flower meadow, then the tap-the-spring level; no other band lists 13.
  lap: { min: 1, max: MEADOW_LEVEL, order: [MEADOW_LEVEL, 1] },
  // Level 8, Near or far, is an easy entry: two big clouds before the star level's single small one.
  toddler: { min: 1, max: 8, order: [1, 2, 8, 3] },
  preschool: { min: 2, max: 8, order: [2, 8, 3, 4] },
  // Level 7, Feed the friend, comes after the numbered clouds and before comparing.
  prek: { min: 3, max: 7, order: [3, 4, 7, 5] },
  // Level 9, Between two flights, follows the single shown pull of level 6; level 10 puts a shown pull on a number line.
  school: { min: 4, max: 12, order: [4, 5, 7, 6, 9, 10, 12] },
};

/** Level 7, Feed the friend: the next free ID after the six first levels. */
export const FRIEND_LEVEL = 7;
export const FRIEND_PLAN: LaunchPlan = {
  mode: 'friend',
  shots: 3,
  name: 'Bring a friend a snack, learning from the last flight',
};

export const PLANET_LEVEL = 12;
export const PLANET_PLAN: LaunchPlan = {
  mode: 'planet',
  shots: 3,
  name: 'The same pull on a light or a heavy planet: past the flag or before it?',
};
/** Level 9, Between two flights: two shown pulls leave flags, then a pull between them is predicted. */
export const BETWEEN_LEVEL = 9;
export const BETWEEN_PLAN: LaunchPlan = {
  mode: 'between',
  shots: 3,
  name: 'Two shown pulls fly; predict where a pull between them lands',
};
/** Level 8, Near or far: an easy entry for toddler and preschool, placed before the star level by `order`. */
export const NEAR_FAR_LEVEL = 8;
export const NEAR_FAR_PLAN: LaunchPlan = {
  mode: 'nearfar',
  shots: 5,
  name: 'Two big clouds: land on the near one or the far one',
};
/** Level 10, Where on the line?: a shown pull, and she taps the number on a 1-10 line where she thinks it will land. */
export const LINE_LEVEL = 10;
export const LINE_PLAN: LaunchPlan = {
  mode: 'line',
  shots: 3,
  name: 'A shown pull: tap the number on a 1 to 10 line where the pet will land, then see how close',
};
const PLANS_BY_ID: Record<number, LaunchPlan> = Object.fromEntries([
  ...PLANS.map((p, i) => [i + 1, p]),
  [FRIEND_LEVEL, FRIEND_PLAN],
  [NEAR_FAR_LEVEL, NEAR_FAR_PLAN],
  [BETWEEN_LEVEL, BETWEEN_PLAN],
  [LINE_LEVEL, LINE_PLAN],
  [PLANET_LEVEL, PLANET_PLAN],
  [MEADOW_LEVEL, MEADOW_PLAN],
]);
export const planFor = (level: number) => PLANS_BY_ID[level] ?? PLANS[0];

export const LIGHT = 0.5;
export const HEAVY = 2;
export type Planet = 'light' | 'heavy';
export interface PlanetPair {
  base: number;
  planet: Planet;
}
export const gravityFor = (planet: Planet) => (planet === 'light' ? LIGHT : HEAVY);
export const airtimeFor = (planet: Planet) => (planet === 'light' ? 1.5 : 0.8);
/** Three distinct home flags and both toy worlds, in seeded order. */
export function planetPairs(rng: Rng): PlanetPair[] {
  const planets = rng.shuffle<Planet>(['light', 'heavy', rng.pick<Planet>(['light', 'heavy'])]);
  return rng.shuffle([0.2, 0.3, 0.4]).map((base, i) => ({ base, planet: planets[i] }));
}
/** Full-height regions split at the home flag, including the spring area. */
export const planetSide = (x: number, flagX: number): 'before' | 'past' => (x < flagX ? 'before' : 'past');
export const planetBotLanding = (pair: PlanetPair) => reach(pullFor(pair.base), gravityFor(pair.planet));

/** A short pull, a long pull and the pull between them, as pad indices (`low < mid < high`). */
export interface BetweenTriple {
  low: number;
  mid: number;
  high: number;
}

/**
 * Every (low, mid, high) on the five clouds with at least one cloud strictly between the flags. The middle pull is
 * always the midpoint of the two shown pulls, so "the pull is between them, so it lands between them" is literally
 * true, and on a wide gap the cloud it reaches is the one halfway along, not merely one of several in between.
 */
export const BETWEEN_TRIPLES: BetweenTriple[] = [
  { low: 0, mid: 1, high: 2 },
  { low: 1, mid: 2, high: 3 },
  { low: 2, mid: 3, high: 4 },
  { low: 0, mid: 2, high: 4 },
];

/** Three rounds: three different triples, never the same middle cloud twice running. */
export function betweenTriples(rng: Rng, rounds = 3): BetweenTriple[] {
  for (;;) {
    const out = rng.shuffle(BETWEEN_TRIPLES.slice()).slice(0, rounds);
    if (out.every((t, i) => i === 0 || t.mid !== out[i - 1].mid)) return out;
  }
}

/** Level 10's number line: ten ticks, numbered 1 to 10, evenly along the landing strip. */
export const TICKS = 10;
/** Where tick `i` (0-based; it shows the number i + 1) sits, as a fraction along the strip. */
export const tickAt = (i: number) => (i + 0.5) / TICKS;
/**
 * The tick nearest a point at fraction `f` along the strip, clamped to the line. The ticks are display marks only (ten
 * across the strip are about 56 units apart); a tap anywhere over the line is routed to the nearest one.
 */
export const nearestTick = (f: number) => Math.max(0, Math.min(TICKS - 1, Math.round(f * TICKS - 0.5)));
/** The line's thirds, as ticks: 1-3, 4-7 and 8-10. */
export const LINE_THIRDS: readonly (readonly number[])[] = [
  [0, 1, 2],
  [3, 4, 5, 6],
  [7, 8, 9],
];

/**
 * Where level 10's shown pulls land, as ticks: one in each third of the line in a seeded order, and consecutive answers
 * at least two apart, so no answer is "the same as last time, give or take".
 */
export function lineTargets(rng: Rng, shots = 3): number[] {
  for (;;) {
    const out = rng
      .shuffle(LINE_THIRDS.slice())
      .slice(0, shots)
      .map((third) => rng.pick(third as number[]));
    if (out.every((t, i) => i === 0 || Math.abs(t - out[i - 1]) >= 2)) return out;
  }
}

/** The flower meadow's landings stay on this stretch of grass. */
export const MEADOW_RANGE = { min: 0.06, max: 0.96 } as const;

/**
 * Where the flower meadow's landings come down: one in each fifth of the grass (a little seeded jitter), in a seeded
 * order, so the five flowers stand apart and the meadow fills from all over rather than in a row.
 */
export function meadowLandings(rng: Rng, shots = 5): number[] {
  const w = (MEADOW_RANGE.max - MEADOW_RANGE.min) / shots;
  const spots = Array.from({ length: shots }, (_, i) => {
    const f = MEADOW_RANGE.min + (i + 0.5) * w + rng.range(-0.15, 0.15) * w;
    return Math.round(f * 1000) / 1000;
  });
  return rng.shuffle(spots);
}

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
export function revealsPullRule(
  landings: readonly number[],
  gap = 0.15,
  couch = false,
  course = false,
): boolean {
  return !couch && !course && landings.length >= 2 && Math.max(...landings) - Math.min(...landings) >= gap;
}

/** Where pad `i` (0-based) sits, as a fraction along the landing strip. */
export const padAt = (i: number) => (i + 0.5) / PADS;

/** Which pad a landing at fraction `f` touches, or -1 for the grass between. Pads are generous. */
export function padHit(f: number, width = 0.85): number {
  const i = Math.round(f * PADS - 0.5);
  if (i < 0 || i >= PADS) return -1;
  return Math.abs(f - padAt(i)) <= width / PADS / 2 ? i : -1;
}

/**
 * Near or far: the two big clouds' centres along the strip. A shortest pull lands inside the near window and a full pull
 * (which `reach` clamps to 1) inside the far one, so no pull is ever "too far" for a cloud it can reach; a clear stretch
 * of grass (about 28 pull units) lies between the windows.
 */
export const NEAR_FAR = [0.2, 0.8] as const;
/** How far from a cloud's centre a landing still counts: a coarse "a little" or "a lot", not a ±12-unit aim. */
export const NEAR_FAR_WINDOW = 0.2;

/** How many landing clouds a plan draws. */
export const cloudCount = (plan: LaunchPlan) =>
  plan.mode === 'nearfar' ? NEAR_FAR.length : plan.mode === 'line' ? 0 : PADS;
/** Where cloud `i` of a plan sits along the strip: the two big clouds at Near or far, the five numbered clouds otherwise. */
export const cloudAt = (plan: LaunchPlan, i: number) =>
  plan.mode === 'nearfar' ? NEAR_FAR[i] : plan.mode === 'line' ? tickAt(i) : padAt(i);

/** The pads to aim for, one per shot, never the same twice running (at Near or far, the two clouds take turns from a seeded start). */
export function targets(plan: LaunchPlan, rng: Rng): number[] {
  if (plan.mode === 'line') return lineTargets(rng, plan.shots);
  if (plan.mode === 'nearfar') {
    const first = rng.int(0, 1);
    return Array.from({ length: plan.shots }, (_, i) => (first + i) % 2);
  }
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
    if (out.every((o) => Math.abs(o - f) >= FRIEND_GAP)) out.push(f);
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
export function judge(
  plan: LaunchPlan,
  f: number,
  target: number,
  ask?: 'farther' | 'nearer',
  last?: number,
  width = 0.85,
): Verdict {
  // A prediction is an observation, rather than an accuracy test: every chosen answer gets to see its result.
  if (
    plan.mode === 'tap' ||
    plan.mode === 'meadow' ||
    plan.mode === 'free' ||
    plan.mode === 'predict' ||
    plan.mode === 'planet' ||
    plan.mode === 'between' ||
    plan.mode === 'line'
  )
    return 'yes';
  if (plan.mode === 'compare') {
    if (last === undefined) return 'yes';
    if (ask === 'farther') return f > last + 0.04 ? 'yes' : 'short';
    return f < last - 0.04 ? 'yes' : 'long';
  }
  if (plan.mode === 'nearfar') {
    const at = NEAR_FAR[target];
    if (Math.abs(f - at) <= NEAR_FAR_WINDOW) return 'yes';
    return f < at ? 'short' : 'long';
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
export function pullToTake(
  plan: LaunchPlan,
  shot: number,
  targets: readonly number[],
  last?: number,
  spots: readonly number[] = [],
): number {
  switch (plan.mode) {
    case 'tap':
    case 'meadow':
      return 0;
    case 'free':
      // Short, long, middle, longer: a bigger pull goes farther, so the pulls are seen to differ.
      return pullFor([0.35, 0.8, 0.55, 0.95][shot % 4]);
    case 'star':
    case 'number':
    case 'nearfar':
      return pullFor(cloudAt(plan, targets[shot]));
    case 'compare': {
      if (last === undefined) return pullFor(0.5);
      return pullFor(nextAsk(last) === 'farther' ? last + 0.3 : last - 0.3);
    }
    case 'friend':
      return pullFor(spots[shot]);
    case 'planet':
      return 0; // Planet Hop shows its own fixed pull; the bot chooses a region.
    case 'predict':
    case 'between':
      // The child does not pull at these levels; this is the fixed pull shown on screen (the middle one at level 9).
      return pullFor(padAt(targets[shot]));
    case 'line':
      // Level 10's shown pull, which lands on the centre of its tick.
      return pullFor(tickAt(targets[shot]));
  }
}
