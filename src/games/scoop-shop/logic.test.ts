import { describe, expect, it } from 'vitest';
import type { ColorName } from '../../art/palette';
import { Rng } from '../../engine/random';
import { complete, makeOrders, nextNeeded, PLANS, planFor, tryScoop } from './logic';

describe('Scoop Shop', () => {
  it('only orders flavors that are on the counter, in the sizes each level asks for', () => {
    for (const plan of PLANS) {
      for (let seed = 1; seed <= 200; seed++) {
        const { flavors, orders } = makeOrders(plan, new Rng(seed));
        expect(flavors).toHaveLength(plan.flavors);
        expect(orders).toHaveLength(plan.customers);
        for (const o of orders) {
          for (const c of o.scoops) expect(flavors).toContain(c);
          if (plan.mode !== 'free') expect(o.scoops.length).toBeGreaterThanOrEqual(plan.min);
          expect(o.scoops.length).toBeLessThanOrEqual(plan.max);
          if (o.ordered) expect(new Set(o.scoops).size).toBe(o.scoops.length);
        }
        if (plan.mode === 'count') orders.slice(1).forEach((o, i) => expect(o.scoops.length).not.toBe(orders[i].scoops.length));
      }
    }
  });

  it('can always finish an order by following the hints', () => {
    for (const plan of PLANS.filter((p) => p.mode !== 'free')) {
      for (let seed = 1; seed <= 100; seed++) {
        for (const order of makeOrders(plan, new Rng(seed)).orders) {
          const cone: ColorName[] = [];
          while (!complete(plan, order, cone)) {
            const next = nextNeeded(order, cone)!;
            expect(tryScoop(plan, order, cone, next)).toBe('add');
            cone.push(next);
          }
          expect(cone).toHaveLength(order.scoops.length);
        }
      }
    }
  });

  it('bounces wrong flavors, too many scoops, and out-of-order stacks', () => {
    const pair = planFor(3);
    const order = { scoops: ['pink', 'blue'] as const, ordered: false };
    expect(tryScoop(pair, { ...order, scoops: [...order.scoops] }, [], 'green')).toBe('wrong');
    expect(tryScoop(pair, { ...order, scoops: [...order.scoops] }, ['pink'], 'pink')).toBe('too-many');
    expect(complete(pair, { ...order, scoops: [...order.scoops] }, ['blue', 'pink'])).toBe(true);
    const stack = planFor(5);
    const tall = { scoops: ['pink', 'blue', 'green'] as ('pink' | 'blue' | 'green')[], ordered: true };
    expect(tryScoop(stack, tall, [], 'blue')).toBe('wrong');
    expect(tryScoop(stack, tall, ['pink'], 'blue')).toBe('add');
    expect(complete(stack, tall, ['blue', 'pink', 'green'])).toBe(false);
  });
});
