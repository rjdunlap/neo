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
  /** Two coloured ramps are already placed; taps reverse their directions. */
  turn?: boolean;
  /** A finished machine with several bells: she predicts which one rings, then runs it. Nothing is placed. */
  predict?: { bells: number; offPath: number };
  /** A blue marble shares the board with the red one; one placement must send each to its own bell. */
  two?: boolean;
}

export const PLANS: ChainPlan[] = [
  { name: 'Put one ramp in place so the marble rings the bell', cols: 4, rows: 2, fixed: 0, loose: 1, decoys: 2, chime: false, solutions: { min: 1, max: 1 }, machines: 2 },
  { name: 'Add one ramp to a machine that already has a ramp', cols: 4, rows: 3, fixed: 1, loose: 1, decoys: 3, chime: false, solutions: { min: 1, max: 1 }, machines: 2 },
  { name: 'Place two ramps so the marble reaches the bell', cols: 5, rows: 4, fixed: 1, loose: 2, decoys: 3, chime: false, solutions: { min: 1, max: 2 }, machines: 2 },
  { name: 'Use two ramps to touch the little chime, then ring the bell', cols: 5, rows: 4, fixed: 2, loose: 2, decoys: 4, chime: true, solutions: { min: 1, max: 2 }, machines: 2 },
  { name: 'Complete a five-part machine: chime first, bell last', cols: 5, rows: 5, fixed: 3, loose: 2, decoys: 5, chime: true, solutions: { min: 1, max: 2 }, machines: 2 },
  { name: 'Find one of several working designs for the chime and bell', cols: 5, rows: 5, fixed: 3, loose: 2, decoys: 6, chime: true, solutions: { min: 2, max: 6 }, machines: 2 },
];

/** Level 8, an easy entry placed before level 1 by the band's `order`: read a finished machine and predict the bell. */
export const WHICH_BELL = 8;
export const PREDICT_PLAN: ChainPlan = {
  name: 'Which bell? Tap the bell the marble will ring, then run it', cols: 4, rows: 3, fixed: 2, loose: 0, decoys: 0, chime: false,
  solutions: { min: 1, max: 1 }, machines: 3, predict: { bells: 3, offPath: 0.5 },
};

export const TAP_TO_TURN = 7;
export const TURN_PLAN: ChainPlan = {
  name: 'Tap the coloured ramps to turn them so the marble rings the bell', cols: 4, rows: 3, fixed: 1, loose: 2, decoys: 0, chime: false,
  solutions: { min: 1, max: 4 }, machines: 2, turn: true,
};

/** Level 9, school: a red and a blue marble run the same machine, so each ramp is placed for both of them. */
export const TWO_MARBLES = 9;
export const TWO_PLAN: ChainPlan = {
  name: 'Two marbles: each one rings the bell of its own colour', cols: 5, rows: 4, fixed: 1, loose: 2, decoys: 3, chime: false,
  solutions: { min: 1, max: 3 }, machines: 2, two: true,
};

const SPECIAL: Record<number, ChainPlan> = { [TAP_TO_TURN]: TURN_PLAN, [WHICH_BELL]: PREDICT_PLAN, [TWO_MARBLES]: TWO_PLAN };
export const planFor = (level: number): ChainPlan => SPECIAL[level] ?? PLANS[Math.min(PLANS.length, Math.max(1, level)) - 1];

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
  /** Bell columns along the bottom, left to right, for a prediction machine; `target` is the one the marble rings. */
  bells?: number[];
  /** Preplaced coloured ramps; each boolean in the turn state reverses one groove. */
  turn?: FixedRamp[];
  /** Level 9's blue marble: its own cup and its own bell on the same board. `start`/`target` above are the red marble's. */
  blue?: { start: number; target: number };
}

/** Which marble a trace follows: 0 is the red marble (every level), 1 the blue one at level 9. */
export type Marble = 0 | 1;

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
export function trace(board: ChainBoard, layout: Layout, flipped: boolean[] = [], marble: Marble = 0): Trace {
  const blue = marble === 1 && board.blue;
  let col = blue ? blue.start : board.start;
  const target = blue ? blue.target : board.target;
  let chimed = false;
  const steps: TraceStep[] = [];
  let escaped = false;
  for (let row = 0; row < board.rows; row++) {
    const at = { row, col };
    if (board.chime && sameCell(at, board.chime)) chimed = true;
    const fixed = board.fixed.find((p) => sameCell(p, at));
    const turning = board.turn?.findIndex((p) => sameCell(p, at)) ?? -1;
    let ramp = fixed?.ramp;
    if (turning >= 0) {
      ramp = board.turn![turning].ramp;
      if (flipped[turning]) ramp = ramp === 'left' ? 'right' : 'left';
    }
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
  return { steps, end: col, chime: chimed, success: !escaped && col === target && (!board.chime || chimed), escaped };
}

/** One trace per marble on the board: the red marble, then the blue one at level 9. */
export const traces = (board: ChainBoard, layout: Layout, flipped: boolean[] = []): Trace[] =>
  board.blue ? [trace(board, layout, flipped, 0), trace(board, layout, flipped, 1)] : [trace(board, layout, flipped)];

/** The machine works only when every marble on it rings its own bell. Run, hints, the bot and tests all use this. */
export const works = (board: ChainBoard, layout: Layout, flipped: boolean[] = []): boolean =>
  traces(board, layout, flipped).every((t) => t.success);

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
  return all.filter((layout) => works(board, layout)) as number[][];
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

/** A working indexed arrangement that keeps as much of the current design as possible. */
function closestWorkingLayout(board: ChainBoard, layout: Layout): number[] | null {
  // Keep indexed arrangements here so identical loose ramps can be matched to whichever one the child already placed.
  const ways = workingLayouts(board);
  if (!ways.length) return null;
  ways.sort((a, b) => {
    const score = (way: number[]) => way.reduce((n, socket, piece) => n + (layout[piece] === socket ? 1 : 0), 0);
    return score(b) - score(a);
  });
  return ways[0];
}

/** A hint keeps as much of the child's current design as possible, then points to one change. */
export function hintFor(board: ChainBoard, layout: Layout): { piece: number; socket: number } | null {
  if (works(board, layout)) return null;
  const way = closestWorkingLayout(board, layout);
  if (!way) return null;
  const differs = way.map((socket, i) => (layout[i] !== socket ? i : -1)).filter((i) => i >= 0);
  if (!differs.length) return null;
  // With two marbles, point first to a ramp that matters to the marble that missed: one in its way now (perhaps placed
  // for the other marble), or one it meets in the working design.
  const now = traces(board, layout);
  const after = traces(board, way);
  const missed = now.findIndex((t) => !t.success);
  const meets = (t: Trace, piece: number) => t.steps.some((step) => step.loose === piece);
  const onMissedPath = missed >= 0 ? differs.find((piece) => meets(now[missed], piece) || meets(after[missed], piece)) : undefined;
  const piece = onMissedPath ?? differs[0];
  return { piece, socket: way[piece] };
}

/** All accepted flip states. Only the two preplaced ramps can change. */
export function turnSolutions(board: ChainBoard): boolean[][] {
  return Array.from({ length: 2 ** (board.turn?.length ?? 0) }, (_, mask) =>
    (board.turn ?? []).map((_, i) => !!(mask & (1 << i))))
    .filter((flipped) => works(board, [], flipped));
}

/** Keep the nearest working state and name one ramp that needs turning. */
export function turnHint(board: ChainBoard, flipped: boolean[]): number | null {
  const distance = (way: boolean[]) => way.reduce((n, value, i) => n + (value !== !!flipped[i] ? 1 : 0), 0);
  const way = turnSolutions(board).sort((a, b) => distance(a) - distance(b))[0];
  const piece = way?.findIndex((value, i) => value !== !!flipped[i]) ?? -1;
  return piece < 0 ? null : piece;
}

export type ChainTouch = { kind: 'flip'; piece: number } | { kind: 'place'; piece: number; socket: number } | { kind: 'run' };

/** Follow one accepted design a part at a time, then press the machine's real run button. */
export function chainTouch(board: ChainBoard, layout: Layout, flipped: boolean[] = []): ChainTouch | null {
  if (board.turn) {
    const piece = turnHint(board, flipped);
    return piece !== null ? { kind: 'flip', piece } : works(board, [], flipped) ? { kind: 'run' } : null;
  }
  const hint = hintFor(board, layout);
  if (hint) return { kind: 'place', ...hint };
  // A part-built machine can already work; the run still needs every ramp in a socket, so finish the nearest design.
  const way = closestWorkingLayout(board, layout);
  const piece = way?.findIndex((socket, i) => layout[i] !== socket) ?? -1;
  if (way && piece >= 0) return { kind: 'place', piece, socket: way[piece] };
  return layout.every((socket) => socket !== null) && works(board, layout) ? { kind: 'run' } : null;
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
  if (plan.turn) {
    const base = makeBoard({ ...plan, turn: false }, rng);
    const turn = base.solution.map((socket, i) => ({ ...base.sockets[socket], ramp: base.loose[i] }));
    const board: ChainBoard = { ...base, loose: [], sockets: [], solution: [], turn };
    // Choose an unsolved starting state without changing the authored, reachable bell.
    const wrong = Array.from({ length: 2 ** turn.length }, (_, mask) => turn.map((_, i) => !!(mask & (1 << i))))
      .filter((flipped) => !works(board, [], flipped));
    const initial = rng.pick(wrong);
    turn.forEach((part, i) => { if (initial[i]) part.ramp = part.ramp === 'left' ? 'right' : 'left'; });
    return board;
  }
  if (plan.predict) return makePredictBoard(plan, plan.predict, rng);
  if (plan.two) return makeTwoBoard(plan, rng);
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
    if (!works(board, solution) || works(board, Array(loose.length).fill(null))) continue;
    board.solution = ways[0];
    return board;
  }
  throw new Error(`could not make a Chain Reaction board for ${plan.name}`);
}

/** The loose ramps (by piece) that a marble meets on its way down. */
export const rampsMet = (t: Trace): Set<number> => new Set(t.steps.flatMap((step) => (step.loose === undefined ? [] : [step.loose])));

/**
 * Level 9: two marbles on one board. Each marble's own way down needs one loose ramp, and one fixed ramp sits on one of
 * them. The two ways never share a cell (two marbles in one cell would fall the same way from there on, so they could
 * never ring different bells). At least one empty socket lies on a marble's way, so a ramp put there for the other marble
 * knocks this one off course: she plans for both. Some placement rings one bell while the other marble misses.
 */
function makeTwoBoard(plan: ChainPlan, rng: Rng): ChainBoard {
  for (let attempt = 0; attempt < 800; attempt++) {
    const rows = Array.from({ length: plan.rows }, (_, row) => row);
    const redRow = rng.pick(rows);
    const blueRow = rng.pick(rows);
    const fixedRow = rng.pick(rows.filter((r) => r !== redRow && r !== blueRow));
    const fixedOn: Marble = rng.chance(0.5) ? 0 : 1;
    const starts = rng.shuffle(Array.from({ length: plan.cols }, (_, c) => c));
    const cols = [starts[0], starts[1]];
    const begin = cols.slice();
    const paths: Cell[][] = [[], []];
    const fixed: FixedRamp[] = [];
    const correct: Cell[] = [];
    const loose: Ramp[] = [];
    let ok = true;
    for (let row = 0; row < plan.rows && ok; row++) {
      for (const m of [0, 1] as Marble[]) {
        const col = cols[m];
        paths[m].push({ row, col });
        const own = m === 0 ? redRow : blueRow;
        if (row !== own && !(row === fixedRow && m === fixedOn)) continue;
        const options: Ramp[] = [];
        if (col > 0) options.push('left');
        if (col < plan.cols - 1) options.push('right');
        const ramp = rng.pick(options);
        if (row === own) { loose[m] = ramp; correct[m] = { row, col }; } else fixed.push({ row, col, ramp });
        cols[m] += delta(ramp);
      }
      if (cols[0] === cols[1]) ok = false;
    }
    if (!ok || paths[0].some((a) => paths[1].some((b) => sameCell(a, b)))) continue;
    if (cols[0] === begin[0] || cols[1] === begin[1]) continue;

    const occupied = new Set([...fixed, ...correct].map(key));
    const onWay = new Set([...paths[0], ...paths[1]].map(key));
    const free = rng.shuffle(Array.from({ length: plan.rows * plan.cols }, (_, i) => ({ row: Math.floor(i / plan.cols), col: i % plan.cols }))
      .filter((cell) => !occupied.has(key(cell))));
    const crossing = free.find((cell) => onWay.has(key(cell)));
    if (!crossing) continue;
    const sockets = [...correct, crossing, ...free.filter((cell) => cell !== crossing).slice(0, plan.decoys - 1)];
    if (sockets.length < plan.loose + plan.decoys) continue;
    rng.shuffle(sockets);
    const solution = correct.map((cell) => sockets.findIndex((s) => sameCell(s, cell)));
    const board: ChainBoard = { cols: plan.cols, rows: plan.rows, start: begin[0], target: cols[0], fixed, loose, sockets, solution, blue: { start: begin[1], target: cols[1] } };
    const ways = solutions(board);
    if (ways.length < plan.solutions.min || ways.length > plan.solutions.max) continue;
    if (!works(board, solution) || works(board, Array(loose.length).fill(null))) continue;
    if (!oneBellOnly(board, 0) || !oneBellOnly(board, 1) || !ways.every((way) => plansForBoth(board, way))) continue;
    board.solution = ways[0];
    return board;
  }
  throw new Error(`could not make a Chain Reaction board for ${plan.name}`);
}

/** In a working design each marble meets a ramp of its own, the two ways share no cell, and a spare socket sits on a way. */
function plansForBoth(board: ChainBoard, way: number[]): boolean {
  const [red, blue] = traces(board, way);
  const [redMet, blueMet] = [rampsMet(red), rampsMet(blue)];
  if (!redMet.size || !blueMet.size || [...redMet].some((piece) => blueMet.has(piece))) return false;
  if (red.steps.some((a) => blue.steps.some((b) => sameCell(a, b)))) return false;
  return board.sockets.some((cell, i) => !way.includes(i) && [...red.steps, ...blue.steps].some((step) => sameCell(step, cell)));
}

/** Some full placement rings this marble's bell while the other marble misses. */
function oneBellOnly(board: ChainBoard, marble: Marble): boolean {
  const all: Layout[] = [];
  layouts(0, board.sockets.length, Array<number | null>(board.loose.length).fill(null), new Set(), all);
  return all.some((layout) => {
    const t = traces(board, layout);
    return t[marble].success && !t[1 - marble].success;
  });
}

/**
 * A finished machine for a prediction: `plan.fixed` ramps sit on the marble's path and the marble never leaves the board.
 * Two ramps that agree carry it to a corner; two that disagree bring it back under the cup, so the answer is not always
 * the far bell. Some machines add one ramp the marble never reaches, so counting ramps is not enough: she follows the
 * real way down. The bell it rings is one of the bells shown; the others stand in other columns along the bottom.
 */
function makePredictBoard(plan: ChainPlan, { bells, offPath }: { bells: number; offPath: number }, rng: Rng): ChainBoard {
  for (let attempt = 0; attempt < 400; attempt++) {
    const rows = new Set(rng.shuffle(Array.from({ length: plan.rows }, (_, row) => row)).slice(0, plan.fixed));
    let col = rng.int(1, plan.cols - 2);
    const start = col;
    const fixed: FixedRamp[] = [];
    const path: Cell[] = [];
    for (let row = 0; row < plan.rows; row++) {
      path.push({ row, col });
      if (!rows.has(row)) continue;
      const options: Ramp[] = [];
      if (col > 0) options.push('left');
      if (col < plan.cols - 1) options.push('right');
      const ramp = rng.pick(options);
      fixed.push({ row, col, ramp });
      col += delta(ramp);
    }
    if (rng.chance(offPath)) {
      const visited = new Set(path.map(key));
      const free = Array.from({ length: plan.rows * plan.cols }, (_, i) => ({ row: Math.floor(i / plan.cols), col: i % plan.cols }))
        .filter((cell) => !visited.has(key(cell)));
      const cell = rng.pick(free);
      fixed.push({ ...cell, ramp: cell.col === 0 ? 'right' : cell.col === plan.cols - 1 ? 'left' : rng.pick<Ramp>(['left', 'right']) });
    }
    const others = rng.shuffle(Array.from({ length: plan.cols }, (_, c) => c).filter((c) => c !== col)).slice(0, bells - 1);
    const board: ChainBoard = { cols: plan.cols, rows: plan.rows, start, target: col, fixed, loose: [], sockets: [], solution: [], bells: [col, ...others].sort((a, b) => a - b) };
    if (!trace(board, []).success) continue;
    return board;
  }
  throw new Error(`could not make a Chain Reaction prediction for ${plan.name}`);
}

/** The bell the ghost finger predicts: the one the marble's trace really ends at. */
export const predictedBell = (board: ChainBoard): number => trace(board, []).end;

export const makeBoards = (plan: ChainPlan, rng: Rng) => Array.from({ length: plan.machines }, () => makeBoard(plan, rng));
