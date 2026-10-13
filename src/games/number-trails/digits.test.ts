import { describe, expect, it } from 'vitest';
import { advanceTrace, sampleStroke, traceWaypoints, type Point } from '../letter-trails/strokes';
import { DIGITS, DIGIT_KEYS } from './digits';

describe('numeral strokes', () => {
  it('has exactly the digits 0 to 9', () => {
    expect(DIGIT_KEYS.join('')).toBe('0123456789');
  });
  it('starts every numeral in the top quarter of its box, where a writer begins', () => {
    const lowStarts = Object.entries(DIGITS).filter(([, strokes]) => strokes.some((s, i) => i === 0 && s[0][1] > 0.25)).map(([d]) => d);
    expect(lowStarts).toEqual([]);
  });
  it('keeps the two-part numerals to two strokes and the rest to one', () => {
    expect(Object.fromEntries(Object.entries(DIGITS).map(([d, s]) => [d, s.length]))).toEqual({ 0: 1, 1: 1, 2: 1, 3: 1, 4: 2, 5: 2, 6: 1, 7: 1, 8: 1, 9: 2 });
  });
  it('stays inside the writing box with checkpoints no more than a small step apart', () => {
    for (const strokes of Object.values(DIGITS)) for (const stroke of strokes) {
      const points = sampleStroke(stroke);
      for (const [i, p] of points.entries()) {
        expect(p.every((v) => v >= 0 && v <= 1)).toBe(true);
        if (i) expect(Math.hypot(p[0] - points[i - 1][0], p[1] - points[i - 1][1])).toBeLessThanOrEqual(0.02501);
      }
    }
  });
  it('accepts every stroke followed in order, including the 8 that crosses itself', () => {
    for (const [digit, strokes] of Object.entries(DIGITS)) for (const stroke of strokes) {
      const points = sampleStroke(stroke);
      let index = 0, previous: Point = points[0];
      for (const p of points.slice(1)) { index = advanceTrace(points, index, previous, p, 0.085); previous = p; }
      expect(index, `numeral ${digit}`).toBe(points.length - 1);
    }
  });
  it('does not let a straight shortcut skip the loop of a 0, 6, 8 or 9', () => {
    for (const d of ['0', '6', '8', '9']) {
      const points = sampleStroke(DIGITS[d][0]);
      const last = points.at(-1)!;
      expect(advanceTrace(points, 0, points[0], last, 0.085), `numeral ${d}`).toBeLessThan(points.length - 1);
    }
  });
  it('gives a demonstration finger a route of corners for every stroke', () => {
    for (const strokes of Object.values(DIGITS)) for (const stroke of strokes) {
      const route = traceWaypoints(sampleStroke(stroke));
      expect(route.length).toBeGreaterThanOrEqual(2);
      expect(route.length).toBeLessThan(sampleStroke(stroke).length);
    }
  });
});
