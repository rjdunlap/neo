import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import { arrive, canJoin, makeRound, needed, PLANS, readyForPond } from './logic';

describe('Duckling Parade', () => {
  it('always has enough of the right ducklings to finish', () => {
    for (const plan of PLANS) {
      for (let seed = 1; seed <= 300; seed++) {
        const round = makeRound(plan, new Rng(seed));
        expect(round.ducklings).toHaveLength(plan.ducklings);
        expect(new Set(round.ducklings).size, plan.name).toBe(plan.colors);
        const joinable = round.ducklings.filter((c) => canJoin(plan, round, [], c) === 'join' || plan.mode === 'pattern').length;
        expect(joinable, plan.name).toBeGreaterThanOrEqual(needed(plan, round));
        if (plan.mode === 'colorCount') expect(round.ducklings.filter((c) => c === round.want).length).toBeGreaterThan(round.target!);
        if (round.target !== undefined) expect(round.target).toBeGreaterThanOrEqual(plan.min!);
      }
    }
  });

  it('builds a pattern line only in order, and sends it home only when complete', () => {
    const plan = PLANS.find((p) => p.mode === 'pattern' && p.unit === 3)!;
    const round = makeRound(plan, new Rng(4));
    const [a, b, c] = round.pattern!;
    expect(new Set([a, b, c]).size).toBe(3);
    expect(canJoin(plan, round, [], b)).toBe('wrong-next');
    expect(canJoin(plan, round, [a], b)).toBe('join');
    expect(canJoin(plan, round, [a, b], a)).toBe('wrong-next');
    expect(readyForPond(plan, round, 3)).toBe(false);
    expect(readyForPond(plan, round, round.pattern!.length)).toBe(true);
    // Sorting the meadow back into order reproduces the pattern.
    expect([...round.ducklings].sort()).toEqual([...round.pattern!].sort());
  });

  it('turns away other colors, and sends extras back out of the pond', () => {
    const plan = PLANS.find((p) => p.mode === 'colorCount')!;
    const round = makeRound(plan, new Rng(9));
    const other = round.ducklings.find((c) => c !== round.want)!;
    expect(canJoin(plan, round, [], other)).toBe('wrong-color');
    const n = round.target!;
    expect(arrive(round, 0, n + 1)).toEqual({ swimIn: n, extra: 1 });
    expect(arrive(round, n - 1, 1)).toEqual({ swimIn: 1, extra: 0 });
    expect(arrive(makeRound(PLANS[1], new Rng(1)), 0, 4)).toEqual({ swimIn: 4, extra: 0 });
  });
});
