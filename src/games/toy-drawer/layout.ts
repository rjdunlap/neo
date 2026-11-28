import { sizeAt, TOY_SIZE, type Puzzle, type ToyKind } from './logic';

/** A drawer cell in logical units: never shrunk (a 5 × 4 drawer is 600 × 480). */
export const CELL = 120;
/** A cell of a toy waiting in the tray, which grows to CELL when she picks it up: smaller sideways, where the tray is a narrow column. */
export const TRAY_CELL_SIDEWAYS = 60;
export const TRAY_CELL_UPRIGHT = 70;
/** A toy in the tray is at least this large to touch, however small it is drawn. */
export const MIN_HIT = 100;
export const BUTTON_R = 50;
export const CLOSE_R = 55;
const GAP = 14;

export interface Pt {
  x: number;
  y: number;
}
export interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface DrawerLayout {
  /** The drawer's top-left corner and size. */
  drawer: Box;
  /** The tray's panel; toys rest inside it. */
  tray: Box;
  /** The size of one cell of a toy resting in the tray. */
  trayCell: number;
  undo: Pt;
  again: Pt;
  hint: Pt;
  turn: Pt;
  close: Pt;
}

/**
 * Where everything sits. Sideways the drawer is at the left and the tray at its right; held upright the drawer is at
 * the top and the tray below it. The controls are one row up from the bottom edge, clear of the guide in the lower-left
 * corner and of Home and "?" at the top-left.
 */
export function drawerLayout(
  view: { w: number; h: number; upright?: true },
  rows: number,
  cols: number,
): DrawerLayout {
  const { w, h } = view;
  const W = cols * CELL;
  const H = rows * CELL;
  const y = h - 80;
  const controls = {
    undo: { x: 220, y },
    again: { x: 340, y },
    hint: { x: 460, y },
    turn: { x: 580, y },
    close: { x: w - 75, y },
  };
  if (!view.upright) {
    const left = 125;
    const trayX = left + W + 16;
    return {
      drawer: { x: left, y: 70, w: W, h: H },
      tray: { x: trayX, y: 20, w: w - 10 - trayX, h: Math.max(200, h - 175 - 20) },
      trayCell: TRAY_CELL_SIDEWAYS,
      ...controls,
    };
  }
  const left = Math.max(125, (w - W) / 2);
  const top = 60;
  const trayY = top + H + 30;
  return {
    drawer: { x: left, y: top, w: W, h: H },
    tray: { x: 20, y: trayY, w: w - 40, h: Math.min(420, Math.max(200, h - 180 - trayY)) },
    trayCell: TRAY_CELL_UPRIGHT,
    ...controls,
  };
}

/** A toy's box in the tray: at least MIN_HIT each way so its touch area is large and no two overlap. */
export const slotSize = (kind: ToyKind, turns: number, cell: number): { w: number; h: number } => {
  const s = sizeAt(kind, turns);
  return { w: Math.max(s.w * cell, MIN_HIT), h: Math.max(s.h * cell, MIN_HIT) };
};

/**
 * Rests the toys in the tray in rows, left to right, wrapping when a row is full. Returns each toy's slot (its center is
 * where the toy rests), or null if they do not all fit.
 */
export function packTray(
  toys: readonly { kind: ToyKind; turns: number }[],
  tray: Box,
  cell: number,
): Box[] | null {
  const out: Box[] = [];
  let x = tray.x;
  let y = tray.y;
  let rowH = 0;
  for (const t of toys) {
    const s = slotSize(t.kind, t.turns, cell);
    if (x > tray.x && x + s.w > tray.x + tray.w) {
      x = tray.x;
      y += rowH + GAP;
      rowH = 0;
    }
    if (s.w > tray.w || y + s.h > tray.y + tray.h) return null;
    out.push({ x, y, w: s.w, h: s.h });
    x += s.w + GAP;
    rowH = Math.max(rowH, s.h);
  }
  return out;
}

/** The toys of a puzzle with each turned by the bits of `mask`: for checking the tray fits every way she might turn them. */
export function trayToys(puzzle: Puzzle, mask: number): { kind: ToyKind; turns: number }[] {
  return puzzle.toys.map((t, i) => ({
    kind: t.kind,
    turns: TOY_SIZE[t.kind].w === TOY_SIZE[t.kind].h ? 0 : (mask >> i) & 1,
  }));
}
