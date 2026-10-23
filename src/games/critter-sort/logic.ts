import type { CritterName } from '../../art/critter';
import type { Rng } from '../../engine/random';

/**
 * Critter Sort: sorting by what you can see, the way scientists and librarians do. Drag critters
 * into a hoop: first one rule (in or out), then two separate hoops, then two overlapping hoops
 * where the middle means "both", and finally, with critters already sorted, work out the rule.
 */
export type SortMode = 'one' | 'two' | 'venn' | 'guess' | 'not' | 'resort' | 'butnot';

export interface SortPlan {
  mode: SortMode;
  critters: number;
  rounds: number;
  name: string;
  /** A worked example: one critter already sits in each hoop when the round starts (in overlapping hoops, in the middle). */
  example?: boolean;
  /** Exactly this many critters belong in the hoop (Just a few: the example and one more). */
  fitting?: number;
  /** All but one critter start sorted; the newcomer is the only movable one. */
  newcomer?: boolean;
  /** Count the sorted parts, then compare their quantities. */
  count?: boolean;
  /** Little plants grown from one big plant's seeds instead of critters. */
  cast?: 'plants';
}

export const PLANS: SortPlan[] = [
  { mode: 'one', critters: 5, rounds: 2, example: true, name: 'One hoop, one critter already in: put in every critter that fits the rule (like "wearing a hat")' },
  { mode: 'two', critters: 6, rounds: 2, example: true, name: 'Two hoops with different rules, one critter already in each; some critters fit neither' },
  { mode: 'venn', critters: 6, rounds: 2, example: true, name: 'Overlapping hoops, one critter already in the middle: the middle is for critters that fit both rules' },
  { mode: 'guess', critters: 6, rounds: 3, name: 'Already sorted: what is the rule? Pick the right picture' },
  { mode: 'not', critters: 6, rounds: 3, example: true, name: 'A not hoop, one critter already in: put in every critter that does not fit the picture rule' },
  { mode: 'one', critters: 3, rounds: 2, example: true, fitting: 2, name: 'Just a few: three critters, one already in the hoop; which of the other two fits?' },
  { mode: 'venn', critters: 6, rounds: 3, newcomer: true, name: 'Where does the new one go? Place one newcomer in a sorted diagram: left, right, both, or neither' },
  { mode: 'resort', critters: 6, rounds: 1, name: 'A new sign: sort six critters into a hoop or onto the leaf mat, then sort the same six again by a new rule' },
  { mode: 'butnot', critters: 6, rounds: 2, name: 'This but not that: one hoop for critters that fit the first sign but not the crossed-out sign; all others go on the leaf mat' },
];

// ID 10 remains reserved for Pick the signs; existing plan IDs never move.
export const COUNT_PLAN: SortPlan = { mode: 'two', critters: 6, rounds: 2, count: true, name: 'How many? Sort six critters, tap to count each hoop and the leaf mat aloud, then choose the part with more' };
// Same Kind, Different Sprouts: every plant belongs to the family; only the hoop changes.
export const SPROUT_PLANS: Record<12 | 13, SortPlan> = {
  12: { mode: 'one', critters: 4, rounds: 2, example: true, cast: 'plants', name: 'Like the big plant: one hoop, one little plant already in; put in every little plant that shares the big plant\u2019s pictured feature' },
  13: { mode: 'venn', critters: 6, rounds: 2, example: true, cast: 'plants', name: 'Same and different: overlapping hoops for the big plant\u2019s leaves and petal marks; the middle is both, the leaf mat is different both ways' },
};
export const planFor = (level: number) => level === 11 ? COUNT_PLAN : level === 12 || level === 13 ? SPROUT_PLANS[level] : PLANS[Math.min(PLANS.length, Math.max(1, level)) - 1];

export type Rule = 'hat' | 'brown' | 'white' | 'floppy' | 'pointy' | 'whiskers' | PlantRule;
export type PlantRule = 'round' | 'pointyleaf' | 'spotted' | 'plain';
export type Leaves = 'round' | 'pointy';
export type Petals = 'spotted' | 'plain';

export const RULE_WORDS: Record<Rule, string> = {
  hat: 'wearing a hat',
  brown: 'brown',
  white: 'white',
  floppy: 'with floppy ears',
  pointy: 'with pointy ears',
  whiskers: 'with whiskers',
  round: 'with round leaves',
  pointyleaf: 'with pointy leaves',
  spotted: 'with spotted petals',
  plain: 'with plain petals',
};

/** What a plant has, said after "has": the miss and middle lines name the feature itself. */
export const HAVE_WORDS: Record<PlantRule, string> = { round: 'round leaves', pointyleaf: 'pointy leaves', spotted: 'spotted petals', plain: 'plain petals' };
const PLANT_RULES: Rule[] = ['round', 'pointyleaf', 'spotted', 'plain'];
export const isPlantRule = (r: Rule): r is PlantRule => PLANT_RULES.includes(r);

/** A little plant's two sortable features; the pot (0-5) is decoration that tells two alike plants apart. */
export interface SortSprout {
  leaves: Leaves;
  petals: Petals;
  pot: number;
}

export interface SortCritter {
  kind: CritterName;
  hat: boolean;
  /** Set on the little plants of levels 12-13 (`kind` is then unused). */
  plant?: SortSprout;
}

const KINDS: CritterName[] = ['cow', 'duck', 'pig', 'cat', 'bear', 'dog', 'bunny'];

export function fits(c: SortCritter, rule: Rule): boolean {
  if (isPlantRule(rule)) {
    const p = c.plant;
    return !!p && (rule === 'round' ? p.leaves === 'round' : rule === 'pointyleaf' ? p.leaves === 'pointy' : p.petals === rule);
  }
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
    default:
      return false;
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

export function placeOf(c: SortCritter, rules: Rule[], not: boolean | 'butnot' = false): Place {
  if (not === 'butnot') return fits(c, rules[0]) && !fits(c, rules[1]) ? 'left' : 'out';
  const a = not ? !fits(c, rules[0]) : fits(c, rules[0]);
  const b = rules[1] ? fits(c, rules[1]) : false;
  return a && b ? 'both' : a ? 'left' : b ? 'right' : 'out';
}

export interface SortRound {
  rules: Rule[];
  critters: SortCritter[];
  /** 'guess': the true rule and two others offered (one hoop). */
  options?: Rule[];
  /** A second pictured rule for the same critters in A new sign. */
  nextRule?: Rule;
  /** Index of the single newcomer in an otherwise sorted diagram. */
  newcomer?: number;
  /** Plant levels: the big plant's features, and the one petal colour the whole family shares. */
  parent?: { leaves: Leaves; petals: Petals };
  petalColor?: number;
}

/**
 * A family of little plants for levels 12-13. Level 12 shows one of the big plant's features on a single sign (a petal
 * mark in one round and a leaf shape in the other); level 13 shows both on overlapping signs. Two or three of the four
 * level-12 plants share the sign (the example included) and at least one differs; level 13 fills all four parts.
 */
export function makePlantRound(plan: SortPlan, rng: Rng, avoid?: string): SortRound {
  for (;;) {
    const parent = { leaves: rng.pick(['round', 'pointy'] as Leaves[]), petals: rng.pick(['spotted', 'plain'] as Petals[]) };
    const leafRule: PlantRule = parent.leaves === 'round' ? 'round' : 'pointyleaf';
    let rules: Rule[];
    if (plan.mode === 'venn') {
      rules = [leafRule, parent.petals];
      if (rng.chance(0.5)) rules.reverse();
    } else {
      // The second round shows the other kind of feature from the first.
      const petalNow = avoid ? !['spotted', 'plain'].includes(avoid) : rng.chance(0.5);
      rules = [petalNow ? parent.petals : leafRule];
    }
    if (rules.join() === avoid) continue;
    const plants: SortCritter[] = [];
    for (let i = 0; i < plan.critters; i++) {
      plants.push({ kind: 'cow', hat: false, plant: { leaves: rng.pick(['round', 'pointy'] as Leaves[]), petals: rng.pick(['spotted', 'plain'] as Petals[]), pot: rng.int(0, 5) } });
    }
    const key = (c: SortCritter) => `${c.plant!.leaves}${c.plant!.petals}${c.plant!.pot}`;
    if (new Set(plants.map(key)).size < plants.length) continue;
    const places = plants.map((c) => placeOf(c, rules));
    if (plan.mode === 'venn') {
      if (!(['left', 'right', 'both', 'out'] as Place[]).every((p) => places.includes(p))) continue;
    } else {
      const matching = places.filter((p) => p !== 'out').length;
      if (matching < 2 || matching > 3) continue;
    }
    return { rules, critters: plants, parent, petalColor: rng.int(0, 2) };
  }
}

/** A round where every place in play gets at least one critter, so each part of the diagram matters. */
export function makeRound(plan: SortPlan, rng: Rng, avoid?: string): SortRound {
  for (;;) {
    let rules: Rule[];
    if (plan.mode === 'two') rules = [...rng.pick(SEPARATE)];
    else if (plan.mode === 'venn' || plan.mode === 'butnot') rules = [...rng.pick(OVERLAPPING)];
    else rules = [rng.pick(['hat', 'brown', 'white', 'floppy', 'pointy', 'whiskers'] as Rule[])];
    if (rng.chance(0.5)) rules.reverse();
    if (rules.join() === avoid) continue;
    const critters: SortCritter[] = [];
    for (let i = 0; i < plan.critters; i++) critters.push({ kind: rng.pick(KINDS), hat: rng.chance(0.4) });
    const key = (c: SortCritter) => `${c.kind}${c.hat}`;
    if (new Set(critters.map(key)).size < critters.length) continue;
    const not = plan.mode === 'butnot' ? 'butnot' : plan.mode === 'not';
    const places = new Set(critters.map((c) => placeOf(c, rules, not)));
    const needed: Place[] = plan.mode === 'two' ? ['left', 'right', 'out'] : plan.mode === 'venn' ? ['left', 'right', 'both', 'out'] : ['left', 'out'];
    if (!needed.every((p) => places.has(p))) continue;
    // Both tempting A-and-B exclusions and critters matching neither must be visible.
    if (plan.mode === 'butnot' && (!critters.some(c => fits(c, rules[0]) && fits(c, rules[1])) ||
      !critters.some(c => !fits(c, rules[0]) && !fits(c, rules[1])))) continue;
    // Three distinct, small quantities (1, 2, 3) keep counting targets roomy and "more" clear.
    if (plan.count && new Set(COUNT_PARTS.map(p => countParts(critters, rules)[p])).size !== 3) continue;
    const bound = critters.filter((c) => placeOf(c, rules, not) !== 'out').length;
    // Just a few: two to sort after the example, one of which fits.
    if (plan.fitting && bound !== plan.fitting) continue;
    // Otherwise the examples still leave at least two critters for her to carry into a hoop.
    if (plan.example && !plan.fitting && bound - examplePlaces(plan.mode).length < 2) continue;
    if (plan.mode === 'resort') {
      const choices = (['hat', 'brown', 'white', 'floppy', 'pointy', 'whiskers'] as Rule[]).filter((rule) =>
        critters.some(c => fits(c, rule)) && critters.some(c => !fits(c, rule)) &&
        critters.some(c => fits(c, rule) !== fits(c, rules[0])));
      if (!choices.length) continue;
      return { rules, critters, nextRule: rng.pick(choices) };
    }
    if (plan.mode === 'guess') {
      // Two other rules that would sort these critters differently, so only one rule fits.
      const others = rng.shuffle((['hat', 'brown', 'white', 'floppy', 'pointy', 'whiskers'] as Rule[]).filter((r) => r !== rules[0] && critters.some((c) => fits(c, r) !== fits(c, rules[0]))));
      if (others.length < 2) continue;
      return { rules, critters, options: rng.shuffle([rules[0], ...others.slice(0, 2)]) };
    }
    if (plan.newcomer) {
      // Removing it must leave a visible example in every region, including neither.
      const candidates = critters.map((c, i) => ({ i, place: placeOf(c, rules) }))
        .filter(({ place }) => critters.filter((c) => placeOf(c, rules) === place).length > 1);
      return { rules, critters, newcomer: rng.pick(candidates).i };
    }
    return { rules, critters };
  }
}

/** Where a worked example's critters start: one in each hoop, but only the middle when the hoops overlap. */
export const examplePlaces = (mode: SortMode): Place[] => (mode === 'two' ? ['left', 'right'] : mode === 'venn' ? ['both'] : mode === 'guess' ? [] : ['left']);

/** The critters that start already sorted in a worked-example round: the first one belonging in each example place. */
export function exampleIndices(plan: SortPlan, round: SortRound): number[] {
  if (!plan.example) return [];
  const not = plan.mode === 'butnot' ? 'butnot' : plan.mode === 'not';
  return examplePlaces(plan.mode).map((place) => round.critters.findIndex((c) => placeOf(c, round.rules, not) === place));
}

/** The younger one-hoop entries keep their free leave-it-out choice. */
export const hasNeitherMat = (mode: SortMode): boolean => mode === 'two' || mode === 'venn' || mode === 'not' || mode === 'resort' || mode === 'butnot';

/** The critter the hint points at: the one she just missed, including the mat when it is in play. */
export function hintFor<S extends { c: SortCritter; placed: Place | null }>(sorters: readonly S[], missed: S, rules: readonly Rule[], not: boolean | 'butnot' = false, mat = false): S | null {
  if (mat) return missed.placed ? sorters.find((s) => !s.placed) ?? null : missed;
  if (placeOf(missed.c, [...rules], not) !== 'out') return missed;
  return sorters.find((x) => !x.placed && placeOf(x.c, [...rules], not) !== 'out') ?? null;
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

/** A wide leaf mat below the hoops, clear of the loose critters and corner guide. */
export function neitherMat(centers: readonly Point[]): Point {
  return { x: (centers[0].x + centers[centers.length - 1].x) / 2, y: centers[0].y + HOOP_R + 85 };
}

export const MAT_RX = 170;
export const MAT_RY = 60;

/** Bare grass is a free put-down; only the pictured mat is an explicit outside answer. */
export function sortPlaceAt(centers: readonly Point[], mode: SortMode, x: number, y: number): Place | null {
  const hoop = placeAt(centers, x, y);
  if (hoop !== 'out' || !hasNeitherMat(mode)) return hoop === 'out' ? null : hoop;
  const mat = neitherMat(centers);
  return ((x - mat.x) / MAT_RX) ** 2 + ((y - 50 - mat.y) / MAT_RY) ** 2 <= 1 ? 'out' : null;
}

/** A good spot inside a part of the diagram for a critter's feet (`k` spreads several apart; 1 is the middle of the part). */
export function spotFor(centers: readonly Point[], mode: SortMode, place: Place, k = 0): Point {
  if (place === 'out') {
    const mat = neitherMat(centers);
    return { x: mat.x + (k % 4) * 64 - 96, y: mat.y + 50 };
  }
  const jitter = (k % 3) * 64 - 64;
  if (place === 'both') return { x: (centers[0].x + centers[1].x) / 2, y: centers[0].y + 40 + jitter * 0.6 };
  const c = centers[place === 'right' ? 1 : 0];
  const out = centers.length === 2 && mode === 'venn' ? (place === 'right' ? 70 : -70) : 0;
  return { x: c.x + out + jitter, y: c.y + 50 + (k > 2 ? -70 : 0) };
}

/**
 * What a capable child does next: carry the first critter still on the grass that belongs in a hoop to the middle of
 * its part of the diagram, including the leaf mat where present. The ghost finger follows this.
 */
export function nextToSort<S extends { c: SortCritter; placed: Place | null }>(sorters: readonly S[], rules: readonly Rule[], not: boolean | 'butnot' = false, mat = false): { who: S; place: Place } | undefined {
  for (const who of sorters) {
    const place = placeOf(who.c, [...rules], not);
    if (!who.placed && (mat || place !== 'out')) return { who, place };
  }
  return undefined;
}

/** In the "what is the rule?" round, the picture the ghost finger taps. */
export const ruleToTap = (round: SortRound): Rule => round.rules[0];

/** Disjoint parts of How many?: the outside mat counts too. */
export const COUNT_PARTS = ['left', 'right', 'out'] as const;
export type CountPart = typeof COUNT_PARTS[number];
export function countParts(critters: readonly SortCritter[], rules: Rule[]): Record<CountPart, number> {
  const counts = { left: 0, right: 0, out: 0 };
  for (const c of critters) {
    const place = placeOf(c, rules);
    if (place !== 'both') counts[place]++;
  }
  return counts;
}
export function morePart(counts: Record<CountPart, number>): CountPart | null {
  const ranked = [...COUNT_PARTS].sort((a, b) => counts[b] - counts[a]);
  return counts[ranked[0]] > counts[ranked[1]] ? ranked[0] : null;
}

/** Separate 100-unit touch targets for the counted critters, within their own part. */
export function countSpot(centers: readonly Point[], place: CountPart, k: number, total: number): Point {
  if (place === 'out') {
    const mat = neitherMat(centers);
    return { x: mat.x + (k - (total - 1) / 2) * 112, y: mat.y + 50 };
  }
  const c = centers[place === 'left' ? 0 : 1];
  return total === 3 && k === 2 ? { x: c.x, y: c.y - 50 } :
    { x: c.x + (k - (Math.min(total, 2) - 1) / 2) * 112, y: c.y + 70 };
}
