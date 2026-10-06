import { describe, expect, it } from 'vitest';
import { allowedParts, askedParts, PLANS, planFor } from './logic';

describe('Splish Splash', () => {
  it('asks for every part exactly once, one or two at a time', () => {
    for (const plan of PLANS.filter((p) => p.mode === 'parts')) {
      const seen = [];
      for (let i = 0; i < plan.parts.length; i += askedParts(plan, i).length) {
        const asked = askedParts(plan, i);
        expect(asked.length).toBe(plan.pairs ? 2 : 1);
        seen.push(...asked);
      }
      expect(seen).toEqual(plan.parts);
      expect(new Set(plan.parts).size).toBe(plan.parts.length);
    }
  });

  it('lets a pair be washed in any order, unless the level says first-then', () => {
    const anyOrder = PLANS.find((p) => p.pairs && !p.ordered)!;
    const [a, b] = askedParts(anyOrder, 0);
    expect(allowedParts(anyOrder, 0, () => false)).toEqual([a, b]);
    expect(allowedParts(anyOrder, 0, (p) => p === b)).toEqual([a]);

    const inOrder = PLANS.find((p) => p.ordered)!;
    const [first, then] = askedParts(inOrder, 0);
    expect(allowedParts(inOrder, 0, () => false)).toEqual([first]);
    expect(allowedParts(inOrder, 0, (p) => p === first)).toEqual([then]);
  });

  it('clamps levels to the ladder', () => {
    expect(planFor(0)).toBe(PLANS[0]);
    expect(planFor(99)).toBe(PLANS[PLANS.length - 1]);
  });
});
