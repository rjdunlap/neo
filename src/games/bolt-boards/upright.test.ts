import { describe, expect, it } from 'vitest';
import { computeView, NO_INSETS } from '../../engine/view';
import { uprightProblems, UPRIGHT_VIEWS, type Target } from '../upright-check';
import {
  boardLayout,
  cardLayout,
  CARD_H,
  CARD_W,
  HIT,
  PLANS,
  toView,
  WALL_H,
  WALL_W,
  woodpileLayout,
  type Rect,
} from './logic';
import { PUZZLES } from './puzzles';

/**
 * Bolt Boards held upright (chunk 31, docs/definitions/phone-portrait.md): every board set of all nine levels at the
 * upright phone views. The tap targets are the bolts (a 60-unit reach, so 120 wide), the holes a lifted bolt can go to,
 * the undo arrow and, at level 9, the woodpile slots and the picture card's clearance. The basket and toolbox are
 * drawn only; they take no touch.
 */
const views = { ...UPRIGHT_VIEWS, minimum: computeView(768, 1024, NO_INSETS, true) };
const UNDO = 108;

describe.each(Object.entries(views))('Bolt Boards upright on %s', (_, v) => {
  for (const plan of PLANS) {
    const build = !!plan.build;
    const L = boardLayout(v, build);
    const sets = plan.build ? [PUZZLES[9][0]] : PUZZLES[plan.id];

    describe(`level ${plan.id}`, () => {
      it('draws the wall inside the view, clear of the Home column, the guide and the strip', () => {
        const w = WALL_W * L.scale,
          h = WALL_H * L.scale;
        expect(uprightProblems(v, [{ what: 'wall', x: L.x + w / 2, y: L.y + h / 2, w, h }])).toEqual([]);
        expect(L.y + h).toBeLessThanOrEqual(v.h - 150);
      });

      it('keeps the undo arrow its own target, off the guide and the right edge', () => {
        expect(uprightProblems(v, [{ what: 'undo', x: L.undo.x, y: L.undo.y, w: UNDO, h: UNDO }])).toEqual(
          [],
        );
        // The toolbox and basket are drawn there (levels 1–8), not tapped, but must not run together.
        if (!build) expect(L.undo.x - L.toolbox.x).toBeGreaterThanOrEqual(UNDO);
      });

      it.each(sets.map((p, i) => [i, p] as const))(
        'puts every bolt and hole of set %s on screen',
        (_i, p) => {
          const ts: Target[] = [];
          for (const [i, b] of p.bolts.entries()) {
            const q = toView(L, b);
            ts.push({ what: `bolt ${i}`, x: q.x, y: q.y, w: 2 * HIT * L.scale, h: 2 * HIT * L.scale });
          }
          for (const t of ts) expect(uprightProblems(v, [t]), t.what).toEqual([]);
          for (const [i, h] of p.holes.entries()) {
            const q = toView(L, h);
            expect(
              uprightProblems(v, [
                { what: `hole ${i}`, x: q.x, y: q.y, w: 2 * HIT * L.scale, h: 2 * HIT * L.scale },
              ]),
            ).toEqual([]);
          }
        },
      );

      if (build) {
        it('keeps a woodpile slot per board, each 100 wide and tall, clear of the guide and the undo arrow', () => {
          for (const p of [PUZZLES[3][0], PUZZLES[4][0], PUZZLES[9][0]]) {
            const slots = woodpileLayout(v, p.boards.length);
            const ts: Target[] = slots.map((r: Rect, k) => ({
              what: `slot ${k}`,
              x: r.x + r.w / 2,
              y: r.y + r.h / 2,
              w: r.w - 1e-6,
              h: r.h,
            }));
            expect(uprightProblems(v, ts)).toEqual([]);
            const undo = { x: L.undo.x - UNDO / 2, y: L.undo.y - UNDO / 2 };
            for (const r of slots) expect(r.x + r.w).toBeLessThanOrEqual(undo.x);
          }
        });

        it('puts the picture card on screen, clear of the wall, the Home column and the woodpile', () => {
          const c = cardLayout(v, L);
          expect(c.w).toBe(CARD_W);
          expect(c.h).toBe(CARD_H);
          expect(
            uprightProblems(v, [{ what: 'card', x: c.x + c.w / 2, y: c.y + c.h / 2, w: c.w, h: c.h }]),
          ).toEqual([]);
          const wall = { x: L.x, y: L.y, w: WALL_W * L.scale, h: WALL_H * L.scale };
          const apart =
            c.x + c.w <= wall.x || wall.x + wall.w <= c.x || c.y + c.h <= wall.y || wall.y + wall.h <= c.y;
          expect(apart).toBe(true);
        });
      }
    });
  }
});
