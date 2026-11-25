import { describe, expect, it } from 'vitest';
import type { View } from '../../engine/view';
import { cellAt, roomLayout } from './layout';

const VIEWS: View[] = [
  { w: 768, h: 1024, scale: 0.5, upright: true },
  { w: 1024, h: 768, scale: 1 },
  { w: 1280, h: 768, scale: 1 },
  { w: 1024, h: 1365, scale: 0.75 },
];

describe('Common Ground layout', () => {
  for (const v of VIEWS)
    it(`fits ${v.w} × ${v.h}: cells at least 100, targets inside the view and apart, the pet's corner clear`, () => {
      const l = roomLayout(v);
      expect(l.floor.cell).toBeGreaterThanOrEqual(100);
      expect(l.floor.cell).toBeLessThanOrEqual(160);
      const targets = [...l.tray, l.visit];
      for (const t of targets) {
        expect(t.x - 55).toBeGreaterThanOrEqual(0);
        expect(t.x + 55).toBeLessThanOrEqual(v.w);
        expect(t.y - 55).toBeGreaterThanOrEqual(0);
        expect(t.y + 55).toBeLessThanOrEqual(v.h);
        // The pet sits bottom left; nothing to press lives there.
        expect(t.x < 150 && t.y > v.h - 150).toBe(false);
      }
      for (let i = 0; i < targets.length; i++)
        for (let j = i + 1; j < targets.length; j++)
          expect(
            Math.abs(targets[i].x - targets[j].x) >= 100 || Math.abs(targets[i].y - targets[j].y) >= 100,
          ).toBe(true);
      // Tray pieces stay clear of the floor and the bubbles.
      for (const t of l.tray)
        expect(t.y - 55 >= l.floor.top + l.floor.h || t.x - 55 >= l.floor.left + l.floor.w).toBe(true);
      for (const b of l.bubbles)
        (expect(b.x - b.w / 2).toBeGreaterThanOrEqual(0), expect(b.x + b.w / 2).toBeLessThanOrEqual(v.w));
      l.cells.forEach((c, i) => expect(cellAt(l, c.x, c.y)).toBe(i));
      expect(cellAt(l, 2, 2)).toBe(-1);
    });
});
