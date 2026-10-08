import { describe, expect, it } from 'vitest';
import { COURSES, courseBest, courseMinimum, courseSeas, isBridgeCourse } from './course';
import { isSolved, solve } from './logic';

describe('the Island Hopping course', () => {
  it('knows its id', () => {
    expect(isBridgeCourse('bridges')).toBe(true);
    expect(isBridgeCourse('beds')).toBe(false);
    expect(Object.keys(COURSES)).toEqual(['bridges']);
  });

  it('has seas with exactly one solution, every island between one and eight, climbing in size', () => {
    const seas = courseSeas('bridges');
    expect(seas).toHaveLength(5);
    seas.forEach((p, i) => {
      const label = `sea ${i + 1}`;
      expect(solve(p.layout, undefined, 3).found, label).toEqual([p.solution]);
      expect(isSolved(p.layout, p.solution), label).toBe(true);
      expect(p.layout.islands.every((il) => il.n >= 1 && il.n <= 8), label).toBe(true);
    });
    expect(seas.map((p) => p.size)).toEqual([7, 9, 9, 11, 11]);
    expect(seas.map((p) => p.layout.islands.length)).toEqual([8, 13, 18, 20, 22]);
  });

  it('has a par that is the planks of each answer, summed for the course', () => {
    expect(courseBest('bridges')).toEqual([11, 17, 27, 27, 38]);
    expect(courseMinimum('bridges')).toBe(120);
    expect(courseMinimum('bridges')).toBe(courseBest('bridges').reduce((n, b) => n + b, 0));
  });

  it('is frozen: no two seas the same, and a version to change when one does', () => {
    const all = COURSES.bridges.seas.map((s) => s.join(''));
    expect(new Set(all).size).toBe(all.length);
    expect(COURSES.bridges.version).toBeGreaterThanOrEqual(1);
  });
});
