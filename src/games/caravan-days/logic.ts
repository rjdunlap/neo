/**
 * Caravan Days' rules: load a camel and walk it to the next water (level 1, nothing counted); a fork with suns on each
 * branch and a two-day waterskin, so one oasis of two is within reach (level 2); and a two-branch map to the city planned a
 * stop at a time so that no leg is longer than the skin (level 3); the good the next stop wants, picked from two offers at
 * each oasis on a one-way road (level 4); and which of two three-bale loads brings more shells at a named stop, the better
 * load reversing between the near oasis and the far city (level 5). Everything here is pure; the scene draws it.
 * Definition: docs/definitions/caravan-days.md (levels 1–3 are CS2; 4–5 are CS3).
 */
import type { ColorName } from '../../art/palette';
import type { Rng } from '../../engine/random';
import type { View } from '../../engine/view';
import type { Band } from '../../progress/bands';

/** The waterskin holds two days at every level. */
export const SKIN = 2;

export type Landmark = 'palm' | 'rock' | 'spring';
export const LANDMARKS: readonly Landmark[] = ['palm', 'rock', 'spring'];
export const BALE_COLORS: readonly ColorName[] = ['red', 'orange', 'green', 'blue', 'purple', 'teal'];

export interface Pt { x: number; y: number }
export interface Rect { x: number; y: number; w: number; h: number }

export const LEVEL_NAMES: Record<number, string> = {
  1: 'Kneel and load', 2: 'Can we reach it?', 3: 'Day by day across the map', 4: 'Swap at the stop', 5: 'Worth more far away',
};

// ——— Level 1: kneel and load ———

export interface LoadPlan {
  level: 1;
  bales: number;
  colors: ColorName[];
  oasis: Landmark;
}

export type LoadPhase = 'standing' | 'kneeling' | 'walking' | 'drinking';

export interface LoadState {
  phase: LoadPhase;
  /** Which bales are on the camel's back. */
  on: boolean[];
}

/** Two bales at toddler, three or four from preschool. */
export function loadPlan(band: Band, rng: Rng): LoadPlan {
  const bales = band === 'toddler' ? 2 : rng.int(3, 4);
  const colors = rng.shuffle(BALE_COLORS.slice()).slice(0, bales);
  return { level: 1, bales, colors, oasis: rng.pick(LANDMARKS) };
}

export function loadStart(plan: LoadPlan): LoadState {
  return { phase: 'standing', on: plan.colors.map(() => false) };
}

export function loaded(s: LoadState): number {
  return s.on.filter(Boolean).length;
}

export type CamelTap = 'kneel' | 'one-more' | 'walk' | 'none';

/** Standing: it kneels. Kneeling with bales on the ground: "one more". Kneeling and loaded: off it goes. */
export function tapCamel(plan: LoadPlan, s: LoadState): { state: LoadState; event: CamelTap } {
  if (s.phase === 'standing') return { state: { ...s, phase: 'kneeling' }, event: 'kneel' };
  if (s.phase !== 'kneeling') return { state: s, event: 'none' };
  if (loaded(s) < plan.bales) return { state: s, event: 'one-more' };
  return { state: { ...s, phase: 'walking' }, event: 'walk' };
}

export type BaleTap = 'tap-camel' | 'on' | 'off' | 'none';

/** Standing: the camel glows ("tap the camel"). Kneeling: the bale hops on, or back off. */
export function tapBale(s: LoadState, i: number): { state: LoadState; event: BaleTap } {
  if (i < 0 || i >= s.on.length) return { state: s, event: 'none' };
  if (s.phase === 'standing') return { state: s, event: 'tap-camel' };
  if (s.phase !== 'kneeling') return { state: s, event: 'none' };
  const on = s.on.slice();
  on[i] = !on[i];
  return { state: { ...s, on }, event: on[i] ? 'on' : 'off' };
}

/** The next useful thing, for the idle glow and the ghost finger: the camel, a bale on the ground, the camel again. */
export function nextLoad(plan: LoadPlan, s: LoadState): { camel: true } | { bale: number } | null {
  if (s.phase === 'standing') return { camel: true };
  if (s.phase !== 'kneeling') return null;
  if (loaded(s) < plan.bales) return { bale: s.on.indexOf(false) };
  return { camel: true };
}

// ——— Level 2: can we reach it? ———

export interface Road {
  /** Suns on branch 0 (upper) and branch 1 (lower). */
  suns: [number, number];
  landmarks: [Landmark, Landmark];
}

export interface ReachPlan {
  level: 2;
  roads: Road[];
}

/** Two roads a round: one branch of 1–2 suns and one of 3–4, on a seeded side, so exactly one oasis is within the skin. */
export function reachPlan(rng: Rng): ReachPlan {
  const roads: Road[] = [];
  for (let r = 0; r < 2; r++) {
    const near = rng.int(1, 2);
    const far = rng.int(3, 4);
    const nearFirst = rng.chance(0.5);
    const marks = rng.shuffle(LANDMARKS.slice());
    roads.push({ suns: nearFirst ? [near, far] : [far, near], landmarks: [marks[0], marks[1]] });
  }
  return { level: 2, roads };
}

export function reachable(road: Road): 0 | 1 {
  return road.suns[0] <= SKIN ? 0 : 1;
}

/** The one commit at level 2: the camel reaches that water, or the skin runs out `over` days short. */
export function choose(road: Road, branch: 0 | 1): { reachable: true } | { reachable: false; over: number } {
  const n = road.suns[branch];
  return n <= SKIN ? { reachable: true } : { reachable: false, over: n - SKIN };
}

// ——— Level 3: day by day across the map ———

export interface Stop {
  id: number;
  kind: 'home' | 'oasis' | 'city';
  landmark: Landmark | null;
  /** Which branch an oasis is on, and its index along it. */
  branch: 0 | 1 | null;
  index: number;
}

export interface Leg {
  a: number;
  b: number;
  suns: number;
}

export interface CaravanMap {
  stops: Stop[];
  /** Every road, from the stop nearer home to the one nearer the city. */
  legs: Leg[];
  home: number;
  city: number;
  /** The oasis ids along each branch, home to city. */
  branches: [number[], number[]];
  /** The branch holding the 3-sun leg. */
  long: 0 | 1;
}

export interface PlanPlan {
  level: 3;
  maps: CaravanMap[];
}

/** Two branches of 2–3 oases, every leg 1–2 suns except one 3-sun leg on one branch. */
export function caravanMap(rng: Rng): CaravanMap {
  const sizes: [number, number] = [rng.int(2, 3), rng.int(2, 3)];
  const long = rng.chance(0.5) ? 0 : 1;
  const longAt = rng.int(0, sizes[long]);
  const stops: Stop[] = [{ id: 0, kind: 'home', landmark: null, branch: null, index: 0 }];
  const legs: Leg[] = [];
  const branches: [number[], number[]] = [[], []];
  const marks = rng.shuffle(LANDMARKS.slice());
  let m = 0;
  for (const b of [0, 1] as const) {
    let prev = 0;
    for (let i = 0; i < sizes[b]; i++) {
      const id = stops.length;
      stops.push({ id, kind: 'oasis', landmark: marks[m++ % marks.length], branch: b, index: i });
      branches[b].push(id);
      legs.push({ a: prev, b: id, suns: b === long && longAt === i ? 3 : rng.int(1, 2) });
      prev = id;
    }
    legs.push({ a: prev, b: -1, suns: b === long && longAt === sizes[b] ? 3 : rng.int(1, 2) });
  }
  const city = stops.length;
  stops.push({ id: city, kind: 'city', landmark: null, branch: null, index: 0 });
  for (const l of legs) if (l.b === -1) l.b = city;
  return { stops, legs, home: 0, city, branches, long };
}

export function planPlan(rng: Rng): PlanPlan {
  return { level: 3, maps: [caravanMap(rng), caravanMap(rng)] };
}

export function legBetween(map: CaravanMap, a: number, b: number): Leg | undefined {
  return map.legs.find((l) => (l.a === a && l.b === b) || (l.a === b && l.b === a));
}

/** The stops a road leads on to from `at`, towards the city. */
export function forward(map: CaravanMap, at: number): number[] {
  return map.legs.filter((l) => l.a === at).map((l) => l.b);
}

/** The stops from which the city can be reached using only legs the skin covers (a BFS back from the city). */
export function good(map: CaravanMap): Set<number> {
  const seen = new Set<number>([map.city]);
  const queue = [map.city];
  while (queue.length) {
    const s = queue.shift()!;
    for (const l of map.legs) {
      if (l.b === s && l.suns <= SKIN && !seen.has(l.a)) { seen.add(l.a); queue.push(l.a); }
    }
  }
  return seen;
}

/**
 * The suns between two stops she may flag in a row, towards the city only: a road's suns for adjacent stops, the two
 * roads' sum when one oasis on the same branch is skipped, or null when no road goes on there.
 */
export function legSuns(map: CaravanMap, a: number, b: number): number | null {
  const road = (x: number, y: number) => map.legs.find((l) => l.a === x && l.b === y);
  const direct = road(a, b);
  if (direct) return direct.suns;
  for (const mid of forward(map, a)) {
    const second = road(mid, b);
    if (second) return road(a, mid)!.suns + second.suns;
  }
  return null;
}

export interface PlanState {
  /** Flagged stops in order, after home. */
  plan: number[];
  /** How many of the flags the camel has already reached (legs before them are never re-walked). */
  walked: number;
}

export function planStart(): PlanState {
  return { plan: [], walked: 0 };
}

export function lastStop(map: CaravanMap, s: PlanState): number {
  return s.plan.length ? s.plan[s.plan.length - 1] : map.home;
}

/** Where the camel stands. */
export function camelAt(map: CaravanMap, s: PlanState): number {
  return s.walked ? s.plan[s.walked - 1] : map.home;
}

export type FlagResult = { state: PlanState; event: 'flag' | 'take-out' | 'not-adjacent' | 'none' };

/** Tap a stop: a flag on the next stop or one oasis beyond it on the same branch; a flagged stop takes its flag and the later ones out. */
export function tapStop(map: CaravanMap, s: PlanState, stop: number): FlagResult {
  if (stop === map.home) return s.plan.length ? { state: { plan: [], walked: 0 }, event: 'take-out' } : { state: s, event: 'none' };
  const i = s.plan.indexOf(stop);
  if (i >= 0) return { state: { plan: s.plan.slice(0, i), walked: Math.min(s.walked, i) }, event: 'take-out' };
  const last = lastStop(map, s);
  if (last === map.city) return { state: s, event: 'not-adjacent' };
  if (legSuns(map, last, stop) === null) return { state: s, event: 'not-adjacent' };
  return { state: { ...s, plan: [...s.plan, stop] }, event: 'flag' };
}

export function goLive(map: CaravanMap, s: PlanState): boolean {
  return lastStop(map, s) === map.city;
}

/** The suns of each leg of the plan, from home. */
export function legsOf(map: CaravanMap, s: PlanState): number[] {
  let at = map.home;
  return s.plan.map((stop) => { const n = legSuns(map, at, stop) ?? 0; at = stop; return n; });
}

export type GoResult = { arrived: true } | { arrived: false; leg: number; suns: number };

/** The one commit at level 3: arrived, or the first leg longer than the skin. */
export function go(map: CaravanMap, s: PlanState): GoResult {
  const legs = legsOf(map, s);
  const leg = legs.findIndex((n) => n > SKIN);
  return leg < 0 ? { arrived: true } : { arrived: false, leg, suns: legs[leg] };
}

/** After an over-long leg: the camel reached the flag before it, which stays; that leg's destination and later flags come out. */
export function afterTooLong(s: PlanState, leg: number): PlanState {
  return { plan: s.plan.slice(0, leg), walked: leg };
}

export type Hint = { takeOut: number } | { flag: number } | { go: true };

/**
 * The next stop on some valid plan: the first over-long leg's destination flag (to take it out); else a forward neighbour of
 * the last flag within the skin from which the city is still reachable; else the last flag itself; Go when the city is flagged.
 */
export function hintFor(map: CaravanMap, s: PlanState): Hint {
  const g = go(map, s);
  if (!g.arrived) return { takeOut: s.plan[g.leg] };
  const last = lastStop(map, s);
  if (last === map.city) return { go: true };
  const ok = good(map);
  for (const l of map.legs) {
    if (l.a === last && l.suns <= SKIN && ok.has(l.b)) return { flag: l.b };
  }
  return { takeOut: last };
}

/** Follow a hint. */
export function applyHint(map: CaravanMap, s: PlanState, h: Hint): PlanState {
  if ('go' in h) return s;
  if ('flag' in h) return tapStop(map, s, h.flag).state;
  return tapStop(map, s, h.takeOut).state;
}

/** The plan that flags every oasis on the branch without the 3-sun leg, then the city: valid on every seed. */
export function safePlan(map: CaravanMap): number[] {
  const b = map.long === 0 ? 1 : 0;
  return [...map.branches[b], map.city];
}

/** What the ghost finger taps next: the safe plan's next stop, Go, or the first flag that strays from it. */
export function nextPlanMove(map: CaravanMap, s: PlanState): { stop: number } | { go: true } {
  const safe = safePlan(map);
  for (let i = 0; i < s.plan.length; i++) if (s.plan[i] !== safe[i]) return { stop: s.plan[i] };
  if (s.plan.length === safe.length) return { go: true };
  return { stop: safe[s.plan.length] };
}

// ——— Goods (levels 4–5) ———

export type Good = 'silk' | 'tea' | 'salt' | 'glass' | 'paper' | 'beads';
export const GOODS: readonly Good[] = ['silk', 'tea', 'salt', 'glass', 'paper', 'beads'];
export type Friend = 'bunny' | 'duck' | 'cat' | 'bear';
export const FRIENDS: readonly Friend[] = ['bunny', 'duck', 'cat', 'bear'];

// ——— Level 4: swap at the stop ———

/**
 * A one-way road: home, oasis 1, oasis 2, the city. The camel leaves home with `carry0`, which oasis 1 wants; each oasis
 * then offers two goods, the next stop's want and a decoy. `wants[i]` is what stop i + 1 wants (oasis 1, oasis 2, city).
 */
export interface SwapRoad {
  /** Suns on home → oasis 1, oasis 1 → oasis 2, oasis 2 → city: always within the skin. */
  legs: [number, number, number];
  wants: [Good, Good, Good];
  carry0: Good;
  /** The two offers at oasis 1 and oasis 2, left then right. */
  offers: [[Good, Good], [Good, Good]];
  /** Who trades at oasis 1, oasis 2 and the city. */
  friends: [Friend, Friend, Friend];
  landmarks: [Landmark, Landmark];
}

export interface SwapPlan {
  level: 4;
  roads: SwapRoad[];
}

/**
 * Three distinct wants; oasis 1's decoy is the city's want when `skipAhead` (right thing, wrong stop), else a good no later
 * stop wants; oasis 2's decoy is a good nobody on the road wants. Which offer is on the left is seeded.
 */
export function swapRoad(rng: Rng, skipAhead: boolean): SwapRoad {
  const g = rng.shuffle(GOODS.slice());
  const [w1, w2, wc] = [g[0], g[1], g[2]];
  const decoy1 = skipAhead ? wc : g[3];
  const decoy2 = g[4];
  const side = (right: Good, decoy: Good): [Good, Good] => (rng.chance(0.5) ? [right, decoy] : [decoy, right]);
  const friends = rng.shuffle(FRIENDS.slice());
  const marks = rng.shuffle(LANDMARKS.slice());
  return {
    legs: [rng.int(1, 2), rng.int(1, 2), rng.int(1, 2)],
    wants: [w1, w2, wc],
    carry0: w1,
    offers: [side(w2, decoy1), side(wc, decoy2)],
    friends: [friends[0], friends[1], friends[2]],
    landmarks: [marks[0], marks[1]],
  };
}

/** Two roads a round; one of them (seeded) always holds the skip-ahead decoy, the other sometimes. */
export function swapPlan(rng: Rng): SwapPlan {
  const forced = rng.int(0, 1);
  const roads = [0, 1].map((i) => swapRoad(rng, i === forced || rng.chance(0.5)));
  return { level: 4, roads };
}

/** `at` is the oasis the camel stands at (1 or 2), or 3 once the city has taken its want; `carried` is the picked offer. */
export interface SwapState {
  at: 1 | 2 | 3;
  carried: Good | null;
}

/** After the entry walk the camel stands at oasis 1, whose friend has taken `carry0`. */
export function swapStart(): SwapState {
  return { at: 1, carried: null };
}

/** The offers where the camel stands. */
export function offersAt(road: SwapRoad, s: SwapState): [Good, Good] | null {
  return s.at === 1 || s.at === 2 ? road.offers[s.at - 1] : null;
}

/** Tap an offer: it hops onto the camel; tapping the other swaps them. Free, never counted. */
export function pickOffer(road: SwapRoad, s: SwapState, side: 0 | 1): SwapState {
  const offers = offersAt(road, s);
  return offers ? { ...s, carried: offers[side] } : s;
}

/** What the next stop wants. */
export function nextWant(road: SwapRoad, s: SwapState): Good | null {
  return s.at === 1 || s.at === 2 ? road.wants[s.at] : null;
}

export type SwapGo =
  | { event: 'pick-first' }
  | { event: 'wanted'; state: SwapState; city: boolean }
  | { event: 'not-wanted'; wants: Good; carried: Good };

/** The one commit at level 4: the next stop takes what the camel carries, or shrugs (one miss) and the camel walks back. */
export function goSwap(road: SwapRoad, s: SwapState): SwapGo {
  const want = nextWant(road, s);
  if (!want || !s.carried) return { event: 'pick-first' };
  if (s.carried !== want) return { event: 'not-wanted', wants: want, carried: s.carried };
  const at = (s.at + 1) as 2 | 3;
  return { event: 'wanted', state: { at, carried: null }, city: at === 3 };
}

/** The glow: the right offer where the camel stands, or Go once it is on the camel. */
export function swapHint(road: SwapRoad, s: SwapState): { side: 0 | 1 } | { go: true } | null {
  const offers = offersAt(road, s);
  const want = nextWant(road, s);
  if (!offers || !want) return null;
  if (s.carried === want) return { go: true };
  return { side: offers.indexOf(want) as 0 | 1 };
}

// ——— Level 5: worth more far away ———

/** Stops on the level-5 road: 0 home, 1 the near oasis, 2 the middle oasis, 3 the far city. */
export type WorthStop = 1 | 2 | 3;

export interface WorthPlan {
  level: 5;
  /** The up good (made at home: cheap near, dear far) and the down good (the other way round). */
  goods: [Good, Good];
  /** Price in shells at the near oasis, the middle oasis and the far city; the down good's row is the up row reversed. */
  up: [number, number, number];
  down: [number, number, number];
  /** Two three-bale loads, each [up bales, down bales], with different up counts. */
  loads: [[number, number], [number, number]];
  /** The stop named in case 1 and case 2: the two ends of the road, never the middle. */
  named: [WorthStop, WorthStop];
  legs: [number, number, number];
  landmarks: [Landmark, Landmark];
}

export const PRICE_ROWS: readonly [number, number, number][] = [[1, 2, 4], [1, 3, 5]];
export const BALES = 3;

export function worthPlan(rng: Rng): WorthPlan {
  const g = rng.shuffle(GOODS.slice());
  const up = rng.pick(PRICE_ROWS).slice() as [number, number, number];
  const down = up.slice().reverse() as [number, number, number];
  const counts = rng.shuffle([0, 1, 2, 3]);
  const loads: [[number, number], [number, number]] = [[counts[0], BALES - counts[0]], [counts[1], BALES - counts[1]]];
  const first: WorthStop = rng.chance(0.5) ? 1 : 3;
  const marks = rng.shuffle(LANDMARKS.slice());
  return {
    level: 5, goods: [g[0], g[1]], up, down, loads, named: [first, first === 1 ? 3 : 1],
    legs: [rng.int(1, 2), rng.int(1, 2), rng.int(1, 2)], landmarks: [marks[0], marks[1]],
  };
}

/** A good's price at a stop (0 up, 1 down). */
export function price(plan: WorthPlan, good: 0 | 1, stop: WorthStop): number {
  return (good === 0 ? plan.up : plan.down)[stop - 1];
}

/** A load's shells at a stop. */
export function total(plan: WorthPlan, load: 0 | 1, stop: WorthStop): number {
  const [u, d] = plan.loads[load];
  return u * price(plan, 0, stop) + d * price(plan, 1, stop);
}

/** The load that brings more at the case's named stop. */
export function better(plan: WorthPlan, caseIndex: number): 0 | 1 {
  const stop = plan.named[caseIndex];
  return total(plan, 0, stop) > total(plan, 1, stop) ? 0 : 1;
}

export type Sell = { better: true; got: number } | { better: false; got: number; other: number };

/** The one commit at level 5: the load sent brings its shells; the smaller is one miss, both sums spoken. */
export function sell(plan: WorthPlan, caseIndex: number, load: 0 | 1): Sell {
  const stop = plan.named[caseIndex];
  const got = total(plan, load, stop);
  if (load === better(plan, caseIndex)) return { better: true, got };
  return { better: false, got, other: total(plan, load === 0 ? 1 : 0, stop) };
}

/** The load last looked at (Go sends it); cleared when a case ends or after a smaller load comes home, so she looks again. */
export interface WorthState {
  looked: 0 | 1 | null;
}

export function worthStart(): WorthState {
  return { looked: null };
}

/** What the ghost finger taps next: both loads, the better one last, then Go. */
export function nextWorthMove(plan: WorthPlan, caseIndex: number, s: WorthState, seen: ReadonlySet<number>): { load: 0 | 1 } | { go: true } {
  const b = better(plan, caseIndex);
  const other = b === 0 ? 1 : 0;
  if (!seen.has(other)) return { load: other };
  if (s.looked !== b) return { load: b };
  return { go: true };
}

// ——— Accounting ———

/** Misses and hints for a round, with at most one hint per road or map. */
export class Tally {
  misses = 0;
  hints = 0;
  /** Misses on the current road or map. */
  here = 0;
  glowing = false;
  private counted = false;

  /** A far oasis or an over-long Go: a miss; the second on this road lights the glow. */
  miss() {
    this.misses++;
    this.here++;
    if (this.here >= 2) this.light();
  }

  /** Asked-for help: the same glow, counted once per road. */
  help() {
    this.light();
  }

  private light() {
    if (!this.counted) { this.counted = true; this.hints++; }
    this.glowing = true;
  }

  /** The next road or map starts with its own counts. */
  next() {
    this.here = 0;
    this.glowing = false;
    this.counted = false;
  }
}

// ——— Layout ———

export const HOME_CORNER = { w: 130, h: 215 };
export const PET_CORNER = { w: 160, h: 170 };
export const CAMEL = { w: 260, h: 200 };
export const BALE = 110;
export const OASIS = 120;
export const GO = { w: 140, h: 110 };
export const SUN = 44;
export const MIN_TARGET = 100;
export const OFFER = 120;
export const BUBBLE = 110;
export const BOARD = { w: 150, h: 110 };
export const LOAD = { w: 230, h: 150 };

export function corners(v: View): Rect[] {
  return [{ x: 0, y: 0, ...HOME_CORNER }, { x: 0, y: v.h - PET_CORNER.h, ...PET_CORNER }];
}

export function overlaps(a: Rect, b: Rect): boolean {
  return a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
}

export function centre(r: Rect): Pt {
  return { x: r.x + r.w / 2, y: r.y + r.h / 2 };
}

function around(p: Pt, w: number, h = w): Rect {
  return { x: p.x - w / 2, y: p.y - h / 2, w, h };
}

export interface RoadLine {
  from: Pt;
  to: Pt;
  suns: number;
  /** Level 3: the leg's stops. */
  a?: number;
  b?: number;
}

export interface RoadLayout {
  /** Where the camel stands at the start, and its tap rectangle (level 1). */
  camel: Rect;
  start: Pt;
  bales: Rect[];
  skin: Pt;
  /** Level 1: the one oasis; level 2: the two; level 3: every stop by id (home and city included). */
  stops: Rect[];
  go: Rect | null;
  roads: RoadLine[];
  /** Level 4: the two offer cards; the want bubbles over oasis 1, oasis 2 and the city. */
  offers?: Rect[];
  bubbles?: Rect[];
  /** Level 5: the price boards under the near oasis, the middle oasis and the city; the two loads. */
  boards?: Rect[];
  loads?: Rect[];
}

/** The level plans, for the grown-ups' description. */
export function planFor(level: number): { level: number; id: 'load' | 'reach' | 'plan' | 'swap' | 'worth'; name: string } {
  if (level <= 1) return { level: 1, id: 'load', name: 'Kneel and load: tap the camel so it kneels, tap each bale, tap the camel and off it goes (2 bales at toddler, 3–4 from preschool)' };
  if (level === 2) return { level: 2, id: 'reach', name: 'Can we reach it? count the suns on two roads and tap the water within the two-day skin (two roads)' };
  if (level === 3) return { level: 3, id: 'plan', name: 'Day by day across the map: flag the stops to the city so no leg is longer than the skin, then Go (two maps)' };
  if (level === 4) return { level: 4, id: 'swap', name: 'Swap at the stop: at each oasis give the camel the good the next stop wants, of two offers, then Go (two roads)' };
  return { level: 5, id: 'worth', name: 'Worth more far away: count two three-bale loads\' shells at the named stop and send the one that brings more; the better load reverses (two cases)' };
}

/** Level 4–5's road: home and three stops in a row across the upper part, evenly spaced. */
function rowStops(v: View, y: number): Pt[] {
  const x0 = v.w >= v.h ? 230 : 200;
  const x1 = v.w - 160;
  return [0, 1, 2, 3].map((i) => ({ x: x0 + (i * (x1 - x0)) / 3, y }));
}

/**
 * Every input at least 100 units, clear of the corners and each other; portrait stacks rather than shrinks, and a short
 * view (a phone sideways) pulls the rows in without shrinking a target. Null when a view cannot hold the level.
 */
export function roadLayout(level: number, plan: LoadPlan | ReachPlan | PlanPlan | SwapPlan | WorthPlan, v: View, index = 0): RoadLayout | null {
  const wide = v.w >= v.h;
  const midY = v.h * 0.5;
  const short = v.h < 600;
  let out: RoadLayout;
  if (level === 1) {
    const baleY = short ? v.h - 70 : v.h - 110;
    const start = { x: 300, y: Math.min(midY + 20, baleY - BALE / 2 - CAMEL.h / 2 - 10) };
    const oasis = { x: v.w - 180, y: wide ? midY - 60 : midY - 100 };
    const n = (plan as LoadPlan).bales;
    const bales = Array.from({ length: n }, (_, i) => around({ x: 250 + i * 130, y: baleY }, BALE));
    out = { camel: around(start, CAMEL.w, CAMEL.h), start, bales, skin: { x: -999, y: -999 }, stops: [around(oasis, OASIS)], go: null, roads: [{ from: start, to: oasis, suns: 0 }] };
  } else if (level === 2) {
    const road = (plan as ReachPlan).roads[index];
    const start = { x: 300, y: midY + 20 };
    const gap = Math.min(wide ? 190 : 230, v.h * 0.28);
    const upper = { x: v.w - 170, y: midY - gap };
    const lower = { x: v.w - 170, y: midY + gap };
    out = {
      camel: around(start, CAMEL.w, CAMEL.h), start, bales: [], skin: { x: start.x, y: Math.min(start.y + 170, v.h - 40) },
      stops: [around(upper, OASIS), around(lower, OASIS)], go: null,
      roads: [{ from: start, to: upper, suns: road.suns[0] }, { from: start, to: lower, suns: road.suns[1] }],
    };
  } else if (level === 4 || level === 5) {
    const legs = level === 4 ? (plan as SwapPlan).roads[index].legs : (plan as WorthPlan).legs;
    const stopY = Math.round(level === 4 ? Math.max(300, v.h * 0.4) : Math.max(230, v.h * 0.3));
    const pts = rowStops(v, stopY);
    // Landscape keeps the choices along the bottom; portrait pulls them up under the road so the road and the choice read together.
    const lowY = v.w >= v.h ? v.h - 130 : Math.min(v.h - 130, stopY + (level === 4 ? 330 : 420));
    const go = around({ x: v.w - 110, y: v.h - 70 }, GO.w, GO.h);
    const mid = (PET_CORNER.w + go.x) / 2;
    const base = {
      camel: around({ x: pts[0].x, y: stopY + 48 }, CAMEL.w * 0.55, CAMEL.h * 0.55), start: { x: pts[0].x, y: stopY + 48 }, bales: [],
      skin: { x: -999, y: -999 }, stops: pts.map((p) => around(p, OASIS)), go,
      roads: [0, 1, 2].map((i) => ({ from: pts[i], to: pts[i + 1], suns: legs[i], a: i, b: i + 1 })),
    };
    if (level === 4) {
      const gap = OFFER + 60;
      out = {
        ...base,
        offers: [around({ x: mid - gap / 2, y: lowY }, OFFER), around({ x: mid + gap / 2, y: lowY }, OFFER)],
        bubbles: pts.slice(1).map((p) => around({ x: p.x, y: stopY - 140 }, BUBBLE)),
      };
    } else {
      const gap = LOAD.w + 40;
      out = {
        ...base,
        boards: pts.slice(1).map((p) => around({ x: p.x, y: stopY + 140 }, BOARD.w, BOARD.h)),
        loads: [around({ x: mid - gap / 2, y: lowY }, LOAD.w, LOAD.h), around({ x: mid + gap / 2, y: lowY }, LOAD.w, LOAD.h)],
      };
    }
  } else {
    const map = (plan as PlanPlan).maps[index];
    const homeX = wide ? 240 : 110;
    const home = { x: homeX, y: midY };
    const city = { x: v.w - 150, y: midY };
    const gap = Math.min(wide ? 215 : 300, v.h * 0.28);
    const x0 = homeX + 140;
    const x1 = v.w - 290;
    const pts: Pt[] = map.stops.map(() => ({ x: 0, y: 0 }));
    pts[map.home] = home;
    pts[map.city] = city;
    map.branches.forEach((ids, b) => {
      const y = b === 0 ? midY - gap : midY + gap;
      ids.forEach((id, i) => { pts[id] = { x: ids.length === 1 ? (x0 + x1) / 2 : x0 + (i * (x1 - x0)) / (ids.length - 1), y }; });
    });
    out = {
      camel: around(home, CAMEL.w, CAMEL.h), start: home, bales: [], skin: { x: home.x, y: Math.min(home.y + 150, v.h - 40) },
      stops: pts.map((p) => around(p, OASIS)),
      go: around({ x: v.w - 110, y: v.h - 70 }, GO.w, GO.h),
      roads: map.legs.map((l) => ({ from: pts[l.a], to: pts[l.b], suns: l.suns, a: l.a, b: l.b })),
    };
  }
  // At levels 4–5 the stops are scenery; the offers, bubbles, boards and loads are the inputs.
  const inputs = level >= 4
    ? [...(out.offers ?? []), ...(out.bubbles ?? []), ...(out.boards ?? []), ...(out.loads ?? []), ...(out.go ? [out.go] : [])]
    : [...out.stops, ...out.bales, ...(out.go ? [out.go] : []), ...(level === 1 ? [out.camel] : [])];
  for (const r of inputs) {
    if (r.w < MIN_TARGET || r.h < MIN_TARGET) return null;
    if (r.x < 0 || r.y < 0 || r.x + r.w > v.w || r.y + r.h > v.h) return null;
    if (corners(v).some((c) => overlaps(r, c))) return null;
  }
  for (let i = 0; i < inputs.length; i++) for (let j = i + 1; j < inputs.length; j++) if (overlaps(inputs[i], inputs[j])) return null;
  return out;
}

/** Points along a road for its suns, evenly spaced and clear of both ends. */
export function sunPoints(r: RoadLine): Pt[] {
  return Array.from({ length: r.suns }, (_, i) => {
    const t = (i + 1) / (r.suns + 1);
    return { x: r.from.x + (r.to.x - r.from.x) * t, y: r.from.y + (r.to.y - r.from.y) * t };
  });
}
