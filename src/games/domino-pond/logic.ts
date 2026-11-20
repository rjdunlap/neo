import type { Rng } from '../../engine/random';
import type { BandLevels } from '../../progress/difficulty';

export type Level = 1 | 2 | 3;
export type Direction = 0 | 1 | 2 | 3;
export type Stone = { id: number; dots: readonly [number, number] };
export type Placement = { stone: number; anchor: number; direction: Direction };
export type Clue = {
  cells: readonly number[];
  relation: 'match' | 'equal' | 'less' | 'more';
  target: number;
};
export type Board = {
  level: Level;
  columns: number;
  cells: readonly number[];
  stones: readonly Stone[];
  clues: readonly Clue[];
};
const DESCRIPTIONS = [
  'Match the dots on both ends of two stepping stones.',
  'Lay stones so each row adds up to its number.',
  'Lay stones so each column meets its comparison sign.',
];
export const LEVELS: BandLevels = {
  prek: { min: 1, max: 1 },
  school: { min: 2, max: 2 },
  grownup: { min: 3, max: 3 },
};
export const describeLevel = (level: number) => DESCRIPTIONS[level - 1] ?? DESCRIPTIONS[0];

const STEPS = [
  [1, 0],
  [0, 1],
  [-1, 0],
  [0, -1],
] as const;
const MASKS = [
  [0, 1, 3, 4],
  [0, 1, 2, 3],
  [0, 1, 2, 3, 4, 5],
] as const;
const PATCHES: readonly (readonly (readonly number[])[])[] = [
  [[0], [1], [3], [4]],
  [
    [0, 1],
    [2, 3],
  ],
  [
    [0, 3],
    [1, 4],
    [2, 5],
  ],
] as const;

export function directions(board: Board, stone: Stone): Direction[] {
  if (board.level === 1) return [0, 2];
  return stone.dots[0] === stone.dots[1] ? [0, 1] : [0, 1, 2, 3];
}

export function ends(board: Board, move: Placement): [number, number] {
  const [dx, dy] = STEPS[move.direction];
  const x = (move.anchor % board.columns) + dx;
  const other = x < 0 || x >= board.columns ? -1 : move.anchor + dx + dy * board.columns;
  return [move.anchor, other];
}

export function fits(board: Board, placed: readonly Placement[], move: Placement): boolean {
  const stone = board.stones.find((stone) => stone.id === move.stone);
  if (!stone || !directions(board, stone).includes(move.direction)) return false;
  const cells = ends(board, move);
  return (
    cells.every((cell) => board.cells.includes(cell)) &&
    placed.every(
      (other) => other.stone !== move.stone && ends(board, other).every((cell) => !cells.includes(cell)),
    )
  );
}

export function tilings(board: Board): Placement[][] {
  const options = board.stones.flatMap((stone) =>
    board.cells.flatMap((anchor) =>
      directions(board, stone)
        .map((direction) => ({ stone: stone.id, anchor, direction }))
        .filter((move) => fits(board, [], move)),
    ),
  );
  const complete: Placement[][] = [];
  function fill(placed: Placement[], empty: readonly number[]) {
    if (empty.length === 0) {
      complete.push(placed);
      return;
    }
    for (const move of options) {
      const cells = ends(board, move);
      if (
        cells.includes(empty[0]) &&
        cells.every((cell) => empty.includes(cell)) &&
        placed.every((other) => other.stone !== move.stone)
      ) {
        fill(
          [...placed, move],
          empty.filter((cell) => !cells.includes(cell)),
        );
      }
    }
  }
  fill([], board.cells);
  return complete;
}

export function counts(board: Board, placed: readonly Placement[]): Map<number, number> {
  const values = new Map<number, number>();
  for (const move of placed) {
    const stone = board.stones.find((stone) => stone.id === move.stone);
    ends(board, move).forEach((cell, end) => values.set(cell, stone?.dots[end] ?? 0));
  }
  return values;
}

function passes(clue: Clue, values: ReadonlyMap<number, number>): boolean {
  if (clue.relation === 'match') return (values.get(clue.cells[0]) ?? clue.target) === clue.target;
  if (!clue.cells.every((cell) => values.has(cell))) return false;
  const total = clue.cells.reduce((sum, cell) => sum + (values.get(cell) ?? 0), 0);
  if (clue.relation === 'less') return total < clue.target;
  if (clue.relation === 'more') return total > clue.target;
  return total === clue.target;
}

export function unmetClues(board: Board, placed: readonly Placement[]): Clue[] {
  const values = counts(board, placed);
  return board.clues.filter((clue) => !passes(clue, values));
}

export function isSolved(board: Board, placed: readonly Placement[]): boolean {
  return (
    placed.length === board.stones.length &&
    placed.length * 2 === board.cells.length &&
    placed.every((move, i) => fits(board, placed.slice(0, i), move)) &&
    unmetClues(board, placed).length === 0
  );
}

function sameMove(a: Placement, b: Placement) {
  return a.stone === b.stone && a.anchor === b.anchor && a.direction === b.direction;
}

export function hintFor(
  board: Board,
  placed: readonly Placement[],
  solutions = tilings(board).filter((moves) => unmetClues(board, moves).length === 0),
): { kind: 'place' | 'remove'; move: Placement } | null {
  let best: Placement[] | undefined;
  let keep = -1;
  for (const solution of solutions) {
    const retained = placed.filter((current) => solution.some((move) => sameMove(current, move))).length;
    if (retained <= keep) continue;
    best = solution;
    keep = retained;
  }
  if (!best) return null;
  const remove = placed.find((current) => !best.some((move) => sameMove(current, move)));
  if (remove) return { kind: 'remove', move: remove };
  const next = best.find((move) => !placed.some((current) => sameMove(current, move)));
  return next ? { kind: 'place', move: next } : null;
}

function blank(level: Level, dots: readonly Stone['dots'][]): Board {
  return {
    level,
    columns: [5, 2, 3][level - 1],
    cells: MASKS[level - 1],
    stones: dots.map((pair, id) => ({ id, dots: pair })),
    clues: [],
  };
}

function withClues(board: Board, moves: readonly Placement[], offsets: readonly [number, number]): Board {
  const values = counts(board, moves);
  const clues = PATCHES[board.level - 1].map((cells, i): Clue => {
    const total = cells.reduce((sum, cell) => sum + (values.get(cell) ?? 0), 0);
    if (board.level === 1) return { cells, relation: 'match', target: total };
    if (board.level === 2 || i === 1) return { cells, relation: 'equal', target: total };
    return i === 0
      ? { cells, relation: 'less', target: total + offsets[0] }
      : { cells, relation: 'more', target: total - offsets[1] };
  });
  return { ...board, clues };
}

export function sampleBoard(level: Level): Board {
  const pairs = [
    [
      [3, 1],
      [2, 4],
    ],
    [
      [1, 2],
      [2, 3],
    ],
    [
      [1, 2],
      [2, 3],
      [3, 4],
    ],
  ] as const;
  const anchors = [
    [1, 4],
    [0, 2],
    [0, 1, 2],
  ][level - 1];
  const direction = ([2, 0, 1] as const)[level - 1];
  const board = blank(level, pairs[level - 1]);
  return withClues(
    board,
    anchors.map((anchor, stone) => ({ anchor, stone, direction })),
    [1, 2],
  );
}

const PAIRS: Stone['dots'][] = [
  [1, 1],
  [1, 2],
  [1, 3],
  [1, 4],
  [2, 2],
  [2, 3],
  [2, 4],
  [3, 3],
  [3, 4],
  [4, 4],
];

export function makeBoard(level: Level, rng: Rng, attempts = 24): Board {
  for (let attempt = 0; attempt < attempts; attempt++) {
    const pool = level === 1 ? PAIRS.filter(([a, b]) => a !== b) : PAIRS;
    const pairs = rng.shuffle([...pool]).slice(0, level === 3 ? 3 : 2);
    const empty = blank(
      level,
      pairs.map(([a, b]) => (rng.chance(0.5) ? [a, b] : [b, a])),
    );
    const arrangements = tilings(empty);
    const board = withClues(empty, rng.pick(arrangements), [rng.int(1, 2), rng.int(1, 2)]);
    const results = arrangements.map((moves) => unmetClues(board, moves));
    if (results.every((clues) => clues.length === 0)) continue;
    if (level === 2 && board.clues[0].target === board.clues[1].target) continue;
    if (
      level === 2 &&
      !arrangements.some(
        (moves, i) =>
          results[i].length > 0 &&
          moves.some((move) =>
            arrangements.every(
              (option, j) => results[j].length > 0 || !option.some((good) => sameMove(move, good)),
            ),
          ),
      )
    )
      continue;
    if (
      level === 3 &&
      board.clues.some(
        (clue) => clue.target < 2 || clue.target > 7 || !results.some((missed) => missed.includes(clue)),
      )
    )
      continue;
    return { ...board, stones: rng.shuffle([...board.stones]) };
  }
  const fallback = sampleBoard(level);
  return { ...fallback, stones: rng.shuffle([...fallback.stones]) };
}
