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
