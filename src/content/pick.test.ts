import { describe, expect, it } from 'vitest';
import { GAMES } from '../games/registry';
import { Rng } from '../engine/random';
import { BANDS as BAND_INFO, type Band } from '../progress/bands';
import { CHALLENGE_KINDS } from '../games/types';
import { LANDS } from './lands';
import {
  againPick,
  anotherPick,
  canAnother,
  LATELY_COUNT,
  openPick,
  pickable,
  pickAtEnd,
  pickShown,
  scopePool,
  scopesFor,
  shuffledOrder,
  type PickScope,
  type PickSource,
} from './pick';

const BANDS: Band[] = BAND_INFO.map((b) => b.id);
const src = (band: Band, extra: Partial<PickSource> = {}): PickSource => ({
  band,
  catalog: GAMES,
  favorites: [],
  stats: {},
  ...extra,
});
const at = (n: number) => ({ history: [{ at: n }] }) as never;

describe('pick scopes', () => {
  it('every scope at every band holds only games she can touch-play at that band', () => {
    for (const band of BANDS) {
      const s = src(band, { favorites: GAMES.map((g) => g.id) });
      const scopes: PickScope[] = [
        { kind: 'everything' },
        { kind: 'hearts' },
        ...LANDS.map((l) => ({ kind: 'land', id: l.id }) as PickScope),
        ...CHALLENGE_KINDS.map((challenge) => ({ kind: 'challenge', challenge }) as PickScope),
      ];
      for (const scope of scopes)
        for (const id of scopePool(scope, s))
          expect(
            pickable(
              GAMES.find((g) => g.id === id),
              band,
            ),
            `${band} ${scope.kind} ${id}`,
          ).toBe(true);
    }
  });

  it('hearts: only hearted, deduplicated, and an ineligible heart is dropped rather than replaced', () => {
    const touch = GAMES.find((g) => pickable(g, 'toddler'))!;
    const s = src('toddler', { favorites: [touch.id, touch.id, 'no-such-game'] });
    expect(scopePool({ kind: 'hearts' }, s)).toEqual([touch.id]);
  });

  it('played lately: newest first, completed rounds only, at most six', () => {
    const ids = GAMES.filter((g) => pickable(g, 'preschool')).map((g) => g.id);
    const stats = Object.fromEntries(ids.map((id, i) => [id, at(100 + i)]));
    const pool = scopePool({ kind: 'lately' }, src('preschool', { stats }));
    expect(pool.length).toBe(Math.min(LATELY_COUNT, ids.length));
    expect(pool[0]).toBe(ids[ids.length - 1]);
    expect(scopePool({ kind: 'lately' }, src('preschool'))).toEqual([]);
  });

  it('empty scopes are not drawn: a new profile sees everything, lands and kinds but no hearts or lately', () => {
    const kinds = scopesFor(src('toddler')).map((s) => s.kind);
    expect(kinds).toContain('everything');
    expect(kinds).not.toContain('hearts');
    expect(kinds).not.toContain('lately');
    expect(kinds).toContain('land');
    for (const scope of scopesFor(src('toddler')))
      expect(scopePool(scope, src('toddler')).length).toBeGreaterThan(0);
  });

  it('a land scope is that land only; a challenge scope is that kind only', () => {
    const land = LANDS.find((l) => scopePool({ kind: 'land', id: l.id }, src('prek')).length > 0)!;
    for (const id of scopePool({ kind: 'land', id: land.id }, src('prek'))) expect(land.games).toContain(id);
    const kind = CHALLENGE_KINDS.find(
      (k) => scopePool({ kind: 'challenge', challenge: k }, src('prek')).length,
    )!;
    for (const id of scopePool({ kind: 'challenge', challenge: kind }, src('prek')))
      expect(GAMES.find((g) => g.id === id)!.challenge).toBe(kind);
  });

  it('everything for me is the union of the land pages she sees', () => {
    const s = src('preschool');
    const union = new Set(LANDS.flatMap((l) => scopePool({ kind: 'land', id: l.id }, s)));
    expect(new Set(scopePool({ kind: 'everything' }, s))).toEqual(union);
  });
});

describe('pick order', () => {
  const pool = ['a', 'b', 'c', 'd'];
  it('is a pure function of the seed and a permutation of the pool', () => {
    expect(shuffledOrder(pool, new Rng(7))).toEqual(shuffledOrder(pool, new Rng(7)));
    expect([...shuffledOrder(pool, new Rng(9))].sort()).toEqual(pool);
  });
  it('never opens on the game to avoid when there are two or more', () => {
    for (let seed = 1; seed < 200; seed++) expect(shuffledOrder(pool, new Rng(seed), 'a')[0]).not.toBe('a');
    expect(shuffledOrder(['a'], new Rng(1), 'a')).toEqual(['a']);
  });
  it('Another shows every game once, then the end, then Again never opens on the last shown', () => {
    for (let seed = 1; seed < 50; seed++) {
      const rng = new Rng(seed);
      let s = openPick({ kind: 'everything' }, pool, rng)!;
      const seen = [pickShown(s)!];
      while (canAnother(s)) {
        s = anotherPick(s);
        if (pickShown(s)) seen.push(pickShown(s)!);
      }
      expect(pickAtEnd(s)).toBe(true);
      expect([...seen].sort()).toEqual(pool);
      const again = againPick(s, pool, rng)!;
      expect(pickShown(again)).not.toBe(seen[seen.length - 1]);
      expect(again.at).toBe(0);
    }
  });
  it('a pool of one has no Another; an empty pool opens nothing', () => {
    const one = openPick({ kind: 'hearts' }, ['a'], new Rng(1))!;
    expect(canAnother(one)).toBe(false);
    expect(anotherPick(one)).toBe(one);
    expect(openPick({ kind: 'hearts' }, [], new Rng(1))).toBeNull();
  });
  it('writes nothing: the source objects are untouched', () => {
    const s = src('toddler', { favorites: ['x'], stats: { x: at(5) } });
    const copy = JSON.stringify(s.stats) + JSON.stringify(s.favorites);
    scopesFor(s);
    expect(JSON.stringify(s.stats) + JSON.stringify(s.favorites)).toBe(copy);
  });
});
