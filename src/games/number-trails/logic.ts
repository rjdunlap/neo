import type { Rng } from '../../engine/random';
import type { BandLevels } from '../../progress/difficulty';
import { GUIDES, hintDue, pickLook, type Guide, type Look } from '../../learning/tracing/feedback';

/**
 * Number Trails: follow the firefly along a numeral, then meet that many things. The rules that a test can hold the
 * screen to live here: which numerals a level draws, how many things wait to be woken, where they sit, and what a tap does.
 */
export interface TrailPlan {
  /** The numerals this level draws from. */
  digits: readonly number[];
  /** After the trail, she wakes the things herself (counting as she taps) instead of watching them appear. */
  wakeThem: boolean;
  /** Write how many: she counts a group first, taps the numeral card that tells how many, then traces it. */
  writeHowMany?: true;
  /** Less help each time: the numeral is traced three times, the trail solid, then dotted, then only its start. */
  fading?: true;
  /** Ten, and some more: a two-digit numeral 10 to 19, written left to right, then ten in a frame and the rest beside it. */
  teens?: true;
  /** How far the finger may stray from the trail, in writing boxes, before it counts as a wander: wider on the easy entries. */
  tolerance: number;
  name: string;
}

const ONE_TO_FIVE = [1, 2, 3, 4, 5] as const;
const ZERO_TO_NINE = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9] as const;
/** The first numerals: each is one stroke from the top, with no lift and no loop back over itself. */
export const FIRST_NUMBERS = [1, 2, 3, 7] as const;
/** Ten, and some more: ten, then ten and one to nine more. */
export const TEENS = [10, 11, 12, 13, 14, 15, 16, 17, 18, 19] as const;

export const PLANS: readonly TrailPlan[] = [
  {
    digits: ONE_TO_FIVE,
    wakeThem: false,
    tolerance: 0.1,
    name: 'Trace 1 to 5, then watch that many appear and count them',
  },
  {
    digits: ZERO_TO_NINE,
    wakeThem: false,
    tolerance: 0.085,
    name: 'Trace 0 to 9, then watch that many appear and count them',
  },
  {
    digits: ZERO_TO_NINE,
    wakeThem: true,
    tolerance: 0.085,
    name: 'Trace 0 to 9, then tap to wake exactly that many from a bigger group',
  },
  {
    digits: FIRST_NUMBERS,
    wakeThem: false,
    tolerance: 0.1,
    name: 'First numbers: trace 1, 2, 3 or 7 in one stroke, then watch that many appear',
  },
  {
    digits: ZERO_TO_NINE,
    wakeThem: false,
    writeHowMany: true,
    tolerance: 0.085,
    name: 'Write how many: count a group of 0 to 9, tap the numeral that tells how many, then trace it',
  },
  {
    digits: ZERO_TO_NINE,
    wakeThem: false,
    fading: true,
    tolerance: 0.085,
    name: 'Less help each time: trace one numeral three times, with a solid trail, then dots, then only the start',
  },
  {
    digits: TEENS,
    wakeThem: false,
    teens: true,
    tolerance: 0.085,
    name: 'Ten, and some more: write 10 to 19, the 1 then the digit beside it, then see ten in a frame and count on',
  },
];

/**
 * Level 4 (First numbers) is an easy entry appended above the ladder: preschool plays 4, then 1, then 2, and `ENTRY_LEVELS`
 * lands a saved 4 on pre-K's first level after a birthday. No ID is renumbered.
 */
export const LEVELS: BandLevels = {
  preschool: { min: 1, max: 4, order: [4, 1, 2] },
  prek: { min: 2, max: 6, order: [2, 3, 5, 6] },
  // The school window (decided 2026-11-17, once the ten-frame layout probe passed): write how many, less help, then the teens.
  school: { min: 5, max: 7 },
};
export const ENTRY_LEVELS = [4] as const;

export const planFor = (level: number): TrailPlan =>
  PLANS[Math.min(PLANS.length, Math.max(1, Math.floor(level))) - 1];

/** The guide each try of a round shows: one solid try, or level 6's three with less help each time. */
const ONE_TRY = ['solid'] as const;
export const guidesFor = (level: number): readonly Guide[] => (planFor(level).fading ? GUIDES : ONE_TRY);

/**
 * Whether the second wander on a stroke counts a hint. The firefly shows the way every time it is due; on a fading round
 * only the first one in a try is counted, so three tries of a two-stroke numeral count at most three hints.
 */
export const TRY_HINTS = 1;
export const hintCounts = (level: number, wrongOnStroke: number, hintsThisTry: number): boolean =>
  hintDue(wrongOnStroke) && (!planFor(level).fading || hintsThisTry < TRY_HINTS);

/** The digits of a numeral, written left to right: 14 is a 1, then a 4. */
export const digitsOf = (n: number): number[] => String(n).split('').map(Number);

/** The numeral this round draws. */
export const numeralFor = (level: number, rng: Rng): number => rng.pick(planFor(level).digits);

/** The things that wait for her, each with the word for one and for more. Each is one object, so a picture is one count. */
export const THINGS = [
  { id: 'duck', one: 'duck', plural: 'ducks' },
  { id: 'apple', one: 'apple', plural: 'apples' },
  { id: 'star', one: 'star', plural: 'stars' },
  { id: 'orange', one: 'orange', plural: 'oranges' },
  { id: 'lemon', one: 'lemon', plural: 'lemons' },
  { id: 'pear', one: 'pear', plural: 'pears' },
  { id: 'flower', one: 'flower', plural: 'flowers' },
  { id: 'shell', one: 'shell', plural: 'shells' },
] as const;
export type ThingId = (typeof THINGS)[number]['id'];

export const thingFor = (rng: Rng) => rng.pick(THINGS);

/**
 * How the things sit: tidy rows, two rows, pairs (cards and counters: two side by side, pair under pair) or a ring. The
 * count is the same however they sit (K.CC.4b), so the arrangement is only a change of scene, never a different question.
 */
export const ARRANGEMENTS = ['rows', 'twoRows', 'pairs', 'ring'] as const;
export type Arrangement = (typeof ARRANGEMENTS)[number];

/**
 * A round's draws in a fixed order: the numeral, the thing, the ink's look (Letter Trails' `LOOKS`), then the arrangement.
 * Each later draw is only scenery, so adding it never changes the draws before it for a seed.
 */
export function roundFor(
  level: number,
  rng: Rng,
): { n: number; thing: (typeof THINGS)[number]; look: Look; arrangement: Arrangement } {
  const n = numeralFor(level, rng),
    thing = thingFor(rng),
    look = pickLook(rng);
  return { n, thing, look, arrangement: rng.pick(ARRANGEMENTS) };
}

/** Digits children often write backwards (1, 2, 3, 5, 6, 7, 9): a third card picks one when it can, to look at it again. */
export const REVERSED_OFTEN = [1, 2, 3, 5, 6, 7, 9] as const;

/**
 * Write how many: three numeral cards, the count `n` exactly once, a neighbour (n − 1 or n + 1, kept inside 0 to 9) and a
 * third, a digit often written backwards when one is left. Shuffled by the seed. Drawn after `roundFor`, so a seed keeps
 * its numeral, thing, look and arrangement.
 */
export function cardsFor(n: number, rng: Rng): number[] {
  const near = n === 0 ? 1 : n === 9 ? 8 : rng.pick([n - 1, n + 1]);
  const others = (pool: readonly number[]) => pool.filter((d) => d !== n && d !== near);
  const often = others(REVERSED_OFTEN);
  const third = rng.pick(often.length ? often : others([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]));
  return rng.shuffle([n, near, third]);
}

/** A wrong card is one miss; the second on a round glows the right card and counts one hint, once. */
export const CARD_GLOW_AT = 2;
export const cardHintDue = (wrongCards: number): boolean => wrongCards === CARD_GLOW_AT;

/** A numeral card: 140 by 160 units, its tap area the whole card. */
export const CARD_W = 140;
export const CARD_H = 160;
const CARD_GAP = 40;
/** The corner guide's square at the bottom left, which the card row keeps clear of. */
export const GUIDE_CLEAR = 200;

/**
 * Write how many lays out the group above a row of three cards along the bottom, the row to the right of the corner guide.
 * `things` is the room for the group; `cards` are the cards' centres.
 */
export function askLayout(view: { w: number; h: number }): {
  things: Rect;
  cards: { x: number; y: number }[];
} {
  const y = view.h - 30 - CARD_H / 2;
  const left = GUIDE_CLEAR + 10,
    right = view.w - 40;
  const mid = (left + right) / 2,
    pitch = CARD_W + CARD_GAP;
  return {
    things: { x: 150, y: 140, w: view.w - 190, h: view.h - 140 - (CARD_H + 30 + 20) - 30 },
    cards: [-1, 0, 1].map((i) => ({ x: mid + i * pitch, y })),
  };
}

/** What the voice calls `n` of a thing: "1 duck", "2 ducks", "0 ducks". */
export const thingWord = (thing: (typeof THINGS)[number], n: number): string =>
  n === 1 ? thing.one : thing.plural;

/** Most things on the screen at once. */
export const MAX_THINGS = 12;

/** In a waking round the group is the numeral and three more, so she counts the numeral out of a bigger group. The round ends by itself at the numeral, so no tap can overshoot. */
export const SPARE = 3;
export const groupSize = (n: number, wakeThem: boolean): number =>
  n === 0 ? 0 : wakeThem ? Math.min(MAX_THINGS, n + SPARE) : n;

/** A thing's tap circle has this radius: 120 units across on screen, the island's 100-unit minimum with room. */
export const THING_HIT = 60;
export const THING_GAP = 2 * THING_HIT + 8;

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

/**
 * `count` centers in rows of at most `perRow`, filled from the top-left and centered in `rect`, each at least `gap` from every
 * other. Null if the rect is too small to hold them, which the game treats as a bug (a test runs every view the island supports).
 */
export function thingSpots(count: number, rect: Rect, gap = THING_GAP): { x: number; y: number }[] | null {
  if (count === 0) return [];
  const across = Math.max(1, Math.floor((rect.w - 2 * THING_HIT) / gap) + 1);
  const rows = Math.ceil(count / Math.min(across, 5));
  const perRow = Math.ceil(count / rows);
  if (rows > 1 && (rows - 1) * gap + 2 * THING_HIT > rect.h) return null;
  if (rows === 1 && 2 * THING_HIT > rect.h) return null;
  const out: { x: number; y: number }[] = [];
  const top = rect.y + rect.h / 2 - ((rows - 1) * gap) / 2;
  for (let r = 0; r < rows; r++) {
    const inRow = Math.min(perRow, count - r * perRow);
    const left = rect.x + rect.w / 2 - ((inRow - 1) * gap) / 2;
    for (let c = 0; c < inRow; c++) out.push({ x: left + c * gap, y: top + r * gap });
  }
  return out;
}

type Spot = { x: number; y: number };

/** Exactly two rows, the top one the longer, centered in `rect`; from four things. */
function twoRowSpots(count: number, rect: Rect, gap: number): Spot[] | null {
  if (count < 4) return null;
  const top = Math.ceil(count / 2);
  if ((top - 1) * gap + 2 * THING_HIT > rect.w || gap + 2 * THING_HIT > rect.h) return null;
  const out: Spot[] = [];
  for (const [r, inRow] of [top, count - top].entries()) {
    const left = rect.x + rect.w / 2 - ((inRow - 1) * gap) / 2;
    for (let c = 0; c < inRow; c++) out.push({ x: left + c * gap, y: rect.y + rect.h / 2 + (r - 0.5) * gap });
  }
  return out;
}

/**
 * Cards and counters: two side by side, each pair under the last, an odd one alone on the left; columns of pairs sit a
 * half gap further apart than the two in a pair, so the pairs read as pairs. Counted down a column, then the next.
 */
function pairSpots(count: number, rect: Rect, gap: number): Spot[] | null {
  if (count < 2) return null;
  const pairs = Math.ceil(count / 2);
  const down = Math.min(5, Math.floor((rect.h - 2 * THING_HIT) / gap) + 1);
  if (down < 1) return null;
  const cols = Math.ceil(pairs / down),
    rows = Math.ceil(pairs / cols),
    pitch = 2.5 * gap;
  if ((cols - 1) * pitch + gap + 2 * THING_HIT > rect.w) return null;
  const left = rect.x + rect.w / 2 - ((cols - 1) * pitch + gap) / 2,
    top = rect.y + rect.h / 2 - ((rows - 1) * gap) / 2;
  const out: Spot[] = [];
  for (let i = 0; i < count; i++) {
    const pair = Math.floor(i / 2);
    out.push({
      x: left + Math.floor(pair / rows) * pitch + (i % 2) * gap,
      y: top + (pair % rows) * gap,
    });
  }
  return out;
}

/** A ring, counted clockwise from the top; from three things, never tighter than `gap` between neighbours. */
function ringSpots(count: number, rect: Rect, gap: number): Spot[] | null {
  if (count < 3) return null;
  const r = Math.max(gap / (2 * Math.sin(Math.PI / count)), 110);
  if (2 * (r + THING_HIT) > Math.min(rect.w, rect.h)) return null;
  const cx = rect.x + rect.w / 2,
    cy = rect.y + rect.h / 2;
  return Array.from({ length: count }, (_, i) => {
    const a = -Math.PI / 2 + (i * 2 * Math.PI) / count;
    return { x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r };
  });
}

/** Where `count` things sit in `arrangement`, or null when that arrangement does not suit the count or fit the room. */
export function arrangedSpots(
  arrangement: Arrangement,
  count: number,
  rect: Rect,
  gap = THING_GAP,
): Spot[] | null {
  if (count === 0) return [];
  if (arrangement === 'twoRows') return twoRowSpots(count, rect, gap);
  if (arrangement === 'pairs') return pairSpots(count, rect, gap);
  if (arrangement === 'ring') return ringSpots(count, rect, gap);
  return thingSpots(count, rect, gap);
}

/**
 * The round's arrangement when it suits the count and the room (a ring of twelve is too wide for a 1024 view, two rows of
 * six for a portrait one), otherwise tidy rows. Targets never shrink to make an arrangement fit.
 */
export const spotsFor = (arrangement: Arrangement, count: number, rect: Rect): Spot[] | null =>
  arrangedSpots(arrangement, count, rect) ?? thingSpots(count, rect);

/** Misses and hints for a trail: one miss per drag that leaves the corridor; a hint at the second in a row on one stroke. */
export const trailTolerance = (level: number): number => planFor(level).tolerance;

/**
 * The writing box, a square `size` units across at (`x`, `y`) on the stage, the same for every level. The game's `resize`
 * lays the canvas out from it, and the tens mark's test reads it.
 */
export function writingBox(view: { w: number; h: number }): { x: number; y: number; size: number } {
  const size = Math.min(view.h - 260, view.w - 360, 520);
  return { x: view.w / 2 - size / 2 + 35, y: (view.h - size) / 2 + 55, size };
}

/**
 * Ten, and some more: once the 1 is written, it slides this far left (in writing boxes), so it stands just in front of the
 * box as a finished mark and the second digit is written in the same box, at the same size and corridor, beside it.
 */
export const TENS_SHIFT = -0.56;

/** The finished 1's ink, as a line on the stage: from its top to its bottom, at `x`. */
export function tensMark(view: { w: number; h: number }): { x: number; top: number; bottom: number } {
  const box = writingBox(view);
  const x = box.x + (DIGIT_ONE_X + TENS_SHIFT) * box.size;
  return { x, top: box.y, bottom: box.y + box.size };
}
/** Where the 1's big line down sits in its writing box (`DIGITS[1]`). */
export const DIGIT_ONE_X = 0.5;

/**
 * A ten-frame is two rows of five cells. Ten, and some more lays out a full frame for the ten and, for 11 to 19, a second
 * frame stacked under it holding the rest, filled the same way (top row left to right, then the bottom row): the usual
 * picture of a teen. Nothing in it is tapped, so the cells may be smaller than a tap circle, but never under `FRAME_CELL_MIN`.
 */
export const FRAME_COLS = 5;
export const FRAME_ROWS = 2;
export const FRAME_CELL_MAX = THING_GAP;
export const FRAME_CELL_MIN = 100;
/** The gap between the two frames, in cells. */
export const FRAME_GAP = 0.4;

export interface TenFrames {
  /** A cell's side. */
  cell: number;
  /** Each frame's outline: one for 10, two for 11 to 19. */
  frames: Rect[];
  /** Where each thing sits: the first ten in the first frame, the rest in the second. */
  spots: Spot[];
}

/** The frames and spots for `n` (10 to 19) in `rect`, centered; null if a cell would fall under `FRAME_CELL_MIN`. */
export function tenFrames(n: number, rect: Rect): TenFrames | null {
  const count = n > 10 ? 2 : 1;
  const tall = FRAME_ROWS * count + FRAME_GAP * (count - 1);
  const cell = Math.min(FRAME_CELL_MAX, rect.w / FRAME_COLS, rect.h / tall);
  if (cell < FRAME_CELL_MIN) return null;
  const w = FRAME_COLS * cell,
    x = rect.x + (rect.w - w) / 2,
    top = rect.y + (rect.h - tall * cell) / 2;
  const frames = Array.from({ length: count }, (_, k) => ({
    x,
    y: top + k * (FRAME_ROWS + FRAME_GAP) * cell,
    w,
    h: FRAME_ROWS * cell,
  }));
  const spots = Array.from({ length: n }, (_, i) => {
    const f = frames[Math.floor(i / 10)],
      j = i % 10;
    return { x: f.x + ((j % FRAME_COLS) + 0.5) * cell, y: f.y + (Math.floor(j / FRAME_COLS) + 0.5) * cell };
  });
  return { cell, frames, spots };
}

/** The sticker's numeral for a seed, 0 to 9. */
export const stickerDigit = (seed: number): number => Math.floor(Math.abs(seed)) % 10;
