import type { View } from '../../engine/view';
import { CELLS, COLS } from './logic';

export interface Point {
  x: number;
  y: number;
}

/**
 * Where Common Ground puts things, as a pure function of the view so a test can check both orientations. The floor is 3 × 2
 * cells of `min(160, (w − 80) / 3)` units, never under 100. Upright the tray sits under the room and the Visit button
 * bottom right, leaving the pet's bottom-left corner clear; sideways the tray stands in a column at the right.
 */
export function roomLayout(v: View) {
  const upright = v.h > v.w;
  const cell = Math.max(100, Math.min(160, (v.w - 80) / COLS));
  const floorW = cell * COLS,
    floorH = cell * 2;
  const cx = upright ? v.w / 2 : v.w * 0.4;
  const top = upright ? 390 : 285;
  const floor = { cx, cy: top + floorH / 2, cell, w: floorW, h: floorH, top, left: cx - floorW / 2 };
  const cellCenter = (i: number): Point => ({
    x: floor.left + (i % COLS) * cell + cell / 2,
    y: top + Math.floor(i / COLS) * cell + cell / 2,
  });
  const cells = Array.from({ length: CELLS }, (_, i) => cellCenter(i));
  const bw = Math.min(330, (v.w - 60) / 2 - 6),
    bh = 120,
    by = upright ? 215 : 180;
  const gap = bw + 14;
  const bubbles = [
    { x: (upright ? v.w / 2 : cx) - gap / 2, y: by, w: bw, h: bh },
    { x: (upright ? v.w / 2 : cx) + gap / 2, y: by, w: bw, h: bh },
  ];
  const fixture = {
    x: cx,
    y: top - 26,
    bottomY: top + floorH + 28,
    w: Math.min(220, floorW * 0.5),
  };
  const piece = Math.min(110, cell * 0.72);
  const tray = upright
    ? [0, 1, 2].map((i) => ({ x: v.w / 2 - 190 + i * 190 + 40, y: v.h - 200 }))
    : [0, 1, 2].map((i) => ({ x: v.w - 190, y: 240 + i * 150 }));
  const visit = upright ? { x: v.w - 110, y: v.h - 90 } : { x: v.w - 190, y: v.h - 100 };
  const undo = { x: visit.x - 150, y: visit.y };
  const friendStart = { x: floor.left - 62, y: top + floorH * 0.82 };
  return { upright, floor, cells, bubbles, fixture, piece, tray, visit, undo, friendStart };
}

/** The cell whose centre is nearest `(x, y)`, or -1 when the point is more than half a cell outside the floor. */
export function cellAt(l: ReturnType<typeof roomLayout>, x: number, y: number): number {
  const f = l.floor,
    m = f.cell / 2;
  if (x < f.left - m || x > f.left + f.w + m || y < f.top - m || y > f.top + f.h + m) return -1;
  let best = 0,
    bestD = Infinity;
  l.cells.forEach((c, i) => {
    const d = (c.x - x) ** 2 + (c.y - y) ** 2;
    if (d < bestD) ((best = i), (bestD = d));
  });
  return best;
}
