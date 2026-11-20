import type { View } from '../../engine/view';

/** One board cell, in units. */
export const CELL = 100;
/** The tray under the board on levels 8–9: its gap below the board, height and slot spacing. */
export const TRAY_GAP = 34;
export const TRAY_H = 124;
export const TRAY_STEP = 140;
/** The cards row under a materials board: its gap and the card step. */
export const ROW_GAP = 30;
export const CARD_STEP = 210;

/** The guide's corner on an upright view: a board with nothing under it stops above it. */
const GUIDE_CLEAR = 215;
/** Under-board rows (the tray, the cards) are centred, clear of the guide at the left, and rest this far above the bottom edge. */
const FOOT = 24;

/**
 * Where the board's top-left sits. `below` is the height of what hangs under it (the tray, or the cards row), 0 for none.
 * Sideways the whole stack is centred, as it always was. Upright the stack hangs up from the bottom edge (a tall phone's spare
 * height becomes sky at the top): a bare board stops above the guide corner, since a 7-wide board runs under it; a tray or cards
 * row is centred and clear of the guide, so it rests near the edge.
 */
export function boardOrigin(v: View, cols: number, rows: number, below: number): { x: number; y: number } {
  const x = (v.w - cols * CELL) / 2;
  if (!v.upright) return { x, y: Math.max(110, (v.h - (rows * CELL + below)) / 2 + 20) };
  const bottom = v.h - (below ? FOOT : GUIDE_CLEAR);
  return { x, y: bottom - below - rows * CELL };
}

/** Upright, the cards row shifts right so its first card clears the guide corner (the three cards span 570 of 768). */
export const cardsShift = (v: Pick<View, 'upright'>): number => (v.upright ? 60 : 0);
