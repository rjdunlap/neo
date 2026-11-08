import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import {
  ANY,
  FULL,
  HOLES,
  JUMPS,
  carry,
  count,
  hasTrap,
  jump,
  makeBoard,
  makeRound,
  marblesFor,
  moves,
  movesIn,
  fewestMoves,
  occupied,
  paint,
  poolFor,
  reachable,
  recovery,
  solve,
  starPairs,
  type Jump,
} from './logic';

/** The triangle's six rotations and reflections permute the three corner distances of a hole. */
const corners = HOLES.map((h) => [h.row - h.col, h.col, 4 - h.row]);
const PERMS = [
  [0, 1, 2],
  [0, 2, 1],
  [1, 0, 2],
  [1, 2, 0],
  [2, 0, 1],
  [2, 1, 0],
];
function canonical(board: number): number {
  return Math.min(
    ...PERMS.map((p) =>
      HOLES.reduce((b, _, i) => {
        if (!occupied(board, i)) return b;
        const c = corners[i],
          to = corners.findIndex((d) => d[0] === c[p[0]] && d[1] === c[p[1]] && d[2] === c[p[2]]);
        return b | (1 << to);
      }, 0),
    ),
  );
}

describe('Marble Jump', () => {
  it('jumps along the six straight lattice directions, over exactly one hole', () => {
    expect(HOLES).toHaveLength(15);
    expect(JUMPS).toHaveLength(36);
    for (const j of JUMPS) {
      const a = HOLES[j.from],
        b = HOLES[j.over],
        c = HOLES[j.to];
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
    for (let level = 1; level <= 6; level++)
      for (let seed = 1; seed <= 80; seed++) {
        let board = makeBoard(level, new Rng(seed));
        variety.add(board);
        expect(board).toBe(makeBoard(level, new Rng(seed)));
        expect(count(board)).toBe(marblesFor(level));
        const route = solve(board);
        expect(route).not.toBeNull();
        expect(route).toHaveLength(marblesFor(level) - 1);
        for (const j of route!) {
          expect(moves(board)).toContainEqual(j);
          board = jump(board, j);
        }
        expect(count(board)).toBe(1);
      }
    expect(variety.size).toBeGreaterThan(20);
  });
  it('draws from every reachable clearing board, with a trap on levels 2–5', () => {
    const pools = reachable();
    expect([3, 5, 7, 9, 11].map((n) => pools.get(n)!.length)).toEqual([72, 456, 1002, 765, 192]);
    expect([3, 5, 7, 9, 11].map((n) => pools.get(n)!.filter(hasTrap).length)).toEqual([
      36, 378, 933, 723, 177,
    ]);
    expect(pools.get(14)).toHaveLength(15);
    expect(new Set(poolFor(1).map(canonical)).size).toBe(12);
    for (let level = 1; level <= 6; level++) {
      const seen = new Set<number>();
      for (let seed = 1; seed <= 80; seed++) {
        const board = makeBoard(level, new Rng(seed));
        seen.add(board);
        expect(poolFor(level)).toContain(board);
        if (level >= 2 && level <= 5) expect(hasTrap(board), `level ${level} seed ${seed}`).toBe(true);
      }
      if (level <= 5) expect(seen.size, `level ${level}`).toBeGreaterThanOrEqual(12);
      if (level === 1) expect(new Set([...seen].map(canonical)).size).toBeGreaterThanOrEqual(6);
    }
  });
  it("keeps each marble's colour as it jumps and pockets the jumped colour", () => {
    const board = makeBoard(4, new Rng(7)),
      colors = paint(board, new Rng(7));
    HOLES.forEach((_, i) => expect(colors[i] >= 0).toBe(occupied(board, i)));
    const j = moves(board)[0],
      { colors: after, taken } = carry(colors, j);
    expect(after[j.to]).toBe(colors[j.from]);
    expect(taken).toBe(colors[j.over]);
    HOLES.forEach((_, i) => expect(after[i] >= 0).toBe(occupied(jump(board, j), i)));
  });
  it('agrees with independent reachability for every triangular board', () => {
    const can = new Uint8Array(FULL + 1);
    for (let n = 1; n <= 15; n++)
      for (let board = 1; board <= FULL; board++) {
        if (count(board) !== n) continue;
        if (n === 1) can[board] = 1;
        else
          for (const j of JUMPS) {
            const from = 1 << j.from,
              over = 1 << j.over,
              to = 1 << j.to;
            if (board & from && board & over && !(board & to) && can[board - from - over + to])
              can[board] = 1;
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
  it('keeps the level 1–6 rounds exactly as before, with no goal', () => {
    let hash = 7;
    for (let level = 1; level <= 6; level++)
      for (let seed = 1; seed <= 40; seed++) {
        const round = makeRound(level, new Rng(seed));
        expect(round.goal).toBe(ANY);
        hash = (hash * 31 + round.board) % 2147483647;
      }
    expect(hash).toBe(1560790864);
  });
  it('agrees with independent reachability for every board and goal hole', () => {
    for (let goal = 0; goal < 15; goal++) {
      const can = new Uint8Array(FULL + 1);
      can[1 << goal] = 1;
      for (let n = 2; n <= 15; n++)
        for (let board = 1; board <= FULL; board++) {
          if (count(board) !== n) continue;
          for (const j of moves(board)) if (can[jump(board, j)]) can[board] = 1;
        }
      for (let board = 1; board <= FULL; board++)
        if (count(board) >= 1)
          expect(solve(board, goal) !== null, `board ${board} goal ${goal}`).toBe(!!can[board]);
    }
  });
  it('seeds level 7 with a classic start whose star the solver reaches', () => {
    const pairs = starPairs();
    // 12 of the 15 starts can finish where they started; the three inner holes cannot.
    expect(pairs.filter((p) => p.board === (FULL ^ (1 << p.goal)))).toHaveLength(12);
    const seen = new Set<string>();
    for (let seed = 1; seed <= 80; seed++) {
      const round = makeRound(7, new Rng(seed));
      expect(round).toEqual(makeRound(7, new Rng(seed)));
      expect(count(round.board)).toBe(14);
      expect(round.goal).toBeGreaterThanOrEqual(0);
      seen.add(`${round.board}:${round.goal}`);
      let board = round.board;
      for (const j of solve(board, round.goal)!) board = jump(board, j);
      expect(board).toBe(1 << round.goal);
    }
    expect(seen.size).toBeGreaterThanOrEqual(20);
  });
  it('recovers to the nearest board that can still finish on the star', () => {
    const { board, goal } = makeRound(7, new Rng(5));
    // Play a legal route to one marble anywhere but the star.
    function off(b: number): Jump[] | null {
      if (count(b) === 1) return b === 1 << goal ? null : [];
      for (const j of moves(b)) {
        if (solve(jump(b, j)) === null) continue;
        const rest = off(jump(b, j));
        if (rest) return [j, ...rest];
      }
      return null;
    }
    const route = off(board)!;
    expect(route).toHaveLength(13);
    const history = [board];
    for (const j of route) history.push(jump(history.at(-1)!, j));
    expect(solve(history.at(-1)!, goal)).toBeNull();
    expect(solve(history.at(-1)!)).toEqual([]);
    const back = recovery(history, goal)!;
    expect(solve(history[back], goal)).not.toBeNull();
    for (let i = back + 1; i < history.length; i++) expect(solve(history[i], goal)).toBeNull();
    expect(recovery(history)).toBe(history.length - 1);
  });
  it('counts a chain by one marble as one move, and finds the exact fewest', () => {
    const a: Jump = { from: 0, over: 1, to: 3 },
      b: Jump = { from: 3, over: 4, to: 5 },
      c: Jump = { from: 12, over: 8, to: 5 };
    expect(movesIn([])).toBe(0);
    expect(movesIn([a, b])).toBe(1);
    expect(movesIn([a, c])).toBe(2);
    expect(movesIn([a, b, c])).toBe(2);
    // Brute force over every clearing route on small boards.
    function brute(board: number, goal: number, route: Jump[] = []): number | null {
      if (count(board) === 1) return goal === ANY || board === 1 << goal ? movesIn(route) : null;
      let low: number | null = null;
      for (const j of moves(board)) {
        const r = brute(jump(board, j), goal, [...route, j]);
        if (r !== null && (low === null || r < low)) low = r;
      }
      return low;
    }
    for (const level of [1, 2, 3])
      for (let seed = 1; seed <= 25; seed++) {
        const board = makeBoard(level, new Rng(seed));
        expect(fewestMoves(board), `level ${level} seed ${seed}`).toBe(brute(board, ANY));
        for (const goal of [0, 4, 12]) expect(fewestMoves(board, goal)).toBe(brute(board, goal));
      }
    expect(fewestMoves((1 << 0) | (1 << 14))).toBeNull();
  });
  it('works out the fewest moves on a full triangle quickly, never above the jump count', () => {
    const started = performance.now();
    for (const { board, goal } of starPairs().slice(0, 15)) {
      const fewest = fewestMoves(board, goal)!;
      expect(fewest).toBeGreaterThan(0);
      expect(fewest).toBeLessThanOrEqual(movesIn(solve(board, goal)!));
    }
    expect(performance.now() - started).toBeLessThan(3000);
  });
});
