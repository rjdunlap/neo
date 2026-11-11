import { describe, expect, it } from 'vitest';
import { GAMES, playsByTouch } from '../games/registry';
import { BANDS } from '../progress/bands';
import type { GameStats } from '../progress/save';
import {
  arcadeFilters,
  arcadeList,
  arcadePage,
  arcadePages,
  clampArcadePage,
  DEFAULT_FILTER,
  filterLine,
  filterName,
  forgetArcade,
  arcadeMemory,
  lastPlayed,
  pageLabel,
  tagsFor,
  topicWord,
} from './arcade';
import { ageOf, allGames } from './explore';
import { LANDS } from './lands';
import { SCRIPT as LINES } from './voice-script';
import { SUBJECTS } from './world';

const stats = (at: number[]): GameStats => ({
  plays: at.length,
  level: 1,
  pinned: null,
  history: at.map((t) => ({ level: 1, misses: 0, hints: 0, at: t })) as GameStats['history'],
});

describe('the Arcade lists (docs/rework/ARCADE.md)', () => {
  it('lists every game once under All games at every band, hers first', () => {
    for (const band of BANDS.map((b) => b.id)) {
      const all = arcadeList('all', band, GAMES, LANDS, {});
      expect(new Set(all.map((g) => g.id)).size, band).toBe(all.length);
      expect(all.length, band).toBe(GAMES.length);
    }
  });

  it("lists exactly her own age's games under For me, land by land, at every band (docs/definitions/one-way-to-browse.md R2)", () => {
    for (const band of BANDS.map((b) => b.id)) {
      const mine = arcadeList('mine', band, GAMES, LANDS, {}).map((g) => g.id);
      const hers = GAMES.filter((g) => ageOf(g, band) === 'hers').map((g) => g.id);
      expect([...mine].sort(), band).toEqual([...hers].sort());
      // The same order All games uses, land by land.
      expect(mine, band).toEqual(
        allGames(band, GAMES, LANDS)
          .map((g) => g.id)
          .filter((id) => mine.includes(id)),
      );
      expect(mine.length, band).toBeGreaterThan(0);
    }
    // A grown-up's For me holds no game only little ones play.
    const grown = arcadeList('mine', 'grownup', GAMES, LANDS, {});
    expect(grown.every((g) => ageOf(g, 'grownup') === 'hers')).toBe(true);
    expect(grown.length).toBeLessThan(GAMES.length);
  });

  it('offers For me first and opens on it', () => {
    expect(arcadeFilters(GAMES).slice(0, 3)).toEqual(['mine', 'all', 'played']);
    expect(DEFAULT_FILTER).toBe('mine');
    expect(filterName('mine')).toBe('For me');
    expect(filterLine('mine')).toBe('arcade.mine');
  });

  it('splits All games into the subjects with nothing lost or doubled', () => {
    const subjects = arcadeFilters(GAMES).filter((f) => f !== 'mine' && f !== 'all' && f !== 'played');
    expect(subjects.length).toBeGreaterThan(0);
    for (const band of BANDS.map((b) => b.id)) {
      const all = arcadeList('all', band, GAMES, LANDS, {}).map((g) => g.id);
      const parts = subjects.flatMap((f) => arcadeList(f, band, GAMES, LANDS, {}).map((g) => g.id));
      expect([...parts].sort(), band).toEqual([...all].sort());
      // Within a subject the order is All games' order.
      for (const f of subjects) {
        const ids = arcadeList(f, band, GAMES, LANDS, {}).map((g) => g.id);
        expect(ids, `${band} ${f}`).toEqual(all.filter((id) => ids.includes(id)));
      }
    }
  });

  it('lists only played games under Played before, the most recently played first', () => {
    const [a, b, c] = GAMES;
    const played = arcadeList('played', 'preschool', GAMES, LANDS, {
      [a.id]: stats([5, 30]),
      [b.id]: stats([50]),
      [c.id]: stats([]),
    });
    expect(played.map((g) => g.id)).toEqual([b.id, a.id]);
    expect(arcadeList('played', 'preschool', GAMES, LANDS, {})).toEqual([]);
    expect(lastPlayed(undefined)).toBe(0);
  });

  it('names and speaks every filter with a line that exists', () => {
    for (const f of arcadeFilters(GAMES)) {
      expect(filterName(f).length).toBeGreaterThan(0);
      expect((LINES as Record<string, unknown>)[filterLine(f)], f).toBeDefined();
    }
    expect((LINES as Record<string, unknown>)['arcade.open']).toBeDefined();
    expect((LINES as Record<string, unknown>)['arcade.topics']).toBeDefined();
    expect((LINES as Record<string, unknown>)['arcade.empty']).toBeDefined();
    for (const s of SUBJECTS) expect(topicWord(s.id)).not.toBe(s.id);
  });

  it('tags each card with its subject, an age only when it is not hers, and Pads for a controller-only game', () => {
    for (const g of GAMES) {
      const tags = tagsFor(g, 'preschool');
      expect(tags[0]).toBe(topicWord(g.region));
      expect(tags.includes('Pads')).toBe(!playsByTouch(g));
      expect(tags.length).toBeLessThanOrEqual(3);
    }
    const hers = GAMES.find((g) => g.bands.includes('preschool'))!;
    expect(tagsFor(hers, 'preschool')).not.toContain('Bigger kids');
  });

  it('pages a list, never past its ends', () => {
    const items = Array.from({ length: 13 }, (_, i) => i);
    expect(arcadePages(13, 6)).toBe(3);
    expect(arcadePages(0, 6)).toBe(1);
    expect(arcadePage(items, 2, 6)).toEqual([12]);
    expect(arcadePage(items, 9, 6)).toEqual([12]);
    expect(clampArcadePage(-3, 13, 6)).toBe(0);
    expect(arcadePage([], 0, 6)).toEqual([]);
  });

  it('counts the pages under the grid, and hides the count on a single page', () => {
    expect(pageLabel(1, 13, 6)).toBe('2 of 3');
    expect(pageLabel(0, 175, 4)).toBe('1 of 44');
    expect(pageLabel(99, 13, 6)).toBe('3 of 3');
    expect(pageLabel(0, 6, 6)).toBeNull();
    expect(pageLabel(0, 0, 6)).toBeNull();
  });

  it('forgets the filter and spotlight for a different player', () => {
    arcadeMemory.filter = 'played';
    arcadeMemory.spotlight = GAMES[0].id;
    forgetArcade();
    expect(arcadeMemory).toEqual({ filter: 'mine', spotlight: null });
  });
});
