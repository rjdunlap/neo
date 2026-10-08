import type { Rng } from '../../engine/random';

/**
 * Sudoku Garden's rules. A bed is a square of numbered flowers: every row, every column and every box
 * holds each number once. 6 by 6 beds have boxes two rows tall and three wide; 9 by 9 beds have 3 by 3.
 * A grid is a flat array, row by row, with 0 for an empty square.
 */
export type Size = 6 | 9;
export type Grid = readonly number[];
export type HouseKind = 'row' | 'column' | 'box';

export interface House {
  kind: HouseKind;
  index: number;
  cells: readonly number[];
}

export interface Geometry {
  size: Size;
  /** Box height and width. */
  br: number;
  bc: number;
  cells: number;
  houses: readonly House[];
  /** Every other square that shares a row, column or box with this one. */
  peers: readonly (readonly number[])[];
  rowOf: readonly number[];
  colOf: readonly number[];
  boxOf: readonly number[];
  /** The three houses each square belongs to: its row, column and box. */
  housesOf: readonly (readonly [House, House, House])[];
}

const geometries = new Map<Size, Geometry>();
export function geometry(size: Size): Geometry {
  let g = geometries.get(size);
  if (g) return g;
  const n = size, br = size === 6 ? 2 : 3, bc = 3, cells = n * n;
  const rowOf = Array.from({ length: cells }, (_, i) => Math.floor(i / n));
  const colOf = Array.from({ length: cells }, (_, i) => i % n);
  const boxOf = Array.from({ length: cells }, (_, i) => Math.floor(rowOf[i] / br) * (n / bc) + Math.floor(colOf[i] / bc));
  const houses: House[] = [];
  for (let k = 0; k < n; k++) houses.push({ kind: 'row', index: k, cells: Array.from({ length: n }, (_, c) => k * n + c) });
  for (let k = 0; k < n; k++) houses.push({ kind: 'column', index: k, cells: Array.from({ length: n }, (_, r) => r * n + k) });
  for (let k = 0; k < n; k++) houses.push({ kind: 'box', index: k, cells: Array.from({ length: cells }, (_, i) => i).filter((i) => boxOf[i] === k) });
  const peers = Array.from({ length: cells }, (_, i) => Array.from({ length: cells }, (_, j) => j).filter((j) => j !== i && (rowOf[j] === rowOf[i] || colOf[j] === colOf[i] || boxOf[j] === boxOf[i])));
  const housesOf = Array.from({ length: cells }, (_, i) => [houses[rowOf[i]], houses[n + colOf[i]], houses[2 * n + boxOf[i]]] as const);
  g = { size, br, bc, cells, houses, peers, rowOf, colOf, boxOf, housesOf };
  geometries.set(size, g);
  return g;
}

const bit = (digit: number) => 1 << (digit - 1);
const fullMask = (size: Size) => (1 << size) - 1;
const popcount = (m: number) => { let n = 0; for (; m; m &= m - 1) n++; return n; };
/** The digits in a mask, lowest first. */
export const digitsOf = (m: number): number[] => { const out: number[] = []; for (let d = 1; m; d++, m >>= 1) if (m & 1) out.push(d); return out; };

export const emptyGrid = (size: Size): number[] => Array<number>(size * size).fill(0);
export const parseGrid = (rows: readonly string[]): number[] => rows.join('').split('').map((ch) => (ch === '.' ? 0 : Number(ch)));
export const formatGrid = (grid: Grid, size: Size): string[] => Array.from({ length: size }, (_, r) => grid.slice(r * size, r * size + size).map((d) => (d ? String(d) : '.')).join(''));

/** Digits that fit a square: not already in its row, column or box. */
export function candidates(grid: Grid, size: Size, cell: number): number[] {
  const g = geometry(size);
  let used = 0;
  for (const p of g.peers[cell]) if (grid[p]) used |= bit(grid[p]);
  return digitsOf(fullMask(size) & ~used);
}

/** Squares holding a number that another square in the same row, column or box also holds. */
export function conflicts(grid: Grid, size: Size): number[] {
  const g = geometry(size), out = new Set<number>();
  for (const h of g.houses) {
    const seen = new Map<number, number>();
    for (const c of h.cells) {
      const d = grid[c];
      if (!d) continue;
      const first = seen.get(d);
      if (first === undefined) seen.set(d, c);
      else { out.add(first); out.add(c); }
    }
  }
  return [...out].sort((a, b) => a - b);
}

/** Empty squares where no number fits any more: something placed earlier has to come out. */
export function deadEnds(grid: Grid, size: Size): number[] {
  const out: number[] = [];
  for (let i = 0; i < grid.length; i++) if (!grid[i] && candidates(grid, size, i).length === 0) out.push(i);
  return out;
}

export const isFull = (grid: Grid) => grid.every((d) => d > 0);
export const isSolved = (grid: Grid, size: Size) => isFull(grid) && conflicts(grid, size).length === 0;

/**
 * Depth-first search over the empty square with the fewest choices. Counts solutions up to `limit`; with an
 * `rng` it tries digits in random order, which is how a full bed is grown. `first` keeps the first solution found.
 */
function search(grid: Grid, size: Size, limit: number, rng?: Rng): { count: number; first: number[] | null } {
  const g = geometry(size), n = size, full = fullMask(size);
  const work = grid.slice();
  const row = Array<number>(n).fill(0), col = Array<number>(n).fill(0), box = Array<number>(n).fill(0);
  for (let i = 0; i < work.length; i++) {
    const d = work[i];
    if (!d) continue;
    const m = bit(d);
    if ((row[g.rowOf[i]] | col[g.colOf[i]] | box[g.boxOf[i]]) & m) return { count: 0, first: null };
    row[g.rowOf[i]] |= m; col[g.colOf[i]] |= m; box[g.boxOf[i]] |= m;
  }
  let count = 0;
  let first: number[] | null = null;
  const go = () => {
    if (count >= limit) return;
    let best = -1, bestMask = 0, bestCount = n + 1;
    for (let i = 0; i < work.length; i++) {
      if (work[i]) continue;
      const m = full & ~(row[g.rowOf[i]] | col[g.colOf[i]] | box[g.boxOf[i]]);
      const k = popcount(m);
      if (k === 0) return;
      if (k < bestCount) { best = i; bestMask = m; bestCount = k; if (k === 1) break; }
    }
    if (best < 0) { count++; first ??= work.slice(); return; }
    const options = digitsOf(bestMask);
    if (rng) rng.shuffle(options);
    for (const d of options) {
      const m = bit(d), r = g.rowOf[best], c = g.colOf[best], b = g.boxOf[best];
      work[best] = d; row[r] |= m; col[c] |= m; box[b] |= m;
      go();
      work[best] = 0; row[r] &= ~m; col[c] &= ~m; box[b] &= ~m;
      if (count >= limit) return;
    }
  };
  go();
  return { count, first };
}

/** How many ways the grid can be finished, counting no further than `limit`. */
export const countSolutions = (grid: Grid, size: Size, limit = 2): number => search(grid, size, limit).count;
/** One way to finish the grid, or null. For a puzzle with a unique solution, the way. */
export const solve = (grid: Grid, size: Size): number[] | null => search(grid, size, 1).first;
/** A random full bed. */
export const randomBed = (size: Size, rng: Rng): number[] => search(emptyGrid(size), size, 1, rng).first!;

/* ------------------------------------------------------------------------------------------------ */
/* Solving the way a person does                                                                      */
/* ------------------------------------------------------------------------------------------------ */

/**
 * The ways of working a bed out that the game knows and explains, easiest first.
 * `lone`: only one number fits a square. `place`: a number has only one square left in a row, column or box.
 * `pair`: two squares in a house can only hold the same two numbers, so no other square there can.
 * `locked`: a number's squares in a house all lie along one line (or one box), which rules it out of the rest of that line (or box).
 */
export type Tech = 'lone' | 'place' | 'pair' | 'locked';
export type Tier = 1 | 2 | 3;
export const TIER: Record<Tech, Tier> = { lone: 1, place: 2, pair: 3, locked: 3 };

export interface Step {
  tech: Tech;
  /** The square a number goes in, or -1 for a step that only rules numbers out. */
  cell: number;
  digit: number;
  /** `place`: the house the number has only one place in. `pair` and `locked`: the house the pattern lives in. */
  house?: House;
  /** `pair`: the two squares. `locked`: the squares holding the number's remaining places. */
  pattern?: number[];
  /** `pair`: the two numbers. `locked`: the one number. */
  digits?: number[];
  /** Numbers this step rules out of squares. */
  removed?: { cell: number; digit: number }[];
}

export interface TechResult {
  solved: boolean;
  steps: Step[];
  /** The hardest kind of step used (0 if none was needed). */
  tier: 0 | Tier;
  grid: number[];
}

/**
 * Work a grid out with the techniques up to `maxTier`, always taking the easiest step first. `stopAtPlacement`
 * ends as soon as one number has been placed, which is what a hint needs.
 */
export function techniqueSolve(start: Grid, size: Size, maxTier: Tier = 3, stopAtPlacement = false): TechResult {
  const g = geometry(size), full = fullMask(size);
  const grid = start.slice();
  const cand = Array<number>(grid.length).fill(0);
  const steps: Step[] = [];
  let tier: 0 | Tier = 0;
  const result = (solved: boolean): TechResult => ({ solved, steps, tier, grid });

  for (let i = 0; i < grid.length; i++) {
    if (grid[i]) continue;
    let used = 0;
    for (const p of g.peers[i]) if (start[p]) used |= bit(start[p]);
    cand[i] = full & ~used;
    if (!cand[i]) return result(false);
  }
  // A grid that already breaks the rules is not worked on.
  if (conflicts(start, size).length) return result(false);

  const place = (cell: number, digit: number) => {
    grid[cell] = digit;
    cand[cell] = 0;
    for (const p of g.peers[cell]) cand[p] &= ~bit(digit);
  };
  const empties = () => grid.reduce((n, d) => n + (d ? 0 : 1), 0);

  const lone = (): Step | null => {
    for (let i = 0; i < grid.length; i++) if (!grid[i] && popcount(cand[i]) === 1) return { tech: 'lone', cell: i, digit: digitsOf(cand[i])[0] };
    return null;
  };
  const only = (): Step | null => {
    for (const h of g.houses) {
      let placed = 0;
      for (const c of h.cells) if (grid[c]) placed |= bit(grid[c]);
      for (let d = 1; d <= size; d++) {
        if (placed & bit(d)) continue;
        const spots = h.cells.filter((c) => !grid[c] && cand[c] & bit(d));
        if (spots.length === 1) return { tech: 'place', cell: spots[0], digit: d, house: h };
      }
    }
    return null;
  };
  const pair = (): Step | null => {
    for (const h of g.houses) {
      const twins = h.cells.filter((c) => !grid[c] && popcount(cand[c]) === 2);
      for (let a = 0; a < twins.length; a++)
        for (let b = a + 1; b < twins.length; b++) {
          if (cand[twins[a]] !== cand[twins[b]]) continue;
          const mask = cand[twins[a]], removed: { cell: number; digit: number }[] = [];
          for (const c of h.cells) {
            if (grid[c] || c === twins[a] || c === twins[b]) continue;
            for (const d of digitsOf(cand[c] & mask)) removed.push({ cell: c, digit: d });
          }
          if (removed.length) return { tech: 'pair', cell: -1, digit: 0, house: h, pattern: [twins[a], twins[b]], digits: digitsOf(mask), removed };
        }
    }
    return null;
  };
  const locked = (): Step | null => {
    for (const h of g.houses) {
      let placed = 0;
      for (const c of h.cells) if (grid[c]) placed |= bit(grid[c]);
      for (let d = 1; d <= size; d++) {
        if (placed & bit(d)) continue;
        const spots = h.cells.filter((c) => !grid[c] && cand[c] & bit(d));
        if (spots.length < 2 || spots.length > 3) continue;
        // The lines a pattern can lie along: a box's spots may share a row or a column; a row's or column's may share a box.
        const lines: House[] = [];
        if (h.kind === 'box') {
          if (spots.every((c) => g.rowOf[c] === g.rowOf[spots[0]])) lines.push(g.houses[g.rowOf[spots[0]]]);
          if (spots.every((c) => g.colOf[c] === g.colOf[spots[0]])) lines.push(g.houses[size + g.colOf[spots[0]]]);
        } else if (spots.every((c) => g.boxOf[c] === g.boxOf[spots[0]])) lines.push(g.houses[2 * size + g.boxOf[spots[0]]]);
        for (const line of lines) {
          const removed = line.cells.filter((c) => !grid[c] && !spots.includes(c) && cand[c] & bit(d)).map((c) => ({ cell: c, digit: d }));
          if (removed.length) return { tech: 'locked', cell: -1, digit: d, house: h, pattern: spots, digits: [d], removed };
        }
      }
    }
    return null;
  };

  while (empties()) {
    let step = lone();
    if (!step && maxTier >= 2) step = only();
    if (!step && maxTier >= 3) step = pair() ?? locked();
    if (!step) return result(false);
    steps.push(step);
    tier = Math.max(tier, TIER[step.tech]) as Tier;
    if (step.cell >= 0) {
      place(step.cell, step.digit);
      if (stopAtPlacement) return result(true);
    } else for (const r of step.removed!) cand[r.cell] &= ~bit(r.digit);
    // A square left with nothing to hold means the grid had a wrong number in it.
    if (grid.some((d, i) => !d && !cand[i])) return result(false);
  }
  return result(true);
}

/** The easiest set of techniques that finishes the grid by itself: 1, 2 or 3, or 0 if these are not enough. */
export function gradeOf(grid: Grid, size: Size): 0 | Tier {
  for (const tier of [1, 2, 3] as const) if (techniqueSolve(grid, size, tier).solved) return tier;
  return 0;
}

/* ------------------------------------------------------------------------------------------------ */
/* Plans and puzzles                                                                                  */
/* ------------------------------------------------------------------------------------------------ */

export interface SudokuPlan {
  /** For grown-ups. */
  name: string;
  size: Size;
  /** The hardest technique a bed needs, and so how it is graded. */
  tier: Tier;
  /** Empty squares in a fresh bed: also the fewest entries it can take, which is its par. */
  blanks: number;
  /** Beds in one round. */
  beds: number;
}

/**
 * The ladder: two 6 by 6 beds that lone numbers solve (the second with far fewer to start from), a 6 by 6 bed that
 * needs the only-place-left trick, then the same climb on a 9 by 9 bed, ending with one that needs a pair or a pointing
 * line. (A 6 by 6 bed almost never needs a pair, so it has no third rung.)
 */
export const PLANS: SudokuPlan[] = [
  { name: 'A 6 by 6 bed with a few numbers to find', size: 6, tier: 1, blanks: 14, beds: 1 },
  { name: 'A 6 by 6 bed with half of it to find', size: 6, tier: 1, blanks: 21, beds: 1 },
  { name: 'A 6 by 6 bed that needs the only-place-left trick', size: 6, tier: 2, blanks: 24, beds: 1 },
  { name: 'A 9 by 9 bed with plenty of numbers to start', size: 9, tier: 1, blanks: 42, beds: 1 },
  { name: 'A 9 by 9 bed that needs the only-place-left trick', size: 9, tier: 2, blanks: 52, beds: 1 },
  { name: 'A 9 by 9 bed with a pair or a pointing line to find', size: 9, tier: 3, blanks: 55, beds: 1 },
];

export const planFor = (level: number): SudokuPlan => PLANS[Math.min(PLANS.length, Math.max(1, level)) - 1];

export interface Puzzle {
  /** What the bed shows to start: numbers given, and 0 for empty squares. */
  start: number[];
  /** The one way to finish it. */
  solution: number[];
  size: Size;
  blanks: number;
  /** The hardest technique needed to finish it without guessing. */
  grade: Tier;
}

/**
 * A bed with exactly one solution that techniques up to the plan's tier can finish, with as many empty squares as the
 * plan asks for. A random full bed has numbers taken out in random order, each kept out only if the bed stays unique and
 * workable. Beds that do not reach the plan's blanks, or are easier than its tier, are thrown away and grown again.
 */
export function makePuzzle(plan: SudokuPlan, rng: Rng): Puzzle {
  const n = plan.size * plan.size;
  let best: Puzzle | null = null;
  for (let attempt = 0; attempt < 400; attempt++) {
    const solution = randomBed(plan.size, rng);
    const start = solution.slice();
    let blanks = 0;
    for (const cell of rng.shuffle(Array.from({ length: n }, (_, i) => i))) {
      if (blanks >= plan.blanks) break;
      const was = start[cell];
      start[cell] = 0;
      if (countSolutions(start, plan.size) === 1 && techniqueSolve(start, plan.size, plan.tier).solved) blanks++;
      else start[cell] = was;
    }
    const grade = gradeOf(start, plan.size);
    if (!grade) continue;
    const puzzle: Puzzle = { start, solution, size: plan.size, blanks, grade };
    if (blanks === plan.blanks && grade === plan.tier) return puzzle;
    // Keep the closest bed in case nothing matches exactly: more blanks first, then the right grade.
    if (!best || blanks > best.blanks || (blanks === best.blanks && Math.abs(grade - plan.tier) < Math.abs(best.grade - plan.tier))) best = puzzle;
  }
  if (!best) throw new Error(`could not make a bed for ${plan.name}`);
  return best;
}

export const makeBeds = (plan: SudokuPlan, rng: Rng): Puzzle[] => Array.from({ length: plan.beds }, () => makePuzzle(plan, rng));

/** A bed from its picture, with its solution worked out. */
export function parsePuzzle(rows: readonly string[]): Puzzle {
  const size = rows.length as Size;
  if (size !== 6 && size !== 9) throw new Error('a bed is 6 by 6 or 9 by 9');
  const start = parseGrid(rows);
  const solution = solve(start, size);
  if (!solution) throw new Error('a bed needs a solution');
  return { start, solution, size, blanks: start.filter((d) => !d).length, grade: gradeOf(start, size) || 3 };
}

/* ------------------------------------------------------------------------------------------------ */
/* Hints                                                                                              */
/* ------------------------------------------------------------------------------------------------ */

export type Hint =
  /** A number she placed that is not part of the way to finish: take it out. */
  | { kind: 'fix'; cell: number }
  /** A square with only one number that fits. */
  | { kind: 'lone'; cell: number; digit: number }
  /** A number with only one place left in a house. */
  | { kind: 'place'; cell: number; digit: number; house: House }
  /** After a pair or a pointing line rules numbers out, one number is left for this square. */
  | { kind: 'rules-out'; cell: number; digit: number; via: Step }
  /** Nothing simple is left (only if she has put the bed in a state no technique reads): the square with fewest choices. */
  | { kind: 'few'; cell: number; digit: number };

/**
 * Where a hint should point. First a number she placed that does not belong, preferring one that clashes with another;
 * otherwise the next number the techniques can place from where the bed stands now, with the reason.
 */
export function hintFor(grid: Grid, given: Grid, solution: Grid, size: Size): Hint | null {
  const wrong = grid.map((d, i) => (d && !given[i] && d !== solution[i] ? i : -1)).filter((i) => i >= 0);
  if (wrong.length) {
    const clashing = new Set(conflicts(grid, size));
    return { kind: 'fix', cell: wrong.find((i) => clashing.has(i)) ?? wrong[0] };
  }
  const work = techniqueSolve(grid, size, 3, true);
  const last = work.steps[work.steps.length - 1];
  if (last && last.cell >= 0) {
    // Easier steps are always taken first, so a pair or a pointing line only shows up when nothing simpler was left.
    // The step that ruled numbers out last is the one that made this number the only one left.
    const via = [...work.steps].reverse().find((s) => s.cell < 0);
    if (via) return { kind: 'rules-out', cell: last.cell, digit: last.digit, via };
    if (last.tech === 'lone') return { kind: 'lone', cell: last.cell, digit: last.digit };
    return { kind: 'place', cell: last.cell, digit: last.digit, house: last.house! };
  }
  let few = -1, fewest = size + 1;
  for (let i = 0; i < grid.length; i++) {
    if (grid[i]) continue;
    const k = candidates(grid, size, i).length;
    if (k < fewest) { few = i; fewest = k; }
  }
  return few >= 0 ? { kind: 'few', cell: few, digit: solution[few] } : null;
}

/** Every number the two easiest techniques can place right now: what a person (or a demo) could do next. */
export function placements(grid: Grid, size: Size): { cell: number; digit: number }[] {
  const g = geometry(size), out = new Map<number, number>();
  for (let i = 0; i < grid.length; i++) {
    if (grid[i]) continue;
    const c = candidates(grid, size, i);
    if (c.length === 1) out.set(i, c[0]);
  }
  for (const h of g.houses) {
    const placed = new Set(h.cells.map((c) => grid[c]).filter(Boolean));
    for (let d = 1; d <= size; d++) {
      if (placed.has(d)) continue;
      const spots = h.cells.filter((c) => !grid[c] && candidates(grid, size, c).includes(d));
      if (spots.length === 1) out.set(spots[0], d);
    }
  }
  return [...out].map(([cell, digit]) => ({ cell, digit }));
}

/** How many of each number are still to be placed, for the tray (index 0 is the digit 1). */
export function remaining(grid: Grid, size: Size): number[] {
  const left = Array<number>(size).fill(size);
  for (const d of grid) if (d) left[d - 1]--;
  return left;
}

/** The house names the spoken hints use. */
export const houseName = (h: House) => (h.kind === 'column' ? 'column' : h.kind);
