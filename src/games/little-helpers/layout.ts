import type { View } from '../../engine/view';

/**
 * Where Little Helpers puts things (chunk 31, docs/definitions/phone-portrait.md). Sideways everything sits where it always
 * has; upright (the 768-wide area) the crowd rests in two rows up from the bottom edge, the fruit above them with the
 * rings and whistle over it, and the destination in the bottom-right corner, so a tall phone's spare height is sky.
 */
export interface Pt {
  x: number;
  y: number;
}

export interface HelpersLayout {
  upright: boolean;
  /** Where the fruit rests; carriers stand `carryDy` under it. */
  spot: Pt;
  basket: Pt;
  whistle: Pt;
  /** The ring badge's center. */
  badge: Pt;
  carryDy: number;
}

/** A waiting helper's place: `i` is its index in the crowd, `big` marks level 8's strong three (wider circles). */
export function crowdHome(v: Pick<View, 'w' | 'h' | 'upright'>, i: number): Pt {
  if (!v.upright) return { x: 190 + (i % 4) * 62 + (i >= 4 ? 30 : 0), y: v.h - 210 + (i >= 4 ? 90 : 0) };
  // Four across the upper row, the last three (level 8's big ones, 124 wide) at a wider pitch along the lower.
  return i < 4 ? { x: 215 + i * 110, y: v.h - 235 } : { x: 220 + (i - 4) * 130, y: v.h - 110 };
}

export function helpersLayout(v: Pick<View, 'w' | 'h' | 'upright'>, teamed: boolean): HelpersLayout {
  if (!v.upright) {
    const spot = { x: v.w * (teamed ? 0.58 : 0.55), y: v.h - 190 };
    return {
      upright: false,
      spot,
      basket: { x: v.w - 120, y: v.h - 120 },
      whistle: { x: spot.x + 190, y: spot.y - 210 },
      badge: { x: spot.x - 200, y: spot.y - 210 },
      carryDy: 70,
    };
  }
  const spot = { x: v.w / 2, y: v.h - 430 };
  const top = spot.y - 300;
  return {
    upright: true,
    spot,
    basket: { x: v.w - 110, y: v.h - 110 },
    whistle: { x: v.w - 90, y: top },
    badge: { x: v.w / 2, y: top },
    carryDy: 70,
  };
}

/** The gap between neighbours in the row of helpers holding a single fruit: 58 sideways (66 for the strong), 100 upright. */
export function carryPitch(upright: boolean | undefined, strong: boolean, n: number, w: number): number {
  if (!upright) return strong ? 66 : 58;
  return Math.min(strong ? 110 : 100, (w - 40) / Math.max(1, n));
}
