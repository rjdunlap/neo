import { describe, expect, it } from 'vitest';
import { clampSlide, pointInSlideWindow, slideCentering } from './slide';

const range = { w: 400, h: 300, maxX: 500, maxY: 200 };

describe('sliding boards', () => {
  it('clamps a slide to what there is to see', () => {
    expect(clampSlide(-5, 900, 500, 200)).toEqual({ x: 0, y: 200 });
    expect(clampSlide(120, 40, 500, 200)).toEqual({ x: 120, y: 40 });
    expect(clampSlide(10, 10, 0, 0)).toEqual({ x: 0, y: 0 });
  });
  it('centres a point, or goes as near as the edges allow', () => {
    expect(slideCentering(range, 450, 300, 12)).toEqual({ x: 262, y: 162 });
    expect(slideCentering(range, 10, 10, 12)).toEqual({ x: 0, y: 0 });
    expect(slideCentering(range, 5000, 5000, 12)).toEqual({ x: 500, y: 200 });
  });
  it('finds a point in the window only when it keeps its margin', () => {
    const slid = { x: 100, y: 50 };
    expect(pointInSlideWindow(range, slid, 300, 200, 12, 40)).toBe(true);
    expect(pointInSlideWindow(range, slid, 95, 200, 12, 40)).toBe(false);
    expect(pointInSlideWindow(range, slid, 300, 390, 12, 40)).toBe(false);
  });
});
