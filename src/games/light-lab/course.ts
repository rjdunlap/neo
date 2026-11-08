import { minTurns, nearestSolutions, trace, type LightPuzzle, type Thing, type Tilt } from './logic';

/**
 * A challenge course: fixed boards played in a row as one round, scored by mirror turns plus shines that miss. The
 * boards are frozen data, not generated, so a record always means the same puzzles. The fewest turns for each is
 * worked out by the solver (`minTurns` from the starting tilts), never typed in. Change a board and the version must
 * change too, which starts a fresh record and keeps the old one.
 *
 * Legend: `>` the sun in the first column shining right, `<` the sun in the last column shining left, `/` and `\` a
 * mirror and how it starts, `#` a rock, `y` `p` `b` a flower wanting sunlight, pink or blue, `P` `B` pink or blue glass.
 */
export type LightCourseId = 'sunbeams';

export interface Course {
  id: LightCourseId;
  /** Bump when a board or a scoring rule changes: records compare only within a version. */
  version: number;
  name: string;
  blurb: string;
  boards: readonly (readonly string[])[];
}

export const COURSES: Record<LightCourseId, Course> = {
  sunbeams: {
    id: 'sunbeams',
    version: 1,
    name: 'Sunbeam Run',
    blurb:
      'Five mirror boards in a row, from two mirrors to turn to four, with a sun on either side, two flowers and coloured glass. Wake every flower with the fewest turns.',
    boards: [
      ['...#..', '..../.', '>../..', '..y\\..'],
      ['.../y/.', '.\\...y.', '.../..<', '#.../..', '..#....'],
      ['...B...', '..p....', '..P.#\\<', '.\\.\\.y.', '../..\\.'],
      ['.\\y.y\\.', './/....', '>.\\\\...', '..../#.', '.#.....'],
      ['...\\...', '...#\\\\y', '..\\....', '>y./...', '.../.\\#'],
    ],
  },
};

export const isLightCourse = (v: unknown): v is LightCourseId => v === 'sunbeams';

const WANTS = { y: 'sun', p: 'pink', b: 'blue' } as const;
const TINTS = { P: 'pink', B: 'blue' } as const;

/** A board from its rows, with the nearest answer from its starting tilts as the known solution. */
export function parseBoard(rows: readonly string[]): LightPuzzle {
  const things: Thing[] = [];
  const start: Tilt[] = [];
  let sun: { x: number; y: number; dir: 0 | 2 } | null = null;
  rows.forEach((row, y) =>
    [...row].forEach((c, x) => {
      if (c === '.') return;
      if (c === '>' || c === '<') {
        if (sun) throw new Error('A board has one sun');
        sun = { x, y, dir: c === '>' ? 0 : 2 };
        return;
      }
      if (c === '/' || c === '\\') things.push({ kind: 'mirror', x, y });
      else if (c === '#') things.push({ kind: 'rock', x, y });
      else if (c in WANTS) things.push({ kind: 'flower', x, y, wants: WANTS[c as keyof typeof WANTS] });
      else if (c in TINTS) things.push({ kind: 'glass', x, y, tint: TINTS[c as keyof typeof TINTS] });
      else throw new Error(`Unknown board cell ${c}`);
      start.push(c === '\\' ? 1 : 0);
    }),
  );
  const s = sun as { x: number; y: number; dir: 0 | 2 } | null;
  if (!s) throw new Error('A board needs a sun');
  const p: LightPuzzle = {
    cols: rows[0].length,
    rows: rows.length,
    sunRow: s.y,
    sunCol: s.x,
    sunDir: s.dir,
    things,
    solution: start,
    start,
    pathMirrors: [],
    tray: [],
  };
  const [answer] = nearestSolutions(p, start);
  if (!answer) throw new Error('A board needs an answer');
  const at = new Map(things.map((t, i) => [`${t.x},${t.y}`, i]));
  const pathMirrors = trace(p, answer).cells.flatMap((c) => {
    const i = at.get(`${c.x},${c.y}`);
    return i !== undefined && things[i].kind === 'mirror' ? [i] : [];
  });
  return { ...p, solution: answer, pathMirrors };
}

const parsed = new Map<LightCourseId, LightPuzzle[]>();
/** The boards of a course, read once. */
export function courseBoards(id: LightCourseId): LightPuzzle[] {
  let boards = parsed.get(id);
  if (!boards) parsed.set(id, (boards = COURSES[id].boards.map(parseBoard)));
  return boards;
}

/** The fewest turns for each board of a course. */
export const courseBest = (id: LightCourseId): number[] => courseBoards(id).map((p) => minTurns(p, p.start));
/** The fewest turns for a whole course. */
export const courseMinimum = (id: LightCourseId) => courseBest(id).reduce((n, b) => n + b, 0);
