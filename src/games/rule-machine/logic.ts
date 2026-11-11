/**
 * Rule Machine rules: a machine does the same thing to whatever goes in, and the table of in and out is the record.
 * Level 1 (pre-K) changes a creature's look; level 2 (school) adds one or two counters to a car; level 3 names the
 * machine's rule from a shelf of three cards; level 4 covers the machine, and she chooses cars so the table tells its
 * cards apart. Feeding is never a miss, and neither is a first guess about a new machine: only a prediction made once
 * the machine has shown its rule can count, and at level 4 a card is judged only when the table can tell. Level 5 runs
 * the rule backwards: the card hangs, a wanted car has come out, and she sends the car that went in; a wrong car runs
 * and counts one miss.
 * Definitions: docs/definitions/rule-machine.md and docs/definitions/rule-machine-5-6.md.
 */
import type { Rng } from '../../engine/random';
import type { BandLevels } from '../../progress/difficulty';

export type Look = 'hat' | 'blue' | 'big' | 'spots';
export const LOOKS: readonly Look[] = ['hat', 'blue', 'big', 'spots'];
/** Level 1's creatures: the shared critters without the cow, who already has spots. */
export type Creature = 'pip' | 'duck' | 'pig' | 'cat' | 'bear' | 'dog' | 'bunny';
export const CREATURES: readonly Creature[] = ['pip', 'duck', 'pig', 'cat', 'bear', 'dog', 'bunny'];
/** Each creature's body colour (the same as `CRITTERS`; a test compares them). */
export const COLOR_OF: Record<Creature, string> = {
  pip: 'teal',
  duck: 'yellow',
  pig: 'pink',
  cat: 'orange',
  bear: 'brown',
  dog: 'brown',
  bunny: 'white',
};

/** A creature never already shows the machine's look: no blue one under `blue` (Pip's teal is too near blue to read as a change). */
export function canTake(c: Creature, look: Look): boolean {
  if (look === 'blue') return COLOR_OF[c] !== 'blue' && c !== 'pip';
  return true;
}

/** What a creature looks like: as it is (`look` null) or changed. */
export interface Picture {
  creature: Creature;
  look: Look | null;
}

export type LookRule = { kind: 'look'; change: Look };
/** `a × in + b`; levels 1–2 use only `a = 1`, levels 3–8 extend it without a new type. */
export type NumRule = { kind: 'num'; a: 1 | 2 | 3; b: number };
export type Rule = LookRule | NumRule;

export function dress(rule: LookRule, c: Creature): Picture {
  return { creature: c, look: rule.change };
}
export function apply(rule: NumRule, n: number): number {
  return rule.a * n + rule.b;
}
export interface Row {
  in: number;
  out: number;
}
/** True iff the rule gives every row's out. */
export function fits(rule: NumRule, rows: readonly Row[]): boolean {
  return rows.every((r) => apply(rule, r.in) === r.out);
}

export const MAX_COUNT = 12;

export type Ask = 'look' | 'count';
export interface Plan {
  level: number;
  id: 'hats' | 'more' | 'what' | 'covered' | 'back';
  ask: Ask;
  name: string;
  /** Machines in a round. */
  machines: number;
  /** Level 1: creatures that walk through by themselves before the first prediction. */
  walkers: number;
  /** Predictions on each machine (level 1: the waiting creatures; level 2: the cars she sends). */
  predictions: number;
  /** Levels 2–4: cars on the tray. */
  tray: number;
  /** The rule shelf: none (1–2), after `cardAfter` rows (3), or from the start beside a covered machine (4). */
  shelf: 'none' | 'after' | 'start';
  cardAfter: number;
  /** Lights along the machine's top: the most rows a machine can make (level 5: the most they show). */
  lights: number;
  /** Level 5: wanted cars on each machine (0 elsewhere). */
  wanted: number;
}

const PLANS: readonly Plan[] = [
  {
    level: 1,
    id: 'hats',
    ask: 'look',
    name: 'Hat machine',
    machines: 2,
    walkers: 3,
    predictions: 2,
    tray: 0,
    shelf: 'none',
    cardAfter: 0,
    lights: 5,
    wanted: 0,
  },
  {
    level: 2,
    id: 'more',
    ask: 'count',
    name: 'One more goes in',
    machines: 2,
    walkers: 0,
    predictions: 4,
    tray: 5,
    shelf: 'none',
    cardAfter: 0,
    lights: 4,
    wanted: 0,
  },
  {
    level: 3,
    id: 'what',
    ask: 'count',
    name: 'What does it do?',
    machines: 2,
    walkers: 0,
    predictions: 4,
    tray: 5,
    shelf: 'after',
    cardAfter: 3,
    lights: 4,
    wanted: 0,
  },
  {
    level: 4,
    id: 'covered',
    ask: 'count',
    name: 'Covered machine',
    machines: 2,
    walkers: 0,
    predictions: 1,
    tray: 5,
    shelf: 'start',
    cardAfter: 0,
    lights: 5,
    wanted: 0,
  },
  {
    level: 5,
    id: 'back',
    ask: 'count',
    name: 'Backwards: find the car that went in',
    machines: 2,
    walkers: 0,
    predictions: 0,
    tray: 5,
    shelf: 'none',
    cardAfter: 0,
    lights: 5,
    wanted: 2,
  },
];

/** Pre-K plays level 1 only; school plays 2–5 (6–8 append later without renumbering). */
export const LEVELS: BandLevels = {
  prek: { min: 1, max: 1 },
  school: { min: 2, max: 5 },
};

/** Level 3's shelf: two adds and a take-away never agree on any input, so every row breaks both wrong cards. */
export const WHAT_POOL: readonly NumRule[] = [
  { kind: 'num', a: 1, b: 2 },
  { kind: 'num', a: 1, b: 3 },
  { kind: 'num', a: 1, b: -1 },
];
/** Level 4's pool: each has at least two trap partners on the tray 0–4. */
export const COVERED_POOL: readonly NumRule[] = [
  { kind: 'num', a: 2, b: 0 },
  { kind: 'num', a: 3, b: 0 },
  { kind: 'num', a: 1, b: 2 },
  { kind: 'num', a: 1, b: 4 },
];
export const COVERED_TRAY: readonly number[] = [0, 1, 2, 3, 4];

/** Level 5's pool: every rule is strictly increasing, so one count makes each output and a wrong car's output says which way to go. */
export const BACK_POOL: readonly NumRule[] = [
  { kind: 'num', a: 1, b: 2 },
  { kind: 'num', a: 1, b: 3 },
  { kind: 'num', a: 1, b: 4 },
  { kind: 'num', a: 1, b: -1 },
  { kind: 'num', a: 1, b: -2 },
  { kind: 'num', a: 2, b: 0 },
  { kind: 'num', a: 3, b: 0 },
];

/** The counts 0–12 whose output is also within 0–12, rising. */
export function validInputs(rule: NumRule): number[] {
  const out: number[] = [];
  for (let n = 0; n <= MAX_COUNT; n++) {
    const m = apply(rule, n);
    if (m >= 0 && m <= MAX_COUNT) out.push(n);
  }
  return out;
}

/** Level 5: a car that has already come out, the count that went in, and the tray she chooses from. */
export interface Wanted {
  /** The count that went in (the one right tray car). */
  answer: number;
  /** The wanted car's count. */
  out: number;
  /** Five distinct valid inputs in rising order, the answer among them. */
  tray: number[];
}

/**
 * Level 5's tray: the answer; the car whose count is the wanted output itself when that is a valid input (the "it
 * looks the same" trap); then the answer's nearest valid neighbours (one below, one above, two below, …) until five.
 */
export function backTray(rule: NumRule, answer: number): number[] {
  const valid = validInputs(rule);
  const tray = [answer];
  const add = (n: number) => {
    if (tray.length < 5 && valid.includes(n) && !tray.includes(n)) tray.push(n);
  };
  add(apply(rule, answer));
  for (let d = 1; tray.length < 5 && d <= MAX_COUNT; d++) {
    add(answer - d);
    add(answer + d);
  }
  return tray.sort((a, b) => a - b);
}

/** The counts a wanted car can come from: valid, at least 1, with an output of at least 1. */
export function backAnswers(rule: NumRule): number[] {
  return validInputs(rule).filter((n) => n >= 1 && apply(rule, n) >= 1);
}

/** Which way the answer lies from a wrong car: its output is below the wanted one (`more`) or above it (`fewer`). */
export function direction(rule: NumRule, car: number, wanted: number): 'more' | 'fewer' {
  return apply(rule, car) < wanted ? 'more' : 'fewer';
}

export const sameRule = (p: NumRule, q: NumRule) => p.a === q.a && p.b === q.b;

/** Pool rules other than `rule` that give the same output as it on at least one tray car (a car that tells them nothing). */
export function trapPartners(
  rule: NumRule,
  pool: readonly NumRule[] = COVERED_POOL,
  tray: readonly number[] = COVERED_TRAY,
): NumRule[] {
  return pool.filter((q) => !sameRule(q, rule) && tray.some((n) => apply(q, n) === apply(rule, n)));
}

/** The shelf cards that fit every row so far. */
export function openCards(shelf: readonly NumRule[], rows: readonly Row[]): NumRule[] {
  return shelf.filter((c) => fits(c, rows));
}

export type CardVerdict = { kind: 'right' } | { kind: 'still-open' } | { kind: 'ruled-out'; row: number };

/**
 * A card tapped against the table. A card some row breaks is ruled out (the newest breaking row is the one read out);
 * while more than one card fits every row (or nothing has gone in), the tap is never judged; the one card left is right.
 */
export function judgeCard(card: NumRule, shelf: readonly NumRule[], rows: readonly Row[]): CardVerdict {
  if (!fits(card, rows)) {
    let row = rows.length - 1;
    while (apply(card, rows[row].in) === rows[row].out) row--;
    return { kind: 'ruled-out', row };
  }
  return openCards(shelf, rows).length > 1 ? { kind: 'still-open' } : { kind: 'right' };
}

/**
 * The car that tells the open cards apart: the lowest-numbered unfed car after which only one card fits (the hint's
 * glow and the bot's choice). Null when one card already fits or no unfed car settles it.
 */
export function settlingCar(
  shelf: readonly NumRule[],
  rows: readonly Row[],
  tray: readonly number[],
  fed: readonly number[],
  rule: NumRule,
): number | null {
  const open = openCards(shelf, rows);
  if (open.length <= 1) return null;
  const slots = tray
    .map((n, i) => ({ n, i }))
    .filter((c) => !fed.includes(c.i))
    .sort((a, b) => a.n - b.n);
  for (const { n, i } of slots) if (open.filter((c) => apply(c, n) === apply(rule, n)).length === 1) return i;
  return null;
}

/** Level 4's last prediction: the tray slot of the lowest-numbered car not yet fed, or null when all five went in. */
export function lastCar(tray: readonly number[], fed: readonly number[]): number | null {
  let best: number | null = null;
  tray.forEach((n, i) => {
    if (!fed.includes(i) && (best === null || n < tray[best])) best = i;
  });
  return best;
}

export function planFor(level: number): Plan {
  return PLANS.find((p) => p.level === level) ?? PLANS[0];
}

/**
 * Whether a wrong answer to this prediction counts. Level 1: each machine's first prediction is free, right or wrong.
 * Level 2: free while the table holds fewer than two rows of the machine (the first two cars).
 */
export function counted(plan: Plan, ask: number): boolean {
  if (plan.ask === 'look') return ask >= 1;
  // Level 5: the card hangs from the start, so every wrong car counts.
  if (plan.id === 'back') return true;
  // Level 4's one prediction comes after the card hangs on the machine: it counts whatever the rows.
  if (plan.shelf === 'start') return true;
  return ask >= 2;
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
  /** The cars' counters, in tray order (seeded): 1–5 at level 2, five distinct of 1–9 at 3, 0–4 at 4. */
  tray: number[];
  /** For each prediction, the seeded order of the pads [right, one below, one above]. */
  padOrders: number[][];
  /** Levels 3–4: the rule shelf's three cards, in seeded order (the rule among them). Empty at 2 and 5. */
  shelf: NumRule[];
  /** Level 5: the wanted cars in turn, each with its own tray (`tray` above is the first one's). */
  wanted?: Wanted[];
}
export type Machine = LookMachine | CountMachine;

function shuffle<T>(rng: Rng, xs: T[]): T[] {
  const a = xs.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = rng.int(0, i);
    [a[i], a[j]] = [a[j], a[i]];
  }
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
      const pool = shuffle(
        rng,
        CREATURES.filter((c) => canTake(c, change)),
      );
      const walkers = pool.slice(0, plan.walkers);
      const waiting = pool.slice(plan.walkers, plan.walkers + plan.predictions);
      return { rule, walkers, waiting, pictures: waiting.map((c) => picturesFor(rule, c, rng)) };
    });
  }
  if (plan.id === 'back') {
    return shuffle(rng, BACK_POOL.slice())
      .slice(0, plan.machines)
      .map((rule) => {
        const wanted = shuffle(rng, backAnswers(rule))
          .slice(0, plan.wanted)
          .map((answer) => ({ answer, out: apply(rule, answer), tray: backTray(rule, answer) }));
        return { rule, tray: wanted[0].tray.slice(), padOrders: [], shelf: [], wanted };
      });
  }
  const padOrders = () => Array.from({ length: plan.predictions }, () => shuffle(rng, [0, 1, 2]));
  if (plan.shelf === 'after') {
    return shuffle(rng, WHAT_POOL.slice())
      .slice(0, plan.machines)
      .map((rule) => ({
        rule,
        tray: shuffle(rng, [1, 2, 3, 4, 5, 6, 7, 8, 9]).slice(0, plan.tray),
        padOrders: padOrders(),
        shelf: shuffle(rng, WHAT_POOL.slice()),
      }));
  }
  if (plan.shelf === 'start') {
    return shuffle(rng, COVERED_POOL.slice())
      .slice(0, plan.machines)
      .map((rule) => ({
        rule,
        tray: shuffle(rng, COVERED_TRAY.slice()),
        padOrders: padOrders(),
        shelf: shuffle(rng, [rule, ...shuffle(rng, trapPartners(rule)).slice(0, 2)]),
      }));
  }
  const bs = shuffle(rng, [1, 2]);
  return bs.map((b) => ({
    rule: { kind: 'num', a: 1, b } as NumRule,
    tray: shuffle(rng, [1, 2, 3, 4, 5]),
    padOrders: padOrders(),
    shelf: [],
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

  newMachine() {
    this.hinted = false;
    this.newAsk();
  }
  newAsk() {
    this.wrongs = 0;
    this.glowing = false;
  }

  answer(right: boolean, isCounted: boolean): Outcome {
    if (right) {
      this.glowing = false;
      return 'right';
    }
    if (!isCounted) return 'free';
    this.misses++;
    this.wrongs++;
    if (this.wrongs >= 2 && !this.glowing) {
      this.light();
      return 'glow';
    }
    return 'miss';
  }

  /** Level 4's Peek: the machine's hint if none was counted yet (true when it counted). */
  peek(): boolean {
    if (this.hinted) return false;
    this.hinted = true;
    this.hints++;
    return true;
  }

  /** *Show me* on an open question: lights the glow (true), or, already lit, asks for the ghost's move (false). */
  showMe(): boolean {
    if (this.glowing) return false;
    this.light();
    return true;
  }

  private light() {
    this.glowing = true;
    if (!this.hinted) {
      this.hinted = true;
      this.hints++;
    }
  }
}

// ---- layout ----

export interface Pt {
  x: number;
  y: number;
}
export interface Box extends Pt {
  w: number;
  h: number;
}
export const COL_W = 90,
  COL_H = 150,
  COL_GAP = 10;
export const HOPPER = 160,
  BODY_W = 360,
  BODY_H = 180,
  CHUTE_W = 140;
export const CAR_W = 120,
  CAR_H = 110,
  CAR_GAP = 16;
export const PICTURE = 150,
  PAD = 120,
  PAD_GAP = 30;
export const CARD_W = 120,
  CARD_H = 120,
  CARD_GAP = 10,
  PEEK = 110;
/** Landscape with a shelf: the row starts right of the help button under Home. */
const SHELF_ROW_LEFT = 120;

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
  /** Levels 3–4: the rule shelf's three cards (right of the table in landscape, beneath it in portrait). */
  shelf: Box[];
  /** Level 4: the Peek eye on the covered machine's front. */
  peek: Box;
}

const box = (x: number, y: number, w: number, h: number): Box => ({ x, y, w, h });

export function layout(view: { w: number; h: number }, level: number): Layout {
  const { w, h } = view;
  const portrait = h > w;
  const cx = w / 2;
  const hasShelf = planFor(level).shelf !== 'none';
  const colGap = !portrait && hasShelf ? 6 : COL_GAP;
  const span = 5 * COL_W + 4 * colGap;
  const shelfW = 3 * CARD_W + 2 * CARD_GAP;
  // With a shelf, landscape puts it right of the table and drops the row clear of the corner buttons; portrait gives
  // it its own row beneath the table and closes the gap above the bottom row so it stays above the pet.
  const tableY = portrait ? 230 : hasShelf ? 200 : 95 + COL_H / 2;
  const shelfY = portrait ? tableY + COL_H / 2 + 20 + CARD_H / 2 : tableY;
  const machineY = portrait
    ? (hasShelf ? shelfY + CARD_H / 2 + 40 : tableY + COL_H / 2 + 90) + BODY_H / 2
    : tableY + COL_H / 2 + 20 + BODY_H / 2;
  const rowY = portrait
    ? machineY + BODY_H / 2 + (hasShelf ? 60 : 120) + CAR_H / 2
    : machineY + BODY_H / 2 + 30 + 75;
  const tableLeft =
    !portrait && hasShelf ? Math.max(SHELF_ROW_LEFT, cx - (span + 20 + shelfW) / 2) : cx - span / 2;
  const columns = Array.from({ length: 5 }, (_, i) =>
    box(tableLeft + COL_W / 2 + i * (COL_W + colGap), tableY, COL_W, COL_H),
  );
  const shelfLeft = portrait ? cx - shelfW / 2 : tableLeft + span + 20;
  const shelf = hasShelf
    ? Array.from({ length: 3 }, (_, i) =>
        box(shelfLeft + CARD_W / 2 + i * (CARD_W + CARD_GAP), shelfY, CARD_W, CARD_H),
      )
    : [];
  const mw = HOPPER + BODY_W + CHUTE_W;
  const mx = cx - mw / 2;
  const hopper = box(mx + HOPPER / 2, machineY - 10, HOPPER, HOPPER);
  const body = box(mx + HOPPER + BODY_W / 2, machineY, BODY_W, BODY_H);
  const chute = box(mx + HOPPER + BODY_W + CHUTE_W / 2, machineY + 20, CHUTE_W, BODY_H - 40);
  // The bottom row keeps right of the pet in landscape; in portrait it sits above the pet's row and can centre.
  const trayW = 5 * CAR_W + 4 * CAR_GAP;
  const left = portrait ? cx - trayW / 2 : Math.max(190, cx - trayW / 2);
  const tray = Array.from({ length: 5 }, (_, i) =>
    box(left + CAR_W / 2 + i * (CAR_W + CAR_GAP), rowY, CAR_W, CAR_H),
  );
  const p = planFor(level).ask === 'look' ? PICTURE : PAD;
  const padsW = 3 * p + 2 * PAD_GAP;
  const padsCx = left + trayW / 2;
  const pads = Array.from({ length: 3 }, (_, i) =>
    box(padsCx - padsW / 2 + p / 2 + i * (p + PAD_GAP), rowY, p, p),
  );
  return {
    portrait,
    columns,
    hopper,
    body,
    chute,
    pads,
    tray,
    shelf,
    peek: box(body.x, body.y - 6, PEEK, PEEK),
    // Waiting things stand in the hopper's mouth (below the table); outputs land at the chute's far end.
    waitAt: { x: hopper.x, y: hopper.y + 10 },
    out: { x: chute.x + CHUTE_W / 2, y: machineY + BODY_H / 2 - 4 },
  };
}

/** A sticker's machine and its in → out pair, from the seed. */
export function stickerPair(seed: number): { input: number; b: number } {
  const n = Math.abs(Math.floor(seed));
  return { input: 1 + (n % 4), b: 1 + ((n >> 2) % 2) };
}
