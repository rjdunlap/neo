import type { BandLevels } from '../../progress/difficulty';
import type { Rng } from '../../engine/random';

export interface Board { rows: number; cols: number; tiles: number[]; start: number; pond: number; berry?: number }
export interface Plan { rows: number; cols: number; tiles: readonly number[]; start: number; pond: number }
const open = (rows: number, cols: number, rocks: readonly number[] = []) => Array.from({ length: rows * cols }, (_, i) => i).filter(i => !rocks.includes(i));
/**
 * Levels 1–3, frozen coverage plans; a seed picks one and flips or transposes it. Every plan stays within 4 × 4,
 * so `completion`'s memo key (`mask * 16 + at`) holds and a transposed plan keeps cells at 100 units.
 */
export const PLANS: readonly (readonly Plan[])[] = [
  [
    { rows: 3, cols: 3, tiles: [0, 1, 2, 5, 6, 7, 8], start: 0, pond: 6 },
    { rows: 4, cols: 3, tiles: [0, 1, 2, 3, 6, 7, 8, 11], start: 2, pond: 11 },
    { rows: 4, cols: 4, tiles: [0, 4, 8, 12, 13, 14, 15, 11], start: 0, pond: 11 },
  ],
  [
    { rows: 3, cols: 4, tiles: open(3, 4), start: 0, pond: 11 },
    { rows: 3, cols: 4, tiles: open(3, 4, [5]), start: 3, pond: 11 },
    { rows: 3, cols: 3, tiles: open(3, 3), start: 0, pond: 8 },
  ],
  [
    { rows: 4, cols: 4, tiles: open(4, 4, [5, 6]), start: 4, pond: 15 },
    { rows: 4, cols: 4, tiles: open(4, 4, [0, 6]), start: 4, pond: 15 },
    { rows: 4, cols: 4, tiles: open(4, 4, [1, 10]), start: 0, pond: 12 },
  ],
];
const PLAN_NAMES = [
  'A winding trail: bloom every tile',
  'An open patch: plan a route through every tile',
  'Two rocks: visit fourteen tiles through narrow passages',
];
const planLevel = (level: number) => Math.max(0, Math.min(PLANS.length - 1, level - 1));
export function makeBoard(level: number, rng: Rng): Board {
  if (isMaze(level)) return makeMaze(level, rng);
  const set = PLANS[planLevel(level)], p = set[rng.int(0, set.length - 1)];
  const flipX = rng.chance(0.5), flipY = rng.chance(0.5), transpose = rng.chance(0.5);
  return transformPlan(p, flipX, flipY, transpose);
}
export function transformPlan(p: Plan, flipX: boolean, flipY: boolean, transpose: boolean): Board {
  const cols = transpose ? p.rows : p.cols, rows = transpose ? p.cols : p.rows;
  const transform = (i: number) => {
    const r = flipY ? p.rows - 1 - Math.floor(i / p.cols) : Math.floor(i / p.cols);
    const c = flipX ? p.cols - 1 - i % p.cols : i % p.cols;
    return transpose ? c * cols + r : r * cols + c;
  };
  return { rows, cols, tiles: p.tiles.map(transform), start: transform(p.start), pond: transform(p.pond) };
}
export function adjacent(b: Board, a: number, z: number): boolean {
  return b.tiles.includes(z) && Math.abs(Math.floor(a / b.cols) - Math.floor(z / b.cols)) + Math.abs(a % b.cols - z % b.cols) === 1;
}
export function moveError(b: Board, path: readonly number[], at: number): 'far' | 'visited' | 'pond' | null {
  if (!adjacent(b, path[path.length - 1], at)) return 'far';
  if (path.includes(at)) return 'visited';
  if (at === b.pond && path.length !== b.tiles.length - 1) return 'pond';
  return null;
}
export function step(b: Board, path: readonly number[], at: number): number[] | null {
  return moveError(b, path, at) ? null : [...path, at];
}
export const solved = (b: Board, path: readonly number[]) => validPath(b, path) && path.length === b.tiles.length && path.at(-1) === b.pond;
export function validPath(b: Board, path: readonly number[]): boolean {
  return path[0] === b.start && new Set(path).size === path.length && path.every((at, i) => b.tiles.includes(at) && (i === 0 || adjacent(b, path[i - 1], at))) && (!path.includes(b.pond) || (path.at(-1) === b.pond && path.length === b.tiles.length));
}
/** Exact completion from any legal prefix. Memoized failed states keep the 16-space search small. */
export function completion(b: Board, path: readonly number[]): number[] | null {
  if (!validPath(b, path)) return null;
  const failed = new Set<number>();
  const search = (at: number, mask: number, length: number): number[] | null => {
    if (length === b.tiles.length) return at === b.pond ? [] : null;
    const key = mask * 16 + at;
    if (failed.has(key)) return null;
    for (const next of b.tiles) {
      if ((mask & (1 << next)) || !adjacent(b, at, next) || (next === b.pond && length !== b.tiles.length - 1)) continue;
      const tail = search(next, mask | (1 << next), length + 1);
      if (tail) return [next, ...tail];
    }
    failed.add(key); return null;
  };
  return search(path[path.length - 1], path.reduce((m, i) => m | (1 << i), 0), path.length);
}
/** A hint revises only as far as necessary; the UI performs each undo through its normal control. */
export function helpFor(b: Board, path: readonly number[]): { undo: number; next: number } | null {
  if (!validPath(b, path)) return null;
  for (let length = path.length; length > 0; length--) {
    const route = completion(b, path.slice(0, length));
    if (route) return { undo: path.length - length, next: route[0] ?? -1 };
  }
  return null;
}

/* Levels 4–7, *find the way*: hedge mazes whose open tiles form a tree, so there is one route between any two tiles. */
export const isMaze = (level: number) => level >= 4;
/** Frozen boards (six per level), rows top first: `S` start, `P` pond, `B` berry, `.` moss, `#` hedge. A seed picks one and flips it. */
export const MAZES: Record<number, readonly (readonly string[])[]> = {
  4: [
    ['S....', '####.', 'P....'],
    ['S.###', '#...#', '###.P'],
    ['..S##', '.####', '....P'],
    ['S..#P', '##.#.', '##.#.', '##...'],
    ['S.....', '#####.', '......', 'P#####'],
    ['#...S', '#.###', '#...#', '###.P'],
  ],
  5: [
    ['##..#', 'S..#P', '##...'],
    ['S...#', '#.#.#', '#.#.P'],
    ['S.#.P', '#...#', '##.##'],
    ['S...', '#.##', '#..P'],
    ['S..#.', '##...', '####P'],
    ['#S...', '##.#.', '##.#P'],
  ],
  6: [
    ['#.#.#.#', 'S......', '######.', 'P......'],
    ['S..#...', '#.##.#.', '#....#P', '#.#####'],
    ['S.#...', '#.#.#.', '....#.', '###.#P'],
    ['S.....', '#.###.', '##.##.', 'P.....'],
    ['S.#.P', '#...#', '#.#.#'],
    ['S...##', '#.#.#.', '###...', '###.#P'],
  ],
  7: [
    ['#.##B##', '.......', '##.###.', 'S....#P'],
    ['##B#.##', 'S.....P', '#.###.#', '...##.#'],
    ['#.#B#.P', 'S.....#', '####.##', '###...#'],
    ['S.....P', '#.##.##', '#B#...#'],
    ['B..S...', '######.', '###....', '####.#P'],
    ['#B##.##', 'S.....P', '###.###', '##...##'],
  ],
};
const MAZE_NAMES: Record<number, string> = {
  4: 'Follow the moss: one winding path to the pond',
  5: 'Which way? One fork',
  6: 'Look before you go: dead ends one step deep',
  7: 'Snack on the way: get the berry, then the pond',
};
export const levelName = (level: number) => MAZE_NAMES[level] ?? PLAN_NAMES[planLevel(level)];
export function parseMaze(rows: readonly string[]): Board {
  const cols = rows[0].length, tiles: number[] = [];
  let start = -1, pond = -1, berry: number | undefined;
  rows.forEach((row, r) => [...row].forEach((ch, c) => {
    const at = r * cols + c;
    if (ch === '#') return;
    tiles.push(at);
    if (ch === 'S') start = at; else if (ch === 'P') pond = at; else if (ch === 'B') berry = at;
  }));
  return { rows: rows.length, cols, tiles, start, pond, ...(berry === undefined ? {} : { berry }) };
}
/** A left–right and/or top–bottom flip; never a transpose, which would shrink a 4 × 7 maze below 100 units. */
export function flipBoard(b: Board, flipX: boolean, flipY: boolean): Board {
  const f = (i: number) => (flipY ? b.rows - 1 - Math.floor(i / b.cols) : Math.floor(i / b.cols)) * b.cols + (flipX ? b.cols - 1 - i % b.cols : i % b.cols);
  return { rows: b.rows, cols: b.cols, tiles: b.tiles.map(f).sort((x, y) => x - y), start: f(b.start), pond: f(b.pond), ...(b.berry === undefined ? {} : { berry: f(b.berry) }) };
}
export function makeMaze(level: number, rng: Rng): Board {
  const set = MAZES[level];
  const rows = set[rng.int(0, set.length - 1)];
  return flipBoard(parseMaze(rows), rng.chance(0.5), rng.chance(0.5));
}
export const neighbours = (b: Board, at: number) => b.tiles.filter(z => adjacent(b, at, z));
/** The tree's one route from `from` to `to`, both ends included. */
export function routeBetween(b: Board, from: number, to: number): number[] {
  const back = new Map<number, number>([[from, from]]), queue = [from];
  while (queue.length) {
    const at = queue.shift()!;
    if (at === to) break;
    for (const z of neighbours(b, at)) if (!back.has(z)) { back.set(z, at); queue.push(z); }
  }
  if (!back.has(to)) return [];
  const route = [to];
  while (route[0] !== from) route.unshift(back.get(route[0])!);
  return route;
}
/** The way to the pond, and the berry's way where there is one: tiles on it are never a wrong turn. */
export function mainline(b: Board): Set<number> {
  const line = new Set(routeBetween(b, b.start, b.pond));
  if (b.berry !== undefined) for (const at of routeBetween(b, b.start, b.berry)) line.add(at);
  return line;
}
export const goalOf = (b: Board, berry: boolean) => b.berry !== undefined && !berry ? b.berry : b.pond;
/** The first tile from the turtle toward the goal: the way out of a dead end, otherwise the next route tile. */
export const nextToward = (b: Board, at: number, goal: number) => routeBetween(b, at, goal)[1] ?? -1;
/** The end of a dead end: a tile with one way in that is not the start, pond or berry. */
export const deadEnd = (b: Board, at: number) => at !== b.start && at !== b.pond && at !== b.berry && neighbours(b, at).length === 1;

export interface MazeState {
  /** The turtle's current route from the start: a simple path in the tree. */
  path: number[];
  berry: boolean;
  misses: number;
  /** Wrong-branch entrance tiles already counted this round. */
  branches: number[];
  /** Whether a berry-less pond step has been counted this round. */
  snack: boolean;
  /** Mainline tiles stood on this round, so a new one is progress. */
  reached: number[];
}
export type MazeMove =
  | { kind: 'forward'; miss: boolean; berry: boolean; pond: boolean; deadEnd: boolean; progress: boolean }
  | { kind: 'back' }
  | { kind: 'walk'; to: number }
  | { kind: 'refuse'; miss: boolean }
  | { kind: 'ignore'; far: boolean };
export const mazeStart = (b: Board): MazeState => ({ path: [b.start], berry: false, misses: 0, branches: [], snack: false, reached: [b.start] });
/** Start over: the same maze and the berry back on its bush; misses and counted branches stay. */
export const mazeRestart = (b: Board, s: MazeState): MazeState => ({ ...s, path: [b.start], berry: false });
/** One step back along the trail (Undo, a tap on the last tile, one step of a walk back). Always free. */
export const mazeBack = (s: MazeState): MazeState => s.path.length > 1 ? { ...s, path: s.path.slice(0, -1) } : s;
/**
 * What a touch on tile `at` does at a maze level. Only levels 6–7 count misses: a step into a wrong branch once per
 * branch per round, and (level 7) a pond step without the berry once per round. Back steps and far taps are free.
 */
export function mazeTouch(b: Board, level: number, s: MazeState, at: number): { state: MazeState; move: MazeMove } {
  const here = s.path[s.path.length - 1];
  if (at === here || !b.tiles.includes(at)) return { state: s, move: { kind: 'ignore', far: false } };
  if (s.path.length > 1 && at === s.path[s.path.length - 2]) return { state: mazeBack(s), move: { kind: 'back' } };
  const earlier = s.path.indexOf(at);
  if (earlier >= 0) return { state: s, move: { kind: 'walk', to: earlier } };
  if (!adjacent(b, here, at)) return { state: s, move: { kind: 'ignore', far: true } };
  if (at === b.pond && b.berry !== undefined && !s.berry) {
    return { state: { ...s, snack: true, misses: s.misses + (s.snack ? 0 : 1) }, move: { kind: 'refuse', miss: !s.snack } };
  }
  const line = mainline(b);
  const wrong = level >= 6 && line.has(here) && !line.has(at);
  const miss = wrong && !s.branches.includes(at);
  const progress = line.has(at) && !s.reached.includes(at);
  const state: MazeState = {
    ...s, path: [...s.path, at], berry: s.berry || at === b.berry, misses: s.misses + (miss ? 1 : 0),
    branches: miss ? [...s.branches, at] : s.branches, reached: progress ? [...s.reached, at] : s.reached,
  };
  return { state, move: { kind: 'forward', miss, berry: at === b.berry && !s.berry, pond: at === b.pond, deadEnd: deadEnd(b, at), progress } };
}

/* A seeded look for the round: the moss season and the berry kind. Neither changes a rule; drawn once per board. */
export const SEASONS = ['spring', 'autumn', 'snow'] as const;
export const BERRIES = ['red', 'blue', 'strawberry'] as const;
export interface Look { season: (typeof SEASONS)[number]; berry: (typeof BERRIES)[number] }
/** Picked after the board, so a seed's board is the same with or without a look. */
export const pickLook = (rng: Rng): Look => ({ season: SEASONS[rng.int(0, SEASONS.length - 1)], berry: BERRIES[rng.int(0, BERRIES.length - 1)] });
/** A small, fixed scatter per hedge (3–5 leaves at offsets in −1..1), from the cell index so redraws never move it. */
export function leafSpots(at: number): [number, number][] {
  let h = Math.imul(at + 1, 2654435761) >>> 0;
  const next = () => { h = Math.imul(h ^ (h >>> 15), 2246822519) >>> 0; h ^= h >>> 13; return (h >>> 0) / 4294967296; };
  return Array.from({ length: 3 + Math.floor(next() * 3) }, () => [next() * 2 - 1, next() * 2 - 1]);
}

export const LEVELS: BandLevels = {
  toddler: { min: 4, max: 4 },
  preschool: { min: 4, max: 5 },
  prek: { min: 5, max: 6 },
  school: { min: 1, max: 7, order: [6, 1, 7, 2, 3] },
};
