import type { View } from '../../engine/view';
import type { PixelPlan } from './logic';

export const CELL = 100;
export const BOARD_RIM = 13;
export const MODEL_MARGIN = 12;
export const PAINT_RADIUS = 56;
export const DONE_RADIUS = 60;

export function modelSize(plan: PixelPlan) {
  return plan.mode === 'big' ? 40 : 30;
}

export function pictureLayout(v: View, plan: PixelPlan) {
  const width = plan.size * CELL;
  const hasClues = plan.mode === 'clues' || plan.mode === 'colorClues';
  const hasModel = plan.mode === 'copy' || plan.mode === 'big';
  const free = plan.mode === 'free';
  const narrow = v.w < 920;
  const clueSpace = hasClues ? 90 : 0;
  const modelSpace = hasModel ? 230 : 0;
  const paletteSpace = plan.mode === 'colorClues' ? 130 : free ? 280 : 0;
  // Stack the reference above the board upright. Leave room to its left for the clue numbers.
  const stack = v.upright && !free;
  const x = stack
    ? (v.w - width + (hasClues ? 120 : 0)) / 2
    : Math.max(160, (v.w - width - clueSpace - modelSpace - paletteSpace) / 2 + clueSpace);
  // The board clears Home and Help even on the shortest upright view.
  const y = stack
    ? Math.max(240, (v.h - width) / 2)
    : Math.max(hasClues ? 150 : 110, (v.h - width) / 2 + (hasClues ? 30 : 0));
  const modelWidth = (plan.mode === 'big' ? plan.size / 2 : plan.size) * modelSize(plan);
  const model = stack ? { x: (v.w - modelWidth) / 2, y: y - modelWidth - 34 } : { x: x + width + 60, y };

  // The free-paint row starts to the right of the guide and ends with Done.
  const rowX = Math.max(206, v.w / 2 - 232);
  const rowY = Math.min(v.h - 70, y + width + (v.upright ? 78 : 70));
  const paint = (i: number) => {
    if (free && narrow) return { x: rowX + i * 116, y: rowY };
    if (free) return { x: x + width + 100, y: y + 60 + i * 126 };
    if (narrow) {
      return {
        x: v.w / 2 + (i ? 72 : -72),
        y: Math.min(v.h - 60, y + width + (stack ? 78 : 64)),
      };
    }
    return { x: x + width + 150, y: y + width - 60 - i * 120 };
  };
  const done = narrow ? { x: rowX + 4 * 116 + 10, y: rowY } : { x: x + width + 240, y: y + width - 60 };
  return { board: { x, y, width }, model, modelWidth, paint, done };
}
