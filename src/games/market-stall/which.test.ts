import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import { firstLevel, landing, levelsInOrder, rangeFor } from '../../progress/difficulty';
import { marketStall } from './index';
import {
  COIN_R,
  coinToName,
  coinWord,
  hasPips,
  LEVELS,
  makeOrders,
  pipCount,
  pips,
  planFor,
  showsTotal,
  target,
  WHICH_LEVEL,
} from './logic';

const plan = planFor(WHICH_LEVEL);

describe('Market Stall 14: Which coin?', () => {
  it('is level 14, placed between levels 2 and 3 for preschool and pre-K and left out of the school ladder', () => {
    expect(WHICH_LEVEL).toBe(14);
    expect(plan.mode).toBe('which');
    expect(plan.coins).toEqual([1, 2, 5]);
    expect(levelsInOrder(rangeFor(LEVELS, 'preschool'))).toEqual([1, 2, 14]);
    expect(levelsInOrder(rangeFor(LEVELS, 'prek'))).toEqual([2, 14, 15, 3, 4]);
    expect(levelsInOrder(rangeFor(LEVELS, 'school'))).not.toContain(14);
    expect(rangeFor(LEVELS, 'school').max).toBe(13);
    expect(marketStall.entryLevels).toEqual([14, 15]);
    expect(marketStall.describeLevel(14)).toMatch(/^Which coin\?/);
  });

  it('starts a new player at their band’s usual first level, and a school player carried at 14 at level 3', () => {
    expect(firstLevel(rangeFor(LEVELS, 'preschool'), marketStall.entryLevels)).toBe(1);
    expect(firstLevel(rangeFor(LEVELS, 'prek'), marketStall.entryLevels)).toBe(2);
    expect(landing(14, rangeFor(LEVELS, 'school'), marketStall.entryLevels)).toBe(3);
    expect(landing(14, rangeFor(LEVELS, 'prek'), marketStall.entryLevels)).toBe(14);
  });

  it('asks for one of the level’s coins each order, each coin at least once, never the same twice running', () => {
    for (let seed = 0; seed < 300; seed++) {
      const orders = makeOrders(plan, new Rng(seed));
      expect(orders).toHaveLength(plan.orders);
      const asks = orders.map((o) => o.ask!);
      for (const o of orders) {
        expect(plan.coins).toContain(o.ask);
        // The tag shows the asked worth, so the order's one price is the ask and the target is the ask.
        expect(o.prices).toEqual([o.ask]);
        expect(target(plan, o)).toBe(o.ask);
      }
      expect(new Set(asks)).toEqual(new Set(plan.coins));
      for (let i = 1; i < asks.length; i++) expect(asks[i]).not.toBe(asks[i - 1]);
    }
  });

  it('is reproducible from the seed', () => {
    expect(makeOrders(plan, new Rng(7))).toEqual(makeOrders(plan, new Rng(7)));
  });

  it('draws one pip per shell of worth on every coin, and a bigger coin is worth more', () => {
    expect(hasPips(WHICH_LEVEL)).toBe(true);
    expect(hasPips(4)).toBe(false);
    for (const v of plan.coins) expect(pips(v, COIN_R[v])).toHaveLength(v);
    const bySize = [...plan.coins].sort((a, b) => COIN_R[a] - COIN_R[b]);
    const byValue = [...plan.coins].sort((a, b) => a - b);
    expect(bySize).toEqual(byValue);
  });

  it('counts the pips aloud, names each coin, and says no running total', () => {
    expect(pipCount(5)).toBe('1, 2, 3, 4, 5');
    expect(pipCount(1)).toBe('1');
    expect(plan.coins.map(coinWord)).toEqual(['one', 'two', 'five']);
    expect(showsTotal(plan)).toBe(false);
    // The first-tap naming of a new coin belongs to the paying levels; here every tap names its coin itself.
    for (const v of plan.coins) expect(coinToName(WHICH_LEVEL, v, new Set())).toBeNull();
  });
});
