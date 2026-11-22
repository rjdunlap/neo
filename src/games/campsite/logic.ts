import type { BandLevels } from '../../progress/difficulty';

/** School plays the one authored board; larger camps need their own definition (docs/definitions/campsite.md). */
export const LEVELS: BandLevels = { school: { min: 1, max: 1 } };

export const describeLevel = (_level: number) =>
  'Pitch the tents: 4×4 camp, three trees, a tent beside each tree, row and column counts, no tents touching';

export const N = 4;
/** Square index from a row and column counted from 1, as the definition writes them (R1C2 is `at(1, 2)`). */
export const at = (row: number, col: number) => (row - 1) * N + (col - 1);
export const rowOf = (s: number) => Math.floor(s / N);
export const colOf = (s: number) => s % N;

export interface Camp {
  /** Tree squares, fixed. */
  trees: number[];
  /** Tents wanted in each row, top first. */
  rows: number[];
  /** Tents wanted in each column, left first. */
  cols: number[];
  /** The one answer, in the order the deductions find it. */
  solution: number[];
}

/** The authored opening board, used on every round and replay. */
export const CAMP: Camp = {
  trees: [at(1, 1), at(2, 3), at(2, 4)],
  rows: [2, 0, 1, 0],
  cols: [0, 1, 1, 1],
  solution: [at(1, 2), at(3, 3), at(1, 4)],
};

/** The board that meets every count and pairs every tree but has two tents touching: the scripted wrong answer. */
export const TOUCHING_BOARD = [at(1, 2), at(1, 3), at(3, 4)];

/** One tent per tree. */
export const TENTS = CAMP.trees.length;

/** The orthogonal neighbours of a square. */
export function sides(s: number): number[] {
  const r = rowOf(s);
  const c = colOf(s);
  const out: number[] = [];
  if (r > 0) out.push(s - N);
  if (c > 0) out.push(s - 1);
  if (c < N - 1) out.push(s + 1);
  if (r < N - 1) out.push(s + N);
  return out;
}

/** Grass squares beside a tree: where its tent may go. */
export const treeSides = (camp: Camp, tree: number) => sides(tree).filter((s) => !camp.trees.includes(s));

export const touches = (a: number, b: number) =>
  a !== b && Math.abs(rowOf(a) - rowOf(b)) <= 1 && Math.abs(colOf(a) - colOf(b)) <= 1;

/** Every pair of tents that meet along an edge or at a corner. */
export function touchingPairs(tents: readonly number[]): [number, number][] {
  const out: [number, number][] = [];
  for (let i = 0; i < tents.length; i++)
    for (let j = i + 1; j < tents.length; j++)
      if (touches(tents[i], tents[j])) out.push([tents[i], tents[j]]);
  return out;
}

export const countIn = (tents: readonly number[], axis: 'row' | 'col', line: number) =>
  tents.filter((t) => (axis === 'row' ? rowOf(t) : colOf(t)) === line).length;

/** The first row, then the first column, whose tent count differs from its sign. */
export function countError(
  camp: Camp,
  tents: readonly number[],
): { axis: 'row' | 'col'; line: number } | null {
  for (let r = 0; r < N; r++) if (countIn(tents, 'row', r) !== camp.rows[r]) return { axis: 'row', line: r };
  for (let c = 0; c < N; c++) if (countIn(tents, 'col', c) !== camp.cols[c]) return { axis: 'col', line: c };
  return null;
}

/**
 * Gives each tree its own tent beside it, whatever order the tents went up (a bipartite matching). Returns the pairing,
 * or the trees left out: one tree alone has no tent beside it; two or more are competing for too few tents.
 */
export function pairTrees(
  camp: Camp,
  tents: readonly number[],
): { ok: true; tentOf: Map<number, number> } | { ok: false; trees: number[] } {
  const treeOfTent = new Map<number, number>();
  const tryTree = (tree: number, seen: Set<number>): boolean => {
    for (const s of sides(tree)) {
      if (!tents.includes(s) || seen.has(s)) continue;
      seen.add(s);
      const owner = treeOfTent.get(s);
      if (owner === undefined || tryTree(owner, seen)) {
        treeOfTent.set(s, tree);
        return true;
      }
    }
    return false;
  };
  const left = camp.trees.filter((tree) => !tryTree(tree, new Set()));
  if (left.length === 0) {
    const tentOf = new Map<number, number>();
    for (const [tent, tree] of treeOfTent) tentOf.set(tree, tent);
    return { ok: true, tentOf };
  }
  // A tree with no tent beside it at all is named alone; otherwise every tree reaching only the contested tents.
  const lonely = left.find((tree) => !sides(tree).some((s) => tents.includes(s)));
  if (lonely !== undefined) return { ok: false, trees: [lonely] };
  const contested = new Set(left.flatMap((tree) => sides(tree).filter((s) => tents.includes(s))));
  return {
    ok: false,
    trees: camp.trees.filter((tree) => sides(tree).some((s) => contested.has(s))),
  };
}

export type Verdict =
  | { kind: 'short'; left: number }
  | { kind: 'touch'; pair: [number, number] }
  | { kind: 'count'; axis: 'row' | 'col'; line: number }
  | { kind: 'pairing'; trees: number[] }
  | { kind: 'solved' };

/** Check camp: fewer than three tents, then touching, then a wrong count, then trees without their own tent. */
export function judge(camp: Camp, tents: readonly number[]): Verdict {
  const want = camp.trees.length;
  if (tents.length < want) return { kind: 'short', left: want - tents.length };
  const pair = touchingPairs(tents)[0];
  if (pair) return { kind: 'touch', pair };
  const count = countError(camp, tents);
  if (count) return { kind: 'count', ...count };
  const paired = pairTrees(camp, tents);
  if (!paired.ok) return { kind: 'pairing', trees: paired.trees };
  return { kind: 'solved' };
}

/** A board's identity whatever order its tents went up. */
export const campKey = (tents: readonly number[]) => [...tents].sort((a, b) => a - b).join(',');

/**
 * Miss accounting for Check camp: a full wrong board counts once the first time it is checked in the round; a part-full
 * board, or one already checked, is free. Returns whether this check is a new miss.
 */
export function checkCounts(checked: Set<string>, camp: Camp, tents: readonly number[]): boolean {
  if (tents.length < camp.trees.length) return false;
  const v = judge(camp, tents);
  if (v.kind === 'solved') return false;
  const key = campKey(tents);
  if (checked.has(key)) return false;
  checked.add(key);
  return true;
}

export type Step = 'first' | 'second' | 'third';
export type Hint =
  | { kind: 'pack'; cell: number }
  | { kind: 'pitch'; cell: number; step: Step; also: { tree?: number; row?: number } };

/** What each deduction points at as well as its square: the tree it serves, and the count it leans on. */
const STEPS: { step: Step; tree: number; row?: number }[] = [
  { step: 'first', tree: at(1, 1), row: 1 },
  { step: 'second', tree: at(2, 3) },
  { step: 'third', tree: at(2, 4), row: 2 },
];

/** The next help: the first tent (in row order) outside the answer comes down; otherwise the next square in deduction order. */
export function hintFor(camp: Camp, tents: readonly number[]): Hint | null {
  const wrong = [...tents].sort((a, b) => a - b).find((t) => !camp.solution.includes(t));
  if (wrong !== undefined) return { kind: 'pack', cell: wrong };
  const i = camp.solution.findIndex((s) => !tents.includes(s));
  if (i < 0) return null;
  const { step, tree, row } = STEPS[i];
  return { kind: 'pitch', cell: camp.solution[i], step, also: row === undefined ? { tree } : { tree, row } };
}

/** Every way to choose `k` of the grass squares, for the uniqueness test. */
export function choices(camp: Camp, k = TENTS): number[][] {
  const grass = Array.from({ length: N * N }, (_, s) => s).filter((s) => !camp.trees.includes(s));
  const out: number[][] = [];
  const pick = (from: number, chosen: number[]) => {
    if (chosen.length === k) {
      out.push([...chosen]);
      return;
    }
    for (let i = from; i < grass.length; i++) pick(i + 1, [...chosen, grass[i]]);
  };
  pick(0, []);
  return out;
}

export type PackWhy = 'zero-row' | 'zero-col' | 'no-tree' | 'in-the-way';

/** Why a tent outside the answer comes down, from the board she can see: a zero sign, no tree beside it, or in another tree's way. */
export function packWhy(camp: Camp, cell: number): PackWhy {
  if (camp.rows[rowOf(cell)] === 0) return 'zero-row';
  if (camp.cols[colOf(cell)] === 0) return 'zero-col';
  if (!sides(cell).some((s) => camp.trees.includes(s))) return 'no-tree';
  return 'in-the-way';
}
