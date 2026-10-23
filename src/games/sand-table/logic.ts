import type { Rng } from '../../engine/random';
import type { View } from '../../engine/view';

/**
 * Sand Table's rules: an invented, deterministic toy (not a measured angle of repose). A tray of 12 columns between two walls,
 * 48 grains that are always in the bucket, the tray or the spill pail. Nothing is wrong; every tap resolves at once.
 */
export const COLS = 12;
export const RIM = 6;
export const GRAINS = 48;
/** Grains in one pour or one scoop. */
export const BATCH = 3;

export type Invitation = 'tall' | 'hills' | 'flat';
export type LandscapeKind = 'flat' | 'hills' | 'tall' | 'bumpy';

export interface Plan {
  level: number;
  name: string;
  /** The columns each bay covers, `[from, to]` inclusive. */
  bays: readonly (readonly [number, number])[];
  /** The columns a pour into each bay drops its three grains on, in order. */
  pours: readonly (readonly number[])[];
  /** Starting trays, one chosen by the seed. */
  starts: readonly (readonly number[])[];
  /** Level 3 asks for a picture (never checked) and ends with Show. */
  show: boolean;
}

const flat = Array.from({ length: COLS }, () => 1);
/** Level 3's pour columns for bay `b`: `4b+1, 4b+2, 4b+1`. */
const bayPours = (bays: number) => Array.from({ length: bays }, (_, b) => [4 * b + 1, 4 * b + 2, 4 * b + 1]);

export const PLANS: readonly Plan[] = [
  { level: 1, name: 'Make a mound', bays: [[0, 11]], pours: [[5, 6, 5]], starts: [flat], show: false },
  { level: 2, name: 'Two little hills', bays: [[0, 5], [6, 11]], pours: [[2, 3, 2], [8, 9, 8]], starts: [flat], show: false },
  {
    level: 3,
    name: 'A landscape to show',
    bays: [[0, 3], [4, 7], [8, 11]],
    pours: bayPours(3),
    starts: [flat, [3, 3, 2, 2, 1, 1, 1, 1, 1, 1, 1, 1], [1, 1, 1, 1, 1, 1, 1, 1, 2, 2, 3, 3], [2, 2, 2, 1, 1, 0, 0, 1, 1, 2, 2, 2]],
    show: true,
  },
];

export function planFor(level: number): Plan {
  return PLANS[Math.max(1, Math.min(PLANS.length, level)) - 1];
}

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

// ---- State ------------------------------------------------------------------------------------------------------------

export interface SandState {
  plan: Plan;
  h: number[];
  bucket: number;
  pail: number;
  /** The tray the round began with, for Start again. */
  start: readonly number[];
  /** Rises after the first action that moved a grain, and stays. */
  flag: boolean;
  invite: Invitation | null;
  /** Whether a grain has spilled this round (the first one is spoken). */
  spilled: boolean;
}

export function startState(level: number, rng: Rng): SandState {
  const plan = planFor(level);
  const start = plan.starts.length === 1 ? plan.starts[0] : rng.pick([...plan.starts]);
  let invite: Invitation | null = null;
  if (plan.show) {
    const options = (['tall', 'hills', 'flat'] as const).filter((k) => k !== describeLandscape([...start]));
    invite = rng.pick([...options]);
  }
  return { plan, h: [...start], bucket: GRAINS - sum(start), pail: 0, start, flag: false, invite, spilled: false };
}

export const sum = (h: readonly number[]) => h.reduce((a, b) => a + b, 0);

/** Start again: the seeded tray and a full bucket, at once. The flag stays. */
export function restart(s: SandState) {
  s.h = [...s.start];
  s.bucket = GRAINS - sum(s.start);
  s.pail = 0;
}

export type SandEvent =
  /** A grain falls onto a column and lands at `height` (the height it makes, for the pluck's pitch). */
  | { kind: 'drop'; col: number; height: number }
  /** A grain slides from one column to the next. */
  | { kind: 'slide'; from: number; to: number }
  /** A grain goes over the rim into the pail. */
  | { kind: 'spill'; col: number; first: boolean }
  /** A grain is lifted off a column into the bucket. */
  | { kind: 'lift'; col: number }
  /** Pail sand returns to the bucket. */
  | { kind: 'refill'; n: number };

export interface SandResult {
  /** `empty` when nothing could move (no sand to pour, nothing to scoop, empty pail): a neutral answer, not a miss. */
  kind: 'ok' | 'empty';
  events: SandEvent[];
  /** Grains that moved. */
  moved: number;
}

/** Settle and spill until neither changes anything. */
function settle(s: SandState, events: SandEvent[]) {
  const h = s.h;
  for (;;) {
    let changed = false;
    let moved = true;
    while (moved) {
      moved = false;
      for (let i = 0; i < COLS - 1; i++) {
        if (h[i] - h[i + 1] >= 2) {
          h[i]--;
          h[i + 1]++;
          events.push({ kind: 'slide', from: i, to: i + 1 });
          moved = changed = true;
        } else if (h[i + 1] - h[i] >= 2) {
          h[i + 1]--;
          h[i]++;
          events.push({ kind: 'slide', from: i + 1, to: i });
          moved = changed = true;
        }
      }
    }
    for (let c = 0; c < COLS; c++) {
      while (h[c] > RIM) {
        h[c]--;
        s.pail++;
        events.push({ kind: 'spill', col: c, first: !s.spilled });
        s.spilled = true;
        changed = true;
      }
    }
    if (!changed) return;
  }
}

function done(s: SandState, events: SandEvent[], moved: number): SandResult {
  if (moved > 0) s.flag = true;
  return { kind: moved > 0 ? 'ok' : 'empty', events, moved };
}

/** A pour into a bay: three grains, one at a time, each settled before the next; it stops when the bucket runs out. */
export function pour(s: SandState, bay: number): SandResult {
  const events: SandEvent[] = [];
  const cols = s.plan.pours[Math.max(0, Math.min(s.plan.pours.length - 1, bay))];
  let moved = 0;
  for (const c of cols) {
    if (s.bucket <= 0) break;
    s.bucket--;
    s.h[c]++;
    events.push({ kind: 'drop', col: c, height: s.h[c] });
    moved++;
    settle(s, events);
  }
  return done(s, events, moved);
}

/** A scoop under a bay: up to three grains from its tallest column (leftmost on a tie), settling after each. */
export function scoop(s: SandState, bay: number): SandResult {
  const events: SandEvent[] = [];
  const [from, to] = s.plan.bays[Math.max(0, Math.min(s.plan.bays.length - 1, bay))];
  let moved = 0;
  for (let k = 0; k < BATCH; k++) {
    let best = from;
    for (let c = from; c <= to; c++) if (s.h[c] > s.h[best]) best = c;
    if (s.h[best] <= 0) break;
    s.h[best]--;
    s.bucket++;
    events.push({ kind: 'lift', col: best });
    moved++;
    settle(s, events);
  }
  return done(s, events, moved);
}

/** A tap on the pail: everything in it goes back into the bucket. */
export function emptyPail(s: SandState): SandResult {
  const n = s.pail;
  s.bucket += n;
  s.pail = 0;
  return done(s, n > 0 ? [{ kind: 'refill', n }] : [], n);
}

// ---- Show -------------------------------------------------------------------------------------------------------------

/** What the pet says at Show: the first of these that holds. Every landscape gets a kind line. */
export function describeLandscape(h: readonly number[]): LandscapeKind {
  const hi = Math.max(...h);
  const lo = Math.min(...h);
  if (hi - lo <= 1) return 'flat';
  for (let i = 0; i < h.length; i++) for (let k = i + 2; k < h.length; k++) {
    for (let j = i + 1; j < k; j++) if (h[j] < h[i] && h[j] < h[k]) return 'hills';
  }
  if (hi >= 5) return 'tall';
  return 'bumpy';
}

// ---- Help and the ghost finger ----------------------------------------------------------------------------------------

export type SandAction = { pour: number } | { scoop: number } | { pail: true };

const bayMin = (s: SandState, b: number) => Math.min(...s.h.slice(s.plan.bays[b][0], s.plan.bays[b][1] + 1));
const bayMax = (s: SandState, b: number) => Math.max(...s.h.slice(s.plan.bays[b][0], s.plan.bays[b][1] + 1));

/** A useful action: pour into the bay with the lowest column, or, with the bucket empty, give the pail's sand back or scoop the tallest bay. */
export function hintAction(s: SandState): SandAction {
  if (s.bucket > 0) {
    let best = 0;
    for (let b = 1; b < s.plan.bays.length; b++) if (bayMin(s, b) < bayMin(s, best)) best = b;
    return { pour: best };
  }
  if (s.pail > 0) return { pail: true };
  let best = 0;
  for (let b = 1; b < s.plan.bays.length; b++) if (bayMax(s, b) > bayMax(s, best)) best = b;
  return { scoop: best };
}

export function apply(s: SandState, a: SandAction): SandResult {
  return 'pour' in a ? pour(s, a.pour) : 'scoop' in a ? scoop(s, a.scoop) : emptyPail(s);
}

export type BotStep = SandAction | { flag: true };

/**
 * The ghost finger's short round, step by step from `taken` actions so far. Level 1: four pours, one scoop. Level 2: three on the
 * left, one on the right, one scoop on the left. Level 3 follows the invitation. Then the flag (or Show).
 */
export function botStep(s: SandState, taken: number): BotStep {
  const lvl = s.plan.level;
  if (lvl === 1) return taken < 4 ? { pour: 0 } : taken < 5 ? { scoop: 0 } : { flag: true };
  if (lvl === 2) return taken < 3 ? { pour: 0 } : taken < 4 ? { pour: 1 } : taken < 5 ? { scoop: 0 } : { flag: true };
  const kind = describeLandscape(s.h);
  if (kind === s.invite || taken >= 12) return { flag: true };
  if (s.invite === 'tall') return { pour: 1 };
  if (s.invite === 'hills') return taken % 2 === 0 ? { pour: 0 } : { pour: 2 };
  // flat: lift the tallest bay's sand, then fill the lowest bay
  return s.bucket > 0 && taken % 2 === 1 ? hintAction(s) : { scoop: tallestBay(s) };
}

function tallestBay(s: SandState): number {
  let best = 0;
  for (let b = 1; b < s.plan.bays.length; b++) if (bayMax(s, b) > bayMax(s, best)) best = b;
  return best;
}

// ---- Layout -----------------------------------------------------------------------------------------------------------

export interface SandLayout {
  tray: Rect;
  rowH: number;
  colW: number;
  /** Each bay's tap area, covering its columns. */
  bays: Rect[];
  paddles: Rect[];
  pail: Rect;
  flag: Rect;
  /** The bucket's centre, above the tray (decoration). */
  bucket: { x: number; y: number };
}

export const PADDLE_H = 100;
const SIDE = 130;

/** Every rectangle for `bays` bays. Nothing shrinks below 100; the pet's corner (bottom-left) and the home button stay clear. */
export function sandLayout(view: View, bays: number): SandLayout {
  const landscape = view.w >= view.h;
  const trayW = Math.min(860, view.w - 80);
  const rowH = landscape ? 48 : 60;
  const tray: Rect = { x: (view.w - trayW) / 2, y: landscape ? 170 : 190, w: trayW, h: rowH * RIM };
  const colW = trayW / COLS;
  const bayW = trayW / bays;
  const bayRects = Array.from({ length: bays }, (_, b) => ({ x: tray.x + b * bayW, y: tray.y, w: bayW, h: tray.h }));
  const pw = Math.min(180, bayW - 24);
  const py = tray.y + tray.h + 26;
  const paddles = bayRects.map((r) => ({ x: r.x + r.w / 2 - pw / 2, y: py, w: pw, h: PADDLE_H }));
  let flagRect: Rect;
  let pailRect: Rect;
  if (landscape) {
    flagRect = { x: view.w - 20 - SIDE, y: view.h - 20 - SIDE, w: SIDE, h: SIDE };
    pailRect = { x: flagRect.x - 24 - SIDE, y: flagRect.y, w: SIDE, h: SIDE };
  } else {
    const y = py + PADDLE_H + 40;
    flagRect = { x: view.w - 20 - SIDE, y, w: SIDE, h: SIDE };
    pailRect = { x: flagRect.x - 24 - SIDE, y, w: SIDE, h: SIDE };
  }
  return { tray, rowH, colW, bays: bayRects, paddles, pail: pailRect, flag: flagRect, bucket: { x: view.w / 2, y: 95 } };
}

/** The bay a column belongs to. */
export function bayOf(plan: Plan, col: number): number {
  return plan.bays.findIndex(([a, b]) => col >= a && col <= b);
}

// ---- Words for grown-ups ----------------------------------------------------------------------------------------------

export function describeSand(level: number): string {
  return level <= 1 ? 'Pour and scoop one sand heap' : level === 2 ? 'Build or lower two hills' : 'Shape a landscape and show it';
}
