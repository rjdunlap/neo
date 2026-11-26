import type { Rng } from '../../engine/random';
import type { PartName } from '../../creatures/parts';
import type { SpeciesId } from '../../creatures/species';
import type { BandLevels } from '../../progress/difficulty';

/** Four weathers; the sky at level 1 steps through them in this order. Wind came last (slice 7, 2026-10-26). */
export const WEATHERS = ['sunny', 'rainy', 'snowy', 'windy'] as const;
export type Weather = (typeof WEATHERS)[number];

/** Every piece of clothing has one home weather; `ALSO` names the few that suit a second one. */
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
  kite: 'windy',
  windbreaker: 'windy',
  straphat: 'windy',
} as const satisfies Record<string, Weather>;
export type Item = keyof typeof ITEMS;

/**
 * The items that suit a second weather (decided 2026-10-23): rain boots keep feet dry in snow, a raincoat sheds the
 * wind. Every other item suits its home weather alone. Level 11 builds on these; the rounds where a wrong answer must be
 * unambiguous (levels 2–6, 8, 9, 10) never offer one against its second weather.
 */
export const ALSO: Partial<Record<Item, Weather>> = { boots: 'snowy', raincoat: 'windy' };
/** Does this item suit this weather, at home or as a second one? */
export const suits = (i: Item, w: Weather) => ITEMS[i] === w || ALSO[i] === w;
export const ALL_ITEMS = Object.keys(ITEMS) as Item[];
/** A weather's items, out of those the pet can wear. */
export const itemsFor = (w: Weather, wearable: readonly Item[] = ALL_ITEMS) =>
  wearable.filter((i) => ITEMS[i] === w);

/** The items with one weather only: where one weather must be the single answer (the sky and friends levels). */
const ONE_WEATHER: readonly Item[] = ALL_ITEMS.filter((i) => !ALSO[i]);

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
  kite: 'held',
  windbreaker: 'body',
  straphat: 'head',
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
    raincoat:
      'drawn upright from the front, and its body runs level from the neck to the tail, so it would hang off the back like a flag',
    puffycoat: 'drawn upright from the front, like the raincoat',
    windbreaker: 'drawn upright from the front, like the raincoat',
  },
  glider: {
    raincoat: 'a coat wants a body and arms; the glider is one wing, which a coat would hide',
    puffycoat: 'a coat wants a body and arms, like the raincoat',
    windbreaker: 'a coat wants a body and arms, like the raincoat',
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
  for (const item of itemsFor(w, wearable))
    bySlot.set(SLOTS[item], [...(bySlot.get(SLOTS[item]) ?? []), item]);
  return [...bySlot.values()].map((items) => rng.pick(items));
}

/** The items the sticker draws from: the original eight, so stickers from before the new clothes look the same. */
export const STICKER_ITEMS: readonly Item[] = [
  'sunhat',
  'sunglasses',
  'raincoat',
  'umbrella',
  'boots',
  'beanie',
  'scarf',
  'mittens',
];
/** The weathers the sticker draws from: the original three, every one with a sticker item, so old seeds keep their picture. */
export const STICKER_WEATHERS: readonly Weather[] = ['sunny', 'rainy', 'snowy'];

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
  kite: 'A kite is',
  windbreaker: 'A windbreaker is',
  straphat: 'A hat with a strap is',
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
  kite: 'A kite',
  windbreaker: 'A windbreaker',
  straphat: 'A hat with a strap',
};

/** What the grass does when she touches it at level 1: a puddle splashes, snow crunches, a flower pops up, leaves scatter. */
export const GROUND_TOUCH = {
  sunny: 'flower',
  rainy: 'splash',
  snowy: 'crunch',
  windy: 'leaves',
} as const satisfies Record<Weather, string>;

/** What a wrong item shows for a moment before it hops back: the weather it was not made for. */
export type Misfit = 'cold' | 'hot' | 'wet' | 'blown';

/** The consequence of wearing the wrong thing in each weather (sunglasses in rain run with drops, mittens in sun sweat, a sun hat in wind blows off). */
export const MISFIT: Record<Weather, Misfit> = { sunny: 'hot', rainy: 'wet', snowy: 'cold', windy: 'blown' };

/** The one item per weather that stops it on the pet at level 8: a hat in sun, an umbrella in rain, a coat in snow, a zipped windbreaker in wind. */
export const SHIELD: Record<Weather, Item> = {
  sunny: 'sunhat',
  rainy: 'umbrella',
  snowy: 'puffycoat',
  windy: 'windbreaker',
};

/** What stops a weather, best first, for a pet that cannot wear the `SHIELD` (a glider in snow gets the warm hat; in wind, the hat with a strap). */
const SHIELDS: Record<Weather, Item[]> = {
  sunny: ['sunhat', 'sunglasses', 'sandals'],
  rainy: ['umbrella', 'raincoat', 'rainhat', 'boots'],
  snowy: ['puffycoat', 'beanie', 'earmuffs', 'scarf', 'mittens'],
  windy: ['windbreaker', 'straphat', 'kite'],
};
export const shieldFor = (w: Weather, wearable: readonly Item[] = ALL_ITEMS): Item =>
  SHIELDS[w].find((i) => wearable.includes(i))!;

/** Level 13's second axis, as pictures only (decided 2026-10-23): a cold day wants one warm thing, a hot day sandals. */
export type Temp = 'cold' | 'hot';
/** Warm things for a cold day, whatever the sky; each has one home weather (snowy), so no weather item is ever one. */
export const COLD_ITEMS: readonly Item[] = ['scarf', 'mittens', 'beanie', 'earmuffs', 'puffycoat'];
/** Cool things for a hot day. */
export const HOT_ITEMS: readonly Item[] = ['sandals'];
/** Which temperature an item answers, or null for one that is not about temperature. */
export const tempOf = (i: Item): Temp | null =>
  COLD_ITEMS.includes(i) ? 'cold' : HOT_ITEMS.includes(i) ? 'hot' : null;
/** The skies level 13 uses: snow is already a cold day, so the temperature axis needs the other three. */
const THERMO_SKIES: readonly Weather[] = ['sunny', 'rainy', 'windy'];

export type WardrobeMode = 'play' | 'pick' | 'all' | 'trip' | 'change' | 'try' | 'sky' | 'friends';

export interface WardrobePlan {
  mode: WardrobeMode;
  /** Items offered. */
  choices: number;
  /** Items that fit, out of the choices (pick: 1; trip: 2 for each weather). */
  need: number;
  rounds: number;
  name: string;
  /** Change mode only: some worn clothes still fit the new weather, and only the rest come off. */
  keep?: boolean;
  /** A small case with shared clothes and multiple valid packings. */
  packLight?: boolean;
  /** Level 13: a picture thermometer beside the sky; the outfit needs one thing for the weather and one for the temperature. */
  thermo?: boolean;
}

export const WARDROBE_PLANS: WardrobePlan[] = [
  {
    mode: 'play',
    choices: 0,
    need: 0,
    rounds: 0,
    name: 'Tap the sky to change the weather; the pet dresses itself',
  },
  { mode: 'pick', choices: 2, need: 1, rounds: 3, name: 'Pick the one thing to wear, out of two' },
  { mode: 'pick', choices: 3, need: 1, rounds: 3, name: 'Pick the one thing to wear, out of three' },
  { mode: 'all', choices: 4, need: 2, rounds: 3, name: 'Find both things to wear, out of four' },
  { mode: 'all', choices: 5, need: 3, rounds: 3, name: 'Find everything to wear, out of five' },
  { mode: 'trip', choices: 6, need: 4, rounds: 2, name: 'Pack for a trip with two kinds of weather' },
  {
    mode: 'change',
    choices: 5,
    need: 0,
    rounds: 3,
    name: 'Take off clothes that do not fit the new weather, then dress for it',
  },
  {
    mode: 'try',
    choices: 2,
    need: 1,
    rounds: 3,
    name: 'Try things on in the weather: the one that fits stops it (no mistakes)',
  },
  {
    mode: 'sky',
    choices: 3,
    need: 1,
    rounds: 3,
    name: 'See what the pet is wearing and pick the weather it is dressed for',
  },
  {
    mode: 'friends',
    choices: 4,
    need: 4,
    rounds: 3,
    name: 'Drag four items to two friends in different weather',
  },
  {
    mode: 'change',
    choices: 5,
    need: 0,
    rounds: 3,
    keep: true,
    name: 'The weather changes: keep what still fits, take off the rest, then add what is missing',
  },
  {
    mode: 'trip',
    choices: 6,
    need: 3,
    rounds: 2,
    packLight: true,
    name: 'Pack light: fit clothes for both rain and snow in one small case',
  },
  {
    mode: 'all',
    choices: 5,
    need: 2,
    rounds: 3,
    thermo: true,
    name: 'Warm or cold? Read the thermometer too: one thing for the sky and one for the temperature',
  },
];

export const wardrobePlan = (level: number) =>
  WARDROBE_PLANS[Math.max(0, Math.min(WARDROBE_PLANS.length - 1, level - 1))];

export interface Outfit {
  weathers: Weather[];
  /** What to put on (or pack). */
  needed: Item[];
  options: Item[];
  /** Pack light: all complete choices, with `needed` holding one example for replay. */
  packings?: Item[][];
  /** In weather-change rounds, these are the worn clothes to remove before dressing for the new weather. */
  remove?: Item[];
  /** Level 13: what the thermometer shows. */
  temp?: Temp;
  /** Level 11: worn clothes that suit both weathers and stay on; taking one off is a miss. */
  keep?: Item[];
  /** Which sky: what the pet already wears, the skies on offer, and the one it suits. */
  worn?: Item[];
  skies?: Weather[];
  answer?: Weather;
}

/** What a trip unpacks, weather by weather in forecast order: each weather's packed things, then the next weather's. */
export const tripPlays = (
  o: Outfit,
  packed: readonly Item[] = o.needed,
): { weather: Weather; items: Item[] }[] =>
  o.weathers.map((weather) => ({
    weather,
    items: packed.filter((i) => (o.packings ? suits(i, weather) : ITEMS[i] === weather)),
  }));

function lightTrip(weathers: Weather[], rng: Rng, wearable: readonly Item[], choices: number): Outfit {
  const rain = rng.shuffle(wearable.filter((i) => suits(i, 'rainy') && !suits(i, 'snowy'))).slice(0, 2);
  const snow = rng.shuffle(wearable.filter((i) => suits(i, 'snowy') && !suits(i, 'rainy'))).slice(0, 2);
  const shared = wearable.filter((i) => suits(i, 'rainy') && suits(i, 'snowy'));
  const useful = [...rain, ...snow, ...shared];
  const decoys = rng.shuffle(wearable.filter((i) => !weathers.some((w) => suits(i, w))));
  // The glider has no feet, so its case has two places for one useful item per stop.
  const packings = rain.flatMap((wet) => snow.map((cold) => [...shared, wet, cold]));
  return {
    weathers,
    needed: packings[0],
    packings,
    options: rng.shuffle([...useful, ...decoys.slice(0, choices - useful.length)]),
  };
}

/** The weather changes that keep something on, with the item that stays: boots from rain into snow and back, a raincoat between rain and wind. */
const KEEP_CHANGES: { from: Weather; to: Weather; keep: Item }[] = [
  { from: 'rainy', to: 'snowy', keep: 'boots' },
  { from: 'snowy', to: 'rainy', keep: 'boots' },
  { from: 'rainy', to: 'windy', keep: 'raincoat' },
  { from: 'windy', to: 'rainy', keep: 'raincoat' },
];

/** What the pet wears in `w`, one item per slot, with `keep` in its slot (so a raincoat in wind stands in for the windbreaker). */
function outfitKeeping(w: Weather, keep: Item, rng: Rng, wearable: readonly Item[]): Item[] {
  const rest = outfitFor(w, rng, wearable).filter((i) => SLOTS[i] !== SLOTS[keep] && i !== keep);
  return [...rest, keep];
}

/** One level-11 round: she wears an outfit for `from`, which still has `keep` that fits `to`. */
function keepRound(
  c: (typeof KEEP_CHANGES)[number],
  rng: Rng,
  wearable: readonly Item[],
  choices: number,
): Outfit {
  const worn = outfitKeeping(c.from, c.keep, rng, wearable);
  const remove = worn.filter((i) => i !== c.keep);
  const target = outfitKeeping(c.to, c.keep, rng, wearable);
  const needed = target.filter((i) => i !== c.keep);
  const others = rng.shuffle(wearable.filter((i) => !suits(i, c.to) && i !== c.keep));
  return {
    weathers: [c.from, c.to],
    remove,
    keep: [c.keep],
    needed,
    options: rng.shuffle([...needed, ...others.slice(0, Math.max(0, choices - needed.length))]),
  };
}

/**
 * One level-13 round: a sky and a temperature, and two things to find, one for each. The sky's thing is never a feet
 * item on a hot day (sandals are the answer there), and every other offered item suits neither the sky nor the
 * temperature, so exactly those two are right. Null when this pet has no pair that works.
 */
function thermoRound(
  w: Weather,
  temp: Temp,
  rng: Rng,
  wearable: readonly Item[],
  choices: number,
): Outfit | null {
  const answers = temp === 'cold' ? COLD_ITEMS : HOT_ITEMS;
  for (const sky of rng.shuffle(itemsFor(w, wearable).filter((i) => !tempOf(i)))) {
    const warm = rng.shuffle(wearable.filter((i) => answers.includes(i) && SLOTS[i] !== SLOTS[sky]));
    if (!warm.length) continue;
    const needed = [sky, warm[0]];
    // Everything else offered is a wrong answer for both axes: a thing for another sky, or for the other temperature.
    const others = rng.shuffle(wearable.filter((i) => !suits(i, w) && !answers.includes(i)));
    return {
      weathers: [w],
      temp,
      needed,
      options: rng.shuffle([...needed, ...others.slice(0, choices - needed.length)]),
    };
  }
  return null;
}

/** Level 13's rounds: three different skies, cold and hot mixed (a pet with no sandals gets cold days only). */
function thermoRounds(plan: WardrobePlan, rng: Rng, wearable: readonly Item[]): Outfit[] {
  const hot = wearable.some((i) => HOT_ITEMS.includes(i));
  const temps: Temp[] = hot
    ? rng.shuffle<Temp>(['cold', 'hot', rng.pick<Temp>(['cold', 'hot'])])
    : ['cold', 'cold', 'cold'];
  const skies = rng.shuffle([...THERMO_SKIES]);
  const out: Outfit[] = [];
  for (let r = 0; r < plan.rounds; r++) {
    const round = thermoRound(skies[r % skies.length], temps[r], rng, wearable, plan.choices);
    if (round) out.push(round);
  }
  return out;
}

/**
 * One round's weather and choices. Weathers change from round to round. Everything is drawn from `wearable`, what this
 * pet can wear, so a species with fewer parts finds fewer things (every weather keeps at least one): "everything" is
 * every slot it has, and the choices run short rather than offer what it cannot put on.
 */
export function outfits(plan: WardrobePlan, rng: Rng, wearable: readonly Item[] = ALL_ITEMS): Outfit[] {
  if (plan.packLight) {
    const first = rng.shuffle<Weather>(['rainy', 'snowy']);
    return [first, [...first].reverse()].map((weathers) => lightTrip(weathers, rng, wearable, plan.choices));
  }
  if (plan.thermo) return thermoRounds(plan, rng, wearable);
  const out: Outfit[] = [];
  let order: Weather[] = [];
  let pool: typeof KEEP_CHANGES = [];
  // Weather-change rounds wear one outfit per weather all game, so the clothes to take off are the ones she just put on.
  const dress =
    plan.mode === 'change' ? new Map(WEATHERS.map((w) => [w, outfitFor(w, rng, wearable)])) : null;
  for (let r = 0; r < plan.rounds; r++) {
    if (plan.mode === 'friends') {
      // These upright critters wear the full wardrobe, independently of the player's companion species.
      const weathers = rng.shuffle([...WEATHERS]).slice(0, 2);
      const needed = weathers.flatMap((w) => rng.shuffle(outfitFor(w, rng, ONE_WEATHER)).slice(0, 2));
      out.push({ weathers, needed, options: rng.shuffle([...needed]) });
      continue;
    }
    if (plan.mode === 'sky') {
      // Each round is a different weather, and the pet wears two things made for it: exactly one offered sky fits.
      if (!order.length) order = rng.shuffle([...WEATHERS]);
      const answer = order.shift()!;
      // The answer is always among the skies on offer; the others come from the rest (there are four weathers, three cards).
      const skies = rng.shuffle([
        answer,
        ...rng.shuffle(WEATHERS.filter((w) => w !== answer)).slice(0, plan.choices - 1),
      ]);
      out.push({
        weathers: [answer],
        needed: [],
        options: [],
        worn: rng
          .shuffle(
            outfitFor(
              answer,
              rng,
              wearable.filter((i) => !ALSO[i]),
            ),
          )
          .slice(0, 2),
        skies,
        answer,
      });
      continue;
    }
    if (plan.mode === 'change' && plan.keep) {
      // A pet that cannot wear any keeper (a glider has no boots or raincoat) plays it as level 7 does: everything comes off.
      const changes = KEEP_CHANGES.filter((c) => wearable.includes(c.keep));
      if (changes.length) {
        if (!pool.length) pool = rng.shuffle([...changes]);
        out.push(keepRound(pool.shift()!, rng, wearable, plan.choices));
        continue;
      }
    }
    if (plan.mode === 'change') {
      if (!order.length) order = rng.shuffle([...WEATHERS]);
      const from = order[r]!;
      const to = order[(r + 1) % order.length];
      const needed = dress!.get(to)!;
      const others = rng.shuffle(wearable.filter((i) => !suits(i, to)));
      out.push({
        weathers: [from, to],
        remove: [...dress!.get(from)!],
        needed: [...needed],
        options: rng.shuffle([...needed, ...others.slice(0, plan.choices - needed.length)]),
      });
      continue;
    }
    if (order.length < (plan.mode === 'trip' ? 2 : 1)) order = rng.shuffle([...WEATHERS]);
    const weathers = plan.mode === 'trip' ? [order.shift()!, order.shift()!] : [order.shift()!];
    // Every weather fills at least three slots (wind: head, body, held), so "everything" at level 5 is always three, one per slot.
    const needed =
      plan.mode === 'try'
        ? [shieldFor(weathers[0], wearable)]
        : plan.mode === 'trip'
          ? weathers.flatMap((w) => rng.shuffle(outfitFor(w, rng, wearable)).slice(0, 2))
          : rng.shuffle(outfitFor(weathers[0], rng, wearable)).slice(0, plan.need);
    const others = rng.shuffle(wearable.filter((i) => !weathers.some((w) => suits(i, w))));
    const options = rng.shuffle([...needed, ...others.slice(0, plan.choices - needed.length)]);
    out.push({ weathers, needed, options });
  }
  return out;
}

/** Available items that leave a complete outfit or packing within reach. */
export function packChoices(outfit: Outfit, used: ReadonlySet<Item>): Item[] {
  const possible = outfit.packings?.filter((packing) => [...used].every((item) => packing.includes(item)));
  const remaining = possible ? [...new Set(possible.flat())] : outfit.needed;
  return remaining.filter((item) => !used.has(item));
}

/** The first thing to wear or pack that still leads to completion. */
export const itemToTap = (outfit: Outfit, used: ReadonlySet<Item>): Item | null =>
  packChoices(outfit, used)[0] ?? null;

/** The one friend whose sign fits this item, or null for something outside this round. */
export const friendFor = (outfit: Outfit, item: Item): number | null => {
  const index = outfit.weathers.indexOf(ITEMS[item]);
  return index < 0 ? null : index;
};

/** Level 8 is the lap entry, played before level 2 (a lap child tries things on before choosing); 9 (Which sky?) sits after 2 for toddlers and after 3 for preschool. */
export const LEVELS: BandLevels = {
  lap: { min: 1, max: 8, order: [1, 8, 2] },
  toddler: { min: 2, max: 9, order: [2, 9, 3, 4] },
  preschool: { min: 3, max: 9, order: [3, 9, 4, 5] },
  prek: { min: 4, max: 11, order: [4, 5, 10, 6, 7, 11] },
  school: { min: 6, max: 13, order: [6, 7, 11, 12, 13] },
};
