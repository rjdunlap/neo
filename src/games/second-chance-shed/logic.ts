import type { Rng } from '../../engine/random';
import { spread, type View } from '../../engine/view';

/** The four places on the island that give a used thing its next life, in the order they open. */
export const PLACES = ['worm', 'shelf', 'mend', 'remake'] as const;
export type Place = (typeof PLACES)[number];

/** The reason word for a thing's condition; each kind belongs to exactly one place. */
export type Kind = 'food' | 'whole' | 'broken' | 'squashed';
export const KIND_OF_PLACE: Record<Place, Kind> = { worm: 'food', shelf: 'whole', mend: 'broken', remake: 'squashed' };

/** What a place makes from the thing (the scene plays it; `made.<id>` is its spoken line). */
export type Consequence = 'sprout' | 'nap' | 'planter' | 'apples' | 'button' | 'roll' | 'flutter' | 'medal' | 'crayon' | 'bead' | 'buttons';

export type ItemId = 'peel' | 'core' | 'carrot' | 'leaf' | 'box' | 'tub' | 'bag' | 'teddy' | 'cart' | 'kite' | 'can' | 'crayons' | 'caps' | 'tin';

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
  peel: { id: 'peel', name: 'banana peel', place: 'worm', kind: 'food', consequence: 'sprout', paper: false, fits: [] },
  core: { id: 'core', name: 'apple core', place: 'worm', kind: 'food', consequence: 'sprout', paper: false, fits: [] },
  carrot: { id: 'carrot', name: 'carrot top', place: 'worm', kind: 'food', consequence: 'sprout', paper: false, fits: [] },
  leaf: { id: 'leaf', name: 'dry leaf', place: 'worm', kind: 'food', consequence: 'sprout', paper: false, fits: [] },
  box: { id: 'box', name: 'sturdy box', place: 'shelf', kind: 'whole', consequence: 'nap', paper: false, fits: ['pencils', 'bed'] },
  tub: { id: 'tub', name: 'flowerpot tub', place: 'shelf', kind: 'whole', consequence: 'planter', paper: false, fits: ['pencils', 'seedling'] },
  bag: { id: 'bag', name: 'cloth bag', place: 'shelf', kind: 'whole', consequence: 'apples', paper: false, fits: [] },
  teddy: { id: 'teddy', name: 'teddy with a loose button', place: 'mend', kind: 'broken', consequence: 'button', paper: false, fits: [] },
  cart: { id: 'cart', name: 'cart missing a wheel', place: 'mend', kind: 'broken', consequence: 'roll', paper: false, fits: [] },
  kite: { id: 'kite', name: 'kite with a torn tail', place: 'mend', kind: 'broken', consequence: 'flutter', paper: false, fits: [] },
  can: { id: 'can', name: 'squashed can', place: 'remake', kind: 'squashed', consequence: 'medal', paper: false, fits: [] },
  crayons: { id: 'crayons', name: 'crayon stubs', place: 'remake', kind: 'squashed', consequence: 'crayon', paper: false, fits: [] },
  caps: { id: 'caps', name: 'bottle caps', place: 'remake', kind: 'squashed', consequence: 'bead', paper: false, fits: [] },
  // Source-checked 2026-10-31 for levels 5–6 (see VERIFICATION.md): a whole lidded tin is reused, and a metal tin is also remade.
  tin: { id: 'tin', name: 'tin with a lid', place: 'shelf', kind: 'whole', consequence: 'buttons', paper: false, from: 5, also: ['remake'], fits: ['pencils'] },
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
];
/** The last level that brings one thing at a time; above it the cart is laid out and planned (levels 5–6). */
export const SORT_MAX = 4;
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
  if (plan.level > SORT_MAX) return planRoundFor(plan.level, rng);
  const pool = (p: Place) => ITEM_IDS.filter((id) => ITEMS[id].place === p && !ITEMS[id].paper && (ITEMS[id].from ?? 1) <= plan.level);
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
  return { level: plan.level, open: [...plan.open], items, requests: [] };
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
const fillers = (kind: Kind) => ITEM_IDS.filter((id) => ITEMS[id].kind === kind && ITEMS[id].fits.length === 0 && !ITEMS[id].paper && !ITEMS[id].from);

/**
 * Level 5: the tin, the bag and one each of food, broken and squashed; one friend needs pencils standing.
 * Level 6: a case's both-fit candidate before the tin, three of food, broken, squashed and the bag, and two friends.
 */
export function planRoundFor(level: number, rng: Rng): Round {
  const open = [...PLACES];
  if (level <= 5) {
    const items = rng.shuffle<ItemId>(['tin', 'bag', ...(['food', 'broken', 'squashed'] as const).map((k) => rng.pick(fillers(k)))]);
    return { level: 5, open, items, requests: ['pencils'] };
  }
  const c = rng.pick(CASES);
  const kinds = rng.shuffle<Kind | 'bag'>(['food', 'broken', 'squashed', 'bag']).slice(0, 3);
  const rest = kinds.map((k): ItemId => (k === 'bag' ? 'bag' : rng.pick(fillers(k).filter((id) => id !== 'bag'))));
  const items = rng.shuffle<ItemId>([c.both, 'tin', ...rest]);
  const b = items.indexOf(c.both), t = items.indexOf('tin');
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
  for (let i = 0; i < plan.length; i++) if (!accepts(round, round.items[i], plan[i])) return { kind: 'misplaced', index: i, at: plan[i] };
  for (let f = 0; f < round.requests.length; f++) if (!plan.includes(friendSpot(f))) return { kind: 'unmet', friend: f };
  return { kind: 'ok' };
}

/** Move one thing; a friend holds one thing, so the one already there goes back to the cart (free). */
export function moveTo(plan: PlanMap, index: number, at: Spot): PlanMap {
  const next = plan.slice();
  if (friendOf(at) !== null) next.forEach((s, i) => { if (s === at && i !== index) next[i] = 'cart'; });
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
    if (!best) { best = sol; continue; }
    const d = distance(plan, sol) - distance(plan, best);
    if (d < 0 || (d === 0 && agreesEarlier(plan, sol, best))) best = sol;
  }
  return best;
}

function agreesEarlier(plan: PlanMap, a: PlanMap, b: PlanMap): boolean {
  for (let i = 0; i < plan.length; i++) {
    const ia = a[i] === plan[i], ib = b[i] === plan[i];
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
  | { kind: 'fail'; check: Exclude<PlanCheck, { kind: 'ok' } | { kind: 'onCart' }>; counted: boolean; glowed: boolean }
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
    if (!this.hinted) { this.hinted = true; this.hints++; }
  }

  ring(round: Round, plan: PlanMap): Ring {
    const c = checkPlan(round, plan);
    if (c.kind === 'ok') return c;
    if (c.kind === 'onCart') return { kind: 'cart', indices: c.indices };
    const sig = plan.join(',');
    if (sig === this.lastFail) return { kind: 'fail', check: c, counted: false, glowed: false };
    this.lastFail = sig;
    this.misses++;
    const was = this.glowing;
    if (this.misses >= GLOW_AFTER) this.hint();
    return { kind: 'fail', check: c, counted: true, glowed: !was && this.glowing };
  }

  /** The pause sheet's Show a hint: 'glow' the first time, then 'move' (Show me one), a hint each. */
  ask(): 'glow' | 'move' {
    this.asks++;
    if (this.asks === 1) { this.hint(); return 'glow'; }
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
  const slots = Array.from({ length: n }, (_, i): Rect => ({ x: x0 + i * (THING + THING_GAP), y: y + (BELL - THING) / 2, w: THING, h: THING }));
  const row: Rect = { x: x0, y, w: rowW - BELL - bellGap, h: BELL };
  const bell: Rect = { x: x0 + row.w + bellGap, y, w: BELL, h: BELL };
  const top = Math.min(...Object.values(base.places).map((r) => r!.y));
  const bandMid = (y + BELL + top) / 2;
  const k = round.requests.length;
  const fw = k * FRIEND_W + (k - 1) * FRIEND_GAP;
  const fx0 = h > w ? (w - fw) / 2 : w - 40 - fw;
  const friends = round.requests.map((_, i): Rect => ({ x: fx0 + i * (FRIEND_W + FRIEND_GAP), y: bandMid - FRIEND_H / 2, w: FRIEND_W, h: FRIEND_H }));
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
    if (x < r.x - DROP_PAD || x > r.x + r.w + DROP_PAD || y < r.y - DROP_PAD || y > r.y + r.h + DROP_PAD) continue;
    const c = centre(r);
    const d = (c.x - x) ** 2 + (c.y - y) ** 2;
    if (d < bestD) { bestD = d; best = s; }
  }
  return best;
}
