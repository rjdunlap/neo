import { parsePuzzle, type Puzzle } from './logic';

/**
 * A challenge course: fixed beds played in a row as one round, scored by the entries made. The beds are frozen
 * data, not generated, so a record always means the same puzzles. Each has exactly one solution that the
 * game's techniques can reach, and the fewest entries is the number of its empty squares: one for every square,
 * with nothing taken back. Change a bed and the version must change too, which starts a fresh record and keeps the old one.
 *
 * Legend: a digit is a number already in the bed, `.` an empty square.
 */
export type BedCourseId = 'beds' | 'bigbeds';

export interface Course {
  id: BedCourseId;
  /** Bump when a bed or a scoring rule changes: records compare only within a version. */
  version: number;
  name: string;
  blurb: string;
  beds: readonly (readonly string[])[];
}

export const COURSES: Record<BedCourseId, Course> = {
  beds: {
    id: 'beds',
    version: 1,
    name: 'Six Beds',
    blurb: 'Six small flower beds in a row, climbing from a few numbers to find to the only-place-left trick.',
    beds: [
      ['526143', '34.5.6', '....32', '632...', '.5...4', '2.4351'],
      ['.4.1..', '6...34', '45.21.', '1.6.4.', '5...21', '...453'],
      ['.4.62.', '.1..4.', '1.3...', '5.43..', '43.1..', '...4.2'],
      ['....4.', '....65', '5...1.', '.1.5..', '6.215.', '35...6'],
      ['2..1..', '..3...', '..2.64', '..4.21', '.....5', '.5.6..'],
      ['2....5', '.3..2.', '......', '5.1..4', '6....3', '3...5.'],
    ],
  },
  bigbeds: {
    id: 'bigbeds',
    version: 1,
    name: 'Three Big Beds',
    blurb: 'Three full 9 by 9 beds, an evening\'s puzzle: plenty of numbers to start, then the only-place-left trick, then a pair or a pointing line.',
    beds: [
      ['5..6.93.7', '.79.182..', '4.6..7...', '.523..716', '..387...2', '..1.569..', '2.....184', '.941.257.', '..5....2.'],
      ['..52..8.3', '....7..19', '..8.415..', '.218.....', '.3...4...', '7...2..8.', '.86..7...', '.9.4.....', '..3.862.7'],
      ['.9.48....', '....9...6', '.....7.9.', '.5.3..6.8', '..8..57..', '..6.7..19', '5...1.38.', '.4....2.5', '...7.....'],
    ],
  },
};

export const isBedCourse = (v: unknown): v is BedCourseId => v === 'beds' || v === 'bigbeds';

const parsed = new Map<BedCourseId, Puzzle[]>();
/** The beds of a course, read once. */
export function courseBeds(id: BedCourseId): Puzzle[] {
  let beds = parsed.get(id);
  if (!beds) parsed.set(id, beds = COURSES[id].beds.map(parsePuzzle));
  return beds;
}

/** The fewest entries for each bed of a course: its empty squares. */
export const courseBest = (id: BedCourseId): number[] => courseBeds(id).map((b) => b.blanks);
/** The fewest entries for a whole course. */
export const courseMinimum = (id: BedCourseId) => courseBest(id).reduce((n, b) => n + b, 0);
