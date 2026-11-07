import type { Rng } from '../../engine/random';
import { BLOCKED } from '../../learning/words/blocked';
import { PICTURE_THEMES, THEMES } from '../../learning/words/themes';
import { CLUES_5 } from './clues';
import type { BandLevels } from '../../progress/difficulty';

/**
 * Crossword rules (docs/definitions/crossword.md). Little grids where one letter fills two words: at levels 1–4 each word has a
 * clue square just before its first letter (to its left across, above it down) holding the word's picture. Levels 5–6, the
 * grown-ups' written-clue grids, have no clue squares; their rules are in `grown.ts`. Each level's build writes only its own
 * word set.
 */

export type Dir = 'across' | 'down';

export interface Placed {
  word: string;
  row: number;
  col: number;
  dir: Dir;
}

export interface Puzzle {
  words: Placed[];
  /** Grid size including clue squares; every placed square lies in 0..w-1, 0..h-1. */
  w: number;
  h: number;
  /** Letter squares the child fills (keys from `key`). The rest are written in. */
  blanks: string[];
  /** The round's theme, for a themed level. */
  theme?: Theme;
}

export interface Plan {
  level: number;
  name: string;
  /** The level's word set. */
  words: readonly string[];
  puzzles: number;
  /** Words in each puzzle, each crossing one word placed before it. */
  count: number;
  /** A chain crosses each word with the one before; a free criss-cross with any word already placed. */
  layout: 'chain' | 'free';
  /** When set, a round draws one theme and its puzzles use only that theme's words. */
  themes?: readonly Theme[];
  /** Largest grid side, clue squares included. */
  max: number;
  /** Which squares are blank: only crossings, crossings and every word's first letter, or every letter square. */
  blank: 'crossing' | 'crossing-first' | 'all';
  /** Decoys added to the active word's missing letters in the bank. */
  decoys: number;
  /** The clue square holds a speaker: tapping it says the word's riddle, and Show me turns it into the picture. */
  riddles?: boolean;
  /** Levels 5–6, the grown-ups' crosswords (`grown.ts`): a free criss-cross of a theme's words, or a frozen 5 by 5 mini. */
  grown?: 'free' | 'mini';
}

/** Level 1: the 13 three-letter words of Pond Typing's picture words. */
export const WORDS_1 = ['hat', 'cat', 'dog', 'pig', 'hen', 'cow', 'bee', 'net', 'sun', 'mud', 'log', 'fox', 'bug'] as const;
/** Level 2: the 23 drawn picture words (Pip is left out), three or four letters. */
export const WORDS_2 = [...WORDS_1, 'nest', 'frog', 'duck', 'pond', 'leaf', 'moon', 'rain', 'cake', 'boat', 'tree'] as const;

export interface Theme {
  id: string;
  /** Said as the round's title. */
  name: string;
  words: readonly string[];
}

/**
 * Level 3: Word Search's three picture themes. Animal friends and By the pond share too few letters to cross four words in a
 * 6 by 6, so each gains drawn picture words from level 2's set that belong in it; every word has a picture.
 */
const MORE_3: Record<string, readonly string[]> = { animals: ['duck', 'frog', 'bee', 'bug'], 'pond-pictures': ['pond', 'mud', 'bug'] };
export const THEMES_3: readonly Theme[] = PICTURE_THEMES.map((t) => ({
  id: t.id, name: t.name, words: [...t.words.map((w) => w.toLowerCase()), ...(MORE_3[t.id] ?? [])],
}));
const WORDS_3 = [...new Set(THEMES_3.flatMap((t) => t.words))];

/**
 * Level 4: one authored set of drawn picture words, animals and things outside, each with one spoken riddle (`cw.riddle.<word>`
 * in the voice script). Every word already has a picture, so none needs new art.
 */
export const WORDS_4 = ['cow', 'pig', 'hen', 'duck', 'cat', 'dog', 'fox', 'frog', 'bee', 'sun', 'moon', 'rain', 'tree', 'boat', 'cake'] as const;

/** Level 5: three of Word Search's everyday themes, every word with a written clue (`clues.ts`). */
export const THEMES_5: readonly Theme[] = Object.keys(CLUES_5).map((id) => {
  const t = THEMES.find((x) => x.id === id)!;
  return { id, name: t.name, words: t.words.map((w) => w.toLowerCase()) };
});
const WORDS_5 = THEMES_5.flatMap((t) => t.words);

export const PLANS: readonly Plan[] = [
  { level: 1, name: 'One letter, two words', words: WORDS_1, puzzles: 3, count: 2, layout: 'chain', max: 4, blank: 'crossing', decoys: 2 },
  { level: 2, name: 'Two crossings', words: WORDS_2, puzzles: 2, count: 3, layout: 'chain', max: 5, blank: 'crossing-first', decoys: 1 },
  { level: 3, name: 'Picture criss-cross', words: WORDS_3, themes: THEMES_3, puzzles: 1, count: 4, layout: 'free', max: 6, blank: 'all', decoys: 2 },
  { level: 4, name: 'Say what it is', words: WORDS_4, puzzles: 1, count: 4, layout: 'free', max: 6, blank: 'all', decoys: 2, riddles: true },
  { level: 5, name: 'Written clues', words: WORDS_5, themes: THEMES_5, puzzles: 1, count: 8, layout: 'free', max: 8, blank: 'all', decoys: 0, grown: 'free' },
  { level: 6, name: 'The mini', words: [], puzzles: 1, count: 10, layout: 'free', max: 5, blank: 'all', decoys: 0, grown: 'mini' },
];

/** School starts one step above pre-K's opening; levels 5–6 are the grown-ups' written-clue grids (`grownup.ts`). */
export const LEVELS: BandLevels = {
  prek: { min: 1, max: 2 },
  school: { min: 2, max: 4 },
  grownup: { min: 5, max: 6 },
};

export const planFor = (level: number): Plan => PLANS[Math.max(0, Math.min(PLANS.length - 1, level - 1))];

export const key = (row: number, col: number) => `${row},${col}`;

/** The squares a word's letters sit on, in reading order. */
export function squaresOf(p: Placed): { row: number; col: number; key: string; letter: string }[] {
  return p.word.split('').map((letter, i) => {
    const row = p.dir === 'down' ? p.row + i : p.row;
    const col = p.dir === 'across' ? p.col + i : p.col;
    return { row, col, key: key(row, col), letter };
  });
}

/** The picture square before a word's first letter. */
export const clueOf = (p: Placed) => (p.dir === 'across' ? { row: p.row, col: p.col - 1 } : { row: p.row - 1, col: p.col });

/** Every letter square's right letter. */
export function lettersOf(words: readonly Placed[]): Map<string, string> {
  const m = new Map<string, string>();
  for (const w of words) for (const s of squaresOf(w)) m.set(s.key, s.letter);
  return m;
}

/** Squares two words share. */
export function crossings(words: readonly Placed[]): string[] {
  const seen = new Map<string, number>();
  for (const w of words) for (const s of squaresOf(w)) seen.set(s.key, (seen.get(s.key) ?? 0) + 1);
  return [...seen].filter(([, n]) => n > 1).map(([k]) => k);
}

/** Indices of the words that use a square. */
export const wordsAt = (words: readonly Placed[], k: string) => words.flatMap((w, i) => (squaresOf(w).some((s) => s.key === k) ? [i] : []));

const reads = (s: string) => [s.toUpperCase(), s.toUpperCase().split('').reverse().join('')];

/**
 * Why a layout is not allowed, or an empty list. Letters must agree where words cross; clue squares hold no letter and no other
 * clue; and every across or down run of two or more letter squares must be exactly one placed word, so no two words run
 * together, sit side by side, or spell something unlisted. No placed word reads as a blocked word either way.
 */
export function problems(words: readonly Placed[], opts: { clueSquares?: boolean } = {}): string[] {
  const out: string[] = [];
  const letters = new Map<string, string>();
  for (const w of words) for (const s of squaresOf(w)) {
    const had = letters.get(s.key);
    if (had && had !== s.letter) out.push(`${w.word} clashes at ${s.key}`);
    letters.set(s.key, s.letter);
  }
  const clues = new Set<string>();
  if (opts.clueSquares !== false) for (const w of words) {
    const c = clueOf(w), k = key(c.row, c.col);
    if (letters.has(k)) out.push(`${w.word}'s clue square holds a letter`);
    if (clues.has(k)) out.push(`${w.word}'s clue square is shared`);
    clues.add(k);
  }
  const listed = new Set(words.map((w) => `${w.dir}:${key(w.row, w.col)}:${w.word}`));
  const cells = [...letters.keys()].map((k) => k.split(',').map(Number) as [number, number]);
  for (const dir of ['across', 'down'] as const) {
    for (const [r, c] of cells) {
      const before = dir === 'across' ? key(r, c - 1) : key(r - 1, c);
      if (letters.has(before)) continue;
      let word = '', rr = r, cc = c;
      while (letters.has(key(rr, cc))) {
        word += letters.get(key(rr, cc));
        if (dir === 'across') cc++; else rr++;
      }
      if (word.length > 1 && !listed.has(`${dir}:${key(r, c)}:${word}`)) out.push(`unlisted ${dir} run ${word} at ${key(r, c)}`);
    }
  }
  for (const w of words) if (reads(w.word).some((x) => BLOCKED.includes(x))) out.push(`${w.word} reads as a blocked word`);
  // Every word crosses another, and they hang together as one grid.
  if (words.length > 1) {
    const reached = new Set([0]);
    for (let grew = true; grew; ) {
      grew = false;
      for (const i of reached) for (const k of squaresOf(words[i]).map((s) => s.key))
        for (const j of wordsAt(words, k)) if (!reached.has(j)) { reached.add(j); grew = true; }
    }
    if (reached.size < words.length) out.push('the words do not all cross');
  }
  return out;
}

/** Moves the layout so its top-left square (clue squares included) is (0, 0), and gives its size. */
function normalize(words: Placed[]): { words: Placed[]; w: number; h: number } {
  const all = words.flatMap((w) => [...squaresOf(w), clueOf(w)]);
  const r0 = Math.min(...all.map((s) => s.row)), c0 = Math.min(...all.map((s) => s.col));
  const r1 = Math.max(...all.map((s) => s.row)), c1 = Math.max(...all.map((s) => s.col));
  return { words: words.map((w) => ({ ...w, row: w.row - r0, col: w.col - c0 })), w: c1 - c0 + 1, h: r1 - r0 + 1 };
}

/** Lays `next` crossing `on` at every shared letter. */
function crossingsWith(on: Placed, next: string): Placed[] {
  const out: Placed[] = [];
  const dir: Dir = on.dir === 'across' ? 'down' : 'across';
  squaresOf(on).forEach((s) => {
    for (let j = 0; j < next.length; j++) {
      if (next[j] !== s.letter) continue;
      out.push(dir === 'down' ? { word: next, dir, row: s.row - j, col: s.col } : { word: next, dir, row: s.row, col: s.col - j });
    }
  });
  return out;
}

/** The squares she fills, in reading order. */
export function blanksFor(plan: Plan, words: readonly Placed[]): string[] {
  const keep = new Set(plan.blank === 'all' ? lettersOf(words).keys() : crossings(words));
  if (plan.blank === 'crossing-first') for (const w of words) keep.add(squaresOf(w)[0].key);
  const order = [...lettersOf(words).keys()].sort((a, b) => {
    const [ar, ac] = a.split(',').map(Number), [br, bc] = b.split(',').map(Number);
    return ar - br || ac - bc;
  });
  return order.filter((k) => keep.has(k));
}

/**
 * One puzzle of `plan.count` words, each crossing one word placed before it: the one just before in a chain, any of them in a
 * free criss-cross. Tries seeded choices until a layout passes `problems` and fits `plan.max` squares a side; `avoid` lists
 * word sets already used this round, and `words` narrows the level's set (a themed round).
 */
export function makePuzzle(plan: Plan, rng: Rng, avoid: ReadonlySet<string> = new Set(), words: readonly string[] = plan.words): Puzzle {
  for (let tries = 0; tries < 2000; tries++) {
    const first = rng.pick([...words]);
    let chain: Placed[] = [{ word: first, row: 0, col: 0, dir: rng.next() < 0.5 ? 'across' : 'down' }];
    for (let i = 1; i < plan.count && chain.length === i; i++) {
      const used = new Set(chain.map((w) => w.word));
      const on = plan.layout === 'chain' ? [chain[i - 1]] : chain;
      const options = rng.shuffle(words.filter((w) => !used.has(w)).flatMap((w) => on.flatMap((o) => crossingsWith(o, w))));
      const fit = options.find((o) => {
        const next = [...chain, o];
        return problems(next).length === 0 && crossings(next).length === i && sizeOk(next, plan.max);
      });
      if (fit) chain = [...chain, fit];
    }
    if (chain.length < plan.count) continue;
    if (avoid.has(pairName(chain))) continue;
    const n = normalize(chain);
    return { words: n.words, w: n.w, h: n.h, blanks: blanksFor(plan, n.words) };
  }
  throw new Error(`no crossword layout for level ${plan.level}`);
}

const sizeOk = (words: Placed[], max: number) => {
  const n = normalize(words);
  return n.w <= max && n.h <= max;
};

/** A round's word set, order-free, so a round does not repeat a puzzle. */
export const pairName = (words: readonly Placed[]) => words.map((w) => w.word).sort().join('+');

export function makeRound(plan: Plan, rng: Rng): Puzzle[] {
  const out: Puzzle[] = [];
  const used = new Set<string>();
  const theme = plan.themes ? rng.pick([...plan.themes]) : undefined;
  for (let i = 0; i < plan.puzzles; i++) {
    const p = { ...makePuzzle(plan, rng, used, theme?.words), theme };
    used.add(pairName(p.words));
    out.push(p);
  }
  return out;
}

/** What is in a blank square now: a letter, or nothing. */
export type Fills = ReadonlyMap<string, string>;

/** The letter a square shows: written in, or what she put there. */
export function shown(p: Puzzle, fills: Fills, k: string): string | undefined {
  return p.blanks.includes(k) ? fills.get(k) : lettersOf(p.words).get(k);
}

export const wordFull = (p: Puzzle, fills: Fills, i: number) => squaresOf(p.words[i]).every((s) => shown(p, fills, s.key) !== undefined);
export const wordRight = (p: Puzzle, fills: Fills, i: number) => squaresOf(p.words[i]).every((s) => shown(p, fills, s.key) === s.letter);
export const spelled = (p: Puzzle, fills: Fills, i: number) => squaresOf(p.words[i]).map((s) => shown(p, fills, s.key) ?? '').join('');
export const solved = (p: Puzzle, fills: Fills) => p.words.every((_, i) => wordRight(p, fills, i));

/** The blank squares of word `i` still empty. */
export const emptyBlanks = (p: Puzzle, fills: Fills, i: number) =>
  squaresOf(p.words[i]).filter((s) => p.blanks.includes(s.key) && !fills.has(s.key));

const ALPHABET = 'abcdefghijklmnoprstuwy'.split('');

/**
 * The decoys for word `i`: letters not among its missing letters. At level 1 a decoy in the crossing must not spell any
 * level word in either direction, so a wrong tile never makes another picture's name.
 */
export function decoysFor(plan: Plan, p: Puzzle, i: number, rng: Rng): string[] {
  const missing = new Set(squaresOf(p.words[i]).filter((s) => p.blanks.includes(s.key)).map((s) => s.letter));
  const pool = ALPHABET.filter((l) => !missing.has(l) && !spellsWord(plan, p, i, l));
  return rng.shuffle(pool).slice(0, plan.decoys);
}

/** Whether a letter in word `i`'s blanks would make any word through those blanks into a level word or a blocked word. */
function spellsWord(plan: Plan, p: Puzzle, i: number, letter: string): boolean {
  const right = lettersOf(p.words);
  for (const s of squaresOf(p.words[i]).filter((s) => p.blanks.includes(s.key))) {
    for (const j of wordsAt(p.words, s.key)) {
      const w = squaresOf(p.words[j]).map((t) => (t.key === s.key ? letter : right.get(t.key)!)).join('');
      if (plan.words.includes(w) || reads(w).some((x) => BLOCKED.includes(x))) return true;
    }
  }
  return false;
}

/** The bank while word `i` is active: the right letters for its empty blanks, then the decoys. */
export function bankFor(p: Puzzle, fills: Fills, i: number, decoys: readonly string[]): string[] {
  return [...emptyBlanks(p, fills, i).map((s) => s.letter), ...decoys];
}

/** The nearest square to (x, y) within `reach`, from `centers`; null if none is close enough. */
export function nearest<T extends { x: number; y: number }>(centers: readonly T[], x: number, y: number, reach: number): T | null {
  let best: T | null = null, d = reach * reach;
  for (const c of centers) {
    const dd = (c.x - x) ** 2 + (c.y - y) ** 2;
    if (dd <= d) { d = dd; best = c; }
  }
  return best;
}

export interface Judged {
  /** Words this fill completed, right ones first. */
  right: number[];
  wrong: number[];
}

/**
 * Judges the words through square `k` that are now full: called once per fill, so a crossing that completes two words is
 * judged once, and counts as one miss if either is wrong.
 */
export function judge(p: Puzzle, fills: Fills, k: string): Judged {
  const full = wordsAt(p.words, k).filter((i) => wordFull(p, fills, i));
  return { right: full.filter((i) => wordRight(p, fills, i)), wrong: full.filter((i) => !wordRight(p, fills, i)) };
}

/** After a wrong word: the squares whose wrong tiles hop back to the bank. Right letters and right crossings stay. */
export const wrongSquares = (p: Puzzle, fills: Fills, i: number) =>
  squaresOf(p.words[i]).filter((s) => fills.has(s.key) && fills.get(s.key) !== s.letter).map((s) => s.key);

/**
 * Help for word `i`: first the wrong tiles in every word that shares the square it picks are cleared (never a miss), then one
 * right letter goes into an empty blank, preferring a crossing. Returns the square and the squares cleared, or null when the
 * word is already right.
 */
export function helpFor(p: Puzzle, fills: Fills, i: number): { key: string; letter: string; clear: string[] } | null {
  const across = new Set(crossings(p.words));
  const open = squaresOf(p.words[i]).filter((s) => p.blanks.includes(s.key) && fills.get(s.key) !== s.letter);
  if (!open.length) return null;
  const pick = open.find((s) => across.has(s.key)) ?? open[0];
  const clear = new Set<string>();
  for (const j of wordsAt(p.words, pick.key)) for (const k of wrongSquares(p, fills, j)) clear.add(k);
  return { key: pick.key, letter: pick.letter, clear: [...clear] };
}

/** Applies Help's move to a copy of the fills. */
export function applyHelp(fills: Fills, h: { key: string; letter: string; clear: string[] }): Map<string, string> {
  const next = new Map(fills);
  for (const k of h.clear) next.delete(k);
  next.set(h.key, h.letter);
  return next;
}

/** The next square and letter the ghost finger fills for word `i`: its first empty blank. */
export const nextFill = (p: Puzzle, fills: Fills, i: number) => emptyBlanks(p, fills, i)[0] ?? null;

/** The first word not yet right, for Help or the ghost finger with nothing active. */
export const firstOpen = (p: Puzzle, fills: Fills) => p.words.findIndex((_, i) => !wordRight(p, fills, i));

/** Level 4's spoken riddle for a word. */
export const riddleLine = (word: string) => `cw.riddle.${word}`;
