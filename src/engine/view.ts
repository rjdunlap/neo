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
