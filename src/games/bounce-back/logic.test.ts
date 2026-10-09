import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import { paddleBounce, paddleTarget, PLANS, predictY, type PaddleGeometry } from './logic';

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

  it("holds the ghost finger's paddle where the ball arrives, and on the stars level slides it so the bounce goes through the star", () => {
    // The table on a 1024 by 768 screen, as the game lays it out.
    const plan = PLANS.find((p) => p.mode === 'stars')!;
    const R = 26;
    const half = plan.paddle / 2;
    const g: PaddleGeometry = { faceX: 984 - 46 - R, top: 90 + R, bottom: 728 - R, low: 90 + half, high: 728 - half, paddle: plan.paddle, speed: plan.speed, starReach: R + 52 };
    const rng = new Rng(11);
    // Follow the ball after the bounce, wall to wall, and report how near it comes to the star on its way across.
    const nearest = (arrive: number, paddleY: number, star: { x: number; y: number }) => {
      const v = paddleBounce(arrive, paddleY, plan.paddle, plan.speed, false);
      let x = g.faceX;
      let y = arrive;
      let vy = v.vy;
      let best = Infinity;
      while (x > star.x - 100) {
        x += v.vx / 240;
        y += vy / 240;
        if (y < g.top) [y, vy] = [g.top, Math.abs(vy)];
        if (y > g.bottom) [y, vy] = [g.bottom, -Math.abs(vy)];
        best = Math.min(best, Math.hypot(x - star.x, y - star.y));
      }
      return best;
    };
    let hit = 0;
    let total = 0;
    for (let i = 0; i < 400; i++) {
      const arrive = rng.range(g.top, g.bottom);
      const star = { x: rng.range(180 + 200, 984 - 200), y: rng.range(90 + 80, 728 - 80) };
      const y = paddleTarget(arrive, star, g);
      // The paddle always meets the ball, and stays on the table.
      expect(Math.abs(arrive - y)).toBeLessThanOrEqual(half + R * 0.6);
      expect(y).toBeGreaterThanOrEqual(g.low);
      expect(y).toBeLessThanOrEqual(g.high);
      total++;
      if (nearest(arrive, y, star) <= g.starReach) hit++;
    }
    // Most stars can be reached from where the ball comes; the rest are sent straight back and the pet's return gives another chance.
    expect(hit / total).toBeGreaterThan(0.85);
    // Without a star the paddle sits on the ball.
    expect(paddleTarget(300, null, g)).toBe(300);
    // When no star is asked for, every level meets the ball on the same line.
    for (const p of PLANS) expect(paddleTarget(250, null, { ...g, paddle: p.paddle, speed: p.speed })).toBe(250);
  });
});
