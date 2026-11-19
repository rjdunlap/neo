import { describe, expect, it } from 'vitest';
import { computeView, NO_INSETS } from '../../engine/view';
import { uprightProblems, UPRIGHT_VIEWS, square, type Target } from '../upright-check';
import { counterTopFor, TUB_R, tubSpotsFor } from './layout';
import {
  CONE_HIT,
  FRIEND_HIT,
  FRIEND_SCALE,
  LAP_OPENING,
  LEVELS,
  planFor,
  tubsShown,
  twoConeLayout,
} from './logic';

/**
 * Scoop Shop held upright (chunk 31, docs/definitions/phone-portrait.md): every level on the three upright phone views,
 * the captioned one and a short one. The targets are the ones a round asks for: the flavor tubs (each count the lap
 * opening shows, one more arriving per customer), the two friends and their cones on level 7, and the customers on
 * level 11 whose cone she picks.
 */
const views = { ...UPRIGHT_VIEWS, short: computeView(375, 601, NO_INSETS, true) };
const levels = [...new Set(Object.values(LEVELS).flatMap((l) => l.order ?? []))].sort((a, b) => a - b);

describe.each(Object.entries(views))('Scoop Shop upright on %s', (_, v) => {
  const top = counterTopFor(v);

  it.each(levels)(
    'level %i: tubs, friends and customers are whole, apart, in view and clear of Home and the guide',
    (level) => {
      const plan = planFor(level);
      const lap = level === LAP_OPENING;
      const counts = lap ? [1, 2, 3, 4].map((c) => tubsShown(level, c - 1, plan.flavors)) : [plan.flavors];
      for (const n of new Set(counts)) {
        const tubs: Target[] = tubSpotsFor(v, n, lap).map((p, i) =>
          square(`tub ${i + 1} of ${n}`, p, TUB_R * 2 * (lap && n === 1 ? 1.6 : 1)),
        );
        const t: Target[] = [...tubs];
        if (plan.mode === 'two') {
          for (const [i, s] of twoConeLayout(v.w, top, true).entries()) {
            t.push({
              what: `friend ${i + 1}`,
              x: s.friend.x,
              y: s.friend.y + FRIEND_HIT.y + FRIEND_HIT.h / 2,
              w: FRIEND_HIT.w * FRIEND_SCALE,
              h: FRIEND_HIT.h * FRIEND_SCALE,
            });
            t.push({
              what: `cone ${i + 1}`,
              x: s.cone.x,
              y: s.cone.y + CONE_HIT.y + CONE_HIT.h / 2,
              w: CONE_HIT.w,
              h: CONE_HIT.h,
            });
          }
        }
        if (plan.mode === 'customer') {
          for (const [i, f] of [0.25, 0.76].entries())
            t.push({ what: `customer ${i + 1}`, x: v.w * f, y: top + 18 - 170, w: 300, h: 340 });
        }
        expect(uprightProblems(v, t), `${n} tubs`).toEqual([]);
        for (const x of t) expect(x.y + x.h / 2, `${x.what} in view`).toBeLessThanOrEqual(v.h);
      }
    },
  );

  it('the tubs stand on the counter, and the counter is more than the tubs', () => {
    expect(tubSpotsFor(v, 6, false).every((p) => p.y - TUB_R > top + 30)).toBe(true);
    expect(top).toBeLessThan(v.h - 500);
  });
});
