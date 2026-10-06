import { describe, expect, it } from 'vitest';
import { ROBOT_PLANS, runPath, shortestPath } from './logic';

describe('robot routes', () => {
  it('makes every level solvable inside the program limit', () => {
    for (const plan of ROBOT_PLANS) {
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
});
