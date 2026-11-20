import type { View } from '../../engine/view';

export interface Point {
  x: number;
  y: number;
}

/** A critter's tap circle, from its feet (`SCALE` 0.32 of a 170-unit radius). */
export const CROSS_HIT = { y: -38.4, radius: 54.4 };

export interface CrossLayout {
  upright: boolean;
  gate: Point;
  /** The river's left and right edges and the top of the grass. */
  riverL: number;
  riverR: number;
  top: number;
  bulb: Point;
  dots: Point;
  shelf: Point;
  /** Where the guess cards' first row sits (a second row is 150 lower). */
  panelTop: number;
  left: (i: number) => Point;
  right: (i: number) => Point;
}

/**
 * Where everything in Critter Crossing stands. Sideways the plan is fractions of the view. Upright (768 wide) those
 * fractions put the bank's two columns 92 apart (under 100-unit taps), the guess bulb on top of the evidence shelf and
 * the critters mid-screen, so everything hangs up from the bottom edge: the guess bulb sits between the guide and the
 * shelf in the bottom row, the dots above it, and three rows of critters (feet 140 apart) stand above that with the
 * bridge at the middle row, so a tall phone's spare height is sky and the guess cards hang just above the top row.
 */
export function crossLayout(v: Pick<View, 'w' | 'h' | 'upright'>): CrossLayout {
  if (!v.upright) {
    const slot =
      (base: number) =>
      (i: number): Point => ({
        x: v.w * (base + 0.12 * (i % 2)),
        y: v.h * (0.4 + 0.15 * Math.floor(i / 2)) + 40,
      });
    return {
      upright: false,
      gate: { x: v.w * 0.42 - 10, y: v.h * 0.5 },
      riverL: v.w * 0.42,
      riverR: v.w * 0.58,
      top: v.h * 0.32,
      bulb: { x: v.w * 0.5, y: v.h - 80 },
      dots: { x: v.w * 0.5, y: v.h - 160 },
      shelf: { x: v.w - 24, y: v.h - 20 },
      panelTop: 130,
      left: slot(0.2),
      right: slot(0.68),
    };
  }
  const row = (r: number) => v.h - 230 - 140 * (2 - r);
  const col =
    (x0: number) =>
    (i: number): Point => ({ x: x0 + 120 * (i % 2), y: row(Math.floor(i / 2) % 3) });
  return {
    upright: true,
    gate: { x: v.w * 0.42 - 10, y: row(1) },
    riverL: v.w * 0.42,
    riverR: v.w * 0.58,
    top: Math.max(v.h * 0.32, v.h - 700),
    bulb: { x: 250, y: v.h - 80 },
    dots: { x: 250, y: v.h - 182 },
    shelf: { x: v.w - 24, y: v.h - 20 },
    panelTop: Math.max(130, v.h - 890),
    left: col(120),
    right: col(525),
  };
}
