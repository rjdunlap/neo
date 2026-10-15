import type { Rng } from '../../engine/random';
import type { BandLevels } from '../../progress/difficulty';

/** Fifteen holes in a triangular lattice; bit i means a marble occupies hole i. */
export const HOLES = Array.from({ length: 5 }, (_, row) =>
  Array.from({ length: row + 1 }, (_, col) => ({ row, col }))).flat();
export interface Jump { from: number; over: number; to: number }
const at = (r: number, c: number) => HOLES.findIndex(h => h.row === r && h.col === c);
export const JUMPS: readonly Jump[] = HOLES.flatMap((h, from) =>
  [[0, 1], [0, -1], [1, 0], [-1, 0], [1, 1], [-1, -1]].flatMap(([dr, dc]) => {
    const over = at(h.row + dr, h.col + dc), to = at(h.row + 2 * dr, h.col + 2 * dc);
    return over < 0 || to < 0 ? [] : [{ from, over, to }];
  }));
export const FULL = (1 << HOLES.length) - 1;
export const occupied = (board: number, i: number) => !!(board & (1 << i));
export function count(board: number): number {
  let n = 0;
  for (let b = board; b; b &= b - 1) n++;
  return n;
}
export const legal = (board: number, j: Jump) => occupied(board, j.from) && occupied(board, j.over) && !occupied(board, j.to);
export const moves = (board: number) => JUMPS.filter(j => legal(board, j));
/** Illegal input leaves the board alone. */
export function jump(board: number, j: Jump): number {
  return JUMPS.some(m => m.from === j.from && m.over === j.over && m.to === j.to) && legal(board, j)
    ? board ^ (1 << j.from) ^ (1 << j.over) ^ (1 << j.to) : board;
}
const memo = new Map<number, readonly Jump[] | null>();
/** Exact search over at most 2^15 states. Every jump removes one marble, so there are no cycles. */
export function solve(board: number): readonly Jump[] | null {
  if (count(board) === 1) return [];
  if (memo.has(board)) return memo.get(board)!;
  for (const j of moves(board)) {
    const rest = solve(jump(board, j));
    if (rest !== null) { const route = [j, ...rest]; memo.set(board, route); return route; }
  }
  memo.set(board, null); return null;
}
export const PLANS = [3, 5, 7, 9, 11, 14] as const;
export const LEVELS: BandLevels = { grownup: { min: 1, max: 6 } };
export const marblesFor = (level: number) => PLANS[Math.max(0, Math.min(5, level - 1))];
/** Begin on a suffix of an exactly solved full triangle; no randomly unsolvable boards. */
export function makeBoard(level: number, rng: Rng): number {
  const starts = HOLES.map((_, i) => FULL ^ (1 << i)).filter(b => solve(b) !== null);
  let board = rng.pick(starts);
  const route = solve(board)!;
  for (const j of route.slice(0, 14 - marblesFor(level))) board = jump(board, j);
  return board;
}
/** A dead end needs revision: find the nearest earlier board with a clearing route. */
export function recovery(history: readonly number[]): number | null {
  for (let i = history.length - 1; i >= 0; i--) if (solve(history[i]) !== null) return i;
  return null;
}
