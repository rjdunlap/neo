import type { Rng } from '../../engine/random';

/**
 * Puddle Gobble's rules: a puddle soaks up beach things that fit inside it and grows, so what fits depends on what she
 * has already soaked. Levels 1–5 compare pictured sizes (tiers 1–4, with dots); 6–8 compare numbers.
 */

export type Mode = 'grow' | 'order' | 'plus' | 'add' | 'pail';

export interface Plan {
  id: number;
  name: string;
  mode: Mode;
  /** Soaks per growth step at the picture levels (0: the puddle stays its size). */
  grow: number;
}

const PLANS: Plan[] = [
  { id: 1, name: 'Soak it up', mode: 'grow', grow: 0 },
  { id: 2, name: 'Too big yet', mode: 'grow', grow: 2 },
  { id: 3, name: 'Bigger and bigger', mode: 'grow', grow: 2 },
  { id: 4, name: 'Count to grow', mode: 'grow', grow: 3 },
  { id: 5, name: 'Smallest first', mode: 'order', grow: 0 },
  { id: 6, name: 'Bigger number', mode: 'plus', grow: 0 },
  { id: 7, name: 'Add to grow', mode: 'add', grow: 0 },
  { id: 8, name: 'Just right', mode: 'pail', grow: 0 },
];

export const LEVEL_COUNT = PLANS.length;

export function planFor(level: number): Plan {
  return PLANS[Math.max(1, Math.min(PLANS.length, Math.round(level))) - 1];
}

/** True where numbers decide (levels 6–8) rather than pictured tiers. */
export const numeric = (plan: Plan) => plan.mode === 'plus' || plan.mode === 'add' || plan.mode === 'pail';

/* Things ---------------------------------------------------------------------------------------- */

export const KINDS_BY_TIER = {
  1: ['shell', 'pebble', 'leaf', 'feather'],
  2: ['pinecone', 'boat', 'seaweed', 'starfish'],
  3: ['ball', 'driftwood', 'bucket'],
  4: ['ring', 'kite'],
} as const;
export type Kind = (typeof KINDS_BY_TIER)[keyof typeof KINDS_BY_TIER][number];
/** Numbered things are drawn alike at tier 2's size, so only the number decides. */
export const NUMBER_KINDS: Kind[] = ['pebble', 'shell', 'starfish'];

export interface Thing {
  id: number;
  kind: Kind;
  /** Its tier (1–4) at the picture levels, its number at 6–8. */
  size: number;
}

/** Drawn widths: a thing of tier k is 70, 120, 170 or 220 across, and a puddle of tier k is that plus 30. */
export const THING_D = [0, 70, 120, 170, 220];
export const PUDDLE_D = [0, 100, 150, 200, 250];
export const MAX_PUDDLE_D = 250;

export function thingDiameter(plan: Plan, t: Thing) {
  return numeric(plan) ? THING_D[2] : THING_D[t.size];
}

/** The puddle's drawn width: by tier, or stepped with its number and capped (the rule reads only the number). */
export function puddleDiameter(plan: Plan, puddle: number) {
  if (!numeric(plan)) return PUDDLE_D[Math.max(1, Math.min(4, puddle))];
  return Math.min(MAX_PUDDLE_D, 130 + 10 * Math.floor(puddle / 2) * 2);
}

/* State ----------------------------------------------------------------------------------------- */

export interface Board {
  plan: Plan;
  /** The puddle's starting tier or number. */
  start: number;
  /** The pail's number (level 8). */
  pail?: number;
  things: Thing[];
}

export interface State {
  /** The puddle's tier (1–4) or number now. */
  puddle: number;
  /** Drops filled on the growth meter. */
  drops: number;
  /** Soaked ids, in order. */
  soaked: number[];
  /** Ids still on the sand. */
  left: number[];
}

export function startState(board: Board): State {
  return { puddle: board.start, drops: 0, soaked: [], left: board.things.map((t) => t.id) };
}

export const thingOf = (board: Board, id: number) => board.things.find((t) => t.id === id)!;

export function fits(puddle: number, thing: Thing) {
  return thing.size <= puddle;
}

export type Refusal = 'too-big' | 'order' | 'too-much';

/** Why soaking `id` now is refused, or null when it slides in. */
export function refusal(board: Board, s: State, id: number): Refusal | null {
  const t = thingOf(board, id);
  if (!fits(s.puddle, t)) return 'too-big';
  if (board.plan.mode === 'order' && s.left.some((o) => thingOf(board, o).size < t.size)) return 'order';
  if (board.plan.mode === 'pail' && s.puddle + t.size > board.pail!) return 'too-much';
  return null;
}

export type SoakResult = { ok: true; state: State; grew: boolean } | { ok: false; reason: Refusal };

export function soak(board: Board, s: State, id: number): SoakResult {
  if (!s.left.includes(id)) throw new Error(`thing ${id} is not on the sand`);
  const why = refusal(board, s, id);
  if (why) return { ok: false, reason: why };
  const t = thingOf(board, id);
  const next: State = { ...s, soaked: [...s.soaked, id], left: s.left.filter((o) => o !== id) };
  const { mode, grow } = board.plan;
  let grew = false;
  if (mode === 'grow' && grow > 0) {
    next.drops = s.drops + 1;
    if (next.drops >= grow) {
      next.drops = 0;
      grew = s.puddle < 4;
      next.puddle = Math.min(4, s.puddle + 1);
    }
  } else if (mode === 'plus') {
    next.puddle = s.puddle + 1;
    grew = true;
  } else if (mode === 'add' || mode === 'pail') {
    next.puddle = s.puddle + t.size;
    grew = true;
  }
  return { ok: true, state: next, grew };
}

/** Level 8: a soaked thing hops back onto the sand and the puddle shrinks by its number. Free, never a miss. */
export function letGo(board: Board, s: State, id: number): State {
  if (board.plan.mode !== 'pail' || !s.soaked.includes(id)) throw new Error(`cannot let ${id} go`);
  return { ...s, puddle: s.puddle - thingOf(board, id).size, soaked: s.soaked.filter((o) => o !== id), left: [...s.left, id] };
}

export function done(board: Board, s: State) {
  return board.plan.mode === 'pail' ? s.puddle === board.pail : s.left.length === 0;
}

/** What may slide in now. */
export function soakable(board: Board, s: State) {
  return s.left.filter((id) => refusal(board, s, id) === null);
}

/** From here, does soaking whatever fits (smallest first) clear the beach? Growth only ever helps, so this is the whole test (levels 1–7). */
export function greedyClears(board: Board, s: State = startState(board)) {
  let st = s;
  while (!done(board, st)) {
    const can = soakable(board, st).sort((a, b) => thingOf(board, a).size - thingOf(board, b).size);
    if (!can.length) return false;
    const r = soak(board, st, can[0]);
    if (!r.ok) return false;
    st = r.state;
  }
  return true;
}

/**
 * Level 8: every set of things on the sand that would bring the puddle exactly to the pail, soaked in some order that
 * fits each one when it goes in (smallest first is always the best order). Each is listed smallest first, by id.
 */
export function exactSolutions(board: Board, s: State = startState(board)): number[][] {
  const left = [...s.left].sort((a, b) => thingOf(board, a).size - thingOf(board, b).size || a - b);
  const need = board.pail! - s.puddle;
  const out: number[][] = [];
  if (need === 0) return [[]];
  if (need < 0) return out;
  for (let mask = 1; mask < 1 << left.length; mask++) {
    const ids = left.filter((_, i) => mask & (1 << i));
    if (ids.reduce((sum, id) => sum + thingOf(board, id).size, 0) !== need) continue;
    let p = s.puddle;
    let ok = true;
    for (const id of ids) {
      const v = thingOf(board, id).size;
      if (v > p) { ok = false; break; }
      p += v;
    }
    if (ok) out.push(ids);
  }
  return out;
}

export type Hint = { soak: number } | { letGo: number };

/**
 * The next good move: the nearest thing that fits (1–4, 6–7); the smallest left (5); at level 8 a soak on some exact
 * solution, or the strip token to let go that reopens one with the fewest let-gos. `near` ranks ties by distance.
 */
export function hintTarget(board: Board, s: State, near: (id: number) => number = () => 0): Hint | null {
  if (done(board, s)) return null;
  const nearest = (ids: number[]) => (ids.length ? ids.reduce((a, b) => (near(b) < near(a) ? b : a)) : null);
  if (board.plan.mode === 'pail') {
    const sols = exactSolutions(board, s);
    if (sols.length) {
      // The first thing of any solution fits now; prefer the nearest of those.
      const firsts = [...new Set(sols.map((ids) => ids[0]))];
      return { soak: nearest(firsts)! };
    }
    for (let k = 1; k <= s.soaked.length; k++) {
      // The latest soaks first: letting go what she just did is the plainest undo.
      for (const drop of subsets([...s.soaked].reverse(), k)) {
        let st = s;
        for (const id of drop) st = letGo(board, st, id);
        if (exactSolutions(board, st).length) return { letGo: drop[0] };
      }
    }
    return null;
  }
  const can = soakable(board, s);
  const id = nearest(can);
  return id === null ? null : { soak: id };
}

function subsets<T>(xs: T[], k: number): T[][] {
  if (k === 0) return [[]];
  const out: T[][] = [];
  xs.forEach((x, i) => {
    for (const rest of subsets(xs.slice(i + 1), k - 1)) out.push([x, ...rest]);
  });
  return out;
}

/** Level 8's plan filter: from some state she can reach, a soak that fits leaves no exact total without letting go. */
export function deadEndReachable(board: Board) {
  const seen = new Set<string>();
  const walk = (s: State): boolean => {
    const key = [...s.soaked].sort((a, b) => a - b).join(',');
    if (seen.has(key)) return false;
    seen.add(key);
    for (const id of soakable(board, s)) {
      const r = soak(board, s, id);
      if (!r.ok) continue;
      if (!done(board, r.state) && exactSolutions(board, r.state).length === 0) return true;
      if (walk(r.state)) return true;
    }
    return false;
  };
  return walk(startState(board));
}

/* Boards ---------------------------------------------------------------------------------------- */


function picture(rng: Rng, tiers: number[]): Thing[] {
  return rng.shuffle(tiers).map((size, id) => ({ id, size, kind: rng.pick(KINDS_BY_TIER[size as 1 | 2 | 3 | 4]) }));
}

function numbered(rng: Rng, values: number[]): Thing[] {
  return rng.shuffle(values).map((size, id) => ({ id, size, kind: rng.pick(NUMBER_KINDS) }));
}

function distinct(rng: Rng, n: number, lo: number, hi: number) {
  return rng.shuffle(Array.from({ length: hi - lo + 1 }, (_, i) => lo + i)).slice(0, n);
}

/** Each plan's authored first round (and the fallback the tests show is never needed). */
export function authoredBoard(plan: Plan): Board {
  const things = (kinds: [Kind, number][]): Thing[] => kinds.map(([kind, size], id) => ({ id, kind, size }));
  switch (plan.id) {
    case 1: return { plan, start: 2, things: things([['shell', 1], ['shell', 1], ['shell', 1], ['shell', 1], ['shell', 1]]) };
    case 2: return { plan, start: 1, things: things([['pebble', 1], ['pebble', 1], ['boat', 2], ['pebble', 1], ['pebble', 1]]) };
    case 3: return { plan, start: 1, things: things([['leaf', 1], ['pinecone', 2], ['ball', 3], ['leaf', 1], ['pinecone', 2]]) };
    case 4: return { plan, start: 1, things: things([['shell', 1], ['pinecone', 2], ['shell', 1], ['driftwood', 3], ['pinecone', 2], ['shell', 1], ['pinecone', 2]]) };
    case 5: return { plan, start: 4, things: things([['feather', 1], ['seaweed', 2], ['ball', 3], ['seaweed', 2], ['ring', 4]]) };
    case 6: return { plan, start: 3, things: things([['pebble', 1], ['pebble', 2], ['pebble', 4], ['pebble', 5], ['pebble', 7], ['pebble', 3]]) };
    case 7: return { plan, start: 5, things: things([['pebble', 2], ['shell', 3], ['pebble', 6], ['starfish', 9], ['pebble', 15], ['shell', 4]]) };
    default: return { plan, start: 4, pail: 15, things: things([['pebble', 2], ['pebble', 3], ['shell', 5], ['pebble', 6], ['starfish', 8], ['pebble', 9]]) };
  }
}

/** The plan filter from the definition's level table. */
export function passesFilter(board: Board): boolean {
  const { plan, things, start } = board;
  const s0 = startState(board);
  const tooBig = things.filter((t) => !fits(start, t));
  switch (plan.id) {
    case 1: return tooBig.length === 0 && things.length === 5;
    case 2: {
      if (tooBig.length !== 1) return false;
      // It fits after exactly two soaks.
      let st = s0;
      for (let i = 0; i < 2; i++) {
        const r = soak(board, st, soakable(board, st).find((id) => id !== tooBig[0].id)!);
        if (!r.ok) return false;
        st = r.state;
      }
      return fits(st.puddle, tooBig[0]) && greedyClears(board);
    }
    case 3: case 4: {
      if (!greedyClears(board)) return false;
      // The biggest thing waits for the most growth: no tier-3 thing fits before (grow × 2) soaks.
      const needs = plan.grow * 2;
      let st = s0;
      for (let i = 0; i < needs - 1; i++) {
        const can = soakable(board, st).filter((id) => thingOf(board, id).size < 3);
        if (!can.length) return false;
        const r = soak(board, st, can[0]);
        if (!r.ok) return false;
        st = r.state;
      }
      return st.puddle < 3;
    }
    case 5: return tooBig.length === 0 && new Set(things.map((t) => t.size)).size === 4 && things.length === 5;
    case 6: return tooBig.length >= 2 && greedyClears(board);
    case 7: {
      const smallest = Math.min(...things.map((t) => t.size));
      const total = start + things.reduce((sum, t) => sum + t.size, 0);
      return things.some((t) => t.size > start + smallest) && greedyClears(board) && total <= 60;
    }
    default: {
      const n = exactSolutions(board).length;
      return n >= 1 && n <= 6 && deadEndReachable(board);
    }
  }
}

function draw(plan: Plan, rng: Rng): Board {
  switch (plan.id) {
    case 1: return { plan, start: 2, things: picture(rng, [1, 1, 1, 1, 1]) };
    case 2: return { plan, start: 1, things: picture(rng, [1, 1, 1, 1, 2]) };
    case 3: return { plan, start: 1, things: picture(rng, [1, 1, 2, 2, 3, ...(rng.chance(0.5) ? [1] : [])]) };
    case 4: return { plan, start: 1, things: picture(rng, [1, 1, 1, 2, 2, 2, 3]) };
    case 5: return { plan, start: 4, things: picture(rng, [1, 2, 3, 4, rng.int(1, 4)]) };
    case 6: return { plan, start: 3, things: numbered(rng, distinct(rng, 6, 1, 10)) };
    case 7: return { plan, start: rng.int(4, 6), things: numbered(rng, distinct(rng, 6, 1, 20)) };
    default: return { plan, start: rng.int(3, 5), pail: rng.int(12, 20), things: numbered(rng, distinct(rng, 6, 1, 9)) };
  }
}

/** A seeded board that passes the plan's filter (at most 50 tries, then the authored one). */
export function makeBoard(plan: Plan, rng: Rng): Board & { fallback?: true } {
  for (let i = 0; i < 50; i++) {
    const b = draw(plan, rng);
    if (passesFilter(b)) return b;
  }
  return { ...authoredBoard(plan), fallback: true };
}

/* Layout ---------------------------------------------------------------------------------------- */

export interface Rect { x0: number; y0: number; x1: number; y1: number }
export interface View2 { w: number; h: number }

/** The pet's bottom-left corner and the pail's top-right corner (level 8), kept clear of things. */
export const PET_CORNER = 240;
export const PAIL_BOX = 170;

/** Where things may sit: the view less 40-unit margins and the top band (taller where the sum strip lives). */
export function fieldFor(plan: Plan, v: View2): Rect {
  const top = plan.mode === 'add' || plan.mode === 'pail' ? 150 : 130;
  return { x0: 40, y0: top, x1: v.w - 40, y1: v.h - 40 };
}

/** The puddle's first spot: the field's lower middle, as a fraction of the design field so bigger views only spread it. */
export function puddleStart(plan: Plan, f: Rect) {
  const d = fieldFor(plan, DESIGN);
  return placeOn(f, { fx: 0.5, fy: (d.y1 - MAX_PUDDLE_D / 2 - 10 - d.y0) / (d.y1 - d.y0) });
}

export function inPetCorner(v: View2, x: number, y: number, r: number) {
  return x - r < 40 + PET_CORNER && y + r > v.h - 40 - PET_CORNER;
}

export function inPailBox(plan: Plan, f: Rect, x: number, y: number, r: number) {
  return plan.mode === 'pail' && x + r > f.x1 - PAIL_BOX && y - r < f.y0 + PAIL_BOX;
}

/** Each thing's place as fractions of the field, laid out once on the design view so every view shows the same beach. */
export interface Placed { id: number; fx: number; fy: number }

const DESIGN: View2 = { w: 1024, h: 768 };

export function beachLayout(board: Board, rng: Rng): Placed[] {
  const f = fieldFor(board.plan, DESIGN);
  const start = puddleStart(board.plan, f);
  const out: { id: number; x: number; y: number; r: number }[] = [];
  // Biggest first, so the hardest to fit find room.
  const order = [...board.things].sort((a, b) => thingDiameter(board.plan, b) - thingDiameter(board.plan, a));
  for (let attempt = 0; attempt < 40; attempt++) {
    out.length = 0;
    for (const t of order) {
      const r = thingDiameter(board.plan, t) / 2;
      for (let tries = 0; tries < 400; tries++) {
        const x = rng.range(f.x0 + r, f.x1 - r);
        const y = rng.range(f.y0 + r, f.y1 - r);
        if (inPetCorner(DESIGN, x, y, r) || inPailBox(board.plan, f, x, y, r)) continue;
        if (Math.hypot(x - start.x, y - start.y) < MAX_PUDDLE_D / 2 + r) continue;
        if (out.some((o) => Math.hypot(o.x - x, o.y - y) < o.r + r + 30)) continue;
        out.push({ id: t.id, x, y, r });
        break;
      }
    }
    if (out.length === board.things.length) break;
  }
  if (out.length !== board.things.length) throw new Error('beach layout failed');
  const W = f.x1 - f.x0, H = f.y1 - f.y0;
  return out.map((o) => ({ id: o.id, fx: (o.x - f.x0) / W, fy: (o.y - f.y0) / H })).sort((a, b) => a.id - b.id);
}

export function placeOn(f: Rect, p: { fx: number; fy: number }) {
  return { x: f.x0 + (f.x1 - f.x0) * p.fx, y: f.y0 + (f.y1 - f.y0) * p.fy };
}

/* The ghost finger's way ------------------------------------------------------------------------- */

type Pt = { x: number; y: number };
export interface Obstacle extends Pt { r: number }

/** Distance from p to the segment a–b. */
function segDist(p: Pt, a: Pt, b: Pt) {
  const dx = b.x - a.x, dy = b.y - a.y;
  const len2 = dx * dx + dy * dy;
  const t = len2 ? Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / len2)) : 0;
  return Math.hypot(p.x - (a.x + t * dx), p.y - (a.y + t * dy));
}

/** The first thing in the way when a puddle of radius R glides from a to b. */
export function blocker(a: Pt, b: Pt, R: number, others: Obstacle[]) {
  return others.find((o) => segDist(o, a, b) < R + o.r + 8) ?? null;
}

/**
 * A waypoint beside the thing in the way, so the puddle glides round it (the demonstration never shows a bump), or null
 * when neither side is clear inside the field.
 */
export function detour(a: Pt, b: Pt, R: number, others: Obstacle[], f: Rect): Pt | null {
  const o = blocker(a, b, R, others);
  if (!o) return null;
  const dx = b.x - a.x, dy = b.y - a.y;
  const len = Math.hypot(dx, dy) || 1;
  const nx = -dy / len, ny = dx / len;
  const ways: Pt[] = [];
  for (const k of [1, -1]) for (const extra of [20, 60, 120]) {
    const d = R + o.r + extra;
    ways.push({ x: o.x + nx * d * k, y: o.y + ny * d * k });
  }
  const inside = (p: Pt) => p.x >= f.x0 && p.x <= f.x1 && p.y >= f.y0 && p.y <= f.y1;
  return ways.find((w) => inside(w) && !blocker(a, w, R, others) && !blocker(w, b, R, others)) ?? null;
}
