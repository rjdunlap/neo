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
const box = (x: number, y: number, w: number, h: number): Box => ({ x, y, w, h });

export function layout(view: View) {
  const { w, h, upright } = view;
  const caption = captionPlace(view, true);
  const availableBottom = caption.mode === 'bubble' ? caption.band!.y - 8 : h - 176;
  if (upright) {
    const left = (w - 750) / 2;
    const top = Math.max(106, Math.min(230, availableBottom - 495));
    return {
      order: box(w / 2 + 58, top + 57, 624, 114),
      note: box(w / 2, top + 156, 740, 78),
      headersY: top + 208,
      rows: workshopRows(left, top + 264, 94),
      controls: Array.from({ length: 4 }, (_, i) => box(w / 2 + (i - 1.5) * 186, top + 446, 178, 88)),
      jetty: box(w - 217, top + 566 <= availableBottom ? top + 530 : h - 105, 400, 72),
    };
  }
  const rightW = 292;
  const left = Math.max(120, (w - 1060) / 2);
  const rightX = w - 12 - rightW / 2;
  const step = Math.min(96, (w - left - 12 - rightW - 170) / MAX_MORNINGS);
  return {
    order: box(rightX, 124, rightW, 148),
    note: box(rightX, 249, rightW, 90),
    headersY: 129,
    rows: workshopRows(left, 195, step),
    controls: Array.from({ length: 4 }, (_, i) =>
      box(rightX + ((i % 2) - 0.5) * 149, 353 + Math.floor(i / 2) * 94, 143, 86),
    ),
    jetty: box(w - 259, h - 126, 480, 118),
  };
}

function workshopRows(left: number, y: number, step: number) {
  const signW = 156;
  return [0, 1].map((row) => ({
    sign: box(left + signW / 2, y + row * 93, signW, 88),
    squares: Array.from({ length: MAX_MORNINGS }, (_, i) =>
      box(left + signW + 5 + step * (i + 0.5), y + row * 93, step - BOX_GAP, step - BOX_GAP),
    ),
  }));
}
