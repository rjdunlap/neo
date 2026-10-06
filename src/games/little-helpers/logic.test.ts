import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import { CROWD, makeFruits, PLANS, tryLift } from './logic';

describe('Little Helpers', () => {
  it('never needs more helpers than the crowd, and leaves something to send', () => {
    for (const plan of PLANS) {
      for (let seed = 1; seed <= 200; seed++) {
        const fruits = makeFruits(plan, new Rng(seed));
        expect(fruits).toHaveLength(plan.fruits);
        for (const f of fruits) {
          expect(f.need).toBeGreaterThanOrEqual(plan.min);
          expect(f.need).toBeLessThanOrEqual(Math.min(plan.max, CROWD - 1));
          if (plan.mode === 'more') {
            expect(f.already).toBeGreaterThanOrEqual(1);
            expect(f.already).toBeLessThan(f.need);
          } else expect(f.already).toBe(0);
        }
        if (plan.max > plan.min) fruits.slice(1).forEach((f, i) => expect(f.need).not.toBe(fruits[i].need));
      }
    }
  });

  it('lifts only with exactly enough helpers', () => {
    expect(tryLift(3, 3)).toBe('lift');
    expect(tryLift(3, 2)).toBe('short');
    expect(tryLift(3, 4)).toBe('extra');
  });
});
