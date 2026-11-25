import { nameLetters } from '../../learning/words/name-letters';
import type { Rng } from '../../engine/random';
import type { BandLevels } from '../../progress/difficulty';
import type { Tally } from '../../progress/coach';
import type { PictureWord } from '../word-monsters/logic';
import { GUIDES, hintDue, type Guide } from '../../learning/tracing/feedback';

export const PLANS = [
  { letters: 'ILT', name: 'Follow straight strokes: I, L, T' },
  { letters: 'EFH', name: 'More straight strokes: E, F, H' },
  { letters: 'AKMNVWXYZ', name: 'Follow diagonal strokes' },
  { letters: 'CGOQSU', name: 'Follow rounded strokes' },
  { letters: 'BDJPR', name: 'Combine straight and rounded strokes' },
  { letters: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', name: 'Explore all 26 capitals' },
  { letters: '', name: 'Trace a short word, then see its picture' },
  { letters: '', name: 'Trace the first eight letters of the child’s name' },
  {
    letters: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
    name: 'Less help each time: trace one capital three times, with a solid trail, then dots, then only the start',
  },
  { letters: 'cosvwt', name: 'Little letters like their capitals: c, o, s, v, w, t in a four-line frame' },
  { letters: 'adg', name: 'Magic c: a, d and g start with a little c, then a line' },
  { letters: 'uielkyj', name: 'Lines and hooks: u, i, e, l, k, y and j in the four-line frame' },
  { letters: 'prnmhb', name: 'Down, up and over: p, r, n, m, h and b in the four-line frame' },
];
export const LEVELS: BandLevels = {
  preschool: { min: 1, max: 6 },
  prek: { min: 3, max: 10 },
  school: { min: 7, max: 13 },
};

/** The levels that trace several letters (a word, a name): their misses and hints count once per letter. */
export const WORD_LEVEL = 7;
export const NAME_LEVEL = 8;
/** Level 9 traces one capital three times with less help each time (`GUIDES`). */
export const THREE_LEVEL = 9;
/** Level 10 traces one little letter (c o s v w t) in the four-line frame, its capital beside it. */
export const LITTLE_LEVEL = 10;

/** Level 11 traces one of a, d, g: a little c, then a line (a short one, a tall one, one that reaches below the base). */
export const MAGIC_LEVEL = 11;

/** Level 12 traces one of u i e l k y j: lines, hooks and dots (e starts in the middle of its round, not at the top). */
export const HOOKS_LEVEL = 12;

/** Level 13 traces one of p r n m h b: down a stem, back up it, then over in a hump or a bowl. */
export const OVER_LEVEL = 13;

/** Whether the round's letters are little letters, traced in the frame. */
export const inFrame = (level: number): boolean => {
  const l = trailLevel(level);
  return l === LITTLE_LEVEL || l === MAGIC_LEVEL || l === HOOKS_LEVEL || l === OVER_LEVEL;
};

/** A word or a name: several letters, each a short flourish, counted at most once per letter. Level 9 is one letter. */
export const severalLetters = (level: number): boolean => {
  const l = trailLevel(level);
  return l === WORD_LEVEL || l === NAME_LEVEL;
};

/** The guide each try of a round shows: one solid try, or level 9's three with less help each time. */
const ONE_TRY = ['solid'] as const;
export const guidesFor = (level: number): readonly Guide[] =>
  trailLevel(level) === THREE_LEVEL ? GUIDES : ONE_TRY;

/**
 * Whether the second wander on a stroke counts a hint. The firefly shows the way every time it is due; on level 9 only
 * the first one in a try is counted, so three tries of a three-stroke capital count at most three hints.
 */
export const TRY_HINTS = 1;
export const hintCounts = (level: number, wrongOnStroke: number, hintsThisTry: number): boolean =>
  hintDue(wrongOnStroke) && (guidesFor(level).length === 1 || hintsThisTry < TRY_HINTS);

/**
 * Level 7's words: Word Monsters' build words, each drawn by its picture table, so the round can end on the word's own
 * picture. A literal list (not that game's arrays), so a word Word Monsters adds never changes this pool unseen.
 */
export const SHORT_WORDS = [
  ...['cat', 'hat', 'map', 'bag'],
  ...['hen', 'net', 'pen', 'web'],
  ...['pig', 'pin', 'wig'],
  ...['dog', 'box', 'mop', 'log'],
  ...['sun', 'cup', 'rug', 'bus'],
] as const satisfies readonly PictureWord[];
export type ShortWord = (typeof SHORT_WORDS)[number];
export const STICKER_LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
/** A name is traced up to its eighth letter; the sign at the end shows the whole name. */
export const NAME_CAP = 8;

export function trailLevel(level: number): number {
  return Math.max(1, Math.min(PLANS.length, Math.floor(level)));
}

/** What the round traces: one capital, a short word or the first eight letters of her name in capitals, or one little letter. */
export function trailWord(level: number, name: string, rng: Rng): string {
  const l = trailLevel(level);
  return l === NAME_LEVEL
    ? fullName(name).slice(0, NAME_CAP)
    : l === WORD_LEVEL
      ? rng.pick(SHORT_WORDS).toUpperCase()
      : rng.pick(PLANS[l - 1].letters.split(''));
}

/** Her whole name in capitals, as the closing sign shows it. */
export function fullName(name: string): string {
  return nameLetters(name);
}

/**
 * How far from the trail a finger may stray (a share of the box; a wander is twice this). Little letters are about a
 * third the size of capitals, so theirs is tighter: twice it stays under a little o's radius (0.15), so the middle of
 * an o or a c is a wander and not a place to scribble.
 */
export const LITTLE_TOLERANCE = 0.06;
export function trailTolerance(level: number): number {
  return inFrame(level) ? LITTLE_TOLERANCE : trailLevel(level) <= 2 ? 0.095 : 0.075;
}

/**
 * The round's count for `ctx.finish`. One letter (levels 1–6) reports its misses and hints as they came; a word or a
 * name reports at most one miss and one hint per letter, so a long name steps her down no faster than a short word.
 */
export function roundTally(level: number, perLetter: readonly Tally[]): Tally {
  const capped = severalLetters(level);
  const sum = (key: keyof Tally) =>
    perLetter.reduce((n, t) => n + (capped ? Math.min(1, t[key]) : t[key]), 0);
  return { misses: sum('misses'), hints: sum('hints') };
}

export function stickerLetter(seed: number): string {
  return STICKER_LETTERS[Math.floor(Math.abs(seed)) % STICKER_LETTERS.length];
}
