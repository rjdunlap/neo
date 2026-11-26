import type { Rng } from '../../engine/random';
import { cellOf, COLS, type Cell } from './logic';

/** Levels 6 and 7 of Meadow Pens: a hidden number found by multiplying, kept as fixed authored tables. */

/** Level 6: a strip `rows` tall whose area is `total`; the answer is how many squares long it is. */
export interface MissingCase {
  id: string;
  total: number;
  rows: number;
}
export const MISSING: readonly MissingCase[] = [
  { id: 'M1', total: 6, rows: 2 },
  { id: 'M2', total: 8, rows: 2 },
  { id: 'M3', total: 12, rows: 3 },
  { id: 'M4', total: 10, rows: 2 },
  { id: 'M5', total: 12, rows: 2 },
  { id: 'M6', total: 15, rows: 3 },
  { id: 'M7', total: 20, rows: 4 },
  { id: 'M8', total: 18, rows: 3 },
  { id: 'M9', total: 24, rows: 4 },
];

/** Level 7: a floor of `w` by `h` bales, `layers` trays tall; the answer is every bale in the loft. */
export interface LoftCase {
  id: string;
  w: number;
  h: number;
  layers: number;
}
export const LOFT: readonly LoftCase[] = [
  { id: 'V1', w: 2, h: 3, layers: 3 },
  { id: 'V2', w: 2, h: 2, layers: 3 },
  { id: 'V3', w: 3, h: 2, layers: 2 },
  { id: 'V4', w: 2, h: 4, layers: 2 },
  { id: 'V5', w: 2, h: 2, layers: 4 },
  { id: 'V6', w: 2, h: 3, layers: 4 },
  { id: 'V7', w: 4, h: 2, layers: 3 },
];

export const lengthOf = (c: MissingCase) => c.total / c.rows;
export const baleCount = (c: LoftCase) => c.w * c.h;
export const loftTotal = (c: LoftCase) => baleCount(c) * c.layers;

export interface MissingTask {
  kind: 'missing';
  id: string;
  total: number;
  rows: number;
  length: number;
  /** The first column is the visible grass, the rest lie under the blanket; mirrored the grass is on the right. */
  mirror: boolean;
  cards: number[];
  /** Model cells: [grass column, blanket columns...] per row, in column order from the grass outward. */
  grass: Cell[];
  blanket: Cell[];
}
export interface LoftTask {
  kind: 'loft';
  id: string;
  w: number;
  h: number;
  layers: number;
  mirror: boolean;
  cards: number[];
  /** One tray's bale cells. */
  floor: Cell[];
  /** One cell per layer mark. */
  gauge: Cell[];
}
export type FactorTask = MissingTask | LoftTask;

export const correctCard = (t: FactorTask) => (t.kind === 'missing' ? t.length : t.floor.length * t.layers);

/** The cards of a level-6 case in authored order: the right length, the area minus the rows, one column short. */
export const missingCards = (c: MissingCase) => [lengthOf(c), c.total - c.rows, lengthOf(c) - 1];
/** The cards of a level-7 case in authored order: all bales, one tray only, the sides added. */
export const loftCards = (c: LoftCase) => [loftTotal(c), baleCount(c), baleCount(c) + c.layers];

/** The model column of the grass and the blanket's columns, mirrored or not (blanket always five wide). */
const at = (x: number, mirror: boolean) => (mirror ? COLS - 1 - x : x);

export function missingTask(c: MissingCase, mirror: boolean, cards: number[]): MissingTask {
  const length = lengthOf(c);
  const grass: Cell[] = [];
  const blanket: Cell[] = [];
  for (let x = 0; x < COLS; x++)
    for (let y = 0; y < c.rows; y++) (x === 0 ? grass : blanket).push(cellOf(at(x, mirror), y));
  return { kind: 'missing', id: c.id, total: c.total, rows: c.rows, length, mirror, cards, grass, blanket };
}

/** Cells of a model column x, top row first. */
export const columnCells = (t: MissingTask, x: number): Cell[] =>
  Array.from({ length: t.rows }, (_, y) => cellOf(at(x, t.mirror), y));

export function loftTask(c: LoftCase, mirror: boolean, cards: number[]): LoftTask {
  const floor: Cell[] = [];
  for (let y = 0; y < c.h; y++) for (let x = 0; x < c.w; x++) floor.push(cellOf(at(x, mirror), y));
  // The layer marks run down the column opposite the floor's far side (column 5, or 0 when mirrored).
  const gauge = Array.from({ length: c.layers }, (_, i) => cellOf(at(COLS - 1, mirror), i));
  return { kind: 'loft', id: c.id, w: c.w, h: c.h, layers: c.layers, mirror, cards, floor, gauge };
}

/** Five questions: the authored case first, then four others chosen without replacement; seeded for order, card order and mirror. */
export function factorTasks(level: 6 | 7, rng: Rng, authored = true): FactorTask[] {
  if (level === 6) {
    const rest = rng.shuffle(MISSING.filter((c) => c.id !== 'M3')).slice(0, 4);
    return [MISSING[2], ...rest].map((c, i) => {
      const first = i === 0;
      const cards = missingCards(c);
      // The authored opening shows 4, 9, 3 in that order the first time a level is played.
      const ordered = first && authored ? [cards[0], cards[1], cards[2]] : rng.shuffle(cards);
      return missingTask(c, !first && rng.chance(0.5), ordered);
    });
  }
  const rest = rng.shuffle(LOFT.slice(1)).slice(0, 4);
  return [LOFT[0], ...rest].map((c, i) => {
    const first = i === 0;
    const cards = loftCards(c);
    const ordered = first && authored ? cards : rng.shuffle(cards);
    return loftTask(c, !first && rng.chance(0.5), ordered);
  });
}

// ----- spoken quantities -----

const WORDS = [
  'zero',
  'one',
  'two',
  'three',
  'four',
  'five',
  'six',
  'seven',
  'eight',
  'nine',
  'ten',
  'eleven',
  'twelve',
  'thirteen',
  'fourteen',
  'fifteen',
  'sixteen',
  'seventeen',
  'eighteen',
  'nineteen',
  'twenty',
  'twenty-one',
  'twenty-two',
  'twenty-three',
  'twenty-four',
];
/** A count as a word, so the speech says "twelve" and never reads a digit. */
export const word = (n: number) => WORDS[n];
export const cap = (s: string) => s[0].toUpperCase() + s.slice(1);
/** "Three, six, nine, twelve" (one sentence) or, with `sentences`, "Six. Twelve. Eighteen": the running counts of `step` up to `to`. */
export const running = (step: number, to: number, sentences = false) =>
  Array.from({ length: to / step }, (_, i) => {
    const w = word(step * (i + 1));
    return sentences || i === 0 ? cap(w) : w;
  }).join(sentences ? '. ' : ', ');
/** The variables of a level-6 or level-7 spoken line for a task. */
export const askVars = (t: FactorTask): Record<string, string> =>
  t.kind === 'missing'
    ? { total: word(t.total), rows: word(t.rows) }
    : { bales: word(t.floor.length), layers: word(t.layers) };
