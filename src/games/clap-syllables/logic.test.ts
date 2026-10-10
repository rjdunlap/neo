import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import { FAMILIES } from '../rhyme-time/logic';
import { OWN_PICTURES } from './art';
import { MIN_TAP_GAP } from '../../engine/ghost';
import { answerOf, byCount, clapsToGo, clapsWord, makeQuestions, nextToSort, PAUSE, PLANS, pictureToTap, planFor, syllables, WORDS } from './logic';

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

  it('has one to four beats, with enough words of each size for every level', () => {
    expect(WORDS.every((x) => syllables(x) >= 1 && syllables(x) <= 4)).toBe(true);
    // A match round uses four 3-beat words at most; a sort needs one of each.
    expect(byCount(1).length).toBeGreaterThanOrEqual(8);
    expect(byCount(2).length).toBeGreaterThanOrEqual(5);
    expect(byCount(3).length).toBeGreaterThanOrEqual(5);
    expect(byCount(4).length).toBeGreaterThanOrEqual(2);
  });

  it('every word has a picture: one of Rhyme Time\'s or one drawn here', () => {
    for (const x of WORDS) expect(rhymeWords.has(x.word) || OWN_PICTURES.includes(x.word), x.word).toBe(true);
  });
});

describe('the levels', () => {
  it('are five, in order of how much they ask', () => {
    expect(PLANS.map((p) => p.mode)).toEqual(['along', 'solo', 'sort', 'match', 'sort']);
    expect(planFor(0)).toBe(PLANS[0]);
    expect(planFor(99)).toBe(PLANS[4]);
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
    for (const plan of PLANS.filter((p) => p.mode === 'sort')) {
      for (let seed = 1; seed <= 200; seed++) {
        const [q] = makeQuestions(plan, new Rng(seed));
        expect(q.words).toHaveLength(plan.count);
        const counts = q.words.map(syllables);
        for (let n = 1; n <= plan.max; n++) expect(counts.filter((c) => c === n).length).toBeGreaterThanOrEqual(1);
        expect(new Set(q.words.map((x) => x.word)).size).toBe(plan.count);
      }
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
  it('says one, two, three and four claps', () => {
    expect([1, 2, 3, 4].map(clapsWord)).toEqual(['one clap', 'two claps', 'three claps', 'four claps']);
  });
});

describe('the ghost finger (what the how-to card plays)', () => {
  it('claps each word once for each beat, and the gap between its claps is well inside the pause after which a word is counted', () => {
    for (const plan of PLANS.filter((p) => p.mode === 'along' || p.mode === 'solo')) {
      for (let seed = 1; seed <= 50; seed++) {
        for (const q of makeQuestions(plan, new Rng(seed))) {
          let claps = 0;
          while (clapsToGo(q.words[0], claps) > 0) claps++;
          expect(claps).toBe(syllables(q.words[0]));
        }
      }
    }
    // The hand returns to the pad, presses and lifts with no rest in between; resting the usual half second as well would leave the margin at a tenth of a second.
    expect(MIN_TAP_GAP + 0.5).toBeLessThan(PAUSE);
  });

  it('carries every picture to the hoop with as many claps as its name has beats, leaving none behind', () => {
    for (const plan of PLANS.filter((p) => p.mode === 'sort')) {
      for (let seed = 1; seed <= 100; seed++) {
        const [q] = makeQuestions(plan, new Rng(seed));
        const bins = Array.from({ length: plan.max }, (_, i) => ({ count: i + 1 }));
        const cards = q.words.map((word) => ({ word, sorted: false }));
        for (let next = nextToSort(cards, bins); next; next = nextToSort(cards, bins)) {
          expect(next.bin.count, next.card.word.word).toBe(syllables(next.card.word));
          next.card.sorted = true;
        }
        expect(cards.every((c) => c.sorted)).toBe(true);
      }
    }
  });

  it('taps the one picture whose name has the claps that were played', () => {
    const plan = PLANS.find((p) => p.mode === 'match')!;
    for (let seed = 1; seed <= 100; seed++) {
      for (const q of makeQuestions(plan, new Rng(seed))) {
        const cards = q.words.map((word) => ({ word }));
        expect(pictureToTap(q, cards)?.word).toBe(answerOf(q));
        expect(cards.filter((c) => syllables(c.word) === q.target)).toHaveLength(1);
      }
    }
  });
});
