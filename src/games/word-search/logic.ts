import type { Rng } from '../../engine/random';
import { BLOCKED } from './blocked';
import { PICTURE_THEMES, THEMES, themeById, type Theme } from './words';
import type { BandLevels } from '../../progress/difficulty';

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
  /** Level 6: the sentence the letters no word uses spell, top row first, left to right (with its spaces). */
  message?: string;
}

/** A stone: an open square the message does not need. It is never part of a word or the message, and it breaks any line through it. */
export const STONE = '#';
/** At most this many stones in a grid, so it stays a search and not a scatter of pebbles. */
export const MAX_STONES = 8;

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
  /** Level 6: the letters left over spell a message, revealed when the last word is found. */
  message?: boolean;
  /**
   * Level 7: the list shows only the theme and a blank for each word, with its length. No other word of the theme can be read in
   * the grid, so every theme word she finds is a hidden one; a line that spells none is free.
   */
  hidden?: boolean;
  /** Level 8 (school): the words are pictures from `PICTURE_THEMES`, and no other picture word can be read in the grid. */
  pictures?: boolean;
  /** At most one word in a row, so words across never run together ("PIGHEN"). */
  oneARow?: boolean;
}

/**
 * The ladder: across and down in a small grid, then slants, then every direction (words read backwards), then a big grid.
 * Level 5 is a gentler way in, appended with a high ID and played first: a 6 by 6 grid of four words, across and down, every
 * square big and the whole grid always in view.
 */
export const PLANS: WordPlan[] = [
  { name: 'An 8 by 8 grid with five words, across and down', size: 8, words: 5, dirs: ALL_DIRS.slice(0, 2), grids: 1 },
  { name: 'A 10 by 10 grid with seven words, including slants', size: 10, words: 7, dirs: ALL_DIRS.slice(0, 3), grids: 1 },
  { name: 'A 12 by 12 grid with nine words, in every direction, even backwards', size: 12, words: 9, dirs: ALL_DIRS, grids: 1 },
  { name: 'A 14 by 14 grid with twelve words, in every direction', size: 14, words: 12, dirs: ALL_DIRS, grids: 1 },
  { name: 'A small 6 by 6 grid with four words, across and down, big letters', size: 6, words: 4, dirs: ALL_DIRS.slice(0, 2), grids: 1 },
  { name: 'An 8 by 8 grid with nine words, across, down and slanting; the letters left over spell a message', size: 8, words: 9, dirs: ALL_DIRS.slice(0, 3), grids: 1, message: true },
  { name: 'A 10 by 10 grid with six hidden words in every direction; the list shows only the theme and how long each word is', size: 10, words: 6, dirs: ALL_DIRS, grids: 1, hidden: true },
  { name: 'A 6 by 6 grid with four picture words, across', size: 6, words: 4, dirs: ALL_DIRS.slice(0, 1), grids: 1, pictures: true, oneARow: true },
];

/** The small grid that starts the ladder, by its ID. */
export const SMALL_GRID = 5;
/** The message grid, by its ID. */
export const MESSAGE_GRID = 6;
/** The grid whose words are hidden behind the theme, by its ID. */
export const HIDDEN_GRID = 7;
/** School's one level: four picture words across a 6 by 6 grid. Not in the grown-up order. */
export const PICTURE_GRID = 8;
/** The grown-up levels easiest first: the small grid, then 1 to 4, then the message in the leftovers, then just the theme. */
export const ORDER = [SMALL_GRID, 1, 2, 3, 4, MESSAGE_GRID, HIDDEN_GRID];

/**
 * Lantern Lake holds it, with touch or a controller. Grown-ups: the small grid (5) comes first, then 1–4, the message grid (6), and
 * just the theme (7) last. School plays one grid of four picture words (8), by touch.
 */
export const LEVELS: BandLevels = { school: { min: PICTURE_GRID, max: PICTURE_GRID }, grownup: { min: 1, max: 7, order: ORDER } };

/** A level's plan; a level past the top plays the last in the grown-up ladder, not the small one. */
export const planFor = (level: number): WordPlan => PLANS[(level > PLANS.length ? ORDER[ORDER.length - 1] : Math.max(1, level)) - 1];

/** Filler letters, weighted a little toward the common ones, so the grid does not look like a list of the listed words' letters. */
const FILL = 'EEEEAAAIIOOUTTNNSSRRLLDDGGBCMPHFWYKV';

/**
 * The plan's number of a theme's words (the longest first, since they are the hardest to fit), each placed somewhere it fits
 * without breaking another, the other squares left empty; null when one does not fit.
 */
function placeWords(plan: WordPlan, theme: Theme, rng: Rng): { letters: string[]; placed: Placed[] } | null {
  const { size } = plan;
  const picked = rng.shuffle([...theme.words].filter((w) => w.length <= size)).slice(0, plan.words).sort((a, b) => b.length - a.length);
  const letters: string[] = Array<string>(size * size).fill('');
  const placed: Placed[] = [];
  for (const word of picked) {
    const spots: Placed[] = [];
    for (let r = 0; r < size; r++)
      for (let c = 0; c < size; c++)
        for (const [dr, dc] of plan.dirs) {
          const er = r + dr * (word.length - 1), ec = c + dc * (word.length - 1);
          if (er < 0 || er >= size || ec < 0 || ec >= size) continue;
          if (plan.oneARow && dr === 0 && placed.some((p) => p.dr === 0 && p.r === r)) continue;
          if ([...word].every((ch, k) => { const have = letters[cellOf(size, r + dr * k, c + dc * k)]; return have === '' || have === ch; })) spots.push({ word, r, c, dr, dc });
        }
    if (!spots.length) return null;
    // Prefer a spot that crosses a word already there, now and then, so the words tangle a little.
    const crossing = spots.filter((s) => [...word].some((_, k) => letters[cellOf(size, s.r + s.dr * k, s.c + s.dc * k)] !== ''));
    const spot = crossing.length && rng.chance(0.5) ? rng.pick(crossing) : rng.pick(spots);
    [...word].forEach((ch, k) => { letters[cellOf(size, spot.r + spot.dr * k, spot.c + spot.dc * k)] = ch; });
    placed.push(spot);
  }
  return { letters, placed };
}

/**
 * A grid for a theme: its words placed (`placeWords`), the rest filled with letters. A grid is kept only if every listed word occurs in
 * it exactly once, so a line that spells a word is always the one the puzzle meant.
 */
export function makeGrid(plan: WordPlan, theme: Theme, rng: Rng): WordGrid {
  if (plan.message) return makeMessageGrid(plan, theme, rng);
  const { size } = plan;
  for (let attempt = 0; attempt < 200; attempt++) {
    const laid = placeWords(plan, theme, rng);
    if (!laid) continue;
    const { letters, placed } = laid;
    // Fill the rest, and if a listed word turns up a second time, or a blocked one, by accident, fill it again: only the filler is
    // redrawn, so the placed words stay where they are.
    const fixed = letters.map((l) => l !== '');
    for (let fill = 0; fill < 60; fill++) {
      for (let i = 0; i < letters.length; i++) if (!fixed[i]) letters[i] = rng.pick([...FILL]);
      if (placed.every((p) => occurrences(size, letters, p.word).length === 1) && !hasBlocked(size, letters, placed.map((p) => p.word)) && (!plan.hidden || !strayThemeWord(size, letters, theme, placed)) && (!plan.pictures || !strayPictureWord(size, letters, placed))) return { size, letters, words: placed, theme: theme.id };
    }
  }
  throw new Error(`could not make a grid for ${plan.name}`);
}

/** Level 7: whether a word of the theme that is not hidden can be read in the grid, so finding it would look right and count for nothing. */
export const strayThemeWord = (size: number, letters: readonly string[], theme: Theme, placed: readonly Placed[]) =>
  theme.words.some((w) => !placed.some((p) => p.word === w) && occurrences(size, letters, w).length > 0);

/** Level 8: whether a picture word of any picture theme, other than those placed, can be read in the grid: a real word she knows would look right and be "wrong". */
export const strayPictureWord = (size: number, letters: readonly string[], placed: readonly Placed[]) =>
  PICTURE_THEMES.some((t) => t.words.some((w) => !placed.some((p) => p.word === w) && occurrences(size, letters, w).length > 0));

/** A message's letters, in the order they fill the open squares. */
export const lettersOf = (message: string) => message.replace(/[^A-Z]/g, '');

/**
 * Level 6's grid: the words placed as in `makeGrid`, then a message picked whose letters
 * fit the squares left open, with a stone on each open square it does not need. The message fills the rest top row first, left
 * to right. Its letters are fixed, so a grid where a listed word turns up twice, or a blocked word can be read, is redrawn by
 * moving the stones, then by placing the words again.
 */
export function makeMessageGrid(plan: WordPlan, theme: Theme, rng: Rng): WordGrid {
  const { size } = plan, messages = theme.messages ?? [];
  if (!messages.length) throw new Error(`${theme.id} has no messages`);
  for (let attempt = 0; attempt < 400; attempt++) {
    const laid = placeWords(plan, theme, rng);
    if (!laid) continue;
    const { letters, placed } = laid;
    const open = letters.flatMap((l, i) => (l === '' ? [i] : []));
    const fits = messages.filter((m) => lettersOf(m).length <= open.length && open.length - lettersOf(m).length <= MAX_STONES);
    if (!fits.length) continue;
    const message = rng.pick(fits), text = lettersOf(message), words = placed.map((p) => p.word);
    for (let tries = 0; tries < 12; tries++) {
      const stones = new Set(rng.shuffle([...open]).slice(0, open.length - text.length));
      let k = 0;
      for (const i of open) letters[i] = stones.has(i) ? STONE : text[k++];
      if (placed.every((p) => occurrences(size, letters, p.word).length === 1) && !hasBlocked(size, letters, words)) return { size, letters, words: placed, theme: theme.id, message };
    }
  }
  throw new Error(`could not make a message grid for ${theme.id}`);
}

/** The letters no word uses, top row first, left to right: the message, once every word is found. Stones are skipped. */
export function leftovers(grid: Pick<WordGrid, 'size' | 'letters' | 'words'>): string {
  const used = new Set(grid.words.flatMap((p) => cellsOfWord(grid.size, p)));
  return grid.letters.filter((l, i) => !used.has(i) && l !== STONE).join('');
}

/** The themes a plan can draw: those with enough words that fit its grid. Every everyday theme fits every plan; a root family fits only the small ones. */
export const themesFor = (plan: Pick<WordPlan, 'size' | 'words' | 'message' | 'hidden' | 'pictures'>): Theme[] =>
  plan.pictures ? PICTURE_THEMES.filter((t) => t.words.length >= plan.words) :
  // A hidden grid asks her to think of the theme's words: an everyday theme, not a root family, which is a short list to learn from.
  THEMES.filter((t) => t.words.filter((w) => w.length <= plan.size).length >= plan.words && (!plan.message || !!t.messages?.length) && (!plan.hidden || !t.root));

export const makeGrids = (plan: WordPlan, rng: Rng): WordGrid[] => Array.from({ length: plan.grids }, () => makeGrid(plan, rng.pick(themesFor(plan)), rng));

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

/**
 * What a checked line is. `found`: a word not found yet. `miss`: no word (or a found word again) on a grid that shows its list. On a
 * hidden grid, where trying a word that might be there is an experiment, `free` is no word and `again` a found word marked once more:
 * neither costs anything.
 */
export type LineResult = { kind: 'found'; word: number } | { kind: 'again'; word: number } | { kind: 'miss' } | { kind: 'free' };

export function judgeLine(grid: WordGrid, line: readonly number[], found: ReadonlySet<number>, hidden = false): LineResult {
  const hit = wordAt(grid, line, found);
  if (hit >= 0) return { kind: 'found', word: hit };
  if (!hidden) return { kind: 'miss' };
  const again = wordAt(grid, line, new Set());
  return again >= 0 ? { kind: 'again', word: again } : { kind: 'free' };
}

/** Level 7: how much a hint has shown of each word. 1: its first letter is in its blank. 2: its start is ringed in the grid too. */
export type ClueStages = ReadonlyMap<number, 1 | 2>;

/** The word a hidden grid's hint is about: the shortest one not found yet (the first in the list among equals). */
export function shortestUnfound(grid: WordGrid, found: ReadonlySet<number>): number {
  let best = -1;
  grid.words.forEach((p, i) => { if (!found.has(i) && (best < 0 || p.word.length < grid.words[best].word.length)) best = i; });
  return best;
}

/**
 * Level 7's hint, two steps a word: first the first letter of the shortest unfound word, in its blank, then the ring on its start in
 * the grid. A word fully hinted and still unfound stays the one the hint is about (it rings again), so the button never goes dead.
 */
export function hiddenHint(grid: WordGrid, found: ReadonlySet<number>, stages: ClueStages): { word: number; stage: 1 | 2; letter: string; cell: number } | null {
  const word = shortestUnfound(grid, found);
  if (word < 0) return null;
  const p = grid.words[word], stage = stages.get(word) ? 2 : 1;
  return { word, stage, letter: p.word[0], cell: cellOf(grid.size, p.r, p.c) };
}

/** A hidden word's entry in the list: a blank for each letter (the first filled once a hint shows it) and its length; the word once found. */
export function blankFor(word: string, found: boolean, stage = 0): string {
  if (found) return word;
  return [...word].map((ch, k) => (k === 0 && stage > 0 ? ch : '_')).join('') + ` (${word.length})`;
}
