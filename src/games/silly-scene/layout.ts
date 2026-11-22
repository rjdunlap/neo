import type { View } from '../../engine/view';
import type { Backdrop, Slot } from './logic';

export const TARGET = 120;

export function layout(view: View, backdrop: Backdrop) {
  const { w, h, upright } = view;
  const offset = (w - (upright ? 768 : 1024)) / 2;
  const x = (value: number) => offset + value;
  const low = upright ? Math.min(1030, h - 500) : Math.min(450, h - 490);
  const slots: Record<Slot, { x: number; y: number }> = upright
    ? {
        leftSky: { x: x(186), y: 204 },
        high: { x: x(384), y: 204 },
        canopy: { x: x(384), y: 358 },
        rightSky: { x: x(594), y: 204 },
        leftGround: { x: x(174), y: low },
        middleGround: { x: x(384), y: low },
        bank: { x: x(backdrop === 'farm' ? 550 : 174), y: low - 154 },
        rightGround: { x: x(594), y: low },
      }
    : {
        leftSky: { x: x(216), y: 128 },
        high: { x: x(398), y: 128 },
        canopy: { x: x(580), y: 128 },
        rightSky: { x: x(762), y: 128 },
        leftGround: { x: x(216), y: low },
        middleGround: { x: x(398), y: low },
        bank: { x: x(580), y: low },
        rightGround: { x: x(762), y: low },
      };
  // On a short screen, the fixes also clear the caption above the guide.
  const landing = upright ? low + 112 : Math.max(400, low + 116);
  return {
    slots,
    water: { x: x(upright ? 688 : 870), y: landing },
    rock: { x: x(upright ? 205 : 850), y: upright ? 398 : landing + 119 },
    sand: { x: x(upright ? 594 : 780), y: landing + 82 },
    horizon: upright ? (backdrop === 'beach' ? 330 : 432) : 205,
  };
}
