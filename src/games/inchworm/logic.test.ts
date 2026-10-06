import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import { answerOf, choices, makeMeasures, PLANS } from './logic';

describe('Inchworm Measure', () => {
  it('makes lengths that fit, different each time, and answers that are offered', () => {
    for (const plan of PLANS) {
      for (let seed = 1; seed <= 300; seed++) {
        const rng = new Rng(seed);
        const ms = makeMeasures(plan, rng);
        expect(ms).toHaveLength(plan.rounds);
        ms.forEach((m, i) => {
          expect(m.length).toBeGreaterThanOrEqual(2);
          expect(m.length).toBeLessThanOrEqual(plan.max);
          if (i > 0) expect(m.length).not.toBe(ms[i - 1].length);
          if (plan.mode === 'compare') expect(m.other!.length).not.toBe(m.length);
          if (plan.mode === 'ruler') expect(m.start! + m.length).toBeLessThanOrEqual(10);
          const cs = choices(m, plan.mode, rng);
          expect(cs).toHaveLength(3);
          expect(new Set(cs).size).toBe(3);
          expect(cs).toContain(answerOf(m, plan.mode));
          // Things that don't start at 0 offer the tempting wrong reading (the end of the pencil).
          if (plan.mode === 'ruler' && m.start) expect(cs).toContain(m.start + m.length);
        });
        if (plan.mode === 'ruler') expect(ms.some((m) => m.start === 0) && ms.some((m) => m.start! > 0)).toBe(true);
      }
    }
  });
});
