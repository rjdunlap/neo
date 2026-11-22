import type { View } from '../../engine/view';
import { SIDES } from './logic';

const INDICES = [0, 1, 2] as const;

export const GATE_SIZE = 100;
export const CHECK_W = 194;
export const PREVIEW_W = 300;
export const PREVIEW_H = 126;

export function beeLayout(view: Pick<View, 'w' | 'h' | 'upright'>) {
  const { w, h, upright } = view;
  const board = {
    x: upright ? (w - 300) / 2 : w - 404,
    y: upright ? Math.max(110, (h - 1010) / 2) : 102,
    w: 300,
    h: 300,
  };
  const x = upright ? w / 2 : Math.min((board.x - 110 + 146) / 2, 380);
  return {
    board,
    packets: [-134, 0, 134].map((dx) => ({
      x: (upright ? x : Math.max(316, x)) + dx,
      y: upright ? board.y + 468 : 136,
    })),
    preview: { x: x + (upright ? 112 : 105), y: upright ? board.y + 601 : 289 },
    check: { x: x - (upright ? 148 : 152), y: upright ? board.y + 601 : 289 },
    gates: SIDES.flatMap((side) =>
      INDICES.map((i) => {
        const offset = 50 + i * GATE_SIZE;
        switch (side) {
          case 'top':
            return { x: board.x + offset, y: board.y - 50 };
          case 'bottom':
            return { x: board.x + offset, y: board.y + 350 };
          case 'left':
            return { x: board.x - 50, y: board.y + offset };
          case 'right':
            return { x: board.x + 350, y: board.y + offset };
        }
      }),
    ),
  };
}
