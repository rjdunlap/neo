import { describe, expect, it } from 'vitest';
import { frogArt } from '../../art/animals';
import { frogHop } from './index';
import { SCRIPT } from '../../content/voice-script';
import { Rng } from '../../engine/random';
import {
  answerOf,
  answerSlot,
  GAP_CARDS,
  makeQuestions,
  PLANS,
  WINDOW,
  missKind,
  hintCharge,
  stickerNumber,
  fracMiss,
  matchMiss,
  fracName,
  fracWords,
  quarterName,
  saysNumbers,
  landingNumbers,
  showsDots,
  dotLayout,
  DOT_GAP,
  DOT_R,
  flowerOn,
  isFrac,
  type HopQuestion,
} from './logic';

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
      for (const q of makeQuestions(at('add'), new Rng(seed)))
        (expect(q.hops).toBeGreaterThanOrEqual(1), expect(q.hops).toBeLessThanOrEqual(4));
      for (const q of makeQuestions(at('back'), new Rng(seed)))
        (expect(q.hops).toBeLessThanOrEqual(-1), expect(q.hops).toBeGreaterThanOrEqual(-4));
      for (const q of makeQuestions(at('gap'), new Rng(seed)))
        expect(GAP_CARDS).toContain(answerOf('gap', q));
      for (const q of makeQuestions(at('big'), new Rng(seed)))
        expect(Math.abs(q.hops)).toBeGreaterThanOrEqual(2);
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
    for (const plan of PLANS)
      for (let seed = 1; seed <= 100; seed++)
        for (const q of makeQuestions(plan, new Rng(seed))) {
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
    const drawing = g.context.instructions.map((i) => {
      if (i.action === 'texture') throw new Error('Frog art must remain code-drawn');
      const { texture: _texture, ...style } = i.data.style;
      return { action: i.action, path: i.data.path.instructions, style };
    });
    const fingerprint = [...JSON.stringify(drawing)].reduce(
      (h, ch) => Math.imul(h ^ ch.charCodeAt(0), 16777619) >>> 0,
      2166136261,
    );
    expect(fingerprint).toMatchSnapshot();
    frog.destroy({ children: true });
  });
});

describe('Frog Hop, Fraction Landings', () => {
  const at = (mode: string) => PLANS.find((p) => p.mode === mode)!;
  const key = (q: HopQuestion) => `${q.start}/${q.jump}/${q.count}/${q.jump2}`;

  it('hops whole numbers of ticks along 0 to 2, with every landing on the nine pads in view', () => {
    for (const mode of ['frac-hop', 'frac-match']) {
      const plan = at(mode);
      expect(plan.unit).toBe(4);
      for (let seed = 1; seed <= 300; seed++)
        for (const q of makeQuestions(plan, new Rng(seed))) {
          expect(q.target).toBe(q.start + q.jump! * q.count!);
          expect(Number.isInteger(q.target)).toBe(true);
          expect(q.lo).toBe(0);
          for (const t of [q.start, q.target])
            (expect(t).toBeGreaterThanOrEqual(0), expect(t).toBeLessThanOrEqual(8));
          expect([1, 2, 4]).toContain(q.jump);
          if (mode === 'frac-hop') expect(q.target).toBeLessThanOrEqual(4);
        }
    }
  });

  it('opens Fraction Hop on one half hop from zero, with another half hop, a start past zero and no repeats', () => {
    for (let seed = 1; seed <= 300; seed++) {
      const qs = makeQuestions(at('frac-hop'), new Rng(seed));
      expect(key(qs[0])).toBe('0/2/1/undefined');
      expect(qs.filter((q) => q.jump === 2).length).toBeGreaterThanOrEqual(2);
      expect(qs.some((q) => q.start > 0)).toBe(true);
      expect(new Set(qs.map(key)).size).toBe(5);
    }
  });

  it('asks Fraction Match for a card that reaches the same lily with the other hop size', () => {
    for (let seed = 1; seed <= 300; seed++) {
      const qs = makeQuestions(at('frac-match'), new Rng(seed));
      expect(key(qs[0])).toBe('0/2/2/1');
      expect(new Set(qs.map(key)).size).toBe(5);
      expect(qs.some((q) => q.target > 4)).toBe(true);
      qs.forEach((q, i) => {
        expect(q.start).toBe(0);
        expect(q.answer2! * q.jump2!).toBe(q.target);
        expect(q.jump2).not.toBe(q.jump);
        expect(GAP_CARDS).toContain(q.answer2);
        expect(q.count).toBeLessThanOrEqual(4);
        if (i > 0) {
          expect(q.target).not.toBe(qs[i - 1].target);
          expect(q.answer2).not.toBe(qs[i - 1].answer2);
        }
      });
    }
  });

  it('names every wrong pad, the most telling slip first', () => {
    for (const mode of ['frac-hop', 'frac-match'])
      for (let seed = 1; seed <= 100; seed++)
        for (const q of makeQuestions(at(mode), new Rng(seed)))
          for (let pad = 0; pad < WINDOW; pad++) {
            const kind = fracMiss(q.start, q.jump!, q.count!, pad);
            expect(kind === 'correct').toBe(pad === q.target);
            if (kind === 'backward') expect(pad).toBeLessThanOrEqual(q.start);
            if (kind === 'size') expect(pad).toBe(q.start + (q.jump === 1 ? 2 : 1) * q.count!);
            if (kind === 'whole') (expect(q.jump).toBeLessThan(4), expect(pad).toBe(q.start + 4 * q.count!));
            if (kind === 'one-more') expect(pad).toBe(q.target + 1);
            if (kind === 'one-less') expect(pad).toBe(q.target - 1);
          }
    // A half hop answered with one-tick hops is a size slip before a one-off count.
    expect(fracMiss(0, 2, 1, 1)).toBe('size');
    // Quarter hops answered with half hops, then with whole hops.
    expect(fracMiss(0, 1, 2, 4)).toBe('size');
    expect(fracMiss(0, 1, 1, 4)).toBe('whole');
    expect(fracMiss(1, 1, 2, 4)).toBe('one-more');
    expect(fracMiss(2, 1, 1, 2)).toBe('backward');
    expect(fracMiss(0, 1, 3, 1)).toBe('count');
  });

  it('names a wrong card: the first count again, then one off, then a miscount', () => {
    const q = makeQuestions(at('frac-match'), new Rng(1))[0];
    expect(matchMiss(q, 4)).toBe('correct');
    expect(matchMiss(q, 2)).toBe('same');
    expect(matchMiss(q, 5)).toBe('one-more');
    expect(matchMiss(q, 3)).toBe('one-less');
    expect(matchMiss(q, 1)).toBe('count');
  });

  it('names ticks 0 to 2 in glyphs and words that agree, with a quarter name only for even ticks', () => {
    expect(Array.from({ length: 9 }, (_, t) => fracName(t))).toEqual([
      '0',
      '¼',
      '½',
      '¾',
      '1',
      '1¼',
      '1½',
      '1¾',
      '2',
    ]);
    expect(fracName(6)).toBe('1½');
    expect(fracWords(6)).toBe('one and a half');
    for (let t = 0; t <= 8; t++) {
      expect(fracWords(t)).toBeTruthy();
      expect(quarterName(t) !== undefined).toBe([2, 4, 6, 8].includes(t));
    }
    expect(quarterName(2)).toBe('two quarters');
  });

  it('points the ghost finger at the right pad, and at Fraction Match the right card after the flag', () => {
    for (const mode of ['frac-hop', 'frac-match'] as const)
      for (let seed = 1; seed <= 100; seed++)
        for (const q of makeQuestions(at(mode), new Rng(seed))) {
          expect(answerSlot(mode, q, q.lo)).toBe(q.target);
          if (mode === 'frac-match') expect(GAP_CARDS[answerSlot(mode, q, q.lo, true)]).toBe(q.answer2);
        }
  });

  it('puts both levels at the top of school only, and the voice lines carry their slots', () => {
    const fl = PLANS.length;
    expect(at('frac-match')).toBe(PLANS[fl - 1]);
    expect(at('frac-hop')).toBe(PLANS[fl - 2]);
    expect(frogHop.levels('prek').max).toBeLessThan(fl - 1);
    for (const n of ['{where}', '{hops}']) expect(SCRIPT['hop.frac'][0]).toContain(n);
    expect(SCRIPT['hop.frac.second'][0]).toContain('{size}');
    for (const n of ['{first}', '{second}', '{name}']) expect(SCRIPT['hop.frac.same'][0]).toContain(n);
  });

  describe('say the numbers, dots and flowers (dive slice 2)', () => {
    it('says the numerals crossed, in order, ending on the target, one per hop, on levels 3, 4 and 6 only', () => {
      expect(PLANS.filter((p) => saysNumbers(p.mode)).map((p) => PLANS.indexOf(p) + 1)).toEqual([3, 4, 6]);
      for (const plan of PLANS.filter((p) => saysNumbers(p.mode)))
        for (let seed = 1; seed <= 200; seed++)
          for (const q of makeQuestions(plan, new Rng(seed))) {
            const said = landingNumbers(q.start, q.target);
            // The tally adds one dot per spoken numeral, so it equals the hops.
            expect(said).toHaveLength(Math.abs(q.hops));
            expect(said.at(-1)).toBe(q.target);
            said.forEach((n, i) => expect(n).toBe(q.start + Math.sign(q.hops) * (i + 1)));
            expect(said).not.toContain(q.start);
          }
    });

    it('gives the landing line a numeral slot', () => {
      expect(SCRIPT['hop.landed'].length).toBeGreaterThan(0);
      for (const line of SCRIPT['hop.landed']) expect(line).toContain('{n}');
    });

    it("draws a pad's dots equal to its numeral, fives grouped, inside the pad's step", () => {
      expect(PLANS.filter((p) => showsDots(p.mode)).map((p) => PLANS.indexOf(p) + 1)).toEqual([1, 2]);
      const top = Math.max(...PLANS.filter((p) => showsDots(p.mode)).map((p) => p.top));
      for (let n = 0; n <= top; n++) {
        const dots = dotLayout(n);
        expect(dots).toHaveLength(n);
        expect(dots.filter((d) => d.y === 0)).toHaveLength(Math.min(5, n));
        for (const d of dots) expect(Math.abs(d.x) + DOT_R).toBeLessThanOrEqual(104 / 2);
        // Two rows at most, so the dots stay a short way under the numeral.
        expect(new Set(dots.map((d) => d.y)).size).toBeLessThanOrEqual(2);
        expect(Math.max(0, ...dots.map((d) => d.y))).toBeLessThanOrEqual(DOT_GAP);
      }
    });

    it('puts a flower only on 5, 10, 15 and 20 from level 3, never on 0 or the fraction line', () => {
      PLANS.forEach((plan, i) => {
        const flowers = Array.from({ length: plan.top + 1 }, (_, n) => n).filter((n) =>
          flowerOn(plan.mode, n),
        );
        if (i < 2 || isFrac(plan.mode)) expect(flowers).toEqual([]);
        else expect(flowers).toEqual([5, 10, 15, 20].filter((n) => n <= plan.top));
      });
    });
  });
});
