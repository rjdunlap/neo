import { describe, expect, it } from 'vitest';
import { computeView, spread } from './view';

describe('computeView', () => {
  it('fits the 4:3 design area and grows the spare side', () => {
    expect(computeView(1024, 768)).toEqual({ w: 1024, h: 768, scale: 1 });
    const wide = computeView(1180, 820);
    expect(wide.h).toBeCloseTo(768);
    expect(wide.w).toBeGreaterThan(1024);
  });
});

describe('spread', () => {
  it('centers a row at the preferred gap when there is room', () => {
    expect(spread(3, 0, 1000, 100)).toEqual([400, 500, 600]);
  });

  it('squeezes the gap to fit', () => {
    const xs = spread(4, 0, 200, 100);
    expect(xs[1] - xs[0]).toBe(50);
    expect(xs[0]).toBeGreaterThanOrEqual(0);
    expect(xs[3]).toBeLessThanOrEqual(200);
  });
});
