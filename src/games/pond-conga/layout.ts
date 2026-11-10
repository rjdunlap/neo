/** The smallest touch target in a grown-up game, in logical units. */
export const MIN_TOUCH = 64;
/** At school the cells and both buttons are 100 units: the ponds are 4 rows so that fits on a 768-unit side. */
export const SCHOOL_TOUCH = 100;

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
 * tall view (an upright iPad or phone, chunk 31) goes below them. `x`, `y` are the pond's top-left corner. `swipe` is where a
 * swipe steers: the whole view, so on an upright phone a thumb swipes in the space below the pond (the round's own home, help
 * and pet sit above the game and still take their taps, and Hint and Start over sit above the swipe area).
 */
export function pondTouchLayout(cols: number, rows: number, w: number, h: number, school: boolean) {
  const btn = school ? SCHOOL_TOUCH : 76,
    rest = 16 + btn + 44 + 12,
    cap = school ? SCHOOL_TOUCH : 80;
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
