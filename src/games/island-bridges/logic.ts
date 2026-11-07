import type { Rng } from '../../engine/random';
import type { BandLevels } from '../../progress/difficulty';

/**
 * Island Bridges' rules (Hashi). Numbered islands sit on a grid. Join them with straight plank bridges, one or two between
 * the same pair (up to three on level 7's sea), so that every island has as many planks as its number, no bridge crosses another, and all the islands are
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
  /** The most planks one bridge can carry: two, or three on level 7's sea. */
  max: number;
}

export const MAX_PLANKS = 2;

/** Build everything the rules need from a list of islands: the pairs that face each other, and which of those cross. */
export function layoutOf(size: number, islands: readonly Island[], max = MAX_PLANKS): Layout {
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
  return { size, islands, edges, crossing, at: incident, max };
}

/** Planks on every edge: 0 up to the layout's `max`. */
export type Planks = readonly number[];

export const planksAt = (layout: Layout, planks: Planks, island: number) => layout.at[island].reduce((n, e) => n + planks[e], 0);

/** Whether a plank can be added to an edge right now: fewer than the most it carries, nothing crossing it, and room at both ends. */
export function canAdd(layout: Layout, planks: Planks, edge: number): boolean {
  const e = layout.edges[edge];
  if (planks[edge] >= layout.max) return false;
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
    // The most it could still get: the most a bridge carries on every edge whose other end has room and that nothing crosses.
    let room = 0;
    for (const k of layout.at[i]) {
      if (layout.crossing[k].some((f) => planks[f] > 0)) continue;
      const e = layout.edges[k], other = e.a === i ? e.b : e.a;
      room += Math.min(layout.max - planks[k], layout.islands[other].n - planksAt(layout, planks, other));
    }
    return have + room < il.n ? i : -1;
  }).filter((i) => i >= 0);
}

/**
 * Keep them joined (isolation): the group of islands that `add` more planks on an edge would close off, or null. A group is
 * closed off when the plank fills both ends exactly and every island joined to them (by planks already laid, read from `laid`,
 * where a negative value counts as none) is full too, so nothing can ever join it to the rest, while islands are left outside.
 * Only filling an edge all the way can do that, so the rule only ever takes one plank off what an edge could carry.
 */
export function closesOff(layout: Layout, laid: readonly number[], edge: number, add: number): number[] | null {
  const N = layout.islands.length, e = layout.edges[edge];
  const on = (k: number) => Math.max(0, laid[k]) + (k === edge ? add : 0);
  const full = (i: number) => layout.at[i].reduce((n, k) => n + on(k), 0) === layout.islands[i].n;
  if (add <= 0 || !full(e.a) || !full(e.b)) return null;
  const seen = new Set<number>([e.a]);
  const stack = [e.a];
  while (stack.length) {
    const i = stack.pop()!;
    if (!full(i)) return null;
    for (const k of layout.at[i]) {
      if (!on(k)) continue;
      const j = otherEnd(layout, k, i);
      if (!seen.has(j)) { seen.add(j); stack.push(j); }
    }
  }
  return seen.size < N ? [...seen].sort((a, b) => a - b) : null;
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
 * itself (`propagate`); what is left is searched, and a finished try must also join all the islands. With `isolation`, the
 * settling also knows that no bridge may close a group off (`closesOff`); it is off by default, so the easy levels' seas and
 * the frozen courses are judged as they always were.
 */
export function solve(layout: Layout, fixed?: readonly number[], limit = 2, noGuessing = false, isolation = false): Solved {
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
      /** What an open edge could still carry: the most a bridge carries, less what either end can still take, and nothing if a bridge crosses it. */
      const cap = (k: number) => {
        if (layout.crossing[k].some((f) => val[f] > 0)) return 0;
        const e = layout.edges[k];
        const most = Math.max(0, Math.min(layout.max, layout.islands[e.a].n - have[e.a], layout.islands[e.b].n - have[e.b]));
        return isolation && most > 0 && closesOff(layout, val, k, most) ? most - 1 : most;
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
    for (let v = 0; v <= layout.max; v++) {
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

/** Whether counting and keeping them joined (`closesOff`) finish the puzzle together, with no guessing: level 6's measure. */
export function byreasoning(layout: Layout): boolean {
  const { found } = solve(layout, undefined, 1, true, true);
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

/**
 * A puzzle from its picture: digits are islands (`a` to `c` for 10 to 12, on a three-plank sea), `.` is water. Its solution is
 * worked out, and must be the only one.
 */
export function parsePuzzle(rows: readonly string[], max = MAX_PLANKS): Puzzle {
  const size = rows.length;
  if (rows.some((r) => r.length !== size)) throw new Error('a puzzle is a square');
  const islands: Island[] = [];
  rows.forEach((row, r) => [...row].forEach((ch, c) => { if (ch !== '.') islands.push({ r, c, n: parseInt(ch, 36) }); }));
  const layout = layoutOf(size, islands, max);
  const { found } = solve(layout);
  if (found.length !== 1) throw new Error(`a puzzle needs exactly one solution, this has ${found.length}`);
  return { size, layout, solution: found[0], par: found[0].reduce((n, p) => n + p, 0) };
}

export const picture = (size: number, islands: readonly Island[]): string[] =>
  Array.from({ length: size }, (_, r) => Array.from({ length: size }, (_, c) => { const il = islands.find((i) => i.r === r && i.c === c); return il ? il.n.toString(36) : '.'; }).join(''));

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
  /** Keep only a sea with an island that faces a single neighbour, the easiest place to start. */
  lonely?: boolean;
  /** Keep only a sea where counting stalls and keeping them joined (`closesOff`) gets it going again, with no guessing. */
  joined?: boolean;
  /** Up to three planks a bridge (level 7), and the sea must use a triple somewhere; two otherwise. */
  maxPlanks?: 3;
}

export const PLANS: BridgePlan[] = [
  { name: 'A 7 by 7 sea with a handful of islands', size: 7, islands: { min: 7, max: 9 }, counting: true, puzzles: 1 },
  { name: 'A 9 by 9 sea', size: 9, islands: { min: 11, max: 14 }, counting: true, puzzles: 1 },
  { name: 'A busier 9 by 9 sea, where counting is not always enough', size: 9, islands: { min: 15, max: 18 }, counting: false, puzzles: 1 },
  { name: 'A big 11 by 11 sea', size: 11, islands: { min: 19, max: 24 }, counting: false, puzzles: 1 },
  // Level 5, the entry: played first by the grown-up order.
  { name: 'A small 5 by 5 sea to start', size: 5, islands: { min: 4, max: 6 }, counting: true, puzzles: 1, lonely: true },
  // Level 6, between 2 and 3 by the order.
  { name: 'Keep them joined: a 9 by 9 sea where a bridge must not close a group off', size: 9, islands: { min: 12, max: 15 }, counting: false, puzzles: 1, joined: true },
  // Level 7, after 6 by the order.
  { name: 'Up to three planks: a 9 by 9 sea where a bridge can carry three', size: 9, islands: { min: 12, max: 14 }, counting: true, puzzles: 1, maxPlanks: 3 },
];

/**
 * The levels in play order, easiest first: the small sea (level 5) comes before level 1, Keep them joined (6) after 2, and Up
 * to three planks (7) after 6.
 */
export const LEVEL_ORDER = [5, 1, 2, 6, 7, 3, 4] as const;

/** Grown-ups get every sea; school plays the two small ones, 5 by 5 then 7 by 7, at 100-unit cells. */
export const LEVELS: BandLevels = {
  school: { min: 1, max: 5, order: [5, 1] },
  grownup: { min: 1, max: 7, order: [...LEVEL_ORDER] },
};

export const planFor = (level: number): BridgePlan => PLANS[Math.min(PLANS.length, Math.max(1, level)) - 1];

/**
 * Grow a layout and its planks together: islands are added one at a time, each joined to an island already there by a bridge
 * with room for it, then some extra bridges are added where two islands face each other across clear water. The numbers are
 * the planks each island ended up with. A puzzle is kept only if it has exactly one solution.
 */
export function makePuzzle(plan: BridgePlan, rng: Rng): Puzzle {
  const { size } = plan, max = plan.maxPlanks ?? MAX_PLANKS;
  // How many planks a bridge being grown gets: one or two, or on a three-plank sea one to three.
  const planks = () => (max === 3 ? rng.pick([1, 2, 3]) : rng.chance(0.4) ? 2 : 1);
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
      bridges.push({ a: from, b: islands.length - 1, planks: planks() });
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
      bridges.push({ a: e.a, b: e.b, planks: planks() });
    }
    const counts = islands.map(() => 0);
    for (const b of bridges) { counts[b.a] += b.planks; counts[b.b] += b.planks; }
    if (counts.some((n) => n > 4 * max)) continue;
    // In reading order, so the islands and edges are numbered the same way as when the puzzle is read back from its picture.
    const numbered = islands.map((il, i) => ({ ...il, n: counts[i] })).sort((a, b) => a.r - b.r || a.c - b.c);
    const layout = layoutOf(size, numbered, max);
    if (plan.lonely && !layout.at.some((edges) => edges.length === 1)) continue;
    const { found } = solve(layout);
    if (found.length !== 1 || (plan.counting && !bycounting(layout))) continue;
    // A three-plank sea uses a triple, and every step of it is one an island's count names (no bare pointer to the answer).
    if (plan.maxPlanks && (!found[0].includes(3) || !hintWalk(layout, found[0], false).every((k) => k === 'forced'))) continue;
    if (plan.joined && (bycounting(layout) || !byreasoning(layout) || !joinedByHints(layout, found[0]))) continue;
    return { size, layout, solution: found[0], par: found[0].reduce((n, p) => n + p, 0) };
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
  /** An island whose number and room force a plank onto this edge, and why (see `Forced`). */
  | { kind: 'forced'; edge: number; island: number; why: Forced }
  /**
   * Keep them joined: counting alone forces nothing, but filling `closing` would close `group` off from the rest, so the
   * island's number forces a plank onto `edge` (which may be `closing` itself, carrying one plank but not two).
   */
  | { kind: 'joined'; edge: number; island: number; why: Forced; closing: number; group: number[] }
  /** Nothing is forced by one island alone: an edge that needs a plank in the solution. */
  | { kind: 'next'; edge: number };

/**
 * Why one island forces a plank, read from its number and the room it has, never from the answer:
 * - `full`: it needs all the room it has left (*just enough room*), so every open bridge carries all it can;
 * - `last-way`: only one bridge still has room (*one way left*), so the rest of the number goes there;
 * - `every-way`: it needs all but one of its room (*one short of full*), so every bridge that could take two or more needs one.
 */
export type Forced = 'full' | 'last-way' | 'every-way';

/**
 * What an island still needs, and for each of its edges the planks that edge could still take (0 when crossed or full). With
 * `isolation`, an edge whose filling would close a group off (`closesOff`) can take one fewer, and says which group.
 */
export function roomOf(layout: Layout, planks: Planks, island: number, isolation = false): { left: number; caps: { edge: number; cap: number; group?: number[] }[]; room: number } {
  const caps = layout.at[island].map((k) => {
    if (layout.crossing[k].some((f) => planks[f] > 0)) return { edge: k, cap: 0 };
    const other = otherEnd(layout, k, island);
    const cap = Math.max(0, Math.min(layout.max - planks[k], layout.islands[other].n - planksAt(layout, planks, other)));
    const group = isolation && cap > 0 ? closesOff(layout, planks, k, cap) : null;
    return group ? { edge: k, cap: cap - 1, group } : { edge: k, cap };
  });
  return { left: layout.islands[island].n - planksAt(layout, planks, island), caps, room: caps.reduce((n, c) => n + c.cap, 0) };
}

/**
 * The plank one island forces, by the first reason in `full`, `last-way`, `every-way` that any island shows. Each forced edge
 * must carry at least one more plank in every finished sea (what it could take is at least what the island needs beyond the
 * room of its other edges), so the hint never contradicts the answer.
 */
export function forcedPlank(layout: Layout, planks: Planks, isolation = false): { edge: number; island: number; why: Forced } | null {
  const rooms = layout.islands.map((_, i) => roomOf(layout, planks, i, isolation));
  const reasons: [Forced, (r: (typeof rooms)[number]) => number | undefined][] = [
    ['full', (r) => (r.left === r.room ? r.caps.find((c) => c.cap > 0)?.edge : undefined)],
    ['last-way', (r) => { const open = r.caps.filter((c) => c.cap > 0); return open.length === 1 ? open[0].edge : undefined; }],
    ['every-way', (r) => (r.left === r.room - 1 ? r.caps.find((c) => c.cap >= 2)?.edge : undefined)],
  ];
  for (const [why, pick] of reasons) {
    for (let i = 0; i < rooms.length; i++) {
      if (rooms[i].left <= 0) continue;
      const edge = pick(rooms[i]);
      if (edge !== undefined) return { edge, island: i, why };
    }
  }
  return null;
}

/**
 * Where a hint should point. First a plank that does not belong (more planks on an edge than the solution has); otherwise an
 * edge one island decides by itself (`forcedPlank`, with its reason), and failing that any edge that still needs a plank.
 */
export function hintFor(layout: Layout, planks: Planks, solution: Planks, joined = false): Hint | null {
  const wrong = planks.findIndex((p, k) => p > solution[k]);
  if (wrong >= 0) return { kind: 'fix', edge: wrong };
  const need = solution.findIndex((s, k) => planks[k] < s);
  if (need < 0) return null;
  const forced = forcedPlank(layout, planks);
  if (forced) return { kind: 'forced', ...forced };
  // Keep them joined is level 6's own lesson (and the Joined Seas couch course's, played at 6): the other levels and Island Hopping hint as they always did.
  const iso = joined ? joinedPlank(layout, planks) : null;
  return iso ? { kind: 'joined', ...iso } : { kind: 'next', edge: need };
}

/**
 * Keep them joined: when counting alone forces nothing, the plank one island forces once no bridge may close a group off, with
 * the closing edge at that island and its group. Every closing edge must carry less than it could in the answer (filling it
 * would leave islands outside the group unreachable), so the reduced room is still true and the plank is still in the answer.
 */
export function joinedPlank(layout: Layout, planks: Planks): { edge: number; island: number; why: Forced; closing: number; group: number[] } | null {
  const forced = forcedPlank(layout, planks, true);
  if (!forced) return null;
  const caps = roomOf(layout, planks, forced.island, true).caps;
  // Prefer the forced edge itself when it is the one that would close the group off (one plank, not two).
  const closing = caps.find((c) => c.group && c.edge === forced.edge) ?? caps.find((c) => c.group);
  return closing?.group ? { ...forced, closing: closing.edge, group: closing.group } : null;
}

/**
 * Following the hints from an empty sea: the kinds given, in order, until the sea is finished (or a hint is missing). `joined`
 * as the level gives it: on for level 6's keep-them-joined hints, off for a sea hinted by counting alone.
 */
export function hintWalk(layout: Layout, solution: Planks, joined = true): Hint['kind'][] {
  const planks = solution.map(() => 0), kinds: Hint['kind'][] = [];
  for (let step = 0; step < 200; step++) {
    const h = hintFor(layout, planks, solution, joined);
    if (!h) break;
    kinds.push(h.kind);
    if (h.kind === 'fix') planks[h.edge]--;
    else planks[h.edge]++;
  }
  return kinds;
}

/** Level 6's sea is taught by its hints: at least one keep-them-joined hint, and never one that only points at the answer. */
export function joinedByHints(layout: Layout, solution: Planks): boolean {
  const kinds = hintWalk(layout, solution);
  return kinds.includes('joined') && !kinds.includes('next');
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

/* ------------------------------------------------------------------------------------------------ */
/* Touch                                                                                              */
/* ------------------------------------------------------------------------------------------------ */

/**
 * Touch play: the edge whose stretch of water holds a point. Islands sit at the middle of their cells (`cell` units across, the
 * sea's top left at 0, 0); an edge's stretch is the cells between its islands, one cell wide, so each is at least as wide as
 * `cell`. Two stretches share a cell only where their bridges would cross: the nearer line wins, then the one with planks on it
 * (so a tap there can take one off). A point on an island, or on open sea, is nothing.
 */
export function edgeAt(layout: Layout, cell: number, x: number, y: number, planks?: Planks): number | null {
  let best: number | null = null, bestAcross = Infinity, bestLaid = false;
  layout.edges.forEach((e, k) => {
    const a = layout.islands[e.a], b = layout.islands[e.b], h = e.dir === 'h';
    const lo = (h ? a.c : a.r) * cell + cell, hi = (h ? b.c : b.r) * cell;
    const along = h ? x : y, line = (h ? a.r : a.c) * cell + cell / 2, across = Math.abs((h ? y : x) - line);
    if (along < lo || along >= hi || across >= cell / 2) return;
    const laid = (planks?.[k] ?? 0) > 0;
    if (across < bestAcross - 1e-6 || (Math.abs(across - bestAcross) <= 1e-6 && laid && !bestLaid)) { best = k; bestAcross = across; bestLaid = laid; }
  });
  return best;
}

/** The planks of a finished sea but for the last few: the how-to card's demonstration shows the taps, not every bridge. */
export function headStart(solution: Planks, leave = 6): number[] {
  const planks = [...solution];
  let left = leave;
  for (let k = planks.length - 1; k >= 0 && left > 0; k--) {
    const take = Math.min(planks[k], left);
    planks[k] -= take;
    left -= take;
  }
  return planks;
}

/** A point in the water of an edge that `edgeAt` gives to that edge, for a bot's finger (off the middle of a cell it shares with a crossing bridge). */
export function waterOf(layout: Layout, cell: number, edge: number): { x: number; y: number } {
  const e = layout.edges[edge], a = layout.islands[e.a], b = layout.islands[e.b], h = e.dir === 'h';
  const count = (h ? b.c - a.c : b.r - a.r) - 1;
  const at = (i: number) => ({ x: (h ? a.c + 1 + i : a.c) * cell + cell / 2, y: (h ? a.r : a.r + 1 + i) * cell + cell / 2 });
  const mid = Math.floor((count - 1) / 2);
  const order = Array.from({ length: count }, (_, i) => i).sort((p, q) => Math.abs(p - mid) - Math.abs(q - mid));
  for (const i of order) {
    // The middle of a cell shared with a crossing bridge is a tie; a little along the bridge is nearer to its own line.
    for (const off of [0, 0.3, -0.3]) {
      const c = at(i), p = { x: c.x + (h ? off * cell : 0), y: c.y + (h ? 0 : off * cell) };
      if (edgeAt(layout, cell, p.x, p.y) === edge) return p;
    }
  }
  return at(mid);
}

/** Touch play's buttons beside or under the sea. */
export type SlotKind = 'take' | 'hint' | 'again';
export interface Slot { kind: SlotKind; x: number; y: number; w: number; h: number }
export interface TouchLayout {
  cell: number;
  /** The sea's top-left corner, in stage units. */
  x: number;
  y: number;
  beside: boolean;
  slots: Slot[];
  /** Where the plank count sits, and how it is anchored. */
  tally: { x: number; y: number; ax: number; ay: number };
}

/**
 * Touch layout for a sea of `size` by `size` in a `w` by `h` view. Beside the sea when it fits (the buttons in a column), else
 * under it. Grown-ups get cells of 64 to 80 and buttons 76 high; at school every cell and button is at least 100 across.
 */
export function touchLayout(size: number, w: number, h: number, school: boolean): TouchLayout {
  const min = school ? 100 : 64, cap = school ? 100 : 80, bh = school ? 100 : 76, under = school ? 100 : 72;
  const left = 152, panel = 108, gap = 14, top = 28;
  const side = Math.min(cap, Math.floor((h - 2 * top) / size), Math.floor((w - left - gap - panel - 8) / size));
  // A tall view: the sea centred under the home button, the buttons in a row beneath it.
  const stack = Math.min(cap, Math.floor((w - 2 * 48) / size), Math.floor((h - 140 - 24 - 20 - under - 24) / size));
  const kinds = ['take', 'hint', 'again'] as const;
  if (side >= min && side + 8 > stack) {
    const sea = size * side, x = Math.max(left, (w - (sea + gap + panel)) / 2), y = Math.max(top, Math.floor((h - sea) / 2));
    const bx = x + sea + gap + 8;
    return {
      cell: side, x, y, beside: true,
      slots: kinds.map((kind, k) => ({ kind, x: bx, y: y + 8 + k * (bh + 12), w: panel, h: bh })),
      tally: { x: bx + panel / 2, y: y + 8 + 3 * (bh + 12) + 8, ax: 0.5, ay: 0 },
    };
  }
  // On an upright phone (chunk 31) a sea wider than the gap beside Home and "?" starts below them; the wide area is unchanged.
  const cell = Math.max(min, stack), sea = size * cell, x = (w - sea) / 2, y = w < 1000 && x < 120 ? 220 : 140;
  const by = y + sea + 16 + 20, bw = Math.min(200, Math.floor((sea - 24) / 3));
  return {
    cell, x, y, beside: false,
    slots: kinds.map((kind, k) => ({ kind, x: x + sea / 2 - (3 * bw + 24) / 2 + k * (bw + 12), y: by, w: bw, h: under })),
    tally: { x: w / 2, y: by + under + 36, ax: 0.5, ay: 0.5 },
  };
}
