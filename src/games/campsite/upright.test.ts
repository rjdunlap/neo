import { describe, expect, it } from 'vitest';
import { computeView, NO_INSETS, type View } from '../../engine/view';
import { captionPlace } from '../../ui/caption-layout';
import { square, uprightProblems, UPRIGHT_VIEWS } from '../upright-check';
import { BUTTON, SIGN, campLayout } from './layout';
import { N } from './logic';

const views = { ...UPRIGHT_VIEWS, short: computeView(390, 630, NO_INSETS, true) };
const sideways = computeView(1024, 768, NO_INSETS, false);

function targets(view: View) {
  const lay = campLayout(view);
  const { cell, first } = lay;
  const t = Array.from({ length: N * N }, (_, s) =>
    square(`square ${s}`, { x: first.x + (s % N) * cell, y: first.y + Math.floor(s / N) * cell }, cell),
  );
  t.push({ what: 'check camp', ...lay.check, ...BUTTON }, { what: 'hint', ...lay.hint, ...BUTTON });
  return { t, lay };
}

describe.each(Object.entries(views))('Campsite upright on %s', (_, view) => {
  it('fits the camp, its signs and buttons with squares of 100 units or more', () => {
    const { t, lay } = targets(view);
    expect(uprightProblems(view, t)).toEqual([]);
    expect(lay.cell).toBeGreaterThanOrEqual(100);
    // Signs sit inside the view, above and right of the camp, and the supply above the signs.
    expect(lay.rowSignX + SIGN.w / 2).toBeLessThanOrEqual(view.w);
    expect(lay.colSignY - SIGN.h / 2).toBeGreaterThan(lay.supply.y);
    expect(lay.supply.y).toBeGreaterThan(lay.heading.y);
    const caption = captionPlace(view, true);
    if (caption.mode === 'bubble' && caption.band) {
      expect(lay.first.y + (N - 0.5) * lay.cell).toBeLessThan(caption.band.y);
      expect(lay.check.y - BUTTON.h / 2).toBeGreaterThan(caption.band.y + caption.band.h);
    }
  });
});

describe('Campsite sideways', () => {
  it('fits the camp left of the buttons, clear of the Home column', () => {
    const { t, lay } = targets(sideways);
    expect(lay.cell).toBeGreaterThanOrEqual(100);
    expect(lay.first.x - lay.cell / 2).toBeGreaterThan(115);
    expect(lay.first.y + (N - 0.5) * lay.cell).toBeLessThanOrEqual(sideways.h);
    expect(lay.supply.y).toBeGreaterThan(lay.heading.y + 30);
    expect(lay.rowSignX + SIGN.w / 2).toBeLessThan(lay.check.x - BUTTON.w / 2);
    for (const x of t) {
      expect(x.x - x.w / 2).toBeGreaterThanOrEqual(0);
      expect(x.x + x.w / 2).toBeLessThanOrEqual(sideways.w);
      expect(x.y + x.h / 2).toBeLessThanOrEqual(sideways.h);
    }
  });
});
