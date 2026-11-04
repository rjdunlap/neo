import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import { COURSES } from './course';
import {
  bycounting, byreasoning, canAdd, closesOff, connected, edgeAt, edgeToward, headStart, forcedPlank, hintFor, isSolved, islandToward, LEVEL_ORDER, layoutOf, makePuzzle, makePuzzles, otherEnd, parsePuzzle, picture, planFor, PLANS, planksAt, roomOf, solve, hintWalk,
  trouble, waterOf, type Island, type Layout,
} from './logic';

const layoutFrom = (size: number, rows: readonly string[]): Layout => {
  const islands: Island[] = [];
  rows.forEach((row, r) => [...row].forEach((ch, c) => { if (ch !== '.') islands.push({ r, c, n: Number(ch) }); }));
  return layoutOf(size, islands);
};

describe('the layout', () => {
  it('joins islands that face each other along a row or column, and not ones side by side or with another between', () => {
    const l = layoutFrom(5, ['1.2.1', '.....', '2....', '.....', '.....']);
    expect(l.edges).toHaveLength(3);
    expect(l.edges.filter((e) => e.dir === 'h')).toHaveLength(2);
    expect(l.edges.filter((e) => e.dir === 'v')).toHaveLength(1);
    // Beside each other: no room for a bridge. And a third island in the way hides the far one.
    expect(layoutFrom(3, ['12.', '...', '...']).edges).toHaveLength(0);
    const hidden = layoutFrom(7, ['1.2.3..']);
    expect(hidden.edges.map((e) => [e.a, e.b])).toEqual([[0, 1], [1, 2]]);
  });

  it('knows which bridges would cross', () => {
    // A plus: a bridge across and a bridge down meet in the middle.
    const l = layoutFrom(5, ['..1..', '.....', '1...1', '.....', '..1..']);
    expect(l.edges).toHaveLength(2);
    expect(l.crossing[0]).toEqual([1]);
    expect(l.crossing[1]).toEqual([0]);
    // Bridges that only share an end island do not cross.
    const corner = layoutFrom(5, ['1...1', '.....', '1....']);
    expect(corner.crossing.every((c) => c.length === 0)).toBe(true);
  });
});

describe('placing planks', () => {
  const l = layoutFrom(5, ['..1..', '.....', '2...2', '.....', '..2..']);
  it('allows a plank only where there are fewer than two, nothing crosses, and both ends have room', () => {
    expect(l.edges).toHaveLength(2);
    expect(canAdd(l, [0, 0], 0)).toBe(true);
    expect(canAdd(l, [2, 0], 0)).toBe(false);
    // Each island here needs 2, 2 (across) and 1 and 2 (down): a plank down is blocked once one lies across.
    expect(canAdd(l, [1, 0], 1)).toBe(false);
    expect(canAdd(l, [0, 1], 0)).toBe(false);
  });

  it('counts planks at an island, and says when the islands are all one group', () => {
    const chain = layoutFrom(5, ['1.2.1']);
    expect(planksAt(chain, [1, 1], 1)).toBe(2);
    expect(connected(chain, [1, 1])).toBe(true);
    expect(connected(chain, [1, 0])).toBe(false);
    expect(isSolved(chain, [1, 1])).toBe(true);
    expect(isSolved(chain, [1, 0])).toBe(false);
    expect(otherEnd(chain, 0, 0)).toBe(1);
    expect(otherEnd(chain, 0, 1)).toBe(0);
  });

  it('names an island that has too many planks, or can no longer get enough', () => {
    const chain = layoutFrom(5, ['1.2.1']);
    expect(trouble(chain, [0, 0])).toEqual([]);
    // The left island has two planks for a 1; the right one has none and its only bridge leads to an island that is already full.
    expect(trouble(chain, [2, 0])).toEqual([0, 2]);
    // The right-hand island needs 1 but its only bridge is crossed by a plank elsewhere.
    const plus = layoutFrom(5, ['..2..', '.....', '2...2', '.....', '..2..']);
    expect(trouble(plus, [0, 0])).toEqual([]);
    expect(trouble(plus, [2, 0]).length).toBeGreaterThan(0);
  });
});

describe('solving', () => {
  it('finds the one way through a chain and through a loop, and needs the islands joined', () => {
    expect(solve(layoutFrom(5, ['1.2.1'])).found).toEqual([[1, 1]]);
    const loop = layoutFrom(5, ['2...2', '.....', '.....', '.....', '2...2']);
    expect(solve(loop).found).toEqual([[1, 1, 1, 1]]);
    // Two pairs each with a double bridge would add up, but are two groups, not one: so there is no solution.
    expect(solve(layoutFrom(5, ['2.2..', '.....', '.....', '.....', '.2.2.'])).found).toHaveLength(0);
  });

  it('agrees with a brute-force count on many random small layouts, ambiguous ones included', () => {
    const rng = new Rng(12);
    let withSolutions = 0;
    for (let t = 0; t < 4000; t++) {
      const cells = rng.shuffle(Array.from({ length: 25 }, (_, i) => i)).slice(0, rng.int(3, 7));
      const l = layoutOf(5, cells.map((c) => ({ r: Math.floor(c / 5), c: c % 5, n: rng.int(1, 3) })));
      if (l.edges.length > 9 || l.edges.length < 2) continue;
      let truth = 0;
      const total = 3 ** l.edges.length;
      for (let code = 0; code < total; code++) {
        const planks = l.edges.map((_, k) => Math.floor(code / 3 ** k) % 3);
        if (isSolved(l, planks)) truth++;
      }
      const got = solve(l, undefined, 100).found.length;
      expect(got, `layout ${t}`).toBe(truth);
      if (truth) withSolutions++;
    }
    expect(withSolutions).toBeGreaterThan(10);
  });

  it('counts both ways when a puzzle is ambiguous, so a puzzle with two is never kept', () => {
    // A square of four islands that each need 3: the long sides can carry two planks and the short ones one, or the other way round.
    const square = layoutFrom(5, ['3...3', '.....', '.....', '.....', '3...3']);
    const both = solve(square, undefined, 10).found;
    expect(both).toHaveLength(2);
    expect(both.map((w) => w.join(',')).sort()).toEqual(['1,2,2,1', '2,1,1,2']);
    expect(() => parsePuzzle(['3...3', '.....', '.....', '.....', '3...3'])).toThrow('exactly one');
  });

  it('can finish a puzzle from some planks already fixed, and finds none if they cannot be right', () => {
    const l = layoutFrom(5, ['2...2', '.....', '.....', '.....', '2...2']);
    expect(solve(l, [1, -1, -1, -1]).found).toEqual([[1, 1, 1, 1]]);
    expect(solve(l, [2, -1, -1, -1]).found).toHaveLength(0);
  });

  it('reads a puzzle from its picture, and refuses one without exactly one solution', () => {
    const p = parsePuzzle(['1.2.1', '.....', '.....', '.....', '.....']);
    expect(p.par).toBe(2);
    expect(p.solution).toEqual([1, 1]);
    expect(() => parsePuzzle(['2.2..', '.....', '.....', '.....', '.2.2.'])).toThrow('exactly one');
    expect(() => parsePuzzle(['1.1', '..'])).toThrow();
  });
});

describe('making puzzles', () => {
  it('makes every level with exactly one solution, numbers one to eight, the islands the plan asks for and a solved solution', () => {
    PLANS.forEach((plan, i) => {
      expect(planFor(i + 1)).toBe(plan);
      for (let s = 1; s <= 8; s++) {
        const p = makePuzzle(plan, new Rng(s * 977 + i));
        const label = `${plan.name} seed ${s}`;
        expect(p.size, label).toBe(plan.size);
        expect(p.layout.islands.length, label).toBeGreaterThanOrEqual(plan.islands.min);
        expect(p.layout.islands.length, label).toBeLessThanOrEqual(plan.islands.max);
        expect(p.layout.islands.every((il) => il.n >= 1 && il.n <= 8), label).toBe(true);
        expect(isSolved(p.layout, p.solution), label).toBe(true);
        expect(solve(p.layout, undefined, 3).found, label).toEqual([p.solution]);
        expect(p.par, label).toBe(p.solution.reduce((n, x) => n + x, 0));
        if (plan.counting) expect(bycounting(p.layout), label).toBe(true);
        // The picture reads back to the same puzzle.
        expect(parsePuzzle(picture(p.size, p.layout.islands)).solution, label).toEqual(p.solution);
      }
    });
  });

  it('is fair: the same seed gives the same puzzle, and the levels climb', () => {
    expect(makePuzzles(PLANS[1], new Rng(5))).toEqual(makePuzzles(PLANS[1], new Rng(5)));
    expect(makePuzzle(PLANS[1], new Rng(5)).layout.islands).not.toEqual(makePuzzle(PLANS[1], new Rng(6)).layout.islands);
    expect(PLANS.map((p) => p.size)).toEqual([7, 9, 9, 11, 5, 9]);
    for (let i = 1; i < LEVEL_ORDER.length; i++) expect(PLANS[LEVEL_ORDER[i] - 1].islands.min).toBeGreaterThanOrEqual(PLANS[LEVEL_ORDER[i - 1] - 1].islands.min);
    expect([...LEVEL_ORDER].sort()).toEqual(PLANS.map((_, i) => i + 1));
    expect(planFor(0)).toBe(PLANS[0]);
    expect(planFor(99)).toBe(PLANS[PLANS.length - 1]);
  });
});

describe('level 5, the small sea', () => {
  it('has one solution found by counting, 4 to 6 islands on a 5 by 5 sea, and an island with a single neighbour', () => {
    const plan = planFor(5);
    expect(plan.size).toBe(5);
    for (let s = 1; s <= 300; s++) {
      const p = makePuzzle(plan, new Rng(s * 131 + 7)), label = `seed ${s}`;
      expect(solve(p.layout, undefined, 2).found, label).toEqual([p.solution]);
      expect(bycounting(p.layout), label).toBe(true);
      expect(p.size, label).toBe(5);
      expect(p.layout.islands.length, label).toBeGreaterThanOrEqual(4);
      expect(p.layout.islands.length, label).toBeLessThanOrEqual(6);
      expect(p.layout.at.some((e) => e.length === 1), label).toBe(true);
    }
  });
});

describe('level 6, keep them joined', () => {
  it('closes a group off only when filling a bridge leaves every island in it full, with islands outside', () => {
    // Two 1s face each other: one plank fills both, and the 2 below is left outside.
    const ones = layoutFrom(5, ['1.1..', '.....', '2...1']);
    const top = ones.edges.findIndex((e) => e.a === 0 && e.b === 1);
    expect(closesOff(ones, ones.edges.map(() => 0), top, 1)).toEqual([0, 1]);
    // Two 2s: one plank leaves both short, two close them off.
    const twos = layoutFrom(3, ['2.2', '...', '1.1']);
    const across = twos.edges.findIndex((e) => e.a === 0 && e.b === 1);
    expect(closesOff(twos, twos.edges.map(() => 0), across, 1)).toBeNull();
    expect(closesOff(twos, twos.edges.map(() => 0), across, 2)).toEqual([0, 1]);
    // Joining the last two islands of the whole sea closes nothing off.
    const pair = layoutFrom(3, ['1.1', '...', '...']);
    expect(closesOff(pair, [0], 0, 1)).toBeNull();
  });

  it('never changes an answer: with the rule, the solver finds the same one way on every level and course sea', () => {
    for (let level = 1; level <= 5; level++) for (let s = 1; s <= (level === 3 || level === 4 ? 20 : 60); s++) {
      const p = makePuzzle(planFor(level), new Rng(s * 389 + level));
      expect(solve(p.layout, undefined, 2, false, true).found, `level ${level} seed ${s}`).toEqual([p.solution]);
    }
    for (const course of Object.values(COURSES)) for (const sea of course.seas) {
      const p = parsePuzzle(sea);
      expect(solve(p.layout, undefined, 2, false, true).found).toEqual([p.solution]);
    }
  });

  it('makes seas that counting alone cannot finish, that keeping them joined can, and whose hints teach it', () => {
    const plan = planFor(6);
    expect(plan.size).toBe(9);
    expect(LEVEL_ORDER).toEqual([5, 1, 2, 6, 3, 4]);
    for (let s = 1; s <= 200; s++) {
      const p = makePuzzle(plan, new Rng(s * 173 + 11)), label = `seed ${s}`;
      expect(solve(p.layout, undefined, 2).found, label).toEqual([p.solution]);
      expect(bycounting(p.layout), label).toBe(false);
      expect(byreasoning(p.layout), label).toBe(true);
      expect(p.layout.islands.length, label).toBeGreaterThanOrEqual(12);
      expect(p.layout.islands.length, label).toBeLessThanOrEqual(15);
      const kinds = hintWalk(p.layout, p.solution);
      expect(kinds, label).toContain('joined');
      expect(kinds, label).not.toContain('next');
      expect(kinds.length, label).toBe(p.par);
    }
  });

  it('gives a keep-them-joined hint only when counting is stuck, naming a group the answer never closes off', () => {
    let joined = 0;
    for (let s = 1; s <= 120; s++) {
      const p = makePuzzle(planFor(6), new Rng(s * 61 + 3)), l = p.layout, planks = p.solution.map(() => 0);
      for (let guard = 0; guard < 100 && !isSolved(l, planks); guard++) {
        const h = hintFor(l, planks, p.solution)!, label = `seed ${s} step ${guard}`;
        if (h.kind === 'joined') {
          joined++;
          expect(forcedPlank(l, planks), label).toBeNull();
          expect([l.edges[h.edge].a, l.edges[h.edge].b], label).toContain(h.island);
          expect([l.edges[h.closing].a, l.edges[h.closing].b], label).toContain(h.island);
          const cap = roomOf(l, planks, h.island).caps.find((c) => c.edge === h.closing)!.cap;
          expect(closesOff(l, planks, h.closing, cap), label).toEqual(h.group);
          expect(h.group.length, label).toBeLessThan(l.islands.length);
          // The answer never fills the closing bridge, and does need the lit one.
          expect(p.solution[h.closing], label).toBeLessThan(planks[h.closing] + cap);
          expect(planks[h.edge], label).toBeLessThan(p.solution[h.edge]);
        }
        planks[h.edge]++;
      }
      expect(isSolved(l, planks), `seed ${s}`).toBe(true);
    }
    expect(joined).toBeGreaterThan(100);
  });

  it('says it on a small hand-built sea: two 2s may share one plank, not two', () => {
    const p = parsePuzzle(['2.2', '...', '1.1']), l = p.layout;
    expect(bycounting(l)).toBe(false);
    expect(byreasoning(l)).toBe(true);
    const top = l.edges.findIndex((e) => e.a === 0 && e.b === 1), left = l.edges.findIndex((e) => e.a === 0 && e.b === 2);
    const planks = l.edges.map(() => 0);
    expect(hintFor(l, planks, p.solution)).toMatchObject({ kind: 'forced', edge: top, why: 'every-way' });
    planks[top] = 1;
    expect(hintFor(l, planks, p.solution)).toEqual({ kind: 'joined', edge: left, island: 0, why: 'full', closing: top, group: [0, 1] });
  });
});

describe('named hints', () => {
  /** Recomputed here, not through roomOf: what an edge could still take at one end, seen from the island `i`. */
  const capOf = (l: Layout, planks: readonly number[], k: number, i: number) => {
    if (l.crossing[k].some((f) => planks[f] > 0)) return 0;
    const e = l.edges[k], other = e.a === i ? e.b : e.a;
    let have = 0;
    l.edges.forEach((f, j) => { if (f.a === other || f.b === other) have += planks[j]; });
    return Math.max(0, Math.min(2 - planks[k], l.islands[other].n - have));
  };

  it('state the arithmetic they name on the board at that moment, and never contradict the answer', () => {
    const seen = new Set<string>();
    PLANS.forEach((plan, pi) => {
      const seeds = pi >= 2 && pi <= 3 ? 40 : 300;
      for (let s = 1; s <= seeds; s++) {
        const p = makePuzzle(plan, new Rng(s * 211 + pi)), l = p.layout, planks = p.solution.map(() => 0);
        for (let guard = 0; guard < 100 && !isSolved(l, planks); guard++) {
          const h = hintFor(l, planks, p.solution)!, label = `${plan.name} seed ${s} step ${guard}`;
          expect(h, label).not.toBeNull();
          if (h.kind === 'forced') {
            const i = h.island;
            let have = 0;
            l.edges.forEach((e, j) => { if (e.a === i || e.b === i) have += planks[j]; });
            const left = l.islands[i].n - have;
            const caps = l.at[i].map((k) => ({ k, cap: capOf(l, planks, k, i) }));
            const room = caps.reduce((n, c) => n + c.cap, 0), mine = caps.find((c) => c.k === h.edge)!;
            expect(mine, label).toBeDefined();
            expect(left, label).toBeGreaterThan(0);
            expect(mine.cap, label).toBeGreaterThan(0);
            if (h.why === 'full') expect(left, label).toBe(room);
            if (h.why === 'last-way') expect(caps.filter((c) => c.cap > 0).map((c) => c.k), label).toEqual([h.edge]);
            if (h.why === 'every-way') { expect(left, label).toBe(room - 1); expect(mine.cap, label).toBe(2); }
            seen.add(h.why);
          }
          if (h.kind !== 'fix') expect(planks[h.edge], label).toBeLessThan(p.solution[h.edge]);
          planks[h.edge]++;
        }
        expect(isSolved(l, planks), `${plan.name} seed ${s}`).toBe(true);
      }
    });
    expect([...seen].sort()).toEqual(['every-way', 'full', 'last-way']);
  });

  it('gives each reason on a small hand-built sea', () => {
    // A 1 and a 1 on a chain: each has all the room it needs, so full.
    const chain = parsePuzzle(['1.2.1', '.....', '.....', '.....', '.....']);
    expect(forcedPlank(chain.layout, [0, 0])).toMatchObject({ why: 'full' });
    // A 1 with a single way that could take two (the 5 beside it is not a real puzzle, only a board): one way left, but not full.
    const one = layoutFrom(5, ['1.5.1']);
    expect(forcedPlank(one, [0, 0])).toMatchObject({ why: 'last-way', island: 0, edge: 0 });
    // A 3 between two neighbours that could each take two: room 4, needs 3, so one plank on a double-capable way is forced.
    // (The 5s are not a real puzzle, only a board where no other island is full or has a single way.)
    const star = layoutFrom(5, ['.....', '.....', '5.3.5', '.....', '5...5']);
    const every = forcedPlank(star, star.edges.map(() => 0));
    expect(every).toMatchObject({ why: 'every-way', island: star.islands.findIndex((il) => il.n === 3) });
    expect([star.edges[every!.edge].a, star.edges[every!.edge].b]).toContain(every!.island);
  });
});

describe('moving around', () => {
  it('can reach every island from the first, in every puzzle made, so the highlight is never stuck', () => {
    for (const plan of PLANS) for (let s = 1; s <= 6; s++) {
      const p = makePuzzle(plan, new Rng(s * 31));
      const seen = new Set([0]), queue = [0];
      for (let head = 0; head < queue.length; head++) for (const dir of [0, 1, 2, 3]) {
        const next = islandToward(p.layout, queue[head], dir);
        if (next !== null && !seen.has(next)) { seen.add(next); queue.push(next); }
      }
      expect(seen.size, `${plan.name} seed ${s}`).toBe(p.layout.islands.length);
    }
  });

  it('finds the bridge from an island in a direction, if one faces that way', () => {
    const l = layoutFrom(5, ['1.2.1', '.....', '2....']);
    expect(l.edges.length).toBe(3);
    const middle = 1;
    expect(edgeToward(l, middle, 0)).not.toBeNull();
    expect(edgeToward(l, middle, 2)).not.toBeNull();
    expect(edgeToward(l, middle, 1)).toBeNull();
    const corner = l.islands.findIndex((il) => il.r === 0 && il.c === 0);
    expect(edgeToward(l, corner, 1)).not.toBeNull();
    expect(edgeToward(l, corner, 3)).toBeNull();
  });
});

describe('hints', () => {
  it('lead from an empty sea to the finished puzzle, never needing a plank to come off', () => {
    for (const plan of PLANS) for (let s = 1; s <= 5; s++) {
      const p = makePuzzle(plan, new Rng(s * 53)), planks = p.solution.map(() => 0);
      let steps = 0;
      for (let guard = 0; guard < 80 && !isSolved(p.layout, planks); guard++) {
        const h = hintFor(p.layout, planks, p.solution);
        expect(h, plan.name).not.toBeNull();
        expect(h!.kind, plan.name).not.toBe('fix');
        expect(planks[h!.edge], plan.name).toBeLessThan(p.solution[h!.edge]);
        planks[h!.edge]++;
        steps++;
      }
      expect(isSolved(p.layout, planks), plan.name).toBe(true);
      expect(steps, plan.name).toBe(p.par);
    }
  });

  it('names a plank that does not belong first, and has nothing to say about a finished puzzle', () => {
    const p = makePuzzle(PLANS[0], new Rng(3));
    const wrong = p.solution.map((x, k) => (k === 0 ? x + 1 : x));
    expect(hintFor(p.layout, wrong, p.solution)).toEqual({ kind: 'fix', edge: 0 });
    expect(hintFor(p.layout, p.solution, p.solution)).toBeNull();
  });
});

describe('touch', () => {
  const CELL = 64;
  it('gives every cell of water between two facing islands to that bridge, and an island or open sea to none', () => {
    for (const plan of PLANS) for (let s = 1; s <= 4; s++) {
      const p = makePuzzle(plan, new Rng(s * 29)), l = p.layout;
      l.edges.forEach((e, k) => {
        const a = l.islands[e.a], b = l.islands[e.b], h = e.dir === 'h';
        for (let i = 1; i < (h ? b.c - a.c : b.r - a.r); i++) {
          const r = h ? a.r : a.r + i, c = h ? a.c + i : a.c, x = c * CELL + CELL / 2, y = r * CELL + CELL / 2;
          const got = edgeAt(l, CELL, x, y);
          // A cell where bridges would cross belongs to one of them; every other cell to this one.
          if (l.crossing[k].some((f) => edgeAt(l, CELL, x, y) === f)) continue;
          expect(got, plan.name).toBe(k);
        }
      });
      for (const il of l.islands) expect(edgeAt(l, CELL, il.c * CELL + CELL / 2, il.r * CELL + CELL / 2), plan.name).toBeNull();
    }
  });

  it('lets a tap in a shared cell take a plank off the bridge that has one', () => {
    // A horizontal bridge from (2,0) to (2,4) and a vertical one from (0,2) to (4,2) cross at (2,2).
    const l = layoutFrom(5, ['..1..', '.....', '2...2', '.....', '..1..']);
    const h = l.edges.findIndex((e) => e.dir === 'h'), v = l.edges.findIndex((e) => e.dir === 'v');
    const x = 2 * CELL + CELL / 2;
    for (const [laid, other] of [[h, v], [v, h]]) {
      const planks = l.edges.map((_, k) => (k === laid ? 1 : 0));
      expect(edgeAt(l, CELL, x, x, planks)).toBe(laid);
      expect(edgeAt(l, CELL, x, x, planks)).not.toBe(other);
    }
  });

  it('gives a bot a point in the water that is its own, for every bridge of every level', () => {
    for (const plan of PLANS) for (let s = 1; s <= 4; s++) {
      const p = makePuzzle(plan, new Rng(s * 41));
      p.layout.edges.forEach((_, k) => {
        const at = waterOf(p.layout, CELL, k);
        const got = edgeAt(p.layout, CELL, at.x, at.y);
        expect(got, plan.name).toBe(k);
      });
    }
  });

  it('leaves the last few planks of the answer off for the demonstration, never solving or over-filling the sea', () => {
    for (const plan of PLANS) {
      const p = makePuzzle(plan, new Rng(5)), start = headStart(p.solution);
      expect(isSolved(p.layout, start), plan.name).toBe(false);
      expect(start.every((n, k) => n <= p.solution[k])).toBe(true);
      expect(p.solution.reduce((a, n) => a + n, 0) - start.reduce((a, n) => a + n, 0), plan.name).toBe(Math.min(6, p.par));
    }
  });
});
