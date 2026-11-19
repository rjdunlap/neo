import type { View } from '../../engine/view';
import { DELTAS, DIRECTIONS, type Direction } from './logic';

/**
 * Where Robot Path puts things, as a pure function of the view so a test can check every level on the upright phone views
 * (chunk 31, docs/definitions/phone-portrait.md). Sideways, and on a narrow window that is not an upright phone, the
 * numbers are what the scene always used. Held upright (768 wide) the grid takes the top, the four arrows lie in one row
 * beneath it (the loop button beside them on loop levels), then the program slots, and the play button sits at the end of
 * the last slot row, so nothing crowds the grid however tall the phone is.
 */
export interface Point {
  x: number;
  y: number;
}

export interface RobotLayout {
  /** One grid cell's side. */
  cell: number;
  /** The grid's top-left corner. */
  origin: [number, number];
  arrows: Record<Direction, Point>;
  play: Point;
  clear: Point;
  loop: Point;
  /** The first program slot's center x, the first row's center y and the step between rows. */
  queue: { x0: number; top: number; rowStep: number };
}

/** Slot rows for a program of `limit` steps (four to a row). */
export const queueRows = (limit: number) => (limit > 4 ? 2 : 1);

export function robotLayout(
  v: View,
  size: number,
  limit: number,
  mode: 'steps' | 'counts' | 'loop',
): RobotLayout {
  const rows = queueRows(limit);
  const queue = (top: number) => ({ x0: v.w / 2 - 165, top, rowStep: 110 });
  if (v.upright) {
    // Below the grid: a gap, the arrow row, a gap, the slot rows and the bottom margin.
    const slotsH = rows * 110;
    const below = 36 + 100 + 36 + slotsH + 56;
    const top = 215;
    const cell = Math.max(
      100,
      Math.min(128, Math.floor((v.w - 40) / size), Math.floor((v.h - top - below) / size)),
    );
    const gridH = size * cell;
    const slotTop = v.h - 56 - (rows - 1) * 110 - 50;
    const arrowsY = slotTop - 50 - 36 - 50;
    // Spare height goes above and below the grid evenly, so a tall phone's board sits between Home and the arrows.
    const spare = Math.max(0, arrowsY - 50 - 36 - top - gridH);
    const originY = top + spare / 2;
    const n = mode === 'loop' ? 5 : 4;
    const step = mode === 'loop' ? 120 : 130;
    const at = (k: number): Point => ({ x: v.w / 2 + (k - (n - 1) / 2) * step, y: arrowsY });
    const order: Direction[] = ['up', 'right', 'down', 'left'];
    const arrows = Object.fromEntries(order.map((d, k) => [d, at(k)])) as Record<Direction, Point>;
    return {
      cell,
      origin: [(v.w - size * cell) / 2, originY],
      arrows,
      play: { x: v.w - 90, y: slotTop + (rows - 1) * 110 },
      clear: { x: v.w - 70, y: 70 },
      loop: at(4),
      queue: queue(slotTop),
    };
  }
  const portrait = v.h > v.w;
  const cell = portrait ? 100 : Math.max(100, Math.min(128, (v.h - 350) / size));
  const origin: [number, number] = portrait
    ? [20, 220]
    : [Math.max(150, v.w / 2 - 360), Math.max(40, (v.h - size * cell - 250) / 2)];
  const cx = v.w - 190;
  const cy = portrait ? v.h - 300 : v.h * 0.44;
  const arrows = Object.fromEntries(
    DIRECTIONS.map((d) => [d, { x: cx + DELTAS[d][0] * 112, y: cy + DELTAS[d][1] * 112 }]),
  ) as Record<Direction, Point>;
  const q = queue(v.h - (rows > 1 ? 170 : 80));
  return {
    cell,
    origin,
    arrows,
    play: { x: v.w - 90, y: v.h - 76 },
    clear: { x: v.w - 70, y: 70 },
    loop: { x: q.x0 + limit * 110 + 50, y: v.h - 80 },
    queue: q,
  };
}
