import { describe, expect, it } from 'vitest';
import { computeView, NO_INSETS } from '../../engine/view';
import { captionPlace } from '../../ui/caption-layout';
import { thumbPx, uprightProblems, UPRIGHT_VIEWS } from '../upright-check';
import { outcropLayout, STEPS, targets } from './layout';

const shortPhone = captionPlace(computeView(390, 625, NO_INSETS, true), true);
const sideways = captionPlace(computeView(625, 390, NO_INSETS), true);
const tablet = captionPlace(computeView(1024, 768, NO_INSETS), true);
const wide = captionPlace(computeView(1366, 768, NO_INSETS), true);
const views = {
  ...UPRIGHT_VIEWS,
  shortPhone: shortPhone.game,
  sideways: sideways.game,
  tablet: tablet.game,
  wide: wide.game,
};

const inside = (outer: { x: number; y: number; w: number; h: number }, v: { w: number; h: number }) =>
  outer.x - outer.w / 2 >= 0 &&
  outer.y - outer.h / 2 >= 0 &&
  outer.x + outer.w / 2 <= v.w &&
  outer.y + outer.h / 2 <= v.h;

describe('Outcrop Detective layout', () => {
  for (const [name, view] of Object.entries(views)) {
    it.each(STEPS)(
      `lays out ${name} at the %s step: every target at least 100 units, apart, inside, clear of the shell and the caption bubble`,
      (step) => {
        const l = outcropLayout(view);
        const boxes = targets(l, step);
        expect(uprightProblems(view, boxes, 100)).toEqual([]);
        const caption = captionPlace(view, true);
        if (caption.mode === 'bubble' && caption.band) {
          const { x, y, w } = caption.band;
          for (const b of boxes) expect(b.y + b.h / 2 <= y || b.x - b.w / 2 >= x + w, b.what).toBe(true);
        }
        // The frames are pictures, not targets: inside the view, clear of Home and "?", not under any target.
        for (const f of [l.cliff, l.story]) {
          expect(inside(f, view)).toBe(true);
          expect(f.x - f.w / 2 >= 115 || f.y - f.h / 2 >= 210).toBe(true);
          for (const b of boxes)
            expect(Math.abs(f.x - b.x) * 2 >= f.w + b.w || Math.abs(f.y - b.y) * 2 >= f.h + b.h, b.what).toBe(
              true,
            );
        }
      },
    );
  }

  it('records the smallest target in CSS pixels at 390 x 844: Play, 100 units, 50.8', () => {
    const l = outcropLayout(UPRIGHT_VIEWS.phone);
    const all = STEPS.flatMap((s) => targets(l, s));
    expect(thumbPx(Math.min(...all.map(({ w, h }) => Math.min(w, h))))).toBe(50.8);
  });
});
