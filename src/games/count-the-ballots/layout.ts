import type { View } from '../../engine/view';
import { VOTERS } from './logic';

export interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface Layout {
  /** A ballot card: the three ranked pictures side by side (upright) or one above another (sideways). */
  card: { w: number; h: number };
  /** The three ranked pictures run across the card when true. */
  across: boolean;
  /** The nine hand slots' centers, three columns by three rows. */
  slots: { x: number; y: number }[];
  /** A pile tray's size and the three trays' centers, left to right. */
  tray: { w: number; h: number };
  piles: { x: number; y: number }[];
  help: Box;
}

const CARD_W = 190;
const CARD_H = 120;

/**
 * Upright: the hand (3 × 3 cards) under Home and "?", the three piles under it and Help below them on the right. Sideways:
 * the hand at the left of the guide's corner, the piles in tall trays at the right, Help under them. Cards and trays are at
 * least 100 units on both axes at every view the tests lay out, so the school band's 100-unit minimum holds too.
 */
export function layout(view: Pick<View, 'w' | 'h' | 'upright'>): Layout {
  const { w, h } = view;
  const slots: { x: number; y: number }[] = [];
  if (view.upright) {
    const g = 14;
    const cw = Math.min(CARD_W, Math.floor((w - 60 - 2 * g) / 3));
    const ch = CARD_H;
    const top = 230;
    for (let i = 0; i < VOTERS; i++)
      slots.push({ x: w / 2 + ((i % 3) - 1) * (cw + g), y: top + ch / 2 + Math.floor(i / 3) * (ch + g) });
    const pg = 16;
    const pw = Math.min(230, Math.floor((w - 40 - 2 * pg) / 3));
    const ph = 250;
    const py = top + 3 * ch + 2 * g + 40 + ph / 2;
    return {
      card: { w: cw, h: ch },
      across: true,
      slots,
      tray: { w: pw, h: ph },
      piles: [0, 1, 2].map((c) => ({ x: w / 2 + (c - 1) * (pw + pg), y: py })),
      help: { x: w - 90, y: py + ph / 2 + 80, w: 120, h: 100 },
    };
  }
  const g = 10;
  const cw = 130;
  const ch = Math.min(170, Math.floor((h - 150 - 2 * g) / 3));
  const left = 150;
  const top = Math.max(70, (h - (3 * ch + 2 * g)) / 2 - 30);
  for (let i = 0; i < VOTERS; i++)
    slots.push({ x: left + cw / 2 + (i % 3) * (cw + g), y: top + ch / 2 + Math.floor(i / 3) * (ch + g) });
  const pg = 12;
  const px = left + 3 * cw + 2 * g + 40;
  const pw = Math.min(150, Math.floor((w - 20 - px - 2 * pg) / 3));
  const ph = Math.min(380, h - 230);
  const py = 60 + ph / 2;
  return {
    card: { w: cw, h: ch },
    across: false,
    slots,
    tray: { w: pw, h: ph },
    piles: [0, 1, 2].map((c) => ({ x: px + pw / 2 + c * (pw + pg), y: py })),
    help: { x: px + (3 * pw + 2 * pg) / 2, y: py + ph / 2 + 70, w: 120, h: 100 },
  };
}

/** The first hand slot's index a hit at (x, y) means, or -1. Cards do not overlap, so the box is the test. */
export function slotUnder(l: Layout, x: number, y: number): number {
  return l.slots.findIndex((s) => Math.abs(x - s.x) <= l.card.w / 2 && Math.abs(y - s.y) <= l.card.h / 2);
}
