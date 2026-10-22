import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import { answerOf, choices, hintSpans, isRuler, longerShorter, makeMeasures, measureTouch, planFor, PLANS, RULER, temptingReading, UNIT_SIZE } from './logic';
import { inchworm } from '.';
import { levelsInOrder } from '../../progress/difficulty';

describe('Inchworm Measure', () => {
  it('demonstrates every mode by filling each row and then choosing the exact reading', () => {
    for (const plan of PLANS) for (let seed = 1; seed <= 50; seed++) {
      for (const m of makeMeasures(plan, new Rng(seed))) {
        const worms = Array(m.other ? 2 : 1).fill(0);
        for (let step = 0; step < 20; step++) {
          const move = measureTouch(m, plan.mode, worms);
          if (!move) break;
          if (move.kind === 'answer') {
            expect(move.value).toBe(answerOf(m, plan.mode));
            break;
          }
          expect(move.row).toBeGreaterThanOrEqual(0);
          expect(move.row).toBeLessThan(worms.length);
          worms[move.row]++;
        }
        if (!isRuler(plan.mode)) {
          expect(worms[0]).toBe(m.length);
          if (m.other) expect(worms[1]).toBe(m.other.length);
        }
        expect(measureTouch(m, plan.mode, worms)).toEqual(plan.mode === 'lay' ? null : { kind: 'answer', value: answerOf(m, plan.mode) });
      }
    }
  });

  it('makes lengths that fit, different each time, and answers that are offered', () => {
    for (const plan of PLANS.filter((p) => p.mode !== 'units')) {
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
    expect(PLANS.map((p) => p.mode)).toEqual(['lay', 'say', 'compare', 'ruler', 'rulerdiff', 'rulersum', 'units']);
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

describe('Inchworm Measure with big worms, then little worms (level 7)', () => {
  const plan = planFor(7);
  const seeds = Array.from({ length: 300 }, (_, i) => i + 1);

  it('measures one stick twice: b big worms, then exactly 2b little ones, ending at the same mark', () => {
    expect(plan.mode).toBe('units');
    expect(isRuler(plan.mode)).toBe(false);
    for (const seed of seeds) {
      const ms = makeMeasures(plan, new Rng(seed));
      expect(ms).toHaveLength(4);
      ms.forEach((m, i) => {
        expect([2, 3]).toContain(m.length);
        expect(m.other!.thing).toBe(m.thing);
        expect(m.other!.length).toBe(2 * m.length);
        expect(m.length * UNIT_SIZE[0]).toBe(m.other!.length * UNIT_SIZE[1]);
        expect(m.other!.length).toBeLessThanOrEqual(plan.max);
        if (i > 0) expect(m.thing).not.toBe(ms[i - 1].thing);
      });
      for (const b of [2, 3]) expect(ms.filter((m) => m.length === b).length).toBeLessThan(3);
    }
  });

  it('asks for the little worms first, then one each way in either order', () => {
    const orders = new Set<string>();
    for (const seed of seeds) {
      const ms = makeMeasures(plan, new Rng(seed));
      expect(ms.slice(0, 2).map((m) => m.ask)).toEqual(['little', 'little']);
      expect([...ms.slice(2).map((m) => m.ask)].sort()).toEqual(['big', 'little']);
      orders.add(ms.slice(2).map((m) => m.ask).join());
      for (const m of ms) expect(answerOf(m, 'units')).toBe(m.ask === 'big' ? m.length : m.other!.length);
    }
    expect(orders).toEqual(new Set(['little,big', 'big,little']));
  });

  it('offers just the two counts, and where the right one sits does not give it away', () => {
    const places = { little: new Set<number>(), big: new Set<number>() };
    for (const seed of seeds) {
      const rng = new Rng(seed);
      for (const m of makeMeasures(plan, rng)) {
        const cs = choices(m, 'units', rng);
        expect([...cs].sort()).toEqual([m.length, m.other!.length].sort());
        places[m.ask!].add(cs.indexOf(answerOf(m, 'units')));
      }
    }
    expect(places.little).toEqual(new Set([0, 1]));
    expect(places.big).toEqual(new Set([0, 1]));
  });

  it('the finger lays b big worms, then 2b little ones, then taps the count that was asked', () => {
    for (const seed of seeds.slice(0, 50)) for (const m of makeMeasures(plan, new Rng(seed))) {
      const worms = [0, 0];
      const rows: number[] = [];
      let move = measureTouch(m, 'units', worms);
      while (move?.kind === 'worm') {
        rows.push(move.row);
        worms[move.row]++;
        move = measureTouch(m, 'units', worms);
      }
      expect(rows).toEqual([...Array(m.length).fill(0), ...Array(2 * m.length).fill(1)]);
      expect(move).toEqual({ kind: 'answer', value: m.ask === 'big' ? m.length : 2 * m.length });
    }
  });

  it('leaves levels 1-6 as they were', () => {
    expect(PLANS.slice(0, 6).map((p) => p.mode)).toEqual(['lay', 'say', 'compare', 'ruler', 'rulerdiff', 'rulersum']);
    for (let level = 1; level <= 6; level++) for (const m of makeMeasures(planFor(level), new Rng(level))) expect(m.ask).toBeUndefined();
  });

  it('is the pre-K top and comes after "how many worms long" at school', () => {
    expect(inchworm.levels('prek')).toEqual({ min: 1, max: 7, order: [1, 2, 7] });
    expect(inchworm.levels('school')).toEqual({ min: 1, max: 7, order: [1, 2, 7, 3, 4, 5, 6] });
    expect(levelsInOrder(inchworm.levels('prek'))).toEqual([1, 2, 7]);
    expect(levelsInOrder(inchworm.levels('school'))).toEqual([1, 2, 7, 3, 4, 5, 6]);
  });
});
