import { describe, expect, it } from 'vitest';
import { computeView, NO_INSETS } from '../../engine/view';
import { square, thumbPx, uprightProblems, UPRIGHT_VIEWS, type Target } from '../upright-check';
import { marketLayout, townSpot } from './layout';
import { FAIR, planFor } from './logic';

const views = { ...UPRIGHT_VIEWS, minimum: computeView(768, 1024, NO_INSETS, true) };
const sideways = computeView(1024, 768, NO_INSETS);

function targets(level: number, v: Parameters<typeof marketLayout>[0]): Target[] {
  const plan = planFor(level);
  const L = marketLayout(v, plan.offered);
  const t: Target[] = FAIR.towns.map((town, i) => square(`town ${i}`, townSpot(L, town), L.town));
  L.tray.forEach((p, i) => t.push(square(`banner ${i}`, p, L.banner)));
  L.buttons.slice(0, level >= 3 ? 4 : 3).forEach((p, i) => t.push(square(`button ${i}`, p, L.button)));
  return t;
}

describe.each(Object.entries(views))('Market Days upright on %s', (_, v) => {
  [1, 2, 3].forEach((level) => {
    it(`level ${level}: towns, banners and buttons fit, stand apart and clear the corners`, () => {
      expect(uprightProblems(v, targets(level, v), 100)).toEqual([]);
      expect(thumbPx(marketLayout(v, 3).town)).toBeGreaterThanOrEqual(44);
    });
  });
});

describe('Market Days sideways (1024 × 768)', () => {
  [1, 2, 3].forEach((level) => {
    it(`level ${level} fits and stands apart`, () => {
      expect(uprightProblems(sideways, targets(level, sideways), 100)).toEqual([]);
    });
  });
});
