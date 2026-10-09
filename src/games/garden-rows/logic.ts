import type { Rng } from '../../engine/random';

/** A flower bed is a square grid; each cell holds a flower (0 to size - 1) or nothing yet (null). */
export type Bed = (number | null)[][];

/** `rows`: each row needs one of every flower. `both`: each column does too. */
export type Rule = 'rows' | 'both';

export interface RowsPlan {
  /** For grown-ups. */
  name: string;
  /** Rows, columns and kinds of flower. */
  size: number;
  rule: Rule;
  /** Empty spots in a fresh bed. A rows-only bed has one in each row, so this is `size`. */
  blanks: number;
  /** Beds in one round. */
  beds: number;
}

/** The ladder: one missing flower per row, then columns too, then bigger beds with fewer flowers to start. */
export const PLANS: RowsPlan[] = [
  { name: 'Plant the missing flower in each row of a 3 by 3 bed', size: 3, rule: 'rows', blanks: 3, beds: 2 },
  { name: 'Rows and columns: no flower repeats in a row or a column (3 by 3)', size: 3, rule: 'both', blanks: 4, beds: 2 },
  { name: 'A 4 by 4 bed with a few flowers missing', size: 4, rule: 'both', blanks: 6, beds: 2 },
  { name: 'A 4 by 4 bed with more flowers to work out', size: 4, rule: 'both', blanks: 9, beds: 2 },
  { name: 'A 4 by 4 bed with only a few flowers planted to start', size: 4, rule: 'both', blanks: 11, beds: 1 },
  { name: 'A 5 by 5 bed: rows and columns, five kinds of flower', size: 5, rule: 'both', blanks: 14, beds: 1 },
];

export const planFor = (level: number): RowsPlan => PLANS[Math.min(PLANS.length, Math.max(1, level)) - 1];

/** Spoken names of the flowers, in the order the palette shows them. Every name takes "a". */
export const FLOWER_NAMES = ['daisy', 'tulip', 'rose', 'bluebell', 'sunflower'] as const;

export const emptyBed = (size: number): Bed => Array.from({ length: size }, () => Array<number | null>(size).fill(null));
export const copyBed = (bed: Bed): Bed => bed.map((row) => [...row]);

/** Which flowers can still go in a spot without repeating one already in its row (or column). */
export function candidates(bed: Bed, rule: Rule, r: number, c: number): number[] {
  const n = bed.length;
  const used = new Set<number>();
  for (let i = 0; i < n; i++) {
    if (i !== c && bed[r][i] !== null) used.add(bed[r][i]!);
    if (rule === 'both' && i !== r && bed[i][c] !== null) used.add(bed[i][c]!);
  }
  return Array.from({ length: n }, (_, f) => f).filter((f) => !used.has(f));
}

/** The flower that stops `flower` going at (r, c): the same kind already in its row or column. */
export function clash(bed: Bed, rule: Rule, r: number, c: number, flower: number): { by: 'row' | 'column'; r: number; c: number } | null {
  const n = bed.length;
  for (let i = 0; i < n; i++) {
    if (i !== c && bed[r][i] === flower) return { by: 'row', r, c: i };
    if (rule === 'both' && i !== r && bed[i][c] === flower) return { by: 'column', r: i, c };
  }
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
      for (let c = 0; c < work.length; c++) {
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
      for (let c = 0; c < work.length; c++) {
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

/** A random full bed with every flower once in each row and column: a shuffled cyclic square. */
export function fullBed(size: number, rule: Rule, rng: Rng): Bed {
  if (rule === 'rows') return Array.from({ length: size }, () => rng.shuffle(Array.from({ length: size }, (_, f) => f)));
  const rows = rng.shuffle(Array.from({ length: size }, (_, i) => i));
  const cols = rng.shuffle(Array.from({ length: size }, (_, i) => i));
  const kinds = rng.shuffle(Array.from({ length: size }, (_, i) => i));
  return rows.map((r) => cols.map((c) => kinds[(r + c) % size]));
}

export interface Puzzle {
  /** What the bed shows to start: planted flowers and empty spots. */
  start: Bed;
  /** The one way to finish it. */
  solution: Bed;
}

/**
 * A bed with exactly the plan's number of empty spots and exactly one way to finish it. A rows-only bed leaves
 * one spot in each row; a rows-and-columns bed takes flowers out in random order, keeping each removal only if
 * the bed can still be finished one way.
 */
export function makePuzzle(plan: RowsPlan, rng: Rng): Puzzle {
  for (let attempt = 0; attempt < 60; attempt++) {
    const solution = fullBed(plan.size, plan.rule, rng);
    const start = copyBed(solution);
    if (plan.rule === 'rows') {
      for (let r = 0; r < plan.size; r++) start[r][rng.int(0, plan.size - 1)] = null;
      return { start, solution };
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
    if (blanks === plan.blanks) return { start, solution };
  }
  throw new Error(`could not make a bed with ${plan.blanks} empty spots for ${plan.name}`);
}

export const makeBeds = (plan: RowsPlan, rng: Rng): Puzzle[] => Array.from({ length: plan.beds }, () => makePuzzle(plan, rng));

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
    for (let c = 0; c < bed.length; c++) if (!given[r][c] && bed[r][c] !== null && bed[r][c] !== solution[r][c]) return { kind: 'fix', r, c };
  let best: { r: number; c: number; options: number } | null = null;
  for (let r = 0; r < bed.length; r++)
    for (let c = 0; c < bed.length; c++) {
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
    for (let c = 0; c < bed.length; c++) {
      if (bed[r][c] !== null) continue;
      const flower = solution[r][c]!;
      const key = candidates(bed, rule, r, c).length * 2 + (flower === selected ? 0 : 1);
      if (!best || key < best.key) best = { r, c, flower, key };
    }
  return best && { r: best.r, c: best.c, flower: best.flower };
}
