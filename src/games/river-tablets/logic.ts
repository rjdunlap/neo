/**
 * River Tablets rules: a record of real things, lined up against them one to one.
 * Level 1 drops a token in the jar for each sheep and tips the jar; level 2 presses one mark per token on a clay envelope and
 * cracks it open; level 3 presses each mark in the row with its picture and reads the tablet back. Definition:
 * docs/definitions/river-tablets.md.
 */
import type { ColorName } from '../../art/palette';
import type { Rng } from '../../engine/random';
import type { View } from '../../engine/view';

export type PlanId = 'tokens' | 'envelope' | 'rows';
export type Kind = 'sheep' | 'jar';
export const KINDS: readonly Kind[] = ['sheep', 'jar'];

export interface Plan {
  level: number;
  id: PlanId;
  name: string;
}

export const PLANS: readonly Plan[] = [
  { level: 1, id: 'tokens', name: 'One token each: tap the jar for each sheep, then tip it (3–5 sheep)' },
  { level: 2, id: 'envelope', name: 'Marks on the envelope: one pressed mark per token, crack it open (two balls of 3–6)' },
  { level: 3, id: 'rows', name: 'Which row? each mark in the row with its picture (two tablets of 4–6 mixed goods)' },
];
export const MAX_LEVEL = PLANS.length;

export function planFor(level: number): Plan {
  return PLANS[Math.min(Math.max(1, level), MAX_LEVEL) - 1];
}

/** The 8-cell face of an envelope: 2 rows × 4, enough for the largest token count. */
export const CELLS = 8;
export const CELL_COLUMNS = 4;
/** Cells per row of a tablet. */
export const ROW_CELLS = 4;

export const SHEEP_COLORS: readonly ColorName[] = ['white', 'white', 'brown', 'white', 'pink'];

// ——— Briefs ———

export interface TokensBrief {
  level: 1;
  id: 'tokens';
  sheep: number;
  /** Cosmetic: each sheep's fleece. */
  colors: ColorName[];
  /** Cosmetic: the pen's gate opens on the left or right. */
  gate: 'left' | 'right';
}

export interface EnvelopeBrief {
  level: 2;
  id: 'envelope';
  /** Tokens in each of the two envelopes; they differ. */
  envelopes: [number, number];
}

export interface RowsBrief {
  level: 3;
  id: 'rows';
  /** Two deliveries of 4–6 goods, both kinds present, at most 4 of either, mixed. */
  deliveries: [Kind[], Kind[]];
}

export type Brief = TokensBrief | EnvelopeBrief | RowsBrief;

/** How many times the kind changes along a delivery; a mixed delivery changes at least twice. */
export function kindChanges(goods: readonly Kind[]): number {
  let n = 0;
  for (let i = 1; i < goods.length; i++) if (goods[i] !== goods[i - 1]) n++;
  return n;
}

export function isMixed(goods: readonly Kind[]): boolean {
  const sheep = goods.filter((k) => k === 'sheep').length;
  const jars = goods.length - sheep;
  return goods.length >= 4 && goods.length <= 6 && sheep >= 1 && jars >= 1 && sheep <= 4 && jars <= 4 && kindChanges(goods) >= 2;
}

/** A delivery of `sheep` sheep and `jars` jars in a mixed order: seeded shuffles, with a built order if the draws never mix. */
export function deliveryFor(sheep: number, jars: number, rng: Rng): Kind[] {
  const base: Kind[] = [...Array<Kind>(sheep).fill('sheep'), ...Array<Kind>(jars).fill('jar')];
  for (let i = 0; i < 40; i++) {
    const d = rng.shuffle(base.slice());
    if (kindChanges(d) >= 2) return d;
  }
  // One of the minority kind slipped into second place: A B A A… changes twice.
  const [many, few]: [Kind, Kind] = sheep >= jars ? ['sheep', 'jar'] : ['jar', 'sheep'];
  const nFew = Math.min(sheep, jars);
  const nMany = Math.max(sheep, jars);
  return [many, ...Array<Kind>(nFew).fill(few), ...Array<Kind>(nMany - 1).fill(many)];
}

export function briefFor(level: number, rng: Rng): Brief {
  const plan = planFor(level);
  if (plan.id === 'tokens') {
    const sheep = rng.int(3, 5);
    const colors = Array.from({ length: sheep }, () => rng.pick(SHEEP_COLORS));
    return { level: 1, id: 'tokens', sheep, colors, gate: rng.chance(0.5) ? 'left' : 'right' };
  }
  if (plan.id === 'envelope') {
    const a = rng.int(3, 6);
    let b = rng.int(3, 5);
    if (b >= a) b++;
    return { level: 2, id: 'envelope', envelopes: [a, b] };
  }
  const draw = (): Kind[] => {
    const total = rng.int(4, 6);
    const sheep = rng.int(Math.max(1, total - 4), Math.min(4, total - 1));
    return deliveryFor(sheep, total - sheep, rng);
  };
  return { level: 3, id: 'rows', deliveries: [draw(), draw()] };
}

// ——— Level 1: one token each ———

export interface PenState {
  sheep: number;
  /** Sheep standing in the pen. */
  arrived: number;
  /** A sheep is on the path. */
  walking: boolean;
  tokens: number;
  tipped: boolean;
}

export function startPen(sheep: number): PenState {
  // The first sheep walks in on its own.
  return { sheep, arrived: 0, walking: true, tokens: 0, tipped: false };
}

/** The walking sheep reaches the pen. */
export function arrive(s: PenState): PenState {
  if (!s.walking) return s;
  return { ...s, walking: false, arrived: s.arrived + 1 };
}

export type JarTap = 'token' | 'wobble' | 'tip';

/** The jar is the only input: a token for a sheep without one (and the next sheep sets off), a wobble otherwise, the tip once all are in. */
export function tapJar(s: PenState): { state: PenState; result: JarTap } {
  if (s.tipped) return { state: s, result: 'wobble' };
  if (s.tokens < s.arrived && !s.walking) {
    const tokens = s.tokens + 1;
    const walking = s.arrived < s.sheep;
    return { state: { ...s, tokens, walking }, result: 'token' };
  }
  if (readyToTip(s)) return { state: { ...s, tipped: true }, result: 'tip' };
  return { state: s, result: 'wobble' };
}

export function readyToTip(s: PenState): boolean {
  return !s.tipped && !s.walking && s.arrived === s.sheep && s.tokens === s.sheep;
}

export function penInvariant(s: PenState): boolean {
  return s.tokens <= s.arrived && s.arrived <= s.sheep && s.tokens >= 0 && (!s.walking || s.arrived < s.sheep);
}

// ——— Level 2: marks on the envelope ———

export interface EnvelopeState {
  tokens: number;
  /** One flag per cell of the face. */
  marks: boolean[];
  /** Cracks whose marks did not equal the tokens. */
  misses: number;
  /** The glow was lit for this envelope (at most one hint). */
  hinted: boolean;
  glowing: boolean;
  matched: boolean;
}

export function startEnvelope(tokens: number): EnvelopeState {
  return { tokens, marks: Array<boolean>(CELLS).fill(false), misses: 0, hinted: false, glowing: false, matched: false };
}

export function markCount(s: EnvelopeState): number {
  return s.marks.filter(Boolean).length;
}

/** Press an empty cell to mark it, or a marked cell to lift the mark off; both are free. */
export function press(s: EnvelopeState, cell: number): EnvelopeState {
  if (s.matched || cell < 0 || cell >= CELLS) return s;
  const marks = s.marks.slice();
  marks[cell] = !marks[cell];
  return { ...s, marks };
}

export type Verdict = 'match' | 'fewer' | 'more';

export interface Crack {
  verdict: Verdict;
  marks: number;
  tokens: number;
  /** |marks − tokens|. */
  diff: number;
  /** Tokens and marks paired one to one. */
  paired: number;
}

export function crack(marks: number, tokens: number): Crack {
  const diff = Math.abs(marks - tokens);
  return { verdict: marks === tokens ? 'match' : marks < tokens ? 'fewer' : 'more', marks, tokens, diff, paired: Math.min(marks, tokens) };
}

/** Crack the envelope: a match finishes it; otherwise one miss, and the glow after the second miss. */
export function crackEnvelope(s: EnvelopeState): { state: EnvelopeState; crack: Crack } {
  const c = crack(markCount(s), s.tokens);
  if (c.verdict === 'match') return { state: { ...s, matched: true, glowing: false }, crack: c };
  const misses = s.misses + 1;
  const glowing = s.glowing || misses >= 2;
  return { state: { ...s, misses, glowing, hinted: s.hinted || glowing }, crack: c };
}

/** Asked-for help: the glow, counted once per envelope. */
export function askEnvelope(s: EnvelopeState): EnvelopeState {
  if (s.matched) return s;
  return { ...s, glowing: true, hinted: true };
}

export type EnvelopeHint = { cell: number; action: 'press' | 'lift' } | null;

/** What the glow points at: the next empty cell when there are too few marks, the last mark when there are too many. */
export function hintFor(s: EnvelopeState): EnvelopeHint {
  const n = markCount(s);
  if (n < s.tokens) {
    const cell = s.marks.indexOf(false);
    return cell < 0 ? null : { cell, action: 'press' };
  }
  if (n > s.tokens) {
    const cell = s.marks.lastIndexOf(true);
    return cell < 0 ? null : { cell, action: 'lift' };
  }
  return null;
}

// ——— Level 3: which row? ———

export interface TabletState {
  delivery: Kind[];
  /** Goods already marked. */
  placed: number;
  rows: Record<Kind, number>;
  misses: number;
  /** Wrong presses on the good now waiting. */
  wrongOnCurrent: number;
  /** The pet moved a mark for her (at most one hint per tablet). */
  hinted: boolean;
  /** The heading that glows for the rest of the tablet, or null. */
  glowing: Kind | null;
}

export function startTablet(delivery: Kind[]): TabletState {
  return { delivery, placed: 0, rows: { sheep: 0, jar: 0 }, misses: 0, wrongOnCurrent: 0, hinted: false, glowing: null };
}

export function waiting(s: TabletState): Kind | null {
  return s.placed < s.delivery.length ? s.delivery[s.placed] : null;
}

export function tabletDone(s: TabletState): boolean {
  return s.placed >= s.delivery.length;
}

export type Press = { accepted: true; state: TabletState; moved: false } | { accepted: false; state: TabletState; moved: boolean };

/** Press a row for the waiting good: the right row takes the mark; a wrong row is one miss, and the second wrong press moves it for her. */
export function pressRow(s: TabletState, row: Kind): Press {
  const good = waiting(s);
  if (good === null) return { accepted: false, state: s, moved: false };
  if (row === good) return { accepted: true, state: place(s, good), moved: false };
  const misses = s.misses + 1;
  const wrongOnCurrent = s.wrongOnCurrent + 1;
  if (wrongOnCurrent >= 2) {
    const moved = place({ ...s, misses, wrongOnCurrent }, good);
    return { accepted: false, moved: true, state: { ...moved, hinted: true, glowing: s.glowing ?? good } };
  }
  return { accepted: false, moved: false, state: { ...s, misses, wrongOnCurrent } };
}

function place(s: TabletState, good: Kind): TabletState {
  return { ...s, placed: s.placed + 1, rows: { ...s.rows, [good]: s.rows[good] + 1 }, wrongOnCurrent: 0 };
}

/** Asked-for help: the waiting good's row glows; the tablet's one hint if not yet spent. */
export function askTablet(s: TabletState): TabletState {
  const good = waiting(s);
  if (good === null) return s;
  return { ...s, hinted: true, glowing: good };
}

/** The read-back: how many of each kind the delivery held, which the rows always equal once it is done. */
export function readBack(delivery: readonly Kind[]): Record<Kind, number> {
  return { sheep: delivery.filter((k) => k === 'sheep').length, jar: delivery.filter((k) => k === 'jar').length };
}

// ——— Round accounting ———

export interface RoundTally {
  misses: number;
  hints: number;
}

export function envelopeTally(envelopes: readonly EnvelopeState[]): RoundTally {
  return { misses: envelopes.reduce((n, e) => n + e.misses, 0), hints: envelopes.filter((e) => e.hinted).length };
}

export function tabletTally(tablets: readonly TabletState[]): RoundTally {
  return { misses: tablets.reduce((n, t) => n + t.misses, 0), hints: tablets.filter((t) => t.hinted).length };
}

// ——— Layout ———

export interface Rect { x: number; y: number; w: number; h: number }
export interface Pt { x: number; y: number }
export const centre = (r: Rect): Pt => ({ x: r.x + r.w / 2, y: r.y + r.h / 2 });
export const overlaps = (a: Rect, b: Rect) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
const inside = (a: Rect, v: View) => a.x >= 0 && a.y >= 0 && a.x + a.w <= v.w && a.y + a.h <= v.h;

/** The home and ? buttons (top left) and the guide (bottom left). */
export const HOME_CORNER = { w: 130, h: 215 };
export const PET_CORNER = { w: 160, h: 170 };
export function corners(v: View): Rect[] {
  return [{ x: 0, y: 0, ...HOME_CORNER }, { x: 0, y: v.h - PET_CORNER.h, ...PET_CORNER }];
}

export const CELL = 110;
export const CELL_GAP = 10;
export const JAR = { w: 180, h: 200 };
export const CRACK = { w: 140, h: 110 };
export const ROW = { w: 460, h: 120 };
export const SIGN = 110;
const M = 20;
const GAP = 16;

export interface TabletLayout {
  /** The pen (level 1) or arrival lane (levels 2–3) along the top. */
  lane: Rect;
  /** Level 1: the jar. */
  jar?: Rect;
  /** Level 2: the whole ball (peek), its eight cells and the Crack control. */
  ball?: Rect;
  cells?: Rect[];
  crack?: Rect;
  /** Level 3: the two rows (sheep, then jar), each a full-height target, and the storehouse. */
  rows?: Rect[];
  store?: Rect;
  /** Where the record lines up against the things (visual, never a target). */
  lineup: Rect;
  /** Every tap target. */
  inputs: Rect[];
}

/**
 * The lane along the top, the record centred and large, the storehouse right in landscape (below in portrait). Null when
 * the view cannot hold full-size targets; nothing shrinks.
 */
export function tabletLayout(level: number, v: View): TabletLayout | null {
  const wide = v.w >= v.h;
  const plan = planFor(level);
  const left = HOME_CORNER.w + M;
  const lane: Rect = { x: left, y: M, w: v.w - left - M, h: 200 };
  const free: Rect = { x: PET_CORNER.w + M, y: lane.y + lane.h + M, w: v.w - PET_CORNER.w - 2 * M, h: v.h - lane.y - lane.h - 2 * M };
  const cx = free.x + free.w / 2;
  let l: TabletLayout;
  if (plan.id === 'tokens') {
    const jar: Rect = { x: cx - JAR.w / 2, y: free.y + 40, w: JAR.w, h: JAR.h };
    const lineup: Rect = { x: lane.x, y: jar.y + jar.h + GAP, w: lane.w, h: 120 };
    l = { lane, jar, lineup, inputs: [jar] };
  } else if (plan.id === 'envelope') {
    const gridW = CELL_COLUMNS * CELL + (CELL_COLUMNS - 1) * CELL_GAP;
    const gridH = 2 * CELL + CELL_GAP;
    // The ball's rim around the cells is the peek target; Crack sits beside it in landscape, below it in portrait.
    const rim = wide ? 76 : 48;
    const ballW = gridW + 2 * rim;
    const ballX = wide ? free.x + (free.w - ballW - GAP - CRACK.w) / 2 : cx - ballW / 2;
    const ball: Rect = { x: Math.round(ballX), y: free.y + 10, w: ballW, h: gridH + 150 };
    const gx = ball.x + rim;
    const gy = ball.y + 75;
    const cells = Array.from({ length: CELLS }, (_, i) => ({ x: gx + (i % CELL_COLUMNS) * (CELL + CELL_GAP), y: gy + Math.floor(i / CELL_COLUMNS) * (CELL + CELL_GAP), w: CELL, h: CELL }));
    const crack: Rect = wide
      ? { x: ball.x + ball.w + GAP, y: ball.y + ball.h / 2 - CRACK.h / 2, w: CRACK.w, h: CRACK.h }
      : { x: cx - CRACK.w / 2, y: ball.y + ball.h + GAP, w: CRACK.w, h: CRACK.h };
    const lineup: Rect = { x: free.x, y: (wide ? ball.y + ball.h : crack.y + crack.h) + GAP, w: free.w, h: 110 };
    l = { lane, ball, cells, crack, lineup, inputs: [ball, crack] };
  } else {
    const rowsX = wide ? free.x + 10 : cx - ROW.w / 2;
    const rows = [0, 1].map((i) => ({ x: rowsX, y: free.y + 10 + i * (ROW.h + GAP), w: ROW.w, h: ROW.h }));
    const store: Rect = wide
      ? { x: rows[0].x + ROW.w + GAP, y: rows[0].y, w: Math.max(100, v.w - M - rows[0].x - ROW.w - GAP), h: 2 * ROW.h + GAP }
      : { x: cx - 160, y: rows[1].y + ROW.h + GAP, w: 320, h: 150 };
    const lineup: Rect = { x: free.x, y: (wide ? rows[1].y + ROW.h : store.y + store.h) + GAP, w: free.w, h: 110 };
    l = { lane, rows, store, lineup, inputs: rows.slice() };
  }
  const parts = [l.lane, ...(l.cells ?? []), ...l.inputs, ...(l.store ? [l.store] : []), l.lineup];
  if (!parts.every((p) => inside(p, v))) return null;
  if (l.inputs.some((p) => corners(v).some((q) => overlaps(p, q)))) return null;
  if (l.cells?.some((c) => !inside(c, v))) return null;
  // Targets never cover one another (the cells sit on the ball on purpose).
  const targets = [...l.inputs.filter((p) => p !== l.ball), ...(l.cells ?? [])];
  if (targets.some((p, i) => targets.some((q, j) => i < j && overlaps(p, q)))) return null;
  if (l.store && l.inputs.some((p) => overlaps(p, l.store!))) return null;
  if (l.inputs.some((p) => overlaps(p, l.lane))) return null;
  return l;
}
