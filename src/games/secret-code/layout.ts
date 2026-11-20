import { spread, type View } from '../../engine/view';
import { rowsThatFit } from './logic';

/** The pitch between slots and between the hidden code's stones. */
export const SLOT_PITCH = 124;

export interface CodeLayout {
  upright: boolean;
  /** The door's center line (slots, key and marks sit on it). */
  doorY: number;
  /** How many past tries fit in the list above the door. */
  rows: number;
  slotX: number[];
  /** Left edge of the slot panel, and its width. */
  x0: number;
  panelW: number;
  key: { x: number; y: number };
  trayY: number;
  trayX: number[];
  /** Be the door's tap discs under the slots. */
  discsY: number;
  /** Swap seats' two buttons. */
  seatsY: number;
  seatsX: [number, number];
  /** The made code's panel (400 × 124) when two of us play: its center. */
  mine: { x: number; y: number; scale: number };
  /** Where the list of past tries starts (its left edge) and its bottom row's y. */
  pastX: number;
  pastBottom: number;
}

/**
 * Where Secret Code puts things, pure so a test can read it at every level and view (chunk 31). Sideways it is the
 * original plan: the door at 60% of the height, the tray in the bottom row from x = 190 (clear of the guide) to w − 110.
 * Upright the tray runs 160 to w − 40 (five stones at a 113 pitch, taps of 112), and the door hangs 400 up from the
 * bottom edge so a tall phone's spare height is more room for tries above the door, not a gap under it.
 */
export function codeLayout(v: Pick<View, 'w' | 'h' | 'upright'>, slots: number, colors: number): CodeLayout {
  const upright = !!v.upright;
  const doorY = upright ? Math.max(430, v.h - 400) : Math.max(430, v.h * 0.6);
  const cx = v.w / 2 - 40;
  const slotX = Array.from({ length: slots }, (_, i) => cx + (i - (slots - 1) / 2) * SLOT_PITCH);
  const panelW = slots * SLOT_PITCH + 60;
  const x0 = slotX[0] - 92;
  const trayX = upright
    ? spread(colors, 160, v.w - 40, SLOT_PITCH)
    : spread(colors, 190, v.w - 110, SLOT_PITCH);
  return {
    upright,
    doorY,
    rows: rowsThatFit(doorY),
    slotX,
    x0,
    panelW,
    key: { x: x0 + panelW + 80, y: doorY },
    trayY: v.h - 90,
    trayX,
    discsY: doorY + 134,
    seatsY: doorY,
    seatsX: [cx - 110, cx + 110],
    // Two of us shows the code and the tray together: sideways the code sits up at the right, clear of the tries above the
    // door. Upright it stays there but shrinks to 0.6 so it clears both the tries list (to about x = 480) and the 768 edge;
    // it is a picture, never a target.
    mine: upright ? { x: v.w - 140, y: doorY - 210, scale: 0.6 } : { x: v.w - 224, y: doorY - 210, scale: 1 },
    pastX: cx - ((slots - 1) * 76) / 2,
    pastBottom: doorY - 150,
  };
}
