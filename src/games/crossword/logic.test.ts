import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import { BLOCKED } from '../../learning/words/blocked';
import {
  applyHelp,
  bankFor,
  clueOf,
  crossings,
  decoysFor,
  emptyBlanks,
  firstOpen,
  helpFor,
  judge,
  key,
  lettersOf,
  makeRound,
  nearest,
  nextFill,
  PLANS,
  problems,
  riddleLine,
  solved,
  squaresOf,
  THEMES_3,
  wordRight,
  wordsAt,
  wrongSquares,
  WORDS_1,
  WORDS_2,
  WORDS_4,
  type Fills,
} from './logic';
import { SCRIPT } from '../../content/voice-script';
import { PICTURE_WORDS } from '../../learning/words/picture-words';

const SEEDS = 200;
const rev = (s: string) => s.split('').reverse().join('');

describe('word sets', () => {
  it('are free of blocked words, and sized as defined', () => {
    for (const w of WORDS_2) {
      expect(BLOCKED).not.toContain(w.toUpperCase());
      expect(BLOCKED).not.toContain(rev(w).toUpperCase());
    }
    expect(WORDS_1.length).toBe(13);
    expect(WORDS_1.every((w) => w.length === 3)).toBe(true);
    expect(WORDS_2.length).toBe(23);
    expect(WORDS_2).not.toContain('pip');
    expect(WORDS_2.every((w) => w.length >= 3 && w.length <= 4)).toBe(true);
  });

  it('give level 3 the three picture themes, every word drawn and free of blocked words', () => {
    expect(THEMES_3.map((t) => t.name)).toEqual(['Animal friends', 'By the pond', 'Look outside']);
    for (const t of THEMES_3) {
      expect(new Set(t.words).size).toBe(t.words.length);
      for (const w of t.words) {
        expect(WORDS_2).toContain(w);
        expect(BLOCKED).not.toContain(w.toUpperCase());
        expect(BLOCKED).not.toContain(rev(w).toUpperCase());
      }
    }
  });
});

describe('level 4 riddles', () => {
  const plan = PLANS[3];
  it('use 12 to 15 drawn words of three to five letters, each with its own riddle that never says the word', () => {
    expect(plan.riddles).toBe(true);
    expect(WORDS_4.length).toBeGreaterThanOrEqual(12);
    expect(WORDS_4.length).toBeLessThanOrEqual(15);
    expect(new Set(WORDS_4).size).toBe(WORDS_4.length);
    const riddles = new Set<string>();
    for (const w of WORDS_4) {
      expect(w.length >= 3 && w.length <= 5).toBe(true);
      expect(PICTURE_WORDS).toContain(w);
      expect(w).not.toBe('pip');
      expect(BLOCKED).not.toContain(w.toUpperCase());
      expect(BLOCKED).not.toContain(rev(w).toUpperCase());
      const line = (SCRIPT as Record<string, readonly string[]>)[riddleLine(w)];
      expect(line?.length).toBeGreaterThan(0);
      for (const say of line) expect(say.toLowerCase()).not.toMatch(new RegExp(`\\b${w}`));
      riddles.add(line[0]);
    }
    expect(riddles.size).toBe(WORDS_4.length);
  });

  it('give many different four-word grids', () => {
    const sets = new Set<string>();
    for (let s = 1; s <= 100; s++)
      sets.add(
        makeRound(plan, new Rng(s))[0]
          .words.map((w) => w.word)
          .sort()
          .join('+'),
      );
    expect(sets.size).toBeGreaterThan(15);
  });
});

describe('level 3 rounds', () => {
  const plan = PLANS[2];
  it('draw one theme, use only its words, and reach every theme with more than one grid', () => {
    const sets = new Map<string, Set<string>>();
    for (let s = 1; s <= 200; s++) {
      const [p, ...rest] = makeRound(plan, new Rng(s));
      expect(rest).toEqual([]);
      for (const w of p.words) expect(p.theme!.words).toContain(w.word);
      const got = sets.get(p.theme!.id) ?? new Set<string>();
      got.add(
        p.words
          .map((w) => w.word)
          .sort()
          .join('+'),
      );
      sets.set(p.theme!.id, got);
    }
    expect([...sets.keys()].sort()).toEqual(THEMES_3.map((t) => t.id).sort());
    for (const got of sets.values()) expect(got.size).toBeGreaterThan(1);
  });
});

describe.each(PLANS.filter((p) => !p.grown))('level $level puzzles', (plan) => {
  const rounds = Array.from({ length: SEEDS }, (_, s) => makeRound(plan, new Rng(s + 1)));

  it('are the same for the same seed', () => {
    expect(makeRound(plan, new Rng(7))).toEqual(makeRound(plan, new Rng(7)));
  });

  it('form valid rounds', () => {
    for (const round of rounds) {
      expect(round.length).toBe(plan.puzzles);
      const names = round.map((p) =>
        p.words
          .map((w) => w.word)
          .sort()
          .join('+'),
      );
      expect(new Set(names).size).toBe(names.length);
      for (const p of round) {
        expect(p.words.length).toBe(plan.count);
        expect(problems(p.words)).toEqual([]);
        expect(p.w).toBeLessThanOrEqual(plan.max);
        expect(p.h).toBeLessThanOrEqual(plan.max);
        const x = crossings(p.words);
        expect(x.length).toBe(plan.count - 1);
        const letters = lettersOf(p.words);
        p.words.forEach((w, i) => {
          expect(x.some((k) => wordsAt(p.words, k).includes(i))).toBe(true);
          const c = clueOf(w);
          expect(c.row >= 0 && c.col >= 0 && c.row < p.h && c.col < p.w).toBe(true);
          expect(letters.has(key(c.row, c.col))).toBe(false);
          for (const s of squaresOf(w)) expect(s.row < p.h && s.col < p.w).toBe(true);
        });
      }
    }
  });

  it('blank the right squares', () => {
    for (const round of rounds)
      for (const p of round) {
        const want = new Set(crossings(p.words));
        if (plan.blank === 'crossing-first') for (const w of p.words) want.add(squaresOf(w)[0].key);
        if (plan.blank === 'all') for (const k of lettersOf(p.words).keys()) want.add(k);
        expect([...p.blanks].sort()).toEqual([...want].sort());
      }
  });

  it('give a fair bank and can be filled from it', () => {
    for (let s = 0; s < SEEDS; s++) {
      const rng = new Rng(1000 + s);
      for (const p of rounds[s]) {
        p.words.forEach((_, i) => {
          const dec = decoysFor(plan, p, i, rng);
          expect(dec.length).toBe(plan.decoys);
          const bank = bankFor(p, new Map(), i, dec);
          const missing = emptyBlanks(p, new Map(), i).map((q) => q.letter);
          expect(bank.length).toBe(missing.length + plan.decoys);
          expect(bank.length).toBeLessThanOrEqual(plan.level === 1 ? 3 : plan.level === 2 ? 4 : 6);
          const pool = [...bank];
          for (const l of missing) {
            const at = pool.indexOf(l);
            expect(at).toBeGreaterThanOrEqual(0);
            pool.splice(at, 1);
          }
          for (const d of dec) expect(missing).not.toContain(d);
          if (plan.level === 1) {
            const k = p.blanks[0];
            for (const d of dec)
              for (const j of wordsAt(p.words, k)) {
                const w = squaresOf(p.words[j])
                  .map((t) => (t.key === k ? d : t.letter))
                  .join('');
                expect(WORDS_1).not.toContain(w);
              }
          }
        });
        // Fill everything from the banks.
        const rngB = new Rng(5000 + s);
        let fills: Fills = new Map();
        for (let n = 0; n < 50 && !solved(p, fills); n++) {
          const i = firstOpen(p, fills),
            f = nextFill(p, fills, i)!;
          const bank = bankFor(p, fills, i, decoysFor(plan, p, i, rngB));
          expect(bank).toContain(f.letter);
          fills = new Map(fills).set(f.key, f.letter);
        }
        expect(solved(p, fills)).toBe(true);
      }
    }
  });

  it('judge a crossing once for both words, and flag only wrong squares', () => {
    for (const round of rounds.slice(0, 60))
      for (const p of round) {
        const letters = lettersOf(p.words);
        for (const k of crossings(p.words)) {
          const both = wordsAt(p.words, k);
          expect(both.length).toBe(2);
          const fills = new Map<string, string>();
          for (const b of p.blanks)
            if (b !== k && !both.some((j) => squaresOf(p.words[j]).some((s) => s.key === b)))
              fills.set(b, letters.get(b)!);
          // Fill every other blank of the two words correctly, then the crossing.
          for (const j of both)
            for (const s of squaresOf(p.words[j]))
              if (p.blanks.includes(s.key) && s.key !== k) fills.set(s.key, s.letter);
          const ok = new Map(fills).set(k, letters.get(k)!);
          const r = judge(p, ok, k);
          expect(r.wrong).toEqual([]);
          expect(r.right.sort()).toEqual([...both].sort());
          const bad = new Map(fills).set(k, letters.get(k) === 'z' ? 'y' : 'z');
          const rb = judge(p, bad, k);
          expect(rb.wrong.sort()).toEqual([...both].sort());
          for (const j of rb.wrong) expect(wrongSquares(p, bad, j)).toContain(k);
          for (const j of both)
            for (const q of wrongSquares(p, bad, j)) expect(bad.get(q)).not.toBe(letters.get(q));
        }
      }
  });

  it('give help that is right, prefers crossings, clears wrong tiles and finishes the word', () => {
    for (let s = 0; s < SEEDS; s++) {
      const rng = new Rng(9000 + s);
      for (const p of rounds[s]) {
        const letters = lettersOf(p.words);
        const x = new Set(crossings(p.words));
        p.words.forEach((_, i) => {
          let fills: Fills = new Map();
          for (const b of p.blanks)
            if (rng.next() < 0.6)
              fills = new Map(fills).set(
                b,
                rng.next() < 0.7 ? (letters.get(b) === 'z' ? 'y' : 'z') : letters.get(b)!,
              );
          let n = 0;
          while (!wordRight(p, fills, i)) {
            expect(n++).toBeLessThan(10);
            const h = helpFor(p, fills, i)!;
            expect(h).not.toBeNull();
            expect(h.letter).toBe(letters.get(h.key));
            const open = squaresOf(p.words[i]).filter(
              (q) => p.blanks.includes(q.key) && fills.get(q.key) !== q.letter,
            );
            if (open.some((q) => x.has(q.key))) expect(x.has(h.key)).toBe(true);
            for (const j of wordsAt(p.words, h.key))
              for (const q of wrongSquares(p, fills, j)) expect(h.clear).toContain(q);
            fills = applyHelp(fills, h);
            for (const j of judge(p, fills, h.key).wrong) throw new Error(`help left word ${j} wrong`);
          }
          expect(helpFor(p, fills, i)).toBeNull();
        });
      }
    }
  });
});

describe('nearest', () => {
  const cs = [
    { x: 0, y: 0 },
    { x: 100, y: 0 },
    { x: 0, y: 100 },
  ];
  it('picks the closest within reach and null beyond', () => {
    expect(nearest(cs, 60, 5, 80)).toBe(cs[1]);
    expect(nearest(cs, 10, 10, 80)).toBe(cs[0]);
    expect(nearest(cs, 40, 40, 80)).toBe(cs[0]);
    expect(nearest(cs, 500, 500, 80)).toBeNull();
    expect(nearest([], 0, 0, 80)).toBeNull();
  });
});
