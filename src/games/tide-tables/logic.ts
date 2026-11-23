import type { Rng } from '../../engine/random';
import type { BandLevels } from '../../progress/difficulty';

export const LEVELS: BandLevels = { grownup: { min: 1, max: 2 } };
export const describeLevel = (level: number) =>
  level === 1
    ? 'Find a time: fit three jobs to the tide heights.'
    : 'Make room: fit the heights and the order of jobs.';

export const JOBS = [0, 1, 2] as const;
export const ROWS = [0, 1, 2, 3] as const;
export type Job = (typeof JOBS)[number];
export type Row = (typeof ROWS)[number];
export type Draft = readonly [Row | null, Row | null, Row | null];
type Schedule = readonly [Row, Row, Row];
export const EMPTY: Draft = [null, null, null];

const HOURS = [
  ['07:00', '11:00', '15:00', '19:00'],
  ['07:30', '11:30', '15:30', '19:30'],
] as const;

interface Board {
  readonly times: (typeof HOURS)[number];
  readonly heights: readonly [number, number, number, number];
  readonly sketchMax: number;
  readonly order: 'any' | 'before' | 'after';
}

// Heights are in tenths of a metre, so comparisons at a boundary are exact.
export const BOAT_MIN = 30;
export const metres = (tenths: number) => (tenths / 10).toFixed(1);

export const BOARDS: readonly (readonly Board[])[] = [
  [
    { times: HOURS[0], heights: [10, 30, 20, 40], sketchMax: 20, order: 'any' },
    { times: HOURS[1], heights: [32, 12, 30, 20], sketchMax: 20, order: 'any' },
  ],
  [
    { times: HOURS[0], heights: [20, 40, 10, 30], sketchMax: 10, order: 'before' },
    { times: HOURS[1], heights: [10, 30, 20, 40], sketchMax: 10, order: 'after' },
  ],
];

export function boardFor(level: number, rng: Rng): Board {
  return rng.pick(BOARDS[level - 1]);
}

/** Placing a job frees its old row and lifts any occupant of the new row in a single edit. */
export function place(draft: Draft, job: Job, row: Row): Draft {
  if (draft[job] === row) return draft;
  const next: [Row | null, Row | null, Row | null] = [...draft];
  const occupant = JOBS.find((j) => draft[j] === row);
  if (occupant !== undefined) next[occupant] = null;
  next[job] = row;
  return next;
}

export type Verdict =
  | { kind: 'missing'; job: Job }
  | { kind: 'sketch' | 'boat' | 'before' | 'after'; row: Row }
  | { kind: 'ready'; plan: Schedule };

export function check(board: Board, [sketch, boat, picnic]: Draft): Verdict {
  if (sketch === null) return { kind: 'missing', job: 0 };
  if (boat === null) return { kind: 'missing', job: 1 };
  if (picnic === null) return { kind: 'missing', job: 2 };
  if (board.heights[sketch] > board.sketchMax) return { kind: 'sketch', row: sketch };
  if (board.heights[boat] < BOAT_MIN) return { kind: 'boat', row: boat };
  if (board.order === 'before' && picnic >= sketch) return { kind: 'before', row: sketch };
  if (board.order === 'after' && picnic <= boat) return { kind: 'after', row: boat };
  return { kind: 'ready', plan: [sketch, boat, picnic] };
}

export function solutions(board: Board): Schedule[] {
  const plans: Schedule[] = [];
  for (const sketch of ROWS)
    for (const boat of ROWS)
      for (const picnic of ROWS) {
        if (new Set([sketch, boat, picnic]).size < JOBS.length) continue;
        const verdict = check(board, [sketch, boat, picnic]);
        if (verdict.kind === 'ready') plans.push(verdict.plan);
      }
  return plans;
}

const matches = (plan: Schedule, draft: Draft) => JOBS.filter((job) => draft[job] === plan[job]).length;

export function hintFor(plans: readonly Schedule[], draft: Draft): { job: Job; row: Row } | null {
  // The first tied plan in row order stays preferred. A move towards it always adds a matching job.
  const plan = plans.reduce((best, candidate) =>
    matches(candidate, draft) > matches(best, draft) ? candidate : best,
  );
  const job = JOBS.find((id) => plan[id] !== draft[id]);
  return job === undefined ? null : { job, row: plan[job] };
}
