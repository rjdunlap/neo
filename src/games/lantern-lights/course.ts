import { parsePond, type Pond } from './logic';

/**
 * A challenge course: fixed ponds played in a row as one round, scored by the total number of presses. The boards are
 * frozen data, not generated, so a record always means the same puzzles. The fewest presses for each is worked out by
 * the solver (`fewestPresses`), never typed in. Change a board and the version must change too, which starts a fresh
 * record and keeps the old one.
 *
 * Legend: `*` a lit lantern, `.` a dark one.
 */
export type LanternCourseId = 'lanterns';

export interface Course {
  id: LanternCourseId;
  /** Bump when a board or a scoring rule changes: records compare only within a version. */
  version: number;
  name: string;
  blurb: string;
  ponds: readonly (readonly string[])[];
}

export const COURSES: Record<LanternCourseId, Course> = {
  lanterns: {
    id: 'lanterns',
    version: 1,
    name: 'Dusk on the Pond',
    blurb: 'Five ponds of paper lanterns in a row, from a small one to a 5 by 5 that takes planning. Light every lantern with the fewest presses.',
    ponds: [
      ['..**', '*..*', '....', '*.*.'],
      ['*.***', '*..**', '.**.*', '**..*', '..**.'],
      ['.*...', '.**.*', '..*.*', '...*.', '..***'],
      ['***.*', '***..', '*.***', '..**.', '.*.*.'],
      ['****.', '.*.**', '*.*..', '..*..', '.*.*.'],
    ],
  },
};

export const isLanternCourse = (v: unknown): v is LanternCourseId => v === 'lanterns';

const parsed = new Map<LanternCourseId, Pond[]>();
/** The ponds of a course, read once. */
export function coursePonds(id: LanternCourseId): Pond[] {
  let ponds = parsed.get(id);
  if (!ponds) parsed.set(id, ponds = COURSES[id].ponds.map(parsePond));
  return ponds;
}

/** The fewest presses for each pond of a course. */
export const courseBest = (id: LanternCourseId): number[] => coursePonds(id).map((p) => p.par);
/** The fewest presses for a whole course. */
export const courseMinimum = (id: LanternCourseId) => courseBest(id).reduce((n, b) => n + b, 0);
