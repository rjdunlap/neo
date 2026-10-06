import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import { Coverage, inside, mix, pickThings, PLANS, RECIPES, THINGS } from './logic';

describe('Rainbow Fingers', () => {
  it('mixes the three secondary colors, and a color with itself stays the same', () => {
    expect(mix('red', 'yellow')).toBe('orange');
    expect(mix('blue', 'yellow')).toBe('green');
    expect(mix('blue', 'red')).toBe('purple');
    expect(mix('red', 'red')).toBe('red');
    for (const [color, [a, b]] of Object.entries(RECIPES)) expect(mix(a, b)).toBe(color);
  });

  it('gives every coloring page distinct colors, and mixing pages only mixable ones', () => {
    for (const plan of PLANS.filter((p) => p.count > 0)) {
      for (let seed = 1; seed <= 200; seed++) {
        const things = pickThings(plan, new Rng(seed));
        expect(things).toHaveLength(plan.count);
        expect(new Set(things.map((t) => t.color)).size).toBe(plan.count);
        if (plan.mode === 'mix') for (const t of things) expect(RECIPES[t.color]).toBeDefined();
      }
    }
  });

  it('counts coverage only inside the picture, reaching full when scrubbed all over', () => {
    for (const thing of THINGS) {
      const cov = new Coverage(thing.circles);
      expect(cov.total, thing.id).toBeGreaterThan(40);
      expect(cov.paint(1000, 1000, 30)).toBe(0);
      for (const [x, y, r] of thing.circles) for (let dy = -r; dy <= r; dy += 20) for (let dx = -r; dx <= r; dx += 20) if (inside(thing.circles, x + dx, y + dy)) cov.paint(x + dx, y + dy, 30);
      expect(cov.covered, thing.id).toBe(1);
    }
  });
});
