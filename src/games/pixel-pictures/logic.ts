import type { ColorName } from '../../art/palette';
import type { Rng } from '../../engine/random';

/**
 * Pixel Pictures: tap squares on a grid to make a picture. First copy a small picture shown
 * beside the grid, then copy one with two colors, then finish a picture's mirror half, and finally
 * solve picture-logic puzzles (nonograms) from the numbers along each row and column.
 *
 * Pictures are authored as rows of characters: '.' is empty, letters are palette colors.
 */
export type PixelMode = 'copy' | 'mirror' | 'clues';

export interface PixelPlan {
  mode: PixelMode;
  size: 4 | 5 | 6;
  /** Copy levels: pictures may use two colors. */
  colors: 1 | 2;
  pictures: number;
  name: string;
}

export const PLANS: PixelPlan[] = [
  { mode: 'copy', size: 4, colors: 1, pictures: 3, name: 'Copy a small picture on a 4 by 4 grid' },
  { mode: 'copy', size: 5, colors: 2, pictures: 3, name: 'Copy a two-color picture: pick a color, then tap squares' },
  { mode: 'mirror', size: 6, colors: 1, pictures: 2, name: 'Finish the other half: make both sides match like a mirror' },
  { mode: 'clues', size: 5, colors: 1, pictures: 2, name: 'Picture logic: the numbers say how many squares in a row are filled' },
  { mode: 'clues', size: 6, colors: 1, pictures: 2, name: 'Bigger picture logic: 6 by 6, with numbers for runs like "2 1"' },
];

export const planFor = (level: number) => PLANS[Math.min(PLANS.length, Math.max(1, level)) - 1];

export const LETTERS: Record<string, ColorName> = { r: 'red', o: 'orange', y: 'yellow', g: 'green', b: 'blue', p: 'pink', u: 'purple', n: 'brown' };

export interface Picture {
  name: string;
  rows: string[];
}

export const PICTURES: Record<4 | 5 | 6, Picture[]> = {
  4: [
    { name: 'a heart', rows: ['r.r.', 'rrrr', 'rrrr', '.rr.'].map((r) => r) },
    { name: 'a little tree', rows: ['.gg.', 'gggg', '.gg.', '.nn.'].map((r) => r.replace(/n/g, 'g')) },
    { name: 'a smile', rows: ['y..y', '....', 'y..y', '.yy.'] },
    { name: 'a boat', rows: ['.b..', '.bb.', 'bbbb', '.bb.'] },
    { name: 'a plus', rows: ['.u..', 'uuu.', '.u..', '....'] },
  ],
  5: [
    { name: 'a flower', rows: ['.p.p.', 'ppypp', '.ppp.', '..g..', '.ggg.'] },
    { name: 'a fish', rows: ['.bb..', 'bbbbo', 'bbbb.', '.bb.o', '.....'] },
    { name: 'a house', rows: ['..r..', '.rrr.', 'rrrrr', '.n.n.', '.nnn.'] },
    { name: 'a tree', rows: ['.ggg.', 'ggggg', '.ggg.', '..n..', '..n..'] },
    { name: 'an ice pop', rows: ['.ppp.', '.ppp.', '.yyy.', '..n..', '..n..'] },
  ],
  6: [
    { name: 'a butterfly', rows: ['u....u', 'uu..uu', 'uuuuuu', 'uuuuuu', 'uu..uu', 'u....u'] },
    { name: 'a heart', rows: ['.rr.rr', 'rrrrrr', 'rrrrrr', '.rrrr.', '..rr..', '......'] },
    { name: 'a rocket', rows: ['..bb..', '.bbbb.', '.bbbb.', '.bbbb.', 'bbbbbb', 'b.bb.b'] },
    { name: 'a cat face', rows: ['o....o', 'oo..oo', 'oooooo', 'o.oo.o', 'oooooo', '.oooo.'] },
    { name: 'a crown', rows: ['y.yy.y', 'yyyyyy', 'yyyyyy', 'yyyyyy', '......', '......'] },
  ],
};

/** Grid cells as color letters or null. */
export type Grid = (string | null)[][];

export const toGrid = (p: Picture): Grid => p.rows.map((r) => r.split('').map((c) => (c === '.' ? null : c)));

/** Colors a picture uses. */
export const colorsOf = (p: Picture) => [...new Set(p.rows.join('').replace(/\./g, ''))];

/** Pictures that fit a level: one color or exactly two for copying, one-color and left–right symmetric for mirror levels, logic-solvable for clue levels. */
export function picturesFor(plan: PixelPlan): Picture[] {
  return PICTURES[plan.size].filter((p) => {
    const n = colorsOf(p).length;
    if (plan.mode === 'copy') return plan.colors === 2 ? n === 2 : n === 1;
    if (plan.mode === 'mirror') return n === 1 && symmetric(p);
    // Logic puzzles only ask filled or empty, so any picture works if logic alone can solve it.
    return lineSolvable(p);
  });
}

export function makePictures(plan: PixelPlan, rng: Rng): Picture[] {
  return rng.shuffle(picturesFor(plan)).slice(0, plan.pictures);
}

export const symmetric = (p: Picture) => p.rows.every((r) => r === r.split('').reverse().join(''));

/** Mirror levels: the left half is drawn already; the child fills the right half. */
export const givenInMirror = (size: number, col: number) => col < size / 2;

/** Run lengths of filled cells along a line, e.g. "XX.X" → [2, 1]; an empty line is [0]. */
export function runs(line: boolean[]): number[] {
  const out: number[] = [];
  let n = 0;
  for (const f of line) {
    if (f) n++;
    else if (n) out.push(n), (n = 0);
  }
  if (n) out.push(n);
  return out.length ? out : [0];
}

export function clues(p: Picture): { rows: number[][]; cols: number[][] } {
  const g = toGrid(p).map((r) => r.map((c) => c !== null));
  return { rows: g.map(runs), cols: g[0].map((_, x) => runs(g.map((r) => r[x]))) };
}

/** Every way to place these runs on a line of `n` cells. */
function placements(n: number, clue: number[]): boolean[][] {
  if (clue.length === 1 && clue[0] === 0) return [Array(n).fill(false)];
  const out: boolean[][] = [];
  const place = (i: number, start: number, line: boolean[]) => {
    if (i === clue.length) return void out.push(line);
    const rest = clue.slice(i + 1).reduce((a, b) => a + b + 1, 0);
    for (let s = start; s + clue[i] + rest <= n; s++) {
      const next = [...line];
      for (let k = 0; k < clue[i]; k++) next[s + k] = true;
      place(i + 1, s + clue[i] + 1, next);
    }
  };
  place(0, 0, Array(n).fill(false));
  return out;
}

/** Known cells: true filled, false empty, null unknown. */
export type Knowledge = (boolean | null)[][];

/**
 * One pass of line logic: for each row and column, keep only placements that agree with what is
 * known, and mark cells all of them agree on. Returns the cells newly found.
 */
export function deduce(p: Picture, known: Knowledge): { x: number; y: number; fill: boolean }[] {
  const { rows, cols } = clues(p);
  const n = known.length;
  const found: { x: number; y: number; fill: boolean }[] = [];
  const settle = (cells: (boolean | null)[], clue: number[], at: (i: number) => { x: number; y: number }) => {
    const fits = placements(n, clue).filter((pl) => pl.every((f, i) => cells[i] === null || cells[i] === f));
    if (!fits.length) return;
    for (let i = 0; i < n; i++) {
      if (cells[i] !== null) continue;
      if (fits.every((pl) => pl[i] === fits[0][i])) {
        const { x, y } = at(i);
        if (!found.some((f) => f.x === x && f.y === y)) found.push({ x, y, fill: fits[0][i] });
      }
    }
  };
  for (let y = 0; y < n; y++) settle(known[y], rows[y], (i) => ({ x: i, y }));
  for (let x = 0; x < n; x++) settle(known.map((r) => r[x]), cols[x], (i) => ({ x, y: i }));
  return found;
}

/** Whether row and column logic alone (no guessing) finds the whole picture. */
export function lineSolvable(p: Picture): boolean {
  const n = p.rows.length;
  const known: Knowledge = Array.from({ length: n }, () => Array(n).fill(null));
  for (let pass = 0; pass < 50; pass++) {
    const found = deduce(p, known);
    if (!found.length) break;
    for (const f of found) known[f.y][f.x] = f.fill;
  }
  const g = toGrid(p);
  return known.every((r, y) => r.every((c, x) => c === (g[y][x] !== null)));
}
