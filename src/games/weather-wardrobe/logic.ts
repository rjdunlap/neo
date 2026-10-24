import type { Rng } from '../../engine/random';
import type { PartName } from '../../creatures/parts';
import type { SpeciesId } from '../../creatures/species';

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
  sandals: 'sunny',
  rainhat: 'rainy',
  earmuffs: 'snowy',
  puffycoat: 'snowy',
} as const satisfies Record<string, Weather>;
export type Item = keyof typeof ITEMS;
export const ALL_ITEMS = Object.keys(ITEMS) as Item[];
/** A weather's items, out of those the pet can wear. */
export const itemsFor = (w: Weather, wearable: readonly Item[] = ALL_ITEMS) => wearable.filter((i) => ITEMS[i] === w);

export type Slot = 'head' | 'eyes' | 'neck' | 'body' | 'hands' | 'feet' | 'held';

/** Where each item goes on the pet. An outfit holds one item per slot, so a beanie and earmuffs are never both on. */
export const SLOTS: Record<Item, Slot> = {
  sunhat: 'head',
  sunglasses: 'eyes',
  raincoat: 'body',
  umbrella: 'held',
  boots: 'feet',
  beanie: 'head',
  scarf: 'neck',
  mittens: 'hands',
  sandals: 'feet',
  rainhat: 'head',
  earmuffs: 'head',
  puffycoat: 'body',
};

/**
 * Where each item goes on the companion (RW05 slice 2b): the part of its slot, but earmuffs go on the ears, and an
 * umbrella is held in a hand or, on a species with no hand free, stands on its back (`HELD_AT`).
 */
export function partFor(item: Item, species: SpeciesId): PartName {
  if (item === 'earmuffs') return 'ears';
  const slot = SLOTS[item];
  if (slot === 'held') return HELD_AT[species];
  return slot === 'body' ? 'tummy' : slot;
}

/** Where a held thing goes: a hand, or GAME-FIT's stand-in point where no hand is free (decided 2026-10-23). The river walks on all four; the glider has none. */
export const HELD_AT: Record<SpeciesId, PartName> = { sprout: 'hands', river: 'back', glider: 'back' };

/**
 * Clothes a species cannot wear although it has the part, and why: RW06's anatomical misfits (docs/rework/HOME.md), for
 * the drawn clothes here. The coats are drawn from the front for an upright body; a side-on body would wear them as a
 * flag or hide its wing under them.
 */
export const NOT_WORN: Record<SpeciesId, Partial<Record<Item, string>>> = {
  sprout: {},
  river: {
    mittens: 'its front paws walk: boots go on them, and mittens would be a second pair of shoes',
    raincoat: 'drawn upright from the front, and its body runs level from the neck to the tail, so it would hang off the back like a flag',
    puffycoat: 'drawn upright from the front, like the raincoat',
  },
  glider: {
    raincoat: 'a coat wants a body and arms; the glider is one wing, which a coat would hide',
    puffycoat: 'a coat wants a body and arms, like the raincoat',
  },
};

/**
 * What a species can wear (decided 2026-10-23, fewer parts per species): an item whose part its table has
 * (`has`, from `PARTS`) and that is not one of its `NOT_WORN`. The glider has no neck, hands or feet, so no scarf,
 * mittens, boots or sandals; its umbrella stands on its back.
 */
export function wardrobeFor(species: SpeciesId, has: (part: PartName) => boolean): Item[] {
  return ALL_ITEMS.filter((i) => !NOT_WORN[species][i] && has(partFor(i, species)));
}

/** One whole outfit for a weather: an item for each slot that weather fills (that the pet can wear), chosen by seed where two share a slot. */
export function outfitFor(w: Weather, rng: Rng, wearable: readonly Item[] = ALL_ITEMS): Item[] {
  const bySlot = new Map<Slot, Item[]>();
  for (const item of itemsFor(w, wearable)) bySlot.set(SLOTS[item], [...(bySlot.get(SLOTS[item]) ?? []), item]);
  return [...bySlot.values()].map((items) => rng.pick(items));
}

/** The items the sticker draws from: the original eight, so stickers from before the new clothes look the same. */
export const STICKER_ITEMS: readonly Item[] = ['sunhat', 'sunglasses', 'raincoat', 'umbrella', 'boots', 'beanie', 'scarf', 'mittens'];

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
  sandals: 'Sandals are',
  rainhat: 'A rain hat is',
  earmuffs: 'Earmuffs are',
  puffycoat: 'A puffy coat is',
};

/** Each item's name, said when she touches it on the pet at level 1. */
export const ITEM_NAMES: Record<Item, string> = {
  sunhat: 'A sun hat',
  sunglasses: 'Sunglasses',
  raincoat: 'A raincoat',
  umbrella: 'An umbrella',
  boots: 'Rain boots',
  beanie: 'A warm hat',
  scarf: 'A scarf',
  mittens: 'Mittens',
  sandals: 'Sandals',
  rainhat: 'A rain hat',
  earmuffs: 'Earmuffs',
  puffycoat: 'A puffy coat',
};

/** What the grass does when she touches it at level 1: a puddle splashes, snow crunches, a flower pops up. */
export const GROUND_TOUCH = { sunny: 'flower', rainy: 'splash', snowy: 'crunch' } as const satisfies Record<Weather, string>;

/** What a wrong item shows for a moment before it hops back: the weather it was not made for. */
export type Misfit = 'cold' | 'hot' | 'wet';

/** The consequence of wearing the wrong thing in each weather (sunglasses in rain run with drops, mittens in sun sweat). */
export const MISFIT: Record<Weather, Misfit> = { sunny: 'hot', rainy: 'wet', snowy: 'cold' };

/** The one item per weather that stops it on the pet at level 8: a hat in sun, an umbrella in rain, a coat in snow. */
export const SHIELD: Record<Weather, Item> = { sunny: 'sunhat', rainy: 'umbrella', snowy: 'puffycoat' };

/** What stops a weather, best first, for a pet that cannot wear the `SHIELD` (a glider in snow gets the warm hat). */
const SHIELDS: Record<Weather, Item[]> = {
  sunny: ['sunhat', 'sunglasses', 'sandals'],
  rainy: ['umbrella', 'raincoat', 'rainhat', 'boots'],
  snowy: ['puffycoat', 'beanie', 'earmuffs', 'scarf', 'mittens'],
};
export const shieldFor = (w: Weather, wearable: readonly Item[] = ALL_ITEMS): Item => SHIELDS[w].find((i) => wearable.includes(i))!;

export type WardrobeMode = 'play' | 'pick' | 'all' | 'trip' | 'change' | 'try' | 'sky';

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
  { mode: 'change', choices: 5, need: 0, rounds: 3, name: 'Take off clothes that do not fit the new weather, then dress for it' },
  { mode: 'try', choices: 2, need: 1, rounds: 3, name: 'Try things on in the weather: the one that fits stops it (no mistakes)' },
  { mode: 'sky', choices: 3, need: 1, rounds: 3, name: 'See what the pet is wearing and pick the weather it is dressed for' },
];

export const wardrobePlan = (level: number) => WARDROBE_PLANS[Math.max(0, Math.min(WARDROBE_PLANS.length - 1, level - 1))];

export interface Outfit {
  weathers: Weather[];
  /** What to put on (or pack). */
  needed: Item[];
  options: Item[];
  /** In weather-change rounds, these are the worn clothes to remove before dressing for the new weather. */
  remove?: Item[];
  /** Which sky: what the pet already wears, the skies on offer, and the one it suits. */
  worn?: Item[];
  skies?: Weather[];
  answer?: Weather;
}

/** What a trip unpacks, weather by weather in forecast order: each weather's packed things, then the next weather's. */
export const tripPlays = (o: Outfit): { weather: Weather; items: Item[] }[] => o.weathers.map((weather) => ({ weather, items: o.needed.filter((i) => ITEMS[i] === weather) }));

/**
 * One round's weather and choices. Weathers change from round to round. Everything is drawn from `wearable`, what this
 * pet can wear, so a species with fewer parts finds fewer things (every weather keeps at least one): "everything" is
 * every slot it has, and the choices run short rather than offer what it cannot put on.
 */
export function outfits(plan: WardrobePlan, rng: Rng, wearable: readonly Item[] = ALL_ITEMS): Outfit[] {
  const out: Outfit[] = [];
  let order: Weather[] = [];
  // Weather-change rounds wear one outfit per weather all game, so the clothes to take off are the ones she just put on.
  const dress = plan.mode === 'change' ? new Map(WEATHERS.map((w) => [w, outfitFor(w, rng, wearable)])) : null;
  for (let r = 0; r < plan.rounds; r++) {
    if (plan.mode === 'sky') {
      // Each round is a different weather, and the pet wears two things made for it: exactly one offered sky fits.
      if (!order.length) order = rng.shuffle([...WEATHERS]);
      const answer = order.shift()!;
      out.push({ weathers: [answer], needed: [], options: [], worn: rng.shuffle(outfitFor(answer, rng, wearable)).slice(0, 2), skies: rng.shuffle([...WEATHERS]).slice(0, plan.choices), answer });
      continue;
    }
    if (plan.mode === 'change') {
      if (!order.length) order = rng.shuffle([...WEATHERS]);
      const from = order[r]!;
      const to = order[(r + 1) % order.length];
      const needed = dress!.get(to)!;
      const others = rng.shuffle(wearable.filter((i) => ITEMS[i] !== to));
      out.push({ weathers: [from, to], remove: [...dress!.get(from)!], needed: [...needed], options: rng.shuffle([...needed, ...others.slice(0, plan.choices - needed.length)]) });
      continue;
    }
    if (order.length < (plan.mode === 'trip' ? 2 : 1)) order = rng.shuffle([...WEATHERS]);
    const weathers = plan.mode === 'trip' ? [order.shift()!, order.shift()!] : [order.shift()!];
    // Every weather fills at least three slots, so "everything" at level 5 is always three, one per slot.
    const needed =
      plan.mode === 'try'
        ? [shieldFor(weathers[0], wearable)]
        : plan.mode === 'trip'
        ? weathers.flatMap((w) => rng.shuffle(outfitFor(w, rng, wearable)).slice(0, 2))
        : rng.shuffle(outfitFor(weathers[0], rng, wearable)).slice(0, plan.need);
    const others = rng.shuffle(wearable.filter((i) => !weathers.includes(ITEMS[i])));
    const options = rng.shuffle([...needed, ...others.slice(0, plan.choices - needed.length)]);
    out.push({ weathers, needed, options });
  }
  return out;
}

/** The first thing to wear (or pack) that she has not chosen yet, or null once she has them all. Always a right one. */
export const itemToTap = (outfit: Outfit, used: ReadonlySet<Item>): Item | null => outfit.needed.find((i) => !used.has(i)) ?? null;
