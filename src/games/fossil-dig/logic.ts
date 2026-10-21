import type { Rng } from '../../engine/random';
import type { View } from '../../engine/view';

/*
 * Fossil Dig: brush the dust off a stone in one of three dig squares until a leaf print shows, tap the flag of the
 * square it was found in, then pick the pinned reference leaf it looks like and Check. Level 1 compares the outline
 * (lobed or not); level 2 the edge (toothed or smooth) when both outlines agree. The leaves are invented island leaves.
 */

export type Outline = 'lobed' | 'unlobed';
export type Margin = 'toothed' | 'smooth';
export type Feature = 'outline' | 'margin';
export type LeafId = 'star' | 'ribbon' | 'saw-star';
export type FlagId = 'red' | 'blue' | 'yellow';
export type CaseId = 'L1-star' | 'L1-ribbon' | 'L2-saw' | 'L2-star';

export interface Pt { x: number; y: number }
export interface Leaf { id: LeafId; name: string; outline: Outline; margin: Margin }

export const LEAVES: readonly Leaf[] = [
  { id: 'star', name: 'star leaf', outline: 'lobed', margin: 'smooth' },
  { id: 'ribbon', name: 'ribbon leaf', outline: 'unlobed', margin: 'smooth' },
  { id: 'saw-star', name: 'saw-star leaf', outline: 'lobed', margin: 'toothed' },
];
export const leafOf = (id: LeafId): Leaf => LEAVES.find((l) => l.id === id)!;

export interface Case { id: CaseId; level: 1 | 2; find: LeafId; references: [LeafId, LeafId]; feature: Feature }

export const CASES: readonly Case[] = [
  { id: 'L1-star', level: 1, find: 'star', references: ['star', 'ribbon'], feature: 'outline' },
  { id: 'L1-ribbon', level: 1, find: 'ribbon', references: ['star', 'ribbon'], feature: 'outline' },
  { id: 'L2-saw', level: 2, find: 'saw-star', references: ['saw-star', 'star'], feature: 'margin' },
  { id: 'L2-star', level: 2, find: 'star', references: ['saw-star', 'star'], feature: 'margin' },
];
export const caseOf = (id: CaseId): Case => CASES.find((c) => c.id === id)!;

/** The comparison: the find and a reference agree on the one feature asked about. A plain lookup, never a score. */
export const matches = (find: Leaf, reference: Leaf, feature: Feature): boolean => find[feature] === reference[feature];

/** The reference that matches the find on the case's feature. */
export function answer(c: Case): LeafId {
  const find = leafOf(c.find);
  return c.references.find((r) => matches(find, leafOf(r), c.feature))!;
}

/** The three dig squares, left to right, each with a flag that differs from the others in colour and shape. */
export interface Flag { id: FlagId; shape: 'circle' | 'triangle' | 'square'; name: string }
export const FLAGS: readonly Flag[] = [
  { id: 'red', shape: 'circle', name: 'red circle' },
  { id: 'blue', shape: 'triangle', name: 'blue triangle' },
  { id: 'yellow', shape: 'square', name: 'yellow square' },
];

/* The stone and its dust ------------------------------------------------------------------------- */

export const STONE_W = 400;
export const STONE_H = 300;
export const CELL = 50;
export const COLS = 8;
export const ROWS = 6;
/** A pat's reach in stone units at the least (the game widens it so a palm-sized touch clears a palm-sized disc). */
export const BRUSH = 55;
/** The share of the print's cells that must be cleared for the find to be shown. */
export const SHOWN_AT = 0.7;
/** How near a cell's centre must come to the print's outline to belong to the print. */
const NEAR = 25;

export const cellCenter = (i: number): Pt => ({ x: -STONE_W / 2 + CELL / 2 + (i % COLS) * CELL, y: -STONE_H / 2 + CELL / 2 + Math.floor(i / COLS) * CELL });

/** A leaf's outline in stone units, centred on the stone: five rounded lobes, or a narrow tilted lens; teeth if toothed. */
export function leafOutline(id: LeafId): Pt[] {
  const leaf = leafOf(id);
  const pts: Pt[] = [];
  if (leaf.outline === 'lobed') {
    const R = 128, n = 180;
    for (let k = 0; k < n; k++) {
      const a = (k / n) * Math.PI * 2;
      let r = R * (0.68 + 0.32 * Math.cos(5 * (a + Math.PI / 2)));
      if (leaf.margin === 'toothed') r -= k % 2 === 0 ? 8 : 0;
      pts.push({ x: Math.cos(a) * r * 1.25, y: 15 + Math.sin(a) * r });
    }
    return pts;
  }
  const L = 175, W = 62, tilt = -0.32, n = 90;
  const side = (t: number, s: number): Pt => {
    const x = L * t, y = s * W * (1 - t * t);
    return { x: x * Math.cos(tilt) - y * Math.sin(tilt), y: x * Math.sin(tilt) + y * Math.cos(tilt) };
  };
  for (let k = 0; k <= n; k++) pts.push(side(-1 + (2 * k) / n, -1));
  for (let k = n - 1; k > 0; k--) pts.push(side(-1 + (2 * k) / n, 1));
  return pts;
}

/** Where the magnifier looks on each leaf: a point on its edge (a lobe's tip, or the middle of the lens's upper side). */
export function edgePoint(id: LeafId): Pt {
  const pts = leafOutline(id);
  if (leafOf(id).outline === 'lobed') return pts.reduce((a, b) => (b.x > a.x ? b : a));
  return pts.reduce((a, b) => (b.y < a.y && Math.abs(b.x) < 60 ? b : a), pts[0]);
}

function insidePoly(p: Pt, poly: Pt[]): boolean {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const a = poly[i], b = poly[j];
    if ((a.y > p.y) !== (b.y > p.y) && p.x < ((b.x - a.x) * (p.y - a.y)) / (b.y - a.y) + a.x) inside = !inside;
  }
  return inside;
}

const cellsCache = new Map<LeafId, number[]>();
/** The cells the print occupies: those whose centre lies inside the outline or near its edge. */
export function leafCells(id: LeafId): number[] {
  let c = cellsCache.get(id);
  if (!c) {
    const poly = leafOutline(id);
    c = [];
    for (let i = 0; i < COLS * ROWS; i++) {
      const p = cellCenter(i);
      if (insidePoly(p, poly) || poly.some((q) => Math.hypot(q.x - p.x, q.y - p.y) < NEAR)) c.push(i);
    }
    cellsCache.set(id, c);
  }
  return c;
}

/** The print's cells with a neighbour outside the print: a bit of edge, for the pre-cleared start. */
export function edgeCells(id: LeafId): number[] {
  const set = new Set(leafCells(id));
  return [...set].filter((i) => {
    const x = i % COLS, y = Math.floor(i / COLS);
    return [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => {
      const nx = x + dx, ny = y + dy;
      return nx < 0 || ny < 0 || nx >= COLS || ny >= ROWS || !set.has(ny * COLS + nx);
    });
  });
}

/** The share of the print's cells cleared. */
export function revealed(cleared: readonly boolean[], find: LeafId): number {
  const cells = leafCells(find);
  return cells.filter((i) => cleared[i]).length / cells.length;
}

/** A pat at a point (stone units): every covered cell whose centre is within the reach is cleared. Returns those cells. */
export function patCells(cleared: boolean[], at: Pt, reach = BRUSH): number[] {
  const out: number[] = [];
  for (let i = 0; i < cleared.length; i++) {
    if (cleared[i]) continue;
    const c = cellCenter(i);
    if (Math.hypot(c.x - at.x, c.y - at.y) <= reach) {
      cleared[i] = true;
      out.push(i);
    }
  }
  return out;
}

/** The twelve cell corners on a 100-unit spacing: a pat on each clears one 2×2 block, and the twelve tile the stone. */
export const BRUSH_SPOTS: readonly Pt[] = Array.from({ length: 12 }, (_, k) => ({ x: -150 + 100 * (k % 4), y: -100 + 100 * Math.floor(k / 4) }));

/** The bot's next pat: the spot that clears the most of the print still covered, or null once the find is shown. */
export function nextBrush(cleared: readonly boolean[], find: LeafId): Pt | null {
  if (revealed(cleared, find) >= SHOWN_AT) return null;
  const cells = leafCells(find);
  let best: Pt | null = null, bestN = 0;
  for (const s of BRUSH_SPOTS) {
    const n = cells.filter((i) => !cleared[i] && Math.hypot(cellCenter(i).x - s.x, cellCenter(i).y - s.y) <= BRUSH).length;
    if (n > bestN) { bestN = n; best = s; }
  }
  return best;
}

/* Levels and rounds ----------------------------------------------------------------------------- */

export interface Plan { id: 1 | 2; name: string; feature: Feature }
export const PLANS: readonly Plan[] = [
  { id: 1, name: 'A leaf left a clue: brush, mark where, match the shape', feature: 'outline' },
  { id: 2, name: 'Look more closely: brush, mark where, match the edge up close', feature: 'margin' },
];
export const planFor = (level: number): Plan => PLANS[Math.max(0, Math.min(PLANS.length - 1, level - 1))];

export interface Round {
  level: 1 | 2;
  caseId: CaseId;
  /** The dig square (0–2, left to right) that holds the stone. */
  site: number;
  /** The reference cards, left to right. */
  order: [LeafId, LeafId];
  /** One print cell cleared from the start, so a bit of the edge shows. */
  preCleared: number;
}

/** The definition's first rounds, played once per level per session (not by the demonstration). */
export function authored(level: 1 | 2): Round {
  if (level === 1) return { level, caseId: 'L1-star', site: 1, order: ['ribbon', 'star'], preCleared: edgeCells('star')[0] };
  return { level, caseId: 'L2-saw', site: 2, order: ['star', 'saw-star'], preCleared: edgeCells('saw-star')[0] };
}

export function makeRound(level: number, rng: Rng, first = false): Round {
  const plan = planFor(level);
  if (first) return authored(plan.id);
  const c = rng.pick(CASES.filter((k) => k.level === plan.id));
  return { level: plan.id, caseId: c.id, site: rng.int(0, 2), order: rng.shuffle([...c.references]) as [LeafId, LeafId], preCleared: rng.pick(edgeCells(c.find)) };
}

/** The flag that marks where the find was: the flag of the stone's square. */
export const whereAnswer = (r: Round): FlagId => FLAGS[r.site].id;

/* One round's rules ----------------------------------------------------------------------------- */

export type Step = 'brush' | 'where' | 'like' | 'done';
export type HelpStep = 'where' | 'like';

/**
 * The scoring state. Brushing, looking, swapping or returning a leaf, and early taps are never counted. A wrong flag
 * or a wrong Check is a miss; two on one step glow its answer, which counts one hint for that step, as does asking.
 */
export interface DigState {
  round: Round;
  cleared: boolean[];
  shown: boolean;
  where: FlagId | null;
  like: LeafId | null;
  wrong: Record<HelpStep, number>;
  helped: Record<HelpStep, boolean>;
  misses: number;
  hints: number;
  done: boolean;
}

export function digState(round: Round): DigState {
  const cleared = new Array<boolean>(COLS * ROWS).fill(false);
  cleared[round.preCleared] = true;
  return { round, cleared, shown: false, where: null, like: null, wrong: { where: 0, like: 0 }, helped: { where: false, like: false }, misses: 0, hints: 0, done: false };
}

export const findOf = (s: DigState): LeafId => caseOf(s.round.caseId).find;

export function stepOf(s: DigState): Step {
  if (s.done) return 'done';
  if (!s.shown) return 'brush';
  return s.where ? 'like' : 'where';
}

/** A pat: clears dust, and shows the find once enough of the print is clear. */
export function pat(s: DigState, at: Pt, reach = BRUSH): { cells: number[]; shownNow: boolean } {
  const cells = patCells(s.cleared, at, reach);
  const shownNow = !s.shown && revealed(s.cleared, findOf(s)) >= SHOWN_AT;
  if (shownNow) s.shown = true;
  return { cells, shownNow };
}

/** Help on the current step: its answer glows. Counts once per step; returns whether it counted. */
export function help(s: DigState): boolean {
  const step = stepOf(s);
  if (step !== 'where' && step !== 'like') return false;
  if (s.helped[step]) return false;
  s.helped[step] = true;
  s.hints++;
  return true;
}

export type FlagResult = 'early' | 'ignored' | 'right' | 'miss';

export function tapFlag(s: DigState, flag: FlagId): FlagResult {
  const step = stepOf(s);
  if (step === 'brush') return 'early';
  if (step !== 'where') return 'ignored';
  if (flag === whereAnswer(s.round)) {
    s.where = flag;
    return 'right';
  }
  s.misses++;
  if (++s.wrong.where >= 2) help(s);
  return 'miss';
}

export type LeafResult = 'early' | 'ignored' | 'placed' | 'returned';

/** Tap a reference: into the Like slot, swapping any there; tapping the one in the slot returns it. Free. */
export function pickLeaf(s: DigState, leaf: LeafId): LeafResult {
  const step = stepOf(s);
  if (step === 'done') return 'ignored';
  if (step !== 'like') return 'early';
  if (s.like === leaf) {
    s.like = null;
    return 'returned';
  }
  s.like = leaf;
  return 'placed';
}

export function returnLeaf(s: DigState): boolean {
  if (s.done || !s.like) return false;
  s.like = null;
  return true;
}

export type CheckResult = 'early' | 'ignored' | 'empty' | 'right' | 'miss';

export function check(s: DigState): CheckResult {
  const step = stepOf(s);
  if (step === 'done') return 'ignored';
  if (step !== 'like') return 'early';
  if (!s.like) return 'empty';
  if (s.like === answer(caseOf(s.round.caseId))) {
    s.done = true;
    return 'right';
  }
  s.misses++;
  s.like = null;
  if (++s.wrong.like >= 2) help(s);
  return 'miss';
}

/** What a step's help points at: the stone's flag for Where, the matching reference for Like. */
export function glowTarget(round: Round, step: HelpStep): FlagId | LeafId {
  return step === 'where' ? whereAnswer(round) : answer(caseOf(round.caseId));
}

/** What glows now, if help has been shown on the current step. */
export function glowing(s: DigState): FlagId | LeafId | null {
  const step = stepOf(s);
  if ((step === 'where' || step === 'like') && s.helped[step]) return glowTarget(s.round, step);
  return null;
}

/* Layout ---------------------------------------------------------------------------------------- */

export const FLAG = 104;
export const CARD = 130;
export const BADGE_R = 50;
export const SLOT = 110;
export const CHECK_R = 52;
export const MAG_R = 140;
export const RECORD_W = 420;
export const RECORD_H = 200;
export const BOOK_W = 110;
export const BOOK_H = 80;

export interface Rect { x: number; y: number; w: number; h: number }

export interface DigLayout {
  portrait: boolean;
  /** The three dig squares. */
  squares: Rect[];
  /** Each square's flag, centred. */
  flags: Pt[];
  /** The stone's scale on screen; it sits at the centre of its square. */
  scale: number;
  cards: Pt[];
  badges: Pt[];
  record: Rect;
  whereSlot: Pt;
  likeSlot: Pt;
  check: Pt;
  /** The field notebook the record card slides into. */
  book: Rect;
  /** Where the magnifier opens for each site, kept off the stone. */
  magnifier: Pt[];
}

export const petCorner = (v: View): Rect => ({ x: 0, y: v.h - 205, w: 200, h: 205 });
export const shellButtons = (v: View): Rect[] => [{ x: 0, y: 0, w: 130, h: 130 }, { x: v.w - 130, y: 0, w: 130, h: 130 }];
export const stoneAt = (L: DigLayout, site: number): Pt => ({ x: L.squares[site].x + L.squares[site].w / 2, y: L.squares[site].y + L.squares[site].h / 2 });

/** Every rectangle of the screen. The level is accepted so a later level can rearrange; levels 1 and 2 share one plan. */
export function digLayout(v: View, _level: number): DigLayout {
  const portrait = v.h > v.w;
  const sqW = portrait ? 236 : 290, sqH = portrait ? 200 : 230, gap = portrait ? 10 : 16;
  const left = (v.w - (3 * sqW + 2 * gap)) / 2;
  const flagY = portrait ? 200 : 150;
  const top = flagY + FLAG / 2 + 10;
  const squares = [0, 1, 2].map((i) => ({ x: left + i * (sqW + gap), y: top, w: sqW, h: sqH }));
  const flags = squares.map((s) => ({ x: s.x + s.w / 2, y: flagY }));
  const scale = Math.min((sqW - 8) / STONE_W, (sqH - 14) / STONE_H);
  const right = v.w - 30;
  const record = portrait
    ? { x: right - RECORD_W, y: v.h - 40 - RECORD_H, w: RECORD_W, h: RECORD_H }
    : { x: right - RECORD_W, y: 500, w: RECORD_W, h: RECORD_H };
  const midY = record.y + RECORD_H / 2 + 10;
  const whereSlot = { x: record.x + 80, y: midY };
  const likeSlot = { x: record.x + 220, y: midY };
  const check = { x: record.x + RECORD_W - 70, y: midY };
  const cardY = portrait ? top + sqH + 40 + CARD / 2 : 570;
  const cardX = portrait ? [200, 360] : [Math.max(300, record.x - 290), Math.max(450, record.x - 140)];
  const cards = cardX.map((x) => ({ x, y: cardY }));
  const badges = cards.map((c) => ({ x: c.x, y: c.y + CARD / 2 + 10 + BADGE_R }));
  const book = { x: v.w - 140 - BOOK_W - 20, y: 10, w: BOOK_W, h: BOOK_H };
  const magnifier = portrait
    ? [0, 1, 2].map(() => ({ x: v.w - 30 - MAG_R, y: top + sqH + 20 + MAG_R }))
    : [0, 1, 2].map((site) => {
      const s = squares[site === 2 ? 0 : 2];
      return { x: s.x + s.w / 2, y: s.y + s.h / 2 + 5 };
    });
  return { portrait, squares, flags, scale, cards, badges, record, whereSlot, likeSlot, check, book, magnifier };
}
