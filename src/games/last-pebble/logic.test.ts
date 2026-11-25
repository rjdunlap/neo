import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import { hinted, missEvery, missOnRequest, newRequestTally, nextRequest, tally } from '../../progress/coach';
import {
  LEVELS,
  applyMove,
  bestChoice,
  bestMove,
  choiceLayout,
  goFirstWins,
  stoneSpots,
  streamLayout,
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
  it('supports school and grownup levels 1..4 with distinct descriptions', () => {
    expect(LEVELS).toEqual({ school: { min: 1, max: 4 }, grownup: { min: 1, max: 4 } });
    const all = [1, 2, 3, 4].map(describeLevel);
    for (const d of all) expect(d).toContain('about 10 and up');
    expect(new Set(all).size).toBe(4);
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

/** Exhaustive solve: does the player to move at `pos` win (reaching `target` wins) with takes `1..m`? */
function mover(pos: number, target: number, m: number, memo = new Map<number, boolean>()): boolean {
  if (pos >= target) return false; // the previous player already reached it
  const hit = memo.get(pos);
  if (hit !== undefined) return hit;
  let win = false;
  for (let d = 1; d <= m && pos + d <= target && !win; d++) {
    if (pos + d === target || !mover(pos + d, target, m, memo)) win = true;
  }
  memo.set(pos, win);
  return win;
}

describe('Last Pebble levels 3–4: who goes first, bigger steps', () => {
  it('goFirstWins and bestChoice agree with an exhaustive solve for T 6..16, m 2..4', () => {
    for (let m = 2; m <= 4; m++) {
      for (let target = 6; target <= 16; target++) {
        expect(goFirstWins(target, m), `T=${target} m=${m}`).toBe(mover(0, target, m));
        expect(bestChoice(target, m)).toBe(target % (m + 1) === 0 ? 'second' : 'first');
        expect(stoneSpots(target, m).every((s) => (target - s) % (m + 1) === 0)).toBe(true);
      }
    }
  });

  it('bestMove and petMove are optimal for takes 3 and 4', () => {
    for (const m of [3, 4]) {
      for (let target = 9; target <= 16; target++) {
        for (let pos = 0; pos < target; pos++) {
          const best = bestMove(pos, target, m);
          const pet = petMove(pos, target, 7, m);
          expect(pet).toBeGreaterThanOrEqual(1);
          expect(pet).toBeLessThanOrEqual(m);
          expect(pos + pet).toBeLessThanOrEqual(target);
          if (best !== null) {
            expect(pet).toBe(best);
            expect(mover(pos + best, target, m)).toBe(false);
          } else if (pos + 1 <= target) {
            expect(mover(pos, target, m)).toBe(false);
          }
        }
      }
    }
  });

  it('rounds show both answers and stay inside the pools', () => {
    for (let seed = 1; seed <= 40; seed++) {
      const r3 = makeRound(3, new Rng(seed));
      expect(r3.crossings).toHaveLength(3);
      expect(r3.crossings.every((c) => c.choose && c.maxTake === 2 && c.startPos === 0)).toBe(true);
      expect(r3.crossings.map((c) => c.target % 3).sort()).toEqual([0, 1, 2]);
      expect(new Set(r3.crossings.map((c) => c.target)).size).toBe(3);

      const r4 = makeRound(4, new Rng(seed));
      expect(r4.crossings).toHaveLength(2);
      expect(r4.crossings.map((c) => c.maxTake).sort()).toEqual([3, 4]);
      const answers = r4.crossings.map((c) => bestChoice(c.target, c.maxTake));
      expect(new Set(answers)).toEqual(new Set(['first', 'second']));
      for (const c of r4.crossings) {
        expect(c.target).toBeGreaterThanOrEqual(9);
        expect(c.target).toBeLessThanOrEqual(16);
      }
    }
  });

  it('every line where the pet reaches T has a turning point or a wrong pick', () => {
    for (const m of [2, 3, 4]) {
      for (let target = 6; target <= 16; target++) {
        for (const pick of ['first', 'second'] as const) {
          const right = bestChoice(target, m) === pick;
          const walk = (pos: number, moves: MoveRecord[], herTurn: boolean): void => {
            if (pos >= target) return;
            if (herTurn) {
              for (const d of legalMoves(pos, target, m)) {
                if (pos + d === target) continue;
                walk(pos + d, [...moves, { player: 'her', from: pos, to: pos + d }], false);
              }
              return;
            }
            const d = petMove(pos, target, 3, m);
            const next = [...moves, { player: 'pet' as const, from: pos, to: pos + d }];
            if (pos + d === target) {
              if (right) expect(turningPoint(next, target, m), `T=${target} m=${m}`).not.toBeNull();
              else expect(turningPoint(next, target, m)).toBeNull();
              return;
            }
            walk(pos + d, next, true);
          };
          walk(0, [], pick === 'first');
        }
      }
    }
  });

  it('a hint walk from the choice screen, always taking the best choice and move, wins', () => {
    for (const m of [2, 3, 4]) {
      for (let target = 6; target <= 16; target++) {
        let pos = 0;
        let herTurn = bestChoice(target, m) === 'first';
        for (let guard = 0; guard < 40 && pos < target; guard++) {
          if (herTurn) {
            const d = bestMove(pos, target, m);
            pos += d ?? legalMoves(pos, target, m)[0];
            if (pos === target) {
              expect(herTurn).toBe(true);
              break;
            }
          } else {
            pos += petMove(pos, target, 5, m);
            expect(pos).toBeLessThan(target);
          }
          herTurn = !herTurn;
        }
        expect(pos).toBe(target);
        expect(herTurn).toBe(true);
      }
    }
  });

  it('lays out four rows for T up to 16 and keeps the choice buttons at least 200 x 160', () => {
    const l = streamLayout({ w: 768, h: 1662, upright: true }, 16);
    expect(l.spots).toHaveLength(16);
    expect(l.board.h).toBe(4 * 128 + 3 * 44);
    const [a, b] = choiceLayout(l);
    for (const c of [a, b]) {
      expect(c.w).toBeGreaterThanOrEqual(200);
      expect(c.h).toBeGreaterThanOrEqual(160);
    }
    expect(a.x + a.w / 2).toBeLessThan(b.x - b.w / 2);
  });
});
