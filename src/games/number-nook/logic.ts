import type { Rng } from '../../engine/random';

export const PLANS = [
  { rows: 2, cols: 2, depth: 4, name: 'Four spaces: one small loop' },
  { rows: 2, cols: 3, depth: 8, name: 'Six spaces: plan around two rows' },
  { rows: 3, cols: 3, depth: 14, name: 'Nine spaces: weave rows and columns' },
] as const;
export const planFor = (level: number) => PLANS[Math.max(0, Math.min(2, level - 1))];
export const goal = (rows: number, cols: number) => Array.from({ length: rows * cols }, (_, i) => (i + 1) % (rows * cols));
export const solved = (board: readonly number[]) => board.every((v, i) => v === (i + 1) % board.length);
export function neighbours(board: readonly number[], cols: number): number[] {
  const z = board.indexOf(0), r = Math.floor(z / cols), c = z % cols;
  return [z - cols, z + cols, z - 1, z + 1].filter(i => i >= 0 && i < board.length && Math.abs(Math.floor(i / cols) - r) + Math.abs(i % cols - c) === 1);
}
export function slide(board: readonly number[], cols: number, at: number): number[] | null {
  if (!neighbours(board, cols).includes(at)) return null;
  const next = board.slice(), z = next.indexOf(0);
  [next[z], next[at]] = [next[at], next[z]];
  return next;
}

/** Reverse breadth-first search: all reachable positions, with exact distances and a next slide.
 * Small boards have 12/360 states; the nine-space board has 181,440. Cached per shape.
 * This proves every hint decreases distance, even after arbitrary exploratory slides. */
const tables = new Map<string, Map<string, { distance: number; next: number }>>();
const key = (b: readonly number[]) => b.join('');
export function distances(rows: number, cols: number) {
  const shape = `${rows},${cols}`, cached = tables.get(shape);
  if (cached) return cached;
  const start = goal(rows, cols), table = new Map([[key(start), { distance: 0, next: -1 }]]), queue = [start];
  for (let head = 0; head < queue.length; head++) {
    const b = queue[head], d = table.get(key(b))!.distance;
    for (const at of neighbours(b, cols)) {
      const next = slide(b, cols, at)!, k = key(next);
      if (table.has(k)) continue;
      table.set(k, { distance: d + 1, next: b.indexOf(0) });
      queue.push(next);
    }
  }
  tables.set(shape, table);
  return table;
}
export function solutionStep(board: readonly number[], cols: number) {
  return distances(board.length / cols, cols).get(key(board)) ?? null;
}
export function makeBoard(level: number, rng: Rng): number[] {
  const p = planFor(level);
  const candidates = [...distances(p.rows, p.cols)].filter(([, info]) => info.distance === p.depth);
  return rng.pick(candidates)[0].split('').map(Number);
}
