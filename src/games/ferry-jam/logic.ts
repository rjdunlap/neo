import type { Rng } from '../../engine/random';

/**
 * Ferry Jam: boats sit in a square harbor, each able to slide only along its own lane (a row for a boat lying
 * sideways, a column for one standing up). The ferry is the boat in `ferry`'s row; it has to reach the dock
 * on the right-hand edge. A harbor is a picture in letters, one letter per boat and `f` for the ferry:
 *
 *   ..aab.
 *   ..c.b.
 *   ffc.b.
 */
export interface Boat {
  /** Row and column of the boat's top-left cell. */
  row: number;
  col: number;
  len: 2 | 3;
  /** `h` slides left and right, `v` up and down. */
  dir: 'h' | 'v';
}

export interface Harbor {
  size: number;
  /** The ferry is always `boats[0]`: a sideways boat of length 2. */
  boats: Boat[];
}

/** Where every boat is along its own lane: the column of a sideways boat, the row of an upright one. */
export type Layout = number[];

export interface Slide {
  boat: number;
  /** The new position along the boat's lane. */
  to: number;
}

export const FERRY = 0;

export function parse(rows: readonly string[]): Harbor {
  const size = rows.length;
  const cells = new Map<string, { r: number; c: number }[]>();
  rows.forEach((line, r) => {
    if (line.length !== size) throw new Error(`harbor row ${r} is not ${size} wide`);
    [...line].forEach((ch, c) => { if (ch !== '.') cells.set(ch, [...(cells.get(ch) ?? []), { r, c }]); });
  });
  const ferry = cells.get('f');
  if (!ferry) throw new Error('a harbor needs a ferry (f)');
  const make = (cs: { r: number; c: number }[]): Boat => {
    const dir = cs.every((p) => p.r === cs[0].r) ? 'h' : 'v';
    if (dir === 'v' && !cs.every((p) => p.c === cs[0].c)) throw new Error('a boat is not in a line');
    if (cs.length !== 2 && cs.length !== 3) throw new Error(`a boat is ${cs.length} cells long`);
    return { row: Math.min(...cs.map((p) => p.r)), col: Math.min(...cs.map((p) => p.c)), len: cs.length as 2 | 3, dir };
  };
  const others = [...cells.entries()].filter(([ch]) => ch !== 'f').sort(([a], [b]) => (a < b ? -1 : 1)).map(([, cs]) => make(cs));
  const first = make(ferry);
  if (first.dir !== 'h' || first.len !== 2) throw new Error('the ferry is a sideways boat of length 2');
  return { size, boats: [first, ...others] };
}

/** One letter per boat besides the ferry, which is `f`. */
const LETTERS = 'abcdeghijklmnopqrstuvwxyz';

export function render(h: Harbor, layout: Layout = start(h)): string[] {
  const g = grid(h, layout).map((row) => row.map((i) => (i < 0 ? '.' : i === FERRY ? 'f' : LETTERS[i - 1])));
  return g.map((row) => row.join(''));
}

export const start = (h: Harbor): Layout => h.boats.map((b) => (b.dir === 'h' ? b.col : b.row));

/** Which boat fills each cell (-1 for open water). */
export function grid(h: Harbor, layout: Layout): number[][] {
  const g = Array.from({ length: h.size }, () => Array<number>(h.size).fill(-1));
  h.boats.forEach((b, i) => {
    for (let k = 0; k < b.len; k++) {
      const r = b.dir === 'h' ? b.row : layout[i] + k;
      const c = b.dir === 'h' ? layout[i] + k : b.col;
      g[r][c] = g[r][c] === -1 ? i : -2;
    }
  });
  return g;
}

/** The ferry has reached the dock: its bow is on the right-hand edge. */
export const atDock = (h: Harbor, layout: Layout) => layout[FERRY] + h.boats[FERRY].len === h.size;

/** The cells a boat can slide to along its lane from where it is now: every free position, not just the next. */
export function reach(h: Harbor, layout: Layout, boat: number): { min: number; max: number } {
  const b = h.boats[boat];
  const g = grid(h, layout);
  const at = layout[boat];
  const cell = (p: number) => (b.dir === 'h' ? g[b.row][p] : g[p][b.col]);
  let min = at;
  while (min > 0 && cell(min - 1) === -1) min--;
  let max = at;
  while (max + b.len < h.size && cell(max + b.len) === -1) max++;
  return { min, max };
}

/** Every slide that can be made now. Sliding a boat any distance along its lane is one slide. */
export function slides(h: Harbor, layout: Layout): Slide[] {
  const out: Slide[] = [];
  h.boats.forEach((_, boat) => {
    const { min, max } = reach(h, layout, boat);
    for (let to = min; to <= max; to++) if (to !== layout[boat]) out.push({ boat, to });
  });
  return out;
}

const encode = (layout: Layout) => layout.reduce((n, p) => n * 8 + p, 0);

/**
 * The fewest slides that bring the ferry to the dock, found by breadth-first search, with one way to do it.
 * `cap` stops the search from looking deeper than that many slides (null then means "not within the cap").
 */
export function solve(h: Harbor, from: Layout = start(h), cap = Infinity): Slide[] | null {
  if (atDock(h, from)) return [];
  const seen = new Map<number, { prev: number; slide: Slide } | null>([[encode(from), null]]);
  const states = new Map<number, Layout>([[encode(from), from]]);
  let frontier: Layout[] = [from];
  for (let depth = 1; frontier.length && depth <= cap; depth++) {
    const next: Layout[] = [];
    for (const layout of frontier) {
      const key = encode(layout);
      for (const s of slides(h, layout)) {
        const moved = layout.slice();
        moved[s.boat] = s.to;
        const k = encode(moved);
        if (seen.has(k)) continue;
        seen.set(k, { prev: key, slide: s });
        states.set(k, moved);
        if (atDock(h, moved)) {
          const path: Slide[] = [];
          for (let at: number | undefined = k; at !== undefined; ) {
            const step = seen.get(at);
            if (!step) break;
            path.unshift(step.slide);
            at = step.prev;
          }
          return path;
        }
        next.push(moved);
      }
    }
    frontier = next;
  }
  return null;
}

export interface FerryPlan {
  name: string;
  size: number;
  /** Boats besides the ferry. */
  boats: { min: number; max: number };
  /** The fewest slides that finish the harbor. */
  moves: { min: number; max: number };
  /** Harbors in one round. */
  harbors: number;
}

export const PLANS: FerryPlan[] = [
  { name: 'A 4 by 4 harbor: move a boat or two out of the ferry\'s way', size: 4, boats: { min: 2, max: 3 }, moves: { min: 2, max: 3 }, harbors: 2 },
  { name: 'A 4 by 4 harbor that takes a few more slides', size: 4, boats: { min: 3, max: 4 }, moves: { min: 4, max: 6 }, harbors: 2 },
  { name: 'A 5 by 5 harbor with more boats', size: 5, boats: { min: 4, max: 6 }, moves: { min: 5, max: 7 }, harbors: 1 },
  { name: 'A busier 5 by 5 harbor: plan the slides in order', size: 5, boats: { min: 5, max: 7 }, moves: { min: 8, max: 11 }, harbors: 1 },
  { name: 'A 6 by 6 harbor', size: 6, boats: { min: 6, max: 8 }, moves: { min: 8, max: 12 }, harbors: 1 },
  { name: 'A crowded 6 by 6 harbor: a long way to the dock', size: 6, boats: { min: 7, max: 10 }, moves: { min: 13, max: 18 }, harbors: 1 },
];

export const planFor = (level: number): FerryPlan => PLANS[Math.min(PLANS.length, Math.max(1, level)) - 1];

function place(h: Harbor, boat: Boat, ignore = -1): boolean {
  const layout = start(h);
  const g = grid({ ...h, boats: h.boats.filter((_, i) => i !== ignore) }, layout.filter((_, i) => i !== ignore));
  for (let k = 0; k < boat.len; k++) {
    const r = boat.dir === 'h' ? boat.row : boat.row + k;
    const c = boat.dir === 'h' ? boat.col + k : boat.col;
    if (r >= h.size || c >= h.size || g[r][c] !== -1) return false;
  }
  return true;
}

function randomBoat(size: number, rng: Rng): Boat {
  const dir = rng.chance(0.5) ? 'h' : 'v';
  const len = (rng.chance(size <= 4 ? 0.2 : 0.35) ? 3 : 2) as 2 | 3;
  return { dir, len, row: rng.int(0, dir === 'v' ? size - len : size - 1), col: rng.int(0, dir === 'h' ? size - len : size - 1) };
}

/**
 * A harbor whose shortest way out is within the plan's range. It starts from a random crowd of boats and nudges
 * one boat at a time, keeping a change when the shortest way out gets closer to the range. Solving is a search of
 * a few hundred thousand layouts at most, so the game picks from the frozen `HARBORS` list instead of running this.
 */
export function makeHarbor(plan: FerryPlan, rng: Rng): Harbor | null {
  const { size } = plan;
  const exit = size === 4 ? rng.int(1, 2) : rng.int(1, size - 2);
  const count = rng.int(plan.boats.min, plan.boats.max);
  const cap = plan.moves.max + 3;
  const target = (plan.moves.min + plan.moves.max) / 2;
  const off = (moves: number | null) => (moves === null ? Infinity : Math.max(0, plan.moves.min - moves, moves - plan.moves.max) + Math.abs(moves - target) / 100);

  let harbor: Harbor = { size, boats: [{ row: exit, col: rng.int(0, 1), len: 2, dir: 'h' }] };
  for (let tries = 0; tries < 200 && harbor.boats.length < count + 1; tries++) {
    const boat = randomBoat(size, rng);
    if (place(harbor, boat)) harbor = { size, boats: [...harbor.boats, boat] };
  }
  if (harbor.boats.length < count + 1) return null;
  const length = (h: Harbor) => solve(h, start(h), cap)?.length ?? null;
  let current = off(length(harbor));
  for (let step = 0; step < 150; step++) {
    if (current < 1) {
      const moves = length(harbor)!;
      if (moves >= plan.moves.min && moves <= plan.moves.max) return harbor;
    }
    const which = rng.int(1, harbor.boats.length - 1);
    const boat = randomBoat(size, rng);
    if (!place(harbor, boat, which)) continue;
    const next: Harbor = { size, boats: harbor.boats.map((b, i) => (i === which ? boat : b)) };
    // A boat that would need to start in the dock's row beyond the ferry is fine; one sitting on the ferry is not (place() ruled that out).
    const score = off(length(next));
    if (score <= current) {
      harbor = next;
      current = score;
    }
  }
  const moves = length(harbor);
  return moves !== null && moves >= plan.moves.min && moves <= plan.moves.max ? harbor : null;
}

/** Whether a drawn harbor is well formed: boats inside the water, none overlapping, the ferry on its own row. */
export function wellFormed(h: Harbor): boolean {
  const layout = start(h);
  if (h.boats.some((b) => (b.dir === 'h' ? b.col + b.len > h.size || b.row >= h.size : b.row + b.len > h.size || b.col >= h.size))) return false;
  return !grid(h, layout).some((row) => row.some((v) => v === -2));
}

/** What the next slide ought to be, from wherever the boats are now. */
export function hintSlide(h: Harbor, layout: Layout): Slide | null {
  return solve(h, layout)?.[0] ?? null;
}

/** Where a boat's middle is, in cells from the harbor's top-left corner, with its lane position at `p`. */
function middle(h: Harbor, i: number, p: number): { x: number; y: number } {
  const b = h.boats[i];
  return b.dir === 'h' ? { x: p + b.len / 2, y: b.row + 0.5 } : { x: b.col + 0.5, y: p + b.len / 2 };
}

/**
 * Couch play: the boat the highlight moves to when the stick is pushed in a direction (0 right, 1 down, 2 left, 3 up). It is
 * the nearest boat in the cone that way (no more than a quarter turn off straight), and when the cone is empty the nearest boat
 * anywhere on that side, so the highlight can always get to every boat. Null when no boat lies that way at all.
 */
export function boatToward(h: Harbor, layout: Layout, from: number, dir: number): number | null {
  const at = middle(h, from, layout[from]);
  let cone: number | null = null, coneScore = Infinity, side: number | null = null, sideScore = Infinity;
  h.boats.forEach((_, j) => {
    if (j === from) return;
    const c = middle(h, j, layout[j]);
    const along = [c.x - at.x, c.y - at.y, at.x - c.x, at.y - c.y][dir];
    const across = Math.abs(dir % 2 === 0 ? c.y - at.y : c.x - at.x);
    if (along < 0.25) return;
    const score = along + 2 * across;
    if (across <= along && score < coneScore) { coneScore = score; cone = j; }
    if (score < sideScore) { sideScore = score; side = j; }
  });
  return cone ?? side;
}

/** The pushes of the stick that take the highlight from one boat to another, or null if it cannot get there. */
export function focusPath(h: Harbor, layout: Layout, from: number, to: number): number[] | null {
  const seen = new Map<number, number[]>([[from, []]]);
  const queue = [from];
  for (let head = 0; head < queue.length; head++) {
    const at = queue[head];
    if (at === to) return seen.get(at)!;
    for (const dir of [0, 1, 2, 3]) {
      const next = boatToward(h, layout, at, dir);
      if (next === null || seen.has(next)) continue;
      seen.set(next, [...seen.get(at)!, dir]);
      queue.push(next);
    }
  }
  return null;
}
