import type { Rng } from '../../engine/random';
import type { View } from '../../engine/view';
import { hinted, newRequestTally, nextRequest, type RequestTally } from '../../progress/coach';
import type { BandLevels } from '../../progress/difficulty';

/**
 * Tide Line (docs/definitions/tide-line.md): the sea comes in and goes out, and the seaweed line on the sand shows how far
 * the last high tide came. The beach slopes up the screen; a height `h` runs from 0 (the low-tide water's edge) to 1 (the
 * foot of the dunes), and the grass above the dunes goes a little past 1. Levels 1–2 are batch tide-line 1, 3–4 batch 2;
 * level 5 (docs/definitions/tide-line-5-6.md) turns the day into a strip she slides along.
 */
export type Mode = 'wave' | 'pail' | 'line' | 'cycle' | 'day';

export interface Plan {
  level: number;
  mode: Mode;
  name: string;
}

export const PLANS: readonly Plan[] = [
  { level: 1, mode: 'wave', name: 'Come in, go out: pull the sea up the sand and let it go' },
  { level: 2, mode: 'pail', name: 'Stop at the line: put two pails above the seaweed line' },
  {
    level: 3,
    mode: 'line',
    name: 'Read the line: with the sea out, put a pail, a flag and a towel where they stay dry; then a windy-day line',
  },
  { level: 4, mode: 'cycle', name: "In, out, in, out: finish a day's picture strip of the sea" },
  {
    level: 5,
    mode: 'day',
    name: 'Pool time: slide along the day, and mark a time the rock pool shows and a time the sea covers it',
  },
];

export const tidePlan = (level: number): Plan =>
  PLANS[Math.max(1, Math.min(PLANS.length, Math.round(level))) - 1];

/** Lap 1, toddler 1–2, preschool 2–3, pre-K 3–5, school 4–5 (4–6 once level 6, Read the chart, is built). */
export const BAND_LEVELS: BandLevels = {
  lap: { min: 1, max: 1 },
  toddler: { min: 1, max: 2 },
  preschool: { min: 2, max: 3 },
  prek: { min: 3, max: 5 },
  school: { min: 4, max: 5 },
};

// The sea ---------------------------------------------------------------------------------------

/** The heights a round's high tide is seeded from. */
export const HIGHS = [0.45, 0.55, 0.65] as const;
/** How tall the seaweed band is, in heights. */
export const BAND = 0.05;

/**
 * The water's height at `phase` turns of the tide (0 low, 0.5 high, 1 low again): one smooth curve, rising monotonically
 * from `low` to `high` over the first half and falling back over the second.
 */
export function waterAt(phase: number, low: number, high: number): number {
  const t = phase - Math.floor(phase);
  return low + ((high - low) * (1 - Math.cos(2 * Math.PI * t))) / 2;
}

/** The seaweed band the last high tide left: centred on that high. */
export const wrack = (high: number) => ({ mid: high, top: high + BAND / 2, bottom: high - BAND / 2 });

/** A thing whose feet are at height `feet` stays dry when they are above the top of the highest seaweed band. */
export const isDry = (feet: number, highs: readonly number[]) =>
  feet > Math.max(...highs.map((h) => wrack(h).top));

/** How far the sea comes in, as a height: up to the top of the line, so it touches whatever sits on the line. */
export const reach = (high: number) => wrack(high).top;

/** A round's high tide. */
export const highFor = (rng: Rng) => rng.pick(HIGHS);

/** The first-ever level-2 round's line: the middle one, so the first pail has room on both sides. */
export const AUTHORED_HIGH = 0.55;

/** Level 1's two full cycles: the water passes `UP` and then falls back below `DOWN`. */
export const UP = 0.6;
export const DOWN = 0.1;
export const CYCLES = 2;

/** The lap band's sent wave: this long up the sand and back, peaking at `LAP_PEAK` halfway. */
export const LAP_WAVE = 3.2;
export const LAP_PEAK = 0.8;

/**
 * The sea's height `t` seconds into a lap wave that set off from height `from` (the sea may still be sliding back from a
 * pull when she taps): it rises smoothly from where the water is, never snapping down first, then falls to the low edge.
 */
export function lapWaveH(t: number, from = 0): number {
  const half = LAP_WAVE / 2;
  const peak = Math.max(from, LAP_PEAK);
  if (t <= 0) return from;
  if (t < half) return from + ((peak - from) * (1 - Math.cos((Math.PI * t) / half))) / 2;
  const k = Math.min(1, (t - half) / half);
  return (peak * (1 + Math.cos(Math.PI * k))) / 2;
}

/** Counts full in-and-out cycles of the water from its height each frame. */
export class CycleCounter {
  cycles = 0;
  private risen = false;
  /** Feed the water's height; returns true on the frame a cycle completes. */
  feed(h: number): boolean {
    if (!this.risen && h > UP) this.risen = true;
    else if (this.risen && h < DOWN) {
      this.risen = false;
      this.cycles++;
      return true;
    }
    return false;
  }
  /** The water has gone up past the mark and not yet come back down. */
  get up() {
    return this.risen;
  }
}

/** Level 1: the pitched step the sea plays as it rises past each fifth of the sand (pentatonic, low to high). */
export const FIFTH_STEPS = [3, 5, 7, 9] as const;
export const fifthCrossed = (from: number, to: number): number | null => {
  for (let i = 0; i < 4; i++) {
    const mark = (i + 1) / 5;
    if (from < mark && to >= mark) return i;
  }
  return null;
};

// Level 2: the pail ---------------------------------------------------------------------------

/** The accounting for one pail: a float is a miss, the glow after the second (or asked for) is the one hint. */
export class PailTurn {
  misses = 0;
  hint = false;
  glow = false;
  /** The sea came in and the pail stayed dry. */
  done = false;

  /** The sea has come in to `high` with the pail's feet at `feet`. */
  wave(feet: number, high: number): { dry: boolean; glow: boolean } {
    if (this.done) return { dry: true, glow: false };
    if (isDry(feet, [high])) {
      this.done = true;
      this.glow = false;
      return { dry: true, glow: false };
    }
    this.misses++;
    const before = this.glow;
    if (this.misses >= 2) this.showGlow();
    return { dry: false, glow: this.glow && !before };
  }

  /** Show me: the first ask glows the line and the dry sand; asked again while it glows, the pet carries the pail. */
  ask(): 'glow' | 'carry' | null {
    if (this.done) return null;
    if (this.glow) return 'carry';
    this.showGlow();
    return 'glow';
  }

  private showGlow() {
    this.glow = true;
    this.hint = true;
  }
}

// Layout --------------------------------------------------------------------------------------

export interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

export const PET = { w: 230, h: 230 };
export const petCorner = (view: View): Box => ({ x: 0, y: view.h - PET.h, w: PET.w, h: PET.h });
export const CORNER = 120;
export const cornerButtons = (view: View): Box[] => [
  { x: 0, y: 0, w: CORNER, h: CORNER },
  { x: view.w - CORNER, y: 0, w: CORNER, h: CORNER },
];
export const overlaps = (a: Box, b: Box) =>
  a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;

export const PAIL = 120;
/** How high above the dunes (in heights) a thing may stand on the grass. */
export const GRASS = 0.12;
/** The level-1 grab band round the foam crest. */
export const CREST_BAND = 160;

export interface ShoreLayout {
  /** Screen y of the low-tide water's edge (h = 0) and the foot of the dunes (h = 1). */
  low: number;
  dunes: number;
  /** The level-2 pail waits here, its feet on the sea-side rocks at the right. */
  tray: { x: number; y: number };
  /** Feet may stand anywhere inside this box (the sand and the grass), clear of the pet's corner. */
  sand: Box;
}

export function shoreLayout(view: View): ShoreLayout {
  const portrait = view.h > view.w;
  const dunes = Math.round(portrait ? Math.max(170, view.h * 0.15) : 170);
  const low = Math.round(view.h - (portrait ? 190 : 120));
  const top = dunes - GRASS * (low - dunes);
  return {
    low,
    dunes,
    tray: { x: view.w - 110, y: low - 6 },
    sand: { x: 70, y: top, w: view.w - 140, h: low - top },
  };
}

/** Screen y for a height on this shore, and back. */
export const yAt = (L: ShoreLayout, h: number) => L.low - h * (L.low - L.dunes);
export const hAt = (L: ShoreLayout, y: number) => (L.low - y) / (L.low - L.dunes);

/** A thing's drawn size (feet at the bottom centre); the pail by default. */
export interface Size {
  w: number;
  h: number;
}
const PAIL_SIZE: Size = { w: PAIL, h: PAIL };

/** Where a dropped thing's feet stand: inside the sand and grass, its top no higher than a pail's, and out of the pet's corner. */
export function clampFeet(
  L: ShoreLayout,
  view: View,
  x: number,
  y: number,
  size: Size = PAIL_SIZE,
): { x: number; y: number } {
  const fy = Math.max(L.sand.y + Math.max(0, size.h - PAIL), Math.min(L.sand.y + L.sand.h, y));
  // High on the grass a thing would reach up beside the corner buttons: keep it between them.
  const half = Math.max(PAIL, size.w) / 2; // the touch box, not the drawn width
  const edge = fy - size.h < CORNER ? CORNER + half : L.sand.x;
  const fx = Math.max(edge, Math.min(view.w - edge, Math.max(L.sand.x, Math.min(L.sand.x + L.sand.w, x))));
  const pet = petCorner(view);
  if (fx - half < pet.x + pet.w && fy > pet.y) return { x: pet.x + pet.w + half, y: fy };
  return { x: fx, y: fy };
}

/** The pail's box with its feet at (x, y). */
export const pailBox = (x: number, y: number): Box => ({ x: x - PAIL / 2, y: y - PAIL, w: PAIL, h: PAIL });

/** The level-1 sea's grab area with the crest at `crestY`: the band round the crest down to the bottom, clear of the pet. */
export function seaGrab(view: View, crestY: number): Box {
  const top = crestY - CREST_BAND / 2;
  return { x: PET.w, y: top, w: view.w - PET.w, h: view.h - top };
}

/** The lap band's touch area: the whole screen, sand and sky as well as the sea (the shell's pet and corner buttons sit above it). */
export const lapGrab = (view: View): Box => ({ x: 0, y: 0, w: view.w, h: view.h });

/** The ghost finger's (and the pet's carry) spot for a pail: the middle of the dry sand above the line, clear of others. */
export function drySpot(
  L: ShoreLayout,
  view: View,
  high: number,
  avoid: readonly { x: number; y: number }[] = [],
): { x: number; y: number } {
  const lo = wrack(high).top;
  const feetH = (lo + 1) / 2;
  const y = yAt(L, feetH);
  const xs = [0.5, 0.32, 0.68, 0.2, 0.8].map((f) => L.sand.x + L.sand.w * f);
  const x = xs.find((cx) => avoid.every((p) => Math.abs(p.x - cx) > PAIL + 20)) ?? xs[0];
  return clampFeet(L, view, x, y);
}

/** A wet spot for a test or a demonstration of a float: just under the line, in the open middle of the sand. */
export function wetSpot(L: ShoreLayout, view: View, high: number): { x: number; y: number } {
  return clampFeet(L, view, L.sand.x + L.sand.w * 0.45, yAt(L, wrack(high).bottom - 0.08));
}

/** Level 1's creatures: on rocks at heights 0.2–0.5, spread across the sand clear of the pet and the tray. */
export type Creature = 'anemone' | 'star' | 'shell' | 'crab';
export const CREATURES: readonly { kind: Creature; at: number; h: number }[] = [
  { kind: 'shell', at: 0.3, h: 0.22 },
  { kind: 'anemone', at: 0.48, h: 0.4 },
  { kind: 'star', at: 0.66, h: 0.3 },
  { kind: 'crab', at: 0.84, h: 0.48 },
];
export const creatureSpot = (L: ShoreLayout, view: View, c: { at: number; h: number }) => ({
  x: PET.w + (view.w - PET.w - 60) * c.at,
  y: yAt(L, c.h),
});

// Level 3: read the line -------------------------------------------------------------------------

export type Thing = 'pail' | 'flag' | 'towel';
export const THINGS: readonly Thing[] = ['pail', 'flag', 'towel'];
/** Each thing's drawn size; its touch area is at least 120 each way. */
export const SIZES: Record<Thing, Size> = {
  pail: { w: 120, h: 120 },
  flag: { w: 100, h: 160 },
  towel: { w: 160, h: 100 },
};
export const hitSize = (t: Thing): Size => ({ w: Math.max(120, SIZES[t].w), h: Math.max(120, SIZES[t].h) });
/** A thing's touch box with its feet at (x, y). */
export const thingBox = (t: Thing, x: number, y: number): Box => {
  const s = hitSize(t);
  return { x: x - s.w / 2, y: y - s.h, w: s.w, h: s.h };
};

/** How far above the ordinary line the windy-day sea left its line. */
export const WINDY = 0.15;
export const ROUNDS = 2;
/** A round's seaweed lines: one in round 1; round 2 adds the higher windy-day line, which is the one the sea reaches. */
export const linesFor = (round: number, high: number): number[] =>
  round === 0 ? [high] : [high, Math.min(0.85, high + WINDY)];
/** How far the round's sea comes in: to the top of its highest line. */
export const seaReach = (lines: readonly number[]) => reach(Math.max(...lines));

/** Level 3's accounting for one round: each thing that floats is a miss; the glow after the second, or asked for, is the one hint. */
export class LineRound {
  misses = 0;
  hint = false;
  glow = false;
  done = false;
  constructor(readonly lines: readonly number[]) {}

  /** The sea came in with each thing's feet at these heights. The round is done when none floated. */
  wave(feet: Record<Thing, number>): { wet: Thing[]; glow: boolean } {
    if (this.done) return { wet: [], glow: false };
    const wet = THINGS.filter((t) => !isDry(feet[t], this.lines));
    if (!wet.length) {
      this.done = true;
      this.glow = false;
      return { wet, glow: false };
    }
    this.misses += wet.length;
    const before = this.glow;
    if (this.misses >= 2) this.showGlow();
    return { wet, glow: this.glow && !before };
  }

  /** Show me: the first ask glows the line the sea will reach; asked again while it glows, the pet carries the things up. */
  ask(): 'glow' | 'carry' | null {
    if (this.done) return null;
    if (this.glow) return 'carry';
    this.showGlow();
    return 'glow';
  }

  private showGlow() {
    this.glow = true;
    this.hint = true;
  }
}

/** Where each thing waits: on the sea-side rocks at the bottom right, in a row, with the wave button at the right end. */
export function lineTray(
  L: ShoreLayout,
  view: View,
): { spots: Record<Thing, { x: number; y: number }>; button: Box } {
  const y = L.low - 6;
  const button = { x: view.w - 24 - 130, y: y - 120, w: 130, h: 120 };
  const spots = {} as Record<Thing, { x: number; y: number }>;
  let right = button.x - 24;
  for (const t of [...THINGS].reverse()) {
    const w = hitSize(t).w;
    spots[t] = { x: right - w / 2, y };
    right -= w + 20;
  }
  return { spots, button };
}

/** The ghost finger's (and the pet's carry) spots: side by side, halfway between the highest line and the dunes. */
export function drySpots(
  L: ShoreLayout,
  view: View,
  lines: readonly number[],
): Record<Thing, { x: number; y: number }> {
  const top = Math.max(...lines.map((h) => wrack(h).top));
  const y = yAt(L, (top + 1) / 2);
  const at: Record<Thing, number> = { pail: 0.3, flag: 0.5, towel: 0.72 };
  const spots = {} as Record<Thing, { x: number; y: number }>;
  for (const t of THINGS) spots[t] = clampFeet(L, view, L.sand.x + L.sand.w * at[t], y, SIZES[t]);
  return spots;
}

/** Feet between round 2's two lines: wet, because the windy-day sea reaches the top one. */
export function betweenSpot(
  L: ShoreLayout,
  view: View,
  lines: readonly number[],
  t: Thing,
  fx = 0.5,
): { x: number; y: number } {
  const lo = Math.min(...lines.map((h) => wrack(h).top));
  const hi = Math.max(...lines.map((h) => wrack(h).bottom));
  return clampFeet(L, view, L.sand.x + L.sand.w * fx, yAt(L, (lo + hi) / 2), SIZES[t]);
}

// Level 4: in, out, in, out ---------------------------------------------------------------------------

/** A shore picture: the sea in to the line, out past the rock, or halfway (never the answer). */
export type Pic = 'high' | 'low' | 'mid';
export const SLOTS = 4;
export const STRIPS = 2;

export interface Strip {
  /** Four pictures across the day, alternating high and low. */
  pics: ('high' | 'low')[];
  /** The missing one. */
  gap: number;
  /** The three choice cards, in their order on screen. */
  cards: Pic[];
}

/** The first strip of a session: in, out, in, and the last missing, with the halfway card first. */
export const AUTHORED_STRIP: Strip = {
  pics: ['high', 'low', 'high', 'low'],
  gap: 3,
  cards: ['mid', 'high', 'low'],
};

export function makeStrip(rng: Rng): Strip {
  const start = rng.pick(['high', 'low'] as const);
  const pics = Array.from(
    { length: SLOTS },
    (_, i) => ((i % 2 === 0) === (start === 'high') ? 'high' : 'low') as 'high' | 'low',
  );
  return { pics, gap: rng.int(0, SLOTS - 1), cards: rng.shuffle<Pic>(['high', 'low', 'mid']) };
}

export const answerOf = (s: Strip): Pic => s.pics[s.gap];

/** What the pet says to a wrong card: the halfway picture is neither; otherwise the neighbour that decides it. */
export type WrongLine = 'tl.halfway' | 'tl.after-in' | 'tl.after-out' | 'tl.before-in' | 'tl.before-out';
export function wrongLine(s: Strip, card: Pic): WrongLine {
  if (card === 'mid') return 'tl.halfway';
  if (s.gap > 0) return s.pics[s.gap - 1] === 'high' ? 'tl.after-in' : 'tl.after-out';
  return s.pics[1] === 'high' ? 'tl.before-in' : 'tl.before-out';
}

/** Level 4's accounting for one strip: a wrong card is a miss; the glow after the second, or asked for, is the one hint. */
export class StripTurn {
  misses = 0;
  hint = false;
  glow = false;
  done = false;
  constructor(readonly strip: Strip) {}

  tap(card: Pic): { right: boolean; glow: boolean } {
    if (this.done) return { right: false, glow: false };
    if (card === answerOf(this.strip)) {
      this.done = true;
      this.glow = false;
      return { right: true, glow: false };
    }
    this.misses++;
    const before = this.glow;
    if (this.misses >= 2) this.showGlow();
    return { right: false, glow: this.glow && !before };
  }

  /** Show me: the right card glows; asked again while it glows, the pet taps it. */
  ask(): 'glow' | 'tap' | null {
    if (this.done) return null;
    if (this.glow) return 'tap';
    this.showGlow();
    return 'glow';
  }

  private showGlow() {
    this.glow = true;
    this.hint = true;
  }
}

export const PIC = { w: 200, h: 160 };
/** The strip of four across the top, and the three cards beneath it, right of the pet. Every view is at least 1024 wide. */
export function stripLayout(view: View): { pics: Box[]; cards: Box[] } {
  const gap = 24;
  const row = SLOTS * PIC.w + (SLOTS - 1) * gap;
  const x0 = (view.w - row) / 2;
  // Below the home button and the help button under it.
  const y0 = CORNER + 90;
  const pics = Array.from({ length: SLOTS }, (_, i) => ({
    x: x0 + i * (PIC.w + gap),
    y: y0,
    w: PIC.w,
    h: PIC.h,
  }));
  const cgap = 40;
  const crow = 3 * PIC.w + 2 * cgap;
  const cx0 = Math.max((view.w - crow) / 2, PET.w + 24);
  const cy = y0 + PIC.h + 70;
  const cards = Array.from({ length: 3 }, (_, i) => ({
    x: cx0 + i * (PIC.w + cgap),
    y: cy,
    w: PIC.w,
    h: PIC.h,
  }));
  return { pics, cards };
}

// Levels 5–6: the island day ---------------------------------------------------------------------------

/** The day's low water, and the heights its two equal high tides are seeded from. */
export const DAY_LOW = 0.1;
export const DAY_HIGHS = [0.55, 0.65] as const;
/** The four times of the day she can stop at, morning to night. */
export const STOPS = 4;

/** One island day: how high the sea comes, and whether the first stop is low water (0) or high water (0.5). */
export interface Day {
  high: number;
  offset: 0 | 0.5;
}

/** The first day of a session, and every demonstration's: it starts at low water. */
export const AUTHORED_DAY: Day = { high: 0.55, offset: 0 };
export const makeDay = (rng: Rng): Day => ({
  high: rng.pick(DAY_HIGHS),
  offset: rng.pick([0, 0.5] as const),
});

/** The time (0 at the left of the day, 1 at the right) at the middle of stop `i`. */
export const stopT = (i: number) => (2 * i + 1) / 8;
/** The stop nearest a time. */
export const nearestStop = (t: number) => Math.max(0, Math.min(STOPS - 1, Math.floor(t * STOPS)));
/** The water's height at time `t` of the day: two whole tides across it, with a turn of the tide at each stop. */
export const dayWater = (day: Day, t: number) => waterAt(2 * (t - 1 / 8) + day.offset, DAY_LOW, day.high);

/** Half the width of a stop's window of time. */
export const WINDOW = 1 / 32;
/** The times a window is judged at: its two ends and its middle, which is the only turn of the tide inside it. */
export const windowTimes = (stop: number) => [stopT(stop) - WINDOW, stopT(stop), stopT(stop) + WINDOW];

/** The shore's thresholds, as heights: the pool's near rim and far rim, the boat's inlet and the picnic shelf. */
export const POOL_RIM = 0.2;
export const POOL_TOP = 0.3;
export const BOAT_FLOAT = 0.45;
export const SHELF = 0.4;

/**
 * What a time can be asked for: the rock pool shows (water still in its hollow), the sea covers the pool, there is
 * enough water to float the boat, the picnic shelf stays dry. `covered` is level 5's second ask; level 6's cards are
 * the pool (`shows`), the boat and the picnic.
 */
export type Ask = 'shows' | 'covered' | 'boat' | 'picnic';
export const suits = (ask: Ask, h: number) =>
  ask === 'shows'
    ? h <= POOL_RIM
    : ask === 'covered'
      ? h >= POOL_TOP
      : ask === 'boat'
        ? h >= BOAT_FLOAT
        : h < SHELF;
/** A stop fits an ask when its whole window of time does. */
export const fits = (ask: Ask, day: Day, stop: number) =>
  windowTimes(stop).every((t) => suits(ask, dayWater(day, t)));
/** The stops that fit an ask, earliest first: always two of the four. */
export const fitting = (ask: Ask, day: Day) =>
  Array.from({ length: STOPS }, (_, i) => i).filter((i) => fits(ask, day, i));

/** Level 5's two asks, in order. */
export const POOL_ASKS = ['shows', 'covered'] as const;
export type PoolAsk = (typeof POOL_ASKS)[number];

/**
 * Level 5's round: she selects a stop (by sliding or tapping) and flags it. A flag on a stop that fits the ask pins it
 * and moves to the next ask; a flag on a stop showing the other state is exploration, never a miss. Help lights both
 * fitting stops (one hint an ask); asked again, it gives the earlier one to flag.
 */
export class PoolTime {
  readonly tally: RequestTally = newRequestTally();
  /** The stop flagged for each ask, in ask order. */
  readonly flags: number[] = [];
  /** The stop the marker rests on; null until she first lets go or taps one. */
  selected: number | null = null;
  glow = false;
  constructor(readonly day: Day) {}

  get ask(): PoolAsk | undefined {
    return POOL_ASKS[this.flags.length];
  }
  get done() {
    return this.flags.length >= POOL_ASKS.length;
  }

  select(stop: number) {
    if (!this.done) this.selected = Math.max(0, Math.min(STOPS - 1, Math.round(stop)));
  }

  /** The flag button: null with nothing selected (or the round over); otherwise whether the selected stop fits the ask. */
  mark(): { right: boolean; ask: PoolAsk; stop: number } | null {
    const ask = this.ask;
    if (!ask || this.selected === null) return null;
    const stop = this.selected;
    if (!fits(ask, this.day, stop)) return { right: false, ask, stop };
    this.flags.push(stop);
    this.glow = false;
    nextRequest(this.tally);
    return { right: true, ask, stop };
  }

  /** Help: the first press lights both fitting stops (one hint); a press while they glow returns the earlier one to mark. */
  help(): { glow: number[] } | { mark: number } | null {
    const ask = this.ask;
    if (!ask) return null;
    const stops = fitting(ask, this.day);
    if (this.glow) return { mark: stops[0] };
    this.glow = true;
    this.tally.helped = true;
    hinted(this.tally);
    return { glow: stops };
  }
}

/** Level 5's layout: the shore picture, the row of four stops with their flags above, the marker's track and the flag button. */
export interface DayLayout {
  picture: Box;
  stops: Box[];
  /** Screen x of time 0 and time 1, and the y of the marker's track. */
  track: { x0: number; x1: number; y: number };
  /** The y of a pinned flag's foot, above the stops. */
  flagY: number;
  button: Box;
}
export const STOP_GAP = 12;
export const KNOB = 110;
export const FLAG_BUTTON = 130;

export function dayLayout(view: View): DayLayout {
  // A tall view stacks the picture, the strip and the flag button; a wide one puts the button at the strip's right end,
  // with the strip, and the marker at the start of the day, clear of the pet's corner.
  const stacked = view.h >= 1000;
  const side = CORNER + 30;
  const stripX = stacked ? 112 : PET.w + 20 + (KNOB + STOP_GAP) / 2;
  const stripW = Math.min(860, view.w - stripX - (stacked ? 112 : 24 + FLAG_BUTTON + 20));
  const x0 = stacked ? (view.w - stripW) / 2 : stripX;
  const w = (stripW - (STOPS - 1) * STOP_GAP) / STOPS;
  const stopH = 130;
  const below = 70 + stopH + 14 + KNOB + (stacked ? 16 + FLAG_BUTTON : 0) + 16;
  // Stacked, the marker starts at the left of its track, above the pet: the track ends before the pet's corner begins.
  const abovePet = stacked ? view.h - PET.h - 24 - (70 + stopH + 14 + KNOB) : Infinity;
  const pictureH = Math.min(560, view.h - 24 - below, abovePet);
  const picture = { x: side, y: 24, w: view.w - side * 2, h: pictureH };
  const stopY = picture.y + pictureH + 70;
  const stops = Array.from({ length: STOPS }, (_, i) => ({
    x: x0 + i * (w + STOP_GAP),
    y: stopY,
    w,
    h: stopH,
  }));
  const trackY = stopY + stopH + 14 + KNOB / 2;
  const button = stacked
    ? { x: (view.w - FLAG_BUTTON) / 2, y: trackY + KNOB / 2 + 16, w: FLAG_BUTTON, h: FLAG_BUTTON }
    : { x: x0 + stripW + 20, y: stopY, w: FLAG_BUTTON, h: FLAG_BUTTON };
  return {
    picture,
    stops,
    track: { x0: x0 - STOP_GAP / 2, x1: x0 + stripW + STOP_GAP / 2, y: trackY },
    flagY: stopY - 6,
    button,
  };
}
/** A time's x on the track, and back (clamped to the day). */
export const trackX = (D: DayLayout, t: number) => D.track.x0 + t * (D.track.x1 - D.track.x0);
export const trackT = (D: DayLayout, x: number) =>
  Math.max(0, Math.min(1, (x - D.track.x0) / (D.track.x1 - D.track.x0)));
