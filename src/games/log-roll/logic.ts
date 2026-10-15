import type { Rng } from '../../engine/random';

export type Pose = 'up' | 'across' | 'along';
export interface State { x: number; y: number; pose: Pose }
export const DIRECTIONS = ['up', 'down', 'left', 'right'] as const;
export type Direction = typeof DIRECTIONS[number];
export const PLANS = [
  { floor: ['.....', '.....', '.....', '.....', '.....'], depth: 4, name: 'Open stones: learn to tip and stand' },
  { floor: ['......', '.. ...', '......', '... ..', '......'], depth: 8, name: 'Two gaps: plan the log’s footprint' },
  { floor: ['.......', '. .....', '.... ..', '.. ....', '.......'], depth: 12, name: 'Broken path: weave around three gaps' },
] as const;
export const planFor = (level: number) => PLANS[Math.max(0, Math.min(2, level - 1))];
export const goal = (floor: readonly string[]): State => ({ x: floor[0].length - 1, y: floor.length - 1, pose: 'up' });
export const key = (s: State) => `${s.x},${s.y},${s.pose}`;
export const solved = (s: State, floor: readonly string[]) => key(s) === key(goal(floor));
export function footprint(s: State): [number, number][] {
  return [[s.x, s.y], ...(s.pose === 'across' ? [[s.x + 1, s.y] as [number, number]] : s.pose === 'along' ? [[s.x, s.y + 1] as [number, number]] : [])];
}
export function roll(s: State, d: Direction, floor: readonly string[]): State | null {
  const n = { ...s };
  if (d === 'left' || d === 'right') {
    const sign = d === 'left' ? -1 : 1;
    if (s.pose === 'up') { n.x += sign < 0 ? -2 : 1; n.pose = 'across'; }
    else if (s.pose === 'across') { n.x += sign < 0 ? -1 : 2; n.pose = 'up'; }
    else n.x += sign;
  } else {
    const sign = d === 'up' ? -1 : 1;
    if (s.pose === 'up') { n.y += sign < 0 ? -2 : 1; n.pose = 'along'; }
    else if (s.pose === 'along') { n.y += sign < 0 ? -1 : 2; n.pose = 'up'; }
    else n.y += sign;
  }
  return footprint(n).every(([x, y]) => floor[y]?.[x] === '.') ? n : null;
}
const opposite: Record<Direction, Direction> = { up: 'down', down: 'up', left: 'right', right: 'left' };
const cache = new Map<string, Map<string, { state: State; distance: number; next: Direction | null }>>();
/** Reversible rolls let a reverse BFS prove exact shortest hints from every reachable pose. */
export function distances(floor: readonly string[]) {
  const shape = floor.join('/'), old = cache.get(shape);
  if (old) return old;
  const GOAL = goal(floor);
  const table = new Map<string, { state: State; distance: number; next: Direction | null }>([[key(GOAL), { state: GOAL, distance: 0, next: null }]]);
  const queue = [GOAL];
  for (let head = 0; head < queue.length; head++) {
    const s = queue[head], distance = table.get(key(s))!.distance;
    for (const d of DIRECTIONS) {
      const n = roll(s, d, floor);
      if (!n || table.has(key(n))) continue;
      table.set(key(n), { state: n, distance: distance + 1, next: opposite[d] }); queue.push(n);
    }
  }
  cache.set(shape, table); return table;
}
export const solutionStep = (s: State, floor: readonly string[]) => distances(floor).get(key(s)) ?? null;
export function makePuzzle(level: number, rng: Rng) {
  const plan = planFor(level);
  const candidates = [...distances(plan.floor).values()].filter(v => v.distance === plan.depth && v.state.pose === 'up');
  if (!candidates.length) throw new Error(`No Log Roll starts at depth ${plan.depth}`);
  return { plan, start: { ...rng.pick(candidates).state } };
}
