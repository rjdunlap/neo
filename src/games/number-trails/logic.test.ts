import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import { rangeFor } from '../../progress/difficulty';
import {
  LEVELS, MAX_THINGS, PLANS, SPARE, THINGS, THING_GAP, THING_HIT, groupSize, numeralFor, planFor, stickerDigit, tapOutcome, thingFor, thingSpots,
} from './logic';

describe('number trails levels', () => {
  it('describes every level and clamps the ones outside the ladder', () => {
    expect(PLANS.every((p) => p.name.length > 10)).toBe(true);
    expect(planFor(0)).toBe(PLANS[0]);
    expect(planFor(99)).toBe(PLANS[PLANS.length - 1]);
  });
  it('ends each band inside the ladder and opens pre-K at the bigger numbers', () => {
    expect(rangeFor(LEVELS, 'preschool')).toEqual({ min: 1, max: 2 });
    expect(rangeFor(LEVELS, 'prek')).toEqual({ min: 2, max: 3 });
    for (const band of ['preschool', 'prek'] as const) expect(rangeFor(LEVELS, band).max).toBeLessThanOrEqual(PLANS.length);
  });
  it('draws only 1 to 5 at level 1 and all of 0 to 9 above it', () => {
    const rng = new Rng(7);
    const first = new Set(Array.from({ length: 200 }, () => numeralFor(1, rng)));
    expect([...first].sort()).toEqual([1, 2, 3, 4, 5]);
    const second = new Set(Array.from({ length: 400 }, () => numeralFor(2, rng)));
    expect(second.size).toBe(10);
    expect(second.has(0)).toBe(true);
  });
  it('is the same round for the same seed, and every thing has a plural', () => {
    expect(numeralFor(2, new Rng(3))).toBe(numeralFor(2, new Rng(3)));
    expect(thingFor(new Rng(3))).toBe(thingFor(new Rng(3)));
    expect(THINGS.every((t) => t.plural.endsWith('s'))).toBe(true);
  });
});

describe('how many things wait', () => {
  it('shows exactly the numeral when they appear by themselves, and none for zero', () => {
    for (let n = 0; n <= 9; n++) expect(groupSize(n, false)).toBe(n);
  });
  it('waits with more than she needs when she wakes them herself, so stopping is a choice', () => {
    for (let n = 1; n <= 9; n++) {
      expect(groupSize(n, true)).toBeGreaterThan(n);
      expect(groupSize(n, true)).toBeLessThanOrEqual(MAX_THINGS);
    }
    expect(groupSize(0, true)).toBe(0);
    expect(groupSize(4, true)).toBe(4 + SPARE);
  });
  it('wakes things until the count is right and then only says that it is enough', () => {
    expect(tapOutcome(0, 3)).toBe('wake');
    expect(tapOutcome(2, 3)).toBe('wake');
    expect(tapOutcome(3, 3)).toBe('enough');
  });
  it('lets a waking round reach exactly the numeral from every group', () => {
    for (let n = 1; n <= 9; n++) {
      let woken = 0;
      for (let i = 0; i < groupSize(n, true); i++) if (tapOutcome(woken, n) === 'wake') woken++;
      expect(woken).toBe(n);
    }
  });
});

describe('where things sit', () => {
  const views = [[1024, 768], [768, 1024], [1366, 1024], [1024, 1366], [1180, 820]];
  it('puts every group inside the room with every circle at least 100 units across and none touching', () => {
    expect(THING_HIT * 2).toBeGreaterThanOrEqual(100);
    for (const [w, h] of views) for (let count = 0; count <= MAX_THINGS; count++) {
      const rect = { x: 150, y: 140, w: w - 190, h: h - 190 };
      const spots = thingSpots(count, rect);
      expect(spots, `${count} things in ${w}x${h}`).not.toBeNull();
      expect(spots!.length).toBe(count);
      for (const [i, a] of spots!.entries()) {
        expect(a.x - THING_HIT).toBeGreaterThanOrEqual(rect.x - 1e-9);
        expect(a.x + THING_HIT).toBeLessThanOrEqual(rect.x + rect.w + 1e-9);
        expect(a.y - THING_HIT).toBeGreaterThanOrEqual(rect.y - 1e-9);
        expect(a.y + THING_HIT).toBeLessThanOrEqual(rect.y + rect.h + 1e-9);
        for (const b of spots!.slice(i + 1)) expect(Math.hypot(a.x - b.x, a.y - b.y)).toBeGreaterThanOrEqual(THING_GAP - 1e-9);
      }
    }
  });
  it('says so rather than shrinking a target when the room is too small', () => {
    expect(thingSpots(9, { x: 0, y: 0, w: 600, h: 130 })).toBeNull();
  });
  it('draws a sticker numeral for any seed', () => {
    for (const seed of [0, 1, 9, 10, 12345, -7]) expect(stickerDigit(seed)).toBeGreaterThanOrEqual(0);
    expect(stickerDigit(23)).toBe(3);
  });
});
