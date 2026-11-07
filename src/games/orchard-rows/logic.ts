import type { Rng } from '../../engine/random';
import type { BandLevels } from '../../progress/difficulty';

export interface Orchard { rows: number; columns: number }
export type Mode = 'plant' | 'turn' | 'missing' | 'equal' | 'every' | 'prime' | 'path' | 'choosepath' | 'pathten';
export const PLANS: readonly { name: string; mode: Mode; shapes: readonly Orchard[] }[] = [
  { name: 'Plant equal rows and count by rows', mode: 'plant', shapes: [{ rows: 2, columns: 3 }, { rows: 3, columns: 2 }, { rows: 3, columns: 3 }, { rows: 2, columns: 2 }, { rows: 4, columns: 2 }] },
  { name: 'Count by rows, then turn and count by columns', mode: 'turn', shapes: [{ rows: 2, columns: 4 }, { rows: 3, columns: 4 }, { rows: 2, columns: 5 }, { rows: 4, columns: 3 }, { rows: 5, columns: 2 }] },
  { name: 'Find the missing row, then count two ways', mode: 'missing', shapes: [{ rows: 3, columns: 5 }, { rows: 4, columns: 5 }, { rows: 5, columns: 4 }, { rows: 5, columns: 5 }, { rows: 4, columns: 4 }, { rows: 5, columns: 3 }] },
  // Levels 4–6 ask which arrays a basket allows; their baskets come from `makeRound`, not fixed shapes.
  { name: 'Equal rows: choose a row count with none left over', mode: 'equal', shapes: [] },
  { name: 'Every way: plant every equal orchard for one basket', mode: 'every', shapes: [] },
  { name: 'Only one long row: find the basket with no equal rows', mode: 'prime', shapes: [] },
  // Levels 7–9 split an orchard with a path; their orchards come from `makePathRound`.
  { name: 'A path at five: count each part, then the whole', mode: 'path', shapes: [] },
  { name: 'Choose the path: split the orchard, count each part and the whole', mode: 'choosepath', shapes: [] },
  { name: 'A path at ten: rows of ten and the rest, then the whole', mode: 'pathten', shapes: [] },
];

export const LEVELS: BandLevels = { school: { min: 1, max: 9 } };
export const planFor = (level: number) => PLANS[Math.max(0, Math.min(PLANS.length - 1, level - 1))];
export const total = (o: Orchard) => o.rows * o.columns;
export const turn = (o: Orchard): Orchard => ({ rows: o.columns, columns: o.rows });
export const subtotals = (o: Orchard) => Array.from({ length: o.rows }, (_, i) => (i + 1) * o.columns);
export const missingTrees = (o: Orchard) => total(o) - (o.rows - 1) * o.columns;
/** Level 2 holds no square, and its two orchards are never one turned, since she turns each to count it again. */
export function makeOrchards(level: number, rng: Rng): Orchard[] {
  const plan = planFor(level);
  const [first, ...rest] = rng.shuffle([...plan.shapes]);
  const second = plan.mode === 'turn' ? rest.find(o => o.rows !== first.columns || o.columns !== first.rows)! : rest[0];
  return [first, second].map(o => ({ ...o }));
}
/** Adjacent totals make a one-off answer possible; missing-row decoys include the number of rows when distinct. */
export function choicesFor(answer: number, rng: Rng, rows?: number): number[] {
  const decoys = [rows, answer - 1, answer + 1].filter((n): n is number => n !== undefined && n > 0 && n !== answer);
  return rng.shuffle([answer, ...new Set(decoys)].slice(0, 3));
}
/** One group is counted once; replaying it never grows the total. */
export function countGroup(counted: readonly number[], row: number, orchard: Orchard): number[] {
  return row >= 0 && row < orchard.rows && !counted.includes(row) ? [...counted, row] : [...counted];
}
/** Fixed, unscaled 100-unit row controls, even for a five-by-five orchard. */
export function orchardLayout(w: number, h: number, o: Orchard) {
  const width = Math.min(560, w - 440);
  return { x: 170 + width / 2, y: Math.max(220, (h - o.rows * 100) / 2), width, rowHeight: 100 };
}

// ---- Levels 4–6: a basket of saplings dealt into equal rows (number-structure NS1) ----

/** The levels that deal a basket into rows rather than plant a given array. */
export const isBasketLevel = (level: number) => level >= 4 && level <= 6;

export interface Deal { rows: number; each: number; left: number }
/** One round of dealing: every row gets the same, and what cannot make another full round stays in the basket. */
export const deal = (n: number, rows: number): Deal => ({ rows, each: Math.floor(n / rows), left: n % rows });

/** The row counts the arrows reach: one row is only a try at level 5 (at 6 it is the answer button, at 4 never needed). */
export const rowRange = (level: number, n: number) => ({ min: level === 5 ? 1 : 2, max: Math.floor(n / 2) });

/** Row counts in the range that leave nothing over. */
export function equalRows(n: number, range: { min: number; max: number }): number[] {
  const out: number[] = [];
  for (let r = range.min; r <= range.max; r++) if (n % r === 0) out.push(r);
  return out;
}

export type Frame = readonly [number, number];
/** Every factor pair [a, b] with a ≤ b, smallest first. */
export function framesFor(n: number): Frame[] {
  const out: Frame[] = [];
  for (let a = 1; a * a <= n; a++) if (n % a === 0) out.push([a, n / a]);
  return out;
}
/** 3 rows of 4 and 4 rows of 3 are one orchard turned. */
export const frameOf = (n: number, rows: number): Frame => {
  const b = n / rows;
  return rows <= b ? [rows, b] : [b, rows];
};
export const frameKey = (f: Frame) => `${f[0]}x${f[1]}`;

export const PRIMES = [13, 17, 19, 23] as const;
export const isPrime = (n: number) => n > 1 && framesFor(n).length === 1;
/** A composite's first equal orchard from two rows up: the pet plants it when the claim is wrong. */
export function shapeOf(n: number): Deal | null {
  for (let r = 2; r <= Math.floor(n / 2); r++) if (n % r === 0) return deal(n, r);
  return null;
}

/** Every three-basket set from 12–24 with exactly one prime and at least one odd composite (15 or 21), so odd is never the cue. */
export function primeSets(): number[][] {
  const composites: number[] = [];
  for (let n = 12; n <= 24; n++) if (!isPrime(n)) composites.push(n);
  const sets: number[][] = [];
  for (const p of PRIMES) for (let i = 0; i < composites.length; i++) for (let j = i + 1; j < composites.length; j++) {
    const a = composites[i], b = composites[j];
    if ([a, b].some(n => n === 15 || n === 21)) sets.push([p, a, b]);
  }
  return sets;
}
export const PRIME_SETS = primeSets();

export const SAPLINGS = ['apple', 'pear', 'plum'] as const;
export type Sapling = typeof SAPLINGS[number];

/** A basket to plant (levels 4–5) or a set of three to choose among (level 6). */
export interface Task { baskets: number[]; open: number }
export interface Round { level: number; sapling: Sapling; tasks: Task[] }

/** A seeded opening row count that leaves some over. */
function leftoverOpen(level: number, n: number, rng: Rng): number {
  const { min, max } = rowRange(level, n);
  const opens: number[] = [];
  for (let r = Math.max(2, min); r <= max; r++) if (n % r !== 0) opens.push(r);
  return rng.pick(opens);
}

export function makeRound(level: number, rng: Rng): Round {
  const sapling = rng.pick(SAPLINGS);
  if (level === 4) {
    const n = rng.pick([14, 15, 16, 18, 20, 21]);
    return { level, sapling, tasks: [{ baskets: [12], open: 5 }, { baskets: [n], open: leftoverOpen(4, n, rng) }] };
  }
  if (level === 5) {
    const n = rng.pick([12, 16, 18, 20, 24]);
    return { level, sapling, tasks: [{ baskets: [n], open: leftoverOpen(5, n, rng) }] };
  }
  if (level !== 6) throw new Error(`makeRound has no baskets for level ${level}`);
  const second = rng.pick(PRIME_SETS.filter(s => s[0] !== 13));
  return { level, sapling, tasks: [{ baskets: rng.shuffle([12, 13, 15]), open: 2 }, { baskets: rng.shuffle([...second]), open: 2 }] };
}

/** Everything the round's accounting needs; the scene only draws it. */
export interface PlayState {
  level: number;
  tasks: Task[];
  index: number;
  /** The loaded basket within the task (always 0 at levels 4–5; null at level 6 until she taps one). */
  loaded: number | null;
  rows: number;
  /** Frames planted at level 5, by `frameKey`. */
  found: string[];
  /** The row counts that planted them, so the same rows again is "already" and its turn is "the same orchard". */
  planted: number[];
  /** Level 6 baskets already claimed wrongly in this set (claiming them again only replays). */
  shown: number[];
  /** Misses on this basket (4–5) or set (6). */
  wrongs: number;
  glowing: boolean;
  misses: number;
  hints: number;
  done: boolean;
}

export function startPlay(round: Round): PlayState {
  const t = round.tasks[0];
  return { level: round.level, tasks: round.tasks, index: 0, loaded: round.level === 6 ? null : 0, rows: t.open, found: [], planted: [], shown: [], wrongs: 0, glowing: false, misses: 0, hints: 0, done: false };
}
export const basketOf = (s: PlayState) => s.loaded === null ? null : s.tasks[s.index].baskets[s.loaded];

export type Action = { kind: 'up' | 'down' | 'plant' | 'claim' } | { kind: 'load'; basket: number };
export type Outcome =
  | 'moved' | 'end' | 'ignored' | 'loaded'
  | 'leftover' | 'planted' | 'newshape' | 'turnedsame' | 'already' | 'everydone'
  | 'claimwrong' | 'claimagain' | 'claimright';

/** The task finished: the next basket or set starts fresh (its own misses toward the glow). */
function advance(s: PlayState): PlayState {
  const index = s.index + 1;
  if (index >= s.tasks.length) return { ...s, done: true };
  const t = s.tasks[index];
  return { ...s, index, loaded: s.level === 6 ? null : 0, rows: t.open, shown: [], wrongs: 0, glowing: false };
}
/** One miss; the second on this basket or set lights the glow and counts its one hint. */
function miss(s: PlayState): PlayState {
  const wrongs = s.wrongs + 1;
  const glow = wrongs >= 2 && !s.glowing;
  return { ...s, wrongs, misses: s.misses + 1, glowing: s.glowing || glow, hints: s.hints + (glow ? 1 : 0) };
}

/** Pure accounting: arrows, loads, repeats and already-found shapes are free; a leftover Plant or a first wrong claim is a miss. */
export function step(s: PlayState, a: Action): { state: PlayState; outcome: Outcome } {
  if (s.done) return { state: s, outcome: 'ignored' };
  const n = basketOf(s);
  if (a.kind === 'load') {
    if (s.level !== 6 || a.basket < 0 || a.basket > 2) return { state: s, outcome: 'ignored' };
    return { state: { ...s, loaded: a.basket, rows: s.tasks[s.index].open }, outcome: 'loaded' };
  }
  if (n === null) return { state: s, outcome: 'ignored' };
  const range = rowRange(s.level, n);
  if (a.kind === 'up' || a.kind === 'down') {
    const rows = s.rows + (a.kind === 'up' ? 1 : -1);
    if (rows < range.min || rows > range.max) return { state: s, outcome: 'end' };
    return { state: { ...s, rows }, outcome: 'moved' };
  }
  if (a.kind === 'plant') {
    if (s.level === 6) return { state: s, outcome: 'ignored' };
    if (n % s.rows !== 0) return { state: miss(s), outcome: 'leftover' };
    if (s.level === 4) return { state: advance(s), outcome: 'planted' };
    const key = frameKey(frameOf(n, s.rows));
    // The same orchard turned on its side is the same frame; the very same rows is just "already".
    if (s.found.includes(key)) return { state: s, outcome: s.planted.includes(s.rows) ? 'already' : 'turnedsame' };
    const state = { ...s, found: [...s.found, key], planted: [...s.planted, s.rows] };
    if (state.found.length === framesFor(n).length) return { state: advance(state), outcome: 'everydone' };
    return { state, outcome: 'newshape' };
  }
  // claim
  if (s.level !== 6 || s.loaded === null) return { state: s, outcome: 'ignored' };
  if (isPrime(n)) return { state: advance(s), outcome: 'claimright' };
  if (s.shown.includes(s.loaded)) return { state: s, outcome: 'claimagain' };
  return { state: { ...miss(s), shown: [...s.shown, s.loaded] }, outcome: 'claimwrong' };
}

export type Hint = 'up' | 'down' | 'plant' | 'claim' | { basket: number };

/** Where help points: the nearest row count where Plant is right (at 5, an unfound frame; ties go up), or the prime basket, then its claim. */
export function hintTarget(s: PlayState): Hint | null {
  if (s.done) return null;
  const task = s.tasks[s.index];
  if (s.level === 6) {
    const prime = task.baskets.findIndex(isPrime);
    return s.loaded === prime ? 'claim' : { basket: prime };
  }
  const n = task.baskets[0];
  const range = rowRange(s.level, n);
  const good = equalRows(n, range).filter(r => s.level === 4 || !s.found.includes(frameKey(frameOf(n, r))));
  if (good.length === 0) return null;
  const best = good.reduce((b, r) => {
    const d = Math.abs(r - s.rows), bd = Math.abs(b - s.rows);
    return d < bd || (d === bd && r > b) ? r : b;
  });
  return best === s.rows ? 'plant' : best > s.rows ? 'up' : 'down';
}

/** The ghost finger takes the help's path, so it never misses. */
export function botStep(s: PlayState): Action | null {
  const h = hintTarget(s);
  if (h === null) return null;
  if (typeof h === 'object') return { kind: 'load', basket: h.basket };
  return { kind: h };
}

// ---- Levels 4–6 layout, in logical units from the view ----

export interface Box { x: number; y: number; w: number; h: number }
export interface BasketLayout {
  portrait: boolean;
  /** The leftover basket (4–5) or the three baskets to choose among (6). */
  baskets: Box[];
  /** Level 5's shape frames. */
  frames: Box[];
  bed: Box;
  up: Box; down: Box; card: Box;
  /** Plant, or One long row at level 6. */
  act: Box;
}
/** The guide's bottom-left corner and the corner buttons' top strip, kept clear. */
export const PET_CORNER = { w: 200, h: 205 };
export const TOP_CLEAR = 110;
export const MIN_CELL = 18;

/** Pure: every control at least 100 units, nothing in the pet's corner; null rather than shrink a target. */
export function basketLayout(view: { w: number; h: number }, level: number, frames = 0): BasketLayout | null {
  const { w, h } = view;
  const portrait = h > w;
  const top = TOP_CLEAR + 5;
  const baskets: Box[] = level === 6
    ? [0, 1, 2].map(i => ({ x: (portrait ? w / 2 - 230 : 230) + i * 160, y: top, w: 140, h: 110 }))
    : [{ x: portrait ? w / 2 - 75 : 215, y: top + 10, w: 150, h: 90 }];
  let frameBoxes: Box[] = [];
  if (level === 5) {
    frameBoxes = portrait
      ? Array.from({ length: frames }, (_, i) => ({ x: w / 2 - (frames * 115 - 15) / 2 + i * 115, y: top + 115, w: 100, h: 90 }))
      : Array.from({ length: frames }, (_, i) => ({ x: 380 + i * 105, y: top + 10, w: 100, h: 90 }));
  }
  const stripBottom = Math.max(...[...baskets, ...frameBoxes].map(b => b.y + b.h));
  let bed: Box, up: Box, down: Box, card: Box, act: Box;
  if (portrait) {
    const rowY = h - 160;
    down = { x: 230, y: rowY, w: 120, h: 110 };
    card = { x: 370, y: rowY - 5, w: 120, h: 120 };
    up = { x: 510, y: rowY, w: 120, h: 110 };
    act = { x: 670, y: rowY, w: 130, h: 110 };
    bed = { x: 40, y: stripBottom + 20, w: w - 80, h: h - 225 - (stripBottom + 20) };
  } else {
    const cx = w - 140, y0 = top + 5;
    const gap = Math.max(10, Math.min(30, (h - 30 - y0 - 430) / 3));
    up = { x: cx - 65, y: y0, w: 130, h: 100 };
    card = { x: cx - 65, y: up.y + 100 + gap, w: 130, h: 120 };
    down = { x: cx - 65, y: card.y + 120 + gap, w: 130, h: 100 };
    act = { x: cx - 65, y: down.y + 100 + gap, w: 130, h: 110 };
    bed = { x: 210, y: stripBottom + 10, w: w - 290 - 210 - 10, h: h - 30 - (stripBottom + 10) };
  }
  // The leftover basket and the frames are pictures; the level 6 baskets are buttons.
  const all = [up, down, card, act, ...(level === 6 ? baskets : [])];
  if (all.some(b => b.w < 100 || b.h < 100)) return null;
  if ([act.y + act.h, down.y + down.h].some(y => y > h - 10)) return null;
  return { portrait, baskets, frames: frameBoxes, bed, up, down, card, act };
}

/** The cell a sapling or tree gets: trees are pictures here, sized to the shape. */
export const cellSize = (bed: Box, d: { rows: number; each: number }) => Math.min(bed.w / Math.max(1, d.each), bed.h / d.rows, 90);

// ---- Levels 7–9: a path splits the orchard into two parts she knows (distributive property) ----

/** The levels that split a grown orchard with a path. */
export const isPathLevel = (level: number) => level >= 7;
/** At 7 and 8 the path runs across, between rows; at 9 it runs down after ten trees in every row. */
export const across = (level: number) => level !== 9;
/** The path's width in logical units, in the gap it takes across or down the bed. */
export const PATH_GAP = 40;

/** `split` is the rows above the path (7–8) or the trees left of it in every row (9). */
export interface PathTask { rows: number; columns: number; split: number }
export interface PathRound { level: number; fruit: Sapling; tasks: PathTask[] }

const shapes = (rows: [number, number], columns: [number, number]) => {
  const out: Orchard[] = [];
  for (let r = rows[0]; r <= rows[1]; r++) for (let c = columns[0]; c <= columns[1]; c++) out.push({ rows: r, columns: c });
  return out;
};
/** Every orchard a level draws from, and its fixed first example. */
export const PATH_POOLS: Record<7 | 8 | 9, { shapes: Orchard[]; first: Orchard; split: number }> = {
  7: { shapes: shapes([7, 9], [3, 9]), first: { rows: 7, columns: 4 }, split: 5 },
  8: { shapes: shapes([6, 9], [6, 9]), first: { rows: 7, columns: 6 }, split: 1 },
  9: { shapes: shapes([2, 5], [11, 19]), first: { rows: 3, columns: 14 }, split: 10 },
};
const poolFor = (level: number) => {
  if (level < 7 || level > 9) throw new Error(`no path orchards for level ${level}`);
  return PATH_POOLS[level as 7 | 8 | 9];
};

/** Two different orchards: the worked example first, then one from the pool. */
export function makePathRound(level: number, rng: Rng): PathRound {
  const pool = poolFor(level);
  const fruit = rng.pick(SAPLINGS);
  const second = rng.pick(pool.shapes.filter(o => o.rows !== pool.first.rows || o.columns !== pool.first.columns));
  return { level, fruit, tasks: [pool.first, second].map(o => ({ ...o, split: pool.split })) };
}

/** The trees in each part: above and below the path (7–8), or the ten side and the rest (9). Together they are the whole. */
export function partsOf(level: number, t: PathTask): [number, number] {
  if (!across(level)) return [t.rows * 10, t.rows * (t.columns - 10)];
  return [t.split * t.columns, (t.rows - t.split) * t.columns];
}
/** The trees in one row of a part. */
export const unitOf = (level: number, t: PathTask, part: 0 | 1) => across(level) ? t.columns : part === 0 ? 10 : t.columns - 10;
/** The rows a part spans. */
export const rowsOf = (level: number, t: PathTask, part: 0 | 1) => across(level) ? (part === 0 ? t.split : t.rows - t.split) : t.rows;

export type PathQuestion = 0 | 1 | 2;
export const QUESTIONS = ['first', 'second', 'whole'] as const;

/** Three distinct pads in 1–99 with the answer among them: a row fewer or more for a part; the larger part alone first for the whole. */
export function pathChoices(answer: number, kind: typeof QUESTIONS[number], task: PathTask, level: number, rng: Rng): number[] {
  const [a, b] = partsOf(level, task);
  let candidates: number[];
  if (kind === 'whole') {
    const pair = rng.shuffle([answer - task.columns, answer + task.columns]);
    candidates = [Math.max(a, b), ...pair, answer + 1, answer - 1];
  } else {
    const u = unitOf(level, task, kind === 'first' ? 0 : 1);
    candidates = [answer - u, answer + u, answer + 2 * u, answer + 1, answer - 1];
  }
  const pads = [answer];
  for (const n of candidates) {
    if (pads.length === 3) break;
    if (n > 0 && n < 100 && !pads.includes(n)) pads.push(n);
  }
  return rng.shuffle(pads);
}

export interface PathState {
  level: number;
  tasks: PathTask[];
  index: number;
  /** Where the path is in the current orchard (moved by the arrows at level 8). */
  split: number;
  laid: boolean;
  question: PathQuestion;
  /** Misses on this question. */
  wrongs: number;
  glowing: boolean;
  misses: number;
  hints: number;
  done: boolean;
}

export function startPath(round: PathRound): PathState {
  return { level: round.level, tasks: round.tasks, index: 0, split: round.tasks[0].split, laid: round.level !== 8, question: 0, wrongs: 0, glowing: false, misses: 0, hints: 0, done: false };
}
/** The current orchard with the path where it is now. */
export const taskOf = (s: PathState): PathTask => ({ ...s.tasks[s.index], split: s.split });
export function answerOf(s: PathState): number {
  const [a, b] = partsOf(s.level, taskOf(s));
  return s.question === 0 ? a : s.question === 1 ? b : a + b;
}

export type PathAction = { kind: 'up' | 'down' | 'lay' } | { kind: 'sign'; part: 0 | 1 } | { kind: 'pad'; n: number };
export type PathOutcome = 'moved' | 'end' | 'laid' | 'ask' | 'recount' | 'right' | 'wrong' | 'ignored';

/** Pure accounting: arrows, laying the path anywhere and sign taps are free; every wrong pad is a miss, and the second on a question glows the answer (one hint). */
export function pathStep(s: PathState, a: PathAction): { state: PathState; outcome: PathOutcome } {
  const none = { state: s, outcome: 'ignored' as const };
  if (s.done) return none;
  if (a.kind === 'up' || a.kind === 'down') {
    if (s.level !== 8 || s.laid) return none;
    // ▲ lifts the path (one row fewer above it); ▼ lowers it.
    const split = s.split + (a.kind === 'up' ? -1 : 1);
    if (split < 1 || split > s.tasks[s.index].rows - 1) return { state: s, outcome: 'end' };
    return { state: { ...s, split }, outcome: 'moved' };
  }
  if (a.kind === 'lay') {
    if (s.level !== 8 || s.laid) return none;
    return { state: { ...s, laid: true }, outcome: 'laid' };
  }
  if (!s.laid) return none;
  if (a.kind === 'sign') {
    if (a.part !== 0 && a.part !== 1) return none;
    return { state: s, outcome: s.question > a.part ? 'recount' : 'ask' };
  }
  if (a.kind !== 'pad') return none;
  if (a.n !== answerOf(s)) {
    const wrongs = s.wrongs + 1;
    const glow = wrongs >= 2 && !s.glowing;
    return { state: { ...s, wrongs, misses: s.misses + 1, glowing: s.glowing || glow, hints: s.hints + (glow ? 1 : 0) }, outcome: 'wrong' };
  }
  const fresh = { wrongs: 0, glowing: false };
  if (s.question < 2) return { state: { ...s, ...fresh, question: (s.question + 1) as PathQuestion }, outcome: 'right' };
  const index = s.index + 1;
  if (index >= s.tasks.length) return { state: { ...s, ...fresh, done: true }, outcome: 'right' };
  return { state: { ...s, ...fresh, index, question: 0, split: s.tasks[index].split, laid: s.level !== 8 }, outcome: 'right' };
}

/** The answer pad while the glow is on; never a split, since any split is right. */
export const pathHint = (s: PathState): number | null => s.glowing && s.laid && !s.done ? answerOf(s) : null;

/** The ghost finger moves the path to five rows (always reachable, with six or more), lays it, then taps each answer. */
export function pathBot(s: PathState): PathAction | null {
  if (s.done) return null;
  if (!s.laid) return s.split < 5 ? { kind: 'down' } : s.split > 5 ? { kind: 'up' } : { kind: 'lay' };
  return { kind: 'pad', n: answerOf(s) };
}

/** The spoken count by rows: "4, 8, 12, 16, 20". */
export const skipCount = (rows: number, each: number) => Array.from({ length: rows }, (_, i) => (i + 1) * each).join(', ');

export interface PathLayout {
  portrait: boolean;
  bed: Box;
  /** The two parts' signs: above then below (7–8), or the ten side then the rest (9). */
  signs: [Box, Box];
  pads: [Box, Box, Box];
  /** Level 8's path controls, replaced by the pads once the path is laid. */
  up: Box | null; down: Box | null; card: Box | null; lay: Box | null;
}

/** Pure: every target at least 100 units, nothing in the pet's corner or the top strip; null rather than shrink a target. */
export function pathLayout(view: { w: number; h: number }, level: number): PathLayout | null {
  const { w, h } = view;
  const portrait = h > w;
  const top = 125;
  const wide = across(level);
  let bed: Box, signs: [Box, Box], pads: [Box, Box, Box];
  let up: Box | null = null, down: Box | null = null, card: Box | null = null, lay: Box | null = null;
  if (portrait) {
    const rowY = h - 160;
    pads = [230, 370, 510].map(x => ({ x, y: rowY, w: 120, h: 110 })) as [Box, Box, Box];
    if (wide) {
      bed = { x: 40, y: top, w: w - 220, h: h - 225 - top };
      signs = [{ x: w - 160, y: top, w: 120, h: 110 }, { x: w - 160, y: h - 335, w: 120, h: 110 }];
    } else {
      bed = { x: 40, y: top, w: w - 80, h: h - 345 - top };
      signs = [{ x: 40, y: h - 335, w: 120, h: 110 }, { x: w - 160, y: h - 335, w: 120, h: 110 }];
    }
    if (level === 8) {
      up = { x: 230, y: rowY, w: 120, h: 110 };
      card = { x: 370, y: rowY - 5, w: 120, h: 120 };
      down = { x: 510, y: rowY, w: 120, h: 110 };
      lay = { x: 670, y: rowY, w: 130, h: 110 };
    }
  } else {
    const cx = w - 140, y0 = top;
    const padGap = Math.max(10, Math.min(30, (h - 30 - y0 - 330) / 2));
    pads = [0, 1, 2].map(i => ({ x: cx - 65, y: y0 + i * (110 + padGap), w: 130, h: 110 })) as [Box, Box, Box];
    if (wide) {
      bed = { x: 210, y: top, w: w - 640, h: h - 30 - top };
      signs = [{ x: w - 420, y: top, w: 120, h: 110 }, { x: w - 420, y: h - 140, w: 120, h: 110 }];
    } else {
      bed = { x: 210, y: top, w: w - 510, h: h - 150 - top };
      signs = [{ x: 210, y: h - 140, w: 120, h: 110 }, { x: w - 420, y: h - 140, w: 120, h: 110 }];
    }
    if (level === 8) {
      const gap = Math.max(10, Math.min(30, (h - 30 - y0 - 430) / 3));
      up = { x: cx - 65, y: y0, w: 130, h: 100 };
      card = { x: cx - 65, y: up.y + 100 + gap, w: 130, h: 120 };
      down = { x: cx - 65, y: card.y + 120 + gap, w: 130, h: 100 };
      lay = { x: cx - 65, y: down.y + 100 + gap, w: 130, h: 110 };
    }
  }
  const targets = [...signs, ...pads, ...[up, down, lay].filter((b): b is Box => b !== null)];
  if (targets.some(b => b.w < 100 || b.h < 100)) return null;
  if ([...targets, ...(card ? [card] : [])].some(b => b.y + b.h > h - 10 || b.x + b.w > w - 10)) return null;
  return { portrait, bed, signs, pads, up, down, card, lay };
}

/** A tree's cell: the bed less the path's gap, never above 90. */
export function pathCell(bed: Box, level: number, t: { rows: number; columns: number }) {
  const gapW = across(level) ? 0 : PATH_GAP, gapH = across(level) ? PATH_GAP : 0;
  return Math.min((bed.w - gapW) / t.columns, (bed.h - gapH) / t.rows, 90);
}
