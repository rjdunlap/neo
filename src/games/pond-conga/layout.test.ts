import { describe, expect, it } from 'vitest';
import { thumbPx, uprightProblems, UPRIGHT_VIEWS } from '../upright-check';
import { pondTouchLayout, SCHOOL_TOUCH } from './layout';
import { PLANS } from './logic';

describe('Pond Conga on a phone held upright (chunk 31)', () => {
  it('fits every pond, Hint and Start over, and the line of help in each upright view', () => {
    for (const [name, v] of Object.entries(UPRIGHT_VIEWS)) {
      PLANS.forEach((plan, i) => {
        const level = i + 1,
          school = level >= 10,
          fit = pondTouchLayout(plan.cols, plan.rows, v.w, v.h, school),
          where = `${name} level ${level}`;
        if (school) expect(fit.cell, where).toBeGreaterThanOrEqual(SCHOOL_TOUCH);
        const pw = (fit.turned ? plan.rows : plan.cols) * fit.cell,
          ph = (fit.turned ? plan.cols : plan.rows) * fit.cell;
        const targets = [
          { what: 'pond', x: fit.x + pw / 2, y: fit.y + ph / 2, w: pw, h: ph },
          ...fit.slots.map((s) => ({ what: s.kind, x: s.x + s.w / 2, y: s.y + s.h / 2, w: s.w, h: s.h })),
        ];
        // The pond is one swipe target; only the buttons have a minimum.
        expect(uprightProblems(v, targets, 0), where).toEqual([]);
        for (const s of fit.slots)
          expect(Math.min(s.w, s.h), where).toBeGreaterThanOrEqual(school ? 100 : 64);
        expect(fit.noteY + 30, where).toBeLessThanOrEqual(v.h);
        // Two lines of help at most, clear of the guide's corner and inside the view.
        if (fit.turned) expect(fit.noteX - fit.noteW / 2, where).toBeGreaterThanOrEqual(150);
        expect(fit.noteX + fit.noteW / 2, where).toBeLessThanOrEqual(v.w);
        expect(fit.noteY + 36, where).toBeLessThanOrEqual(v.h);
      });
    }
  });

  it('steers by a swipe anywhere on the screen, so a thumb can swipe in the empty space below the pond', () => {
    for (const [name, v] of Object.entries(UPRIGHT_VIEWS)) {
      PLANS.forEach((plan, i) => {
        const fit = pondTouchLayout(plan.cols, plan.rows, v.w, v.h, i + 1 >= 10),
          where = `${name} level ${i + 1}`;
        expect(fit.swipe, where).toEqual({ x: 0, y: 0, w: v.w, h: v.h });
      });
    }
  });

  it('turns a wide pond a quarter turn on an upright phone, so it fills the height instead of a strip across the top', () => {
    const v = UPRIGHT_VIEWS.phone;
    PLANS.forEach((plan, i) => {
      const school = i + 1 >= 10,
        fit = pondTouchLayout(plan.cols, plan.rows, v.w, v.h, school),
        where = `level ${i + 1}`;
      const flat = Math.min(80, Math.floor((v.w - 60) / plan.cols));
      if (school) expect(fit.cell, where).toBe(SCHOOL_TOUCH);
      else {
        expect(fit.turned, where).toBe(true);
        expect(fit.cell, where).toBeGreaterThan(flat);
      }
    });
    // The largest ponds, 15 by 9 (levels 4 to 6): cells of about 40 CSS pixels, from 24 drawn across the top.
    const big = PLANS[5],
      fit = pondTouchLayout(big.cols, big.rows, v.w, v.h, false);
    expect(thumbPx(fit.cell)).toBeGreaterThanOrEqual(39);
  });

  it('keeps a pond flat where turning it would not make it larger (sideways, and the upright iPad)', () => {
    for (const plan of PLANS) {
      expect(pondTouchLayout(plan.cols, plan.rows, 1024, 768, false).turned).toBe(false);
      expect(pondTouchLayout(plan.cols, plan.rows, 1366, 768, false).turned).toBe(false);
    }
  });
});
