/**
 * Not Always: a friend on a crate says something about every card in a row; she finds the card that breaks it, stamps
 * Every one! when nothing does, and at level 3 picks the claim the friend could have said instead. Every claim is about
 * the cards on screen only. Rules, rows, accounting and layout live here so tests can check them.
 */
import type { Rng } from '../../engine/random';
import type { BandLevels } from '../../progress/difficulty';

export type Color = 'red' | 'blue' | 'yellow';
export const COLORS: readonly Color[] = ['red', 'blue', 'yellow'];
export type Part = 'hat' | 'wings' | 'spots';
export const PARTS: readonly Part[] = ['hat', 'wings', 'spots'];
export type Attr = Color | Part;
export const ATTRS: readonly Attr[] = [...COLORS, ...PARTS];

export interface Card { color: Color; hat: boolean; wings: boolean; spots: boolean }
/** No other quantifier exists: *not all* is only the sign's change after a break. */
export interface Claim { q: 'every' | 'none'; attr: Attr }

/** The four things a card can differ on; a colour claim is about the `color` dimension. */
type Dim = 'color' | Part;
const DIMS: readonly Dim[] = ['color', ...PARTS];
const dimOf = (a: Attr): Dim => (COLORS.includes(a as Color) ? 'color' : (a as Part));
const valueOn = (c: Card, d: Dim): string => (d === 'color' ? c.color : String(c[d]));

export function holds(card: Card, attr: Attr): boolean {
  return COLORS.includes(attr as Color) ? card.color === attr : card[attr as Part];
}

/** The cards (by index) that show the claim is not so. */
export function breakers(row: readonly Card[], claim: Claim): number[] {
  const out: number[] = [];
  row.forEach((c, i) => { if (holds(c, claim.attr) !== (claim.q === 'every')) out.push(i); });
  return out;
}

export const isTrue = (row: readonly Card[], claim: Claim) => breakers(row, claim).length === 0;
export const sameCard = (a: Card, b: Card) => a.color === b.color && a.hat === b.hat && a.wings === b.wings && a.spots === b.spots;
export const sameClaim = (a: Claim, b: Claim) => a.q === b.q && a.attr === b.attr;

/** The card is the only one in the row that differs on `d`, with every other card the same there. */
export function oddOn(row: readonly Card[], i: number, d: Dim): boolean {
  const others = row.filter((_, k) => k !== i).map((c) => valueOn(c, d));
  return others.every((v) => v === others[0]) && valueOn(row[i], d) !== others[0];
}

/** The decoy rule: some card that does not break a false claim is the odd one out on another dimension, so only the spoken claim decides. */
export function hasDecoy(row: readonly Card[], claim: Claim): boolean {
  const br = breakers(row, claim);
  if (br.length === 0) return true;
  const d0 = dimOf(claim.attr);
  return row.some((_, i) => !br.includes(i) && DIMS.some((d) => d !== d0 && oddOn(row, i, d)));
}

export type Mode = 'break' | 'stamp' | 'mend';
export interface Plan { level: number; name: string; mode: Mode; cards: number }
export const PLANS: readonly Plan[] = [
  { level: 1, name: 'Not all of them: tap the card that breaks each claim', mode: 'break', cards: 4 },
  { level: 2, name: 'Every one? Tap a card that breaks it, or stamp it true', mode: 'stamp', cards: 5 },
  { level: 3, name: 'Say it better: break the claim, then choose one true of every card', mode: 'mend', cards: 4 },
];
export const LEVELS: BandLevels = { prek: { min: 1, max: 2 }, school: { min: 1, max: 3 } };
export const planFor = (level: number): Plan => PLANS[Math.max(0, Math.min(PLANS.length - 1, level - 1))];

export interface Round {
  level: number;
  cards: Card[];
  claims: Claim[];
  /** Level 3: three shuffled mended claims for each claim, exactly one true of every card. */
  mends: Claim[][];
}

const card = (color: Color, hat: boolean, wings: boolean, spots: boolean): Card => ({ color, hat, wings, spots });
const every = (attr: Attr): Claim => ({ q: 'every', attr });
const none = (attr: Attr): Claim => ({ q: 'none', attr });

/** Level 1's authored round, the definition's table: A, B, C, D and their claims in order. */
export const AUTHORED_1: Round = {
  level: 1,
  cards: [card('red', true, false, false), card('red', true, true, false), card('red', false, true, false), card('blue', true, true, false)],
  claims: [every('hat'), every('red'), every('wings')],
  mends: [],
};
/** Level 2's authored round: all wear hats (true, second); not all red (blue and yellow break it); not all have wings (one). */
export const AUTHORED_2: Round = {
  level: 2,
  cards: [card('red', true, true, false), card('red', true, false, false), card('red', true, true, true), card('blue', true, true, false), card('yellow', true, true, false)],
  claims: [every('red'), every('hat'), every('wings')],
  mends: [],
};
/** Level 3's authored round: hats broken by the bare one (true mend: none have spots), red broken by the blue one (true mend: none are yellow). */
export const AUTHORED_3: Round = {
  level: 3,
  cards: [card('red', true, true, false), card('blue', true, true, false), card('red', false, true, false), card('red', true, false, false)],
  claims: [every('hat'), every('red')],
  mends: [[none('hat'), none('spots'), every('blue')], [every('hat'), none('red'), none('yellow')]],
};

const randomCard = (rng: Rng): Card => card(rng.pick(COLORS), rng.chance(0.5), rng.chance(0.5), rng.chance(0.5));

function distinctRow(_rng: Rng, n: number, make: () => Card): Card[] | null {
  const row: Card[] = [];
  for (let t = 0; row.length < n && t < 200; t++) {
    const c = make();
    if (!row.some((r) => sameCard(r, c))) row.push(c);
  }
  return row.length === n ? row : null;
}

const everyClaims = (): Claim[] => ATTRS.map(every);

function level1(rng: Rng): Round {
  for (let tries = 0; tries < 5000; tries++) {
    const cards = distinctRow(rng, 4, () => randomCard(rng));
    if (!cards) continue;
    // Claims with exactly one breaker, at most one per dimension, each passing the decoy rule.
    const ok = rng.shuffle(everyClaims()).filter((c) => breakers(cards, c).length === 1 && hasDecoy(cards, c));
    const chosen: Claim[] = [];
    for (const c of ok) {
      if (chosen.length === 3) break;
      if (chosen.some((k) => dimOf(k.attr) === dimOf(c.attr) || breakers(cards, k)[0] === breakers(cards, c)[0])) continue;
      chosen.push(c);
    }
    if (chosen.length === 3) return { level: 1, cards, claims: chosen, mends: [] };
  }
  return AUTHORED_1;
}

function level2(rng: Rng): Round {
  for (let tries = 0; tries < 5000; tries++) {
    const nTrue = rng.chance(0.5) ? 1 : 2;
    const trueAttrs: Attr[] = [];
    for (const d of rng.shuffle([...DIMS])) {
      if (trueAttrs.length === nTrue) break;
      trueAttrs.push(d === 'color' ? rng.pick(COLORS) : d);
    }
    const fixed = (c: Card): Card => {
      const out = { ...c };
      for (const a of trueAttrs) if (COLORS.includes(a as Color)) out.color = a as Color; else out[a as Part] = true;
      return out;
    };
    const cards = distinctRow(rng, 5, () => fixed(randomCard(rng)));
    if (!cards) continue;
    const used = new Set(trueAttrs.map(dimOf));
    const falses: Claim[] = [];
    for (const c of rng.shuffle(everyClaims())) {
      if (falses.length === 3 - nTrue) break;
      const n = breakers(cards, c).length;
      // With two true claims, five distinct cards differ on only two dimensions and no card can be another one's odd one out,
      // so the decoy rule holds only for one-true rows (tests check both).
      if (n < 1 || n > 2 || used.has(dimOf(c.attr)) || (nTrue === 1 && !hasDecoy(cards, c))) continue;
      used.add(dimOf(c.attr));
      falses.push(c);
    }
    if (falses.length !== 3 - nTrue) continue;
    const claims = rng.shuffle([...trueAttrs.map(every), ...falses]);
    return { level: 2, cards, claims, mends: [] };
  }
  return AUTHORED_2;
}

/** The three mended claims for a broken one: the true one, `none` on the broken attribute, and an `every` with a breaker on a third. */
export function mendsFor(cards: readonly Card[], broken: Claim, rng: Rng): Claim[] | null {
  const universals = ATTRS.flatMap((a) => [every(a), none(a)]).filter((c) => isTrue(cards, c) && dimOf(c.attr) !== dimOf(broken.attr));
  if (universals.length === 0) return null;
  const truth = rng.pick(universals);
  const third = rng.shuffle(everyClaims()).find((c) => !isTrue(cards, c) && dimOf(c.attr) !== dimOf(broken.attr) && dimOf(c.attr) !== dimOf(truth.attr));
  if (!third) return null;
  return rng.shuffle([truth, none(broken.attr), third]);
}

function level3(rng: Rng): Round {
  for (let tries = 0; tries < 5000; tries++) {
    const cards = distinctRow(rng, 4, () => randomCard(rng));
    if (!cards) continue;
    const ok = rng.shuffle(everyClaims()).filter((c) => breakers(cards, c).length === 1);
    const claims: Claim[] = [];
    for (const c of ok) {
      if (claims.length === 2) break;
      if (claims.some((k) => dimOf(k.attr) === dimOf(c.attr))) continue;
      claims.push(c);
    }
    if (claims.length !== 2) continue;
    const mends = claims.map((c) => mendsFor(cards, c, rng));
    if (mends.some((m) => !m)) continue;
    return { level: 3, cards, claims, mends: mends as Claim[][] };
  }
  return AUTHORED_3;
}

/** A round at the level: the authored one when asked, otherwise seeded. */
export function makeRound(level: number, rng: Rng, authored = false): Round {
  const lv = planFor(level).level;
  if (authored) {
    const a = lv === 1 ? AUTHORED_1 : lv === 2 ? AUTHORED_2 : AUTHORED_3;
    return { level: a.level, cards: a.cards.map((c) => ({ ...c })), claims: a.claims.map((c) => ({ ...c })), mends: a.mends.map((m) => m.map((c) => ({ ...c }))) };
  }
  return lv === 1 ? level1(rng) : lv === 2 ? level2(rng) : level3(rng);
}

/** What the glow points at: a card, the stamp, or a mended sign. */
export type Target = { kind: 'card'; i: number } | { kind: 'stamp' } | { kind: 'mend'; j: number };

/** The hint target for a claim: its first breaker left to right, or the stamp when it is true. */
export function glowFor(row: readonly Card[], claim: Claim): Target {
  const br = breakers(row, claim);
  return br.length ? { kind: 'card', i: br[0] } : { kind: 'stamp' };
}
/** The hint target for a mend: the true option. */
export const trueMend = (row: readonly Card[], options: readonly Claim[]): number => options.findIndex((c) => isTrue(row, c));

export type Outcome =
  /** Nothing counted: a tap while nothing is asked, or a card tap during the mend. */
  | { kind: 'free' }
  /** One miss; `glow` when this miss turned the glow on (one hint counted). For a card or a mend, `card` is the one to point at. */
  | { kind: 'miss'; why: 'fits' | 'too' | 'stamp' | 'mend'; card: number | null; glow: boolean }
  /** A breaker tapped: the claim is broken. `mend` when the mended signs come next. */
  | { kind: 'break'; card: number; next: Phase }
  /** The stamp on a true claim. */
  | { kind: 'every'; next: Phase }
  /** The true mended claim chosen. */
  | { kind: 'mended'; next: Phase };

export type Phase = 'claim' | 'mend' | 'done';

/** One round's play and its accounting: one miss per counted wrong answer, one hint per claim or mend at most. */
export class Play {
  claim = 0;
  phase: Phase = 'claim';
  misses = 0;
  hints = 0;
  /** Misses on the current claim or mend. */
  stepMisses = 0;
  /** The glow is showing for the current claim or mend (counted once). */
  glowing = false;

  constructor(readonly round: Round) {}

  get current(): Claim { return this.round.claims[this.claim]; }
  get options(): Claim[] { return this.round.mends[this.claim] ?? []; }
  get mode(): Mode { return planFor(this.round.level).mode; }

  /** What the glow and the ghost finger point at now. */
  target(): Target | null {
    if (this.phase === 'done') return null;
    if (this.phase === 'mend') return { kind: 'mend', j: trueMend(this.round.cards, this.options) };
    return glowFor(this.round.cards, this.current);
  }

  private miss(why: 'fits' | 'too' | 'stamp' | 'mend', card: number | null): Outcome {
    this.misses++;
    this.stepMisses++;
    let glow = false;
    if (this.stepMisses >= 2 && !this.glowing) { this.glowing = true; this.hints++; glow = true; }
    return { kind: 'miss', why, card, glow };
  }

  private advance(): Phase {
    this.stepMisses = 0;
    this.glowing = false;
    if (this.phase === 'claim' && this.mode === 'mend') return (this.phase = 'mend');
    this.claim++;
    return (this.phase = this.claim >= this.round.claims.length ? 'done' : 'claim');
  }

  tapCard(i: number): Outcome {
    if (this.phase !== 'claim') return { kind: 'free' };
    const br = breakers(this.round.cards, this.current);
    if (br.includes(i)) return { kind: 'break', card: i, next: this.advance() };
    return this.miss(br.length === 0 ? 'too' : 'fits', i);
  }

  stamp(): Outcome {
    if (this.phase !== 'claim' || this.mode !== 'stamp') return { kind: 'free' };
    if (isTrue(this.round.cards, this.current)) return { kind: 'every', next: this.advance() };
    return this.miss('stamp', null);
  }

  chooseMend(j: number): Outcome {
    if (this.phase !== 'mend') return { kind: 'free' };
    const option = this.options[j];
    if (!option) return { kind: 'free' };
    const br = breakers(this.round.cards, option);
    if (br.length === 0) return { kind: 'mended', next: this.advance() };
    return this.miss('mend', br[0]);
  }

  /** Show me: glows the target and counts one hint, once per claim or mend; false when it was already glowing. */
  requestHint(): boolean {
    if (this.phase === 'done' || this.glowing) return false;
    this.glowing = true;
    this.hints++;
    return true;
  }
}

// Layout ------------------------------------------------------------------------------------------------------------

export interface Rect { x: number; y: number; w: number; h: number }
export const CARD_W = 150, CARD_H = 180, GAP = 16;
export const STAMP = 130;
export const MEND_W = 220, MEND_H = 120;
export const SIGN_W = 240, SIGN_H = 110;
/** The pet's bottom-left corner, kept clear. */
export const PET_CORNER = 150;
/** The friend on its crate: feet on `friend` (its centre bottom), `FRIEND_H` tall with the crate under the feet. */
export const FRIEND_H = 150, CRATE_H = 46;

export interface NotAlwaysLayout {
  sign: Rect;
  /** The friend's tap area, with `foot` the point its feet stand on (top of the crate). */
  friend: Rect;
  foot: { x: number; y: number };
  cards: Rect[];
  stamp: Rect | null;
  mends: Rect[];
}

export function notAlwaysLayout(view: { w: number; h: number }, level: number): NotAlwaysLayout {
  const plan = planFor(level);
  const portrait = view.h > view.w;
  const cx = view.w / 2;
  const sign: Rect = { x: cx - SIGN_W / 2, y: 18, w: SIGN_W, h: SIGN_H };
  const foot = { x: cx, y: sign.y + sign.h + 12 + FRIEND_H };
  const friend: Rect = { x: cx - 80, y: foot.y - FRIEND_H, w: 160, h: FRIEND_H + CRATE_H };
  const top = foot.y + CRATE_H + 20;
  const perRow = plan.cards === 5 && (portrait || view.w < 850) ? [3, 2] : [plan.cards];
  const cards: Rect[] = [];
  perRow.forEach((n, r) => {
    const rowW = n * CARD_W + (n - 1) * GAP;
    for (let k = 0; k < n; k++) cards.push({ x: cx - rowW / 2 + k * (CARD_W + GAP), y: top + r * (CARD_H + GAP), w: CARD_W, h: CARD_H });
  });
  const below = top + perRow.length * (CARD_H + GAP) + 4;
  const stamp = plan.mode === 'stamp' ? { x: cx - STAMP / 2, y: below, w: STAMP, h: STAMP } : null;
  const mends: Rect[] = [];
  if (plan.mode === 'mend') {
    const rowW = 3 * MEND_W + 2 * GAP;
    for (let j = 0; j < 3; j++) mends.push({ x: cx - rowW / 2 + j * (MEND_W + GAP), y: below, w: MEND_W, h: MEND_H });
  }
  return { sign, friend, foot, cards, stamp, mends };
}
