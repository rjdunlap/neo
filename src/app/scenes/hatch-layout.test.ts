import { describe, expect, it } from 'vitest';
import { colorSpot, COLORS_PER_PAGE, hatchLayout, PAGE_RADIUS } from './HatchScene';

/** Half-sizes drawn by the hatch: a colour ball's ring, a name pill and the go button. */
const BALL = 59;
const NAME = 119;
const GO = 58;

describe('the hatch on a phone held upright (768 units wide)', () => {
  for (const w of [768, 1024, 1660]) {
    it(`keeps the choices and the go button inside the plate and apart at ${w}`, () => {
      for (const naming of [false, true]) {
        const l = hatchLayout(w, naming);
        const half = naming ? l.namePitch + NAME : 1.5 * 138 + BALL;
        const bottom = naming ? 220 + 59 : 155 + 125 + BALL;
        expect(l.cx - half).toBeGreaterThanOrEqual(30);
        expect(l.cx + half).toBeLessThanOrEqual(w - 30);
        expect(l.next.x + GO).toBeLessThanOrEqual(w - 30);
        // The button is either beside the choices or under them.
        const beside = l.next.x - GO >= l.cx + half;
        const under = l.next.y - GO >= bottom;
        expect(beside || under).toBe(true);
        expect(l.next.y + GO).toBeLessThanOrEqual(24 + l.plateH);
        // The grown-up's name field (the naming step only) starts under the go button on a narrow view.
        if (!beside && naming) expect(l.formTop).toBeGreaterThanOrEqual(l.next.y + GO);
      }
    });
  }
});

describe('the hatch colour pages (paint-mixer 4)', () => {
  for (const w of [768, 1024, 1660]) {
    it(`keeps a page of eight balls and the page button inside the plate, apart and at least 100 units at ${w}`, () => {
      const l = hatchLayout(w, false);
      const balls = Array.from({ length: COLORS_PER_PAGE }, (_, i) => colorSpot(l.cx, i));
      const page = { ...l.page, r: PAGE_RADIUS };
      expect(2 * PAGE_RADIUS).toBeGreaterThanOrEqual(100);
      // The page button is inside the plate and clear of the go button and every ball.
      expect(page.y - page.r).toBeGreaterThanOrEqual(24);
      expect(page.y + page.r).toBeLessThanOrEqual(24 + l.plateH);
      expect(page.x + page.r).toBeLessThanOrEqual(w - 30);
      expect(Math.hypot(page.x - l.next.x, page.y - l.next.y)).toBeGreaterThanOrEqual(page.r + GO + 10);
      for (const b of balls) {
        expect(Math.hypot(page.x - b.x, page.y - b.y)).toBeGreaterThanOrEqual(page.r + BALL);
        expect(b.y + BALL).toBeLessThanOrEqual(24 + l.plateH);
      }
    });
  }
});
