import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import { HARBORS } from './harbors';
import { landing } from '../../progress/difficulty';
import { ferryJam } from './index';
import {
  after,
  atDock,
  blockers,
  boatToward,
  clearsInOne,
  distance,
  distanceTable,
  docked,
  FERRY,
  ferries,
  firstToSail,
  focusPath,
  grid,
  hintSlide,
  makeHarbor,
  parse,
  patience,
  PLANS,
  planFor,
  reach,
  render,
  ROCK,
  rocksMatter,
  sailed,
  settle,
  slides,
  solve,
  solved,
  start,
  stuck,
  wellFormed,
  YELLOW,
  type Harbor,
  type Layout,
} from './logic';

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
        expect(h.boats.length - ferries(h).length, plan.name).toBeGreaterThanOrEqual(plan.boats.min);
        expect(h.boats.length - ferries(h).length, plan.name).toBeLessThanOrEqual(plan.boats.max);
        expect(ferries(h), plan.name).toHaveLength(plan.ferries ?? 1);
        const ferry = h.boats[FERRY];
        expect(docked(h, start(h)), `${rows.join('/')} starts at the dock`).toBeNull();
        expect(ferry.len).toBe(2);
        const moves = solve(h)?.length;
        expect(moves, rows.join('/')).toBeGreaterThanOrEqual(plan.moves.min);
        expect(moves, rows.join('/')).toBeLessThanOrEqual(plan.moves.max);
      }
    });
  });

  it("fills each plan: every pool has a harbor at its plan's most slides, and at least a third above its fewest", () => {
    PLANS.forEach((plan, i) => {
      const moves = harborsFor(i + 1).map((h) => solve(h)!.length);
      expect(moves, plan.name).toContain(plan.moves.max);
      // A plan with one number of slides (level 9) has nothing above its fewest to fill.
      if (plan.moves.max > plan.moves.min)
        expect(moves.filter((m) => m > plan.moves.min).length * 3, plan.name).toBeGreaterThanOrEqual(
          moves.length,
        );
    });
  });

  it('knows how far every layout is from the dock, the same as the solver', () => {
    for (const level of [1, 3, 5, 7])
      for (const h of harborsFor(level).slice(0, 4)) {
        const table = distanceTable(h);
        expect(distance(h, start(h))).toBe(solve(h)!.length);
        // Each slide changes the distance by at most one, and the hint's slide brings it exactly one closer.
        let layout = start(h);
        while (!atDock(h, layout)) {
          for (const s of slides(h, layout))
            expect(Math.abs(distance(h, apply(layout, s)) - distance(h, layout))).toBeLessThanOrEqual(1);
          const next = apply(layout, hintSlide(h, layout)!);
          expect(distance(h, next)).toBe(distance(h, layout) - 1);
          layout = next;
        }
        expect(distance(h, layout)).toBe(0);
        expect(table.size).toBeGreaterThan(0);
      }
  });

  it('builds the distance table quickly even for the biggest harbors', () => {
    let worst = 0;
    let most = 0;
    for (const h of [...harborsFor(5), ...harborsFor(6)]) {
      const t0 = performance.now();
      most = Math.max(most, distanceTable(h).size);
      worst = Math.max(worst, performance.now() - t0);
    }
    // The cost is the number of layouts the table visits: the largest harbor has 42,009. Guard that count exactly;
    // a harbor that would blow it up fails here on any machine.
    expect(most).toBeLessThanOrEqual(50_000);
    // Wall-clock is only a backstop for a much slower build per layout: about 300 ms alone on a 4-core box, and
    // CI runs ~300 test files at once (it hit 570–595 ms there and failed the old 500 ms limit, 2026-11-03/04).
    expect(worst).toBeLessThan(3000);
  });

  describe('the hint waits for her to be stuck, not for a number of slides', () => {
    const h = harborsFor(6)[0];
    const fewest = solve(h)!.length;
    /** A slide of a boat other than the ferry that does not bring the boats closer, and the slide back. */
    function wander(layout: Layout) {
      const s = slides(h, layout).find(
        (s) => s.boat !== FERRY && distance(h, apply(layout, s)) >= distance(h, layout),
      )!;
      return [s, { boat: s.boat, to: layout[s.boat] }];
    }

    it("waits at least six slides, and at least the harbor's fewest", () => {
      expect(patience(2)).toBe(6);
      expect(patience(13)).toBe(13);
      expect(stuck([], 13)).toBe(false);
      expect(stuck([3, 3, 3, 3, 3, 3], 2)).toBe(false);
      expect(stuck([3, 3, 3, 3, 3, 3, 3], 2)).toBe(true);
    });

    it('a loop of slides back and forth earns a hint exactly when patience runs out', () => {
      let layout = start(h);
      const trail = [distance(h, layout)];
      const [there, back] = wander(layout);
      let slid = 0;
      while (!stuck(trail, fewest)) {
        layout = apply(layout, slid % 2 ? back : there);
        trail.push(distance(h, layout));
        slid++;
        expect(slid).toBeLessThanOrEqual(patience(fewest));
      }
      expect(slid).toBe(patience(fewest));
    });

    it('a longer route that keeps getting closer never earns one', () => {
      let layout = start(h);
      const trail = [distance(h, layout)];
      let slid = 0;
      while (!atDock(h, layout)) {
        // Every third slide wanders off and back before the next good one.
        if (slid % 3 === 2)
          for (const s of wander(layout)) {
            layout = apply(layout, s);
            trail.push(distance(h, layout));
            expect(stuck(trail, fewest)).toBe(false);
          }
        layout = apply(layout, hintSlide(h, layout)!);
        trail.push(distance(h, layout));
        expect(stuck(trail, fewest)).toBe(false);
        slid++;
      }
      expect(trail.length - 1).toBeGreaterThan(fewest);
    });

    it('after a hint, the count starts again from where the boats are', () => {
      let layout = start(h);
      let trail = [distance(h, layout)];
      const [there, back] = wander(layout);
      let hints = 0;
      for (let slid = 0; slid < patience(fewest) * 2 + 1; slid++) {
        layout = apply(layout, slid % 2 ? back : there);
        trail.push(distance(h, layout));
        if (stuck(trail, fewest)) {
          hints++;
          trail = [distance(h, layout)];
        }
      }
      expect(hints).toBe(2);
    });
  });

  it('climbs: later levels ask for more slides and bigger harbors (levels 7 and 8 start new kinds of harbor, with rocks and two ferries; 9 and 10 are easy entries)', () => {
    const plain = PLANS.filter((p) => !p.rocks && !p.ferries && !p.entry);
    expect(plain).toHaveLength(6);
    plain.slice(1).forEach((p, i) => {
      expect(p.size, p.name).toBeGreaterThanOrEqual(plain[i].size);
      expect(p.moves.min, p.name).toBeGreaterThanOrEqual(plain[i].moves.min);
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

  describe('rocks in the harbor (level 7)', () => {
    it('reads an x as a rock, not a boat, and draws it back', () => {
      const rows = ['.....', '....x', '.ffac', '.d.ac', '.dbbb'];
      const h = parse(rows);
      expect(h.rocks).toEqual([{ row: 1, col: 4 }]);
      expect(h.boats).toHaveLength(5);
      expect(render(h)).toEqual(rows);
      expect(grid(h, start(h))[1][4]).toBe(ROCK);
      // A harbor without an x has no rocks at all, so the older levels are drawn exactly as before.
      expect(parse(['b...', 'b..c', 'ff.c', 'aa..']).rocks).toBeUndefined();
    });

    it('a boat stops at a rock as it does at another boat', () => {
      const h = parse(['.....', '...x.', 'ff...', '.....', '.....']);
      expect(reach(h, start(h), FERRY)).toEqual({ min: 0, max: 3 });
      const across = parse(['.....', 'aa.x.', 'ff...', '.....', '.....']);
      expect(reach(across, start(across), 1)).toEqual({ min: 0, max: 1 });
      const up = parse(['.....', '...x.', 'ff...', '...a.', '...a.']);
      expect(reach(up, start(up), 1)).toEqual({ min: 2, max: 3 });
    });

    it('rocks never slide: every slide moves a boat, and no boat ever covers a rock', () => {
      for (const h of harborsFor(7)) {
        let layout = start(h);
        while (!atDock(h, layout)) {
          for (const s of slides(h, layout)) {
            expect(s.boat).toBeLessThan(h.boats.length);
            const g = grid(h, apply(layout, s));
            expect(g.flat().includes(-2), render(h).join('/')).toBe(false);
            for (const r of h.rocks!) expect(g[r.row][r.col]).toBe(ROCK);
          }
          layout = apply(layout, hintSlide(h, layout)!);
        }
      }
    });

    it("every level-7 harbor has its rock beside the ferry's row, and every rock matters", () => {
      for (const h of harborsFor(7)) {
        const name = render(h).join('/');
        expect(h.rocks, name).toHaveLength(1);
        for (const r of h.rocks!) expect(Math.abs(r.row - h.boats[FERRY].row), name).toBe(1);
        expect(rocksMatter(h), name).toBe(true);
        // Taking the rock away lets the ferry out in fewer slides.
        expect(solve({ ...h, rocks: [] })!.length, name).toBeLessThan(solve(h)!.length);
      }
    });

    it('knows a rock that changes nothing is only scenery', () => {
      const h = parse(['....x', '.....', 'ffa..', '..a..', '.....']);
      expect(rocksMatter(h)).toBe(false);
    });

    it('the couch highlight still reaches every boat (rocks are never boats to land on)', () => {
      for (const h of harborsFor(7))
        for (let to = 0; to < h.boats.length; to++)
          expect(focusPath(h, start(h), FERRY, to), render(h).join('/')).not.toBeNull();
    });
  });

  describe('two ferries (level 8)', () => {
    const at = (h: Harbor, layout: Layout) => render(h, layout).join('/');

    it('reads a y as the upright yellow ferry, always the second boat, and draws it back', () => {
      const rows = ['aaa..', 'ffdyb', '..dyb', '..d..', '...cc'];
      const h = parse(rows);
      expect(h.yellow).toBe(true);
      expect(h.boats[YELLOW]).toEqual({ row: 1, col: 3, len: 2, dir: 'v' });
      expect(ferries(h)).toEqual([FERRY, YELLOW]);
      expect(render(h)).toEqual(rows);
      expect(() => parse(['.....', 'ffyy.', '.....', '.....', '.....'])).toThrow(/yellow/);
      // No older harbor has a y in it: every one still has exactly one ferry, drawn as before.
      for (const level of [1, 2, 3, 4, 5, 6, 7])
        for (const rows of HARBORS[level]) {
          const old = parse(rows);
          expect(old.yellow, rows.join('/')).toBeUndefined();
          expect(render(old)).toEqual(rows);
        }
    });

    it('a ferry that reaches its dock sails out at once, freeing its cells; one harbor-ferry is never moved on', () => {
      const h = parse(['.....', '...y.', 'ff.y.', '.....', '.....']);
      // The red ferry stops at the yellow one.
      expect(reach(h, start(h), FERRY)).toEqual({ min: 0, max: 1 });
      // The yellow ferry slides down to its dock and sails: it sits at `size` and fills no cell.
      const gone = after(h, start(h), { boat: YELLOW, to: 3 });
      expect(gone[YELLOW]).toBe(h.size);
      expect(sailed(h, gone, YELLOW)).toBe(true);
      expect(grid(h, gone).flat().includes(YELLOW)).toBe(false);
      expect(reach(h, gone, YELLOW)).toEqual({ min: 5, max: 5 });
      expect(slides(h, gone).some((s) => s.boat === YELLOW)).toBe(false);
      // Now the red ferry has a clear way, and the harbor is finished only when it has gone too.
      expect(solved(h, gone)).toBe(false);
      expect(reach(h, gone, FERRY)).toEqual({ min: 0, max: 3 });
      expect(solved(h, after(h, gone, { boat: FERRY, to: 3 }))).toBe(true);
      expect(solve(h)).toHaveLength(2);
      // A harbor with one ferry is never settled: its ferry at the dock is still there, as in levels 1–7.
      const one = parse(['b...', 'b..c', 'ff.c', 'aa..']);
      const docked1 = apply(start(one), { boat: FERRY, to: 2 });
      expect(settle(one, docked1)).toBe(docked1);
    });

    it("every level-8 harbor starts with the ferries in each other's way, and in at least half the first to sail frees the other", () => {
      const all = harborsFor(8);
      const firsts = all.map((h) => firstToSail(h)!);
      for (const [k, h] of all.entries()) {
        const red = h.boats[FERRY],
          yellow = h.boats[YELLOW];
        const crossing =
          (yellow.col >= red.col + 2 && yellow.row <= red.row && yellow.row + 1 >= red.row) ||
          ((yellow.col === red.col || yellow.col === red.col + 1) && yellow.row + 1 < red.row);
        expect(crossing, at(h, start(h))).toBe(true);
        expect(firsts[k], at(h, start(h))).not.toBeNull();
      }
      expect(firsts.filter((f) => f.frees).length * 2).toBeGreaterThanOrEqual(all.length);
      // Both orders turn up: sometimes the yellow ferry has to go first, sometimes the red one.
      expect(firsts.some((f) => f.ferry === YELLOW)).toBe(true);
      expect(firsts.some((f) => f.ferry === FERRY)).toBe(true);
    });

    it('the distance table follows the sailing: every hint brings both ferries one slide closer, and nothing is ever stranded', () => {
      for (const h of harborsFor(8)) {
        const table = distanceTable(h);
        expect(distance(h, start(h))).toBe(solve(h)!.length);
        // A ferry that sails cannot come back, but every layout she can reach still has a way to finish.
        for (const d of table.values()) expect(Number.isFinite(d)).toBe(true);
        let layout = start(h);
        while (!solved(h, layout)) {
          for (const s of slides(h, layout))
            expect(distance(h, after(h, layout, s)), at(h, layout)).toBeGreaterThanOrEqual(
              distance(h, layout) - 1,
            );
          const next = after(h, layout, hintSlide(h, layout)!);
          expect(distance(h, next)).toBe(distance(h, layout) - 1);
          layout = next;
        }
        expect(distance(h, layout)).toBe(0);
      }
    });

    it('every layout she can reach can still be finished (a sailed ferry never strands the other)', () => {
      for (const h of harborsFor(8)) {
        const seen = new Set<string>([start(h).join()]);
        const queue = [start(h)];
        for (let i = 0; i < queue.length; i++) {
          expect(distance(h, queue[i]), at(h, queue[i])).toBeLessThan(Infinity);
          for (const s of slides(h, queue[i])) {
            const next = after(h, queue[i], s);
            if (seen.has(next.join())) continue;
            seen.add(next.join());
            queue.push(next);
          }
        }
      }
    });

    it('makes new two-ferry harbors from a seed, within the plan and with the first ferry freeing the other', () => {
      let made = 0;
      for (let seed = 1; seed < 40 && made < 3; seed++) {
        const h = makeHarbor(PLANS[7], new Rng(seed));
        if (!h) continue;
        made++;
        expect(h.yellow).toBe(true);
        expect(wellFormed(h)).toBe(true);
        expect(firstToSail(h)!.frees).toBe(true);
        const n = solve(h)!.length;
        expect(n).toBeGreaterThanOrEqual(PLANS[7].moves.min);
        expect(n).toBeLessThanOrEqual(PLANS[7].moves.max);
      }
      expect(made).toBe(3);
    });

    it('the keyboard highlight skips a ferry that has sailed, and still reaches every boat left', () => {
      for (const h of harborsFor(8)) {
        const first = firstToSail(h)!.ferry;
        let layout = start(h);
        while (!sailed(h, layout, first)) layout = after(h, layout, hintSlide(h, layout)!);
        const other = first === FERRY ? YELLOW : FERRY;
        for (let to = 0; to < h.boats.length; to++) {
          if (to === first) continue;
          expect(focusPath(h, layout, other, to), at(h, layout)).not.toBeNull();
        }
        for (let from = 0; from < h.boats.length; from++)
          if (from !== first)
            for (const dir of [0, 1, 2, 3]) expect(boatToward(h, layout, from, dir)).not.toBe(first);
      }
    });
  });

  describe("pre-K entries: one boat in the way (9) and who's in the way (10)", () => {
    it("finds the boats in the ferry's way: only those with a cell in its row ahead of it", () => {
      const h = parse(['..a.', 'ffa.', '..bb', '....']);
      expect(blockers(h)).toEqual([1]);
      expect(blockers(h, [2, 0, 2])).toEqual([]);
      // A boat behind the ferry, or the ferry itself, is not in its way.
      expect(blockers(parse(['a...', 'aff.', '....', '....']))).toEqual([]);
    });

    it("level 9: every harbor has exactly one boat in the ferry's way, and one slide of it lets the ferry out", () => {
      // `solve` counts the ferry's own slide to the dock too, so "one boat slide" is 2 here.
      for (const h of harborsFor(9)) {
        const at = render(h).join('/');
        expect(blockers(h), at).toHaveLength(1);
        expect(h.boats.length - 1, at).toBe(2);
        expect(clearsInOne(h, blockers(h)[0]), at).toBe(true);
        const path = solve(h)!;
        expect(path, at).toHaveLength(2);
        expect(path[0].boat, at).toBe(blockers(h)[0]);
      }
    });

    it("level 10: every harbor has exactly one boat in the way, which cannot leave the ferry's row in one slide", () => {
      for (const h of harborsFor(10)) {
        const at = render(h).join('/');
        expect(blockers(h), at).toHaveLength(1);
        expect(clearsInOne(h, blockers(h)[0]), at).toBe(false);
        // Two or three boat slides, then the ferry's own.
        expect(solve(h)!.length, at).toBeGreaterThanOrEqual(3);
        expect(solve(h)!.length, at).toBeLessThanOrEqual(4);
      }
    });

    it('pre-K plays 9, 1, 10, 2, 3, 4 and lists each level once; 9 and 10 are entries that land a school child on 3', () => {
      const prek = ferryJam.levels('prek');
      expect(prek.order).toEqual([9, 1, 10, 2, 3, 4]);
      expect(new Set(prek.order).size).toBe(prek.order!.length);
      expect(ferryJam.entryLevels).toEqual([9, 10]);
      expect(ferryJam.levels('school').order).toBeUndefined();
      for (const level of [9, 10]) {
        expect(landing(level, ferryJam.levels('school'), ferryJam.entryLevels)).toBe(3);
        expect(landing(level, prek, ferryJam.entryLevels)).toBe(level);
      }
      expect(planFor(9).entry).toBe(true);
      expect(planFor(10).ask).toBe(true);
      expect(ferryJam.describeLevel(10)).toMatch(/in the way/);
    });
  });
});
