import { describe, expect, it } from 'vitest';
import { computeView, NO_INSETS } from '../../engine/view';
import { square, uprightProblems, UPRIGHT_VIEWS, type Target } from '../upright-check';
import { AWNING, BELL_HIT, CARD_HIT, COIN_HIT, MAT_BOX, PLANS, purseFor, stallLayout } from './logic';

/**
 * Market Stall held upright (chunk 31, docs/definitions/phone-portrait.md): every level on the upright phone views. The
 * targets are the coins of the purse (on the purse level, the number cards), the payment mat and the bell; the stall's awning must start below Home and "?", and
 * its front must end above the purse.
 */
const views = {
  ...UPRIGHT_VIEWS,
  short: computeView(375, 601, NO_INSETS, true),
  tallest: computeView(360, 800, NO_INSETS, true),
};

describe.each(Object.entries(views))('Market Stall upright on %s', (_, v) => {
  it.each(PLANS.map((p, i) => [i + 1, p] as const))(
    'level %i: coins, mat and bell are whole, apart and clear',
    (_l, plan) => {
      const { cx, cy } = stallLayout(v);
      // A purse level has three number cards where the coins stand, and no bell.
      const t: Target[] =
        plan.mode === 'purse'
          ? purseFor(v, 3).map((p, i) => ({ what: `card ${i + 1}`, x: p.x, y: p.y, ...CARD_HIT }))
          : purseFor(v, plan.coins.length).map((p, i) => square(`coin ${i + 1}`, p, COIN_HIT));
      t.push({ what: 'mat', x: cx - 50, y: cy + 140, w: MAT_BOX.w, h: MAT_BOX.h });
      if (plan.mode !== 'purse')
        t.push(square('bell', { x: cx + MAT_BOX.w / 2 + 30, y: cy + 140 }, BELL_HIT));
      expect(uprightProblems(v, t)).toEqual([]);
    },
  );

  it('puts the awning below Home and the counter front above the purse', () => {
    const { cy, awningTop } = stallLayout(v);
    expect(awningTop).toBeGreaterThanOrEqual(210);
    expect(awningTop).toBe(cy - AWNING.drop);
    expect(cy + 250).toBeLessThanOrEqual(v.h - 85 - COIN_HIT / 2);
  });
});
