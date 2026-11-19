import type { View } from '../../engine/view';

/**
 * Where Chain Reaction puts its board and its controls, as pure functions of the view so a test can check every level on
 * the upright phone views (chunk 31, docs/definitions/phone-portrait.md). Sideways, the board sits left of a column of
 * Run, Help and the loose ramps at the right edge. Upright that column cannot stay: a 5-column board and a 116-wide
 * column do not fit 768 units, so the controls rest in one row up from the bottom edge and the board hangs above them.
 */
export interface Point {
  x: number;
  y: number;
}

/** Distance between neighbouring board columns, in units. */
export const COL_GAP = 104;
/** A loose ramp's tap radius: 50 makes a 100-unit target, so neighbouring sockets (104 apart) never overlap. */
export const PART_HIT_R = 50;
/** The Run and Help buttons' tap radius. */
export const BUTTON_HIT_R = 62;
/** Upright: the controls' row of centres stands this far above the bottom edge. */
export const TRAY_UP = 100;
/** Upright: the first control's centre, and the pitch between them (Run, Help, then up to two ramps). */
export const TRAY_X0 = 230;
export const TRAY_PITCH = 150;
/** Upright: the board's panel ends this far above the tray's tap areas. */
const TRAY_GAP = 20;
/** The panel extends this far below the last row (the bells' base), and a bell's tap area 24. */
export const PANEL_BELOW = 62;
/** Upright rows are at least 100 apart (a 100-tall tap area each) and spread to 124 when a tall phone has the room; sideways they shrink to fit, up to 96. */
const UPRIGHT_ROW_GAP = 100;
const UPRIGHT_ROW_GAP_MAX = 124;
/** Upright: the board's top stays below this line, clear of Home and the help mark. */
const UPRIGHT_TOP_FLOOR = 230;

export interface ChainLayout {
  left: number;
  top: number;
  gap: number;
  run: Point;
  help: Point;
  /** Where loose ramp number `piece` rests between uses. */
  home: (piece: number) => Point;
}

export function chainLayout(v: Pick<View, 'w' | 'h' | 'upright'>, cols: number, rows: number): ChainLayout {
  const span = (cols - 1) * COL_GAP;
  if (v.upright) {
    const trayY = v.h - TRAY_UP;
    // The panel's lower edge is the last row's line plus PANEL_BELOW; the board hangs from the tray, not from the top.
    const bottom = trayY - BUTTON_HIT_R - TRAY_GAP - PANEL_BELOW;
    const gap = Math.min(
      UPRIGHT_ROW_GAP_MAX,
      Math.max(UPRIGHT_ROW_GAP, (bottom - UPRIGHT_TOP_FLOOR) / (rows + 1)),
    );
    return {
      left: (v.w - span) / 2,
      top: bottom - (rows + 1) * gap,
      gap,
      run: { x: TRAY_X0, y: trayY },
      help: { x: TRAY_X0 + TRAY_PITCH, y: trayY },
      home: (i) => ({ x: TRAY_X0 + (2 + i) * TRAY_PITCH, y: trayY }),
    };
  }
  return {
    left: Math.max(190, (v.w - 225 - span) / 2),
    top: 112,
    gap: Math.min(96, (Math.min(v.h - 90, 680) - 112) / (rows + 1)),
    run: { x: v.w - 100, y: 180 },
    help: { x: v.w - 100, y: 305 },
    home: (i) => ({ x: v.w - 100, y: 455 + i * 122 }),
  };
}
