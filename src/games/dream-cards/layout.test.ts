import { describe, expect, it } from 'vitest';
import { computeView, UPRIGHT_H, UPRIGHT_W, DESIGN_H, DESIGN_W } from '../../engine/view';
import { buildLayout, dreamLayout } from './layout';

const views = {
  landscape: computeView(DESIGN_W, DESIGN_H),
  wide: computeView(1366, 1024),
  upright: computeView(UPRIGHT_W, UPRIGHT_H, undefined, true),
  phone: computeView(390, 844, undefined, true),
};

describe('dream layout', () => {
  for (const [name, v] of Object.entries(views)) {
    it(`keeps every card, token and button at least 100 units, in the view and clear of the pet corner (${name})`, () => {
      const l = dreamLayout(v);
      expect(l.card).toBeGreaterThanOrEqual(100);
      expect(l.token).toBeGreaterThanOrEqual(100);
      expect(l.radius * 2).toBeGreaterThanOrEqual(100);
      for (const c of l.cards) {
        expect(c.x - l.card / 2).toBeGreaterThanOrEqual(0);
        expect(c.x + l.card / 2).toBeLessThanOrEqual(v.w);
        expect(c.y + l.card / 2).toBeLessThan(l.buttons[0].y - l.radius);
      }
      // Tokens clear of the cards.
      for (const t of l.tokens) expect(t.y + l.token / 2).toBeLessThan(l.cards[0].y - l.card / 2);
      // Neighbouring buttons do not overlap, and the leftmost leaves the pet's 190-unit corner clear.
      const xs = l.buttons.map((b) => b.x).sort((a, b) => a - b);
      expect(xs[0] - l.radius).toBeGreaterThanOrEqual(190);
      expect(xs[1] - xs[0]).toBeGreaterThanOrEqual(l.radius * 2);
      for (const b of l.buttons) expect(b.y + l.radius).toBeLessThanOrEqual(v.h);
    });
  }
});

describe('dream build layout', () => {
  for (const [name, v] of Object.entries(views)) {
    it(`fits three rows of three buttons of 100 units or more clear of the pet corner and the Done button (${name})`, () => {
      const l = buildLayout(v);
      const d = dreamLayout(v);
      expect(l.button).toBeGreaterThanOrEqual(100);
      for (const row of l.rows)
        for (const b of row) {
          expect(b.x - l.button / 2).toBeGreaterThanOrEqual(0);
          expect(b.x + l.button / 2).toBeLessThanOrEqual(v.w);
          expect(b.y + l.button / 2).toBeLessThanOrEqual(v.h - 8);
        }
      // The last row clears the Done button (the first button slot) vertically or horizontally.
      const last = l.rows[2];
      const doneTop = d.buttons[0].y - d.radius;
      const rowBottom = last[0].y + l.button / 2;
      expect(rowBottom <= doneTop || last[2].x + l.button / 2 <= d.buttons[0].x - d.radius).toBe(true);
      expect(l.previewY + l.preview / 2).toBeLessThan(l.rows[0][0].y - l.button / 2);
    });
  }
});
