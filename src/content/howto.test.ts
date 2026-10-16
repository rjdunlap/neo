import { describe, expect, it } from 'vitest';
import { levelsInOrder } from '../progress/difficulty';
import { GAMES } from '../games/registry';
import type { LevelLine } from '../games/types';
import { COUCH_INFO, demoFor } from '../couch/catalog';
import { islandDemo } from './demos';
import { HOW_TO, howToFor, shouldExplain } from './howto';

/** Every level any band of a game plays. */
function levelsOf(g: (typeof GAMES)[number]): number[] {
  const all = new Set<number>();
  for (const band of g.bands) {
    for (const level of levelsInOrder(g.levels(band))) all.add(level);
  }
  return [...all].sort((a, b) => a - b);
}

/** Words that point at some other level: the card for a level says only what is true at that level. */
const OTHER_LEVELS = /\b(levels?|later|earlier|higher)\b/i;

/** The most text a level's card may hold: the longest cards that fit a landscape iPad with a demonstration window. */
const MAX_CARD_CHARS = 840;

describe('touch how-to cards', () => {
  it('has an entry for every game and no entry for a game that is gone', () => {
    const ids = GAMES.map((g) => g.id).sort();
    expect(Object.keys(HOW_TO).sort()).toEqual(ids);
  });

  it('keeps each card short and complete, at every level', () => {
    for (const g of GAMES) {
      for (const level of levelsOf(g)) {
        const card = howToFor(g, level)!;
        const where = `${g.id} level ${level}`;
        expect(card.goal.trim().length, `${where} goal`).toBeGreaterThan(8);
        expect(card.steps.length, `${where} steps`).toBeGreaterThanOrEqual(1);
        expect(card.steps.length, `${where} steps`).toBeLessThanOrEqual(4);
        for (const s of card.steps) expect(s.trim().length, `${where} step`).toBeGreaterThan(8);
        expect(card.finish.trim().length, `${where} finish`).toBeGreaterThan(8);
        if (card.note !== undefined) expect(card.note.trim().length, `${where} note`).toBeGreaterThan(8);
      }
    }
  });

  it('keeps each card short enough to fit a 1024 by 768 screen beside its demonstration', () => {
    // The intro card steps its text down and then runs out of room (Beat Builder at three, 920 characters, ended at 871 of 768 units).
    const long: string[] = [];
    for (const g of GAMES) {
      for (const level of levelsOf(g)) {
        const card = howToFor(g, level)!;
        const chars = [card.level, card.goal, ...card.steps, card.finish, card.note ?? ''].join('').length;
        if (chars > MAX_CARD_CHARS) long.push(`${g.id} level ${level}: ${chars}`);
      }
    }
    expect(long).toEqual([]);
  });

  it('adds the current level line from the game itself, for every supported level', () => {
    for (const g of GAMES) {
      for (const band of g.bands) {
        const { min, max } = g.levels(band);
        for (let level = min; level <= max; level++) {
          const card = howToFor(g, level);
          expect(card?.level, `${g.id} level ${level}`).toBe(g.describeLevel(level));
          expect(card?.levelNumber).toBe(level);
          expect(card?.title).toBe(g.name);
        }
      }
    }
  });

  it('never talks about other levels: the goal, what to do, how it ends and what to know are about the level on the card', () => {
    const offenders: string[] = [];
    for (const g of GAMES) {
      for (const level of levelsOf(g)) {
        const card = howToFor(g, level)!;
        for (const line of [card.goal, ...card.steps, card.finish, card.note ?? '']) {
          if (OTHER_LEVELS.test(line)) offenders.push(`${g.id} level ${level}: ${line}`);
        }
      }
    }
    expect([...new Set(offenders)]).toEqual([]);
  });

  it('only scopes a line to levels the game has, from no later than to', () => {
    for (const g of GAMES) {
      const levels = levelsOf(g);
      const [first, last] = [levels[0], levels[levels.length - 1]];
      const h = HOW_TO[g.id];
      const lines = [...h.steps, h.finish, h.note ?? ''].flatMap((l) => (typeof l === 'string' ? [] : Array.isArray(l) ? l : [l]));
      for (const l of lines as LevelLine[]) {
        expect(l.text.trim().length, `${g.id} line`).toBeGreaterThan(8);
        if (l.from !== undefined) expect(l.from, `${g.id} "${l.text}" from`).toBeGreaterThanOrEqual(first);
        if (l.to !== undefined) expect(l.to, `${g.id} "${l.text}" to`).toBeLessThanOrEqual(last);
        if (l.from !== undefined && l.to !== undefined) expect(l.from, `${g.id} "${l.text}"`).toBeLessThanOrEqual(l.to);
      }
    }
  });

  it('keeps the guarded ladders bounded so new levels inherit no instructions or finish claims', () => {
    for (const id of ['bubble-pop', 'animal-snack', 'clock-tower', 'block-tower', 'peekaboo-barn']) {
      const game = GAMES.find((g) => g.id === id)!;
      const last = Math.max(...levelsOf(game));
      expect(howToFor(game, last + 1)!.steps, id).toEqual([]);
      if (id === 'clock-tower' || id === 'block-tower' || id === 'peekaboo-barn') expect(howToFor(game, last + 1)!.finish).toBe('');
    }
    const snack = GAMES.find((g) => g.id === 'animal-snack')!;
    const finishes = [1, 2, 3, 4, 5].map((level) => howToFor(snack, level)!.finish);
    expect(finishes[0]).toContain('six snacks');
    expect(finishes[1]).toBe(finishes[0]);
    expect(finishes[2]).toContain('four food questions');
    expect(finishes[3]).toContain('all three animals');
    expect(finishes[4]).toContain('three animals receive the requested count');
    expect(howToFor(snack, 6)!.finish).toBe('');
  });

  it('explains Beat Builder controls, finish gates and target counts for each current mode', () => {
    const game = GAMES.find((g) => g.id === 'beat-builder')!;
    const cards = [1, 2, 3, 4, 5].map((level) => howToFor(game, level)!);
    const steps = cards.map((card) => card.steps.join(' '));
    expect(steps[0]).toContain('at least three squares on');
    expect(steps[0]).toContain('return to the start twice after your last edit');
    expect(cards[0].finish).toContain('One composition');
    for (const i of [1, 3]) {
      expect(steps[i]).toContain('no green check');
      expect(steps[i]).not.toContain('Tap the green check');
      expect(steps[i]).not.toContain('note button');
      expect(cards[i].finish).toContain('automatically');
    }
    expect(cards[1].finish).toContain('three visible beats');
    expect(steps[3]).toContain('first four columns are fixed');
    expect(steps[3]).toContain('last four columns');
    expect(cards[3].finish).toContain('two repeating patterns');
    for (const i of [2, 4]) {
      expect(steps[i]).toContain('note button');
      expect(steps[i]).toContain('Tap the green check');
      expect(cards[i].finish).toContain('confirmed with the green check');
    }
    expect(cards[2].finish).toContain('three heard beats');
    expect(cards[4].finish).toContain('two heard beats');
    expect(steps[4]).toContain('bell below');
    expect(steps.slice(0, 4).join(' ')).not.toContain('bell');
    // Appended modes must supply their own instructions and completion claims.
    const mend = howToFor(game, 6)!;
    expect(mend.steps.join(' ')).toContain('one square wrong');
    expect(mend.steps.join(' ')).toContain('model');
    expect(mend.steps.join(' ')).toContain('green check');
    expect(mend.steps.join(' ')).not.toContain('first four columns');
    expect(mend.finish).toContain('three copies are mended');
    const revise = howToFor(game, 7)!;
    expect(revise.steps.join(' ')).toContain('drum row is locked');
    expect(revise.steps.join(' ')).toContain('clap button');
    expect(revise.steps.join(' ')).not.toContain('one square wrong');
    expect(revise.finish).toContain('two clap patterns');
    const parts = howToFor(game, 8)!;
    expect(parts.steps.join(' ')).toContain('circle part');
    expect(parts.steps.join(' ')).toContain('copy button');
    expect(parts.steps.join(' ')).toContain('nothing counts as a miss');
    expect(parts.finish).toContain('two-part piece');
    const back = howToFor(game, 9)!;
    expect(back.steps.join(' ')).toContain('three cards');
    expect(back.steps.join(' ')).toContain('circle, square, circle');
    expect(back.steps.join(' ')).toContain('one miss');
    expect(back.finish).toContain('comes back');
    expect(howToFor(game, 10)!.steps).toEqual([]);
    expect(howToFor(game, 10)!.finish).toBe('');
  });

  it('changes with the level where the game does: a step that only holds for some levels is not on every card', () => {
    const pop = GAMES.find((g) => g.id === 'bubble-pop')!;
    const bubble = [1, 4, 7, 10, 12, 13, 14].map((level) => howToFor(pop, level)!.steps[0]);
    expect(new Set(bubble).size).toBe(7);
    // Every step is bounded, so a level added above the ladder starts with no inherited step (it must write its own).
    expect(howToFor(pop, 15)!.steps).toEqual([expect.stringContaining('anywhere on the screen')]);
    expect(howToFor(pop, 16)!.steps).toEqual([]);
    expect(howToFor(pop, 15)!.note).toContain('No touch is wrong');
    expect(howToFor(pop, 14)!.note).toContain('wrong bubble');
    // The sign is mentioned only where there is one, and the new levels do not inherit the dots or the pairs.
    for (const level of [10, 11, 12, 13, 14]) expect(howToFor(pop, level)!.steps.join(' ')).toContain('sign at the top');
    for (const level of [12, 13, 14]) expect(howToFor(pop, level)!.steps.join(' ')).not.toMatch(/dots|hold|partner|make 5|make 10/);
    const stand = GAMES.find((g) => g.id === 'lemonade-stand')!;
    expect(howToFor(stand, 3)!.steps[0]).toContain('price in shells');
    expect(howToFor(stand, 2)!.steps[0]).not.toContain('price in shells');
    expect(howToFor(stand, 4)!.note).toContain('A lemon costs a shell');
    expect(howToFor(stand, 3)!.note).not.toContain('A lemon');
  });
});

describe('explaining a game every time it opens', () => {
  const base = { enabled: true, id: 'duck-pond', story: false, again: false };

  it('explains a game each time it is opened', () => {
    expect(shouldExplain(base)).toBe(true);
    expect(shouldExplain({ ...base, id: 'bubble-pop' })).toBe(true);
  });

  it('stays out of the way: off, a story request, "again" after a round, or a game with no card', () => {
    expect(shouldExplain({ ...base, enabled: false })).toBe(false);
    expect(shouldExplain({ ...base, story: true })).toBe(false);
    expect(shouldExplain({ ...base, again: true })).toBe(false);
    expect(shouldExplain({ ...base, id: 'no-such-game' })).toBe(false);
  });

  it('can explain every game on the island, so none is left without its card', () => {
    for (const g of GAMES) expect(shouldExplain({ ...base, id: g.id }), g.id).toBe(true);
  });
});

describe('the demonstration on a card', () => {
  it('is there for exactly the island games the couch can play, and for nothing else', () => {
    const withBot = GAMES.filter((g) => demoFor(g.id)).map((g) => g.id).sort();
    const couchOnIsland = Object.keys(COUCH_INFO).filter((id) => GAMES.some((g) => g.id === id)).sort();
    expect(withBot).toEqual(couchOnIsland);
    expect(withBot).toHaveLength(24);
    expect(demoFor('monster-munch')).toBeNull();
    expect(demoFor('no-such-game')).toBeNull();
  });

  it('plays a level the game has in the band the couch plays it in', () => {
    for (const g of GAMES) {
      const demo = demoFor(g.id);
      if (!demo) continue;
      expect(g.bands, `${g.id} band`).toContain(demo.band);
      const { min, max } = g.levels(demo.band);
      expect(demo.level, `${g.id} demo level`).toBeGreaterThanOrEqual(min);
      expect(demo.level, `${g.id} demo level`).toBeLessThanOrEqual(max);
    }
  });
});

describe('what the island card shows, by what she plays with', () => {
  const touch = GAMES.filter((g) => g.touchDemo);

  it('shows a pretend finger on a touch screen and a pretend mouse pointer on a desktop, for every game with a touch bot', () => {
    expect(touch.length).toBeGreaterThan(0);
    for (const g of touch) {
      expect(islandDemo(g, 3, 'toddler', 'touch')).toEqual({ input: 'finger', level: 3, band: 'toddler' });
      expect(islandDemo(g, 3, 'toddler', 'mouse')).toEqual({ input: 'mouse', level: 3, band: 'toddler' });
    }
  });

  it('plays her own level, so the window matches the "this level" line on the card, and never the couch\'s demo level', () => {
    for (const g of touch) {
      for (const band of g.bands) {
        const { min, max } = g.levels(band);
        for (let level = min; level <= max; level++) {
          const demo = islandDemo(g, level, band, 'touch');
          expect(demo, `${g.id} level ${level}`).toMatchObject({ level, band });
          expect(howToFor(g, level)?.level).toBe(g.describeLevel(demo!.level));
        }
      }
    }
  });

  it('keeps the controller demonstration for a couch game with no touch bot yet, and shows nothing for the rest', () => {
    for (const g of GAMES) {
      const demo = islandDemo(g, 1, 'toddler', 'touch');
      if (g.touchDemo) continue;
      if (demoFor(g.id)) expect(demo?.input, g.id).toBe('controller');
      else expect(demo, g.id).toBeNull();
    }
  });

  it('flags a game for the touch bot only if it is on the island (grown-up games have no touch card)', () => {
    for (const g of touch) expect(HOW_TO[g.id], g.id).toBeDefined();
  });
});
