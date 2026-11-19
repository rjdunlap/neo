import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import { computeView, NO_INSETS } from '../../engine/view';
import { uprightProblems, UPRIGHT_VIEWS } from '../upright-check';
import {
  boardsFor,
  cutsFor,
  EDGE,
  layoutFor,
  MARK_HIT,
  OWN_BOX,
  OWN_PICTURE,
  OWN_XS,
  OWN_Y,
  ownChoicesFor,
  PLANS,
  pictureCut,
  petCorner,
  RING_R,
  splitBoardsFor,
  startOf,
  tolerance,
  type Cut,
} from './logic';

/**
 * Cut Along held upright (chunk 31, docs/definitions/phone-portrait.md): every level at the upright phone views. The
 * paper sits under the picture and takes the full width less its ring room, stopping above the pet. The tap targets are the
 * start rings (116 units across), the thumb-sized choices of levels 8, 10 and 11, and the snip marks of level 1.
 */
const views = { ...UPRIGHT_VIEWS, minimum: computeView(768, 1024, NO_INSETS, true) };
const SEEDS = [3, 7922, 15841, 23760, 31679, 39598];

function allCuts(level: number, seed: number): Cut[] {
  if (level === 8) return boardsFor(new Rng(seed)).flatMap((b) => b.cuts);
  if (level === 10) return splitBoardsFor(new Rng(seed)).flatMap((b) => b.cuts);
  if (level === 11) return ownChoicesFor(new Rng(seed)).flat().map(pictureCut);
  return cutsFor(level, new Rng(seed));
}

describe.each(Object.entries(views))('Cut Along upright on %s', (_, v) => {
  PLANS.forEach((plan, i) => {
    const level = i + 1;
    describe(`level ${level}`, () => {
      const { paper, picture } = layoutFor(v, level);

      it('keeps the paper at least 420 tall, with its ring room inside the view and clear of Home, the pet and the picture', () => {
        expect(paper.s).toBeGreaterThanOrEqual(420);
        const room = {
          what: 'paper and ring room',
          x: paper.x - EDGE,
          y: paper.y,
          w: paper.w + 2 * EDGE,
          h: paper.h + EDGE,
        };
        const t = { ...room, x: room.x + room.w / 2, y: room.y + room.h / 2 };
        expect(uprightProblems(v, [t])).toEqual([]);
        expect(room.y + room.h).toBeLessThanOrEqual(v.h - petCorner(v).h);
        expect(room.y).toBeGreaterThanOrEqual(picture.y + picture.h);
        expect(
          uprightProblems(
            v,
            [
              {
                what: 'picture',
                x: picture.x + picture.w / 2,
                y: picture.y + picture.h / 2,
                w: picture.w,
                h: picture.h,
              },
            ],
            200,
          ),
        ).toEqual([]);
        if (level === 11) expect(picture.w).toBeGreaterThanOrEqual(Math.min(OWN_PICTURE, 240));
      });

      it('keeps the corridor at least 30 units wide', () => {
        expect(tolerance(level) * paper.s).toBeGreaterThanOrEqual(30);
      });

      if (plan.mode === 'snip')
        it('gives each snip mark a thumb-sized box on the paper', () => {
          expect(Math.min(MARK_HIT.w, MARK_HIT.h)).toBeGreaterThanOrEqual(100);
        });
      else if (plan.mode === 'own')
        it('gives each offered shape a box at least 100 units across on the paper', () => {
          expect(2 * OWN_BOX * paper.s).toBeGreaterThanOrEqual(100);
          for (const x of OWN_XS)
            expect(
              uprightProblems(v, [
                {
                  what: 'shape',
                  x: paper.x + x * paper.s,
                  y: paper.y + OWN_Y * paper.s,
                  w: 2 * OWN_BOX * paper.s,
                  h: 2 * OWN_BOX * paper.s,
                },
              ]),
            ).toEqual([]);
        });
      else
        it('puts every start ring inside the view, 116 across and clear of the others', () => {
          for (const seed of SEEDS) {
            const rings = allCuts(level, seed).map((c) => {
              const [x, y] = startOf(c);
              return {
                what: 'ring',
                x: paper.x + x * paper.s,
                y: paper.y + y * paper.s,
                w: 2 * RING_R,
                h: 2 * RING_R,
              };
            });
            // Spacing between rings of one board is in paper units, so logic.test.ts checks it once; the paper here is never smaller.
            for (const r of rings) expect(uprightProblems(v, [r], 110), `seed ${seed}`).toEqual([]);
          }
        });
    });
  });
});
