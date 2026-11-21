import type { View } from '../../engine/view';
import { DELTAS, DIRECTIONS, type Direction } from './logic';

/**
 * Where Robot Path puts things, as a pure function of the view so a test can check every level on the upright phone views
 * (chunk 31, docs/definitions/phone-portrait.md). Sideways, and on a narrow window that is not an upright phone, the
 * numbers are what the scene always used. Held upright (768 wide) the grid takes the top, the four arrows lie in one row
 * beneath it (the loop button beside them on loop levels), then the program slots, and the play button sits at the end of
 * the last slot row, so nothing crowds the grid however tall the phone is.
 */
export interface Point {
  x: number;
  y: number;
}

export interface RobotLayout {
  /** One grid cell's side. */
  cell: number;
  /** The grid's top-left corner. */
  origin: [number, number];
  arrows: Record<Direction, Point>;
  play: Point;
  clear: Point;
  loop: Point;
  /** The first program slot's center x, the first row's center y and the step between rows. */
  queue: { x0: number; top: number; rowStep: number };
}

/** Slot rows for a program of `limit` steps (four to a row). */
export const queueRows = (limit: number) => (limit > 4 ? 2 : 1);

export function robotLayout(
  v: View,
  size: number,
  limit: number,
  mode: 'steps' | 'counts' | 'loop',
): RobotLayout {
  const rows = queueRows(limit);
  const queue = (top: number) => ({ x0: v.w / 2 - 165, top, rowStep: 110 });
  if (v.upright) {
    // Below the grid: a gap, the arrow row, a gap, the slot rows and the bottom margin.
    const slotsH = rows * 110;
    const below = 36 + 100 + 36 + slotsH + 56;
    const top = 215;
    const cell = Math.max(
      100,
      Math.min(128, Math.floor((v.w - 40) / size), Math.floor((v.h - top - below) / size)),
    );
    const gridH = size * cell;
    const slotTop = v.h - 56 - (rows - 1) * 110 - 50;
    const arrowsY = slotTop - 50 - 36 - 50;
    // Spare height goes above and below the grid evenly, so a tall phone's board sits between Home and the arrows.
    const spare = Math.max(0, arrowsY - 50 - 36 - top - gridH);
    const originY = top + spare / 2;
    const n = mode === 'loop' ? 5 : 4;
    const step = mode === 'loop' ? 120 : 130;
    const at = (k: number): Point => ({ x: v.w / 2 + (k - (n - 1) / 2) * step, y: arrowsY });
    const order: Direction[] = ['up', 'right', 'down', 'left'];
    const arrows = Object.fromEntries(order.map((d, k) => [d, at(k)])) as Record<Direction, Point>;
    return {
      cell,
      origin: [(v.w - size * cell) / 2, originY],
      arrows,
      play: { x: v.w - 90, y: slotTop + (rows - 1) * 110 },
      clear: { x: v.w - 70, y: 70 },
      loop: at(4),
      queue: queue(slotTop),
    };
  }
  const portrait = v.h > v.w;
  const cell = portrait ? 100 : Math.max(100, Math.min(128, (v.h - 350) / size));
  const origin: [number, number] = portrait
    ? [20, 220]
    : [Math.max(150, v.w / 2 - 360), Math.max(40, (v.h - size * cell - 250) / 2)];
  const cx = v.w - 190;
  const cy = portrait ? v.h - 300 : v.h * 0.44;
  const arrows = Object.fromEntries(
    DIRECTIONS.map((d) => [d, { x: cx + DELTAS[d][0] * 112, y: cy + DELTAS[d][1] * 112 }]),
  ) as Record<Direction, Point>;
  const q = queue(v.h - (rows > 1 ? 170 : 80));
  return {
    cell,
    origin,
    arrows,
    play: { x: v.w - 90, y: v.h - 76 },
    clear: { x: v.w - 70, y: 70 },
    loop: { x: q.x0 + limit * 110 + 50, y: v.h - 80 },
    queue: q,
  };
}

/**
 * Level 15 (A routine): the board beside a compact editor, in every orientation. The board is a playback display (cells
 * need not be 100); every control is 100 units. The editor column is three tiles wide: the purple Do this row (two
 * slots), the Start here row (three), the call tile, up and Undo, then left, down and right, then Play.
 */
export interface RoutineLayout {
  cell: number;
  origin: [number, number];
  /** Heading text positions (left edges, centered on y). */
  routineHead: Point;
  mainHead: Point;
  routineSlots: Point[];
  mainSlots: Point[];
  call: Point;
  arrows: Record<Direction, Point>;
  undo: Point;
  play: Point;
}

export const ROUTINE_COLUMN_W = 312;

export function routineLayout(v: View): RoutineLayout {
  const cell = 100;
  const gap = 24;
  const gridW = 4 * cell;
  const total = gridW + gap + ROUTINE_COLUMN_W;
  const left = Math.max(v.upright ? 12 : 130, (v.w - total) / 2);
  const colX = left + gridW + gap;
  const colH = 44 + 100 + 20 + 44 + 100 + 22 + 206 + 14 + 100;
  const colTop = Math.max(60, (v.h - colH) / 2);
  const gridTop = Math.min(v.h - 170 - gridW - 8, Math.max(215, (v.h - gridW) / 2));
  const at = (col: number, y: number): Point => ({ x: colX + 50 + col * 106, y });
  let y = colTop;
  const routineHead = { x: colX, y: y + 16 };
  y += 44 + 50;
  const routineSlots = [0, 1].map((k) => at(k, y));
  y += 50 + 20;
  const mainHead = { x: colX, y: y + 16 };
  y += 44 + 50;
  const mainSlots = [0, 1, 2].map((k) => at(k, y));
  y += 50 + 22 + 50;
  const upY = y;
  const lowY = y + 106;
  y = lowY + 50 + 14 + 50;
  return {
    cell,
    origin: [left, gridTop],
    routineHead,
    mainHead,
    routineSlots,
    mainSlots,
    call: at(0, upY),
    arrows: { up: at(1, upY), left: at(0, lowY), down: at(1, lowY), right: at(2, lowY) },
    undo: at(2, upY),
    play: { x: colX + ROUTINE_COLUMN_W - 50, y },
  };
}
