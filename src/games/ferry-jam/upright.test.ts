import { describe, expect, it } from 'vitest';
import { computeView, NO_INSETS } from '../../engine/view';
import { uprightProblems, UPRIGHT_VIEWS, type Target } from '../upright-check';
import { courseHarbors } from './course';
import { HARBORS } from './harbors';
import { CELL, DOCK, harborLayout } from './layout';
import { parse } from './logic';

const views = { ...UPRIGHT_VIEWS, minimum: computeView(768, 1024, NO_INSETS, true) };
const sideways = computeView(1024, 768, NO_INSETS);

const harbors = [
  ...Object.entries(HARBORS).flatMap(([lv, hs]) =>
    hs.map((rows, i) => ({ name: `level ${lv} harbor ${i}`, h: parse(rows) })),
  ),
  ...courseHarbors('harbors').map((c, i) => ({ name: `course harbor ${i}`, h: c.harbor })),
];

describe('Ferry Jam layout', () => {
  it('keeps the sideways plan: centered a little left, undo in the corner', () => {
    const l = harborLayout(sideways, 5, false);
    expect(l).toEqual({
      x: Math.max(150, (1024 - 500 - 110) / 2),
      y: Math.max(100, (768 - 500) / 2),
      undo: { x: 944, y: 688 },
      upright: false,
    });
  });
});

describe.each(Object.entries(views))('Ferry Jam upright on %s', (_, v) => {
  it.each(harbors)('$name: harbor, dock and undo fit, stand apart and hang up from the bottom', ({ h }) => {
    const yellow = !!h.yellow;
    const L = harborLayout(v, h.size, yellow);
    expect(L.upright).toBe(true);
    const w = h.size * CELL;
    const t: Target[] = [];
    // Every cell is a boat's tap area (a ferry or boat spans cells, never less than one).
    for (let r = 0; r < h.size; r++)
      for (let c = 0; c < h.size; c++)
        t.push({
          what: `cell ${r},${c}`,
          x: L.x + c * CELL + CELL / 2,
          y: L.y + r * CELL + CELL / 2,
          w: CELL,
          h: CELL,
        });
    expect(uprightProblems(v, t)).toEqual([]);
    // The wall, its dock beyond the right edge, and the yellow dock below it, inside the view and clear of Home and the guide.
    const whole: Target[] = [
      { what: 'the harbor', x: L.x + (w + DOCK - 2) / 2, y: L.y + w / 2, w: w + DOCK - 2, h: w + 34 },
      { what: 'the undo button', x: L.undo.x, y: L.undo.y, w: 108, h: 108 },
    ];
    if (yellow)
      whole.push({ what: 'the yellow dock', x: L.x + w / 2, y: L.y + w + DOCK / 2, w: w + 34, h: DOCK });
    expect(uprightProblems(v, whole.slice(0, 1))).toEqual([]);
    expect(uprightProblems(v, whole.slice(1, 2))).toEqual([]);
    expect(L.x - 17).toBeGreaterThanOrEqual(0);
    expect(L.x + w + 110).toBeLessThanOrEqual(v.w);
    const bottom = L.y + w + 17 + (yellow ? DOCK - 17 : 0);
    // Clear of the guide's corner (the guide spans x < 150) and above the undo button's row; hangs low on a tall phone.
    expect(bottom).toBeLessThanOrEqual(v.h - 170);
    expect(bottom).toBeGreaterThanOrEqual(v.h - 400);
    expect(L.y).toBeGreaterThanOrEqual(210);
    if (yellow && L.x + w - 0 > L.undo.x - 54) expect(bottom).toBeLessThanOrEqual(L.undo.y - 54);
  });
});
