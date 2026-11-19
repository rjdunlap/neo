import type { ClockMode } from './logic';

/** The clock face's radius in units (its wooden rim reaches 18 further, its touch circle 30). */
export const R = 200;
/** The round bell button's box, the request sign, a pretend-plan card and its two taps, in units. */
export const BELL_HIT = 120;
export const REQUEST_BOX = { w: 250, h: 120 };
export const CARD = { w: 440, h: 150, pick: { x: -130, w: 180 }, hear: { x: 90, w: 260 } };
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
  /** The center of each of the three pretend-plan cards. */
  cards: Pt[];
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
  };
}
