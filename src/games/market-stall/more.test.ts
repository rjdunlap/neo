import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import { firstLevel, landing, levelsInOrder, rangeFor } from '../../progress/difficulty';
import { marketStall } from './index';
import {
  COMPARE,
  compareDots,
  dearer,
  GOOD_HIT,
  LEVELS,
  makeOrders,
  MAT_BOX,
  MORE_GAP,
  MORE_LEVEL,
  moreShelfX,
  moreTap,
  planFor,
  showsTotal,
  target,
} from './logic';

const plan = planFor(MORE_LEVEL);
const DRAWN_MAT_H = 140;

describe('Market Stall 15: Which costs more?', () => {
  it('is level 15, a pre-K entry after Which coin? and left out of the school ladder', () => {
    expect(MORE_LEVEL).toBe(15);
    expect(plan.mode).toBe('more');
    expect(levelsInOrder(rangeFor(LEVELS, 'preschool'))).toEqual([1, 2, 14]);
    expect(levelsInOrder(rangeFor(LEVELS, 'prek'))).toEqual([2, 14, 15, 3, 4]);
    expect(levelsInOrder(rangeFor(LEVELS, 'school'))).not.toContain(15);
    expect(rangeFor(LEVELS, 'school').max).toBe(13);
    expect(marketStall.entryLevels).toEqual([14, 15]);
    expect(marketStall.describeLevel(15)).toMatch(/^Which costs more\?/);
  });

  it('starts bands at their usual first level and lands a school player carried at 15 at level 3', () => {
    expect(firstLevel(rangeFor(LEVELS, 'preschool'), marketStall.entryLevels)).toBe(1);
    expect(firstLevel(rangeFor(LEVELS, 'prek'), marketStall.entryLevels)).toBe(2);
    expect(landing(15, rangeFor(LEVELS, 'school'), marketStall.entryLevels)).toBe(3);
    expect(landing(15, rangeFor(LEVELS, 'prek'), marketStall.entryLevels)).toBe(15);
  });

  it('makes valid, fair orders on every seed', () => {
    for (let seed = 0; seed < 300; seed++) {
      const orders = makeOrders(plan, new Rng(seed));
      expect(orders).toHaveLength(4);
      expect(orders).toHaveLength(plan.orders);
      let leftDearer = 0;
      let last = '';
      for (const o of orders) {
        expect(o.prices).toHaveLength(2);
        const [a, b] = o.prices;
        expect(a).not.toBe(b);
        for (const p of o.prices) {
          expect(p).toBeGreaterThanOrEqual(1);
          expect(p).toBeLessThanOrEqual(10);
          expect(p).toBeGreaterThanOrEqual(plan.price[0]);
          expect(p).toBeLessThanOrEqual(plan.price[1]);
        }
        const gap = Math.abs(a - b);
        expect(gap).toBeGreaterThanOrEqual(MORE_GAP[0]);
        expect(gap).toBeLessThanOrEqual(MORE_GAP[1]);
        const key = `${Math.min(a, b)}-${Math.max(a, b)}`;
        expect(key).not.toBe(last);
        last = key;
        if (dearer(o) === 0) leftDearer++;
        expect(o.prices[dearer(o)]).toBe(Math.max(a, b));
      }
      expect(leftDearer).toBe(2);
    }
  });

  it('is reproducible from the seed and varies between seeds', () => {
    expect(makeOrders(plan, new Rng(7))).toEqual(makeOrders(plan, new Rng(7)));
    const seen = new Set<string>();
    for (let seed = 0; seed < 30; seed++) seen.add(JSON.stringify(makeOrders(plan, new Rng(seed))));
    expect(seen.size).toBeGreaterThan(20);
  });

  it('targets the dearer price and shows no running total', () => {
    expect(showsTotal(plan)).toBe(false);
    for (let seed = 0; seed < 100; seed++) {
      for (const o of makeOrders(plan, new Rng(seed))) expect(target(plan, o)).toBe(Math.max(...o.prices));
    }
  });

  it('moreTap: the dearer fruit is right, the cheaper misses, and a second miss lights the dearer one', () => {
    for (let seed = 0; seed < 50; seed++) {
      for (const o of makeOrders(plan, new Rng(seed))) {
        const right = dearer(o);
        const wrong = 1 - right;
        expect(moreTap(o, right, 0)).toBe('yes');
        expect(moreTap(o, right, 3)).toBe('yes');
        expect(moreTap(o, wrong, 0)).toBe('miss');
        expect(moreTap(o, wrong, 1)).toBe('hint');
        expect(moreTap(o, wrong, 2)).toBe('hint');
        // The hint points at the right fruit, which is the dearer one.
        expect(o.prices[right]).toBeGreaterThan(o.prices[wrong]);
      }
    }
  });

  it('lays one dot per shell on each row, lined up one to one, all inside the mat', () => {
    for (let seed = 0; seed < 100; seed++) {
      for (const o of makeOrders(plan, new Rng(seed))) {
        const rows = compareDots(o.prices);
        expect(rows).toHaveLength(2);
        rows.forEach((row, r) => {
          expect(row.dots).toHaveLength(o.prices[r]);
          row.dots.forEach((d, i) => {
            expect(d.x).toBe(COMPARE.x0 + i * COMPARE.step);
            expect(d.y).toBe(row.numeral.y);
            // Same x step in both rows: the dot above a dot is its partner.
            const other = rows[1 - r].dots[i];
            if (other) expect(other.x).toBe(d.x);
            expect(Math.abs(d.x) + COMPARE.r).toBeLessThanOrEqual(MAT_BOX.w / 2);
            expect(Math.abs(d.y) + COMPARE.r).toBeLessThanOrEqual(DRAWN_MAT_H / 2);
          });
          expect(Math.abs(row.numeral.x)).toBeLessThanOrEqual(MAT_BOX.w / 2);
        });
        expect(rows[0].numeral.y).not.toBe(rows[1].numeral.y);
      }
    }
    // The widest case, ten dots, still fits.
    const widest = compareDots([10, 9])[0].dots;
    expect(widest.at(-1)!.x + COMPARE.r).toBeLessThanOrEqual(MAT_BOX.w / 2);
    expect(Math.abs(compareDots([1, 2])[0].numeral.x)).toBeLessThan(Math.abs(COMPARE.x0) + MAT_BOX.w);
    expect(MAT_BOX.h).toBeGreaterThanOrEqual(DRAWN_MAT_H);
  });

  it('puts the two fruits in separate tap boxes that do not overlap', () => {
    const [a, b] = [moreShelfX(0), moreShelfX(1)];
    expect(a).toBeLessThan(b);
    expect(b - a - GOOD_HIT.w).toBeGreaterThan(0);
    expect(a + GOOD_HIT.w / 2).toBeLessThan(b - GOOD_HIT.w / 2);
  });
});
