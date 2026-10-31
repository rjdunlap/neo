import type { Rng } from '../../engine/random';
import type { View } from '../../engine/view';
import type { BandLevels } from '../../progress/difficulty';

/**
 * Tide Line (docs/definitions/tide-line.md): the sea comes in and goes out, and the seaweed line on the sand shows how far
 * the last high tide came. The beach slopes up the screen; a height `h` runs from 0 (the low-tide water's edge) to 1 (the
 * foot of the dunes), and the grass above the dunes goes a little past 1. Levels 1–2 are built (batch tide-line 1).
 */
export type Mode = 'wave' | 'pail';

export interface Plan {
  level: number;
  mode: Mode;
  name: string;
}

export const PLANS: readonly Plan[] = [
  { level: 1, mode: 'wave', name: 'Come in, go out: pull the sea up the sand and let it go' },
  { level: 2, mode: 'pail', name: 'Stop at the line: put two pails above the seaweed line' },
];

export const tidePlan = (level: number): Plan => PLANS[Math.max(1, Math.min(PLANS.length, Math.round(level))) - 1];

/** Batch tide-line 1: lap 1, toddler 1–2, preschool 2. Preschool gains 3 and pre-K 3–4 with batch tide-line 2. */
export const BAND_LEVELS: BandLevels = {
  lap: { min: 1, max: 1 },
  toddler: { min: 1, max: 2 },
  preschool: { min: 2, max: 2 },
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
export const isDry = (feet: number, highs: readonly number[]) => feet > Math.max(...highs.map((h) => wrack(h).top));

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
export const overlaps = (a: Box, b: Box) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;

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

/** Where a dropped thing's feet stand: inside the sand and grass, and out of the pet's corner. */
export function clampFeet(L: ShoreLayout, view: View, x: number, y: number): { x: number; y: number } {
  const fy = Math.max(L.sand.y, Math.min(L.sand.y + L.sand.h, y));
  // High on the grass a pail would reach up beside the corner buttons: keep it between them.
  const edge = fy - PAIL < CORNER ? CORNER + PAIL / 2 : L.sand.x;
  const fx = Math.max(edge, Math.min(view.w - edge, Math.max(L.sand.x, Math.min(L.sand.x + L.sand.w, x))));
  const pet = petCorner(view);
  // A pail is drawn 60 either side of its feet and 120 above them.
  if (fx - PAIL / 2 < pet.x + pet.w && fy > pet.y) return { x: pet.x + pet.w + PAIL / 2, y: fy };
  return { x: fx, y: fy };
}

/** The pail's box with its feet at (x, y). */
export const pailBox = (x: number, y: number): Box => ({ x: x - PAIL / 2, y: y - PAIL, w: PAIL, h: PAIL });

/** The level-1 sea's grab area with the crest at `crestY`: the band round the crest down to the bottom, clear of the pet. */
export function seaGrab(view: View, crestY: number): Box {
  const top = crestY - CREST_BAND / 2;
  return { x: PET.w, y: top, w: view.w - PET.w, h: view.h - top };
}

/** The ghost finger's (and the pet's carry) spot for a pail: the middle of the dry sand above the line, clear of others. */
export function drySpot(L: ShoreLayout, view: View, high: number, avoid: readonly { x: number; y: number }[] = []): { x: number; y: number } {
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
export const creatureSpot = (L: ShoreLayout, view: View, c: { at: number; h: number }) => ({ x: PET.w + (view.w - PET.w - 60) * c.at, y: yAt(L, c.h) });
