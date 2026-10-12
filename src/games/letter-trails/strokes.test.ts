import { describe, expect, it } from 'vitest';
import { advanceTrace, LETTERS, sampleStroke, traceWaypoints, type Point } from './strokes';
import { WORDS } from './pictures';
import { nameLetters } from './logic';

describe('capital trails', () => {
  it('starts every capital in the top quarter of its writing box', () => {
    const bottomStarts = Object.entries(LETTERS).filter(([, strokes]) => strokes[0][0][1] > 0.25).map(([letter]) => letter);
    expect(bottomStarts).toEqual([]);
  });
  it('provides an illustration and continuous, bounded strokes for all 26 capitals', () => {
    expect(Object.keys(LETTERS).join('')).toBe('ABCDEFGHIJKLMNOPQRSTUVWXYZ');
    for (const [letter, strokes] of Object.entries(LETTERS)) {
      expect(WORDS[letter]).toBeTruthy();
      expect(strokes.length).toBeGreaterThan(0);
      for (const stroke of strokes) {
        const points = sampleStroke(stroke);
        expect(points[0]).toEqual(stroke[0]);
        expect(points.at(-1)![0]).toBeCloseTo(stroke.at(-1)![0]);
        for (let i = 1; i < points.length; i++) {
          expect(points[i].every((v) => v >= 0 && v <= 1)).toBe(true);
          expect(Math.hypot(points[i][0] - points[i - 1][0], points[i][1] - points[i - 1][1])).toBeLessThanOrEqual(0.02501);
        }
      }
    }
  });
  it('accepts every sampled stroke in order without skipping across curved strokes', () => {
    for (const strokes of Object.values(LETTERS)) for (const stroke of strokes) {
      const points = sampleStroke(stroke);
      let index = 0;
      for (let i = 1; i < points.length; i++) index = advanceTrace(points, index, points[i - 1], points[i], 0.075);
      expect(index).toBe(points.length - 1);
    }
    const curve = sampleStroke(LETTERS.C[0]);
    expect(advanceTrace(curve, 0, curve[0], curve.at(-1)!, 0.075)).toBeLessThan(curve.length / 3);
    const far: Point = [2, 2];
    expect(advanceTrace(curve, 0, far, [3, 3], 0.075)).toBe(0);
  });
  it('waits for the finger to reverse before consuming a retraced upright', () => {
    for (const letter of ['M', 'N']) {
      const points = sampleStroke(LETTERS[letter][0]);
      const x = points[0][0];
      let index = 0;
      for (let i = 1; i <= 200; i++) index = advanceTrace(points, index, [x, (i - 1) / 200], [x, i / 200], 0.075);
      expect(points[index]).toEqual([x, 1]);
      expect(points[index + 1][1]).toBeLessThan(1);
    }
  });
  it('gives the demonstration a short route that still completes every stroke', () => {
    for (const strokes of Object.values(LETTERS)) for (const stroke of strokes) {
      const points = sampleStroke(stroke);
      const route = traceWaypoints(points);
      let index = 0;
      let previous = route[0];
      for (const point of route.slice(1)) {
        index = advanceTrace(points, index, previous, point, 0.075);
        previous = point;
      }
      expect(index).toBe(points.length - 1);
      expect(route.length).toBeLessThanOrEqual(stroke.length + 1);
    }
  });
  it('normalizes names to the supported capital strokes with a safe fallback', () => {
    expect(nameLetters('Zoë-Rose')).toBe('ZOEROSE');
    expect(nameLetters('')).toBe('PIP');
    expect(nameLetters('123')).toBe('PIP');
    expect(nameLetters('a'.repeat(50))).toHaveLength(40);
  });
});
