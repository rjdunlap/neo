import type { Rng } from '../../engine/random';
import type { View } from '../../engine/view';

/**
 * Bond Beads: round beads with little hands, linked hand to hand. A toy model only: levels 1–4 name no substance and say
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

/** The small pieces levels 3–4 take apart and build: a pair of H, and the H–O–H trio. */
export const PAIR: Shape = { id: 'pair', kinds: k('HH'), links: L([0, 1]), pic: [{ x: -0.5, y: 0 }, { x: 0.5, y: 0 }] };
export const TRIO: Shape = { id: 'trio', kinds: k('HOH'), links: L([0, 1], [1, 2]), pic: [{ x: -1, y: 0.3 }, { x: 0, y: -0.3 }, { x: 1, y: 0.3 }] };

/** A request is a set of shapes that together use every bead; its key is the build key they make. */
export const requestKey = (shapes: readonly Shape[]) => shapes.map(shapeKey).sort().join('+');

/** Lay shapes side by side as one tray: their kinds in order, their links renumbered. */
export function joinShapes(shapes: readonly Shape[]): { kinds: Kind[]; links: Link[] } {
  const kinds: Kind[] = [];
  const links: Link[] = [];
  for (const s of shapes) {
    const off = kinds.length;
    kinds.push(...s.kinds);
    links.push(...s.links.map(([a, b]) => norm(a + off, b + off)));
  }
  return { kinds, links };
}

/**
 * Level 3: two built shapes on the table and a card with two different shapes of the same beads; the tray must empty into
 * exactly those two. Each pair is played in both directions; the first (the pair and chain to two trios) is authored.
 */
export interface Puzzle { id: string; from: Shape[]; to: Shape[] }
export const PUZZLE_PAIRS: [Shape[], Shape[]][] = [
  [[PAIR, CARDS[0]], [TRIO, TRIO]],
  [[PAIR, CARDS[2]], [TRIO, CARDS[0]]],
];
export const PUZZLES: Puzzle[] = PUZZLE_PAIRS.flatMap(([a, b], i) => [
  { id: `p${i}f`, from: a, to: b },
  { id: `p${i}r`, from: b, to: a },
]);

/**
 * Level 4: loose beads with two cards, the two shapes the same beads make; she builds either, then rearranges into the
 * other. The seven-bead set is authored first.
 */
export interface TwoWays { id: string; kinds: Kind[]; shapes: [Shape, Shape] }
export const SETS: TwoWays[] = [
  {
    id: 'C1O2H4',
    kinds: k('COOHHHH'),
    shapes: [
      // Three H on the C, then C–O–O–H.
      { id: 'tail', kinds: k('COOHHHH'), links: L([0, 1], [1, 2], [2, 3], [0, 4], [0, 5], [0, 6]), pic: [{ x: -1.5, y: 0 }, { x: -0.5, y: 0 }, { x: 0.5, y: 0 }, { x: 1.5, y: 0 }, { x: -1.5, y: -1 }, { x: -2.5, y: 0 }, { x: -1.5, y: 1 }] },
      // Two H on the C, and an O–H on each side.
      { id: 'wings', kinds: k('COOHHHH'), links: L([0, 1], [0, 2], [1, 3], [2, 4], [0, 5], [0, 6]), pic: [{ x: 0, y: 0 }, { x: -1, y: 0 }, { x: 1, y: 0 }, { x: -2, y: 0 }, { x: 2, y: 0 }, { x: 0, y: -1 }, { x: 0, y: 1 }] },
    ],
  },
  {
    id: 'C1O3H2',
    kinds: k('COOOHH'),
    shapes: [
      // A loop of C, O, O, with C–O–H and C–H on C's other hands.
      { id: 'loop3', kinds: k('COOOHH'), links: L([0, 1], [0, 2], [1, 2], [0, 3], [3, 4], [0, 5]), pic: [{ x: 0, y: 0 }, { x: -0.6, y: -0.95 }, { x: 0.6, y: -0.95 }, { x: 0.95, y: 0.65 }, { x: 1.75, y: 1.3 }, { x: -0.95, y: 0.65 }] },
      // A loop of C, O, O, O with two H on the C.
      { id: 'loop4', kinds: k('COOOHH'), links: L([0, 1], [0, 2], [1, 3], [2, 3], [0, 4], [0, 5]), pic: [{ x: 0, y: 0.5 }, { x: -0.95, y: -0.3 }, { x: 0.95, y: -0.3 }, { x: 0, y: -1.1 }, { x: -0.85, y: 1.35 }, { x: 0.85, y: 1.35 }] },
    ],
  },
];

export interface Plan { level: number; name: string; rounds: number }

export const PLANS: Plan[] = [
  { level: 1, name: 'Hold every hand: three trays, any shape', rounds: 3 },
  { level: 2, name: 'Copy the shape: two pictured cards, then Check', rounds: 2 },
  { level: 3, name: 'Take it apart, build two: two built shapes become the two on the card, every bead used', rounds: 2 },
  { level: 4, name: 'The same beads, two ways: build one pictured shape, then rearrange it into the other', rounds: 2 },
];

export function planFor(level: number): Plan {
  return PLANS.find((p) => p.level === level) ?? PLANS[0];
}

/**
 * One tray of a round: its beads in the order laid out, the links it opens with (level 3's built shapes), and what the
 * card asks for: null at level 1 (any shape), one request at levels 2–3, and at level 4 two single-shape requests of
 * which either is accepted first and the other is then built from the same beads (`twoWays`).
 */
export interface Step { kinds: Kind[]; opening: Link[]; requests: Shape[][] | null; twoWays: boolean }

/** The card at level 2, when the step has exactly one single-shape request. */
export const stepCard = (s: Step): Shape | null => (s.requests && s.requests.length === 1 && s.requests[0].length === 1 ? s.requests[0][0] : null);

/** Turn the tray by `off` places (and mirror it when `flip`), so built pieces keep their neighbours on the ring. */
export function rotateTray(kinds: readonly Kind[], links: readonly Link[], off: number, flip: boolean): { kinds: Kind[]; links: Link[] } {
  const n = kinds.length;
  const to = (i: number) => (((flip ? n - 1 - i : i) + off) % n + n) % n;
  const out = new Array<Kind>(n);
  kinds.forEach((kind, i) => { out[to(i)] = kind; });
  return { kinds: out, links: links.map(([a, b]) => norm(to(a), to(b))) };
}

/**
 * A round: level 1 three distinct trays, level 2 two distinct cards, level 3 the authored puzzle then the other pair in
 * either direction, level 4 both sets with the seven-bead set first; each level opens with its authored first.
 */
export function roundFor(level: number, rng: Rng): Step[] {
  const lv = planFor(level).level;
  if (lv === 4) {
    return SETS.map((set) => ({ kinds: rng.shuffle(set.kinds.slice()), opening: [], requests: set.shapes.map((s) => [s]), twoWays: true }));
  }
  if (lv === 3) {
    const second = rng.pick(PUZZLES.filter((p) => p.id.startsWith('p1')));
    return [PUZZLES[0], second].map((p) => {
      const tray = joinShapes(p.from);
      const turned = rotateTray(tray.kinds, tray.links, rng.int(0, tray.kinds.length - 1), rng.chance(0.5));
      return { kinds: turned.kinds, opening: turned.links, requests: [p.to], twoWays: false };
    });
  }
  if (lv === 2) {
    const rest = rng.shuffle(CARDS.slice(1));
    return [CARDS[0], rest[0]].map((card) => ({ kinds: rng.shuffle(card.kinds.slice()), opening: [], requests: [[card]], twoWays: false }));
  }
  const rest = rng.shuffle(Object.keys(TRAYS).filter((t) => t !== FIRST_TRAY));
  return [FIRST_TRAY, rest[0], rest[1]].map((t) => ({ kinds: rng.shuffle(TRAYS[t].slice()), opening: [], requests: null, twoWays: false }));
}

/** The beads on the table and what she has linked, with undo and Start again. Nothing here is ever a miss. */
export class Bench {
  links: Link[];
  private history: Link[][] = [];
  readonly solutions: Link[][];
  private readonly targets: string[] | null;

  /**
   * `requests` null takes any build holding every hand in one piece (level 1); otherwise a build must be exactly one of
   * the requests (level 2 one shape, level 3 two shapes, level 4 either of two shapes). `opening` is where the tray
   * starts and where Start again returns to.
   */
  constructor(readonly kinds: readonly Kind[], readonly requests: readonly Shape[][] | null, readonly opening: readonly Link[] = []) {
    this.links = opening.slice();
    this.targets = requests ? requests.map(requestKey) : null;
    this.solutions = labelledBuilds(kinds, (links) => this.accepts(links));
  }

  /** The request this finished build matches, or null. */
  matched(links: readonly Link[] = this.links): Shape[] | null {
    if (!this.requests || !allHeld(this.kinds, links)) return null;
    const key = buildKey(this.kinds, links);
    const i = this.targets!.indexOf(key);
    return i >= 0 ? this.requests[i] : null;
  }

  accepts(links: readonly Link[]): boolean {
    if (!allHeld(this.kinds, links)) return false;
    if (this.targets !== null) return this.targets.includes(buildKey(this.kinds, links));
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

  /** Back to the opening tray (no links, or level 3's built shapes). Undo can bring the build back. */
  startAgain() {
    if (this.state === linkState(this.opening)) return;
    this.history.push(this.links);
    this.links = this.opening.slice();
  }

  /** The order-free state of the build, for telling whether a Check is a repeat. */
  get state(): string {
    return linkState(this.links);
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

export const linkState = (links: readonly Link[]) => links.map(linkId).sort().join(',');

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

/** The ghost finger's next move: make or break the link `helpFor` names, then (levels 2–4) Check. */
export type Move = { make: Link } | { cut: Link } | { check: true };
export function nextMove(bench: Bench): Move | null {
  if (bench.done) return bench.requests ? { check: true } : null;
  const h = helpFor(bench);
  if (!h) return null;
  return h.kind === 'break' ? { cut: h.link } : { make: h.link };
}

export type Verdict = 'match' | 'repeat' | 'miss' | 'glow' | 'assist';

/**
 * Levels 2–4's accounting. A Check that is not the card is one miss, but only when the build changed since the last
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

  /** A new card: the glow and the per-card counts start over. `checked` is a build already judged (level 4's first shape). */
  next(checked: string | null = null) {
    this.cardMisses = 0;
    this.glowing = false;
    this.helped = false;
    this.last = checked;
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

/** Points around an ellipse at equal arc length from the top, each nudged along the arc by its jitter (in radians). */
function ring(c: Pt, rx: number, ry: number, n: number, amount: number, nudge: number): Pt[] {
  const STEPS = 720;
  const pts: Pt[] = [];
  const cum: number[] = [0];
  for (let i = 1; i <= STEPS; i++) {
    const a0 = -Math.PI / 2 + (2 * Math.PI * (i - 1)) / STEPS;
    const a1 = -Math.PI / 2 + (2 * Math.PI * i) / STEPS;
    cum.push(cum[i - 1] + Math.hypot(rx * (Math.cos(a1) - Math.cos(a0)), ry * (Math.sin(a1) - Math.sin(a0))));
  }
  const total = cum[STEPS];
  const at = (s: number, out: number): Pt => {
    const target = ((s % total) + total) % total;
    let i = 0;
    while (i < STEPS - 1 && cum[i + 1] < target) i++;
    const a = -Math.PI / 2 + (2 * Math.PI * i) / STEPS;
    return { x: c.x + (rx + out) * Math.cos(a), y: c.y + (ry + out) * Math.sin(a) };
  };
  const mean = (rx + ry) / 2;
  for (let i = 0; i < n; i++) {
    pts.push(at((total * i) / n + JITTER[i % JITTER.length] * amount * mean, RADIAL[i % RADIAL.length] * nudge * NUDGE));
  }
  return pts;
}

/** Whether beads are `BEAD_GAP` apart and every pair of possible links has its own midpoint. */
export function spaced(beads: readonly Pt[]): boolean {
  const n = beads.length;
  for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) {
    if (Math.hypot(beads[i].x - beads[j].x, beads[i].y - beads[j].y) < BEAD_GAP) return false;
  }
  const mids: Pt[] = [];
  for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) mids.push({ x: (beads[i].x + beads[j].x) / 2, y: (beads[i].y + beads[j].y) / 2 });
  for (let i = 0; i < mids.length; i++) for (let j = i + 1; j < mids.length; j++) {
    if (Math.hypot(mids[i].x - mids[j].x, mids[i].y - mids[j].y) < MID_GAP) return false;
  }
  return true;
}

/** Small offsets so no two of the beads' possible links share a midpoint (a square's diagonals would). */
const JITTER = [0, 0.26, -0.18, -0.3, -0.12, 0.15, -0.09];
/** In-and-out nudges (a share of `NUDGE`), so beads across the ring from each other do not share a link midpoint. */
const RADIAL = [0.5, -0.5, 0.3, -0.6, 0.6, -0.3, 0.1];
const NUDGE = 36;
/** Jitter strengths tried in turn: the first that keeps every bead `BEAD_GAP` apart and every link midpoint distinct wins. */
export const JITTER_AMOUNTS: [number, number][] = [
  [1, 0], [0.7, 0], [0.45, 0], [0.3, 0], [0.2, 0], [0.12, 0], [0.06, 0], [0, 0],
  [0.3, 0.5], [0.2, 0.7], [0.12, 1], [0.06, 1], [0, 1], [0.2, 1.3], [0, 1.6],
];
/** Link midpoints stay at least this far apart, so a tap on a link is unambiguous. */
export const MID_GAP = 30;
/** The card when it pictures two shapes (levels 3–4): taller in a landscape column, where the pictures stack. */
const TWO_CARD_H = 360;

const button = (cx: number, cy: number): Rect => ({ x: cx - BUTTON_R, y: cy - BUTTON_R, w: 2 * BUTTON_R, h: 2 * BUTTON_R });

/**
 * Where everything goes for `n` beads: the tally strip at the top, the card (levels 2–4; `cardShapes` pictures, 0 for
 * none) and the buttons in a right-hand column (a top band and a bottom row when upright), and the beads on an ellipse
 * in the table that is left, clear of the corners. Null rather than a bead closer than `BEAD_GAP` to another.
 */
export function beadLayout(v: View, n: number, cardShapes: number | boolean): BeadLayout | null {
  const shapes = typeof cardShapes === 'boolean' ? (cardShapes ? 1 : 0) : cardShapes;
  const withCard = shapes > 0;
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
    if (withCard) card = { x: colX, y: top, w: colW, h: shapes >= 2 ? TWO_CARD_H : 220 };
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
  let beads: Pt[] | null = null;
  for (const [amount, nudge] of JITTER_AMOUNTS) {
    // The ring shrinks by the farthest outward nudge, so every bead stays inside the table.
    const margin = nudge * NUDGE * Math.max(...RADIAL);
    const rx = table.w / 2 - BEAD_REACH - 8 - margin;
    const ry = table.h / 2 - BEAD_REACH - 8 - margin;
    const r = ring(c, rx, ry, n, amount, nudge);
    if (spaced(r)) { beads = r; break; }
  }
  if (!beads) return null;
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
