import type { Rng } from '../../engine/random';

/**
 * Treasure Map: a grid map where things are found by row and column. First rows and columns
 * are pictures (the red column, the apple row); then letters and numbers ("B3"); then the child
 * places something at a named square; finally directions from a square ("3 right, 1 up").
 */
export type MapMode = 'pictures' | 'letters' | 'place' | 'steps' | 'clues';

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
  { mode: 'clues', size: 5, finds: 4, name: 'Use two landmark clues to find the square where they meet' },
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
  /** Two landmark relations: one fixes the target column, one fixes its row. */
  clues?: [Clue, Clue];
}

export const THINGS = ['tree', 'house', 'boat', 'flag'] as const;
export type Thing = (typeof THINGS)[number];

export interface Clue {
  landmark: Square;
  thing: Thing;
  /** The signed distance from landmark to target, on this clue's one axis. */
  delta: number;
  axis: 'horizontal' | 'vertical';
}

/** Finds on a level: all different squares; on step levels, moves of 1–3 that stay on the map, with a turn. */
export function makeFinds(plan: MapPlan, rng: Rng): Find[] {
  const out: Find[] = [];
  const things = rng.shuffle([...THINGS]);
  const landmarks: Square[] = [];
  while (out.length < plan.finds) {
    const square = { col: rng.int(0, plan.size - 1), row: rng.int(0, plan.size - 1) };
    if (out.some((f) => f.square.col === square.col && f.square.row === square.row) || landmarks.some((s) => s.col === square.col && s.row === square.row)) continue;
    if (plan.mode === 'clues') {
      const available = (axis: Clue['axis']) => {
        const before = axis === 'horizontal' ? square.col : square.row;
        const after = axis === 'horizontal' ? plan.size - 1 - square.col : plan.size - 1 - square.row;
        // delta is target minus landmark: its negative side is bounded by space after the target,
        // and its positive side by space before it.
        return Array.from({ length: Math.min(3, before) + Math.min(3, after) + 1 }, (_, i) => i - Math.min(3, after)).filter(Boolean);
      };
      const horizontal = available('horizontal');
      const vertical = available('vertical');
      if (!horizontal.length || !vertical.length) continue;
      const h = horizontal[rng.int(0, horizontal.length - 1)];
      const v = vertical[rng.int(0, vertical.length - 1)];
      const hLandmark = { col: square.col - h, row: square.row };
      const vLandmark = { col: square.col, row: square.row - v };
      const occupied = [...out.map((f) => f.square), ...landmarks];
      if ([hLandmark, vLandmark].some((s) => occupied.some((other) => other.col === s.col && other.row === s.row))) continue;
      const clueThings = rng.shuffle([...THINGS]);
      landmarks.push(hLandmark, vLandmark);
      out.push({ square, clues: [
        { landmark: hLandmark, thing: clueThings[0], delta: h, axis: 'horizontal' },
        { landmark: vLandmark, thing: clueThings[1], delta: v, axis: 'vertical' },
      ] });
      continue;
    }
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

/** Spoken direction from a clue's landmark towards the target. */
export function clueDirection(clue: Clue): string {
  const direction = clue.axis === 'horizontal' ? (clue.delta > 0 ? 'right' : 'left') : (clue.delta > 0 ? 'up' : 'down');
  return `${Math.abs(clue.delta)} ${direction}`;
}

/** A clue's line ends at exactly the target, making its intersection unambiguous. */
export function clueEnd(clue: Clue): Square {
  return clue.axis === 'horizontal'
    ? { col: clue.landmark.col + clue.delta, row: clue.landmark.row }
    : { col: clue.landmark.col, row: clue.landmark.row + clue.delta };
}

/** "3 right, then 1 up" (or left / down) for the voice and the sign. */
export function directions(f: Find): string {
  const h = `${Math.abs(f.right!)} ${f.right! > 0 ? 'right' : 'left'}`;
  const v = `${Math.abs(f.up!)} ${f.up! > 0 ? 'up' : 'down'}`;
  return `${h}, then ${v}`;
}

/** A square's width on the map, in the grid's own units. */
export const CELL = 100;

/** A square's middle in the grid's own coordinates (row 0 at the bottom, as on maps and graphs). */
export const cellCenter = (s: Square, size: number) => ({ x: s.col * CELL + CELL / 2, y: (size - 1 - s.row) * CELL + CELL / 2 });

/** The square under a point in the grid's own coordinates, or null off the map. The inverse of `cellCenter`. */
export function squareAt(x: number, y: number, size: number): Square | null {
  const col = Math.floor(x / CELL);
  const row = size - 1 - Math.floor(y / CELL);
  return col < 0 || row < 0 || col >= size || row >= size ? null : { col, row };
}

/** Where a finger digs for a find: the middle of its square, which `squareAt` reads back as exactly that square. Always a right dig. */
export const digSpot = (f: Find, size: number) => cellCenter(f.square, size);

/** What a wrong dig got right: the column, the row, both or neither, so the hint can say which to fix. */
export function compare(guess: Square, want: Square): 'column' | 'row' | 'neither' | 'right' {
  const c = guess.col === want.col;
  const r = guess.row === want.row;
  return c && r ? 'right' : c ? 'column' : r ? 'row' : 'neither';
}
