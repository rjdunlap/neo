import { Rng } from '../../engine/random';

/**
 * Seesaw Balance, after Hasee Bounce and playground balance toys: put friends and blocks on a big
 * seesaw and watch it tip. The ladder goes from "make your friend go up" to heavier and lighter,
 * balancing with blocks, finding the heaviest of look-alike presents, making the same weight two ways,
 * and weighing a mystery box. Things sit on level trays at the ends, so only weight matters, never
 * how far out something sits. The early-school steps, after DragonBox and PhET's Equality Explorer, start
 * balanced with a box and blocks on one side: take the same off both sides until the box is alone. The top step,
 * after SolveMe Mobiles, weighs a square box first and then uses its number to find a round box (substitution).
 */
export type SeesawMode = 'sort' | 'guess' | 'difference' | 'bounce' | 'compare' | 'up' | 'heavy' | 'level' | 'heaviest' | 'parts' | 'mystery' | 'same' | 'share' | 'pair';
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
  { mode: 'share', rounds: 3, name: 'Take the same off both sides, then share the blocks between two identical boxes' },
  { mode: 'pair', rounds: 2, name: 'Two different boxes: read the square box, then take the same off both sides until the round box is alone' },
  { mode: 'bounce', rounds: 4, name: 'Wheee! Touch the empty end to lift a little friend' },
  { mode: 'compare', rounds: 3, name: 'Who is heavier? Tap the heavier or lighter friend on the tipped trays' },
  { mode: 'sort', rounds: 3, name: 'Line them up: test three presents, then order them from light to heavy' },
  { mode: 'guess', rounds: 3, name: 'Guess the pumpkin: guess freely, measure with blocks, then say its weight' },
  { mode: 'difference', rounds: 3, name: 'How much heavier? Add blocks to the light side, then say the difference' },
];

export const planFor = (level: number) => PLANS[Math.min(PLANS.length, Math.max(1, level)) - 1];

export type ThingKind = 'friend' | 'block' | 'weight' | 'present' | 'box';

export interface Thing {
  kind: ThingKind;
  weight: number;
  /** Level 11's two different boxes; other boxes leave it unset. */
  shape?: 'square' | 'round';
  /** A friend's face, drawn from the pool for its weight. */
  face?: FriendFace;
  /** A present's wrapping. */
  wrap?: Wrapping;
  /** The mystery box's look at levels 6 and 7 (the same footprint either way). */
  look?: BoxLook;
}

export type Wrapping = 'plain' | 'dots' | 'stripes';
export const WRAPPINGS: readonly Wrapping[] = ['plain', 'dots', 'stripes'];
export type BoxLook = 'parcel' | 'crate' | 'pumpkin';
export const BOX_LOOKS: readonly BoxLook[] = ['parcel', 'crate'];

/** Friends by weight: the bigger the friend, the heavier. */
export const FRIEND_FOR = { 1: 'duck', 2: 'bunny', 3: 'pig', 4: 'bear' } as const;
export type FriendWeight = keyof typeof FRIEND_FOR;
/** The faces a round may draw for each weight; a face belongs to one weight, so a round's friends never share one. */
export const FACES_FOR = { 1: ['duck', 'cat'], 2: ['bunny', 'dog'], 3: ['pig', 'cow'], 4: ['bear'] } as const;
export type FriendFace = (typeof FACES_FOR)[FriendWeight][number];
/** How big a friend is drawn: size says weight, whatever the face. */
export const friendScale = (weight: number) => 0.3 + 0.07 * weight;

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
  /** Level 11: a pair is a reading of the square box, then the round box weighed with it. */
  phase?: 'read' | 'pair';
  prediction?: number;
  asked?: 'heavier' | 'lighter';
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

const blocks = (n: number): Thing[] => Array.from({ length: n }, () => ({ kind: 'block', weight: 1 }));

export function makeRounds(plan: SeesawPlan, rng: Rng): SeesawRound[] {
  const rounds: SeesawRound[] = [];
  // Faces, wrappings and box looks come from their own stream, seeded from this one without using it up, so the numbers and sides of a seed are the same as before.
  const looks = new Rng(Math.floor(rng.clone().next() * 4294967296) ^ 0x5bd1e995);
  const friend = (weight: number): Thing => ({ kind: 'friend', weight, face: looks.pick([...FACES_FOR[weight as FriendWeight]]) });
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
      case 'bounce': {
        const rider = r === 0 ? 1 : fresh(1, 2);
        rounds.push({ fixed: [r === 0 ? { kind: 'friend', weight: 1, face: 'duck' } : friend(rider)], fixedSide, offered: [friend(rng.int(rider + 1, 4))], answer: rider });
        break;
      }
      case 'compare': {
        const weights = rng.shuffle([1, 2, 3, 4]).slice(0, 2);
        const asked = r % 2 === 0 ? 'heavier' : 'lighter';
        rounds.push({ fixed: [friend(weights[0])], fixedSide, across: [friend(weights[1])], offered: [], asked,
          answer: asked === 'heavier' ? Math.max(...weights) : Math.min(...weights) });
        break;
      }
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
      case 'sort':
      case 'heaviest': {
        const weights = rng.shuffle([1, 2, 3, 4]).slice(0, 3);
        rounds.push({ fixed: [], fixedSide, offered: weights.map((weight) => ({ kind: 'present', weight, wrap: looks.pick([...WRAPPINGS]) })), answer: Math.max(...weights) });
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
      case 'share': {
        // Three boxes + k blocks balance one box + twice the box weight + k blocks.
        // Taking equal things away leaves two equal boxes facing two equal groups of blocks.
        const m = fresh(2, 4);
        const k = rng.int(1, 2);
        const boxes = (n: number): Thing[] => Array.from({ length: n }, () => ({ kind: 'box', weight: m }));
        rounds.push({ fixed: [...boxes(3), ...blocks(k)], fixedSide, offered: [], across: [...boxes(1), ...blocks(2 * m + k)], answer: m });
        break;
      }
      case 'pair': {
        // Square s alone against s blocks, then square + round r + k blocks against s + r + k blocks.
        const s = fresh(2, 4);
        const r = rng.pick([1, 2, 3, 4].filter((w) => w !== s));
        const k = rng.int(1, 2);
        const square = (): Thing => ({ kind: 'box', weight: s, shape: 'square' });
        rounds.push({ fixed: [square()], fixedSide, offered: [], across: blocks(s), answer: s, phase: 'read' });
        rounds.push({ fixed: [square(), { kind: 'box', weight: r, shape: 'round' }, ...blocks(k)], fixedSide, offered: [], across: blocks(s + r + k), answer: r, phase: 'pair' });
        break;
      }
      case 'difference': {
        const heavy = fresh(3, 6);
        const light = rng.int(2, heavy - 1);
        rounds.push({ fixed: [{ kind: 'weight', weight: heavy }], fixedSide, across: [{ kind: 'weight', weight: light }], offered: blocks(6), answer: heavy - light });
        break;
      }
      case 'guess': {
        const m = fresh(2, 6);
        rounds.push({ fixed: [{ kind: 'box', weight: m, look: 'pumpkin' }], fixedSide, offered: blocks(6), answer: m });
        break;
      }
      case 'mystery': {
        const m = fresh(2, plan.boxes === 2 ? 3 : 5);
        const look = looks.pick([...BOX_LOOKS]);
        rounds.push({ fixed: Array.from({ length: plan.boxes ?? 1 }, (): Thing => ({ kind: 'box', weight: m, look })), fixedSide, offered: blocks(plan.boxes === 2 ? 7 : 6), answer: m });
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

/** Level 10: two identical boxes face only blocks, so the blocks can be shared between them. */
export function shareSide(sides: Record<Side, readonly Thing[]>): Side | null {
  for (const side of ['left', 'right'] as Side[]) {
    const here = sides[side];
    const there = sides[other(side)];
    if (here.length === 2 && here.every((t) => t.kind === 'box') && there.length > 0 && there.every((t) => t.kind === 'block')) return side;
  }
  return null;
}

/** Level 11: what a change did to the tilt, from the gap between the trays before and after it. */
export type Progress = 'level' | 'closer' | 'tip';
export function progress(before: number, after: number): Progress {
  if (after === 0) return 'level';
  return after < before ? 'closer' : 'tip';
}

/** The round box is the thing being weighed: it never leaves its tray. */
export const stays = (thing: Thing) => thing.shape === 'round';

/**
 * Level 11's glow after two tips: on the heavy side, the removable thing whose weight is the gap, else a
 * block; if the heavy side has nothing to give, something on the grass to put back on the light side
 * (the last thing taken from there when it fits the gap, else a block). Returns an item index, or null when level.
 */
export function pairHint(items: readonly SeesawTouchItem[], lastOff: number | null): number | null {
  const sum = (side: Side) => total(items.filter((i) => i.side === side).map((i) => i.thing));
  const heavy = downSide(sum('left'), sum('right'));
  if (!heavy) return null;
  const gap = Math.abs(sum('left') - sum('right'));
  const all = items.map((item, index) => ({ item, index }));
  const removable = all.filter(({ item }) => item.side === heavy && !stays(item.thing));
  const take = removable.find(({ item }) => item.thing.weight === gap) ?? removable.find(({ item }) => item.thing.kind === 'block');
  if (take) return take.index;
  const last = lastOff === null ? null : all[lastOff];
  if (last && last.item.side === null && last.item.thing.weight <= gap) return last.index;
  return all.find(({ item }) => item.side === null && item.thing.kind === 'block')?.index ?? null;
}

export interface SeesawTouchItem {
  thing: Thing;
  fixed: boolean;
  side: Side | null;
  inWagon?: boolean;
  /** Heaviest mode: this present has already taken a turn on a tray. */
  tested?: boolean;
  shelf?: number;
}

export type SeesawTouch = { kind: 'tray'; side: Side } | { kind: 'friend'; item: number } | { kind: 'move'; item: number; to: Side | 'ground' | 'wagon' | number } | { kind: 'answer'; value: number };

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
  if (plan.mode === 'bounce') return { kind: 'tray', side: other(round.fixedSide) };
  if (plan.mode === 'compare') {
    const item = items.findIndex((i) => i.thing.weight === round.answer);
    return item < 0 ? null : { kind: 'friend', item };
  }
  if (plan.mode === 'guess' && round.prediction === undefined) return { kind: 'answer', value: round.answer };
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
  if (plan.mode === 'level' || plan.mode === 'mystery' || plan.mode === 'parts' || plan.mode === 'guess' || plan.mode === 'difference') {
    const need = total(round.fixed) - total(round.across ?? []) - weight(target);
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

  if (plan.mode === 'pair') {
    // The round box never moves. While tipped, take the gap's worth (or a block) off the heavy side; while
    // level, clear the spare blocks from the box side first, then the tagged square box.
    const sum = (side: Side) => total(items.filter((i) => i.side === side).map((i) => i.thing));
    const l = sum('left');
    const r = sum('right');
    if (l !== r) {
      const heavy: Side = l > r ? 'left' : 'right';
      const pick = on(heavy).find(({ item }) => item.thing.weight === Math.abs(l - r)) ?? on(heavy).find(({ item }) => item.thing.kind === 'block');
      return pick ? { kind: 'move', item: pick.index, to: 'ground' } : null;
    }
    const sides = { left: items.filter((i) => i.side === 'left').map((i) => i.thing), right: items.filter((i) => i.side === 'right').map((i) => i.thing) };
    if (aloneSide(sides)) return null;
    const box = on(round.fixedSide);
    const pick = box.find(({ item }) => item.thing.kind === 'block') ?? box.find(({ item }) => item.thing.shape === 'square');
    return pick ? { kind: 'move', item: pick.index, to: 'ground' } : null;
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
  if (aloneSide(sides) || (plan.mode === 'share' && shareSide(sides))) return null;
  const boxes = { left: on('left').filter(({ item }) => item.thing.kind === 'box'), right: on('right').filter(({ item }) => item.thing.kind === 'box') };
  if (boxes.left.length && boxes.right.length && (boxes.left.length > 1 || boxes.right.length > 1)) {
    const side: Side = boxes.left.length > boxes.right.length ? 'left' : 'right';
    return { kind: 'move', item: boxes[side][0].index, to: 'ground' };
  }
  const side: Side = on(round.fixedSide).some(({ item }) => item.thing.kind === 'block') ? round.fixedSide : other(round.fixedSide);
  const block = on(side).find(({ item }) => item.thing.kind === 'block');
  return block ? { kind: 'move', item: block.index, to: 'ground' } : null;
}

/** A visible pair result, recorded only after both presents have landed on the trays. */
export interface PairReading { lighter: number; heavier: number }

/** Sort by three observed pair tests. This planner never reads an item's hidden weight. */
export function sortTouch(items: readonly SeesawTouchItem[], readings: readonly PairReading[]): SeesawTouch | null {
  const indexes = items.map((_, i) => i);
  for (let a = 0; a < indexes.length; a++) for (let b = a + 1; b < indexes.length; b++) {
    if (readings.some(r => (r.lighter === a && r.heavier === b) || (r.lighter === b && r.heavier === a))) continue;
    if (items[a].side !== 'left') return { kind: 'move', item: a, to: 'left' };
    if (items[b].side !== 'right') return { kind: 'move', item: b, to: 'right' };
    return null; // Wait for the trays to settle and record their result.
  }
  const ordered = indexes.sort((a, b) => readings.filter(r => r.heavier === a).length - readings.filter(r => r.heavier === b).length);
  const slot = ordered.findIndex((i, rank) => items[i].shelf !== rank);
  return slot < 0 ? null : { kind: 'move', item: ordered[slot], to: slot };
}

export function predictionComparison(guess: number, answer: number): 'exact' | 'close' | 'more' | 'less' {
  return guess === answer ? 'exact' : Math.abs(guess - answer) === 1 ? 'close' : answer > guess ? 'more' : 'less';
}
