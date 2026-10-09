import { describe, expect, it } from 'vitest';
import { blankToFill, cardName, isBlankProfile, newEntry } from '../progress/profiles';
import { defaults } from '../progress/save';
import { cleanPlayerName, couchNameFor, modeFor, NAME_LIMIT, readNewPlayer, skipsEgg, sourceOfClick } from './chooser';

const now = new Date(2026, 9, 15);

describe('which mode a card opens', () => {
  it('opens the island for a tap or a click and the couch for a key or a controller', () => {
    expect(modeFor('pointer')).toBe('island');
    expect(modeFor('key')).toBe('couch');
    expect(modeFor('pad')).toBe('couch');
  });

  it('reads a click with no pointer behind it (Enter, or a screen reader) as a key, never as the island', () => {
    expect(sourceOfClick(1)).toBe('pointer');
    expect(sourceOfClick(2)).toBe('pointer');
    expect(sourceOfClick(0)).toBe('key');
    expect(modeFor(sourceOfClick(0))).toBe('couch');
  });
});

describe('couch Player 1', () => {
  it('takes the person’s name, as the couch shows names', () => {
    expect(couchNameFor('Mia')).toBe('Mia');
    expect(couchNameFor('  Robert   Dunlap ')).toBe('Robert Dunlap');
  });

  it('is cut to the couch’s 14 letters', () => {
    expect(couchNameFor('Bartholomew the Third')).toBe('Bartholomew th');
    expect([...couchNameFor('x'.repeat(40))!]).toHaveLength(14);
  });

  it('leaves the couch’s own name alone when the person has none', () => {
    expect(couchNameFor('')).toBeNull();
    expect(couchNameFor('   ')).toBeNull();
    expect(couchNameFor('\u0007\u0000')).toBeNull();
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
  it('needs a name and a birth the clock allows', () => {
    expect(readNewPlayer('Mia', '10', '2025', now)).toEqual({ ok: true, name: 'Mia', birth: { month: 10, year: 2025 } });
    expect(readNewPlayer('Mia', 10, 2025, now)).toMatchObject({ ok: true });
    expect(readNewPlayer('', '10', '2025', now)).toEqual({ ok: false, problem: 'name' });
    expect(readNewPlayer('   ', '10', '2025', now)).toEqual({ ok: false, problem: 'name' });
  });

  it('refuses a birth that is blank, not a number, or has not happened', () => {
    for (const [m, y] of [['', '2025'], ['10', ''], ['x', '2025'], ['10', '20x5'], ['13', '2025'], ['0', '2025'], ['11', '2026'], ['1', '2027'], ['1', '1800'], ['10', '2025.5']]) {
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

describe('the profile nobody has used', () => {
  const entry = newEntry('aaaa1111', 0, true);

  it('is blank until something is named, hatched, dated or played', () => {
    expect(isBlankProfile(defaults(), entry)).toBe(true);
    const named = defaults();
    named.profile.name = 'Mia';
    expect(isBlankProfile(named, entry)).toBe(false);
    const hatched = defaults();
    hatched.pet.hatched = true;
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

describe('the name on a card', () => {
  it('is the person’s, else their friend’s', () => {
    const save = defaults();
    save.pet.name = 'Clover';
    expect(cardName(save)).toBe('Clover');
    save.profile.name = '  Mia ';
    expect(cardName(save)).toBe('Mia');
  });
});
