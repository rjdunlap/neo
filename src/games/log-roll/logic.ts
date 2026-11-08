import type { BandLevels } from '../../progress/difficulty';
import type { Rng } from '../../engine/random';
import { FLOORS } from './floors.ts';

export type Pose = 'up' | 'across' | 'along';
export interface State {
  x: number;
  y: number;
  pose: Pose;
  /** Raised permanently by a standing press; Undo restores the previous flag. */
  bridge?: boolean;
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
  { depth: 8, name: 'Soft moss: cross the soft stones lying down' },
  { depth: 12, name: 'The stone bridge: stand on the switch, then cross' },
] as const;
export const planFor = (level: number) => PLANS[Math.max(0, Math.min(PLANS.length - 1, level - 1))];
export const floorsFor = (level: number) => FLOORS[Math.max(0, Math.min(FLOORS.length - 1, level - 1))];
/** A left-right mirror; the hollow moves with its row. */
export const mirror = (floor: readonly string[]) => floor.map((row) => [...row].reverse().join(''));
export const hasBridge = (floor: readonly string[]) => floor.some((row) => row.includes('B'));
const stone = (v: string | undefined, raised = false) =>
  v === '.' || v === 'G' || v === 'C' || v === 'M' || v === 'S' || (v === 'B' && raised);
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
export const key = (s: State) => `${s.x},${s.y},${s.pose}${s.bridge ? ',bridge' : ''}`;
export const solved = (s: State, floor: readonly string[]) =>
  s.x === goal(floor).x && s.y === goal(floor).y && s.pose === goal(floor).pose;
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
/** Geometry alone also identifies a refused attempt to stand on moss. */
function tipped(s: State, d: Direction): State {
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
  return n;
}
export const standsOnMoss = (s: State, floor: readonly string[]) =>
  s.pose === 'up' && floor[s.y]?.[s.x] === 'M';
export const refusesMoss = (s: State, d: Direction, floor: readonly string[]) =>
  standsOnMoss(tipped(s, d), floor);
export const liesOnSwitch = (s: State, floor: readonly string[]) =>
  s.pose !== 'up' && footprint(s).some(([x, y]) => floor[y]?.[x] === 'S');
export function roll(s: State, d: Direction, floor: readonly string[]): State | null {
  const n = tipped(s, d);
  if (standsOnMoss(n, floor) || !footprint(n).every(([x, y]) => stone(floor[y]?.[x], !!s.bridge)))
    return null;
  if (n.pose === 'up' && floor[n.y]?.[n.x] === 'S') n.bridge = true;
  return n;
}
const opposite: Record<Direction, Direction> = { up: 'down', down: 'up', left: 'right', right: 'left' };
const cache = new Map<string, Map<string, { state: State; distance: number; next: Direction | null }>>();
/** Reversible rolls let a reverse BFS prove exact shortest hints from every reachable pose. */
export function distances(floor: readonly string[]) {
  if (hasBridge(floor)) throw new Error('Bridge floors need forward search from their current state');
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
type Hint = { state: State; distance: number; next: Direction | null };
const forwardCache = new Map<string, Hint | null>();
/** Switch presses do not reverse. Search forward with the bridge flag in the visited key. */
export function solutionStep(s: State, floor: readonly string[]): Hint | null {
  if (!hasBridge(floor)) return distances(floor).get(key(s)) ?? null;
  const shape = floor.join('/') + ':';
  const cached = forwardCache.get(shape + key(s));
  if (cached !== undefined) return cached;
  const queue: { state: State; parent: number; direction: Direction | null }[] = [
    { state: s, parent: -1, direction: null },
  ];
  const seen = new Set([key(s)]);
  for (let head = 0; head < queue.length; head++) {
    const v = queue[head];
    if (solved(v.state, floor)) {
      let index = head,
        distance = 0;
      forwardCache.set(shape + key(v.state), { state: v.state, distance: 0, next: null });
      while (queue[index].parent >= 0) {
        const child = queue[index];
        index = child.parent;
        distance++;
        forwardCache.set(shape + key(queue[index].state), {
          state: queue[index].state,
          distance,
          next: child.direction,
        });
      }
      return forwardCache.get(shape + key(s))!;
    }
    for (const d of DIRECTIONS) {
      const n = roll(v.state, d, floor);
      if (!n || seen.has(key(n))) continue;
      seen.add(key(n));
      queue.push({ state: n, parent: head, direction: d });
    }
  }
  forwardCache.set(shape + key(s), null);
  return null;
}
/** Upright poses exactly `depth` rolls from the hollow: the possible starts. */
export const startsAt = (floor: readonly string[], depth: number) =>
  (hasBridge(floor)
    ? floor
        .flatMap((row, y) =>
          [...row].flatMap((v, x) =>
            v === '.' || v === 'S' ? [solutionStep({ x, y, pose: 'up' }, floor)] : [],
          ),
        )
        .filter(
          (v): v is Hint =>
            v !== null &&
            !v.state.bridge &&
            !solutionStep(
              v.state,
              floor.map((row) => row.replace(/S/g, '.')),
            ),
        )
    : [...distances(floor).values()]
  )
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
  grownup: { min: 1, max: 7 },
};
