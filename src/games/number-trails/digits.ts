import type { Stroke } from '../letter-trails/strokes';

/**
 * Numerals 0 to 9 in a 0..1 writing box, in stroke order, every stroke starting at the top.
 *
 * INTERIM CONVENTION: these are the simple forms the common handwriting programmes broadly share (a one-stroke 1, 2, 3, 6, 7
 * and 8; a two-stroke 4, 5 and 9). They have NOT been checked against Handwriting Without Tears, D'Nealian or Zaner-Bloser's
 * printed charts. The roadmap keeps "One stroke convention" open until that is done; swapping a digit is an edit to this table
 * and `digits.test.ts` still has to pass.
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
  1: [[[0.3, 0.16], [0.55, 0], [0.55, 1]]],
  2: [[[0.14, 0.2], [0.27, 0.05], [0.5, 0], [0.74, 0.05], [0.87, 0.22], [0.8, 0.42], [0.5, 0.68], [0.12, 1], [0.9, 1]]],
  3: [[[0.13, 0.12], [0.3, 0.02], [0.55, 0], [0.78, 0.07], [0.85, 0.25], [0.7, 0.42], [0.42, 0.5], [0.74, 0.58], [0.9, 0.75], [0.82, 0.93], [0.55, 1], [0.28, 0.98], [0.1, 0.88]]],
  4: [[[0.7, 0], [0.1, 0.7], [0.93, 0.7]], [[0.7, 0], [0.7, 1]]],
  5: [
    [[0.25, 0], [0.2, 0.45], [0.45, 0.38], [0.72, 0.45], [0.88, 0.65], [0.85, 0.88], [0.6, 1], [0.3, 0.98], [0.1, 0.88]],
    [[0.25, 0], [0.82, 0]],
  ],
  6: [[[0.78, 0.1], [0.55, 0], [0.3, 0.1], [0.14, 0.4], [0.1, 0.7], [0.22, 0.93], [0.5, 1], [0.78, 0.93], [0.88, 0.72], [0.75, 0.52], [0.5, 0.45], [0.25, 0.55], [0.13, 0.7]]],
  7: [[[0.1, 0], [0.9, 0], [0.4, 1]]],
  8: [[[0.7, 0.12], [0.5, 0], [0.3, 0.1], [0.28, 0.28], [0.5, 0.45], [0.72, 0.62], [0.78, 0.82], [0.5, 1], [0.22, 0.82], [0.28, 0.62], [0.5, 0.45], [0.72, 0.28], [0.7, 0.12]]],
  9: [ring(0.5, 0.3, 0.3, 0.3), [[0.8, 0.3], [0.8, 1]]],
};

export const DIGIT_KEYS = Object.keys(DIGITS);
