import { describe, expect, it } from 'vitest';
import { computeView, NO_INSETS, type View } from '../engine/view';
import { BUTTON_SIZE, DIRECTION_SIZE, logRollLayout } from './log-roll';
import { FLOORS } from './log-roll/floors';
import { mirror } from './log-roll/logic';
import { boardLayout, BIG, SMALL } from './marble-jump/logic';
import { snowballLayout } from './snowball-merge';
import { SIZE } from './snowball-merge/logic';
import { square, uprightProblems, UPRIGHT_VIEWS, type Target } from './upright-check';

const views = { ...UPRIGHT_VIEWS, short: computeView(375, 601, NO_INSETS, true) };
const box = (what: string, x: number, y: number, w: number, h: number): Target => ({
  what,
  x: x + w / 2,
  y: y + h / 2,
  w,
  h,
});

function check(v: View, targets: Target[], min = 64, px = 44) {
  expect(uprightProblems(v, targets, min)).toEqual([]);
  if (v === UPRIGHT_VIEWS.phone) {
    const smallest = Math.min(...targets.map((t) => Math.min(t.w, t.h)));
    expect(smallest * v.scale).toBeGreaterThanOrEqual(px);
  }
}

describe.each(Object.entries(views))('Grown-up upright batch 4 on %s', (_, v) => {
  it('Log Roll: every floor of every level, its directions and buttons fit below Home', () => {
    for (const floors of FLOORS)
      for (const floor of [...floors, ...floors.map(mirror)]) {
        const l = logRollLayout(v, floor);
        const rows = floor.length,
          cols = floor[0].length;
        check(
          v,
          [
            // The floor and its 14-unit rim: not a target, but it must stay clear of Home, "?" and the pet.
            box('floor', l.bx - 14, l.by - 14, cols * l.cell + 28, rows * l.cell + 28),
            ...Object.values(l.directions).map((p) => ({ ...p, ...DIRECTION_SIZE, what: 'direction' })),
            ...l.buttons.map((p) => ({ ...p, ...BUTTON_SIZE, what: 'button' })),
          ],
          // The buttons are 100 units (51 px on a 390-wide phone), as when it is held sideways.
          100,
        );
        // Upright stones are at least as large as the sideways ones (76 units on the widest floor).
        expect(l.cell).toBeGreaterThanOrEqual(76);
      }
  });

  it('Marble Jump: both boards, their 78-unit holes and the buttons fit', () => {
    for (const tri of [SMALL, BIG]) {
      const l = boardLayout(tri, v.w, v.h);
      // The holes are hit circles: apart by their 78-unit diameter, each inside the view and clear of the corners.
      for (const [a, p] of l.holes.entries()) {
        expect(uprightProblems(v, [square('hole', p, 78)], 64)).toEqual([]);
        for (const q of l.holes.slice(a + 1))
          expect(Math.hypot(p.x - q.x, p.y - q.y)).toBeGreaterThanOrEqual(78);
      }
      check(
        v,
        [
          // The tray and its pocket groove, holding every hole.
          box('tray', l.cx - l.half, l.top - 57, 2 * l.half, l.groove + 22 - (l.top - 57)),
          ...[-1, 0, 1].map((i) => ({ what: 'button', x: l.cx + i * 180, y: v.h - 65, w: 160, h: 78 })),
        ],
        64,
        // The 78-unit holes and buttons are 39.6 px on a 390-wide phone, the same 78 units as when it is held sideways.
        39,
      );
    }
  });

  it('Snowball Merge: the field, the arrow row and the buttons fit, on the usual field and the wider one', () => {
    for (const size of [SIZE, 4]) {
      const l = snowballLayout(v, size);
      const w = l.cell * size;
      check(
        v,
        [
          box('field', l.field.x - 14, l.field.y - 14, w + 28, w + 28),
          ...Object.values(l.arrows).map((p) => square('arrow', p, 100)),
          ...l.buttons.map((p) => ({ ...p, what: 'button', w: 160, h: 100 })),
        ],
        100,
      );
      // Level 7's sixteen cells share the same room: smaller cells, with both button rows still under the field.
      if (size === SIZE) expect(l.cell).toBe(160);
      else expect(l.cell).toBeGreaterThanOrEqual(120);
    }
  });
});
