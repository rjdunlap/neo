import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import { computeView } from '../../engine/view';
import { monthLayout, MONTH } from './layout';
import { LEVELS, MONTH_LEVEL, MONTHS, monthNeighbor, monthQuestions, planFor } from './logic';
import { rangeFor } from '../../progress/difficulty';

describe('month wheel rules', () => {
  it('has twelve distinct names and wraps in both directions', () => {
    expect(new Set(MONTHS).size).toBe(12);
    expect(MONTHS[monthNeighbor(11, 1)]).toBe('January');
    expect(MONTHS[monthNeighbor(0, -1)]).toBe('December');
    expect(MONTHS[monthNeighbor(3, -1)]).toBe('March');
    expect(MONTHS[monthNeighbor(7, 1)]).toBe('September');
  });

  it('asks three questions: one across the turn of the year, then one back and one forward', () => {
    const wraps = new Set<string>();
    const dirs = new Set<number>();
    for (let seed = 1; seed <= 300; seed++) {
      const qs = monthQuestions(new Rng(seed));
      expect(qs).toHaveLength(3);
      expect(Math.abs(qs[0].answer - qs[0].anchor)).toBe(11);
      wraps.add(`${qs[0].anchor}:${qs[0].direction}`);
      expect(
        qs
          .slice(1)
          .map((q) => q.direction)
          .sort(),
      ).toEqual([-1, 1]);
      for (const q of qs) {
        expect(q.answer).toBe(monthNeighbor(q.anchor, q.direction));
        dirs.add(q.direction);
      }
      // Six different months, so no name answers twice or is another question's anchor.
      expect(new Set(qs.flatMap((q) => [q.anchor, q.answer])).size).toBe(6);
      // Only the first question crosses the turn of the year.
      for (const q of qs.slice(1)) expect(Math.abs(q.answer - q.anchor)).toBe(1);
    }
    expect(wraps).toEqual(new Set(['11:1', '0:-1']));
    expect(dirs).toEqual(new Set([-1, 1]));
  });

  it('is the last school level and only school plays it', () => {
    expect(planFor(MONTH_LEVEL).name).toMatch(/month/i);
    expect(LEVELS.school?.order?.at(-1)).toBe(MONTH_LEVEL);
    for (const band of ['lap', 'toddler', 'preschool', 'prek'] as const)
      expect([rangeFor(LEVELS, band).min, rangeFor(LEVELS, band).max]).not.toContain(MONTH_LEVEL);
  });

  it('lays twelve 100-unit cards round the ring without overlap or leaving the screen', () => {
    for (const view of [
      computeView(1024, 768),
      computeView(390, 844, undefined, true),
      computeView(1366, 1024),
    ]) {
      const { months } = monthLayout(view);
      expect(months).toHaveLength(12);
      for (const [i, a] of months.entries()) {
        expect(a.x - MONTH.w / 2).toBeGreaterThanOrEqual(0);
        expect(a.x + MONTH.w / 2).toBeLessThanOrEqual(view.w);
        expect(a.y - MONTH.h / 2).toBeGreaterThanOrEqual(0);
        expect(a.y + MONTH.h / 2).toBeLessThanOrEqual(view.h);
        for (const b of months.slice(i + 1))
          expect(Math.abs(a.x - b.x) >= MONTH.w || Math.abs(a.y - b.y) >= MONTH.h).toBe(true);
      }
    }
  });
});
