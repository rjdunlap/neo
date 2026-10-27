/**
 * Timeline Trail's rules: three made-up island places, each a run of four stages from long ago to now; a round names a
 * place and the stages in play; a line is the cards already hung in stage order; a gap is a space before, between or
 * after them. A card has exactly one valid gap at levels 1–3 (where it sorts among the hung cards), and a wrong gap
 * answers with a reason about what the picture shows. Everything here is pure; the scene draws it.
 * Definition: docs/definitions/timeline-trail.md (levels 1–3 built; level 4, a clue inside, is T3).
 */
import type { Rng } from '../../engine/random';
import type { View } from '../../engine/view';

// ——— Places and stages ———

export type PlaceId = 'shore' | 'tree' | 'nest';
export const PLACE_IDS: readonly PlaceId[] = ['shore', 'tree', 'nest'];

export interface Stage {
  /** `<place>-<n>`; the voice line is `trail.card.<id>`. */
  id: string;
  /** What the picture shows, spoken and used in reasons. */
  caption: string;
  /** The element this stage has that the stage before it lacks (the first stage names what only it shows bare). */
  changes: string;
}

export interface Place {
  id: PlaceId;
  /** Spoken in "the life of one {place}". */
  name: string;
  /** Oldest first. */
  stages: readonly Stage[];
}

export const PLACES: Record<PlaceId, Place> = {
  shore: {
    id: 'shore',
    name: 'shore',
    stages: [
      { id: 'shore-0', caption: 'an empty shore with one rock', changes: 'bare sand and one rock' },
      { id: 'shore-1', caption: 'a little dock on the shore', changes: 'little dock' },
      { id: 'shore-2', caption: 'the dock with a boat shed', changes: 'boat shed' },
      { id: 'shore-3', caption: 'the dock with a boat and a lantern', changes: 'boat and lantern' },
    ],
  },
  tree: {
    id: 'tree',
    name: 'tree',
    stages: [
      { id: 'tree-0', caption: 'a sapling with two leaves', changes: 'tiny sapling' },
      { id: 'tree-1', caption: 'a young tree', changes: 'trunk and a small crown of leaves' },
      { id: 'tree-2', caption: 'a big tree', changes: 'big round crown' },
      { id: 'tree-3', caption: 'the big tree with a swing', changes: 'swing' },
    ],
  },
  nest: {
    id: 'nest',
    name: 'nest',
    stages: [
      { id: 'nest-0', caption: 'an egg in the nest', changes: 'egg' },
      { id: 'nest-1', caption: 'a hatchling in the nest', changes: 'hatchling' },
      { id: 'nest-2', caption: 'a young pet with a first scarf', changes: 'scarf' },
      { id: 'nest-3', caption: 'the pet now, at the treehouse door', changes: 'treehouse door' },
    ],
  },
};

// ——— Levels ———

export interface Plan {
  level: number;
  name: string;
  /** Stages in play. */
  cards: number;
  /** Cards hung before she starts (the pet hangs them). */
  hungAtStart: number;
}

export const PLANS: readonly Plan[] = [
  { level: 1, name: 'Long ago or now?', cards: 2, hungAtStart: 0 },
  { level: 2, name: 'Hang it between', cards: 3, hungAtStart: 2 },
  { level: 3, name: 'Grow the line', cards: 4, hungAtStart: 1 },
];

export function planFor(level: number): Plan {
  return PLANS[Math.max(0, Math.min(PLANS.length - 1, level - 1))];
}

// ——— Rounds ———

export interface Round {
  level: number;
  place: PlaceId;
  /** Stage indices in play, ascending. */
  cards: number[];
  /** Stage indices hung before she starts, ascending (level 3's first card; level 2's two ends or two neighbours). */
  hung: number[];
  /** Stage indices waiting in the tray, in their seeded tray order. */
  loose: number[];
}

/** Which place the next round shows: a shuffled bag, so every place turns up before any repeats. */
export class PlaceBag {
  private bag: PlaceId[] = [];
  constructor(private readonly rng: Rng) {}
  next(): PlaceId {
    if (!this.bag.length) this.bag = this.rng.shuffle([...PLACE_IDS]);
    return this.bag.pop()!;
  }
}

/**
 * A round: the place, the stages in play and which hang first. Level 1 shows two stages at least one stage apart, both
 * loose; level 2 drops one stage of the four, hangs two of the remaining three and leaves one loose (any of the three);
 * level 3 uses every stage, hangs the first, and the three others wait in a seeded order.
 */
export function roundFor(level: number, rng: Rng, place: PlaceId = new PlaceBag(rng).next()): Round {
  const plan = planFor(level);
  const n = PLACES[place].stages.length;
  if (plan.level === 1) {
    const pairs: [number, number][] = [];
    for (let a = 0; a < n; a++) for (let b = a + 2; b < n; b++) pairs.push([a, b]);
    const cards = rng.pick(pairs);
    return { level: plan.level, place, cards: [...cards], hung: [], loose: rng.shuffle([...cards]) };
  }
  if (plan.level === 2) {
    const dropped = rng.int(0, n - 1);
    const cards = Array.from({ length: n }, (_, i) => i).filter((i) => i !== dropped);
    const loose = rng.pick(cards);
    return { level: plan.level, place, cards, hung: cards.filter((c) => c !== loose), loose: [loose] };
  }
  const cards = Array.from({ length: n }, (_, i) => i);
  return { level: plan.level, place, cards, hung: [cards[0]], loose: rng.shuffle(cards.slice(1)) };
}

// ——— The line and its gaps ———

/** How many gaps the line offers: one more than the hung cards, or level 1's two posts. */
export function gapCount(round: Round, line: readonly number[]): number {
  if (round.level === 1) return 2;
  return line.length + 1;
}

/**
 * The gaps where a card's stage fits given the cards already hung: where it sorts among them, so exactly one at levels
 * 1–3. Level 1 offers the two posts, and the older card belongs on the left.
 */
export function validGaps(round: Round, line: readonly number[], stage: number): number[] {
  if (round.level === 1) return [stage === Math.min(...round.cards) ? 0 : 1];
  return [line.filter((s) => s < stage).length];
}

export type Placement = { ok: true; line: number[] } | { ok: false; reason: string; line: readonly number[] };

/**
 * Hang a card in a gap. The valid gap returns the new line; any other gap returns the line untouched and a reason
 * about what the picture shows, built from the hung neighbour the card is wrongly before or after.
 */
export function place(round: Round, line: readonly number[], stage: number, gap: number): Placement {
  const stages = PLACES[round.place].stages;
  const [valid] = validGaps(round, line, stage);
  if (gap === valid) {
    const next = [...line, stage].sort((a, b) => a - b);
    return { ok: true, line: next };
  }
  if (round.level === 1) {
    // The only wrong answer: the newer picture called "long ago" (or the older one hung at "now").
    const other = round.cards.find((c) => c !== stage)!;
    const reason = stage > other
      ? `This picture already has the ${stages[stage].changes}, so it comes after the ${stages[other].caption}.`
      : `This picture has no ${stages[other].changes} yet, so it comes before the ${stages[other].caption}.`;
    return { ok: false, reason, line };
  }
  if (gap < valid) {
    // Too early: the hung card just after the gap is older than this one.
    const after = line[gap];
    return { ok: false, line, reason: `This picture already has the ${stages[stage].changes}, so it comes after the ${stages[after].caption}.` };
  }
  // Too late: the hung card just before the gap is newer than this one.
  const before = line[gap - 1];
  return { ok: false, line, reason: `This picture has no ${stages[before].changes} yet, so it comes before the ${stages[before].caption}.` };
}

/** The loose card the ghost finger takes next: the oldest, so any line it builds is legal. */
export function nextCard(round: Round, loose: readonly number[]): number | null {
  if (!loose.length) return null;
  if (round.level === 1) return Math.min(...round.cards);
  return Math.min(...loose);
}

// ——— Misses and hints ———

/**
 * Keeps the round's accounting: a miss per distinct wrong drop (the same card in the same wrong gap again repeats the
 * reason and counts nothing), a glow on a card's valid gap after its second miss (one hint a card, at most), and
 * Show a hint for the card in hand (the same single hint).
 */
export class Tally {
  misses = 0;
  hints = 0;
  private wrong = new Map<number, number>();
  private last: { stage: number; gap: number } | null = null;
  private hinted = new Set<number>();
  /** The stage whose valid gap glows, or null. */
  glowing: number | null = null;

  /** A wrong drop of `stage` in `gap`: whether it counted, and whether the glow just lit. */
  missed(stage: number, gap: number): { counted: boolean; lit: boolean } {
    if (this.last && this.last.stage === stage && this.last.gap === gap) return { counted: false, lit: false };
    this.last = { stage, gap };
    this.misses++;
    const n = (this.wrong.get(stage) ?? 0) + 1;
    this.wrong.set(stage, n);
    if (n >= 2 && !this.hinted.has(stage)) return { counted: true, lit: this.help(stage) };
    return { counted: true, lit: false };
  }

  /** Light the card's valid gap, once per card; true when it lit now. */
  help(stage: number): boolean {
    if (this.hinted.has(stage)) { this.glowing = stage; return false; }
    this.hinted.add(stage);
    this.hints++;
    this.glowing = stage;
    return true;
  }

  /** The card was hung: its glow goes out and the last wrong drop no longer repeats. */
  hung(stage: number) {
    if (this.glowing === stage) this.glowing = null;
    this.last = null;
  }
}

// ——— Layout ———

export interface Rect { x: number; y: number; w: number; h: number }
export interface Pt { x: number; y: number }
export const centre = (r: Rect): Pt => ({ x: r.x + r.w / 2, y: r.y + r.h / 2 });

export const CARD = 150;
export const GAP_W = 110;
export const GAP_H = 150;
/** Between a card and a gap. */
const SPACE = 24;
/** Between the two rows when the line wraps. */
const ROW_SPACE = 36;
/** A post's own width, picture included. */
const POST_W = 112;
/** Where the posts start: below the home and help buttons in the top-left corner. */
const POST_Y = 150;
/** The post's small picture hangs this far below its top (its centre a further 48 down). */
export const POST_PICTURE_Y = 70;

export interface LineLayout {
  posts: { left: Rect; right: Rect };
  /** Each hung card's rectangle, in line order. */
  cards: Rect[];
  /** Each gap's rectangle, gap 0 first (the posts themselves while level 1's line is empty). */
  gaps: Rect[];
  /** The y of each row the line uses (one or two). */
  rows: number[];
  /** Loose cards' rectangles, tray order. */
  tray: Rect[];
  /** The flipbook frame. */
  frame: Rect;
}

/**
 * Posts at the edges, the line between them (wrapping into two rows when its cards and gaps do not fit one), the tray
 * below and the flipbook frame in the middle. Every target keeps full size; null when the view cannot hold them.
 */
export function lineLayout(round: Round, line: readonly number[], looseCount: number, v: View): LineLayout | null {
  const wide = v.w >= v.h;
  // Landscape: tall posts at the sides with the line between them. Portrait: shorter posts in the top corners, the line
  // below them across the width (two rows when it does not fit one), the tray at the bottom.
  // Level 1 hangs its cards on the posts themselves, so they stand a little further in to give a full card room.
  const px = round.level === 1 ? 40 : 16;
  // The posts start below the corner buttons; level 1's cards hang on the posts, so those stay tall in portrait too.
  const postH = wide || round.level === 1 ? 330 : 230;
  const posts = {
    left: { x: px, y: POST_Y, w: POST_W, h: postH },
    right: { x: v.w - px - POST_W, y: POST_Y, w: POST_W, h: postH },
  };
  const trayY = v.h - CARD - 28;
  const trayLeft = 176;
  const trayRight = v.w - 24;
  const trayN = Math.max(1, looseCount);
  const trayStep = Math.min(CARD + SPACE, (trayRight - trayLeft - CARD) / Math.max(1, trayN - 1) || 0);
  const trayStart = (trayLeft + trayRight) / 2 - (trayStep * (trayN - 1)) / 2 - CARD / 2;
  const tray = Array.from({ length: looseCount }, (_, i) => ({ x: trayStart + i * trayStep, y: trayY, w: CARD, h: CARD }));
  if (tray.length && (tray[0].x < trayLeft || tray[tray.length - 1].x + CARD > trayRight)) return null;

  const frameSize = wide ? 360 : 420;
  const frame = { x: (v.w - frameSize) / 2, y: (wide ? 100 : 180), w: frameSize, h: frameSize };

  const gapsN = gapCount(round, line);
  if (round.level === 1) {
    // The posts are the two gaps, and a hung card sits on its post.
    const pic = (p: Rect): Rect => ({ x: p.x + p.w / 2 - CARD / 2, y: p.y + p.h - GAP_H - 20, w: CARD, h: GAP_H });
    const gaps = [pic(posts.left), pic(posts.right)];
    return { posts, cards: line.map((_s, i) => gaps[i]), gaps, rows: [posts.left.y + posts.left.h - GAP_H / 2 - 20], tray, frame };
  }
  // Items in line order: gap, card, gap, card, …, gap.
  type Item = { kind: 'gap' | 'card'; index: number; w: number };
  const items: Item[] = [];
  for (let g = 0; g < gapsN; g++) {
    items.push({ kind: 'gap', index: g, w: GAP_W });
    if (g < line.length) items.push({ kind: 'card', index: g, w: CARD });
  }
  const width = (its: Item[]) => its.reduce((s, it) => s + it.w, 0) + SPACE * (its.length - 1);
  const left = wide ? posts.left.x + posts.left.w + 12 : 24;
  const right = wide ? posts.right.x - 12 : v.w - 24;
  const room = right - left;
  let rowsOf: Item[][];
  if (width(items) <= room) rowsOf = [items];
  else {
    // Break after a card so each row starts and ends usefully; the first row takes the larger half.
    const cardsHung = line.length;
    const firstCards = Math.ceil(cardsHung / 2);
    const cut = items.findIndex((it) => it.kind === 'card' && it.index === firstCards - 1) + 1;
    rowsOf = [items.slice(0, cut), items.slice(cut)];
  }
  if (rowsOf.some((r) => width(r) > room)) return null;
  const lineTop = wide ? posts.left.y + 40 : posts.left.y + posts.left.h + 20;
  const lineBottom = trayY - 30;
  const rowH = Math.max(CARD, GAP_H);
  const mid = (lineTop + lineBottom) / 2;
  const rows = rowsOf.length === 1
    ? [wide ? posts.left.y + posts.left.h - GAP_H / 2 - 20 : mid]
    : [mid - rowH / 2 - ROW_SPACE / 2, mid + rowH / 2 + ROW_SPACE / 2];
  if (rows[rows.length - 1] + rowH / 2 > lineBottom) return null;
  const cards: Rect[] = [];
  const gaps: Rect[] = [];
  rowsOf.forEach((its, r) => {
    let x = (left + right) / 2 - width(its) / 2;
    for (const it of its) {
      const h = it.kind === 'card' ? CARD : GAP_H;
      const rect = { x, y: rows[r] - h / 2, w: it.w, h };
      (it.kind === 'card' ? cards : gaps)[it.index] = rect;
      x += it.w + SPACE;
    }
  });
  return { posts, cards, gaps, rows, tray, frame };
}

export const overlaps = (a: Rect, b: Rect) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
