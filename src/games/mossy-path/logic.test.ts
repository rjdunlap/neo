import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import {
  BERRIES,
  completion,
  deadEnd,
  flipBoard,
  leafSpots,
  pickLook,
  PLANS,
  SEASONS,
  transformPlan,
  goalOf,
  helpFor,
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

const MAZE_LEVELS = [4, 5, 6, 7];
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

describe('Mossy Path levels 4-7 boards', () => {
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
        const special = [b.start, b.pond, ...(b.berry === undefined ? [] : [b.berry])];
        expect(new Set(special).size, label).toBe(special.length);
        expect(
          special.every((t) => b.tiles.includes(t)),
          label,
        ).toBe(true);
        expect(neighbours(b, b.pond).length, label).toBe(1);
        expect(b.berry !== undefined, label).toBe(level === 7);
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
      }
  });
  it('has six authored mazes per level, each reached by some seed', () => {
    for (const level of MAZE_LEVELS) {
      expect(MAZES[level], `level ${level}`).toHaveLength(6);
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
      expect([...seen].sort(), `level ${level}`).toEqual([0, 1, 2, 3, 4, 5]);
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

describe('Mossy Path levels 4-7 moves', () => {
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

describe('Mossy Path levels 4-7 accounting', () => {
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

describe('Mossy Path levels 4-7 nextToward', () => {
  it('moves adjacent and strictly closer to the goal from every open tile', () => {
    for (const level of MAZE_LEVELS)
      for (const { b, label } of cases(level)) {
        for (const berry of level === 7 ? [false, true] : [false]) {
          const goal = goalOf(b, berry);
          expect(goal, label).toBe(level === 7 && !berry ? b.berry : b.pond);
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
          const r = mazeTouch(b, level, s, nextToward(b, s.path.at(-1)!, goalOf(b, s.berry)));
          expect(['forward', 'back'], label).toContain(r.move.kind);
          finished = r.move.kind === 'forward' && r.move.pond;
          s = r.state;
        }
        expect(finished, label).toBe(true);
        expect(s.misses, label).toBe(0);
        expect(s.berry, label).toBe(level === 7);
        for (const t of b.tiles.filter((x) => deadEnd(b, x))) {
          // walk in (misses allowed), then follow the plan out and on to the pond
          let w = goTo(b, level, mazeStart(b), t);
          const missesIn = w.misses;
          let done = false;
          const line = mainline(b);
          for (let i = 0; i < b.tiles.length * 3 && !done; i++) {
            const here = w.path.at(-1)!,
              next = nextToward(b, here, goalOf(b, w.berry));
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
