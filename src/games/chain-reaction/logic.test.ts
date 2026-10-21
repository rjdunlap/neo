import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import { chainTouch, hintFor, makeBoard, makeBoards, PLANS, planFor, predictedBell, PREDICT_PLAN, rampsMet, solutions, trace, traces, turnHint, turnSolutions, TURN_PLAN, TAP_TO_TURN, TWO_MARBLES, TWO_PLAN, WHICH_BELL, works, type Layout } from './logic';

describe('Chain Reaction', () => {
  it('level 7 starts unsolved and has an exact working flip set for every seeded machine', () => {
    expect(planFor(TAP_TO_TURN)).toBe(TURN_PLAN);
    for (let seed = 0; seed < 200; seed++) {
      const boards = makeBoards(TURN_PLAN, new Rng(seed));
      expect(makeBoards(TURN_PLAN, new Rng(seed))).toEqual(boards);
      for (const board of boards) {
        expect(board.rows).toBe(3);
        expect(board.fixed).toHaveLength(1);
        expect(board.turn).toHaveLength(2);
        expect(board.loose).toEqual([]);
        expect(board.sockets).toEqual([]);
        expect(new Set([...board.fixed, ...board.turn!].map((p) => p.row)).size).toBe(3);
        expect(trace(board, [], [false, false]).success).toBe(false);
        const ways = turnSolutions(board);
        expect(ways.length).toBeGreaterThan(0);
        for (const way of ways) expect(trace(board, [], way)).toMatchObject({ success: true, escaped: false, end: board.target });
        // Independently follow all four visible groove combinations, including off-path ramps.
        for (const state of [[false, false], [false, true], [true, false], [true, true]]) {
          let col = board.start;
          for (let row = 0; row < board.rows && col >= 0 && col < board.cols; row++) {
            const fixed = board.fixed.find((p) => p.row === row && p.col === col);
            const i = board.turn!.findIndex((p) => p.row === row && p.col === col);
            if (fixed) col += fixed.ramp === 'left' ? -1 : 1;
            else if (i >= 0) col += (board.turn![i].ramp === 'left' ? -1 : 1) * (state[i] ? -1 : 1);
          }
          expect(trace(board, [], state).success).toBe(col >= 0 && col < board.cols && col === board.target);
        }
      }
    }
  });

  it('a turn hint and touch bot improve every unsolved state and finish with taps', () => {
    for (let seed = 0; seed < 100; seed++) {
      const board = makeBoard(TURN_PLAN, new Rng(seed));
      const before = structuredClone(board);
      for (const state of [[false, false], [false, true], [true, false], [true, true]]) {
        const distance = () => Math.min(...turnSolutions(board).map((way) => way.filter((value, i) => value !== state[i]).length));
        for (let step = 0; step < 3; step++) {
          const oldDistance = distance();
          const hint = turnHint(board, state);
          const action = chainTouch(board, [], state);
          if (oldDistance === 0) {
            expect(hint).toBeNull();
            expect(action).toEqual({ kind: 'run' });
            break;
          }
          expect(action).toEqual({ kind: 'flip', piece: hint });
          expect(hint).not.toBeNull();
          state[hint!] = !state[hint!];
          expect(distance()).toBe(oldDistance - 1);
        }
        expect(trace(board, [], state).success).toBe(true);
      }
      expect(board).toEqual(before);
    }
  });

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
        expect(board.fixed.length).toBeGreaterThanOrEqual(PREDICT_PLAN.fixed);
        expect(board.fixed.length).toBeLessThanOrEqual(PREDICT_PLAN.fixed + 1);
        expect(new Set(bells).size).toBe(PREDICT_PLAN.predict!.bells);
        expect(bells.every((col) => col >= 0 && col < board.cols)).toBe(true);
        // The marble stays on the machine, rings one of the shown bells, and needed its ramps to get there.
        expect(run).toMatchObject({ escaped: false, success: true, end: board.target });
        expect(bells).toContain(run.end);
        expect(run.steps.filter((s) => s.ramp)).toHaveLength(PREDICT_PLAN.fixed);
        expect(predictedBell(board)).toBe(board.target);
      }
    }
  });

  it('level 8 answers vary, so a prediction needs the ramps read rather than a corner guessed', () => {
    const ends = new Set<number>(), places = new Set<number>(), shifts = new Set<number>();
    let agree = 0, disagree = 0, offPath = 0;
    for (let seed = 1; seed <= 200; seed++) {
      const board = makeBoard(PREDICT_PLAN, new Rng(seed * 7 + 3));
      const hit = trace(board, []).steps.filter((s) => s.ramp).map((s) => s.ramp);
      if (hit[0] === hit[1]) agree++; else disagree++;
      if (board.fixed.length > hit.length) offPath++;
      ends.add(board.target);
      shifts.add(board.target - board.start);
      places.add(board.bells!.indexOf(board.target));
    }
    expect(agree).toBeGreaterThan(20);
    expect(disagree).toBeGreaterThan(20);
    expect(offPath).toBeGreaterThan(20);
    expect(shifts.has(0)).toBe(true);
    expect(shifts.size).toBeGreaterThanOrEqual(3);
    expect(ends.size).toBe(4);
    expect(places.size).toBe(3);
  });

  it('level 8 has nothing to place, so a hint or bot never moves a part', () => {
    const board = makeBoard(PREDICT_PLAN, new Rng(4));
    expect(hintFor(board, [])).toBeNull();
    expect(chainTouch(board, [])).toEqual({ kind: 'run' });
  });

  it('level 9 gives every seeded machine two marbles that need one shared design', () => {
    expect(planFor(TWO_MARBLES)).toBe(TWO_PLAN);
    for (let seed = 0; seed < 300; seed++) {
      const boards = makeBoards(TWO_PLAN, new Rng(seed));
      expect(makeBoards(TWO_PLAN, new Rng(seed))).toEqual(boards);
      for (const board of boards) {
        const blue = board.blue!;
        expect(blue.start).not.toBe(board.start);
        expect(blue.target).not.toBe(board.target);
        expect(blue.target).toBeGreaterThanOrEqual(0);
        expect(blue.target).toBeLessThan(board.cols);
        expect(board.chime).toBeUndefined();
        expect(works(board, [null, null])).toBe(false);
        const ways = solutions(board);
        expect(ways.length).toBeGreaterThanOrEqual(TWO_PLAN.solutions.min);
        expect(ways.length).toBeLessThanOrEqual(TWO_PLAN.solutions.max);
        expect(works(board, board.solution)).toBe(true);
        for (const way of ways) {
          const [red, bl] = traces(board, way);
          expect(red).toMatchObject({ success: true, end: board.target });
          expect(bl).toMatchObject({ success: true, end: blue.target });
        }
        // In every accepted design each marble meets a loose ramp of its own, their ways never share a cell, and a spare
        // socket sits on one of the ways, so a ramp put there for one marble would knock the other off course.
        for (const way of ways) {
          const [red, bl] = traces(board, way);
          const [redMet, blueMet] = [red, bl].map(rampsMet);
          expect(redMet.size).toBeGreaterThan(0);
          expect(blueMet.size).toBeGreaterThan(0);
          expect([...redMet].some((piece) => blueMet.has(piece))).toBe(false);
          expect(red.steps.some((a) => bl.steps.some((b) => a.row === b.row && a.col === b.col))).toBe(false);
          expect(board.sockets.some((cell, i) => !way.includes(i) && [...red.steps, ...bl.steps].some((st) => st.row === cell.row && st.col === cell.col))).toBe(true);
        }
        // Solving for one marble alone is not enough: some placement rings one bell while the other marble misses.
        let redOnly = false, blueOnly = false;
        for (let a = 0; a < board.sockets.length; a++) for (let b = 0; b < board.sockets.length; b++) {
          if (a !== b && trace(board, [a, b]).success && !trace(board, [a, b], [], 1).success) redOnly = true;
          if (a !== b && !trace(board, [a, b]).success && trace(board, [a, b], [], 1).success) blueOnly = true;
        }
        expect([redOnly, blueOnly]).toEqual([true, true]);
      }
    }
  });

  it('level 9 hints point at the marble that missed and the bot finishes with a run that rings both bells', () => {
    for (let seed = 0; seed < 120; seed++) {
      const board = makeBoard(TWO_PLAN, new Rng(seed));
      // From every two-socket placement, following hints reaches a working design within a few steps.
      for (let a = 0; a < board.sockets.length; a++) for (let b = 0; b < board.sockets.length; b++) {
        if (a === b) continue;
        const layout: Layout = [a, b];
        const missed = traces(board, layout).findIndex((t) => !t.success);
        const first = hintFor(board, layout);
        if (missed < 0) { expect(first).toBeNull(); continue; }
        expect(first).not.toBeNull();
        // The glowing ramp matters to the marble that missed: it is in that marble's way now, or that marble meets it in a
        // working design that keeps the hinted placement.
        const pointsAtMissed = traces(board, layout)[missed].steps.some((st) => st.loose === first!.piece) || Array.from({ length: board.sockets.length }, (_, other) => other).some((other) => {
          if (other === first!.socket) return false;
          const way: Layout = first!.piece === 0 ? [first!.socket, other] : [other, first!.socket];
          return works(board, way) && traces(board, way)[missed].steps.some((st) => st.loose === first!.piece);
        });
        expect(pointsAtMissed).toBe(true);
        for (let step = 0; step < 4 && !works(board, layout); step++) {
          const hint = hintFor(board, layout)!;
          const other = layout.findIndex((s, i) => i !== hint.piece && s === hint.socket);
          if (other >= 0) layout[other] = null;
          layout[hint.piece] = hint.socket;
        }
        // A hint may empty a socket another ramp held; the bot then puts that ramp back.
        for (let step = 0; step < 4; step++) {
          const move = chainTouch(board, layout);
          if (!move || move.kind === 'run') break;
          if (move.kind === 'place') {
            const other = layout.findIndex((s, i) => i !== move.piece && s === move.socket);
            if (other >= 0) layout[other] = null;
            layout[move.piece] = move.socket;
          }
        }
        expect(chainTouch(board, layout)).toEqual({ kind: 'run' });
        expect(works(board, layout)).toBe(true);
      }
      // The bot starts from an empty tray too.
      const layout: Layout = [null, null];
      for (let step = 0; step < 4; step++) {
        const move = chainTouch(board, layout);
        if (!move || move.kind !== 'place') break;
        layout[move.piece] = move.socket;
      }
      expect(chainTouch(board, layout)).toEqual({ kind: 'run' });
    }
  });
});
