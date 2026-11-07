import type { Rng } from '../../engine/random';
import type { BandLevels } from '../../progress/difficulty';

/**
 * Ferry Jam: boats sit in a square harbor, each able to slide only along its own lane (a row for a boat lying
 * sideways, a column for one standing up). The ferry is the boat in `ferry`'s row; it has to reach the dock
 * on the right-hand edge. A harbor is a picture in letters, one letter per boat and `f` for the ferry:
 *
 *   ..aab.
 *   ..c.b.
 *   ffc.b.
 *
 * An `x` is a rock (level 7): it fills its cell and never moves, so boats have to wait somewhere else.
 * A `y` is a second, yellow ferry (level 8): it stands upright and leaves by a dock at the bottom of its column.
 * In a harbor with two ferries, a ferry that reaches its dock sails away at once and its cells are open water.
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
  /** Rocks, one cell each. They are not boats: they never slide and never appear in a layout. */
  rocks?: { row: number; col: number }[];
  /** A second ferry (level 8): `boats[1]` is the yellow one, upright and two long, with its dock below its column. */
  yellow?: true;
}

/** Where every boat is along its own lane: the column of a sideways boat, the row of an upright one. */
export type Layout = number[];

export interface Slide {
  boat: number;
  /** The new position along the boat's lane. */
  to: number;
}

export const FERRY = 0;
/** The yellow ferry's place in `boats` when the harbor has one. */
export const YELLOW = 1;
/** What `grid` holds in a rock's cell. */
export const ROCK = -3;

export function parse(rows: readonly string[]): Harbor {
  const size = rows.length;
  const cells = new Map<string, { r: number; c: number }[]>();
  rows.forEach((line, r) => {
    if (line.length !== size) throw new Error(`harbor row ${r} is not ${size} wide`);
    [...line].forEach((ch, c) => { if (ch !== '.') cells.set(ch, [...(cells.get(ch) ?? []), { r, c }]); });
  });
  const rocks = (cells.get('x') ?? []).map(({ r, c }) => ({ row: r, col: c }));
  cells.delete('x');
  const ferry = cells.get('f');
  if (!ferry) throw new Error('a harbor needs a ferry (f)');
  const yellow = cells.get('y');
  cells.delete('y');
  const make = (cs: { r: number; c: number }[]): Boat => {
    const dir = cs.every((p) => p.r === cs[0].r) ? 'h' : 'v';
    if (dir === 'v' && !cs.every((p) => p.c === cs[0].c)) throw new Error('a boat is not in a line');
    if (cs.length !== 2 && cs.length !== 3) throw new Error(`a boat is ${cs.length} cells long`);
    return { row: Math.min(...cs.map((p) => p.r)), col: Math.min(...cs.map((p) => p.c)), len: cs.length as 2 | 3, dir };
  };
  const others = [...cells.entries()].filter(([ch]) => ch !== 'f').sort(([a], [b]) => (a < b ? -1 : 1)).map(([, cs]) => make(cs));
  const first = make(ferry);
  if (first.dir !== 'h' || first.len !== 2) throw new Error('the ferry is a sideways boat of length 2');
  const second = yellow && make(yellow);
  if (second && (second.dir !== 'v' || second.len !== 2)) throw new Error('the yellow ferry is an upright boat of length 2');
  const h: Harbor = { size, boats: second ? [first, second, ...others] : [first, ...others] };
  if (rocks.length) h.rocks = rocks;
  if (second) h.yellow = true;
  return h;
}

/** One letter per boat besides the ferries, which are `f` and `y`; `x` is kept for rocks. */
const LETTERS = 'abcdeghijklmnopqrstuvwz';

export function render(h: Harbor, layout: Layout = start(h)): string[] {
  const first = h.yellow ? 2 : 1;
  const g = grid(h, layout).map((row) => row.map((i) => (i === ROCK ? 'x' : i < 0 ? '.' : i === FERRY ? 'f' : h.yellow && i === YELLOW ? 'y' : LETTERS[i - first])));
  return g.map((row) => row.join(''));
}

export const start = (h: Harbor): Layout => h.boats.map((b) => (b.dir === 'h' ? b.col : b.row));

/** Which boat fills each cell (-1 for open water, `ROCK` for a rock, -2 where two things overlap). */
export function grid(h: Harbor, layout: Layout): number[][] {
  const g = Array.from({ length: h.size }, () => Array<number>(h.size).fill(-1));
  for (const { row, col } of h.rocks ?? []) g[row][col] = ROCK;
  h.boats.forEach((b, i) => {
    if (layout[i] >= h.size) return;
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

/** The ferries in a harbor: the red one, and the yellow one when there is one. */
export const ferries = (h: Harbor): number[] => (h.yellow ? [FERRY, YELLOW] : [FERRY]);

/** A ferry that has sailed out of a two-ferry harbor sits at `size`, past its dock, and fills no cell. */
export const sailed = (h: Harbor, layout: Layout, i: number) => layout[i] >= h.size;

/** Which ferry has just reached its dock and has not sailed yet, or null. */
export function docked(h: Harbor, layout: Layout): number | null {
  return ferries(h).find((i) => layout[i] + h.boats[i].len === h.size) ?? null;
}

/**
 * After a slide: in a two-ferry harbor a ferry at its dock sails away at once (its place becomes `size`), so the other ferry
 * can pass where it was. A one-ferry harbor is left as it is. The solver, the distance table and the game all settle a
 * layout this way, so they always agree on where the boats are.
 */
export function settle(h: Harbor, layout: Layout): Layout {
  if (!h.yellow) return layout;
  const i = docked(h, layout);
  if (i === null) return layout;
  const out = layout.slice();
  out[i] = h.size;
  return out;
}

/** The harbor is finished: its ferry is at the dock, or with two ferries, both have sailed. */
export const solved = (h: Harbor, layout: Layout) => (h.yellow ? sailed(h, layout, FERRY) && sailed(h, layout, YELLOW) : atDock(h, layout));

/** The cells a boat can slide to along its lane from where it is now: every free position, not just the next. */
export function reach(h: Harbor, layout: Layout, boat: number, g = grid(h, layout)): { min: number; max: number } {
  const b = h.boats[boat];
  const at = layout[boat];
  if (at >= h.size) return { min: at, max: at };
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
  const g = grid(h, layout);
  h.boats.forEach((_, boat) => {
    const { min, max } = reach(h, layout, boat, g);
    for (let to = min; to <= max; to++) if (to !== layout[boat]) out.push({ boat, to });
  });
  return out;
}

const encode = (layout: Layout) => layout.reduce((n, p) => n * 8 + p, 0);

/** Where the boats are after a slide, settled (a ferry that reached its dock in a two-ferry harbor has sailed). */
export function after(h: Harbor, layout: Layout, s: Slide): Layout {
  const moved = layout.slice();
  moved[s.boat] = s.to;
  return settle(h, moved);
}

/**
 * The fewest slides that bring the ferry to the dock, found by breadth-first search, with one way to do it.
 * `cap` stops the search from looking deeper than that many slides (null then means "not within the cap").
 */
export function solve(h: Harbor, from: Layout = start(h), cap = Infinity): Slide[] | null {
  if (solved(h, from)) return [];
  const seen = new Map<number, { prev: number; slide: Slide } | null>([[encode(from), null]]);
  const states = new Map<number, Layout>([[encode(from), from]]);
  let frontier: Layout[] = [from];
  for (let depth = 1; frontier.length && depth <= cap; depth++) {
    const next: Layout[] = [];
    for (const layout of frontier) {
      const key = encode(layout);
      for (const s of slides(h, layout)) {
        const moved = after(h, layout, s);
        const k = encode(moved);
        if (seen.has(k)) continue;
        seen.set(k, { prev: key, slide: s });
        states.set(k, moved);
        if (solved(h, moved)) {
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
  /** Rocks in each harbor, beside the ferry's row (level 7). */
  rocks?: number;
  /** Two ferries (level 8): a yellow one stands upright too, with its own dock at the bottom. */
  ferries?: 2;
  /** An easy entry above the ladder (levels 9 and 10): exactly one boat sits in the ferry's way. */
  entry?: true;
  /** Who's in the way (level 10): before any slide she taps the boat in the ferry's way. */
  ask?: true;
}

export const PLANS: FerryPlan[] = [
  { name: 'A 4 by 4 harbor: move a boat or two out of the ferry\'s way', size: 4, boats: { min: 2, max: 3 }, moves: { min: 2, max: 3 }, harbors: 2 },
  { name: 'A 4 by 4 harbor that takes a few more slides', size: 4, boats: { min: 3, max: 4 }, moves: { min: 4, max: 6 }, harbors: 2 },
  { name: 'A 5 by 5 harbor with more boats', size: 5, boats: { min: 4, max: 6 }, moves: { min: 5, max: 7 }, harbors: 1 },
  { name: 'A busier 5 by 5 harbor: plan the slides in order', size: 5, boats: { min: 5, max: 7 }, moves: { min: 8, max: 11 }, harbors: 1 },
  { name: 'A 6 by 6 harbor', size: 6, boats: { min: 6, max: 8 }, moves: { min: 8, max: 12 }, harbors: 1 },
  { name: 'A crowded 6 by 6 harbor: a long way to the dock', size: 6, boats: { min: 7, max: 10 }, moves: { min: 13, max: 18 }, harbors: 1 },
  { name: 'Rocks in the harbor: a 5 by 5 with a rock that never moves, so a boat has to wait somewhere else', size: 5, boats: { min: 4, max: 5 }, moves: { min: 6, max: 9 }, harbors: 1, rocks: 1 },
  { name: 'Two ferries: a 5 by 5 where a yellow ferry leaves by a bottom dock, so one ferry has to go first to free the other', size: 5, boats: { min: 3, max: 5 }, moves: { min: 5, max: 8 }, harbors: 1, ferries: 2 },
  // Slides here count the ferry's own last slide to the dock, as `solve` does: "one boat slide" is 2, "two or three" is 3–4.
  { name: 'One boat in the way: a 4 by 4 harbor where one slide of one boat lets the ferry out', size: 4, boats: { min: 2, max: 2 }, moves: { min: 2, max: 2 }, harbors: 2, entry: true },
  { name: 'Who\'s in the way? Tap the boat in front of the ferry, then slide it and the boat that stops it', size: 4, boats: { min: 2, max: 3 }, moves: { min: 3, max: 4 }, harbors: 2, entry: true, ask: true },
];

export const LEVELS: BandLevels = {
  // 9 (one boat in the way) and 10 (who's in the way?) are easy entries above the ladder, played first.
  prek: { min: 1, max: 10, order: [9, 1, 10, 2, 3, 4] },
  school: { min: 3, max: 8 },
};

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
  if (plan.ferries === 2) {
    // The two ferries start in each other's way: the yellow one across the red one's row ahead of it, or the red one under the yellow one.
    const red = harbor.boats[FERRY];
    const across = exit < 2 || rng.chance(0.6);
    const yellow: Boat = across
      ? { dir: 'v', len: 2, col: rng.int(red.col + 2, size - 1), row: Math.min(size - 3, exit - rng.int(0, 1)) }
      : { dir: 'v', len: 2, col: rng.int(red.col, red.col + 1), row: rng.int(0, exit - 2) };
    harbor = { ...harbor, boats: [red, yellow], yellow: true };
  }
  const fixed = harbor.boats.length;
  if (plan.rocks) {
    // Rocks sit in a row beside the ferry's, never in it (one there would be a wall the ferry could never pass).
    const rocks: { row: number; col: number }[] = [];
    for (let tries = 0; tries < 40 && rocks.length < plan.rocks; tries++) {
      const rock = { row: exit + (rng.chance(0.5) ? 1 : -1), col: rng.int(1, size - 1) };
      if (!rocks.some((r) => r.row === rock.row && r.col === rock.col)) rocks.push(rock);
    }
    harbor = { ...harbor, rocks };
  }
  for (let tries = 0; tries < 200 && harbor.boats.length < count + fixed; tries++) {
    const boat = randomBoat(size, rng);
    if (place(harbor, boat)) harbor = { ...harbor, boats: [...harbor.boats, boat] };
  }
  if (harbor.boats.length < count + fixed) return null;
  const length = (h: Harbor) => solve(h, start(h), cap)?.length ?? null;
  let current = off(length(harbor));
  for (let step = 0; step < 150; step++) {
    if (current < 1) {
      const moves = length(harbor)!;
      if (moves >= plan.moves.min && moves <= plan.moves.max && rocksMatter(harbor) && freesFirst(harbor)) return harbor;
    }
    const which = rng.int(fixed, harbor.boats.length - 1);
    const boat = randomBoat(size, rng);
    if (!place(harbor, boat, which)) continue;
    const next: Harbor = { ...harbor, boats: harbor.boats.map((b, i) => (i === which ? boat : b)) };
    // A boat that would need to start in the dock's row beyond the ferry is fine; one sitting on the ferry is not (place() ruled that out).
    const score = off(length(next));
    if (score <= current) {
      harbor = next;
      current = score;
    }
  }
  const moves = length(harbor);
  return moves !== null && moves >= plan.moves.min && moves <= plan.moves.max && rocksMatter(harbor) && freesFirst(harbor) ? harbor : null;
}

/**
 * Whether every rock changes the harbor: taking any one of them away lets the ferry out in fewer slides. A rock that
 * changes nothing is only scenery, and level 7 is about where a boat can wait when a rock takes its space.
 */
export function rocksMatter(h: Harbor): boolean {
  const rocks = h.rocks ?? [];
  if (!rocks.length) return true;
  const fewest = solve(h)?.length ?? Infinity;
  return rocks.every((_, k) => (solve({ ...h, rocks: rocks.filter((__, j) => j !== k) })?.length ?? Infinity) !== fewest);
}

/** The cells between a ferry and its dock, along its lane, not counting the cells it fills. */
export function aheadOf(h: Harbor, layout: Layout, i: number): { row: number; col: number }[] {
  const b = h.boats[i];
  const out: { row: number; col: number }[] = [];
  for (let p = layout[i] + b.len; p < h.size; p++) out.push(b.dir === 'h' ? { row: b.row, col: p } : { row: p, col: b.col });
  return out;
}

/** The boats in the red ferry's way: every boat with a cell in its row between it and the dock. */
export function blockers(h: Harbor, layout: Layout = start(h)): number[] {
  const g = grid(h, layout);
  const out = new Set<number>();
  for (const { row, col } of aheadOf(h, layout, FERRY)) if (g[row][col] > FERRY) out.add(g[row][col]);
  return [...out].sort((a, b) => a - b);
}

/** Whether boat `i` can leave the ferry's way in one slide from where the boats are now. */
export function clearsInOne(h: Harbor, i: number, layout: Layout = start(h)): boolean {
  const { min, max } = reach(h, layout, i);
  for (let p = min; p <= max; p++) {
    const moved = layout.slice();
    moved[i] = p;
    if (!blockers(h, moved).includes(i)) return true;
  }
  return false;
}

/** Whether ferry `i` fills a cell in the lane ahead of ferry `j`. */
function inTheWay(h: Harbor, layout: Layout, i: number, j: number): boolean {
  const g = grid(h, layout);
  return aheadOf(h, layout, j).some(({ row, col }) => g[row][col] === i);
}

/**
 * Which ferry sails first on the fewest way out, and whether it sat in the other ferry's way until it sailed: the
 * level-8 lesson, "this ferry has to go first to free that one". Null for a harbor with one ferry or no way out.
 */
export function firstToSail(h: Harbor): { ferry: number; frees: boolean } | null {
  if (!h.yellow) return null;
  const path = solve(h);
  if (!path) return null;
  let layout = start(h);
  for (const s of path) {
    const moved = after(h, layout, s);
    const gone = ferries(h).find((i) => !sailed(h, layout, i) && sailed(h, moved, i));
    if (gone !== undefined) return { ferry: gone, frees: inTheWay(h, layout, gone, gone === FERRY ? YELLOW : FERRY) };
    layout = moved;
  }
  return null;
}

/** A one-ferry harbor always passes; a two-ferry harbor passes when its first ferry to sail frees the other. */
export const freesFirst = (h: Harbor) => !h.yellow || firstToSail(h)?.frees === true;

/** Whether a drawn harbor is well formed: boats inside the water, none overlapping, the ferry on its own row. */
export function wellFormed(h: Harbor): boolean {
  const layout = start(h);
  if (h.boats.some((b) => (b.dir === 'h' ? b.col + b.len > h.size || b.row >= h.size : b.row + b.len > h.size || b.col >= h.size))) return false;
  if ((h.rocks ?? []).some((r) => r.row < 0 || r.col < 0 || r.row >= h.size || r.col >= h.size)) return false;
  return !grid(h, layout).some((row) => row.some((v) => v === -2));
}

const tables = new WeakMap<Harbor, Map<number, number>>();

/**
 * The fewest slides to the dock from every layout the boats can reach from where they began. A slide can always be slid
 * back, so this finds every reachable layout, then searches outward from the docked ones. Built once per harbor (a few
 * tens of thousands of layouts at most), so asking how far she is after each slide costs nothing.
 */
export function distanceTable(h: Harbor): Map<number, number> {
  const cached = tables.get(h);
  if (cached) return cached;
  if (h.yellow) {
    const table = sailingTable(h);
    tables.set(h, table);
    return table;
  }
  const layouts = new Map<number, Layout>([[encode(start(h)), start(h)]]);
  const docked: number[] = [];
  const queue = [start(h)];
  for (let i = 0; i < queue.length; i++) {
    const layout = queue[i];
    if (atDock(h, layout)) docked.push(encode(layout));
    for (const s of slides(h, layout)) {
      const moved = layout.slice();
      moved[s.boat] = s.to;
      const k = encode(moved);
      if (layouts.has(k)) continue;
      layouts.set(k, moved);
      queue.push(moved);
    }
  }
  const table = new Map<number, number>(docked.map((k) => [k, 0]));
  let frontier = docked;
  for (let d = 1; frontier.length; d++) {
    const next: number[] = [];
    for (const k of frontier) {
      const layout = layouts.get(k)!;
      for (const s of slides(h, layout)) {
        const moved = layout.slice();
        moved[s.boat] = s.to;
        const m = encode(moved);
        if (table.has(m)) continue;
        table.set(m, d);
        next.push(m);
      }
    }
    frontier = next;
  }
  tables.set(h, table);
  return table;
}

/**
 * The distance table for a two-ferry harbor. A ferry that has sailed never comes back, so a slide cannot always be slid back:
 * this keeps every slide's way back (who leads to each layout) and searches those backwards from the finished layouts.
 */
function sailingTable(h: Harbor): Map<number, number> {
  const from = start(h);
  const seen = new Set<number>([encode(from)]);
  const into = new Map<number, number[]>();
  const finished: number[] = [];
  const queue = [from];
  for (let i = 0; i < queue.length; i++) {
    const layout = queue[i];
    const key = encode(layout);
    if (solved(h, layout)) finished.push(key);
    for (const s of slides(h, layout)) {
      const moved = after(h, layout, s);
      const k = encode(moved);
      const list = into.get(k);
      if (list) list.push(key);
      else into.set(k, [key]);
      if (seen.has(k)) continue;
      seen.add(k);
      queue.push(moved);
    }
  }
  const table = new Map<number, number>(finished.map((k) => [k, 0]));
  let frontier = finished;
  for (let d = 1; frontier.length; d++) {
    const next: number[] = [];
    for (const k of frontier)
      for (const m of into.get(k) ?? []) {
        if (table.has(m)) continue;
        table.set(m, d);
        next.push(m);
      }
    frontier = next;
  }
  return table;
}

/** The fewest slides from these boats to the dock (every layout reachable from the start has a way out). */
export const distance = (h: Harbor, layout: Layout): number => distanceTable(h).get(encode(layout)) ?? Infinity;

/** Slides in a row without getting any closer to the dock before the glow helps: never fewer than six, and never fewer than the harbor's own fewest. */
export const patience = (fewest: number) => Math.max(6, fewest);

/**
 * Whether she is stuck: `trail` is how far the ferry was from the dock (in fewest slides) when the count began, then
 * after each slide since. A slide that brings it closer than ever before restarts the count; `patience(fewest)` slides
 * in a row that do not are stuck. A steady longer route keeps getting closer, so it never is; going round in a loop does.
 * Undo is not a slide, so it takes the slide it undoes back off the trail. After a hint the game starts a fresh trail from where the boats are.
 */
export function stuck(trail: readonly number[], fewest: number): boolean {
  if (!trail.length) return false;
  let best = trail[0];
  let since = 0;
  for (const d of trail.slice(1)) {
    if (d < best) {
      best = d;
      since = 0;
    } else since++;
  }
  return since >= patience(fewest);
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
    if (j === from || layout[j] >= h.size) return;
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
