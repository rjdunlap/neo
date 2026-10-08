import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import {
  bycounting, canAdd, connected, edgeToward, hintFor, isSolved, islandToward, layoutOf, makePuzzle, makePuzzles, otherEnd, parsePuzzle, picture, planFor, PLANS, planksAt, solve,
  trouble, type Island, type Layout,
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
    expect(PLANS.map((p) => p.size)).toEqual([7, 9, 9, 11]);
    for (let i = 1; i < PLANS.length; i++) expect(PLANS[i].islands.min).toBeGreaterThanOrEqual(PLANS[i - 1].islands.min);
    expect(planFor(0)).toBe(PLANS[0]);
    expect(planFor(99)).toBe(PLANS[PLANS.length - 1]);
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
