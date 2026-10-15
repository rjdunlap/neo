import { describe, expect, it } from 'vitest';
import { FRUIT_FOR } from '../../art/props';
import { RAINBOW } from '../../art/palette';
import { Rng } from '../../engine/random';
import { spread } from '../../engine/view';
import { basketAt, basketWidth, deal, DROP_ABOVE, nextToSort, planFor, PLANS } from './logic';

describe('Color Garden', () => {
  it('gives every basket something to catch, and only things that belong in a basket', () => {
    for (const plan of PLANS) {
      for (let seed = 1; seed <= 100; seed++) {
        const { colors, items } = deal(new Rng(seed), plan);
        expect(new Set(colors).size).toBe(plan.colors);
        expect(items).toHaveLength(plan.items);
        for (const c of colors) expect(items).toContain(c);
        for (const i of items) expect(colors).toContain(i);
      }
    }
    // Fruit levels can draw any rainbow color as a fruit that gives the color away.
    for (const c of RAINBOW) expect(FRUIT_FOR[c]).toBeDefined();
  });

  it('level 7 sorts one light and one dark blue basket, each with something to catch', () => {
    const plan = PLANS[6];
    expect(plan.shades).toBe(true);
    for (let seed = 1; seed <= 100; seed++) {
      const { colors, items } = deal(new Rng(seed), plan);
      expect([...colors].sort()).toEqual(['dark-blue', 'light-blue']);
      expect(items).toHaveLength(plan.items);
      for (const k of colors) expect(items).toContain(k);
    }
  });

  it('level 6 mixes fruit, balloons and flowers in every round, each with a rainbow color of its own', () => {
    const plan = PLANS[5];
    for (let seed = 1; seed <= 100; seed++) {
      const { items, kinds } = deal(new Rng(seed), plan);
      expect(kinds).toHaveLength(plan.items);
      expect(kinds).toContain('balloon');
      expect(kinds).toContain('flower');
      expect(kinds.some((k) => k !== 'balloon' && k !== 'flower')).toBe(true);
      kinds.forEach((k, i) => {
        if (k !== 'balloon' && k !== 'flower') expect(k).toBe(FRUIT_FOR[items[i] as keyof typeof FRUIT_FOR]);
      });
    }
    // Earlier levels keep their kinds: fruit up to 5, balloons and flowers at 7.
    expect(new Set(deal(new Rng(3), PLANS[4]).kinds.filter((k) => k === 'balloon' || k === 'flower')).size).toBe(0);
  });

  it('drops into the basket under the finger, even where six baskets crowd together', () => {
    for (const plan of PLANS) {
      for (const viewW of [1024, 1366]) {
        const w = basketWidth(plan);
        const y = 768 - 26;
        const baskets = spread(plan.colors, 150, viewW - 40, w + 30).map((x) => ({ x, y, w }));
        for (const b of baskets) {
          // Anywhere across the basket's mouth, and a little above it.
          for (let dx = -w / 2 + 2; dx <= w / 2 - 2; dx += 4) {
            for (const dy of [-200, -96, -40]) expect(basketAt(baskets, b.x + dx, y + dy)).toBe(b);
          }
        }
        // High in the sky, or far off to the side: not a basket.
        expect(basketAt(baskets, baskets[0].x, y - 400)).toBeUndefined();
        expect(basketAt(baskets, 20, y - 40)).toBeUndefined();
      }
    }
  });

  it('has a bot that sorts every piece of fruit by carrying it to its own basket, at every level and screen width (what the ghost finger plays)', () => {
    for (const plan of PLANS) {
      for (const viewW of [1024, 1366]) {
        for (let seed = 1; seed <= 40; seed++) {
          const { colors, items } = deal(new Rng(seed), plan);
          const w = basketWidth(plan);
          const xs = spread(plan.colors, 150, viewW - 40, w + 30);
          const baskets = colors.map((key, i) => ({ key, x: xs[i], y: 768 - 26, w }));
          let waiting = items.map((key) => ({ key }));
          let moves = 0;
          for (let next = nextToSort(waiting, baskets); next; next = nextToSort(waiting, baskets)) {
            // The drop lands in the basket of the fruit's color, so it is taken and nothing is a miss.
            const at = basketAt(baskets, next.basket.x, next.basket.y - DROP_ABOVE);
            expect(at?.key, `${plan.colors} colors, seed ${seed}`).toBe(next.item.key);
            waiting = waiting.filter((i) => i !== next.item);
            moves++;
          }
          expect(moves).toBe(plan.items);
          expect(waiting).toHaveLength(0);
        }
      }
    }
  });
});

describe('Color Garden level 8, Color or kind', () => {
  const plan = PLANS[7];
  it('deals each color as a fruit and a balloon, and both rules turn up', () => {
    const rules = new Set<string>();
    for (let seed = 1; seed <= 100; seed++) {
      const { colors, items, kinds, looks, rule } = deal(new Rng(seed), plan);
      rules.add(rule!);
      expect(items).toHaveLength(plan.items);
      expect(new Set(looks).size).toBe(2);
      const combos = new Set(kinds.map((k, i) => `${looks![i]}/${k === 'balloon'}`));
      expect(combos.size).toBe(4);
      expect(new Set(colors).size).toBe(2);
      // Exactly one valid basket for every item under the round's rule.
      items.forEach((key, i) => {
        expect(colors.filter((c) => c === key)).toHaveLength(1);
        expect(key).toBe(rule === 'color' ? looks![i] : kinds[i] === 'balloon' ? 'kind-balloon' : 'kind-fruit');
        if (kinds[i] !== 'balloon') expect(kinds[i]).toBe(FRUIT_FOR[looks![i]]);
      });
    }
    expect([...rules].sort()).toEqual(['color', 'kind']);
  });
  it('is not mixed up with earlier levels', () => {
    expect(deal(new Rng(1), PLANS[6]).rule).toBeUndefined();
  });
});


describe('Color Garden tap entry (stable level 9)', () => {
  it('has four fruits, two distinct colors, and exactly one own basket per tap', () => {
    const plan = planFor(9);
    expect(plan).toMatchObject({ tap: true, items: 4, colors: 2, fruit: true });
    for (let seed = 1; seed <= 100; seed++) {
      const round = deal(new Rng(seed), plan);
      const waiting = round.items.map(key => ({ key }));
      const baskets = round.colors.map(key => ({ key }));
      expect(new Set(round.colors).size).toBe(2);
      expect(waiting).toHaveLength(4);
      for (const item of waiting) {
        expect(baskets.filter(b => b.key === item.key)).toHaveLength(1);
        expect(nextToSort([item], baskets)?.basket.key).toBe(item.key);
      }
    }
    for (let level = 1; level <= 8; level++) expect(planFor(level).tap).toBeUndefined();
  });
});
