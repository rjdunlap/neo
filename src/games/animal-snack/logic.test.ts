import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import { ANIMALS, eaterOf, FAVORITE, makeRounds, PLANS } from './logic';

describe('Animal Snack', () => {
  it('gives every animal its own food, so each snack has one eater', () => {
    const foods = ANIMALS.map((a) => FAVORITE[a]!);
    expect(new Set(foods).size).toBe(foods.length);
    for (const a of ANIMALS) expect(eaterOf(FAVORITE[a]!)).toBe(a);
  });

  it('asks about an animal that is there, never the same one twice running, with 2 to 4 snacks to count', () => {
    for (const plan of PLANS) {
      for (let seed = 1; seed <= 200; seed++) {
        const rounds = makeRounds(plan, new Rng(seed));
        rounds.forEach((r, i) => {
          expect(r.animals).toHaveLength(plan.animals);
          expect(new Set(r.animals).size).toBe(plan.animals);
          if (plan.mode === 'who' || plan.mode === 'count') {
            expect(r.animals).toContain(r.ask);
            if (i > 0) expect(r.ask).not.toBe(rounds[i - 1].ask);
          }
          if (plan.mode === 'count') expect(r.n).toBeGreaterThanOrEqual(2), expect(r.n).toBeLessThanOrEqual(4);
        });
      }
    }
  });
});
