import { describe, expect, it } from 'vitest';
import { GAMES } from '../games/registry';
import { BANDS } from '../progress/bands';
import { anyNew, cleanFavorites, FAVORITES_MAX, isNew, shelfFor, SHELF_SLOTS, toggleFavorite } from './shelf';

describe('which games are new', () => {
  it('is new until a round is finished', () => {
    expect(isNew({}, 'bubble-pop')).toBe(true);
    // Reading a game's level creates an empty record; that is not a play.
    expect(isNew({ 'bubble-pop': { plays: 0 } }, 'bubble-pop')).toBe(true);
    expect(isNew({ 'bubble-pop': { plays: 1 } }, 'bubble-pop')).toBe(false);
  });

  it('is judged per game, not per place', () => {
    const games = { 'bubble-pop': { plays: 3 } };
    expect(isNew(games, 'duck-pond')).toBe(true);
    expect(anyNew(games, ['bubble-pop'])).toBe(false);
    expect(anyNew(games, ['bubble-pop', 'duck-pond'])).toBe(true);
    expect(anyNew(games, [])).toBe(false);
  });
});

describe('hearts', () => {
  it('adds at the end and takes a heart back', () => {
    let list: string[] = [];
    list = toggleFavorite(list, 'a');
    list = toggleFavorite(list, 'b');
    expect(list).toEqual(['a', 'b']);
    list = toggleFavorite(list, 'a');
    expect(list).toEqual(['b']);
    list = toggleFavorite(list, 'a');
    expect(list).toEqual(['b', 'a']);
  });

  it('never changes the list it was given', () => {
    const list = ['a'];
    toggleFavorite(list, 'b');
    expect(list).toEqual(['a']);
  });

  it('stays bounded: a heart on a full list lets the oldest go', () => {
    let list: string[] = [];
    for (let i = 0; i < FAVORITES_MAX + 3; i++) list = toggleFavorite(list, `g${i}`);
    expect(list).toHaveLength(FAVORITES_MAX);
    expect(list[0]).toBe('g3');
    expect(list.at(-1)).toBe(`g${FAVORITES_MAX + 2}`);
  });

  it('cleans a damaged save', () => {
    expect(cleanFavorites(undefined)).toEqual([]);
    expect(cleanFavorites('bubble-pop')).toEqual([]);
    expect(cleanFavorites(['a', 'a', 3, null, '', 'x'.repeat(61), 'b'])).toEqual(['a', 'b']);
    const many = Array.from({ length: 40 }, (_, i) => `g${i}`);
    const kept = cleanFavorites(many);
    expect(kept).toHaveLength(FAVORITES_MAX);
    expect(kept.at(-1)).toBe('g39');
  });
});

describe('a place shelf', () => {
  it('shows only the hearted games that play in that place, in the order they were hearted', () => {
    expect(shelfFor(['c', 'a', 'z', 'b'], ['a', 'b', 'c'])).toEqual(['c', 'a', 'b']);
    expect(shelfFor([], ['a'])).toEqual([]);
    expect(shelfFor(['a'], [])).toEqual([]);
  });

  it('holds a few and keeps the newest hearts', () => {
    const all = ['a', 'b', 'c', 'd', 'e', 'f', 'g'];
    const shelf = shelfFor(all, all);
    expect(shelf).toHaveLength(SHELF_SLOTS);
    expect(shelf).toEqual(all.slice(-SHELF_SLOTS));
  });

  it('can always be filled from the real catalog, in every place', () => {
    for (const { id: band } of BANDS) {
      const here = GAMES.filter((g) => g.bands.includes(band)).map((g) => g.id);
      expect(here.length).toBeGreaterThan(SHELF_SLOTS);
      // Heart the first games of the place plus a game from somewhere else: the stranger stays off this shelf.
      const elsewhere = GAMES.find((g) => !g.bands.includes(band));
      const hearted = [...(elsewhere ? [elsewhere.id] : []), ...here.slice(0, SHELF_SLOTS + 2)];
      const shelf = shelfFor(hearted, here);
      expect(shelf).toHaveLength(SHELF_SLOTS);
      expect(shelf.every((id) => here.includes(id))).toBe(true);
    }
  });
});
