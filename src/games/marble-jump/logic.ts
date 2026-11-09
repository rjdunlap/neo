import type { Rng } from '../../engine/random';
import type { BandLevels } from '../../progress/difficulty';

export interface Jump {
  from: number;
  over: number;
  to: number;
}
/** A triangular lattice of holes, row by row; bit i of a board means a marble occupies hole i. */
export interface Triangle {
  readonly rows: number;
  readonly holes: readonly { row: number; col: number }[];
  readonly jumps: readonly Jump[];
  readonly full: number;
  /** `solve` results on this lattice, keyed by board, goal and gold. */
  readonly memo: Map<number, readonly Jump[] | null>;
}
function triangle(rows: number): Triangle {
  const holes = Array.from({ length: rows }, (_, row) =>
    Array.from({ length: row + 1 }, (_, col) => ({ row, col })),
  ).flat();
  const at = (r: number, c: number) => holes.findIndex((h) => h.row === r && h.col === c);
  const jumps = holes.flatMap((h, from) =>
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
  return { rows, holes, jumps, full: 2 ** holes.length - 1, memo: new Map() };
}
/** The fifteen-hole board of levels 1–8. */
export const SMALL = triangle(5);
/** Level 9's six-row, 21-hole board. */
export const BIG = triangle(6);
export const HOLES = SMALL.holes;
export const JUMPS = SMALL.jumps;
export const FULL = SMALL.full;
export const occupied = (board: number, i: number) => !!(board & (1 << i));
export function count(board: number): number {
  let n = 0;
  for (let b = board; b; b &= b - 1) n++;
  return n;
}
export const legal = (board: number, j: Jump) =>
  occupied(board, j.from) && occupied(board, j.over) && !occupied(board, j.to);
export const moves = (board: number, tri = SMALL) => tri.jumps.filter((j) => legal(board, j));
/** Illegal input leaves the board alone. */
export function jump(board: number, j: Jump, tri = SMALL): number {
  return tri.jumps.some((m) => m.from === j.from && m.over === j.over && m.to === j.to) && legal(board, j)
    ? board ^ (1 << j.from) ^ (1 << j.over) ^ (1 << j.to)
    : board;
}
/** Any hole may hold the last marble. */
export const ANY = -1;
/** No marble is gold. */
export const NONE = -1;
/** Where the gold marble is after a jump: it moves only when it is the jumping marble. */
export const goldAfter = (gold: number, j: Jump) => (gold === j.from ? j.to : gold);
/** The jumps allowed now: legal ones that do not jump over the gold marble. */
export const allowed = (board: number, gold = NONE, tri = SMALL) =>
  moves(board, tri).filter((j) => j.over !== gold);
/**
 * Exact search over at most 2^15 states (2^21 on the big board), optionally ending with the last marble in the goal hole, and optionally with a
 * gold marble that is never jumped (so it is the last one left). Every jump removes one marble, so there are no cycles.
 */
export function solve(board: number, goal = ANY, gold = NONE, tri = SMALL): readonly Jump[] | null {
  if (count(board) === 1)
    return (goal === ANY || board === 1 << goal) && (gold === NONE || board === 1 << gold) ? [] : null;
  const { memo } = tri,
    key = board + (goal + 1 + (gold + 1) * 32) * (tri.full + 1);
  if (memo.has(key)) return memo.get(key)!;
  for (const j of allowed(board, gold, tri)) {
    const rest = solve(jump(board, j, tri), goal, goldAfter(gold, j), tri);
    if (rest !== null) {
      const route = [j, ...rest];
      memo.set(key, route);
      return route;
    }
  }
  memo.set(key, null);
  return null;
}
export const PLANS = [3, 5, 7, 9, 11, 14, 14, 9, 20] as const;
/** Level 7 *Finish in the star hole*: the classic start, and the last marble must stop on the star. */
export const STAR_LEVEL = 7;
/** Level 8 *The gold marble*: nine marbles, one gold, which may jump but is never jumped, so it is the last one left. */
export const GOLD_LEVEL = 8;
/** Level 9 *A bigger triangle*: the six-row board, full but for one hole. */
export const BIG_LEVEL = 9;
export const LEVELS: BandLevels = { grownup: { min: 1, max: 9 } };
/** The lattice a level plays on. */
export const triangleFor = (level: number) => (level === BIG_LEVEL ? BIG : SMALL);
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
/** A first jump that strands the gold marble: the board can finish with gold last, but not after this jump. */
export const hasGoldTrap = (board: number, gold: number) =>
  allowed(board, gold).some((j) => solve(jump(board, j), ANY, goldAfter(gold, j)) === null);
let golds: { board: number; gold: number }[] | null = null;
/**
 * Every reachable nine-marble board and gold marble where a jump over gold is on offer from the start (so the rule matters at once),
 * gold can finish last, and a first jump strands it; in a fixed order.
 */
export function goldPairs(): readonly { board: number; gold: number }[] {
  golds ??= (reachable().get(marblesFor(GOLD_LEVEL)) ?? []).flatMap((board) =>
    HOLES.map((_, gold) => ({ board, gold })).filter(
      (p) =>
        occupied(p.board, p.gold) &&
        moves(p.board).some((j) => j.over === p.gold) &&
        solve(p.board, ANY, p.gold) !== null &&
        hasGoldTrap(p.board, p.gold),
    ),
  );
  return golds;
}
/** A round's board, goal hole and gold marble. Levels 1–6 draw exactly as before and have no goal or gold. */
export function makeRound(level: number, rng: Rng): { board: number; goal: number; gold: number } {
  // Every one of the 21 single-hole starts clears (asserted in logic.test.ts).
  if (level === BIG_LEVEL) return { board: BIG.full ^ (1 << rng.int(0, BIG.holes.length - 1)), goal: ANY, gold: NONE };
  if (level === STAR_LEVEL) return { ...rng.pick(starPairs()), gold: NONE };
  if (level >= GOLD_LEVEL) return { ...rng.pick(goldPairs()), goal: ANY };
  return { board: makeBoard(level, rng), goal: ANY, gold: NONE };
}
/** Each marble keeps its colour for the whole round: hole index to colour index, or -1 for an empty hole. */
export function paint(board: number, rng: Rng, tri = SMALL): number[] {
  return tri.holes.map((_, i) => (occupied(board, i) ? rng.int(0, 2) : -1));
}
/** The jumping marble carries its colour to the landing hole; the jumped marble's colour goes to the pocket. */
export function carry(colors: readonly number[], j: Jump): { colors: number[]; taken: number } {
  const next = [...colors];
  next[j.to] = next[j.from];
  next[j.from] = -1;
  next[j.over] = -1;
  return { colors: next, taken: colors[j.over] };
}
/** A dead end needs revision: find the nearest earlier board with a clearing route (`golds[i]` is the gold marble on `history[i]`). */
export function recovery(
  history: readonly number[],
  goal = ANY,
  golds?: readonly number[],
  tri = SMALL,
): number | null {
  for (let i = history.length - 1; i >= 0; i--)
    if (solve(history[i], goal, golds?.[i] ?? NONE, tri) !== null) return i;
  return null;
}
/** Moves in a route, where a chain of jumps by one marble counts as one move. */
export function movesIn(route: readonly Jump[]): number {
  return route.filter((j, i) => i === 0 || route[i - 1].to !== j.from).length;
}
/** The fewest moves that clear the board (onto the goal, if any, never jumping gold), by an exact search over board, gold and the hole the last jump landed in; null if it cannot clear. */
export function fewestMoves(board: number, goal = ANY, gold = NONE, tri = SMALL): number | null {
  const best = new Map<number, number | null>();
  const go = (b: number, g: number, last: number): number | null => {
    if (count(b) === 1) return solve(b, goal, g, tri) !== null ? 0 : null;
    const key = (b * 32 + (last + 1)) * 32 + (g + 1);
    if (best.has(key)) return best.get(key)!;
    let low: number | null = null;
    for (const j of allowed(b, g, tri)) {
      const next = jump(b, j, tri),
        moved = goldAfter(g, j);
      if (solve(next, goal, moved, tri) === null) continue;
      const rest = go(next, moved, j.to);
      if (rest !== null) {
        const total = rest + (j.from === last ? 0 : 1);
        if (low === null || total < low) low = total;
      }
    }
    best.set(key, low);
    return low;
  };
  return go(board, gold, ANY);
}
/**
 * Fewest moves from each single-hole start of the big board, by `fewestMoves` run offline (3–6 s a start, too slow for the
 * finish). logic.test.ts checks the table is symmetric and recomputes one start.
 */
export const BIG_FEWEST: readonly number[] = [10, 9, 9, 9, 10, 9, 9, 9, 9, 9, 9, 10, 9, 10, 9, 10, 9, 9, 9, 9, 10];
/** The fewest moves for a round's starting board: the frozen table for a big-board start, an exact search otherwise. */
export function fewestFor(board: number, goal = ANY, gold = NONE, tri = SMALL): number | null {
  const start = tri.holes.findIndex((_, i) => board === (tri.full ^ (1 << i)));
  return tri === BIG && start >= 0 && goal === ANY && gold === NONE
    ? BIG_FEWEST[start]
    : fewestMoves(board, goal, gold, tri);
}
/**
 * Where the board goes in a view: centre x, the top row's y, the tray's half width and height, the pocket groove's y and the
 * hole centres. The big board packs closer (90 × 74 instead of 102 × 82) so its groove clears the buttons at 1024 × 768,
 * with the 78-unit hit circles still apart.
 */
export function boardLayout(tri: Triangle, w: number, h: number) {
  const [dx, dy] = tri.rows > 5 ? [90, 74] : [102, 82],
    cx = w / 2 + 35,
    top = Math.max(175, (h - (tri.rows - 1) * dy - 82) / 2),
    half = ((tri.rows - 1) * dx) / 2 + 59,
    base = (tri.rows - 1) * dy + 53;
  return {
    cx,
    top,
    half,
    base,
    groove: top + base + 30,
    holes: tri.holes.map((p) => ({ x: cx + (p.col - p.row / 2) * dx, y: top + p.row * dy })),
  };
}
