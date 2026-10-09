import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import { CELL, cellCenter, compare, digSpot, directions, makeFinds, name, PLANS, squareAt } from './logic';

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

  it('reads a point on the map back to its square, and a point off the map to nothing', () => {
    for (const size of [4, 5]) {
      for (let col = 0; col < size; col++) {
        for (let row = 0; row < size; row++) {
          const mid = cellCenter({ col, row }, size);
          expect(squareAt(mid.x, mid.y, size)).toEqual({ col, row });
          // Anywhere inside the square is the same square, corners included.
          expect(squareAt(mid.x - CELL / 2 + 1, mid.y + CELL / 2 - 1, size)).toEqual({ col, row });
        }
      }
      expect(squareAt(-1, 10, size)).toBeNull();
      expect(squareAt(10, -1, size)).toBeNull();
      expect(squareAt(size * CELL, 10, size)).toBeNull();
      expect(squareAt(10, size * CELL, size)).toBeNull();
    }
    // Row 1 is the bottom of the map, as on a graph.
    expect(cellCenter({ col: 0, row: 0 }, 4).y).toBeGreaterThan(cellCenter({ col: 0, row: 3 }, 4).y);
  });

  it("digs for every find in the middle of its own square, so the demonstration's finger is always right", () => {
    for (const plan of PLANS) {
      for (let seed = 1; seed <= 300; seed++) {
        for (const f of makeFinds(plan, new Rng(seed))) {
          const spot = digSpot(f, plan.size);
          const hit = squareAt(spot.x, spot.y, plan.size);
          expect(hit).toEqual(f.square);
          expect(compare(hit!, f.square)).toBe('right');
        }
      }
    }
  });
});
