import type { Rng } from '../../engine/random';
import type { BandLevels } from '../../progress/difficulty';

/** Pre-K plays level 1; school 2 then 3; grown-up 3. */
export const LEVELS: BandLevels = {
  prek: { min: 1, max: 1 },
  school: { min: 2, max: 3 },
  grownup: { min: 3, max: 3 },
};

export const describeLevel = (level: number) =>
  level <= 1
    ? 'A bunny for every patch: 4×4 meadow, one bunny already sitting, reach shown'
    : level === 2
      ? 'Rule it out: 5×5 meadow, reach shown'
      : 'Where is it forced?: 6×6 meadow, paw marks, reach lamp off until she turns it on';

export const sizeOf = (level: number) => (level <= 1 ? 4 : level === 2 ? 5 : 6);

export interface Board {
  n: number;
  /** Patch id (0..n-1) of every square, row by row. */
  patch: number[];
  /** The one answer: the column of the bunny in each row. */
  solution: number[];
  /** Level 1: a locked bunny already sitting (square index). */
  given?: number;
}

export const rowOf = (n: number, at: number) => Math.floor(at / n);
export const colOf = (n: number, at: number) => at % n;

export type ClashKind = 'row' | 'column' | 'patch' | 'touch';
export interface Clash {
  kind: ClashKind;
  a: number;
  b: number;
}

/** Every pair of bunnies that break a rule, first by the order the squares were listed. */
export function clashes(n: number, patch: readonly number[], bunnies: readonly number[]): Clash[] {
  const out: Clash[] = [];
  for (let i = 0; i < bunnies.length; i++)
    for (let j = i + 1; j < bunnies.length; j++) {
      const a = bunnies[i];
      const b = bunnies[j];
      const dr = Math.abs(rowOf(n, a) - rowOf(n, b));
      const dc = Math.abs(colOf(n, a) - colOf(n, b));
      const kind: ClashKind | null =
        dr === 0
          ? 'row'
          : dc === 0
            ? 'column'
            : patch[a] === patch[b]
              ? 'patch'
              : dr <= 1 && dc <= 1
                ? 'touch'
                : null;
      if (kind) out.push({ kind, a, b });
    }
  return out;
}

/** Squares a bunny reaches: its row, column, patch and touching squares (not itself). */
export function reachOf(n: number, patch: readonly number[], bunnies: readonly number[]): Set<number> {
  const out = new Set<number>();
  for (const b of bunnies)
    for (let s = 0; s < n * n; s++) {
      if (s === b) continue;
      const dr = Math.abs(rowOf(n, s) - rowOf(n, b));
      const dc = Math.abs(colOf(n, s) - colOf(n, b));
      if (dr === 0 || dc === 0 || patch[s] === patch[b] || (dr <= 1 && dc <= 1)) out.add(s);
    }
  return out;
}

/** The board is full of bunnies and every rule holds. */
export const isSolved = (board: Board, bunnies: readonly number[]) =>
  bunnies.length === board.n && clashes(board.n, board.patch, bunnies).length === 0;

/** How many answers a meadow has (stops at `limit`), with `given` forced in. */
export function countSolutions(n: number, patch: readonly number[], given?: number, limit = 2): number {
  let found = 0;
  const cols = new Set<number>();
  const patches = new Set<number>();
  const place = (row: number, prev: number) => {
    if (found >= limit) return;
    if (row === n) {
      found++;
      return;
    }
    for (let c = 0; c < n; c++) {
      const at = row * n + c;
      if (given !== undefined && rowOf(n, given) === row && at !== given) continue;
      if (cols.has(c) || patches.has(patch[at]) || (prev >= 0 && Math.abs(prev - c) <= 1)) continue;
      cols.add(c);
      patches.add(patch[at]);
      place(row + 1, c);
      cols.delete(c);
      patches.delete(patch[at]);
    }
  };
  place(0, -1);
  return found;
}

export interface Step {
  cell: number;
  why: 'patch' | 'row' | 'column';
}

/**
 * The rule-only solver (no guessing). Starts with `placed` bunnies; returns the squares it places next, in order, and
 * whether it finished. `advanced` adds the level-3 rule: k patches wholly inside k rows (columns) keep other patches out of them.
 */
export function humanSolve(
  n: number,
  patch: readonly number[],
  placed: readonly number[],
  advanced: boolean,
): { steps: Step[]; done: boolean } {
  const open = new Array<boolean>(n * n).fill(true);
  const bunnies: number[] = [];
  const steps: Step[] = [];
  const put = (cell: number) => {
    bunnies.push(cell);
    open[cell] = false;
    for (const s of reachOf(n, patch, [cell])) open[s] = false;
  };
  for (const p of placed) put(p);
  const lines = (kind: 'row' | 'column' | 'patch', id: number) => {
    const out: number[] = [];
    for (let s = 0; s < n * n; s++) {
      const v = kind === 'row' ? rowOf(n, s) : kind === 'column' ? colOf(n, s) : patch[s];
      if (v === id) out.push(s);
    }
    return out;
  };
  const has = (kind: 'row' | 'column' | 'patch', id: number) =>
    bunnies.some((b) => (kind === 'row' ? rowOf(n, b) : kind === 'column' ? colOf(n, b) : patch[b]) === id);
  for (let guard = 0; guard < 200 && bunnies.length < n; guard++) {
    let moved = false;
    for (const kind of ['patch', 'row', 'column'] as const) {
      for (let id = 0; id < n && !moved; id++) {
        if (has(kind, id)) continue;
        const free = lines(kind, id).filter((s) => open[s]);
        if (free.length === 1) {
          steps.push({ cell: free[0], why: kind });
          put(free[0]);
          moved = true;
        }
      }
      if (moved) break;
    }
    if (moved) continue;
    if (advanced) {
      // k patches whose open squares all sit in k rows (columns): other patches give up those lines.
      for (const axis of ['row', 'column'] as const) {
        const lineOf = (s: number) => (axis === 'row' ? rowOf(n, s) : colOf(n, s));
        const spans = new Map<number, Set<number>>();
        for (let id = 0; id < n; id++) {
          if (has('patch', id)) continue;
          spans.set(
            id,
            new Set(
              lines('patch', id)
                .filter((s) => open[s])
                .map(lineOf),
            ),
          );
        }
        const ids = [...spans.keys()];
        for (let mask = 1; mask < 1 << ids.length && !moved; mask++) {
          const group = ids.filter((_, i) => mask & (1 << i));
          const union = new Set<number>();
          for (const g of group) for (const l of spans.get(g)!) union.add(l);
          if (union.size !== group.length) continue;
          for (let s = 0; s < n * n; s++) {
            if (open[s] && union.has(lineOf(s)) && !group.includes(patch[s])) {
              open[s] = false;
              moved = true;
            }
          }
        }
        if (moved) break;
      }
    }
    if (!moved) break;
  }
  return { steps, done: bunnies.length === n };
}

const humanOk = (n: number, patch: readonly number[], given: number | undefined, level: number) =>
  humanSolve(n, patch, given === undefined ? [] : [given], level >= 2).done;

/** The audited boards (patch sizes balanced, found by a seeded search): unique answers, solvable by rule; used if the seeded search fails. */
const LETTER = (rows: string[]) => [...rows.join('')].map((ch) => ch.charCodeAt(0) - 65);
const FALLBACK: Record<number, Board> = {
  1: { n: 4, patch: LETTER(['AAAB', 'DAAB', 'DAAB', 'DCCC']), solution: [1, 3, 0, 2], given: 1 },
  2: {
    n: 5,
    patch: LETTER(['AACBB', 'CCCBB', 'DCCBB', 'DCEEE', 'DEEEE']),
    solution: [1, 4, 2, 0, 3],
  },
  3: {
    n: 6,
    patch: LETTER(['AAAABB', 'AAAABB', 'CCCBBB', 'DCCCBB', 'DDDEEB', 'DFFFEE']),
    solution: [3, 5, 2, 0, 4, 1],
  },
};
export const fallbackBoard = (level: number): Board => {
  const b = FALLBACK[Math.min(3, Math.max(1, level))];
  return { ...b, patch: [...b.patch], solution: [...b.solution] };
};

/** A seeded meadow: one bunny per row and column, none touching, patches grown from them. */
export function attempt(level: number, rng: Rng, gate = true): Board | null {
  const n = sizeOf(level);
  const solution: number[] = [];
  const used = new Set<number>();
  const fill = (row: number): boolean => {
    if (row === n) return true;
    for (const c of rng.shuffle(Array.from({ length: n }, (_, i) => i))) {
      if (used.has(c) || (row > 0 && Math.abs(solution[row - 1] - c) <= 1)) continue;
      used.add(c);
      solution.push(c);
      if (fill(row + 1)) return true;
      solution.pop();
      used.delete(c);
    }
    return false;
  };
  if (!fill(0)) return null;
  const patch = new Array<number>(n * n).fill(-1);
  solution.forEach((c, r) => (patch[r * n + c] = r));
  let left = n * n - n;
  while (left > 0) {
    const frontier: [number, number][] = [];
    for (let s = 0; s < n * n; s++) {
      if (patch[s] >= 0) continue;
      const r = rowOf(n, s);
      const c = colOf(n, s);
      for (const t of [
        r > 0 ? s - n : -1,
        r < n - 1 ? s + n : -1,
        c > 0 ? s - 1 : -1,
        c < n - 1 ? s + 1 : -1,
      ])
        if (t >= 0 && patch[t] >= 0) frontier.push([s, patch[t]]);
    }
    const [s, id] = rng.pick(frontier);
    patch[s] = id;
    left--;
  }
  const sizes = new Array<number>(n).fill(0);
  for (const p of patch) sizes[p]++;
  if (sizes.some((z) => z < 2 || z > 2 * n - 2)) return null;
  const board: Board = { n, patch, solution: solution.map((c, r) => r * n + c).map((s) => colOf(n, s)) };
  if (level === 1) {
    if (countSolutions(n, patch) < 2) return null;
    board.given = (() => {
      const r = rng.int(0, n - 1);
      return r * n + solution[r];
    })();
    if (countSolutions(n, patch, board.given) !== 1) return null;
  } else if (countSolutions(n, patch) !== 1) return null;
  return !gate || humanOk(n, patch, board.given, level) ? board : null;
}

/** The round's meadow, drawn from `rng`; a bounded search, then the audited board. */
export function makeBoard(level: number, rng: Rng): Board {
  for (let i = 0; i < 12000; i++) {
    const b = attempt(level, rng);
    if (b) return b;
  }
  return fallbackBoard(level);
}

/** The first rule a set of bunnies breaks, for the spoken hint. */
export const firstClash = (board: Board, bunnies: readonly number[]): Clash | null =>
  clashes(board.n, board.patch, bunnies)[0] ?? null;

/** A full board that is wrong is one miss; the same board judged again without a change is none. */
export const boardKey = (bunnies: readonly number[]) => [...bunnies].sort((a, b) => a - b).join(',');
export function countsMiss(board: Board, bunnies: readonly number[], lastJudged: string | null): boolean {
  return bunnies.length === board.n && !isSolved(board, bunnies) && boardKey(bunnies) !== lastJudged;
}

export type Hint = { kind: 'remove'; cell: number } | { kind: 'place'; cell: number; why: Step['why'] };

/** The next help: a bunny that cannot be in the answer comes back first; otherwise the next forced square. */
export function hintFor(board: Board, bunnies: readonly number[]): Hint | null {
  const answer = new Set(board.solution.map((c, r) => r * board.n + c));
  const wrong = bunnies.find((b) => !answer.has(b) && b !== board.given);
  if (wrong !== undefined) return { kind: 'remove', cell: wrong };
  const plan = humanSolve(board.n, board.patch, bunnies, board.n >= 5);
  const next = plan.steps[0];
  if (next) return { kind: 'place', cell: next.cell, why: next.why };
  const missing = [...answer].find((s) => !bunnies.includes(s));
  return missing === undefined ? null : { kind: 'place', cell: missing, why: 'patch' };
}

/** Every square of the answer, for tests and the ghost finger. */
export const answerCells = (board: Board) => board.solution.map((c, r) => r * board.n + c);
