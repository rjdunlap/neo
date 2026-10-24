import { describe, expect, it } from 'vitest';
import { COURSES, courseBest, courseMinimum, isTypingCourse } from './course';
import { LINES, PHRASES, WORDS } from './logic';

describe('typing course', () => {
  const course = COURSES.typing;
  it('courseBest is each pond character count; courseMinimum their sum', () => {
    expect(courseBest('typing')).toEqual(course.ponds.map((p, i) => course.levels[i] === 6 ? p.length : p.reduce((n, b) => n + b.length, 0)));
    expect(courseBest('typing')).toEqual([8, 12, 18, 10, 14, 1]);
    expect(courseMinimum('typing')).toBe(courseBest('typing').reduce((a, b) => a + b, 0));
  });
  it('every pond character is letters, space or a stop', () => {
    for (const p of course.ponds) for (const b of p) expect(b).toMatch(/^[a-zA-Z .]+$/);
  });
  it('words and phrases come from the pools (single letters excepted)', () => {
    for (const b of course.ponds.slice(0, 3).flat()) {
      if (b.length === 1) continue;
      const pool = (b.includes(' ') ? PHRASES : WORDS) as readonly string[];
      expect(pool).toContain(b);
    }
  });
  it('versioned course reaches each new interaction using reviewed lines', () => {
    expect(course.version).toBe(2);
    expect(course.levels).toEqual([1, 3, 3, 4, 5, 6]);
    for (const p of course.ponds.slice(4)) for (const line of p) expect(LINES).toContain(line);
  });
  it('isTypingCourse guards', () => {
    expect(isTypingCourse('typing')).toBe(true);
    expect(isTypingCourse('x')).toBe(false);
  });
});
