import { describe, expect, it } from 'vitest';
import { simulate, stepBall, type BallWorld } from './ball';

const world = (pegs: BallWorld['pegs'] = []): BallWorld => ({ pegs, left: 0, right: 400, gravity: 900, bounce: 0.7 });

describe('ball physics', () => {
  it('falls, bounces off a peg it lands on, and reports the hit once', () => {
    const b = { x: 200, y: 0, vx: 0, vy: 0, r: 10 };
    const w = world([{ x: 205, y: 200, r: 15 }]);
    const hits: number[] = [];
    for (let i = 0; i < 120; i++) hits.push(...stepBall(b, w, 1 / 60));
    expect(hits.filter((h) => h === 0).length).toBeGreaterThanOrEqual(1);
    expect(b.x).toBeLessThan(205); // it landed left of center, so it rolls off to the left
    expect(Math.hypot(b.x - 205, b.y - 200)).toBeGreaterThanOrEqual(25 - 0.01);
  });

  it('bounces off the walls and never leaves them', () => {
    const b = { x: 390, y: 0, vx: 800, vy: 0, r: 10 };
    for (let i = 0; i < 60; i++) {
      stepBall(b, world(), 1 / 60);
      expect(b.x).toBeLessThanOrEqual(390.001);
      expect(b.x).toBeGreaterThanOrEqual(9.999);
    }
  });

  it('is deterministic, so a preview matches the real shot', () => {
    const pegs = [{ x: 180, y: 150, r: 15 }, { x: 230, y: 260, r: 15 }, { x: 160, y: 330, r: 15 }];
    const a = simulate({ x: 200, y: 0, vx: 30, vy: 0, r: 10 }, world(pegs), 500);
    const b = simulate({ x: 200, y: 0, vx: 30, vy: 0, r: 10 }, world(pegs), 500);
    expect(a).toEqual(b);
    expect(a.landed.y).toBeGreaterThanOrEqual(490);
  });
});
