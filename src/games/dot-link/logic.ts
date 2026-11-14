import type { ColorName } from '../../art/palette';
import type { Rng } from '../../engine/random';
import type { BandLevels } from '../../progress/difficulty';

/**
 * Dot Link, after Two Dots: drag a line through neighboring dots of one color and they pop;
 * new dots drop in from the top. Later levels ask for a color, a longer chain, or a closed
 * square (which clears every dot of that color).
 */
export type DotMode =
  'big' | 'tap' | 'pair' | 'buddy' | 'color' | 'two' | 'chain' | 'square' | 'pattern' | 'ten' | 'garden';

export interface DotPlan {
  mode: DotMode;
  rows: number;
  cols: number;
  colors: number;
  /** Pops (big, tap), links (pair), buddies joined (buddy), dots of the color, chains, or squares to finish. */
  goal: number;
  /** two: how many dots of the first and second named color; `goal` is their sum. */
  goals?: readonly [number, number];
  /** chain: how long a chain must be. */
  length?: number;
  /** chain: only a line with exactly this many dots counts. */
  exactLength?: boolean;
  /** pattern: the sign's colors as places in the round's palette (0, 1, 0, 1 is red, blue, red, blue). */
  pattern?: readonly number[];
  name: string;
}

export const PLANS: DotPlan[] = [
  { mode: 'tap', rows: 4, cols: 5, colors: 3, goal: 12, name: 'Tap dots to pop them' },
  {
    mode: 'pair',
    rows: 4,
    cols: 4,
    colors: 3,
    goal: 6,
    name: 'Draw a line between two dots of the same color',
  },
  { mode: 'color', rows: 5, cols: 5, colors: 4, goal: 8, name: 'Pop 8 dots of one color' },
  { mode: 'chain', rows: 5, cols: 6, colors: 4, goal: 3, length: 4, name: 'Make three chains of 4 dots' },
  {
    mode: 'square',
    rows: 5,
    cols: 6,
    colors: 4,
    goal: 2,
    name: 'Close a square to clear a whole color, twice',
  },
  {
    mode: 'chain',
    rows: 5,
    cols: 6,
    colors: 4,
    goal: 3,
    length: 5,
    exactLength: true,
    name: 'Make three chains of exactly 5 dots',
  },
];

/** Level 7, Two colors: the sign names two colors and a number for each, and a line of either counts toward its own. */
export const TWO: DotPlan = {
  mode: 'two',
  rows: 5,
  cols: 5,
  colors: 4,
  goal: 10,
  goals: [6, 4],
  name: 'Two colors: pop 6 of one color and 4 of another',
};

/**
 * Level 8, Same, different: the sign shows a color pattern and a line counts when it follows it, starting on the
 * sign's first color, at least once through; it may go on repeating. Lines may cross colors while she draws.
 */
export const PATTERN: DotPlan = {
  mode: 'pattern',
  rows: 5,
  cols: 5,
  colors: 3,
  goal: 3,
  pattern: [0, 1, 0, 1],
  name: 'Same, different: draw three lines that follow the color pattern',
};

/**
 * Level 9, Make ten: every same-color line adds its dots to a counter, and she builds exactly ten from several lines
 * (4 + 3 + 3, 5 + 5, 2 + 8). A line cannot grow past what is left, and with one left a single dot pops by a tap.
 */
export const TEN: DotPlan = {
  mode: 'ten',
  rows: 5,
  cols: 5,
  colors: 4,
  goal: 10,
  name: 'Make ten: lines of dots that add up to exactly 10',
};

/**
 * Level 10, Clear the garden: a fixed 4×4 board of three colors and no refill. Popped dots leave gaps, the dots above
 * fall, and nothing new drops in; she clears every dot in as few lines as she can. A tap pops a single dot, so every
 * board clears and nothing is a failure; undo steps back one line. The fewest lines come from an exact solver.
 */
export const GARDEN: DotPlan = {
  mode: 'garden',
  rows: 4,
  cols: 4,
  colors: 3,
  goal: 16,
  name: 'Clear the garden: pop every dot in as few lines as you can',
};

/** Make ten: how many dots are still needed after `have`. */
export const tenLeft = (plan: DotPlan, have: number) => Math.max(0, plan.goal - have);

/** Make ten: whether a line may grow to `length` dots with `left` still needed (it stops at the limit). */
export const tenFits = (left: number, length: number) => length <= left;

/** Make ten: whether a finished line of `length` dots counts: one dot only when one is left, never past the limit. */
export const tenCounts = (left: number, length: number) =>
  length >= 1 && length <= left && (length >= 2 || left === 1);

/**
 * Make ten: a line to suggest with `left` still needed: one that finishes exactly when the board has it, else the
 * longest that fits; a single dot when one is left. Lines are same-color neighbors, as everywhere else.
 */
export function tenLine(grid: Grid, left: number): Cell[] | null {
  if (left <= 0) return null;
  if (left === 1) return [{ r: 0, c: 0 }];
  for (let k = Math.min(left, grid.length * grid[0].length); k >= 2; k--) {
    const line = findLine(grid, k);
    if (line) return line;
  }
  return null;
}

/** Level 11, the toddler entry before level 2: one pair of dots wiggles from the start, and only that pair links. */
export const BUDDY_LEVEL = 11;

/** Level 12, lap's opening before level 1: one big dot, and a touch anywhere pops the dot nearest her finger. */
export const BIG_LEVEL = 12;

export const LEVELS: BandLevels = {
  // Level 12, One big dot, opens lap before level 1's board of twenty.
  lap: { min: 1, max: BIG_LEVEL, order: [BIG_LEVEL, 1] },
  // Level 11, Find my buddy, is the toddler step between tapping and linking any pair.
  toddler: { min: 1, max: 11, order: [1, BUDDY_LEVEL, 2] },
  preschool: { min: 2, max: 4 },
  // Level 9, Make ten, is school play and a stretch for pre-K at the top of its window.
  prek: { min: 3, max: 9 },
  // Level 8, Same, different, opens the school window (decided 2026-10-14); 10, Clear the garden, tops it.
  school: { min: 8, max: 10 },
};
export const BUDDY: DotPlan = {
  mode: 'buddy',
  rows: 3,
  cols: 3,
  colors: 2,
  goal: 4,
  name: 'Find my buddy: link the two wiggling dots',
};

export const BIG: DotPlan = {
  mode: 'big',
  rows: 3,
  cols: 3,
  colors: 3,
  goal: 8,
  name: 'One big dot: a touch anywhere pops it',
};

/** The order the big board's places fill: the middle first, then the sides, then the corners. */
export const BIG_FILL: readonly Cell[] = [
  { r: 1, c: 1 },
  { r: 1, c: 0 },
  { r: 1, c: 2 },
  { r: 0, c: 1 },
  { r: 2, c: 1 },
  { r: 0, c: 0 },
  { r: 2, c: 2 },
  { r: 0, c: 2 },
  { r: 2, c: 0 },
];

/** How many places hold a dot after `pops` pops: one to start, and each pop brings one more until the board is full. */
export const bigShown = (pops: number) => Math.min(BIG_FILL.length, 1 + Math.max(0, pops));

/** The place a pop brings in: the next unfilled place in `BIG_FILL`, or none once the board is full. */
export const bigArrival = (pops: number): Cell | null => (pops < BIG_FILL.length ? BIG_FILL[pops] : null);

/** The dot nearest a board point (`x`, `y` in cell units), at any distance: a touch anywhere is for some dot. */
export function nearestCell(cells: readonly Cell[], x: number, y: number): Cell | null {
  let best: Cell | null = null;
  let d = Infinity;
  for (const c of cells) {
    const e = Math.hypot(c.c - x, c.r - y);
    if (e < d) [best, d] = [c, e];
  }
  return best;
}

/** Every plan by level ID. */
export const LEVEL_PLANS: ReadonlyMap<number, DotPlan> = new Map([
  ...PLANS.map((p, i) => [i + 1, p] as const),
  [7, TWO],
  [8, PATTERN],
  [9, TEN],
  [10, GARDEN],
  [BUDDY_LEVEL, BUDDY],
  [BIG_LEVEL, BIG],
]);

export const planFor = (level: number) =>
  LEVEL_PLANS.get(level) ?? PLANS[Math.min(PLANS.length, Math.max(1, level)) - 1];

/** Two colors: the first named color still short of its number, or -1 once both are full. */
export function twoNeed(plan: DotPlan, have: readonly number[]): number {
  return (plan.goals ?? []).findIndex((g, i) => (have[i] ?? 0) < g);
}

/**
 * Two colors: what a line of `n` dots of named color `which` (or -1 for another color) adds. Counts stop at each
 * color's number, so a loop that overshoots is fine; a color already full, like another color, adds nothing.
 */
export function twoAdd(plan: DotPlan, have: readonly number[], which: number, n: number): number {
  const goal = plan.goals?.[which];
  return goal === undefined ? 0 : Math.max(0, Math.min(n, goal - (have[which] ?? 0)));
}

/** Pattern: the sign's colors for a round's palette. */
export const patternColors = (plan: DotPlan, palette: readonly ColorName[]): ColorName[] =>
  (plan.pattern ?? []).map((i) => palette[i]);

/**
 * Pattern: a line counts when it starts on the sign's first color, follows the sign's colors in turn (going round
 * again after the last), and is at least as long as the sign. A line of one color, a break, or one too short does not.
 */
export function patternCounts(colors: readonly ColorName[], pattern: readonly ColorName[]): boolean {
  return (
    pattern.length > 0 &&
    colors.length >= pattern.length &&
    colors.every((k, i) => k === pattern[i % pattern.length])
  );
}

export function chainCounts(plan: DotPlan, length: number, loop: boolean): boolean {
  return plan.exactLength ? length === plan.length && !loop : length >= (plan.length ?? 2) || loop;
}

export const DOT_COLORS: ColorName[] = ['red', 'blue', 'yellow', 'green', 'purple'];

export type DotMark = 'heart' | 'drop' | 'star' | 'leaf' | 'moon';
/** A mark inside each color's dot, always drawn, so red and green differ by more than hue. */
export const DOT_MARKS: Partial<Record<ColorName, DotMark>> = {
  red: 'heart',
  blue: 'drop',
  yellow: 'star',
  green: 'leaf',
  purple: 'moon',
};

export type Grid = ColorName[][];
export interface Cell {
  r: number;
  c: number;
}

export const same = (a: Cell, b: Cell) => a.r === b.r && a.c === b.c;
export const adjacent = (a: Cell, b: Cell) => Math.abs(a.r - b.r) + Math.abs(a.c - b.c) === 1;

export function makeGrid(plan: DotPlan, rng: Rng, palette: ColorName[]): Grid {
  return Array.from({ length: plan.rows }, () => Array.from({ length: plan.cols }, () => rng.pick(palette)));
}

export type StepResult = 'extend' | 'back' | 'loop' | 'no';

/**
 * Dragging onto `next`: extend the line through a same-color neighbor, step back onto the
 * previous dot to undo, or close a loop by returning to a dot already in the line.
 */
export function step(grid: Grid, path: Cell[], next: Cell, anyColor = false): StepResult {
  const last = path[path.length - 1];
  if (!last || same(last, next) || !adjacent(last, next)) return 'no';
  // A pattern line crosses colors, so any neighbor extends it; it is judged when she lets go.
  if (!anyColor && grid[next.r][next.c] !== grid[last.r][last.c]) return 'no';
  if (path.length >= 2 && same(path[path.length - 2], next)) return 'back';
  // A pattern line never closes a loop: a loop pops a whole color, which is not the pattern.
  if (path.some((p) => same(p, next))) return path.length >= 4 && !anyColor ? 'loop' : 'no';
  return 'extend';
}

/** Which dots a finished line pops: the line itself, or every dot of the color for a loop. */
export function popped(grid: Grid, path: Cell[], loop: boolean): Cell[] {
  if (!loop) return path;
  const color = grid[path[0].r][path[0].c];
  const out: Cell[] = [];
  grid.forEach((row, r) => row.forEach((c, ci) => c === color && out.push({ r, c: ci })));
  return out;
}

/** Popped dots leave gaps; dots above fall down and new ones drop in at the top. */
export function collapse(
  grid: Grid,
  gone: Cell[],
  rng: Rng,
  palette: ColorName[],
): { grid: Grid; falls: { from: number; to: number; c: number }[] } {
  const rows = grid.length;
  const cols = grid[0].length;
  const out: Grid = Array.from({ length: rows }, () => Array(cols));
  const falls: { from: number; to: number; c: number }[] = [];
  for (let c = 0; c < cols; c++) {
    const keep: { color: ColorName; r: number }[] = [];
    for (let r = rows - 1; r >= 0; r--)
      if (!gone.some((g) => g.r === r && g.c === c)) keep.push({ color: grid[r][c], r });
    let r = rows - 1;
    for (const k of keep) {
      out[r][c] = k.color;
      if (k.r !== r) falls.push({ from: k.r, to: r, c });
      r--;
    }
    // New dots come from above the grid.
    let above = -1;
    for (; r >= 0; r--) {
      out[r][c] = rng.pick(palette);
      falls.push({ from: above--, to: r, c });
    }
  }
  return { grid: out, falls };
}

/** A same-color line of at least `min` dots (for hints and to make sure a move exists). */
export function findLine(grid: Grid, min: number, color?: ColorName): Cell[] | null {
  const rows = grid.length;
  const cols = grid[0].length;
  const dfs = (path: Cell[]): Cell[] | null => {
    if (path.length >= min) return path;
    const last = path[path.length - 1];
    for (const [dr, dc] of [
      [0, 1],
      [1, 0],
      [0, -1],
      [-1, 0],
    ]) {
      const n = { r: last.r + dr, c: last.c + dc };
      if (n.r < 0 || n.c < 0 || n.r >= rows || n.c >= cols) continue;
      if (path.some((p) => same(p, n)) || grid[n.r][n.c] !== grid[last.r][last.c]) continue;
      const found = dfs([...path, n]);
      if (found) return found;
    }
    return null;
  };
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++)
      if (!color || grid[r][c] === color) {
        const found = dfs([{ r, c }]);
        if (found) return found;
      }
  return null;
}

/** Pattern: a line of `pattern.length` dots through neighbors that follows the sign's colors from its first. */
export function findPattern(grid: Grid, pattern: readonly ColorName[]): Cell[] | null {
  if (!pattern.length) return null;
  const rows = grid.length;
  const cols = grid[0].length;
  const dfs = (path: Cell[]): Cell[] | null => {
    if (path.length >= pattern.length) return path;
    const last = path[path.length - 1];
    const want = pattern[path.length % pattern.length];
    for (const [dr, dc] of [
      [0, 1],
      [1, 0],
      [0, -1],
      [-1, 0],
    ]) {
      const n = { r: last.r + dr, c: last.c + dc };
      if (n.r < 0 || n.c < 0 || n.r >= rows || n.c >= cols) continue;
      if (path.some((p) => same(p, n)) || grid[n.r][n.c] !== want) continue;
      const found = dfs([...path, n]);
      if (found) return found;
    }
    return null;
  };
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++)
      if (grid[r][c] === pattern[0]) {
        const found = dfs([{ r, c }]);
        if (found) return found;
      }
  return null;
}

/** A 2×2 block of one color: walking around it closes a square. */
export function findSquare(grid: Grid): Cell[] | null {
  for (let r = 0; r + 1 < grid.length; r++) {
    for (let c = 0; c + 1 < grid[0].length; c++) {
      const k = grid[r][c];
      if (grid[r][c + 1] === k && grid[r + 1][c] === k && grid[r + 1][c + 1] === k)
        return [
          { r, c },
          { r, c: c + 1 },
          { r: r + 1, c: c + 1 },
          { r: r + 1, c },
        ];
    }
  }
  return null;
}

/** Every pair of neighboring dots that share a color. */
export function pairs(grid: Grid): [Cell, Cell][] {
  const out: [Cell, Cell][] = [];
  grid.forEach((row, r) =>
    row.forEach((k, c) => {
      if (c + 1 < row.length && row[c + 1] === k)
        out.push([
          { r, c },
          { r, c: c + 1 },
        ]);
      if (r + 1 < grid.length && grid[r + 1][c] === k)
        out.push([
          { r, c },
          { r: r + 1, c },
        ]);
    }),
  );
  return out;
}

/**
 * The buddy pair that wiggles, chosen from the board's same-color neighbors. A full two-color 3×3 board always has
 * at least two such pairs (only a checkerboard has none, and `ensureMove` repaints one), so only the chosen one is lit.
 */
export function pickBuddy(grid: Grid, rng: Rng): [Cell, Cell] | null {
  const all = pairs(grid);
  return all.length ? rng.pick(all) : null;
}

/** A buddy line counts when it joins both buddies, in either direction; a longer line through both still counts. */
export const buddyCounts = (buddy: readonly Cell[], path: readonly Cell[]) =>
  buddy.length === 2 && buddy.every((b) => path.some((p) => same(p, b)));

/** A clean next move for the demonstration, including the return to the first dot for a square. */
export function demoMove(
  plan: DotPlan,
  grid: Grid,
  target?: ColorName,
  buddy?: readonly Cell[],
  pattern?: readonly ColorName[],
  left?: number,
): Cell[] | null {
  if (plan.mode === 'big') return [BIG_FILL[0]];
  if (plan.mode === 'pattern') return findPattern(grid, pattern ?? []);
  if (plan.mode === 'ten') return tenLine(grid, left ?? plan.goal);
  if (plan.mode === 'tap') return [{ r: 0, c: 0 }];
  if (plan.mode === 'buddy') return buddy?.length === 2 ? [...buddy] : findLine(grid, 2);
  if (plan.mode === 'square') {
    const square = findSquare(grid);
    return square ? [...square, square[0]] : null;
  }
  return findLine(
    grid,
    plan.mode === 'chain' ? plan.length! : 2,
    plan.mode === 'color' || plan.mode === 'two' ? target : undefined,
  );
}

/** Make sure the level's next move exists, repainting a few dots if it doesn't. */
export function ensureMove(
  plan: DotPlan,
  grid: Grid,
  rng: Rng,
  target?: ColorName,
  pattern?: readonly ColorName[],
): Grid {
  const g = grid.map((row) => [...row]);
  const has = () => demoMove(plan, g, target, undefined, pattern);
  if (has()) return g;
  const r = rng.int(0, g.length - 2);
  const c = rng.int(0, g[0].length - 2);
  const color = target ?? g[r][c];
  // Pattern: paint the sign's colors along a row, from its left end.
  if (plan.mode === 'pattern' && pattern?.length)
    for (let i = 0; i < Math.min(g[0].length, pattern.length); i++) g[r][i] = pattern[i];
  else if (plan.mode === 'square')
    for (const [dr, dc] of [
      [0, 0],
      [0, 1],
      [1, 0],
      [1, 1],
    ])
      g[r + dr][c + dc] = color;
  else for (let i = 0; i < Math.min(g[0].length, plan.length ?? 2); i++) g[r][i] = color;
  return g;
}

/** A garden board: a color index (0-2 into the round's palette) or null for a gap, row by row from the top. */
export type Garden = (number | null)[][];

/** One line she can draw: the dots in drawing order (a loop ends back on an earlier dot) and the dots it pops. */
export interface GardenLine {
  path: Cell[];
  loop: boolean;
  /** The popped dots as bits, row by row (bit `r * cols + c`). */
  mask: number;
}

export const gardenBit = (cols: number, c: Cell) => 1 << (c.r * cols + c.c);

/** A frozen board's letters (a, b, c by color, rows joined by '/') as a garden. */
export const parseGarden = (s: string): Garden =>
  s.split('/').map((row) => [...row].map((k) => (k === '.' ? null : 'abc'.indexOf(k))));

export const gardenText = (g: Garden) =>
  g.map((row) => row.map((k) => (k === null ? '.' : 'abc'[k])).join('')).join('/');

export const gardenLeft = (g: Garden) => g.flat().filter((k) => k !== null).length;

/**
 * Every line she could draw on a garden, one per set of popped dots: each simple path through same-color neighbors
 * (a single dot is a tap), and a loop wherever a line can come back to one of its own dots, as `step` allows, which
 * pops every dot of that color. The first path found for a set is kept, so a hint and the demo have a real line.
 */
export function gardenLines(g: Garden): GardenLine[] {
  const rows = g.length,
    cols = g[0].length,
    found = new Map<number, GardenLine>();
  const colorMask = (k: number) => {
    let m = 0;
    g.forEach((row, r) => row.forEach((x, c) => x === k && (m |= gardenBit(cols, { r, c }))));
    return m;
  };
  const dfs = (path: Cell[], mask: number) => {
    if (!found.has(mask)) found.set(mask, { path: [...path], loop: false, mask });
    const last = path[path.length - 1],
      k = g[last.r][last.c];
    for (const [dr, dc] of [
      [0, 1],
      [1, 0],
      [0, -1],
      [-1, 0],
    ]) {
      const n = { r: last.r + dr, c: last.c + dc };
      if (n.r < 0 || n.c < 0 || n.r >= rows || n.c >= cols || g[n.r][n.c] !== k) continue;
      if (mask & gardenBit(cols, n)) {
        // Back onto an earlier dot (not the one just left) closes a loop: the whole color pops.
        if (path.length >= 4 && !same(n, path[path.length - 2])) {
          const all = colorMask(k!);
          if (!found.has(all) || !found.get(all)!.loop)
            found.set(all, { path: [...path, n], loop: true, mask: all });
        }
        continue;
      }
      path.push(n);
      dfs(path, mask | gardenBit(cols, n));
      path.pop();
    }
  };
  g.forEach((row, r) =>
    row.forEach((k, c) => {
      if (k !== null) dfs([{ r, c }], gardenBit(cols, { r, c }));
    }),
  );
  return [...found.values()];
}

/** Pop the dots in `mask`: the dots above fall into the gaps and nothing new comes in. */
export function gardenFall(g: Garden, mask: number): Garden {
  const rows = g.length,
    cols = g[0].length;
  const out: Garden = Array.from({ length: rows }, () => Array<number | null>(cols).fill(null));
  for (let c = 0; c < cols; c++) {
    let r = rows - 1;
    for (let s = rows - 1; s >= 0; s--) {
      const k = g[s][c];
      if (k !== null && !(mask & gardenBit(cols, { r: s, c }))) out[r--][c] = k;
    }
  }
  return out;
}

/** Where each dot that stays lands after a pop: from its row to its new row, by column. */
export function gardenFalls(g: Garden, mask: number): { from: number; to: number; c: number }[] {
  const rows = g.length,
    cols = g[0].length,
    out: { from: number; to: number; c: number }[] = [];
  for (let c = 0; c < cols; c++) {
    let r = rows - 1;
    for (let s = rows - 1; s >= 0; s--)
      if (g[s][c] !== null && !(mask & gardenBit(cols, { r: s, c }))) {
        if (s !== r) out.push({ from: s, to: r, c });
        r--;
      }
  }
  return out;
}

export interface GardenSolution {
  /** The fewest lines that clear the board. */
  lines: number;
  /** One fewest-lines route, line by line, each drawn on the board as it stands then. */
  route: GardenLine[];
  /** Board positions the search looked at. */
  positions: number;
}

/** Exact fewest-lines search: breadth first by lines drawn, each board position looked at once. */
export function solveGarden(start: Garden): GardenSolution {
  const key = gardenText;
  if (!gardenLeft(start)) return { lines: 0, route: [], positions: 1 };
  const seen = new Map<string, { from: string | null; line: GardenLine | null }>([
    [key(start), { from: null, line: null }],
  ]);
  let frontier = [start];
  for (let depth = 1; frontier.length; depth++) {
    const next: Garden[] = [];
    for (const g of frontier)
      for (const line of gardenLines(g)) {
        const after = gardenFall(g, line.mask),
          k = key(after);
        if (seen.has(k)) continue;
        seen.set(k, { from: key(g), line });
        if (!gardenLeft(after)) {
          const route: GardenLine[] = [];
          for (let at: string | null = k; at !== null;) {
            const step: { from: string | null; line: GardenLine | null } = seen.get(at)!;
            if (step.line) route.unshift(step.line);
            at = step.from;
          }
          return { lines: depth, route, positions: seen.size };
        }
        next.push(after);
      }
    frontier = next;
  }
  throw new Error('a garden always clears: a tap pops any dot');
}

/** Repeatedly draw the line that pops the most dots (a player who does not plan ahead), and count the lines. */
export function greedyGarden(start: Garden): number {
  let g = start,
    n = 0;
  while (gardenLeft(g)) {
    const best = gardenLines(g).reduce((a, b) => (popcount(b.mask) > popcount(a.mask) ? b : a));
    g = gardenFall(g, best.mask);
    n++;
  }
  return n;
}

export const popcount = (m: number) => {
  let n = 0;
  for (; m; m &= m - 1) n++;
  return n;
};
