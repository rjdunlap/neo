import type { Rng } from '../../engine/random';

/**
 * Pond Conga: a line of ducklings paddles on at a steady pace, and the leader is steered to each crumb of bread in
 * turn. Bumping a lily pad, the bank or the line itself is a bonk: nothing is lost, the whole conga turns about and
 * waddles off the other way, and the bonk counts as one more step. Because it turns about, the line can never box
 * itself in: there is always another way to go.
 *
 * Every step the leader takes counts, and so does every bonk. The fewest for a pond is exact: no route can be shorter
 * than the lily-pad-aware distances between the crumbs added up, and a pond is kept only if a route that gets there
 * without a single bonk really exists (`solveRoute`, which plays the line's own body, tail and all).
 */
export type Dir = 0 | 1 | 2 | 3;
/** 0 right, 1 down, 2 left, 3 up. */
export const DX = [1, 0, -1, 0];
export const DY = [0, 1, 0, -1];
export const opposite = (d: Dir): Dir => ((d + 2) % 4) as Dir;

export interface Cell { x: number; y: number }
const same = (a: Cell, b: Cell) => a.x === b.x && a.y === b.y;

export interface CongaPlan {
  cols: number;
  rows: number;
  pads: number;
  crumbs: number;
  /** The fewest steps between one crumb and the next. */
  minLeg: number;
  maxLeg: number;
  /** Steps a second: constant, never faster as a pond goes on. */
  speed: number;
  name: string;
}

/** Depth first: more crumbs and more lily pads to weave through before the pace picks up at all. */
export const PLANS: CongaPlan[] = [
  { cols: 11, rows: 7, pads: 0, crumbs: 5, minLeg: 3, maxLeg: 7, speed: 2.4, name: 'A small open pond: five crumbs, no lily pads' },
  { cols: 13, rows: 9, pads: 4, crumbs: 6, minLeg: 3, maxLeg: 9, speed: 2.6, name: 'A few lily pads to steer round, six crumbs' },
  { cols: 13, rows: 9, pads: 8, crumbs: 8, minLeg: 4, maxLeg: 10, speed: 2.8, name: 'More lily pads and eight crumbs' },
  { cols: 15, rows: 9, pads: 12, crumbs: 10, minLeg: 4, maxLeg: 11, speed: 3, name: 'A bigger pond, ten crumbs and a longer line' },
  { cols: 15, rows: 9, pads: 16, crumbs: 12, minLeg: 4, maxLeg: 12, speed: 3.2, name: 'Twelve crumbs among sixteen lily pads' },
  { cols: 15, rows: 9, pads: 20, crumbs: 12, minLeg: 5, maxLeg: 13, speed: 3.4, name: 'A crowded pond: twenty lily pads, twelve crumbs' },
];
export const planFor = (level: number) => PLANS[Math.min(PLANS.length, Math.max(1, level)) - 1];

/** The pond without its answer: where everything is. */
export interface Board {
  cols: number;
  rows: number;
  pads: Cell[];
  /** The line at the start, leader first, in a straight line behind the leader. */
  start: Cell[];
  heading: Dir;
  /** Crumbs in the order they are eaten: only the next one (and a faint look at the one after) shows. */
  crumbs: Cell[];
}

export interface Pond extends Board {
  /** A route with no bonk that eats every crumb in the fewest steps possible: one direction per step. */
  route: Dir[];
  /** The fewest steps for the pond: the length of `route`. */
  par: number;
}

export interface Conga {
  /** The line, leader first. */
  body: Cell[];
  heading: Dir;
  /** Crumbs eaten so far. */
  eaten: number;
}
export type Event = 'move' | 'crumb' | 'bonk';

export const startState = (b: Board): Conga => ({ body: b.start.map((c) => ({ ...c })), heading: b.heading, eaten: 0 });
export const inPond = (b: Board, c: Cell) => c.x >= 0 && c.y >= 0 && c.x < b.cols && c.y < b.rows;
export const isPad = (b: Board, c: Cell) => b.pads.some((p) => same(p, c));
export const nextCrumb = (b: Board, s: Conga): Cell | undefined => b.crumbs[s.eaten];

/** The direction that goes from one cell to a neighbouring one. */
export function dirBetween(from: Cell, to: Cell): Dir {
  if (to.x > from.x) return 0;
  if (to.y > from.y) return 1;
  if (to.x < from.x) return 2;
  return 3;
}

/**
 * One step. `want` is a turn the player asked for: straight back is ignored (a conga cannot reverse by itself). The leader
 * then goes one cell on. A crumb makes the line one duckling longer; a lily pad, the bank or the line itself is a bonk,
 * and the line turns about, so that the old tail leads and the old leader follows.
 */
export function step(b: Board, s: Conga, want: Dir | null): { state: Conga; event: Event } {
  const heading = want !== null && want !== opposite(s.heading) ? want : s.heading;
  const head = s.body[0];
  const target = { x: head.x + DX[heading], y: head.y + DY[heading] };
  const crumb = nextCrumb(b, s);
  const eats = !!crumb && same(crumb, target);
  // The tail moves away at the same moment, so the leader may take its cell, unless the line is growing.
  const body = eats ? s.body : s.body.slice(0, -1);
  if (!inPond(b, target) || isPad(b, target) || body.some((c) => same(c, target))) {
    const turned = s.body.slice().reverse();
    return { state: { body: turned, heading: dirBetween(turned[1], turned[0]), eaten: s.eaten }, event: 'bonk' };
  }
  const grown = [target, ...body];
  return { state: { body: grown, heading, eaten: s.eaten + (eats ? 1 : 0) }, event: eats ? 'crumb' : 'move' };
}

/** Steps to every open cell from `from`, going round lily pads, or -1 where it cannot be reached. */
export function distances(b: Board, from: Cell): number[] {
  const dist = new Array<number>(b.cols * b.rows).fill(-1);
  const blocked = new Set(b.pads.map((p) => p.y * b.cols + p.x));
  const start = from.y * b.cols + from.x;
  dist[start] = 0;
  const queue = [from];
  for (let i = 0; i < queue.length; i++) {
    const c = queue[i];
    for (let d = 0; d < 4; d++) {
      const n = { x: c.x + DX[d], y: c.y + DY[d] };
      if (!inPond(b, n)) continue;
      const k = n.y * b.cols + n.x;
      if (dist[k] >= 0 || blocked.has(k)) continue;
      dist[k] = dist[c.y * b.cols + c.x] + 1;
      queue.push(n);
    }
  }
  return dist;
}

/** Order to try directions in: straight on first, so a route has as few turns as it can. */
const order = (heading: Dir): Dir[] => [heading, ((heading + 1) % 4) as Dir, ((heading + 3) % 4) as Dir, opposite(heading)];

/**
 * Every way of taking the leader to the next crumb in the fewest steps the board allows, without a bonk and without the line
 * meeting itself, straight routes first. Each comes with the line as it stands after eating the crumb.
 */
function* legRoutes(b: Board, s: Conga): Generator<{ dirs: Dir[]; state: Conga }> {
  const target = nextCrumb(b, s);
  if (!target) return;
  const dist = distances(b, target);
  const need = dist[s.body[0].y * b.cols + s.body[0].x];
  if (need < 1) return;
  // A place and time that has failed once fails again: the rest of the route depends on nothing else.
  const dead = new Set<string>();
  function* walk(state: Conga, left: number, dirs: Dir[]): Generator<{ dirs: Dir[]; state: Conga }> {
    const head = state.body[0];
    const key = `${head.x},${head.y},${left}`;
    if (dead.has(key)) return;
    let found = false;
    for (const d of order(state.heading)) {
      if (d === opposite(state.heading)) continue;
      const to = { x: head.x + DX[d], y: head.y + DY[d] };
      if (!inPond(b, to) || dist[to.y * b.cols + to.x] !== left - 1) continue;
      const next = step(b, state, d);
      if (next.event === 'bonk') continue;
      if (left === 1) {
        if (next.event === 'crumb') { found = true; yield { dirs: [...dirs, d], state: next.state }; }
        continue;
      }
      if (next.event !== 'move') continue;
      for (const leg of walk(next.state, left - 1, [...dirs, d])) { found = true; yield leg; }
    }
    if (!found) dead.add(key);
  }
  yield* walk(s, need, []);
}

/** A route that eats every remaining crumb with no bonk in the fewest steps, or null if there is none (within a search limit). */
export function solveFrom(b: Board, s: Conga, budget = { left: 20000 }): Dir[] | null {
  if (s.eaten >= b.crumbs.length) return [];
  for (const leg of legRoutes(b, s)) {
    if (--budget.left < 0) return null;
    const rest = solveFrom(b, leg.state, budget);
    if (rest) return [...leg.dirs, ...rest];
  }
  return null;
}
export const solveRoute = (b: Board): Dir[] | null => solveFrom(b, startState(b));

/** The fewest steps possible whatever happens next: the open-water distances between the crumbs, added up. */
export function lowerBound(b: Board): number {
  let at = b.start[0], total = 0;
  for (const c of b.crumbs) {
    total += distances(b, at)[c.y * b.cols + c.x];
    at = c;
  }
  return total;
}

/** Turns the line in a route has to make. */
export const turnsIn = (start: Dir, route: readonly Dir[]): number => route.filter((d, i) => d !== (i === 0 ? start : route[i - 1])).length;

/**
 * Where to steer from here to reach the next crumb soonest, however the line got here: the fewest steps that avoid the line,
 * the pads and the bank, a few steps longer if the line is in the way for a while. Empty if there is nothing to suggest
 * (the line is boxed in for now: the next bonk turns it about and there will be).
 */
export function hintPath(b: Board, s: Conga, slack = 10): Dir[] {
  const target = nextCrumb(b, s);
  if (!target) return [];
  const dist = distances(b, target);
  const need = dist[s.body[0].y * b.cols + s.body[0].x];
  if (need < 1) return [];
  let nodes = 0;
  const search = (state: Conga, left: number, dirs: Dir[]): Dir[] | null => {
    if (++nodes > 60000) return null;
    const head = state.body[0];
    for (const d of order(state.heading)) {
      if (d === opposite(state.heading)) continue;
      const to = { x: head.x + DX[d], y: head.y + DY[d] };
      if (!inPond(b, to)) continue;
      const to_target = dist[to.y * b.cols + to.x];
      if (to_target < 0 || to_target > left - 1) continue;
      const next = step(b, state, d);
      if (next.event === 'bonk') continue;
      if (next.event === 'crumb') return [...dirs, d];
      const found = search(next.state, left - 1, [...dirs, d]);
      if (found) return found;
    }
    return null;
  };
  for (let extra = 0; extra <= slack; extra++) {
    const found = search(s, need + extra, []);
    if (found) return found;
  }
  return [];
}

/** The way to steer for the next step: the hint's first direction, else straight on. */
export const hintDir = (b: Board, s: Conga): Dir => hintPath(b, s)[0] ?? s.heading;

/** Reads a pond from its picture, and works out its route. `S` is the leader, `s` the line behind it, `#` a lily pad, `.` open water, and 1 to 9 then a, b, c the crumbs in order. */
export function parsePond(rows: readonly string[]): Pond {
  const pads: Cell[] = [];
  const line: Cell[] = [];
  const crumbs: (Cell | undefined)[] = [];
  let head: Cell | null = null;
  rows.forEach((row, y) => [...row].forEach((ch, x) => {
    if (ch === '#') pads.push({ x, y });
    else if (ch === 'S') head = { x, y };
    else if (ch === 's') line.push({ x, y });
    else if (/[1-9a-c]/.test(ch)) crumbs['123456789abc'.indexOf(ch)] = { x, y };
  }));
  if (!head) throw new Error('no leader');
  const body: Cell[] = [head];
  while (line.length) {
    const last = body[body.length - 1];
    const i = line.findIndex((c) => Math.abs(c.x - last.x) + Math.abs(c.y - last.y) === 1);
    if (i < 0) throw new Error('the line is broken');
    body.push(line.splice(i, 1)[0]);
  }
  const given = crumbs.filter((c): c is Cell => !!c);
  const board: Board = { cols: rows[0].length, rows: rows.length, pads, start: body, heading: dirBetween(body[1], body[0]), crumbs: given };
  const route = solveRoute(board);
  if (!route) throw new Error('no bonk-free route');
  return { ...board, route, par: route.length };
}

/** Draws a pond back into its picture (the inverse of `parsePond`), for freezing a board into a course. */
export function pictureOf(b: Board): string[] {
  const grid = Array.from({ length: b.rows }, () => new Array<string>(b.cols).fill('.'));
  for (const p of b.pads) grid[p.y][p.x] = '#';
  b.start.forEach((c, i) => { grid[c.y][c.x] = i === 0 ? 'S' : 's'; });
  b.crumbs.forEach((c, i) => { grid[c.y][c.x] = '123456789abc'[i]; });
  return grid.map((r) => r.join(''));
}

/** Whether every open cell can be reached from every other one: no lily pad may wall off a corner. */
function connected(b: Board): boolean {
  const open = b.cols * b.rows - b.pads.length;
  return distances(b, b.start[0]).filter((d) => d >= 0).length === open;
}

/** Builds a pond with a route that really exists; retries until every rule holds. */
export function makePond(plan: CongaPlan, rng: Rng): Pond {
  for (let attempt = 0; attempt < 400; attempt++) {
    const p = tryPond(plan, rng);
    if (p) return p;
  }
  throw new Error('no pond');
}

function tryPond(plan: CongaPlan, rng: Rng): Pond | null {
  const { cols, rows } = plan;
  const y = Math.floor(rows / 2);
  const start: Cell[] = [{ x: 3, y }, { x: 2, y }, { x: 1, y }];
  // A clear runway in front of the leader, so the line can get going before anything is in the way.
  const keep = new Set<string>();
  for (let x = 0; x <= 7; x++) keep.add(`${x},${y}`);
  const free: Cell[] = [];
  for (let cy = 0; cy < rows; cy++) for (let cx = 0; cx < cols; cx++) if (!keep.has(`${cx},${cy}`)) free.push({ x: cx, y: cy });
  const pads = rng.shuffle(free.slice()).slice(0, plan.pads);
  const base: Board = { cols, rows, pads, start, heading: 0, crumbs: [] };
  if (!connected(base)) return null;
  let state = startState(base);
  const crumbs: Cell[] = [];
  for (let k = 0; k < plan.crumbs; k++) {
    const from = state.body[0];
    const dist = distances(base, from);
    const taken = new Set([...crumbs, ...state.body].map((c) => `${c.x},${c.y}`));
    const options = rng.shuffle(free.filter((c) => {
      const d = dist[c.y * cols + c.x];
      return d >= plan.minLeg && d <= plan.maxLeg && !taken.has(`${c.x},${c.y}`) && !pads.some((p) => same(p, c));
    }));
    let placed = false;
    for (const c of options.slice(0, 14)) {
      const trial: Board = { ...base, crumbs: [...crumbs, c] };
      const leg = legRoutes(trial, { ...state, eaten: crumbs.length }).next();
      if (leg.done) continue;
      crumbs.push(c);
      state = leg.value.state;
      placed = true;
      break;
    }
    if (!placed) return null;
  }
  const board: Board = { ...base, crumbs };
  const route = solveRoute(board);
  if (!route || route.length !== lowerBound(board)) return null;
  return { ...board, route, par: route.length };
}
