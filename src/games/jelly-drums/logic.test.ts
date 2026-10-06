import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import { JELLIES, makeTune, PLANS } from './logic';

describe('Jelly Drums', () => {
  it('grows from free play to longer tunes', () => {
    const echo = PLANS.filter((p) => p.mode === 'echo');
    expect(PLANS.slice(0, 3).every((p) => p.mode === 'free')).toBe(true);
    for (let i = 1; i < echo.length; i++) expect(echo[i].length).toBeGreaterThanOrEqual(echo[i - 1].length);
    expect(echo[0].length).toBe(2);
    expect(echo.at(-1)!.length).toBe(5);
  });

  it('makes tunes on real jellies, never one note over and over, with no repeats in short tunes', () => {
    const used = new Set<number>();
    for (const plan of PLANS.filter((p) => p.mode === 'echo')) {
      for (let seed = 1; seed <= 300; seed++) {
        const tune = makeTune(new Rng(seed), plan.length);
        expect(tune).toHaveLength(plan.length);
        for (const i of tune) {
          expect(i).toBeGreaterThanOrEqual(0);
          expect(i).toBeLessThan(JELLIES);
          used.add(i);
        }
        expect(new Set(tune).size).toBeGreaterThan(1);
        if (plan.length <= 3) for (let k = 1; k < tune.length; k++) expect(tune[k]).not.toBe(tune[k - 1]);
      }
    }
    expect(used.size).toBe(JELLIES);
  });
});
