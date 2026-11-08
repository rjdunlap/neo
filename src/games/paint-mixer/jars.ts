/**
 * Paint Mixer level 6, "which jars match?": one sample (an authored pair and a base ratio) and four lidded jars, each labelled
 * with two counts over the same pair. She taps every jar whose label is a whole multiple of the sample's, then Check. The
 * labels decide, not the colour (near labels are invisible as colour), so an opened lid shows the label against the sample's
 * ratio table. Definition: docs/definitions/paint-mixer-5-6.md#level-6-which-jars-match.
 */
import type { Rng } from '../../engine/random';
import { BUTTON_H, BUTTON_W, JAR_H, JAR_W, PAIRS, TABLE_W, tableH, type Box, type Pair } from './logic';

export type Label = readonly [number, number];
/** Why a jar's label is not the sample's: one count off a table column, both counts added to, or the two counts swapped. */
export type WrongKind = 'half-right' | 'added' | 'swapped';
export interface Jar {
  label: Label;
  /** The multiple of the sample, or null for a jar that does not match. */
  k: number | null;
  kind: WrongKind | null;
}
export interface JarCase {
  pair: Pair;
  /** The sample's ratio in lowest terms (column 1 of its table). */
  base: Label;
  jars: Jar[];
}

/** Bases in lowest terms, each total at most 5. */
export const JAR_BASES: readonly Label[] = [
  [1, 2],
  [2, 1],
  [1, 3],
  [3, 1],
  [2, 3],
  [3, 2],
];
/** The sample's table at level 6 has four columns; only column 1 is shown until a lid opens. */
export const TABLE_COLUMNS = 4;
export const JARS = 4;
export const CASES_PER_ROUND = 2;
const MAX_COUNT = 12;

const same = (a: Label, b: Label) => a[0] === b[0] && a[1] === b[1];
/** A label's multiple of the base, or null (equal cross-products and a whole factor). */
export function multipleOfBase(base: Label, label: Label): number | null {
  if (label[0] * base[1] !== label[1] * base[0]) return null;
  const k = label[0] / base[0];
  return Number.isInteger(k) && k >= 1 ? k : null;
}

function wrongLabel(kind: WrongKind, base: Label, rng: Rng): Label {
  const [a, b] = base;
  if (kind === 'swapped') return [b, a];
  if (kind === 'added') {
    const n = rng.int(1, 3);
    return [a + n, b + n];
  }
  const k = rng.int(1, 4),
    d = rng.int(0, 1) ? 1 : -1;
  return rng.int(0, 1) ? [k * a, k * b + d] : [k * a + d, k * b];
}

/** One case: a pair (avoiding `avoid`'s), a base, one to three matching jars and the rest non-matching, in a seeded order. */
export function makeJarCase(rng: Rng, avoid?: JarCase): JarCase {
  const pairs = PAIRS.filter((p) => !avoid || p.pair[0] !== avoid.pair[0] || p.pair[1] !== avoid.pair[1]);
  const { pair } = pairs[rng.int(0, pairs.length - 1)];
  const base = JAR_BASES[rng.int(0, JAR_BASES.length - 1)];
  const matching = rng.int(1, 3);
  const ks = rng.shuffle([1, 2, 3, 4]).slice(0, matching);
  const jars: Jar[] = ks.map((k) => ({ label: [k * base[0], k * base[1]], k, kind: null }));
  const kinds: WrongKind[] = ['half-right', 'added', 'swapped'];
  for (let tries = 0; jars.length < JARS; tries++) {
    // A swapped label exists once; after many tries fall back to a half-right label, which always has room.
    const kind = tries > 40 ? 'half-right' : kinds[rng.int(0, kinds.length - 1)];
    const label = wrongLabel(kind, base, rng);
    if (label.some((c) => c < 1 || c > MAX_COUNT)) continue;
    if (multipleOfBase(base, label) !== null || label[0] * base[1] === label[1] * base[0]) continue;
    if (jars.some((j) => same(j.label, label))) continue;
    jars.push({ label, k: null, kind });
  }
  return { pair, base, jars: rng.shuffle(jars) };
}

export function makeJarRound(rng: Rng): JarCase[] {
  const out: JarCase[] = [];
  for (let i = 0; i < CASES_PER_ROUND; i++) out.push(makeJarCase(rng, out[i - 1]));
  return out;
}

export const matchingSet = (c: JarCase): boolean[] => c.jars.map((j) => j.k !== null);

// ---- the reveal ----

export type Reveal =
  /** The label is column `k` of the table: columns 1..k fill and column `k` glows. */
  | { kind: 'fills'; k: number }
  /** The first count is column `k`'s, the second is not: the second is circled against the table's `expected`. */
  | { kind: 'second'; k: number; expected: number }
  /** The first count is not in the table's first row: it is circled, and the table shows its whole first row. */
  | { kind: 'first' };

/** What an opened lid shows, as a pure function of the base and the label. */
export function reveal(base: Label, label: Label): Reveal {
  const k = multipleOfBase(base, label);
  if (k !== null) return { kind: 'fills', k };
  const k1 = label[0] / base[0];
  if (Number.isInteger(k1) && k1 >= 1 && k1 <= TABLE_COLUMNS)
    return { kind: 'second', k: k1, expected: k1 * base[1] };
  return { kind: 'first' };
}

// ---- check and help ----

export type JarVerdict =
  | { kind: 'match' }
  | { kind: 'empty' }
  /** The leftmost jar whose choice is wrong: a chosen non-match (`not-same`) or a missed match (`one-more`). */
  | { kind: 'wrong'; jar: number; way: 'not-same' | 'one-more' };

/** The leftmost jar whose choice disagrees with the matching set, or -1. */
export function firstWrong(c: JarCase, chosen: readonly boolean[]): number {
  return c.jars.findIndex((j, i) => (j.k !== null) !== !!chosen[i]);
}

/** The commit. Only `wrong` counts a miss; an empty Check is a reminder. */
export function checkJars(c: JarCase, chosen: readonly boolean[]): JarVerdict {
  if (!chosen.some(Boolean)) return { kind: 'empty' };
  const i = firstWrong(c, chosen);
  if (i < 0) return { kind: 'match' };
  return { kind: 'wrong', jar: i, way: c.jars[i].k === null ? 'not-same' : 'one-more' };
}

/** The jar help names: the leftmost wrong one, or with nothing wrong the first matching jar (Check is then the next step). */
export function namedJar(c: JarCase, chosen: readonly boolean[]): number {
  const i = firstWrong(c, chosen);
  return i >= 0 ? i : c.jars.findIndex((j) => j.k !== null);
}

/** The supported finish: the jar taps (toggles) that make the choice exactly the matching set, left to right. */
export function finishTaps(c: JarCase, chosen: readonly boolean[]): number[] {
  return c.jars.map((_, i) => i).filter((i) => (c.jars[i].k !== null) !== !!chosen[i]);
}

// ---- layout ----

export interface JarLayout {
  portrait: boolean;
  sample: Box;
  /** The centre of the sample's row of drops. */
  recipe: { x: number; y: number };
  table: Box;
  jars: Box[];
  check: Box;
}
/** A lid knob: the top 100 × 60 of a jar, in the jar's own coordinates (the rest of the jar chooses it). */
export const LID: Box = { x: 0, y: -JAR_H / 2 + 30, w: 100, h: 60 };
export const inLid = (x: number, y: number) =>
  Math.abs(x - LID.x) <= LID.w / 2 && Math.abs(y - LID.y) <= LID.h / 2;

const box = (x: number, y: number, w: number, h: number): Box => ({ x, y, w, h });

/**
 * Landscape: the sample, its row and its table in the left column (as at levels 3–4); the four jars in a row to its right
 * where the bucket stood, Check under the row's right end (there is no room beside four jars at 1024). Portrait: sample and
 * table on top, the jars as a 2 × 2 grid, Check below.
 */
export function layoutJars(view: { w: number; h: number }): JarLayout {
  const { w, h } = view;
  const portrait = h > w;
  const TABLE_H = tableH(2);
  const gap = 16;
  if (!portrait) {
    const left = 330,
      right = w - 24;
    const cx = (left + right) / 2;
    const rowW = JARS * JAR_W + (JARS - 1) * gap;
    const y = Math.min(h / 2 - 50, 300);
    const jars = Array.from({ length: JARS }, (_, i) =>
      box(cx - rowW / 2 + JAR_W / 2 + i * (JAR_W + gap), y, JAR_W, JAR_H),
    );
    const last = jars[JARS - 1];
    return {
      portrait,
      sample: box(215, 230, JAR_W, JAR_H),
      recipe: { x: 205, y: 230 + JAR_H / 2 + 40 },
      table: box(205, 230 + JAR_H / 2 + 40 + 30 + TABLE_H / 2, TABLE_W, TABLE_H),
      jars,
      check: box(last.x, y + JAR_H / 2 + 30 + BUTTON_H / 2, BUTTON_W, BUTTON_H),
    };
  }
  const cx = w / 2;
  const jarY = 180;
  const tableBottom = jarY + 20 + TABLE_H;
  const top = Math.max(jarY + JAR_H / 2, tableBottom) + 40 + JAR_H / 2;
  const dx = (JAR_W + gap) / 2,
    dy = JAR_H + 24;
  const jars = [0, 1, 2, 3].map((i) =>
    box(cx + (i % 2 ? dx : -dx), top + Math.floor(i / 2) * dy, JAR_W, JAR_H),
  );
  return {
    portrait,
    sample: box(cx - 120, jarY, JAR_W, JAR_H),
    recipe: { x: cx + 118, y: jarY - 10 },
    table: box(cx + 118, jarY + 20 + TABLE_H / 2, TABLE_W, TABLE_H),
    jars,
    check: box(cx, top + dy + JAR_H / 2 + 30 + BUTTON_H / 2, BUTTON_W, BUTTON_H),
  };
}
