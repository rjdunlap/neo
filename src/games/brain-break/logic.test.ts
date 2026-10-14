import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import { hintIndex, judge, layoutFor, makeBoard, planFor } from './logic';

describe('Brain Break number order', () => {
  it('gives every number exactly once and always has a next-number hint', () => {
    for (let level = 1; level <= 3; level++) for (let seed = 1; seed <= 100; seed++) {
      const board = makeBoard(level, new Rng(seed)), count = planFor(level).side ** 2;
      expect([...board].sort((a, b) => a - b)).toEqual(Array.from({ length: count }, (_, i) => i + 1));
      for (let next = 1; next <= count; next++) {
        expect(judge(board[hintIndex(board, next)], next)).toBe('right');
        for (const value of board) expect(judge(value, next)).toBe(value < next ? 'done' : value === next ? 'right' : 'wrong');
      }
      expect(hintIndex(board, count + 1)).toBe(-1);
    }
  });
  it('is seeded, and produces fresh arrangements', () => {
    expect(makeBoard(3, new Rng(4))).toEqual(makeBoard(3, new Rng(4)));
    expect(new Set(Array.from({ length: 20 }, (_, seed) => makeBoard(3, new Rng(seed + 1)).join(','))).size).toBe(20);
  });
  it('keeps full-size targets on screen, separated from help and the guide', () => {
    for (const [w, h] of [[1024, 768], [1365, 768], [1024, 1365], [1180, 820]]) for (const side of [3, 4, 5]) {
      const layout = layoutFor(w, h, side);
      expect(layout.size).toBeGreaterThanOrEqual(100);
      for (const p of layout.stones) {
        expect(p.x - 50).toBeGreaterThan(150); expect(p.x + 50).toBeLessThan(w);
        expect(p.y - 50).toBeGreaterThan(150); expect(p.y + 50).toBeLessThan(h - 30);
        expect(Math.abs(p.x - layout.hint.x) >= 116 || Math.abs(p.y - layout.hint.y) >= 100).toBe(true);
      }
    }
  });
});
