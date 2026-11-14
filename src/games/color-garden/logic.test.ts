import { describe, expect, it } from 'vitest';
import { FRUIT_FOR } from '../../art/props';
import { RAINBOW, swatch } from '../../art/palette';
import { Rng } from '../../engine/random';
import { spread } from '../../engine/view';
import {
  basketAt,
  basketWidth,
  BIG_LEVEL,
  deal,
  multiply,
  DROP_ABOVE,
  LEVELS,
  nextToSort,
  planFor,
  PLANS,
  TONE_HUES,
  TONES,
  TONES_LEVEL,
  toneLook,
  toneOf,
  type SortKey,
} from './logic';
import { firstLevel, levelsInOrder } from '../../progress/difficulty';

describe('Color Garden', () => {
  it('level 10 opens lap with one big fruit at a time, the two colors taking turns; toddler still starts at 9', () => {
    const plan = planFor(BIG_LEVEL);
    expect(plan).toMatchObject({ big: true, tap: true, fruit: true, colors: 2 });
    expect(firstLevel(LEVELS.lap!, [9, BIG_LEVEL])).toBe(BIG_LEVEL);
    expect(levelsInOrder(LEVELS.lap!)).toEqual([BIG_LEVEL, 9]);
    expect(firstLevel(LEVELS.toddler!, [9, BIG_LEVEL])).toBe(9);
    for (const band of ['toddler', 'preschool', 'prek'] as const)
      expect(levelsInOrder(LEVELS[band]!)).not.toContain(BIG_LEVEL);
    for (let seed = 1; seed <= 100; seed++) {
      const { colors, items, kinds } = deal(new Rng(seed), plan);
      expect(items).toHaveLength(plan.items);
      for (let i = 1; i < items.length; i++) expect(items[i]).not.toBe(items[i - 1]);
      for (const c of colors) expect(items.filter((i) => i === c)).toHaveLength(plan.items / 2);
      // Each is the fruit that gives its color away.
      items.forEach((c, i) => expect(kinds[i]).toBe(FRUIT_FOR[c as (typeof RAINBOW)[number]]));
      // The ghost finger's order sends each to its own basket.
      const baskets = colors.map((key) => ({ key }));
      expect(nextToSort([{ key: items[0] }], baskets)?.basket.key).toBe(items[0]);
    }
  });

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

  it('level 7 deals exactly as before the tone table (seed 7)', () => {
    expect(deal(new Rng(7), PLANS[6])).toEqual({
      colors: ['dark-blue', 'light-blue'],
      items: [
        'dark-blue',
        'light-blue',
        'dark-blue',
        'dark-blue',
        'dark-blue',
        'light-blue',
        'light-blue',
        'light-blue',
      ],
      kinds: ['flower', 'balloon', 'flower', 'balloon', 'flower', 'balloon', 'flower', 'balloon'],
    });
    // Level 7's blues keep their look.
    expect(toneLook('light-blue')).toEqual({
      base: 'white',
      tint: 0xa9d3ff,
      cloth: { fill: 0xa9d3ff, line: 0x6f9fd6 },
    });
    expect(toneLook('dark-blue')?.tint).toBe(0x5a7fb5);
    expect(toneLook('red')).toBeUndefined();
    expect(toneLook('kind-fruit')).toBeUndefined();
  });

  it('level 11 sorts light, middle and dark of one color, each with something to catch, across all four colors', () => {
    const plan = planFor(TONES_LEVEL);
    expect(plan.tones).toBe(true);
    const hues = new Set<string>();
    for (let seed = 1; seed <= 200; seed++) {
      const { colors, items, kinds } = deal(new Rng(seed), plan);
      expect(colors).toHaveLength(3);
      const tones = colors.map((c) => toneOf(c)!);
      expect(new Set(tones.map((t) => t.hue)).size).toBe(1);
      expect(tones.map((t) => t.shade).sort()).toEqual([...TONES].sort());
      hues.add(tones[0].hue);
      expect(items).toHaveLength(plan.items);
      for (const k of colors) expect(items).toContain(k);
      for (const i of items) expect(colors).toContain(i);
      // Each item has exactly one basket.
      for (const i of items) expect(colors.filter((c) => c === i)).toHaveLength(1);
      expect(new Set(kinds)).toEqual(new Set(['balloon', 'flower']));
    }
    expect([...hues].sort()).toEqual([...TONE_HUES].sort());
  });

  it('level 11 tones differ clearly in lightness, and each thing is nearest its own basket', () => {
    const lum = (c: number) => {
      const ch = [16, 8, 0].map((s) => {
        const v = ((c >> s) & 255) / 255;
        return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
      });
      return 0.2126 * ch[0] + 0.7152 * ch[1] + 0.0722 * ch[2];
    };
    const contrast = (a: number, b: number) =>
      (Math.max(lum(a), lum(b)) + 0.05) / (Math.min(lum(a), lum(b)) + 0.05);
    for (const hue of TONE_HUES) {
      const keys = TONES.map((t) => `${t}-${hue}` as SortKey);
      const looks = keys.map((k) => toneLook(k)!);
      // What a thing shows: its prop's fill multiplied by the tint.
      const shown = looks.map((l) => multiply(swatch[l.base].fill, l.tint));
      // Light, then middle, then dark, each step a clear minimum apart (WCAG contrast ratio).
      for (let i = 0; i < 2; i++) {
        expect(lum(shown[i]), `${hue} ${TONES[i]}`).toBeGreaterThan(lum(shown[i + 1]));
        expect(
          contrast(shown[i], shown[i + 1]),
          `${hue} ${TONES[i]} to ${TONES[i + 1]}`,
        ).toBeGreaterThanOrEqual(1.5);
        expect(
          contrast(looks[i].cloth.fill, looks[i + 1].cloth.fill),
          `${hue} cloth ${i}`,
        ).toBeGreaterThanOrEqual(1.5);
      }
      // Each thing's lightness is nearest its own basket's cloth.
      shown.forEach((c, i) => {
        const gaps = looks.map((l) => Math.abs(lum(l.cloth.fill) - lum(c)));
        expect(gaps.indexOf(Math.min(...gaps)), `${hue} ${TONES[i]}`).toBe(i);
      });
    }
  });

  it('pre-K climbs to level 11 after 8, skipping the lap and toddler tap entries', () => {
    expect(levelsInOrder(LEVELS.prek!)).toEqual([4, 5, 6, 7, 8, TONES_LEVEL]);
    expect(PLANS).toHaveLength(TONES_LEVEL);
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
    expect(
      new Set(deal(new Rng(3), PLANS[4]).kinds.filter((k) => k === 'balloon' || k === 'flower')).size,
    ).toBe(0);
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
        expect(key).toBe(
          rule === 'color' ? looks![i] : kinds[i] === 'balloon' ? 'kind-balloon' : 'kind-fruit',
        );
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
      const waiting = round.items.map((key) => ({ key }));
      const baskets = round.colors.map((key) => ({ key }));
      expect(new Set(round.colors).size).toBe(2);
      expect(waiting).toHaveLength(4);
      for (const item of waiting) {
        expect(baskets.filter((b) => b.key === item.key)).toHaveLength(1);
        expect(nextToSort([item], baskets)?.basket.key).toBe(item.key);
      }
    }
    for (let level = 1; level <= 8; level++) expect(planFor(level).tap).toBeUndefined();
  });
});
