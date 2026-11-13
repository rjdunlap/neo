import { describe, expect, it } from 'vitest';
import type { ColorName } from '../../art/palette';
import { Rng } from '../../engine/random';
import {
  CONE_HIT,
  LAP_OPENING,
  nearestTub,
  tubsShown,
  coneAfterServe,
  FRIEND_HIT,
  FRIEND_SCALE,
  freshSupport,
  supportMiss,
  supportPeek,
  TWO_CONE_ORDERS,
  twoConeLayout,
  twoConeRoute,
  CHANGED_ORDERS,
  DISTINCT_TRIPLES,
  FLAVORS,
  spokenTopFirst,
  type Order,
  countSlots,
  scoopCounts,
  complete,
  customerToServe,
  makeCustomerChoices,
  CONE_KINDS,
  dressShop,
  makeOrders,
  nextNeeded,
  PLANS,
  planFor,
  scoopToTake,
  tryScoop,
  WINDOW_SCENES,
} from './logic';

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
        if (plan.mode === 'count')
          orders.slice(1).forEach((o, i) => expect(o.scoops.length).not.toBe(orders[i].scoops.length));
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
          for (
            let next = scoopToTake(plan, order, cone, flavors);
            next;
            next = scoopToTake(plan, order, cone, flavors)
          ) {
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

  it('opens the lap level with one tub and brings one more flavor per customer, every flavor shown by the last', () => {
    const plan = planFor(LAP_OPENING);
    expect([0, 1, 2].map((c) => tubsShown(LAP_OPENING, c, plan.flavors))).toEqual([1, 2, 3]);
    // Every flavor arrives by the last customer, and no tub waits unseen.
    expect(plan.flavors).toBe(plan.customers);
    expect(tubsShown(LAP_OPENING, -1, plan.flavors)).toBe(1);
    expect(tubsShown(LAP_OPENING, 9, plan.flavors)).toBe(plan.flavors);
    // Every other level shows all its tubs from the start.
    for (const level of [1, 2, 3, 4, 5, 6, 7, 8, 9, 11, 12, 13])
      expect(tubsShown(level, 0, planFor(level).flavors)).toBe(planFor(level).flavors);
  });

  it('sends a touch anywhere to the nearest shown tub', () => {
    const tubs = [
      { x: 150, y: 900 },
      { x: 290, y: 900 },
      { x: 430, y: 900 },
    ];
    expect(nearestTub(tubs.slice(0, 1), 700, 50)).toBe(0);
    expect(nearestTub(tubs, 10, 100)).toBe(0);
    expect(nearestTub(tubs, 300, 400)).toBe(1);
    expect(nearestTub(tubs, 900, 900)).toBe(2);
    expect(nearestTub([], 0, 0)).toBe(-1);
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
        expect(choice.pictures.filter((c) => c === choice.scoop)).toHaveLength(1);
        expect(customerToServe(choice, choice.match)).toBe(true);
        expect(customerToServe(choice, 1 - choice.match)).toBe(false);
        choice.pictures.forEach((c) => expect(flavors).toContain(c));
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
        expect(countSlots(order, cone.length).filter((filled) => !filled)).toHaveLength(needed);
        const wrong = flavors.find((c) => c !== cone[0])!;
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
        const outsider = flavors.find((c) => !order.scoops.includes(c))!;
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
  for (const a of FLAVORS)
    for (const b of FLAVORS)
      for (const c of FLAVORS) {
        if (new Set([a, b, c]).size === 3) triples.push([a, b, c]);
      }
  const key = (o: Order) => `${o.original?.join(',')}:${o.changeIndex}:${o.scoops.join(',')}`;

  it('contains exactly the 120 distinct triples and all 1080 one-position changes', () => {
    expect(DISTINCT_TRIPLES).toHaveLength(120);
    expect(new Set(DISTINCT_TRIPLES.map((s) => s.join(',')))).toEqual(
      new Set(triples.map((s) => s.join(','))),
    );
    const expected = new Set<string>();
    for (const original of triples)
      for (let at = 0; at < 3; at++)
        for (const color of FLAVORS) {
          if (original.includes(color)) continue;
          const scoops = original.map((c, i) => (i === at ? color : c));
          expected.add(key({ original, changeIndex: at, scoops, ordered: true }));
        }
    expect(CHANGED_ORDERS).toHaveLength(1080);
    expect(new Set(CHANGED_ORDERS.map(key))).toEqual(expected);
    for (const order of CHANGED_ORDERS) {
      expect(order.ordered).toBe(true);
      expect(order.original).not.toBe(order.scoops);
      expect(new Set(order.scoops).size).toBe(3);
      const differences = order.scoops.flatMap((c, i) => (c !== order.original![i] ? [i] : []));
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
      const family: Order[] =
        level === 8 ? CHANGED_ORDERS : triples.map((scoops) => ({ scoops, ordered: true }));
      for (const order of family) {
        const beforeOrder = JSON.stringify(order);
        const cone: ColorName[] = [];
        for (let i = 0; i < 3; i++) {
          expect(complete(plan, order, cone)).toBe(false);
          const beforeCone = [...cone];
          for (const wrong of FLAVORS.filter((c) => c !== order.scoops[i])) {
            expect(tryScoop(plan, order, cone, wrong)).toBe('wrong');
            expect(cone).toEqual(beforeCone);
          }
          if (level === 8 && i === order.changeIndex)
            expect(tryScoop(plan, order, cone, order.original![i])).toBe('wrong');
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
    expect([1, 2, 3, 4, 5, 6, 7, 10, 11, 12, 13].map((level) => planFor(level).mode)).toEqual([
      'free',
      'one',
      'pair',
      'count',
      'stack',
      'memory',
      'two',
      'free',
      'customer',
      'count',
      'mixed',
    ]);
    for (const level of [8, 9])
      for (let seed = 1; seed <= 300; seed++) {
        const a = makeOrders(planFor(level), new Rng(seed));
        expect(a).toEqual(makeOrders(planFor(level), new Rng(seed)));
        expect(a.orders).toHaveLength(3);
        expect(new Set(a.flavors)).toEqual(new Set(FLAVORS));
        a.orders.forEach((order) => {
          expect(order.ordered).toBe(true);
          expect(order.scoops).toHaveLength(3);
          order.scoops.forEach((c) => expect(a.flavors).toContain(c));
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
      {
        seed: 1,
        original: ['yellow', 'brown', 'purple'],
        changeIndex: 0,
        scoops: ['blue', 'brown', 'purple'],
      },
      {
        seed: 3,
        original: ['brown', 'green', 'yellow'],
        changeIndex: 1,
        scoops: ['brown', 'pink', 'yellow'],
      },
      {
        seed: 4,
        original: ['purple', 'blue', 'yellow'],
        changeIndex: 2,
        scoops: ['purple', 'blue', 'green'],
      },
    ];
    for (const { seed, ...expected } of cases) {
      expect(makeOrders(planFor(8), new Rng(seed)).orders[0]).toEqual({ ...expected, ordered: true });
    }
    expect(spokenTopFirst(makeOrders(planFor(9), new Rng(1)).orders[0])).toEqual([
      'purple',
      'brown',
      'yellow',
    ]);
    expect(spokenTopFirst(makeOrders(planFor(9), new Rng(2)).orders[0])).toEqual(['pink', 'blue', 'brown']);
  });
});

describe('Scoop Shop two cones (level 7)', () => {
  const plan = planFor(7);
  const key = (p: Order[]) => p.map((o) => o.scoops.join('+')).join('|');

  it('holds exactly the 360 pairs: a single and an ordered distinct pair, on either side, three scoops altogether', () => {
    const expected = new Set<string>();
    for (const single of FLAVORS)
      for (const a of FLAVORS)
        for (const b of FLAVORS) {
          if (a === b) continue;
          expected.add(`${single}|${a}+${b}`);
          expected.add(`${a}+${b}|${single}`);
        }
    expect(TWO_CONE_ORDERS).toHaveLength(360);
    expect(new Set(TWO_CONE_ORDERS.map(key))).toEqual(expected);
    for (const p of TWO_CONE_ORDERS) {
      expect(p[0].scoops.length + p[1].scoops.length).toBe(3);
      expect(p[0].scoops.join()).not.toBe(p[1].scoops.join());
      expect(p.every((o) => o.ordered)).toBe(true);
    }
  });

  it('draws deterministic pairs with all six tubs, reaching both single sides and shared and disjoint flavours', () => {
    expect(plan).toMatchObject({ mode: 'two', customers: 2, flavors: 6 });
    const seen = new Set<string>();
    for (let seed = 1; seed <= 300; seed++) {
      const a = makeOrders(plan, new Rng(seed));
      expect(a).toEqual(makeOrders(plan, new Rng(seed)));
      expect(a.orders).toHaveLength(2);
      expect(new Set(a.flavors)).toEqual(new Set(FLAVORS));
      const single = a.orders[0].scoops.length === 1 ? 'left' : 'right';
      const [one, two] = single === 'left' ? a.orders : [a.orders[1], a.orders[0]];
      seen.add(`${single}:${two.scoops.includes(one.scoops[0]) ? 'shared' : 'disjoint'}`);
      // The draw copies its arrays, so changing a round never changes the family.
      a.orders[0].scoops[0] = 'red';
      expect(TWO_CONE_ORDERS.some((p) => p[0].scoops[0] === 'red')).toBe(false);
    }
    expect(seen).toEqual(new Set(['left:shared', 'left:disjoint', 'right:shared', 'right:disjoint']));
  });

  it('keeps named seeds for an overlapping single on the left and a disjoint single on the right', () => {
    // two-overlap-left: the single's flavour is also in the pair; two-disjoint-right: no flavour shared.
    const overlap = makeOrders(plan, new Rng(7)).orders;
    const disjoint = makeOrders(plan, new Rng(1)).orders;
    expect(overlap.map((o) => o.scoops)).toEqual([['pink'], ['pink', 'yellow']]);
    expect(disjoint.map((o) => o.scoops)).toEqual([['brown', 'blue'], ['yellow']]);
  });

  it('lets each cone reject wrong scoops untouched and finish in any service order, the switch included', () => {
    for (const orders of TWO_CONE_ORDERS) {
      for (let variant = 0; variant < 3; variant++) {
        const route = twoConeRoute(orders, variant);
        expect(route.filter((i) => i === 0)).toHaveLength(orders[0].scoops.length);
        const cones: ColorName[][] = [[], []];
        for (const i of route) {
          const wrong = FLAVORS.find((c) => c !== nextNeeded(orders[i], cones[i]))!;
          const before = cones.map((c) => c.join());
          expect(tryScoop(plan, orders[i], cones[i], wrong)).not.toBe('add');
          expect(cones.map((c) => c.join())).toEqual(before);
          const next = scoopToTake(plan, orders[i], cones[i], FLAVORS)!;
          expect(tryScoop(plan, orders[i], cones[i], next)).toBe('add');
          cones[i].push(next);
        }
        orders.forEach((o, i) => expect(complete(plan, o, cones[i])).toBe(true));
      }
      // Variant 1 starts the pair and switches away after its first scoop; variant 2 serves the pair first.
      const pair = orders[0].scoops.length === 2 ? 0 : 1;
      expect(twoConeRoute(orders, 1)).toEqual([pair, 1 - pair, pair]);
      expect(twoConeRoute(orders, 2)[0]).toBe(pair);
      expect(twoConeRoute(orders, 0)[0]).toBe(1 - pair);
    }
  });

  it('keeps help per cone: the glow once from the second miss, the first peek once, never shared', () => {
    const left = freshSupport();
    const right = freshSupport();
    expect(supportMiss(left)).toBe(0);
    expect(supportPeek(right)).toBe(1);
    expect(supportMiss(left)).toBe(1);
    expect(supportMiss(left)).toBe(0);
    expect(supportPeek(right)).toBe(0);
    expect(supportPeek(left)).toBe(1);
    expect(left).toEqual({ wrongs: 3, glow: true, peeked: true });
    expect(right).toEqual({ wrongs: 0, glow: false, peeked: true });
    expect(supportMiss(right) + supportMiss(right)).toBe(1);
    // At most two hints per order, four in a round.
  });

  it('chooses the other cone after a serve, and nothing once both are fed', () => {
    expect(coneAfterServe([true, false], 0)).toBe(1);
    expect(coneAfterServe([false, true], 1)).toBe(0);
    expect(coneAfterServe([true, true], 1)).toBe(-1);
  });

  it('lays out two friends and two cones as separate targets at least 100 wide, clear of the tubs', () => {
    const rect = (x: number, y: number, h: { x: number; y: number; w: number; h: number }, k = 1) => ({
      l: x + h.x * k,
      r: x + (h.x + h.w) * k,
      t: y + h.y * k,
      b: y + (h.y + h.h) * k,
    });
    for (const [w, h] of [
      [1024, 768],
      [1024, 1365],
      [1366, 768],
    ]) {
      const top = h * 0.6;
      const rects = twoConeLayout(w, top).flatMap((s) => [
        rect(s.friend.x, s.friend.y, FRIEND_HIT, FRIEND_SCALE),
        rect(s.cone.x, s.cone.y, CONE_HIT),
      ]);
      for (const a of rects) {
        expect(a.r - a.l).toBeGreaterThanOrEqual(100);
        expect(a.b - a.t).toBeGreaterThanOrEqual(100);
        // Tubs sit at h - 70 and take taps within 72 of it.
        expect(a.b).toBeLessThan(h - 70 - 72);
        expect(a.l).toBeGreaterThan(0);
        expect(a.r).toBeLessThan(w);
      }
      rects.forEach((a, i) =>
        rects
          .slice(i + 1)
          .forEach((b) =>
            expect(a.r <= b.l || b.r <= a.l || a.b <= b.t || b.b <= a.t, `${w}x${h}`).toBe(true),
          ),
      );
    }
  });
});
