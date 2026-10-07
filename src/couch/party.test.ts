import { describe, expect, it } from 'vitest';
import { COUCH_IDS, completeRound, couchDefaults, levelFor, offers, repairCouch, roundToken, seedFor } from './party';
import { gameById } from '../games/registry';

describe('isolated couch trips', () => {
  it('preserves offers, puzzle seed and progress through JSON reload; awards once per stop', () => {
    let save = couchDefaults();
    save.party = { seed: 239, rounds: [], selected: null };
    for (let stop = 0; stop < 6; stop++) {
      const choices = offers(save.party!);
      expect(new Set(choices)).toEqual(new Set(COUCH_IDS));
      save.party!.selected = choices[stop % 3];
      const seed = seedFor(save.party!), token = roundToken(save.party!);
      save = repairCouch(JSON.parse(JSON.stringify(save)));
      expect(offers(save.party!)).toEqual(choices);
      expect(seedFor(save.party!)).toBe(seed);
      expect(completeRound(save, token, { misses: 8, hints: 2 })).toBe(true);
      expect(completeRound(save, token, { misses: 0, hints: 0 })).toBe(false);
      expect(save.party!.rounds).toHaveLength(stop + 1);
    }
    expect(save.trips).toBe(1);
    expect(Object.values(save.stickers).reduce((n, v) => n + v!.count, 0)).toBe(6);
    expect(repairCouch(JSON.parse(JSON.stringify(save)))).toEqual(save);
  });

  it('cannot settle an abandoned selection and only schedules supported game levels', () => {
    const save = couchDefaults(); save.party = { seed: 1, rounds: [], selected: 'penguin-slide' };
    const token = roundToken(save.party); save.party.selected = 'bounce-back';
    expect(completeRound(save, token, { misses: 0, hints: 0 })).toBe(false);
    for (const id of COUCH_IDS) for (let stop = 0; stop < 6; stop++) {
      const mod = gameById(id)!, level = levelFor(id, stop);
      expect(mod.bands.some(b => level >= mod.levels(b).min && level <= mod.levels(b).max)).toBe(true);
    }
  });

  it('repairs malformed data without importing a child save, and bounds history without losing sticker counts', () => {
    expect(repairCouch({ version: 2, stickers: [], profile: { name: 'child' } })).toEqual(couchDefaults());
    const out = repairCouch({ version: 1, trips: -5, party: { seed: 8, selected: 'other', rounds: Array(100).fill({ id: 'penguin-slide', misses: -4, hints: NaN, seed: 7, level: 999 }) }, stickers: { 'penguin-slide': { count: 500, seed: 3 }, other: { count: 5 } } });
    expect(out.party!.rounds).toHaveLength(6);
    expect(out.party!.selected).toBe(null);
    expect(out.party!.rounds.every(r => r.misses === 0 && r.hints === 0 && r.level <= 5)).toBe(true);
    expect(out.stickers).toEqual({ 'penguin-slide': { count: 500, seed: 3 } });
  });
});
