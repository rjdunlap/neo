import type { View } from '../engine/view';

/** The result's buttons (`GameScene.showResult`): Again, Next level and the way out are 132 units, the heart and Keep 112, the house 100. */
export const RESULT_RADIUS = { again: 66, next: 66, home: 66, heart: 56, keep: 56, house: 50 } as const;

/** How wide each button's name may be at the root (U1): the way out and the house stand 136 to 140 apart. */
export const RESULT_NAME_W = { again: 160, next: 160, home: 126, heart: 140, keep: 140, house: 126 } as const;

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

/** A daily round's "next game" tile (`GameScene.showDailyNext`). */
export const DAILY_NEXT = { w: 288, h: 112 } as const;

/**
 * Where a daily round's result puts the next of the six (its top-left corner) and the grown-up's note pencil (its
 * centre). A wide view keeps them in the top-left corner, the pencil under the tile: the celebrating pet fills the middle
 * of the bottom row. A tall view (a phone held upright) has the pet far below the row, so the tile goes between Again and
 * the way out, where a thumb is, and the pencil takes the corner.
 */
export function dailySpots(v: Pick<View, 'w' | 'h'>): { next: Spot; note: Spot } {
  if (v.h < v.w * 1.5) return { next: { x: 32, y: 24 }, note: { x: 82, y: 210 } };
  return {
    next: { x: v.w / 2 - DAILY_NEXT.w / 2, y: v.h * 0.72 - DAILY_NEXT.h / 2 },
    note: { x: 82, y: 74 },
  };
}
