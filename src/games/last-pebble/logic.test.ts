import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import { hinted, missEvery, missOnRequest, newRequestTally, nextRequest, tally } from '../../progress/coach';
import {
  LEVELS,
  applyMove,
  bestMove,
  describeLevel,
  hintSpot,
  isSteppingStone,
  legalMoves,
  level1Reply,
  makeCrossing,
  makeRound,
  petMove,
  steppingStones,
  turningPoint,
  turningPointIndex,
  type MoveRecord,
} from './logic';

describe('Last Pebble Nim model', () => {
  it('computes steppingStones, isSteppingStone, and unique bestMove for T = 6..12', () => {
    expect(steppingStones(10)).toEqual([1, 4, 7, 10]);
    expect(steppingStones(11)).toEqual([2, 5, 8, 11]);
    expect(steppingStones(7)).toEqual([1, 4, 7]);
    expect(steppingStones(8)).toEqual([2, 5, 8]);

    for (let target = 6; target <= 12; target++) {
      const stones = steppingStones(target);
      expect(stones.at(-1)).toBe(target);
      for (let pos = 0; pos <= target; pos++) {
        const stone = isSteppingStone(pos, target);
        expect(stones.includes(pos)).toBe(pos > 0 && stone);
        const best = bestMove(pos, target);
        if (pos === target || stone) {
          expect(best).toBeNull();
          if (pos < target) {
            for (const d of legalMoves(pos, target)) {
              expect(isSteppingStone(pos + d, target)).toBe(false);
            }
          }
        } else {
          expect(best === 1 || best === 2).toBe(true);
          expect(pos + best!).toBeLessThanOrEqual(target);
          expect(isSteppingStone(pos + best!, target)).toBe(true);
          // Uniqueness: the other legal move (if any) never lands on a stepping stone
          for (const d of legalMoves(pos, target)) {
            if (d !== best) expect(isSteppingStone(pos + d, target)).toBe(false);
          }
        }
      }
    }
  });

  it('plays optimally from non-stepping stones and varies deterministically on stepping stones', () => {
    for (let target = 6; target <= 12; target++) {
      for (let pos = 0; pos < target; pos++) {
        const best = bestMove(pos, target);
        if (best !== null) {
          for (const seed of [1, 2, 7, 42]) {
            expect(petMove(pos, target, seed)).toBe(best);
          }
        } else {
          const seen = new Set<number>();
          for (let seed = 0; seed < 20; seed++) {
            const d = petMove(pos, target, seed);
            expect(legalMoves(pos, target)).toContain(d);
            expect(petMove(pos, target, seed)).toBe(d);
            seen.add(d);
          }
          if (legalMoves(pos, target).length === 2) {
            expect(seen.size).toBe(2);
          }
        }
      }
    }
  });

  it('always has a valid turningPoint whenever the pet reaches T across level 1 and level 2 crossings', () => {
    const cases: { target: number; startPos: number }[] = [
      { target: 6, startPos: 4 },
      { target: 7, startPos: 5 },
      { target: 7, startPos: 3 },
      { target: 8, startPos: 4 },
      { target: 8, startPos: 3 },
      { target: 9, startPos: 4 },
      { target: 7, startPos: 0 },
      { target: 8, startPos: 0 },
      { target: 10, startPos: 0 },
      { target: 11, startPos: 0 },
    ];

    function exploreAllLines(target: number, pos: number, moves: MoveRecord[], seed: number): void {
      if (pos >= target) return;
      for (const herDelta of legalMoves(pos, target)) {
        const afterHer = pos + herDelta;
        const nextMoves = [...moves, { player: 'her' as const, from: pos, to: afterHer }];
        if (afterHer === target) continue; // she reached T
        const petDelta = petMove(afterHer, target, seed);
        const afterPet = afterHer + petDelta;
        const withPet = [...nextMoves, { player: 'pet' as const, from: afterHer, to: afterPet }];
        if (afterPet === target) {
          const tp = turningPoint(withPet, target);
          const idx = turningPointIndex(withPet, target);
          expect(tp).not.toBeNull();
          expect(idx).toBeGreaterThanOrEqual(0);
          expect(bestMove(tp!.from, target)).not.toBeNull();
          expect(isSteppingStone(tp!.to, target)).toBe(false);
        } else {
          exploreAllLines(target, afterPet, withPet, seed);
        }
      }
    }

    for (const { target, startPos } of cases) {
      expect(isSteppingStone(startPos, target)).toBe(false);
      for (const seed of [1, 2, 13, 99]) {
        exploreAllLines(target, startPos, [], seed);
      }
    }
  });

  it('guarantees hint walks (with rewind from losing positions) reach T and win from every reachable state', () => {
    function walkWithHints(
      target: number,
      pos: number,
      moves: MoveRecord[],
      seed: number,
      steps = 0,
    ): 'her-won' {
      expect(steps).toBeLessThan(30);
      const h = hintSpot(pos, target);
      if (h === null) {
        const tp = turningPoint(moves, target);
        expect(tp).not.toBeNull();
        const idx = turningPointIndex(moves, target);
        const rewoundPos = tp!.from;
        const rewoundMoves = moves.slice(0, idx);
        const recovered = hintSpot(rewoundPos, target);
        expect(recovered).not.toBeNull();
        return walkWithHints(target, rewoundPos, rewoundMoves, seed, steps + 1);
      }
      const nextPos = h;
      const nextMoves = [...moves, { player: 'her' as const, from: pos, to: nextPos }];
      if (nextPos === target) return 'her-won';
      const p = petMove(nextPos, target, seed);
      const afterPet = nextPos + p;
      expect(afterPet).toBeLessThan(target);
      return walkWithHints(
        target,
        afterPet,
        [...nextMoves, { player: 'pet' as const, from: nextPos, to: afterPet }],
        seed,
        steps + 1,
      );
    }

    const targets = [7, 8, 10, 11];
    for (const target of targets) {
      for (const seed of [1, 2, 17, 64]) {
        // Test starting directly and also after an arbitrary bad first move
        expect(walkWithHints(target, 0, [], seed)).toBe('her-won');
        for (const d of legalMoves(0, target)) {
          if (d !== bestMove(0, target)) {
            const m1: MoveRecord = { player: 'her', from: 0, to: d };
            const p1 = petMove(d, target, seed);
            const afterPet = d + p1;
            if (afterPet < target) {
              const m2: MoveRecord = { player: 'pet', from: d, to: afterPet };
              expect(walkWithHints(target, afterPet, [m1, m2], seed)).toBe('her-won');
            }
          }
        }
      }
    }
  });
});

describe('Last Pebble rounds, replies and coach accounting', () => {
  it('supports school and grownup levels 1..2 with distinct descriptions', () => {
    expect(LEVELS).toEqual({ school: { min: 1, max: 2 }, grownup: { min: 1, max: 2 } });
    expect(describeLevel(1)).toContain('about 10 and up');
    expect(describeLevel(2)).toContain('about 10 and up');
    expect(describeLevel(1)).not.toBe(describeLevel(2));
  });

  it('generates level 1 crossings (rem = 2, 4, 5) and level 2 streams (T in {7, 8, 10, 11})', () => {
    for (let s = 1; s <= 12; s++) {
      const r1 = makeRound(1, new Rng(s));
      expect(r1.crossings.length).toBe(3);
      expect(r1.crossings[0].target - r1.crossings[0].startPos).toBe(2);
      expect(r1.crossings[1].target - r1.crossings[1].startPos).toBe(4);
      expect(r1.crossings[2].target - r1.crossings[2].startPos).toBe(5);
      expect([6, 7]).toContain(r1.crossings[0].target);
      expect([7, 8]).toContain(r1.crossings[1].target);
      expect([8, 9]).toContain(r1.crossings[2].target);

      const c = makeCrossing(r1.crossings[1].target, r1.crossings[1].startPos);
      expect(c.stones[r1.crossings[1].startPos - 1]).toBe('pet');
      expect(c.stones[r1.crossings[1].startPos]).toBeNull();

      const r2 = makeRound(2, new Rng(s));
      expect(r2.crossings.length).toBe(1);
      expect(r2.crossings[0].startPos).toBe(0);
      expect([7, 8, 10, 11]).toContain(r2.crossings[0].target);
      expect(r2.crossings[0].target % 3).not.toBe(0);
    }
  });

  it('returns the exact level 1 show-me-why reply and preserves T - 3 progress on late misses', () => {
    expect(level1Reply(5, 6)).toEqual({ move: 1, voice: 'lp.could-reach', highlightSpot: 6 });
    expect(level1Reply(5, 7)).toEqual({ move: 2, voice: 'lp.leave-three', highlightSpot: 7 });
    expect(level1Reply(5, 9)).toEqual({ move: 1, voice: 'lp.took-stone', highlightSpot: 6 });

    // On Crossing 3 (T = 9, startPos = 4), she hits T - 3 = 6, pet plays +1 to 7, she taps +1 to 8:
    const s0 = makeCrossing(9, 4);
    const r1 = applyMove(s0, 'her', 2); // 4 -> 6 (T - 3)
    const r2 = applyMove(r1.state, 'pet', 1); // 6 -> 7
    const r3 = applyMove(r2.state, 'her', 1); // 7 -> 8 (wrong!)
    const r4 = applyMove(r3.state, 'pet', 1); // 8 -> 9 (pet reaches bank)
    const tp = turningPoint([r1.record, r2.record, r3.record, r4.record], 9);
    expect(tp?.from).toBe(7); // rewinds only to T - 2 = 7, keeping T - 3 = 6!
  });

  it('counts level 1 per-crossing misses/hints and level 2 per-round misses/hints accurately', () => {
    const t1 = newRequestTally();
    expect(missOnRequest(t1)).toBe(false);
    expect(missOnRequest(t1)).toBe(true);
    hinted(t1);
    expect(missOnRequest(t1)).toBe(false); // capped at 1 miss-triggered hint per crossing
    nextRequest(t1);
    expect(missOnRequest(t1)).toBe(false);
    expect(missOnRequest(t1)).toBe(true);
    hinted(t1);
    expect(tally(t1)).toEqual({ misses: 5, hints: 2 });

    const t2 = newRequestTally();
    expect(missEvery(t2)).toBe(false);
    expect(missEvery(t2)).toBe(true);
    hinted(t2);
    expect(missEvery(t2)).toBe(false);
    expect(missEvery(t2)).toBe(true);
    hinted(t2);
    expect(tally(t2)).toEqual({ misses: 4, hints: 2 });
  });
});
