import { describe, expect, it } from 'vitest';
import { CHIP, chipPlaces } from './pick-sheet';

const VIEWS = [
  { w: 1024, h: 768 },
  { w: 1366, h: 1024 },
  { w: 768, h: 1024 },
  { w: 1024, h: 1400 },
  { w: 844, h: 390 + 200 },
];

describe('pick sheet chips', () => {
  it('every chip is at least 100 across and never overlaps another or leaves the view, at every count and page', () => {
    expect(CHIP).toBeGreaterThanOrEqual(100);
    for (const v of VIEWS)
      for (let count = 1; count <= 24; count++) {
        const first = chipPlaces(count, 0, v);
        for (let page = 0; page < first.pages; page++) {
          const { at } = chipPlaces(count, page, v);
          expect(at.length).toBeGreaterThan(0);
          for (const [i, a] of at.entries()) {
            expect(a.x - CHIP / 2).toBeGreaterThanOrEqual(0);
            expect(a.x + CHIP / 2).toBeLessThanOrEqual(v.w);
            // Above the One pick / page row at the bottom (centre h - 105, radius 70).
            expect(a.y + CHIP / 2).toBeLessThanOrEqual(v.h - 105 - 70 + 1);
            for (const b of at.slice(i + 1))
              expect(Math.abs(a.x - b.x) >= CHIP || Math.abs(a.y - b.y) >= CHIP).toBe(true);
          }
        }
      }
  });
  it('pages instead of shrinking: every chip appears on exactly one page', () => {
    for (const v of VIEWS) {
      const count = 21;
      const { pages } = chipPlaces(count, 0, v);
      let shown = 0;
      for (let p = 0; p < pages; p++) shown += chipPlaces(count, p, v).at.length;
      expect(shown).toBe(count);
    }
  });
});
