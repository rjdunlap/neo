import type { View } from '../../engine/view';
import { captionPlace } from '../../ui/caption-layout';
import { colOf, rowOf } from './logic';

/** A box by its centre, as the upright check takes targets. */
export interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}
const box = (x: number, y: number, w: number, h: number): Box => ({ x, y, w, h });
/** A box by its corners, turned into one by its centre. */
const span = (x0: number, y0: number, x1: number, y1: number): Box =>
  box((x0 + x1) / 2, (y0 + y1) / 2, x1 - x0, y1 - y0);

export interface Layout {
  upright: boolean;
  /** The jar's box: the glass and its pile are fitted inside. */
  jar: Box;
  /** The clue card: tapped, it speaks the clue again. */
  clue: Box;
  /** The note: what to do or the earlier clues, one per line, or the working of a fault or a hint. */
  note: Box;
  /** The board's top-left corner and its square cell. */
  board: { x: number; y: number; cell: number };
  help: Box;
  next: Box;
  /** Where the last look's two or three cards go. */
  cards: Box;
}

/** The grown-up band's smallest target, and the largest cell the board grows to. */
export const MIN_CELL = 64;
const MAX_CELL = 74;
/** The button row's height. */
const BUTTON_H = 90;

/**
 * Upright, top to bottom: a strip with the jar on the left (clear of Home) and the clue card and the note to its right; the board, ten across and six down; Help and Next clue beneath it, all above the caption bubble on
 * a short phone and above the guide's corner otherwise. Sideways: the board on the left, below Home's column, and the jar,
 * the clues and the buttons on the right.
 */
export function layout(view: Pick<View, 'w' | 'h' | 'upright'>): Layout {
  const { w, h } = view;
  if (view.upright) {
    const caption = captionPlace({ ...view, scale: 1 } as View, true);
    const bubble = caption.mode === 'bubble' ? caption.band : null;
    const bottom = bubble ? bubble.y - 6 : h - 176;
    const stripB = 270;
    const right0 = 310;
    const cell = Math.floor(Math.min(MAX_CELL, (w - 20) / 10, (bottom - stripB - 8 - BUTTON_H - 12) / 6));
    const bw = cell * 10;
    const bx = Math.round((w - bw) / 2);
    const by = stripB + 8;
    const rowY = by + cell * 6 + 12 + BUTTON_H / 2;
    return {
      upright: true,
      jar: span(120, 10, 300, stripB),
      clue: span(right0, 10, w - 10, 112),
      note: span(right0, 118, w - 10, stripB),
      board: { x: bx, y: by, cell },
      help: box(w / 2 - 170, rowY, 220, BUTTON_H),
      next: box(w / 2 + 120, rowY, 300, BUTTON_H),
      cards: span(right0, 10, w - 10, 112),
    };
  }
  // Sideways: the board starts below Home's column; if it would reach the guide's corner it moves right of it.
  const y0 = 212;
  const panel = 256;
  let x0 = 118;
  let cell = Math.floor(
    Math.max(MIN_CELL, Math.min(MAX_CELL, (w - x0 - panel - 20) / 10, (h - 10 - y0) / 6)),
  );
  if (y0 + cell * 6 > h - 170) {
    x0 = 155;
    cell = Math.floor(Math.max(MIN_CELL, Math.min(MAX_CELL, (w - x0 - panel - 20) / 10, (h - 10 - y0) / 6)));
    if (y0 + cell * 6 > h - 170 && w - x0 - panel - 20 < cell * 10) cell = MIN_CELL;
  }
  const p0 = x0 + cell * 10 + 12;
  const p1 = w - 10;
  const pw = p1 - p0;
  return {
    upright: false,
    jar: span(p0 + (pw - 200) / 2, 10, p0 + (pw + 200) / 2, 270),
    clue: span(p0, 278, p1, 384),
    note: span(p0, 390, p1, 572),
    board: { x: x0, y: y0, cell },
    next: box((p0 + p1) / 2, 627, pw, BUTTON_H),
    help: box((p0 + p1) / 2, Math.min(h - 10 - BUTTON_H / 2, 727), Math.min(pw, 220), Math.min(BUTTON_H, 80)),
    cards: span(x0, y0, x0 + cell * 10, y0 + cell * 6),
  };
}

/** A number's cell on the board. */
export function cellBox(l: Layout, n: number): Box {
  const { x, y, cell } = l.board;
  return box(x + (colOf(n) + 0.5) * cell, y + (rowOf(n) + 0.5) * cell, cell, cell);
}

/** The board's whole area. */
export const boardBox = (l: Layout): Box =>
  span(l.board.x, l.board.y, l.board.x + l.board.cell * 10, l.board.y + l.board.cell * 6);

/** The number under a point on the board, or null off it. */
export function numberAt(l: Layout, px: number, py: number): number | null {
  const { x, y, cell } = l.board;
  const c = Math.floor((px - x) / cell);
  const r = Math.floor((py - y) / cell);
  if (c < 0 || c > 9 || r < 0 || r > 5) return null;
  return r * 10 + c + 1;
}

/** The last look's cards, side by side in their area. */
export function cardBoxes(l: Layout, n: number): Box[] {
  const a = l.cards;
  const gap = 14;
  const cw = Math.min(190, (a.w - gap * (n + 1)) / n);
  const ch = Math.min(a.h - 20, 170);
  const total = cw * n + gap * (n - 1);
  return Array.from({ length: n }, (_, i) => box(a.x - total / 2 + cw / 2 + i * (cw + gap), a.y, cw, ch));
}
