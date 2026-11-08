/** School's picture grid: squares, picture tiles and buttons are all this big; the list column beside the grid is this wide. */
export const SCHOOL_TOUCH = 100;
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
  const bh = g.school ? SCHOOL_TOUCH : 72;
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
    };
  }
  const panel = 280,
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
  };
}
