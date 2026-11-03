import { describe, expect, it } from 'vitest';
import { GAMES, playsByTouch } from '../games/registry';
import { BANDS } from '../progress/bands';
import { levelsInOrder } from '../progress/difficulty';
import { DAILY_COUNT, GROWNUP_FIRST, dailyPool, dailySix, dayKey, hardLevels, levelDots, presetLevels, playedOn } from './daily';

const days = Array.from({ length: 30 }, (_, i) => dayKey(new Date(2026, 9, 1 + i)));

describe("today's six", () => {
  it('uses the local calendar day', () => {
    expect(dayKey(new Date(2026, 0, 5, 23, 59))).toBe('2026-01-05');
    expect(dayKey(new Date(2026, 11, 31, 0, 1))).toBe('2026-12-31');
  });

  for (const { id: band } of BANDS) {
    it(`gives six different touch games a ${band} can play, the same all day`, () => {
      for (const day of days) {
        const six = dailySix(day, band, GAMES);
        expect(six).toHaveLength(DAILY_COUNT);
        expect(new Set(six.map((p) => p.mod.id)).size).toBe(DAILY_COUNT);
        for (const p of six) {
          expect(playsByTouch(p.mod)).toBe(true);
          expect(p.mod.bands).toContain(p.band);
        }
        expect(dailySix(day, band, GAMES).map((p) => p.mod.id)).toEqual(six.map((p) => p.mod.id));
      }
    });
  }

  it('changes from one day to the next', () => {
    for (const { id: band } of BANDS) {
      for (let i = 1; i < days.length; i++) {
        const a = dailySix(days[i - 1], band, GAMES).map((p) => p.mod.id).sort();
        const b = dailySix(days[i], band, GAMES).map((p) => p.mod.id).sort();
        expect(b).not.toEqual(a);
      }
    }
  });

  it('spreads the six across subjects', () => {
    for (const { id: band } of BANDS) {
      const subjects = new Set(dailyPool(band, GAMES).map((m) => m.region)).size;
      for (const day of days) {
        const regions = new Set(dailySix(day, band, GAMES).map((p) => p.mod.region)).size;
        expect(regions).toBe(Math.min(DAILY_COUNT, subjects));
      }
    }
  });

  it("plays a grown-up's games at the harder end of the ladder, inside the range", () => {
    for (const day of days) {
      for (const p of dailySix(day, 'grownup', GAMES)) {
        expect(p.level).toBeDefined();
        const order = levelsInOrder(p.mod.levels(p.band));
        expect(order).toContain(p.level);
        expect(hardLevels(p.mod, p.band)).toContain(p.level);
        expect(p.mod.entryLevels ?? []).not.toContain(p.level);
      }
    }
  });

  it("leads a grown-up's six with games made for grown-ups", () => {
    for (const day of days) {
      const six = dailySix(day, 'grownup', GAMES);
      expect(six.filter((p) => p.mod.bands.includes('grownup')).length).toBeGreaterThanOrEqual(GROWNUP_FIRST);
    }
  });

  it('gives every band a preset level from its own ladder, an entry level only where the ladder has nothing else', () => {
    for (const { id: band } of BANDS) {
      for (const day of days) {
        for (const p of dailySix(day, band, GAMES)) {
          expect(levelsInOrder(p.mod.levels(p.band)), `${p.mod.id} at ${band}`).toContain(p.level);
          expect(presetLevels(p.mod, p.band)).toContain(p.level);
          // An entry level only where the band's whole ladder is entry levels.
          if (presetLevels(p.mod, p.band).some((l) => !(p.mod.entryLevels ?? []).includes(l))) expect(p.mod.entryLevels ?? []).not.toContain(p.level);
          const dots = levelDots(p);
          expect(dots.at).toBeGreaterThanOrEqual(1);
          expect(dots.at).toBeLessThanOrEqual(dots.of);
        }
      }
    }
  });

  it('varies the preset level across days', () => {
    const levels = new Set<string>();
    for (const day of days) for (const p of dailySix(day, 'prek', GAMES)) levels.add(`${p.mod.id}:${p.level}`);
    const ids = new Set([...levels].map((k) => k.split(':')[0]));
    expect(levels.size).toBeGreaterThan(ids.size);
  });

  it("plays a grown-up's pin instead of the preset when the pin is on the ladder, and leaves the other cards alone", () => {
    for (const { id: band } of BANDS) {
      const plain = dailySix(days[0], band, GAMES);
      const target = plain[0];
      const order = levelsInOrder(target.mod.levels(target.band));
      const pin = order[order.length - 1] === target.level ? order[0] : order[order.length - 1];
      const pinned = dailySix(days[0], band, GAMES, (id) => (id === target.mod.id ? pin : null));
      expect(pinned.map((p) => p.mod.id)).toEqual(plain.map((p) => p.mod.id));
      expect(pinned[0].level).toBe(pin);
      expect(pinned.slice(1).map((p) => p.level)).toEqual(plain.slice(1).map((p) => p.level));
      // A pin off this band's ladder (another band's level) is ignored.
      const off = dailySix(days[0], band, GAMES, (id) => (id === target.mod.id ? 9999 : null));
      expect(off[0].level).toBe(target.level);
    }
  });

  it('takes only games that list the band (grown-ups: grown-up or early school), never an opted-out one, six or more per band', () => {
    for (const { id: band } of BANDS) {
      const pool = dailyPool(band, GAMES);
      expect(pool.length, band).toBeGreaterThanOrEqual(DAILY_COUNT);
      for (const m of pool) {
        expect(m.daily, m.id).not.toBe(false);
        expect(playsByTouch(m)).toBe(true);
        expect(band === 'grownup' ? m.bands.includes('grownup') || m.bands.includes('school') : m.bands.includes(band), `${m.id} at ${band}`).toBe(true);
      }
    }
    expect(dailyPool('prek', GAMES).map((m) => m.id)).not.toContain('goodnight-room');
  });

  it('ticks a game played earlier the same day, not the day before', () => {
    const at = (d: Date) => ({ level: 1, misses: 0, hints: 0, seconds: 30, at: d.getTime() });
    expect(playedOn([at(new Date(2026, 9, 31, 8))], '2026-10-31')).toBe(true);
    expect(playedOn([at(new Date(2026, 9, 30, 23))], '2026-10-31')).toBe(false);
    expect(playedOn(undefined, '2026-10-31')).toBe(false);
  });
});
