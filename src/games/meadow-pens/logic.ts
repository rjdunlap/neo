import type { Rng } from '../../engine/random';
import type { View } from '../../engine/view';

/**
 * Meadow Pens: a friend at the gate asks for a pen, she paints squares of grass on a meadow grid, and the
 * fence builds itself around whatever she paints, one piece per grass edge. Area is a count of squares and
 * perimeter a count of edges, two different counts of one shape; no level shows a formula or a unit name.
 * Level 1 asks for a number of squares (any connected shape), level 2 counts a fenced field by its rows,
 * level 3 asks for six squares whose fence uses exactly the stack (10, 12 or 14). See
 * docs/definitions/meadow-pens.md.
 */

/** The model grid: 6 columns by 4 rows. Portrait draws it transposed, which keeps every count. */
export const COLS = 6;
export const ROWS = 4;
export const CELLS = COLS * ROWS;

/** A cell is `y * COLS + x` in the model grid. */
export type Cell = number;
export const cellOf = (x: number, y: number): Cell => y * COLS + x;
export const xOf = (c: Cell) => c % COLS;
export const yOf = (c: Cell) => Math.floor(c / COLS);
export const inGrid = (x: number, y: number) => x >= 0 && x < COLS && y >= 0 && y < ROWS;

const STEPS = [[1, 0], [-1, 0], [0, 1], [0, -1]] as const;

/** The side neighbours of a cell inside the grid, in a fixed order. */
export function neighbours(c: Cell): Cell[] {
  const out: Cell[] = [];
  for (const [dx, dy] of STEPS) {
    const x = xOf(c) + dx;
    const y = yOf(c) + dy;
    if (inGrid(x, y)) out.push(cellOf(x, y));
  }
  return out;
}

/** The side-connected groups of a set of cells. */
export function groups(cells: Iterable<Cell>): Cell[][] {
  const left = new Set(cells);
  const out: Cell[][] = [];
  for (const start of [...left]) {
    if (!left.has(start)) continue;
    const group: Cell[] = [];
    const queue = [start];
    left.delete(start);
    while (queue.length) {
      const c = queue.shift()!;
      group.push(c);
      for (const n of neighbours(c)) if (left.delete(n)) queue.push(n);
    }
    out.push(group);
  }
  return out;
}

export const connected = (cells: readonly Cell[]) => cells.length > 0 && groups(cells).length === 1;

/**
 * The pen: the largest side-connected group of painted cells; on a tie, the group holding the earliest-painted
 * cell still painted. `painted` is in paint order. Every other painted cell is a flower.
 */
export function penOf(painted: readonly Cell[]): Set<Cell> {
  if (!painted.length) return new Set();
  const order = new Map(painted.map((c, i) => [c, i]));
  let best: Cell[] = [];
  let bestFirst = Infinity;
  for (const g of groups(painted)) {
    const first = Math.min(...g.map((c) => order.get(c)!));
    if (g.length > best.length || (g.length === best.length && first < bestFirst)) {
      best = g;
      bestFirst = first;
    }
  }
  return new Set(best);
}

export const flowersOf = (painted: readonly Cell[], pen: ReadonlySet<Cell>) => painted.filter((c) => !pen.has(c));

/** One fence piece: the edge of pen cell `cell` on side `side` (its neighbour there is not in the pen). */
export interface Edge { cell: Cell; side: 'right' | 'left' | 'down' | 'up' }
const SIDES = ['right', 'left', 'down', 'up'] as const;

/** Every fence piece around a pen, in a fixed order (cells ascending, then right, left, down, up). */
export function fenceEdges(pen: ReadonlySet<Cell>): Edge[] {
  const out: Edge[] = [];
  for (const c of [...pen].sort((a, b) => a - b)) {
    STEPS.forEach(([dx, dy], i) => {
      const x = xOf(c) + dx;
      const y = yOf(c) + dy;
      if (!inGrid(x, y) || !pen.has(cellOf(x, y))) out.push({ cell: c, side: SIDES[i] });
    });
  }
  return out;
}

export const fenceCount = (pen: ReadonlySet<Cell>) => fenceEdges(pen).length;

/** Shared side edges inside a set of cells. */
export function sharedEdges(cells: ReadonlySet<Cell>): number {
  let n = 0;
  for (const c of cells) {
    if (xOf(c) + 1 < COLS && cells.has(c + 1)) n++;
    if (yOf(c) + 1 < ROWS && cells.has(c + COLS)) n++;
  }
  return n;
}

/** Unpainted cells the pen closes in (no path to the meadow's border through non-pen cells): drawn as ponds. */
export function holes(pen: ReadonlySet<Cell>): Cell[] {
  const outside = new Set<Cell>();
  const queue: Cell[] = [];
  for (let c = 0; c < CELLS; c++) {
    const edge = xOf(c) === 0 || yOf(c) === 0 || xOf(c) === COLS - 1 || yOf(c) === ROWS - 1;
    if (edge && !pen.has(c)) { outside.add(c); queue.push(c); }
  }
  while (queue.length) {
    const c = queue.shift()!;
    for (const n of neighbours(c)) if (!pen.has(n) && !outside.has(n)) { outside.add(n); queue.push(n); }
  }
  const out: Cell[] = [];
  for (let c = 0; c < CELLS; c++) if (!pen.has(c) && !outside.has(c)) out.push(c);
  return out;
}

/** Swap the model's x and y: what portrait draws. Only meaningful for tests (the grid itself is 6 by 4). */
export const transpose = (c: Cell, cols = COLS): { x: number; y: number } => ({ x: Math.floor(c / cols), y: c % cols });

// ----- requests and checking -----

export interface Request {
  /** Squares of grass asked for (levels 1 and 3). */
  squares: number;
  /** Level 3: the fence pieces on the counted stack, all to be used. */
  fence?: number;
}

export type Verdict =
  | { kind: 'ok' }
  | { kind: 'empty' }
  | { kind: 'squares'; have: number; want: number }
  | { kind: 'fence'; have: number; want: number };

/** The first failing reason, or ok. Flowers never matter: only the pen is checked. */
export function check(pen: ReadonlySet<Cell>, request: Request): Verdict {
  if (!pen.size) return { kind: 'empty' };
  if (pen.size !== request.squares) return { kind: 'squares', have: pen.size, want: request.squares };
  if (request.fence !== undefined) {
    const have = fenceCount(pen);
    if (have !== request.fence) return { kind: 'fence', have, want: request.fence };
  }
  return { kind: 'ok' };
}

export const cellsOfMask = (m: number): Cell[] => { const out: Cell[] = []; for (let c = 0; c < CELLS; c++) if (m & (1 << c)) out.push(c); return out; };

const setsCache = new Map<number, number[]>();
/** Every side-connected set of `n` cells in the grid, as bit masks in ascending order. */
export function connectedSets(n: number): number[] {
  const hit = setsCache.get(n);
  if (hit) return hit;
  let level = new Set<number>(Array.from({ length: CELLS }, (_, c) => 1 << c));
  for (let k = 1; k < n; k++) {
    const next = new Set<number>();
    for (const m of level) for (const c of cellsOfMask(m)) for (const nb of neighbours(c)) if (!(m & (1 << nb))) next.add(m | (1 << nb));
    level = next;
  }
  const out = [...level].sort((a, b) => a - b);
  setsCache.set(n, out);
  return out;
}

const overlap = (m: number, pen: ReadonlySet<Cell>) => { let n = 0; for (const c of pen) if (m & (1 << c)) n++; return n; };

/** A cell of a connected set whose removal leaves it connected (the highest such cell). */
function nonCut(cells: Cell[]): Cell {
  for (const c of [...cells].sort((a, b) => b - a)) if (connected(cells.filter((d) => d !== c))) return c;
  return cells[cells.length - 1];
}

/**
 * The pen the hint glows: a passing pen inside the grid that keeps as many of her pen's cells as possible.
 * Squares only: grow by the first side neighbour, or lift a non-cut cell, until the size matches. With a
 * fence count: the best-overlap set among every connected set of that size with that fence (first in order on a tie).
 */
export function targetFor(pen: ReadonlySet<Cell>, request: Request): Set<Cell> {
  if (request.fence !== undefined) {
    let best = 0;
    let bestOverlap = -1;
    for (const m of connectedSets(request.squares)) {
      const cells = new Set(cellsOfMask(m));
      if (fenceCount(cells) !== request.fence) continue;
      const o = overlap(m, pen);
      if (o > bestOverlap) { best = m; bestOverlap = o; }
    }
    return new Set(cellsOfMask(best));
  }
  let cells = [...pen];
  if (!cells.length) cells = [cellOf(2, 1)];
  while (cells.length > request.squares) cells = cells.filter((c) => c !== nonCut(cells));
  while (cells.length < request.squares) {
    const have = new Set(cells);
    const grow = cells.flatMap(neighbours).filter((c) => !have.has(c)).sort((a, b) => a - b)[0];
    cells.push(grow);
  }
  return new Set(cells);
}

/** The next single cell to tap toward a target: a missing cell (touching the target's painted part first), then a stray to lift. */
export function nextCell(painted: readonly Cell[], target: ReadonlySet<Cell>): Cell | null {
  const on = new Set(painted);
  const missing = [...target].filter((c) => !on.has(c)).sort((a, b) => a - b);
  if (missing.length) return missing.find((c) => neighbours(c).some((n) => on.has(n) && target.has(n))) ?? missing[0];
  const extra = painted.filter((c) => !target.has(c));
  return extra.length ? extra[extra.length - 1] : null;
}

// ----- level 2's fields and cards -----

/** A field as drawn in landscape: rows by columns, its right total, its fence count and the third card. */
export interface Field { rows: number; cols: number; right: number; fence: number; third: number; why: 'row-more' | 'row-less' | 'rows-plus-cols' }

/** The level-2 card table (docs/definitions/meadow-pens.md#level-2-card-table). 4 by 4 is left out: its fence equals its area. */
export const FIELDS: readonly Field[] = [
  { rows: 2, cols: 3, right: 6, fence: 10, third: 9, why: 'row-more' },
  { rows: 2, cols: 4, right: 8, fence: 12, third: 6, why: 'rows-plus-cols' },
  { rows: 2, cols: 5, right: 10, fence: 14, third: 15, why: 'row-more' },
  { rows: 3, cols: 3, right: 9, fence: 12, third: 6, why: 'row-less' },
  { rows: 3, cols: 4, right: 12, fence: 14, third: 16, why: 'row-more' },
  { rows: 3, cols: 5, right: 15, fence: 16, third: 10, why: 'row-less' },
  { rows: 4, cols: 5, right: 20, fence: 18, third: 15, why: 'row-less' },
];

/** The field's cells in the model grid, set in the middle of the meadow. */
export function fieldCells(f: Field): Cell[] {
  const x0 = Math.floor((COLS - f.cols) / 2);
  const y0 = Math.floor((ROWS - f.rows) / 2);
  const out: Cell[] = [];
  for (let y = 0; y < f.rows; y++) for (let x = 0; x < f.cols; x++) out.push(cellOf(x0 + x, y0 + y));
  return out;
}

/** The field's cells grouped in rows as drawn: model rows wide, model columns tall. */
export function drawnRows(f: Field, tall: boolean): Cell[][] {
  const cells = fieldCells(f);
  const key = (c: Cell) => (tall ? xOf(c) : yOf(c));
  const keys = [...new Set(cells.map(key))].sort((a, b) => a - b);
  return keys.map((k) => cells.filter((c) => key(c) === k).sort((a, b) => (tall ? yOf(a) - yOf(b) : xOf(a) - xOf(b))));
}

// ----- plans and rounds -----

export interface Plan { level: 1 | 2 | 3; name: string; count: number }

export const PLANS: readonly Plan[] = [
  { level: 1, name: 'Enough grass: paint a pen with as many squares as a friend asks (3 to 8), any shape', count: 3 },
  { level: 2, name: 'Rows of grass: count a fenced field by its rows and tap the card for the whole field', count: 5 },
  { level: 3, name: 'Same grass, new fence: six squares whose fence uses every piece on the stack (10, 12 or 14)', count: 3 },
];

export const planFor = (level: number): Plan => PLANS[Math.min(PLANS.length, Math.max(1, Math.round(level))) - 1];

export interface PenTask { kind: 'pen'; request: Request }
export interface FieldTask { kind: 'field'; field: Field; cards: number[] }
export type Task = PenTask | FieldTask;

/** A field's three cards in a seeded order. */
export const cardsFor = (f: Field, rng: Rng) => rng.shuffle([f.right, f.fence, f.third]);

/** A round's pens or fields: the first authored (4 squares; the 2 by 3 field; ten fence pieces), the rest seeded. */
export function makeTasks(plan: Plan, rng: Rng, count = plan.count): Task[] {
  if (plan.level === 2) {
    const rest = rng.shuffle(FIELDS.slice(1));
    return [FIELDS[0], ...rest].slice(0, count).map((field) => ({ kind: 'field', field, cards: cardsFor(field, rng) }));
  }
  if (plan.level === 3) {
    const fences = [10, ...rng.shuffle([12, 14])];
    return fences.slice(0, count).map((fence) => ({ kind: 'pen', request: { squares: 6, fence } }));
  }
  const sizes = [4, ...rng.shuffle([3, 5, 6, 7, 8])];
  return sizes.slice(0, count).map((squares) => ({ kind: 'pen', request: { squares } }));
}

// ----- accounting -----

/** Two misses on one pen or field light the help. */
export const GLOW_AFTER = 2;

/**
 * Misses and hints for a round. Only a failed ring with a pen (levels 1 and 3) or a wrong card (level 2) is a
 * miss; an empty ring, painting, lifting, flowers and replays count nothing. Each pen or field counts at most one hint.
 */
export class PenTally {
  misses = 0;
  hints = 0;
  /** Misses on this pen or field. */
  wrongs = 0;
  glowing = false;
  private hinted = false;

  next() {
    this.wrongs = 0;
    this.glowing = false;
    this.hinted = false;
  }

  /** A ring of the bell: returns what the scene should do. */
  ring(verdict: Verdict): 'invite' | 'ok' | 'miss' | 'glow' {
    if (verdict.kind === 'empty') return 'invite';
    if (verdict.kind === 'ok') return 'ok';
    return this.wrong();
  }

  /** A wrong card at level 2. */
  card(right: boolean): 'ok' | 'miss' | 'glow' {
    return right ? 'ok' : this.wrong();
  }

  private wrong(): 'miss' | 'glow' {
    this.misses++;
    this.wrongs++;
    if (this.wrongs >= GLOW_AFTER && !this.glowing) return this.glow() ? 'glow' : 'miss';
    return 'miss';
  }

  /** The pause sheet's Show a hint, or the second miss: the glow starts, counting a hint once per pen. Returns whether it newly counted. */
  glow(): boolean {
    this.glowing = true;
    if (this.hinted) return false;
    this.hinted = true;
    this.hints++;
    return true;
  }
}

// ----- the fence heap (levels 1 and 2) -----

/** The free heap: 20 pieces, topped up by ten from the cart whenever fewer than six would be left. */
export class FenceHeap {
  total = 20;
  /** Pieces left on the heap for a fence of `used`; tops up first when it would fall below six. Returns whether the cart came. */
  use(used: number): boolean {
    let came = false;
    while (this.total - used < 6) { this.total += 10; came = true; }
    return came;
  }
  left(used: number) { return Math.max(0, this.total - used); }
}

// ----- layout -----

export interface Rect { x: number; y: number; w: number; h: number }
export interface MeadowLayout {
  /** Portrait draws the model grid transposed (4 columns by 6 rows). */
  tall: boolean;
  grid: { x: number; y: number; cell: number; pitch: number; cols: number; rows: number };
  gate: Rect;
  friend: Rect;
  bubble: Rect;
  bell: Rect;
  /** Levels 1 and 3: the fence pieces' heap or counted stack. */
  stack: Rect | null;
  /** Level 2: the three cards. */
  cards: Rect[] | null;
  companion: { x: number; y: number };
}

export const CELL = 100;
export const GAP = 6;
export const PITCH = CELL + GAP;
/** The guide's corner, bottom-left, and the Home and help buttons, top-left. */
export const PET_CORNER = { w: 175, h: 185 };
export const HOME_CORNER = { w: 125, h: 225 };
const CARD = 130;
const CARD_GAP = 30;

/** Every rectangle of the screen for a view and level, or null if it cannot fit without shrinking a target. */
export function meadowLayout(view: View, level: number): MeadowLayout | null {
  const { w, h } = view;
  const tall = h > w && h >= 1150;
  const cols = tall ? ROWS : COLS;
  const rows = tall ? COLS : ROWS;
  const gw = cols * PITCH - GAP;
  const gh = rows * PITCH - GAP;
  const cardsRow = (x: number, y: number) => [0, 1, 2].map((i) => ({ x: x + i * (CARD + CARD_GAP), y, w: CARD, h: CARD }));
  let out: MeadowLayout;
  if (!tall) {
    const ox = Math.max(0, (w - 1024) / 2);
    const gx = ox + 180;
    const gy = 175;
    const col = gx + gw + 50;
    out = {
      tall,
      grid: { x: gx, y: gy, cell: CELL, pitch: PITCH, cols, rows },
      gate: { x: gx + gw, y: gy + gh / 2 - 70, w: 30, h: 140 },
      friend: { x: col, y: gy, w: 130, h: 140 },
      bubble: { x: gx + gw / 2 - 140, y: 18, w: 280, h: 124 },
      bell: { x: col + 5, y: gy + 172, w: 120, h: 120 },
      stack: level === 2 ? null : { x: gx + 40, y: gy + gh + 32, w: gw - 80, h: 130 },
      cards: level === 2 ? cardsRow(gx + gw / 2 - (3 * CARD + 2 * CARD_GAP) / 2, gy + gh + 32) : null,
      companion: { x: col + 65, y: gy + gh + 10 },
    };
  } else {
    const gx = w / 2 - gw / 2;
    const gy = 200;
    const rowY = Math.max(gy + gh + 60, h - 40 - 150);
    const cardsW = 3 * CARD + 2 * CARD_GAP;
    const left = Math.max(PET_CORNER.w + 30, w / 2 - (cardsW + 60 + 130 + 30 + 120) / 2);
    out = {
      tall,
      grid: { x: gx, y: gy, cell: CELL, pitch: PITCH, cols, rows },
      gate: { x: gx + gw / 2 - 70, y: gy + gh, w: 140, h: 30 },
      friend: { x: left + cardsW + 60, y: rowY, w: 130, h: 140 },
      bubble: { x: w / 2 - 140, y: 40, w: 280, h: 124 },
      bell: { x: left + cardsW + 60 + 130 + 30, y: rowY + 10, w: 120, h: 120 },
      stack: level === 2 ? null : { x: left, y: rowY + 5, w: cardsW, h: 130 },
      cards: level === 2 ? cardsRow(left, rowY + 5) : null,
      companion: { x: gx + gw + 90, y: gy + gh },
    };
  }
  return fits(out, view) ? out : null;
}

const gridRect = (l: MeadowLayout): Rect => ({ x: l.grid.x, y: l.grid.y, w: l.grid.cols * l.grid.pitch - GAP, h: l.grid.rows * l.grid.pitch - GAP });

/** The touch targets of a layout: grid, bubble, friend, bell and cards (the stack and gate take no touch). */
export function targets(l: MeadowLayout): Rect[] {
  return [gridRect(l), l.bubble, l.friend, l.bell, ...(l.cards ?? [])];
}

const apart = (a: Rect, b: Rect, d: number) => a.x + a.w + d <= b.x || b.x + b.w + d <= a.x || a.y + a.h + d <= b.y || b.y + b.h + d <= a.y;
const inside = (r: Rect, v: View) => r.x >= 0 && r.y >= 0 && r.x + r.w <= v.w && r.y + r.h <= v.h;

function fits(l: MeadowLayout, v: View): boolean {
  const all = [...targets(l), ...(l.stack ? [l.stack] : [])];
  const pet: Rect = { x: 0, y: v.h - PET_CORNER.h, w: PET_CORNER.w, h: PET_CORNER.h };
  const home: Rect = { x: 0, y: 0, w: HOME_CORNER.w, h: HOME_CORNER.h };
  for (const r of all) if (!inside(r, v) || !apart(r, pet, 0) || !apart(r, home, 0)) return false;
  for (let i = 0; i < all.length; i++) for (let j = i + 1; j < all.length; j++) if (!apart(all[i], all[j], 30)) return false;
  return true;
}

/** Where a model cell is drawn: its rectangle on screen. */
export function cellRect(l: MeadowLayout, c: Cell): Rect {
  const col = l.tall ? yOf(c) : xOf(c);
  const row = l.tall ? xOf(c) : yOf(c);
  return { x: l.grid.x + col * l.grid.pitch, y: l.grid.y + row * l.grid.pitch, w: l.grid.cell, h: l.grid.cell };
}

/** The model cell under a point on screen (the gap between cells belongs to the nearer cell), or null off the grid. */
export function cellAt(l: MeadowLayout, px: number, py: number): Cell | null {
  const col = Math.floor((px - l.grid.x + GAP / 2) / l.grid.pitch);
  const row = Math.floor((py - l.grid.y + GAP / 2) / l.grid.pitch);
  if (col < 0 || row < 0 || col >= l.grid.cols || row >= l.grid.rows) return null;
  return l.tall ? cellOf(row, col) : cellOf(col, row);
}

export const centre = (r: Rect) => ({ x: r.x + r.w / 2, y: r.y + r.h / 2 });
export const holds = (r: Rect, x: number, y: number, pad = 0) => x >= r.x - pad && x <= r.x + r.w + pad && y >= r.y - pad && y <= r.y + r.h + pad;
