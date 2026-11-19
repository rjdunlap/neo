import { spread, type View } from '../../engine/view';

/** A tub's tap radius in units: 144 across, scaled up with the lap opening's big tub. */
export const TUB_R = 72;

/** Where the tubs stand: x, y, and how many to a row. */
export interface TubSpot {
  x: number;
  y: number;
}

/**
 * Scoop Shop's fixed positions for a view (chunk 31, docs/definitions/phone-portrait.md). Sideways they are the old ones:
 * the counter's top is 60% down and the tubs run in one row along the bottom. Held upright (768 wide, 1,366 or more tall)
 * the counter's top is a fixed 640 above the bottom edge, so the counter is not a brown floor with the tubs at its far
 * end, and the tubs stand in two rows of up to three, 144 across and apart, with the bottom row clear of the guide in the
 * bottom-left corner (the one tub of the lap opening stands in the middle).
 */
export function counterTopFor(v: View): number {
  return v.upright ? v.h - 640 : v.h * 0.6;
}

export function tubSpotsFor(v: View, n: number, lap: boolean): TubSpot[] {
  if (!v.upright) {
    const xs = n === 1 && lap ? [v.w * 0.5] : spread(n, 150, v.w - 40, 140);
    return xs.map((x) => ({ x, y: v.h - 70 }));
  }
  if (n === 1 && lap) return [{ x: v.w * 0.5, y: v.h - 150 }];
  const top = Math.ceil(n / 2);
  const bottom = n - top;
  // The bottom row starts right of the guide's corner; the top row has the whole width.
  const upper = spread(top, 60, v.w - 40, 200).map((x) => ({ x, y: v.h - 330 }));
  const lower = spread(bottom, 250, v.w - 40, 200).map((x) => ({ x, y: v.h - 135 }));
  return n <= 3 ? spread(n, 250, v.w - 40, 200).map((x) => ({ x, y: v.h - 135 })) : [...upper, ...lower];
}
