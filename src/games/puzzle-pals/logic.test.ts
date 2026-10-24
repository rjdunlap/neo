import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import { SCRIPT } from '../../content/voice-script';
import { dropSlot, hintPiece, nextToPlace, outerSides, PICTURE_H, PICTURE_W, piecesFor, PUZZLE_PLANS, slotCenter, TAP_HOP, tapHops, trayRows, whereWords } from './logic';

describe('Puzzle Pals', () => {
  it('hinted corners lead to adjacent edges, then an interior beside a placed piece', () => {
    const plan = { ...PUZZLE_PLANS[6], cols: 5, rows: 5 };
    const corners = [{ col: 0, row: 0 }, { col: 4, row: 0 }, { col: 0, row: 4 }, { col: 4, row: 4 }];
    expect(corners).toContainEqual(hintPiece(plan, []));
    expect(hintPiece(plan, corners)).toEqual({ col: 1, row: 0 });
    // All corners plus a central placed piece: an adjacent edge still takes priority.
    expect(hintPiece(plan, [...corners, { col: 2, row: 2 }])).toEqual({ col: 1, row: 0 });
    const border = piecesFor(plan).filter((p) => Object.values(outerSides(plan, p)).some(Boolean));
    expect(hintPiece(plan, border)).toEqual({ col: 1, row: 1 });
  });

  it('hints finish every partial board without choosing a placed piece, including all 4096 top-level states', () => {
    for (const plan of PUZZLE_PLANS) {
      const all = piecesFor(plan);
      for (let mask = 0; mask < 2 ** all.length; mask++) {
        const placed = all.filter((_, i) => mask & (1 << i));
        const next = hintPiece(plan, placed);
        if (placed.length === all.length) { expect(next).toBeUndefined(); continue; }
        expect(all).toContainEqual(next);
        expect(placed).not.toContainEqual(next);
        const corners = all.filter((p) => {
          const s = outerSides(plan, p);
          return (s.top || s.bottom) && (s.left || s.right) && !placed.some((q) => q.col === p.col && q.row === p.row);
        });
        if (corners.length) expect(corners).toContainEqual(next);
        // Every suggestion can be placed through the real drop rule.
        const c = slotCenter(plan, next!);
        expect(dropSlot(plan, c.x, c.y, all.filter((p) => !placed.includes(p)))).toEqual(next);
      }
    }
  });

  it('names all nine grid positions and uses left, middle, right for strips', () => {
    const plan = PUZZLE_PLANS[5];
    expect(piecesFor(plan).map((p) => whereWords(plan, p))).toEqual([
      'top-left', 'top', 'top-right', 'left', 'middle', 'right', 'bottom-left', 'bottom', 'bottom-right',
    ]);
    expect(piecesFor(PUZZLE_PLANS[2]).map((p) => whereWords(PUZZLE_PLANS[2], p))).toEqual(['left', 'middle', 'right']);
    for (const plan of PUZZLE_PLANS) for (const p of piecesFor(plan)) {
      expect(SCRIPT[`puzzle.hint.${whereWords(plan, p)}`].length).toBeGreaterThan(0);
      const s = outerSides(plan, p);
      expect(s.top).toBe(p.row === 0);
      expect(s.bottom).toBe(p.row === plan.rows - 1);
      expect(s.left).toBe(p.col === 0);
      expect(s.right).toBe(p.col === plan.cols - 1);
    }
  });

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

  it('lets a tapped piece hop into place on the one- and two-piece pictures only', () => {
    expect(PUZZLE_PLANS.slice(0, 2).every(tapHops)).toBe(true);
    expect(PUZZLE_PLANS.slice(2).some(tapHops)).toBe(false);
    // A tap is judged where the piece was let go: it must still be within a finger's wobble of its tray spot.
    expect(TAP_HOP).toBeGreaterThan(10);
    expect(TAP_HOP).toBeLessThan(60);
  });
});
