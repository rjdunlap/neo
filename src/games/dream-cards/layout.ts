import type { View } from '../../engine/view';

export interface Point {
  x: number;
  y: number;
}

/**
 * Where Dream Cards puts things, as a pure function of the view so a test can check both orientations. Three cards in
 * a row of at most 220 units (never under 100), the three clue tokens in a row above them, and the buttons along the
 * bottom edge from the right, so the pet's bottom-left corner stays clear.
 */
export function dreamLayout(v: View) {
  const upright = v.h > v.w;
  const gap = 14;
  const card = Math.max(100, Math.min(220, (v.w - 80 - 2 * gap) / 3));
  const token = Math.min(130, card * 0.64 + 6);
  const cx = v.w / 2;
  const tokenY = upright ? 380 : 200;
  const cardY = tokenY + token / 2 + 50 + card / 2;
  const cards = [-1, 0, 1].map((i) => ({ x: cx + i * (card + gap), y: cardY }));
  const tokens = [-1, 0, 1].map((i) => ({ x: cx + i * (token + 30), y: tokenY }));
  const buttonY = v.h - 100;
  const radius = 56;
  const buttons = [0, 1, 2].map((i) => ({ x: v.w - 110 - i * 160, y: buttonY }));
  /** The two seat choices, centred. */
  const seats = [-1, 1].map((i) => ({ x: cx + i * 150, y: cardY }));
  return { upright, card, token, cx, cards, tokens, buttons, radius, seats, cardY, tokenY };
}

/**
 * Level 3's build screen: the stamp preview on top and three rows of three part buttons below (where, thing, light),
 * every button at least 100 units, with the Done button at the bottom right and the pet's corner clear.
 */
export function buildLayout(v: View) {
  const upright = v.h > v.w;
  const gap = 14;
  const button = Math.max(100, Math.min(upright ? 160 : 124, (v.w - 80 - 2 * gap) / 3));
  const preview = upright ? 220 : 190;
  const previewY = upright ? 90 + preview / 2 : 70 + preview / 2;
  const rowsTop = previewY + preview / 2 + 24 + button / 2;
  const rowGap = upright ? 18 : 10;
  const rows = [0, 1, 2].map((r) =>
    [-1, 0, 1].map((i) => ({ x: v.w / 2 + i * (button + gap), y: rowsTop + r * (button + rowGap) })),
  );
  return { upright, button, preview, previewY, rows, cx: v.w / 2 };
}
