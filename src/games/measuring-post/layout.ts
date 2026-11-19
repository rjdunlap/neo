/**
 * Where Measuring Post puts things, as a pure function of the view and the level's mode, so the sideways layout and the
 * upright phone's (chunk 31, docs/definitions/phone-portrait.md) are both testable (`upright.test.ts`).
 * Sideways centres the 1024 × 768 plan; an upright view that is not a phone's (a tablet) stretches the 768 × 1024 plan
 * over the view (positions only: pads and buttons keep their size). On a phone held upright everything she touches is
 * placed up from the bottom edge, in a thumb's reach: Help, Replay and Send (or Check) in the bottom row, the pads (tools,
 * units, the three comparison or grams pads) just above it, and level 2's two answer rows stacked there. The board sits
 * on those controls and keeps its shape (no taller than `BOARD_TALL` times its width), so a tall phone leaves the room
 * above the board rather than between the board and the thumb.
 */
import type { Mode } from './logic';

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

export interface Layout {
  landscape: boolean;
  board: Box;
  /** The one-big-is-two-little strip and the two record slots (level 2); level 1 uses the whole board. */
  strip: Box;
  slots: [Box, Box];
  /** Level 3's two objects, side by side (landscape) or stacked (portrait), over the whole board. */
  pair: [Box, Box];
  /** The three tool pads; level 3's comparison pads and level 4's grams pads sit on the same three places. */
  tools: Pt[];
  /** Level 3's two unit tokens, big then little. */
  units: [Pt, Pt];
  answers: [Pt, Pt];
  answerSize: { w: number; h: number };
  help: Pt;
  replay: Pt;
  /** Send, and level 4's Check. */
  send: Pt;
}

/** A tool, unit, comparison or grams pad. */
export const TOOL_PAD = { w: 140, h: 110 };
/** Help, Replay, Send and Check are round buttons this wide. */
export const BUTTON = 100;
/** Held upright, the board is no taller than this times its width: a counter, not a column up a tall phone. */
export const BOARD_TALL: Record<Mode, number> = { tool: 0.9, rows: 1.25, common: 1.25, table: 1.25 };

/** Upright: the bottom row's centre above the bottom edge, and the gaps between the rows of controls and under the board. */
const ROW_UP = 94,
  ROW_GAP = 26,
  ANSWER_GAP = 14,
  BOARD_GAP = 20,
  BOARD_TOP = 40;

export function postLayout(v: { w: number; h: number; upright?: true }, mode: Mode): Layout {
  if (v.w >= v.h) {
    const ox = (v.w - 1024) / 2,
      oy = (v.h - 768) / 2;
    const P = (x: number, y: number): Pt => ({ x: ox + x, y: oy + y });
    const board = { x: ox + 180, y: oy + 150, w: 780, h: 330 };
    const strip = { x: board.x, y: board.y, w: board.w, h: 90 };
    const slotY = strip.y + strip.h,
      slotH = board.y + board.h - slotY;
    return {
      landscape: true,
      board,
      strip,
      slots: [
        { x: board.x, y: slotY, w: board.w / 2, h: slotH },
        { x: board.x + board.w / 2, y: slotY, w: board.w / 2, h: slotH },
      ],
      pair: [
        { ...board, w: board.w / 2 },
        { ...board, x: board.x + board.w / 2, w: board.w / 2 },
      ],
      tools: [P(340, 555), P(520, 555), P(700, 555)],
      units: [P(430, 555), P(610, 555)],
      answers: [P(375, 555), P(765, 555)],
      answerSize: { w: 320, h: 110 },
      help: P(340, 700),
      replay: P(550, 700),
      send: P(800, 700),
    };
  }
  const sx = v.w / 768,
    sy = v.h / 1024;
  const P = (x: number, y: number): Pt => ({ x: x * sx, y: y * sy });
  const answerSize = { w: 540, h: 110 };
  if (v.upright) {
    // Up from the bottom edge: the round buttons, the pads, then (level 2) the second answer row; the board on top of them.
    const rowY = v.h - ROW_UP;
    const padY = rowY - BUTTON / 2 - ROW_GAP - TOOL_PAD.h / 2;
    const upperY = padY - answerSize.h - ANSWER_GAP;
    const controlsTop = (mode === 'rows' ? upperY : padY) - TOOL_PAD.h / 2;
    const x = 130 * sx,
      w = 618 * sx;
    const bottom = controlsTop - BOARD_GAP;
    const top = Math.max(BOARD_TOP, bottom - BOARD_TALL[mode] * w);
    const mid = x + w / 2;
    return {
      landscape: false,
      ...boardParts({ x, y: top, w, h: bottom - top }, 100),
      tools: [-180, 0, 180].map((dx) => ({ x: mid + dx, y: padY })),
      units: [
        { x: mid - 90, y: padY },
        { x: mid + 90, y: padY },
      ],
      answers: [
        { x: mid, y: upperY },
        { x: mid, y: padY },
      ],
      answerSize,
      help: { x: mid - 180, y: rowY },
      replay: { x: mid, y: rowY },
      send: { x: mid + 180, y: rowY },
    };
  }
  return {
    landscape: false,
    ...boardParts({ x: 170 * sx, y: 150 * sy, w: 560 * sx, h: 460 * sy }, 100 * sy),
    tools: [P(260, 700), P(440, 700), P(620, 700)],
    units: [P(350, 700), P(530, 700)],
    answers: [P(450, 672), P(450, 800)],
    answerSize,
    help: P(260, 930),
    replay: P(440, 930),
    send: P(620, 930),
  };
}

/** A portrait board's parts: the strip across its top with the two slots stacked under it, and the pair stacked over it all. */
function boardParts(board: Box, stripH: number): Pick<Layout, 'board' | 'strip' | 'slots' | 'pair'> {
  const strip = { x: board.x, y: board.y, w: board.w, h: stripH };
  const slotY = strip.y + strip.h,
    slotH = (board.y + board.h - slotY) / 2;
  return {
    board,
    strip,
    slots: [
      { x: board.x, y: slotY, w: board.w, h: slotH },
      { x: board.x, y: slotY + slotH, w: board.w, h: slotH },
    ],
    pair: [
      { ...board, h: board.h / 2 },
      { ...board, y: board.y + board.h / 2, h: board.h / 2 },
    ],
  };
}
