import type { Rng } from '../../engine/random';
import { clues, lineSolvable, PICTURES as KID_PICTURES, placements, runs } from '../pixel-pictures/logic';
import { BIG_15, EASY_10, HARD_10, type DrawnPicture } from './pictures';

/**
 * Picture Logic's rules (nonograms, Picross). A grid hides a picture; the numbers along each row and column say how long the
 * runs of filled squares in that line are, in order. Fill the squares the numbers allow, cross out the ones they rule out, and
 * the picture appears. Every picture here can be solved by line logic alone, one line at a time, with no guessing.
 *
 * A grid is a flat array, row by row, of marks: empty, filled or crossed.
 */
export const EMPTY = 0, FILLED = 1, CROSSED = 2;
export type Mark = 0 | 1 | 2;
export type Marks = readonly Mark[];

export interface PicturePuzzle {
  name: string;
  size: number;
  /** The drawing: `.` empty, a letter a filled square in that color. */
  rows: readonly string[];
  /** Which squares are filled. */
  solution: readonly boolean[];
  rowClues: readonly (readonly number[])[];
  colClues: readonly (readonly number[])[];
  /** How many squares are filled: the fewest fills a finished picture can take, and so its par. */
  par: number;
}

export function parsePicture(name: string, rows: readonly string[]): PicturePuzzle {
  const size = rows.length;
  if (rows.some((r) => r.length !== size)) throw new Error(`${name}: a picture is a square`);
  const { rows: rowClues, cols: colClues } = clues({ name, rows: [...rows] });
  const solution = rows.join('').split('').map((ch) => ch !== '.');
  return { name, size, rows, solution, rowClues, colClues, par: solution.filter(Boolean).length };
}

export const fromDrawn = (d: DrawnPicture) => parsePicture(d.name, d.rows);

/** The clue read aloud: "3, 1, 4"; an empty line is "nothing". */
export const clueText = (clue: readonly number[]) => (clue.length === 1 && clue[0] === 0 ? 'nothing' : clue.join(', '));

/* ------------------------------------------------------------------------------------------------ */
/* Lines                                                                                              */
/* ------------------------------------------------------------------------------------------------ */

export interface Line {
  kind: 'row' | 'column';
  index: number;
}

/** The squares of a line, in order. */
export const cellsOf = (size: number, line: Line): number[] => Array.from({ length: size }, (_, i) => (line.kind === 'row' ? line.index * size + i : i * size + line.index));
export const lineName = (line: Line) => `${line.kind} ${line.index + 1}`;
export const clueOf = (p: PicturePuzzle, line: Line) => (line.kind === 'row' ? p.rowClues[line.index] : p.colClues[line.index]);
export const allLines = (size: number): Line[] => [
  ...Array.from({ length: size }, (_, index): Line => ({ kind: 'row', index })),
  ...Array.from({ length: size }, (_, index): Line => ({ kind: 'column', index })),
];

/**
 * How a line stands, from the marks in it and its clue alone (never from the answer): `done` when its filled runs are exactly
 * the clue, `over` when nothing the clue allows fits the marks (too many filled, a run too long, a cross on a square the clue
 * must fill), and `open` otherwise.
 */
export type LineStatus = 'open' | 'done' | 'over';
export function lineStatus(line: Marks, clue: readonly number[]): LineStatus {
  const filled = runs(line.map((m) => m === FILLED));
  if (filled.length === clue.length && filled.every((n, i) => n === clue[i])) return 'done';
  const fits = placements(line.length, [...clue]).some((pl) => pl.every((on, i) => (line[i] !== FILLED || on) && (line[i] !== CROSSED || !on)));
  return fits ? 'open' : 'over';
}

export const statusOf = (marks: Marks, p: PicturePuzzle, line: Line): LineStatus => lineStatus(cellsOf(p.size, line).map((c) => marks[c]), clueOf(p, line));

/** Every line's standing: rows first, then columns. */
export const statuses = (marks: Marks, p: PicturePuzzle): LineStatus[] => allLines(p.size).map((l) => statusOf(marks, p, l));

/** The picture is finished when exactly its squares are filled. A cross is only a note, so crosses never matter. */
export const isSolved = (marks: Marks, p: PicturePuzzle) => p.solution.every((on, i) => (marks[i] === FILLED) === on);

export const fillCount = (marks: Marks) => marks.filter((m) => m === FILLED).length;

/* ------------------------------------------------------------------------------------------------ */
/* Painting                                                                                           */
/* ------------------------------------------------------------------------------------------------ */

/**
 * What a held button does as the cursor moves. The first square decides it: the bottom button fills an empty or crossed square
 * (and, on a filled one, empties squares); the left button crosses an empty square (and, on a crossed one, lifts crosses).
 */
export type Brush = 'fill' | 'empty' | 'cross' | 'lift';
export const brushFor = (button: 'fill' | 'cross', mark: Mark): Brush => (button === 'fill' ? (mark === FILLED ? 'empty' : 'fill') : mark === CROSSED ? 'lift' : 'cross');

export interface Stroke {
  mark: Mark;
  /** The square changed. */
  changed: boolean;
  /** It was a fill: an empty or crossed square became filled, which is the one thing that counts. Emptying, crossing and lifting are free. */
  counted: boolean;
}
export function paint(mark: Mark, brush: Brush): Stroke {
  switch (brush) {
    case 'fill': return mark === FILLED ? { mark, changed: false, counted: false } : { mark: FILLED, changed: true, counted: true };
    case 'empty': return mark === FILLED ? { mark: EMPTY, changed: true, counted: false } : { mark, changed: false, counted: false };
    case 'cross': return mark === EMPTY ? { mark: CROSSED, changed: true, counted: false } : { mark, changed: false, counted: false };
    case 'lift': return mark === CROSSED ? { mark: EMPTY, changed: true, counted: false } : { mark, changed: false, counted: false };
  }
}

/* ------------------------------------------------------------------------------------------------ */
/* Deduction and hints                                                                                */
/* ------------------------------------------------------------------------------------------------ */

export interface Deduction {
  cell: number;
  fill: boolean;
  line: Line;
}

/** What each mark tells line logic: a filled square is known filled, a crossed one known empty. */
export const knowledge = (marks: Marks): (boolean | null)[] => marks.map((m) => (m === FILLED ? true : m === CROSSED ? false : null));

/**
 * Every square one line decides all by itself, given what is known: the squares that every way of fitting the clue to what is
 * known agrees on. A square found by two lines is listed once, under the first.
 */
export function deductions(known: readonly (boolean | null)[], p: PicturePuzzle): Deduction[] {
  const out: Deduction[] = [];
  const seen = new Set<number>();
  for (const line of allLines(p.size)) {
    const cells = cellsOf(p.size, line);
    const fits = placements(p.size, [...clueOf(p, line)]).filter((pl) => pl.every((on, i) => known[cells[i]] === null || known[cells[i]] === on));
    if (!fits.length) continue;
    cells.forEach((cell, i) => {
      if (known[cell] !== null || seen.has(cell)) return;
      if (fits.every((pl) => pl[i] === fits[0][i])) {
        seen.add(cell);
        out.push({ cell, fill: fits[0][i], line });
      }
    });
  }
  return out;
}

export type Hint =
  /** A square she filled that is not in the picture, or crossed that is: take it out. */
  | { kind: 'fix'; cell: number; mark: Mark }
  /** One line's clue decides this square. */
  | { kind: 'fill' | 'cross'; cell: number; line: Line; clue: readonly number[] };

/**
 * Where a hint should point: first a mark that cannot be right (a filled square outside the picture, then a cross on a square
 * inside it); otherwise a square one line decides from what she has marked rightly, a fill before a cross, and the one nearest
 * where she is looking.
 */
export function hintFor(marks: Marks, p: PicturePuzzle, near = 0): Hint | null {
  if (isSolved(marks, p)) return null;
  const dist = (c: number) => Math.abs(Math.floor(c / p.size) - Math.floor(near / p.size)) + Math.abs((c % p.size) - (near % p.size));
  const wrong = marks.map((m, i) => ((m === FILLED && !p.solution[i]) || (m === CROSSED && p.solution[i]) ? i : -1)).filter((i) => i >= 0);
  if (wrong.length) {
    const cell = wrong.sort((a, b) => dist(a) - dist(b) || a - b)[0];
    return { kind: 'fix', cell, mark: marks[cell] };
  }
  const found = deductions(knowledge(marks), p);
  if (!found.length) return null;
  const best = found.sort((a, b) => Number(b.fill) - Number(a.fill) || dist(a.cell) - dist(b.cell) || a.cell - b.cell)[0];
  return { kind: best.fill ? 'fill' : 'cross', cell: best.cell, line: best.line, clue: clueOf(p, best.line) };
}

/** How many rounds of "every line, once" it takes to find the whole picture: the measure of how much care it needs. */
export function passesNeeded(p: PicturePuzzle): number {
  const known: (boolean | null)[] = p.solution.map(() => null);
  let passes = 0;
  for (; passes < 80; passes++) {
    const found = deductions(known, p);
    if (!found.length) break;
    for (const f of found) known[f.cell] = f.fill;
  }
  return passes;
}

/** Whether line logic alone, with no guessing, finds the whole picture. */
export const solvableByLines = (p: PicturePuzzle) => lineSolvable({ name: p.name, rows: [...p.rows] });

/* ------------------------------------------------------------------------------------------------ */
/* Levels                                                                                             */
/* ------------------------------------------------------------------------------------------------ */

export interface PicturePlan {
  /** For grown-ups. */
  name: string;
  size: 6 | 10 | 15;
  pictures: number;
}

/** The ladder: a 6 by 6 warm-up, two 10 by 10 steps, and a 15 by 15 picture. */
export const PLANS: PicturePlan[] = [
  { name: 'A small 6 by 6 picture', size: 6, pictures: 1 },
  { name: 'A 10 by 10 picture with a few passes of logic', size: 10, pictures: 1 },
  { name: 'A 10 by 10 picture that needs more care', size: 10, pictures: 1 },
  { name: 'A big 15 by 15 picture', size: 15, pictures: 1 },
];

export const planFor = (level: number): PicturePlan => PLANS[Math.min(PLANS.length, Math.max(1, level)) - 1];

/** The pictures a level draws from. The 6 by 6 ones are the pictures Pixel Pictures can set as logic puzzles. */
export function poolFor(level: number): PicturePuzzle[] {
  const plan = planFor(level);
  if (plan.size === 6) return KID_PICTURES[6].filter((p) => lineSolvable(p)).map((p) => parsePicture(p.name, p.rows));
  const bank = plan.size === 15 ? BIG_15 : level === 2 ? EASY_10 : HARD_10;
  return bank.map(fromDrawn);
}

/** The puzzle for a level, chosen from the seed: the same seed hides the same picture. */
export function makePuzzles(level: number, rng: Rng): PicturePuzzle[] {
  const pool = poolFor(level), plan = planFor(level);
  return rng.shuffle([...pool]).slice(0, plan.pictures);
}

/* ------------------------------------------------------------------------------------------------ */
/* Touch                                                                                              */
/* ------------------------------------------------------------------------------------------------ */

/** The smallest touch target in a grown-up game, in logical units: a square or a button is never smaller. */
export const MIN_TOUCH = 64;
/** The paper kept around the squares, and half of it at each edge of the window when the picture slides. */
export const PAD = 16;
/** How much room one clue number takes along its line (a two-digit number across; a row of them down a column). */
export const CLUE_STEP_X = 26;
export const CLUE_STEP_Y = 24;

export type Tool = 'fill' | 'cross' | 'slide';
export type SlotKind = Tool | 'hint' | 'again';
export interface Rect { x: number; y: number; w: number; h: number }
export interface Slot extends Rect { kind: SlotKind }

/**
 * Where everything sits for touch. The squares are at least 64 across; when the picture (with its clue numbers) does not fit
 * the window, it slides under a finger: `maxX` and `maxY` are how far, and the clue numbers stay pinned along its top and left.
 */
export interface TouchFrame {
  /** A wide view puts the buttons in a column beside the picture; a tall one, in a row under it. */
  side: boolean;
  /** The paper behind the clues and the squares. */
  paper: Rect;
  /** The window on the squares (the paper without the clue numbers' strips). */
  grid: Rect;
  cell: number;
  /** The depth of the strips of clue numbers. */
  gutterX: number;
  gutterY: number;
  maxX: number;
  maxY: number;
  slots: Slot[];
  /** Where the fills tally and the picture's size go. */
  info: Rect;
}

/** The home and help buttons own the top left of the screen, and the pet the bottom left: the picture and buttons start clear of them. */
export const HOME_W = 150;
export const HOME_H = 210;

/**
 * The touch layout for a `size` by `size` picture whose clue strips are `rowDepth` and `colDepth` numbers deep, in a view of
 * `vw` by `vh` logical units. A Slide button is offered only when the picture is bigger than its window.
 */
export function touchFrame(vw: number, vh: number, size: number, rowDepth: number, colDepth: number): TouchFrame {
  const side = vw >= vh, btn = 72, gap = 10;
  const gutterX = rowDepth * CLUE_STEP_X + 14, gutterY = colDepth * CLUE_STEP_Y + 14;
  const panelW = 124, margin = 16;
  // The strip for the buttons: a column on the right, or a row at the bottom with the tally above it.
  const area: Rect = side
    ? { x: HOME_W, y: 100, w: vw - HOME_W - margin - panelW - margin, h: vh - 100 - 24 }
    : { x: 24, y: HOME_H, w: vw - 48, h: vh - HOME_H - 24 - btn - 12 - 44 - 12 };
  const fit = Math.floor(Math.min(area.w - gutterX - PAD, area.h - gutterY - PAD) / size);
  const cell = Math.max(MIN_TOUCH, Math.min(96, fit));
  const content = size * cell;
  const maxX = Math.max(0, content + PAD - (area.w - gutterX)), maxY = Math.max(0, content + PAD - (area.h - gutterY));
  // The paper hugs a picture that is all in view, and fills the window when it slides.
  const pw = maxX > 0 ? area.w : gutterX + content + PAD, ph = maxY > 0 ? area.h : gutterY + content + PAD;
  const paper: Rect = { x: area.x + (area.w - pw) / 2, y: area.y + (area.h - ph) / 2, w: pw, h: ph };
  const grid: Rect = { x: paper.x + gutterX, y: paper.y + gutterY, w: paper.w - gutterX, h: paper.h - gutterY };
  const kinds: SlotKind[] = ['fill', 'cross', ...(maxX > 0 || maxY > 0 ? ['slide' as const] : []), 'hint', 'again'];
  const slots: Slot[] = [];
  let info: Rect;
  if (side) {
    const x = vw - margin - panelW;
    info = { x, y: 100, w: panelW, h: 76 };
    kinds.forEach((kind, k) => slots.push({ kind, x, y: 100 + 92 + k * (btn + gap), w: panelW, h: btn }));
  } else {
    // The row starts right of the pet in the bottom left corner.
    const by = vh - 24 - btn, room = vw - HOME_W - 24, bw = Math.min(190, Math.floor((room - gap * (kinds.length - 1)) / kinds.length));
    const x0 = HOME_W + (room - (bw * kinds.length + gap * (kinds.length - 1))) / 2;
    info = { x: HOME_W, y: by - 12 - 44, w: room, h: 44 };
    kinds.forEach((kind, k) => slots.push({ kind, x: x0 + k * (bw + gap), y: by, w: bw, h: btn }));
  }
  return { side, paper, grid, cell, gutterX, gutterY, maxX, maxY, slots, info };
}

/** How deep the clue strips are: the most numbers in one row's clue, and in one column's. */
export const clueDepths = (p: PicturePuzzle) => ({ rowDepth: Math.max(...p.rowClues.map((c) => c.length)), colDepth: Math.max(...p.colClues.map((c) => c.length)) });

export type Axis = 'row' | 'column';

/** Which way a stroke begun on `start` runs once the finger is on `at`: the longer of its two movements. Null while it is on the start. */
export function axisOf(n: number, start: number, at: number): Axis | null {
  const dr = Math.abs(Math.floor(at / n) - Math.floor(start / n)), dc = Math.abs((at % n) - (start % n));
  return dr === 0 && dc === 0 ? null : dc >= dr ? 'row' : 'column';
}

/**
 * The squares a stroke covers: from where it began to the square under the finger, projected on to the row or column it chose. A
 * quick swipe that jumps squares between two frames still paints every square in between.
 */
export function strokeCells(n: number, start: number, axis: Axis | null, at: number): number[] {
  if (axis === null) return [start];
  const r = Math.floor(start / n), c = start % n;
  const to = axis === 'row' ? at % n : Math.floor(at / n), from = axis === 'row' ? c : r;
  const step = to >= from ? 1 : -1, out: number[] = [];
  for (let k = from; k !== to + step; k += step) out.push(axis === 'row' ? r * n + k : k * n + c);
  return out;
}

/** The tool a hint wants: a cross, or the lifting of one, uses Cross; a fill, or taking one out, uses Fill. */
export const toolForHint = (h: Hint): Tool => (h.kind === 'cross' || (h.kind === 'fix' && h.mark === CROSSED) ? 'cross' : 'fill');

/**
 * The demonstration starts with most of the picture filled in, so a ten- or fifteen-square picture shows a few strokes, not
 * a hundred: every row of the picture but the last few that have squares is filled. The picture is never already solved.
 */
export function headStart(p: PicturePuzzle, rowsLeft = 3): Mark[] {
  const marks: Mark[] = p.solution.map((): Mark => EMPTY);
  const withSquares = Array.from({ length: p.size }, (_, r) => r).filter((r) => p.solution.slice(r * p.size, (r + 1) * p.size).some(Boolean));
  const keep = new Set(withSquares.slice(-rowsLeft));
  for (let i = 0; i < marks.length; i++) if (p.solution[i] && !keep.has(Math.floor(i / p.size))) marks[i] = FILLED;
  return marks;
}
