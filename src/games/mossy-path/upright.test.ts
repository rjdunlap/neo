import { describe, expect, it } from 'vitest';
import { computeView, NO_INSETS } from '../../engine/view';
import { captionPlace } from '../../ui/caption-layout';
import { square, uprightProblems, UPRIGHT_VIEWS } from '../upright-check';
import { cellPosition, mossyLayout, ROUND_BUTTON } from './layout';
import { MAZES, plansFor } from './logic';

const short = computeView(390, 630, NO_INSETS, true);
const shortInset = computeView(375, 640, { top: 48, bottom: 24, left: 0, right: 0 }, true);
const views = { ...UPRIGHT_VIEWS, short, shortInset };

describe.each(Object.entries(views))('Mossy Path upright on %s', (_, view) => {
  it.each(Array.from({ length: 11 }, (_, i) => i + 1))('fits every board for level %i', (level) => {
    const maze = MAZES[level];
    const boards = maze
      ? maze.map((rows) => ({ rows: rows.length, cols: rows[0].length }))
      : plansFor(level).flatMap(({ rows, cols }) => [
          { rows, cols },
          { rows: cols, cols: rows },
        ]);
    const caption = captionPlace(view, true);
    for (const board of boards) {
      const { cell, first, status, buttons } = mossyLayout(view, board);
      // Include hedges too because the maze's touch layer spans the whole board.
      const targets = Array.from({ length: board.rows * board.cols }, (_, at) => {
        const local = cellPosition(at, board.cols, cell);
        return square(`tile ${at}`, { x: first.x + local.x, y: first.y + local.y }, cell);
      });
      if (level !== 4 && level !== 5)
        buttons.forEach((point, i) => targets.push({ what: `button ${i}`, ...point, ...ROUND_BUTTON }));
      expect(uprightProblems(view, targets)).toEqual([]);
      expect(status.y - 20).toBeGreaterThan(210);
      expect(first.y - cell / 2).toBeGreaterThan(status.y + 20);
      if (caption.mode === 'bubble' && caption.band) {
        expect(first.y + (board.rows - 0.5) * cell).toBeLessThan(caption.band.y);
        expect(buttons[0].y - ROUND_BUTTON.h / 2).toBeGreaterThan(caption.band.y + caption.band.h);
      }
    }
  });
});
