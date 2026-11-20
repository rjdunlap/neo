import { describe, expect, it } from 'vitest';
import { computeView } from '../../engine/view';
import { captionPlace } from '../../ui/caption-layout';
import { UPRIGHT_VIEWS, uprightProblems } from '../upright-check';
import { CELLS, cellAt, cellRect, centre, meadowLayout, targets } from './logic';

const views = {
  ...UPRIGHT_VIEWS,
  short: computeView(390, 625, undefined, true),
  minimum: computeView(768, 1024, undefined, true),
};

describe.each(Object.entries(views))('Meadow Pens upright: %s', (_, view) => {
  it.each([1, 2, 3, 4, 5])('fits every level %i target and keeps the caption clear', (level) => {
    const layout = meadowLayout(view, level);
    expect(layout).not.toBeNull();
    if (!layout) return;
    const rectangles = targets(layout);
    expect(
      uprightProblems(
        view,
        rectangles.map((r, i) => ({ ...r, ...centre(r), what: `target ${i}` })),
      ),
    ).toEqual([]);
    const { mode, band } = captionPlace(view, true);
    expect(layout.tall).toBe(mode === 'strip');
    if (mode === 'bubble' && band) {
      for (const r of [...rectangles, layout.gate, ...(layout.stack ? [layout.stack] : [])]) {
        expect(r.y + r.h <= band.y || r.y >= band.y + band.h || r.x >= band.x + band.w).toBe(true);
      }
    }
    for (let cell = 0; cell < CELLS; cell++) {
      const rect = cellRect(layout, cell);
      const p = centre(rect);
      expect(rect.w).toBeGreaterThanOrEqual(100);
      expect(rect.h).toBeGreaterThanOrEqual(100);
      expect(cellAt(layout, p.x, p.y)).toBe(cell);
    }
  });
});
