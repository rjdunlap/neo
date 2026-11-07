import type { Rng } from '../../engine/random';
import type { BandLevels } from '../../progress/difficulty';

/**
 * Fruit Sums (the notebook's "Make Twelve"): a sign names a number, the tree drops a few numbered fruit, and she makes that
 * number from two of them and a sign. Every way that works is accepted; a round asks for two different ways. The rules a test
 * can hold the screen to live here: which trays a level builds, which ways count, what a try makes, and where things sit.
 */
export type Op = 'plus' | 'minus';

export interface TreePlan {
  /** The signs she may use. One sign is shown fixed; two are leaves she chooses between. */
  ops: readonly Op[];
  /** The number on the sign. */
  target: readonly [number, number];
  /** Numbered fruit in the tray. */
  tiles: number;
  /** The biggest number on a fruit. */
  maxTile: number;
  name: string;
}

export const PLANS: readonly TreePlan[] = [
  { ops: ['plus'], target: [4, 10], tiles: 5, maxTile: 9, name: 'Make a number up to 10 by adding two fruit, two different ways' },
  { ops: ['plus'], target: [11, 20], tiles: 5, maxTile: 19, name: 'Make a number up to 20 by adding two fruit, two different ways' },
  { ops: ['plus', 'minus'], target: [5, 15], tiles: 6, maxTile: 20, name: 'Make a number up to 15 by adding or taking away, two different ways' },
];

export const LEVELS: BandLevels = { school: { min: 1, max: 3 } };

export const planFor = (level: number): TreePlan => PLANS[Math.min(PLANS.length, Math.max(1, Math.floor(level))) - 1];
export const choosesSign = (level: number) => planFor(level).ops.length > 1;

/** Every round asks for this many different ways to make the number. */
export const WAYS_PER_ROUND = 2;

/** One way to make the number: tile indices into the tray, the first being the number you start from. */
export interface Way { a: number; op: Op; b: number }

export const made = (a: number, op: Op, b: number) => (op === 'plus' ? a + b : a - b);
export const opWord = (op: Op) => (op === 'plus' ? 'plus' : 'take away');
export const opSign = (op: Op) => (op === 'plus' ? '+' : '−');

/** Adding is the same either way round; taking away is not. Two tries with the same key are the same way. */
export function wayKey(a: number, op: Op, b: number): string {
  return op === 'plus' ? `+${Math.min(a, b)},${Math.max(a, b)}` : `-${a},${b}`;
}

/** Every distinct way (by number, not by which fruit) to make `target` from the tray; the first fruit of each is the earliest in the tray. */
export function solutions(tray: readonly number[], ops: readonly Op[], target: number): Way[] {
  const seen = new Set<string>(), out: Way[] = [];
  for (let a = 0; a < tray.length; a++) {
    for (let b = 0; b < tray.length; b++) {
      if (a === b) continue;
      for (const op of ops) {
        if (op === 'plus' && b < a) continue;
        if (made(tray[a], op, tray[b]) !== target) continue;
        const key = wayKey(tray[a], op, tray[b]);
        if (!seen.has(key)) { seen.add(key); out.push({ a, op, b }); }
      }
    }
  }
  return out;
}

export type Verdict =
  /** It makes the number and she has not made it this way yet. */
  | { kind: 'right'; made: number; key: string }
  /** It makes the number, but she already made it this way (or the same sum the other way round). Not a miss. */
  | { kind: 'same'; made: number }
  /** Taking away more than she has: nothing is made. Not a miss. */
  | { kind: 'below'; made: number }
  /** It makes some other number: a miss, and she hears which. */
  | { kind: 'wrong'; made: number };

export function judge(av: number, op: Op, bv: number, target: number, found: readonly string[]): Verdict {
  const m = made(av, op, bv);
  if (m < 0) return { kind: 'below', made: m };
  if (m !== target) return { kind: 'wrong', made: m };
  const key = wayKey(av, op, bv);
  return found.includes(key) ? { kind: 'same', made: m } : { kind: 'right', made: m, key };
}

/**
 * The way the hint leads to: one she has not found. Given the fruit already in the first box, it is a way that starts from that
 * fruit if one exists (a sum may be turned round so it does), so the hint follows through from where she is rather than restarting.
 */
export function hintWay(tray: readonly number[], ops: readonly Op[], target: number, found: readonly string[], first: number | null = null): Way | null {
  const open = solutions(tray, ops, target).filter((w) => !found.includes(wayKey(tray[w.a], w.op, tray[w.b])));
  if (first !== null) {
    for (const w of open) {
      if (w.a === first) return w;
      if (w.op === 'plus' && w.b === first) return { a: w.b, op: 'plus', b: w.a };
    }
    // Another fruit with the same number starts the same way just as well.
    for (const w of open) {
      if (tray[w.a] === tray[first] && w.b !== first) return { ...w, a: first };
      if (w.op === 'plus' && tray[w.b] === tray[first] && w.a !== first) return { a: first, op: 'plus', b: w.a };
    }
  }
  return open[0] ?? null;
}

/** What glows once the hint is on: a fruit (by tray index), the sign leaf she needs, or the check when the way is built. */
export type HintGlow = { tile: number } | { leaf: Op } | { check: true };

/**
 * The next step of the hinted way from what is in the boxes: the start fruit, then its partner, then (at level 3) the needed leaf,
 * then the check. A first box holding a fruit that starts no way left glows itself, so tapping it sends it home.
 */
export function hintGlow(tray: readonly number[], ops: readonly Op[], target: number, found: readonly string[],
  slotA: number | null, slotB: number | null, op: Op | null): HintGlow | null {
  const way = hintWay(tray, ops, target, found, slotA);
  if (!way) return null;
  // The start fruit sits in the second box: a sum just needs its partner; a take-away goes home to start again in the first box.
  if (slotA === null) return { tile: way.a === slotB && way.op === 'plus' ? way.b : way.a };
  if (way.a !== slotA) return { tile: slotA };
  if (slotB !== way.b) return { tile: way.b };
  if (op !== way.op) return { leaf: way.op };
  return { check: true };
}

export interface TreeRound { target: number; tray: number[] }

/**
 * A tray built around two different ways so the round can always be finished (and by a plain sum or a take-away at level 3),
 * plus fruit that make nothing in particular. Whatever else the extra fruit happen to make is accepted too.
 */
export function makeRound(level: number, rng: Rng): TreeRound {
  const plan = planFor(level), [lo, hi] = plan.target;
  for (let attempt = 0; attempt < 200; attempt++) {
    const target = rng.int(lo, hi);
    const tray: number[] = [];
    // The first way is always an addition; the second is another addition, or at level 3 a take-away.
    const first = rng.int(1, Math.floor(target / 2));
    tray.push(first, target - first);
    if (plan.ops.length > 1) {
      const room = plan.maxTile - target;
      if (room < 1) continue;
      const base = rng.int(1, room);
      tray.push(target + base, base);
    } else {
      let second = rng.int(1, Math.floor(target / 2));
      if (second === first) second = first === 1 ? 2 : first - 1;
      if (second < 1 || second > Math.floor(target / 2) || second === first) continue;
      tray.push(second, target - second);
    }
    while (tray.length < plan.tiles) tray.push(rng.int(1, plan.maxTile));
    if (tray.some((v) => v < 1 || v > plan.maxTile)) continue;
    if (solutions(tray, plan.ops, target).length < WAYS_PER_ROUND) continue;
    return { target, tray: rng.shuffle(tray) };
  }
  throw new Error(`Fruit Sums: no tray for level ${level}`);
}

// ---- looks: the tree and the light change with the round; the rules never do ----

export type Look = 'orchard' | 'cove' | 'autumn';
export const LOOKS: readonly Look[] = ['orchard', 'cove', 'autumn'];
export type FruitShape = 'round' | 'coconut' | 'pear' | 'plum';

/** The orchard grows round fruit, the cove palm coconuts, and the autumn tree pears and plums in turn. */
export function shapeFor(look: Look, i: number): FruitShape {
  if (look === 'cove') return 'coconut';
  if (look === 'autumn') return i % 2 === 0 ? 'pear' : 'plum';
  return 'round';
}

/** Fruit fall in one after another at the start; each lands this long after the one before it. */
export const DROP_GAP = 0.09;
export const DROP_TIME = 0.42;
/** A falling pentatonic step for each landing, high to low. */
export const dropStep = (i: number) => Math.max(1, 10 - i);

// ---- layout (design units; the pet keeps the bottom-left corner clear) ----

export const TILE = 110;
export const SLOT = 120;
const GAP = 18;

export interface Pt { x: number; y: number }
export interface TreeLayout {
  sign: Pt;
  found: Pt;
  a: Pt; op: Pt; b: Pt; equals: Pt; check: Pt;
  leaves: Pt[];
  tiles: Pt[];
}

export function layoutFor(w: number, h: number, count: number, signs: boolean): TreeLayout {
  // A tall window (portrait) puts the working rows lower rather than leaving the bottom empty.
  const cx = w / 2, drop = Math.max(0, Math.min(200, (h - 768) * 0.35)), row = 300 + drop;
  const x0 = cx - 293;
  const at = (dx: number, y = row): Pt => ({ x: x0 + dx, y });
  const cols = Math.max(1, Math.min(count, Math.floor((w - 190 + GAP) / (TILE + GAP))));
  const rows = Math.ceil(count / cols);
  const trayTop = (signs ? 600 : 480) + drop;
  // A short window squeezes the tray upward rather than off the bottom.
  const top = Math.min(trayTop, h - 60 - TILE / 2 - (rows - 1) * (TILE + GAP));
  const tiles: Pt[] = [];
  for (let i = 0; i < count; i++) {
    const r = Math.floor(i / cols), inRow = Math.min(cols, count - r * cols);
    const rowW = inRow * TILE + (inRow - 1) * GAP;
    const left = 170 + (w - 210 - rowW) / 2;
    tiles.push({ x: left + (i - r * cols) * (TILE + GAP) + TILE / 2, y: top + r * (TILE + GAP) });
  }
  return {
    sign: { x: cx, y: 110 }, found: { x: cx, y: 196 },
    a: at(60), op: at(194), b: at(328), equals: at(417), check: at(526),
    leaves: signs ? [{ x: cx - 85, y: top - 150 }, { x: cx + 85, y: top - 150 }] : [],
    tiles,
  };
}

/** A sticker's numeral, from its seed. */
export const stickerNumber = (seed: number) => 2 + (Math.abs(Math.floor(seed)) % 8);
