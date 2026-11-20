import { Rng } from '../../engine/random';
import type { BandLevels } from '../../progress/difficulty';
import { ANSWERS, POOL3, POOL4 } from './words';

/**
 * Word Code, after Wordle made gentle: a hidden word, and every try is marked letter by letter with Secret Code's marks (a
 * check in the right spot, a dot in the word but elsewhere, a cross not in the word). At school the hidden word is one of
 * four pictured words and the letters come from a small tray; at grown-up it is a five-letter word from a reviewed list.
 * A try is an experiment, never a mistake in itself: the only miss is ignoring a mark she can still see.
 */
export type Mark = 'green' | 'yellow' | 'gray';

export interface WordPlan {
  /** School's picture rounds (four candidates and a letter tray); grown-up is a free five-letter word. */
  picture: boolean;
  letters: number;
  pool: readonly string[];
  name: string;
}

export const PLANS: Readonly<Record<number, WordPlan>> = {
  1: {
    picture: true,
    letters: 3,
    pool: POOL3,
    name: 'Which picture word? Three letters, four pictures, one hidden',
  },
  2: {
    picture: true,
    letters: 4,
    pool: POOL4,
    name: 'Four-letter picture words: four pictures, one hidden',
  },
  3: {
    picture: false,
    letters: 5,
    pool: ANSWERS,
    name: 'Five-letter words: find the hidden word from the marks',
  },
};

/** School plays the picture words; the grown-up band has the one five-letter level, so adaptation has nowhere to move there. */
export const LEVELS: BandLevels = { school: { min: 1, max: 2 }, grownup: { min: 3, max: 3 } };
export const planFor = (level: number): WordPlan => PLANS[level] ?? PLANS[1];
export const describeLevel = (level: number): string => planFor(level).name;

export interface Try {
  word: string;
  marks: Mark[];
}

/**
 * The marks for a try, by the standard two-pass rule: checks first, then each remaining letter takes a dot while an
 * unmatched copy of it is left in the hidden word, else a cross.
 */
export function score(hidden: string, guess: string): Mark[] {
  const marks: Mark[] = Array(guess.length).fill('gray');
  const left = new Map<string, number>();
  for (let i = 0; i < hidden.length; i++) {
    if (guess[i] === hidden[i]) marks[i] = 'green';
    else left.set(hidden[i], (left.get(hidden[i]) ?? 0) + 1);
  }
  for (let i = 0; i < guess.length; i++) {
    if (marks[i] === 'green') continue;
    const n = left.get(guess[i]) ?? 0;
    if (n > 0) {
      marks[i] = 'yellow';
      left.set(guess[i], n - 1);
    }
  }
  return marks;
}

/** Letters the marks say are not in the word at all: a cross on a letter that earned no check or dot in its own try. */
export function absentLetters(history: readonly Try[]): Set<string> {
  const out = new Set<string>();
  for (const t of history)
    for (let i = 0; i < t.word.length; i++) {
      const l = t.word[i];
      if (t.marks[i] !== 'gray') continue;
      if (!t.word.split('').some((c, j) => c === l && t.marks[j] !== 'gray')) out.add(l);
    }
  return out;
}

/** The best mark known for each letter (a check beats a dot beats a cross), for the tray's and the keys' colors. */
export function bestMarks(history: readonly Try[]): Map<string, Mark> {
  const rank: Record<Mark, number> = { gray: 0, yellow: 1, green: 2 };
  const out = new Map<string, Mark>();
  for (const t of history)
    t.word.split('').forEach((l, i) => {
      const had = out.get(l);
      if (!had || rank[t.marks[i]] > rank[had]) out.set(l, t.marks[i]);
    });
  return out;
}

/** What an ignored mark was: a letter back in a spot it was marked out of, a dropped check, or a letter the marks ruled out. */
export interface Ignored {
  letter: string;
  kind: 'absent' | 'spot' | 'check';
}

/**
 * The only miss: submitting a try that ignores a mark still showing. A cross anywhere for a letter the marks say is absent, a
 * dot or cross spot used again for the same letter, or a visible check dropped from its spot. The first one found names the hint.
 */
export function ignoredMarks(shown: readonly Try[], guess: string): Ignored[] {
  const out: Ignored[] = [];
  const absent = absentLetters(shown);
  for (const t of shown)
    for (let i = 0; i < t.word.length; i++) {
      const l = t.word[i];
      if (t.marks[i] === 'green') {
        if (guess[i] !== l) out.push({ letter: l, kind: 'check' });
      } else if (guess[i] === l && !absent.has(l)) out.push({ letter: l, kind: 'spot' });
    }
  for (const l of guess.split('')) if (absent.has(l)) out.push({ letter: l, kind: 'absent' });
  const seen = new Set<string>();
  return out.filter((x) => !seen.has(x.kind + x.letter) && !!seen.add(x.kind + x.letter));
}

/** The latest tries that still fit on screen; a mark that has scrolled away never counts as ignored. */
export const visibleTries = <T>(history: readonly T[], fit: number): T[] => history.slice(-Math.max(1, fit));

/** Whether a word still fits every mark so far. */
export const consistent = (word: string, history: readonly Try[]): boolean =>
  history.every((t) => score(word, t.word).every((m, i) => m === t.marks[i]));

/** The hint: one letter of the hidden word in its place, the first spot no try has checked yet. */
export function hintFor(hidden: string, history: readonly Try[]): { index: number; letter: string } {
  const checked = (i: number) => history.some((t) => t.marks[i] === 'green');
  const at = hidden.split('').findIndex((_, i) => !checked(i));
  const index = at < 0 ? 0 : at;
  return { index, letter: hidden[index] };
}

// ---- School: four pictured candidates and a letter tray ---------------------------------------------------------------

export interface SchoolSet {
  words: string[];
  hidden: string;
  /** The distinct letters of the four words, in alphabetical order: the tray. */
  tray: string[];
}

export const trayOf = (words: readonly string[]): string[] => [...new Set(words.join('').split(''))].sort();

/** How many tries a solver that only tries candidates (the first one still allowed, in shown order) needs. */
export function candidateTries(words: readonly string[], hidden: string): number {
  const history: Try[] = [];
  for (;;) {
    const next = words.find((w) => consistent(w, history)) ?? hidden;
    history.push({ word: next, marks: score(hidden, next) });
    if (next === hidden) return history.length;
  }
}

/** The tray holds at most 12 letters (four to a row in three rows at 100 units), and a candidate-only solver needs three tries or fewer. */
export const TRAY_MAX = 12;
export const SCHOOL_TRIES = 3;
export const goodSet = (words: readonly string[], hidden: string): boolean =>
  trayOf(words).length <= TRAY_MAX && candidateTries(words, hidden) <= SCHOOL_TRIES;

/** A level's four distinct candidates from its own pool, one of them hidden, seeded. Sets that break the tray or tries bound are redrawn. */
export function schoolSet(plan: WordPlan, rng: Rng): SchoolSet {
  for (let attempt = 0; attempt < 200; attempt++) {
    const words = rng.shuffle([...plan.pool]).slice(0, 4);
    const hidden = rng.pick(words);
    if (goodSet(words, hidden)) return { words, hidden, tray: trayOf(words) };
  }
  // Deterministic fallback: the pool's first four words in order, whichever is last hidden (always within the bounds the test enumerates).
  const words = plan.pool.slice(0, 4).slice();
  return { words, hidden: words[3], tray: trayOf(words) };
}

// ---- Grown-up: the reference solver and the par rule --------------------------------------------------------------------

/** The recorded opener of the fixed reference solver. */
export const OPENER = 'STARE';

/**
 * The fixed reference solver's count of tries for a hidden answer: the recorded opener, then each next try is the
 * alphabetically first answer still consistent with every mark so far. A reference count for a later couch course, never a
 * target shown to her and never "the fewest possible".
 */
export function solverTries(hidden: string, answers: readonly string[] = ANSWERS): number {
  const history: Try[] = [];
  let guess = OPENER;
  for (let n = 1; n <= 40; n++) {
    history.push({ word: guess, marks: score(hidden, guess) });
    if (guess === hidden) return n;
    guess = answers.find((w) => consistent(w, history)) ?? hidden;
  }
  return 40;
}

/** The reference solver's par is reached within this many tries for every answer (a test checks the whole list). */
export const SOLVER_BOUND = 6;

/** A seeded hidden five-letter answer. */
export const pickAnswer = (rng: Rng, answers: readonly string[] = ANSWERS): string => rng.pick(answers);

/** The spoken ordinal for a spot, for the hint. */
export const ORDINALS = ['first', 'second', 'third', 'fourth', 'fifth'] as const;

/** Rows of past tries that fit above the entry row, for a view's height. */
export const rowsThatFit = (usable: number, pitch: number): number => Math.max(1, Math.floor(usable / pitch));
