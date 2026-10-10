import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import { anotherWay, fewest, makeOrders, PAID, paymentFor, payTouch, PLANS, sameWay, sum, target, usesFewestCoins } from './logic';

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

  it('makes every fewest-coins price with a minimum-size payment, while a longer exact payment is not enough', () => {
    const plan = PLANS.find((entry) => entry.mode === 'fewest')!;
    for (let amount = plan.price[0]; amount <= plan.price[1]; amount++) {
      const payment = fewest(amount, plan.coins);
      expect(usesFewestCoins(amount, plan.coins, payment)).toBe(true);
      expect(usesFewestCoins(amount, plan.coins, Array(amount).fill(1))).toBe(false);
    }
  });

  it("pays every order exactly with coins the counter has room for, the second way different from the first, so the demonstration never bounces", () => {
    for (const plan of PLANS) {
      for (let seed = 1; seed <= 100; seed++) {
        for (const order of makeOrders(plan, new Rng(seed))) {
          const want = target(plan, order);
          let firstWay: number[] | null = null;
          for (let way = 0; way < (plan.mode === 'ways' ? 2 : 1); way++) {
            const pay = paymentFor(plan, order, firstWay);
            expect(sum(pay), `${plan.name} seed ${seed}`).toBe(want);
            expect(pay.length).toBeLessThanOrEqual(12);
            for (const c of pay) expect(plan.coins).toContain(c);
            if (firstWay) expect(sameWay(pay, firstWay)).toBe(false);
            // Touch by touch: a coin each time until the amount is down, then the bell.
            const mat: number[] = [];
            for (let touch = payTouch(pay, mat); touch !== 'bell'; touch = payTouch(pay, mat)) mat.push(touch.coin);
            expect(mat).toEqual(pay);
            firstWay = pay;
          }
        }
      }
    }
  });
});
