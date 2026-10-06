import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import { BUNCHES, CROWD, makeFruits, PLANS, skipCount, tryLift } from './logic';

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
        if (plan.mode === 'groups') {
          for (const f of fruits) {
            expect(f.groups).toBeGreaterThanOrEqual(2);
            expect(f.need % f.groups).toBe(0);
            expect(f.need / f.groups).toBeGreaterThanOrEqual(2);
          }
          // Neighbouring bunches differ in shape, even when the totals match (3 twos, 2 threes).
          fruits.slice(1).forEach((f, i) => expect([f.groups, f.need]).not.toEqual([fruits[i].groups, fruits[i].need]));
        } else {
          for (const f of fruits) expect(f.groups).toBe(1);
          if (plan.max > plan.min) fruits.slice(1).forEach((f, i) => expect(f.need).not.toBe(fruits[i].need));
        }
      }
    }
  });

  it('shows every bunch shape within a round, and counts it by groups', () => {
    const plan = PLANS.find((p) => p.mode === 'groups')!;
    for (let seed = 1; seed <= 50; seed++) {
      const shapes = new Set(makeFruits(plan, new Rng(seed)).map((f) => `${f.groups}x${f.need / f.groups}`));
      expect(shapes.size).toBe(BUNCHES.length);
    }
    expect(skipCount({ need: 6, already: 0, groups: 3 })).toBe('2, 4, 6');
    expect(skipCount({ need: 6, already: 0, groups: 2 })).toBe('3, 6');
  });

  it('lifts only with exactly enough helpers', () => {
    expect(tryLift(3, 3)).toBe('lift');
    expect(tryLift(3, 2)).toBe('short');
    expect(tryLift(3, 4)).toBe('extra');
  });
});
