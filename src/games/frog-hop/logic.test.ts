import { describe, expect, it } from 'vitest';
import { frogArt } from '../../art/animals';
import { frogHop } from './index';
import { SCRIPT } from '../../content/voice-script';
import { Rng } from '../../engine/random';
import { answerOf, answerSlot, GAP_CARDS, makeQuestions, PLANS, WINDOW, missKind, hintCharge, stickerNumber } from './logic';

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
      const backs = makeQuestions(at('back-ten'), new Rng(seed));
      for (const q of backs) {
        expect(q.start).toBeGreaterThanOrEqual(11);
        expect(q.start).toBeLessThanOrEqual(16);
        expect(-q.hops).toBeGreaterThanOrEqual(4);
        expect(-q.hops).toBeLessThanOrEqual(8);
        expect(q.target).toBeGreaterThanOrEqual(2);
        expect(q.target).toBeLessThan(10);
        expect(q.toTen).toBe(q.start - 10);
        expect(q.toTen).toBeGreaterThanOrEqual(1);
        expect(q.remaining).toBeGreaterThanOrEqual(1);
        expect(q.remaining).toBe(10 - q.target);
        expect(q.toTen! + q.remaining!).toBe(-q.hops);
        expect(GAP_CARDS).toContain(q.toTen);
        // The whole trip, start to answer, is on screen at once.
        expect(q.lo).toBeLessThanOrEqual(q.target);
        expect(q.lo + WINDOW - 1).toBeGreaterThanOrEqual(q.start);
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


describe('Frog Hop support', () => {
  it('recognizes every wrong pad/card, with direction taking priority over one-off counting', () => {
    for (const plan of PLANS) for (let seed = 1; seed <= 100; seed++) for (const q of makeQuestions(plan, new Rng(seed))) {
      const card = plan.mode === 'gap';
      const answer = answerOf(plan.mode, q);
      for (const chosen of card ? GAP_CARDS : Array.from({ length: WINDOW }, (_, i) => q.lo + i)) {
        const kind = missKind(q.start, answer, chosen, card);
        expect(kind === 'correct').toBe(chosen === answer);
        if (kind === 'one-more') expect(chosen).toBe(answer + (card ? 1 : Math.sign(answer - q.start)));
        if (kind === 'one-less') expect(chosen).toBe(answer - (card ? 1 : Math.sign(answer - q.start)));
        if (kind === 'forward' || kind === 'backward') {
          expect(card).toBe(false);
          expect((chosen - q.start) * (answer - q.start)).toBeLessThanOrEqual(0);
        }
      }
    }
    expect(missKind(4, 7, 3, false)).toBe('forward');
    expect(missKind(7, 4, 8, false)).toBe('backward');
    expect(missKind(4, 7, 8, false)).toBe('one-more');
    expect(missKind(4, 7, 6, false)).toBe('one-less');
    expect(missKind(7, 3, 4, false)).toBe('one-less');
    expect(missKind(7, 3, 2, false)).toBe('one-more');
    expect(missKind(8, 2, 3, true)).toBe('one-more');
    expect(missKind(8, 2, 1, true)).toBe('one-less');
  });

  it('waits for two misses and charges once across both stages of a question', () => {
    expect(hintCharge(1, false, false)).toBe(0);
    expect(hintCharge(2, false, false)).toBe(1);
    expect(hintCharge(3, true, true)).toBe(0);
    // After the bridge, the glow is cleared but help remains recorded.
    expect(hintCharge(2, false, true)).toBe(0);
  });

  it('covers the whole ladder in school and rejects nonexistent descriptions', () => {
    expect(frogHop.levels('school')).toEqual({ min: 3, max: PLANS.length });
    expect(frogHop.describeLevel(0)).toBeUndefined();
    expect(frogHop.describeLevel(PLANS.length + 1)).toBeUndefined();
    expect(SCRIPT['hop.ten'][0]).toContain('{k}');
    for (const n of ['{a}', '{k}', '{n}']) expect(SCRIPT['hop.rest'][0]).toContain(n);
    for (const n of ['{a}', '{k}', '{n}']) expect(SCRIPT['hop.restback'][0]).toContain(n);
    for (const n of ['{n}', '{k}']) expect(SCRIPT['hop.backten'][0]).toContain(n);
  });

  it('pins the original seeded sticker numerals and frog drawing', () => {
    const numbers = Array.from({ length: 100 }, (_, seed) => stickerNumber(new Rng(seed)));
    expect(numbers).toMatchSnapshot();
    const frog = frogArt();
    const g = frog.children[0] as import('pixi.js').Graphics;
    const drawing = g.context.instructions.map(i => {
      if (i.action === 'texture') throw new Error('Frog art must remain code-drawn');
      const { texture: _texture, ...style } = i.data.style;
      return { action: i.action, path: i.data.path.instructions, style };
    });
    const fingerprint = [...JSON.stringify(drawing)].reduce((h, ch) => Math.imul(h ^ ch.charCodeAt(0), 16777619) >>> 0, 2166136261);
    expect(fingerprint).toMatchSnapshot();
    frog.destroy({ children: true });
  });
});
