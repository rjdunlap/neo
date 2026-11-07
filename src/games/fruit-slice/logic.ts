import type { PropKind } from '../../art/props';
import type { Rng } from '../../engine/random';
import type { View } from '../../engine/view';
import type { BandLevels } from '../../progress/difficulty';

/** Rules for Fruit Slice: the arcs, the swept slice, what a cut counts as, the still boards of levels 7–9 and level 10's twos and threes. */

export type Kind = PropKind;
export const FRUIT: Kind[] = ['apple', 'orange', 'lemon', 'pear', 'blueberries', 'grapes', 'strawberry', 'banana', 'plum'];
/** Beach things nobody would call a fruit (no tomato, no nut). */
export const NOT_FRUIT: Kind[] = ['balloon', 'flower', 'beachball', 'shell'];
export const isFruit = (k: Kind) => FRUIT.includes(k);

/** The hit circle's radius: the drawn fruit (about 110 across) plus 20. */
export const HIT_R = 75;
/** From level 2 a stroke has to travel this far inside a fruit's circle to cut it. */
export const MIN_TRAVEL = 30;
/** A line ended this close to where it started is taken back, for free. */
export const LINE_CANCEL = 40;
/** The shortest straight line the boards are built around. */
export const MIN_LINE = 150;

/** The round's look, seeded; decoration only, never a rule. */
export type Mood = 'morning' | 'picnic' | 'sunset';
export const MOODS: Mood[] = ['morning', 'picnic', 'sunset'];

export type Mode = 'touch' | 'swipe' | 'kind' | 'fruit' | 'enough' | 'two' | 'line' | 'pieces' | 'cover' | 'mixed';

export interface Plan {
  id: number;
  name: string;
  mode: Mode;
  /** Fruit in the air at once. */
  aloft: number;
  /** Slices in the round (levels 1–4), signs (5, 6, 8, 10) or boards (7, 9). */
  count: number;
}

const PLANS: Plan[] = [
  { id: 1, name: 'Touch the fruit', mode: 'touch', aloft: 1, count: 6 },
  { id: 2, name: 'Swipe across', mode: 'swipe', aloft: 2, count: 8 },
  { id: 3, name: 'Only the apples', mode: 'kind', aloft: 3, count: 6 },
  { id: 4, name: 'Only fruit', mode: 'fruit', aloft: 3, count: 6 },
  { id: 5, name: 'Just enough', mode: 'enough', aloft: 3, count: 3 },
  { id: 6, name: 'Two kinds, two numbers', mode: 'two', aloft: 3, count: 3 },
  { id: 7, name: 'One straight swipe', mode: 'line', aloft: 0, count: 4 },
  { id: 8, name: 'Pieces by twos', mode: 'pieces', aloft: 3, count: 3 },
  { id: 9, name: 'Two lines clear it', mode: 'cover', aloft: 0, count: 4 },
  { id: 10, name: 'Twos and threes', mode: 'mixed', aloft: 3, count: 3 },
];

export const LEVELS: BandLevels = {
  toddler: { min: 1, max: 2 },
  preschool: { min: 2, max: 4 },
  prek: { min: 3, max: 6 },
  school: { min: 5, max: 10 },
};

export function planFor(level: number): Plan {
  return PLANS.find((p) => p.id === level) ?? PLANS[0];
}

/* ---------------------------------------------------------------------------------------------- */
/* Signs: what a round asks for                                                                   */
/* ---------------------------------------------------------------------------------------------- */

export interface Row { kind: Kind | null; n: number; cut: number }

/** What one sign (or the whole round, at 1–4) asks for. A row with no kind takes any fruit. */
export interface Sign {
  rows: Row[];
  /** Each cut fruit makes this many pieces (2 at level 8); 0 at level 10, where each kind makes its own (`piecesOf`). */
  per: number;
  /** This sign is a still board cut with the straight line (level 8's last). */
  board: boolean;
}

/** The round's signs, in order: one for levels 1–4 and 7's boards are separate (`boardsFor`). */
export function signsFor(plan: Plan, rng: Rng): Sign[] {
  const one = (kind: Kind | null, n: number, per = 1, board = false): Sign => ({ rows: [{ kind, n, cut: 0 }], per, board });
  switch (plan.mode) {
    case 'touch':
    case 'swipe':
    case 'fruit':
      return [one(null, plan.count)];
    case 'kind':
      return [one(rng.pick(FRUIT), plan.count)];
    case 'enough':
      return [3, 4, rng.int(5, 6)].map((n) => one(null, n));
    case 'two':
      return [0, 1, 2].map(() => {
        const [a, b] = rng.shuffle([...FRUIT]).slice(0, 2);
        return { rows: [{ kind: a, n: rng.int(1, 4), cut: 0 }, { kind: b, n: rng.int(1, 4), cut: 0 }], per: 1, board: false };
      });
    case 'pieces':
      return [one(null, 6, 2), one(null, 8, 2), one(null, rng.pick([10, 12]), 2, true)];
    case 'mixed':
      return [7, 9, rng.int(10, 12)].map((n) => one(null, n, 0));
    case 'line':
    case 'cover':
      return [];
  }
}

/** Pieces (or fruit) still wanted on a sign. */
export const left = (s: Sign) => s.rows.reduce((a, r) => a + (r.n - r.cut), 0);
export const met = (s: Sign) => s.rows.every((r) => r.cut >= r.n);
/** The bowl's count so far, in pieces. */
export const inBowl = (s: Sign) => s.rows.reduce((a, r) => a + r.cut, 0);

export type Refusal = 'not-kind' | 'not-fruit' | 'full' | 'row-done';

/* ---------------------------------------------------------------------------------------------- */
/* Level 10: twos and threes                                                                      */
/* ---------------------------------------------------------------------------------------------- */

/** The two fruit of level 10: an apple cuts into 2 pieces, an orange into 3 wedges. */
export const MIXED: Kind[] = ['apple', 'orange'];
const PIECES: Partial<Record<Kind, number>> = { apple: 2, orange: 3 };
export const piecesOf = (kind: Kind) => PIECES[kind] ?? 2;
/** The pieces one cut of this kind adds to this sign. */
export const piecesFor = (sign: Sign, kind: Kind) => sign.per || piecesOf(kind);
/** Pieces still to make can be made from twos and threes: anything but exactly one. */
export const finishable = (rest: number) => rest >= 0 && rest !== 1;
/** Level 10's dead end: one piece left, which no fruit makes. She puts a fruit back (free). */
export const stuck = (sign: Sign) => sign.per === 0 && left(sign) === 1;

/** Put back the fruit at `index` of the bowl: its pieces leave the count, exactly. Returns the kind put back. */
export function putBack(sign: Sign, bowl: Kind[], index: number): Kind | null {
  const k = bowl[index];
  if (k === undefined) return null;
  bowl.splice(index, 1);
  sign.rows[0].cut -= piecesFor(sign, k);
  return k;
}

/** Level 10's next step from here: a kind to cut, a bowl fruit to put back, or the send. */
export type MixedStep = { cut: Kind } | { back: number } | { send: true };

/**
 * The hint's step at level 10: send a met bowl; from one piece short, put back an apple (then one orange finishes) or
 * else an orange (then two apples); otherwise cut an orange when what is left stays finishable, or else an apple.
 */
export function mixedHint(sign: Sign, bowl: Kind[]): MixedStep {
  const rest = left(sign);
  if (rest === 0) return { send: true };
  if (rest === 1) {
    const apple = bowl.lastIndexOf('apple');
    return { back: apple >= 0 ? apple : bowl.length - 1 };
  }
  return { cut: finishable(rest - piecesOf('orange')) ? 'orange' : 'apple' };
}

/** Whether cutting this kind now keeps the sign reachable without a put-back. */
export const keeps = (sign: Sign, kind: Kind) => finishable(left(sign) - piecesFor(sign, kind));

/** Whether a cut of this kind would count toward the sign now, and if not, why. Levels 1–2 never refuse. */
export function judge(plan: Plan, sign: Sign, kind: Kind): { ok: true; row: number } | { ok: false; why: Refusal } {
  if (plan.mode === 'touch' || plan.mode === 'swipe') return { ok: true, row: 0 };
  if (!isFruit(kind)) return { ok: false, why: 'not-fruit' };
  if (met(sign)) return { ok: false, why: 'full' };
  const rows = sign.rows;
  if (rows.length === 1 && rows[0].kind === null) {
    // Pieces: a cut that would pass the sign is refused like a full bowl.
    if (rows[0].cut + piecesFor(sign, kind) > rows[0].n) return { ok: false, why: 'full' };
    return { ok: true, row: 0 };
  }
  const i = rows.findIndex((r) => r.kind === kind);
  if (i < 0) return { ok: false, why: 'not-kind' };
  if (rows[i].cut >= rows[i].n) return { ok: false, why: 'row-done' };
  return { ok: true, row: i };
}

/** Whether this kind would be cut right now. */
export const wanted = (plan: Plan, sign: Sign, kind: Kind) => judge(plan, sign, kind).ok;

/**
 * Judge the fruit one stroke crosses, in the order it reached them: right ones are cut until the sign is met, the rest
 * bounce, and the whole stroke counts at most one miss. `missed` carries over between calls for a stroke cut as it goes.
 * At level 10 a slice while one piece short bounces for free: the way on is a put-back, not a better cut.
 */
export function judgeStroke(plan: Plan, sign: Sign, kinds: Kind[], missed = false): { cut: boolean[]; reasons: (Refusal | null)[]; miss: boolean } {
  const cut: boolean[] = [];
  const reasons: (Refusal | null)[] = [];
  let miss = false;
  for (const k of kinds) {
    const j = judge(plan, sign, k);
    if (j.ok) {
      sign.rows[j.row].cut += piecesFor(sign, k);
      cut.push(true);
      reasons.push(null);
    } else {
      cut.push(false);
      reasons.push(j.why);
      if (!missed && !miss && !stuck(sign)) miss = true;
    }
  }
  return { cut, reasons, miss: plan.mode === 'touch' || plan.mode === 'swipe' ? false : miss };
}

/* ---------------------------------------------------------------------------------------------- */
/* What gets tossed                                                                               */
/* ---------------------------------------------------------------------------------------------- */

/**
 * The next kind to toss, given what is in the air. A right one always comes when none is aloft, so a choice exists
 * within the next toss and no round can stall; at 3 and 6 a wrong one comes when every one aloft is right.
 */
export function nextKind(plan: Plan, sign: Sign, aloft: Kind[], rng: Rng, index: number): Kind {
  const right = aloft.filter((k) => wanted(plan, sign, k));
  const fruitAny = () => rng.pick(FRUIT);
  switch (plan.mode) {
    case 'touch':
    case 'swipe':
      return FRUIT[index % FRUIT.length];
    case 'kind': {
      const k = sign.rows[0].kind!;
      if (!right.length) return k;
      const others = FRUIT.filter((f) => f !== k);
      if (right.length === aloft.length) return rng.pick(others);
      return rng.chance(0.4) ? k : rng.pick(others);
    }
    case 'fruit':
      if (aloft.some((k) => !isFruit(k)) || !right.length) return fruitAny();
      return rng.chance(0.45) ? rng.pick(NOT_FRUIT) : fruitAny();
    case 'two': {
      const need = sign.rows.filter((r) => r.cut < r.n).map((r) => r.kind!);
      if (!need.length) return fruitAny();
      if (!right.length) return rng.pick(need);
      const others = FRUIT.filter((f) => !sign.rows.some((r) => r.kind === f));
      if (right.length === aloft.length) return rng.pick(others);
      return rng.chance(0.35) ? rng.pick(others) : rng.pick(need);
    }
    case 'mixed': {
      // A kind that keeps the sign reachable comes when none aloft does; otherwise apples and oranges mix.
      const good = MIXED.filter((k) => keeps(sign, k));
      if (good.length && !aloft.some((k) => keeps(sign, k))) return rng.pick(good);
      return rng.pick(MIXED);
    }
    default:
      return fruitAny();
  }
}

/* ---------------------------------------------------------------------------------------------- */
/* Arcs                                                                                           */
/* ---------------------------------------------------------------------------------------------- */

export const RISE = 1.0;
export const HANG = 1.8;
export const FALL = 1.2;
export const FLIGHT = RISE + HANG + FALL;
/** How far a fruit drifts sideways and bobs while it hangs: together under 40 units from its apex. */
const DRIFT = 26;
const BOB = 14;
/** Seconds between one toss landing and the next from that column. */
export const GAP = 0.5;

/** One toss, in view fractions so a turned screen needs no new tosses. */
export interface Toss {
  kind: Kind;
  column: number;
  /** Apex, as fractions of the view. */
  ax: number;
  ay: number;
  /** Which way it drifts while it hangs (−1 or 1). */
  side: number;
}

/** Where the basket sits: bottom middle. */
export const basketAt = (v: View) => ({ x: v.w / 2, y: v.h - 70 });
/** The bowl beside the basket (bottom right of it), the send button at 5, 6 and 8. */
export const bowlAt = (v: View) => ({ x: v.w / 2 + 230, y: v.h - 80 });
export const BOWL_R = 80;
/** Level 10's bowl strip: one token per fruit in the bowl (at most six, since a sign is at most 12 and an apple makes 2). */
export const STRIP_MAX = 6;
/** A token's square, hit area included. */
export const TOKEN = 104;
const TOKEN_PITCH = 114;
/**
 * The token slots: one row right-aligned above the bowl, clear of the bowl's tap area below, the hanging fruit's hit
 * circles above (at most half the view down) and the corner guide at the bottom left.
 */
export function tokenAt(v: View, i: number): Pt {
  const first = v.w - 70 - (STRIP_MAX - 1) * TOKEN_PITCH;
  return { x: first + i * TOKEN_PITCH, y: v.h - 80 - BOWL_R - 20 - 4 - TOKEN / 2 };
}
/** The sign: top right. */
export const signAt = (v: View) => ({ x: v.w - 110, y: 110 });
export const SIGN_W = 160;

/** The columns fruit hang in, as fractions of the view's width. */
const COLUMNS: Record<number, number[]> = { 1: [0.5], 2: [0.36, 0.64], 3: [0.28, 0.5, 0.72] };

export function makeToss(kind: Kind, column: number, aloft: number, rng: Rng): Toss {
  const cols = COLUMNS[aloft] ?? COLUMNS[3];
  return { kind, column, ax: cols[column] + rng.range(-0.012, 0.012), ay: rng.range(0.27, 0.5), side: rng.chance(0.5) ? -1 : 1 };
}

const smooth = (k: number) => k * k * (3 - 2 * k);

/** A toss's position `t` seconds after it left the basket; null once it is back in. */
export function arcAt(toss: Toss, t: number, v: View): { x: number; y: number } | null {
  if (t < 0 || t > FLIGHT) return null;
  const b = basketAt(v);
  const ax = toss.ax * v.w, ay = toss.ay * v.h;
  if (t < RISE) {
    const k = t / RISE;
    // A thrown arc: fast out of the basket, slowing to the top.
    const up = 1 - (1 - k) * (1 - k);
    return { x: b.x + (ax - b.x) * smooth(k), y: b.y + (ay - b.y) * up };
  }
  if (t < RISE + HANG) {
    const k = (t - RISE) / HANG;
    return { x: ax + toss.side * DRIFT * smooth(k), y: ay + BOB * Math.sin(Math.PI * k) };
  }
  const k = (t - RISE - HANG) / FALL;
  const sx = ax + toss.side * DRIFT, sy = ay;
  return { x: sx + (b.x - sx) * smooth(k), y: sy + (b.y - sy) * k * k };
}

/** Seconds of its flight a toss stays within 40 units of its apex. */
export function hangTime(toss: Toss, v: View, step = 0.01): number {
  const ax = toss.ax * v.w, ay = toss.ay * v.h;
  let n = 0;
  for (let t = 0; t <= FLIGHT; t += step) {
    const p = arcAt(toss, t, v)!;
    if (Math.hypot(p.x - ax, p.y - ay) <= 40) n++;
  }
  return n * step;
}

export const hanging = (t: number) => t >= RISE && t <= RISE + HANG;

/* ---------------------------------------------------------------------------------------------- */
/* Geometry                                                                                       */
/* ---------------------------------------------------------------------------------------------- */

export interface Pt { x: number; y: number }

export function distToSegment(p: Pt, a: Pt, b: Pt): number {
  const dx = b.x - a.x, dy = b.y - a.y;
  const len2 = dx * dx + dy * dy;
  const t = len2 ? Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / len2)) : 0;
  return Math.hypot(p.x - (a.x + t * dx), p.y - (a.y + t * dy));
}

/** How much of segment a→b lies inside the circle (c, r). */
export function insideLength(a: Pt, b: Pt, c: Pt, r = HIT_R): number {
  const dx = b.x - a.x, dy = b.y - a.y;
  const len = Math.hypot(dx, dy);
  if (!len) return 0;
  const ux = dx / len, uy = dy / len;
  const fx = a.x - c.x, fy = a.y - c.y;
  const proj = fx * ux + fy * uy;
  const d2 = fx * fx + fy * fy - proj * proj;
  if (d2 >= r * r) return 0;
  const half = Math.sqrt(r * r - d2);
  const t0 = Math.max(0, -proj - half), t1 = Math.min(len, -proj + half);
  return Math.max(0, t1 - t0);
}

/** Which circles segment a→b touches, as indexes in the order the segment reaches them. */
export function sliceHits(a: Pt, b: Pt, fruits: Pt[], r = HIT_R): number[] {
  const len = Math.hypot(b.x - a.x, b.y - a.y) || 1;
  return fruits
    .map((c, i) => ({ i, d: distToSegment(c, a, b), along: ((c.x - a.x) * (b.x - a.x) + (c.y - a.y) * (b.y - a.y)) / len }))
    .filter((h) => h.d < r)
    .sort((p, q) => p.along - q.along)
    .map((h) => h.i);
}

/** The straight line's hits: every circle it crosses, from its start. */
export const lineHits = sliceHits;

/* ---------------------------------------------------------------------------------------------- */
/* Still boards (level 7, and level 8's last sign)                                                */
/* ---------------------------------------------------------------------------------------------- */

/** The box a board is laid out in, in logical units: it fits every view (the view is never under 1024×768) and is only moved, never scaled, so a line's count cannot change. */
export const BOARD_W = 820;
export const BOARD_H = 400;
const BOARD_TOP = 175;
export const boardOrigin = (v: View) => ({ x: (v.w - BOARD_W) / 2, y: BOARD_TOP + Math.max(0, (v.h - 768) / 3) });

export interface Line { a: Pt; b: Pt }
export interface Board {
  /** Fruit centers, in board units (0..BOARD_W, 0..BOARD_H). */
  fruit: Pt[];
  kinds: Kind[];
  /** Level 7: the count the sign asks for. Level 8: 0 (the sign is in pieces). Level 9: 2, the lines. */
  n: number;
  /** A line through exactly `n` (level 7), or one through each pair (level 8). */
  hint: Line;
  pairs?: Line[];
}

const INSET = 80;
const insideBox = (p: Pt) => p.x >= 0 && p.x <= BOARD_W && p.y >= 0 && p.y <= BOARD_H;

/** Candidate lines over a board: through every pair of fruit (and a little beside), and through each fruit at several angles, each clipped to the box. */
export function candidateLines(fruit: Pt[]): Line[] {
  const out: Line[] = [];
  const add = (p: Pt, ux: number, uy: number) => {
    const l = clipToBox(p, ux, uy);
    if (l && Math.hypot(l.b.x - l.a.x, l.b.y - l.a.y) >= MIN_LINE) out.push(l);
  };
  for (let i = 0; i < fruit.length; i++) {
    for (let j = i + 1; j < fruit.length; j++) {
      const dx = fruit[j].x - fruit[i].x, dy = fruit[j].y - fruit[i].y, len = Math.hypot(dx, dy);
      const ux = dx / len, uy = dy / len;
      for (const off of [-50, -25, 0, 25, 50]) add({ x: fruit[i].x - uy * off, y: fruit[i].y + ux * off }, ux, uy);
    }
    for (let a = 0; a < 8; a++) add(fruit[i], Math.cos((a * Math.PI) / 8), Math.sin((a * Math.PI) / 8));
  }
  return out;
}

/** The line through p along (ux, uy), from box edge to box edge, pulled in 10 units. */
function clipToBox(p: Pt, ux: number, uy: number): Line | null {
  let lo = -Infinity, hi = Infinity;
  const lim = (pos: number, d: number, max: number) => {
    if (Math.abs(d) < 1e-9) return pos >= 0 && pos <= max;
    const t0 = (0 - pos) / d, t1 = (max - pos) / d;
    lo = Math.max(lo, Math.min(t0, t1));
    hi = Math.min(hi, Math.max(t0, t1));
    return true;
  };
  if (!lim(p.x, ux, BOARD_W) || !lim(p.y, uy, BOARD_H) || hi - lo < 20) return null;
  lo += 10;
  hi -= 10;
  return { a: { x: p.x + ux * lo, y: p.y + uy * lo }, b: { x: p.x + ux * hi, y: p.y + uy * hi } };
}

/** The tidy hint line: a segment through exactly the given fruit, reaching 100 units past the end ones, inside the box. */
function throughOnly(fruit: Pt[], ids: number[]): Line | null {
  const ps = ids.map((i) => fruit[i]);
  if (ps.length === 1) {
    for (let a = 0; a < 8; a++) {
      const ux = Math.cos((a * Math.PI) / 8), uy = Math.sin((a * Math.PI) / 8);
      const l = { a: { x: ps[0].x - ux * 100, y: ps[0].y - uy * 100 }, b: { x: ps[0].x + ux * 100, y: ps[0].y + uy * 100 } };
      if (insideBox(l.a) && insideBox(l.b) && sameSet(lineHits(l.a, l.b, fruit), ids)) return l;
    }
    return null;
  }
  // Ends: the two fruit farthest apart.
  let best: [Pt, Pt] = [ps[0], ps[1]], far = -1;
  for (const p of ps) for (const q of ps) { const d = Math.hypot(p.x - q.x, p.y - q.y); if (d > far) { far = d; best = [p, q]; } }
  const [p, q] = best;
  const ux = (q.x - p.x) / far, uy = (q.y - p.y) / far;
  for (const reach of [100, 70, 40]) {
    const l = { a: { x: p.x - ux * reach, y: p.y - uy * reach }, b: { x: q.x + ux * reach, y: q.y + uy * reach } };
    if (insideBox(l.a) && insideBox(l.b) && sameSet(lineHits(l.a, l.b, fruit), ids)) return l;
  }
  return null;
}

const sameSet = (a: number[], b: number[]) => a.length === b.length && a.every((x) => b.includes(x));

/** Counts some straight line over the board can cross. */
export function reachableCounts(fruit: Pt[]): Set<number> {
  return new Set(candidateLines(fruit).map((l) => lineHits(l.a, l.b, fruit).length));
}

function scatter(n: number, rng: Rng, spacing: number): Pt[] | null {
  const pts: Pt[] = [];
  for (let tries = 0; pts.length < n && tries < 400; tries++) {
    const p = { x: rng.range(INSET, BOARD_W - INSET), y: rng.range(INSET, BOARD_H - INSET) };
    if (pts.every((q) => Math.hypot(p.x - q.x, p.y - q.y) >= spacing)) pts.push(p);
  }
  return pts.length === n ? pts : null;
}

/** Level 7's boards: four to six still fruit; some line crosses exactly N, another N − 1, and (below 4, where the box has room) another N + 1. */
export function boardsFor(rng: Rng, ns = [2, 3, 3, 4]): Board[] {
  return ns.map((n) => {
    for (let attempt = 0; attempt < 400; attempt++) {
      const count = rng.int(Math.max(4, n + 1), 6);
      // Seed a line of N first, so the answer is a real one and not an accident.
      const fruit = seededRow(n, count, rng);
      if (!fruit) continue;
      const counts = reachableCounts(fruit);
      if (!counts.has(n) || !counts.has(n - 1) || (n < 4 && !counts.has(n + 1))) continue;
      const hint = hintLineFor(fruit, n);
      if (!hint) continue;
      return { fruit, kinds: fruit.map(() => rng.pick(FRUIT)), n, hint };
    }
    throw new Error(`no board for ${n}`);
  });
}

/** N fruit along one straight row, then the rest scattered off it. */
function seededRow(n: number, count: number, rng: Rng): Pt[] | null {
  const ang = rng.range(-0.5, 0.5);
  const ux = Math.cos(ang), uy = Math.sin(ang);
  const step = rng.range(160, 185);
  const span = step * (n - 1);
  const cx = rng.range(INSET + (span * Math.abs(ux)) / 2, BOARD_W - INSET - (span * Math.abs(ux)) / 2);
  const cy = rng.range(INSET + (span * Math.abs(uy)) / 2, BOARD_H - INSET - (span * Math.abs(uy)) / 2);
  const pts: Pt[] = [];
  for (let i = 0; i < n; i++) {
    const t = (i - (n - 1) / 2) * step;
    const p = { x: cx + ux * t, y: cy + uy * t };
    if (p.x < INSET || p.x > BOARD_W - INSET || p.y < INSET || p.y > BOARD_H - INSET) return null;
    pts.push(p);
  }
  for (let tries = 0; pts.length < count && tries < 300; tries++) {
    const p = { x: rng.range(INSET, BOARD_W - INSET), y: rng.range(INSET, BOARD_H - INSET) };
    if (pts.some((q) => Math.hypot(p.x - q.x, p.y - q.y) < 160)) continue;
    pts.push(p);
  }
  return pts.length === count ? pts : null;
}

/** A line through exactly n fruit, the hint's dashed line and the bot's stroke. */
export function hintLineFor(fruit: Pt[], n: number, cut: boolean[] = []): Line | null {
  const live = fruit.map((_, i) => i).filter((i) => !cut[i]);
  const pts = live.map((i) => fruit[i]);
  // Prefer the tidy line through exactly those fruit; else any candidate with the count.
  for (const l of candidateLines(pts)) {
    const hits = lineHits(l.a, l.b, pts);
    if (hits.length !== n) continue;
    return throughOnly(pts, hits) ?? l;
  }
  return null;
}

/** Level 8's last sign: three pairs of fruit; a line through each pair crosses only those two. */
export function pairBoard(rng: Rng, pairs = 3): Board {
  for (let attempt = 0; attempt < 400; attempt++) {
    const centers = scatter(pairs, rng, 250);
    if (!centers) continue;
    const fruit: Pt[] = [];
    const lines: Line[] = [];
    for (const c of centers) {
      const ang = rng.range(-0.6, 0.6);
      const ux = Math.cos(ang) * 82, uy = Math.sin(ang) * 82;
      fruit.push({ x: c.x - ux, y: c.y - uy }, { x: c.x + ux, y: c.y + uy });
    }
    if (fruit.some((p) => p.x < 60 || p.x > BOARD_W - 60 || p.y < 60 || p.y > BOARD_H - 60)) continue;
    let ok = true;
    for (let k = 0; k < pairs && ok; k++) {
      const l = throughOnly(fruit, [2 * k, 2 * k + 1]);
      if (!l) ok = false;
      else lines.push(l);
    }
    if (!ok) continue;
    return { fruit, kinds: fruit.map(() => rng.pick(FRUIT)), n: 0, hint: lines[0], pairs: lines };
  }
  throw new Error('no pair board');
}

/** The pair-board line to cut next: the first pair still whole that does not pass the sign, else one fruit alone. */
export function pairHint(board: Board, cut: boolean[], room: number): Line | null {
  if (room >= 4) {
    for (let k = 0; k < (board.pairs?.length ?? 0); k++) if (!cut[2 * k] && !cut[2 * k + 1]) return board.pairs![k];
  }
  const i = board.fruit.findIndex((_, j) => !cut[j]);
  if (i < 0) return null;
  return throughOnly(board.fruit.map((p, j) => (cut[j] ? { x: -9999, y: -9999 } : p)), [i]);
}

/* ---------------------------------------------------------------------------------------------- */
/* Level 9: two lines clear the board                                                             */
/* ---------------------------------------------------------------------------------------------- */

/**
 * Level 9's line pool: `candidateLines` plus, along each pair's direction, the line down the middle of every strip
 * of fruit up to one hit circle wide, so a leftover any hand line could clear is one the check also clears.
 */
export function coverLines(pts: Pt[]): Line[] {
  const out = candidateLines(pts);
  const strips: Line[] = [];
  for (let i = 0; i < pts.length; i++) {
    for (let j = i + 1; j < pts.length; j++) {
      const dx = pts[j].x - pts[i].x, dy = pts[j].y - pts[i].y, len = Math.hypot(dx, dy);
      const ux = dx / len, uy = dy / len;
      const offs = pts.map((p) => (p.x - pts[i].x) * -uy + (p.y - pts[i].y) * ux);
      for (const lo of offs) {
        const inStrip = offs.filter((o) => o >= lo && o <= lo + 2 * HIT_R - 0.5);
        const mid = (lo + Math.max(...inStrip)) / 2;
        const l = clipToBox({ x: pts[i].x - uy * mid, y: pts[i].y + ux * mid }, ux, uy);
        if (l && Math.hypot(l.b.x - l.a.x, l.b.y - l.a.y) >= MIN_LINE) strips.push(l);
      }
    }
  }
  // The narrowest strip lies along a pair's direction, so these find every line a hand could draw; the roomier lines come first.
  return [...out, ...strips];
}

const liveOf = (fruit: Pt[], cut: boolean[]) => fruit.map((_, i) => i).filter((i) => !cut[i]);

/** The one straight line that cuts every fruit still whole, or null when no line can (the early check). */
export function clearingLine(fruit: Pt[], cut: boolean[]): Line | null {
  const live = liveOf(fruit, cut);
  if (!live.length) return null;
  const pts = live.map((i) => fruit[i]);
  // The leftovers' own lines and the whole board's, so a line placed by fruit already cut still counts; the one
  // passing closest to every fruit's middle wins, so the glow plainly crosses each.
  let best: Line | null = null, bestOff = Infinity;
  for (const l of [...coverLines(pts), ...coverLines(fruit)]) {
    const hits = lineHits(l.a, l.b, pts);
    if (hits.length !== pts.length) continue;
    const tidy = throughOnly(pts, hits) ?? l;
    const off = farthest(tidy, pts);
    if (off < bestOff) [best, bestOff] = [tidy, off];
  }
  return best;
}

/** How far the line passes from the middle of the fruit it is farthest from. */
const farthest = (l: Line, pts: Pt[]) => Math.max(...pts.map((p) => distToSegment(p, l.a, l.b)));

/** Whether one more straight line can cut every fruit still whole. */
export const oneLineClears = (fruit: Pt[], cut: boolean[]) => liveOf(fruit, cut).length === 0 || clearingLine(fruit, cut) !== null;

export type CoverStep = 'cleared' | 'more' | 'stuck';

/**
 * Judge a line that cut `hits` (indexes into `fruit`), the `used`th line on the board: every fruit cut clears it; a
 * first line whose leftovers no single line can reach, or a second that leaves any, is stuck (the board resets).
 */
export function coverStep(fruit: Pt[], cutBefore: boolean[], hits: number[], used: number): CoverStep {
  const after = fruit.map((_, i) => !!cutBefore[i] || hits.includes(i));
  if (after.every(Boolean)) return 'cleared';
  if (used >= 2) return 'stuck';
  return oneLineClears(fruit, after) ? 'more' : 'stuck';
}

/** The line to glow (and the bot's stroke): a cover's first line on a whole board, else the line that clears the rest. */
export function coverHint(fruit: Pt[], cut: boolean[]): Line | null {
  if (cut.some(Boolean)) return clearingLine(fruit, cut);
  // Lines passing near the middle of every fruit they cut first, then the most fruit, then the closest.
  const lines = coverLines(fruit)
    .map((l) => {
      const hits = lineHits(l.a, l.b, fruit);
      const tidy = throughOnly(fruit, hits) ?? l;
      return { tidy, hits, off: farthest(tidy, hits.map((i) => fruit[i])) };
    })
    .filter((c) => c.hits.length && c.hits.length < fruit.length)
    .sort((p, q) => Number(p.off > HIT_R / 2) - Number(q.off > HIT_R / 2) || q.hits.length - p.hits.length || p.off - q.off);
  for (const { tidy, hits } of lines) if (clearingLine(fruit, fruit.map((_, i) => hits.includes(i)))) return tidy;
  return null;
}

/** The narrowest strip, over many directions, that holds every fruit: wider than a hit circle, so no line at all clears the board. */
export function stripWidth(fruit: Pt[]): number {
  let best = Infinity;
  for (let a = 0; a < 90; a++) {
    const ang = (a * Math.PI) / 90;
    const offs = fruit.map((p) => -p.x * Math.sin(ang) + p.y * Math.cos(ang));
    best = Math.min(best, Math.max(...offs) - Math.min(...offs));
  }
  return best;
}

/** Level 9's rows per board: three and two first, then four to six. */
export const COVER_ROWS: [number, number][] = [[3, 2], [2, 2], [3, 2], [3, 3]];

/** Level 9's boards: two seeded rows (crossing or apart, fruit at least 160 apart) that two lines clear and one cannot. */
export function coverBoardsFor(rng: Rng, rows = COVER_ROWS): Board[] {
  return rows.map(([a, b]) => {
    for (let attempt = 0; attempt < 3000; attempt++) {
      const first = seededRow(a, a, rng);
      const second = first && seededRow(b, b, rng);
      if (!first || !second) continue;
      const fruit = [...first, ...second];
      if (fruit.some((p, i) => fruit.some((q, j) => j > i && Math.hypot(p.x - q.x, p.y - q.y) < 160))) continue;
      if (stripWidth(fruit) < 2 * HIT_R + 20) continue;
      if (coverLines(fruit).some((l) => lineHits(l.a, l.b, fruit).length === fruit.length)) continue;
      const hint = coverHint(fruit, []);
      if (!hint) continue;
      const order = rng.shuffle(fruit.map((_, i) => i));
      const mixed = order.map((i) => fruit[i]);
      return { fruit: mixed, kinds: mixed.map(() => rng.pick(FRUIT)), n: 2, hint: coverHint(mixed, [])! };
    }
    throw new Error(`no two-line board for ${a}+${b}`);
  });
}
