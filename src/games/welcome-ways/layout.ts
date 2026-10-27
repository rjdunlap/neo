import type { View } from '../../engine/view';
export interface Box { x: number; y: number; w: number; h: number }
/** No board scaling: input boxes stay large inside the safe view. */
export function layout(view: View, rises: number, choices: number, visitors: number) {
  const x = (view.w - 1024) / 2;
  const tall = view.h > view.w;
  const boardY = tall ? 600 : 430;
  const box = (cx: number, cy: number, w = 144, h = w): Box => ({ x: x + cx, y: cy, w, h });
  return {
    sockets: [...(rises === 2 ? [450, 610] : [530]).map(cx => box(cx, boardY, 160)), box(790, boardY - 40, 144, 200)],
    tray: Array.from({ length: choices }, (_, i) => box(320 + i * 180, tall ? 880 : 640)),
    visitors: Array.from({ length: visitors }, (_, i) => box(330 + i * 180, tall ? 240 : 215)),
    try: box(860, tall ? 1090 : 215),
    undo: box(tall ? 330 : 95, tall ? 1090 : 410, 120),
    remove: box(tall ? 510 : 235, tall ? 1090 : 410, 120),
    help: box(tall ? 690 : 100, tall ? 1090 : 280, 120),
    boardY, left: x, tall,
  };
}
