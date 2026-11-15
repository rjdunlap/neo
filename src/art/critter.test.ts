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

describe('Critter cast', () => {
  it('builds every critter, the four farm newcomers included', () => {
    for (const [name, spec] of Object.entries(CRITTERS)) {
      const c = new Critter(spec);
      c.update(1 / 60);
      expect(c.children.length, name).toBeGreaterThan(0);
    }
    expect(Object.keys(CRITTERS)).toEqual(expect.arrayContaining(['sheep', 'horse', 'hen', 'mouse']));
  });

  it('keeps the new parts off the first eight, so no older game changes', () => {
    const NEW_PARTS = ['wool', 'mane', 'comb', 'tail', 'muzzleShade'];
    for (const name of ['pip', 'cow', 'duck', 'pig', 'cat', 'bear', 'dog', 'bunny'] as const) {
      const spec: Record<string, unknown> = CRITTERS[name];
      for (const part of NEW_PARTS) expect(spec[part], `${name}.${part}`).toBeUndefined();
      expect(['big'], name).not.toContain(spec.ears);
      expect(['beak'], name).not.toContain(spec.snout);
    }
  });
});
