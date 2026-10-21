import type { Rng } from '../../engine/random';
import type { View } from '../../engine/view';

/**
 * Lost Layers: two invented sea cliffs, laid side by side. Gull Cliff is a whole record of six layers; Shell Cove is three
 * pieces with wavy lines between them where the sea took rock away. She slides Shell Cove's pieces beside Gull Cliff until
 * every fossil sits by its twin and no wavy line is squeezed shut, and says what the rocks can tell about where one fossil's
 * time went. The island's rules (a toy of relative time, not geology):
 *
 * 1. Layers stay in order: lower is older, and the order inside a cliff never changes.
 * 2. The same picture means the same time: each island creature lived at one time only.
 * 3. A wavy line is rock the sea took: at least one of the other cliff's layers belongs in that gap.
 * 4. (Level 2) The dark stripe fell on the whole island in one day, so it marks one time wherever it is.
 *
 * Rows are numbered 1–6 from the bottom; Shell Cove's pieces are 0 (bottom), 1 (the plain middle) and 2 (top).
 */

export const PICTURES = ['curl', 'fan', 'ribbon', 'dot'] as const;
export type Picture = (typeof PICTURES)[number];

/** What the pet calls each invented creature. */
export const CREATURE: Record<Picture, string> = { curl: 'curl shell', fan: 'fan fern', ribbon: 'ribbon fish', dot: 'dot snail' };

export interface Layer { picture: Picture | null; stripe?: boolean }
export type Layout = 'low' | 'high';
export type Placement = readonly [number, number, number];
export type Story = 'in-the-mud' | 'washed-away';
export type LookId = 'lens-mud' | 'lens-wavy' | 'lens-shell';
export const LOOKS: readonly LookId[] = ['lens-mud', 'lens-wavy', 'lens-shell'];

export interface Case {
  level: number;
  /** `[p1, p2, p3]`: p1 and p3 are at both cliffs; p2 is the lost one, only at Gull Cliff. */
  pictures: readonly [Picture, Picture, Picture];
  layout: Layout;
  /** Level 2: whether Shell Cove's plain piece carries the dark stripe. */
  stripe: boolean;
  /** The look cards, left to right (level 2). */
  looks: readonly LookId[];
}

export const ROWS = 6;
/** Shell Cove's wavy lines: above piece 0 and above piece 1. */
export const GAPS = [0, 1] as const;

/** Gull Cliff's row (1–6) of the lost fossil. */
export const lostRow = (c: Case): number => (c.layout === 'low' ? 3 : 4);

/** Gull Cliff, bottom to top. */
export function gull(c: Case): Layer[] {
  const [p1, p2, p3] = c.pictures;
  const rows: Layer[] = Array.from({ length: ROWS }, () => ({ picture: null }));
  rows[0] = { picture: p1 };
  rows[lostRow(c) - 1] = { picture: p2, stripe: c.level >= 2 || undefined };
  rows[5] = { picture: p3 };
  return rows;
}

/** Shell Cove's three pieces, bottom to top. */
export function cove(c: Case): Layer[] {
  return [{ picture: c.pictures[0] }, { picture: null, stripe: c.level >= 2 ? c.stripe : undefined }, { picture: c.pictures[2] }];
}

/** The Gull Cliff row with this picture. */
export const twinRow = (c: Case, p: Picture): number => gull(c).findIndex((l) => l.picture === p) + 1;

export type Reason = 'out-of-order' | 'picture-off-twin' | 'wavy-squeezed' | 'stripe';

/**
 * What is red about a placement, first reason first: the order, then a picture off its twin, then a squeezed wavy line,
 * then (after the stripe look) the stripe. Empty when it fits.
 */
export function problems(c: Case, rows: Placement, looked = false): { reason: Reason; piece?: number; gap?: number }[] {
  const out: { reason: Reason; piece?: number; gap?: number }[] = [];
  const pieces = cove(c);
  for (let i = 0; i < 2; i++) if (rows[i + 1] <= rows[i]) out.push({ reason: 'out-of-order', piece: i + 1 });
  pieces.forEach((p, i) => { if (p.picture && rows[i] !== twinRow(c, p.picture)) out.push({ reason: 'picture-off-twin', piece: i }); });
  for (const g of GAPS) if (rows[g + 1] - rows[g] < 2) out.push({ reason: 'wavy-squeezed', gap: g });
  if (looked && c.level >= 2) {
    const striped = lostRow(c);
    if (c.stripe !== (rows[1] === striped)) out.push({ reason: 'stripe', piece: 1 });
  }
  return out;
}

/** Whether the placement keeps every rule. */
export const valid = (c: Case, rows: Placement, looked = false): boolean => problems(c, rows, looked).length === 0;

/** Every valid placement, over the 20 ways to choose three rows of six. */
export function alignments(c: Case, looked = false): Placement[] {
  const out: Placement[] = [];
  for (let a = 1; a <= ROWS; a++) for (let b = a + 1; b <= ROWS; b++) for (let d = b + 1; d <= ROWS; d++) {
    const p: Placement = [a, b, d];
    if (valid(c, p, looked)) out.push(p);
  }
  return out;
}

/** Where the lost fossil's time went at Shell Cove: into the plain mud piece, or into the rock the sea took. */
export const story = (c: Case, rows: Placement): Story => (rows[1] === lostRow(c) ? 'in-the-mud' : 'washed-away');

/** The placement that tells a story (the two fits differ only in the plain piece's row). */
export function placementFor(c: Case, s: Story, looked = false): Placement | null {
  return alignments(c, looked).find((p) => story(c, p) === s) ?? alignments(c, false).find((p) => story(c, p) === s) ?? null;
}

/** Whether a look's result changes which placements fit. Only looking inside the plain mud can. */
export function informative(c: Case, look: LookId): boolean {
  if (c.level < 2) return false;
  if (look !== 'lens-mud') return false;
  return alignments(c, true).length !== alignments(c, false).length;
}

export const samePlacement = (a: Placement, b: Placement) => a[0] === b[0] && a[1] === b[1] && a[2] === b[2];

/* Ties ------------------------------------------------------------------------------------------- */

export interface Tie { piece: number; from: number; to: number; green: boolean }
export interface Band { gap: number; red: boolean }
export interface Ties { ties: Tie[]; bands: Band[]; stripe: Tie | null }

/**
 * The marks between the cliffs: a tie from each pictured piece to its twin row (green and level beside it, red and slanted
 * not), a band at each wavy line (red when it is squeezed or the pieces are out of order), and after a stripe look, a dark
 * tie from the plain piece to the striped row (red when the stripe and the row disagree).
 */
export function ties(c: Case, rows: Placement, looked = false): Ties {
  const pieces = cove(c);
  const out: Tie[] = [];
  pieces.forEach((p, i) => {
    if (!p.picture) return;
    const to = twinRow(c, p.picture);
    out.push({ piece: i, from: rows[i], to, green: rows[i] === to });
  });
  const bands = GAPS.map((g) => ({ gap: g, red: rows[g + 1] - rows[g] < 2 }));
  let stripe: Tie | null = null;
  if (looked && c.level >= 2) {
    const striped = lostRow(c);
    stripe = { piece: 1, from: rows[1], to: striped, green: c.stripe === (rows[1] === striped) };
  }
  // A broken order always squeezes a band (some neighbouring pair is not two rows apart), so the bands carry it.
  return { ties: out, bands, stripe };
}

/** Whether nothing is red. */
export function allGreen(t: Ties): boolean {
  return t.ties.every((x) => x.green) && t.bands.every((b) => !b.red) && (t.stripe ? t.stripe.green : true);
}

/* Cases ------------------------------------------------------------------------------------------ */

/** Each level's first round, as the definition describes it. */
export function authored(level: number): Case {
  return level >= 2
    ? { level: 2, pictures: ['dot', 'curl', 'ribbon'], layout: 'high', stripe: true, looks: ['lens-wavy', 'lens-mud', 'lens-shell'] }
    : { level: 1, pictures: ['curl', 'fan', 'ribbon'], layout: 'low', stripe: false, looks: [...LOOKS] };
}

export function makeCase(level: number, rng: Rng, first = false): Case {
  const lv = level >= 2 ? 2 : 1;
  if (first) return authored(lv);
  const pool = rng.shuffle([...PICTURES]);
  const pictures: [Picture, Picture, Picture] = [pool[0], pool[1], pool[2]];
  const layout: Layout = rng.chance(0.5) ? 'low' : 'high';
  const stripe = lv >= 2 ? rng.chance(0.5) : false;
  return { level: lv, pictures, layout, stripe, looks: rng.shuffle([...LOOKS]) };
}

/* A round ---------------------------------------------------------------------------------------- */

export type Step = 'arrange' | 'look' | 'claim';
export type Claim = Story | 'cant-tell';

export interface RoundState {
  c: Case;
  level: number;
  rows: [number, number, number];
  /** The stamped story cards, in order. */
  stamped: Placement[];
  /** The informative look has been made (level 2). */
  looked: boolean;
  misses: number;
  hints: number;
  stepMisses: Record<Step, number>;
  hinted: Set<Step>;
  done: boolean;
}

/** The start: the pictured pieces beside their twins, the plain piece on row 2 at level 1 (so a wavy line is already red), on the lower fit at level 2 with both stories stamped. */
export function roundState(c: Case): RoundState {
  const fits = alignments(c);
  const s: RoundState = {
    c, level: c.level, rows: [1, 2, 6], stamped: [], looked: false, misses: 0, hints: 0,
    stepMisses: { arrange: 0, look: 0, claim: 0 }, hinted: new Set(), done: false,
  };
  if (c.level >= 2) {
    s.rows = [...fits[0]] as [number, number, number];
    s.stamped = [...fits];
  }
  return s;
}

/** The step the round is on: arranging (level 1 until both stories are stamped), looking (level 2 until the stripe look), then claiming. */
export function currentStep(s: RoundState): Step {
  if (s.level >= 2) return s.looked ? 'claim' : 'look';
  return s.stamped.length < 2 ? 'arrange' : 'claim';
}

/** A miss on a step; true when it is that step's second, so its target glows (one hint). */
function miss(s: RoundState, step: Step): boolean {
  s.misses++;
  s.stepMisses[step]++;
  if (s.stepMisses[step] >= 2 && !s.hinted.has(step)) {
    s.hinted.add(step);
    s.hints++;
    return true;
  }
  return false;
}

/** Move a piece to a row (always free). Another piece already on that row swaps nothing: rows can coincide, which is red. */
export function move(s: RoundState, piece: number, row: number) {
  if (s.done) return;
  s.rows[piece] = Math.max(1, Math.min(ROWS, Math.round(row)));
}

export type FitsResult =
  | { kind: 'ignored' }
  | { kind: 'red'; reason: Reason; glow: boolean }
  | { kind: 'already'; index: number }
  | { kind: 'stamped'; story: Story; index: number };

/** It fits (level 1): stamp a story card when nothing is red, a miss when something is. */
export function fits(s: RoundState): FitsResult {
  if (s.done || s.level >= 2) return { kind: 'ignored' };
  const p = problems(s.c, s.rows);
  if (p.length) return { kind: 'red', reason: p[0].reason, glow: miss(s, 'arrange') };
  const index = s.stamped.findIndex((x) => samePlacement(x, s.rows));
  if (index >= 0) return { kind: 'already', index };
  s.stamped.push([...s.rows] as Placement);
  return { kind: 'stamped', story: story(s.c, s.rows), index: s.stamped.length - 1 };
}

export type ClaimResult =
  | { kind: 'ignored' }
  /** Level 1 Can't tell with one card: maybe, look for another fit. Free. */
  | { kind: 'maybe' }
  /** Level 2 before the look: not yet, pick a look. Free. */
  | { kind: 'not-yet' }
  /** Level 1, a story claimed with one card: the other fit is shown and stamped with help. A miss. */
  | { kind: 'other-fits'; placement: Placement; glow: boolean }
  /** Level 1, a story claimed when both are stamped. A miss. */
  | { kind: 'both-fit'; glow: boolean }
  /** Level 2 after the look: Can't tell, or the story it ruled out. A miss; the piece shows that story's red. */
  | { kind: 'ruled-out'; placement: Placement; glow: boolean }
  | { kind: 'right'; claim: Claim };

/** Claim what the rocks can tell. */
export function claim(s: RoundState, what: Claim): ClaimResult {
  if (s.done) return { kind: 'ignored' };
  if (s.level < 2) {
    if (s.stamped.length === 0) return { kind: 'ignored' };
    if (what === 'cant-tell') {
      if (s.stamped.length < 2) return { kind: 'maybe' };
      s.done = true;
      return { kind: 'right', claim: what };
    }
    if (!s.stamped.some((p) => story(s.c, p) === what)) return { kind: 'ignored' };
    const glow = miss(s, 'claim');
    if (s.stamped.length < 2) {
      const other = alignments(s.c).find((p) => !s.stamped.some((x) => samePlacement(x, p)))!;
      s.stamped.push(other);
      s.rows = [...other] as [number, number, number];
      return { kind: 'other-fits', placement: other, glow };
    }
    return { kind: 'both-fit', glow };
  }
  if (!s.looked) return { kind: 'not-yet' };
  const survivor = story(s.c, alignments(s.c, true)[0]);
  if (what === survivor) {
    s.done = true;
    return { kind: 'right', claim: what };
  }
  const glow = miss(s, 'claim');
  // Can't tell: show the ruled-out story's placement, the one with the red stripe tie.
  const shown = placementFor(s.c, survivor === 'in-the-mud' ? 'washed-away' : 'in-the-mud')!;
  s.rows = [...shown] as [number, number, number];
  return { kind: 'ruled-out', placement: shown, glow };
}

export type LookResult = { kind: 'ignored' } | { kind: 'informative'; stripe: boolean } | { kind: 'useless'; look: LookId; glow: boolean };

/** Commit a look (level 2). Only the look inside the plain mud can tell the stories apart; another is a miss. */
export function commitLook(s: RoundState, look: LookId): LookResult {
  if (s.done || s.level < 2 || s.looked) return { kind: 'ignored' };
  if (informative(s.c, look)) {
    s.looked = true;
    return { kind: 'informative', stripe: s.c.stripe };
  }
  return { kind: 'useless', look, glow: miss(s, 'look') };
}

/** Asked-for help: glow the current step's target, counting one hint per step at most. True when it counted. */
export function help(s: RoundState): boolean {
  if (s.done) return false;
  const step = currentStep(s);
  if (s.hinted.has(step)) return false;
  s.hinted.add(step);
  s.hints++;
  return true;
}

export type GlowTarget = { kind: 'fit'; placement: Placement } | { kind: 'look'; look: LookId } | { kind: 'claim'; claim: Claim };

/** What glows for a step: a fit not yet stamped, the mud look, or the right claim. */
export function glowTarget(s: RoundState, step: Step = currentStep(s)): GlowTarget | null {
  if (s.done) return null;
  if (step === 'arrange') {
    const p = alignments(s.c).find((x) => !s.stamped.some((y) => samePlacement(x, y)));
    return p ? { kind: 'fit', placement: p } : null;
  }
  if (step === 'look') return s.looked ? null : { kind: 'look', look: 'lens-mud' };
  if (s.level < 2) return { kind: 'claim', claim: 'cant-tell' };
  return { kind: 'claim', claim: story(s.c, alignments(s.c, true)[0]) };
}

/** The glow on screen now: the current step's target once that step has been hinted. */
export function glowing(s: RoundState): GlowTarget | null {
  const step = currentStep(s);
  return s.hinted.has(step) ? glowTarget(s, step) : null;
}

/* Levels ----------------------------------------------------------------------------------------- */

export interface Plan { id: number; name: string }
export const PLANS: readonly Plan[] = [
  { id: 1, name: 'Two stories: every way the broken cliff fits, then whether the rocks can tell' },
  { id: 2, name: 'One more look: pick the look that tells two stories apart, then the story that still fits' },
];
export const planFor = (level: number): Plan => PLANS[Math.max(0, Math.min(PLANS.length - 1, level - 1))];

/* Layout ----------------------------------------------------------------------------------------- */

export interface Pt { x: number; y: number }
export interface Rect { x: number; y: number; w: number; h: number }

export const ROW_H = 100;
export const COL_W = 180;
export const BTN_W = 200;
export const BTN_H = 100;
export const CARD_W = 200;
export const CARD_H = 110;
export const LOOK_W = 150;
export const LOOK_H = 120;
export const SLOT_W = 160;
export const SLOT_H = 130;
export const LENS_R = 150;

export interface LayersLayout {
  portrait: boolean;
  /** The two columns' left edges and the bottom of row 1. */
  gullX: number;
  coveX: number;
  bottom: number;
  /** It fits (level 1) or Look (level 2), centered. */
  action: Pt;
  /** The two story cards, which are also their claim buttons. */
  cards: Pt[];
  cantTell: Pt;
  /** Level 2: the three look cards and the slot. */
  looks: Pt[];
  slot: Pt;
  lens: Pt;
}

export const petCorner = (v: View): Rect => ({ x: 0, y: v.h - 205, w: 200, h: 205 });
export const shellButtons = (v: View): Rect[] => [{ x: 0, y: 0, w: 130, h: 130 }, { x: v.w - 130, y: 0, w: 130, h: 130 }];

/** The centre of a row (1–6, bottom to top). */
export const rowY = (L: LayersLayout, row: number): number => L.bottom - (row - 0.5) * ROW_H;

/** The nearest row to a height, clamped to the column. */
export const nearestRow = (L: LayersLayout, y: number): number => Math.max(1, Math.min(ROWS, Math.round((L.bottom - y) / ROW_H + 0.5)));

export function layersLayout(v: View, level: number): LayersLayout {
  const portrait = v.h > v.w;
  if (portrait) {
    const mid = v.w / 2;
    const gullX = mid - 40 - COL_W, coveX = mid + 40;
    const top = 150, bottom = top + ROWS * ROW_H;
    const t1 = bottom + 30 + BTN_H / 2;
    const t2 = t1 + BTN_H / 2 + 20 + CARD_H / 2;
    const lx = gullX - 60 - LOOK_W / 2;
    return {
      portrait, gullX, coveX, bottom,
      action: { x: mid - 120, y: t1 },
      cantTell: { x: mid + 120, y: t1 },
      cards: [{ x: mid - 120, y: t2 }, { x: mid + 120, y: t2 }],
      looks: [0, 1, 2].map((i) => ({ x: lx, y: top + 70 + i * (LOOK_H + 20) })),
      slot: { x: lx, y: top + 70 + 3 * (LOOK_H + 20) + 10 },
      lens: { x: mid, y: top + 250 },
    };
  }
  const ox = Math.max(0, (v.w - 1024) / 2);
  const gullX = ox + 300, coveX = ox + 560;
  const bottom = 80 + ROWS * ROW_H;
  const rx = Math.min(v.w - 30 - BTN_W / 2, ox + 900);
  const lx = ox + 50 + LOOK_W / 2;
  // Level 2 stacks the slot and Look above the cards in the right column; the look cards wait on the left, above the pet.
  const y0 = level >= 2 ? 145 + SLOT_H + 10 : 145;
  return {
    portrait, gullX, coveX, bottom,
    action: { x: rx, y: y0 + BTN_H / 2 },
    cards: [{ x: rx, y: y0 + BTN_H + 12 + CARD_H / 2 }, { x: rx, y: y0 + BTN_H + 24 + CARD_H * 1.5 }],
    cantTell: { x: rx, y: y0 + BTN_H + 36 + CARD_H * 2 + BTN_H / 2 },
    looks: [0, 1, 2].map((i) => ({ x: lx, y: 145 + LOOK_H / 2 + i * (LOOK_H + 12) })),
    slot: { x: rx, y: 145 + SLOT_H / 2 },
    lens: { x: coveX - 40, y: 250 },
  };
}
