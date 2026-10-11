import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import { allowed, boardFor, compress, expand, FIX_PLANS, routePress, PREDICT_PLANS, predictionEnd, ROBOT_BOARDS, ROBOT_PLANS, runPath, shortestPath, slotOfStep, type Slot } from './logic';

describe('robot routes', () => {
  it('offers three distinct valid boards per level without changing the controls or budget', () => {
    expect(ROBOT_BOARDS).toHaveLength(10);
    for (const [i, boards] of ROBOT_BOARDS.entries()) {
      expect(boards).toHaveLength(3);
      expect(new Set(boards.map((p) => JSON.stringify([p.goal, p.rocks]))).size).toBe(3);
      for (const board of boards) {
        expect(board.size).toBe(ROBOT_PLANS[i].size);
        expect(board.limit).toBe(ROBOT_PLANS[i].limit);
        expect(board.mode).toBe(ROBOT_PLANS[i].mode);
        expect(allowed([0, 0], board)).toBe(true);
        expect(allowed(board.goal, board)).toBe(true);
        expect(board.goal).not.toEqual([0, 0]);
        expect(new Set(board.rocks.map((r) => r.join(','))).size).toBe(board.rocks.length);
        for (const rock of board.rocks) expect(rock.every((n) => n >= 0 && n < board.size)).toBe(true);
        if (i < 3) expect(board.rocks).toEqual([]);
        if (i === 0) expect(board.goal.includes(0)).toBe(true);
        if (i >= 3 && i <= 5) expect(board.rocks.length).toBeGreaterThan(0);
      }
      const firstMoves = boards.map((p) => p.solution?.slots[0].dir ?? shortestPath(p)[0]);
      // Rock-free turning boards allow either first move; obstacle boards vary the known route.
      if (i >= 3) expect(new Set(firstMoves).size, `level ${i + 1}`).toBeGreaterThan(1);
    }
  });

  it('draws reproducibly from the whole pool and leaves authored boards intact', () => {
    const before = JSON.stringify(ROBOT_BOARDS);
    for (let level = 1; level <= 10; level++) {
      const seen = new Set();
      for (let seed = 1; seed <= 100; seed++) {
        const board = boardFor(level, new Rng(seed));
        expect(board).toEqual(boardFor(level, new Rng(seed)));
        expect(ROBOT_BOARDS[level - 1]).toContain(board);
        seen.add(board);
      }
      expect(seen.size).toBe(3);
    }
    expect(JSON.stringify(ROBOT_BOARDS)).toBe(before);
  });

  it('gives each repair board one visible, single-slot fix', () => {
    expect(FIX_PLANS).toHaveLength(3);
    for (const plan of FIX_PLANS) {
      expect(runPath(plan, expand(plan.broken)).success, plan.name).toBe(false);
      expect(runPath(plan, expand(plan.solution.slots)).success, plan.name).toBe(true);
      expect(plan.broken).toHaveLength(plan.solution.slots.length);
      const successfulEdits: { slot: number; program: Slot[] }[] = [];
      for (let i = 0; i < plan.broken.length; i++) {
        for (const dir of ['up', 'right', 'down', 'left'] as const) {
          const program = plan.broken.map((s) => ({ ...s }));
          program[i].dir = dir;
          if (runPath(plan, expand(program)).success) successfulEdits.push({ slot: i, program });
        }
        for (const n of [plan.broken[i].n - 1, plan.broken[i].n + 1]) {
          if (n < 1 || n > 5) continue;
          const program = plan.broken.map((s) => ({ ...s }));
          program[i].n = n;
          if (runPath(plan, expand(program)).success) successfulEdits.push({ slot: i, program });
        }
      }
      expect(successfulEdits, plan.name).toEqual([{ slot: plan.fixSlot, program: plan.solution.slots }]);
      expect(plan.fixSlot).toBe(plan.solution.slots.length - 1);
    }
  });

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
    for (const plan of ROBOT_BOARDS.flat().filter((p) => !p.mode)) {
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
    for (const plan of ROBOT_BOARDS.flat().filter((p) => p.mode)) {
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
    const program = start.map((s) => ({ ...s }));
    let loop = 1;
    for (let presses = 0; presses < 60; presses++) {
      const press = routePress(plan, program, loop);
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
    for (const plan of ROBOT_BOARDS.flat()) {
      expect(playOut(plan, []), plan.name).toBe(true);
      const wrong = [{ dir: plan.goal[0] === 0 ? 'left' : 'up', n: 1 }] as Slot[];
      expect(playOut(plan, wrong), `${plan.name} (after a wrong step)`).toBe(true);
    }
  });
});

describe('feedback and alternative-route help', () => {
  it('distinguishes an empty program, a rock, an edge, a short run and arrival', () => {
    const plan = ROBOT_PLANS[3];
    expect(runPath(plan, []).stop).toBe('empty');
    expect(runPath(plan, ['left']).stop).toBe('bump');
    expect(runPath(plan, ['right', 'down']).stop).toBe('bump');
    expect(runPath(plan, ['right']).stop).toBe('short');
    expect(runPath(plan, ['right', 'right', 'down', 'down']).stop).toBe('goal');
  });

  it('keeps every prefix of every shortest route, including a route the default BFS did not choose', () => {
    let alternatives = 0;
    for (const plan of ROBOT_BOARDS.flat().filter(p => !p.mode)) {
      const length = shortestPath(plan).length;
      const visit = (route: import('./logic').Direction[]) => {
        const result = runPath(plan, route);
        if (result.stop === 'bump') return;
        if (result.success) {
          if (route.length !== length) return;
          if (route.join() !== shortestPath(plan).join()) alternatives++;
          for (let i = 0; i <= route.length; i++) {
            const prefix = route.slice(0, i).map(dir => ({ dir, n: 1 }));
            const press = routePress(plan, prefix, 1);
            expect('clear' in press, JSON.stringify([plan.goal, prefix])).toBe(false);
            if ('arrow' in press) {
              const continued = [...route.slice(0, i), press.arrow];
              const end = runPath(plan, continued);
              expect(end.stop).not.toBe('bump');
              const tail = shortestPath(plan, end.path[end.path.length - 1]);
              expect(continued.length + tail.length).toBe(length);
            } else expect(press).toEqual({ play: true });
          }
          return;
        }
        if (route.length < length) for (const dir of ['up', 'right', 'down', 'left'] as const) visit([...route, dir]);
      };
      visit([]);
    }
    expect(alternatives).toBeGreaterThan(0);
  });
});
