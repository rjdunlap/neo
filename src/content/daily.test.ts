import { describe, expect, it } from 'vitest';
import { GAMES, playsByTouch } from '../games/registry';
import { BANDS } from '../progress/bands';
import { levelsInOrder } from '../progress/difficulty';
import {
  DAILY_COUNT,
  GROWNUP_FIRST,
  dailyPool,
  dailySix,
  dayKey,
  hardLevels,
  levelDots,
  presetLevels,
  playedOn,
} from './daily';

/** How many times each value appears. */
const countBy = (xs: readonly string[]) =>
  xs.reduce((m, x) => m.set(x, (m.get(x) ?? 0) + 1), new Map<string, number>());

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
        const a = dailySix(days[i - 1], band, GAMES)
          .map((p) => p.mod.id)
          .sort();
        const b = dailySix(days[i], band, GAMES)
          .map((p) => p.mod.id)
          .sort();
        expect(b).not.toEqual(a);
      }
    }
  });

  it('gives every band six or more games in at least five kinds of challenge', () => {
    for (const { id: band } of BANDS) {
      const pool = dailyPool(band, GAMES);
      expect(pool.length, band).toBeGreaterThanOrEqual(DAILY_COUNT);
      expect(new Set(pool.map((m) => m.challenge)).size, band).toBeGreaterThanOrEqual(5);
    }
  });

  it('mixes kinds of challenge first: six different kinds where the band has six, then lands', () => {
    for (const { id: band } of BANDS) {
      const pool = dailyPool(band, GAMES);
      const kinds = new Set(pool.map((m) => m.challenge)).size;
      const lands = new Set(pool.map((m) => m.region)).size;
      for (const day of days) {
        const six = dailySix(day, band, GAMES);
        const perKind = countBy(six.map((p) => p.mod.challenge ?? ''));
        if (kinds >= DAILY_COUNT) expect(perKind.size, `${band} ${day}`).toBe(DAILY_COUNT);
        else expect(Math.max(...perKind.values())).toBeLessThanOrEqual(2);
        // Lands come second: kept apart while the kinds allow, never one land three times.
        expect(new Set(six.map((p) => p.mod.region)).size, `${band} ${day}`).toBeGreaterThanOrEqual(
          Math.min(5, lands),
        );
        expect(Math.max(...countBy(six.map((p) => p.mod.region)).values())).toBeLessThanOrEqual(2);
      }
    }
  });

  it('starts the kinds again only once each kind has had a turn, so a band with fewer kinds has at most two of one', () => {
    // A pool of three kinds: two rounds of kinds fill the six, two of each.
    const three = dailyPool('prek', GAMES).filter(
      (m) => m.challenge === 'numbers' || m.challenge === 'words' || m.challenge === 'music',
    );
    for (const day of days) {
      const six = dailySix(day, 'prek', three);
      expect([...countBy(six.map((p) => p.mod.challenge ?? '')).values()]).toEqual([2, 2, 2]);
      expect(new Set(six.slice(0, 3).map((p) => p.mod.challenge)).size).toBe(3);
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
          if (presetLevels(p.mod, p.band).some((l) => !(p.mod.entryLevels ?? []).includes(l)))
            expect(p.mod.entryLevels ?? []).not.toContain(p.level);
          const dots = levelDots(p);
          expect(dots.at).toBeGreaterThanOrEqual(1);
          expect(dots.at).toBeLessThanOrEqual(dots.of);
        }
      }
    }
  });

  it('varies the preset level across days', () => {
    const levels = new Set<string>();
    for (const day of days)
      for (const p of dailySix(day, 'prek', GAMES)) levels.add(`${p.mod.id}:${p.level}`);
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

  it('takes only games that list the band (grown-ups: grown-up or early school), never an opted-out one', () => {
    for (const { id: band } of BANDS) {
      for (const m of dailyPool(band, GAMES)) {
        expect(m.daily, m.id).not.toBe(false);
        expect(playsByTouch(m)).toBe(true);
        expect(
          band === 'grownup'
            ? m.bands.includes('grownup') || m.bands.includes('school')
            : m.bands.includes(band),
          `${m.id} at ${band}`,
        ).toBe(true);
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

describe("today's six on a phone held upright (chunk 31)", () => {
  /** The catalog with exactly `ids` marked upright-ready, so the test does not depend on how many games are converted yet. */
  const withReady = (ids: readonly string[]) =>
    GAMES.map((m) => ({ ...m, upright: ids.includes(m.id) ? (true as const) : undefined }));
  const ids = (picks: ReturnType<typeof dailySix>) => picks.map((p) => p.mod.id);

  it('is exactly the usual six when the phone is not upright', () => {
    for (const { id: band } of BANDS)
      for (const day of days.slice(0, 5))
        expect(ids(dailySix(day, band, GAMES, undefined, false)), `${band} ${day}`).toEqual(
          ids(dailySix(day, band, GAMES)),
        );
  });

  it('draws upright-ready games first, then fills from the rest of the band', () => {
    const ready = [
      'word-search',
      'sudoku-garden',
      'island-bridges',
      'pond-conga',
      'brain-break',
      'number-nook',
    ];
    const games = withReady(ready);
    for (const day of days) {
      const six = ids(dailySix(day, 'grownup', games, undefined, true));
      expect(six, day).toHaveLength(DAILY_COUNT);
      expect([...six].sort(), day).toEqual([...ready].sort());
    }
    // Two ready games: both are in the six, which is still six.
    for (const day of days) {
      const six = ids(dailySix(day, 'grownup', withReady(['word-search', 'number-nook']), undefined, true));
      expect(six.slice(0, 2).sort(), day).toEqual(['number-nook', 'word-search']);
      expect(new Set(six).size, day).toBe(DAILY_COUNT);
    }
  });

  it("still leads a grown-up's six with games made for grown-ups when none is ready", () => {
    for (const day of days) {
      const six = dailySix(day, 'grownup', GAMES, undefined, true);
      expect(
        six.slice(0, GROWNUP_FIRST).every((p) => p.mod.bands.includes('grownup')),
        day,
      ).toBe(true);
      expect(six, day).toHaveLength(DAILY_COUNT);
    }
  });
});
