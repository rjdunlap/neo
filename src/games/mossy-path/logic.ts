import type { Rng } from '../../engine/random';

export interface Board { rows: number; cols: number; tiles: number[]; start: number; pond: number }
export const PLANS = [
  { name: 'A winding trail: bloom seven tiles', rows: 3, cols: 3, tiles: [0, 1, 2, 5, 6, 7, 8], start: 0, pond: 6 },
  { name: 'An open patch: plan a route through twelve tiles', rows: 3, cols: 4, tiles: Array.from({ length: 12 }, (_, i) => i), start: 0, pond: 11 },
  { name: 'Two rocks: visit fourteen tiles through narrow passages', rows: 4, cols: 4, tiles: [0, 1, 2, 3, 4, 7, 8, 9, 10, 11, 12, 13, 14, 15], start: 4, pond: 15 },
] as const;
export const planFor = (level: number) => PLANS[Math.max(0, Math.min(PLANS.length - 1, level - 1))];
export function makeBoard(level: number, rng: Rng): Board {
  const p = planFor(level), flipX = rng.chance(0.5), flipY = rng.chance(0.5), transpose = rng.chance(0.5);
  const cols = transpose ? p.rows : p.cols, rows = transpose ? p.cols : p.rows;
  const transform = (i: number) => {
    const r = flipY ? p.rows - 1 - Math.floor(i / p.cols) : Math.floor(i / p.cols);
    const c = flipX ? p.cols - 1 - i % p.cols : i % p.cols;
    return transpose ? c * cols + r : r * cols + c;
  };
  return { rows, cols, tiles: p.tiles.map(transform), start: transform(p.start), pond: transform(p.pond) };
}
export function adjacent(b: Board, a: number, z: number): boolean {
  return b.tiles.includes(z) && Math.abs(Math.floor(a / b.cols) - Math.floor(z / b.cols)) + Math.abs(a % b.cols - z % b.cols) === 1;
}
export function moveError(b: Board, path: readonly number[], at: number): 'far' | 'visited' | 'pond' | null {
  if (!adjacent(b, path[path.length - 1], at)) return 'far';
  if (path.includes(at)) return 'visited';
  if (at === b.pond && path.length !== b.tiles.length - 1) return 'pond';
  return null;
}
export function step(b: Board, path: readonly number[], at: number): number[] | null {
  return moveError(b, path, at) ? null : [...path, at];
}
export const solved = (b: Board, path: readonly number[]) => validPath(b, path) && path.length === b.tiles.length && path.at(-1) === b.pond;
export function validPath(b: Board, path: readonly number[]): boolean {
  return path[0] === b.start && new Set(path).size === path.length && path.every((at, i) => b.tiles.includes(at) && (i === 0 || adjacent(b, path[i - 1], at))) && (!path.includes(b.pond) || (path.at(-1) === b.pond && path.length === b.tiles.length));
}
/** Exact completion from any legal prefix. Memoized failed states keep the 16-space search small. */
export function completion(b: Board, path: readonly number[]): number[] | null {
  if (!validPath(b, path)) return null;
  const failed = new Set<number>();
  const search = (at: number, mask: number, length: number): number[] | null => {
    if (length === b.tiles.length) return at === b.pond ? [] : null;
    const key = mask * 16 + at;
    if (failed.has(key)) return null;
    for (const next of b.tiles) {
      if ((mask & (1 << next)) || !adjacent(b, at, next) || (next === b.pond && length !== b.tiles.length - 1)) continue;
      const tail = search(next, mask | (1 << next), length + 1);
      if (tail) return [next, ...tail];
    }
    failed.add(key); return null;
  };
  return search(path[path.length - 1], path.reduce((m, i) => m | (1 << i), 0), path.length);
}
/** A hint revises only as far as necessary; the UI performs each undo through its normal control. */
export function helpFor(b: Board, path: readonly number[]): { undo: number; next: number } | null {
  if (!validPath(b, path)) return null;
  for (let length = path.length; length > 0; length--) {
    const route = completion(b, path.slice(0, length));
    if (route) return { undo: path.length - length, next: route[0] ?? -1 };
  }
  return null;
}
