import type { View } from '../../engine/view';
import { captionPlace } from '../../ui/caption-layout';
import { N } from './logic';

export const BUTTON = { w: 180, h: 100 };
/** The row signs' column to the right of the camp, and the column signs' strip above it. */
export const SIGN = { w: 84, h: 76 };
const SUPPLY_H = 84;

/**
 * The camp, its signs, the tent supply and the two buttons, from the view alone. Upright: heading, supply, column signs,
 * the camp with its row signs on the right, and the buttons at the bottom beside the guide, clear of the caption bubble on
 * a short phone. Sideways: the camp left of centre and the buttons in a column on the right.
 */
export function campLayout(view: View) {
  const { w, h, upright } = view;
  const caption = upright ? captionPlace(view, true) : null;
  const top = upright ? 160 : 76;
  const bottom = caption?.mode === 'bubble' && caption.band ? caption.band.y - 12 : h - (upright ? 160 : 30);
  const cell = Math.floor(
    Math.min(124, upright ? (w - 140 - SIGN.w) / N : (w - 470) / N, (bottom - top - SUPPLY_H - SIGN.h) / N),
  );
  const boardW = N * cell;
  const groupW = boardW + SIGN.w;
  const groupH = SUPPLY_H + SIGN.h + N * cell;
  // Upright, the camp starts below the Home and help column; spare height is shared above and below.
  const left = upright ? Math.max(126, (w - groupW) / 2) : Math.max(130, (w - 230 - groupW) / 2 + 20);
  const start = top + Math.max(0, (bottom - top - groupH) / 2) * (upright ? 0.5 : 1);
  const supplyY = start + SUPPLY_H / 2;
  const signY = start + SUPPLY_H + SIGN.h / 2;
  const boardTop = start + SUPPLY_H + SIGN.h;
  return {
    cell,
    /** The center of the top-left square. */
    first: { x: Math.round(left + cell / 2), y: Math.round(boardTop + cell / 2) },
    /** Column signs' centre line, above the camp; row signs' centre line, right of it. */
    colSignY: Math.round(signY),
    rowSignX: Math.round(left + boardW + SIGN.w / 2 + 4),
    supply: { x: Math.round(left + boardW / 2), y: Math.round(supplyY) },
    heading: { x: upright ? w / 2 : left + groupW / 2, y: upright ? 118 : 40 },
    check: upright ? { x: (w + 150) / 2 + 10, y: h - 80 } : { x: w - 130, y: h / 2 - 70 },
    hint: upright ? { x: (w + 150) / 2 + 206, y: h - 80 } : { x: w - 130, y: h / 2 + 70 },
  };
}
