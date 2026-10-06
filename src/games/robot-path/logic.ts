export const DIRECTIONS = ['up', 'right', 'down', 'left'] as const;
export type Direction = (typeof DIRECTIONS)[number];
export type Cell = readonly [number, number];
export const DELTAS: Record<Direction, Cell> = { up: [0, -1], right: [1, 0], down: [0, 1], left: [-1, 0] };
export interface RobotPlan { size: number; goal: Cell; rocks: Cell[]; limit: number; name: string }
export const ROBOT_PLANS: RobotPlan[] = [
  { size: 3, goal: [2, 0], rocks: [], limit: 3, name: 'Two steps straight to the star' },
  { size: 3, goal: [2, 1], rocks: [], limit: 4, name: 'Three steps with a turn' },
  { size: 4, goal: [2, 2], rocks: [], limit: 5, name: 'Four steps across a bigger grid' },
  { size: 4, goal: [2, 2], rocks: [[1, 1], [3, 1]], limit: 6, name: 'Plan around rocks' },
  { size: 4, goal: [1, 3], rocks: [[1, 1], [0, 2]], limit: 7, name: 'Take a longer path around rocks' },
  { size: 4, goal: [3, 3], rocks: [[1, 0], [1, 1], [2, 0], [1, 3]], limit: 8, name: 'Plan up to eight steps' },
];
const same = (a: Cell, b: Cell) => a[0] === b[0] && a[1] === b[1];
export function step(cell: Cell, dir: Direction): Cell { return [cell[0] + DELTAS[dir][0], cell[1] + DELTAS[dir][1]]; }
export function allowed(cell: Cell, plan: RobotPlan): boolean {
  return cell.every((n) => n >= 0 && n < plan.size) && !plan.rocks.some((r) => same(r, cell));
}
export function runPath(plan: RobotPlan, program: readonly Direction[]): { path: Cell[]; success: boolean } {
  const path: Cell[] = [[0, 0]];
  for (const dir of program.slice(0, plan.limit)) {
    const cell = step(path[path.length - 1], dir);
    if (!allowed(cell, plan)) break;
    path.push(cell);
    if (same(cell, plan.goal)) return { path, success: true };
  }
  return { path, success: false };
}
export function shortestPath(plan: RobotPlan): Direction[] {
  const queue: { cell: Cell; route: Direction[] }[] = [{ cell: [0, 0], route: [] }];
  const seen = new Set(['0,0']);
  for (let i = 0; i < queue.length; i++) {
    const { cell, route } = queue[i];
    if (same(cell, plan.goal)) return route;
    for (const dir of DIRECTIONS) {
      const next = step(cell, dir), key = next.join(',');
      if (!allowed(next, plan) || seen.has(key)) continue;
      seen.add(key); queue.push({ cell: next, route: [...route, dir] });
    }
  }
  return [];
}
