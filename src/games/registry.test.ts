import { describe, expect, it } from 'vitest';
import { BANDS } from '../progress/bands';
import { SCRIPT } from '../content/voice-script';
import { GAMES } from './registry';

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
});
