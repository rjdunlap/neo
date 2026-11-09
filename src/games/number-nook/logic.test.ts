import { describe, expect, it, vi } from 'vitest';
import { Rng } from '../../engine/random';
import {
  distances,
  fifteenRoute,
  goal,
  inPlace,
  lineSlide,
  makeBoard,
  neighbours,
  nookLayout,
  planFor,
  pool,
  slide,
  solutionStep,
  solved,
} from './logic';
import { square, uprightProblems, UPRIGHT_VIEWS } from '../upright-check';

describe('Number Nook', () => {
  it('enumerates precisely the reachable states of each shape', () => {
    expect(distances(2, 2).size).toBe(12);
    expect(distances(2, 3).size).toBe(360);
    expect(distances(3, 3).size).toBe(181440);
    expect(distances(2, 4).size).toBe(20160);
    expect(solutionStep([2, 1, 3, 4, 5, 6, 7, 8, 0], 3)).toBeNull();
  });
  it('draws levels 1 and 2 from a pool of boards 3–5 and 7–9 slides from home, level 3 at 14', () => {
    expect(pool(1).length).toBe(6);
    expect(pool(2).length).toBe(40);
    expect(pool(3).length).toBe(1893);
    expect(pool(4).length).toBe(788);
    for (const [level, least] of [
      [1, 4],
      [2, 20],
    ] as const) {
      const seen = new Set<string>();
      for (let seed = 1; seed <= 80; seed++) seen.add(makeBoard(level, new Rng(seed)).join(''));
      expect(seen.size, `level ${level}`).toBeGreaterThanOrEqual(least);
    }
  });
  it('keeps the seeded boards of levels 1–4 unchanged', () => {
    const boards: Record<string, string> = {};
    for (let level = 1; level <= 4; level++)
      for (let seed = 1; seed <= 3; seed++)
        boards[`${level}-${seed}`] = makeBoard(level, new Rng(seed)).join('');
    expect(boards).toEqual({
      '1-1': '2310',
      '1-2': '3021',
      '1-3': '3021',
      '2-1': '523104',
      '2-2': '041532',
      '2-3': '431502',
      '3-1': '034126758',
      '3-2': '014732586',
      '3-3': '712643580',
      '4-1': '62513074',
      '4-2': '26473510',
      '4-3': '04362157',
    });
    expect(planFor(4)).toMatchObject({ rows: 2, cols: 4, near: 18, far: 18 });
    expect(planFor(9)).toBe(planFor(7));
  });
  it('counts the numbered tiles in their goal place', () => {
    expect(inPlace(goal(3, 3))).toBe(8);
    expect(inPlace([3, 1, 2, 0])).toBe(0);
    expect(inPlace([1, 2, 0, 3])).toBe(2);
  });
  it('generates seeded boards at a shortest distance inside the level range and solves them with legal hints', () => {
    for (let level = 1; level <= 6; level++)
      for (let seed = 1; seed <= 25; seed++) {
        const p = planFor(level);
        let board = makeBoard(level, new Rng(seed));
        expect(board).toEqual(makeBoard(level, new Rng(seed)));
        expect(board.slice().sort((a, b) => a - b)).toEqual(
          Array.from({ length: p.rows * p.cols }, (_, i) => i),
        );
        const start = solutionStep(board, p.cols, p.order)!.distance;
        expect(start).toBeGreaterThanOrEqual(p.near);
        expect(start).toBeLessThanOrEqual(p.far);
        for (let remaining = start; remaining > 0; remaining--) {
          const step = solutionStep(board, p.cols, p.order)!;
          expect(step.distance).toBe(remaining);
          board = slide(board, p.cols, step.next)!;
          expect(board).not.toBeNull();
        }
        expect(solved(board, goal(p.rows, p.cols, p.order))).toBe(true);
      }
  });
  it('agrees with an independent breadth-first search from the 3 by 4 goal', () => {
    const target = goal(3, 4);
    const queue = [{ board: target, distance: 0 }];
    const seen = new Set([target.join(',')]);
    for (const { board, distance } of queue) {
      const hint = solutionStep(board, 4);
      expect(hint?.distance).toBe(distance);
      if (distance) expect(solutionStep(slide(board, 4, hint!.next)!, 4)?.distance).toBe(distance - 1);
      if (distance === 10) continue;
      for (const at of neighbours(board, 4)) {
        const next = slide(board, 4, at)!;
        const key = next.join(',');
        if (seen.has(key)) continue;
        seen.add(key);
        queue.push({ board: next, distance: distance + 1 });
      }
    }
    expect(solutionStep([2, 1, ...target.slice(2)], 4)).toBeNull();
  });
  it('finds exact hints within 350 ms on long 3 by 4 detours up to 44 slides from the goal', () => {
    for (const [board, distance] of [
      [[11, 2, 4, 9, 10, 3, 8, 6, 5, 0, 7, 1], 40],
      [[4, 7, 3, 9, 11, 10, 5, 1, 8, 0, 2, 6], 44],
      [[3, 4, 5, 10, 7, 2, 6, 1, 8, 11, 9, 0], 44],
    ] as const) {
      let current: readonly number[] = board;
      for (let remaining = distance; remaining > 0; remaining--) {
        const start = performance.now();
        const hint = solutionStep(current, 4);
        expect(performance.now() - start).toBeLessThan(350);
        expect(hint?.distance).toBe(remaining);
        current = slide(current, 4, hint!.next)!;
        expect(current).not.toBeNull();
      }
      expect(current).toEqual(goal(3, 4));
    }
  });
  it('hints still shorten the route after any legal exploratory slide', () => {
    for (const [rows, cols] of [
      [2, 3],
      [2, 4],
    ] as const)
      for (const [key, info] of distances(rows, cols)) {
        const b = key.split('').map(Number);
        if (info.distance)
          expect(solutionStep(slide(b, cols, info.next)!, cols)!.distance).toBe(info.distance - 1);
        for (const at of neighbours(b, cols)) {
          const next = slide(b, cols, at)!;
          expect(solutionStep(next, cols)).not.toBeNull();
          expect(slide(next, cols, b.indexOf(0))).toEqual(b);
        }
      }
  });
  it('reads column order for completion and the green in-place tiles', () => {
    const rows = goal(3, 3),
      columns = goal(3, 3, 'columns');
    expect(columns).toEqual([1, 4, 7, 2, 5, 8, 3, 6, 0]);
    expect(solved(columns, columns)).toBe(true);
    expect(solved(rows, columns)).toBe(false);
    expect(solved(columns)).toBe(false);
    expect(inPlace(columns, columns)).toBe(8);
    expect(inPlace(rows, columns)).toBe(2);
    expect(inPlace(columns)).toBe(2);
    const moved = slide(columns, 3, 7)!;
    expect(solved(moved, columns)).toBe(false);
    expect(inPlace(moved, columns)).toBe(7);
    expect(planFor(5)).toMatchObject({ rows: 3, cols: 3, near: 14, far: 14, order: 'columns' });
    expect(pool(5).length).toBe(1893);
  });
  it('keeps the two opposite-parity goals isolated whichever table is initialized first', async () => {
    for (const first of ['rows', 'columns'] as const) {
      vi.resetModules();
      const fresh = await import('./logic');
      const second = first === 'rows' ? 'columns' : 'rows';
      for (const order of [first, second] as const) {
        const other = order === 'rows' ? 'columns' : 'rows';
        const target = fresh.goal(3, 3, order);
        expect(fresh.distances(3, 3, order).size).toBe(181440);
        expect(fresh.solutionStep(target, 3, order)).toEqual({ distance: 0, next: -1 });
        expect(fresh.solutionStep(target, 3, other)).toBeNull();
      }
      // Looking up the second goal must not overwrite the first goal's distances or membership.
      for (const order of [first, second] as const) {
        const target = fresh.goal(3, 3, order);
        const near = fresh.slide(target, 3, 7)!;
        expect(fresh.solutionStep(near, 3, order)?.distance).toBe(1);
        expect(fresh.solutionStep(near, 3, order)?.next).toBe(8);
        expect(fresh.solutionStep(target, 3, order)?.distance).toBe(0);
      }
    }
  });
  it('has an exact, legal decreasing hint throughout the alternate goal table, including after exploration', () => {
    const target = goal(3, 3, 'columns');
    let checked = 0;
    for (const [key, info] of distances(3, 3, 'columns')) {
      const board = key.split('').map(Number);
      if (!info.distance) {
        expect(board).toEqual(target);
        expect(info.next).toBe(-1);
      } else {
        const next = slide(board, 3, info.next);
        if (!next || solutionStep(next, 3, 'columns')?.distance !== info.distance - 1)
          throw new Error(`No decreasing legal hint for ${key}`);
      }
      // Every edge changes distance by exactly one. Together with distance zero only at the goal,
      // this proves shortest distances rather than merely a route that eventually arrives.
      for (const at of neighbours(board, 3)) {
        const explored = slide(board, 3, at)!;
        const after = solutionStep(explored, 3, 'columns');
        if (!after || Math.abs(after.distance - info.distance) !== 1)
          throw new Error(`Incorrect distance after exploring ${key} at ${at}`);
      }
      checked++;
    }
    expect(checked).toBe(181440);
    expect(solutionStep(goal(3, 3), 3, 'columns')).toBeNull();
  });
  it('rejects distant, diagonal, blank and wrapped moves without mutating the board', () => {
    const b = goal(3, 3),
      before = b.slice();
    for (const at of [0, 4, 8, -1, 9]) expect(slide(b, 3, at)).toBeNull();
    expect(b).toEqual(before);
    expect(neighbours([1, 2, 0, 3, 4, 5], 3)).toEqual([5, 1]);
  });
  it('a line slide equals the same single slides in order, and every tile moved counts one slide', () => {
    for (const [rows, cols] of [
      [2, 2],
      [2, 3],
      [3, 3],
      [2, 4],
    ] as const)
      for (const [k] of [...distances(rows, cols)].slice(0, 400)) {
        const b = k.split('').map(Number),
          z = b.indexOf(0);
        for (let at = 0; at < b.length; at++) {
          const line = lineSlide(b, cols, at),
            inLine = at !== z && (Math.floor(at / cols) === Math.floor(z / cols) || at % cols === z % cols);
          if (!inLine) {
            expect(line, `${k} tap ${at}`).toBeNull();
            continue;
          }
          let single: number[] = b;
          for (const c of line!.steps) single = slide(single, cols, c)!;
          expect(line!.board).toEqual(single);
          expect(line!.steps.length).toBe(
            Math.abs((at % cols) - (z % cols)) + Math.abs(Math.floor(at / cols) - Math.floor(z / cols)),
          );
          expect(line!.steps.at(-1)).toBe(at);
          expect(line!.board[at]).toBe(0);
          // A one-tile line slide is exactly the old single slide.
          if (line!.steps.length === 1) expect(line!.board).toEqual(slide(b, cols, at));
          expect(solutionStep(line!.board, cols)).not.toBeNull();
        }
      }
    // Gap at the top right of 3 by 3: tapping the left end of the row slides two tiles.
    expect(lineSlide([1, 2, 0, 3, 4, 5, 6, 7, 8], 3, 0)).toEqual({
      board: [0, 1, 2, 3, 4, 5, 6, 7, 8],
      steps: [1, 0],
    });
    expect(lineSlide([1, 2, 3, 4, 5, 6, 7, 8, 0], 3, 2)).toEqual({
      board: [1, 2, 0, 4, 5, 3, 7, 8, 6],
      steps: [5, 2],
    });
  });
  it('refuses diagonal, other-row, blank and off-board taps without changing the board', () => {
    const b = [1, 2, 3, 4, 0, 5, 6, 7, 8],
      before = b.slice();
    for (const at of [0, 2, 6, 8, 4, -1, 9]) expect(lineSlide(b, 3, at)).toBeNull();
    // Row-major neighbours across a row edge are not in line.
    expect(lineSlide([1, 2, 0, 3, 4, 5], 3, 3)).toBeNull();
    expect(b).toEqual(before);
  });
});

describe('The fifteen', () => {
  const target = goal(4, 4);
  const top = [0, 1, 2, 3];
  const left = [4, 8, 12];

  function follow(start: number[], moves: number[], keepEdges = false) {
    let board = start;
    const matches = (cells: number[]) => cells.every((at) => board[at] === target[at]);
    let topDone = matches(top),
      leftDone = topDone && matches(left);
    for (const at of moves) {
      const next = slide(board, 4, at);
      expect(next, `slide ${at} on ${board.join(',')}`).not.toBeNull();
      board = next!;
      if (keepEdges) {
        if (topDone) expect(matches(top)).toBe(true);
        if (leftDone) expect(matches(left)).toBe(true);
        topDone ||= matches(top);
        leftDone ||= topDone && matches(left);
      }
    }
    expect(board).toEqual(target);
  }

  it('returns useful recovery within 350 ms when the exact search runs out of nodes', () => {
    const detour = [0, 12, 9, 13, 15, 11, 10, 14, 3, 7, 2, 5, 4, 8, 6, 1];
    const start = performance.now();
    const hint = fifteenRoute(detour);
    const elapsed = performance.now() - start;
    expect(elapsed).toBeLessThan(350);
    expect(hint?.distance).toBeNull();
    follow(detour, hint!.moves, true);
  });

  it('draws varied seeded permutations with a proven 30-slide route to the goal', () => {
    const seen = new Set<string>();
    expect(planFor(7)).toMatchObject({ rows: 4, cols: 4, near: 30, far: 30 });
    for (let seed = 1; seed <= 25; seed++) {
      const board = makeBoard(7, new Rng(seed));
      expect(board).toEqual(makeBoard(7, new Rng(seed)));
      expect(board.slice().sort((a, b) => a - b)).toEqual(Array.from({ length: 16 }, (_, i) => i));
      const hint = fifteenRoute(board);
      expect(hint?.distance).toBe(30);
      expect(hint?.moves).toHaveLength(30);
      follow(board, hint!.moves);
      seen.add(board.join(','));
    }
    expect(seen.size).toBeGreaterThanOrEqual(20);
  });

  it('agrees with breadth-first distances near the goal and rejects impossible parity', () => {
    const queue = [{ board: target, distance: 0 }];
    const seen = new Set([target.join(',')]);
    for (const { board, distance } of queue) {
      const hint = fifteenRoute(board);
      expect(hint?.distance).toBe(distance);
      expect(hint?.moves).toHaveLength(distance);
      follow(board, hint!.moves);
      if (distance === 7) continue;
      for (const at of neighbours(board, 4)) {
        const next = slide(board, 4, at)!,
          key = next.join(',');
        if (seen.has(key)) continue;
        seen.add(key);
        queue.push({ board: next, distance: distance + 1 });
      }
    }
    expect(fifteenRoute([2, 1, ...target.slice(2)])).toBeNull();
    expect(fifteenRoute([2, 1, ...target.slice(2)], 0)).toBeNull();
  });

  it('recovers from legal detours without disturbing completed edges', () => {
    for (const fixed of [[], top, [...top, ...left]]) {
      for (let seed = 1; seed <= 30; seed++) {
        const rng = new Rng(seed);
        let board = target,
          previous = -1;
        for (let i = 0; i < 71; i++) {
          const at = rng.pick(
            neighbours(board, 4).filter((cell) => !fixed.includes(cell) && cell !== previous),
          );
          previous = board.indexOf(0);
          board = slide(board, 4, at)!;
        }
        const before = board.slice();
        const hint = fifteenRoute(board, 0);
        expect(hint?.distance).toBeNull();
        expect(board).toEqual(before);
        follow(board, hint!.moves, true);
      }
    }
  });
});

describe('Number Nook on a phone held upright (chunk 31)', () => {
  it('fits every board, the goal picture and the buttons in each upright view', () => {
    for (const [name, v] of Object.entries(UPRIGHT_VIEWS))
      for (const level of [1, 2, 3, 4, 5, 6, 7]) {
        const { rows, cols } = planFor(level);
        const l = nookLayout(v.w, v.h, rows, cols);
        const cells = Array.from({ length: rows * cols }, (_, i) =>
          square(
            `cell ${i}`,
            { x: l.grid.x + (i % cols) * l.cell, y: l.grid.y + Math.floor(i / cols) * l.cell },
            l.cell - 1,
          ),
        );
        const goalPicture = {
          what: 'goal',
          x: l.target.x,
          y: 250 + ((rows - 1) * 50) / 2 - 20,
          w: cols * 50,
          h: rows * 50 + 40,
        };
        const buttons = l.buttons.map((b, i) => square(`button ${i}`, b, 120));
        // Four columns upright give 87-unit cells: the grown-up band's 64-unit floor, not the 100 the smaller boards keep.
        expect(
          uprightProblems(v, [...cells, goalPicture, ...buttons], cols === 4 ? 64 : 100),
          `${name} level ${level}`,
        ).toEqual([]);
        if (cols === 4) expect(l.cell).toBeGreaterThanOrEqual(87);
      }
  });
  it('lays the two long rows out sideways at full-size cells', () => {
    const l = nookLayout(1024, 768, 2, 4);
    expect(l.cell).toBe(136);
    // The goal picture's 42-unit tiles sit 50 apart around `target.x`; the tray reaches 10 units past the last cell.
    const goalLeft = l.target.x - 1.5 * 50 - 21,
      goalRight = l.target.x + 1.5 * 50 + 21,
      trayRight = l.grid.x + 3.5 * l.cell + 10;
    expect(goalRight).toBeLessThan(1024);
    expect(trayRight).toBeLessThan(goalLeft);
  });
  it('fits the four-row tray clear of the goal picture and buttons in both orientations', () => {
    for (const [w, h] of [
      [768, 1024],
      [1024, 768],
    ]) {
      const l = nookLayout(w, h, 4, 4);
      expect(l.cell).toBeGreaterThanOrEqual(64);
      expect(l.grid.y + 3.5 * l.cell + 10).toBeLessThan(l.buttons[0].y - 50);
      expect(l.grid.x + 3.5 * l.cell + 10).toBeLessThan(l.target.x - 1.5 * 50 - 21);
      expect(l.target.x + 1.5 * 50 + 21).toBeLessThan(w);
    }
  });
  it('fits three long rows sideways above the buttons', () => {
    const l = nookLayout(1024, 768, 3, 4);
    expect(l.cell).toBe(136);
    expect(l.grid.y + 2.5 * l.cell + 10).toBeLessThan(l.buttons[0].y - 50);
    expect(l.grid.x + 3.5 * l.cell + 10).toBeLessThan(l.target.x - 1.5 * 50 - 21);
  });
});
