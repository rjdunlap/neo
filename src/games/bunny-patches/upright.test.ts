import { describe, expect, it } from 'vitest';
import { computeView, NO_INSETS } from '../../engine/view';
import { captionPlace } from '../../ui/caption-layout';
import { square, uprightProblems, UPRIGHT_VIEWS } from '../upright-check';
import { BUTTON, bunnyLayout } from './layout';
import { sizeOf } from './logic';

const short = computeView(390, 630, NO_INSETS, true);
const views = { ...UPRIGHT_VIEWS, short };
const sideways = computeView(1024, 768, NO_INSETS, false);

function targets(view: ReturnType<typeof computeView>, level: number) {
  const n = sizeOf(level);
  const { cell, first, lamp, hint } = bunnyLayout(view, n);
  const t = Array.from({ length: n * n }, (_, at) =>
    square(`square ${at}`, { x: first.x + (at % n) * cell, y: first.y + Math.floor(at / n) * cell }, cell),
  );
  t.push({ what: 'hint', ...hint, ...BUTTON });
  if (level >= 3) t.push({ what: 'lamp', ...lamp, ...BUTTON });
  return { t, cell, first, n, hint };
}

describe.each(Object.entries(views))('Bunny Patches upright on %s', (_, view) => {
  it.each([1, 2, 3])('fits level %i with squares of 100 units or more', (level) => {
    const { t, cell, first, n, hint } = targets(view, level);
    expect(uprightProblems(view, t)).toEqual([]);
    expect(cell).toBeGreaterThanOrEqual(100);
    const caption = captionPlace(view, true);
    if (caption.mode === 'bubble' && caption.band) {
      expect(first.y + (n - 0.5) * cell).toBeLessThan(caption.band.y);
      expect(hint.y - BUTTON.h / 2).toBeGreaterThan(caption.band.y + caption.band.h);
    }
  });
});

describe('Bunny Patches sideways', () => {
  it.each([1, 2, 3])('fits level %i', (level) => {
    const { t, cell, first, n } = targets(sideways, level);
    expect(cell).toBeGreaterThanOrEqual(100);
    expect(first.x - cell / 2).toBeGreaterThan(115);
    expect(first.y - cell / 2).toBeGreaterThan(70);
    expect(first.y + (n - 0.5) * cell).toBeLessThanOrEqual(sideways.h);
    for (const x of t) {
      expect(x.x - x.w / 2).toBeGreaterThanOrEqual(0);
      expect(x.x + x.w / 2).toBeLessThanOrEqual(sideways.w);
    }
  });
});
