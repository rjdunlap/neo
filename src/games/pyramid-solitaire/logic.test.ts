import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import {
  CANDIDATES,
  PACK_LIMIT,
  at,
  bandDistance,
  clearRate,
  coverList,
  covers,
  dealCandidate,
  exposed,
  fullMask,
  liftable,
  makePuzzle,
  moves,
  planFor,
  present,
  remove,
  shelfStart,
  solver,
  startMask,
} from './logic';

/** Every position reachable from the full deal by legal removals. */
function positions(p: Parameters<typeof moves>[0]) {
  const seen = new Set<number>();
  const walk = (mask: number) => {
    if (seen.has(mask)) return;
    seen.add(mask);
    for (const move of moves(p, mask)) walk(remove(mask, move));
  };
  walk(startMask(p));
  return seen.size;
}

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
    for (let level = 1; level <= 7; level++)
      for (let seed = 1; seed <= 100; seed++) {
        const p = makePuzzle(level, new Rng(seed)),
          solve = solver(p);
        expect(p).toEqual(makePuzzle(level, new Rng(seed)));
        expect(p.ranks.every((r) => Number.isInteger(r) && r >= 1 && r <= 13)).toBe(true);
        let mask = startMask(p);
        const route = solve(mask)!;
        expect(route).not.toBeNull();
        for (const move of route) {
          // A cover lift's second card is the one its open partner alone still lies on (level 5 only).
          expect(
            exposed(p, mask, move[0]) &&
              (move.length === 1 ||
                exposed(p, mask, move[1]) ||
                (level === 5 && liftable(p, mask, move[0]).includes(move[1]))),
          ).toBe(true);
          expect(new Set(move).size).toBe(move.length);
          expect(move.reduce((n, i) => n + p.ranks[i], 0)).toBe(13);
          const before = mask;
          mask = remove(mask, move);
          expect(mask).not.toBe(before);
          expect(move.every((i) => !present(mask, i))).toBe(true);
        }
        expect(mask).toBe(0);
        for (const move of moves(p, startMask(p))) {
          const after = remove(startMask(p), move),
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
    for (let level = 1; level <= 7; level++) {
      let inBand = 0;
      for (let seed = 1; seed <= 200; seed++) {
        const p = makePuzzle(level, new Rng(seed)),
          rate = clearRate(p);
        expect(p.rows).toBe(planFor(level).rows);
        expect(solver(p)(startMask(p))).not.toBeNull();
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
      const five = clearRate(makePuzzle(5, new Rng(seed)));
      expect(five).toBeGreaterThanOrEqual(0.4);
      expect(five).toBeLessThanOrEqual(0.8);
      const six = clearRate(makePuzzle(6, new Rng(seed)));
      expect(six).toBeGreaterThanOrEqual(0.4);
      expect(six).toBeLessThanOrEqual(0.8);
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
    expect(planFor(9)).toBe(planFor(7));
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
  it('levels 1-4 never offer a cover lift; level 5 offers one only for the open card alone on it', () => {
    // Rows: [0] / [1, 2] / [3, 4, 5]. With 2-5 gone, the 7 at 1 alone lies on the 6 at the top.
    const strict = { rows: 3, ranks: [6, 7, 13, 13, 6, 13] };
    const mask = remove(fullMask(3), [2, 3, 4, 5]);
    expect(moves(strict, mask)).toEqual([]);
    const lift = { ...strict, lift: true as const };
    expect(liftable(lift, mask, 1)).toEqual([0]);
    expect(moves(lift, mask)).toEqual([[1, 0]]);
    expect(solver(lift)(mask)).toEqual([[1, 0]]);
    expect(solver(strict)(mask)).toBeNull();
    // With 2 still present the top has two covers: no lift.
    expect(liftable(lift, remove(fullMask(3), [3, 4]), 1)).toEqual([]);
    expect(moves(lift, remove(fullMask(3), [3, 4]))).toEqual([[5]]);
    for (const level of [1, 2, 3, 4, 6, 7])
      for (let seed = 1; seed <= 50; seed++) {
        const p = makePuzzle(level, new Rng(seed));
        expect(p.lift).toBeUndefined();
      }
  });
  it('level 5 is five rows where the top need not be a king and some deals need a lift on every route', () => {
    expect(planFor(5).rows).toBe(5);
    let notKing = 0,
      needLift = 0;
    for (let seed = 1; seed <= 200; seed++) {
      const p = makePuzzle(5, new Rng(seed));
      expect(p.lift).toBe(true);
      expect(p.ranks).toHaveLength(15);
      for (let r = 1; r <= 13; r++)
        expect(p.ranks.filter((x) => x === r).length).toBeLessThanOrEqual(PACK_LIMIT);
      if (p.ranks[0] !== 13) notKing++;
      if (!solver({ rows: p.rows, ranks: p.ranks })(fullMask(5))) needLift++;
      const seen = new Set<number>();
      const walk = (mask: number) => {
        if (seen.has(mask)) return;
        seen.add(mask);
        for (const move of moves(p, mask)) walk(remove(mask, move));
      };
      walk(fullMask(5));
      // Measured at most 30 over 300 seeds.
      expect(seen.size).toBeLessThanOrEqual(40);
    }
    expect(notKing).toBeGreaterThanOrEqual(200 / 3);
    expect(needLift).toBeGreaterThan(0);
  });
  it('levels 1-5 deal exactly as before the shelf: the same ranks from the same seeds', () => {
    // FNV-1a over seeds 1-200's ranks, recorded from origin/main before level 6 (2026-11-12).
    const recorded = [1654278629, 3490143395, 23608352, 313876289, 2613601815];
    for (let level = 1; level <= 5; level++) {
      let h = 2166136261;
      for (let seed = 1; seed <= 200; seed++) {
        const p = makePuzzle(level, new Rng(seed));
        expect(p.shelf).toBeUndefined();
        expect(startMask(p)).toBe(fullMask(p.rows));
        for (const r of [...p.ranks, 0]) h = Math.imul(h ^ r, 16777619) >>> 0;
      }
      expect(h).toBe(recorded[level - 1]);
    }
  });
  it('the cover list reproduces the pyramid rule card by card, and shelf cards lie under nothing', () => {
    for (let rows = 1; rows <= 6; rows++) {
      const p = { rows, ranks: Array<number>((rows * (rows + 1)) / 2).fill(1) };
      expect(coverList(p)).toEqual(p.ranks.map((_, i) => covers(rows, i)));
    }
    const shelf = makePuzzle(6, new Rng(3));
    expect(shelfStart(shelf)).toBe(15);
    expect(coverList(shelf).slice(15)).toEqual([[], [], [], [], []]);
    // No pyramid card lies on a shelf card, so every shelf card is open at the start.
    expect(
      coverList(shelf)
        .flat()
        .every((k) => k < 15),
    ).toBe(true);
    for (let i = 15; i < 20; i++) expect(exposed(shelf, startMask(shelf), i)).toBe(true);
  });
  it('level 6 is five rows and a shelf of five, from a real pack, reaching at most 483 positions', () => {
    expect(planFor(6).rows).toBe(5);
    let topWithShelf = 0;
    for (let seed = 1; seed <= 200; seed++) {
      const p = makePuzzle(6, new Rng(seed));
      expect(p.ranks).toHaveLength(20);
      expect(p.shelf).toBe(5);
      expect(startMask(p)).toBe(2 ** 20 - 1);
      for (let r = 1; r <= 13; r++)
        expect(p.ranks.filter((x) => x === r).length).toBeLessThanOrEqual(PACK_LIMIT);
      expect(positions(p)).toBeLessThanOrEqual(483);
      // The top card can leave with a spare: some clearing route pairs it with a shelf card.
      const route = solver(p)(startMask(p))!;
      if (route.some((m) => m.includes(0) && m.some((i) => i >= 15))) topWithShelf++;
    }
    expect(topWithShelf).toBeGreaterThan(0);
  });
  it('level 7 is the classic pyramid: seven rows of 28 cards in one 28-bit mask, strict rule, a real pack, at most 146 positions', () => {
    expect(planFor(7).rows).toBe(7);
    expect(fullMask(7)).toBe(2 ** 28 - 1);
    for (let seed = 1; seed <= 200; seed++) {
      const p = makePuzzle(7, new Rng(seed));
      expect(p.ranks).toHaveLength(28);
      expect(p.lift).toBeUndefined();
      expect(p.shelf).toBeUndefined();
      expect(startMask(p)).toBe(fullMask(7));
      for (let r = 1; r <= 13; r++)
        expect(p.ranks.filter((x) => x === r).length).toBeLessThanOrEqual(PACK_LIMIT);
      // No stock: the top card opens only when everything else has gone, so it is always a king.
      expect(p.ranks[0]).toBe(13);
      expect(positions(p)).toBeLessThanOrEqual(146);
    }
  });
});
