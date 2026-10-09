import { describe, expect, it } from 'vitest';
import { FRUIT_FOR } from '../../art/props';
import { RAINBOW } from '../../art/palette';
import { Rng } from '../../engine/random';
import { spread } from '../../engine/view';
import { basketAt, basketWidth, deal, DROP_ABOVE, nextToSort, PLANS } from './logic';

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
          const baskets = colors.map((color, i) => ({ color, x: xs[i], y: 768 - 26, w }));
          let waiting = items.map((color) => ({ color }));
          let moves = 0;
          for (let next = nextToSort(waiting, baskets); next; next = nextToSort(waiting, baskets)) {
            // The drop lands in the basket of the fruit's color, so it is taken and nothing is a miss.
            const at = basketAt(baskets, next.basket.x, next.basket.y - DROP_ABOVE);
            expect(at?.color, `${plan.colors} colors, seed ${seed}`).toBe(next.item.color);
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
