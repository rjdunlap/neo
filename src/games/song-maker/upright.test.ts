import { describe, expect, it } from 'vitest';
import { computeView, NO_INSETS } from '../../engine/view';
import { uprightProblems, UPRIGHT_VIEWS, type Target } from '../upright-check';
import { barOf, GIVEN_CELL, SONG_PLANS, songLayout } from './logic';

/**
 * Song Maker held upright (chunk 31, docs/definitions/phone-portrait.md): every level on the upright phone views. The
 * targets are the tappable beats (whole cells, 100 units or more), the replay button of the listening level and, at the
 * card level, nothing but the card, which is only looked at. The 8-beat pattern level keeps its given bar small above the
 * four beats she fills in.
 */
const views = { ...UPRIGHT_VIEWS, minimum: computeView(768, 1024, NO_INSETS, true) };

describe.each(Object.entries(views))('Song Maker upright on %s', (_, v) => {
  SONG_PLANS.forEach((plan, i) => {
    it(`level ${i + 1} (${plan.mode}): the board fits, clear of Home and the guide`, () => {
      const lay = songLayout(plan, v);
      const targets: Target[] = [];
      for (const bar of lay.bars) {
        if (!bar.tappable) continue;
        for (let col = 0; col < bar.cols; col++)
          for (let row = 0; row < plan.rows; row++)
            targets.push({
              what: `beat ${bar.from + col} row ${row}`,
              x: bar.x0 + bar.cell * (col + 0.5),
              y: bar.y0 + bar.cell * (row + 0.5),
              w: bar.cell,
              h: bar.cell,
            });
      }
      if (plan.mode === 'compose') targets.push({ what: 'check', ...lay.replay, w: 100, h: 100 });
      if (plan.mode === 'listen') targets.push({ what: 'replay', ...lay.replay, w: 100, h: 100 });
      expect(uprightProblems(v, targets)).toEqual([]);
      // Every beat has a block, and the frames of all blocks (with their 14-unit margin) stay inside the view, apart.
      for (let col = 0; col < plan.cols; col++) expect(barOf(lay, col)).toBeDefined();
      const frames = lay.bars.map((b) => ({
        x0: b.x0 - 14,
        y0: b.y0 - 14,
        x1: b.x0 + b.cell * b.cols + 14,
        y1: b.y0 + b.cell * plan.rows + 14,
      }));
      for (const f of frames) {
        expect(f.x0).toBeGreaterThanOrEqual(0);
        expect(f.x1).toBeLessThanOrEqual(v.w);
        expect(f.y1).toBeLessThanOrEqual(v.h - 170 + 1e-6);
      }
      if (frames.length > 1) expect(frames[0].y1).toBeLessThan(frames[1].y0);
      expect(lay.bars.reduce((n, b) => n + b.cols, 0)).toBe(plan.cols);
      // The card (card level) and the replay button sit above the board, clear of it.
      if (plan.mode === 'card') {
        const cardBottom = lay.card.y + (34 * plan.rows) / 2 + 16;
        expect(cardBottom).toBeLessThan(frames[0].y0);
        expect(lay.card.x - (34 * plan.cols) / 2 - 16).toBeGreaterThanOrEqual(115);
      }
      if (plan.mode === 'pattern') expect(lay.bars[0].cell).toBe(GIVEN_CELL);
    });
  });

  it('sideways views keep the old single block', () => {
    const side = computeView(844, 390, NO_INSETS);
    for (const plan of SONG_PLANS) expect(songLayout(plan, side).bars).toHaveLength(1);
  });
});
