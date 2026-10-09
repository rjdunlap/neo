import type { ColorName } from '../../art/palette';
import type { Rng } from '../../engine/random';

/**
 * Dot Link, after Two Dots: drag a line through neighboring dots of one color and they pop;
 * new dots drop in from the top. Later levels ask for a color, a longer chain, or a closed
 * square (which clears every dot of that color).
 */
export type DotMode = 'tap' | 'pair' | 'color' | 'chain' | 'square';

export interface DotPlan {
  mode: DotMode;
  rows: number;
  cols: number;
  colors: number;
  /** Pops (tap), links (pair), dots of the color, chains, or squares to finish. */
  goal: number;
  /** chain: how long a chain must be. */
  length?: number;
  name: string;
}

export const PLANS: DotPlan[] = [
  { mode: 'tap', rows: 4, cols: 5, colors: 3, goal: 12, name: 'Tap dots to pop them' },
  { mode: 'pair', rows: 4, cols: 4, colors: 3, goal: 6, name: 'Draw a line between two dots of the same color' },
  { mode: 'color', rows: 5, cols: 5, colors: 4, goal: 8, name: 'Pop 8 dots of one color' },
  { mode: 'chain', rows: 5, cols: 6, colors: 4, goal: 3, length: 4, name: 'Make three chains of 4 dots' },
  { mode: 'square', rows: 5, cols: 6, colors: 4, goal: 2, name: 'Close a square to clear a whole color, twice' },
];

export const planFor = (level: number) => PLANS[Math.min(PLANS.length, Math.max(1, level)) - 1];

export const DOT_COLORS: ColorName[] = ['red', 'blue', 'yellow', 'green', 'purple'];

export type Grid = ColorName[][];
export interface Cell {
  r: number;
  c: number;
}

export const same = (a: Cell, b: Cell) => a.r === b.r && a.c === b.c;
export const adjacent = (a: Cell, b: Cell) => Math.abs(a.r - b.r) + Math.abs(a.c - b.c) === 1;

export function makeGrid(plan: DotPlan, rng: Rng, palette: ColorName[]): Grid {
  return Array.from({ length: plan.rows }, () => Array.from({ length: plan.cols }, () => rng.pick(palette)));
}

export type StepResult = 'extend' | 'back' | 'loop' | 'no';

/**
 * Dragging onto `next`: extend the line through a same-color neighbor, step back onto the
 * previous dot to undo, or close a loop by returning to a dot already in the line.
 */
export function step(grid: Grid, path: Cell[], next: Cell): StepResult {
  const last = path[path.length - 1];
  if (!last || same(last, next) || !adjacent(last, next)) return 'no';
  if (grid[next.r][next.c] !== grid[last.r][last.c]) return 'no';
  if (path.length >= 2 && same(path[path.length - 2], next)) return 'back';
  if (path.some((p) => same(p, next))) return path.length >= 4 ? 'loop' : 'no';
  return 'extend';
}

/** Which dots a finished line pops: the line itself, or every dot of the color for a loop. */
export function popped(grid: Grid, path: Cell[], loop: boolean): Cell[] {
  if (!loop) return path;
  const color = grid[path[0].r][path[0].c];
  const out: Cell[] = [];
  grid.forEach((row, r) => row.forEach((c, ci) => c === color && out.push({ r, c: ci })));
  return out;
}

/** Popped dots leave gaps; dots above fall down and new ones drop in at the top. */
export function collapse(grid: Grid, gone: Cell[], rng: Rng, palette: ColorName[]): { grid: Grid; falls: { from: number; to: number; c: number }[] } {
  const rows = grid.length;
  const cols = grid[0].length;
  const out: Grid = Array.from({ length: rows }, () => Array(cols));
  const falls: { from: number; to: number; c: number }[] = [];
  for (let c = 0; c < cols; c++) {
    const keep: { color: ColorName; r: number }[] = [];
    for (let r = rows - 1; r >= 0; r--) if (!gone.some((g) => g.r === r && g.c === c)) keep.push({ color: grid[r][c], r });
    let r = rows - 1;
    for (const k of keep) {
      out[r][c] = k.color;
      if (k.r !== r) falls.push({ from: k.r, to: r, c });
      r--;
    }
    // New dots come from above the grid.
    let above = -1;
    for (; r >= 0; r--) {
      out[r][c] = rng.pick(palette);
      falls.push({ from: above--, to: r, c });
    }
  }
  return { grid: out, falls };
}

/** A same-color line of at least `min` dots (for hints and to make sure a move exists). */
export function findLine(grid: Grid, min: number, color?: ColorName): Cell[] | null {
  const rows = grid.length;
  const cols = grid[0].length;
  const dfs = (path: Cell[]): Cell[] | null => {
    if (path.length >= min) return path;
    const last = path[path.length - 1];
    for (const [dr, dc] of [[0, 1], [1, 0], [0, -1], [-1, 0]]) {
      const n = { r: last.r + dr, c: last.c + dc };
      if (n.r < 0 || n.c < 0 || n.r >= rows || n.c >= cols) continue;
      if (path.some((p) => same(p, n)) || grid[n.r][n.c] !== grid[last.r][last.c]) continue;
      const found = dfs([...path, n]);
      if (found) return found;
    }
    return null;
  };
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) if (!color || grid[r][c] === color) {
    const found = dfs([{ r, c }]);
    if (found) return found;
  }
  return null;
}

/** A 2×2 block of one color: walking around it closes a square. */
export function findSquare(grid: Grid): Cell[] | null {
  for (let r = 0; r + 1 < grid.length; r++) {
    for (let c = 0; c + 1 < grid[0].length; c++) {
      const k = grid[r][c];
      if (grid[r][c + 1] === k && grid[r + 1][c] === k && grid[r + 1][c + 1] === k) return [{ r, c }, { r, c: c + 1 }, { r: r + 1, c: c + 1 }, { r: r + 1, c }];
    }
  }
  return null;
}

/** A clean next move for the demonstration, including the return to the first dot for a square. */
export function demoMove(plan: DotPlan, grid: Grid, target?: ColorName): Cell[] | null {
  if (plan.mode === 'tap') return [{ r: 0, c: 0 }];
  if (plan.mode === 'square') {
    const square = findSquare(grid);
    return square ? [...square, square[0]] : null;
  }
  return findLine(grid, plan.mode === 'chain' ? plan.length! : 2, plan.mode === 'color' ? target : undefined);
}

/** Make sure the level's next move exists, repainting a few dots if it doesn't. */
export function ensureMove(plan: DotPlan, grid: Grid, rng: Rng, target?: ColorName): Grid {
  const g = grid.map((row) => [...row]);
  const has = () => demoMove(plan, g, target);
  if (has()) return g;
  const r = rng.int(0, g.length - 2);
  const c = rng.int(0, g[0].length - 2);
  const color = target ?? g[r][c];
  if (plan.mode === 'square') for (const [dr, dc] of [[0, 0], [0, 1], [1, 0], [1, 1]]) g[r + dr][c + dc] = color;
  else for (let i = 0; i < Math.min(g[0].length, plan.length ?? 2); i++) g[r][i] = color;
  return g;
}
