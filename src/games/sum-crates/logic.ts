import type { Rng } from '../../engine/random';
import type { BandLevels } from '../../progress/difficulty';

/** School plays 1 then 2; level 3 is the one grown-up level. */
export const LEVELS: BandLevels = {
  school: { min: 1, max: 2 },
  grownup: { min: 3, max: 3 },
};

export const describeLevel = (level: number) =>
  level <= 1
    ? 'Two lines cross: four or five crates, every line two crates long, fruit 1 to 5'
    : level === 2
      ? 'A longer line: six or seven crates, lines of two or three, fruit 1 to 6'
      : 'Nine and no repeats: ten crates in a 5×5 stack, lines of two to four, fruit 1 to 9';

interface Spec {
  rows: number;
  cols: number;
  /** Fewest and most crates. */
  crates: [number, number];
  /** The longest line, in crates. */
  maxLine: number;
  /** Fruit run 1 to this. */
  fruit: number;
  /**
   * The most line-by-line eliminations the rule-only solver may need (measured by a seeded sweep, `solverSweep` in the
   * tests, with room to spare), so no level needs a leap she cannot see.
   */
  cap: number;
}

export const SPECS: Record<number, Spec> = {
  1: { rows: 3, cols: 3, crates: [4, 5], maxLine: 2, fruit: 5, cap: 12 },
  2: { rows: 3, cols: 4, crates: [6, 7], maxLine: 3, fruit: 6, cap: 24 },
  3: { rows: 5, cols: 5, crates: [10, 10], maxLine: 4, fruit: 9, cap: 40 },
};
export const specOf = (level: number): Spec => SPECS[Math.min(3, Math.max(1, level))];

export interface Line {
  dir: 'across' | 'down';
  /** Crate indices (row * cols + col), in order. */
  cells: number[];
  sum: number;
}

export interface Board {
  rows: number;
  cols: number;
  /** The fruit of the one answer, by crate index; 0 where there is no crate. */
  solution: number[];
  lines: Line[];
  maxFruit: number;
}

export const isCrate = (b: Pick<Board, 'solution'>, at: number) => b.solution[at] > 0;

/** Every maximal run of two or more crates, across then down, read off a crate map. */
export function runsOf(rows: number, cols: number, crate: (at: number) => boolean) {
  const out: { dir: Line['dir']; cells: number[] }[] = [];
  for (const dir of ['across', 'down'] as const) {
    const outer = dir === 'across' ? rows : cols;
    const inner = dir === 'across' ? cols : rows;
    for (let o = 0; o < outer; o++) {
      let run: number[] = [];
      const flush = () => {
        if (run.length >= 2) out.push({ dir, cells: run });
        run = [];
      };
      for (let i = 0; i < inner; i++) {
        const at = dir === 'across' ? o * cols + i : i * cols + o;
        if (crate(at)) run.push(at);
        else flush();
      }
      flush();
    }
  }
  return out;
}

/** The lines of a board from a full set of fruit. */
export function linesFrom(rows: number, cols: number, fruit: readonly number[]): Line[] {
  return runsOf(rows, cols, (at) => fruit[at] > 0).map((r) => ({
    ...r,
    sum: r.cells.reduce((s, at) => s + fruit[at], 0),
  }));
}

/** Which lines a crate belongs to. */
export const linesOf = (b: Pick<Board, 'lines'>, at: number) => b.lines.filter((l) => l.cells.includes(at));

/** Lines a fill breaks, by index: a full line with the wrong sum, or a repeated fruit (whether or not the line is full). */
export function lineStatus(line: Line, fill: readonly number[]) {
  const vals = line.cells.map((c) => fill[c]);
  const placed = vals.filter((v) => v > 0);
  const repeat = new Set(vals.filter((v, i) => v > 0 && vals.indexOf(v) !== i));
  const full = placed.length === line.cells.length;
  const made = placed.reduce((s, v) => s + v, 0);
  return {
    full,
    made,
    repeat,
    wrong: repeat.size > 0 || (full && made !== line.sum),
    right: full && made === line.sum && repeat.size === 0,
  };
}

export const isFull = (b: Board, fill: readonly number[]) =>
  b.solution.every((v, at) => v === 0 || fill[at] > 0);
export const isSolved = (b: Board, fill: readonly number[]) =>
  isFull(b, fill) && b.lines.every((l) => lineStatus(l, fill).right);

/** Every crate has fruit and some line is wrong. */
export const wrongLines = (b: Board, fill: readonly number[]) =>
  b.lines.filter((l) => lineStatus(l, fill).wrong);

/** How many answers a stack has (stops at `limit`), searching crate by crate with sums and repeats checked as it goes. */
export function countSolutions(
  rows: number,
  cols: number,
  crate: (at: number) => boolean,
  lines: Line[],
  maxFruit: number,
  limit = 2,
): number {
  const order: number[] = [];
  for (let at = 0; at < rows * cols; at++) if (crate(at)) order.push(at);
  const mine = new Map<number, Line[]>();
  for (const at of order)
    mine.set(
      at,
      lines.filter((l) => l.cells.includes(at)),
    );
  const fill = new Array<number>(rows * cols).fill(0);
  let found = 0;
  const go = (i: number) => {
    if (found >= limit) return;
    if (i === order.length) {
      found++;
      return;
    }
    const at = order[i];
    for (let v = 1; v <= maxFruit; v++) {
      let ok = true;
      for (const l of mine.get(at)!) {
        let used = v;
        let open = 0;
        let dup = false;
        for (const c of l.cells) {
          if (c === at) continue;
          if (fill[c] === 0) open++;
          else {
            used += fill[c];
            if (fill[c] === v) dup = true;
          }
        }
        // Open crates still to fill need at least 1 + 2 + ... more, and at most the biggest fruit each.
        const least = (open * (open + 1)) / 2;
        const most = open * maxFruit;
        const rest = l.sum - used;
        if (dup || rest < (open ? least : 0) || rest > most || (open === 0 && rest !== 0)) {
          ok = false;
          break;
        }
      }
      if (!ok) continue;
      fill[at] = v;
      go(i + 1);
      fill[at] = 0;
    }
  };
  go(0);
  return found;
}

export interface Step {
  cell: number;
  value: number;
  /** The line whose sum fixed it. */
  line: number;
}

/**
 * The rule-only solver (no guessing). Each crate keeps the fruit it could still be; for every line, a fruit no way of making
 * the sign with distinct fruit uses is ruled out of that crate; repeat until nothing changes. `placed` are the fruit already
 * set. Returns the crates it settles in order, how many line eliminations it took, and whether it finished.
 */
export function humanSolve(
  b: Pick<Board, 'rows' | 'cols' | 'lines' | 'maxFruit' | 'solution'>,
  placed: readonly number[] = [],
): { steps: Step[]; eliminations: number; done: boolean } {
  const n = b.rows * b.cols;
  const all = (1 << b.maxFruit) - 1;
  const dom = new Array<number>(n).fill(0).map((_, at) => (b.solution[at] > 0 ? all : 0));
  placed.forEach((v, at) => {
    if (v > 0 && dom[at]) dom[at] = 1 << (v - 1);
  });
  const settled = new Set<number>();
  const steps: Step[] = [];
  let eliminations = 0;
  const single = (d: number) => d !== 0 && (d & (d - 1)) === 0;
  const valueOf = (d: number) => 31 - Math.clz32(d) + 1;
  placed.forEach((v, at) => v > 0 && dom[at] && settled.add(at));
  let changed = true;
  while (changed) {
    changed = false;
    b.lines.forEach((l, li) => {
      const k = l.cells.length;
      const keep = new Array<number>(k).fill(0);
      const pick: number[] = [];
      const go = (i: number, used: number, left: number) => {
        if (i === k) {
          if (left === 0) for (let j = 0; j < k; j++) keep[j] |= 1 << (pick[j] - 1);
          return;
        }
        for (let v = 1; v <= b.maxFruit && v <= left; v++) {
          const bit = 1 << (v - 1);
          if (!(dom[l.cells[i]] & bit) || used & bit) continue;
          pick[i] = v;
          go(i + 1, used | bit, left - v);
        }
      };
      go(0, 0, l.sum);
      let moved = false;
      l.cells.forEach((c, j) => {
        if (keep[j] !== dom[c]) {
          dom[c] = keep[j];
          moved = true;
        }
      });
      if (moved) {
        eliminations++;
        changed = true;
        for (const c of l.cells)
          if (single(dom[c]) && !settled.has(c)) {
            settled.add(c);
            steps.push({ cell: c, value: valueOf(dom[c]), line: li });
          }
      }
    });
  }
  const done = b.solution.every((v, at) => v === 0 || single(dom[at]));
  return { steps, eliminations, done };
}

/** The stack cut down to the smallest grid that holds every crate, so it is drawn as big as it can be. */
export function trim(rows: number, cols: number, fruit: readonly number[]) {
  const rs = Array.from({ length: rows }, (_, r) => r).filter((r) =>
    fruit.slice(r * cols, r * cols + cols).some((v) => v > 0),
  );
  const cs = Array.from({ length: cols }, (_, c) => c).filter((c) =>
    Array.from({ length: rows }, (_, r) => fruit[r * cols + c]).some((v) => v > 0),
  );
  const r0 = rs[0];
  const c0 = cs[0];
  const out = { rows: rs[rs.length - 1] - r0 + 1, cols: cs[cs.length - 1] - c0 + 1, fruit: [] as number[] };
  for (let r = r0; r < r0 + out.rows; r++)
    for (let c = c0; c < c0 + out.cols; c++) out.fruit.push(fruit[r * cols + c]);
  return out;
}

/** A seeded stack: grow a connected shape, give every crate a fruit with no repeat in a line, read the signs. */
export function attempt(level: number, rng: Rng, gate = true): Board | null {
  const s = specOf(level);
  const total = rng.int(s.crates[0], s.crates[1]);
  const shape = new Set<number>([rng.int(0, s.rows * s.cols - 1)]);
  const neighbours = (at: number) => {
    const r = Math.floor(at / s.cols);
    const c = at % s.cols;
    return [
      r > 0 ? at - s.cols : -1,
      r < s.rows - 1 ? at + s.cols : -1,
      c > 0 ? at - 1 : -1,
      c < s.cols - 1 ? at + 1 : -1,
    ].filter((x) => x >= 0);
  };
  while (shape.size < total) {
    const frontier = [...shape].flatMap(neighbours).filter((x) => !shape.has(x));
    if (!frontier.length) return null;
    shape.add(rng.pick(frontier));
  }
  const crate = (at: number) => shape.has(at);
  const runs = runsOf(s.rows, s.cols, crate);
  if (runs.some((r) => r.cells.length > s.maxLine)) return null;
  const inLines = new Map<number, number>();
  for (const r of runs) for (const c of r.cells) inLines.set(c, (inLines.get(c) ?? 0) + 1);
  if ([...inLines.values()].filter((v) => v >= 2).length < 2 || [...shape].some((c) => !inLines.has(c)))
    return null;
  // Fruit with no repeat in a line.
  const fruit = new Array<number>(s.rows * s.cols).fill(0);
  for (const at of [...shape].sort((a, b) => a - b)) {
    const banned = new Set<number>();
    for (const r of runs)
      if (r.cells.includes(at)) for (const c of r.cells) if (fruit[c]) banned.add(fruit[c]);
    const open = Array.from({ length: s.fruit }, (_, i) => i + 1).filter((v) => !banned.has(v));
    if (!open.length) return null;
    fruit[at] = rng.pick(open);
  }
  const t = trim(s.rows, s.cols, fruit);
  const lines = linesFrom(t.rows, t.cols, t.fruit);
  if (countSolutions(t.rows, t.cols, (at) => t.fruit[at] > 0, lines, s.fruit) !== 1) return null;
  const board: Board = { rows: t.rows, cols: t.cols, solution: t.fruit, lines, maxFruit: s.fruit };
  if (!gate) return board;
  const h = humanSolve(board);
  return h.done && h.eliminations <= s.cap ? board : null;
}

/** The audited stacks (found by a seeded search, unique and solvable by rule): used if the seeded search runs dry. */
const grid = (rows: string[]) => [...rows.join('')].map((ch) => (ch === '#' ? 0 : Number(ch)));
const FALLBACK: Record<number, { rows: number; cols: number; fruit: number[] }> = {
  1: { rows: 2, cols: 2, fruit: grid(['51', '23']) },
  2: { rows: 3, cols: 4, fruit: grid(['#23#', '615#', '5#1#']) },
  3: { rows: 5, cols: 5, fruit: grid(['#14##', '##32#', '###61', '###35', '###12']) },
};
export const fallbackBoard = (level: number): Board => {
  const l = Math.min(3, Math.max(1, level));
  const f = FALLBACK[l];
  return {
    rows: f.rows,
    cols: f.cols,
    solution: [...f.fruit],
    lines: linesFrom(f.rows, f.cols, f.fruit),
    maxFruit: specOf(l).fruit,
  };
};

/** The round's stack, drawn from `rng`; a bounded search, then an audited one. */
export function makeBoard(level: number, rng: Rng): Board {
  for (let i = 0; i < 6000; i++) {
    const b = attempt(level, rng);
    if (b) return b;
  }
  return fallbackBoard(level);
}

/** A full board that is wrong is one miss; the same board judged again without a change is none. */
export const fillKey = (fill: readonly number[]) => fill.join(',');
export const countsMiss = (b: Board, fill: readonly number[], lastJudged: string | null) =>
  isFull(b, fill) && !isSolved(b, fill) && fillKey(fill) !== lastJudged;

export type Hint = { kind: 'remove'; cell: number } | { kind: 'place'; cell: number; line: number };

/** The next help: a fruit that cannot be in the answer comes back first; otherwise the next crate the rules settle. */
export function hintFor(b: Board, fill: readonly number[]): Hint | null {
  const wrong = fill.findIndex((v, at) => v > 0 && b.solution[at] !== v);
  if (wrong >= 0) return { kind: 'remove', cell: wrong };
  const next = humanSolve(b, fill).steps.find((s) => !(fill[s.cell] > 0));
  if (next) return { kind: 'place', cell: next.cell, line: next.line };
  const missing = b.solution.findIndex((v, at) => v > 0 && !(fill[at] > 0));
  if (missing < 0) return null;
  return { kind: 'place', cell: missing, line: b.lines.findIndex((l) => l.cells.includes(missing)) };
}
