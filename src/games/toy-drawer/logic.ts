import type { BandLevels } from '../../progress/difficulty';
import type { Rng } from '../../engine/random';

/**
 * Toy Drawer's rules (docs/definitions/toy-drawer.md): toys of different sizes share a drawer of cells. Pure and
 * Pixi-free. A cell is `[row, column]`; a toy's cells are normalized so its smallest row and column are 0.
 */
export type Cell = readonly [number, number];

export type ToyKind = 'train' | 'bear' | 'ball' | 'car' | 'book' | 'blocks' | 'ladder';

/** Each kind's footprint in columns × rows, before any turn. */
export const TOY_SIZE: Record<ToyKind, { w: number; h: number }> = {
  train: { w: 3, h: 1 },
  bear: { w: 2, h: 2 },
  ball: { w: 1, h: 1 },
  car: { w: 2, h: 1 },
  book: { w: 2, h: 1 },
  blocks: { w: 2, h: 2 },
  ladder: { w: 1, h: 3 },
};

export interface Toy {
  /** Stable within a round: the kind, plus a number when a case holds two of one kind. */
  id: string;
  kind: ToyKind;
}

export interface Puzzle {
  rows: number;
  cols: number;
  toys: Toy[];
  /** Whether the Turn button exists (level 3 up). */
  canTurn: boolean;
}

/** Where each toy is: quarter-turns clockwise (0–3) and, once in the drawer, its top-left cell. */
export interface State {
  turns: Record<string, number>;
  at: Record<string, Cell | undefined>;
}

export interface Placement {
  toy: string;
  turns: number;
  anchor: Cell;
}

export type Hint = ({ kind: 'place' } & Placement) | { kind: 'take-out'; toy: string };

const toyOf = (puzzle: Puzzle, id: string): Toy => {
  const t = puzzle.toys.find((x) => x.id === id);
  if (!t) throw new Error(`no toy ${id}`);
  return t;
};

/** A toy's cells for `turns` quarter-turns clockwise, normalized to the origin. */
export function footprint(kind: ToyKind, turns: number): Cell[] {
  const { w, h } = TOY_SIZE[kind];
  let cells: Cell[] = [];
  for (let r = 0; r < h; r++) for (let c = 0; c < w; c++) cells.push([r, c]);
  for (let t = 0; t < ((turns % 4) + 4) % 4; t++) {
    const maxR = Math.max(...cells.map(([r]) => r));
    cells = cells.map(([r, c]) => [c, maxR - r] as Cell);
  }
  return normalize(cells);
}

/** `turn` for a set of cells: a quarter-turn clockwise, then back to the origin. */
export function turn(cells: readonly Cell[]): Cell[] {
  const maxR = Math.max(...cells.map(([r]) => r));
  return normalize(cells.map(([r, c]) => [c, maxR - r] as Cell));
}

function normalize(cells: readonly Cell[]): Cell[] {
  const r0 = Math.min(...cells.map(([r]) => r));
  const c0 = Math.min(...cells.map(([, c]) => c));
  return cells.map(([r, c]) => [r - r0, c - c0] as Cell).sort((a, b) => a[0] - b[0] || a[1] - b[1]);
}

/** A toy's width and height in cells at `turns`. */
export function sizeAt(kind: ToyKind, turns: number): { w: number; h: number } {
  const { w, h } = TOY_SIZE[kind];
  return turns % 2 === 0 ? { w, h } : { w: h, h: w };
}

export const emptyState = (puzzle: Puzzle): State => ({
  turns: Object.fromEntries(puzzle.toys.map((t) => [t.id, 0])),
  at: {},
});

export const copyState = (s: State): State => ({ turns: { ...s.turns }, at: { ...s.at } });

const key = (r: number, c: number) => r * 16 + c;

/** The cells covered by every placed toy except `skip`. */
function covered(puzzle: Puzzle, state: State, skip?: string): Set<number> {
  const out = new Set<number>();
  for (const t of puzzle.toys) {
    const a = state.at[t.id];
    if (!a || t.id === skip) continue;
    for (const [r, c] of footprint(t.kind, state.turns[t.id] ?? 0)) out.add(key(a[0] + r, a[1] + c));
  }
  return out;
}

/** The drawer cells a toy would cover at an anchor and turn. */
export function cellsAt(kind: ToyKind, turns: number, anchor: Cell): Cell[] {
  return footprint(kind, turns).map(([r, c]) => [anchor[0] + r, anchor[1] + c] as Cell);
}

/** True when every cell of the toy is inside the drawer and not covered by another placed toy. */
export function legal(puzzle: Puzzle, state: State, id: string, turns: number, anchor: Cell): boolean {
  const used = covered(puzzle, state, id);
  return cellsAt(toyOf(puzzle, id).kind, turns, anchor).every(
    ([r, c]) => r >= 0 && c >= 0 && r < puzzle.rows && c < puzzle.cols && !used.has(key(r, c)),
  );
}

/** The cells the toy would cover at `anchor` that are off the drawer or already full (what to flash when a drop fails). */
export function blockedCells(puzzle: Puzzle, state: State, id: string, turns: number, anchor: Cell): Cell[] {
  const used = covered(puzzle, state, id);
  return cellsAt(toyOf(puzzle, id).kind, turns, anchor).filter(
    ([r, c]) => r >= 0 && c >= 0 && r < puzzle.rows && c < puzzle.cols && used.has(key(r, c)),
  );
}

/** The legal anchor nearest `want` (the cell the toy's top-left sits over), within one cell of it, or null. */
export function nearestAnchor(
  puzzle: Puzzle,
  state: State,
  id: string,
  turns: number,
  want: { r: number; c: number },
): Cell | null {
  let best: Cell | null = null;
  let bestD = Infinity;
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      const a: Cell = [Math.round(want.r) + dr, Math.round(want.c) + dc];
      if (!legal(puzzle, state, id, turns, a)) continue;
      const d = (a[0] - want.r) ** 2 + (a[1] - want.c) ** 2;
      if (d < bestD) {
        bestD = d;
        best = a;
      }
    }
  }
  return best;
}

/**
 * Turns a toy a quarter-turn clockwise. In the tray it just turns. In the drawer it keeps its top-left cell; if that
 * does not fit, the nearest legal anchor within one cell is used, else the turn is refused (null): never a miss.
 */
export function turnToy(puzzle: Puzzle, state: State, id: string): State | null {
  const next = copyState(state);
  const turns = ((state.turns[id] ?? 0) + 1) % 4;
  next.turns[id] = turns;
  const a = state.at[id];
  if (!a) return next;
  const without = copyState(state);
  without.at[id] = undefined;
  const to = nearestAnchor(puzzle, without, id, turns, { r: a[0], c: a[1] });
  if (!to) return null;
  next.at[id] = to;
  return next;
}

/** Every toy legally placed. */
export const complete = (puzzle: Puzzle, state: State): boolean => puzzle.toys.every((t) => state.at[t.id]);

/** The empty cells left when every toy is in. */
export const spareCells = (puzzle: Puzzle): number =>
  puzzle.rows * puzzle.cols - puzzle.toys.reduce((n, t) => n + TOY_SIZE[t.kind].w * TOY_SIZE[t.kind].h, 0);

/** Each distinct footprint a toy can take: one turn for a square, two for a rectangle, four otherwise. */
function turnChoices(kind: ToyKind, canTurn: boolean): number[] {
  if (!canTurn) return [0];
  const { w, h } = TOY_SIZE[kind];
  if (w === h) return [0];
  return [0, 1];
}

/** Fills the toys in `todo` (by index) into the free cells by backtracking; returns the placements or null. */
function pack(
  puzzle: Puzzle,
  base: State,
  todo: Toy[],
  canTurn: boolean,
  used: Set<number>,
): Placement[] | null {
  if (!todo.length) return [];
  // The largest toy first, so a dead end shows early.
  const [toy, ...rest] = todo;
  for (const t of turnChoices(toy.kind, canTurn)) {
    const cells = footprint(toy.kind, t);
    for (let r = 0; r < puzzle.rows; r++) {
      for (let c = 0; c < puzzle.cols; c++) {
        const abs = cells.map(([cr, cc]) => [r + cr, c + cc] as Cell);
        if (abs.some(([ar, ac]) => ar >= puzzle.rows || ac >= puzzle.cols || used.has(key(ar, ac)))) continue;
        for (const [ar, ac] of abs) used.add(key(ar, ac));
        const more = pack(puzzle, base, rest, canTurn, used);
        for (const [ar, ac] of abs) used.delete(key(ar, ac));
        if (more) return [{ toy: toy.id, turns: t, anchor: [r, c] }, ...more];
      }
    }
  }
  return null;
}

const area = (t: Toy) => TOY_SIZE[t.kind].w * TOY_SIZE[t.kind].h;

/**
 * A complete legal packing that keeps as many of the current placements as it can, or null. The kept toys stay exactly
 * where they are (and as turned); the rest are packed around them (turning too when `canTurn`).
 */
export function solve(puzzle: Puzzle, state: State, canTurn = puzzle.canTurn): State | null {
  const placedIds = puzzle.toys.filter((t) => state.at[t.id]).map((t) => t.id);
  // Largest kept set first; the legal check also drops a kept set that overlaps itself.
  for (let k = placedIds.length; k >= 0; k--) {
    for (const keep of subsets(placedIds, k)) {
      const base = emptyState(puzzle);
      for (const id of keep) {
        base.turns[id] = state.turns[id] ?? 0;
        base.at[id] = state.at[id];
      }
      const used = covered(puzzle, base);
      const todo = puzzle.toys.filter((t) => !keep.includes(t.id)).sort((a, b) => area(b) - area(a));
      const got = pack(puzzle, base, todo, canTurn, used);
      if (!got) continue;
      const out = copyState(base);
      for (const p of got) {
        out.turns[p.toy] = p.turns;
        out.at[p.toy] = p.anchor;
      }
      return out;
    }
  }
  return null;
}

/** Every `k`-sized subset of `items`, in order. */
function subsets<T>(items: readonly T[], k: number): T[][] {
  if (k === 0) return [[]];
  if (items.length < k) return [];
  const [first, ...rest] = items;
  return [...subsets(rest, k - 1).map((s) => [first, ...s]), ...subsets(rest, k)];
}

/**
 * What to show when she asks: a place for a toy when the layout can be finished without moving anything, otherwise the
 * placed toy to take out (the smallest set whose removal lets the rest fit; ties go to the earlier toy). Never a
 * ghost on a place that cannot be finished.
 */
export function nextHint(puzzle: Puzzle, state: State): Hint | null {
  if (complete(puzzle, state)) return null;
  const placed = puzzle.toys.filter((t) => state.at[t.id]).map((t) => t.id);
  const unplaced = puzzle.toys.filter((t) => !state.at[t.id]);
  for (let k = 0; k <= placed.length; k++) {
    for (const drop of subsets(placed, k)) {
      const base = emptyState(puzzle);
      for (const id of placed) {
        if (drop.includes(id)) continue;
        base.turns[id] = state.turns[id] ?? 0;
        base.at[id] = state.at[id];
      }
      const used = covered(puzzle, base);
      const todo = puzzle.toys.filter((t) => !base.at[t.id]).sort((a, b) => area(b) - area(a));
      const got = pack(puzzle, base, todo, puzzle.canTurn, used);
      if (!got) continue;
      if (k > 0) return { kind: 'take-out', toy: drop[0] };
      // Nothing to move: show the first toy still in the tray where the finished packing puts it.
      const first = unplaced.map((t) => got.find((p) => p.toy === t.id)!)[0];
      return { kind: 'place', ...first };
    }
  }
  return null;
}

// ---- The cases and the levels ----

/** A hand-authored drawer: its size and the kinds of toy in it. Every case is proved solvable by the tests. */
export interface Case {
  rows: number;
  cols: number;
  toys: ToyKind[];
}

export interface LevelPlan {
  name: string;
  cases: Case[];
  canTurn: boolean;
}

export const PLANS: LevelPlan[] = [
  {
    name: 'Roomy drawer: three toys and spare room',
    canTurn: false,
    cases: [
      { rows: 3, cols: 4, toys: ['train', 'bear', 'ball'] },
      { rows: 3, cols: 4, toys: ['car', 'bear', 'book'] },
      { rows: 3, cols: 4, toys: ['bear', 'car', 'ball'] },
      { rows: 3, cols: 4, toys: ['train', 'car', 'ball'] },
    ],
  },
  {
    name: 'A snug drawer: some toys have to move',
    canTurn: false,
    cases: [
      { rows: 3, cols: 4, toys: ['train', 'bear', 'car', 'book'] },
      { rows: 3, cols: 5, toys: ['train', 'bear', 'blocks', 'car'] },
      { rows: 3, cols: 4, toys: ['bear', 'blocks', 'car'] },
      { rows: 3, cols: 5, toys: ['train', 'train', 'bear', 'car', 'book'] },
    ],
  },
  {
    name: 'Turn it to fit: a toy that needs turning',
    canTurn: true,
    cases: [
      { rows: 3, cols: 4, toys: ['train', 'train', 'bear'] },
      { rows: 3, cols: 4, toys: ['bear', 'blocks', 'ladder'] },
      { rows: 4, cols: 3, toys: ['train', 'train', 'ladder'] },
      { rows: 4, cols: 3, toys: ['train', 'bear', 'blocks'] },
      { rows: 3, cols: 5, toys: ['train', 'train', 'bear', 'ladder'] },
      { rows: 3, cols: 4, toys: ['train', 'ladder', 'ladder'] },
    ],
  },
];

export const LEVELS: BandLevels = {
  preschool: { min: 1, max: 2 },
  prek: { min: 1, max: 3 },
  school: { min: 2, max: 3 },
};

export const planFor = (level: number): LevelPlan => PLANS[Math.min(Math.max(level, 1), PLANS.length) - 1];

const DESCRIPTIONS = [
  'A roomy 4 × 3 drawer, three toys: put each one somewhere it fits',
  'A snug drawer, four or five toys: moving one makes room for another',
  'The Turn button: a toy has to be turned to fit',
];
export const describeLevel = (level: number): string =>
  DESCRIPTIONS[Math.min(Math.max(level, 1), DESCRIPTIONS.length) - 1];

/** The round's puzzle: a seeded pick from the level's cases, its toys named (a second of a kind gets a number). */
export function makePuzzle(level: number, rng: Rng): Puzzle {
  const plan = planFor(level);
  return puzzleOf(rng.pick(plan.cases), plan.canTurn);
}

export function puzzleOf(c: Case, canTurn: boolean): Puzzle {
  const seen: Record<string, number> = {};
  const toys = c.toys.map((kind) => {
    seen[kind] = (seen[kind] ?? 0) + 1;
    return { id: seen[kind] > 1 ? `${kind}${seen[kind]}` : kind, kind } as Toy;
  });
  return { rows: c.rows, cols: c.cols, toys, canTurn };
}
