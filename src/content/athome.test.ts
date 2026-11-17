import { describe, expect, it } from 'vitest';
import { GAMES } from '../games/registry';
import type { GameModule } from '../games/types';
import { BANDS, type Band } from '../progress/bands';
import { AT_HOME_NOTES, KIT, atHomeCard, atHomeNoteFor, kitFor, type AtHomeNotes } from './athome';
import { LANDS, landOf, visibleGames } from './lands';
import { NO_NAME, offScreenFor } from './offscreen';
import { DEFERRED_CLASSES, EVERY_BAND, UNDER_3, wordPattern } from './offscreen-rules';

const ALL_BANDS = BANDS.map((b) => b.id);
const CHILD_BANDS = ALL_BANDS.filter((b) => b !== 'grownup');
const NAME = 'Mira';
const DAY = 24 * 60 * 60 * 1000;
const NOW = Date.UTC(2026, 10, 17, 12);
const byId = (id: string) => {
  const g = GAMES.find((g) => g.id === id);
  if (!g) throw new Error(`no game ${id}`);
  return g;
};
const noted = Object.keys(AT_HOME_NOTES).map(byId);
/** Every (game with notes, child band it lists) pair, with the resolved note. */
const resolved = noted.flatMap((g) =>
  g.bands
    .filter((b) => b !== 'grownup')
    .map((band) => ({ g, band, note: atHomeNoteFor(g, band, NAME), line: offScreenFor(g, band, NAME) })),
);
const card = (band: Band, played: Record<string, number> = {}, name = NAME) =>
  atHomeCard({
    games: visibleGames(band, GAMES),
    lands: LANDS,
    band,
    childName: name,
    lastPlayed: (g) => played[g.id],
    now: NOW,
  });
const ids = (c: { ideas: { game: { id: string } }[] }) => c.ideas.map((i) => i.game.id);
const hits = (text: string, words: readonly string[]) => words.filter((w) => wordPattern(w).test(text));

const PRONOUNS = ['she', 'her', 'hers', 'he', 'him', 'his', 'they', 'them', 'their'];
const MEASURING = ['can', 'able', 'yet', 'should', 'ready', 'by now', 'behind', 'ahead'];
const ANSWER_SEEKING = ['what', 'which', 'why', 'how', 'tell', 'say', 'count', 'name'];

describe('At-home notes', () => {
  it('has a registered game with an off-screen line behind every entry, and only band keys the game lists', () => {
    expect(noted.length).toBeGreaterThanOrEqual(48);
    // Every land has at least one game with notes, so a starter walk can find a complete idea in any of them.
    for (const land of LANDS)
      expect(
        land.games.some((id) => id in AT_HOME_NOTES),
        land.id,
      ).toBe(true);
    for (const g of noted) {
      expect(g.offScreen, g.id).toBeTruthy();
      const entry = AT_HOME_NOTES[g.id];
      expect(entry.all, g.id).toBeTruthy();
      for (const [key, note] of Object.entries(entry)) {
        if (key !== 'all') expect(g.bands, `${g.id} ${key}`).toContain(key);
        expect(note.notice.trim(), `${g.id} ${key} notice`).not.toBe('');
        expect(note.say.trim(), `${g.id} ${key} say`).not.toBe('');
      }
    }
  });

  it('writes each Notice as one question that names her once, with no pronoun, measuring word or age', () => {
    const bad: string[] = [];
    for (const { g, band, note } of resolved) {
      if (!note) throw new Error(`${g.id} has no note at ${band}`);
      const n = note.notice;
      const at = `${g.id} at ${band}: "${n}"`;
      if (!n.endsWith('?')) bad.push(`${at} does not end with "?"`);
      if (n.split(NAME).length !== 2) bad.push(`${at} does not name her exactly once`);
      if (/[{}]/.test(n)) bad.push(`${at} has a brace`);
      if (n.length > 110) bad.push(`${at} is ${n.length} characters`);
      for (const w of [...hits(n, PRONOUNS), ...hits(n, MEASURING)]) bad.push(`${at} says "${w}"`);
      if (/\b\d+\s*(years?|months?)\b|\bage\b/i.test(n)) bad.push(`${at} names an age`);
    }
    expect(bad).toEqual([]);
  });

  it('keeps each Say short, and asks for no answer in words at lap or toddler', () => {
    const bad: string[] = [];
    for (const { g, band, note } of resolved) {
      const s = note!.say;
      if (s.length > 80) bad.push(`${g.id} at ${band}: ${s.length} characters`);
      if (band === 'lap' || band === 'toddler')
        for (const w of hits(s, ANSWER_SEEKING)) bad.push(`${g.id} at ${band}: "${w}" in "${s}"`);
    }
    expect(bad).toEqual([]);
  });

  it("holds every Notice and Say to the lines' own rules: no obligation at any band, no small loose object under 3", () => {
    const bad: string[] = [];
    for (const { g, band, note } of resolved)
      for (const text of [note!.notice, note!.say]) {
        for (const re of EVERY_BAND) if (re.test(text)) bad.push(`${g.id} at ${band}: ${re} in "${text}"`);
        if (band === 'lap' || band === 'toddler')
          for (const w of hits(text, UNDER_3)) bad.push(`${g.id} at ${band}: "${w}" in "${text}"`);
        for (const w of hits(text, DEFERRED_CLASSES)) bad.push(`${g.id} at ${band}: "${w}" in "${text}"`);
      }
    expect(bad).toEqual([]);
  });

  it('gives notes only to games whose Try avoids every deferred practical-care class at every band', () => {
    const bad: string[] = [];
    for (const { g, band, line } of resolved) {
      if (line === null) continue;
      for (const w of hits(line, DEFERRED_CLASSES)) bad.push(`${g.id} at ${band}: "${w}" in "${line}"`);
    }
    expect(bad).toEqual([]);
  });

  it('resolves like the line: nothing for a grown-up, a game without an entry or a withheld line; a band key wins', () => {
    const drums = byId('jelly-drums');
    expect(atHomeNoteFor(drums, 'grownup', NAME)).toBeNull();
    expect(atHomeNoteFor(byId('garden-grow'), 'prek', NAME)).toBeNull();
    const stub = {
      id: 'stub',
      bands: ['lap', 'toddler', 'preschool'] as Band[],
      offScreen: { all: 'Stack cups.', lap: null },
    };
    const notes: Record<string, AtHomeNotes> = {
      stub: { all: { notice: 'Does {name} stack?', say: 'Up!' } },
    };
    expect(atHomeNoteFor(stub, 'lap', NAME, notes)).toBeNull();
    expect(atHomeNoteFor(stub, 'toddler', NAME, notes)).toEqual({ notice: 'Does Mira stack?', say: 'Up!' });
    // A profile older than the game plays it at the game's top band, as the line does.
    expect(atHomeNoteFor(stub, 'school', NAME, notes)).toEqual({ notice: 'Does Mira stack?', say: 'Up!' });
    expect(atHomeNoteFor(drums, 'school', NAME)!.say).toBe(AT_HOME_NOTES['jelly-drums'].school!.say);
    expect(atHomeNoteFor(drums, 'prek', NAME)!.say).toBe(AT_HOME_NOTES['jelly-drums'].all.say);
    expect(atHomeNoteFor(drums, 'lap', '  ')!.notice).toContain(NO_NAME);
    expect(atHomeNoteFor(drums, 'lap', '')!.notice).not.toContain('{name}');
    // A game ID that is also an Object.prototype key has no entry.
    expect(atHomeNoteFor({ ...stub, id: 'constructor' }, 'toddler', NAME)).toBeNull();
  });
});

describe('the kit list', () => {
  it('names nothing small and loose, nothing from a deferred class and nothing to buy', () => {
    const bad: string[] = [];
    for (const { label } of KIT) {
      for (const w of [...hits(label, UNDER_3), ...hits(label, DEFERRED_CLASSES)])
        bad.push(`"${label}" says "${w}"`);
      for (const re of EVERY_BAND) if (re.test(label)) bad.push(`"${label}" matches ${re}`);
    }
    expect(bad).toEqual([]);
    expect(new Set(KIT.map((k) => k.label)).size).toBe(KIT.length);
  });

  it('keeps table order, lists a label once, and lets the soft toy stand in for "a few toys"', () => {
    expect(kitFor(['A box of blocks.', 'Roll balls into a basket, then stack more blocks.'])).toEqual([
      'a large soft ball',
      'blocks',
      'a laundry basket or box',
    ]);
    expect(kitFor(['Line up toys by size.'])).toEqual(['a few toys']);
    expect(kitFor(['Play opposites with toys: put the teddy up high.'])).toEqual([
      'a teddy or other soft toy',
    ]);
    expect(kitFor(['Herd stuffed animals into a laundry-basket "pen".'])).toEqual([
      'a teddy or other soft toy',
      'a laundry basket or box',
    ]);
    expect(kitFor(['Go for a walk and look at the clouds.'])).toEqual([]);
    expect(kitFor([])).toEqual([]);
    // Whole words only: a pancake is not a pan, a cupboard not a cup, a balloon not a ball.
    expect(kitFor(['Flip a pancake by the cupboard with a balloon and a bookmark.'])).toEqual([]);
  });

  it('gives every game with notes at least one label at every band, so a complete idea never comes without one', () => {
    for (const { g, band, line } of resolved)
      expect(kitFor([line!]).length, `${g.id} at ${band}`).toBeGreaterThan(0);
  });
});

describe('the At-home card', () => {
  it('starts with three complete ideas from three lands when nothing is played', () => {
    // Lands in order: Bubble Beach, Music Mountain, then Treehouse, where Pixel Pictures starts at preschool and Recipe
    // Workshop (after it in the land's order) at toddler; at lap the walk reaches Barnyard, where Peekaboo Barn comes
    // before Roundup.
    expect(ids(card('lap'))).toEqual(['bounce-back', 'jelly-drums', 'peekaboo-barn']);
    expect(ids(card('toddler'))).toEqual(['bounce-back', 'jelly-drums', 'recipe-workshop']);
    for (const band of ['preschool', 'prek', 'school'] as Band[])
      expect(ids(card(band)), band).toEqual(['bounce-back', 'jelly-drums', 'pixel-pictures']);
    // Roundup stops at pre-K: a school profile still sees it and can play it onto the card, but it is not suggested.
    expect(ids(card('school', { roundup: NOW - DAY }))).toEqual(['roundup', 'bounce-back', 'jelly-drums']);
    expect(card('school', { roundup: NOW - DAY }).ideas[0].note).not.toBeNull();
    for (const band of CHILD_BANDS) {
      const c = card(band);
      expect(new Set(c.ideas.map((i) => landOf(i.game.id)!.id)).size, band).toBe(3);
      for (const i of c.ideas) {
        expect(i.played).toBe(false);
        expect(i.note, `${i.game.id} at ${band}`).not.toBeNull();
        expect(i.try).toBe(offScreenFor(i.game, band, NAME));
      }
    }
    expect(card('lap').kit).toEqual([
      'a large soft ball',
      'pots and pans',
      'a teddy or other soft toy',
      'a blanket',
    ]);
  });

  it('puts a played game first and fills from other lands', () => {
    const c = card('toddler', { 'size-parade': NOW - 2 * DAY });
    expect(c.ideas[0].game.id).toBe('size-parade');
    expect(c.ideas.map((i) => i.played)).toEqual([true, false, false]);
    const lands = c.ideas.map((i) => landOf(i.game.id)!.id);
    expect(new Set(lands).size).toBe(3);
    // A played game in a starter's land takes that land's place.
    const d = card('toddler', { 'bounce-back': NOW - DAY });
    expect(ids(d)).toEqual(['bounce-back', 'jelly-drums', 'recipe-workshop']);
    expect(d.ideas.map((i) => i.played)).toEqual([true, false, false]);
  });

  it('takes the three most recent of four played, most recent first, ties in catalog order', () => {
    const c = card('prek', {
      opposites: NOW - 3 * DAY,
      'block-tower': NOW - DAY,
      'size-parade': NOW - 5 * DAY,
      'jelly-drums': NOW - 2 * DAY,
    });
    expect(ids(c)).toEqual(['block-tower', 'jelly-drums', 'opposites']);
    expect(c.ideas.every((i) => i.played)).toBe(true);
    const games = visibleGames('prek', GAMES);
    const [a, b] = games.filter((g) => g.id === 'opposites' || g.id === 'block-tower');
    expect(ids(card('prek', { opposites: NOW - DAY, 'block-tower': NOW - DAY })).slice(0, 2)).toEqual([
      a.id,
      b.id,
    ]);
  });

  it('skips a played game with no line at her band, and a round older than seven days', () => {
    expect(offScreenFor(byId('garden-grow'), 'toddler', NAME)).toBeNull();
    const c = card('toddler', { 'garden-grow': NOW - DAY, opposites: NOW - 8 * DAY });
    expect(ids(c)).toEqual(['bounce-back', 'jelly-drums', 'recipe-workshop']);
    expect(c.ideas.some((i) => i.played)).toBe(false);
    expect(card('toddler', { opposites: NOW - 7 * DAY }).ideas[0]).toMatchObject({ played: true });
  });

  it('gives a grown-up Try lines only, from games that list the grownup band, and no kit', () => {
    const c = card('grownup');
    expect(c.ideas).toHaveLength(3);
    expect(c.kit).toEqual([]);
    for (const i of c.ideas) {
      expect(i.note).toBeNull();
      expect(i.game.bands, i.game.id).toContain('grownup');
    }
    // A played game is theirs whatever its bands, still without notes.
    const played = card('grownup', { 'jelly-drums': NOW - DAY });
    expect(played.ideas[0]).toMatchObject({ played: true, note: null });
    expect(played.kit).toEqual([]);
  });

  it('fills with a Try alone, then a second game from a land, when complete ideas run out', () => {
    const g = (id: string, offScreen?: GameModule['offScreen']) => ({
      id,
      bands: ['lap'] as Band[],
      offScreen,
    });
    const games = [
      g('a', 'Stack cups.'),
      g('b', 'Roll a ball.'),
      g('c'),
      g('d', 'Read a book.'),
      g('e', 'Fold paper.'),
    ];
    const lands = [{ games: ['a', 'b', 'c'] }, { games: ['d'] }, { games: ['zz'] }];
    const notes: Record<string, AtHomeNotes> = { d: { all: { notice: 'Does {name} point?', say: 'Look!' } } };
    const c = atHomeCard({
      games,
      lands,
      band: 'lap',
      childName: NAME,
      lastPlayed: () => undefined,
      now: NOW,
      notes,
    });
    // The complete game first, then a Try alone from the other land, then that land's second game; `e` is in no land.
    expect(ids(c)).toEqual(['d', 'a', 'b']);
    expect(c.kit).toEqual(['a large soft ball', 'cups or bowls', 'a book']);
    const few = atHomeCard({
      games: games.slice(0, 1),
      lands,
      band: 'lap',
      childName: NAME,
      lastPlayed: () => undefined,
      now: NOW,
      notes,
    });
    expect(ids(few)).toEqual(['a']);
  });

  it('is the same card for the same inputs', () => {
    const played = { 'size-parade': NOW - DAY };
    for (const band of ALL_BANDS) expect(card(band, played)).toEqual(card(band, played));
  });
});
