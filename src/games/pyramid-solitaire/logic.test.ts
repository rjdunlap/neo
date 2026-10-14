import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import { at, covers, exposed, fullMask, makePuzzle, moves, present, remove, solver } from './logic';

describe('Pyramid Solitaire', () => {
  it('requires both covering cards to leave and never wraps rows', () => {
    expect(covers(3, 0)).toEqual([1, 2]);
    expect(covers(3, 2)).toEqual([4, 5]);
    expect(covers(3, 3)).toEqual([]);
    const p = { rows: 3, ranks: [13, 13, 13, 6, 7, 13] };
    expect(exposed(p, fullMask(3), 0)).toBe(false);
    expect(exposed(p, remove(fullMask(3), [3]), 1)).toBe(false);
    expect(exposed(p, remove(fullMask(3), [3, 4]), 1)).toBe(true);
    expect(exposed(p, fullMask(3), -1)).toBe(false);
    expect(exposed(p, fullMask(3), 6)).toBe(false);
    expect(at(4, 4)).toBe(14);
  });
  it('every seeded deal has a legal clearing route with valid ranks and alternatives supported', () => {
    for (let level = 1; level <= 3; level++) for (let seed = 1; seed <= 100; seed++) {
      const p = makePuzzle(level, new Rng(seed)), solve = solver(p);
      expect(p).toEqual(makePuzzle(level, new Rng(seed)));
      expect(p.ranks.every(r => Number.isInteger(r) && r >= 1 && r <= 13)).toBe(true);
      let mask = fullMask(p.rows);
      const route = solve(mask)!;
      expect(route).not.toBeNull();
      for (const move of route) {
        expect(move.every(i => exposed(p, mask, i))).toBe(true);
        expect(new Set(move).size).toBe(move.length);
        expect(move.reduce((n, i) => n + p.ranks[i], 0)).toBe(13);
        const before = mask; mask = remove(mask, move);
        expect(mask).not.toBe(before);
        expect(move.every(i => !present(mask, i))).toBe(true);
      }
      expect(mask).toBe(0);
      for (const move of moves(p, fullMask(p.rows))) {
        const after = remove(fullMask(p.rows), move), rest = solve(after);
        if (rest) expect(rest.reduce((m, step) => remove(m, step), after)).toBe(0);
      }
    }
  });
  it('recognizes blocked routes, kings alone, and accepts all valid complements', () => {
    const p = { rows: 3, ranks: [13, 13, 13, 6, 7, 7] };
    expect(moves(p, fullMask(3))).toEqual([[3, 4], [3, 5]]);
    expect(solver(p)(fullMask(3))).toBeNull();
    expect(moves({ rows: 1, ranks: [13] }, 1)).toEqual([[0]]);
    expect(solver({ rows: 1, ranks: [13] })(1)).toEqual([[0]]);
    expect(solver(p)(0)).toEqual([]);
  });
  it('solver agrees with independent exhaustive reachability on a small deal', () => {
    const p = makePuzzle(1, new Rng(27)), solve = solver(p);
    const reachable = (mask: number): boolean => {
      if (!mask) return true;
      const free = p.ranks.map((_, i) => i).filter(i => exposed(p, mask, i));
      for (const a of free) {
        if (p.ranks[a] === 13 && reachable(mask & ~(1 << a))) return true;
        for (const b of free) if (a < b && p.ranks[a] + p.ranks[b] === 13 && reachable(mask & ~(1 << a) & ~(1 << b))) return true;
      }
      return false;
    };
    for (let mask = 0; mask <= fullMask(3); mask++) expect(solve(mask) !== null).toBe(reachable(mask));
  });
});
