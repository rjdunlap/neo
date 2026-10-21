/**
 * Trackway Tales: an invented two-footed mud walker left a line of footprints in dried mud. Movement cards
 * each propose how it moved; a card's replay stamps ghost prints by a fixed toy model, and a card is kept
 * only when its prints reproduce every visible mark. At level 3 a puddle hides the middle, and when two
 * cards leave the very same marks, Can't tell is the answer. Nothing is inferred about species, speed or mood.
 *
 * The toy model, as the study card states it: a walk is one foot then the other, a hop is both together,
 * standing still leaves no mark. Marks are stored by screen half (row 0 above the lane's centre line, row 1
 * below): a creature walking right has its left foot on the upper half, one walking left on the lower half,
 * so walking either way presses the same pads and only the toes differ.
 */
import type { Rng } from '../../engine/random';
import type { View } from '../../engine/view';

/* The model -------------------------------------------------------------------------------------- */

export type Heading = 1 | -1;
export type Row = 0 | 1;
export interface Mark { col: number; row: Row; heading: Heading }
export type Gait = 'walk' | 'hop' | 'stand';
export interface Segment { gait: Gait; count: number }
export type MoveId = 'walk' | 'hop' | 'walk-back' | 'hop-back' | 'walk-stand-walk' | 'walk-then-hop';
export interface Movement { id: MoveId; name: string; heading: Heading; segments: readonly Segment[] }

/**
 * The six authored movements. A single-gait movement carries on to the end of any strip (its count is the
 * eight-column strip's), so `walk` and `hop` cover the same span on 4, 6 and 8 columns.
 */
export const MOVEMENTS: Record<MoveId, Movement> = {
  walk: { id: 'walk', name: 'walked', heading: 1, segments: [{ gait: 'walk', count: 8 }] },
  hop: { id: 'hop', name: 'hopped', heading: 1, segments: [{ gait: 'hop', count: 4 }] },
  'walk-back': { id: 'walk-back', name: 'walked the other way', heading: -1, segments: [{ gait: 'walk', count: 8 }] },
  'hop-back': { id: 'hop-back', name: 'hopped the other way', heading: -1, segments: [{ gait: 'hop', count: 4 }] },
  'walk-stand-walk': {
    id: 'walk-stand-walk', name: 'walked, stopped to look, walked on', heading: 1,
    segments: [{ gait: 'walk', count: 4 }, { gait: 'stand', count: 1 }, { gait: 'walk', count: 4 }],
  },
  'walk-then-hop': { id: 'walk-then-hop', name: 'walked, then hopped', heading: 1, segments: [{ gait: 'walk', count: 3 }, { gait: 'hop', count: 3 }] },
};
export const MOVE_IDS = Object.keys(MOVEMENTS) as MoveId[];

/** One contact with the ground, in order: a walk step leaves one mark, a hop two, a stand none (it pauses where it is). */
export interface Contact { col: number; marks: Mark[]; gait: Gait }

/** The row a foot lands on: the left foot is on the upper half walking right, on the lower half walking left. */
const rowOf = (left: boolean, heading: Heading): Row => ((left ? 0 : 1) ^ (heading === 1 ? 0 : 1)) as Row;

/** Every contact a movement makes on a strip of `cols` columns, from column 0 (or the last column walking left). */
export function contacts(m: Movement, cols: number): Contact[] {
  const out: Contact[] = [];
  const h = m.heading;
  let i = 0; // columns advanced
  let left = true; // the next walking foot
  const colAt = (k: number) => (h === 1 ? k : cols - 1 - k);
  for (const s of m.segments) {
    for (let n = 0; n < s.count; n++) {
      if (s.gait === 'stand') {
        out.push({ col: colAt(Math.max(0, i - 1)), marks: [], gait: 'stand' });
        continue;
      }
      if (i >= cols) return out;
      const col = colAt(i);
      if (s.gait === 'walk') {
        out.push({ col, marks: [{ col, row: rowOf(left, h), heading: h }], gait: 'walk' });
        left = !left;
        i += 1;
      } else {
        out.push({ col, marks: [{ col, row: rowOf(true, h), heading: h }, { col, row: rowOf(false, h), heading: h }].sort((a, b) => a.row - b.row), gait: 'hop' });
        i += 2;
      }
    }
  }
  return out;
}

/** The marks a movement leaves, in the order it presses them. */
export const stamp = (m: Movement, cols: number): Mark[] => contacts(m, cols).flatMap((c) => c.marks);

export interface Puddle { from: number; to: number }
export const inPuddle = (col: number, p?: Puddle): boolean => !!p && col >= p.from && col <= p.to;

/** What the mud shows: the marks outside the puddle. */
export interface Observed { cols: number; marks: Mark[]; puddle?: Puddle }

const key = (m: Mark) => `${m.col}:${m.row}:${m.heading}`;
const visible = (marks: Mark[], p?: Puddle) => marks.filter((m) => !inPuddle(m.col, p));

/** A movement fits when its visible stamp is exactly the observed set: same columns, same halves, same toes. */
export function fits(m: Movement, o: Observed): boolean {
  const a = visible(stamp(m, o.cols), o.puddle).map(key).sort();
  const b = o.marks.map(key).sort();
  return a.length === b.length && a.every((k, i) => k === b[i]);
}

export type Mismatch = 'extra' | 'missing' | 'toe';

/** The visible columns in a movement's order: left to right walking right, right to left walking left. */
export function orderedCols(m: Movement, o: Observed): number[] {
  const cols = Array.from({ length: o.cols }, (_, i) => (m.heading === 1 ? i : o.cols - 1 - i));
  return cols.filter((c) => !inPuddle(c, o.puddle));
}

/** How one column's stamped marks differ from the mud's there, or null when they agree. */
export function columnDiff(m: Movement, o: Observed, col: number): Mismatch | null {
  const s = stamp(m, o.cols).filter((x) => x.col === col);
  const ob = o.marks.filter((x) => x.col === col);
  const sRows = new Set(s.map((x) => x.row)), oRows = new Set(ob.map((x) => x.row));
  if ([...sRows].some((r) => !oRows.has(r))) return 'extra';
  if ([...oRows].some((r) => !sRows.has(r))) return 'missing';
  for (const x of s) if (ob.find((y) => y.row === x.row)!.heading !== x.heading) return 'toe';
  return null;
}

/** The first visible column, in the movement's order, where its marks differ from the mud's. */
export function firstMismatch(m: Movement, o: Observed): { col: number; kind: Mismatch } | null {
  for (const col of orderedCols(m, o)) {
    const kind = columnDiff(m, o, col);
    if (kind) return { col, kind };
  }
  return null;
}

/* Cases ------------------------------------------------------------------------------------------ */

export type CaseId = 'L1-walk' | 'L1-hop' | 'L2-left' | 'L2-right' | 'L3-pause' | 'L3-switch';
export interface Case { id: CaseId; level: number; cols: number; observedFrom: MoveId; puddle?: Puddle; cards: readonly MoveId[] }

export const COLS: Record<number, number> = { 1: 4, 2: 6, 3: 8 };

export const CASES: readonly Case[] = [
  { id: 'L1-walk', level: 1, cols: 4, observedFrom: 'walk', cards: ['walk', 'hop'] },
  { id: 'L1-hop', level: 1, cols: 4, observedFrom: 'hop', cards: ['walk', 'hop'] },
  { id: 'L2-left', level: 2, cols: 6, observedFrom: 'walk-back', cards: ['walk', 'walk-back', 'hop-back'] },
  { id: 'L2-right', level: 2, cols: 6, observedFrom: 'walk', cards: ['walk', 'walk-back', 'hop'] },
  { id: 'L3-pause', level: 3, cols: 8, observedFrom: 'walk', puddle: { from: 3, to: 4 }, cards: ['walk', 'walk-stand-walk', 'hop'] },
  { id: 'L3-switch', level: 3, cols: 8, observedFrom: 'walk-then-hop', puddle: { from: 3, to: 4 }, cards: ['walk', 'hop', 'walk-then-hop'] },
];
export const caseById = (id: CaseId): Case => CASES.find((c) => c.id === id)!;

export function observed(c: Case): Observed {
  return { cols: c.cols, marks: visible(stamp(MOVEMENTS[c.observedFrom], c.cols), c.puddle), puddle: c.puddle };
}

/** The cards whose replay reproduces every visible mark: computed, never authored. */
export const accepted = (c: Case): MoveId[] => c.cards.filter((id) => fits(MOVEMENTS[id], observed(c)));

/** A card on the table: a movement, or Can't tell (level 3 only). */
export type CardId = MoveId | 'cant-tell';

/** The one fitting card, or Can't tell when two or more fit. */
export function answer(c: Case): CardId {
  const a = accepted(c);
  return a.length >= 2 ? 'cant-tell' : a[0];
}

/* Rounds ----------------------------------------------------------------------------------------- */

export interface Round {
  c: Case;
  /** Left to right; Can't tell, when present, is always last. */
  cards: CardId[];
  /** Levels 2–3: the mark that starts in the magnifier, so one toe is already large. */
  magnified: Mark | null;
}

/** Each level's first round of a session, as the definition's walkthrough tells it. */
const AUTHORED: Record<number, { id: CaseId; cards: MoveId[]; magnifiedCol: number | null }> = {
  1: { id: 'L1-walk', cards: ['hop', 'walk'], magnifiedCol: null },
  2: { id: 'L2-left', cards: ['walk', 'hop-back', 'walk-back'], magnifiedCol: 5 },
  3: { id: 'L3-pause', cards: ['walk-stand-walk', 'hop', 'walk'], magnifiedCol: 6 },
};

export function makeRound(level: number, rng: Rng, first = false): Round {
  const lv = planFor(level).id;
  const withCantTell = (cards: MoveId[]): CardId[] => (lv >= 3 ? [...cards, 'cant-tell'] : cards);
  if (first) {
    const a = AUTHORED[lv];
    const c = caseById(a.id);
    const o = observed(c);
    return { c, cards: withCantTell(a.cards), magnified: a.magnifiedCol === null ? null : o.marks.find((m) => m.col === a.magnifiedCol) ?? null };
  }
  const c = rng.pick(CASES.filter((x) => x.level === lv));
  const cards = rng.shuffle([...c.cards]);
  const o = observed(c);
  return { c, cards: withCantTell(cards), magnified: lv >= 2 ? rng.pick(o.marks) : null };
}

/* Accounting ------------------------------------------------------------------------------------- */

export interface RoundState {
  round: Round;
  misses: number;
  hints: number;
  /** A hint has been counted this round (the glow after two misses, or Show a hint). */
  helped: boolean;
  /** Cards a Check has shown not to fit; nothing locks, they can be checked again. */
  eliminated: Set<MoveId>;
  /** At level 3, a fitting card was checked while another fits too, and the second fit was shown. */
  bothShown: boolean;
  done: boolean;
}

export const roundState = (round: Round): RoundState => ({ round, misses: 0, hints: 0, helped: false, eliminated: new Set(), bothShown: false, done: false });

export type CheckResult =
  | { kind: 'empty' }
  | { kind: 'ignored' }
  | { kind: 'right'; card: CardId }
  | { kind: 'both-fit'; other: MoveId }
  | { kind: 'wrong'; card: MoveId; col: number; mismatch: Mismatch; glow: boolean }
  | { kind: 'cant-tell-wrong'; fit: MoveId; glow: boolean };

/** A miss; the second one in a round lights the glow and counts the round's one hint. */
function miss(s: RoundState): boolean {
  s.misses++;
  if (s.misses >= 2 && !s.helped) {
    s.helped = true;
    s.hints++;
    return true;
  }
  return false;
}

/** Check the card on the study board. Never a miss: an empty slot, a finished round, a fitting card while another also fits. */
export function check(s: RoundState, card: CardId | null): CheckResult {
  if (s.done) return { kind: 'ignored' };
  if (!card) return { kind: 'empty' };
  const c = s.round.c;
  const fitsNow = accepted(c);
  if (card === 'cant-tell') {
    if (fitsNow.length >= 2) {
      s.done = true;
      return { kind: 'right', card };
    }
    return { kind: 'cant-tell-wrong', fit: fitsNow[0], glow: miss(s) };
  }
  if (fitsNow.includes(card)) {
    if (fitsNow.length >= 2) {
      s.bothShown = true;
      return { kind: 'both-fit', other: fitsNow.find((x) => x !== card)! };
    }
    s.done = true;
    return { kind: 'right', card };
  }
  const mm = firstMismatch(MOVEMENTS[card], observed(c))!;
  s.eliminated.add(card);
  return { kind: 'wrong', card, col: mm.col, mismatch: mm.kind, glow: miss(s) };
}

/** Show a hint: counts at most once per round, and lights the glow. */
export function help(s: RoundState): boolean {
  if (s.done || s.helped) return false;
  s.helped = true;
  s.hints++;
  return true;
}

/** The card that glows once help has been given. */
export const glowing = (s: RoundState): CardId | null => (s.helped && !s.done ? answer(s.round.c) : null);

/**
 * The column the hint rings on both strips: the lowest visible column where a card not yet shown wrong
 * stamps differently from the mud (so looking there rules it out), else the lowest where any card differs.
 */
export function informativeColumn(c: Case, remaining: readonly MoveId[]): number | null {
  const o = observed(c);
  const wrong = remaining.filter((id) => !fits(MOVEMENTS[id], o));
  const pool = wrong.length ? wrong : c.cards.filter((id) => !fits(MOVEMENTS[id], o));
  let best: number | null = null;
  for (const id of pool) {
    for (let col = 0; col < c.cols; col++) {
      if (inPuddle(col, c.puddle) || !columnDiff(MOVEMENTS[id], o, col)) continue;
      if (best === null || col < best) best = col;
      break;
    }
  }
  return best;
}

/** The cards still worth a look: those a Check has not shown wrong. */
export const remaining = (s: RoundState): MoveId[] => s.round.c.cards.filter((id) => !s.eliminated.has(id));

/* Plans ------------------------------------------------------------------------------------------ */

export interface Plan { id: number; name: string }
export const PLANS: readonly Plan[] = [
  { id: 1, name: 'Walk or hop? Two replays; pick the one whose footprints match the mud' },
  { id: 2, name: 'Which way? Three replays, two that differ only by the way the toes point' },
  { id: 3, name: "Can we tell? A puddle hides the middle; one card fits, or two leave the same marks and Can't tell is right" },
];
export const planFor = (level: number): Plan => PLANS[Math.max(0, Math.min(PLANS.length - 1, level - 1))];

/* Layout ----------------------------------------------------------------------------------------- */

export interface Pt { x: number; y: number }
export interface Rect { x: number; y: number; w: number; h: number }

export const STRIP_H = 160;
/** A footprint pad, across. */
export const MARK = 70;
/** The half-height offset of each foot row from the lane's centre line. */
export const ROW_OFF = 40;
export const CARD_W = 140;
export const CARD_H = 240;
/** The round Play button at the foot of each card. */
export const PLAY_R = 52;
export const SLOT_W = 170;
export const SLOT_H = 150;
export const CHECK_W = 170;
export const CHECK_H = 104;
export const LENS_R = 120;

export interface TrackLayout {
  /** The clear practice strip (top) and the mud strip under it. */
  practice: Rect;
  mud: Rect;
  colW: number;
  /** Card centres, left to right, and each card's Play button centre. */
  cards: Pt[];
  plays: Pt[];
  slot: Pt;
  check: Pt;
  lens: Pt;
}

export const petCorner = (v: View): Rect => ({ x: 0, y: v.h - 205, w: 200, h: 205 });
export const shellButtons = (v: View): Rect[] => [{ x: 0, y: 0, w: 130, h: 130 }, { x: v.w - 130, y: 0, w: 130, h: 130 }];

/** The x of a column's centre on a strip. */
export const colX = (L: TrackLayout, col: number): number => L.mud.x + (col + 0.5) * L.colW;
/** The y of a mark's centre on a strip. */
export const rowY = (strip: Rect, row: Row): number => strip.y + strip.h / 2 + (row === 0 ? -ROW_OFF : ROW_OFF);

/** The column nearest an x, clamped to the strip. */
export const nearestCol = (L: TrackLayout, x: number, cols: number): number => Math.max(0, Math.min(cols - 1, Math.floor((x - L.mud.x) / L.colW)));

/**
 * The strips across the top, the cards in a row under them from the pet's edge, and the study board with
 * Check at the right of that row. The 1024×768 design area is centred in a wider or taller view.
 */
export function trackLayout(v: View, level: number): TrackLayout {
  const lv = planFor(level).id;
  const cols = COLS[lv];
  const ox = Math.max(0, (v.w - 1024) / 2), oy = Math.max(0, (v.h - 768) / 2);
  const colW = Math.min(150, 900 / cols);
  const w = colW * cols;
  const sx = ox + 512 - w / 2;
  const practice = { x: sx, y: oy + 136, w, h: STRIP_H };
  const mud = { x: sx, y: practice.y + STRIP_H + 8, w, h: STRIP_H };
  const n = lv >= 3 ? 4 : lv === 2 ? 3 : 2;
  const gap = 14;
  const rowY0 = mud.y + STRIP_H + 14 + CARD_H / 2;
  const left = ox + 210, right = ox + 1014 - SLOT_W - 20;
  const span = n * CARD_W + (n - 1) * gap;
  const cx0 = left + Math.max(0, (right - left - span) / 2) + CARD_W / 2;
  const cards = Array.from({ length: n }, (_, i) => ({ x: cx0 + i * (CARD_W + gap), y: rowY0 }));
  const plays = cards.map((p) => ({ x: p.x, y: p.y + CARD_H / 2 - PLAY_R - 10 }));
  const bx = ox + 1014 - SLOT_W / 2;
  const top = rowY0 - CARD_H / 2;
  return {
    practice, mud, colW, cards, plays,
    slot: { x: bx, y: top + SLOT_H / 2 },
    check: { x: bx, y: top + SLOT_H + 12 + CHECK_H / 2 },
    lens: { x: ox + 512, y: Math.max(LENS_R + 6, practice.y + STRIP_H / 2 - 10) },
  };
}
