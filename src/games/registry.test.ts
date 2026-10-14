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
        expect(g.bands.some((band) => levelsInOrder(g.levels(band))[0] === entry), `${g.id}: some band starts at entry ${entry}`).toBe(true);
        for (const band of g.bands) {
          const range = g.levels(band);
          const lands = landing(entry, range, entries);
          expect(levelsInOrder(range), `${g.id} ${band}`).toContain(lands);
          if (!levelsInOrder(range).includes(entry)) expect(lands, `${g.id} ${band} starts at its easiest`).toBe(levelsInOrder(range)[0]);
        }
      }
    }
  });

  it('keeps two unjudged creative modes available for lap co-play', () => {
    for (const id of ['rainbow-fingers', 'fluffy-salon', 'stamp-studio', 'rhythm-neighbors']) {
      expect(GAMES.find(g => g.id === id)!.levels('lap')).toEqual({ min: 1, max: 2 });
    }
  });

  it('opens Goodnight Room category, light-last, counting, color and exception play without renumbering younger levels', () => {
    const game = gameById('goodnight-room')!;
    expect(game.levels('lap')).toEqual({ min: 1, max: 2 });
    expect(game.levels('toddler')).toEqual({ min: 2, max: 4 });
    expect(game.levels('preschool')).toEqual({ min: 3, max: 5 });
    expect(game.levels('prek')).toEqual({ min: 5, max: 9 });
  });

  it('opens only Robot Path’s small step boards to preschool and preserves older ranges', () => {
    const game = gameById('robot-path')!;
    expect(game.bands).toEqual(['preschool', 'prek', 'school']);
    const range = game.levels('preschool');
    expect(range).toEqual({ min: 1, max: 2 });
    expect(game.levels('prek')).toEqual({ min: 1, max: 6 });
    expect(game.levels('school')).toEqual({ min: 4, max: 12 });
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
    const ids = ['pyramid-solitaire', 'number-nook', 'gem-swap', 'tile-pairs', 'lantern-lights', 'sudoku-garden', 'picture-logic', 'word-search', 'island-bridges', 'pond-conga'];
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
    const makingMusic = ['beat-builder', 'clap-syllables', 'jelly-drums', 'pet-says', 'rhythm-neighbors', 'sing-along-barn', 'song-maker', 'sound-garden'];
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
