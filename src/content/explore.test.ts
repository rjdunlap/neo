import { describe, expect, it } from 'vitest';
import { GAMES } from '../games/registry';
import { BANDS, playBand } from '../progress/bands';
import { ageOf, allGames, clampPage, favoriteGames, forgetExplore, exploreMemory, hasOthers, PAGE_SIZE, pageCount, pageOf } from './explore';
import { LANDS } from './lands';

describe('All games', () => {
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

  it('has an Other ages signpost below grown-up and none at grown-up, where nothing is older', () => {
    expect(hasOthers('lap', GAMES, LANDS)).toBe(true);
    expect(hasOthers('grownup', GAMES, LANDS)).toBe(false);
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
  it('holds at most four cards a page, the signpost last on the last page', () => {
    for (let n = 0; n <= 13; n++) {
      for (const sign of [false, true]) {
        const items = Array.from({ length: n }, (_, i) => i);
        const pages = pageCount(n, sign);
        const all = Array.from({ length: pages }, (_, p) => pageOf(items, p, sign));
        for (const page of all) expect(page.length).toBeLessThanOrEqual(PAGE_SIZE);
        expect(all.flat().filter((c) => 'game' in c).map((c) => ('game' in c ? c.game : -1))).toEqual(items);
        if (sign) expect(all.at(-1)!.at(-1)).toEqual({ signpost: true });
        // No empty page except for an empty list.
        if (n + (sign ? 1 : 0) > 0) for (const page of all) expect(page.length).toBeGreaterThan(0);
      }
    }
    // Four games and a signpost: the signpost has a page of its own.
    expect(pageCount(4, true)).toBe(2);
    expect(pageOf([1, 2, 3, 4], 1, true)).toEqual([{ signpost: true }]);
  });

  it('clamps a remembered page into range (a heart taken back can shorten the list)', () => {
    expect(clampPage(5, 6)).toBe(1);
    expect(clampPage(-2, 6)).toBe(0);
    expect(clampPage(Number.NaN, 6)).toBe(0);
    expect(pageOf([1, 2, 3, 4, 5], 9)).toEqual([{ game: 5 }]);
  });

  it('forgets the visit for a new player', () => {
    exploreMemory.pages.all = 2;
    exploreMemory.others = true;
    forgetExplore();
    expect(exploreMemory).toEqual({ pages: {}, others: false });
  });
});
