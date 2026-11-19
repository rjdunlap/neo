/** School's picture grid: squares, picture tiles and buttons are all this big; the list column beside the grid is this wide. */
export const SCHOOL_TOUCH = 100;
/** A grown-up's letter square is never smaller than this; a grid that cannot fit at it slides. */
export const MIN_TOUCH = 64;
/**
 * On an upright phone a grid that would only just fit slides at this square instead: 43.7 px under a thumb on a 390-wide
 * phone (a 10 × 10 grid shows whole there at 69, which is 35 px).
 */
export const THUMB_TOUCH = 86;
/** The small grid's squares: 96 at the least, 132 at the most. */
export const SMALL_MIN = 96;
export const SMALL_CAP = 132;
/** A grown-up's Hint and Start over are this high: 44.7 px under a thumb on a 390-wide upright phone. */
export const BUTTON_H = 88;
/** The room kept around the grid inside its window. */
export const PAD = 24;
export const SCHOOL_LIST_W = 210;
/** Level 6: the strip under the grid kept for the message's blanks. */
export const MSG_H = 76;
/** Touch play's two buttons, each a target of its own. */
export type SlotKind = 'hint' | 'again';
export interface Slot {
  kind: SlotKind;
  x: number;
  y: number;
  w: number;
  h: number;
}
/** The window on the grid: stage units. */
export interface Viewport {
  x: number;
  y: number;
  w: number;
  h: number;
}
export interface ListBox {
  cols: number;
  step: number;
  top: number;
  colW: number;
}

export interface TouchFrame {
  /** The window on the grid, the word list's corner, its columns, and the two buttons. */
  vp: Viewport;
  listX: number;
  listY: number;
  listBox: ListBox;
  btn: Slot[];
  /** The theme title, the tally and the "drag to slide" note (all anchored at their left middle). */
  title: { x: number; y: number };
  tally: { x: number; y: number };
  slideNote: { x: number; y: number };
  /** An upright phone (narrower than 1000): `touchSquare` keeps a square thumb-sized there. */
  phone: boolean;
}

/**
 * Touch play's frame for a `w` × `h` view: the grid's window, the word list and the two buttons. The list sits to the right
 * on a wide view, or under the grid on a tall one. On a tall view the grid starts below Home and help; on an upright phone
 * (narrower than 1000, chunk 31) it starts below the help button itself and the "drag to slide" note sits above the grid,
 * beside it, since the list's row has no room for it.
 */
export function touchFrame(
  w: number,
  h: number,
  g: { n: number; words: number; school: boolean; small: boolean; message: boolean },
): TouchFrame {
  const side = w >= h,
    narrow = w < 1000;
  const bh = g.school ? SCHOOL_TOUCH : BUTTON_H;
  const top = side ? 100 : narrow ? 220 : 150,
    left = 150,
    gap = 24;
  const msg = g.message ? MSG_H : 0;
  if (side) {
    // A small grid's short list takes a narrower column, so its squares stay big on a landscape view.
    const listW = g.school ? SCHOOL_LIST_W : g.small ? 222 : 262;
    const listX = w - listW - 16,
      listY = top + 4;
    const bw = (listW - 10) / 2,
      by = h - 24 - bh;
    return {
      vp: { x: left, y: top, w: listX - gap - left, h: h - top - 24 - msg },
      listX,
      listY,
      listBox: {
        cols: 1,
        step: Math.min(36, Math.floor((by - 12 - (listY + 102)) / g.words)),
        top: 102,
        colW: listW,
      },
      btn: [
        { kind: 'hint', x: listX, y: by, w: bw, h: bh },
        { kind: 'again', x: listX + bw + 10, y: by, w: bw, h: bh },
      ],
      title: { x: listX, y: listY + 8 },
      tally: { x: listX, y: listY + 40 },
      slideNote: { x: listX, y: listY + 66 },
      phone: false,
    };
  }
  // The list's panel: four rows of words above the two buttons.
  const panel = 208 + bh,
    listX = 160;
  let vp: Viewport, listY: number;
  if (g.school) {
    // The window holds the grid exactly and the tiles follow it, so a taller view leaves room above the buttons, not the grid.
    vp = { x: 24, y: top, w: w - 48, h: g.n * SCHOOL_TOUCH + 24 + 12 };
    listY = vp.y + vp.h + 12;
  } else {
    listY = h - panel;
    vp = { x: 24, y: top, w: w - 48, h: listY - 12 - top - msg };
  }
  const by = h - 24 - bh,
    bw = 200;
  return {
    vp,
    listX,
    listY,
    listBox: { cols: 3, step: 34, top: 44, colW: Math.floor((w - 160 - 24) / 3) },
    btn: [
      { kind: 'hint', x: 160, y: by, w: bw, h: bh },
      { kind: 'again', x: 160 + bw + 12, y: by, w: bw, h: bh },
    ],
    title: { x: listX, y: listY + 8 },
    tally: { x: listX + 330, y: listY + 8 },
    slideNote: narrow ? { x: 140, y: top - 28 } : { x: listX + 560, y: listY + 8 },
    phone: narrow,
  };
}

/**
 * Touch play's letter square for an `n` × `n` grid in the window `vp`: the biggest that shows the whole grid, no bigger than
 * 96 and no smaller than 64 (then the grid slides); a small grid's squares are bigger, 96 at the least; a picture grid's are
 * the school size. On an upright phone (`phone`, from the frame) a grid that fits only at a square smaller than a thumb
 * slides at the thumb size instead; a grid too big to fit at 64 still slides at 64, so it does not need more sliding.
 */
export function touchSquare(
  vp: Viewport,
  g: { n: number; school: boolean; small: boolean; phone?: boolean },
): number {
  const fit = Math.floor(Math.min(vp.w - PAD, vp.h - PAD) / g.n);
  if (g.school) return SCHOOL_TOUCH;
  if (g.small) return Math.max(SMALL_MIN, Math.min(SMALL_CAP, fit));
  if (g.phone && fit >= MIN_TOUCH && fit < THUMB_TOUCH) return THUMB_TOUCH;
  return Math.max(MIN_TOUCH, Math.min(96, fit));
}
