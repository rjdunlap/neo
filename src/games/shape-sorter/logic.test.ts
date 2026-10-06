import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import { HOLE_R, holeAt, holeLayout, pieceKinds, PLANS } from './logic';

describe('Shape Sorter', () => {
  it('deals a piece for every hole and only pieces that fit somewhere', () => {
    for (const plan of PLANS) {
      for (let seed = 1; seed <= 100; seed++) {
        const kinds = pieceKinds(new Rng(seed), plan);
        expect(kinds).toHaveLength(plan.pieces);
        for (const hole of plan.holes) expect(kinds).toContain(hole);
        for (const k of kinds) expect(plan.holes).toContain(k);
      }
      // Once every piece is one color, only the shape tells them apart, and the rims stop helping.
      if (plan.sameColor) expect(plan.coded).toBe(false);
    }
  });

  it('lays out holes inside the lid, apart from each other, each catching drops on and around it', () => {
    for (const plan of PLANS) {
      const { holes, w, lidH } = holeLayout(plan);
      expect(holes).toHaveLength(plan.holes.length);
      for (const h of holes) {
        expect(Math.abs(h.x) + HOLE_R).toBeLessThanOrEqual(w / 2);
        expect(h.y + HOLE_R).toBeLessThanOrEqual(lidH);
        for (const o of holes) if (o !== h) expect(Math.hypot(o.x - h.x, o.y - h.y)).toBeGreaterThan(2 * HOLE_R + 20);
        // Dropped in the middle, or anywhere on its rim: that hole.
        expect(holeAt(holes, h.x, h.y)).toBe(h);
        for (let a = 0; a < Math.PI * 2; a += Math.PI / 8) {
          expect(holeAt(holes, h.x + Math.cos(a) * HOLE_R, h.y + Math.sin(a) * HOLE_R)).toBe(h);
        }
      }
      // Far from every hole: nothing (the piece just goes home).
      expect(holeAt(holes, 0, -400)).toBeUndefined();
    }
  });
});
