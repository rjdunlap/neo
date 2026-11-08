import { describe, expect, it } from 'vitest';
import { uprightProblems, UPRIGHT_VIEWS, type Target } from '../upright-check';
import { SCHOOL_TOUCH, touchFrame } from './layout';
import { PLANS } from './logic';

describe('Word Search on a phone held upright (chunk 31)', () => {
  it('fits the grid window, the list, the picture tiles and both buttons in each upright view, below Home and help', () => {
    for (const [name, v] of Object.entries(UPRIGHT_VIEWS)) {
      PLANS.forEach((plan, i) => {
        const school = !!plan.pictures,
          where = `${name} level ${i + 1}`;
        const f = touchFrame(v.w, v.h, {
          n: plan.size,
          words: plan.words,
          school,
          small: plan.size <= 6,
          message: !!plan.message,
        });
        const targets: Target[] = [
          { what: 'grid', x: f.vp.x + f.vp.w / 2, y: f.vp.y + f.vp.h / 2, w: f.vp.w, h: f.vp.h },
          ...f.btn.map((b) => ({ what: b.kind, x: b.x + b.w / 2, y: b.y + b.h / 2, w: b.w, h: b.h })),
        ];
        if (school)
          for (let t = 0; t < plan.words; t++)
            targets.push({
              what: `tile ${t}`,
              x: f.listX + t * (SCHOOL_TOUCH + 12) + 50,
              y: f.listY + 48 + 50,
              w: 100,
              h: 100,
            });
        else {
          // The list's rows end above the buttons.
          const rows = Math.ceil(plan.words / f.listBox.cols);
          expect(f.listY + f.listBox.top + rows * f.listBox.step, where).toBeLessThanOrEqual(f.btn[0].y);
        }
        expect(uprightProblems(v, targets, school ? 100 : 64), where).toEqual([]);
        // A letter square is at least 64 (the grid slides when it does not fit), so the window holds at least a few.
        expect(Math.min(f.vp.w, f.vp.h), where).toBeGreaterThanOrEqual(4 * 64);
        expect(f.slideNote.x, where).toBeGreaterThanOrEqual(115);
      });
    }
  });

  it('leaves the iPad and sideways frames as they were', () => {
    expect(
      touchFrame(1024, 1365, { n: 12, words: 9, school: false, small: false, message: false }).vp.y,
    ).toBe(150);
    expect(
      touchFrame(1024, 768, { n: 12, words: 9, school: false, small: false, message: false }).vp,
    ).toEqual({ x: 150, y: 100, w: 1024 - 262 - 16 - 24 - 150, h: 768 - 100 - 24 });
  });
});
