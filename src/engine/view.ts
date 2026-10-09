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

/** CSS pixels at each edge of the window that a notch, rounded corner or home indicator covers. */
export interface Insets {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export const NO_INSETS: Insets = { top: 0, right: 0, bottom: 0, left: 0 };

/** A cutout is never more than a quarter of a side; a wild reading must not squeeze the island away. */
export function clampInsets(i: Insets, pxW: number, pxH: number): Insets {
  const fit = (n: number, limit: number) => (Number.isFinite(n) ? Math.min(Math.max(0, n), limit * 0.25) : 0);
  return { top: fit(i.top, pxH), right: fit(i.right, pxW), bottom: fit(i.bottom, pxH), left: fit(i.left, pxW) };
}

/**
 * The view for a window of `pxW` × `pxH` CSS pixels. With insets, the view is the safe rectangle
 * inside them (the app puts its root at `left`, `top`); the cream behind it fills the rest.
 */
export function computeView(pxW: number, pxH: number, insets: Insets = NO_INSETS): View {
  const safe = clampInsets(insets, pxW, pxH);
  const w = pxW - safe.left - safe.right;
  const h = pxH - safe.top - safe.bottom;
  const scale = Math.min(w / DESIGN_W, h / DESIGN_H);
  return { w: w / scale, h: h / scale, scale };
}

/** A phone held upright is taller than anything the layouts were checked at (an iPad is at most 1.5 times taller than wide). */
const UPRIGHT_PHONE = 1.6;

/**
 * Whether to ask for the phone to be turned sideways. The islands are drawn wide; stretched into a
 * 1024 × 2200 strip, the games spread out, their targets shrink to about 38 CSS pixels and the text
 * becomes unreadable. Tablets and desktop windows never get the prompt, whatever their shape.
 */
export function needsTurn(pxW: number, pxH: number, touch: boolean): boolean {
  return touch && pxH > pxW * UPRIGHT_PHONE;
}

/**
 * How much to enlarge small grown-up text so it stays readable where the island is drawn small (a phone
 * at about half the iPad's scale): 1 from `scale` 0.72 up, so a tablet or computer is unchanged, and 1.5 at most.
 */
export function textBoost(scale: number): number {
  return Math.min(1.5, Math.max(1, 0.72 / Math.max(scale, 0.01)));
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
