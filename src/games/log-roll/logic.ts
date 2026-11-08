import type { BandLevels } from '../../progress/difficulty';
import type { Rng } from '../../engine/random';
import { FLOORS } from './floors.ts';

export type Pose = 'up' | 'across' | 'along';
export interface State {
  x: number;
  y: number;
  pose: Pose;
}
export const DIRECTIONS = ['up', 'down', 'left', 'right'] as const;
export type Direction = (typeof DIRECTIONS)[number];
/** Each level's exact start depth; its floors (several, frozen in floors.ts, and their mirrors) share the depth and size. */
export const PLANS = [
  { depth: 4, name: 'Open stones: learn to tip and stand' },
  { depth: 8, name: 'Two gaps: plan the log’s footprint' },
  { depth: 12, name: 'Broken path: weave around three gaps' },
  { depth: 16, name: 'The long way round: loop past the dead ends' },
  { depth: 10, name: 'Lay it in the cradle: finish lying across two stones', cradle: true },
] as const;
export const planFor = (level: number) => PLANS[Math.max(0, Math.min(PLANS.length - 1, level - 1))];
export const floorsFor = (level: number) => FLOORS[Math.max(0, Math.min(FLOORS.length - 1, level - 1))];
/** A left-right mirror; the hollow moves with its row. */
export const mirror = (floor: readonly string[]) => floor.map((row) => [...row].reverse().join(''));
const stone = (v: string | undefined) => v === '.' || v === 'G' || v === 'C';
/** The finish: standing in the hollow `G`, or lying across the two cradle stones `C` (side by side: across; one above the other: along). */
export function goal(floor: readonly string[]): State {
  const y = floor.findIndex((row) => row.includes('G'));
  if (y >= 0) return { x: floor[y].indexOf('G'), y, pose: 'up' };
  const cy = floor.findIndex((row) => row.includes('C'));
  if (cy < 0) throw new Error('A Log Roll floor needs a hollow or a cradle');
  const cx = floor[cy].indexOf('C');
  if (floor[cy][cx + 1] === 'C') return { x: cx, y: cy, pose: 'across' };
  if (floor[cy + 1]?.[cx] === 'C') return { x: cx, y: cy, pose: 'along' };
  throw new Error('A Log Roll cradle needs two neighbouring stones');
}
export const isCradle = (floor: readonly string[]) => goal(floor).pose !== 'up';
/** Standing on one cradle stone: close, but the cradle only takes a lying log. */
export const standsOnCradle = (s: State, floor: readonly string[]) =>
  s.pose === 'up' && floor[s.y]?.[s.x] === 'C';
export const key = (s: State) => `${s.x},${s.y},${s.pose}`;
export const solved = (s: State, floor: readonly string[]) => key(s) === key(goal(floor));
export function footprint(s: State): [number, number][] {
  return [
    [s.x, s.y],
    ...(s.pose === 'across'
      ? [[s.x + 1, s.y] as [number, number]]
      : s.pose === 'along'
        ? [[s.x, s.y + 1] as [number, number]]
        : []),
  ];
}
export function roll(s: State, d: Direction, floor: readonly string[]): State | null {
  const n = { ...s };
  if (d === 'left' || d === 'right') {
    const sign = d === 'left' ? -1 : 1;
    if (s.pose === 'up') {
      n.x += sign < 0 ? -2 : 1;
      n.pose = 'across';
    } else if (s.pose === 'across') {
      n.x += sign < 0 ? -1 : 2;
      n.pose = 'up';
    } else n.x += sign;
  } else {
    const sign = d === 'up' ? -1 : 1;
    if (s.pose === 'up') {
      n.y += sign < 0 ? -2 : 1;
      n.pose = 'along';
    } else if (s.pose === 'along') {
      n.y += sign < 0 ? -1 : 2;
      n.pose = 'up';
    } else n.y += sign;
  }
  return footprint(n).every(([x, y]) => stone(floor[y]?.[x])) ? n : null;
}
const opposite: Record<Direction, Direction> = { up: 'down', down: 'up', left: 'right', right: 'left' };
const cache = new Map<string, Map<string, { state: State; distance: number; next: Direction | null }>>();
/** Reversible rolls let a reverse BFS prove exact shortest hints from every reachable pose. */
export function distances(floor: readonly string[]) {
  const shape = floor.join('/'),
    old = cache.get(shape);
  if (old) return old;
  const GOAL = goal(floor);
  const table = new Map<string, { state: State; distance: number; next: Direction | null }>([
    [key(GOAL), { state: GOAL, distance: 0, next: null }],
  ]);
  const queue = [GOAL];
  for (let head = 0; head < queue.length; head++) {
    const s = queue[head],
      distance = table.get(key(s))!.distance;
    for (const d of DIRECTIONS) {
      const n = roll(s, d, floor);
      if (!n || table.has(key(n))) continue;
      table.set(key(n), { state: n, distance: distance + 1, next: opposite[d] });
      queue.push(n);
    }
  }
  cache.set(shape, table);
  return table;
}
export const solutionStep = (s: State, floor: readonly string[]) => distances(floor).get(key(s)) ?? null;
/** Upright poses exactly `depth` rolls from the hollow: the possible starts. */
export const startsAt = (floor: readonly string[], depth: number) =>
  [...distances(floor).values()]
    .filter((v) => v.distance === depth && v.state.pose === 'up')
    .map((v) => v.state);
/** A glowing hint is counted once: asking again, or another refused roll, while the same arrow glows costs nothing. */
export const countsAsHint = (glowing: Direction | null, next: Direction) => glowing !== next;
export function makePuzzle(level: number, rng: Rng) {
  const base = planFor(level),
    source = rng.pick(floorsFor(level)),
    flipped = rng.chance(0.5);
  const plan = { ...base, floor: flipped ? mirror(source) : [...source] };
  const candidates = startsAt(plan.floor, plan.depth);
  if (!candidates.length) throw new Error(`No Log Roll starts at depth ${plan.depth}`);
  return { plan, flipped, start: { ...rng.pick(candidates) } };
}

export const LEVELS: BandLevels = {
  grownup: { min: 1, max: 5 },
};
