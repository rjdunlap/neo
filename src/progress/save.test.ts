import { describe, expect, it } from 'vitest';
import { defaults, migrate } from './save';

describe('migrate', () => {
  it('turns nonsense into defaults', () => {
    expect(migrate(null)).toEqual(defaults());
    expect(migrate('hello')).toEqual(defaults());
    expect(migrate([1, 2])).toEqual(defaults());
  });

  it('keeps valid fields and repairs bad ones', () => {
    const save = migrate({
      profile: { name: 'Mia', band: 'dinosaur' },
      settings: { volume: 4, music: false, sessionMinutes: 10 },
      games: { 'bubble-pop': { plays: 3, level: 0, history: [{ level: 1, misses: 2 }, 'junk'] } },
      stickers: [{ game: 'bubble-pop', seed: 5, at: 1 }, { seed: 9 }],
    });
    expect(save.profile).toEqual({ name: 'Mia', band: 'lap' });
    expect(save.settings).toEqual({ volume: 1, music: false, sessionMinutes: 10, coplayHints: true });
    expect(save.games['bubble-pop'].level).toBe(1);
    expect(save.games['bubble-pop'].pinned).toBeNull();
    expect(save.games['bubble-pop'].history).toEqual([{ level: 1, misses: 2, hints: 0, seconds: 0, at: 0 }]);
    expect(save.stickers).toEqual([{ game: 'bubble-pop', seed: 5, at: 1 }]);
  });

  it('keeps a pinned level', () => {
    expect(migrate({ games: { g: { level: 3, pinned: 5.7 } } }).games.g.pinned).toBe(5);
  });

  it('keeps only the last ten rounds', () => {
    const history = Array.from({ length: 15 }, (_, i) => ({ level: 1, misses: i, hints: 0, seconds: 1, at: i }));
    const save = migrate({ games: { g: { plays: 15, level: 1, history } } });
    expect(save.games.g.history).toHaveLength(10);
    expect(save.games.g.history[0].at).toBe(5);
  });
});
