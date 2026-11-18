import type { View } from '../../engine/view';
import type { BeatPlan } from './logic';

/** One square of the grid, in units: the smallest target the game has. */
export const CELL = 100;
/** Between the two halves of a wrapped grid. */
export const BAR_GAP = 30;
/** Room the row pictures need left of the grid, and the same again on the right, before a grid is wrapped. */
const SIDE = 100;
/** From the grid's bottom edge to the middle of the buttons under it. */
const CONTROLS_BELOW = 95;
const BUTTON_R = 56;

export interface GridLayout {
  /** The grid's top-left corner on the view. */
  x: number;
  y: number;
  /** Steps across one bar: every step sideways; half of them when an upright view wraps the grid into two bars. */
  cols: number;
  bars: number;
  /** One bar's height, and the whole grid's size with the gap between bars. */
  barH: number;
  w: number;
  h: number;
  /** The middle of the row of buttons under the grid. */
  controlsY: number;
}

type Shape = Pick<BeatPlan, 'rows' | 'steps'>;

/**
 * Where the grid sits. Sideways, and upright for the four-step levels, it is one bar of every step. Eight steps of 100
 * units are wider than the upright 768, so there the grid wraps into two bars of four, the second half under the first
 * (which is also how the repeat level reads: the half to make sits right under the half to copy), and the whole block
 * sits a little above the middle so the buttons stay near the thumb.
 */
export function gridLayout(v: View, plan: Shape): GridLayout {
  const wrap = v.upright === true && plan.steps * CELL + SIDE * 2 > v.w;
  const cols = wrap ? plan.steps / 2 : plan.steps,
    bars = wrap ? 2 : 1;
  const barH = plan.rows * CELL,
    w = cols * CELL,
    h = bars * barH + (bars - 1) * BAR_GAP;
  if (!wrap) {
    const y = Math.max(130, v.h * 0.26);
    return {
      x: Math.max(200, (v.w - w) / 2 + 40),
      y,
      cols,
      bars,
      barH,
      w,
      h,
      controlsY: y + h + CONTROLS_BELOW,
    };
  }
  // The friends stand on their deck just above the grid, so it never starts higher than 190.
  const block = h + CONTROLS_BELOW + BUTTON_R;
  const y = Math.max(190, (v.h - block) * 0.45);
  return { x: (v.w - w) / 2 + 30, y, cols, bars, barH, w, h, controlsY: y + h + CONTROLS_BELOW };
}

/** A square's top-left corner, in the grid's own units. */
export function cellAt(l: GridLayout, row: number, step: number): { x: number; y: number } {
  return { x: (step % l.cols) * CELL, y: Math.floor(step / l.cols) * (l.barH + BAR_GAP) + row * CELL };
}

/** The square under a point in the grid's own units, or null outside the squares (the gap between bars included). */
export function cellHit(
  l: GridLayout,
  plan: Shape,
  x: number,
  y: number,
): { row: number; step: number } | null {
  const col = Math.floor(x / CELL),
    bar = Math.floor(y / (l.barH + BAR_GAP)),
    row = Math.floor((y - bar * (l.barH + BAR_GAP)) / CELL);
  if (col < 0 || col >= l.cols || bar < 0 || bar >= l.bars || row < 0 || row >= plan.rows) return null;
  return { row, step: bar * l.cols + col };
}

/** The listen, clap-only and check buttons under the grid (the section levels place their own rows from `controlsY`). */
export function buttonsAt(v: View, l: GridLayout, mode: BeatPlan['mode']) {
  const spread = mode === 'revise' ? 170 : 90;
  return {
    r: BUTTON_R,
    listen: { x: v.w / 2 - spread, y: l.controlsY },
    solo: { x: v.w / 2, y: l.controlsY },
    check: { x: v.w / 2 + spread, y: l.controlsY },
  };
}
