import { describe, expect, it } from 'vitest';
import { GAMES } from '../games/registry';
import { HOW_TO, howToFor } from './howto';

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
