import { compress, runPath, shortestPath, type Cell, type RobotMode, type RobotPlan } from './logic';

/**
 * A challenge course: fixed mazes played in a row as one round, scored by the steps the robot walks
 * when Play is pressed (a step into a wall or rock counts as one too; changing arrows before Play is free).
 * The boards are frozen data, not generated, so a record always means the same puzzles. The fewest steps
 * for each is worked out by `shortestPath`, never typed in. Change a board and the version must change too,
 * which starts a fresh record and keeps the old one.
 *
 * Legend: `R` the robot's start at (0, 0), `*` the star, `#` a rock, `.` an open square.
 */
export type RobotCourseId = 'robotpath';

export interface CourseBoard {
  mode: Extract<RobotMode, 'steps' | 'counts'>;
  limit: number;
  rows: readonly string[];
}

export interface Course {
  id: RobotCourseId;
  /** Bump when a board or a scoring rule changes: records compare only within a version. */
  version: number;
  name: string;
  blurb: string;
  boards: readonly CourseBoard[];
}

export const COURSES: Record<RobotCourseId, Course> = {
  robotpath: {
    id: 'robotpath',
    version: 1,
    name: 'The Star Mazes',
    blurb:
      'Five mazes in a row, from step-by-step grids to counted runs on 5 by 5 boards. Reach every star in the fewest steps.',
    boards: [
      { mode: 'steps', limit: 8, rows: ['R.#.', '..#.', '.##.', '...*'] },
      { mode: 'steps', limit: 8, rows: ['R..#', '##..', '.#..', '*...'] },
      { mode: 'counts', limit: 6, rows: ['R...#', '###.#', '....#', '*#...', '.....'] },
      { mode: 'counts', limit: 6, rows: ['R...#', '###..', '....#', '.####', '....*'] },
      { mode: 'counts', limit: 8, rows: ['R....', '####.', '.*##.', '.#.#.', '.....'] },
    ],
  },
};

export const isRobotCourse = (v: unknown): v is RobotCourseId => v === 'robotpath';

/** Read one frozen board, verify its start and goal, and solve its shortest path. */
export function parseBoard({ mode, limit, rows }: CourseBoard): RobotPlan {
  const size = rows.length;
  if (size < 3 || rows.some((r) => r.length !== size)) throw new Error('A board must be a square grid');
  let start: Cell | null = null;
  let goal: Cell | null = null;
  const rocks: Cell[] = [];
  rows.forEach((row, y) =>
    [...row].forEach((c, x) => {
      if (c === '.') return;
      if (c === 'R') {
        if (start || x !== 0 || y !== 0) throw new Error('Robot must start once at (0, 0)');
        start = [x, y];
      } else if (c === '*') {
        if (goal) throw new Error('A board has one star');
        goal = [x, y];
      } else if (c === '#') rocks.push([x, y]);
      else throw new Error(`Unknown board cell ${c}`);
    }),
  );
  if (!start || !goal) throw new Error('A board needs a robot and a star');
  const base: RobotPlan = { size, goal, rocks, limit, mode, name: 'Maze' };
  const route = shortestPath(base);
  if (!route.length) throw new Error('A board needs a clear path to the star');
  const slots = mode === 'counts' ? compress(route) : route.map((dir) => ({ dir, n: 1 }));
  if (slots.length > limit) throw new Error('A board needs enough slots for its shortest path');
  if (slots.some((s) => s.n > 5)) throw new Error('A counted step cannot exceed five');
  const plan: RobotPlan = { ...base, solution: { slots, loop: 1 } };
  if (!runPath(plan, route).success) throw new Error('Shortest path did not reach the star');
  return plan;
}

const parsed = new Map<RobotCourseId, RobotPlan[]>();
/** The boards of a course, read once, each with its shortest solution. */
export function courseBoards(id: RobotCourseId): RobotPlan[] {
  let boards = parsed.get(id);
  if (!boards) parsed.set(id, (boards = COURSES[id].boards.map(parseBoard)));
  return boards;
}

/** The fewest steps for each board of a course, worked out by `shortestPath`. */
export const courseBest = (id: RobotCourseId): number[] =>
  courseBoards(id).map((p) => shortestPath(p).length);
/** The fewest steps for a whole course. */
export const courseMinimum = (id: RobotCourseId) => courseBest(id).reduce((n, b) => n + b, 0);
