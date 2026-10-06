import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import { compare, directions, makeFinds, name, PLANS } from './logic';

describe('Treasure Map', () => {
  it('names squares by column letter and row number, counting rows from the bottom', () => {
    expect(name({ col: 0, row: 0 })).toBe('A1');
    expect(name({ col: 1, row: 2 })).toBe('B3');
    expect(compare({ col: 1, row: 2 }, { col: 1, row: 0 })).toBe('column');
    expect(compare({ col: 3, row: 0 }, { col: 1, row: 0 })).toBe('row');
    expect(compare({ col: 1, row: 0 }, { col: 1, row: 0 })).toBe('right');
  });

  it('makes different squares on the map, and step directions that start on the map and turn', () => {
    for (const plan of PLANS) {
      for (let seed = 1; seed <= 300; seed++) {
        const finds = makeFinds(plan, new Rng(seed));
        expect(finds).toHaveLength(plan.finds);
        expect(new Set(finds.map((f) => name(f.square))).size).toBe(plan.finds);
        for (const f of finds) {
          for (const s of [f.square, f.from].filter(Boolean)) {
            expect(s!.col).toBeGreaterThanOrEqual(0);
            expect(s!.col).toBeLessThan(plan.size);
            expect(s!.row).toBeGreaterThanOrEqual(0);
            expect(s!.row).toBeLessThan(plan.size);
          }
          if (plan.mode === 'steps') {
            expect(f.from!.col + f.right!).toBe(f.square.col);
            expect(f.from!.row + f.up!).toBe(f.square.row);
            expect(f.right).not.toBe(0);
            expect(f.up).not.toBe(0);
            expect(directions(f)).toMatch(/^\d (right|left), then \d (up|down)$/);
          }
          if (plan.mode === 'place') expect(f.thing).toBeDefined();
        }
      }
    }
  });
});
