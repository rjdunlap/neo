import { describe, expect, it } from 'vitest';
import { GAMES } from '../games/registry';
import { COUCH_INFO, demoFor } from '../couch/catalog';
import { HOW_TO, howToFor, shouldExplain } from './howto';

describe('touch how-to cards', () => {
  it('has an entry for every game and no entry for a game that is gone', () => {
    const ids = GAMES.map((g) => g.id).sort();
    expect(Object.keys(HOW_TO).sort()).toEqual(ids);
  });

  it('keeps each card short and complete', () => {
    for (const [id, h] of Object.entries(HOW_TO)) {
      expect(h.goal.trim().length, `${id} goal`).toBeGreaterThan(8);
      expect(h.steps.length, `${id} steps`).toBeGreaterThanOrEqual(1);
      expect(h.steps.length, `${id} steps`).toBeLessThanOrEqual(4);
      for (const s of h.steps) expect(s.trim().length, `${id} step`).toBeGreaterThan(8);
      expect(h.finish.trim().length, `${id} finish`).toBeGreaterThan(8);
      if (h.note !== undefined) expect(h.note.trim().length, `${id} note`).toBeGreaterThan(8);
    }
  });

  it('adds the current level line from the game itself, for every supported level', () => {
    for (const g of GAMES) {
      for (const band of g.bands) {
        const { min, max } = g.levels(band);
        for (let level = min; level <= max; level++) {
          const card = howToFor(g, level);
          expect(card?.level, `${g.id} level ${level}`).toBe(g.describeLevel(level));
          expect(card?.title).toBe(g.name);
        }
      }
    }
  });
});

describe('explaining a game every time it opens', () => {
  const base = { enabled: true, id: 'duck-pond', story: false, again: false };

  it('explains a game each time it is opened', () => {
    expect(shouldExplain(base)).toBe(true);
    expect(shouldExplain({ ...base, id: 'bubble-pop' })).toBe(true);
  });

  it('stays out of the way: off, a story request, "again" after a round, or a game with no card', () => {
    expect(shouldExplain({ ...base, enabled: false })).toBe(false);
    expect(shouldExplain({ ...base, story: true })).toBe(false);
    expect(shouldExplain({ ...base, again: true })).toBe(false);
    expect(shouldExplain({ ...base, id: 'no-such-game' })).toBe(false);
  });

  it('can explain every game on the island, so none is left without its card', () => {
    for (const g of GAMES) expect(shouldExplain({ ...base, id: g.id }), g.id).toBe(true);
  });
});

describe('the demonstration on a card', () => {
  it('is there for exactly the island games the couch can play, and for nothing else', () => {
    const withBot = GAMES.filter((g) => demoFor(g.id)).map((g) => g.id).sort();
    const couchOnIsland = Object.keys(COUCH_INFO).filter((id) => GAMES.some((g) => g.id === id)).sort();
    expect(withBot).toEqual(couchOnIsland);
    expect(withBot).toHaveLength(15);
    expect(demoFor('monster-munch')).toBeNull();
    expect(demoFor('no-such-game')).toBeNull();
  });

  it('plays a level the game has in the band the couch plays it in', () => {
    for (const g of GAMES) {
      const demo = demoFor(g.id);
      if (!demo) continue;
      expect(g.bands, `${g.id} band`).toContain(demo.band);
      const { min, max } = g.levels(demo.band);
      expect(demo.level, `${g.id} demo level`).toBeGreaterThanOrEqual(min);
      expect(demo.level, `${g.id} demo level`).toBeLessThanOrEqual(max);
    }
  });
});
