import type { ColorName } from '../../art/palette';
import type { Rng } from '../../engine/random';
import type { BandLevels } from '../../progress/difficulty';

/**
 * Pixel Pictures: tap squares on a grid to make a picture. First copy a small picture shown
 * beside the grid, then copy one with two colors, then finish a picture's mirror half, and finally
 * solve picture-logic puzzles (nonograms) from the numbers along each row and column. At the top, a quarter is copied across
 * two mirror lines (`mirror2`), and a little 3×3 model is copied at double size, each square a 2×2 block (`big`). Level 9 is an
 * easier step between 1 and 2: two colors on the 4×4 grid.
 *
 * Pictures are authored as rows of characters: '.' is empty, letters are palette colors. Two-color logic pictures are
 * accepted only if their colored numbers alone solve them (`colorLineSolvable`).
 */
export type PixelMode =
  | 'copy'
  | 'mirror'
  | 'clues'
  | 'colorClues'
  | 'mirror2'
  | 'big'
  | 'free'
  /** Level 11, ones and zeros: four cards write one row of squares (`bits.ts` plays it). */
  | 'bitsRow'
  /** Level 12, ones and zeros: the same four cards write a 4 by 4 picture one row at a time, top to bottom. */
  | 'bitsPicture';

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
  {
    mode: 'copy',
    size: 5,
    colors: 2,
    pictures: 3,
    name: 'Copy a two-color picture: pick a color, then tap squares',
  },
  {
    mode: 'mirror',
    size: 6,
    colors: 1,
    pictures: 2,
    name: 'Finish the other half: make both sides match like a mirror',
  },
  {
    mode: 'clues',
    size: 5,
    colors: 1,
    pictures: 2,
    name: 'Picture logic: the numbers say how many squares in a row are filled',
  },
  {
    mode: 'clues',
    size: 6,
    colors: 1,
    pictures: 2,
    name: 'Bigger picture logic: 6 by 6, with numbers for runs like "2 1"',
  },
  {
    mode: 'colorClues',
    size: 6,
    colors: 2,
    pictures: 2,
    name: 'Two-color picture logic: each run has its own color',
  },
  {
    mode: 'mirror2',
    size: 6,
    colors: 1,
    pictures: 2,
    name: 'Both ways: copy a quarter across two mirror lines',
  },
  {
    mode: 'big',
    size: 6,
    colors: 1,
    pictures: 2,
    name: 'Twice as big: copy a little picture at double size',
  },
  {
    mode: 'copy',
    size: 4,
    colors: 2,
    pictures: 3,
    name: 'Two colors, small: pick a color, then copy a 4 by 4 picture',
  },
  { mode: 'free', size: 5, colors: 1, pictures: 1, name: 'My own picture: color any squares, then tap Done' },
  {
    mode: 'bitsRow',
    size: 4,
    colors: 1,
    pictures: 3,
    name: 'Ones and zeros: flip four cards to write one row of squares',
  },
  {
    mode: 'bitsPicture',
    size: 4,
    colors: 1,
    pictures: 2,
    name: 'Ones and zeros, a whole picture: write each row with four cards',
  },
];

export const LEVELS: BandLevels = {
  // Level 9 (two colors on the small grid) sits between 1 and 2; level 10 (my own picture, a free level) comes last.
  preschool: { min: 1, max: 9, order: [1, 9, 2] },
  prek: { min: 1, max: 10, order: [1, 9, 2, 3, 10] },
  // Levels 11 and 12 (ones and zeros) sit after 8, away from 4–6, so digits as a key and digits as counts are never
  // neighbours.
  school: { min: 3, max: 12, order: [3, 4, 5, 6, 7, 8, 11, 12, 10] },
};

export const planFor = (level: number) => PLANS[Math.min(PLANS.length, Math.max(1, level)) - 1];

export const LETTERS: Record<string, ColorName> = {
  r: 'red',
  o: 'orange',
  y: 'yellow',
  g: 'green',
  b: 'blue',
  p: 'pink',
  u: 'purple',
  n: 'brown',
};

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
    // Level 9: two colors on the small grid.
    { name: 'a ladybird', rows: ['.nn.', 'rnrr', 'rrnr', '.rr.'] },
    { name: 'a carrot', rows: ['.gg.', '.oo.', '.oo.', '..o.'] },
    { name: 'an apple', rows: ['.g..', 'rrrr', 'rrrr', '.rr.'] },
    { name: 'a little chick', rows: ['.yy.', '.yyo', 'yyy.', '.yy.'] },
  ],
  5: [
    { name: 'a flower', rows: ['.p.p.', 'ppypp', '.ppp.', '..g..', '.ggg.'] },
    { name: 'a fish', rows: ['.bb..', 'bbbbo', 'bbbb.', '.bb.o', '.....'] },
    { name: 'a house', rows: ['..r..', '.rrr.', 'rrrrr', '.n.n.', '.nnn.'] },
    { name: 'a tree', rows: ['.ggg.', 'ggggg', '.ggg.', '..n..', '..n..'] },
    { name: 'an ice pop', rows: ['.ppp.', '.ppp.', '.yyy.', '..n..', '..n..'] },
    { name: 'a strawberry', rows: ['.ggg.', 'rrrrr', 'rrrrr', '.rrr.', '..r..'] },
    { name: 'a duckling', rows: ['.yy..', '.yyoo', '.yy..', 'yyyy.', '.yyy.'] },
    { name: 'a mushroom', rows: ['.rrr.', 'rrrrr', '..n..', '..n..', '.nnn.'] },
  ],
  6: [
    { name: 'a butterfly', rows: ['u....u', 'uu..uu', 'uuuuuu', 'uuuuuu', 'uu..uu', 'u....u'] },
    { name: 'a heart', rows: ['.rr.rr', 'rrrrrr', 'rrrrrr', '.rrrr.', '..rr..', '......'] },
    { name: 'a rocket', rows: ['..bb..', '.bbbb.', '.bbbb.', '.bbbb.', 'bbbbbb', 'b.bb.b'] },
    { name: 'a cat face', rows: ['o....o', 'oo..oo', 'oooooo', 'o.oo.o', 'oooooo', '.oooo.'] },
    { name: 'a crown', rows: ['y.yy.y', 'yyyyyy', 'yyyyyy', 'yyyyyy', '......', '......'] },
    { name: 'a little cat', rows: ['.oo..o', 'oonnno', 'oonnno', 'oooooo', 'o.oo.o', '.o..o.'] },
    { name: 'a little sailboat', rows: ['....b.', '...bb.', '..bbb.', '.rrrr.', 'rrrrrr', '..rr..'] },
    { name: 'a sun', rows: ['y.yy.y', '.oooo.', 'yooooy', 'yooooy', '.oooo.', 'y.yy.y'] },
    { name: 'a frog', rows: ['gg..gg', 'gnggng', 'gggggg', 'g.nn.g', '.gggg.', 'gg..gg'] },
    { name: 'a big fish', rows: ['......', '.bbb.o', 'bbbbbo', 'bbbbbo', '.bbb.o', '......'] },
  ],
};

/** A 6×6 picture from its top-left 3×3 quarter, reflected across the middle column and the middle row. */
export function unfold(name: string, quarter: string[]): Picture {
  const top = quarter.map((r) => r + r.split('').reverse().join(''));
  return { name, rows: [...top, ...[...top].reverse()] };
}

/** Level 7: one-color pictures with two mirror lines, authored as the quarter she is given. */
export const FOURFOLD: Picture[] = [
  unfold('a snowflake', ['b.b', '.bb', 'bbb']),
  unfold('a window', ['nnn', 'n.n', 'nnn']),
  unfold('a flower', ['.pp', 'p.p', 'pp.']),
  unfold('a gem', ['..u', '.uu', 'uuu']),
  unfold('a target', ['ggg', 'g..', 'g.g']),
  unfold('a sparkle', ['y..', '.y.', '..y']),
];

/** Level 8: little 3×3 one-color models, copied at double size. */
export const MODELS: Picture[] = [
  { name: 'a plus', rows: ['.g.', 'ggg', '.g.'] },
  { name: 'a cross', rows: ['r.r', '.r.', 'r.r'] },
  { name: 'an arrow', rows: ['ooo', '.oo', 'o.o'] },
  { name: 'a corner', rows: ['y..', 'y..', 'yyy'] },
  { name: 'a smile', rows: ['p.p', '...', 'ppp'] },
];

/** Every square of the picture becomes a k×k block. */
export const scaleUp = (p: Picture, k: number): Picture => ({
  name: p.name,
  rows: p.rows.flatMap((r) =>
    Array<string>(k).fill(
      r
        .split('')
        .map((c) => c.repeat(k))
        .join(''),
    ),
  ),
});

/** The little model a double-size picture was made from: every other square. */
export const scaleDown = (p: Picture, k: number): Picture => ({
  name: p.name,
  rows: p.rows
    .filter((_, y) => y % k === 0)
    .map((r) =>
      r
        .split('')
        .filter((_, x) => x % k === 0)
        .join(''),
    ),
});

/** Grid cells as color letters or null. */
export type Grid = (string | null)[][];

export const toGrid = (p: Picture): Grid => p.rows.map((r) => r.split('').map((c) => (c === '.' ? null : c)));

/** Colors a picture uses. */
export const colorsOf = (p: Picture) => [...new Set(p.rows.join('').replace(/\./g, ''))];

/** Pictures that fit a level: one color or exactly two for copying, one-color and left–right symmetric for mirror levels, logic-solvable for clue levels. */
export function picturesFor(plan: PixelPlan): Picture[] {
  if (plan.mode === 'mirror2') return FOURFOLD;
  if (plan.mode === 'big') return MODELS.map((m) => scaleUp(m, 2));
  if (plan.mode === 'free' || plan.mode === 'bitsRow') return [];
  return PICTURES[plan.size].filter((p) => {
    const n = colorsOf(p).length;
    if (plan.mode === 'copy') return plan.colors === 2 ? n === 2 : n === 1;
    // A card says filled or empty, never which color, so a picture written in cards has one color.
    if (plan.mode === 'bitsPicture') return n === 1;
    if (plan.mode === 'colorClues') return n === 2 && colorLineSolvable(p);
    if (plan.mode === 'mirror') return n === 1 && symmetric(p);
    // Logic puzzles only ask filled or empty, so any picture works if logic alone can solve it.
    return lineSolvable(p);
  });
}

export function makePictures(plan: PixelPlan, rng: Rng): Picture[] {
  if (plan.mode === 'free') return [blank(plan.size)];
  return rng.shuffle(picturesFor(plan)).slice(0, plan.pictures);
}

export const symmetric = (p: Picture) => p.rows.every((r) => r === r.split('').reverse().join(''));

/** Mirror levels: the left half is drawn already; the child fills the right half. */
export const givenInMirror = (size: number, col: number) => col < size / 2;

/** Squares drawn before she starts, which a tap leaves alone: the left half on level 3, the top-left quarter on level 7. */
export function given(plan: PixelPlan, x: number, y: number): boolean {
  if (plan.mode === 'mirror') return givenInMirror(plan.size, x);
  if (plan.mode === 'mirror2') return x < plan.size / 2 && y < plan.size / 2;
  return false;
}

/** The given square a level-7 square mirrors: across the middle column, the middle row, or both. */
export const quarterOf = (size: number, x: number, y: number) => ({
  x: x < size / 2 ? x : size - 1 - x,
  y: y < size / 2 ? y : size - 1 - y,
});

/** Level 8: the 2×2 block a square belongs to, as its four squares. */
export const blockOf = (x: number, y: number) => {
  const bx = x - (x % 2);
  const by = y - (y % 2);
  return [
    { x: bx, y: by },
    { x: bx + 1, y: by },
    { x: bx, y: by + 1 },
    { x: bx + 1, y: by + 1 },
  ];
};

/**
 * The help glow after two misses. Level 7: the open picture square nearest her last tap (its mirror in the drawn quarter is
 * filled). Level 8: every open square of the block nearest her last tap. Other copy and mirror levels: the first open
 * square in reading order. Logic levels choose their glow from the clues instead.
 */
export function helpCells(
  plan: PixelPlan,
  picture: Picture,
  filled: Filled,
  from?: { x: number; y: number },
): { x: number; y: number }[] {
  const target = toGrid(picture);
  const open = target.flatMap((row, y) =>
    row.flatMap((c, x) => (c && !isFilled(filled[y][x]) && !given(plan, x, y) ? [{ x, y }] : [])),
  );
  if (!open.length) return [];
  if (plan.mode !== 'mirror2' && plan.mode !== 'big') return [open[0]];
  const far = (c: { x: number; y: number }) => (from ? Math.abs(c.x - from.x) + Math.abs(c.y - from.y) : 0);
  const near = open.reduce((best, c) => (far(c) < far(best) ? c : best));
  if (plan.mode === 'mirror2') return [near];
  return blockOf(near.x, near.y).filter((c) => open.some((o) => o.x === c.x && o.y === c.y));
}

/** Run lengths of filled cells along a line, e.g. "XX.X" → [2, 1]; an empty line is [0]. */
export function runs(line: boolean[]): number[] {
  const out: number[] = [];
  let n = 0;
  for (const f of line) {
    if (f) n++;
    else if (n) (out.push(n), (n = 0));
  }
  if (n) out.push(n);
  return out.length ? out : [0];
}

export function clues(p: Picture): { rows: number[][]; cols: number[][] } {
  const g = toGrid(p).map((r) => r.map((c) => c !== null));
  return { rows: g.map(runs), cols: g[0].map((_, x) => runs(g.map((r) => r[x]))) };
}

/** Same-color runs make a clue; different colors may touch, so their colors stay attached. */
export function colorRuns(line: string[]): { count: number; color: string }[] {
  const out: { count: number; color: string }[] = [];
  let previous: string | null = null;
  for (const cell of line) {
    if (cell === '.') {
      previous = null;
      continue;
    }
    const last = out.at(-1);
    if (previous === cell && last?.color === cell) last.count++;
    else out.push({ count: 1, color: cell });
    previous = cell;
  }
  return out.length ? out : [{ count: 0, color: 'b' }];
}

export function colorClues(p: Picture): {
  rows: { count: number; color: string }[][];
  cols: { count: number; color: string }[][];
} {
  return {
    rows: p.rows.map((row) => colorRuns(row.split(''))),
    cols: Array.from({ length: p.rows.length }, (_, x) => colorRuns(p.rows.map((row) => row[x]))),
  };
}

/** Every way to place these colored runs on a line of `n` cells ('.' empty): same-color runs need a gap, different colors may touch. */
export function colorPlacements(n: number, clue: { count: number; color: string }[]): string[][] {
  if (clue.length === 1 && clue[0].count === 0) return [Array(n).fill('.')];
  const out: string[][] = [];
  const place = (i: number, start: number, line: string[]) => {
    if (i === clue.length) return void out.push(line);
    const gap = (k: number) => (k + 1 < clue.length && clue[k + 1].color === clue[k].color ? 1 : 0);
    const rest = clue.slice(i + 1).reduce((a, r, k) => a + r.count + gap(i + 1 + k), 0);
    for (let s = start; s + clue[i].count + gap(i) + rest <= n; s++) {
      const next = [...line];
      for (let k = 0; k < clue[i].count; k++) next[s + k] = clue[i].color;
      place(i + 1, s + clue[i].count + gap(i), next);
    }
  };
  place(0, 0, Array(n).fill('.'));
  return out;
}

/** Every way to place these runs on a line of `n` cells. */
export function placements(n: number, clue: number[]): boolean[][] {
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
  for (let x = 0; x < n; x++)
    settle(
      known.map((r) => r[x]),
      cols[x],
      (i) => ({ x, y: i }),
    );
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

/** Known cells on a two-color logic board: a color letter, '.' empty, or null unknown. */
export type ColorKnowledge = (string | null)[][];

/** One pass of color line logic: as `deduce`, but a settled cell is settled to its color (or '.'). */
export function colorDeduce(p: Picture, known: ColorKnowledge): { x: number; y: number; cell: string }[] {
  const { rows, cols } = colorClues(p);
  const n = known.length;
  const found: { x: number; y: number; cell: string }[] = [];
  const settle = (
    cells: (string | null)[],
    clue: { count: number; color: string }[],
    at: (i: number) => { x: number; y: number },
  ) => {
    const fits = colorPlacements(n, clue).filter((pl) =>
      pl.every((c, i) => cells[i] === null || cells[i] === c),
    );
    if (!fits.length) return;
    for (let i = 0; i < n; i++) {
      if (cells[i] !== null) continue;
      if (fits.every((pl) => pl[i] === fits[0][i])) {
        const { x, y } = at(i);
        if (!found.some((f) => f.x === x && f.y === y)) found.push({ x, y, cell: fits[0][i] });
      }
    }
  };
  for (let y = 0; y < n; y++) settle(known[y], rows[y], (i) => ({ x: i, y }));
  for (let x = 0; x < n; x++)
    settle(
      known.map((r) => r[x]),
      cols[x],
      (i) => ({ x, y: i }),
    );
  return found;
}

/** Whether the colored row and column numbers alone (no guessing) find the whole picture, colors included. */
export function colorLineSolvable(p: Picture): boolean {
  const n = p.rows.length;
  const known: ColorKnowledge = Array.from({ length: n }, () => Array(n).fill(null));
  for (let pass = 0; pass < 50; pass++) {
    const found = colorDeduce(p, known);
    if (!found.length) break;
    for (const f of found) known[f.y][f.x] = f.cell;
  }
  return known.every((r, y) => r.every((c, x) => c === p.rows[y][x]));
}

/** What a child has put on the board: a color letter, 'x' for a crossed-out square, or nothing. */
export type Filled = (string | null)[][];

/** One touch of the ghost finger: choose a paint color on a two-color level, or tap a square. */
export type PixelTouch = { color: string } | { cell: { x: number; y: number } };

const isFilled = (c: string | null | undefined) => !!c && c !== 'x';

/**
 * A square that picture logic decides is filled and is not yet: the row and column numbers, plus the squares the same
 * logic has already shown to be empty (kept here, since the game only crosses out a square after a wrong tap), settle it.
 * It prefers the square nearest `from`, so the hand sweeps along rather than jumping about.
 */
export function logicCell(
  p: Picture,
  filled: Filled,
  from?: { x: number; y: number },
): { x: number; y: number } | null {
  const known: Knowledge = filled.map((row) =>
    row.map((c) => (isFilled(c) ? true : c === 'x' ? false : null)),
  );
  for (let pass = 0; pass < 50; pass++) {
    const found = deduce(p, known);
    const fills = found.filter((f) => f.fill);
    if (fills.length) {
      const far = (c: { x: number; y: number }) =>
        from ? Math.abs(c.x - from.x) + Math.abs(c.y - from.y) : 0;
      return fills.reduce((best, c) => (far(c) < far(best) ? c : best));
    }
    if (!found.length) return null;
    for (const f of found) known[f.y][f.x] = f.fill;
  }
  return null;
}

/**
 * Two-color logic levels: a square the colored numbers settle that is not yet painted, with its color. Squares the same
 * logic shows empty are kept between passes (the board crosses one out only after a wrong tap). It prefers a square of
 * the color in hand, so the hand changes color only when that color has nothing settled, then the square nearest `from`.
 */
export function colorLogicCell(
  p: Picture,
  filled: Filled,
  color?: string,
  from?: { x: number; y: number },
): { x: number; y: number; c: string } | null {
  const known: ColorKnowledge = filled.map((row) => row.map((c) => (c === 'x' ? '.' : c)));
  for (let pass = 0; pass < 50; pass++) {
    const found = colorDeduce(p, known);
    const fills = found.filter((f) => f.cell !== '.');
    if (fills.length) {
      const mine = fills.filter((f) => f.cell === color);
      const pool = mine.length ? mine : fills;
      const far = (c: { x: number; y: number }) =>
        from ? Math.abs(c.x - from.x) + Math.abs(c.y - from.y) : 0;
      const best = pool.reduce((b, c) => (far(c) < far(b) ? c : b));
      return { x: best.x, y: best.y, c: best.cell };
    }
    if (!found.length) return null;
    for (const f of found) known[f.y][f.x] = f.cell;
  }
  return null;
}

/**
 * What a capable child touches next. Copy levels: the squares of the picture one after another (finishing a color before
 * choosing the next on a two-color level); mirror levels: the squares outside the drawn half or quarter, whose mirror
 * image is already drawn; double size: the picture one 2×2 block at a time;
 * logic levels: the squares the numbers settle, nearest first (on two-color logic, those of the color in hand first). Every touch is a square the picture really has and
 * that is still empty, so a demonstration makes no wrong move.
 */
export function pixelTouch(
  plan: PixelPlan,
  picture: Picture,
  filled: Filled,
  color: string,
  from?: { x: number; y: number },
): PixelTouch | null {
  const target = toGrid(picture);
  const open = target.flatMap((row, y) =>
    row.flatMap((c, x) => (c && !isFilled(filled[y][x]) && !given(plan, x, y) ? [{ x, y, c }] : [])),
  );
  if (!open.length) return null;
  if (plan.mode === 'clues') {
    const cell = logicCell(picture, filled, from);
    return cell ? { cell } : null;
  }
  if (plan.mode === 'colorClues') {
    const cell = colorLogicCell(picture, filled, color, from);
    if (!cell) return null;
    return cell.c === color ? { cell: { x: cell.x, y: cell.y } } : { color: cell.c };
  }
  // Double size fills one whole block before the next.
  if (plan.mode === 'big')
    open.sort((a, b) => (a.y >> 1) - (b.y >> 1) || (a.x >> 1) - (b.x >> 1) || a.y - b.y || a.x - b.x);
  const mine = open.find((o) => plan.mode !== 'copy' || plan.colors === 1 || o.c === color);
  if (mine) return { cell: { x: mine.x, y: mine.y } };
  return { color: open[0].c };
}

/** Level 10, my own picture: an empty board, four paints, and Done once she has colored this many squares. */
export const FREE_COLORS = ['r', 'y', 'b', 'g'] as const;
export const FREE_MIN = 4;
export const blank = (size: number): Picture => ({
  name: 'my own picture',
  rows: Array.from({ length: size }, () => '.'.repeat(size)),
});
/** What the ghost finger draws on level 10. */
export const FREE_HEART = ['.r.r.', 'rrrrr', 'rrrrr', '.rrr.', '..r..'];

export const filledCount = (filled: Filled) => filled.flat().filter(isFilled).length;
/** Done shows, and works, only once a design has at least `FREE_MIN` squares. */
export const canFinish = (filled: Filled) => filledCount(filled) >= FREE_MIN;

/** A tap on level 10: an empty square takes the paint in hand, a colored one empties. Nothing is ever wrong. */
export function freeTap(filled: Filled, x: number, y: number, color: string): Filled {
  return filled.map((row, j) => row.map((c, i) => (i === x && j === y ? (isFilled(c) ? null : color) : c)));
}

/** The squares of a board (or of a finished picture), as the treehouse keeps them. */
export function pixelsOf(grid: Filled): { x: number; y: number; color: ColorName }[] {
  return grid.flatMap((row, y) =>
    row.flatMap((c, x) => (isFilled(c) ? [{ x, y, color: LETTERS[c!] ?? 'blue' }] : [])),
  );
}

/**
 * The ghost finger on level 10: it chooses the design's paint, draws the heart square by square, emptying any square
 * the heart does not use, then presses Done.
 */
export function freeTouch(
  filled: Filled,
  color: string,
  design: string[] = FREE_HEART,
): { color: string } | { cell: { x: number; y: number } } | 'done' | null {
  for (let y = 0; y < filled.length; y++)
    for (let x = 0; x < filled[y].length; x++) {
      const want = design[y]?.[x] ?? '.';
      const have = filled[y][x];
      if (isFilled(have) && (want === '.' || have !== want)) return { cell: { x, y } };
      if (!isFilled(have) && want !== '.') return want === color ? { cell: { x, y } } : { color: want };
    }
  return canFinish(filled) ? 'done' : null;
}

// ── Level 11, ones and zeros ────────────────────────────────────────────────────────────────────────────────────────
// One key, shown on a card for the whole round: a 1 is a filled square and a 0 an empty one, read left to right, so the
// first card is the row's left square. It is this toy's own key; nothing here is arithmetic.

/** Cards in a row, and squares in the row they write. */
export const BIT_COUNT = 4;

/** A picture row as cards: '.' is 0 (false), any color letter is 1 (true), left to right. */
export const encodeRow = (row: string): boolean[] => row.split('').map((c) => c !== '.');

/** The row the cards say, in one color: card `i` is column `i`. */
export const decodeRow = (bits: readonly boolean[], color: string): string =>
  bits.map((b) => (b ? color : '.')).join('');

/** A picture as rows of cards, top row first. */
export const encodePicture = (p: Picture): boolean[][] => p.rows.map(encodeRow);

/** The picture rows of cards say, top row first, in one color. */
export const decodePicture = (bits: readonly (readonly boolean[])[], color: string, name = ''): Picture => ({
  name,
  rows: bits.map((row) => decodeRow(row, color)),
});

/** The leftmost card that differs from the row wanted, or null when all agree. */
export function firstDiffer(bits: readonly boolean[], target: readonly boolean[]): number | null {
  const i = target.findIndex((t, k) => t !== !!bits[k]);
  return i < 0 ? null : i;
}

/** The copy levels' one-color paints, for a level-11 row. */
export const BIT_COLORS = ['r', 'g', 'y', 'b', 'u'] as const;
export interface BitRow {
  bits: boolean[];
  color: string;
}

/** Level 11's round: three different rows of the 15 that fill at least one square (the cards already say 0000). */
export function makeBitRows(rng: Rng, count = 3): BitRow[] {
  const all = Array.from({ length: 2 ** BIT_COUNT - 1 }, (_, k) =>
    Array.from({ length: BIT_COUNT }, (_, i) => (((k + 1) >> (BIT_COUNT - 1 - i)) & 1) === 1),
  );
  const colors = rng.shuffle([...BIT_COLORS]);
  return rng
    .shuffle(all)
    .slice(0, count)
    .map((bits, i) => ({ bits, color: colors[i % colors.length] }));
}

/** Level 12: a picture's rows as the cards write them, top row first, each in the picture's one color. */
export const bitRowsOf = (p: Picture): BitRow[] => {
  const color = colorsOf(p)[0] ?? 'b';
  return encodePicture(p).map((bits) => ({ bits, color }));
};

/**
 * A press of the check. Right only when every card agrees. Otherwise one miss, however many cards differ, and `card` is
 * the leftmost that differs; every second failed check on a row is one hint: that card glows, or, if it is glowing
 * already (`glowing`) and she has left it, it is flipped for her. `fails` counts this row's failed checks before this one.
 */
export function bitCheck(
  bits: readonly boolean[],
  target: readonly boolean[],
  fails: number,
  glowing: number | null,
): { ok: true } | { ok: false; card: number; wants: boolean; hint: 'glow' | 'set' | null } {
  const card = firstDiffer(bits, target);
  if (card === null) return { ok: true };
  const hint = (fails + 1) % 2 ? null : glowing === card ? 'set' : 'glow';
  return { ok: false, card, wants: target[card], hint };
}

/**
 * The ghost finger on a row: flip the cards that differ, left to right, then press the arrow to see the row, then the
 * check. `shown` is whether her strip shows what the cards say now. It never makes a failing check.
 */
export function bitTouch(
  bits: readonly boolean[],
  target: readonly boolean[],
  shown: boolean,
): { card: number } | 'arrow' | 'check' {
  const card = firstDiffer(bits, target);
  if (card !== null) return { card };
  return shown ? 'check' : 'arrow';
}

/** A rectangle by its center, in view units. */
export interface BitBox {
  x: number;
  y: number;
  w: number;
  h: number;
}
export interface BitsLayout {
  /** The four cards, left to right. */
  cards: BitBox[];
  arrow: BitBox;
  check: BitBox;
  /** The row to make and her own row: four squares of `cell` units, each square above its card. */
  ref: BitBox;
  own: BitBox;
  cell: number;
  /** Center-to-center distance of the cards, and of the squares above them. */
  pitch: number;
  key: BitBox;
  /** Level 11: the shelf of finished rows. Level 12: the little picture to write. */
  shelf: BitBox;
  /** Level 12 only: the 4 by 4 preview board (never touched), its squares `boardCell` units, not below 64. */
  board?: BitBox;
  boardCell?: number;
  /** Level 12 only: where a finished row's four digits sit, beside the board; `y` is the board's center. */
  digits?: BitBox;
}

const CARD_W = 120;
const CARD_H = 140;
const CARD_GAP = 16;
const BIT_BUTTON = 120;
const BIT_CELL = 110;
const ASIDE_W = 264;
const BOARD_MIN = 64;
const BOARD_MAX = 100;
const DIGITS_W = 110;
/** The board sits this far left of the cards' center, so the digits beside it stay over the cards. */
const BOARD_SHIFT = 40;

/**
 * Where level 11's and 12's things sit, or null rather than shrink a card or button. Wide: the two strips above the cards at the
 * center-left, the arrow and the check right of the cards, the key card and the shelf in a column above the buttons.
 * Upright: key card and shelf along the top, clear of Home; the strips, the cards, then the two buttons in the bottom
 * row, right of the pet's corner. On level 11 a square always sits straight above its card. Level 12 has the preview
 * board where the two strips were (its squares as large as the height allows, 64 to 100 units, with the finished rows'
 * digits at its right) and the picture to write where the shelf was.
 */
export function bitsLayout(level: number, v: { w: number; h: number }): BitsLayout | null {
  if (level !== 11 && level !== 12) return null;
  const picture = level === 12;
  /** Level 12: the board and its digits, in the block of `blockH` units starting at `y`. */
  const boardAt = (x0: number, y: number, cell: number) => {
    const w = BIT_COUNT * cell;
    const x = x0 + rowW / 2 - BOARD_SHIFT;
    return {
      board: { x, y: y + w / 2, w, h: w },
      boardCell: cell,
      digits: { x: x + w / 2 + 10 + DIGITS_W / 2, y: y + w / 2, w: DIGITS_W, h: w },
    };
  };
  const pitch = CARD_W + CARD_GAP;
  const rowW = BIT_COUNT * CARD_W + (BIT_COUNT - 1) * CARD_GAP;
  const strip = (x0: number, y: number): BitBox => ({ x: x0 + rowW / 2, y, w: rowW, h: BIT_CELL });
  const cardsAt = (x0: number, y: number): BitBox[] =>
    Array.from({ length: BIT_COUNT }, (_, i) => ({
      x: x0 + CARD_W / 2 + i * pitch,
      y,
      w: CARD_W,
      h: CARD_H,
    }));
  const button = (x: number, y: number): BitBox => ({ x, y, w: BIT_BUTTON, h: BIT_BUTTON });
  if (v.h > v.w) {
    const asideH = 180;
    const fixed = asideH + 40 + 50 + CARD_H + 40 + BIT_BUTTON;
    const cell = Math.min(BOARD_MAX, Math.floor((v.h - 40 - fixed) / BIT_COUNT));
    if (picture && cell < BOARD_MIN) return null;
    const blockH = picture ? BIT_COUNT * cell : BIT_CELL + 40 + BIT_CELL;
    const stack = fixed + blockH;
    const asideW = ASIDE_W * 2 + 26;
    if (v.w < 135 + asideW + 10 || v.h < stack + 40) return null;
    const top = Math.max(20, (v.h - stack) / 2);
    const ax = Math.max(135, (v.w - asideW) / 2);
    const x0 = (v.w - rowW) / 2;
    const refY = top + asideH + 40 + BIT_CELL / 2;
    const ownY = refY + BIT_CELL + 40;
    const cardY = top + asideH + 40 + blockH + 50 + CARD_H / 2;
    const buttonY = cardY + CARD_H / 2 + 40 + BIT_BUTTON / 2;
    return {
      cards: cardsAt(x0, cardY),
      arrow: button(v.w / 2 - 84, buttonY),
      check: button(v.w / 2 + 84, buttonY),
      ref: strip(x0, refY),
      own: strip(x0, ownY),
      cell: BIT_CELL,
      pitch,
      key: { x: ax + ASIDE_W / 2, y: top + asideH / 2, w: ASIDE_W, h: asideH },
      shelf: { x: ax + ASIDE_W + 26 + ASIDE_W / 2, y: top + asideH / 2, w: ASIDE_W, h: asideH },
      ...(picture ? boardAt(x0, top + asideH + 40, cell) : {}),
    };
  }
  const total = rowW + 40 + BIT_BUTTON + 24 + BIT_BUTTON;
  const cell = Math.min(BOARD_MAX, Math.floor((v.h - 60 - 50 - CARD_H) / BIT_COUNT));
  if (picture && cell < BOARD_MIN) return null;
  const blockH = picture ? BIT_COUNT * cell : BIT_CELL + 40 + BIT_CELL;
  const stack = blockH + 50 + CARD_H;
  if (v.w < 170 + total + 20 || v.h < stack + 60) return null;
  const x0 = Math.max(170, (v.w - total) / 2);
  const top = (v.h - stack) / 2;
  const refY = top + BIT_CELL / 2;
  const ownY = refY + BIT_CELL + 40;
  const cardY = top + blockH + 50 + CARD_H / 2;
  const asideX = x0 + rowW + 40 + (BIT_BUTTON * 2 + 24) / 2;
  const asideH = (cardY - BIT_BUTTON / 2 - 30 - 24 - 20) / 2;
  return {
    cards: cardsAt(x0, cardY),
    arrow: button(x0 + rowW + 40 + BIT_BUTTON / 2, cardY),
    check: button(x0 + rowW + 40 + BIT_BUTTON + 24 + BIT_BUTTON / 2, cardY),
    ref: strip(x0, refY),
    own: strip(x0, ownY),
    cell: BIT_CELL,
    pitch,
    key: { x: asideX, y: 20 + asideH / 2, w: ASIDE_W, h: asideH },
    shelf: { x: asideX, y: 20 + asideH + 24 + asideH / 2, w: ASIDE_W, h: asideH },
    ...(picture ? boardAt(x0, top, cell) : {}),
  };
}
