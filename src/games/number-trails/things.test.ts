import { describe, expect, it } from 'vitest';
import { THINGS, THING_HIT } from './logic';
import { THING_REACH, drawThing } from './things';

describe('number trails things', () => {
  it('draws every kind centered and inside its 120-unit tap circle across and down', () => {
    expect(THING_REACH).toBeLessThanOrEqual(THING_HIT);
    for (const thing of THINGS) {
      const b = drawThing(thing.id).getLocalBounds();
      expect(Math.max(-b.minX, b.maxX), thing.id).toBeLessThanOrEqual(THING_REACH + 0.5);
      expect(Math.max(-b.minY, b.maxY), thing.id).toBeLessThanOrEqual(THING_REACH + 0.5);
      expect(Math.abs(b.minX + b.maxX), thing.id).toBeLessThan(1);
      expect(Math.abs(b.minY + b.maxY), thing.id).toBeLessThan(1);
      // Big enough to see and count: at least 80 units across or down.
      expect(Math.max(b.width, b.height), thing.id).toBeGreaterThanOrEqual(80);
    }
  });
});
