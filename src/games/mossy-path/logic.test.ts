import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import {
  adjacent,
  BERRIES,
  berriesOf,
  completion,
  deadEnd,
  flipBoard,
  leafSpots,
  pickLook,
  PLANS,
  PATCHES,
  THICK,
  bloomedCount,
  needOf,
  routeLength,
  visitsOf,
  countsMiss,
  isMaze,
  LEVELS,
  levelName,
  plansFor,
  SEASONS,
  transformPlan,
  goalOf,
  helpFor,
  hintPlan,
  isPlanLevel,
  planGo,
  planTouch,
  makeBoard,
  mainline,
  MAZES,
  mazeBack,
  mazeRestart,
  mazeStart,
  mazeTouch,
  moveError,
  nextToward,
  neighbours,
  parseMaze,
  routeBetween,
  solved,
  step,
  validPath,
  type Board,
  type MazeState,
} from './logic';

describe('Mossy Path', () => {
  it('makes reproducible, solvable boards with distinct tiles and real adjacent routes at every level', () => {
    for (let level = 1; level <= 3; level++)
      for (let seed = 1; seed <= 100; seed++) {
        const b = makeBoard(level, new Rng(seed));
        expect(b).toEqual(makeBoard(level, new Rng(seed)));
        expect(new Set(b.tiles).size).toBe(b.tiles.length);
        expect(b.tiles.every((i) => i >= 0 && i < b.rows * b.cols)).toBe(true);
        const route = completion(b, [b.start]);
        expect(route).not.toBeNull();
        let path = [b.start];
        for (const at of route!) {
          expect(helpFor(b, path)?.undo).toBe(0);
          path = step(b, path, at)!;
        }
        expect(solved(b, path)).toBe(true);
      }
  });
  it('rejects row wrapping, revisits and reaching the pond before the last tile', () => {
    const b = { rows: 3, cols: 4, tiles: Array.from({ length: 12 }, (_, i) => i), start: 0, pond: 11 };
    expect(moveError(b, [0, 1, 2, 3], 4)).toBe('far');
    expect(moveError(b, [0, 1], 0)).toBe('visited');
    expect(moveError(b, [0, 1, 2, 3, 7], 11)).toBe('pond');
    expect(step(b, [0], 8)).toBeNull();
    expect(solved(b, [0, 11])).toBe(false);
    expect(validPath(b, [0, 1, 0])).toBe(false);
  });
  it('accepts alternative complete routes rather than comparing with a hidden answer', () => {
    const b = { rows: 3, cols: 4, tiles: Array.from({ length: 12 }, (_, i) => i), start: 0, pond: 11 };
    expect(solved(b, [0, 1, 2, 3, 7, 6, 5, 4, 8, 9, 10, 11])).toBe(true);
    expect(solved(b, [0, 4, 8, 9, 5, 1, 2, 3, 7, 6, 10, 11])).toBe(true);
  });
  it('recovers from every legal experimental prefix, with the fewest undos and a completing next tile', () => {
    const b = makeBoard(3, new Rng(7));
    let deadEnds = 0;
    const visit = (path: number[]) => {
      if (solved(b, path)) return;
      const help = helpFor(b, path)!;
      expect(help).not.toBeNull();
      const prefix = path.slice(0, path.length - help.undo);
      expect(completion(b, prefix)).not.toBeNull();
      expect(completion(b, step(b, prefix, help.next)!)).not.toBeNull();
      if (help.undo) {
        deadEnds++;
        expect(completion(b, path.slice(0, prefix.length + 1))).toBeNull();
      }
      for (const at of b.tiles) {
        const next = step(b, path, at);
        if (next) visit(next);
      }
    };
    visit([b.start]);
    expect(deadEnds).toBeGreaterThan(0);
  });
});

const SYMMETRIES = [false, true].flatMap((fx) =>
  [false, true].flatMap((fy) => [false, true].map((t) => [fx, fy, t] as const)),
);
/** Every complete route from the start, by brute force (at most 16 tiles). */
function routeCount(b: Board): number {
  let n = 0;
  const go = (path: number[]) => {
    if (solved(b, path)) {
      n++;
      return;
    }
    for (const at of b.tiles) {
      const next = step(b, path, at);
      if (next) go(next);
    }
  };
  go([b.start]);
  return n;
}
const sameBoard = (a: Board, z: Board) =>
  a.rows === z.rows &&
  a.cols === z.cols &&
  a.start === z.start &&
  a.pond === z.pond &&
  [...a.tiles].sort((x, y) => x - y).join() === [...z.tiles].sort((x, y) => x - y).join();

describe('Mossy Path levels 1-3 plans', () => {
  it('has three plans per level, each within 4 × 4, completing from the start under every symmetry with 100-unit cells', () => {
    for (const [index, set] of PLANS.entries()) {
      expect(set, `level ${index + 1}`).toHaveLength(3);
      for (const [n, p] of set.entries())
        for (const [fx, fy, t] of SYMMETRIES) {
          const b = transformPlan(p, fx, fy, t),
            label = `level ${index + 1} plan ${n} ${fx} ${fy} ${t}`;
          expect(b.rows * b.cols, label).toBeLessThanOrEqual(16);
          expect(Math.max(b.rows, b.cols), label).toBeLessThanOrEqual(4);
          expect(new Set(b.tiles).size, label).toBe(b.tiles.length);
          expect(b.tiles.includes(b.start) && b.tiles.includes(b.pond) && b.start !== b.pond, label).toBe(
            true,
          );
          expect(Math.min(132, (768 - 330) / b.rows, (1024 - 320) / b.cols), label).toBeGreaterThanOrEqual(
            100,
          );
          const route = completion(b, [b.start]);
          expect(route, label).not.toBeNull();
          let path = [b.start];
          for (const at of route!) {
            expect(helpFor(b, path)?.undo, label).toBe(0);
            path = step(b, path, at)!;
          }
          expect(solved(b, path), label).toBe(true);
        }
    }
  });
  it('keeps level 1 a corridor and gives each later plan a real choice of complete routes', () => {
    for (const p of PLANS[0]) expect(routeCount(transformPlan(p, false, false, false))).toBe(1);
    for (const p of PLANS[1])
      expect(routeCount(transformPlan(p, false, false, false))).toBeGreaterThanOrEqual(2);
    // The first level-3 plan is the original single-route bottleneck; the added ones each allow two or more.
    for (const p of PLANS[2].slice(1))
      expect(routeCount(transformPlan(p, false, false, false))).toBeGreaterThanOrEqual(2);
  });
  it('plays every plan for some seed, always as an authored plan under one of its symmetries', () => {
    for (let level = 1; level <= 3; level++) {
      const seen = new Set<number>();
      for (let seed = 1; seed <= 200; seed++) {
        const b = makeBoard(level, new Rng(seed));
        const n = PLANS[level - 1].findIndex((p) =>
          SYMMETRIES.some(([fx, fy, t]) => sameBoard(transformPlan(p, fx, fy, t), b)),
        );
        expect(n, `level ${level} seed ${seed}`).toBeGreaterThanOrEqual(0);
        seen.add(n);
      }
      expect(seen.size, `level ${level}`).toBe(3);
    }
  });
});

describe('Mossy Path level 8, a little patch', () => {
  it('has five small boards, each within 3 × 4, completing under every symmetry with large cells', () => {
    expect(PATCHES).toHaveLength(5);
    for (const [n, p] of PATCHES.entries())
      for (const [fx, fy, t] of SYMMETRIES) {
        const b = transformPlan(p, fx, fy, t),
          label = `patch ${n} ${fx} ${fy} ${t}`;
        expect(Math.max(b.rows, b.cols), label).toBeLessThanOrEqual(4);
        expect(Math.min(b.rows, b.cols), label).toBeLessThanOrEqual(3);
        expect(b.tiles.length, label).toBeLessThanOrEqual(9);
        expect(b.start !== b.pond && b.tiles.includes(b.start) && b.tiles.includes(b.pond), label).toBe(true);
        expect(Math.min(132, (768 - 330) / b.rows, (1024 - 320) / b.cols), label).toBeGreaterThanOrEqual(100);
        expect(routeCount(b), label).toBe(routeCount(transformPlan(p, false, false, false)));
        // The bot: follow helpFor's taps from the start; it never needs Undo and finishes with no miss.
        let path = [b.start];
        for (let guard = 0; guard < 12 && !solved(b, path); guard++) {
          const help = helpFor(b, path)!;
          expect(help.undo, label).toBe(0);
          expect(moveError(b, path, help.next), label).toBeNull();
          path = step(b, path, help.next)!;
        }
        expect(solved(b, path), label).toBe(true);
      }
  });
  it('gives every board one or two complete routes, at least one board two', () => {
    const counts = PATCHES.map((p) => routeCount(transformPlan(p, false, false, false)));
    expect(counts.every((c) => c >= 1 && c <= 2)).toBe(true);
    expect(counts).toContain(2);
  });
  it('plays every patch for some seed as a coverage board, never a maze', () => {
    expect(isMaze(8)).toBe(false);
    expect(plansFor(8)).toBe(PATCHES);
    expect(levelName(8)).toBe('A little patch: bloom every tile');
    const seen = new Set<number>();
    for (let seed = 1; seed <= 200; seed++) {
      const b = makeBoard(8, new Rng(seed));
      expect(b.berry).toBeUndefined();
      const n = PATCHES.findIndex((p) =>
        SYMMETRIES.some(([fx, fy, t]) => sameBoard(transformPlan(p, fx, fy, t), b)),
      );
      expect(n, `seed ${seed}`).toBeGreaterThanOrEqual(0);
      seen.add(n);
    }
    expect(seen.size).toBe(PATCHES.length);
  });
  it('never counts a far tap at level 8, and still counts visited and early-pond taps', () => {
    const b = transformPlan(PATCHES[0], false, false, false);
    // 0 1 2 / 3 4 5: from 0, tile 2 is far, 0 is visited, and 5 is the pond.
    expect(moveError(b, [0], 2)).toBe('far');
    expect(countsMiss(8, 'far')).toBe(false);
    expect(countsMiss(8, 'visited')).toBe(true);
    expect(countsMiss(8, 'pond')).toBe(true);
    expect(countsMiss(8, null)).toBe(false);
    for (const level of [1, 2, 3]) expect(countsMiss(level, 'far')).toBe(true);
    expect(moveError(b, [0, 3, 4], 3)).toBe('visited');
    expect(moveError(b, [0, 3, 4], 5)).toBe('pond');
  });
  it('slots 8 after 6 for pre-K and school, and 10 after 2 for school, without changing any first level', () => {
    expect(LEVELS.prek?.order).toEqual([5, 6, 8]);
    expect(LEVELS.school?.order).toEqual([6, 8, 1, 7, 9, 2, 10, 3, 11]);
    expect(LEVELS.toddler).toEqual({ min: 4, max: 4 });
    expect(LEVELS.preschool).toEqual({ min: 4, max: 5 });
  });
});

describe('Mossy Path looks', () => {
  it('picks every season and berry, reproducibly, without changing the board a seed gives', () => {
    const seasons = new Set<string>(),
      berries = new Set<string>();
    for (let seed = 1; seed <= 80; seed++) {
      const rng = new Rng(seed),
        b = makeBoard(6, rng),
        look = pickLook(rng);
      const again = new Rng(seed);
      expect(makeBoard(6, again)).toEqual(b);
      expect(pickLook(again)).toEqual(look);
      seasons.add(look.season);
      berries.add(look.berry);
    }
    expect([...seasons].sort()).toEqual([...SEASONS].sort());
    expect([...berries].sort()).toEqual([...BERRIES].sort());
  });
  it('scatters three to five leaves per hedge, inside the hedge and the same on every redraw', () => {
    for (let at = 0; at < 28; at++) {
      const spots = leafSpots(at);
      expect(spots).toEqual(leafSpots(at));
      expect(spots.length).toBeGreaterThanOrEqual(3);
      expect(spots.length).toBeLessThanOrEqual(5);
      expect(spots.every(([x, y]) => Math.abs(x) <= 1 && Math.abs(y) <= 1)).toBe(true);
    }
  });
});

const MAZE_LEVELS = [4, 5, 6, 7, 9, 10];
const FLIPS: [boolean, boolean][] = [
  [false, false],
  [true, false],
  [false, true],
  [true, true],
];
const cases = (level: number) =>
  MAZES[level].flatMap((rows, index) =>
    FLIPS.map(([fx, fy]) => ({
      b: flipBoard(parseMaze(rows), fx, fy),
      label: `level ${level} board ${index} flipX=${fx} flipY=${fy}`,
    })),
  );
const dist = (b: Board, a: number, z: number) => routeBetween(b, a, z).length - 1;
/** Wrong branches: components of open tiles outside the mainline, with the mainline tile each hangs from. */
function wrongBranches(b: Board) {
  const line = mainline(b),
    seen = new Set<number>(),
    out: { fork: number; tiles: number[]; entry: number }[] = [];
  for (const t of b.tiles) {
    if (line.has(t) || seen.has(t)) continue;
    const tiles = [t];
    seen.add(t);
    for (let i = 0; i < tiles.length; i++)
      for (const n of neighbours(b, tiles[i]))
        if (!line.has(n) && !seen.has(n)) {
          seen.add(n);
          tiles.push(n);
        }
    const hooks = tiles.flatMap((x) =>
      neighbours(b, x)
        .filter((n) => line.has(n))
        .map((n) => ({ fork: n, entry: x })),
    );
    expect(hooks.length).toBe(1);
    out.push({ ...hooks[0], tiles });
  }
  return out;
}
const depth = (b: Board, br: { fork: number; tiles: number[] }) =>
  Math.max(...br.tiles.map((t) => dist(b, br.fork, t)));
/** Walk the turtle to `target` by free back steps then forward touches. */
function goTo(b: Board, level: number, s0: MazeState, target: number): MazeState {
  const want = routeBetween(b, b.start, target);
  let s = s0;
  while (!s.path.every((t, i) => want[i] === t)) s = mazeBack(s);
  for (const t of want.slice(s.path.length)) {
    const r = mazeTouch(b, level, s, t);
    expect(r.move.kind).toBe('forward');
    s = r.state;
  }
  return s;
}

describe('Mossy Path levels 4-7 and 9 boards', () => {
  it('has open tiles forming a tree with distinct, open start, pond and berry, a leaf pond, and a size that keeps targets at 100 units', () => {
    for (const level of MAZE_LEVELS)
      for (const { b, label } of cases(level)) {
        const edges = b.tiles.reduce((n, t) => n + neighbours(b, t).length, 0) / 2;
        expect(new Set(b.tiles).size, label).toBe(b.tiles.length);
        expect(routeBetween(b, b.start, b.tiles[0]).length, label).toBeGreaterThan(0);
        expect(
          b.tiles.every((t) => routeBetween(b, b.start, t).length > 0),
          label,
        ).toBe(true);
        expect(edges, label).toBe(b.tiles.length - 1);
        const special = [b.start, b.pond, ...berriesOf(b)];
        expect(new Set(special).size, label).toBe(special.length);
        expect(
          special.every((t) => b.tiles.includes(t)),
          label,
        ).toBe(true);
        expect(neighbours(b, b.pond).length, label).toBe(1);
        expect(b.berry !== undefined, label).toBe(level === 7 || level === 9);
        expect(b.berry2 !== undefined, label).toBe(level === 9);
        expect(b.rows, label).toBeLessThanOrEqual(4);
        expect(b.cols, label).toBeLessThanOrEqual(7);
        expect(Math.min(132, (768 - 330) / b.rows, (1024 - 320) / b.cols), label).toBeGreaterThanOrEqual(100);
      }
  });
  it('has the fork and branch properties of each level', () => {
    for (const level of MAZE_LEVELS)
      for (const { b, label } of cases(level)) {
        const route = routeBetween(b, b.start, b.pond),
          branches = wrongBranches(b);
        if (level === 4) {
          expect(branches, label).toHaveLength(0);
          expect(route.length, label).toBe(b.tiles.length);
        }
        if (level === 5) {
          expect(branches, label).toHaveLength(1);
          expect(branches[0].tiles.length, label).toBeLessThanOrEqual(2);
          expect(
            branches[0].tiles.every((t) => neighbours(b, t).length < 3),
            label,
          ).toBe(true);
        }
        if (level === 6) {
          const forks = new Set(branches.map((x) => x.fork));
          expect(forks.size, label).toBeGreaterThanOrEqual(2);
          expect(forks.size, label).toBeLessThanOrEqual(3);
          expect(branches.length, label).toBe(forks.size);
          expect(
            [...forks].every((f) => route.includes(f)),
            label,
          ).toBe(true);
          expect(
            branches.every((x) => x.tiles.length === 1),
            label,
          ).toBe(true);
        }
        if (level === 7) {
          const berry = b.berry!,
            spur = routeBetween(b, b.start, berry).filter((t) => !route.includes(t));
          expect(route.includes(berry), label).toBe(false);
          expect(spur.length, label).toBeGreaterThan(0);
          expect(spur.includes(berry), label).toBe(true);
          expect(
            branches.some((x) => spur.includes(x.fork)),
            label,
          ).toBe(false);
          expect(
            branches.some((x) => x.tiles.some((t) => neighbours(b, t).length >= 3)),
            label,
          ).toBe(true);
          expect(
            branches.every((x) => depth(b, x) <= 3),
            label,
          ).toBe(true);
          const berryFork = routeBetween(b, b.start, berry)
            .filter((t) => route.includes(t))
            .at(-1)!;
          expect(route.indexOf(berryFork), label).toBeLessThan(route.length - 1);
          expect(dist(b, b.start, berry), label).toBeLessThan(dist(b, b.start, b.pond));
        }
        if (level === 10) {
          expect(branches.length, label).toBeGreaterThanOrEqual(2);
          expect(
            branches.every((x) => depth(b, x) <= 2),
            label,
          ).toBe(true);
          expect(
            branches.some((x) => depth(b, x) === 2),
            label,
          ).toBe(true);
          expect(
            branches.some((x) => x.tiles.some((t) => neighbours(b, t).length >= 3)),
            label,
          ).toBe(true);
        }
      }
  });
  it('has six authored mazes per level (three at level 10), each reached by some seed', () => {
    for (const level of MAZE_LEVELS) {
      const count = level === 10 ? 3 : 6;
      expect(MAZES[level], `level ${level}`).toHaveLength(count);
      const authored = MAZES[level].map((r) => parseMaze(r)),
        seen = new Set<number>();
      for (let seed = 1; seed <= 300; seed++) {
        const b = makeBoard(level, new Rng(seed));
        seen.add(
          authored.findIndex((a) =>
            FLIPS.some(([fx, fy]) => JSON.stringify(flipBoard(a, fx, fy)) === JSON.stringify(b)),
          ),
        );
      }
      expect([...seen].sort(), `level ${level}`).toEqual([...Array(count).keys()]);
    }
  });
  it('picks an authored board, flipped but never transposed, and is reproducible per seed', () => {
    for (const level of MAZE_LEVELS) {
      const authored = MAZES[level].map((r) => parseMaze(r));
      for (let seed = 1; seed <= 60; seed++) {
        const b = makeBoard(level, new Rng(seed));
        expect(b, `level ${level} seed ${seed}`).toEqual(makeBoard(level, new Rng(seed)));
        const ok = authored.some(
          (a) =>
            a.rows === b.rows &&
            a.cols === b.cols &&
            FLIPS.some(([fx, fy]) => {
              const f = flipBoard(a, fx, fy);
              return JSON.stringify(f) === JSON.stringify(b);
            }),
        );
        expect(ok, `level ${level} seed ${seed}`).toBe(true);
      }
    }
  });
});

describe('Mossy Path levels 4-7 and 9 moves', () => {
  it('steps forward, back, walks to earlier trail tiles and ignores far, hedge and own-tile taps', () => {
    for (const level of MAZE_LEVELS)
      for (const { b, label } of cases(level)) {
        const route = routeBetween(b, b.start, b.berry ?? b.pond);
        let s = mazeStart(b);
        const first = mazeTouch(b, level, s, route[1]);
        expect(first.move.kind, label).toBe('forward');
        expect(first.state.path, label).toEqual(route.slice(0, 2));
        // own tile, hedges, far tiles
        const hedges = Array.from({ length: b.rows * b.cols }, (_, i) => i).filter(
          (i) => !b.tiles.includes(i),
        );
        for (const at of [first.state.path.at(-1)!, ...hedges]) {
          const r = mazeTouch(b, level, first.state, at);
          expect(r.move, label).toEqual({ kind: 'ignore', far: false });
          expect(r.state, label).toBe(first.state);
        }
        const here = route[1];
        for (const at of b.tiles.filter(
          (t) => t !== here && !first.state.path.includes(t) && !neighbours(b, here).includes(t),
        )) {
          const r = mazeTouch(b, level, first.state, at);
          expect(r.move, label).toEqual({ kind: 'ignore', far: true });
          expect(r.state, label).toBe(first.state);
        }
        // back
        const back = mazeTouch(b, level, first.state, route[0]);
        expect(back.move, label).toEqual({ kind: 'back' });
        expect(back.state.path, label).toEqual([route[0]]);
        // walk to an earlier tile along the full route up to (not including) the pond / berry
        s = mazeStart(b);
        const stop = route.length - 1;
        for (let i = 1; i < stop; i++) s = mazeTouch(b, level, s, route[i]).state;
        if (stop > 2) {
          for (let to = 0; to < stop - 2; to++) {
            const r = mazeTouch(b, level, s, route[to]);
            expect(r.move, label).toEqual({ kind: 'walk', to });
            expect(r.state, label).toBe(s);
          }
        }
      }
  });
  it('refuses the pond without the berry at level 7 (one miss per round, also after a restart) and finishes with it', () => {
    for (const { b, label } of cases(7)) {
      const route = routeBetween(b, b.start, b.pond),
        beforePond = route.at(-2)!;
      let s = goTo(b, 7, mazeStart(b), beforePond);
      const r1 = mazeTouch(b, 7, s, b.pond);
      expect(r1.move, label).toEqual({ kind: 'refuse', miss: true });
      expect(r1.state.path, label).toEqual(s.path);
      expect(r1.state.misses, label).toBe(1);
      const r2 = mazeTouch(b, 7, r1.state, b.pond);
      expect(r2.move, label).toEqual({ kind: 'refuse', miss: false });
      expect(r2.state.misses, label).toBe(1);
      const again = goTo(b, 7, mazeRestart(b, r2.state), beforePond);
      const r3 = mazeTouch(b, 7, again, b.pond);
      expect(r3.move, label).toEqual({ kind: 'refuse', miss: false });
      expect(r3.state.misses, label).toBe(1);
      // with the berry
      s = goTo(b, 7, mazeStart(b), b.berry!);
      expect(s.berry, label).toBe(true);
      s = goTo(b, 7, s, beforePond);
      expect(s.berry, label).toBe(true);
      const fin = mazeTouch(b, 7, s, b.pond);
      expect(fin.move.kind, label).toBe('forward');
      expect((fin.move as { pond: boolean }).pond, label).toBe(true);
      expect(fin.state.misses, label).toBe(0);
    }
  });
  it('collects the berry once and keeps it after walking back or restarting only until restart', () => {
    for (const { b, label } of cases(7)) {
      const route = routeBetween(b, b.start, b.berry!);
      const before = goTo(b, 7, mazeStart(b), route.at(-2)!);
      const r = mazeTouch(b, 7, before, b.berry!);
      expect((r.move as { berry: boolean }).berry, label).toBe(true);
      expect(mazeBack(r.state).berry, label).toBe(true);
      expect(mazeRestart(b, r.state).berry, label).toBe(false);
    }
  });
});

describe('Mossy Path levels 4-7 and 9 accounting', () => {
  it('never produces a miss at levels 4 and 5, however she taps', () => {
    for (const level of [4, 5])
      for (const { b, label } of cases(level))
        for (let seed = 1; seed <= 4; seed++) {
          const rng = new Rng(seed * 101 + level);
          let s = mazeStart(b);
          for (let i = 0; i < 300; i++) {
            const roll = rng.int(0, 9);
            if (roll === 0) s = mazeBack(s);
            else if (roll === 1) s = mazeRestart(b, s);
            else s = mazeTouch(b, level, s, rng.int(0, b.rows * b.cols - 1)).state;
            // bias toward real steps: also tap a neighbour of the turtle
            const near = neighbours(b, s.path.at(-1)!);
            s = mazeTouch(b, level, s, near[rng.int(0, near.length - 1)]).state;
            expect(s.misses, label).toBe(0);
          }
        }
  });
  it('counts each wrong branch once at levels 6 and 7, never again and never inside a branch', () => {
    for (const level of [6, 7])
      for (const { b, label } of cases(level)) {
        for (const br of wrongBranches(b)) {
          const pathToFork = goTo(b, level, mazeStart(b), br.fork);
          expect(pathToFork.misses, label).toBe(0);
          const entered = mazeTouch(b, level, pathToFork, br.entry);
          expect(entered.move, label).toMatchObject({ kind: 'forward', miss: true });
          expect(entered.state.misses, label).toBe(1);
          // every tile in the branch (including arms of a forked one) costs nothing more
          let s = entered.state;
          for (const t of br.tiles) {
            s = goTo(b, level, s, t);
            expect(s.misses, label).toBe(1);
          }
          // back out and in again, undo all the way, restart, in again
          s = goTo(b, level, s, br.fork);
          s = mazeTouch(b, level, s, br.entry).state;
          expect(s.misses, label).toBe(1);
          while (s.path.length > 1) s = mazeBack(s);
          expect(s.misses, label).toBe(1);
          s = goTo(b, level, mazeRestart(b, s), br.entry);
          expect(s.misses, label).toBe(1);
        }
        // all branches in one round: one miss each
        let s = mazeStart(b);
        const all = wrongBranches(b);
        for (const br of all) s = goTo(b, level, goTo(b, level, s, br.fork), br.entry);
        expect(s.misses, label).toBe(all.length);
      }
  });
});

describe('Mossy Path levels 4-7 and 9 nextToward', () => {
  it('moves adjacent and strictly closer to the goal from every open tile', () => {
    for (const level of MAZE_LEVELS)
      for (const { b, label } of cases(level)) {
        for (const berry of level >= 7 ? [false, true] : [false]) {
          const goal = goalOf(b, berry);
          if (level !== 9) expect(goal, label).toBe(level === 7 && !berry ? b.berry : b.pond);
          for (const t of b.tiles) {
            if (t === goal) continue;
            const n = nextToward(b, t, goal);
            expect(neighbours(b, t).includes(n), `${label} from ${t}`).toBe(true);
            expect(dist(b, n, goal), `${label} from ${t}`).toBe(dist(b, t, goal) - 1);
          }
        }
      }
  });
  it('is the bot plan: berry then pond with no misses, and leads out of every dead end', () => {
    for (const level of MAZE_LEVELS)
      for (const { b, label } of cases(level)) {
        let s = mazeStart(b),
          finished = false;
        for (let i = 0; i < b.tiles.length * 3 && !finished; i++) {
          const here = s.path.at(-1)!;
          const r = mazeTouch(b, level, s, nextToward(b, here, goalOf(b, s.berry, here, s.eaten)));
          expect(['forward', 'back'], label).toContain(r.move.kind);
          finished = r.move.kind === 'forward' && r.move.pond;
          s = r.state;
        }
        expect(finished, label).toBe(true);
        expect(s.misses, label).toBe(0);
        expect(s.berry, label).toBe(level === 7 || level === 9);
        for (const t of b.tiles.filter((x) => deadEnd(b, x))) {
          // walk in (misses allowed), then follow the plan out and on to the pond
          let w = goTo(b, level, mazeStart(b), t);
          const missesIn = w.misses;
          let done = false;
          const line = mainline(b);
          for (let i = 0; i < b.tiles.length * 3 && !done; i++) {
            const here = w.path.at(-1)!,
              next = nextToward(b, here, goalOf(b, w.berry, here, w.eaten));
            const r = mazeTouch(b, level, w, next);
            if (!line.has(here)) expect(r.move, `${label} dead end ${t}`).toEqual({ kind: 'back' });
            done = r.move.kind === 'forward' && (r.move as { pond: boolean }).pond;
            w = r.state;
          }
          expect(done, `${label} dead end ${t}`).toBe(true);
          expect(w.misses, `${label} dead end ${t}`).toBe(missesIn);
        }
      }
  });
});

describe('Mossy Path level 9, two snacks', () => {
  it('puts each berry at the end of its own spur off the way to the pond, one nearer the start, with a wrong branch', () => {
    expect(isMaze(9)).toBe(true);
    expect(levelName(9)).toBe('Two snacks: both berries, then the pond');
    for (const { b, label } of cases(9)) {
      const route = routeBetween(b, b.start, b.pond),
        berries = berriesOf(b),
        branches = wrongBranches(b);
      expect(berries, label).toHaveLength(2);
      const spurs = berries.map((t) => routeBetween(b, b.start, t).filter((x) => !route.includes(x)));
      for (const [i, t] of berries.entries()) {
        expect(route.includes(t), label).toBe(false);
        expect(neighbours(b, t), label).toHaveLength(1);
        expect(spurs[i].includes(t), label).toBe(true);
        expect(
          branches.some((x) => x.tiles.includes(t) || spurs[i].includes(x.fork)),
          label,
        ).toBe(false);
      }
      expect(
        spurs[0].some((t) => spurs[1].includes(t)),
        label,
      ).toBe(false);
      expect(dist(b, b.start, berries[0]), label).not.toBe(dist(b, b.start, berries[1]));
      expect(branches.length, label).toBeGreaterThan(0);
    }
  });
  it('finishes with no misses eating the berries in either order', () => {
    for (const { b, label } of cases(9))
      for (const order of [berriesOf(b), [...berriesOf(b)].reverse()]) {
        let s = goTo(b, 9, mazeStart(b), order[0]);
        expect(s.eaten, label).toEqual([order[0]]);
        expect(s.berry, label).toBe(false);
        s = goTo(b, 9, s, order[1]);
        expect(s.berry, label).toBe(true);
        s = goTo(b, 9, s, routeBetween(b, b.start, b.pond).at(-2)!);
        const fin = mazeTouch(b, 9, s, b.pond);
        expect(fin.move.kind, label).toBe('forward');
        expect((fin.move as { pond: boolean }).pond, label).toBe(true);
        expect(fin.state.misses, label).toBe(0);
      }
  });
  it('says how many berries are left as each is eaten', () => {
    for (const { b, label } of cases(9)) {
      const [first, second] = berriesOf(b);
      const before = goTo(b, 9, mazeStart(b), routeBetween(b, b.start, first).at(-2)!);
      const r1 = mazeTouch(b, 9, before, first);
      expect(r1.move, label).toMatchObject({ kind: 'forward', berry: true, left: 1 });
      const s = goTo(b, 9, r1.state, routeBetween(b, b.start, second).at(-2)!);
      expect(mazeTouch(b, 9, s, second).move, label).toMatchObject({ kind: 'forward', berry: true, left: 0 });
      expect(mazeRestart(b, r1.state).eaten, label).toEqual([]);
      expect(mazeBack(r1.state).eaten, label).toEqual([first]);
    }
  });
  it('refuses the pond with no berry or one berry, one miss per round', () => {
    for (const { b, label } of cases(9)) {
      const beforePond = routeBetween(b, b.start, b.pond).at(-2)!;
      const r1 = mazeTouch(b, 9, goTo(b, 9, mazeStart(b), beforePond), b.pond);
      expect(r1.move, label).toEqual({ kind: 'refuse', miss: true });
      let s = goTo(b, 9, r1.state, berriesOf(b)[1]);
      s = goTo(b, 9, s, beforePond);
      const r2 = mazeTouch(b, 9, s, b.pond);
      expect(r2.move, label).toEqual({ kind: 'refuse', miss: false });
      expect(r2.state.misses, label).toBe(1);
    }
  });
  it('aims the hint at the nearer uneaten berry, then the other, then the pond', () => {
    for (const { b, label } of cases(9)) {
      const berries = berriesOf(b);
      for (const at of b.tiles) {
        const d = berries.map((t) => dist(b, at, t)),
          goal = goalOf(b, false, at, []);
        expect(goal, `${label} from ${at}`).toBe(d[1] < d[0] ? berries[1] : berries[0]);
        expect(goalOf(b, false, at, [berries[0]]), label).toBe(berries[1]);
        expect(goalOf(b, false, at, [berries[1]]), label).toBe(berries[0]);
        expect(goalOf(b, true, at, berries), label).toBe(b.pond);
        if (at !== goal) expect(dist(b, nextToward(b, at, goal), goal), label).toBe(dist(b, at, goal) - 1);
      }
    }
  });
});

describe('Mossy Path level 10, plan then go', () => {
  /** Draw `tiles` one touch at a time from the turtle, as a slide would. */
  const draw = (b: Board, s: MazeState, tiles: readonly number[]) =>
    tiles.reduce((plan, t) => planTouch(b, s, plan, t).plan, [s.path.at(-1)!]);
  const simple = (b: Board, plan: readonly number[]) =>
    new Set(plan).size === plan.length && plan.every((t, i) => i === 0 || adjacent(b, plan[i - 1], t));
  const adjacent = (b: Board, a: number, z: number) => neighbours(b, a).includes(z);
  it('is a maze level only for school, after 2 and before 3', () => {
    expect(isMaze(10)).toBe(true);
    expect(isPlanLevel(10)).toBe(true);
    for (const level of [1, 2, 3, 4, 5, 6, 7, 8, 9]) expect(isPlanLevel(level)).toBe(false);
    expect(levelName(10)).toMatch(/^Plan, then go/);
  });
  it('adds a print beside the plan end, erases on the second-last tile, and ignores or flags anything else', () => {
    for (const { b, label } of cases(10)) {
      const s = mazeStart(b),
        route = routeBetween(b, b.start, b.pond);
      let plan = [b.start];
      for (const t of route.slice(1, 3)) {
        const r = planTouch(b, s, plan, t);
        expect(r.edit, label).toBe('add');
        plan = r.plan;
      }
      expect(plan, label).toEqual(route.slice(0, 3));
      expect(planTouch(b, s, plan, route[1]), label).toEqual({ plan: route.slice(0, 2), edit: 'erase' });
      expect(planTouch(b, s, plan, route[2]).edit, label).toBe('ignore');
      expect(planTouch(b, s, plan, route[0]).edit, label).toBe('ignore');
      const hedge = Array.from({ length: b.rows * b.cols }, (_, i) => i).find((i) => !b.tiles.includes(i))!;
      expect(planTouch(b, s, plan, hedge).edit, label).toBe('ignore');
      const far = b.tiles.find((t) => !plan.includes(t) && !adjacent(b, plan.at(-1)!, t))!;
      expect(planTouch(b, s, plan, far), label).toEqual({ plan, edit: 'far' });
      // A stale plan (not starting at the turtle) restarts from the turtle.
      expect(planTouch(b, s, [route[1]], route[1]).plan, label).toEqual([b.start, route[1]]);
    }
  });
  it('keeps every drawn plan a simple path from the turtle, whatever she touches', () => {
    for (const { b, label } of cases(10))
      for (let seed = 1; seed <= 20; seed++) {
        const rng = new Rng(seed),
          s = mazeStart(b);
        let plan = [b.start];
        for (let i = 0; i < 40; i++) {
          plan = planTouch(b, s, plan, b.tiles[rng.int(0, b.tiles.length - 1)]).plan;
          expect(plan[0], label).toBe(b.start);
          expect(simple(b, plan), `${label} seed ${seed}`).toBe(true);
        }
      }
  });
  it('walks a plan along the route to the pond with no misses, and the bot (one trace, one Go) finishes', () => {
    for (const { b, label } of cases(10)) {
      const s = mazeStart(b),
        plan = draw(b, s, routeBetween(b, b.start, b.pond).slice(1)),
        steps = planGo(b, 10, s, plan);
      expect(steps.length, label).toBe(plan.length - 1);
      const last = steps.at(-1)!;
      expect(last.move.kind === 'forward' && last.move.pond, label).toBe(true);
      expect(last.state.misses, label).toBe(0);
      expect(last.state.path, label).toEqual(plan);
    }
  });
  it('stops a short plan where it ends, and counts a wrong branch once per round however often a plan enters it', () => {
    for (const { b, label } of cases(10)) {
      const route = routeBetween(b, b.start, b.pond);
      // A short plan on the route: no miss, the turtle waits at its end.
      let s = mazeStart(b);
      let steps = planGo(b, 10, s, draw(b, s, route.slice(1, 3)));
      s = steps.at(-1)!.state;
      expect(s.path, label).toEqual(route.slice(0, 3));
      expect(s.misses, label).toBe(0);
      // Into each wrong branch and back out, twice: one miss per branch, and back steps are free.
      const line = mainline(b);
      const entries = b.tiles.filter((t) => !line.has(t) && neighbours(b, t).some((n) => line.has(n)));
      s = mazeStart(b);
      for (const round of [1, 2])
        for (const entry of entries) {
          const fork = neighbours(b, entry).find((n) => line.has(n))!;
          const here = s.path.at(-1)!;
          const there = [...routeBetween(b, here, fork).slice(1), entry];
          steps = planGo(b, 10, s, draw(b, s, there));
          expect(steps.length, `${label} round ${round}`).toBe(there.length);
          s = steps.at(-1)!.state;
          const out = routeBetween(b, entry, fork).slice(1);
          const back = planGo(b, 10, s, draw(b, s, out));
          expect(
            back.every((r) => r.move.kind === 'back'),
            label,
          ).toBe(true);
          s = back.at(-1)!.state;
          expect(s.misses, `${label} round ${round}`).toBe(
            round === 1 ? entries.indexOf(entry) + 1 : entries.length,
          );
        }
      // Inside a branch that forks again, stepping deeper never counts a second miss.
      expect(s.branches.length, label).toBe(entries.length);
    }
  });
  it('plans out of a branch by walking back along the trail, every step back free', () => {
    for (const { b, label } of cases(10))
      for (const t of b.tiles.filter((x) => deadEnd(b, x))) {
        let s = mazeStart(b);
        s = planGo(b, 10, s, draw(b, s, routeBetween(b, b.start, t).slice(1))).at(-1)!.state;
        const misses = s.misses;
        const plan = draw(b, s, routeBetween(b, t, b.pond).slice(1));
        expect(simple(b, plan), label).toBe(true);
        const steps = planGo(b, 10, s, plan);
        expect(steps.at(-1)!.move, label).toMatchObject({ kind: 'forward', pond: true });
        expect(steps.at(-1)!.state.misses, label).toBe(misses);
      }
  });
  it('refuses to walk a plan that does not start at the turtle', () => {
    const b = parseMaze(MAZES[10][0]);
    const s = mazeStart(b);
    expect(planGo(b, 10, s, [routeBetween(b, b.start, b.pond)[1]])).toEqual([]);
  });
  it('hints the next three tiles toward the pond from wherever the turtle stands, leading out of a branch first', () => {
    for (const { b, label } of cases(10))
      for (const t of b.tiles.filter((x) => x !== b.pond)) {
        const s = goTo(b, 10, mazeStart(b), t),
          hint = hintPlan(b, s);
        expect(hint[0], label).toBe(t);
        expect(hint.length, label).toBe(Math.min(4, dist(b, t, b.pond) + 1));
        expect(simple(b, hint), label).toBe(true);
        hint.slice(1).forEach((h, i) => expect(dist(b, h, b.pond), label).toBe(dist(b, t, b.pond) - i - 1));
        // Following the hint never adds a miss.
        const steps = planGo(b, 10, s, draw(b, s, hint.slice(1)));
        expect(steps.at(-1)!.state.misses, label).toBe(s.misses);
      }
  });
});

/** The solver before level 11 (one visit per tile, memo `mask * 16 + at`), kept to prove levels 1–3 and 8 unchanged. */
function oldCompletion(b: Board, path: readonly number[]): number[] | null {
  if (path[0] !== b.start || new Set(path).size !== path.length) return null;
  if (path.includes(b.pond) && (path.at(-1) !== b.pond || path.length !== b.tiles.length)) return null;
  const failed = new Set<number>();
  const search = (at: number, mask: number, length: number): number[] | null => {
    if (length === b.tiles.length) return at === b.pond ? [] : null;
    const key = mask * 16 + at;
    if (failed.has(key)) return null;
    for (const next of b.tiles) {
      if (mask & (1 << next) || !adjacent(b, at, next) || (next === b.pond && length !== b.tiles.length - 1))
        continue;
      const tail = search(next, mask | (1 << next), length + 1);
      if (tail) return [next, ...tail];
    }
    failed.add(key);
    return null;
  };
  return search(path.at(-1)!, path.reduce((m, i) => m | (1 << i), 0), path.length);
}
/** Every legal prefix from the start (each a path `step` accepts). */
function prefixes(b: Board): number[][] {
  const out: number[][] = [];
  const go = (path: number[]) => {
    out.push(path);
    for (const at of b.tiles) {
      const next = step(b, path, at);
      if (next) go(next);
    }
  };
  go([b.start]);
  return out;
}

describe('Mossy Path level 11, thick moss', () => {
  it('gives levels 1–3 and 8 the same completions from every legal prefix as the old one-visit solver', () => {
    for (const p of [...PLANS.flat(), ...PATCHES])
      for (const [fx, fy, t] of SYMMETRIES.slice(0, 2)) {
        const b = transformPlan(p, fx, fy, t);
        expect(b.thick).toBeUndefined();
        expect(routeLength(b)).toBe(b.tiles.length);
        for (const path of prefixes(b)) expect(completion(b, path)).toEqual(oldCompletion(b, path));
      }
  });
  it('has four boards, 3 × 4 or 4 × 4, tufts never the start or pond, each tuft with three moss sides', () => {
    expect(THICK).toHaveLength(4);
    expect(THICK.filter((p) => p.rows === 3 && p.cols === 4 && p.thick!.length === 1)).toHaveLength(2);
    expect(
      THICK.filter((p) => p.rows === 4 && p.cols === 4 && p.thick!.length === 2 && p.tiles.length === 15),
    ).toHaveLength(2);
    for (const [n, p] of THICK.entries())
      for (const [fx, fy, t] of SYMMETRIES) {
        const b = transformPlan(p, fx, fy, t),
          label = `thick ${n} ${fx} ${fy} ${t}`;
        expect(b.thick, label).toHaveLength(p.thick!.length);
        for (const tuft of b.thick!) {
          expect(b.tiles.includes(tuft), label).toBe(true);
          expect(tuft !== b.start && tuft !== b.pond, label).toBe(true);
          expect(neighbours(b, tuft).length, label).toBeGreaterThanOrEqual(3);
          expect(needOf(b, tuft)).toBe(2);
        }
        expect(Math.min(132, (768 - 330) / b.rows, (1024 - 320) / b.cols), label).toBeGreaterThanOrEqual(100);
      }
  });
  it('solves every board under every symmetry within 50 ms, and the bot finishes with no miss', () => {
    for (const [n, p] of THICK.entries())
      for (const [fx, fy, t] of SYMMETRIES) {
        const b = transformPlan(p, fx, fy, t),
          label = `thick ${n} ${fx} ${fy} ${t}`;
        const t0 = performance.now(),
          route = completion(b, [b.start]);
        expect(performance.now() - t0, label).toBeLessThan(50);
        expect(route, label).not.toBeNull();
        expect(routeCount(b), label).toBe(routeCount(transformPlan(p, false, false, false)));
        // The bot: follow helpFor's taps from the start; it never needs Undo and finishes with no miss.
        let path = [b.start];
        for (let guard = 0; guard < 20 && !solved(b, path); guard++) {
          const help = helpFor(b, path)!;
          expect(help.undo, label).toBe(0);
          expect(moveError(b, path, help.next), label).toBeNull();
          path = step(b, path, help.next)!;
        }
        expect(solved(b, path), label).toBe(true);
        expect(path, label).toHaveLength(routeLength(b));
        for (const tuft of b.thick!) expect(visitsOf(path, tuft), label).toBe(2);
        expect(bloomedCount(b, path), label).toBe(b.tiles.length);
      }
  });
  it('gives every board a real choice of complete routes', () => {
    for (const p of THICK) expect(routeCount(transformPlan(p, false, false, false))).toBeGreaterThanOrEqual(2);
  });
  it('leads from any legal prefix to a completion: help undoes only what it must, then the route finishes', () => {
    for (const [n, p] of THICK.entries()) {
      const b = transformPlan(p, false, false, false);
      for (const path of prefixes(b)) {
        const help = helpFor(b, path),
          label = `thick ${n} ${path.join(',')}`;
        expect(help, label).not.toBeNull();
        const kept = path.slice(0, path.length - help!.undo),
          rest = completion(b, kept);
        expect(rest, label).not.toBeNull();
        expect(rest![0] ?? -1, label).toBe(help!.next);
        if (help!.undo > 0) expect(completion(b, kept.concat(path[kept.length])), label).toBeNull();
        expect(solved(b, [...kept, ...rest!]), label).toBe(true);
      }
    }
  });
  it('lets a tuft take a second visit, then refuses a third; a plain tile still takes one', () => {
    // 0 1 2 3 / 4 5 6 7 / 8 9 10 11, tuft 5, pond 8.
    const b = transformPlan(THICK[0], false, false, false);
    expect(b.thick).toEqual([5]);
    expect(moveError(b, [0, 1], 5)).toBeNull();
    expect(moveError(b, [0, 1, 5, 6], 5)).toBeNull();
    expect(moveError(b, [0, 1, 5, 6, 5, 4], 5)).toBe('visited');
    expect(moveError(b, [0, 1, 5], 1)).toBe('visited');
    expect(moveError(b, [0, 4], 8)).toBe('pond');
    expect(moveError(b, [0, 1], 6)).toBe('far');
    expect(validPath(b, [0, 1, 5, 6, 5])).toBe(true);
    expect(validPath(b, [0, 1, 5, 6, 5, 4, 5])).toBe(false);
    // The pond needs every tile and the tuft's second visit: 12 tiles, 13 steps.
    expect(routeLength(b)).toBe(13);
    expect(solved(b, [0, 1, 2, 3, 7, 6, 5, 4, 0])).toBe(false);
    expect(solved(b, [0, 1, 2, 3, 7, 11, 10, 6, 5, 4, 8])).toBe(false);
    const full = [0, 1, 2, 3, 7, 11, 10, 6, 5, 9, 5, 4, 8];
    expect(solved(b, full)).toBe(true);
    expect(bloomedCount(b, full.slice(0, 9))).toBe(8);
    expect(bloomedCount(b, full.slice(0, 11))).toBe(10);
    // A first visit to a tuft is never a miss.
    expect(countsMiss(11, moveError(b, [0, 1], 5))).toBe(false);
    expect(countsMiss(11, 'far')).toBe(true);
  });
  it('plays every board for some seed as coverage, and slots 11 last for school', () => {
    expect(isMaze(11)).toBe(false);
    expect(plansFor(11)).toBe(THICK);
    expect(levelName(11)).toBe('Thick moss: some tiles need two visits');
    expect(LEVELS.school).toMatchObject({ min: 1, max: 11 });
    const seen = new Set<number>();
    for (let seed = 1; seed <= 200; seed++) {
      const b = makeBoard(11, new Rng(seed));
      expect(b).toEqual(makeBoard(11, new Rng(seed)));
      const n = THICK.findIndex((p) =>
        SYMMETRIES.some(([fx, fy, t]) => {
          const z = transformPlan(p, fx, fy, t);
          return sameBoard(z, b) && z.thick!.join() === b.thick!.join();
        }),
      );
      expect(n, `seed ${seed}`).toBeGreaterThanOrEqual(0);
      seen.add(n);
    }
    expect(seen.size).toBe(THICK.length);
  });
});
