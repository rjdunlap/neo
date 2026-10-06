import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import { knownMismatch, makeDeck } from './logic';

describe('memory matching', () => {
  it('has exactly two of every pair after shuffling, at every deck size', () => {
    for (const count of [2, 3, 4, 6, 8]) {
      const deck = makeDeck(count, new Rng(count));
      expect(deck).toHaveLength(count * 2);
      for (let pair = 0; pair < count; pair++) expect(deck.filter((c) => c.pair === pair).map((c) => c.side).sort()).toEqual([0, 1]);
    }
  });
  it('does not count exploration or matches as misses', () => {
    const deck = [{ pair: 0, side: 0 as const }, { pair: 0, side: 1 as const }, { pair: 1, side: 0 as const }, { pair: 1, side: 1 as const }];
    expect(knownMismatch(deck, 0, 2, new Set([0]))).toBe(false);
    expect(knownMismatch(deck, 0, 2, new Set([0, 1]))).toBe(true);
    expect(knownMismatch(deck, 0, 1, new Set([0, 1, 2, 3]))).toBe(false);
  });
});
