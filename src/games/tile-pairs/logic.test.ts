import { describe, expect, it } from 'vitest';
import { swatch } from '../../art/palette';
import { Rng } from '../../engine/random';
import {
  CANDIDATES,
  LEVELS,
  LOOKS,
  pickLook,
  clearRate,
  deal,
  free,
  freeTiles,
  fullMask,
  layout,
  makeBoard,
  pairs,
  peekStacks,
  planFor,
  present,
  removePair,
  reshuffle,
  seededRoute,
  solve,
  type Tile,
} from './logic';

describe('Tile Pairs', () => {
  it('blocks covered tiles and tiles with both horizontal sides occupied', () => {
    const tiles = [
      { x: 0, y: 0, z: 0, kind: 0 },
      { x: 1, y: 0, z: 0, kind: 0 },
      { x: 2, y: 0, z: 0, kind: 0 },
      { x: 0, y: 0, z: 1, kind: 0 },
    ];
    expect(freeTiles(tiles, 15)).toEqual([2, 3]);
    expect(freeTiles(tiles, 7)).toEqual([0, 2]);
    expect(free(tiles, 5, 1)).toBe(false);
    expect(freeTiles(tiles, 5)).toEqual([0, 2]);
  });
  it('lists only remaining stacks in bottom-to-top order for Peek', () => {
    const tiles = [
      { x: 0, y: 0, z: 0, kind: 0 },
      { x: 0, y: 0, z: 1, kind: 1 },
      { x: 0, y: 0, z: 2, kind: 2 },
      { x: 1, y: 0, z: 1, kind: 2 },
    ];
    expect(peekStacks(tiles, fullMask(tiles))).toEqual([[0, 1, 2]]);
    expect(peekStacks(tiles, 0b1101)).toEqual([[0, 2]]);
    expect(peekStacks(tiles, 0b1100)).toEqual([]);
    expect(peekStacks([tiles[2], tiles[0], tiles[1]], 0b111)).toEqual([[1, 2, 0]]);
  });
  it('has a seeded, solvable ladder with clear bounds and alternative symbol pairs', () => {
    expect(planFor(0)).toBe(planFor(1));
    expect(planFor(99)).toBe(planFor(7));
    expect(LEVELS.grownup).toEqual({ min: 1, max: 7 });
    for (let level = 1; level <= 7; level++)
      for (let seed = 1; seed <= 100; seed++) {
        const tiles = makeBoard(level, new Rng(seed));
        expect(tiles).toEqual(makeBoard(level, new Rng(seed)));
        expect(tiles.length).toBe([12, 20, 24, 24, 24, 24, 24][level - 1]);
        expect(new Set(tiles.map((t) => `${t.x},${t.y},${t.z}`)).size).toBe(tiles.length);
        const route = solve(tiles)!;
        expect(route).not.toBeNull();
        let mask = fullMask(tiles);
        for (const pair of route) {
          expect(pairs(tiles, mask)).toContainEqual(pair);
          mask = removePair(mask, pair);
        }
        expect(mask).toBe(0);
        if (level === 3) expect(tiles.filter((t) => t.kind === 0)).toHaveLength(4);
      }
    expect(makeBoard(3, new Rng(1))).not.toEqual(makeBoard(3, new Rng(2)));
  });
  it('keeps the original three layouts as the same sets of positions', () => {
    const square = (z: number) => [1, 2].flatMap((y) => [1, 2].map((x) => `${x},${y},${z}`));
    const base = (cols: number, rows: number) =>
      Array.from({ length: cols * rows }, (_, i) => `${i % cols},${Math.floor(i / cols)},0`);
    const expected = [base(4, 3), [...base(4, 4), ...square(1)], [...base(4, 4), ...square(1), ...square(2)]];
    for (let level = 1; level <= 3; level++)
      for (const tiles of [layout(level), makeBoard(level, new Rng(7)), makeBoard(level, new Rng(4242))])
        expect(tiles.map((t) => `${t.x},${t.y},${t.z}`).sort()).toEqual([...expected[level - 1]].sort());
  });
  it('clears each layout by a different seeded pairing each round', () => {
    for (let level = 1; level <= 7; level++) {
      const tiles = layout(level),
        seen = new Set<string>();
      for (let seed = 1; seed <= 100; seed++) {
        const route = seededRoute(tiles, new Rng(seed))!;
        expect(route).toEqual(seededRoute(tiles, new Rng(seed)));
        expect(route).toHaveLength(tiles.length / 2);
        // Every step takes two tiles that are free by position, and the route empties the stack.
        let mask = fullMask(tiles);
        for (const pair of route) {
          expect(pairs(tiles, mask, true)).toContainEqual(pair);
          mask = removePair(mask, pair);
        }
        expect(mask).toBe(0);
        seen.add(JSON.stringify(route.map(([a, b]) => [a, b]).sort((p, q) => p[0] - q[0])));
      }
      expect(seen.size).toBeGreaterThanOrEqual(level === 1 ? 10 : 50);
    }
    // The dealt board follows suit: level 1's six pictures sit on different position pairs from seed to seed.
    const partners = new Set<string>();
    for (let seed = 1; seed <= 100; seed++) {
      const board = makeBoard(1, new Rng(seed));
      partners.add(board.map((t, i) => board.findIndex((u, j) => j !== i && u.kind === t.kind)).join());
    }
    expect(partners.size).toBeGreaterThanOrEqual(10);
  });
  it("deals inside each level's random-play clear-rate band, so a fresh pairing is no harder", () => {
    expect(clearRate([], new Rng(1))).toBe(1);
    const trap: Tile[] = [0, 1, 2, 1, 2, 0].map((kind, x) => ({ x, y: 0, z: 0, kind }));
    expect(clearRate(trap, new Rng(1))).toBe(0);
    for (let level = 1; level <= 7; level++) {
      const [min, max] = planFor(level).clear;
      expect(min).toBe([0.95, 0.95, 0.95, 0.95, 0.85, 0.75, 0.45][level - 1]);
      let exhausted = 0,
        again = 0;
      for (let seed = 1; seed <= 100; seed++) {
        const d = deal(level, new Rng(seed));
        expect(d.tiles).toEqual(makeBoard(level, new Rng(seed)));
        expect(d.tries).toBeGreaterThanOrEqual(1);
        expect(d.tries).toBeLessThanOrEqual(CANDIDATES);
        if (d.inBand) {
          expect(d.rate).toBeGreaterThanOrEqual(min);
          expect(d.rate).toBeLessThanOrEqual(max);
        } else {
          expect(d.tries).toBe(CANDIDATES);
          exhausted++;
        }
        // An independent measure of the kept board, so the dial is not only agreeing with itself.
        again += clearRate(d.tiles, new Rng(seed + 9000), 100);
      }
      expect(exhausted).toBeLessThanOrEqual(5);
      expect(again / 100).toBeGreaterThanOrEqual(min - 0.05);
    }
  });
  it('changes the paths into the stack, then increases matching alternatives without enlarging targets', () => {
    const boards = [4, 5, 6].map((level) => makeBoard(level, new Rng(51)));
    expect(boards.map((b) => [0, 1, 2].map((z) => b.filter((t) => t.z === z).length))).toEqual([
      [18, 4, 2],
      [12, 8, 4],
      [14, 8, 2],
    ]);
    expect(boards.map((b) => new Set(b.map((t) => t.kind)).size)).toEqual([6, 5, 4]);
    expect(boards[2].filter((t) => t.kind === 0)).toHaveLength(6);
    for (const board of boards) {
      expect(board.every((t) => t.x >= 0 && t.x < 6 && t.y >= 0 && t.y < 4 && t.z <= 2)).toBe(true);
      // Every raised tile has a supporting tile immediately below it.
      for (const tile of board.filter((t) => t.z > 0))
        expect(board.some((t) => t.x === tile.x && t.y === tile.y && t.z === tile.z - 1)).toBe(true);
    }
    expect(boards[0].filter((t) => t.z === 1).map((t) => t.x)).toEqual([1, 2, 3, 4]);
    expect(boards[1].filter((t) => t.z === 1 && t.y === 0).map((t) => t.x)).toEqual([0, 1, 4, 5]);
    expect(boards[2].some((t) => t.x === 0 && t.y === 0)).toBe(false);
  });
  it('distinguishes a match now from a clearing route and accepts alternate valid pairs', () => {
    const tiles: Tile[] = [0, 1, 1, 0].map((kind, x) => ({ x, y: 0, z: 0, kind }));
    expect(solve(tiles)).toEqual([
      [0, 3],
      [1, 2],
    ]);
    expect(pairs(tiles, 15)).toEqual([[0, 3]]);
    const blocked = [0, 1, 0, 1].map((kind, x) => ({ x, y: 0, z: 0, kind }));
    expect(solve(blocked)).toBeNull();
    const trap = [0, 1, 2, 1, 2, 0].map((kind, x) => ({ x, y: 0, z: 0, kind }));
    expect(pairs(trap, fullMask(trap))).toEqual([[0, 5]]);
    expect(solve(trap)).toBeNull(); // A match now is not always useful help.
    expect(solve(reshuffle(trap, fullMask(trap), new Rng(5)))).not.toBeNull();
  });
  it('can recover any played remainder without returning removed tiles or losing pictures', () => {
    for (let level = 3; level <= 6; level++)
      for (let seed = 1; seed <= 80; seed++) {
        const tiles = makeBoard(level, new Rng(seed));
        let mask = fullMask(tiles);
        const rng = new Rng(seed + 500);
        for (let move = 0; move < 8 && mask; move++) {
          const options = pairs(tiles, mask);
          if (options.length) mask = removePair(mask, rng.pick(options));
          const before = tiles
            .filter((_, i) => present(mask, i))
            .map((t) => t.kind)
            .sort();
          const rescued = reshuffle(tiles, mask, rng);
          expect(rescued.map((t) => t.kind).sort()).toEqual(before);
          expect(solve(rescued)).not.toBeNull();
          expect(rescued.every((t) => t.z === 0)).toBe(true);
          // Continue on the original stack to exercise unlucky alternatives too.
        }
      }
    const tower: Tile[] = [0, 1].map((z) => ({ x: 0, y: 0, z, kind: 2 }));
    expect(solve(tower)).toBeNull();
    expect(solve(reshuffle(tower, 3, new Rng(1)))).toEqual([[0, 1]]);
  });
  it('can rebuild a complete undo snapshot and handles an empty remainder', () => {
    const tiles = makeBoard(3, new Rng(40)),
      snapshot = { tiles: tiles.map((t) => ({ ...t })), mask: fullMask(tiles) };
    const route = solve(tiles)!;
    const mask = removePair(snapshot.mask, route[0]);
    const next = reshuffle(tiles, mask, new Rng(90));
    expect(next).toHaveLength(22);
    expect(snapshot.tiles).toEqual(tiles);
    expect(solve(snapshot.tiles, snapshot.mask)).toHaveLength(12);
    expect(reshuffle(tiles, 0, new Rng(1))).toEqual([]);
    expect(solve([])).toEqual([]);
  });
  it('builds a four-layer tower where most tiles start covered and the first pair can matter', () => {
    const tiles = layout(7);
    expect([0, 1, 2, 3].map((z) => tiles.filter((t) => t.z === z).length)).toEqual([12, 6, 4, 2]);
    expect(new Set(tiles.map((t) => `${t.x},${t.y},${t.z}`)).size).toBe(24);
    // Every raised tile rests on one directly below it.
    for (const tile of tiles.filter((t) => t.z > 0))
      expect(tiles.some((t) => t.x === tile.x && t.y === tile.y && t.z === tile.z - 1)).toBe(true);
    const covered = tiles.filter((a) => tiles.some((b) => b.x === a.x && b.y === a.y && b.z > a.z));
    expect(covered.length).toBeGreaterThanOrEqual(10);
    // Peek has a four-deep stack to show.
    expect(Math.max(...peekStacks(tiles, fullMask(tiles)).map((s) => s.length))).toBe(4);
    let losing = 0;
    for (let seed = 1; seed <= 100; seed++) {
      const board = makeBoard(7, new Rng(seed)),
        full = fullMask(board);
      expect(new Set(board.map((t) => t.kind)).size).toBe(6);
      for (let kind = 0; kind < 6; kind++) expect(board.filter((t) => t.kind === kind)).toHaveLength(4);
      if (pairs(board, full).some((p) => solve(board, removePair(full, p)) === null)) losing++;
    }
    // Some legal first pair on some seed leaves no route, so the choice is real.
    expect(losing).toBeGreaterThan(0);
    // Levels 1–6 keep their layouts.
    for (let level = 1; level <= 6; level++) expect(layout(level).every((t) => t.z <= 2)).toBe(true);
  });
  it('deals one of three looks by seed, each with six pictures distinct in outline and colour', () => {
    expect(LOOKS).toHaveLength(3);
    const rgb = (hex: number) => [hex >> 16, (hex >> 8) & 255, hex & 255];
    for (const look of LOOKS) {
      expect(look).toHaveLength(6);
      expect(new Set(look.map((p) => p.art)).size).toBe(6);
      expect(new Set(look.map((p) => p.color)).size).toBe(6);
      // Colours far enough apart to tell at a glance (the original set's closest pair, orange and yellow, is 61).
      for (let i = 0; i < 6; i++)
        for (let j = i + 1; j < 6; j++) {
          const [a, b] = [rgb(swatch[look[i].color].fill), rgb(swatch[look[j].color].fill)];
          expect(Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2])).toBeGreaterThanOrEqual(60);
        }
    }
    // Look 0 is the original rainbow set that stickers keep.
    expect(LOOKS[0].map((p) => p.color)).toEqual(['red', 'orange', 'yellow', 'green', 'blue', 'purple']);
    // The look is the seed's; every look turns up over a few seeds and the board does not depend on it.
    const seen = new Set<number>();
    for (let seed = 1; seed <= 30; seed++) {
      const rng = new Rng(seed);
      const board = makeBoard(1, rng);
      const look = pickLook(rng);
      expect(board).toEqual(makeBoard(1, new Rng(seed)));
      expect(look).toBeGreaterThanOrEqual(0);
      expect(look).toBeLessThan(LOOKS.length);
      seen.add(look);
    }
    expect(seen.size).toBe(3);
  });
});
