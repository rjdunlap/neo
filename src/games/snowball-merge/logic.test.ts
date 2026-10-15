import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import { complete, DIRECTIONS, makePuzzle, PLANS, slide, solve } from './logic';

describe('Snowball Merge', () => {
  it('packs holes before merging, and a merged snowball cannot merge twice in one slide', () => {
    expect(slide([2, 0, 2, 2, 2, 4, 4, 4, 4], 'left').board).toEqual([4, 0, 0, 4, 4, 0, 8, 4, 0]);
    expect(slide([2, 2, 2, 0, 0, 0, 0, 0, 0], 'right').board).toEqual([0, 2, 4, 0, 0, 0, 0, 0, 0]);
    expect(slide([2, 0, 0, 2, 0, 0, 4, 0, 0], 'up').board).toEqual([4, 0, 0, 4, 0, 0, 0, 0, 0]);
    expect(slide([2, 0, 0, 2, 0, 0, 4, 0, 0], 'down').board).toEqual([0, 0, 0, 4, 0, 0, 4, 0, 0]);
  });
  it('conserves quantity, adds no snowballs, moves each input once and leaves its input untouched', () => {
    for (const plan of PLANS) for (const d of DIRECTIONS) {
      const before = [...plan.board], next = slide(before, d);
      expect(before).toEqual(plan.board);
      expect(next.board.reduce((s, v) => s + v, 0)).toBe(plan.target);
      expect(next.board.filter(Boolean).length).toBe(before.filter(Boolean).length - next.merges);
      expect(next.motions.map(m => m.from).sort()).toEqual(before.flatMap((v, i) => v ? [i] : []).sort());
      expect(next.motions.every(m => m.to >= 0 && m.to < 9)).toBe(true);
    }
    expect(slide([2, 0, 0, 0, 0, 0, 0, 0, 0], 'left').changed).toBe(false);
  });
  it('makes reproducible solvable variants at every level and every hint leads to completion', () => {
    for (let level = 1; level <= 3; level++) {
      const variants = new Set<string>();
      for (let seed = 1; seed <= 24; seed++) {
        const puzzle = makePuzzle(level, new Rng(seed));
        expect(puzzle).toEqual(makePuzzle(level, new Rng(seed)));
        variants.add(puzzle.board.join(','));
        let board = puzzle.board, route = solve(board, puzzle.target);
        expect(route).not.toBeNull();
        let remaining = route!.length;
        while (!complete(board, puzzle.target)) {
          route = solve(board, puzzle.target)!;
          expect(route).toHaveLength(remaining);
          const step = slide(board, route[0]);
          expect(step.changed).toBe(true);
          board = step.board; remaining--;
        }
        expect(remaining).toBe(0);
      }
      expect(variants.size).toBeGreaterThanOrEqual(4);
    }
  });
  it('accepts alternative finishing routes and reports a dead end without an arbitrary hint', () => {
    const b = [2, 2, 0, 0, 0, 0, 0, 0, 0];
    expect(complete(slide(b, 'left').board, 4)).toBe(true);
    expect(complete(slide(b, 'right').board, 4)).toBe(true);
    const stuck = [2, 4, 8, 4, 2, 16, 8, 16, 4];
    expect(stuck.reduce((s, v) => s + v, 0)).toBe(64);
    expect(solve(stuck, 64)).toBeNull();
    expect(complete([16, 2, ...Array(7).fill(0)], 16)).toBe(false);
    expect(solve([16, ...Array(8).fill(0)], 16)).toEqual([]);
  });
});
