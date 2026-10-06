import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import { anotherWay, fewest, makeOrders, PAID, PLANS, sameWay, sum, target } from './logic';

describe('Market Stall', () => {
  it('asks for amounts from 1 to 10 that the level\'s coins can make, never the same twice running', () => {
    for (const plan of PLANS) {
      for (let seed = 1; seed <= 300; seed++) {
        const orders = makeOrders(plan, new Rng(seed));
        expect(orders).toHaveLength(plan.orders);
        orders.forEach((o, i) => {
          const t = target(plan, o);
          expect(t).toBeGreaterThanOrEqual(1);
          expect(t).toBeLessThanOrEqual(10);
          expect(sum(fewest(t, plan.coins))).toBe(t);
          for (const p of o.prices) expect(p).toBeGreaterThanOrEqual(plan.price[0]), expect(p).toBeLessThanOrEqual(plan.price[1]);
          if (i > 0) expect(t).not.toBe(target(plan, orders[i - 1]));
          if (plan.mode === 'pair') expect(o.prices).toHaveLength(2);
          if (plan.mode === 'change') expect(t).toBe(PAID - o.prices[0]);
        });
      }
    }
  });

  it('suggests the fewest coins, and a genuinely different second way to pay', () => {
    expect(fewest(8, [1, 2, 5])).toEqual([5, 2, 1]);
    expect(fewest(4, [1])).toEqual([1, 1, 1, 1]);
    expect(sameWay([5, 2, 1], [1, 5, 2])).toBe(true);
    for (let amount = 2; amount <= 10; amount++) {
      for (const first of [fewest(amount, [1, 2, 5]), Array(amount).fill(1)]) {
        const second = anotherWay(amount, [1, 2, 5], first);
        expect(sum(second)).toBe(amount);
        expect(sameWay(second, first)).toBe(false);
      }
    }
  });
});
