/**
 * Paint Mixer rules: drops from big pots into a bucket, judged against a small sample jar by an exact count rule.
 * The bucket's colour is the drop-weighted mean of the pot colours (equal ratios are exactly the same colour); the
 * drop rows inside the bucket are the proof (every row a copy of the sample's row, with its gaps and loose drops).
 * Levels 1–2 copy and double the row; level 3 fills to a line with a stray pot and the ratio table; level 4 takes any amount,
 * then the same colour at a different amount.
 * Definition: docs/definitions/paint-mixer.md.
 */
import type { Rng } from '../../engine/random';
import type { BandLevels } from '../../progress/difficulty';

export type Pot = 'red' | 'yellow' | 'blue' | 'white';
export const POTS: readonly Pot[] = ['red', 'yellow', 'blue', 'white'];

/** The pot paints, the palette's fills (a test compares them to `swatch`). */
export const POT_COLOR: Record<Pot, number> = { red: 0xf2545b, yellow: 0xffd54a, blue: 0x4fa3f7, white: 0xffffff };

export type Pair = readonly [Pot, Pot];
export type MixName = 'orange' | 'pink' | 'sky' | 'purple';
/** The authored pairs. The cream pair (yellow + white) waits on the iPad art check; blue + yellow averages to grey and is never authored. */
export const PAIRS: readonly { pair: Pair; name: MixName }[] = [
  { pair: ['red', 'yellow'], name: 'orange' },
  { pair: ['red', 'white'], name: 'pink' },
  { pair: ['blue', 'white'], name: 'sky' },
  { pair: ['red', 'blue'], name: 'purple' },
];

export interface Sample {
  pair: Pair;
  counts: readonly [number, number];
  /** Levels 3–4: a pot this sample doesn't use, on screen beside the pair, and where it stands (0 leftmost of three). */
  stray?: Pot;
  strayAt?: number;
}
export type Counts = Record<Pot, number>;
export type Kind = 'copy' | 'double' | 'line' | 'any';

export interface Plan {
  level: number;
  kind: Kind;
  name: string;
  /** Ratios written pot A : pot B in the pair's order. */
  pool: readonly (readonly [number, number])[];
  /** The bucket holds this many copies of the sample's row (levels 1–2; level 3 sets it by the sample, level 4 has no line). */
  batches: number;
  /** Buckets in a round, each with a sample from a different pair. */
  buckets: number;
  /** A whole multiple below the size is "more, the same way", not a miss. */
  moreSameWay: boolean;
}

export const CAP = 12;
export const BUCKETS_PER_ROUND = 2;
const WIDE_POOL: Plan['pool'] = [[1, 2], [2, 1], [1, 3], [3, 1], [2, 3], [3, 2]];

const PLANS: readonly Plan[] = [
  { level: 1, kind: 'copy', name: 'Copy the row', pool: [[1, 1], [1, 2], [2, 1]], batches: 1, buckets: BUCKETS_PER_ROUND, moreSameWay: false },
  { level: 2, kind: 'double', name: 'Twice as much', pool: [[1, 1], [1, 2], [2, 1], [1, 3]], batches: 2, buckets: BUCKETS_PER_ROUND, moreSameWay: true },
  { level: 3, kind: 'line', name: 'Fill to the line', pool: WIDE_POOL, batches: 0, buckets: BUCKETS_PER_ROUND, moreSameWay: true },
  // One sample, two ways: any amount, then the same colour at a different amount.
  { level: 4, kind: 'any', name: 'Any amount, two ways', pool: WIDE_POOL, batches: 0, buckets: 1, moreSameWay: false },
];

export const LEVELS: BandLevels = { school: { min: 1, max: 4 } };

export function planFor(level: number): Plan {
  return PLANS.find((p) => p.level === level) ?? PLANS[0];
}

export const total = (s: Sample) => s.counts[0] + s.counts[1];
/** The most whole copies of the sample the bucket's cap holds. */
export const maxMultiple = (s: Sample) => Math.floor(CAP / total(s));
/**
 * The bucket's size in copies of the sample's row: levels 1–2 the plan's; level 3's line is three batches for totals 3–4 and two
 * for total 5 (9, 12 or 10 drops); level 4 has no line (Infinity: any whole multiple matches).
 */
export function batchesFor(plan: Plan, s: Sample): number {
  if (plan.kind === 'line') return total(s) >= 5 ? 2 : 3;
  if (plan.kind === 'any') return Infinity;
  return plan.batches;
}
export const sizeFor = (plan: Plan, s: Sample) => batchesFor(plan, s) * total(s);
/** The pots on screen for a sample: the pair, and from level 3 the stray at its seeded place. */
export function potsFor(s: Sample): Pot[] {
  const out: Pot[] = [s.pair[0], s.pair[1]];
  if (s.stray) out.splice(Math.min(2, Math.max(0, s.strayAt ?? 2)), 0, s.stray);
  return out;
}
export const mixName = (pair: Pair): MixName => PAIRS.find((p) => p.pair[0] === pair[0] && p.pair[1] === pair[1])!.name;

export function emptyCounts(): Counts { return { red: 0, yellow: 0, blue: 0, white: 0 }; }

export function countsOf(drops: readonly Pot[]): Counts {
  const c = emptyCounts();
  for (const d of drops) c[d]++;
  return c;
}

/** The sample's counts as a full count vector. */
export function sampleCounts(s: Sample): Counts {
  const c = emptyCounts();
  c[s.pair[0]] = s.counts[0];
  c[s.pair[1]] = s.counts[1];
  return c;
}

// ---- rounds ----

/** One sample from the level's pool and an authored pair, avoiding `avoid`'s pair so a round's buckets differ. */
export function makeSample(level: number, rng: Rng, avoid?: Sample): Sample {
  const plan = planFor(level);
  const pairs = PAIRS.filter((p) => !avoid || p.pair[0] !== avoid.pair[0] || p.pair[1] !== avoid.pair[1]);
  const { pair } = pairs[rng.int(0, pairs.length - 1)];
  const counts = plan.pool[rng.int(0, plan.pool.length - 1)];
  if (plan.level < 3) return { pair, counts: [counts[0], counts[1]] };
  // Levels 3–4: one of the two pots the pair doesn't use stands beside it (cosmetic draws after the counts, so 1–2 are unchanged).
  const unused = POTS.filter((p) => p !== pair[0] && p !== pair[1]);
  return { pair, counts: [counts[0], counts[1]], stray: unused[rng.int(0, unused.length - 1)], strayAt: rng.int(0, 2) };
}

export function makeRound(level: number, rng: Rng): Sample[] {
  const plan = planFor(level);
  const out: Sample[] = [];
  for (let i = 0; i < plan.buckets; i++) out.push(makeSample(level, rng, out[i - 1]));
  return out;
}

// ---- colour ----

const toLinear = (c: number) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const toSrgb = (c: number) => (c <= 0.0031308 ? c * 12.92 : 1.055 * c ** (1 / 2.4) - 0.055);
const channels = (hex: number): [number, number, number] => [(hex >> 16) & 255, (hex >> 8) & 255, hex & 255];

/** The bucket's colour: the drop-weighted mean of the pot paints in linear RGB, as a hex colour (the empty bucket is undefined). */
export function mix(counts: Counts): number | undefined {
  let n = 0;
  const acc = [0, 0, 0];
  for (const pot of POTS) {
    const k = counts[pot];
    if (k <= 0) continue;
    const ch = channels(POT_COLOR[pot]);
    for (let i = 0; i < 3; i++) acc[i] += k * toLinear(ch[i] / 255);
    n += k;
  }
  if (n === 0) return undefined;
  const out = acc.map((v) => Math.round(Math.min(1, Math.max(0, toSrgb(v / n))) * 255));
  return (out[0] << 16) | (out[1] << 8) | out[2];
}

function oklab(hex: number): [number, number, number] {
  const [r, g, b] = channels(hex).map((v) => toLinear(v / 255));
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  return [
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  ];
}

/** Oklab distance ×100: about 1–2 is a just-noticeable step side by side. */
export function distance(c1: number, c2: number): number {
  const a = oklab(c1), b = oklab(c2);
  return 100 * Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
}

// ---- the drop rows ----

export interface Place { pot: Pot; filled: boolean }
export interface Rows {
  /** Rows of places in the sample's order: every complete batch, then a partial row when any of its places is filled. */
  rows: Place[][];
  complete: number;
  /** Drops outside any row: beyond the last allowed batch, beyond a row's share of a pot, or of a pot the sample does not use. */
  loose: Pot[];
}

/** Complete batches: the smallest whole number of the sample's row that every pot covers. */
export function completeBatches(s: Sample, counts: Counts): number {
  return Math.min(Math.floor(counts[s.pair[0]] / s.counts[0]), Math.floor(counts[s.pair[1]] / s.counts[1]));
}

/**
 * The bucket's picture as a pure function of the counts. `limit` is the bucket's size in batches (levels 1–3); drops beyond it
 * are loose. A bucket is in ratio exactly when there is no unfilled place and no loose drop.
 */
export function rows(s: Sample, counts: Counts, limit = Infinity): Rows {
  const k = Math.min(completeBatches(s, counts), limit);
  const out: Place[][] = [];
  const row = (): Place[] => [...Array(s.counts[0]).fill(s.pair[0]), ...Array(s.counts[1]).fill(s.pair[1])].map((pot: Pot) => ({ pot, filled: true }));
  for (let i = 0; i < k; i++) out.push(row());
  const loose: Pot[] = [];
  const partial: Place[] = [];
  let any = false;
  if (k < limit) {
    for (const i of [0, 1] as const) {
      const pot = s.pair[i], share = s.counts[i];
      const have = Math.min(share, counts[pot] - k * share);
      for (let j = 0; j < share; j++) partial.push({ pot, filled: j < have });
      if (have > 0) any = true;
      for (let j = (k + 1) * share; j < counts[pot]; j++) loose.push(pot);
    }
  } else {
    for (const i of [0, 1] as const) for (let j = k * s.counts[i]; j < counts[s.pair[i]]; j++) loose.push(s.pair[i]);
  }
  if (any) out.push(partial);
  for (const pot of POTS) if (pot !== s.pair[0] && pot !== s.pair[1]) for (let j = 0; j < counts[pot]; j++) loose.push(pot);
  return { rows: out, complete: k, loose };
}

/** Whether the last drop poured sits loose (then Undo fixes it; a buried loose drop needs Tip out). */
export function lastIsLoose(s: Sample, drops: readonly Pot[], limit = Infinity): boolean {
  const last = drops[drops.length - 1];
  if (!last) return false;
  const counts = countsOf(drops);
  if (last !== s.pair[0] && last !== s.pair[1]) return true;
  const i = last === s.pair[0] ? 0 : 1;
  const k = Math.min(completeBatches(s, counts), limit);
  const allowed = Math.min(k + 1, limit) * s.counts[i];
  return counts[last] > allowed;
}

// ---- the bucket's picture and the ratio table ----

export interface Drawn { pot: Pot; filled: boolean; loose: boolean; x: number; y: number }
export interface Picture {
  drops: Drawn[];
  /** Level 3's fill line, in the bucket's coordinates (the top of the line's rows); null without a line. */
  line: number | null;
}

/** Loose drops wrap in rows of six. */
const LOOSE_ROW = 6;

/**
 * Where every drop and empty place sits inside the bucket, as a pure function of the counts. Levels 1–2 pre-draw every place of
 * the bucket's rows, top down, with loose drops below. Level 3 stacks rows from the bottom up to the fill line, drawing a row's
 * places when its first drop arrives, with loose drops above the line. Level 4 draws started rows top down, loose drops after;
 * it reserves room for the most copies the cap holds so rows don't jump as they are added.
 */
export function picture(plan: Plan, s: Sample, counts: Counts): Picture {
  const n = total(s);
  const template: Pot[] = [...Array(s.counts[0]).fill(s.pair[0]), ...Array(s.counts[1]).fill(s.pair[1])];
  const limit = batchesFor(plan, s);
  const r = rows(s, counts, limit);
  const looseRows = Math.ceil(r.loose.length / LOOSE_ROW);
  const out: Drawn[] = [];
  const place = (row: number, rowCount: number) => (pot: Pot, j: number, filled: boolean) => {
    const at = dropAt(row, j, n, rowCount);
    out.push({ pot, filled, loose: false, x: at.x, y: at.y });
  };
  const loose = (first: number, rowCount: number) => r.loose.forEach((pot, j) => {
    const row = Math.floor(j / LOOSE_ROW), inRow = Math.min(LOOSE_ROW, r.loose.length - row * LOOSE_ROW);
    const at = dropAt(first + row, j - row * LOOSE_ROW, inRow, rowCount);
    out.push({ pot, filled: true, loose: true, x: at.x, y: at.y });
  });
  if (plan.kind === 'copy' || plan.kind === 'double') {
    const rowCount = limit + looseRows;
    for (let i = 0; i < limit; i++) template.forEach((pot, j) => place(i, rowCount)(pot, j, r.rows[i]?.[j].filled ?? false));
    loose(limit, rowCount);
    return { drops: out, line: null };
  }
  if (plan.kind === 'line') {
    const rowCount = looseRows + limit;
    r.rows.forEach((row, i) => row.forEach((p, j) => place(looseRows + limit - 1 - i, rowCount)(p.pot, j, p.filled)));
    loose(0, rowCount);
    return { drops: out, line: dropAt(looseRows, 0, n, rowCount).y - (DROP + DROP_GAP) / 2 };
  }
  const rowCount = Math.max(maxMultiple(s), r.rows.length + looseRows);
  r.rows.forEach((row, i) => row.forEach((p, j) => place(i, rowCount)(p.pot, j, p.filled)));
  loose(r.rows.length, rowCount);
  return { drops: out, line: null };
}

export interface Table {
  /** One column per copy of the sample: level 3 up to the line, level 4 as many as the cap holds. */
  columns: number;
  /** Columns filled: one per complete batch (a loose drop never fills one). */
  filled: number;
  /** Each column's counts, pot A over pot B (`k × sample`). */
  values: (readonly [number, number])[];
}

/** The ratio table (levels 3–4): the ratio made into numbers, a column per complete batch; Undo that breaks a batch empties it. */
export function ratioTable(plan: Plan, s: Sample, counts: Counts): Table {
  const columns = plan.kind === 'any' ? maxMultiple(s) : batchesFor(plan, s);
  const values = Array.from({ length: columns }, (_, i) => [(i + 1) * s.counts[0], (i + 1) * s.counts[1]] as const);
  return { columns, filled: Math.min(columns, completeBatches(s, counts)), values };
}

// ---- check ----

export type Verdict =
  | { kind: 'match' }
  | { kind: 'moreSameWay' }
  | { kind: 'sameWay' }
  | { kind: 'wrong'; pot: Pot; direction: 'too-many' | 'short' | 'stray' };

/** The whole multiple `k` with `counts === k × sample`, or null. */
export function multipleOf(s: Sample, counts: Counts): number | null {
  for (const pot of POTS) if (pot !== s.pair[0] && pot !== s.pair[1] && counts[pot] > 0) return null;
  const a = counts[s.pair[0]], b = counts[s.pair[1]];
  if (a === 0 && b === 0) return null;
  if (a % s.counts[0] !== 0 || b % s.counts[1] !== 0) return null;
  const k = a / s.counts[0];
  return b / s.counts[1] === k ? k : null;
}

/**
 * Level 4's nearest target for a wrong bucket: the whole multiple in 1..maxMultiple, other than `done`, whose pair counts are
 * nearest the bucket's by the summed difference over the two pots (ties to the smaller multiple).
 */
export function nearestMultiple(s: Sample, counts: Counts, done: number | null = null): number {
  let best = 0, gap = Infinity;
  for (let k = 1; k <= maxMultiple(s); k++) {
    if (k === done) continue;
    const d = Math.abs(counts[s.pair[0]] - k * s.counts[0]) + Math.abs(counts[s.pair[1]] - k * s.counts[1]);
    if (d < gap) { best = k; gap = d; }
  }
  return best;
}

/** The one commit. Only a `wrong` verdict counts a miss. `done` is level 4's first way (its multiple), null before it. */
export function check(plan: Plan, s: Sample, counts: Counts, done: number | null = null): Verdict {
  const k = multipleOf(s, counts);
  if (plan.kind === 'any') {
    if (k !== null) return k === done ? { kind: 'sameWay' } : { kind: 'match' };
  } else {
    const n = batchesFor(plan, s);
    if (k !== null && k === n) return { kind: 'match' };
    if (k !== null && k < n && plan.moreSameWay) return { kind: 'moreSameWay' };
  }
  for (const pot of POTS) if (pot !== s.pair[0] && pot !== s.pair[1] && counts[pot] > 0) return { kind: 'wrong', pot, direction: 'stray' };
  if (counts[s.pair[0]] === 0 && counts[s.pair[1]] === 0) return { kind: 'wrong', pot: s.pair[0], direction: 'short' };
  const target = sampleCounts(s);
  const times = plan.kind === 'any' ? nearestMultiple(s, counts, done) : batchesFor(plan, s);
  let worst: Pot = s.pair[0], gap = 0;
  for (const pot of s.pair) {
    const d = Math.abs(counts[pot] - times * target[pot]);
    if (d > gap) { worst = pot; gap = d; }
  }
  return { kind: 'wrong', pot: worst, direction: counts[worst] > times * target[worst] ? 'too-many' : 'short' };
}

// ---- help ----

export type Glow = { at: 'pot'; pot: Pot } | { at: 'undo' } | { at: 'tip' } | { at: 'check' };

/**
 * Level 4's aim for the glow: the smallest unused whole multiple that keeps her complete rows and started row (so the glow builds
 * on her drops), else the smallest unused one under the cap (then her extra rows are loose and come out).
 */
export function aimFor(s: Sample, counts: Counts, done: number | null = null): number {
  const c = completeBatches(s, counts);
  const started = s.pair.some((p, i) => counts[p] > c * s.counts[i]);
  for (let k = Math.max(1, c + (started ? 1 : 0)); k <= maxMultiple(s); k++) if (k !== done) return k;
  for (let k = 1; k <= maxMultiple(s); k++) if (k !== done) return k;
  return 1;
}

/** The rows limit the glow works to: the bucket's line, or at level 4 the aimed multiple. */
export function limitFor(plan: Plan, s: Sample, counts: Counts, done: number | null = null): number {
  return plan.kind === 'any' ? aimFor(s, counts, done) : batchesFor(plan, s);
}

/**
 * The next useful control: Check when the counts match; Undo when the last drop is loose; Tip out when a loose drop is buried;
 * otherwise the pot of the first missing place. Following it from any state reaches `match` (a test walks every state).
 */
export function glowFor(plan: Plan, s: Sample, drops: readonly Pot[], done: number | null = null): Glow {
  const counts = countsOf(drops);
  if (check(plan, s, counts, done).kind === 'match') return { at: 'check' };
  const limit = limitFor(plan, s, counts, done);
  const r = rows(s, counts, limit);
  if (r.loose.length > 0) return lastIsLoose(s, drops, limit) ? { at: 'undo' } : { at: 'tip' };
  for (const row of r.rows) for (const place of row) if (!place.filled) return { at: 'pot', pot: place.pot };
  // Every drawn row is full but the bucket is short of its size: the next row starts with pot A.
  return { at: 'pot', pot: s.pair[0] };
}

/** Apply one glow step to the drops (what a finger following the glow does). */
export function follow(glow: Glow, drops: readonly Pot[]): Pot[] {
  if (glow.at === 'pot') return [...drops, glow.pot];
  if (glow.at === 'undo') return drops.slice(0, -1);
  if (glow.at === 'tip') return [];
  return drops.slice();
}

/** The taps from this state to a match, following the glow: the ghost pour's list (at most 24 steps). */
export function solveFrom(plan: Plan, s: Sample, drops: readonly Pot[], done: number | null = null): Glow[] {
  const steps: Glow[] = [];
  let state = drops.slice();
  for (let i = 0; i < 24; i++) {
    const g = glowFor(plan, s, state, done);
    steps.push(g);
    if (g.at === 'check') return steps;
    state = follow(g, state);
  }
  throw new Error('Paint Mixer: the glow did not reach a match');
}

// ---- layout (logical units; the pet keeps the bottom-left corner, the shell the top corners) ----

export interface Pt { x: number; y: number }
export interface Box extends Pt { w: number; h: number }
export const POT_W = 120, POT_H = 130, BUCKET = 320, BUTTON_W = 130, BUTTON_H = 110, JAR_W = 150, JAR_H = 190, DROP = 30, DROP_GAP = 12;
/** The ratio table: a label column of pot marks, then up to four 40-unit columns; a header row and a row per pot. */
export const TABLE_LABEL = 36, TABLE_CELL = 40, TABLE_ROW = 36, TABLE_W = TABLE_LABEL + 4 * TABLE_CELL, TABLE_H = 3 * TABLE_ROW;

export interface Layout {
  portrait: boolean;
  jar: Box;
  /** The centre of the sample's row of drops. */
  recipe: Pt;
  /** The ratio table (levels 3–4; a picture, not an input). */
  table: Box;
  bucket: Box;
  undo: Box;
  tip: Box;
  check: Box;
  pots: Box[];
}

const box = (x: number, y: number, w: number, h: number): Box => ({ x, y, w, h });

export function layout(view: { w: number; h: number }, potCount: number): Layout {
  const { w, h } = view;
  const portrait = h > w;
  const cx = w / 2;
  const potY = h - 20 - POT_H / 2;
  const pots: Box[] = [];
  for (let i = 0; i < potCount; i++) pots.push(box(w - 90 - POT_W / 2 - i * (POT_W + 24), potY, POT_W, POT_H));
  if (!portrait) {
    const by = Math.min(h / 2 - 60, 340);
    const bx = cx - 40;
    const col = bx + BUCKET / 2 + 30 + BUTTON_W / 2;
    return {
      portrait,
      jar: box(215, 230, JAR_W, JAR_H),
      recipe: { x: 205, y: 230 + JAR_H / 2 + 40 },
      table: box(205, 230 + JAR_H / 2 + 40 + 30 + TABLE_H / 2, TABLE_W, TABLE_H),
      bucket: box(bx, by, BUCKET, BUCKET),
      undo: box(col, by - BUTTON_H - 12, BUTTON_W, BUTTON_H),
      tip: box(col, by, BUTTON_W, BUTTON_H),
      check: box(col, by + BUTTON_H + 12, BUTTON_W, BUTTON_H),
      pots,
    };
  }
  const jarY = 180;
  const by = jarY + JAR_H / 2 + 60 + BUCKET / 2;
  const row = by + BUCKET / 2 + 24 + BUTTON_H / 2;
  const step = BUTTON_W + 16;
  return {
    portrait,
    jar: box(cx - 120, jarY, JAR_W, JAR_H),
    recipe: { x: cx + 118, y: jarY - 10 },
    table: box(cx + 118, jarY + 20 + TABLE_H / 2, TABLE_W, TABLE_H),
    bucket: box(cx, by, BUCKET, BUCKET),
    undo: box(cx - step, row, BUTTON_W, BUTTON_H),
    tip: box(cx, row, BUTTON_W, BUTTON_H),
    check: box(cx + step, row, BUTTON_W, BUTTON_H),
    pots,
  };
}

/** Centres for the drops inside the bucket: row `r`, place `i` of `n`, in the bucket's own coordinates. */
export function dropAt(r: number, i: number, n: number, rowCount: number): Pt {
  const pitch = DROP + DROP_GAP;
  const x = (i - (n - 1) / 2) * pitch;
  const y = 20 + (r - (rowCount - 1) / 2) * pitch;
  return { x, y };
}

/** A sticker's sample, from its seed: one of the four authored colours and a 1:2 or 2:1 row. */
export function stickerSample(seed: number): Sample {
  const n = Math.abs(Math.floor(seed));
  const { pair } = PAIRS[n % PAIRS.length];
  return { pair, counts: n % 2 === 0 ? [1, 2] : [2, 1] };
}
