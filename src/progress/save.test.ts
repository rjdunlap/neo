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
    expect(save.settings).toEqual({ placeLayout: 'path', volume: 1, music: false, sessionMinutes: 10, coplayHints: true });
    expect(save.games['bubble-pop'].level).toBe(1);
    expect(save.games['bubble-pop'].pinned).toBeNull();
    expect(save.games['bubble-pop'].history).toEqual([{ level: 1, misses: 2, hints: 0, seconds: 0, at: 0 }]);
    expect(save.stickers).toEqual([{ game: 'bubble-pop', seed: 5, at: 1 }]);
  });

  it('defaults old saves to the path and preserves a subject-layout backup with progress', () => {
    expect(migrate({ settings: { placeLayout: 'invalid' } }).settings.placeLayout).toBe('path');
    const save = defaults();
    save.settings.placeLayout = 'subjects';
    save.games['bubble-pop'] = { plays: 4, level: 3, pinned: 2, history: [] };
    save.stickers.push({ game: 'bubble-pop', seed: 4, at: 1 });
    expect(migrate(JSON.parse(JSON.stringify(save)))).toEqual(save);
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

  it('upgrades a version-one save without losing progress or earned stickers', () => {
    const legacy = { version: 1, profile: { name: 'Mia', band: 'preschool' }, games: { 'bubble-pop': { plays: 7, level: 3, pinned: 2, history: [] } }, stickers: [{ game: 'bubble-pop', seed: 42, at: 10 }] };
    const save = migrate(legacy);
    expect(save.version).toBe(2);
    expect(save.profile).toEqual(legacy.profile);
    expect(save.games).toEqual(legacy.games);
    expect(save.stickers).toEqual(legacy.stickers);
    expect(save.pet).toEqual({ name: 'Pip', color: 'teal', hatched: false });
    expect(save.world).toEqual({ band: null });
  });

  it('repairs pet settings and the celebrated band from untrusted backups, dropping retired region lists', () => {
    const save = migrate({ pet: { name: '   ', color: 'ultraviolet', hatched: 'yes' }, world: { opened: ['treehouse', 'treehouse', 'missing', 4], band: 'not-a-band' } });
    expect(save.pet).toEqual(defaults().pet);
    expect(save.world).toEqual({ band: null });
    const valid = migrate({ pet: { name: ' Clover ', color: 'purple', hatched: true }, world: { opened: ['story-grove'], band: 'preschool' } });
    expect(valid.pet).toEqual({ name: 'Clover', color: 'purple', hatched: true });
    expect(valid.world).toEqual({ band: 'preschool' });
  });

  it('keeps the early-school band (Wonder Woods) for the child and the celebrated trail position', () => {
    const save = migrate({ profile: { name: 'Mia', band: 'school' }, world: { band: 'school' } });
    expect(save.profile.band).toBe('school');
    expect(save.world).toEqual({ band: 'school' });
  });

  it('preserves valid sticker placements, clamps positions, and removes invalid placements', () => {
    const base = { game: 'memory-match', seed: 9, at: 22 };
    const save = migrate({ stickers: [
      { ...base, placement: { page: 'space', x: 0.3, y: 0.7 } },
      { ...base, placement: { page: 'sea', x: -3, y: 4 } },
      { ...base, placement: { page: 'bogus', x: 0, y: 1 } },
      { ...base, placement: { page: 'meadow', x: NaN, y: Infinity } },
    ] });
    expect(save.stickers[0].placement).toEqual({ page: 'space', x: 0.3, y: 0.7 });
    expect(save.stickers[1].placement).toEqual({ page: 'sea', x: 0, y: 1 });
    expect(save.stickers[2]).toEqual(base);
    expect(save.stickers[3]).toEqual(base);
    expect(migrate(JSON.parse(JSON.stringify(save)))).toEqual(save);
  });

  it('starts the Windy Picnic untold, and repairs story progress from untrusted backups', () => {
    expect(migrate({}).stories).toEqual({ picnic: { steps: [], ended: false, keepsake: false } });
    // Unknown and repeated steps drop out and the rest keep story order; an ending needs every step.
    const odd = migrate({ stories: { picnic: { steps: ['invitation', 'dragon', 'blanket', 'blanket', 7], ended: true, keepsake: 'yes' } } });
    expect(odd.stories.picnic).toEqual({ steps: ['blanket', 'invitation'], ended: false, keepsake: false });
    // A finished telling always keeps its keepsake, and a keepsake survives a retelling.
    expect(migrate({ stories: { picnic: { steps: ['blanket', 'sandwiches', 'invitation'], ended: true } } }).stories.picnic.keepsake).toBe(true);
    expect(migrate({ stories: { picnic: { steps: [], ended: false, keepsake: true } } }).stories.picnic).toEqual({ steps: [], ended: false, keepsake: true });
    expect(migrate({ stories: 'nope' }).stories).toEqual(defaults().stories);
  });

  it('keeps picnic progress through a backup and restore, with older progress untouched', () => {
    const save = defaults();
    save.games['pet-kitchen'] = { plays: 2, level: 3, pinned: null, history: [] };
    save.stickers.push({ game: 'pet-kitchen', seed: 4, at: 1 });
    save.stories.picnic = { steps: ['sandwiches'], ended: false, keepsake: true };
    expect(migrate(JSON.parse(JSON.stringify(save)))).toEqual(save);
  });
});
