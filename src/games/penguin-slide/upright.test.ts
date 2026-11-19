import { describe, expect, it } from 'vitest';
import { computeView, NO_INSETS } from '../../engine/view';
import { square, uprightProblems, UPRIGHT_VIEWS, type Target } from '../upright-check';
import { CELL, FRAME, pondLayout, UNDO_R } from './layout';
import { PLANS } from './logic';

/**
 * Penguin Slide held upright (chunk 31, docs/definitions/phone-portrait.md): every pond size on the upright phone views.
 * The pond's ice and the undo button are the targets: whole inside the 768-wide view, apart, and clear of Home, help and
 * the guide; the undo button rests beneath the ice, not off the right edge.
 */
const views = { ...UPRIGHT_VIEWS, tallest: computeView(360, 800, NO_INSETS, true) };
const sizes = [...new Map(PLANS.map((p) => [`${p.cols}x${p.rows}`, p])).values()];

describe.each(Object.entries(views))('Penguin Slide upright on %s', (_, v) => {
  it.each(sizes.map((p) => [`${p.cols} x ${p.rows}`, p] as const))(
    'pond %s: ice and undo are whole, apart and clear',
    (_n, p) => {
      const l = pondLayout(v, p.cols, p.rows);
      const w = p.cols * CELL;
      const h = p.rows * CELL;
      const t: Target[] = [
        { what: 'ice', x: l.board.x + w / 2, y: l.board.y + h / 2, w: w + FRAME * 2, h: h + FRAME * 2 },
        square('undo', l.undo, UNDO_R * 2),
      ];
      expect(uprightProblems(v, t)).toEqual([]);
      expect(l.undo.y).toBeGreaterThan(l.board.y + h + FRAME);
    },
  );
});

it('sideways the pond keeps the numbers it always had', () => {
  const v = computeView(1024, 768, NO_INSETS);
  expect(pondLayout(v, 6, 5)).toEqual({ board: { x: 212, y: 144 }, undo: { x: 882, y: 194 } });
});
