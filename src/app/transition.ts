import type { View } from '../engine/view';

/** A box in the root's logical units: where the tapped card or spot sat on the screen. */
export interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

/**
 * How one scene change looks (RW14 slice 9): the next screen grows out of the thing she tapped, Back shrinks the screen
 * she leaves into the thing that opened it, and every other change crossfades the old screen into the new one. Nothing
 * passes through a bare colour.
 */
export type Transition = { kind: 'grow'; from: Box } | { kind: 'shrink'; into: Box } | { kind: 'fade' };

/** Seconds for each kind; all stay under 0.4 s, as the packet asks. */
export const TRANSITION_SECONDS: Record<Transition['kind'], number> = { grow: 0.35, shrink: 0.35, fade: 0.3 };

/** The smallest a box may be to grow from or shrink into; a smaller or empty one means the tap had no real place. */
const MIN_SIDE = 8;

/** A box worth animating: finite, not degenerate, and at least partly on the screen. */
export function usableBox(b: Box | null | undefined, v: View): b is Box {
  if (!b || ![b.x, b.y, b.w, b.h].every(Number.isFinite)) return false;
  if (b.w < MIN_SIDE || b.h < MIN_SIDE) return false;
  return b.x < v.w && b.y < v.h && b.x + b.w > 0 && b.y + b.h > 0;
}

/**
 * Chooses the change: a forward tap's box grows (it wins), else the new scene's box for where the old one came from
 * shrinks, else a crossfade. With no old scene (the first screen) the new one simply appears under a fade.
 */
export function chooseTransition(from: Box | null | undefined, into: Box | null | undefined, v: View): Transition {
  if (usableBox(from, v)) return { kind: 'grow', from };
  if (usableBox(into, v)) return { kind: 'shrink', into };
  return { kind: 'fade' };
}

/**
 * Where a full-screen layer sits partway through a grow or shrink: at `t` 0 it covers `box`, at 1 the whole view. The
 * layer keeps the screen's proportions, scaled to the box's larger fit so it never looks squashed.
 */
export function frameAt(box: Box, v: View, t: number): { x: number; y: number; scale: number } {
  const k = Math.min(1, Math.max(0, t));
  const s0 = Math.max(box.w / v.w, box.h / v.h);
  const scale = s0 + (1 - s0) * k;
  // The layer's centre moves from the box's centre to the screen's.
  const cx = box.x + box.w / 2 + (v.w / 2 - (box.x + box.w / 2)) * k;
  const cy = box.y + box.h / 2 + (v.h / 2 - (box.y + box.h / 2)) * k;
  return { x: cx - (v.w * scale) / 2, y: cy - (v.h * scale) / 2, scale };
}
