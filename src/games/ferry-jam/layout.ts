import type { View } from '../../engine/view';

/** One cell of the harbor, in logical units: the smallest a boat's tap area may be. */
export const CELL = 100;
/** How far the dock's planks run out past the harbor wall (and, for a yellow ferry, below it). */
export const DOCK = 112;

export interface HarborLayout {
  /** The harbor's top-left, which the boat layer and the wall are drawn from. */
  x: number;
  y: number;
  /** The undo button's center. */
  undo: { x: number; y: number };
  upright: boolean;
}

/**
 * Where an `n` × `n` harbor sits. Sideways it is centered a little left of the middle (the dock sticks out on the right,
 * a yellow ferry's dock below). Upright (a phone held tall on 768 × 1024) a 6-wide harbor and its dock fill the width
 * (6 × 100 + 112 = 712), so it takes the width and hangs up from the bottom edge, clear of the guide's corner, leaving a
 * tall phone's spare height as sky at the top; the undo button rests in the bottom-right below it.
 */
export function harborLayout(v: Pick<View, 'w' | 'h' | 'upright'>, n: number, yellow: boolean): HarborLayout {
  const w = n * CELL;
  const below = yellow ? DOCK : 0;
  const undo = { x: v.w - 80, y: v.h - 80 };
  if (!v.upright)
    return {
      x: Math.max(150, (v.w - w - 110) / 2),
      y: Math.max(100, (v.h - w - below) / 2),
      undo,
      upright: false,
    };
  // The wall's stroke reaches 17 units out of the origin and 17 past the far side; the dock's planks reach w + 110.
  const x = Math.max(20, Math.min(150, (v.w - w - DOCK) / 2 + 6));
  const depth = w + 17 + (yellow ? DOCK : 0);
  // Clear of the guide's corner (170 up from the bottom) and of Home and help (210 down from the top, plus the wall).
  const y = Math.max(235, v.h - 190 - depth);
  return { x, y, undo, upright: true };
}
