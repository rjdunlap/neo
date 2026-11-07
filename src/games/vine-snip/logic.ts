import type { Rng } from '../../engine/random';
import type { View } from '../../engine/view';
import type { BandLevels } from '../../progress/difficulty';

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
/** A fruit and the friend it is for. */
export interface Pair { fruit: Fruit; friend: Friend }
export interface Line extends Pair {
  /** Level 5: a second fruit for a second friend, on the other side. */
  second?: Pair;
  /** Level 3: the fruit starts swinging (from a breeze) at its rest point, which is a turnaround. */
  breeze: boolean;
  /** Levels 1–2: the friend scoots under the falling fruit, so every drop is caught. */
  scoot: boolean;
}

export type Mode = 'snip' | 'two' | 'wait' | 'keep' | 'pair';
export interface Plan { level: number; name: string; mode: Mode; lines: number; /** Whether a missed drop counts. */ counts: boolean }

const PLANS: Plan[] = [
  { level: 1, name: 'Snip!', mode: 'snip', lines: 3, counts: false },
  { level: 2, name: 'Two vines', mode: 'two', lines: 3, counts: false },
  { level: 3, name: 'Wait for the swing', mode: 'wait', lines: 3, counts: true },
  { level: 4, name: 'Which vine stays?', mode: 'keep', lines: 3, counts: true },
  { level: 5, name: 'Two friends', mode: 'pair', lines: 2, counts: true },
];

export const LEVELS: BandLevels = {
  lap: { min: 1, max: 1 },
  toddler: { min: 1, max: 2 },
  preschool: { min: 1, max: 3 },
  prek: { min: 2, max: 4 },
  school: { min: 3, max: 5 },
};
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

/**
 * The friend's band centre that gives the longest window and keeps `fair` (level 3: the opposite turnaround and both bottom
 * crossings miss). `also`, a costlier check, is tried on the candidates longest window first.
 */
export function placeFriend(s: Swing, fair = (fx: number) => level3Fair(s, fx), also = (_fx: number) => true): number | null {
  const toward = -Math.sign(s.amp) || 1;
  const ok: { fx: number; w: number }[] = [];
  for (let fx = FRIEND_MIN; fx <= FRIEND_MAX; fx += 5) {
    if (Math.sign(fx - s.ax) !== toward || Math.abs(fx - s.ax) < 20) continue;
    if (!fair(fx)) continue;
    const w = longest(windows(s, fx));
    if (w >= MIN_WINDOW) ok.push({ fx, w });
  }
  ok.sort((a, b) => b.w - a.w || a.fx - b.fx);
  return ok.find((c) => also(c.fx))?.fx ?? null;
}

/** Levels 4–5's timing promise on the kept vine: a snip at the top of the swing on the friend's side feeds it, one where it starts misses. */
export function keepTurn(s: Swing, fx: number): boolean {
  const top = s.ax - s.len * Math.sin(s.amp);
  return Math.abs(top - fx) <= BAND / 2 - 10 && !landing(s, s.t0, posAt(s, s.t0), fx).caught;
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

/** Every fruit of a line with its friend (two at level 5). */
export const pairsOf = (line: Line): Pair[] => (line.second ? [line, line.second] : [line]);

/** Levels 4–5: she chooses which vine stays (no breeze, no scooting friend, several vines). */
export const choosesKeep = (line: Line) => !line.breeze && !line.scoot && line.fruit.vines.length >= 2;

/** For each vine of a fruit: the longest snip window per beat if she keeps that one (0 for none). */
export function plans(p: Pair): { keep: number; window: number }[] {
  return p.fruit.vines.map((v, keep) => ({ keep, window: longest(windows(swingFrom(p.fruit.rest, v), p.friend.x)) }));
}

/** The vine to keep for a fruit at levels 4–5 (the first working keep), or −1. */
export function keepFor(p: Pair): number {
  const w = plans(p).find((k) => k.window >= MIN_WINDOW);
  return w ? w.keep : -1;
}

/** A fruit's working plan: which vines to snip and, on a swing, when. The hint and the ghost finger follow it. */
export function solvePair(p: Pair, line: Line): Snips & { keep: number } {
  const { fruit, friend } = p;
  if (line.breeze) return { order: [0], at: bestSnip(swingFrom(fruit.rest, fruit.vines[0]), friend.x), keep: 0 };
  if (!choosesKeep(line)) return { order: fruit.vines.map((_, i) => i), at: null, keep: -1 };
  const keep = keepFor(p);
  return { order: [...fruit.vines.map((_, i) => i).filter((i) => i !== keep), keep], at: bestSnip(swingFrom(fruit.rest, fruit.vines[keep]), friend.x), keep };
}

/** The line's working plan for its first fruit. */
export function solve(line: Line): Snips {
  return solvePair(line, line);
}

/** The swing a line starts with (level 3), else null. */
export function startSwing(line: Line): Swing | null {
  return line.breeze ? swingFrom(line.fruit.rest, line.fruit.vines[0]) : null;
}

const BREEZE = (30 * Math.PI) / 180;

/** Levels 4–5: neighbouring vines (of every fruit in the line) are at least this far apart where a finger reaches them. */
export const KEEP_GAP = 100;
/** Where a finger reaches a vine, as fractions of the way down from the anchor. */
export const REACH = [0.15, 0.3];

/** Every vine of a line with the fruit it holds, for spacing checks. */
const vinesOf = (line: Line) => pairsOf(line).flatMap((p) => p.fruit.vines.map((v) => ({ v, rest: p.fruit.rest })));

/** The smallest distance between two vines of a line where a finger reaches them. */
export function vineGap(line: Line): number {
  const all = vinesOf(line);
  let m = Infinity;
  for (let i = 0; i < all.length; i++) {
    for (let j = i + 1; j < all.length; j++) {
      for (const f of REACH) {
        const p = alongVine(all[i].v, all[i].rest, f), q = alongVine(all[j].v, all[j].rest, f);
        m = Math.min(m, Math.hypot(p.x - q.x, p.y - q.y));
      }
    }
  }
  return m;
}

/** Positions over one beat of every swing a fruit could make (each keep), plus its rest. */
function reach(f: Fruit): Pt[] {
  const out: Pt[] = [f.rest];
  for (const v of f.vines) {
    const s = swingFrom(f.rest, v);
    const T = beat(s.len);
    for (let k = 0; k < 48; k++) out.push(posAt(s, (T * k) / 48));
  }
  return out;
}

/** Every landing a fruit could make (any keep, any moment, or all its vines at once), sampled over a beat. */
function landings(f: Fruit): number[] {
  const out = [landing(null, 0, f.rest, 0).x];
  for (const v of f.vines) {
    const s = swingFrom(f.rest, v);
    const T = beat(s.len);
    for (let t = 0; t < T; t += STEP) out.push(landing(s, t, f.rest, 0).x);
  }
  return out;
}

/**
 * Levels 4–5's promises for one fruit and its friend: exactly one keep has a window of at least 0.4 s (the one on the
 * friend's side), with level 3's fairness on that swing; every other keep, and dropping it from rest, never feeds the friend;
 * every swing stays on the board; and no landing reaches a friend in `others`.
 */
export function keepFair(p: Pair, others: Friend[] = []): boolean {
  const { fruit, friend } = p;
  const ks = plans(p);
  const good = ks.filter((k) => k.window >= MIN_WINDOW);
  if (good.length !== 1 || ks.some((k) => k.window > 0 && k.window < MIN_WINDOW)) return false;
  const kept = fruit.vines[good[0].keep];
  if (Math.sign(kept.ax - fruit.rest.x) !== Math.sign(friend.x - fruit.rest.x)) return false;
  if (!keepTurn(swingFrom(fruit.rest, kept), friend.x)) return false;
  if (landing(null, 0, fruit.rest, friend.x).caught) return false;
  if (reach(fruit).some((q) => q.x < FRUIT_R || q.x > BOARD_W - FRUIT_R)) return false;
  return others.every((o) => landings(fruit).every((x) => Math.abs(x - o.x) > BAND / 2 + 10));
}

/** Level 5: the two fruits' swings never meet each other, nor the other fruit's hanging vines. */
export function apart(a: Fruit, b: Fruit): boolean {
  const ra = reach(a), rb = reach(b);
  for (const p of ra) for (const q of rb) if (Math.hypot(p.x - q.x, p.y - q.y) < 2 * FRUIT_R + 8) return false;
  for (const [mine, other] of [[ra, b], [rb, a]] as const) {
    for (const v of other.vines) {
      const [s, e] = vineSeg(v, other.rest);
      if (mine.some((p) => distToSegment(p, s, e) < FRUIT_R + 8)) return false;
    }
  }
  return true;
}

/** A fruit at `rest` hanging from anchors at these x (each vine taut). */
const hang = (kind: Kind, rest: Pt, xs: number[]): Fruit => ({
  kind, rest, vines: xs.map((ax) => ({ ax, len: Math.round(Math.hypot(rest.x - ax, rest.y - ANCHOR_Y) * 1000) / 1000 })),
});

/** Level 4: one fruit on two or three vines, the friend on `side`; the vine on that side is the one to keep. */
function keepLine(rng: Rng, first: boolean, side: number, kind: Kind, fk: FriendKind): Line | null {
  const three = first || rng.chance(0.4);
  const h = first ? 230 : Math.round(rng.range(200, 250));
  let fruit: Fruit;
  if (three) {
    // Left, straight above (it hangs still) and right, as far apart as the board allows.
    const a = first ? 150 : Math.round(rng.range(146, 156));
    const b = first ? 150 : Math.round(rng.range(146, 156));
    const m = first ? 360 : Math.round(rng.range(48 + 2 * a, BOARD_W - 48 - 2 * b));
    fruit = hang(first ? 'lemon' : kind, { x: m, y: ANCHOR_Y + h }, [m - a, m, m + b]);
  } else {
    const k = Math.round(rng.range(100, 150));
    const o = Math.round(rng.range(100, 150));
    const lo = Math.max(48 + 2 * (side > 0 ? o : k), 0), hi = BOARD_W - 48 - 2 * (side > 0 ? k : o);
    if (lo > hi) return null;
    const x = Math.round(rng.range(lo, hi));
    fruit = hang(kind, { x, y: ANCHOR_Y + h }, side > 0 ? [x - o, x + k] : [x - k, x + o]);
  }
  if (vineGap({ fruit, friend: { x: 0, kind: fk }, breeze: false, scoot: false }) < KEEP_GAP) return null;
  const kept = side > 0 ? fruit.vines[fruit.vines.length - 1] : fruit.vines[0];
  const s = swingFrom(fruit.rest, kept);
  const friend = (x: number): Friend => ({ x, kind: first ? 'pig' : fk });
  const fx = placeFriend(s, (x) => keepTurn(s, x), (x) => keepFair({ fruit, friend: friend(x) }));
  return fx === null ? null : { fruit, friend: friend(fx), breeze: false, scoot: false };
}

/** Level 5: two fruits, each on two vines; the left one keeps its left vine for the left friend, the right one its right. */
function pairLine(rng: Rng, first: boolean, kinds: [Kind, Kind], fks: [FriendKind, FriendKind]): Line | null {
  const highLeft = first || rng.chance(0.5);
  const hi = first ? 190 : Math.round(rng.range(180, 205)), lo = first ? 300 : Math.round(rng.range(290, 320));
  const [hl, hr] = highLeft ? [hi, lo] : [lo, hi];
  // The kept vine leans out toward its friend; the inner one is nearly upright, so keeping it barely swings the fruit.
  const a = first ? 100 : Math.round(rng.range(96, 104)), b = first ? 100 : Math.round(rng.range(96, 104));
  const ia = first ? 50 : Math.round(rng.range(44, 54)), ib = first ? 50 : Math.round(rng.range(44, 54));
  const xl = (first ? 55 : Math.round(rng.range(54, 64))) + 2 * a;
  const xr = BOARD_W - (first ? 55 : Math.round(rng.range(54, 64))) - 2 * b;
  const left = hang(kinds[0], { x: xl, y: ANCHOR_Y + hl }, [xl - a, xl + ia]);
  const right = hang(kinds[1], { x: xr, y: ANCHOR_Y + hr }, [xr - ib, xr + b]);
  const shell: Line = { fruit: left, friend: { x: 0, kind: fks[0] }, second: { fruit: right, friend: { x: 0, kind: fks[1] } }, breeze: false, scoot: false };
  if (vineGap(shell) < KEEP_GAP || !apart(left, right)) return null;
  // Each friend is placed for its own fruit; neither fruit, kept either way, can reach the other friend.
  const sl = swingFrom(left.rest, left.vines[0]), sr = swingFrom(right.rest, right.vines[1]);
  const fr = placeFriend(sr, (x) => keepTurn(sr, x), (x) => keepFair({ fruit: right, friend: { x, kind: fks[1] } }));
  if (fr === null) return null;
  const fl = placeFriend(sl, (x) => keepTurn(sl, x), (x) => keepFair({ fruit: left, friend: { x, kind: fks[0] } }, [{ x: fr, kind: fks[1] }]));
  if (fl === null) return null;
  const line: Line = { fruit: left, friend: { x: fl, kind: fks[0] }, second: { fruit: right, friend: { x: fr, kind: fks[1] } }, breeze: false, scoot: false };
  return keepFair(line.second!, [line.friend]) ? line : null;
}

function tryLine(plan: Plan, rng: Rng, first: boolean, index = 0): Line | null {
  const kind = rng.pick(KINDS);
  const fk = rng.pick(FRIENDS);
  // Level 4: the authored line's friend is on the right, the second line's on the left, the third's seeded.
  if (plan.mode === 'keep') return keepLine(rng, first, index === 0 ? 1 : index === 1 ? -1 : rng.chance(0.5) ? 1 : -1, kind, fk);
  if (plan.mode === 'pair') {
    if (first) return pairLine(rng, true, ['apple', 'apple'], ['dog', 'cat']);
    const other = rng.pick(FRIENDS.filter((f) => f !== fk));
    return pairLine(rng, false, [kind, rng.pick(KINDS)], [fk, other]);
  }
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
    const l = tryLine(plan, rng, false, index);
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
