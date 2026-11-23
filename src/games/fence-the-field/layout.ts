import type { View } from '../../engine/view';
import { captionPlace } from '../../ui/caption-layout';
import { PLOT_RAILS, RAILS, railPosts } from './logic';

const laid = (mask: number, e: number) => (mask & (1 << e)) !== 0;

export interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}
const box = (x: number, y: number, w: number, h: number): Box => ({ x, y, w, h });

export interface Layout {
  /** A plot's side. */
  s: number;
  /** The top-left post. */
  x0: number;
  y0: number;
  /** The whole field: the posts and half a rail target outside them. */
  field: Box;
  score: Box;
  help: Box;
}

/** The largest plot, and the smallest that keeps a rail target at the grown-up 64 units. */
export const PLOT_UPRIGHT = 200;
export const PLOT_SIDEWAYS = 180;
export const PLOT_MIN = 128;

/**
 * Upright: the score strip beside Home, the field under it and Help below the field on the right. A short phone shows the
 * caption in a bubble over the view, so there the field shrinks (never under 64-unit targets) to keep its rails above it
 * and Help sits beside it. A view cannot tell a 1,206-unit strip view from a short bubble screen, so both shrink. Sideways: the field on the
 * right, the strip and Help on the left above the bubble; on a screen too narrow for both, the field keeps its size and
 * the bubble crosses its left edge while the pet speaks.
 */
export function layout(view: Pick<View, 'w' | 'h' | 'upright'>): Layout {
  const { w, h } = view;
  const caption = captionPlace({ ...view, scale: 1 } as View, true);
  const bubble = caption.mode === 'bubble' ? caption.band : null;
  if (view.upright) {
    const top = 210;
    // Under a bubble the fence itself stays clear of it; only the half target outside the bottom posts may sit under it.
    const s = Math.max(
      PLOT_MIN,
      Math.min(PLOT_UPRIGHT, Math.floor(bubble ? (bubble.y - top) / 3.35 : (h - 124 - top) / 3.5)),
    );
    const size = 3.5 * s;
    const y = top + (bubble ? 0 : Math.min(140, Math.max(0, (h - 124 - top - size) / 2)));
    return {
      s,
      x0: w / 2 - 1.5 * s,
      y0: y + s / 4,
      field: box(w / 2, y + size / 2, size, size),
      score: box((125 + w - 10) / 2, 150, w - 135, 100),
      help: box(w - 64, y + size + 62, 120, 100),
    };
  }
  const roomy = Math.floor((w - 652) / 3.5);
  const s = Math.min(PLOT_SIDEWAYS, roomy >= 150 ? roomy : Math.floor((h - 32) / 3.5));
  const size = 3.5 * s;
  const left = w - size - 4;
  const panel = Math.min(left - 10, 640);
  return {
    s,
    x0: left + s / 4,
    y0: h / 2 - 1.5 * s,
    field: box(left + size / 2, h / 2, size, size),
    score: box((125 + panel) / 2, 110, panel - 135, 100),
    help: box((125 + panel) / 2, 250, 200, 100),
  };
}

/** A rail's middle on screen. */
export function railAt(l: Layout, e: number): { x: number; y: number } {
  const [a, b] = railPosts(e);
  return { x: l.x0 + ((a[0] + b[0]) / 2) * l.s, y: l.y0 + ((a[1] + b[1]) / 2) * l.s };
}

/** A rail's target: a square of half a plot on its middle, so neighbours meet at the posts without overlapping. */
export const railTarget = (l: Layout, e: number): Box => {
  const { x, y } = railAt(l, e);
  return box(x, y, l.s / 2, l.s / 2);
};

/** A plot's middle on screen. */
export const plotAt = (l: Layout, p: number) => ({
  x: l.x0 + ((p % 3) + 0.5) * l.s,
  y: l.y0 + (Math.floor(p / 3) + 0.5) * l.s,
});

/**
 * The rail a touch at (x, y) means: the rail whose target holds it, or inside a plot the plot's nearest open rail, so no
 * part of the field is dead. `laid` says the target's rail is already down; null is off the field.
 */
export function railUnder(
  l: Layout,
  mask: number,
  x: number,
  y: number,
): { rail: number; laid: boolean } | null {
  for (let e = 0; e < RAILS; e++) {
    const t = railTarget(l, e);
    if (Math.abs(x - t.x) <= t.w / 2 && Math.abs(y - t.y) <= t.h / 2) return { rail: e, laid: laid(mask, e) };
  }
  const c = Math.floor((x - l.x0) / l.s),
    r = Math.floor((y - l.y0) / l.s);
  if (c < 0 || c > 2 || r < 0 || r > 2) return null;
  const open = PLOT_RAILS[r * 3 + c].filter((e) => !laid(mask, e));
  if (!open.length) return null;
  const d = (e: number) => Math.hypot(railAt(l, e).x - x, railAt(l, e).y - y);
  return { rail: open.reduce((a, b) => (d(b) < d(a) ? b : a)), laid: false };
}
