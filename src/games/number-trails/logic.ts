import type { Rng } from '../../engine/random';
import type { BandLevels } from '../../progress/difficulty';

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
  { digits: ZERO_TO_NINE, wakeThem: true, name: 'Trace 0 to 9, then tap to wake exactly that many from a bigger group' },
];

export const LEVELS: BandLevels = { preschool: { min: 1, max: 2 }, prek: { min: 2, max: 3 } };

export const planFor = (level: number): TrailPlan => PLANS[Math.min(PLANS.length, Math.max(1, Math.floor(level))) - 1];

/** The numeral this round draws. */
export const numeralFor = (level: number, rng: Rng): number => rng.pick(planFor(level).digits);

/** The things that wait for her: each has a spoken plural. */
export const THINGS = [
  { id: 'duck', plural: 'ducks' },
  { id: 'apple', plural: 'apples' },
  { id: 'star', plural: 'stars' },
] as const;
export type ThingId = (typeof THINGS)[number]['id'];

export const thingFor = (rng: Rng) => rng.pick(THINGS);

/** Most things on the screen at once. */
export const MAX_THINGS = 12;

/** In a waking round the group is the numeral and three more, so stopping at the numeral is a real choice. */
export const SPARE = 3;
export const groupSize = (n: number, wakeThem: boolean): number => (n === 0 ? 0 : wakeThem ? Math.min(MAX_THINGS, n + SPARE) : n);

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

/** What a tap on a waiting thing does: wake it, or say that the count is already right. */
export type TapOutcome = 'wake' | 'enough';
export const tapOutcome = (woken: number, n: number): TapOutcome => (woken < n ? 'wake' : 'enough');

/** Misses and hints for a trail: one miss per drag that leaves the corridor; a hint at the second in a row on one stroke. */
export function trailTolerance(level: number): number {
  return Math.max(1, Math.floor(level)) <= 1 ? 0.1 : 0.085;
}

/** The sticker's numeral for a seed, 0 to 9. */
export const stickerDigit = (seed: number): number => Math.floor(Math.abs(seed)) % 10;
