import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// IndexedDB is replaced by a Map: set() copies what it is given, as IndexedDB does, and get() can be made to fail or wait.
const { disk, ctl } = vi.hoisted(() => ({
  disk: new Map<string, unknown>(),
  ctl: { fail: ((_key: string) => false) as (key: string) => boolean, gate: new Map<string, Promise<void>>() },
}));
vi.mock('idb-keyval', () => ({
  get: async (key: string) => {
    await ctl.gate.get(key);
    if (ctl.fail(key)) throw new Error('cannot read');
    return structuredClone(disk.get(key));
  },
  set: async (key: string, value: unknown) => void disk.set(key, structuredClone(value)),
  del: async (key: string) => void disk.delete(key),
}));

import { MAX_PROFILES, INDEX_KEY, type ProfileIndex } from './profiles';
import { defaults, type SaveData } from './save';
import { Store } from './store';

const counter = () => {
  let n = 0;
  return () => `id${String(++n).padStart(4, '0')}`;
};
const NOW = new Date(2026, 9, 15).getTime();
const make = () => new Store(counter(), () => NOW);
const savedAs = (key: string) => disk.get(key) as SaveData;
const indexOnDisk = () => disk.get(INDEX_KEY) as ProfileIndex;

beforeEach(() => {
  disk.clear();
  ctl.fail = () => false;
  ctl.gate.clear();
  vi.useFakeTimers();
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe('the first profile', () => {
  it('is the save a device already has, left exactly where and as it is', async () => {
    const mia = defaults();
    mia.profile.name = 'Mia';
    mia.stickers.push({ game: 'bubble-pop', seed: 4, at: 1 });
    disk.set('neo.save', mia);
    const before = JSON.stringify(disk.get('neo.save'));

    const store = make();
    await store.load();
    expect(store.data).toEqual(mia);
    expect(store.profiles).toHaveLength(1);
    expect(store.profiles[0]).toMatchObject({ id: 'id0001', legacy: true, birth: null, startBand: null });
    expect(indexOnDisk().active).toBe('id0001');
    expect(JSON.stringify(disk.get('neo.save'))).toBe(before);

    store.data.profile.name = 'Mia R';
    store.save();
    vi.advanceTimersByTime(300);
    expect(savedAs('neo.save').profile.name).toBe('Mia R');
    expect([...disk.keys()].sort()).toEqual(['neo.profiles', 'neo.save']);
  });

  it('is a blank save on a new device, written down only once something changes', async () => {
    const store = make();
    await store.load();
    expect(store.data).toEqual(defaults());
    expect(indexOnDisk().profiles).toHaveLength(1);
    expect(disk.has('neo.save')).toBe(false);
  });

  it('is found again on the next run, with the same id', async () => {
    const first = make();
    await first.load();
    const second = new Store(counter(), () => NOW);
    await second.load();
    expect(second.activeId).toBe(first.activeId);
  });

  it('keeps nothing about who someone is inside the save, where an older build would strip it', async () => {
    const store = make();
    await store.load();
    store.setBirth(store.activeId, { month: 10, year: 2024 });
    store.data.profile.name = 'Mia';
    store.save();
    vi.advanceTimersByTime(300);
    expect(JSON.stringify(disk.get('neo.save'))).not.toMatch(/birth|startBand|2024/);
    expect(indexOnDisk().profiles[0].birth).toEqual({ month: 10, year: 2024 });
  });
});

describe('switching profiles', () => {
  it('writes the one being left under its own key, even with a save still waiting', async () => {
    const store = make();
    await store.load();
    const a = store.activeId;
    store.data.profile.name = 'Alice';
    store.save(); // the timer has not fired
    const b = store.addProfile()!;
    expect(await store.switchTo(b)).toBe(true);

    expect(savedAs('neo.save').profile.name).toBe('Alice');
    expect(store.activeId).toBe(b);
    expect(store.data.profile.name).toBe('');
    expect(indexOnDisk().active).toBe(b);

    store.data.profile.name = 'Bob';
    store.save();
    expect(await store.switchTo(a)).toBe(true);
    expect(savedAs(`neo.save.${b}`).profile.name).toBe('Bob');
    expect(store.data.profile.name).toBe('Alice');
    // Nothing is left to fire later and write the wrong profile.
    vi.advanceTimersByTime(1000);
    expect(savedAs('neo.save').profile.name).toBe('Alice');
    expect(savedAs(`neo.save.${b}`).profile.name).toBe('Bob');
  });

  it('keeps each player\'s last place her own: another player starts with none (RW14 slice 8)', async () => {
    const store = make();
    await store.load();
    const a = store.activeId;
    store.visitPlace('counting-cove');
    const b = store.addProfile()!;
    expect(await store.switchTo(b)).toBe(true);
    expect(store.data.explore.last).toBeNull();
    expect(await store.switchTo(a)).toBe(true);
    expect(store.data.explore.last).toBe('counting-cove');
  });

  it('never shows default data while the other save is being read, and a save made meanwhile still lands on the old one', async () => {
    const store = make();
    await store.load();
    const a = store.activeId;
    store.data.profile.name = 'Alice';
    const b = store.addProfile()!;
    disk.set(`neo.save.${b}`, { ...defaults(), profile: { name: 'Bob', band: 'prek' } });

    let release!: () => void;
    ctl.gate.set(`neo.save.${b}`, new Promise<void>((r) => (release = r)));
    const switching = store.switchTo(b);
    // Still Alice, not a blank, so nothing in the gap can write defaults anywhere.
    expect(store.data.profile.name).toBe('Alice');
    store.data.profile.name = 'Alice, later';
    store.save();
    release();
    await switching;

    expect(store.data.profile.name).toBe('Bob');
    expect(store.data.profile.band).toBe('prek');
    expect(savedAs('neo.save').profile.name).toBe('Alice, later');
    expect(store.activeId).not.toBe(a);
  });

  it('does not switch to someone who is not there, or who was removed while the save was read', async () => {
    const store = make();
    await store.load();
    expect(await store.switchTo('zzzz9999')).toBe(false);
    const b = store.addProfile()!;
    let release!: () => void;
    ctl.gate.set(`neo.save.${b}`, new Promise<void>((r) => (release = r)));
    const switching = store.switchTo(b);
    void store.removeProfile(b);
    release();
    expect(await switching).toBe(false);
    expect(store.activeId).toBe('id0001');
  });

  it('is a no-op to switch to the active profile', async () => {
    const store = make();
    await store.load();
    expect(await store.switchTo(store.activeId)).toBe(true);
  });

  it('draws another profile’s card from its save without switching to it', async () => {
    const store = make();
    await store.load();
    const b = store.addProfile()!;
    disk.set(`neo.save.${b}`, { ...defaults(), profile: { name: 'Bob', band: 'school' } });
    expect((await store.peek(b))?.profile.name).toBe('Bob');
    expect(store.activeId).toBe('id0001');
    expect(await store.peek(store.activeId)).toBe(store.data);
    expect(await store.peek('zzzz9999')).toBeNull();
  });
});

describe('loading', () => {
  it('registers its page listeners once, however many times it runs', async () => {
    const doc = { hidden: false, addEventListener: vi.fn() };
    const win = { addEventListener: vi.fn() };
    vi.stubGlobal('document', doc);
    vi.stubGlobal('window', win);
    const store = make();
    await store.load();
    await store.load();
    expect(doc.addEventListener).toHaveBeenCalledTimes(1);
    expect(doc.addEventListener).toHaveBeenCalledWith('visibilitychange', expect.any(Function));
    expect(win.addEventListener).toHaveBeenCalledTimes(1);
    expect(win.addEventListener).toHaveBeenCalledWith('pagehide', expect.any(Function));
  });

  it('writes a pending save when the page is hidden', async () => {
    const doc = { hidden: true, addEventListener: vi.fn() };
    vi.stubGlobal('document', doc);
    vi.stubGlobal('window', { addEventListener: vi.fn() });
    const store = make();
    await store.load();
    store.data.profile.name = 'Mia';
    store.save();
    doc.addEventListener.mock.calls[0][1]();
    expect(savedAs('neo.save').profile.name).toBe('Mia');
  });

  it('never writes over the list of people when it could not be read', async () => {
    const real = make();
    await real.load();
    real.addProfile();
    real.addProfile();
    const onDisk = structuredClone(indexOnDisk());
    expect(onDisk.profiles).toHaveLength(3);

    ctl.fail = (key) => key === INDEX_KEY;
    const store = make();
    await store.load();
    store.addProfile();
    store.setBirth(store.activeId, { month: 1, year: 2020 });
    expect(indexOnDisk()).toEqual(onDisk);

    // Once it can be read again the people are all still there.
    ctl.fail = () => false;
    const later = make();
    await later.load();
    expect(later.profiles).toHaveLength(3);
  });

  it('plays on with a blank save when one cannot be read', async () => {
    disk.set('neo.save', defaults());
    ctl.fail = (key) => key === 'neo.save';
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const store = make();
    await store.load();
    expect(store.data).toEqual(defaults());
    warn.mockRestore();
  });
});

describe('undo belongs to each profile', () => {
  it('brings back only the profile it was made in', async () => {
    const store = make();
    await store.load();
    const a = store.activeId;
    store.addSticker('bubble-pop', 1);
    store.reset();
    expect(store.data.stickers).toHaveLength(0);
    expect(store.undoAt).not.toBeNull();
    expect(disk.has('neo.save.previous')).toBe(true);

    const b = store.addProfile()!;
    await store.switchTo(b);
    expect(store.undoAt).toBeNull();
    expect(store.undo()).toBe(false);
    expect(disk.has(`neo.save.${b}.previous`)).toBe(false);

    await store.switchTo(a);
    expect(store.undoAt).not.toBeNull();
    expect(store.undo()).toBe(true);
    expect(store.data.stickers).toHaveLength(1);
  });

  it('keeps a restore’s undo for the profile that was restored', async () => {
    const store = make();
    await store.load();
    store.data.profile.name = 'Alice';
    const b = store.addProfile()!;
    expect(store.importJson(JSON.stringify({ ...defaults(), profile: { name: 'Imported', band: 'lap' } }))).toBe(true);
    expect(store.data.profile.name).toBe('Imported');
    await store.switchTo(b);
    expect(store.undo()).toBe(false);
    await store.switchTo('id0001');
    expect(store.undo()).toBe(true);
    expect(store.data.profile.name).toBe('Alice');
  });
});

describe('who someone is', () => {
  it('starts a profile where their age puts them, and moves them up by itself', async () => {
    const store = make();
    await store.load();
    const a = store.activeId;
    store.setBirth(a, { month: 10, year: 2024 });
    expect(store.data.profile.band).toBe('toddler');
    store.setBirth(a, { month: 3, year: 2021 });
    expect(store.data.profile.band).toBe('prek');
    store.setBirth(a, { month: 3, year: 2014 });
    expect(store.data.profile.band).toBe('school');

    // Next session, a year later: the saved band follows the clock.
    store.setBirth(a, { month: 10, year: 2024 });
    store.save();
    vi.advanceTimersByTime(300);
    const later = new Store(counter(), () => new Date(2027, 9, 1).getTime());
    await later.load();
    expect(later.data.profile.band).toBe('preschool');
  });

  it('lets a chosen start win over the age, and the age come back when it is cleared', async () => {
    const store = make();
    await store.load();
    const a = store.activeId;
    store.setBirth(a, { month: 10, year: 2024 });
    store.setStartBand(a, 'school');
    expect(store.data.profile.band).toBe('school');
    store.setStartBand(a, null);
    expect(store.data.profile.band).toBe('toddler');
  });

  it('keeps the band a profile with no birth already has', async () => {
    const store = make();
    await store.load();
    store.setBand('prek');
    store.setStartBand(store.activeId, null);
    store.setBirth(store.activeId, null);
    expect(store.data.profile.band).toBe('prek');
  });

  it('forgets a birth that is not a month and a year, and a person who is not there', async () => {
    const store = make();
    await store.load();
    store.setBirth(store.activeId, { month: 13, year: 2020 });
    expect(store.profiles[0].birth).toBeNull();
    store.setBirth('zzzz9999', { month: 1, year: 2020 });
    store.setStartBand('zzzz9999', 'school');
    expect(store.profiles).toHaveLength(1);
  });

  it('syncs the band of the profile switched to, not the one left', async () => {
    const store = make();
    await store.load();
    const a = store.activeId;
    const b = store.addProfile({ month: 6, year: 2021 })!; // five in October 2026
    expect(store.data.profile.band).toBe('lap');
    await store.switchTo(b);
    expect(store.data.profile.band).toBe('prek');
    await store.switchTo(a);
    expect(store.data.profile.band).toBe('lap');
  });
});

describe('adding and removing', () => {
  it('holds a household, then says no', async () => {
    const store = make();
    await store.load();
    for (let i = 1; i < MAX_PROFILES; i++) expect(store.addProfile()).not.toBeNull();
    expect(store.addProfile()).toBeNull();
    expect(store.profiles).toHaveLength(MAX_PROFILES);
  });

  it('removes someone else, with their save and their undo snapshot', async () => {
    const store = make();
    await store.load();
    const b = store.addProfile()!;
    await store.switchTo(b);
    store.addSticker('bubble-pop', 1);
    store.reset();
    store.flush();
    await store.switchTo('id0001');
    expect(disk.has(`neo.save.${b}`)).toBe(true);
    expect(disk.has(`neo.save.${b}.previous`)).toBe(true);

    expect(await store.removeProfile(b)).toBe(true);
    expect(store.profiles.map((p) => p.id)).toEqual(['id0001']);
    expect(disk.has(`neo.save.${b}`)).toBe(false);
    expect(disk.has(`neo.save.${b}.previous`)).toBe(false);
    expect(await store.removeProfile(b)).toBe(false);
  });

  it('moves to another profile when the active one is removed, and a pending save does not bring them back', async () => {
    const store = make();
    await store.load();
    const a = store.activeId;
    const b = store.addProfile()!;
    disk.set(`neo.save.${b}`, { ...defaults(), profile: { name: 'Bob', band: 'lap' } });
    store.data.profile.name = 'Alice';
    store.save(); // waiting to be written to neo.save
    expect(await store.removeProfile(a)).toBe(true);
    vi.advanceTimersByTime(1000);

    expect(store.activeId).toBe(b);
    expect(store.data.profile.name).toBe('Bob');
    expect(disk.has('neo.save')).toBe(false);
    expect(indexOnDisk().active).toBe(b);
  });

  it('replaces the last person with a blank one, never with nobody', async () => {
    const store = make();
    await store.load();
    store.data.profile.name = 'Alice';
    store.save();
    vi.advanceTimersByTime(300);
    expect(await store.removeProfile('id0001')).toBe(true);
    expect(store.profiles).toHaveLength(1);
    expect(store.profiles[0]).toMatchObject({ legacy: false });
    expect(store.profiles[0].id).not.toBe('id0001');
    expect(store.data).toEqual(defaults());
    expect(disk.has('neo.save')).toBe(false);
  });
});

describe('backing up every profile', () => {
  const setUp = async () => {
    const store = make();
    await store.load();
    store.data.profile.name = 'Alice';
    store.addSticker('bubble-pop', 1);
    store.setBirth(store.activeId, { month: 10, year: 2025 });
    const b = store.addProfile()!;
    await store.switchTo(b);
    store.data.profile.name = 'Bob';
    store.setStartBand(b, 'school');
    await store.switchTo('id0001');
    return { store, b };
  };

  it('holds everyone, including a save still waiting to be written', async () => {
    const { store, b } = await setUp();
    store.data.profile.name = 'Alice R'; // not yet saved
    const file = JSON.parse(await store.exportAll());
    expect(file.kind).toBe('puddle-island-backup');
    expect(file.active).toBe('id0001');
    expect(file.profiles.map((p: { id: string; save: SaveData }) => [p.id, p.save.profile.name])).toEqual([['id0001', 'Alice R'], [b, 'Bob']]);
    expect(file.profiles[0].birth).toEqual({ month: 10, year: 2025 });
    expect(file.profiles[1].startBand).toBe('school');
  });

  it('puts everyone back, each with an undo of their own, and deletes nobody', async () => {
    const { store, b } = await setUp();
    const text = await store.exportAll();
    const c = store.addProfile()!; // joined after the backup
    store.data.profile.name = 'Changed';
    store.addSticker('bubble-pop', 2);
    await store.switchTo(b);
    store.data.profile.name = 'Changed too';

    const result = await store.restoreAll(text);
    expect(result).toEqual({ replaced: 2, added: 0, skipped: 0 });
    expect(store.profiles.map((p) => p.id)).toEqual(['id0001', b, c]);
    expect(store.activeId).toBe(b);
    expect(store.data.profile.name).toBe('Bob');
    // Bob’s undo brings back what he had before the restore.
    expect(store.undo()).toBe(true);
    expect(store.data.profile.name).toBe('Changed too');
    // Alice’s snapshot is in her own key.
    await store.switchTo('id0001');
    expect(store.data.profile.name).toBe('Alice');
    expect(store.data.stickers).toHaveLength(1);
    expect(store.undo()).toBe(true);
    expect(store.data.profile.name).toBe('Changed');
    expect(store.profiles.find((p) => p.id === 'id0001')?.birth).toEqual({ month: 10, year: 2025 });
  });

  it('adds everyone on a new device, who is then someone else’s id and replaces nobody', async () => {
    const { store } = await setUp();
    const text = await store.exportAll();
    disk.clear();
    const device = new Store(counter(), () => NOW);
    await device.load();
    device.data.profile.name = 'Grandma';
    device.save();
    vi.advanceTimersByTime(300);

    const other = new Store(() => 'zz' + Math.random().toString(36).slice(2, 8), () => NOW);
    disk.clear();
    await other.load();
    other.data.profile.name = 'Grandma';
    other.save();
    vi.advanceTimersByTime(300);
    const result = await other.restoreAll(text);
    expect(result).toEqual({ replaced: 0, added: 2, skipped: 0 });
    expect(other.profiles).toHaveLength(3);
    expect(other.data.profile.name).toBe('Grandma');
    const added = other.profiles.find((p) => p.id === 'id0001');
    expect(added?.legacy).toBe(false);
    expect(savedAs('neo.save.id0001').profile.name).toBe('Alice');
    expect(savedAs('neo.save').profile.name).toBe('Grandma');
  });

  it('says what did not fit', async () => {
    const { store } = await setUp();
    const text = await store.exportAll();
    disk.clear();
    const other = new Store(counter(), () => NOW);
    await other.load();
    // Seven profiles already: room for one more.
    for (let i = 0; i < MAX_PROFILES - 2; i++) other.addProfile();
    const unknown = JSON.parse(text);
    unknown.profiles.forEach((p: { id: string }, i: number) => (p.id = `new${i}0000`));
    const result = await other.restoreAll(JSON.stringify(unknown));
    expect(result).toEqual({ replaced: 0, added: 1, skipped: 1 });
    expect(other.profiles).toHaveLength(MAX_PROFILES);
  });

  it('restores a single-profile backup from today’s build into the active profile, with its undo', async () => {
    const { store } = await setUp();
    const bare = { ...defaults(), profile: { name: 'Old backup', band: 'prek' as const } };
    const result = await store.restoreAll(JSON.stringify(bare));
    expect(result).toEqual({ replaced: 1, added: 0, skipped: 0 });
    expect(store.data.profile.name).toBe('Old backup');
    expect(store.profiles).toHaveLength(2);
    // Alice’s birth is who she is, not part of an old backup, so it stays and still decides her band.
    expect(store.profiles[0].birth).toEqual({ month: 10, year: 2025 });
    expect(store.data.profile.band).toBe('lap');
    expect(store.undo()).toBe(true);
    expect(store.data.profile.name).toBe('Alice');
  });

  it('refuses a file that is not a backup, and changes nothing', async () => {
    const { store } = await setUp();
    const before = JSON.stringify(store.data);
    const index = JSON.stringify(indexOnDisk());
    for (const bad of ['', '{}', '[]', 'hello', '{"party":{},"settings":{},"stickers":[]}']) expect(await store.restoreAll(bad)).toBeNull();
    expect(JSON.stringify(store.data)).toBe(before);
    expect(JSON.stringify(indexOnDisk())).toBe(index);
    expect(store.undoAt).toBeNull();
  });
});

describe('the level a game starts at', () => {
  const lap = { min: 1, max: 15, order: [15, 1, 2, 3] };

  it('is the easiest level of the band when the game has never been finished, which an order can put above level 1', async () => {
    const store = make();
    await store.load();
    expect(store.levelFor('bubble-pop', lap)).toBe(15);
    expect(store.levelFor('bubble-pop', { min: 4, max: 9 })).toBe(4);
    expect(store.levelFor('bubble-pop', { min: 1, max: 3 })).toBe(1);
  });

  it('steps up the order from there and then keeps the level she reached', async () => {
    const store = make();
    await store.load();
    const smooth = { misses: 0, hints: 0, seconds: 20, at: 1 };
    store.recordRound('bubble-pop', { level: 15, ...smooth }, lap);
    expect(store.levelFor('bubble-pop', lap)).toBe(15);
    store.recordRound('bubble-pop', { level: 15, ...smooth }, lap);
    expect(store.levelFor('bubble-pop', lap)).toBe(1);
    store.recordRound('bubble-pop', { level: 1, ...smooth }, lap);
    expect(store.levelFor('bubble-pop', lap)).toBe(1);
  });

  it('leaves a saved level and a pin where they are', async () => {
    const store = make();
    await store.load();
    store.stats('bubble-pop').level = 2;
    expect(store.levelFor('bubble-pop', lap)).toBe(2);
    store.stats('bubble-pop').level = 1;
    store.stats('bubble-pop').plays = 4;
    expect(store.levelFor('bubble-pop', lap)).toBe(1);
    store.pin('bubble-pop', 3);
    expect(store.levelFor('bubble-pop', lap)).toBe(3);
  });
});

describe('an entry level carried into a band that does not list it', () => {
  const toddler = { min: 1, max: 6 };

  it('starts at that band\'s easiest level, not at its hardest (a level above the top is not always the harder one)', async () => {
    const store = make();
    await store.load();
    store.stats('bubble-pop').level = 15;
    store.stats('bubble-pop').plays = 3;
    expect(store.levelFor('bubble-pop', toddler, [15])).toBe(1);
    store.pin('bubble-pop', 15);
    expect(store.levelFor('bubble-pop', toddler, [15])).toBe(1);
    // without being told 15 is an entry, a level above the top is the top (a retired or unknown level)
    expect(store.levelFor('bubble-pop', toddler)).toBe(6);
    // still honoured where the band lists it
    expect(store.levelFor('bubble-pop', { min: 1, max: 15, order: [15, 1, 2, 3] }, [15])).toBe(15);
  });
});

describe('stories', () => {
  it('keeps the Woodland Picnic apart from the Windy Picnic, each step done once and the keepsake kept', async () => {
    const store = make();
    await store.load();
    expect(store.completeStep('baskets', 'woodland')).toBe(true);
    expect(store.completeStep('baskets', 'woodland')).toBe(false);
    // A step from another story, or with no story named, never lands in the woodland.
    expect(store.completeStep('blanket', 'woodland')).toBe(false);
    expect(store.completeStep('beat')).toBe(false);
    expect(store.completeStep('blanket')).toBe(true);
    expect(store.woodland.steps).toEqual(['baskets']);
    expect(store.picnic.steps).toEqual(['blanket']);
    // The ending needs all three of its own steps.
    store.endStory('woodland');
    expect(store.woodland.ended).toBe(false);
    store.completeStep('beat', 'woodland');
    store.completeStep('invitations', 'woodland');
    expect(store.woodland.steps).toEqual(['invitations', 'baskets', 'beat']);
    store.endStory('woodland');
    expect(store.woodland).toEqual({ steps: ['invitations', 'baskets', 'beat'], ended: true, keepsake: true });
    expect(store.picnic.ended).toBe(false);
    // Telling it again clears this telling and keeps the photo; the Windy Picnic is untouched.
    store.retellStory('woodland');
    expect(store.woodland).toEqual({ steps: [], ended: false, keepsake: true });
    expect(store.picnic.steps).toEqual(['blanket']);
  });
});

describe('her friends (RW05)', () => {
  it('meets a friend once per token and writes at once, without waiting for the batch', async () => {
    const store = make();
    await store.load();
    const mochi = store.meet('sprout', 'Mochi', 'pink', 'start')!;
    await Promise.resolve();
    expect(savedAs('neo.save').creatures.owned).toEqual([mochi]);
    expect(store.companion).toEqual(mochi);
    expect(store.meet('sprout', 'Again', 'blue', 'start')).toBe(mochi);
    expect(store.data.creatures.owned).toHaveLength(1);
  });

  it('chooses only an owned friend, at once, and reset keeps the friends and the choice', async () => {
    const store = make();
    await store.load();
    store.meet('sprout', 'Mochi', 'pink', 'start');
    const pebble = store.meet('river', 'Pebble', 'blue', 'dev:river')!;
    expect(store.choose('nobody')).toBe(false);
    expect(store.choose(pebble.id)).toBe(true);
    await Promise.resolve();
    expect(savedAs('neo.save').creatures.companion).toBe(pebble.id);
    store.addSticker('bubble-pop', 1);
    store.reset();
    expect(store.data.stickers).toHaveLength(0);
    expect(store.companion?.name).toBe('Pebble');
    expect(store.undo()).toBe(true);
    expect(store.data.stickers).toHaveLength(1);
    expect(store.companion?.name).toBe('Pebble');
  });

  it('writes a welcome step at once with its picture, and a reset clears the project but keeps the friends (RW07)', async () => {
    const store = make();
    await store.load();
    store.meet('sprout', 'Mochi', 'pink', 'start');
    expect(store.beginWelcome('preschool')).toBe(true);
    expect(savedAs('neo.save').projects.welcome).toMatchObject({ band: 'preschool', newcomer: 'river' });
    const picture = { kind: 'picture' as const, stamps: [{ kind: 'star' as const, color: 'pink' as const, x: 0.5, y: 0.5, size: 1, turns: 0 }] };
    expect(store.completeWelcomeStep('pretty', picture)).toBe(true);
    store.flush();
    await Promise.resolve();
    expect(savedAs('neo.save').projects.welcome.results.pretty).toEqual(picture);
    expect(store.data.creations.picture.current).toBeNull();
    store.reset();
    expect(store.welcome).toEqual({ band: null, steps: [], results: {}, newcomer: null, ended: false });
    expect(store.companion?.name).toBe('Mochi');
    expect(store.undo()).toBe(true);
    expect(store.welcome.steps).toEqual(['pretty']);
  });

  it('adopts the welcome newcomer once, in one write, across a replay, a reload and a reset, leaving the companion (RW07)', async () => {
    const store = make();
    await store.load();
    const mochi = store.meet('sprout', 'Mochi', 'pink', 'start')!;
    const finishSteps = () => {
      store.beginWelcome('preschool');
      for (const step of ['pretty', 'yummy', 'song'] as const) store.completeWelcomeStep(step, null);
    };
    store.beginWelcome('preschool');
    store.completeWelcomeStep('pretty', null);
    expect(store.adoptWelcome('Ripple')).toBeUndefined();
    expect(store.welcome.ended).toBe(false);
    finishSteps();
    const ripple = store.adoptWelcome('Ripple')!;
    expect(ripple).toMatchObject({ species: 'river', name: 'Ripple', look: { color: 'orange' }, metAt: 'project:welcome' });
    await Promise.resolve();
    expect(savedAs('neo.save').projects.welcome.ended).toBe(true);
    expect(savedAs('neo.save').creatures.owned).toHaveLength(2);
    expect(store.companion).toEqual(mochi);
    expect(store.adoptWelcome('Bubbles')).toEqual(ripple);
    // A reload finds the same friend, and the project ended.
    const again = make();
    await again.load();
    expect(again.welcome.ended).toBe(true);
    expect(again.data.creatures.owned.filter((o) => o.metAt === 'project:welcome')).toEqual([ripple]);
    // A reset clears the project; ending it again brings no one new, and the page would show the same species.
    again.reset();
    expect(again.welcome.ended).toBe(false);
    again.beginWelcome('preschool');
    expect(again.welcome.newcomer).toBe('river');
    for (const step of ['pretty', 'yummy', 'song'] as const) again.completeWelcomeStep(step, null);
    expect(again.adoptWelcome('Pebble')).toEqual(ripple);
    expect(again.data.creatures.owned).toHaveLength(2);
    // A name outside the species' three becomes its first.
    const other = make();
    await other.load();
    other.reset();
    other.data.creatures = { owned: [], companion: null };
    other.beginWelcome('prek');
    for (const step of ['pretty', 'yummy', 'song'] as const) other.completeWelcomeStep(step, null);
    expect(other.adoptWelcome('Rex')?.name).toBe('Pebble');
  });

  it('ends the welcome project with a full collection without adopting or dropping a friend (RW07)', async () => {
    const store = make();
    await store.load();
    for (let i = 0; i < 24; i++) store.meet('glider', `G${i}`, 'teal', `t${i}`);
    const before = JSON.stringify(store.data.creatures);
    store.beginWelcome('preschool');
    for (const step of ['pretty', 'yummy', 'song'] as const) store.completeWelcomeStep(step, null);
    expect(store.adoptWelcome('Pebble')).toBeNull();
    expect(store.welcome.ended).toBe(true);
    expect(JSON.stringify(store.data.creatures)).toBe(before);
  });

  it('keeps each profile\'s friends to itself', async () => {
    const store = make();
    await store.load();
    const a = store.activeId;
    store.meet('sprout', 'Mochi', 'pink', 'start');
    const b = store.addProfile()!;
    await store.switchTo(b);
    expect(store.companion).toBeNull();
    store.meet('glider', 'Wisp', 'purple', 'start');
    await store.switchTo(a);
    expect(store.companion?.name).toBe('Mochi');
    expect(store.data.creatures.owned).toHaveLength(1);
  });

  it('dresses only an owned friend, at once; reset, a backup and another profile keep their own looks (RW06)', async () => {
    const store = make();
    await store.load();
    const a = store.activeId;
    const mochi = store.meet('sprout', 'Mochi', 'pink', 'start')!;
    expect(store.wear('nobody', 'crown', true)).toBe(false);
    expect(store.wear(mochi.id, 'crown', true)).toBe(true);
    expect(store.wear(mochi.id, 'scarf', true)).toBe(true);
    expect(store.wear(mochi.id, 'sunhat', true)).toBe(true);
    await Promise.resolve();
    expect(savedAs('neo.save').creatures.owned[0].look.worn).toEqual(['scarf', 'sunhat']);
    expect(store.wear(mochi.id, 'scarf', false)).toBe(true);
    expect(store.companion?.look.worn).toEqual(['sunhat']);
    store.reset();
    expect(store.companion?.look.worn).toEqual(['sunhat']);
    const text = await store.exportAll();
    store.wear(mochi.id, 'sunhat', false);
    expect(store.companion?.look.worn).toEqual([]);
    const b = store.addProfile()!;
    await store.switchTo(b);
    const wisp = store.meet('glider', 'Wisp', 'purple', 'start')!;
    // Another profile's ids are not hers: nothing changes.
    expect(store.wear(mochi.id, 'crown', true)).toBe(false);
    expect(store.companion?.look.worn).toEqual([]);
    store.wear(wisp.id, 'crown', true);
    await store.switchTo(a);
    expect(store.companion?.look.worn).toEqual([]);
    await store.restoreAll(text);
    await store.switchTo(a);
    expect(store.companion?.look.worn).toEqual(['sunhat']);
  });
});
