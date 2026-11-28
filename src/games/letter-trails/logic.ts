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
  { letters: 'fqxz', name: 'The last four: f, q, x and z in the four-line frame' },
  {
    letters: 'abcdefghijklmnopqrstuvwxyz',
    name: 'Big and little: trace any little letter, with its capital shown beside it',
  },
  { letters: '', name: 'Little words: trace a short word in little letters, then see its picture' },
  {
    letters: '',
    name: 'My name, the way it is written: a capital first, then little letters (up to eight)',
  },
];
export const LEVELS: BandLevels = {
  preschool: { min: 1, max: 6 },
  prek: { min: 3, max: 10 },
  school: { min: 7, max: 17 },
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

/** Level 14 traces one of f q x z: a hooked stem and bar, a stem with a tail turning right, a cross, a zigzag. */
export const LAST_LEVEL = 14;

/** Level 15 traces any of the 26 little letters; its capital is ghosted beside the frame (shown, never judged). */
export const BIG_LEVEL = 15;

/** Level 16 traces one of level 7's short words in little letters, in the frame, and ends on the word's picture. */
export const LITTLE_WORD_LEVEL = 16;

/** Level 17 traces her name as it is written: a capital standing in the frame, then little letters. */
export const MY_NAME_LEVEL = 17;

/** Whether the round is traced in the four-line frame: every level from 10 (little letters, and level 17's capital). */
export const inFrame = (level: number): boolean => trailLevel(level) >= LITTLE_LEVEL;

/** A level that traces her name and ends on a sign with the whole of it: in capitals (8) or as it is written (17). */
export const nameLevel = (level: number): boolean => {
  const l = trailLevel(level);
  return l === NAME_LEVEL || l === MY_NAME_LEVEL;
};

/** A word or a name: several letters, each a short flourish, counted at most once per letter. Level 9 is one letter. */
export const severalLetters = (level: number): boolean => {
  const l = trailLevel(level);
  return l === WORD_LEVEL || l === LITTLE_WORD_LEVEL || nameLevel(l);
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

/**
 * What the round traces: one capital, a short word in capitals (7) or little letters (16), the first eight letters of
 * her name in capitals (8) or as it is written (17), or one little letter.
 */
export function trailWord(level: number, name: string, rng: Rng): string {
  const l = trailLevel(level);
  if (l === NAME_LEVEL) return fullName(name).slice(0, NAME_CAP);
  if (l === MY_NAME_LEVEL) return writtenName(name).slice(0, NAME_CAP);
  if (l === WORD_LEVEL) return rng.pick(SHORT_WORDS).toUpperCase();
  if (l === LITTLE_WORD_LEVEL) return rng.pick(SHORT_WORDS);
  return rng.pick(PLANS[l - 1].letters.split(''));
}

/** Her whole name in capitals, as level 8's closing sign shows it. */
export function fullName(name: string): string {
  return nameLetters(name);
}

/** Her whole name as it is written (level 17): a capital, then little letters. Accents fall away; PIP becomes Pip. */
export function writtenName(name: string): string {
  const all = fullName(name);
  return all[0] + all.slice(1).toLowerCase();
}

/** The closing sign's name: in capitals at level 8, as it is written at level 17. */
export function signName(level: number, name: string): string {
  return trailLevel(level) === MY_NAME_LEVEL ? writtenName(name) : fullName(name);
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
