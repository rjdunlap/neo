/** The smallest touch target in a grown-up game, in logical units. */
export const MIN_TOUCH = 64;
/** At school the cells and both buttons are 100 units: the ponds are 4 rows so that fits on a 768-unit side. */
export const SCHOOL_TOUCH = 100;

/** Hint and Start over at the grown-up levels: 88 units high, 44.7 CSS pixels on a 390-wide upright phone (was 76). */
export const GROWN_BUTTON = 88;

/** The guide's corner at the bottom left of a round, in units from the bottom. */
const GUIDE = 170;
/** The guide's corner, in units from the left. */
const GUIDE_W = 150;

export type SlotKind = 'hint' | 'again';
export interface Slot {
  kind: SlotKind;
  x: number;
  y: number;
  w: number;
  h: number;
}

/**
 * Touch layout: the pond under the tally with Hint and Start over beneath it, and a line of help under those. The pond is one
 * target for a swipe, so its cells may be under 64 units; the two buttons are always at least 64 across and tall. The home and
 * help buttons sit in the top-left corner, so the pond keeps to the right of them (a crumb must never hide behind one), or on a
 * tall view (an upright iPad or phone, chunk 31) goes below them. `x`, `y` are the top-left corner of the pond as drawn. `swipe`
 * is where a swipe steers: the whole view, so on an upright phone a thumb swipes in the space below the pond (the round's own
 * home, help and pet sit above the game and still take their taps, and Hint and Start over sit above the swipe area).
 *
 * `turned`: on a tall view a wide pond is drawn a quarter turn clockwise when that gives larger cells, so it fills the phone's
 * height instead of a strip across the top (a 15 by 9 pond on a 390 × 844 phone: 78-unit cells, was 47). The pond itself and
 * its rules are unchanged; only the picture turns, and a swipe is read in the turned pond's own directions. `noteX` and `noteW`
 * are the centre and wrapping width of the line of help.
 */
export function pondTouchLayout(cols: number, rows: number, w: number, h: number, school: boolean) {
  const flat = fitPond(cols, rows, w, h, school);
  // A turned pond is narrow enough to reach down past the guide's corner, so it stops above it (170 units, `uprightProblems`),
  // and its cells may grow to 100 units, as the school's do: a small pond then fills the phone too.
  const turned = h > w && cols > rows ? fitPond(rows, cols, w, h, school, GUIDE + 10, SCHOOL_TOUCH) : null;
  if (turned && turned.cell > flat.cell)
    // The line of help sits right of the guide, whose corner the narrow pond leaves beside its buttons.
    return { ...turned, turned: true, noteX: (GUIDE_W + w) / 2, noteW: w - GUIDE_W - 30 };
  return { ...flat, turned: false, noteX: w / 2, noteW: w - 40 };
}

/** The layout for a pond drawn `cols` across and `rows` down. */
function fitPond(cols: number, rows: number, w: number, h: number, school: boolean, clear = 0, most = 80) {
  const btn = school ? SCHOOL_TOUCH : GROWN_BUTTON,
    rest = Math.max(16 + btn + 44 + 12, clear),
    cap = school ? SCHOOL_TOUCH : most;
  const beside = Math.min(cap, Math.floor((w - 124 - 24) / cols), Math.floor((h - 132 - rest) / rows));
  const below = Math.min(cap, Math.floor((w - 60) / cols), Math.floor((h - 212 - rest) / rows));
  const y = beside >= below ? 132 : 212;
  const cell = Math.max(school ? SCHOOL_TOUCH : 24, Math.max(beside, below));
  const pw = cols * cell,
    ph = rows * cell,
    x = y === 132 ? Math.max(124, (w - pw) / 2) : (w - pw) / 2;
  const by = y + ph + 16,
    bw = Math.max(school ? SCHOOL_TOUCH : MIN_TOUCH, Math.min(210, Math.floor((w - 2 * 170) / 2)));
  const slots: Slot[] = (['hint', 'again'] as const).map((kind, k) => ({
    kind,
    x: w / 2 - bw - 8 + k * (bw + 16),
    y: by,
    w: bw,
    h: btn,
  }));
  return { cell, x, y, slots, noteY: by + btn + 28, swipe: { x: 0, y: 0, w, h } };
}
