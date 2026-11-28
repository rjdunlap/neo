import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import { firstLevel, landing, levelsInOrder, rangeFor } from '../../progress/difficulty';
import { marketStall } from './index';
import {
  compareRows,
  dearer,
  GOOD_HIT,
  LEVELS,
  makeOrders,
  MORE_GAP,
  MORE_LEVEL,
  MORE_SHELF,
  planFor,
  shelfX,
  showsTotal,
  tagMarks,
  target,
} from './logic';

const plan = planFor(MORE_LEVEL);

describe('Market Stall 15: Which costs more?', () => {
  it('is level 15, placed after Which coin? between levels 2 and 3 for pre-K only', () => {
    expect(MORE_LEVEL).toBe(15);
    expect(plan.mode).toBe('more');
    expect(levelsInOrder(rangeFor(LEVELS, 'prek'))).toEqual([2, 14, 15, 3, 4]);
    expect(levelsInOrder(rangeFor(LEVELS, 'preschool'))).not.toContain(15);
    expect(levelsInOrder(rangeFor(LEVELS, 'school'))).not.toContain(15);
    expect(marketStall.entryLevels).toContain(15);
    expect(marketStall.describeLevel(15)).toMatch(/^Which costs more\?/);
  });

  it('starts pre-K at level 2, and a school player carried at 15 lands on level 3', () => {
    expect(firstLevel(rangeFor(LEVELS, 'prek'), marketStall.entryLevels)).toBe(2);
    expect(landing(15, rangeFor(LEVELS, 'school'), marketStall.entryLevels)).toBe(3);
    expect(landing(15, rangeFor(LEVELS, 'prek'), marketStall.entryLevels)).toBe(15);
  });

  it('shows two different prices 1 to 10, 1 to 6 apart, never the same pair twice running', () => {
    for (let seed = 0; seed < 400; seed++) {
      const orders = makeOrders(plan, new Rng(seed));
      expect(orders).toHaveLength(plan.orders);
      orders.forEach((o, i) => {
        expect(o.compare).toBe(true);
        expect(o.prices).toHaveLength(2);
        const [a, b] = o.prices;
        for (const p of o.prices) {
          expect(p).toBeGreaterThanOrEqual(1);
          expect(p).toBeLessThanOrEqual(10);
        }
        expect(Math.abs(a - b)).toBeGreaterThanOrEqual(1);
        expect(Math.abs(a - b)).toBeLessThanOrEqual(MORE_GAP);
        expect(o.prices[dearer(o)]).toBe(Math.max(a, b));
        expect(target(plan, o)).toBe(Math.max(a, b));
        if (i) expect([...o.prices].sort()).not.toEqual([...orders[i - 1].prices].sort());
      });
    }
  });

  it('puts the dearer good on each side in half the orders, so tapping one side always is not enough', () => {
    for (let seed = 0; seed < 400; seed++) {
      const sides = makeOrders(plan, new Rng(seed)).map(dearer);
      expect(sides.filter((s) => s === 0)).toHaveLength(plan.orders / 2);
    }
  });

  it('is reproducible from the seed', () => {
    expect(makeOrders(plan, new Rng(9))).toEqual(makeOrders(plan, new Rng(9)));
  });

  it('shows each price as a numeral and as dots on its tag', () => {
    for (let p = 1; p <= 10; p++) {
      const marks = tagMarks(p);
      expect(marks.bar).toBeNull();
      expect(marks.dots).toHaveLength(p);
    }
  });

  it('lays the dots side by side one to one, with only the dearer row’s spare dots marked extra', () => {
    const rows = compareRows([3, 7]);
    expect(rows.map((r) => r.dots.length)).toEqual([3, 7]);
    expect(rows[0].dots.every((d) => !d.extra)).toBe(true);
    expect(rows[1].dots.filter((d) => d.extra)).toHaveLength(4);
    // Matched dots stand directly above one another.
    rows[0].dots.forEach((d, i) => expect(d.x).toBe(rows[1].dots[i].x));
    // Ten dots fit inside the 500-wide counter mat.
    const ten = compareRows([10, 4])[0].dots;
    expect(ten.at(-1)!.x + 13).toBeLessThan(250);
    expect(ten[0].x - 13).toBeGreaterThan(-250);
  });

  it('keeps the two tap targets apart and shows no running total', () => {
    const [left, right] = MORE_SHELF.map(shelfX);
    expect(right - left).toBeGreaterThanOrEqual(GOOD_HIT.w + 100);
    expect(GOOD_HIT.w).toBeGreaterThanOrEqual(100);
    expect(showsTotal(plan)).toBe(false);
    expect(plan.coins).toEqual([]);
  });
});
