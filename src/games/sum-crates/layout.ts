import type { View } from '../../engine/view';
import { captionPlace } from '../../ui/caption-layout';

export const BUTTON = { w: 168, h: 100 };
/** A sign badge, and the margin left and above the crates it hangs in. */
export const BADGE = 50;
const GAP = 10;
/** How far a badge sits off the line's own axis, so the across and down signs in a shared gap never touch. */
export const BADGE_SHIFT = 20;

export interface CrateLayout {
  /** A crate's side in units. */
  cell: number;
  /** Centre of the crate at row 0, column 0. */
  first: { x: number; y: number };
  /** A tray fruit's side, and every fruit's centre (fruit 1 first). */
  tray: { size: number; at: { x: number; y: number }[] };
  heading: { x: number; y: number };
  hint: { x: number; y: number };
}

/** Rows a tray of `count` needs at tile `t` in a strip `width` wide, and how many fit in one. */
const perRow = (width: number, t: number) => Math.max(1, Math.floor((width + GAP) / (t + GAP)));

/**
 * The stack, tray and Hint, from the view alone. Upright: heading, stack, then the tray in one or two rows above the foot
 * and Hint at the right of the foot, clear of the guide and (when the words come as a bubble) of the bubble. Sideways: the
 * stack left of centre, the tray as a block and Hint on the right. Crates and tray fruit are 100 units or more whenever the
 * view has room; where it has none (the grown-up level on a short phone) they shrink together, never below 64.
 */
export function crateLayout(
  view: View,
  rows: number,
  cols: number,
  count: number,
  minSide = 100,
): CrateLayout {
  const { w, h, upright } = view;
  const caption = upright ? captionPlace(view, true) : null;
  if (!upright) {
    const panelW = 345;
    const left = 120;
    const cell = Math.floor(Math.min(130, (w - panelW - left - BADGE) / cols, (h - 92 - BADGE - 24) / rows));
    const t = 100;
    const cols3 = 3;
    const x0 = left + BADGE + cell / 2;
    const first = { x: Math.round(x0), y: Math.round(92 + BADGE + cell / 2) };
    const px = w - 24 - (cols3 * (t + GAP) - GAP) / 2;
    const at = Array.from({ length: count }, (_, i) => ({
      x: Math.round(px - (cols3 * (t + GAP) - GAP) / 2 + t / 2 + (i % cols3) * (t + GAP)),
      y: 150 + t / 2 + Math.floor(i / cols3) * (t + GAP),
    }));
    const trayBottom = 150 + Math.ceil(count / cols3) * (t + GAP);
    return {
      cell,
      first,
      tray: { size: t, at },
      heading: { x: first.x + ((cols - 1) * cell) / 2, y: 48 },
      hint: { x: px, y: Math.min(h - 70, trayBottom + 20 + BUTTON.h / 2) },
    };
  }
  const bandBottom = caption?.mode === 'bubble' && caption.band ? caption.band.y - 12 : h - 176;
  const top = 168 + BADGE;
  const widest = w - 8 - 119;
  // Tray fruit shrink first (never below 64), so the crates keep the level's floor while the view has any room.
  let pick = { cell: 0, t: 100, n: 1 };
  for (let t = 100; t >= 64; t -= 4) {
    const n = Math.ceil(count / perRow(widest, t));
    const trayH = n * t + (n - 1) * GAP;
    const cell = Math.floor(Math.min(130, (widest - BADGE) / cols, (bandBottom - top - 16 - trayH) / rows));
    pick = { cell, t, n };
    if (cell >= minSide) break;
  }
  const { cell, t, n } = pick;
  const boardW = BADGE + cols * cell;
  const x0 = Math.max(119, (w - boardW) / 2);
  const first = { x: Math.round(x0 + BADGE + cell / 2), y: Math.round(top + cell / 2) };
  const per = perRow(widest, t);
  const trayTop = Math.min(bandBottom - (n * t + (n - 1) * GAP), top + rows * cell + 16 + 12);
  const at = Array.from({ length: count }, (_, i) => {
    const row = Math.floor(i / per);
    const inRow = Math.min(per, count - row * per);
    const rowW = inRow * t + (inRow - 1) * GAP;
    return {
      x: Math.round(Math.max(119, (w - rowW) / 2) + t / 2 + (i % per) * (t + GAP)),
      y: Math.round(trayTop + t / 2 + row * (t + GAP)),
    };
  });
  return {
    cell,
    first,
    tray: { size: t, at },
    heading: { x: w / 2, y: 128 },
    hint: { x: w - 110, y: h - 80 },
  };
}
