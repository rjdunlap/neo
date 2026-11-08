import type { View } from '../engine/view';

/** The result's buttons (`GameScene.showResult`): Again, Next level and the way out are 132 units, the heart and Keep 112, the house 100. */
export const RESULT_RADIUS = { again: 66, next: 66, home: 66, heart: 56, keep: 56, house: 50 } as const;

export interface Spot {
  x: number;
  y: number;
}

export interface ResultSpots {
  sticker: Spot;
  pill: Spot;
  again: Spot;
  next: Spot;
  home: Spot;
  house: Spot;
  heart: Spot;
  keep: Spot;
}

/**
 * Where the result puts the sticker, the discovery card and the buttons, from the view: the celebrating pet fills the middle
 * of the bottom row, so a next level goes above the way out, below the heart and clear of the discovery card. On a 768-wide
 * upright view (chunk 31) the house (`withHouse`) keeps 60 units from the right edge and the way out steps in beside it; a wider view is
 * laid out exactly as before.
 */
export function resultSpots(v: Pick<View, 'w' | 'h'>, withHouse = true): ResultSpots {
  const cx = v.w / 2;
  const row = v.h * 0.72;
  const house = { x: Math.min(cx + 380, v.w - 60 - RESULT_RADIUS.house), y: row };
  const home = {
    x: withHouse ? Math.min(cx + 240, house.x - RESULT_RADIUS.house - 20 - RESULT_RADIUS.home) : cx + 240,
    y: row,
  };
  return {
    sticker: { x: cx, y: v.h * 0.33 },
    pill: { x: cx, y: v.h * 0.555 },
    again: { x: cx - 240, y: row },
    next: { x: cx + 250, y: v.h * 0.525 },
    home,
    house,
    heart: { x: cx + 195, y: v.h * 0.33 },
    keep: { x: cx - 195, y: v.h * 0.33 },
  };
}
