import type { Rng } from '../../engine/random';
import type { View } from '../../engine/view';

/**
 * Jar Sort's rules. A jar is a bottom-to-top list of fruit kinds (0 strawberry, 1 blueberry, 2 orange, 3 pear, 4 plum); a move
 * takes the top piece of one jar and puts it on another that has room and is empty or has the same kind on top (the ball rule:
 * one piece per move). Solved: every jar is empty or full of one kind, and on a labelled board each kind sits on its own mat.
 */

export type Jar = number[];
export type Board = Jar[];
/** The kind each jar's mat asks for, or null for a spare jar without one. */
export type Labels = (number | null)[];
export interface Move {
  from: number;
  to: number;
}

export const FRUITS = ['strawberry', 'blueberry', 'orange', 'pear', 'plum'] as const;
export type Fruit = (typeof FRUITS)[number];

export interface JarPlan {
  id: number;
  name: string;
  jars: number;
  cap: number;
  kinds: number;
  /** The solver's shortest move count for this level's boards, inclusive. Never shown to her. */
  par: [number, number];
  /** Boards in one round. */
  boards: number;
  /** Jars that could take a lifted piece brighten, and a refused move is not a miss. */
  lit: boolean;
  /** Four jars stand on fruit mats and each kind has to end in its own. */
  labels: boolean;
}

export const PLANS: JarPlan[] = [
  { id: 1, name: 'Two kinds, two jars to fill', jars: 3, cap: 2, kinds: 2, par: [2, 3], boards: 2, lit: true, labels: false },
  { id: 2, name: 'Two kinds, taller jars', jars: 3, cap: 3, kinds: 2, par: [3, 5], boards: 2, lit: true, labels: false },
  { id: 3, name: 'Three kinds, one spare jar', jars: 4, cap: 3, kinds: 3, par: [4, 7], boards: 2, lit: false, labels: false },
  { id: 4, name: 'Three kinds, two spare jars', jars: 5, cap: 4, kinds: 3, par: [6, 9], boards: 2, lit: false, labels: false },
  { id: 5, name: 'Four kinds', jars: 6, cap: 4, kinds: 4, par: [9, 13], boards: 1, lit: false, labels: false },
  { id: 6, name: 'Four kinds, one spare jar: plan ahead', jars: 5, cap: 4, kinds: 4, par: [10, 15], boards: 1, lit: false, labels: false },
  { id: 7, name: 'Five kinds', jars: 7, cap: 4, kinds: 5, par: [12, 18], boards: 1, lit: false, labels: false },
  { id: 8, name: 'Every fruit has its jar', jars: 6, cap: 4, kinds: 4, par: [10, 16], boards: 1, lit: false, labels: true },
];

export function planFor(level: number): JarPlan {
  return PLANS[Math.min(PLANS.length, Math.max(1, Math.round(level))) - 1];
}

/** Reads a board written as digits, one jar per `|`-separated part, bottom first ("01|1|0"). */
export function parse(s: string): Board {
  return s.split('|').map((j) => [...j].map(Number));
}

export function render(b: Board): string {
  return b.map((j) => j.join('')).join('|');
}

/** Level 8's mats: the first `kinds` jars ask for kinds 0, 1, …; the rest are spare. */
export function matLabels(plan: JarPlan): Labels | undefined {
  if (!plan.labels) return undefined;
  return Array.from({ length: plan.jars }, (_, i) => (i < plan.kinds ? i : null));
}

const top = (j: Jar) => (j.length ? j[j.length - 1] : -1);

export function legal(b: Board, cap: number, from: number, to: number): boolean {
  if (from === to || !b[from]?.length || !b[to]) return false;
  const t = b[to];
  return t.length < cap && (t.length === 0 || top(t) === top(b[from]));
}

/** Why a move is refused, for the spoken reason: the target is full, or a different kind is on top. Null when it is legal (or there is nothing to lift). */
export function refusal(b: Board, cap: number, from: number, to: number): 'full' | 'kind' | null {
  if (from === to || !b[from]?.length || legal(b, cap, from, to)) return null;
  return b[to].length >= cap ? 'full' : 'kind';
}

/** The board after a legal move, as a new board; the old one is untouched. */
export function move(b: Board, from: number, to: number): Board {
  const next = b.map((j) => j.slice());
  next[to].push(next[from].pop()!);
  return next;
}

export function uniformFull(j: Jar, cap: number): boolean {
  return j.length === cap && j.every((k) => k === j[0]);
}

export function solved(b: Board, cap: number, labels?: Labels): boolean {
  if (!b.every((j) => j.length === 0 || uniformFull(j, cap))) return false;
  return !labels || labels.every((k, i) => k === null || (b[i].length === cap && b[i][0] === k));
}

export function moves(b: Board, cap: number): Move[] {
  const out: Move[] = [];
  for (let from = 0; from < b.length; from++) for (let to = 0; to < b.length; to++) if (legal(b, cap, from, to)) out.push({ from, to });
  return out;
}

/**
 * A key shared by boards that are the same puzzle: jars in any order, and (without mats) kinds under any names.
 * It need not be perfect; two keys for one puzzle only cost a repeat in the search.
 */
export function canonical(b: Board, labels?: Labels): string {
  if (labels) {
    // Mats pin their jars; only the spare jars can trade places.
    const fixed = labels.map((k, i) => (k === null ? null : b[i].join('')));
    const spare = b.filter((_, i) => labels[i] === null).map((j) => j.join('')).sort();
    return fixed.filter((s) => s !== null).join('|') + '#' + spare.join('|');
  }
  const sorted = b.map((j) => j.join('')).sort();
  const names = new Map<string, string>();
  const renamed = sorted.map((j) => [...j].map((k) => names.get(k) ?? (names.set(k, String(names.size)), String(names.size - 1))).join(''));
  return renamed.sort().join('|');
}

export const SEARCH_CAP = 200_000;

export type SearchResult = Move[] | 'none' | 'capped';

/** Breadth-first over puzzle keys from `b`: a shortest move list, 'none' when every reachable board was seen without a finish, 'capped' past `limit` keys. */
export function search(b: Board, cap: number, labels?: Labels, limit = SEARCH_CAP): SearchResult {
  if (solved(b, cap, labels)) return [];
  const startKey = canonical(b, labels);
  // Each key keeps the real board it was reached as, so a path's moves are real jar numbers.
  const seen = new Map<string, { board: Board; parent: string | null; move: Move | null }>([[startKey, { board: b, parent: null, move: null }]]);
  let frontier = [startKey];
  while (frontier.length) {
    const next: string[] = [];
    for (const key of frontier) {
      const board = seen.get(key)!.board;
      for (const m of moves(board, cap)) {
        const after = move(board, m.from, m.to);
        const k = canonical(after, labels);
        if (seen.has(k)) continue;
        seen.set(k, { board: after, parent: key, move: m });
        if (solved(after, cap, labels)) {
          const path: Move[] = [];
          for (let at: string | null = k; at; at = seen.get(at)!.parent) {
            const step = seen.get(at)!;
            if (step.move) path.unshift(step.move);
          }
          return path;
        }
        if (seen.size > limit) return 'capped';
        next.push(k);
      }
    }
    frontier = next;
  }
  return 'none';
}

/** A shortest solution from `b`, or null when there is none (or the search ran out of room). */
export function solve(b: Board, cap: number, labels?: Labels, limit = SEARCH_CAP): Move[] | null {
  const r = search(b, cap, labels, limit);
  return Array.isArray(r) ? r : null;
}

/**
 * Help from where she is. A move whose board is one move closer to finished; 'stuck' when no move is left or the search proved
 * there is no way from here (take one back); 'back' with how many moves to take back when the search ran out of room, to her most
 * recent board with a known way, the start board at worst. `history` is her boards before this one, oldest first.
 */
export type Hint = { kind: 'move'; move: Move } | { kind: 'stuck' } | { kind: 'back'; steps: number };

export function hintMove(b: Board, cap: number, labels: Labels | undefined, history: Board[], limit = SEARCH_CAP): Hint {
  if (!moves(b, cap).length) return { kind: 'stuck' };
  const r = search(b, cap, labels, limit);
  if (Array.isArray(r)) return r.length ? { kind: 'move', move: r[0] } : { kind: 'stuck' };
  if (r === 'none') return { kind: 'stuck' };
  for (let i = history.length - 1; i > 0; i--) if (Array.isArray(search(history[i], cap, labels, limit))) return { kind: 'back', steps: history.length - i };
  return { kind: 'back', steps: history.length };
}

/**
 * The obvious player: drop on the same kind when it can, else into an empty jar from a mixed one, never back to a board it has
 * seen, first such move in jar order. Level 6's boards are chosen so this player cannot finish: they need a move that looks worse.
 */
export function greedy(b: Board, cap: number, labels?: Labels, steps = 200): boolean {
  const seen = new Set([render(b)]);
  let board = b;
  for (let i = 0; i < steps; i++) {
    if (solved(board, cap, labels)) return true;
    const all = moves(board, cap).filter((m) => !seen.has(render(move(board, m.from, m.to))));
    const same = all.find((m) => board[m.to].length > 0);
    const empty = all.find((m) => board[m.to].length === 0 && !board[m.from].every((k) => k === board[m.from][0]));
    const pick = same ?? empty;
    if (!pick) return false;
    board = move(board, pick.from, pick.to);
    seen.add(render(board));
  }
  return false;
}

/** A frozen board as she sees it: kinds renamed and jars shuffled from the seed (level 1 keeps its authored order). Neither changes the shortest solution. */
export function present(s: string, plan: JarPlan, rng: Rng): { board: Board; labels?: Labels } {
  const raw = parse(s);
  const mats = matLabels(plan);
  if (plan.id === 1) return { board: raw, labels: mats };
  const names = rng.shuffle([0, 1, 2, 3, 4]);
  const order = rng.shuffle(raw.map((_, i) => i));
  return {
    board: order.map((i) => raw[i].map((k) => names[k])),
    labels: mats && order.map((i) => (mats[i] === null ? null : names[mats[i]!])),
  };
}

/* ---------------------------------------------------------------------------------------------- */
/* Layout                                                                                          */
/* ---------------------------------------------------------------------------------------------- */

export const JAR_W = 104;
export const HIT_W = 120;
export const PIECE = 52;
export const RIM = 36;
export const HEADER = 120;
/** The round arrow's middle is this far in from the bottom-right corner; its radius is 54. */
export const UNDO_INSET = 80;
const ROW_GAP = 40;
const MIN_PITCH = 130;

export const jarHeight = (cap: number) => cap * PIECE + RIM;

/** A jar's place: its middle `x`, its base `y` (the bottom of the glass), and its hit box. */
export interface JarSpot {
  x: number;
  y: number;
  hit: { x: number; y: number; w: number; h: number };
}

function rowXs(n: number, v: View): number[] {
  const left = 150, right = v.w - 40;
  const step = Math.min(150, (right - left) / Math.max(1, n));
  const mid = (left + right) / 2;
  return Array.from({ length: n }, (_, i) => mid + (i - (n - 1) / 2) * step);
}

/** One row when the jars get at least 130 units each, else two with the extra jar on top. Clear of the pet's corner and the round arrow. */
export function jarLayout(n: number, cap: number, v: View): JarSpot[] {
  const h = jarHeight(cap);
  const room = (v.w - 190) / n;
  const spot = (x: number, base: number): JarSpot => ({ x, y: base, hit: { x: x - HIT_W / 2, y: base - h, w: HIT_W, h } });
  if (room >= MIN_PITCH) {
    // One row, standing in the middle of the space under the header and above the round arrow.
    const bottom = v.h - UNDO_INSET - 54 - 20;
    const base = Math.min(bottom, HEADER + Math.max(0, (bottom - HEADER - h) / 2) + h);
    return rowXs(n, v).map((x) => spot(x, base));
  }
  const upper = Math.ceil(n / 2), lower = n - upper;
  const total = 2 * h + ROW_GAP;
  const topY = HEADER + Math.max(0, (v.h - 40 - HEADER - total) / 2);
  return [...rowXs(upper, v).map((x) => spot(x, topY + h)), ...rowXs(lower, v).map((x) => spot(x, topY + total))];
}
