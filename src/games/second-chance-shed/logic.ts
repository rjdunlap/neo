import type { Rng } from '../../engine/random';
import { spread, type View } from '../../engine/view';

/** The four places on the island that give a used thing its next life, in the order they open. */
export const PLACES = ['worm', 'shelf', 'mend', 'remake'] as const;
export type Place = (typeof PLACES)[number];

/** The reason word for a thing's condition; each kind belongs to exactly one place. */
export type Kind = 'food' | 'whole' | 'broken' | 'squashed';
export const KIND_OF_PLACE: Record<Place, Kind> = { worm: 'food', shelf: 'whole', mend: 'broken', remake: 'squashed' };

/** What a place makes from the thing (the scene plays it; `made.<id>` is its spoken line). */
export type Consequence = 'sprout' | 'nap' | 'planter' | 'apples' | 'button' | 'roll' | 'flutter' | 'medal' | 'crayon' | 'bead';

export type ItemId = 'peel' | 'core' | 'carrot' | 'leaf' | 'box' | 'tub' | 'bag' | 'teddy' | 'cart' | 'kite' | 'can' | 'crayons' | 'caps';

export interface Item {
  id: ItemId;
  /** Spoken name, as in "the banana peel". */
  name: string;
  place: Place;
  kind: Kind;
  consequence: Consequence;
  paper: boolean;
}

/**
 * The item table, frozen in the definition and source-checked when the game was built (2026-10-24; see VERIFICATION.md).
 * These are the island's own rules: condition decides, so the box is always whole and goes on the shelf.
 */
export const ITEMS: Record<ItemId, Item> = {
  peel: { id: 'peel', name: 'banana peel', place: 'worm', kind: 'food', consequence: 'sprout', paper: false },
  core: { id: 'core', name: 'apple core', place: 'worm', kind: 'food', consequence: 'sprout', paper: false },
  carrot: { id: 'carrot', name: 'carrot top', place: 'worm', kind: 'food', consequence: 'sprout', paper: false },
  leaf: { id: 'leaf', name: 'dry leaf', place: 'worm', kind: 'food', consequence: 'sprout', paper: false },
  box: { id: 'box', name: 'sturdy box', place: 'shelf', kind: 'whole', consequence: 'nap', paper: false },
  tub: { id: 'tub', name: 'flowerpot tub', place: 'shelf', kind: 'whole', consequence: 'planter', paper: false },
  bag: { id: 'bag', name: 'cloth bag', place: 'shelf', kind: 'whole', consequence: 'apples', paper: false },
  teddy: { id: 'teddy', name: 'teddy with a loose button', place: 'mend', kind: 'broken', consequence: 'button', paper: false },
  cart: { id: 'cart', name: 'cart missing a wheel', place: 'mend', kind: 'broken', consequence: 'roll', paper: false },
  kite: { id: 'kite', name: 'kite with a torn tail', place: 'mend', kind: 'broken', consequence: 'flutter', paper: false },
  can: { id: 'can', name: 'squashed can', place: 'remake', kind: 'squashed', consequence: 'medal', paper: false },
  crayons: { id: 'crayons', name: 'crayon stubs', place: 'remake', kind: 'squashed', consequence: 'crayon', paper: false },
  caps: { id: 'caps', name: 'bottle caps', place: 'remake', kind: 'squashed', consequence: 'bead', paper: false },
};
export const ITEM_IDS = Object.keys(ITEMS) as ItemId[];

export interface Plan {
  level: number;
  name: string;
  open: Place[];
  count: number;
  /** Level 1 counts nothing: no misses, no hints and no glow. */
  counts: boolean;
}

export const PLANS: Plan[] = [
  { level: 1, name: 'Feed the worms', open: ['worm'], count: 3, counts: false },
  { level: 2, name: 'Two places', open: ['worm', 'shelf'], count: 4, counts: true },
  { level: 3, name: 'Mend it', open: ['worm', 'shelf', 'mend'], count: 5, counts: true },
  { level: 4, name: 'Remake', open: ['worm', 'shelf', 'mend', 'remake'], count: 6, counts: true },
];
export const MAX_LEVEL = PLANS.length;

export function planFor(level: number): Plan {
  return PLANS[Math.min(Math.max(1, Math.round(level)), MAX_LEVEL) - 1];
}

export interface Round {
  level: number;
  open: Place[];
  items: ItemId[];
}

/** Three of a place in a row only when one place is open (level 1 is all worm food). */
function tripled(items: ItemId[]): boolean {
  for (let i = 2; i < items.length; i++) {
    const p = ITEMS[items[i]].place;
    if (p === ITEMS[items[i - 1]].place && p === ITEMS[items[i - 2]].place) return true;
  }
  return false;
}

/** The level's ordered items: one of each open place first, filled from the reviewed table, never paper, never a repeat. */
export function roundFor(level: number, rng: Rng): Round {
  const plan = planFor(level);
  const pool = (p: Place) => ITEM_IDS.filter((id) => ITEMS[id].place === p && !ITEMS[id].paper);
  const chosen: ItemId[] = plan.open.map((p) => rng.pick(pool(p)));
  const rest = rng.shuffle(plan.open.flatMap(pool).filter((id) => !chosen.includes(id)));
  chosen.push(...rest.slice(0, plan.count - chosen.length));
  let items = rng.shuffle([...chosen]);
  for (let tries = 0; plan.open.length > 1 && tripled(items) && tries < 50; tries++) items = rng.shuffle([...chosen]);
  if (plan.open.length > 1 && tripled(items)) {
    // Interleave by place as a last resort, so the rule always holds.
    const byPlace = plan.open.map((p) => items.filter((id) => ITEMS[id].place === p));
    items = [];
    while (byPlace.some((b) => b.length)) for (const b of byPlace) if (b.length) items.push(b.shift()!);
  }
  return { level: plan.level, open: [...plan.open], items };
}

export interface Rect { x: number; y: number; w: number; h: number }

export interface ShedLayout {
  cart: Rect;
  /** Where the arriving item rests on the cart. */
  item: Rect;
  places: Partial<Record<Place, Rect>>;
}

export const PLACE_W = 180;
export const PLACE_H = 200;
export const ITEM_SIZE = 150;
export const GAP = 24;
/** The pet's corner, bottom-left, and the home button, top-left. */
export const PET_CORNER = { w: 160, h: 170 };
export const HOME_CORNER = { w: 110, h: 110 };
/** How far beyond its drawing a place still takes a drop. */
export const DROP_PAD = 30;

/** Every rectangle of the shed yard: places along the bottom (two rows of two in portrait at three or four), the cart top-centre. */
export function shedLayout(view: View, open: readonly Place[]): ShedLayout {
  const { w, h } = view;
  const cart: Rect = { x: w / 2 - 120, y: 100, w: 240, h: 210 };
  const item: Rect = { x: w / 2 - ITEM_SIZE / 2, y: 112, w: ITEM_SIZE, h: ITEM_SIZE };
  const lo = PET_CORNER.w + 10;
  const hi = w - 20;
  const bottom = h - 20 - PLACE_H;
  const rows: Place[][] = h > w && open.length > 2 ? [open.slice(0, 2), open.slice(2)] : [[...open]];
  const places: Partial<Record<Place, Rect>> = {};
  rows.forEach((row, r) => {
    const y = bottom - (rows.length - 1 - r) * (PLACE_H + GAP * 2);
    const xs = spread(row.length, lo, hi, PLACE_W + 40);
    row.forEach((p, i) => (places[p] = { x: xs[i] - PLACE_W / 2, y, w: PLACE_W, h: PLACE_H }));
  });
  return { cart, item, places };
}

export const centre = (r: Rect) => ({ x: r.x + r.w / 2, y: r.y + r.h / 2 });

/** The open place an item let go at (x, y) lands in: the nearest whose padded area holds the point, or null for the empty yard. */
export function placeAt(layout: ShedLayout, x: number, y: number): Place | null {
  let best: Place | null = null;
  let bestD = Infinity;
  for (const [p, r] of Object.entries(layout.places) as [Place, Rect][]) {
    if (x < r.x - DROP_PAD || x > r.x + r.w + DROP_PAD || y < r.y - DROP_PAD || y > r.y + r.h + DROP_PAD) continue;
    const c = centre(r);
    const d = (c.x - x) ** 2 + (c.y - y) ** 2;
    if (d < bestD) { bestD = d; best = p; }
  }
  return best;
}

export type Verdict = 'right' | 'wrong' | 'none';

export function judge(item: ItemId, at: Place | null): Verdict {
  if (at === null) return 'none';
  return ITEMS[item].place === at ? 'right' : 'wrong';
}

/** Two wrong drops on the same item and its place glows. */
export const GLOW_AFTER = 2;

/**
 * The round's accounting, one item at a time. A wrong drop is a miss (never at level 1); two on the same item glow its
 * place and count one hint. Show a hint glows and counts once per item; asked again it carries the item, adding nothing.
 */
export class ShedTally {
  misses = 0;
  hints = 0;
  glowing = false;
  private wrongs = 0;
  private asks = 0;
  private item = 0;
  /** Round positions whose help has been counted, so Start again never counts the same item's hint twice. */
  private readonly hinted = new Set<number>();

  constructor(readonly counts: boolean) {}

  /** The item at round position `index` arrives (the next one by default): its glow and asks start fresh. */
  nextItem(index = this.item + 1) {
    this.item = index;
    this.wrongs = 0;
    this.asks = 0;
    this.glowing = false;
  }

  private hint() {
    this.glowing = true;
    if (this.counts && !this.hinted.has(this.item)) { this.hinted.add(this.item); this.hints++; }
  }

  drop(v: Verdict) {
    if (v !== 'wrong' || !this.counts) return;
    this.misses++;
    if (++this.wrongs >= GLOW_AFTER) this.hint();
  }

  /** The pause sheet's Show a hint: 'glow' the first time for an item, then 'carry' (Show me one); level 1 only glows. */
  ask(): 'glow' | 'carry' {
    this.asks++;
    if (!this.counts || this.asks === 1) { this.hint(); return 'glow'; }
    return 'carry';
  }
}

/** The ghost finger's next move: carry the current item to its own place. */
export function nextDrop(round: Round, index: number): { item: ItemId; place: Place } | null {
  const item = round.items[index];
  return item ? { item, place: ITEMS[item].place } : null;
}
