import type { View } from '../../engine/view';
export function layout(v: Pick<View, 'w' | 'h'>) {
  const tall = v.h > v.w,
    dx = (v.w - 1024) / 2;
  const at = (xs: number[], y: number, w: number, h: number) => xs.map((x) => ({ x: dx + x, y, w, h }));
  return {
    tall,
    loom: { x: dx + 300, y: tall ? 240 : 160, cell: tall ? 58 : 38 },
    shuttle: { x: dx + 850, y: tall ? v.h - 405 : 390, w: 180, h: 120 },
    pots: [430, 620, 810].map((x) => ({ x: dx + x, y: v.h - 148, w: 120, h: 120 })),
    pedals: [510, 750].map((x) => ({ x: dx + x, y: v.h - 148, w: 140, h: 120 })),
    free: { x: 260, y: 140, w: v.w - 280, h: v.h - 165 },
    companion: { x: dx + 650, y: tall ? 940 : 510 },
    // Levels 4–5: a sample cloth (not a touch target) beside the loom, an Undo row button, two yarn
    // pots (level 4) and two or three pedals. Rectangles follow the definition's design table.
    sample: { x: tall ? 30 : 40, y: tall ? 300 : 150, cell: 35 },
    shuttle45: { x: dx + (tall ? 810 : 880), y: tall ? 960 : 220, w: 180, h: 120 },
    undo: { x: dx + (tall ? 950 : 880), y: tall ? 800 : 500, w: 120, h: 120 },
    pots4: at(tall ? [420, 610] : [824, 960], tall ? 1190 : 360, 120, 120),
    pedals4: at(tall ? [380, 620] : [400, 640], tall ? 1010 : v.h - 130, 140, 120),
    pedals5: at(tall ? [340, 580, 820] : [360, 600, 840], tall ? 1170 : v.h - 130, 140, 120),
  };
}
