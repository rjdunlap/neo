import type { BandLevels } from '../../progress/difficulty';
import { spread } from '../../engine/view';
export interface PuzzlePlan {
  cols: number;
  rows: number;
  /** A faint copy of the picture inside the frame to match against. */
  ghost: boolean;
  /** Pieces already in place when the round starts. */
  preplaced: number;
  /**
   * Level 8, lap's first: one big piece out beside the frame at a time; a touch anywhere (the piece, the frame, the
   * background) hops it into its own place, and the next piece comes out because she touched. Nothing can be a miss.
   */
  oneAtATime?: boolean;
  name: string;
}

export const PUZZLE_PLANS: PuzzlePlan[] = [
  { cols: 2, rows: 1, ghost: true, preplaced: 1, name: 'Finish a picture: one half is already in place' },
  { cols: 2, rows: 1, ghost: true, preplaced: 0, name: 'Put two halves together over a faint picture' },
  { cols: 3, rows: 1, ghost: true, preplaced: 0, name: 'Three strips over a faint picture' },
  { cols: 2, rows: 2, ghost: true, preplaced: 0, name: 'Four pieces over a faint picture' },
  { cols: 3, rows: 2, ghost: false, preplaced: 0, name: 'Six pieces with only an empty frame' },
  { cols: 3, rows: 3, ghost: false, preplaced: 0, name: 'Nine pieces with only an empty frame' },
  { cols: 4, rows: 3, ghost: false, preplaced: 0, name: 'Twelve pieces with only an empty frame' },
  {
    cols: 3,
    rows: 1,
    ghost: true,
    preplaced: 0,
    oneAtATime: true,
    name: 'One big piece at a time: a touch anywhere hops it into a two- or three-piece picture',
  },
];

/** How many strips the one-at-a-time picture is cut into; each round picks one. */
export const ONE_AT_A_TIME_PIECES = [2, 3] as const;

/** The round's plan: the level's own, with the one-at-a-time picture cut into two or three strips by the seeded RNG. */
export function dealPlan(level: number, rng: { pick<T>(items: readonly T[]): T }): PuzzlePlan {
  const plan = puzzlePlan(level);
  return plan.oneAtATime ? { ...plan, cols: rng.pick(ONE_AT_A_TIME_PIECES) } : plan;
}

export const puzzlePlan = (level: number) =>
  PUZZLE_PLANS[Math.max(0, Math.min(PUZZLE_PLANS.length - 1, level - 1))];

/** The picture is drawn at this size, then cut into a grid. */
export const PICTURE_W = 600;
export const PICTURE_H = 420;

export interface Piece {
  col: number;
  row: number;
}

export function piecesFor(plan: PuzzlePlan): Piece[] {
  const out: Piece[] = [];
  for (let row = 0; row < plan.rows; row++) for (let col = 0; col < plan.cols; col++) out.push({ col, row });
  return out;
}

/** The middle of a piece's place, in picture units. */
export function slotCenter(plan: PuzzlePlan, p: Piece) {
  return { x: (PICTURE_W / plan.cols) * (p.col + 0.5), y: (PICTURE_H / plan.rows) * (p.row + 0.5) };
}

/**
 * Which empty place a drop lands in, in picture units, or null when it is off the board.
 * Small boards (few pieces) are more forgiving: anywhere over the frame counts.
 */
export function dropSlot(plan: PuzzlePlan, x: number, y: number, empty: Piece[]): Piece | null {
  const pw = PICTURE_W / plan.cols;
  const ph = PICTURE_H / plan.rows;
  const margin = 40;
  const overFrame = x > -margin && x < PICTURE_W + margin && y > -margin && y < PICTURE_H + margin;
  const reach = plan.cols * plan.rows <= 2 ? (overFrame ? Infinity : 0) : Math.min(pw, ph) * 0.6;
  let best: Piece | null = null;
  let d = Infinity;
  for (const p of empty) {
    const c = slotCenter(plan, p);
    const dd = Math.hypot(x - c.x, y - c.y);
    if (dd < d) [best, d] = [p, dd];
  }
  return d <= reach ? best : null;
}

/** Tray rows: one row of big pieces for small puzzles, two rows of smaller ones otherwise. */
export const trayRows = (count: number) => (count <= 4 ? 1 : 2);

export function outerSides(plan: PuzzlePlan, p: Piece) {
  return {
    top: p.row === 0,
    bottom: p.row === plan.rows - 1,
    left: p.col === 0,
    right: p.col === plan.cols - 1,
  };
}

/** Corners first; then build out from a placed piece, preferring the frame's edge. */
export function hintPiece(plan: PuzzlePlan, placed: readonly Piece[]): Piece | undefined {
  const waiting = piecesFor(plan).filter((p) => !placed.some((q) => q.col === p.col && q.row === p.row));
  const rank = (p: Piece) => {
    const sides = outerSides(plan, p);
    if ((sides.top || sides.bottom) && (sides.left || sides.right)) return 0;
    const beside = placed.some((q) => Math.abs(q.col - p.col) + Math.abs(q.row - p.row) === 1);
    if (beside && Object.values(sides).some(Boolean)) return 1;
    return beside ? 2 : 3;
  };
  return waiting.sort((a, b) => rank(a) - rank(b))[0];
}

/** A position that is true even for the single-row halves and strips. */
export function whereWords(plan: PuzzlePlan, p: Piece) {
  const sides = outerSides(plan, p);
  if (plan.rows === 1) return sides.left ? 'left' : sides.right ? 'right' : 'middle';
  if (sides.top) return sides.left ? 'top-left' : sides.right ? 'top-right' : 'top';
  if (sides.bottom) return sides.left ? 'bottom-left' : sides.right ? 'bottom-right' : 'bottom';
  return sides.left ? 'left' : sides.right ? 'right' : 'middle';
}

/**
 * What a capable child does next: carry the first piece still in the tray to its own place. The ghost finger follows
 * this, so a test can check that letting each piece go on the middle of its place finds that place and no other.
 */
/**
 * Lap: on the one- and two-piece pictures a piece that is tapped (picked up and let go without moving) hops into its
 * own place, so a finger that only taps can finish. Bigger puzzles keep the carry, which is their point.
 */
export const tapHops = (plan: Pick<PuzzlePlan, 'cols' | 'rows'>): boolean => plan.cols * plan.rows <= 2;
/** How far a piece may have moved from its tray spot and still count as a tap rather than a carry. */
export const TAP_HOP = 30;

export function nextToPlace<P extends { placed: boolean }>(pieces: readonly P[]): P | undefined {
  return pieces.find((p) => !p.placed);
}

/** Level 8 is lap's first; 1 and 2 follow. Nothing is renumbered: 8 is new at the end of the ladder. */
export const LEVELS: BandLevels = {
  lap: { min: 1, max: 8, order: [8, 1, 2] },
  toddler: { min: 2, max: 4 },
  preschool: { min: 4, max: 6 },
  prek: { min: 5, max: 7 },
  school: { min: 6, max: 7 },
};

// Layout ---------------------------------------------------------------------------------------------------------------

export interface PuzzleLayout {
  /** The frame's picture area: its top-left corner and width (its height follows the picture's shape). */
  board: { x: number; y: number; w: number };
  /** Board units per picture unit, and the smaller scale of a piece waiting in the tray. */
  scale: number;
  trayScale: number;
  /** Where each waiting piece rests (its centre), in tray order. */
  homes: { x: number; y: number }[];
  /** The tray's cream panel. */
  panel: { x: number; y: number; w: number; h: number };
}

/** Upright, the frame starts below the corner buttons, which it is wide enough to reach. */
export const UPRIGHT_TOP = 236;

/**
 * The frame and the tray for `total` pieces of which `waiting` are still out. Sideways: the frame above a tray of one or
 * two rows, right of the pet. Upright (a phone): the frame across the width under the corner buttons and the tray filling
 * the height below it, its pieces in as many rows as keeps them biggest, so a six-, nine- or twelve-piece puzzle's pieces
 * stay over 100 units on a 768-wide area. The tray keeps right of the pet's corner in both.
 */
export function puzzleLayout(
  v: { w: number; h: number },
  plan: Pick<PuzzlePlan, 'cols' | 'rows'>,
  total: number,
  waiting: number,
): PuzzleLayout {
  const pw = PICTURE_W / plan.cols;
  const ph = PICTURE_H / plan.rows;
  const aspect = PICTURE_H / PICTURE_W;
  if (v.h > v.w) {
    const gap = 16;
    const left = 170,
      right = v.w - 30;
    const boardW = Math.min(640, v.w - 80, (v.h - UPRIGHT_TOP - 60 - 400) / aspect);
    const scale = boardW / PICTURE_W;
    const y0 = UPRIGHT_TOP + boardW * aspect + 60;
    const H = v.h - 30 - y0;
    // As many rows as the whole puzzle needs, so the pieces left do not jump about as the tray empties.
    let best = { s: 0, perRow: total };
    for (let perRow = total; perRow >= 1; perRow--) {
      const rows = Math.ceil(total / perRow);
      const s = Math.min(scale, ((right - left) / perRow - gap) / pw, (H / rows - gap) / ph);
      if (s > best.s + 1e-9) best = { s, perRow };
    }
    const { s, perRow } = best;
    const rows = Math.ceil(total / perRow);
    const stepY = ph * s + gap;
    const blockTop = y0 + (H - rows * stepY) / 2;
    const homes = Array.from({ length: waiting }, (_, i) => {
      const row = Math.floor(i / perRow);
      const inRow = Math.min(perRow, waiting - row * perRow);
      return {
        x: spread(inRow, left, right, pw * s + gap + 24)[i % perRow],
        y: blockTop + stepY * (row + 0.5),
      };
    });
    return {
      board: { x: (v.w - boardW) / 2, y: UPRIGHT_TOP, w: boardW },
      scale,
      trayScale: s,
      homes,
      panel: { x: left - 10, y: y0 - 10, w: right - left + 20, h: H + 20 },
    };
  }
  const rows = trayRows(total);
  const trayH = rows === 1 ? 210 : 240;
  const top = 112;
  const boardW = Math.min(640, v.w - 300, ((v.h - top - trayH - 24) * PICTURE_W) / PICTURE_H);
  const scale = boardW / PICTURE_W;
  // Waiting pieces shrink to fit the tray; lifted and placed ones are full size.
  const maxH = rows === 1 ? 170 : 100;
  const maxW = rows === 1 ? 240 : 130;
  const perRow = Math.ceil(waiting / rows);
  const homes = Array.from({ length: waiting }, (_, i) => {
    const row = Math.floor(i / perRow);
    const inRow = Math.min(perRow, waiting - row * perRow);
    return {
      x: spread(inRow, 180, v.w - 40, rows === 1 ? 270 : 145)[i % perRow],
      y: rows === 1 ? v.h - trayH / 2 - 10 : v.h - trayH + 60 + row * 112,
    };
  });
  return {
    board: { x: v.w / 2 + 50 - boardW / 2, y: top, w: boardW },
    scale,
    trayScale: Math.min(scale, maxH / ph, maxW / pw),
    homes,
    panel: { x: 160, y: v.h - trayH - 6, w: v.w - 185, h: trayH - 8 },
  };
}

/** One at a time (level 8): the frame, and where the one big waiting piece sits (right of it sideways, under it upright). */
export function oneAtATimeLayout(v: { w: number; h: number }, cols: number) {
  const sideways = v.w >= v.h;
  const top = sideways ? 112 : UPRIGHT_TOP;
  const left = 180;
  const gap = 40;
  const aspect = PICTURE_H / PICTURE_W;
  const across = 1 + 1 / cols;
  const boardW = sideways
    ? Math.min(640, (v.w - left - 40 - gap) / across, (v.h - top - 40) / aspect)
    : Math.min(640, v.w - 80, (v.h - top - 40 - gap) / (2 * aspect));
  const x = sideways ? left + (v.w - left - 40 - boardW * across - gap) / 2 : (v.w - boardW) / 2;
  const y = sideways ? Math.max(top, (v.h - boardW * aspect) / 2) : top;
  const bh = boardW * aspect;
  const home = sideways
    ? { x: x + boardW + gap + boardW / cols / 2, y: y + bh / 2 }
    : { x: x + boardW / 2, y: y + bh + gap + bh / 2 };
  return { board: { x, y, w: boardW }, scale: boardW / PICTURE_W, home };
}
