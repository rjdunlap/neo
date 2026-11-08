import type { Rng } from '../../engine/random';
import type { Band } from '../../progress/bands';
import type { BandLevels } from '../../progress/difficulty';

/**
 * Lantern Lights' rules (Lights Out, on a pond at dusk). A board is a square of paper lanterns, each lit or dark.
 * Pressing a lantern flips it and the lanterns above, below and beside it; the goal is every lantern lit. A board is a
 * flat array, row by row, `true` for lit.
 *
 * Pressing is its own undo, and the order of presses never matters, so a way to win is just *which* lanterns get
 * pressed an odd number of times: a set of cells. Which sets win is a system of linear equations over two numbers
 * (every dark lantern must be flipped an odd number of times and every lit one an even number), solved exactly
 * below, so the fewest presses for any board is worked out rather than guessed.
 *
 * A pond may have lily pads (level 9): cells with no lantern. A mask, one entry per cell with `false` on a pad, clips
 * every footprint at the pads; a pad is stored lit, never flips, and is never pressed. Without a mask every cell is a
 * lantern, as on levels 1 to 8 and the couch course.
 */
export type Size = 3 | 4 | 5 | 6;
export type Board = readonly boolean[];

/** Which cells hold a lantern: `false` on a lily pad. Undefined means every cell does. */
export type Mask = readonly boolean[];

/** Whether a cell holds a lantern rather than a lily pad. */
export const isLantern = (cell: number, mask?: Mask) => !mask || mask[cell];

/** The lantern and its neighbours, as cell numbers: none on a pad, and a pad beside it is left out. */
export function footprint(size: number, cell: number, mask?: Mask): number[] {
  if (!isLantern(cell, mask)) return [];
  const r = Math.floor(cell / size),
    c = cell % size;
  const out = [cell];
  if (r > 0) out.push(cell - size);
  if (r < size - 1) out.push(cell + size);
  if (c > 0) out.push(cell - 1);
  if (c < size - 1) out.push(cell + 1);
  return out.filter((k) => isLantern(k, mask)).sort((a, b) => a - b);
}

/** The board after pressing one lantern (a pad changes nothing). */
export function press(board: Board, size: number, cell: number, mask?: Mask): boolean[] {
  const out = board.slice();
  for (const c of footprint(size, cell, mask)) out[c] = !out[c];
  return out;
}

/** The board after pressing each of these lanterns once. */
export const pressAll = (board: Board, size: number, cells: readonly number[], mask?: Mask): boolean[] =>
  cells.reduce<boolean[]>((b, c) => press(b, size, c, mask), board.slice());

export const allLit = (board: Board) => board.every(Boolean);
/** Lit lanterns; a pad is not one. */
export const litCount = (board: Board, mask?: Mask) =>
  board.filter((on, i) => on && isLantern(i, mask)).length;
/** How many lanterns the pond holds. */
export const lanternCount = (size: number, mask?: Mask) => (mask ? mask.filter(Boolean).length : size * size);
export const fullBoard = (size: number): boolean[] => Array<boolean>(size * size).fill(true);

export interface Solution {
  /** Every way to win with the fewest presses: sorted cell lists. */
  best: number[][];
  /** How many presses the fewest takes. */
  weight: number;
  /** How many different sets of presses win at all (2 to the number of free choices). */
  ways: number;
}

/**
 * Solve the board exactly: every set of lanterns whose presses light them all, found by Gaussian elimination over
 * two numbers, with the fewest presses picked out. A set of presses is a way to win; presses beyond it that come in
 * pairs only cancel. Returns null when no set of presses can light the board (a 4 by 4 board that was not built by
 * pressing can be like that; boards made here never are). A pad is never pressed: its row says so.
 */
export function solve(board: Board, size: number, mask?: Mask): Solution | null {
  const n = size * size;
  // Row i: bit j set if pressing lantern j flips lantern i; the last bit is whether lantern i is dark (must flip).
  // Footprints are symmetric, so lantern i's own footprint lists the lanterns whose press reaches it.
  const rows: bigint[] = [];
  for (let i = 0; i < n; i++) {
    if (!isLantern(i, mask)) {
      rows.push(1n << BigInt(i));
      continue;
    }
    let row = board[i] ? 0n : 1n << BigInt(n);
    for (const j of footprint(size, i, mask)) row |= 1n << BigInt(j);
    rows.push(row);
  }
  const bit = (r: bigint, j: number) => (r >> BigInt(j)) & 1n;
  const pivotRow = new Array<number>(n).fill(-1);
  let next = 0;
  for (let col = 0; col < n; col++) {
    let p = -1;
    for (let r = next; r < n; r++)
      if (bit(rows[r], col)) {
        p = r;
        break;
      }
    if (p < 0) continue;
    [rows[next], rows[p]] = [rows[p], rows[next]];
    for (let r = 0; r < n; r++) if (r !== next && bit(rows[r], col)) rows[r] ^= rows[next];
    pivotRow[col] = next++;
  }
  // A row that is all zeros except the answer bit says no set of presses works.
  for (let r = next; r < n; r++) if (bit(rows[r], n)) return null;
  const free = Array.from({ length: n }, (_, c) => c).filter((c) => pivotRow[c] < 0);
  // One way to win with every free lantern left alone, and a "do nothing" pattern for each free lantern.
  const base = new Array<boolean>(n).fill(false);
  for (let c = 0; c < n; c++) if (pivotRow[c] >= 0) base[c] = bit(rows[pivotRow[c]], n) === 1n;
  const nulls = free.map((f) => {
    const v = new Array<boolean>(n).fill(false);
    v[f] = true;
    for (let c = 0; c < n; c++) if (pivotRow[c] >= 0 && bit(rows[pivotRow[c]], f)) v[c] = true;
    return v;
  });
  const ways = 2 ** free.length;
  let weight = Infinity,
    best: number[][] = [];
  for (let mask = 0; mask < ways; mask++) {
    const set = base.slice();
    nulls.forEach((v, k) => {
      if (mask & (1 << k)) for (let c = 0; c < n; c++) set[c] = set[c] !== v[c];
    });
    const cells = set.map((on, c) => (on ? c : -1)).filter((c) => c >= 0);
    if (cells.length < weight) {
      weight = cells.length;
      best = [cells];
    } else if (cells.length === weight) best.push(cells);
  }
  return { best, weight, ways };
}

/** The fewest presses that light the board, or null when none can. */
export const fewestPresses = (board: Board, size: number, mask?: Mask): number | null =>
  solve(board, size, mask)?.weight ?? null;

export interface LanternPlan {
  /** For grown-ups. */
  name: string;
  size: Size;
  /** How many lanterns are pressed to scramble a fresh board, so the fewest to put it right is at most this many. */
  scramble: number;
  /** The fewest presses a board may need: a board is dropped if it turns out easier than this. */
  atLeast: number;
  /** Boards in one round. */
  boards: number;
  /** Lily-pad ponds: each board takes a different one of these shapes (`#` a lantern, ` ` a pad, `size` rows of `size`). */
  shapes?: readonly (readonly string[])[];
}

/**
 * Level 9's pond shapes, all 5 by 5 so each is checked against every set of presses. Each leaves at most four free
 * choices, so `solve` weighs at most sixteen ways.
 */
export const SHAPES: Record<string, readonly string[]> = {
  plus: [' ### ', '#####', '#####', '#####', ' ### '],
  ring: ['#####', '#####', '## ##', '#####', '#####'],
  ell: ['##   ', '##   ', '##   ', '#####', '#####'],
  diamond: ['  #  ', ' ### ', '#####', ' ### ', '  #  '],
};

/** A shape's mask: `true` where a lantern hangs. */
export const shapeMask = (shape: readonly string[]): boolean[] =>
  shape
    .join('')
    .split('')
    .map((ch) => ch !== ' ');

/**
 * The ladder: small boards with a few presses to find, then 4 by 4, then 5 by 5 and 6 by 6 boards that need real
 * planning. A 6 by 6 pond has exactly one winning set, so its fewest is exactly the scramble.
 */
export const PLANS: LanternPlan[] = [
  {
    name: 'A 3 by 3 pond: find the one or two lanterns to press',
    size: 3,
    scramble: 2,
    atLeast: 2,
    boards: 3,
  },
  { name: 'A 3 by 3 pond with a few more presses to find', size: 3, scramble: 4, atLeast: 3, boards: 3 },
  {
    name: 'A 4 by 4 pond with a short way to light every lantern',
    size: 4,
    scramble: 4,
    atLeast: 3,
    boards: 2,
  },
  { name: 'A 4 by 4 pond that takes planning', size: 4, scramble: 7, atLeast: 5, boards: 2 },
  {
    name: 'A 5 by 5 pond with a short way to light every lantern',
    size: 5,
    scramble: 5,
    atLeast: 4,
    boards: 2,
  },
  { name: 'A 5 by 5 pond that takes planning', size: 5, scramble: 10, atLeast: 8, boards: 2 },
  {
    name: 'A 6 by 6 pond with a short way to light every lantern',
    size: 6,
    scramble: 7,
    atLeast: 7,
    boards: 2,
  },
  { name: 'A 6 by 6 pond that takes planning', size: 6, scramble: 12, atLeast: 12, boards: 2 },
  {
    name: 'Lily-pad ponds: a shaped pond where the pads stop the flips',
    size: 5,
    scramble: 6,
    atLeast: 5,
    boards: 2,
    shapes: Object.values(SHAPES),
  },
];

/**
 * Lantern Lake's grown-up puzzle. The island plays it by touch; couch play drives the same board with a controller. School
 * plays the two 3 by 3 ponds.
 */
export const LEVELS: BandLevels = { school: { min: 1, max: 2 }, grownup: { min: 1, max: 9 } };

/**
 * School only: the press count on one pond at which, still unlit, she is told once where Hint is (the fewest plus six).
 * Null at every other band, where a long wander is left alone.
 */
export const stuckAt = (band: Band, par: number): number | null => (band === 'school' ? par + 6 : null);

export const planFor = (level: number): LanternPlan => PLANS[Math.min(PLANS.length, Math.max(1, level)) - 1];

export interface Pond {
  board: boolean[];
  size: Size;
  /** The fewest presses that light every lantern. */
  par: number;
  /** Lily pads: `false` on a pad. Absent on a pond of lanterns only. */
  mask?: boolean[];
}

/**
 * Light every lantern, then press `scramble` different lanterns at random: a board that can always be put right. A
 * lily-pad pond takes the given shape, or the plan's first.
 */
export function makePond(plan: LanternPlan, rng: Rng, shape = plan.shapes?.[0]): Pond {
  const n = plan.size * plan.size,
    mask = shape ? shapeMask(shape) : undefined;
  const lanterns = Array.from({ length: n }, (_, i) => i).filter((i) => isLantern(i, mask));
  for (let attempt = 0; attempt < 300; attempt++) {
    const cells = rng.shuffle(lanterns.slice()).slice(0, plan.scramble);
    const board = pressAll(fullBoard(plan.size), plan.size, cells, mask);
    if (allLit(board)) continue;
    const par = fewestPresses(board, plan.size, mask);
    if (par !== null && par >= plan.atLeast)
      return mask ? { board, size: plan.size, par, mask } : { board, size: plan.size, par };
  }
  throw new Error(`could not make a pond for ${plan.name}`);
}

/** A round's ponds; on a lily-pad level each takes a different shape. */
export function makePonds(plan: LanternPlan, rng: Rng): Pond[] {
  const shapes = plan.shapes ? rng.shuffle(plan.shapes.slice()) : [];
  return Array.from({ length: plan.boards }, (_, k) =>
    makePond(plan, rng, shapes[k % Math.max(1, shapes.length)]),
  );
}

/** A board from its picture: `*` for a lit lantern, `.` for a dark one, ` ` for a lily pad. */
export function parsePond(rows: readonly string[]): Pond {
  const size = rows.length as Size;
  if (![3, 4, 5, 6].includes(size) || rows.some((r) => r.length !== size))
    throw new Error('a pond is a square, 3 to 6 lanterns across');
  const cells = rows.join('').split('');
  const mask = cells.includes(' ') ? cells.map((ch) => ch !== ' ') : undefined;
  // A pad is stored lit, so it never stands between her and a lit pond.
  const board = cells.map((ch) => ch !== '.');
  const par = fewestPresses(board, size, mask);
  if (par === null) throw new Error('this pond cannot be lit');
  return mask ? { board, size, par, mask } : { board, size, par };
}

export const formatPond = (board: Board, size: number, mask?: Mask): string[] =>
  Array.from({ length: size }, (_, r) =>
    board
      .slice(r * size, r * size + size)
      .map((on, c) => (!isLantern(r * size + c, mask) ? ' ' : on ? '*' : '.'))
      .join(''),
  );

/** Whether the pond has exactly one fewest-press way to light it from here, or several: the hint line names which. */
export type HintKind = 'one' | 'many';

export interface Hint {
  /** The lantern to try: in one of the fewest-press ways. */
  cell: number;
  kind: HintKind;
}

/**
 * Where a hint should point: a lantern in one of the fewest-press ways to light the board from here, and whether that
 * way is the only one. Pressing it always brings the fewest down by exactly one, so a hint never leads away from the
 * finish.
 */
export function namedHint(board: Board, size: number, near = 0, mask?: Mask): Hint | null {
  const s = solve(board, size, mask);
  if (!s || !s.weight) return null;
  const options = s.best.flat();
  // With several ways to win, the lantern closest to where she is looking.
  const dist = (c: number) =>
    Math.abs(Math.floor(c / size) - Math.floor(near / size)) + Math.abs((c % size) - (near % size));
  return {
    cell: options.sort((a, b) => dist(a) - dist(b) || a - b)[0],
    kind: s.best.length === 1 ? 'one' : 'many',
  };
}

/** The lantern a hint points at (the bot and the demo read only this). */
export const hintFor = (board: Board, size: number, near = 0, mask?: Mask): number | null =>
  namedHint(board, size, near, mask)?.cell ?? null;

/**
 * "Show me a short way": the lanterns the replay presses, in order, from the pond as it began. Always the first of the
 * fewest-press ways, so the same pond always replays the same way; null for a pond that is already lit or cannot be.
 */
export function shortWay(board: Board, size: number, mask?: Mask): number[] | null {
  const s = solve(board, size, mask);
  return s && s.weight ? s.best[0].slice() : null;
}
