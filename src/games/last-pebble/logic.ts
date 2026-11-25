import type { Rng } from '../../engine/random';
import type { View } from '../../engine/view';
import type { BandLevels } from '../../progress/difficulty';

export const MAX_TAKE = 2;
export const STEP = MAX_TAKE + 1;
export const SPOT_SIZE = 128;
export const COLS = 4;
export const GAP_X = 28;
export const GAP_Y_UPRIGHT = 44;
export const GAP_Y_LANDSCAPE = 36;

export const LEVELS: BandLevels = {
  school: { min: 1, max: 4 },
  grownup: { min: 1, max: 4 },
};

export const describeLevel = (level: number): string => {
  switch (level) {
    case 1:
      return 'Near the far bank: lay 1 or 2 stones to land on the far bank or three back (about 10 and up)';
    case 2:
      return 'Across the stream: work backwards from the far bank to hit every stepping stone (about 10 and up)';
    case 3:
      return 'Who goes first? choose to start or let the pet start, then reach the far bank (about 10 and up)';
    default:
      return 'Bigger steps: lay up to 3 or 4 stones at a time, and choose who goes first (about 10 and up)';
  }
};

/** Stones that may be laid in one turn; `1..maxTake`, never above `4`. */
export type Move = 1 | 2 | 3 | 4;
export type Seat = 'first' | 'second';

export type Player = 'her' | 'pet';
export type Stone = Player | null;

export interface MoveRecord {
  readonly player: Player;
  readonly from: number;
  readonly to: number;
}

export interface CrossingSpec {
  readonly target: number;
  readonly startPos: number;
  /** Most stones one turn may lay (`2` at levels 1–3). */
  readonly maxTake: number;
  /** She picks who lays the first stone before play (levels 3–4). */
  readonly choose: boolean;
}

export interface CrossingState {
  readonly target: number;
  readonly pos: number;
  readonly stones: readonly Stone[];
}

export interface Round {
  readonly level: number;
  readonly seed: number;
  readonly crossings: readonly CrossingSpec[];
}

export interface SpotBox {
  /** 1-based spot number (`1..target`). */
  readonly spot: number;
  readonly x: number;
  readonly y: number;
  readonly w: number;
  readonly h: number;
}

export interface StreamLayout {
  readonly spots: readonly SpotBox[];
  readonly board: { readonly x: number; readonly y: number; readonly w: number; readonly h: number };
  readonly nearBank: { readonly x: number; readonly y: number };
  readonly farBank: { readonly x: number; readonly y: number };
  readonly spotSize: number;
}

export type Level1ReplyKind = 'could-reach' | 'leave-three' | 'took-stone';

export interface Level1Reply {
  readonly move: Move;
  readonly voice: `lp.${Level1ReplyKind}`;
  readonly highlightSpot: number;
}

/** Ascending stepping stones `s` (`1 <= s <= target`) with `(target - s) % (maxTake + 1) === 0`. */
export function steppingStones(target: number, maxTake = MAX_TAKE): number[] {
  const period = maxTake + 1;
  const out: number[] = [];
  for (let s = 1; s <= target; s++) {
    if ((target - s) % period === 0) out.push(s);
  }
  return out;
}

/** True iff `pos` is a cold/winning-to-land-on position: the player about to move from `pos` is lost against best play. */
export function isSteppingStone(pos: number, target: number, maxTake = MAX_TAKE): boolean {
  return pos >= 0 && pos <= target && (target - pos) % (maxTake + 1) === 0;
}

/** Unique winning move (`1 | 2`) from `pos` toward `target`, or `null` if `pos >= target` or already a stepping stone. */
export function bestMove(pos: number, target: number, maxTake = MAX_TAKE): Move | null {
  if (pos >= target || isSteppingStone(pos, target, maxTake)) return null;
  return ((target - pos) % (maxTake + 1)) as Move;
}

/** Legal forward stone counts from `pos` toward `target`. */
export function legalMoves(pos: number, target: number, maxTake = MAX_TAKE): Move[] {
  if (pos >= target) return [];
  const out: Move[] = [];
  for (let d = 1; d <= maxTake && pos + d <= target; d++) out.push(d as Move);
  return out;
}

/**
 * The pet's reply from `pos`: plays `bestMove` whenever `pos` is not a stepping stone, and picks deterministically
 * from `legalMoves` via a hash of `(pos, target, seed)` on stepping stones so both `+1` and `+2` appear across rounds.
 */
export function petMove(pos: number, target: number, seed: number, maxTake = MAX_TAKE): Move {
  const best = bestMove(pos, target, maxTake);
  if (best !== null) return best;
  const legal = legalMoves(pos, target, maxTake);
  if (!legal.length) return 1;
  const h =
    (Math.imul(pos + 3, 73856093) ^ Math.imul(target + 7, 19349663) ^ Math.imul(seed | 0, 83492791)) >>> 0;
  return legal[h % legal.length];
}

/**
 * Scans backwards through `moves` for the most recent move by `'her'` where she had a winning move (`bestMove !== null`)
 * and landed off a stepping stone (`!isSteppingStone(to)`).
 */
export function turningPoint(
  moves: readonly MoveRecord[],
  target: number,
  maxTake = MAX_TAKE,
): MoveRecord | null {
  for (let i = moves.length - 1; i >= 0; i--) {
    const m = moves[i];
    if (
      m.player === 'her' &&
      bestMove(m.from, target, maxTake) !== null &&
      !isSteppingStone(m.to, target, maxTake)
    ) {
      return m;
    }
  }
  return null;
}

/** Index in `moves` of the turning-point move, or `-1` if none exists. */
export function turningPointIndex(moves: readonly MoveRecord[], target: number, maxTake = MAX_TAKE): number {
  for (let i = moves.length - 1; i >= 0; i--) {
    const m = moves[i];
    if (
      m.player === 'her' &&
      bestMove(m.from, target, maxTake) !== null &&
      !isSteppingStone(m.to, target, maxTake)
    ) {
      return i;
    }
  }
  return -1;
}

/**
 * True iff the player who lays the first stone wins against best play: position `0` is not a stepping stone,
 * that is `target` is not a multiple of `maxTake + 1`.
 */
export function goFirstWins(target: number, maxTake = MAX_TAKE): boolean {
  return !isSteppingStone(0, target, maxTake);
}

/** The winning pick before a crossing: go first when `0` is not a stepping stone, otherwise let the pet go first. */
export function bestChoice(target: number, maxTake = MAX_TAKE): Seat {
  return goFirstWins(target, maxTake) ? 'first' : 'second';
}

/** Spots lit once to show the stepping stones of a crossing (`target`, `target - (maxTake + 1)`, … down to `1`). */
export function stoneSpots(target: number, maxTake = MAX_TAKE): number[] {
  return steppingStones(target, maxTake);
}

/** Initial state for a crossing: `1..startPos` filled alternating `'her'`/`'pet'` ending on `'pet'` so she moves next. */
export function makeCrossing(target: number, startPos: number): CrossingState {
  const stones: Stone[] = Array.from({ length: target }, (_, i) =>
    i < startPos ? ((startPos - 1 - i) % 2 === 0 ? 'pet' : 'her') : null,
  );
  return { target, pos: startPos, stones };
}

/** Applies a legal move of `delta` by `player` and returns the next state and its move record. */
export function applyMove(
  state: CrossingState,
  player: Player,
  delta: Move,
): { state: CrossingState; record: MoveRecord } {
  const to = Math.min(state.target, state.pos + delta);
  const stones = state.stones.slice();
  for (let idx = state.pos; idx < to; idx++) stones[idx] = player;
  return {
    state: { target: state.target, pos: to, stones },
    record: { player, from: state.pos, to },
  };
}

/** Pure round generator for levels 1 (`near`) and 2 (`across`). */
export function makeRound(level: number, rng: Rng): Round {
  const seed = rng.int(1, 0x7fffffff);
  if (level === 1) {
    const t1 = rng.pick([6, 7]);
    const t2 = rng.pick([7, 8]);
    const t3 = rng.pick([8, 9]);
    return {
      level: 1,
      seed,
      crossings: [
        { target: t1, startPos: t1 - 2, maxTake: MAX_TAKE, choose: false },
        { target: t2, startPos: t2 - 4, maxTake: MAX_TAKE, choose: false },
        { target: t3, startPos: t3 - 5, maxTake: MAX_TAKE, choose: false },
      ],
    };
  }
  if (level === 2) {
    const target = rng.pick([7, 8, 10, 11]);
    return {
      level: 2,
      seed,
      crossings: [{ target, startPos: 0, maxTake: MAX_TAKE, choose: false }],
    };
  }
  if (level === 3) {
    // One stream per remainder mod 3 (both answers always appear), in seeded order.
    const lengths = rng.shuffle([rng.pick([6, 9, 12]), rng.pick([7, 10]), rng.pick([8, 11])]);
    return {
      level: 3,
      seed,
      crossings: lengths.map((target) => ({ target, startPos: 0, maxTake: MAX_TAKE, choose: true })),
    };
  }
  // Level 4: one crossing of each take, at least one multiple of `m + 1` and at least one not.
  const pools: Record<number, number[]> = { 3: [9, 10, 11, 12, 13], 4: [10, 12, 13, 14, 15, 16] };
  const mixed = rng.pick([0, 1]);
  const pick = (m: number, wantMultiple: boolean) => {
    const pool = pools[m].filter((t) => (t % (m + 1) === 0) === wantMultiple);
    return rng.pick(pool);
  };
  const a = { target: pick(3, mixed === 0), maxTake: 3 };
  const b = { target: pick(4, mixed !== 0), maxTake: 4 };
  return {
    level: 4,
    seed,
    crossings: rng.shuffle([a, b]).map((c) => ({ ...c, startPos: 0, choose: true })),
  };
}

/** Level 1 *show me why* reply when she misses a winning move, leaving `posAfterHerMove` off a stepping stone. */
export function level1Reply(posAfterHerMove: number, target: number): Level1Reply {
  const rem = target - posAfterHerMove;
  if (rem === 1) {
    return { move: 1, voice: 'lp.could-reach', highlightSpot: target };
  }
  if (rem === 2) {
    return { move: 2, voice: 'lp.leave-three', highlightSpot: target };
  }
  return { move: 1, voice: 'lp.took-stone', highlightSpot: target - 3 };
}

/** What spot `Show me` points to from `pos`, or `null` if `pos` is a losing position (level 2 rewinds first). */
export function hintSpot(pos: number, target: number, maxTake = MAX_TAKE): number | null {
  const d = bestMove(pos, target, maxTake);
  return d === null ? null : pos + d;
}

/** Continuous winding S-path layout of spots `1..target` (4 columns × up to 3 rows). */
export function streamLayout(view: Pick<View, 'w' | 'h' | 'upright'>, target: number): StreamLayout {
  const rows = Math.ceil(target / COLS);
  const gapY = view.upright ? GAP_Y_UPRIGHT : GAP_Y_LANDSCAPE;
  const gridW = COLS * SPOT_SIZE + (COLS - 1) * GAP_X;
  const gridH = rows * SPOT_SIZE + (rows - 1) * gapY;

  let x0: number;
  let y0: number;
  if (view.upright) {
    x0 = (view.w - gridW) / 2;
    const top = 210;
    const bottom = view.h - 180;
    y0 = top + (bottom - top - gridH) / 2;
  } else {
    const left = 180;
    const right = view.w - 20;
    x0 = left + (right - left - gridW) / 2;
    const top = 40;
    const bottom = view.h - 40;
    y0 = top + (bottom - top - gridH) / 2;
  }

  const spots: SpotBox[] = [];
  for (let i = 0; i < target; i++) {
    const row = Math.floor(i / COLS);
    const inRow = i % COLS;
    const col = row % 2 === 0 ? inRow : COLS - 1 - inRow;
    spots.push({
      spot: i + 1,
      x: x0 + col * (SPOT_SIZE + GAP_X) + SPOT_SIZE / 2,
      y: y0 + row * (SPOT_SIZE + gapY) + SPOT_SIZE / 2,
      w: SPOT_SIZE,
      h: SPOT_SIZE,
    });
  }

  const first = spots[0];
  const last = spots[spots.length - 1];
  return {
    spots,
    board: { x: x0, y: y0, w: gridW, h: gridH },
    nearBank: { x: first.x - SPOT_SIZE * 0.56, y: first.y },
    farBank: { x: last.x, y: last.y },
    spotSize: SPOT_SIZE,
  };
}

export const CHOICE_W = 240;
export const CHOICE_H = 180;
export const CHOICE_GAP = 40;

export interface ChoiceBox {
  readonly pick: Seat;
  readonly x: number;
  readonly y: number;
  readonly w: number;
  readonly h: number;
}

/** The two choice buttons (`I go first`, `Pet goes first`), side by side over the middle of the board. */
export function choiceLayout(L: Pick<StreamLayout, 'board'>): ChoiceBox[] {
  const cx = L.board.x + L.board.w / 2;
  const cy = L.board.y + L.board.h / 2;
  const off = (CHOICE_W + CHOICE_GAP) / 2;
  return [
    { pick: 'first', x: cx - off, y: cy, w: CHOICE_W, h: CHOICE_H },
    { pick: 'second', x: cx + off, y: cy, w: CHOICE_W, h: CHOICE_H },
  ];
}
