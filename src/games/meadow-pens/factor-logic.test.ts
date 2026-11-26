import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import { computeView } from '../../engine/view';
import { VOICE } from './voice';
import {
  columnCells,
  correctCard,
  factorTasks,
  LOFT,
  loftCards,
  loftTotal,
  lengthOf,
  MISSING,
  missingCards,
  askVars,
  running,
  word,
} from './factor-logic';
import { cellAt, cellRect, centre, CELLS, COLS, meadowLayout, ROWS, targets, xOf, yOf } from './logic';

describe('level 6 case table', () => {
  it('every case is A = rows x length with rows 2-4, length 3-6, three distinct positive cards and one answer', () => {
    expect(MISSING.map((c) => c.id)).toEqual(['M1', 'M2', 'M3', 'M4', 'M5', 'M6', 'M7', 'M8', 'M9']);
    for (const c of MISSING) {
      const len = lengthOf(c);
      expect(Number.isInteger(len)).toBe(true);
      expect(c.rows).toBeGreaterThanOrEqual(2);
      expect(c.rows).toBeLessThanOrEqual(4);
      expect(len).toBeGreaterThanOrEqual(3);
      expect(len).toBeLessThanOrEqual(6);
      const cards = missingCards(c);
      expect(new Set(cards).size).toBe(3);
      expect(cards.every((n) => n > 0)).toBe(true);
      expect(cards.filter((n) => n === len)).toHaveLength(1);
      // the subtraction card is area minus rows, the one-off card one column short
      expect(cards[1]).toBe(c.total - c.rows);
      expect(cards[2]).toBe(len - 1);
      expect(cards[1]).toBeGreaterThan(len);
    }
  });
  it('matches the definition table exactly', () => {
    expect(MISSING.map((c) => [c.total, c.rows, lengthOf(c), c.total - c.rows, lengthOf(c) - 1])).toEqual([
      [6, 2, 3, 4, 2],
      [8, 2, 4, 6, 3],
      [12, 3, 4, 9, 3],
      [10, 2, 5, 8, 4],
      [12, 2, 6, 10, 5],
      [15, 3, 5, 12, 4],
      [20, 4, 5, 16, 4],
      [18, 3, 6, 15, 5],
      [24, 4, 6, 20, 5],
    ]);
  });
});

describe('level 7 case table', () => {
  it('floors fit the grid either way, every row has three distinct positive cards and one answer', () => {
    expect(LOFT.map((c) => c.id)).toEqual(['V1', 'V2', 'V3', 'V4', 'V5', 'V6', 'V7']);
    for (const c of LOFT) {
      expect(c.w * c.h).toBeGreaterThan(0);
      expect(c.w).toBeLessThanOrEqual(COLS - 2);
      expect(c.h).toBeLessThanOrEqual(ROWS);
      expect(c.layers).toBeLessThanOrEqual(ROWS);
      const cards = loftCards(c);
      expect(new Set(cards).size).toBe(3);
      expect(cards.filter((n) => n === loftTotal(c))).toHaveLength(1);
      expect(cards[1]).toBe(c.w * c.h);
      expect(cards[2]).toBe(c.w * c.h + c.layers);
    }
    expect(LOFT.map(loftTotal)).toEqual([18, 12, 12, 16, 16, 24, 24]);
  });
});

describe('five-question rounds', () => {
  for (const level of [6, 7] as const)
    it(`level ${level}: authored first case, four different others, seeded and stable`, () => {
      for (let seed = 1; seed <= 60; seed++)
        for (const authored of [true, false]) {
          const tasks = factorTasks(level, new Rng(seed), authored);
          expect(tasks).toHaveLength(5);
          expect(tasks[0].id).toBe(level === 6 ? 'M3' : 'V1');
          expect(new Set(tasks.map((t) => t.id)).size).toBe(5);
          expect(tasks[0].mirror).toBe(false);
          for (const t of tasks) {
            expect(t.cards).toHaveLength(3);
            expect(new Set(t.cards).size).toBe(3);
            expect(t.cards.filter((n) => n === correctCard(t))).toHaveLength(1);
          }
          expect(factorTasks(level, new Rng(seed), authored)).toEqual(tasks);
        }
    });
  it('the authored first question keeps its card order: 4, 9, 3 and 18, 6, 9', () => {
    expect(factorTasks(6, new Rng(5), true)[0].cards).toEqual([4, 9, 3]);
    expect(factorTasks(7, new Rng(5), true)[0].cards).toEqual([18, 6, 9]);
  });
  it('cells: level 6 grass is one column, the blanket is always five columns, mirrored or not', () => {
    for (let seed = 1; seed <= 40; seed++)
      for (const t of factorTasks(6, new Rng(seed))) {
        if (t.kind !== 'missing') throw new Error('level 6');
        expect(t.grass).toHaveLength(t.rows);
        expect(t.blanket).toHaveLength(t.rows * 5);
        expect(new Set([...t.grass, ...t.blanket]).size).toBe(t.rows * COLS);
        const first = new Set(columnCells(t, 0));
        expect([...first].sort()).toEqual([...t.grass].sort());
        // the strip to its answer length is exactly rows x length cells
        const strip = Array.from({ length: t.length }, (_, x) => columnCells(t, x)).flat();
        expect(strip).toHaveLength(t.total);
        expect(strip.every((c) => c < CELLS)).toBe(true);
      }
  });
  it('cells: level 7 floor is the case floor and the gauge column never meets it', () => {
    for (let seed = 1; seed <= 40; seed++)
      for (const t of factorTasks(7, new Rng(seed))) {
        if (t.kind !== 'loft') throw new Error('level 7');
        expect(t.floor).toHaveLength(t.w * t.h);
        expect(t.gauge).toHaveLength(t.layers);
        expect(t.gauge.some((c) => t.floor.includes(c))).toBe(false);
        const xs = new Set(t.gauge.map(xOf));
        expect(xs.size).toBe(1);
        expect(new Set(t.gauge.map(yOf)).size).toBe(t.layers);
      }
  });
});

describe('spoken quantities', () => {
  it('say counts as words, the running counts step by the rows or the floor, and every case has them', () => {
    const v = VOICE as Record<string, string[]>;
    for (const id of ['ask6', 'try6.short', 'try6.many', 'lift6', 'ask7', 'stack7'])
      expect(v[`meadow.${id}`], id).toHaveLength(1);
    expect(running(3, 12)).toBe('Three, six, nine, twelve');
    expect(running(6, 24, true)).toBe('Six. Twelve. Eighteen. Twenty-four');
    expect(askVars(factorTasks(6, new Rng(1))[0])).toEqual({ total: 'twelve', rows: 'three' });
    expect(askVars(factorTasks(7, new Rng(1))[0])).toEqual({ bales: 'six', layers: 'three' });
    for (const c of MISSING) {
      expect(word(c.total)).toBeTruthy();
      expect(running(c.rows, c.total).split(', ')).toHaveLength(lengthOf(c));
    }
    for (const c of LOFT) expect(word(loftTotal(c))).toBeTruthy();
    for (const lines of Object.values(v)) for (const l of lines) expect(l).not.toMatch(/undefined|NaN/);
  });
});

describe('levels 6 and 7 layout', () => {
  const views = [
    computeView(1024, 768),
    computeView(768, 1024),
    computeView(844, 390),
    computeView(844, 390, { top: 0, right: 47, bottom: 21, left: 47 }),
    computeView(820, 1180),
    computeView(768, 1280),
  ];
  for (const level of [6, 7] as const)
    it(`level ${level}: every strip, floor and gauge cell is a full-size square on screen clear of the cards`, () => {
      for (const view of views) {
        const l = meadowLayout(view, level);
        expect(l).not.toBeNull();
        if (!l) continue;
        expect(l.cards).toHaveLength(3);
        expect(targets(l).length).toBeGreaterThan(3);
        for (const seed of [1, 2, 3, 4])
          for (const t of factorTasks(level, new Rng(seed), seed % 2 === 0)) {
            const cells = t.kind === 'missing' ? [...t.grass, ...t.blanket] : [...t.floor, ...t.gauge];
            for (const c of cells) {
              const r = cellRect(l, c),
                p = centre(r);
              expect(r.w).toBeGreaterThanOrEqual(100);
              expect(cellAt(l, p.x, p.y)).toBe(c);
              expect(r.x + r.w).toBeLessThanOrEqual(view.w);
              expect(r.y + r.h).toBeLessThanOrEqual(view.h);
              for (const card of l.cards!) {
                const gap = Math.max(
                  card.x - (r.x + r.w),
                  r.x - (card.x + card.w),
                  card.y - (r.y + r.h),
                  r.y - (card.y + card.h),
                );
                expect(gap).toBeGreaterThanOrEqual(30);
              }
            }
          }
      }
    });
});
