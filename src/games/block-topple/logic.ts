import type { Rng } from '../../engine/random';
import type { View } from '../../engine/view';
import type { BandLevels } from '../../progress/difficulty';

/**
 * Block Topple, after Angry Birds and Crush the Castle with no enemies: pull a springy sling back, let go, and a soft ball
 * arcs into a block tower; a push high enough tips the top onto a cushion. Everything here is a closed-form toy model
 * (docs/definitions/block-topple.md): a ballistic flight under slow toy gravity, a box contact test, and one tipping rule.
 * Board units are on-screen logical units (the board is never scaled); y grows downward; time is in seconds.
 */

export const BOARD_W = 860;
export const BOARD_H = 600;
/** The grass line. */
export const GRASS = 500;
/** Where the ball rests in the sling. */
export const SLING = { x: 230, y: 400 } as const;
export const BALL_R = 30;
/** The rope net at the board's right edge: a ball that reaches it went over. */
export const NET_X = BOARD_W;
/** A toppled part comes to rest before this x, in front of the net. */
export const FALL_MAX = 840;
/** Bouncy Launch's pull: the pull that counts at all, and the strongest. */
export const MIN_PULL = 30;
export const MAX_PULL = 170;
/** Launch angles, in degrees above the horizontal toward the stacks. */
export const MIN_ANGLE = 10;
export const MAX_ANGLE = 75;
/** Launch speed per unit of pull, and toy gravity (slow, so the arc is easy to watch). */
export const SPEED = 6;
export const G = 1600;
/** The sleeping friend's box on a stack's top block, for contact: hitting the friend pushes at the top of the block. */
export const TARGET_W = 80;
export const TARGET_H = 70;
/** The grab circle round the resting ball. */
export const GRAB_R = 70;

export interface Pull {
  /** Degrees above the horizontal. */
  angle: number;
  /** Units of finger travel. */
  length: number;
}

export interface Pt {
  x: number;
  y: number;
}

/** A block in board units: x0..x1 across, y0 (top) to y1 (bottom). */
export interface Block {
  x0: number;
  x1: number;
  y0: number;
  y1: number;
  color: BlockColor;
}

export const FRIENDS = ['bunny', 'bear', 'duck', 'pig', 'cat'] as const;
export type Friend = (typeof FRIENDS)[number];
export const BLOCK_COLORS = ['red', 'orange', 'yellow', 'green', 'blue', 'purple'] as const;
export type BlockColor = (typeof BLOCK_COLORS)[number];

export interface Stack {
  /** Bottom block first; each rests on the one below. */
  blocks: Block[];
  friend: Friend;
  /** Level 5: the blocks (indices) with a fruit on the front face. Decoration only: no flight ever reads it. */
  fruit?: number[];
}

/** A green mound between the sling and the stacks, treated as a box from `top` down to the grass. */
export interface Hill {
  x0: number;
  x1: number;
  top: number;
}

export interface Line {
  stacks: Stack[];
  hill: Hill | null;
}

/** For each stack, how many of its blocks still stand (the rest tipped onto its cushion, with the friend). */
export type Standing = number[];
export const allStanding = (line: Line): Standing => line.stacks.map((s) => s.blocks.length);
/** A stack still holds its friend while none of it has tipped. */
export const holdsFriend = (line: Line, standing: Standing, i: number) => standing[i] === line.stacks[i].blocks.length;

export type Contact =
  | { kind: 'block'; stack: number; block: number; /** How high above the grass the push lands. */ h: number; t: number; x: number; y: number }
  | { kind: 'hill' | 'grass' | 'net'; t: number; x: number; y: number };

export type Outcome =
  | { kind: 'tip'; stack: number; from: number }
  | { kind: 'thump'; stack: number; block: number }
  /** A stack whose friend is already on the cushion: nothing to do there, never a miss. */
  | { kind: 'spent'; stack: number }
  | { kind: 'short' | 'over' | 'hill' };

export interface Flight {
  pull: Pull;
  contact: Contact;
  outcome: Outcome;
}

const DEG = Math.PI / 180;
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

/** A finger's pull from where it touched the ball (`dx`, `dy` in board units, y down) as a launch: reversed, and clamped. */
export function pullFrom(dx: number, dy: number): Pull | null {
  const length = Math.hypot(dx, dy);
  if (length < MIN_PULL) return null;
  // The launch goes opposite the pull: pulling left and down throws right and up.
  return { angle: clamp(Math.atan2(dy, -dx) / DEG, MIN_ANGLE, MAX_ANGLE), length: Math.min(length, MAX_PULL) };
}

/** Where the ball sits while pulled: the clamped pull, drawn back from the sling. */
export function pulledBall(pull: Pull): Pt {
  return { x: SLING.x - Math.cos(pull.angle * DEG) * pull.length, y: SLING.y + Math.sin(pull.angle * DEG) * pull.length };
}

/** The launch velocity, units per second (y down). */
export function launch(pull: Pull): { vx: number; vy: number } {
  const a = clamp(pull.angle, MIN_ANGLE, MAX_ANGLE) * DEG;
  const v = SPEED * clamp(pull.length, MIN_PULL, MAX_PULL);
  return { vx: v * Math.cos(a), vy: -v * Math.sin(a) };
}

/** The ball's centre `t` seconds after letting go (before contact). */
export function positionAt(pull: Pull, t: number): Pt {
  const { vx, vy } = launch(pull);
  return { x: SLING.x + vx * t, y: SLING.y + vy * t + (G * t * t) / 2 };
}

/** The times (ascending) at which the centre's height equals `c`, if any. */
function rootsAt(vy: number, c: number): [number, number] | null {
  // G/2 t² + vy t + (SLING.y − c) = 0
  const a = G / 2;
  const b = vy;
  const k = SLING.y - c;
  const disc = b * b - 4 * a * k;
  if (disc < 0) return null;
  const s = Math.sqrt(disc);
  return [(-b - s) / (2 * a), (-b + s) / (2 * a)];
}

/**
 * The first time the ball's centre enters the box grown by the ball's radius (the ball touches the box), or null. The
 * corners are square: a toy contact that a child cannot tell from a round one. x is linear in t and y is quadratic, so the
 * entry is solved exactly.
 */
export function entryTime(pull: Pull, box: { x0: number; x1: number; y0: number; y1: number }): number | null {
  const { vx, vy } = launch(pull);
  const X0 = box.x0 - BALL_R;
  const X1 = box.x1 + BALL_R;
  const Y0 = box.y0 - BALL_R;
  const Y1 = box.y1 + BALL_R;
  // vx > 0 always (angles stay under 90°).
  const tx0 = Math.max(0, (X0 - SLING.x) / vx);
  const tx1 = (X1 - SLING.x) / vx;
  if (tx1 < tx0) return null;
  // y ≤ Y1 inside [r0, r1]; y < Y0 inside (s0, s1). Feasible y: [r0, s0] ∪ [s1, r1].
  const r = rootsAt(vy, Y1);
  if (!r) return null;
  const s = rootsAt(vy, Y0);
  const parts: [number, number][] = s ? [[r[0], Math.min(r[1], s[0])], [Math.max(r[0], s[1]), r[1]]] : [[r[0], r[1]]];
  let best: number | null = null;
  for (const [lo, hi] of parts) {
    if (hi < lo) continue;
    const a = Math.max(lo, tx0);
    const b = Math.min(hi, tx1);
    if (a <= b && (best === null || a < best)) best = a;
  }
  return best;
}

/** The box a stack's friend fills on its top block. */
export function targetBox(stack: Stack, standing: number) {
  const top = stack.blocks[standing - 1];
  const cx = (top.x0 + top.x1) / 2;
  return { x0: cx - TARGET_W / 2, x1: cx + TARGET_W / 2, y0: top.y0 - TARGET_H, y1: top.y0 };
}

/** The first thing the ball touches: a standing block (or a friend on top), the hill, the grass or the net. */
export function contactOf(line: Line, pull: Pull, standing: Standing = allStanding(line)): Contact {
  const hits: Contact[] = [];
  const at = (t: number) => positionAt(pull, t);
  line.stacks.forEach((stack, i) => {
    for (let k = 0; k < standing[i]; k++) {
      const b = stack.blocks[k];
      const t = entryTime(pull, b);
      if (t === null) continue;
      const p = at(t);
      // The push lands where the ball meets the block: level with its centre on a side, or the top on the top face.
      const y = clamp(p.y, b.y0, b.y1);
      hits.push({ kind: 'block', stack: i, block: k, h: GRASS - y, t, ...p });
    }
    if (holdsFriend(line, standing, i)) {
      const t = entryTime(pull, targetBox(stack, standing[i]));
      const top = standing[i] - 1;
      if (t !== null) hits.push({ kind: 'block', stack: i, block: top, h: GRASS - stack.blocks[top].y0, t, ...at(t) });
    }
  });
  if (line.hill) {
    const t = entryTime(pull, { x0: line.hill.x0, x1: line.hill.x1, y0: line.hill.top, y1: GRASS });
    if (t !== null) hits.push({ kind: 'hill', t, ...at(t) });
  }
  const { vx, vy } = launch(pull);
  const grass = rootsAt(vy, GRASS - BALL_R);
  if (grass) hits.push({ kind: 'grass', t: grass[1], ...at(grass[1]) });
  const tn = (NET_X - BALL_R - SLING.x) / vx;
  hits.push({ kind: 'net', t: tn, ...at(tn) });
  return hits.reduce((a, b) => (b.t < a.t ? b : a));
}

/** The base of block `k`, as a height above the grass. */
export const baseOf = (stack: Stack, k: number) => GRASS - stack.blocks[k].y1;
export const widthOf = (stack: Stack, k: number) => stack.blocks[k].x1 - stack.blocks[k].x0;

/**
 * The tipping rule, the whole of it: a push at height `h` on block `k` tips the part from block `j` up, where `j` is the
 * lowest block at or below `k` that the push is at least as high above as that block is wide. Null is a thump.
 */
export function tips(stack: Stack, block: number, h: number): number | null {
  for (let j = 0; j <= block; j++) if (h - baseOf(stack, j) >= widthOf(stack, j)) return j;
  return null;
}

/** The lowest push that tips anything: the golden band's bottom edge, as a height above the grass. */
export function tipLine(stack: Stack): number {
  return Math.min(...stack.blocks.map((_, j) => baseOf(stack, j) + widthOf(stack, j)));
}

/** What one shot does. */
export function flight(line: Line, pull: Pull, standing: Standing = allStanding(line)): Flight {
  const contact = contactOf(line, pull, standing);
  return { pull, contact, outcome: outcomeOf(line, contact, standing) };
}

function outcomeOf(line: Line, c: Contact, standing: Standing): Outcome {
  if (c.kind === 'block') {
    if (!holdsFriend(line, standing, c.stack)) return { kind: 'spent', stack: c.stack };
    const from = tips(line.stacks[c.stack], c.block, c.h);
    return from === null ? { kind: 'thump', stack: c.stack, block: c.block } : { kind: 'tip', stack: c.stack, from };
  }
  if (c.kind === 'hill') return { kind: 'hill' };
  if (c.kind === 'net') return { kind: 'over' };
  const waiting = line.stacks.filter((_, i) => holdsFriend(line, standing, i));
  const nearest = Math.min(...waiting.map((s) => s.blocks[0].x0));
  return { kind: c.x < nearest ? 'short' : 'over' };
}

/** Short, over and the hill are misses (from level 2); a thump or a spent stack never is. */
export const isMiss = (o: Outcome) => o.kind === 'short' || o.kind === 'over' || o.kind === 'hill';

/** Whether the pull tips a stack that still holds its friend (only `stack`, if given). */
export function works(line: Line, pull: Pull, standing: Standing = allStanding(line), stack?: number): boolean {
  const o = flight(line, pull, standing).outcome;
  return o.kind === 'tip' && (stack === undefined || o.stack === stack);
}

/** The pull grid: 1° by 2 units over the whole range. */
export const ANGLES = Array.from({ length: MAX_ANGLE - MIN_ANGLE + 1 }, (_, i) => MIN_ANGLE + i);
export const LENGTHS = Array.from({ length: (MAX_PULL - MIN_PULL) / 2 + 1 }, (_, i) => MIN_PULL + i * 2);

/** Working cells, `[angle index][length index]`. */
export function windows(line: Line, standing: Standing = allStanding(line), stack?: number): boolean[][] {
  return ANGLES.map((angle) => LENGTHS.map((length) => works(line, { angle, length }, standing, stack)));
}

export const share = (grid: boolean[][]) => grid.flat().filter(Boolean).length / (ANGLES.length * LENGTHS.length);

/** A rectangle of grid cells, inclusive: angle indices a0..a1, length indices l0..l1. */
export interface Window {
  a0: number;
  a1: number;
  l0: number;
  l1: number;
}
/** A window's size: degrees across and units of pull. */
export const windowSize = (w: Window) => ({ degrees: w.a1 - w.a0, units: (w.l1 - w.l0) * 2 });

/** The largest all-working rectangle (by cells), or null when nothing works. */
export function largestWindow(grid: boolean[][]): Window | null {
  const cols = LENGTHS.length;
  const heights = new Array<number>(cols).fill(0);
  let best: Window | null = null;
  let bestArea = 0;
  for (let a = 0; a < grid.length; a++) {
    for (let l = 0; l < cols; l++) heights[l] = grid[a][l] ? heights[l] + 1 : 0;
    // The largest rectangle under the histogram ending at row `a`.
    const st: number[] = [];
    for (let l = 0; l <= cols; l++) {
      const hh = l < cols ? heights[l] : 0;
      while (st.length && heights[st[st.length - 1]] >= hh) {
        const top = st.pop()!;
        const left = st.length ? st[st.length - 1] + 1 : 0;
        const area = heights[top] * (l - left);
        if (area > bestArea) {
          bestArea = area;
          best = { a0: a - heights[top] + 1, a1: a, l0: left, l1: l - 1 };
        }
      }
      st.push(l);
    }
  }
  return best;
}

/** Whether a window is at least `degrees` by `units`. */
export const fits = (w: Window | null, degrees: number, units: number) => !!w && windowSize(w).degrees >= degrees && windowSize(w).units >= units;

/** The pull at the centre of the largest working window: a shot that keeps working when nudged. */
export function solve(line: Line, standing: Standing = allStanding(line), stack?: number): Pull | null {
  const w = largestWindow(windows(line, standing, stack));
  if (!w) return null;
  return { angle: ANGLES[Math.round((w.a0 + w.a1) / 2)], length: LENGTHS[Math.round((w.l0 + w.l1) / 2)] };
}

/** The working grid pull nearest `pull`, with 1° counting as 2 units of pull. */
export function nearestWorking(line: Line, pull: Pull, standing: Standing = allStanding(line)): Pull | null {
  const grid = windows(line, standing);
  let best: Pull | null = null;
  let bestD = Infinity;
  grid.forEach((row, a) =>
    row.forEach((ok, l) => {
      if (!ok) return;
      const d = (2 * (ANGLES[a] - pull.angle)) ** 2 + (LENGTHS[l] - pull.length) ** 2;
      if (d < bestD) {
        bestD = d;
        best = { angle: ANGLES[a], length: LENGTHS[l] };
      }
    }),
  );
  return best;
}

/** Points along a pull's arc up to its first contact, every `step` seconds, ending at the contact. */
export function arc(line: Line, pull: Pull, standing: Standing = allStanding(line), step = 1 / 30): Pt[] {
  const end = contactOf(line, pull, standing).t;
  const pts: Pt[] = [];
  for (let t = 0; t < end; t += step) pts.push(positionAt(pull, t));
  pts.push(positionAt(pull, end));
  return pts;
}

/** Where a tipped part comes to rest: lying on its side past the far bottom edge of block `from`, and how tall it was. */
export function fallFootprint(stack: Stack, from: number) {
  const b = stack.blocks[from];
  const top = stack.blocks[stack.blocks.length - 1];
  const length = b.y1 - top.y0;
  const thick = Math.max(...stack.blocks.slice(from).map((k) => k.x1 - k.x0));
  return { x0: b.x1, x1: b.x1 + length, y0: GRASS - thick, y1: GRASS };
}

// ---- Levels ----

export type PlanKind = 'close' | 'far' | 'hill' | 'high' | 'count';
export interface Plan {
  kind: PlanKind;
  name: string;
  lines: number;
  /** Misses count from level 2; level 1's short and over shots are free. */
  counts: boolean;
  /** The last flight stays as a faint dotted trail. */
  trail: boolean;
}

export const PLANS: Plan[] = [
  { kind: 'close', name: 'Big and close: pull back and let go to tip a big tower', lines: 3, counts: false, trail: false },
  { kind: 'far', name: 'Farther: how hard to pull, from the last arc', lines: 3, counts: true, trail: true },
  { kind: 'hill', name: 'Over the hill: aim high enough to clear it', lines: 3, counts: true, trail: true },
  { kind: 'high', name: 'Hit it high: a short wide stack only tips from a bump high up', lines: 3, counts: true, trail: true },
  { kind: 'count', name: 'Count the basket: tip each stack, then count the fruit in the tray', lines: 3, counts: true, trail: true },
];

/** Level 5 (counting the fruit tray) is school only (docs/definitions/block-topple.md). */
export const LEVELS: BandLevels = {
  preschool: { min: 1, max: 2 },
  prek: { min: 1, max: 4 },
  school: { min: 2, max: 5 },
};
/** Level 5's stacks are level 4's: the same authored line, seeded shapes and filter. */
const shapeOf = (plan: Plan): Exclude<PlanKind, 'count'> => (plan.kind === 'count' ? 'high' : plan.kind);
export const planFor = (level: number): Plan => PLANS[Math.min(PLANS.length, Math.max(1, Math.round(level))) - 1];

const BLOCK_H = 100;
function tower(x0: number, width: number, count: number, friend: Friend, colors: BlockColor[]): Stack {
  return {
    friend,
    blocks: Array.from({ length: count }, (_, k) => ({ x0, x1: x0 + width, y0: GRASS - BLOCK_H * (k + 1), y1: GRASS - BLOCK_H * k, color: colors[k % colors.length] })),
  };
}

/**
 * Level 4's short wide stack: a 150-wide base with a 100-wide block centred on top, 200 high in all. Only a push at
 * least 150 high (the top block's upper half, or the friend) tips it; lower hits thump.
 */
export const WIDE_BASE = 150;
function wideStack(x0: number, friend: Friend, colors: BlockColor[]): Stack {
  const inset = (WIDE_BASE - BLOCK_H) / 2;
  return {
    friend,
    blocks: [
      { x0, x1: x0 + WIDE_BASE, y0: GRASS - BLOCK_H, y1: GRASS, color: colors[0] },
      { x0: x0 + inset, x1: x0 + inset + BLOCK_H, y0: GRASS - 2 * BLOCK_H, y1: GRASS - BLOCK_H, color: colors[1] },
    ],
  };
}
/** Level 4's left edges: the wide stack's base and the tall tower's, so every fall ends inside the portrait view. */
export const WIDE_X = { min: 400, max: 460 };
export const TALL_X = { min: 380, max: 410 };
/** At level 4, at least this share of the pulls that reach a wide stack only thump it. */
export const MIN_THUMP_SHARE = 0.2;

/** The level 1 tower's left edge, for level 2's "farther" rule. */
export const CLOSE_X = { min: 380, max: 400 };
export const FAR_GAP = 120;
export const HILL_X = { x0: 360, x1: 460 };
export const HILL_TOP = GRASS - 110;

/** The first line of each round, as the definition describes it. */
export function authoredLine(plan: Plan): Line {
  if (plan.kind === 'count') {
    const line = authoredLine(PLANS[3]);
    return { ...line, stacks: [{ ...line.stacks[0], fruit: [0, 1] }] };
  }
  switch (plan.kind) {
    case 'close':
      return { stacks: [tower(390, 140, 3, 'bunny', ['blue', 'yellow', 'red'])], hill: null };
    case 'far':
      return { stacks: [tower(530, 100, 2, 'bear', ['green', 'orange'])], hill: null };
    case 'hill':
      return { stacks: [tower(540, 100, 2, 'duck', ['purple', 'yellow'])], hill: { x0: HILL_X.x0, x1: HILL_X.x1, top: HILL_TOP } };
    case 'high':
      return { stacks: [wideStack(430, 'pig', ['orange', 'blue'])], hill: null };
  }
}

function seededLine(plan: Plan, rng: Rng, shape: number): Line {
  const colors = () => rng.shuffle(BLOCK_COLORS.slice()).slice(0, 3);
  const friend = rng.pick(FRIENDS);
  switch (shapeOf(plan)) {
    case 'close':
      return { stacks: [tower(rng.int(CLOSE_X.min, CLOSE_X.max), 140, 3, friend, colors())], hill: null };
    case 'far':
      return { stacks: [tower(rng.int(CLOSE_X.max + FAR_GAP, 540), 100, 2, friend, colors())], hill: null };
    case 'hill': {
      const shift = rng.int(-10, 10);
      return { stacks: [tower(rng.int(520, 550), 100, 2, friend, colors())], hill: { x0: HILL_X.x0 + shift, x1: HILL_X.x1 + shift, top: HILL_TOP } };
    }
    case 'high':
      // Two shapes by line: a tall thin tower (only its first block thumps), then another short wide stack.
      return shape % 2 === 1
        ? { stacks: [tower(rng.int(TALL_X.min, TALL_X.max), 100, 3, friend, colors())], hill: null }
        : { stacks: [wideStack(rng.int(WIDE_X.min, WIDE_X.max), friend, colors())], hill: null };
  }
}

/** Of the grid pulls whose first contact is a stack, the share that only thump it. */
export function thumpShare(line: Line): number {
  let reach = 0;
  let thump = 0;
  for (const angle of ANGLES)
    for (const length of LENGTHS) {
      const o = flight(line, { angle, length }).outcome;
      if (o.kind === 'tip' || o.kind === 'thump') reach++;
      if (o.kind === 'thump') thump++;
    }
  return reach ? thump / reach : 0;
}

/** Whether a line meets its plan's filter (the table in the definition). */
export function meetsPlan(plan: Plan, line: Line): boolean {
  if (line.stacks.some((s, i) => fallFootprint(s, 0).x1 > FALL_MAX || line.stacks.some((o, j) => j !== i && overlapsX(fallFootprint(s, 0), o.blocks[0])))) return false;
  const grid = windows(line);
  const w = largestWindow(grid);
  switch (shapeOf(plan)) {
    case 'close':
      return fits(w, 20, 30) && share(grid) >= 0.25;
    case 'far':
      return line.stacks[0].blocks[0].x0 >= CLOSE_X.max + FAR_GAP && !works(line, { angle: 45, length: 60 }) && flight(line, { angle: 45, length: 60 }).outcome.kind === 'short' && LENGTHS.some((length) => length > 60 && works(line, { angle: 45, length })) && fits(w, 8, 20);
    case 'hill':
      return flatPullsBlocked(line) && fits(w, 8, 20);
    case 'high':
      return fits(w, 8, 20) && (line.stacks[0].blocks.length > 2 || thumpShare(line) >= MIN_THUMP_SHARE);
  }
}

/** Level 3: every pull flatter than 20° meets the hill or falls short. */
export function flatPullsBlocked(line: Line): boolean {
  for (const angle of ANGLES.filter((a) => a < 20))
    for (const length of LENGTHS) {
      const k = flight(line, { angle, length }).outcome.kind;
      if (k !== 'hill' && k !== 'short') return false;
    }
  return true;
}

const overlapsX = (a: { x0: number; x1: number }, b: { x0: number; x1: number }) => a.x0 < b.x1 && b.x0 < a.x1;

export const MAX_TRIES = 50;
/** A seeded line that meets its plan (`shape` picks level 4's stack: odd a tall tower, even a wide stack), or (never needed, a test checks) the authored one. */
export function makeLine(plan: Plan, rng: Rng, shape = 0): { line: Line; fallback: boolean } {
  for (let i = 0; i < MAX_TRIES; i++) {
    const line = seededLine(plan, rng, shape);
    if (meetsPlan(plan, line)) return { line, fallback: false };
  }
  return { line: authoredLine(plan), fallback: true };
}

/** A round's lines: the authored first line, then seeded ones (with their fruit at level 5). */
export function roundLines(level: number, rng: Rng): Line[] {
  const plan = planFor(level);
  const lines = [authoredLine(plan), ...Array.from({ length: plan.lines - 1 }, (_, i) => makeLine(plan, rng, i + 1).line)];
  if (plan.kind !== 'count') return lines;
  return [lines[0], ...lines.slice(1).map((line) => withFruit(line, rng))];
}

// ---- Level 5: the fruit tray ----

/** At most this many fruit in the tray, one per slot. */
export const TRAY_SLOTS = 8;
/** A round's running totals end in this range. */
export const BASKET_TOTAL = { min: 4, max: 8 };

/** 1 to 3 fruit on a seeded stack, at most one per block: the short wide stack holds 1–2, the tall tower 1–3. */
export function withFruit(line: Line, rng: Rng): Line {
  return {
    ...line,
    stacks: line.stacks.map((s) => {
      const n = rng.int(1, s.blocks.length);
      const fruit = rng.shuffle(s.blocks.map((_, k) => k)).slice(0, n).sort((a, b) => a - b);
      return { ...s, fruit };
    }),
  };
}

/** The fruit on a line, as stack and block indices. */
export const fruitOn = (line: Line): { stack: number; block: number }[] =>
  line.stacks.flatMap((s, stack) => (s.fruit ?? []).map((block) => ({ stack, block })));

/** The tray's running total once line `i` has tipped. */
export const basketAfter = (lines: Line[], i: number) => lines.slice(0, i + 1).reduce((n, l) => n + fruitOn(l).length, 0);

/** Three pads: the total and its neighbours, never below 1 (a total of 1 shows 1, 2, 3), in a seeded order. */
export function countPads(total: number, rng: Rng): number[] {
  const lo = Math.max(1, total - 1);
  return rng.shuffle([lo, lo + 1, lo + 2]);
}

/** The woven tray in the soil below the grass, board units, and where fruit `k` of line-group `group` sits (its centre). */
export const TRAY = { x0: 300, x1: 800, y0: 515, y1: 585 } as const;
const SLOT = 60;
const GROUP_GAP = 10;
export function trayLayout() {
  return {
    ...TRAY,
    slot: (k: number, group: number): Pt => ({ x: TRAY.x0 + SLOT / 2 + k * SLOT + group * GROUP_GAP, y: (TRAY.y0 + TRAY.y1) / 2 }),
    slotR: SLOT / 2 - 4,
  };
}

/** The three number pads, top left of the sky: 110 square with 10 between. */
export const PAD = 110;
export function padLayout(): { x0: number; y0: number; x1: number; y1: number }[] {
  return [0, 1, 2].map((k) => ({ x0: 50 + k * (PAD + 10), y0: 20, x1: 50 + k * (PAD + 10) + PAD, y1: 20 + PAD }));
}

// ---- Layout ----

/** The board's top-left in the view: centred across, below the shell's corner buttons. Never scaled. */
export function boardLayout(v: View): Pt {
  return { x: (v.w - BOARD_W) / 2, y: Math.max(130, (v.h - BOARD_H) / 2) };
}
