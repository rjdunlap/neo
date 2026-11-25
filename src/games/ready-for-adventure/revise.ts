import type { Rng } from '../../engine/random';
import type { View } from '../../engine/view';
import { FLAG_SHAPES, RIBBON_PATTERNS, type PropId, type Rect } from './logic';

/**
 * Ready for Adventure level 4, "The request changed": pack a bag for the card, tap Check, then the card changes and the
 * bag is repaired (take out what is not wanted, put in what is new). Packing and unpacking are free and legal at any time,
 * so no bag is ever unsolvable; only a Check that finds a difference is a miss. Nothing here is real self-care.
 */
export const PROP_ORDER: readonly PropId[] = ['flag', 'drum', 'bell', 'ball'];

export type ChangeKind = 'swap' | 'drop' | 'add';

export interface ReviseRound {
  /** The card before the change and after it, each 1-3 distinct props in card order. */
  requests: [PropId[], PropId[]];
  change: ChangeKind;
  /** Bench order of the four props. */
  order: PropId[];
  flagShape: number;
  ribbonPattern: number;
  drumPattern: number;
}

export interface ReviseState {
  round: ReviseRound;
  phase: 1 | 2;
  bag: Set<PropId>;
  misses: number;
  hints: number;
  /** Bad Checks on the current request since the bag last got closer. */
  badChecks: number;
  /** The prop whose edit is glowing, if any. */
  glow: { prop: PropId; edit: 'pack' | 'unpack' } | null;
}

export const request = (s: ReviseState): PropId[] => s.round.requests[s.phase - 1];

const byOrder = (a: PropId, b: PropId) => PROP_ORDER.indexOf(a) - PROP_ORDER.indexOf(b);

/** The authored first round: flag + drum, then flag + bell by swap. */
export function firstRound(): ReviseRound {
  return {
    requests: [
      ['flag', 'drum'],
      ['flag', 'bell'],
    ],
    change: 'swap',
    order: ['flag', 'drum', 'bell', 'ball'],
    flagShape: 0,
    ribbonPattern: 0,
    drumPattern: 0,
  };
}

const shuffled = (rng: Rng, xs: readonly PropId[]): PropId[] => {
  const a = [...xs];
  for (let i = a.length - 1; i > 0; i--) {
    const j = rng.int(0, i);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

/** A seeded level 4 round: weights swap 3, drop 1, add 1; every change needs one or two edits. */
export function makeReviseRound(rng: Rng): ReviseRound {
  const kind: ChangeKind = rng.pick<ChangeKind>(['swap', 'swap', 'swap', 'drop', 'add']);
  const pool = shuffled(rng, PROP_ORDER);
  let first: PropId[];
  let second: PropId[];
  if (kind === 'swap') {
    const size = rng.pick([2, 2, 3]);
    first = pool.slice(0, size);
    const incoming = pool.find((p) => !first.includes(p))!;
    const outIdx = rng.int(0, size - 1);
    second = first.map((p, i) => (i === outIdx ? incoming : p));
  } else if (kind === 'drop') {
    first = pool.slice(0, rng.pick([2, 3]));
    const out = rng.int(0, first.length - 1);
    second = first.filter((_, i) => i !== out);
  } else {
    first = pool.slice(0, rng.pick([1, 2]));
    const incoming = pool.find((p) => !first.includes(p))!;
    second = [...first, incoming];
  }
  return {
    requests: [first.sort(byOrder), second.sort(byOrder)],
    change: kind,
    order: shuffled(rng, PROP_ORDER),
    flagShape: rng.int(0, FLAG_SHAPES - 1),
    ribbonPattern: rng.int(0, RIBBON_PATTERNS - 1),
    drumPattern: rng.int(0, RIBBON_PATTERNS - 1),
  };
}

export function reviseState(round: ReviseRound): ReviseState {
  return { round, phase: 1, bag: new Set(), misses: 0, hints: 0, badChecks: 0, glow: null };
}

export function startRevise(rng: Rng): ReviseState {
  return reviseState(makeReviseRound(rng));
}

// ---- Comparing --------------------------------------------------------------------------------------------------------

export interface Diff {
  /** In the bag but not on the card, in fixed prop order. */
  surplus: PropId[];
  /** On the card but not in the bag, in fixed prop order. */
  missing: PropId[];
  distance: number;
}

export function diff(s: ReviseState): Diff {
  const want = request(s);
  const surplus = [...s.bag].filter((p) => !want.includes(p)).sort(byOrder);
  const missing = want.filter((p) => !s.bag.has(p)).sort(byOrder);
  return { surplus, missing, distance: surplus.length + missing.length };
}

export type CheckResult =
  { kind: 'empty' } | { kind: 'pass' } | { kind: 'mismatch'; prop: PropId; why: 'extra' | 'missing' };

/** The one deliberate comparison. Pure: it changes nothing. */
export function check(s: ReviseState): CheckResult {
  if (s.bag.size === 0) return { kind: 'empty' };
  const d = diff(s);
  if (d.distance === 0) return { kind: 'pass' };
  return d.surplus.length
    ? { kind: 'mismatch', prop: d.surplus[0], why: 'extra' }
    : { kind: 'mismatch', prop: d.missing[0], why: 'missing' };
}

export type ReviseEdit = { pack: PropId } | { unpack: PropId };

/** Every edit that lowers the distance. */
export function nextEdits(s: ReviseState): ReviseEdit[] {
  const d = diff(s);
  return [...d.surplus.map((p) => ({ unpack: p })), ...d.missing.map((p) => ({ pack: p }))];
}

/** One edit that leads somewhere: take out the first surplus, else pack the first missing. */
export function hintFor(s: ReviseState): ReviseEdit | null {
  return nextEdits(s)[0] ?? null;
}

/** Pack or unpack, free and legal at any time. Returns whether the bag changed. Closer edits reset the Check counter. */
export function edit(s: ReviseState, e: ReviseEdit): boolean {
  const before = diff(s).distance;
  if ('pack' in e) {
    if (s.bag.has(e.pack)) return false;
    s.bag.add(e.pack);
  } else {
    if (!s.bag.has(e.unpack)) return false;
    s.bag.delete(e.unpack);
  }
  if (diff(s).distance < before) s.badChecks = 0;
  if (s.glow && !nextEdits(s).some((n) => JSON.stringify(n) === JSON.stringify(editOf(s.glow!))))
    s.glow = null;
  return true;
}

const editOf = (g: { prop: PropId; edit: 'pack' | 'unpack' }): ReviseEdit =>
  g.edit === 'pack' ? { pack: g.prop } : { unpack: g.prop };

export type CheckOutcome =
  | { kind: 'empty' }
  | { kind: 'pass'; next: 'change' | 'done' }
  | { kind: 'mismatch'; prop: PropId; why: 'extra' | 'missing'; glowed: boolean };

/**
 * Apply a Check. A bad Check is one miss; a second on the same request with no closer edit between lights the next edit
 * (one hint) and resets the counter. A pass in phase 1 starts phase 2 with the bag untouched.
 */
export function applyCheck(s: ReviseState): CheckOutcome {
  const r = check(s);
  if (r.kind === 'empty') return r;
  if (r.kind === 'pass') {
    s.badChecks = 0;
    s.glow = null;
    if (s.phase === 1) {
      s.phase = 2;
      return { kind: 'pass', next: 'change' };
    }
    return { kind: 'pass', next: 'done' };
  }
  s.misses++;
  s.badChecks++;
  let glowed = false;
  if (s.badChecks >= 2) {
    s.badChecks = 0;
    s.hints++;
    setGlow(s);
    glowed = true;
  }
  return { ...r, glowed };
}

function setGlow(s: ReviseState) {
  const h = hintFor(s);
  s.glow = h ? ('pack' in h ? { prop: h.pack, edit: 'pack' } : { prop: h.unpack, edit: 'unpack' }) : null;
}

/** The pause sheet's Show a hint: counts 1 and glows `hintFor`; asked again while lit, it counts nothing. */
export function askReviseHint(s: ReviseState): 'glow' | 'repeat' | null {
  if (diff(s).distance === 0) return null;
  if (s.glow) return 'repeat';
  s.hints++;
  setGlow(s);
  return 'glow';
}

/** Start again: the same round's phase 1 with an empty bench, keeping misses and hints. */
export function restartRevise(s: ReviseState) {
  s.phase = 1;
  s.bag = new Set();
  s.badChecks = 0;
  s.glow = null;
}

/** The bot's move: follow the hint; at distance 0 the next step is a Check (null here). */
export function botEdit(s: ReviseState): ReviseEdit | null {
  const d = diff(s);
  if (d.distance === 0) return null;
  return hintFor(s);
}

export function describeRevise(): string {
  return 'Pack, then repair the bag when the request changes';
}

// ---- Layout -----------------------------------------------------------------------------------------------------------

export interface ReviseLayout {
  card: Rect;
  /** Four bench slots in `round.order`. */
  slots: Rect[];
  /** Four bag-shelf slots, filled left to right. */
  shelf: Rect[];
  bag: Rect;
  check: Rect;
  companion: { x: number; y: number };
}

export const BENCH_SIZE = 140;
export const SHELF_SIZE = 110;
export const REV_BAG_W = 220;
export const REV_BAG_H = 200;
export const CHECK_SIZE = 120;
const overlap = (a: Rect, b: Rect) =>
  a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;

/** Every rectangle at level 4, or null (never shrunk) when the targets cannot fit. */
export function reviseLayout(view: View): ReviseLayout | null {
  const card: Rect = { x: view.w / 2 - 150, y: 20, w: 300, h: 170 };
  const GAP = 44;
  const portrait = view.h > view.w;
  const slots: Rect[] = [];
  const cols = portrait ? 2 : 4;
  const total = cols * BENCH_SIZE + (cols - 1) * GAP;
  const rows = 4 / cols;
  const sx = (view.w - total) / 2;
  const by = view.h - rows * BENCH_SIZE - (rows - 1) * GAP - 40;
  for (let i = 0; i < 4; i++)
    slots.push({
      x: sx + (i % cols) * (BENCH_SIZE + GAP),
      y: by + Math.floor(i / cols) * (BENCH_SIZE + GAP),
      w: BENCH_SIZE,
      h: BENCH_SIZE,
    });
  // The shelf sits under the card, the bag and Check under the shelf.
  const SG = 20;
  const shelfTotal = 4 * SHELF_SIZE + 3 * SG;
  const shelfY = card.y + card.h + 20;
  const shelf: Rect[] = [];
  for (let i = 0; i < 4; i++)
    shelf.push({
      x: (view.w - shelfTotal) / 2 + i * (SHELF_SIZE + SG),
      y: shelfY,
      w: SHELF_SIZE,
      h: SHELF_SIZE,
    });
  const groupW = REV_BAG_W + 30 + CHECK_SIZE;
  const bagY = shelfY + SHELF_SIZE + 16;
  const bag: Rect = { x: (view.w - groupW) / 2, y: bagY, w: REV_BAG_W, h: REV_BAG_H };
  const check: Rect = {
    x: bag.x + bag.w + 30,
    y: bag.y + (bag.h - CHECK_SIZE) / 2,
    w: CHECK_SIZE,
    h: CHECK_SIZE,
  };
  const companion = { x: Math.max(80, sx - 70), y: slots[0].y - 10 };
  return reviseFits({ card, slots, shelf, bag, check, companion }, view);
}

function reviseFits(l: ReviseLayout, view: View): ReviseLayout | null {
  const targets = [...l.slots, ...l.shelf, l.bag, l.check];
  for (const t of targets) if (t.x < 0 || t.y < 0 || t.x + t.w > view.w || t.y + t.h > view.h) return null;
  for (let i = 0; i < targets.length; i++)
    for (let j = i + 1; j < targets.length; j++) if (overlap(targets[i], targets[j])) return null;
  for (const t of targets) if (overlap(t, l.card)) return null;
  // The Home button (top left) and the guide's bottom-left corner.
  for (const t of targets) if (t.x < 150 && t.y + t.h > view.h - 170) return null;
  return l;
}
