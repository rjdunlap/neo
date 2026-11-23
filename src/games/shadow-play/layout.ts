import type { View } from '../../engine/view';
import { GRID_H, GRID_W, SCREEN_AT } from './logic';

export type Box = { x: number; y: number; w: number; h: number };

const box = (x: number, y: number, w: number, h: number): Box => ({ x, y, w, h });

/** One rail row: the whole row takes a tap, the chip shows its cut-out at the lamp end, and the rail runs from the lamp to the screen. */
export interface RailRow {
  row: Box;
  chip: Box;
  lampX: number;
  screenX: number;
  /** The handle's box size; its centre rides the rail at `markX`. */
  handle: { w: number; h: number };
}

/** Where a distance from the lamp sits on a rail, drawn to scale. */
export const markX = (rail: RailRow, distance: number) =>
  rail.lampX + ((rail.screenX - rail.lampX) * distance) / SCREEN_AT;

/** The distance from the lamp of a point on a rail. */
export const distanceAt = (rail: RailRow, x: number) =>
  ((x - rail.lampX) / (rail.screenX - rail.lampX)) * SCREEN_AT;

/**
 * Where everything sits, boxes by their centres. Upright: the cloth screen beside Home, then the three rail rows and
 * Help and Light, all above the caption bubble a short phone shows (it starts 806 units down). Sideways: the screen on
 * the left above the caption bubble, and the rails with Help and Light in a column on the right.
 */
export function shadowLayout({ w, h, upright }: Pick<View, 'w' | 'h' | 'upright'>) {
  const rail = (
    x0: number,
    y: number,
    rowW: number,
    rowH: number,
    chip: number,
    gap: number,
    handleW: number,
  ): RailRow => ({
    row: box(x0 + rowW / 2, y, rowW, rowH),
    chip: box(x0 + 4 + chip / 2, y, chip, chip),
    lampX: x0 + 4 + chip + gap,
    screenX: x0 + rowW - 6,
    handle: { w: handleW, h: rowH - 8 },
  });
  if (upright) {
    const drop = Math.min(220, Math.max(0, (h - 1240) / 2));
    const sq = 26;
    return {
      sq,
      screen: box(w / 2 + 58, 12 + drop * 0.4 + (GRID_H * sq) / 2, GRID_W * sq, GRID_H * sq),
      rails: [0, 1, 2].map((i) => rail(12, 386 + drop + i * 102, w - 24, 100, 64, 26, 96)),
      help: box(w / 2 - 170, 698 + drop * 1.3, 250, 100),
      light: box(w / 2 + 130, 698 + drop * 1.3, 330, 100),
      upright: true,
    };
  }
  // Sideways the caption bubble covers the left 640 units below 343, so the targets stack in a column on its right.
  const left = (w - 1024) / 2;
  const x0 = left + 652;
  const sq = 20;
  return {
    sq,
    screen: box(left + 384, 30 + (GRID_H * sq) / 2, GRID_W * sq, GRID_H * sq),
    rails: [0, 1, 2].map((i) => rail(x0, 100 + i * 168, 362, 164, 56, 6, 64)),
    help: box(x0 + 86, 660, 168, 100),
    light: box(x0 + 268, 660, 184, 100),
    upright: false,
  };
}

export type ShadowLayout = ReturnType<typeof shadowLayout>;
