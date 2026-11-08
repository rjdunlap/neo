import type { Rng } from '../../engine/random';
import type { BandLevels } from '../../progress/difficulty';

/**
 * Sudoku Garden's rules. A bed is a square of numbered flowers: every row, every column and every box
 * holds each number once. 4 by 4 beds have boxes 2 by 2; 6 by 6 beds have boxes two rows tall and three wide; 9 by 9 beds have 3 by 3.
 * A grid is a flat array, row by row, with 0 for an empty square.
 */
export type Size = 4 | 6 | 9;
export type Grid = readonly number[];
export type HouseKind = 'row' | 'column' | 'box' | 'cage';

export interface House {
  kind: HouseKind;
  index: number;
  cells: readonly number[];
  /** What the spoken hints call it when not its kind: a patchwork bed's boxes are patches. */
  word?: 'patch';
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
  /** A patchwork bed's layout (one letter a square, row by row), or null for a bed of regular boxes. */
  patches: string | null;
  /**
   * A cage bed's cages (empty on any other bed): houses of kind `cage` with their sums. They are not in `houses`, since a
   * cage need not hold every number, but their squares are each other's peers, as no number repeats in a cage.
   */
  cages: readonly CageHouse[];
  /** Each square's cage index, or -1 on a bed without cages. */
  cageOf: readonly number[];
}

/** A cage of a cage bed: two to four squares joined edge to edge whose numbers add up to `sum` and never repeat. */
export interface Cage {
  cells: number[];
  sum: number;
}
export interface CageHouse extends House {
  kind: 'cage';
  sum: number;
}

/** A bed's shape: its size for a bed of regular boxes, or its geometry (a patchwork bed's comes from `patchGeometry`). */
export type Shape = Size | Geometry;
export const geo = (s: Shape): Geometry => (typeof s === 'number' ? geometry(s) : s);

function build(
  size: Size,
  boxOf: readonly number[],
  br: number,
  bc: number,
  patches: string | null,
  cageList: readonly Cage[] = [],
): Geometry {
  const n = size,
    cells = n * n;
  const rowOf = Array.from({ length: cells }, (_, i) => Math.floor(i / n));
  const colOf = Array.from({ length: cells }, (_, i) => i % n);
  const houses: House[] = [];
  for (let k = 0; k < n; k++)
    houses.push({ kind: 'row', index: k, cells: Array.from({ length: n }, (_, c) => k * n + c) });
  for (let k = 0; k < n; k++)
    houses.push({ kind: 'column', index: k, cells: Array.from({ length: n }, (_, r) => r * n + k) });
  for (let k = 0; k < n; k++)
    houses.push({
      kind: 'box',
      index: k,
      cells: Array.from({ length: cells }, (_, i) => i).filter((i) => boxOf[i] === k),
      ...(patches ? { word: 'patch' as const } : {}),
    });
  const cages: CageHouse[] = cageList.map((c, index) => ({
    kind: 'cage',
    index,
    cells: c.cells.slice().sort((a, b) => a - b),
    sum: c.sum,
  }));
  const cageOf = Array<number>(cells).fill(-1);
  for (const c of cages) for (const i of c.cells) cageOf[i] = c.index;
  const peers = Array.from({ length: cells }, (_, i) =>
    Array.from({ length: cells }, (_, j) => j).filter(
      (j) =>
        j !== i &&
        (rowOf[j] === rowOf[i] ||
          colOf[j] === colOf[i] ||
          boxOf[j] === boxOf[i] ||
          (cageOf[i] >= 0 && cageOf[j] === cageOf[i])),
    ),
  );
  const housesOf = Array.from(
    { length: cells },
    (_, i) => [houses[rowOf[i]], houses[n + colOf[i]], houses[2 * n + boxOf[i]]] as const,
  );
  return { size, br, bc, cells, houses, peers, rowOf, colOf, boxOf, housesOf, patches, cages, cageOf };
}

const geometries = new Map<Size, Geometry>();
const regularBoxes = (size: Size) => {
  const n = size,
    br = size === 9 ? 3 : 2,
    bc = size === 4 ? 2 : 3;
  return {
    br,
    bc,
    boxOf: Array.from(
      { length: n * n },
      (_, i) => Math.floor(Math.floor(i / n) / br) * (n / bc) + Math.floor((i % n) / bc),
    ),
  };
};
export function geometry(size: Size): Geometry {
  let g = geometries.get(size);
  if (g) return g;
  const { br, bc, boxOf } = regularBoxes(size);
  g = build(size, boxOf, br, bc, null);
  geometries.set(size, g);
  return g;
}

/** A cage bed's geometry: regular boxes, with the cages on top. */
const cageds = new Map<string, Geometry>();
export function cageGeometry(size: Size, cages: readonly Cage[]): Geometry {
  const key = `${size}:${cages.map((c) => `${c.cells.join(',')}=${c.sum}`).join(';')}`;
  let g = cageds.get(key);
  if (g) return g;
  const { br, bc, boxOf } = regularBoxes(size);
  g = build(size, boxOf, br, bc, null, cages);
  cageds.set(key, g);
  return g;
}

/** The cages' squares in reading order, so a label goes in each cage's first square. */
export const cageLabelCell = (c: House) => Math.min(...c.cells);

/**
 * A patchwork bed's geometry from its layout: one row of letters a line, each letter one patch. The patches take the
 * place of the boxes (as houses of kind `box`, called patches when spoken), numbered by first appearance.
 */
const patchworks = new Map<string, Geometry>();
export function patchGeometry(rows: readonly string[]): Geometry {
  const key = rows.join('');
  let g = patchworks.get(key);
  if (g) return g;
  const size = rows.length as Size,
    ids = [...new Set(key)];
  if (key.length !== size * size || ids.length !== size)
    throw new Error('a patchwork bed has one patch a row');
  g = build(
    size,
    [...key].map((ch) => ids.indexOf(ch)),
    0,
    0,
    key,
  );
  patchworks.set(key, g);
  return g;
}

const bit = (digit: number) => 1 << (digit - 1);
const fullMask = (size: Size) => (1 << size) - 1;
const popcount = (m: number) => {
  let n = 0;
  for (; m; m &= m - 1) n++;
  return n;
};
/** The digits in a mask, lowest first. */
export const digitsOf = (m: number): number[] => {
  const out: number[] = [];
  for (let d = 1; m; d++, m >>= 1) if (m & 1) out.push(d);
  return out;
};

export const emptyGrid = (size: Size): number[] => Array<number>(size * size).fill(0);
export const parseGrid = (rows: readonly string[]): number[] =>
  rows
    .join('')
    .split('')
    .map((ch) => (ch === '.' ? 0 : Number(ch)));
export const formatGrid = (grid: Grid, size: Size): string[] =>
  Array.from({ length: size }, (_, r) =>
    grid
      .slice(r * size, r * size + size)
      .map((d) => (d ? String(d) : '.'))
      .join(''),
  );

/** Digits that fit a square: not already in its row, column or box. */
export function candidates(grid: Grid, shape: Shape, cell: number): number[] {
  const g = geo(shape),
    size = g.size;
  let used = 0;
  for (const p of g.peers[cell]) if (grid[p]) used |= bit(grid[p]);
  return digitsOf(fullMask(size) & ~used);
}

/** Squares holding a number that another square in the same row, column or box also holds. */
export function conflicts(grid: Grid, shape: Shape): number[] {
  const g = geo(shape),
    out = new Set<number>();
  for (const h of [...g.houses, ...g.cages]) {
    const seen = new Map<number, number>();
    for (const c of h.cells) {
      const d = grid[c];
      if (!d) continue;
      const first = seen.get(d);
      if (first === undefined) seen.set(d, c);
      else {
        out.add(first);
        out.add(c);
      }
    }
  }
  return [...out].sort((a, b) => a - b);
}

/** Empty squares where no number fits any more: something placed earlier has to come out. */
export function deadEnds(grid: Grid, shape: Shape): number[] {
  const out: number[] = [];
  for (let i = 0; i < grid.length; i++) if (!grid[i] && candidates(grid, shape, i).length === 0) out.push(i);
  return out;
}

export const isFull = (grid: Grid) => grid.every((d) => d > 0);
export const isSolved = (grid: Grid, shape: Shape) =>
  isFull(grid) && conflicts(grid, shape).length === 0 && wrongSums(grid, shape).length === 0;

/** Cages whose numbers do not add up: full and off their sum, or already past it. */
export function wrongSums(grid: Grid, shape: Shape): CageHouse[] {
  return geo(shape).cages.filter((c) => {
    const have = c.cells.reduce((t, i) => t + grid[i], 0);
    return have > c.sum || (c.cells.every((i) => grid[i]) && have !== c.sum);
  });
}

/**
 * Every set of `k` different numbers from 1 to `size` that adds up to `sum`, each lowest first: what a cage of `k`
 * squares can hold.
 */
export function cageSets(sum: number, k: number, size: number): number[][] {
  const out: number[][] = [];
  const go = (from: number, left: number, picked: number[]) => {
    if (picked.length === k) {
      if (left === 0) out.push(picked.slice());
      return;
    }
    for (let d = from; d <= size && d <= left; d++) {
      picked.push(d);
      go(d + 1, left - d, picked);
      picked.pop();
    }
  };
  go(1, sum, []);
  return out;
}

/** The smallest and largest sums of `k` different numbers from those in the mask `free`. */
function sumRange(free: number, k: number): [number, number] {
  const ds = digitsOf(free);
  if (ds.length < k) return [Infinity, -Infinity];
  let lo = 0,
    hi = 0;
  for (let j = 0; j < k; j++) {
    lo += ds[j];
    hi += ds[ds.length - 1 - j];
  }
  return [lo, hi];
}

/**
 * Depth-first search over the empty square with the fewest choices. Counts solutions up to `limit`; with an
 * `rng` it tries digits in random order, which is how a full bed is grown. `first` keeps the first solution found.
 */
function search(
  grid: Grid,
  shape: Shape,
  limit: number,
  rng?: Rng,
): { count: number; first: number[] | null } {
  const g = geo(shape),
    n = g.size,
    full = fullMask(n);
  const work = grid.slice();
  const row = Array<number>(n).fill(0),
    col = Array<number>(n).fill(0),
    box = Array<number>(n).fill(0);
  // A cage bed also keeps, for each cage, the numbers in it, what they add up to and how many squares are still empty.
  const cageOf = g.cageOf,
    cageUsed = g.cages.map(() => 0),
    cageSum = g.cages.map(() => 0),
    cageLeft = g.cages.map((c) => c.cells.length);
  const caged = g.cages.length > 0;
  for (let i = 0; i < work.length; i++) {
    const d = work[i];
    if (!d) continue;
    const m = bit(d),
      k = cageOf[i];
    if ((row[g.rowOf[i]] | col[g.colOf[i]] | box[g.boxOf[i]] | (k >= 0 ? cageUsed[k] : 0)) & m)
      return { count: 0, first: null };
    row[g.rowOf[i]] |= m;
    col[g.colOf[i]] |= m;
    box[g.boxOf[i]] |= m;
    if (k >= 0) {
      cageUsed[k] |= m;
      cageSum[k] += d;
      cageLeft[k]--;
    }
  }
  // Whether the number `d` in cage `k` leaves a sum its other empty squares can still make.
  const sumFits = (k: number, d: number) => {
    const left = g.cages[k].sum - cageSum[k] - d,
      [lo, hi] = sumRange(full & ~cageUsed[k] & ~bit(d), cageLeft[k] - 1);
    return left >= lo && left <= hi;
  };
  if (caged)
    for (let k = 0; k < g.cages.length; k++) {
      const [lo, hi] = sumRange(full & ~cageUsed[k], cageLeft[k]),
        left = g.cages[k].sum - cageSum[k];
      if (left < lo || left > hi) return { count: 0, first: null };
    }
  const options = (i: number) => {
    const k = cageOf[i];
    let m = full & ~(row[g.rowOf[i]] | col[g.colOf[i]] | box[g.boxOf[i]] | (k >= 0 ? cageUsed[k] : 0));
    if (k >= 0) for (const d of digitsOf(m)) if (!sumFits(k, d)) m &= ~bit(d);
    return m;
  };
  let count = 0;
  let first: number[] | null = null;
  const go = () => {
    if (count >= limit) return;
    let best = -1,
      bestMask = 0,
      bestCount = n + 1;
    for (let i = 0; i < work.length; i++) {
      if (work[i]) continue;
      const m = options(i);
      const k = popcount(m);
      if (k === 0) return;
      if (k < bestCount) {
        best = i;
        bestMask = m;
        bestCount = k;
        if (k === 1) break;
      }
    }
    if (best < 0) {
      count++;
      first ??= work.slice();
      return;
    }
    const tries = digitsOf(bestMask);
    if (rng) rng.shuffle(tries);
    for (const d of tries) {
      const m = bit(d),
        r = g.rowOf[best],
        c = g.colOf[best],
        b = g.boxOf[best],
        k = cageOf[best];
      work[best] = d;
      row[r] |= m;
      col[c] |= m;
      box[b] |= m;
      if (k >= 0) {
        cageUsed[k] |= m;
        cageSum[k] += d;
        cageLeft[k]--;
      }
      go();
      work[best] = 0;
      row[r] &= ~m;
      col[c] &= ~m;
      box[b] &= ~m;
      if (k >= 0) {
        cageUsed[k] &= ~m;
        cageSum[k] -= d;
        cageLeft[k]++;
      }
      if (count >= limit) return;
    }
  };
  go();
  return { count, first };
}

/** How many ways the grid can be finished, counting no further than `limit`. */
export const countSolutions = (grid: Grid, shape: Shape, limit = 2): number =>
  search(grid, shape, limit).count;
/** One way to finish the grid, or null. For a puzzle with a unique solution, the way. */
export const solve = (grid: Grid, shape: Shape): number[] | null => search(grid, shape, 1).first;
/** A random full bed. */
export const randomBed = (shape: Shape, rng: Rng): number[] =>
  search(emptyGrid(geo(shape).size), shape, 1, rng).first!;

/* ------------------------------------------------------------------------------------------------ */
/* Solving the way a person does                                                                      */
/* ------------------------------------------------------------------------------------------------ */

/**
 * The ways of working a bed out that the game knows and explains, easiest first.
 * `lone`: only one number fits a square. `place`: a number has only one square left in a row, column or box.
 * `pair`: two squares in a house can only hold the same two numbers, so no other square there can.
 * `locked`: a number's squares in a house all lie along one line (or one box), which rules it out of the rest of that line (or box).
 * `xwing`: in two rows a number has only two places each, in the same two columns (or the same with rows and columns
 * swapped), so it sits in two opposite corners of that rectangle and is ruled out of the rest of those two columns.
 * On a cage bed, `cage-last`: every square of a cage but one is filled, so the last holds the sum less the rest; and
 * `cage-sets`: only some sets of different numbers make a cage's sum and fit its empty squares, which rules the others out.
 */
export type Tech = 'lone' | 'place' | 'pair' | 'locked' | 'xwing' | 'cage-last' | 'cage-sets';
export type Tier = 1 | 2 | 3 | 4;
export const TIER: Record<Tech, Tier> = {
  lone: 1,
  place: 2,
  pair: 3,
  locked: 3,
  xwing: 4,
  'cage-last': 1,
  'cage-sets': 2,
};

export interface Step {
  tech: Tech;
  /** The square a number goes in, or -1 for a step that only rules numbers out. */
  cell: number;
  digit: number;
  /** `place`: the house the number has only one place in. `pair` and `locked`: the house the pattern lives in. `xwing`: the first of its two lines. */
  house?: House;
  /** `xwing`: the two rows (or columns) whose places line up. */
  lines?: House[];
  /** `pair`: the two squares. `locked`: the squares holding the number's remaining places. `xwing`: the four corners. Cage steps: the cage's squares. */
  pattern?: number[];
  /** `pair`: the two numbers. `locked`: the one number. `cage-sets`: the numbers the kept sets allow. */
  digits?: number[];
  /** Cage steps: the cage. */
  cage?: CageHouse;
  /** `cage-sets`: the sets of numbers the cage can still hold, each lowest first. */
  sets?: number[][];
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
 * ends as soon as one number has been placed, which is what a hint needs. `sums: false` leaves out the two cage
 * techniques (a cage still never repeats a number), which is how a test shows a cage bed needs its sums.
 */
export function techniqueSolve(
  start: Grid,
  shape: Shape,
  maxTier: Tier = 4,
  stopAtPlacement = false,
  sums = true,
): TechResult {
  const g = geo(shape),
    size = g.size,
    full = fullMask(size);
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
  if (conflicts(start, g).length || wrongSums(start, g).length) return result(false);

  const place = (cell: number, digit: number) => {
    grid[cell] = digit;
    cand[cell] = 0;
    for (const p of g.peers[cell]) cand[p] &= ~bit(digit);
  };
  const empties = () => grid.reduce((n, d) => n + (d ? 0 : 1), 0);

  const lone = (): Step | null => {
    for (let i = 0; i < grid.length; i++)
      if (!grid[i] && popcount(cand[i]) === 1) return { tech: 'lone', cell: i, digit: digitsOf(cand[i])[0] };
    return null;
  };
  // On a patchwork bed the patches are looked at first, so a hint names a patch whenever one has a number with one place left.
  const onlyOrder = g.patches ? [...g.houses.slice(2 * size), ...g.houses.slice(0, 2 * size)] : g.houses;
  const only = (): Step | null => {
    for (const h of onlyOrder) {
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
          const mask = cand[twins[a]],
            removed: { cell: number; digit: number }[] = [];
          for (const c of h.cells) {
            if (grid[c] || c === twins[a] || c === twins[b]) continue;
            for (const d of digitsOf(cand[c] & mask)) removed.push({ cell: c, digit: d });
          }
          if (removed.length)
            return {
              tech: 'pair',
              cell: -1,
              digit: 0,
              house: h,
              pattern: [twins[a], twins[b]],
              digits: digitsOf(mask),
              removed,
            };
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
          if (spots.every((c) => g.colOf[c] === g.colOf[spots[0]]))
            lines.push(g.houses[size + g.colOf[spots[0]]]);
        } else if (spots.every((c) => g.boxOf[c] === g.boxOf[spots[0]]))
          lines.push(g.houses[2 * size + g.boxOf[spots[0]]]);
        for (const line of lines) {
          const removed = line.cells
            .filter((c) => !grid[c] && !spots.includes(c) && cand[c] & bit(d))
            .map((c) => ({ cell: c, digit: d }));
          if (removed.length)
            return { tech: 'locked', cell: -1, digit: d, house: h, pattern: spots, digits: [d], removed };
        }
      }
    }
    return null;
  };

  const xwing = (): Step | null => {
    for (const kind of ['row', 'column'] as const) {
      const base = g.houses.filter((h) => h.kind === kind),
        across = (c: number) => (kind === 'row' ? g.colOf[c] : g.rowOf[c]);
      for (let d = 1; d <= size; d++) {
        const spots = base.map((h) => h.cells.filter((c) => !grid[c] && cand[c] & bit(d)));
        for (let a = 0; a < size; a++) {
          if (spots[a].length !== 2) continue;
          for (let b = a + 1; b < size; b++) {
            if (
              spots[b].length !== 2 ||
              across(spots[a][0]) !== across(spots[b][0]) ||
              across(spots[a][1]) !== across(spots[b][1])
            )
              continue;
            const corners = [...spots[a], ...spots[b]],
              removed: { cell: number; digit: number }[] = [];
            for (const k of [across(spots[a][0]), across(spots[a][1])]) {
              const cover = g.houses[(kind === 'row' ? size : 0) + k];
              for (const c of cover.cells)
                if (!grid[c] && !corners.includes(c) && cand[c] & bit(d)) removed.push({ cell: c, digit: d });
            }
            if (removed.length)
              return {
                tech: 'xwing',
                cell: -1,
                digit: d,
                house: base[a],
                lines: [base[a], base[b]],
                pattern: corners,
                digits: [d],
                removed,
              };
          }
        }
      }
    }
    return null;
  };

  const cageLast = (): Step | null => {
    for (const c of g.cages) {
      const open = c.cells.filter((i) => !grid[i]);
      if (open.length !== 1) continue;
      const digit = c.sum - c.cells.reduce((t, i) => t + grid[i], 0);
      // A sum that no number fitting the square can make means a wrong number is already in: nothing to place.
      if (digit < 1 || digit > size || !(cand[open[0]] & bit(digit))) return null;
      return { tech: 'cage-last', cell: open[0], digit, cage: c, pattern: c.cells.slice() };
    }
    return null;
  };
  const cageSetsStep = (): Step | null => {
    for (const c of g.cages) {
      const open = c.cells.filter((i) => !grid[i]);
      if (open.length < 2) continue;
      const have = c.cells.filter((i) => grid[i]).map((i) => grid[i]);
      const allowed = open.map(() => 0),
        kept: number[][] = [];
      for (const set of cageSets(c.sum, c.cells.length, size)) {
        if (!have.every((d) => set.includes(d))) continue;
        const rest = set.filter((d) => !have.includes(d));
        // Every way to give each empty square a different number of the rest, from what still fits it.
        let fits = false;
        const assign = (k: number, free: number[], chosen: number[]) => {
          if (k === open.length) {
            fits = true;
            chosen.forEach((d, j) => (allowed[j] |= bit(d)));
            return;
          }
          for (const d of free)
            if (cand[open[k]] & bit(d))
              assign(
                k + 1,
                free.filter((e) => e !== d),
                [...chosen, d],
              );
        };
        assign(0, rest, []);
        if (fits) kept.push(set);
      }
      const removed: { cell: number; digit: number }[] = [];
      open.forEach((i, j) => {
        for (const d of digitsOf(cand[i] & ~allowed[j])) removed.push({ cell: i, digit: d });
      });
      if (removed.length)
        return {
          tech: 'cage-sets',
          cell: -1,
          digit: 0,
          cage: c,
          pattern: c.cells.slice(),
          digits: digitsOf(allowed.reduce((m, a) => m | a, 0)),
          sets: kept,
          removed,
        };
    }
    return null;
  };

  while (empties()) {
    let step = lone();
    if (!step && sums) step = cageLast();
    if (!step && maxTier >= 2) step = only();
    if (!step && maxTier >= 2 && sums) step = cageSetsStep();
    if (!step && maxTier >= 3) step = pair() ?? locked();
    if (!step && maxTier >= 4) step = xwing();
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

/** The easiest set of techniques that finishes the grid by itself: 1 to 4, or 0 if these are not enough. */
export function gradeOf(grid: Grid, shape: Shape): 0 | Tier {
  for (const tier of [1, 2, 3, 4] as const) if (techniqueSolve(grid, shape, tier).solved) return tier;
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
  /** A patchwork bed: irregular patches from `PATCH_LAYOUTS` in place of the boxes. */
  patchwork?: boolean;
  /** A cage bed: every square in a cage of 2–4 squares with its sum, grown by `makeCageBed`. */
  cages?: true;
}

/**
 * The ladder: two 6 by 6 beds that lone numbers solve (the second with far fewer to start from), a 6 by 6 bed that
 * needs the only-place-left trick, then the same climb on a 9 by 9 bed, ending with one that needs a pair or a pointing
 * line. (A 6 by 6 bed almost never needs a pair, so it has no third rung.) Level 7 is the easy entry appended above them: a 4 by 4
 * bed of 2 by 2 boxes that lone numbers finish, played first by `order`. Level 8 is the top, played last: a 9 by 9 bed that
 * needs a crossing pair of rows (an X-Wing). Level 9 is played after level 3: a 6 by 6 bed whose boxes are irregular patches.
 * Level 10 is played after level 9: a 6 by 6 bed cut into cages with sums, only six numbers given.
 */
export const PLANS: SudokuPlan[] = [
  { name: 'A 6 by 6 bed with a few numbers to find', size: 6, tier: 1, blanks: 14, beds: 1 },
  { name: 'A 6 by 6 bed with half of it to find', size: 6, tier: 1, blanks: 21, beds: 1 },
  { name: 'A 6 by 6 bed that needs the only-place-left trick', size: 6, tier: 2, blanks: 24, beds: 1 },
  { name: 'A 9 by 9 bed with plenty of numbers to start', size: 9, tier: 1, blanks: 42, beds: 1 },
  { name: 'A 9 by 9 bed that needs the only-place-left trick', size: 9, tier: 2, blanks: 52, beds: 1 },
  { name: 'A 9 by 9 bed with a pair or a pointing line to find', size: 9, tier: 3, blanks: 55, beds: 1 },
  { name: 'A 4 by 4 bed to start', size: 4, tier: 1, blanks: 10, beds: 1 },
  { name: 'A 9 by 9 bed with a crossing pair of rows', size: 9, tier: 4, blanks: 55, beds: 1 },
  {
    name: 'A 6 by 6 patchwork bed of odd-shaped patches',
    size: 6,
    tier: 2,
    blanks: 20,
    beds: 1,
    patchwork: true,
  },
  { name: 'A 6 by 6 bed with sums in the cages', size: 6, tier: 2, blanks: 30, beds: 1, cages: true },
];

/** Grown-up play only: this game lives on the couch, not on the child's island. */
/** Level 7, a 4 by 4 bed, is the easy entry played first; the ladder then climbs 1 to 6, with patchwork (9) and cage (10) beds after 3. */
export const LEVELS: BandLevels = { grownup: { min: 1, max: 10, order: [7, 1, 2, 3, 9, 10, 4, 5, 6, 8] } };

/**
 * Level 9's patch layouts, one letter a patch. Each has six connected patches of six squares, none a straight line and
 * at most one a plain 2 by 3 box, admits a full bed, and its patches take three soil tints with no two neighbours alike.
 */
export const PATCH_LAYOUTS: readonly (readonly string[])[] = [
  ['aaaabb', 'aaccbb', 'cccdbb', 'eecdff', 'eddddf', 'eeefff'],
  ['aaaabc', 'dabbbc', 'dabbcc', 'ddeccf', 'ddefff', 'eeeeff'],
  ['aaaabc', 'ddaabc', 'dddbbc', 'eedbbc', 'eeefcc', 'efffff'],
  ['abbccc', 'aabcdd', 'abbcdd', 'abecdf', 'aeefdf', 'eeefff'],
  ['aabccd', 'aabccd', 'abbccd', 'abbedd', 'eeeefd', 'efffff'],
  ['aaabcc', 'aaabbc', 'ddbbec', 'ddfbec', 'dfffec', 'dffeee'],
  ['aabbbb', 'aabbcd', 'aacccd', 'eeccdd', 'eeeddf', 'efffff'],
  ['aaabcc', 'aadbcc', 'addbbc', 'eddbbc', 'edefff', 'eeefff'],
];

/**
 * A soil tint (0, 1 or 2) for each patch of a patchwork bed, so that no two patches sharing an edge look alike:
 * the first such colouring in counting order.
 */
const tintsOf = new WeakMap<Geometry, number[]>();
export function patchTints(g: Geometry): number[] {
  let found = tintsOf.get(g);
  if (!found) tintsOf.set(g, (found = colourPatches(g)));
  return found;
}

function colourPatches(g: Geometry): number[] {
  const n = g.size,
    near = Array.from({ length: n }, () => new Set<number>());
  for (let i = 0; i < g.cells; i++)
    for (const j of [i + n, g.colOf[i] < n - 1 ? i + 1 : -1])
      if (j >= 0 && j < g.cells && g.boxOf[i] !== g.boxOf[j]) {
        near[g.boxOf[i]].add(g.boxOf[j]);
        near[g.boxOf[j]].add(g.boxOf[i]);
      }
  for (let m = 0; m < 3 ** n; m++) {
    const tint = Array.from({ length: n }, (_, k) => Math.floor(m / 3 ** k) % 3);
    if (near.every((s, a) => [...s].every((b) => tint[a] !== tint[b]))) return tint;
  }
  return Array.from({ length: n }, (_, k) => k % 3);
}

export const planFor = (level: number): SudokuPlan => PLANS[Math.min(PLANS.length, Math.max(1, level)) - 1];

/**
 * The same bed with only `keep` empty squares left, spread over the bed: the how-to card's demonstration shows the taps, not
 * every blank of a 9 by 9. Squares filled in come from the solution, so the one answer is unchanged.
 */
export function shortBed(p: Puzzle, keep = 10): Puzzle {
  const blanks = p.start.map((d, i) => (d ? -1 : i)).filter((i) => i >= 0);
  if (blanks.length <= keep) return p;
  const left = new Set(
    Array.from({ length: keep }, (_, k) => blanks[Math.floor((k * blanks.length) / keep)]),
  );
  const start = p.start.map((d, i) => (d || left.has(i) ? d : p.solution[i]));
  return { ...p, start, blanks: left.size };
}

export interface Puzzle {
  /** What the bed shows to start: numbers given, and 0 for empty squares. */
  start: number[];
  /** The one way to finish it. */
  solution: number[];
  size: Size;
  blanks: number;
  /** The hardest technique needed to finish it without guessing. */
  grade: Tier;
  /** A patchwork bed's geometry; absent for a bed of regular boxes. */
  patchwork?: Geometry;
  /** A cage bed's cages; absent on any other bed. */
  cages?: Cage[];
}

/** The shape the rules read a puzzle with: its patchwork or cage geometry, or its size. */
export const shapeOf = (p: Puzzle): Shape =>
  p.patchwork ?? (p.cages ? cageGeometry(p.size, p.cages) : p.size);

/**
 * A bed with exactly one solution that techniques up to the plan's tier can finish, with as many empty squares as the
 * plan asks for. A random full bed has numbers taken out in random order, each kept out only if the bed stays unique and
 * workable. Beds that do not reach the plan's blanks, or are easier than its tier, are thrown away and grown again.
 * Tier 4 (level 8) is too rare to grow this way, so it comes from `WING_BEDS`.
 */
export function makePuzzle(plan: SudokuPlan, rng: Rng): Puzzle {
  if (plan.cages) return makeCageBed(plan, rng);
  if (plan.tier === 4) return shuffleBed(rng.pick(WING_BEDS), rng);
  // A patchwork bed is never shuffled like `shuffleBed` does: reordering bands would tear its patches apart.
  const patchwork = plan.patchwork ? patchGeometry(rng.pick(PATCH_LAYOUTS)) : undefined,
    shape: Shape = patchwork ?? plan.size;
  const n = plan.size * plan.size;
  let best: Puzzle | null = null;
  for (let attempt = 0; attempt < 400; attempt++) {
    const solution = randomBed(shape, rng);
    const start = solution.slice();
    let blanks = 0;
    for (const cell of rng.shuffle(Array.from({ length: n }, (_, i) => i))) {
      if (blanks >= plan.blanks) break;
      const was = start[cell];
      start[cell] = 0;
      if (countSolutions(start, shape) === 1 && techniqueSolve(start, shape, plan.tier).solved) blanks++;
      else start[cell] = was;
    }
    const grade = gradeOf(start, shape);
    if (!grade) continue;
    const puzzle: Puzzle = {
      start,
      solution,
      size: plan.size,
      blanks,
      grade,
      ...(patchwork ? { patchwork } : {}),
    };
    if (blanks === plan.blanks && grade === plan.tier) return puzzle;
    // Keep the closest bed in case nothing matches exactly: more blanks first, then the right grade.
    if (
      !best ||
      blanks > best.blanks ||
      (blanks === best.blanks && Math.abs(grade - plan.tier) < Math.abs(best.grade - plan.tier))
    )
      best = puzzle;
  }
  if (!best) throw new Error(`could not make a bed for ${plan.name}`);
  return best;
}

/**
 * Level 8's beds. Random beds need a crossing pair of rows only a few times in a thousand, too slowly to grow on a tablet,
 * so these were grown once by `makePuzzle`'s own removal (55 blanks, grade 4) and are checked by the solver in the tests.
 */
export const WING_BEDS: readonly (readonly string[])[] = [
  [
    '29.4..37.',
    '.....31..',
    '.1......5',
    '...6..93.',
    '....4....',
    '.563...2.',
    '371..9.5.',
    '.8...5...',
    '......8.2',
  ],
  [
    '...8.....',
    '6..2...5.',
    '..7.....9',
    '....3....',
    '31.....7.',
    '.9.7...4.',
    '48..71.95',
    '9...2.3..',
    '..5.6..81',
  ],
  [
    '.1.9....8',
    '5....8...',
    '...54...7',
    '..8.7.9..',
    '6.3....2.',
    '..9.53...',
    '.9.8...65',
    '..5...379',
    '......2..',
  ],
  [
    '...1.4..6',
    '....29...',
    '..17..9..',
    '..2...7.8',
    '.7..5..6.',
    '.......39',
    '.56.3.21.',
    '78...2...',
    '.1......3',
  ],
  [
    '....5.1..',
    '.....2.7.',
    '6....82..',
    '.4..89..6',
    '...4..9..',
    '8.5......',
    '9...3..81',
    '.62...3..',
    '4.3..7..2',
  ],
  [
    '..7..53..',
    '.2..6....',
    '6...13..2',
    '....52..6',
    '4.....1..',
    '.5..4178.',
    '..5......',
    '.42......',
    '.3...751.',
  ],
  [
    '.2..9..8.',
    '..12..579',
    '4........',
    '8....2.3.',
    '..95....4',
    '.4..8...7',
    '2..3..1..',
    '....2..93',
    '.1.8.....',
  ],
  [
    '...9..7..',
    '.........',
    '3.1.2.6.9',
    '65..1....',
    '2..8...5.',
    '1.9.7.2.6',
    '..7..38..',
    '..216.4..',
    '.......3.',
  ],
  [
    '61..384..',
    '....2....',
    '.5..9..18',
    '......54.',
    '..758...3',
    '1.53.....',
    '..6....71',
    '..2.7.9..',
    '3........',
  ],
  [
    '.5..1...7',
    '.........',
    '6.3.824..',
    '...5...34',
    '.4.8.1..5',
    '..6...28.',
    '.3.....9.',
    '.....68..',
    '.69..4..3',
  ],
  [
    '...7.9..3',
    '...265...',
    '..8.4.25.',
    '.5.93...7',
    '91...7..8',
    '..3......',
    '.3.5..9..',
    '.....2...',
    '.2.4...7.',
  ],
  [
    '.6.....17',
    '2.8......',
    '..5..39..',
    '.......5.',
    '....71..2',
    '75.4.6..3',
    '..98..4..',
    '5.....3..',
    '.31.67...',
  ],
];

/**
 * The same bed seen another way: its numbers relabelled, its bands and stacks reordered, the rows inside each band and
 * the columns inside each stack reordered, and maybe turned on its diagonal. Each of these keeps every row, column and
 * box a row, column or box, so the one solution, the blanks and the techniques it needs are all unchanged.
 */
export function shuffleBed(rows: readonly string[], rng: Rng): Puzzle {
  const grid = parseGrid(rows),
    n = rows.length,
    b = Math.sqrt(n);
  const lines = () =>
    rng
      .shuffle(Array.from({ length: b }, (_, k) => k))
      .flatMap((band) => rng.shuffle(Array.from({ length: b }, (_, k) => band * b + k)));
  const rowAt = lines(),
    colAt = lines(),
    turn = rng.chance(0.5);
  const label = [0, ...rng.shuffle(Array.from({ length: n }, (_, k) => k + 1))];
  const start = Array.from({ length: n * n }, (_, i) => {
    const r = Math.floor(i / n),
      c = i % n,
      [from, to] = turn ? [colAt[c], rowAt[r]] : [rowAt[r], colAt[c]];
    return label[grid[from * n + to]];
  });
  return parsePuzzle(formatGrid(start, n as Size));
}

/** How many squares a new cage gets: 2 for 45 in 100, 3 for 40 and 4 for 15. */
const cageSize = (rng: Rng) => {
  const r = rng.next();
  return r < 0.45 ? 2 : r < 0.85 ? 3 : 4;
};

/**
 * Cut a full bed into cages of 2–4 squares joined edge to edge, no number repeated in one, walking the squares in a seeded
 * order. A square left on its own joins a neighbouring cage of fewer than four that lacks its number; if none does, null.
 */
export function partitionCages(solution: Grid, size: Size, rng: Rng): Cage[] | null {
  const n = size,
    of = Array<number>(n * n).fill(-1),
    cages: number[][] = [];
  const near = (i: number) =>
    [i - n, i + n, i % n ? i - 1 : -1, i % n < n - 1 ? i + 1 : -1].filter((j) => j >= 0 && j < n * n);
  for (const start of rng.shuffle(Array.from({ length: n * n }, (_, i) => i))) {
    if (of[start] >= 0) continue;
    const cage = [start],
      want = cageSize(rng);
    of[start] = cages.length;
    while (cage.length < want) {
      const grow = cage
        .flatMap(near)
        .filter(
          (j, k, all) => of[j] < 0 && all.indexOf(j) === k && !cage.some((c) => solution[c] === solution[j]),
        );
      if (!grow.length) break;
      const j = rng.pick(grow);
      cage.push(j);
      of[j] = cages.length;
    }
    cages.push(cage);
  }
  // Fold each lone square into a neighbouring cage.
  for (let k = 0; k < cages.length; k++) {
    if (cages[k].length !== 1) continue;
    const i = cages[k][0];
    const homes = rng.shuffle(
      near(i)
        .map((j) => of[j])
        .filter(
          (h, x, all) =>
            h !== k &&
            all.indexOf(h) === x &&
            cages[h].length > 1 &&
            cages[h].length < 4 &&
            !cages[h].some((c) => solution[c] === solution[i]),
        ),
    );
    if (!homes.length) return null;
    cages[homes[0]].push(i);
    of[i] = homes[0];
    cages[k] = [];
  }
  return cages
    .filter((c) => c.length)
    .map((cells) => ({
      cells: cells.sort((a, b) => a - b),
      sum: cells.reduce((t, i) => t + solution[i], 0),
    }));
}

/** A cage with only one set of numbers that makes its sum: the bed's first foothold. */
export const singleSetCages = (cages: readonly Cage[], size: Size): Cage[] =>
  cages.filter((c) => cageSets(c.sum, c.cells.length, size).length === 1);

/**
 * A cage bed (level 10): a full bed cut into cages, then numbers taken out as `makePuzzle` does, each kept out only if the
 * bed stays unique with the cages and the techniques up to the plan's tier still finish it. A bed is kept only if its
 * sums are needed (without the two cage techniques, no tier finishes it) and something can be placed at a look to start.
 */
export function makeCageBed(plan: SudokuPlan, rng: Rng): Puzzle {
  const size = plan.size,
    n = size * size;
  let best: Puzzle | null = null;
  for (let attempt = 0; attempt < 400; attempt++) {
    const solution = randomBed(size, rng);
    let cages: Cage[] | null = null;
    for (let t = 0; t < 50 && !cages; t++) {
      const cut = partitionCages(solution, size, rng);
      if (cut && singleSetCages(cut, size).length) cages = cut;
    }
    if (!cages) continue;
    const g = cageGeometry(size, cages),
      start = solution.slice();
    let blanks = 0;
    for (const cell of rng.shuffle(Array.from({ length: n }, (_, i) => i))) {
      if (blanks >= plan.blanks) break;
      const was = start[cell];
      start[cell] = 0;
      if (countSolutions(start, g) === 1 && techniqueSolve(start, g, plan.tier).solved) blanks++;
      else start[cell] = was;
    }
    // The sums must be needed, and the first number must need only a look (a lone number, an only place or a cage's last
    // square), never a cage's sets straight away.
    if (techniqueSolve(start, g, 4, false, false).solved || !placements(start, g).length) continue;
    const grade = gradeOf(start, g);
    if (!grade) continue;
    const puzzle: Puzzle = { start, solution, size, blanks, grade, cages };
    if (blanks === plan.blanks && grade === plan.tier) return puzzle;
    if (
      !best ||
      blanks > best.blanks ||
      (blanks === best.blanks && Math.abs(grade - plan.tier) < Math.abs(best.grade - plan.tier))
    )
      best = puzzle;
  }
  if (!best) throw new Error(`could not make a bed for ${plan.name}`);
  return best;
}

export const makeBeds = (plan: SudokuPlan, rng: Rng): Puzzle[] =>
  Array.from({ length: plan.beds }, () => makePuzzle(plan, rng));

/** A bed from its picture, with its solution worked out. */
export function parsePuzzle(rows: readonly string[]): Puzzle {
  const size = rows.length as Size;
  if (size !== 4 && size !== 6 && size !== 9) throw new Error('a bed is 4 by 4, 6 by 6 or 9 by 9');
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
  /** After a pair, a pointing line, a crossing pair of rows or a cage's sets rule numbers out, one number is left for this square. */
  | { kind: 'rules-out'; cell: number; digit: number; via: Step }
  /** The last empty square of a cage: its sum less the numbers already in. */
  | { kind: 'cage-last'; cell: number; digit: number; cage: CageHouse; have: number }
  /** Nothing simple is left (only if she has put the bed in a state no technique reads): the square with fewest choices. */
  | { kind: 'few'; cell: number; digit: number };

/**
 * Where a hint should point. First a number she placed that does not belong, preferring one that clashes with another;
 * otherwise the next number the techniques can place from where the bed stands now, with the reason.
 */
export function hintFor(grid: Grid, given: Grid, solution: Grid, shape: Shape): Hint | null {
  const size = geo(shape).size;
  const wrong = grid.map((d, i) => (d && !given[i] && d !== solution[i] ? i : -1)).filter((i) => i >= 0);
  if (wrong.length) {
    const clashing = new Set(conflicts(grid, shape));
    return { kind: 'fix', cell: wrong.find((i) => clashing.has(i)) ?? wrong[0] };
  }
  const work = techniqueSolve(grid, shape, 4, true);
  const last = work.steps[work.steps.length - 1];
  if (last?.tech === 'cage-last')
    return {
      kind: 'cage-last',
      cell: last.cell,
      digit: last.digit,
      cage: last.cage!,
      have: last.cage!.sum - last.digit,
    };
  if (last && last.cell >= 0) {
    // Easier steps are always taken first, so a pair or a pointing line only shows up when nothing simpler was left.
    // The step that ruled numbers out last is the one that made this number the only one left, unless a crossing pair
    // of rows ruled another number out of this square, or this number out of its row, column or box, on the way: that is the
    // step the level is about.
    const outs = work.steps.filter((s) => s.cell < 0),
      peers = geo(shape).peers[last.cell];
    const freed = (r: { cell: number; digit: number }) =>
      r.cell === last.cell || (r.digit === last.digit && peers.includes(r.cell));
    const via = outs.find((s) => s.tech === 'xwing' && s.removed!.some(freed)) ?? outs[outs.length - 1];
    if (via) return { kind: 'rules-out', cell: last.cell, digit: last.digit, via };
    if (last.tech === 'lone') return { kind: 'lone', cell: last.cell, digit: last.digit };
    return { kind: 'place', cell: last.cell, digit: last.digit, house: last.house! };
  }
  let few = -1,
    fewest = size + 1;
  for (let i = 0; i < grid.length; i++) {
    if (grid[i]) continue;
    const k = candidates(grid, shape, i).length;
    if (k < fewest) {
      few = i;
      fewest = k;
    }
  }
  return few >= 0 ? { kind: 'few', cell: few, digit: solution[few] } : null;
}

/** Every number the two easiest techniques can place right now: what a person (or a demo) could do next. */
export function placements(grid: Grid, shape: Shape): { cell: number; digit: number }[] {
  const g = geo(shape),
    size = g.size,
    out = new Map<number, number>();
  for (let i = 0; i < grid.length; i++) {
    if (grid[i]) continue;
    const c = candidates(grid, g, i);
    if (c.length === 1) out.set(i, c[0]);
  }
  for (const h of g.houses) {
    const placed = new Set(h.cells.map((c) => grid[c]).filter(Boolean));
    for (let d = 1; d <= size; d++) {
      if (placed.has(d)) continue;
      const spots = h.cells.filter((c) => !grid[c] && candidates(grid, g, c).includes(d));
      if (spots.length === 1) out.set(spots[0], d);
    }
  }
  for (const c of g.cages) {
    const open = c.cells.filter((i) => !grid[i]);
    if (open.length !== 1) continue;
    const d = c.sum - c.cells.reduce((t, i) => t + grid[i], 0);
    if (candidates(grid, g, open[0]).includes(d)) out.set(open[0], d);
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
export const houseName = (h: House): string => h.word ?? h.kind;

/* ------------------------------------------------------------------------------------------------ */
/* Fill marks                                                                                         */
/* ------------------------------------------------------------------------------------------------ */

/** Fill marks is offered only on 9 by 9 beds: on smaller beds, marks would read the lone numbers out for her. */
export const offersFillMarks = (size: Size) => size === 9;

/** Every number that still fits a square, as a mark bitmask (bit 0 is the digit 1). It reads only the rules on the board, never the answer. */
export const candidateMask = (grid: Grid, shape: Shape, cell: number): number =>
  candidates(grid, shape, cell).reduce((m, d) => m | (1 << (d - 1)), 0);

/**
 * Fill marks for one row of the bed: each empty square with no marks of her own gets every number that still fits.
 * Squares she has marked keep her marks. Returns the squares it filled.
 */
export function fillMarksRow(grid: Grid, shape: Shape, notes: number[], row: number): number[] {
  const size = geo(shape).size,
    filled: number[] = [];
  for (let cell = row * size; cell < (row + 1) * size; cell++) {
    if (grid[cell] || notes[cell]) continue;
    notes[cell] = candidateMask(grid, shape, cell);
    filled.push(cell);
  }
  return filled;
}

/** Fill marks over the whole bed, row by row. */
export function fillMarks(grid: Grid, shape: Shape, notes: number[]): number[] {
  const filled: number[] = [];
  for (let row = 0; row < geo(shape).size; row++) filled.push(...fillMarksRow(grid, shape, notes, row));
  return filled;
}
