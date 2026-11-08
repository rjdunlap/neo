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
  /** The sign holds a sum of two fruit instead of a numeral; she makes the same amount with two other fruit. */
  signPair?: true;
  /** Every fruit pairs with another to make the number; each right pair drops into a basket until the tree is empty. */
  clearTree?: true;
  /** Three fruit and two plus signs make the number, rather than two fruit. */
  three?: true;
  name: string;
}

export const PLANS: readonly TreePlan[] = [
  {
    ops: ['plus'],
    target: [4, 10],
    tiles: 5,
    maxTile: 9,
    name: 'Make a number up to 10 by adding two fruit, two different ways',
  },
  {
    ops: ['plus'],
    target: [11, 20],
    tiles: 5,
    maxTile: 19,
    name: 'Make a number up to 20 by adding two fruit, two different ways',
  },
  {
    ops: ['plus', 'minus'],
    target: [5, 15],
    tiles: 6,
    maxTile: 20,
    name: 'Make a number up to 15 by adding or taking away, two different ways',
  },
  {
    ops: ['plus'],
    target: [6, 14],
    tiles: 5,
    maxTile: 9,
    signPair: true,
    name: 'Add two fruit to make the same as the sum on the sign, two different ways',
  },
  {
    ops: ['plus'],
    target: [6, 10],
    tiles: 6,
    maxTile: 9,
    clearTree: true,
    name: 'Clear the tree: pair up all six fruit so each pair adds to a number up to 10',
  },
  {
    // From 11, so a pair that makes ten always leaves a third fruit of at least 1.
    ops: ['plus'],
    target: [11, 18],
    tiles: 6,
    maxTile: 9,
    three: true,
    name: 'Make a number from 11 to 18 by adding three fruit, two different ways',
  },
];

/** Clearing the tree (to 10) is easier than making numbers up to 20, so level 5 comes after level 1; three fruit come last. */
export const LEVELS: BandLevels = { school: { min: 1, max: 6, order: [1, 5, 2, 4, 3, 6] } };

export const planFor = (level: number): TreePlan =>
  PLANS[Math.min(PLANS.length, Math.max(1, Math.floor(level))) - 1];
export const choosesSign = (level: number) => planFor(level).ops.length > 1;

/** Every round asks for this many different ways to make the number (at a clear-the-tree level, a pair for every two fruit). */
export const WAYS_PER_ROUND = 2;
export const waysNeeded = (plan: TreePlan) => (plan.clearTree ? plan.tiles / 2 : WAYS_PER_ROUND);

/** One way to make the number: tile indices into the tray, the first being the number you start from. */
export interface Way {
  a: number;
  op: Op;
  b: number;
}

export const made = (a: number, op: Op, b: number) => (op === 'plus' ? a + b : a - b);
export const opWord = (op: Op) => (op === 'plus' ? 'plus' : 'take away');
export const opSign = (op: Op) => (op === 'plus' ? '+' : '−');

/** Adding is the same either way round; taking away is not. Two tries with the same key are the same way. */
export function wayKey(a: number, op: Op, b: number): string {
  return op === 'plus' ? `+${Math.min(a, b)},${Math.max(a, b)}` : `-${a},${b}`;
}

/**
 * Every distinct way (by number, not by which fruit) to make `target` from the tray; the first fruit of each is the earliest in
 * the tray. Fruit already gone into the basket (`gone[i]`) are not on the tree any more.
 */
export function solutions(
  tray: readonly number[],
  ops: readonly Op[],
  target: number,
  gone: readonly boolean[] = [],
): Way[] {
  const seen = new Set<string>(),
    out: Way[] = [];
  for (let a = 0; a < tray.length; a++) {
    if (gone[a]) continue;
    for (let b = 0; b < tray.length; b++) {
      if (a === b || gone[b]) continue;
      for (const op of ops) {
        if (op === 'plus' && b < a) continue;
        if (made(tray[a], op, tray[b]) !== target) continue;
        const key = wayKey(tray[a], op, tray[b]);
        if (!seen.has(key)) {
          seen.add(key);
          out.push({ a, op, b });
        }
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
export function hintWay(
  tray: readonly number[],
  ops: readonly Op[],
  target: number,
  found: readonly string[],
  first: number | null = null,
  gone: readonly boolean[] = [],
): Way | null {
  const open = solutions(tray, ops, target, gone).filter(
    (w) => !found.includes(wayKey(tray[w.a], w.op, tray[w.b])),
  );
  if (first !== null) {
    for (const w of open) {
      if (w.a === first) return w;
      if (w.op === 'plus' && w.b === first) return { a: w.b, op: 'plus', b: w.a };
    }
    // Another fruit with the same number starts the same way just as well.
    for (const w of open) {
      if (tray[w.a] === tray[first] && w.b !== first) return { ...w, a: first };
      if (w.op === 'plus' && tray[w.b] === tray[first] && w.a !== first)
        return { a: first, op: 'plus', b: w.a };
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
export function hintGlow(
  tray: readonly number[],
  ops: readonly Op[],
  target: number,
  found: readonly string[],
  slotA: number | null,
  slotB: number | null,
  op: Op | null,
  gone: readonly boolean[] = [],
): HintGlow | null {
  const way = hintWay(tray, ops, target, found, slotA, gone);
  if (!way) return null;
  // The start fruit sits in the second box: a sum just needs its partner; a take-away goes home to start again in the first box.
  if (slotA === null) return { tile: way.a === slotB && way.op === 'plus' ? way.b : way.a };
  if (way.a !== slotA) return { tile: slotA };
  if (slotB !== way.b) return { tile: way.b };
  if (op !== way.op) return { leaf: way.op };
  return { check: true };
}

export interface TreeRound {
  target: number;
  tray: number[];
  /** At a sign-pair level, the sum on the sign (in the order shown); `target` is its total. */
  sign?: readonly [number, number];
  /** At a clear-the-tree level: every fruit pairs up and the round ends when the tree is empty. */
  clear?: true;
  /** At a three-fruit level: three boxes, and a way is three fruit. */
  three?: true;
}

/** The ways already taken before she makes one: the sign's own sum at a sign-pair level, then the ways she found. */
export function takenWays(round: TreeRound, found: readonly string[]): string[] {
  // Clearing the tree counts by fruit, not by number: a second 3 + 7 from two other fruit is a new pair.
  if (round.clear) return [];
  return round.sign ? [wayKey(round.sign[0], 'plus', round.sign[1]), ...found] : [...found];
}

/**
 * "Clear the tree": three pairs that each make the number, so every fruit has a partner. A pair may come twice (two 3s and two
 * 7s), but not all three, so a wrong pair is always there to try. Any order of right pairs empties the tree.
 */
function clearRound(plan: TreePlan, rng: Rng): TreeRound {
  const [lo, hi] = plan.target;
  for (let attempt = 0; attempt < 200; attempt++) {
    const target = rng.int(lo, hi);
    const halves: number[] = [];
    for (let h = Math.max(1, target - plan.maxTile); h <= Math.floor(target / 2); h++) halves.push(h);
    const picks = Array.from({ length: plan.tiles / 2 }, () => rng.pick(halves));
    if (new Set(picks).size < 2) continue;
    const tray = picks.flatMap((h) => [h, target - h]);
    return { target, tray: rng.shuffle(tray), clear: true };
  }
  throw new Error('Fruit Sums: no clear-the-tree tray');
}

/** "Same as the sign": the sign shows one sum, and two other pairs in the tray make the same amount. */
function pairRound(plan: TreePlan, rng: Rng): TreeRound {
  const [lo, hi] = plan.target;
  for (let attempt = 0; attempt < 200; attempt++) {
    const target = rng.int(lo, hi);
    // Every pair of fruit up to maxTile that makes the target, by its smaller number; targets 6–14 always have at least three.
    const halves: number[] = [];
    for (let h = Math.max(1, target - plan.maxTile); h <= Math.floor(target / 2); h++) halves.push(h);
    if (halves.length < 3) continue;
    const [s, x, y] = rng.shuffle(halves);
    const sign: [number, number] = rng.chance(0.5) ? [s, target - s] : [target - s, s];
    const tray = [x, target - x, y, target - y];
    while (tray.length < plan.tiles) tray.push(rng.int(1, plan.maxTile));
    const taken = [wayKey(sign[0], 'plus', sign[1])];
    const open = solutions(tray, plan.ops, target).filter(
      (w) => !taken.includes(wayKey(tray[w.a], w.op, tray[w.b])),
    );
    if (open.length < WAYS_PER_ROUND) continue;
    return { target, tray: rng.shuffle(tray), sign };
  }
  throw new Error('Fruit Sums: no sign-pair tray');
}

// ---- three fruit: a way is three tray indices, the same way whatever their order ----

/** Three fruit with the same numbers are the same way, in any order. */
export const tripleKey = (values: readonly number[]) => `+${[...values].sort((x, y) => x - y).join(',')}`;

/** Every set of three fruit (by tray index, in tray order) that adds to the target. */
export function triples(tray: readonly number[], target: number): [number, number, number][] {
  const out: [number, number, number][] = [];
  for (let i = 0; i < tray.length; i++)
    for (let j = i + 1; j < tray.length; j++)
      for (let k = j + 1; k < tray.length; k++)
        if (tray[i] + tray[j] + tray[k] === target) out.push([i, j, k]);
  return out;
}

export function judge3(values: readonly number[], target: number, found: readonly string[]): Verdict {
  const m = values.reduce((x, y) => x + y, 0);
  if (m !== target) return { kind: 'wrong', made: m };
  const key = tripleKey(values);
  return found.includes(key) ? { kind: 'same', made: m } : { kind: 'right', made: m, key };
}

/** The three fruit in the order the hint shows them: a pair that makes ten first, when the three hold one. */
function tenFirst(tray: readonly number[], t: readonly number[]): number[] {
  for (const [p, q, r] of [
    [0, 1, 2],
    [0, 2, 1],
    [1, 2, 0],
  ])
    if (tray[t[p]] + tray[t[q]] === 10) return [t[p], t[q], t[r]];
  return [...t];
}

/**
 * The three fruit the hint leads to, in the order it shows them: an unfound way that keeps the most of what is in the boxes,
 * then one with a pair that makes ten (the strategy this level teaches), then the earliest.
 */
export function hintTriple(
  tray: readonly number[],
  target: number,
  found: readonly string[],
  boxes: readonly (number | null)[] = [],
): number[] | null {
  let best: number[] | null = null,
    score = -1;
  for (const t of triples(tray, target)) {
    if (found.includes(tripleKey(t.map((i) => tray[i])))) continue;
    const kept = t.filter((i) => boxes.includes(i)).length;
    const order = tenFirst(tray, t);
    const s = kept * 2 + (tray[order[0]] + tray[order[1]] === 10 ? 1 : 0);
    if (s > score) {
      best = order;
      score = s;
    }
  }
  return best;
}

/**
 * The next step of the hinted three from what is in the boxes: a boxed fruit that is not part of it glows so a tap sends it home,
 * then the hinted fruit not yet boxed (the pair that makes ten first), then the check.
 */
export function hintGlow3(
  tray: readonly number[],
  target: number,
  found: readonly string[],
  boxes: readonly (number | null)[],
): HintGlow | null {
  const way = hintTriple(tray, target, found, boxes);
  if (!way) return null;
  const stray = boxes.find((i) => i !== null && !way.includes(i));
  if (stray != null) return { tile: stray };
  const next = way.find((i) => !boxes.includes(i));
  return next === undefined ? { check: true } : { tile: next };
}

/** "Three fruit": one way that holds a pair making ten and a second, different way, with no fruit shared. */
function threeRound(plan: TreePlan, rng: Rng): TreeRound {
  const [lo, hi] = plan.target;
  for (let attempt = 0; attempt < 200; attempt++) {
    const target = rng.int(lo, hi);
    const x = rng.int(1, 9);
    const ten = [x, 10 - x, target - 10];
    const p = rng.int(Math.max(1, target - 2 * plan.maxTile), Math.min(plan.maxTile, target - 2));
    const rest = target - p;
    const q = rng.int(Math.max(1, rest - plan.maxTile), Math.min(plan.maxTile, rest - 1));
    const other = [p, q, rest - q];
    if (tripleKey(other) === tripleKey(ten)) continue;
    const tray = [...ten, ...other];
    if (tray.some((v) => v < 1 || v > plan.maxTile)) continue;
    return { target, tray: rng.shuffle(tray), three: true };
  }
  throw new Error('Fruit Sums: no three-fruit tray');
}

/**
 * A tray built around two different ways so the round can always be finished (and by a plain sum or a take-away at level 3),
 * plus fruit that make nothing in particular. Whatever else the extra fruit happen to make is accepted too.
 */
export function makeRound(level: number, rng: Rng): TreeRound {
  const plan = planFor(level),
    [lo, hi] = plan.target;
  if (plan.signPair) return pairRound(plan, rng);
  if (plan.clearTree) return clearRound(plan, rng);
  if (plan.three) return threeRound(plan, rng);
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

export interface Pt {
  x: number;
  y: number;
}
export interface TreeLayout {
  sign: Pt;
  found: Pt;
  a: Pt;
  op: Pt;
  b: Pt;
  /** The third box and the second plus sign, at a three-fruit level (otherwise where the second box is). */
  c: Pt;
  op2: Pt;
  equals: Pt;
  check: Pt;
  leaves: Pt[];
  tiles: Pt[];
  /** Where right pairs go at a clear-the-tree level: below the tray, never a touch target. */
  basket: Pt;
}

export const BASKET_W = 260;
export const BASKET_H = 96;
/** A fruit in the basket is drawn this size, the k-th one along this far from its middle. */
export const BASKET_SCALE = 0.5;
export const basketSpot = (basket: Pt, k: number): Pt => ({ x: basket.x + (k - 2.5) * 40, y: basket.y - 66 });

/** Three boxes pack closer: two plus signs this size between them, and a 696-unit row that fits a 768-unit portrait width. */
export const PLUS3 = 48;

export function layoutFor(w: number, h: number, count: number, signs: boolean, three = false): TreeLayout {
  // A tall window (portrait) puts the working rows lower rather than leaving the bottom empty.
  const cx = w / 2,
    drop = Math.max(0, Math.min(200, (h - 768) * 0.35)),
    row = 300 + drop;
  const x0 = cx - (three ? 288 : 293);
  const at = (dx: number, y = row): Pt => ({ x: x0 + dx, y });
  const cols = Math.max(1, Math.min(count, Math.floor((w - 190 + GAP) / (TILE + GAP))));
  const rows = Math.ceil(count / cols);
  const trayTop = (signs ? 600 : 480) + drop;
  // A short window squeezes the tray upward rather than off the bottom.
  const top = Math.min(trayTop, h - 60 - TILE / 2 - (rows - 1) * (TILE + GAP));
  const tiles: Pt[] = [];
  for (let i = 0; i < count; i++) {
    const r = Math.floor(i / cols),
      inRow = Math.min(cols, count - r * cols);
    const rowW = inRow * TILE + (inRow - 1) * GAP;
    const left = 170 + (w - 210 - rowW) / 2;
    tiles.push({ x: left + (i - r * cols) * (TILE + GAP) + TILE / 2, y: top + r * (TILE + GAP) });
  }
  return {
    sign: { x: cx, y: 110 },
    found: { x: cx, y: 196 },
    ...(three
      ? { a: at(0), op: at(98), b: at(196), op2: at(294), c: at(392), equals: at(484), check: at(576) }
      : { a: at(60), op: at(194), b: at(328), op2: at(328), c: at(328), equals: at(417), check: at(526) }),
    leaves: signs
      ? [
          { x: cx - 85, y: top - 150 },
          { x: cx + 85, y: top - 150 },
        ]
      : [],
    tiles,
    basket: { x: cx + 20, y: Math.min(h - 70, tiles[count - 1].y + TILE / 2 + 95) },
  };
}

/** A sticker's numeral, from its seed. */
export const stickerNumber = (seed: number) => 2 + (Math.abs(Math.floor(seed)) % 8);
