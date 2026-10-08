import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import { FAMILIES } from '../rhyme-time/logic';
import { OWN_PICTURES } from './art';
import { answerOf, byCount, clapsWord, makeQuestions, PLANS, planFor, syllables, WORDS } from './logic';

const rhymeWords = new Set(Object.values(FAMILIES).flat());

describe('the words', () => {
  it('spell themselves from their beats, with no empty beat and no word twice', () => {
    for (const x of WORDS) {
      expect(x.parts.every((p) => p.length > 0), x.word).toBe(true);
      expect(x.parts.join('')).toBe(x.word);
      expect(syllables(x)).toBe(x.parts.length);
    }
    expect(new Set(WORDS.map((x) => x.word)).size).toBe(WORDS.length);
  });

  it('has one to three beats, with enough words of each size for every level', () => {
    expect(WORDS.every((x) => syllables(x) >= 1 && syllables(x) <= 3)).toBe(true);
    // A match round uses four 3-beat words at most; a sort needs one of each.
    expect(byCount(1).length).toBeGreaterThanOrEqual(8);
    expect(byCount(2).length).toBeGreaterThanOrEqual(5);
    expect(byCount(3).length).toBeGreaterThanOrEqual(5);
  });

  it('every word has a picture: one of Rhyme Time\'s or one drawn here', () => {
    for (const x of WORDS) expect(rhymeWords.has(x.word) || OWN_PICTURES.includes(x.word), x.word).toBe(true);
  });
});

describe('the levels', () => {
  it('are four, in order of how much they ask', () => {
    expect(PLANS.map((p) => p.mode)).toEqual(['along', 'solo', 'sort', 'match']);
    expect(planFor(0)).toBe(PLANS[0]);
    expect(planFor(99)).toBe(PLANS[3]);
  });

  it('clap along: words of one or two beats, both kinds present, none twice', () => {
    for (let seed = 1; seed <= 200; seed++) {
      const qs = makeQuestions(PLANS[0], new Rng(seed));
      expect(qs).toHaveLength(3);
      const counts = qs.map((q) => syllables(q.words[0]));
      expect(counts.every((n) => n <= 2)).toBe(true);
      expect(new Set(counts).size).toBe(2);
      expect(new Set(qs.map((q) => q.words[0].word)).size).toBe(3);
    }
  });

  it('clap yourself: one word of each size, in any order', () => {
    for (let seed = 1; seed <= 200; seed++) {
      const qs = makeQuestions(PLANS[1], new Rng(seed));
      expect(qs.map((q) => syllables(q.words[0])).sort()).toEqual([1, 2, 3]);
    }
  });

  it('sort: every bin gets at least one picture and no picture twice', () => {
    for (let seed = 1; seed <= 200; seed++) {
      const [q] = makeQuestions(PLANS[2], new Rng(seed));
      expect(q.words).toHaveLength(5);
      const counts = q.words.map(syllables);
      for (const n of [1, 2, 3]) expect(counts.filter((c) => c === n).length).toBeGreaterThanOrEqual(1);
      expect(new Set(q.words.map((x) => x.word)).size).toBe(5);
    }
  });

  it('match: each question shows one picture of each size, plays one of them, and has exactly one answer', () => {
    for (let seed = 1; seed <= 200; seed++) {
      const qs = makeQuestions(PLANS[3], new Rng(seed));
      expect(qs).toHaveLength(4);
      const seen = new Set<string>();
      for (const q of qs) {
        expect(q.words.map(syllables).sort()).toEqual([1, 2, 3]);
        expect([1, 2, 3]).toContain(q.target);
        expect(q.words.filter((x) => syllables(x) === q.target)).toHaveLength(1);
        expect(syllables(answerOf(q))).toBe(q.target);
        for (const x of q.words) {
          expect(seen.has(x.word), x.word).toBe(false);
          seen.add(x.word);
        }
      }
      // Not the same number of claps every time.
      expect(new Set(qs.map((q) => q.target)).size).toBeGreaterThanOrEqual(3);
    }
  });

  it('is the same for the same seed', () => {
    for (const plan of PLANS) expect(makeQuestions(plan, new Rng(7))).toEqual(makeQuestions(plan, new Rng(7)));
  });
});

describe('the spoken count', () => {
  it('says one clap, two claps, three claps', () => {
    expect([1, 2, 3].map(clapsWord)).toEqual(['one clap', 'two claps', 'three claps']);
  });
});
