import type { Rng } from '../../engine/random';

/**
 * Seesaw Balance, after Hasee Bounce and playground balance toys: put friends and blocks on a big
 * seesaw and watch it tip. The ladder goes from "make your friend go up" to heavier and lighter,
 * balancing with blocks, finding the heaviest of look-alike presents, making the same weight two ways,
 * and weighing a mystery box. Things sit on level trays at the ends, so only weight matters, never
 * how far out something sits. The early-school steps, after DragonBox and PhET's Equality Explorer, start
 * balanced with a box and blocks on one side: take the same off both sides until the box is alone.
 */
export type SeesawMode = 'up' | 'heavy' | 'level' | 'heaviest' | 'parts' | 'mystery' | 'same';
export type Side = 'left' | 'right';

export interface SeesawPlan {
  mode: SeesawMode;
  rounds: number;
  boxes?: 2;
  name: string;
}

export const PLANS: SeesawPlan[] = [
  { mode: 'up', rounds: 4, name: 'Make a little friend go up: put a bigger friend on the other side' },
  { mode: 'heavy', rounds: 4, name: 'Heavy enough? Choose the friend who lifts the other side' },
  { mode: 'level', rounds: 3, name: 'Make the seesaw level with blocks (2 to 4)' },
  { mode: 'heaviest', rounds: 3, name: 'Test look-alike presents on the seesaw, then put the heaviest in the wagon' },
  { mode: 'parts', rounds: 3, name: 'Same weight, different pieces: match 4 to 7 with number weights' },
  { mode: 'mystery', rounds: 3, name: 'Weigh a mystery box with blocks, then say how heavy it is' },
  { mode: 'mystery', rounds: 3, boxes: 2, name: 'Two identical boxes: weigh both, then find the weight of one' },
  { mode: 'same', rounds: 3, name: 'A box and blocks balance blocks: take the same off both sides until the box is alone, then say its weight' },
  { mode: 'same', rounds: 3, boxes: 2, name: 'Boxes on both sides: take a box for a box and a block for a block until one box is alone' },
];

export const planFor = (level: number) => PLANS[Math.min(PLANS.length, Math.max(1, level)) - 1];

export type ThingKind = 'friend' | 'block' | 'weight' | 'present' | 'box';

export interface Thing {
  kind: ThingKind;
  weight: number;
}

/** Friends by weight: the bigger the friend, the heavier. */
export const FRIEND_FOR = { 1: 'duck', 2: 'bunny', 3: 'pig', 4: 'bear' } as const;
export type FriendWeight = keyof typeof FRIEND_FOR;

export interface SeesawRound {
  /** Already sitting on the seesaw, and not movable. */
  fixed: Thing[];
  /** Where the fixed things sit. */
  fixedSide: Side;
  /** Waiting on the grass. */
  offered: Thing[];
  /** The number to say at the end of a mystery round, or the weight to match. */
  answer: number;
  /** Things that start on the other tray (the take-the-same-off levels start balanced). */
  across?: Thing[];
}

export const other = (side: Side): Side => (side === 'left' ? 'right' : 'left');
export const total = (things: readonly Thing[]) => things.reduce((sum, t) => sum + t.weight, 0);

export type BalanceObservation = 'heavy-down' | 'equal-level';

/** What a child can observe after changing the trays. Empty trays do not demonstrate either rule. */
export function balanceObservation(left: number, right: number): BalanceObservation | null {
  if (left === 0 && right === 0) return null;
  return left === right ? 'equal-level' : 'heavy-down';
}

/** Which side is down, or null when level. */
export function downSide(left: number, right: number): Side | null {
  return left === right ? null : left > right ? 'left' : 'right';
}

/** How far the seesaw leans, in radians: positive when the right side is down. A bigger difference leans more. */
export function tilt(left: number, right: number): number {
  const d = right - left;
  if (d === 0) return 0;
  return Math.sign(d) * Math.min(MAX_TILT, 0.1 + 0.04 * (Math.abs(d) - 1));
}
export const MAX_TILT = 0.24;

/** Comparing what the child added with what was already there. */
export type Weighing = 'under' | 'level' | 'over';
export const weigh = (fixed: number, added: number): Weighing => (added === fixed ? 'level' : added < fixed ? 'under' : 'over');

/** The ways to make `n` from some of the offered weights (each used once). */
export function ways(n: number, weights: readonly number[]): number[][] {
  const out: number[][] = [];
  const walk = (i: number, left: number, picked: number[]) => {
    if (left === 0) out.push(picked);
    if (left <= 0 || i >= weights.length) return;
    walk(i + 1, left - weights[i], [...picked, weights[i]]);
    walk(i + 1, left, picked);
  };
  walk(0, n, []);
  return out;
}

const friend = (weight: number): Thing => ({ kind: 'friend', weight });
const blocks = (n: number): Thing[] => Array.from({ length: n }, () => ({ kind: 'block', weight: 1 }));

export function makeRounds(plan: SeesawPlan, rng: Rng): SeesawRound[] {
  const rounds: SeesawRound[] = [];
  let last = 0;
  // A different number from last round where there is a choice, so each round is a fresh look.
  const fresh = (min: number, max: number) => {
    let n = rng.int(min, max);
    for (let tries = 0; n === last && max > min && tries < 10; tries++) n = rng.int(min, max);
    return (last = n);
  };
  for (let r = 0; r < plan.rounds; r++) {
    const fixedSide: Side = rng.chance(0.5) ? 'left' : 'right';
    switch (plan.mode) {
      case 'up': {
        const rider = fresh(1, 2);
        const bigger = rng.shuffle([2, 3, 4].filter((w) => w > rider)).slice(0, 2);
        rounds.push({ fixed: [friend(rider)], fixedSide, offered: rng.shuffle(bigger.map(friend)), answer: rider });
        break;
      }
      case 'heavy': {
        const rider = fresh(2, 3);
        const lighter = rng.int(1, rider - 1);
        const heavier = rng.int(rider + 1, 4);
        rounds.push({ fixed: [friend(rider)], fixedSide, offered: rng.shuffle([friend(lighter), friend(heavier)]), answer: rider });
        break;
      }
      case 'level': {
        const w = fresh(2, 4);
        rounds.push({ fixed: [friend(w)], fixedSide, offered: blocks(w + 2), answer: w });
        break;
      }
      case 'heaviest': {
        const weights = rng.shuffle([1, 2, 3, 4]).slice(0, 3);
        rounds.push({ fixed: [], fixedSide, offered: weights.map((weight) => ({ kind: 'present', weight })), answer: Math.max(...weights) });
        break;
      }
      case 'parts': {
        const n = fresh(4, 7);
        // Two weights that make n, set out on the seesaw; the child makes n another way or the same way.
        const pairs = ways(n, [1, 2, 3, 4]).filter((w) => w.length === 2);
        const pair = rng.pick(pairs);
        rounds.push({
          fixed: pair.map((weight) => ({ kind: 'weight', weight })),
          fixedSide,
          offered: rng.shuffle([1, 2, 3, 4]).map((weight) => ({ kind: 'weight', weight })),
          answer: n,
        });
        break;
      }
      case 'same': {
        // Box + k blocks balance m + k blocks; with two boxes, a box stands on the other side too.
        const m = fresh(2, 4);
        const k = rng.int(1, 2);
        const boxes = (n: number): Thing[] => Array.from({ length: n }, () => ({ kind: 'box', weight: m }));
        const two = plan.boxes === 2;
        rounds.push({ fixed: [...boxes(two ? 2 : 1), ...blocks(k)], fixedSide, offered: [], across: [...boxes(two ? 1 : 0), ...blocks(m + k)], answer: m });
        break;
      }
      case 'mystery': {
        const m = fresh(2, plan.boxes === 2 ? 3 : 5);
        rounds.push({ fixed: Array.from({ length: plan.boxes ?? 1 }, () => ({ kind: 'box', weight: m })), fixedSide, offered: blocks(plan.boxes === 2 ? 7 : 6), answer: m });
        break;
      }
    }
  }
  return rounds;
}

/** Three number choices: the answer and two near neighbours, all at least 1. */
export function numberChoices(rng: Rng, answer: number): number[] {
  const near = [answer - 2, answer - 1, answer + 1, answer + 2].filter((v) => v >= 1);
  return rng.shuffle([answer, ...rng.shuffle(near).slice(0, 2)]);
}

/** Take-the-same-off levels: the side where one box stands alone while the other side holds only blocks. */
export function aloneSide(sides: Record<Side, readonly Thing[]>): Side | null {
  for (const side of ['left', 'right'] as Side[]) {
    const here = sides[side];
    const there = sides[other(side)];
    if (here.length === 1 && here[0].kind === 'box' && there.length > 0 && there.every((t) => t.kind === 'block')) return side;
  }
  return null;
}

export interface SeesawTouchItem {
  thing: Thing;
  fixed: boolean;
  side: Side | null;
  inWagon?: boolean;
  /** Heaviest mode: this present has already taken a turn on a tray. */
  tested?: boolean;
}

export type SeesawTouch = { kind: 'move'; item: number; to: Side | 'ground' | 'wagon' } | { kind: 'answer'; value: number };

/** Indexes of a subset that makes `need`, or null when none does. */
function completion(items: readonly SeesawTouchItem[], indexes: readonly number[], need: number): number[] | null {
  if (need === 0) return [];
  if (need < 0 || !indexes.length) return null;
  const [first, ...rest] = indexes;
  const withFirst = completion(items, rest, need - items[first].thing.weight);
  if (withFirst) return [first, ...withFirst];
  return completion(items, rest, need);
}

/**
 * The next real drag or number tap in a clean round. Heaviest mode runs a small tournament; take-the-same-off
 * removes a matching thing from the heavy side after each deliberate tip.
 */
export function seesawTouch(plan: SeesawPlan, round: SeesawRound, items: readonly SeesawTouchItem[], numbers = false): SeesawTouch | null {
  if (numbers) return { kind: 'answer', value: round.answer };
  const target = other(round.fixedSide);
  const loose = items.map((item, index) => ({ item, index })).filter(({ item }) => !item.fixed && !item.inWagon);
  const on = (side: Side) => loose.filter(({ item }) => item.side === side);
  const ground = loose.filter(({ item }) => item.side === null);
  const weight = (side: Side) => total(on(side).map(({ item }) => item.thing));

  if (plan.mode === 'up') {
    const pick = ground.find(({ item }) => item.thing.weight > total(round.fixed));
    return pick ? { kind: 'move', item: pick.index, to: target } : null;
  }
  if (plan.mode === 'heavy') {
    const pick = ground.find(({ item }) => item.thing.weight > round.answer);
    return pick ? { kind: 'move', item: pick.index, to: target } : null;
  }
  if (plan.mode === 'level' || plan.mode === 'mystery' || plan.mode === 'parts') {
    const need = total(round.fixed) - weight(target);
    if (need <= 0) return null;
    const way = completion(items, ground.map(({ index }) => index), need);
    return way?.length ? { kind: 'move', item: way[0], to: target } : null;
  }
  if (plan.mode === 'heaviest') {
    const untested = ground.find(({ item }) => !item.tested);
    const left = on('left')[0];
    const right = on('right')[0];
    if (!left && untested) return { kind: 'move', item: untested.index, to: 'left' };
    if (!right && untested) return { kind: 'move', item: untested.index, to: 'right' };
    if (untested && left && right) return { kind: 'move', item: untested.index, to: left.item.thing.weight < right.item.thing.weight ? 'left' : 'right' };
    if (left && right) return { kind: 'move', item: left.item.thing.weight > right.item.thing.weight ? left.index : right.index, to: 'wagon' };
    return null;
  }

  // Take the same kind off both sides. At level, begin a pair; while tipped, remove one item whose weight restores equality.
  const leftWeight = weight('left');
  const rightWeight = weight('right');
  if (leftWeight !== rightWeight) {
    const heavy: Side = leftWeight > rightWeight ? 'left' : 'right';
    const difference = Math.abs(leftWeight - rightWeight);
    const match = on(heavy).find(({ item }) => item.thing.weight === difference);
    return match ? { kind: 'move', item: match.index, to: 'ground' } : null;
  }
  const sides = { left: on('left').map(({ item }) => item.thing), right: on('right').map(({ item }) => item.thing) };
  if (aloneSide(sides)) return null;
  const boxes = { left: on('left').filter(({ item }) => item.thing.kind === 'box'), right: on('right').filter(({ item }) => item.thing.kind === 'box') };
  if (boxes.left.length && boxes.right.length && (boxes.left.length > 1 || boxes.right.length > 1)) {
    const side: Side = boxes.left.length > boxes.right.length ? 'left' : 'right';
    return { kind: 'move', item: boxes[side][0].index, to: 'ground' };
  }
  const side: Side = on(round.fixedSide).some(({ item }) => item.thing.kind === 'block') ? round.fixedSide : other(round.fixedSide);
  const block = on(side).find(({ item }) => item.thing.kind === 'block');
  return block ? { kind: 'move', item: block.index, to: 'ground' } : null;
}
