import type { Rng } from '../../engine/random';
import type { BandLevels } from '../../progress/difficulty';

export type DuckMode = 'along' | 'make' | 'howmany' | 'add' | 'ten' | 'hide' | 'bye' | 'friends' | 'double';

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
  /** The highest pad value (default 10; at most `PAD_CAP`), for levels whose answers pass ten. */
  padMax?: number;
  /** The bridge stands across the middle, splitting the pond into a left and a right side (`splitSeats`). */
  split?: boolean;
  /** double: how many of the level's last rounds are near doubles (one side has one more). */
  near?: number;
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
  // School (dive slice 6, planned as 12 and appended as 14): the bridge splits the pond; equal sides, then one more on a side.
  { mode: 'double', rounds: 5, min: 1, max: 5, near: 2, split: true },
];

export const LEVELS: BandLevels = {
  lap: { min: 1, max: 13, order: [13, 12, 1, 2] },
  toddler: { min: 1, max: 12, order: [12, 1, 2, 3, 4, 5] },
  preschool: { min: 3, max: 7 },
  prek: { min: 5, max: 9 },
  // Doubles (14) goes on top of school; 12 and 13 are lap's and toddler's openings, so the order skips them.
  school: { min: 8, max: 14, order: [8, 9, 10, 11, 14] },
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

/** A doubles round: ducks on the left and on the right of the split bridge. */
export interface DoublesRound {
  left: number;
  right: number;
}

/**
 * Level 14's rounds: equal sides (`min` + `min` up to `max` + `max`) first, then `near` near doubles where one side, either
 * one, has one more (still at most `max` a side, so every duck seats at full size). Never the same total twice running.
 */
export function doublesRounds(rng: Rng, plan: DuckPlan): DoublesRound[] {
  const near = plan.near ?? 0;
  const out: DoublesRound[] = [];
  while (out.length < plan.rounds) {
    const isNear = out.length >= plan.rounds - near;
    const n = rng.int(plan.min, isNear ? plan.max - 1 : plan.max);
    const round = !isNear
      ? { left: n, right: n }
      : rng.chance(0.5)
        ? { left: n, right: n + 1 }
        : { left: n + 1, right: n };
    const prev = out.at(-1);
    if (prev && prev.left + prev.right === round.left + round.right) continue;
    out.push(round);
  }
  return out;
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

/** The highest number a lily pad shows: ten until a level's `padMax` raises it, and never past twenty. */
export const PAD_CAP = 20;

/**
 * Three lily pads: the answer and two near neighbours, all between `lo` (1, or 0 where a level has zero rounds) and `hi`
 * (10, or a level's `padMax` up to `PAD_CAP`).
 */
export function padValues(rng: Rng, answer: number, lo = 1, hi = 10): number[] {
  const top = Math.min(PAD_CAP, hi);
  const near = [answer - 2, answer - 1, answer + 1, answer + 2].filter((v) => v >= lo && v <= top);
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

/** Where the pond's middle and the row of answer pads sit in a view (the pond is an ellipse `POND_RX` by `POND_RY` around it). */
export const pondCenter = (v: { w: number; h: number }) => ({ x: v.w / 2, y: v.h * 0.5 });
export const POND_RX = 390;
export const POND_RY = 128;
export const PAD_ROW_GAP = 190;
export const padRowY = (v: { h: number }) => v.h - 90;
/** A pad's middle, counting from the left of a row of `count`. */
export const padSpot = (v: { w: number; h: number }, i: number, count = 3) => ({
  x: v.w / 2 + (i - (count - 1) / 2) * PAD_ROW_GAP,
  y: padRowY(v),
});

/**
 * Seats for ducks that are counted, never tapped (the pads are the targets), so they may be drawn smaller than a tappable
 * duck: `scale` multiplies the duck's size. In counting order.
 */
export interface Seating {
  slots: [number, number][];
  scale: number;
  /** How wide the pond is drawn for these seats (half its width): `POND_RX`, or `WIDE_POND_RX` for twenty. */
  pondRx: number;
}

/** Twenty seats widen the pond, so the outer ducks sit well inside its rim and the two tens have room apart. */
export const WIDE_POND_RX = 460;

/** Twenty seats: ducks this close are drawn at this size, so neighbours do not overlap. */
export const FRAME_GAP = 80;
export const FRAME_SCALE = 0.68;
/** The two rows of the twenty seats, nearer the pond's middle than the rows of five, where the pond is widest. */
const FRAME_ROWS = [-40, 42] as const;
/** The gap between the two ten-frames' inner columns, half as wide again as a column, so the tens read apart. */
export const FRAMES_APART = 128;

/**
 * Ten and twenty seats, two rows of five to a frame. Up to ten fill one frame of the size and spacing of the five-and-five
 * layout (top row first). Past ten, two frames sit side by side at `FRAME_GAP` with smaller ducks on a wider pond: the left frame is full
 * first (its top row, then its bottom row), then the right frame fills the same way, so the full ten is counted, and seen,
 * before the ones. Not `countingOrder`, which would read across both frames row by row.
 */
export function frameSeats(n: number): Seating {
  const count = Math.max(0, Math.min(20, Math.floor(n)));
  if (count <= 10) return { slots: rowsSlots(count), scale: 1, pondRx: POND_RX };
  const slots = Array.from({ length: count }, (_, i): [number, number] => {
    const frame = Math.floor(i / 10);
    const inFrame = i % 10;
    const col = inFrame % 5;
    const left = -FRAMES_APART / 2 - 4 * FRAME_GAP;
    const x = frame === 0 ? left + col * FRAME_GAP : FRAMES_APART / 2 + col * FRAME_GAP;
    return [x, FRAME_ROWS[Math.floor(inFrame / 5)]];
  });
  return { slots, scale: FRAME_SCALE, pondRx: WIDE_POND_RX };
}

/** The split bridge: half its width across the pond's middle. A duck's feet stay half a duck (`DUCK_GAP / 2`) from its edge. */
export const SPLIT_BRIDGE_HALF = 40;
const SPLIT_CLEAR = DUCK_GAP / 2;

/**
 * A pond split by the bridge: `left` and `right` ducks (1–8 a side), each side filled outward from the bridge, the top row
 * first, as mirror images so equal sides look equal. Up to five a side, full-size ducks a duck apart (three on top, two
 * below); six to eight, two rows of four at `FRAME_GAP` with smaller ducks. Counting order: the left side, then the right.
 */
export function splitSeats(left: number, right: number): Seating {
  const most = Math.max(left, right);
  const small = most > 5;
  const perRow = small ? 4 : 3;
  const gap = small ? FRAME_GAP : DUCK_GAP;
  // Rows sit a little low, where the pond is still wide but the far rim is clear of the top row's heads.
  const rows = small ? ([-30, 50] as const) : ([-36, 72] as const);
  const side = (n: number, sign: -1 | 1) =>
    Array.from({ length: Math.max(0, Math.min(8, Math.floor(n))) }, (_, i): [number, number] => {
      const col = i % perRow;
      return [sign * (SPLIT_BRIDGE_HALF + SPLIT_CLEAR + col * gap), rows[Math.floor(i / perRow)]];
    });
  return { slots: [...side(left, -1), ...side(right, 1)], scale: small ? FRAME_SCALE : 1, pondRx: POND_RX };
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
