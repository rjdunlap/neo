import { spread, type View } from '../../engine/view';
import type { PeekMode } from './logic';

/**
 * Where Peekaround Island's pieces stand, as pure functions of the view so a test can check every level on every upright
 * phone view (chunk 31, docs/definitions/phone-portrait.md). Sideways (1,024 wide) the numbers are the ones the scene
 * always used; held upright (768 wide) the turning arrows, picture cards, maps and shore friends move to fit.
 */
export interface Pt {
  x: number;
  y: number;
}

/** Friends stand on a ring inside the island's top, drawn as an ellipse seen from the side. */
export const RING = { x: 230, y: 86 };
export const ISLAND = { x: 300, y: 110 };
/** Level 7's picture cards: big enough to read a friend beside the tree, in a row clear of the corner buttons. */
export const VIEW_CARD = { w: 270, h: 220, gap: 290, y: 126, art: 0.4 };
/** Level 8's maps: square cards in a row at the top; the island sits low enough that the crown clears them. */
export const MAP_CARD = { size: 170, gap: 190, y: 115, island: 64, crown: 22, ring: 46, critter: 0.14 };
/** The picture-choice tiles of the other levels. */
export const TILE = { w: 128, h: 136, gap: 136, y: 78 };
/** The turning arrows' radius; a shore friend's body box (its tap circle is larger). */
export const ARROW_R = 54;
export const FRIEND_BOX = 110;
/** Held upright a row of cards starts clear of Home and the help button, which fill the top-left 115 × 210. */
const CLEAR_X = 125;
/** Held upright the view row pitch of the cards, and how far the crown reaches above the island's centre. */
const VIEW_ROW = VIEW_CARD.h + 20;
const CROWN = 350;
const SHORE_ROW = FRIEND_BOX + 20;

/** The island's centre. Level 7's cards take the top (two to a row held upright), so the island sits low enough for the crown to clear them. */
export function islandCenter(v: Pick<View, 'w' | 'h' | 'upright'>, mode: PeekMode, cards = 3): Pt {
  let y = v.h * 0.6;
  if (mode === 'view') {
    const rows = v.upright ? Math.ceil(cards / 2) : 1;
    y = Math.max(y, VIEW_CARD.y + (rows - 1) * VIEW_ROW + VIEW_CARD.h / 2 + CROWN);
  } else if (mode === 'sky') y = Math.max(y, 545);
  return { x: v.w / 2, y };
}

/** The two turning arrows: either side of the island sideways; held upright (768 wide) beneath it, clear of its edge. */
export function arrowSpots(v: Pick<View, 'upright'>, c: Pt): { left: Pt; right: Pt } {
  if (v.upright)
    return {
      left: { x: c.x - 170, y: c.y + ISLAND.y + 140 },
      right: { x: c.x + 170, y: c.y + ISLAND.y + 140 },
    };
  return { left: { x: c.x - 400, y: c.y + 20 }, right: { x: c.x + 400, y: c.y + 20 } };
}

/** The `n` cards of the picture row, by mode (the view cards, the sky maps or the friend tiles). */
export function cardSpots(v: Pick<View, 'w' | 'upright'>, mode: PeekMode, n: number): Pt[] {
  if (mode === 'sky') {
    const xs = v.upright
      ? spread(n, CLEAR_X + 5, v.w - 20, MAP_CARD.gap)
      : spread(n, 200, v.w - 200, MAP_CARD.gap);
    return xs.map((x) => ({ x, y: MAP_CARD.y }));
  }
  if (mode === 'view') {
    if (!v.upright) return spread(n, 130, v.w - 20, VIEW_CARD.gap).map((x) => ({ x, y: VIEW_CARD.y }));
    // Two to a row: 270-wide cards three across do not fit 768 beside the corner buttons.
    return Array.from({ length: n }, (_, i) => {
      const row = Math.floor(i / 2);
      const inRow = Math.min(2, n - row * 2);
      return {
        x: spread(inRow, CLEAR_X, v.w - 15, VIEW_CARD.gap - 6)[i % 2],
        y: VIEW_CARD.y + row * VIEW_ROW,
      };
    });
  }
  const xs =
    v.upright || n * TILE.gap > v.w - 400
      ? spread(n, v.upright ? CLEAR_X : 140, v.w - (v.upright ? 20 : 40), TILE.gap)
      : spread(n, 200, v.w - 200, TILE.gap);
  return xs.map((x) => ({ x, y: TILE.y }));
}

/** Where the `n` friends still waiting on the shore stand (feet): one row sideways; held upright four stand two to a row. */
export function shoreSpots(v: Pick<View, 'w' | 'h' | 'upright'>, n: number): Pt[] {
  const base = v.h - 40;
  if (!v.upright || n <= 3) return spread(n, 220, v.w - 120, 170).map((x) => ({ x, y: base }));
  return Array.from({ length: n }, (_, i) => {
    const row = Math.floor(i / 2);
    const inRow = Math.min(2, n - row * 2);
    return { x: spread(inRow, 240, v.w - 60, 170)[i % 2], y: base - row * SHORE_ROW };
  });
}
