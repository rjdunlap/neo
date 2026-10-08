import { describe, expect, it } from 'vitest';
import { GAMES } from '../games/registry';
import { COUCH_INFO, demoFor } from '../couch/catalog';
import { islandDemo } from './demos';
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

describe('what the island card shows, by what she plays with', () => {
  const touch = GAMES.filter((g) => g.touchDemo);

  it('shows a pretend finger on a touch screen and a pretend mouse pointer on a desktop, for every game with a touch bot', () => {
    expect(touch.length).toBeGreaterThan(0);
    for (const g of touch) {
      expect(islandDemo(g, 3, 'toddler', 'touch')).toEqual({ input: 'finger', level: 3, band: 'toddler' });
      expect(islandDemo(g, 3, 'toddler', 'mouse')).toEqual({ input: 'mouse', level: 3, band: 'toddler' });
    }
  });

  it('plays her own level, so the window matches the "this level" line on the card, and never the couch\'s demo level', () => {
    for (const g of touch) {
      for (const band of g.bands) {
        const { min, max } = g.levels(band);
        for (let level = min; level <= max; level++) {
          const demo = islandDemo(g, level, band, 'touch');
          expect(demo, `${g.id} level ${level}`).toMatchObject({ level, band });
          expect(howToFor(g, level)?.level).toBe(g.describeLevel(demo!.level));
        }
      }
    }
  });

  it('keeps the controller demonstration for a couch game with no touch bot yet, and shows nothing for the rest', () => {
    for (const g of GAMES) {
      const demo = islandDemo(g, 1, 'toddler', 'touch');
      if (g.touchDemo) continue;
      if (demoFor(g.id)) expect(demo?.input, g.id).toBe('controller');
      else expect(demo, g.id).toBeNull();
    }
  });

  it('flags a game for the touch bot only if it is on the island (grown-up games have no touch card)', () => {
    for (const g of touch) expect(HOW_TO[g.id], g.id).toBeDefined();
  });
});
