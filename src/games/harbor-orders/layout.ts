import type { View } from '../../engine/view';
import { captionPlace } from '../../ui/caption-layout';
import { MAX_MORNINGS } from './logic';

export interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

export const BOX_GAP = 5;
const ROW_STEP = 93;
const box = (x: number, y: number, w: number, h: number): Box => ({ x, y, w, h });

/** The board for two or three workshops and two or three goods; levels 1–2 keep their two-row places. */
export function layout(view: View, workshops = 2, goods = 2) {
  const { w, h, upright } = view;
  const caption = captionPlace(view, true);
  const availableBottom = caption.mode === 'bubble' ? caption.band!.y - 8 : h - 176;
  const extraRows = (workshops - 2) * ROW_STEP;
  if (upright) {
    const left = (w - 750) / 2;
    const top = Math.max(106, Math.min(230, availableBottom - 495 - extraRows));
    const below = top + extraRows;
    return {
      order: box(w / 2 + 58, top + 57, 624, 114),
      note: box(w / 2, top + 156, 740, 78),
      headersY: top + 208,
      rows: workshopRows(workshops, left, top + 264, 94),
      controls: Array.from({ length: 4 }, (_, i) => box(w / 2 + (i - 1.5) * 186, below + 446, 178, 88)),
      jetty: box(w - 217, below + 566 <= availableBottom ? below + 530 : h - 105, 400, 72),
    };
  }
  const rightW = 292;
  const left = Math.max(120, (w - 1060) / 2);
  const rightX = w - 12 - rightW / 2;
  const step = Math.min(96, (w - left - 12 - rightW - 170) / MAX_MORNINGS);
  // A third good takes one more line on the order card.
  const card = 148 + (goods - 2) * 44;
  const shift = card - 148;
  return {
    order: box(rightX, 50 + card / 2, rightW, card),
    note: box(rightX, 249 + shift, rightW, 90),
    headersY: 129,
    rows: workshopRows(workshops, left, 195, step),
    controls: Array.from({ length: 4 }, (_, i) =>
      box(rightX + ((i % 2) - 0.5) * 149, 353 + shift + Math.floor(i / 2) * 94, 143, 86),
    ),
    jetty: box(w - 259, h - 126, 480, 118),
  };
}

function workshopRows(workshops: number, left: number, y: number, step: number) {
  const signW = 156;
  return Array.from({ length: workshops }, (_, row) => ({
    sign: box(left + signW / 2, y + row * ROW_STEP, signW, 88),
    squares: Array.from({ length: MAX_MORNINGS }, (_, i) =>
      box(left + signW + 5 + step * (i + 0.5), y + row * ROW_STEP, step - BOX_GAP, step - BOX_GAP),
    ),
  }));
}
