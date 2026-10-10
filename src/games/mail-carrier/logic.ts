import type { CritterName } from '../../art/critter';
import type { ColorName } from '../../art/palette';
import type { Rng } from '../../engine/random';

/**
 * Mail Carrier, after Paperboy: the pet delivers letters along a little street. A letter
 * shows who it's for (a door color, a number of dots, or a numeral) and the child taps the
 * matching mailbox. A wrong mailbox politely hands the letter back.
 */
export type MailMode = 'drop' | 'color' | 'dots' | 'numeral' | 'count' | 'map' | 'route' | 'shorter';

export interface MailPlan {
  mode: MailMode;
  houses: number;
  letters: number;
  /** Highest house number. */
  top: number;
  name: string;
}

export const PLANS: MailPlan[] = [
  { mode: 'drop', houses: 4, letters: 6, top: 4, name: 'Tap any mailbox to post a letter' },
  { mode: 'color', houses: 3, letters: 5, top: 3, name: 'Match the letter\'s color to the door' },
  { mode: 'dots', houses: 4, letters: 5, top: 5, name: 'Match dots on the letter to dots and numbers on the mailboxes' },
  { mode: 'numeral', houses: 5, letters: 5, top: 9, name: 'Deliver to the house number on the letter (1 to 9)' },
  { mode: 'count', houses: 5, letters: 5, top: 9, name: 'Count the dots on the letter, then find that house number' },
  // Wonder Woods: a picture map with a key. `letters` counts letters; the route level carries them two at a time.
  { mode: 'map', houses: 5, letters: 4, top: 0, name: 'Picture map of Wonder Woods: find who the letter is for in the key, then the house with their sign' },
  { mode: 'route', houses: 5, letters: 6, top: 0, name: 'Plan two deliveries on the map in order (letter 1, then 2), then walk the route' },
  { mode: 'shorter', houses: 5, letters: 4, top: 0, name: 'Find the house, then choose the shorter of two paths marked with stepping stones' },
];

export const isMapMode = (mode: MailMode) => mode === 'map' || mode === 'route' || mode === 'shorter';

export const planFor = (level: number) => PLANS[Math.min(PLANS.length, Math.max(1, level)) - 1];

export const DOOR_COLORS: ColorName[] = ['red', 'blue', 'yellow', 'green', 'purple', 'orange'];

export interface House {
  number: number;
  door: ColorName;
}

/** A street of houses, numbered in order left to right (like a real street), each a different door color. */
export function makeStreet(plan: MailPlan, rng: Rng): House[] {
  const pool = Array.from({ length: plan.top }, (_, i) => i + 1);
  const numbers = rng.shuffle(pool).slice(0, plan.houses).sort((a, b) => a - b);
  const doors = rng.shuffle([...DOOR_COLORS]).slice(0, plan.houses);
  return numbers.map((number, i) => ({ number, door: doors[i] }));
}

/** Which house each letter goes to: every house gets mail, never the same one twice in a row. */
export function makeLetters(plan: MailPlan, street: House[], rng: Rng): number[] {
  const out: number[] = [];
  const order = rng.shuffle(street.map((_, i) => i));
  for (let i = 0; i < plan.letters; i++) {
    let h = order[i % order.length];
    if (h === out[i - 1]) h = (h + 1) % street.length;
    out.push(h);
  }
  return out;
}

/** What the letter shows, and what the mailboxes show, at each level. */
export const letterShows = (mode: MailMode): 'nothing' | 'color' | 'dots' | 'numeral' => (mode === 'drop' ? 'nothing' : mode === 'color' ? 'color' : mode === 'numeral' ? 'numeral' : 'dots');
export const mailboxShows = (mode: MailMode): { numeral: boolean; dots: boolean } => ({ numeral: mode !== 'color' && mode !== 'drop', dots: mode === 'dots' });

// Wonder Woods map ---------------------------------------------------------------------------------

/** Signs on the map's houses; the picture key says which neighbor lives behind each one. */
export const SIGNS = ['acorn', 'mushroom', 'leaf', 'flower', 'star'] as const;
export type Sign = (typeof SIGNS)[number];
/** Neighbors that look clearly different at the key's size (the dog and the bear are both brown). */
export const WOODS_NEIGHBORS: CritterName[] = ['cat', 'bear', 'bunny', 'pig', 'cow', 'duck'];

/**
 * The map's paths as a small graph, in fractions of the map. Node 0 is the hollow-tree post office;
 * nodes 1–5 are houses; the rest are forks in the path.
 */
export const MAP_NODES: { x: number; y: number }[] = [
  { x: 0.5, y: 0.86 },
  { x: 0.13, y: 0.2 },
  { x: 0.42, y: 0.14 },
  { x: 0.76, y: 0.15 },
  { x: 0.88, y: 0.64 },
  { x: 0.14, y: 0.7 },
  { x: 0.5, y: 0.56 },
  { x: 0.27, y: 0.42 },
  { x: 0.72, y: 0.42 },
];
export const POST_OFFICE = 0;
export const HOUSE_NODES = [1, 2, 3, 4, 5];
export const MAP_EDGES: [number, number][] = [
  [0, 6], [6, 7], [7, 1], [7, 5], [6, 2], [6, 8], [8, 3], [8, 4],
];

/** Level 8 adds a loop between the two forks. Its four stepping stones make that detour easy to compare. */
export const SHORTER_EDGES: [number, number, number][] = [...MAP_EDGES.map(([a, b]) => [a, b, 1] as [number, number, number]), [7, 8, 4]];

/** All simple routes from the post office to a house, ordered shortest first. */
export function routeChoices(house: number): number[][] {
  const target = HOUSE_NODES[house];
  const paths: number[][] = [];
  const visit = (at: number, path: number[]) => {
    if (at === target) { paths.push(path); return; }
    for (const [a, b] of SHORTER_EDGES) {
      const next = a === at ? b : b === at ? a : -1;
      if (next >= 0 && !path.includes(next)) visit(next, [...path, next]);
    }
  };
  visit(POST_OFFICE, [POST_OFFICE]);
  return paths.sort((a, b) => routeLength(a) - routeLength(b));
}

export function routeLength(path: number[]): number {
  let total = 0;
  for (let i = 1; i < path.length; i++) {
    const edge = SHORTER_EDGES.find(([a, b]) => (a === path[i - 1] && b === path[i]) || (b === path[i - 1] && a === path[i]));
    if (edge) total += edge[2];
  }
  return total;
}

/** The shortest route and the longest alternative; every eligible house has two routes at least two stones apart. */
export function shorterRoutes(house: number): [number[], number[]] {
  const paths = routeChoices(house);
  return [paths[0], paths.at(-1)!];
}

/** The shortest walk along the paths from one node to another, both ends included. */
export function walk(from: number, to: number): number[] {
  const prev = new Map<number, number>([[from, from]]);
  const queue = [from];
  while (queue.length) {
    const n = queue.shift()!;
    if (n === to) break;
    for (const [a, b] of MAP_EDGES) {
      const m = a === n ? b : b === n ? a : -1;
      if (m >= 0 && !prev.has(m)) {
        prev.set(m, n);
        queue.push(m);
      }
    }
  }
  const out = [to];
  while (out[0] !== from) out.unshift(prev.get(out[0])!);
  return out;
}

/** From the post office through each stop in order. */
export function route(stops: number[]): number[] {
  const out = [POST_OFFICE];
  for (const s of stops) out.push(...walk(out[out.length - 1], HOUSE_NODES[s]).slice(1));
  return out;
}

export interface WoodsHouse {
  resident: CritterName;
  sign: Sign;
}

/** Five houses, each with a different neighbor and sign, shuffled so the key has to be read every time. */
export function makeWoods(rng: Rng): WoodsHouse[] {
  const residents = rng.shuffle([...WOODS_NEIGHBORS]).slice(0, HOUSE_NODES.length);
  const signs = rng.shuffle([...SIGNS]);
  return residents.map((resident, i) => ({ resident, sign: signs[i] }));
}

/**
 * The deliveries, as house indexes: one letter at a time on the map level, then pairs on the route level.
 * No house gets two letters in a row, and a pair never sends both letters to one house.
 */
export function makeTrips(plan: MailPlan, rng: Rng): number[][] {
  const per = plan.mode === 'route' ? 2 : 1;
  const trips: number[][] = [];
  let last = -1;
  const order: number[] = [];
  const destinations = plan.mode === 'shorter' ? [0, 2, 3, 4] : HOUSE_NODES.map((_, i) => i);
  while (order.length < plan.letters) order.push(...rng.shuffle(destinations));
  for (let i = 0; i < plan.letters; i += per) {
    const trip: number[] = [];
    while (trip.length < per) {
      const k = order.findIndex((h) => h !== last && !trip.includes(h));
      if (k < 0) {
        order.push(...rng.shuffle(HOUSE_NODES.map((_, j) => j)));
        continue;
      }
      const [h] = order.splice(k, 1);
      trip.push(h);
      last = h;
    }
    trips.push(trip);
  }
  return trips;
}

/** Planning a trip: is this house the next stop, a stop that comes later, already planned, or nobody's letter? */
export function checkStop(trip: number[], planned: number[], house: number): 'ok' | 'later' | 'planned' | 'nobody' {
  if (planned.includes(house)) return 'planned';
  if (!trip.includes(house)) return 'nobody';
  return trip[planned.length] === house ? 'ok' : 'later';
}

/** The house on the street a letter is addressed to, or null when the letters have run out. The demonstration posts there. */
export const addressedHouse = (letters: number[], index: number): number | null => letters[index] ?? null;

/** What the demonstration touches in the woods: a house on the map, or the walk button once a trip is fully planned. */
export type WoodsTouch = { house: number } | 'go';

/**
 * Map level: the house of the letter's neighbor. Route level: the next stop in letter order (the one `checkStop` calls
 * ok), and, once every stop is planned, the green walk button.
 */
export function woodsTouch(mode: MailMode, trip: number[], planned: number[]): WoodsTouch | null {
  if (!trip.length) return null;
  if (mode === 'map' || mode === 'shorter') return { house: trip[0] };
  return planned.length < trip.length ? { house: trip[planned.length] } : 'go';
}
