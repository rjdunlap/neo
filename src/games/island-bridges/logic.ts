import type { Rng } from '../../engine/random';

/**
 * Island Bridges' rules (Hashi). Numbered islands sit on a grid. Join them with straight plank bridges, one or two between
 * the same pair, so that every island has as many planks as its number, no bridge crosses another, and all the islands are
 * joined into one group. A bridge runs from an island to the next island along a row or column, with nothing between.
 */
export interface Island {
  r: number;
  c: number;
  /** How many planks the island must end up with. */
  n: number;
}

export interface Edge {
  /** The two islands, a before b in reading order. */
  a: number;
  b: number;
  dir: 'h' | 'v';
}

export interface Layout {
  size: number;
  islands: readonly Island[];
  /** Every pair of islands a bridge could join. */
  edges: readonly Edge[];
  /** For each edge, the edges it would cross. */
  crossing: readonly (readonly number[])[];
  /** For each island, its edges. */
  at: readonly (readonly number[])[];
}

export const MAX_PLANKS = 2;

/** Build everything the rules need from a list of islands: the pairs that face each other, and which of those cross. */
export function layoutOf(size: number, islands: readonly Island[]): Layout {
  const at = new Map<number, number>(islands.map((il, i) => [il.r * size + il.c, i]));
  const edges: Edge[] = [];
  islands.forEach((il, i) => {
    for (const [dr, dc, dir] of [[0, 1, 'h'], [1, 0, 'v']] as const) {
      for (let r = il.r + dr, c = il.c + dc; r < size && c < size; r += dr, c += dc) {
        const j = at.get(r * size + c);
        if (j === undefined) continue;
        // Islands right beside each other have no room for a bridge.
        if (Math.abs(r - il.r) + Math.abs(c - il.c) > 1) edges.push({ a: i, b: j, dir });
        break;
      }
    }
  });
  const cross = (e: Edge, f: Edge) => {
    if (e.dir === f.dir) return false;
    const [h, v] = e.dir === 'h' ? [e, f] : [f, e];
    const hi = islands[h.a], hj = islands[h.b], vi = islands[v.a], vj = islands[v.b];
    return hi.r > vi.r && hi.r < vj.r && vi.c > hi.c && vi.c < hj.c;
  };
  const crossing = edges.map((e, i) => edges.map((f, j) => (i !== j && cross(e, f) ? j : -1)).filter((j) => j >= 0));
  const incident = islands.map((_, i) => edges.map((e, k) => (e.a === i || e.b === i ? k : -1)).filter((k) => k >= 0));
  return { size, islands, edges, crossing, at: incident };
}

/** Planks on every edge: 0, 1 or 2. */
export type Planks = readonly number[];

export const planksAt = (layout: Layout, planks: Planks, island: number) => layout.at[island].reduce((n, e) => n + planks[e], 0);

/** Whether a plank can be added to an edge right now: fewer than two, nothing crossing it, and room at both ends. */
export function canAdd(layout: Layout, planks: Planks, edge: number): boolean {
  const e = layout.edges[edge];
  if (planks[edge] >= MAX_PLANKS) return false;
  if (layout.crossing[edge].some((f) => planks[f] > 0)) return false;
  return planksAt(layout, planks, e.a) < layout.islands[e.a].n && planksAt(layout, planks, e.b) < layout.islands[e.b].n;
}

/** Whether every island is joined to every other by bridges. */
export function connected(layout: Layout, planks: Planks): boolean {
  if (!layout.islands.length) return true;
  const seen = new Set<number>([0]);
  const stack = [0];
  while (stack.length) {
    const i = stack.pop()!;
    for (const k of layout.at[i]) {
      if (!planks[k]) continue;
      const e = layout.edges[k], j = e.a === i ? e.b : e.a;
      if (!seen.has(j)) { seen.add(j); stack.push(j); }
    }
  }
  return seen.size === layout.islands.length;
}

/** Every island has exactly its number of planks, nothing crosses, and the islands are one group. */
export function isSolved(layout: Layout, planks: Planks): boolean {
  if (layout.islands.some((il, i) => planksAt(layout, planks, i) !== il.n)) return false;
  if (layout.edges.some((_, k) => planks[k] > 0 && layout.crossing[k].some((f) => planks[f] > 0))) return false;
  return connected(layout, planks);
}

/** An island that has too many planks, or whose planks can no longer reach its number: where something has gone wrong. */
export function trouble(layout: Layout, planks: Planks): number[] {
  return layout.islands.map((il, i) => {
    const have = planksAt(layout, planks, i);
    if (have > il.n) return i;
    // The most it could still get: two on every edge whose other end has room and that nothing crosses.
    let room = 0;
    for (const k of layout.at[i]) {
      if (layout.crossing[k].some((f) => planks[f] > 0)) continue;
      const e = layout.edges[k], other = e.a === i ? e.b : e.a;
      room += Math.min(MAX_PLANKS - planks[k], layout.islands[other].n - planksAt(layout, planks, other));
    }
    return have + room < il.n ? i : -1;
  }).filter((i) => i >= 0);
}

/* ------------------------------------------------------------------------------------------------ */
/* Solving                                                                                            */
/* ------------------------------------------------------------------------------------------------ */

export interface Solved {
  /** Up to `limit` complete ways, each the planks on every edge. */
  found: number[][];
}

/**
 * Every way to finish the puzzle from some planks already placed (`-1` for an edge still open; any other number is fixed),
 * counting no further than `limit`. Each island has to reach its number and nothing may cross, which settles most edges by
 * itself (`propagate`); what is left is searched, and a finished try must also join all the islands.
 */
export function solve(layout: Layout, fixed?: readonly number[], limit = 2, noGuessing = false): Solved {
  const E = layout.edges.length, N = layout.islands.length;
  const found: number[][] = [];

  /** Settle what must be, from each island's need and the room it has. Returns false on a contradiction. */
  const propagate = (val: number[]): boolean => {
    for (let again = true; again; ) {
      again = false;
      const have = Array<number>(N).fill(0);
      for (let k = 0; k < E; k++) if (val[k] > 0) { have[layout.edges[k].a] += val[k]; have[layout.edges[k].b] += val[k]; }
      for (let i = 0; i < N; i++) if (have[i] > layout.islands[i].n) return false;
      for (let k = 0; k < E; k++) if (val[k] > 0 && layout.crossing[k].some((f) => val[f] > 0)) return false;
      /** What an open edge could still carry: two, less what either end can still take, and nothing if a bridge crosses it. */
      const cap = (k: number) => {
        if (layout.crossing[k].some((f) => val[f] > 0)) return 0;
        const e = layout.edges[k];
        return Math.max(0, Math.min(MAX_PLANKS, layout.islands[e.a].n - have[e.a], layout.islands[e.b].n - have[e.b]));
      };
      // One change at a time, then the counts are read again: a count read before a change would be wrong after it.
      scan: for (let i = 0; i < N; i++) {
        const need = layout.islands[i].n - have[i];
        const open = layout.at[i].filter((k) => val[k] < 0), caps = open.map(cap), total = caps.reduce((a, b) => a + b, 0);
        if (total < need) return false;
        for (let x = 0; x < open.length; x++) {
          const k = open[x];
          if (caps[x] === 0 || need === 0) { val[k] = 0; again = true; break scan; }
          const least = Math.max(0, need - (total - caps[x]));
          if (least === 0) continue;
          // This edge must carry at least `least`, so whatever crosses it carries nothing.
          for (const f of layout.crossing[k]) {
            if (val[f] > 0) return false;
            if (val[f] < 0) { val[f] = 0; again = true; break scan; }
          }
          if (least === caps[x]) { val[k] = caps[x]; again = true; break scan; }
        }
      }
    }
    return true;
  };

  const go = (start: number[]) => {
    if (found.length >= limit) return;
    const val = start.slice();
    if (!propagate(val)) return;
    // Branch on the open edge with the most crossings, which settles the most.
    let pick = -1;
    for (let k = 0; k < E; k++) if (val[k] < 0 && (pick < 0 || layout.crossing[k].length > layout.crossing[pick].length)) pick = k;
    if (pick < 0) {
      if (isSolved(layout, val)) found.push(val);
      return;
    }
    if (noGuessing) return;
    for (const v of [0, 1, 2]) {
      const next = val.slice();
      next[pick] = v;
      go(next);
      if (found.length >= limit) return;
    }
  };
  go(fixed ? fixed.slice() : Array<number>(E).fill(-1));
  return { found };
}

/**
 * Whether counting alone finishes the puzzle: each island's number against the room it has, with no guessing. This is the
 * measure of an easy puzzle; the solver may still have to try things on a harder one.
 */
export function bycounting(layout: Layout): boolean {
  const { found } = solve(layout, undefined, 1, true);
  return found.length === 1;
}

export interface Puzzle {
  size: number;
  layout: Layout;
  /** The one way to finish it. */
  solution: number[];
  /** The planks in the solution: the fewest a finished puzzle can take. */
  par: number;
}

/** A puzzle from its picture: digits are islands, `.` is water. Its solution is worked out, and must be the only one. */
export function parsePuzzle(rows: readonly string[]): Puzzle {
  const size = rows.length;
  if (rows.some((r) => r.length !== size)) throw new Error('a puzzle is a square');
  const islands: Island[] = [];
  rows.forEach((row, r) => [...row].forEach((ch, c) => { if (ch !== '.') islands.push({ r, c, n: Number(ch) }); }));
  const layout = layoutOf(size, islands);
  const { found } = solve(layout);
  if (found.length !== 1) throw new Error(`a puzzle needs exactly one solution, this has ${found.length}`);
  return { size, layout, solution: found[0], par: found[0].reduce((n, p) => n + p, 0) };
}

export const picture = (size: number, islands: readonly Island[]): string[] =>
  Array.from({ length: size }, (_, r) => Array.from({ length: size }, (_, c) => { const il = islands.find((i) => i.r === r && i.c === c); return il ? String(il.n) : '.'; }).join(''));

/* ------------------------------------------------------------------------------------------------ */
/* Plans and puzzles                                                                                  */
/* ------------------------------------------------------------------------------------------------ */

export interface BridgePlan {
  /** For grown-ups. */
  name: string;
  size: number;
  islands: { min: number; max: number };
  /** The easy levels only keep a puzzle that counting alone finishes. */
  counting: boolean;
  /** Puzzles in one round. */
  puzzles: number;
}

export const PLANS: BridgePlan[] = [
  { name: 'A 7 by 7 sea with a handful of islands', size: 7, islands: { min: 7, max: 9 }, counting: true, puzzles: 1 },
  { name: 'A 9 by 9 sea', size: 9, islands: { min: 11, max: 14 }, counting: true, puzzles: 1 },
  { name: 'A busier 9 by 9 sea, where counting is not always enough', size: 9, islands: { min: 15, max: 18 }, counting: false, puzzles: 1 },
  { name: 'A big 11 by 11 sea', size: 11, islands: { min: 19, max: 24 }, counting: false, puzzles: 1 },
];

export const planFor = (level: number): BridgePlan => PLANS[Math.min(PLANS.length, Math.max(1, level)) - 1];

/**
 * Grow a layout and its planks together: islands are added one at a time, each joined to an island already there by a bridge
 * with room for it, then some extra bridges are added where two islands face each other across clear water. The numbers are
 * the planks each island ended up with. A puzzle is kept only if it has exactly one solution.
 */
export function makePuzzle(plan: BridgePlan, rng: Rng): Puzzle {
  const { size } = plan;
  for (let attempt = 0; attempt < 600; attempt++) {
    const want = rng.int(plan.islands.min, plan.islands.max);
    const grid = new Map<number, 'i' | 'h' | 'v'>();
    const key = (r: number, c: number) => r * size + c;
    const islands: { r: number; c: number }[] = [{ r: rng.int(0, size - 1), c: rng.int(0, size - 1) }];
    grid.set(key(islands[0].r, islands[0].c), 'i');
    const bridges: { a: number; b: number; planks: number }[] = [];
    const clear = (r: number, c: number) => r >= 0 && r < size && c >= 0 && c < size && !grid.has(key(r, c));
    const touching = (r: number, c: number) => [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dr, dc]) => grid.get(key(r + dr, c + dc)) === 'i');
    for (let tries = 0; tries < 400 && islands.length < want; tries++) {
      const from = rng.int(0, islands.length - 1), [dr, dc] = rng.pick([[0, 1], [1, 0], [0, -1], [-1, 0]]);
      const len = rng.int(2, 5);
      const r = islands[from].r + dr * len, c = islands[from].c + dc * len;
      let ok = clear(r, c) && !touching(r, c);
      for (let k = 1; ok && k < len; k++) ok = clear(islands[from].r + dr * k, islands[from].c + dc * k);
      if (!ok) continue;
      const orient = dr === 0 ? 'h' : 'v';
      for (let k = 1; k < len; k++) grid.set(key(islands[from].r + dr * k, islands[from].c + dc * k), orient);
      grid.set(key(r, c), 'i');
      islands.push({ r, c });
      bridges.push({ a: from, b: islands.length - 1, planks: rng.chance(0.4) ? 2 : 1 });
    }
    if (islands.length < plan.islands.min) continue;
    // Extra bridges where two islands face each other across water nothing else crosses.
    const loose = layoutOf(size, islands.map((il) => ({ ...il, n: 0 })));
    for (const e of rng.shuffle([...loose.edges])) {
      if (!rng.chance(0.55) || bridges.some((b) => (b.a === e.a && b.b === e.b) || (b.a === e.b && b.b === e.a))) continue;
      const A = islands[e.a], B = islands[e.b], cells: [number, number][] = [];
      for (let r = A.r + (e.dir === 'v' ? 1 : 0), c = A.c + (e.dir === 'h' ? 1 : 0); r < B.r || c < B.c; r += e.dir === 'v' ? 1 : 0, c += e.dir === 'h' ? 1 : 0) cells.push([r, c]);
      if (cells.some(([r, c]) => grid.has(key(r, c)))) continue;
      cells.forEach(([r, c]) => grid.set(key(r, c), e.dir));
      bridges.push({ a: e.a, b: e.b, planks: rng.chance(0.4) ? 2 : 1 });
    }
    const counts = islands.map(() => 0);
    for (const b of bridges) { counts[b.a] += b.planks; counts[b.b] += b.planks; }
    if (counts.some((n) => n > 8)) continue;
    // In reading order, so the islands and edges are numbered the same way as when the puzzle is read back from its picture.
    const numbered = islands.map((il, i) => ({ ...il, n: counts[i] })).sort((a, b) => a.r - b.r || a.c - b.c);
    const layout = layoutOf(size, numbered);
    const { found } = solve(layout);
    if (found.length === 1 && (!plan.counting || bycounting(layout))) return { size, layout, solution: found[0], par: found[0].reduce((n, p) => n + p, 0) };
  }
  throw new Error(`could not make a puzzle for ${plan.name}`);
}

export const makePuzzles = (plan: BridgePlan, rng: Rng): Puzzle[] => Array.from({ length: plan.puzzles }, () => makePuzzle(plan, rng));

/* ------------------------------------------------------------------------------------------------ */
/* The cursor and hints                                                                               */
/* ------------------------------------------------------------------------------------------------ */

/**
 * Couch play: the island the highlight moves to when the stick is pushed in a direction (0 right, 1 down, 2 left, 3 up): the
 * nearest island in the cone that way, else the nearest on that side, so the highlight can reach every island.
 */
export function islandToward(layout: Layout, from: number, dir: number): number | null {
  const at = layout.islands[from];
  let cone: number | null = null, coneScore = Infinity, side: number | null = null, sideScore = Infinity;
  layout.islands.forEach((il, j) => {
    if (j === from) return;
    const dx = il.c - at.c, dy = il.r - at.r;
    const along = [dx, dy, -dx, -dy][dir], across = Math.abs(dir % 2 === 0 ? dy : dx);
    if (along < 1) return;
    const score = along + 2 * across;
    if (across <= along && score < coneScore) { coneScore = score; cone = j; }
    if (score < sideScore) { sideScore = score; side = j; }
  });
  return cone ?? side;
}

/** The edge from an island in a direction (0 right, 1 down, 2 left, 3 up), if an island faces it that way. */
export function edgeToward(layout: Layout, island: number, dir: number): number | null {
  for (const k of layout.at[island]) {
    const e = layout.edges[k], other = layout.islands[e.a === island ? e.b : e.a], me = layout.islands[island];
    const d = other.c > me.c ? 0 : other.c < me.c ? 2 : other.r > me.r ? 1 : 3;
    if (d === dir) return k;
  }
  return null;
}

export const otherEnd = (layout: Layout, edge: number, island: number) => (layout.edges[edge].a === island ? layout.edges[edge].b : layout.edges[edge].a);

export type Hint =
  /** A plank she placed that is not in the solution: take it off. */
  | { kind: 'fix'; edge: number }
  /** An island that can only be finished one way: this edge needs one more plank. */
  | { kind: 'forced'; edge: number; island: number }
  /** Nothing is forced by one island alone: an edge that needs a plank in the solution. */
  | { kind: 'next'; edge: number };

/**
 * Where a hint should point. First a plank that does not belong (more planks on an edge than the solution has); otherwise an
 * edge one island decides by itself (its number equals the room it has left, so each open edge must be filled), and failing
 * that any edge that still needs a plank.
 */
export function hintFor(layout: Layout, planks: Planks, solution: Planks): Hint | null {
  const wrong = planks.findIndex((p, k) => p > solution[k]);
  if (wrong >= 0) return { kind: 'fix', edge: wrong };
  const need = solution.findIndex((s, k) => planks[k] < s);
  if (need < 0) return null;
  for (let i = 0; i < layout.islands.length; i++) {
    const left = layout.islands[i].n - planksAt(layout, planks, i);
    if (left <= 0) continue;
    const open = layout.at[i].filter((k) => solution[k] > planks[k]);
    // Everything the island still needs goes on the edges it has room for: one forced edge is enough to start.
    let room = 0;
    for (const k of layout.at[i]) {
      if (layout.crossing[k].some((f) => planks[f] > 0)) continue;
      const other = otherEnd(layout, k, i);
      room += Math.min(MAX_PLANKS - planks[k], layout.islands[other].n - planksAt(layout, planks, other));
    }
    if (room === left && open.length) return { kind: 'forced', edge: open[0], island: i };
  }
  return { kind: 'next', edge: need };
}

/** The pushes of the stick that take the highlight from one island to another, or null if it cannot get there. */
export function focusPath(layout: Layout, from: number, to: number): number[] | null {
  const seen = new Map<number, number[]>([[from, []]]);
  const queue = [from];
  for (let head = 0; head < queue.length; head++) {
    const at = queue[head];
    if (at === to) return seen.get(at)!;
    for (const dir of [0, 1, 2, 3]) {
      const next = islandToward(layout, at, dir);
      if (next === null || seen.has(next)) continue;
      seen.set(next, [...seen.get(at)!, dir]);
      queue.push(next);
    }
  }
  return null;
}

/** The direction (0 right, 1 down, 2 left, 3 up) from one island to the island at the other end of an edge. */
export function directionOf(layout: Layout, island: number, edge: number): number {
  const other = layout.islands[otherEnd(layout, edge, island)], me = layout.islands[island];
  return other.c > me.c ? 0 : other.c < me.c ? 2 : other.r > me.r ? 1 : 3;
}
