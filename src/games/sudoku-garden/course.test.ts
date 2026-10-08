import { describe, expect, it } from 'vitest';
import { COURSES, courseBeds, courseBest, courseMinimum, isBedCourse, type BedCourseId } from './course';
import { countSolutions, gradeOf, isSolved, techniqueSolve } from './logic';

const IDS: BedCourseId[] = ['beds', 'bigbeds'];

describe('the Sudoku Garden courses', () => {
  it('knows its ids', () => {
    for (const id of IDS) expect(isBedCourse(id)).toBe(true);
    expect(isBedCourse('ponds')).toBe(false);
    expect(Object.keys(COURSES).sort()).toEqual([...IDS].sort());
  });

  it('has beds with exactly one solution that the game can reach by working it out', () => {
    for (const id of IDS) courseBeds(id).forEach((bed, i) => {
      const label = `${id} bed ${i + 1}`;
      expect(countSolutions(bed.start, bed.size), label).toBe(1);
      expect(isSolved(bed.solution, bed.size), label).toBe(true);
      bed.start.forEach((d, c) => { if (d) expect(d, label).toBe(bed.solution[c]); });
      const work = techniqueSolve(bed.start, bed.size);
      expect(work.solved, label).toBe(true);
      expect(work.grid, label).toEqual(bed.solution);
      expect(gradeOf(bed.start, bed.size), label).toBe(bed.grade);
    });
  });

  it('climbs in difficulty, and the big beds are 9 by 9', () => {
    expect(courseBeds('beds').map((b) => b.size)).toEqual([6, 6, 6, 6, 6, 6]);
    expect(courseBeds('beds').map((b) => b.grade)).toEqual([1, 1, 1, 2, 2, 2]);
    const blanks = courseBeds('beds').map((b) => b.blanks);
    expect(blanks.slice(0, 3)).toEqual([...blanks.slice(0, 3)].sort((a, b) => a - b));
    expect(courseBeds('bigbeds').map((b) => b.size)).toEqual([9, 9, 9]);
    expect(courseBeds('bigbeds').map((b) => b.grade)).toEqual([1, 2, 3]);
  });

  it('has a par that is the number of empty squares, never a typed-in number', () => {
    for (const id of IDS) {
      expect(courseBest(id)).toEqual(courseBeds(id).map((b) => b.start.filter((d) => !d).length));
      expect(courseMinimum(id)).toBe(courseBest(id).reduce((n, b) => n + b, 0));
    }
    expect(courseMinimum('beds')).toBe(124);
    expect(courseMinimum('bigbeds')).toBe(149);
  });

  it('is frozen: no two beds the same, and a version to change when one does', () => {
    const all = IDS.flatMap((id) => COURSES[id].beds.map((b) => b.join('')));
    expect(new Set(all).size).toBe(all.length);
    for (const id of IDS) expect(COURSES[id].version).toBeGreaterThanOrEqual(1);
  });
});
