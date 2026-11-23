import type { View } from '../../engine/view';

export type Box = { x: number; y: number; w: number; h: number };

const box = (x: number, y: number, w: number, h: number): Box => ({ x, y, w, h });

/** The label size and wrap width of a bubble's words, and the most lines they may take. */
export const BUBBLE_LINES = 3;

/**
 * Where everything sits, boxes by their centres. Upright: the lake and bridge beside Home, then one column per islander
 * (bubble, islander, mark plate) and Help and Cross, all above the caption bubble a short phone shows. Sideways: the
 * lake and bridge on the left above the caption bubble, and one row per islander with Help and Cross on the right.
 */
export function bridgeLayout(
  { w, h, upright }: Pick<View, 'w' | 'h' | 'upright'>,
  seats: number,
  withPlanks = false,
) {
  if (upright) {
    // A short phone's caption bubble starts 806 units down, so the board keeps to the top; a taller screen spreads it.
    const drop = Math.min(220, Math.max(0, (h - 1240) / 2));
    const colW = seats === 3 ? 244 : 330;
    const xs = [...Array(seats).keys()].map((i) => w / 2 + (i - (seats - 1) / 2) * colW);
    return {
      scene: box(w / 2 + 58, 76 + drop / 2, w - 140, 140),
      planks: withPlanks
        ? [220, 435, 650].map((x) => box(x + (w - 768) / 2, 202 + drop * 0.7, 204, 104))
        : [],
      statusSize: withPlanks ? 23 : 26,
      status: { x: w / 2 + 58, y: (withPlanks ? 284 : 180) + drop * 0.8, wrap: withPlanks ? 740 : 610 },
      bubbles: xs.map((x) => box(x, (withPlanks ? 390 : 300) + drop, colW - 10, withPlanks ? 142 : 168)),
      seats: xs.map((x) => box(x, (withPlanks ? 568 : 518) + drop, colW - 10, withPlanks ? 208 : 256)),
      help: box(w / 2 - 150, (withPlanks ? 728 : 726) + drop * 1.2, 250, 104),
      cross: box(w / 2 + 150, (withPlanks ? 728 : 726) + drop * 1.2, 330, 104),
      critter: withPlanks ? 0.45 : 0.56,
      text: withPlanks ? 28 : 30,
      wrap: colW - 40,
      rows: false,
    };
  }
  // Sideways the caption bubble covers the left 640 units below 343, so the targets stack in a column on its right.
  const left = (w - 1024) / 2;
  const x0 = left + 652;
  const rowH = seats === 3 ? 180 : 230;
  const top = seats === 3 ? 14 : 60;
  const ys = [...Array(seats).keys()].map((i) => top + rowH / 2 + i * rowH);
  return {
    scene: box(left + 384, withPlanks ? 105 : 130, 500, withPlanks ? 156 : 200),
    planks: withPlanks ? [224, 384, 544].map((x) => box(left + x, 296, 150, 80)) : [],
    status: { x: left + 384, y: withPlanks ? 221 : 284, wrap: 500 },
    statusSize: withPlanks ? 23 : 26,
    bubbles: ys.map((y) => box(x0 + 132 + 118, y, 228, rowH - 12)),
    seats: ys.map((y) => box(x0 + 64, y, 128, rowH - 12)),
    help: box(x0 + 86, 660, 168, 100),
    cross: box(x0 + 268, 660, 184, 100),
    critter: 0.4,
    text: 26,
    wrap: 204,
    rows: true,
  };
}

export type BridgeLayout = ReturnType<typeof bridgeLayout>;

/** The characters one bubble line holds at the layout's label size, on the measure the captions use. */
export const perLine = (layout: BridgeLayout) => Math.floor(layout.wrap / (layout.text * 0.5));
