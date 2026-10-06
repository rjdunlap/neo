import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import { makeRounds, opposites, PLANS, word } from './logic';

describe('Opposites', () => {
  it('asks only about pictures on screen, with exactly one right answer', () => {
    for (const plan of PLANS) {
      for (let seed = 1; seed <= 200; seed++) {
        for (const r of makeRounds(plan, new Rng(seed))) {
          if (plan.mode === 'find') {
            expect(r.cards.filter((c) => word(c) === word(r.ask!))).toHaveLength(1);
          }
          if (plan.mode === 'opposite') {
            expect(r.cards.filter((c) => opposites(c, r.ask!))).toHaveLength(1);
            expect(r.cards).toHaveLength(3);
          }
          if (plan.mode === 'pairs') {
            expect(r.cards).toHaveLength(6);
            for (const c of r.cards) expect(r.cards.filter((o) => opposites(o, c))).toHaveLength(1);
          }
        }
      }
    }
  });
});
