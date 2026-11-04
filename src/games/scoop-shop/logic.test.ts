import { describe, expect, it } from 'vitest';
import type { ColorName } from '../../art/palette';
import { Rng } from '../../engine/random';
import { CHANGED_ORDERS, DISTINCT_TRIPLES, FLAVORS, spokenTopFirst, type Order, countSlots, scoopCounts, complete, customerToServe, makeCustomerChoices, CONE_KINDS, dressShop, makeOrders, nextNeeded, PLANS, planFor, scoopToTake, tryScoop, WINDOW_SCENES } from './logic';

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

  it('level 2 asks for a colour by name, not by its place on the counter', () => {
    const plan = planFor(2);
    for (let seed = 1; seed <= 200; seed++) {
      const { flavors, orders } = makeOrders(plan, new Rng(seed));
      orders.forEach((o, i) => {
        const at = flavors.indexOf(o.scoops[0]);
        expect(at, `seed ${seed}`).not.toBe(i);
        if (i > 0) expect(o.scoops[0]).not.toBe(orders[i - 1].scoops[0]);
      });
      // Tapping along the counter from the left never serves the whole round.
      expect(orders.every((o, i) => o.scoops[0] === flavors[i])).toBe(false);
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

  it("takes the right scoop every time on every level, so the demonstration's cones are all served with no bounce", () => {
    for (const plan of PLANS) {
      for (let seed = 1; seed <= 100; seed++) {
        const { flavors, orders } = makeOrders(plan, new Rng(seed));
        for (const order of orders) {
          const cone: ColorName[] = [];
          for (let next = scoopToTake(plan, order, cone, flavors); next; next = scoopToTake(plan, order, cone, flavors)) {
            expect(flavors).toContain(next);
            expect(tryScoop(plan, order, cone, next), `${plan.name} seed ${seed}`).toBe('add');
            cone.push(next);
            expect(cone.length).toBeLessThanOrEqual(plan.max);
          }
          expect(complete(plan, order, cone)).toBe(true);
          // Free play piles a different flavor on each scoop, so the demonstration shows choosing.
          if (plan.mode === 'free') expect(new Set(cone).size).toBe(cone.length);
        }
      }
    }
  });

  it('serves every flavour after a single tap at the lap entry', () => {
    const plan = planFor(10);
    expect(plan).toMatchObject({ mode: 'free', max: 1, customers: 3 });
    for (let seed = 1; seed <= 200; seed++) {
      const { flavors, orders } = makeOrders(plan, new Rng(seed));
      for (const order of orders) {
        for (const color of flavors) {
          expect(tryScoop(plan, order, [], color)).toBe('add');
          expect(complete(plan, order, [color])).toBe(true);
          expect(scoopToTake(plan, order, [color], flavors)).toBeNull();
        }
        expect(scoopToTake(plan, order, [], flavors)).toBe(flavors[0]);
      }
    }
  });

  it('offers exactly one matching picture, alternating sides and retaining the waiting customer', () => {
    const firstSides = new Set<number>();
    for (let seed = 1; seed <= 200; seed++) {
      const rng = new Rng(seed);
      const { flavors } = makeOrders(planFor(11), rng);
      const choices = makeCustomerChoices(flavors, rng);
      expect(choices).toHaveLength(3);
      firstSides.add(choices[0].match);
      choices.forEach((choice, i) => {
        expect(new Set(choice.pictures).size).toBe(2);
        expect(choice.pictures.filter(c => c === choice.scoop)).toHaveLength(1);
        expect(customerToServe(choice, choice.match)).toBe(true);
        expect(customerToServe(choice, 1 - choice.match)).toBe(false);
        choice.pictures.forEach(c => expect(flavors).toContain(c));
        if (i) {
          const previous = choices[i - 1];
          expect(choice.match).not.toBe(previous.match);
          expect(choice.pictures[choice.match]).toBe(previous.pictures[choice.match]);
          expect(choice.pictures[previous.match]).not.toBe(previous.pictures[previous.match]);
        }
      });
    }
    expect(firstSides.size).toBe(2);
  });

  it('counts on from one to three existing scoops, with a different remainder each customer', () => {
    const plan = planFor(12);
    expect(plan.start).toBe(true);
    const seen = new Set<number>();
    for (let seed = 1; seed <= 200; seed++) {
      const { flavors, orders } = makeOrders(plan, new Rng(seed));
      let previous = 0;
      for (const order of orders) {
        const start = order.start!;
        expect(start).toBeGreaterThanOrEqual(1);
        expect(start).toBeLessThanOrEqual(3);
        expect(order.scoops.length).toBeGreaterThan(start);
        expect(order.scoops.length).toBeGreaterThanOrEqual(3);
        expect(order.scoops.length).toBeLessThanOrEqual(5);
        expect(new Set(order.scoops).size).toBe(1);
        const needed = order.scoops.length - start;
        expect(needed).not.toBe(previous);
        previous = needed;
        seen.add(start);
        const cone = order.scoops.slice(0, start);
        expect(countSlots(order, cone.length).filter(filled => !filled)).toHaveLength(needed);
        const wrong = flavors.find(c => c !== cone[0])!;
        expect(tryScoop(plan, order, cone, wrong)).toBe('wrong');
        while (!complete(plan, order, cone)) {
          const next = scoopToTake(plan, order, cone, flavors)!;
          expect(tryScoop(plan, order, cone, next)).toBe('add');
          cone.push(next);
        }
        expect(countSlots(order, cone.length).every(Boolean)).toBe(true);
        expect(scoopToTake(plan, order, cone, flavors)).toBeNull();
        expect(tryScoop(plan, order, cone, cone[0])).toBe('too-many');
      }
    }
    expect([...seen].sort()).toEqual([1, 2, 3]);
  });

  it('accepts either colour first in mixed counts and rejects extras without corrupting the remaining hint', () => {
    const plan = planFor(13);
    for (let seed = 1; seed <= 200; seed++) {
      const { flavors, orders } = makeOrders(plan, new Rng(seed));
      let unequal = 0;
      for (const order of orders) {
        expect(order.ordered).toBe(false);
        const rows = scoopCounts(order);
        expect(rows).toHaveLength(2);
        expect(order.scoops.length).toBeGreaterThanOrEqual(4);
        expect(order.scoops.length).toBeLessThanOrEqual(5);
        rows.forEach(({ color, count }) => {
          expect(flavors).toContain(color);
          expect(count).toBeGreaterThanOrEqual(1);
          expect(count).toBeLessThanOrEqual(4);
        });
        if (rows[0].count !== rows[1].count) unequal++;
        const outsider = flavors.find(c => !order.scoops.includes(c))!;
        expect(tryScoop(plan, order, [], outsider)).toBe('wrong');
        for (const first of [0, 1]) {
          const cone: ColorName[] = [];
          for (let i = 0; i < rows[first].count; i++) {
            expect(tryScoop(plan, order, cone, rows[first].color)).toBe('add');
            cone.push(rows[first].color);
          }
          expect(tryScoop(plan, order, cone, rows[first].color)).toBe('too-many');
          expect(nextNeeded(order, cone)).toBe(rows[1 - first].color);
          while (!complete(plan, order, cone)) {
            const next = scoopToTake(plan, order, cone, flavors)!;
            expect(tryScoop(plan, order, cone, next)).toBe('add');
            cone.push(next);
          }
          expect(complete(plan, order, [...cone].reverse())).toBe(true);
        }
      }
      expect(unequal).toBeGreaterThanOrEqual(2);
    }
  });

  it('dresses every round with a window scene and a cone kind per customer, never the same kind twice in a row', () => {
    const scenes = new Set<string>();
    const kinds = new Set<string>();
    for (let seed = 1; seed <= 200; seed++) {
      for (const n of [2, 3, 7]) {
        const { scene, cones } = dressShop(n, new Rng(seed));
        expect(WINDOW_SCENES).toContain(scene);
        expect(cones).toHaveLength(n);
        cones.forEach((k, i) => {
          expect(CONE_KINDS).toContain(k);
          if (i > 0) expect(k, `seed ${seed}`).not.toBe(cones[i - 1]);
        });
        scenes.add(scene);
        cones.forEach((k) => kinds.add(k));
      }
    }
    expect(scenes.size).toBe(WINDOW_SCENES.length);
    expect(kinds.size).toBe(CONE_KINDS.length);
  });
});

describe('Scoop Shop change and reverse', () => {
  // A separate product enumeration proves completeness, including every position/replacement.
  const triples: ColorName[][] = [];
  for (const a of FLAVORS) for (const b of FLAVORS) for (const c of FLAVORS) {
    if (new Set([a, b, c]).size === 3) triples.push([a, b, c]);
  }
  const key = (o: Order) => `${o.original?.join(',')}:${o.changeIndex}:${o.scoops.join(',')}`;

  it('contains exactly the 120 distinct triples and all 1080 one-position changes', () => {
    expect(DISTINCT_TRIPLES).toHaveLength(120);
    expect(new Set(DISTINCT_TRIPLES.map(s => s.join(',')))).toEqual(new Set(triples.map(s => s.join(','))));
    const expected = new Set<string>();
    for (const original of triples) for (let at = 0; at < 3; at++) for (const color of FLAVORS) {
      if (original.includes(color)) continue;
      const scoops = original.map((c, i) => i === at ? color : c);
      expected.add(key({ original, changeIndex: at, scoops, ordered: true }));
    }
    expect(CHANGED_ORDERS).toHaveLength(1080);
    expect(new Set(CHANGED_ORDERS.map(key))).toEqual(expected);
    for (const order of CHANGED_ORDERS) {
      expect(order.ordered).toBe(true);
      expect(order.original).not.toBe(order.scoops);
      expect(new Set(order.scoops).size).toBe(3);
      const differences = order.scoops.flatMap((c, i) => c !== order.original![i] ? [i] : []);
      expect(differences).toEqual([order.changeIndex]);
      expect(order.original).not.toContain(order.scoops[order.changeIndex!]);
    }
  });

  it('speaks a copied top-first request for every distinct triple; following speech directly is wrong', () => {
    for (const scoops of triples) {
      const order: Order = { scoops: [...scoops], ordered: true };
      const spoken = spokenTopFirst(order);
      expect(spoken).toEqual([scoops[2], scoops[1], scoops[0]]);
      expect(spoken).not.toEqual(scoops);
      expect(tryScoop(planFor(9), order, [], spoken[0])).toBe('wrong');
      spoken[0] = 'pink';
      expect(order.scoops).toEqual(scoops);
    }
  });

  it('rejects each wrong scoop without mutation and finishes every finite request through useful next-needed hints', () => {
    for (const level of [8, 9]) {
      const plan = planFor(level);
      const family: Order[] = level === 8 ? CHANGED_ORDERS : triples.map(scoops => ({ scoops, ordered: true }));
      for (const order of family) {
        const beforeOrder = JSON.stringify(order);
        const cone: ColorName[] = [];
        for (let i = 0; i < 3; i++) {
          expect(complete(plan, order, cone)).toBe(false);
          const beforeCone = [...cone];
          for (const wrong of FLAVORS.filter(c => c !== order.scoops[i])) {
            expect(tryScoop(plan, order, cone, wrong)).toBe('wrong');
            expect(cone).toEqual(beforeCone);
          }
          if (level === 8 && i === order.changeIndex) expect(tryScoop(plan, order, cone, order.original![i])).toBe('wrong');
          const hint = nextNeeded(order, cone)!;
          expect(hint).toBe(order.scoops[i]);
          expect(scoopToTake(plan, order, cone, FLAVORS)).toBe(hint);
          expect(tryScoop(plan, order, cone, hint)).toBe('add');
          cone.push(hint);
        }
        expect(complete(plan, order, cone)).toBe(true);
        expect(complete(plan, order, [...cone].reverse())).toBe(false);
        expect(nextNeeded(order, cone)).toBeUndefined();
        expect(scoopToTake(plan, order, cone, FLAVORS)).toBeNull();
        expect(tryScoop(plan, order, cone, FLAVORS[0])).toBe('too-many');
        expect(JSON.stringify(order)).toBe(beforeOrder);
      }
    }
  });

  it('generates deterministic independent orders with all six tubs, leaving prior level IDs unchanged', () => {
    expect(planFor(8)).toMatchObject({ mode: 'change', customers: 3, min: 3, max: 3, flavors: 6 });
    expect(planFor(9)).toMatchObject({ mode: 'topfirst', customers: 3, min: 3, max: 3, flavors: 6 });
    expect([1, 2, 3, 4, 5, 6, 10, 11, 12, 13].map(level => planFor(level).mode))
      .toEqual(['free', 'one', 'pair', 'count', 'stack', 'memory', 'free', 'customer', 'count', 'mixed']);
    for (const level of [8, 9]) for (let seed = 1; seed <= 300; seed++) {
      const a = makeOrders(planFor(level), new Rng(seed));
      expect(a).toEqual(makeOrders(planFor(level), new Rng(seed)));
      expect(a.orders).toHaveLength(3);
      expect(new Set(a.flavors)).toEqual(new Set(FLAVORS));
      a.orders.forEach(order => {
        expect(order.ordered).toBe(true);
        expect(order.scoops).toHaveLength(3);
        order.scoops.forEach(c => expect(a.flavors).toContain(c));
      });
      const saved = JSON.stringify(a.orders.slice(1));
      const registry = JSON.stringify(level === 8 ? CHANGED_ORDERS : DISTINCT_TRIPLES);
      a.orders[0].scoops[0] = 'red';
      if (a.orders[0].original) a.orders[0].original![0] = 'red';
      expect(JSON.stringify(a.orders.slice(1))).toBe(saved);
      expect(JSON.stringify(level === 8 ? CHANGED_ORDERS : DISTINCT_TRIPLES)).toBe(registry);
    }
  });

  it('keeps named numeric seeds for bottom/middle/top changes and two reverse requests reproducible', () => {
    const cases = [
      { seed: 1, original: ['yellow', 'brown', 'purple'], changeIndex: 0, scoops: ['blue', 'brown', 'purple'] },
      { seed: 3, original: ['brown', 'green', 'yellow'], changeIndex: 1, scoops: ['brown', 'pink', 'yellow'] },
      { seed: 4, original: ['purple', 'blue', 'yellow'], changeIndex: 2, scoops: ['purple', 'blue', 'green'] },
    ];
    for (const { seed, ...expected } of cases) {
      expect(makeOrders(planFor(8), new Rng(seed)).orders[0]).toEqual({ ...expected, ordered: true });
    }
    expect(spokenTopFirst(makeOrders(planFor(9), new Rng(1)).orders[0])).toEqual(['purple', 'brown', 'yellow']);
    expect(spokenTopFirst(makeOrders(planFor(9), new Rng(2)).orders[0])).toEqual(['pink', 'blue', 'brown']);
  });
});
