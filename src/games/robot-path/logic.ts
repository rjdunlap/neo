import type { Rng } from '../../engine/random';

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
/** `via` is an apple the robot must pass through before it ends on the star. */
export interface RobotPlan { size: number; goal: Cell; rocks: Cell[]; limit: number; name: string; mode?: RobotMode; via?: Cell; solution?: { slots: Slot[]; loop: number } }
/** An authored program for the prediction level; predictions are experiments, not answers to score. */
export interface PredictPlan extends RobotPlan { mode: 'steps' | 'counts'; program: Slot[] }
/** A counted program with one short final run that can be fixed by extending that slot. */
export interface FixPlan extends RobotPlan { mode: 'counts'; solution: { slots: Slot[]; loop: 1 }; broken: Slot[]; fixSlot: number }
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

/** Reflect across the diagonal: keep the route's idea while changing its first direction. */
function transpose(plan: RobotPlan): RobotPlan {
  const cell = ([x, y]: Cell): Cell => [y, x];
  const direction: Record<Direction, Direction> = { up: 'left', right: 'down', down: 'right', left: 'up' };
  return {
    ...plan, goal: cell(plan.goal), rocks: plan.rocks.map(cell),
    solution: plan.solution && {
      slots: plan.solution.slots.map(({ dir, n }) => ({ dir: direction[dir], n })),
      loop: plan.solution.loop,
    },
  };
}

/** Each pool preserves its level's grid, controls and slot budget. The originals remain first. */
export const ROBOT_BOARDS: readonly (readonly RobotPlan[])[] = ROBOT_PLANS.map((plan, i) => {
  const third: RobotPlan = i === 0 ? { ...plan, goal: [0, 1] }
    : i === 1 ? { ...plan, goal: [1, 1] }
    : i === 2 ? { ...plan, goal: [1, 2] }
    : i === 3 ? { ...plan, goal: [3, 2], rocks: [[1, 0], [1, 1]] }
    : i === 4 ? { ...plan, goal: [3, 2], rocks: [[1, 0], [1, 1], [2, 2]] }
    : i === 5 ? { ...plan, goal: [2, 3], rocks: [[0, 1], [1, 1], [2, 1], [3, 3]] }
    // Keep the counted/looped solution, but put the rocks in a different configuration.
    : { ...plan, rocks: [...plan.rocks, i === 6 ? [2, 3] : i === 7 ? [2, 4] : i === 8 ? [4, 0] : [0, 4]] };
  // The square, rock-free level 3 is unchanged by reflection; vary the straight-run lengths.
  const second = i === 2 ? { ...plan, goal: [3, 1] as Cell } : transpose(plan);
  return [plan, second, third];
});

/** A seeded round draw, separate from the stable descriptions and saved level IDs. */
export function boardFor(level: number, rng: Rng): RobotPlan {
  return rng.pick(ROBOT_BOARDS[Math.max(0, Math.min(ROBOT_BOARDS.length - 1, level - 1))]);
}

/**
 * Level 13: counted steps again, with an apple on the way. Each apple sits off every shortest route to the star
 * (the plain way there skips it), and each authored route passes through it and ends on the star.
 */
export const VIA_PLANS: RobotPlan[] = [
  { size: 5, goal: [4, 0], rocks: [], via: [2, 3], limit: 4, mode: 'counts', name: 'Pick up the apple on the way to the star', solution: { slots: [{ dir: 'down', n: 3 }, { dir: 'right', n: 2 }, { dir: 'up', n: 3 }, { dir: 'right', n: 2 }], loop: 1 } },
  { size: 5, goal: [2, 4], rocks: [[3, 1]], via: [4, 2], limit: 4, mode: 'counts', name: 'Go through the apple, then on to the star', solution: { slots: [{ dir: 'right', n: 4 }, { dir: 'down', n: 2 }, { dir: 'left', n: 2 }, { dir: 'down', n: 2 }], loop: 1 } },
  { size: 5, goal: [0, 4], rocks: [[1, 1], [1, 2]], via: [3, 3], limit: 4, mode: 'counts', name: 'The apple first, then the star', solution: { slots: [{ dir: 'down', n: 3 }, { dir: 'right', n: 3 }, { dir: 'down', n: 1 }, { dir: 'left', n: 3 }], loop: 1 } },
];

/** The same blocked route shown as individual steps and as counted steps. */
export const PREDICT_PLANS: PredictPlan[] = [
  {
    size: 5, goal: [4, 4], rocks: [[2, 0]], limit: 6, mode: 'steps', name: 'Where will it stop? Read each arrow.',
    program: [{ dir: 'right', n: 1 }, { dir: 'right', n: 1 }, { dir: 'right', n: 1 }, { dir: 'down', n: 1 }, { dir: 'down', n: 1 }, { dir: 'left', n: 1 }],
  },
  {
    size: 5, goal: [4, 4], rocks: [[2, 0]], limit: 3, mode: 'counts', name: 'Where will it stop? Read the counts.',
    program: [{ dir: 'right', n: 3 }, { dir: 'down', n: 2 }, { dir: 'left', n: 1 }],
  },
];

/** The first run is a free watch; each program needs one counted step added to its last slot. */
export const FIX_PLANS: FixPlan[] = [
  { size: 5, goal: [4, 4], rocks: [[2, 0]], limit: 2, mode: 'counts', name: 'Add one step to reach the star', solution: { slots: [{ dir: 'down', n: 4 }, { dir: 'right', n: 4 }], loop: 1 }, broken: [{ dir: 'down', n: 4 }, { dir: 'right', n: 3 }], fixSlot: 1 },
  { size: 5, goal: [4, 3], rocks: [[0, 2]], limit: 2, mode: 'counts', name: 'Read the program and add its missing step', solution: { slots: [{ dir: 'right', n: 4 }, { dir: 'down', n: 3 }], loop: 1 }, broken: [{ dir: 'right', n: 4 }, { dir: 'down', n: 2 }], fixSlot: 1 },
  { size: 5, goal: [3, 4], rocks: [[4, 2]], limit: 2, mode: 'counts', name: 'Fix the short program', solution: { slots: [{ dir: 'down', n: 4 }, { dir: 'right', n: 3 }], loop: 1 }, broken: [{ dir: 'down', n: 4 }, { dir: 'right', n: 2 }], fixSlot: 1 },
];

export function sameProgram(a: readonly Slot[], b: readonly Slot[]): boolean {
  return a.length === b.length && a.every((slot, i) => slot.dir === b[i].dir && slot.n === b[i].n);
}

/** Run a shown program without treating its collision or short finish as a failed puzzle. */
export function predictionEnd(plan: PredictPlan): Cell {
  let cell: Cell = [0, 0];
  for (const dir of expand(plan.program)) {
    const next = step(cell, dir);
    if (!allowed(next, plan)) break;
    cell = next;
    if (same(cell, plan.goal)) break;
  }
  return cell;
}

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
export function runPath(plan: RobotPlan, program: readonly Direction[]): { path: Cell[]; success: boolean; stop: 'goal' | 'bump' | 'short' | 'empty' | 'forgot' } {
  const path: Cell[] = [[0, 0]];
  let picked = !plan.via;
  // On counted and looped levels the limit is on slots, not steps.
  for (const dir of (plan.mode ?? 'steps') === 'steps' ? program.slice(0, plan.limit) : program) {
    const cell = step(path[path.length - 1], dir);
    if (!allowed(cell, plan)) return { path, success: false, stop: 'bump' };
    path.push(cell);
    if (plan.via && same(cell, plan.via)) picked = true;
    if (same(cell, plan.goal) && picked) return { path, success: true, stop: 'goal' };
  }
  // Ending on the star without the apple is its own miss; passing the star on the way is fine.
  if (!picked && same(path[path.length - 1], plan.goal)) return { path, success: false, stop: 'forgot' };
  return { path, success: false, stop: program.length ? 'short' : 'empty' };
}
export function shortestPath(plan: RobotPlan, start: Cell = [0, 0]): Direction[] {
  const queue: { cell: Cell; route: Direction[] }[] = [{ cell: start, route: [] }];
  const seen = new Set([start.join(',')]);
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

/** Preserve any shortest step-route prefix before falling back to the authored teaching solution. */
export function routePress(plan: RobotPlan, program: readonly Slot[], loop: number): Press {
  const mode = plan.mode ?? 'steps';
  let solution = plan.solution?.slots ?? shortestPath(plan).map(dir => ({ dir, n: 1 }));
  if (mode === 'steps') {
    const steps = expand(program);
    const result = runPath(plan, steps);
    if (result.success) return { play: true };
    if (result.stop !== 'bump' && steps.length <= plan.limit) {
      const tail = shortestPath(plan, result.path[result.path.length - 1]);
      if (steps.length + tail.length === shortestPath(plan).length) {
        solution = [...steps, ...tail].map(dir => ({ dir, n: 1 }));
      }
    }
  }
  return nextPress(solution, program, mode, loop, plan.solution?.loop ?? 1);
}
