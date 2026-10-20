import { BACK, CARD, CARD_GAP, type Spot } from './friends-layout';

/**
 * Where dressing puts things (RW06, docs/rework/HOME.md#dressing): the friend on a stage, Take everything off beside it,
 * and one card per item its species wears, three across: on the right in landscape, along the bottom in portrait. One
 * page, never shrunk: today's species wear seven items at most.
 */

export const DRESS_COLS = 3;
/** Take everything off: a 100-unit target. */
export const OFF_RADIUS = 52;

export interface DressLayout {
  stage: Spot & { scale: number };
  off: Spot;
  cards: Spot[];
}

export function dressLayout(v: { w: number; h: number }, count: number): DressLayout {
  const step = CARD + CARD_GAP;
  const rows = Math.max(1, Math.ceil(count / DRESS_COLS));
  const cards: Spot[] = [];
  if (v.w >= v.h) {
    const right = v.w - 40 - CARD / 2;
    const top = Math.max(BACK.y + BACK.r + CARD / 2, v.h / 2 - ((rows - 1) * step) / 2);
    for (let i = 0; i < count; i++) cards.push({ x: right - (DRESS_COLS - 1 - (i % DRESS_COLS)) * step, y: top + Math.floor(i / DRESS_COLS) * step });
    const gridLeft = right - (DRESS_COLS - 1) * step - CARD / 2;
    const mid = gridLeft / 2;
    const stage = { x: mid - 70, y: Math.min(v.h - 90, v.h * 0.74), scale: 1 };
    return { stage, off: { x: Math.min(gridLeft - 40 - OFF_RADIUS, mid + 170), y: stage.y - 60 }, cards };
  }
  const bottom = v.h - 40 - CARD / 2;
  for (let i = 0; i < count; i++) cards.push({ x: v.w / 2 + ((i % DRESS_COLS) - 1) * step, y: bottom - (rows - 1 - Math.floor(i / DRESS_COLS)) * step });
  const gridTop = bottom - (rows - 1) * step - CARD / 2;
  const stage = { x: v.w / 2 - 70, y: Math.min(gridTop - 40, (BACK.y + BACK.r + gridTop) / 2 + 140), scale: 1.15 };
  return { stage, off: { x: Math.min(v.w - 40 - OFF_RADIUS, stage.x + 260), y: stage.y - 80 }, cards };
}
