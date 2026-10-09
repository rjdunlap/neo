import type { Rng } from '../../engine/random';

/**
 * Roundup, after Neopets' Extreme Herder and Club Penguin's Puffle Roundup: animals scoot away
 * from your finger, so you shoo them through a gate into their pen. Nobody escapes for good,
 * and a wrong pen just means a hop back out.
 */
export type HerdMode = 'tap' | 'shoo' | 'sort' | 'count' | 'sortCount';
export type Kind = 'pig' | 'bunny' | 'cow';

export interface HerdPlan {
  mode: HerdMode;
  animals: number;
  /** count/sortCount: how many each pen wants (a range). */
  min?: number;
  max?: number;
  name: string;
}

export const PLANS: HerdPlan[] = [
  { mode: 'tap', animals: 3, name: 'Tap an animal and it hops into its pen' },
  { mode: 'shoo', animals: 3, name: 'Shoo three animals into the pen with a finger' },
  { mode: 'shoo', animals: 5, name: 'Shoo five animals into the pen' },
  { mode: 'sort', animals: 4, name: 'Sort pigs and bunnies into their own pens' },
  { mode: 'count', animals: 6, min: 2, max: 4, name: 'Put an exact number in the pen (2 to 4)' },
  { mode: 'sortCount', animals: 7, min: 1, max: 3, name: 'Sort and count: "three pigs in the mud, two bunnies in the carrots"' },
];

export const planFor = (level: number) => PLANS[Math.min(PLANS.length, Math.max(1, level)) - 1];

export const PLURAL: Record<Kind, string> = { pig: 'pigs', bunny: 'bunnies', cow: 'cows' };

export interface Pen {
  kind: Kind;
  /** How many belong here; undefined means all of that kind. */
  target?: number;
}

export interface Herd {
  animals: Kind[];
  pens: Pen[];
}

export function makeHerd(plan: HerdPlan, rng: Rng): Herd {
  const n = plan.animals;
  if (plan.mode === 'sort' || plan.mode === 'sortCount') {
    const pens: Pen[] = [{ kind: 'pig' }, { kind: 'bunny' }];
    if (plan.mode === 'sortCount') for (const p of pens) p.target = rng.int(plan.min!, plan.max!);
    // At least one of each, and for counting at least one spare of each.
    const pigs = plan.mode === 'sortCount' ? pens[0].target! + 1 : Math.ceil(n / 2);
    const bunnies = plan.mode === 'sortCount' ? pens[1].target! + 1 : n - pigs;
    return { animals: rng.shuffle([...Array(pigs).fill('pig'), ...Array(bunnies).fill('bunny')]), pens };
  }
  const kind = rng.pick<Kind>(['pig', 'bunny', 'cow']);
  const pen: Pen = { kind };
  if (plan.mode === 'count') pen.target = rng.int(plan.min!, Math.min(plan.max!, n - 1));
  return { animals: Array(n).fill(kind), pens: [pen] };
}

export type EnterResult = 'in' | 'wrong-pen';

/** An animal of `kind` steps through the gate of `pen`. Counting pens take any number; the bell checks. */
export function enter(pen: Pen, kind: Kind): EnterResult {
  return pen.kind === kind ? 'in' : 'wrong-pen';
}

/** Counting levels end on the bell: for each pen, how many too many or too few are inside. */
export function ringBell(herd: Herd, inside: number[]): { extra: number; short: number }[] {
  return herd.pens.map((pen, i) => {
    const n = wanted(herd, pen);
    return { extra: Math.max(0, inside[i] - n), short: Math.max(0, n - inside[i]) };
  });
}

/** Whether filling the pens finishes the round by itself (the counting levels wait for the bell). */
export const usesBell = (plan: HerdPlan) => plan.mode === 'count' || plan.mode === 'sortCount';

/** How many each pen needs before the round is done. */
export function wanted(herd: Herd, pen: Pen): number {
  return pen.target ?? herd.animals.filter((k) => k === pen.kind).length;
}

/**
 * How fast an animal scoots away from a finger `d` units off: nothing beyond `radius`,
 * up to `top` speed right next to it.
 */
export function fleeSpeed(d: number, radius: number, top: number): number {
  if (d >= radius) return 0;
  const t = 1 - d / radius;
  return top * (0.35 + 0.65 * t);
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

/** Pens open on their left side, across the middle of that wall. */
export function throughGate(r: Rect, from: { x: number; y: number }, to: { x: number; y: number }, gate = 0.6): boolean {
  if (!(from.x <= r.x && to.x > r.x)) return false;
  const t = (r.x - from.x) / (to.x - from.x || 1);
  const y = from.y + (to.y - from.y) * t;
  const pad = (r.h * (1 - gate)) / 2;
  return y > r.y + pad && y < r.y + r.h - pad;
}
