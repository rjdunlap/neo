import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import { chainTouch, hintFor, makeBoard, makeBoards, PLANS, planFor, predictedBell, PREDICT_PLAN, solutions, trace, WHICH_BELL } from './logic';

describe('Chain Reaction', () => {
  it('demonstrates every generated machine by completing one accepted design before running it', () => {
    PLANS.forEach((plan, level) => {
      for (let seed = 1; seed <= 50; seed++) {
        const board = makeBoard(plan, new Rng(seed * 109 + level));
        const layout = Array<number | null>(board.loose.length).fill(null);
        for (let step = 0; step < board.loose.length; step++) {
          const move = chainTouch(board, layout);
          expect(move?.kind).toBe('place');
          if (move?.kind !== 'place') break;
          expect(layout.filter((socket) => socket === move.socket)).toHaveLength(0);
          layout[move.piece] = move.socket;
        }
        expect(trace(board, layout).success).toBe(true);
        expect(chainTouch(board, layout)).toEqual({ kind: 'run' });
      }
    });
  });

  it('follows fixed and loose ramps and notices a chime', () => {
    const board = {
      cols: 4,
      rows: 3,
      start: 1,
      target: 2,
      fixed: [{ row: 0, col: 1, ramp: 'right' as const }],
      loose: ['left' as const, 'right' as const],
      sockets: [{ row: 1, col: 2 }, { row: 2, col: 1 }, { row: 2, col: 2 }],
      solution: [0, 1],
      chime: { row: 2, col: 1 },
    };
    expect(trace(board, [0, 1])).toMatchObject({ end: 2, chime: true, success: true, escaped: false });
    expect(trace(board, [2, 0])).toMatchObject({ end: 3, chime: false, success: false });
  });

  it('ends a run safely when a wrong ramp sends the marble past a side', () => {
    const board = {
      cols: 3, rows: 2, start: 0, target: 1, fixed: [], loose: ['left' as const],
      sockets: [{ row: 0, col: 0 }], solution: [0],
    };
    expect(trace(board, [0])).toMatchObject({ escaped: true, success: false, end: -1 });
  });

  it('does not call two identical ramps trading places a second design', () => {
    const board = {
      cols: 3, rows: 1, start: 1, target: 2, fixed: [], loose: ['right' as const, 'right' as const],
      sockets: [{ row: 0, col: 1 }, { row: 0, col: 0 }], solution: [0, 1],
    };
    expect(trace(board, [0, 1]).success).toBe(true);
    expect(trace(board, [1, 0]).success).toBe(true);
    expect(solutions(board)).toHaveLength(1);
  });

  it('makes seeded, solvable machines within every level plan', () => {
    PLANS.forEach((plan, level) => {
      for (let seed = 1; seed <= 20; seed++) {
        const board = makeBoard(plan, new Rng(seed * 1009 + level));
        const ways = solutions(board);
        expect(board.fixed).toHaveLength(plan.fixed);
        expect(board.loose).toHaveLength(plan.loose);
        expect(board.sockets).toHaveLength(plan.loose + plan.decoys);
        expect(ways.length, `${plan.name}, seed ${seed}`).toBeGreaterThanOrEqual(plan.solutions.min);
        expect(ways.length, `${plan.name}, seed ${seed}`).toBeLessThanOrEqual(plan.solutions.max);
        expect(trace(board, board.solution).success).toBe(true);
        expect(trace(board, Array(plan.loose).fill(null)).success).toBe(false);
        expect(new Set(board.solution).size).toBe(plan.loose);
        expect(board.solution.every((socket) => socket >= 0 && socket < board.sockets.length)).toBe(true);
        if (plan.chime) expect(trace(board, board.solution).chime).toBe(true);
      }
    });
  });

  it('a hint always changes one placement toward a working design', () => {
    PLANS.forEach((plan, level) => {
      const board = makeBoard(plan, new Rng(500 + level));
      const layout = Array<number | null>(board.loose.length).fill(null);
      for (let n = 0; n < board.loose.length; n++) {
        const hint = hintFor(board, layout);
        expect(hint).not.toBeNull();
        layout[hint!.piece] = hint!.socket;
      }
      expect(trace(board, layout).success).toBe(true);
      expect(hintFor(board, layout)).toBeNull();
    });
  });

  it('clamps level plans and deliberately opens several designs only at the top', () => {
    expect(planFor(0)).toBe(PLANS[0]);
    expect(planFor(99)).toBe(PLANS.at(-1));
    const top = makeBoard(PLANS.at(-1)!, new Rng(88));
    expect(solutions(top).length).toBeGreaterThanOrEqual(2);
  });

  it('level 8 shows a finished machine whose marble rings one of three reachable bells', () => {
    expect(planFor(WHICH_BELL)).toBe(PREDICT_PLAN);
    for (let seed = 1; seed <= 200; seed++) {
      const boards = makeBoards(PREDICT_PLAN, new Rng(seed * 31 + 8));
      expect(boards).toHaveLength(PREDICT_PLAN.machines);
      for (const board of boards) {
        const run = trace(board, []);
        const bells = board.bells!;
        expect(board.loose).toHaveLength(0);
        expect(board.fixed).toHaveLength(PREDICT_PLAN.fixed);
        expect(new Set(bells).size).toBe(PREDICT_PLAN.predict!.bells);
        expect(bells.every((col) => col >= 0 && col < board.cols)).toBe(true);
        // The marble stays on the machine, rings one of the shown bells, and needed its ramps to get there.
        expect(run).toMatchObject({ escaped: false, success: true, end: board.target });
        expect(bells).toContain(run.end);
        expect(run.end).not.toBe(board.start);
        expect(run.steps.filter((s) => s.ramp)).toHaveLength(PREDICT_PLAN.fixed);
        expect(predictedBell(board)).toBe(board.target);
      }
    }
  });

  it('level 8 has nothing to place, so a hint or bot never moves a part', () => {
    const board = makeBoard(PREDICT_PLAN, new Rng(4));
    expect(hintFor(board, [])).toBeNull();
    expect(chainTouch(board, [])).toEqual({ kind: 'run' });
  });
});
