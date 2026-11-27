import { describe, expect, it } from 'vitest';
import { computeView, NO_INSETS } from '../../engine/view';
import { square, thumbPx, uprightProblems, UPRIGHT_VIEWS, type Target } from '../upright-check';
import { tabletsLayout } from './layout';
import { caseFor } from './logic';

const views = { ...UPRIGHT_VIEWS, minimum: computeView(768, 1024, NO_INSETS, true) };
const sideways = computeView(1024, 768, NO_INSETS);

export function targets(level: number, v: Parameters<typeof tabletsLayout>[0]): Target[] {
  const def = caseFor(level);
  const L = tabletsLayout(v, def.crib.length, def.groups.length);
  const t: Target[] = [];
  L.cribPic.forEach((p, i) => t.push(square(`picture ${i}`, p, L.cell)));
  L.cribSigns.forEach((row, i) => row.forEach((p, k) => t.push(square(`crib sign ${i}.${k}`, p, L.cell))));
  L.groups.forEach((g, i) => {
    g.signs.forEach((p, k) => t.push(square(`group ${i} sign ${k}`, p, L.cell)));
    g.cands.forEach((p, k) => t.push(square(`group ${i} card ${k}`, p, L.cell)));
  });
  L.buttons.forEach((p, i) => t.push(square(`button ${i}`, p, L.button)));
  return t;
}

describe.each(Object.entries(views))('Two Tablets upright on %s', (_, v) => {
  [1, 2].forEach((level) => {
    it(`level ${level}: pictures, signs, cards and buttons fit, stand apart and clear the corners`, () => {
      expect(uprightProblems(v, targets(level, v), 100)).toEqual([]);
      expect(thumbPx(tabletsLayout(v, 4, 1).cell)).toBeGreaterThanOrEqual(44);
    });
  });
});

describe('Two Tablets sideways (1024 × 768)', () => {
  [1, 2].forEach((level) => {
    it(`level ${level} fits and stands apart`, () => {
      expect(uprightProblems(sideways, targets(level, sideways), 100)).toEqual([]);
    });
  });
});
