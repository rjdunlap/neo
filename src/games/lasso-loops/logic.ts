import type { Rng } from '../../engine/random';
import type { BandLevels } from '../../progress/difficulty';

/**
 * Lasso Loops, after Montessori golden beads, ten frames and Pokémon Ranger's capture loop: draw a loop around
 * fireflies and they fly into a jar together, one loop for one group. The ladder goes from looping any fireflies,
 * to exactly two or three, to jars of five and of ten (counting the jars and the ones left over, so 34 is three
 * tens and four), to equal groups ("3 groups of 4") as the first idea of multiplying. At the top she makes a number
 * herself: a sign says 23, a loop of ten fills a jar, a smaller loop rests on the leaf, and ten on the leaf fly into a jar.
 */
export type LassoMode = 'free' | 'exact' | 'fives' | 'tens' | 'groups' | 'make';

export interface LassoPlan {
  mode: LassoMode;
  guess?: boolean;
  /** Level 7: rule out the numbers that cannot be right before the tens round checks the one that stays. */
  range?: boolean;
  name: string;
}

export const PLANS: LassoPlan[] = [
  { mode: 'free', name: 'Draw loops around fireflies: each loop flies into a jar' },
  { mode: 'exact', name: 'Loop exactly 2 or 3 fireflies for each jar' },
  { mode: 'fives', name: 'Jars of 5: loop fives, then count by fives and the ones left over' },
  { mode: 'tens', name: 'Jars of 10: loop tens, then say the number (14, 30 or 34: tens and ones)' },
  { mode: 'groups', name: 'Equal groups: make 3 groups of 4, then say how many in all' },
  {
    mode: 'tens',
    guess: true,
    name: 'About how many? Guess, loop one jar of 10, keep or change the guess, then loop the tens and say the number',
  },
  {
    mode: 'tens',
    range: true,
    name: 'Too few, too many: loop one jar of 10, tap away the numbers that cannot be right, then loop the tens and say the number',
  },
  {
    mode: 'make',
    name: 'Make the number: catch 23 as jars of 10 and ones on the leaf, then tap the tick',
  },
];

export const LEVELS: BandLevels = {
  preschool: { min: 1, max: 3 },
  prek: { min: 2, max: 4 },
  school: { min: 3, max: 8 },
};

export const planFor = (level: number) => PLANS[Math.min(PLANS.length, Math.max(1, level)) - 1];

export interface LassoRound {
  fireflies: number;
  /** How many each jar wants, in order; 0 on the free level (any loop fills the next jar). */
  jars: number[];
  /** The total to say at the end, or null when there's no question. */
  answer: number | null;
  /** Fireflies left over after the jars are full (fives and tens); 0 means none, and no leaf is drawn. */
  ones: number;
  group?: { count: number; size: number };
  /** Level 8: the number on the sign, to catch as jars of ten and ones on the leaf. */
  target?: number;
}

/** Whether the round has a leaf: where the ones rest, and at level 8 where every loop of fewer than ten lands. */
export const hasLeaf = (round: LassoRound) => round.ones > 0 || round.target !== undefined;

export function makeRound(plan: LassoPlan, rng: Rng): LassoRound {
  switch (plan.mode) {
    case 'free':
      // Six jars is what fits beside the pet in portrait; any loop fills the next one.
      return { fireflies: rng.int(6, 9), jars: [0, 0, 0, 0, 0, 0], answer: null, ones: 0 };
    case 'exact': {
      const jars = rng.shuffle([2, 3, rng.pick([2, 3])]);
      return { fireflies: jars.reduce((s, n) => s + n, 0) + 2, jars, answer: null, ones: 0 };
    }
    case 'fives': {
      // 6–19, and about one round in five comes out even (10 or 15) with nothing for the leaf.
      const fives = rng.int(1, 3);
      const ones = fives > 1 && rng.chance(0.2) ? 0 : rng.int(1, 4);
      return { fireflies: 5 * fives + ones, jars: Array(fives).fill(5), answer: 5 * fives + ones, ones };
    }
    case 'tens': {
      // Estimation (levels 6 and 7) keeps its own 21–39 round, drawn exactly as before.
      if (plan.guess || plan.range) {
        const tens = rng.int(2, 3);
        const ones = rng.int(1, 9);
        return { fireflies: 10 * tens + ones, jars: Array(tens).fill(10), answer: 10 * tens + ones, ones };
      }
      // A teen (one jar), a decade (nothing on the leaf) or 21–39.
      const kind = rng.pick(['teen', 'decade', 'mixed', 'mixed'] as const);
      const tens = kind === 'teen' ? 1 : rng.int(2, 3);
      const ones = kind === 'decade' ? 0 : rng.int(1, 9);
      return { fireflies: 10 * tens + ones, jars: Array(tens).fill(10), answer: 10 * tens + ones, ones };
    }
    case 'make': {
      // 13–36 with at least three fireflies to spare, so stopping is hers to decide; never more than the meadow's 39.
      const target = rng.int(MAKE_MIN, MAKE_MAX);
      const fireflies = Math.min(MEADOW_MAX, target + rng.int(3, 7));
      return { fireflies, jars: Array(MAKE_JARS).fill(10), answer: null, ones: 0, target };
    }
    case 'groups': {
      for (;;) {
        const count = rng.int(2, 4);
        const size = rng.int(2, 5);
        if (count * size > 16 || count * size < 6) continue;
        return {
          fireflies: count * size + rng.int(2, 3),
          jars: Array(count).fill(size),
          answer: count * size,
          ones: 0,
          group: { count, size },
        };
      }
    }
  }
}

/** Three answers to choose from: the right one and two mistakes that make sense to look at. */
export function choices(round: LassoRound, rng: Rng): number[] {
  const n = round.answer!;
  const out = new Set([n]);
  const tens = Math.floor(n / 10);
  const ones = n % 10;
  const tries = [
    // Tens and ones swapped (34 and 43) when both are there, and one ten more or less.
    tens > 0 && ones > 0 && ones !== tens ? ones * 10 + tens : -1,
    n + 10,
    n - 10,
    // Off by one, or by one group.
    n + 1,
    n - 1,
    round.group ? n + round.group.size : -1,
    round.group ? n - round.group.size : -1,
  ].filter((v) => v > 0 && v !== n);
  for (const v of rng.shuffle(tries)) {
    if (out.size >= 3) break;
    out.add(v);
  }
  return rng.shuffle([...out]);
}

/** Widely separated estimates, with one nearest-ten benchmark. No estimate is scored. */
export function guessCards(n: number, rng: Rng): { cards: number[]; near: number } {
  const near = 10 * Math.floor((n + 5) / 10);
  const high = Array.from({ length: 9 }, (_, i) => (i + 1) * 10).filter((v) => v >= 2 * n);
  const far = rng.pick([true, false]) ? [10, rng.pick(high)] : rng.shuffle(high).slice(0, 2);
  return { cards: [near, ...far].sort((a, b) => a - b), near };
}

/** Level 7's shelf: the full jar of ten and room for three more, so anything over 10 and up to 40 could be right. */
export const SHELF_JARS = 4;

/** Which side of the shelf's range a number card falls on: too few, too many, or one that could be right. */
export function rangeSide(g: number): 'few' | 'many' | 'possible' {
  return g <= 10 ? 'few' : g > 10 * SHELF_JARS ? 'many' : 'possible';
}

/**
 * Level 7's five cards, ascending: the near ten (the one that could be right), one or two too few from {5, 10} and the
 * rest too many from {50, …, 90}. The possible card is second or third, so its place gives nothing away.
 */
export function rangeCards(n: number, rng: Rng): { cards: number[]; possible: number } {
  const possible = 10 * Math.floor((n + 5) / 10);
  const low = rng.int(1, 2);
  const few = low === 2 ? [5, 10] : [rng.pick([5, 10])];
  const many = rng.shuffle([50, 60, 70, 80, 90]).slice(0, 4 - low);
  return { cards: [...few, possible, ...many].sort((a, b) => a - b), possible };
}

export function compareGuess(g: number, n: number): 'close' | 'more' | 'fewer' {
  return Math.abs(g - n) < 10 ? 'close' : g < n ? 'more' : 'fewer';
}

// Level 8, Make the number -----------------------------------------------------------------------

export const MAKE_MIN = 13;
export const MAKE_MAX = 36;
export const MAKE_JARS = 3;
/** The most fireflies a meadow holds with a finger's lane between them (the dive's space note). */
export const MEADOW_MAX = 39;

/** What she has caught at level 8: full jars of ten and fewer than ten on the leaf. */
export interface MakeState {
  jars: number;
  leaf: number;
}

export const makeTotal = (s: MakeState) => 10 * s.jars + s.leaf;

/**
 * What a loop around `got` free fireflies does at level 8. More than ten is let go (no jar holds them); exactly ten fill
 * the next jar; fewer rest on the leaf, and when the leaf would reach ten, ten of them fly into the next jar (`regroup`).
 * `full` is a loop with no jar left for its ten, which a meadow of at most 39 never allows (a rule test says so).
 */
export function makeLoop(
  s: MakeState,
  got: number,
): { kind: 'over' | 'full' } | { kind: 'jar' | 'leaf' | 'regroup'; next: MakeState } {
  if (got > 10) return { kind: 'over' };
  if (got === 10)
    return s.jars < MAKE_JARS ? { kind: 'jar', next: { jars: s.jars + 1, leaf: s.leaf } } : { kind: 'full' };
  if (s.leaf + got < 10) return { kind: 'leaf', next: { jars: s.jars, leaf: s.leaf + got } };
  return s.jars < MAKE_JARS
    ? { kind: 'regroup', next: { jars: s.jars + 1, leaf: s.leaf + got - 10 } }
    : { kind: 'full' };
}

/** Which count-aloud line fits what the jars and the leaf hold (a wrong tick): the suffix of `lasso.make-count-…`. */
export function makeCountLine(s: MakeState): 'none' | 'ones' | 'jar' | 'teen' | 'tens' | 'both' {
  if (!s.jars) return s.leaf ? 'ones' : 'none';
  if (s.jars === 1) return s.leaf ? 'teen' : 'jar';
  return s.leaf ? 'both' : 'tens';
}

/**
 * The part to change after a second wrong tick, always a step that can be taken and that ends at the number:
 * short by ten or more, loop ten for the next jar; short by fewer, loop exactly that many more (they regroup by
 * themselves if the leaf fills); over by ten or more, or over with an empty leaf, let a jar go; otherwise let the leaf go.
 */
export function makeHint(
  target: number,
  s: MakeState,
): { part: 'jar-add' | 'jar-remove' | 'leaf-remove' } | { part: 'more'; d: number } | null {
  const gap = target - makeTotal(s);
  if (gap === 0) return null;
  if (gap >= 10) return { part: 'jar-add' };
  if (gap > 0) return { part: 'more', d: gap };
  return gap <= -10 || !s.leaf ? { part: 'jar-remove' } : { part: 'leaf-remove' };
}

/** The ghost finger's next loop at level 8: tens first, then the ones; 0 when the number is made (tap the tick). */
export function makeNext(target: number, s: MakeState): number {
  const gap = target - makeTotal(s);
  return gap >= 10 ? 10 : Math.max(0, gap);
}

// Firefly places and loops ------------------------------------------------------------------------

export interface Point {
  x: number;
  y: number;
}

/** Spots on a jittered grid in the unit square, one firefly per cell, so loops have room to go between them. */
export function scatter(n: number, rng: Rng, cols: number, rows: number): Point[] {
  const cells = rng.shuffle(Array.from({ length: cols * rows }, (_, i) => i)).slice(0, n);
  return cells.map((c) => ({
    x: ((c % cols) + 0.5 + rng.range(-0.22, 0.22)) / cols,
    y: (Math.floor(c / cols) + 0.5 + rng.range(-0.22, 0.22)) / rows,
  }));
}

/** The grid for `n` fireflies: wide rather than tall, with spare cells; `tall` turns it for a field taller than wide. */
export function gridFor(n: number, tall = false): { cols: number; rows: number } {
  const rows = n <= 10 ? 3 : n <= 20 ? 4 : 5;
  const cols = Math.ceil((n * 1.15) / rows);
  return tall ? { cols: rows, rows: cols } : { cols, rows };
}

/** Whether the fireflies' grid is turned: an upright phone whose field is taller than wide. */
export const tallField = (L: { upright: boolean; field: { w: number; h: number } }) =>
  L.upright && L.field.h > L.field.w;

/** Whether a point is inside the (closed) loop, by counting crossings. */
export function inside(loop: readonly Point[], p: Point): boolean {
  let hit = false;
  for (let i = 0, j = loop.length - 1; i < loop.length; j = i++) {
    const a = loop[i];
    const b = loop[j];
    if (a.y > p.y !== b.y > p.y && p.x < ((b.x - a.x) * (p.y - a.y)) / (b.y - a.y) + a.x) hit = !hit;
  }
  return hit;
}

/** A group of `n` free fireflies close together, to glow as a hint: the first one's nearest neighbors. */
export function nearestGroup(points: readonly Point[], free: readonly number[], n: number): number[] {
  if (free.length < n) return [];
  const seed = [...free].sort((a, b) => points[a].x - points[b].x || points[a].y - points[b].y)[0];
  return [...free]
    .sort(
      (a, b) =>
        Math.hypot(points[a].x - points[seed].x, points[a].y - points[seed].y) -
        Math.hypot(points[b].x - points[seed].x, points[b].y - points[seed].y),
    )
    .slice(0, n);
}

export interface DemoLoop {
  indices: number[];
  loop: Point[];
}

/**
 * Find an axis-aligned loop around exactly `n` fireflies. The scatter uses one firefly per
 * cell, so a consecutive run from either axis normally leaves a generous lane for the finger.
 */
export function demoLoop(points: readonly Point[], n: number, padding = 0.02): DemoLoop | null {
  if (n < 1 || n > points.length) return null;
  const all = points.map((_, i) => i);
  const candidates: number[][] = [];
  const addWindows = (order: number[]) => {
    for (let i = 0; i + n <= order.length; i++) candidates.push(order.slice(i, i + n));
  };
  addWindows([...all].sort((a, b) => points[a].x - points[b].x || points[a].y - points[b].y));
  addWindows([...all].sort((a, b) => points[a].y - points[b].y || points[a].x - points[b].x));
  for (const seed of all) {
    candidates.push(
      [...all]
        .sort(
          (a, b) =>
            Math.hypot(points[a].x - points[seed].x, points[a].y - points[seed].y) -
            Math.hypot(points[b].x - points[seed].x, points[b].y - points[seed].y),
        )
        .slice(0, n),
    );
  }
  for (const scale of [1, 0.75, 0.5, 0.25, 0.1])
    for (const indices of candidates) {
      const chosen = indices.map((i) => points[i]);
      const pad = padding * scale;
      const x0 = Math.min(...chosen.map((p) => p.x)) - pad;
      const x1 = Math.max(...chosen.map((p) => p.x)) + pad;
      const y0 = Math.min(...chosen.map((p) => p.y)) - pad;
      const y1 = Math.max(...chosen.map((p) => p.y)) + pad;
      const loop = [
        { x: x0, y: y0 },
        { x: x1, y: y0 },
        { x: x1, y: y1 },
        { x: x0, y: y1 },
      ];
      const got = all.filter((i) => inside(loop, points[i]));
      if (got.length === n && indices.every((i) => got.includes(i))) return { indices: got, loop };
    }
  return null;
}

// Where things stand ------------------------------------------------------------------------------

export const JAR_W = 108;
export const JAR_H = 150;
/** A jar's number badge reaches this far above its rim. */
export const JAR_TAG = 72;
/** A firefly's glow, from its middle. */
export const FIREFLY_R = 32;
/** The touch boxes of an answer pad (round) and an estimate sign. */
export const PAD_HIT = 140;
export const GUESS_HIT = { w: 150, h: 130 };
/** Level 7's smaller number cards, five to a row. */
export const RANGE_HIT = { w: 130, h: 130 };
/** Level 8's tick (a round button) and the leaf she taps to let its fireflies go. */
export const DONE_R = 56;
export const DONE_HIT = 2 * (DONE_R + 14);
export const LEAF_HIT = { w: 180, h: 104 };
/** Where the k-th firefly rests on the leaf, from the leaf's middle: five to a row. */
export const leafSlot = (k: number): Point => ({ x: -60 + (k % 5) * 30, y: -14 - Math.floor(k / 5) * 30 });

export interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface LassoLayout {
  /** A phone held upright: much taller than wide. Six jars stand in two rows and the changed-guess signs get their own row. */
  upright: boolean;
  /** Where firefly middles scatter (corner-anchored). */
  field: Box;
  /** Where a loop may be drawn (corner-anchored). */
  sky: Box;
  /** Each jar's foot, middle of its base. */
  jars: Point[];
  leaf: Point;
  /** The three answer pads, by their middles. */
  pads: Point[];
  /** The three estimate signs: the first guess, and the keep-or-change guess beside the first jar. */
  guessFirst: Point[];
  guessRevise: Point[];
  sign: Point;
  /** Level 7: the full jar's foot and three empty jar outlines beside it, on the jar line. */
  shelf: Point[];
  /** Level 7: the five number cards' middles. */
  rangeCards: Point[];
  /** Level 8: the tick, above the leaf. */
  done: Point;
}

/** `n` places from `left` to `right`, centered, at most `gap` apart (the shell's `spread`, kept here so the rules stay Pixi-free). */
function row(n: number, left: number, right: number, gap: number): number[] {
  const step = Math.min(gap, (right - left) / Math.max(1, n));
  const start = (left + right) / 2 - (step * (n - 1)) / 2;
  return Array.from({ length: n }, (_, i) => start + i * step);
}

/**
 * The one layout the scene and its tests read. Sideways and on a tablet it is the long-standing one: a field right of the
 * corner buttons, a row of jars along the bottom right of the pet, the leaf in the bottom-right corner. Upright (768 wide
 * and at least 1.4 times as tall) the same, except that six jars, too many for one row at 768, stand in two rows of three,
 * and level 6's keep-or-change signs sit in their own row above the jar instead of squeezing beside it; the field ends above
 * whichever is there. Level 8 (`make`) adds the tick: beside the leaf on a wide view, above it (with a shorter field) on a narrow one.
 */
export function lassoLayout(
  v: { w: number; h: number },
  jars: number,
  leaf: boolean,
  guess = false,
  range = false,
  make = false,
): LassoLayout {
  // Level 7's field is level 6's, so the fireflies stay put from the cards to the count.
  guess ||= range;
  const upright = v.h > v.w * 1.4;
  const twoRows = upright && jars > 4;
  const jarRight = v.w - (leaf ? 210 : 40);
  // Level 8's tick: on the jar line between the jars and the leaf where the row has room for it (a view about 980 wide);
  // otherwise above the leaf, where the field's lower right corner was, and the field ends above it.
  const doneInRow = make && !upright && jarRight - 190 >= jars * 140 + DONE_HIT + 20;
  const jarEnd = doneInRow ? jarRight - DONE_HIT - 10 : jarRight;
  const done = doneInRow
    ? { x: jarRight - 10 - DONE_HIT / 2, y: v.h - 100 }
    : { x: v.w - 120, y: v.h - 166 - DONE_HIT / 2 };
  const xs = twoRows ? row(Math.ceil(jars / 2), 190, jarRight, 140) : row(jars, 190, jarEnd, 140);
  const rowUp = JAR_H + JAR_TAG + 28;
  const feet = xs.length;
  const jarSpots = Array.from({ length: jars }, (_, i) => ({
    x: xs[i % feet],
    // The first jars to fill stand in the upper row.
    y: v.h - 30 - (twoRows && i < feet ? rowUp : 0),
  }));
  let fieldH = v.h - 96 - JAR_H - 120;
  if (twoRows) fieldH -= rowUp + FIREFLY_R;
  else if (upright && guess) fieldH -= GUESS_HIT.h + 20 + FIREFLY_R;
  // A tall field can spare the strip where the lowest firefly's glow met a jar's number badge.
  else if (upright) fieldH -= 24;
  if (make && !doneInRow) fieldH = Math.min(fieldH, done.y - DONE_HIT / 2 - FIREFLY_R - 96);
  const field = { x: 160, y: 96, w: v.w - 210, h: fieldH };
  const reviseY = v.h - 30 - JAR_H - JAR_TAG - 20 - GUESS_HIT.h / 2;
  return {
    upright,
    field,
    sky: { x: 0, y: 0, w: v.w, h: v.h - JAR_H - 40 },
    jars: jarSpots,
    leaf: { x: v.w - 120, y: v.h - 90 },
    pads: [-1, 0, 1].map((i) => ({ x: v.w / 2 + i * 180, y: field.y + field.h * 0.45 })),
    guessFirst: row(3, 190, v.w - 40, 160).map((x) => ({ x, y: v.h - 100 })),
    guessRevise:
      upright && guess
        ? row(3, 40, v.w - 40, 200).map((x) => ({ x, y: reviseY }))
        : row(3, (jarSpots[0]?.x ?? 40) + 150, v.w - 40, 160).map((x) => ({ x, y: v.h - 100 })),
    sign: { x: v.w - 110, y: 58 },
    // The leaf is not out yet while the shelf shows, so the shelf may run to the right edge (four jars fit at 768 wide).
    shelf: row(4, 190, v.w - 40, 140).map((x) => ({ x, y: v.h - 30 })),
    // Upright the cards stand in level 6's keep-or-change row; sideways the field cannot lose a row, so they stand over it
    // at the answer pads' height while loops are off.
    rangeCards: upright
      ? row(5, 40, v.w - 40, 170).map((x) => ({ x, y: reviseY }))
      : // A field too narrow for five apart (a 768-wide tablet) lends the cards the view's width.
        (field.w >= 5 * RANGE_HIT.w
          ? row(5, field.x, field.x + field.w, 180)
          : row(5, 40, v.w - 40, 170)
        ).map((x) => ({ x, y: field.y + field.h * 0.45 })),
    done,
  };
}
