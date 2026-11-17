import { describe, expect, it } from 'vitest';
import { GAMES } from '../games/registry';
import type { GameModule, OffScreenLines } from '../games/types';
import { BANDS, playBand, type Band } from '../progress/bands';
import { NO_NAME, offScreenFor } from './offscreen';
import { EVERY_BAND, UNDER_3, wordPattern } from './offscreen-rules';

const ALL_BANDS = BANDS.map((b) => b.id);
const SAMPLE_NAME = 'Mira';
const byId = (id: string) => {
  const g = GAMES.find((g) => g.id === id);
  if (!g) throw new Error(`no game ${id}`);
  return g;
};

/** Every (game, band) pair a profile can play, with the band the launch resolves to. */
const plays = GAMES.flatMap((g) => ALL_BANDS.map((band) => ({ g, band, at: playBand(g.bands, band) })));

describe('off-screen lines per band', () => {
  it('names no small loose object at lap or toddler', () => {
    const bad: string[] = [];
    for (const { g, band, at } of plays) {
      if (at !== 'lap' && at !== 'toddler') continue;
      const line = offScreenFor(g, band, SAMPLE_NAME);
      if (line === null) continue;
      for (const word of UNDER_3)
        if (wordPattern(word).test(line)) bad.push(`${g.id} at ${band}: "${word}" in "${line}"`);
    }
    expect(bad).toEqual([]);
  });

  it('never leaves a placeholder, a number of minutes, a daily duty, "must" or "buy" at any band', () => {
    const bad: string[] = [];
    for (const { g, band } of plays) {
      const line = offScreenFor(g, band, SAMPLE_NAME);
      if (line === null) continue;
      for (const re of EVERY_BAND) if (re.test(line)) bad.push(`${g.id} at ${band}: ${re} in "${line}"`);
    }
    expect(bad).toEqual([]);
  });

  it('keys only bands the game lists, with a non-empty all and short band entries', () => {
    const tabled = GAMES.filter(
      (g): g is GameModule & { offScreen: OffScreenLines } => typeof g.offScreen === 'object',
    );
    expect(tabled.length).toBeGreaterThanOrEqual(15);
    for (const g of tabled) {
      expect(g.offScreen.all.trim().length, `${g.id} all`).toBeGreaterThan(0);
      for (const [key, line] of Object.entries(g.offScreen)) {
        if (key === 'all') continue;
        expect(g.bands, `${g.id} keys ${key}`).toContain(key as Band);
        if (line !== null) {
          expect(typeof line, `${g.id} ${key}`).toBe('string');
          expect((line as string).trim().length, `${g.id} ${key} empty`).toBeGreaterThan(0);
          expect((line as string).length, `${g.id} ${key} length`).toBeLessThanOrEqual(140);
        }
      }
    }
  });

  it('withholds Garden Grow under 3 and keeps its line from preschool up', () => {
    const garden = byId('garden-grow');
    expect(offScreenFor(garden, 'lap', SAMPLE_NAME)).toBeNull();
    expect(offScreenFor(garden, 'toddler', SAMPLE_NAME)).toBeNull();
    expect(offScreenFor(garden, 'prek', SAMPLE_NAME)).toBe((garden.offScreen as OffScreenLines).all);
    expect(offScreenFor(garden, 'preschool', SAMPLE_NAME)).toBe((garden.offScreen as OffScreenLines).all);
  });

  it('puts her name into Weather Wardrobe and falls back without one', () => {
    const weather = byId('weather-wardrobe');
    expect(offScreenFor(weather, 'toddler', SAMPLE_NAME)).toContain(SAMPLE_NAME);
    expect(offScreenFor(weather, 'toddler', '  ')).toContain(NO_NAME);
    expect(offScreenFor(weather, 'toddler', '')).not.toContain('{name}');
  });

  it('resolves the band she plays at: school gets its own line or all, a missing band uses playBand', () => {
    const tower = byId('block-tower');
    expect(offScreenFor(tower, 'school', SAMPLE_NAME)).toBe((tower.offScreen as OffScreenLines).school);
    expect(offScreenFor(tower, 'prek', SAMPLE_NAME)).toBe((tower.offScreen as OffScreenLines).all);
    // A grown-up profile plays Block Tower at school (the highest band below), so it reads the school line.
    expect(offScreenFor(tower, 'grownup', SAMPLE_NAME)).toBe((tower.offScreen as OffScreenLines).school);
    // Scoop Shop has no school entry: a school child gets all.
    const scoop = byId('scoop-shop');
    expect(offScreenFor(scoop, 'school', SAMPLE_NAME)).toBe((scoop.offScreen as OffScreenLines).all);
    expect(offScreenFor(scoop, 'lap', SAMPLE_NAME)).not.toContain('pom-pom');
    // Story Steps starts at toddler: a lap profile plays it there and gets the toddler line.
    const story = byId('story-steps');
    expect(offScreenFor(story, 'lap', SAMPLE_NAME)).toBe((story.offScreen as OffScreenLines).toddler);
    // A plain string serves every band unchanged.
    const plain = GAMES.find((g) => typeof g.offScreen === 'string')!;
    for (const band of ALL_BANDS) expect(offScreenFor(plain, band, SAMPLE_NAME)).toBe(plain.offScreen);
  });

  it('gives each of the seven school lines only to school', () => {
    for (const id of [
      'block-tower',
      'bouncy-launch',
      'bounce-back',
      'mail-carrier',
      'puzzle-pals',
      'jelly-drums',
      'teddy-doctor',
    ]) {
      const g = byId(id);
      const lines = g.offScreen as OffScreenLines;
      expect(typeof lines.school, id).toBe('string');
      expect(Object.keys(lines).sort(), id).toEqual(['all', 'school']);
      expect(offScreenFor(g, 'prek', SAMPLE_NAME), id).toBe(lines.all);
    }
  });
});
