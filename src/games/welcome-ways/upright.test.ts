import { describe, expect, it } from 'vitest';
import { computeView, NO_INSETS } from '../../engine/view';
import { uprightProblems, UPRIGHT_VIEWS, type Target } from '../upright-check';
import { layout } from './layout';
import { planFor } from './logic';

/**
 * Welcome Ways held upright (chunk 31, docs/definitions/phone-portrait.md): every level's layout on the upright phone
 * views. Targets are the sockets, the tray, the visitor cards and the four buttons; the board's house, the friends'
 * walk-in and the grass are scenery.
 */
const views = { ...UPRIGHT_VIEWS, short: computeView(375, 601, NO_INSETS, true) };

describe.each(Object.entries(views))('Welcome Ways upright on %s', (_, v) => {
  it.each([1, 2, 3, 4, 5, 6, 7])('level %s', (level) => {
    const plan = planFor(level);
    const L = layout(v, plan.rises, plan.choices.length, plan.visitors.length, plan.level);
    const t: Target[] = [];
    L.sockets.forEach((b, i) => t.push({ what: `socket ${i}`, ...b }));
    L.tray.forEach((b, i) => t.push({ what: `tray ${i}`, ...b }));
    L.visitors.forEach((b, i) => t.push({ what: `visitor ${i}`, ...b }));
    (['undo', 'remove', 'help', 'try'] as const).forEach((k) => t.push({ what: k, ...L[k] }));
    expect(uprightProblems(v, t), `level ${level}`).toEqual([]);
    // The board's house (350 wide, from 670 to 1,020 in board units) stays inside the view.
    expect(L.left + 670).toBeGreaterThanOrEqual(0);
    expect(L.left + 1020).toBeLessThanOrEqual(v.w);
    // Controls stand up from the bottom edge; the board sits clear of the cards above it.
    expect(v.h - (L.undo.y + L.undo.h / 2)).toBeLessThanOrEqual(60);
    const cardsBottom = Math.max(...L.visitors.map((b) => b.y + b.h / 2));
    expect(L.doorBase - 265).toBeGreaterThan(cardsBottom);
    const traysTop = Math.min(...L.tray.map((b) => b.y - b.h / 2));
    expect(L.ground + 60).toBeLessThan(traysTop);
  });
});
