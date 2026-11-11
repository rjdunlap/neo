import { describe, expect, it } from 'vitest';
import { GAMES } from '../games/registry';
import { BANDS, playBand } from '../progress/bands';
import {
  ageOf,
  allGames,
  clampPage,
  EXPLORE_ENTRIES,
  favoriteGames,
  forgetExplore,
  exploreMemory,
  PAGE_SIZE,
  pageCount,
  pageOf,
} from './explore';
import { LANDS } from './lands';

describe('Explore entries (U6b)', () => {
  it('are Places, Favorites, Arcade and Family play: the Arcade is the one place to browse every game', () => {
    expect([...EXPLORE_ENTRIES]).toEqual(['places', 'favorites', 'arcade', 'family']);
    expect(EXPLORE_ENTRIES).not.toContain('all' as never);
  });
});

describe('her games', () => {
  it('lists every registered game exactly once across hers and the other ages, at every band', () => {
    for (const { id: band } of BANDS) {
      const ids = [...allGames(band, GAMES, LANDS), ...allGames(band, GAMES, LANDS, true)].map((g) => g.id);
      expect(ids.length, band).toBe(GAMES.length);
      expect(new Set(ids).size, band).toBe(GAMES.length);
    }
  });

  it('goes land by land in LANDS order, each land in its own order', () => {
    const list = allGames('school', GAMES, LANDS).map((g) => g.id);
    const expected = LANDS.flatMap((l) => l.games).filter((id) => list.includes(id));
    expect(list).toEqual(expected);
  });
});

describe('Favorites', () => {
  it('is newest first and skips IDs the registry no longer has', () => {
    const [a, b] = GAMES;
    expect(favoriteGames([a.id, 'gone-game', b.id], GAMES).map((g) => g.id)).toEqual([b.id, a.id]);
  });

  it('names an older or younger game without gating it', () => {
    const older = GAMES.find((g) => ageOf(g, 'toddler') === 'bigger')!;
    const little = GAMES.find((g) => ageOf(g, 'school') === 'little')!;
    const hers = GAMES.find((g) => g.bands.includes('preschool'))!;
    expect(ageOf(hers, 'preschool')).toBe('hers');
    // Each still plays, at the band nearest hers it has.
    expect(older.bands).toContain(playBand(older.bands, 'toddler'));
    expect(little.bands).toContain(playBand(little.bands, 'school'));
  });

  it('shows one empty page with no hearts', () => {
    expect(pageCount(0)).toBe(1);
    expect(pageOf([], 0)).toEqual([]);
    expect(clampPage(3, 0)).toBe(0);
  });
});

describe('pages', () => {
  it('holds at most four games a page, every game once and no empty page but for an empty list', () => {
    for (let n = 0; n <= 13; n++) {
      const items = Array.from({ length: n }, (_, i) => i);
      const all = Array.from({ length: pageCount(n) }, (_, p) => pageOf(items, p));
      for (const page of all) expect(page.length).toBeLessThanOrEqual(PAGE_SIZE);
      expect(all.flat()).toEqual(items);
      if (n > 0) for (const page of all) expect(page.length).toBeGreaterThan(0);
    }
    expect(pageCount(4)).toBe(1);
    expect(pageCount(5)).toBe(2);
  });

  it('clamps a remembered page into range (a heart taken back can shorten the list)', () => {
    expect(clampPage(5, 6)).toBe(1);
    expect(clampPage(-2, 6)).toBe(0);
    expect(clampPage(Number.NaN, 6)).toBe(0);
    expect(pageOf([1, 2, 3, 4, 5], 9)).toEqual([5]);
  });

  it('forgets the visit for a new player', () => {
    exploreMemory.pages.favorites = 2;
    forgetExplore();
    expect(exploreMemory).toEqual({ pages: {} });
  });
});
