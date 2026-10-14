import type { Rng } from '../../engine/random';

export type Removal = readonly number[];
export interface Puzzle { rows: number; ranks: number[] }
export const PLANS = [
  { rows: 3, name: 'Six face-up cards: complements to thirteen' },
  { rows: 4, name: 'Ten cards: uncover the next pair' },
  { rows: 5, name: 'Fifteen cards: plan through five rows' },
] as const;
export const planFor = (level: number) => PLANS[Math.max(0, Math.min(2, level - 1))];
export const countFor = (rows: number) => rows * (rows + 1) / 2;
export const fullMask = (rows: number) => (1 << countFor(rows)) - 1;
export const at = (row: number, col: number) => row * (row + 1) / 2 + col;
export const present = (mask: number, i: number) => !!(mask & (1 << i));
export function covers(rows: number, i: number): number[] {
  for (let row = 0; row < rows; row++) if (i >= at(row, 0) && i <= at(row, row)) {
    const col = i - at(row, 0);
    return row === rows - 1 ? [] : [at(row + 1, col), at(row + 1, col + 1)];
  }
  return [];
}
export const exposed = (p: Puzzle, mask: number, i: number) =>
  i >= 0 && i < p.ranks.length && present(mask, i) && covers(p.rows, i).every(k => !present(mask, k));
export const remove = (mask: number, move: Removal) => move.reduce((m, i) => m & ~(1 << i), mask);
export function moves(p: Puzzle, mask: number): Removal[] {
  const free = p.ranks.map((_, i) => i).filter(i => exposed(p, mask, i));
  return free.flatMap((a, k) => p.ranks[a] === 13 ? [[a]] :
    free.slice(k + 1).filter(b => p.ranks[a] + p.ranks[b] === 13).map(b => [a, b]));
}
/** Exact finite search: every move removes at least one card. Cache belongs to this deal. */
export function solver(p: Puzzle) {
  const memo = new Map<number, readonly Removal[] | null>();
  const solve = (mask: number): readonly Removal[] | null => {
    if (mask === 0) return [];
    if (memo.has(mask)) return memo.get(mask)!;
    for (const move of moves(p, mask)) {
      const tail = solve(remove(mask, move));
      if (tail) { const route = [move, ...tail]; memo.set(mask, route); return route; }
    }
    memo.set(mask, null); return null;
  };
  return solve;
}
/** Assign complements along a legal seeded clearing order; no stock or hidden information. */
export function makePuzzle(level: number, rng: Rng): Puzzle {
  const rows = planFor(level).rows, p = { rows, ranks: Array<number>(countFor(rows)).fill(0) };
  let mask = fullMask(rows);
  while (mask) {
    const free = rng.shuffle(p.ranks.map((_, i) => i).filter(i => exposed(p, mask, i)));
    const a = free[0];
    if (free.length === 1 || rng.chance(0.15)) {
      p.ranks[a] = 13; mask = remove(mask, [a]);
    } else {
      const b = free[1], rank = rng.int(1, 12);
      p.ranks[a] = rank; p.ranks[b] = 13 - rank; mask = remove(mask, [a, b]);
    }
  }
  return p;
}
export const rankName = (rank: number) => rank === 1 ? 'A' : rank === 11 ? 'J' : rank === 12 ? 'Q' : rank === 13 ? 'K' : String(rank);
