import { parsePuzzle, type Puzzle } from './logic';

/**
 * A challenge course: fixed seas played in a row as one round, scored by the planks laid. The puzzles are frozen data, not
 * generated, so a record always means the same puzzles. Each has exactly one solution, and its par is the planks in it: one
 * for every plank of the answer, with nothing taken off again. Change a puzzle and the version must change too, which starts a
 * fresh record and keeps the old one.
 *
 * Legend: a digit is an island with that many planks to take, `.` is open water.
 */
export type BridgeCourseId = 'bridges';

export interface Course {
  id: BridgeCourseId;
  /** Bump when a puzzle or a scoring rule changes: records compare only within a version. */
  version: number;
  name: string;
  blurb: string;
  seas: readonly (readonly string[])[];
}

export const COURSES: Record<BridgeCourseId, Course> = {
  bridges: {
    id: 'bridges',
    version: 1,
    name: 'Island Hopping',
    blurb: 'Five seas in a row, from a handful of islands to a big 11 by 11 archipelago. Join them all with as few planks as the answer needs.',
    seas: [
      ['.......', '4....2.', '.......', '5.4...1', '.......', '..1....', '3..2...'],
      ['.........', '...2..4..', '2.5..3...', '........1', '...1.2...', '1........', '..4...6.2', '.........', '......1..'],
      ['..4.4..3.', '.2......2', '.....2.5.', '.........', '..3.2...4', '.........', '.4...2...', '..2....4.', '.2.3..3.3'],
      ['.3.5.2.....', '....2..2...', '...........', '.3..2.3....', '2......1...', '...2..6...3', '...........', '.3....4..2.', '3..2....2.2', '...........', '...........'],
      ['.2.3.......', '3.2..1.5.2.', '..........2', '...........', '...........', '4..7...7..4', '........1..', '.2.8..4....', '.......2...', '...........', '2..4..4.4.3'],
    ],
  },
};

export const isBridgeCourse = (v: unknown): v is BridgeCourseId => v === 'bridges';

const parsed = new Map<BridgeCourseId, Puzzle[]>();
/** The seas of a course, read once, each with its one solution. */
export function courseSeas(id: BridgeCourseId): Puzzle[] {
  let seas = parsed.get(id);
  if (!seas) parsed.set(id, seas = COURSES[id].seas.map(parsePuzzle));
  return seas;
}

/** The fewest planks for each sea: the planks of its answer. */
export const courseBest = (id: BridgeCourseId): number[] => courseSeas(id).map((p) => p.par);
/** The fewest planks for a whole course. */
export const courseMinimum = (id: BridgeCourseId) => courseBest(id).reduce((n, b) => n + b, 0);
