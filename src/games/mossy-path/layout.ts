import type { View } from '../../engine/view';
import { captionPlace } from '../../ui/caption-layout';
import type { Board } from './logic';

export const ROUND_BUTTON = { w: 168, h: 100 };

export function mossyLayout(view: View, { rows, cols }: Pick<Board, 'rows' | 'cols'>) {
  const { w, h, upright } = view;
  // Keep the board above a short phone's caption bubble. The controls sit below it, beside the guide.
  const caption = upright ? captionPlace(view, true) : null;
  const headingY = upright ? 152 : 110;
  const statusY = upright ? 232 : 154;
  const boardBottom = caption?.mode === 'bubble' && caption.band ? caption.band.y - 12 : h - 170;
  const cell = upright
    ? Math.floor(Math.min(132, (w - 40) / cols, (boardBottom - statusY - 32) / rows))
    : Math.min(132, (w - 320) / cols, (h - 330) / rows);
  const boardCenterY = upright ? Math.min(h / 2 + 12, boardBottom - (rows * cell) / 2) : h / 2 + 12;

  const first = { x: w / 2 - ((cols - 1) * cell) / 2, y: boardCenterY - ((rows - 1) * cell) / 2 };
  // Keep adjoining hit boxes on the same edges when the viewport measures fractional units.
  if (upright) {
    first.x = Math.round(first.x);
    first.y = Math.round(first.y);
  }
  return {
    cell,
    first,
    heading: { x: w / 2, y: headingY },
    status: { x: w / 2, y: statusY },
    buttons: [-1, 0, 1].map((i) => ({
      x: upright ? (w + 150) / 2 + i * 184 : w / 2 + i * 192,
      y: h - 80,
    })),
  };
}

export function cellPosition(at: number, cols: number, cell: number) {
  return { x: (at % cols) * cell, y: Math.floor(at / cols) * cell };
}
