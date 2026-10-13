import type { Rng } from '../../engine/random';
import { POOLS } from './boards';

export type Board = readonly number[];
export type Swap = readonly [number, number];
export interface Puzzle { size: number; board: number[]; par: number }
export const PLANS = [
  { size: 4, gems: 6, name: 'Six gems: one swap clears two lines' },
  { size: 4, gems: 12, name: 'Twelve gems: plan two swaps and falling lines' },
  { size: 5, gems: 15, name: 'Fifteen gems: plan three swaps through the gaps' },
  { size: 5, gems: 18, name: 'Eighteen gems: plan four swaps and cascades' },
];
export const planFor = (level: number) => PLANS[Math.max(0, Math.min(PLANS.length - 1, level - 1))];
export const clear = (b: Board) => b.every(k => k < 0);
export const neighbors = (a: number, b: number, size: number) => a >= 0 && b >= 0 && a < size * size && b < size * size && Math.abs(a % size - b % size) + Math.abs(Math.floor(a / size) - Math.floor(b / size)) === 1;

/** Every horizontal/vertical run of at least three; intersections are removed once. */
export function matches(board: Board, size: number): number[] {
  const out = new Set<number>();
  for (let i = 0; i < board.length; i++) {
    const kind = board[i];
    if (kind < 0) continue;
    for (const d of [1, size]) {
      if (d === 1 ? i % size > size - 3 : Math.floor(i / size) > size - 3) continue;
      if (board[i + d] === kind && board[i + d * 2] === kind) [i, i + d, i + d * 2].forEach(c => out.add(c));
    }
  }
  return [...out].sort((a, b) => a - b);
}

/** Fixed holes at the top, no new gems: gravity only moves what is already in the tray. */
export function fall(board: Board, size: number): number[] {
  const out = Array<number>(size * size).fill(-1);
  for (let x = 0; x < size; x++) {
    const column = Array.from({ length: size }, (_, y) => board[y * size + x]).filter(k => k >= 0);
    column.forEach((k, y) => { out[(size - column.length + y) * size + x] = k; });
  }
  return out;
}
export interface Step { board: number[]; waves: { board: number[]; removed: number[] }[] }
/** A swap is accepted only between occupied neighbours and only if it immediately makes a line. */
export function swap(board: Board, size: number, [a, b]: Swap): Step | null {
  if (!neighbors(a, b, size) || board[a] < 0 || board[b] < 0 || board[a] === board[b]) return null;
  let next = [...board];
  [next[a], next[b]] = [next[b], next[a]];
  if (!matches(next, size).length) return null;
  const waves: Step['waves'] = [];
  for (let removed = matches(next, size); removed.length; removed = matches(next, size)) {
    waves.push({ board: [...next], removed });
    removed.forEach(i => { next[i] = -1; });
    next = fall(next, size);
  }
  return { board: next, waves };
}
export function moves(board: Board, size: number): Swap[] {
  const out: Swap[] = [];
  for (let a = 0; a < board.length; a++) for (const b of [a + 1, a + size]) {
    if (swap(board, size, [a, b])) out.push([a, b]);
  }
  return out;
}
/** All accepted swaps remove gems, so the search is acyclic and finite. Returns an exact shortest clearing route. */
export function solve(board: Board, size: number): Swap[] | null {
  const memo = new Map<string, Swap[] | null>();
  const visit = (b: Board): Swap[] | null => {
    if (clear(b)) return [];
    const key = b.join(',');
    if (memo.has(key)) return memo.get(key)!;
    let best: Swap[] | null = null;
    for (const move of moves(b, size)) {
      const after = swap(b, size, move)!;
      const rest = visit(after.board);
      if (rest && (!best || rest.length + 1 < best.length)) best = [move, ...rest];
    }
    memo.set(key, best);
    return best;
  };
  return visit(board);
}
/** Board choice, left/right reflection and shape/color permutation preserve gravity and exact par. */
export function makePuzzle(level: number, rng: Rng): Puzzle {
  const index = Math.max(0, Math.min(PLANS.length - 1, level - 1));
  const source = rng.pick(POOLS[index]), size = PLANS[index].size;
  const colors = rng.shuffle([0, 1, 2, 3, 4, 5]), mirror = rng.chance(0.5);
  const board = source.board.map((_, i) => {
    const k = source.board[Math.floor(i / size) * size + (mirror ? size - 1 - i % size : i % size)];
    return k < 0 ? -1 : colors[k];
  });
  return { board, size, par: source.par };
}
/** Bot and hint use the actual board, including revisions and alternative valid routes. */
export const hintFor = (board: Board, size: number): Swap | null => solve(board, size)?.[0] ?? null;
export function botTarget(route: readonly Swap[] | null, selected: number | null): number | null {
  const pair = route?.[0];
  if (!pair) return null;
  if (selected === pair[0]) return pair[1];
  if (selected === pair[1]) return pair[0];
  return selected ?? pair[0];
}
