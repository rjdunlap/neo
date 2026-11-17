import type { View } from '../../engine/view';

/**
 * The three Ribbon Workshop scenes are drawn for a 1024-wide view: a bench of six ticks is 840 units. Held upright the
 * view is 768 wide, so each scene draws into a scaled "world" instead: the same sideways layout on a 940-wide, 800-tall
 * design area (the bench from x = 40, the buttons in the same corners), scaled down to the view's width and set a
 * little below the top. A sideways view gets the identity frame, so its layout is unchanged.
 */
export const UPRIGHT_DESIGN = { w: 940, h: 800 };
/** Where the bench, spool and ribbon start: 110 sideways (clear of Home and "?"), 40 upright (the bench is 840 wide). */
const X0_SIDEWAYS = 110;
const X0_UPRIGHT = 40;
/** The tray's and the spool cards' left edge (clear of the pet's corner), in the scene's own units. */
const TRAY_LEFT_SIDEWAYS = 170;
/** The guide's box on the real view, from the left edge. */
const GUIDE_W = 150;
/** The share of the spare height put above the scene, so the controls sit nearer the thumb. */
const SPARE_ABOVE = 0.4;

export interface Frame {
  /** World scale: real units per scene unit. */
  s: number;
  /** World's top edge on the real view. */
  y: number;
  /** The view the scene lays out on, in scene units. */
  view: View;
  x0: number;
  trayLeft: number;
}

export function frameFor(v: View): Frame {
  if (!v.upright) return { s: 1, y: 0, view: v, x0: X0_SIDEWAYS, trayLeft: TRAY_LEFT_SIDEWAYS };
  const s = Math.min(1, v.w / UPRIGHT_DESIGN.w),
    h = Math.min(v.h / s, UPRIGHT_DESIGN.h);
  return {
    s,
    y: Math.max(0, (v.h - h * s) * SPARE_ABOVE),
    view: { ...v, w: v.w / s, h },
    x0: X0_UPRIGHT,
    trayLeft: Math.ceil((GUIDE_W + 4) / s),
  };
}

/** A scene point on the real view, for the particles (they live outside the world). */
export const toReal = (f: Frame, x: number, y: number) => ({ x: x * f.s, y: y * f.s + f.y });
