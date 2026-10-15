import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import { DIRECTIONS, distances, footprint, key, makePuzzle, PLANS, roll, solutionStep, solved } from './logic';

describe('Log Roll', () => {
  it('provides seeded upright starts at each exact planned depth', () => {
    for (let level = 1; level <= 3; level++) for (let seed = 0; seed < 40; seed++) {
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
  it('keeps every explored move reversible and every hint one step closer', () => {
    const opposite = { up: 'down', down: 'up', left: 'right', right: 'left' } as const;
    for (const p of PLANS) for (const v of distances(p.floor).values()) {
      for (const d of DIRECTIONS) {
        const n = roll(v.state, d, p.floor);
        if (!n) continue;
        expect(footprint(n).every(([x, y]) => p.floor[y]?.[x] === '.')).toBe(true);
        expect(roll(n, opposite[d], p.floor)).toEqual(v.state);
        expect(solutionStep(n, p.floor)).not.toBeNull();
      }
      if (v.next) expect(solutionStep(roll(v.state, v.next, p.floor)!, p.floor)!.distance).toBe(v.distance - 1);
    }
  });
  it('uses the two-cell footprint, rejects edges and holes, and requires an upright finish', () => {
    const s = { x: 0, y: 0, pose: 'up' } as const;
    expect(roll(s, 'right', PLANS[0].floor)).toEqual({ x: 1, y: 0, pose: 'across' });
    expect(roll(s, 'left', PLANS[0].floor)).toBeNull();
    expect(roll({ x: 2, y: 0, pose: 'up' }, 'down', PLANS[1].floor)).toBeNull();
    expect(key(s)).toBe('0,0,up');
    expect(solved({ x: 3, y: 4, pose: 'across' }, PLANS[0].floor)).toBe(false);
  });
});
