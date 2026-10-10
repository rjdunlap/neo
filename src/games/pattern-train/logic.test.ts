import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import { buildTrain, CHOICES, PATTERN_PLANS, wantedChoice } from './logic';

/** The shortest repeat that explains every car showing (empty cars are null). */
function shortestRepeat(cars: (number | null)[]): number {
  for (let p = 1; p <= cars.length; p++) {
    const ok = cars.every((c, i) => c === null || cars.every((d, j) => d === null || (i - j) % p !== 0 || c === d));
    if (ok) return p;
  }
  return cars.length;
}

describe('Pattern Train', () => {
  it('shows enough of the pattern that each empty car has exactly one answer', () => {
    for (const plan of PATTERN_PLANS) {
      for (let seed = 1; seed <= 100; seed++) {
        const { sequence, targets, choices } = buildTrain(plan, new Rng(seed));
        if (plan.numberSteps) {
          const step = sequence[1] - sequence[0];
          expect(plan.numberSteps).toContain(step);
          expect(sequence.every((value, i) => i === 0 || value - sequence[i - 1] === step), plan.name).toBe(true);
          expect(new Set(choices[0]).size, plan.name).toBe(CHOICES);
          continue;
        }
        const showing = sequence.map((v, i) => (targets.includes(i) ? null : v));
        // The visible cars repeat exactly the planned unit, no shorter.
        const p = shortestRepeat(showing);
        expect(p, plan.name).toBe(plan.pattern.length);
        for (const t of targets) {
          // Some visible car sits at the same place in the repeat, and it says what goes here.
          const clue = showing.findIndex((v, i) => v !== null && (i - t) % p === 0);
          expect(clue, plan.name).toBeGreaterThanOrEqual(0);
          expect(sequence[t]).toBe(showing[clue]);
          expect(sequence[t]).toBeLessThan(CHOICES);
        }
        // Different letters of the pattern look (or sound) different.
        const used = new Set(plan.pattern);
        expect(new Set(plan.pattern.map((slot) => sequence[plan.pattern.indexOf(slot)])).size).toBe(used.size);
      }
    }
  });

  it('puts the gap where each level says: the end, the middle, or the last two cars', () => {
    for (const plan of PATTERN_PLANS) {
      const { sequence, targets } = buildTrain(plan, new Rng(3));
      if (plan.numberSteps) { expect(targets).toEqual([6]); continue; }
      if (plan.two) expect(targets).toEqual([sequence.length - 2, sequence.length - 1]);
      else if (plan.missing) {
        expect(targets[0]).toBeLessThan(plan.pattern.length);
        expect(targets[0]).toBeGreaterThan(0);
      } else expect(targets).toEqual([sequence.length - 1]);
    }
  });

  it('has a choice on offer for every empty car, in order, that fits the pattern', () => {
    for (const plan of PATTERN_PLANS) {
      for (let seed = 1; seed <= 100; seed++) {
        const { sequence, targets, choices } = buildTrain(plan, new Rng(seed));
        targets.forEach((t, k) => {
          const want = wantedChoice(sequence, targets, choices, k);
          expect(want).toBeGreaterThanOrEqual(0);
          expect(want).toBeLessThan(CHOICES);
          expect(choices[k][want]).toBe(sequence[t]);
        });
      }
    }
  });
});
