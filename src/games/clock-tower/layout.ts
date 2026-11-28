import type { ClockMode } from './logic';

/** The clock face's radius in units (its wooden rim reaches 18 further, its touch circle 30). */
export const R = 200;
/** The round bell button's box, the request sign, a pretend-plan card and its two taps, in units. */
export const BELL_HIT = 120;
export const REQUEST_BOX = { w: 250, h: 120 };
export const CARD = { w: 440, h: 150, pick: { x: -130, w: 180 }, hear: { x: 90, w: 260 } };
/** Level 11: the free-time sign (a tap hears it again), the time strip under it, and a start-time card. */
export const VISIT_SIGN = { w: 480, h: 110 };
export const STRIP = { w: 480, h: 90 };
export const START_CARD = { w: 230, h: 110 };
/** How far the card stack's pitch runs: a card and its gap. */
const CARD_PITCH = 160;

export interface Pt {
  x: number;
  y: number;
}

export interface TowerLayout {
  /** The face's center and its scale (the reading level shrinks it held upright so three cards fit below). */
  face: Pt & { s: number };
  bell: Pt;
  request: Pt;
  handKey: Pt;
  comparison: Pt;
  heading: Pt;
  /** The center of each of the three pretend-plan cards, or (level 11) the three start-time cards. */
  cards: Pt[];
  /** Level 11's free-time sign and the time strip under it. */
  sign: Pt;
  strip: Pt;
}

/**
 * Where everything sits. Sideways the clock is at the left with the bell, request, hand key and the cards in a column
 * beside it. Held upright (chunk 31, docs/definitions/phone-portrait.md) there is no room beside a 460-wide clock on a
 * 768-wide screen: the request sign rides above the tower with the "one hour later" comparison to its right, the hand key
 * and bell sit in a row below the face, and on the reading level the face shrinks to 60% with the cards stacked beneath it.
 */
export function towerLayout(view: { w: number; h: number; upright?: true }, mode: ClockMode): TowerLayout {
  const read = mode === 'read';
  const { w, h } = view;
  if (mode === 'visit') return visitLayout(view);
  if (!view.upright) {
    const cx = w * (read ? 0.3 : 0.42);
    const cy = Math.max(R + 70, h * 0.52);
    return {
      face: { x: cx, y: cy, s: 1 },
      bell: { x: cx + R + 150, y: cy },
      request: { x: cx + R + 185, y: cy - 170 },
      handKey: { x: cx + R + 150, y: cy + 120 },
      comparison: { x: cx + R + 185, y: Math.min(cy + 265, h - 90) },
      heading: { x: w - 250, y: cy - 285 },
      cards: [0, 1, 2].map((i) => ({ x: w - 250, y: cy - 170 + i * 170 })),
      sign: { x: cx, y: cy },
      strip: { x: cx, y: cy },
    };
  }
  const cx = w / 2;
  if (read) {
    const s = 0.6;
    const cy = Math.max(380, h * 0.28);
    const first = cy + 231;
    return {
      face: { x: cx, y: cy, s },
      bell: { x: cx, y: cy },
      request: { x: cx, y: cy },
      handKey: { x: cx, y: cy },
      comparison: { x: cx, y: cy },
      heading: { x: cx, y: cy - 260 },
      cards: [0, 1, 2].map((i) => ({ x: cx, y: first + i * CARD_PITCH })),
      sign: { x: cx, y: cy },
      strip: { x: cx, y: cy },
    };
  }
  const cy = Math.max(600, h * 0.46);
  const row = cy + 330;
  return {
    face: { x: cx, y: cy, s: 1 },
    bell: { x: cx + 200, y: row },
    request: { x: cx, y: cy - 440 },
    handKey: { x: cx - 130, y: row },
    comparison: { x: w - 130, y: cy - 440 },
    heading: { x: cx, y: cy - 440 },
    cards: [],
    sign: { x: cx, y: cy },
    strip: { x: cx, y: cy },
  };
}

/**
 * Level 11 (fit a visit) needs the free-time sign, the strip, three start cards and the hands at once. Sideways the face
 * (at 80%) is at the left; the sign and strip top a right-hand column with the cards stacked under them and the bell
 * beside the cards. Held upright the sign and strip ride at the top, the three cards sit in a row under them, and the
 * tower with the hand key and bell fills the rest (the face full size on a phone, 80% on the short 768 × 1024 view).
 */
function visitLayout(view: { w: number; h: number; upright?: true }): TowerLayout {
  const { w, h } = view;
  const s = 0.8;
  if (!view.upright) {
    const cx = w * 0.29;
    const cy = Math.max(R * s + 220, h * 0.55);
    const col = w - 260;
    return {
      face: { x: cx, y: cy, s },
      bell: { x: w - 110, y: 450 },
      request: { x: col, y: 75 },
      handKey: { x: cx - 20, y: cy + 230 },
      comparison: { x: col, y: 75 },
      heading: { x: col, y: 75 },
      cards: [0, 1, 2].map((i) => ({ x: w - 355, y: 330 + i * 125 })),
      sign: { x: col, y: 75 },
      strip: { x: col, y: 195 },
    };
  }
  const cx = w / 2;
  // A tall phone has room for the full-size face under the cards; the shortest upright view keeps it at 80%.
  const big = h >= 1250;
  const face = big ? 1 : s;
  const cy = big
    ? Math.max(760, Math.min(h - 400, 430 + h * 0.3))
    : Math.max(690, Math.min(h - 330, 420 + h * 0.3));
  const row = cy + (big ? 330 : 255);
  return {
    face: { x: cx, y: cy, s: face },
    bell: { x: cx + 200, y: row },
    request: { x: cx, y: 80 },
    handKey: { x: cx - 130, y: row },
    comparison: { x: cx, y: 80 },
    heading: { x: cx, y: 80 },
    cards: [-1, 0, 1].map((i) => ({ x: cx + i * 245, y: 320 })),
    sign: { x: cx, y: 80 },
    strip: { x: cx, y: 200 },
  };
}
