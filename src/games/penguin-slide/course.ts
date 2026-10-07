import { solve, type Cell, type SlidePuzzle } from './logic';

/**
 * A challenge course: fixed ponds played in a row as one round, scored by the total number of slides.
 * The boards are frozen data, not generated, so a record always means the same puzzles. They were
 * picked with the solver, each with exactly one shortest route. Change a board and the version must
 * change too, which starts a fresh record and keeps the old one.
 *
 * Legend: `#` rock, `~` soft snow, `F` fish, `P` where the penguin starts, `.` ice.
 */
export type PondCourseId = 'practice' | 'ponds';

export interface Course {
  id: PondCourseId;
  /** Bump when a board or a scoring rule changes: records compare only within a version. */
  version: number;
  name: string;
  blurb: string;
  boards: readonly (readonly string[])[];
}

export const COURSES: Record<PondCourseId, Course> = {
  practice: {
    id: 'practice',
    version: 1,
    name: 'Pond Practice',
    blurb: 'Five gentle ice puzzles in a row, with no dead ends: a warm-up, or a relaxed game.',
    boards: [
      ['.##.#', '.....', 'F....', '..P..'],
      ['#P##.F', '#.....', '......', '......'],
      ['..#P.#', '..#...', '.#....', 'F.....', '#.....'],
      ['...P.#', '...#.F', '..F...', '#.....', '....##'],
      ['#....P.', '#.~.F#.', '....#..', '.......', '..F#...'],
    ],
  },
  ponds: {
    id: 'ponds',
    version: 1,
    name: 'The Five Ponds',
    blurb: 'Five ice puzzles in a row. Fewer slides is better.',
    boards: [
      ['..#.F.', 'P.....', '......', '..###.'],
      ['#..#...', '.....#.', 'F.#....', '#P.....', '...#...'],
      ['...#P##', '..#....', '.F.....', '.#.....', '...F#..'],
      ['...~...', '...#.#.', 'P.....#', '......F', '..~.F##'],
      ['...~F..', '...#~#.', 'F.#.P#.', '.~.....', '#..F.##', '.......'],
    ],
  },
};

/** Read a board from its picture. The fewest slides is worked out by the solver, never typed in. */
export function parseBoard(rows: readonly string[]): SlidePuzzle {
  const rocks: Cell[] = [], soft: Cell[] = [], fish: Cell[] = [];
  let start: Cell | null = null;
  rows.forEach((row, y) => [...row].forEach((ch, x) => {
    if (ch === '#') rocks.push({ x, y });
    else if (ch === '~') soft.push({ x, y });
    else if (ch === 'F') fish.push({ x, y });
    else if (ch === 'P') start = { x, y };
  }));
  if (!start) throw new Error('a pond needs a penguin');
  const puzzle: SlidePuzzle = { cols: rows[0].length, rows: rows.length, rocks, soft, start, fish, best: 0 };
  return { ...puzzle, best: solve(puzzle, start).moves };
}

export const isPondCourse = (v: unknown): v is PondCourseId => v === 'practice' || v === 'ponds';

const parsed = new Map<PondCourseId, SlidePuzzle[]>();
/** The ponds of a course, read once. */
export function courseBoards(id: PondCourseId): SlidePuzzle[] {
  let boards = parsed.get(id);
  if (!boards) parsed.set(id, boards = COURSES[id].boards.map(parseBoard));
  return boards;
}

/** The fewest slides for a whole course: the sum of each pond's shortest route. */
export const courseMinimum = (id: PondCourseId) => courseBoards(id).reduce((n, b) => n + b.best, 0);
