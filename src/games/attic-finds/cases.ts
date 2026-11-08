import type { LineId } from '../../content/voice-script';
import type { Rng } from '../../engine/random';
import type { View } from '../../engine/view';
import { petCorner, shellButtons, type Plan, type Pt, type Rect } from './logic';

/*
 * Attic Finds levels 7-8: the household casebook. The museum wants to borrow the bird box, and three papers come out of
 * the attic trunk. Level 7 drags the paper that shows each claim into its slot; level 8 stamps each claim "the papers
 * show it" or "can't tell". What a paper shows is a constraint on a tiny world of facts, and a claim's status is worked
 * out by enumerating every world the papers allow, so "no paper from Seaside House" can never prove Seaside had none.
 * Everything is invented island make-believe: no real object, place, people or date.
 */

/* The model ------------------------------------------------------------------------------------- */

export const ATOMS = [
  'has.hilltop',
  'has.seaside',
  'crank.hilltop',
  'crank.seaside',
  'crank.fair',
  'sold',
  'advert',
  'loved.all',
  'loved.hilltop',
] as const;
export type Atom = (typeof ATOMS)[number];
/** A world: one bit per atom, in `ATOMS` order. */
export type World = number;
export type Formula = { atom: Atom } | { not: Formula } | { and: readonly Formula[] };

const bit = (a: Atom) => 1 << ATOMS.indexOf(a);
export const atom = (a: Atom): Formula => ({ atom: a });
const not = (f: Formula): Formula => ({ not: f });
const and = (...fs: Formula[]): Formula => ({ and: fs });

export function holds(f: Formula, w: World): boolean {
  if ('atom' in f) return (w & bit(f.atom)) !== 0;
  if ('not' in f) return !holds(f.not, w);
  return f.and.every((g) => holds(g, w));
}

/** Cranking a house's bird box means the house had one; every child loving them includes Hilltop's children. */
const CONSTRAINTS: readonly Formula[] = [
  not(and(atom('crank.hilltop'), not(atom('has.hilltop')))),
  not(and(atom('crank.seaside'), not(atom('has.seaside')))),
  not(and(atom('loved.all'), not(atom('loved.hilltop')))),
];

let allWorlds: World[] | null = null;
/** Every assignment of the nine atoms that meets the constraints. */
export function worlds(): readonly World[] {
  if (!allWorlds) {
    allWorlds = [];
    for (let w = 0; w < 1 << ATOMS.length; w++) if (CONSTRAINTS.every((c) => holds(c, w))) allWorlds.push(w);
  }
  return allWorlds;
}

export type PaperId = 'list' | 'drawing' | 'poster';
export const PAPER_IDS: readonly PaperId[] = ['list', 'drawing', 'poster'];

export interface Paper {
  id: PaperId;
  shows: Formula;
  line: LineId;
  look: LineId;
}
/** What each paper shows. The poster's "every child will love one" is the shop's advert, never `loved.all`. */
export const PAPERS: Record<PaperId, Paper> = {
  list: {
    id: 'list',
    shows: atom('has.hilltop'),
    line: 'attic-finds.paper-list',
    look: 'attic-finds.look-list',
  },
  drawing: {
    id: 'drawing',
    shows: atom('crank.fair'),
    line: 'attic-finds.paper-drawing',
    look: 'attic-finds.look-drawing',
  },
  poster: {
    id: 'poster',
    shows: and(atom('sold'), atom('advert')),
    line: 'attic-finds.paper-poster',
    look: 'attic-finds.look-poster',
  },
};

export type Status = 'shown' | 'ruled-out' | 'unknown';

/** Whether the papers make a claim true in every world they allow, false in every one, or leave it open. */
export const status = (f: Formula, papers: readonly PaperId[]): Status =>
  statusUnder(
    f,
    papers.map((p) => PAPERS[p].shows),
  );

/** The same, under any set of shown facts (level 9 adds what a new paper might read). */
export function statusUnder(f: Formula, shown: readonly Formula[]): Status {
  let yes = false,
    no = false;
  for (const w of worlds()) {
    if (!shown.every((c) => holds(c, w))) continue;
    if (holds(f, w)) yes = true;
    else no = true;
    if (yes && no) return 'unknown';
  }
  return yes ? 'shown' : 'ruled-out';
}

export type CaseClaimId =
  | 'hilltop-had'
  | 'fair-cranked'
  | 'shop-sold'
  | 'hilltop-cranked'
  | 'seaside-had'
  | 'seaside-none'
  | 'all-loved';
export const CASE_CLAIMS: readonly CaseClaimId[] = [
  'hilltop-had',
  'fair-cranked',
  'shop-sold',
  'hilltop-cranked',
  'seaside-had',
  'seaside-none',
  'all-loved',
];
export const SHOWN_CLAIMS: readonly CaseClaimId[] = ['hilltop-had', 'fair-cranked', 'shop-sold'];

export interface CaseClaim {
  id: CaseClaimId;
  formula: Formula;
  line: LineId;
}
export const CLAIM_TABLE: Record<CaseClaimId, CaseClaim> = {
  'hilltop-had': { id: 'hilltop-had', formula: atom('has.hilltop'), line: 'attic-finds.claim-hilltop-had' },
  'fair-cranked': { id: 'fair-cranked', formula: atom('crank.fair'), line: 'attic-finds.claim-fair-cranked' },
  'shop-sold': { id: 'shop-sold', formula: atom('sold'), line: 'attic-finds.claim-shop-sold' },
  'hilltop-cranked': {
    id: 'hilltop-cranked',
    formula: atom('crank.hilltop'),
    line: 'attic-finds.claim-hilltop-cranked',
  },
  'seaside-had': { id: 'seaside-had', formula: atom('has.seaside'), line: 'attic-finds.claim-seaside-had' },
  'seaside-none': {
    id: 'seaside-none',
    formula: not(atom('has.seaside')),
    line: 'attic-finds.claim-seaside-none',
  },
  'all-loved': { id: 'all-loved', formula: atom('loved.all'), line: 'attic-finds.claim-all-loved' },
};

/** A single paper shows a claim when it alone makes the claim true in every world it allows. */
export const paperSupports = (paper: PaperId, claim: CaseClaimId): boolean =>
  status(CLAIM_TABLE[claim].formula, [paper]) === 'shown';
/** The claim's status with all three of the case's papers. */
export const claimStatus = (claim: CaseClaimId): Status => status(CLAIM_TABLE[claim].formula, PAPER_IDS);
/** The paper that shows a shown claim (each has exactly one). */
export const supportingPaper = (claim: CaseClaimId): PaperId | null =>
  PAPER_IDS.find((p) => paperSupports(p, claim)) ?? null;

/** Why a paper does not show a claim (level 7), one line per authored pairing. */
const PAIR_REASONS: Partial<Record<`${PaperId}:${CaseClaimId}`, LineId>> = {
  'list:fair-cranked': 'attic-finds.why-list-crank',
  'list:shop-sold': 'attic-finds.why-list-shop',
  'drawing:hilltop-had': 'attic-finds.why-drawing-hilltop',
  'drawing:shop-sold': 'attic-finds.why-drawing-shop',
  'poster:hilltop-had': 'attic-finds.why-poster-house',
  'poster:fair-cranked': 'attic-finds.why-poster-crank',
};
/** Why "the papers show it" is wrong on a claim no paper shows (level 8). */
const OPEN_REASONS: Partial<Record<CaseClaimId, LineId>> = {
  'hilltop-cranked': 'attic-finds.why-hilltop-crank',
  'seaside-had': 'attic-finds.why-seaside',
  'seaside-none': 'attic-finds.why-seaside',
  'all-loved': 'attic-finds.why-all-loved',
};

export const pairReason = (paper: PaperId, claim: CaseClaimId): LineId | null =>
  PAIR_REASONS[`${paper}:${claim}`] ?? null;

/** The reason for a wrong stamp: an open claim's limit, or the paper that does show a shown claim. */
export function stampReason(claim: CaseClaimId): LineId {
  const p = supportingPaper(claim);
  return p ? PAPERS[p].look : OPEN_REASONS[claim]!;
}

/* Levels and rounds ----------------------------------------------------------------------------- */

export const isCase = (plan: Plan): boolean =>
  plan.mode === 'sources' || plan.mode === 'tell' || plan.mode === 'mend';
/** Level 9 has its own scene (the exhibit card); levels 7-8 share the casebook board. */
export const isExhibit = (plan: Plan): boolean => plan.mode === 'mend';

export interface CaseBoard {
  claims: CaseClaimId[];
  papers: PaperId[];
}
export interface CaseRound {
  boards: CaseBoard[];
}

const others = <T>(all: readonly T[], left: readonly T[]) => all.filter((x) => !left.includes(x));

/** The definition's first rounds, shown once per level per session. */
function authoredCase(plan: Plan, rng: Rng): CaseRound {
  if (plan.mode === 'sources') {
    return {
      boards: [
        { claims: ['hilltop-had', 'fair-cranked'], papers: ['list', 'poster', 'drawing'] },
        {
          claims: rng.shuffle<CaseClaimId>([
            'shop-sold',
            rng.pick<CaseClaimId>(['hilltop-had', 'fair-cranked']),
          ]),
          papers: rng.shuffle([...PAPER_IDS]),
        },
      ],
    };
  }
  return {
    boards: [
      { claims: ['hilltop-had', 'seaside-none', 'all-loved'], papers: ['list', 'drawing', 'poster'] },
      {
        claims: rng.shuffle<CaseClaimId>([
          'seaside-had',
          rng.pick(others(SHOWN_CLAIMS, ['hilltop-had'])),
          'hilltop-cranked',
        ]),
        papers: rng.shuffle([...PAPER_IDS]),
      },
    ],
  };
}

export function makeCaseRound(plan: Plan, rng: Rng, first = false): CaseRound {
  if (first) return authoredCase(plan, rng);
  if (plan.mode === 'sources') {
    // Board 1 takes two of the three shown claims; board 2 the one left out and one of the others.
    const shown = rng.shuffle([...SHOWN_CLAIMS]);
    const one = shown.slice(0, 2),
      two = [shown[2], rng.pick(one)];
    return {
      boards: [one, two].map((claims) => ({
        claims: rng.shuffle(claims),
        papers: rng.shuffle([...PAPER_IDS]),
      })),
    };
  }
  // Each board: one Seaside claim, one shown claim and one other trap, so stamping everything "can't tell" always fails.
  const seaside = rng.shuffle<CaseClaimId>(['seaside-had', 'seaside-none']);
  const traps = rng.shuffle<CaseClaimId>(['hilltop-cranked', 'all-loved']);
  const shown = rng.shuffle([...SHOWN_CLAIMS]);
  return {
    boards: [0, 1].map((i) => ({
      claims: rng.shuffle([seaside[i], shown[i], traps[i]]),
      papers: rng.shuffle([...PAPER_IDS]),
    })),
  };
}

/* One board's rules ----------------------------------------------------------------------------- */

export type Stamp = 'shown' | 'unknown';

/** One board: level 7's slots or level 8's stamps, and its own misses and help (help counts at most once per board). */
export interface CaseState {
  mode: 'sources' | 'tell';
  claims: readonly CaseClaimId[];
  papers: readonly PaperId[];
  slots: (PaperId | null)[];
  stamps: (Stamp | null)[];
  read: Set<PaperId>;
  wrong: number;
  misses: number;
  hints: number;
  glow: boolean;
  done: boolean;
}

export function caseState(mode: 'sources' | 'tell', board: CaseBoard): CaseState {
  const n = board.claims.length;
  return {
    mode,
    claims: board.claims,
    papers: board.papers,
    slots: Array(n).fill(null),
    stamps: Array(n).fill(null),
    read: new Set(),
    wrong: 0,
    misses: 0,
    hints: 0,
    glow: false,
    done: false,
  };
}

/** Reading a paper: free, any time. */
export const readPaper = (s: CaseState, p: PaperId) => {
  s.read.add(p);
};

/** Put a copy of a paper in a slot, or clear it with null. Free. */
export function placePaper(s: CaseState, slot: number, paper: PaperId | null): boolean {
  if (s.done || s.mode !== 'sources' || slot < 0 || slot >= s.slots.length) return false;
  s.slots[slot] = paper;
  return true;
}

/** Press a stamp on a claim, swap it, or lift it with null. Free. */
export function stampClaim(s: CaseState, row: number, stamp: Stamp | null): boolean {
  if (s.done || s.mode !== 'tell' || row < 0 || row >= s.stamps.length) return false;
  s.stamps[row] = stamp;
  return true;
}

/** The right answer for a row: the supporting paper at level 7, the claim's status at level 8. */
export function answerFor(s: CaseState, row: number): PaperId | Stamp {
  const c = s.claims[row];
  if (s.mode === 'sources') return supportingPaper(c)!;
  return claimStatus(c) === 'shown' ? 'shown' : 'unknown';
}

const filled = (s: CaseState, row: number) => (s.mode === 'sources' ? s.slots[row] : s.stamps[row]) !== null;
const rowRight = (s: CaseState, row: number) =>
  (s.mode === 'sources' ? s.slots[row] : s.stamps[row]) === answerFor(s, row);

/** Help: the first wrong or empty place glows with its answer. Counts once per board, whether from two misses or asked for. */
export function helpCase(s: CaseState): boolean {
  if (s.done) return false;
  s.glow = true;
  if (s.hints > 0) return false;
  s.hints = 1;
  return true;
}

/** What glows once help is shown: the first row not yet right, and its answer. */
export function glowFor(s: CaseState): { row: number; answer: PaperId | Stamp } | null {
  if (!s.glow || s.done) return null;
  const row = s.claims.findIndex((_, i) => !rowRight(s, i));
  return row < 0 ? null : { row, answer: answerFor(s, row) };
}

export interface CaseWrong {
  row: number;
  reason: LineId;
}
export type CaseCheck =
  { result: 'empty'; empty: number[] } | { result: 'miss'; wrong: CaseWrong[] } | { result: 'done' };

/** Check: an empty place is never counted; anything wrong is one miss, whatever the number, and only the wrong parts return. */
export function checkCase(s: CaseState): CaseCheck {
  if (s.done) return { result: 'done' };
  const empty = s.claims.map((_, i) => i).filter((i) => !filled(s, i));
  if (empty.length) return { result: 'empty', empty };
  const wrong: CaseWrong[] = [];
  s.claims.forEach((c, i) => {
    if (rowRight(s, i)) return;
    wrong.push({ row: i, reason: s.mode === 'sources' ? pairReason(s.slots[i]!, c)! : stampReason(c) });
    if (s.mode === 'sources') s.slots[i] = null;
    else s.stamps[i] = null;
  });
  if (!wrong.length) {
    s.done = true;
    return { result: 'done' };
  }
  s.misses++;
  s.wrong++;
  if (s.wrong >= 2) helpCase(s);
  return { result: 'miss', wrong };
}

/* Layout ---------------------------------------------------------------------------------------- */

export const PAPER_W = 200;
export const PAPER_H = 150;
export const PAPER_GAP = 30;
export const CASE_CARD_W = 380;
export const CASE_CARD_H = 120;
export const ROW_GAP = 10;
export const CASE_SLOT = 120;
export const STAMP_R = 55;
export const CASE_CHECK_R = 52;

export interface CaseLayout {
  /** Centres of the papers on the table, in table order. */
  papers: Pt[];
  /** Centres of the claim cards. */
  cards: Pt[];
  /** Level 7: each card's slot centre. */
  slots: Pt[];
  /** Level 8: each card's two stamps, "shows it" then "can't tell". */
  stamps: [Pt, Pt][];
  check: Pt;
  /** Where finished boards sit on the shelf. */
  shelf: Pt[];
}

/** Every rectangle of the casebook screen, or null rather than shrink a target. */
export function caseLayout(v: View, level: number): CaseLayout | null {
  const L = placeCase(v, level);
  return caseTargets(L).every(
    ({ r }) =>
      r.x >= 0 &&
      r.y >= 0 &&
      r.x + r.w <= v.w &&
      r.y + r.h <= v.h &&
      !overlaps(r, petCorner(v)) &&
      !shellButtons(v).some((b) => overlaps(r, b)),
  )
    ? L
    : null;
}

/** The casebook's positions, unchecked (the scene uses them; `caseLayout` is what the tests hold to the rules). */
export function placeCase(v: View, level: number): CaseLayout {
  const rows = level === 7 ? 2 : 3;
  const portrait = v.h > v.w;
  // Upright, the block sits a little above the middle of the tall screen.
  const top = portrait
    ? Math.max(220, (v.h - (PAPER_H + ROW_GAP + rows * (CASE_CARD_H + ROW_GAP))) / 2 - 80)
    : 160;
  const rowW = CASE_CARD_W + 20 + (level === 7 ? CASE_SLOT : 4 * STAMP_R + 10);
  const x0 = Math.max(210, (v.w - rowW) / 2);
  const papersW = 3 * PAPER_W + 2 * PAPER_GAP;
  const papers = [0, 1, 2].map((i) => ({
    x: (v.w - papersW) / 2 + PAPER_W / 2 + i * (PAPER_W + PAPER_GAP),
    y: top + PAPER_H / 2,
  }));
  const rowsTop = top + PAPER_H + ROW_GAP;
  const cards = Array.from({ length: rows }, (_, i) => ({
    x: x0 + CASE_CARD_W / 2,
    y: rowsTop + CASE_CARD_H / 2 + i * (CASE_CARD_H + ROW_GAP),
  }));
  const right = x0 + CASE_CARD_W + 20;
  const slots = level === 7 ? cards.map((c) => ({ x: right + CASE_SLOT / 2, y: c.y })) : [];
  const stamps: [Pt, Pt][] =
    level === 7
      ? []
      : cards.map((c) => [
          { x: right + STAMP_R, y: c.y },
          { x: right + 3 * STAMP_R + 10, y: c.y },
        ]);
  const check = { x: v.w - 24 - CASE_CHECK_R, y: v.h - 24 - CASE_CHECK_R };
  const shelf = [-80, 80].map((dx) => ({ x: v.w / 2 + dx, y: top - 60 }));
  return { papers, cards, slots, stamps, check, shelf };
}

const overlaps = (a: Rect, b: Rect) =>
  a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
const boxAt = (p: Pt, w: number, h = w): Rect => ({ x: p.x - w / 2, y: p.y - h / 2, w, h });

/** Every tappable or droppable rectangle, labelled (for the layout check and its tests). */
export function caseTargets(L: CaseLayout): { label: string; r: Rect }[] {
  return [
    ...L.papers.map((p, i) => ({ label: `paper${i}`, r: boxAt(p, PAPER_W, PAPER_H) })),
    ...L.cards.map((p, i) => ({ label: `card${i}`, r: boxAt(p, CASE_CARD_W, CASE_CARD_H) })),
    ...L.slots.map((p, i) => ({ label: `slot${i}`, r: boxAt(p, CASE_SLOT) })),
    ...L.stamps.flatMap(([a, b], i) => [
      { label: `shows${i}`, r: boxAt(a, 2 * STAMP_R) },
      { label: `cant${i}`, r: boxAt(b, 2 * STAMP_R) },
    ]),
    { label: 'check', r: boxAt(L.check, 2 * CASE_CHECK_R) },
  ];
}

/* Level 9: mend the exhibit --------------------------------------------------------------------- */

/*
 * The museum's card for the bird box has three captions that say too much. She swaps each for one the papers show, then
 * picks the new paper that could answer a question the papers leave open. A new paper is judged by every way it could
 * read: a storeroom list that lists other things, or a drawing of something else, adds nothing (a list of one storeroom
 * is not the whole house), so it is useful only if some reading would settle the question.
 */

const NOTHING: Formula = { and: [] };

export type CaptionRow = 'love' | 'cranking' | 'homes';
export const CAPTION_ROWS: readonly CaptionRow[] = ['love', 'cranking', 'homes'];
export type CaptionId =
  | 'all-loved'
  | 'shop-said'
  | 'hilltop-loved'
  | 'crank-every-home'
  | 'fair-cranked'
  | 'hilltop-cranked'
  | 'every-house'
  | 'hilltop-had'
  | 'seaside-had';

export interface Caption {
  id: CaptionId;
  row: CaptionRow;
  formula: Formula;
  line: LineId;
}
export const CAPTIONS: Record<CaptionId, Caption> = {
  'all-loved': {
    id: 'all-loved',
    row: 'love',
    formula: atom('loved.all'),
    line: 'attic-finds.claim-all-loved',
  },
  'shop-said': {
    id: 'shop-said',
    row: 'love',
    formula: atom('advert'),
    line: 'attic-finds.caption-shop-said',
  },
  'hilltop-loved': {
    id: 'hilltop-loved',
    row: 'love',
    formula: atom('loved.hilltop'),
    line: 'attic-finds.caption-hilltop-loved',
  },
  'crank-every-home': {
    id: 'crank-every-home',
    row: 'cranking',
    formula: and(atom('crank.hilltop'), atom('crank.seaside')),
    line: 'attic-finds.caption-crank-every-home',
  },
  'fair-cranked': {
    id: 'fair-cranked',
    row: 'cranking',
    formula: atom('crank.fair'),
    line: 'attic-finds.claim-fair-cranked',
  },
  'hilltop-cranked': {
    id: 'hilltop-cranked',
    row: 'cranking',
    formula: atom('crank.hilltop'),
    line: 'attic-finds.claim-hilltop-cranked',
  },
  'every-house': {
    id: 'every-house',
    row: 'homes',
    formula: and(atom('has.hilltop'), atom('has.seaside')),
    line: 'attic-finds.caption-every-house',
  },
  'hilltop-had': {
    id: 'hilltop-had',
    row: 'homes',
    formula: atom('has.hilltop'),
    line: 'attic-finds.claim-hilltop-had',
  },
  'seaside-had': {
    id: 'seaside-had',
    row: 'homes',
    formula: atom('has.seaside'),
    line: 'attic-finds.claim-seaside-had',
  },
};

/** Each row starts on its overclaim; one other caption is what a paper shows, and one is narrower but still not shown. */
export const ROW_CAPTIONS: Record<
  CaptionRow,
  { start: CaptionId; supported: CaptionId; unsupported: CaptionId }
> = {
  love: { start: 'all-loved', supported: 'shop-said', unsupported: 'hilltop-loved' },
  cranking: { start: 'crank-every-home', supported: 'fair-cranked', unsupported: 'hilltop-cranked' },
  homes: { start: 'every-house', supported: 'hilltop-had', unsupported: 'seaside-had' },
};

/** Why a caption the papers do not show is wrong, by row: the claims' own reasons. */
const ROW_REASONS: Record<CaptionRow, LineId> = {
  love: 'attic-finds.why-all-loved',
  cranking: 'attic-finds.why-hilltop-crank',
  homes: 'attic-finds.why-seaside',
};

export const captionStatus = (c: CaptionId): Status => status(CAPTIONS[c].formula, PAPER_IDS);
/** The case paper that shows a supported caption (the one to light at a Check). */
export const captionPaper = (c: CaptionId): PaperId | null =>
  PAPER_IDS.find((p) => status(CAPTIONS[c].formula, [p]) === 'shown') ?? null;

export type QuestionId = 'seaside' | 'hilltop-crank';
export const QUESTION_IDS: readonly QuestionId[] = ['seaside', 'hilltop-crank'];
export const QUESTIONS: Record<QuestionId, { formula: Formula; line: LineId }> = {
  seaside: { formula: atom('has.seaside'), line: 'attic-finds.question-seaside' },
  'hilltop-crank': { formula: atom('crank.hilltop'), line: 'attic-finds.question-hilltop-crank' },
};

export type NewPaperId = 'seaside-list' | 'hilltop-drawing' | 'poster-copy' | 'fair-copy';
export const NEW_PAPER_IDS: readonly NewPaperId[] = [
  'seaside-list',
  'hilltop-drawing',
  'poster-copy',
  'fair-copy',
];
/** Every way a new paper could read. "Lists other things" or "shows something else" adds no fact at all. */
export const NEW_PAPERS: Record<NewPaperId, { readings: readonly Formula[]; line: LineId }> = {
  'seaside-list': { readings: [atom('has.seaside'), NOTHING], line: 'attic-finds.new-seaside-list' },
  'hilltop-drawing': { readings: [atom('crank.hilltop'), NOTHING], line: 'attic-finds.new-hilltop-drawing' },
  'poster-copy': { readings: [PAPERS.poster.shows], line: 'attic-finds.new-poster-copy' },
  'fair-copy': { readings: [PAPERS.drawing.shows], line: 'attic-finds.new-fair-copy' },
};

/** A new paper could answer a question when some way it might read, added to the case's papers, settles it. */
export function useful(paper: NewPaperId, q: QuestionId): boolean {
  const known = PAPER_IDS.map((p) => PAPERS[p].shows);
  return NEW_PAPERS[paper].readings.some(
    (r) => statusUnder(QUESTIONS[q].formula, [...known, r]) !== 'unknown',
  );
}

const HOUSE_PAPER: Record<QuestionId, NewPaperId> = {
  seaside: 'seaside-list',
  'hilltop-crank': 'hilltop-drawing',
};
const COPIES: readonly NewPaperId[] = ['poster-copy', 'fair-copy'];

/** Why a new paper cannot answer: the other house's paper is from the wrong place; a copy only repeats what we know. */
export const newPaperReason = (p: NewPaperId): LineId =>
  COPIES.includes(p) ? 'attic-finds.why-copy' : 'attic-finds.why-wrong-place';

export interface ExhibitRound {
  /** The caption rows, top to bottom. */
  rows: CaptionRow[];
  /** Each row's strip: its three captions in the order they are shown. */
  strips: Record<CaptionRow, CaptionId[]>;
  question: QuestionId;
  /** The three new papers offered: the useful one, the other house's and one copy. */
  offered: NewPaperId[];
  /** The case's papers on the table, in order. */
  papers: PaperId[];
}

const stripOf = (row: CaptionRow): CaptionId[] => [
  ROW_CAPTIONS[row].start,
  ROW_CAPTIONS[row].supported,
  ROW_CAPTIONS[row].unsupported,
];

export function makeExhibitRound(rng: Rng, first = false): ExhibitRound {
  const question: QuestionId = first ? 'seaside' : rng.pick(QUESTION_IDS);
  const other = HOUSE_PAPER[question === 'seaside' ? 'hilltop-crank' : 'seaside'];
  const offered = rng.shuffle([HOUSE_PAPER[question], other, rng.pick(COPIES)]);
  if (first) {
    return {
      rows: [...CAPTION_ROWS],
      strips: { love: stripOf('love'), cranking: stripOf('cranking'), homes: stripOf('homes') },
      question,
      offered,
      papers: [...PAPER_IDS],
    };
  }
  const rows = rng.shuffle([...CAPTION_ROWS]);
  const strips = {
    love: rng.shuffle(stripOf('love')),
    cranking: rng.shuffle(stripOf('cranking')),
    homes: rng.shuffle(stripOf('homes')),
  };
  return { rows, strips, question, offered, papers: rng.shuffle([...PAPER_IDS]) };
}

export interface ExhibitState {
  round: ExhibitRound;
  /** The caption on each row, in row order (each starts on its overclaim). */
  captions: CaptionId[];
  /** The new paper in the question slot. */
  chosen: NewPaperId | null;
  read: Set<PaperId | NewPaperId>;
  wrong: number;
  misses: number;
  hints: number;
  glow: boolean;
  done: boolean;
}

export const exhibitState = (round: ExhibitRound): ExhibitState => ({
  round,
  captions: round.rows.map((r) => ROW_CAPTIONS[r].start),
  chosen: null,
  read: new Set(),
  wrong: 0,
  misses: 0,
  hints: 0,
  glow: false,
  done: false,
});

/** Set a row's caption from its strip. Free. */
export function setCaption(s: ExhibitState, row: number, caption: CaptionId): boolean {
  if (s.done || row < 0 || row >= s.captions.length || CAPTIONS[caption].row !== s.round.rows[row])
    return false;
  s.captions[row] = caption;
  return true;
}

/** Put a new paper in the question slot (or clear it). Free. */
export function chooseNewPaper(s: ExhibitState, paper: NewPaperId | null): boolean {
  if (s.done || (paper && !s.round.offered.includes(paper))) return false;
  s.chosen = paper;
  return true;
}

/** The useful paper among those offered (exactly one). */
export const usefulPaper = (r: ExhibitRound): NewPaperId => r.offered.find((p) => useful(p, r.question))!;

export type ExhibitGlow =
  { kind: 'caption'; row: number; answer: CaptionId } | { kind: 'paper'; answer: NewPaperId };

/** What glows once help is shown: the first caption the papers do not show and its right one, else the useful paper. */
export function exhibitGlow(s: ExhibitState): ExhibitGlow | null {
  if (!s.glow || s.done) return null;
  const row = s.captions.findIndex((c) => captionStatus(c) !== 'shown');
  if (row >= 0) return { kind: 'caption', row, answer: ROW_CAPTIONS[s.round.rows[row]].supported };
  return s.chosen && useful(s.chosen, s.round.question)
    ? null
    : { kind: 'paper', answer: usefulPaper(s.round) };
}

/** Help counts once for the exhibit, whether from two misses or asked for. */
export function helpExhibit(s: ExhibitState): boolean {
  if (s.done) return false;
  s.glow = true;
  if (s.hints > 0) return false;
  s.hints = 1;
  return true;
}

export type ExhibitCheck =
  | { result: 'empty' }
  | { result: 'miss'; rows: { row: number; reason: LineId }[]; paper: LineId | null }
  | { result: 'done' };

/**
 * Check: with no paper in the question slot nothing is counted. Otherwise anything wrong is one miss; a wrong caption stays
 * where she put it (its strip opens again) and a paper that could not answer hops back.
 */
export function checkExhibit(s: ExhibitState): ExhibitCheck {
  if (s.done) return { result: 'done' };
  if (!s.chosen) return { result: 'empty' };
  const rows = s.captions.flatMap((c, row) =>
    captionStatus(c) === 'shown' ? [] : [{ row, reason: ROW_REASONS[s.round.rows[row]] }],
  );
  const paper = useful(s.chosen, s.round.question) ? null : newPaperReason(s.chosen);
  if (!rows.length && !paper) {
    s.done = true;
    return { result: 'done' };
  }
  if (paper) s.chosen = null;
  s.misses++;
  s.wrong++;
  if (s.wrong >= 2) helpExhibit(s);
  return { result: 'miss', rows, paper };
}

/* Level 9 layout -------------------------------------------------------------------------------- */

export const THUMB = 120;
export const STRIP = 120;
export const QUESTION_W = 260;
export const QUESTION_H = 120;
export const NEW_W = 110;
export const NEW_H = 120;

export interface ExhibitLayout {
  /** The case's papers as thumbnails. */
  papers: Pt[];
  /** The caption rows on the museum card. */
  rows: Pt[];
  /** The open strip's three cards (one fixed column beside the rows, whichever row is open). */
  strip: Pt[];
  dome: Pt;
  question: Pt;
  slot: Pt;
  offered: Pt[];
  check: Pt;
}

/** The exhibit's positions, unchecked (`exhibitLayout` is what the tests hold to the rules). */
export function placeExhibit(v: View): ExhibitLayout {
  const gap = ROW_GAP + CASE_CARD_H;
  const check = { x: v.w - 24 - CASE_CHECK_R, y: v.h - 24 - CASE_CHECK_R };
  if (v.h > v.w) {
    // The block is 810 units tall; on a tall screen it sits a little above the middle.
    const top = Math.max(140, (v.h - 810) / 2 - 40);
    const papers = [-1, 0, 1].map((k) => ({ x: v.w / 2 + k * (THUMB + 20), y: top + THUMB / 2 }));
    const rowY = (i: number) => top + THUMB + 20 + CASE_CARD_H / 2 + i * gap;
    const rows = [0, 1, 2].map((i) => ({ x: 30 + CASE_CARD_W / 2, y: rowY(i) }));
    const strip = [0, 1, 2].map((i) => ({ x: 440 + STRIP / 2, y: rowY(i) }));
    const qy = rowY(2) + CASE_CARD_H / 2 + 30 + QUESTION_H / 2;
    const ny = qy + QUESTION_H / 2 + 20 + NEW_H / 2;
    return {
      papers,
      rows,
      strip,
      dome: { x: 660, y: rowY(1) },
      question: { x: 30 + QUESTION_W / 2, y: qy },
      slot: { x: 30 + QUESTION_W + 10 + CASE_SLOT / 2, y: qy },
      offered: [0, 1, 2].map((k) => ({ x: 220 + NEW_W / 2 + k * (NEW_W + 10), y: ny })),
      check,
    };
  }
  // Landscape: the 1024-unit design area, centred on a wider screen.
  const ox = Math.max(0, (v.w - 1024) / 2);
  const rowY = (i: number) => 140 + CASE_CARD_H / 2 + i * gap;
  const qy = v.h - 8 - QUESTION_H / 2;
  const nx0 = ox + 220 + QUESTION_W + 10 + CASE_SLOT + 20;
  return {
    papers: [0, 1, 2].map((i) => ({ x: ox + 870 + THUMB / 2, y: rowY(i) })),
    rows: [0, 1, 2].map((i) => ({ x: ox + 210 + CASE_CARD_W / 2, y: rowY(i) })),
    strip: [0, 1, 2].map((i) => ({ x: ox + 610 + STRIP / 2, y: rowY(i) })),
    dome: { x: ox + 800, y: rowY(1) },
    question: { x: ox + 220 + QUESTION_W / 2, y: qy },
    slot: { x: ox + 220 + QUESTION_W + 10 + CASE_SLOT / 2, y: qy },
    offered: [0, 1, 2].map((k) => ({ x: nx0 + NEW_W / 2 + k * (NEW_W + 10), y: qy })),
    check: { x: ox + 870 + THUMB / 2, y: rowY(2) + CASE_CARD_H / 2 + 10 + CASE_CHECK_R },
  };
}

/** Every tappable rectangle of the exhibit, labelled, with the strip open. */
export function exhibitTargets(L: ExhibitLayout): { label: string; r: Rect }[] {
  return [
    ...L.papers.map((p, i) => ({ label: `paper${i}`, r: boxAt(p, THUMB) })),
    ...L.rows.map((p, i) => ({ label: `row${i}`, r: boxAt(p, CASE_CARD_W, CASE_CARD_H) })),
    ...L.strip.map((p, i) => ({ label: `strip${i}`, r: boxAt(p, STRIP) })),
    { label: 'question', r: boxAt(L.question, QUESTION_W, QUESTION_H) },
    { label: 'slot', r: boxAt(L.slot, CASE_SLOT) },
    ...L.offered.map((p, i) => ({ label: `new${i}`, r: boxAt(p, NEW_W, NEW_H) })),
    { label: 'check', r: boxAt(L.check, 2 * CASE_CHECK_R) },
  ];
}

/** The exhibit's layout, or null rather than shrink a target. */
export function exhibitLayout(v: View): ExhibitLayout | null {
  const L = placeExhibit(v);
  return exhibitTargets(L).every(
    ({ r }) =>
      r.x >= 0 &&
      r.y >= 0 &&
      r.x + r.w <= v.w &&
      r.y + r.h <= v.h &&
      !overlaps(r, petCorner(v)) &&
      !shellButtons(v).some((b) => overlaps(r, b)),
  )
    ? L
    : null;
}
