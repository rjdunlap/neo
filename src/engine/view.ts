/** Every scene is laid out in logical units on a 4:3 landscape design area. */
export const DESIGN_W = 1024;
export const DESIGN_H = 768;

/**
 * The visible area in logical units. The 1024×768 design area always fits;
 * whichever side has spare room (wider iPads, desktop windows) grows.
 */
export interface View {
  w: number;
  h: number;
  /** CSS pixels per logical unit. */
  scale: number;
}

export function computeView(pxW: number, pxH: number): View {
  const scale = Math.min(pxW / DESIGN_W, pxH / DESIGN_H);
  return { w: pxW / scale, h: pxH / scale, scale };
}

/** The guaranteed-visible design rectangle, centered in the view. */
export function safeArea(view: View) {
  return { x: (view.w - DESIGN_W) / 2, y: (view.h - DESIGN_H) / 2, w: DESIGN_W, h: DESIGN_H };
}

/**
 * Centers for `n` things in a row between `left` and `right`, at most `gap` apart.
 * Games start rows at about 150 so nothing hides behind the pet in the bottom-left corner.
 */
export function spread(n: number, left: number, right: number, gap: number): number[] {
  const step = Math.min(gap, (right - left) / Math.max(1, n));
  const start = (left + right) / 2 - (step * (n - 1)) / 2;
  return Array.from({ length: n }, (_, i) => start + i * step);
}
