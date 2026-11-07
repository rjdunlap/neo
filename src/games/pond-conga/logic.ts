import type { Rng } from '../../engine/random';
import type { BandLevels } from '../../progress/difficulty';

/**
 * Pond Conga: a line of ducklings paddles on at a steady pace, and the leader is steered to each bit of duck food in
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
  /** Items that show together and are eaten in any order (1, or missing: one at a time, in turn). */
  group?: number;
  /** False: no pace at all. The line waits, and each swipe, touch or press takes one step (level 8, Step by step). */
  paced?: false;
  /** True: the line starts long, `LONG_START` ducklings in an L along the bottom bank, so the tail is the obstacle (level 9, A long conga). */
  long?: true;
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
  { cols: 13, rows: 9, pads: 6, crumbs: 9, minLeg: 3, maxLeg: 8, speed: 2.8, group: 3, name: 'Choose the order: three bites show at once, nine in all' },
  { cols: 11, rows: 7, pads: 2, crumbs: 5, minLeg: 3, maxLeg: 7, speed: 2.4, paced: false, name: 'Step by step: the line waits, one step a swipe' },
  { cols: 11, rows: 7, pads: 6, crumbs: 8, minLeg: 3, maxLeg: 7, speed: 2.6, long: true, name: 'A long conga: seven ducklings from the start, so the tail is in the way' },
  // School only (levels 10 and 11): small 4-row ponds step by step, so the cells and buttons are 100 units on a 768-unit side.
  { cols: 6, rows: 4, pads: 0, crumbs: 3, minLeg: 2, maxLeg: 5, speed: 2.4, paced: false, name: 'A little pond, one step at a time' },
  { cols: 7, rows: 4, pads: 2, crumbs: 4, minLeg: 3, maxLeg: 6, speed: 2.4, paced: false, name: 'Round the lily pads, one step at a time' },
];

/** A grown-up game in Lantern Lake, played by touch or on the couch, with two small step-by-step ponds (10 and 11) for school. */
/** Level 8, Step by step, is the easy way in: first by `order` and a new player's entry. Level 9, A long conga, is the top. */
export const LEVELS: BandLevels = { school: { min: 10, max: 11 }, grownup: { min: 1, max: 9, order: [8, 1, 2, 3, 4, 5, 6, 7, 9] } };
export const planFor = (level: number) => PLANS[Math.min(PLANS.length, Math.max(1, level)) - 1];

/** How long a step-by-step line takes to glide one cell, in seconds; one asked-for step waits until the last has landed. */
export const STEP_GLIDE = 0.18;

/**
 * Whether the line takes a step now: a paced line once a period has gone by, a step-by-step line only for a step that was asked
 * for (`asked`), once the step before it has landed. Without input a step-by-step line never moves, however long it waits.
 */
export const stepDue = (plan: Pick<CongaPlan, 'paced' | 'speed'>, acc: number, asked: number): boolean =>
  plan.paced === false ? asked > 0 && acc >= STEP_GLIDE : acc >= 1 / plan.speed;

/** The pond without its answer: where everything is. */
export interface Board {
  cols: number;
  rows: number;
  pads: Cell[];
  /** The line at the start, leader first, in a straight line behind the leader. */
  start: Cell[];
  heading: Dir;
  /** Crumbs in the order they are eaten: only the next one (and a faint look at the one after) shows. With a `group`, crumbs come in groups of that size, shown together and eaten in any order. */
  crumbs: Cell[];
  /** Crumbs shown together (1, or missing: one at a time). */
  group?: number;
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
  /** Which crumbs are eaten, one bit for each (by its place in `crumbs`): with groups, the count alone cannot say which. */
  got: number;
}
export type Event = 'move' | 'crumb' | 'bonk';

export const startState = (b: Board): Conga => ({ body: b.start.map((c) => ({ ...c })), heading: b.heading, eaten: 0, got: 0 });
export const inPond = (b: Board, c: Cell) => c.x >= 0 && c.y >= 0 && c.x < b.cols && c.y < b.rows;
export const isPad = (b: Board, c: Cell) => b.pads.some((p) => same(p, c));
export const groupOf = (b: Board) => Math.max(1, b.group ?? 1);
/** The places in `crumbs` of the crumbs she can eat now: the uneaten ones of the group being eaten (just the next one without groups). */
export function openIndices(b: Board, s: Conga): number[] {
  const size = groupOf(b), first = Math.floor(s.eaten / size) * size, out: number[] = [];
  for (let i = first; i < Math.min(first + size, b.crumbs.length); i++) if (!(s.got & (1 << i))) out.push(i);
  return out;
}
export const openCrumbs = (b: Board, s: Conga): Cell[] => openIndices(b, s).map((i) => b.crumbs[i]);
/** The first crumb she can eat now. */
export const nextCrumb = (b: Board, s: Conga): Cell | undefined => openCrumbs(b, s)[0];

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
  const eatsAt = openIndices(b, s).find((i) => same(b.crumbs[i], target));
  const eats = eatsAt !== undefined;
  // The tail moves away at the same moment, so the leader may take its cell, unless the line is growing.
  const body = eats ? s.body : s.body.slice(0, -1);
  if (!inPond(b, target) || isPad(b, target) || body.some((c) => same(c, target))) {
    const turned = s.body.slice().reverse();
    return { state: { body: turned, heading: dirBetween(turned[1], turned[0]), eaten: s.eaten, got: s.got }, event: 'bonk' };
  }
  const grown = [target, ...body];
  return { state: { body: grown, heading, eaten: s.eaten + (eats ? 1 : 0), got: eats ? s.got | (1 << eatsAt) : s.got }, event: eats ? 'crumb' : 'move' };
}

/**
 * A step at school, where a bump is a refused step: the line stays exactly where it was (`held`). Only when every way but
 * straight back would bump does it turn about as `step` does, so she can never be stuck.
 */
export function schoolStep(b: Board, s: Conga, want: Dir | null): { state: Conga; event: Event; held: boolean } {
  const r = step(b, s, want);
  if (r.event !== 'bonk') return { ...r, held: false };
  const shut = ([0, 1, 2, 3] as Dir[]).every((d) => d === opposite(s.heading) || step(b, s, d).event === 'bonk');
  return shut ? { ...r, held: false } : { state: s, event: 'bonk', held: true };
}

/**
 * The step a tap at school asks for: toward the point (`x`, `y`, in board units with `cell`-unit cells), along whichever
 * axis it is further from the leader's centre. A tap on the leader's own cell, or one that points straight back, asks nothing.
 */
export function tapToward(leader: Cell, x: number, y: number, cell: number, heading: Dir): Dir | null {
  const dx = x - (leader.x + 0.5) * cell, dy = y - (leader.y + 0.5) * cell;
  if (Math.abs(dx) < cell / 2 && Math.abs(dy) < cell / 2) return null;
  const d: Dir = Math.abs(dx) >= Math.abs(dy) ? (dx > 0 ? 0 : 2) : (dy > 0 ? 1 : 3);
  return d === opposite(heading) ? null : d;
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
 * Every way of taking the leader to one crumb she can eat now (the next one unless given) in the fewest steps the board allows,
 * without a bonk, without the line meeting itself and without eating another crumb on the way, straight routes first. Each
 * comes with the line as it stands after eating the crumb.
 */
function* legRoutes(b: Board, s: Conga, aim: Cell | undefined = nextCrumb(b, s)): Generator<{ dirs: Dir[]; state: Conga }> {
  if (!aim) return;
  const target = aim;
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
        if (next.event === 'crumb' && same(next.state.body[0], target)) { found = true; yield { dirs: [...dirs, d], state: next.state }; }
        continue;
      }
      if (next.event !== 'move') continue;
      for (const leg of walk(next.state, left - 1, [...dirs, d])) { found = true; yield leg; }
    }
    if (!found) dead.add(key);
  }
  yield* walk(s, need, []);
}

/**
 * A route that eats every remaining crumb with no bonk in the fewest steps the open water allows from here (`restBound`), or
 * null if there is none (within a search limit). With groups, it tries the crumbs that start a best order first.
 */
export function solveFrom(b: Board, s: Conga, budget = { left: 20000 }): Dir[] | null {
  if (s.eaten >= b.crumbs.length) return [];
  const want = restBound(b, s);
  for (const first of bestFirst(b, s)) {
    if (first.bound > want) break;
    for (const leg of legRoutes(b, s, b.crumbs[first.index])) {
      if (--budget.left < 0) return null;
      const rest = solveFrom(b, leg.state, budget);
      if (rest) return [...leg.dirs, ...rest];
    }
  }
  return null;
}
export const solveRoute = (b: Board): Dir[] | null => solveFrom(b, startState(b));

/** Distances depend only on the pond's size and lily pads, so they are kept for each pads list (trial ponds share one). */
const known = new WeakMap<Cell[], Map<string, number[]>>();
/** Open-water steps between two cells, going round lily pads (-1 if there is no way). */
function gap(b: Board, from: Cell, to: Cell): number {
  let byCell = known.get(b.pads);
  if (!byCell) known.set(b.pads, (byCell = new Map()));
  const key = `${b.cols},${b.rows},${from.x},${from.y}`;
  let dist = byCell.get(key);
  if (!dist) byCell.set(key, (dist = distances(b, from)));
  return dist[to.y * b.cols + to.x];
}

/** All the orders of a few items. */
function orders(items: readonly number[]): number[][] {
  if (items.length <= 1) return [items.slice()];
  return items.flatMap((x, k) => orders([...items.slice(0, k), ...items.slice(k + 1)]).map((rest) => [x, ...rest]));
}

/**
 * The fewest steps to eat the rest from `at` with the crumbs in `got` already eaten, over every order the groups allow. A group ends wherever its order ends, which changes the next group's first leg, so this
 * keeps the best total for each crumb a group could end on.
 */
function restFrom(b: Board, at: Cell, got: number, eaten: number): number {
  const size = groupOf(b);
  // ends: the crumb last eaten (or -1 for `at`) and the fewest steps so far.
  let ends = new Map<number, number>([[-1, 0]]);
  const cellOf = (k: number) => (k < 0 ? at : b.crumbs[k]);
  for (let g = Math.floor(eaten / size) * size; g < b.crumbs.length; g += size) {
    const items: number[] = [];
    for (let i = g; i < Math.min(g + size, b.crumbs.length); i++) if (!(got & (1 << i))) items.push(i);
    const next = new Map<number, number>();
    for (const [end, cost] of ends) {
      for (const order of orders(items)) {
        let total = cost, from = cellOf(end), ok = true;
        for (const k of order) {
          const d = gap(b, from, b.crumbs[k]);
          if (d < 0) { ok = false; break; }
          total += d;
          from = b.crumbs[k];
        }
        if (!ok) continue;
        const last = order[order.length - 1];
        if (!(next.get(last)! <= total)) next.set(last, total);
      }
    }
    ends = next;
    if (!ends.size) break;
  }
  return ends.size ? Math.min(...ends.values()) : Infinity;
}

/** The fewest steps possible from here whatever happens next: the open-water distances between the crumbs added up, in the best order the groups allow. */
export const restBound = (b: Board, s: Conga): number => restFrom(b, s.body[0], s.got, s.eaten);

/** The fewest steps possible for the whole pond. */
export const lowerBound = (b: Board): number => restBound(b, startState(b));

/** The crumbs she can eat now, each with the fewest steps for the whole rest if she eats it first, best first. */
export function bestFirst(b: Board, s: Conga): { index: number; bound: number }[] {
  return openIndices(b, s)
    .map((index) => {
      const lead = gap(b, s.body[0], b.crumbs[index]);
      return { index, bound: lead < 0 ? Infinity : lead + restFrom(b, b.crumbs[index], s.got | (1 << index), s.eaten + 1) };
    })
    .sort((x, y) => x.bound - y.bound || x.index - y.index);
}

/** The crumbs that start a best order from here (ties all count). */
export function bestStarts(b: Board, s: Conga): number[] {
  const all = bestFirst(b, s);
  return all.filter((o) => o.bound === all[0].bound).map((o) => o.index);
}

/** Turns the line in a route has to make. */
export const turnsIn = (start: Dir, route: readonly Dir[]): number => route.filter((d, i) => d !== (i === 0 ? start : route[i - 1])).length;

/**
 * Where to steer from here to reach the next crumb soonest, however the line got here: the fewest steps that avoid the line,
 * the pads and the bank, a few steps longer if the line is in the way for a while. With groups, the way goes to a crumb that
 * starts a best order from here (the next best if the line is in the way of that one). Empty if there is nothing to suggest
 * (the line is boxed in for now: the next bonk turns it about and there will be).
 */
export function hintPath(b: Board, s: Conga, slack = 10): Dir[] {
  for (const { index } of bestFirst(b, s)) {
    const found = hintTo(b, s, b.crumbs[index], slack);
    if (found.length) return found;
  }
  return [];
}

function hintTo(b: Board, s: Conga, target: Cell, slack: number): Dir[] {
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
      if (next.event === 'crumb') {
        if (same(to, target)) return [...dirs, d];
        continue;
      }
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

/** How many ducklings a long conga starts with (level 9). */
export const LONG_START = 7;

/** A long line's start, leader first: along the bottom bank heading right, its tail turning up the left bank. */
export function longStart(rows: number): Cell[] {
  const y = rows - 1, along = 4;
  const bottom = Array.from({ length: along }, (_, k) => ({ x: along - 1 - k, y }));
  const up = Array.from({ length: LONG_START - along }, (_, k) => ({ x: 0, y: y - 1 - k }));
  return [...bottom, ...up];
}

function tryPond(plan: CongaPlan, rng: Rng): Pond | null {
  const { cols, rows } = plan;
  const y = plan.long ? rows - 1 : Math.floor(rows / 2);
  const start: Cell[] = plan.long ? longStart(rows) : [{ x: 3, y }, { x: 2, y }, { x: 1, y }];
  // A clear runway in front of the leader, so the line can get going before anything is in the way; a long line's own cells stay clear too.
  const keep = new Set<string>(start.map((c) => `${c.x},${c.y}`));
  for (let x = 0; x <= 7; x++) keep.add(`${x},${y}`);
  const free: Cell[] = [];
  for (let cy = 0; cy < rows; cy++) for (let cx = 0; cx < cols; cx++) if (!keep.has(`${cx},${cy}`)) free.push({ x: cx, y: cy });
  const pads = rng.shuffle(free.slice()).slice(0, plan.pads);
  const base: Board = { cols, rows, pads, start, heading: 0, crumbs: [], ...(plan.group ? { group: plan.group } : {}) };
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
  if (groupOf(board) > 1 && !orderMatters(board, route)) return null;
  if (plan.long && tailLegs(board, route) < TAIL_LEGS) return null;
  return { ...board, route, par: route.length };
}

/** How many legs of a long conga must have the tail on a shortest way through open water, so it really is in the way. */
export const TAIL_LEGS = 4;

/**
 * Whether the line is in the way of the shortest open-water way to `to`: some duckling stands on a cell of a fewest-steps
 * way and is still there when the leader would get to it (the tail moves off one cell a step, the leader on one). The
 * duckling right behind the leader does not count: straight back is never a way.
 */
export function tailInWay(b: Board, s: Conga, to: Cell): boolean {
  const fromHead = distances(b, s.body[0]), toAim = distances(b, to);
  const total = toAim[s.body[0].y * b.cols + s.body[0].x];
  return s.body.some((c, i) => {
    const k = c.y * b.cols + c.x;
    return i > 1 && fromHead[k] >= 0 && fromHead[k] + toAim[k] === total && fromHead[k] < s.body.length - i;
  });
}

/** How many legs of a route start with the line in the way of the next bite's shortest open-water way. */
export function tailLegs(b: Board, route: readonly Dir[]): number {
  let s = startState(b), count = 0, aim = nextCrumb(b, s);
  if (aim && tailInWay(b, s, aim)) count++;
  for (const d of route) {
    const next = step(b, s, d);
    s = next.state;
    if (next.event !== 'crumb') continue;
    aim = nextCrumb(b, s);
    if (aim && tailInWay(b, s, aim)) count++;
  }
  return count;
}

/** The steps each order of a group takes from `at`, by the open-water distances (`orders` order). */
export function groupCosts(b: Board, at: Cell, group: number): number[] {
  const size = groupOf(b), items: number[] = [];
  for (let i = group * size; i < Math.min((group + 1) * size, b.crumbs.length); i++) items.push(i);
  return orders(items).map((order) => {
    let from = at, total = 0;
    for (const k of order) { total += gap(b, from, b.crumbs[k]); from = b.crumbs[k]; }
    return total;
  });
}

/** Whether, where the best route reaches each group, some orders of that group are longer than others: so which first is a real choice. */
export function orderMatters(b: Board, route: readonly Dir[]): boolean {
  const size = groupOf(b);
  let s = startState(b), at = 0;
  for (let g = 0; g * size < b.crumbs.length; g++) {
    const costs = groupCosts(b, s.body[0], g);
    if (Math.min(...costs) === Math.max(...costs)) return false;
    while (at < route.length && s.eaten < (g + 1) * size) s = step(b, s, route[at++]).state;
  }
  return true;
}

/** Duck-friendly food: one kind per pond. Code and pond pictures still call each bit a crumb. */
export const FOODS = ['peas', 'sweetcorn', 'oats'] as const;
export type Food = (typeof FOODS)[number];

/** How a pond looks, which never changes the pond itself: the food, and the bank edge where the reeds grow (a `Dir` from the middle). */
export interface PondLook { food: Food; reeds: Dir }

/** The look of a round, a pure function of its seed: it reads a copy of the round's numbers, so the pond made after it is the same. */
export function pondLook(rng: Rng): PondLook {
  const r = rng.clone();
  return { food: FOODS[r.int(0, FOODS.length - 1)], reeds: r.int(0, 3) as Dir };
}

/** The food for the `index`th pond of a round: a course of several ponds takes the next kind each time. */
export const foodAt = (look: PondLook, index: number): Food => FOODS[(FOODS.indexOf(look.food) + index) % FOODS.length];

/** How far a finger has to travel, in logical units, before a swipe turns the line. */
export const SWIPE = 36;

/**
 * The turn a finger's travel asks for: the way it has gone since it came down or last turned the line. Null until it has gone
 * `reach` along one axis and clearly more along that one than the other (a slant waits to become a clear stroke).
 */
export function swipeDir(dx: number, dy: number, reach = SWIPE): Dir | null {
  const ax = Math.abs(dx), ay = Math.abs(dy);
  if (Math.max(ax, ay) < reach || Math.abs(ax - ay) < Math.max(ax, ay) * 0.25) return null;
  return ax > ay ? (dx > 0 ? 0 : 2) : (dy > 0 ? 1 : 3);
}

/** The cell the leader will be in after `steps` more steps of `route`, a bonk-free way on from the state `s`. */
export function headAfter(b: Board, s: Conga, route: readonly Dir[], steps: number): Cell {
  let state = s;
  for (let i = 0; i < steps && i < route.length; i++) state = step(b, state, route[i]).state;
  return state.body[0];
}

/**
 * The same pond with only its first `n` crumbs (whole groups: at least one, never a group cut short), and the fewest-steps
 * route for those (a prefix of a bonk-free fewest-steps route is one).
 */
export function firstCrumbs(pond: Pond, n: number): Pond {
  const size = groupOf(pond);
  n = Math.max(size, Math.floor(n / size) * size);
  if (n >= pond.crumbs.length) return pond;
  const board: Board = { cols: pond.cols, rows: pond.rows, pads: pond.pads, start: pond.start, heading: pond.heading, crumbs: pond.crumbs.slice(0, n), group: pond.group };
  // With groups, the short pond's best order can differ from the whole pond's; if no route meets its bound, the whole route's start does.
  let route = solveRoute(board);
  if (!route && size > 1) {
    let s = startState(board), at = 0;
    while (at < pond.route.length && s.eaten < n) s = step(board, s, pond.route[at++]).state;
    route = pond.route.slice(0, at);
  }
  if (!route) throw new Error('no bonk-free route');
  return { ...board, route, par: route.length };
}
