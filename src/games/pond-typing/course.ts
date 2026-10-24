/**
 * The keyboard course the island opens for Pond Typing: three fixed ponds of bubbles, scored by the keys pressed (a wrong
 * key counts as well as a right one). The fewest for a pond is one key for each character. The ponds are frozen data, so a
 * record always means the same typing; change one and the version must change too.
 */
export type TypingCourseId = 'typing';

export interface Course {
  id: TypingCourseId;
  version: number;
  name: string;
  blurb: string;
  /** Each pond's bubbles, typed in order; ' ' is the space bar. */
  ponds: readonly (readonly string[])[];
}

export const COURSES: Record<TypingCourseId, Course> = {
  typing: {
    id: 'typing',
    version: 1,
    name: 'Bubble Pond',
    blurb: 'Three ponds of bubbles: single letters, then words, then two words with a space. Every bubble waits for its key.',
    ponds: [
      ['a', 'd', 'b', 'c', 'a', 'd', 'c', 'b'],
      ['duck', 'frog', 'pond'],
      ['wet duck', 'green frog'],
    ],
  },
};

export const isTypingCourse = (v: unknown): v is TypingCourseId => v === 'typing';
/** The fewest keys for each pond: one for each character. */
export const courseBest = (id: TypingCourseId): number[] => COURSES[id].ponds.map((p) => p.join('').length);
export const courseMinimum = (id: TypingCourseId) => courseBest(id).reduce((n, b) => n + b, 0);
