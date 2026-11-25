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
/** The x of the right side of the little round letters: where a, d and g's stem stands against the magic c. */
const STEM_X = 0.5 + r * 1.05;
/** The magic c of a, d and g: start at the middle line's right, round the top and down the left, and back up to where a c would close. */
const magicC = (): Point[] => arc(0.5, cy, r * 1.05, r, -45, -360, 16);

/** The dot over an i or a j: a short dab above the stem, between the top line and the middle line. */
const DOT: Stroke = [
  [0.5, 0.19],
  [0.5, 0.26],
];

/** Where the hump of n, m, h and r springs from its stem: a little under the middle line, so the arch peaks on it. */
const HUMP_Y = FRAME.mid + 0.1;
/** A hump from the left at (x, HUMP_Y) up over the middle line and down the right to the base line, `w` wide (or stopping short for r). */
const hump = (x: number, w: number, to = 360): Point[] => {
  const pts = arc(x + w / 2, HUMP_Y, w / 2, 0.1, 180, to, 10);
  if (to === 360) pts.push([x + w, FRAME.base]);
  return pts;
};
/** A stem from `top` to `end`, then straight back up it to `back` (a retrace, as M and N have), ready for a hump or a bowl. */
const stemAndBack = (x: number, top: number, end: number, back: number): Point[] => [
  [x, top],
  [x, end],
  [x, back],
];
/** The bowl of p and b: a round that starts on the stem at the middle of the x-height, goes up and over clockwise and closes there. */
const bowl = (x: number): Point[] => arc(x + 0.12, cy, 0.12, r, 180, 540, 18);

/**
 * Little letters in stroke order, in the frame above. The first tranche is level 10's group (Handwriting Without
 * Tears' first lowercase group: c o s v w t); level 11 adds a d g (the magic c, then a stem); level 12 adds u i e l k y j; level 13 adds p r n m h b (down, back up and over); level 14 adds its own. Every letter starts at the top of
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
  // The magic c, then a short line down the right side from the middle line to the base line.
  a: [
    magicC(),
    [
      [STEM_X, FRAME.mid],
      [STEM_X, FRAME.base],
    ],
  ],
  // The magic c, then a tall line from the top line down to the base line.
  d: [
    magicC(),
    [
      [STEM_X, FRAME.top],
      [STEM_X, FRAME.base],
    ],
  ],
  // The magic c, then a line down past the base line to the bottom line, its tail turning left (a q's turns right).
  g: [
    magicC(),
    [
      [STEM_X, FRAME.mid],
      [STEM_X, FRAME.bottom - 0.1],
      ...arc(STEM_X - 0.1, FRAME.bottom - 0.1, 0.1, 0.1, 0, 90, 6).slice(1),
    ],
  ],
  // Down the left, round the bottom and up the right, then a short line down the right side again.
  u: [
    [
      [0.38, FRAME.mid],
      [0.38, FRAME.base - 0.1],
      ...arc(0.5, FRAME.base - 0.1, 0.12, 0.1, 180, 0, 10).slice(1),
      [0.62, FRAME.mid],
    ],
    [
      [0.62, FRAME.mid],
      [0.62, FRAME.base],
    ],
  ],
  // A short line down from the middle line to the base line, then a dot above it.
  i: [
    [
      [0.5, FRAME.mid],
      [0.5, FRAME.base],
    ],
    DOT,
  ],
  // A tall line down from the top line to the base line.
  l: [
    [
      [0.5, FRAME.top],
      [0.5, FRAME.base],
    ],
  ],
  // A tall line, then a little line in and a little line out: one stroke from the middle line, in to the tall line and out.
  k: [
    [
      [0.38, FRAME.top],
      [0.38, FRAME.base],
    ],
    [
      [0.64, FRAME.mid],
      [0.38, FRAME.mid + XH * 0.62],
      [0.66, FRAME.base],
    ],
  ],
  // Slide down to the base line, then a long slide down from the other side, past the base line to the bottom line.
  y: [
    [
      [0.37, FRAME.mid],
      [0.5, FRAME.base],
    ],
    [
      [0.63, FRAME.mid],
      [0.37, FRAME.bottom],
    ],
  ],
  // A line down past the base line, its tail turning left, then a dot above it.
  j: [
    [
      [0.5, FRAME.mid],
      [0.5, FRAME.bottom - 0.1],
      ...arc(0.4, FRAME.bottom - 0.1, 0.1, 0.1, 0, 90, 6).slice(1),
    ],
    DOT,
  ],
  // Down the stem, back up it, then over in a hump and down the right side.
  n: [[...stemAndBack(0.38, FRAME.mid, FRAME.base, HUMP_Y), ...hump(0.38, 0.24).slice(1)]],
  // The tall stem from the top line, back up to where n's hump springs, then the same hump.
  h: [[...stemAndBack(0.38, FRAME.top, FRAME.base, HUMP_Y), ...hump(0.38, 0.24).slice(1)]],
  // Down the stem, back up, and a little hump that stops at the top (r has no right leg).
  r: [[...stemAndBack(0.4, FRAME.mid, FRAME.base, HUMP_Y), ...hump(0.4, 0.2, 300).slice(1)]],
  // Down the stem, back up, a hump down to the base line, back up that leg, a second hump and down.
  m: [
    [
      ...stemAndBack(0.28, FRAME.mid, FRAME.base, HUMP_Y),
      ...hump(0.28, 0.22).slice(1),
      [0.5, HUMP_Y],
      ...hump(0.5, 0.22).slice(1),
    ],
  ],
  // A stem down past the base line to the bottom line, back up it to the middle of the x-height, then a bowl on its right.
  p: [[...stemAndBack(0.36, FRAME.mid, FRAME.bottom, cy), ...bowl(0.36).slice(1)]],
  // A tall stem from the top line to the base line, back up to the middle of the x-height, then a bowl on its right.
  b: [[...stemAndBack(0.36, FRAME.top, FRAME.base, cy), ...bowl(0.36).slice(1)]],
  // The one that starts in the middle: a line across the middle of the round, then up and round anticlockwise.
  e: [[[0.5 - r * 1.05, cy], [0.5 + r * 1.05, cy], ...arc(0.5, cy, r * 1.05, r, 0, -300, 16).slice(1)]],
};

/** Whether a letter is a little letter traced in the frame. */
export const isLower = (letter: string): boolean => letter in LOWER;

/** The strokes for a capital or a little letter. */
export const strokesOf = (letter: string): readonly Stroke[] => LOWER[letter] ?? LETTERS[letter];
