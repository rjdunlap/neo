import type { Rng } from '../../engine/random';
import type { View } from '../../engine/view';
import type { BandLevels } from '../../progress/difficulty';

/**
 * Jar Sort's rules. A jar is a bottom-to-top list of fruit kinds (0 strawberry, 1 blueberry, 2 orange, 3 pear, 4 plum, 5 cherries, 6 lemon); a move
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

export const FRUITS = ['strawberry', 'blueberry', 'orange', 'pear', 'plum', 'cherry', 'lemon'] as const;
export type Fruit = (typeof FRUITS)[number];

/** The pantry behind the jars: the window's light and the lids' colour change with the round; the rules never do. */
export const LOOKS = ['morning', 'rain', 'evening'] as const;
export type Look = (typeof LOOKS)[number];
export const LID_COLOR: Record<Look, 'red' | 'blue' | 'purple'> = {
  morning: 'red',
  rain: 'blue',
  evening: 'purple',
};

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
  /** Each jar's capacity in the frozen board's order, when they differ; `cap` is then the tall jars' height and each kind's count. */
  caps?: number[];
}

/** One capacity for every jar, or one per jar in board order. */
export type Caps = number | readonly number[];
export const capAt = (cap: Caps, i: number) => (typeof cap === 'number' ? cap : cap[i]);
export const capsFor = (plan: JarPlan): Caps => plan.caps ?? plan.cap;

export const PLANS: JarPlan[] = [
  {
    id: 1,
    name: 'Two kinds, two jars to fill',
    jars: 3,
    cap: 2,
    kinds: 2,
    par: [2, 3],
    boards: 2,
    lit: true,
    labels: false,
  },
  {
    id: 2,
    name: 'Two kinds, taller jars',
    jars: 3,
    cap: 3,
    kinds: 2,
    par: [3, 5],
    boards: 2,
    lit: true,
    labels: false,
  },
  {
    id: 3,
    name: 'Three kinds, one spare jar',
    jars: 4,
    cap: 3,
    kinds: 3,
    par: [4, 7],
    boards: 2,
    lit: false,
    labels: false,
  },
  {
    id: 4,
    name: 'Three kinds, two spare jars',
    jars: 5,
    cap: 4,
    kinds: 3,
    par: [6, 9],
    boards: 2,
    lit: false,
    labels: false,
  },
  {
    id: 5,
    name: 'Four kinds',
    jars: 6,
    cap: 4,
    kinds: 4,
    par: [9, 13],
    boards: 1,
    lit: false,
    labels: false,
  },
  {
    id: 6,
    name: 'Four kinds, one spare jar: plan ahead',
    jars: 5,
    cap: 4,
    kinds: 4,
    par: [10, 15],
    boards: 1,
    lit: false,
    labels: false,
  },
  {
    id: 7,
    name: 'Five kinds',
    jars: 7,
    cap: 4,
    kinds: 5,
    par: [12, 18],
    boards: 1,
    lit: false,
    labels: false,
  },
  {
    id: 8,
    name: 'Every fruit has its jar',
    jars: 6,
    cap: 4,
    kinds: 4,
    par: [10, 16],
    boards: 1,
    lit: false,
    labels: true,
  },
  // Level 9 is level 3's three kinds in four jars with the lit jars and free refusals still on: a gentler step between 2 and 3.
  {
    id: 9,
    name: 'Three kinds, bright jars',
    jars: 4,
    cap: 3,
    kinds: 3,
    par: [4, 6],
    boards: 2,
    lit: true,
    labels: false,
  },
  // Level 10 is four tall jars and one little jar of two: the parking place is smaller, so which two fruit it holds matters.
  {
    id: 10,
    name: 'A little jar to park in',
    jars: 5,
    cap: 4,
    kinds: 3,
    par: [8, 12],
    boards: 1,
    lit: false,
    labels: false,
    caps: [4, 4, 4, 4, 2],
  },
];

export const LEVELS: BandLevels = {
  preschool: { min: 1, max: 9, order: [1, 2, 9, 3] },
  prek: { min: 2, max: 9, order: [2, 9, 3, 4, 5] },
  school: { min: 4, max: 10, order: [4, 5, 6, 7, 8, 10] },
};

/** Easy levels with high IDs, placed earlier by a band's `order`. */
export const ENTRY_LEVELS = [9] as const;

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

export function legal(b: Board, cap: Caps, from: number, to: number): boolean {
  if (from === to || !b[from]?.length || !b[to]) return false;
  const t = b[to];
  return t.length < capAt(cap, to) && (t.length === 0 || top(t) === top(b[from]));
}

/** Why a move is refused, for the spoken reason: the target is full, or a different kind is on top. Null when it is legal (or there is nothing to lift). */
export function refusal(b: Board, cap: Caps, from: number, to: number): 'full' | 'kind' | null {
  if (from === to || !b[from]?.length || legal(b, cap, from, to)) return null;
  return b[to].length >= capAt(cap, to) ? 'full' : 'kind';
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

export function solved(b: Board, cap: Caps, labels?: Labels): boolean {
  if (!b.every((j, i) => j.length === 0 || uniformFull(j, capAt(cap, i)))) return false;
  return !labels || labels.every((k, i) => k === null || (b[i].length === capAt(cap, i) && b[i][0] === k));
}

export function moves(b: Board, cap: Caps): Move[] {
  const out: Move[] = [];
  for (let from = 0; from < b.length; from++)
    for (let to = 0; to < b.length; to++) if (legal(b, cap, from, to)) out.push({ from, to });
  return out;
}

/**
 * A key shared by boards that are the same puzzle: jars in any order, and (without mats) kinds under any names. Jars of
 * different capacities are told apart by their capacity. It need not be perfect; two keys for one puzzle only cost a repeat.
 */
export function canonical(b: Board, labels?: Labels, cap?: Caps): string {
  if (cap !== undefined && typeof cap !== 'number' && new Set(cap).size > 1 && !labels) {
    // Capacity first, so jars sort by size and kinds are named in that order; the capacity itself is never renamed.
    const sorted = b
      .map((j, i) => [capAt(cap, i), j.join('')] as const)
      .sort((x, y) => x[0] - y[0] || (x[1] < y[1] ? -1 : x[1] > y[1] ? 1 : 0));
    const names = new Map<string, string>();
    return sorted
      .map(
        ([c, j]) =>
          c +
          ':' +
          [...j]
            .map((k) => names.get(k) ?? (names.set(k, String(names.size)), String(names.size - 1)))
            .join(''),
      )
      .sort()
      .join('|');
  }
  if (labels) {
    // Mats pin their jars; only the spare jars can trade places.
    const fixed = labels.map((k, i) => (k === null ? null : b[i].join('')));
    const spare = b
      .filter((_, i) => labels[i] === null)
      .map((j) => j.join(''))
      .sort();
    return fixed.filter((s) => s !== null).join('|') + '#' + spare.join('|');
  }
  const sorted = b.map((j) => j.join('')).sort();
  const names = new Map<string, string>();
  const renamed = sorted.map((j) =>
    [...j].map((k) => names.get(k) ?? (names.set(k, String(names.size)), String(names.size - 1))).join(''),
  );
  return renamed.sort().join('|');
}

export const SEARCH_CAP = 200_000;

export type SearchResult = Move[] | 'none' | 'capped';

/** Breadth-first over puzzle keys from `b`: a shortest move list, 'none' when every reachable board was seen without a finish, 'capped' past `limit` keys. */
export function search(b: Board, cap: Caps, labels?: Labels, limit = SEARCH_CAP): SearchResult {
  if (solved(b, cap, labels)) return [];
  const startKey = canonical(b, labels, cap);
  // Each key keeps the real board it was reached as, so a path's moves are real jar numbers.
  const seen = new Map<string, { board: Board; parent: string | null; move: Move | null }>([
    [startKey, { board: b, parent: null, move: null }],
  ]);
  let frontier = [startKey];
  while (frontier.length) {
    const next: string[] = [];
    for (const key of frontier) {
      const board = seen.get(key)!.board;
      for (const m of moves(board, cap)) {
        const after = move(board, m.from, m.to);
        const k = canonical(after, labels, cap);
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
export function solve(b: Board, cap: Caps, labels?: Labels, limit = SEARCH_CAP): Move[] | null {
  const r = search(b, cap, labels, limit);
  return Array.isArray(r) ? r : null;
}

/**
 * Help from where she is. A move whose board is one move closer to finished; 'stuck' when no move is left or the search proved
 * there is no way from here (take one back); 'back' with how many moves to take back when the search ran out of room, to her most
 * recent board with a known way, the start board at worst. `history` is her boards before this one, oldest first.
 */
export type Hint = { kind: 'move'; move: Move } | { kind: 'stuck' } | { kind: 'back'; steps: number };

export function hintMove(
  b: Board,
  cap: Caps,
  labels: Labels | undefined,
  history: Board[],
  limit = SEARCH_CAP,
): Hint {
  if (!moves(b, cap).length) return { kind: 'stuck' };
  const r = search(b, cap, labels, limit);
  if (Array.isArray(r)) return r.length ? { kind: 'move', move: r[0] } : { kind: 'stuck' };
  if (r === 'none') return { kind: 'stuck' };
  for (let i = history.length - 1; i > 0; i--)
    if (Array.isArray(search(history[i], cap, labels, limit)))
      return { kind: 'back', steps: history.length - i };
  return { kind: 'back', steps: history.length };
}

/**
 * The obvious player: drop on the same kind when it can, else into an empty jar from a mixed one, never back to a board it has
 * seen, first such move in jar order. Level 6's boards are chosen so this player cannot finish: they need a move that looks worse.
 */
export function greedy(b: Board, cap: Caps, labels?: Labels, steps = 200): boolean {
  const seen = new Set([render(b)]);
  let board = b;
  for (let i = 0; i < steps; i++) {
    if (solved(board, cap, labels)) return true;
    const all = moves(board, cap).filter((m) => !seen.has(render(move(board, m.from, m.to))));
    const same = all.find((m) => board[m.to].length > 0);
    const empty = all.find(
      (m) => board[m.to].length === 0 && !board[m.from].every((k) => k === board[m.from][0]),
    );
    const pick = same ?? empty;
    if (!pick) return false;
    board = move(board, pick.from, pick.to);
    seen.add(render(board));
  }
  return false;
}

/**
 * The frozen boards of one round. Level 1's list is authored pairs (a two-move board, then a three-move one) and the seed picks a
 * pair; every other level draws its boards from the shuffled list.
 */
export function roundBoards(list: readonly string[], plan: JarPlan, rng: Rng, count: number): string[] {
  if (plan.id !== 1) return rng.shuffle([...list]).slice(0, count);
  const pair = rng.int(0, Math.floor(list.length / 2) - 1);
  return list.slice(pair * 2, pair * 2 + count);
}

/**
 * A frozen board as she sees it: kinds renamed from all seven fruits and jars shuffled from the seed (level 1 keeps its authored
 * jar order, so the lit jars stand where the pair was drawn), each jar's capacity moving with it. Neither changes the shortest solution.
 */
export function present(s: string, plan: JarPlan, rng: Rng): { board: Board; labels?: Labels; caps: Caps } {
  const raw = parse(s);
  const mats = matLabels(plan);
  const names = rng.shuffle(FRUITS.map((_, i) => i));
  const order = plan.id === 1 ? raw.map((_, i) => i) : rng.shuffle(raw.map((_, i) => i));
  return {
    board: order.map((i) => raw[i].map((k) => names[k])),
    labels: mats && order.map((i) => (mats[i] === null ? null : names[mats[i]!])),
    caps: plan.caps ? order.map((i) => plan.caps![i]) : plan.cap,
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
  const left = 150,
    right = v.w - 40;
  const step = Math.min(150, (right - left) / Math.max(1, n));
  const mid = (left + right) / 2;
  return Array.from({ length: n }, (_, i) => mid + (i - (n - 1) / 2) * step);
}

/**
 * One row when the jars get at least 130 units each, else two with the extra jar on top. Clear of the pet's corner and the round
 * arrow. Jars of different heights stand on one base line, each row as tall as the tallest jar.
 */
export function jarLayout(n: number, cap: Caps, v: View): JarSpot[] {
  const h = jarHeight(Math.max(...Array.from({ length: n }, (_, i) => capAt(cap, i))));
  const room = (v.w - 190) / n;
  const spot = (x: number, base: number, i: number): JarSpot => {
    const jh = jarHeight(capAt(cap, i));
    return { x, y: base, hit: { x: x - HIT_W / 2, y: base - jh, w: HIT_W, h: jh } };
  };
  if (room >= MIN_PITCH) {
    // One row, standing in the middle of the space under the header and above the round arrow.
    const bottom = v.h - UNDO_INSET - 54 - 20;
    const base = Math.min(bottom, HEADER + Math.max(0, (bottom - HEADER - h) / 2) + h);
    return rowXs(n, v).map((x, i) => spot(x, base, i));
  }
  const upper = Math.ceil(n / 2),
    lower = n - upper;
  const total = 2 * h + ROW_GAP;
  const topY = HEADER + Math.max(0, (v.h - 40 - HEADER - total) / 2);
  return [
    ...rowXs(upper, v).map((x, i) => spot(x, topY + h, i)),
    ...rowXs(lower, v).map((x, i) => spot(x, topY + total, upper + i)),
  ];
}
