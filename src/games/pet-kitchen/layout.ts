import { spread, type View } from '../../engine/view';

/** Round buttons are 52 units in radius: 104 across, over the 100-unit floor. */
export const BUTTON_R = 52;
/** The counter's top edge above the bottom of the view; the cuts, the scoops and the loose pieces stand on it. */
export const COUNTER = 260;

export interface KitchenLayout {
  serve: { x: number; y: number };
  undo: { x: number; y: number };
  recut: { x: number; y: number };
  /** Where the friends' plates stand. */
  plateY: number;
  /** An uncut sandwich or pizza, when the plates are not on screen. */
  foodY: number;
  /** Level 14's and 13's uncut sandwiches, between the plates and the counter. */
  wholesY: number;
  /** The doubled recipe's bowl and fruit (levels 5, 6 and 8). */
  mealY: number;
  /** The first row of loose pieces on the counter, then rows up from there. */
  pieceXs: number[];
  pieceY: number;
}

/**
 * Pet Kitchen's fixed positions for a view (chunk 31, docs/definitions/phone-portrait.md). Sideways they are the old
 * ones. Held upright the view is 768 wide and 1,024 or more tall: the round-ending arrow stands just above the counter's
 * right end instead of at the very top of a tall phone, and the food, plates and bowl sit lower so the room between the
 * top buttons and the counter is not left empty above the thumb.
 */
export function kitchenLayout(v: View): KitchenLayout {
  const up = !!v.upright;
  const plateY = up ? Math.max(430, v.h * 0.43) : Math.max(310, v.h * 0.36);
  return {
    serve: up ? { x: v.w - 75, y: v.h - COUNTER - 75 } : { x: v.w - 75, y: 65 },
    undo: { x: v.w - 75, y: v.h - 80 },
    recut: { x: 205, y: 65 },
    plateY,
    foodY: v.h * (up ? 0.52 : 0.4),
    wholesY: Math.min(v.h - COUNTER - 72, plateY + 190),
    mealY: v.h * (up ? 0.55 : 0.5),
    pieceXs: spread(4, 200, v.w - 80, 145),
    pieceY: v.h - 90,
  };
}
