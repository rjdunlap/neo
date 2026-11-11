import type { Rng } from '../../engine/random';
import type { BandLevels } from '../../progress/difficulty';

export type Direction = 'left' | 'up' | 'right' | 'down';
export const DIRECTIONS: readonly Direction[] = ['left', 'up', 'right', 'down'];
export type Board = readonly number[];
export const SIZE = 3;
export const PLANS = [
  { target: 16, name: 'Make 16 · open snowfield', board: [2, 0, 2, 0, 4, 0, 4, 0, 4] },
  { target: 32, name: 'Make 32 · choose your pairs', board: [2, 4, 2, 4, 0, 4, 8, 0, 8] },
  { target: 64, name: 'Make 64 · make room first', board: [2, 4, 2, 8, 4, 8, 16, 4, 16] },
] as const;

export const LEVELS: BandLevels = { grownup: { min: 1, max: 3 } };
export const planFor = (level: number) =>
  PLANS[Math.max(0, Math.min(PLANS.length - 1, Math.floor(level) - 1))];

/** Read a row/column from its leading edge. Equal neighbours merge once per slide. */
export function slide(board: Board, direction: Direction) {
  const out = Array<number>(SIZE * SIZE).fill(0);
  const motions: { from: number; to: number }[] = [];
  let merges = 0;
  for (let line = 0; line < SIZE; line++) {
    const indices = Array.from({ length: SIZE }, (_, k) => {
      if (direction === 'left') return line * SIZE + k;
      if (direction === 'right') return line * SIZE + SIZE - 1 - k;
      if (direction === 'up') return k * SIZE + line;
      return (SIZE - 1 - k) * SIZE + line;
    });
    const occupied = indices.filter((i) => board[i] > 0),
      packed: number[] = [];
    for (let k = 0; k < occupied.length; k++) {
      const from = occupied[k],
        to = indices[packed.length];
      motions.push({ from, to });
      if (board[from] === board[occupied[k + 1]]) {
        motions.push({ from: occupied[k + 1], to });
        packed.push(board[from] * 2);
        k++;
        merges++;
      } else packed.push(board[from]);
    }
    indices.forEach((i, k) => {
      out[i] = packed[k] ?? 0;
    });
  }
  return { board: out, changed: out.some((v, i) => v !== board[i]), merges, motions };
}

export const complete = (board: Board, target: number) =>
  board.filter((v) => v > 0).length === 1 && board.includes(target);

/** Finite boards, no arrivals: breadth-first search gives a shortest route, or an honest dead end. */
export function solve(board: Board, target: number): Direction[] | null {
  const nodes: { board: Board; parent: number; direction: Direction | null }[] = [
    { board, parent: -1, direction: null },
  ];
  const seen = new Set([board.join(',')]);
  for (let head = 0; head < nodes.length; head++) {
    const node = nodes[head];
    if (complete(node.board, target)) {
      const route: Direction[] = [];
      for (let at = head; nodes[at].parent >= 0; at = nodes[at].parent) route.push(nodes[at].direction!);
      return route.reverse();
    }
    for (const direction of DIRECTIONS) {
      const next = slide(node.board, direction),
        key = next.board.join(',');
      if (next.changed && !seen.has(key)) {
        seen.add(key);
        nodes.push({ board: next.board, parent: head, direction });
      }
    }
  }
  return null;
}

/** The eight turns and mirrors of a 3×3 board; each keeps the puzzle's rules and depth. */
export function transform(board: Board, turns: number, reflect: boolean) {
  const out = Array<number>(SIZE * SIZE).fill(0);
  board.forEach((v, i) => {
    let x = i % SIZE,
      y = Math.floor(i / SIZE);
    if (reflect) x = SIZE - 1 - x;
    for (let t = 0; t < turns; t++) [x, y] = [SIZE - 1 - y, x];
    out[y * SIZE + x] = v;
  });
  return out;
}

/** The distinct boards a frozen board turns into: 8 unless it is symmetric. */
export function orbit(board: Board) {
  const out = new Set<string>();
  for (let turns = 0; turns < 4; turns++)
    for (const reflect of [false, true]) out.add(transform(board, turns, reflect).join(','));
  return out;
}

/** Every board reachable by slides, and how many of them can no longer finish (dead ends for Undo). */
export function explore(board: Board, target: number) {
  const seen = new Map<string, Board>([[board.join(','), board]]),
    queue: Board[] = [board];
  for (let head = 0; head < queue.length; head++)
    for (const direction of DIRECTIONS) {
      const next = slide(queue[head], direction);
      const key = next.board.join(',');
      if (next.changed && !seen.has(key)) {
        seen.set(key, next.board);
        queue.push(next.board);
      }
    }
  const deadEnds = queue.filter((b) => solve(b, target) === null).length;
  return { states: queue.length, deadEnds };
}

/**
 * A seeded round: one of the level's frozen boards (src/games/snowball-merge/boards.ts, generated), turned and mirrored.
 * The boards are passed in so this file stays free of runtime imports for the generator script.
 */
export function makePuzzle(level: number, rng: Rng, boards: readonly Board[]) {
  const plan = planFor(level),
    pick = rng.int(0, boards.length - 1),
    turns = rng.int(0, 3),
    reflect = rng.chance(0.5);
  return { board: transform(boards[pick] ?? plan.board, turns, reflect), target: plan.target };
}

/** Which control glows, why, and how many glows counted as help. Pure so its accounting can be tested. */
export interface Help {
  hinted: Direction | 'undo' | null;
  /** Inert arrow presses in a row since the board last changed. */
  inert: number;
  hints: number;
}
export type HelpEvent = 'inert' | 'changed' | 'ask';
export const NO_HELP: Help = { hinted: null, inert: 0, hints: 0 };

/**
 * `route` is the shortest route from the board after the event (null at a dead end).
 * - Two inert arrows in a row light the route's next arrow; a dead end lights Undo. Either counts as one hint.
 * - Staying among dead ends (another stuck slide, or an Undo to an earlier dead end) keeps the Undo glow without counting
 *   again; returning to a board that can finish ends it, so a later, separate dead end counts once more.
 * - Asking while something glows counts nothing.
 */
export function nextHelp(help: Help, event: HelpEvent, route: readonly Direction[] | null): Help {
  if (event === 'ask') {
    if (help.hinted) return help;
    return { ...help, hinted: route?.[0] ?? 'undo', hints: help.hints + 1 };
  }
  if (event === 'inert') {
    const inert = help.inert + 1;
    if (help.hinted || inert < 2) return { ...help, inert };
    return { hinted: route?.[0] ?? 'undo', inert: 0, hints: help.hints + 1 };
  }
  if (route !== null) return { ...help, hinted: null, inert: 0 };
  if (help.hinted === 'undo') return { ...help, inert: 0 };
  return { hinted: 'undo', inert: 0, hints: help.hints + 1 };
}

/** Each size's look: radius grows a little with each doubling, capped so the number and the ball fit the cell. */
export function sizeLook(value: number) {
  const step = Math.max(0, Math.log2(Math.max(2, value)) - 1);
  return {
    color:
      value <= 4 ? 'blue' : value === 8 ? 'teal' : value === 16 ? 'purple' : value === 32 ? 'pink' : 'yellow',
    radius: Math.min(42, 34 + step * 1.6),
    scarf: value >= 64,
  } as const;
}

export const FIELD_LOOKS = ['morning', 'dusk', 'flurry'] as const;
export type FieldLook = (typeof FIELD_LOOKS)[number];
