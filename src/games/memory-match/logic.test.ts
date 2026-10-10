import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import { knownMismatch, makeDeck, nextCard, NUMBER_WORDS, numberWord } from './logic';

describe('memory matching', () => {
  it('has exactly two of every pair after shuffling, at every deck size', () => {
    for (const count of [2, 3, 4, 6, 8]) {
      const deck = makeDeck(count, new Rng(count));
      expect(deck).toHaveLength(count * 2);
      for (let pair = 0; pair < count; pair++) expect(deck.filter((c) => c.pair === pair).map((c) => c.side).sort()).toEqual([0, 1]);
    }
  });
  it('pairs every written number from one through ten with its numeral', () => {
    expect(NUMBER_WORDS).toEqual(['one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten']);
    expect(NUMBER_WORDS.map((_, pair) => numberWord(pair))).toEqual(NUMBER_WORDS);
    expect(numberWord(-1)).toBe('');
    expect(numberWord(10)).toBe('');
  });
  it('does not count exploration or matches as misses', () => {
    const deck = [{ pair: 0, side: 0 as const }, { pair: 0, side: 1 as const }, { pair: 1, side: 0 as const }, { pair: 1, side: 1 as const }];
    expect(knownMismatch(deck, 0, 2, new Set([0]))).toBe(false);
    expect(knownMismatch(deck, 0, 2, new Set([0, 1]))).toBe(true);
    expect(knownMismatch(deck, 0, 1, new Set([0, 1, 2, 3]))).toBe(false);
  });
  it('has a player who remembers always finish a deck, turning each card a few times at most, and never a matched card', () => {
    for (const pairs of [2, 3, 4, 6, 8, 10]) {
      for (let seed = 1; seed <= 60; seed++) {
        const cards = makeDeck(pairs, new Rng(seed));
        const seen = new Set<number>();
        const done = new Set<number>();
        let first: number | null = null;
        let flips = 0;
        while (done.size < cards.length && flips < pairs * 6) {
          const pick = nextCard(cards, seen, (k) => done.has(k), first);
          expect(pick, `${pairs} pairs seed ${seed}`).toBeGreaterThanOrEqual(0);
          expect(done.has(pick)).toBe(false);
          expect(pick).not.toBe(first);
          flips++;
          if (first === null) {
            first = pick;
            seen.add(pick);
            continue;
          }
          if (cards[first].pair === cards[pick].pair) {
            done.add(first);
            done.add(pick);
          } else {
            // No penalty is ever earned: the second card is a mismatch only when the first one's partner was not known.
            expect(knownMismatch(cards, first, pick, seen)).toBe(false);
          }
          seen.add(pick);
          first = null;
        }
        expect(done.size, `${pairs} pairs seed ${seed}`).toBe(cards.length);
        // Turning a pair takes two flips; a mismatch costs two more, and a remembering player has at most one per pair.
        expect(flips).toBeLessThanOrEqual(pairs * 4);
      }
    }
  });
});
