import { describe, expect, it } from 'vitest';
import { BANDS } from './bands';
import {
  addEntry,
  BACKUP_KIND,
  bandForYears,
  buildBackup,
  checkBirthInput,
  cleanBirth,
  completedYears,
  effectiveBand,
  isProfileId,
  MAX_PROFILES,
  newEntry,
  newProfileId,
  parseBackup,
  planRestore,
  previousKey,
  removeEntry,
  repairIndex,
  saveKey,
  updateEntry,
  type ProfileIndex,
} from './profiles';
import { defaults } from './save';

const counter = () => {
  let n = 0;
  return () => `id${String(++n).padStart(4, '0')}`;
};
const at = (y: number, m: number, d = 15) => new Date(y, m - 1, d);

describe('keys', () => {
  it('keeps the first profile at neo.save and gives the rest keys of their own', () => {
    expect(saveKey({ id: 'abc123', legacy: true })).toBe('neo.save');
    expect(previousKey({ id: 'abc123', legacy: true })).toBe('neo.save.previous');
    expect(saveKey({ id: 'abc123', legacy: false })).toBe('neo.save.abc123');
    expect(previousKey({ id: 'abc123', legacy: false })).toBe('neo.save.abc123.previous');
  });

  it('makes ids that are safe in a key and different each time', () => {
    const ids = new Set(Array.from({ length: 50 }, newProfileId));
    expect(ids.size).toBe(50);
    for (const id of ids) expect(isProfileId(id)).toBe(true);
    for (const bad of ['', 'ab', 'A'.repeat(8), 'has space', '../x', 'x'.repeat(33), 12345678, null]) expect(isProfileId(bad)).toBe(false);
  });
});

describe('birth month and year', () => {
  it('keeps a stored birth by its shape whatever the clock says', () => {
    expect(cleanBirth({ month: 10, year: 2025 })).toEqual({ month: 10, year: 2025 });
    expect(cleanBirth({ month: 1, year: 1900 })).toEqual({ month: 1, year: 1900 });
    expect(cleanBirth({ month: 12, year: 2100 })).toEqual({ month: 12, year: 2100 });
  });

  it('drops a stored birth that is not a month and a year', () => {
    for (const bad of [null, 'Oct 2025', [10, 2025], {}, { month: 0, year: 2025 }, { month: 13, year: 2025 }, { month: 10.5, year: 2025 }, { month: '10', year: 2025 }, { month: 10, year: 1899 }, { month: 10, year: 2101 }, { month: 10, year: NaN }]) {
      expect(cleanBirth(bad)).toBeNull();
    }
  });

  it('holds what a person types to the clock', () => {
    const now = at(2026, 10);
    expect(checkBirthInput(10, 2025, now)).toEqual({ month: 10, year: 2025 });
    expect(checkBirthInput(10, 2026, now)).toEqual({ month: 10, year: 2026 });
    // Next month, or a later year, has not happened.
    expect(checkBirthInput(11, 2026, now)).toBeNull();
    expect(checkBirthInput(1, 2027, now)).toBeNull();
    // 120 years ago is the edge.
    expect(checkBirthInput(1, 1906, now)).toEqual({ month: 1, year: 1906 });
    expect(checkBirthInput(12, 1905, now)).toBeNull();
    expect(checkBirthInput(0, 2020, now)).toBeNull();
    expect(checkBirthInput(13, 2020, now)).toBeNull();
    expect(checkBirthInput('5', 2020, now)).toBeNull();
    expect(checkBirthInput(5, 2020.5, now)).toBeNull();
  });
});

describe('age to band', () => {
  const birth = { month: 10, year: 2024 };

  it('counts a birthday from the first of its month', () => {
    expect(completedYears(birth, at(2026, 9, 30))).toBe(1);
    expect(completedYears(birth, at(2026, 10, 1))).toBe(2);
    expect(completedYears(birth, at(2026, 10, 31))).toBe(2);
    expect(completedYears(birth, at(2027, 9, 15))).toBe(2);
  });

  it('calls a birth in the future (a wrong clock) zero years old, never negative', () => {
    expect(completedYears({ month: 6, year: 2030 }, at(2026, 10))).toBe(0);
    expect(bandForYears(completedYears({ month: 6, year: 2030 }, at(2026, 10)))).toBe('lap');
  });

  it('uses the accepted boundaries', () => {
    const band = (y: number) => bandForYears(y);
    expect([0, 1].map(band)).toEqual(['lap', 'lap']);
    expect(band(2)).toBe('toddler');
    expect(band(3)).toBe('preschool');
    expect([4, 5].map(band)).toEqual(['prek', 'prek']);
    expect([6, 7, 8].map(band)).toEqual(['school', 'school', 'school']);
    // 9 to 12 stay at the top of Wonder Woods; 13 and over have no band of their own until stage 3.
    expect([9, 12, 13, 40, 90].map(band)).toEqual(['school', 'school', 'school', 'school', 'school']);
    expect(band(NaN)).toBe('lap');
  });

  it('only ever names a band that exists', () => {
    const ids = BANDS.map((b) => b.id);
    for (let y = 0; y <= 120; y++) expect(ids).toContain(bandForYears(y));
  });

  it('lets a chosen start win, then the age, then the band the save already has', () => {
    const now = at(2026, 10);
    expect(effectiveBand({ birth, startBand: 'school' }, 'lap', now)).toBe('school');
    expect(effectiveBand({ birth, startBand: null }, 'lap', now)).toBe('toddler');
    expect(effectiveBand({ birth: null, startBand: null }, 'prek', now)).toBe('prek');
  });

  it('advances by itself when the clock does', () => {
    const entry = { birth, startBand: null };
    expect(effectiveBand(entry, 'lap', at(2026, 9))).toBe('lap');
    expect(effectiveBand(entry, 'lap', at(2026, 10))).toBe('toddler');
    expect(effectiveBand(entry, 'lap', at(2028, 10))).toBe('prek');
  });
});

describe('repairIndex', () => {
  it('turns nothing into the one legacy profile, so today’s app plays as it did', () => {
    for (const raw of [undefined, null, 'x', 7, [], {}, { profiles: 'no' }, { profiles: [] }, { profiles: [null, 3, {}] }]) {
      const i = repairIndex(raw, counter(), 5);
      expect(i.profiles).toEqual([{ id: 'id0001', legacy: true, birth: null, startBand: null, addedAt: 5 }]);
      expect(i.active).toBe('id0001');
      expect(i.version).toBe(1);
    }
  });

  it('keeps a valid index exactly', () => {
    const index: ProfileIndex = {
      version: 1,
      active: 'bbbb2222',
      profiles: [
        { id: 'aaaa1111', legacy: true, birth: { month: 10, year: 2025 }, startBand: null, addedAt: 1 },
        { id: 'bbbb2222', legacy: false, birth: null, startBand: 'school', addedAt: 2 },
      ],
    };
    expect(repairIndex(JSON.parse(JSON.stringify(index)), counter(), 9)).toEqual(index);
  });

  it('drops hostile ids, repeats, and a second legacy profile', () => {
    const i = repairIndex(
      {
        active: 'cccc3333',
        profiles: [
          { id: '../../etc', legacy: true },
          { id: 'aaaa1111', legacy: true },
          { id: 'aaaa1111', legacy: false },
          { id: 'bbbb2222', legacy: true },
          { id: 5, legacy: false },
        ],
      },
      counter(),
      0,
    );
    expect(i.profiles.map((p) => [p.id, p.legacy])).toEqual([['aaaa1111', true], ['bbbb2222', false]]);
    // The active id named nobody who is left, so the first profile is active.
    expect(i.active).toBe('aaaa1111');
  });

  it('repairs each field of an entry', () => {
    const [p] = repairIndex({ profiles: [{ id: 'aaaa1111', legacy: 'yes', birth: { month: 99, year: 2020 }, startBand: 'dinosaur', addedAt: -4 }] }, counter(), 0).profiles;
    expect(p).toEqual({ id: 'aaaa1111', legacy: false, birth: null, startBand: null, addedAt: 0 });
  });

  it('holds a household of at most eight', () => {
    const profiles = Array.from({ length: 12 }, (_, i) => ({ id: `pro${String(i).padStart(4, '0')}`, legacy: i === 0 }));
    const i = repairIndex({ profiles }, counter(), 0);
    expect(i.profiles).toHaveLength(MAX_PROFILES);
    expect(i.profiles[0].legacy).toBe(true);
  });
});

describe('adding and removing', () => {
  const two: ProfileIndex = repairIndex({ active: 'aaaa1111', profiles: [{ id: 'aaaa1111', legacy: true }, { id: 'bbbb2222' }] }, counter(), 0);

  it('adds a profile until the household is full, and never twice', () => {
    expect(addEntry(two, newEntry('cccc3333', 7))?.profiles.map((p) => p.id)).toEqual(['aaaa1111', 'bbbb2222', 'cccc3333']);
    expect(addEntry(two, newEntry('aaaa1111', 7))).toBeNull();
    let full: ProfileIndex | null = two;
    for (let i = 0; i < MAX_PROFILES; i++) full = full && addEntry(full, newEntry(`fill${String(i).padStart(4, '0')}`, 0));
    expect(full).toBeNull();
  });

  it('moves the active profile to the first one left when it is removed', () => {
    const after = removeEntry(two, 'aaaa1111', counter(), 0);
    expect(after.profiles.map((p) => p.id)).toEqual(['bbbb2222']);
    expect(after.active).toBe('bbbb2222');
  });

  it('leaves the active profile alone when someone else is removed', () => {
    const after = removeEntry(two, 'bbbb2222', counter(), 0);
    expect(after.active).toBe('aaaa1111');
    expect(after.profiles).toHaveLength(1);
  });

  it('never leaves the index empty', () => {
    const one = removeEntry(two, 'bbbb2222', counter(), 0);
    const after = removeEntry(one, 'aaaa1111', counter(), 42);
    expect(after.profiles).toEqual([{ id: 'id0001', legacy: false, birth: null, startBand: null, addedAt: 42 }]);
    expect(after.active).toBe('id0001');
  });

  it('ignores removing someone who is not there', () => {
    expect(removeEntry(two, 'zzzz9999', counter(), 0)).toBe(two);
  });

  it('changes one entry’s birth and start band', () => {
    const next = updateEntry(two, 'bbbb2222', { birth: { month: 3, year: 2020 }, startBand: 'prek' });
    expect(next.profiles[1]).toMatchObject({ birth: { month: 3, year: 2020 }, startBand: 'prek' });
    expect(next.profiles[0]).toEqual(two.profiles[0]);
  });
});

describe('backup', () => {
  const index = repairIndex({ active: 'aaaa1111', profiles: [{ id: 'aaaa1111', legacy: true }, { id: 'bbbb2222' }] }, counter(), 0);
  const mia = defaults();
  mia.profile.name = 'Mia';
  mia.stickers.push({ game: 'bubble-pop', seed: 3, at: 1 });
  const robert = defaults();
  robert.profile.name = 'Robert';

  it('round-trips every profile', () => {
    const file = buildBackup(
      [
        { id: 'aaaa1111', birth: { month: 10, year: 2025 }, startBand: null, save: mia },
        { id: 'bbbb2222', birth: null, startBand: 'school', save: robert },
      ],
      'aaaa1111',
      99,
    );
    expect(file.kind).toBe(BACKUP_KIND);
    const parsed = parseBackup(JSON.stringify(file, null, 2));
    expect(parsed).toEqual({ kind: 'many', profiles: file.profiles });
  });

  it('still reads today’s single-profile backup', () => {
    const parsed = parseBackup(JSON.stringify(mia, null, 2));
    expect(parsed).toEqual({ kind: 'single', save: mia });
  });

  it('refuses what is not ours instead of restoring a blank', () => {
    const couch = { version: 3, party: {}, trips: [], stickers: [], seen: [], names: ['A', 'B'], settings: { place: 'auto' } };
    for (const bad of ['', 'nope', '[]', '{}', '7', 'null', '{"stickers":[]}', JSON.stringify(couch), JSON.stringify({ kind: BACKUP_KIND }), JSON.stringify({ kind: BACKUP_KIND, profiles: [] }), JSON.stringify({ kind: BACKUP_KIND, profiles: [{ id: '../x', save: {} }] })]) {
      expect(parseBackup(bad), bad).toBeNull();
    }
  });

  it('repairs each profile’s save as it reads it, and skips damaged or repeated ones', () => {
    const parsed = parseBackup(
      JSON.stringify({
        kind: BACKUP_KIND,
        profiles: [{ id: 'aaaa1111', birth: { month: 40, year: 1 }, startBand: 'nope', save: { profile: { name: 'Mia', band: 'dinosaur' } } }, { id: 'aaaa1111', save: {} }, { id: 'bbbb2222', save: 'x' }],
      }),
    );
    expect(parsed?.kind).toBe('many');
    if (parsed?.kind !== 'many') return;
    expect(parsed.profiles).toHaveLength(1);
    expect(parsed.profiles[0]).toMatchObject({ birth: null, startBand: null });
    expect(parsed.profiles[0].save.profile).toEqual({ name: 'Mia', band: 'lap' });
  });

  it('replaces who matches, adds who is new, and deletes nobody', () => {
    const parsed = parseBackup(
      JSON.stringify(
        buildBackup(
          [
            { id: 'bbbb2222', birth: { month: 5, year: 1980 }, startBand: null, save: robert },
            { id: 'dddd4444', birth: null, startBand: null, save: mia },
          ],
          'bbbb2222',
          1,
        ),
      ),
    )!;
    const plan = planRestore(index, parsed);
    expect(plan.replace.map((r) => r.id)).toEqual(['bbbb2222']);
    expect(plan.replace[0].entry).toEqual({ birth: { month: 5, year: 1980 }, startBand: null });
    expect(plan.add.map((a) => a.id)).toEqual(['dddd4444']);
    expect(plan.skipped).toBe(0);
    // aaaa1111 is not in the file and appears nowhere in the plan: a restore only puts back.
    expect([...plan.replace.map((r) => r.id), ...plan.add.map((a) => a.id)]).not.toContain('aaaa1111');
  });

  it('adds people only while there is room', () => {
    const profiles = Array.from({ length: 4 }, (_, i) => ({ id: `new${String(i).padStart(4, '0')}`, birth: null, startBand: null, save: robert }));
    const parsed = parseBackup(JSON.stringify(buildBackup(profiles, 'new0000', 1)))!;
    const nearlyFull = repairIndex({ profiles: Array.from({ length: MAX_PROFILES - 2 }, (_, i) => ({ id: `old${String(i).padStart(4, '0')}`, legacy: i === 0 })) }, counter(), 0);
    const plan = planRestore(nearlyFull, parsed);
    expect(plan.add).toHaveLength(2);
    expect(plan.skipped).toBe(2);
  });

  it('puts a single-profile backup into the active profile and leaves who they are alone', () => {
    const plan = planRestore(index, { kind: 'single', save: mia });
    expect(plan.replace).toEqual([{ id: 'aaaa1111', save: mia }]);
    expect(plan.replace[0].entry).toBeUndefined();
    expect(plan.add).toEqual([]);
  });
});
