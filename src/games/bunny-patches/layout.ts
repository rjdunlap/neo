import type { View } from '../../engine/view';
import { captionPlace } from '../../ui/caption-layout';

export const BUTTON = { w: 168, h: 100 };

/**
 * The meadow and its buttons, from the view alone. Upright: heading, board, then a button row beside the guide, clear of the
 * caption bubble on a short phone. Sideways: the board left of centre and the buttons in a column on its right.
 */
export function bunnyLayout(view: View, n: number) {
  const { w, h, upright } = view;
  const caption = upright ? captionPlace(view, true) : null;
  const boardTop = upright ? 168 : 92;
  const boardBottom =
    caption?.mode === 'bubble' && caption.band ? caption.band.y - 12 : h - (upright ? 170 : 40);
  const cell = Math.floor(
    Math.min(130, upright ? (w - 127) / n : (w - 420) / n, (boardBottom - boardTop) / n),
  );
  // Upright, a wide board slides right of the Home and help column so it can start higher.
  const cx = upright ? Math.max(w / 2, 119 + (n * cell) / 2) : (w - 200) / 2 + 40;
  const cy = Math.min((boardTop + boardBottom) / 2, upright ? boardBottom - (n * cell) / 2 : h);
  return {
    cell,
    first: { x: Math.round(cx - ((n - 1) * cell) / 2), y: Math.round(cy - ((n - 1) * cell) / 2) },
    heading: { x: cx, y: upright ? 128 : 48 },
    // The lamp (level 3) and hint buttons.
    lamp: upright ? { x: (w + 150) / 2, y: h - 80 } : { x: w - 130, y: h / 2 - 70 },
    hint: upright ? { x: (w + 150) / 2 + 184, y: h - 80 } : { x: w - 130, y: h / 2 + 70 },
  };
}
