import type { Rng } from '../../engine/random';
import type { BandLevels } from '../../progress/difficulty';

export type DuckMode = 'along' | 'make' | 'howmany' | 'add' | 'ten' | 'hide' | 'bye' | 'friends';

export interface DuckPlan {
  mode: DuckMode;
  /** Sets (along) or questions (everything else). */
  rounds: number;
  /** along: ducks per set. Otherwise the numbers asked about run from `min` to `max`. */
  max: number;
  min: number;
  /** make: show dots under the number on the sign. */
  dots?: boolean;
  /** add: mix in "some swim away". */
  subtract?: boolean;
  /** howmany: the layouts a round's ducks are dealt in (none: the fixed `SLOTS` in order). */
  layouts?: Layout[];
  /** howmany: one round in the level may start with an empty pond (never the first), and the pads run from 0. */
  zero?: boolean;
  /** Answer pads carry their dots, grouped in fives, under the numeral. */
  padDots?: boolean;
}

/** How a round's ducks sit on the pond: a dice face (1–6), two rows of five (top row first), or a scatter. */
export type Layout = 'dice' | 'rows' | 'scatter';

export const PLANS: DuckPlan[] = [
  { mode: 'along', rounds: 2, min: 3, max: 3 },
  { mode: 'along', rounds: 2, min: 5, max: 5 },
  { mode: 'make', rounds: 4, min: 1, max: 3, dots: true },
  { mode: 'make', rounds: 4, min: 2, max: 5, dots: true },
  { mode: 'make', rounds: 4, min: 3, max: 6, dots: false },
  { mode: 'howmany', rounds: 5, min: 1, max: 5, layouts: ['dice', 'rows'], zero: true, padDots: true },
  {
    mode: 'howmany',
    rounds: 5,
    min: 2,
    max: 8,
    layouts: ['dice', 'rows', 'scatter'],
    zero: true,
    padDots: true,
  },
  { mode: 'add', rounds: 5, min: 1, max: 5 },
  { mode: 'add', rounds: 5, min: 1, max: 10, subtract: true },
  // Early school: some ducks swim in; how many more fill the pond to ten?
  { mode: 'ten', rounds: 5, min: 3, max: 9 },
  // School: the total is known, but some ducks are hidden beneath a bridge.
  { mode: 'hide', rounds: 5, min: 5, max: 10 },
  // Below level 1 (placed first for lap and toddler): five ducks wave bye-bye one at a time, then all swim back. One song is a round.
  { mode: 'bye', rounds: 1, min: 5, max: 5 },
  // Lap's opening (placed first for lap only): one big duck on the pond; a touch anywhere brings a friend swimming in, up to five.
  { mode: 'friends', rounds: 1, min: 5, max: 5 },
];

export const LEVELS: BandLevels = {
  lap: { min: 1, max: 13, order: [13, 12, 1, 2] },
  toddler: { min: 1, max: 12, order: [12, 1, 2, 3, 4, 5] },
  preschool: { min: 3, max: 7 },
  prek: { min: 5, max: 9 },
  school: { min: 8, max: 11 },
};

export interface HidingPuzzle {
  total: number;
  visible: number;
  hidden: number;
}

/** A fair part-whole question: always some ducks to see and at least one hiding. */
export function hidingPuzzle(rng: Rng, plan: DuckPlan): HidingPuzzle {
  const total = rng.int(plan.min, plan.max);
  const hidden = rng.int(1, Math.min(5, total - 1));
  return { total, visible: total - hidden, hidden };
}

/** Make-ten rounds: how many ducks start in the pond, never the same twice running. */
export function tenStarts(rng: Rng, plan: DuckPlan): number[] {
  const out: number[] = [];
  while (out.length < plan.rounds) {
    const a = rng.int(plan.min, plan.max);
    if (a !== out.at(-1)) out.push(a);
  }
  return out;
}

export const planFor = (level: number) => PLANS[Math.min(PLANS.length, Math.max(1, level)) - 1];

/** Places on the pond for swimming ducks, relative to its middle. */
export const SLOTS: [number, number][] = [
  [0, -52],
  [-120, -48],
  [120, -48],
  [-60, 40],
  [60, 40],
  [-240, -36],
  [240, -36],
  [-180, 44],
  [180, 44],
  [0, 96],
];

/** Level 13: where the big duck floats, relative to the pond's middle (its feet; it stands much taller than that). */
export const BIG_DUCK_SPOT: [number, number] = [0, -10];

/** Level 13: where her five friends swim to, in the order they come, around the big duck and clear of it. */
export const FRIEND_SLOTS: [number, number][] = [
  [-250, -34],
  [250, -34],
  [-190, 70],
  [190, 70],
  [0, 100],
];

/** Make mode: ducks waiting on the bank, always at least one more than asked for so stopping is a choice. */
export const bankSize = (plan: DuckPlan) => Math.min(7, plan.max + 1);

/** Three lily pads: the answer and two near neighbours, all between `lo` (1, or 0 where a level has zero rounds) and 10. */
export function padValues(rng: Rng, answer: number, lo = 1): number[] {
  const near = [answer - 2, answer - 1, answer + 1, answer + 2].filter((v) => v >= lo && v <= 10);
  return rng.shuffle([answer, ...rng.shuffle(near).slice(0, 2)]);
}

/** An adding or taking-away story: `a` ducks swim in, then `b` more arrive or swim away. */
export interface PondStory {
  a: number;
  b: number;
  away: boolean;
  answer: number;
}

export function story(rng: Rng, plan: DuckPlan): PondStory {
  const away = !!plan.subtract && rng.chance(0.5);
  if (away) {
    const a = rng.int(2, Math.min(plan.max, 7));
    const b = rng.int(1, a - 1);
    return { a, b, away, answer: a - b };
  }
  const a = rng.int(1, plan.max - 1);
  const b = rng.int(1, Math.min(plan.max - a, 4));
  return { a, b, away, answer: a + b };
}

/**
 * What a capable child touches next: a duck on the bank, or lily pad number `pad` (counting from the left), or null while
 * she waits. Ducks: all of them (along, or each swimmer in turn to send it off in bye), or only until there are as many swimming as the sign says (make). Pads: the one
 * with the answer. Always a right one, and never a duck too many.
 */
export type DuckMove = 'duck' | { pad: number };

export function duckMove(
  plan: DuckPlan,
  bank: number,
  swimming: number,
  want: number,
  pads: readonly number[],
  answer: number,
): DuckMove | null {
  if (plan.mode === 'along') return bank > 0 ? 'duck' : null;
  if (plan.mode === 'make') return bank > 0 && swimming < want ? 'duck' : null;
  if (plan.mode === 'bye') return swimming > 0 ? 'duck' : null;
  // One big duck: any touch brings the next friend, until all five are in.
  if (plan.mode === 'friends') return swimming < plan.max ? 'duck' : null;
  const pad = pads.indexOf(answer);
  return pad >= 0 ? { pad } : null;
}

/** Two separated rows: visible and revealed parts never occupy the same seat. */
export const HIDING_SLOTS: [number, number][] = [
  [-260, -80],
  [-130, -80],
  [0, -80],
  [130, -80],
  [260, -80],
  [-240, 90],
  [-120, 90],
  [0, 90],
  [120, 90],
  [240, 90],
];
export const hidingRevealSlots = (puzzle: HidingPuzzle) => HIDING_SLOTS.slice(puzzle.visible, puzzle.total);

export const numberSentence = (a: number, b: number, away = false) =>
  `${a} ${away ? '−' : '+'} ${b} = ${away ? a - b : a + b}`;

/** Levels 6–7: how many ducks each round shows. Never the same twice running; at most one empty pond, never first. */
export function howManyAnswers(rng: Rng, plan: DuckPlan): number[] {
  const zeroAt = plan.zero && rng.chance(0.6) ? rng.int(1, plan.rounds - 1) : -1;
  const out: number[] = [];
  while (out.length < plan.rounds) {
    if (out.length === zeroAt) {
      out.push(0);
      continue;
    }
    const n = rng.int(plan.min, plan.max);
    if (n !== out.at(-1) || plan.min === plan.max) out.push(n);
  }
  return out;
}

/** Ducks on the pond are at least this far apart (a duck's own width), so each is counted on its own. */
export const DUCK_GAP = 108;
/** The two rows the dice and five-and-five layouts use, relative to the pond's middle (ducks' feet). */
const ROW_Y = [-45, 67] as const;
const MID_Y = (ROW_Y[0] + ROW_Y[1]) / 2;
const DICE_X = 130;

/** A dice face lying on the pond: corners at ±130 across and the two rows, the middle between them. */
const DICE: [number, number][][] = [
  [[0, MID_Y]],
  [
    [-DICE_X, ROW_Y[0]],
    [DICE_X, ROW_Y[1]],
  ],
  [
    [-DICE_X, ROW_Y[0]],
    [0, MID_Y],
    [DICE_X, ROW_Y[1]],
  ],
  [
    [-DICE_X, ROW_Y[0]],
    [DICE_X, ROW_Y[0]],
    [-DICE_X, ROW_Y[1]],
    [DICE_X, ROW_Y[1]],
  ],
  [
    [-DICE_X, ROW_Y[0]],
    [DICE_X, ROW_Y[0]],
    [0, MID_Y],
    [-DICE_X, ROW_Y[1]],
    [DICE_X, ROW_Y[1]],
  ],
  [
    [-DICE_X, ROW_Y[0]],
    [0, ROW_Y[0]],
    [DICE_X, ROW_Y[0]],
    [-DICE_X, ROW_Y[1]],
    [0, ROW_Y[1]],
    [DICE_X, ROW_Y[1]],
  ],
];

/** Five and five: the top row fills left to right first, like a ten-frame. */
const rowsSlots = (n: number): [number, number][] =>
  Array.from({ length: n }, (_, i) => [((i % 5) - 2) * 120, ROW_Y[Math.floor(i / 5)]]);

/** Where a scattered duck may sit: inside the pond, clear of its edge (a duck is about 130 wide). */
export const inScatterArea = ([x, y]: [number, number]) => (x / 320) ** 2 + ((y - 18) / 80) ** 2 <= 1;

function scatterSlots(rng: Rng, n: number): [number, number][] | null {
  for (let attempt = 0; attempt < 60; attempt++) {
    const out: [number, number][] = [];
    for (let tries = 0; tries < 400 && out.length < n; tries++) {
      const p: [number, number] = [rng.int(-320, 320), rng.int(-62, 98)];
      if (inScatterArea(p) && out.every(([x, y]) => Math.hypot(x - p[0], y - p[1]) >= DUCK_GAP)) out.push(p);
    }
    if (out.length === n) return out;
  }
  return null;
}

/** Counting order: the back row first (top of the screen), left to right; a duck within 40 of its row's first duck is in that row. */
export function countingOrder(slots: [number, number][]): [number, number][] {
  const byY = [...slots].sort((a, b) => a[1] - b[1]);
  const rows: [number, number][][] = [];
  for (const s of byY) {
    const row = rows.at(-1);
    if (row && s[1] - row[0][1] < 40) row.push(s);
    else rows.push([s]);
  }
  return rows.flatMap((r) => r.sort((a, b) => a[0] - b[0]));
}

export interface PondLayout {
  kind: Layout | 'none';
  /** In counting order: the ducks arrive, and are counted, in this order. */
  slots: [number, number][];
}

/** Deal a layout the number fits: dice only for 1–6, rows up to ten, scatter where the level has it. Zero is an empty pond. */
export function layoutFor(rng: Rng, plan: DuckPlan, n: number): PondLayout {
  if (n === 0) return { kind: 'none', slots: [] };
  const kinds = (plan.layouts ?? []).filter((k) => k !== 'dice' || n <= 6);
  if (!kinds.length) return { kind: 'none', slots: SLOTS.slice(0, n) };
  const kind = rng.pick(kinds);
  if (kind === 'scatter') {
    const s = scatterSlots(rng, n);
    if (s) return { kind, slots: countingOrder(s) };
    return { kind: 'rows', slots: rowsSlots(n) };
  }
  if (kind === 'dice') return { kind, slots: countingOrder(DICE[n - 1]) };
  return { kind, slots: rowsSlots(n) };
}

/** The answer pad: its radius, and the dots' size, spacing and first row's height (the numeral sits above them). */
export const PAD_R = 62;
export const PAD_DOT_R = 6;
export const PAD_DOT_GAP = 17;
export const PAD_DOT_Y = 18;

/** Dot places for a number up to ten, in fives: one row of up to five, a second row below for six to ten. */
export const dotRows = (n: number, gap: number): [number, number][] =>
  Array.from({ length: n }, (_, i) => {
    const row = Math.floor(i / 5);
    const inRow = Math.min(5, n - row * 5);
    return [((i % 5) - (inRow - 1) / 2) * gap, row * gap];
  });

/** Historical sticker draw, kept apart from round content. */
export const stickerDucks = (rng: Rng) => rng.int(1, 3);
