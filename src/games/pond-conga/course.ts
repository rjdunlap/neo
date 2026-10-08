import { parsePond, type Pond } from './logic';

/**
 * A challenge course: fixed ponds played in a row as one round, scored by the total number of steps (every move of the leader
 * counts, and so does every bonk). The ponds are frozen data, not generated, so a record always means the same ponds. The fewest
 * steps for each is worked out by the solver when a pond is read, and a pond that has no bonk-free route that short is refused,
 * never typed in. Change a pond and the version must change too, which starts a fresh record and keeps the old one.
 *
 * Legend: `S` the leader, `s` the ducklings behind it, `#` a lily pad, `.` open water, and 1 to 9, then a, b, c, the crumbs in order.
 */
export type CongaCourseId = 'conga';

export interface Course {
  id: CongaCourseId;
  /** Bump when a pond or a scoring rule changes: records compare only within a version. */
  version: number;
  name: string;
  blurb: string;
  /** Steps a second, the same all the way through. */
  speed: number;
  ponds: readonly (readonly string[])[];
}

export const COURSES: Record<CongaCourseId, Course> = {
  conga: {
    id: 'conga',
    version: 1,
    name: 'Crumb Trail',
    blurb: 'Four ponds in a row, from an open one to a crowded one. Follow the crumbs in order with as few steps as the way allows.',
    speed: 3,
    ponds: [
      ['....#1.....', '...#.......', '..#3......6', '.ssS.......', '........2..', '.......4...', '..........5'],
      ['.5...........', '#............', '......7...1..', '#..4#2.##....', '.ssS.........', '.....6.......', '...8..3...#..', '.............', '........##...'],
      ['.......#..#...#', '#6..#.....7....', '....#...#......', '...#...........', '.ssS.......#...', '4.#..a...1....8', '#.....#3.......', '....5..........', '.#........92...'],
      ['5...b.....#....', '.#..2..4....8##', '..........#....', '.#..#.9.##...#.', '.ssS....#..#...', '3...c..........', '..#.6..1....#..', '....a.#......7.', '#..........#...'],
    ],
  },
};

export const isCongaCourse = (v: unknown): v is CongaCourseId => v === 'conga';

const parsed = new Map<CongaCourseId, Pond[]>();
/** The ponds of a course, read once, each with its route. */
export function coursePonds(id: CongaCourseId): Pond[] {
  let ponds = parsed.get(id);
  if (!ponds) parsed.set(id, ponds = COURSES[id].ponds.map(parsePond));
  return ponds;
}

/** The fewest steps for each pond of a course. */
export const courseBest = (id: CongaCourseId): number[] => coursePonds(id).map((p) => p.par);
/** The fewest steps for a whole course. */
export const courseMinimum = (id: CongaCourseId) => courseBest(id).reduce((n, b) => n + b, 0);
