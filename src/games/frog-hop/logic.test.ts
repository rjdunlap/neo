import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import { answerOf, answerSlot, GAP_CARDS, makeQuestions, PLANS, WINDOW } from './logic';

describe('Frog Hop', () => {
  it('asks questions whose start and answer are both on the pads in view', () => {
    for (const plan of PLANS) {
      for (let seed = 1; seed <= 300; seed++) {
        const qs = makeQuestions(plan, new Rng(seed));
        expect(qs).toHaveLength(plan.questions);
        qs.forEach((q, i) => {
          expect(q.target - q.start).toBe(q.hops);
          expect(q.hops).not.toBe(0);
          for (const n of [q.start, q.target]) {
            expect(n).toBeGreaterThanOrEqual(0);
            expect(n).toBeLessThanOrEqual(plan.top);
            expect(n).toBeGreaterThanOrEqual(q.lo);
            expect(n).toBeLessThan(q.lo + WINDOW);
          }
          expect(q.lo + WINDOW - 1).toBeLessThanOrEqual(Math.max(plan.top, WINDOW - 1));
          if (i > 0) expect(answerOf(plan.mode, q)).not.toBe(answerOf(plan.mode, qs[i - 1]));
        });
      }
    }
  });

  it('keeps each level to its idea: one step, 1 to 4 hops each way, cards that include the gap', () => {
    const at = (mode: string) => PLANS.find((p) => p.mode === mode)!;
    for (let seed = 1; seed <= 200; seed++) {
      for (const q of makeQuestions(at('next'), new Rng(seed))) expect(Math.abs(q.hops)).toBe(1);
      for (const q of makeQuestions(at('add'), new Rng(seed))) expect(q.hops).toBeGreaterThanOrEqual(1), expect(q.hops).toBeLessThanOrEqual(4);
      for (const q of makeQuestions(at('back'), new Rng(seed))) expect(q.hops).toBeLessThanOrEqual(-1), expect(q.hops).toBeGreaterThanOrEqual(-4);
      for (const q of makeQuestions(at('gap'), new Rng(seed))) expect(GAP_CARDS).toContain(answerOf('gap', q));
      for (const q of makeQuestions(at('big'), new Rng(seed))) expect(Math.abs(q.hops)).toBeGreaterThanOrEqual(2);
      for (const q of makeQuestions(at('make-ten'), new Rng(seed))) {
        expect(q.start).toBeGreaterThanOrEqual(6);
        expect(q.start).toBeLessThanOrEqual(9);
        expect(q.target).toBeGreaterThan(10);
        expect(q.target).toBeLessThanOrEqual(20);
        expect(q.toTen).toBe(10 - q.start);
        expect(q.remaining).toBe(q.target - 10);
        expect(q.hops).toBe(q.toTen! + q.remaining!);
        expect(GAP_CARDS).toContain(q.toTen);
      }
      // Finding numbers starts where the frog already sits.
      const finds = makeQuestions(at('find'), new Rng(seed));
      finds.slice(1).forEach((q, i) => expect(q.start).toBe(finds[i].target));
    }
  });

  it('always has an answer on the screen for the ghost finger to tap, and it is the right one', () => {
    for (const plan of PLANS) {
      for (let seed = 1; seed <= 100; seed++) {
        for (const q of makeQuestions(plan, new Rng(seed))) {
          const slot = answerSlot(plan.mode, q, q.lo);
          expect(slot, plan.name).toBeGreaterThanOrEqual(0);
          if (plan.mode === 'gap') expect(GAP_CARDS[slot]).toBe(Math.abs(q.hops));
          else expect(q.lo + slot).toBe(q.target);
        }
      }
    }
    // A pad that has slid out of view is not an answer on screen.
    expect(answerSlot('find', { start: 0, target: 12, hops: 12, lo: 0 }, 0)).toBe(-1);
  });
});
