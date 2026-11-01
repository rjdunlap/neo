/**
 * Spinner Fair rules: six-wedge spinners whose spins are honest seeded draws, and questions the spinner's picture answers.
 * A spin is never a miss; only a question decides one: which bar is tallest after the spins (level 2) and which of two
 * spinners has more of the pet's favourite (level 3), whether the favourite is sure, maybe or no way on a spinner (level 4), and
 * whether a two-critter race is fair and the wheel is even at Check (level 5).
 * Definition: docs/definitions/spinner-fair.md.
 */
import type { Rng } from '../../engine/random';
import type { BandLevels } from '../../progress/difficulty';

export type Kind = 'duck' | 'pig' | 'bunny' | 'cat' | 'cow' | 'dog';
export const KINDS: readonly Kind[] = ['duck', 'pig', 'bunny', 'cat', 'cow', 'dog'];
/** Each critter's body colour (the same as `CRITTERS`; a test compares them). Two critters of one colour never share a wheel. */
export const COLOR_OF: Record<Kind, string> = { duck: 'yellow', pig: 'pink', bunny: 'white', cat: 'orange', cow: 'white', dog: 'brown' };
export const NAME_OF: Record<Kind, string> = { duck: 'Duck', pig: 'Pig', bunny: 'Bunny', cat: 'Cat', cow: 'Cow', dog: 'Dog' };

/** Every spinner has six wedges of 60°, each owner's wedges one contiguous section from wedge 0. */
export const WEDGES = 6;
export const WEDGE_DEG = 360 / WEDGES;
/** A stop lands at least this far inside its wedge, so the pointer never rests on a line. */
export const EDGE_DEG = 12;
export type Wheel = readonly Kind[];

export type Ask = 'see' | 'most' | 'pick' | 'sure' | 'fair';
export interface Plan {
  level: number;
  ask: Ask;
  name: string;
  /** Sets (levels 1–2, 4), picks (level 3) or races (level 5) in a round. */
  sets: number;
  /** Spins in a set (level 4: one showing spin per spinner; level 5: the race); the spinner stops taking spins after this many. */
  spins: number;
}

const PLANS: readonly Plan[] = [
  { level: 1, ask: 'see', name: 'Spin and see', sets: 1, spins: 6 },
  { level: 2, ask: 'most', name: 'Which came up most?', sets: 2, spins: 8 },
  { level: 3, ask: 'pick', name: 'Pick the spinner', sets: 2, spins: 10 },
  { level: 4, ask: 'sure', name: 'Sure, maybe, no way', sets: 2, spins: 1 },
  { level: 5, ask: 'fair', name: 'Fair or unfair?', sets: 2, spins: 6 },
];

export const LEVELS: BandLevels = {
  preschool: { min: 1, max: 2 },
  prek: { min: 2, max: 3 },
  school: { min: 3, max: 5 },
};

export function planFor(level: number): Plan {
  return PLANS.find((p) => p.level === level) ?? PLANS[0];
}

/** Level 3's favourite wedge counts on the two spinners: a gap of at least two wedges, possible on both, certain on neither. */
export const PICK_PAIRS: readonly (readonly [number, number])[] = [[1, 3], [1, 4], [1, 5], [2, 4], [2, 5], [3, 5]];

export interface SetSpec {
  /** One spinner (levels 1–2, 5), two side by side (level 3) or three in a row (level 4). */
  wheels: Wheel[];
  /** Levels 3–4: the pet's favourite; level 3: the spinner (0 or 1) with more of it. */
  favourite?: Kind;
  better?: number;
  /** Level 4: the three cards in the tray, left to right. */
  cards?: Card[];
  /** Level 5: the two racers; the wheel holds the first's wedges, then the second's. */
  racers?: [Kind, Kind];
}

// ---- wheels ----

/** `n` critters, no two of one kind or one colour, none in `avoid`. */
export function pickCritters(rng: Rng, n: number, avoid: readonly Kind[] = []): Kind[] {
  const out: Kind[] = [];
  const pool = rng.shuffle(KINDS.filter((k) => !avoid.includes(k)));
  for (const k of pool) {
    if (out.length === n) break;
    if (out.some((o) => COLOR_OF[o] === COLOR_OF[k])) continue;
    if (avoid.some((o) => COLOR_OF[o] === COLOR_OF[k])) continue;
    out.push(k);
  }
  return out;
}

/** Three critters, two wedges each. */
export function evenWheel(rng: Rng): Wheel {
  const [a, b, c] = pickCritters(rng, 3);
  return [a, a, b, b, c, c];
}

/** A wheel with `count` wedges of `fav` and the rest shared by one or two other critters. */
export function wheelWith(rng: Rng, fav: Kind, count: number): Wheel {
  const rest = WEDGES - count;
  const split = rest >= 2 && rng.chance(0.5);
  const others = pickCritters(rng, split ? 2 : 1, [fav]);
  const k = split ? rng.int(1, rest - 1) : rest;
  return [...Array(count).fill(fav), ...Array(k).fill(others[0]), ...(split ? Array(rest - k).fill(others[1]) : [])];
}

/** Level 4: six of the favourite, some (2–4), and none (one or two other critters), in a seeded order. */
export function sureSet(rng: Rng, fav: Kind): SetSpec {
  const none = (): Wheel => {
    const others = pickCritters(rng, rng.chance(0.5) ? 2 : 1, [fav]);
    if (others.length === 1) return Array(WEDGES).fill(others[0]);
    const k = rng.int(2, 4);
    return [...Array(k).fill(others[0]), ...Array(WEDGES - k).fill(others[1])];
  };
  const wheels = rng.shuffle([Array(WEDGES).fill(fav) as Wheel, wheelWith(rng, fav, rng.int(2, 4)), none()]);
  return { wheels, favourite: fav, cards: rng.shuffle([...CARDS]) };
}

/** Level 5: two racers sharing one wheel. Race 1 starts uneven (4–2 or 5–1); race 2 is fair or uneven, seeded. */
export function raceSet(rng: Rng, first: boolean): SetSpec {
  const racers = pickCritters(rng, 2) as [Kind, Kind];
  const big = first || rng.chance(0.5) ? rng.pick([4, 5]) : 3;
  const a = rng.chance(0.5) ? big : WEDGES - big;
  return { wheels: [raceWheel(racers, a)], racers };
}

export function makeRound(level: number, rng: Rng): SetSpec[] {
  const plan = planFor(level);
  const out: SetSpec[] = [];
  for (let i = 0; i < plan.sets; i++) {
    if (plan.ask === 'sure') {
      const fav = pickCritters(rng, 1, out.map((s) => s.favourite!))[0] ?? pickCritters(rng, 1)[0];
      out.push(sureSet(rng, fav));
      continue;
    }
    if (plan.ask === 'fair') { out.push(raceSet(rng, i === 0)); continue; }
    if (plan.ask !== 'pick') { out.push({ wheels: [evenWheel(rng)] }); continue; }
    const [a, b] = rng.pick(PICK_PAIRS);
    const flip = rng.chance(0.5);
    const counts = flip ? [b, a] : [a, b];
    const favourite = pickCritters(rng, 1, out.map((s) => s.favourite!))[0] ?? pickCritters(rng, 1)[0];
    out.push({ wheels: counts.map((c) => wheelWith(rng, favourite, c)), favourite, better: flip ? 0 : 1 });
  }
  return out;
}

export const countOf = (wheel: Wheel, kind: Kind) => wheel.filter((k) => k === kind).length;

/** The wheel's sections in order: each critter's first wedge and how many wedges it has. */
export function sections(wheel: Wheel): { kind: Kind; start: number; count: number }[] {
  const out: { kind: Kind; start: number; count: number }[] = [];
  wheel.forEach((k, i) => {
    const last = out[out.length - 1];
    if (last && last.kind === k) last.count++;
    else out.push({ kind: k, start: i, count: 1 });
  });
  return out;
}

/** The critters of a wheel in section order: one bar each. */
export const kindsOf = (wheel: Wheel): Kind[] => sections(wheel).map((s) => s.kind);

/** Each owner's wedges form one section (no critter appears in two sections). */
export function contiguous(wheel: Wheel): boolean {
  const kinds = kindsOf(wheel);
  return new Set(kinds).size === kinds.length;
}

/** The spinner with more of the favourite (level 3's right answer, judged by the picture). */
export function betterOf(set: SetSpec): number {
  const [a, b] = set.wheels.map((w) => countOf(w, set.favourite!));
  return a > b ? 0 : 1;
}

// ---- level 4: sure, maybe, no way ----

export type Card = 'sure' | 'maybe' | 'none';
export const CARDS: readonly Card[] = ['sure', 'maybe', 'none'];

/** The card a spinner fits for a critter: all six wedges is sure, none is no way, anything between is maybe. */
export function cardFor(wheel: Wheel, kind: Kind): Card {
  const n = countOf(wheel, kind);
  return n === WEDGES ? 'sure' : n === 0 ? 'none' : 'maybe';
}

export const fits = (card: Card, wheel: Wheel, kind: Kind) => cardFor(wheel, kind) === card;

/** The spinner (index) each card fits on a level-4 set. */
export const homeOf = (set: SetSpec, card: Card) => set.wheels.findIndex((w) => fits(card, w, set.favourite!));

// ---- level 5: fair or unfair? ----

/** The racers' wheel: `a` wedges of the first racer, then the rest of the second, so each owner is one section. */
export const raceWheel = (racers: readonly [Kind, Kind], a: number): Wheel =>
  [...Array(a).fill(racers[0]), ...Array(WEDGES - a).fill(racers[1])];

/** Fair means both racers have the same share: three wedges each. */
export const isFair = (wheel: Wheel, racers: readonly [Kind, Kind]) => countOf(wheel, racers[0]) === countOf(wheel, racers[1]);

/**
 * Hand one wedge to `to` from the other racer; the wheel re-sorts so each owner stays one section. A racer always keeps at
 * least one wedge (so both stay on the wheel); a give that would take the last one returns null and changes nothing.
 */
export function give(wheel: Wheel, racers: readonly [Kind, Kind], to: Kind): Wheel | null {
  const from = to === racers[0] ? racers[1] : racers[0];
  if (countOf(wheel, from) <= 1) return null;
  return raceWheel(racers, countOf(wheel, racers[0]) + (to === racers[0] ? 1 : -1));
}

/** The racer the next wedge should go to (the hint and the ghost): the one with fewer, or null once the wheel is fair. */
export function nextGive(wheel: Wheel, racers: readonly [Kind, Kind]): Kind | null {
  const [a, b] = racers.map((k) => countOf(wheel, k));
  return a === b ? null : a < b ? racers[0] : racers[1];
}

/** The track: a racer moves one step for each spin it wins. */
export const TRACK = 6;
export function racePositions(racers: readonly [Kind, Kind], results: readonly Kind[]): [number, number] {
  const [a, b] = tally(racers, results);
  return [Math.min(TRACK, a), Math.min(TRACK, b)];
}

// ---- spins ----

export interface Spin {
  /** The wedge under the pointer, 0–5, uniform over wedges. */
  wedge: number;
  /** Where it stops, in degrees clockwise from the wheel's wedge-0 edge, inside the wedge and clear of its lines. */
  angle: number;
}

/** One honest spin: a uniform wedge and a stopping angle at least `EDGE_DEG` inside it. Nothing filters or retries it. */
export function spin(rng: Rng): Spin {
  const wedge = rng.int(0, WEDGES - 1);
  const angle = wedge * WEDGE_DEG + EDGE_DEG + rng.next() * (WEDGE_DEG - 2 * EDGE_DEG);
  return { wedge, angle };
}

/** The wheel's rotation (radians, clockwise) that brings wheel angle `angle` under the top pointer after `turns` more whole turns from `from`. */
export function stopRotation(from: number, angle: number, turns: number): number {
  const target = (-angle * Math.PI) / 180;
  const full = Math.PI * 2;
  let r = target + Math.ceil((from - target) / full) * full;
  if (r <= from) r += full;
  return r + turns * full;
}

/** The wedge under the top pointer for a wheel turned by `rotation` radians. */
export function wedgeAt(rotation: number): number {
  const deg = ((((-rotation * 180) / Math.PI) % 360) + 360) % 360;
  return Math.floor(deg / WEDGE_DEG) % WEDGES;
}

/** Blocks per bar: how many times each of `kinds` came up in `results`. */
export function tally(kinds: readonly Kind[], results: readonly Kind[]): number[] {
  return kinds.map((k) => results.filter((r) => r === k).length);
}

/** Every bar with the most blocks (a tie keeps both). */
export function tallest(counts: readonly number[]): number[] {
  const max = Math.max(...counts);
  return counts.flatMap((c, i) => (c === max ? [i] : []));
}

// ---- layout (logical units; the pet keeps the bottom-left corner, the shell the top corners) ----

export interface Pt { x: number; y: number }
export interface Circle extends Pt { r: number }
export interface Box extends Pt { w: number; h: number }
export const BIG = 210, SMALL = 150, COL_W = 120, COL_GAP = 20, FACE = 70, BAR_H = 320, STAND = 50;

export interface Layout {
  portrait: boolean;
  /** The one spinner of levels 1–2, and level 3's after the pick. */
  spinner: Circle;
  /** Level 3's two spinners before the pick. */
  pair: [Circle, Circle];
  /** The pet's favourite, between the two spinners. */
  favourite: Box;
  /** The bars' baseline (under the blocks, above the faces). */
  base: number;
  /** One tap column per bar: from the face to the top of the tallest bar the set can make. */
  columns: Box[];
}

const box = (x: number, y: number, w: number, h: number): Box => ({ x, y, w, h });

export function layout(view: { w: number; h: number }, bars: number): Layout {
  const { w, h } = view;
  const portrait = h > w;
  const span = bars * COL_W + (bars - 1) * COL_GAP;
  const cols = (left: number, base: number) =>
    Array.from({ length: bars }, (_, i) => box(left + COL_W / 2 + i * (COL_W + COL_GAP), base - BAR_H / 2 + FACE / 2, COL_W, BAR_H + FACE));
  if (!portrait) {
    const cy = Math.max(140 + BIG, Math.min(h / 2 - 20, 350));
    const spinner = { x: 140 + BIG, y: cy, r: BIG };
    const base = cy + BIG + STAND - FACE;
    const left = Math.min(w - 40 - span, spinner.x + BIG + 70);
    const pcy = h / 2 - 10;
    return {
      portrait,
      spinner,
      pair: [{ x: w / 2 - SMALL - 50, y: pcy, r: SMALL }, { x: w / 2 + SMALL + 50, y: pcy, r: SMALL }],
      favourite: box(w / 2, pcy - SMALL - 20, 120, 120),
      base,
      columns: cols(left, base),
    };
  }
  const cx = w / 2;
  const spinner = { x: cx, y: 120 + BIG + 10, r: BIG };
  const base = h - 40 - FACE;
  return {
    portrait,
    spinner,
    pair: [{ x: cx - 40, y: 130 + SMALL, r: SMALL }, { x: cx - 40, y: 130 + SMALL * 3 + 110, r: SMALL }],
    favourite: box(Math.min(w - 90, cx + SMALL + 110), 130 + SMALL * 2 + 55, 120, 120),
    base,
    columns: cols(cx - span / 2 + 40, base),
  };
}

/** Level 4: three 240-unit spinners (each a drop zone), a slot under or beside each for its card, and the tray of three cards. */
export const MID = 120, CARD_W = 130, CARD_H = 150;
export interface SureLayout {
  portrait: boolean;
  spinners: Circle[];
  /** Where a card that fits sits, one per spinner. */
  slots: Box[];
  tray: Box[];
  /** The pet's favourite, in a bubble out of the way. */
  favourite: Box;
}

export function sureLayout(view: { w: number; h: number }): SureLayout {
  const { w, h } = view;
  const rim = MID + 8;
  if (h <= w) {
    // A row of spinners, each card's slot under its spinner, and the tray along the bottom.
    const cy = Math.min(320, h - 450);
    const mid = Math.min(w / 2 + 40, w - 140 - 2 * (rim + 12));
    const xs = [mid - 280, mid, mid + 280];
    const trayY = h - 20 - CARD_H / 2;
    return {
      portrait: false,
      spinners: xs.map((x) => ({ x, y: cy, r: MID })),
      slots: xs.map((x) => box(x, cy + rim + 2 + CARD_H / 2, CARD_W, CARD_H)),
      tray: [-170, 0, 170].map((dx) => box(mid + dx, trayY, CARD_W, CARD_H)),
      favourite: box(w - 30 - 55, trayY, 110, 110),
    };
  }
  // Upright: a column of spinners clear of the pet, each card's slot beside it, and the tray as a column on the right.
  const cx = Math.min(300, w - 428);
  const top = 160, bottom = h - 170 - rim;
  const ys = [top, (top + bottom) / 2, bottom];
  const trayX = w - 20 - CARD_W / 2;
  const trayTop = 130 + CARD_H / 2 + 10;
  return {
    portrait: true,
    spinners: ys.map((y) => ({ x: cx, y, r: MID })),
    slots: ys.map((y) => box(cx + rim + 10 + CARD_W / 2, y, CARD_W, CARD_H)),
    tray: [0, 1, 2].map((i) => box(trayX, trayTop + i * ((bottom - trayTop) / 2), CARD_W, CARD_H)),
    favourite: box(w - 30 - 55, h - 30 - 55, 110, 110),
  };
}

/** Level 5: one 420-unit spinner with its wedges, two racers on six-step tracks, and the fair, unfair and Check buttons. */
export const RACER = 140, BTN_W = 140, BTN_H = 110, CHECK_W = 130;
export interface RaceLayout {
  portrait: boolean;
  spinner: Circle;
  /** Each racer's box at step `s` of its track (0 = the start). */
  racerAt(i: number, s: number): Box;
  /** Each track's whole length, start to finish. */
  tracks: Box[];
  fair: Box;
  unfair: Box;
  check: Box;
}

export function raceLayout(view: { w: number; h: number }): RaceLayout {
  const { w, h } = view;
  const rim = BIG + 8;
  if (h <= w) {
    const cy = Math.min(350, h - 140 - rim);
    const spinner = { x: 140 + BIG, y: cy, r: BIG };
    const by = h - 20 - BTN_H / 2;
    const right = w - 30 - RACER / 2;
    const xs = [right - RACER - 30, right];
    const top = 140, bottom = h - 20;
    const step = (bottom - top - RACER) / TRACK;
    return {
      portrait: false,
      spinner,
      racerAt: (i, s) => box(xs[i], bottom - RACER / 2 - s * step, RACER, RACER),
      tracks: xs.map((x) => box(x, (top + bottom) / 2, RACER, bottom - top)),
      fair: box(220 + BTN_W / 2, by, BTN_W, BTN_H),
      unfair: box(220 + BTN_W * 1.5 + 20, by, BTN_W, BTN_H),
      check: box(220 + 2 * BTN_W + 40 + CHECK_W / 2, by, CHECK_W, BTN_H),
    };
  }
  const spinner = { x: w / 2, y: 120 + BIG, r: BIG };
  const ys = [spinner.y + rim + 10 + RACER / 2, spinner.y + rim + 20 + RACER * 1.5];
  const left = 30, right = w - 30;
  const step = (right - left - RACER) / TRACK;
  const by = h - 20 - BTN_H / 2;
  return {
    portrait: true,
    spinner,
    racerAt: (i, s) => box(left + RACER / 2 + s * step, ys[i], RACER, RACER),
    tracks: ys.map((y) => box((left + right) / 2, y, right - left, RACER)),
    fair: box(190 + BTN_W / 2, by, BTN_W, BTN_H),
    unfair: box(190 + BTN_W * 1.5 + 20, by, BTN_W, BTN_H),
    check: box(190 + 2 * BTN_W + 40 + CHECK_W / 2, by, CHECK_W, BTN_H),
  };
}

/** A sticker's spinner and its bar of spins, from the seed. */
export function stickerSet(seed: number): { wheel: Wheel; counts: number[] } {
  const n = Math.abs(Math.floor(seed));
  const kinds: Kind[][] = [['duck', 'pig', 'bunny'], ['cat', 'duck', 'cow'], ['pig', 'dog', 'duck'], ['bunny', 'cat', 'pig']];
  const [a, b, c] = kinds[n % kinds.length];
  const counts = [[3, 2, 1], [2, 3, 1], [1, 2, 3], [2, 1, 3]][(n >> 2) % 4];
  return { wheel: [a, a, b, b, c, c], counts };
}
