import { describe, expect, it } from 'vitest';
import { gameById } from '../games/registry';
import { ANIMALS, FAVORITE } from '../games/animal-snack/logic';
import { ACTIONS } from '../games/photo-safari/logic';
import { ALL_THINGS, floats } from '../games/sink-float/logic';
import { cleanJournal, discover, emptyJournal, entriesOf, entryById, entryId, hasNew, JOURNAL, JOURNAL_IDS, markSeen, sourceText } from './journal';
import { SCRIPT } from './voice-script';

describe('the entries', () => {
  it('covers every promised observation from all six source games, and no others', () => {
    expect(entriesOf('sink-float').map((e) => e.key).sort()).toEqual([...ALL_THINGS].sort());
    expect(entriesOf('animal-snack').map((e) => e.key).sort()).toEqual([...ANIMALS].sort());
    expect(entriesOf('photo-safari').map((e) => e.key).sort()).toEqual([...ACTIONS].sort());
    expect(entriesOf('seesaw-balance').map((e) => e.key).sort()).toEqual(['equal-level', 'heavy-down']);
    expect(entriesOf('bouncy-launch').map((e) => e.key)).toEqual(['bigger-pull']);
    expect(entriesOf('habitat-helpers').map((e) => e.key).sort()).toEqual(['bunny', 'duck']);
    expect(JOURNAL).toHaveLength(ALL_THINGS.length + ANIMALS.length + ACTIONS.length + 5);
  });

  it('gives each a stable, unique id from its game and key', () => {
    expect(new Set(JOURNAL_IDS).size).toBe(JOURNAL.length);
    for (const e of JOURNAL) expect(e.id).toBe(entryId(e.game, e.key));
    expect(entryById('sink-float:duck')?.name).toBe('Duck');
    expect(entryById('nope')).toBeUndefined();
  });

  it('can always be found: every entry names a real game that plays it', () => {
    for (const e of JOURNAL) {
      const mod = gameById(e.game);
      expect(mod, e.id).toBeDefined();
      expect(mod!.bands.length).toBeGreaterThan(0);
    }
  });

  it('has a spoken observation for every entry, and it is true', () => {
    for (const e of JOURNAL) {
      const lines = SCRIPT[e.line];
      expect(lines?.length, e.id).toBeGreaterThan(0);
      const said = lines.join(' ').toLowerCase();
      switch (e.game) {
        case 'sink-float': {
          const thing = e.key as (typeof ALL_THINGS)[number];
          expect(said, e.id).toContain(floats(thing) ? 'float' : 'sink');
          expect(said, e.id).not.toContain(floats(thing) ? 'sinks' : 'floats');
          expect(said, e.id).toContain(e.key);
          break;
        }
        case 'animal-snack':
          expect(said, e.id).toContain(e.key);
          expect(said, e.id).toContain(FAVORITE[e.key as keyof typeof FAVORITE]!);
          break;
        case 'photo-safari':
          expect(said, e.id).toContain(e.key.slice(0, -3));
          break;
        case 'seesaw-balance':
          expect(said, e.id).toContain(e.key === 'heavy-down' ? 'more weight' : 'same weight');
          expect(said, e.id).toContain(e.key === 'heavy-down' ? 'down' : 'level');
          break;
        case 'bouncy-launch':
          expect(said, e.id).toContain('bigger pull');
          expect(said, e.id).toContain('farther');
          break;
        case 'habitat-helpers':
          expect(said, e.id).toContain(e.key);
          expect(said, e.id).toContain('food');
          expect(said, e.id).toContain('water');
          expect(said, e.id).toContain('shelter');
          break;
      }
    }
  });

  it('lists the floaters before the sinkers', () => {
    const order = entriesOf('sink-float').map((e) => floats(e.key as (typeof ALL_THINGS)[number]));
    expect(order.indexOf(false)).toBeGreaterThan(order.lastIndexOf(true));
  });

  it('says exactly what to do to find an entry, and where a found one came from', () => {
    for (const e of JOURNAL) {
      const gameName = gameById(e.game)!.name;
      const find = sourceText(e, gameName, false);
      const found = sourceText(e, gameName, true);
      expect(find).toContain(gameName);
      expect(found).toContain(gameName);
      expect(find).not.toMatch(/Not found yet/);
      expect(found).toMatch(/^Found in .+ when /);
      if (e.game === 'sink-float') {
        expect(find.toLowerCase()).toContain(e.key);
        expect(found.toLowerCase()).toContain(e.key);
        expect(find).toContain('water');
        expect(found).toContain('water');
      } else if (e.game === 'animal-snack') {
        expect(find.toLowerCase()).toContain(e.key);
        expect(found.toLowerCase()).toContain(e.key);
        expect(find).toContain(FAVORITE[e.key as keyof typeof FAVORITE]!);
        expect(found).toContain(FAVORITE[e.key as keyof typeof FAVORITE]!);
      } else if (e.game === 'photo-safari') {
        expect(find).toContain('photo');
        expect(find).toContain(e.key);
        expect(found).toContain(e.key);
      } else if (e.game === 'seesaw-balance') {
        expect(find).toContain('seesaw');
        expect(found).toContain('side');
      } else if (e.game === 'bouncy-launch') {
        expect(find).toContain('pulls');
        expect(found).toContain('bigger pull');
      } else {
        expect(find.toLowerCase()).toContain(e.key);
        expect(found.toLowerCase()).toContain(e.key);
        expect(find).toContain('food');
        expect(find).toContain('water');
        expect(find).toContain('shelter');
      }
    }
  });
});

describe('finding entries', () => {
  it('adds what a round showed, once, and says what is new', () => {
    const first = discover(emptyJournal(), ['sink-float:duck', 'sink-float:rock']);
    expect(first.added).toEqual(['sink-float:duck', 'sink-float:rock']);
    const again = discover(first.journal, ['sink-float:duck', 'animal-snack:cow']);
    expect(again.added).toEqual(['animal-snack:cow']);
    expect(again.journal.found).toEqual(['sink-float:duck', 'sink-float:rock', 'animal-snack:cow']);
  });

  it('ignores anything that is not an entry, and changes nothing when nothing is new', () => {
    const start = discover(emptyJournal(), ['sink-float:duck']).journal;
    for (const ids of [undefined, [], ['nope', 'sink-float:unicorn'], ['sink-float:duck']]) {
      const r = discover(start, ids);
      expect(r.added).toEqual([]);
      expect(r.journal).toBe(start);
    }
  });

  it('never changes the journal it was given', () => {
    const start = emptyJournal();
    discover(start, ['sink-float:duck']);
    expect(start).toEqual(emptyJournal());
  });

  it('twinkles only for what she has not looked at yet', () => {
    let j = emptyJournal();
    expect(hasNew(j)).toBe(false);
    j = discover(j, ['sink-float:duck']).journal;
    expect(hasNew(j)).toBe(true);
    j = markSeen(j);
    expect(hasNew(j)).toBe(false);
    j = discover(j, ['sink-float:boat']).journal;
    expect(hasNew(j)).toBe(true);
    expect(markSeen(markSeen(j))).toEqual(markSeen(j));
  });
});

describe('a damaged save', () => {
  it('is repaired to known entries, once each', () => {
    expect(cleanJournal(undefined)).toEqual(emptyJournal());
    expect(cleanJournal('x')).toEqual(emptyJournal());
    expect(cleanJournal({ found: 'duck', seen: 3 })).toEqual(emptyJournal());
    expect(cleanJournal({ found: ['sink-float:duck', 'sink-float:duck', 7, 'retired:entry', 'animal-snack:cow'], seen: 1 })).toEqual({ found: ['sink-float:duck', 'animal-snack:cow'], seen: 1 });
  });

  it('never claims she has looked at more than she has found', () => {
    expect(cleanJournal({ found: ['sink-float:duck'], seen: 9 }).seen).toBe(1);
    expect(cleanJournal({ found: ['sink-float:duck'], seen: -4 }).seen).toBe(0);
    expect(cleanJournal({ found: ['sink-float:duck'], seen: NaN }).seen).toBe(0);
  });
});
