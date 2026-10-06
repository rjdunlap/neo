import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import { bankSize, padValues, PLANS, SLOTS, story } from './logic';
import { tenStarts } from './logic';

describe('Duck Pond', () => {
  it('offers three different nearby numbers including the answer', () => {
    for (let answer = 1; answer <= 10; answer++) {
      for (let seed = 1; seed <= 50; seed++) {
        const pads = padValues(new Rng(seed), answer);
        expect(pads).toHaveLength(3);
        expect(new Set(pads).size).toBe(3);
        expect(pads).toContain(answer);
        for (const v of pads) {
          expect(v).toBeGreaterThanOrEqual(1);
          expect(v).toBeLessThanOrEqual(10);
          expect(Math.abs(v - answer)).toBeLessThanOrEqual(2);
        }
      }
    }
  });

  it('tells adding and taking-away stories with room on the pond and at least one duck left', () => {
    for (const plan of PLANS.filter((p) => p.mode === 'add')) {
      let away = 0;
      for (let seed = 1; seed <= 400; seed++) {
        const s = story(new Rng(seed), plan);
        expect(s.b).toBeGreaterThanOrEqual(1);
        expect(s.answer).toBeGreaterThanOrEqual(1);
        expect(s.answer).toBeLessThanOrEqual(plan.max);
        // Every duck that is ever on the water has its own place.
        expect(s.away ? s.a : s.a + s.b).toBeLessThanOrEqual(SLOTS.length);
        if (s.away) {
          away++;
          expect(s.answer).toBe(s.a - s.b);
        } else expect(s.answer).toBe(s.a + s.b);
      }
      expect(away > 0).toBe(!!plan.subtract);
    }
  });

  it('has room for every duck asked about, and a spare on the bank so stopping is a choice', () => {
    for (const plan of PLANS) {
      expect(plan.max).toBeLessThanOrEqual(SLOTS.length);
      if (plan.mode === 'make') expect(bankSize(plan)).toBeGreaterThan(plan.max);
    }
  });

  it('make-ten rounds start with 3 to 9 ducks, so 1 to 7 more always fit the pond\'s ten places', () => {
    const plan = PLANS.find((p) => p.mode === 'ten')!;
    for (let seed = 1; seed <= 200; seed++) {
      const starts = tenStarts(new Rng(seed), plan);
      expect(starts).toHaveLength(plan.rounds);
      starts.forEach((a, i) => {
        expect(a).toBeGreaterThanOrEqual(3);
        expect(a).toBeLessThanOrEqual(9);
        expect(SLOTS.length).toBe(10);
        if (i > 0) expect(a).not.toBe(starts[i - 1]);
      });
    }
  });
});
