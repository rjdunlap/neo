import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import { computeView, NO_INSETS } from '../../engine/view';
import { uprightProblems, UPRIGHT_VIEWS, type Target } from '../upright-check';
import { freePieces, fullMask, HEADER, HIT, pileLayout, PLANS, SLOT_H, UPRIGHT_ROW_UP } from './logic';
import { SHAPES } from './shapes';

/**
 * Pile Match held upright (chunk 31, docs/definitions/phone-portrait.md): every level, every heap shape, at the upright
 * phone views. The tap targets are the free pieces (a 120-unit hit area, shrunk with the heap when it must be), the
 * tray's slots and the basket; the tray row rests above the pet's corner and the heap hangs between it and the header.
 */
const views = { ...UPRIGHT_VIEWS, minimum: computeView(768, 1024, NO_INSETS, true) };

describe.each(Object.entries(views))('Pile Match upright on %s', (_, v) => {
  describe.each(PLANS)('level $id', (plan) => {
    SHAPES[plan.id].forEach((cells, shape) => {
      const L = pileLayout(cells, plan.tray, plan.asked, v);

      it(`shape ${shape}: keeps the tray row above the pet's corner, inside the view`, () => {
        const rects = [...L.slots, L.basket];
        for (const r of rects) {
          expect(r.x).toBeGreaterThanOrEqual(0);
          expect(r.x + r.w).toBeLessThanOrEqual(v.w);
          expect(r.y + r.h).toBe(v.h - UPRIGHT_ROW_UP);
          expect(r.h).toBe(SLOT_H);
        }
        const targets: Target[] = rects.map((r, i) => ({
          what: i < L.slots.length ? `slot ${i + 1}` : 'basket',
          x: r.x + r.w / 2,
          y: r.y + r.h / 2,
          w: r.w,
          h: r.h,
        }));
        expect(uprightProblems(v, targets), `level ${plan.id}`).toEqual([]);
      });

      it(`shape ${shape}: keeps the heap whole-size, under the header and above the tray`, () => {
        expect(L.scale).toBeGreaterThanOrEqual(1);
        for (const p of L.pieces) {
          expect(p.x - 56).toBeGreaterThanOrEqual(0);
          expect(p.x + 56).toBeLessThanOrEqual(v.w);
          expect(p.y - 56).toBeGreaterThanOrEqual(HEADER);
          expect(p.y + 56).toBeLessThanOrEqual(L.slots[0].y - 20);
        }
      });

      it(`shape ${shape}: keeps every free piece's tap area apart and clear of the chrome`, () => {
        const rng = new Rng(plan.id * 100 + shape);
        for (let k = 0; k < 20; k++) {
          const mask = k === 0 ? fullMask(cells.length) : rng.int(0, fullMask(cells.length));
          const open = freePieces(cells, mask);
          const targets: Target[] = open.map((i) => ({
            what: `piece ${i}`,
            ...L.pieces[i],
            w: 2 * HIT * L.scale,
            h: 2 * HIT * L.scale,
          }));
          expect(uprightProblems(v, targets), `level ${plan.id} mask ${mask}`).toEqual([]);
        }
      });
    });
  });
});
