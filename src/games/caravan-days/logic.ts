/**
 * Caravan Days' rules: load a camel and walk it to the next water (level 1, nothing counted); a fork with suns on each
 * branch and a two-day waterskin, so one oasis of two is within reach (level 2); and a two-branch map to the city planned a
 * stop at a time so that no leg is longer than the skin (level 3). Everything here is pure; the scene draws it.
 * Definition: docs/definitions/caravan-days.md (levels 1–3 built; 4–5 are CS3).
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

export const LEVEL_NAMES: Record<number, string> = { 1: 'Kneel and load', 2: 'Can we reach it?', 3: 'Day by day across the map' };

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
}

/** The level plans, for the grown-ups' description. */
export function planFor(level: number): { level: number; id: 'load' | 'reach' | 'plan'; name: string } {
  if (level <= 1) return { level: 1, id: 'load', name: 'Kneel and load: tap the camel so it kneels, tap each bale, tap the camel and off it goes (2 bales at toddler, 3–4 from preschool)' };
  if (level === 2) return { level: 2, id: 'reach', name: 'Can we reach it? count the suns on two roads and tap the water within the two-day skin (two roads)' };
  return { level: 3, id: 'plan', name: 'Day by day across the map: flag the stops to the city so no leg is longer than the skin, then Go (two maps)' };
}

/**
 * Every input at least 100 units, clear of the corners and each other; portrait stacks rather than shrinks, and a short
 * view (a phone sideways) pulls the rows in without shrinking a target. Null when a view cannot hold the level.
 */
export function roadLayout(level: number, plan: LoadPlan | ReachPlan | PlanPlan, v: View, index = 0): RoadLayout | null {
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
  const inputs = [...out.stops, ...out.bales, ...(out.go ? [out.go] : []), ...(level === 1 ? [out.camel] : [])];
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
