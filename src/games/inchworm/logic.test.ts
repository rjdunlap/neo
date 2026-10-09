import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import { answerOf, choices, hintSpans, isRuler, longerShorter, makeMeasures, PLANS, RULER, temptingReading } from './logic';

describe('Inchworm Measure', () => {
  it('makes lengths that fit, different each time, and answers that are offered', () => {
    for (const plan of PLANS) {
      for (let seed = 1; seed <= 300; seed++) {
        const rng = new Rng(seed);
        const ms = makeMeasures(plan, rng);
        expect(ms).toHaveLength(plan.rounds);
        ms.forEach((m, i) => {
          expect(m.length).toBeGreaterThanOrEqual(2);
          expect(m.length).toBeLessThanOrEqual(plan.max);
          if (i > 0) expect(m.length).not.toBe(ms[i - 1].length);
          if (plan.mode === 'compare') expect(m.other!.length).not.toBe(m.length);
          if (plan.mode === 'ruler') expect(m.start! + m.length).toBeLessThanOrEqual(10);
          const cs = choices(m, plan.mode, rng);
          expect(cs).toHaveLength(3);
          expect(new Set(cs).size).toBe(3);
          expect(cs).toContain(answerOf(m, plan.mode));
          // Things that don't start at 0 offer the tempting wrong reading (the end of the pencil).
          if (plan.mode === 'ruler' && m.start) expect(cs).toContain(m.start + m.length);
        });
        if (plan.mode === 'ruler') expect(ms.some((m) => m.start === 0) && ms.some((m) => m.start! > 0)).toBe(true);
      }
    }
  });
});

describe('Inchworm Measure on a ruler: how much longer, and end to end', () => {
  const plan = (mode: string) => PLANS.find((p) => p.mode === mode)!;

  it('keeps the ladder in order, with the two new ruler levels appended after reading a ruler', () => {
    expect(PLANS.map((p) => p.mode)).toEqual(['lay', 'say', 'compare', 'ruler', 'rulerdiff', 'rulersum']);
    expect(PLANS.filter((p) => isRuler(p.mode)).map((p) => p.mode)).toEqual(['ruler', 'rulerdiff', 'rulersum']);
  });

  it('puts both things on the ruler, with different lengths and different kinds', () => {
    for (let seed = 1; seed <= 400; seed++) {
      for (const mode of ['rulerdiff', 'rulersum'] as const) {
        const ms = makeMeasures(plan(mode), new Rng(seed));
        for (const m of ms) {
          const o = m.other!;
          expect(m.start! + m.length).toBeLessThanOrEqual(RULER);
          expect(o.start! + o.length).toBeLessThanOrEqual(RULER);
          expect(m.start).toBeGreaterThanOrEqual(0);
          expect(o.start).toBeGreaterThanOrEqual(0);
          expect(o.thing).not.toBe(m.thing);
          expect(o.length).toBeGreaterThanOrEqual(2);
          if (mode === 'rulerdiff') expect(o.length).not.toBe(m.length);
        }
        ms.forEach((m, i) => i > 0 && expect(answerOf(m, mode)).not.toBe(answerOf(ms[i - 1], mode)));
      }
    }
  });

  it('end to end: the second thing starts exactly where the first stops, and the answer is the two lengths added', () => {
    for (let seed = 1; seed <= 400; seed++) {
      const ms = makeMeasures(plan('rulersum'), new Rng(seed));
      for (const m of ms) {
        expect(m.other!.start).toBe(m.start! + m.length);
        expect(answerOf(m, 'rulersum')).toBe(m.length + m.other!.length);
        expect(m.start! + answerOf(m, 'rulersum')).toBeLessThanOrEqual(RULER);
      }
      expect(ms.some((m) => m.start === 0) && ms.some((m) => m.start! > 0)).toBe(true);
    }
  });

  it('how much longer: some rounds start together at 0 and some do not, and the answer is the lengths, not the ends', () => {
    for (let seed = 1; seed <= 400; seed++) {
      const ms = makeMeasures(plan('rulerdiff'), new Rng(seed));
      expect(ms.some((m) => m.start === 0 && m.other!.start === 0)).toBe(true);
      expect(ms.some((m) => m.start !== m.other!.start)).toBe(true);
      for (const m of ms) {
        const o = m.other!;
        expect(answerOf(m, 'rulerdiff')).toBe(Math.abs(m.length - o.length));
        const gap = Math.abs(m.start! + m.length - (o.start! + o.length));
        if (m.start !== o.start) {
          // Reading the ends instead of counting the spaces always gives a different, offered, wrong number.
          expect(gap).toBeGreaterThanOrEqual(1);
          expect(gap).not.toBe(answerOf(m, 'rulerdiff'));
          expect(temptingReading(m, 'rulerdiff')).toBe(gap);
          expect(choices(m, 'rulerdiff', new Rng(seed))).toContain(gap);
        } else expect(temptingReading(m, 'rulerdiff')).toBeNull();
      }
    }
  });

  it('end to end always offers a wrong reading (where the whole stops, or where the first one stops)', () => {
    for (let seed = 1; seed <= 400; seed++) {
      for (const m of makeMeasures(plan('rulersum'), new Rng(seed))) {
        const t = temptingReading(m, 'rulersum')!;
        expect(t).toBe(m.start ? m.start + m.length + m.other!.length : m.length);
        expect(t).not.toBe(answerOf(m, 'rulersum'));
        const cs = choices(m, 'rulersum', new Rng(seed));
        expect(cs).toContain(t);
        expect(cs).toContain(answerOf(m, 'rulersum'));
        expect(new Set(cs).size).toBe(3);
      }
    }
  });

  it('a hint counts to the answer: the extra spaces of the longer thing, or the spaces of both', () => {
    for (let seed = 1; seed <= 300; seed++) {
      for (const mode of ['ruler', 'rulerdiff', 'rulersum'] as const) {
        for (const m of makeMeasures(plan(mode), new Rng(seed))) {
          const spans = hintSpans(m, mode);
          const total = spans.reduce((n, s) => n + s.count, 0);
          expect(total).toBe(answerOf(m, mode));
          for (const s of spans) {
            expect(s.from).toBeGreaterThanOrEqual(0);
            expect(s.from + s.count).toBeLessThanOrEqual(RULER);
            const owner = s.row === 0 ? { start: m.start!, length: m.length } : { start: m.other!.start!, length: m.other!.length };
            // The lit spaces sit inside the thing they belong to.
            expect(s.from).toBeGreaterThanOrEqual(owner.start);
            expect(s.from + s.count).toBeLessThanOrEqual(owner.start + owner.length);
          }
          if (mode === 'rulerdiff') {
            const longerRow = m.length > m.other!.length ? 0 : 1;
            expect(spans).toHaveLength(1);
            expect(spans[0].row).toBe(longerRow);
          }
        }
      }
    }
  });

  it('names the longer and the shorter thing for the spoken question', () => {
    for (let seed = 1; seed <= 100; seed++) {
      for (const m of makeMeasures(plan('rulerdiff'), new Rng(seed))) {
        const [a, b] = longerShorter(m);
        const longer = m.length > m.other!.length ? m.thing : m.other!.thing;
        expect(a).toBe(longer);
        expect(b).not.toBe(a);
      }
    }
  });
});
