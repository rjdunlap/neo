import { describe, expect, it } from 'vitest';
import { GAMES } from '../games/registry';
import { cleanExplained, EXPLAINED_MAX, HOW_TO, howToFor, markExplained, shouldExplain } from './howto';

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

describe('explaining a game the first time it opens', () => {
  const base = { enabled: true, explained: [] as string[], id: 'duck-pond', story: false };

  it('explains a game that has not been explained, once', () => {
    expect(shouldExplain(base)).toBe(true);
    expect(shouldExplain({ ...base, explained: markExplained([], 'duck-pond') })).toBe(false);
    expect(shouldExplain({ ...base, explained: ['bubble-pop'] })).toBe(true);
  });

  it('stays out of the way: off, a story request, or a game with no card', () => {
    expect(shouldExplain({ ...base, enabled: false })).toBe(false);
    expect(shouldExplain({ ...base, story: true })).toBe(false);
    expect(shouldExplain({ ...base, id: 'no-such-game' })).toBe(false);
  });

  it('can explain every game on the island, so none is left without its first card', () => {
    for (const g of GAMES) expect(shouldExplain({ ...base, id: g.id }), g.id).toBe(true);
  });

  it('marks a game once, keeps the order, and stays bounded', () => {
    expect(markExplained(['a'], 'b')).toEqual(['a', 'b']);
    expect(markExplained(['a', 'b'], 'a')).toEqual(['a', 'b']);
    const full = Array.from({ length: EXPLAINED_MAX }, (_, i) => `g${i}`);
    const next = markExplained(full, 'new');
    expect(next).toHaveLength(EXPLAINED_MAX);
    expect(next.at(-1)).toBe('new');
    expect(cleanExplained([...full, 'x'])).toHaveLength(EXPLAINED_MAX);
  });
});
