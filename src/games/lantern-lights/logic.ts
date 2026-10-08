import type { Rng } from '../../engine/random';

/**
 * Lantern Lights' rules (Lights Out, on a pond at dusk). A board is a square of paper lanterns, each lit or dark.
 * Pressing a lantern flips it and the lanterns above, below and beside it; the goal is every lantern lit. A board is a
 * flat array, row by row, `true` for lit.
 *
 * Pressing is its own undo, and the order of presses never matters, so a way to win is just *which* lanterns get
 * pressed an odd number of times: a set of cells. Which sets win is a system of linear equations over two numbers
 * (every dark lantern must be flipped an odd number of times and every lit one an even number), solved exactly
 * below, so the fewest presses for any board is worked out rather than guessed.
 */
export type Size = 3 | 4 | 5 | 6;
export type Board = readonly boolean[];

/** The lantern and its neighbours, as cell numbers. */
export function footprint(size: number, cell: number): number[] {
  const r = Math.floor(cell / size), c = cell % size;
  const out = [cell];
  if (r > 0) out.push(cell - size);
  if (r < size - 1) out.push(cell + size);
  if (c > 0) out.push(cell - 1);
  if (c < size - 1) out.push(cell + 1);
  return out.sort((a, b) => a - b);
}

/** The board after pressing one lantern. */
export function press(board: Board, size: number, cell: number): boolean[] {
  const out = board.slice();
  for (const c of footprint(size, cell)) out[c] = !out[c];
  return out;
}

/** The board after pressing each of these lanterns once. */
export const pressAll = (board: Board, size: number, cells: readonly number[]): boolean[] => cells.reduce<boolean[]>((b, c) => press(b, size, c), board.slice());

export const allLit = (board: Board) => board.every(Boolean);
export const litCount = (board: Board) => board.filter(Boolean).length;
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
 * pressing can be like that; boards made here never are).
 */
export function solve(board: Board, size: number): Solution | null {
  const n = size * size;
  // Row i: bit j set if pressing lantern j flips lantern i; the last bit is whether lantern i is dark (must flip).
  const rows: bigint[] = [];
  for (let i = 0; i < n; i++) {
    let row = board[i] ? 0n : 1n << BigInt(n);
    for (const j of footprint(size, i)) row |= 1n << BigInt(j);
    rows.push(row);
  }
  const bit = (r: bigint, j: number) => (r >> BigInt(j)) & 1n;
  const pivotRow = new Array<number>(n).fill(-1);
  let next = 0;
  for (let col = 0; col < n; col++) {
    let p = -1;
    for (let r = next; r < n; r++) if (bit(rows[r], col)) { p = r; break; }
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
  let weight = Infinity, best: number[][] = [];
  for (let mask = 0; mask < ways; mask++) {
    const set = base.slice();
    nulls.forEach((v, k) => { if (mask & (1 << k)) for (let c = 0; c < n; c++) set[c] = set[c] !== v[c]; });
    const cells = set.map((on, c) => (on ? c : -1)).filter((c) => c >= 0);
    if (cells.length < weight) { weight = cells.length; best = [cells]; }
    else if (cells.length === weight) best.push(cells);
  }
  return { best, weight, ways };
}

/** The fewest presses that light the board, or null when none can. */
export const fewestPresses = (board: Board, size: number): number | null => solve(board, size)?.weight ?? null;

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
}

/** The ladder: small boards with a few presses to find, then 4 by 4, then 5 by 5 boards that need real planning. */
export const PLANS: LanternPlan[] = [
  { name: 'A 3 by 3 pond: find the one or two lanterns to press', size: 3, scramble: 2, atLeast: 2, boards: 3 },
  { name: 'A 3 by 3 pond with a few more presses to find', size: 3, scramble: 4, atLeast: 3, boards: 3 },
  { name: 'A 4 by 4 pond with a short way to light every lantern', size: 4, scramble: 4, atLeast: 3, boards: 2 },
  { name: 'A 4 by 4 pond that takes planning', size: 4, scramble: 7, atLeast: 5, boards: 2 },
  { name: 'A 5 by 5 pond with a short way to light every lantern', size: 5, scramble: 5, atLeast: 4, boards: 2 },
  { name: 'A 5 by 5 pond that takes planning', size: 5, scramble: 10, atLeast: 8, boards: 2 },
];

export const planFor = (level: number): LanternPlan => PLANS[Math.min(PLANS.length, Math.max(1, level)) - 1];

export interface Pond {
  board: boolean[];
  size: Size;
  /** The fewest presses that light every lantern. */
  par: number;
}

/** Light every lantern, then press `scramble` different lanterns at random: a board that can always be put right. */
export function makePond(plan: LanternPlan, rng: Rng): Pond {
  const n = plan.size * plan.size;
  for (let attempt = 0; attempt < 300; attempt++) {
    const cells = rng.shuffle(Array.from({ length: n }, (_, i) => i)).slice(0, plan.scramble);
    const board = pressAll(fullBoard(plan.size), plan.size, cells);
    if (allLit(board)) continue;
    const par = fewestPresses(board, plan.size);
    if (par !== null && par >= plan.atLeast) return { board, size: plan.size, par };
  }
  throw new Error(`could not make a pond for ${plan.name}`);
}

export const makePonds = (plan: LanternPlan, rng: Rng): Pond[] => Array.from({ length: plan.boards }, () => makePond(plan, rng));

/** A board from its picture: `*` for a lit lantern, `.` for a dark one. */
export function parsePond(rows: readonly string[]): Pond {
  const size = rows.length as Size;
  if (![3, 4, 5, 6].includes(size) || rows.some((r) => r.length !== size)) throw new Error('a pond is a square, 3 to 6 lanterns across');
  const board = rows.join('').split('').map((ch) => ch === '*');
  const par = fewestPresses(board, size);
  if (par === null) throw new Error('this pond cannot be lit');
  return { board, size, par };
}

export const formatPond = (board: Board, size: number): string[] => Array.from({ length: size }, (_, r) => board.slice(r * size, r * size + size).map((on) => (on ? '*' : '.')).join(''));

/**
 * Where a hint should point: a lantern in one of the fewest-press ways to light the board from here. Pressing it always
 * brings the fewest down by exactly one, so a hint never leads away from the finish.
 */
export function hintFor(board: Board, size: number, near = 0): number | null {
  const s = solve(board, size);
  if (!s || !s.weight) return null;
  const options = s.best.flat();
  // With several ways to win, the lantern closest to where she is looking.
  const dist = (c: number) => Math.abs(Math.floor(c / size) - Math.floor(near / size)) + Math.abs((c % size) - (near % size));
  return options.sort((a, b) => dist(a) - dist(b) || a - b)[0];
}
