import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import { FULL, HOLES, JUMPS, count, jump, makeBoard, marblesFor, moves, recovery, solve } from './logic';

describe('Marble Jump', () => {
  it('jumps along the six straight lattice directions, over exactly one hole', () => {
    expect(HOLES).toHaveLength(15);
    expect(JUMPS).toHaveLength(36);
    for (const j of JUMPS) {
      const a = HOLES[j.from], b = HOLES[j.over], c = HOLES[j.to];
      expect(b.row * 2).toBe(a.row + c.row);
      expect(b.col * 2).toBe(a.col + c.col);
      const board = (1 << j.from) | (1 << j.over);
      expect(jump(board, j)).toBe(1 << j.to);
      expect(jump(board | (1 << j.to), j)).toBe(board | (1 << j.to));
      expect(jump(1 << j.from, j)).toBe(1 << j.from);
    }
  });
  it('produces seeded, solvable boards with the stated ladder size', () => {
    const variety = new Set<number>();
    for (let level = 1; level <= 6; level++) for (let seed = 1; seed <= 80; seed++) {
      let board = makeBoard(level, new Rng(seed)); variety.add(board);
      expect(board).toBe(makeBoard(level, new Rng(seed)));
      expect(count(board)).toBe(marblesFor(level));
      const route = solve(board);
      expect(route).not.toBeNull();
      expect(route).toHaveLength(marblesFor(level) - 1);
      for (const j of route!) { expect(moves(board)).toContainEqual(j); board = jump(board, j); }
      expect(count(board)).toBe(1);
    }
    expect(variety.size).toBeGreaterThan(20);
  });
  it('agrees with independent reachability for every triangular board', () => {
    const can = new Uint8Array(FULL + 1);
    for (let n = 1; n <= 15; n++) for (let board = 1; board <= FULL; board++) {
      if (count(board) !== n) continue;
      if (n === 1) can[board] = 1;
      else for (const j of JUMPS) {
        const from = 1 << j.from, over = 1 << j.over, to = 1 << j.to;
        if ((board & from) && (board & over) && !(board & to) && can[board - from - over + to]) can[board] = 1;
      }
      expect(solve(board) !== null, `board ${board}`).toBe(!!can[board]);
    }
    expect(solve(0)).toBeNull();
  });
  it('returns the nearest recoverable history entry and rejects non-jumps', () => {
    const good = makeBoard(6, new Rng(3));
    const bad = (1 << 0) | (1 << 14);
    expect(solve(bad)).toBeNull();
    expect(recovery([good, bad, good, bad])).toBe(2);
    expect(recovery([bad])).toBeNull();
    expect(jump(good, { from: 0, over: 1, to: 14 })).toBe(good);
  });
});
