import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import { BOARDS } from './boards';
import {
  complete,
  DIRECTIONS,
  explore,
  makePuzzle,
  nextHelp,
  NO_HELP,
  orbit,
  PLANS,
  ROCK,
  sizeLook,
  slide,
  solve,
} from './logic';

const snow = (board: readonly number[]) => board.filter((v) => v > 0);

describe('Snowball Merge', () => {
  it('packs holes before merging, and a merged snowball cannot merge twice in one slide', () => {
    expect(slide([2, 0, 2, 2, 2, 4, 4, 4, 4], 'left').board).toEqual([4, 0, 0, 4, 4, 0, 8, 4, 0]);
    expect(slide([2, 2, 2, 0, 0, 0, 0, 0, 0], 'right').board).toEqual([0, 2, 4, 0, 0, 0, 0, 0, 0]);
    expect(slide([2, 0, 0, 2, 0, 0, 4, 0, 0], 'up').board).toEqual([4, 0, 0, 4, 0, 0, 0, 0, 0]);
    expect(slide([2, 0, 0, 2, 0, 0, 4, 0, 0], 'down').board).toEqual([0, 0, 0, 4, 0, 0, 4, 0, 0]);
  });
  it('conserves quantity, adds no snowballs, moves each input once and leaves its input untouched', () => {
    for (const plan of PLANS)
      for (const d of DIRECTIONS) {
        const before = [...plan.board],
          next = slide(before, d);
        expect(before).toEqual(plan.board);
        expect(snow(next.board).reduce((s, v) => s + v, 0)).toBe(plan.target);
        expect(snow(next.board).length).toBe(snow(before).length - next.merges);
        expect(next.motions.map((m) => m.from).sort()).toEqual(
          before.flatMap((v, i) => (v > 0 ? [i] : [])).sort(),
        );
        expect(next.motions.every((m) => m.to >= 0 && m.to < 9)).toBe(true);
      }
    expect(slide([2, 0, 0, 0, 0, 0, 0, 0, 0], 'left').changed).toBe(false);
  });
  it('makes reproducible solvable variants at every level and every hint leads to completion', () => {
    for (let level = 1; level <= PLANS.length; level++) {
      const variants = new Set<string>();
      for (let seed = 1; seed <= 240; seed++) {
        const puzzle = makePuzzle(level, new Rng(seed), BOARDS[level - 1]);
        expect(puzzle).toEqual(makePuzzle(level, new Rng(seed), BOARDS[level - 1]));
        variants.add(puzzle.board.join(','));
        let board = puzzle.board,
          route = solve(board, puzzle.target);
        expect(route).not.toBeNull();
        let remaining = route!.length;
        while (!complete(board, puzzle.target)) {
          route = solve(board, puzzle.target)!;
          expect(route).toHaveLength(remaining);
          const step = slide(board, route[0]);
          expect(step.changed).toBe(true);
          board = step.board;
          remaining--;
        }
        expect(remaining).toBe(0);
      }
      expect(variants.size).toBeGreaterThanOrEqual(12);
    }
  });
  it('accepts alternative finishing routes and reports a dead end without an arbitrary hint', () => {
    const b = [2, 2, 0, 0, 0, 0, 0, 0, 0];
    expect(complete(slide(b, 'left').board, 4)).toBe(true);
    expect(complete(slide(b, 'right').board, 4)).toBe(true);
    const stuck = [2, 4, 8, 4, 2, 16, 8, 16, 4];
    expect(stuck.reduce((s, v) => s + v, 0)).toBe(64);
    expect(solve(stuck, 64)).toBeNull();
    expect(complete([16, 2, ...Array(7).fill(0)], 16)).toBe(false);
    expect(solve([16, ...Array(8).fill(0)], 16)).toEqual([]);
  });
  it('freezes four boards per level, plan first, each summing to the target inside its depth band', () => {
    const bands = [
      [3, 4],
      [5, 7],
      [7, 9],
      [10, 14],
      [8, 11],
    ];
    expect(BOARDS).toHaveLength(PLANS.length);
    PLANS.forEach((plan, i) => {
      const boards = BOARDS[i];
      expect(boards).toHaveLength(4);
      expect(boards[0]).toEqual(plan.board);
      const seen = new Set<string>();
      let asymmetric = 0;
      for (const board of boards) {
        expect(board).toHaveLength(9);
        expect(board.every((v) => v === 0 || v === ROCK || (v >= 2 && Number.isInteger(Math.log2(v))))).toBe(
          true,
        );
        // Only level 5 has an ice rock: exactly one, never in the centre, where most boards cannot finish.
        expect(board.filter((v) => v === ROCK)).toHaveLength(i === 4 ? 1 : 0);
        expect(board[4]).not.toBe(ROCK);
        expect(snow(board).reduce((s, v) => s + v, 0)).toBe(plan.target);
        const route = solve(board, plan.target)!;
        expect(route.length).toBeGreaterThanOrEqual(bands[i][0]);
        expect(route.length).toBeLessThanOrEqual(bands[i][1]);
        const turns = orbit(board);
        if (turns.size === 8) asymmetric++;
        // No frozen board is a turned copy of another.
        expect([...turns].some((k) => seen.has(k))).toBe(false);
        for (const k of turns) seen.add(k);
      }
      expect(asymmetric).toBeGreaterThanOrEqual(2);
    });
  });
  it('level 1 can never strand her; every level 3, 4 and 5 board can reach a dead end for Undo', () => {
    for (const board of BOARDS[0]) expect(explore(board, 16).deadEnds).toBe(0);
    for (const board of BOARDS[2]) expect(explore(board, 64).deadEnds).toBeGreaterThan(0);
    for (const board of BOARDS[3]) expect(explore(board, 128).deadEnds).toBeGreaterThan(0);
    for (const board of BOARDS[4]) expect(explore(board, 64).deadEnds).toBeGreaterThan(0);
    expect(explore(PLANS[1].board, 32)).toEqual({ states: 48, deadEnds: 12 });
  });
  it('the ice rock never moves or joins, splits its line, and stops the snowballs behind it', () => {
    // Left: the 2s behind the rock stop beside it and join there; the 4 before it packs to the edge.
    const row = slide([0, 4, ROCK, 2, 0, 2, 0, 0, 0], 'left');
    expect(row.board.slice(0, 3)).toEqual([4, 0, ROCK]);
    expect(row.board.slice(3)).toEqual([4, 0, 0, 0, 0, 0]);
    // A rock between two equal snowballs keeps them apart in both directions along its line.
    for (const d of ['left', 'right'] as const) {
      const apart = slide([2, ROCK, 2, 0, 0, 0, 0, 0, 0], d);
      expect(apart.changed).toBe(false);
      expect(apart.merges).toBe(0);
    }
    // Down a column: the snowball above the rock rests on it, and says so; one below falls to the edge.
    const column = slide([2, 0, 0, 0, 0, 0, ROCK, 0, 0], 'down');
    expect(column.board).toEqual([0, 0, 0, 2, 0, 0, ROCK, 0, 0]);
    expect(column.rocked).toBe(true);
    expect(slide([ROCK, 0, 0, 2, 0, 0, 0, 0, 0], 'down').rocked).toBe(false);
    expect(slide([2, 0, 2, 0, 0, 0, 0, 0, 0], 'left').rocked).toBe(false);
    // Along every route a seeded level 5 round can take, the rock stays in its cell and the snow adds up.
    for (let seed = 1; seed <= 40; seed++) {
      const puzzle = makePuzzle(5, new Rng(seed), BOARDS[4]),
        rock = puzzle.board.indexOf(ROCK);
      expect(rock).toBeGreaterThanOrEqual(0);
      let board: readonly number[] = puzzle.board,
        rocked = 0;
      for (const d of solve(board, puzzle.target)!) {
        const step = slide(board, d);
        if (step.rocked) rocked++;
        board = step.board;
        expect(board.indexOf(ROCK)).toBe(rock);
        expect(board.filter((v) => v === ROCK)).toHaveLength(1);
        expect(snow(board).reduce((s, v) => s + v, 0)).toBe(64);
        expect(step.motions.every((m) => m.from !== rock && m.to !== rock)).toBe(true);
      }
      // The rock is part of the plan, not scenery: the shortest route rests snowballs against it.
      expect(rocked).toBeGreaterThanOrEqual(3);
    }
  });
  it('leaves levels 1 to 4 as they were: no rock, the same plans and the same frozen boards', () => {
    expect(PLANS.slice(0, 4).map((p) => [p.target, p.board.join(',')])).toEqual([
      [16, '2,0,2,0,4,0,4,0,4'],
      [32, '2,4,2,4,0,4,8,0,8'],
      [64, '2,4,2,8,4,8,16,4,16'],
      [128, '32,32,32,16,8,2,2,4,0'],
    ]);
    expect(BOARDS.slice(0, 4).map((level) => level.map((b) => b.join(',')).join(' '))).toEqual([
      '2,0,2,0,4,0,4,0,4 4,4,4,4,0,0,0,0,0 8,2,0,2,0,0,2,2,0 0,2,8,0,2,2,0,0,2',
      '2,4,2,4,0,4,8,0,8 2,8,2,2,16,0,0,0,2 2,2,4,2,0,4,0,16,2 8,4,0,4,2,8,0,4,2',
      '2,4,2,8,4,8,16,4,16 4,8,2,8,4,32,4,2,0 8,8,4,16,8,0,4,8,8 4,16,0,4,0,2,32,2,4',
      '32,32,32,16,8,2,2,4,0 16,32,8,0,16,16,32,0,8 4,16,16,16,32,4,8,32,0 0,8,16,16,16,32,8,0,32',
    ]);
    for (const level of BOARDS.slice(0, 4)) for (const b of level) expect(b).not.toContain(ROCK);
  });
  it('glows after two inert arrows in a row or at a dead end, counting each glow once', () => {
    const route = ['left', 'up'] as const;
    // One inert press is exploration; a slide that moves something resets the count.
    let h = nextHelp(NO_HELP, 'inert', route);
    expect(h).toEqual({ hinted: null, inert: 1, hints: 0 });
    h = nextHelp(h, 'changed', route);
    h = nextHelp(h, 'inert', route);
    expect(h.hinted).toBeNull();
    h = nextHelp(h, 'inert', route);
    expect(h).toEqual({ hinted: 'left', inert: 0, hints: 1 });
    // More inert presses and asking for a hint while it glows count nothing.
    h = nextHelp(nextHelp(nextHelp(h, 'inert', route), 'inert', route), 'ask', route);
    expect(h.hints).toBe(1);
    // A dead end lights Undo once; staying among dead ends keeps it without counting again.
    h = nextHelp(h, 'changed', null);
    expect(h).toEqual({ hinted: 'undo', inert: 0, hints: 2 });
    h = nextHelp(nextHelp(h, 'changed', null), 'ask', null);
    expect(h).toEqual({ hinted: 'undo', inert: 0, hints: 2 });
    // Back on a board that can finish, the glow ends; a later, separate dead end counts once more.
    h = nextHelp(h, 'changed', route);
    expect(h.hinted).toBeNull();
    expect(nextHelp(h, 'changed', null).hints).toBe(3);
    // Asking lights the route's first arrow, or Undo at a dead end.
    expect(nextHelp(NO_HELP, 'ask', route)).toEqual({ hinted: 'left', inert: 0, hints: 1 });
    expect(nextHelp(NO_HELP, 'ask', null).hinted).toBe('undo');
  });
  it('gives each size its own look, growing but never past the cell', () => {
    const colors = [2, 4, 8, 16, 32, 64, 128].map((v) => sizeLook(v).color);
    expect(new Set(colors.slice(1)).size).toBe(6);
    for (let v = 2; v <= 128; v *= 2) {
      expect(sizeLook(v).radius).toBeLessThanOrEqual(42);
      if (v > 2) expect(sizeLook(v).radius).toBeGreaterThan(sizeLook(v / 2).radius);
    }
    // At its 1.15 pop the largest ball still sits inside the 98-unit inset cell (108 drawn units per cell).
    expect(sizeLook(128).radius * 1.15).toBeLessThanOrEqual(49);
    // Only the 128 wears the snowman's coal eyes.
    expect([2, 4, 8, 16, 32, 64, 128].filter((v) => sizeLook(v).face)).toEqual([128]);
  });
});
