import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import { levelsInOrder, rangeFor } from '../../progress/difficulty';
import { POOLS } from './pools';
import {
  LEVELS,
  buried,
  countTheCopies,
  decodeDeal,
  lessonCard,
  oneWayIn,
  openings,
  rankWord,
  stranded,
  CANDIDATES,
  PACK_LIMIT,
  at,
  bandDistance,
  clearRate,
  columnOf,
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
    for (let level = 1; level <= 10; level++)
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
    for (let level = 1; level <= 8; level++) {
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
      // Measured: no round at levels 1-8 ran out of its candidates.
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
    expect(planFor(11)).toBe(planFor(10));
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
  it('levels 6-7 deal exactly as before the columns: the same ranks from the same seeds', () => {
    // FNV-1a over seeds 1-200's ranks, recorded from origin/main before level 8 (2026-11-13).
    const recorded = [303802877, 335546868];
    for (const level of [6, 7]) {
      let h = 2166136261;
      for (let seed = 1; seed <= 200; seed++) {
        const p = makePuzzle(level, new Rng(seed));
        expect(p.columns).toBeUndefined();
        for (const r of [...p.ranks, 0]) h = Math.imul(h ^ r, 16777619) >>> 0;
      }
      expect(h).toBe(recorded[level - 6]);
    }
  });
  it('level 8 is five rows and three columns of two, only a front card open, a real pack, at most 325 positions', () => {
    expect(planFor(8).rows).toBe(5);
    for (let seed = 1; seed <= 200; seed++) {
      const p = makePuzzle(8, new Rng(seed));
      expect(p.ranks).toHaveLength(21);
      expect(p.columns).toBe(3);
      expect(p.shelf).toBeUndefined();
      expect(p.lift).toBeUndefined();
      expect(startMask(p)).toBe(2 ** 21 - 1);
      // Back cards (15, 17, 19) lie under their front cards (16, 18, 20); the fronts are open at the start.
      expect(coverList(p).slice(15)).toEqual([[16], [], [18], [], [20], []]);
      for (const i of [15, 17, 19]) expect(exposed(p, startMask(p), i)).toBe(false);
      for (const i of [16, 18, 20]) expect(exposed(p, startMask(p), i)).toBe(true);
      expect(columnOf(p, 18)).toEqual({ column: 1, depth: 1 });
      expect(columnOf(p, 3)).toBeNull();
      for (let r = 1; r <= 13; r++)
        expect(p.ranks.filter((x) => x === r).length).toBeLessThanOrEqual(PACK_LIMIT);
      expect(bandDistance(8, clearRate(p))).toBe(0);
      expect(positions(p)).toBeLessThanOrEqual(325);
    }
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
  it('levels 1-8 deal exactly as before the lesson deals: the same ranks from the same seeds', () => {
    // FNV-1a over seeds 1-200's ranks, recorded from origin/main before levels 9-10 (2026-11-13).
    const recorded = [
      1654278629, 3490143395, 23608352, 313876289, 2613601815, 303802877, 335546868, 1058698212,
    ];
    for (let level = 1; level <= 8; level++) {
      let h = 2166136261;
      for (let seed = 1; seed <= 200; seed++)
        for (const r of [...makePuzzle(level, new Rng(seed)).ranks, 0]) h = Math.imul(h ^ r, 16777619) >>> 0;
      expect(h).toBe(recorded[level - 1]);
    }
  });
  it('places each lesson before the board that needs it: 9 after 2, 10 after 3', () => {
    const range = rangeFor(LEVELS, 'grownup');
    expect(levelsInOrder(range)).toEqual([1, 2, 9, 3, 10, 4, 5, 6, 7, 8]);
    expect(planFor(9).rows).toBe(4);
    expect(planFor(10).rows).toBe(5);
  });
  it('a stranded card has every partner left buried under it, so the position cannot clear', () => {
    // Hand-made three-row deals checking the definition.
    const p = decodeDeal(3, 'K2J3TJ');
    // Row 1: 2 (1) and J (2); row 2: 3 (3), T (4), J (5). The 2 at 1 lies on 0; nothing lies under a bottom card.
    expect([...buried(p, 4)].sort()).toEqual([0, 1, 2]);
    // The J at 5 buries the J at 2 and the K; the 2 at 1 is buried under 3 and 4, not under 5.
    expect(stranded(p, startMask(p))).toEqual([]);
    const q = decodeDeal(3, 'K2K9J4');
    // The J at 4 lies on both the 2 at 1 and the K at 2: its only partner is under it.
    expect(stranded(q, startMask(q))).toEqual([4]);
    expect(lessonCard(q, startMask(q))).toBe(4);
    expect(solver(q)(startMask(q))).toBeNull();
    expect(rankWord(1)).toBe('ace');
    expect(rankWord(11)).toBe('jack');
  });
  it('level 9 deals from a pool of 24 one-way-in deals: three or more opening pairs, exactly one safe, each loss named', () => {
    const pool = POOLS['one-way'];
    expect(pool.length).toBeGreaterThanOrEqual(24);
    expect(new Set(pool).size).toBe(pool.length);
    for (const deal of pool) {
      const p = decodeDeal(4, deal),
        start = startMask(p);
      expect(p.ranks).toHaveLength(10);
      expect(oneWayIn(p)).toBe(true);
      expect(solver(p)(start)).not.toBeNull();
      const { safe, losing } = openings(p);
      expect(safe).toHaveLength(1);
      expect(safe.length + losing.length).toBeGreaterThanOrEqual(3);
      expect(moves(p, start).every((m) => m.length === 2)).toBe(true);
      for (let rank = 1; rank <= 13; rank++)
        expect(p.ranks.filter((r) => r === rank).length).toBeLessThanOrEqual(PACK_LIMIT);
      for (const m of losing) {
        const after = remove(start, m),
          named = lessonCard(p, after)!;
        // The named card is present, not a king, and every partner left is buried under it: they can never meet.
        expect(present(after, named)).toBe(true);
        const partners = p.ranks.flatMap((r, i) =>
          r === 13 - p.ranks[named] && present(after, i) ? [i] : [],
        );
        expect(partners.length).toBeGreaterThan(0);
        expect(partners.every((i) => buried(p, named).has(i))).toBe(true);
        expect(solver(p)(after)).toBeNull();
      }
    }
    for (let seed = 1; seed <= 50; seed++)
      expect(pool).toContain(
        makePuzzle(9, new Rng(seed))
          .ranks.map((r) => 'A23456789TJQK'[r - 1])
          .join(''),
      );
  });
  it('level 10 deals from a pool of 24 count-the-copies deals: spending the easy pair loses and names the buried card', () => {
    const pool = POOLS.copies;
    expect(pool.length).toBeGreaterThanOrEqual(24);
    expect(new Set(pool).size).toBe(pool.length);
    for (const deal of pool) {
      const p = decodeDeal(5, deal),
        start = startMask(p),
        shape = countTheCopies(p)!;
      expect(p.ranks).toHaveLength(15);
      expect(shape).not.toBeNull();
      const { keep, spend, easy, buriedPartner } = shape,
        rank = p.ranks[keep];
      // Two open copies, two partners: one open, one buried under the copy to keep and not under the other.
      expect(p.ranks[spend]).toBe(rank);
      expect(p.ranks.filter((r) => r === rank)).toHaveLength(2);
      expect(p.ranks.filter((r) => r === 13 - rank)).toHaveLength(2);
      expect([keep, spend, easy].every((i) => exposed(p, start, i))).toBe(true);
      expect(exposed(p, start, buriedPartner)).toBe(false);
      expect(buried(p, keep).has(buriedPartner)).toBe(true);
      expect(buried(p, spend).has(buriedPartner)).toBe(false);
      // The losing pair is legal at the start, loses, and the lesson names the copy over the buried partner.
      expect(moves(p, start)).toContainEqual([Math.min(spend, easy), Math.max(spend, easy)]);
      const lose = remove(start, [spend, easy]);
      expect(solver(p)(lose)).toBeNull();
      expect(lessonCard(p, lose)).toBe(keep);
      expect(solver(p)(remove(start, [keep, easy]))).not.toBeNull();
      for (const m of openings(p).losing) expect(lessonCard(p, remove(start, m))).not.toBeNull();
      for (let r = 1; r <= 13; r++)
        expect(p.ranks.filter((x) => x === r).length).toBeLessThanOrEqual(PACK_LIMIT);
    }
  });
});
