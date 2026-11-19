import type { View } from '../../engine/view';

/**
 * Where Penguin Slide's pond and undo button stand, as a pure function of the view so a test can check every pond on
 * every upright phone view (chunk 31, docs/definitions/phone-portrait.md). Sideways (1,024 wide) the numbers are the ones
 * the scene always used; held upright (768 wide) the biggest pond (7 × 5 cells) leaves no room beside it for the undo
 * button, so the button rests beneath the pond, and the pond starts clear of Home and the help button.
 */
export const CELL = 100;
/** The undo button's radius, and the white frame drawn round the ice. */
export const UNDO_R = 54;
export const FRAME = 16;
/** Held upright: Home and help fill the top-left 115 × 210, the guide the bottom-left 150 × 170. */
const TOP_CLEAR = 210 + FRAME + 14;
const BOTTOM_CLEAR = 180;
/** Held upright: how far below the ice the undo button's centre rests. */
const UNDO_DROP = FRAME + 24 + UNDO_R;

export interface PondLayout {
  board: { x: number; y: number };
  undo: { x: number; y: number };
}

export function pondLayout(v: Pick<View, 'w' | 'h' | 'upright'>, cols: number, rows: number): PondLayout {
  const w = cols * CELL;
  const h = rows * CELL;
  const x = (v.w - w) / 2;
  if (v.upright) {
    // The pond and its undo button are one group, centred in the space between the corner buttons and the guide.
    const group = h + UNDO_DROP + UNDO_R;
    const y = Math.max(TOP_CLEAR, TOP_CLEAR + (v.h - TOP_CLEAR - BOTTOM_CLEAR - group) / 2);
    return { board: { x, y }, undo: { x: v.w - UNDO_R - 40, y: y + h + UNDO_DROP } };
  }
  const y = Math.max(110, (v.h - h) / 2 + 10);
  return { board: { x, y }, undo: { x: x + w + 70, y: y + 50 } };
}
