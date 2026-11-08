import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import { FLOORS } from './floors';
import {
  countsAsHint,
  DIRECTIONS,
  distances,
  floorsFor,
  footprint,
  goal,
  key,
  makePuzzle,
  mirror,
  PLANS,
  roll,
  solutionStep,
  solved,
  startsAt,
} from './logic';

const ALL = FLOORS.flatMap((pool, i) =>
  pool.flatMap((floor) => [floor, mirror(floor)].map((f) => ({ level: i + 1, floor: f }))),
);

describe('Log Roll', () => {
  it('provides seeded upright starts at each exact planned depth', () => {
    for (let level = 1; level <= 3; level++)
      for (let seed = 0; seed < 40; seed++) {
        const p = makePuzzle(level, new Rng(seed));
        expect(p).toEqual(makePuzzle(level, new Rng(seed)));
        expect(p.start.pose).toBe('up');
        let state = p.start;
        for (let left = p.plan.depth; left > 0; left--) {
          const hint = solutionStep(state, p.plan.floor)!;
          expect(hint.distance).toBe(left);
          state = roll(state, hint.next!, p.plan.floor)!;
        }
        expect(solved(state, p.plan.floor)).toBe(true);
      }
  });
  it('freezes four floors a level, the original first, of the level’s size, each with one hollow and two or more starts', () => {
    expect(FLOORS[0][0]).toEqual(['.....', '.....', '.....', '.....', '....G']);
    for (let level = 1; level <= 3; level++) {
      const pool = floorsFor(level),
        [w, h] = [pool[0][0].length, pool[0].length];
      expect(pool).toHaveLength(4);
      expect(new Set(pool.map((f) => f.join('/'))).size).toBe(4);
      for (const floor of pool) {
        expect(floor).toHaveLength(h);
        expect(floor.every((row) => row.length === w && /^[. G]+$/.test(row))).toBe(true);
        expect(floor.join('').split('G')).toHaveLength(2);
        expect(startsAt(floor, PLANS[level - 1].depth).length).toBeGreaterThanOrEqual(2);
        expect(startsAt(mirror(floor), PLANS[level - 1].depth)).toHaveLength(
          startsAt(floor, PLANS[level - 1].depth).length,
        );
      }
    }
    // Level 3 had two possible starts; its floors now give at least eight.
    expect(floorsFor(3).reduce((n, f) => n + startsAt(f, PLANS[2].depth).length, 0)).toBeGreaterThanOrEqual(
      8,
    );
  });
  it('reaches every floor and both mirrors across seeds, and the mirror moves the hollow', () => {
    for (let level = 1; level <= 3; level++) {
      const seen = new Set<string>();
      for (let seed = 0; seed < 200; seed++) seen.add(makePuzzle(level, new Rng(seed)).plan.floor.join('/'));
      expect(seen.size).toBe(8);
    }
    const f = FLOORS[0][0];
    expect(goal(f)).toEqual({ x: 4, y: 4, pose: 'up' });
    expect(goal(mirror(f))).toEqual({ x: 0, y: 4, pose: 'up' });
  });
  it('keeps every explored move reversible and every hint one step closer, on every floor and mirror', () => {
    const opposite = { up: 'down', down: 'up', left: 'right', right: 'left' } as const;
    for (const { floor } of ALL)
      for (const v of distances(floor).values()) {
        for (const d of DIRECTIONS) {
          const n = roll(v.state, d, floor);
          if (!n) continue;
          expect(footprint(n).every(([x, y]) => floor[y]?.[x] === '.' || floor[y]?.[x] === 'G')).toBe(true);
          expect(roll(n, opposite[d], floor)).toEqual(v.state);
          expect(solutionStep(n, floor)).not.toBeNull();
        }
        if (v.next) expect(solutionStep(roll(v.state, v.next, floor)!, floor)!.distance).toBe(v.distance - 1);
      }
  });
  it('uses the two-cell footprint, rejects edges and holes, and requires an upright finish', () => {
    const open = FLOORS[0][0],
      gaps = FLOORS[1][0];
    const s = { x: 0, y: 0, pose: 'up' } as const;
    expect(roll(s, 'right', open)).toEqual({ x: 1, y: 0, pose: 'across' });
    expect(roll(s, 'left', open)).toBeNull();
    expect(roll({ x: 2, y: 0, pose: 'up' }, 'down', gaps)).toBeNull();
    expect(key(s)).toBe('0,0,up');
    expect(solved({ x: 3, y: 4, pose: 'across' }, open)).toBe(false);
    expect(solved({ x: 4, y: 4, pose: 'up' }, open)).toBe(true);
  });
  it('counts a glowing hint once', () => {
    expect(countsAsHint(null, 'up')).toBe(true);
    expect(countsAsHint('up', 'up')).toBe(false);
    expect(countsAsHint('left', 'up')).toBe(true);
  });
});
