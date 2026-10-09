import { describe, expect, it } from 'vitest';
import { clampInsets, computeView, needsTurn, NO_INSETS, spread, textBoost } from './view';

describe('computeView', () => {
  it('fits the 4:3 design area and grows the spare side', () => {
    expect(computeView(1024, 768)).toEqual({ w: 1024, h: 768, scale: 1 });
    const wide = computeView(1180, 820);
    expect(wide.h).toBeCloseTo(768);
    expect(wide.w).toBeGreaterThan(1024);
  });

  it('is unchanged by empty insets', () => {
    expect(computeView(1180, 820, NO_INSETS)).toEqual(computeView(1180, 820));
  });

  it('lays the view out inside a notch and a home indicator', () => {
    // An iPhone held sideways: 844 × 390, with a cutout on one side (the system reports both) and the home bar.
    const v = computeView(844, 390, { top: 0, right: 47, bottom: 21, left: 47 });
    expect(v.scale).toBeCloseTo(Math.min((844 - 94) / 1024, (390 - 21) / 768));
    expect(v.w * v.scale).toBeCloseTo(844 - 94);
    expect(v.h * v.scale).toBeCloseTo(390 - 21);
    expect(v.h).toBeGreaterThanOrEqual(768 - 1e-9);
  });

  it('never hands a scene less than the design area', () => {
    for (const [w, h] of [[844, 390], [667, 375], [1024, 768], [1180, 820], [768, 1024]] as const) {
      const v = computeView(w, h, { top: 24, right: 59, bottom: 21, left: 59 });
      expect(v.w).toBeGreaterThanOrEqual(1024 - 1e-9);
      expect(v.h).toBeGreaterThanOrEqual(768 - 1e-9);
    }
  });
});

describe('clampInsets', () => {
  it('drops nonsense and caps each edge at a quarter of its side', () => {
    expect(clampInsets({ top: -5, right: NaN, bottom: 9999, left: 12 }, 800, 400)).toEqual({ top: 0, right: 0, bottom: 100, left: 12 });
  });
});

describe('needsTurn', () => {
  it('asks an upright phone to turn sideways', () => {
    expect(needsTurn(390, 844, true)).toBe(true);
    expect(needsTurn(360, 780, true)).toBe(true);
    expect(needsTurn(430, 932, true)).toBe(true);
  });

  it('leaves a phone held sideways alone', () => {
    expect(needsTurn(844, 390, true)).toBe(false);
    expect(needsTurn(667, 375, true)).toBe(false);
  });

  it('leaves every tablet shape alone, upright too', () => {
    expect(needsTurn(768, 1024, true)).toBe(false); // iPad
    expect(needsTurn(744, 1133, true)).toBe(false); // iPad mini
    expect(needsTurn(834, 1194, true)).toBe(false); // iPad Pro 11
    expect(needsTurn(1024, 1366, true)).toBe(false); // iPad Pro 12.9
    expect(needsTurn(800, 1280, true)).toBe(false); // a 16:10 Android tablet
  });

  it('never bothers a mouse', () => {
    expect(needsTurn(390, 844, false)).toBe(false);
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

describe('textBoost', () => {
  it('leaves a tablet or computer alone and lifts small text on a phone', () => {
    expect(textBoost(1)).toBe(1);
    expect(textBoost(0.75)).toBe(1);
    expect(textBoost(computeView(844, 390).scale)).toBeCloseTo(1.42, 1);
    expect(textBoost(0.2)).toBe(1.5);
  });
});
