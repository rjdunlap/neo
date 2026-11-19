import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import { computeView, NO_INSETS } from '../../engine/view';
import { uprightProblems, UPRIGHT_VIEWS, type Target } from '../upright-check';
import { dominoLayout, makeRound, PITCH, PLANS, slotBox, TRAY_W } from './logic';

/**
 * Domino Run held upright (chunk 31, docs/definitions/phone-portrait.md): every level's lines at the upright phone views.
 * The targets are each lane's slot columns (100 × 180: the starter, her sockets, the guessable pinned dominoes) and the
 * tray places she drags from (124 × 160); the lane's sand, bell and puddles are drawn, never tapped.
 */
const views = { ...UPRIGHT_VIEWS, minimum: computeView(768, 1024, NO_INSETS, true) };
const SEEDS = [3, 7922, 15841, 23760, 31679, 39598];

describe.each(Object.entries(views))('Domino Run upright on %s', (_, v) => {
  PLANS.forEach((plan) => {
    it(`level ${plan.id} (${plan.name}): slots and tray fit the view, clear of Home and the guide, never overlapping`, () => {
      for (const seed of SEEDS) {
        for (const line of makeRound(plan, new Rng(seed), 3)) {
          const lay = dominoLayout(line.lanes.length, v, line.tray.length);
          expect(lay.portrait).toBe(true);
          const targets: Target[] = [];
          line.lanes.forEach((lane, k) => {
            for (let s = 0; s < lane.n; s++) {
              const b = slotBox(lay.lanes[k], s);
              targets.push({
                what: `lane ${k} slot ${s}`,
                x: b.x + b.w / 2,
                y: b.y + b.h / 2,
                w: b.w,
                h: b.h,
              });
            }
            // The bell's own column and the sand under the lane stay inside the view too.
            const end = lay.lanes[k].x0 + lane.n * PITCH;
            expect(end + PITCH / 2).toBeLessThanOrEqual(v.w);
          });
          lay.tray.slice(0, line.tray.length).forEach((t, i) => {
            targets.push({
              what: `tray ${i}`,
              x: t.hit.x + t.hit.w / 2,
              y: t.hit.y + t.hit.h / 2,
              w: t.hit.w,
              h: t.hit.h,
            });
          });
          expect(line.tray.length).toBeLessThanOrEqual(3);
          expect(uprightProblems(v, targets), `seed ${seed}`).toEqual([]);
          // The tray rests below the last lane, and the second lane below the first.
          const last = lay.lanes[lay.lanes.length - 1].base;
          expect(lay.tray[0].hit.y).toBeGreaterThan(last);
          expect(TRAY_W).toBeGreaterThanOrEqual(100);
          // Hung up from the bottom edge: the tray rests within 100 units of it, never mid-screen on a tall phone.
          expect(v.h - (lay.tray[0].hit.y + lay.tray[0].hit.h)).toBeLessThanOrEqual(100 + 1e-6);
        }
      }
    });
  });
});
