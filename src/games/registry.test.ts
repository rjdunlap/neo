import { describe, expect, it } from 'vitest';
import { BANDS } from '../progress/bands';
import { SCRIPT } from '../content/voice-script';
import { GAMES } from './registry';
import { REGIONS } from '../content/regions';
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

  it('has something for every age band', () => {
    for (const b of BANDS) expect(GAMES.filter((g) => g.bands.includes(b.id)).length, b.id).toBeGreaterThanOrEqual(3);
  });

  it('defines all ten regions and gives every region a game by pre-K', () => {
    expect(REGIONS.map((r) => r.id).sort()).toEqual([...REGION_IDS].sort());
    for (const region of REGIONS) {
      expect(SCRIPT[region.line], region.id).toBeDefined();
      expect(region.x).toBeGreaterThanOrEqual(0);
      expect(region.x).toBeLessThanOrEqual(1);
      expect(region.y).toBeGreaterThanOrEqual(0);
      expect(region.y).toBeLessThanOrEqual(1);
      expect(GAMES.some((g) => g.region === region.id && g.bands.includes('prek')), region.id).toBe(true);
    }
    for (const game of GAMES) expect(REGION_IDS).toContain(game.region);
  });

  it('never closes an available region when moving to a later age band', () => {
    const opened = new Set<string>();
    for (const band of BANDS) {
      const available = new Set(GAMES.filter((g) => g.bands.includes(band.id)).map((g) => g.region));
      for (const id of opened) expect(available.has(id as (typeof REGION_IDS)[number]), `${id} at ${band.id}`).toBe(true);
      for (const id of available) opened.add(id);
    }
  });
});
