import type { Rng } from '../../engine/random';

/** A ramp sends the marble one column left or right when it reaches that row. */
export type Ramp = 'left' | 'right';

export interface Cell {
  row: number;
  col: number;
}

export interface FixedRamp extends Cell {
  ramp: Ramp;
}

export interface ChainPlan {
  name: string;
  cols: number;
  rows: number;
  fixed: number;
  loose: number;
  /** Extra sockets make placement a decision instead of a direct match. */
  decoys: number;
  /** Later machines have a little chime the marble must touch before the final bell. */
  chime: boolean;
  /** Accepted arrangements; the last level deliberately permits more than one design. */
  solutions: { min: number; max: number };
  machines: number;
}

export const PLANS: ChainPlan[] = [
  { name: 'Put one ramp in place so the marble rings the bell', cols: 4, rows: 2, fixed: 0, loose: 1, decoys: 2, chime: false, solutions: { min: 1, max: 1 }, machines: 2 },
  { name: 'Add one ramp to a machine that already has a ramp', cols: 4, rows: 3, fixed: 1, loose: 1, decoys: 3, chime: false, solutions: { min: 1, max: 1 }, machines: 2 },
  { name: 'Place two ramps so the marble reaches the bell', cols: 5, rows: 4, fixed: 1, loose: 2, decoys: 3, chime: false, solutions: { min: 1, max: 2 }, machines: 2 },
  { name: 'Use two ramps to touch the little chime, then ring the bell', cols: 5, rows: 4, fixed: 2, loose: 2, decoys: 4, chime: true, solutions: { min: 1, max: 2 }, machines: 2 },
  { name: 'Complete a five-part machine: chime first, bell last', cols: 5, rows: 5, fixed: 3, loose: 2, decoys: 5, chime: true, solutions: { min: 1, max: 2 }, machines: 2 },
  { name: 'Find one of several working designs for the chime and bell', cols: 5, rows: 5, fixed: 3, loose: 2, decoys: 6, chime: true, solutions: { min: 2, max: 6 }, machines: 2 },
];

export const planFor = (level: number): ChainPlan => PLANS[Math.min(PLANS.length, Math.max(1, level)) - 1];

/** One socket index per loose ramp; null means that ramp is still in the tray. */
export type Layout = (number | null)[];

export interface ChainBoard {
  cols: number;
  rows: number;
  start: number;
  target: number;
  fixed: FixedRamp[];
  loose: Ramp[];
  sockets: Cell[];
  /** A known working layout, used to make a useful hint. */
  solution: number[];
  /** The marble must arrive at this cell as well as at the target bell. */
  chime?: Cell;
}

export interface TraceStep extends Cell {
  ramp?: Ramp;
  /** Which loose ramp was hit; fixed ramps omit this. */
  loose?: number;
}

export interface Trace {
  steps: TraceStep[];
  end: number;
  chime: boolean;
  success: boolean;
  /** Falling past a side wall ends the run before the bottom. */
  escaped: boolean;
}

const sameCell = (a: Cell, b: Cell) => a.row === b.row && a.col === b.col;
const delta = (r: Ramp) => (r === 'left' ? -1 : 1);

/** Follow the marble through a placement. It is deterministic, so run, hints and tests use one rule. */
export function trace(board: ChainBoard, layout: Layout): Trace {
  let col = board.start;
  let chimed = false;
  const steps: TraceStep[] = [];
  let escaped = false;
  for (let row = 0; row < board.rows; row++) {
    const at = { row, col };
    if (board.chime && sameCell(at, board.chime)) chimed = true;
    const fixed = board.fixed.find((p) => sameCell(p, at));
    let ramp = fixed?.ramp;
    let loose: number | undefined;
    if (!ramp) {
      loose = layout.findIndex((socket) => socket !== null && sameCell(board.sockets[socket], at));
      if (loose >= 0) ramp = board.loose[loose];
      else loose = undefined;
    }
    steps.push({ ...at, ramp, loose });
    if (ramp) col += delta(ramp);
    if (col < 0 || col >= board.cols) {
      escaped = true;
      break;
    }
  }
  return { steps, end: col, chime: chimed, success: !escaped && col === board.target && (!board.chime || chimed), escaped };
}

function layouts(piece: number, sockets: number, work: Layout, used: Set<number>, out: Layout[]) {
  if (piece === work.length) {
    out.push(work.slice());
    return;
  }
  for (let socket = 0; socket < sockets; socket++) {
    if (used.has(socket)) continue;
    work[piece] = socket;
    used.add(socket);
    layouts(piece + 1, sockets, work, used, out);
    used.delete(socket);
  }
}

function workingLayouts(board: ChainBoard): number[][] {
  const all: Layout[] = [];
  layouts(0, board.sockets.length, Array<number | null>(board.loose.length).fill(null), new Set(), all);
  return all.filter((layout) => trace(board, layout).success) as number[][];
}

/**
 * Every visibly different all-pieces-placed design that rings the required bell(s). Swapping two identical ramps
 * does not invent a second design: the key records which kind of ramp occupies each socket, not which copy it was.
 */
export function solutions(board: ChainBoard): number[][] {
  const distinct = new Map<string, number[]>();
  for (const layout of workingLayouts(board)) {
    const key = layout.map((socket, piece) => `${socket}:${board.loose[piece]}`).sort().join('|');
    if (!distinct.has(key)) distinct.set(key, layout);
  }
  return [...distinct.values()];
}

/** A hint keeps as much of the child's current design as possible, then points to one change. */
export function hintFor(board: ChainBoard, layout: Layout): { piece: number; socket: number } | null {
  if (trace(board, layout).success) return null;
  // Keep indexed arrangements here so identical loose ramps can be matched to whichever one the child already placed.
  const ways = workingLayouts(board);
  if (!ways.length) return null;
  ways.sort((a, b) => {
    const score = (way: number[]) => way.reduce((n, socket, piece) => n + (layout[piece] === socket ? 1 : 0), 0);
    return score(b) - score(a);
  });
  const way = ways[0];
  const piece = way.findIndex((socket, i) => layout[i] !== socket);
  return piece < 0 ? null : { piece, socket: way[piece] };
}

function key(c: Cell) {
  return `${c.row}:${c.col}`;
}

/**
 * Make a small, solver-checked machine. A working path is authored first, decoy sockets are added, then all
 * placements are enumerated. Boards outside the plan's solution range are discarded, so a seed never produces
 * an impossible or ambiguous early round.
 */
export function makeBoard(plan: ChainPlan, rng: Rng): ChainBoard {
  for (let attempt = 0; attempt < 800; attempt++) {
    const rows = rng.shuffle(Array.from({ length: plan.rows }, (_, row) => row));
    const looseRows = new Set(rows.slice(0, plan.loose));
    const fixedRows = new Set(rows.slice(plan.loose, plan.loose + plan.fixed));
    let col = rng.int(1, plan.cols - 2);
    const start = col;
    const fixed: FixedRamp[] = [];
    const loose: Ramp[] = [];
    const correct: Cell[] = [];
    const path: Cell[] = [];
    for (let row = 0; row < plan.rows; row++) {
      path.push({ row, col });
      if (!looseRows.has(row) && !fixedRows.has(row)) continue;
      const options: Ramp[] = [];
      if (col > 0) options.push('left');
      if (col < plan.cols - 1) options.push('right');
      const ramp = rng.pick(options);
      if (looseRows.has(row)) {
        loose.push(ramp);
        correct.push({ row, col });
      } else fixed.push({ row, col, ramp });
      col += delta(ramp);
    }
    if (col === start && plan.rows > 2) continue;

    const occupied = new Set([...fixed, ...correct].map(key));
    const sockets = correct.slice();
    const candidates = rng.shuffle(Array.from({ length: plan.rows * plan.cols }, (_, i) => ({ row: Math.floor(i / plan.cols), col: i % plan.cols }))
      .filter((cell) => !occupied.has(key(cell))));
    for (const cell of candidates) {
      if (sockets.length >= plan.loose + plan.decoys) break;
      sockets.push(cell);
    }
    if (sockets.length < plan.loose + plan.decoys) continue;
    rng.shuffle(sockets);
    const solution = correct.map((cell) => sockets.findIndex((s) => sameCell(s, cell)));
    const chime = plan.chime ? rng.pick(path.slice(1, -1).length ? path.slice(1, -1) : path) : undefined;
    const board: ChainBoard = { cols: plan.cols, rows: plan.rows, start, target: col, fixed, loose, sockets, solution, chime };
    const ways = solutions(board);
    if (ways.length < plan.solutions.min || ways.length > plan.solutions.max) continue;
    // The stored layout must be one of the accepted ways, and taking every loose ramp away must not solve it.
    if (!trace(board, solution).success || trace(board, Array(loose.length).fill(null)).success) continue;
    board.solution = ways[0];
    return board;
  }
  throw new Error(`could not make a Chain Reaction board for ${plan.name}`);
}

export const makeBoards = (plan: ChainPlan, rng: Rng) => Array.from({ length: plan.machines }, () => makeBoard(plan, rng));
