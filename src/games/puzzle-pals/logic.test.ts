import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import { dropSlot, nextToPlace, PICTURE_H, PICTURE_W, piecesFor, PUZZLE_PLANS, slotCenter, trayRows } from './logic';

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

  it('the ghost finger places every piece of every level in its own place, whatever order the tray holds them in', () => {
    for (const plan of PUZZLE_PLANS) {
      for (let seed = 1; seed <= 50; seed++) {
        // The game's tray: the pre-placed pieces first (already in place), then the rest shuffled.
        const all = piecesFor(plan);
        const tray = [...all.slice(0, plan.preplaced), ...new Rng(seed).shuffle(all.slice(plan.preplaced))].map((piece, i) => ({ piece, placed: i < plan.preplaced }));
        let moved = 0;
        for (let next = nextToPlace(tray); next; next = nextToPlace(tray)) {
          // Let go on the middle of its place: the nearest empty place is that piece's own, so it is never a miss.
          const c = slotCenter(plan, next.piece);
          expect(dropSlot(plan, c.x, c.y, tray.filter((p) => !p.placed).map((p) => p.piece))).toEqual(next.piece);
          next.placed = true;
          moved++;
        }
        expect(moved).toBe(all.length - plan.preplaced);
      }
    }
  });

  it('is forgiving on the smallest puzzles: anywhere over the frame finds the last empty place', () => {
    const plan = PUZZLE_PLANS[0];
    const [, right] = piecesFor(plan);
    expect(dropSlot(plan, 20, 20, [right])).toEqual(right);
  });
});
