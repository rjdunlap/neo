import type { CritterName } from '../../art/critter';
import type { ColorName } from '../../art/palette';
import type { Rng } from '../../engine/random';

/**
 * Mail Carrier, after Paperboy: the pet delivers letters along a little street. A letter
 * shows who it's for (a door color, a number of dots, or a numeral) and the child taps the
 * matching mailbox. A wrong mailbox politely hands the letter back.
 */
export type MailMode = 'drop' | 'color' | 'dots' | 'numeral' | 'count' | 'map' | 'route' | 'shorter' | 'tool' | 'help' | 'teen';

export interface MailPlan {
  /** The level this plan is: the street's levels 9, 10 and 12 sit after the woods' 6–8 in this list, so look it up with `planFor`. */
  level: number;
  mode: MailMode;
  houses: number;
  letters: number;
  /** Highest house number. */
  top: number;
  /** Lowest house number, when the street does not start at 1 (the teens). */
  low?: number;
  name: string;
}

export const PLANS: MailPlan[] = [
  { level: 1, mode: 'drop', houses: 4, letters: 6, top: 4, name: 'Tap any mailbox to post a letter' },
  { level: 2, mode: 'color', houses: 3, letters: 5, top: 3, name: 'Match the letter\'s color to the door' },
  { level: 3, mode: 'dots', houses: 4, letters: 5, top: 5, name: 'Match dots on the letter to dots and numbers on the mailboxes' },
  { level: 4, mode: 'numeral', houses: 5, letters: 5, top: 9, name: 'Deliver to the house number on the letter (1 to 9)' },
  { level: 5, mode: 'count', houses: 5, letters: 5, top: 9, name: 'Count the dots on the letter, then find that house number' },
  // Wonder Woods: a picture map with a key. `letters` counts letters; the route level carries them two at a time.
  { level: 6, mode: 'map', houses: 5, letters: 4, top: 0, name: 'Picture map of Wonder Woods: find who the letter is for in the key, then the house with their sign' },
  { level: 7, mode: 'route', houses: 5, letters: 6, top: 0, name: 'Plan two deliveries on the map in order (letter 1, then 2), then walk the route' },
  { level: 8, mode: 'shorter', houses: 5, letters: 4, top: 0, name: 'Find the house, then choose the shorter of two paths marked with stepping stones' },
  // Levels 9, 10 and 12 are street levels added above the woods.
  { level: 9, mode: 'help', houses: 5, letters: 5, top: 5, name: 'A problem on the letter: tap the helper whose tool fixes it' },
  { level: 10, mode: 'tool', houses: 3, letters: 5, top: 3, name: 'Match the picture on the letter to the tool on the sign' },
  { level: 12, mode: 'teen', houses: 5, letters: 5, top: 20, low: 10, name: 'Deliver to the house number on the letter (10 to 20)' },
];

export const isMapMode = (mode: MailMode) => mode === 'map' || mode === 'route' || mode === 'shorter';

export const planFor = (level: number) => PLANS.find((p) => p.level === level) ?? PLANS[Math.min(8, Math.max(1, level)) - 1];

export const DOOR_COLORS: ColorName[] = ['red', 'blue', 'yellow', 'green', 'purple', 'orange'];

export interface House {
  number: number;
  door: ColorName;
  /** Levels 9 and 10: the picture on this house's sign. */
  tool?: Tool;
  /** Level 9: the helper who lives here. */
  helper?: HelperId;
}

// Tool signs and helpers ---------------------------------------------------------------------------

export const TOOLS = ['wrench', 'bandage', 'can', 'stamp', 'buoy', 'whisk'] as const;
export type Tool = (typeof TOOLS)[number];

/** Level 9's helpers, each with the tool they carry and the problem that tool fixes (one tool per problem). */
export const HELPERS = ['plumber', 'doctor', 'gardener', 'postkeeper', 'lifeguard', 'baker'] as const;
export type HelperId = (typeof HELPERS)[number];

export interface Helper {
  tool: Tool;
  /** "a wrench": the tool as a person would name it. */
  toolName: string;
  /** What the tool is for, said by a house that has the wrong tool. */
  use: string;
  /** The problem on the letter, said after "the". */
  problem: string;
  /** What the helper does, for the journal. */
  fixes: string;
}

export const HELPER: Record<HelperId, Helper> = {
  plumber: { tool: 'wrench', toolName: 'a wrench', use: 'A wrench is for fixing pipes.', problem: 'dripping tap', fixes: 'drips' },
  doctor: { tool: 'bandage', toolName: 'a bandage roll', use: 'A bandage roll is for wrapping a hurt.', problem: 'hurt teddy', fixes: 'hurts' },
  gardener: { tool: 'can', toolName: 'a watering can', use: 'A watering can is for watering plants.', problem: 'drooping flower', fixes: 'thirsty flowers' },
  postkeeper: { tool: 'stamp', toolName: 'a stamp', use: 'A stamp is for sending letters.', problem: 'letter with no stamp', fixes: 'letters with no stamp' },
  lifeguard: { tool: 'buoy', toolName: 'a ring buoy', use: 'A ring buoy is for rescuing in water.', problem: 'boat far out on the pond', fixes: 'boats that drift far out' },
  baker: { tool: 'whisk', toolName: 'a whisk', use: 'A whisk is for baking.', problem: 'candle with no cake', fixes: 'birthdays that need a cake' },
};

export const TOOL_NAME: Record<Tool, string> = {
  wrench: 'a wrench', bandage: 'a bandage roll', can: 'a watering can', stamp: 'a stamp', buoy: 'a ring buoy', whisk: 'a whisk',
};

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** What a helper's house says when a letter lands on the wrong door, and when it lands on the right one. */
export const helpWrong = (h: HelperId, letterFor: HelperId) => ({ tool: HELPER[h].toolName, use: HELPER[h].use, problem: `the ${HELPER[letterFor].problem}` });
export const helpFixed = (h: HelperId) => ({ Tool: cap(HELPER[h].toolName), problem: `the ${HELPER[h].problem}` });

/** Ten-and-ones for a number from 10 to 20: 13 is "Thirteen" and "Ten and three." */
const TEEN_WORDS: Record<number, string> = { 10: 'Ten', 11: 'Eleven', 12: 'Twelve', 13: 'Thirteen', 14: 'Fourteen', 15: 'Fifteen', 16: 'Sixteen', 17: 'Seventeen', 18: 'Eighteen', 19: 'Nineteen', 20: 'Twenty' };
const ONES = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine'];
export function teenSpoken(n: number): { word: string; parts: string } {
  const word = TEEN_WORDS[n] ?? String(n);
  if (n === 10) return { word, parts: 'One ten.' };
  if (n === 20) return { word, parts: 'Two tens.' };
  return { word, parts: `Ten and ${ONES[n - 10]}.` };
}

/** A street of houses, numbered in order left to right (like a real street), each a different door color. */
export function makeStreet(plan: MailPlan, rng: Rng): House[] {
  if (plan.mode === 'tool' || plan.mode === 'help') return makeToolStreet(plan, rng);
  const low = plan.low ?? 1;
  const pool = Array.from({ length: plan.top - low + 1 }, (_, i) => low + i);
  const numbers = rng.shuffle(pool).slice(0, plan.houses).sort((a, b) => a - b);
  const doors = rng.shuffle([...DOOR_COLORS]).slice(0, plan.houses);
  return numbers.map((number, i) => ({ number, door: doors[i] }));
}

/**
 * Level 10 deals two or three houses (the dive's "two the first bag, three from the second" has no round signal to read,
 * so the seed chooses), level 9 five, each with a different tool; their house numbers still rise left to right.
 */
export function makeToolStreet(plan: MailPlan, rng: Rng): House[] {
  const count = plan.mode === 'tool' ? rng.int(2, plan.houses) : plan.houses;
  const doors = rng.shuffle([...DOOR_COLORS]).slice(0, count);
  if (plan.mode === 'help') {
    const helpers = rng.shuffle([...HELPERS]).slice(0, count);
    return helpers.map((helper, i) => ({ number: i + 1, door: doors[i], helper, tool: HELPER[helper].tool }));
  }
  const tools = rng.shuffle([...TOOLS]).slice(0, count);
  return tools.map((tool, i) => ({ number: i + 1, door: doors[i], tool }));
}

/** Who lives on the street: one pool of seven neighbours. The woods map leaves out the dog, the bear's brown look-alike. */
export const NEIGHBORS: CritterName[] = ['cat', 'dog', 'bear', 'bunny', 'pig', 'cow', 'duck'];

/** How a street house is built: two roof shapes, and an optional chimney and window box. Cosmetic only. */
export interface HouseLook {
  roof: 'peak' | 'round';
  chimney: boolean;
  windowBox: boolean;
}

export const houseLooks = (n: number, rng: Rng): HouseLook[] =>
  Array.from({ length: n }, () => ({ roof: rng.chance(0.5) ? 'peak' : 'round', chimney: rng.chance(0.5), windowBox: rng.chance(0.5) }));

/** Colours a mailbox can be: never white, which would hide its white number plate. */
export const MAILBOX_COLORS: ColorName[] = ['red', 'orange', 'yellow', 'green', 'teal', 'blue', 'purple', 'pink', 'brown'];

/** Colours a small child could take for one another (teal for blue, pink for red). */
export const NEAR: Partial<Record<ColorName, ColorName[]>> = {
  red: ['pink', 'orange'], orange: ['red', 'yellow', 'brown'], yellow: ['orange'], green: ['teal'], teal: ['green', 'blue'],
  blue: ['teal', 'purple'], purple: ['blue', 'pink'], pink: ['red', 'purple'], brown: ['orange'],
};

/**
 * The street's mailboxes share one colour, never a door colour in the round, so a colour letter can only mean a door;
 * where the round allows, not a near neighbour of one either.
 */
export function mailboxColor(street: House[], rng: Rng): ColorName {
  const doors = new Set(street.map((h) => h.door));
  const apart = MAILBOX_COLORS.filter((c) => !doors.has(c));
  const far = apart.filter((c) => !street.some((h) => NEAR[h.door]?.includes(c)));
  return rng.pick(far.length ? far : apart);
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
export type LetterShows = 'nothing' | 'color' | 'dots' | 'numeral' | 'tool' | 'problem';
export const letterShows = (mode: MailMode): LetterShows => {
  switch (mode) {
    case 'drop': return 'nothing';
    case 'color': return 'color';
    case 'numeral': case 'teen': return 'numeral';
    case 'tool': return 'tool';
    case 'help': return 'problem';
    default: return 'dots';
  }
};
export const mailboxShows = (mode: MailMode): { numeral: boolean; dots: boolean; tool: boolean } => ({
  numeral: mode !== 'color' && mode !== 'drop' && mode !== 'tool' && mode !== 'help',
  dots: mode === 'dots',
  tool: mode === 'tool' || mode === 'help',
});

/** At levels 3 and 5 the letter's dots are counted aloud before the number is said. */
export const countsAloud = (mode: MailMode) => mode === 'dots' || mode === 'count';

const COUNT_WORDS = ['One', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine'];

/** "One, two, three, four." for a letter with four dots. */
export function countedAloud(n: number): string {
  return `${COUNT_WORDS.slice(0, Math.max(1, Math.min(n, COUNT_WORDS.length))).join(', ')}.`;
}

/** Seconds without a touch before level 1 invites again. */
export const INVITE_AFTER = 6;

/** Level 1 invites (the instruction again, with a mailbox's flag waving) after six quiet seconds while a letter waits. */
export const shouldInvite = (mode: MailMode, idle: number, busy: boolean, finished: boolean) => mode === 'drop' && idle >= INVITE_AFTER && !busy && !finished;

/** The mailbox nearest a touch off the houses, by its x on the street. */
export function nearestHouse(xs: readonly number[], x: number): number {
  let best = 0;
  xs.forEach((hx, i) => {
    if (Math.abs(hx - x) < Math.abs(xs[best] - x)) best = i;
  });
  return best;
}

// Wonder Woods map ---------------------------------------------------------------------------------

/** Signs on the map's houses; the picture key says which neighbor lives behind each one. */
export const SIGNS = ['acorn', 'mushroom', 'leaf', 'flower', 'star'] as const;
export type Sign = (typeof SIGNS)[number];
/** Neighbors that look clearly different at the key's size (the dog and the bear are both brown): the street's pool without the dog. */
export const WOODS_NEIGHBORS: CritterName[] = NEIGHBORS.filter((n) => n !== 'dog');

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
/** A round's map can be the mirror image (left and right swapped): the same paths, stones and walks, drawn the other way round. */
export const mapNode = (n: number, mirrored: boolean) => (mirrored ? { x: 1 - MAP_NODES[n].x, y: MAP_NODES[n].y } : MAP_NODES[n]);

/** A map x in fractions (decor, the stream), reflected with the nodes. */
export const mapX = (x: number, mirrored: boolean) => (mirrored ? 1 - x : x);

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
