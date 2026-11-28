import type { View } from '../../engine/view';

export interface Spot {
  x: number;
  y: number;
}
export interface Panel {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** A slot's edge, a tray tile's edge and a button's edge, all above the 100-unit target size. */
export const SLOT = 108;
export const TILE = 104;
export const BUTTON = 100;
const PITCH = 112;
const LABEL_W = 120;

export interface PlannerLayout {
  upright: boolean;
  slot: number;
  tile: number;
  button: number;
  /** The Bench and Cart slot centers, per step. */
  bench: Spot[];
  cart: Spot[];
  /** Where the Bench and Cart row names and icons sit (display only). */
  benchLabel: Spot;
  cartLabel: Spot;
  /** The step numbers over the columns (display only). */
  stepNums: Spot[];
  /** The Cart trips counter's center and the line under it for the trip names. */
  trips: Spot;
  /** Tray tile homes, in the tray's own order. */
  tray: Spot[];
  /** Where a tile dropped counts as put back in the tray. */
  trayZone: Panel;
  /** Undo, Clear, Hint, Run plan. */
  buttons: Spot[];
  /** The Trace Card: its panel, its message line and its two buttons. */
  card: Panel;
  cardText: Spot;
  cardButtons: Spot[];
  cardButton: { w: number; h: number };
  /** Paper behind the board. */
  panels: Panel[];
}

/**
 * Where Village Planner puts things, pure so a test reads it at every view. The board is a label column and `steps` columns of
 * 108-unit slots (Bench row over Cart row), the tray of job tiles below it, the four buttons under that clear of the guide. An
 * upright view stacks the same pieces lower on the page; a taller one spreads them a little.
 */
export function plannerLayout(
  v: Pick<View, 'w' | 'h' | 'upright'>,
  steps: number,
  jobs: number,
): PlannerLayout {
  const upright = !!v.upright;
  const extra = upright ? Math.max(0, v.h - 1024) : Math.max(0, v.h - 768);
  const boardW = LABEL_W + steps * PITCH;
  const left = (v.w - boardW) / 2;
  const first = left + LABEL_W + PITCH / 2;
  const stepNumY = upright ? 262 + extra * 0.2 : 156;
  const benchY = upright ? 336 + extra * 0.22 : 222;
  const cartY = benchY + 120;
  const trayY = upright ? cartY + 176 : cartY + 150;
  const buttonY = upright ? Math.min(v.h - 220, trayY + 170) : trayY + 190;
  const trayW = jobs * PITCH - (PITCH - TILE);
  const trayX0 = (v.w - trayW) / 2 + TILE / 2;
  const cols = (y: number): Spot[] => Array.from({ length: steps }, (_, i) => ({ x: first + i * PITCH, y }));
  // The Trace Card sits under the Cart row, over the tray (which is empty once every job is placed).
  const cardTop = cartY + SLOT / 2 + 10;
  const cardH = 210;
  return {
    upright,
    slot: SLOT,
    tile: TILE,
    button: BUTTON,
    bench: cols(benchY),
    cart: cols(cartY),
    benchLabel: { x: left + LABEL_W / 2, y: benchY },
    cartLabel: { x: left + LABEL_W / 2, y: cartY },
    stepNums: cols(stepNumY),
    trips: { x: v.w / 2, y: upright ? 196 + extra * 0.15 : 100 },
    tray: Array.from({ length: jobs }, (_, i) => ({ x: trayX0 + i * PITCH, y: trayY })),
    trayZone: { x: 40, y: trayY - TILE / 2 - 24, w: v.w - 80, h: TILE + 48 },
    buttons: [0, 1, 2, 3].map((i) => ({ x: v.w / 2 + (i - 1.5) * 130, y: buttonY })),
    card: { x: v.w / 2 - 350, y: cardTop, w: 700, h: cardH },
    cardText: { x: v.w / 2, y: cardTop + 46 },
    cardButtons: [-1, 1].map((s) => ({ x: v.w / 2 + s * 170, y: cardTop + 148 })),
    cardButton: { w: 300, h: BUTTON },
    panels: [
      { x: left - 12, y: stepNumY - 34, w: boardW + 24, h: cartY + SLOT / 2 + 12 - (stepNumY - 34) },
      { x: 40, y: trayY - TILE / 2 - 24, w: v.w - 80, h: TILE + 48 },
    ],
  };
}
