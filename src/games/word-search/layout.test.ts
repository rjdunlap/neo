import { describe, expect, it } from 'vitest';
import { uprightProblems, UPRIGHT_VIEWS, type Target } from '../upright-check';
import { MIN_TOUCH, PAD, SCHOOL_TOUCH, THUMB_TOUCH, touchFrame, touchSquare } from './layout';
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

  it('keeps a fixed letter square thumb-sized in each upright view: a grid that would just fit slides at 86 instead', () => {
    for (const [name, v] of Object.entries(UPRIGHT_VIEWS)) {
      PLANS.forEach((plan, i) => {
        const g = { n: plan.size, school: !!plan.pictures, small: plan.size <= 6 };
        const f = touchFrame(v.w, v.h, { ...g, words: plan.words, message: !!plan.message });
        const cell = touchSquare(f.vp, { ...g, phone: f.phone }),
          where = `${name} level ${i + 1}`;
        const slides = plan.size * cell + PAD > Math.min(f.vp.w, f.vp.h);
        expect(f.phone, where).toBe(true);
        // A grid that is all in view (so a drag marks a word) never has a square under a thumb.
        if (!slides) expect(cell, where).toBeGreaterThanOrEqual(THUMB_TOUCH);
        // A sliding grid's square is the thumb size when the grid nearly fits, and 64 when it is far too big to.
        else expect([MIN_TOUCH, THUMB_TOUCH], where).toContain(cell);
        // The window always shows at least four squares each way, so a short word can be seen whole.
        expect(Math.min(f.vp.w, f.vp.h), where).toBeGreaterThanOrEqual(4 * cell);
      });
    }
  });

  it('slides the 10 × 10 grids (levels 2 and 7) at 86 on the phone, and leaves the 8 × 8 whole and the bigger grids at 64', () => {
    const v = UPRIGHT_VIEWS.phone;
    const cellAt = (level: number) => {
      const plan = PLANS[level - 1];
      const g = { n: plan.size, school: false, small: plan.size <= 6 };
      const f = touchFrame(v.w, v.h, { ...g, words: plan.words, message: !!plan.message });
      return touchSquare(f.vp, { ...g, phone: f.phone });
    };
    expect([1, 2, 3, 4, 6, 7].map(cellAt)).toEqual([87, 86, 64, 64, 87, 86]);
  });

  it('changes no square on an iPad or a sideways view, where a just-fitting square is already big under a finger', () => {
    for (const [w, h] of [
      [1024, 1365],
      [1024, 768],
      [1366, 1024],
    ])
      for (const plan of PLANS) {
        const g = { n: plan.size, school: !!plan.pictures, small: plan.size <= 6 };
        const f = touchFrame(w, h, { ...g, words: plan.words, message: !!plan.message });
        expect(f.phone).toBe(false);
        expect(touchSquare(f.vp, { ...g, phone: f.phone })).toBe(touchSquare(f.vp, g));
      }
  });
});
