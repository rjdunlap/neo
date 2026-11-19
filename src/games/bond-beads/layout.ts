import type { View } from '../../engine/view';

/**
 * Where Bond Beads puts things, as pure functions of the view, so the sideways layout and the upright phone's (chunk 31,
 * docs/definitions/phone-portrait.md) are both testable (`logic.test.ts` sideways, `upright.test.ts` upright). Sideways
 * the card and the buttons are a right-hand column beside the table. Upright the table is the bottom of the screen,
 * where a thumb reaches, no taller than `TABLE_TALL` times its width; the card sits just above it and the buttons under
 * it.
 */

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}
export interface Pt {
  x: number;
  y: number;
}

export const centre = (r: Rect): Pt => ({ x: r.x + r.w / 2, y: r.y + r.h / 2 });
export const overlaps = (a: Rect, b: Rect) =>
  a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
const inside = (a: Rect, v: View) => a.x >= 0 && a.y >= 0 && a.x + a.w <= v.w && a.y + a.h <= v.h;

/** The home and ? buttons (top left) and the guide (bottom left). */
export const HOME_CORNER = { w: 130, h: 215 };
export const PET_CORNER = { w: 160, h: 170 };
export function corners(v: View): Rect[] {
  return [
    { x: 0, y: 0, ...HOME_CORNER },
    { x: 0, y: v.h - PET_CORNER.h, ...PET_CORNER },
  ];
}

/** A bead's body radius; its hand nubs reach to `BEAD_REACH`, so a bead is 128 units across. */
export const BEAD_R = 50;
export const BEAD_REACH = 64;
/** Bead centres stay at least this far apart, leaving a gap where a link can be tapped. */
export const BEAD_GAP = 3.2 * BEAD_R;
export const BUTTON_R = 56;
export const CARD_MIN_H = 140;
const M = 20;
const TALLY_H = 70;

export interface BeadLayout {
  beads: Pt[];
  table: Rect;
  tally: Rect;
  card: Rect | null;
  check: Rect | null;
  undo: Rect;
  again: Rect;
}

/** Points around an ellipse at equal arc length from the top, each nudged along the arc by its jitter (in radians). */
function ring(c: Pt, rx: number, ry: number, n: number, amount: number, nudge: number): Pt[] {
  const STEPS = 720;
  const pts: Pt[] = [];
  const cum: number[] = [0];
  for (let i = 1; i <= STEPS; i++) {
    const a0 = -Math.PI / 2 + (2 * Math.PI * (i - 1)) / STEPS;
    const a1 = -Math.PI / 2 + (2 * Math.PI * i) / STEPS;
    cum.push(cum[i - 1] + Math.hypot(rx * (Math.cos(a1) - Math.cos(a0)), ry * (Math.sin(a1) - Math.sin(a0))));
  }
  const total = cum[STEPS];
  const at = (s: number, out: number): Pt => {
    const target = ((s % total) + total) % total;
    let i = 0;
    while (i < STEPS - 1 && cum[i + 1] < target) i++;
    const a = -Math.PI / 2 + (2 * Math.PI * i) / STEPS;
    return { x: c.x + (rx + out) * Math.cos(a), y: c.y + (ry + out) * Math.sin(a) };
  };
  const mean = (rx + ry) / 2;
  for (let i = 0; i < n; i++) {
    pts.push(
      at(
        (total * i) / n + JITTER[i % JITTER.length] * amount * mean,
        RADIAL[i % RADIAL.length] * nudge * NUDGE,
      ),
    );
  }
  return pts;
}

/** Whether beads are `BEAD_GAP` apart and every pair of possible links has its own midpoint. */
export function spaced(beads: readonly Pt[]): boolean {
  const n = beads.length;
  for (let i = 0; i < n; i++)
    for (let j = i + 1; j < n; j++) {
      if (Math.hypot(beads[i].x - beads[j].x, beads[i].y - beads[j].y) < BEAD_GAP) return false;
    }
  const mids: Pt[] = [];
  for (let i = 0; i < n; i++)
    for (let j = i + 1; j < n; j++)
      mids.push({ x: (beads[i].x + beads[j].x) / 2, y: (beads[i].y + beads[j].y) / 2 });
  for (let i = 0; i < mids.length; i++)
    for (let j = i + 1; j < mids.length; j++) {
      if (Math.hypot(mids[i].x - mids[j].x, mids[i].y - mids[j].y) < MID_GAP) return false;
    }
  return true;
}

/** Small offsets so no two of the beads' possible links share a midpoint (a square's diagonals would). */
const JITTER = [0, 0.26, -0.18, -0.3, -0.12, 0.15, -0.09];
/** In-and-out nudges (a share of `NUDGE`), so beads across the ring from each other do not share a link midpoint. */
const RADIAL = [0.5, -0.5, 0.3, -0.6, 0.6, -0.3, 0.1];
const NUDGE = 36;
/** Jitter strengths tried in turn: the first that keeps every bead `BEAD_GAP` apart and every link midpoint distinct wins. */
export const JITTER_AMOUNTS: [number, number][] = [
  [1, 0],
  [0.7, 0],
  [0.45, 0],
  [0.3, 0],
  [0.2, 0],
  [0.12, 0],
  [0.06, 0],
  [0, 0],
  [0.3, 0.5],
  [0.2, 0.7],
  [0.12, 1],
  [0.06, 1],
  [0, 1],
  [0.2, 1.3],
  [0, 1.6],
];
/** Link midpoints stay at least this far apart, so a tap on a link is unambiguous. */
export const MID_GAP = 30;
/** The card when it pictures two shapes (levels 3–4): taller in a landscape column, where the pictures stack. */
const TWO_CARD_H = 360;
/** Upright: the card, and how tall it grows for two or three pictures when a tall phone leaves the room. */
const CARD_H = 200;
const TWO_CARD_TALL = 280;
/** Upright: the table is never taller than this many times its width, and sits at the bottom, where a thumb reaches. */
export const TABLE_TALL = 1.15;
/** Upright: the table height seven beads need; under it the card gives up height first. */
const TABLE_WANT = 560;

const button = (cx: number, cy: number): Rect => ({
  x: cx - BUTTON_R,
  y: cy - BUTTON_R,
  w: 2 * BUTTON_R,
  h: 2 * BUTTON_R,
});

/**
 * Where everything goes for `n` beads. Sideways: the tally strip at the top, the card (levels 2 to 7; `cardShapes`
 * pictures, 0 for none) and the buttons in a right-hand column, and the beads on an ellipse in the table that is left.
 * Upright: the buttons in a bottom row, the table above them (no taller than `TABLE_TALL` times its width), the card
 * just above the table and the tally just above the card. Everything stays clear of the corners. Null rather than a bead closer than `BEAD_GAP` to another.
 */
export function beadLayout(v: View, n: number, cardShapes: number | boolean): BeadLayout | null {
  const shapes = typeof cardShapes === 'boolean' ? (cardShapes ? 1 : 0) : cardShapes;
  const withCard = shapes > 0;
  const wide = v.w >= v.h;
  const tally: Rect = { x: HOME_CORNER.w + M, y: M, w: v.w - HOME_CORNER.w - 2 * M, h: TALLY_H };
  let card: Rect | null = null;
  let check: Rect | null = null;
  let undo: Rect;
  let again: Rect;
  let table: Rect;
  if (wide) {
    const colW = 280;
    const colX = v.w - M - colW;
    const top = tally.y + tally.h + M;
    if (withCard) card = { x: colX, y: top, w: colW, h: shapes >= 2 ? TWO_CARD_H : 220 };
    const by = v.h - M - BUTTON_R;
    undo = button(colX + colW / 2 - BUTTON_R - 12, by);
    again = button(colX + colW / 2 + BUTTON_R + 12, by);
    if (withCard) check = button(colX + colW / 2, by - 2 * BUTTON_R - 24);
    const left = PET_CORNER.w + M;
    table = { x: left, y: top, w: colX - M - left, h: v.h - M - top };
  } else {
    const by = v.h - M - BUTTON_R;
    const right = v.w - M - BUTTON_R;
    again = button(right, by);
    undo = button(right - 2 * BUTTON_R - 24, by);
    if (withCard) check = button(right - 4 * BUTTON_R - 48, by);
    // From the bottom up: the buttons, the table, the card, the tally. On a tall phone the table keeps its shape and
    // the card and tally come down to it, rather than the beads stretching up a long ellipse to a card at the top.
    const headTop = tally.y + tally.h + M;
    const tBottom = Math.min(v.h - PET_CORNER.h, by - BUTTON_R) - M;
    const tW = v.w - 2 * M;
    // The room under the tally's top position. A short screen takes the card down to `CARD_MIN_H` before the table
    // gets too short for seven beads; a tall one gives the card more once the table has its shape.
    const room = withCard ? tBottom - headTop - M : tBottom - Math.max(headTop, HOME_CORNER.h + M);
    const least = withCard ? Math.max(CARD_MIN_H, Math.min(CARD_H, room - TABLE_WANT)) : 0;
    const tH = Math.min(room - least, TABLE_TALL * tW);
    table = { x: M, y: tBottom - tH, w: tW, h: tH };
    let headY = table.y;
    if (withCard) {
      const h = Math.min(shapes >= 2 ? TWO_CARD_TALL : CARD_H, room - tH);
      card = { x: tally.x, y: table.y - M - h, w: tally.w, h };
      headY = card.y;
    }
    tally.y = Math.max(M, headY - M - TALLY_H);
    // Below Home's corner the strip and the card are centred over the table.
    if (tally.y >= HOME_CORNER.h) {
      tally.x = (v.w - tally.w) / 2;
      if (card) card.x = tally.x;
    }
  }
  if (table.w < 2 * BEAD_REACH || table.h < 2 * BEAD_REACH) return null;
  const c = centre(table);
  let beads: Pt[] | null = null;
  for (const [amount, nudge] of JITTER_AMOUNTS) {
    // The ring shrinks by the farthest outward nudge, so every bead stays inside the table.
    const margin = nudge * NUDGE * Math.max(...RADIAL);
    const rx = table.w / 2 - BEAD_REACH - 8 - margin;
    const ry = table.h / 2 - BEAD_REACH - 8 - margin;
    const r = ring(c, rx, ry, n, amount, nudge);
    if (spaced(r)) {
      beads = r;
      break;
    }
  }
  if (!beads) return null;
  const parts = [tally, table, undo, again, ...(card ? [card] : []), ...(check ? [check] : [])];
  if (!parts.every((p) => inside(p, v))) return null;
  if (parts.some((p) => corners(v).some((q) => overlaps(p, q)))) return null;
  if (parts.some((p, i) => parts.some((q, j) => i < j && overlaps(p, q)))) return null;
  return { beads, table, tally, card, check, undo, again };
}
