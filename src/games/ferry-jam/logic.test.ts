import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import { HARBORS } from './harbors';
import { atDock, FERRY, grid, hintSlide, makeHarbor, parse, PLANS, planFor, reach, render, slides, solve, start, wellFormed, type Harbor, type Layout } from './logic';

const harborsFor = (level: number) => HARBORS[level].map((rows) => parse(rows));

function apply(layout: Layout, s: { boat: number; to: number }): Layout {
  const next = layout.slice();
  next[s.boat] = s.to;
  return next;
}

describe('Ferry Jam', () => {
  it('reads a harbor drawn in letters and draws it back', () => {
    const rows = ['..aab.', '..c.b.', 'ffc.b.', '......', '......', '......'];
    const h = parse(rows);
    expect(h.size).toBe(6);
    expect(h.boats[FERRY]).toEqual({ row: 2, col: 0, len: 2, dir: 'h' });
    expect(h.boats).toHaveLength(4);
    expect(render(h)).toEqual(rows);
    expect(() => parse(['aa..', '....', '....', '....'])).toThrow(/ferry/);
    expect(() => parse(['f...', 'f...', '....', '....'])).toThrow(/ferry/);
    expect(() => parse(['ff...', '....', '....', '....'])).toThrow(/wide/);
  });

  it('knows how far a boat can slide, and that boats never pass through each other', () => {
    const h = parse(['b...', 'b..c', 'ff.c', 'aa..']);
    const layout = start(h);
    // The ferry is at column 0 in row 2; the open cell to its right is column 2, then a boat in column 3.
    expect(reach(h, layout, FERRY)).toEqual({ min: 0, max: 1 });
    // The boat standing in column 3 can go up one (row 0) or down one (row 3), nothing else.
    const c = h.boats.findIndex((b) => b.dir === 'v' && b.col === 3);
    expect(reach(h, layout, c)).toEqual({ min: 0, max: 2 });
    for (const s of slides(h, layout)) {
      const moved = apply(layout, s);
      expect(grid(h, moved).flat().includes(-2), 'two boats on one cell').toBe(false);
      expect(wellFormed(h)).toBe(true);
    }
  });

  it('finds the fewest slides, and each step of the way gets one closer', () => {
    const h = parse(['b...', 'b..c', 'ff.c', 'aa..']);
    const path = solve(h)!;
    expect(path.length).toBe(2);
    let layout = start(h);
    let left = path.length;
    while (!atDock(h, layout)) {
      const next = apply(layout, hintSlide(h, layout)!);
      left--;
      expect(solve(h, next)!.length).toBe(left);
      layout = next;
    }
    expect(left).toBe(0);
    expect(solve(h, layout)).toEqual([]);
  });

  it('says so when the search is capped before a way out is found', () => {
    const h = harborsFor(6)[0];
    const fewest = solve(h)!.length;
    expect(solve(h, start(h), fewest - 1)).toBeNull();
    expect(solve(h, start(h), fewest)).toHaveLength(fewest);
  });

  it('every frozen harbor is well formed, can be finished, and takes the planned number of slides', () => {
    expect(Object.keys(HARBORS).map(Number)).toEqual(PLANS.map((_, i) => i + 1));
    PLANS.forEach((plan, i) => {
      const level = i + 1;
      const all = HARBORS[level];
      expect(new Set(all.map((h) => h.join('/'))).size, plan.name).toBe(all.length);
      // Enough to vary the round, and to draw a different harbor on each replay.
      expect(all.length, plan.name).toBeGreaterThanOrEqual(plan.harbors * 6);
      for (const rows of all) {
        const h = parse(rows);
        expect(h.size, plan.name).toBe(plan.size);
        expect(wellFormed(h), rows.join('/')).toBe(true);
        expect(h.boats.length - 1, plan.name).toBeGreaterThanOrEqual(plan.boats.min);
        expect(h.boats.length - 1, plan.name).toBeLessThanOrEqual(plan.boats.max);
        const ferry = h.boats[FERRY];
        expect(atDock(h, start(h)), `${rows.join('/')} starts at the dock`).toBe(false);
        expect(ferry.len).toBe(2);
        const moves = solve(h)?.length;
        expect(moves, rows.join('/')).toBeGreaterThanOrEqual(plan.moves.min);
        expect(moves, rows.join('/')).toBeLessThanOrEqual(plan.moves.max);
      }
    });
  });

  it('climbs: later levels ask for more slides and bigger harbors', () => {
    PLANS.slice(1).forEach((p, i) => {
      expect(p.size, p.name).toBeGreaterThanOrEqual(PLANS[i].size);
      expect(p.moves.min, p.name).toBeGreaterThanOrEqual(PLANS[i].moves.min);
    });
    expect(planFor(0)).toBe(PLANS[0]);
    expect(planFor(99)).toBe(PLANS.at(-1));
  });

  it('a hint is quick even in the biggest, busiest harbor', () => {
    const t0 = performance.now();
    for (const h of harborsFor(6)) expect(hintSlide(h, start(h))).not.toBeNull();
    expect((performance.now() - t0) / HARBORS[6].length).toBeLessThan(1500);
  });

  it('can still make new harbors for the early levels from a seed, within the planned range', () => {
    for (const [i, plan] of PLANS.slice(0, 3).entries()) {
      let made = 0;
      for (let seed = 1; seed <= 40 && made < 4; seed++) {
        const h: Harbor | null = makeHarbor(plan, new Rng(seed * 101 + i));
        if (!h) continue;
        made++;
        expect(wellFormed(h)).toBe(true);
        const moves = solve(h)!.length;
        expect(moves).toBeGreaterThanOrEqual(plan.moves.min);
        expect(moves).toBeLessThanOrEqual(plan.moves.max);
      }
      expect(made, plan.name).toBe(4);
    }
  });
});
