export interface PuzzlePlan {
  cols: number;
  rows: number;
  /** A faint copy of the picture inside the frame to match against. */
  ghost: boolean;
  /** Pieces already in place when the round starts. */
  preplaced: number;
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
];

export const puzzlePlan = (level: number) => PUZZLE_PLANS[Math.max(0, Math.min(PUZZLE_PLANS.length - 1, level - 1))];

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

/**
 * What a capable child does next: carry the first piece still in the tray to its own place. The ghost finger follows
 * this, so a test can check that letting each piece go on the middle of its place finds that place and no other.
 */
export function nextToPlace<P extends { placed: boolean }>(pieces: readonly P[]): P | undefined {
  return pieces.find((p) => !p.placed);
}
