/**
 * Water Road rules: one rule decides every level. A ring of stones stands when it is closed (no gap) and pushed back at
 * both ends (a low wall or a placed block on each side). Level 1 closes the ring stone by stone and pulls the frame;
 * level 2 pulls pairs of frames, one closed and one with a gap, and asks on the last pair which will stand; level 3 puts
 * a buttress block where the arch has nothing to push on, then pulls. No physics: every pull is decided here and shown
 * by a tumble. Definition: docs/definitions/water-road.md.
 */
import type { Rng } from '../../engine/random';
import type { View } from '../../engine/view';
import type { Band } from '../../progress/bands';

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

const closedArch = (stones: number): Arch => ({ stones, gap: null, left: { held: true }, right: { held: true } });

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
export function tapPile(plan: KeystonePlan, s: KeystoneState): { state: KeystoneState; event: 'stone' | 'keystone' | 'full'; index: number | null } {
  if (s.pulled || s.placed >= plan.stones) return { state: s, event: 'full', index: null };
  const index = placeOrder(plan.stones)[s.placed];
  const placed = s.placed + 1;
  return { state: { ...s, placed }, event: placed === plan.stones ? 'keystone' : 'stone', index };
}

/** The pull: only a closed ring comes off its frame; before that the frame wobbles, free. */
export function pullKeystone(plan: KeystonePlan, s: KeystoneState): { state: KeystoneState; event: 'pulled' | 'wobble' | 'none' } {
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
    const shoulders = Array.from({ length: count }, (_, i) => i).filter((i) => i !== k && i !== 0 && i !== count - 1);
    const gap = older && rng.int(0, 1) === 1 ? rng.pick(shoulders) : k;
    const closed = rng.int(0, 1) as 0 | 1;
    const open: Arch = { ...closedArch(count), gap };
    pairs.push({ count, arches: closed === 0 ? [closedArch(count), open] : [open, closedArch(count)], closed });
    tints.push([0, 1].map(() => Array.from({ length: count }, () => rng.int(0, 2))));
  }
  return { level: 2, pairs, tints };
}

export const pairsStart = (): PairsState => ({ pair: 0, pulled: [false, false], done: false });

export const isAsked = (plan: PairsPlan, s: PairsState) => s.pair === plan.pairs.length - 1;

/** A free pull: the frame comes away and the ring stands or falls; a pulled frame or the asked pair takes no free pull. */
export function pullFree(plan: PairsPlan, s: PairsState, side: 0 | 1): { state: PairsState; event: 'stands' | 'falls' | 'none' } {
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
export function predict(plan: PairsPlan, s: PairsState, side: 0 | 1): { state: PairsState; event: 'stands' | 'wrong' | 'none' } {
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
    arches.push({ stones: count, gap: null, left: { held: both || walled === 'left' }, right: { held: both || walled === 'right' } });
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
export function pull(plan: ButtressPlan, s: ButtressState): { state: ButtressState; stands: boolean; spread: Side | null } {
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
    if (!this.counted) { this.counted = true; this.hints++; }
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
  | { tap: 'pile' }
  | { tap: 'handle' }
  | { tap: 'frame'; side: 0 | 1 }
  | { drag: 'block'; to: Side };

/** What a capable child does next: never a wrong guess, never a pull with the block in the wrong place. */
export function botMove(plan: KeystonePlan | PairsPlan | ButtressPlan, state: KeystoneState | PairsState | ButtressState): BotMove | null {
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

export function planFor(level: number): { level: 1 | 2 | 3; id: 'keystone' | 'pairs' | 'buttress'; name: string } {
  if (level <= 1) return { level: 1, id: 'keystone', name: 'Keystone: tap and a stone flies onto the frame from each end in turn; the last one is the keystone; then pull the frame and the arch stands (3 stones at toddler, 5 or 7 from preschool)' };
  if (level === 2) return { level: 2, id: 'pairs', name: 'Which one stands? pull two frames and see which ring holds (two free pairs), then on the last pair tap the one that will stand before pulling' };
  return { level: 3, id: 'buttress', name: 'Hold it up: drag the block to the side with no wall and pull the frame; a pull with nothing pushing back spreads the ring (two arches)' };
}

// ——— Layout ———

export interface Pt { x: number; y: number }
export interface Rect { x: number; y: number; w: number; h: number }

export const HOME_CORNER = { w: 130, h: 215 };
export const PET_CORNER = { w: 160, h: 170 };
export const MIN_TARGET = 100;
export const HANDLE = { w: 140, h: 110 };
export const BLOCK = 120;
export const SLOT = 140;
export const PAIR_FRAME = { w: 300, h: 260 };

/** The ring's shape on a frame: mid radius, stone thickness, and the height of the posts and walls under the springers. */
export interface Ring { r: number; t: number; post: number }

export const RINGS: Record<1 | 2 | 3, Ring> = {
  1: { r: 235, t: 90, post: 90 },
  2: { r: 100, t: 60, post: 60 },
  3: { r: 185, t: 80, post: 80 },
};

export interface Frame {
  /** The springing line's centre: the ring is drawn around this point. */
  centre: Pt;
  /** The frame's tap box. */
  box: Rect;
}

export interface WrLayout {
  ring: Ring;
  frames: Frame[];
  /** The ground line. */
  ground: number;
  handles: Rect[];
  /** Level 1's pile spots (not targets: the stage is). */
  pile: Pt[];
  tray: Rect | null;
  slots: { left: Rect; right: Rect } | null;
  /** Level 2's frames stacked one above the other at a narrow stage. */
  stacked: boolean;
}

export function corners(v: View): Rect[] {
  return [{ x: 0, y: 0, ...HOME_CORNER }, { x: 0, y: v.h - PET_CORNER.h, ...PET_CORNER }];
}

export function overlaps(a: Rect, b: Rect): boolean {
  return a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
}

export function centre(r: Rect): Pt {
  return { x: r.x + r.w / 2, y: r.y + r.h / 2 };
}

export function around(p: Pt, w: number, h = w): Rect {
  return { x: p.x - w / 2, y: p.y - h / 2, w, h };
}

export const outer = (ring: Ring) => ring.r + ring.t / 2;
export const inner = (ring: Ring) => ring.r - ring.t / 2;

/**
 * The frame or frames across the upper half, the pile or tray below; every input at least 100 units and clear of the
 * corners and each other. Null when the view cannot hold the level without shrinking a target.
 */
export function waterRoadLayout(level: number, v: View, stones = 7): WrLayout | null {
  const l = planFor(level).level;
  const ring = RINGS[l];
  const cx = v.w / 2;
  const top = 40;
  // The springing line sits in the upper half: below the top margin, and lower on a tall (portrait) view.
  const spring = (extra: number) => Math.max(top + outer(ring) + extra, v.h * 0.4);
  let out: WrLayout;
  if (l === 1) {
    const springY = spring(0);
    const ground = springY + ring.post;
    const w = 2 * outer(ring) + 60;
    const h = outer(ring) + ring.post + 20;
    const perRow = 4;
    const pile: Pt[] = [];
    for (let i = 0; i < stones; i++) {
      const row = Math.floor(i / perRow);
      const inRow = Math.min(perRow, stones - row * perRow);
      const col = i % perRow;
      pile.push({ x: cx + 60 + (col - (inRow - 1) / 2) * 125, y: ground + 150 + row * 105 });
    }
    out = {
      ring, ground, stacked: false,
      frames: [{ centre: { x: cx, y: springY }, box: { x: cx - w / 2, y: springY - outer(ring) - 10, w, h } }],
      handles: [around({ x: cx, y: springY - 40 }, HANDLE.w, HANDLE.h)],
      pile, tray: null, slots: null,
    };
  } else if (l === 2) {
    const gapX = 80;
    const stacked = v.w < 2 * PAIR_FRAME.w + gapX + 2 * HOME_CORNER.w;
    const springY = spring(30);
    const frameAt = (c: Pt): Frame => ({ centre: c, box: { x: c.x - PAIR_FRAME.w / 2, y: c.y - outer(ring) - 40, w: PAIR_FRAME.w, h: PAIR_FRAME.h } });
    const centres = stacked
      ? [{ x: cx, y: springY }, { x: cx, y: springY + PAIR_FRAME.h + 40 }]
      : [{ x: cx - PAIR_FRAME.w / 2 - gapX / 2, y: springY }, { x: cx + PAIR_FRAME.w / 2 + gapX / 2, y: springY }];
    out = { ring, ground: springY + ring.post, stacked, frames: centres.map(frameAt), handles: [], pile: [], tray: null, slots: null };
  } else {
    const springY = spring(0);
    const ground = springY + ring.post;
    const w = 2 * outer(ring) + 40;
    const h = outer(ring) + ring.post + 40;
    out = {
      ring, ground, stacked: false,
      frames: [{ centre: { x: cx, y: springY }, box: { x: cx - w / 2, y: springY - outer(ring) - 20, w, h } }],
      handles: [around({ x: cx, y: springY - 30 }, HANDLE.w, HANDLE.h)],
      pile: [],
      tray: around({ x: cx, y: ground + 200 }, BLOCK, BLOCK),
      slots: {
        left: around({ x: cx - outer(ring) - 75, y: ground - 60 }, SLOT, SLOT),
        right: around({ x: cx + outer(ring) + 75, y: ground - 60 }, SLOT, SLOT),
      },
    };
  }
  const inputs = [...out.handles, ...(l === 2 ? out.frames.map((f) => f.box) : []), ...(out.tray ? [out.tray] : []), ...(out.slots ? [out.slots.left, out.slots.right] : [])];
  for (const r of inputs) {
    if (r.w < MIN_TARGET || r.h < MIN_TARGET) return null;
    if (r.x < 0 || r.y < 0 || r.x + r.w > v.w || r.y + r.h > v.h) return null;
    if (corners(v).some((c) => overlaps(r, c))) return null;
  }
  for (let i = 0; i < inputs.length; i++) for (let j = i + 1; j < inputs.length; j++) if (overlaps(inputs[i], inputs[j])) return null;
  for (const f of out.frames) if (f.box.x < 0 || f.box.y < 0 || f.box.x + f.box.w > v.w || f.box.y + f.box.h > v.h) return null;
  return out;
}

/** A stone's angles on the ring: the left springer starts at π and the ring runs over the top to 2π. */
export function stoneAngles(count: number, index: number): { a0: number; a1: number; mid: number } {
  const a0 = Math.PI + (index * Math.PI) / count;
  const a1 = Math.PI + ((index + 1) * Math.PI) / count;
  return { a0, a1, mid: (a0 + a1) / 2 };
}

/** Where a stone's centre sits on a ring around `c`. */
export function stoneCentre(c: Pt, ring: Ring, count: number, index: number): Pt {
  const { mid } = stoneAngles(count, index);
  return { x: c.x + ring.r * Math.cos(mid), y: c.y + ring.r * Math.sin(mid) };
}
