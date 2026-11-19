import type { View } from '../../engine/view';

/**
 * Where Block Tower puts its room, controls and towers, as pure functions of the view so a test can check every mode
 * on the upright phone views (chunk 31, docs/definitions/phone-portrait.md). Everything stands on the floor, which is
 * 70 units up from the bottom edge; what hung from the top of a 768-tall view (the window, the beam the leaning towers
 * hang from, the Watch again and Continue buttons) now hangs from the floor instead, so on a tall phone the Continue
 * button sits beside the towers it is about, not 1,000 units above them.
 */
export interface Point {
  x: number;
  y: number;
}

/** A block's size in logical units. */
export const BW = 104;
export const BH = 62;
/** Pitch of the reach level's tray: each block's tap area is 124 wide, so the old 120 overlapped neighbours by 4 (found by the upright test). */
export const TRAY_PITCH = 130;
/** The tray's blocks, the bell and the basket are drawn with a hit area of at least this much each way. */
export const TRAY_HIT = { w: BW + 20, h: BH + 40 };
/** The basket's tap area, about its own origin. */
export const BIN_HIT = { x: -85, y: -110, w: 170, h: 125 };
/** The round buttons' radius (Watch again, Continue, the bell). */
export const BUTTON_R = 54;
/** How far up from the bottom edge the floor stands. */
export const FLOOR_UP = 70;
/** The design height the room's top furniture was placed in; taller views push it down to the floor. */
const DESIGN_H = 768;

export const floorY = (v: Pick<View, 'h'>): number => v.h - FLOOR_UP;
/** A height measured on the old 768-tall room, carried to this view's floor. */
export const roomY = (v: Pick<View, 'h'>, y: number): number => y + Math.max(0, v.h - DESIGN_H);
export const tableTopY = (v: Pick<View, 'h'>): number => floorY(v) - 170;

/** Where the child's tower stands (the compare level puts it right of Duck's). */
export const towerX = (v: Pick<View, 'w'>, match: boolean): number => v.w * (match ? 0.58 : 0.45);
export const bearX = (v: Pick<View, 'w'>): number => v.w * 0.3;
/**
 * The two leaning towers. Held upright the left one moves right: its leaning blocks' tap areas (144 wide, up to 52 over)
 * reached under the guide's corner at 0.32 of 768 (found by the upright test).
 */
export const standX = (v: Pick<View, 'w' | 'upright'>, i: number): number =>
  v.w * (v.upright ? (i ? 0.76 : 0.4) : i ? 0.68 : 0.32);
/** The table edge the star stands past: the right-hand one reaches left, the left-hand one reaches right. */
export const edgeX = (v: Pick<View, 'w'>, direction: 1 | -1): number =>
  v.w * (direction === -1 ? 0.58 : 0.42);

export interface TowerLayout {
  floor: number;
  tableTop: number;
  /** The playroom window's top-left corner. */
  window: Point;
  /** The beam the leaning towers hang from. */
  beamY: number;
  bin: Point;
  bell: Point;
  watchAgain: Point;
  continueStand: Point;
  /** Where the loose blocks of the reach level rest, in order. */
  tray: (index: number) => Point;
}

export function towerLayout(v: Pick<View, 'w' | 'h'>): TowerLayout {
  const floor = floorY(v);
  return {
    floor,
    tableTop: tableTopY(v),
    window: { x: v.w * 0.72, y: roomY(v, 70) },
    beamY: roomY(v, 40),
    bin: { x: v.w - 120, y: floor + 20 },
    bell: { x: v.w - 120, y: floor - 190 },
    // Level 5's buttons sat 290 down a 768-tall room: 410 above the floor, over the towers' three-block tops.
    watchAgain: { x: v.w * 0.43, y: floor - 410 },
    continueStand: { x: v.w * 0.65, y: floor - 410 },
    tray: (i) => ({ x: v.w - 330 + i * TRAY_PITCH, y: floor + 30 }),
  };
}
