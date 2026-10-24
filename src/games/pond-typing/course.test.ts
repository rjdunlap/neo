import { describe, expect, it } from 'vitest';
import { COURSES, courseBest, courseMinimum, isTypingCourse } from './course';
import { PHRASES, WORDS } from './logic';

describe('typing course', () => {
  const course = COURSES.typing;
  it('courseBest is each pond character count; courseMinimum their sum', () => {
    expect(courseBest('typing')).toEqual(course.ponds.map((p) => p.reduce((n, b) => n + b.length, 0)));
    expect(courseBest('typing')).toEqual([8, 12, 18]);
    expect(courseMinimum('typing')).toBe(courseBest('typing').reduce((a, b) => a + b, 0));
  });
  it('every pond character is a-z or space', () => {
    for (const p of course.ponds) for (const b of p) expect(b).toMatch(/^[a-z ]+$/);
  });
  it('words and phrases come from the pools (single letters excepted)', () => {
    for (const b of course.ponds.flat()) {
      if (b.length === 1) continue;
      const pool = (b.includes(' ') ? PHRASES : WORDS) as readonly string[];
      expect(pool).toContain(b);
    }
  });
  it('isTypingCourse guards', () => {
    expect(isTypingCourse('typing')).toBe(true);
    expect(isTypingCourse('x')).toBe(false);
  });
});
