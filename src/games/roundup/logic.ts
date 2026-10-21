import type { Rng } from '../../engine/random';

/**
 * Roundup, after Neopets' Extreme Herder and Club Penguin's Puffle Roundup: animals scoot away
 * from your finger, so you shoo them through a gate into their pen. Nobody escapes for good,
 * and a wrong pen just means a hop back out.
 */
export type HerdMode = 'tap' | 'follow' | 'shoo' | 'sort' | 'sortStay' | 'count' | 'sortCount' | 'fair' | 'size';
export const KINDS = ['pig', 'bunny', 'cow', 'duck', 'dog'] as const;
export type Kind = (typeof KINDS)[number];

export interface HerdPlan {
  mode: HerdMode;
  animals: number;
  /** Optional upper bound for a varied cast. */
  maxAnimals?: number;
  /** count/sortCount: how many each pen wants (a range). */
  min?: number;
  max?: number;
  /** One loose animal at a time, with two successes in the round. */
  sequential?: boolean;
  /** Counting pen starts with 1–3 animals already inside; animals is the loose herd. */
  prefilled?: boolean;
  gate?: number;
  fleeRadius?: number;
  hintAfter?: number;
  helpAfter?: number;
  name: string;
}

export const SHOO_ONE: HerdPlan = {
  mode: 'shoo', animals: 2, sequential: true, gate: 0.8, fleeRadius: 190,
  hintAfter: 10, helpAfter: 20, name: 'Shoo one animal at a time into a wide gate, twice',
};

/** Lap and toddler: the herd gathers to the finger and comes along, so leading replaces getting behind a runner. */
export const COME_ALONG: HerdPlan = {
  mode: 'follow', animals: 3, gate: 0.8, hintAfter: 15, name: 'Lead three animals that follow your finger into a wide pen',
};

export const PLANS: HerdPlan[] = [
  { mode: 'tap', animals: 3, name: 'Tap an animal and it hops into its pen' },
  { mode: 'shoo', animals: 3, name: 'Shoo three animals into the pen with a finger' },
  { mode: 'shoo', animals: 5, name: 'Shoo five animals into the pen' },
  { mode: 'sort', animals: 4, maxAnimals: 5, name: 'Sort four or five animals of two kinds into their own pens' },
  { mode: 'count', animals: 6, min: 2, max: 4, name: 'Put an exact number in the pen (2 to 4)' },
  { mode: 'sortCount', animals: 7, min: 1, max: 3, name: 'Sort two kinds and put the requested number in each pen' },
  { mode: 'sortStay', animals: 6, name: 'Sort pigs and bunnies into their pens; leave the cows on the grass' },
  { mode: 'fair', animals: 6, maxAnimals: 8, name: 'Put the same number of one kind in each of two pens, then ring the bell' },
  { mode: 'count', animals: 6, min: 4, max: 5, prefilled: true, name: 'Fill a pen asking 4 or 5, starting with 1 to 3 already inside' },
  SHOO_ONE,
  COME_ALONG,
  { mode: 'size', animals: 6, name: 'Sort big and little pigs into pens with matching-sized pictures' },
];

export const planFor = (level: number) => PLANS[Math.min(PLANS.length, Math.max(1, level)) - 1];

export const PLURAL: Record<Kind, string> = { pig: 'pigs', bunny: 'bunnies', cow: 'cows', duck: 'ducks', dog: 'dogs' };
/** What each pen's floor is, for "three pigs in the mud". */
export const PLACE: Record<Kind, string> = { pig: 'mud', bunny: 'carrots', cow: 'hay', duck: 'pond', dog: 'kennel' };

/** The animal word for a count: "1 pig", "3 pigs". */
export const animalsFor = (kind: Kind, n: number) => (n === 1 ? kind : PLURAL[kind]);

export type Size = 'big' | 'little';
export const sizeScale = (size?: Size) => size === 'little' ? 0.22 : 0.32;

export interface Pen {
  size?: Size;
  kind: Kind;
  /** How many belong here; undefined means all of that kind. */
  target?: number;
  /** Already home before play begins; included in Herd.animals. */
  start?: number;
}

export interface Herd {
  animals: Kind[];
  /** Parallel to animals, only for size sorting. */
  sizes?: Size[];
  pens: Pen[];
  /** This kind belongs on the grass, outside both pens. */
  stay?: Kind;
  /** Make it fair: two pens of one kind; the bell asks only for the same non-zero number in each. */
  fair?: boolean;
}

export function makeHerd(plan: HerdPlan, rng: Rng): Herd {
  const n = plan.maxAnimals === undefined ? plan.animals : rng.int(plan.animals, plan.maxAnimals);
  if (plan.mode === 'size') {
    const sizes = rng.shuffle<Size>(['big', 'big', 'big', 'little', 'little', 'little']);
    return { animals: sizes.map(() => 'pig'), sizes, pens: [{ kind: 'pig', size: 'big' }, { kind: 'pig', size: 'little' }] };
  }
  if (plan.mode === 'sortStay') {
    return { animals: rng.shuffle(['pig', 'pig', 'bunny', 'bunny', 'cow', 'cow'] as Kind[]), pens: [{ kind: 'pig' }, { kind: 'bunny' }], stay: 'cow' };
  }
  if (plan.mode === 'fair') {
    // Always an even herd (6 or 8), so all of them can be shared out; fewer each with some left loose is fair too.
    const kind = rng.pick(KINDS);
    return { animals: Array(n % 2 ? n + 1 : n).fill(kind), pens: [{ kind }, { kind }], fair: true };
  }
  if (plan.mode === 'sort' || plan.mode === 'sortCount') {
    const pens: Pen[] = rng.shuffle([...KINDS]).slice(0, 2).map((kind) => ({ kind }));
    if (plan.mode === 'sortCount') for (const p of pens) p.target = rng.int(plan.min!, plan.max!);
    // At least one of each, and for counting at least one spare of each.
    const first = plan.mode === 'sortCount' ? pens[0].target! + 1 : rng.int(1, n - 1);
    const second = plan.mode === 'sortCount' ? pens[1].target! + 1 : n - first;
    return { animals: rng.shuffle([...Array<Kind>(first).fill(pens[0].kind), ...Array<Kind>(second).fill(pens[1].kind)]), pens };
  }
  const kind = rng.pick(KINDS);
  const pen: Pen = { kind };
  if (plan.mode === 'count') pen.target = rng.int(plan.min!, Math.min(plan.max!, n - 1));
  if (plan.prefilled) pen.start = rng.int(1, Math.min(3, pen.target! - 1));
  return { animals: Array(n + (pen.start ?? 0)).fill(kind), pens: [pen] };
}

/**
 * Where a round's herd starts: spread down the meadow left of the pens, from the round's own seed,
 * so replaying a level starts the herd somewhere new.
 */
export function startSpots(n: number, field: { x0: number; y0: number; y1: number }, left: number, rng: Rng): { x: number; y: number }[] {
  return Array.from({ length: n }, (_, i) => ({
    x: rng.range(field.x0 + 40, left),
    y: field.y0 + 40 + ((field.y1 - field.y0 - 80) * (i + 0.5)) / n + rng.range(-20, 20),
  }));
}

/** The counting sign's dots beside its numeral: up to two a row, centred on the origin. */
export function signDots(n: number, gap = 26): { x: number; y: number }[] {
  const rows = Math.ceil(n / 2);
  return Array.from({ length: n }, (_, i) => {
    const row = Math.floor(i / 2);
    const inRow = Math.min(2, n - row * 2);
    return { x: ((i % 2) - (inRow - 1) / 2) * gap, y: (row - (rows - 1) / 2) * gap };
  });
}

export type EnterResult = 'in' | 'wrong-pen';

/** An animal of `kind` steps through the gate of `pen`. Counting pens take any number; the bell checks. */
export function enter(pen: Pen, kind: Kind, size?: Size): EnterResult {
  return pen.kind === kind && (pen.size === undefined || pen.size === size) ? 'in' : 'wrong-pen';
}

/** Counting levels end on the bell: for each pen, how many too many or too few are inside. */
export function ringBell(herd: Herd, inside: number[]): { extra: number; short: number }[] {
  return herd.pens.map((pen, i) => {
    const n = wanted(herd, pen);
    return { extra: Math.max(0, inside[i] - n), short: Math.max(0, n - inside[i]) };
  });
}

/** Whether filling the pens finishes the round by itself (the counting levels wait for the bell). */
export const usesBell = (plan: HerdPlan) => plan.mode === 'count' || plan.mode === 'sortCount' || plan.mode === 'fair';

/** The pen with fewer inside (the first when they are level). */
export const emptierPen = (inside: number[]) => (inside[1] < inside[0] ? 1 : 0);

/**
 * Make it fair's bell: the same number in each pen, and not none. Otherwise it names the fuller and the emptier pen,
 * and how many hop out of the fuller one to make it fair; nobody hops out when the emptier pen is still empty.
 */
export function fairBell(inside: number[]): { fair: boolean; more: number; less: number; extra: number } {
  const less = emptierPen(inside);
  const more = 1 - less;
  const fair = inside[0] === inside[1] && inside[0] > 0;
  return { fair, more, less, extra: fair || inside[less] === 0 ? 0 : inside[more] - inside[less] };
}

/** Make it fair's demonstration and help aim for half each: the emptier pen, until both hold half. */
export function fairNeeds(herd: Herd, inside: number[]): number {
  const i = emptierPen(inside);
  return inside[i] < herd.animals.length / 2 ? i : -1;
}

/** How many each pen needs before the round is done. */
export function wanted(herd: Herd, pen: Pen): number {
  if (herd.fair) return herd.animals.length / 2;
  return pen.target ?? herd.animals.filter((k, i) => k === pen.kind && (pen.size === undefined || herd.sizes?.[i] === pen.size)).length;
}

/** All requested animals are home; outsiders are deliberately absent from these totals. */
export const pensFull = (herd: Herd, inside: number[]) => herd.pens.every((pen, i) => inside[i] >= wanted(herd, pen));

/**
 * How fast an animal scoots away from a finger `d` units off: nothing beyond `radius`,
 * up to `top` speed right next to it.
 */
export function fleeSpeed(d: number, radius: number, top: number): number {
  if (d >= radius) return 0;
  const t = 1 - d / radius;
  return top * (0.35 + 0.65 * t);
}

/** How fast an animal runs from a finger at its closest. */
export const SHOO_SPEED = 330;
/** Following: how near the finger the herd gathers, and its top speed (always below a fleeing animal's). */
export const FOLLOW_STOP = 85;
export const FOLLOW_SPEED = 190;

/**
 * How fast a following animal `d` units from the finger comes toward it: nothing inside `stop`, so the herd
 * gathers round the finger instead of under it, rising gently to `top` farther out.
 */
export function followSpeed(d: number, stop = FOLLOW_STOP, top = FOLLOW_SPEED): number {
  if (d <= stop) return 0;
  return Math.min(top, (d - stop) * 2.2);
}

/** Loose animals push apart to at least `min` units, so a gathered herd never piles onto one point. */
export function spreadApart(points: { x: number; y: number }[], min = 70) {
  for (let i = 0; i < points.length; i++) {
    for (let j = i + 1; j < points.length; j++) {
      const [p, q] = [points[i], points[j]];
      const dx = q.x - p.x;
      const dy = q.y - p.y;
      const d = Math.hypot(dx, dy);
      if (d > 0 && d < min) {
        const push = (min - d) / 2;
        p.x -= (dx / d) * push;
        p.y -= (dy / d) * push;
        q.x += (dx / d) * push;
        q.y += (dy / d) * push;
      }
    }
  }
}

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export const inRect = (r: Rect, x: number, y: number) => x > r.x && x < r.x + r.w && y > r.y && y < r.y + r.h;

/** Put a steering finger behind an animal, opposite the gate it should move toward. */
export function shooPoint(animal: { x: number; y: number }, gate: { x: number; y: number }, distance = 105): { x: number; y: number } {
  const dx = gate.x - animal.x;
  const dy = gate.y - animal.y;
  const d = Math.hypot(dx, dy) || 1;
  return { x: animal.x - (dx / d) * distance, y: animal.y - (dy / d) * distance };
}

/**
 * Where to lead an animal next on its way into pen `r`: the middle of the gate's mouth outside, then, once it is
 * lined up with the gate, inside. The demonstration's finger and the gentle drift both use it.
 */
export function leadGoal(animal: { x: number; y: number }, r: Rect): { x: number; y: number } {
  const mid = r.y + r.h / 2;
  const aligned = Math.abs(animal.y - mid) < r.h * 0.25;
  return aligned && animal.x > r.x - 140 ? { x: r.x + 90, y: mid } : { x: r.x - 90, y: mid };
}

/** Pens open on their left side, across the middle of that wall. */
export function throughGate(r: Rect, from: { x: number; y: number }, to: { x: number; y: number }, gate = 0.6): boolean {
  if (!(from.x <= r.x && to.x > r.x)) return false;
  const t = (r.x - from.x) / (to.x - from.x || 1);
  const y = from.y + (to.y - from.y) * t;
  const pad = (r.h * (1 - gate)) / 2;
  return y > r.y + pad && y < r.y + r.h - pad;
}
