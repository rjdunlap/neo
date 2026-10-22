import { describe, expect, it } from 'vitest';
import { landing, levelsInOrder } from '../progress/difficulty';
import { nextLevel, stepLevel } from '../progress/difficulty';
import { BANDS, playBand } from '../progress/bands';
import { SCRIPT } from '../content/voice-script';
import { courseInfo } from '../couch/courses';
import { couchGameById, GAMES, gameById, playsByTouch } from './registry';
import { FIRST_COURSE } from '../couch/courses';
import { isSilent, silenced, STYLES } from '../audio/music';
import { PLACES } from '../content/places';
import { REGION_IDS } from '../content/world';

describe('game registry', () => {
  it('extends Roundup only to pre-K 12 and preserves existing levels and pins', () => {
    const g = gameById('roundup')!;
    expect(g.levels('prek')).toEqual({ min: 3, max: 12, order: [3, 4, 5, 6, 7, 8, 9, 12] });
    expect(stepLevel(6, 1, g.levels('prek'))).toBe(7);
    expect(stepLevel(7, 1, g.levels('prek'))).toBe(8);
    expect(stepLevel(8, 1, g.levels('prek'))).toBe(9);
    expect(stepLevel(9, 1, g.levels('prek'))).toBe(12);
    for (const level of [3, 4, 5, 6, 7, 8, 9, 12]) expect(landing(level, g.levels('prek'), g.entryLevels)).toBe(level);
    expect(g.levels('preschool')).toEqual({ min: 2, max: 5 });
    expect(levelsInOrder(g.levels('lap'))).toEqual([1, 11]);
    expect(levelsInOrder(g.levels('toddler'))).toEqual([1, 11, 10, 2, 3]);
  });

  it('appends Photo Safari two clues only to school, keeping earlier levels and pins', () => {
    const g = gameById('photo-safari')!;
    expect(g.levels('school')).toEqual({ min: 4, max: 7 });
    expect(g.levels('prek')).toEqual({ min: 3, max: 5 });
    expect(g.levels('preschool')).toEqual({ min: 2, max: 4 });
    for (const band of ['lap', 'toddler'] as const) expect(g.levels(band)).toEqual({ min: 1, max: 2 });
    for (const band of g.bands) for (const level of levelsInOrder(g.levels(band)).filter((l) => l <= 6)) expect(landing(level, g.levels(band))).toBe(level);
    expect(stepLevel(7, 1, g.levels('school'))).toBe(7);
  });

  it('adds Planet Hop at the end of school and Between two flights after 6, without moving existing Launch pins', () => {
    const g = gameById('bouncy-launch')!;
    expect(g.bands).toEqual(['lap', 'toddler', 'preschool', 'prek', 'school']);
    expect(g.levels('school')).toEqual({ min: 4, max: 12, order: [4, 5, 7, 6, 9, 12] });
    expect(g.levels('prek')).toEqual({ min: 3, max: 7, order: [3, 4, 7, 5] });
    expect(g.levels('lap')).toEqual({ min: 1, max: 1 });
    expect(g.levels('toddler')).toEqual({ min: 1, max: 3 });
    expect(g.levels('preschool')).toEqual({ min: 2, max: 4 });
    for (const level of [4, 5, 7, 6, 9]) expect(landing(level, g.levels('school'))).toBe(level);
    expect(stepLevel(6, 1, g.levels('school'))).toBe(9);
    expect(stepLevel(9, 1, g.levels('school'))).toBe(12);
    expect(stepLevel(12, 1, g.levels('school'))).toBe(12);
  });

  it('Chain Reaction adds tap-to-turn before prediction without changing existing IDs or school pins', () => {
    const g = GAMES.find((g) => g.id === 'chain-reaction')!;
    expect(g.bands).toEqual(['prek', 'school']);
    expect(g.entryLevels).toEqual([7, 8]);
    const prek = g.levels('prek'), school = g.levels('school');
    expect(prek.order).toEqual([7, 8, 1, 2, 3]);
    // Level 9 Two marbles tops the school ladder through `order`, so school never steps into the pre-K entries 7 and 8.
    expect(school).toEqual({ min: 3, max: 9, order: [3, 4, 5, 6, 9] });
    expect(nextLevel(6, [{ level: 6, misses: 0, hints: 0 }, { level: 6, misses: 0, hints: 0 }] as never, school)).toBe(9);
    expect(nextLevel(0, [], prek)).toBe(7);
    expect(landing(7, school, g.entryLevels)).toBe(3);
    expect(landing(8, school, g.entryLevels)).toBe(3);
    for (const level of [1, 2, 3, 4, 5, 6, 8]) {
      const range = level <= 3 || level === 8 ? prek : school;
      expect(landing(level, range, g.entryLevels)).toBe(level);
    }
  });

  it('places Color Garden tap entry first without renumbering existing levels or pins', () => {
    const g = GAMES.find(g => g.id === 'color-garden')!;
    expect(g.bands).toContain('lap');
    expect(g.entryLevels).toEqual([9]);
    expect(g.levels('lap').order).toEqual([9]);
    const toddler = g.levels('toddler');
    expect(toddler.order).toEqual([9, 1, 2, 3, 4, 5]);
    expect(nextLevel(9, [0, 1].map(() => ({ at: 0, level: 9, misses: 0, hints: 0, seconds: 1 })), toddler)).toBe(1);
    for (const level of [1, 2, 3, 4, 5]) expect(nextLevel(landing(level, toddler, g.entryLevels), [], toddler)).toBe(level);
    expect(landing(9, g.levels('preschool'), g.entryLevels)).toBe(3);
    expect(g.levels('preschool')).toEqual({ min: 3, max: 8 });
    expect(g.levels('prek')).toEqual({ min: 4, max: 8 });
  });

  it('places Critter Crossing visible not between 1 and 2 while preserving school and saved IDs', () => {
    const g = gameById('critter-crossing')!;
    const prek = g.levels('prek'), school = g.levels('school');
    expect(g.bands).toEqual(['prek', 'school']);
    expect(levelsInOrder(prek)).toEqual([1, 8, 2, 3]);
    expect(levelsInOrder(school)).toEqual([2, 3, 4, 5, 6, 7]);
    expect(g.entryLevels).toEqual([8]);
    expect(stepLevel(1, 1, prek)).toBe(8);
    expect(stepLevel(8, 1, prek)).toBe(2);
    expect(stepLevel(2, -1, prek)).toBe(8);
    expect(landing(8, school, g.entryLevels)).toBe(2);
    for (const l of [1, 2, 3]) expect(nextLevel(l, [], prek)).toBe(l);
    for (const l of [2, 3, 4, 5, 6, 7]) expect(nextLevel(l, [], school)).toBe(l);
  });

  it('has unique ids and a spoken title for every game', () => {
    expect(new Set(GAMES.map((g) => g.id)).size).toBe(GAMES.length);
    for (const g of GAMES) expect(SCRIPT[g.titleLine]).toBeDefined();
  });

  it('gives every band a sensible level range, and describes every level in it', () => {
    for (const g of GAMES) {
      for (const band of g.bands) {
        const { min, max } = g.levels(band);
        expect(min, `${g.id} ${band}`).toBeGreaterThanOrEqual(1);
        expect(max, `${g.id} ${band}`).toBeGreaterThanOrEqual(min);
        const order = g.levels(band).order;
        if (order) {
          expect(new Set(order).size, `${g.id} ${band} order has no repeats`).toBe(order.length);
          expect(Math.min(...order), `${g.id} ${band} order starts at min`).toBe(min);
          expect(Math.max(...order), `${g.id} ${band} order ends at max`).toBe(max);
        }
        for (const l of levelsInOrder(g.levels(band))) expect(g.describeLevel(l).length, `${g.id} level ${l}`).toBeGreaterThan(3);
      }
    }
  });

  it('names every entry level (an easy level a band places before its level IDs) so a band without it starts at its own easiest', () => {
    for (const g of GAMES) {
      const entries = g.entryLevels ?? [];
      for (const band of g.bands) {
        const range = g.levels(band);
        const first = levelsInOrder(range)[0];
        if (first !== range.min) expect(entries, `${g.id} ${band}: ${first} is placed first but is not an entry level`).toContain(first);
      }
      for (const entry of entries) {
        expect(g.bands.some((band) => levelsInOrder(g.levels(band)).includes(entry)), `${g.id}: some band includes entry ${entry}`).toBe(true);
        for (const band of g.bands) {
          const range = g.levels(band);
          const lands = landing(entry, range, entries);
          expect(levelsInOrder(range), `${g.id} ${band}`).toContain(lands);
          if (!levelsInOrder(range).includes(entry)) expect(lands, `${g.id} ${band} starts at its easiest`).toBe(levelsInOrder(range)[0]);
        }
      }
    }
  });

  it('places Day by Day’s supplied-record bridge before 3, preserving IDs and birthday/pin landing', () => {
    const g = gameById('day-by-day')!;
    const school = g.levels('school'), prek = g.levels('prek');
    expect(levelsInOrder(school)).toEqual([2, 4, 10, 3, 5, 6]);
    expect(levelsInOrder(prek)).toEqual([1, 2, 4]);
    expect(g.entryLevels).toEqual([10]);
    expect(stepLevel(4, 1, school)).toBe(10);
    expect(stepLevel(10, 1, school)).toBe(3);
    expect(stepLevel(3, -1, school)).toBe(10);
    expect(stepLevel(3, 1, school)).toBe(5);
    expect(stepLevel(5, -1, school)).toBe(3);
    expect(stepLevel(5, 1, school)).toBe(6);
    expect(stepLevel(6, -1, school)).toBe(5);
    for (const level of [2, 3, 4, 5, 6, 10]) expect(nextLevel(landing(level, school, g.entryLevels), [], school)).toBe(level);
    expect(landing(10, prek, g.entryLevels)).toBe(1);
    expect(landing(4, school, g.entryLevels)).toBe(4); // birthday from pre-K
  });

  it('keeps two unjudged creative modes available for lap co-play', () => {
    for (const id of ['rainbow-fingers', 'fluffy-salon', 'stamp-studio', 'rhythm-neighbors']) {
      const lap = GAMES.find(g => g.id === id)!.levels('lap');
      expect(id === 'stamp-studio' ? levelsInOrder(lap) : lap).toEqual(id === 'stamp-studio' ? [7, 1, 2] : { min: 1, max: 2 });
    }
  });

  it('opens Goodnight Room category, light-last, counting, color, exception and tour play without renumbering younger levels', () => {
    const game = gameById('goodnight-room')!;
    expect(game.levels('lap')).toEqual({ min: 1, max: 2 });
    expect(game.levels('toddler')).toEqual({ min: 2, max: 4 });
    expect(game.levels('preschool')).toEqual({ min: 3, max: 5 });
    expect(game.levels('prek')).toEqual({ min: 5, max: 10 });
  });

  it('opens only Robot Path’s small step boards to preschool and preserves older ranges', () => {
    const game = gameById('robot-path')!;
    expect(game.bands).toEqual(['preschool', 'prek', 'school']);
    const range = game.levels('preschool');
    expect(range).toEqual({ min: 1, max: 2 });
    expect(game.levels('prek')).toEqual({ min: 1, max: 6 });
    expect(game.levels('school')).toEqual({ min: 4, max: 13 });
    expect(playBand(game.bands, 'preschool')).toBe('preschool');
    expect(stepLevel(2, 1, range)).toBe(2);
    expect(nextLevel(2, [
      { level: 2, misses: 0, hints: 0, seconds: 10, at: 1 },
      { level: 2, misses: 0, hints: 0, seconds: 10, at: 2 },
    ], range)).toBe(2);
  });

  it('has something for every age band', () => {
    for (const b of BANDS) expect(GAMES.filter((g) => g.bands.includes(b.id)).length, b.id).toBeGreaterThanOrEqual(3);
  });

  it('gives every age place (each band\'s home spot on the map) a spoken name', () => {
    expect(PLACES.map((p) => p.band)).toEqual(BANDS.map((b) => b.id));
    for (const place of PLACES) expect(SCRIPT[place.line], place.band).toBeDefined();
  });

  it('files every game under a known subject, and every subject has a game by pre-K', () => {
    for (const game of GAMES) expect(REGION_IDS).toContain(game.region);
    for (const id of REGION_IDS) expect(GAMES.some((g) => g.region === id && g.bands.includes('prek')), id).toBe(true);
  });

  it('lists the grown-up games as island games for the grown-up band only, and opens any controller-only one through the couch', () => {
    const ids = ['marble-jump', 'log-roll', 'snowball-merge', 'brain-break', 'pyramid-solitaire', 'number-nook', 'gem-swap', 'tile-pairs', 'lantern-lights', 'sudoku-garden', 'picture-logic', 'word-search', 'island-bridges', 'pond-conga'];
    for (const id of ids) {
      const g = gameById(id)!;
      expect(g, id).toBeDefined();
      expect(g.bands, id).toEqual(['grownup']);
      expect(SCRIPT[g.titleLine], id).toBeDefined();
      expect(REGION_IDS).toContain(g.region);
      const { min, max } = g.levels('grownup');
      for (let l = min; l <= max; l++) expect(g.describeLevel(l).length, `${id} level ${l}`).toBeGreaterThan(3);
      // Couch play finds them in the same list.
      expect(couchGameById(id), id).toBe(g);
      // A game that takes only a controller has a couch course for the island to open; one that takes touch plays in the island's scene.
      if (!playsByTouch(g)) expect(courseInfo(FIRST_COURSE[id]).game, id).toBe(id);
    }
    expect(new Set(GAMES.map((g) => g.id)).size).toBe(GAMES.length);
    expect(couchGameById('penguin-slide')).toBe(gameById('penguin-slide'));
    expect(couchGameById('nope')).toBeUndefined();
    // Every island game takes touch (Pond Conga was the last that took only a controller; the route to a couch course stays for the next).
    for (const g of GAMES) expect(playsByTouch(g), g.id).toBe(true);
  });

  it('plays no background music in a game where she makes the music', () => {
    // Her own sounds are the music; the island's loop would compete with them.
    const makingMusic = ['beat-builder', 'clap-syllables', 'jelly-drums', 'little-conductor', 'pet-says', 'rhythm-neighbors', 'sing-along-barn', 'song-maker', 'sound-garden'];
    for (const id of makingMusic) {
      const game = gameById(id)!;
      expect(game, id).toBeDefined();
      expect(isSilent(game.music), id).toBe(true);
    }
    // Not stopped: Song Maker's playhead and Jelly Drums' jellies keep time from the playing style.
    for (const id of ['jelly-drums', 'song-maker']) expect(gameById(id)!.music.bpm, id).toBe(STYLES.jelly.bpm);
  });

  it('keeps the island\'s music for the games where the music is only a setting', () => {
    expect(GAMES.filter((g) => !isSilent(g.music)).length).toBeGreaterThan(GAMES.length / 2);
    expect(isSilent(STYLES.hub)).toBe(false);
  });

  it('silences a style but keeps its tempo and seed', () => {
    const quiet = silenced(STYLES.lullaby);
    expect(isSilent(quiet)).toBe(true);
    expect(quiet.bpm).toBe(STYLES.lullaby.bpm);
    expect(quiet.seed).toBe(STYLES.lullaby.seed);
    expect([quiet.lead, quiet.bass, quiet.pad, quiet.shaker]).toEqual(['none', false, false, false]);
    expect(STYLES.lullaby.volume).toBeGreaterThan(0.1);
  });
});
