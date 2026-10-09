import { describe, expect, it } from 'vitest';
import { dropSlot, nextPuzzleMove, PICTURE_H, PICTURE_W, piecesFor, PUZZLE_PLANS, slotCenter, trayRows } from './logic';

describe('Puzzle Pals', () => {
  it('cuts every picture into its grid, leaving at least one piece to place', () => {
    for (const plan of PUZZLE_PLANS) {
      const pieces = piecesFor(plan);
      expect(pieces).toHaveLength(plan.cols * plan.rows);
      expect(plan.preplaced).toBeLessThan(pieces.length);
      expect(pieces.length).toBeLessThanOrEqual(12);
      expect(trayRows(pieces.length - plan.preplaced)).toBeLessThanOrEqual(2);
    }
  });

  it('finds the place a piece is dropped on, and ignores drops off the frame', () => {
    for (const plan of PUZZLE_PLANS) {
      const pieces = piecesFor(plan);
      for (const p of pieces) {
        const c = slotCenter(plan, p);
        expect(dropSlot(plan, c.x, c.y, pieces)).toEqual(p);
        // A little off-center still lands in the same place.
        expect(dropSlot(plan, c.x + PICTURE_W / plan.cols / 5, c.y - PICTURE_H / plan.rows / 5, pieces)).toEqual(p);
      }
      expect(dropSlot(plan, PICTURE_W * 2.5, PICTURE_H * 2.5, pieces)).toBeNull();
    }
  });

  it('is forgiving on the smallest puzzles: anywhere over the frame finds the last empty place', () => {
    const plan = PUZZLE_PLANS[0];
    const [, right] = piecesFor(plan);
    expect(dropSlot(plan, 20, 20, [right])).toEqual(right);
  });

  it('the demonstration carries every waiting piece to its own empty grid cell', () => {
    for (const plan of PUZZLE_PLANS) {
      const views = piecesFor(plan).map((piece, i) => ({ piece, placed: i < plan.preplaced }));
      let moves = 0;
      for (let move = nextPuzzleMove(plan, views); move; move = nextPuzzleMove(plan, views)) {
        const empty = views.filter((p) => !p.placed).map((p) => p.piece);
        expect(dropSlot(plan, move.to.x, move.to.y, empty)).toEqual(move.piece.piece);
        move.piece.placed = true;
        moves++;
      }
      expect(moves).toBe(views.length - plan.preplaced);
      expect(views.every((p) => p.placed)).toBe(true);
    }
  });
});
