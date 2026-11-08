import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import {
  answerOf,
  choices,
  hintSpans,
  HOP_MIN,
  hopTicks,
  isRuler,
  isWide,
  longerShorter,
  makeMeasures,
  measureTouch,
  planFor,
  PLANS,
  RULER,
  SLIDE_RULER,
  slideSlots,
  temptingReading,
  THINGS,
  UNIT_SIZE,
  type Measure,
} from './logic';
import { inchworm, THING_WORDS } from '.';
import { SCRIPT } from '../../content/voice-script';
import { levelsInOrder } from '../../progress/difficulty';

describe('Inchworm Measure', () => {
  it('demonstrates every mode by filling each row and then choosing the exact reading', () => {
    for (const plan of PLANS)
      for (let seed = 1; seed <= 50; seed++) {
        for (const m of makeMeasures(plan, new Rng(seed))) {
          const worms = Array(m.other ? 2 : 1).fill(0);
          for (let step = 0; step < 20; step++) {
            const move = measureTouch(m, plan.mode, worms);
            if (!move) break;
            if (move.kind === 'answer') {
              expect(move.value).toBe(answerOf(m, plan.mode));
              break;
            }
            if (move.kind === 'hop' || move.kind === 'slide') {
              worms[0]++;
              continue;
            }
            expect(move.row).toBeGreaterThanOrEqual(0);
            expect(move.row).toBeLessThan(worms.length);
            worms[move.row]++;
          }
          if (plan.mode === 'slide') expect(worms[0]).toBe(2);
          else if (!isRuler(plan.mode)) {
            expect(worms[0]).toBe(m.length);
            if (m.other) expect(worms[1]).toBe(m.other.length);
          }
          expect(measureTouch(m, plan.mode, worms)).toEqual(
            plan.mode === 'lay' ? null : { kind: 'answer', value: answerOf(m, plan.mode) },
          );
        }
      }
  });

  it('makes lengths that fit, different each time, and answers that are offered', () => {
    for (const plan of PLANS.filter((p) => p.mode !== 'units' && p.mode !== 'broken')) {
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
        if (plan.mode === 'ruler')
          expect(ms.some((m) => m.start === 0) && ms.some((m) => m.start! > 0)).toBe(true);
      }
    }
  });
});

describe('Inchworm Measure on a ruler: how much longer, and end to end', () => {
  const plan = (mode: string) => PLANS.find((p) => p.mode === mode)!;

  it('keeps the ladder in order, with the two new ruler levels appended after reading a ruler', () => {
    expect(PLANS.map((p) => p.mode)).toEqual([
      'lay',
      'say',
      'compare',
      'ruler',
      'rulerdiff',
      'rulersum',
      'units',
      'broken',
      'hop',
      'slide',
    ]);
    expect(PLANS.filter((p) => isRuler(p.mode)).map((p) => p.mode)).toEqual([
      'ruler',
      'rulerdiff',
      'rulersum',
      'broken',
    ]);
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
      for (const mode of ['ruler', 'rulerdiff', 'rulersum', 'broken'] as const) {
        for (const m of makeMeasures(plan(mode), new Rng(seed))) {
          const spans = hintSpans(m, mode);
          const total = spans.reduce((n, s) => n + s.count, 0);
          expect(total).toBe(answerOf(m, mode));
          for (const s of spans) {
            expect(s.from).toBeGreaterThanOrEqual(0);
            expect(s.from + s.count).toBeLessThanOrEqual(RULER);
            const owner =
              s.row === 0
                ? { start: m.start!, length: m.length }
                : { start: m.other!.start!, length: m.other!.length };
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
      orders.add(
        ms
          .slice(2)
          .map((m) => m.ask)
          .join(),
      );
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
    for (const seed of seeds.slice(0, 50))
      for (const m of makeMeasures(plan, new Rng(seed))) {
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
    // Seed 7's lengths and starts for levels 1-6, as they were before level 7 was appended. Which things
    // appear was refreshed with the five new things, so only the measuring numbers are pinned.
    const numbers = (m: Measure): unknown => ({
      length: m.length,
      start: m.start,
      other: m.other && { length: m.other.length, start: m.other.start },
    });
    const old = (m: {
      thing: string;
      length: number;
      start?: number;
      other?: { thing: string; length: number; start?: number };
    }) => numbers(m as Measure);
    expect([1, 2, 3, 4, 5, 6].map((l) => makeMeasures(planFor(l), new Rng(7)).map(numbers))).toEqual(
      (
        [
          [
            { thing: 'leaf', length: 2 },
            { thing: 'snake', length: 4 },
            { thing: 'pencil', length: 3 },
          ],
          [
            { thing: 'leaf', length: 2 },
            { thing: 'snake', length: 6 },
            { thing: 'pencil', length: 4 },
          ],
          [
            { thing: 'leaf', length: 2, other: { thing: 'stick', length: 6 } },
            { thing: 'snake', length: 3, other: { thing: 'leaf', length: 5 } },
            { thing: 'stick', length: 2, other: { thing: 'leaf', length: 4 } },
          ],
          [
            { thing: 'leaf', length: 2, start: 0 },
            { thing: 'snake', length: 8, start: 2 },
            { thing: 'pencil', length: 4, start: 0 },
            { thing: 'snake', length: 3, start: 3 },
          ],
          [
            { thing: 'leaf', length: 2, start: 0, other: { thing: 'stick', length: 8, start: 0 } },
            { thing: 'snake', length: 3, start: 0, other: { thing: 'stick', length: 7, start: 1 } },
            { thing: 'snake', length: 4, start: 1, other: { thing: 'pencil', length: 7, start: 3 } },
            { thing: 'leaf', length: 7, start: 1, other: { thing: 'pencil', length: 3, start: 1 } },
          ],
          [
            { thing: 'leaf', length: 2, start: 0, other: { thing: 'stick', length: 4, start: 2 } },
            { thing: 'snake', length: 3, start: 1, other: { thing: 'stick', length: 2, start: 4 } },
            { thing: 'pencil', length: 2, start: 0, other: { thing: 'snake', length: 2, start: 2 } },
            { thing: 'leaf', length: 4, start: 1, other: { thing: 'pencil', length: 4, start: 5 } },
          ],
        ] as Parameters<typeof old>[0][][]
      ).map((ms) => ms.map(old)),
    );
    expect(PLANS.slice(0, 6).map((p) => p.mode)).toEqual([
      'lay',
      'say',
      'compare',
      'ruler',
      'rulerdiff',
      'rulersum',
    ]);
    for (let level = 1; level <= 6; level++)
      for (const m of makeMeasures(planFor(level), new Rng(level))) expect(m.ask).toBeUndefined();
  });

  it('is the pre-K top and comes after "how many worms long" at school', () => {
    expect(inchworm.levels('prek')).toEqual({ min: 1, max: 7, order: [1, 2, 7] });
    expect(inchworm.levels('school')).toEqual({ min: 1, max: 10, order: [1, 2, 7, 9, 3, 4, 8, 5, 6, 10] });
    expect(levelsInOrder(inchworm.levels('prek'))).toEqual([1, 2, 7]);
    expect(levelsInOrder(inchworm.levels('school'))).toEqual([1, 2, 7, 9, 3, 4, 8, 5, 6, 10]);
  });
});

describe('Inchworm Measure: fresh things and the long jump', () => {
  it('every thing has a spoken word, and the five new ones are there', () => {
    expect(THINGS).toEqual(expect.arrayContaining(['crayon', 'carrot', 'rope', 'paintbrush', 'feather']));
    for (const t of THINGS) expect(THING_WORDS[t]).toBeTruthy();
    expect(Object.keys(THING_WORDS).sort()).toEqual([...THINGS].sort());
  });

  it('no thing shows in two rounds running, at any level, and every thing turns up', () => {
    const seen = new Set<string>();
    for (const plan of PLANS)
      for (let seed = 1; seed <= 300; seed++) {
        const ms = makeMeasures(plan, new Rng(seed));
        ms.forEach((m, i) => {
          const now = [m.thing, ...(m.other ? [m.other.thing] : [])];
          now.forEach((t) => seen.add(t));
          if (i === 0) return;
          const before = [ms[i - 1].thing, ...(ms[i - 1].other ? [ms[i - 1].other!.thing] : [])];
          // Big and little worms measure one thing twice in a round; across rounds nothing repeats.
          for (const t of new Set(now)) expect(before).not.toContain(t);
        });
      }
    expect([...seen].sort()).toEqual([...THINGS].sort());
  });

  it('level 3 has exactly one long-jump round, with two different jumps, in any of the three places', () => {
    const places = new Set<number>();
    for (let seed = 1; seed <= 300; seed++) {
      const ms = makeMeasures(planFor(3), new Rng(seed));
      const jumps = ms.filter((m) => m.jump);
      expect(jumps).toHaveLength(1);
      expect(jumps[0].other!.length).not.toBe(jumps[0].length);
      places.add(ms.findIndex((m) => m.jump));
    }
    expect(places).toEqual(new Set([0, 1, 2]));
    for (const level of [1, 2, 4, 5, 6, 7, 8])
      for (let seed = 1; seed <= 50; seed++)
        expect(makeMeasures(planFor(level), new Rng(seed)).some((m) => m.jump)).toBe(false);
  });
});

describe('Inchworm Measure: the broken ruler (level 8)', () => {
  const plan = planFor(8);
  const seeds = Array.from({ length: 300 }, (_, i) => i + 1);

  it('snaps at 2-5, the thing starts at or after the break and ends by 10, and no two rounds share an answer', () => {
    expect(plan.mode).toBe('broken');
    expect(isRuler(plan.mode)).toBe(true);
    for (const seed of seeds) {
      const ms = makeMeasures(plan, new Rng(seed));
      expect(ms).toHaveLength(4);
      for (const m of ms) {
        expect(m.brk).toBeGreaterThanOrEqual(2);
        expect(m.brk).toBeLessThanOrEqual(5);
        expect(m.start).toBeGreaterThanOrEqual(m.brk!);
        expect(m.length).toBeGreaterThanOrEqual(2);
        expect(m.start! + m.length).toBeLessThanOrEqual(RULER);
        expect(answerOf(m, 'broken')).toBe(m.length);
      }
      expect(new Set(ms.map((m) => answerOf(m, 'broken'))).size).toBe(4);
    }
  });

  it('offers the spaces, the end mark and the marks counted: three different pads', () => {
    for (const seed of seeds) {
      const rng = new Rng(seed);
      for (const m of makeMeasures(plan, rng)) {
        const cs = choices(m, 'broken', rng);
        expect([...cs].sort((a, b) => a - b)).toEqual(
          [m.length, m.length + 1, m.start! + m.length].sort((a, b) => a - b),
        );
        expect(new Set(cs).size).toBe(3);
        expect(temptingReading(m, 'broken')).toBe(m.start! + m.length);
        expect(hintSpans(m, 'broken')).toEqual([{ row: 0, from: m.start, count: m.length }]);
        expect(measureTouch(m, 'broken', [0])).toEqual({ kind: 'answer', value: m.length });
      }
    }
  });

  it('has its lines', () => {
    for (const id of [
      'worm.broken',
      'worm.brokenend',
      'worm.marks',
      'worm.jump',
      'worm.jumpmuch',
      'worm.pastprints',
    ] as const)
      expect(SCRIPT[id]).toBeTruthy();
  });
});

describe('Inchworm Measure: one worm, hop by hop (level 9)', () => {
  const plan = planFor(9);
  const seeds = Array.from({ length: 300 }, (_, i) => i + 1);

  it('is a wide layout that is not a ruler, three rounds of 3-8 hops, never the same length or thing twice running', () => {
    expect(plan.mode).toBe('hop');
    expect(isRuler(plan.mode)).toBe(false);
    expect(isWide(plan.mode)).toBe(true);
    const seen = new Set<number>();
    for (const seed of seeds) {
      const ms = makeMeasures(plan, new Rng(seed));
      expect(ms).toHaveLength(3);
      ms.forEach((m, i) => {
        seen.add(m.length);
        expect(m.length).toBeGreaterThanOrEqual(HOP_MIN);
        expect(m.length).toBeLessThanOrEqual(8);
        expect(m.other).toBeUndefined();
        if (i > 0) expect(m.length).not.toBe(ms[i - 1].length);
        if (i > 0) expect(m.thing).not.toBe(ms[i - 1].thing);
      });
    }
    expect([...seen].sort((a, b) => a - b)).toEqual([3, 4, 5, 6, 7, 8]);
  });

  it('exactly `length` hops reach the end: one chalk tick a hop, the last at the end, none at the start', () => {
    for (let length = HOP_MIN; length <= 8; length++) {
      const ticks = hopTicks(length);
      expect(ticks).toHaveLength(length);
      expect(ticks[0]).toBe(1);
      expect(ticks.at(-1)).toBe(length);
      expect(ticks).not.toContain(0);
    }
  });

  it('the finger taps the worm `length` times, then the pad with the hop count', () => {
    for (const seed of seeds)
      for (const m of makeMeasures(plan, new Rng(seed))) {
        const worms = [0];
        while (measureTouch(m, 'hop', worms)?.kind === 'hop') worms[0]++;
        expect(worms[0]).toBe(m.length);
        expect(measureTouch(m, 'hop', worms)).toEqual({ kind: 'answer', value: m.length });
        expect(answerOf(m, 'hop')).toBe(hopTicks(worms[0]).length);
      }
  });

  it('offers the hop count and two near it, all different and above zero', () => {
    for (const seed of seeds) {
      const rng = new Rng(seed);
      for (const m of makeMeasures(plan, rng)) {
        const cs = choices(m, 'hop', rng);
        expect(cs).toHaveLength(3);
        expect(new Set(cs).size).toBe(3);
        expect(cs).toContain(m.length);
        for (const c of cs) expect(Math.abs(c - m.length)).toBeLessThanOrEqual(2);
      }
    }
  });

  it('comes after big and little worms at school, and is not at pre-K', () => {
    expect(levelsInOrder(inchworm.levels('school'))).toEqual([1, 2, 7, 9, 3, 4, 8, 5, 6, 10]);
    expect(levelsInOrder(inchworm.levels('prek'))).toEqual([1, 2, 7]);
  });

  it('has its lines', () => {
    for (const id of ['worm.hop', 'worm.hops', 'worm.hoplong', 'worm.chalk'] as const)
      expect(SCRIPT[id]).toBeTruthy();
  });
});

describe('Inchworm Measure: longer than the ruler (level 10)', () => {
  const plan = planFor(10);

  it('is a wide layout that is not a ruler level: three rounds, a ruler of 4-6 and a thing from one more than it to twice it', () => {
    expect(plan.mode).toBe('slide');
    expect(isWide('slide') && !isRuler('slide')).toBe(true);
    for (let seed = 1; seed <= 300; seed++) {
      const ms = makeMeasures(plan, new Rng(seed));
      expect(ms).toHaveLength(3);
      ms.forEach((m, i) => {
        expect(m.ruler).toBeGreaterThanOrEqual(SLIDE_RULER.min);
        expect(m.ruler).toBeLessThanOrEqual(SLIDE_RULER.max);
        expect(m.length).toBeGreaterThan(m.ruler!);
        expect(m.length).toBeLessThanOrEqual(2 * m.ruler!);
        // Two lays always reach the end: the second starts at the mark and covers the rest.
        expect(slideSlots(m)[1] + m.ruler!).toBeGreaterThanOrEqual(m.length);
        if (i > 0) {
          expect(m.length).not.toBe(ms[i - 1].length);
          expect(m.thing).not.toBe(ms[i - 1].thing);
        }
      });
    }
  });

  it('offers the whole, the second part alone and one next to the whole; the second part is never the answer', () => {
    for (let seed = 1; seed <= 300; seed++) {
      const rng = new Rng(seed);
      for (const m of makeMeasures(plan, rng)) {
        const cs = choices(m, 'slide', rng);
        expect(new Set(cs).size).toBe(3);
        expect(cs).toContain(answerOf(m, 'slide'));
        expect(answerOf(m, 'slide')).toBe(m.length);
        const second = temptingReading(m, 'slide')!;
        expect(second).toBe(m.length - m.ruler!);
        expect(second).not.toBe(m.length);
        expect(cs).toContain(second);
        expect(cs.every((n) => n >= 1)).toBe(true);
      }
    }
  });

  it('the finger lays the ruler at 0, then at the chalk mark, then taps the whole', () => {
    for (const m of makeMeasures(plan, new Rng(7))) {
      expect(measureTouch(m, 'slide', [0])).toEqual({ kind: 'slide', at: 0 });
      expect(measureTouch(m, 'slide', [1])).toEqual({ kind: 'slide', at: m.ruler });
      expect(measureTouch(m, 'slide', [2])).toEqual({ kind: 'answer', value: m.length });
    }
  });

  it('the hint lights the first ruler and the rest, which add up to the whole', () => {
    for (const m of makeMeasures(plan, new Rng(11))) {
      const [a, b] = hintSpans(m, 'slide');
      expect(a).toEqual({ row: 0, from: 0, count: m.ruler });
      expect(b.from).toBe(m.ruler);
      expect(a.count + b.count).toBe(m.length);
    }
  });

  it('comes last at school and is not at pre-K', () => {
    expect(levelsInOrder(inchworm.levels('school')).at(-1)).toBe(10);
    expect(levelsInOrder(inchworm.levels('prek'))).not.toContain(10);
  });

  it('has its lines', () => {
    for (const id of [
      'worm.slide',
      'worm.slidemark',
      'worm.slidehow',
      'worm.secondpart',
      'worm.firstthenrest',
    ] as const)
      expect(SCRIPT[id]).toBeTruthy();
  });
});
