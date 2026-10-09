import type { CritterName } from '../../art/critter';
import type { Rng } from '../../engine/random';

/**
 * Critter Sort: sorting by what you can see, the way scientists and librarians do. Drag critters
 * into a hoop: first one rule (in or out), then two separate hoops, then two overlapping hoops
 * where the middle means "both", and finally, with critters already sorted, work out the rule.
 */
export type SortMode = 'one' | 'two' | 'venn' | 'guess';

export interface SortPlan {
  mode: SortMode;
  critters: number;
  rounds: number;
  name: string;
}

export const PLANS: SortPlan[] = [
  { mode: 'one', critters: 5, rounds: 2, name: 'One hoop: put in every critter that fits the rule (like "wearing a hat")' },
  { mode: 'two', critters: 6, rounds: 2, name: 'Two hoops with different rules; some critters fit neither' },
  { mode: 'venn', critters: 6, rounds: 2, name: 'Overlapping hoops: the middle is for critters that fit both rules' },
  { mode: 'guess', critters: 6, rounds: 3, name: 'Already sorted: what is the rule? Pick the right picture' },
];

export const planFor = (level: number) => PLANS[Math.min(PLANS.length, Math.max(1, level)) - 1];

export type Rule = 'hat' | 'brown' | 'white' | 'floppy' | 'pointy' | 'whiskers';

export const RULE_WORDS: Record<Rule, string> = {
  hat: 'wearing a hat',
  brown: 'brown',
  white: 'white',
  floppy: 'with floppy ears',
  pointy: 'with pointy ears',
  whiskers: 'with whiskers',
};

export interface SortCritter {
  kind: CritterName;
  hat: boolean;
}

const KINDS: CritterName[] = ['cow', 'duck', 'pig', 'cat', 'bear', 'dog', 'bunny'];

export function fits(c: SortCritter, rule: Rule): boolean {
  switch (rule) {
    case 'hat':
      return c.hat;
    case 'brown':
      return c.kind === 'bear' || c.kind === 'dog';
    case 'white':
      return c.kind === 'cow' || c.kind === 'bunny';
    case 'floppy':
      return c.kind === 'cow' || c.kind === 'dog';
    case 'pointy':
      return c.kind === 'pig' || c.kind === 'cat';
    case 'whiskers':
      return c.kind === 'cat' || c.kind === 'bunny';
  }
}

/** Rules that never overlap make sense as two separate hoops; overlapping hoops need some critters in both. */
export const SEPARATE: [Rule, Rule][] = [
  ['brown', 'white'],
  ['floppy', 'pointy'],
  ['brown', 'pointy'],
];
export const OVERLAPPING: [Rule, Rule][] = [
  ['hat', 'brown'],
  ['hat', 'whiskers'],
  ['floppy', 'white'],
  ['whiskers', 'white'],
  ['brown', 'floppy'],
  ['hat', 'pointy'],
];

/** Where a critter belongs: in the left hoop, the right hoop, both (the middle) or neither. */
export type Place = 'left' | 'right' | 'both' | 'out';

export function placeOf(c: SortCritter, rules: Rule[]): Place {
  const a = fits(c, rules[0]);
  const b = rules[1] ? fits(c, rules[1]) : false;
  return a && b ? 'both' : a ? 'left' : b ? 'right' : 'out';
}

export interface SortRound {
  rules: Rule[];
  critters: SortCritter[];
  /** 'guess': the true rule and two others offered (one hoop). */
  options?: Rule[];
}

/** A round where every place in play gets at least one critter, so each part of the diagram matters. */
export function makeRound(plan: SortPlan, rng: Rng, avoid?: string): SortRound {
  for (;;) {
    let rules: Rule[];
    if (plan.mode === 'two') rules = [...rng.pick(SEPARATE)];
    else if (plan.mode === 'venn') rules = [...rng.pick(OVERLAPPING)];
    else rules = [rng.pick(['hat', 'brown', 'white', 'floppy', 'pointy', 'whiskers'] as Rule[])];
    if (rng.chance(0.5)) rules.reverse();
    if (rules.join() === avoid) continue;
    const critters: SortCritter[] = [];
    for (let i = 0; i < plan.critters; i++) critters.push({ kind: rng.pick(KINDS), hat: rng.chance(0.4) });
    const key = (c: SortCritter) => `${c.kind}${c.hat}`;
    if (new Set(critters.map(key)).size < critters.length) continue;
    const places = new Set(critters.map((c) => placeOf(c, rules)));
    const needed: Place[] = plan.mode === 'two' ? ['left', 'right', 'out'] : plan.mode === 'venn' ? ['left', 'right', 'both', 'out'] : ['left', 'out'];
    if (!needed.every((p) => places.has(p))) continue;
    if (plan.mode === 'guess') {
      // Two other rules that would sort these critters differently, so only one rule fits.
      const others = rng.shuffle((['hat', 'brown', 'white', 'floppy', 'pointy', 'whiskers'] as Rule[]).filter((r) => r !== rules[0] && critters.some((c) => fits(c, r) !== fits(c, rules[0]))));
      if (others.length < 2) continue;
      return { rules, critters, options: rng.shuffle([rules[0], ...others.slice(0, 2)]) };
    }
    return { rules, critters };
  }
}

/** How big a hoop is. */
export const HOOP_R = 150;

export interface Point {
  x: number;
  y: number;
}

/** Hoop centers: one hoop in the middle, two apart, or two overlapping. */
export function hoopCenters(mode: SortMode, hoops: number, v: { w: number; h: number }): Point[] {
  const y = v.h * 0.42;
  if (hoops === 1) return [{ x: v.w / 2, y }];
  const gap = mode === 'venn' ? 210 : 360;
  return [{ x: v.w / 2 - gap / 2, y }, { x: v.w / 2 + gap / 2, y }];
}

/**
 * Which part of the diagram a critter let go at (x, y) lands in. A critter's origin is its feet, 50 units below the
 * middle of the body, so the hoops are measured from 50 above the drop.
 */
export function placeAt(centers: readonly Point[], x: number, y: number): Place {
  const inA = Math.hypot(x - centers[0].x, y - 50 - centers[0].y) < HOOP_R;
  const inB = centers[1] ? Math.hypot(x - centers[1].x, y - 50 - centers[1].y) < HOOP_R : false;
  return inA && inB ? 'both' : inA ? 'left' : inB ? 'right' : 'out';
}

/** A good spot inside a part of the diagram for a critter's feet (`k` spreads several apart; 1 is the middle of the part). */
export function spotFor(centers: readonly Point[], mode: SortMode, place: Place, k = 0): Point {
  const jitter = (k % 3) * 64 - 64;
  if (place === 'both') return { x: (centers[0].x + centers[1].x) / 2, y: centers[0].y + 40 + jitter * 0.6 };
  const c = centers[place === 'right' ? 1 : 0];
  const out = centers.length === 2 && mode === 'venn' ? (place === 'right' ? 70 : -70) : 0;
  return { x: c.x + out + jitter, y: c.y + 50 + (k > 2 ? -70 : 0) };
}

/**
 * What a capable child does next: carry the first critter still on the grass that belongs in a hoop to the middle of
 * its part of the diagram. A critter that fits neither rule stays where it is, so it is never carried. The ghost finger follows this.
 */
export function nextToSort<S extends { c: SortCritter; placed: Place | null }>(sorters: readonly S[], rules: readonly Rule[]): { who: S; place: Place } | undefined {
  for (const who of sorters) {
    const place = placeOf(who.c, [...rules]);
    if (!who.placed && place !== 'out') return { who, place };
  }
  return undefined;
}

/** In the "what is the rule?" round, the picture the ghost finger taps. */
export const ruleToTap = (round: SortRound): Rule => round.rules[0];
