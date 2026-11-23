import { BACK, CARD, CARD_GAP, type Spot } from './friends-layout';
import { HOME_BUTTON } from './home-layout';

/**
 * Where dressing puts things (RW06, docs/rework/HOME.md#dressing): the friend on a stage, Take everything off beside it,
 * and one card per item its species wears, three across: on the right in landscape, along the bottom in portrait. One
 * page, never shrunk: today's species wear seven items at most. Her colours are one row of swatches under it all.
 */

export const DRESS_COLS = 3;
/** Take everything off: a 100-unit target. */
export const OFF_RADIUS = 52;

/** A colour swatch: a 100-unit target. */
export const SWATCH_RADIUS = 50;
const SWATCH_STEP = 2 * SWATCH_RADIUS + 16;
const MARGIN = 40;
/** The height the colour row takes from the bottom of the screen, with the gap above it. */
const ROW_HEIGHT = 2 * SWATCH_RADIUS + CARD_GAP;

export interface SwatchRow {
  /** Swatches on a page: all of them when they fit, else what fits between the two arrows. */
  perPage: number;
  /** A spot per swatch on a full page, left to right. */
  spots: Spot[];
  /** The arrows that turn the row, only when the colours do not all fit. */
  previous: Spot | null;
  next: Spot | null;
}

export interface DressLayout {
  stage: Spot & { scale: number };
  off: Spot;
  cards: Spot[];
  row: SwatchRow;
}

/**
 * The colour row (RW10 slice 2): one row of swatches along the bottom, never shrunk. When her colours do not all fit
 * (eight to fourteen of them), the row pages between an arrow at each end.
 */
export function swatchRow(v: { w: number; h: number }, count: number): SwatchRow {
  const y = v.h - MARGIN - SWATCH_RADIUS;
  const fits = Math.floor((v.w - 2 * MARGIN + 16) / SWATCH_STEP);
  const paged = count > fits;
  const perPage = paged ? fits - 2 : count;
  const at = (i: number) => ({ x: v.w / 2 + (i - (perPage - 1) / 2) * SWATCH_STEP, y });
  return {
    perPage,
    spots: Array.from({ length: perPage }, (_, i) => at(i)),
    previous: paged ? at(-1) : null,
    next: paged ? at(perPage) : null,
  };
}

/** `colours` is how many swatches the colour row offers; 0 leaves the row out and the bottom to the cards. */
export function dressLayout(v: { w: number; h: number }, count: number, colours = 0): DressLayout {
  const step = CARD + CARD_GAP;
  const rows = Math.max(1, Math.ceil(count / DRESS_COLS));
  const cards: Spot[] = [];
  const row = swatchRow(v, colours);
  // Everything else is laid out in the height above the row.
  const h = v.h - (colours ? ROW_HEIGHT : 0);
  if (v.w >= v.h) {
    const right = v.w - MARGIN - CARD / 2;
    const gridLeft = right - (DRESS_COLS - 1) * step - CARD / 2;
    // The grid stays under the corner buttons only where it reaches them; beside them it may use the top margin.
    const clear = gridLeft > HOME_BUTTON.x + BACK.r ? MARGIN : BACK.y + BACK.r;
    const top = Math.max(clear + CARD / 2, h / 2 - ((rows - 1) * step) / 2);
    for (let i = 0; i < count; i++)
      cards.push({
        x: right - (DRESS_COLS - 1 - (i % DRESS_COLS)) * step,
        y: top + Math.floor(i / DRESS_COLS) * step,
      });
    const mid = gridLeft / 2;
    const stage = { x: mid - 70, y: Math.min(h - 90, h * 0.74), scale: 1 };
    return {
      stage,
      off: { x: Math.min(gridLeft - 40 - OFF_RADIUS, mid + 170), y: stage.y - 60 },
      cards,
      row,
    };
  }
  const bottom = h - MARGIN - CARD / 2;
  for (let i = 0; i < count; i++)
    cards.push({
      x: v.w / 2 + ((i % DRESS_COLS) - 1) * step,
      y: bottom - (rows - 1 - Math.floor(i / DRESS_COLS)) * step,
    });
  const gridTop = bottom - (rows - 1) * step - CARD / 2;
  const stage = {
    x: v.w / 2 - 70,
    y: Math.min(gridTop - 40, (BACK.y + BACK.r + gridTop) / 2 + 140),
    scale: 1.15,
  };
  return { stage, off: { x: Math.min(v.w - 40 - OFF_RADIUS, stage.x + 260), y: stage.y - 80 }, cards, row };
}
