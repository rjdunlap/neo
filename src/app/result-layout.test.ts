import { describe, expect, it } from 'vitest';
import { computeView, NO_INSETS } from '../engine/view';
import { nameBelow, nameWidth, PILL, RESULT_NAMES } from '../content/button-names';
import { DAILY_NEXT, RESULT_NAME_W, RESULT_RADIUS, dailySpots, resultSpots } from './result-layout';

const WIDE = [computeView(1024, 768), computeView(768, 1024), computeView(844, 390), computeView(1366, 768)];
const UPRIGHT = [
  computeView(390, 844, NO_INSETS, true),
  computeView(375, 667, NO_INSETS, true),
  computeView(430, 932, { top: 59, right: 0, bottom: 34, left: 0 }, true),
];

describe("the result's layout", () => {
  it('is the same as before on the wide area', () => {
    for (const v of WIDE) {
      const at = resultSpots(v);
      expect(at.house).toEqual({ x: v.w / 2 + 380, y: v.h * 0.72 });
      expect(at.home).toEqual({ x: v.w / 2 + 240, y: v.h * 0.72 });
      expect(at.next).toEqual({ x: v.w / 2 + 250, y: v.h * 0.525 });
    }
  });

  it('keeps every button inside an upright view and apart, clear of the celebrating pet', () => {
    for (const v of UPRIGHT) {
      for (const withHouse of [true, false]) {
        const at = resultSpots(v, withHouse);
        const buttons = (Object.keys(RESULT_RADIUS) as Array<keyof typeof RESULT_RADIUS>)
          .filter((k) => withHouse || k !== 'house')
          .map((k) => ({ k, ...at[k], r: RESULT_RADIUS[k] }));
        for (const b of buttons) {
          const where = `${b.k} at ${Math.round(v.w)}×${Math.round(v.h)}${withHouse ? '' : ' no house'}`;
          expect(b.x - b.r, where).toBeGreaterThanOrEqual(0);
          expect(b.x + b.r, where).toBeLessThanOrEqual(v.w);
          expect(b.y + b.r, where).toBeLessThanOrEqual(v.h - 300);
          expect(b.r * 2, where).toBeGreaterThanOrEqual(100);
        }
        for (let i = 0; i < buttons.length; i++) {
          for (let j = i + 1; j < buttons.length; j++) {
            const a = buttons[i],
              b = buttons[j];
            expect(Math.hypot(a.x - b.x, a.y - b.y), `${a.k} and ${b.k}`).toBeGreaterThan(a.r + b.r + 10);
          }
        }
      }
    }
  });

  it("puts each button's name (U1) inside the view, clear of the other buttons and names", () => {
    const keys = Object.keys(RESULT_RADIUS) as Array<keyof typeof RESULT_RADIUS>;
    for (const k of keys) expect(nameWidth(RESULT_NAMES[k]), k).toBeLessThanOrEqual(RESULT_NAME_W[k]);
    for (const v of [...WIDE, ...UPRIGHT]) {
      for (const withHouse of [true, false]) {
        const at = resultSpots(v, withHouse);
        const shown = keys.filter((k) => withHouse || k !== 'house');
        const name = (k: (typeof keys)[number]) => {
          const y1 = at[k].y + nameBelow(RESULT_RADIUS[k]);
          return {
            x0: at[k].x - RESULT_NAME_W[k] / 2,
            x1: at[k].x + RESULT_NAME_W[k] / 2,
            y0: y1 - PILL.h,
            y1,
          };
        };
        const hits = (b: ReturnType<typeof name>, k: (typeof keys)[number]) => {
          const r = RESULT_RADIUS[k];
          const dx = Math.max(b.x0 - at[k].x, 0, at[k].x - b.x1);
          const dy = Math.max(b.y0 - at[k].y, 0, at[k].y - b.y1);
          return Math.hypot(dx, dy) < r;
        };
        for (const k of shown) {
          const b = name(k);
          const where = `${k}'s name at ${Math.round(v.w)}×${Math.round(v.h)}${withHouse ? '' : ' no house'}`;
          expect(b.x0, where).toBeGreaterThanOrEqual(0);
          expect(b.x1, where).toBeLessThanOrEqual(v.w);
          expect(b.y1, where).toBeLessThanOrEqual(v.h);
          for (const o of shown) {
            if (o === k) continue;
            expect(hits(b, o), `${where} on ${o}`).toBe(false);
            const c = name(o);
            expect(b.x0 < c.x1 && c.x0 < b.x1 && b.y0 < c.y1 && c.y0 < b.y1, `${where} on ${o}'s name`).toBe(
              false,
            );
          }
        }
      }
    }
  });
});

describe("a daily round's next game and note pencil", () => {
  it('stay in the top-left corner on a wide view', () => {
    for (const v of WIDE) expect(dailySpots(v)).toEqual({ next: { x: 32, y: 24 }, note: { x: 82, y: 210 } });
  });

  it('puts the next game between Again and the way out on an upright phone, clear of every button, name and the pet', () => {
    for (const v of UPRIGHT) {
      const at = resultSpots(v, false);
      const { next, note } = dailySpots(v);
      const tile = { x0: next.x, x1: next.x + DAILY_NEXT.w, y0: next.y, y1: next.y + DAILY_NEXT.h };
      const where = `at ${Math.round(v.w)}×${Math.round(v.h)}`;
      expect((tile.x0 + tile.x1) / 2, where).toBeCloseTo(v.w / 2);
      expect((tile.y0 + tile.y1) / 2, where).toBeCloseTo(at.again.y);
      expect(tile.y1, where).toBeLessThanOrEqual(v.h - 300);
      for (const k of ['again', 'next', 'home', 'heart', 'keep'] as const) {
        const r = RESULT_RADIUS[k];
        const dx = Math.max(tile.x0 - at[k].x, 0, at[k].x - tile.x1);
        const dy = Math.max(tile.y0 - at[k].y, 0, at[k].y - tile.y1);
        expect(Math.hypot(dx, dy), `${k} ${where}`).toBeGreaterThan(r + 10);
        const name = {
          x0: at[k].x - RESULT_NAME_W[k] / 2,
          x1: at[k].x + RESULT_NAME_W[k] / 2,
          y1: at[k].y + nameBelow(r),
        };
        const apart =
          name.x1 <= tile.x0 || tile.x1 <= name.x0 || name.y1 <= tile.y0 || tile.y1 <= name.y1 - PILL.h;
        expect(apart, `${k}'s name ${where}`).toBe(true);
      }
      // The pencil takes the corner the tile left: on screen, and far above the sticker and the heart.
      expect(note.x - 50, where).toBeGreaterThanOrEqual(0);
      expect(note.y - 50, where).toBeGreaterThanOrEqual(0);
      expect(note.y + 50, where).toBeLessThan(at.keep.y - RESULT_RADIUS.keep);
    }
  });
});
