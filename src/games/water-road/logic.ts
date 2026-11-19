/**
 * Water Road rules: one rule decides every level. A ring of stones stands when it is closed (no gap) and pushed back at
 * both ends (a low wall or a placed block on each side). Level 1 closes the ring stone by stone and pulls the frame;
 * level 2 pulls pairs of frames, one closed and one with a gap, and asks on the last pair which will stand; level 3 puts
 * a buttress block where the arch has nothing to push on, then pulls. No physics: every pull is decided here and shown
 * by a tumble. Definition: docs/definitions/water-road.md.
 */
import type { Rng } from '../../engine/random';
import type { Band } from '../../progress/bands';
import type { BandLevels } from '../../progress/difficulty';

export type Side = 'left' | 'right';
export type Block = 'tray' | Side;
export type GapPlace = 'top' | 'left' | 'right';

export interface Arch {
  /** Seeded odd count, so there is exactly one keystone. */
  stones: number;
  /** Null when the ring is closed; otherwise the index of the missing stone (0 is the left springer). */
  gap: number | null;
  left: { held: boolean };
  right: { held: boolean };
}

/** The one rule: a ring that is closed and pushed back at both ends stands. */
export function stands(arch: Arch): boolean {
  return arch.gap === null && arch.left.held && arch.right.held;
}

/** The keystone's index: the middle of an odd ring. */
export function keystone(count: number): number {
  return (count - 1) / 2;
}

/** The order stones take their places: left springer, right springer, then alternating inward, so the keystone is last. */
export function placeOrder(count: number): number[] {
  const out: number[] = [];
  for (let i = 0; i < keystone(count); i++) out.push(i, count - 1 - i);
  out.push(keystone(count));
  return out;
}

/** Where the gap is, in the words the pet uses; defined exactly when the ring is open. */
export function explain(arch: Arch): GapPlace | null {
  if (arch.gap === null) return null;
  const k = keystone(arch.stones);
  return arch.gap === k ? 'top' : arch.gap < k ? 'left' : 'right';
}

/** Which side has nothing pushing back, or null when both are held. */
export function hintFor(arch: Arch): Side | null {
  if (!arch.left.held) return 'left';
  if (!arch.right.held) return 'right';
  return null;
}

/** The arch as it is with the block in `block`'s place. */
export function withBlock(arch: Arch, block: Block): Arch {
  return {
    ...arch,
    left: { held: arch.left.held || block === 'left' },
    right: { held: arch.right.held || block === 'right' },
  };
}

const closedArch = (stones: number): Arch => ({
  stones,
  gap: null,
  left: { held: true },
  right: { held: true },
});

// ——— Level 1: Keystone ———

export interface KeystonePlan {
  level: 1;
  stones: number;
  /** Cosmetic tints per stone index (0..2 into the stone swatches); never a rule. */
  tints: number[];
}

export interface KeystoneState {
  /** How many stones have taken their places. */
  placed: number;
  pulled: boolean;
}

/** Three stones at toddler, five or seven from preschool on; both sides walled. */
export function keystonePlan(band: Band, rng: Rng): KeystonePlan {
  const stones = band === 'lap' || band === 'toddler' ? 3 : rng.pick([5, 7]);
  return { level: 1, stones, tints: Array.from({ length: stones }, () => rng.int(0, 2)) };
}

export const keystoneStart = (): KeystoneState => ({ placed: 0, pulled: false });

/** The arch at level 1 is always closed and held once every stone is placed. */
export function keystoneArch(plan: KeystonePlan): Arch {
  return closedArch(plan.stones);
}

/** Any tap on the stage lifts the next stone; the last one is the keystone. Nothing counts. */
export function tapPile(
  plan: KeystonePlan,
  s: KeystoneState,
): { state: KeystoneState; event: 'stone' | 'keystone' | 'full'; index: number | null } {
  if (s.pulled || s.placed >= plan.stones) return { state: s, event: 'full', index: null };
  const index = placeOrder(plan.stones)[s.placed];
  const placed = s.placed + 1;
  return { state: { ...s, placed }, event: placed === plan.stones ? 'keystone' : 'stone', index };
}

/** The pull: only a closed ring comes off its frame; before that the frame wobbles, free. */
export function pullKeystone(
  plan: KeystonePlan,
  s: KeystoneState,
): { state: KeystoneState; event: 'pulled' | 'wobble' | 'none' } {
  if (s.pulled) return { state: s, event: 'none' };
  if (s.placed < plan.stones) return { state: s, event: 'wobble' };
  return { state: { ...s, pulled: true }, event: 'pulled' };
}

// ——— Level 2: Which one stands? ———

export interface Pair {
  count: number;
  arches: [Arch, Arch];
  /** The side holding the closed ring. */
  closed: 0 | 1;
}

export interface PairsPlan {
  level: 2;
  pairs: Pair[];
  tints: number[][][];
}

export interface PairsState {
  pair: number;
  pulled: [boolean, boolean];
  /** The asked pair has been answered. */
  done: boolean;
}

/** Two free pairs and one asked pair. */
export const PAIRS = 3;

/** Five stones with the gap at the keystone at preschool; five or seven with the gap at the keystone or a shoulder at pre-K and up. */
export function pairsPlan(band: Band, rng: Rng): PairsPlan {
  const older = band === 'prek' || band === 'school' || band === 'grownup';
  const pairs: Pair[] = [];
  const tints: number[][][] = [];
  for (let p = 0; p < PAIRS; p++) {
    const count = older ? rng.pick([5, 7]) : 5;
    const k = keystone(count);
    // A shoulder: any stone but the keystone and the two springers.
    const shoulders = Array.from({ length: count }, (_, i) => i).filter(
      (i) => i !== k && i !== 0 && i !== count - 1,
    );
    const gap = older && rng.int(0, 1) === 1 ? rng.pick(shoulders) : k;
    const closed = rng.int(0, 1) as 0 | 1;
    const open: Arch = { ...closedArch(count), gap };
    pairs.push({
      count,
      arches: closed === 0 ? [closedArch(count), open] : [open, closedArch(count)],
      closed,
    });
    tints.push([0, 1].map(() => Array.from({ length: count }, () => rng.int(0, 2))));
  }
  return { level: 2, pairs, tints };
}

export const pairsStart = (): PairsState => ({ pair: 0, pulled: [false, false], done: false });

export const isAsked = (plan: PairsPlan, s: PairsState) => s.pair === plan.pairs.length - 1;

/** A free pull: the frame comes away and the ring stands or falls; a pulled frame or the asked pair takes no free pull. */
export function pullFree(
  plan: PairsPlan,
  s: PairsState,
  side: 0 | 1,
): { state: PairsState; event: 'stands' | 'falls' | 'none' } {
  if (isAsked(plan, s) || s.pulled[side] || s.done) return { state: s, event: 'none' };
  const pulled: [boolean, boolean] = [s.pulled[0], s.pulled[1]];
  pulled[side] = true;
  const arch = plan.pairs[s.pair].arches[side];
  return { state: { ...s, pulled }, event: stands(arch) ? 'stands' : 'falls' };
}

/** After both frames of a free pair are pulled, the next pair. */
export function nextPair(s: PairsState): PairsState {
  return { pair: s.pair + 1, pulled: [false, false], done: false };
}

/** The asked pair: the closed ring finishes; the open one is a miss and both stay on their frames. */
export function predict(
  plan: PairsPlan,
  s: PairsState,
  side: 0 | 1,
): { state: PairsState; event: 'stands' | 'wrong' | 'none' } {
  if (!isAsked(plan, s) || s.done) return { state: s, event: 'none' };
  const pair = plan.pairs[s.pair];
  if (side === pair.closed) return { state: { ...s, pulled: [true, true], done: true }, event: 'stands' };
  return { state: s, event: 'wrong' };
}

// ——— Level 3: Hold it up ———

export interface ButtressPlan {
  level: 3;
  arches: Arch[];
  tints: number[][];
}

export interface ButtressState {
  arch: number;
  block: Block;
  /** The current arch has been pulled standing. */
  standing: boolean;
}

/** Two closed arches, five or seven stones; exactly one side walled at pre-K, and at school the second may be walled on both. */
export function buttressPlan(band: Band, rng: Rng): ButtressPlan {
  const arches: Arch[] = [];
  const tints: number[][] = [];
  for (let a = 0; a < 2; a++) {
    const count = rng.pick([5, 7]);
    const both = band === 'school' && a === 1 && rng.int(0, 1) === 1;
    const walled: Side = rng.int(0, 1) === 0 ? 'left' : 'right';
    arches.push({
      stones: count,
      gap: null,
      left: { held: both || walled === 'left' },
      right: { held: both || walled === 'right' },
    });
    tints.push(Array.from({ length: count }, () => rng.int(0, 2)));
  }
  return { level: 3, arches, tints };
}

export const buttressStart = (): ButtressState => ({ arch: 0, block: 'tray', standing: false });

/** The block goes to a slot or back to the tray, free. */
export function place(s: ButtressState, block: Block): ButtressState {
  return s.standing ? s : { ...s, block };
}

/** The pull, the one commit: the arch as held stands, or it spreads on the side with nothing pushing back (one miss). */
export function pull(
  plan: ButtressPlan,
  s: ButtressState,
): { state: ButtressState; stands: boolean; spread: Side | null } {
  if (s.standing) return { state: s, stands: true, spread: null };
  const arch = withBlock(plan.arches[s.arch], s.block);
  if (stands(arch)) return { state: { ...s, standing: true }, stands: true, spread: null };
  return { state: { ...s, block: 'tray' }, stands: false, spread: hintFor(arch) };
}

/** The next arch starts with the block in the tray. */
export function nextArch(s: ButtressState): ButtressState {
  return { arch: s.arch + 1, block: 'tray', standing: false };
}

// ——— Counting ———

/** Round totals; a glow lights after two misses in one part or on asked-for help, and counts one hint per part. */
export class Tally {
  misses = 0;
  hints = 0;
  here = 0;
  glowing = false;
  private counted = false;

  miss() {
    this.misses++;
    this.here++;
    if (this.here >= 2) this.light();
  }

  help() {
    this.light();
  }

  private light() {
    if (!this.counted) {
      this.counted = true;
      this.hints++;
    }
    this.glowing = true;
  }

  /** The next arch starts with its own glow and hint. */
  next() {
    this.here = 0;
    this.glowing = false;
    this.counted = false;
  }
}

// ——— The ghost finger ———

export type BotMove =
  { tap: 'pile' } | { tap: 'handle' } | { tap: 'frame'; side: 0 | 1 } | { drag: 'block'; to: Side };

/** What a capable child does next: never a wrong guess, never a pull with the block in the wrong place. */
export function botMove(
  plan: KeystonePlan | PairsPlan | ButtressPlan,
  state: KeystoneState | PairsState | ButtressState,
): BotMove | null {
  if (plan.level === 1) {
    const s = state as KeystoneState;
    if (s.pulled) return null;
    return s.placed < plan.stones ? { tap: 'pile' } : { tap: 'handle' };
  }
  if (plan.level === 2) {
    const s = state as PairsState;
    if (s.done || s.pair >= plan.pairs.length) return null;
    const pair = plan.pairs[s.pair];
    if (isAsked(plan, s)) return { tap: 'frame', side: pair.closed };
    if (!s.pulled[pair.closed]) return { tap: 'frame', side: pair.closed };
    const open = (1 - pair.closed) as 0 | 1;
    return s.pulled[open] ? null : { tap: 'frame', side: open };
  }
  const s = state as ButtressState;
  if (s.standing || s.arch >= plan.arches.length) return null;
  const need = hintFor(plan.arches[s.arch]);
  if (need && s.block !== need) return { drag: 'block', to: need };
  return { tap: 'handle' };
}

// ——— Plans for the grown-ups ———

export function planFor(level: number): {
  level: 1 | 2 | 3 | 4 | 5;
  id: 'keystone' | 'pairs' | 'buttress' | 'downhill' | 'valley';
  name: string;
} {
  if (level >= 5)
    return {
      level: 5,
      id: 'valley',
      name: 'Over the valley (school): arches across three or four spans and a block on each earth end, then open the spring (two valleys)',
    };
  if (level === 4)
    return {
      level: 4,
      id: 'downhill',
      name: 'Downhill all the way: pick the channel that goes down all the way (pre-K) or set two piers with arrows (school), then open the spring (two roads)',
    };
  if (level <= 1)
    return {
      level: 1,
      id: 'keystone',
      name: 'Keystone: tap and a stone flies onto the frame from each end in turn; the last one is the keystone; then pull the frame and the arch stands (3 stones at toddler, 5 or 7 from preschool)',
    };
  if (level === 2)
    return {
      level: 2,
      id: 'pairs',
      name: 'Which one stands? pull two frames and see which ring holds (two free pairs), then on the last pair tap the one that will stand before pulling',
    };
  return {
    level: 3,
    id: 'buttress',
    name: 'Hold it up: drag the block to the side with no wall and pull the frame; a pull with nothing pushing back spreads the ring (two arches)',
  };
}

export const LEVELS: BandLevels = {
  toddler: { min: 1, max: 1 },
  preschool: { min: 1, max: 2 },
  prek: { min: 2, max: 4 },
  school: { min: 3, max: 5 },
};

// ——— Levels 4–5: the water road ———
//
// Heights are whole steps from 0 (the town's ground) to 6. A road runs spring → piers → fountain; water runs only where
// every stretch drops at least one step, and a flat stretch stands still. Level 5 carries the falling channel over a
// valley on a row of arches: each arch is held on a side by a placed neighbour, or at an end by rock or an abutment.

export const MAX_STEP = 6;

export interface Road {
  spring: number;
  fountain: number;
  /** The interior pier tops, spring side first. */
  piers: number[];
}

/** Every height along the road, spring first. */
export const heights = (r: Road): number[] => [r.spring, ...r.piers, r.fountain];

/** The first stretch (from the spring) that does not drop, or null when the water runs all the way. */
export function firstStuck(r: Road): number | null {
  const h = heights(r);
  for (let i = 0; i + 1 < h.length; i++) if (h[i + 1] >= h[i]) return i;
  return null;
}

/** The one rule at level 4: every stretch goes down. */
export const falls = (r: Road): boolean => firstStuck(r) === null;

/** Why the water stopped: the stuck stretch climbs, or lies flat. */
export function stuckKind(r: Road): 'up' | 'flat' | null {
  const i = firstStuck(r);
  if (i === null) return null;
  const h = heights(r);
  return h[i + 1] > h[i] ? 'up' : 'flat';
}

const distance = (a: number[], b: number[]) => a.reduce((d, x, i) => d + Math.abs(x - b[i]), 0);
const sum = (a: number[]) => a.reduce((s, x) => s + x, 0);

/** Every setting of the piers within 0–6 under which the road falls. */
export function fallingSettings(r: Road): number[][] {
  const out: number[][] = [];
  const walk = (prefix: number[], above: number) => {
    if (prefix.length === r.piers.length) {
      if (above > r.fountain) out.push(prefix);
      return;
    }
    for (let h = Math.min(MAX_STEP, above - 1); h >= 0; h--) walk([...prefix, h], h);
  };
  walk([], r.spring);
  return out;
}

/** The falling setting fewest presses away; ties go to the lowest settings, then to the lower pier nearest the spring. */
export function nearestFalling(r: Road): number[] | null {
  const order = (a: number[], b: number[]) => {
    const d = distance(a, r.piers) - distance(b, r.piers);
    if (d !== 0) return d;
    const t = sum(a) - sum(b);
    if (t !== 0) return t;
    const i = a.findIndex((x, k) => x !== b[k]);
    return i < 0 ? 0 : a[i] - b[i];
  };
  const all = fallingSettings(r).sort(order);
  return all[0] ?? null;
}

/** Presses still needed to reach the nearest falling setting. */
export function pressesLeft(r: Road): number {
  const n = nearestFalling(r);
  return n ? distance(n, r.piers) : 0;
}

export interface PierHint {
  pier: number;
  dir: 1 | -1;
}

/** The pier and arrow the glow names: the first pier (from the spring) that differs from the nearest falling setting. */
export function pierHint(r: Road): PierHint | null {
  if (falls(r)) return null;
  const n = nearestFalling(r);
  if (!n) return null;
  const pier = n.findIndex((h, i) => h !== r.piers[i]);
  return pier < 0 ? null : { pier, dir: n[pier] > r.piers[pier] ? 1 : -1 };
}

/** An arrow press: the pier's top moves one step, or bumps softly at 0 or 6 (free either way). */
export function pressPier(r: Road, pier: number, dir: 1 | -1): { road: Road; bumped: boolean } {
  const h = r.piers[pier] + dir;
  if (h < 0 || h > MAX_STEP) return { road: r, bumped: true };
  return { road: { ...r, piers: r.piers.map((x, i) => (i === pier ? h : x)) }, bumped: false };
}

export interface DownhillRoad {
  spring: number;
  fountain: number;
  /** School: where her piers start (a falling setting made wrong by one pier). Pre-K: unused. */
  start: number[];
  /** Pre-K: the two whole channels' pier tops; exactly one falls. Null at school. */
  cards: [number[], number[]] | null;
  /** Pre-K: the card that falls. */
  good: 0 | 1;
}

export interface DownhillPlan {
  level: 4;
  kind: 'cards' | 'piers';
  roads: DownhillRoad[];
}

export interface DownhillState {
  road: number;
  /** The piers on the road now: hers at school; the chosen channel's at pre-K, or null before one is chosen. */
  piers: number[] | null;
  chosen: 0 | 1 | null;
  /** The current road has run to the fountain. */
  done: boolean;
}

export const ROADS = 2;

/** Pre-K picks one of two whole channels; school sets two piers with arrows. */
export const downhillKind = (band: Band): 'cards' | 'piers' =>
  band === 'school' || band === 'grownup' ? 'piers' : 'cards';

const decreasing = (rng: Rng, from: number, to: number, n: number): number[] | null => {
  // n heights strictly between `from` and `to`, strictly decreasing, chosen evenly from the gaps.
  const pool = Array.from({ length: from - to - 1 }, (_, i) => from - 1 - i);
  if (pool.length < n) return null;
  return rng
    .shuffle([...pool])
    .slice(0, n)
    .sort((a, b) => b - a);
};

function schoolRoad(rng: Rng, shape: 'hump' | 'dip'): DownhillRoad {
  for (let tries = 0; tries < 200; tries++) {
    const spring = rng.pick([5, 6]);
    const fountain = rng.pick([0, 1]);
    const good = decreasing(rng, spring, fountain, 2)!;
    const pier = rng.int(0, 1);
    const start = [...good];
    if (shape === 'hump') {
      const before = pier === 0 ? spring : good[0];
      start[pier] = Math.min(MAX_STEP, before + rng.int(0, 1));
    } else {
      start[pier] = Math.max(0, fountain - rng.int(0, 1));
    }
    const road: Road = { spring, fountain, piers: start };
    const hint = pierHint(road);
    if (falls(road) || !hint) continue;
    if (shape === 'hump' && (hint.dir !== -1 || start[pier] < (pier === 0 ? spring : start[0]))) continue;
    if (shape === 'dip' && hint.dir !== 1) continue;
    return { spring, fountain, start, cards: null, good: 0 };
  }
  return shape === 'hump'
    ? { spring: 6, fountain: 0, start: [6, 2], cards: null, good: 0 }
    : { spring: 6, fountain: 0, start: [3, 0], cards: null, good: 0 };
}

function cardRoad(rng: Rng): DownhillRoad {
  for (let tries = 0; tries < 400; tries++) {
    const climb = rng.int(0, 2);
    const spring = rng.int(3, 6);
    const fountain = rng.int(0, 2);
    if (spring - fountain < 3) continue;
    const fallsCard = decreasing(rng, spring, fountain, 2)!;
    const bad = [rng.int(0, MAX_STEP), rng.int(0, MAX_STEP)];
    const h = [spring, ...bad, fountain];
    let ok = true;
    for (let i = 0; i < 3; i++) {
      const rise = h[i + 1] - h[i];
      if (i === climb ? rise < 2 : rise >= 0) ok = false;
    }
    if (!ok) continue;
    const good = rng.int(0, 1) as 0 | 1;
    const cards: [number[], number[]] = good === 0 ? [fallsCard, bad] : [bad, fallsCard];
    return { spring, fountain, start: [], cards, good };
  }
  return {
    spring: 5,
    fountain: 0,
    start: [],
    cards: [
      [3, 1],
      [1, 4],
    ],
    good: 0,
  };
}

/** Two roads, one at a time: road 1 starts with a hump (the first useful move is down), road 2 with a dip. */
export function downhillPlan(band: Band, rng: Rng): DownhillPlan {
  const kind = downhillKind(band);
  const roads =
    kind === 'cards' ? [cardRoad(rng), cardRoad(rng)] : [schoolRoad(rng, 'hump'), schoolRoad(rng, 'dip')];
  return { level: 4, kind, roads };
}

export function downhillStart(plan: DownhillPlan, road = 0): DownhillState {
  const r = plan.roads[road];
  return { road, piers: plan.kind === 'piers' ? [...r.start] : null, chosen: null, done: false };
}

/** The road as it stands now, or null at pre-K before a channel is chosen. */
export function roadNow(plan: DownhillPlan, s: DownhillState): Road | null {
  const r = plan.roads[s.road];
  return s.piers ? { spring: r.spring, fountain: r.fountain, piers: s.piers } : null;
}

/** Pre-K: lift a channel into the road (free; tapping the other swaps it). */
export function chooseChannel(plan: DownhillPlan, s: DownhillState, card: 0 | 1): DownhillState {
  const cards = plan.roads[s.road].cards;
  if (s.done || !cards) return s;
  return { ...s, chosen: card, piers: [...cards[card]] };
}

/** School: an arrow press under a pier (free). */
export function pressArrow(
  plan: DownhillPlan,
  s: DownhillState,
  pier: number,
  dir: 1 | -1,
): { state: DownhillState; bumped: boolean } {
  const road = roadNow(plan, s);
  if (s.done || !road || plan.kind !== 'piers') return { state: s, bumped: false };
  const r = pressPier(road, pier, dir);
  return { state: { ...s, piers: r.road.piers }, bumped: r.bumped };
}

/** Open the spring, the one commit: the water runs all the way, pools at the first stretch that does not drop (one miss), or (no channel yet) nothing happens. */
export function openSpring(
  plan: DownhillPlan,
  s: DownhillState,
): { state: DownhillState; event: 'falls' | 'stuck' | 'none'; at: number | null; why: 'up' | 'flat' | null } {
  const road = roadNow(plan, s);
  if (s.done || !road) return { state: s, event: 'none', at: null, why: null };
  if (falls(road)) return { state: { ...s, done: true }, event: 'falls', at: null, why: null };
  return { state: s, event: 'stuck', at: firstStuck(road), why: stuckKind(road) };
}

export const nextRoad = (plan: DownhillPlan, s: DownhillState): DownhillState =>
  downhillStart(plan, s.road + 1);

// ——— Level 5: Over the valley ———

export type End = 'near' | 'far';
export const ENDS: End[] = ['near', 'far'];

export interface Valley {
  spans: number;
  ends: Record<End, 'rock' | 'earth'>;
}

export interface ValleyPlan {
  level: 5;
  valleys: Valley[];
}

export interface Arcade {
  /** An arch stands on each span place that is true. */
  arches: boolean[];
  /** An abutment sits on each end slot that is true. */
  abut: Record<End, boolean>;
}

export interface ValleyState {
  valley: number;
  arcade: Arcade;
  done: boolean;
}

export const VALLEYS = 2;

/** The first valley has three spans, one end rock and one earth; the second three or four, and may have both ends earth. */
export function valleyPlan(rng: Rng): ValleyPlan {
  const valleys: Valley[] = [];
  for (let v = 0; v < VALLEYS; v++) {
    const spans = v === 0 ? 3 : rng.pick([3, 4]);
    const bothEarth = v === 1 && rng.int(0, 2) === 0;
    const rock: End = rng.int(0, 1) === 0 ? 'near' : 'far';
    const ends: Record<End, 'rock' | 'earth'> = bothEarth
      ? { near: 'earth', far: 'earth' }
      : { near: rock === 'near' ? 'rock' : 'earth', far: rock === 'far' ? 'rock' : 'earth' };
    valleys.push({ spans, ends });
  }
  return { level: 5, valleys };
}

export const abutmentsFor = (v: Valley) => ENDS.filter((e) => v.ends[e] === 'earth').length;
export const emptyArcade = (v: Valley): Arcade => ({
  arches: Array.from({ length: v.spans }, () => false),
  abut: { near: false, far: false },
});
export const valleyStart = (valley = 0, v?: Valley): ValleyState => ({
  valley,
  arcade: emptyArcade(v ?? { spans: 3, ends: { near: 'rock', far: 'earth' } }),
  done: false,
});
export const archesInTray = (v: Valley, a: Arcade) => v.spans - a.arches.filter(Boolean).length;
export const abutmentsInTray = (v: Valley, a: Arcade) =>
  abutmentsFor(v) - ENDS.filter((e) => a.abut[e]).length;

/** Is the end held: rock needs nothing, earth needs an abutment. */
const endHeld = (v: Valley, a: Arcade, e: End) => v.ends[e] === 'rock' || a.abut[e];

/** Which sides of the arch on span `i` push back: a placed neighbour, or at an end the rock or an abutment. */
export function heldSides(v: Valley, a: Arcade, i: number): Record<End, boolean> {
  return {
    near: i > 0 ? a.arches[i - 1] : endHeld(v, a, 'near'),
    far: i < v.spans - 1 ? a.arches[i + 1] : endHeld(v, a, 'far'),
  };
}

/** The level-5 rule: every span holds an arch, and every arch is pushed back on both sides. */
export function standsArcade(v: Valley, a: Arcade): boolean {
  return a.arches.every((on, i) => on && heldSides(v, a, i).near && heldSides(v, a, i).far);
}

export type Problem = { kind: 'end'; end: End } | { kind: 'gap'; span: number };

/** The first problem from the spring end: an end arch with nothing at its end, or an empty span; null when it stands. */
export function firstUnsupported(v: Valley, a: Arcade): Problem | null {
  if (a.arches[0] && !endHeld(v, a, 'near')) return { kind: 'end', end: 'near' };
  for (let i = 0; i < v.spans; i++) if (!a.arches[i]) return { kind: 'gap', span: i };
  if (!endHeld(v, a, 'far')) return { kind: 'end', end: 'far' };
  return null;
}

/** Open the spring over the valley: it stands, or (one miss) every placed arch unheld on a side slides back to the tray. */
export function openValley(
  v: Valley,
  a: Arcade,
): { stands: boolean; problem: Problem | null; slid: number[]; arcade: Arcade } {
  const problem = firstUnsupported(v, a);
  if (!problem) return { stands: true, problem: null, slid: [], arcade: a };
  const slid = a.arches
    .map((on, i) => (on && !(heldSides(v, a, i).near && heldSides(v, a, i).far) ? i : -1))
    .filter((i) => i >= 0);
  return {
    stands: false,
    problem,
    slid,
    arcade: { arches: a.arches.map((on, i) => on && !slid.includes(i)), abut: { ...a.abut } },
  };
}

export type Place = { kind: 'span'; span: number } | { kind: 'end'; end: End } | { kind: 'tray' };

/** Move an arch (from a span or the tray) to a span or the tray; null when refused (a taken span, or nothing to move). */
export function moveArch(v: Valley, a: Arcade, from: number | 'tray', to: number | 'tray'): Arcade | null {
  if (from === to) return a;
  if (from === 'tray' ? archesInTray(v, a) <= 0 : !a.arches[from]) return null;
  if (to !== 'tray' && (to < 0 || to >= v.spans || a.arches[to])) return null;
  const arches = [...a.arches];
  if (from !== 'tray') arches[from] = false;
  if (to !== 'tray') arches[to] = true;
  return { ...a, arches };
}

/** Move an abutment (from an end or the tray) to an end slot or the tray; legal on rock too; null when refused. */
export function moveAbutment(v: Valley, a: Arcade, from: End | 'tray', to: End | 'tray'): Arcade | null {
  if (from === to) return a;
  if (from === 'tray' ? abutmentsInTray(v, a) <= 0 : !a.abut[from]) return null;
  if (to !== 'tray' && a.abut[to]) return null;
  const abut = { ...a.abut };
  if (from !== 'tray') abut[from] = false;
  if (to !== 'tray') abut[to] = true;
  return { ...a, abut };
}

export type ValleyHint =
  { kind: 'span'; span: number } | { kind: 'end'; end: End } | { kind: 'move'; from: End; to: End };

/** What the glow names: the empty span, the end slot for an abutment in the tray, or the abutment on the rock end to move. */
export function valleyHint(v: Valley, a: Arcade): ValleyHint | null {
  const p = firstUnsupported(v, a);
  if (!p) return null;
  if (p.kind === 'gap') return { kind: 'span', span: p.span };
  if (abutmentsInTray(v, a) > 0) return { kind: 'end', end: p.end };
  const from = ENDS.find((e) => e !== p.end && a.abut[e]);
  return from ? { kind: 'move', from, to: p.end } : null;
}

/** Follow a hint one step: the move a capable child makes for it. */
export function followHint(v: Valley, a: Arcade, h: ValleyHint): Arcade {
  if (h.kind === 'span') return moveArch(v, a, 'tray', h.span) ?? a;
  if (h.kind === 'end') return moveAbutment(v, a, 'tray', h.end) ?? a;
  return moveAbutment(v, a, h.from, h.to) ?? a;
}

// ——— The ghost finger at levels 4–5 ———

export type WaterBotMove =
  | { tap: 'card'; card: 0 | 1 }
  | { tap: 'arrow'; pier: number; dir: 1 | -1 }
  | { tap: 'open' }
  | { drag: 'arch'; from: 'tray'; to: number }
  | { drag: 'abutment'; from: End | 'tray'; to: End };

/** Never an opening that pools or slides: the falling card, the arrows along the hint, the arches from the spring side, then each earth end. */
export function waterBotMove(
  plan: DownhillPlan | ValleyPlan,
  state: DownhillState | ValleyState,
): WaterBotMove | null {
  if (plan.level === 4) {
    const s = state as DownhillState;
    if (s.done || s.road >= plan.roads.length) return null;
    if (plan.kind === 'cards') {
      const good = plan.roads[s.road].good;
      return s.chosen === good ? { tap: 'open' } : { tap: 'card', card: good };
    }
    const hint = pierHint(roadNow(plan, s)!);
    return hint ? { tap: 'arrow', pier: hint.pier, dir: hint.dir } : { tap: 'open' };
  }
  const s = state as ValleyState;
  if (s.done || s.valley >= plan.valleys.length) return null;
  const v = plan.valleys[s.valley];
  const a = s.arcade;
  const empty = a.arches.findIndex((on) => !on);
  if (empty >= 0) return { drag: 'arch', from: 'tray', to: empty };
  for (const e of ENDS) {
    if (v.ends[e] !== 'earth' || a.abut[e]) continue;
    if (abutmentsInTray(v, a) > 0) return { drag: 'abutment', from: 'tray', to: e };
    const from = ENDS.find((o) => o !== e && a.abut[o]);
    if (from) return { drag: 'abutment', from, to: e };
  }
  return { tap: 'open' };
}
