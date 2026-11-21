import { describe, expect, it } from 'vitest';
import { computeView, NO_INSETS } from '../../engine/view';
import { captionPlace } from '../../ui/caption-layout';
import { square, uprightProblems, UPRIGHT_VIEWS } from '../upright-check';
import { BUTTON, crateLayout } from './layout';
import { specOf } from './logic';

const short = computeView(390, 630, NO_INSETS, true);
const views = { ...UPRIGHT_VIEWS, short };
const sideways = computeView(1024, 768, NO_INSETS, false);

/** The level's biggest stack (the spec's whole grid) and tray, as targets. */
function targets(view: ReturnType<typeof computeView>, level: number) {
  const s = specOf(level);
  const lay = crateLayout(view, s.rows, s.cols, s.fruit);
  const t = [] as ReturnType<typeof square>[];
  for (let r = 0; r < s.rows; r++)
    for (let c = 0; c < s.cols; c++)
      t.push(
        square(`crate ${r},${c}`, { x: lay.first.x + c * lay.cell, y: lay.first.y + r * lay.cell }, lay.cell),
      );
  lay.tray.at.forEach((p, i) => t.push(square(`fruit ${i + 1}`, p, lay.tray.size)));
  t.push({ what: 'hint', ...lay.hint, ...BUTTON });
  return { t, lay, s };
}

describe.each(Object.entries(views))('Sum Crates upright on %s', (_, view) => {
  it.each([1, 2, 3])('fits level %i', (level) => {
    const { t, lay, s } = targets(view, level);
    // Level 3 is the grown-up band's own: its floor is 64, and the stack and tray only shrink on a short view.
    expect(uprightProblems(view, t, level === 3 ? 64 : 100)).toEqual([]);
    if (level < 3) expect(lay.cell).toBeGreaterThanOrEqual(100);
    expect(lay.tray.size).toBeGreaterThanOrEqual(level < 3 ? 100 : 64);
    const caption = captionPlace(view, true);
    if (caption.mode === 'bubble' && caption.band) {
      const stackEnd = lay.first.y + (s.rows - 0.5) * lay.cell;
      expect(stackEnd).toBeLessThan(caption.band.y);
      expect(Math.max(...lay.tray.at.map((p) => p.y)) + lay.tray.size / 2).toBeLessThan(caption.band.y);
      expect(lay.hint.y - BUTTON.h / 2).toBeGreaterThan(caption.band.y + caption.band.h);
    }
  });
});

describe('Sum Crates sideways', () => {
  it.each([1, 2, 3])('fits level %i', (level) => {
    const { t, lay, s } = targets(sideways, level);
    expect(lay.cell).toBeGreaterThanOrEqual(100);
    expect(lay.first.x - lay.cell / 2 - 50).toBeGreaterThan(115);
    expect(lay.first.y + (s.rows - 0.5) * lay.cell).toBeLessThanOrEqual(sideways.h);
    for (const x of t) {
      expect(x.x - x.w / 2).toBeGreaterThanOrEqual(0);
      expect(x.x + x.w / 2).toBeLessThanOrEqual(sideways.w);
      expect(x.y + x.h / 2).toBeLessThanOrEqual(sideways.h);
    }
    // Nothing in the stack's columns is touched by the tray column.
    const stackRight = lay.first.x + (s.cols - 0.5) * lay.cell;
    expect(Math.min(...lay.tray.at.map((p) => p.x)) - lay.tray.size / 2).toBeGreaterThan(stackRight);
  });
});
