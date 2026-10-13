import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import { free, freeTiles, fullMask, makeBoard, pairs, planFor, present, removePair, reshuffle, solve, type Tile } from './logic';

describe('Tile Pairs', () => {
  it('blocks covered tiles and tiles with both horizontal sides occupied', () => {
    const tiles = [{ x: 0, y: 0, z: 0, kind: 0 }, { x: 1, y: 0, z: 0, kind: 0 }, { x: 2, y: 0, z: 0, kind: 0 }, { x: 0, y: 0, z: 1, kind: 0 }];
    expect(freeTiles(tiles, 15)).toEqual([2, 3]);
    expect(freeTiles(tiles, 7)).toEqual([0, 2]);
    expect(free(tiles, 5, 1)).toBe(false);
    expect(freeTiles(tiles, 5)).toEqual([0, 2]);
  });
  it('has a seeded, solvable ladder with clear bounds and alternative symbol pairs', () => {
    expect(planFor(0)).toBe(planFor(1));
    expect(planFor(99)).toBe(planFor(3));
    for (let level = 1; level <= 3; level++) for (let seed = 1; seed <= 100; seed++) {
      const tiles = makeBoard(level, new Rng(seed));
      expect(tiles).toEqual(makeBoard(level, new Rng(seed)));
      expect(tiles.length).toBe([12, 20, 24][level - 1]);
      expect(new Set(tiles.map(t => `${t.x},${t.y},${t.z}`)).size).toBe(tiles.length);
      const route = solve(tiles)!;
      expect(route).not.toBeNull();
      let mask = fullMask(tiles);
      for (const pair of route) {
        expect(pairs(tiles, mask)).toContainEqual(pair);
        mask = removePair(mask, pair);
      }
      expect(mask).toBe(0);
      if (level === 3) expect(tiles.filter(t => t.kind === 0)).toHaveLength(4);
    }
    expect(makeBoard(3, new Rng(1))).not.toEqual(makeBoard(3, new Rng(2)));
  });
  it('distinguishes a match now from a clearing route and accepts alternate valid pairs', () => {
    const tiles: Tile[] = [0, 1, 1, 0].map((kind, x) => ({ x, y: 0, z: 0, kind }));
    expect(solve(tiles)).toEqual([[0, 3], [1, 2]]);
    expect(pairs(tiles, 15)).toEqual([[0, 3]]);
    const blocked = [0, 1, 0, 1].map((kind, x) => ({ x, y: 0, z: 0, kind }));
    expect(solve(blocked)).toBeNull();
    const trap = [0, 1, 2, 1, 2, 0].map((kind, x) => ({ x, y: 0, z: 0, kind }));
    expect(pairs(trap, fullMask(trap))).toEqual([[0, 5]]);
    expect(solve(trap)).toBeNull(); // A match now is not always useful help.
    expect(solve(reshuffle(trap, fullMask(trap), new Rng(5)))).not.toBeNull();
  });
  it('can recover any played remainder without returning removed tiles or losing pictures', () => {
    for (let seed = 1; seed <= 80; seed++) {
      let tiles = makeBoard(3, new Rng(seed)), mask = fullMask(tiles);
      const rng = new Rng(seed + 500);
      for (let move = 0; move < 8 && mask; move++) {
        const options = pairs(tiles, mask);
        if (options.length) mask = removePair(mask, rng.pick(options));
        const before = tiles.filter((_, i) => present(mask, i)).map(t => t.kind).sort();
        const rescued = reshuffle(tiles, mask, rng);
        expect(rescued.map(t => t.kind).sort()).toEqual(before);
        expect(solve(rescued)).not.toBeNull();
        expect(rescued.every(t => t.z === 0)).toBe(true);
        // Continue on the original stack to exercise unlucky alternatives too.
      }
    }
    const tower: Tile[] = [0, 1].map(z => ({ x: 0, y: 0, z, kind: 2 }));
    expect(solve(tower)).toBeNull();
    expect(solve(reshuffle(tower, 3, new Rng(1)))).toEqual([[0, 1]]);
  });
  it('can rebuild a complete undo snapshot and handles an empty remainder', () => {
    const tiles = makeBoard(3, new Rng(40)), snapshot = { tiles: tiles.map(t => ({ ...t })), mask: fullMask(tiles) };
    const route = solve(tiles)!;
    const mask = removePair(snapshot.mask, route[0]);
    const next = reshuffle(tiles, mask, new Rng(90));
    expect(next).toHaveLength(22);
    expect(snapshot.tiles).toEqual(tiles);
    expect(solve(snapshot.tiles, snapshot.mask)).toHaveLength(12);
    expect(reshuffle(tiles, 0, new Rng(1))).toEqual([]);
    expect(solve([])).toEqual([]);
  });
});
