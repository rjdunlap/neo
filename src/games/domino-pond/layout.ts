import type { View } from '../../engine/view';
import type { Level } from './logic';

export const CELL = 108;
export const TRAY_W = 160;
export const TARGET = 100;

export function pondLayout(view: View, level: Level) {
  const upright = view.upright === true;
  const width = upright ? 768 : 1024;
  const left = (view.w - width) / 2;
  // Anchor to the top so the board stays above the short-view speech bubble.
  const center = left + (upright ? 392 : level === 1 ? 390 : 350);
  const columns = [5, 2, 3][level - 1];
  const rows = level === 1 ? 1 : 2;
  const x = center - (columns * CELL) / 2;
  const drop = upright ? Math.min(350, Math.max(0, (view.h - 1024) * 0.67)) : 0;
  const y = upright ? 133 + drop : 124;
  const cell = (id: number) => ({
    x: x + ((id % columns) + 0.5) * CELL,
    y: y + (Math.floor(id / columns) + 0.5) * CELL,
  });
  const tray = Array.from({ length: level === 3 ? 3 : 2 }, (_, i) =>
    upright
      ? { x: center + (i - (level === 3 ? 1 : 0.5)) * 182, y: 408 + drop }
      : { x: view.w - 275, y: 145 + i * 114 },
  );
  const controls = Array.from({ length: 4 }, (_, i) =>
    upright ? { x: center + (i - 1.5) * 124, y: 532 + drop } : { x: view.w - 98, y: 145 + i * 114 },
  );
  return { cell, tray, controls, x, y, columns, rows, center, upright };
}
