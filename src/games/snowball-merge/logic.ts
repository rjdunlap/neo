import type { Rng } from '../../engine/random';
import type { BandLevels } from '../../progress/difficulty';

export type Direction = 'left' | 'up' | 'right' | 'down';
export const DIRECTIONS: readonly Direction[] = ['left', 'up', 'right', 'down'];
export type Board = readonly number[];
/** The side of the usual field. Level 7's is wider: every rule reads the side from the board it is given (`sizeOf`). */
export const SIZE = 3;
/** A field is square, so its side is the root of its cell count: 3 for nine cells, 4 for sixteen. */
export const sizeOf = (board: Board) => Math.round(Math.sqrt(board.length));
/** The ice rock (level 5): a cell that never moves and never joins. A line splits at it, and snowballs pack against it. */
export const ROCK = -1;
/** What finishes a round: one snowball of this size, or (level 6) exactly these snowballs and no others. */
export type Goal = number | readonly number[];
/**
 * Level 6's snowman: three 16s. Equal snowballs at the goal's biggest size are what make "when to stop" a real decision:
 * two 16s that meet join into a 32, and nothing unjoins. (A 32 and a 16, or any goal of different sizes, can never be overshot.)
 */
export const SNOWMAN: readonly number[] = [16, 16, 16];
/** Level 7's authored board, four cells a side. */
const WIDE_BOARD: Board = [8, 16, 0, 4, 4, 16, 8, 0, 32, 16, 2, 4, 0, 2, 16, 0];
export const PLANS: readonly { target: number; name: string; board: Board; goal?: readonly number[] }[] = [
  { target: 16, name: 'Make 16 · open snowfield', board: [2, 0, 2, 0, 4, 0, 4, 0, 4] },
  { target: 32, name: 'Make 32 · choose your pairs', board: [2, 4, 2, 4, 0, 4, 8, 0, 8] },
  { target: 64, name: 'Make 64 · make room first', board: [2, 4, 2, 8, 4, 8, 16, 4, 16] },
  { target: 128, name: 'Make 128 · the big snowball', board: [32, 32, 32, 16, 8, 2, 2, 4, 0] },
  { target: 64, name: 'Make 64 · the ice rock', board: [16, ROCK, 8, 0, 16, 8, 4, 8, 4] },
  // The snowman: `target` is still the snow on the field; the round ends at three 16s, so two 16s joining overshoots.
  {
    target: 48,
    goal: SNOWMAN,
    name: 'Build a snowman · keep the 16s apart',
    board: [4, 8, 2, 0, 2, 8, 16, 8, 0],
  },
  // A wider field: the same rules on sixteen cells, so the plan is longer and there is more room to park a snowball.
  {
    target: 128,
    name: 'Make 128 · a wider field',
    board: WIDE_BOARD,
  },
];

export const LEVELS: BandLevels = { grownup: { min: 1, max: 7 } };
export const planFor = (level: number) =>
  PLANS[Math.max(0, Math.min(PLANS.length - 1, Math.floor(level) - 1))];
export const goalOf = (plan: { target: number; goal?: readonly number[] }): Goal => plan.goal ?? plan.target;

/**
 * Read a row/column from its leading edge. Equal neighbours merge once per slide. An ice rock stays where it is and
 * splits its line: each stretch between rocks and edges packs on its own, so snowballs behind a rock stop beside it.
 * `rocked` says a snowball ended the slide resting against a rock.
 */
export function slide(board: Board, direction: Direction) {
  const SIZE = sizeOf(board);
  const out = Array<number>(SIZE * SIZE).fill(0);
  const motions: { from: number; to: number }[] = [];
  let merges = 0,
    rocked = false;
  for (let line = 0; line < SIZE; line++) {
    const indices = Array.from({ length: SIZE }, (_, k) => {
      if (direction === 'left') return line * SIZE + k;
      if (direction === 'right') return line * SIZE + SIZE - 1 - k;
      if (direction === 'up') return k * SIZE + line;
      return (SIZE - 1 - k) * SIZE + line;
    });
    const stretches: number[][] = [[]];
    for (const i of indices) {
      if (board[i] === ROCK) {
        out[i] = ROCK;
        stretches.push([]);
      } else stretches.at(-1)!.push(i);
    }
    stretches.forEach((stretch, behindRock) => {
      const occupied = stretch.filter((i) => board[i] > 0),
        packed: number[] = [];
      if (behindRock && occupied.length) rocked = true;
      for (let k = 0; k < occupied.length; k++) {
        const from = occupied[k],
          to = stretch[packed.length];
        motions.push({ from, to });
        if (board[from] === board[occupied[k + 1]]) {
          motions.push({ from: occupied[k + 1], to });
          packed.push(board[from] * 2);
          k++;
          merges++;
        } else packed.push(board[from]);
      }
      stretch.forEach((i, k) => {
        out[i] = packed[k] ?? 0;
      });
    });
  }
  return { board: out, changed: out.some((v, i) => v !== board[i]), merges, motions, rocked };
}

export function complete(board: Board, goal: Goal) {
  const snow = board.filter((v) => v > 0);
  if (typeof goal === 'number') return snow.length === 1 && snow[0] === goal;
  const want = [...goal].sort((a, b) => a - b);
  return snow.length === want.length && snow.sort((a, b) => a - b).every((v, i) => v === want[i]);
}

/**
 * Past the snowman: nothing unjoins, so a round has gone too far once, at the biggest size where the field and the goal
 * differ, the field holds more than the goal does (a 32, when the snowman is three 16s). Fewer there is fine: smaller snow can still
 * join up to it. Only Undo comes back from it. Always false for a one-snowball goal.
 */
export function overshot(board: Board, goal: Goal) {
  if (typeof goal === 'number') return false;
  const count = (list: readonly number[], v: number) => list.filter((n) => n === v).length;
  const sizes = [...new Set([...board.filter((v) => v > 0), ...goal])].sort((a, b) => b - a);
  const differs = sizes.find((v) => count(board, v) !== count(goal, v));
  return differs !== undefined && count(board, differs) > count(goal, differs);
}

/** Finite boards, no arrivals: breadth-first search gives a shortest route, or an honest dead end. */
export function solve(board: Board, target: Goal): Direction[] | null {
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

/** The eight turns and mirrors of a square board; each keeps the puzzle's rules and depth. */
export function transform(board: Board, turns: number, reflect: boolean) {
  const SIZE = sizeOf(board);
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

/**
 * The distance map of one starting board, built once: every board slides can reach from it, and for each one that can
 * still finish, how many slides its shortest finish takes. A board that is absent from `steps` is a dead end. The scene
 * reads its hints from this instead of searching again after every slide, which a sixteen-cell field would feel.
 */
export interface RouteMap {
  /** Slides to the nearest finish, by `board.join(',')`; only boards that can finish are listed. */
  readonly steps: ReadonlyMap<string, number>;
  /** Every board reachable from the start, finishable or not. */
  readonly states: number;
}
export function routeMap(start: Board, goal: Goal): RouteMap {
  const index = new Map<string, number>([[start.join(','), 0]]),
    boards: Board[] = [start],
    parents: number[][] = [[]];
  for (let head = 0; head < boards.length; head++)
    for (const direction of DIRECTIONS) {
      const next = slide(boards[head], direction);
      if (!next.changed) continue;
      const key = next.board.join(',');
      let at = index.get(key);
      if (at === undefined) {
        at = boards.length;
        index.set(key, at);
        boards.push(next.board);
        parents.push([]);
      }
      parents[at].push(head);
    }
  // Backwards from every finished board, a slide at a time: the first visit is the shortest way home.
  const steps = new Map<string, number>(),
    queue: number[] = [],
    dist = Array<number>(boards.length).fill(-1);
  boards.forEach((board, i) => {
    if (!complete(board, goal)) return;
    dist[i] = 0;
    queue.push(i);
  });
  for (let head = 0; head < queue.length; head++)
    for (const parent of parents[queue[head]])
      if (dist[parent] < 0) {
        dist[parent] = dist[queue[head]] + 1;
        queue.push(parent);
      }
  for (const [key, i] of index) if (dist[i] >= 0) steps.set(key, dist[i]);
  return { steps, states: boards.length };
}

/** A shortest route from `board` read off the map (one step down at a time), or null at a dead end. */
export function routeFrom(map: RouteMap, board: Board): Direction[] | null {
  let left = map.steps.get(board.join(','));
  if (left === undefined) return null;
  const route: Direction[] = [];
  while (left > 0) {
    const direction = DIRECTIONS.find((d) => {
      const next = slide(board, d);
      return next.changed && map.steps.get(next.board.join(',')) === left! - 1;
    });
    if (!direction) return null;
    route.push(direction);
    board = slide(board, direction).board;
    left--;
  }
  return route;
}

/** Every board reachable by slides, and how many of them can no longer finish (dead ends for Undo). */
export function explore(board: Board, target: Goal) {
  const map = routeMap(board, target);
  return { states: map.states, deadEnds: map.states - map.steps.size };
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
  return {
    board: transform(boards[pick] ?? plan.board, turns, reflect),
    target: plan.target,
    goal: goalOf(plan),
  };
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

/** Each size's look: radius grows a little with each doubling, capped so the number and the ball fit the cell.
 * The 128 is the big white snowball with a snowman's coal eyes. */
export function sizeLook(value: number) {
  const step = Math.max(0, Math.log2(Math.max(2, value)) - 1);
  return {
    color:
      value <= 4
        ? 'blue'
        : value === 8
          ? 'teal'
          : value === 16
            ? 'purple'
            : value === 32
              ? 'pink'
              : value === 64
                ? 'yellow'
                : 'white',
    radius: Math.min(42, 34 + step * 1.3),
    scarf: value >= 64,
    face: value >= 128,
  } as const;
}

export const FIELD_LOOKS = ['morning', 'dusk', 'flurry'] as const;
export type FieldLook = (typeof FIELD_LOOKS)[number];
