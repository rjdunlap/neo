import type { Rng } from '../../engine/random';
import type { BandLevels } from '../../progress/difficulty';

/**
 * A flower bed is a grid, square except One row's single row; each cell holds a flower (0 to size - 1) or nothing yet
 * (null). The numbers are the bed's own flowers: the puzzle's `kinds` says which of the five each one is drawn and named as.
 */
export type Bed = (number | null)[][];

/** `rows`: each row needs one of every flower. `both`: each column does too. `boxes`: and each hedge box (a 2 by 2 on a 4 by 4 bed). */
export type Rule = 'rows' | 'both' | 'boxes';

export interface RowsPlan {
  /** For grown-ups. */
  name: string;
  /** Columns and kinds of flower, and rows too unless `rows` says otherwise. */
  size: number;
  /** One row: a bed of a single row (rows-only), with one empty spot that moves from bed to bed. */
  rows?: number;
  rule: Rule;
  /** Empty spots in a fresh bed. A rows-only bed has one in each row, so this is `size`. */
  blanks: number;
  /** Beds in one round. */
  beds: number;
  /** Mend the bed: every spot starts planted and hers to lift, with two flowers in one row swapped; `blanks` is 0. */
  mend?: boolean;
}

/** The ladder: one missing flower per row, then columns too, then bigger beds with fewer flowers to start. */
export const PLANS: RowsPlan[] = [
  { name: 'Plant the missing flower in each row of a 3 by 3 bed', size: 3, rule: 'rows', blanks: 3, beds: 2 },
  { name: 'Rows and columns: no flower repeats in a row or a column (3 by 3)', size: 3, rule: 'both', blanks: 4, beds: 2 },
  { name: 'A 4 by 4 bed with a few flowers missing', size: 4, rule: 'both', blanks: 6, beds: 2 },
  { name: 'A 4 by 4 bed with more flowers to work out', size: 4, rule: 'both', blanks: 9, beds: 2 },
  { name: 'A 4 by 4 bed with only a few flowers planted to start', size: 4, rule: 'both', blanks: 11, beds: 1 },
  { name: 'A 5 by 5 bed: rows and columns, five kinds of flower', size: 5, rule: 'both', blanks: 14, beds: 1 },
  { name: 'Mend the bed: two flowers in one row swapped places; find them and swap them back (4 by 4)', size: 4, rule: 'both', blanks: 0, beds: 2, mend: true },
  { name: 'Hedge boxes: no flower repeats in a row, a column or a 2 by 2 hedge box (4 by 4)', size: 4, rule: 'boxes', blanks: 6, beds: 2 },
  { name: 'Hedge boxes with fewer flowers to start (4 by 4, ten spots empty)', size: 4, rule: 'boxes', blanks: 10, beds: 1 },
  { name: 'One row of three flowers: plant the missing one (three rows in turn)', size: 3, rows: 1, rule: 'rows', blanks: 1, beds: 3 },
];

export const LEVELS: BandLevels = {
  // One row (10) opens preschool, then the 3 by 3 rows-only bed.
  preschool: { min: 1, max: 10, order: [10, 1] },
  prek: { min: 1, max: 3 },
  school: { min: 3, max: 9 },
};

/** How many rows the plan's beds have. */
export const rowsOf = (plan: RowsPlan) => plan.rows ?? plan.size;

export const planFor = (level: number): RowsPlan => PLANS[Math.min(PLANS.length, Math.max(1, level)) - 1];

/** Spoken names of the flowers, in the order the palette shows them. Every name takes "a". */
export const FLOWER_NAMES = ['daisy', 'tulip', 'rose', 'bluebell', 'sunflower'] as const;

/** The side of a hedge box: 2 on a 4 by 4 bed. */
export const boxSide = (size: number) => Math.round(Math.sqrt(size));

/** Whether (r1, c1) and (r2, c2) share a hedge box. */
export const sameBox = (size: number, r1: number, c1: number, r2: number, c2: number) => {
  const b = boxSide(size);
  return Math.floor(r1 / b) === Math.floor(r2 / b) && Math.floor(c1 / b) === Math.floor(c2 / b);
};

/** Every spot in the hedge box around (r, c), (r, c) itself included. */
export function boxSpots(size: number, r: number, c: number): { r: number; c: number }[] {
  const b = boxSide(size);
  const r0 = r - (r % b);
  const c0 = c - (c % b);
  return Array.from({ length: b * b }, (_, i) => ({ r: r0 + Math.floor(i / b), c: c0 + (i % b) }));
}

export const emptyBed = (size: number, rows = size): Bed => Array.from({ length: rows }, () => Array<number | null>(size).fill(null));
export const copyBed = (bed: Bed): Bed => bed.map((row) => [...row]);

/** Which flowers can still go in a spot without repeating one already in its row (or column, or hedge box). */
export function candidates(bed: Bed, rule: Rule, r: number, c: number): number[] {
  const n = bed[r].length;
  const used = new Set<number>();
  for (let i = 0; i < n; i++) if (i !== c && bed[r][i] !== null) used.add(bed[r][i]!);
  if (rule !== 'rows') for (let i = 0; i < bed.length; i++) if (i !== r && bed[i][c] !== null) used.add(bed[i][c]!);
  if (rule === 'boxes') for (const s of boxSpots(n, r, c)) if ((s.r !== r || s.c !== c) && bed[s.r][s.c] !== null) used.add(bed[s.r][s.c]!);
  return Array.from({ length: n }, (_, f) => f).filter((f) => !used.has(f));
}

/**
 * The flower that stops `flower` going at (r, c): the same kind already in its row or column, else (with hedges) in its
 * box. A box clash is named only when the repeat shares neither the row nor the column, so the line she hears is the new rule.
 */
export function clash(bed: Bed, rule: Rule, r: number, c: number, flower: number): { by: 'row' | 'column' | 'box'; r: number; c: number } | null {
  const n = bed[r].length;
  // Row and column together, nearest index first, as the square bed has always named them.
  for (let i = 0; i < Math.max(n, bed.length); i++) {
    if (i < n && i !== c && bed[r][i] === flower) return { by: 'row', r, c: i };
    if (rule !== 'rows' && i < bed.length && i !== r && bed[i][c] === flower) return { by: 'column', r: i, c };
  }
  if (rule === 'boxes') for (const s of boxSpots(n, r, c)) if (s.r !== r && s.c !== c && bed[s.r][s.c] === flower) return { by: 'box', ...s };
  return null;
}

/** Empty spots where no flower fits any more: the bed cannot be finished without taking something out. */
export function deadEnds(bed: Bed, rule: Rule): { r: number; c: number }[] {
  const out: { r: number; c: number }[] = [];
  bed.forEach((row, r) => row.forEach((v, c) => { if (v === null && candidates(bed, rule, r, c).length === 0) out.push({ r, c }); }));
  return out;
}

export const isFull = (bed: Bed) => bed.every((row) => row.every((v) => v !== null));

/** A full bed with no repeat in any row (or column). */
export function isSolved(bed: Bed, rule: Rule): boolean {
  if (!isFull(bed)) return false;
  return bed.every((row, r) => row.every((v, c) => clash(bed, rule, r, c, v!) === null));
}

/** How many ways the bed can be finished, counting no further than `limit`. */
export function countSolutions(bed: Bed, rule: Rule, limit = 2): number {
  const work = copyBed(bed);
  let found = 0;
  const go = () => {
    if (found >= limit) return;
    // Work on the emptiest-choice spot first, which keeps this quick on 5 by 5.
    let best: { r: number; c: number; options: number[] } | null = null;
    for (let r = 0; r < work.length; r++)
      for (let c = 0; c < work[r].length; c++) {
        if (work[r][c] !== null) continue;
        const options = candidates(work, rule, r, c);
        if (!best || options.length < best.options.length) best = { r, c, options };
      }
    if (!best) return void found++;
    for (const f of best.options) {
      work[best.r][best.c] = f;
      go();
      work[best.r][best.c] = null;
      if (found >= limit) return;
    }
  };
  go();
  return found;
}

/** The finished bed for a puzzle with exactly one solution. */
export function solve(bed: Bed, rule: Rule): Bed | null {
  const work = copyBed(bed);
  const go = (): boolean => {
    let best: { r: number; c: number; options: number[] } | null = null;
    for (let r = 0; r < work.length; r++)
      for (let c = 0; c < work[r].length; c++) {
        if (work[r][c] !== null) continue;
        const options = candidates(work, rule, r, c);
        if (!best || options.length < best.options.length) best = { r, c, options };
      }
    if (!best) return true;
    for (const f of best.options) {
      work[best.r][best.c] = f;
      if (go()) return true;
      work[best.r][best.c] = null;
    }
    return false;
  };
  return go() ? work : null;
}

/**
 * A random full bed with every flower once in each row and column: a shuffled cyclic square. With hedges the rows are
 * shifted by 0, b, 1, b + 1 … (0, 2, 1, 3 on a 4 by 4), which also fills every box, then shuffled only in ways that keep the
 * boxes: bands of rows, rows inside a band, stacks of columns, columns inside a stack, and the flowers themselves.
 */
export function fullBed(size: number, rule: Rule, rng: Rng, height = size): Bed {
  if (rule === 'rows') return Array.from({ length: height }, () => rng.shuffle(Array.from({ length: size }, (_, f) => f)));
  if (rule === 'boxes') {
    const b = boxSide(size);
    const order = () => rng.shuffle(Array.from({ length: b }, (_, i) => i)).flatMap((band) => rng.shuffle(Array.from({ length: b }, (_, i) => band * b + i)));
    const rows = order();
    const cols = order();
    const kinds = rng.shuffle(Array.from({ length: size }, (_, i) => i));
    const shift = (r: number) => (r % b) * b + Math.floor(r / b);
    return rows.map((r) => cols.map((c) => kinds[(shift(r) + c) % size]));
  }
  const rows = rng.shuffle(Array.from({ length: size }, (_, i) => i));
  const cols = rng.shuffle(Array.from({ length: size }, (_, i) => i));
  const kinds = rng.shuffle(Array.from({ length: size }, (_, i) => i));
  return rows.map((r) => cols.map((c) => kinds[(r + c) % size]));
}

export interface Puzzle {
  /** What the bed shows to start: planted flowers and empty spots. */
  start: Bed;
  /** The one way to finish it (for Mend the bed, the bed before the swap; any bed with no repeat is accepted). */
  solution: Bed;
  /** Which of the five flowers the bed's 0 to size - 1 are, in palette order: the packets show these. */
  kinds: number[];
}

/** `size` of the five flowers, chosen by the seed and listed in palette order. */
export const chooseKinds = (size: number, rng: Rng): number[] =>
  rng.shuffle(Array.from({ length: FLOWER_NAMES.length }, (_, f) => f)).slice(0, size).sort((a, b) => a - b);

/** Mend the bed: a full bed with two flowers in one row swapped, so each of their two columns holds a repeat. */
export function makeMend(plan: RowsPlan, rng: Rng): Puzzle {
  const kinds = chooseKinds(plan.size, rng);
  const solution = fullBed(plan.size, 'both', rng);
  const start = copyBed(solution);
  const r = rng.int(0, plan.size - 1);
  const [a, b] = rng.shuffle(Array.from({ length: plan.size }, (_, i) => i));
  [start[r][a], start[r][b]] = [start[r][b], start[r][a]];
  return { start, solution, kinds };
}

/**
 * A bed with exactly the plan's number of empty spots and exactly one way to finish it. A rows-only bed leaves
 * one spot in each row; a rows-and-columns bed takes flowers out in random order, keeping each removal only if
 * the bed can still be finished one way.
 */
export function makePuzzle(plan: RowsPlan, rng: Rng): Puzzle {
  if (plan.mend) return makeMend(plan, rng);
  const kinds = chooseKinds(plan.size, rng);
  for (let attempt = 0; attempt < 60; attempt++) {
    const solution = fullBed(plan.size, plan.rule, rng, rowsOf(plan));
    const start = copyBed(solution);
    if (plan.rule === 'rows') {
      for (let r = 0; r < start.length; r++) start[r][rng.int(0, plan.size - 1)] = null;
      return { start, solution, kinds };
    }
    const spots = rng.shuffle(Array.from({ length: plan.size * plan.size }, (_, i) => ({ r: Math.floor(i / plan.size), c: i % plan.size })));
    let blanks = 0;
    for (const { r, c } of spots) {
      if (blanks >= plan.blanks) break;
      const was = start[r][c];
      start[r][c] = null;
      if (countSolutions(start, plan.rule) === 1) blanks++;
      else start[r][c] = was;
    }
    if (blanks === plan.blanks) return { start, solution, kinds };
  }
  throw new Error(`could not make a bed with ${plan.blanks} empty spots for ${plan.name}`);
}

/** A round's beds. In One row the empty spot moves: each bed's gap is a different spot, in shuffled order, while there are spots to go round. */
export function makeBeds(plan: RowsPlan, rng: Rng): Puzzle[] {
  const beds = Array.from({ length: plan.beds }, () => makePuzzle(plan, rng));
  if (rowsOf(plan) !== 1) return beds;
  let gaps: number[] = [];
  return beds.map(({ solution, kinds }) => {
    if (!gaps.length) gaps = rng.shuffle(Array.from({ length: plan.size }, (_, c) => c));
    const gap = gaps.pop()!;
    return { start: [solution[0].map((v, c) => (c === gap ? null : v))], solution, kinds };
  });
}

export type Hint =
  /** A flower the child planted that is not part of the way to finish: try another here. */
  | { kind: 'fix'; r: number; c: number }
  /** An empty spot with only one flower that fits. */
  | { kind: 'plant'; r: number; c: number; flower: number };

/**
 * Where a hint should point. First a planted flower that does not belong (taking it out is the way forward);
 * otherwise the empty spot with the fewest choices, which a careful look at its row and column can decide.
 */
export function hintFor(bed: Bed, given: boolean[][], solution: Bed, rule: Rule): Hint | null {
  for (let r = 0; r < bed.length; r++)
    for (let c = 0; c < bed[r].length; c++) if (!given[r][c] && bed[r][c] !== null && bed[r][c] !== solution[r][c]) return { kind: 'fix', r, c };
  let best: { r: number; c: number; options: number } | null = null;
  for (let r = 0; r < bed.length; r++)
    for (let c = 0; c < bed[r].length; c++) {
      if (bed[r][c] !== null) continue;
      const options = candidates(bed, rule, r, c).length;
      if (!best || options < best.options) best = { r, c, options };
    }
  return best ? { kind: 'plant', r: best.r, c: best.c, flower: solution[best.r][best.c]! } : null;
}

/**
 * The planting a capable child does next: the empty spot with the fewest flowers that fit (a spot with one choice, if there
 * is one), planted with the flower of the one way to finish. Among equally tight spots it prefers one that takes the packet
 * already chosen, so the seeds are not swapped more than needed. Null when the bed is full.
 */
export function nextPlanting(bed: Bed, solution: Bed, rule: Rule, selected: number): { r: number; c: number; flower: number } | null {
  let best: { r: number; c: number; flower: number; key: number } | null = null;
  for (let r = 0; r < bed.length; r++)
    for (let c = 0; c < bed[r].length; c++) {
      if (bed[r][c] !== null) continue;
      const flower = solution[r][c]!;
      const key = candidates(bed, rule, r, c).length * 2 + (flower === selected ? 0 : 1);
      if (!best || key < best.key) best = { r, c, flower, key };
    }
  return best && { r: best.r, c: best.c, flower: best.flower };
}

/** Every planted spot that repeats a flower in its row (or column). */
export function clashing(bed: Bed, rule: Rule): { r: number; c: number }[] {
  const out: { r: number; c: number }[] = [];
  bed.forEach((row, r) => row.forEach((v, c) => { if (v !== null && clash(bed, rule, r, c, v)) out.push({ r, c }); }));
  return out;
}

/**
 * The bed a Mend the bed hint leads to: her bed with every repeating flower cleared, finished one way, so a repair she has
 * already begun is kept; the bed before the swap when her flowers leave no way to finish.
 */
export function mendTarget(bed: Bed, rule: Rule, solution: Bed): Bed {
  const open = copyBed(bed);
  for (const { r, c } of clashing(bed, rule)) open[r][c] = null;
  return solve(open, rule) ?? solution;
}

/** The ghost finger's next move toward `target`: lift a flower that differs from it, else plant as `nextPlanting` does. */
export function nextMove(
  bed: Bed, given: boolean[][], target: Bed, rule: Rule, selected: number,
): { lift: true; r: number; c: number } | { lift: false; r: number; c: number; flower: number } | null {
  for (let r = 0; r < bed.length; r++)
    for (let c = 0; c < bed[r].length; c++) if (!given[r][c] && bed[r][c] !== null && bed[r][c] !== target[r][c]) return { lift: true, r, c };
  const step = nextPlanting(bed, target, rule, selected);
  return step && { lift: false, ...step };
}
