import { describe, expect, it } from 'vitest';
import { compress, expand, ROBOT_PLANS, runPath, shortestPath, slotOfStep } from './logic';

describe('robot routes', () => {
  it('makes every level solvable inside the program limit', () => {
    for (const plan of ROBOT_PLANS.filter((p) => !p.mode)) {
      const route = shortestPath(plan);
      expect(route.length, plan.name).toBeGreaterThan(0);
      expect(route.length, plan.name).toBeLessThanOrEqual(plan.limit);
      expect(runPath(plan, route).success, plan.name).toBe(true);
    }
  });
  it('stops at grid edges and rocks, and allows editing then retrying', () => {
    const plan = ROBOT_PLANS[3];
    expect(runPath(plan, ['left']).path).toEqual([[0, 0]]);
    expect(runPath(plan, ['right', 'down', 'right', 'down']).success).toBe(false);
    expect(runPath(plan, ['right', 'right', 'down', 'down']).success).toBe(true);
    expect(runPath(plan, []).success).toBe(false);
  });

  it('counted and looped levels need their idea: the plain route does not fit in the slots, the given solution does', () => {
    for (const plan of ROBOT_PLANS.filter((p) => p.mode)) {
      const { slots, loop } = plan.solution!;
      expect(slots.length, plan.name).toBeLessThanOrEqual(plan.limit);
      expect(runPath(plan, expand(slots, loop)).success, plan.name).toBe(true);
      const route = shortestPath(plan);
      expect(route.length).toBeGreaterThan(plan.limit);
      if (plan.mode === 'counts') expect(compress(route).length, plan.name).toBeLessThanOrEqual(plan.limit);
      // A loop level can't be done with counted slots alone.
      if (plan.mode === 'loop') expect(compress(route).length, plan.name).toBeGreaterThan(plan.limit);
      if (plan.mode === 'loop') expect(loop).toBeGreaterThan(1);
    }
  });

  it('expands counted slots and loops, and knows which slot each step comes from', () => {
    expect(expand([{ dir: 'right', n: 2 }, { dir: 'down', n: 1 }], 2)).toEqual(['right', 'right', 'down', 'right', 'right', 'down']);
    expect(slotOfStep([{ dir: 'right', n: 2 }, { dir: 'down', n: 1 }], 2)).toEqual([0, 0, 1, 0, 0, 1]);
    expect(compress(['up', 'up', 'left', 'up'])).toEqual([{ dir: 'up', n: 2 }, { dir: 'left', n: 1 }, { dir: 'up', n: 1 }]);
  });
});
