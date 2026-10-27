// Moon Window's rules: eight stops of one lit-fraction cycle, the views a round shows, two-card boards and the layout.
// Levels 1–3 claim nothing about why the Moon changes: they show views drawn from the model and ask her to look, match
// and compare how much of the Moon is lit. Definition: docs/definitions/moon-window.md.
import type { Rng } from '../../engine/random';
import type { View } from '../../engine/view';

/** Eight samples of one smooth cycle, `k = 0..7`, about 3.7 days apart; not eight named phases and not eight nights. */
export const STOPS = 8;
/** The Moon's angle from the Sun direction at stop `k`. */
const theta = (k: number) => (k * Math.PI) / 4;
/** How much of the Moon's face is lit at stop `k`: 0 at k 0, half at k 2 and 6, all at k 4. */
export const lit = (k: number) => (1 - Math.cos(theta(k))) / 2;
/** The next view, some days later; time only moves forward and wraps around. */
export const later = (k: number) => (k + 1) % STOPS;

/** The five amounts the game names; the words are fixed and never a phase name. */
export type Amount = 'none' | 'slice' | 'half' | 'most' | 'full';
export const AMOUNT_WORDS: Record<Amount, string> = { none: 'no light', slice: 'a little light', half: 'half', most: 'most', full: 'all' };
export function amountOf(k: number): Amount {
  const f = lit(k);
  return f < 0.01 ? 'none' : f < 0.3 ? 'slice' : f < 0.7 ? 'half' : f < 0.99 ? 'most' : 'full';
}
/** The spoken line for a view. */
export const viewLine = (k: number) => `moonwindow.view.${amountOf(k)}` as const;

export interface Point {
  x: number;
  y: number;
}

/**
 * The lit region of a Moon of radius `r` at stop `k`, as a closed polygon around (0, 0): the half disk on the lit side
 * joined to half an ellipse whose horizontal semi-axis is `r × |cos theta|` (the projected terminator of a lit sphere,
 * never a straight pie wedge). The lit side is the right for k 1–3 and the left for k 5–7, one fixed convention.
 * Empty at k 0; the whole disk at k 4.
 */
export function moonShape(k: number, r: number, steps = 48): Point[] {
  const c = Math.cos(theta(k));
  if (lit(k) < 1e-9) return [];
  if (lit(k) > 1 - 1e-9) return Array.from({ length: steps * 2 }, (_, i) => ({ x: r * Math.cos((i / (steps * 2)) * Math.PI * 2), y: r * Math.sin((i / (steps * 2)) * Math.PI * 2) }));
  const side = k < 4 ? 1 : -1;
  // A crescent's terminator bulges toward the lit side; a mostly lit Moon's bulges into the dark side.
  const bulge = c > 0 ? side : -side;
  const a = r * Math.abs(c);
  const pts: Point[] = [];
  // Down the outer edge on the lit side, from the top to the bottom.
  for (let i = 0; i <= steps; i++) {
    const phi = (i / steps) * Math.PI;
    pts.push({ x: side * r * Math.sin(phi), y: -r * Math.cos(phi) });
  }
  // Back up along the terminator ellipse, from the bottom to the top.
  for (let i = 1; i < steps; i++) {
    const phi = (i / steps) * Math.PI;
    pts.push({ x: bulge * a * Math.sin(phi), y: r * Math.cos(phi) });
  }
  return pts;
}

/** The signed area of a closed polygon, for the tests (shoelace). */
export function polygonArea(pts: Point[]): number {
  let s = 0;
  for (let i = 0; i < pts.length; i++) {
    const p = pts[i];
    const q = pts[(i + 1) % pts.length];
    s += p.x * q.y - q.x * p.y;
  }
  return Math.abs(s) / 2;
}

// Levels ---------------------------------------------------------------------------------------------

export type Mode = 'look' | 'same' | 'compare';
export interface Plan {
  level: number;
  mode: Mode;
  name: string;
  description: string;
}
export const PLANS: readonly Plan[] = [
  { level: 1, mode: 'look', name: 'Look again', description: 'Look again: press Later three times and watch the Moon change' },
  { level: 2, mode: 'same', name: 'Same view', description: 'Same view: tap the card that matches the Moon in the window, two boards' },
  { level: 3, mode: 'compare', name: 'More light', description: 'More light: tap the Moon that shows more, or less, light; three comparisons' },
];
export const moonPlan = (level: number): Plan => PLANS[Math.min(Math.max(level, 1), PLANS.length) - 1];

/** Level 1: a start stop and three Later presses, four views in model order. */
export const LOOK_PRESSES = 3;
export function lookViews(start: number): number[] {
  return Array.from({ length: LOOK_PRESSES + 1 }, (_, i) => (start + i) % STOPS);
}
/** The authored first round opens on a thin slice: 1 → 2 → 3 → 4 (slice, half, most, full). */
export const AUTHORED_LOOK = 1;
export function lookStart(rng: Rng, authored: boolean): number {
  if (authored) return AUTHORED_LOOK;
  // Any stop works: at most one view in a round is the unseen new Moon, so the first two views are never both empty.
  return rng.int(0, STOPS - 1);
}

/** Two cards differ in how much is lit by at least this, so a board is never a mirrored twin or mostly lit against full. */
export const MIN_DIFFERENCE = 0.3;
export const differsEnough = (a: number, b: number) => Math.abs(lit(a) - lit(b)) >= MIN_DIFFERENCE - 1e-9;
/** The stops a card may show: every stop with some Moon to see. */
export const CARD_STOPS = [1, 2, 3, 4, 5, 6, 7] as const;

/** One two-card board: a target to match (level 2) or a request to compare (level 3), and which card answers it. */
export interface Board {
  cards: [number, number];
  answer: 0 | 1;
  /** Level 2: the stop in the window. */
  target?: number;
  /** Level 3: which Moon is wanted. */
  ask?: 'more' | 'less';
}

const partner = (rng: Rng, t: number) => rng.pick(CARD_STOPS.filter((d) => d !== t && differsEnough(t, d)));

/** Level 2: two boards with different targets; each pairs the target with a stop that differs enough in lit amount. */
export const AUTHORED_SAME: Board[] = [
  { cards: [1, 2], answer: 1, target: 2 },
  { cards: [4, 1], answer: 0, target: 4 },
];
export function sameBoards(rng: Rng, authored: boolean): Board[] {
  if (authored) return AUTHORED_SAME.map((b) => ({ ...b, cards: [...b.cards] as [number, number] }));
  const first = rng.pick(CARD_STOPS);
  const second = rng.pick(CARD_STOPS.filter((t) => t !== first));
  return [first, second].map((target) => {
    const other = partner(rng, target);
    const answer = rng.int(0, 1) as 0 | 1;
    const cards: [number, number] = answer === 0 ? [target, other] : [other, target];
    return { cards, answer, target };
  });
}

/** Which of two Moons answers a request: the larger lit amount for `more`, the smaller for `less`; unique because they differ enough. */
export function compareAnswer(cards: [number, number], ask: 'more' | 'less'): 0 | 1 {
  const more = lit(cards[0]) >= lit(cards[1]) ? 0 : 1;
  return ask === 'more' ? more : ((1 - more) as 0 | 1);
}

/** Level 3: three comparisons, at least one of each request, the answer's side not the same all three times. */
export const AUTHORED_COMPARE: Board[] = [
  { cards: [4, 1], answer: 0, ask: 'more' },
  { cards: [3, 2], answer: 1, ask: 'less' },
];
export const COMPARISONS = 3;
export function compareBoards(rng: Rng, authored: boolean): Board[] {
  const boards: Board[] = authored ? AUTHORED_COMPARE.map((b) => ({ ...b, cards: [...b.cards] as [number, number] })) : [];
  while (boards.length < COMPARISONS) {
    const a = rng.pick(CARD_STOPS);
    const b = partner(rng, a);
    const ask: 'more' | 'less' = rng.chance(0.5) ? 'more' : 'less';
    const cards: [number, number] = [a, b];
    boards.push({ cards, ask, answer: compareAnswer(cards, ask) });
  }
  // Both requests present: the last board flips if every ask is the same.
  if (boards.every((b) => b.ask === boards[0].ask)) {
    const last = boards[COMPARISONS - 1];
    last.ask = last.ask === 'more' ? 'less' : 'more';
    last.answer = compareAnswer(last.cards, last.ask);
  }
  // The answer is not always on the same side: the last board swaps its Moons if it is.
  if (boards.every((b) => b.answer === boards[0].answer)) {
    const last = boards[COMPARISONS - 1];
    last.cards = [last.cards[1], last.cards[0]];
    last.answer = compareAnswer(last.cards, last.ask!);
  }
  return boards;
}

// A round of boards and its accounting -----------------------------------------------------------------

export type TapResult = 'right' | 'wrong' | 'ignore';

/**
 * Levels 2–3: the boards in play with their misses and hints. A miss is a tap on the wrong card, once per board; after
 * it the right card glows, which counts no hint, because nothing is left to choose. Show a hint before any tap on a
 * board glows the right card and counts one hint, once per board.
 */
export class CardRound {
  index = 0;
  misses = 0;
  hints = 0;
  /** The wrong card has been tapped on the board in play. */
  missed = false;
  /** Show a hint was used on the board in play. */
  hinted = false;

  constructor(readonly boards: Board[]) {}

  get board(): Board {
    return this.boards[this.index];
  }
  get finished() {
    return this.index >= this.boards.length;
  }
  /** The right card glows: after a miss, or when a hint was asked for. */
  get glowing() {
    return !this.finished && (this.missed || this.hinted);
  }

  /** A tap on card `pick`; a right answer moves to the next board. */
  tap(pick: 0 | 1): TapResult {
    if (this.finished) return 'ignore';
    if (pick === this.board.answer) {
      this.index++;
      this.missed = this.hinted = false;
      return 'right';
    }
    if (this.missed) return 'ignore';
    this.missed = true;
    this.misses++;
    return 'wrong';
  }

  /** Show a hint from the pause sheet: counts once per board, and nothing once the glow is already on. */
  ask() {
    if (this.finished || this.glowing) return;
    this.hinted = true;
    this.hints++;
  }

  /** The card to tap: the right one. */
  hintFor(): 0 | 1 {
    return this.board.answer;
  }

  /** Start again: back to the first board; counts stay. */
  restart() {
    this.index = 0;
    this.missed = this.hinted = false;
  }
}

// Layout ---------------------------------------------------------------------------------------------

export interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}
export interface WindowLayout {
  /** The round window's bounding box; its Moon sits at the center at `moonR`. */
  window: Box;
  moonR: number;
  /** Level 1's big Later button. */
  later: Box;
  /** Levels 2–3's two cards and the Moon radius inside them (the window's at level 3, smaller at level 2). */
  cards: [Box, Box];
  cardMoonR: number;
  /** Level 3's request card above the cards. */
  request: Box;
  /** Level 1's replay ribbon: one slot per view, in order. */
  ribbon: Box[];
}

/** The guide's bottom-left corner and the corner buttons, kept clear. */
export const PET = { w: 230, h: 230 };
export const CORNER = 120;
const WINDOW = 340;
const MOON_R = 90;
const LATER = 160;
const CARD = 220;
const RIBBON = 120;
const RIBBON_GAP = 15;

/** Where everything goes for a view; null if it cannot fit without shrinking (the test fails rather than the layout). */
export function windowLayout(view: View, level: number): WindowLayout | null {
  const portrait = view.h > view.w;
  const cardMoonR = level >= 3 ? MOON_R : 70;
  const ribbonY = view.h - 10 - RIBBON;
  const ribbon = Array.from({ length: LOOK_PRESSES + 1 }, (_, i) => ({ x: PET.w + 20 + i * (RIBBON + RIBBON_GAP), y: ribbonY, w: RIBBON, h: RIBBON }));
  let L: WindowLayout;
  if (portrait) {
    const cx = view.w / 2;
    const window = { x: cx - WINDOW / 2, y: CORNER - 60, w: WINDOW, h: WINDOW };
    const cardY = window.y + WINDOW + 190;
    L = {
      window,
      moonR: MOON_R,
      later: { x: cx - LATER / 2, y: window.y + WINDOW + 80, w: LATER, h: LATER },
      cards: [{ x: cx - CARD - 40, y: cardY, w: CARD, h: CARD }, { x: cx + 40, y: cardY, w: CARD, h: CARD }],
      cardMoonR,
      request: { x: cx - 100, y: window.y + WINDOW + 30, w: 200, h: 130 },
      ribbon,
    };
  } else {
    const cy = 330;
    const window = { x: 60, y: cy - WINDOW / 2, w: WINDOW, h: WINDOW };
    const left = window.x + WINDOW + 70;
    L = {
      window,
      moonR: MOON_R,
      later: { x: left, y: cy - LATER / 2, w: LATER, h: LATER },
      cards: [{ x: left, y: cy - CARD / 2, w: CARD, h: CARD }, { x: left + CARD + 30, y: cy - CARD / 2, w: CARD, h: CARD }],
      cardMoonR,
      request: { x: left + CARD + 15 - 100, y: cy - CARD / 2 - 160, w: 200, h: 130 },
      ribbon,
    };
  }
  const boxes = shownBoxes(L, level);
  const clear = [petCorner(view), { x: 0, y: 0, w: CORNER, h: CORNER }, { x: view.w - CORNER, y: 0, w: CORNER, h: CORNER }];
  for (const b of boxes) {
    if (!inside(b, view)) return null;
    if (clear.some((c) => overlaps(b, c))) return null;
  }
  for (let i = 0; i < boxes.length; i++) for (let j = i + 1; j < boxes.length; j++) if (overlaps(boxes[i], boxes[j])) return null;
  return L;
}

/** The controls a level shows: the window and Later button with the ribbon (1), the cards (2), the cards and the request (3). */
export function shownBoxes(L: WindowLayout, level: number): Box[] {
  const mode = moonPlan(level).mode;
  if (mode === 'look') return [L.window, L.later, ...L.ribbon];
  if (mode === 'same') return [L.window, ...L.cards];
  return [L.window, ...L.cards, L.request];
}

export const overlaps = (a: Box, b: Box) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
export const inside = (b: Box, view: View) => b.x >= 0 && b.y >= 0 && b.x + b.w <= view.w && b.y + b.h <= view.h;
export const petCorner = (view: View): Box => ({ x: 0, y: view.h - PET.h, w: PET.w, h: PET.h });
export const center = (b: Box) => ({ x: b.x + b.w / 2, y: b.y + b.h / 2 });
