import { spread } from '../../engine/view';

/** A tray piece's touch circle radius, and a round button's radius, in units. */
export const PIECE_HIT = 75;
export const BUTTON_R = 50;

export interface Pt {
  x: number;
  y: number;
}

export interface TownLayout {
  /** The picture board's center (the picture reaches 210 either side, 220 up and 200 down). */
  board: Pt;
  turn: Pt;
  help: Pt;
  check: Pt;
  /** Where each tray piece rests. */
  tray: Pt[];
  /** The cream tray panel behind them. */
  panel: { x: number; y: number; w: number; h: number };
}

/**
 * Where everything sits. Sideways the buttons are a column at the right and the pieces one row along the bottom. Held
 * upright (chunk 31, docs/definitions/phone-portrait.md) a row of four 150-unit circles does not fit between the guide
 * corner and the edge of a 768-wide screen, so the pieces rest in rows of two, the lowest row clear of the guide.
 */
export function townLayout(view: { w: number; h: number; upright?: true }, pieces: number): TownLayout {
  const { w, h } = view;
  const board = { x: w / 2, y: Math.max(340, h * 0.4) };
  const turn = { x: w - 85, y: 250 };
  const help = { x: w - 85, y: 390 };
  const check = { x: w - 85, y: 530 };
  if (!view.upright) {
    const xs = spread(pieces, 200, w - 65, 205);
    return {
      board,
      turn,
      help,
      check,
      tray: xs.map((x) => ({ x, y: h - 100 })),
      panel: { x: 175, y: h - 190, w: w - 205, h: 170 },
    };
  }
  const bottom = h - 110;
  const rowPitch = 190;
  const rows = Math.ceil(pieces / 2);
  const tray: Pt[] = [];
  for (let r = 0; r < rows; r++) {
    const inRow = Math.min(2, pieces - r * 2);
    const y = bottom - (rows - 1 - r) * rowPitch;
    const xs = inRow === 2 ? [w / 2 - 130, w / 2 + 130] : [w / 2];
    for (const x of xs) tray.push({ x, y });
  }
  const top = bottom - (rows - 1) * rowPitch - 100;
  return { board, turn, help, check, tray, panel: { x: 175, y: top, w: w - 205, h: h - 20 - top } };
}
