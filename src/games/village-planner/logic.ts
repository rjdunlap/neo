import type { BandLevels } from '../../progress/difficulty';
import type { Rng } from '../../engine/random';

/**
 * Village Planner's rules (docs/definitions/village-planner.md), free of Pixi. Jobs are placed on a board of step columns with a
 * Bench row (one job per step) and a Cart row (one job per step, at Baker's Hill or Creek Mill). A job that needs another must sit
 * in a strictly later step. The Cart's trips count each change of place, starting from the Yard.
 */

export type Place = 'bench' | 'hill' | 'mill';
export type CartPlace = Exclude<Place, 'bench'>;

export interface Job {
  id: string;
  /** Spoken and shown name: "Grind grain". */
  name: string;
  place: Place;
  /** Jobs that must be in a strictly earlier step. */
  requires: readonly string[];
}

export interface Puzzle {
  level: number;
  name: string;
  jobs: readonly Job[];
  /** Step columns on the board. */
  maxSteps: number;
  /** The fewest Cart trips any feasible plan takes. */
  minTrips: number;
}

/** A board: per step, the job in the Bench slot and the job in the Cart slot (null when empty). */
export interface Board {
  bench: (string | null)[];
  cart: (string | null)[];
}

export const LEVELS: BandLevels = { school: { min: 1, max: 2 }, grownup: { min: 1, max: 3 } };

const job = (id: string, name: string, place: Place, ...requires: string[]): Job => ({
  id,
  name,
  place,
  requires,
});

export const PUZZLES: readonly Puzzle[] = [
  {
    level: 1,
    name: 'Two stops, one bench',
    maxSteps: 4,
    minTrips: 2,
    jobs: [
      job('mill', 'Fetch grain', 'mill'),
      job('dough', 'Knead dough', 'bench', 'mill'),
      job('bake', 'Bake bread', 'hill', 'dough'),
      job('crates', 'Pack crates', 'bench'),
    ],
  },
  {
    level: 2,
    name: 'Share the bench, save a trip',
    maxSteps: 5,
    minTrips: 2,
    jobs: [
      job('cut', 'Cut a plank', 'hill'),
      job('wheel', 'Shape a wheel', 'bench', 'cut'),
      job('grind', 'Grind grain', 'mill'),
      job('mix', 'Mix dough', 'bench', 'grind'),
      job('loaf', 'Bake a loaf', 'hill', 'mix'),
    ],
  },
  {
    level: 3,
    name: 'Six jobs, tight steps',
    maxSteps: 5,
    minTrips: 2,
    jobs: [
      job('wood', 'Gather wood', 'hill'),
      job('frame', 'Build a frame', 'bench', 'wood'),
      job('grain', 'Fetch grain', 'mill'),
      job('flour', 'Sift flour', 'bench', 'grain'),
      job('oil', 'Press oil', 'mill'),
      job('oven', 'Light the oven', 'hill', 'frame', 'flour'),
    ],
  },
];

export const puzzleFor = (level: number): Puzzle => PUZZLES[Math.max(1, Math.min(PUZZLES.length, level)) - 1];

export const describeLevel = (level: number): string => {
  const p = puzzleFor(level);
  return `${p.name}: ${p.jobs.length} village jobs, one bench and one cart, ${p.maxSteps} steps`;
};

export const jobById = (p: Puzzle, id: string): Job => {
  const j = p.jobs.find((x) => x.id === id);
  if (!j) throw new Error(`no job ${id}`);
  return j;
};

export const emptyBoard = (p: Puzzle): Board => ({
  bench: Array.from({ length: p.maxSteps }, () => null),
  cart: Array.from({ length: p.maxSteps }, () => null),
});

export const cloneBoard = (b: Board): Board => ({ bench: [...b.bench], cart: [...b.cart] });

/** The row a job's place uses. */
export const rowOf = (j: Job): 'bench' | 'cart' => (j.place === 'bench' ? 'bench' : 'cart');

/** The step a job sits in, or -1 while it waits in the tray. */
export function stepOf(b: Board, id: string): number {
  const i = b.bench.indexOf(id);
  return i >= 0 ? i : b.cart.indexOf(id);
}

export const placedIds = (b: Board): string[] =>
  [...b.bench, ...b.cart].filter((x): x is string => x !== null);

/** Stable text for a board, so a repeated Run plan of one board is told apart from a changed one. */
export const boardKey = (b: Board): string => `${b.bench.join(',')}|${b.cart.join(',')}`;

/** Put a job in a step of its own row. Null when the slot is taken or the step does not exist. */
export function place(p: Puzzle, b: Board, id: string, step: number): Board | null {
  const j = jobById(p, id);
  const row = rowOf(j);
  if (step < 0 || step >= p.maxSteps || b[row][step] !== null) return null;
  const next = cloneBoard(b);
  const at = stepOf(next, id);
  if (at >= 0) (next.bench[at] === id ? next.bench : next.cart)[at] = null;
  next[row][step] = id;
  return next;
}

export function remove(b: Board, id: string): Board {
  const next = cloneBoard(b);
  next.bench = next.bench.map((x) => (x === id ? null : x));
  next.cart = next.cart.map((x) => (x === id ? null : x));
  return next;
}

/**
 * Cart trips: starting at the Yard, each Cart job at a place other than where the Cart is costs one trip. An empty Cart step
 * leaves the Cart where it is.
 */
export function countJourneys(p: Puzzle, b: Board): number {
  let at: Place | 'yard' = 'yard';
  let trips = 0;
  for (const id of b.cart) {
    if (!id) continue;
    const to = jobById(p, id).place;
    if (to !== at) trips++;
    at = to;
  }
  return trips;
}

export interface Conflict {
  /** The job that ran too soon. */
  job: string;
  /** The prerequisite that was not finished in an earlier step. */
  needs: string;
  /** The step (0-based) where the plan stopped. */
  step: number;
}

/** The earliest step whose job needs something not finished in an earlier step; null for a plan that works (or is incomplete). */
export function firstConflict(p: Puzzle, b: Board): Conflict | null {
  for (let t = 0; t < p.maxSteps; t++) {
    for (const id of [b.bench[t], b.cart[t]]) {
      if (!id) continue;
      for (const need of jobById(p, id).requires) {
        const at = stepOf(b, need);
        if (at < 0 || at >= t) return { job: id, needs: need, step: t };
      }
    }
  }
  return null;
}

export const isComplete = (p: Puzzle, b: Board): boolean => placedIds(b).length === p.jobs.length;

/** Does every placed job already respect its placed prerequisites (an unplaced prerequisite is not a failure yet)? */
function consistent(p: Puzzle, b: Board): boolean {
  for (const id of placedIds(b)) {
    const t = stepOf(b, id);
    for (const need of jobById(p, id).requires) {
      const at = stepOf(b, need);
      if (at >= t && at >= 0) return false;
    }
  }
  return true;
}

/** Steps with a job in them, counting up to the last used one. */
export function stepsUsed(b: Board): number {
  let last = -1;
  b.bench.forEach((x, i) => x && (last = Math.max(last, i)));
  b.cart.forEach((x, i) => x && (last = Math.max(last, i)));
  return last + 1;
}

/**
 * Every feasible complete board that keeps what is already placed, fewest Cart trips first, then fewest steps. An empty list
 * means the placed jobs already block every completion.
 */
export function solve(p: Puzzle, partial: Board = emptyBoard(p)): Board[] {
  if (!consistent(p, partial)) return [];
  const todo = p.jobs.filter((j) => stepOf(partial, j.id) < 0);
  const out: Board[] = [];
  const walk = (i: number, b: Board) => {
    if (i === todo.length) {
      if (!firstConflict(p, b)) out.push(b);
      return;
    }
    const j = todo[i];
    for (let t = 0; t < p.maxSteps; t++) {
      const next = place(p, b, j.id, t);
      if (next && consistent(p, next)) walk(i + 1, next);
    }
  };
  walk(0, partial);
  return out.sort(
    (a, b) =>
      countJourneys(p, a) - countJourneys(p, b) ||
      stepsUsed(a) - stepsUsed(b) ||
      boardKey(a).localeCompare(boardKey(b)),
  );
}

export type Hint =
  /** Every job is placed and the plan works. */
  | { kind: 'run' }
  /** Put this job in this step (0-based). */
  | { kind: 'put'; job: string; step: number }
  /** A placed job blocks every plan: send it back. `needs` is the prerequisite that should go first. */
  | { kind: 'back'; job: string; needs: string };

/** The next useful help for the jobs placed so far. Repeating it from any board reaches a working plan. */
export function hint(p: Puzzle, b: Board): Hint {
  const plans = solve(p, b);
  if (plans.length > 0) {
    const plan = plans[0];
    if (isComplete(p, b)) return { kind: 'run' };
    // The earliest-step unplaced job of the best plan.
    let best: { job: string; step: number } | null = null;
    for (const j of p.jobs) {
      if (stepOf(b, j.id) >= 0) continue;
      const step = stepOf(plan, j.id);
      if (!best || step < best.step) best = { job: j.id, step };
    }
    return { kind: 'put', job: best!.job, step: best!.step };
  }
  // A dead end (or an unsound complete board): find the smallest set of placed jobs whose return opens a plan.
  const placed = placedIds(b);
  for (let size = 1; size <= placed.length; size++) {
    for (const group of subsets(placed, size)) {
      let without = b;
      for (const id of group) without = remove(without, id);
      if (solve(p, without).length === 0) continue;
      // Name the first of them, preferring one that sits before something it needs.
      const first =
        group.find((id) => jobById(p, id).requires.some((n) => stepOf(b, n) >= stepOf(b, id))) ?? group[0];
      const j = jobById(p, first);
      const needs =
        j.requires.find((n) => stepOf(b, n) < 0 || stepOf(b, n) >= stepOf(b, first)) ??
        j.requires[0] ??
        first;
      return { kind: 'back', job: first, needs };
    }
  }
  return { kind: 'back', job: placed[0], needs: placed[0] };
}

function* subsets<T>(items: readonly T[], size: number, from = 0, chosen: T[] = []): Generator<T[]> {
  if (chosen.length === size) {
    yield [...chosen];
    return;
  }
  for (let i = from; i < items.length; i++) {
    chosen.push(items[i]);
    yield* subsets(items, size, i + 1, chosen);
    chosen.pop();
  }
}

/** Apply a hint to a board (a tester's stand-in for a player who follows it). */
export function follow(p: Puzzle, b: Board, h: Hint): Board {
  if (h.kind === 'put') return place(p, b, h.job, h.step) ?? b;
  if (h.kind === 'back') return remove(b, h.job);
  return b;
}

export interface VillageRound {
  puzzle: Puzzle;
  /** The tray's starting order of job ids: a seeded shuffle that never changes the dependency graph. */
  tray: string[];
}

export function makeRound(level: number, rng: Rng): VillageRound {
  const puzzle = puzzleFor(level);
  const tray = puzzle.jobs.map((j) => j.id);
  for (let i = tray.length - 1; i > 0; i--) {
    const k = Math.floor(rng.next() * (i + 1));
    [tray[i], tray[k]] = [tray[k], tray[i]];
  }
  return { puzzle, tray };
}

/** The reference plan with the fewest trips: what the ghost finger plays. */
export const referencePlan = (p: Puzzle): Board => solve(p)[0];
