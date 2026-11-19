import { describe, expect, it } from 'vitest';
import { computeView, NO_INSETS } from '../../engine/view';
import { square, uprightProblems, UPRIGHT_VIEWS, type Target } from '../upright-check';
import {
  FOLD_RADIUS,
  foldButtonPlace,
  PLANS,
  POT_RADIUS,
  potLayout,
  pours,
  whitePot,
  WHEEL_REACH,
  wheelLayout,
} from './logic';

/**
 * Rainbow Fingers held upright (chunk 31, docs/definitions/phone-portrait.md): levels 1–11 on every upright phone view
 * (level 12, the paint-card match, centres its own board and was already upright). The touch targets are the paint pots
 * (104 across, a ring of radius 52), the bowl the mixing levels pour into, the hang-it-up button and the fold button; the
 * paper itself takes any touch. The pictures must sit in the paper clear of the pots, and the wheel above them.
 */
const views = { ...UPRIGHT_VIEWS, minimum: computeView(768, 1024, NO_INSETS, true) };

describe.each(Object.entries(views))('Rainbow Fingers upright on %s', (_, v) => {
  PLANS.slice(0, 11).forEach((plan, i) => {
    it(`level ${i + 1} (${plan.mode}): pots, buttons and pictures fit clear of Home and the guide`, () => {
      const targets: Target[] = [];
      const mixing = pours(plan.mode);
      const n = plan.mode === 'free' ? 0 : mixing ? (whitePot(plan) ? 4 : 3) : 7;
      const at = potLayout(n, v.w, v.h, mixing);
      at.pots.forEach((p, k) => targets.push(square(`pot ${k}`, p, POT_RADIUS * 2)));
      if (at.bowl) targets.push(square('bowl', at.bowl, 100));
      targets.push(square('hang it up', { x: v.w - 80, y: 80 }, 104));
      if (plan.mode === 'free') {
        const fold = foldButtonPlace(v.w, v.h);
        targets.push(square('fold', fold, FOLD_RADIUS * 2));
      }
      expect(uprightProblems(v, targets)).toEqual([]);
      // The pot rows stay inside the view.
      if (at.pots.length) expect(Math.max(...at.pots.map((p) => p.y)) + POT_RADIUS).toBeLessThanOrEqual(v.h);
      // The wheel sits above the pot row.
      if (plan.mode === 'wheel') {
        const w = wheelLayout(v.w, v.h);
        const r = WHEEL_REACH * w.scale;
        expect(w.x - r).toBeGreaterThanOrEqual(18);
        expect(w.x + r).toBeLessThanOrEqual(v.w - 18);
        expect(w.y - r).toBeGreaterThanOrEqual(18);
        const top = Math.min(...at.pots.map((p) => p.y)) - POT_RADIUS;
        expect(w.y + r).toBeLessThan(top);
      }
    });
  });

  it('the fold button clears the top row of pots', () => {
    const fold = foldButtonPlace(v.w, v.h);
    const pots = potLayout(7, v.w, v.h).pots;
    const top = Math.min(...pots.map((p) => p.y)) - POT_RADIUS;
    expect(fold.y + FOLD_RADIUS).toBeLessThan(top);
    expect(fold.y - FOLD_RADIUS).toBeGreaterThan(210);
  });

  it('level 12 (match): the 632 × 516 card, centred, stays inside the view and clear of Home and the guide', () => {
    const [cx, cy] = [v.w / 2, v.h / 2 + 36];
    const [x0, x1, y0, y1] = [cx - 316, cx + 316, cy - 290, cy + 226];
    expect(x0).toBeGreaterThanOrEqual(0);
    expect(x1).toBeLessThanOrEqual(v.w);
    expect(y0).toBeGreaterThan(210);
    expect(y1).toBeLessThan(v.h - 170);
    // Its pots (radius 52 at ±77, 155) and the two 158 × 144 buttons (at ±219) are inside the card.
    for (const [dx, dy, r] of [
      [-77, 155, 52],
      [77, 155, 52],
      [219, 16, 79],
      [-219, 16, 73],
    ] as const) {
      expect(cx + dx - r).toBeGreaterThan(x0);
      expect(cx + dx + r).toBeLessThan(x1);
      expect(cy + dy + r).toBeLessThan(y1 + 60);
    }
  });
});
