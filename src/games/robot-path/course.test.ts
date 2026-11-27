import { describe, expect, it } from 'vitest';
import { COURSES, courseBest, courseBoards, courseMinimum, isRobotCourse, parseBoard } from './course';
import { expand, routePress, runPath, shortestPath, type Slot } from './logic';

describe('Robot Path courses', () => {
  it('keeps The Star Mazes frozen: five boards and their fewest steps, worked out by the solver', () => {
    expect(isRobotCourse('robotpath')).toBe(true);
    expect(isRobotCourse('sunbeams')).toBe(false);
    expect(COURSES.robotpath.version).toBe(1);
    expect(courseBest('robotpath')).toEqual([6, 7, 9, 14, 15]);
    expect(courseMinimum('robotpath')).toBe(51);
  });

  it('builds valid step and counted boards whose solutions reach the star in the fewest steps', () => {
    const boards = courseBoards('robotpath');
    expect(boards.some((b) => b.mode === 'steps')).toBe(true);
    expect(boards.some((b) => b.mode === 'counts')).toBe(true);
    boards.forEach((plan, i) => {
      const best = shortestPath(plan);
      const sol = plan.solution!;
      expect(sol.loop).toBe(1);
      expect(sol.slots.length).toBeLessThanOrEqual(plan.limit);
      expect(sol.slots.every((s) => s.n >= 1 && s.n <= 5)).toBe(true);
      const steps = expand(sol.slots);
      expect(steps.length).toBe(courseBest('robotpath')[i]);
      expect(steps.length).toBe(best.length);
      expect(runPath(plan, steps).success).toBe(true);
    });
  });

  it('has hints that lead straight to the shortest path from empty or off-route programs', () => {
    for (const plan of courseBoards('robotpath')) {
      const program: Slot[] = [];
      let guard = 0;
      while (guard++ < 40) {
        const press = routePress(plan, program, 1);
        if ('play' in press) break;
        if ('clear' in press) program.length = 0;
        else if ('arrow' in press) {
          const last = program[program.length - 1];
          if (plan.mode === 'counts' && last && last.dir === press.arrow && last.n < 5) last.n++;
          else program.push({ dir: press.arrow, n: 1 });
        }
      }
      expect(guard).toBeLessThan(40);
      expect(expand(program).length).toBe(shortestPath(plan).length);
      expect(runPath(plan, expand(program)).success).toBe(true);
    }
  });

  it('rejects malformed, unreachable or over-limit boards', () => {
    expect(() => parseBoard({ mode: 'steps', limit: 8, rows: ['R..', '..*'] })).toThrow();
    expect(() => parseBoard({ mode: 'steps', limit: 8, rows: ['.R.', '...', '..*'] })).toThrow();
    expect(() => parseBoard({ mode: 'steps', limit: 8, rows: ['R#.', '#..', '..*'] })).toThrow();
    expect(() => parseBoard({ mode: 'steps', limit: 3, rows: ['R..', '...', '..*'] })).toThrow();
    expect(() => parseBoard({ mode: 'steps', limit: 8, rows: ['R..', '.z.', '..*'] })).toThrow();
  });
});
