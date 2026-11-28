import { describe, expect, it } from 'vitest';
import { computeView, DESIGN_H, DESIGN_W, UPRIGHT_H, UPRIGHT_W } from '../../engine/view';
import { charadesLayout } from './layout';

const views = {
  landscape: computeView(DESIGN_W, DESIGN_H),
  wide: computeView(1366, 1024),
  upright: computeView(UPRIGHT_W, UPRIGHT_H, undefined, true),
  phone: computeView(390, 844, undefined, true),
};

describe('animal charades layout', () => {
  for (const [name, v] of Object.entries(views)) {
    it(`keeps cards and buttons at least 100 units, in view, and clear of the stage and pet corner (${name})`, () => {
      const l = charadesLayout(v);
      expect(l.card).toBeGreaterThanOrEqual(100);
      expect(l.radius * 2).toBeGreaterThanOrEqual(100);
      for (const c of l.cards) {
        expect(c.x - l.card / 2).toBeGreaterThanOrEqual(0);
        expect(c.x + l.card / 2).toBeLessThanOrEqual(v.w);
        expect(c.y + l.card / 2).toBeLessThan(l.buttons[0].y - l.radius);
        // Cards clear the stage.
        if (l.upright) expect(c.y - l.card / 2).toBeGreaterThan(l.stageC.y + l.stage / 2);
        else expect(c.x - l.card / 2).toBeGreaterThan(l.stageC.x + l.stage / 2);
      }
      expect(l.stageC.x - l.stage / 2).toBeGreaterThanOrEqual(0);
      expect(l.stageC.x + l.stage / 2).toBeLessThanOrEqual(v.w);
      const xs = l.buttons.map((b) => b.x).sort((a, b) => a - b);
      expect(xs[0] - l.radius).toBeGreaterThanOrEqual(190);
      expect(xs[1] - xs[0]).toBeGreaterThanOrEqual(l.radius * 2);
      for (const b of l.buttons) expect(b.y + l.radius).toBeLessThanOrEqual(v.h);
      // The pet's corner (bottom-left 190 units) holds no card or the stage.
      for (const c of l.cards) expect(c.x - l.card / 2 >= 190 || c.y + l.card / 2 <= v.h - 190).toBe(true);
      expect(l.stageC.x - l.stage / 2 >= 190 || l.stageC.y + l.stage / 2 <= v.h - 190).toBe(true);
    });
  }
});
