import { spread, UPRIGHT_H, type View } from '../../engine/view';
import { planFor } from './logic';

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}
export interface Exhibit {
  parcel: Rect;
  look: Rect;
  listen: Rect | null;
  strip: Rect[];
  shelf: Rect[];
  board: Rect;
  choices: Rect[];
  check: Rect;
  /** Level 5's *Can't tell yet* card, or null. */
  cantTell: Rect | null;
}

export const TOY_W = 200;
export const TOY_H = 220;
export const CHECK = 170;
export const EVIDENCE = 140;
export const BUTTON = 150;
export const CANT_TELL = 170;

/**
 * Reserve the later clue and response slots from the start, so a reveal never moves an existing touch target.
 */
export function exhibitLayout(view: View, level: number): Exhibit {
  const { w, h } = view;
  const plan = planFor(level);
  const channels = plan.channels.length;
  const tell = plan.mode === 'tell';
  const landscape = !view.upright && w >= h;
  const top = landscape ? 120 : 200 + Math.min(120, Math.max(0, (h - UPRIGHT_H) / 3));
  const parcelW = 240;
  const gap = 30;
  const rowW = BUTTON + gap + parcelW + (channels > 1 ? gap + BUTTON : 0);
  const left = (w - rowW) / 2;
  const look: Rect = { x: left, y: top + 25, w: BUTTON, h: BUTTON };
  const parcel: Rect = { x: left + BUTTON + gap, y: top, w: parcelW, h: 200 };
  const listen: Rect | null =
    channels > 1 ? { x: parcel.x + parcelW + gap, y: top + 25, w: BUTTON, h: BUTTON } : null;
  const stripY = top + 200 + 30;
  const stripX = spread(tell ? 2 : channels, 0, w, EVIDENCE + 24);
  const slots: Rect[] = stripX.map((cx) => ({ x: cx - EVIDENCE / 2, y: stripY, w: EVIDENCE, h: EVIDENCE }));
  const shelfY = landscape ? h - 20 - TOY_H : stripY + EVIDENCE + 30;
  const checkX = w - 20 - CHECK;
  const lo = landscape ? 170 : 20;
  const hi = landscape ? checkX - 20 : w - 20;
  const shelfRow = (count: number): Rect[] =>
    spread(count, lo, hi, TOY_W + 30).map((cx) => ({
      x: cx - TOY_W / 2,
      y: shelfY,
      w: TOY_W,
      h: TOY_H,
    }));
  const shelf = shelfRow(plan.shelf.length);
  const board: Rect = {
    x: shelf[0].x - 24,
    y: shelfY - 14,
    w: shelf[shelf.length - 1].x + TOY_W - shelf[0].x + 48,
    h: TOY_H + 28,
  };
  const check: Rect = landscape
    ? { x: checkX, y: shelfY + (TOY_H - CHECK) / 2, w: CHECK, h: CHECK }
    : { x: checkX, y: shelfY + TOY_H + 20, w: CHECK, h: CHECK };
  // The card sits above Check in landscape (the column right of the shelf), and left of Check on its row in portrait.
  const cantTell: Rect | null = !tell
    ? null
    : landscape
      ? { x: checkX, y: check.y - 20 - CANT_TELL, w: CANT_TELL, h: CANT_TELL }
      : { x: checkX - 30 - CANT_TELL, y: check.y, w: CANT_TELL, h: CANT_TELL };
  return {
    parcel,
    look,
    listen,
    strip: slots,
    shelf,
    board,
    choices: tell ? shelfRow(2) : [],
    check,
    cantTell,
  };
}
