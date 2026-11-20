import { describe, expect, it } from 'vitest';
import { computeView, NO_INSETS } from '../../engine/view';
import { captionPlace } from '../../ui/caption-layout';
import { square, thumbPx, uprightProblems, UPRIGHT_SCREENS } from '../upright-check';
import { CELL, pondLayout, TARGET, TRAY_W } from './layout';
import { sampleBoard } from './logic';

describe('Domino Pond touch layout', () => {
  const screens = {
    ...UPRIGHT_SCREENS,
    short: computeView(390, 625, NO_INSETS, true),
    landscape: computeView(630, 390),
    tablet: computeView(768, 1024),
  };
  for (const [name, screen] of Object.entries(screens)) {
    it(`fits all levels on ${name} with room for captions`, () => {
      for (const level of [1, 2, 3] as const) {
        const caption = captionPlace(screen, level > 1);
        const view = caption.game;
        const L = pondLayout(view, level);
        const targets = [
          ...sampleBoard(level).cells.map((cell) => square(`cell ${cell}`, L.cell(cell), CELL)),
          ...L.tray.map((p, i) => ({ ...square(`stone ${i}`, p, TARGET), w: TRAY_W })),
          ...L.controls.slice(0, level === 1 ? 3 : 4).map((p, i) => square(`button ${i}`, p, TARGET)),
        ];
        expect(uprightProblems(view, targets), `level ${level}`).toEqual([]);
        const band = caption.band;
        if (caption.mode === 'bubble' && band) {
          for (const target of targets) {
            expect(
              target.y + target.h / 2 <= band.y || target.x - target.w / 2 >= band.x + band.w,
              target.what,
            ).toBe(true);
          }
        }
      }
    });
  }
  it('puts at least 50 CSS pixels under a thumb at 390 × 844', () => {
    expect(thumbPx(Math.min(CELL, TARGET, TRAY_W))).toBe(50.8);
  });
});
