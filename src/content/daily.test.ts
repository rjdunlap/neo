import { describe, expect, it } from 'vitest';
import { GAMES, playsByTouch } from '../games/registry';
import { BANDS } from '../progress/bands';
import { levelsInOrder } from '../progress/difficulty';
import { DAILY_COUNT, GROWNUP_FIRST, dailyPool, dailySix, dayKey, hardLevels, playedOn } from './daily';

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

  it('leaves a child on her saved level', () => {
    for (const day of days) for (const p of dailySix(day, 'prek', GAMES)) expect(p.level).toBeUndefined();
  });

  it('ticks a game played earlier the same day, not the day before', () => {
    const at = (d: Date) => ({ level: 1, misses: 0, hints: 0, seconds: 30, at: d.getTime() });
    expect(playedOn([at(new Date(2026, 9, 31, 8))], '2026-10-31')).toBe(true);
    expect(playedOn([at(new Date(2026, 9, 30, 23))], '2026-10-31')).toBe(false);
    expect(playedOn(undefined, '2026-10-31')).toBe(false);
  });
});
