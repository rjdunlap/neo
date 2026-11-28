import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import { levelsInOrder, rangeFor } from '../../progress/difficulty';
import { fewest, LEVELS, planFor } from './logic';
import { isFewestTrade, makeTradeOrders, nextTrade, stuck, TRADE_COINS, trade, tradeTo } from './trade-logic';

const DENOMINATIONS = [1, 2, 5, 10];
const total = (heap: readonly number[]) => heap.reduce((n, coin) => n + coin, 0);
const sorted = (heap: readonly number[]) => [...heap].sort((a, b) => a - b);

/** Independently count the coins in the best exact amount by adding one denomination at a time. */
function minimumCounts(max: number): number[] {
  const counts = [0];
  for (let amount = 1; amount <= max; amount++) {
    counts.push(
      1 + Math.min(...DENOMINATIONS.filter((coin) => coin <= amount).map((coin) => counts[amount - coin])),
    );
  }
  return counts;
}

/** Try every subset of positions, then visit each resulting multiset only once. Every edge reduces the count. */
function referenceDistances(start: number[], minimum: number): Map<string, number> {
  const distances = new Map<string, number>();
  function visit(heap: number[]): number {
    const key = sorted(heap).join(',');
    const known = distances.get(key);
    if (known !== undefined) return known;
    let distance = heap.length === minimum ? 0 : Infinity;
    for (let mask = 1; mask < 2 ** heap.length; mask++) {
      const picked = heap.filter((_, i) => mask & (1 << i));
      const value = total(picked);
      if (picked.length < 2 || !DENOMINATIONS.includes(value)) continue;
      const remaining = heap.filter((_, i) => !(mask & (1 << i)));
      distance = Math.min(distance, 1 + visit([...remaining, value]));
    }
    distances.set(key, distance);
    return distance;
  }
  visit(start);
  return distances;
}

describe('Market Stall 13: Trade up', () => {
  it('keeps existing level IDs and places Trade up before Can I buy it? in the school ladder', () => {
    expect(levelsInOrder(rangeFor(LEVELS, 'preschool'))).toEqual([1, 2, 14]);
    expect(levelsInOrder(rangeFor(LEVELS, 'prek'))).toEqual([2, 14, 15, 3, 4]);
    expect(levelsInOrder(rangeFor(LEVELS, 'school'))).toEqual([3, 4, 5, 6, 7, 8, 9, 10, 11, 13, 12]);
    expect(planFor(12).mode).toBe('afford');
    expect(planFor(13).name).toMatch(/^Trade up/);
    expect(TRADE_COINS).toEqual(DENOMINATIONS);
  });

  it('starts at ten and follows with two reproducible amounts from 6 through 12, without consecutive repeats', () => {
    const amounts = new Set<number>();
    for (let seed = 1; seed <= 200; seed++) {
      const orders = makeTradeOrders(new Rng(seed));
      expect(orders).toEqual(makeTradeOrders(new Rng(seed)));
      expect(orders).toHaveLength(3);
      expect(orders[0]).toBe(10);
      for (let i = 1; i < orders.length; i++) {
        expect(orders[i]).toBeGreaterThanOrEqual(6);
        expect(orders[i]).toBeLessThanOrEqual(12);
        expect(orders[i]).not.toBe(orders[i - 1]);
        amounts.add(orders[i]);
      }
    }
    expect(sorted([...amounts])).toEqual([6, 7, 8, 9, 10, 11, 12]);
  });

  it('accepts every decomposition of 2, 5 or 10 into two or more coins', () => {
    for (let ones = 0; ones <= 12; ones++)
      for (let twos = 0; twos <= 6; twos++)
        for (let fives = 0; fives <= 2; fives++)
          for (let tens = 0; tens <= 1; tens++) {
            const selection = [
              ...Array<number>(ones).fill(1),
              ...Array<number>(twos).fill(2),
              ...Array<number>(fives).fill(5),
              ...Array<number>(tens).fill(10),
            ];
            const n = total(selection);
            expect(tradeTo(selection)).toBe(selection.length >= 2 && [2, 5, 10].includes(n) ? n : null);
          }
  });

  it('replaces only the selected coins and preserves the original heap for Undo', () => {
    const heap = Object.freeze([1, 2, 1, 2, 1]);
    expect(trade(heap, [1, 3, 4])).toEqual([1, 5, 1]);
    expect(trade(heap, [0, 1])).toBeNull();
    expect(trade(heap, [])).toBeNull();
    expect(trade(heap, [2])).toBeNull();
    expect(trade(heap, [0, 0])).toBeNull();
    expect(trade(heap, [0, heap.length])).toBeNull();
    expect(heap).toEqual([1, 2, 1, 2, 1]);
  });

  it('distinguishes a trapped heap of four twos from a complete or still solvable eight', () => {
    expect(stuck([2, 2, 2, 2])).toBe(true);
    expect(nextTrade([2, 2, 2, 2])).toBeNull();
    expect(isFewestTrade([2, 2, 2, 2])).toBe(false);
    expect(stuck([2, 1, 2, 1, 2])).toBe(false);
    expect(stuck([5, 2, 1])).toBe(false);
    expect(isFewestTrade([5, 2, 1])).toBe(true);
  });

  const minimums = minimumCounts(12);
  for (let amount = 6; amount <= 12; amount++) {
    it(`finds a shortest useful trade or an Undo hint for every reachable heap of ${amount}`, () => {
      const start = Array<number>(amount).fill(1);
      const minimum = minimums[amount];
      const goal = sorted(fewest(amount, DENOMINATIONS));
      const distances = referenceDistances(start, minimum);
      expect(goal).toHaveLength(minimum);
      expect(distances.get(start.join(','))).toBeLessThanOrEqual(amount === 12 ? 4 : 6);
      for (const [key, distance] of distances) {
        const ordered = key.split(',').map(Number);
        // The screen preserves its coin order, so hints must refer to positions in the supplied arrangement.
        const interleaved = ordered.flatMap((coin, i) => {
          if (i >= ordered.length / 2) return [];
          const opposite = ordered.length - 1 - i;
          return i === opposite ? [coin] : [coin, ordered[opposite]];
        });
        for (const heap of [ordered, [...ordered].reverse(), interleaved]) {
          expect(isFewestTrade(heap)).toBe(distance === 0);
          expect(stuck(heap)).toBe(distance === Infinity);
          const move = nextTrade(heap);
          if (distance === 0 || distance === Infinity) {
            expect(move).toBeNull();
            if (distance === 0) expect(ordered).toEqual(goal);
            continue;
          }
          expect(move).not.toBeNull();
          expect(new Set(move).size).toBe(move!.length);
          expect(move!.every((i) => Number.isInteger(i) && i >= 0 && i < heap.length)).toBe(true);
          const next = trade(heap, move!);
          expect(next).not.toBeNull();
          expect(total(next!)).toBe(amount);
          expect(next!.length).toBeLessThan(heap.length);
          expect(distances.get(sorted(next!).join(','))).toBe(distance - 1);
        }
      }
    });
  }
});
