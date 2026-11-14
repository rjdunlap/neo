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
  heldSides,
  isFlower,
  matches,
  fromPool,
  fullMask,
  layout,
  lessonFor,
  lessonHolds,
  fromPuzzles,
  PUZZLE_PLANS,
  SKETCHES,
  lookahead,
  losingFirstPairs,
  mirrorX,
  makeBoard,
  opensAtEnds,
  pairs,
  pairsBeforeStranded,
  peekStacks,
  planFor,
  present,
  removePair,
  reshuffle,
  seededRoute,
  solve,
  takeOf,
  type Tile,
} from './logic';
import { POOLS } from './pools';
import { PUZZLES } from './puzzles';
import { levelsInOrder } from '../../progress/difficulty';

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
    expect(planFor(99)).toBe(planFor(16));
    expect(LEVELS.grownup).toEqual({
      min: 1,
      max: 21,
      order: [1, 2, 17, 3, 18, 4, 19, 5, 20, 6, 7, 8, 9, 10, 21, 11, 12, 13, 14, 15, 16],
    });
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
  it('deals level 11 from a frozen pool of tricky towers, each with a losing first pair and a fair trap', () => {
    const plan = planFor(11),
      tiles = layout(11);
    // Level 7's tower, symmetric under the mirror the pool uses.
    expect(tiles).toEqual(layout(7));
    const keys = new Set(tiles.map((t) => `${t.x},${t.y},${t.z}`));
    for (const t of tiles) expect(keys.has(`${mirrorX(plan, t.x)},${t.y},${t.z}`)).toBe(true);
    const pool = POOLS.tower;
    expect(pool).toHaveLength(24);
    expect(new Set(pool).size).toBe(24);
    for (const kinds of pool) {
      expect(kinds).toMatch(/^[0-5]{24}$/);
      // Level 7's counts: twelve pairs over six pictures, four tiles of each.
      for (let k = 0; k < 6; k++) expect([...kinds].filter((c) => Number(c) === k)).toHaveLength(4);
      const board = tiles.map((t, i) => ({ ...t, kind: Number(kinds[i]) }));
      expect(solve(board)).not.toBeNull();
      expect(losingFirstPairs(board).length).toBeGreaterThan(0);
      expect(fairTrap(board)).toBe(true);
      expect(clearRate(board, new Rng(77), 200)).toBeLessThanOrEqual(plan.clear[1]);
    }
    const seen = new Set<string>();
    for (let seed = 1; seed <= 40; seed++) {
      const d = deal(11, new Rng(seed));
      expect(d.tiles).toEqual(fromPool(11, new Rng(seed)));
      seen.add(JSON.stringify(d.tiles.map((t) => t.kind)));
      if (seed <= 8) {
        expect(losingFirstPairs(d.tiles).length).toBeGreaterThan(0);
        expect(fairTrap(d.tiles)).toBe(true);
      }
    }
    expect(seen.size).toBeGreaterThanOrEqual(35);
  });
  it('opens level 12 above and below: the classic rule read along the other axis', () => {
    // A column of three on one layer: the middle is held in above and below, while left and right do not count.
    const column: Tile[] = [0, 1, 2].map((y) => ({ x: 0, y, z: 0, kind: 0, open: 'ends' }));
    expect(freeTiles(column, 0b111)).toEqual([0, 2]);
    expect(heldSides(column, 0b111, 1)).toEqual({ before: true, after: true });
    expect(free(column, 0b110, 1)).toBe(true);
    const row: Tile[] = [0, 1, 2].map((x) => ({ x, y: 0, z: 0, kind: 0, open: 'ends' }));
    expect(freeTiles(row, 0b111)).toEqual([0, 1, 2]);
    // On every reachable state of the crown, `free` on the ends board equals `free` on the transposed classic board.
    const tiles = layout(12),
      transposed = tiles.map(({ x, y, z, kind }) => ({ x: y, y: x, z, kind }));
    expect(opensAtEnds(tiles)).toBe(true);
    expect(opensAtEnds(layout(6))).toBe(false);
    expect(tiles.map(({ x, y, z }) => ({ x, y, z }))).toEqual(layout(6).map(({ x, y, z }) => ({ x, y, z })));
    const rng = new Rng(12);
    for (let n = 0; n < 200; n++) {
      const mask = rng.int(0, fullMask(tiles));
      for (let i = 0; i < tiles.length; i++) expect(free(tiles, mask, i)).toBe(free(transposed, mask, i));
    }
    // Some crown tiles change state: the axis is a real rule change, not a relabelling.
    expect(freeTiles(tiles, fullMask(tiles))).not.toEqual(freeTiles(layout(6), fullMask(tiles)));
  });
  it('deals level 12 on the crown in its band, every board clearing by moves legal on the short sides', () => {
    const [min, max] = planFor(12).clear;
    let exhausted = 0;
    for (let seed = 1; seed <= 100; seed++) {
      const d = deal(12, new Rng(seed)),
        tiles = d.tiles;
      expect(tiles).toEqual(makeBoard(12, new Rng(seed)));
      expect(tiles).toHaveLength(24);
      expect(tiles.every((t) => t.open === 'ends')).toBe(true);
      for (let k = 0; k < 4; k++) expect(tiles.filter((t) => t.kind === k)).toHaveLength(6);
      if (d.inBand) {
        expect(d.rate).toBeGreaterThanOrEqual(min);
        expect(d.rate).toBeLessThanOrEqual(max);
      } else exhausted++;
      const route = solve(tiles)!;
      let mask = fullMask(tiles);
      for (const pair of route) {
        expect(pairs(tiles, mask)).toContainEqual(pair);
        expect(pair.every((i) => free(tiles, mask, i))).toBe(true);
        mask = removePair(mask, pair);
      }
      expect(mask).toBe(0);
    }
    expect(exhausted).toBeLessThanOrEqual(5);
    // A shuffle keeps the board's rule, and its open rows still clear on it.
    const board = makeBoard(12, new Rng(3)),
      first = solve(board)![0],
      shuffled = reshuffle(board, removePair(fullMask(board), first), new Rng(4));
    expect(shuffled.every((t) => t.open === 'ends')).toBe(true);
    expect(solve(shuffled)).not.toBeNull();
  });
  it('lays level 13 as a brick wall: every raised tile rests on two below, drawn after them', () => {
    const tiles = layout(13);
    expect(tiles).toHaveLength(26);
    expect([0, 1, 2].map((z) => tiles.filter((t) => t.z === z).length)).toEqual([18, 5, 3]);
    expect(new Set(tiles.map((t) => `${t.x},${t.y},${t.z}`)).size).toBe(26);
    for (const t of tiles) {
      expect(Number.isInteger(t.x * 2) && Number.isInteger(t.y)).toBe(true);
      expect(t.x).toBeGreaterThanOrEqual(0);
      expect(t.x).toBeLessThanOrEqual(5);
      if (t.z === 0) continue;
      const below = tiles.filter(
        (b) => b.z === t.z - 1 && Math.abs(b.x - t.x) < 1 && Math.abs(b.y - t.y) < 1,
      );
      expect(below).toHaveLength(2);
      expect(below.every((b) => Math.abs(b.x - t.x) === 0.5)).toBe(true);
    }
    // The scene draws tiles in board order and a tap lands on the last one drawn, so a raised face that overlaps
    // two lower ones must come after both.
    for (let i = 1; i < tiles.length; i++) expect(tiles[i].z).toBeGreaterThanOrEqual(tiles[i - 1].z);
    // One raised tile holds down two, and a tile held by two above stays covered until both are gone.
    const full = fullMask(tiles),
      lower = (x: number) => tiles.findIndex((t) => t.z === 1 && t.x === x),
      top = (x: number) => tiles.findIndex((t) => t.z === 2 && t.x === x),
      without = (...gone: number[]) => gone.reduce((m, i) => m & ~(1 << i), full);
    expect(free(tiles, full, lower(0.5))).toBe(false);
    expect(free(tiles, without(top(1)), lower(0.5))).toBe(true);
    expect(free(tiles, without(top(1), lower(0.5)), lower(1.5))).toBe(false);
    expect(free(tiles, without(top(1), top(2), lower(0.5)), lower(1.5))).toBe(true);
    expect(free(tiles, full, lower(4.5))).toBe(true);
    // Every base tile of the middle row starts covered, by a half-step tile across its left or right half.
    for (const t of tiles.filter((b) => b.z === 0 && b.y === 1))
      expect(free(tiles, full, tiles.indexOf(t))).toBe(false);
    // Peek puts every tile in exactly one stack.
    const stacked = peekStacks(tiles, full).flat();
    expect(new Set(stacked).size).toBe(stacked.length);
    expect(
      peekStacks(tiles, full).every((s) => s.every((i, n) => !n || tiles[i].z > tiles[s[n - 1]].z)),
    ).toBe(true);
  });
  it('deals level 13 in its band, and 100 seeds clear by legal moves', () => {
    const [min, max] = planFor(13).clear;
    for (let seed = 1; seed <= 100; seed++) {
      const d = deal(13, new Rng(seed));
      expect(d.inBand).toBe(true);
      expect(d.rate).toBeGreaterThanOrEqual(min);
      expect(d.rate).toBeLessThanOrEqual(max);
      expect(d.tiles).toEqual(makeBoard(13, new Rng(seed)));
      const route = solve(d.tiles)!;
      expect(route).not.toBeNull();
      let mask = fullMask(d.tiles);
      for (const pair of route) {
        expect(pairs(d.tiles, mask)).toContainEqual(pair);
        mask = removePair(mask, pair);
      }
      expect(mask).toBe(0);
    }
    const board = makeBoard(13, new Rng(3));
    expect(solve(reshuffle(board, removePair(fullMask(board), solve(board)![0]), new Rng(4)))).not.toBeNull();
  });
  it('deals level 14 on the crown with six of each of four pictures, taken three alike', () => {
    const tiles = makeBoard(14, new Rng(2));
    expect(takeOf(tiles)).toBe(3);
    expect(tiles.map(({ x, y, z }) => `${x},${y},${z}`)).toEqual(
      layout(6).map(({ x, y, z }) => `${x},${y},${z}`),
    );
    const counts = new Map<number, number>();
    for (const t of tiles) counts.set(t.kind, (counts.get(t.kind) ?? 0) + 1);
    expect([...counts.values()]).toEqual([6, 6, 6, 6]);
    // Every move is three free tiles of one picture, and every such set is a move.
    const mask = fullMask(tiles),
      open = freeTiles(tiles, mask),
      moves = pairs(tiles, mask);
    for (const m of moves) {
      expect(m).toHaveLength(3);
      expect(m.every((i) => open.includes(i) && tiles[i].kind === tiles[m[0]].kind)).toBe(true);
    }
    let alike = 0;
    for (const k of counts.keys()) {
      const n = open.filter((i) => tiles[i].kind === k).length;
      alike += (n * (n - 1) * (n - 2)) / 6;
    }
    expect(moves).toHaveLength(alike);
    // Taking three clears all three bits and nothing else.
    const [a, b, c] = [0, 1, 2];
    expect(removePair(fullMask(tiles), [a, b, c])).toBe(fullMask(tiles) & ~7);
  });
  it('deals level 14 in its band, and 100 seeds clear in threes by legal moves', () => {
    const [min, max] = planFor(14).clear;
    let trap = 0;
    for (let seed = 1; seed <= 100; seed++) {
      const d = deal(14, new Rng(seed));
      expect(d.inBand).toBe(true);
      expect(d.rate).toBeGreaterThanOrEqual(min);
      expect(d.rate).toBeLessThanOrEqual(max);
      const route = solve(d.tiles)!;
      expect(route).toHaveLength(8);
      let mask = fullMask(d.tiles);
      for (const set of route) {
        expect(pairs(d.tiles, mask)).toContainEqual(set);
        mask = removePair(mask, set);
      }
      expect(mask).toBe(0);
      if (losingFirstPairs(d.tiles).length) trap++;
    }
    // Which three of six to take matters: many deals have a first set that leaves no route (44 of these 100).
    expect(trap).toBeGreaterThan(25);
  });
  it('reshuffles a three-alike remainder into open rows that still clear in threes', () => {
    // A shuffle before any set lays all 24 in four rows of six, and the geometric route still clears them.
    for (let seed = 1; seed <= 20; seed++) {
      const board = makeBoard(14, new Rng(seed)),
        all = reshuffle(board, fullMask(board), new Rng(seed + 50));
      expect(all).toHaveLength(24);
      expect(solve(all)).toHaveLength(8);
    }
    for (let seed = 1; seed <= 40; seed++) {
      const tiles = makeBoard(14, new Rng(seed)),
        rng = new Rng(seed + 900);
      let mask = fullMask(tiles);
      for (let move = 0; move < 7 && mask; move++) {
        const options = pairs(tiles, mask);
        if (!options.length) break;
        mask = removePair(mask, rng.pick(options));
        const before = tiles
          .filter((_, i) => present(mask, i))
          .map((t) => t.kind)
          .sort();
        const rescued = reshuffle(tiles, mask, rng);
        expect(takeOf(rescued)).toBe(3);
        expect(rescued.map((t) => t.kind).sort()).toEqual(before);
        expect(rescued.every((t) => t.z === 0 && t.x < 6 && t.y < 4)).toBe(true);
        // Three left lie in three rows of one, so the last set is never a row whose middle is held in.
        if (rescued.length === 3) expect(freeTiles(rescued, fullMask(rescued))).toHaveLength(3);
        const route = solve(rescued)!;
        expect(route).not.toBeNull();
        for (const set of route) expect(set).toHaveLength(3);
      }
    }
  });
  it('agrees with the whole-step rule on every earlier board', () => {
    // `free` as it was before half steps: covered only by a tile exactly above, sides on the same row or column.
    const before = (tiles: readonly Tile[], mask: number, i: number) => {
      if (!(mask & (1 << i))) return false;
      const a = tiles[i];
      let l = false,
        r = false;
      tiles.forEach((b, j) => {
        if (j === i || !(mask & (1 << j))) return;
        if (a.x === b.x && a.y === b.y && b.z > a.z) l = r = true;
        if (a.z !== b.z) return;
        const [line, along] = a.open === 'ends' ? [b.x === a.x, b.y - a.y] : [b.y === a.y, b.x - a.x];
        if (line && along === -1) l = true;
        if (line && along === 1) r = true;
      });
      return !l || !r;
    };
    const rng = new Rng(13);
    for (const level of [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 17, 18, 19, 20, 21]) {
      const tiles = layout(level);
      for (let n = 0; n < 60; n++) {
        const mask = rng.int(0, fullMask(tiles));
        for (let i = 0; i < tiles.length; i++) expect(free(tiles, mask, i)).toBe(before(tiles, mask, i));
      }
    }
  });
  it('deals levels 1–10 and 17–21 exactly as before levels 11 and 12 were added', () => {
    // Fingerprint of seeds 1–5 at each level, taken from the rules on origin/main before this change.
    const boards: string[] = [];
    for (const level of [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 17, 18, 19, 20, 21])
      for (let seed = 1; seed <= 5; seed++)
        boards.push(
          makeBoard(level, new Rng(seed))
            .map((t) => `${t.x}${t.y}${t.z}${t.kind}`)
            .join(''),
        );
    // FNV-1a over the boards, so the pin is one short value.
    let hash = 0x811c9dc5;
    for (const c of boards.join('|')) hash = Math.imul(hash ^ c.charCodeAt(0), 0x01000193) >>> 0;
    expect(hash.toString(16)).toBe('44db71e6');
    // Levels 11 and 12, pinned from origin/main before level 13's half steps changed `free`.
    let later = 0x811c9dc5;
    const boards1112 = [11, 12].flatMap((level) =>
      [1, 2, 3, 4, 5].map((seed) =>
        makeBoard(level, new Rng(seed))
          .map((t) => `${t.x}${t.y}${t.z}${t.kind}`)
          .join(''),
      ),
    );
    for (const c of boards1112.join('|')) later = Math.imul(later ^ c.charCodeAt(0), 0x01000193) >>> 0;
    expect(later.toString(16)).toBe('ab01f483');
    // Level 13, pinned from origin/main before level 14's sets of three.
    let brick = 0x811c9dc5;
    const boards13 = [1, 2, 3, 4, 5].map((seed) =>
      makeBoard(13, new Rng(seed))
        .map((t) => `${t.x}${t.y}${t.z}${t.kind}`)
        .join(''),
    );
    for (const c of boards13.join('|')) brick = Math.imul(brick ^ c.charCodeAt(0), 0x01000193) >>> 0;
    expect(brick.toString(16)).toBe('16720b90');
    // Level 14, pinned from origin/main before levels 15–16 widened the mask and pruned the search.
    let three = 0x811c9dc5;
    const boards14 = [1, 2, 3, 4, 5].map((seed) =>
      makeBoard(14, new Rng(seed))
        .map((t) => `${t.x}${t.y}${t.z}${t.kind}`)
        .join(''),
    );
    for (const c of boards14.join('|')) three = Math.imul(three ^ c.charCodeAt(0), 0x01000193) >>> 0;
    expect(three.toString(16)).toBe('2a4d26d');
    for (const level of [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 15, 16, 17, 18, 19, 20, 21])
      expect(takeOf(makeBoard(level, new Rng(1)))).toBe(2);
    for (const level of [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 13, 14, 15, 16, 17, 18, 19, 20, 21])
      expect(opensAtEnds(makeBoard(level, new Rng(1)))).toBe(false);
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
    for (const level of [3, 4, 5, 6, 8, 9, 15, 16])
      for (let seed = 1; seed <= (level >= 15 ? 20 : 80); seed++) {
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
          expect(rescued.every((t) => Number.isInteger(t.x) && Number.isInteger(t.y))).toBe(true);
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
    // Level 16's whole 40 fits too: 24 in four rows and 16 raised, the first six where level 9's go.
    const great = makeBoard(16, new Rng(3)),
      every = reshuffle(great, fullMask(great), new Rng(4));
    expect([0, 1].map((z) => every.filter((t) => t.z === z).length)).toEqual([24, 16]);
    expect(new Set(every.map((t) => `${t.x},${t.y},${t.z}`)).size).toBe(40);
    expect(solve(every)).not.toBeNull();
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
  it('holds 36 and 40 tiles in the mask: every bit reads back and a tile already gone stays gone', () => {
    const tiles = layout(16),
      full = fullMask(tiles);
    expect(tiles).toHaveLength(40);
    expect(full).toBe(2 ** 40 - 1);
    expect(Number.isSafeInteger(full)).toBe(true);
    for (let i = 0; i < 40; i++) {
      expect(present(full, i)).toBe(true);
      const without = removePair(full, [i]);
      expect(without).toBe(full - 2 ** i);
      for (let j = 0; j < 40; j += 7) expect(present(without, j)).toBe(j !== i);
      expect(removePair(without, [i])).toBe(without);
    }
    expect(
      removePair(
        full,
        tiles.map((_, i) => i),
      ),
    ).toBe(0);
    expect(present(fullMask(layout(15)), 35)).toBe(true);
    expect(present(fullMask(layout(15)), 36)).toBe(false);
  });
  it('stacks levels 15 and 16 on six columns, every raised tile supported', () => {
    const big = layout(15),
      great = layout(16);
    expect([0, 1, 2].map((z) => big.filter((t) => t.z === z).length)).toEqual([24, 8, 4]);
    expect([0, 1, 2].map((z) => great.filter((t) => t.z === z).length)).toEqual([24, 12, 4]);
    // Level 16 is level 15 with four more raised tiles: four rows, since five do not fit above the buttons in landscape.
    for (const t of big) expect(great).toContainEqual(t);
    for (const [tiles, rows] of [
      [big, 4],
      [great, 4],
    ] as const) {
      expect(new Set(tiles.map((t) => `${t.x},${t.y},${t.z}`)).size).toBe(tiles.length);
      expect(tiles.every((t) => Number.isInteger(t.x) && t.x >= 0 && t.x < 6 && t.y >= 0 && t.y < rows)).toBe(
        true,
      );
      for (const tile of tiles.filter((t) => t.z > 0))
        expect(tiles.some((t) => t.x === tile.x && t.y === tile.y && t.z === tile.z - 1)).toBe(true);
      // Symmetric left to right, so neither side is the easy one.
      for (const t of tiles)
        expect(tiles.some((u) => u.x === 5 - t.x && u.y === t.y && u.z === t.z)).toBe(true);
    }
  });
  it('deals levels 15 and 16 in their band, and 100 seeds clear by legal moves', () => {
    for (const level of [15, 16]) {
      const [min, max] = planFor(level).clear;
      for (let seed = 1; seed <= 100; seed++) {
        const d = deal(level, new Rng(seed)),
          tiles = d.tiles;
        expect(d.inBand).toBe(true);
        expect(d.rate).toBeGreaterThanOrEqual(min);
        expect(d.rate).toBeLessThanOrEqual(max);
        expect(tiles).toEqual(makeBoard(level, new Rng(seed)));
        for (let kind = 0; kind < 6; kind++) expect(tiles.filter((t) => t.kind === kind).length % 2).toBe(0);
        const route = solve(tiles)!;
        let mask = fullMask(tiles);
        for (const pair of route) {
          expect(pairs(tiles, mask)).toContainEqual(pair);
          mask = removePair(mask, pair);
        }
        expect(mask).toBe(0);
      }
    }
  });
  it('keeps the exact search under a budget on every state of 50 random play-outs at levels 15 and 16', () => {
    let worst = 0;
    for (const level of [15, 16])
      for (let seed = 1; seed <= 50; seed++) {
        const rng = new Rng(seed + 700),
          board = makeBoard(level, new Rng(seed));
        let mask = fullMask(board);
        for (;;) {
          const stats = { nodes: 0 };
          solve(board, mask, false, stats);
          worst = Math.max(worst, stats.nodes);
          const open = pairs(board, mask);
          if (!open.length) break;
          mask = removePair(mask, rng.pick(open));
        }
      }
    // Measured 2026-11-14: about 9,000 states at worst over 100 play-outs (under 10 ms on a Mac). Without the
    // pruning in `solve` the 40-tile board reached 2.3 million states (0.8 s) on one stranded state.
    expect(worst).toBeLessThan(50000);
  });
  it('prunes the exact search without changing which boards clear', () => {
    // The plain search `solve` used before levels 15–16: every matching move, memoized dead states.
    const plain = (tiles: readonly Tile[], mask: number) => {
      const dead = new Set<number>();
      const visit = (m: number): boolean => {
        if (!m) return true;
        if (dead.has(m)) return false;
        if (pairs(tiles, m).some((p) => visit(removePair(m, p)))) return true;
        dead.add(m);
        return false;
      };
      return visit(mask);
    };
    let stranded = 0;
    for (const level of [3, 5, 6, 7, 8, 10, 12, 13, 14, 15])
      for (let seed = 1; seed <= 8; seed++) {
        const rng = new Rng(seed + 900),
          board = makeBoard(level, new Rng(seed));
        let mask = fullMask(board);
        for (;;) {
          const route = solve(board, mask);
          expect(route !== null).toBe(plain(board, mask));
          if (!route) stranded++;
          let m = mask;
          for (const pair of route ?? []) {
            expect(pairs(board, m)).toContainEqual(pair);
            m = removePair(m, pair);
          }
          const open = pairs(board, mask);
          if (!open.length) break;
          mask = removePair(mask, rng.pick(open));
        }
      }
    expect(stranded).toBeGreaterThan(20);
  });
  it('steps through every level once, keeping levels 1–10 in their order with each lesson before the board it serves', () => {
    const order = levelsInOrder(LEVELS.grownup!);
    expect(new Set(order).size).toBe(order.length);
    expect(order.filter((l) => l <= 10)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    expect(order.filter((l) => l >= 17)).toEqual(Object.keys(PUZZLE_PLANS).map(Number));
    for (const [lesson, before] of [
      [17, 3],
      [18, 4],
      [19, 5],
      [20, 6],
    ])
      expect(order.indexOf(lesson)).toBe(order.indexOf(before) - 1);
    // Two pairs ahead comes after level 10, then the second-pass levels in the dive's proposed order.
    expect(order.slice(-7)).toEqual([21, 11, 12, 13, 14, 15, 16]);
    for (const level of order) expect(planFor(level).name).toBeTruthy();
    expect(new Set(order.map((l) => planFor(l).name)).size).toBe(order.length);
    for (let level = 1; level <= 10; level++) expect(lessonFor(level)).toBeNull();
  });
  it('deals levels 17–21 from designed boards that each teach their lesson, mirrored or renamed', () => {
    for (const level of Object.keys(PUZZLE_PLANS).map(Number)) {
      const plan = planFor(level),
        lesson = lessonFor(level)!,
        tiles = layout(level);
      expect(lesson).toBe('puzzle' in plan && plan.puzzle);
      const n = level === 21 ? 18 : 14;
      expect(tiles).toHaveLength(n);
      // Every lesson stack is at most three deep, so Peek reads it in one row.
      expect(Math.max(...tiles.map((t) => t.z))).toBeLessThan(3);
      expect(tiles.map((t) => [t.x, t.y, t.z])).toEqual(SKETCHES[lesson]);
      expect(new Set(tiles.map((t) => `${t.x},${t.y},${t.z}`)).size).toBe(n);
      for (const t of tiles.filter((t) => t.z > 0))
        expect(tiles.some((u) => u.x === t.x && u.y === t.y && u.z === t.z - 1)).toBe(true);
      // The sketch is symmetric under the mirror, so a mirrored board is the same lesson.
      const keys = new Set(tiles.map((t) => `${t.x},${t.y},${t.z}`));
      for (const t of tiles) expect(keys.has(`${mirrorX(plan, t.x)},${t.y},${t.z}`)).toBe(true);
      const boards = PUZZLES[lesson];
      expect(boards.length).toBeGreaterThanOrEqual(6);
      expect(boards.length).toBeLessThanOrEqual(8);
      expect(new Set(boards).size).toBe(boards.length);
      for (const kinds of boards) {
        expect(kinds).toMatch(new RegExp(`^[0-3]{${n}}$`));
        const board = tiles.map((t, i) => ({ ...t, kind: Number(kinds[i]) }));
        expect(solve(board)).not.toBeNull();
        expect(lessonHolds(lesson, board)).toBe(true);
        // A lesson board does not pass for another lesson's habit by accident of its counts.
        for (let k = 0; k < 4; k++) expect(board.filter((t) => t.kind === k).length % 2).toBe(0);
      }
      const seen = new Set<string>();
      let mirrored = 0;
      for (let seed = 1; seed <= 60; seed++) {
        const d = deal(level, new Rng(seed));
        expect(d.tiles).toEqual(makeBoard(level, new Rng(seed)));
        expect(d.tiles).toEqual(fromPuzzles(level, new Rng(seed)));
        expect(d.inBand).toBe(true);
        expect(Math.max(...d.tiles.map((t) => t.kind))).toBeLessThan(6);
        expect(lessonHolds(lesson, d.tiles)).toBe(true);
        const plain = boards.some((kinds) => {
          const names = new Map<number, string>();
          return d.tiles.every((t, i) => {
            const was = names.get(t.kind);
            if (was === undefined) names.set(t.kind, kinds[i]);
            return (was ?? kinds[i]) === kinds[i];
          });
        });
        if (!plain) mirrored++;
        seen.add(JSON.stringify(d.tiles.map((t) => t.kind)));
      }
      expect(mirrored).toBeGreaterThan(0);
      expect(seen.size).toBeGreaterThanOrEqual(40);
    }
  });
  it('tells the lessons apart: pairing the two free twins strands the stack, and the top twin is safe', () => {
    // Level 17's first board: find its twin picture and check both choices directly.
    const tiles = layout(17).map((t, i) => ({ ...t, kind: Number(PUZZLES.twins[0][i]) })),
      full = fullMask(tiles),
      [losing] = losingFirstPairs(tiles);
    expect(losingFirstPairs(tiles)).toHaveLength(1);
    const k = tiles[losing[0]].kind,
      top = tiles.findIndex(
        (t) =>
          t.kind === k &&
          t.z === 1 &&
          tiles.some((u) => u.kind === k && u.x === t.x && u.y === t.y && u.z === 0),
      );
    expect(top).toBeGreaterThanOrEqual(0);
    expect(solve(tiles, removePair(full, losing))).toBeNull();
    for (const other of losing) expect(solve(tiles, removePair(full, [top, other]))).not.toBeNull();
    // A board that is merely solvable is not a lesson.
    expect(lessonHolds('twins', makeBoard(1, new Rng(3)))).toBe(false);
  });
  it('The long row: nothing is covered, and the safe pair is the two row ends around the buried fourth copy', () => {
    for (const kinds of PUZZLES.long) {
      const tiles = layout(20).map((t, i) => ({ ...t, kind: Number(kinds[i]) })),
        full = fullMask(tiles),
        losing = losingFirstPairs(tiles),
        k = tiles[losing[0][0]].kind,
        open = freeTiles(tiles, full).filter((i) => tiles[i].kind === k),
        fourth = tiles.findIndex((t, i) => t.kind === k && !open.includes(i));
      expect(tiles.every((t) => t.z === 0)).toBe(true);
      expect(open).toHaveLength(3);
      // What the lesson line says: pair the copies at the ends of the fourth's row, keep the one from another row.
      const inRow = open.filter((i) => tiles[i].y === tiles[fourth].y);
      expect(inRow).toHaveLength(2);
      expect(solve(tiles, removePair(full, [inRow[0], inRow[1]]))).not.toBeNull();
      const kept = open.find((i) => !inRow.includes(i))!;
      for (const i of inRow) expect(solve(tiles, removePair(full, [kept, i]))).toBeNull();
    }
    // A layered lesson board is not a long-row lesson.
    const twins = layout(17).map((t, i) => ({ ...t, kind: Number(PUZZLES.twins[0][i]) }));
    expect(lessonHolds('long', twins)).toBe(false);
  });
  it('Two pairs ahead: every losing first pair leaves at least two pairs before the board strands, and the trap is fair', () => {
    for (const kinds of PUZZLES.ahead) {
      const tiles = layout(21).map((t, i) => ({ ...t, kind: Number(kinds[i]) })),
        full = fullMask(tiles),
        losing = losingFirstPairs(tiles);
      expect(losing.length).toBeGreaterThan(0);
      for (const p of losing) {
        const after = removePair(full, p);
        expect(solve(tiles, after)).toBeNull();
        expect(pairsBeforeStranded(tiles, after)).toBeGreaterThanOrEqual(2);
        // Some pair is still open right after the choice, so the trap is not visible one pair out.
        expect(pairs(tiles, after).length).toBeGreaterThan(0);
      }
      expect(fairTrap(tiles)).toBe(true);
    }
    // An emptied board never strands.
    expect(pairsBeforeStranded(layout(21), 0)).toBe(Infinity);
  });
});
