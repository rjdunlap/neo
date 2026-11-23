import { describe, expect, it } from 'vitest';
import { computeView, NO_INSETS } from '../../engine/view';
import { captionPlace } from '../../ui/caption-layout';
import { thumbPx, uprightProblems, UPRIGHT_VIEWS } from '../upright-check';
import { distanceAt, markX, shadowLayout } from './layout';
import { MARKS } from './logic';

const shortPhone = captionPlace(computeView(390, 625, NO_INSETS, true), true);
const sideways = captionPlace(computeView(625, 390, NO_INSETS), true);
const tablet = captionPlace(computeView(1024, 768, NO_INSETS), true);
const views = { ...UPRIGHT_VIEWS, shortPhone: shortPhone.game, sideways: sideways.game, tablet: tablet.game };

/** The touch targets: each rail row (its handle rides inside it), Help and Light. */
const targets = (layout: ReturnType<typeof shadowLayout>) => [
  ...layout.rails.map((r, i) => ({ ...r.row, what: `rail ${i}` })),
  { ...layout.help, what: 'Help' },
  { ...layout.light, what: 'Light' },
];

describe('Shadow Play upright', () => {
  it.each(Object.entries(views))(
    'lays out %s: targets at least 100 units upright (64 sideways), apart, clear of the shell and the caption bubble',
    (_, view) => {
      const layout = shadowLayout(view);
      const boxes = targets(layout);
      expect(uprightProblems(view, boxes, view.upright ? 100 : 64)).toEqual([]);
      const caption = captionPlace(view, true);
      if (caption.mode === 'bubble' && caption.band) {
        const { x, y, w } = caption.band;
        expect(boxes.every((b) => b.y + b.h / 2 <= y || b.x - b.w / 2 >= x + w)).toBe(true);
        // The cloth screen stays clear of the bubble too.
        expect(layout.screen.y + layout.screen.h / 2).toBeLessThanOrEqual(y);
      }
      // The screen stays inside the view and out of the Home and help corner, and above the rails.
      expect(layout.screen.x - layout.screen.w / 2).toBeGreaterThanOrEqual(view.upright ? 115 : 0);
      expect(layout.screen.x + layout.screen.w / 2).toBeLessThanOrEqual(view.w);
      expect(layout.screen.y - layout.screen.h / 2).toBeGreaterThanOrEqual(0);
      if (view.upright)
        expect(layout.screen.y + layout.screen.h / 2).toBeLessThan(
          layout.rails[0].row.y - layout.rails[0].row.h / 2,
        );
    },
  );

  it.each(Object.entries(views))(
    'draws %s’s rails to scale: marks at least 24 units apart, a handle at mark 2 clear of the chip',
    (_, view) => {
      for (const r of shadowLayout(view).rails) {
        const xs = MARKS.map((mark) => markX(r, mark));
        xs.slice(1).forEach((x, i) => expect(x - xs[i]).toBeGreaterThanOrEqual(24));
        // To scale: mark 6 is half way to the screen, and a point reads back as its distance.
        expect(markX(r, 6)).toBeCloseTo((r.lampX + r.screenX) / 2, 6);
        expect(distanceAt(r, markX(r, 4))).toBeCloseTo(4, 6);
        expect(xs[0] - r.handle.w / 2).toBeGreaterThanOrEqual(r.chip.x + r.chip.w / 2);
        expect(Math.min(r.handle.w, r.handle.h)).toBeGreaterThanOrEqual(64);
        expect(markX(r, 6) + r.handle.w / 2).toBeLessThanOrEqual(r.row.x + r.row.w / 2);
      }
    },
  );

  it('records the smallest target in CSS pixels at 390 x 844: a rail row, 50.8', () => {
    const boxes = targets(shadowLayout(UPRIGHT_VIEWS.phone));
    expect(thumbPx(Math.min(...boxes.map(({ w, h }) => Math.min(w, h))))).toBe(50.8);
  });
});
