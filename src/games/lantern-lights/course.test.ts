import { describe, expect, it } from 'vitest';
import { COURSES, courseBest, courseMinimum, coursePonds, isLanternCourse } from './course';
import { allLit, fewestPresses, pressAll, solve } from './logic';

describe('the Lantern Lights course', () => {
  it('knows its id', () => {
    expect(isLanternCourse('lanterns')).toBe(true);
    expect(isLanternCourse('beds')).toBe(false);
    expect(Object.keys(COURSES)).toEqual(['lanterns']);
  });

  it('has ponds that can be lit, none already lit, and each with a worked-out fewest', () => {
    const ponds = coursePonds('lanterns');
    expect(ponds).toHaveLength(5);
    ponds.forEach((p, i) => {
      const label = `pond ${i + 1}`;
      expect(allLit(p.board), label).toBe(false);
      const s = solve(p.board, p.size)!;
      expect(s, label).not.toBeNull();
      expect(s.weight, label).toBe(p.par);
      expect(fewestPresses(p.board, p.size), label).toBe(p.par);
      for (const cells of s.best) expect(allLit(pressAll(p.board, p.size, cells)), label).toBe(true);
    });
  });

  it('climbs, from a small pond to a 5 by 5 that takes planning', () => {
    const ponds = coursePonds('lanterns');
    expect(ponds.map((p) => p.size)).toEqual([4, 5, 5, 5, 5]);
    expect(courseBest('lanterns')).toEqual([4, 5, 7, 9, 11]);
    expect(courseBest('lanterns').slice(1)).toEqual([...courseBest('lanterns').slice(1)].sort((a, b) => a - b));
  });

  it('has a par that is worked out by the solver and summed for the course', () => {
    expect(courseMinimum('lanterns')).toBe(36);
    expect(courseMinimum('lanterns')).toBe(courseBest('lanterns').reduce((n, b) => n + b, 0));
  });

  it('is frozen: no two ponds the same, and a version to change when one does', () => {
    const all = COURSES.lanterns.ponds.map((p) => p.join(''));
    expect(new Set(all).size).toBe(all.length);
    expect(COURSES.lanterns.version).toBeGreaterThanOrEqual(1);
  });
});
