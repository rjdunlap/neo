/**
 * Where Friends puts things (RW05, docs/rework/CREATURE-COLLECTION.md#friends-the-selection-surface): the previewed
 * friend on a stage, Come with me beside it, and a page of up to six cards: two columns on the right in landscape, three
 * across the bottom in portrait. A target never shrinks to fit; a seventh friend adds a second page and two held arrows.
 */

export const CARD = 150;
export const CARD_GAP = 24;
export const PER_PAGE = 6;
/** Come with me's radius: a 100-unit target and then some. */
export const COME_RADIUS = 58;
export const ARROW_RADIUS = 46;
/** The back button's corner, kept clear. */
export const BACK = { x: 64, y: 64, r: 64 };

export interface Spot {
  x: number;
  y: number;
}

export interface FriendsLayout {
  /** The stage friend's feet, and its scale. */
  stage: Spot & { scale: number };
  come: Spot;
  /** Card centres for this page, in order. */
  cards: Spot[];
  /** Previous and next page, only when there is more than one page. */
  arrows: { previous: Spot; next: Spot } | null;
  pages: number;
}

export const pageCount = (count: number) => Math.max(1, Math.ceil(count / PER_PAGE));

export function friendsLayout(v: { w: number; h: number }, count: number, page: number): FriendsLayout {
  const pages = pageCount(count);
  const p = Math.max(0, Math.min(pages - 1, page));
  const shown = Math.max(0, Math.min(PER_PAGE, count - p * PER_PAGE));
  const portrait = v.h > v.w;
  const step = CARD + CARD_GAP;
  const cards: Spot[] = [];
  let arrows: FriendsLayout['arrows'] = null;
  let stage: FriendsLayout['stage'];
  let come: Spot;
  if (!portrait) {
    // Two columns of three on the right, centred on the screen's height.
    const right = v.w - 40 - CARD / 2;
    const top = Math.max(BACK.y + BACK.r + CARD / 2, v.h / 2 - step);
    for (let i = 0; i < shown; i++) cards.push({ x: right - (1 - (i % 2)) * step, y: top + Math.floor(i / 2) * step });
    const gridLeft = right - step - CARD / 2;
    if (pages > 1) arrows = { previous: { x: gridLeft + CARD / 2, y: top + 3 * step - CARD / 2 + ARROW_RADIUS }, next: { x: right, y: top + 3 * step - CARD / 2 + ARROW_RADIUS } };
    const mid = (gridLeft - 30) / 2;
    stage = { x: mid - 50, y: Math.min(v.h - 90, v.h * 0.74), scale: 0.9 };
    come = { x: Math.min(gridLeft - 40 - COME_RADIUS, mid + 160), y: stage.y - 70 };
  } else {
    // Three across the bottom, two rows.
    const bottom = v.h - 40 - CARD / 2 - (pages > 1 ? 2 * ARROW_RADIUS + 16 : 0);
    const rows = Math.ceil(shown / 3);
    for (let i = 0; i < shown; i++) cards.push({ x: v.w / 2 + ((i % 3) - 1) * step, y: bottom - (rows - 1 - Math.floor(i / 3)) * step });
    if (pages > 1) arrows = { previous: { x: v.w / 2 - step, y: v.h - 40 - ARROW_RADIUS }, next: { x: v.w / 2 + step, y: v.h - 40 - ARROW_RADIUS } };
    const gridTop = bottom - (Math.max(rows, 2) - 1) * step - CARD / 2;
    // The friend stands in the middle of the space above the cards, a little larger: portrait has the height.
    stage = { x: v.w / 2 - 70, y: Math.min(gridTop - 40, (BACK.y + BACK.r + gridTop) / 2 + 130), scale: 1.1 };
    come = { x: Math.min(v.w - 40 - COME_RADIUS, stage.x + 260), y: stage.y - 90 };
  }
  return { stage, come, cards, arrows, pages };
}
