import { describe, expect, it } from 'vitest';
import { computeView, NO_INSETS } from '../../engine/view';
import { uprightProblems, UPRIGHT_VIEWS, type Target } from '../upright-check';
import { layout, type Box } from './logic';

/**
 * Shell Rows held upright (chunk 31, docs/definitions/phone-portrait.md): on the three upright phone views, the
 * captioned one and a short one. `layout` takes only the view, so levels 1 to 5 (they differ in the positions and the pet, not
 * in what is drawn where) and every seed share these boxes: the nine squares and level 5's grown-up toggle, which are the only targets, and the two
 * piles above the board, which are pictures that must stay in view and off Home and the squares.
 */
const views = { ...UPRIGHT_VIEWS, short: computeView(375, 601, NO_INSETS, true) };

const target = (what: string, b: Box): Target => ({ what, x: b.x, y: b.y, w: b.w - 1e-7, h: b.h - 1e-7 });

describe.each(Object.entries(views))('Shell Rows upright on %s', (_, v) => {
  it('the nine squares are big enough, apart, in view and clear of Home and the guide', () => {
    const l = layout(v);
    expect(l, 'a layout, not null').not.toBeNull();
    const squares = l!.squares.map((b, i) => target(`square ${i + 1}`, b));
    expect(squares).toHaveLength(9);
    expect(uprightProblems(v, squares), `${Math.round(v.w)} x ${Math.round(v.h)}`).toEqual([]);
    // The piles are pictures (under 100 units by design): in view, off the squares, off Home and the guide.
    const piles = [target('shell pile', l!.shellPile), target('pebble pile', l!.pebblePile)];
    expect(uprightProblems(v, [...squares, ...piles], 0)).toEqual([]);
    expect(uprightProblems(v, [target('board', l!.board)])).toEqual([]);
    // Level 5's "grown-up plays" toggle is a real target: 100 units, apart from the squares, clear of Home and the guide,
    // and off both piles.
    const seat = target('grown-up toggle', l!.seat);
    expect(l!.seat.w).toBe(100);
    expect(uprightProblems(v, [...squares, seat])).toEqual([]);
    expect(uprightProblems(v, [seat, ...piles], 0)).toEqual([]);
    // The board sits in the middle of the room between the piles' strip and the pet's row, where a thumb reaches.
    expect(l!.board.y).toBeCloseTo((150 + v.h - 190) / 2);
    expect(l!.cell).toBe(150);
  });
});
