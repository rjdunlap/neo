import { describe, expect, it } from 'vitest';
import { BANDS } from '../progress/bands';
import { SCRIPT } from '../content/voice-script';
import { GAMES } from './registry';
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
        for (let l = min; l <= max; l++) expect(g.describeLevel(l).length, `${g.id} level ${l}`).toBeGreaterThan(3);
      }
    }
  });

  it('keeps two unjudged creative modes available for lap co-play', () => {
    for (const id of ['rainbow-fingers', 'fluffy-salon', 'stamp-studio', 'rhythm-neighbors']) {
      expect(GAMES.find(g => g.id === id)!.levels('lap')).toEqual({ min: 1, max: 2 });
    }
  });

  it('has something for every age band', () => {
    for (const b of BANDS) expect(GAMES.filter((g) => g.bands.includes(b.id)).length, b.id).toBeGreaterThanOrEqual(3);
  });

  it('gives every place on the age trail a spoken name and room for its games', () => {
    expect(PLACES.map((p) => p.band)).toEqual(BANDS.map((b) => b.id));
    for (const place of PLACES) {
      expect(SCRIPT[place.line], place.band).toBeDefined();
      expect(place.x >= 0 && place.x <= 1 && place.y >= 0 && place.y <= 1, place.band).toBe(true);
    }
    // Places climb the island: each one sits higher on the map than the last.
    PLACES.slice(1).forEach((p, i) => expect(p.y).toBeLessThan(PLACES[i].y));
  });

  it('files every game under a known subject, and every subject has a game by pre-K', () => {
    for (const game of GAMES) expect(REGION_IDS).toContain(game.region);
    for (const id of REGION_IDS) expect(GAMES.some((g) => g.region === id && g.bands.includes('prek')), id).toBe(true);
  });
});
