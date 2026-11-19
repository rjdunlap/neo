import { describe, expect, it } from 'vitest';
import { computeView, spread, NO_INSETS } from '../../engine/view';
import { uprightProblems, UPRIGHT_VIEWS, square, type Target } from '../upright-check';
import { BUTTON_R, COUNTER, kitchenLayout } from './layout';
import { PLANS, planFor, SHAPES_LEVEL, CUP_LEVEL, DEAL_LEVEL } from './logic';

/**
 * Pet Kitchen held upright (chunk 31, docs/definitions/phone-portrait.md): every level on the three upright phone views,
 * the captioned one and a short one, in each moment of a round: the food uncut (the cut pictures, the plates, the food),
 * then cut (the loose pieces on the counter, the plates, Serve and Cut again), and a recipe's scoops and Undo.
 */
const views = { ...UPRIGHT_VIEWS, short: computeView(375, 601, NO_INSETS, true) };
const levels = [...PLANS.map((_, i) => i + 1), SHAPES_LEVEL, CUP_LEVEL];

describe.each(Object.entries(views))('Pet Kitchen upright on %s', (_, v) => {
  const lay = kitchenLayout(v);
  const btn = (what: string, p: { x: number; y: number }) => square(what, p, BUTTON_R * 2);

  it.each(levels)('level %i: every moment is whole, apart, in view and clear of Home and the guide', (level) => {
    const plan = planFor(level) as { mode: string; friends: number; wholes: number; cuts: readonly number[] };
    const plates: Target[] = spread(plan.friends, 180, v.w - 50, 185).map((x, i) =>
      square(`plate ${i + 1}`, { x, y: lay.plateY }, 120),
    );
    const moments: Record<string, Target[]> = {};
    if (plan.mode === 'recipe' || plan.mode === 'half-recipe' || plan.mode === 'cup') {
      const scoops = [-1, 1].map((s, i) => square(`scoop ${i + 1}`, { x: v.w / 2 + s * 130, y: v.h - 95 }, 110));
      moments.recipe = [...scoops, btn('Serve', lay.serve), btn('Undo', lay.undo)];
    } else if (plan.mode === 'deal') {
      moments.deal = [...plates, ...piecesAt(lay, 4)];
    } else {
      const n = level === 11 ? 2 : plan.cuts.length;
      const cuts: Target[] =
        level === SHAPES_LEVEL
          ? [0, 1].map((i) => btn(`cut ${i + 1}`, { x: v.w - 75, y: 200 + i * 120 }))
          : spread(n, 250, v.w - 180, 200).map((x, i) => btn(`cut ${i + 1}`, { x, y: v.h - 110 }));
      const showsPlates = level === SHAPES_LEVEL || level === 13;
      moments.uncut = [
        ...cuts,
        btn('Serve', lay.serve),
        ...(showsPlates ? plates : []),
        ...wholes(plan.wholes, lay, v.w, showsPlates),
      ];
      const pieces = plan.wholes * Math.max(...plan.cuts);
      moments.cut = [...plates, ...piecesAt(lay, pieces), btn('Serve', lay.serve), btn('Cut again', lay.recut)];
    }
    for (const [moment, t] of Object.entries(moments)) {
      expect(uprightProblems(v, t), `level ${level} ${moment}`).toEqual([]);
      for (const x of t) expect(x.y + x.h / 2, `${x.what} in view`).toBeLessThanOrEqual(v.h);
    }
  });

  it('the round-ending arrow stands up from the bottom edge, and the plates sit above the counter', () => {
    expect(lay.serve.y).toBeGreaterThan(v.h * 0.6);
    expect(lay.undo.y).toBeGreaterThan(v.h * 0.6);
    expect(lay.wholesY).toBeLessThanOrEqual(v.h - COUNTER - 72);
    expect(lay.plateY + 60).toBeLessThan(v.h - COUNTER);
    expect(DEAL_LEVEL).toBe(10);
  });
});

function piecesAt(lay: ReturnType<typeof kitchenLayout>, n: number): Target[] {
  return Array.from({ length: n }, (_, i) =>
    square(`piece ${i + 1}`, { x: lay.pieceXs[i % 4], y: lay.pieceY - Math.floor(i / 4) * 125 }, 100),
  );
}

function wholes(n: number, lay: ReturnType<typeof kitchenLayout>, w: number, onPlates: boolean): Target[] {
  return Array.from({ length: n }, (_, i) =>
    square(`food ${i + 1}`, { x: w / 2 + (i - (n - 1) / 2) * 240, y: onPlates ? lay.wholesY : lay.foodY }, 180),
  );
}
