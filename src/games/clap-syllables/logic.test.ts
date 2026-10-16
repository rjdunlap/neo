import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import { FAMILIES } from '../rhyme-time/logic';
import { OWN_PICTURES } from './art';
import { MIN_TAP_GAP } from '../../engine/ghost';
import { answerOf, byCount, CARS, COMPARE_PLAN, clapsToGo, clapsWord, fitsCar, makeQuestions, nextForTrain, nextToSort, PAUSE, PLANS, pictureToTap, planFor, syllables, trainCounts, waitFill, WORDS, type Word } from './logic';

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

  it('keeps dialect-dependent counts out (words whose beats people say differently)', () => {
    for (const x of ['fire', 'hour', 'every', 'chocolate', 'family', 'camera', 'vegetable', 'different']) expect(WORDS.some((y) => y.word === x), x).toBe(false);
  });

  it('every word has a picture: one of Rhyme Time\'s or one drawn here', () => {
    for (const x of WORDS) expect(rhymeWords.has(x.word) || OWN_PICTURES.includes(x.word), x.word).toBe(true);
  });
});

describe('the levels', () => {
  it('are six, in order of how much they ask', () => {
    expect(PLANS.map((p) => p.mode)).toEqual(['along', 'solo', 'sort', 'match', 'sort', 'train']);
    expect(planFor(0)).toBe(PLANS[0]);
    expect(planFor(99)).toBe(PLANS[5]);
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

  it('beat train: three trains of three pictures, each with an order to find, no picture twice in a round', () => {
    const plan = PLANS.find((p) => p.mode === 'train')!;
    const sizes = new Set<number>();
    for (let seed = 1; seed <= 500; seed++) {
      const qs = makeQuestions(plan, new Rng(seed));
      expect(qs).toHaveLength(plan.count);
      const all = qs.flatMap((q) => q.words);
      expect(all.every((x) => x !== undefined)).toBe(true);
      expect(new Set(all.map((x) => x.word)).size).toBe(all.length);
      for (const q of qs) {
        expect(q.words).toHaveLength(CARS);
        const counts = q.words.map(syllables);
        expect(new Set(counts).size).toBeGreaterThanOrEqual(2);
        counts.forEach((n) => sizes.add(n));
      }
    }
    expect([...sizes].sort()).toEqual([1, 2, 3, 4]);
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

  it('fills the wait ring across the pause and is empty before a first clap', () => {
    expect(waitFill(5, 0, 0)).toBe(0);
    expect(waitFill(10, 10, 1)).toBe(0);
    expect(waitFill(10 + PAUSE / 2, 10, 1)).toBeCloseTo(0.5);
    expect(waitFill(10 + PAUSE, 10, 2)).toBe(1);
    expect(waitFill(99, 10, 2)).toBe(1);
    expect(waitFill(9, 10, 2)).toBe(0);
  });
});

describe('the beat train', () => {
  const word = (s: string) => WORDS.find((x) => x.word === s)!;
  /** Load cars one picture at a time in the order given; false as soon as one does not fit. */
  const loads = (words: Word[], order: { word: Word; car: number }[]) => {
    const cars: (Word | undefined)[] = words.map(() => undefined);
    for (const { word, car } of order) {
      if (!fitsCar(words, cars, word, car)) return false;
      cars[car] = word;
    }
    return true;
  };

  it('accepts the fewest-to-most order, in any loading order, and nothing out of order', () => {
    const words = [word('banana'), word('cat'), word('apple')];
    expect(trainCounts(words)).toEqual([1, 2, 3]);
    expect(loads(words, [{ word: word('cat'), car: 0 }, { word: word('apple'), car: 1 }, { word: word('banana'), car: 2 }])).toBe(true);
    expect(loads(words, [{ word: word('banana'), car: 2 }, { word: word('cat'), car: 0 }, { word: word('apple'), car: 1 }])).toBe(true);
    expect(fitsCar(words, [undefined, undefined, undefined], word('banana'), 0)).toBe(false);
    expect(fitsCar(words, [undefined, undefined, undefined], word('cat'), 2)).toBe(false);
    // A full car takes nothing more, even a picture that would fit its place.
    expect(fitsCar(words, [word('cat'), undefined, undefined], word('cat'), 0)).toBe(false);
  });

  it('takes two pictures with the same claps either way round', () => {
    const words = [word('dog'), word('apple'), word('cat')];
    expect(loads(words, [{ word: word('cat'), car: 0 }, { word: word('dog'), car: 1 }, { word: word('apple'), car: 2 }])).toBe(true);
    expect(loads(words, [{ word: word('dog'), car: 0 }, { word: word('cat'), car: 1 }, { word: word('apple'), car: 2 }])).toBe(true);
  });

  it('the hint and the ghost finger always name a picture that fits the next car, and fill the train', () => {
    const plan = PLANS.find((p) => p.mode === 'train')!;
    for (let seed = 1; seed <= 200; seed++) {
      for (const q of makeQuestions(plan, new Rng(seed))) {
        const cars: (Word | undefined)[] = q.words.map(() => undefined);
        const cards = q.words.map((w) => ({ word: w, loaded: false }));
        for (let next = nextForTrain(q.words, cars, cards); next; next = nextForTrain(q.words, cars, cards)) {
          expect(fitsCar(q.words, cars, next.card.word, next.car)).toBe(true);
          expect(cars.findIndex((c) => !c)).toBe(next.car);
          cars[next.car] = next.card.word;
          next.card.loaded = true;
        }
        expect(cars.map((c) => syllables(c!))).toEqual(trainCounts(q.words));
      }
    }
  });

  it('still names a next picture when she has loaded a later car first', () => {
    const words = [word('banana'), word('cat'), word('apple')];
    const cars: (Word | undefined)[] = [undefined, undefined, word('banana')];
    const cards = words.map((w) => ({ word: w, loaded: w.word === 'banana' }));
    expect(nextForTrain(words, cars, cards)).toEqual({ card: cards[1], car: 0 });
  });
});


describe('longer or shorter, level 8', () => {
  it('keeps existing level IDs and skips unbuilt level 7 in school progression', async () => {
    const { clapSyllables } = await import('./index');
    const { levelsInOrder, nextLevelOffer, stepLevel } = await import('../../progress/difficulty');
    expect(planFor(8)).toBe(COMPARE_PLAN);
    expect(planFor(6)).toBe(PLANS[5]);
    expect(levelsInOrder(clapSyllables.levels('school'))).toEqual([5, 6, 8]);
    expect(nextLevelOffer(6, clapSyllables.levels('school'))).toBe(8);
    expect(stepLevel(8, -1, clapSyllables.levels('school'))).toBe(6);
    expect(clapSyllables.levels('preschool')).toEqual({ min: 1, max: 2 });
    expect(clapSyllables.levels('prek')).toEqual({ min: 2, max: 4 });
  });

  it('alternates seeded requests, with unequal pictured counts, unique words and an exact answer for hints and the finger', () => {
    const starts = new Set<string>();
    const positions = new Set<number>();
    const counts = new Set<number>();
    for (let seed = 1; seed <= 500; seed++) {
      const qs = makeQuestions(COMPARE_PLAN, new Rng(seed));
      expect(qs).toEqual(makeQuestions(COMPARE_PLAN, new Rng(seed)));
      expect(qs).toHaveLength(4);
      starts.add(qs[0].comparison!);
      const words = qs.flatMap((q) => q.words);
      expect(new Set(words).size).toBe(8);
      for (const [i, q] of qs.entries()) {
        expect(q.words).toHaveLength(2);
        const ns = q.words.map(syllables);
        ns.forEach((n) => counts.add(n));
        expect(new Set(ns).size).toBe(2);
        if (i > 0) expect(q.comparison).not.toBe(qs[i - 1].comparison);
        const wanted = q.comparison === 'more' ? Math.max(...ns) : Math.min(...ns);
        expect(q.target).toBe(wanted);
        const cards = q.words.map((word) => ({ word }));
        const answer = pictureToTap(q, cards)!;
        expect(syllables(answer.word)).toBe(wanted);
        expect(answer.word).toBe(answerOf(q));
        positions.add(cards.indexOf(answer));
        expect(q.words.filter((w) => syllables(w) === wanted)).toHaveLength(1);
      }
    }
    expect([...starts].sort()).toEqual(['fewer', 'more']);
    expect([...positions].sort()).toEqual([0, 1]);
    expect([...counts].sort()).toEqual([1, 2, 3, 4]);
  });
});
