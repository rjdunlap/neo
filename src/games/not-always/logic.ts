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
/** Level 4's frame behind the creature: a big circle or a big square. Levels 1–3 cards have no frame. */
export type Shape = 'round' | 'square';
export const SHAPES: readonly Shape[] = ['round', 'square'];
/** Anything a claim can test: an attribute, or (level 4) a frame shape. */
export type Prop = Attr | Shape;

export interface Card {
  color: Color;
  hat: boolean;
  wings: boolean;
  spots: boolean;
  shape?: Shape;
}
/** No other quantifier exists: *not all* is only the sign's change after a break. */
export interface Claim {
  q: 'every' | 'none';
  attr: Prop;
  /** Levels 4 and 6: the claim is only about the cards that show this ("every red one is round"). */
  if?: Attr;
}

/** The four things a card can differ on; a colour claim is about the `color` dimension. */
type Dim = 'color' | Part;
const DIMS: readonly Dim[] = ['color', ...PARTS];
const dimOf = (a: Prop): Dim | 'shape' => (SHAPES.includes(a as Shape) ? 'shape' : dimOf3(a as Attr));
const dimOf3 = (a: Attr): Dim => (COLORS.includes(a as Color) ? 'color' : (a as Part));
const valueOn = (c: Card, d: Dim): string => (d === 'color' ? c.color : String(c[d]));

export function holds(card: Card, attr: Prop): boolean {
  if (SHAPES.includes(attr as Shape)) return card.shape === attr;
  return COLORS.includes(attr as Color) ? card.color === attr : card[attr as Part];
}

/** The cards (by index) that show the claim is not so. */
export function breakers(row: readonly Card[], claim: Claim): number[] {
  const out: number[] = [];
  row.forEach((c, i) => {
    if (claim.if && !holds(c, claim.if)) return;
    if (holds(c, claim.attr) !== (claim.q === 'every')) out.push(i);
  });
  return out;
}

export const isTrue = (row: readonly Card[], claim: Claim) => breakers(row, claim).length === 0;
export const sameCard = (a: Card, b: Card) =>
  a.color === b.color && a.hat === b.hat && a.wings === b.wings && a.spots === b.spots && a.shape === b.shape;
export const sameClaim = (a: Claim, b: Claim) => a.q === b.q && a.attr === b.attr && a.if === b.if;
/** The cards a filtered claim talks about (every card for a plain claim). */
export const members = (row: readonly Card[], claim: Claim): number[] =>
  row.flatMap((c, i) => (!claim.if || holds(c, claim.if) ? [i] : []));

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

export type Mode = 'break' | 'stamp' | 'mend' | 'filter' | 'why' | 'both';
export interface Plan {
  level: number;
  name: string;
  mode: Mode;
  cards: number;
}
export const PLANS: readonly Plan[] = [
  { level: 1, name: 'Not all of them: tap the card that breaks each claim', mode: 'break', cards: 4 },
  { level: 2, name: 'Every one? Tap a card that breaks it, or stamp it true', mode: 'stamp', cards: 5 },
  {
    level: 3,
    name: 'Say it better: break the claim, then choose one true of every card',
    mode: 'mend',
    cards: 4,
  },
  { level: 4, name: 'Only the red ones count: a claim about some of the cards', mode: 'filter', cards: 4 },
  {
    level: 5,
    name: 'Show me why: choose what settles a disagreement (about 10 and up)',
    mode: 'why',
    cards: 0,
  },
  {
    level: 6,
    name: 'Both can be true: check two claims on one row (about 10 and up)',
    mode: 'both',
    cards: 4,
  },
];
export const LEVELS: BandLevels = { prek: { min: 1, max: 2 }, school: { min: 1, max: 6 } };
export const planFor = (level: number): Plan => PLANS[Math.max(0, Math.min(PLANS.length - 1, level - 1))];

export interface Round {
  level: number;
  cards: Card[];
  claims: Claim[];
  /** Level 3: three shuffled mended claims for each claim, exactly one true of every card. */
  mends: Claim[][];
  /** Levels 4–6: one prompt each, with its own row (4, 6) or scene (5); `cards` and `claims` are then empty. */
  prompts?: Prompt[];
  /** Level 6: the reply bubbles' order, the continuing reply first or second. */
  replies?: Reply[];
}
/** A level 4–6 prompt: one filtered claim (4), two claims on one row (6), or a disagreement about a scene (5). */
export interface Prompt {
  row: Card[];
  claims: Claim[];
  why?: Why;
}

const card = (color: Color, hat: boolean, wings: boolean, spots: boolean): Card => ({
  color,
  hat,
  wings,
  spots,
});
const every = (attr: Prop): Claim => ({ q: 'every', attr });
const none = (attr: Prop): Claim => ({ q: 'none', attr });

/** Level 1's authored round, the definition's table: A, B, C, D and their claims in order. */
export const AUTHORED_1: Round = {
  level: 1,
  cards: [
    card('red', true, false, false),
    card('red', true, true, false),
    card('red', false, true, false),
    card('blue', true, true, false),
  ],
  claims: [every('hat'), every('red'), every('wings')],
  mends: [],
};
/** Level 2's authored round: all wear hats (true, second); not all red (blue and yellow break it); not all have wings (one). */
export const AUTHORED_2: Round = {
  level: 2,
  cards: [
    card('red', true, true, false),
    card('red', true, false, false),
    card('red', true, true, true),
    card('blue', true, true, false),
    card('yellow', true, true, false),
  ],
  claims: [every('red'), every('hat'), every('wings')],
  mends: [],
};
/** Level 3's authored round: hats broken by the bare one (true mend: none have spots), red broken by the blue one (true mend: none are yellow). */
export const AUTHORED_3: Round = {
  level: 3,
  cards: [
    card('red', true, true, false),
    card('blue', true, true, false),
    card('red', false, true, false),
    card('red', true, false, false),
  ],
  claims: [every('hat'), every('red')],
  mends: [
    [none('hat'), none('spots'), every('blue')],
    [every('hat'), none('red'), none('yellow')],
  ],
};

const randomCard = (rng: Rng): Card =>
  card(rng.pick(COLORS), rng.chance(0.5), rng.chance(0.5), rng.chance(0.5));

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
    const ok = rng
      .shuffle(everyClaims())
      .filter((c) => breakers(cards, c).length === 1 && hasDecoy(cards, c));
    const chosen: Claim[] = [];
    for (const c of ok) {
      if (chosen.length === 3) break;
      if (
        chosen.some((k) => dimOf(k.attr) === dimOf(c.attr) || breakers(cards, k)[0] === breakers(cards, c)[0])
      )
        continue;
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
      for (const a of trueAttrs)
        if (COLORS.includes(a as Color)) out.color = a as Color;
        else out[a as Part] = true;
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
  const universals = ATTRS.flatMap((a) => [every(a), none(a)]).filter(
    (c) => isTrue(cards, c) && dimOf(c.attr) !== dimOf(broken.attr),
  );
  if (universals.length === 0) return null;
  const truth = rng.pick(universals);
  const third = rng
    .shuffle(everyClaims())
    .find(
      (c) => !isTrue(cards, c) && dimOf(c.attr) !== dimOf(broken.attr) && dimOf(c.attr) !== dimOf(truth.attr),
    );
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
  if (lv === 4) return level4(rng, authored);
  if (lv === 5) return level5(rng, authored);
  if (lv === 6) return level6(rng, authored);
  if (authored) {
    const a = lv === 1 ? AUTHORED_1 : lv === 2 ? AUTHORED_2 : AUTHORED_3;
    return {
      level: a.level,
      cards: a.cards.map((c) => ({ ...c })),
      claims: a.claims.map((c) => ({ ...c })),
      mends: a.mends.map((m) => m.map((c) => ({ ...c }))),
    };
  }
  return lv === 1 ? level1(rng) : lv === 2 ? level2(rng) : level3(rng);
}

// Levels 4–6 ---------------------------------------------------------------------------------------------------------

const ifc = (filter: Attr, attr: Prop): Claim => ({ q: 'every', attr, if: filter });
/** Level 4's filtered claims, each its own spoken line ("Every red one is round!"). */
export const L4_CLAIMS: readonly Claim[] = [
  ifc('red', 'round'),
  ifc('red', 'square'),
  ifc('blue', 'hat'),
  ifc('blue', 'round'),
  ifc('yellow', 'wings'),
  ifc('yellow', 'square'),
  ifc('spots', 'wings'),
  ifc('wings', 'hat'),
  ifc('hat', 'spots'),
];
/** Level 6's claims: filtered ones about parts and colours, and two plain *none* claims. */
export const L6_CLAIMS: readonly Claim[] = [
  ifc('red', 'hat'),
  ifc('spots', 'wings'),
  ifc('hat', 'wings'),
  ifc('blue', 'spots'),
  ifc('yellow', 'wings'),
  ifc('wings', 'hat'),
  none('spots'),
  none('hat'),
];

const framed = (color: Color, hat: boolean, wings: boolean, spots: boolean, shape: Shape): Card => ({
  ...card(color, hat, wings, spots),
  shape,
});
/** Level 4's authored prompts, the definition's table, in its order (cards are shuffled when dealt). */
export const AUTHORED_4: Prompt[] = [
  {
    claims: [ifc('red', 'round')],
    row: [
      framed('red', false, false, false, 'round'),
      framed('blue', false, false, false, 'square'),
      framed('red', false, false, false, 'square'),
      framed('blue', false, false, false, 'round'),
    ],
  },
  {
    claims: [ifc('blue', 'hat')],
    row: [
      framed('blue', true, false, false, 'round'),
      framed('red', false, false, false, 'square'),
      framed('blue', true, false, true, 'square'),
      framed('yellow', false, false, false, 'round'),
    ],
  },
  {
    claims: [ifc('spots', 'wings')],
    row: [
      framed('red', false, true, true, 'round'),
      framed('blue', false, false, false, 'square'),
      framed('yellow', false, false, true, 'round'),
      framed('red', false, true, false, 'square'),
    ],
  },
];
/** Level 6's authored prompts, the definition's table. */
export const AUTHORED_6: Prompt[] = [
  {
    claims: [ifc('red', 'hat'), ifc('spots', 'wings')],
    row: [
      card('red', true, false, false),
      card('red', true, true, true),
      card('blue', false, true, true),
      card('yellow', false, false, false),
    ],
  },
  {
    claims: [ifc('hat', 'wings'), ifc('blue', 'spots')],
    row: [
      card('blue', true, true, true),
      card('blue', false, false, true),
      card('red', true, false, false),
      card('yellow', false, false, false),
    ],
  },
  {
    claims: [ifc('yellow', 'wings'), none('spots')],
    row: [
      card('yellow', true, true, false),
      card('yellow', false, true, false),
      card('red', true, false, false),
      card('blue', false, true, false),
    ],
  },
];

/** A level 4 prompt is fair: two or more cards in the group, one outside it that lacks the conclusion, and 0 or 1 breaker. */
export function fairFiltered(row: readonly Card[], claim: Claim, wantTrue: boolean): boolean {
  const inGroup = members(row, claim);
  const outsideLacking = row.some((c, i) => !inGroup.includes(i) && !holds(c, claim.attr));
  return inGroup.length >= 2 && outsideLacking && breakers(row, claim).length === (wantTrue ? 0 : 1);
}

function filteredRow(rng: Rng, claim: Claim, wantTrue: boolean): Card[] | null {
  for (let t = 0; t < 4000; t++) {
    const row = distinctRow(rng, 4, () => framed(...randomParts(rng), rng.pick(SHAPES)));
    if (row && fairFiltered(row, claim, wantTrue)) return row;
  }
  return null;
}
const randomParts = (rng: Rng): [Color, boolean, boolean, boolean] => [
  rng.pick(COLORS),
  rng.chance(0.5),
  rng.chance(0.5),
  rng.chance(0.5),
];

const copyPrompt = (p: Prompt): Prompt => ({
  row: p.row.map((c) => ({ ...c })),
  claims: p.claims.map((c) => ({ ...c })),
  ...(p.why ? { why: { ...p.why, says: [...p.why.says], responses: [...p.why.responses] } } : {}),
});
const shuffledRow = (rng: Rng, p: Prompt): Prompt => ({ ...p, row: rng.shuffle(p.row) });
const promptRound = (level: number, prompts: Prompt[], replies?: Reply[]): Round => ({
  level,
  cards: [],
  claims: [],
  mends: [],
  prompts,
  ...(replies ? { replies } : {}),
});

function level4(rng: Rng, authored: boolean): Round {
  if (authored)
    return promptRound(
      4,
      AUTHORED_4.map((p) => shuffledRow(rng, copyPrompt(p))),
    );
  for (let tries = 0; tries < 200; tries++) {
    const claims = rng.shuffle([...L4_CLAIMS]).slice(0, 3);
    const truePos = rng.int(0, 2);
    const rows = claims.map((c, k) => filteredRow(rng, c, k === truePos));
    if (rows.every((r) => r))
      return promptRound(
        4,
        claims.map((c, k) => ({ claims: [c], row: rows[k]! })),
      );
  }
  return promptRound(4, AUTHORED_4.map(copyPrompt));
}

/** A level 6 prompt is fair: each filtered sign talks about at least one card; both true, or exactly one breaker of one sign. */
export function fairPair(row: readonly Card[], claims: readonly Claim[], falseSign: number): boolean {
  if (claims.some((c) => members(row, c).length === 0)) return false;
  return claims.every((c, k) => breakers(row, c).length === (k === falseSign ? 1 : 0));
}

function level6(rng: Rng, authored: boolean): Round {
  const replies = rng.shuffle<Reply>(['kind', 'rude']);
  if (authored)
    return promptRound(
      6,
      AUTHORED_6.map((p) => shuffledRow(rng, copyPrompt(p))),
      replies,
    );
  for (let tries = 0; tries < 400; tries++) {
    const falsePos = rng.int(0, 2);
    const falseSign = rng.int(0, 1);
    const prompts: Prompt[] = [];
    const used: Claim[] = [];
    for (let k = 0; k < 3; k++) {
      let found: Prompt | null = null;
      for (let t = 0; t < 300 && !found; t++) {
        const pair = rng.shuffle(L6_CLAIMS.filter((c) => !used.some((u) => sameClaim(u, c)))).slice(0, 2);
        const want = k === falsePos ? falseSign : -1;
        const row = distinctRow(rng, 4, () => card(...randomParts(rng)));
        if (row && fairPair(row, pair, want)) found = { claims: pair, row };
      }
      if (!found) break;
      used.push(...found.claims);
      prompts.push(found);
    }
    if (prompts.length === 3) return promptRound(6, prompts, replies);
  }
  return promptRound(6, AUTHORED_6.map(copyPrompt), replies);
}

/** Level 5's scenes. Each pictured comparison is a pair of numbers, and the true claim is the one about the bigger. */
export type SceneKind = 'balance' | 'ribbon' | 'trays';
export const SCENES: readonly SceneKind[] = ['balance', 'ribbon', 'trays'];
/** The facts each scene is drawn from: the bucket and cup's weights, the red and blue ribbons' marks, the two trays' shells. */
export const SCENE_FACTS: Record<SceneKind, readonly [number, number]> = {
  balance: [3, 1],
  ribbon: [5, 3],
  trays: [2, 4],
};
export type Response = 'evidence' | 'sure' | 'again';
export interface Why {
  scene: SceneKind;
  facts: readonly [number, number];
  /** Which claim (0 about the first thing, 1 about the second) each speaker makes, left then right. */
  says: [0 | 1, 0 | 1];
  /** The three response cards, left to right. */
  responses: Response[];
  /** Drawn mirrored left to right (the balance and the ribbons); facts and lines are unchanged. */
  mirror: boolean;
}
/** The claim (0 or 1) the facts support: the one about the bigger number. */
export const trueClaim = (w: Why): 0 | 1 => (w.facts[0] > w.facts[1] ? 0 : 1);
/** The speaker (0 left, 1 right) whose claim is true. */
export const rightSpeaker = (w: Why): number => w.says.indexOf(trueClaim(w));
export const evidenceAt = (w: Why): number => w.responses.indexOf('evidence');

function level5(rng: Rng, authored: boolean): Round {
  const order = authored ? [...SCENES] : rng.shuffle([...SCENES]);
  const prompts = order.map((scene): Prompt => {
    const first: 0 | 1 = authored ? 0 : rng.chance(0.5) ? 0 : 1;
    const why: Why = {
      scene,
      facts: SCENE_FACTS[scene],
      says: [first, first === 0 ? 1 : 0],
      responses: authored
        ? ['evidence', 'sure', 'again']
        : rng.shuffle<Response>(['evidence', 'sure', 'again']),
      mirror: !authored && scene !== 'trays' && rng.chance(0.5),
    };
    return { row: [], claims: [], why };
  });
  if (authored) prompts.forEach((p) => rng.shuffle(p.why!.responses));
  return promptRound(5, prompts);
}

/** Level 6's two reply bubbles: the one that continues, and the one that makes the friend pause. Never scored. */
export type Reply = 'kind' | 'rude';

/** What the glow points at: a card, the stamp, a mended sign, a level 5 response or a level 6 reply. */
export type Target =
  | { kind: 'card'; i: number }
  | { kind: 'stamp' }
  | { kind: 'mend'; j: number }
  | { kind: 'why'; j: number }
  | { kind: 'reply'; j: number };

/** The hint target for a claim: its first breaker left to right, or the stamp when it is true. */
export function glowFor(row: readonly Card[], claim: Claim): Target {
  const br = breakers(row, claim);
  return br.length ? { kind: 'card', i: br[0] } : { kind: 'stamp' };
}
/** The hint target for a mend: the true option. */
export const trueMend = (row: readonly Card[], options: readonly Claim[]): number =>
  options.findIndex((c) => isTrue(row, c));

export type MissWhy = 'fits' | 'too' | 'stamp' | 'mend' | 'outside' | 'sure' | 'again';
export type Outcome =
  /** Nothing counted: a tap while nothing is asked, a card tap during the mend, or a reply. */
  | { kind: 'free' }
  /** One miss; `glow` when this miss turned the glow on (one hint counted). For a card or a mend, `card` is the one to point at. */
  | { kind: 'miss'; why: MissWhy; card: number | null; glow: boolean }
  /** A breaker tapped: the claim (at level 6, sign `sign`) is broken. */
  | { kind: 'break'; card: number; sign: number; next: Phase }
  /** The stamp on a true claim, or on two true claims. */
  | { kind: 'every'; next: Phase }
  /** The true mended claim chosen. */
  | { kind: 'mended'; next: Phase }
  /** Level 5: the evidence chosen. */
  | { kind: 'shown'; next: Phase }
  /** Level 6: a reply chosen; `rude` makes the friend pause and the replies stay. */
  | { kind: 'reply'; rude: boolean; next: Phase };

export type Phase = 'claim' | 'mend' | 'reply' | 'done';

/** One round's play and its accounting: one miss per counted wrong answer, one hint per claim or mend at most. */
export class Play {
  /** The claim (levels 1–3) or prompt (levels 4–6) being answered. */
  claim = 0;
  phase: Phase = 'claim';
  misses = 0;
  hints = 0;
  /** Misses on the current claim or mend. */
  stepMisses = 0;
  /** The glow is showing for the current claim or mend (counted once). */
  glowing = false;
  /** Level 6: the reply scene has been played this round (once). */
  replied = false;

  constructor(readonly round: Round) {}

  get prompt(): Prompt | null {
    return this.round.prompts?.[this.claim] ?? null;
  }
  /** The cards on the table now. */
  get row(): Card[] {
    return this.prompt ? this.prompt.row : this.round.cards;
  }
  /** The claim signs up now: one, or two at level 6, none at level 5. */
  get signs(): Claim[] {
    return this.prompt ? this.prompt.claims : [this.round.claims[this.claim]];
  }
  get current(): Claim {
    return this.signs[0];
  }
  get steps(): number {
    return this.round.prompts?.length ?? this.round.claims.length;
  }
  get options(): Claim[] {
    return this.round.mends[this.claim] ?? [];
  }
  get mode(): Mode {
    return planFor(this.round.level).mode;
  }
  /** Every sign up now holds. */
  get allTrue(): boolean {
    return this.signs.every((c) => isTrue(this.row, c));
  }

  /** What the glow and the ghost finger point at now. */
  target(): Target | null {
    if (this.phase === 'done') return null;
    if (this.phase === 'mend') return { kind: 'mend', j: trueMend(this.round.cards, this.options) };
    if (this.phase === 'reply') return { kind: 'reply', j: (this.round.replies ?? ['kind']).indexOf('kind') };
    const why = this.prompt?.why;
    if (why) return { kind: 'why', j: evidenceAt(why) };
    for (const c of this.signs) {
      const br = breakers(this.row, c);
      if (br.length) return { kind: 'card', i: br[0] };
    }
    return { kind: 'stamp' };
  }

  private miss(why: MissWhy, card: number | null): Outcome {
    this.misses++;
    this.stepMisses++;
    let glow = false;
    if (this.stepMisses >= 2 && !this.glowing) {
      this.glowing = true;
      this.hints++;
      glow = true;
    }
    return { kind: 'miss', why, card, glow };
  }

  private advance(reply = false): Phase {
    this.stepMisses = 0;
    this.glowing = false;
    if (this.phase === 'claim' && this.mode === 'mend') return (this.phase = 'mend');
    if (reply && !this.replied) {
      this.replied = true;
      return (this.phase = 'reply');
    }
    this.claim++;
    return (this.phase = this.claim >= this.steps ? 'done' : 'claim');
  }

  tapCard(i: number): Outcome {
    if (this.phase !== 'claim' || this.mode === 'why' || !this.row[i]) return { kind: 'free' };
    const sign = this.signs.findIndex((c) => breakers(this.row, c).includes(i));
    if (sign >= 0) return { kind: 'break', card: i, sign, next: this.advance(this.mode === 'both') };
    // Level 4: a card outside the group the claim is about cannot break it.
    const c = this.current;
    if (this.mode === 'filter' && c.if && !holds(this.row[i], c.if)) return this.miss('outside', i);
    return this.miss(this.allTrue ? 'too' : 'fits', i);
  }

  stamp(): Outcome {
    if (this.phase !== 'claim' || !['stamp', 'filter', 'both'].includes(this.mode)) return { kind: 'free' };
    if (this.allTrue) return { kind: 'every', next: this.advance() };
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

  /** Level 5: a response card chosen. Only the evidence settles it; being sure and saying it again are one miss each. */
  chooseWhy(j: number): Outcome {
    const why = this.prompt?.why;
    if (this.phase !== 'claim' || !why || !why.responses[j]) return { kind: 'free' };
    const r = why.responses[j];
    if (r === 'evidence') return { kind: 'shown', next: this.advance() };
    return this.miss(r, null);
  }

  /** Level 6's reply scene: never scored. The kind reply continues; the rude one leaves the replies up. */
  chooseReply(j: number): Outcome {
    if (this.phase !== 'reply') return { kind: 'free' };
    const r = this.round.replies?.[j];
    if (!r) return { kind: 'free' };
    if (r === 'rude') return { kind: 'reply', rude: true, next: 'reply' };
    this.phase = 'claim';
    return { kind: 'reply', rude: false, next: this.advance() };
  }

  /** Show me: glows the target and counts one hint, once per claim or mend; false when it was already glowing or in the reply scene. */
  requestHint(): boolean {
    if (this.phase === 'done' || this.phase === 'reply' || this.glowing) return false;
    this.glowing = true;
    this.hints++;
    return true;
  }
}

// Layout ------------------------------------------------------------------------------------------------------------

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}
export const CARD_W = 150,
  CARD_H = 180,
  GAP = 16;
export const STAMP = 130;
export const MEND_W = 220,
  MEND_H = 120;
export const SIGN_W = 240,
  SIGN_H = 110;
/** The pet's bottom-left corner, kept clear. */
export const PET_CORNER = 150;
/** The friend on its crate: feet on `friend` (its centre bottom), `FRIEND_H` tall with the crate under the feet. */
export const FRIEND_H = 150,
  CRATE_H = 46;

/** Level 4's sign is wider (group, quantifier and part); level 6's two signs sit side by side. */
export const FILTER_SIGN_W = 320,
  PAIR_SIGN_W = 250;
/** Level 5: the two speakers (portrait and sign, one tap region each), the scene panel and the three response cards. */
export const SPEAKER_W = 250,
  SPEAKER_H = 140,
  SCENE_H = 250,
  RESPONSE_W = 220,
  RESPONSE_H = 150;
/** Level 6's reply bubbles, in the space the cards leave. */
export const REPLY_W = 300,
  REPLY_H = 150;

export interface NotAlwaysLayout {
  /** The first (or only) claim sign; at level 5 the left speaker. */
  sign: Rect;
  /** Every claim sign: one, or level 6's two; at level 5 the two speakers. */
  signs: Rect[];
  /** The friend's tap area, with `foot` the point its feet stand on (top of the crate); null at level 5. */
  friend: Rect | null;
  foot: { x: number; y: number };
  cards: Rect[];
  stamp: Rect | null;
  mends: Rect[];
  /** Level 5: the scene panel (not a target) and the three response cards. */
  scene: Rect | null;
  responses: Rect[];
  /** Level 6: the two reply bubbles, shown over the cards' place. */
  replies: Rect[];
}

/** `n` boxes `w` by `h` in one centred row from `y`. */
const rowOf = (cx: number, y: number, n: number, w: number, h: number): Rect[] => {
  const rowW = n * w + (n - 1) * GAP;
  return Array.from({ length: n }, (_, k) => ({ x: cx - rowW / 2 + k * (w + GAP), y, w, h }));
};

export function notAlwaysLayout(view: { w: number; h: number }, level: number): NotAlwaysLayout {
  const plan = planFor(level);
  const portrait = view.h > view.w;
  const cx = view.w / 2;
  if (plan.mode === 'why') {
    const signs = rowOf(cx, 18, 2, SPEAKER_W, SPEAKER_H);
    const sceneW = Math.min(600, view.w - 40);
    const scene = { x: cx - sceneW / 2, y: 18 + SPEAKER_H + 16, w: sceneW, h: SCENE_H };
    const responses = rowOf(cx, scene.y + SCENE_H + 16, 3, RESPONSE_W, RESPONSE_H);
    return {
      sign: signs[0],
      signs,
      friend: null,
      foot: { x: cx, y: scene.y + SCENE_H },
      cards: [],
      stamp: null,
      mends: [],
      scene,
      responses,
      replies: [],
    };
  }
  const signW = plan.mode === 'filter' ? FILTER_SIGN_W : plan.mode === 'both' ? PAIR_SIGN_W : SIGN_W;
  const signs = rowOf(cx, 18, plan.mode === 'both' ? 2 : 1, signW, SIGN_H);
  const sign = signs[0];
  const foot = { x: cx, y: sign.y + sign.h + 12 + FRIEND_H };
  const friend: Rect = { x: cx - 80, y: foot.y - FRIEND_H, w: 160, h: FRIEND_H + CRATE_H };
  const top = foot.y + CRATE_H + 20;
  const perRow = plan.cards === 5 && (portrait || view.w < 850) ? [3, 2] : [plan.cards];
  const cards: Rect[] = [];
  perRow.forEach((n, r) => {
    const rowW = n * CARD_W + (n - 1) * GAP;
    for (let k = 0; k < n; k++)
      cards.push({
        x: cx - rowW / 2 + k * (CARD_W + GAP),
        y: top + r * (CARD_H + GAP),
        w: CARD_W,
        h: CARD_H,
      });
  });
  const below = top + perRow.length * (CARD_H + GAP) + 4;
  const stamped = plan.mode === 'stamp' || plan.mode === 'filter' || plan.mode === 'both';
  const stamp = stamped ? { x: cx - STAMP / 2, y: below, w: STAMP, h: STAMP } : null;
  const mends = plan.mode === 'mend' ? rowOf(cx, below, 3, MEND_W, MEND_H) : [];
  const replies = plan.mode === 'both' ? rowOf(cx, top + (CARD_H - REPLY_H) / 2, 2, REPLY_W, REPLY_H) : [];
  return { sign, signs, friend, foot, cards, stamp, mends, scene: null, responses: [], replies };
}
