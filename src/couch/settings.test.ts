import { describe, expect, it } from 'vitest';
import { COUCH_INFO } from './catalog';
import { repairCouch, couchDefaults } from './party';
import { cardHint, gainFor, menuHint, nextText, nudgeVolume, PLAYER_CHOICES, placeReason, repairSettings, resolvePlace, settingsDefaults, TEXT_FACTOR, TEXT_SIZES, TV_SCALE, unitFor, VOLUME_MAX } from './settings';

describe('couch settings', () => {
  it('start as "choose for me", a little under full volume, music on, normal text and two players', () => {
    expect(settingsDefaults()).toEqual({ place: 'auto', volume: 4, music: true, text: 'normal', players: 'two' });
    expect(gainFor(settingsDefaults().volume)).toBeCloseTo(0.8);
  });

  it('repairs anything a save or a hand-edited backup might hold', () => {
    expect(repairSettings(undefined)).toEqual(settingsDefaults());
    expect(repairSettings('loud')).toEqual(settingsDefaults());
    expect(repairSettings({ place: 'tablet', volume: 'max', music: 'yes', text: 'huge', players: 3 })).toEqual(settingsDefaults());
    expect(repairSettings({ place: 'laptop', volume: 99, music: false, text: 'xlarge', players: 'one' })).toEqual({ place: 'laptop', volume: VOLUME_MAX, music: false, text: 'xlarge', players: 'one' });
    expect(repairSettings({ volume: -3 }).volume).toBe(0);
    expect(repairSettings({ volume: 2.6 }).volume).toBe(3);
    expect(repairSettings({ volume: NaN }).volume).toBe(settingsDefaults().volume);
    expect(repairSettings({ volume: Infinity }).volume).toBe(settingsDefaults().volume);
  });

  it('knows just two player counts, and a save from before the choice keeps playing for two', () => {
    expect([...PLAYER_CHOICES]).toEqual(['one', 'two']);
    expect(repairSettings({ place: 'tv', volume: 3, music: true, text: 'large' }).players).toBe('two');
    expect(repairSettings({ players: 'one' }).players).toBe('one');
    expect(repairSettings({ players: 'both' }).players).toBe('two');
  });

  it('follows what is connected unless she chose', () => {
    const laptop = { controllers: 0, scale: 1.1 }, pad = { controllers: 1, scale: 1.1 }, tv = { controllers: 0, scale: TV_SCALE };
    expect(resolvePlace('auto', laptop)).toBe('laptop');
    expect(resolvePlace('auto', pad)).toBe('tv');
    expect(resolvePlace('auto', tv)).toBe('tv');
    for (const now of [laptop, pad, tv]) {
      expect(resolvePlace('tv', now)).toBe('tv');
      expect(resolvePlace('laptop', now)).toBe('laptop');
    }
    // A 1080p screen in full screen is a TV; a laptop's own screen, even a large one with its browser chrome, is not.
    expect(1920 / 1024).toBeGreaterThanOrEqual(TV_SCALE);
    expect(Math.min(1440 / 1024, 780 / 768)).toBeLessThan(TV_SCALE);
    expect(Math.min(1728 / 1024, 1000 / 768)).toBeLessThan(TV_SCALE);
    expect(placeReason(pad)).toMatch(/controller/);
    expect(placeReason(tv)).toMatch(/TV/);
    expect(placeReason(laptop)).toMatch(/laptop/);
  });

  it('scales text on top of the window scale, never below the design size or past a readable ceiling', () => {
    expect(unitFor(1, 'normal')).toBe(1);
    expect(unitFor(1.4, 'normal')).toBeCloseTo(1.4);
    expect(unitFor(1.4, 'large')).toBeCloseTo(1.68);
    expect(unitFor(1.4, 'xlarge')).toBeCloseTo(1.96);
    expect(unitFor(0.5, 'normal')).toBe(1);
    expect(unitFor(9, 'normal')).toBe(2.2);
    expect(unitFor(NaN, 'large')).toBeCloseTo(1.2);
    for (const text of TEXT_SIZES) expect(TEXT_FACTOR[text]).toBeGreaterThanOrEqual(1);
    expect(TEXT_SIZES.map(t => TEXT_FACTOR[t])).toEqual([...TEXT_SIZES.map(t => TEXT_FACTOR[t])].sort((a, b) => a - b));
  });

  it('steps the volume without leaving 0 to 5, and cycles the text sizes', () => {
    expect(nudgeVolume(VOLUME_MAX, 1)).toBe(VOLUME_MAX);
    expect(nudgeVolume(0, -1)).toBe(0);
    expect(nudgeVolume(2, 1)).toBe(3);
    expect(nudgeVolume(2, -1)).toBe(1);
    expect(gainFor(0)).toBe(0);
    expect(gainFor(VOLUME_MAX)).toBe(1);
    expect(gainFor(99)).toBe(1);
    let t = nextText('normal');
    expect([t, t = nextText(t), t = nextText(t)]).toEqual(['large', 'xlarge', 'normal']);
  });

  it('names the right buttons for each place', () => {
    expect(menuHint('tv')).toMatch(/bottom button/);
    expect(menuHint('laptop')).toMatch(/Enter/);
    expect(menuHint('laptop')).not.toMatch(/button/i);
    expect(cardHint('tv')).toMatch(/bottom button/);
    expect(cardHint('laptop')).toMatch(/Enter/);
  });

  it('gives every control row of every couch game a keyboard equivalent to show on a laptop', () => {
    for (const info of Object.values(COUCH_INFO)) for (const row of info.controls) expect(row.keys.trim().length).toBeGreaterThan(2);
  });
});

describe('couch settings in the save', () => {
  it('are part of a new save and survive a reload exactly', () => {
    const save = couchDefaults();
    expect(save.settings).toEqual(settingsDefaults());
    save.settings = { place: 'laptop', volume: 1, music: false, text: 'large', players: 'one' };
    expect(JSON.stringify(repairCouch(JSON.parse(JSON.stringify(save))))).toBe(JSON.stringify(save));
  });

  it('are added to saves from before they existed, leaving everything else alone', () => {
    for (const version of [1, 2, 3]) {
      const out = repairCouch({ version, trips: 2, stickers: { 'penguin-slide': { count: 4, seed: 9 } }, party: null, names: ['Al', 'Bo'] });
      expect(out.settings).toEqual(settingsDefaults());
      expect(out.trips).toBe(2);
      expect(out.names).toEqual(['Al', 'Bo']);
      expect(out.stickers['penguin-slide']).toEqual({ count: 4, seed: 9 });
      // No version step: a build from before settings reads the same save and simply drops the field.
      expect(out.version).toBe(3);
    }
  });

  it('keeps the field order stable so a restored backup is written back byte for byte', () => {
    expect(Object.keys(couchDefaults().settings)).toEqual(['place', 'volume', 'music', 'text', 'players']);
    expect(Object.keys(repairCouch({ version: 3, trips: 0, stickers: {}, party: null, settings: { players: 'one', text: 'large', music: false, volume: 2, place: 'tv' } }).settings)).toEqual(['place', 'volume', 'music', 'text', 'players']);
  });
});
