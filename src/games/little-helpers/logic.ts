import type { Rng } from '../../engine/random';

/**
 * Little Helpers, after Pikmin: tap a fruit and one little helper runs over to carry it.
 * Bigger fruit needs more helpers. Later levels wait for a whistle, so the child has to
 * send exactly enough: too few can't lift it, extras walk back. The last level is a bunch of
 * fruits that each need the same team: equal groups, counted by twos or threes.
 */
export type HelperMode = 'tap' | 'two' | 'count' | 'numeral' | 'more' | 'groups' | 'whistle';

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
}

/** Bunches for 'groups' levels as [fruits, helpers each]; totals stay below the crowd so one is always spare. */
export const BUNCHES: [number, number][] = [
  [2, 2],
  [3, 2],
  [2, 3],
];

export function makeFruits(plan: HelperPlan, rng: Rng): Fruit[] {
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
  pumpkin: [4, 6],
  watermelon: [4, 6],
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

/** A place for the round and a thing for each fruit, drawn after the needs so the needs never change; no thing twice in a row where the place has another. */
export function dressRound(fruits: Fruit[], rng: Rng): { place: Place; things: CarryKind[] } {
  const place = rng.pick(PLACES);
  const things: CarryKind[] = [];
  for (const f of fruits) {
    const fits = thingsFor(place, f.need / f.groups);
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
