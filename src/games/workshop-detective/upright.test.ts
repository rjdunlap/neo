import { describe, expect, it } from 'vitest';
import { computeView, NO_INSETS } from '../../engine/view';
import { captionPlace } from '../../ui/caption-layout';
import { thumbPx, uprightProblems, UPRIGHT_VIEWS } from '../upright-check';
import { benchLayout, targets } from './layout';

const shortPhone = captionPlace(computeView(390, 625, NO_INSETS, true), true);
const sideways = captionPlace(computeView(625, 390, NO_INSETS), true);
const tablet = captionPlace(computeView(1024, 768, NO_INSETS), true);
const views = { ...UPRIGHT_VIEWS, shortPhone: shortPhone.game, sideways: sideways.game, tablet: tablet.game };

describe('Workshop Detective upright', () => {
  it.each(Object.entries(views))(
    'lays out %s: levers and Try it at least 100 units, the rest 64, apart, inside, clear of the shell and the caption bubble',
    (_, view) => {
      const layout = benchLayout(view);
      const boxes = targets(layout);
      expect(uprightProblems(view, boxes, 64)).toEqual([]);
      for (const b of boxes) expect(Math.min(b.w, b.h), b.what).toBeGreaterThanOrEqual(b.min);
      for (const lever of layout.levers) expect(lever.w >= 100 && lever.h >= 140).toBe(true);
      expect(layout.lamp.h).toBeGreaterThanOrEqual(160);
      const caption = captionPlace(view, true);
      if (caption.mode === 'bubble' && caption.band) {
        const { x, y, w } = caption.band;
        for (const b of boxes) expect(b.y + b.h / 2 <= y || b.x - b.w / 2 >= x + w, b.what).toBe(true);
      }
    },
  );

  it('records the smallest target in CSS pixels at 390 x 844: a fits or ruled-out toggle, 45.7', () => {
    const boxes = targets(benchLayout(UPRIGHT_VIEWS.phone));
    expect(thumbPx(Math.min(...boxes.map(({ w, h }) => Math.min(w, h))))).toBe(45.7);
  });
});
