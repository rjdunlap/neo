import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import { computeView, NO_INSETS } from '../../engine/view';
import { uprightProblems, UPRIGHT_VIEWS, type Target } from '../upright-check';
import { carryPitch, crowdHome, helpersLayout } from './layout';
import {
  CROWD,
  CREW,
  makeFruits,
  PLANS,
  partsOf,
  teamCenters,
  teamedPlan,
  TEAM_STEP,
  usesWhistle,
} from './logic';

/**
 * Little Helpers held upright (chunk 31, docs/definitions/phone-portrait.md): every level's fruits at the upright phone
 * views. Targets are the waiting crowd (100 circles, 124 for level 8's big three), the fruit's tap area, the whistle and
 * the ring badge (drawn only, but it must stand clear). Helpers holding on stand under the fruit: they are checked
 * against the edges, the crowd and the whistle, not the fruit they hold (a touch on one recalls it).
 */
const views = { ...UPRIGHT_VIEWS, minimum: computeView(768, 1024, NO_INSETS, true) };

describe.each(Object.entries(views))('Little Helpers upright on %s', (_, v) => {
  PLANS.forEach((plan) => {
    it(`level ${plan.level} (${plan.mode}): crowd, fruit, whistle, badge and carriers fit and stand apart`, () => {
      const teamed = teamedPlan(plan);
      const lay = helpersLayout(v, teamed);
      expect(lay.upright).toBe(true);
      const crowd: Target[] = [];
      for (let i = 0; i < CROWD; i++) {
        const big = plan.mode === 'strong' && i >= CREW.small;
        const p = crowdHome(v, i);
        crowd.push({
          what: `helper ${i}`,
          x: p.x,
          y: p.y - (big ? 30 : 24),
          w: big ? 124 : 100,
          h: big ? 124 : 100,
        });
      }
      for (const seed of [3, 7922, 15841]) {
        for (const f of makeFruits(plan, new Rng(seed))) {
          const t: Target[] = [...crowd];
          let wide = 0;
          let carryTop = 0;
          const size = Math.min(6, f.need);
          if (teamed) {
            const parts = partsOf(f);
            wide = parts.reduce((s, p) => s + p * TEAM_STEP + 30, 0) + 40;
            const top = -10 - Math.max(...parts) * 12 - 80;
            t.push({ what: 'fruits', x: lay.spot.x, y: lay.spot.y + top + 80, w: wide, h: 160 });
            // Each team stands under its fruit at the unchanged step; the whole row stays inside the view.
            const cs = teamCenters(parts);
            parts.forEach((p, g) => {
              const half = (p - 1) / 2;
              expect(lay.spot.x + cs[g] - half * TEAM_STEP - 50).toBeGreaterThanOrEqual(0);
              expect(lay.spot.x + cs[g] + half * TEAM_STEP + 50).toBeLessThanOrEqual(v.w);
            });
            carryTop = top;
          } else {
            const r = 60 + size * 16;
            t.push({ what: 'fruit', x: lay.spot.x, y: lay.spot.y - 10 - size * 12, w: r * 2, h: r * 2 });
            // The row of helpers holding on, one per tap at the upright pitch.
            const n = Math.max(plan.mode === 'strong' ? 0 : f.need, 1);
            const worst = plan.mode === 'strong' ? CROWD : n;
            const pitch = carryPitch(true, plan.mode === 'strong', worst, v.w);
            expect(pitch).toBeGreaterThanOrEqual(100 - 1e-6);
            expect(lay.spot.x - ((worst - 1) / 2) * pitch - 62).toBeGreaterThanOrEqual(0);
            expect(lay.spot.x + ((worst - 1) / 2) * pitch + 62).toBeLessThanOrEqual(v.w);
            const carry: Target[] = [];
            for (let i = 0; i < worst; i++)
              carry.push({
                what: `carrier ${i}`,
                x: lay.spot.x + (i - (worst - 1) / 2) * pitch,
                y: lay.spot.y + lay.carryDy - 24,
                w: 100,
                h: 100,
              });
            expect(
              uprightProblems(
                v,
                [...carry, ...crowd, { what: 'whistle', ...lay.whistle, w: 108, h: 108 }],
                100,
              ),
            ).toEqual([]);
          }
          if (usesWhistle(plan))
            t.push({ what: 'whistle', x: lay.whistle.x, y: lay.whistle.y, w: 108, h: 108 });
          if (plan.mode !== 'tap') {
            const bw = teamed
              ? 40 + f.need * 30 + (partsOf(f).length - 1) * 26
              : Math.max(100, 40 + Math.min(f.need, 8) * 34);
            t.push({ what: 'badge', x: lay.badge.x, y: lay.badge.y, w: bw, h: 108 });
          }
          expect(uprightProblems(v, t, 100), `need ${f.need}`).toEqual([]);
          // Teamed carriers' row sits clear of the crowd above it.
          if (teamed) expect(lay.spot.y + lay.carryDy + 26).toBeLessThan(crowdHome(v, 0).y - 74);
          void carryTop;
          // Hung up from the bottom edge: the lower crowd row is within 120 of it.
          expect(v.h - crowdHome(v, CROWD - 1).y).toBeLessThanOrEqual(120);
        }
      }
    });
  });
});

describe('Little Helpers sideways layout is unchanged', () => {
  it('keeps the crowd, fruit, whistle and basket where they were', () => {
    const v = computeView(1024, 768);
    const lay = helpersLayout(v, false);
    expect(lay.upright).toBe(false);
    expect(lay.spot).toEqual({ x: 563.2, y: 578 });
    expect(lay.whistle).toEqual({ x: 753.2, y: 368 });
    expect(lay.basket).toEqual({ x: 904, y: 648 });
    expect(crowdHome(v, 5)).toEqual({ x: 190 + 62 + 30, y: 648 });
    expect(carryPitch(undefined, true, 5, 1024)).toBe(66);
  });
});
