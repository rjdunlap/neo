import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import { POOLS } from './boards';
import {
  botTarget,
  clear,
  drops,
  fall,
  hintFor,
  ICE,
  iced,
  makePuzzle,
  matches,
  moves,
  neighbors,
  PLANS,
  solve,
  STONE,
  swap,
  type Board,
  type Swap,
} from './logic';

/** Independent breadth-first oracle, as a check on the game's shortest-route DFS. */
function breadthFirst(board: Board, size: number): number | null {
  let frontier: Board[] = [board];
  const seen = new Set([board.join(',')]);
  for (let depth = 0; frontier.length; depth++) {
    const next: Board[] = [];
    for (const b of frontier) {
      if (clear(b)) return depth;
      for (const pair of moves(b, size)) {
        const out = swap(b, size, pair)!.board,
          key = out.join(',');
        if (!seen.has(key)) {
          seen.add(key);
          next.push(out);
        }
      }
    }
    frontier = next;
  }
  return null;
}
describe('Gem Swap', () => {
  it('removes long lines and intersections once, without wrapping at an edge', () => {
    expect(matches([0, 0, 0, 0, -1, -1, -1, -1, -1], 3)).toEqual([0, 1, 2]);
    const cross = [-1, 0, -1, 0, 0, 0, -1, 0, -1];
    expect(matches(cross, 3)).toEqual([1, 3, 4, 5, 7]);
    expect(matches([-1, 0, 0, 0, -1, -1, -1, -1, -1], 3)).toEqual([]);
    expect(matches([0, 0, 0, 0, ...Array(12).fill(-1)], 4)).toEqual([0, 1, 2, 3]);
  });
  it('preserves the order of falling gems and adds no new ones', () => {
    expect(fall([1, -1, 2, -1, -1, -1, 3, 4, -1], 3)).toEqual([-1, -1, -1, 1, -1, -1, 3, 4, 2]);
  });
  it('rejects non-neighbours, holes, equal gems and swaps that make no line without changing the board', () => {
    const b = [-1, -1, -1, 0, 1, 2, 1, 2, 0],
      saved = [...b];
    for (const pair of [
      [2, 3],
      [3, 8],
      [0, 3],
      [3, 4],
    ] as Swap[])
      expect(swap(b, 3, pair)).toBeNull();
    expect(neighbors(2, 3, 3)).toBe(false);
    expect(neighbors(-1, 0, 3)).toBe(false);
    expect(b).toEqual(saved);
    expect(swap([0, 0, 1, 1], 2, [0, 1])).toBeNull();
  });
  it('has at least twenty stable compact boards per plan with exact pars, no initial matches and the stated gem counts', () => {
    POOLS.forEach((pool, p) => {
      expect(pool.length).toBeGreaterThanOrEqual(20);
      for (const puzzle of pool) {
        const size = PLANS[p].size;
        expect(matches(puzzle.board, size)).toEqual([]);
        expect(fall(puzzle.board, size)).toEqual(puzzle.board);
        expect(puzzle.board.filter((k) => k >= 0)).toHaveLength(PLANS[p].gems);
        expect(breadthFirst(puzzle.board, size)).toBe(puzzle.par);
        expect(solve(puzzle.board, size)).toHaveLength(puzzle.par);
      }
    });
  });
  it('builds deterministic varied boards and every hint/bot swap reduces the exact remaining par', () => {
    for (let level = 1; level <= PLANS.length; level++) {
      const variants = new Set<string>();
      for (let seed = 1; seed <= 120; seed++) {
        const puzzle = makePuzzle(level, new Rng(seed));
        expect(puzzle).toEqual(makePuzzle(level, new Rng(seed)));
        variants.add(puzzle.board.join(','));
        let b: Board = puzzle.board;
        let remaining = puzzle.par;
        while (!clear(b)) {
          const route = solve(b, puzzle.size)!,
            pair = hintFor(b, puzzle.size)!;
          expect(route).toHaveLength(remaining);
          expect(botTarget(route, null)).toBe(pair[0]);
          expect(botTarget(route, pair[0])).toBe(pair[1]);
          expect(botTarget(route, pair[1])).toBe(pair[0]);
          const step = swap(b, puzzle.size, pair)!;
          expect(step.waves.length).toBeGreaterThan(0);
          expect(matches(step.board, puzzle.size)).toEqual([]);
          expect(step.board.filter((k) => k >= 0).length).toBeLessThan(b.filter((k) => k >= 0).length);
          b = step.board;
          remaining--;
        }
        expect(remaining).toBe(0);
      }
      expect(variants.size).toBeGreaterThan(60);
    }
  });
  it('gives every generated tray above level 1 a dead-end first swap and a falling line on some shortest route', () => {
    // The first three trays of each level are the hand-made originals; the script's trays follow.
    POOLS.slice(1).forEach((pool) =>
      pool.slice(3).forEach((puzzle) => {
        const size = Math.sqrt(puzzle.board.length);
        const left = (b: Board) => solve(b, size)?.length ?? null;
        const cascades = (b: Board, n: number): boolean =>
          n > 0 &&
          moves(b, size).some((pair) => {
            const step = swap(b, size, pair)!;
            return left(step.board) === n - 1 && (step.waves.length > 1 || cascades(step.board, n - 1));
          });
        expect(
          moves(puzzle.board, size).some((pair) => left(swap(puzzle.board, size, pair)!.board) === null),
        ).toBe(true);
        expect(cascades(puzzle.board, puzzle.par)).toBe(true);
      }),
    );
  });
  it('keeps the hint search on the six-by-six trays across all six columns and under a node budget from every state on the stored route', () => {
    // A tray's search memoises every tray reachable from it, so the opening count also bounds every later revision.
    expect(PLANS[4]).toMatchObject({ size: 6, gems: 24 });
    for (const puzzle of POOLS[4]) {
      expect(puzzle.par).toBe(5);
      for (let x = 0; x < 6; x++) expect(puzzle.board.some((k, i) => i % 6 === x && k >= 0)).toBe(true);
      let b: Board = puzzle.board;
      while (!clear(b)) {
        const stats = { nodes: 0 },
          route = solve(b, 6, stats)!;
        expect(stats.nodes).toBeLessThan(2000);
        b = swap(b, 6, route[0])!.board;
      }
    }
  });
  it('makes every shortest route at level 6 use a swap that clears a long line or a crossing', () => {
    expect(PLANS[5]).toMatchObject({ size: 5, gems: 20 });
    const pool = POOLS[5];
    expect(pool.filter((t) => t.par === 3)).toHaveLength(10);
    expect(pool.filter((t) => t.par === 4)).toHaveLength(10);
    // Independent of the generator: four in a row anywhere, or one gem at the middle-or-end of both an across and a down three.
    const same = (b: Board, cells: number[]) => cells.every((c) => b[c] >= 0 && b[c] === b[cells[0]]);
    const run = (i: number, d: number, n: number) => Array.from({ length: n }, (_, k) => i + k * d);
    const fits = (i: number, d: number, n: number) =>
      d === 1 ? (i % 5) + n <= 5 : Math.floor(i / 5) + n <= 5;
    const threesThrough = (b: Board, c: number, d: number) =>
      [0, 1, 2].some((back) => {
        const start = c - back * d;
        return (
          start >= 0 &&
          (d === 5 || Math.floor(start / 5) === Math.floor(c / 5)) &&
          fits(start, d, 3) &&
          same(b, run(start, d, 3))
        );
      });
    const long = (b: Board, pair: Swap) => {
      const after = swap(b, 5, pair)!.waves[0].board;
      return after.some(
        (_, i) =>
          [1, 5].some((d) => fits(i, d, 4) && same(after, run(i, d, 4))) ||
          (after[i] >= 0 && threesThrough(after, i, 1) && threesThrough(after, i, 5)),
      );
    };
    for (const puzzle of pool) {
      expect(breadthFirst(puzzle.board, 5)).toBe(puzzle.par);
      // Enumerate every shortest route: a route that never makes a long swap would be a counterexample.
      const shortCut = (b: Board, left: number): boolean =>
        left === 0
          ? clear(b)
          : moves(b, 5).some((pair) => {
              const after = swap(b, 5, pair)!.board;
              return !long(b, pair) && breadthFirst(after, 5) === left - 1 && shortCut(after, left - 1);
            });
      expect(shortCut(puzzle.board, puzzle.par)).toBe(false);
      expect(
        moves(puzzle.board, 5).some((pair) => breadthFirst(swap(puzzle.board, 5, pair)!.board, 5) === null),
      ).toBe(true);
      // The hint follows a shortest route, so it reaches the long swap; its search stays small from every state on it.
      let b: Board = puzzle.board,
        used = false;
      while (!clear(b)) {
        const stats = { nodes: 0 },
          route = solve(b, 5, stats)!;
        expect(stats.nodes).toBeLessThan(2000);
        used ||= long(b, route[0]);
        b = swap(b, 5, route[0])!.board;
      }
      expect(used).toBe(true);
    }
  });
  it('lets a stone split its column at level 7: each segment keeps its order and no stone moves, swaps or clears', () => {
    // Column 0 of a 3×3: a gem over a stone over a hole; column 1: two gems with a hole between; column 2: a stone on top.
    const b = [1, 2, STONE, STONE, -1, 3, -1, 4, -1];
    expect(fall(b, 3)).toEqual([1, -1, STONE, STONE, 2, -1, -1, 4, 3]);
    expect(drops(b, [], 3)).toEqual([0, -1, -1, -1, 0, -1, -1, 2, 1]);
    expect(swap([STONE, 0, 0, 0, -1, -1, -1, -1, -1], 3, [0, 3])).toBeNull();
    expect(swap([0, STONE, 0, -1, 0, -1, -1, -1, -1], 3, [1, 4])).toBeNull();
    expect(matches([STONE, STONE, STONE, -1, -1, -1, -1, -1, -1], 3)).toEqual([]);
    expect(clear([STONE, -1, -1, -1, STONE, -1, -1, -1, -1])).toBe(true);
    expect(PLANS[6]).toMatchObject({ size: 5, gems: 15 });
    for (const puzzle of POOLS[6]) {
      const stones = puzzle.board.flatMap((k, i) => (k === STONE ? [i] : []));
      expect(puzzle.par).toBe(4);
      expect(stones).toHaveLength(2);
      // Stones sit in the middle rows of two columns, a gem rests on each, and some column has gems on both sides.
      expect(new Set(stones.map((i) => i % 5)).size).toBe(2);
      for (const i of stones) {
        expect([2, 3]).toContain(Math.floor(i / 5));
        expect(puzzle.board[i - 5]).toBeGreaterThanOrEqual(0);
      }
      expect(stones.some((i) => puzzle.board.some((k, j) => j % 5 === i % 5 && j > i && k >= 0))).toBe(true);
      // The pool's stones survive mirroring and recolouring.
      for (let seed = 1; seed <= 4; seed++)
        expect(makePuzzle(7, new Rng(seed)).board.filter((k) => k === STONE)).toHaveLength(2);
      // Along every shortest route the stones stay put, and the hint search stays under budget.
      const walk = (b: Board) => {
        const stats = { nodes: 0 },
          route = solve(b, 5, stats);
        expect(stats.nodes).toBeLessThan(2000);
        expect(b.flatMap((k, i) => (k === STONE ? [i] : []))).toEqual(stones);
        if (!clear(b))
          for (const pair of moves(b, 5))
            if (solve(swap(b, 5, pair)!.board, 5)?.length === route!.length - 1)
              walk(swap(b, 5, pair)!.board);
      };
      walk(puzzle.board);
    }
  });
  it('gives levels 1–6 the same fall as the stone-free gravity they were built with', () => {
    const plain = (board: Board, size: number) => {
      const out = Array<number>(size * size).fill(-1);
      for (let x = 0; x < size; x++) {
        const column = Array.from({ length: size }, (_, y) => board[y * size + x]).filter((k) => k >= 0);
        column.forEach((k, y) => (out[(size - column.length + y) * size + x] = k));
      }
      return out;
    };
    POOLS.slice(0, 6).forEach((pool) =>
      pool.forEach((puzzle) => {
        const size = Math.sqrt(puzzle.board.length);
        expect(puzzle.board.every((k) => k !== STONE)).toBe(true);
        const seen = new Set<string>();
        const visit = (b: Board) => {
          if (seen.has(b.join())) return;
          seen.add(b.join());
          for (const pair of moves(b, size))
            for (const wave of swap(b, size, pair)!.waves) {
              const removed = wave.board.map((k, i) => (wave.removed.includes(i) ? -1 : k));
              expect(fall(removed, size)).toEqual(plain(removed, size));
            }
          for (const pair of moves(b, size)) visit(swap(b, size, pair)!.board);
        };
        visit(puzzle.board);
      }),
    );
  });
  it('freezes an iced gem at level 8: it makes lines and falls with its ice, but never swaps until a line clears beside it', () => {
    const I = (k: number) => k + ICE;
    // Refused as either side of a swap, even when the swap would make a line; the board is untouched.
    const frozen = [-1, -1, -1, 1, 0, 0, I(0), 1, 1];
    expect(swap(frozen, 3, [3, 6])).toBeNull();
    expect(swap(frozen, 3, [6, 3])).toBeNull();
    expect(moves(frozen, 3)).toEqual([]);
    // An iced gem still completes a line of its kind (and goes with it).
    expect(matches([I(2), 2, 2, -1, -1, -1, -1, -1, -1], 3)).toEqual([0, 1, 2]);
    // A line cleared beside it thaws it (8, above the line); a diagonal neighbour stays iced (11); ice falls with its gem.
    const empty = Array<number>(8).fill(-1);
    const step = swap([...empty, I(5), 0, 2, I(4), 0, 3, 0, 1], 4, [9, 13])!;
    expect(step.waves).toHaveLength(1);
    expect(step.waves[0].board[8]).toBe(I(5));
    expect(step.board).toEqual([...empty, -1, -1, -1, I(4), 5, 3, 2, 1]);
    // In a cascade, the falling line thaws what is beside it: 11 is diagonal to the first line, above the second.
    const cascade = swap([...empty, 3, 1, 0, I(2), 0, 0, 1, 1], 4, [10, 14])!;
    expect(cascade.waves.map((w) => w.removed)).toEqual([
      [12, 13, 14],
      [13, 14, 15],
    ]);
    expect(cascade.waves[1].board[11]).toBe(I(2));
    expect(cascade.board).toEqual([...empty, -1, -1, -1, -1, 3, -1, -1, 2]);
  });
  it('gives level 8 two iced gems per tray that cost exactly one swap, with pars checked by an independent ice rule', () => {
    // An independent rule set: kinds and ice kept apart, thaw by a fresh neighbour scan, gravity by columns.
    const refSwap = (kinds: number[], ice: boolean[], size: number, a: number, b: number) => {
      if (kinds[a] < 0 || kinds[b] < 0 || ice[a] || ice[b] || kinds[a] === kinds[b]) return null;
      if (Math.abs((a % size) - (b % size)) + Math.abs(Math.floor(a / size) - Math.floor(b / size)) !== 1)
        return null;
      let k = [...kinds],
        c = [...ice];
      [k[a], k[b]] = [k[b], k[a]];
      for (let first = true; ; first = false) {
        const gone = new Set<number>();
        for (let y = 0; y < size; y++)
          for (let x = 0; x < size; x++) {
            const at = y * size + x;
            if (k[at] < 0) continue;
            if (x + 2 < size && k[at + 1] === k[at] && k[at + 2] === k[at])
              [0, 1, 2].forEach((o) => gone.add(at + o));
            if (y + 2 < size && k[at + size] === k[at] && k[at + 2 * size] === k[at])
              [0, 1, 2].forEach((o) => gone.add(at + o * size));
          }
        if (!gone.size) return first ? null : { k, c };
        for (let at = 0; at < k.length; at++) {
          const x = at % size,
            y = Math.floor(at / size);
          const beside = [
            [x - 1, y],
            [x + 1, y],
            [x, y - 1],
            [x, y + 1],
          ].some(([nx, ny]) => nx >= 0 && ny >= 0 && nx < size && ny < size && gone.has(ny * size + nx));
          if (c[at] && beside && !gone.has(at)) c[at] = false;
        }
        const nk = Array<number>(k.length).fill(-1),
          nc = Array<boolean>(k.length).fill(false);
        for (let x = 0; x < size; x++) {
          let floor = size - 1;
          for (let y = size - 1; y >= 0; y--) {
            const at = y * size + x;
            if (k[at] < 0 || gone.has(at)) continue;
            nk[floor * size + x] = k[at];
            nc[floor-- * size + x] = c[at];
          }
        }
        k = nk;
        c = nc;
      }
    };
    const refPar = (board: Board, size: number, ignoreIce = false) => {
      let frontier = [
        { k: board.map((v) => (v < 0 ? v : v % ICE)), c: board.map((v) => !ignoreIce && iced(v)) },
      ];
      const seen = new Set<string>();
      for (let depth = 0; frontier.length; depth++) {
        const next: typeof frontier = [];
        for (const s of frontier) {
          if (s.k.every((v) => v < 0)) return depth;
          for (let a = 0; a < s.k.length; a++)
            for (const b of [a + 1, a + size]) {
              const out = b < s.k.length ? refSwap(s.k, s.c, size, a, b) : null,
                key = out && `${out.k}|${out.c}`;
              if (out && !seen.has(key!)) {
                seen.add(key!);
                next.push(out);
              }
            }
        }
        frontier = next;
      }
      return null;
    };
    expect(PLANS[7]).toMatchObject({ size: 5, gems: 15 });
    POOLS.slice(0, 7).forEach((pool) => pool.forEach((t) => expect(t.board.some(iced)).toBe(false)));
    for (const puzzle of POOLS[7]) {
      expect(puzzle.par).toBe(4);
      expect(puzzle.board.filter(iced)).toHaveLength(2);
      expect(puzzle.board.every((k) => k < ICE + 6 && k !== STONE)).toBe(true);
      expect(refPar(puzzle.board, 5)).toBe(4);
      // The ice is not decoration: thawed from the start, the tray clears in one swap fewer.
      expect(refPar(puzzle.board, 5, true)).toBe(3);
      // The hint search stays under budget from every state on the hinted route.
      let b: Board = puzzle.board;
      while (!clear(b)) {
        const stats = { nodes: 0 },
          route = solve(b, 5, stats)!;
        expect(stats.nodes).toBeLessThan(2000);
        b = swap(b, 5, route[0])!.board;
      }
    }
    // Mirroring and recolouring keep both iced gems and a valid kind under each.
    for (let seed = 1; seed <= 20; seed++) {
      const board = makePuzzle(8, new Rng(seed)).board;
      expect(board.filter(iced)).toHaveLength(2);
      expect(board.every((k) => k < ICE + 6)).toBe(true);
    }
  });
  it('tells the drawing which row each surviving gem fell from', () => {
    for (const pool of POOLS)
      for (const puzzle of pool) {
        const size = Math.sqrt(puzzle.board.length);
        for (const pair of moves(puzzle.board, size))
          for (const wave of swap(puzzle.board, size, pair)!.waves) {
            const after = fall(
              wave.board.map((k, i) => (wave.removed.includes(i) ? -1 : k)),
              size,
            );
            drops(wave.board, wave.removed, size).forEach((from, i) => {
              if (from < 0) {
                // An empty cell, or a stone that stays where it was.
                expect(after[i]).toBe(wave.board[i] === STONE ? STONE : -1);
                return;
              }
              expect(after[i]).toBe(wave.board[from * size + (i % size)]);
              expect(from).toBeLessThanOrEqual(Math.floor(i / size));
            });
          }
      }
  });
  it('supports alternatives and identifies dead ends rather than recommending an arbitrary match', () => {
    let deadEnds = 0,
      alternatives = 0,
      cascades = 0;
    for (const pool of POOLS)
      for (const puzzle of pool) {
        const size = Math.sqrt(puzzle.board.length);
        for (const pair of moves(puzzle.board, size)) {
          const step = swap(puzzle.board, size, pair)!;
          if (solve(step.board, size) === null) {
            deadEnds++;
            expect(hintFor(step.board, size)).toBeNull();
          } else alternatives++;
          if (step.waves.length > 1) cascades++;
        }
      }
    expect(deadEnds).toBeGreaterThan(0);
    expect(alternatives).toBeGreaterThan(12);
    expect(cascades).toBeGreaterThan(0);
    expect(botTarget([[1, 2]], 3)).toBe(3);
  });
});
