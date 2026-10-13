import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import { POOLS } from './boards';
import { botTarget, clear, fall, hintFor, makePuzzle, matches, moves, neighbors, PLANS, solve, swap, type Board, type Swap } from './logic';

/** Independent breadth-first oracle, as a check on the game's shortest-route DFS. */
function breadthFirst(board: Board, size: number): number | null {
  let frontier: Board[] = [board];
  const seen = new Set([board.join(',')]);
  for (let depth = 0; frontier.length; depth++) {
    const next: Board[] = [];
    for (const b of frontier) {
      if (clear(b)) return depth;
      for (const pair of moves(b, size)) {
        const out = swap(b, size, pair)!.board, key = out.join(',');
        if (!seen.has(key)) { seen.add(key); next.push(out); }
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
    const b = [-1, -1, -1, 0, 1, 2, 1, 2, 0], saved = [...b];
    for (const pair of [[2, 3], [3, 8], [0, 3], [3, 4]] as Swap[]) expect(swap(b, 3, pair)).toBeNull();
    expect(neighbors(2, 3, 3)).toBe(false); expect(neighbors(-1, 0, 3)).toBe(false);
    expect(b).toEqual(saved);
    expect(swap([0, 0, 1, 1], 2, [0, 1])).toBeNull();
  });
  it('has three stable compact boards per plan with exact pars, no initial matches and the stated gem counts', () => {
    POOLS.forEach((pool, p) => {
      expect(pool).toHaveLength(3);
      for (const puzzle of pool) {
        const size = PLANS[p].size;
        expect(matches(puzzle.board, size)).toEqual([]);
        expect(fall(puzzle.board, size)).toEqual(puzzle.board);
        expect(puzzle.board.filter(k => k >= 0)).toHaveLength(PLANS[p].gems);
        expect(breadthFirst(puzzle.board, size)).toBe(puzzle.par);
        expect(solve(puzzle.board, size)).toHaveLength(puzzle.par);
      }
    });
  });
  it('builds deterministic varied boards and every hint/bot swap reduces the exact remaining par', () => {
    for (let level = 1; level <= PLANS.length; level++) {
      const variants = new Set<string>();
      for (let seed = 1; seed <= 60; seed++) {
        const puzzle = makePuzzle(level, new Rng(seed));
        expect(puzzle).toEqual(makePuzzle(level, new Rng(seed)));
        variants.add(puzzle.board.join(','));
        let b: Board = puzzle.board;
        let remaining = puzzle.par;
        while (!clear(b)) {
          const route = solve(b, puzzle.size)!, pair = hintFor(b, puzzle.size)!;
          expect(route).toHaveLength(remaining);
          expect(botTarget(route, null)).toBe(pair[0]);
          expect(botTarget(route, pair[0])).toBe(pair[1]);
          expect(botTarget(route, pair[1])).toBe(pair[0]);
          const step = swap(b, puzzle.size, pair)!;
          expect(step.waves.length).toBeGreaterThan(0);
          expect(matches(step.board, puzzle.size)).toEqual([]);
          expect(step.board.filter(k => k >= 0).length).toBeLessThan(b.filter(k => k >= 0).length);
          b = step.board; remaining--;
        }
        expect(remaining).toBe(0);
      }
      expect(variants.size).toBeGreaterThan(30);
    }
  });
  it('supports alternatives and identifies dead ends rather than recommending an arbitrary match', () => {
    let deadEnds = 0, alternatives = 0, cascades = 0;
    for (const pool of POOLS) for (const puzzle of pool) {
      const size = Math.sqrt(puzzle.board.length);
      for (const pair of moves(puzzle.board, size)) {
        const step = swap(puzzle.board, size, pair)!;
        if (solve(step.board, size) === null) { deadEnds++; expect(hintFor(step.board, size)).toBeNull(); }
        else alternatives++;
        if (step.waves.length > 1) cascades++;
      }
    }
    expect(deadEnds).toBeGreaterThan(0); expect(alternatives).toBeGreaterThan(12); expect(cascades).toBeGreaterThan(0);
    expect(botTarget([[1, 2]], 3)).toBe(3);
  });
});
