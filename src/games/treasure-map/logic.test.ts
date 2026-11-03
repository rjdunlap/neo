import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import { CELL, cellCenter, clueDirection, clueEnd, COLUMN_COLORS, compare, digSpot, directions, DOODLES, dressingFor, firstDirection, firstLeg, headersFor, makeFinds, name, PLANS, ROW_PICTURES, squareAt, TINTS } from './logic';

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
          if (plan.mode === 'clues') {
            expect(f.clues).toHaveLength(2);
            const [horizontal, vertical] = f.clues!;
            expect(horizontal.axis).toBe('horizontal');
            expect(vertical.axis).toBe('vertical');
            expect(clueEnd(horizontal)).toEqual(f.square);
            expect(clueEnd(vertical)).toEqual(f.square);
            expect(clueDirection(horizontal)).toMatch(/^\d (right|left)$/);
            expect(clueDirection(vertical)).toMatch(/^\d (up|down)$/);
            const occupied = [...finds.map((other) => other.square), ...finds.flatMap((other) => other.clues?.map((clue) => clue.landmark) ?? [])];
            expect(new Set(occupied.map(name)).size).toBe(occupied.length);
            for (const clue of f.clues!) {
              expect(clue.landmark.col).toBeGreaterThanOrEqual(0);
              expect(clue.landmark.col).toBeLessThan(plan.size);
              expect(clue.landmark.row).toBeGreaterThanOrEqual(0);
              expect(clue.landmark.row).toBeLessThan(plan.size);
            }
          }
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

  it('draws fresh picture headers: distinct, every picture and colour in turn, and the asked-for picture and colour on the map', () => {
    const plan = PLANS.find((p) => p.mode === 'pictures')!;
    const seenRows = new Set<string>();
    const seenCols = new Set<string>();
    const firstRows = new Set<string>();
    for (let seed = 1; seed <= 300; seed++) {
      const rng = new Rng(seed);
      const finds = makeFinds(plan, rng);
      const { cols, rows } = headersFor(plan, rng);
      expect(cols).toHaveLength(plan.size);
      expect(rows).toHaveLength(plan.size);
      expect(new Set(cols).size).toBe(plan.size);
      expect(new Set(rows).size).toBe(plan.size);
      for (const c of cols) expect(COLUMN_COLORS).toContain(c);
      for (const r of rows) expect(ROW_PICTURES).toContain(r);
      // Every find names a picture and a colour that head its own row and column.
      for (const f of finds) {
        expect(rows[f.square.row]).toBeDefined();
        expect(cols[f.square.col]).toBeDefined();
      }
      cols.forEach((c) => seenCols.add(c));
      rows.forEach((r) => seenRows.add(r));
      firstRows.add(rows.join());
    }
    expect(seenRows.size).toBe(ROW_PICTURES.length);
    expect(seenCols.size).toBe(COLUMN_COLORS.length);
    expect(firstRows.size).toBeGreaterThan(50);
  });

  it('keeps the finds the same whatever the headers and dressing draw, and letters maps in plain order', () => {
    for (const plan of PLANS) {
      for (let seed = 1; seed <= 50; seed++) {
        const plain = makeFinds(plan, new Rng(seed));
        const rng = new Rng(seed);
        const dressed = makeFinds(plan, rng);
        headersFor(plan, rng);
        dressingFor(rng);
        expect(dressed).toEqual(plain);
      }
      if (plan.mode !== 'pictures') expect(headersFor(plan, new Rng(1)).rows).toEqual(ROW_PICTURES.slice(0, plan.size));
    }
  });

  it('dresses each map with one of three tints and a known doodle, every one in turn', () => {
    const tints = new Set<number>();
    const doodles = new Set<string>();
    for (let seed = 1; seed <= 100; seed++) {
      const d = dressingFor(new Rng(seed));
      expect(d.tint).toBeGreaterThanOrEqual(0);
      expect(d.tint).toBeLessThan(TINTS);
      tints.add(d.tint);
      doodles.add(d.doodle);
    }
    expect(tints.size).toBe(TINTS);
    expect(doodles.size).toBe(DOODLES.length);
  });

  it("lights the steps hint along the first leg only: on the map, from beside the pet to the turning square, never the answer", () => {
    const plan = PLANS.find((p) => p.mode === 'steps')!;
    for (let seed = 1; seed <= 300; seed++) {
      for (const f of makeFinds(plan, new Rng(seed))) {
        const leg = firstLeg(f);
        expect(leg).toHaveLength(Math.abs(f.right!));
        leg.forEach((sq, i) => {
          expect(sq.col).toBeGreaterThanOrEqual(0);
          expect(sq.col).toBeLessThan(plan.size);
          expect(sq.row).toBe(f.from!.row);
          // One square at a time, each a step further from the pet.
          expect(Math.abs(sq.col - f.from!.col)).toBe(i + 1);
        });
        // It ends at the turn: the target's column on the pet's row, which is not the target (every walk turns).
        expect(leg[leg.length - 1]).toEqual({ col: f.square.col, row: f.from!.row });
        expect(leg.some((sq) => name(sq) === name(f.square))).toBe(false);
        expect(directions(f).startsWith(firstDirection(f))).toBe(true);
      }
    }
  });
});
