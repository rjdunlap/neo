/**
 * Sliding boards: a grid, sea or picture too big for its window at a thumb-sized square slides under the window.
 * `slid` is how far the board has moved from its top-left corner; `maxX`/`maxY` are the most it can (0 when it all shows).
 * The board's own units run from its top-left; `edge` is the paper kept around it inside the window.
 */
export interface Slid {
  x: number;
  y: number;
}
/** What a slide needs to know of its window: its size and how far the board can slide each way. */
export interface SlideRange {
  w: number;
  h: number;
  maxX: number;
  maxY: number;
}

/** `x`, `y` kept inside what there is to see: from 0 to `maxX` and `maxY`. */
export function clampSlide(x: number, y: number, maxX: number, maxY: number): Slid {
  return { x: Math.min(maxX, Math.max(0, x)), y: Math.min(maxY, Math.max(0, y)) };
}

/** How far to have slid so the board's point `x`, `y` is in the middle of the window, or as near as the edges allow. */
export function slideCentering(range: SlideRange, x: number, y: number, edge: number): Slid {
  return clampSlide(x + edge - range.w / 2, y + edge - range.h / 2, range.maxX, range.maxY);
}

/** Is the board's point `x`, `y` inside the window, at least `margin` from every edge, once slid by `slid`? */
export function pointInSlideWindow(
  range: SlideRange,
  slid: Slid,
  x: number,
  y: number,
  edge: number,
  margin: number,
): boolean {
  const px = x + edge - slid.x,
    py = y + edge - slid.y;
  return px >= margin && px <= range.w - margin && py >= margin && py <= range.h - margin;
}
