import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import { differences, empty, makeBeat, PLANS, same } from './logic';

describe('Beat Builder', () => {
  it('makes beats that start on the drum, give every row a hit, and are never all sounds at once', () => {
    for (const plan of PLANS) {
      for (let seed = 1; seed <= 300; seed++) {
        const b = makeBeat(plan, new Rng(seed));
        expect(b).toHaveLength(plan.rows);
        for (const row of b) expect(row).toHaveLength(plan.steps), expect(row.some(Boolean)).toBe(true);
        expect(b[0][0]).toBe(true);
        if (plan.rows === 3) for (let s = 0; s < plan.steps; s++) expect(b.every((row) => row[s])).toBe(false);
        if (plan.mode === 'repeat') for (const row of b) expect(row.slice(4)).toEqual(row.slice(0, 4));
      }
    }
  });

  it('compares beats and finds the steps that differ', () => {
    const a = empty(2, 4);
    const b = empty(2, 4);
    a[0][0] = true;
    expect(same(a, b)).toBe(false);
    expect(differences(a, b)).toEqual([0]);
    b[0][0] = true;
    expect(same(a, b)).toBe(true);
  });
});
