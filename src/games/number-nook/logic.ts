import type { BandLevels } from '../../progress/difficulty';
import type { Rng } from '../../engine/random';
import { rankedDistances } from './ranked-distances';

export type GoalOrder = 'rows' | 'columns';

/** Each level draws a board whose shortest route is `near`..`far` slides, so the small boards have a pool, not one puzzle. */
export const PLANS = [
  { rows: 2, cols: 2, near: 3, far: 5, order: 'rows', name: 'Four spaces: one small loop' },
  { rows: 2, cols: 3, near: 7, far: 9, order: 'rows', name: 'Six spaces: plan around two rows' },
  { rows: 3, cols: 3, near: 14, far: 14, order: 'rows', name: 'Nine spaces: weave rows and columns' },
  { rows: 2, cols: 4, near: 18, far: 18, order: 'rows', name: 'Eight spaces: two long rows' },
  { rows: 3, cols: 3, near: 14, far: 14, order: 'columns', name: 'Nine spaces: read the new goal' },
  { rows: 3, cols: 4, near: 24, far: 24, order: 'rows', name: 'Twelve spaces' },
  { rows: 4, cols: 4, near: 30, far: 30, order: 'rows', name: 'The fifteen' },
] as const;
export const planFor = (level: number) => PLANS[Math.max(0, Math.min(PLANS.length - 1, level - 1))];
export const goal = (rows: number, cols: number, order: GoalOrder = 'rows') =>
  Array.from(
    { length: rows * cols },
    (_, i) => (order === 'columns' ? (i % cols) * rows + Math.floor(i / cols) + 1 : i + 1) % (rows * cols),
  );
export const solved = (board: readonly number[], target: readonly number[] = goal(1, board.length)) =>
  board.every((v, i) => v === target[i]);
/** How many numbered tiles sit in this round's goal place. */
export const inPlace = (board: readonly number[], target: readonly number[] = goal(1, board.length)) =>
  board.filter((v, i) => v !== 0 && v === target[i]).length;
export function neighbours(board: readonly number[], cols: number): number[] {
  return gapNeighbours(board.indexOf(0), board.length, cols);
}
function gapNeighbours(z: number, size: number, cols: number): number[] {
  const r = Math.floor(z / cols),
    c = z % cols;
  return [z - cols, z + cols, z - 1, z + 1].filter(
    (i) => i >= 0 && i < size && Math.abs(Math.floor(i / cols) - r) + Math.abs((i % cols) - c) === 1,
  );
}
export function slide(board: readonly number[], cols: number, at: number): number[] | null {
  if (!neighbours(board, cols).includes(at)) return null;
  const next = board.slice(),
    z = next.indexOf(0);
  [next[z], next[at]] = [next[at], next[z]];
  return next;
}
/**
 * A tap in the gap's row or column slides that tile and every tile between it and the gap, as single slides from the gap
 * outward: `steps` lists the cells slid, nearest the gap first, so the count stays in one-tile moves. Any other tap is null.
 */
export function lineSlide(
  board: readonly number[],
  cols: number,
  at: number,
): { board: number[]; steps: number[] } | null {
  const z = board.indexOf(0);
  if (at < 0 || at >= board.length || at === z) return null;
  const sameRow = Math.floor(at / cols) === Math.floor(z / cols),
    sameCol = at % cols === z % cols;
  if (!sameRow && !sameCol) return null;
  const step = sameRow ? Math.sign(at - z) : cols * Math.sign(at - z),
    steps: number[] = [];
  let next = board.slice();
  for (let c = z + step; ; c += step) {
    next = slide(next, cols, c)!;
    steps.push(c);
    if (c === at) return { board: next, steps };
  }
}

const pools = new Map<number, number[][]>();
/** The small-board pools, each board an exact shortest distance inside the level's range. */
export function pool(level: number): number[][] {
  const cached = pools.get(level);
  if (cached) return cached;
  const p = planFor(level);
  const boards = [...distances(p.rows, p.cols, p.order)]
    .filter(([, info]) => info.distance >= p.near && info.distance <= p.far)
    .map(([k]) => k.split('').map(Number));
  pools.set(level, boards);
  return boards;
}
/** Reverse breadth-first search: all reachable positions, with exact distances and a next slide.
 * Small boards have 12/360 states, the eight-space board 20,160 and the nine-space board 181,440. Cached per shape.
 * This proves every hint decreases distance, even after arbitrary exploratory slides. */
const tables = new Map<string, Map<string, { distance: number; next: number }>>();
const key = (b: readonly number[]) => b.join('');
export function distances(rows: number, cols: number, order: GoalOrder = 'rows') {
  if (rows === 3 && cols === 3) return rankedDistances(goal(rows, cols, order), cols, neighbours, slide);
  if (rows * cols > 9) throw new RangeError('Full distance tables are only for small boards');
  const shape = `${rows},${cols}`,
    cached = tables.get(shape);
  if (cached) return cached;
  const start = goal(rows, cols),
    table = new Map([[key(start), { distance: 0, next: -1 }]]),
    queue = [start];
  for (let head = 0; head < queue.length; head++) {
    const b = queue[head],
      d = table.get(key(b))!.distance;
    for (const at of neighbours(b, cols)) {
      const next = slide(b, cols, at)!,
        k = key(next);
      if (table.has(k)) continue;
      table.set(k, { distance: d + 1, next: b.indexOf(0) });
      queue.push(next);
    }
  }
  tables.set(shape, table);
  return table;
}

function searchGrid(rows: number, cols: number) {
  const target = goal(rows, cols);
  return {
    target,
    moves: target.map((_, gap) => gapNeighbours(gap, target.length, cols)),
    manhattan: target.map((_, at) =>
      target.map((_, tile) => {
        if (!tile) return 0;
        const home = tile - 1;
        return (
          Math.abs(Math.floor(at / cols) - Math.floor(home / cols)) + Math.abs((at % cols) - (home % cols))
        );
      }),
    ),
  };
}
const twelve = searchGrid(3, 4);
const fifteen = searchGrid(4, 4);
const inner = searchGrid(3, 3);
const HINT_NODES = 60_000;

/** For an even width, inversion count plus the gap's row must match the goal's bottom-row parity. */
function evenWidthSolvable(board: readonly number[]) {
  let parity = Math.floor(board.indexOf(0) / 4);
  for (let i = 0; i < board.length; i++)
    for (let j = i + 1; j < board.length; j++) if (board[j] && board[i] > board[j]) parity++;
  return parity % 2 === (board.length / 4 - 1) % 2;
}

/** Iterative-deepening A*: Manhattan distance is a lower bound, so the first route found is shortest. */
function shortestRoute(
  board: readonly number[],
  { moves, manhattan }: ReturnType<typeof searchGrid>,
  budget = Infinity,
): number[] | null {
  const tiles = board.slice(),
    gap = tiles.indexOf(0),
    estimate = tiles.reduce((sum, tile, i) => sum + manhattan[i][tile], 0),
    route: number[] = [];
  function search(blank: number, previous: number, remaining: number, lowerBound: number): boolean {
    if (lowerBound > remaining || budget-- <= 0) return false;
    if (lowerBound === 0) return true;
    for (const at of moves[blank]) {
      if (at === previous) continue;
      const tile = tiles[at];
      tiles[blank] = tile;
      tiles[at] = 0;
      const nextBound = lowerBound + manhattan[blank][tile] - manhattan[at][tile];
      const found = search(at, blank, remaining - 1, nextBound);
      tiles[at] = tile;
      tiles[blank] = 0;
      if (found) {
        route.push(at);
        return true;
      }
      if (budget <= 0) return false;
    }
    return false;
  }
  // Each slide changes Manhattan distance by one, so only bounds of the same parity can solve the board.
  for (let distance = estimate; budget > 0; distance += 2)
    if (search(gap, -1, distance, estimate)) return route.reverse();
  return null;
}

/** Search only the gap and the tiles this stage is placing. Other tiles can take any position outside the locked cells. */
function placeTiles(board: readonly number[], locked: ReadonlySet<number>, homes: readonly number[]) {
  const start = [board.indexOf(0), ...homes.map((home) => board.indexOf(fifteen.target[home]))];
  const encode = (cells: number[]) => cells.reduce((key, cell) => key * 16 + cell, 0);
  const queue = [{ cells: start, parent: -1 }],
    seen = new Set([encode(start)]);
  for (let head = 0; head < queue.length; head++) {
    const { cells } = queue[head];
    if (homes.every((home, i) => cells[i + 1] === home)) {
      const route: number[] = [];
      for (let i = head; queue[i].parent >= 0; i = queue[i].parent) route.push(queue[i].cells[0]);
      return route.reverse();
    }
    const blank = cells[0];
    for (const at of fifteen.moves[blank]) {
      if (locked.has(at)) continue;
      const next = cells.map((cell, i) => (i === 0 ? at : cell === at ? blank : cell));
      const key = encode(next);
      if (seen.has(key)) continue;
      seen.add(key);
      queue.push({ cells: next, parent: head });
    }
  }
  throw new Error('Number Nook could not place the next tiles');
}

/** Finish the top row and then the left column without disturbing the tiles already placed.
 * Place the last two of each border together so the gap can get out of the corner. */
function borderRoute(board: readonly number[]): number[] {
  const tiles = board.slice(),
    route: number[] = [],
    locked = new Set<number>();
  let blank = tiles.indexOf(0);
  for (const homes of [[0], [1], [2, 3], [4], [8, 12]]) {
    for (const at of placeTiles(tiles, locked, homes)) {
      tiles[blank] = tiles[at];
      tiles[at] = 0;
      blank = at;
      route.push(at);
    }
    for (const home of homes) locked.add(home);
  }
  // The remaining cells form a 3×3. Renumber them in their own goal order for the small exact search.
  const cells = fifteen.target.map((_, i) => i).filter((i) => !locked.has(i));
  const remaining = cells.map((i) => (tiles[i] ? cells.indexOf(tiles[i] - 1) + 1 : 0));
  const tail = shortestRoute(remaining, inner)!;
  return route.concat(tail.map((at) => cells[at]));
}

export function fifteenRoute(
  board: readonly number[],
  budget = HINT_NODES,
): { distance: number | null; moves: number[] } | null {
  if (!evenWidthSolvable(board)) return null;
  if (solved(board, fifteen.target)) return { distance: 0, moves: [] };
  const exact = shortestRoute(board, fifteen, budget);
  return exact ? { distance: exact.length, moves: exact } : { distance: null, moves: borderRoute(board) };
}

export function solutionStep(board: readonly number[], cols: number, order: GoalOrder = 'rows') {
  if (board.length === 12 && cols === 4) {
    if (!evenWidthSolvable(board)) return null;
    const route = shortestRoute(board, twelve)!;
    return { distance: route.length, next: route[0] ?? -1 };
  }
  return distances(board.length / cols, cols, order).get(key(board)) ?? null;
}
export function makeBoard(level: number, rng: Rng): number[] {
  const plan = planFor(level);
  if (plan.rows >= 3 && plan.cols === 4) {
    const grid = plan.rows === 4 ? fifteen : twelve;
    // A walk is an upper bound. Check it to discard walks with shortcuts.
    for (;;) {
      const board = grid.target.slice();
      let gap = board.length - 1,
        previous = -1;
      for (let i = 0; i < plan.far; i++) {
        const at = rng.pick(grid.moves[gap].filter((cell) => cell !== previous));
        board[gap] = board[at];
        board[at] = 0;
        previous = gap;
        gap = at;
      }
      if (shortestRoute(board, grid, plan.rows === 4 ? HINT_NODES : Infinity)?.length === plan.far)
        return board;
    }
  }
  return rng.pick(pool(level)).slice();
}

/**
 * Where the board, the goal picture and the three buttons go: cells up to 136 units, the board left of middle with the goal
 * picture to its right, the buttons along the bottom. `grid` is the first cell's center; `target` the goal picture's center
 * column. The same formula fits a 768-wide upright phone (chunk 31), the button row stepped clear of the guide.
 */
export function nookLayout(w: number, h: number, rows: number, cols: number) {
  const cell = Math.min(136, (h - (rows === 4 ? 360 : 340)) / rows, (w - 420) / cols);
  const grid = { x: w / 2 - (cols * cell) / 2 + cell / 2 - 30, y: 180 + cell / 2 };
  return {
    cell,
    grid,
    target: { x: grid.x + (cols - 0.5) * cell + 120 },
    // Upright, the row steps right so its first button clears the guide in the corner.
    buttons: [0, 1, 2].map((i) => ({ x: Math.max(w / 2 - 184, 220) + i * 184, y: h - 110 })),
  };
}

export const LEVELS: BandLevels = {
  grownup: { min: 1, max: 7 },
};
