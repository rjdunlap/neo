import { describe, expect, it } from 'vitest';
import {
  blankToFill,
  cardName,
  everyoneHidden,
  isBlankProfile,
  isHiddenProfile,
  newEntry,
} from '../progress/profiles';
import { defaults } from '../progress/save';
import { bandForYears, completedYears } from '../progress/profiles';
import {
  ADULT_YEARS,
  AGE_CHIPS,
  birthForChip,
  chipForBirth,
  cleanPlayerName,
  exitFor,
  NAME_LIMIT,
  readNewPlayer,
  skipsEgg,
} from './chooser';

const now = new Date(2026, 9, 15);

describe('where a tapped card opens (D8)', () => {
  it('opens Home by default, the six when chosen, and the hatch for someone with no friend either way', () => {
    expect(exitFor(true, defaults().settings.startView)).toBe('hub');
    expect(exitFor(true, 'explore')).toBe('hub');
    expect(exitFor(true, 'six')).toBe('six');
    expect(exitFor(false, 'six')).toBe('hatch');
    expect(exitFor(false, 'explore')).toBe('hatch');
  });
});

describe('a name typed in the form', () => {
  it('is tidied and kept to 40 characters', () => {
    expect(cleanPlayerName('  Grandma   Jo ')).toBe('Grandma Jo');
    expect([...cleanPlayerName('y'.repeat(100))]).toHaveLength(NAME_LIMIT);
    expect(cleanPlayerName('Mi\u0007a')).toBe('Mia');
    expect(cleanPlayerName(42)).toBe('');
  });
});

describe('add a player', () => {
  it('needs a birth the clock allows, and takes a name or none', () => {
    expect(readNewPlayer('Mia', '10', '2025', now)).toEqual({
      ok: true,
      name: 'Mia',
      birth: { month: 10, year: 2025 },
    });
    expect(readNewPlayer('Mia', 10, 2025, now)).toMatchObject({ ok: true });
    for (const none of ['', '   ', undefined])
      expect(readNewPlayer(none, '10', '2025', now)).toEqual({
        ok: true,
        name: '',
        birth: { month: 10, year: 2025 },
      });
  });

  it('refuses a birth that is blank, not a number, or has not happened', () => {
    for (const [m, y] of [
      ['', '2025'],
      ['10', ''],
      ['x', '2025'],
      ['10', '20x5'],
      ['13', '2025'],
      ['0', '2025'],
      ['11', '2026'],
      ['1', '2027'],
      ['1', '1800'],
      ['10', '2025.5'],
    ]) {
      expect(readNewPlayer('Mia', m, y, now), `${m}/${y}`).toEqual({ ok: false, problem: 'birth' });
    }
  });

  it('takes this month, and a birth 120 years back', () => {
    expect(readNewPlayer('Mia', '10', '2026', now)).toMatchObject({ ok: true });
    expect(readNewPlayer('Nan', '1', '1906', now)).toMatchObject({ ok: true });
  });

  it('offers a friend to choose, with no egg, from 13', () => {
    expect(skipsEgg({ month: 10, year: 2013 }, now)).toBe(true);
    expect(skipsEgg({ month: 11, year: 2013 }, now)).toBe(false);
    expect(skipsEgg({ month: 10, year: 2020 }, now)).toBe(false);
    expect(skipsEgg(null, now)).toBe(false);
  });
});

describe('the age chips', () => {
  const days = [now, new Date(2026, 0, 1), new Date(2026, 11, 31), new Date(2028, 1, 29)];

  it('cover every year to twelve once, then a grown-up', () => {
    expect(AGE_CHIPS.map((c) => c.years)).toEqual(Array.from({ length: ADULT_YEARS + 1 }, (_, i) => i));
    expect(new Set(AGE_CHIPS.map((c) => c.label)).size).toBe(AGE_CHIPS.length);
    expect(AGE_CHIPS.every((c) => c.spoken.length > c.label.length || c.years === ADULT_YEARS)).toBe(true);
  });

  it('fill a birth the form accepts, this month, that makes them the age tapped', () => {
    for (const day of days)
      for (const chip of AGE_CHIPS) {
        const birth = birthForChip(chip, day);
        expect(birth.month).toBe(day.getMonth() + 1);
        expect(readNewPlayer('', String(birth.month), String(birth.year), day)).toEqual({
          ok: true,
          name: '',
          birth,
        });
        const years = completedYears(birth, day);
        if (chip.years < ADULT_YEARS) expect(years).toBe(chip.years);
        else expect(bandForYears(years)).toBe('grownup');
      }
  });

  it('reach every band the island starts someone in', () => {
    const bands = new Set(AGE_CHIPS.map((c) => bandForYears(completedYears(birthForChip(c, now), now))));
    expect([...bands]).toEqual(['lap', 'toddler', 'preschool', 'prek', 'school', 'grownup']);
  });

  it('light the chip that matches the fields, tapped or typed', () => {
    for (const day of days)
      for (const chip of AGE_CHIPS) {
        const birth = birthForChip(chip, day);
        expect(chipForBirth(String(birth.month), String(birth.year), day)).toBe(chip);
      }
    // Typed: born October 2023 is three in October 2026, and two the month before her birthday.
    expect(chipForBirth('10', '2023', now)?.years).toBe(3);
    expect(chipForBirth('11', '2023', now)?.years).toBe(2);
    expect(chipForBirth('1', '1950', now)?.years).toBe(ADULT_YEARS);
  });

  it('light none while the fields hold no birth', () => {
    for (const [m, y] of [
      ['', '2025'],
      ['10', ''],
      ['10', '20'],
      ['11', '2026'],
      ['10', '1800'],
    ])
      expect(chipForBirth(m, y, now), `${m}/${y}`).toBeNull();
  });
});

describe('the profile nobody has used', () => {
  const entry = newEntry('aaaa1111', 0, true);

  it('is blank until something is named, hatched, dated or played', () => {
    expect(isBlankProfile(defaults(), entry)).toBe(true);
    const named = defaults();
    named.profile.name = 'Mia';
    expect(isBlankProfile(named, entry)).toBe(false);
    const hatched = defaults();
    hatched.creatures = {
      owned: [
        {
          id: 'abcd',
          species: 'sprout',
          name: 'Pip',
          look: { color: 'teal', worn: [], form: null },
          metAt: 'start',
        },
      ],
      companion: 'abcd',
      forms: [],
    };
    expect(isBlankProfile(hatched, entry)).toBe(false);
    const stickered = defaults();
    stickered.stickers.push({ game: 'bubble-pop', seed: 1, at: 1 });
    expect(isBlankProfile(stickered, entry)).toBe(false);
    const played = defaults();
    played.games['bubble-pop'] = { plays: 1, level: 1, pinned: null, history: [] };
    expect(isBlankProfile(played, entry)).toBe(false);
    expect(isBlankProfile(defaults(), { ...entry, birth: { month: 1, year: 2020 } })).toBe(false);
    expect(isBlankProfile(defaults(), { ...entry, startBand: 'prek' })).toBe(false);
  });

  it('stays blank when a game was only looked at (reading stats creates the record)', () => {
    const peeked = defaults();
    peeked.games['bubble-pop'] = { plays: 0, level: 1, pinned: null, history: [] };
    expect(isBlankProfile(peeked, entry)).toBe(true);
  });

  it('is filled in by Add, the original before any other, and not at all when nobody is blank', () => {
    const mia = defaults();
    mia.profile.name = 'Mia';
    const items = [
      { entry: newEntry('bbbb2222', 0), save: defaults() },
      { entry: newEntry('aaaa1111', 0, true), save: defaults() },
      { entry: newEntry('cccc3333', 0), save: mia },
    ];
    expect(blankToFill(items)).toBe('aaaa1111');
    expect(blankToFill([items[0], items[2]])).toBe('bbbb2222');
    expect(blankToFill([items[2]])).toBeNull();
    expect(blankToFill([])).toBeNull();
  });
});

describe('a guest who played first', () => {
  const played = () => {
    const save = defaults();
    save.stickers.push({ game: 'bubble-pop', seed: 1, at: 1 });
    save.games['bubble-pop'] = { plays: 1, level: 1, pinned: null, history: [] };
    return save;
  };
  const guest = { ...newEntry('aaaa1111', 0, true), guest: true };

  it('is hidden from the chooser like a blank profile, even after a round and a sticker', () => {
    expect(isBlankProfile(played(), guest)).toBe(false);
    expect(isHiddenProfile(played(), guest)).toBe(true);
    expect(isHiddenProfile(defaults(), newEntry('bbbb2222', 0))).toBe(true);
    expect(isHiddenProfile(played(), newEntry('bbbb2222', 0))).toBe(false);
  });

  it('leaves everyone hidden on a fresh device and with only a guest, and not once anyone is set up', () => {
    const blank = { entry: newEntry('aaaa1111', 0, true), save: defaults() };
    expect(everyoneHidden([blank])).toBe(true);
    expect(everyoneHidden([{ entry: guest, save: played() }])).toBe(true);
    expect(
      everyoneHidden([
        { entry: guest, save: played() },
        { entry: newEntry('bbbb2222', 0), save: defaults() },
      ]),
    ).toBe(true);
    const named = defaults();
    named.profile.name = 'Mia';
    for (const other of [
      { entry: { ...newEntry('cccc3333', 0), birth: { month: 1, year: 2020 } }, save: defaults() },
      { entry: { ...newEntry('cccc3333', 0), startBand: 'prek' as const }, save: defaults() },
      { entry: newEntry('cccc3333', 0), save: named },
      { entry: newEntry('cccc3333', 0), save: played() },
    ])
      expect(everyoneHidden([{ entry: guest, save: played() }, other])).toBe(false);
  });

  it('is the profile Add fills, even beside a blank original', () => {
    const lateGuest = { ...newEntry('bbbb2222', 0), guest: true };
    expect(
      blankToFill([
        { entry: newEntry('aaaa1111', 0, true), save: defaults() },
        { entry: lateGuest, save: played() },
      ]),
    ).toBe('bbbb2222');
  });
});

describe('the name on a card', () => {
  it('is the person’s, else their companion’s, else the first friend’s name to come', () => {
    const save = defaults();
    expect(cardName(save)).toBe('Pip');
    save.creatures = {
      owned: [
        {
          id: 'abcd',
          species: 'river',
          name: 'Clover',
          look: { color: 'teal', worn: [], form: null },
          metAt: 'start',
        },
      ],
      companion: 'abcd',
      forms: [],
    };
    expect(cardName(save)).toBe('Clover');
    save.profile.name = '  Mia ';
    expect(cardName(save)).toBe('Mia');
  });
});
