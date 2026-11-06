import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import { BLOCKED } from '../word-search/blocked';
import { CLUES_5, MINIS } from './clues';
import {
  allFilled, backspace, check, grownHelp, grownSolved, makeFree, makeGrown, makeMini, MIN_FREE, miniWords, numbers, readyToCheck,
  tapSquare, typeLetter, wordIn, wrongKeys, type Cursor, type GrownPuzzle,
} from './grown';
import { key, lettersOf, planFor, problems, squaresOf, THEMES_5 } from './logic';

const SEEDS = 200;
const rev = (s: string) => s.split('').reverse().join('');
const blocked = (w: string) => BLOCKED.includes(w.toUpperCase()) || BLOCKED.includes(rev(w).toUpperCase());
const hasWhole = (clue: string, answer: string) => new RegExp(`\\b${answer}\\b`, 'i').test(clue);

const allPuzzles = (): GrownPuzzle[] => {
  const out: GrownPuzzle[] = [];
  for (let s = 0; s < 40; s++) {
    out.push(makeGrown(planFor(5), new Rng(s)), makeGrown(planFor(6), new Rng(s)));
  }
  return out;
};
const fillRight = (p: GrownPuzzle) => new Map(lettersOf(p.words));

describe('level 5 data', () => {
  it('has farm, kitchen, garden with about 44 words', () => {
    expect(THEMES_5.map((t) => t.id).sort()).toEqual(['farm', 'garden', 'kitchen']);
    const n = THEMES_5.reduce((a, t) => a + t.words.length, 0);
    expect(n).toBeGreaterThanOrEqual(40);
    expect(n).toBeLessThanOrEqual(48);
  });
  it('has a clue for every word and no stray clues', () => {
    for (const t of THEMES_5) {
      const clues = CLUES_5[t.id];
      expect(Object.keys(clues).sort()).toEqual([...t.words].sort());
      for (const w of t.words) expect(clues[w].trim().length).toBeGreaterThan(0);
    }
  });
  it('never gives the answer away, and has no blocked words', () => {
    for (const t of THEMES_5) for (const w of t.words) {
      expect(hasWhole(CLUES_5[t.id][w], w), `${t.id}/${w}`).toBe(false);
      expect(blocked(w), w).toBe(false);
    }
  });
});

describe('level 5 grids', () => {
  it('lays out every theme over many seeds', () => {
    const plan = planFor(5);
    for (const t of THEMES_5) for (let s = 0; s < SEEDS; s++) {
      const p = makeFree(plan, t, new Rng(s));
      const ws = p.words.map((w) => w.word);
      expect(ws.length).toBeGreaterThanOrEqual(MIN_FREE);
      expect(ws.length).toBeLessThanOrEqual(plan.count);
      expect(new Set(ws).size).toBe(ws.length);
      for (const w of ws) expect(t.words).toContain(w);
      expect(p.w).toBeLessThanOrEqual(8);
      expect(p.h).toBeLessThanOrEqual(8);
      expect(problems(p.words, { clueSquares: false })).toEqual([]);
      p.words.forEach((w, i) => {
        expect(p.clues[i]).toBe(CLUES_5[t.id][w.word]);
        expect(p.clues[i].length).toBeGreaterThan(0);
      });
      const inWord = new Set(p.words.flatMap((w) => squaresOf(w).map((q) => q.key)));
      for (const k of lettersOf(p.words).keys()) expect(inWord.has(k)).toBe(true);
      for (const q of inWord) {
        const [r, c] = q.split(',').map(Number);
        expect(r).toBeGreaterThanOrEqual(0); expect(c).toBeGreaterThanOrEqual(0);
        expect(r).toBeLessThan(p.h); expect(c).toBeLessThan(p.w);
      }
    }
  });
  it('is deterministic per seed', () => {
    for (let s = 0; s < 20; s++) {
      expect(makeGrown(planFor(5), new Rng(s))).toEqual(makeGrown(planFor(5), new Rng(s)));
    }
  });
});

describe('minis', () => {
  it('are six with distinct ids', () => {
    expect(MINIS.length).toBe(6);
    expect(new Set(MINIS.map((m) => m.id)).size).toBe(6);
  });
  for (const m of MINIS) {
    describe(m.id, () => {
      const at = (r: number, c: number) => m.rows[r]?.[c] ?? '#';
      it('is a symmetric 5 by 5 of letters and blocks', () => {
        expect(m.rows.length).toBe(5);
        for (const row of m.rows) expect(row).toMatch(/^[a-z#]{5}$/);
        for (let r = 0; r < 5; r++) for (let c = 0; c < 5; c++) {
          expect(at(r, c) === '#', `${r},${c}`).toBe(at(4 - r, 4 - c) === '#');
        }
      });
      it('is fully checked', () => {
        const words = miniWords(m);
        for (let r = 0; r < 5; r++) for (let c = 0; c < 5; c++) {
          if (at(r, c) === '#') continue;
          const k = key(r, c);
          const dirs = words.filter((w) => squaresOf(w).some((s) => s.key === k)).map((w) => w.dir);
          expect(dirs, k).toContain('across');
          expect(dirs, k).toContain('down');
        }
        for (const w of words) expect(w.word.length).toBeGreaterThanOrEqual(3);
        expect(words.length).toBeGreaterThanOrEqual(8);
        expect(words.length).toBeLessThanOrEqual(10);
      });
      it('has exactly the clues its words need, none giving the answer, no repeats, nothing blocked', () => {
        const ws = miniWords(m).map((w) => w.word);
        expect(new Set(ws).size).toBe(ws.length);
        expect([...ws].sort()).toEqual(Object.keys(m.clues).sort());
        for (const w of ws) {
          expect(blocked(w), w).toBe(false);
          expect(hasWhole(m.clues[w], w), w).toBe(false);
          expect(m.clues[w].trim().length).toBeGreaterThan(0);
        }
        const p = makeMini(m);
        p.words.forEach((w, i) => expect(p.clues[i]).toBe(m.clues[w.word]));
        expect(problems(p.words, { clueSquares: false })).toEqual([]);
      });
    });
  }
  it('level 6 picks every mini over seeds', () => {
    const seen = new Set<string>();
    for (let s = 0; s < SEEDS; s++) seen.add(makeGrown(planFor(6), new Rng(s)).id);
    expect(seen.size).toBe(6);
  });
});

describe('numbers', () => {
  it('start at 1, run in reading order and cover every word start', () => {
    for (const p of allPuzzles()) {
      const n = numbers(p);
      const entries = [...n].map(([k, v]) => ({ v, r: +k.split(',')[0], c: +k.split(',')[1] }));
      expect(entries.map((e) => e.v).sort((a, b) => a - b)).toEqual(entries.map((_, i) => i + 1));
      const byNum = [...entries].sort((a, b) => a.v - b.v);
      for (let i = 1; i < byNum.length; i++) {
        const a = byNum[i - 1], b = byNum[i];
        expect(a.r < b.r || (a.r === b.r && a.c < b.c)).toBe(true);
      }
      for (const w of p.words) expect(n.has(key(w.row, w.col))).toBe(true);
    }
  });
});

describe('typing', () => {
  const p = makeMini(MINIS[0]);
  const none = new Set<string>();
  const acrossOnly = () => {
    for (const q of allPuzzles()) for (const k of lettersOf(q.words).keys()) {
      const a = wordIn(q, k, 'across') >= 0, d = wordIn(q, k, 'down') >= 0;
      if (a !== d) return { q, k, a };
    }
    return null;
  };
  it('tap selects across first, toggles only when there is another word', () => {
    const k = key(2, 2);
    const c1 = tapSquare(p, null, k);
    expect(c1.dir).toBe('across');
    expect(tapSquare(p, c1, k).dir).toBe('down');
    expect(tapSquare(p, tapSquare(p, c1, k), k).dir).toBe('across');
    const lone = acrossOnly();
    expect(lone).not.toBeNull();
    const { q, k: lk, a } = lone!;
    const c = tapSquare(q, null, lk);
    expect(c.dir).toBe(a ? 'across' : 'down');
    expect(tapSquare(q, c, lk)).toEqual(c);
  });
  it('typing fills and advances, staying on the last square', () => {
    const w = p.words.findIndex((x) => x.dir === 'across' && x.word === 'boast');
    const sq = squaresOf(p.words[w]);
    let cur: Cursor = { key: sq[0].key, dir: 'across' };
    let fills = new Map<string, string>();
    for (let i = 0; i < 5; i++) {
      const r = typeLetter(p, fills, none, cur, 'X');
      fills = r.fills;
      expect(fills.get(sq[i].key)).toBe('x');
      expect(r.cursor.key).toBe(sq[Math.min(i + 1, 4)].key);
      cur = r.cursor;
    }
    expect(cur.key).toBe(sq[4].key);
  });
  it('skips revealed squares and never overwrites them', () => {
    const w = p.words.findIndex((x) => x.dir === 'across' && x.word === 'boast');
    const sq = squaresOf(p.words[w]);
    const revealed = new Set([sq[1].key]);
    const fills = new Map([[sq[1].key, sq[1].letter]]);
    const r = typeLetter(p, fills, revealed, { key: sq[0].key, dir: 'across' }, 'z');
    expect(r.cursor.key).toBe(sq[2].key);
    const r2 = typeLetter(p, fills, revealed, { key: sq[1].key, dir: 'across' }, 'z');
    expect(r2.fills.get(sq[1].key)).toBe(sq[1].letter);
    const r3 = backspace(p, fills, revealed, { key: sq[1].key, dir: 'across' });
    expect(r3.fills.get(sq[1].key)).toBe(sq[1].letter);
  });
  it('backspace clears the square, or steps back and clears when empty', () => {
    const w = p.words.findIndex((x) => x.dir === 'across' && x.word === 'boast');
    const sq = squaresOf(p.words[w]);
    const fills = new Map([[sq[0].key, 'a'], [sq[1].key, 'b']]);
    const r = backspace(p, fills, none, { key: sq[1].key, dir: 'across' });
    expect(r.fills.has(sq[1].key)).toBe(false);
    expect(r.fills.get(sq[0].key)).toBe('a');
    expect(r.cursor.key).toBe(sq[1].key);
    const r2 = backspace(p, fills, none, { key: sq[2].key, dir: 'across' });
    expect(r2.fills.has(sq[1].key)).toBe(false);
    expect(r2.cursor.key).toBe(sq[1].key);
    const r3 = backspace(p, new Map(), none, { key: sq[0].key, dir: 'across' });
    expect(r3.cursor.key).toBe(sq[0].key);
  });
});

describe('judging', () => {
  /** A wrong letter for a square, different from the right one and from `not`. */
  const wrongLetter = (right: string, not: string[] = []) => 'abcdefghijklmnopqrstuvwxyz'.split('').find((l) => l !== right && !not.includes(l))!;

  it('does not check until every square is filled', () => {
    for (const p of allPuzzles().slice(0, 20)) {
      const full = fillRight(p);
      expect(readyToCheck(p, full, new Map())).toBe(true);
      for (const k of full.keys()) {
        const part = new Map(full); part.delete(k);
        expect(allFilled(p, part)).toBe(false);
        expect(readyToCheck(p, part, new Map())).toBe(false);
      }
    }
  });
  it('circles exactly the wrong squares with their letters', () => {
    for (const p of allPuzzles()) {
      const f = fillRight(p);
      const ks = [...f.keys()];
      const bad = [ks[0], ks[ks.length - 1], ks[Math.floor(ks.length / 2)]];
      const expected = new Map<string, string>();
      for (const k of bad) { const l = wrongLetter(f.get(k)!); f.set(k, l); expected.set(k, l); }
      const r = check(p, f);
      expect(r.right).toBe(false);
      if (!r.right) expect(r.circled).toEqual(expected);
      expect(check(p, fillRight(p))).toEqual({ right: true });
    }
  });
  it('several wrong words are one check result', () => {
    const p = makeMini(MINIS[0]);
    const f = new Map([...lettersOf(p.words)].map(([k, l]) => [k, wrongLetter(l)]));
    const r = check(p, f);
    expect(r.right).toBe(false);
    if (!r.right) expect(r.circled.size).toBe(f.size);
  });

  /** Plays a grown-up who keeps overtyping `strategy` letters; returns misses. */
  function drive(p: GrownPuzzle, fills: Map<string, string>, strategy: (circled: Map<string, string>, step: number) => Array<[string, string]>): number {
    let misses = 0;
    let circled = new Map<string, string>();
    for (let step = 0; step < 200 && !grownSolved(p, fills); step++) {
      if (readyToCheck(p, fills, circled)) {
        const r = check(p, fills);
        if (r.right) break;
        misses++;
        circled = r.circled;
      }
      for (const [k, l] of strategy(circled, step)) fills.set(k, l);
    }
    return misses;
  }

  it('overtyping one circled square with more wrong letters costs at most one more miss', () => {
    for (const p of allPuzzles().slice(0, 30)) {
      const f = fillRight(p);
      const ks = [...f.keys()];
      for (const k of ks.slice(0, 4)) f.set(k, wrongLetter(f.get(k)!));
      const truth = lettersOf(p.words);
      const misses = drive(p, f, (circled, step) => {
        const live = [...circled].filter(([k, l]) => f.get(k) === l);
        if (!live.length) {
          // everything circled has changed; after one wrong retry, fix all
          return [...circled.keys()].map((k) => [k, truth.get(k)!] as [string, string]);
        }
        if (step < 3) {
          // overtype ONE circled square with another wrong letter
          const [k] = live[0];
          return [[k, wrongLetter(truth.get(k)!, [f.get(k)!])]];
        }
        return live.map(([k]) => [k, truth.get(k)!] as [string, string]);
      });
      expect(grownSolved(p, f)).toBe(true);
      expect(misses).toBeLessThanOrEqual(2);
    }
  });
  it('a single overtyped square alone never re-triggers a check while others are still circled', () => {
    const p = makeMini(MINIS[1]);
    const f = fillRight(p);
    const ks = [...f.keys()].slice(0, 3);
    const truth = lettersOf(p.words);
    for (const k of ks) f.set(k, wrongLetter(truth.get(k)!));
    const r = check(p, f);
    if (r.right) throw new Error('should be wrong');
    f.set(ks[0], wrongLetter(truth.get(ks[0])!, [f.get(ks[0])!]));
    expect(readyToCheck(p, f, r.circled)).toBe(false);
    f.set(ks[1], wrongLetter(truth.get(ks[1])!, [f.get(ks[1])!]));
    expect(readyToCheck(p, f, r.circled)).toBe(false);
    f.set(ks[2], truth.get(ks[2])!);
    expect(readyToCheck(p, f, r.circled)).toBe(true);
  });
  it('fixing every circled square ends solved within two misses', () => {
    for (const p of allPuzzles().slice(0, 30)) {
      const f = fillRight(p);
      for (const k of [...f.keys()].slice(0, 5)) f.set(k, wrongLetter(f.get(k)!));
      const truth = lettersOf(p.words);
      const misses = drive(p, f, (circled) => [...circled.keys()].map((k) => [k, truth.get(k)!] as [string, string]));
      expect(grownSolved(p, f)).toBe(true);
      expect(misses).toBeLessThanOrEqual(2);
    }
  });
});

describe('grownHelp', () => {
  it('gives a right letter in a square not already right, and null when solved', () => {
    for (const p of allPuzzles()) {
      const truth = lettersOf(p.words);
      expect(grownHelp(p, truth, 0)).toBeNull();
      const f = new Map<string, string>();
      const h = grownHelp(p, f, 0)!;
      expect(h.letter).toBe(truth.get(h.key));
      expect(h.word).toBe(0);
      expect(f.get(h.key)).not.toBe(h.letter);
    }
  });
  it('prefers a crossing square, and falls back to another open word', () => {
    for (const p of allPuzzles()) {
      const truth = lettersOf(p.words);
      const crossing = new Set<string>();
      const seen = new Set<string>();
      for (const w of p.words) for (const s of squaresOf(w)) { if (seen.has(s.key)) crossing.add(s.key); seen.add(s.key); }
      for (let i = 0; i < p.words.length; i++) {
        const open = squaresOf(p.words[i]);
        if (open.some((s) => crossing.has(s.key))) expect(crossing.has(grownHelp(p, new Map(), i)!.key)).toBe(true);
        // word i already right: help goes to another word that is not right
        const f = new Map(open.map((s) => [s.key, s.letter] as [string, string]));
        const h = grownHelp(p, f, i);
        if (wrongKeys(p, f).length) {
          expect(h).not.toBeNull();
          expect(h!.word).not.toBe(i);
          expect(truth.get(h!.key)).toBe(h!.letter);
          expect(f.get(h!.key)).not.toBe(h!.letter);
        }
      }
    }
  });
  it('repeated Help solves any grid within its letter-square count', () => {
    for (let s = 0; s < 60; s++) for (const level of [5, 6]) {
      const p = makeGrown(planFor(level), new Rng(s));
      const f = new Map<string, string>();
      const total = lettersOf(p.words).size;
      let steps = 0;
      for (let i = s % p.words.length; ; i = (i * 7 + 3) % p.words.length) {
        const h = grownHelp(p, f, i);
        if (!h) break;
        f.set(h.key, h.letter);
        if (++steps > total) break;
      }
      expect(steps).toBeLessThanOrEqual(total);
      expect(grownSolved(p, f)).toBe(true);
    }
  });
});
