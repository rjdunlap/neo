import { parse, solve, type Harbor } from './logic';

/**
 * A challenge course: fixed harbors played in a row as one round, scored by the total number of slides (a boat slid any
 * distance along its lane is one slide). The harbors are frozen data picked from the game's own solver-checked list, so a
 * record always means the same puzzles; the fewest slides for each is worked out by the solver, never typed in. Change a
 * harbor and the version must change too, which starts a fresh record and keeps the old one.
 *
 * A harbor is a picture in letters: `f` is the ferry, every other letter a boat, `.` open water.
 */
export type HarborCourseId = 'harbors';

export interface Course {
  id: HarborCourseId;
  /** Bump when a harbor or a scoring rule changes: records compare only within a version. */
  version: number;
  name: string;
  blurb: string;
  harbors: readonly (readonly string[])[];
}

export const COURSES: Record<HarborCourseId, Course> = {
  harbors: {
    id: 'harbors',
    version: 1,
    name: 'Busy Harbors',
    blurb: 'Five harbors in a row, from a 5 by 5 to a crowded 6 by 6 with a long way to the dock. Get the ferry out in the fewest slides.',
    harbors: [
      ['....a', '.ffda', '...da', '..cbb', '..cee'],
      ['..d..', '..dbb', 'aacce', '.ff.e', '..ggg'],
      ['...aa.', 'dcc...', 'd.....', 'ffhge.', '.bhge.', '.bh.e.'],
      ['..a...', '..ag..', 'cc.gi.', 'ffegib', '.je.hb', '.jddh.'],
      ['..h.e.', 'ffh.e.', '....bb', 'gggd.a', 'ciid.a', 'c..d.a'],
    ],
  },
};

export const isHarborCourse = (v: unknown): v is HarborCourseId => v === 'harbors';

export interface CourseHarbor {
  harbor: Harbor;
  /** The fewest slides that bring the ferry to the dock, from the solver. */
  best: number;
}

const parsed = new Map<HarborCourseId, CourseHarbor[]>();
/** The harbors of a course, read once, each with its fewest slides. */
export function courseHarbors(id: HarborCourseId): CourseHarbor[] {
  let list = parsed.get(id);
  if (!list) {
    list = COURSES[id].harbors.map((rows) => {
      const harbor = parse(rows);
      return { harbor, best: solve(harbor)!.length };
    });
    parsed.set(id, list);
  }
  return list;
}

export const courseBest = (id: HarborCourseId): number[] => courseHarbors(id).map((h) => h.best);
/** The fewest slides for a whole course. */
export const courseMinimum = (id: HarborCourseId) => courseBest(id).reduce((n, b) => n + b, 0);
