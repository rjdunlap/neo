import type { CritterName } from '../../art/critter';
import type { Rng } from '../../engine/random';
import { CROSSED, EMPTY, FILLED } from '../picture-logic/logic';

export { CROSSED, EMPTY, FILLED };

/**
 * Mystery Grid rules (docs/definitions/logic-grid.md). A little mystery on a grid of friends (rows) by places (columns): spoken
 * clues say where friends are or are not, she marks each square yes or no until every friend has one place, then taps who is
 * by the missing pie (levels 3–4: the ball). Levels 1–4 are built here; each level's build writes only its own cast and clue
 * kinds. From level 3 there are as many places as friends, so every place has someone and a column can be closed too.
 *
 * A grid's marks are a flat array, row by row (`friend * cols + place`), of Picture Logic's `EMPTY`, `FILLED` (a yes) and
 * `CROSSED` (a no). Only her own marks are stored; the lighter crosses a yes puts across its row and column are derived
 * (`shown`), so they lift again when the yes is taken away.
 */

export type Place = 'pond' | 'tree' | 'bush' | 'blanket';
export const PLACES: readonly Place[] = ['pond', 'tree', 'bush', 'blanket'];

/** The missing thing: the pie at levels 1–2, the ball at 3–4. */
export type Thing = 'pie' | 'ball';

/** Level 4's hats: each colour has its own pattern too, so colour never has to work alone. */
export const HATS = [
  { color: 'red', pattern: 'stripes' },
  { color: 'blue', pattern: 'spots' },
  { color: 'yellow', pattern: 'stars' },
] as const;

export type Mark = typeof EMPTY | typeof FILLED | typeof CROSSED;
export type Marks = readonly Mark[];

/** `hat`: the clue names the friend by the hat on their card ("The friend in the red hat…"), not by name. */
export type Clue = { kind: 'direct' | 'not'; friend: number; place: number; hat?: true };
export type Kind = Clue['kind'];

export interface Board {
  friends: CritterName[];
  places: Place[];
  /** Each friend's place (an index into `places`); one place stays empty. */
  solution: number[];
  clues: Clue[];
  /** The place the missing thing is by: always one a friend is at, so it names exactly one friend. */
  event: number;
  thing: Thing;
  /** Level 4: each friend's hat (an index into `HATS`). */
  hats?: number[];
}

export interface Plan {
  level: number;
  name: string;
  /** The friends a board draws from. */
  cast: readonly CritterName[];
  friends: number;
  /** The places a board draws from, and how many it uses. */
  placePool: readonly Place[];
  places: number;
  kinds: readonly Kind[];
  /** Clues on a board (at least `clues`, at most `maxClues`), and how many of each kind it must have (level 2: one of each). */
  clues: number;
  maxClues?: number;
  each?: Partial<Record<Kind, number>>;
  /** At most this many direct clues (levels 3–4: one). */
  maxDirect?: number;
  /** Every clue names its friend by hat (level 4). */
  hats?: boolean;
  thing: Thing;
  boards: number;
}

const OPENING: readonly Place[] = ['pond', 'tree', 'bush'];

export const PLANS: readonly Plan[] = [
  { level: 1, name: 'Who is where? (2 friends, 3 places, clues that say where)', cast: ['cat', 'duck', 'bear'], friends: 2, placePool: OPENING, places: 3, kinds: ['direct'], clues: 2, thing: 'pie', boards: 2 },
  { level: 2, name: 'Not there (a clue that says where, and one that says not)', cast: ['dog', 'bunny', 'pig'], friends: 2, placePool: OPENING, places: 3, kinds: ['direct', 'not'], clues: 2, each: { direct: 1, not: 1 }, thing: 'pie', boards: 2 },
  { level: 3, name: 'Three friends (3 friends, 3 places, mostly "not" clues)', cast: ['cat', 'duck', 'bear', 'dog'], friends: 3, placePool: PLACES, places: 3, kinds: ['direct', 'not'], clues: 3, maxClues: 4, maxDirect: 1, thing: 'ball', boards: 1 },
  { level: 4, name: 'The friend in the red hat (clues name a friend by the hat they wear)', cast: ['cat', 'duck', 'bear', 'dog'], friends: 3, placePool: PLACES, places: 3, kinds: ['not'], clues: 3, maxClues: 4, maxDirect: 0, hats: true, thing: 'ball', boards: 1 },
];

export const planFor = (level: number): Plan => PLANS[Math.max(0, Math.min(PLANS.length - 1, level - 1))];

export interface Shape {
  rows: number;
  cols: number;
}

export const sq = (s: Shape, friend: number, place: number) => friend * s.cols + place;
export const rowOf = (s: Shape, i: number) => Math.floor(i / s.cols);
export const colOf = (s: Shape, i: number) => i % s.cols;
export const shapeOf = (b: Board): Shape => ({ rows: b.friends.length, cols: b.places.length });
export const emptyMarks = (s: Shape): Mark[] => new Array<Mark>(s.rows * s.cols).fill(EMPTY);

/** True of an assignment (friend → place)? */
export const holds = (c: Clue, a: readonly number[]) => (c.kind === 'direct' ? a[c.friend] === c.place : a[c.friend] !== c.place);

/** Every one-place-each assignment the clues allow (the exact solver). */
export function solutions(s: Shape, clues: readonly Clue[]): number[][] {
  const out: number[][] = [];
  const walk = (a: number[]) => {
    if (a.length === s.rows) {
      if (clues.every((c) => holds(c, a))) out.push([...a]);
      return;
    }
    for (let p = 0; p < s.cols; p++) if (!a.includes(p)) walk([...a, p]);
  };
  walk([]);
  return out;
}

/**
 * The squares one clue decides by itself on an empty grid, with the matching rule: a direct clue is a yes on its square and a
 * no on the rest of its row and its column; a negative clue is a no on its square. The miss rule and the tests both use this.
 */
export function decides(s: Shape, c: Clue): { square: number; mark: Mark }[] {
  if (c.kind === 'not') return [{ square: sq(s, c.friend, c.place), mark: CROSSED }];
  const out = [{ square: sq(s, c.friend, c.place), mark: FILLED as Mark }];
  for (let p = 0; p < s.cols; p++) if (p !== c.place) out.push({ square: sq(s, c.friend, p), mark: CROSSED });
  for (let f = 0; f < s.rows; f++) if (f !== c.friend) out.push({ square: sq(s, f, c.place), mark: CROSSED });
  return out;
}

/** What each square shows: her own mark, or a lighter automatic cross where a yes of hers shares its row or column. */
export function shown(s: Shape, marks: Marks): { mark: Mark; auto: boolean }[] {
  return marks.map((m, i) => {
    if (m !== EMPTY) return { mark: m, auto: false };
    const r = rowOf(s, i), c = colOf(s, i);
    for (let j = 0; j < marks.length; j++) if (j !== i && marks[j] === FILLED && (rowOf(s, j) === r || colOf(s, j) === c)) return { mark: CROSSED, auto: true };
    return { mark: EMPTY, auto: false };
  });
}

/** The tap cycle: empty → yes → no → empty. An automatic cross counts as empty, so a tap there makes a yes. */
export function cycle(m: Mark): Mark {
  return m === EMPTY ? FILLED : m === FILLED ? CROSSED : EMPTY;
}

export interface Step {
  square: number;
  mark: Mark;
  /** The clue or clues the square follows from (for a last-place step, every clue behind its row's crosses). */
  clues: number[];
  /** `last`: a friend's one place left; `col`: a place's one friend left (only when every place has someone). */
  why: 'clue' | 'cross' | 'last' | 'col';
}

/**
 * The rule solver: only what a person does on paper, never trial and error. It puts each clue on the grid, crosses a yes's
 * row and column (the matching rule), and makes a row's one remaining square a yes. A column is closed the same way only when
 * there are as many places as friends; with a place to spare (levels 1–2) one stays empty. Returns its steps in order and
 * whether every friend found a place.
 */
export function solveSteps(s: Shape, clues: readonly Clue[]): { steps: Step[]; done: boolean } {
  const known = new Map<number, { mark: Mark; from: Set<number> }>();
  const steps: Step[] = [];
  const put = (square: number, mark: Mark, from: Set<number>, why: Step['why']) => {
    known.set(square, { mark, from });
    steps.push({ square, mark, clues: [...from].sort((a, b) => a - b), why });
  };
  const rowDone = (f: number) => [...Array(s.cols).keys()].some((p) => known.get(sq(s, f, p))?.mark === FILLED);
  for (let guard = 0; guard < 100; guard++) {
    // The matching rule first: every yes crosses the rest of its row and column.
    for (const [i, k] of [...known]) {
      if (k.mark !== FILLED) continue;
      for (let j = 0; j < s.rows * s.cols; j++) {
        if (j === i || known.has(j) || (rowOf(s, j) !== rowOf(s, i) && colOf(s, j) !== colOf(s, i))) continue;
        put(j, CROSSED, new Set(k.from), 'cross');
      }
    }
    if ([...Array(s.rows).keys()].every(rowDone)) return { steps, done: true };
    // Then the next clue not yet on the grid.
    const i = clues.findIndex((c) => !known.has(sq(s, c.friend, c.place)));
    if (i >= 0) {
      const c = clues[i];
      put(sq(s, c.friend, c.place), c.kind === 'direct' ? FILLED : CROSSED, new Set([i]), 'clue');
      continue;
    }
    // Then a row with one square left.
    let found = false;
    for (let f = 0; f < s.rows && !found; f++) {
      if (rowDone(f)) continue;
      const open = [...Array(s.cols).keys()].filter((p) => !known.has(sq(s, f, p)));
      if (open.length !== 1) continue;
      const from = new Set<number>();
      for (let p = 0; p < s.cols; p++) for (const x of known.get(sq(s, f, p))?.from ?? []) from.add(x);
      put(sq(s, f, open[0]), FILLED, from, 'last');
      found = true;
    }
    for (let p = 0; p < s.cols && !found && s.cols === s.rows; p++) {
      if ([...Array(s.rows).keys()].some((f) => known.get(sq(s, f, p))?.mark === FILLED)) continue;
      const open = [...Array(s.rows).keys()].filter((f) => !known.has(sq(s, f, p)));
      if (open.length !== 1) continue;
      const from = new Set<number>();
      for (let f = 0; f < s.rows; f++) for (const x of known.get(sq(s, f, p))?.from ?? []) from.add(x);
      put(sq(s, open[0], p), FILLED, from, 'col');
      found = true;
    }
    if (!found) return { steps, done: false };
  }
  return { steps, done: false };
}

/** The friend who has the missing thing. */
export const answerOf = (b: Board) => b.solution.indexOf(b.event);

/** The mark each square ends with: yes on each friend's place, no everywhere else. */
export function solutionMarks(b: Board): Mark[] {
  const s = shapeOf(b);
  return emptyMarks(s).map((_, i) => (b.solution[rowOf(s, i)] === colOf(s, i) ? FILLED : CROSSED));
}

/** Rejects a board whose clues miss the plan's count or mix, have more than one answer, or that the rule solver cannot finish. */
export function fits(plan: Plan, b: Board): boolean {
  const s = shapeOf(b);
  if (b.clues.length < plan.clues || b.clues.length > (plan.maxClues ?? plan.clues)) return false;
  for (const [k, n] of Object.entries(plan.each ?? {})) if (b.clues.filter((c) => c.kind === k).length !== n) return false;
  if (b.clues.filter((c) => c.kind === 'direct').length > (plan.maxDirect ?? Infinity)) return false;
  if (b.clues.some((c) => !!c.hat !== !!plan.hats) || !!b.hats !== !!plan.hats) return false;
  if (b.clues.some((c) => !plan.kinds.includes(c.kind) || !holds(c, b.solution))) return false;
  if (solutions(s, b.clues).length !== 1) return false;
  if (!solveSteps(s, b.clues).done) return false;
  // No clue is spare to the rule solver.
  if (b.clues.some((_, i) => solveSteps(s, b.clues.filter((__, j) => j !== i)).done)) return false;
  return b.solution.includes(b.event);
}

/**
 * Draws a board: friends from the cast, a place for each, every true clue of the level's kinds, then clues taken away at random
 * while the exact solver still finds one answer. A board that misses the plan (`fits`) is redrawn. Direct clues are told first.
 */
export function makeBoard(plan: Plan, rng: Rng): Board {
  for (let n = 0; n < 500; n++) {
    const friends = rng.shuffle([...plan.cast]).slice(0, plan.friends);
    const places = plan.placePool.length > plan.places ? rng.shuffle([...plan.placePool]).slice(0, plan.places) : [...plan.placePool];
    const s = { rows: friends.length, cols: places.length };
    const solution = rng.shuffle([...places.keys()]).slice(0, friends.length);
    let clues: Clue[] = [];
    for (let f = 0; f < s.rows; f++) {
      for (let p = 0; p < s.cols; p++) {
        const hat = plan.hats ? { hat: true as const } : {};
        if (p === solution[f] && plan.kinds.includes('direct')) clues.push({ kind: 'direct', friend: f, place: p, ...hat });
        if (p !== solution[f] && plan.kinds.includes('not')) clues.push({ kind: 'not', friend: f, place: p, ...hat });
      }
    }
    for (const c of rng.shuffle([...clues])) {
      const rest = clues.filter((x) => x !== c);
      if (solutions(s, rest).length === 1) clues = rest;
    }
    clues.sort((a, b) => (a.kind === b.kind ? 0 : a.kind === 'direct' ? -1 : 1));
    const board: Board = { friends, places, solution, clues, event: rng.pick(solution), thing: plan.thing };
    if (plan.hats) board.hats = rng.shuffle([...HATS.keys()]).slice(0, friends.length);
    if (fits(plan, board)) return board;
  }
  throw new Error(`logic-grid: no board for level ${plan.level}`);
}

export const makeRound = (plan: Plan, rng: Rng): Board[] => Array.from({ length: plan.boards }, () => makeBoard(plan, rng));

/** The clues (by index) a mark goes against all by itself: a yes where one says no, or a no where one says yes. */
export function contradicts(b: Board, square: number, mark: Mark): number[] {
  if (mark === EMPTY) return [];
  const s = shapeOf(b);
  return b.clues.flatMap((c, i) => (decides(s, c).some((d) => d.square === square && d.mark !== mark) ? [i] : []));
}

/** Her own yes squares. */
export const yeses = (marks: Marks) => marks.flatMap((m, i) => (m === FILLED ? [i] : []));

/** Solved: her yes squares are exactly each friend's place. */
export function solved(b: Board, marks: Marks): boolean {
  const s = shapeOf(b);
  const y = yeses(marks);
  return y.length === b.friends.length && y.every((i) => b.solution[rowOf(s, i)] === colOf(s, i));
}

/** Full but wrong: every friend has exactly one yes, and they are not the answer. */
export function fullWrong(b: Board, marks: Marks): boolean {
  const s = shapeOf(b);
  const perRow = [...Array(s.rows).keys()].map((f) => yeses(marks).filter((i) => rowOf(s, i) === f).length);
  return perRow.every((n) => n === 1) && !solved(b, marks);
}

/** For a full grid, the first clue it breaks, or -1 when it breaks none (two friends in one place). */
export function brokenClue(b: Board, marks: Marks): number {
  const s = shapeOf(b);
  const a = [...Array(s.rows).keys()].map((f) => colOf(s, yeses(marks).find((i) => rowOf(s, i) === f)!));
  return b.clues.findIndex((c) => !holds(c, a));
}

/** Her marks that disagree with the answer (a wrong yes, or a no on a friend's place). */
export function wrongSquares(b: Board, marks: Marks): number[] {
  const want = solutionMarks(b);
  return marks.flatMap((m, i) => (m !== EMPTY && m !== want[i] ? [i] : []));
}

/**
 * Help's next square: the rule solver's first clue or last-place step that the grid does not already show, reading only her
 * right marks (and the crosses they make), so a wrong mark never sends it astray. Null once solved.
 */
export function nextStep(b: Board, marks: Marks): Step | null {
  if (solved(b, marks)) return null;
  const s = shapeOf(b);
  const wrong = new Set(wrongSquares(b, marks));
  const right = shown(s, marks.map((m, i) => (wrong.has(i) ? EMPTY : m)));
  const steps = solveSteps(s, b.clues).steps;
  const next = steps.find((st) => st.why !== 'cross' && right[st.square].mark !== st.mark);
  if (next) return next;
  // Every friend's yes is down but a wrong yes is left: the solver's own step for that square (a no) clears it.
  return steps.find((st) => wrong.has(st.square) && marks[st.square] === FILLED) ?? null;
}

/** Help's mark: clears her wrong marks and puts the step's mark down. */
export function applyStep(b: Board, marks: Marks, st: Step): Mark[] {
  const wrong = new Set(wrongSquares(b, marks));
  const out = marks.map((m, i) => (wrong.has(i) ? EMPTY : m));
  out[st.square] = st.mark;
  return out;
}
