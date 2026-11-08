import type { Rng } from '../../engine/random';
import type { BandLevels } from '../../progress/difficulty';

/** Fifteen holes in a triangular lattice; bit i means a marble occupies hole i. */
export const HOLES = Array.from({ length: 5 }, (_, row) =>
  Array.from({ length: row + 1 }, (_, col) => ({ row, col })),
).flat();
export interface Jump {
  from: number;
  over: number;
  to: number;
}
const at = (r: number, c: number) => HOLES.findIndex((h) => h.row === r && h.col === c);
export const JUMPS: readonly Jump[] = HOLES.flatMap((h, from) =>
  [
    [0, 1],
    [0, -1],
    [1, 0],
    [-1, 0],
    [1, 1],
    [-1, -1],
  ].flatMap(([dr, dc]) => {
    const over = at(h.row + dr, h.col + dc),
      to = at(h.row + 2 * dr, h.col + 2 * dc);
    return over < 0 || to < 0 ? [] : [{ from, over, to }];
  }),
);
export const FULL = (1 << HOLES.length) - 1;
export const occupied = (board: number, i: number) => !!(board & (1 << i));
export function count(board: number): number {
  let n = 0;
  for (let b = board; b; b &= b - 1) n++;
  return n;
}
export const legal = (board: number, j: Jump) =>
  occupied(board, j.from) && occupied(board, j.over) && !occupied(board, j.to);
export const moves = (board: number) => JUMPS.filter((j) => legal(board, j));
/** Illegal input leaves the board alone. */
export function jump(board: number, j: Jump): number {
  return JUMPS.some((m) => m.from === j.from && m.over === j.over && m.to === j.to) && legal(board, j)
    ? board ^ (1 << j.from) ^ (1 << j.over) ^ (1 << j.to)
    : board;
}
/** Any hole may hold the last marble. */
export const ANY = -1;
const memo = new Map<number, readonly Jump[] | null>();
/** Exact search over at most 2^15 states, optionally ending with the last marble in the goal hole. Every jump removes one marble, so there are no cycles. */
export function solve(board: number, goal = ANY): readonly Jump[] | null {
  if (count(board) === 1) return goal === ANY || board === 1 << goal ? [] : null;
  const key = board + (goal + 1) * (FULL + 1);
  if (memo.has(key)) return memo.get(key)!;
  for (const j of moves(board)) {
    const rest = solve(jump(board, j), goal);
    if (rest !== null) {
      const route = [j, ...rest];
      memo.set(key, route);
      return route;
    }
  }
  memo.set(key, null);
  return null;
}
export const PLANS = [3, 5, 7, 9, 11, 14, 14] as const;
/** Level 7 *Finish in the star hole*: the classic start, and the last marble must stop on the star. */
export const STAR_LEVEL = 7;
export const LEVELS: BandLevels = { grownup: { min: 1, max: 7 } };
export const marblesFor = (level: number) => PLANS[Math.max(0, Math.min(PLANS.length - 1, level - 1))];
/** A first jump that strands marbles: the board can clear, but not after this jump. */
export const hasTrap = (board: number) => moves(board).some((j) => solve(jump(board, j)) === null);
let pools: Map<number, number[]> | null = null;
/** Every board a legal game from a single-hole full triangle reaches that can still clear, by marble count, sorted so a seed always picks the same board. */
export function reachable(): Map<number, number[]> {
  if (pools) return pools;
  const seen = new Set<number>(HOLES.map((_, i) => FULL ^ (1 << i))),
    stack = [...seen];
  while (stack.length) {
    const board = stack.pop()!;
    for (const j of moves(board)) {
      const next = jump(board, j);
      if (!seen.has(next)) {
        seen.add(next);
        stack.push(next);
      }
    }
  }
  pools = new Map();
  for (const board of seen)
    if (solve(board) !== null) {
      const n = count(board);
      if (!pools.has(n)) pools.set(n, []);
      pools.get(n)!.push(board);
    }
  for (const list of pools.values()) list.sort((a, b) => a - b);
  return pools;
}
/** The boards a level draws from: level 1 any reachable three-marble board, levels 2–5 only boards with a trap first jump, level 6 the classic starts. */
export function poolFor(level: number): readonly number[] {
  const n = marblesFor(level),
    all = reachable().get(n) ?? [];
  return n === 3 || n === 14 ? all : all.filter(hasTrap);
}
export const makeBoard = (level: number, rng: Rng): number => rng.pick(poolFor(level));
let stars: { board: number; goal: number }[] | null = null;
/** Every single-hole start with a star hole the last marble can reach, in a fixed order. */
export function starPairs(): readonly { board: number; goal: number }[] {
  stars ??= HOLES.flatMap((_, start) =>
    HOLES.map((_, goal) => ({ board: FULL ^ (1 << start), goal })).filter(
      (p) => solve(p.board, p.goal) !== null,
    ),
  );
  return stars;
}
/** A round's board and goal hole. Levels 1–6 draw exactly as before and have no goal. */
export function makeRound(level: number, rng: Rng): { board: number; goal: number } {
  return level >= STAR_LEVEL ? { ...rng.pick(starPairs()) } : { board: makeBoard(level, rng), goal: ANY };
}
/** Each marble keeps its colour for the whole round: hole index to colour index, or -1 for an empty hole. */
export function paint(board: number, rng: Rng): number[] {
  return HOLES.map((_, i) => (occupied(board, i) ? rng.int(0, 2) : -1));
}
/** The jumping marble carries its colour to the landing hole; the jumped marble's colour goes to the pocket. */
export function carry(colors: readonly number[], j: Jump): { colors: number[]; taken: number } {
  const next = [...colors];
  next[j.to] = next[j.from];
  next[j.from] = -1;
  next[j.over] = -1;
  return { colors: next, taken: colors[j.over] };
}
/** A dead end needs revision: find the nearest earlier board with a clearing route. */
export function recovery(history: readonly number[], goal = ANY): number | null {
  for (let i = history.length - 1; i >= 0; i--) if (solve(history[i], goal) !== null) return i;
  return null;
}
/** Moves in a route, where a chain of jumps by one marble counts as one move. */
export function movesIn(route: readonly Jump[]): number {
  return route.filter((j, i) => i === 0 || route[i - 1].to !== j.from).length;
}
/** The fewest moves that clear the board (onto the goal, if any), by an exact search over board and the hole the last jump landed in; null if it cannot clear. */
export function fewestMoves(board: number, goal = ANY): number | null {
  const best = new Map<number, number | null>();
  const go = (b: number, last: number): number | null => {
    if (count(b) === 1) return goal === ANY || b === 1 << goal ? 0 : null;
    const key = b * 16 + (last + 1);
    if (best.has(key)) return best.get(key)!;
    let low: number | null = null;
    for (const j of moves(b)) {
      if (solve(jump(b, j), goal) === null) continue;
      const rest = go(jump(b, j), j.to);
      if (rest !== null) {
        const total = rest + (j.from === last ? 0 : 1);
        if (low === null || total < low) low = total;
      }
    }
    best.set(key, low);
    return low;
  };
  return go(board, ANY);
}
