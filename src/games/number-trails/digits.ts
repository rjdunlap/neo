import type { Stroke } from '../../learning/tracing/strokes';

/**
 * Numerals 0 to 9 in a 0..1 writing box, in stroke order, every stroke starting at the top.
 *
 * CONVENTION: Handwriting Without Tears (decided 2026-10-23), checked 2026-11-10 against its published Number Formation
 * Chart (lwtears.com/letter-number-formation-charts, (c) 2013). What the chart fixes: 1 is a plain big line down, no flag;
 * 2, 3, 5 and 7 start in the top-left starting corner; 4 is open (a little line down and across, then a big line down from
 * the top); 5 goes down and around, then gets its top line; 6 starts in the top-left corner and curls up at the bottom; 8
 * starts at the top centre, begins like an S and goes home; 9 is ONE stroke from its own top-right corner (a little curve,
 * back up to the corner, a big line down); 0 starts at the top centre and goes left. The two-stroke numerals are 4 and 5.
 * Swapping a digit is an edit to this table, and `digits.test.ts` still has to pass. The sticker draws from this table.
 */
const ring = (cx: number, cy: number, rx: number, ry: number, from = 0): Stroke => {
  // Counterclockwise from the top (the way a 0 or the ball of a 9 is drawn), closing on its start.
  const out: [number, number][] = [];
  const steps = 12;
  for (let i = 0; i <= steps; i++) {
    const a = from + (i / steps) * Math.PI * 2;
    out.push([+(cx - Math.sin(a) * rx).toFixed(3), +(cy - Math.cos(a) * ry).toFixed(3)]);
  }
  return out;
};

export const DIGITS: Record<string, readonly Stroke[]> = {
  0: [ring(0.5, 0.5, 0.31, 0.5)],
  1: [
    [
      [0.5, 0],
      [0.5, 1],
    ],
  ],
  2: [
    [
      [0.14, 0.2],
      [0.27, 0.05],
      [0.5, 0],
      [0.74, 0.05],
      [0.87, 0.22],
      [0.8, 0.42],
      [0.5, 0.68],
      [0.12, 1],
      [0.9, 1],
    ],
  ],
  3: [
    [
      [0.13, 0.12],
      [0.3, 0.02],
      [0.55, 0],
      [0.78, 0.07],
      [0.85, 0.25],
      [0.7, 0.42],
      [0.42, 0.5],
      [0.74, 0.58],
      [0.9, 0.75],
      [0.82, 0.93],
      [0.55, 1],
      [0.28, 0.98],
      [0.1, 0.88],
    ],
  ],
  4: [
    [
      [0.15, 0],
      [0.15, 0.55],
      [0.92, 0.55],
    ],
    [
      [0.68, 0],
      [0.68, 1],
    ],
  ],
  5: [
    [
      [0.25, 0],
      [0.2, 0.45],
      [0.45, 0.38],
      [0.72, 0.45],
      [0.88, 0.65],
      [0.85, 0.88],
      [0.6, 1],
      [0.3, 0.98],
      [0.1, 0.88],
    ],
    [
      [0.25, 0],
      [0.82, 0],
    ],
  ],
  6: [
    [
      [0.22, 0],
      [0.15, 0.35],
      [0.13, 0.7],
      [0.24, 0.93],
      [0.5, 1],
      [0.76, 0.93],
      [0.86, 0.75],
      [0.74, 0.57],
      [0.5, 0.5],
      [0.27, 0.58],
      [0.14, 0.72],
    ],
  ],
  7: [
    [
      [0.1, 0],
      [0.9, 0],
      [0.4, 1],
    ],
  ],
  8: [
    [
      [0.5, 0],
      [0.3, 0.1],
      [0.28, 0.28],
      [0.5, 0.45],
      [0.72, 0.62],
      [0.78, 0.82],
      [0.5, 1],
      [0.22, 0.82],
      [0.28, 0.62],
      [0.5, 0.45],
      [0.72, 0.28],
      [0.7, 0.1],
      [0.5, 0],
    ],
  ],
  9: [
    [
      [0.8, 0.06],
      [0.6, 0],
      [0.4, 0.02],
      [0.24, 0.14],
      [0.2, 0.32],
      [0.3, 0.52],
      [0.5, 0.6],
      [0.7, 0.5],
      [0.8, 0.3],
      [0.8, 0.06],
      [0.8, 1],
    ],
  ],
};

export const DIGIT_KEYS = Object.keys(DIGITS);
