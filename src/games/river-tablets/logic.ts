/**
 * River Tablets rules: a record of real things, lined up against them one to one.
 * Level 1 drops a token in the jar for each sheep and tips the jar; level 2 presses one mark per token on a clay envelope and
 * cracks it open; level 3 presses each mark in the row with its picture and reads the tablet back; level 4 writes a cart's
 * crates and baskets with a big mark for ten and small marks for ones; level 5 checks a cart against a tablet written at the
 * farm: short, right or extra, and by how many; level 6 sets two tablets that disagree against one cart: which one
 * matches, neither, or can't tell when the cart is gone. Definition: docs/definitions/river-tablets.md.
 */
import type { ColorName } from '../../art/palette';
import type { Rng } from '../../engine/random';
import type { View } from '../../engine/view';

export type PlanId = 'tokens' | 'envelope' | 'rows' | 'tens' | 'check' | 'disagree';
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
  { level: 4, id: 'tens', name: 'A ten is a different mark: press big marks for tens and small marks for ones (two carts of 12–29)' },
  { level: 5, id: 'check', name: 'Check the delivery: short, right or extra, and by how many (two carts against tablets of 12–29)' },
  { level: 6, id: 'disagree', name: "Two tablets disagree: which one matches the cart, or can we tell? (a farm and a storehouse tablet of 12–29)" },
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

/** A cart as it stands in the yard: whole crates of ten and loose baskets. */
export interface Cart {
  crates: number;
  loose: number;
}
export const cartCount = (c: Cart) => 10 * c.crates + c.loose;

export interface TensBrief {
  level: 4;
  id: 'tens';
  /** Tablet 1 arrives packed (2–9 loose); tablet 2 arrives with a crate spilled (11–19 loose, 0–1 crates). Counts differ. */
  carts: [Cart, Cart];
  /** Where each loose basket stands in the yard: distinct slots of the scatter grid, one list per cart. */
  scatter: [number[], number[]];
}

export interface CheckBrief {
  level: 5;
  id: 'check';
  /** Each tablet's count `t` (written at the farm, shortest form) and the cart that came, `t + d` with |d| ≤ 3. */
  deliveries: [Delivery, Delivery];
}
export interface Delivery {
  t: number;
  c: number;
}

/** Level 6: what the cart shows against the two tablets. */
export type CaseKind = 'one' | 'neither' | 'gone';

export interface DisagreeCase {
  kind: CaseKind;
  /** The farm's tablet (left, by the field) and the storehouse's tablet (right, by its door): 12–29, 1–3 apart. */
  farm: number;
  store: number;
  /** The cart in the yard, or null when the baskets were already shared out. */
  cart: number | null;
}

export interface DisagreeBrief {
  level: 6;
  id: 'disagree';
  /** One case is always `one`; the other is `neither` or `gone`; their order is seeded. */
  cases: [DisagreeCase, DisagreeCase];
}

export type Brief = TokensBrief | EnvelopeBrief | RowsBrief | TensBrief | CheckBrief | DisagreeBrief;

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

/** The yard's scatter grid: loose baskets take distinct slots, never a row of ten. */
export const SCATTER_COLS = 11;
export const SCATTER_ROWS = 3;

/** `count` distinct slots of the scatter grid, seeded. */
export function scatterFor(count: number, rng: Rng): number[] {
  const slots = Array.from({ length: SCATTER_COLS * SCATTER_ROWS }, (_, i) => i);
  return rng.shuffle(slots).slice(0, count);
}

export function briefFor(level: number, rng: Rng): Brief {
  const plan = planFor(level);
  if (plan.id === 'tens') {
    // Tablet 1 packed: a count whose ones are 2–9. Tablet 2 spilled: 12–19 (no crate) or 21–29 (one crate burst).
    const first = (): number => { const n = rng.int(12, 29); return n % 10 >= 2 ? n : first(); };
    const a = first();
    const spilled = (): number => { const n = rng.int(12, 28); return n >= 20 ? n + 1 : n; };
    let b = spilled();
    while (b === a) b = spilled();
    const carts: [Cart, Cart] = [{ crates: Math.floor(a / 10), loose: a % 10 }, b >= 20 ? { crates: 1, loose: b - 10 } : { crates: 0, loose: b }];
    return { level: 4, id: 'tens', carts, scatter: [scatterFor(carts[0].loose, rng), scatterFor(carts[1].loose, rng)] };
  }
  if (plan.id === 'check') {
    const t1 = rng.int(12, 29);
    let t2 = rng.int(12, 28);
    if (t2 >= t1) t2++;
    const d1 = rng.int(-3, 3);
    // At least one cart is off.
    const d2 = d1 === 0 ? rng.pick([-3, -2, -1, 1, 2, 3]) : rng.int(-3, 3);
    const deliveries: [Delivery, Delivery] = rng.chance(0.5) ? [{ t: t1, c: t1 + d1 }, { t: t2, c: t2 + d2 }] : [{ t: t2, c: t2 + d2 }, { t: t1, c: t1 + d1 }];
    return { level: 5, id: 'check', deliveries };
  }
  if (plan.id === 'disagree') {
    const pair = (): [number, number] => {
      const a = rng.int(12, 29);
      const near = [-3, -2, -1, 1, 2, 3].map((d) => a + d).filter((b) => b >= 12 && b <= 29);
      const b = rng.pick(near);
      return rng.chance(0.5) ? [a, b] : [b, a];
    };
    const [f1, s1] = pair();
    const one: DisagreeCase = { kind: 'one', farm: f1, store: s1, cart: rng.chance(0.5) ? f1 : s1 };
    const [f2, s2] = pair();
    let other: DisagreeCase;
    if (rng.chance(0.5)) {
      other = { kind: 'gone', farm: f2, store: s2, cart: null };
    } else {
      // Every cart 12–29 within three of both tablets and equal to neither; never empty, since the tablets are 1–3 apart.
      const fits = Array.from({ length: 18 }, (_, i) => 12 + i).filter((c) => c !== f2 && c !== s2 && Math.abs(c - f2) <= 3 && Math.abs(c - s2) <= 3);
      other = { kind: 'neither', farm: f2, store: s2, cart: rng.pick(fits) };
    }
    return { level: 6, id: 'disagree', cases: rng.chance(0.5) ? [one, other] : [other, one] };
  }
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

// ——— Levels 4–5: a ten is a different mark ———

/** The ten strip holds up to 3 big marks; the ones strip up to 19 small ones, so a spilled crate can be written as ten small marks. */
export const TEN_CAP = 3;
export const ONE_CAP = 19;

export interface Reading {
  tens: number;
  ones: number;
}

/** What a tablet says: marks are additive, so the order they were pressed in never matters. */
export const value = (r: Reading) => 10 * r.tens + r.ones;
/** The fewest marks for `n`. */
export const shortest = (n: number): Reading => ({ tens: Math.floor(n / 10), ones: n % 10 });
export const cartOf = (n: number): Cart => ({ crates: Math.floor(n / 10), loose: n % 10 });

export interface TensState extends Reading {
  n: number;
  misses: number;
  hinted: boolean;
  glowing: boolean;
  done: boolean;
}

export function startTens(n: number): TensState {
  return { n, tens: 0, ones: 0, misses: 0, hinted: false, glowing: false, done: false };
}

export type Mark = 'ten' | 'one';

/** A stamp adds its mark; at its strip's cap it changes nothing (`capped`). Free. */
export function stamp(s: TensState, mark: Mark): { state: TensState; capped: boolean } {
  if (s.done) return { state: s, capped: false };
  if (mark === 'ten') return s.tens >= TEN_CAP ? { state: s, capped: true } : { state: { ...s, tens: s.tens + 1 }, capped: false };
  return s.ones >= ONE_CAP ? { state: s, capped: true } : { state: { ...s, ones: s.ones + 1 }, capped: false };
}

/** Tapping a strip lifts its last mark. Free. */
export function lift(s: TensState, mark: Mark): TensState {
  if (s.done) return s;
  if (mark === 'ten') return s.tens > 0 ? { ...s, tens: s.tens - 1 } : s;
  return s.ones > 0 ? { ...s, ones: s.ones - 1 } : s;
}

export type HandIn = 'match' | 'longer' | 'wrong';

/** Hand in: the count in fewest marks, an equal longer reading (right, no miss), or one miss with the glow after the second. */
export function handIn(s: TensState): { state: TensState; result: HandIn } {
  if (s.done) return { state: s, result: 'match' };
  if (value(s) === s.n) {
    const short = shortest(s.n);
    const result: HandIn = s.tens === short.tens && s.ones === short.ones ? 'match' : 'longer';
    return { state: { ...s, ...short, done: true, glowing: false }, result };
  }
  const misses = s.misses + 1;
  const glowing = s.glowing || misses >= 2;
  return { state: { ...s, misses, glowing, hinted: s.hinted || glowing }, result: 'wrong' };
}

/** Asked-for help: the glow, counted once per tablet. */
export function askTens(s: TensState): TensState {
  if (s.done) return s;
  return { ...s, glowing: true, hinted: true };
}

export type TensHint = 'handIn' | 'liftTen' | 'stampTen' | 'liftOne' | 'stampOne';

/** The glow: Hand in once the reading is equal, else one step toward the fewest marks, tens first. Never presses for her. */
export function tensHint(s: Reading & { n: number }): TensHint {
  if (value(s) === s.n) return 'handIn';
  const t = shortest(s.n);
  if (s.tens > t.tens) return 'liftTen';
  if (s.tens < t.tens) return 'stampTen';
  if (s.ones > t.ones) return 'liftOne';
  return 'stampOne';
}

// ——— Level 5: check the delivery ———

export type CartVerdict = 'short' | 'right' | 'extra';
export const CART_VERDICTS: readonly CartVerdict[] = ['short', 'right', 'extra'];

export function verdictFor(t: number, c: number): { verdict: CartVerdict; by: number } {
  return { verdict: c === t ? 'right' : c < t ? 'short' : 'extra', by: Math.abs(t - c) };
}

export interface CheckState extends Delivery {
  /** Short or extra chosen, waiting for its number (free to change). */
  open: CartVerdict | null;
  misses: number;
  hinted: boolean;
  /** The lineup plays and holds (help). */
  lined: boolean;
  done: boolean;
}

export function startCheck(d: Delivery): CheckState {
  return { ...d, open: null, misses: 0, hinted: false, lined: false, done: false };
}

export type CheckCommit = 'none' | 'right' | 'wrong';

function commit(s: CheckState, verdict: CartVerdict, by: number): { state: CheckState; result: CheckCommit } {
  const want = verdictFor(s.t, s.c);
  if (verdict === want.verdict && (verdict === 'right' || by === want.by)) return { state: { ...s, open: null, done: true }, result: 'right' };
  const misses = s.misses + 1;
  const lined = s.lined || misses >= 2;
  return { state: { ...s, open: null, misses, lined, hinted: s.hinted || lined }, result: 'wrong' };
}

/** A verdict button: Right commits by itself; short and extra open their numbers and commit nothing. */
export function chooseVerdict(s: CheckState, verdict: CartVerdict): { state: CheckState; result: CheckCommit } {
  if (s.done) return { state: s, result: 'none' };
  if (verdict === 'right') return commit(s, 'right', 0);
  return { state: { ...s, open: verdict }, result: 'none' };
}

/** A number button beside an open verdict commits the pair. */
export function chooseNumber(s: CheckState, by: number): { state: CheckState; result: CheckCommit } {
  if (s.done || s.open === null) return { state: s, result: 'none' };
  return commit(s, s.open, by);
}

/** Asked-for help: the lineup plays and holds, once per cart. */
export function askCheck(s: CheckState): CheckState {
  if (s.done) return s;
  return { ...s, lined: true, hinted: true };
}

// ——— Level 6: two tablets disagree ———

export type Answer = 'farm' | 'storehouse' | 'neither' | 'cantTell';
export const ANSWERS: readonly Answer[] = ['farm', 'storehouse', 'neither', 'cantTell'];

/** Every reading consistent with what is on screen: one for a cart in the yard; an empty cart fits farm, storehouse and neither alike. */
export function readings(c: DisagreeCase): Answer[] {
  if (c.cart === null) return ['farm', 'storehouse', 'neither'];
  if (c.cart === c.farm) return ['farm'];
  if (c.cart === c.store) return ['storehouse'];
  return ['neither'];
}

/** The one accepted answer: the only consistent reading, or can't tell when more than one is consistent. */
export function answerFor(c: DisagreeCase): Answer {
  const r = readings(c);
  return r.length === 1 ? r[0] : 'cantTell';
}

export const accepts = (c: DisagreeCase, a: Answer) => answerFor(c) === a;

/** Why a pick was wrong, for the pet's reason. */
export type DisagreeMiss = 'wrong-tablet' | 'wrong-neither' | 'wrong-cant' | 'wrong-gone';

export function missReason(c: DisagreeCase, a: Answer): DisagreeMiss | null {
  if (accepts(c, a)) return null;
  if (c.cart === null) return 'wrong-gone';
  if (a === 'cantTell') return 'wrong-cant';
  if (a === 'neither') return 'wrong-neither';
  return 'wrong-tablet';
}

export interface DisagreeState extends DisagreeCase {
  misses: number;
  hinted: boolean;
  /** The help plays and holds: each tablet's lineup (a cart) or the empty cart's glow (gone). */
  lined: boolean;
  done: boolean;
}

export function startDisagree(c: DisagreeCase): DisagreeState {
  return { ...c, misses: 0, hinted: false, lined: false, done: false };
}

/** Picking is the commit: the accepted answer finishes the case; anything else is one miss, the help after the second. */
export function pickAnswer(s: DisagreeState, a: Answer): { state: DisagreeState; result: 'none' | 'right' | 'wrong'; reason: DisagreeMiss | null } {
  if (s.done) return { state: s, result: 'none', reason: null };
  const reason = missReason(s, a);
  if (reason === null) return { state: { ...s, done: true }, result: 'right', reason };
  const misses = s.misses + 1;
  const lined = s.lined || misses >= 2;
  return { state: { ...s, misses, lined, hinted: s.hinted || lined }, result: 'wrong', reason };
}

/** Asked-for help: the same help, once per case. */
export function askDisagree(s: DisagreeState): DisagreeState {
  if (s.done) return s;
  return { ...s, lined: true, hinted: true };
}

export function disagreeTally(cases: readonly DisagreeState[]): RoundTally {
  return { misses: cases.reduce((n, t) => n + t.misses, 0), hints: cases.filter((t) => t.hinted).length };
}

// ——— The lineup: goods under marks ———

export interface Lineup {
  /** Under each ten-mark: a whole crate, or `filled` loose baskets of its ten. */
  tens: { crate: boolean; filled: number }[];
  /** Under each one-mark: a basket or nothing. */
  ones: boolean[];
  /** Baskets left over with no mark. */
  extra: number;
  /** Empty places under marks. */
  gaps: number;
}

/**
 * Line a cart up against a reading: crates under ten-marks; a crate with no ten-mark opens into loose baskets; loose
 * baskets fill the one-marks, then any empty ten-mark's places; the rest are extra.
 */
export function lineUp(r: Reading, cart: Cart): Lineup {
  const crates = Math.min(r.tens, cart.crates);
  let loose = cart.loose + 10 * (cart.crates - crates);
  const ones = Array.from({ length: r.ones }, () => (loose > 0 ? (loose--, true) : false));
  const tens = Array.from({ length: r.tens }, (_, i) => {
    if (i < crates) return { crate: true, filled: 10 };
    const filled = Math.min(10, loose);
    loose -= filled;
    return { crate: false, filled };
  });
  const gaps = ones.filter((o) => !o).length + tens.reduce((n, t) => n + (10 - t.filled), 0);
  return { tens, ones, extra: loose, gaps };
}

export function tensTally(tablets: readonly TensState[]): RoundTally {
  return { misses: tablets.reduce((n, t) => n + t.misses, 0), hints: tablets.filter((t) => t.hinted).length };
}

export function checkTally(carts: readonly CheckState[]): RoundTally {
  return { misses: carts.reduce((n, t) => n + t.misses, 0), hints: carts.filter((t) => t.hinted).length };
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
const inside = (a: Rect, v: { x?: number; y?: number; w: number; h: number }) => a.x >= (v.x ?? 0) && a.y >= (v.y ?? 0) && a.x + a.w <= (v.x ?? 0) + v.w && a.y + a.h <= (v.y ?? 0) + v.h;

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
/** Levels 4–5: the yard's height, a crate place, a strip, the tablet's read-aloud band above the strips, a stamp, a verdict and a number button. */
export const YARD_H = 180;
export const CRATE = { w: 104, h: 100 };
export const STRIP = { w: 460, h: 120 };
export const READ_H = 100;
export const STAMP = { w: 140, h: 120 };
export const VERDICT = 120;
export const NUMBER = 110;
/** Level 6: a tablet, its "this one" button, and neither / can't tell. */
export const PAIR_TABLET = { w: 300, h: 260 };
export const PICK = 110;
export const ANSWER = 120;
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
  /** Levels 4–5: the yard (the lane; tapping it counts the cart at level 4), its crate places, and the loose baskets' area. */
  crates?: Rect[];
  baskets?: Rect;
  /** Levels 4–5: the tablet (tapping its face reads it) and its ten and ones strips. */
  tablet?: Rect;
  strips?: Rect[];
  /** Level 4: the ten and one stamps, and Hand in. */
  stamps?: Rect[];
  handIn?: Rect;
  /** Level 5: short, right and extra, and the numbers one to three. */
  verdicts?: Rect[];
  numbers?: Rect[];
  /** Level 6: the farm's and the storehouse's tablets (tap to read), a "this one" button under each, neither and can't tell between them, and a lineup under each. */
  pair?: Rect[];
  picks?: Rect[];
  neither?: Rect;
  cantTell?: Rect;
  lineups?: Rect[];
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
  const yardLevel = plan.id === 'tens' || plan.id === 'check' || plan.id === 'disagree';
  const lane: Rect = { x: left, y: M, w: v.w - left - M, h: yardLevel ? YARD_H : 200 };
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
  } else if (plan.id === 'disagree') {
    const crates = [0, 1, 2].map((i) => ({ x: lane.x + 16 + i * (CRATE.w + 8), y: lane.y + lane.h - CRATE.h - 8, w: CRATE.w, h: CRATE.h }));
    const bx = crates[2].x + CRATE.w + 12;
    const baskets: Rect = { x: bx, y: lane.y + 16, w: lane.x + lane.w - 16 - bx, h: lane.h - 26 };
    // Farm | neither, can't tell | storehouse; each tablet's button below it, then each tablet's lineup.
    const groupW = 2 * PAIR_TABLET.w + 2 * GAP + ANSWER;
    const groupH = PAIR_TABLET.h + 12 + PICK + 12 + 110;
    const x0 = Math.round(free.x + (free.w - groupW) / 2);
    const spare = wide ? 0 : Math.max(0, free.h - groupH - 6) / 3;
    const y0 = free.y + 6 + Math.round(spare);
    const pair = [0, 1].map((i) => ({ x: x0 + i * (PAIR_TABLET.w + 2 * GAP + ANSWER), y: y0, w: PAIR_TABLET.w, h: PAIR_TABLET.h }));
    const picks = pair.map((t) => ({ x: t.x + (t.w - PICK) / 2, y: t.y + t.h + 12, w: PICK, h: PICK }));
    const mid = x0 + PAIR_TABLET.w + GAP;
    const neither: Rect = { x: mid, y: y0, w: ANSWER, h: ANSWER };
    const cantTell: Rect = { x: mid, y: y0 + ANSWER + GAP, w: ANSWER, h: ANSWER };
    const ly = picks[0].y + PICK + 12;
    const half = (groupW - GAP) / 2;
    const lineups = [0, 1].map((i) => ({ x: x0 + i * (half + GAP), y: ly, w: half, h: 110 }));
    const lineup: Rect = { x: x0, y: ly, w: groupW, h: 110 };
    l = { lane, crates, baskets, pair, picks, neither, cantTell, lineups, lineup, inputs: [...pair, ...picks, neither, cantTell] };
  } else if (yardLevel) {
    const crates = [0, 1, 2].map((i) => ({ x: lane.x + 16 + i * (CRATE.w + 8), y: lane.y + lane.h - CRATE.h - 8, w: CRATE.w, h: CRATE.h }));
    const bx = crates[2].x + CRATE.w + 12;
    const baskets: Rect = { x: bx, y: lane.y + 16, w: lane.x + lane.w - 16 - bx, h: lane.h - 26 };
    const tabletH = READ_H + 2 * STRIP.h + 2 * 12 + 20;
    // Portrait has room to spare below: the tablet and its lineup sit a third of the way down it rather than at the top.
    const spare = wide ? 0 : Math.max(0, free.h - tabletH - 12 - 110 - 6) / 3;
    const tablet: Rect = { x: free.x, y: free.y + 6 + Math.round(spare), w: STRIP.w + 40, h: tabletH };
    const strips = [0, 1].map((i) => ({ x: tablet.x + 20, y: tablet.y + READ_H + 8 + i * (STRIP.h + 12), w: STRIP.w, h: STRIP.h }));
    const col = tablet.x + tablet.w + GAP;
    const lineup: Rect = { x: free.x, y: tablet.y + tablet.h + 12, w: plan.id === 'tens' ? free.w : tablet.w, h: 110 };
    if (plan.id === 'tens') {
      const stamps = strips.map((r) => ({ x: col, y: r.y, w: STAMP.w, h: STAMP.h }));
      const handIn: Rect = { x: col + STAMP.w + GAP, y: (strips[0].y + strips[1].y + STRIP.h) / 2 - CRACK.h / 2, w: CRACK.w, h: CRACK.h };
      l = { lane, crates, baskets, tablet, strips, stamps, handIn, lineup, inputs: [tablet, ...strips, ...stamps, handIn] };
    } else {
      const verdicts = [0, 1, 2].map((i) => ({ x: col, y: tablet.y + i * (VERDICT + GAP), w: VERDICT, h: VERDICT }));
      const numbers = verdicts.map((r) => ({ x: col + VERDICT + GAP, y: r.y + (VERDICT - NUMBER) / 2, w: NUMBER, h: NUMBER }));
      l = { lane, crates, baskets, tablet, strips, verdicts, numbers, lineup, inputs: [tablet, ...verdicts, ...numbers] };
    }
  } else {
    const rowsX = wide ? free.x + 10 : cx - ROW.w / 2;
    const rows = [0, 1].map((i) => ({ x: rowsX, y: free.y + 10 + i * (ROW.h + GAP), w: ROW.w, h: ROW.h }));
    const store: Rect = wide
      ? { x: rows[0].x + ROW.w + GAP, y: rows[0].y, w: Math.max(100, v.w - M - rows[0].x - ROW.w - GAP), h: 2 * ROW.h + GAP }
      : { x: cx - 160, y: rows[1].y + ROW.h + GAP, w: 320, h: 150 };
    const lineup: Rect = { x: free.x, y: (wide ? rows[1].y + ROW.h : store.y + store.h) + GAP, w: free.w, h: 110 };
    l = { lane, rows, store, lineup, inputs: rows.slice() };
  }
  const parts = [l.lane, ...(l.cells ?? []), ...l.inputs, ...(l.store ? [l.store] : []), l.lineup, ...(l.crates ?? [])];
  if (!parts.every((p) => inside(p, v))) return null;
  if (l.inputs.some((p) => corners(v).some((q) => overlaps(p, q)))) return null;
  if (l.cells?.some((c) => !inside(c, v))) return null;
  // Targets never cover one another (the cells sit on the ball and the strips on the tablet on purpose).
  const targets = [...l.inputs.filter((p) => p !== l.ball && p !== l.tablet), ...(l.cells ?? []), ...(l.crates ?? [])];
  if (l.crates?.some((c) => !inside(c, l.lane) || overlaps(c, l.baskets!))) return null;
  if (l.inputs.some((p) => overlaps(p, l.lineup)) && (l.verdicts || l.pair)) return null;
  if (targets.some((p, i) => targets.some((q, j) => i < j && overlaps(p, q)))) return null;
  if (l.store && l.inputs.some((p) => overlaps(p, l.store!))) return null;
  if (l.inputs.some((p) => overlaps(p, l.lane))) return null;
  return l;
}
