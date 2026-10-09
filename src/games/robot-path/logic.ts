export const DIRECTIONS = ['up', 'right', 'down', 'left'] as const;
export type Direction = (typeof DIRECTIONS)[number];
export type Cell = readonly [number, number];
export const DELTAS: Record<Direction, Cell> = { up: [0, -1], right: [1, 0], down: [0, 1], left: [-1, 0] };
/**
 * 'steps' levels hold one step per program slot. 'counts' levels let a slot repeat its step ("right ×4").
 * 'loop' levels add a loop button that repeats the whole program. `limit` is the number of slots;
 * counted and looped levels give a solution that uses those ideas.
 */
export type RobotMode = 'steps' | 'counts' | 'loop';
export interface Slot { dir: Direction; n: number }
export interface RobotPlan { size: number; goal: Cell; rocks: Cell[]; limit: number; name: string; mode?: RobotMode; solution?: { slots: Slot[]; loop: number } }
export const ROBOT_PLANS: RobotPlan[] = [
  { size: 3, goal: [2, 0], rocks: [], limit: 3, name: 'Two steps straight to the star' },
  { size: 3, goal: [2, 1], rocks: [], limit: 4, name: 'Three steps with a turn' },
  { size: 4, goal: [2, 2], rocks: [], limit: 5, name: 'Four steps across a bigger grid' },
  { size: 4, goal: [2, 2], rocks: [[1, 1], [3, 1]], limit: 6, name: 'Plan around rocks' },
  { size: 4, goal: [1, 3], rocks: [[1, 1], [0, 2]], limit: 7, name: 'Take a longer path around rocks' },
  { size: 4, goal: [3, 3], rocks: [[1, 0], [1, 1], [2, 0], [1, 3]], limit: 8, name: 'Plan up to eight steps' },
  // Early school: say how many times, then repeat a whole program.
  { size: 5, goal: [4, 2], rocks: [[0, 1], [1, 1], [2, 1], [3, 1]], limit: 2, mode: 'counts', name: 'Repeat a step: tap an arrow again to go further ("right ×4, down ×2")', solution: { slots: [{ dir: 'right', n: 4 }, { dir: 'down', n: 2 }], loop: 1 } },
  { size: 5, goal: [0, 4], rocks: [[0, 1], [1, 1], [2, 1], [3, 1], [1, 3], [2, 3], [3, 3], [4, 3]], limit: 4, mode: 'counts', name: 'A winding path in four counted moves', solution: { slots: [{ dir: 'right', n: 4 }, { dir: 'down', n: 2 }, { dir: 'left', n: 4 }, { dir: 'down', n: 2 }], loop: 1 } },
  { size: 5, goal: [4, 4], rocks: [[2, 0], [3, 1], [4, 2], [0, 1], [1, 2], [2, 3], [3, 4]], limit: 2, mode: 'loop', name: 'A loop: repeat "right, down" up a staircase', solution: { slots: [{ dir: 'right', n: 1 }, { dir: 'down', n: 1 }], loop: 4 } },
  { size: 5, goal: [4, 4], rocks: [[0, 1], [1, 1], [3, 0], [3, 1], [2, 3], [3, 3]], limit: 3, mode: 'loop', name: 'A longer loop body: "right ×2, down ×2", twice', solution: { slots: [{ dir: 'right', n: 2 }, { dir: 'down', n: 2 }], loop: 2 } },
];

/** The steps a program of counted slots makes, with its loop. */
export function expand(slots: readonly Slot[], loop = 1): Direction[] {
  const once = slots.flatMap((s) => Array<Direction>(s.n).fill(s.dir));
  return Array.from({ length: loop }, () => once).flat();
}

/** Which slot each step of the expanded program comes from: for highlighting during playback. */
export function slotOfStep(slots: readonly Slot[], loop = 1): number[] {
  const once = slots.flatMap((s, i) => Array<number>(s.n).fill(i));
  return Array.from({ length: loop }, () => once).flat();
}

/** Same steps in fewest slots: consecutive equal steps become one counted slot. */
export function compress(route: readonly Direction[]): Slot[] {
  const out: Slot[] = [];
  for (const dir of route) {
    const last = out[out.length - 1];
    if (last && last.dir === dir) last.n++;
    else out.push({ dir, n: 1 });
  }
  return out;
}
const same = (a: Cell, b: Cell) => a[0] === b[0] && a[1] === b[1];
export function step(cell: Cell, dir: Direction): Cell { return [cell[0] + DELTAS[dir][0], cell[1] + DELTAS[dir][1]]; }
export function allowed(cell: Cell, plan: RobotPlan): boolean {
  return cell.every((n) => n >= 0 && n < plan.size) && !plan.rocks.some((r) => same(r, cell));
}
export function runPath(plan: RobotPlan, program: readonly Direction[]): { path: Cell[]; success: boolean } {
  const path: Cell[] = [[0, 0]];
  // On counted and looped levels the limit is on slots, not steps.
  for (const dir of (plan.mode ?? 'steps') === 'steps' ? program.slice(0, plan.limit) : program) {
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

/** What a player pressing the known route does next: one of the buttons. */
export type Press = { clear: true } | { arrow: Direction } | { loop: true } | { play: true };

/**
 * The next button for a program, from a known solution (the hint's ring after two misses, and the how-to card's ghost finger):
 * clear it if it has left the solution, else one more of the last step or the next arrow, then the loop count, then play.
 */
export function nextPress(solution: readonly Slot[], program: readonly Slot[], mode: RobotMode, loop: number, wantLoop: number): Press {
  const prefix = program.every((s, i) => solution[i] && s.dir === solution[i].dir && (i < program.length - 1 ? s.n === solution[i].n : s.n <= solution[i].n));
  if (!prefix) return { clear: true };
  const last = program[program.length - 1];
  const lastSol = solution[program.length - 1];
  if (last && lastSol && last.n < lastSol.n) return { arrow: last.dir };
  if (program.length < solution.length) return { arrow: solution[program.length].dir };
  if (mode === 'loop' && loop !== wantLoop) return { loop: true };
  return { play: true };
}
