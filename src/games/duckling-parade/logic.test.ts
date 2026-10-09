import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import { arrive, canJoin, makeRound, needed, nextStop, PLANS, readyForPond, type DemoDuckling } from './logic';

const POND = { x: 800, y: 420 };

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

  it('leads Mama to a duckling that may join until the line is right, then to the pond, finishing every round at every level', () => {
    for (const plan of PLANS) {
      for (let seed = 1; seed <= 100; seed++) {
        const round = makeRound(plan, new Rng(seed));
        const ducks: DemoDuckling[] = round.ducklings.map((color, i) => ({ color, loose: true, x: 100 + i * 70, y: 300 + (i % 3) * 60 }));
        let line: DemoDuckling[] = [];
        let home = 0;
        let mama = { x: 60, y: 400 };
        for (let guard = 0; guard < 30; guard++) {
          const stop = nextStop(plan, round, line.map((d) => d.color), home, ducks, mama, POND);
          expect(stop, `${plan.name} seed ${seed}`).not.toBeNull();
          if (stop!.to === 'pond') {
            const { swimIn } = arrive(round, home, line.length);
            home += swimIn;
            line = [];
            if (home >= needed(plan, round)) break;
            continue;
          }
          const d = ducks[stop!.to === 'duckling' ? stop!.index : 0];
          // It is a duckling the line may take: never a wrong color, never out of pattern order.
          expect(canJoin(plan, round, line.map((x) => x.color), d.color)).toBe('join');
          d.loose = false;
          line.push(d);
          mama = { x: d.x, y: d.y };
        }
        expect(home, `${plan.name} seed ${seed}`).toBeGreaterThanOrEqual(needed(plan, round));
      }
    }
  });

  it('goes for the nearest duckling it may take, and waits when none may join', () => {
    const plan = PLANS[1];
    const round = makeRound(plan, new Rng(3));
    const near: DemoDuckling = { color: 'yellow', loose: true, x: 200, y: 400 };
    const far: DemoDuckling = { color: 'yellow', loose: true, x: 700, y: 400 };
    expect(nextStop(plan, round, [], 0, [far, near], { x: 150, y: 400 }, POND)).toMatchObject({ to: 'duckling', index: 1 });
    expect(nextStop(plan, round, [], 0, [{ ...near, loose: false }], { x: 150, y: 400 }, POND)).toBeNull();
  });

  it('leads her by a way that no wrong duckling sits on, so the demonstration is never a "not me", and taps when no way is clear', () => {
    const plan = PLANS.find((p) => p.mode === 'color')!;
    const round = { ducklings: ['yellow', 'blue'] as const, want: 'yellow' as const };
    const mama = { x: 100, y: 400 };
    const wanted: DemoDuckling = { color: 'yellow', loose: true, x: 500, y: 400 };
    const wrongOnTheWay: DemoDuckling = { color: 'blue', loose: true, x: 300, y: 420 };
    const wrongAside: DemoDuckling = { color: 'blue', loose: true, x: 300, y: 650 };
    expect(nextStop(plan, { ...round, ducklings: [...round.ducklings] }, [], 0, [wanted, wrongAside], mama, POND)).toMatchObject({ to: 'duckling', drag: true });
    expect(nextStop(plan, { ...round, ducklings: [...round.ducklings] }, [], 0, [wanted, wrongOnTheWay], mama, POND)).toMatchObject({ to: 'duckling', drag: false });
  });
});
