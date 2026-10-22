import type { Rng } from '../../engine/random';
import type { BandLevels } from '../../progress/difficulty';

/**
 * Sea Lift: a glass lift runs from a cliff ledge in the sky to the sea floor, and the water line is zero. Stops are the
 * integers −5..5, counted from the water both ways (level 1), rides pass through it (level 2), and lower is less even when
 * the number looks bigger (level 3). Order is drawn as height, to scale, so a wrong stop is visibly wrong.
 */

export const TOP = 5;
export const STOPS = [5, 4, 3, 2, 1, 0, -1, -2, -3, -4, -5] as const;

export const LEVELS: BandLevels = { school: { min: 1, max: 3 } };

export type LevelId = 1 | 2 | 3;
export interface Plan { id: LevelId; name: string }
export const PLANS: readonly Plan[] = [
  { id: 1, name: 'Up or down? Stops from the water' },
  { id: 2, name: 'Through the water: rides that cross zero' },
  { id: 3, name: 'Deepest first: order heights across the water' },
];
export const planFor = (level: number): Plan => PLANS[Math.max(0, Math.min(PLANS.length - 1, Math.round(level) - 1))];

/** Friends who live above the water (critters) and below it (sea friends). */
export type LandFriend = 'duck' | 'cat' | 'bunny' | 'pig';
export type SeaFriend = 'fish' | 'turtle' | 'penguin';
export type Friend = LandFriend | SeaFriend;
export const LAND_FRIENDS: readonly LandFriend[] = ['duck', 'cat', 'bunny', 'pig'];
export const SEA_FRIENDS: readonly SeaFriend[] = ['fish', 'turtle', 'penguin'];

/** A ride: level 1 always starts at the dock (0); level 2 starts on one side of the water and ends on the other. */
export interface Ride { friend: Friend; from: number; to: number }
/** Level 3: three friends at different stops, picked up deepest or highest first. */
export interface PickCase { mode: 'deepest' | 'highest'; friends: { friend: Friend; stop: number }[] }
export type Item = { kind: 'ride'; ride: Ride } | { kind: 'pick'; pick: PickCase };

/* Words --------------------------------------------------------------------------------------------- */

const WORDS = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'];
export const word = (n: number) => WORDS[Math.abs(n)] ?? String(Math.abs(n));
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** A stop's spoken name: "the water", "three above the water", "two below the water". Never a bare sign. */
export function stopName(stop: number, capital = false): string {
  const s = stop === 0 ? 'the water' : `${word(stop)} ${stop > 0 ? 'above' : 'below'} the water`;
  return capital ? cap(s) : s;
}
/** The numeral on a landing: 3 above, −3 below (a true minus sign), 0 at the dock. */
export const numeral = (stop: number) => (stop < 0 ? `−${-stop}` : String(stop));

/** Every stop a ride passes, after its start, in order. */
export function path(from: number, to: number): number[] {
  const out: number[] = [], dir = Math.sign(to - from);
  for (let s = from + dir; dir !== 0 && s !== to + dir; s += dir) out.push(s);
  return out;
}
export const crossesZero = (r: { from: number; to: number }) => Math.sign(r.from) * Math.sign(r.to) < 0;

/** The ride counted aloud: "One, two, the water, four" — the water is named where the lift passes it. */
export function countAloud(from: number, to: number): string {
  return cap(path(from, to).map((s, i) => (s === 0 ? 'the water' : word(i + 1))).join(', '));
}

/** What a friend asks: level 1 names the stop ("three above the water"), level 2 only the count and direction ("five down"). */
export function request(level: LevelId, ride: Ride): { line: 'sealift.ask.up' | 'sealift.ask.down' | 'sealift.ride.up' | 'sealift.ride.down'; n: string; up: boolean; count: number } {
  const d = ride.to - ride.from, up = d > 0, count = Math.abs(d);
  const line = level === 1 ? (up ? 'sealift.ask.up' : 'sealift.ask.down') : up ? 'sealift.ride.up' : 'sealift.ride.down';
  return { line, n: word(count), up, count };
}

/* Rounds -------------------------------------------------------------------------------------------- */

const friendFor = (rng: Rng, stop: number): Friend => (stop > 0 ? rng.pick(LAND_FRIENDS) : rng.pick(SEA_FRIENDS));

export function level1(rng: Rng): Ride[] {
  for (;;) {
    const stops: number[] = [];
    while (stops.length < 5) {
      const s = rng.int(1, 5) * (rng.chance(0.5) ? 1 : -1);
      if (s !== stops[stops.length - 1]) stops.push(s);
    }
    if (stops.filter((s) => s > 0).length >= 2 && stops.filter((s) => s < 0).length >= 2) {
      return stops.map((to) => ({ friend: friendFor(rng, to), from: 0, to }));
    }
  }
}

export function level2(rng: Rng): Ride[] {
  for (;;) {
    const rides: Ride[] = [];
    while (rides.length < 5) {
      const s = rng.int(1, 4) * (rng.chance(0.5) ? 1 : -1);
      const options: number[] = [];
      for (let to = -TOP; to <= TOP; to++) if (to !== 0 && Math.sign(to) !== Math.sign(s)) options.push(to);
      const to = rng.pick(options);
      const last = rides[rides.length - 1];
      if (last && last.from === s && last.to === to) continue;
      rides.push({ friend: friendFor(rng, s), from: s, to });
    }
    if (rides.filter((r) => r.from > 0).length >= 2 && rides.filter((r) => r.from < 0).length >= 2) return rides;
  }
}

function pickCase(rng: Rng, mode: PickCase['mode'], above: boolean): PickCase {
  for (;;) {
    const below = rng.shuffle([-1, -2, -3, -4, -5]).slice(0, above ? 2 : 3);
    const stops = above ? [...below, rng.int(1, 5)] : below;
    const friends = rng.shuffle(stops.map((stop) => ({ friend: friendFor(rng, stop), stop })));
    if (new Set(friends.map((f) => f.friend)).size === 3) return { mode, friends };
  }
}

export function level3(rng: Rng): PickCase[] {
  const modes = rng.shuffle<PickCase['mode']>(['deepest', 'highest', rng.pick(['deepest', 'highest'] as const)]);
  const withAbove = rng.int(0, 2);
  return modes.map((m, i) => pickCase(rng, m, i === withAbove || rng.chance(0.4)));
}

/** The first round of each level, authored so the how-to card and its demonstration open on the same story. */
export const AUTHORED: Record<LevelId, Item[]> = {
  1: [
    { friend: 'duck', from: 0, to: 3 },
    { friend: 'fish', from: 0, to: -2 },
    { friend: 'cat', from: 0, to: 4 },
    { friend: 'turtle', from: 0, to: -5 },
    { friend: 'penguin', from: 0, to: -1 },
  ].map((ride) => ({ kind: 'ride' as const, ride: ride as Ride })),
  2: [
    { friend: 'bunny', from: 2, to: -3 },
    { friend: 'turtle', from: -1, to: 3 },
    { friend: 'penguin', from: -2, to: 2 },
    { friend: 'cat', from: 1, to: -4 },
    { friend: 'fish', from: -3, to: 1 },
  ].map((ride) => ({ kind: 'ride' as const, ride: ride as Ride })),
  3: [
    { mode: 'deepest', friends: [{ friend: 'fish', stop: -5 }, { friend: 'penguin', stop: -2 }, { friend: 'cat', stop: 3 }] },
    { mode: 'highest', friends: [{ friend: 'turtle', stop: -1 }, { friend: 'duck', stop: 4 }, { friend: 'fish', stop: -4 }] },
    { mode: 'deepest', friends: [{ friend: 'bunny', stop: 2 }, { friend: 'penguin', stop: -3 }, { friend: 'fish', stop: -1 }] },
  ].map((pick) => ({ kind: 'pick' as const, pick: pick as PickCase })),
};

export function makeRound(level: LevelId, rng: Rng, authored: boolean): Item[] {
  if (authored) return AUTHORED[level];
  if (level === 1) return level1(rng).map((ride) => ({ kind: 'ride', ride }));
  if (level === 2) return level2(rng).map((ride) => ({ kind: 'ride', ride }));
  return level3(rng).map((pick) => ({ kind: 'pick', pick }));
}

/** A case's friends in the order asked: lowest first for deepest, highest first for highest. */
export const pickOrder = (c: PickCase) => [...c.friends].sort((a, b) => (c.mode === 'deepest' ? a.stop - b.stop : b.stop - a.stop));

/* Play ---------------------------------------------------------------------------------------------- */

export interface RoundState {
  level: LevelId;
  items: Item[];
  /** The request or case in play. */
  index: number;
  /** Level 3: stops already picked up in this case. */
  picked: number[];
  /** Where the lift is. */
  car: number;
  /** Distinct wrong stops tapped for the request in play (a request at level 3 is one pick-up). */
  wrong: number[];
  /** The right stop glows for the request in play (after two misses or Show a hint); counted once per request. */
  hinted: boolean;
  misses: number;
  hints: number;
  done: boolean;
}

export function roundState(level: LevelId, items: Item[]): RoundState {
  const s: RoundState = { level, items, index: 0, picked: [], car: 0, wrong: [], hinted: false, misses: 0, hints: 0, done: false };
  s.car = startStop(s);
  return s;
}

/** Where the lift waits at the start of the item in play: the dock at levels 1 and 3, the friend's stop at level 2. */
export function startStop(s: RoundState): number {
  const it = s.items[s.index];
  return it?.kind === 'ride' ? it.ride.from : 0;
}

/** The stop that is right now. */
export function hintFor(s: RoundState): number {
  const it = s.items[s.index];
  if (!it) return s.car;
  return it.kind === 'ride' ? it.ride.to : pickOrder(it.pick)[s.picked.length].stop;
}

export type Check =
  | { kind: 'right'; stop: number }
  | { kind: 'wrong'; stop: number; right: number; counted: boolean; support: boolean }
  | { kind: 'ignore' };

/** What a tap on a landing means. Never a miss: the stop the lift is at, an empty landing or a friend already aboard at level 3. */
export function check(s: RoundState, stop: number): Check {
  if (s.done || !Number.isInteger(stop) || Math.abs(stop) > TOP) return { kind: 'ignore' };
  const it = s.items[s.index];
  if (it.kind === 'pick') {
    if (!it.pick.friends.some((f) => f.stop === stop) || s.picked.includes(stop)) return { kind: 'ignore' };
  } else if (stop === s.car) return { kind: 'ignore' };
  const right = hintFor(s);
  if (stop === right) return { kind: 'right', stop };
  const counted = !s.wrong.includes(stop);
  return { kind: 'wrong', stop, right, counted, support: counted && s.wrong.length + 1 >= 3 };
}

/** Show the glow: once per request, and it counts as a hint. */
export function giveHint(s: RoundState): boolean {
  if (s.done || s.hinted) return false;
  s.hinted = true; s.hints++;
  return true;
}

/** Apply a checked tap. A wrong stop counts once per request; two make the glow (a hint); a third gets the supported finish. */
export function apply(s: RoundState, c: Check) {
  if (c.kind === 'ignore') return;
  if (c.kind === 'wrong') {
    if (!c.counted) return;
    s.wrong.push(c.stop); s.misses++;
    if (s.wrong.length >= 2) giveHint(s);
    if (!c.support) { if (s.items[s.index].kind === 'pick') s.car = c.stop; return; }
  }
  advance(s);
}

/** The right stop is reached (by her tap or the supported finish). */
function advance(s: RoundState) {
  const it = s.items[s.index], right = hintFor(s);
  s.wrong = []; s.hinted = false; s.car = right;
  if (it.kind === 'pick') {
    s.picked.push(right);
    if (s.picked.length < it.pick.friends.length) return;
    s.picked = [];
  }
  s.index++;
  if (s.index >= s.items.length) s.done = true;
  else if (s.items[s.index].kind === 'ride') s.car = startStop(s);
}

/* Layout -------------------------------------------------------------------------------------------- */

export interface Box { x: number; y: number; w: number; h: number }
export interface ShaftLayout {
  /** Even pitch between neighbouring stops: the scale is the point. */
  pitch: number;
  shaftX: number;
  /** Height of each stop on the shaft. */
  stopY: (stop: number) => number;
  /** Each landing's box, keyed by stop: even stops left of the shaft, odd stops right. */
  landings: Map<number, Box>;
  car: { w: number; h: number };
  /** The friend's request card, left of the shaft and clear of the home and help buttons and the guide. */
  card: Box;
}

export const LANDING = { w: 130, h: 110 };
export const MIN_PITCH = 56;
const MAX_PITCH = 90;
const MARGIN = 20;
/** The home and help buttons (top-left) and the guide pet (bottom-left), kept clear. */
export const HOME_BOX: Box = { x: 0, y: 0, w: 130, h: 210 };
export const PET_CORNER = 240;

export function shaftLayout(v: { w: number; h: number }): ShaftLayout | null {
  const pitch = Math.min(MAX_PITCH, (v.h - 2 * MARGIN - LANDING.h) / (2 * TOP));
  if (pitch < MIN_PITCH) return null;
  const shaftX = Math.round(Math.max(v.w * 0.62, 470));
  const mid = v.h / 2;
  const stopY = (stop: number) => mid - stop * pitch;
  const landings = new Map<number, Box>();
  for (const stop of STOPS) {
    const left = stop % 2 === 0;
    const cx = shaftX + (left ? -1 : 1) * (60 + LANDING.w / 2);
    landings.set(stop, { x: cx - LANDING.w / 2, y: stopY(stop) - LANDING.h / 2, w: LANDING.w, h: LANDING.h });
  }
  const cardW = Math.min(300, shaftX - 60 - LANDING.w - 30 - 160);
  const card: Box = { x: 160, y: Math.max(HOME_BOX.h - 60, mid - 260), w: cardW, h: 220 };
  return { pitch, shaftX, stopY, landings, car: { w: 92, h: Math.min(96, pitch * 1.45) }, card };
}

/** The landing nearest a touch (AGENTS: close targets resolve to the nearest, not the one drawn on top), or null when no landing is near. */
export function nearestLanding(L: ShaftLayout, x: number, y: number): number | null {
  let best: number | null = null, bestD = Infinity;
  for (const [stop, b] of L.landings) {
    const dx = Math.max(b.x - x, 0, x - (b.x + b.w)), dy = Math.max(b.y - y, 0, y - (b.y + b.h));
    const d = Math.hypot(dx, dy) * 1000 + Math.hypot(x - (b.x + b.w / 2), y - (b.y + b.h / 2));
    if (d < bestD) { bestD = d; best = stop; }
  }
  if (best === null) return null;
  const b = L.landings.get(best)!;
  return x >= b.x - 20 && x <= b.x + b.w + 20 && y >= b.y - 20 && y <= b.y + b.h + 20 ? best : null;
}
