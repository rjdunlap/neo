import type { View } from '../../engine/view';
import { captionPlace } from '../../ui/caption-layout';

export interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}
/** A box by its centre, as the upright check takes targets. */
const box = (x: number, y: number, w: number, h: number): Box => ({ x, y, w, h });
/** A box by its top-left corner, turned into one by its centre. */
const span = (x0: number, y0: number, x1: number, y1: number): Box =>
  box((x0 + x1) / 2, (y0 + y1) / 2, x1 - x0, y1 - y0);

export interface Layout {
  upright: boolean;
  /** The chosen sketch's strip, with the sketch drawn large, its arrows and its name plate. */
  strip: Box;
  sketchAt: { x: number; y: number; k: number };
  prev: Box;
  next: Box;
  plate: Box;
  /** The page tabs: Sketches (upright only) and Key, then Help. */
  tabs: { sketches: Box | null; key: Box; help: Box };
  /** The warden's note: the working of a fault or a hint, or what to do. */
  note: Box;
  /** The Key page's panel, and (sideways) the Sketches page beside it; upright both share `page`. */
  page: Box;
  sketches: Box;
}

/** A key row's height and the size of its two branch ends. */
export const ROW = 104;
export const END = { w: 178, h: 88 };

/**
 * Upright, top to bottom: the chosen-sketch strip beside Home, the tabs and Help, the warden's note, then the open page,
 * which ends above the caption bubble on a short phone and above the guide's corner otherwise. Sideways: the Sketches page
 * on the left, always open, and the strip, the Key tab, Help, the note and the Key page on the right.
 */
export function layout(view: Pick<View, 'w' | 'h' | 'upright'>): Layout {
  const { w, h } = view;
  const caption = captionPlace({ ...view, scale: 1 } as View, true);
  const bubble = caption.mode === 'bubble' ? caption.band : null;
  if (view.upright) {
    const tabsY = 300;
    const bottom = bubble ? bubble.y - 6 : h - 176;
    const page = span(10, 460, w - 10, bottom);
    return {
      upright: true,
      ...stripIn(125, w - 10),
      tabs: {
        sketches: box(140, tabsY, 250, 90),
        key: box(410, tabsY, 250, 90),
        help: box(w - 100, tabsY, 180, 90),
      },
      note: span(10, 352, w - 10, 452),
      page,
      sketches: page,
    };
  }
  const mid = Math.round(w * 0.46);
  const r0 = mid + 10;
  return {
    upright: false,
    ...stripIn(r0, w - 10),
    tabs: { sketches: null, key: box(r0 + 135, 300, 250, 90), help: box(w - 100, 300, 180, 90) },
    note: span(r0, 352, w - 10, 452),
    page: span(r0, 460, w - 10, h - 10),
    sketches: span(150, 10, mid, h - 10),
  };
}

/** The strip from x0 to x1: the back arrow, the sketch, the number over the name plate, and the next arrow. */
function stripIn(x0: number, x1: number) {
  const plate = box(x1 - 110 - 85, 185, 170, 88);
  return {
    strip: span(x0, 10, x1, 250),
    sketchAt: { x: (x0 + 105 + plate.x - plate.w / 2) / 2, y: 128, k: 0.8 },
    prev: box(x0 + 55, 130, 100, 100),
    next: box(x1 - 55, 130, 100, 100),
    plate,
  };
}

/** The Sketches page's cells: three across, two rows at six sketches and three at nine; the page never scrolls. */
export function sketchCells(l: Layout, n: number): Box[] {
  const rows = Math.ceil(n / 3);
  const p = l.sketches;
  const cw = p.w / 3,
    ch = Math.min(p.h / rows, cw * 1.1);
  const top = p.y - p.h / 2;
  return Array.from({ length: n }, (_, i) =>
    box(p.x - p.w / 2 + cw * ((i % 3) + 0.5), top + ch * (Math.floor(i / 3) + 0.5), cw - 8, ch - 8),
  );
}

/** Where a key row sits in the Key panel's own coordinates (its top-left at the panel's), before scrolling. */
export const rowTop = (i: number) => i * ROW;

/** A key row's parts, in the panel's coordinates before scrolling: the question and its two branch ends. */
export function rowParts(l: Layout, i: number): { question: Box; yes: Box; no: Box } {
  const W = l.page.w;
  const y = rowTop(i) + ROW / 2;
  const no = box(W - END.w / 2 - 6, y, END.w, END.h);
  const yes = box(no.x - END.w - 10, y, END.w, END.h);
  const qw = yes.x - END.w / 2 - 10;
  return { question: box(qw / 2, y, qw - 4, END.h), yes, no };
}

/** The Key panel's furthest scroll. */
export const maxScroll = (l: Layout, rows: number) => Math.max(0, rows * ROW - l.page.h);
