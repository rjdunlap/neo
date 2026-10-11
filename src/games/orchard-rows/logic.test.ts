import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import { computeView } from '../../engine/view';
import { choicesFor, countGroup, makeOrchards, missingTrees, orchardLayout, PLANS, subtotals, total, turn } from './logic';

describe('Orchard Rows', () => {
  it('draws two distinct valid arrays deterministically, with variety across seeds', () => {
    for (let level = 1; level <= 3; level++) for (let seed = 1; seed <= 100; seed++) {
      const boards = makeOrchards(level, new Rng(seed));
      expect(boards).toEqual(makeOrchards(level, new Rng(seed)));
      expect(boards).toHaveLength(2);
      expect(new Set(boards.map(o => `${o.rows}x${o.columns}`)).size).toBe(2);
      for (const o of boards) {
        expect(o.rows).toBeGreaterThanOrEqual(2);
        expect(o.columns).toBeGreaterThanOrEqual(2);
        expect(Math.max(o.rows, o.columns)).toBeLessThanOrEqual(5);
        expect(PLANS[level - 1].shapes).toContainEqual(o);
      }
    }
    expect(makeOrchards(3, new Rng(1))).not.toEqual(makeOrchards(3, new Rng(2)));
  });
  it('regroups exactly the same quantity, and every subtotal adds one full group', () => {
    for (const plan of PLANS) for (const o of plan.shapes) {
      expect(total(turn(o))).toBe(total(o));
      expect(turn(turn(o))).toEqual(o);
      expect(subtotals(o).at(-1)).toBe(total(o));
      expect(subtotals(turn(o)).at(-1)).toBe(total(o));
      expect(subtotals(o).map((n, i, a) => n - (a[i - 1] ?? 0))).toEqual(Array(o.rows).fill(o.columns));
      expect(missingTrees(o)).toBe(o.columns);
      expect((o.rows - 1) * o.columns + missingTrees(o)).toBe(total(o));
    }
  });
  it('offers exactly one answer and valid, distinct decoys, including row/column confusion', () => {
    for (const plan of PLANS) for (const o of plan.shapes) for (let seed = 1; seed <= 30; seed++) {
      for (const answer of [total(o), missingTrees(o)]) {
        const pads = choicesFor(answer, new Rng(seed), answer === missingTrees(o) ? o.rows : undefined);
        expect(pads).toHaveLength(3);
        expect(new Set(pads).size).toBe(3);
        expect(pads.filter(n => n === answer)).toHaveLength(1);
        expect(pads.every(n => Number.isInteger(n) && n > 0)).toBe(true);
      }
      if (o.rows !== o.columns) expect(choicesFor(missingTrees(o), new Rng(seed), o.rows)).toContain(o.rows);
    }
  });
  it('allows any counting order, replay without double counting, and guards invalid rows', () => {
    const o = { rows: 3, columns: 4 };
    const counted = [2];
    expect(countGroup(counted, 2, o)).toEqual([2]);
    expect(countGroup(counted, -1, o)).toEqual([2]);
    expect(countGroup(counted, 3, o)).toEqual([2]);
    expect(countGroup(countGroup(counted, 0, o), 1, o)).toEqual([2, 0, 1]);
    expect(counted).toEqual([2]);
  });
  it('keeps row controls unscaled, at least 100 units, within four views and clear of the guide and choices', () => {
    for (const [w, h] of [[1024, 768], [768, 1024], [844, 390], [750, 369]]) {
      const v = computeView(w, h);
      for (const plan of PLANS) for (const shape of plan.shapes) for (const o of [shape, turn(shape)]) {
        const l = orchardLayout(v.w, v.h, o);
        expect(l.width).toBeGreaterThanOrEqual(100);
        expect(l.rowHeight).toBe(100);
        expect(l.x - l.width / 2).toBeGreaterThanOrEqual(170);
        expect(l.x + l.width / 2).toBeLessThan(v.w - 195);
        expect(l.y).toBeGreaterThanOrEqual(210);
        expect(l.y + o.rows * l.rowHeight).toBeLessThanOrEqual(v.h - 40);
      }
    }
  });
});
