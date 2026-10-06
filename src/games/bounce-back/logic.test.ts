import { describe, expect, it } from 'vitest';
import { paddleBounce, PLANS, predictY } from './logic';

describe('Bounce Back', () => {
  it('predicts where the ball arrives, folding in wall bounces', () => {
    expect(predictY(0, 100, 100, 0, 300, 0, 400)).toBe(100);
    expect(predictY(0, 100, 100, 100, 200, 0, 400)).toBe(300);
    // 100 + 400 = 500 overshoots the bottom wall at 400 and comes back to 300.
    expect(predictY(0, 100, 100, 100, 400, 0, 400)).toBe(300);
    // Moving away from the target: no prediction, stay put.
    expect(predictY(300, 100, 100, 50, 0, 0, 400)).toBe(100);
  });

  it('angles the ball by where it hits the paddle, keeping its speed', () => {
    const mid = paddleBounce(200, 200, 200, 300, false);
    expect(mid.vx).toBeCloseTo(-300);
    expect(mid.vy).toBeCloseTo(0);
    const edge = paddleBounce(300, 200, 200, 300, true);
    expect(edge.vx).toBeGreaterThan(0);
    expect(edge.vy).toBeGreaterThan(150);
    expect(Math.hypot(edge.vx, edge.vy)).toBeCloseTo(300);
  });

  it('starts slow with a huge paddle and speeds up gently', () => {
    PLANS.slice(1).forEach((p, i) => {
      expect(p.speed).toBeGreaterThanOrEqual(PLANS[i].speed);
      expect(p.paddle).toBeLessThanOrEqual(PLANS[i].paddle);
    });
    expect(PLANS[0].paddle).toBeGreaterThanOrEqual(240);
  });
});
