import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import {
  CANDIDATES,
  PACK_LIMIT,
  at,
  bandDistance,
  clearRate,
  covers,
  dealCandidate,
  exposed,
  fullMask,
  makePuzzle,
  moves,
  planFor,
  present,
  remove,
  solver,
} from './logic';

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
    for (let level = 1; level <= 4; level++)
      for (let seed = 1; seed <= 100; seed++) {
        const p = makePuzzle(level, new Rng(seed)),
          solve = solver(p);
        expect(p).toEqual(makePuzzle(level, new Rng(seed)));
        expect(p.ranks.every((r) => Number.isInteger(r) && r >= 1 && r <= 13)).toBe(true);
        let mask = fullMask(p.rows);
        const route = solve(mask)!;
        expect(route).not.toBeNull();
        for (const move of route) {
          expect(move.every((i) => exposed(p, mask, i))).toBe(true);
          expect(new Set(move).size).toBe(move.length);
          expect(move.reduce((n, i) => n + p.ranks[i], 0)).toBe(13);
          const before = mask;
          mask = remove(mask, move);
          expect(mask).not.toBe(before);
          expect(move.every((i) => !present(mask, i))).toBe(true);
        }
        expect(mask).toBe(0);
        for (const move of moves(p, fullMask(p.rows))) {
          const after = remove(fullMask(p.rows), move),
            rest = solve(after);
          if (rest) expect(rest.reduce((m, step) => remove(m, step), after)).toBe(0);
        }
      }
  });
  it('recognizes blocked routes, kings alone, and accepts all valid complements', () => {
    const p = { rows: 3, ranks: [13, 13, 13, 6, 7, 7] };
    expect(moves(p, fullMask(3))).toEqual([
      [3, 4],
      [3, 5],
    ]);
    expect(solver(p)(fullMask(3))).toBeNull();
    expect(moves({ rows: 1, ranks: [13] }, 1)).toEqual([[0]]);
    expect(solver({ rows: 1, ranks: [13] })(1)).toEqual([[0]]);
    expect(solver(p)(0)).toEqual([]);
  });
  it('solver agrees with independent exhaustive reachability on a small deal', () => {
    const p = makePuzzle(1, new Rng(27)),
      solve = solver(p);
    const reachable = (mask: number): boolean => {
      if (!mask) return true;
      const free = p.ranks.map((_, i) => i).filter((i) => exposed(p, mask, i));
      for (const a of free) {
        if (p.ranks[a] === 13 && reachable(mask & ~(1 << a))) return true;
        for (const b of free)
          if (a < b && p.ranks[a] + p.ranks[b] === 13 && reachable(mask & ~(1 << a) & ~(1 << b))) return true;
      }
      return false;
    };
    for (let mask = 0; mask <= fullMask(3); mask++) expect(solve(mask) !== null).toBe(reachable(mask));
  });
  it('the deal dial lands each level in its band over 200 seeds, every deal from one rng clearing', () => {
    for (let level = 1; level <= 4; level++) {
      let inBand = 0;
      for (let seed = 1; seed <= 200; seed++) {
        const p = makePuzzle(level, new Rng(seed)),
          rate = clearRate(p);
        expect(p.rows).toBe(planFor(level).rows);
        expect(solver(p)(fullMask(p.rows))).not.toBeNull();
        if (bandDistance(level, rate) === 0) inBand++;
        // The fallback keeps the closest candidate, never a deal far outside the band.
        expect(bandDistance(level, rate)).toBeLessThan(0.1);
      }
      // Measured: no round at three to seven rows ran out of its candidates.
      expect(inBand).toBeGreaterThanOrEqual(198);
    }
  });
  it('bands mean what the levels promise: level 1 cannot go wrong, levels 2 and 3 can', () => {
    for (let seed = 1; seed <= 60; seed++) {
      expect(clearRate(makePuzzle(1, new Rng(seed)))).toBeGreaterThanOrEqual(0.95);
      const two = clearRate(makePuzzle(2, new Rng(seed)));
      expect(two).toBeGreaterThanOrEqual(0.5);
      expect(two).toBeLessThan(0.95);
      const three = clearRate(makePuzzle(3, new Rng(seed)));
      expect(three).toBeGreaterThanOrEqual(0.4);
      expect(three).toBeLessThanOrEqual(0.8);
      const four = clearRate(makePuzzle(4, new Rng(seed)));
      expect(four).toBeGreaterThanOrEqual(0.3);
      expect(four).toBeLessThanOrEqual(0.75);
    }
    expect(CANDIDATES).toBe(40);
  });
  it('clearRate is exact on hand-made deals', () => {
    // One way to clear, one dead: [3,4] then kings clear; [3,5] strands the 7.
    expect(clearRate({ rows: 3, ranks: [13, 13, 13, 6, 7, 7] })).toBe(0);
    expect(clearRate({ rows: 1, ranks: [13] })).toBe(1);
    // The 6 pairs with either 7: lifting it with the left 7 opens the other 6 and clears; with the right 7 strands a 7.
    const p = { rows: 3, ranks: [13, 6, 13, 6, 7, 7] };
    expect(clearRate(p)).toBe(0.5);
    expect(clearRate(p, 0)).toBe(1);
  });
  it('level 1 is two pairs and two kings; levels 2-4 add at most one king by chance; a rank never passes a pack', () => {
    for (let level = 1; level <= 4; level++)
      for (let seed = 1; seed <= 200; seed++) {
        const c = dealCandidate(level, new Rng(seed)),
          kings = c.puzzle.ranks.filter((r) => r === 13).length;
        expect(kings).toBe(c.forcedKings + c.chanceKings);
        expect(c.chanceKings).toBeLessThanOrEqual(level === 1 ? 0 : 1);
        expect(c.puzzle.ranks[0]).toBe(13);
        if (level === 1) {
          expect(kings).toBe(2);
          expect(c.puzzle.ranks.filter((r) => r !== 13)).toHaveLength(4);
        }
        const p = makePuzzle(level, new Rng(seed));
        for (let r = 1; r <= 13; r++)
          expect(p.ranks.filter((x) => x === r).length).toBeLessThanOrEqual(PACK_LIMIT);
        if (level === 1) expect(p.ranks.filter((r) => r === 13)).toHaveLength(2);
      }
  });
  it('level 4 is six rows of 21 cards in one 21-bit mask, reaching at most 71 positions', () => {
    expect(planFor(4).rows).toBe(6);
    expect(fullMask(6)).toBe(2 ** 21 - 1);
    expect(planFor(9)).toBe(planFor(4));
    for (let seed = 1; seed <= 100; seed++) {
      const p = makePuzzle(4, new Rng(seed)),
        seen = new Set<number>();
      expect(p.ranks).toHaveLength(21);
      const walk = (mask: number) => {
        if (seen.has(mask)) return;
        seen.add(mask);
        for (const move of moves(p, mask)) walk(remove(mask, move));
      };
      walk(fullMask(6));
      expect(seen.size).toBeLessThanOrEqual(71);
    }
  });
});
