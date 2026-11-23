import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import { BOARDS, EMPTY, JOBS, ROWS, boardFor, check, hintFor, place, solutions, type Draft } from './logic';

const values = [null, ...ROWS] as const;
const drafts: Draft[] = values.flatMap((r) =>
  values.flatMap((b) =>
    values.flatMap((p) => {
      const draft: Draft = [r, b, p];
      const occupied = draft.filter((row) => row !== null);
      return new Set(occupied).size === occupied.length ? [draft] : [];
    }),
  ),
);

describe('Tide Tables rules', () => {
  it('selects both authored boards at each level and repeats a board for the same seed', () => {
    for (const level of [1, 2]) {
      const seeds = Array.from({ length: 48 }, (_, i) => i + 1);
      const boards = seeds.map((seed) => boardFor(level, new Rng(seed)));
      expect(new Set(boards)).toEqual(new Set(BOARDS[level - 1]));
      expect(seeds.map((seed) => boardFor(level, new Rng(seed)))).toEqual(boards);
    }
  });

  it('rejects only the first unmet condition after the complete draft is submitted', () => {
    const [before, after] = BOARDS[1];
    expect(check(before, [0, null, 1])).toEqual({ kind: 'missing', job: 1 });
    expect(check(before, [0, 2, 1])).toEqual({ kind: 'sketch', row: 0 });
    expect(check(before, [2, 0, 3])).toEqual({ kind: 'boat', row: 0 });
    expect(check(before, [2, 1, 3])).toEqual({ kind: 'before', row: 2 });
    expect(check(after, [0, 3, 1])).toEqual({ kind: 'after', row: 3 });
    expect(check(after, [0, 1, 2])).toEqual({ kind: 'ready', plan: [0, 1, 2] });
    expect(check(BOARDS[0][0], [2, 1, 0]).kind).toBe('ready');
    expect(check(BOARDS[0][1], [3, 2, 1]).kind).toBe('ready');
  });

  it('replaces an occupant in one edit and leaves the previous draft intact for undo', () => {
    const first = place(EMPTY, 0, 0);
    const second = place(first, 1, 1);
    const third = place(second, 0, 1);
    expect(third).toEqual([1, null, null]);
    expect(place(third, 0, 1)).toBe(third);
    expect(second).toEqual([0, 1, null]);
    expect(first).toEqual([0, null, null]);
  });

  it.each([
    { board: BOARDS[0][0], count: 8 },
    { board: BOARDS[0][1], count: 8 },
    { board: BOARDS[1][0], count: 3 },
    { board: BOARDS[1][1], count: 2 },
  ])('teaches a fitting plan from every draft on board $board.heights', ({ board, count }) => {
    expect(drafts).toHaveLength(73);
    const full = drafts.filter((d) => d.every((row) => row !== null));
    expect(full).toHaveLength(24);
    const plans = solutions(board);
    expect(plans).toHaveLength(count);
    expect(plans).toEqual(full.filter((draft) => check(board, draft).kind === 'ready'));
    for (const draft of drafts) {
      let current = draft;
      for (let step = 0; step < 3; step++) {
        const hint = hintFor(plans, current);
        if (!hint) break;
        const score = (plan: Draft) => JOBS.filter((job) => plan[job] === current[job]).length;
        const scoreMax = Math.max(...plans.map(score));
        const first = plans.find((plan) => score(plan) === scoreMax)!;
        const job = JOBS.find((job) => first[job] !== current[job])!;
        expect(hint).toEqual({ job, row: first[job] });
        current = place(current, hint.job, hint.row);
      }
      expect(check(board, current).kind).toBe('ready');
      expect(hintFor(plans, current)).toBeNull();
    }
  });
});
