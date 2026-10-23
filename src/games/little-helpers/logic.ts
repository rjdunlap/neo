import type { Rng } from '../../engine/random';

/**
 * Little Helpers, after Pikmin: tap a fruit and one little helper runs over to carry it.
 * Bigger fruit needs more helpers. Later levels wait for a whistle, so the child has to
 * send exactly enough: too few can't lift it, extras walk back. The last level is a bunch of
 * fruits that each need the same team: equal groups, counted by twos or threes.
 */
export type HelperMode = 'tap' | 'two' | 'count' | 'numeral' | 'more' | 'groups' | 'whistle' | 'split' | 'strong';

export interface HelperPlan {
  /** The saved level ID; plans are keyed by it, not by their place in `PLANS`. */
  level: number;
  mode: HelperMode;
  fruits: number;
  /** How many helpers a fruit can need. */
  min: number;
  max: number;
  name: string;
}

export const PLANS: HelperPlan[] = [
  { level: 1, mode: 'tap', fruits: 5, min: 1, max: 1, name: 'Tap a fruit and a helper carries it home' },
  { level: 2, mode: 'two', fruits: 4, min: 1, max: 2, name: 'Send one or two helpers (rings fill as they arrive); it lifts when there are enough' },
  { level: 3, mode: 'count', fruits: 4, min: 2, max: 4, name: 'Send exactly 2 to 4 helpers, then blow the whistle (rings)' },
  { level: 4, mode: 'numeral', fruits: 4, min: 2, max: 5, name: 'Send exactly the number shown, then blow the whistle' },
  { level: 5, mode: 'more', fruits: 4, min: 3, max: 6, name: 'Some are already helping: how many more?' },
  { level: 6, mode: 'groups', fruits: 4, min: 4, max: 6, name: 'Equal groups: a bunch where every fruit needs the same team (2 twos, 3 twos, 2 threes)' },
  { level: 7, mode: 'split', fruits: 4, min: 4, max: 7, name: 'Everyone helps: split the crowd between two fruits, then blow the whistle' },
  { level: 8, mode: 'strong', fruits: 4, min: 4, max: 8, name: 'Strong helpers: a big helper counts two; send any mix that makes the need' },
  { level: 9, mode: 'whistle', fruits: 4, min: 1, max: 3, name: "Whistle when it's full: fill every ring, then blow the whistle" },
];

/** The plan for a saved level; an unknown level falls to the nearest of 1–6, as before plans were keyed. */
export const planFor = (level: number) => PLANS.find((p) => p.level === level) ?? PLANS[Math.min(6, Math.max(1, level)) - 1];

/** Enough helpers for the biggest fruit, with one to spare. */
export const CROWD = 7;

export interface Fruit {
  need: number;
  /** Helpers already carrying when the fruit appears ('more' levels). */
  already: number;
  /** How many fruits in the bunch, each needing `need / groups` helpers; 1 except on 'groups' levels. */
  groups: number;
  /** Level 7: the two fruits' own needs, summing to `need`; absent where a bunch's fruits all need `need / groups`. */
  parts?: number[];
}

/** What each fruit of a bunch needs. */
export const partsOf = (f: Fruit): number[] => f.parts ?? Array.from({ length: f.groups }, () => f.need / f.groups);

/** Whether the fruit is a set of teams she builds (level 6's bunch, level 7's pair) rather than one team. */
export const teamedPlan = (plan: HelperPlan) => plan.mode === 'groups' || plan.mode === 'split';

/** Level 7: each crowd size 4–7 and the ways to split it between two fruits (a fruit needs 1–5), so one total can come back split another way. */
export const SPLITS: Record<number, [number, number][]> = {
  4: [[1, 3], [2, 2]],
  5: [[1, 4], [2, 3]],
  6: [[1, 5], [2, 4], [3, 3]],
  7: [[2, 5], [3, 4]],
};

/** Two crowd sizes alternate through the round, the second time each split another way; which fruit is which side is shuffled. */
function splitFruits(plan: HelperPlan, rng: Rng): Fruit[] {
  const totals = rng.shuffle([4, 5, 6, 7]).slice(0, 2);
  const seen = new Map<number, string[]>();
  return Array.from({ length: plan.fruits }, (_, i) => {
    const total = totals[i % 2];
    const done = seen.get(total) ?? [];
    const fresh = SPLITS[total].filter((p) => !done.includes(p.join()));
    const pair = rng.pick(fresh.length ? fresh : SPLITS[total]);
    seen.set(total, [...done, pair.join()]);
    const parts = rng.shuffle([...pair]);
    return { need: total, already: 0, groups: 2, parts };
  });
}

/** Bunches for 'groups' levels as [fruits, helpers each]; totals stay below the crowd so one is always spare. */
export const BUNCHES: [number, number][] = [
  [2, 2],
  [3, 2],
  [2, 3],
];

export function makeFruits(plan: HelperPlan, rng: Rng): Fruit[] {
  if (plan.mode === 'split') return splitFruits(plan, rng);
  if (plan.mode === 'groups') {
    // Each bunch once before any repeats, so neighbours always differ.
    const order = rng.shuffle([...BUNCHES]);
    return Array.from({ length: plan.fruits }, (_, i) => {
      const [groups, each] = order[i % order.length];
      return { need: groups * each, already: 0, groups };
    });
  }
  return needsFor(plan, rng).map((need) => ({ need, already: plan.mode === 'more' ? rng.int(1, need - 1) : 0, groups: 1 }));
}

/** Whether a round's needs just swap back and forth (1, 2, 1, 2), which a child learns instead of looking. */
export const alternates = (needs: number[]) => needs.length >= 3 && needs[0] !== needs[1] && needs.every((n, i) => i < 2 || n === needs[i - 2]);

/**
 * The needs for a round. With three or more values, each comes once before any repeats and never twice in a row
 * across the join, so counting matters every time. Two values (level 2) cannot both avoid repeats and avoid
 * alternating, so each comes equally often in a shuffled order that is never a plain swap.
 */
export function needsFor(plan: HelperPlan, rng: Rng): number[] {
  const values = Array.from({ length: plan.max - plan.min + 1 }, (_, i) => plan.min + i);
  if (values.length === 1) return Array(plan.fruits).fill(plan.min);
  if (values.length === 2) {
    const deck = Array.from({ length: plan.fruits }, (_, i) => values[i % 2]);
    let out = rng.shuffle([...deck]);
    for (let tries = 0; alternates(out) && tries < 20; tries++) out = rng.shuffle([...deck]);
    return alternates(out) ? deck.sort((a, b) => a - b) : out;
  }
  const out: number[] = [];
  while (out.length < plan.fruits) {
    let deck = rng.shuffle([...values]);
    if (deck[0] === out[out.length - 1]) deck = [...deck.slice(1), deck[0]];
    out.push(...deck);
  }
  return out.slice(0, plan.fruits);
}

/** Whether the helpers lift when there are enough, or wait for the whistle. */
export const usesWhistle = (plan: HelperPlan) => plan.mode !== 'tap' && plan.mode !== 'two';

/** Level 9: the rings say when, so nothing counts against her; a helper sent past full bounces off and walks back. */
export const ringsSayWhen = (plan: HelperPlan) => plan.mode === 'whistle';

/** Counting the bunch by its groups: 2, 4, 6. */
export const skipCount = (f: Fruit) => Array.from({ length: f.groups }, (_, i) => (i + 1) * (f.need / f.groups)).join(', ');

/** How wide a team of `n` helpers stands, with a gap before the next. */
export const TEAM_STEP = 50;
export const TEAM_GAP = 30;

/** The centres of the fruits (and their teams) along a row, relative to its middle. */
export function teamCenters(parts: number[]): number[] {
  const widths = parts.map((p) => p * TEAM_STEP + TEAM_GAP);
  const total = widths.reduce((a, b) => a + b, 0);
  let at = -total / 2;
  return widths.map((w) => {
    const c = at + w / 2;
    at += w;
    return c;
  });
}

/** The team a tap at `x` (relative to the row's middle) was meant for: the nearest fruit. */
export function nearestTeam(parts: number[], x: number): number {
  const c = teamCenters(parts);
  return c.reduce((best, cx, i) => (Math.abs(cx - x) < Math.abs(c[best] - x) ? i : best), 0);
}

/** How each team stands against its fruit: it lifts only when every team is exactly its size. */
export function teamsResult(parts: number[], counts: number[]) {
  const short = parts.flatMap((p, i) => ((counts[i] ?? 0) < p ? [i] : []));
  const over = parts.flatMap((p, i) => ((counts[i] ?? 0) > p ? [i] : []));
  return { lift: !short.length && !over.length, short, over, empty: counts.every((c) => !c) };
}

/** The team the bot sends the next helper to (the one furthest from full), or null once every team is exactly full. */
export function botTeam(parts: number[], counts: number[]): number | null {
  let best: number | null = null;
  parts.forEach((p, i) => {
    const gap = p - (counts[i] ?? 0);
    if (gap > 0 && (best === null || gap > parts[best] - (counts[best] ?? 0))) best = i;
  });
  return best;
}

// Strong helpers (level 8) -----------------------------------------------------------------

/** The crew at level 8: four small helpers and three big ones, who count two. */
export const CREW = { small: 4, big: 3 };
export const BIG_POWER = 2;

/** Every mix of small and big helpers from the crew that makes exactly `need`, the most big helpers first. */
export function strongMixes(need: number): { small: number; big: number }[] {
  const out: { small: number; big: number }[] = [];
  for (let big = Math.min(CREW.big, Math.floor(need / BIG_POWER)); big >= 0; big--) {
    const small = need - big * BIG_POWER;
    if (small >= 0 && small <= CREW.small) out.push({ small, big });
  }
  return out;
}

/** The next helper a capable child sends toward `need` when `small` and `big` are already holding on: null once exactly enough. */
export function nextStrong(need: number, small: number, big: number): 'big' | 'small' | null {
  const mix = strongMixes(need).find((m) => m.small >= small && m.big >= big);
  if (!mix) return null;
  return big < mix.big ? 'big' : small < mix.small ? 'small' : null;
}

/** How many helpers, in the order they were sent, stay when the team is too strong: the ones that fit within `need`. */
export function keepWithin(powers: number[], need: number): number {
  let sum = 0;
  let keep = 0;
  for (const p of powers) {
    if (sum + p > need) break;
    sum += p;
    keep++;
  }
  return keep;
}

export type Lift = 'lift' | 'short' | 'extra';

export function tryLift(need: number, helpers: number): Lift {
  return helpers === need ? 'lift' : helpers < need ? 'short' : 'extra';
}

/**
 * What a capable child does next with a fruit that needs `need` helpers when `carrying` are already holding on: send
 * another, or (on whistle levels, once there are exactly enough) blow the whistle. On the tap levels the lift starts by
 * itself when the last helper arrives, so there is nothing more to touch.
 */
export function helperTouch(plan: HelperPlan, need: number, carrying: number): 'send' | 'whistle' | null {
  if (carrying < need) return 'send';
  return usesWhistle(plan) && carrying === need ? 'whistle' : null;
}

/**
 * What a touch away from the fruit, the whistle and a carrying helper does, so every touch is answered: at the tap
 * level any touch sends a helper; on other levels a waiting helper waves; while a fruit is dropping, lifting or being
 * praised, a helper hops. None of these is ever a miss.
 */
export type FieldTouch = 'send' | 'wave' | 'hop';

export function fieldTouch(plan: HelperPlan, busy: boolean): FieldTouch {
  if (busy) return 'hop';
  return plan.mode === 'tap' ? 'send' : 'wave';
}

/** A whistle with nobody holding on is a nudge to send helpers first, not a wrong count. */
export type Whistle = Lift | 'nudge';

export function whistleFor(need: number, helpers: number): Whistle {
  return helpers === 0 ? 'nudge' : tryLift(need, helpers);
}

/** Only a whistle with the wrong team counts as a miss, and never at level 9, where the rings say when. */
export const whistleMisses = (w: Whistle, plan?: HelperPlan) => (w === 'short' || w === 'extra') && !(plan && ringsSayWhen(plan));

/**
 * The badge's rings for a fruit needing `need` with `carrying` holding on: `filled` of the `need` rings inside the
 * frame are full, `empty` are still to fill (at level 5 these are "how many more"), and `extra` stand outside it.
 */
export function badgeRings(need: number, carrying: number) {
  const filled = Math.min(need, carrying);
  return { filled, empty: need - filled, extra: Math.max(0, carrying - need) };
}

// Things to carry and places -----------------------------------------------------------------

/** Where a round happens; each place has its own things to carry and its own place to put them. */
export type Place = 'orchard' | 'beach' | 'woods';
export const PLACES: Place[] = ['orchard', 'beach', 'woods'];

export type CarryKind = 'apple' | 'orange' | 'lemon' | 'pear' | 'grapes' | 'blueberries' | 'pumpkin' | 'watermelon' | 'acorn' | 'pinecone' | 'boat';

/** The helpers each thing can need, inclusive: little things are light, the pumpkin and the watermelon heavy. */
export const CARRY_NEEDS: Record<CarryKind, [number, number]> = {
  acorn: [1, 2],
  pinecone: [1, 3],
  blueberries: [1, 3],
  apple: [1, 4],
  orange: [1, 4],
  lemon: [1, 4],
  pear: [1, 4],
  grapes: [1, 4],
  boat: [2, 4],
  pumpkin: [4, 8],
  watermelon: [4, 8],
};

/** What each place offers: an orchard's fruit and pumpkin, a beach picnic and a toy boat, the woods' acorns and pinecones. */
export const PLACE_THINGS: Record<Place, CarryKind[]> = {
  orchard: ['apple', 'orange', 'pear', 'grapes', 'pumpkin'],
  beach: ['lemon', 'orange', 'boat', 'watermelon'],
  woods: ['acorn', 'pinecone', 'blueberries', 'pumpkin'],
};

/** Where the things go: the orchard's basket, the beach's rowing boat, the woods' bucket. */
export const DESTINATION: Record<Place, 'basket' | 'boat' | 'bucket'> = { orchard: 'basket', beach: 'boat', woods: 'bucket' };

/** The things this place has that can need `need` helpers (for a bunch, the need of each one). */
export const thingsFor = (place: Place, need: number) => PLACE_THINGS[place].filter((k) => need >= CARRY_NEEDS[k][0] && need <= CARRY_NEEDS[k][1]);

/** A thing for a part of a pair that is lighter than the first: one that fits its need and differs from `avoid` where the place has another. */
export function partThing(place: Place, need: number, avoid: CarryKind): CarryKind {
  const fits = thingsFor(place, need);
  return fits.find((k) => k !== avoid) ?? fits[0];
}

/** A place for the round and a thing for each fruit, drawn after the needs so the needs never change; no thing twice in a row where the place has another. A pair's thing fits its heavier part. */
export function dressRound(fruits: Fruit[], rng: Rng): { place: Place; things: CarryKind[] } {
  const place = rng.pick(PLACES);
  const things: CarryKind[] = [];
  for (const f of fruits) {
    const fits = thingsFor(place, Math.max(...partsOf(f)));
    const fresh = fits.filter((k) => k !== things[things.length - 1]);
    things.push(rng.pick(fresh.length ? fresh : fits));
  }
  return { place, things };
}

/** Half the basket's rim, in logical units. */
export const BASKET_HALF = 90;

/** Where the `n`th fruit in the basket rests, relative to the middle of its rim: rows of five, each row a little higher. */
export function pileSpot(n: number) {
  const row = Math.floor(n / 5) % 3;
  return { x: ((n % 5) - 2) * 26 + (row % 2) * 13, y: -10 - row * 16 - (n % 2) * 6 };
}
