import { orchardLayout, type Orchard } from './logic';

/** The answer pads and the turn button: one tile size, a pad per choice. */
export const PAD = { w: 120, h: 110 };

export interface RowsLayout {
  /** The rows' shared centre x and the first row's top. */
  x: number;
  y: number;
  width: number;
  /** A row's pitch, the height of the soil strip drawn in it and the height that takes a tap. */
  rowHeight: number;
  drawn: number;
  hit: number;
  /** The answer pads' centres, in the order the choices come. */
  pads: { x: number; y: number }[];
  /** The turn button's centre; it only shows once the pads are gone. */
  rotate: { x: number; y: number };
}

/**
 * Levels 1–3, pure: where the rows, the answer pads and the turn button go. Sideways the rows sit left of a column of
 * pads, as they always have (`orchardLayout`). Upright (the 768-wide area of a phone held upright) there is no room for
 * that column beside rows wide enough for five trees, so the rows take the width and the pads sit in a line under
 * them, where a thumb is; the rows are drawn taller too, so the strip she sees is the 100 units she can tap.
 */
export function rowsLayout(view: { w: number; h: number; upright?: true }, o: Orchard, pads = 3): RowsLayout {
  const { w, h } = view;
  if (!view.upright) {
    const l = orchardLayout(w, h, o);
    return {
      ...l,
      drawn: 92,
      hit: 100,
      pads: Array.from({ length: pads }, (_, i) => ({ x: w - 130, y: 390 + i * 125 })),
      rotate: { x: w - 130, y: 250 },
    };
  }
  const rowHeight = 112,
    padGap = 35;
  const width = Math.min(560, w - 120);
  const block = o.rows * rowHeight + padGap + PAD.h;
  const y = Math.max(230, (h - block) / 2);
  const padY = y + o.rows * rowHeight + padGap + PAD.h / 2;
  return {
    x: w / 2,
    y,
    width,
    rowHeight,
    drawn: 104,
    hit: 108,
    pads: Array.from({ length: pads }, (_, i) => ({ x: w / 2 + (i - (pads - 1) / 2) * 150, y: padY })),
    rotate: { x: w / 2, y: padY },
  };
}
