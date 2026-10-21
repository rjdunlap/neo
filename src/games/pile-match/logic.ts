import type { Rng } from '../../engine/random';
import type { View } from '../../engine/view';
import { SHAPES } from './shapes';

/** A place in the heap, in grid pitches (120 units); odd layers sit half a pitch over. */
export interface Cell { x: number; y: number; z: number }
/** A heap: where each piece lies, its kind, and the clearing route the kinds were dealt along. */
export interface Board { cells: readonly Cell[]; kinds: readonly number[]; route: readonly number[] }

/** Each kind has its own silhouette and its own colour, so finding one is a single-feature search. */
export const KINDS = ['shell', 'acorn', 'apple', 'star', 'leaf', 'duck', 'flower', 'mushroom'] as const;
export type KindName = (typeof KINDS)[number];
const APPLE = 2, SHELL = 0;

export const PITCH = 120;
export const RADIUS = 56;
/** Two pieces overlap when their centres are closer than two radii (112 units). */
const OVERLAP = (2 * RADIUS) / PITCH;
/** A free piece answers anywhere within 60 units of its centre: 120 across. */
export const HIT = 60;
/** The memoized search for a hint stops after this many states and the route fallback takes over. */
export const SEARCH_CAP = 200_000;

export interface PilePlan {
  id: number;
  name: string;
  pieces: number;
  kinds: number;
  layers: number;
  /** Tray slots: 3 (the basket) in asked mode, else 5, the most that fits beside the pet at 104 units a slot. */
  tray: 3 | 5;
  /** Levels 1–2 name one kind at a time and only it is taken. */
  asked: boolean;
  /** Levels 6–8 end with the pet counting the baskets by threes. */
  count: boolean;
}

export const PLANS: readonly PilePlan[] = [
  { id: 1, name: 'Find three, flat', pieces: 6, kinds: 2, layers: 1, tray: 3, asked: true, count: false },
  { id: 2, name: 'Find three in a little pile', pieces: 9, kinds: 3, layers: 2, tray: 3, asked: true, count: false },
  { id: 3, name: 'Any three you like', pieces: 6, kinds: 2, layers: 1, tray: 5, asked: false, count: false },
  { id: 4, name: 'A little heap, a little tray', pieces: 9, kinds: 3, layers: 2, tray: 5, asked: false, count: false },
  { id: 5, name: 'Four kinds', pieces: 12, kinds: 4, layers: 2, tray: 5, asked: false, count: false },
  { id: 6, name: 'Five kinds, three layers', pieces: 15, kinds: 5, layers: 3, tray: 5, asked: false, count: true },
  { id: 7, name: 'Six kinds', pieces: 18, kinds: 6, layers: 3, tray: 5, asked: false, count: true },
  { id: 8, name: 'The big heap', pieces: 24, kinds: 8, layers: 3, tray: 5, asked: false, count: true },
];
export const planFor = (level: number): PilePlan => PLANS[Math.max(0, Math.min(PLANS.length - 1, Math.floor(level) - 1))];

export const fullMask = (n: number) => (1 << n) - 1;
export const present = (mask: number, i: number) => !!(mask & (1 << i));

/** Whether upper piece `a` lies on lower piece `b`. */
export const covers = (a: Cell, b: Cell) => a.z > b.z && Math.hypot(a.x - b.x, a.y - b.y) < OVERLAP;

/** Free: nothing present lies on it. There is no side rule, so taking pieces only ever frees others. */
export function free(cells: readonly Cell[], mask: number, i: number): boolean {
  if (!present(mask, i)) return false;
  for (let j = 0; j < cells.length; j++) if (j !== i && present(mask, j) && covers(cells[j], cells[i])) return false;
  return true;
}
export const freePieces = (cells: readonly Cell[], mask: number) => cells.map((_, i) => i).filter((i) => free(cells, mask, i));

/** How many of each kind sit in the tray: every kind has three pieces, so it is the number taken, mod 3. */
export function tray(board: Board, mask: number): number[] {
  const out = new Array<number>(KINDS.length).fill(0);
  board.kinds.forEach((k, i) => { if (!present(mask, i)) out[k]++; });
  return out.map((n) => n % 3);
}
export const trayTotal = (board: Board, mask: number) => tray(board, mask).reduce((a, b) => a + b, 0);
/** The pieces in the tray (taken, and their kind not yet popped). */
export function trayPieces(board: Board, mask: number): number[] {
  const t = tray(board, mask);
  return board.kinds.map((_, i) => i).filter((i) => !present(mask, i) && t[board.kinds[i]] > 0);
}

export type Refusal = 'gone' | 'covered' | 'wrong-kind' | 'full';
export type Take = { mask: number; pop: number | null } | { refused: Refusal };

/**
 * Tap piece `i`. It goes into the tray if there is room or it makes three of its kind (the three pop at once).
 * In asked mode only the asked kind is taken. A full tray refuses anything else, so it never overflows.
 */
export function take(board: Board, mask: number, i: number, t: number, asked?: number): Take {
  if (!present(mask, i)) return { refused: 'gone' };
  if (!free(board.cells, mask, i)) return { refused: 'covered' };
  const kind = board.kinds[i];
  if (asked !== undefined && kind !== asked) return { refused: 'wrong-kind' };
  const counts = tray(board, mask);
  const pops = counts[kind] === 2;
  if (!pops && counts.reduce((a, b) => a + b, 0) >= t) return { refused: 'full' };
  return { mask: mask & ~(1 << i), pop: pops ? kind : null };
}
export const accepted = (r: Take): r is { mask: number; pop: number | null } => 'mask' in r;

/** Tap a piece in the tray: it goes back to its own place. Nothing was ever laid above that place. */
export function putBack(board: Board, mask: number, i: number): number | null {
  if (present(mask, i) || tray(board, mask)[board.kinds[i]] === 0) return null;
  return mask | (1 << i);
}
export const cleared = (mask: number) => mask === 0;

/* ---------------------------------------------------------------------------------------------- */
/* Search and hints                                                                               */
/* ---------------------------------------------------------------------------------------------- */

/** The taps the tray would accept now, those that make three first, then kinds already in the tray, then new kinds. */
function takes(board: Board, mask: number, t: number): { i: number; mask: number }[] {
  const counts = tray(board, mask);
  const total = counts.reduce((a, b) => a + b, 0);
  const out: { i: number; mask: number; rank: number }[] = [];
  for (const i of freePieces(board.cells, mask)) {
    const c = counts[board.kinds[i]];
    if (c < 2 && total >= t) continue;
    out.push({ i, mask: mask & ~(1 << i), rank: c === 2 ? 0 : c === 1 ? 1 : 2 });
  }
  return out.sort((a, b) => a.rank - b.rank);
}

export interface SearchBudget { left: number; dead: Set<number> }
export const budget = (cap = SEARCH_CAP): SearchBudget => ({ left: cap, dead: new Set() });

/** Can this heap be cleared by taps alone (no put-back)? Null when the budget ran out first. */
export function clearable(board: Board, mask: number, t: number, b: SearchBudget = budget()): boolean | null {
  if (mask === 0) return true;
  if (b.dead.has(mask)) return false;
  if (--b.left < 0) return null;
  for (const m of takes(board, mask, t)) {
    const r = clearable(board, m.mask, t, b);
    if (r !== false) return r;
  }
  b.dead.add(mask);
  return false;
}

export type Hint = { take: number; fallback: boolean } | { back: number; fallback: true };

/**
 * The thing to glow. In asked mode, a free piece of the asked kind. Otherwise a tap the search proves still clears
 * the heap (one that makes three, then one joining its kind, then any); failing that, or once on it, the route
 * fallback: put back what is not the route's next kind (a lone kind first), then take the heap in its clearing-route order.
 */
export function hintFor(board: Board, mask: number, t: number, opts: { asked?: number; fallback?: boolean; cap?: number } = {}): Hint | null {
  if (mask === 0) return null;
  if (opts.asked !== undefined) {
    const i = board.route.find((r) => board.kinds[r] === opts.asked && free(board.cells, mask, r));
    return i === undefined ? null : { take: i, fallback: false };
  }
  if (!opts.fallback) {
    const b = budget(opts.cap);
    for (const m of takes(board, mask, t)) {
      const r = clearable(board, m.mask, t, b);
      if (r === true) return { take: m.i, fallback: false };
      if (r === null) break;
    }
  }
  // Everything before the route's first present piece is gone, so that piece is free; only its own kind may wait in the tray.
  const next = board.route.find((r) => present(mask, r));
  if (next === undefined) return null;
  const counts = tray(board, mask);
  const stray = trayPieces(board, mask).filter((i) => board.kinds[i] !== board.kinds[next]);
  if (stray.length) {
    stray.sort((a, b) => counts[board.kinds[a]] - counts[board.kinds[b]]);
    return { back: stray[0], fallback: true };
  }
  return { take: next, fallback: true };
}

/* ---------------------------------------------------------------------------------------------- */
/* Boards                                                                                         */
/* ---------------------------------------------------------------------------------------------- */

/** A seeded clearing route: always some piece is free, since nothing covers the top layer. */
export function routeFor(cells: readonly Cell[], rng: Rng): number[] {
  let mask = fullMask(cells.length);
  const out: number[] = [];
  while (mask) {
    const open = freePieces(cells, mask);
    if (!open.length) throw new Error('Pile Match shape has no free piece');
    const i = rng.pick(open);
    out.push(i);
    mask &= ~(1 << i);
  }
  return out;
}

/** Kinds dealt in consecutive triples along the route, so taking the heap in route order never holds more than two. */
export function assign(cells: readonly Cell[], kinds: readonly number[], rng: Rng): Board {
  if (cells.length !== kinds.length * 3) throw new Error('Pile Match needs three pieces of each kind');
  const route = routeFor(cells, rng);
  const out = new Array<number>(cells.length).fill(0);
  route.forEach((i, n) => { out[i] = kinds[Math.floor(n / 3)]; });
  return { cells, kinds: out, route };
}

/** The round's heap. Level 1 always asks for apples, then shells. */
export function makeBoard(level: number, rng: Rng): Board {
  const plan = planFor(level);
  const shapes = SHAPES[plan.id];
  const cells = shapes[rng.int(0, shapes.length - 1)];
  const kinds = plan.id === 1 ? [APPLE, SHELL] : rng.shuffle(KINDS.map((_, k) => k)).slice(0, plan.kinds);
  return assign(cells, kinds, rng);
}

/** The asked kind in asked mode: the route's first triple not yet gathered. */
export function askedKind(board: Board, mask: number): number | undefined {
  for (let n = 0; n < board.route.length; n += 3) {
    const k = board.kinds[board.route[n]];
    if (board.route.slice(n, n + 3).some((i) => present(mask, i))) return k;
  }
  return undefined;
}

/* ---------------------------------------------------------------------------------------------- */
/* Layout                                                                                         */
/* ---------------------------------------------------------------------------------------------- */

export const HEADER = 120;
export const SLOT_W = 104;
export const SLOT_H = 120;
export const SLOT_GAP = 8;
export const BASKET_W = 150;
/** The asked kind's picture tag at the tray's left in asked mode. */
export const TAG_W = 104;
const ROW_GAP = 24;
const LEFT = 150;

export interface Rect { x: number; y: number; w: number; h: number }
export interface PileLayout {
  /** Every piece's centre, in view units. */
  pieces: { x: number; y: number }[];
  slots: Rect[];
  basket: Rect;
  tag: Rect | null;
  /** View units per heap unit; always 1 on the views the app makes, since they are at least 1024 × 768. */
  scale: number;
}

/** The heap under the header, the tray and basket in one row along the bottom, everything right of the pet's corner. */
export function pileLayout(cells: readonly Cell[], t: number, asked: boolean, v: View): PileLayout {
  const right = v.w - 40;
  const rowW = (asked ? TAG_W + ROW_GAP : 0) + t * SLOT_W + (t - 1) * SLOT_GAP + ROW_GAP + BASKET_W;
  let x = (LEFT + right) / 2 - rowW / 2;
  const y = v.h - 20 - SLOT_H;
  let tag: Rect | null = null;
  if (asked) { tag = { x, y, w: TAG_W, h: SLOT_H }; x += TAG_W + ROW_GAP; }
  const slots = Array.from({ length: t }, (_, k) => ({ x: x + k * (SLOT_W + SLOT_GAP), y, w: SLOT_W, h: SLOT_H }));
  const basket = { x: x + t * SLOT_W + (t - 1) * SLOT_GAP + ROW_GAP, y, w: BASKET_W, h: SLOT_H };
  const xs = cells.map((c) => c.x), ys = cells.map((c) => c.y);
  const minX = Math.min(...xs), maxX = Math.max(...xs), minY = Math.min(...ys), maxY = Math.max(...ys);
  const heapW = (maxX - minX) * PITCH + 2 * RADIUS, heapH = (maxY - minY) * PITCH + 2 * RADIUS;
  const top = HEADER, bottom = y - 40;
  const scale = Math.min(1, (right - LEFT) / heapW, (bottom - top) / heapH);
  const cx = (LEFT + right) / 2, cy = (top + bottom) / 2;
  const pieces = cells.map((c) => ({
    x: cx + ((c.x - (minX + maxX) / 2) * PITCH) * scale,
    y: cy + ((c.y - (minY + maxY) / 2) * PITCH) * scale,
  }));
  return { pieces, slots, basket, tag, scale };
}

/** What a touch at (x, y) lands on: the free piece it is inside, else the topmost covered piece under it. */
export function pieceAt(board: Board, mask: number, layout: PileLayout, x: number, y: number): { i: number; free: boolean } | null {
  const near = (i: number, r: number) => Math.hypot(layout.pieces[i].x - x, layout.pieces[i].y - y) <= r * layout.scale;
  for (const i of freePieces(board.cells, mask)) if (near(i, HIT)) return { i, free: true };
  let best: number | null = null;
  board.cells.forEach((c, i) => {
    if (!present(mask, i) || !near(i, RADIUS)) return;
    if (best === null || c.z > board.cells[best].z) best = i;
  });
  return best === null ? null : { i: best, free: false };
}

/** The tray slot under (x, y), if any. */
export const slotAt = (layout: PileLayout, x: number, y: number) =>
  layout.slots.findIndex((s) => x >= s.x && x <= s.x + s.w && y >= s.y && y <= s.y + s.h);
