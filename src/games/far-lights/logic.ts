import type { Rng } from '../../engine/random';
import type { View } from '../../engine/view';

/**
 * Far Lights: the same light looks brighter near the window and dimmer far away. Four stops at toy distances 1–4 from the
 * window; every light at levels 1–4 has glow 1, so only its stop changes how bright it looks. Levels 1–4 claim only the
 * order (nearer looks brighter); nothing here names a ratio.
 */

export type Stop = 1 | 2 | 3 | 4;
export const STOPS: readonly Stop[] = [1, 2, 3, 4];
export type Lane = 'A' | 'B';
export const LANES: readonly Lane[] = ['A', 'B'];
export const other = (lane: Lane): Lane => (lane === 'A' ? 'B' : 'A');

/** Every light at levels 1–4. */
export const GLOW = 1;

/** How bright a light looks from the window: glow over distance squared. */
export const look = (glow: number, stop: Stop): number => glow / (stop * stop);

/** The window view's fixed core: the light itself, the same at every stop. */
export const CORE_R = 10;
/** The window view's halo: its area is proportional to how bright the light looks. */
export const HALO_MAX = 110;
export const haloRadius = (l: number): number => HALO_MAX * Math.sqrt(l);
export const haloAlpha = (l: number): number => 0.35 + 0.65 * Math.sqrt(l);
/** The side view draws every light the same at every stop: the stop is not passed in, on purpose. */
export const SIDE_GLOW_R = 26;
export const sideGlow = (): { core: number; glow: number } => ({ core: CORE_R + 6, glow: SIDE_GLOW_R });

/** Two judged states are different only if one looks at least twice as bright (stops 3 and 4 never meet). */
export const readablyDifferent = (a: Stop, b: Stop): boolean => {
  const [x, y] = [look(GLOW, a), look(GLOW, b)];
  return Math.max(x, y) >= 2 * Math.min(x, y);
};

// ----- level 3: which looks brighter? -----

export interface Pair {
  A: Stop;
  B: Stop;
}
/** The pairs a round may show, nearer first: never {3, 4}, which look too alike. */
export const PAIRS: readonly [Stop, Stop][] = [[1, 2], [1, 3], [1, 4], [2, 3], [2, 4]];

export const brighterOf = (p: Pair): Lane => (p.A < p.B ? 'A' : 'B');

/** Two different pairs, the brighter in lane A once and lane B once. The authored round opens with A at 1 and B at 3. */
export function pairsFor(rng: Rng, authored: boolean): Pair[] {
  const firstLane: Lane = authored ? 'A' : rng.pick(LANES);
  const first = authored ? PAIRS[1] : rng.pick(PAIRS);
  const second = rng.pick(PAIRS.filter((p) => p !== first));
  const place = ([near, far]: [Stop, Stop], lane: Lane): Pair => (lane === 'A' ? { A: near, B: far } : { A: far, B: near });
  return [place(first, firstLane), place(second, other(firstLane))];
}

export type BrighterVerdict = 'right' | 'dimmer';
export const judgeBrighter = (p: Pair, lane: Lane): BrighterVerdict => (lane === brighterOf(p) ? 'right' : 'dimmer');

// ----- level 4: make them match -----

export interface Board {
  /** The moored light's lane and stop. */
  ref: Lane;
  r: 1 | 2;
  /** Where the loose light (in the other lane) starts. */
  m: Stop;
}
export const movable = (b: Board): Lane => other(b.ref);

/** Two boards, lanes swapped and the other reference stop. The authored round opens with the reference in A at 2, the loose light at 4. */
export function boardsFor(rng: Rng, authored: boolean): Board[] {
  const ref: Lane = authored ? 'A' : rng.pick(LANES);
  const r: 1 | 2 = authored ? 2 : rng.pick([1, 2] as const);
  const start = (r: 1 | 2): Stop => (r === 2 ? 4 : rng.pick([3, 4] as const));
  const r2: 1 | 2 = r === 1 ? 2 : 1;
  return [
    { ref, r, m: authored ? 4 : start(r) },
    { ref: other(ref), r: r2, m: start(r2) },
  ];
}

export type MatchVerdict = 'same' | 'too-bright' | 'too-dim';
export const judgeMatch = (b: Board, stop: Stop): MatchVerdict => (stop === b.r ? 'same' : stop < b.r ? 'too-bright' : 'too-dim');

// ----- level 5: which is farther? -----

/** The farther (dimmer-looking) light of a pair. Level 5 shows level 3's pairs, so the farther is in lane A once and B once. */
export const fartherOf = (p: Pair): Lane => other(brighterOf(p));
export type FartherVerdict = 'right' | 'nearer';
export const judgeFarther = (p: Pair, lane: Lane): FartherVerdict => (lane === fartherOf(p) ? 'right' : 'nearer');

// ----- level 6: near to far -----

/** Level 6's two stop sets: every neighbour at least 2.25× apart ({x, 3, 4} never). */
export const ORDER_SETS: readonly (readonly [Stop, Stop, Stop])[] = [[1, 2, 3], [1, 2, 4]];

/** Three lights in the window's three spots, left to right: each spot's stop. */
export interface OrderBoard {
  stops: [Stop, Stop, Stop];
}
/** The window spots, nearest first: the only accepted order. */
export const nearOrder = (b: OrderBoard): number[] => [0, 1, 2].sort((i, j) => b.stops[i] - b.stops[j]);
const sorted = (s: readonly Stop[]) => s.every((x, i) => i === 0 || s[i - 1] < x);

/** Two boards, one per stop set, each shuffled so it is never already nearest-to-farthest left to right. Authored: [3, 1, 2], then {1, 2, 4}. */
export function orderBoardsFor(rng: Rng, authored: boolean): OrderBoard[] {
  const sets = authored ? [...ORDER_SETS] : rng.shuffle([...ORDER_SETS]);
  return sets.map((set, k) => {
    if (authored && k === 0) return { stops: [3, 1, 2] };
    let stops = [...set];
    while (sorted(stops)) stops = rng.shuffle([...set]);
    return { stops: stops as [Stop, Stop, Stop] };
  });
}

/** The first wrong position of a full set of picks (spot indices in tap order), or 'right'. */
export const judgeOrder = (b: OrderBoard, picks: readonly number[]): 'right' | number => {
  const want = nearOrder(b);
  const i = want.findIndex((s, k) => picks[k] !== s);
  return i < 0 ? 'right' : i;
};

/**
 * Level 6's marks: picks[k] is the spot marked k + 1. Tapping an unmarked light gives it the next mark; tapping a marked
 * one clears it and every later mark (free). Locked marks (from a hint) are always a correct nearest-first prefix, so the
 * board stays solvable; they never clear.
 */
export class OrderMarks {
  picks: number[] = [];
  locked = 0;
  constructor(readonly board: OrderBoard) {}
  markOf = (spot: number): number => this.picks.indexOf(spot) + 1;
  get full() {
    return this.picks.length === 3;
  }
  /** Returns what the tap did ('locked' when it touched a hint mark, which stays). */
  tap(spot: number): 'marked' | 'cleared' | 'locked' {
    const k = this.picks.indexOf(spot);
    if (k < 0) {
      this.picks.push(spot);
      return 'marked';
    }
    if (k < this.locked) return 'locked';
    this.picks.length = k;
    return 'cleared';
  }
  /** The correct marks counted from the first. */
  get rightSoFar() {
    const want = nearOrder(this.board);
    let k = 0;
    while (k < this.picks.length && this.picks[k] === want[k]) k++;
    return k;
  }
  /** After a wrong pull: the marks from the first wrong one on clear (the right ones before it stay). */
  dropWrong() {
    this.picks.length = this.rightSoFar;
  }
  /** The light the next mark should go on (after the correct marks). */
  get nextRight(): number | null {
    const k = this.rightSoFar;
    return k < 3 ? nearOrder(this.board)[k] : null;
  }
  /** A hint: clear any wrong marks, mark the next correct light and lock every mark up to it. Returns its spot, or null when all are right. */
  hint(): number | null {
    this.dropWrong();
    const s = this.nextRight;
    if (s === null) return null;
    this.picks.push(s);
    this.locked = this.picks.length;
    return s;
  }
}

// ----- help -----

/** Level 3: the brighter lane. Level 4: the matching stop. (Level 5: `fartherOf`; level 6: `OrderMarks.nextRight`.) */
export function helpFor(level: 3, at: Pair): Lane;
export function helpFor(level: 4, at: Board): Stop;
export function helpFor(level: 3 | 4, at: Pair | Board): Lane | Stop {
  return level === 3 ? brighterOf(at as Pair) : (at as Board).r;
}

/** Level 2: the light farther from the window steps one stop closer (null when both are home). */
export function closerHelp(stops: Record<Lane, Stop>): { lane: Lane; to: Stop } | null {
  const lane: Lane = stops.B > stops.A ? 'B' : 'A';
  return stops[lane] === 1 ? null : { lane, to: (stops[lane] - 1) as Stop };
}

/** The stop nearest x along the strip, given each stop's x. */
export function nearestStop(x: number, xs: readonly number[]): Stop {
  let best = 0;
  for (let i = 1; i < xs.length; i++) if (Math.abs(xs[i] - x) < Math.abs(xs[best] - x)) best = i;
  return (best + 1) as Stop;
}

// ----- level 1 and level 2 trackers -----

/** Level 1: three counted taps finish; a tap on a light already moving is free and not counted. */
export class GlowTaps {
  count = 0;
  readonly moving = new Set<number>();
  /** Returns whether this tap counts (and starts the light moving). */
  tap(light: number): boolean {
    if (this.moving.has(light) || this.count >= 3) return false;
    this.moving.add(light);
    this.count++;
    return true;
  }
  back(light: number) {
    this.moving.delete(light);
  }
  get done() {
    return this.count >= 3 && this.moving.size === 0;
  }
}

/** Level 2: where each light rests, and the cheer once per nearer stop per light. */
export class CloserWalk {
  readonly at: Record<Lane, Stop>;
  private readonly cheered = new Set<string>();
  constructor(start: Record<Lane, Stop> = { A: 4, B: 3 }) {
    this.at = { ...start };
  }
  /** A light crossed from one stop to the next: 'brighter' the first time it reaches a nearer stop, 'dimmer' going away. */
  cross(lane: Lane, from: Stop, to: Stop): 'brighter' | 'dimmer' | null {
    if (to > from) return 'dimmer';
    if (to === from) return null;
    const key = `${lane}${to}`;
    if (this.cheered.has(key)) return null;
    this.cheered.add(key);
    return 'brighter';
  }
  rest(lane: Lane, stop: Stop) {
    this.at[lane] = stop;
  }
  get done() {
    return this.at.A === 1 && this.at.B === 1;
  }
}

// ----- the round's tally -----

/** Misses and hints, at most one hint per pair, board or tap, and the misses on the one in hand for the glow. */
export class FarTally {
  misses = 0;
  hints = 0;
  here = 0;
  private hinted = false;
  next() {
    this.here = 0;
    this.hinted = false;
  }
  miss() {
    this.misses++;
    this.here++;
  }
  /** Returns whether this hint counts (the first on this pair, board or tap). */
  hint(): boolean {
    if (this.hinted) return false;
    this.hinted = true;
    this.hints++;
    return true;
  }
  get glow() {
    return this.here >= 2;
  }
}

// ----- layout -----

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}
export interface Ring {
  x: number;
  y: number;
  r: number;
}

/** The home and ? buttons (top left) and the guide (bottom left). */
export const HOME_CORNER = { w: 130, h: 215 };
export const PET_CORNER = { w: 160, h: 170 };
export const TOUCH = 120;
export const TOUCH_1 = 160;
export const STOP_GAP = 120;
export const LANE_H = 120;
export const MIN_WINDOW = { w: 440, h: 300 };
export const CHECK = 120;
/** The curtain's tassel (levels 5–6), a touch circle at the strip's right end. */
export const TASSEL = 120;
/** Level 6's three display lanes inside the strip. */
export const LANE_3 = 80;
/** Width of the little house at the strip's left end. */
export const HOUSE_W = 130;
const M = 20;

export interface FarLayout {
  /** Levels 2–6: the side strip, the house's window, each stop's x, each lane's y. */
  strip: Rect | null;
  house: Rect | null;
  stopX: number[];
  laneY: Record<Lane, number>;
  /** Level 6: the three display lanes' y, top to bottom (one per window spot, left to right). */
  lanes3: number[];
  /** Levels 5–6: the strip is display only, behind a curtain lifted by this tassel. */
  tassel: Ring | null;
  /** The window view's frame. */
  window: Rect;
  /** Where each light sits in the window view (level 1: three lights). */
  spots: { x: number; y: number }[];
  /** Touch radius of a light, in the strip and (levels 1 and 3) in the window. */
  touchR: number;
  check: Rect | null;
}

export const corners = (v: View): Rect[] => [
  { x: 0, y: 0, ...HOME_CORNER },
  { x: 0, y: v.h - PET_CORNER.h, ...PET_CORNER },
];
const overlaps = (a: Rect, b: Rect) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
const inside = (a: Rect, b: Rect) => a.x >= b.x && a.y >= b.y && a.x + a.w <= b.x + b.w && a.y + a.h <= b.y + b.h;
export const ringBox = (c: Ring): Rect => ({ x: c.x - c.r, y: c.y - c.r, w: c.r * 2, h: c.r * 2 });
const ringsMeet = (a: Ring, b: Ring) => Math.hypot(a.x - b.x, a.y - b.y) < a.r + b.r;
export function ringHits(c: Ring, r: Rect): boolean {
  const nx = Math.max(r.x, Math.min(c.x, r.x + r.w));
  const ny = Math.max(r.y, Math.min(c.y, r.y + r.h));
  return Math.hypot(nx - c.x, ny - c.y) < c.r;
}

/** The strip's touch circles: one per lane per stop (none behind the curtain, where the strip is display only). */
export const stripRings = (l: FarLayout): Ring[] => (l.strip && !l.tassel ? LANES.flatMap((lane) => l.stopX.map((x) => ({ x, y: l.laneY[lane], r: l.touchR }))) : []);
/** The window's touch circles (levels 1, 3, 5 and 6) and the biggest halos (stop 1) around each spot. */
export const windowRings = (l: FarLayout): Ring[] => l.spots.map((s) => ({ ...s, r: l.touchR }));
export const haloRings = (l: FarLayout): Ring[] => l.spots.map((s) => ({ ...s, r: HALO_MAX }));

/**
 * Where everything goes: the strip across the top (levels 2–4), the window view below it, right of the guide's column.
 * Null rather than a touch area under 120 (160 at level 1), stops closer than 120, a lane under 120, a window under
 * 440×300, a Check or tassel under 120, or level 6's three spots closer than 240.
 */
export function farLayout(v: View, level: number): FarLayout | null {
  const room: Rect = { x: 0, y: 0, w: v.w, h: v.h };
  const left = Math.max(HOME_CORNER.w, PET_CORNER.w) + M;
  let strip: Rect | null = null;
  let house: Rect | null = null;
  let stopX: number[] = [];
  let laneY: Record<Lane, number> = { A: 0, B: 0 };
  let top = M;
  let tassel: Ring | null = null;
  let lanes3: number[] = [];
  if (level >= 2) {
    const sx = HOME_CORNER.w + M;
    strip = { x: sx, y: M, w: v.w - sx - M, h: 2 * LANE_H + 20 };
    house = { x: strip.x, y: strip.y + 10, w: HOUSE_W, h: 2 * LANE_H };
    const first = house.x + house.w + TOUCH / 2 + 10;
    const curtained = level >= 5;
    if (curtained) tassel = { x: strip.x + strip.w - TASSEL / 2 - 10, y: strip.y + strip.h / 2, r: TASSEL / 2 };
    const last = curtained ? tassel!.x - TASSEL / 2 - TOUCH / 2 : strip.x + strip.w - TOUCH / 2 - 10;
    const gap = Math.min(200, (last - first) / 3);
    if (gap < STOP_GAP) return null;
    stopX = STOPS.map((s) => first + (s - 1) * gap);
    laneY = { A: strip.y + 10 + LANE_H / 2, B: strip.y + 10 + LANE_H * 1.5 };
    if (level === 6) lanes3 = [0, 1, 2].map((k) => strip!.y + 10 + LANE_3 * (k + 0.5));
    top = strip.y + strip.h + M;
  }
  const win: Rect = { x: left, y: top, w: v.w - left - M, h: v.h - top - M };
  if (win.w < MIN_WINDOW.w || win.h < MIN_WINDOW.h) return null;
  const touchR = (level === 1 ? TOUCH_1 : TOUCH) / 2;
  const cx = win.x + win.w / 2;
  const cy = win.y + win.h / 2 - (level === 4 ? 30 : 0);
  const three = level === 1 || level === 6;
  const half = three ? Math.min(240, (win.w - 2 * HALO_MAX) / 2) : Math.max(130, Math.min(200, win.w / 2 - HALO_MAX - 30));
  const spots = three ? [-1, 0, 1].map((k) => ({ x: cx + k * half, y: cy })) : [{ x: cx - half, y: cy }, { x: cx + half, y: cy }];
  const check: Rect | null = level === 4 ? { x: win.x + win.w - CHECK - 20, y: win.y + win.h - CHECK - 20, w: CHECK, h: CHECK } : null;
  const l: FarLayout = { strip, house, stopX, laneY, lanes3, tassel, window: win, spots, touchR, check };

  // Every touch area inside the room, clear of the corners and of each other.
  const touches = [...stripRings(l), ...(level === 4 || level === 2 ? [] : windowRings(l)), ...(tassel ? [tassel] : [])];
  if (level === 1 && half < 200) return null;
  if (level === 6 && half < 240) return null;
  if (touches.some((c) => !inside(ringBox(c), room) || corners(v).some((k) => ringHits(c, k)))) return null;
  if (touches.some((a, i) => touches.some((b, j) => i < j && ringsMeet(a, b)))) return null;
  if (corners(v).some((k) => overlaps(win, k)) || (strip && corners(v).some((k) => overlaps(strip!, k)))) return null;
  if (strip && overlaps(strip, win)) return null;
  if (tassel && strip && !inside(ringBox(tassel), strip)) return null;
  // The halos stay inside the window, never touch each other, and the Check covers none of them.
  const halos = haloRings(l);
  if (halos.some((h) => !inside(ringBox(h), win))) return null;
  if (halos.some((a, i) => halos.some((b, j) => i < j && ringsMeet(a, b)))) return null;
  if (check && (!inside(check, win) || halos.some((h) => ringHits(h, check)))) return null;
  return l;
}

// ----- plans -----

export interface PlanInfo {
  level: 1 | 2 | 3 | 4 | 5 | 6;
  name: string;
}
export const PLANS: readonly PlanInfo[] = [
  { level: 1, name: 'Glow: tap a light and it floats close and glows up' },
  { level: 2, name: 'Come closer: drag both lights to the window' },
  { level: 3, name: 'Which looks brighter? Tap the brighter light' },
  { level: 4, name: 'Make them match: move a light until both look the same' },
  { level: 5, name: 'Behind the curtain: tap the farther light' },
  { level: 6, name: 'Near to far: put three lights in order' },
];
export const planFor = (level: number): PlanInfo => PLANS[Math.min(PLANS.length, Math.max(1, Math.round(level))) - 1];
