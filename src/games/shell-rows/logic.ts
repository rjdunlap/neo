import type { Rng } from '../../engine/random';
import type { BandLevels } from '../../progress/difficulty';

// Shell Rows: one-move puzzles on a 3 by 3 sand grid. Her shells, the pet's pebbles, her turn.
// Squares are numbered 0–8 row by row: 0 1 2 / 3 4 5 / 6 7 8.

export type Side = 'shell' | 'pebble';
export type Cell = Side | null;
export type Board = readonly Cell[];

export const LINES: readonly (readonly [number, number, number])[] = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6],
];

export type LevelId = 'finish' | 'stop' | 'first';

export interface Plan { level: number; id: LevelId; name: string }

const PLANS: readonly Plan[] = [
  { level: 1, id: 'finish', name: 'Finish the row: set the third shell' },
  { level: 2, id: 'stop', name: "Stop the row: block the pet's two pebbles" },
  { level: 3, id: 'first', name: 'Win first: make her own row rather than block' },
];

/** Pre-K plays 1–2; school 1–3. Levels 4–5 (SG2) append above 3 without renumbering. */
export const LEVELS: BandLevels = {
  prek: { min: 1, max: 2 },
  school: { min: 1, max: 3 },
};

export function planFor(level: number): Plan {
  return PLANS.find((p) => p.level === level) ?? PLANS[0];
}

/** Positions per round. */
export const POSITIONS = 3;

// ---- the board ----

export const other = (s: Side): Side => (s === 'shell' ? 'pebble' : 'shell');
export const key = (b: Board) => b.map((c) => (c === 'shell' ? 'x' : c === 'pebble' ? 'o' : '.')).join('');
export const fromKey = (k: string): Board => [...k].map((ch) => (ch === 'x' ? 'shell' : ch === 'o' ? 'pebble' : null));
export const count = (b: Board, s: Side) => b.filter((c) => c === s).length;
export const empties = (b: Board) => b.flatMap((c, i) => (c === null ? [i] : []));

export function place(b: Board, i: number, s: Side): Board {
  const n = b.slice();
  n[i] = s;
  return n;
}

/** The line `side` has completed, if any. */
export function wonLine(b: Board, side: Side): readonly [number, number, number] | null {
  return LINES.find((l) => l.every((i) => b[i] === side)) ?? null;
}

/** The empty squares that would complete a line for `side`, ascending. */
export function winsFor(b: Board, side: Side): number[] {
  const out = new Set<number>();
  for (const l of LINES) {
    const mine = l.filter((i) => b[i] === side).length;
    const gap = l.filter((i) => b[i] === null);
    if (mine === 2 && gap.length === 1) out.add(gap[0]);
  }
  return [...out].sort((a, b) => a - b);
}

/** A position she can be asked to move in: legal counts (either player went first), no completed line, a square free. */
export function herTurn(b: Board): boolean {
  const s = count(b, 'shell'), p = count(b, 'pebble');
  if (!(s === p || p === s + 1)) return false;
  if (wonLine(b, 'shell') || wonLine(b, 'pebble')) return false;
  return empties(b).length > 0;
}

// ---- minimax ----

const memo = new Map<string, number>();

/** The value of the position from her side with perfect play: +1 she wins, 0 draw, −1 the pet wins. */
export function value(b: Board, toMove: Side): number {
  if (wonLine(b, 'shell')) return 1;
  if (wonLine(b, 'pebble')) return -1;
  const free = empties(b);
  if (!free.length) return 0;
  const k = key(b) + toMove;
  const hit = memo.get(k);
  if (hit !== undefined) return hit;
  const vals = free.map((i) => value(place(b, i, toMove), other(toMove)));
  const v = toMove === 'shell' ? Math.max(...vals) : Math.min(...vals);
  memo.set(k, v);
  return v;
}

/** Centre, corners, edges: the order the pet looks in when no row is at stake. */
export const PREFERENCE = [4, 0, 2, 6, 8, 1, 3, 5, 7];

/**
 * The pet's reply after her move: its own winning square if it has one; otherwise a square that stops her row,
 * preferring `target` (the square the puzzle asked for); otherwise the first minimax-best square, centre first.
 */
export function petReply(b: Board, target: number): number {
  const mine = winsFor(b, 'pebble');
  if (mine.length) return mine[0];
  const hers = winsFor(b, 'shell');
  if (hers.length) return hers.includes(target) ? target : hers[0];
  const free = PREFERENCE.filter((i) => b[i] === null);
  const best = Math.min(...free.map((i) => value(place(b, i, 'pebble'), 'shell')));
  return free.find((i) => value(place(b, i, 'pebble'), 'shell') === best)!;
}

// ---- symmetry ----

/** The board's eight symmetries as index maps: transformed[i] = board[map[i]]. */
export const SYMMETRIES: readonly (readonly number[])[] = (() => {
  const rot = [6, 3, 0, 7, 4, 1, 8, 5, 2];
  const flip = [2, 1, 0, 5, 4, 3, 8, 7, 6];
  const compose = (a: readonly number[], b: readonly number[]) => a.map((i) => b[i]);
  const id = [0, 1, 2, 3, 4, 5, 6, 7, 8];
  const out: number[][] = [];
  let r = id;
  for (let k = 0; k < 4; k++) {
    out.push(r, compose(r, flip));
    r = compose(r, rot);
  }
  return out;
})();

export const transform = (b: Board, map: readonly number[]): Board => map.map((i) => b[i]);
/** Where square `i` of the original board lands under `map`. */
export const moveSquare = (i: number, map: readonly number[]) => map.indexOf(i);

export function canonical(b: Board): string {
  return SYMMETRIES.map((m) => key(transform(b, m))).sort()[0];
}

// ---- the pools ----

export function rightSquare(level: number, b: Board): number {
  return planFor(level).id === 'stop' ? winsFor(b, 'pebble')[0] : winsFor(b, 'shell')[0];
}

export function fits(level: number, b: Board): boolean {
  if (!herTurn(b)) return false;
  const pieces = 9 - empties(b).length;
  const hers = winsFor(b, 'shell'), pets = winsFor(b, 'pebble');
  switch (planFor(level).id) {
    case 'finish': return hers.length === 1 && pets.length === 0 && pieces <= 5;
    case 'stop': return pets.length === 1 && hers.length === 0 && pieces <= 5 && value(place(b, pets[0], 'shell'), 'pebble') >= 0;
    case 'first': return hers.length === 1 && pets.length === 1 && hers[0] !== pets[0];
  }
}

const pools = new Map<number, Board[]>();

/** Every position class the level accepts, one canonical board per class, sorted by key. */
export function pool(level: number): Board[] {
  const hit = pools.get(level);
  if (hit) return hit;
  const seen = new Set<string>();
  for (let n = 0; n < 3 ** 9; n++) {
    const b: Cell[] = [];
    for (let i = 0, m = n; i < 9; i++, m = Math.floor(m / 3)) b.push(m % 3 === 0 ? null : m % 3 === 1 ? 'shell' : 'pebble');
    if (fits(level, b)) seen.add(canonical(b));
  }
  const out = [...seen].sort().map(fromKey);
  pools.set(level, out);
  return out;
}

const board = (shells: number[], pebbles: number[]): Board =>
  Array.from({ length: 9 }, (_, i) => (shells.includes(i) ? 'shell' : pebbles.includes(i) ? 'pebble' : null));

/** Each level's plain opening: a straight row, no diagonal threat. */
export const AUTHORED: Record<LevelId, Board> = {
  finish: board([0, 1], [3, 8]),
  stop: board([4], [6, 7]),
  first: board([0, 1], [6, 7]),
};

// ---- what a wrong square brings ----

export type Reply = 'took-spot' | 'got-three' | 'could-have';

/** The pet's line after her wrong square: it took her spot (level 1), made its three, or (level 3's block) took the three she could have had. */
export function replyKind(level: number, b: Board, wrong: number): Reply {
  const after = place(b, wrong, 'shell');
  const reply = petReply(after, rightSquare(level, b));
  if (wonLine(place(after, reply, 'pebble'), 'pebble')) return 'got-three';
  return planFor(level).id === 'first' ? 'could-have' : 'took-spot';
}

/** The row a reply decides: the pet's completed row, or the row of hers the reply stopped. */
export function decidingLine(b: Board, wrong: number, reply: number): readonly [number, number, number] {
  const after = place(place(b, wrong, 'shell'), reply, 'pebble');
  const won = wonLine(after, 'pebble');
  if (won) return won;
  return LINES.find((l) => l.includes(reply) && l.filter((i) => after[i] === 'shell').length === 2)!;
}

// ---- a round ----

export const SHELL_COLORS = ['pink', 'orange', 'purple', 'teal', 'blue'] as const;
export type ShellColor = typeof SHELL_COLORS[number];

export interface Position { board: Board; right: number; symmetry: number }
export interface Round { level: number; positions: Position[]; colors: [ShellColor, ShellColor] }

export function makeRound(level: number, rng: Rng): Round {
  const plan = planFor(level);
  const authored = AUTHORED[plan.id];
  const seat = (b: Board): Position => {
    const symmetry = rng.int(0, 7);
    const t = transform(b, SYMMETRIES[symmetry]);
    return { board: t, right: rightSquare(level, t), symmetry };
  };
  const first = seat(authored);
  const avoid = canonical(authored);
  const others = rng.shuffle(pool(level).filter((b) => key(b) !== avoid)).slice(0, POSITIONS - 1);
  const colors = rng.shuffle([...SHELL_COLORS]);
  return { level, positions: [first, ...others.map(seat)], colors: [colors[0], colors[1]] };
}

/** A sticker's board: a row of three shells shining, from the seed. */
export function stickerBoard(seed: number): { board: Board; line: readonly [number, number, number] } {
  const lineIx = seed % 8;
  const line = LINES[lineIx];
  const free = [0, 1, 2, 3, 4, 5, 6, 7, 8].filter((i) => !line.includes(i));
  const pebbles = [free[seed % free.length], free[(seed + 3) % free.length]];
  return { board: board([...line], pebbles), line };
}

// ---- accounting ----

export type Outcome = 'right' | 'miss' | 'glow';

/** Misses, hints and the glow, scoped to one position: at most one hint per position, the glow after a second miss. */
export class Score {
  misses = 0;
  hints = 0;
  wrongs = 0;
  glowing = false;
  private hinted = false;

  newPosition() { this.wrongs = 0; this.glowing = false; this.hinted = false; }

  answer(right: boolean): Outcome {
    if (right) { this.glowing = false; return 'right'; }
    this.misses++;
    this.wrongs++;
    if (this.wrongs >= 2 && !this.glowing) { this.light(); return 'glow'; }
    return 'miss';
  }

  /** *Show me*: lights the glow (true), or, already lit, asks for the ghost's move (false). */
  showMe(): boolean {
    if (this.glowing) return false;
    this.light();
    return true;
  }

  private light() {
    this.glowing = true;
    if (!this.hinted) { this.hinted = true; this.hints++; }
  }
}

// ---- layout ----

export interface Pt { x: number; y: number }
export interface Box extends Pt { w: number; h: number }
export const SQUARE = 150, GROOVE = 12, BORDER = 20;
const box = (x: number, y: number, w: number, h: number): Box => ({ x, y, w, h });

export interface Layout { portrait: boolean; cell: number; board: Box; squares: Box[]; shellPile: Box; pebblePile: Box }

/** The board right of the pet's corner in landscape, centred above the pet's row in portrait; null rather than squares under 100. */
export function layout(view: { w: number; h: number }): Layout | null {
  const { w, h } = view;
  const portrait = h > w;
  const top = portrait ? 150 : 110;
  const bottom = portrait ? h - 190 : h - 16;
  const across = portrait ? w - 40 : w - 2 * 190;
  const fit = Math.min(bottom - top, across);
  const cell = Math.min(SQUARE, Math.floor((fit - 2 * BORDER - 2 * GROOVE) / 3));
  if (cell < 100) return null;
  const size = 3 * cell + 2 * GROOVE + 2 * BORDER;
  const cx = w / 2;
  const cy = portrait ? top + size / 2 : (top + bottom) / 2;
  const left = cx - size / 2 + BORDER;
  const up = cy - size / 2 + BORDER;
  const squares = Array.from({ length: 9 }, (_, i) =>
    box(left + cell / 2 + (i % 3) * (cell + GROOVE), up + cell / 2 + Math.floor(i / 3) * (cell + GROOVE), cell, cell));
  const pile = 70;
  const pileY = portrait ? cy - size / 2 - pile / 2 - 4 : cy - size / 2 + pile;
  const shellPile = portrait ? box(cx - size / 2 + pile, pileY, pile, pile) : box(cx - size / 2 - pile / 2 - 12, pileY, pile, pile);
  const pebblePile = portrait ? box(cx + size / 2 - pile, pileY, pile, pile) : box(cx + size / 2 + pile / 2 + 12, pileY, pile, pile);
  return { portrait, cell, board: box(cx, cy, size, size), squares, shellPile, pebblePile };
}
