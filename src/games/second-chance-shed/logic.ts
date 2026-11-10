import type { Rng } from '../../engine/random';
import { spread, type View } from '../../engine/view';
import type { BandLevels } from '../../progress/difficulty';

/** The four places on the island that give a used thing its next life, in the order they open. */
export const PLACES = ['worm', 'shelf', 'mend', 'remake'] as const;
export type Place = (typeof PLACES)[number];

/** The reason word for a thing's condition; each kind belongs to exactly one place. */
export type Kind = 'food' | 'whole' | 'broken' | 'squashed';
export const KIND_OF_PLACE: Record<Place, Kind> = {
  worm: 'food',
  shelf: 'whole',
  mend: 'broken',
  remake: 'squashed',
};

/** What a place makes from the thing (the scene plays it; `made.<id>` is its spoken line). */
export type Consequence =
  | 'sprout'
  | 'nap'
  | 'planter'
  | 'apples'
  | 'button'
  | 'roll'
  | 'flutter'
  | 'medal'
  | 'crayon'
  | 'bead'
  | 'buttons';

export type ItemId =
  | 'peel'
  | 'core'
  | 'carrot'
  | 'leaf'
  | 'box'
  | 'tub'
  | 'bag'
  | 'teddy'
  | 'cart'
  | 'kite'
  | 'can'
  | 'crayons'
  | 'caps'
  | 'tin';

/** What a friend asks for at levels 5–6, shown in a picture bubble. */
export const REQUESTS = ['pencils', 'bed', 'seedling'] as const;
export type RequestId = (typeof REQUESTS)[number];

export interface Item {
  id: ItemId;
  /** Spoken name, as in "the banana peel". */
  name: string;
  place: Place;
  kind: Kind;
  consequence: Consequence;
  paper: boolean;
  /** The first level that may draw it (the tin is a level 5 thing); every other item is drawn from level 1. */
  from?: number;
  /** Another place that also takes it (the tin is metal, so the Remake machine would take it too). */
  also?: Place[];
  /** The friends' requests it fits (levels 5–6); only whole things fit anything. */
  fits: RequestId[];
}

/**
 * The item table, frozen in the definition and source-checked when the game was built (2026-10-24; see VERIFICATION.md).
 * These are the island's own rules: condition decides, so the box is always whole and goes on the shelf.
 */
export const ITEMS: Record<ItemId, Item> = {
  peel: {
    id: 'peel',
    name: 'banana peel',
    place: 'worm',
    kind: 'food',
    consequence: 'sprout',
    paper: false,
    fits: [],
  },
  core: {
    id: 'core',
    name: 'apple core',
    place: 'worm',
    kind: 'food',
    consequence: 'sprout',
    paper: false,
    fits: [],
  },
  carrot: {
    id: 'carrot',
    name: 'carrot top',
    place: 'worm',
    kind: 'food',
    consequence: 'sprout',
    paper: false,
    fits: [],
  },
  leaf: {
    id: 'leaf',
    name: 'dry leaf',
    place: 'worm',
    kind: 'food',
    consequence: 'sprout',
    paper: false,
    fits: [],
  },
  box: {
    id: 'box',
    name: 'sturdy box',
    place: 'shelf',
    kind: 'whole',
    consequence: 'nap',
    paper: false,
    fits: ['pencils', 'bed'],
  },
  tub: {
    id: 'tub',
    name: 'flowerpot tub',
    place: 'shelf',
    kind: 'whole',
    consequence: 'planter',
    paper: false,
    fits: ['pencils', 'seedling'],
  },
  bag: {
    id: 'bag',
    name: 'cloth bag',
    place: 'shelf',
    kind: 'whole',
    consequence: 'apples',
    paper: false,
    fits: [],
  },
  teddy: {
    id: 'teddy',
    name: 'teddy with a loose button',
    place: 'mend',
    kind: 'broken',
    consequence: 'button',
    paper: false,
    fits: [],
  },
  cart: {
    id: 'cart',
    name: 'cart missing a wheel',
    place: 'mend',
    kind: 'broken',
    consequence: 'roll',
    paper: false,
    fits: [],
  },
  kite: {
    id: 'kite',
    name: 'kite with a torn tail',
    place: 'mend',
    kind: 'broken',
    consequence: 'flutter',
    paper: false,
    fits: [],
  },
  can: {
    id: 'can',
    name: 'squashed can',
    place: 'remake',
    kind: 'squashed',
    consequence: 'medal',
    paper: false,
    fits: [],
  },
  crayons: {
    id: 'crayons',
    name: 'crayon stubs',
    place: 'remake',
    kind: 'squashed',
    consequence: 'crayon',
    paper: false,
    fits: [],
  },
  caps: {
    id: 'caps',
    name: 'bottle caps',
    place: 'remake',
    kind: 'squashed',
    consequence: 'bead',
    paper: false,
    fits: [],
  },
  // Source-checked 2026-10-31 for levels 5–6 (see VERIFICATION.md): a whole lidded tin is reused, and a metal tin is also remade.
  tin: {
    id: 'tin',
    name: 'tin with a lid',
    place: 'shelf',
    kind: 'whole',
    consequence: 'buttons',
    paper: false,
    from: 5,
    also: ['remake'],
    fits: ['pencils'],
  },
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
  { level: 5, name: 'Someone needs it', open: ['worm', 'shelf', 'mend', 'remake'], count: 5, counts: true },
  { level: 6, name: 'Two friends', open: ['worm', 'shelf', 'mend', 'remake'], count: 5, counts: true },
  // Levels 7–8 plan cups across picnics (PicnicShed); no thing comes off the cart, so `open` and `count` are unused.
  { level: 7, name: 'Picnic Loop', open: [], count: 0, counts: true },
  { level: 8, name: 'Three picnics', open: [], count: 0, counts: true },
];

export const LEVELS: BandLevels = {
  toddler: { min: 1, max: 2 },
  preschool: { min: 2, max: 3 },
  prek: { min: 3, max: 4 },
  school: { min: 4, max: 8 },
};
/** The last level that brings one thing at a time; above it the cart is laid out and planned (levels 5–6). */
export const SORT_MAX = 4;
/** The last level that plans things once; above it the cups are planned across picnics (levels 7–8). */
export const PLAN_MAX = 6;
export const MAX_LEVEL = PLANS.length;

export function planFor(level: number): Plan {
  return PLANS[Math.min(Math.max(1, Math.round(level)), MAX_LEVEL) - 1];
}

export interface Round {
  level: number;
  open: Place[];
  items: ItemId[];
  /** The friends in screen order, left to right (levels 5–6; empty below). */
  requests: RequestId[];
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
  if (plan.level > PLAN_MAX) throw new Error(`level ${plan.level} is a picnic day: use picnicDayFor`);
  if (plan.level > SORT_MAX) return planRoundFor(plan.level, rng);
  const pool = (p: Place) =>
    ITEM_IDS.filter((id) => ITEMS[id].place === p && !ITEMS[id].paper && (ITEMS[id].from ?? 1) <= plan.level);
  const chosen: ItemId[] = plan.open.map((p) => rng.pick(pool(p)));
  const rest = rng.shuffle(plan.open.flatMap(pool).filter((id) => !chosen.includes(id)));
  chosen.push(...rest.slice(0, plan.count - chosen.length));
  let items = rng.shuffle([...chosen]);
  for (let tries = 0; plan.open.length > 1 && tripled(items) && tries < 50; tries++)
    items = rng.shuffle([...chosen]);
  if (plan.open.length > 1 && tripled(items)) {
    // Interleave by place as a last resort, so the rule always holds.
    const byPlace = plan.open.map((p) => items.filter((id) => ITEMS[id].place === p));
    items = [];
    while (byPlace.some((b) => b.length)) for (const b of byPlace) if (b.length) items.push(b.shift()!);
  }
  return { level: plan.level, open: [...plan.open], items, requests: [] };
}

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

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
    if (x < r.x - DROP_PAD || x > r.x + r.w + DROP_PAD || y < r.y - DROP_PAD || y > r.y + r.h + DROP_PAD)
      continue;
    const c = centre(r);
    const d = (c.x - x) ** 2 + (c.y - y) ** 2;
    if (d < bestD) {
      bestD = d;
      best = p;
    }
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
    if (this.counts && !this.hinted.has(this.item)) {
      this.hinted.add(this.item);
      this.hints++;
    }
  }

  drop(v: Verdict) {
    if (v !== 'wrong' || !this.counts) return;
    this.misses++;
    if (++this.wrongs >= GLOW_AFTER) this.hint();
  }

  /** The pause sheet's Show a hint: 'glow' the first time for an item, then 'carry' (Show me one); level 1 only glows. */
  ask(): 'glow' | 'carry' {
    this.asks++;
    if (!this.counts || this.asks === 1) {
      this.hint();
      return 'glow';
    }
    return 'carry';
  }
}

/** The ghost finger's next move: carry the current item to its own place. */
export function nextDrop(round: Round, index: number): { item: ItemId; place: Place } | null {
  const item = round.items[index];
  return item ? { item, place: ITEMS[item].place } : null;
}

// ---- levels 5–6: the laid-out cart, friends and the bell ----

/** Where a thing sits in her plan: still on the cart, in a place, or with friend 0 or 1 (screen order). */
export type Spot = 'cart' | Place | 'f0' | 'f1';
export const friendSpot = (i: number): Spot => (i === 0 ? 'f0' : 'f1');
export const friendOf = (s: Spot): number | null => (s === 'f0' ? 0 : s === 'f1' ? 1 : null);
/** One spot per thing, in the cart's left-to-right order. */
export type PlanMap = Spot[];

/** Level 6's two authored cases: the both-fit candidate and the friend only it can help. */
export const CASES = [
  { both: 'box', other: 'bed' },
  { both: 'tub', other: 'seedling' },
] as const satisfies readonly { both: ItemId; other: RequestId }[];

/** Things that fit no request, by kind (the bag is the one whole thing that fits nothing). */
const fillers = (kind: Kind) =>
  ITEM_IDS.filter(
    (id) => ITEMS[id].kind === kind && ITEMS[id].fits.length === 0 && !ITEMS[id].paper && !ITEMS[id].from,
  );

/**
 * Level 5: the tin, the bag and one each of food, broken and squashed; one friend needs pencils standing.
 * Level 6: a case's both-fit candidate before the tin, three of food, broken, squashed and the bag, and two friends.
 */
export function planRoundFor(level: number, rng: Rng): Round {
  const open = [...PLACES];
  if (level <= 5) {
    const items = rng.shuffle<ItemId>([
      'tin',
      'bag',
      ...(['food', 'broken', 'squashed'] as const).map((k) => rng.pick(fillers(k))),
    ]);
    return { level: 5, open, items, requests: ['pencils'] };
  }
  const c = rng.pick(CASES);
  const kinds = rng.shuffle<Kind | 'bag'>(['food', 'broken', 'squashed', 'bag']).slice(0, 3);
  const rest = kinds.map((k): ItemId =>
    k === 'bag' ? 'bag' : rng.pick(fillers(k).filter((id) => id !== 'bag')),
  );
  const items = rng.shuffle<ItemId>([c.both, 'tin', ...rest]);
  const b = items.indexOf(c.both),
    t = items.indexOf('tin');
  if (b > t) [items[b], items[t]] = [items[t], items[b]];
  // The pencils friend stands first in about two rounds of three, where taking the first fitting thing fails.
  const requests: RequestId[] = rng.chance(2 / 3) ? ['pencils', c.other] : [c.other, 'pencils'];
  return { level: 6, open, items, requests };
}

/** Does this spot take this thing? A place takes its own things and its `also`; a friend takes a thing that fits. */
export function accepts(round: Round, id: ItemId, at: Spot): boolean {
  if (at === 'cart') return false;
  const f = friendOf(at);
  if (f !== null) return f < round.requests.length && ITEMS[id].fits.includes(round.requests[f]);
  return ITEMS[id].place === at || (ITEMS[id].also ?? []).includes(at as Place);
}

/** What a place makes from a thing: its own consequence, or the Remake machine's medal for the metal tin. */
export function madeAt(id: ItemId, place: Place): Consequence {
  return ITEMS[id].place === place ? ITEMS[id].consequence : 'medal';
}

export type PlanCheck =
  | { kind: 'ok' }
  | { kind: 'onCart'; indices: number[] }
  | { kind: 'misplaced'; index: number; at: Spot }
  | { kind: 'unmet'; friend: number };

/** The first unmet condition of a plan: something on the cart, then a thing where it does not belong, then an empty friend. */
export function checkPlan(round: Round, plan: PlanMap): PlanCheck {
  const onCart = plan.flatMap((s, i) => (s === 'cart' ? [i] : []));
  if (onCart.length) return { kind: 'onCart', indices: onCart };
  for (let i = 0; i < plan.length; i++)
    if (!accepts(round, round.items[i], plan[i])) return { kind: 'misplaced', index: i, at: plan[i] };
  for (let f = 0; f < round.requests.length; f++)
    if (!plan.includes(friendSpot(f))) return { kind: 'unmet', friend: f };
  return { kind: 'ok' };
}

/** Move one thing; a friend holds one thing, so the one already there goes back to the cart (free). */
export function moveTo(plan: PlanMap, index: number, at: Spot): PlanMap {
  const next = plan.slice();
  if (friendOf(at) !== null)
    next.forEach((s, i) => {
      if (s === at && i !== index) next[i] = 'cart';
    });
  next[index] = at;
  return next;
}

/** Every accepted plan: each thing where it is accepted, every friend holding exactly one thing that fits. */
export function solutions(round: Round): PlanMap[] {
  const out: PlanMap[] = [];
  const spots: Spot[] = [...round.open, ...round.requests.map((_, f) => friendSpot(f))];
  const walk = (i: number, acc: Spot[]) => {
    if (i === round.items.length) {
      if (checkPlan(round, acc).kind === 'ok') out.push(acc.slice());
      return;
    }
    for (const s of spots) {
      if (!accepts(round, round.items[i], s) || (friendOf(s) !== null && acc.includes(s))) continue;
      acc.push(s);
      walk(i + 1, acc);
      acc.pop();
    }
  };
  walk(0, []);
  return out;
}

/** Things whose spot differs between two plans. */
export const distance = (a: PlanMap, b: PlanMap) => a.reduce((n, s, i) => n + (s === b[i] ? 0 : 1), 0);

/** The accepted plan keeping the most of hers; ties go to the one agreeing earliest on the cart. */
export function nearestSolution(round: Round, plan: PlanMap): PlanMap | null {
  let best: PlanMap | null = null;
  for (const sol of solutions(round)) {
    if (!best) {
      best = sol;
      continue;
    }
    const d = distance(plan, sol) - distance(plan, best);
    if (d < 0 || (d === 0 && agreesEarlier(plan, sol, best))) best = sol;
  }
  return best;
}

function agreesEarlier(plan: PlanMap, a: PlanMap, b: PlanMap): boolean {
  for (let i = 0; i < plan.length; i++) {
    const ia = a[i] === plan[i],
      ib = b[i] === plan[i];
    if (ia !== ib) return ia;
  }
  return false;
}

/**
 * One fix toward the nearest accepted plan, for the glow, Show me one and the ghost finger: the first unmet condition,
 * answered as that plan answers it (the misplaced or left-on-the-cart thing to its spot, or the thing that plan gives an
 * empty friend). Null when the plan is already accepted.
 */
export function nextMove(round: Round, plan: PlanMap): { index: number; to: Spot } | null {
  const c = checkPlan(round, plan);
  if (c.kind === 'ok') return null;
  const sol = nearestSolution(round, plan);
  if (!sol) return null;
  if (c.kind === 'onCart') return { index: c.indices[0], to: sol[c.indices[0]] };
  if (c.kind === 'misplaced') return { index: c.index, to: sol[c.index] };
  const index = sol.indexOf(friendSpot(c.friend));
  return { index, to: sol[index] };
}

/** Greedy, exactly as the definition gives it: friends in screen order each take the first fitting thing on the cart. */
export function greedyWorks(round: Round): boolean {
  const used = new Set<number>();
  for (const r of round.requests) {
    const i = round.items.findIndex((id, k) => !used.has(k) && ITEMS[id].fits.includes(r));
    if (i < 0) return false;
    used.add(i);
  }
  // The rest go to their own places; the plan works only if every friend got a thing.
  return used.size === round.requests.length;
}

export type Ring =
  | { kind: 'cart'; indices: number[] }
  | {
      kind: 'fail';
      check: Exclude<PlanCheck, { kind: 'ok' } | { kind: 'onCart' }>;
      counted: boolean;
      glowed: boolean;
    }
  | { kind: 'ok' };

/**
 * Levels 5–6's accounting, one plan per round. A ring with something still on the cart is free; a failed ring is one
 * miss, but ringing again on the same failed plan counts nothing. The second miss lights the glow, one hint per round;
 * Show a hint lights the same glow (the same once-per-round hint), and every Show me one after it counts a hint.
 */
export class PlanTally {
  misses = 0;
  hints = 0;
  glowing = false;
  private hinted = false;
  private asks = 0;
  private lastFail: string | null = null;

  private hint() {
    this.glowing = true;
    if (!this.hinted) {
      this.hinted = true;
      this.hints++;
    }
  }

  ring(round: Round, plan: PlanMap): Ring {
    const c = checkPlan(round, plan);
    if (c.kind === 'ok') return c;
    if (c.kind === 'onCart') return { kind: 'cart', indices: c.indices };
    return { kind: 'fail', check: c, ...this.failed(plan.join(',')) };
  }

  /** Levels 7–8: the same accounting for a picnic board; an empty seat is free, like something left on the cart. */
  ringPicnic(day: PicnicDay, plan: PicnicPlan): PicnicRing {
    const c = checkPicnic(day, plan);
    if (c.kind === 'ok') return c;
    if (c.kind === 'emptySeat') return { kind: 'seats', check: c };
    return { kind: 'fail', check: c, ...this.failed(picnicSignature(day, plan)) };
  }

  /** A failed ring: one miss, unless the plan (by its signature) is the one that last failed; the second miss glows. */
  private failed(sig: string): { counted: boolean; glowed: boolean } {
    if (sig === this.lastFail) return { counted: false, glowed: false };
    this.lastFail = sig;
    this.misses++;
    const was = this.glowing;
    if (this.misses >= GLOW_AFTER) this.hint();
    return { counted: true, glowed: !was && this.glowing };
  }

  /** The pause sheet's Show a hint: 'glow' the first time, then 'move' (Show me one), a hint each. */
  ask(): 'glow' | 'move' {
    this.asks++;
    if (this.asks === 1) {
      this.hint();
      return 'glow';
    }
    this.hints++;
    return 'move';
  }
}

// ---- levels 5–6 layout ----

export const THING = 120;
export const THING_GAP = 24;
export const BELL = 120;
export const FRIEND_W = 170;
export const FRIEND_H = 210;
export const FRIEND_GAP = 2 * DROP_PAD + 16;

export interface PlanLayout {
  /** Cart slots, left to right, one per thing. */
  slots: Rect[];
  bell: Rect;
  /** The whole cart row, for a drop back on the cart. */
  row: Rect;
  friends: Rect[];
  places: Partial<Record<Place, Rect>>;
}

/** The cart row and bell across the top, friends between it and the places (at the right in landscape), places as at level 4. */
export function planLayout(view: View, round: Round): PlanLayout {
  const { w, h } = view;
  const base = shedLayout(view, round.open);
  const n = round.items.length;
  // The bell stands clear of the cart row's drop area, so a thing let go by the bell lands on the cart, never on the bell.
  const bellGap = DROP_PAD + 14;
  const rowW = n * THING + (n - 1) * THING_GAP + bellGap + BELL;
  const x0 = Math.max(HOME_CORNER.w + 20, (w - rowW) / 2);
  const y = 26;
  const slots = Array.from({ length: n }, (_, i): Rect => ({
    x: x0 + i * (THING + THING_GAP),
    y: y + (BELL - THING) / 2,
    w: THING,
    h: THING,
  }));
  const row: Rect = { x: x0, y, w: rowW - BELL - bellGap, h: BELL };
  const bell: Rect = { x: x0 + row.w + bellGap, y, w: BELL, h: BELL };
  const top = Math.min(...Object.values(base.places).map((r) => r!.y));
  const bandMid = (y + BELL + top) / 2;
  const k = round.requests.length;
  const fw = k * FRIEND_W + (k - 1) * FRIEND_GAP;
  const fx0 = h > w ? (w - fw) / 2 : w - 40 - fw;
  const friends = round.requests.map((_, i): Rect => ({
    x: fx0 + i * (FRIEND_W + FRIEND_GAP),
    y: bandMid - FRIEND_H / 2,
    w: FRIEND_W,
    h: FRIEND_H,
  }));
  return { slots, bell, row, friends, places: base.places };
}

/** Where a thing let go at (x, y) lands: the nearest place, friend or the cart row whose padded area holds the point; null for the empty yard. */
export function spotAt(l: PlanLayout, x: number, y: number): Spot | null {
  const areas: [Spot, Rect][] = [
    ...(Object.entries(l.places) as [Place, Rect][]),
    ...l.friends.map((r, i): [Spot, Rect] => [friendSpot(i), r]),
    ['cart', l.row],
  ];
  let best: Spot | null = null;
  let bestD = Infinity;
  for (const [s, r] of areas) {
    if (x < r.x - DROP_PAD || x > r.x + r.w + DROP_PAD || y < r.y - DROP_PAD || y > r.y + r.h + DROP_PAD)
      continue;
    const c = centre(r);
    const d = (c.x - x) ** 2 + (c.y - y) ** 2;
    if (d < bestD) {
      bestD = d;
      best = s;
    }
  }
  return best;
}

// ---- levels 7–8: Picnic Loop, cups planned across picnics (docs/definitions/second-chance-shed-7-8.md) ----

/** The washable vessels, in the order every tie-break uses: three cups, then the big mug. */
export const VESSEL_IDS = ['red', 'blue', 'yellow', 'mug'] as const;
export type VesselId = (typeof VESSEL_IDS)[number];
/** The picnic set: a separate record from ITEMS, so the level 1–6 pools never draw it. */
export const VESSELS: Record<VesselId, { id: VesselId; name: string }> = {
  red: { id: 'red', name: 'red cup' },
  blue: { id: 'blue', name: 'blue cup' },
  yellow: { id: 'yellow', name: 'yellow cup' },
  mug: { id: 'mug', name: 'big mug' },
};
export const SEATS = 4;
export const TUB_SLOTS = 2;

export interface PicnicDay {
  level: 7 | 8;
  /** Breakfast and lunch (2), or supper too (3). */
  picnics: number;
  /** The most one-use cups the Last Heap's outlines allow: the day's puzzle, never a rule. */
  target: number;
  /** Level 8: the painter takes the big mug, clean, in the gap after this picnic (0 breakfast, 1 lunch). */
  promise: { after: 0 | 1 } | null;
}

/** Level 7: two picnics, target 2. Level 8: three picnics, target 5, and one of the two authored handovers (seeded). */
export function picnicDayFor(level: number, rng: Rng): PicnicDay {
  if (level <= 7) return { level: 7, picnics: 2, target: 2, promise: null };
  return { level: 8, picnics: 3, target: 5, promise: { after: rng.chance(0.5) ? 1 : 0 } };
}

/** Somewhere a cup can be on the board: a friend's seat at a picnic, a slot in the tub after a picnic, or with the painter. */
export type PicnicStop =
  { at: 'seat'; picnic: number; seat: number } | { at: 'tub'; tub: number; slot: number } | { at: 'painter' };

/**
 * What the board shows. A washable's route lists its stops in time order (its token sits at the last; earlier seats keep
 * a ring); each one-use cup has a single stop.
 */
export interface PicnicPlan {
  routes: Record<VesselId, PicnicStop[]>;
  oneUse: PicnicStop[];
}

export const emptyPicnic = (): PicnicPlan => ({
  routes: { red: [], blue: [], yellow: [], mug: [] },
  oneUse: [],
});

/** A stop's place in the day: picnic p at 2p, the tub after it at 2p + 1, the handover just after that tub. */
export function stopTime(day: PicnicDay, s: PicnicStop): number {
  if (s.at === 'seat') return 2 * s.picnic;
  if (s.at === 'tub') return 2 * s.tub + 1;
  return day.promise ? 2 * day.promise.after + 1.5 : Infinity;
}

export const sameStop = (a: PicnicStop, b: PicnicStop) =>
  a.at === b.at &&
  (a.at === 'seat'
    ? a.picnic === (b as typeof a).picnic && a.seat === (b as typeof a).seat
    : a.at === 'tub'
      ? a.tub === (b as typeof a).tub && a.slot === (b as typeof a).slot
      : true);

export type PicnicCup = VesselId | 'oneUse';

/** Who is at a stop: a washable (as a ring or its token), a one-use cup (by index), or nobody. */
export function occupant(plan: PicnicPlan, s: PicnicStop): { vessel: VesselId } | { oneUse: number } | null {
  for (const v of VESSEL_IDS) if (plan.routes[v].some((r) => sameStop(r, s))) return { vessel: v };
  const i = plan.oneUse.findIndex((r) => sameStop(r, s));
  return i >= 0 ? { oneUse: i } : null;
}

const before = (day: PicnicDay, route: PicnicStop[], t: number) => route.filter((r) => stopTime(day, r) < t);

/** Clear a stop for a newcomer: a washable there is cut back to its route before that time, a one-use cup goes to the stack. */
function displace(day: PicnicDay, plan: PicnicPlan, s: PicnicStop, keep: VesselId | number): PicnicPlan {
  const o = occupant(plan, s);
  if (!o) return plan;
  if ('vessel' in o) {
    if (o.vessel === keep) return plan;
    return {
      ...plan,
      routes: { ...plan.routes, [o.vessel]: before(day, plan.routes[o.vessel], stopTime(day, s)) },
    };
  }
  if (o.oneUse === keep) return plan;
  return { ...plan, oneUse: plan.oneUse.filter((_, i) => i !== o.oneUse) };
}

/**
 * Drop a washable's token: on the shelf its route clears; anywhere else the route keeps its stops before that time and
 * ends there (so breakfast → tub → lunch is three drops, and an earlier drop takes back the later trips). A cup already
 * there is cut back (a swap, never counted).
 */
export function dropVessel(
  day: PicnicDay,
  plan: PicnicPlan,
  v: VesselId,
  to: PicnicStop | 'shelf',
): PicnicPlan {
  if (to === 'shelf') return { ...plan, routes: { ...plan.routes, [v]: [] } };
  const t = stopTime(day, to);
  const cleared = displace(day, plan, to, v);
  return { ...cleared, routes: { ...cleared.routes, [v]: [...before(day, cleared.routes[v], t), to] } };
}

/** Place a one-use cup from the stack (`from` 'stack') or move one already out; on the stack it goes back. One stop each. */
export function dropOneUse(
  day: PicnicDay,
  plan: PicnicPlan,
  from: number | 'stack',
  to: PicnicStop | 'stack',
): PicnicPlan {
  let next = from === 'stack' ? plan : { ...plan, oneUse: plan.oneUse.filter((_, i) => i !== from) };
  if (to === 'stack') return next;
  next = displace(day, next, to, -1);
  return { ...next, oneUse: [...next.oneUse, to] };
}

/** The ring Show me one and the ghost finger make, as a drag on the board. */
export type PicnicMove =
  | { kind: 'vessel'; vessel: VesselId; to: PicnicStop | 'shelf' }
  | { kind: 'oneUse'; from: number | 'stack'; to: PicnicStop | 'stack' };

export function applyPicnicMove(day: PicnicDay, plan: PicnicPlan, m: PicnicMove): PicnicPlan {
  return m.kind === 'vessel' ? dropVessel(day, plan, m.vessel, m.to) : dropOneUse(day, plan, m.from, m.to);
}

/** The board as a grid: who sits at every seat, every tub slot, and the painter. */
export function picnicBoard(day: PicnicDay, plan: PicnicPlan) {
  const seats = Array.from({ length: day.picnics }, () => Array<PicnicCup | null>(SEATS).fill(null));
  const tubs = Array.from({ length: day.picnics - 1 }, () => Array<PicnicCup | null>(TUB_SLOTS).fill(null));
  let painter: PicnicCup | null = null;
  const put = (s: PicnicStop, c: PicnicCup) => {
    if (s.at === 'seat') seats[s.picnic][s.seat] = c;
    else if (s.at === 'tub') tubs[s.tub][s.slot] = c;
    else painter = c;
  };
  for (const v of VESSEL_IDS) for (const s of plan.routes[v]) put(s, v);
  for (const s of plan.oneUse) put(s, 'oneUse');
  return { seats, tubs, painter: painter as PicnicCup | null };
}

/** One-use cups on seats: each goes to the Last Heap after its drink. */
export const heapOf = (plan: PicnicPlan) => plan.oneUse.filter((s) => s.at === 'seat').length;

export type PicnicCheck =
  | { kind: 'ok' }
  | { kind: 'emptySeat'; seats: { picnic: number; seat: number }[] }
  | { kind: 'unwashed'; vessel: VesselId; picnic: number }
  | { kind: 'oneUseInTub'; tub: number; slot: number }
  | { kind: 'promise'; why: 'notmug' | 'later' | 'dirty' }
  | { kind: 'unmet' }
  | { kind: 'overTarget'; heap: number };

/** Walk a route: the picnics it serves dirty (no tub since its last drink), and whether it ends with the painter dirty. */
function walk(route: PicnicStop[]) {
  let clean = true;
  const dirty: number[] = [];
  let painterDirty = false;
  for (const s of route) {
    if (s.at === 'seat') {
      if (!clean) dirty.push(s.picnic);
      clean = false;
    } else if (s.at === 'tub') clean = true;
    else painterDirty = !clean;
  }
  return { dirty, painterDirty };
}

/**
 * The first unmet condition, in the definition's order: an empty seat (free), a used cup served again without the tub
 * (earliest picnic, then vessel order), a one-use cup in a tub, the painter's promise, the painter still waiting, then the
 * heap over its outlines. A clean cup in a tub and a cup left on the shelf are both accepted.
 */
export function checkPicnic(day: PicnicDay, plan: PicnicPlan): PicnicCheck {
  const board = picnicBoard(day, plan);
  const empty = board.seats.flatMap((row, picnic) =>
    row.flatMap((c, seat) => (c === null ? [{ picnic, seat }] : [])),
  );
  if (empty.length) return { kind: 'emptySeat', seats: empty };
  for (let p = 0; p < day.picnics; p++)
    for (const v of VESSEL_IDS)
      if (walk(plan.routes[v]).dirty.includes(p)) return { kind: 'unwashed', vessel: v, picnic: p };
  const inTub = plan.oneUse.find((s) => s.at === 'tub');
  if (inTub?.at === 'tub') return { kind: 'oneUseInTub', tub: inTub.tub, slot: inTub.slot };
  if (day.promise) {
    const after = day.promise.after;
    const mug = plan.routes.mug;
    if (board.painter !== null && board.painter !== 'mug') return { kind: 'promise', why: 'notmug' };
    if (mug.some((s) => s.at === 'seat' && s.picnic > after)) return { kind: 'promise', why: 'later' };
    if (board.painter === 'mug' && walk(mug).painterDirty) return { kind: 'promise', why: 'dirty' };
    if (board.painter === null) return { kind: 'unmet' };
  }
  const heap = heapOf(plan);
  if (heap > day.target) return { kind: 'overTarget', heap };
  return { kind: 'ok' };
}

/** A washable's day as the rules reason about it: the picnics it serves, the tubs it is washed in, and the handover. */
export interface VesselSchedule {
  serves: boolean[];
  tubs: boolean[];
  painter: boolean;
}
/** One schedule per vessel, in VESSEL_IDS order. */
export type PicnicSchedule = VesselSchedule[];

export function scheduleOf(day: PicnicDay, plan: PicnicPlan): PicnicSchedule {
  return VESSEL_IDS.map((v) => {
    const r = plan.routes[v];
    return {
      serves: Array.from({ length: day.picnics }, (_, p) => r.some((s) => s.at === 'seat' && s.picnic === p)),
      tubs: Array.from({ length: day.picnics - 1 }, (_, t) => r.some((s) => s.at === 'tub' && s.tub === t)),
      painter: r.some((s) => s.at === 'painter'),
    };
  });
}

/** A route's stops as time-ordered keys ('p0' a picnic, 't0' a tub, 'g' the handover), without seat or slot. */
type Key = { key: string; time: number };
function keysOfSchedule(day: PicnicDay, s: VesselSchedule): Key[] {
  const out: Key[] = [];
  s.serves.forEach((b, p) => b && out.push({ key: `p${p}`, time: 2 * p }));
  s.tubs.forEach((b, t) => b && out.push({ key: `t${t}`, time: 2 * t + 1 }));
  if (s.painter) out.push({ key: 'g', time: stopTime(day, { at: 'painter' }) });
  return out.sort((a, b) => a.time - b.time);
}
const keyOf = (day: PicnicDay, s: PicnicStop): Key => ({
  key: s.at === 'seat' ? `p${s.picnic}` : s.at === 'tub' ? `t${s.tub}` : 'g',
  time: stopTime(day, s),
});

/** Does a schedule keep the wash rule, wash only used cups, and (for the mug) keep the promise? */
function lawful(day: PicnicDay, v: VesselId, s: VesselSchedule): boolean {
  if (s.painter && (v !== 'mug' || !day.promise)) return false;
  if (v === 'mug' && day.promise && !s.painter) return false;
  let clean = true;
  let handed = false;
  for (const k of keysOfSchedule(day, s)) {
    if (handed) return false;
    if (k.key[0] === 'p') {
      if (!clean) return false;
      clean = false;
    } else if (k.key[0] === 't') {
      if (clean) return false; // a clean wash: accepted on the board, never enumerated
      clean = true;
    } else {
      if (!clean) return false;
      handed = true;
    }
  }
  return true;
}

const scheduleCache = new Map<string, PicnicSchedule[]>();

/**
 * Every accepted schedule: each washable's picnics, tubs and handover keeping the wash rule and the promise, at most four
 * washables a picnic and two a tub, and the heap (seats minus washable drinks) within `target`. Clean washes are left out.
 */
export function schedules(day: PicnicDay, target = day.target): PicnicSchedule[] {
  const id = `${day.picnics}:${day.promise?.after ?? '-'}:${target}`;
  const hit = scheduleCache.get(id);
  if (hit) return hit;
  const T = day.picnics - 1;
  const options = VESSEL_IDS.map((v) => {
    const out: VesselSchedule[] = [];
    for (let sm = 0; sm < 1 << day.picnics; sm++)
      for (let tm = 0; tm < 1 << T; tm++)
        for (const painter of [false, true]) {
          const s: VesselSchedule = {
            serves: Array.from({ length: day.picnics }, (_, p) => !!((sm >> p) & 1)),
            tubs: Array.from({ length: T }, (_, t) => !!((tm >> t) & 1)),
            painter,
          };
          if (lawful(day, v, s)) out.push(s);
        }
    return out;
  });
  const result: PicnicSchedule[] = [];
  const acc: VesselSchedule[] = [];
  const rec = (i: number) => {
    if (i === VESSEL_IDS.length) {
      let drinks = 0;
      for (let p = 0; p < day.picnics; p++) drinks += acc.filter((s) => s.serves[p]).length;
      for (let t = 0; t < T; t++) if (acc.filter((s) => s.tubs[t]).length > TUB_SLOTS) return;
      if (day.picnics * SEATS - drinks <= target) result.push(acc.slice());
      return;
    }
    for (const o of options[i]) {
      acc.push(o);
      rec(i + 1);
      acc.pop();
    }
  };
  rec(0);
  scheduleCache.set(id, result);
  return result;
}

/** Stops a route shares with a target route from the start, in time order. */
function prefix(a: Key[], b: Key[]): number {
  let c = 0;
  while (c < a.length && c < b.length && a[c].key === b[c].key) c++;
  return c;
}

/**
 * How far a board is from an accepted schedule, counted in drags: for each washable, its stops after the longest start it
 * shares with the target route plus the target's stops after that start (a drop rewrites the end of a route, so a route is
 * fixed from its start); plus each one-use cup a picnic still needs, and each one-use cup in a tub or with the painter.
 */
export function picnicDistance(day: PicnicDay, plan: PicnicPlan, target: PicnicSchedule): number {
  let d = 0;
  VESSEL_IDS.forEach((v, i) => {
    const r = plan.routes[v].map((s) => keyOf(day, s));
    const n = keysOfSchedule(day, target[i]);
    const c = prefix(r, n);
    d += r.length - c + (n.length - c);
  });
  for (let p = 0; p < day.picnics; p++) {
    const want = SEATS - target.filter((s) => s.serves[p]).length;
    const have = plan.oneUse.filter((s) => s.at === 'seat' && s.picnic === p).length;
    d += Math.max(0, want - have);
  }
  return d + plan.oneUse.filter((s) => s.at !== 'seat').length;
}

/** The accepted schedule closest to her board; ties go to the enumeration's order (vessel order, earliest stops first). */
export function nearestPicnic(day: PicnicDay, plan: PicnicPlan): PicnicSchedule | null {
  let best: PicnicSchedule | null = null;
  let bestD = Infinity;
  for (const s of schedules(day)) {
    const d = picnicDistance(day, plan, s);
    if (d < bestD) {
      bestD = d;
      best = s;
    }
  }
  return best;
}

/**
 * One drag toward the nearest accepted schedule, for the glow, Show me one and the ghost finger; null once the board is
 * accepted. It fixes the earliest place her board and that schedule differ (then vessel order): a route that went
 * somewhere the schedule's doesn't is cut back to its previous stop (or the shelf), a route that stops short moves its
 * token to the schedule's next stop, a one-use cup in a tub or with the painter goes back to the stack, and an empty seat
 * the schedule fills with a one-use cup gets one. Each drag lowers `picnicDistance` and never rings the bell.
 */
export function nextPicnicMove(day: PicnicDay, plan: PicnicPlan): PicnicMove | null {
  if (checkPicnic(day, plan).kind === 'ok') return null;
  const target = nearestPicnic(day, plan);
  if (!target) return null;
  const board = picnicBoard(day, plan);
  const keys = VESSEL_IDS.map((v) => plan.routes[v].map((s) => keyOf(day, s)));
  const goals = target.map((s) => keysOfSchedule(day, s));
  const prefixes = VESSEL_IDS.map((_, i) => prefix(keys[i], goals[i]));
  /** Is this washable's stop at this time part of the start it already shares with the target? */
  const settled = (v: VesselId, time: number) => {
    const i = VESSEL_IDS.indexOf(v);
    return keys[i].slice(0, prefixes[i]).some((k) => k.time === time);
  };
  const want = (p: number) => SEATS - target.filter((s) => s.serves[p]).length;
  const oneUseAt = (p: number) => plan.oneUse.filter((s) => s.at === 'seat' && s.picnic === p).length;
  const spotFor = (key: string): PicnicStop => {
    if (key === 'g') return { at: 'painter' };
    const n = Number(key.slice(1));
    const row = key[0] === 'p' ? board.seats[n] : board.tubs[n];
    const make = (k: number): PicnicStop =>
      key[0] === 'p' ? { at: 'seat', picnic: n, seat: k } : { at: 'tub', tub: n, slot: k };
    const time = key[0] === 'p' ? 2 * n : 2 * n + 1;
    // A seat a spare one-use cup holds first, then an empty one, then one a washable holds beyond its shared start.
    if (key[0] === 'p' && oneUseAt(n) > want(n)) {
      const k = row.indexOf('oneUse');
      if (k >= 0) return make(k);
    }
    const e = row.indexOf(null);
    if (e >= 0) return make(e);
    const w = row.findIndex((c) => c !== null && c !== 'oneUse' && !settled(c, time));
    if (w >= 0) return make(w);
    return make(row.indexOf('oneUse'));
  };
  let best: { time: number; order: number; move: PicnicMove } | null = null;
  const offer = (time: number, order: number, move: PicnicMove) => {
    if (!best || time < best.time || (time === best.time && order < best.order)) best = { time, order, move };
  };
  VESSEL_IDS.forEach((v, i) => {
    const r = keys[i],
      n = goals[i],
      c = prefixes[i];
    if (c < r.length && (c === n.length || n[c].time > r[c].time)) {
      offer(r[c].time, i, { kind: 'vessel', vessel: v, to: c > 0 ? plan.routes[v][c - 1] : 'shelf' });
    } else if (c < n.length) {
      offer(n[c].time, i, { kind: 'vessel', vessel: v, to: spotFor(n[c].key) });
    }
  });
  plan.oneUse.forEach((s, i) => {
    if (s.at !== 'seat') offer(stopTime(day, s), 10, { kind: 'oneUse', from: i, to: 'stack' });
  });
  for (let p = 0; p < day.picnics; p++) {
    const seat = board.seats[p].indexOf(null);
    if (oneUseAt(p) < want(p) && seat >= 0)
      offer(2 * p, 11, { kind: 'oneUse', from: 'stack', to: { at: 'seat', picnic: p, seat } });
  }
  return (best as { move: PicnicMove } | null)?.move ?? null;
}

export type PicnicRing =
  | { kind: 'ok' }
  | { kind: 'seats'; check: Extract<PicnicCheck, { kind: 'emptySeat' }> }
  | {
      kind: 'fail';
      check: Exclude<PicnicCheck, { kind: 'ok' } | { kind: 'emptySeat' }>;
      counted: boolean;
      glowed: boolean;
    };

/** The seat-and-slot map, so ringing again on an unchanged failed board counts nothing. */
export function picnicSignature(day: PicnicDay, plan: PicnicPlan): string {
  const b = picnicBoard(day, plan);
  return JSON.stringify([b.seats, b.tubs, b.painter]);
}

// ---- levels 7–8 layout (the 1024×768 design area, centred in the view) ----

/** Picnic Loop's own drop pad: the board fits up to twelve seats, so the levels 5–6 pad of 30 would not fit. */
export const PICNIC_PAD = 16;
export const CUP = 100;
export const SEAT = 104;
export const SEAT_GAP = 32;

export interface PicnicLayout {
  /** The shelf's resting place for each washable, in the top row. */
  shelf: Record<VesselId, Rect>;
  /** The one-use stack: a drag from it takes a new cup. */
  stack: Rect;
  /** The whole shelf-and-stack row, one drop area: a washable let go there clears its route, a one-use cup goes back. */
  back: Rect;
  bell: Rect;
  /** One header per picnic (the sun low, high, setting): not targets. */
  headers: Rect[];
  /** [picnic][seat]; rows are friends, columns are picnics. */
  seats: Rect[][];
  /** The drawn tub after each picnic, and its two slots. */
  tubs: Rect[];
  slots: Rect[][];
  painter: Rect | null;
  heap: Rect;
}

export function picnicLayout(view: View, day: PicnicDay): PicnicLayout {
  const ox = Math.max(0, (view.w - 1024) / 2);
  const oy = Math.max(0, (view.h - 768) / 2);
  const r = (x: number, y: number, w: number, h: number): Rect => ({ x: ox + x, y: oy + y, w, h });
  const shelf = Object.fromEntries(VESSEL_IDS.map((v, i) => [v, r(126 + i * 124, 30, CUP, CUP)])) as Record<
    VesselId,
    Rect
  >;
  const stack = r(622, 30, CUP, CUP);
  const back = r(126, 20, 596, 120);
  const bell = r(762, 20, 120, 120);
  const cols = day.picnics * 2 - 1;
  const span = cols * SEAT + (cols - 1) * SEAT_GAP;
  const x0 = 176 + (648 - span) / 2;
  const colX = (c: number) => x0 + c * (SEAT + SEAT_GAP);
  const headers = Array.from({ length: day.picnics }, (_, p) => r(colX(2 * p), 160, SEAT, 44));
  const seats = Array.from({ length: day.picnics }, (_, p) =>
    Array.from({ length: SEATS }, (_, k) => r(colX(2 * p), 216 + k * (SEAT + SEAT_GAP), SEAT, SEAT)),
  );
  const tubs = Array.from({ length: day.picnics - 1 }, (_, t) => r(colX(2 * t + 1) - 8, 336, SEAT + 16, 272));
  const slots = Array.from({ length: day.picnics - 1 }, (_, t) =>
    Array.from({ length: TUB_SLOTS }, (_, k) => r(colX(2 * t + 1), 352 + k * (SEAT + SEAT_GAP), SEAT, SEAT)),
  );
  const painter = day.promise ? r(856, 216, 148, 220) : null;
  const heap = day.promise ? r(856, 468, 148, 260) : r(856, 216, 148, 260);
  return { shelf, stack, back, bell, headers, seats, tubs, slots, painter, heap };
}

/** Where a cup let go at (x, y) lands: the nearest seat, tub slot, painter or the shelf row whose padded area holds it. */
export function picnicSpotAt(l: PicnicLayout, x: number, y: number): PicnicStop | 'back' | null {
  const areas: [PicnicStop | 'back', Rect][] = [
    ['back', l.back],
    ...l.seats.flatMap((col, picnic) =>
      col.map((rc, seat): [PicnicStop, Rect] => [{ at: 'seat', picnic, seat }, rc]),
    ),
    ...l.slots.flatMap((col, tub) =>
      col.map((rc, slot): [PicnicStop, Rect] => [{ at: 'tub', tub, slot }, rc]),
    ),
    ...(l.painter ? [[{ at: 'painter' }, l.painter] as [PicnicStop, Rect]] : []),
  ];
  let best: PicnicStop | 'back' | null = null;
  let bestD = Infinity;
  for (const [s, rc] of areas) {
    if (
      x < rc.x - PICNIC_PAD ||
      x > rc.x + rc.w + PICNIC_PAD ||
      y < rc.y - PICNIC_PAD ||
      y > rc.y + rc.h + PICNIC_PAD
    )
      continue;
    const c = centre(rc);
    const d = (c.x - x) ** 2 + (c.y - y) ** 2;
    if (d < bestD) {
      bestD = d;
      best = s;
    }
  }
  return best;
}

/** The rectangle of a stop on the board. */
export function stopRect(l: PicnicLayout, s: PicnicStop): Rect {
  if (s.at === 'seat') return l.seats[s.picnic][s.seat];
  if (s.at === 'tub') return l.slots[s.tub][s.slot];
  return l.painter!;
}
