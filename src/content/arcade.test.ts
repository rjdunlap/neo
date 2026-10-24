import { describe, expect, it } from 'vitest';
import { GAMES, playsByTouch } from '../games/registry';
import { BANDS } from '../progress/bands';
import type { GameStats } from '../progress/save';
import { arcadeFilters, arcadeList, arcadePage, arcadePages, clampArcadePage, filterLine, filterName, forgetArcade, arcadeMemory, lastPlayed, tagsFor, topicWord } from './arcade';
import { LANDS } from './lands';
import { SCRIPT as LINES } from './voice-script';
import { SUBJECTS } from './world';

const stats = (at: number[]): GameStats => ({ plays: at.length, level: 1, pinned: null, history: at.map((t) => ({ level: 1, misses: 0, hints: 0, at: t })) as GameStats['history'] });

describe('the Arcade lists (docs/rework/ARCADE.md)', () => {
  it('lists every game once under All games at every band, hers first', () => {
    for (const band of BANDS.map((b) => b.id)) {
      const all = arcadeList('all', band, GAMES, LANDS, {});
      expect(new Set(all.map((g) => g.id)).size, band).toBe(all.length);
      expect(all.length, band).toBe(GAMES.length);
    }
  });

  it('splits All games into the subjects with nothing lost or doubled', () => {
    const subjects = arcadeFilters(GAMES).filter((f) => f !== 'all' && f !== 'played');
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
    const played = arcadeList('played', 'preschool', GAMES, LANDS, { [a.id]: stats([5, 30]), [b.id]: stats([50]), [c.id]: stats([]) });
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

  it('forgets the filter and spotlight for a different player', () => {
    arcadeMemory.filter = 'played';
    arcadeMemory.spotlight = GAMES[0].id;
    forgetArcade();
    expect(arcadeMemory).toEqual({ filter: 'all', spotlight: null });
  });
});
