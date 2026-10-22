import type { CritterName } from '../../art/critter';
import type { Rng } from '../../engine/random';
import type { BandLevels } from '../../progress/difficulty';

/**
 * Recipe Workshop: pots of pretend fruit mash and a white base, a bowl and a spoon. A tap on a pot adds a dollop that sits as
 * its own layer; the spoon swirls everything loose (and any topper on top) into one blend. Level 1 serves any bowl; level 2
 * serves the bowl on the card (one of each, in either order, mixed after the last); level 3 makes two friends' bowls, each
 * mixed before its own topper goes on. Only a Serve that does not match counts as a miss.
 */

export const LEVELS: BandLevels = {
  toddler: { min: 1, max: 1 },
  preschool: { min: 1, max: 2 },
  prek: { min: 2, max: 3 },
};

export type LevelId = 1 | 2 | 3;
export interface Plan { id: LevelId; name: string }
export const PLANS: readonly Plan[] = [
  { id: 1, name: 'My bowl: any bowl is right' },
  { id: 2, name: 'Follow the picture: one of each, then mix' },
  { id: 3, name: 'Bowls for two: mix, then each friend\'s topping' },
];
export const planFor = (level: number): Plan => PLANS[Math.max(0, Math.min(PLANS.length - 1, Math.round(level) - 1))];

export type Fruit = 'berries' | 'apple' | 'orange';
export type Ingredient = Fruit | 'base';
export type Topper = 'star' | 'leaf';
export const FRUITS: readonly Fruit[] = ['berries', 'apple', 'orange'];
export const INGREDIENTS: readonly Ingredient[] = ['berries', 'apple', 'orange', 'base'];
export const TOPPERS: readonly Topper[] = ['star', 'leaf'];

/** At most four portions in a bowl, and at most three of one thing. */
export const MAX_PORTIONS = 4;
export const MAX_ONE = 3;

/** The mash colours: a blend is a weighted mix of these, so the drawing, the test and the bot agree. */
export const MASH: Record<Ingredient, number> = { berries: 0x7a5cc8, apple: 0xff8fb4, orange: 0xff9a3c, base: 0xffffff };

/* The bowl --------------------------------------------------------------------------------------------- */

export interface Bowl {
  /** Portions stirred together, per ingredient (zeros omitted). */
  mixed: Partial<Record<Ingredient, number>>;
  /** Portions added since the last mix, in order, each drawn as its own layer. */
  loose: Ingredient[];
  top: Topper | null;
  /** Toppers stirred in, drawn as specks: a set, kept sorted. */
  folded: Topper[];
}

export const emptyBowl = (): Bowl => ({ mixed: {}, loose: [], top: null, folded: [] });
const copy = (b: Bowl): Bowl => ({ mixed: { ...b.mixed }, loose: [...b.loose], top: b.top, folded: [...b.folded] });

export function countOf(b: Bowl, i: Ingredient): number {
  return (b.mixed[i] ?? 0) + b.loose.filter((x) => x === i).length;
}
export const portions = (b: Bowl) => INGREDIENTS.reduce((n, i) => n + (b.mixed[i] ?? 0), 0) + b.loose.length;
export const isEmpty = (b: Bowl) => portions(b) === 0 && b.top === null && b.folded.length === 0;

/** A stable key for a bowl state. */
export function keyOf(b: Bowl): string {
  return `${INGREDIENTS.map((i) => b.mixed[i] ?? 0).join('')}|${b.loose.join(',')}|${b.top ?? ''}|${b.folded.join(',')}`;
}

export type Action = { kind: 'add'; ing: Ingredient } | { kind: 'mix' } | { kind: 'topper'; topper: Topper };

/** The bowl after an action, or null when the action leaves it as it is (a full pot, an empty stir, the same topper). */
export function act(b: Bowl, a: Action): Bowl | null {
  if (a.kind === 'add') {
    if (portions(b) >= MAX_PORTIONS || countOf(b, a.ing) >= MAX_ONE) return null;
    const n = copy(b); n.loose.push(a.ing); return n;
  }
  if (a.kind === 'mix') {
    if (b.loose.length === 0 && b.top === null) return null;
    const n = copy(b);
    for (const i of n.loose) n.mixed[i] = (n.mixed[i] ?? 0) + 1;
    n.loose = [];
    if (n.top) { if (!n.folded.includes(n.top)) n.folded = [...n.folded, n.top].sort(); n.top = null; }
    return n;
  }
  if (b.top === a.topper) return null;
  const n = copy(b); n.top = a.topper; return n;
}

/** Whether an add was refused because the bowl is full. */
export const isFull = (b: Bowl, i: Ingredient) => portions(b) >= MAX_PORTIONS || countOf(b, i) >= MAX_ONE;

/** The blend's colour from the mixed counts alone, or null when nothing is mixed yet. */
export function blendColor(b: Bowl): number | null {
  let n = 0, r = 0, g = 0, bl = 0;
  for (const i of INGREDIENTS) {
    const c = b.mixed[i] ?? 0;
    if (!c) continue;
    n += c; r += ((MASH[i] >> 16) & 255) * c; g += ((MASH[i] >> 8) & 255) * c; bl += (MASH[i] & 255) * c;
  }
  if (!n) return null;
  return (Math.round(r / n) << 16) | (Math.round(g / n) << 8) | Math.round(bl / n);
}

/* A bowl in play: its state, its undo stack and its own accounting -------------------------------------- */

export interface Request { fruit: Fruit; topper?: Topper }

export interface Slot {
  bowl: Bowl;
  /** Earlier states, oldest first; never holds a repeat. */
  stack: Bowl[];
  request: Request | null;
  misses: number;
  /** The glow on this bowl's next step is showing. */
  glow: boolean;
  /** This bowl has counted its one hint. */
  hintCounted: boolean;
  served: boolean;
}

export function newSlot(request: Request | null): Slot {
  return { bowl: emptyBowl(), stack: [], request, misses: 0, glow: false, hintCounted: false, served: false };
}

/** Do an action on a slot's bowl; returns false when nothing changed (nothing is pushed). */
export function doAction(s: Slot, a: Action): boolean {
  const next = act(s.bowl, a);
  if (!next) return false;
  const k = keyOf(next), at = s.stack.findIndex((x) => keyOf(x) === k);
  // Coming back to a state already on the stack cuts the loop out, so the stack never holds a repeat or the bowl itself.
  if (at >= 0) s.stack = s.stack.slice(0, at);
  else s.stack.push(s.bowl);
  s.bowl = next;
  return true;
}

export function undo(s: Slot): boolean {
  const prev = s.stack.pop();
  if (!prev) return false;
  s.bowl = prev;
  return true;
}

/* Checking a bowl -------------------------------------------------------------------------------------- */

export type Verdict =
  | { kind: 'ok' }
  | { kind: 'empty' }
  | { kind: 'extra'; ing: Ingredient }
  | { kind: 'missing'; ing: Ingredient }
  | { kind: 'notMixed' }
  | { kind: 'noTopper'; topper: Topper }
  | { kind: 'wrongTopper'; topper: Topper };

/** What the card wants of each ingredient. */
export const wants = (r: Request, i: Ingredient) => (i === r.fruit || i === 'base' ? 1 : 0);

/** The first reason a bowl does not match its request, in the order the companion explains them. */
export function check(b: Bowl, r: Request): Verdict {
  if (portions(b) === 0) return { kind: 'empty' };
  const order: Ingredient[] = [r.fruit, 'base', ...INGREDIENTS.filter((i) => i !== r.fruit && i !== 'base')];
  for (const i of order) if (countOf(b, i) > wants(r, i)) return { kind: 'extra', ing: i };
  for (const i of [r.fruit, 'base'] as const) if (countOf(b, i) < 1) return { kind: 'missing', ing: i };
  if (b.loose.length > 0) return { kind: 'notMixed' };
  if (r.topper && b.top === null) return { kind: 'noTopper', topper: r.topper };
  if (r.topper && b.top !== r.topper) return { kind: 'wrongTopper', topper: r.topper };
  return { kind: 'ok' };
}

export type Hint = { kind: 'undo' } | { kind: 'add'; ing: Ingredient } | { kind: 'mix' } | { kind: 'topper'; topper: Topper } | { kind: 'serve' };

/** One next step from the bowl's current state; following it always reaches a bowl that passes. */
export function hintFor(b: Bowl, r: Request): Hint {
  const order: Ingredient[] = [r.fruit, 'base', ...INGREDIENTS.filter((i) => i !== r.fruit && i !== 'base')];
  if (order.some((i) => countOf(b, i) > wants(r, i))) return { kind: 'undo' };
  for (const i of [r.fruit, 'base'] as const) if (countOf(b, i) < 1) return { kind: 'add', ing: i };
  if (b.loose.length > 0) return { kind: 'mix' };
  if (r.topper && b.top !== r.topper) return { kind: 'topper', topper: r.topper };
  return { kind: 'serve' };
}

/* The round -------------------------------------------------------------------------------------------- */

export interface Round {
  level: LevelId;
  /** The pots on the counter, left to right. */
  pots: Ingredient[];
  /** Toppers in the tray (level 3 only). */
  toppers: Topper[];
  /** The friend beside the companion at level 3. */
  friend: CritterName | null;
}

export interface RoundState {
  level: LevelId;
  slots: Slot[];
  active: number;
  misses: number;
  hints: number;
  done: boolean;
}

export const FRIENDS: readonly CritterName[] = ['duck', 'bunny', 'cat', 'pig', 'bear', 'dog'];

/** The authored first round opens on berries and the base; later rounds are seeded within the level's variation. */
export function makeRound(level: LevelId, rng: Rng, authored: boolean): { round: Round; requests: (Request | null)[] } {
  if (level === 1) {
    const pots: Ingredient[] = authored ? ['berries', 'base'] : (() => {
      const a = rng.pick(INGREDIENTS); const b = rng.pick(INGREDIENTS.filter((i) => i !== a)); return [a, b];
    })();
    return { round: { level, pots, toppers: [], friend: null }, requests: [null] };
  }
  const fruit: Fruit = authored ? 'berries' : rng.pick(FRUITS);
  const pots: Ingredient[] = [fruit, 'base'];
  if (level === 2) return { round: { level, pots, toppers: [], friend: null }, requests: [{ fruit }] };
  const friend: CritterName = authored ? 'duck' : rng.pick(FRIENDS);
  const starLeft = authored ? true : rng.next() < 0.5;
  const [a, b]: Topper[] = starLeft ? ['star', 'leaf'] : ['leaf', 'star'];
  return { round: { level, pots, toppers: ['star', 'leaf'], friend }, requests: [{ fruit, topper: a }, { fruit, topper: b }] };
}

export function roundState(level: LevelId, requests: (Request | null)[]): RoundState {
  return { level, slots: requests.map(newSlot), active: 0, misses: 0, hints: 0, done: false };
}

/** Start again: empty bowls, the same requests, keeping the round's misses and hints. */
export function restartState(s: RoundState) {
  for (const slot of s.slots) { slot.bowl = emptyBowl(); slot.stack = []; slot.served = false; }
  s.active = 0;
}

export type ServeResult = { kind: 'empty' } | { kind: 'served' } | { kind: 'miss'; verdict: Verdict; newHint: boolean };

/** Serve a bowl: only a non-empty bowl that fails its card counts a miss, and two on one bowl light its next step as a hint. */
export function serve(s: RoundState, i: number): ServeResult {
  const slot = s.slots[i];
  if (slot.served || s.done) return { kind: 'empty' };
  if (portions(slot.bowl) === 0) return { kind: 'empty' };
  const v = slot.request ? check(slot.bowl, slot.request) : { kind: 'ok' as const };
  if (v.kind === 'ok') {
    slot.served = true; slot.glow = false;
    s.done = s.slots.every((x) => x.served);
    if (!s.done) { const next = s.slots.findIndex((x) => !x.served); if (next >= 0) s.active = next; }
    return { kind: 'served' };
  }
  slot.misses++; s.misses++;
  let newHint = false;
  if (slot.misses >= 2 && !slot.glow) { slot.glow = true; newHint = countHint(s, slot); }
  return { kind: 'miss', verdict: v, newHint };
}

function countHint(s: RoundState, slot: Slot): boolean {
  if (slot.hintCounted || s.level === 1) return false;
  slot.hintCounted = true; s.hints++;
  return true;
}

/** Show a hint: the unserved bowl with the most misses (else the active one) glows; each bowl counts at most one hint. Returns that bowl. */
export function askHint(s: RoundState): number {
  let best = -1;
  s.slots.forEach((x, i) => { if (!x.served && x.misses > 0 && (best < 0 || x.misses > s.slots[best].misses)) best = i; });
  if (best < 0) best = s.slots[s.active]?.served ? s.slots.findIndex((x) => !x.served) : s.active;
  if (best < 0) return -1;
  const slot = s.slots[best];
  slot.glow = true;
  countHint(s, slot);
  return best;
}

/** Level 1's hint: a pot while the bowl is empty, then Serve. */
export function stepFor(slot: Slot, pots: readonly Ingredient[]): Hint {
  if (slot.request) return hintFor(slot.bowl, slot.request);
  return portions(slot.bowl) === 0 ? { kind: 'add', ing: pots[0] } : { kind: 'serve' };
}

/* Layout ----------------------------------------------------------------------------------------------- */

export interface Box { x: number; y: number; w: number; h: number }
export interface WorkshopLayout {
  card: Box | null;
  bubbles: Box[];
  pots: Box[];
  toppers: Box[];
  bowls: Box[];
  spoon: Box;
  undo: Box | null;
  serves: Box[];
  /** Where the companion's and the friend's feet stand, just behind each bowl's rim. */
  friends: { x: number; y: number }[];
}

/** The home and help buttons (top-left) and the guide's corner (bottom-left) stay clear. */
export const HOME_BOX: Box = { x: 0, y: 0, w: 130, h: 210 };
export const PET_CORNER = 240;
const GAP = 40;

/** Every target for the level, centred in the view; null rather than shrink a target. */
export function workshopLayout(v: { w: number; h: number }, level: number): WorkshopLayout | null {
  const lv = planFor(level).id, cx = v.w / 2, oy = Math.max(0, Math.min(300, (v.h - 768) / 2));
  const row = (sizes: number[], y: number): Box[] => {
    const total = sizes.reduce((a, b) => a + b, 0) + GAP * (sizes.length - 1);
    let x = cx - total / 2;
    return sizes.map((s) => { const b = { x, y: y + (130 - s) / 2, w: s, h: s }; x += s + GAP; return b; });
  };
  let L: WorkshopLayout;
  if (lv < 3) {
    const card = lv === 2 ? { x: cx - 160, y: oy + 20, w: 320, h: 140 } : null;
    const pots = row([130, 130], oy + 190);
    const bowl = { x: cx - 150, y: oy + 400, w: 300, h: 200 };
    const undo = lv === 2 ? { x: bowl.x - GAP - 110, y: bowl.y, w: 110, h: 110 } : null;
    const spoon = { x: bowl.x + bowl.w + GAP, y: bowl.y, w: 140, h: 140 };
    const serve = { x: spoon.x + spoon.w + GAP - 10, y: bowl.y + 10, w: 130, h: 130 };
    L = { card, bubbles: [], pots, toppers: [], bowls: [bowl], spoon, undo, serves: [serve], friends: [{ x: bowl.x + 70, y: bowl.y + bowl.h * 0.42 + 10 }] };
  } else {
    const card = { x: cx - 140, y: oy + 20, w: 280, h: 140 };
    const items = row([130, 130, 110, 110], oy + 190);
    const spoon = { x: cx - 65, y: oy + 375, w: 130, h: 130 };
    const bowlW = 230, bowlH = 160, apart = 65 + GAP + bowlW / 2;
    const bowls = [-1, 1].map((d) => ({ x: cx + d * apart - bowlW / 2, y: oy + 360, w: bowlW, h: bowlH }));
    const bubbles = bowls.map((_, i) => ({ x: i === 0 ? card.x - GAP - 110 : card.x + card.w + GAP, y: oy + 40, w: 110, h: 110 }));
    const undo = { x: cx - 55, y: spoon.y + spoon.h + 30, w: 110, h: 110 };
    // Each Serve sits under its bowl's inner half, clear of the guide's corner.
    const serves = bowls.map((b, i) => ({ x: i === 0 ? b.x + b.w - 120 : b.x, y: b.y + b.h + 30, w: 120, h: 120 }));
    L = { card, bubbles, pots: items.slice(0, 2), toppers: items.slice(2), bowls, spoon, undo, serves, friends: bowls.map((b) => ({ x: b.x + b.w / 2, y: b.y + b.h * 0.42 + 10 })) };
  }
  for (const b of targets(L)) {
    const inside = b.x >= 0 && b.y >= 0 && b.x + b.w <= v.w && b.y + b.h <= v.h;
    const clearHome = b.x >= HOME_BOX.x + HOME_BOX.w || b.y >= HOME_BOX.y + HOME_BOX.h;
    const clearPet = b.x >= PET_CORNER || b.y + b.h <= v.h - PET_CORNER;
    if (!inside || !clearHome || !clearPet) return null;
  }
  return L;
}

/** Every touch target in a layout. */
export function targets(L: WorkshopLayout): Box[] {
  return [...(L.card ? [L.card] : []), ...L.bubbles, ...L.pots, ...L.toppers, ...L.bowls, L.spoon, ...(L.undo ? [L.undo] : []), ...L.serves];
}

/** Grows a box by `m` each way. */
export const grow = (b: Box, m: number): Box => ({ x: b.x - m, y: b.y - m, w: b.w + 2 * m, h: b.h + 2 * m });
export const within = (b: Box, x: number, y: number) => x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h;
export const centre = (b: Box) => ({ x: b.x + b.w / 2, y: b.y + b.h / 2 });

/** The bowl a drop at (x, y) lands in: the nearest one within reach, or null. */
export function bowlAt(L: WorkshopLayout, x: number, y: number): number | null {
  let best: number | null = null, bd = Infinity;
  L.bowls.forEach((b, i) => {
    if (!within(grow(b, 50), x, y)) return;
    const c = centre(b), d = Math.hypot(c.x - x, c.y - y);
    if (d < bd) { bd = d; best = i; }
  });
  return best;
}
