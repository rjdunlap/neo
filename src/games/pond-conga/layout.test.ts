import { describe, expect, it } from 'vitest';
import { uprightProblems, UPRIGHT_VIEWS } from '../upright-check';
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
        const pw = plan.cols * fit.cell,
          ph = plan.rows * fit.cell;
        const targets = [
          { what: 'pond', x: fit.x + pw / 2, y: fit.y + ph / 2, w: pw, h: ph },
          ...fit.slots.map((s) => ({ what: s.kind, x: s.x + s.w / 2, y: s.y + s.h / 2, w: s.w, h: s.h })),
        ];
        // The pond is one swipe target; only the buttons have a minimum.
        expect(uprightProblems(v, targets, 0), where).toEqual([]);
        for (const s of fit.slots)
          expect(Math.min(s.w, s.h), where).toBeGreaterThanOrEqual(school ? 100 : 64);
        expect(fit.noteY + 30, where).toBeLessThanOrEqual(v.h);
      });
    }
  });
});
