import type { View } from '../../engine/view';

export type Box = { x: number; y: number; w: number; h: number };

const box = (x: number, y: number, w: number, h: number): Box => ({ x, y, w, h });

/**
 * Where everything sits, boxes by their centres. Upright, top to bottom: the lamp between its two levers, Try it, a
 * status line, the bench of up to four record cards, the two note cards with their fits and ruled-out toggles, then Help
 * and Check, all above the caption bubble (781 units down on the captioned small phone). Sideways: the lamp, levers and Try it on
 * the left above the caption bubble, and the bench, notes and buttons in a column on its right.
 */
export function benchLayout({ w, h, upright }: Pick<View, 'w' | 'h' | 'upright'>) {
  if (upright) {
    // A taller screen spreads the board downwards.
    const d = Math.min(220, Math.max(0, (h - 1240) / 2));
    const cx = w / 2;
    const noteXs = [cx - 182, cx + 182];
    const noteY = 568 + d * 0.8;
    // A phone with room grows the small targets to a comfortable thumb (about 44 CSS pixels at 390 × 844).
    const grow = Math.min(22, d / 5);
    return {
      lamp: box(cx, 135 + d * 0.2, 190, 210),
      levers: [box(cx - 190, 145 + d * 0.2, 130, 160), box(cx + 190, 145 + d * 0.2, 130, 160)],
      tryIt: box(cx, 300 + d * 0.35, 260, 100),
      status: { x: cx, y: 382 + d * 0.45, wrap: 700, size: 24 },
      records: [0, 1, 2, 3].map((i) => box(cx + (i - 1.5) * 172, 455 + d * 0.6, 160, 96)),
      notes: noteXs.map((x) => box(x, noteY, 350, 100)),
      toggles: noteXs.map((x) => [
        box(x - 88, 660 + d * 0.85, 166, 68 + grow),
        box(x + 88, 660 + d * 0.85, 166, 68 + grow),
      ]),
      help: box(cx - 150, 742 + d, 230, 72 + grow),
      check: box(cx + 150, 742 + d, 290, 72 + grow),
      text: 24,
    };
  }
  // Sideways the caption bubble covers the left 640 units below 343, so the lamp keeps above it and the rest goes right.
  const left = Math.max(0, (w - 1024) / 2);
  const cx = left + 832;
  const noteXs = [cx - 92, cx + 92];
  return {
    lamp: box(left + 330, 135, 170, 210),
    levers: [box(left + 175, 150, 120, 160), box(left + 485, 150, 120, 160)],
    tryIt: box(left + 330, 290, 240, 100),
    status: { x: cx, y: 575, wrap: 360, size: 22 },
    records: [0, 1, 2, 3].map((i) => box(cx + (i - 1.5) * 90, 80, 84, 110)),
    notes: noteXs.map((x) => box(x, 225, 176, 120)),
    toggles: noteXs.map((x) => [box(x - 44, 335, 84, 76), box(x + 44, 335, 84, 76)]),
    help: box(cx - 92, 460, 170, 96),
    check: box(cx + 92, 460, 170, 96),
    text: 20,
  };
}

export type BenchLayout = ReturnType<typeof benchLayout>;

/** Every target with a name, for the layout tests and the browser play. */
export const targets = (l: BenchLayout) => [
  { ...l.lamp, what: 'lamp', min: 64 },
  ...l.levers.map((b, i) => ({ ...b, what: `lever ${i}`, min: 100 })),
  { ...l.tryIt, what: 'Try it', min: 100 },
  ...l.records.map((b, i) => ({ ...b, what: `record ${i + 1}`, min: 64 })),
  ...l.notes.map((b, i) => ({ ...b, what: `note ${i}`, min: 64 })),
  ...l.toggles.flatMap((pair, i) =>
    pair.map((b, j) => ({ ...b, what: `note ${i} ${j ? 'ruled out' : 'fits'}`, min: 64 })),
  ),
  { ...l.help, what: 'Help', min: 64 },
  { ...l.check, what: 'Check', min: 64 },
];
