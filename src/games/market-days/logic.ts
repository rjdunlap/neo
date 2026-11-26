import type { BandLevels } from '../../progress/difficulty';
import type { Rng } from '../../engine/random';

/**
 * Market Days' rules (docs/definitions/market-days.md#the-model-logicts): towns on an integer lattice, a day's walk is one
 * lattice step (diagonals included), and neighbouring towns must hold their market on different days. Pure: no Pixi.
 */
export interface Town {
  x: number;
  y: number;
}
export interface MarketMap {
  towns: readonly Town[];
}

/** The first map, `fair`: eight towns on a 5 × 4 lattice, thirteen neighbour pairs, the least number of days is 3. */
export const FAIR: MarketMap = {
  towns: [
    { x: 3, y: 1 },
    { x: 3, y: 2 },
    { x: 4, y: 1 },
    { x: 2, y: 3 },
    { x: 2, y: 2 },
    { x: 1, y: 1 },
    { x: 1, y: 2 },
    { x: 0, y: 1 },
  ],
};
export const LATTICE = { w: 5, h: 4 } as const;

/** The map seen in a mirror: left-right, top-bottom, both or neither. Neighbours and degrees do not change. */
export function mirror(map: MarketMap, flipX: boolean, flipY: boolean): MarketMap {
  return {
    towns: map.towns.map((t) => ({
      x: flipX ? LATTICE.w - 1 - t.x : t.x,
      y: flipY ? LATTICE.h - 1 - t.y : t.y,
    })),
  };
}

/** Two towns a day's walk apart: lattice distance squared at most 2. Derived, never stored. */
export function neighbourPairs(map: MarketMap): [number, number][] {
  const out: [number, number][] = [];
  const t = map.towns;
  for (let i = 0; i < t.length; i++)
    for (let j = i + 1; j < t.length; j++)
      if ((t[i].x - t[j].x) ** 2 + (t[i].y - t[j].y) ** 2 <= 2) out.push([i, j]);
  return out;
}

export function neighbourLists(map: MarketMap): number[][] {
  const lists: number[][] = map.towns.map(() => []);
  for (const [a, b] of neighbourPairs(map)) {
    lists[a].push(b);
    lists[b].push(a);
  }
  return lists;
}

/** Three towns that are all a day apart: they need three different days. */
export function triangles(map: MarketMap): [number, number, number][] {
  const near = neighbourLists(map);
  const out: [number, number, number][] = [];
  for (let a = 0; a < near.length; a++)
    for (const b of near[a])
      if (b > a) for (const c of near[b]) if (c > b && near[a].includes(c)) out.push([a, b, c]);
  return out;
}

/** A banner per town, or -1 for none yet. */
export type Assignment = readonly number[];
export const EMPTY = -1;

/** Each pair of neighbours holding the same banner (both placed). */
export function clashes(map: MarketMap, assign: Assignment): [number, number][] {
  return neighbourPairs(map).filter(([a, b]) => assign[a] !== EMPTY && assign[a] === assign[b]);
}

/** Towns that share a banner with a neighbour. */
export function inConflict(map: MarketMap, assign: Assignment): Set<number> {
  const s = new Set<number>();
  for (const [a, b] of clashes(map, assign)) {
    s.add(a);
    s.add(b);
  }
  return s;
}

/** The banners a town may take without clashing with a placed neighbour. */
export function options(map: MarketMap, assign: Assignment, town: number, days: number): number[] {
  const near = neighbourLists(map)[town];
  const out: number[] = [];
  for (let d = 0; d < days; d++) if (!near.some((n) => assign[n] === d)) out.push(d);
  return out;
}

/**
 * Every proper assignment with `days` banners that keeps the placed towns as they are, up to `cap`. Empty when the placed towns
 * already clash. Backtracking over the unplaced towns in descending degree.
 */
export function solve(map: MarketMap, days: number, fixed: Assignment, cap = 10): number[][] {
  const out: number[][] = [];
  if (clashes(map, fixed).length) return out;
  const near = neighbourLists(map);
  const order = fixed
    .map((_, i) => i)
    .filter((i) => fixed[i] === EMPTY)
    .sort((a, b) => near[b].length - near[a].length || a - b);
  const cur = [...fixed];
  const go = (k: number) => {
    if (out.length >= cap) return;
    if (k === order.length) {
      out.push([...cur]);
      return;
    }
    const t = order[k];
    for (let d = 0; d < days; d++) {
      if (near[t].some((n) => cur[n] === d)) continue;
      cur[t] = d;
      go(k + 1);
      cur[t] = EMPTY;
    }
  };
  go(0);
  return out;
}

export const bannersUsed = (assign: Assignment): number => new Set(assign.filter((v) => v !== EMPTY)).size;
export const placedCount = (assign: Assignment): number => assign.filter((v) => v !== EMPTY).length;

/** One level's plan. `offered` banners are on the tray; the round is won with at most `target` of them. */
export interface MarketPlan {
  offered: number;
  target: number;
  /** Towns set at the start (level 1: a triangle on the map's lower left, so the rest follow). */
  preset: readonly number[];
}

/** The corner triangle level 1 sets: towns 3, 4 and 6 are all a day apart. */
export const PRESET_TRIANGLE: readonly number[] = [3, 4, 6];

const PLANS: Record<number, MarketPlan> = {
  1: { offered: 3, target: 3, preset: PRESET_TRIANGLE },
  2: { offered: 3, target: 3, preset: [] },
  3: { offered: 4, target: 3, preset: [] },
};
export const LEVELS: BandLevels = { grownup: { min: 1, max: 3 }, school: { min: 1, max: 2 } };

export function planFor(level: number): MarketPlan {
  return PLANS[Math.max(1, Math.min(3, Math.round(level)))];
}

export function describeLevel(level: number): string {
  if (level <= 1) return 'Three days: give each town a market day, three towns already set';
  if (level === 2) return 'Start from nothing: three market days for every town';
  return 'Fewest days: four banners offered, finish with only three';
}

/** A seeded round: the map's mirror, and which style each banner takes (see `STYLE_ORDER` in the game). */
export interface MarketRound {
  map: MarketMap;
  plan: MarketPlan;
  /** The banners the preset towns start with (index per town; EMPTY elsewhere). */
  start: number[];
  /** Which of the four banner looks each banner index takes. */
  looks: number[];
}

export function makeRound(level: number, rng: Rng): MarketRound {
  const plan = planFor(level);
  const map = mirror(FAIR, rng.chance(0.5), rng.chance(0.5));
  const looks = rng.shuffle([0, 1, 2, 3]);
  const start = map.towns.map(() => EMPTY);
  plan.preset.forEach((t, i) => (start[t] = i));
  return { map, plan, start, looks };
}

/** Whether the round is won: every town has a banner, none clashes, and no more than `target` banners are used. */
export function isDone(map: MarketMap, plan: MarketPlan, assign: Assignment): boolean {
  return (
    placedCount(assign) === map.towns.length &&
    !clashes(map, assign).length &&
    bannersUsed(assign) <= plan.target
  );
}

/** All placed and clash-free but too many banners used (level 3's four-banner finish): not done, not a miss. */
export function tooManyDays(map: MarketMap, plan: MarketPlan, assign: Assignment): boolean {
  return (
    placedCount(assign) === map.towns.length &&
    !clashes(map, assign).length &&
    bannersUsed(assign) > plan.target
  );
}

/**
 * A legal placement that leaves some town with no banner it may take (the solver finds no extension). The town with no day
 * left, or null when the placed towns can still be finished.
 */
export function deadEnd(map: MarketMap, plan: MarketPlan, assign: Assignment): number | null {
  if (clashes(map, assign).length) return null;
  if (solve(map, plan.offered, assign, 1).length) return null;
  for (let t = 0; t < map.towns.length; t++)
    if (assign[t] === EMPTY && !options(map, assign, t, plan.offered).length) return t;
  return null;
}

export type HintKind =
  /** A town the placed banners decide; `banner` is its only banner. */
  | { kind: 'forced'; town: number; banner: number }
  /** Nothing is forced yet: a town of a triangle, to place any banner in it (every banner is as good as another). */
  | { kind: 'triangle'; town: number; banner: number; triangle: [number, number, number] }
  /** Level 3 with too many banners placed: the towns that hold the extra banner. */
  | { kind: 'fewer'; towns: number[] }
  /** The placed towns cannot be finished. */
  | { kind: 'stuck'; town: number | null };

/**
 * The help she is shown: a forced town when the solver finds one (the same banner in every finish), otherwise a town of a
 * triangle with a banner the solver can finish with. Never names a placed town.
 */
export function hintFor(map: MarketMap, plan: MarketPlan, assign: Assignment): HintKind | null {
  if (placedCount(assign) === map.towns.length) return null;
  const over = assign.flatMap((v, i) => (v >= plan.target ? [i] : []));
  if (over.length) return { kind: 'fewer', towns: over };
  const ext = solve(map, plan.target, assign, 2000);
  if (!ext.length) return { kind: 'stuck', town: deadEnd(map, plan, assign) };
  for (let t = 0; t < map.towns.length; t++) {
    if (assign[t] !== EMPTY) continue;
    const b = ext[0][t];
    if (ext.every((e) => e[t] === b)) return { kind: 'forced', town: t, banner: b };
  }
  const tri = triangles(map).find((tr) => tr.some((t) => assign[t] === EMPTY)) ?? triangles(map)[0];
  const town = tri.find((t) => assign[t] === EMPTY) ?? tri[0];
  return { kind: 'triangle', town, banner: ext[0][town], triangle: tri };
}
