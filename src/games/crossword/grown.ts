import type { Rng } from '../../engine/random';
import { BLOCKED } from '../../learning/words/blocked';
import { CLUES_5, MINIS, type Mini } from './clues';
import {
  crossings,
  key,
  lettersOf,
  problems,
  squaresOf,
  wordsAt,
  type Dir,
  type Placed,
  type Plan,
  type Theme,
} from './logic';

/**
 * Crossword levels 5–6, the grown-ups' grids (docs/definitions/crossword.md): written clues, no clue squares, an A–Z keyboard.
 * Level 5 lays a theme's words in a free criss-cross; level 6 is one of six frozen, fully checked 5 by 5 minis. Nothing is
 * judged until every square is filled.
 */

export interface GrownPuzzle {
  words: Placed[];
  /** Each word's written clue, by index. */
  clues: string[];
  w: number;
  h: number;
  /** Said and shown as the title: the theme's name, or "The mini". */
  title: string;
  /** The mini's id, or the theme's. */
  id: string;
}

/** Moves a layout so its top-left letter square is (0, 0), and gives its size (no clue squares here). */
function normalize(words: readonly Placed[]): { words: Placed[]; w: number; h: number } {
  const all = words.flatMap((w) => squaresOf(w));
  const r0 = Math.min(...all.map((s) => s.row)),
    c0 = Math.min(...all.map((s) => s.col));
  const r1 = Math.max(...all.map((s) => s.row)),
    c1 = Math.max(...all.map((s) => s.col));
  return {
    words: words.map((w) => ({ ...w, row: w.row - r0, col: w.col - c0 })),
    w: c1 - c0 + 1,
    h: r1 - r0 + 1,
  };
}

/** Every way to lay `word` crossing a placed word on a shared letter. */
function placements(on: readonly Placed[], word: string): Placed[] {
  const out: Placed[] = [];
  for (const o of on) {
    const dir: Dir = o.dir === 'across' ? 'down' : 'across';
    for (const s of squaresOf(o))
      for (let j = 0; j < word.length; j++) {
        if (word[j] !== s.letter) continue;
        out.push(
          dir === 'down'
            ? { word, dir, row: s.row - j, col: s.col }
            : { word, dir, row: s.row, col: s.col - j },
        );
      }
  }
  return out;
}

/** The fewest words a level-5 grid holds. */
export const MIN_FREE = 7;

/**
 * Level 5: a free criss-cross of up to `plan.count` words of one theme, at least `MIN_FREE`, within `plan.max` squares a side.
 * Words may cross more than one placed word; every run must still be exactly one listed word (`problems`).
 */
export function makeFree(plan: Plan, theme: Theme, rng: Rng): GrownPuzzle {
  const clues = CLUES_5[theme.id];
  for (let tries = 0; tries < 400; tries++) {
    const first = rng.pick(theme.words.filter((w) => w.length >= 5));
    let placed: Placed[] = [{ word: first, row: 0, col: 0, dir: rng.next() < 0.5 ? 'across' : 'down' }];
    for (const word of rng.shuffle(theme.words.filter((w) => w !== first))) {
      if (placed.length >= plan.count) break;
      const fit = rng.shuffle(placements(placed, word)).find((o) => {
        const next = [...placed, o];
        if (problems(next, { clueSquares: false }).length) return false;
        const n = normalize(next);
        return n.w <= plan.max && n.h <= plan.max;
      });
      if (fit) placed = [...placed, fit];
    }
    if (placed.length < MIN_FREE) continue;
    const n = normalize(placed);
    return {
      words: n.words,
      clues: n.words.map((w) => clues[w.word]),
      w: n.w,
      h: n.h,
      title: theme.name,
      id: theme.id,
    };
  }
  throw new Error(`no level 5 layout for ${theme.id}`);
}

/** A frozen mini's words: every across and down run of letters, in reading order. */
export function miniWords(mini: Mini): Placed[] {
  const out: Placed[] = [];
  const at = (r: number, c: number) => mini.rows[r]?.[c] ?? '#';
  const n = mini.rows.length;
  for (let r = 0; r < n; r++)
    for (let c = 0; c < n; c++) {
      if (at(r, c) === '#') continue;
      for (const dir of ['across', 'down'] as const) {
        const [dr, dc] = dir === 'across' ? [0, 1] : [1, 0];
        if (at(r - dr, c - dc) !== '#') continue;
        let word = '';
        for (let rr = r, cc = c; at(rr, cc) !== '#'; rr += dr, cc += dc) word += at(rr, cc);
        if (word.length > 1) out.push({ word, row: r, col: c, dir });
      }
    }
  return out;
}

export function makeMini(mini: Mini): GrownPuzzle {
  const words = miniWords(mini);
  return { words, clues: words.map((w) => mini.clues[w.word]), w: 5, h: 5, title: 'The mini', id: mini.id };
}

export function makeGrown(plan: Plan, rng: Rng): GrownPuzzle {
  if (plan.grown === 'mini') return makeMini(rng.pick([...MINIS]));
  return makeFree(plan, rng.pick([...(plan.themes ?? [])]), rng);
}

/** Crossword numbers: each square that starts a word, numbered in reading order. */
export function numbers(p: Pick<GrownPuzzle, 'words'>): Map<string, number> {
  const starts = [...new Set(p.words.map((w) => key(w.row, w.col)))].sort((a, b) => {
    const [ar, ac] = a.split(',').map(Number),
      [br, bc] = b.split(',').map(Number);
    return ar - br || ac - bc;
  });
  return new Map(starts.map((k, i) => [k, i + 1]));
}

/** "4 Down" for word `i`. */
export function clueName(p: GrownPuzzle, i: number): string {
  const w = p.words[i];
  return `${numbers(p).get(key(w.row, w.col))} ${w.dir === 'across' ? 'Across' : 'Down'}`;
}

const reads = (s: string) => [s.toUpperCase(), s.toUpperCase().split('').reverse().join('')];
/** Whether any run in the grid reads as a blocked word, either way. */
export const readsBlocked = (p: Pick<GrownPuzzle, 'words'>) =>
  p.words.some((w) => reads(w.word).some((x) => BLOCKED.includes(x)));

// Typing ----------------------------------------------------------------------------------

export type Fills = ReadonlyMap<string, string>;

export interface Cursor {
  key: string;
  dir: Dir;
  /** Only a player tap primes this square for a direction change. */
  tapped?: true;
}

/** The word through square `k` in `dir`, or -1. */
export const wordIn = (p: GrownPuzzle, k: string, dir: Dir) =>
  wordsAt(p.words, k).find((i) => p.words[i].dir === dir) ?? -1;

/** The selected word: the one through the cursor in its direction. */
export const activeWord = (p: GrownPuzzle, c: Cursor) => wordIn(p, c.key, c.dir);

/**
 * Keep the current direction when the tapped square has a word in it. Two consecutive taps on the same square turn to
 * its other word, if it has one.
 */
export function tapSquare(p: GrownPuzzle, c: Cursor | null, k: string): Cursor {
  const has = (d: Dir) => wordIn(p, k, d) >= 0;
  const dir = c?.dir ?? 'across';
  const other = dir === 'across' ? 'down' : 'across';
  const turn = c?.tapped && c.key === k;
  return { key: k, dir: has(other) && (turn || !has(dir)) ? other : dir, tapped: true };
}

/** The cursor at word `i`'s first square not yet filled (or its first square). */
export function cursorFor(p: GrownPuzzle, fills: Fills, i: number): Cursor {
  const sq = squaresOf(p.words[i]);
  return { key: (sq.find((s) => !fills.has(s.key)) ?? sq[0]).key, dir: p.words[i].dir };
}

/**
 * A letter typed at the cursor: it fills the square (unless Help revealed it) and the cursor moves to the next square of the
 * word that Help has not revealed, staying on the last.
 */
export function typeLetter(
  p: GrownPuzzle,
  fills: Fills,
  revealed: ReadonlySet<string>,
  c: Cursor,
  letter: string,
): { fills: Map<string, string>; cursor: Cursor } {
  const next = new Map(fills);
  if (!revealed.has(c.key)) next.set(c.key, letter.toLowerCase());
  const sq = squaresOf(p.words[activeWord(p, c)]);
  const after = sq.slice(sq.findIndex((s) => s.key === c.key) + 1).find((s) => !revealed.has(s.key));
  return { fills: next, cursor: { key: after?.key ?? c.key, dir: c.dir } };
}

/** Backspace clears the cursor's square, or when it is empty steps back one square in the word and clears that. */
export function backspace(
  p: GrownPuzzle,
  fills: Fills,
  revealed: ReadonlySet<string>,
  c: Cursor,
): { fills: Map<string, string>; cursor: Cursor } {
  const next = new Map(fills);
  const cursor: Cursor = { key: c.key, dir: c.dir };
  if (next.has(c.key) && !revealed.has(c.key)) {
    next.delete(c.key);
    return { fills: next, cursor };
  }
  const sq = squaresOf(p.words[activeWord(p, c)]);
  const before = sq
    .slice(
      0,
      sq.findIndex((s) => s.key === c.key),
    )
    .reverse()
    .find((s) => !revealed.has(s.key));
  if (!before) return { fills: next, cursor };
  next.delete(before.key);
  return { fills: next, cursor: { ...cursor, key: before.key } };
}

// Judging ---------------------------------------------------------------------------------

export const allFilled = (p: GrownPuzzle, fills: Fills) =>
  [...lettersOf(p.words).keys()].every((k) => fills.has(k));
export const wrongKeys = (p: GrownPuzzle, fills: Fills) =>
  [...lettersOf(p.words)].filter(([k, l]) => fills.get(k) !== l).map(([k]) => k);
export const grownSolved = (p: GrownPuzzle, fills: Fills) => wrongKeys(p, fills).length === 0;

/**
 * Whether the grid is judged now: every square is filled, and every square circled by the last check has changed since. So a
 * full grid is judged once, and after a wrong check no keystroke is judged until each circled square has been retyped: fixing
 * the grid costs at most one more miss, however many keys it takes.
 */
export const readyToCheck = (p: GrownPuzzle, fills: Fills, circled: ReadonlyMap<string, string>) =>
  allFilled(p, fills) && [...circled].every(([k, l]) => fills.get(k) !== l);

/** The circled squares still holding the letter they were circled with (a circle goes when its square changes). */
export const stillCircled = (fills: Fills, circled: ReadonlyMap<string, string>) =>
  [...circled].filter(([k, l]) => fills.get(k) === l).map(([k]) => k);

/**
 * A check of a full grid: right, or the wrong squares to circle with the letters they hold. One miss whatever the number of
 * wrong words.
 */
export function check(
  p: GrownPuzzle,
  fills: Fills,
): { right: true } | { right: false; circled: Map<string, string> } {
  const wrong = wrongKeys(p, fills);
  if (!wrong.length) return { right: true };
  return { right: false, circled: new Map(wrong.map((k) => [k, fills.get(k)!])) };
}

/**
 * Help reveals one right letter of word `i` (any word not yet right when `i` is), preferring a crossing square. Returns null
 * when the grid is right.
 */
export function grownHelp(
  p: GrownPuzzle,
  fills: Fills,
  i: number,
): { key: string; letter: string; word: number } | null {
  const open = (j: number) => squaresOf(p.words[j]).filter((s) => fills.get(s.key) !== s.letter);
  const word = i >= 0 && open(i).length ? i : p.words.findIndex((_, j) => open(j).length > 0);
  if (word < 0) return null;
  const across = new Set(crossings(p.words));
  const sq = open(word);
  const pick = sq.find((s) => across.has(s.key)) ?? sq[0];
  return { key: pick.key, letter: pick.letter, word };
}
