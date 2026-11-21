import { describe, expect, it } from 'vitest';
import { computeView, NO_INSETS } from '../../engine/view';
import { UPRIGHT_VIEWS, uprightProblems, type Target } from '../upright-check';
import { downLayout } from './layout';

const views = {
  sideways: computeView(1024, 768, NO_INSETS),
  minimum: computeView(768, 1024, NO_INSETS, true),
  ...UPRIGHT_VIEWS,
};

describe.each(Object.entries(views))('Down We Go layout on %s', (_, v) => {
  it.each([3, 4, 5])('fits %i knots with 100-unit targets clear of the chrome', (n) => {
    const L = downLayout(v, n);
    expect(L).not.toBeNull();
    const t: Target[] = [
      ...L!.ledges.map((p, k) => ({ what: `ledge ${k}`, x: p.x, y: p.y, w: L!.ledge.w, h: L!.ledge.h })),
      ...L!.knots.map((p, k) => ({ what: `knot ${k}`, x: p.x, y: p.y, w: 120, h: L!.band })),
    ];
    expect(L!.band).toBeGreaterThanOrEqual(112);
    expect(uprightProblems(v, t, 100)).toEqual([]);
  });

  it('keeps level 3 plates and level 4 cards at their sizes, clear of each other and the chrome', () => {
    const L = downLayout(v, 5)!;
    const plates: Target[] = L.plates.map((p, k) => ({
      what: `plate ${k}`,
      x: p.x,
      y: p.y,
      w: L.plate.w,
      h: L.plate.h,
    }));
    const cards: Target[] = L.cards.map((p, k) => ({
      what: `card ${k}`,
      x: p.x,
      y: p.y,
      w: L.card.w,
      h: L.card.h,
    }));
    expect(L.plate.w).toBeGreaterThanOrEqual(150);
    expect(L.plate.h).toBeGreaterThanOrEqual(130);
    expect(L.card.w).toBeGreaterThanOrEqual(150);
    expect(L.card.h).toBeGreaterThanOrEqual(150);
    expect(uprightProblems(v, plates, 100)).toEqual([]);
    expect(uprightProblems(v, cards, 100)).toEqual([]);
  });
});

it('returns null rather than squeeze a band under 112 units', () => {
  expect(downLayout({ w: 1024, h: 500 }, 5)).toBeNull();
});
