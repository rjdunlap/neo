import { planFor, solverTries, type CodePlan } from './logic';

/**
 * A challenge course: fixed doors opened in a row as one round, scored by turns of the key. The codes are frozen data,
 * not generated, so a record always means the same doors. A code has no exact fewest tries (a lucky first try opens
 * any door), so par is a fixed reference solver's count (`solverTries`, the reasoning bot's `nextMove`) on each door,
 * worked out, never typed in (the October 23 rule). Beating par is possible; missing it fails nothing. Change a door
 * and the version must change too, which starts a fresh record and keeps the old one.
 *
 * Stones by index: 0 red, 1 blue, 2 yellow, 3 green, 4 purple.
 */
export type CodeCourseId = 'codedoors';

export interface CourseDoor {
  /** The ordinary level whose rules this door uses: 4 (three slots, five colors), 5 (four slots) or 6 (a repeat). */
  level: 4 | 5 | 6;
  code: readonly number[];
}

export interface Course {
  id: CodeCourseId;
  /** Bump when a door or a scoring rule changes: records compare only within a version. */
  version: number;
  name: string;
  blurb: string;
  doors: readonly CourseDoor[];
}

export const COURSES: Record<CodeCourseId, Course> = {
  codedoors: {
    id: 'codedoors',
    version: 1,
    name: 'The Code Doors',
    blurb:
      'Five locked doors in a row: three slots and five colors, then four slots, then a door whose code uses a color twice. Open every door in the fewest tries.',
    doors: [
      { level: 4, code: [3, 0, 4] },
      { level: 4, code: [4, 2, 1] },
      { level: 5, code: [2, 4, 0, 3] },
      { level: 5, code: [3, 4, 1, 0] },
      { level: 6, code: [3, 1, 3] },
    ],
  },
};

export const isCodeCourse = (v: unknown): v is CodeCourseId => v === 'codedoors';

/** The doors of a course with the plan each is played under. */
export const courseDoors = (id: CodeCourseId): { plan: CodePlan; code: number[] }[] =>
  COURSES[id].doors.map((d) => ({ plan: planFor(d.level), code: [...d.code] }));

/** The reference solver's tries on each door of a course: its par. */
export const courseBest = (id: CodeCourseId): number[] =>
  courseDoors(id).map((d) => solverTries(d.plan, d.code));
/** Par for a whole course. */
export const courseMinimum = (id: CodeCourseId) => courseBest(id).reduce((n, b) => n + b, 0);
