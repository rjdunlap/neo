import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import {
  ALL_DEALS,
  CANDIDATES,
  LEVEL_DEALS,
  LastMove,
  MAJORITY,
  PERMS,
  VOTERS,
  ballotsOf,
  choiceOf,
  clean,
  count,
  countBallots,
  gridStep,
  makeRound,
  movers,
  pileFor,
  plurality,
  runoff,
  type Deal,
} from './logic';

const clear = ALL_DEALS.filter(clean);
const perms3 = (): number[][] => PERMS.map((p) => [...p]);

/** Independent run-off: try each candidate as the one dropped and keep the one whose dropping leaves a majority. */
function bruteWinner(deal: Deal): number {
  const winners = [0, 1, 2].flatMap((out) => {
    const c = count(deal, [out]);
    const w = c.findIndex((n) => n >= MAJORITY);
    return w >= 0 && c[out] === 0 && Math.min(...count(deal)) === count(deal)[out] ? [w] : [];
  });
  expect(winners.length).toBe(1);
  return winners[0];
}

describe('Count the Ballots deals', () => {
  it('enumerates the 2,002 deals of nine ballots', () => {
    expect(ALL_DEALS).toHaveLength(2002);
    for (const d of ALL_DEALS) expect(d.reduce((a, b) => a + b, 0)).toBe(VOTERS);
  });

  it('finds 360 clean deals, all 4-3-2, split 240 and 120', () => {
    expect(clear).toHaveLength(360);
    for (const d of clear) expect([...count(d)].sort()).toEqual([2, 3, 4]);
    expect(LEVEL_DEALS[1]).toHaveLength(240);
    expect(LEVEL_DEALS[2]).toHaveLength(120);
  });

  it('has one relabelling per ride order in each class (60 and 20 up to which ride is which)', () => {
    // Relabelling candidates by a permutation maps a deal to another deal of the same class: each class is closed
    // under the six relabellings, and none maps a deal to itself.
    for (const lv of [1, 2] as const) {
      const set = new Set(LEVEL_DEALS[lv].map((d) => d.join()));
      for (const d of LEVEL_DEALS[lv]) {
        const relabelled = new Set<string>();
        for (const p of perms3()) {
          const nd = Array(6).fill(0);
          d.forEach((n, i) => {
            const re = PERMS[i].map((c) => p[c]);
            nd[PERMS.findIndex((q) => q.join() === re.join())] += n;
          });
          expect(set.has(nd.join())).toBe(true);
          relabelled.add(nd.join());
        }
        expect(relabelled.size).toBe(6);
      }
    }
    expect(LEVEL_DEALS[1].length / 6).toBe(40);
    expect(LEVEL_DEALS[2].length / 6).toBe(20);
  });

  it('runs off with exactly one elimination that reaches a majority, matching a brute-force check', () => {
    for (const d of clear) {
      const r = runoff(d);
      expect(r.second[r.winner]).toBeGreaterThanOrEqual(MAJORITY);
      expect(r.second[r.out]).toBe(0);
      expect(r.winner).toBe(bruteWinner(d));
    }
  });

  it('agrees with the first count at level 1 and disagrees at level 2', () => {
    for (const d of LEVEL_DEALS[1]) expect(runoff(d).winner).toBe(plurality(d));
    for (const d of LEVEL_DEALS[2]) {
      expect(runoff(d).winner).not.toBe(plurality(d));
      expect(plurality(d)).not.toBe(runoff(d).out);
    }
  });

  it("pins the definition's two worked examples", () => {
    // wheel 0, carousel 1, boat swing 2. Level 2: 4 x carousel-boat-wheel, 2 x wheel-boat-carousel, 3 x boat-carousel-wheel.
    const two = [0, 2, 0, 0, 0, 0];
    two[PERMS.findIndex((p) => p.join() === '1,2,0')] = 4;
    two[PERMS.findIndex((p) => p.join() === '0,2,1')] = 2;
    two[PERMS.findIndex((p) => p.join() === '2,1,0')] = 3;
    expect(count(two)).toEqual([2, 4, 3]);
    expect(plurality(two)).toBe(1);
    expect(runoff(two)).toMatchObject({ out: 0, winner: 2 });
    expect(runoff(two).second).toEqual([0, 4, 5]);
  });
});

describe('Count the Ballots rounds', () => {
  it('deals nine permutation ballots of the right class over many seeds', () => {
    for (let seed = 1; seed <= 300; seed++) {
      for (const level of [1, 2]) {
        const r = makeRound(level, new Rng(seed));
        expect(r.hand).toHaveLength(VOTERS);
        for (const b of r.hand) expect([...b].sort()).toEqual([0, 1, 2]);
        expect(new Set(r.rides).size).toBe(CANDIDATES);
        expect(countBallots(r.hand, [])).toEqual(r.first);
        expect(Math.max(...r.first)).toBeLessThan(MAJORITY);
        expect(r.first[r.out]).toBe(Math.min(...r.first));
        expect(r.second[r.winner]).toBeGreaterThanOrEqual(MAJORITY);
        if (level === 1) expect(r.winner).toBe(r.plurality);
        else {
          expect(r.winner).not.toBe(r.plurality);
          expect(r.plurality).not.toBe(r.out);
        }
      }
    }
  });

  it('varies the hand, the rides and the deal by seed, and repeats for the same seed', () => {
    const a = makeRound(1, new Rng(5)),
      b = makeRound(1, new Rng(5));
    expect(a).toEqual(b);
    const seen = new Set(Array.from({ length: 40 }, (_, s) => JSON.stringify(makeRound(2, new Rng(s + 1)))));
    expect(seen.size).toBeGreaterThan(30);
  });

  it('routes each eliminated ballot to its next choice still in, never to the pile that is out', () => {
    for (let seed = 1; seed <= 200; seed++) {
      const r = makeRound(2, new Rng(seed));
      const ids = movers(r);
      expect(ids).toHaveLength(Math.min(...r.first));
      for (const i of ids) {
        const b = r.hand[i];
        const to = pileFor(b, r.out);
        expect(to).not.toBe(r.out);
        expect(to).toBe(b[1] === r.out ? b[2] : b[1]);
        expect(to).toBe(choiceOf(b, [r.out]));
      }
      // Every other ballot already sits in the pile it belongs in.
      r.hand.forEach((b, i) => {
        if (!ids.includes(i)) expect(pileFor(b, r.out)).toBe(pileFor(b, null));
      });
    }
  });

  it('counts a hand the same way as a deal', () => {
    for (const d of clear) expect(countBallots(ballotsOf(d), [])).toEqual(count(d));
  });
});

describe('the one-step Undo', () => {
  it('takes only the last ballot back, once, and forgets it after a count', () => {
    const placed: (number | null)[] = [null, null, null, null];
    const last = new LastMove();
    expect(last.undo(placed)).toBeNull();
    placed[1] = 2;
    last.record(1);
    placed[3] = 0;
    last.record(3);
    expect(last.undo(placed)).toBe(3);
    expect(placed).toEqual([null, 2, null, null]);
    expect(last.undo(placed), 'one step only').toBeNull();
    expect(placed[1]).toBe(2);
    last.record(1);
    last.clear();
    expect(last.undo(placed), 'a count clears it').toBeNull();
    expect(placed[1]).toBe(2);
  });
});

describe('arrow keys over the hand', () => {
  const free = Array.from({ length: VOTERS }, () => null);
  it('first lands on the first ballot in the hand, then walks the grid and stops at the edges', () => {
    expect(gridStep(free, null, 0)).toBe(0);
    expect(gridStep(free, 0, 0)).toBe(1);
    expect(gridStep(free, 1, 1)).toBe(4);
    expect(gridStep(free, 4, 2)).toBe(3);
    expect(gridStep(free, 3, 3)).toBe(0);
    expect(gridStep(free, 0, 3), 'up from the top row stays').toBe(0);
    expect(gridStep(free, 2, 0), 'right from the last column stays').toBe(2);
  });
  it('skips ballots already in a pile and returns null when the hand is empty', () => {
    const placed: (number | null)[] = free.map((_, i) => (i === 1 ? 0 : null));
    expect(gridStep(placed, 0, 0)).toBe(2);
    expect(gridStep(placed, null, 2)).toBe(0);
    expect(
      gridStep(
        placed.map(() => 1),
        null,
        0,
      ),
    ).toBeNull();
  });
});
