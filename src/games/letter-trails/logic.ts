import { nameLetters } from '../../learning/words/name-letters';
import type { Rng } from '../../engine/random';
import type { BandLevels } from '../../progress/difficulty';
import type { Tally } from '../../progress/coach';
import type { PictureWord } from '../word-monsters/logic';

export const PLANS = [
  { letters: 'ILT', name: 'Follow straight strokes: I, L, T' },
  { letters: 'EFH', name: 'More straight strokes: E, F, H' },
  { letters: 'AKMNVWXYZ', name: 'Follow diagonal strokes' },
  { letters: 'CGOQSU', name: 'Follow rounded strokes' },
  { letters: 'BDJPR', name: 'Combine straight and rounded strokes' },
  { letters: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', name: 'Explore all 26 capitals' },
  { letters: '', name: 'Trace a short word, then see its picture' },
  { letters: '', name: 'Trace the first eight letters of the child’s name' },
];
export const LEVELS: BandLevels = {
  preschool: { min: 1, max: 6 },
  prek: { min: 3, max: 8 },
  school: { min: 7, max: 8 },
};

/** The levels that trace several letters (a word, a name): their misses and hints count once per letter. */
export const WORD_LEVEL = 7;
export const NAME_LEVEL = 8;

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

/** What the round traces, in capitals: one letter, a short word, or the first eight letters of her name. */
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

export function trailTolerance(level: number): number {
  return trailLevel(level) <= 2 ? 0.095 : 0.075;
}

/**
 * The round's count for `ctx.finish`. One letter (levels 1–6) reports its misses and hints as they came; a word or a
 * name reports at most one miss and one hint per letter, so a long name steps her down no faster than a short word.
 */
export function roundTally(level: number, perLetter: readonly Tally[]): Tally {
  const capped = trailLevel(level) >= WORD_LEVEL;
  const sum = (key: keyof Tally) =>
    perLetter.reduce((n, t) => n + (capped ? Math.min(1, t[key]) : t[key]), 0);
  return { misses: sum('misses'), hints: sum('hints') };
}

export function stickerLetter(seed: number): string {
  return STICKER_LETTERS[Math.floor(Math.abs(seed)) % STICKER_LETTERS.length];
}
