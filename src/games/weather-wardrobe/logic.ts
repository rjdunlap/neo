import type { Rng } from '../../engine/random';

export const WEATHERS = ['sunny', 'rainy', 'snowy'] as const;
export type Weather = (typeof WEATHERS)[number];

/** Every piece of clothing belongs to exactly one weather, so a choice is never ambiguous. */
export const ITEMS = {
  sunhat: 'sunny',
  sunglasses: 'sunny',
  raincoat: 'rainy',
  umbrella: 'rainy',
  boots: 'rainy',
  beanie: 'snowy',
  scarf: 'snowy',
  mittens: 'snowy',
} as const satisfies Record<string, Weather>;
export type Item = keyof typeof ITEMS;
export const itemsFor = (w: Weather) => (Object.keys(ITEMS) as Item[]).filter((i) => ITEMS[i] === w);

/** How each item is spoken in "___ for snowy days". */
export const ITEM_WORDS: Record<Item, string> = {
  sunhat: 'A sun hat is',
  sunglasses: 'Sunglasses are',
  raincoat: 'A raincoat is',
  umbrella: 'An umbrella is',
  boots: 'Rain boots are',
  beanie: 'A warm hat is',
  scarf: 'A scarf is',
  mittens: 'Mittens are',
};

export type WardrobeMode = 'play' | 'pick' | 'all' | 'trip';

export interface WardrobePlan {
  mode: WardrobeMode;
  /** Items offered. */
  choices: number;
  /** Items that fit, out of the choices (pick: 1; trip: 2 for each weather). */
  need: number;
  rounds: number;
  name: string;
}

export const WARDROBE_PLANS: WardrobePlan[] = [
  { mode: 'play', choices: 0, need: 0, rounds: 0, name: 'Tap the sky to change the weather; the pet dresses itself' },
  { mode: 'pick', choices: 2, need: 1, rounds: 3, name: 'Pick the one thing to wear, out of two' },
  { mode: 'pick', choices: 3, need: 1, rounds: 3, name: 'Pick the one thing to wear, out of three' },
  { mode: 'all', choices: 4, need: 2, rounds: 3, name: 'Find both things to wear, out of four' },
  { mode: 'all', choices: 5, need: 3, rounds: 3, name: 'Find everything to wear, out of five' },
  { mode: 'trip', choices: 6, need: 4, rounds: 2, name: 'Pack for a trip with two kinds of weather' },
];

export const wardrobePlan = (level: number) => WARDROBE_PLANS[Math.max(0, Math.min(WARDROBE_PLANS.length - 1, level - 1))];

export interface Outfit {
  weathers: Weather[];
  /** What to put on (or pack). */
  needed: Item[];
  options: Item[];
}

/** One round's weather and choices. Weathers change from round to round. */
export function outfits(plan: WardrobePlan, rng: Rng): Outfit[] {
  const out: Outfit[] = [];
  let order: Weather[] = [];
  for (let r = 0; r < plan.rounds; r++) {
    if (order.length < (plan.mode === 'trip' ? 2 : 1)) order = rng.shuffle([...WEATHERS]);
    const weathers = plan.mode === 'trip' ? [order.shift()!, order.shift()!] : [order.shift()!];
    // Sunny has only two things to wear, so "everything" there means both.
    const needed =
      plan.mode === 'trip'
        ? weathers.flatMap((w) => rng.shuffle(itemsFor(w)).slice(0, 2))
        : rng.shuffle(itemsFor(weathers[0])).slice(0, Math.min(plan.need, itemsFor(weathers[0]).length));
    const others = rng.shuffle((Object.keys(ITEMS) as Item[]).filter((i) => !weathers.includes(ITEMS[i])));
    const options = rng.shuffle([...needed, ...others.slice(0, plan.choices - needed.length)]);
    out.push({ weathers, needed, options });
  }
  return out;
}
