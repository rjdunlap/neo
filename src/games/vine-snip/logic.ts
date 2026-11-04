import type { Rng } from '../../engine/random';
import type { View } from '../../engine/view';

/**
 * Vine Snip's rules (docs/definitions/vine-snip.md): taut vines, a pendulum and a falling arc, all closed-form so every
 * frame and landing is a formula a test can check. A toy model: slow gravity, the small-swing beat at every amplitude, no air.
 * Lengths are board units (the board is 720 × 600, never scaled, so board units are logical units); time is seconds.
 */

export const BOARD_W = 720;
export const BOARD_H = 600;
/** The branch the vines hang from. */
export const ANCHOR_Y = 40;
/** Where the friends' mouths are. */
export const MOUTH_Y = 470;
/** The big leaf a missed fruit lands on. */
export const LEAF_Y = 560;
/** Toy gravity, units/s²: a 230-unit fall takes about half a second. */
export const G = 1600;
/** A friend's catch band (mouth and paws), centred on the friend. */
export const BAND = 200;
export const FRIEND_MIN = 100;
export const FRIEND_MAX = 620;
/** A stroke shorter than this is a tap. */
export const TAP_TRAVEL = 30;
/** A tap snips the nearest vine within this distance. */
export const TAP_R = 70;
export const FRUIT_R = 48;
/** The shortest snip window a working plan may have, per beat. */
export const MIN_WINDOW = 0.4;
/** Sampling step for windows. */
export const STEP = 1 / 120;

export type Kind = 'apple' | 'orange' | 'lemon' | 'pear';
export type FriendKind = 'bunny' | 'bear' | 'duck' | 'pig' | 'dog' | 'cat';
export const KINDS: readonly Kind[] = ['apple', 'orange', 'lemon', 'pear'];
export const FRIENDS: readonly FriendKind[] = ['bunny', 'bear', 'duck', 'pig', 'dog', 'cat'];

export interface Pt { x: number; y: number }
/** A vine from an anchor on the branch (board x, at `ANCHOR_Y`). */
export interface Vine { ax: number; len: number }
export interface Fruit { kind: Kind; vines: Vine[]; rest: Pt }
export interface Friend { x: number; kind: FriendKind }
export interface Line {
  fruit: Fruit;
  friend: Friend;
  /** Level 3: the fruit starts swinging (from a breeze) at its rest point, which is a turnaround. */
  breeze: boolean;
  /** Levels 1–2: the friend scoots under the falling fruit, so every drop is caught. */
  scoot: boolean;
}

export type Mode = 'snip' | 'two' | 'wait';
export interface Plan { level: number; name: string; mode: Mode; lines: number; /** Whether a missed drop counts. */ counts: boolean }

const PLANS: Plan[] = [
  { level: 1, name: 'Snip!', mode: 'snip', lines: 3, counts: false },
  { level: 2, name: 'Two vines', mode: 'two', lines: 3, counts: false },
  { level: 3, name: 'Wait for the swing', mode: 'wait', lines: 3, counts: true },
];
export const MAX_LEVEL = PLANS.length;

export function planFor(level: number): Plan {
  return PLANS[Math.min(Math.max(1, Math.round(level)), MAX_LEVEL) - 1];
}

/* ---------------------------------------------------------------------------------------------- */
/* Motion                                                                                          */
/* ---------------------------------------------------------------------------------------------- */

/** A pendulum about one anchor, let go from rest at angle `amp` (from straight below) at time `t0`. */
export interface Swing { ax: number; len: number; amp: number; t0: number }

export const beat = (len: number) => 2 * Math.PI * Math.sqrt(len / G);
const omega = (len: number) => Math.sqrt(G / len);

/** The swing a fruit makes about the vine it keeps, starting from rest where it hangs. */
export function swingFrom(rest: Pt, vine: Vine, t0 = 0): Swing {
  return { ax: vine.ax, len: vine.len, amp: Math.atan2(rest.x - vine.ax, rest.y - ANCHOR_Y), t0 };
}

export function angleAt(s: Swing, t: number): number {
  return s.amp * Math.cos(omega(s.len) * (t - s.t0));
}

export function posAt(s: Swing, t: number): Pt {
  const a = angleAt(s, t);
  return { x: s.ax + s.len * Math.sin(a), y: ANCHOR_Y + s.len * Math.cos(a) };
}

/** The velocity along the arc (tangent to it). */
export function velocityAt(s: Swing, t: number): Pt {
  const w = omega(s.len);
  const a = angleAt(s, t);
  const da = -s.amp * w * Math.sin(w * (t - s.t0));
  return { x: s.len * Math.cos(a) * da, y: -s.len * Math.sin(a) * da };
}

/** A falling fruit `s` seconds after it was let go at `p` with velocity `v`. */
export function arcAt(p: Pt, v: Pt, s: number): Pt {
  return { x: p.x + v.x * s, y: p.y + v.y * s + (G * s * s) / 2 };
}

/** Seconds until a fruit let go at `p` with `v` crosses height `y` going down. */
export function fallTime(p: Pt, v: Pt, y: number): number {
  const d = Math.max(0, y - p.y);
  return (v.y + Math.sqrt(v.y * v.y + 2 * G * d)) / G;
}

export interface Landing {
  /** Board x where the arc crosses the mouth line. */
  x: number;
  /** Seconds from the snip to the mouth line. */
  time: number;
  caught: boolean;
  /** For a miss: snipped before the swing came toward the friend, or after it turned back. */
  side: 'early' | 'late' | null;
  from: Pt;
  v: Pt;
}

/**
 * Where a fruit lands when its last vine is snipped at time `t` of swing `s` (or from rest, with no swing), against a friend
 * at `fx`. `early`/`late` are by timing: the half-beat before the swing reaches the friend's side, or the half-beat after.
 */
export function landing(s: Swing | null, t: number, rest: Pt, fx: number): Landing {
  const from = s ? posAt(s, t) : rest;
  const v = s ? velocityAt(s, t) : { x: 0, y: 0 };
  const time = fallTime(from, v, MOUTH_Y);
  const x = from.x + v.x * time;
  const caught = Math.abs(x - fx) <= BAND / 2;
  let side: Landing['side'] = null;
  if (!caught && s && s.amp !== 0) {
    const T = beat(s.len);
    // The friend's-side turnaround: angle sign toward the friend.
    const toward = Math.sign(fx - s.ax) || 1;
    const tau = s.t0 + (Math.sign(s.amp) === toward ? 0 : T / 2);
    let off = (((t - tau) % T) + T) % T;
    if (off >= T / 2) off -= T;
    side = off < 0 || off === -T / 2 ? 'early' : 'late';
  } else if (!caught) side = x < fx ? 'early' : 'late';
  return { x, time, caught, side, from, v };
}

/** Snip times in one beat (from the swing's start) whose landing is caught, as contiguous [from, to] runs (wrapping joined). */
export function windows(s: Swing, fx: number): [number, number][] {
  const T = beat(s.len);
  const n = Math.ceil(T / STEP);
  const ok: boolean[] = [];
  for (let i = 0; i < n; i++) ok.push(landing(s, s.t0 + i * STEP, posAt(s, s.t0), fx).caught);
  const runs: [number, number][] = [];
  let i = 0;
  while (i < n) {
    if (!ok[i]) { i++; continue; }
    let j = i;
    while (j + 1 < n && ok[j + 1]) j++;
    runs.push([i * STEP, (j + 1) * STEP]);
    i = j + 1;
  }
  // Join a run at the end of the beat to one at its start.
  if (runs.length > 1 && runs[0][0] === 0 && Math.abs(runs[runs.length - 1][1] - n * STEP) < 1e-9) {
    const last = runs.pop()!;
    runs[0] = [last[0] - n * STEP, runs[0][1]];
  }
  return runs;
}

export const longest = (runs: [number, number][]) => runs.reduce((m, r) => Math.max(m, r[1] - r[0]), 0);

/** The middle of the longest window, as an offset from the swing's start (0 ≤ t < beat). */
export function bestSnip(s: Swing, fx: number): number | null {
  const runs = windows(s, fx);
  if (!runs.length) return null;
  const r = runs.reduce((a, b) => (b[1] - b[0] > a[1] - a[0] ? b : a));
  const T = beat(s.len);
  return ((((r[0] + r[1]) / 2) % T) + T) % T;
}

/* ---------------------------------------------------------------------------------------------- */
/* Input geometry                                                                                  */
/* ---------------------------------------------------------------------------------------------- */

export function distToSegment(p: Pt, a: Pt, b: Pt): number {
  const dx = b.x - a.x, dy = b.y - a.y;
  const L2 = dx * dx + dy * dy;
  const k = L2 ? Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / L2)) : 0;
  return Math.hypot(p.x - (a.x + k * dx), p.y - (a.y + k * dy));
}

function crosses(a: Pt, b: Pt, c: Pt, d: Pt): boolean {
  const o = (p: Pt, q: Pt, r: Pt) => (q.x - p.x) * (r.y - p.y) - (q.y - p.y) * (r.x - p.x);
  const d1 = o(c, d, a), d2 = o(c, d, b), d3 = o(a, b, c), d4 = o(a, b, d);
  return ((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) && ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0));
}

/** A vine as a segment, from its anchor to where the fruit is now. */
export const vineSeg = (v: Vine, fruit: Pt): [Pt, Pt] => [{ x: v.ax, y: ANCHOR_Y }, fruit];

/** Indexes of the vines a stroke segment a→b crosses. */
export function cutBy(a: Pt, b: Pt, vines: Vine[], fruit: Pt): number[] {
  const out: number[] = [];
  vines.forEach((v, i) => {
    const [p, q] = vineSeg(v, fruit);
    if (crosses(a, b, p, q)) out.push(i);
  });
  return out;
}

/** The vine a tap at `p` snips: the nearest within `TAP_R`, or −1. */
export function nearestVine(p: Pt, vines: Vine[], fruit: Pt): number {
  let best = -1, bd = TAP_R;
  vines.forEach((v, i) => {
    const [a, b] = vineSeg(v, fruit);
    const d = distToSegment(p, a, b);
    if (d <= bd) { bd = d; best = i; }
  });
  return best;
}

/** A point `f` of the way down a vine (0 at the anchor): where a finger reaches it. */
export const alongVine = (v: Vine, fruit: Pt, f: number): Pt => ({ x: v.ax + (fruit.x - v.ax) * f, y: ANCHOR_Y + (fruit.y - ANCHOR_Y) * f });

/* ---------------------------------------------------------------------------------------------- */
/* Lines                                                                                           */
/* ---------------------------------------------------------------------------------------------- */

const at = (ax: number, len: number, angle: number): Pt => ({ x: ax + len * Math.sin(angle), y: ANCHOR_Y + len * Math.cos(angle) });

/** The shared point every vine of a fruit meets; a test asserts each length. */
export function restPoint(f: Fruit): Pt {
  return f.rest;
}

/** The friend centre a fruit's possible landings over a whole beat stay within reach of (levels 1–2), or null. */
function scootCovers(s: Swing, rest: Pt): boolean {
  const T = beat(s.len);
  for (let t = 0; t < T; t += STEP) {
    const l = landing(s, t, rest, 0);
    if (l.x < FRIEND_MIN - BAND / 2 + 10 || l.x > FRIEND_MAX + BAND / 2 - 10) return false;
    const p = posAt(s, t);
    if (p.x < FRUIT_R || p.x > BOARD_W - FRUIT_R) return false;
  }
  return true;
}

/** Level 3: the friend's band centre that gives the longest window, with the opposite turnaround and both bottom crossings missing. */
export function placeFriend(s: Swing): number | null {
  const toward = -Math.sign(s.amp) || 1;
  let best: number | null = null, bw = 0;
  for (let fx = FRIEND_MIN; fx <= FRIEND_MAX; fx += 5) {
    if (Math.sign(fx - s.ax) !== toward || Math.abs(fx - s.ax) < 20) continue;
    if (!level3Fair(s, fx)) continue;
    const w = longest(windows(s, fx));
    if (w > bw) { bw = w; best = fx; }
  }
  return bw >= MIN_WINDOW ? best : null;
}

/** Level 3's promises: a snip at the top of the swing on the friend's side feeds it; one at the opposite turnaround (where it starts) or straight below, either way, misses. */
export function level3Fair(s: Swing, fx: number): boolean {
  const T = beat(s.len);
  const start = posAt(s, s.t0);
  // A snip at the top of the swing over the friend (the turnaround on its side) always feeds it.
  const top = s.ax - s.len * Math.sin(s.amp);
  return Math.abs(top - fx) <= BAND / 2 - 10 && [0, T / 4, (3 * T) / 4].every((k) => !landing(s, s.t0 + k, start, fx).caught);
}

export interface Snips {
  /** Vine indexes she should snip, in order (the last one drops it). */
  order: number[];
  /** For the last snip of a swing: its time from the swing's start. */
  at: number | null;
}

/** The line's working plan: which vines to snip and, on a swing, when. The hint and the ghost finger follow it. */
export function solve(line: Line): Snips {
  const { fruit, friend } = line;
  if (line.breeze) return { order: [0], at: bestSnip(swingFrom(fruit.rest, fruit.vines[0]), friend.x) };
  return { order: fruit.vines.map((_, i) => i), at: null };
}

/** The swing a line starts with (level 3), else null. */
export function startSwing(line: Line): Swing | null {
  return line.breeze ? swingFrom(line.fruit.rest, line.fruit.vines[0]) : null;
}

const BREEZE = (30 * Math.PI) / 180;

function tryLine(plan: Plan, rng: Rng, first: boolean): Line | null {
  const kind = rng.pick(KINDS);
  const fk = rng.pick(FRIENDS);
  if (plan.mode === 'snip') {
    const x = first ? 360 : Math.round(rng.range(180, 540));
    const len = Math.round(rng.range(170, 220));
    return { fruit: { kind: first ? 'apple' : kind, vines: [{ ax: x, len }], rest: { x, y: ANCHOR_Y + len } }, friend: { x, kind: first ? 'bunny' : fk }, breeze: false, scoot: false };
  }
  if (plan.mode === 'two') {
    const d = first ? 140 : Math.round(rng.range(130, 150));
    const h = first ? 210 : Math.round(rng.range(195, 225));
    const cx = first ? 360 : Math.round(rng.range(340, 380));
    const len = Math.round(Math.hypot(d, h) * 1000) / 1000;
    const rest = { x: cx, y: ANCHOR_Y + h };
    const vines = [{ ax: cx - d, len }, { ax: cx + d, len }];
    for (const keep of vines) if (!scootCovers(swingFrom(rest, keep), rest)) return null;
    return { fruit: { kind: first ? 'pear' : kind, vines, rest }, friend: { x: cx, kind: first ? 'bear' : fk }, breeze: false, scoot: true };
  }
  // wait: one vine already swinging, started on the friend's far side.
  const side = first ? 1 : rng.chance(0.5) ? 1 : -1;
  const len = first ? 240 : Math.round(rng.range(220, 260));
  const ax = first ? 300 : Math.round(rng.range(200, 520));
  const rest = at(ax, len, -side * BREEZE);
  const s = swingFrom(rest, { ax, len });
  const fx = placeFriend(s);
  if (fx === null) return null;
  return { fruit: { kind: first ? 'orange' : kind, vines: [{ ax, len }], rest }, friend: { x: fx, kind: first ? 'duck' : fk }, breeze: true, scoot: false };
}

/** The authored line used if 50 tries all fail (a test asserts it is never needed). */
export function fallbackLine(plan: Plan, rng: Rng): Line {
  return tryLine(plan, rng, true)!;
}

export let fallbacksUsed = 0;

/** One line of a round: the first is authored, the rest seeded from the plan. */
export function makeLine(plan: Plan, rng: Rng, index: number): Line {
  if (index === 0) return tryLine(plan, rng, true)!;
  for (let i = 0; i < 50; i++) {
    const l = tryLine(plan, rng, false);
    if (l) return l;
  }
  fallbacksUsed++;
  return fallbackLine(plan, rng);
}

export function linesFor(plan: Plan, rng: Rng): Line[] {
  return Array.from({ length: plan.lines }, (_, i) => makeLine(plan, rng, i));
}

/* ---------------------------------------------------------------------------------------------- */
/* Layout                                                                                          */
/* ---------------------------------------------------------------------------------------------- */

export interface Box { x: number; y: number; w: number; h: number }
/** The corner pet: left of x 150 and the bottom 128 units. */
export const petCorner = (v: View): Box => ({ x: 0, y: v.h - 128, w: 150, h: 128 });
export const CORNER = 120;
export const cornerButtons = (v: View): Box[] => [
  { x: 0, y: 0, w: CORNER, h: CORNER },
  { x: v.w - CORNER, y: 0, w: CORNER, h: CORNER },
];
export const overlaps = (a: Box, b: Box) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
export const GROW = 110;

/** The board's top-left on screen: centred across, below the shell's top buttons. Never scaled. */
export function boardOrigin(v: View): Pt {
  return { x: Math.round((v.w - BOARD_W) / 2), y: Math.round(Math.max(CORNER + 4, (v.h - BOARD_H) / 2)) };
}

/** Grow back's centre on screen: under the top-right corner button, right of the board. */
export const growAt = (v: View): Pt => ({ x: v.w - GROW / 2 - 10, y: CORNER + GROW / 2 + 16 });
/** How far below the mouth line a friend's feet are (on its stump). */
export const FEET_BELOW = 70;
export const FRIEND_H = 190;
