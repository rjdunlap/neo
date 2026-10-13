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
    expect(planFor(99)).toBe(planFor(6));
    for (let level = 1; level <= 6; level++) for (let seed = 1; seed <= 100; seed++) {
      const tiles = makeBoard(level, new Rng(seed));
      expect(tiles).toEqual(makeBoard(level, new Rng(seed)));
      expect(tiles.length).toBe([12, 20, 24, 24, 24, 24][level - 1]);
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
  it('preserves the original three layouts and seeded picture assignments', async () => {
    const hashes = [
      '49222a3cc8e9f757e0a2a03408767978602c57539b2b31248c5a218c46cbfcdf',
      '5b55a7769400cafd4187186faea73dc87b567f49bbf046a1e00077b42850b820',
      '9a836602198362989fc55488d39b260668f4331f9de8ba01246f96b8b0347e64',
    ];
    for (let level = 1; level <= 3; level++) {
      const data = [1, 40, 4242].map(seed => makeBoard(level, new Rng(seed)));
      const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(JSON.stringify(data)));
      const hash = Array.from(new Uint8Array(digest), b => b.toString(16).padStart(2, '0')).join('');
      expect(hash).toBe(hashes[level - 1]);
    }
  });
  it('changes the paths into the stack, then increases matching alternatives without enlarging targets', () => {
    const boards = [4, 5, 6].map(level => makeBoard(level, new Rng(51)));
    expect(boards.map(b => [0, 1, 2].map(z => b.filter(t => t.z === z).length))).toEqual([[18, 4, 2], [12, 8, 4], [14, 8, 2]]);
    expect(boards.map(b => new Set(b.map(t => t.kind)).size)).toEqual([6, 5, 4]);
    expect(boards[2].filter(t => t.kind === 0)).toHaveLength(6);
    for (const board of boards) {
      expect(board.every(t => t.x >= 0 && t.x < 6 && t.y >= 0 && t.y < 4 && t.z <= 2)).toBe(true);
      // Every raised tile has a supporting tile immediately below it.
      for (const tile of board.filter(t => t.z > 0)) expect(board.some(t => t.x === tile.x && t.y === tile.y && t.z === tile.z - 1)).toBe(true);
    }
    expect(boards[0].filter(t => t.z === 1).map(t => t.x)).toEqual([1, 2, 3, 4]);
    expect(boards[1].filter(t => t.z === 1 && t.y === 0).map(t => t.x)).toEqual([0, 1, 4, 5]);
    expect(boards[2].some(t => t.x === 0 && t.y === 0)).toBe(false);
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
    for (let level = 3; level <= 6; level++) for (let seed = 1; seed <= 80; seed++) {
      const tiles = makeBoard(level, new Rng(seed));
      let mask = fullMask(tiles);
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
