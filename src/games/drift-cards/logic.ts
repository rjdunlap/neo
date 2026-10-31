import type { Rng } from '../../engine/random';
import type { View } from '../../engine/view';
import type { BandLevels } from '../../progress/difficulty';

/**
 * Drift Cards (docs/definitions/drift-cards.md): a pretend sea painted with current arrows carries a numbered wooden card,
 * cell by cell, to a beach where a friend finds it. Level 1 predicts the beach; level 2 chooses the boat that reaches a friend.
 * Levels 1–2 are built (batch drift-cards 1); level 3, the fogged patch, is batch drift-cards 2.
 */

/** East, south, west. No current points north, toward the harbour wall. */
export type Dir = 'e' | 's' | 'w';
/** Beaches round the sea; level 1 has one south beach, level 2 splits it into south-west and south-east. */
export type Beach = 'W' | 'S' | 'SW' | 'SE' | 'E';
export type Mode = 'predict' | 'send';

export interface Cell {
  r: number;
  c: number;
}

export interface Sea {
  cols: number;
  rows: number;
  /** `cells[r][c]`, row 0 under the harbour wall. */
  cells: Dir[][];
  /** The bottom beach is split at the middle column into south-west and south-east. */
  split: boolean;
}

export interface Plan {
  level: number;
  mode: Mode;
  name: string;
  cols: number;
  rows: number;
  /** The columns the boats sit over, left to right. */
  boats: readonly number[];
  split: boolean;
}

export const PLANS: readonly Plan[] = [
  { level: 1, mode: 'predict', name: 'Where will it wash up? Tap the beach each card reaches', cols: 5, rows: 4, boats: [0, 2, 4], split: false },
  { level: 2, mode: 'send', name: 'Send it to a friend: pick the boat whose card reaches them', cols: 6, rows: 4, boats: [1, 3, 5], split: true },
];

export const dcPlan = (level: number): Plan => PLANS[Math.max(1, Math.min(PLANS.length, Math.round(level))) - 1];

/** Batch drift-cards 1: school 1–2. Level 3 joins with batch drift-cards 2. */
export const BAND_LEVELS: BandLevels = {
  school: { min: 1, max: 2 },
};

/** The longest drift any cell may have, in cells (about 3.5 s at the drift's pace). */
export const MAX_PATH = 10;
export const CARDS = 3;
export const REQUESTS = 3;

export const beachesFor = (split: boolean): readonly Beach[] => (split ? ['W', 'SW', 'SE', 'E'] : ['W', 'S', 'E']);
/** Order round the coast, west to east along the bottom. */
export const COAST: Record<Beach, number> = { W: 0, S: 1, SW: 1, SE: 2, E: 3 };

// The sea ---------------------------------------------------------------------------------------

const ARROW: Record<string, Dir> = { '→': 'e', '↓': 's', '←': 'w' };

/** Arrows written row by row, top first (→ east, ↓ south, ← west), as in the definition. */
export function parseSea(rows: readonly string[], split: boolean): Sea {
  const cells = rows.map((row) => row.split(/\s+/).filter(Boolean).map((a) => {
    const d = ARROW[a];
    if (!d) throw new Error(`not an arrow: ${a}`);
    return d;
  }));
  return { cols: cells[0].length, rows: cells.length, cells, split };
}

export const AUTHORED_1 = parseSea(['↓ ↓ ↓ ↓ ←', '→ ↓ ↓ → →', '↓ ↓ → → ↓', '← ← ← ← ↓'], false);
export const AUTHORED_2 = parseSea(['← ↓ ← ← ↓ ↓', '↓ ↓ → → ↓ ↓', '↓ → ↓ ← ← →', '↓ ↓ ← ↓ ← →'], true);
/** The authored first request: the frog on the south-west beach. */
export const AUTHORED_2_ASK: Beach = 'SW';

export interface Drift {
  path: Cell[];
  beach: Beach;
}

const bottomBeach = (sea: Sea, c: number): Beach => (sea.split ? (c < sea.cols / 2 ? 'SW' : 'SE') : 'S');

/** The card follows the currents from `start` until a step leaves the sea; the side it leaves by names the beach. */
export function driftFrom(sea: Sea, start: Cell): Drift {
  const path: Cell[] = [];
  let { r, c } = start;
  for (let guard = 0; guard < sea.cols * sea.rows + 1; guard++) {
    path.push({ r, c });
    const d = sea.cells[r][c];
    if (d === 'e') {
      if (c + 1 >= sea.cols) return { path, beach: 'E' };
      c++;
    } else if (d === 'w') {
      if (c - 1 < 0) return { path, beach: 'W' };
      c--;
    } else {
      if (r + 1 >= sea.rows) return { path, beach: bottomBeach(sea, c) };
      r++;
    }
  }
  throw new Error('a drift that never ends');
}

/** A card dropped from the boat over `col` enters row 0 of that column. */
export const drift = (sea: Sea, col: number): Drift => driftFrom(sea, { r: 0, c: col });

/** Level 1: a prediction is right when the card really washes up there. */
export const predict = (sea: Sea, col: number, beach: Beach) => drift(sea, col).beach === beach;

/** Level 2: the boats whose card reaches `beach`. Any of them is right. */
export const boatsFor = (sea: Sea, boats: readonly number[], beach: Beach) => boats.filter((b) => drift(sea, b).beach === beach);

/** The free trace and the hint: the current at a cell and the cell it leads to (null when it leaves the sea). */
export function nextStep(sea: Sea, cell: Cell): { dir: Dir; next: Cell | null } {
  const dir = sea.cells[cell.r][cell.c];
  const next = dir === 'e' ? { r: cell.r, c: cell.c + 1 } : dir === 'w' ? { r: cell.r, c: cell.c - 1 } : { r: cell.r + 1, c: cell.c };
  const inside = next.r < sea.rows && next.c >= 0 && next.c < sea.cols;
  return { dir, next: inside ? next : null };
}

/** The free trace: `ahead` cells along the current from `cell`, the cell itself first. */
export function traceAhead(sea: Sea, cell: Cell, ahead = 2): Cell[] {
  const out: Cell[] = [cell];
  let at: Cell | null = cell;
  for (let i = 0; i < ahead && at; i++) {
    at = nextStep(sea, at).next;
    if (at) out.push(at);
  }
  return out;
}

/** The sideways (east or west) steps in a drift. */
export const sideways = (sea: Sea, d: Drift) => d.path.filter((p) => sea.cells[p.r][p.c] !== 's').length;

/** No neighbours face each other (east just left of west), and every cell reaches a beach within `MAX_PATH` cells. */
export function validSea(sea: Sea): boolean {
  for (let r = 0; r < sea.rows; r++) {
    for (let c = 0; c + 1 < sea.cols; c++) if (sea.cells[r][c] === 'e' && sea.cells[r][c + 1] === 'w') return false;
  }
  for (let r = 0; r < sea.rows; r++) for (let c = 0; c < sea.cols; c++) if (driftFrom(sea, { r, c }).path.length > MAX_PATH) return false;
  return true;
}

/** A seeded sea: filled left to right so no east current sits just left of a west one. */
export function randomSea(rng: Rng, cols: number, rows: number, split: boolean): Sea {
  const cells: Dir[][] = [];
  for (let r = 0; r < rows; r++) {
    const row: Dir[] = [];
    for (let c = 0; c < cols; c++) {
      const left = row[c - 1];
      const roll = rng.next();
      let d: Dir = roll < 0.4 ? 's' : roll < 0.7 ? 'e' : 'w';
      if (left === 'e' && d === 'w') d = rng.chance(0.5) ? 'e' : 's';
      row.push(d);
    }
    cells.push(row);
  }
  return { cols, rows, cells, split };
}

const TRIES = 2000;

/** Level 1's seeded sea: the three landings cover two beaches or more, every drift has three cells or more, and one has two sideways steps. */
export function predictSea(rng: Rng, plan: Plan = PLANS[0]): Sea {
  for (let i = 0; i < TRIES; i++) {
    const sea = randomSea(rng, plan.cols, plan.rows, plan.split);
    if (!validSea(sea)) continue;
    const drifts = plan.boats.map((b) => drift(sea, b));
    if (new Set(drifts.map((d) => d.beach)).size < 2) continue;
    if (drifts.some((d) => d.path.length < 3)) continue;
    if (!drifts.some((d) => sideways(sea, d) >= 2)) continue;
    return sea;
  }
  return AUTHORED_1;
}

export interface Request {
  sea: Sea;
  /** The friend asking, by beach. */
  ask: Beach;
}

/** A seeded request: the asked friend is reached by at least one boat and missed by at least one (two right boats when `two`). */
export function sendRequest(rng: Rng, plan: Plan = PLANS[1], two = false, avoid?: Beach): Request {
  for (let i = 0; i < TRIES; i++) {
    const sea = randomSea(rng, plan.cols, plan.rows, plan.split);
    if (!validSea(sea)) continue;
    const reached = new Map<Beach, number>();
    for (const b of plan.boats) {
      const beach = drift(sea, b).beach;
      reached.set(beach, (reached.get(beach) ?? 0) + 1);
    }
    let asks = [...reached.entries()].filter(([, n]) => n < plan.boats.length && (!two || n >= 2)).map(([b]) => b);
    if (!asks.length) continue;
    if (asks.length > 1 && avoid) asks = asks.filter((b) => b !== avoid);
    return { sea, ask: rng.pick(asks) };
  }
  return { sea: AUTHORED_2, ask: AUTHORED_2_ASK };
}

/** Level 2's three requests, the authored one first when `authored`; at least one has two right boats. */
export function sendRound(rng: Rng, authored: boolean, plan: Plan = PLANS[1]): Request[] {
  const out: Request[] = authored ? [{ sea: AUTHORED_2, ask: AUTHORED_2_ASK }] : [];
  while (out.length < REQUESTS) out.push(sendRequest(rng, plan, false, out[out.length - 1]?.ask));
  if (!out.some((q) => boatsFor(q.sea, plan.boats, q.ask).length >= 2)) out[REQUESTS - 1] = sendRequest(rng, plan, true, out[REQUESTS - 2].ask);
  return out;
}

/** Level 1's sea for a round: the authored one first. */
export const predictRound = (rng: Rng, authored: boolean): Sea => (authored ? AUTHORED_1 : predictSea(rng));

// Accounting --------------------------------------------------------------------------------------

/**
 * One card (level 1) or one request (level 2). A free choice never counts; a counted wrong is one miss; the second miss
 * glows the answer, and that glow or an asked hint is one hint for the turn, never more.
 */
export class Turn {
  misses = 0;
  hinted = false;
  glow = false;
  done = false;

  /** Returns whether it counted. */
  choose(right: boolean, free = false): { counted: boolean; glow: boolean } {
    if (this.done) return { counted: false, glow: this.glow };
    if (right) {
      this.done = true;
      return { counted: false, glow: this.glow };
    }
    if (free) return { counted: false, glow: this.glow };
    this.misses++;
    if (this.misses >= 2 && !this.glow) {
      this.glow = true;
      this.hinted = true;
    }
    return { counted: true, glow: this.glow };
  }

  /** Show a hint: one hint for the turn, however often it is asked. */
  ask() {
    if (!this.done) this.hinted = true;
  }
}

export const tally = (turns: readonly Turn[]) => ({ misses: turns.reduce((n, t) => n + t.misses, 0), hints: turns.filter((t) => t.hinted).length });

// Speech helpers ------------------------------------------------------------------------------------

export const FRIEND: Record<Beach, string> = { W: 'the turtle', S: 'the frog', SW: 'the frog', SE: 'the duck', E: 'the penguin' };
export const BEACH_NAME: Record<Beach, string> = { W: 'west', S: 'south', SW: 'south-west', SE: 'south-east', E: 'east' };
export const DIR_WORD: Record<Dir, string> = { e: 'right', s: 'down', w: 'left' };

// Layout --------------------------------------------------------------------------------------

export interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

export const PET = { w: 230, h: 230 };
export const petCorner = (view: View): Box => ({ x: 0, y: view.h - PET.h, w: PET.w, h: PET.h });
export const CORNER = 120;
export const cornerButtons = (view: View): Box[] => [
  { x: 0, y: 0, w: CORNER, h: CORNER },
  { x: view.w - CORNER, y: 0, w: CORNER, h: CORNER },
];
export const overlaps = (a: Box, b: Box) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
const inside = (b: Box, v: View) => b.x >= 0 && b.y >= 0 && b.x + b.w <= v.w && b.y + b.h <= v.h;

export const MIN_CELL = 72;
export const MAX_CELL = 110;
export const BOAT = 110;
export const BEACH = 110;
export const WALL = 18;

export interface DriftLayout {
  cell: number;
  /** The sea itself (the free-trace area). */
  grid: Box;
  wall: Box;
  boats: Box[];
  beaches: Partial<Record<Beach, Box>>;
}

export const cellCentre = (L: DriftLayout, cell: Cell) => ({ x: L.grid.x + (cell.c + 0.5) * L.cell, y: L.grid.y + (cell.r + 0.5) * L.cell });

/** The nearest cell to a point on the grid. */
export function cellAt(L: DriftLayout, plan: Plan, x: number, y: number): Cell {
  const c = Math.max(0, Math.min(plan.cols - 1, Math.floor((x - L.grid.x) / L.cell)));
  const r = Math.max(0, Math.min(plan.rows - 1, Math.floor((y - L.grid.y) / L.cell)));
  return { r, c };
}

/** Every target and the sea, largest cells first; null rather than shrink the cells below `MIN_CELL`. */
export function driftLayout(view: View, level: number): DriftLayout | null {
  const plan = dcPlan(level);
  for (let cell = MAX_CELL; cell >= MIN_CELL; cell -= 2) {
    const boardW = 2 * BEACH + plan.cols * cell;
    const stackH = BOAT + WALL + plan.rows * cell + BEACH;
    const y0 = Math.max(8, (view.h - stackH) / 2);
    for (const x0 of [(view.w - boardW) / 2, PET.w + 6]) {
      const L = layoutAt(plan, cell, x0, y0);
      if (layoutFits(L, view)) return L;
    }
  }
  return null;
}

function layoutAt(plan: Plan, cell: number, x0: number, y0: number): DriftLayout {
  const gx = x0 + BEACH;
  const gy = y0 + BOAT + WALL;
  const gw = plan.cols * cell;
  const gh = plan.rows * cell;
  const grid = { x: gx, y: gy, w: gw, h: gh };
  const boats = plan.boats.map((b) => ({ x: gx + (b + 0.5) * cell - BOAT / 2, y: y0, w: BOAT, h: BOAT }));
  const beaches: Partial<Record<Beach, Box>> = { W: { x: x0, y: gy, w: BEACH, h: gh }, E: { x: gx + gw, y: gy, w: BEACH, h: gh } };
  if (plan.split) {
    const half = Math.ceil(plan.cols / 2) * cell;
    beaches.SW = { x: gx, y: gy + gh, w: half, h: BEACH };
    beaches.SE = { x: gx + half, y: gy + gh, w: gw - half, h: BEACH };
  } else beaches.S = { x: gx, y: gy + gh, w: gw, h: BEACH };
  return { cell, grid, wall: { x: gx - 10, y: y0 + BOAT, w: gw + 20, h: WALL }, boats, beaches };
}

/** The touch targets: boats and beach plates (and the sea, which only traces). */
export const targetsOf = (L: DriftLayout): Box[] => [...L.boats, ...Object.values(L.beaches), L.grid];

function layoutFits(L: DriftLayout, view: View): boolean {
  const all = targetsOf(L);
  if (!all.every((b) => inside(b, view))) return false;
  const keepClear = [...cornerButtons(view), petCorner(view)];
  if (all.some((b) => keepClear.some((k) => overlaps(b, k)))) return false;
  for (let i = 0; i < all.length; i++) for (let j = i + 1; j < all.length; j++) if (overlaps(all[i], all[j])) return false;
  return true;
}
