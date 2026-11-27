import type { Rng } from '../../engine/random';
import type { View } from '../../engine/view';
import type { BandLevels } from '../../progress/difficulty';

/**
 * Pond Merge's rules (docs/definitions/pond-merge.md): a small, fixed-step, fully deterministic circle-pile solver. Friends drop
 * into a pond, settle among the others, and two of the same size that touch pop into the next size up. No Pixi, no randomness
 * inside the solver (only `makeRound` uses the seeded RNG), and no physics library. Lengths are board units; the board is
 * never scaled, so board units are logical screen units. `y` grows downward; time is in seconds.
 */

export const LEVELS: BandLevels = { prek: { min: 1, max: 1 }, school: { min: 1, max: 3 } };

// ---- The chain ----

/** Each size's radius and kind. Two of size k that touch become one of size k + 1; the last merges with nothing. */
export const SIZES = [
  { r: 22, name: 'egg' },
  { r: 30, name: 'chick' },
  { r: 40, name: 'duckling' },
  { r: 52, name: 'duck' },
  { r: 66, name: 'goose' },
  { r: 82, name: 'swan' },
] as const;
export const LAST_SIZE = SIZES.length - 1;
const radius = (size: number) => SIZES[size].r;
const mass = (size: number) => SIZES[size].r * SIZES[size].r;

// ---- The pond ----

export const BOARD_W = 420;
export const BOARD_H = 560;
/** The pond's floor, and the line the held friend hangs on. */
export const FLOOR = 540;
export const DROP_Y = 60;
export const GRAVITY = 900;
export const STEP = 1 / 120;
export const RESTITUTION = 0.15;
export const WALL_FRICTION = 0.2;
export const LINEAR_DRAG = 0.6;
export const PUSH_ITERATIONS = 4;
export const STILL_SPEED = 8;
export const STILL_TIME = 0.5;
export const MAX_PIECES = 60;
/** A pile this long above the drop line makes the smallest friends float away. */
export const LIFT_TIME = 1.2;
/** After a drop, the next one is accepted once this long has passed (the dropped friend has fallen clear of the line). */
export const DROP_GAP = 0.35;
/** Closing speeds under this are resting contact and do not bounce. */
const REST_SPEED = 30;
/** The least share of an overlap each of two touching pieces moves by. */
const MIN_GIVE = 0.25;
/** Per step, how much of a downward speed a supported piece keeps. */
const HELD_DAMP = 0.4;
const MERGE_SLACK = 1;
const POP_NUDGE = 40;

export interface Piece {
  id: number;
  size: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  /** Seconds the piece has been slower than STILL_SPEED. */
  calm: number;
}

export interface Pond {
  pieces: Piece[];
  nextId: number;
  /** Seconds since the last drop. */
  sinceDrop: number;
  /** Seconds a still piece has had its top above the drop line. */
  topClock: number;
  goal: number;
  goalHit: boolean;
}

export type PondEvent =
  | { kind: 'merge'; size: number; x: number; y: number }
  | { kind: 'lift'; size: number; count: number }
  | { kind: 'goal' };

export function emptyPond(goal: number): Pond {
  return { pieces: [], nextId: 1, sinceDrop: DROP_GAP, topClock: 0, goal, goalHit: false };
}

export const clonePond = (p: Pond): Pond => ({ ...p, pieces: p.pieces.map((q) => ({ ...q })) });

/** Whether a friend can be dropped now: the last one has fallen clear. */
export const canDrop = (pond: Pond): boolean => pond.sinceDrop >= DROP_GAP;

export const clampX = (size: number, x: number): number =>
  Math.min(BOARD_W - radius(size), Math.max(radius(size), x));

/** Remove every piece of the smallest size present (when sizes differ), as bubbles; null when nothing floats away. */
function lift(pond: Pond): PondEvent | null {
  if (!pond.pieces.length) return null;
  const sizes = pond.pieces.map((p) => p.size);
  const smallest = Math.min(...sizes);
  if (smallest === Math.max(...sizes)) return null;
  const before = pond.pieces.length;
  pond.pieces = pond.pieces.filter((p) => p.size !== smallest);
  return { kind: 'lift', size: smallest, count: before - pond.pieces.length };
}

/** Let a friend go at `x`. A full pond first floats its smallest friends away, so a drop is never refused for room. */
export function drop(pond: Pond, size: number, x: number): PondEvent[] {
  const events: PondEvent[] = [];
  if (pond.pieces.length >= MAX_PIECES) {
    const e = lift(pond);
    if (e) events.push(e);
    else pond.pieces.splice(0, 6);
  }
  pond.pieces.push({ id: pond.nextId++, size, x: clampX(size, x), y: DROP_Y, vx: 0, vy: 0, calm: 0 });
  pond.sinceDrop = 0;
  return events;
}

/** Push a moving piece out of a wall or the floor; it loses speed into the wall and a little along it. */
function against(p: Piece, r: number) {
  const slide = (vt: number, dn: number) =>
    Math.abs(vt) <= WALL_FRICTION * dn ? 0 : vt - Math.sign(vt) * WALL_FRICTION * dn;
  const bounce = (vn: number) => (Math.abs(vn) < REST_SPEED ? 0 : -vn * RESTITUTION);
  if (p.x < r) {
    p.x = r;
    if (p.vx < 0) {
      const dn = -p.vx;
      p.vx = bounce(p.vx);
      p.vy = slide(p.vy, dn);
    }
  } else if (p.x > BOARD_W - r) {
    p.x = BOARD_W - r;
    if (p.vx > 0) {
      const dn = p.vx;
      p.vx = bounce(p.vx);
      p.vy = slide(p.vy, dn);
    }
  }
  if (p.y > FLOOR - r) {
    p.y = FLOOR - r;
    if (p.vy > 0) {
      const dn = p.vy;
      p.vy = bounce(p.vy);
      p.vx = slide(p.vx, dn);
    }
  }
}

/** One fixed step, in a fixed order with no randomness. */
export function step(pond: Pond): PondEvent[] {
  const events: PondEvent[] = [];
  const ps = pond.pieces;
  const damp = 1 - LINEAR_DRAG * STEP;
  for (const p of ps) {
    p.vy += GRAVITY * STEP;
    p.vx *= damp;
    p.vy *= damp;
    p.x += p.vx * STEP;
    p.y += p.vy * STEP;
  }
  // Pieces with something under them: a pile pressing on itself must settle, not keep sinking a little each step.
  const held = new Set<number>();
  for (let it = 0; it < PUSH_ITERATIONS; it++) {
    // Sweeps alternate bottom-up and top-down so a column settles in a few passes.
    const up = it % 2 === 0;
    for (let n = 0; n < ps.length; n++) {
      const i = up ? n : ps.length - 1 - n;
      const a = ps[i];
      const ra = radius(a.size);
      for (let m = n + 1; m < ps.length; m++) {
        const j = up ? m : ps.length - 1 - m;
        const b = ps[j];
        const rb = radius(b.size);
        let dx = b.x - a.x;
        let dy = b.y - a.y;
        const reach = ra + rb;
        if (Math.abs(dx) >= reach || Math.abs(dy) >= reach) continue;
        let d = Math.hypot(dx, dy);
        if (d >= reach) continue;
        if (d < 1e-6) {
          dx = 0.01;
          dy = 0;
          d = 0.01;
        }
        const nx = dx / d;
        const ny = dy / d;
        if (ny > 0.5) held.add(a.id);
        else if (ny < -0.5) held.add(b.id);
        const ma = mass(a.size);
        const mb = mass(b.size);
        const over = reach - d;
        // The lighter piece gives way more, but the heavier one always gives a little, so a small friend under a big one is not crushed.
        const wa = Math.min(1 - MIN_GIVE, Math.max(MIN_GIVE, mb / (ma + mb)));
        a.x -= nx * over * wa;
        a.y -= ny * over * wa;
        b.x += nx * over * (1 - wa);
        b.y += ny * over * (1 - wa);
        const vn = (b.vx - a.vx) * nx + (b.vy - a.vy) * ny;
        if (vn < 0) {
          const e = -vn < REST_SPEED ? 0 : RESTITUTION;
          const jmp = (-(1 + e) * vn) / (1 / ma + 1 / mb);
          a.vx -= (jmp / ma) * nx;
          a.vy -= (jmp / ma) * ny;
          b.vx += (jmp / mb) * nx;
          b.vy += (jmp / mb) * ny;
        }
      }
    }
    for (const p of ps) {
      against(p, radius(p.size));
      if (p.y >= FLOOR - radius(p.size) - 0.01) held.add(p.id);
    }
  }
  for (const p of ps) if (p.vy > 0 && held.has(p.id)) p.vy *= HELD_DAMP;
  // Merge pass: each piece joins at most one merge, the lower id pair first.
  const gone = new Set<number>();
  for (let i = 0; i < ps.length; i++) {
    const a = ps[i];
    if (gone.has(a.id) || a.size >= LAST_SIZE) continue;
    for (let j = i + 1; j < ps.length; j++) {
      const b = ps[j];
      if (gone.has(b.id) || b.size !== a.size) continue;
      if (Math.hypot(b.x - a.x, b.y - a.y) > radius(a.size) + radius(b.size) + MERGE_SLACK) continue;
      const ma = mass(a.size);
      const mb = mass(b.size);
      const m = ma + mb;
      a.x = (a.x * ma + b.x * mb) / m;
      a.y = (a.y * ma + b.y * mb) / m;
      a.vx = (a.vx * ma + b.vx * mb) / m;
      a.vy = (a.vy * ma + b.vy * mb) / m - POP_NUDGE;
      a.size += 1;
      a.calm = 0;
      against(a, radius(a.size));
      gone.add(b.id);
      events.push({ kind: 'merge', size: a.size, x: a.x, y: a.y });
      if (a.size >= pond.goal && !pond.goalHit) {
        pond.goalHit = true;
        events.push({ kind: 'goal' });
      }
      break;
    }
  }
  if (gone.size) pond.pieces = ps.filter((p) => !gone.has(p.id));
  let high = false;
  for (const p of pond.pieces) {
    p.calm = Math.hypot(p.vx, p.vy) < STILL_SPEED ? p.calm + STEP : 0;
    if (p.calm >= STILL_TIME && p.y - radius(p.size) < DROP_Y) high = true;
  }
  pond.topClock = high ? pond.topClock + STEP : 0;
  if (pond.topClock >= LIFT_TIME) {
    pond.topClock = 0;
    const e = lift(pond);
    if (e) events.push(e);
  }
  pond.sinceDrop += STEP;
  return events;
}

export const isStill = (p: Piece): boolean => p.calm >= STILL_TIME;

/** Step until every piece is still (and the drop gap has passed) or `maxSeconds` run out; the events along the way. */
export function settle(pond: Pond, maxSeconds: number): PondEvent[] {
  const events: PondEvent[] = [];
  const steps = Math.ceil(maxSeconds / STEP);
  for (let k = 0; k < steps; k++) {
    events.push(...step(pond));
    if (canDrop(pond) && pond.pieces.every(isStill)) break;
  }
  return events;
}

export const reachedGoal = (pond: Pond, goal: number): boolean => pond.pieces.some((p) => p.size >= goal);

// ---- Hints ----

/** Where a friend dropped at `x` would come to rest: its height and which piece it lands on (0 for the floor). */
function restOn(pond: Pond, size: number, x: number): { y: number; on: number } {
  const r = radius(size);
  let y = FLOOR - r;
  let on = 0;
  for (const p of pond.pieces) {
    const dx = x - p.x;
    const reach = r + radius(p.size);
    if (Math.abs(dx) >= reach) continue;
    const top = p.y - Math.sqrt(reach * reach - dx * dx);
    if (top < y) {
      y = top;
      on = p.id;
    }
  }
  return { y, on };
}

/**
 * The `x` that lands a friend of `size` on a still piece of the same size it can reach (the lowest such), or, when none can
 * be reached, in the lowest spot of the pond (the middle of an empty one). The ghost finger and the Hint button use this rule.
 */
export function hintDrop(pond: Pond, size: number): number {
  const lo = clampX(size, 0);
  const hi = clampX(size, BOARD_W);
  let best: { x: number; y: number } | null = null;
  if (size < LAST_SIZE)
    for (const p of pond.pieces) {
      if (p.size !== size) continue;
      const x = clampX(size, p.x);
      const rest = restOn(pond, size, x);
      if (rest.on !== p.id) continue;
      if (!best || rest.y > best.y) best = { x, y: rest.y };
    }
  if (best) return best.x;
  const mid = BOARD_W / 2;
  let low = { x: mid, y: -Infinity };
  for (let x = lo; x <= hi + 0.001; x += 10) {
    const at = Math.min(x, hi);
    const rest = restOn(pond, size, at);
    // The lowest spot; on level ground, the one nearest the middle.
    if (rest.y > low.y + 0.5 || (rest.y > low.y - 0.5 && Math.abs(at - mid) < Math.abs(low.x - mid)))
      low = { x: at, y: rest.y };
  }
  return low.x;
}

// ---- Levels and rounds ----

export interface Plan {
  level: number;
  name: string;
  /** The sizes that fall, smallest first. */
  dropSet: number[];
  goal: number;
}

const PLANS: Record<number, Omit<Plan, 'level'>> = {
  1: { name: 'Make a duck', dropSet: [0, 1], goal: 3 },
  2: { name: 'Make a goose', dropSet: [0, 1, 2], goal: 4 },
  3: { name: 'Make a swan', dropSet: [0, 1, 2], goal: 5 },
};

export function planFor(level: number): Plan {
  const l = Math.min(3, Math.max(1, Math.round(level) || 1));
  return { level: l, ...PLANS[l], dropSet: [...PLANS[l].dropSet] };
}

export const describeLevel = (level: number): string => planFor(level).name;

export interface Round {
  plan: Plan;
  /** The sizes that fall, in order. */
  items: number[];
  goal: number;
  /** After this many drops in a row with no merge, the ghost drop shows on its own. */
  dropsSoft: number;
}

const BLOCK = 6;
const BLOCKS = 16;

/**
 * The seeded drop sequence, built in blocks of six where every size of the drop set appears an even number of times, so equal
 * neighbours can always be made. The first two are always the smallest size, so a first merge is one drop away.
 */
export function makeRound(plan: Plan, rng: Rng): Round {
  const items: number[] = [];
  for (let b = 0; b < BLOCKS; b++) {
    const block: number[] = [];
    for (const s of plan.dropSet) block.push(s, s);
    while (block.length < BLOCK) {
      const s = plan.dropSet[rng.int(0, plan.dropSet.length - 1)];
      block.push(s, s);
    }
    const mixed = rng.shuffle(block);
    if (b === 0) {
      const small = plan.dropSet[0];
      const rest = mixed.slice();
      for (let k = 0; k < 2; k++) rest.splice(rest.indexOf(small), 1);
      items.push(small, small, ...rest);
    } else items.push(...mixed);
  }
  return { plan, items, goal: plan.goal, dropsSoft: 8 };
}

/** A greedy player: drop each friend where `hintDrop` says and let it settle. Returns the drops used, or null if the items ran out. */
export function playGreedy(round: Round, maxSettle = 3): { drops: number; pond: Pond; lifts: number } | null {
  const pond = emptyPond(round.goal);
  let lifts = 0;
  for (let i = 0; i < round.items.length; i++) {
    const size = round.items[i];
    const events = [...drop(pond, size, hintDrop(pond, size)), ...settle(pond, maxSettle)];
    lifts += events.filter((e) => e.kind === 'lift').length;
    if (pond.goalHit) return { drops: i + 1, pond, lifts };
  }
  return null;
}

/** The most drops the greedy player may need on any seed at each level (measured, then widened); the tests hold it. */
export const MAX_DROPS: Record<number, number> = { 1: 40, 2: 50, 3: 80 };

// ---- Layout ----

export interface PondLayout {
  /** The top-left corner of the unscaled board. */
  board: { x: number; y: number };
  /** Button centres. */
  takeBack: { x: number; y: number };
  hint: { x: number; y: number };
  /** The centre of the first picture of the chain strip, and the step to the next. */
  strip: { x: number; y: number; dx: number; dy: number };
}
export const BUTTON = { w: 130, h: 100 } as const;

/** The board, the two buttons and the chain strip, clear of the top shell buttons and the pet's bottom-left corner. */
export function pondLayout(view: Pick<View, 'w' | 'h' | 'upright'>): PondLayout {
  const cx = view.w / 2;
  if (view.upright) {
    const top = 150 + Math.max(0, Math.min(60, (view.h - 1024) / 4));
    const y = top + BOARD_H + 66;
    return {
      board: { x: cx - BOARD_W / 2, y: top },
      takeBack: { x: cx - 90, y },
      hint: { x: cx + 90, y },
      strip: { x: cx - 125, y: top - 34, dx: 50, dy: 0 },
    };
  }
  const top = 104 + Math.max(0, (view.h - 768) / 4);
  const x = cx - BOARD_W / 2;
  return {
    board: { x, y: top },
    takeBack: { x: x + BOARD_W + 110, y: top + 180 },
    hint: { x: x + BOARD_W + 110, y: top + 320 },
    strip: { x: x - 80, y: top + 60, dx: 0, dy: 80 },
  };
}
