import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import { completion, helpFor, makeBoard, moveError, solved, step, validPath } from './logic';

describe('Mossy Path', () => {
  it('makes reproducible, solvable boards with distinct tiles and real adjacent routes at every level', () => {
    for (let level = 1; level <= 3; level++) for (let seed = 1; seed <= 100; seed++) {
      const b = makeBoard(level, new Rng(seed));
      expect(b).toEqual(makeBoard(level, new Rng(seed)));
      expect(new Set(b.tiles).size).toBe(b.tiles.length);
      expect(b.tiles.every(i => i >= 0 && i < b.rows * b.cols)).toBe(true);
      const route = completion(b, [b.start]);
      expect(route).not.toBeNull();
      let path = [b.start];
      for (const at of route!) { expect(helpFor(b, path)?.undo).toBe(0); path = step(b, path, at)!; }
      expect(solved(b, path)).toBe(true);
    }
  });
  it('rejects row wrapping, revisits and reaching the pond before the last tile', () => {
    const b = { rows: 3, cols: 4, tiles: Array.from({ length: 12 }, (_, i) => i), start: 0, pond: 11 };
    expect(moveError(b, [0, 1, 2, 3], 4)).toBe('far');
    expect(moveError(b, [0, 1], 0)).toBe('visited');
    expect(moveError(b, [0, 1, 2, 3, 7], 11)).toBe('pond');
    expect(step(b, [0], 8)).toBeNull();
    expect(solved(b, [0, 11])).toBe(false);
    expect(validPath(b, [0, 1, 0])).toBe(false);
  });
  it('accepts alternative complete routes rather than comparing with a hidden answer', () => {
    const b = { rows: 3, cols: 4, tiles: Array.from({ length: 12 }, (_, i) => i), start: 0, pond: 11 };
    expect(solved(b, [0, 1, 2, 3, 7, 6, 5, 4, 8, 9, 10, 11])).toBe(true);
    expect(solved(b, [0, 4, 8, 9, 5, 1, 2, 3, 7, 6, 10, 11])).toBe(true);
  });
  it('recovers from every legal experimental prefix, with the fewest undos and a completing next tile', () => {
    const b = makeBoard(3, new Rng(7));
    let deadEnds = 0;
    const visit = (path: number[]) => {
      if (solved(b, path)) return;
      const help = helpFor(b, path)!;
      expect(help).not.toBeNull();
      const prefix = path.slice(0, path.length - help.undo);
      expect(completion(b, prefix)).not.toBeNull();
      expect(completion(b, step(b, prefix, help.next)!)).not.toBeNull();
      if (help.undo) { deadEnds++; expect(completion(b, path.slice(0, prefix.length + 1))).toBeNull(); }
      for (const at of b.tiles) { const next = step(b, path, at); if (next) visit(next); }
    };
    visit([b.start]); expect(deadEnds).toBeGreaterThan(0);
  });
});
