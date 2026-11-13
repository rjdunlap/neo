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
  fairTrap,
  FLOWER,
  FLOWER_ART,
  free,
  freeTiles,
  isFlower,
  matches,
  fromPool,
  fullMask,
  layout,
  lookahead,
  losingFirstPairs,
  mirrorX,
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
import { POOLS } from './pools';

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
    expect(planFor(99)).toBe(planFor(10));
    expect(LEVELS.grownup).toEqual({ min: 1, max: 10 });
    for (let level = 1; level <= 10; level++)
      for (let seed = 1; seed <= 100; seed++) {
        const tiles = makeBoard(level, new Rng(seed));
        expect(tiles).toEqual(makeBoard(level, new Rng(seed)));
        expect(tiles.length).toBe([12, 20, 24, 24, 24, 24, 24, 24, 30, 24][level - 1]);
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
    for (let level = 1; level <= 9; level++) {
      const [min, max] = planFor(level).clear;
      // Levels 3–6 moved to harder bands after Peek; 1–2 keep the fixed-route difficulty.
      expect([min, max]).toEqual(
        [
          [0.95, 1],
          [0.95, 1],
          [0.6, 0.95],
          [0.6, 0.95],
          [0.3, 0.8],
          [0.3, 0.8],
          [0.45, 0.9],
          [0.45, 0.9],
          [0.45, 0.9],
        ][level - 1],
      );
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
      expect(again / 100).toBeLessThanOrEqual(max + 0.05);
    }
  });
  it('deals level 10 from a frozen pool of tricky twin terraces, each with a losing first pair and a fair trap', () => {
    const plan = planFor(10),
      tiles = layout(10);
    // The same twin terraces as level 5, symmetric under the mirror the pool uses.
    expect(tiles).toEqual(layout(5));
    const keys = new Set(tiles.map((t) => `${t.x},${t.y},${t.z}`));
    for (const t of tiles) expect(keys.has(`${mirrorX(plan, t.x)},${t.y},${t.z}`)).toBe(true);
    const pool = POOLS.twins;
    expect(pool).toHaveLength(24);
    expect(new Set(pool).size).toBe(24);
    for (const kinds of pool) {
      expect(kinds).toMatch(/^[0-4]{24}$/);
      // Level 5's counts: twelve pairs over five pictures, so two pictures have six tiles and three have four.
      const counts = [0, 1, 2, 3, 4].map((k) => [...kinds].filter((c) => Number(c) === k).length);
      expect(counts.sort()).toEqual([4, 4, 4, 6, 6]);
      const board = tiles.map((t, i) => ({ ...t, kind: Number(kinds[i]) }));
      expect(solve(board)).not.toBeNull();
      expect(losingFirstPairs(board).length).toBeGreaterThan(0);
      expect(fairTrap(board)).toBe(true);
      expect(clearRate(board, new Rng(77), 200)).toBeLessThanOrEqual(plan.clear[1]);
    }
    // Mirroring and renaming keep every property, and the seed decides which board she gets.
    const seen = new Set<string>();
    for (let seed = 1; seed <= 40; seed++) {
      const d = deal(10, new Rng(seed));
      expect(d.tiles).toEqual(makeBoard(10, new Rng(seed)));
      expect(d.tiles).toEqual(fromPool(10, new Rng(seed)));
      seen.add(JSON.stringify(d.tiles.map((t) => t.kind)));
      if (seed <= 12) {
        expect(losingFirstPairs(d.tiles).length).toBeGreaterThan(0);
        expect(fairTrap(d.tiles)).toBe(true);
      }
    }
    expect(seen.size).toBeGreaterThanOrEqual(35);
  });
  it('rejects a trap that a careful two-pair look does not avoid', () => {
    // Pairing the end ones first strands the middle, and nothing else is open: no route and no fair trap.
    const strand: Tile[] = [0, 1, 2, 1, 2, 0].map((kind, x) => ({ x, y: 0, z: 0, kind }));
    expect(solve(strand)).toBeNull();
    expect(fairTrap(strand)).toBe(false);
    const easy: Tile[] = [0, 1, 1, 0].map((kind, x) => ({ x, y: 0, z: 0, kind }));
    expect(fairTrap(easy)).toBe(true);
    expect(lookahead(easy, fullMask(easy), [0, 3])).toBe(Infinity);
    // Some clearable level-5 deals still fail it: a clearing route exists, but the greedy look can miss it.
    let unfair = 0;
    for (let seed = 1; seed <= 40; seed++) {
      const board = makeBoard(5, new Rng(seed));
      expect(solve(board)).not.toBeNull();
      if (!fairTrap(board)) unfair++;
    }
    expect(unfair).toBeGreaterThan(0);
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
    for (const level of [3, 4, 5, 6, 8, 9])
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
          // Flowers stay in twos: every rescued flower is paired with another flower.
          for (const [a, b] of solve(rescued)!)
            expect(isFlower(rescued[a].kind)).toBe(isFlower(rescued[b].kind));
          expect(solve(rescued)).not.toBeNull();
          // Open rows, never more than four (all that fits above the buttons in landscape); past 24 tiles the
          // rest are raised on supported places in the middle.
          expect(rescued.every((t) => t.x < 6 && t.y < 4)).toBe(true);
          expect(rescued.filter((t) => t.z === 0)).toHaveLength(Math.min(rescued.length, 24));
          for (const tile of rescued.filter((t) => t.z > 0))
            expect(rescued.some((t) => t.x === tile.x && t.y === tile.y && t.z === 0)).toBe(true);
          expect(new Set(rescued.map((t) => `${t.x},${t.y},${t.z}`)).size).toBe(rescued.length);
          // Continue on the original stack to exercise unlucky alternatives too.
        }
      }
    // A shuffle before any pair at level 9 lays all 30 out: 24 in four rows and 6 raised.
    const wide = makeBoard(9, new Rng(3)),
      all = reshuffle(wide, fullMask(wide), new Rng(4));
    expect([0, 1].map((z) => all.filter((t) => t.z === z).length)).toEqual([24, 6]);
    expect(solve(all)).not.toBeNull();
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
  it('pairs any two flowers at level 8, and each other picture only with itself', () => {
    const kinds = [0, 1, 2, 3, 4, 5, ...Array.from({ length: FLOWER_ART }, (_, n) => FLOWER + n)];
    for (const a of kinds)
      for (const b of kinds) {
        expect(matches(a, b)).toBe(matches(b, a));
        expect(matches(a, b)).toBe(a === b || (a >= FLOWER && b >= FLOWER));
      }
    // Levels 1–7 and 9 deal no flowers.
    for (const level of [1, 2, 3, 4, 5, 6, 7, 9])
      for (let seed = 1; seed <= 40; seed++)
        expect(makeBoard(level, new Rng(seed)).some((t) => isFlower(t.kind))).toBe(false);
    let flowerRoutes = 0,
      trapFlowerPairs = 0;
    for (let seed = 1; seed <= 100; seed++) {
      const tiles = makeBoard(8, new Rng(seed));
      expect(new Set(layout(8).map((t) => `${t.x},${t.y},${t.z}`))).toEqual(
        new Set(layout(6).map((t) => `${t.x},${t.y},${t.z}`)),
      );
      // Four flowers, each a different drawing, and five other pictures, four of each.
      const flowers = tiles.filter((t) => isFlower(t.kind)).map((t) => t.kind);
      expect(flowers.sort()).toEqual(Array.from({ length: FLOWER_ART }, (_, n) => FLOWER + n));
      for (let kind = 0; kind < 5; kind++) expect(tiles.filter((t) => t.kind === kind)).toHaveLength(4);
      // The solver and hint use the flower rule: some route pairs two different flowers.
      const route = solve(tiles)!;
      if (route.some(([a, b]) => tiles[a].kind !== tiles[b].kind)) flowerRoutes++;
      // Which two flowers go together can matter: some open flower pair leaves no route.
      for (const pair of pairs(tiles, fullMask(tiles)))
        if (isFlower(tiles[pair[0]].kind) && !solve(tiles, removePair(fullMask(tiles), pair)))
          trapFlowerPairs++;
    }
    expect(flowerRoutes).toBeGreaterThan(50);
    expect(trapFlowerPairs).toBeGreaterThan(0);
  });
  it('stacks 30 tiles at level 9 with the mask still a positive 32-bit integer and the search under a budget', () => {
    const tiles = layout(9);
    expect([0, 1, 2].map((z) => tiles.filter((t) => t.z === z).length)).toEqual([18, 8, 4]);
    expect(new Set(tiles.map((t) => `${t.x},${t.y},${t.z}`)).size).toBe(30);
    // The same six columns and three rows as levels 4, 6 and 8, so the targets keep their size.
    expect(tiles.every((t) => t.x >= 0 && t.x < 6 && t.y >= 0 && t.y < 3)).toBe(true);
    for (const tile of tiles.filter((t) => t.z > 0))
      expect(tiles.some((t) => t.x === tile.x && t.y === tile.y && t.z === tile.z - 1)).toBe(true);
    const full = fullMask(tiles);
    expect(full).toBe(2 ** 30 - 1);
    expect(Number.isInteger(full) && full > 0 && (full | 0) === full).toBe(true);
    let losing = 0,
      worst = 0;
    for (let seed = 1; seed <= 100; seed++) {
      const rng = new Rng(seed),
        board = makeBoard(9, rng);
      for (let kind = 0; kind < 6; kind++)
        expect(board.filter((t) => t.kind === kind)).toHaveLength(kind < 3 ? 6 : 4);
      if (pairs(board, full).some((p) => solve(board, removePair(full, p)) === null)) losing++;
      // Random play to a dead end or a clear board: every state's exact search stays small enough for a phone.
      let mask = full;
      for (;;) {
        const stats = { nodes: 0 };
        solve(board, mask, false, stats);
        worst = Math.max(worst, stats.nodes);
        expect(mask).toBeGreaterThanOrEqual(0);
        const open = pairs(board, mask);
        if (!open.length) break;
        mask = removePair(mask, rng.pick(open));
      }
    }
    // Measured 2026-11-12: at most about 5,000 states over 300 play-outs (2.6 ms on a Mac).
    expect(worst).toBeLessThan(20000);
    expect(losing).toBeGreaterThan(0);
  });
});
