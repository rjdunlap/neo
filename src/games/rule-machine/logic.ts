/**
 * Rule Machine rules: a machine does the same thing to whatever goes in, and the table of in and out is the record.
 * Level 1 (pre-K) changes a creature's look; level 2 (school) adds one or two counters to a car. Feeding is never a
 * miss, and neither is a first guess about a new machine: only a prediction made once the machine has shown its rule
 * can count. Levels 3–4 (the rule shelf and the covered machine) append later without renumbering.
 * Definition: docs/definitions/rule-machine.md.
 */
import type { Rng } from '../../engine/random';
import type { BandLevels } from '../../progress/difficulty';

export type Look = 'hat' | 'blue' | 'big' | 'spots';
export const LOOKS: readonly Look[] = ['hat', 'blue', 'big', 'spots'];
/** Level 1's creatures: the shared critters without the cow, who already has spots. */
export type Creature = 'pip' | 'duck' | 'pig' | 'cat' | 'bear' | 'dog' | 'bunny';
export const CREATURES: readonly Creature[] = ['pip', 'duck', 'pig', 'cat', 'bear', 'dog', 'bunny'];
/** Each creature's body colour (the same as `CRITTERS`; a test compares them). */
export const COLOR_OF: Record<Creature, string> = { pip: 'teal', duck: 'yellow', pig: 'pink', cat: 'orange', bear: 'brown', dog: 'brown', bunny: 'white' };

/** A creature never already shows the machine's look: no blue one under `blue` (Pip's teal is too near blue to read as a change). */
export function canTake(c: Creature, look: Look): boolean {
  if (look === 'blue') return COLOR_OF[c] !== 'blue' && c !== 'pip';
  return true;
}

/** What a creature looks like: as it is (`look` null) or changed. */
export interface Picture { creature: Creature; look: Look | null }

export type LookRule = { kind: 'look'; change: Look };
/** `a × in + b`; levels 1–2 use only `a = 1`, levels 3–8 extend it without a new type. */
export type NumRule = { kind: 'num'; a: 1 | 2 | 3; b: number };
export type Rule = LookRule | NumRule;

export function dress(rule: LookRule, c: Creature): Picture { return { creature: c, look: rule.change }; }
export function apply(rule: NumRule, n: number): number { return rule.a * n + rule.b; }
export interface Row { in: number; out: number }
/** True iff the rule gives every row's out. */
export function fits(rule: NumRule, rows: readonly Row[]): boolean { return rows.every((r) => apply(rule, r.in) === r.out); }

export const MAX_COUNT = 12;

export type Ask = 'look' | 'count';
export interface Plan {
  level: number;
  id: 'hats' | 'more';
  ask: Ask;
  name: string;
  /** Machines in a round. */
  machines: number;
  /** Level 1: creatures that walk through by themselves before the first prediction. */
  walkers: number;
  /** Predictions on each machine (level 1: the waiting creatures; level 2: the cars she sends). */
  predictions: number;
  /** Level 2: cars on the tray. */
  tray: number;
}

const PLANS: readonly Plan[] = [
  { level: 1, id: 'hats', ask: 'look', name: 'Hat machine', machines: 2, walkers: 3, predictions: 2, tray: 0 },
  { level: 2, id: 'more', ask: 'count', name: 'One more goes in', machines: 2, walkers: 0, predictions: 4, tray: 5 },
];

/** Pre-K plays level 1 only; school starts at 2. School's ceiling rises as levels 3–4 are built. */
export const LEVELS: BandLevels = {
  prek: { min: 1, max: 1 },
  school: { min: 2, max: 2 },
};

export function planFor(level: number): Plan {
  return PLANS.find((p) => p.level === level) ?? PLANS[0];
}

/**
 * Whether a wrong answer to this prediction counts. Level 1: each machine's first prediction is free, right or wrong.
 * Level 2: free while the table holds fewer than two rows of the machine (the first two cars).
 */
export function counted(plan: Plan, ask: number): boolean {
  return plan.ask === 'look' ? ask >= 1 : ask >= 2;
}

export interface LookMachine {
  rule: LookRule;
  walkers: Creature[];
  waiting: Creature[];
  /** For each waiting creature, three pictures in seeded order: the look applied, unchanged, a different look. */
  pictures: Picture[][];
}
export interface CountMachine {
  rule: NumRule;
  /** The cars' counters, in tray order (1–5, seeded). */
  tray: number[];
  /** For each of the four predictions, the seeded order of the pads [right, one below, one above]. */
  padOrders: number[][];
}
export type Machine = LookMachine | CountMachine;

function shuffle<T>(rng: Rng, xs: T[]): T[] {
  const a = xs.slice();
  for (let i = a.length - 1; i > 0; i--) { const j = rng.int(0, i); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}

/** The three pictures for a waiting creature: the applied look, unchanged, and a different look it can take. */
export function picturesFor(rule: LookRule, c: Creature, rng: Rng): Picture[] {
  const others = LOOKS.filter((l) => l !== rule.change && canTake(c, l));
  const other = others[rng.int(0, others.length - 1)];
  return shuffle(rng, [dress(rule, c), { creature: c, look: null }, { creature: c, look: other }]);
}

/** Three distinct pads in 0–12: the right count and its neighbours (one below 0 becomes two above, one above 12 two below), in the given order. */
export function pads(right: number, order: readonly number[] = [0, 1, 2]): number[] {
  const below = right - 1 >= 0 ? right - 1 : right + 2;
  const above = right + 1 <= MAX_COUNT ? right + 1 : right - 2;
  const base = [right, below, above];
  return order.map((i) => base[i]);
}

export function makeRound(level: number, rng: Rng): Machine[] {
  const plan = planFor(level);
  if (plan.ask === 'look') {
    const looks = shuffle(rng, LOOKS.slice()).slice(0, plan.machines);
    return looks.map((change) => {
      const rule: LookRule = { kind: 'look', change };
      const pool = shuffle(rng, CREATURES.filter((c) => canTake(c, change)));
      const walkers = pool.slice(0, plan.walkers);
      const waiting = pool.slice(plan.walkers, plan.walkers + plan.predictions);
      return { rule, walkers, waiting, pictures: waiting.map((c) => picturesFor(rule, c, rng)) };
    });
  }
  const bs = shuffle(rng, [1, 2]);
  return bs.map((b) => ({
    rule: { kind: 'num', a: 1, b } as NumRule,
    tray: shuffle(rng, [1, 2, 3, 4, 5]),
    padOrders: Array.from({ length: plan.predictions }, () => shuffle(rng, [0, 1, 2])),
  }));
}

export const isLook = (m: Machine): m is LookMachine => m.rule.kind === 'look';

export const samePicture = (a: Picture, b: Picture) => a.creature === b.creature && a.look === b.look;

export type Outcome = 'right' | 'free' | 'miss' | 'glow';

/**
 * The round's accounting. A free wrong runs the machine at once; a counted wrong is one miss and leaves the question
 * open; a second wrong on the same question is a second miss and lights the glow. At most one hint per machine, the
 * glow and *Show me* included.
 */
export class Score {
  misses = 0;
  hints = 0;
  /** Counted wrongs on the open question. */
  wrongs = 0;
  glowing = false;
  private hinted = false;

  newMachine() { this.hinted = false; this.newAsk(); }
  newAsk() { this.wrongs = 0; this.glowing = false; }

  answer(right: boolean, isCounted: boolean): Outcome {
    if (right) { this.glowing = false; return 'right'; }
    if (!isCounted) return 'free';
    this.misses++;
    this.wrongs++;
    if (this.wrongs >= 2 && !this.glowing) { this.light(); return 'glow'; }
    return 'miss';
  }

  /** *Show me* on an open question: lights the glow (true), or, already lit, asks for the ghost's move (false). */
  showMe(): boolean {
    if (this.glowing) return false;
    this.light();
    return true;
  }

  private light() {
    this.glowing = true;
    if (!this.hinted) { this.hinted = true; this.hints++; }
  }
}

// ---- layout ----

export interface Pt { x: number; y: number }
export interface Box extends Pt { w: number; h: number }
export const COL_W = 90, COL_H = 150, COL_GAP = 10;
export const HOPPER = 160, BODY_W = 360, BODY_H = 180, CHUTE_W = 140;
export const CAR_W = 120, CAR_H = 110, CAR_GAP = 16;
export const PICTURE = 150, PAD = 120, PAD_GAP = 30;

export interface Layout {
  portrait: boolean;
  /** The table's five column slots, left to right. */
  columns: Box[];
  hopper: Box;
  body: Box;
  chute: Box;
  /** Where a creature or car stands while it waits at the hopper's mouth. */
  waitAt: Pt;
  /** Where the output lands at the chute's end. */
  out: Pt;
  /** The tray's five car slots (level 2). */
  tray: Box[];
  /** The three prediction pads or pictures. */
  pads: Box[];
}

const box = (x: number, y: number, w: number, h: number): Box => ({ x, y, w, h });

export function layout(view: { w: number; h: number }, level: number): Layout {
  const { w, h } = view;
  const portrait = h > w;
  const cx = w / 2;
  const tableY = portrait ? 200 : 95 + COL_H / 2;
  const machineY = portrait ? tableY + COL_H / 2 + 60 + BODY_H / 2 : tableY + COL_H / 2 + 20 + BODY_H / 2;
  const rowY = portrait ? machineY + BODY_H / 2 + 70 + CAR_H / 2 : machineY + BODY_H / 2 + 30 + 75;
  const span = 5 * COL_W + 4 * COL_GAP;
  const columns = Array.from({ length: 5 }, (_, i) => box(cx - span / 2 + COL_W / 2 + i * (COL_W + COL_GAP), tableY, COL_W, COL_H));
  const mw = HOPPER + BODY_W + CHUTE_W;
  const mx = cx - mw / 2;
  const hopper = box(mx + HOPPER / 2, machineY - 10, HOPPER, HOPPER);
  const body = box(mx + HOPPER + BODY_W / 2, machineY, BODY_W, BODY_H);
  const chute = box(mx + HOPPER + BODY_W + CHUTE_W / 2, machineY + 20, CHUTE_W, BODY_H - 40);
  // The bottom row keeps right of the pet in landscape; in portrait it sits above the pet's row and can centre.
  const trayW = 5 * CAR_W + 4 * CAR_GAP;
  const left = portrait ? cx - trayW / 2 : Math.max(190, cx - trayW / 2);
  const tray = Array.from({ length: 5 }, (_, i) => box(left + CAR_W / 2 + i * (CAR_W + CAR_GAP), rowY, CAR_W, CAR_H));
  const p = planFor(level).ask === 'look' ? PICTURE : PAD;
  const padsW = 3 * p + 2 * PAD_GAP;
  const padsCx = left + trayW / 2;
  const pads = Array.from({ length: 3 }, (_, i) => box(padsCx - padsW / 2 + p / 2 + i * (p + PAD_GAP), rowY, p, p));
  return {
    portrait, columns, hopper, body, chute, pads, tray,
    waitAt: { x: hopper.x, y: hopper.y - HOPPER / 2 - 10 },
    out: { x: chute.x + 20, y: machineY + BODY_H / 2 - 4 },
  };
}

/** A sticker's machine and its in → out pair, from the seed. */
export function stickerPair(seed: number): { input: number; b: number } {
  const n = Math.abs(Math.floor(seed));
  return { input: 1 + (n % 4), b: 1 + ((n >> 2) % 2) };
}
