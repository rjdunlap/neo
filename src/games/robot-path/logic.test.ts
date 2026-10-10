import { describe, expect, it } from 'vitest';
import { compress, expand, nextPress, PREDICT_PLANS, predictionEnd, ROBOT_PLANS, runPath, shortestPath, slotOfStep, type Slot } from './logic';

describe('robot routes', () => {
  it('gives each shown prediction a distinct, reachable stop before the star', () => {
    expect(new Set(PREDICT_PLANS.map((plan) => plan.mode))).toEqual(new Set(['steps', 'counts']));
    for (const plan of PREDICT_PLANS) {
      const end = predictionEnd(plan);
      const withoutRocks = predictionEnd({ ...plan, rocks: [] });
      const readBackwards = predictionEnd({ ...plan, program: [...plan.program].reverse() });
      expect(end.every((n) => n >= 0 && n < plan.size), plan.name).toBe(true);
      expect(end).not.toEqual(plan.goal);
      expect(end).not.toEqual(withoutRocks);
      expect(end).not.toEqual(readBackwards);
    }
  });

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

describe('the buttons the ghost finger presses', () => {
  /** Press the way the game does (an arrow adds a step or one more of the last, the loop button counts 1 to 4) until play. */
  function playOut(plan: (typeof ROBOT_PLANS)[number], start: Slot[]) {
    const mode = plan.mode ?? 'steps';
    const solution = plan.solution?.slots ?? shortestPath(plan).map((dir) => ({ dir, n: 1 }));
    const wantLoop = plan.solution?.loop ?? 1;
    const program = start.map((s) => ({ ...s }));
    let loop = 1;
    for (let presses = 0; presses < 60; presses++) {
      const press = nextPress(solution, program, mode, loop, wantLoop);
      if ('play' in press) return runPath(plan, expand(program, loop)).success;
      if ('clear' in press) {
        program.length = 0;
        loop = 1;
      } else if ('loop' in press) loop = (loop % 4) + 1;
      else {
        const last = program[program.length - 1];
        if (mode !== 'steps' && last && last.dir === press.arrow && last.n < 5) last.n++;
        else {
          expect(program.length, plan.name).toBeLessThan(plan.limit);
          program.push({ dir: press.arrow, n: 1 });
        }
      }
    }
    return false;
  }

  it('reaches the star on every level, from nothing and after a wrong first step', () => {
    for (const plan of ROBOT_PLANS) {
      expect(playOut(plan, []), plan.name).toBe(true);
      const wrong = [{ dir: plan.goal[0] === 0 ? 'left' : 'up', n: 1 }] as Slot[];
      expect(playOut(plan, wrong), `${plan.name} (after a wrong step)`).toBe(true);
    }
  });
});
