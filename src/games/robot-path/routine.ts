import { DIRECTIONS, runPath, type Cell, type Direction, type RobotPlan } from './logic';

/**
 * Level 15, A routine (docs/deep-dives/robot-path.md#level-15-a-routine): a purple "Do this" row of arrows and a call tile
 * that runs them from wherever the robot is. The corridor is the only open ground, so reuse is necessary: three main
 * slots and two routine slots cannot walk five steps without calling the routine twice.
 */
export type Tile = Direction | 'call';
export type Row = 'main' | 'routine';

export const MAIN_LIMIT = 3;
export const ROUTINE_LIMIT = 2;

export interface RoutinePlan extends RobotPlan {
  size: 4;
  /** Not sliced to the slot limit: the expanded walk may be longer than the three main slots. */
  mode: 'counts';
  /** Open cells in walking order, from (0, 0) to the star; every other cell is blocked. */
  corridor: Cell[];
  /** The "Do this" arrows already placed when the round starts. */
  routine: Direction[];
  /** The row the first slot of which starts selected. */
  startRow: Row;
}

function board(name: string, corridor: Cell[], routine: Direction[], startRow: Row): RoutinePlan {
  const open = new Set(corridor.map((c) => c.join(',')));
  const rocks: Cell[] = [];
  for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) if (!open.has(`${x},${y}`)) rocks.push([x, y]);
  return {
    size: 4,
    goal: corridor[corridor.length - 1],
    rocks,
    limit: MAIN_LIMIT,
    mode: 'counts',
    name,
    corridor,
    routine,
    startRow,
  };
}

/** The first board teaches the call with a prefilled routine; the second leaves the routine for her to write. */
export const ROUTINE_PLANS: RoutinePlan[] = [
  board(
    'Around the middle',
    [
      [0, 0],
      [1, 0],
      [1, 1],
      [2, 1],
      [3, 1],
      [3, 2],
    ],
    ['right', 'down'],
    'main',
  ),
  board(
    'Down the steps',
    [
      [0, 0],
      [0, 1],
      [1, 1],
      [1, 2],
      [2, 2],
      [2, 3],
    ],
    [],
    'routine',
  ),
];

/** An editor state: both rows and the selected slot. Copied for Undo. */
export interface Editor {
  main: Tile[];
  routine: Direction[];
  sel: { row: Row; i: number };
}

export const startEditor = (plan: RoutinePlan): Editor => ({
  main: [],
  routine: [...plan.routine],
  sel: { row: plan.startRow, i: plan.startRow === 'main' ? 0 : plan.routine.length },
});

export const copyEditor = (e: Editor): Editor => ({
  main: [...e.main],
  routine: [...e.routine],
  sel: { ...e.sel },
});

/**
 * One-level expansion: the steps the robot takes and, for each, the main slot and (inside a call) the routine slot it is
 * carrying out. Null when a call has nothing to run, so an empty routine can never run.
 */
export function expandRoutine(
  main: readonly Tile[],
  routine: readonly Direction[],
): { steps: Direction[]; main: number[]; sub: number[] } | null {
  const out = { steps: [] as Direction[], main: [] as number[], sub: [] as number[] };
  for (let i = 0; i < main.length; i++) {
    const tile = main[i];
    if (tile === 'call') {
      if (!routine.length) return null;
      routine.forEach((dir, k) => {
        out.steps.push(dir);
        out.main.push(i);
        out.sub.push(k);
      });
    } else {
      out.steps.push(tile);
      out.main.push(i);
      out.sub.push(-1);
    }
  }
  return out;
}

export type RoutineRun =
  | { kind: 'incomplete'; row: Row | 'play' }
  | {
      kind: 'ran';
      steps: Direction[];
      main: number[];
      sub: number[];
      path: Cell[];
      success: boolean;
      stop: string;
      calls: number;
    };

/** What pressing play does: free incomplete input, or a walk from the start with its stopping place. */
export function runRoutine(
  plan: RoutinePlan,
  main: readonly Tile[],
  routine: readonly Direction[],
): RoutineRun {
  if (!main.length) return { kind: 'incomplete', row: 'play' };
  const expanded = expandRoutine(main, routine);
  if (!expanded) return { kind: 'incomplete', row: 'routine' };
  const result = runPath(plan, expanded.steps);
  // Steps past the star are never taken: count only the calls the robot actually started.
  const taken = result.path.length - 1;
  const calls = new Set(expanded.main.slice(0, taken).filter((_, k) => expanded.sub[k] >= 0)).size;
  return { kind: 'ran', ...expanded, path: result.path, success: result.success, stop: result.stop, calls };
}

/** The slots a press can change: any filled slot or the next empty one. */
export const rowOf = (e: Editor, row: Row): readonly Tile[] => (row === 'main' ? e.main : e.routine);
export const limitOf = (row: Row) => (row === 'main' ? MAIN_LIMIT : ROUTINE_LIMIT);

export type EditResult = 'ok' | 'needs-routine' | 'needs-main' | 'no-slot';

/** Put a tile in the selected slot (replace, or append at the next empty slot), then move on within that row. */
export function applyTile(e: Editor, tile: Tile): EditResult {
  const { row, i } = e.sel;
  if (tile === 'call') {
    if (row === 'routine') return 'needs-main';
    if (!e.routine.length) return 'needs-routine';
  }
  const slots = rowOf(e, row) as Tile[];
  if (i > slots.length || i >= limitOf(row)) return 'no-slot';
  slots[i] = tile;
  if (i + 1 < limitOf(row)) e.sel = { row, i: i + 1 };
  return 'ok';
}

/** Select a filled slot or the next empty one; anything further along is not a slot yet. */
export function selectSlot(e: Editor, row: Row, i: number): boolean {
  if (i > rowOf(e, row).length || i >= limitOf(row)) return false;
  e.sel = { row, i };
  return true;
}

export type RoutinePress = { play: true } | { slot: { row: Row; i: number } } | { tile: Tile };

const TILES: Tile[] = [...DIRECTIONS, 'call'];
const winners = new Map<RoutinePlan, { main: Tile[]; routine: Direction[] }[]>();

/** Every legal row pair that reaches the star, in a fixed order so a tie always breaks the same way. */
export function winningPrograms(plan: RoutinePlan): { main: Tile[]; routine: Direction[] }[] {
  const known = winners.get(plan);
  if (known) return known;
  const routines: Direction[][] = [[]];
  for (let n = 1; n <= ROUTINE_LIMIT; n++)
    routines.push(
      ...(n === 1 ? DIRECTIONS.map((d) => [d]) : DIRECTIONS.flatMap((a) => DIRECTIONS.map((b) => [a, b]))),
    );
  const mains: Tile[][] = [[]];
  let layer: Tile[][] = [[]];
  for (let n = 1; n <= MAIN_LIMIT; n++) {
    layer = layer.flatMap((m) => TILES.map((t) => [...m, t]));
    mains.push(...layer);
  }
  const out: { main: Tile[]; routine: Direction[] }[] = [];
  for (const routine of routines)
    for (const main of mains) {
      const run = runRoutine(plan, main, routine);
      if (run.kind === 'ran' && run.success) out.push({ main, routine });
    }
  winners.set(plan, out);
  return out;
}

/**
 * The next button toward a winning program, one edit at a time. Prefers the winner that keeps the most filled slots (a
 * winner whose routine is shorter than hers is skipped: a slot cannot be emptied), lights the slot, then its tile.
 */
export function routinePress(plan: RoutinePlan, e: Editor): RoutinePress {
  const run = runRoutine(plan, e.main, e.routine);
  if (run.kind === 'ran' && run.success) return { play: true };
  let best: { main: Tile[]; routine: Direction[] } | null = null;
  let bestKept = -1;
  for (const w of winningPrograms(plan)) {
    if (w.routine.length < e.routine.length) continue;
    const kept =
      e.routine.filter((d, k) => d === w.routine[k]).length +
      e.main.filter((t, k) => k < w.main.length && t === w.main[k]).length;
    // Every filled slot the winner overrides must be one she can still replace, which any filled slot is.
    if (kept > bestKept) {
      best = w;
      bestKept = kept;
    }
  }
  if (!best) return { play: true };
  const rows: Row[] = ['routine', 'main'];
  for (const row of rows) {
    const want: readonly Tile[] = row === 'main' ? best.main : best.routine;
    const have = rowOf(e, row);
    for (let i = 0; i < want.length; i++) {
      if (have[i] === want[i]) continue;
      if (e.sel.row === row && e.sel.i === i) return { tile: want[i] };
      return { slot: { row, i } };
    }
  }
  return { play: true };
}
