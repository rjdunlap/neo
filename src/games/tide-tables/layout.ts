import type { View } from '../../engine/view';
import { JOBS, ROWS } from './logic';

type Box = { x: number; y: number; w: number; h: number };

export function tableLayout({ w, h, upright }: Pick<View, 'w' | 'h' | 'upright'>) {
  const box = (x: number, y: number, width: number, height: number): Box => ({ x, y, w: width, h: height });
  if (upright) {
    const top = Math.min(200, 124 + Math.max(0, (h - 1230) / 3));
    return {
      heading: { x: w / 2 + 34, y: top - 48 },
      rows: ROWS.map((row) => box(w / 2 + 40, top + 56 + row * 102, 584, 96)),
      jobs: JOBS.map((job) => box(w / 2 + (job - 1) * 224, top + 480, 212, 112)),
      actions: JOBS.map((job) => box(w / 2 + (job - 1) * 224, top + 604, 212, 96)),
      status: { x: w / 2, y: top + 679 },
    };
  }
  const base = (w - 1024) / 2;
  // Keep job cards and actions high on the left of the caption bubble. The time rows sit to its right.
  return {
    heading: { x: base + 810, y: 89 },
    rows: ROWS.map((row) => box(base + 810, 196 + row * 103, 340, 96)),
    jobs: JOBS.map((job) => box(base + 214 + job * 168, 168, 158, 112)),
    actions: JOBS.map((job) => box(base + 214 + job * 168, 282, 158, 96)),
    status: { x: base + 382, y: 365 },
  };
}
