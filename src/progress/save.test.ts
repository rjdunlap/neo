import { describe, expect, it } from 'vitest';
import { FLOOR, starterItem } from '../content/room';
import { ROOM_ITEMS } from '../content/world';
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

  it('gives every save, old or new, the whole starter treehouse with an empty frame', () => {
    const room = defaults().room;
    expect(room.items.map((i) => i.id).sort()).toEqual([...ROOM_ITEMS].sort());
    expect(room.frame).toBeNull();
    expect(migrate({}).room).toEqual(room);
    // A save from before the treehouse existed gets the starter room and keeps everything else.
    const old = { version: 2, profile: { name: 'Mia', band: 'prek' }, stickers: [{ game: 'pet-kitchen', seed: 4, at: 1 }] };
    const upgraded = migrate(old);
    expect(upgraded.room).toEqual(room);
    expect(upgraded.stickers).toHaveLength(1);
    expect(upgraded.profile.name).toBe('Mia');
  });

  it('repairs a damaged treehouse: one of each known item, on the floor, never lost', () => {
    const odd = migrate({ room: { items: [
      { id: 'bed', x: 5, y: -2, flip: 'yes' },
      { id: 'bed', x: 0.5, y: 0.7, flip: true },
      { id: 'dragon', x: 0.5, y: 0.7 },
      { id: 'lamp', x: 'left', y: NaN, flip: true },
      'junk',
    ], frame: { game: 'x'.repeat(200), seed: 1 } } });
    expect(odd.room.items.map((i) => i.id)).toEqual([...ROOM_ITEMS]);
    for (const it of odd.room.items) {
      expect(it.x).toBeGreaterThanOrEqual(FLOOR.left);
      expect(it.x).toBeLessThanOrEqual(FLOOR.right);
      expect(it.y).toBeGreaterThanOrEqual(FLOOR.top);
      expect(it.y).toBeLessThanOrEqual(FLOOR.bottom);
    }
    // The first bed wins, clamped to the nearest floor spot, with a non-boolean "flip" read as not flipped.
    expect(odd.room.items.find((i) => i.id === 'bed')).toEqual({ id: 'bed', x: FLOOR.right, y: FLOOR.top, flip: false });
    // A lamp with unreadable numbers goes back to its starting spot but keeps its facing.
    expect(odd.room.items.find((i) => i.id === 'lamp')).toEqual({ ...starterItem('lamp'), flip: true });
    expect(odd.room.frame).toBeNull();
    expect(migrate({ room: 'nope' }).room).toEqual(defaults().room);
    expect(migrate({ room: { items: 7, frame: [] } }).room).toEqual(defaults().room);
  });

  it('keeps a hung sticker and a rearranged room through a backup and restore', () => {
    const save = defaults();
    save.stickers.push({ game: 'pet-kitchen', seed: 4, at: 1 });
    save.room = { items: save.room.items.map((i) => (i.id === 'rug' ? { ...i, x: 0.3, y: 0.7, flip: true } : i)), frame: { game: 'pet-kitchen', seed: 4 } };
    expect(migrate(JSON.parse(JSON.stringify(save)))).toEqual(save);
    expect(save.room.items).toHaveLength(ROOM_ITEMS.length);
  });

  it('starts with no hearts, and repairs a damaged favorites list without touching anything else', () => {
    expect(defaults().favorites).toEqual([]);
    expect(migrate({}).favorites).toEqual([]);
    // A save from before the shelf existed keeps its progress and gets an empty shelf.
    const old = migrate({ version: 2, profile: { name: 'Mia', band: 'prek' }, games: { 'duck-pond': { plays: 4, level: 3, pinned: null, history: [] } } });
    expect(old.favorites).toEqual([]);
    expect(old.games['duck-pond'].plays).toBe(4);
    expect(migrate({ favorites: 'duck-pond' }).favorites).toEqual([]);
    expect(migrate({ favorites: ['duck-pond', 7, 'duck-pond', '', 'bubble-pop'] }).favorites).toEqual(['duck-pond', 'bubble-pop']);
    expect(migrate({ favorites: Array.from({ length: 50 }, (_, i) => `g${i}`) }).favorites).toHaveLength(12);
  });

  it('keeps hearts through a backup and restore', () => {
    const save = defaults();
    save.favorites = ['duck-pond', 'bubble-pop'];
    expect(migrate(JSON.parse(JSON.stringify(save)))).toEqual(save);
  });

  it('starts with nothing hung, and repairs damaged creations without touching anything else', () => {
    expect(defaults().creations).toEqual({ picture: { current: null, previous: null }, tune: { current: null, previous: null } });
    expect(migrate({}).creations).toEqual(defaults().creations);
    // A save from before creations existed keeps its progress and its room.
    const old = migrate({ version: 2, profile: { name: 'Mia', band: 'prek' }, favorites: ['duck-pond'], room: { items: [], frame: { game: 'pet-kitchen', seed: 4 } } });
    expect(old.creations).toEqual(defaults().creations);
    expect(old.favorites).toEqual(['duck-pond']);
    expect(old.room.frame).toEqual({ game: 'pet-kitchen', seed: 4 });
    const odd = migrate({ creations: { picture: { current: { kind: 'picture', stamps: [{ kind: 'star', color: 'pink', x: 0.5, y: 0.5, size: 1, turns: 0 }, 'junk'] }, previous: 7 }, tune: 'la' } });
    expect(odd.creations.picture.current && 'stamps' in odd.creations.picture.current ? odd.creations.picture.current.stamps : []).toHaveLength(1);
    expect(odd.creations.picture.previous).toBeNull();
    expect(odd.creations.tune).toEqual({ current: null, previous: null });
    expect(migrate({ creations: 5 }).creations).toEqual(defaults().creations);
  });

  it('keeps a hung picture and tune, and the ones before them, through a backup and restore', () => {
    const save = defaults();
    const stamp = (x: number) => ({ kind: 'cat' as const, color: 'blue' as const, x, y: 0.4, size: 1.3, turns: 2 });
    save.creations = {
      picture: { current: { kind: 'picture', stamps: [stamp(0.2), stamp(0.7)] }, previous: { kind: 'picture', stamps: [stamp(0.5)] } },
      tune: { current: { kind: 'tune', cols: 4, rows: 3, notes: [{ col: 0, row: 0 }, { col: 2, row: 2 }] }, previous: null },
    };
    expect(migrate(JSON.parse(JSON.stringify(save)))).toEqual(save);
  });

  it('keeps a bounded finger painting through a backup and restore', () => {
    const save = defaults();
    save.creations.picture.current = {
      kind: 'picture',
      aspect: 4 / 3,
      marks: [
        { shape: 'dab', color: 0xff55aa, x: 0.1, y: 0.2, r: 0.03 },
        { shape: 'dab', color: 0x55aaff, x: 0.4, y: 0.5, r: 0.03 },
        { shape: 'flower', color: 'yellow', x: 0.7, y: 0.8, r: 0.04 },
      ],
    };
    expect(migrate(JSON.parse(JSON.stringify(save)))).toEqual(save);
  });

  it('keeps a bounded pixel picture through a backup and restore', () => {
    const save = defaults();
    save.creations.picture.current = {
      kind: 'picture',
      size: 5,
      pixels: [
        { x: 1, y: 0, color: 'red' },
        { x: 2, y: 0, color: 'red' },
        { x: 2, y: 1, color: 'blue' },
      ],
    };
    expect(migrate(JSON.parse(JSON.stringify(save)))).toEqual(save);
  });

  it('starts with an empty journal, and repairs a damaged one without touching anything else', () => {
    expect(defaults().journal).toEqual({ found: [], seen: 0 });
    expect(migrate({}).journal).toEqual({ found: [], seen: 0 });
    const old = migrate({ version: 2, profile: { name: 'Mia', band: 'prek' }, creations: { picture: { current: null, previous: null } }, favorites: ['duck-pond'] });
    expect(old.journal).toEqual({ found: [], seen: 0 });
    expect(old.favorites).toEqual(['duck-pond']);
    expect(migrate({ journal: { found: ['sink-float:duck', 'retired:thing', 4, 'sink-float:duck'], seen: 7 } }).journal).toEqual({ found: ['sink-float:duck'], seen: 1 });
    expect(migrate({ journal: 'x' }).journal).toEqual({ found: [], seen: 0 });
  });

  it('keeps the journal through a backup and restore', () => {
    const save = defaults();
    save.journal = { found: ['sink-float:duck', 'animal-snack:bear'], seen: 1 };
    expect(migrate(JSON.parse(JSON.stringify(save)))).toEqual(save);
  });
});
