import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import { fits, makeRound, OVERLAPPING, placeOf, PLANS, SEPARATE } from './logic';

describe('Critter Sort', () => {
  it('separate hoops never overlap, and overlapping hoops really do', () => {
    const kinds = ['cow', 'duck', 'pig', 'cat', 'bear', 'dog', 'bunny'] as const;
    const all = kinds.flatMap((kind) => [{ kind, hat: false }, { kind, hat: true }]);
    for (const [a, b] of SEPARATE) expect(all.some((c) => fits(c, a) && fits(c, b))).toBe(false);
    for (const [a, b] of OVERLAPPING) {
      expect(all.some((c) => fits(c, a) && fits(c, b)), `${a} ${b}`).toBe(true);
      expect(all.some((c) => fits(c, a) && !fits(c, b))).toBe(true);
      expect(all.some((c) => !fits(c, a) && fits(c, b))).toBe(true);
    }
  });

  it('every part of the diagram gets a critter, critters are all different, and only one rule fits a guess', () => {
    for (const plan of PLANS) {
      for (let seed = 1; seed <= 200; seed++) {
        const r = makeRound(plan, new Rng(seed));
        expect(r.critters).toHaveLength(plan.critters);
        expect(new Set(r.critters.map((c) => `${c.kind}${c.hat}`)).size).toBe(plan.critters);
        const places = new Set(r.critters.map((c) => placeOf(c, r.rules)));
        expect(places.has('out')).toBe(true);
        expect(places.has('left')).toBe(true);
        if (plan.mode === 'two') expect(places.has('right')).toBe(true), expect(places.has('both')).toBe(false);
        if (plan.mode === 'venn') expect(places.has('both')).toBe(true), expect(places.has('right')).toBe(true);
        if (plan.mode === 'guess') {
          expect(r.options).toHaveLength(3);
          const sortsTheSame = r.options!.filter((o) => r.critters.every((c) => fits(c, o) === fits(c, r.rules[0])));
          expect(sortsTheSame).toEqual([r.rules[0]]);
        }
      }
    }
  });
});
