import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import { POOLS } from './boards';
import {
  botTarget,
  clear,
  drops,
  fall,
  hintFor,
  makePuzzle,
  matches,
  moves,
  neighbors,
  PLANS,
  solve,
  swap,
  type Board,
  type Swap,
} from './logic';

/** Independent breadth-first oracle, as a check on the game's shortest-route DFS. */
function breadthFirst(board: Board, size: number): number | null {
  let frontier: Board[] = [board];
  const seen = new Set([board.join(',')]);
  for (let depth = 0; frontier.length; depth++) {
    const next: Board[] = [];
    for (const b of frontier) {
      if (clear(b)) return depth;
      for (const pair of moves(b, size)) {
        const out = swap(b, size, pair)!.board,
          key = out.join(',');
        if (!seen.has(key)) {
          seen.add(key);
          next.push(out);
        }
      }
    }
    frontier = next;
  }
  return null;
}
describe('Gem Swap', () => {
  it('removes long lines and intersections once, without wrapping at an edge', () => {
    expect(matches([0, 0, 0, 0, -1, -1, -1, -1, -1], 3)).toEqual([0, 1, 2]);
    const cross = [-1, 0, -1, 0, 0, 0, -1, 0, -1];
    expect(matches(cross, 3)).toEqual([1, 3, 4, 5, 7]);
    expect(matches([-1, 0, 0, 0, -1, -1, -1, -1, -1], 3)).toEqual([]);
    expect(matches([0, 0, 0, 0, ...Array(12).fill(-1)], 4)).toEqual([0, 1, 2, 3]);
  });
  it('preserves the order of falling gems and adds no new ones', () => {
    expect(fall([1, -1, 2, -1, -1, -1, 3, 4, -1], 3)).toEqual([-1, -1, -1, 1, -1, -1, 3, 4, 2]);
  });
  it('rejects non-neighbours, holes, equal gems and swaps that make no line without changing the board', () => {
    const b = [-1, -1, -1, 0, 1, 2, 1, 2, 0],
      saved = [...b];
    for (const pair of [
      [2, 3],
      [3, 8],
      [0, 3],
      [3, 4],
    ] as Swap[])
      expect(swap(b, 3, pair)).toBeNull();
    expect(neighbors(2, 3, 3)).toBe(false);
    expect(neighbors(-1, 0, 3)).toBe(false);
    expect(b).toEqual(saved);
    expect(swap([0, 0, 1, 1], 2, [0, 1])).toBeNull();
  });
  it('has at least twenty stable compact boards per plan with exact pars, no initial matches and the stated gem counts', () => {
    POOLS.forEach((pool, p) => {
      expect(pool.length).toBeGreaterThanOrEqual(20);
      for (const puzzle of pool) {
        const size = PLANS[p].size;
        expect(matches(puzzle.board, size)).toEqual([]);
        expect(fall(puzzle.board, size)).toEqual(puzzle.board);
        expect(puzzle.board.filter((k) => k >= 0)).toHaveLength(PLANS[p].gems);
        expect(breadthFirst(puzzle.board, size)).toBe(puzzle.par);
        expect(solve(puzzle.board, size)).toHaveLength(puzzle.par);
      }
    });
  });
  it('builds deterministic varied boards and every hint/bot swap reduces the exact remaining par', () => {
    for (let level = 1; level <= PLANS.length; level++) {
      const variants = new Set<string>();
      for (let seed = 1; seed <= 120; seed++) {
        const puzzle = makePuzzle(level, new Rng(seed));
        expect(puzzle).toEqual(makePuzzle(level, new Rng(seed)));
        variants.add(puzzle.board.join(','));
        let b: Board = puzzle.board;
        let remaining = puzzle.par;
        while (!clear(b)) {
          const route = solve(b, puzzle.size)!,
            pair = hintFor(b, puzzle.size)!;
          expect(route).toHaveLength(remaining);
          expect(botTarget(route, null)).toBe(pair[0]);
          expect(botTarget(route, pair[0])).toBe(pair[1]);
          expect(botTarget(route, pair[1])).toBe(pair[0]);
          const step = swap(b, puzzle.size, pair)!;
          expect(step.waves.length).toBeGreaterThan(0);
          expect(matches(step.board, puzzle.size)).toEqual([]);
          expect(step.board.filter((k) => k >= 0).length).toBeLessThan(b.filter((k) => k >= 0).length);
          b = step.board;
          remaining--;
        }
        expect(remaining).toBe(0);
      }
      expect(variants.size).toBeGreaterThan(60);
    }
  });
  it('gives every generated tray above level 1 a dead-end first swap and a falling line on some shortest route', () => {
    // The first three trays of each level are the hand-made originals; the script's trays follow.
    POOLS.slice(1).forEach((pool) =>
      pool.slice(3).forEach((puzzle) => {
        const size = Math.sqrt(puzzle.board.length);
        const left = (b: Board) => solve(b, size)?.length ?? null;
        const cascades = (b: Board, n: number): boolean =>
          n > 0 &&
          moves(b, size).some((pair) => {
            const step = swap(b, size, pair)!;
            return left(step.board) === n - 1 && (step.waves.length > 1 || cascades(step.board, n - 1));
          });
        expect(
          moves(puzzle.board, size).some((pair) => left(swap(puzzle.board, size, pair)!.board) === null),
        ).toBe(true);
        expect(cascades(puzzle.board, puzzle.par)).toBe(true);
      }),
    );
  });
  it('keeps the hint search on the six-by-six trays across all six columns and under a node budget from every state on the stored route', () => {
    // A tray's search memoises every tray reachable from it, so the opening count also bounds every later revision.
    expect(PLANS[4]).toMatchObject({ size: 6, gems: 24 });
    for (const puzzle of POOLS[4]) {
      expect(puzzle.par).toBe(5);
      for (let x = 0; x < 6; x++) expect(puzzle.board.some((k, i) => i % 6 === x && k >= 0)).toBe(true);
      let b: Board = puzzle.board;
      while (!clear(b)) {
        const stats = { nodes: 0 },
          route = solve(b, 6, stats)!;
        expect(stats.nodes).toBeLessThan(2000);
        b = swap(b, 6, route[0])!.board;
      }
    }
  });
  it('makes every shortest route at level 6 use a swap that clears a long line or a crossing', () => {
    expect(PLANS[5]).toMatchObject({ size: 5, gems: 20 });
    const pool = POOLS[5];
    expect(pool.filter((t) => t.par === 3)).toHaveLength(10);
    expect(pool.filter((t) => t.par === 4)).toHaveLength(10);
    // Independent of the generator: four in a row anywhere, or one gem at the middle-or-end of both an across and a down three.
    const same = (b: Board, cells: number[]) => cells.every((c) => b[c] >= 0 && b[c] === b[cells[0]]);
    const run = (i: number, d: number, n: number) => Array.from({ length: n }, (_, k) => i + k * d);
    const fits = (i: number, d: number, n: number) =>
      d === 1 ? (i % 5) + n <= 5 : Math.floor(i / 5) + n <= 5;
    const threesThrough = (b: Board, c: number, d: number) =>
      [0, 1, 2].some((back) => {
        const start = c - back * d;
        return (
          start >= 0 &&
          (d === 5 || Math.floor(start / 5) === Math.floor(c / 5)) &&
          fits(start, d, 3) &&
          same(b, run(start, d, 3))
        );
      });
    const long = (b: Board, pair: Swap) => {
      const after = swap(b, 5, pair)!.waves[0].board;
      return after.some(
        (_, i) =>
          [1, 5].some((d) => fits(i, d, 4) && same(after, run(i, d, 4))) ||
          (after[i] >= 0 && threesThrough(after, i, 1) && threesThrough(after, i, 5)),
      );
    };
    for (const puzzle of pool) {
      expect(breadthFirst(puzzle.board, 5)).toBe(puzzle.par);
      // Enumerate every shortest route: a route that never makes a long swap would be a counterexample.
      const shortCut = (b: Board, left: number): boolean =>
        left === 0
          ? clear(b)
          : moves(b, 5).some((pair) => {
              const after = swap(b, 5, pair)!.board;
              return !long(b, pair) && breadthFirst(after, 5) === left - 1 && shortCut(after, left - 1);
            });
      expect(shortCut(puzzle.board, puzzle.par)).toBe(false);
      expect(
        moves(puzzle.board, 5).some((pair) => breadthFirst(swap(puzzle.board, 5, pair)!.board, 5) === null),
      ).toBe(true);
      // The hint follows a shortest route, so it reaches the long swap; its search stays small from every state on it.
      let b: Board = puzzle.board,
        used = false;
      while (!clear(b)) {
        const stats = { nodes: 0 },
          route = solve(b, 5, stats)!;
        expect(stats.nodes).toBeLessThan(2000);
        used ||= long(b, route[0]);
        b = swap(b, 5, route[0])!.board;
      }
      expect(used).toBe(true);
    }
  });
  it('tells the drawing which row each surviving gem fell from', () => {
    for (const pool of POOLS)
      for (const puzzle of pool) {
        const size = Math.sqrt(puzzle.board.length);
        for (const pair of moves(puzzle.board, size))
          for (const wave of swap(puzzle.board, size, pair)!.waves) {
            const after = fall(
              wave.board.map((k, i) => (wave.removed.includes(i) ? -1 : k)),
              size,
            );
            drops(wave.board, wave.removed, size).forEach((from, i) => {
              if (from < 0) {
                expect(after[i]).toBe(-1);
                return;
              }
              expect(after[i]).toBe(wave.board[from * size + (i % size)]);
              expect(from).toBeLessThanOrEqual(Math.floor(i / size));
            });
          }
      }
  });
  it('supports alternatives and identifies dead ends rather than recommending an arbitrary match', () => {
    let deadEnds = 0,
      alternatives = 0,
      cascades = 0;
    for (const pool of POOLS)
      for (const puzzle of pool) {
        const size = Math.sqrt(puzzle.board.length);
        for (const pair of moves(puzzle.board, size)) {
          const step = swap(puzzle.board, size, pair)!;
          if (solve(step.board, size) === null) {
            deadEnds++;
            expect(hintFor(step.board, size)).toBeNull();
          } else alternatives++;
          if (step.waves.length > 1) cascades++;
        }
      }
    expect(deadEnds).toBeGreaterThan(0);
    expect(alternatives).toBeGreaterThan(12);
    expect(cascades).toBeGreaterThan(0);
    expect(botTarget([[1, 2]], 3)).toBe(3);
  });
});
