import type { Rng } from '../../engine/random';
import type { View } from '../../engine/view';

/**
 * Bond Beads: round beads with little hands, linked hand to hand. A toy model only: levels 1–2 name no substance and say
 * nothing about real ones (definition: docs/definitions/bond-beads.md).
 */
export type Kind = 'C' | 'O' | 'H';
/** How many hands each kind of bead has. */
export const HANDS: Record<Kind, number> = { C: 4, O: 2, H: 1 };
/** The order kinds are listed in a tally and a canonical key. */
export const KIND_ORDER: readonly Kind[] = ['C', 'O', 'H'];

/** A link joins one free hand on each of two beads; stored with the lower bead first. */
export type Link = readonly [number, number];

export const norm = (a: number, b: number): Link => (a < b ? [a, b] : [b, a]);
export const linkId = (l: Link) => `${l[0]}-${l[1]}`;
const sameLink = (l: Link, a: number, b: number) => (l[0] === a && l[1] === b) || (l[0] === b && l[1] === a);

export function degrees(n: number, links: readonly Link[]): number[] {
  const d = new Array<number>(n).fill(0);
  for (const [a, b] of links) { d[a]++; d[b]++; }
  return d;
}

export function freeHands(kinds: readonly Kind[], links: readonly Link[], i: number): number {
  return HANDS[kinds[i]] - degrees(kinds.length, links)[i];
}

export const linked = (links: readonly Link[], a: number, b: number) => links.some((l) => sameLink(l, a, b));

/** One link per pair, never a bead to itself, and both beads need a free hand. */
export function canLink(kinds: readonly Kind[], links: readonly Link[], a: number, b: number): boolean {
  if (a === b || a < 0 || b < 0 || a >= kinds.length || b >= kinds.length || linked(links, a, b)) return false;
  const d = degrees(kinds.length, links);
  return d[a] < HANDS[kinds[a]] && d[b] < HANDS[kinds[b]];
}

/** Whether any link can still be made. */
export function anyLink(kinds: readonly Kind[], links: readonly Link[]): boolean {
  for (let a = 0; a < kinds.length; a++) for (let b = a + 1; b < kinds.length; b++) if (canLink(kinds, links, a, b)) return true;
  return false;
}

/** The pieces on the table: groups of beads joined by links (a lone bead is a piece of one). */
export function pieces(n: number, links: readonly Link[]): number[][] {
  const seen = new Array<boolean>(n).fill(false);
  const out: number[][] = [];
  for (let s = 0; s < n; s++) {
    if (seen[s]) continue;
    const group: number[] = [];
    const stack = [s];
    seen[s] = true;
    while (stack.length) {
      const i = stack.pop()!;
      group.push(i);
      for (const [a, b] of links) {
        const j = a === i ? b : b === i ? a : -1;
        if (j >= 0 && !seen[j]) { seen[j] = true; stack.push(j); }
      }
    }
    out.push(group.sort((x, y) => x - y));
  }
  return out;
}

/** Every hand is held (so no bead is left alone). */
export function allHeld(kinds: readonly Kind[], links: readonly Link[]): boolean {
  const d = degrees(kinds.length, links);
  return kinds.every((k, i) => d[i] === HANDS[k]);
}

function permutations(items: number[]): number[][] {
  if (items.length <= 1) return [items.slice()];
  const out: number[][] = [];
  items.forEach((x, i) => {
    for (const rest of permutations([...items.slice(0, i), ...items.slice(i + 1)])) out.push([x, ...rest]);
  });
  return out;
}

/**
 * A piece's canonical key: its kinds in tally order, then the smallest adjacency over every relabelling of beads of the
 * same kind. Where beads are drawn and which H is which never change it.
 */
export function canon(kinds: readonly Kind[], links: readonly Link[], members: readonly number[] = kinds.map((_, i) => i)): string {
  const groups = KIND_ORDER.map((k) => members.filter((i) => kinds[i] === k));
  let orders: number[][] = [[]];
  for (const g of groups) {
    const perms = permutations(g);
    orders = orders.flatMap((o) => perms.map((p) => [...o, ...p]));
  }
  const kindsPart = groups.map((g, i) => (g.length ? `${KIND_ORDER[i]}${g.length}` : '')).join('');
  let best: string | null = null;
  for (const order of orders) {
    let bits = '';
    for (let i = 0; i < order.length; i++) for (let j = i + 1; j < order.length; j++) bits += linked(links, order[i], order[j]) ? '1' : '0';
    if (best === null || bits < best) best = bits;
  }
  return `${kindsPart}:${best}`;
}

/** A build's key: its pieces' keys, sorted. */
export function buildKey(kinds: readonly Kind[], links: readonly Link[]): string {
  return pieces(kinds.length, links).map((p) => canon(kinds, links, p)).sort().join('+');
}

/** Every finished labelled build of these beads (all hands held, single links) that `accept` takes. */
export function labelledBuilds(kinds: readonly Kind[], accept: (links: Link[]) => boolean): Link[][] {
  const n = kinds.length;
  const pairs: Link[] = [];
  for (let a = 0; a < n; a++) for (let b = a + 1; b < n; b++) pairs.push([a, b]);
  const out: Link[][] = [];
  const d = new Array<number>(n).fill(0);
  const chosen: Link[] = [];
  const walk = (k: number) => {
    if (kinds.every((kind, i) => d[i] === HANDS[kind])) {
      if (accept(chosen)) out.push(chosen.slice());
      return;
    }
    if (k >= pairs.length) return;
    const [a, b] = pairs[k];
    if (d[a] < HANDS[kinds[a]] && d[b] < HANDS[kinds[b]]) {
      d[a]++; d[b]++; chosen.push(pairs[k]);
      walk(k + 1);
      d[a]--; d[b]--; chosen.pop();
    }
    walk(k + 1);
  };
  walk(0);
  return out;
}

/** The distinct shapes these beads make as one piece with every hand held. */
export function enumerate(kinds: readonly Kind[]): string[] {
  const keys = new Set(labelledBuilds(kinds, (links) => pieces(kinds.length, links).length === 1).map((l) => buildKey(kinds, l)));
  return [...keys].sort();
}

/** A pictured shape: its beads, its links and where each bead sits on the card (unit spacing). */
export interface Shape {
  id: string;
  kinds: Kind[];
  links: Link[];
  pic: { x: number; y: number }[];
}

export const shapeKey = (s: Shape) => buildKey(s.kinds, s.links);

const k = (s: string) => s.split('') as Kind[];
const L = (...pairs: [number, number][]): Link[] => pairs.map(([a, b]) => norm(a, b));

/** Level 1: loose trays, each with exactly one shape that holds every hand. The first is authored. */
export const TRAYS: Record<string, Kind[]> = {
  O1H2: k('HOH'),
  O3: k('OOO'),
  O2H2: k('HOOH'),
  O4: k('OOOO'),
};
export const FIRST_TRAY = 'O1H2';

/** Level 2: the cards, each a pictured shape made from its own tray. The first is authored. */
export const CARDS: Shape[] = [
  { id: 'chain4', kinds: k('HOOH'), links: L([0, 1], [1, 2], [2, 3]), pic: [{ x: -1.5, y: 0.3 }, { x: -0.5, y: -0.3 }, { x: 0.5, y: 0.3 }, { x: 1.5, y: -0.3 }] },
  { id: 'cross', kinds: k('CHHHH'), links: L([0, 1], [0, 2], [0, 3], [0, 4]), pic: [{ x: 0, y: 0 }, { x: 0, y: -1 }, { x: 1, y: 0 }, { x: 0, y: 1 }, { x: -1, y: 0 }] },
  { id: 'chain5', kinds: k('HOOOH'), links: L([0, 1], [1, 2], [2, 3], [3, 4]), pic: [{ x: -2, y: 0.3 }, { x: -1, y: -0.3 }, { x: 0, y: 0.3 }, { x: 1, y: -0.3 }, { x: 2, y: 0.3 }] },
  { id: 'loop', kinds: k('COOHH'), links: L([0, 1], [0, 2], [1, 2], [0, 3], [0, 4]), pic: [{ x: 0, y: 0.2 }, { x: -0.6, y: -0.75 }, { x: 0.6, y: -0.75 }, { x: -0.95, y: 0.75 }, { x: 0.95, y: 0.75 }] },
];

export interface Plan { level: number; name: string; rounds: number }

export const PLANS: Plan[] = [
  { level: 1, name: 'Hold every hand: three trays, any shape', rounds: 3 },
  { level: 2, name: 'Copy the shape: two pictured cards, then Check', rounds: 2 },
];

export function planFor(level: number): Plan {
  return PLANS.find((p) => p.level === level) ?? PLANS[0];
}

/** One tray of a round: its beads in the order laid out, and the card to copy (level 2). */
export interface Step { kinds: Kind[]; card: Shape | null }

/** A round: level 1 three distinct trays, level 2 two distinct cards; each level opens with its authored first. */
export function roundFor(level: number, rng: Rng): Step[] {
  if (planFor(level).level === 2) {
    const rest = rng.shuffle(CARDS.slice(1));
    return [CARDS[0], rest[0]].map((card) => ({ kinds: rng.shuffle(card.kinds.slice()), card }));
  }
  const rest = rng.shuffle(Object.keys(TRAYS).filter((t) => t !== FIRST_TRAY));
  return [FIRST_TRAY, rest[0], rest[1]].map((t) => ({ kinds: rng.shuffle(TRAYS[t].slice()), card: null }));
}

/** The beads on the table and what she has linked, with undo and Start again. Nothing here is ever a miss. */
export class Bench {
  links: Link[] = [];
  private history: Link[][] = [];
  readonly solutions: Link[][];
  private readonly target: string | null;

  constructor(readonly kinds: readonly Kind[], readonly card: Shape | null) {
    this.target = card ? shapeKey(card) : null;
    this.solutions = labelledBuilds(kinds, (links) => this.accepts(links));
  }

  /** Level 1 takes any build holding every hand in one piece; level 2 only the card's shape. */
  accepts(links: readonly Link[]): boolean {
    if (!allHeld(this.kinds, links)) return false;
    if (this.target !== null) return buildKey(this.kinds, links) === this.target;
    return pieces(this.kinds.length, links).length === 1;
  }

  get done(): boolean {
    return this.accepts(this.links);
  }

  link(a: number, b: number): boolean {
    if (!canLink(this.kinds, this.links, a, b)) return false;
    this.history.push(this.links);
    this.links = [...this.links, norm(a, b)];
    return true;
  }

  unlink(a: number, b: number): boolean {
    if (!linked(this.links, a, b)) return false;
    this.history.push(this.links);
    this.links = this.links.filter((l) => !sameLink(l, a, b));
    return true;
  }

  get canUndo(): boolean {
    return this.history.length > 0;
  }

  undo(): boolean {
    const prev = this.history.pop();
    if (!prev) return false;
    this.links = prev;
    return true;
  }

  /** Back to the opening beads: no links. Undo can bring the build back. */
  startAgain() {
    if (!this.links.length) return;
    this.history.push(this.links);
    this.links = [];
  }

  /** The order-free state of the build, for telling whether a Check is a repeat. */
  get state(): string {
    return this.links.map(linkId).sort().join(',');
  }

  get stuck(): boolean {
    return !this.done && !anyLink(this.kinds, this.links);
  }

  /** The accepted build nearest to what is on the table (fewest links to break and make). */
  nearest(): Link[] {
    let best = this.solutions[0];
    let bestCost = Infinity;
    for (const s of this.solutions) {
      const extra = this.links.filter((l) => !linked(s, l[0], l[1])).length;
      const missing = s.filter((l) => !linked(this.links, l[0], l[1])).length;
      if (extra + missing < bestCost) { bestCost = extra + missing; best = s; }
    }
    return best;
  }
}

/** What to look at next: a bead to link from (with the link it needs), or a link to break. */
export type Help =
  | { kind: 'free' | 'left'; bead: number; link: Link }
  | { kind: 'break'; link: Link };

/**
 * The next useful change toward the nearest accepted build. A link that can be made now comes first (named from a bead
 * that already holds a hand, else a bead left on its own); when none can be made, a link that is not in that build is
 * broken. Every help points at a bead or link the nearest accepted build changes. Null once the build is accepted.
 */
export function helpFor(bench: Bench): Help | null {
  if (bench.done || !bench.solutions.length) return null;
  const s = bench.nearest();
  const d = degrees(bench.kinds.length, bench.links);
  const missing = s.filter((l) => !linked(bench.links, l[0], l[1]) && canLink(bench.kinds, bench.links, l[0], l[1]));
  const extra = bench.links.filter((l) => !linked(s, l[0], l[1]));
  // A free hand on a bead that is already in a piece, then a bead on its own.
  for (const l of missing) for (const b of l) if (d[b] > 0) return { kind: 'free', bead: b, link: l };
  for (const l of missing) return { kind: 'left', bead: d[l[0]] === 0 ? l[0] : l[1], link: l };
  if (extra.length) return { kind: 'break', link: extra[0] };
  return null;
}

/** The ghost finger's next move: make or break the link `helpFor` names, then (level 2) Check. */
export type Move = { make: Link } | { cut: Link } | { check: true };
export function nextMove(bench: Bench): Move | null {
  if (bench.done) return bench.card ? { check: true } : null;
  const h = helpFor(bench);
  if (!h) return null;
  return h.kind === 'break' ? { cut: h.link } : { make: h.link };
}

export type Verdict = 'match' | 'repeat' | 'miss' | 'glow' | 'assist';

/**
 * Level 2's accounting. A Check that is not the card is one miss, but only when the build changed since the last
 * Check. The second miss on a card lights the glow and counts the card's one hint (Show a hint does the same, once
 * per card). A wrong Check after that plays the supported finish and counts nothing more.
 */
export class CheckTally {
  misses = 0;
  hints = 0;
  cardMisses = 0;
  glowing = false;
  private helped = false;
  private last: string | null = null;

  /** A new card: the glow and the per-card counts start over. */
  next() {
    this.cardMisses = 0;
    this.glowing = false;
    this.helped = false;
    this.last = null;
  }

  check(bench: Bench): Verdict {
    if (bench.done) return 'match';
    const state = bench.state;
    if (state === this.last) return 'repeat';
    this.last = state;
    if (this.cardMisses >= 2) return 'assist';
    this.cardMisses++;
    this.misses++;
    if (this.cardMisses < 2) return 'miss';
    this.light();
    return 'glow';
  }

  /** Show a hint: the glow, counting one hint the first time on a card. Returns whether it counted. */
  ask(): boolean {
    const counted = !this.helped;
    this.light();
    return counted;
  }

  private light() {
    this.glowing = true;
    if (!this.helped) { this.helped = true; this.hints++; }
  }
}

// ——— Layout ———

export interface Rect { x: number; y: number; w: number; h: number }
export interface Pt { x: number; y: number }

export const centre = (r: Rect): Pt => ({ x: r.x + r.w / 2, y: r.y + r.h / 2 });
export const overlaps = (a: Rect, b: Rect) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
const inside = (a: Rect, v: View) => a.x >= 0 && a.y >= 0 && a.x + a.w <= v.w && a.y + a.h <= v.h;

/** The home and ? buttons (top left) and the guide (bottom left). */
export const HOME_CORNER = { w: 130, h: 215 };
export const PET_CORNER = { w: 160, h: 170 };
export function corners(v: View): Rect[] {
  return [{ x: 0, y: 0, ...HOME_CORNER }, { x: 0, y: v.h - PET_CORNER.h, ...PET_CORNER }];
}

/** A bead's body radius; its hand nubs reach to `BEAD_REACH`, so a bead is 128 units across. */
export const BEAD_R = 50;
export const BEAD_REACH = 64;
/** Bead centres stay at least this far apart, leaving a gap where a link can be tapped. */
export const BEAD_GAP = 3.2 * BEAD_R;
export const BUTTON_R = 56;
export const CARD_MIN_H = 140;
const M = 20;
const TALLY_H = 70;

export interface BeadLayout {
  beads: Pt[];
  table: Rect;
  tally: Rect;
  card: Rect | null;
  check: Rect | null;
  undo: Rect;
  again: Rect;
}

/** Small offsets so no two of the beads' possible links share a midpoint (a square's diagonals would). */
const JITTER = [0, 0.26, -0.18, -0.3, -0.12, 0.15, -0.09];

const button = (cx: number, cy: number): Rect => ({ x: cx - BUTTON_R, y: cy - BUTTON_R, w: 2 * BUTTON_R, h: 2 * BUTTON_R });

/**
 * Where everything goes for `n` beads: the tally strip at the top, the card (level 2) and the buttons in a right-hand
 * column (a top band and a bottom row when upright), and the beads on an ellipse in the table that is left, clear of the
 * corners. Null rather than a bead closer than `BEAD_GAP` to another.
 */
export function beadLayout(v: View, n: number, withCard: boolean): BeadLayout | null {
  const wide = v.w >= v.h;
  const tally: Rect = { x: HOME_CORNER.w + M, y: M, w: v.w - HOME_CORNER.w - 2 * M, h: TALLY_H };
  let card: Rect | null = null;
  let check: Rect | null = null;
  let undo: Rect;
  let again: Rect;
  let table: Rect;
  if (wide) {
    const colW = 280;
    const colX = v.w - M - colW;
    const top = tally.y + tally.h + M;
    if (withCard) card = { x: colX, y: top, w: colW, h: 220 };
    const by = v.h - M - BUTTON_R;
    undo = button(colX + colW / 2 - BUTTON_R - 12, by);
    again = button(colX + colW / 2 + BUTTON_R + 12, by);
    if (withCard) check = button(colX + colW / 2, by - 2 * BUTTON_R - 24);
    const left = PET_CORNER.w + M;
    table = { x: left, y: top, w: colX - M - left, h: v.h - M - top };
  } else {
    const top = tally.y + tally.h + M;
    if (withCard) card = { x: HOME_CORNER.w + M, y: top, w: v.w - HOME_CORNER.w - 2 * M, h: 200 };
    const by = v.h - M - BUTTON_R;
    const right = v.w - M - BUTTON_R;
    again = button(right, by);
    undo = button(right - 2 * BUTTON_R - 24, by);
    if (withCard) check = button(right - 4 * BUTTON_R - 48, by);
    const tTop = card ? card.y + card.h + M : Math.max(top, HOME_CORNER.h + M);
    const tBottom = Math.min(v.h - PET_CORNER.h, by - BUTTON_R) - M;
    table = { x: M, y: tTop, w: v.w - 2 * M, h: tBottom - tTop };
  }
  if (table.w < 2 * BEAD_REACH || table.h < 2 * BEAD_REACH) return null;
  const c = centre(table);
  const rx = table.w / 2 - BEAD_REACH - 8;
  const ry = table.h / 2 - BEAD_REACH - 8;
  const beads: Pt[] = [];
  for (let i = 0; i < n; i++) {
    const a = -Math.PI / 2 + (2 * Math.PI * i) / n + JITTER[i % JITTER.length];
    beads.push({ x: c.x + rx * Math.cos(a), y: c.y + ry * Math.sin(a) });
  }
  for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) {
    if (Math.hypot(beads[i].x - beads[j].x, beads[i].y - beads[j].y) < BEAD_GAP) return null;
  }
  const parts = [tally, table, undo, again, ...(card ? [card] : []), ...(check ? [check] : [])];
  if (!parts.every((p) => inside(p, v))) return null;
  if (parts.some((p) => corners(v).some((q) => overlaps(p, q)))) return null;
  if (parts.some((p, i) => parts.some((q, j) => i < j && overlaps(p, q)))) return null;
  return { beads, table, tally, card, check, undo, again };
}

/** Distance from p to the segment a–b. */
export function toSegment(p: Pt, a: Pt, b: Pt): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len = dx * dx + dy * dy;
  const t = len ? Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / len)) : 0;
  return Math.hypot(p.x - a.x - t * dx, p.y - a.y - t * dy);
}

/** A tap within this many units of a link's line (outside the beads) breaks it. */
export const LINK_REACH = 50;

/** The link a tap at p breaks: the nearest within reach, or null. */
export function linkAt(p: Pt, beads: readonly Pt[], links: readonly Link[]): Link | null {
  let best: Link | null = null;
  let bestD = LINK_REACH;
  for (const l of links) {
    const d = toSegment(p, beads[l[0]], beads[l[1]]);
    if (d <= bestD) { bestD = d; best = l; }
  }
  return best;
}

/** Where a carried bead lands: the nearest other bead within reach (a link if both have a free hand), or null. */
export function beadAt(p: Pt, beads: readonly Pt[], from: number): number | null {
  let best: number | null = null;
  let bestD = 1.6 * BEAD_R;
  beads.forEach((b, i) => {
    if (i === from) return;
    const d = Math.hypot(p.x - b.x, p.y - b.y);
    if (d <= bestD) { bestD = d; best = i; }
  });
  return best;
}

/** The tally strip's counts: how many beads of each kind, in tally order. Nothing is ever added or removed. */
export function tally(kinds: readonly Kind[]): { kind: Kind; count: number }[] {
  return KIND_ORDER.map((kind) => ({ kind, count: kinds.filter((x) => x === kind).length })).filter((t) => t.count > 0);
}
