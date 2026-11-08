import { describe, expect, it } from 'vitest';
import { COURSES, courseBest, courseMinimum, courseSeas, isBridgeCourse } from './course';
import { bycounting, byreasoning, focusPath, isSolved, joinedByHints, solve } from './logic';

describe('the Island Hopping course', () => {
  it('knows its id', () => {
    expect(isBridgeCourse('bridges')).toBe(true);
    expect(isBridgeCourse('joined')).toBe(true);
    expect(isBridgeCourse('beds')).toBe(false);
    expect(Object.keys(COURSES)).toEqual(['bridges', 'joined']);
  });

  it('has seas with exactly one solution, every island between one and eight, climbing in size', () => {
    const seas = courseSeas('bridges');
    expect(seas).toHaveLength(5);
    seas.forEach((p, i) => {
      const label = `sea ${i + 1}`;
      expect(solve(p.layout, undefined, 3).found, label).toEqual([p.solution]);
      expect(isSolved(p.layout, p.solution), label).toBe(true);
      expect(
        p.layout.islands.every((il) => il.n >= 1 && il.n <= 8),
        label,
      ).toBe(true);
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

describe('the Joined Seas course', () => {
  it('has five 9 by 9 seas, each with exactly one solution, growing from 12 islands to 15', () => {
    const seas = courseSeas('joined');
    expect(seas).toHaveLength(5);
    seas.forEach((p, i) => {
      const label = `sea ${i + 1}`;
      expect(p.size, label).toBe(9);
      expect(solve(p.layout, undefined, 3).found, label).toEqual([p.solution]);
      expect(isSolved(p.layout, p.solution), label).toBe(true);
    });
    expect(seas.map((p) => p.layout.islands.length)).toEqual([12, 13, 14, 15, 15]);
  });

  it('is level 6 every time: counting alone stalls, keeping them joined finishes it, and the hints teach that', () => {
    courseSeas('joined').forEach((p, i) => {
      const label = `sea ${i + 1}`;
      expect(bycounting(p.layout), label).toBe(false);
      expect(byreasoning(p.layout), label).toBe(true);
      expect(joinedByHints(p.layout, p.solution), label).toBe(true);
    });
  });

  it('can be played on the stick: every island can be reached from the first', () => {
    courseSeas('joined').forEach((p, i) => {
      p.layout.islands.forEach((_, k) =>
        expect(focusPath(p.layout, 0, k), `sea ${i + 1}, island ${k}`).not.toBeNull(),
      );
    });
  });

  it('has a par that is the planks of each answer, and no sea from Island Hopping', () => {
    expect(courseBest('joined')).toEqual([12, 15, 16, 17, 24]);
    expect(courseMinimum('joined')).toBe(84);
    const all = [...COURSES.bridges.seas, ...COURSES.joined.seas].map((s) => s.join(''));
    expect(new Set(all).size).toBe(all.length);
    expect(COURSES.joined.version).toBeGreaterThanOrEqual(1);
  });
});
