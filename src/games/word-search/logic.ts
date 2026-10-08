import type { Rng } from '../../engine/random';
import { BLOCKED } from './blocked';
import { THEMES, themeById, type Theme } from './words';

/**
 * Word Search's rules. A grid of letters hides a list of words, each in a straight line, read forwards or (on the harder
 * levels) backwards, across, down or on a slant. To find one, mark its first and last letter; the line between them is checked
 * against the list. A grid is a flat array of capital letters, row by row.
 */
export type Dir = readonly [dr: number, dc: number];

/** Right, down, down-right, down-left, then the four reversed. */
export const ALL_DIRS: readonly Dir[] = [[0, 1], [1, 0], [1, 1], [1, -1], [0, -1], [-1, 0], [-1, -1], [-1, 1]];

export interface Placed {
  word: string;
  /** Row and column of the first letter, and the step to the next. */
  r: number;
  c: number;
  dr: number;
  dc: number;
}

export interface WordGrid {
  size: number;
  letters: readonly string[];
  words: readonly Placed[];
  theme: string;
}

export const cellOf = (size: number, r: number, c: number) => r * size + c;

/** The squares of a line from one square to another, both ends included, or null if the two do not lie on a straight line. */
export function lineBetween(size: number, a: number, b: number): number[] | null {
  const ar = Math.floor(a / size), ac = a % size, br = Math.floor(b / size), bc = b % size;
  const dr = br - ar, dc = bc - ac;
  if (dr !== 0 && dc !== 0 && Math.abs(dr) !== Math.abs(dc)) return null;
  const n = Math.max(Math.abs(dr), Math.abs(dc));
  const sr = Math.sign(dr), sc = Math.sign(dc);
  return Array.from({ length: n + 1 }, (_, k) => cellOf(size, ar + sr * k, ac + sc * k));
}

export const textOf = (grid: Pick<WordGrid, 'letters'>, cells: readonly number[]) => cells.map((c) => grid.letters[c]).join('');

/** The squares a placed word covers, first letter to last. */
export const cellsOfWord = (size: number, p: Placed): number[] => Array.from({ length: p.word.length }, (_, k) => cellOf(size, p.r + p.dr * k, p.c + p.dc * k));

/** Which word a marked line spells, read either way, among those not found yet: its index, or -1. */
export function wordAt(grid: WordGrid, line: readonly number[], found: ReadonlySet<number>): number {
  const text = textOf(grid, line), back = [...text].reverse().join('');
  return grid.words.findIndex((p, i) => !found.has(i) && (p.word === text || p.word === back));
}

/** Every place a word can be read in the grid, in any of the eight directions: where it really is, and anywhere by accident. */
export function occurrences(size: number, letters: readonly string[], word: string): Placed[] {
  const out: Placed[] = [];
  for (let r = 0; r < size; r++)
    for (let c = 0; c < size; c++)
      for (const [dr, dc] of ALL_DIRS) {
        const er = r + dr * (word.length - 1), ec = c + dc * (word.length - 1);
        if (er < 0 || er >= size || ec < 0 || ec >= size) continue;
        if ([...word].every((ch, k) => letters[cellOf(size, r + dr * k, c + dc * k)] === ch)) out.push({ word, r, c, dr, dc });
      }
  return out;
}

/** Whether a word that must never appear can be read in the grid. A word that is one of the listed words is not counted against it. */
export const hasBlocked = (size: number, letters: readonly string[], listed: readonly string[] = []) => BLOCKED.some((w) => !listed.includes(w) && occurrences(size, letters, w).length > 0);

export interface WordPlan {
  /** For grown-ups. */
  name: string;
  size: number;
  words: number;
  /** The directions words may run. */
  dirs: readonly Dir[];
  /** Grids in one round. */
  grids: number;
}

/** The ladder: across and down in a small grid, then slants, then every direction (words read backwards), then a big grid. */
export const PLANS: WordPlan[] = [
  { name: 'An 8 by 8 grid with five words, across and down', size: 8, words: 5, dirs: ALL_DIRS.slice(0, 2), grids: 1 },
  { name: 'A 10 by 10 grid with seven words, including slants', size: 10, words: 7, dirs: ALL_DIRS.slice(0, 3), grids: 1 },
  { name: 'A 12 by 12 grid with nine words, in every direction, even backwards', size: 12, words: 9, dirs: ALL_DIRS, grids: 1 },
  { name: 'A 14 by 14 grid with twelve words, in every direction', size: 14, words: 12, dirs: ALL_DIRS, grids: 1 },
];

export const planFor = (level: number): WordPlan => PLANS[Math.min(PLANS.length, Math.max(1, level)) - 1];

/** Filler letters, weighted a little toward the common ones, so the grid does not look like a list of the listed words' letters. */
const FILL = 'EEEEAAAIIOOUTTNNSSRRLLDDGGBCMPHFWYKV';

/**
 * A grid for a theme: the plan's number of its words (the longest first, since they are the hardest to fit), each placed
 * somewhere it fits without breaking another, the rest filled with letters. A grid is kept only if every listed word occurs in
 * it exactly once, so a line that spells a word is always the one the puzzle meant.
 */
export function makeGrid(plan: WordPlan, theme: Theme, rng: Rng): WordGrid {
  const { size } = plan;
  for (let attempt = 0; attempt < 200; attempt++) {
    const picked = rng.shuffle([...theme.words].filter((w) => w.length <= size)).slice(0, plan.words).sort((a, b) => b.length - a.length);
    const letters: string[] = Array<string>(size * size).fill('');
    const placed: Placed[] = [];
    let ok = true;
    for (const word of picked) {
      const spots: Placed[] = [];
      for (let r = 0; r < size; r++)
        for (let c = 0; c < size; c++)
          for (const [dr, dc] of plan.dirs) {
            const er = r + dr * (word.length - 1), ec = c + dc * (word.length - 1);
            if (er < 0 || er >= size || ec < 0 || ec >= size) continue;
            if ([...word].every((ch, k) => { const have = letters[cellOf(size, r + dr * k, c + dc * k)]; return have === '' || have === ch; })) spots.push({ word, r, c, dr, dc });
          }
      if (!spots.length) { ok = false; break; }
      // Prefer a spot that crosses a word already there, now and then, so the words tangle a little.
      const crossing = spots.filter((s) => [...word].some((_, k) => letters[cellOf(size, s.r + s.dr * k, s.c + s.dc * k)] !== ''));
      const spot = crossing.length && rng.chance(0.5) ? rng.pick(crossing) : rng.pick(spots);
      [...word].forEach((ch, k) => { letters[cellOf(size, spot.r + spot.dr * k, spot.c + spot.dc * k)] = ch; });
      placed.push(spot);
    }
    if (!ok) continue;
    // Fill the rest, and if a listed word turns up a second time, or a blocked one, by accident, fill it again: only the filler is
    // redrawn, so the placed words stay where they are.
    const fixed = letters.map((l) => l !== '');
    for (let fill = 0; fill < 60; fill++) {
      for (let i = 0; i < letters.length; i++) if (!fixed[i]) letters[i] = rng.pick([...FILL]);
      if (placed.every((p) => occurrences(size, letters, p.word).length === 1) && !hasBlocked(size, letters, placed.map((p) => p.word))) return { size, letters, words: placed, theme: theme.id };
    }
  }
  throw new Error(`could not make a grid for ${plan.name}`);
}

export const makeGrids = (plan: WordPlan, rng: Rng): WordGrid[] => Array.from({ length: plan.grids }, () => makeGrid(plan, rng.pick([...THEMES]), rng));

/** A grid from its picture (rows of letters) and a theme's word list: where each word is found by looking. */
export function parseGrid(rows: readonly string[], themeId: string, words: readonly string[]): WordGrid {
  const size = rows.length;
  if (rows.some((r) => r.length !== size)) throw new Error('a grid is a square');
  const letters = rows.join('').split('');
  const placed = words.map((word) => {
    const found = occurrences(size, letters, word);
    if (found.length !== 1) throw new Error(`${word} must be in the grid exactly once, not ${found.length} times`);
    return found[0];
  });
  return { size, letters, words: placed, theme: themeId };
}

export const rowsOf = (grid: Pick<WordGrid, 'size' | 'letters'>): string[] => Array.from({ length: grid.size }, (_, r) => grid.letters.slice(r * grid.size, r * grid.size + grid.size).join(''));

/**
 * Where a hint should point: the first letter of a word not found yet, preferring the one nearest the cursor. The word is
 * named, so a hint tells which word to look for and where it begins.
 */
export function hintFor(grid: WordGrid, found: ReadonlySet<number>, near = 0): { word: number; cell: number } | null {
  const dist = (c: number) => Math.abs(Math.floor(c / grid.size) - Math.floor(near / grid.size)) + Math.abs((c % grid.size) - (near % grid.size));
  let best: { word: number; cell: number } | null = null;
  grid.words.forEach((p, i) => {
    if (found.has(i)) return;
    const cell = cellOf(grid.size, p.r, p.c);
    if (!best || dist(cell) < dist(best.cell)) best = { word: i, cell };
  });
  return best;
}

export { themeById };
