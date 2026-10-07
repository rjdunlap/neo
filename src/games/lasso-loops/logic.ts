import type { Rng } from '../../engine/random';

/**
 * Lasso Loops, after Montessori golden beads, ten frames and Pokémon Ranger's capture loop: draw a loop around
 * fireflies and they fly into a jar together, one loop for one group. The ladder goes from looping any fireflies,
 * to exactly two or three, to jars of five and of ten (counting the jars and the ones left over, so 34 is three
 * tens and four), to equal groups ("3 groups of 4") as the first idea of multiplying.
 */
export type LassoMode = 'free' | 'exact' | 'fives' | 'tens' | 'groups';

export interface LassoPlan {
  mode: LassoMode;
  name: string;
}

export const PLANS: LassoPlan[] = [
  { mode: 'free', name: 'Draw loops around fireflies: each loop flies into a jar' },
  { mode: 'exact', name: 'Loop exactly 2 or 3 fireflies for each jar' },
  { mode: 'fives', name: 'Jars of 5: loop fives, then count by fives and the ones left over' },
  { mode: 'tens', name: 'Jars of 10: loop tens, then say the number (34 is 3 tens and 4 ones)' },
  { mode: 'groups', name: 'Equal groups: make 3 groups of 4, then say how many in all' },
];

export const planFor = (level: number) => PLANS[Math.min(PLANS.length, Math.max(1, level)) - 1];

export interface LassoRound {
  fireflies: number;
  /** How many each jar wants, in order; 0 on the free level (any loop fills the next jar). */
  jars: number[];
  /** The total to say at the end, or null when there's no question. */
  answer: number | null;
  /** Fireflies left over after the jars are full (fives and tens). */
  ones: number;
  group?: { count: number; size: number };
}

export function makeRound(plan: LassoPlan, rng: Rng): LassoRound {
  switch (plan.mode) {
    case 'free':
      return { fireflies: 8, jars: [0, 0, 0, 0, 0, 0], answer: null, ones: 0 };
    case 'exact': {
      const jars = rng.shuffle([2, 3, rng.pick([2, 3])]);
      return { fireflies: jars.reduce((s, n) => s + n, 0) + 2, jars, answer: null, ones: 0 };
    }
    case 'fives': {
      const tens = rng.int(2, 3);
      const ones = rng.int(1, 4);
      return { fireflies: 5 * tens + ones, jars: Array(tens).fill(5), answer: 5 * tens + ones, ones };
    }
    case 'tens': {
      const tens = rng.int(2, 3);
      const ones = rng.int(1, 9);
      return { fireflies: 10 * tens + ones, jars: Array(tens).fill(10), answer: 10 * tens + ones, ones };
    }
    case 'groups': {
      for (;;) {
        const count = rng.int(2, 4);
        const size = rng.int(2, 5);
        if (count * size > 16 || count * size < 6) continue;
        return { fireflies: count * size + rng.int(2, 3), jars: Array(count).fill(size), answer: count * size, ones: 0, group: { count, size } };
      }
    }
  }
}

/** Three answers to choose from: the right one and two mistakes that make sense to look at. */
export function choices(round: LassoRound, rng: Rng): number[] {
  const n = round.answer!;
  const out = new Set([n]);
  const tens = Math.floor(n / 10);
  const ones = n % 10;
  const tries = [
    // Tens and ones swapped (34 and 43), and one ten more or less.
    ones !== tens && ones > 0 ? ones * 10 + tens : -1,
    n + 10,
    n - 10,
    // Off by one, or by one group.
    n + 1,
    n - 1,
    round.group ? n + round.group.size : -1,
    round.group ? n - round.group.size : -1,
  ].filter((v) => v > 0 && v !== n);
  for (const v of rng.shuffle(tries)) {
    if (out.size >= 3) break;
    out.add(v);
  }
  return rng.shuffle([...out]);
}

// Firefly places and loops ------------------------------------------------------------------------

export interface Point {
  x: number;
  y: number;
}

/** Spots on a jittered grid in the unit square, one firefly per cell, so loops have room to go between them. */
export function scatter(n: number, rng: Rng, cols: number, rows: number): Point[] {
  const cells = rng.shuffle(Array.from({ length: cols * rows }, (_, i) => i)).slice(0, n);
  return cells.map((c) => ({
    x: ((c % cols) + 0.5 + rng.range(-0.22, 0.22)) / cols,
    y: (Math.floor(c / cols) + 0.5 + rng.range(-0.22, 0.22)) / rows,
  }));
}

/** The grid for `n` fireflies: wide rather than tall, with spare cells. */
export function gridFor(n: number): { cols: number; rows: number } {
  const rows = n <= 10 ? 3 : n <= 20 ? 4 : 5;
  return { cols: Math.ceil((n * 1.15) / rows), rows };
}

/** Whether a point is inside the (closed) loop, by counting crossings. */
export function inside(loop: readonly Point[], p: Point): boolean {
  let hit = false;
  for (let i = 0, j = loop.length - 1; i < loop.length; j = i++) {
    const a = loop[i];
    const b = loop[j];
    if (a.y > p.y !== b.y > p.y && p.x < ((b.x - a.x) * (p.y - a.y)) / (b.y - a.y) + a.x) hit = !hit;
  }
  return hit;
}

/** A group of `n` free fireflies close together, to glow as a hint: the first one's nearest neighbors. */
export function nearestGroup(points: readonly Point[], free: readonly number[], n: number): number[] {
  if (free.length < n) return [];
  const seed = [...free].sort((a, b) => points[a].x - points[b].x || points[a].y - points[b].y)[0];
  return [...free].sort((a, b) => Math.hypot(points[a].x - points[seed].x, points[a].y - points[seed].y) - Math.hypot(points[b].x - points[seed].x, points[b].y - points[seed].y)).slice(0, n);
}
