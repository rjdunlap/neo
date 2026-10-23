import { describe, expect, it } from 'vitest';
import { FLOOR, starterItem } from '../content/room';
import { ROOM_ITEMS } from '../content/world';
import { cleanCreatures, companionOf, defaults, MAX_CREATURES, meetIn, migrate, remember, repairPrevious, swapWithPrevious } from './save';
import { changeWorn, cleanWorn } from '../art/creatures/wear-slots';

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
    // A save from when the app had a play timer: the limit is retired, and always saved as 0 (no limit).
    expect(save.settings).toEqual({ placeLayout: 'path', volume: 1, music: false, sessionMinutes: 0, coplayHints: true, howToCards: true, speech: true });
    expect(defaults().settings.sessionMinutes).toBe(0);
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

  it('keeps the grown-up band in the profile and the world, and still repairs a band that does not exist', () => {
    const save = migrate({ profile: { name: 'Sam', band: 'grownup' }, world: { band: 'grownup' } });
    expect(save.profile.band).toBe('grownup');
    expect(save.world.band).toBe('grownup');
    expect(migrate({ profile: { name: 'Sam', band: 'adult' }, world: { band: 'adult' } })).toMatchObject({ profile: { band: 'lap' }, world: { band: null } });
    // Levels for a grown-up puzzle are saved under its own id like any game's, and survive a round trip.
    const played = defaults();
    played.games['lantern-lights'] = { plays: 2, level: 4, pinned: 5, history: [] };
    expect(migrate(JSON.parse(JSON.stringify(played))).games['lantern-lights']).toEqual(played.games['lantern-lights']);
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
    expect(save.version).toBe(3);
    expect(save.profile).toEqual(legacy.profile);
    expect(save.games).toEqual(legacy.games);
    expect(save.stickers).toEqual(legacy.stickers);
    expect(save.creatures).toEqual({ owned: [], companion: null });
    expect(save.world).toEqual({ band: null });
  });

  it('repairs the celebrated band from untrusted backups, dropping retired region lists', () => {
    const save = migrate({ world: { opened: ['treehouse', 'treehouse', 'missing', 4], band: 'not-a-band' } });
    expect(save.world).toEqual({ band: null });
    const valid = migrate({ world: { opened: ['story-grove'], band: 'preschool' } });
    expect(valid.world).toEqual({ band: 'preschool' });
  });

  it('keeps a version-two save\'s progress but not its pet: that profile meets its first friend again at the egg', () => {
    const old = { version: 2, profile: { name: 'Mia', band: 'prek' }, pet: { name: 'Clover', color: 'purple', hatched: true }, stickers: [{ game: 'pet-kitchen', seed: 4, at: 1 }] };
    const save = migrate(old);
    expect(save.version).toBe(3);
    expect(save.stickers).toEqual(old.stickers);
    expect(save.creatures).toEqual({ owned: [], companion: null });
    expect('pet' in save).toBe(false);
  });

  const friend = (id: string, extra: Record<string, unknown> = {}) => ({ id, species: 'sprout', name: 'Mochi', look: { color: 'pink', worn: [] as string[] }, metAt: 'start', ...extra });

  it('round-trips a valid creature collection unchanged', () => {
    const c = { owned: [friend('abcd'), friend('riv1', { species: 'river', name: 'Pebble', look: { color: 'blue', worn: ['crown', 'scarf'] }, metAt: 'dev:river' })], companion: 'riv1' };
    expect(cleanCreatures(JSON.parse(JSON.stringify(c)))).toEqual(c);
  });

  it('drops unknown species, malformed and duplicate ids, keeping the first', () => {
    const c = cleanCreatures({
      owned: [friend('abcd'), friend('ABCD'), friend('ab'), friend('dino', { species: 'dragon' }), friend('abcd', { name: 'Second' }), 'x', null, friend('efgh')],
      companion: 'abcd',
    });
    expect(c.owned.map((o) => o.id)).toEqual(['abcd', 'efgh']);
    expect(c.owned[0].name).toBe('Mochi');
  });

  it('repairs a name, a colour and a token, falling back to the species\' own', () => {
    const [a, b] = cleanCreatures({ owned: [friend('abcd', { name: '   ', look: { color: 'ultraviolet' }, metAt: 7 }), friend('efgh', { species: 'glider', name: 'x'.repeat(80), look: null, metAt: 'y'.repeat(90) })] }).owned;
    expect(a).toEqual({ id: 'abcd', species: 'sprout', name: 'Pip', look: { color: 'teal', worn: [] }, metAt: '' });
    expect(b.name).toHaveLength(40);
    expect(b.look.color).toBe('purple');
    expect(b.metAt).toHaveLength(60);
  });

  it('repairs what a friend wears: unknown ids, repeats, two in a slot, seven at most, misfits kept (RW06)', () => {
    const worn = (w: unknown) => cleanCreatures({ owned: [friend('abcd', { look: { color: 'pink', worn: w } })] }).owned[0].look.worn;
    expect(worn(undefined)).toEqual([]);
    expect(worn('crown')).toEqual([]);
    expect(worn(['crown', 'cape', 7, null, 'scarf'])).toEqual(['crown', 'scarf']);
    expect(worn(['scarf', 'crown', 'scarf'])).toEqual(['scarf', 'crown']);
    // A crown then a sun hat: the hat went on last and stays.
    expect(worn(['crown', 'scarf', 'sunhat'])).toEqual(['scarf', 'sunhat']);
    // Boots on a sprout are a misfit, kept and simply not drawn.
    expect(worn(['boots', 'raincoat'])).toEqual(['boots', 'raincoat']);
    const all = ['crown', 'sunglasses', 'scarf', 'raincoat', 'umbrella', 'mittens', 'boots', 'beanie', 'sunhat'];
    expect(worn(all)).toEqual(['sunglasses', 'scarf', 'raincoat', 'umbrella', 'mittens', 'boots', 'sunhat']);
    expect(worn(all).length).toBeLessThanOrEqual(7);
  });

  it('puts on in a slot by replacing, and takes off only the item (RW06)', () => {
    expect(changeWorn([], 'crown', true)).toEqual(['crown']);
    expect(changeWorn(['crown', 'scarf'], 'sunhat', true)).toEqual(['scarf', 'sunhat']);
    expect(changeWorn(['crown', 'scarf'], 'crown', true)).toEqual(['scarf', 'crown']);
    expect(changeWorn(['crown', 'scarf'], 'crown', false)).toEqual(['scarf']);
    expect(changeWorn(['scarf'], 'beanie', false)).toEqual(['scarf']);
    for (const w of [['crown'], ['scarf', 'sunhat', 'boots']] as const) expect(cleanWorn(changeWorn(w, 'beanie', true))).toEqual(changeWorn(w, 'beanie', true));
  });

  it('keeps the earliest 24', () => {
    const owned = Array.from({ length: 30 }, (_, i) => friend(`id${String(i).padStart(2, '0')}`, { metAt: `dev:${i}` }));
    const c = cleanCreatures({ owned, companion: 'id29' });
    expect(c.owned).toHaveLength(MAX_CREATURES);
    expect(c.owned.at(-1)!.id).toBe('id23');
    expect(c.companion).toBe('id00');
  });

  it('points the companion at an owned friend, else the first, else nobody', () => {
    expect(cleanCreatures({ owned: [friend('abcd'), friend('efgh')], companion: 'efgh' }).companion).toBe('efgh');
    expect(cleanCreatures({ owned: [friend('abcd'), friend('efgh')], companion: 'gone' }).companion).toBe('abcd');
    expect(cleanCreatures({ owned: [], companion: 'abcd' }).companion).toBeNull();
    expect(cleanCreatures('garbage')).toEqual({ owned: [], companion: null });
  });

  it('meets a friend once per token, making the first one the companion', () => {
    const c = defaults().creatures;
    let n = 0;
    const ids = () => `id${n++}aa`;
    const first = meetIn(c, 'sprout', ' Mochi ', 'pink', 'start', ids)!;
    expect(first).toEqual({ id: 'id0aa', species: 'sprout', name: 'Mochi', look: { color: 'pink', worn: [] }, metAt: 'start' });
    expect(c.companion).toBe('id0aa');
    expect(meetIn(c, 'sprout', 'Other', 'blue', 'start', ids)).toBe(first);
    const river = meetIn(c, 'river', '', 'blue', 'dev:river', ids)!;
    expect(river.name).toBe('Pebble');
    expect(c.owned).toHaveLength(2);
    expect(companionOf(c)).toBe(first);
    expect(cleanCreatures(JSON.parse(JSON.stringify(c)))).toEqual(c);
  });

  it('never reuses an id and refuses beyond the cap', () => {
    const c = defaults().creatures;
    meetIn(c, 'sprout', 'A', 'teal', 'start', () => 'same');
    let calls = 0;
    const b = meetIn(c, 'river', 'B', 'teal', 'dev:river', () => (calls++ ? 'other' : 'same'))!;
    expect(b.id).toBe('other');
    for (let i = 0; c.owned.length < MAX_CREATURES; i++) meetIn(c, 'glider', 'G', 'teal', `t${i}`, () => `g${i}xxx`);
    expect(meetIn(c, 'glider', 'G', 'teal', 'one-more', () => 'zzzzzz')).toBeNull();
    expect(c.owned).toHaveLength(MAX_CREATURES);
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
    expect(migrate({}).stories).toEqual({ picnic: { steps: [], ended: false, keepsake: false }, woodland: { steps: [], ended: false, keepsake: false } });
    // Unknown and repeated steps drop out and the rest keep story order; an ending needs every step.
    const odd = migrate({ stories: { picnic: { steps: ['invitation', 'dragon', 'blanket', 'blanket', 7], ended: true, keepsake: 'yes' } } });
    expect(odd.stories.picnic).toEqual({ steps: ['blanket', 'invitation'], ended: false, keepsake: false });
    // A finished telling always keeps its keepsake, and a keepsake survives a retelling.
    expect(migrate({ stories: { picnic: { steps: ['blanket', 'sandwiches', 'invitation'], ended: true } } }).stories.picnic.keepsake).toBe(true);
    expect(migrate({ stories: { picnic: { steps: [], ended: false, keepsake: true } } }).stories.picnic).toEqual({ steps: [], ended: false, keepsake: true });
    expect(migrate({ stories: 'nope' }).stories).toEqual(defaults().stories);
  });

  it('gives an older save an untold Woodland Picnic and leaves its Windy Picnic as it was', () => {
    const picnic = { steps: ['blanket', 'sandwiches', 'invitation'], ended: true, keepsake: true };
    const old = migrate({ version: 2, stories: { picnic } });
    expect(old.stories.picnic).toEqual(picnic);
    expect(old.stories.woodland).toEqual({ steps: [], ended: false, keepsake: false });
    // Each story keeps only its own steps: a Windy Picnic step saved under the woodland drops out.
    const mixed = migrate({ stories: { woodland: { steps: ['beat', 'blanket', 'invitations', 'beat'], ended: true, keepsake: false } } });
    expect(mixed.stories.woodland).toEqual({ steps: ['invitations', 'beat'], ended: false, keepsake: false });
    expect(migrate({ stories: { woodland: { steps: ['beat', 'baskets', 'invitations'], ended: true } } }).stories.woodland).toEqual({ steps: ['invitations', 'baskets', 'beat'], ended: true, keepsake: true });
  });

  it('keeps picnic progress through a backup and restore, with older progress untouched', () => {
    const save = defaults();
    save.games['pet-kitchen'] = { plays: 2, level: 3, pinned: null, history: [] };
    save.stickers.push({ game: 'pet-kitchen', seed: 4, at: 1 });
    save.stories.picnic = { steps: ['sandwiches'], ended: false, keepsake: true };
    save.stories.woodland = { steps: ['baskets'], ended: false, keepsake: true };
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

  it('starts with the how-to cards on, repairs the switch, and drops the list an earlier version kept', () => {
    expect(defaults().settings.howToCards).toBe(true);
    // A save from before the cards existed keeps its progress and gets the cards.
    const old = migrate({ version: 2, profile: { name: 'Mia', band: 'prek' }, settings: { volume: 0.5 }, games: { 'duck-pond': { plays: 4, level: 3, pinned: null, history: [] } } });
    expect(old.settings.howToCards).toBe(true);
    expect(old.settings.volume).toBe(0.5);
    expect(old.games['duck-pond'].plays).toBe(4);
    expect(migrate({ settings: { howToCards: 'no' } }).settings.howToCards).toBe(true);
    expect(migrate({ settings: { howToCards: false } }).settings.howToCards).toBe(false);
    // The first version of the cards remembered which games had been shown; a restored save with that list is read without it.
    const kept = migrate({ explained: ['duck-pond'], settings: { howToCards: false } });
    expect('explained' in kept).toBe(false);
    expect(kept.settings.howToCards).toBe(false);
  });

  it('starts with spoken lines on, and repairs the switch', () => {
    expect(defaults().settings.speech).toBe(true);
    expect(migrate({ settings: { volume: 0.5 } }).settings.speech).toBe(true);
    expect(migrate({ settings: { speech: 'no' } }).settings.speech).toBe(true);
    expect(migrate({ settings: { speech: false } }).settings.speech).toBe(false);
  });

  it('keeps the switch through a backup and restore', () => {
    const save = defaults();
    save.settings.howToCards = false;
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

describe('undo for a reset or restore', () => {
  const played = () => {
    const save = defaults();
    save.stickers.push({ game: 'bubble-pop', seed: 4, at: 1 }, { game: 'duck-pond', seed: 9, at: 2 });
    save.games['bubble-pop'] = { plays: 4, level: 3, pinned: 2, history: [] };
    return save;
  };

  it('snapshots a copy that later changes cannot reach', () => {
    const save = played();
    const snap = remember(save, 100);
    save.stickers.length = 0;
    save.games['bubble-pop'].plays = 0;
    expect(snap.at).toBe(100);
    expect(snap.data.stickers).toHaveLength(2);
    expect(snap.data.games['bubble-pop'].plays).toBe(4);
  });

  it('brings the stickers back, and a second undo is a redo', () => {
    const before = played();
    const snap = remember(before, 1);
    const afterReset = { ...defaults(), profile: before.profile, settings: before.settings, creatures: before.creatures };
    const undone = swapWithPrevious(afterReset, snap, 2);
    expect(undone.data).toEqual(before);
    expect(undone.previous.at).toBe(2);
    const redone = swapWithPrevious(undone.data, undone.previous, 3);
    expect(redone.data).toEqual(afterReset);
  });

  it('reads back a stored snapshot, repairing it, and rejects anything else', () => {
    const stored = JSON.parse(JSON.stringify(remember(played(), 7)));
    expect(repairPrevious(stored)).toEqual(remember(played(), 7));
    const damaged = repairPrevious({ at: 5, data: { profile: { name: 'Mia', band: 'dinosaur' }, stickers: 'x' } });
    expect(damaged?.data.profile).toEqual({ name: 'Mia', band: 'lap' });
    expect(damaged?.data.stickers).toEqual([]);
    for (const junk of [null, undefined, 'x', 4, [], {}, { at: 'now', data: {} }, { at: Infinity, data: {} }, { at: 1 }, { at: 1, data: 'x' }]) {
      expect(repairPrevious(junk)).toBeNull();
    }
  });
});
