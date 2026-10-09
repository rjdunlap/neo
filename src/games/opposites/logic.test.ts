import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import { cardToTap, makeRounds, opposites, PLANS, word } from './logic';

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

  it("gives the ghost finger's bot only right taps, and clears every round: one card, the one named, the opposite, or each pair in turn", () => {
    for (const plan of PLANS) {
      for (let seed = 1; seed <= 100; seed++) {
        for (const r of makeRounds(plan, new Rng(seed))) {
          const done = r.cards.map(() => false);
          let picked: number | null = null;
          let taps = 0;
          for (let i = cardToTap(plan, r, done, picked); i !== null; i = cardToTap(plan, r, done, picked)) {
            expect(++taps).toBeLessThanOrEqual(6);
            expect(done[i]).toBe(false);
            if (plan.mode === 'find') expect(word(r.cards[i])).toBe(word(r.ask!));
            if (plan.mode === 'opposite') expect(opposites(r.cards[i], r.ask!)).toBe(true);
            if (plan.mode === 'pairs') {
              if (picked === null) picked = i;
              else {
                expect(opposites(r.cards[picked], r.cards[i])).toBe(true);
                done[picked] = done[i] = true;
                picked = null;
              }
              continue;
            }
            // One right tap clears the round: the game moves on to the next one, so the bot is not asked again.
            done.fill(true);
            break;
          }
          expect(taps).toBe(plan.mode === 'pairs' ? 6 : 1);
          expect(done.every(Boolean)).toBe(true);
        }
      }
    }
  });
});
