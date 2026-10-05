import { describe, expect, it } from 'vitest';
import { gaze } from '../engine/input';
import { Critter, CRITTERS } from './critter';

describe('Critter eyes', () => {
  it('stay put while the critter is scaled to zero (popping in) right after a tap', () => {
    const duck = new Critter(CRITTERS.duck);
    duck.scale.set(0);
    Object.assign(gaze, { x: 100, y: 100, at: performance.now() });
    duck.update(1 / 60);
    duck.scale.set(1);
    duck.update(1 / 60);
    const look = (duck as unknown as { look: { x: number; y: number } }).look;
    expect(Number.isFinite(look.x)).toBe(true);
    expect(Number.isFinite(look.y)).toBe(true);
  });
});
