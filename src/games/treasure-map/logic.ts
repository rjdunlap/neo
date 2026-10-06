import type { Rng } from '../../engine/random';

/**
 * Treasure Map: a grid map where things are found by row and column. First rows and columns
 * are pictures (the red column, the apple row); then letters and numbers ("B3"); then the child
 * places something at a named square; finally directions from a square ("3 right, 1 up").
 */
export type MapMode = 'pictures' | 'letters' | 'place' | 'steps';

export interface MapPlan {
  mode: MapMode;
  size: 4 | 5;
  finds: number;
  name: string;
}

export const PLANS: MapPlan[] = [
  { mode: 'pictures', size: 4, finds: 4, name: 'Dig where a picture row meets a color column: "the apple row, the red column"' },
  { mode: 'letters', size: 4, finds: 4, name: 'Grid names: column letter and row number, like "B3"' },
  { mode: 'place', size: 5, finds: 4, name: 'Put things on the map at named squares: "a tree at D2"' },
  { mode: 'steps', size: 5, finds: 4, name: 'Follow directions from the start: "3 right, then 1 up"' },
];

export const planFor = (level: number) => PLANS[Math.min(PLANS.length, Math.max(1, level)) - 1];

/** A square: column (0 = left / A) and row (0 = bottom / 1), as on maps and graphs. */
export interface Square {
  col: number;
  row: number;
}

export const COLUMN_COLORS = ['red', 'yellow', 'blue', 'green', 'purple'] as const;
export const ROW_PICTURES = ['apple', 'fish', 'star', 'flower', 'shell'] as const;

export const name = (s: Square) => `${String.fromCharCode(65 + s.col)}${s.row + 1}`;

export interface Find {
  square: Square;
  /** Steps levels: where to start, and the moves. */
  from?: Square;
  right?: number;
  up?: number;
  /** Place levels: what to put there. */
  thing?: 'tree' | 'house' | 'boat' | 'flag';
}

const THINGS = ['tree', 'house', 'boat', 'flag'] as const;

/** Finds on a level: all different squares; on step levels, moves of 1–3 that stay on the map, with a turn. */
export function makeFinds(plan: MapPlan, rng: Rng): Find[] {
  const out: Find[] = [];
  const things = rng.shuffle([...THINGS]);
  while (out.length < plan.finds) {
    const square = { col: rng.int(0, plan.size - 1), row: rng.int(0, plan.size - 1) };
    if (out.some((f) => f.square.col === square.col && f.square.row === square.row)) continue;
    if (plan.mode === 'steps') {
      const right = rng.int(-3, 3);
      const up = rng.int(-3, 3);
      if (right === 0 || up === 0) continue;
      const from = { col: square.col - right, row: square.row - up };
      if (from.col < 0 || from.row < 0 || from.col >= plan.size || from.row >= plan.size) continue;
      out.push({ square, from, right, up });
      continue;
    }
    out.push({ square, thing: plan.mode === 'place' ? things[out.length % things.length] : undefined });
  }
  return out;
}

/** "3 right, then 1 up" (or left / down) for the voice and the sign. */
export function directions(f: Find): string {
  const h = `${Math.abs(f.right!)} ${f.right! > 0 ? 'right' : 'left'}`;
  const v = `${Math.abs(f.up!)} ${f.up! > 0 ? 'up' : 'down'}`;
  return `${h}, then ${v}`;
}

/** What a wrong dig got right: the column, the row, both or neither, so the hint can say which to fix. */
export function compare(guess: Square, want: Square): 'column' | 'row' | 'neither' | 'right' {
  const c = guess.col === want.col;
  const r = guess.row === want.row;
  return c && r ? 'right' : c ? 'column' : r ? 'row' : 'neither';
}
