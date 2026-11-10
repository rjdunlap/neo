import type { Rng } from '../../engine/random';
import type { BandLevels } from '../../progress/difficulty';
import { pickLook, type Look } from '../../learning/tracing/feedback';

/**
 * Number Trails: follow the firefly along a numeral, then meet that many things. The rules that a test can hold the
 * screen to live here: which numerals a level draws, how many things wait to be woken, where they sit, and what a tap does.
 */
export interface TrailPlan {
  /** The numerals this level draws from. */
  digits: readonly number[];
  /** After the trail, she wakes the things herself (counting as she taps) instead of watching them appear. */
  wakeThem: boolean;
  name: string;
}

const ONE_TO_FIVE = [1, 2, 3, 4, 5] as const;
const ZERO_TO_NINE = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9] as const;

export const PLANS: readonly TrailPlan[] = [
  { digits: ONE_TO_FIVE, wakeThem: false, name: 'Trace 1 to 5, then watch that many appear and count them' },
  { digits: ZERO_TO_NINE, wakeThem: false, name: 'Trace 0 to 9, then watch that many appear and count them' },
  {
    digits: ZERO_TO_NINE,
    wakeThem: true,
    name: 'Trace 0 to 9, then tap to wake exactly that many from a bigger group',
  },
];

export const LEVELS: BandLevels = { preschool: { min: 1, max: 2 }, prek: { min: 2, max: 3 } };

export const planFor = (level: number): TrailPlan =>
  PLANS[Math.min(PLANS.length, Math.max(1, Math.floor(level))) - 1];

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
export function trailTolerance(level: number): number {
  return Math.max(1, Math.floor(level)) <= 1 ? 0.1 : 0.085;
}

/** The sticker's numeral for a seed, 0 to 9. */
export const stickerDigit = (seed: number): number => Math.floor(Math.abs(seed)) % 10;
