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
  const z = board.indexOf(0),
    r = Math.floor(z / cols),
    c = z % cols;
  return [z - cols, z + cols, z - 1, z + 1].filter(
    (i) => i >= 0 && i < board.length && Math.abs(Math.floor(i / cols) - r) + Math.abs((i % cols) - c) === 1,
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
/** The boards a level draws from, every one at an exact shortest distance inside its range. */
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
export function solutionStep(board: readonly number[], cols: number, order: GoalOrder = 'rows') {
  return distances(board.length / cols, cols, order).get(key(board)) ?? null;
}
export function makeBoard(level: number, rng: Rng): number[] {
  return rng.pick(pool(level)).slice();
}

/**
 * Where the board, the goal picture and the three buttons go: cells up to 136 units, the board left of middle with the goal
 * picture to its right, the buttons along the bottom. `grid` is the first cell's center; `target` the goal picture's center
 * column. The same formula fits a 768-wide upright phone (chunk 31), the button row stepped clear of the guide.
 */
export function nookLayout(w: number, h: number, rows: number, cols: number) {
  const cell = Math.min(136, (h - 340) / rows, (w - 420) / cols);
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
  grownup: { min: 1, max: 5 },
};
