import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import { distances, goal, makeBoard, neighbours, planFor, slide, solutionStep, solved } from './logic';

describe('Number Nook', () => {
  it('enumerates precisely the reachable states of each shape', () => {
    expect(distances(2, 2).size).toBe(12);
    expect(distances(2, 3).size).toBe(360);
    expect(distances(3, 3).size).toBe(181440);
    expect(solutionStep([2, 1, 3, 4, 5, 6, 7, 8, 0], 3)).toBeNull();
  });
  it('generates seeded boards at the stated shortest distance and solves them with legal hints', () => {
    for (let level = 1; level <= 3; level++) for (let seed = 1; seed <= 25; seed++) {
      const p = planFor(level);
      let board = makeBoard(level, new Rng(seed));
      expect(board).toEqual(makeBoard(level, new Rng(seed)));
      expect(board.slice().sort((a, b) => a - b)).toEqual(Array.from({ length: p.rows * p.cols }, (_, i) => i));
      expect(solutionStep(board, p.cols)!.distance).toBe(p.depth);
      for (let remaining = p.depth; remaining > 0; remaining--) {
        const step = solutionStep(board, p.cols)!;
        expect(step.distance).toBe(remaining);
        board = slide(board, p.cols, step.next)!;
        expect(board).not.toBeNull();
      }
      expect(solved(board)).toBe(true);
    }
  });
  it('hints still shorten the route after any legal exploratory slide', () => {
    for (const [key, info] of distances(2, 3)) {
      const b = key.split('').map(Number);
      if (info.distance) expect(solutionStep(slide(b, 3, info.next)!, 3)!.distance).toBe(info.distance - 1);
      for (const at of neighbours(b, 3)) {
        const next = slide(b, 3, at)!;
        expect(solutionStep(next, 3)).not.toBeNull();
        expect(slide(next, 3, b.indexOf(0))).toEqual(b);
      }
    }
  });
  it('rejects distant, diagonal, blank and wrapped moves without mutating the board', () => {
    const b = goal(3, 3), before = b.slice();
    for (const at of [0, 4, 8, -1, 9]) expect(slide(b, 3, at)).toBeNull();
    expect(b).toEqual(before);
    expect(neighbours([1, 2, 0, 3, 4, 5], 3)).toEqual([5, 1]);
  });
});
