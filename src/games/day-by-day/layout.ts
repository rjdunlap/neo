import { UPRIGHT_H, type View } from '../../engine/view';
import { STRIP_H, STRIP_MIN_VIEW_H } from '../../ui/caption-layout';

export const RECORD = { w: 108, h: 112 };
export const CHOICE = { w: 170, h: 110 };
export const PLACE = { w: 120, h: 110 };
export const TAB = { w: 160, h: 100 };
export const REPLAY = { w: 110, h: 100 };
export const SUMMARY = { w: 290, h: 140 };
export const SUBMIT = { w: 120, h: 100 };

function row(count: number, x: number, y: number, step: number) {
  return Array.from({ length: count }, (_, i) => ({ x: x + (i - (count - 1) / 2) * step, y }));
}

/** Keep the calendar in reading order, with two full-size rows on a phone. */
function recordPositions(x: number, y: number, upright?: true, count = 7) {
  if (count < 7) return row(count, x, y, 118);
  return upright ? [...row(4, x, y, 118), ...row(3, x, y + 140, 118)] : row(7, x, y, 118);
}

/** The dotted return runs outside the record cards and ends with an upward arrow. */
export function wrapPath(records: ReturnType<typeof recordPositions>) {
  const monday = records[0];
  const sunday = records[6];
  const start = { x: sunday.x, y: sunday.y + 60 };
  const end = { x: monday.x, y: monday.y + 60 };
  const bottom = start.y + 31;
  const left = monday.x - 74;
  return monday.y === sunday.y
    ? [start, { x: start.x, y: bottom }, { x: end.x, y: bottom }, end]
    : [
        start,
        { x: start.x, y: bottom },
        { x: left, y: bottom },
        { x: left, y: end.y + 14 },
        { x: end.x, y: end.y + 14 },
        end,
      ];
}

function portraitPlacement(view: View) {
  const short = !!view.upright && view.h < STRIP_H + STRIP_MIN_VIEW_H;
  const center = (view.h - UPRIGHT_H) * 0.54;
  // On a short screen, leave space below the options for the words above the guide.
  const top = view.upright ? Math.min(center, Math.max(0, view.h - 1240)) : 0;
  const arrowX = short ? view.w - 66 : view.w / 2;
  return { short, top, arrowX };
}

/** `count` is the round's records: seven for a pretend week, three for Three little skies (one row everywhere). */
export function weekLayout(view: View, count = 7) {
  const { w, h, upright } = view;
  const x = w / 2;
  const { short, top, arrowX } = portraitPlacement(view);
  return {
    heading: { x, y: top + 120 },
    caption: { x: x + (upright ? 32 : 0), y: top + 176 },
    records: recordPositions(x, top + 280, upright, count),
    sky: { x, y: top + (upright ? 555 : 378) },
    note: { x, y: top + (upright ? 628 : 570) },
    choices: row(3, x, top + (upright ? 710 : 470), 190),
    confirm: upright ? { x: arrowX, y: top + 834 } : { x: x + 365, y: 470 },
    garden: upright
      ? { x: x + 54, y: short ? Math.max(945, h - 90) : top + 945, scale: 0.82 }
      : { x, y: h - 105, scale: 1 },
  };
}

export function windowLayout(view: View) {
  const { w, upright } = view;
  const x = w / 2;
  const { short, top, arrowX } = portraitPlacement(view);
  const tabsY = top + (upright ? 270 : 234);
  const choicesY = short ? 720 : 744;
  return {
    heading: { x, y: top + 113 },
    caption: { x: x + (upright ? 32 : 0), y: top + (upright ? 171 : 156) },
    tabs: upright ? row(2, x + 80, tabsY, 186) : row(2, x, tabsY, 200),
    replay: { x: x - (upright ? 225 : 350), y: tabsY },
    records: recordPositions(x, top + (upright ? 402 : 355), upright),
    note: { x, y: top + (upright ? (short ? 624 : 636) : 428) },
    choices: row(2, x, top + (upright ? choicesY : 520), 340),
    confirm: { x: arrowX, y: top + (upright ? choicesY + 141 : 658) },
  };
}

/** A month card: 100 across and high, the smallest target. */
export const MONTH = { w: 100, h: 100 };

/**
 * The month wheel's ring, January at the top and the months running clockwise. The cards sit on an ellipse wide enough that
 * neighbours never touch (cards are 100 across and high): a circle of 280 upright, 330 by 205 on the wide screen. The
 * question and the arrow sit in the middle.
 */
export function monthLayout(view: View) {
  const x = view.w / 2;
  const { short, top, arrowX } = portraitPlacement(view);
  const upright = !!view.upright;
  const rx = upright ? 280 : 330;
  const ry = upright ? 280 : 205;
  const cy = top + (upright ? 640 : 480);
  return {
    heading: { x, y: top + 120 },
    caption: { x: x + (upright ? 32 : 0), y: top + 176 },
    centre: { x, y: cy - 80 },
    note: { x, y: cy - 8 },
    confirm: { x: short && upright ? arrowX : x, y: cy + 70 },
    ring: { x, y: cy, rx, ry },
    months: Array.from({ length: 12 }, (_, i) => {
      const a = (i / 12) * Math.PI * 2 - Math.PI / 2;
      return { x: x + Math.cos(a) * rx, y: cy + Math.sin(a) * ry };
    }),
  };
}
