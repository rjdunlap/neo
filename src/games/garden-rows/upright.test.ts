import { describe, expect, it } from 'vitest';
import { computeView, NO_INSETS } from '../../engine/view';
import type { Band } from '../../progress/bands';
import { levelsInOrder, rangeFor } from '../../progress/difficulty';
import { square, uprightProblems, UPRIGHT_VIEWS, type Target } from '../upright-check';
import { CELL, gardenLayout, LEVELS, PACKET, planFor, rowsOf } from './logic';

/**
 * Garden Rows held upright (chunk 31, docs/definitions/phone-portrait.md): every level of every band it lists, on the
 * three upright phone views, the captioned one and a short one. The boxes come from `gardenLayout`, which the scene
 * places the bed and the seed packets with: every spot of the bed (a tap plants or lifts there) and every seed packet,
 * measured as it is drawn (its touch area reaches 12 units further). The layout takes only the view and the level's
 * plan, so every bed of a round, and every seed, has the same boxes.
 */
const views = { ...UPRIGHT_VIEWS, short: computeView(375, 601, NO_INSETS, true) };

const cases = (Object.keys(LEVELS) as Band[]).flatMap((band) => {
  return levelsInOrder(rangeFor(LEVELS, band))
    .filter((level) => !planFor(level).bee)
    .map((level) => [band, level] as const);
});

function targets(v: { w: number; h: number }, level: number): Target[] {
  const plan = planFor(level);
  const l = gardenLayout(v, plan);
  const spots: Target[] = [];
  for (let r = 0; r < rowsOf(plan); r++)
    for (let c = 0; c < plan.size; c++)
      spots.push(
        // Trimmed by a hair: neighbouring spots share an edge.
        square(
          `spot ${r + 1},${c + 1}`,
          { x: l.board.x + (c + 0.5) * CELL, y: l.board.y + (r + 0.5) * CELL },
          CELL - 1e-7,
        ),
      );
  return [...spots, ...l.packets.map((p, i) => square(`packet ${i + 1}`, p, PACKET * 2))];
}

describe.each(Object.entries(views))('Garden Rows upright on %s', (_, v) => {
  it('covers levels 1 to 10', () => {
    expect([...new Set(cases.map(([, level]) => level))].sort((a, b) => a - b)).toEqual([
      1, 2, 3, 4, 5, 6, 7, 8, 9, 10,
    ]);
  });

  it.each(cases)(
    '%s level %i: the spots and seed packets are big enough, apart, in view and clear of Home and the guide',
    (_band, level) => {
      const plan = planFor(level);
      const t = targets(v, level);
      expect(t).toHaveLength(plan.size * rowsOf(plan) + plan.size);
      expect(uprightProblems(v, t), `${Math.round(v.w)} x ${Math.round(v.h)}`).toEqual([]);
      // The soil is drawn 14 units past the bed on every side: still in view and off Home.
      const { board } = gardenLayout(v, plan);
      expect(
        uprightProblems(v, [
          {
            what: 'soil',
            x: board.x + board.w / 2,
            y: board.y + board.h / 2,
            w: board.w + 28,
            h: board.h + 28,
          },
        ]),
      ).toEqual([]);
      if (v === UPRIGHT_VIEWS.phone) expect(CELL * v.scale).toBeGreaterThanOrEqual(44);
    },
  );
});

describe('Garden Rows sideways', () => {
  it('keeps the tablet layout: the packets in a column beside the bed', () => {
    const l = gardenLayout({ w: 1024, h: 768 }, planFor(5));
    expect(l.board).toEqual({ x: 215, y: 184, w: 400, h: 400 });
    expect(l.packets).toEqual([213, 327, 441, 555].map((y) => ({ x: 737, y })));
    const five = gardenLayout({ w: 1366, h: 1024 }, planFor(6));
    expect(planFor(6).size).toBe(5);
    expect(five.board).toEqual({ x: 336, y: 262, w: 500, h: 500 });
    expect(five.packets.map((p) => p.x)).toEqual([958, 958, 958, 958, 958]);
  });
});
