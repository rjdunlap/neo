import { describe, expect, it } from 'vitest';
import { frogArt } from '../../art/animals';
import { frogHop } from './index';
import { SCRIPT } from '../../content/voice-script';
import { Rng } from '../../engine/random';
import { computeView } from '../../engine/view';
import { GUIDE_CORNER } from '../../creatures/home-layout';
import {
  ownScene,
  planFor,
  ESTIMATE_FIRST,
  ESTIMATE_SPREAD,
  valueAt,
  placeOf,
  nearestTen,
  closeness,
  estimateLayout,
  hopsLayout,
  openLine,
  overshoots,
  routeLanding,
  routeWords,
  shortestRoute,
  LEVELS,
  hopLayout,
  UPRIGHT_PAD_ROW,
  sceneFor,
  SCENES,
  PAD_HIT,
  CARD_HIT,
  type Box,
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
  countsHops,
  crossesTen,
  COUNT_UP_CROSSINGS,
  TEN,
  YOUR_WAY_BACKS,
  TENS_BACKS,
  padValue,
  splitsAtTen,
  type HopQuestion,
} from './logic';

describe('Frog Hop', () => {
  it('asks questions whose start and answer are both on the pads in view', () => {
    for (const plan of PLANS.filter((p) => !ownScene(p.mode))) {
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
    for (const plan of PLANS.filter((p) => !ownScene(p.mode))) {
      for (let seed = 1; seed <= 100; seed++) {
        for (const q of makeQuestions(plan, new Rng(seed))) {
          const slot = answerSlot(plan.mode, q, q.lo);
          expect(slot, plan.name).toBeGreaterThanOrEqual(0);
          if (countsHops(plan.mode)) expect(GAP_CARDS[slot]).toBe(Math.abs(q.hops));
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
    expect(frogHop.levels('school')).toEqual({ min: 3, max: 15 });
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
    // Saved levels 9 and 10; Count up was appended after them as 11.
    const fl = 10;
    expect(at('frac-match')).toBe(PLANS[fl - 1]);
    expect(at('frac-hop')).toBe(PLANS[fl - 2]);
    expect(frogHop.levels('prek').max).toBeLessThan(fl - 1);
    for (const n of ['{where}', '{hops}']) expect(SCRIPT['hop.frac'][0]).toContain(n);
    expect(SCRIPT['hop.frac.second'][0]).toContain('{size}');
    for (const n of ['{first}', '{second}', '{name}']) expect(SCRIPT['hop.frac.same'][0]).toContain(n);
  });

  describe('say the numbers, dots and flowers (dive slice 2)', () => {
    it('says the numerals crossed, in order, ending on the target, one per hop, on levels 3, 4, 6 and 13 only', () => {
      expect(PLANS.filter((p) => saysNumbers(p.mode)).map((p) => PLANS.indexOf(p) + 1)).toEqual([
        3, 4, 6, 13,
      ]);
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
        if (i < 2 || isFrac(plan.mode) || ownScene(plan.mode)) expect(flowers).toEqual([]);
        else expect(flowers).toEqual([5, 10, 15, 20].filter((n) => n <= plan.top));
      });
    });
  });

  describe('Count up to take away (level 11)', () => {
    const plan = PLANS.find((p) => p.mode === 'count-up')!;

    it('is appended as level 11, after the fraction levels, so saved levels keep their numbers', () => {
      expect(PLANS.indexOf(plan) + 1).toBe(11);
      expect(PLANS.map((p) => p.mode).slice(0, 10)).toEqual([
        'find',
        'next',
        'add',
        'back',
        'gap',
        'big',
        'make-ten',
        'back-ten',
        'frac-hop',
        'frac-match',
      ]);
      expect(frogHop.levels('school').max).toBeGreaterThanOrEqual(11);
      expect(frogHop.describeLevel(11)).toContain('Count up');
      expect(countsHops('count-up')).toBe(true);
    });

    it('asks a take-away from 11-20 with a difference a card shows, three of five crossing ten', () => {
      const diffs = new Set<number>();
      for (let seed = 1; seed <= 500; seed++) {
        const qs = makeQuestions(plan, new Rng(seed));
        expect(qs.filter(crossesTen)).toHaveLength(COUNT_UP_CROSSINGS);
        qs.forEach((q, i) => {
          expect(q.target).toBeGreaterThanOrEqual(11);
          expect(q.target).toBeLessThanOrEqual(20);
          expect(q.hops).toBe(q.target - q.start);
          expect(GAP_CARDS).toContain(q.hops);
          expect(q.hops).toBeLessThanOrEqual(6);
          // The frog stands on the smaller number: counting up, not back.
          expect(q.start).toBeLessThan(q.target);
          if (!crossesTen(q)) expect(q.start).toBeGreaterThanOrEqual(10);
          if (i > 0) expect(q.target).not.toBe(qs[i - 1].target);
          diffs.add(q.hops);
        });
      }
      expect([...diffs].sort()).toEqual([1, 2, 3, 4, 5, 6]);
    });

    it('is answered by the number card for the hops, which the ghost finger and couch ring find', () => {
      for (let seed = 1; seed <= 100; seed++)
        for (const q of makeQuestions(plan, new Rng(seed))) {
          expect(answerOf('count-up', q)).toBe(q.hops);
          expect(GAP_CARDS[answerSlot('count-up', q, q.lo)]).toBe(q.hops);
        }
    });

    it('names counting the numbers instead of the hops as one too many', () => {
      const q: HopQuestion = { start: 9, target: 13, hops: 4, lo: 6 };
      expect(missKind(q.start, answerOf('count-up', q), 5, true)).toBe('one-more');
      expect(missKind(q.start, answerOf('count-up', q), 3, true)).toBe('one-less');
      expect(missKind(q.start, answerOf('count-up', q), 1, true)).toBe('count');
      expect(SCRIPT['hop.countup'][0]).toContain('{n}');
      expect(SCRIPT['hop.countup'][0]).toContain('{m}');
    });
  });

  describe('Over ten, your way (level 12)', () => {
    const plan = PLANS.find((p) => p.mode === 'your-way')!;

    it('is appended as level 12, after Count up, so saved levels keep their numbers', () => {
      expect(PLANS.indexOf(plan) + 1).toBe(12);
      expect(PLANS[10].mode).toBe('count-up');
      expect(frogHop.levels('school').min).toBe(3);
      expect(frogHop.levels('prek')).toEqual({ min: 1, max: 4 });
      expect(frogHop.describeLevel(12)).toContain('your way');
      // No number cards: she taps pads, and the stop at 10 is optional rather than a stage.
      expect(countsHops('your-way')).toBe(false);
      expect(splitsAtTen('your-way')).toBe(false);
    });

    it('crosses 10 on every trip, forward from 5-9 or back from 11-15 by 4-8, with 10 strictly between', () => {
      const seen = { on: new Set<number>(), back: new Set<number>() };
      for (let seed = 1; seed <= 500; seed++) {
        const qs = makeQuestions(plan, new Rng(seed));
        expect(qs.filter((q) => q.hops < 0)).toHaveLength(YOUR_WAY_BACKS);
        expect(qs[0].hops).toBeGreaterThan(0);
        qs.forEach((q, i) => {
          const k = Math.abs(q.hops);
          expect(k).toBeGreaterThanOrEqual(4);
          expect(k).toBeLessThanOrEqual(8);
          if (q.hops > 0) {
            expect(q.start).toBeGreaterThanOrEqual(5);
            expect(q.start).toBeLessThanOrEqual(9);
            seen.on.add(q.start);
          } else {
            expect(q.start).toBeGreaterThanOrEqual(11);
            expect(q.start).toBeLessThanOrEqual(15);
            seen.back.add(q.start);
          }
          expect(Math.min(q.start, q.target)).toBeLessThan(TEN);
          expect(Math.max(q.start, q.target)).toBeGreaterThan(TEN);
          expect(q.toTen).toBe(Math.abs(TEN - q.start));
          expect(q.remaining).toBe(Math.abs(q.target - TEN));
          expect(q.toTen! + q.remaining!).toBe(k);
          expect(q.toTen).toBeGreaterThanOrEqual(1);
          expect(q.remaining).toBeGreaterThanOrEqual(1);
          // The stop at 10 is always offered: it is on a pad in view, as are the start and the landing.
          for (const n of [q.start, TEN, q.target]) {
            expect(n).toBeGreaterThanOrEqual(q.lo);
            expect(n).toBeLessThan(q.lo + WINDOW);
          }
          if (i > 0) {
            expect(q.target).not.toBe(qs[i - 1].target);
            expect([q.toTen, q.remaining]).not.toEqual([qs[i - 1].toTen, qs[i - 1].remaining]);
          }
        });
      }
      expect([...seen.on].sort()).toEqual([5, 6, 7, 8, 9]);
      expect([...seen.back].sort()).toEqual([11, 12, 13, 14, 15]);
    });

    it('is answered by the landing pad, and a wrong landing gets its named kind from where the frog stands', () => {
      const q: HopQuestion = { start: 8, target: 13, hops: 5, lo: 6, toTen: 2, remaining: 3 };
      expect(answerOf('your-way', q)).toBe(13);
      expect(q.lo + answerSlot('your-way', q, q.lo)).toBe(13);
      // Straight from 8: 14 counts the starting pad; 6 goes the wrong way, so the line says hop forward.
      expect(missKind(q.start, q.target, 14, false)).toBe('one-more');
      expect(missKind(q.start, q.target, 6, false)).toBe('forward');
      // After her stop at 10: 12 is one hop short of the rest.
      expect(missKind(TEN, q.target, 12, false)).toBe('one-less');
    });

    it('gives the stop, the remainder and the split lines their slots', () => {
      expect(SCRIPT['hop.yourway'][0]).toContain('10');
      // No "1 hops": a start on 9 or 11 is one hop from ten, so the stop lines name no unit after {a}.
      for (const id of ['hop.yourway.stop', 'hop.yourway.stopback'] as const) {
        expect(SCRIPT[id][0]).toContain('{a}');
        expect(SCRIPT[id][0]).not.toMatch(/\{a\} hops/);
      }
      expect(SCRIPT['hop.yourway.more'][0]).toContain('{n}');
      expect(SCRIPT['hop.yourway.split'][0]).toMatch(/\{a\}.*\{n\}/);
      for (const id of ['hop.yourway.yay', 'hop.yourway.yayback'] as const)
        for (const slot of ['{n}', '{k}', '{m}']) expect(SCRIPT[id][0]).toContain(slot);
    });
  });
});

describe('Frog Hop, Hop by tens (level 13)', () => {
  const plan = PLANS.find((p) => p.mode === 'tens')!;

  it('is the next free school level, appended without reordering, and says its landings', () => {
    expect(PLANS.indexOf(plan) + 1).toBe(13);
    expect(PLANS.length).toBeGreaterThanOrEqual(13);
    expect(frogHop.describeLevel(13)).toBe(plan.name);
    expect(saysNumbers('tens')).toBe(true);
    expect(countsHops('tens') || splitsAtTen('tens') || isFrac('tens')).toBe(false);
  });

  it('starts on 10 to 70 and hops 1 to 4 tens each way, landing on a multiple of ten from 0 to 100', () => {
    const seen = { on: new Set<number>(), back: new Set<number>(), k: new Set<number>() };
    for (let seed = 1; seed <= 400; seed++) {
      const qs = makeQuestions(plan, new Rng(seed));
      expect(qs[0].hops).toBeGreaterThan(0);
      expect(qs.filter((q) => q.hops < 0)).toHaveLength(TENS_BACKS);
      qs.forEach((q, i) => {
        const start = padValue(plan, q.start);
        const target = padValue(plan, q.target);
        expect(start).toBeGreaterThanOrEqual(10);
        expect(start).toBeLessThanOrEqual(70);
        expect(target % 10).toBe(0);
        expect(target).toBeGreaterThanOrEqual(0);
        expect(target).toBeLessThanOrEqual(100);
        expect(Math.abs(q.hops)).toBeGreaterThanOrEqual(1);
        expect(Math.abs(q.hops)).toBeLessThanOrEqual(4);
        (q.hops > 0 ? seen.on : seen.back).add(start);
        seen.k.add(Math.abs(q.hops));
        if (i > 0) expect(q.target).not.toBe(qs[i - 1].target);
      });
    }
    expect([...seen.k].sort()).toEqual([1, 2, 3, 4]);
    expect([...seen.on].sort((a, b) => a - b)).toEqual([10, 20, 30, 40, 50, 60, 70]);
    expect([...seen.back].sort((a, b) => a - b)).toEqual([10, 20, 30, 40, 50, 60, 70]);
  });

  it('slides the line to show 100 at least once a round, and the pads in view read 0 to 100 by tens', () => {
    for (let seed = 1; seed <= 300; seed++) {
      const qs = makeQuestions(plan, new Rng(seed));
      expect(qs.some((q) => q.lo + WINDOW - 1 === plan.top)).toBe(true);
      for (const q of qs) {
        const shown = Array.from({ length: WINDOW }, (_, i) => padValue(plan, q.lo + i));
        expect(shown[0]).toBe(q.lo * 10);
        expect(shown.at(-1)).toBeLessThanOrEqual(100);
        expect(shown.every((n, i) => i === 0 || n - shown[i - 1] === 10)).toBe(true);
      }
    }
    // Other plans read their place: the stride is only the tens line's.
    expect(padValue(PLANS[5], 17)).toBe(17);
  });

  it('names a wrong pad in pads of ten: the wrong side, then a pad off by one ten', () => {
    // 30 + 20: 60 counts the starting pad, 40 misses a hop, 20 goes the wrong way.
    const q: HopQuestion = { start: 3, target: 5, hops: 2, lo: 0 };
    expect(q.lo + answerSlot('tens', q, q.lo)).toBe(5);
    expect(missKind(q.start, q.target, 6, false)).toBe('one-more');
    expect(missKind(q.start, q.target, 4, false)).toBe('one-less');
    expect(missKind(q.start, q.target, 2, false)).toBe('forward');
    // The counted hops say the tens: 40, 50.
    expect(landingNumbers(q.start, q.target).map((n) => padValue(plan, n))).toEqual([40, 50]);
  });

  it('asks in tens, with no "1 tens"', () => {
    for (const id of ['hop.tens', 'hop.tens.back'] as const)
      expect(SCRIPT[id][0]).toMatch(/\{n\}.*\{k\} tens/);
    for (const id of ['hop.tens.one', 'hop.tens.oneback'] as const) {
      expect(SCRIPT[id][0]).toContain('one ten.');
      expect(SCRIPT[id][0]).not.toContain('{k}');
    }
  });
});

describe('Scenes (slice 6)', () => {
  // The four views slice 7 checked: the design area, an upright iPad, and a phone either way round.
  const VIEWS = [
    [1024, 768],
    [768, 1024],
    [390, 844],
    [844, 390],
  ].map(([w, h]) => computeView(w, h));
  // Held upright on the 768 × 1024 area: a 4:3 tablet shape, a tall phone, a short phone and a very tall one.
  const UPRIGHT_VIEWS = [
    [768, 1024],
    [390, 844],
    [390, 700],
    [430, 932],
    [360, 780],
  ].map(([w, h]) => computeView(w, h, undefined, true));
  const overlap = (a: Box, b: Box) =>
    a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
  const hit = (c: { x: number; y: number }, s: { w: number; h: number }): Box => ({
    x: c.x - s.w / 2,
    y: c.y - s.h / 2,
    w: s.w,
    h: s.h,
  });

  it('draws every scene over a hundred seeds, after the questions, so a seed makes the same questions as before', () => {
    const seen = new Set<string>();
    for (let s = 0; s < 100; s++) seen.add(sceneFor(new Rng(s)));
    expect([...seen].sort()).toEqual([...SCENES].sort());
    for (const plan of PLANS) {
      const a = makeQuestions(plan, new Rng(5));
      const rng = new Rng(5);
      const b = makeQuestions(plan, rng);
      sceneFor(rng);
      expect(b).toEqual(a);
    }
  });

  it('lays out every level in every scene at four views: pads, sign and cards on screen, apart, and clear of the pet', () => {
    const pet: (v: { h: number }) => Box = (v) => ({
      x: 0,
      y: v.h - GUIDE_CORNER.h,
      w: GUIDE_CORNER.w,
      h: GUIDE_CORNER.h,
    });
    for (const v of [...VIEWS, ...UPRIGHT_VIEWS])
      for (const plan of PLANS) {
        // The layout takes no scene: a pad's place and hit area are the same in all four.
        const l = hopLayout(v, plan.mode, GUIDE_CORNER.w);
        const pads = l.pads.map((p) => hit(p, PAD_HIT));
        const cards = l.cards.map((c) => hit(c, CARD_HIT));
        const what = `${plan.mode} at ${Math.round(v.w)}×${Math.round(v.h)}`;
        expect(pads.length, what).toBe(WINDOW);
        expect(PAD_HIT.w, what).toBeGreaterThanOrEqual(100);
        expect(Math.min(CARD_HIT.w, CARD_HIT.h), what).toBeGreaterThanOrEqual(100);
        for (const b of [...pads, ...cards, l.sign]) {
          expect(b.x, what).toBeGreaterThanOrEqual(0);
          expect(b.y, what).toBeGreaterThanOrEqual(0);
          expect(b.x + b.w, what).toBeLessThanOrEqual(v.w);
          expect(b.y + b.h, what).toBeLessThanOrEqual(v.h);
          expect(overlap(b, pet(v)), what).toBe(false);
        }
        for (const p of pads) {
          expect(overlap(p, l.sign), what).toBe(false);
          for (const c of cards) expect(overlap(p, c), what).toBe(false);
        }
        for (let i = 1; i < cards.length; i++) expect(overlap(cards[i - 1], cards[i]), what).toBe(false);
        expect(cards.length, what).toBe(
          countsHops(plan.mode) ||
            plan.mode === 'make-ten' ||
            plan.mode === 'back-ten' ||
            plan.mode === 'frac-match'
            ? GAP_CARDS.length
            : 0,
        );
      }
  });

  it('folds the line into two rows upright, hung up from the bottom edge, in order, with the sign and bracket clear', () => {
    for (const v of UPRIGHT_VIEWS)
      for (const plan of PLANS) {
        const l = hopLayout(v, plan.mode, GUIDE_CORNER.w);
        const what = `${plan.mode} at ${Math.round(v.w)}×${Math.round(v.h)} upright`;
        const a = l.pads.slice(0, UPRIGHT_PAD_ROW);
        const b = l.pads.slice(UPRIGHT_PAD_ROW);
        expect(new Set(a.map((p) => p.y)).size, what).toBe(1);
        expect(new Set(b.map((p) => p.y)).size, what).toBe(1);
        expect(b[0].y - a[0].y, what).toBeGreaterThanOrEqual(PAD_HIT.h + 100);
        for (const row of [a, b])
          for (let i = 1; i < row.length; i++)
            expect(row[i].x - row[i - 1].x, what).toBeGreaterThanOrEqual(PAD_HIT.w);
        // Left to right, then the next row: each pad is right of the one before in its row, and the second row starts under the first.
        expect(b[0].x, what).toBe(a[0].x);
        // Hung up from the bottom: the lowest card or pad rests within 260 of the bottom edge (a card level) or clear above the pet.
        const lowest = Math.max(
          ...l.pads.map((p) => p.y + PAD_HIT.h / 2),
          ...l.cards.map((c) => c.y + CARD_HIT.h / 2),
        );
        expect(v.h - lowest, what).toBeLessThanOrEqual(l.cards.length ? 16 : GUIDE_CORNER.h + 100);
        // The sign sits above the first row, under the top, clear of the top corners' buttons.
        expect(l.sign.y + l.sign.h, what).toBeLessThanOrEqual(a[0].y - PAD_HIT.h / 2);
        // The fraction line's "one whole" bracket (92 to 140 under the first row) fits between the rows.
        expect(a[0].y + 140, what).toBeLessThanOrEqual(b[0].y - PAD_HIT.h / 2);
      }
    // A 768 × 1024 view has room for the sign under the shell buttons.
    const v = UPRIGHT_VIEWS[0];
    for (const plan of PLANS)
      expect(hopLayout(v, plan.mode, GUIDE_CORNER.w).sign.y, plan.mode).toBeGreaterThanOrEqual(130);
  });
});

describe('Big hops and little hops (level 14)', () => {
  const plan = PLANS[13];
  const questions = (seed: number) => makeQuestions(plan, new Rng(seed));

  it('is the next ladder level, in school', () => {
    expect(plan.mode).toBe('hops');
    expect(LEVELS.school?.max).toBeGreaterThanOrEqual(14);
  });

  it('asks tens and ones: neither start nor distance is a multiple of ten, the flag is on the line', () => {
    for (let seed = 1; seed <= 300; seed++) {
      const qs = questions(seed);
      expect(qs).toHaveLength(4);
      for (const q of qs) {
        expect(q.start).toBeGreaterThanOrEqual(12);
        expect(q.start).toBeLessThanOrEqual(58);
        expect(q.start % 10).not.toBe(0);
        expect(q.hops).toBeGreaterThanOrEqual(11);
        expect(q.hops).toBeLessThanOrEqual(45);
        expect(q.hops % 10).not.toBe(0);
        expect(q.target).toBe(q.start + q.hops);
        expect(q.target).toBeLessThanOrEqual(100);
        expect(q.bigs! * 10 + q.smalls!).toBe(q.hops);
        expect(q.bigs).toBeGreaterThanOrEqual(1);
        expect(q.smalls).toBeGreaterThanOrEqual(1);
      }
      expect(new Set(qs.map((q) => q.hops)).size).toBe(4);
      qs.slice(1).forEach((q, i) => expect(q.bigs).not.toBe(qs[i].bigs));
      expect(qs.some((q) => (q.start % 10) + q.smalls! > 10)).toBe(true);
    }
  });

  it('opens on 47 to 72, two big hops and five little ones', () => {
    const q = questions(7)[0];
    expect([q.start, q.target, q.bigs, q.smalls]).toEqual([47, 72, 2, 5]);
  });

  it('lands the same in any order, and an extra big hop overshoots once', () => {
    const q = questions(3)[0];
    const route = [...Array(q.bigs!).fill(10), ...Array(q.smalls!).fill(1)];
    const shuffled = [...route].reverse();
    expect(routeLanding(q.start, route)).toBe(q.target);
    expect(routeLanding(q.start, shuffled)).toBe(q.target);
    expect(overshoots(q.start, q.target, route)).toBe(0);
    expect(overshoots(q.start, q.target, shuffled)).toBe(0);
    expect(overshoots(q.start, q.target, [...route, 10])).toBe(1);
    expect(shortestRoute(q.hops)).toEqual({ bigs: q.bigs, smalls: q.smalls });
  });

  it('names the route in words', () => {
    expect(routeWords(2, 5)).toBe('Two big hops and five little hops');
    expect(routeWords(1, 1)).toBe('One big hop and one little hop');
  });

  it('shows a window with the start, the flag and the ten above it, at most 70 numbers', () => {
    for (let seed = 1; seed <= 300; seed++)
      for (const q of questions(seed)) {
        const { lo, hi, scale } = openLine(q);
        expect(lo).toBeLessThanOrEqual(q.start);
        expect(hi).toBeGreaterThanOrEqual(Math.min(100, (Math.floor(q.target / 10) + 1) * 10));
        expect(hi - lo).toBeLessThanOrEqual(70);
        expect(scale).toBeGreaterThan(0);
        expect(scale * (hi - lo)).toBeLessThanOrEqual(12 * 70);
      }
  });

  it('keeps the big, small and back lilies at least 100 units, apart, clear of the guide, inside every view', () => {
    const views = [
      { w: 1280, h: 720 },
      { w: 1024, h: 768 },
      { w: 768, h: 1024, upright: true as const },
      { w: 768, h: 1400, upright: true as const },
    ];
    for (const v of views) {
      const l = hopsLayout(v, 200);
      const boxes = [l.big, l.small, l.back];
      for (const b of boxes) {
        expect(b.w).toBeGreaterThanOrEqual(100);
        expect(b.h).toBeGreaterThanOrEqual(100);
        expect(b.x - b.w / 2).toBeGreaterThanOrEqual(200);
        expect(b.x + b.w / 2).toBeLessThanOrEqual(v.w);
        expect(b.y + b.h / 2).toBeLessThanOrEqual(v.h);
      }
      for (let i = 1; i < boxes.length; i++)
        expect(boxes[i].x - boxes[i].w / 2).toBeGreaterThanOrEqual(boxes[i - 1].x + boxes[i - 1].w / 2);
      expect(l.line.y).toBeLessThan(l.big.y - 70);
    }
  });
});

describe('Where does it go? (level 15)', () => {
  const plan = PLANS[14];
  const questions = (seed: number) => makeQuestions(plan, new Rng(seed));

  it('is the top of school, after Big hops and little hops', () => {
    expect(plan.mode).toBe('estimate');
    expect(LEVELS.school?.max).toBe(15);
    expect(planFor(15)).toBe(plan);
  });

  it('asks three guesses (37 first, never 0, 50, 100 or a ten, spread out), then one ten on the marked line', () => {
    for (let seed = 1; seed <= 300; seed++) {
      const qs = questions(seed);
      expect(qs).toHaveLength(4);
      expect(qs.map((q) => q.place)).toEqual(['guess', 'guess', 'guess', 'ticks']);
      expect(qs[0].target).toBe(ESTIMATE_FIRST);
      const guesses = qs.slice(0, 3).map((q) => q.target);
      for (const n of guesses) {
        expect(n).toBeGreaterThan(0);
        expect(n).toBeLessThan(100);
        expect(n % 10).not.toBe(0);
      }
      for (let i = 0; i < 3; i++)
        for (let j = i + 1; j < 3; j++)
          expect(Math.abs(guesses[i] - guesses[j])).toBeGreaterThanOrEqual(ESTIMATE_SPREAD);
      const t = qs[3].target;
      expect(t % 10).toBe(0);
      expect([0, 50, 100]).not.toContain(t);
    }
  });

  it('maps the line linearly, and every number has a reachable place that reads back as itself', () => {
    const [x0, x1] = [70, 698];
    expect(valueAt(x0, x0, x1)).toBe(0);
    expect(valueAt(x1, x0, x1)).toBe(100);
    expect(valueAt((x0 + x1) / 2, x0, x1)).toBe(50);
    expect(valueAt(x0 - 50, x0, x1)).toBe(0);
    expect(valueAt(x1 + 50, x0, x1)).toBe(100);
    for (let n = 0; n <= 100; n++) {
      expect(valueAt(placeOf(n, x0, x1), x0, x1)).toBe(n);
      expect(nearestTen(n) % 10).toBe(0);
      expect(Math.abs(nearestTen(n) - n)).toBeLessThanOrEqual(5);
    }
  });

  it('says how close a guess was for every guess, the same either side', () => {
    for (let t = 0; t <= 100; t++)
      for (let g = 0; g <= 100; g++) {
        const c = closeness(g, t);
        expect(['spot', 'close', 'near', 'far']).toContain(c);
        expect(closeness(t + (t - g), t)).toBe(c);
      }
    expect(closeness(37, 37)).toBe('spot');
    expect(closeness(45, 37)).toBe('close');
    expect(closeness(20, 37)).toBe('near');
    expect(closeness(90, 37)).toBe('far');
    for (const c of ['spot', 'close', 'near'])
      expect(SCRIPT[`hop.est.${c}` as keyof typeof SCRIPT]).toBeTruthy();
  });

  it('lays the line out inside the view, clear of the guide corner and the sign, on every view', () => {
    for (const [w, h, upright] of [
      [1024, 768, false],
      [1366, 768, false],
      [768, 1662, true],
      [768, 1366, true],
    ] as const) {
      const v = { w, h, ...(upright ? { upright: true as const } : {}) };
      const L = estimateLayout(v);
      expect(L.band.x).toBeGreaterThanOrEqual(0);
      expect(L.band.x + L.band.w).toBeLessThanOrEqual(w);
      expect(L.band.h).toBeGreaterThanOrEqual(100);
      // Clear of the guide's corner below and the sign above.
      expect(L.band.y + L.band.h).toBeLessThan(h - GUIDE_CORNER.h);
      expect(L.band.y).toBeGreaterThan(L.sign.y + 60);
      // A mark by tens is at least 50 units from the next, so a place snaps to the mark she meant.
      expect((L.line.x1 - L.line.x0) / 10).toBeGreaterThanOrEqual(50);
    }
  });
});
