import { LETTERS, type Point, type Stroke } from './strokes';

/**
 * The four-line frame little letters are written in, as heights in the same 0..1 box the capitals use: the top line
 * (where tall letters like t start), the dashed middle line (where c, o, s, v and w start), the base line (where every
 * letter sits) and the bottom line (where tails will reach, levels 11–14). Equal spaces, as on school writing paper.
 */
export const FRAME = { top: 0.06, mid: 0.36, base: 0.66, bottom: 0.96 } as const;
/** How far across the box the frame's lines run; every little letter stays inside this span. */
export const FRAME_X = [0.12, 0.88] as const;

const XH = FRAME.base - FRAME.mid;

/**
 * Points round an ellipse centred at (cx, cy), from angle `from` to `to` in degrees. Screen angles: 0 is to the right
 * and 90 is down, so a falling angle runs anticlockwise on screen, the way a c is written.
 */
function arc(
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  from: number,
  to: number,
  steps: number,
): Point[] {
  const out: Point[] = [];
  for (let i = 0; i <= steps; i++) {
    const a = ((from + ((to - from) * i) / steps) * Math.PI) / 180;
    out.push([cx + rx * Math.cos(a), cy + ry * Math.sin(a)]);
  }
  return out;
}

const r = XH / 2;
const cy = FRAME.mid + r;

/**
 * Little letters in stroke order, in the frame above. The first tranche is level 10's group (Handwriting Without
 * Tears' first lowercase group: c o s v w t); levels 11–14 add their groups here. Every letter starts at the top of
 * its first stroke: c, o and s on the middle line's curve, v and w on the middle line, t on the top line.
 */
export const LOWER: Record<string, readonly Stroke[]> = {
  // Start just below the middle line on the right, round the top and down the left, stop low on the right.
  c: [arc(0.5, cy, r * 1.05, r, -40, -320, 14)],
  // Start at the top like a c, keep going all the way round and close at the start.
  o: [arc(0.5, cy, r * 1.05, r, -90, -450, 18)],
  // Start like a little c, curve back the other way, and finish low on the left.
  s: [
    [
      ...arc(0.5, FRAME.mid + XH / 4, r * 0.85, XH / 4, -25, -270, 8),
      ...arc(0.5, FRAME.mid + (XH * 3) / 4, r * 0.85, XH / 4, -90, 155, 9).slice(1),
    ],
  ],
  // Slide down, slide up: one stroke, starting on the middle line.
  v: [
    [
      [0.37, FRAME.mid],
      [0.5, FRAME.base],
      [0.63, FRAME.mid],
    ],
  ],
  // Down, up, down, up: one stroke, the middle peak back on the middle line.
  w: [
    [
      [0.26, FRAME.mid],
      [0.36, FRAME.base],
      [0.5, FRAME.mid],
      [0.64, FRAME.base],
      [0.74, FRAME.mid],
    ],
  ],
  // A tall line down from the top line to the base line, then a little line across on the middle line.
  t: [
    [
      [0.5, FRAME.top],
      [0.5, FRAME.base],
    ],
    [
      [0.38, FRAME.mid],
      [0.62, FRAME.mid],
    ],
  ],
};

/** Whether a letter is a little letter traced in the frame. */
export const isLower = (letter: string): boolean => letter in LOWER;

/** The strokes for a capital or a little letter. */
export const strokesOf = (letter: string): readonly Stroke[] => LOWER[letter] ?? LETTERS[letter];
