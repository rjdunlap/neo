import type { CritterName } from '../../art/critter';
import type { BackdropStyle } from '../../art/scenery';
import type { AnimalSound, BiteKind } from '../../audio/sfx';
import type { Rng } from '../../engine/random';
import { spread } from '../../engine/view';
import type { BandLevels } from '../../progress/difficulty';

/**
 * Animal Snack: farm friends and their favorite foods. Lap levels are cause and effect: tap an
 * animal and it munches its snack, or tap a snack and it floats to the animal who loves it. Then
 * "who eats grass?", giving each animal its food by dragging, and finally a number of snacks.
 */
export type SnackMode = 'munch' | 'float' | 'who' | 'match' | 'count' | 'sound' | 'eats' | 'pairs';

export interface SnackPlan {
  mode: SnackMode;
  animals: number;
  /** Taps ('munch', 'float'), questions ('who', 'count', 'sound') or foods to hand out ('match'). */
  rounds: number;
  name: string;
  /** Lap's opening: one big animal, a touch anywhere feeds, and the others walk in as she feeds (see `friendsAfter`). */
  oneBig?: boolean;
}

export const PLANS: SnackPlan[] = [
  {
    mode: 'munch',
    animals: 3,
    rounds: 6,
    oneBig: true,
    name: 'One big animal: a touch anywhere gives a snack, and two friends walk in',
  },
  { mode: 'float', animals: 3, rounds: 6, name: 'Tap a snack: it floats to the animal who loves it' },
  { mode: 'who', animals: 3, rounds: 4, name: 'Who eats grass? or Who says moo? Tap the animal' },
  { mode: 'match', animals: 3, rounds: 3, name: 'Drag each snack to the animal who eats it' },
  { mode: 'count', animals: 3, rounds: 3, name: 'Give an animal 2 to 4 of its snack, then ring the bell' },
  {
    mode: 'sound',
    animals: 3,
    rounds: 4,
    name: 'Who says moo? Drag its own snack to the animal that makes the sound',
  },
  { mode: 'eats', animals: 3, rounds: 4, name: 'Who eats hay? There are two: tap both animals that eat it' },
  {
    mode: 'pairs',
    animals: 2,
    rounds: 3,
    name: 'Their own snacks: give two animals 1 to 4 each of their own food, then ring the bell',
  },
];

export const LEVELS: BandLevels = {
  lap: { min: 1, max: 2 },
  toddler: { min: 2, max: 4 },
  preschool: { min: 3, max: 5 },
  prek: { min: 5, max: 8 },
};

export const planFor = (level: number) => PLANS[Math.min(PLANS.length, Math.max(1, level)) - 1];

export type Food =
  'hay' | 'grass' | 'bone' | 'fish' | 'seeds' | 'apple' | 'honey' | 'oats' | 'corn' | 'grain';

/** Food names in ordinary speech, and the countable thing drawn on the blanket. */
export const FOOD_WORDS: Record<Food, string> = {
  hay: 'hay',
  grass: 'grass',
  bone: 'bones',
  fish: 'fish',
  seeds: 'seeds',
  apple: 'apples',
  honey: 'honey',
  oats: 'oats',
  corn: 'corn',
  grain: 'grain',
};
export const FOOD_UNITS: Record<Food, { one: string; many: string }> = {
  hay: { one: 'bale of hay', many: 'bales of hay' },
  grass: { one: 'tuft of grass', many: 'tufts of grass' },
  bone: { one: 'bone', many: 'bones' },
  fish: { one: 'fish', many: 'fish' },
  seeds: { one: 'handful of seeds', many: 'handfuls of seeds' },
  apple: { one: 'apple', many: 'apples' },
  honey: { one: 'pot of honey', many: 'pots of honey' },
  oats: { one: 'bucket of oats', many: 'buckets of oats' },
  corn: { one: 'cob of corn', many: 'cobs of corn' },
  grain: { one: 'ear of grain', many: 'ears of grain' },
};
export const countedFood = (food: Food, n: number) => FOOD_UNITS[food][n === 1 ? 'one' : 'many'];

/** Overlapping hit areas still select the closest body, within the same forgiving radius (any distance for a touch anywhere). */
export function nearestFriend(
  points: { x: number; y: number }[],
  x: number,
  y: number,
  within = 114,
): number {
  let closest = -1;
  let distance = within;
  points.forEach((p, i) => {
    const d = Math.hypot(p.x - x, p.y - y);
    if (d <= distance) {
      closest = i;
      distance = d;
    }
  });
  return closest;
}

/**
 * Lap's one big animal: how many friends stand on the meadow after `eaten` snacks. The second walks in after her second
 * snack and the third after her fourth, so all three are there for the last two of six.
 */
export const friendsAfter = (eaten: number, animals = 3) =>
  Math.min(animals, 1 + Math.floor(Math.max(0, eaten) / 2));
/** The one big animal is drawn nearly twice the size of the others while it is alone, and eases down as they arrive. */
export const BIG_SCALE = 1.1;

/** An invitation in free play, never during eating or in a question, and never counted as help. */
export const shouldNudge = (mode: SnackMode, idle: number, busy: boolean, finished: boolean) =>
  (mode === 'munch' || mode === 'float') && idle >= 6 && !busy && !finished;

/** What a touch gets while an eat or a sentence is under way: an animal squishes, a snack on the blanket wiggles. It never feeds or counts. */
export type BusyAnswer = 'poke' | 'wiggle' | null;
export type BusyTarget = { friend: true } | { snack: { eaten: boolean; visible: boolean } };
export function busyTouch(busy: boolean, finished: boolean, target: BusyTarget): BusyAnswer {
  if (!busy || finished) return null;
  if ('friend' in target) return 'poke';
  return !target.snack.eaten && target.snack.visible ? 'wiggle' : null;
}

/** Where snack time happens: the round's seed picks one. The food, the animals and the rules are the same everywhere. */
export type Scene = 'meadow' | 'orchard' | 'garden' | 'dusk';
export const SCENES: Scene[] = ['meadow', 'orchard', 'garden', 'dusk'];
/** What the snacks sit in: a picnic blanket, a wooden trough, a tin tub or a big bowl. */
export type Spot = 'blanket' | 'trough' | 'tub' | 'bowl';
export interface SceneSpec {
  name: string;
  backdrop: BackdropStyle;
  spot: Spot;
}
export const SCENE_SPECS: Record<Scene, SceneSpec> = {
  meadow: {
    name: 'the meadow',
    backdrop: {
      sky: [0x8fd3f7, 0xe9f7ff],
      hills: [0xc8ecb0, 0x9edb86],
      horizon: 0.5,
      clouds: 2,
      sun: true,
      seed: 73,
    },
    spot: 'blanket',
  },
  orchard: {
    name: 'the orchard',
    backdrop: {
      sky: [0xa4dcf2, 0xf6f9e4],
      hills: [0xbfe49c, 0x8fcf6c],
      horizon: 0.5,
      clouds: 1,
      sun: true,
      seed: 41,
    },
    spot: 'trough',
  },
  garden: {
    name: 'the kitchen garden',
    backdrop: {
      sky: [0xb3e0f7, 0xf0f8ff],
      hills: [0xcde6a6, 0xa6d27a],
      horizon: 0.5,
      clouds: 2,
      sun: true,
      seed: 58,
    },
    spot: 'tub',
  },
  dusk: {
    name: 'the yard at dusk',
    backdrop: {
      sky: [0x3d4a8c, 0xf4a96e],
      hills: [0x6c7f6c, 0x4b5f4d],
      horizon: 0.5,
      clouds: 1,
      sun: false,
      seed: 19,
    },
    spot: 'bowl',
  },
};
/** Picked after the rounds are dealt, so a seed's animals and questions are the same in every scene. */
export const sceneFor = (rng: Rng): Scene => rng.pick(SCENES);

/** Where the friends stand: their feet at 0.64 of the height, spread across the view, drawn at 0.6 scale. */
export const FRIEND_SCALE = 0.6;
/** A friend's body-centered tap circle, in its own (unscaled) units. */
export const FRIEND_HIT = { y: -125, r: 190 };
export const friendXs = (n: number, w: number) => spread(n, 200, w - 60, 270);
export const friendFeet = (h: number) => h * 0.64;

/**
 * The feeding spot's edges and its snacks' places across a view `w` wide. On the narrow upright area (chunk 31) the spot
 * reaches from just right of the guide to the edge, so five 110-wide snacks keep apart.
 */
export const spotEdges = (w: number) =>
  w < 900 ? { left: 160, right: w - 20 } : { left: 170, right: w - 50 };
export const snackXs = (n: number, w: number) =>
  w < 900 ? spread(n, spotEdges(w).left, spotEdges(w).right, 140) : spread(n, 220, w - 80, 140);

/** The orchard tree's canopy across the left of the view (drawn in `drawDecor`). */
const ORCHARD_TREE = { left: 10, right: 220 };

/** A far barn is this many times as wide as it is tall. */
export const BARN_ASPECT = 1.1;

export interface FarBarn {
  x: number;
  /** The horizon the barn stands on. */
  base: number;
  height: number;
}

/**
 * The Barnyard's far barn on the horizon (visual identity V1): 60 to 80 units tall, in the widest
 * stretch of horizon that no friend's tap circle and no orchard tree covers, so it is never behind
 * a target. Null when no stretch is wide enough; the scene then simply has no barn.
 */
export function farBarnAt(scene: Scene, w: number, h: number, animals: number): FarBarn | null {
  const base = h * SCENE_SPECS[scene].backdrop.horizon;
  const r = FRIEND_HIT.r * FRIEND_SCALE;
  const blocked = friendXs(animals, w).map((x) => [x - r, x + r]);
  if (scene === 'orchard') blocked.push([ORCHARD_TREE.left, ORCHARD_TREE.right]);
  blocked.sort((a, b) => a[0] - b[0]);
  const gap = 16;
  let from = 24;
  let best: [number, number] = [0, 0];
  for (const [l, rr] of [...blocked, [w - 24 + gap, Infinity]]) {
    const to = l - gap;
    if (to - from > best[1] - best[0]) best = [from, to];
    from = Math.max(from, rr + gap);
  }
  const height = Math.min(80, (best[1] - best[0]) / BARN_ASPECT);
  if (height < 60) return null;
  return { x: (best[0] + best[1]) / 2, base, height };
}

/**
 * Who eats what: one favorite each. The sheep and the bunny both love grass, so they are never dealt together and
 * every question still has one answer among the animals present (`dealAnimals`).
 */
export const FAVORITE: Partial<Record<CritterName, Food>> = {
  cow: 'hay',
  bunny: 'grass',
  dog: 'bone',
  cat: 'fish',
  duck: 'seeds',
  pig: 'apple',
  bear: 'honey',
  sheep: 'grass',
  horse: 'oats',
  hen: 'corn',
  mouse: 'grain',
};
/** Every animal at snack time, in the order the journal lists them. */
export const ANIMALS = Object.keys(FAVORITE) as CritterName[];
/** The seven first words: the only animals at levels 1 and 2. */
export const FIRST_ANIMALS: CritterName[] = ['cow', 'bunny', 'dog', 'cat', 'duck', 'pig', 'bear'];
/** Who can come to snack time at this plan: the seven in free play, all eleven from level 3's questions up. */
export const poolFor = (plan: SnackPlan): CritterName[] =>
  plan.mode === 'munch' || plan.mode === 'float' ? FIRST_ANIMALS : ANIMALS;

/** `n` animals from `pool` in a random order, never two with the same favorite food. */
export function dealAnimals(pool: CritterName[], n: number, rng: Rng): CritterName[] {
  const out: CritterName[] = [];
  for (const a of rng.shuffle([...pool])) {
    if (out.length === n) break;
    if (!out.some((b) => FAVORITE[b] === FAVORITE[a])) out.push(a);
  }
  return out;
}
/** How each food sounds when bitten: a crunch, a swish, a gnaw, a gulp, pecks or a lick. */
export const BITE: Record<Food, BiteKind> = {
  grass: 'swish',
  apple: 'crunch',
  hay: 'swish',
  bone: 'gnaw',
  fish: 'gulp',
  seeds: 'peck',
  honey: 'lick',
  oats: 'crunch',
  corn: 'peck',
  grain: 'gnaw',
};
/** Bites per snack, and the size left after each one: the last leaves nothing. */
export const BITE_SIZES = [0.7, 0.4, 0] as const;
/** The animal present who loves `food` (one at most, since `dealAnimals` never deals two with one favorite). */
export const eaterOf = (food: Food, present: CritterName[]) => present.find((a) => FAVORITE[a] === food);

/** Each animal's own voice. Every animal present has a different one, so a sound names exactly one animal. */
export const VOICE: Partial<Record<CritterName, AnimalSound>> = {
  cow: 'moo',
  bunny: 'hop',
  dog: 'woof',
  cat: 'meow',
  duck: 'quack',
  pig: 'oink',
  bear: 'growl',
  sheep: 'baa',
  horse: 'neigh',
  hen: 'cluck',
  mouse: 'squeak',
};
/** What the voice is called aloud. The bunny's hop is no sound she could name, so it is never the clue. */
export const SOUND_WORDS: Partial<Record<CritterName, string>> = {
  cow: 'moo',
  dog: 'woof',
  cat: 'meow',
  duck: 'quack',
  pig: 'oink',
  bear: 'grr',
  sheep: 'baa',
  horse: 'neigh',
  hen: 'cluck',
  mouse: 'squeak',
};
export const SOUNDERS = ANIMALS.filter((a) => SOUND_WORDS[a]);

export interface SnackRound {
  animals: CritterName[];
  /** 'who': the clue is the food (default) or the animal's sound; every second question uses the sound. 'sound': always the sound. */
  by?: 'food' | 'sound';
  /** The animal asked about ('who', 'count'), or none. */
  ask?: CritterName;
  /** 'count': how many snacks. */
  n?: number;
  /** 'eats': the food asked about; two of the animals eat it and the third never does. */
  food?: Food;
  /** 'pairs': how many each animal wants, in the same order as `animals`. */
  wants?: number[];
}

/** Animals for each round, never asking about the same animal twice running. */
export function makeRounds(plan: SnackPlan, rng: Rng): SnackRound[] {
  if (plan.mode === 'eats') return makeEatsRounds(plan.rounds, rng);
  if (plan.mode === 'pairs') return makePairsRounds(plan.rounds, rng);
  const out: SnackRound[] = [];
  const many = plan.mode === 'munch' || plan.mode === 'float' || plan.mode === 'match';
  // Free play and matching keep one set of animals; questions pick new animals each time.
  const pool = poolFor(plan);
  const fixed = dealAnimals(pool, plan.animals, rng);
  for (let i = 0; i < (many ? 1 : plan.rounds); i++) {
    if (many) {
      out.push({ animals: fixed });
      continue;
    }
    const by =
      plan.mode === 'who' ? (i % 2 === 1 ? 'sound' : 'food') : plan.mode === 'sound' ? 'sound' : undefined;
    let animals: CritterName[];
    let ask: CritterName | undefined;
    do {
      animals = dealAnimals(pool, plan.animals, rng);
      // A sound question needs an animal that has a sound word; a deal with none is dealt again.
      const askable = by === 'sound' ? animals.filter((a) => SOUND_WORDS[a]) : animals;
      ask = askable.length ? rng.pick(askable) : undefined;
    } while (!ask || ask === out.at(-1)?.ask);
    out.push({ animals, ask, by, n: plan.mode === 'count' ? rng.int(2, 4) : undefined });
  }
  return out;
}

/**
 * Level 6, Who says moo?: a snack dropped on an animal. The animal is judged first: the asked sound names exactly one
 * animal, so any other animal is the wrong one even when the snack is its own favorite (it answers in its own voice).
 * The right animal with another animal's food says no thank you; its own food is a yum.
 */
export type SoundDrop = 'yum' | 'wrongAnimal' | 'wrongFood';
export const soundDrop = (ask: CritterName, food: Food, to: CritterName): SoundDrop =>
  to !== ask ? 'wrongAnimal' : FAVORITE[ask] === food ? 'yum' : 'wrongFood';

/** Level 6's help: the second miss on a question glows the animal that makes the sound, the fourth its snack. */
export const soundHelp = (wrongs: number): 'animal' | 'snack' | null =>
  wrongs === 2 ? 'animal' : wrongs === 4 ? 'snack' : null;

/** One touch of the ghost finger: an animal (by its place in the row), a snack on the blanket, a snack carried to an animal, or the bell. */
export type SnackTouch = { friend: number } | { snack: number } | { give: number; to: number } | 'bell';

/** What the table looks like to the finger. */
export interface SnackTable {
  friends: CritterName[];
  snacks: { food: Food; eaten: boolean }[];
  /** 'who', 'sound' and 'count': the animal asked about; 'count': how many snacks it should get. */
  ask?: CritterName;
  n?: number;
  /** 'munch' and 'float': snacks eaten so far. */
  eatenCount: number;
  /** 'eats': the food asked about and the eaters already found. */
  food?: Food;
  found?: CritterName[];
  /** 'pairs': how many each animal wants, and how many of its food it has eaten, in the row's order. */
  wants?: number[];
  given?: number[];
}

/**
 * What a capable child touches next. Free play ('munch') visits each animal in turn; 'float' taps the next snack waiting;
 * 'who' taps the animal asked about; 'match' carries the next snack to the animal that eats it; 'sound' carries the asked
 * animal's own snack to it; 'count' gives the animal exactly the number asked for and then rings the bell. It never touches the wrong animal or rings early.
 */
export function snackTouch(plan: SnackPlan, t: SnackTable): SnackTouch | null {
  const waiting = t.snacks.findIndex((s) => !s.eaten);
  switch (plan.mode) {
    case 'munch':
      return t.friends.length ? { friend: t.eatenCount % t.friends.length } : null;
    case 'float':
      return waiting < 0 ? null : { snack: waiting };
    case 'who': {
      const who = t.friends.findIndex((a) => a === t.ask);
      return who < 0 ? null : { friend: who };
    }
    case 'match': {
      if (waiting < 0) return null;
      const to = t.friends.findIndex((a) => a === eaterOf(t.snacks[waiting].food, t.friends));
      return to < 0 ? null : { give: waiting, to };
    }
    case 'sound': {
      const give = t.snacks.findIndex((s) => !s.eaten && s.food === FAVORITE[t.ask!]);
      const to = t.friends.findIndex((a) => a === t.ask);
      return give < 0 || to < 0 ? null : { give, to };
    }
    case 'eats': {
      const next = t.friends.findIndex((a) => eats(a, t.food!) && !t.found?.includes(a));
      return next < 0 ? null : { friend: next };
    }
    case 'pairs': {
      const wants = t.wants ?? [];
      const given = t.given ?? [];
      const to = t.friends.findIndex((_, i) => (given[i] ?? 0) < (wants[i] ?? 0));
      if (to < 0) return 'bell';
      const give = t.snacks.findIndex((s) => !s.eaten && s.food === FAVORITE[t.friends[to]]);
      return give < 0 ? null : { give, to };
    }
    case 'count': {
      const fed = t.snacks.filter((s) => s.eaten).length;
      if (fed === t.n) return 'bell';
      return fed < (t.n ?? 0) && waiting >= 0 ? { snack: waiting } : null;
    }
  }
}

/**
 * Level 7, Who eats it too?: foods some of the eleven truly eat, from the cited sources below. Only foods with at least
 * two eaters and a definite non-eater are asked; every animal whose favorite a food is, eats it.
 * - Cat: an obligate carnivore that relies on nutrients found only in animal products (Cornell Feline Health Center,
 *   "Feeding your cat"), so it eats fish and none of the plant foods.
 * - Bear: black bears eat fish, and apples and corn near farms (NPS Big South Fork "Black Bears"; Shenandoah NPS
 *   "American Black Bear").
 * - Cow: hay and corn silage (University of Kentucky "Forages for dairy cattle"; UW–Madison Extension corn silage).
 * - Horse: hay first, then oats and corn, apples as a treat (University of Missouri Extension G2807; UMN Extension
 *   "Ten things you should know about feeding a mature horse").
 * - Sheep: grass hay, with oats or corn as grain (Oregon State EC 1652; Ontario OMAFRA "Feeding systems for sheep").
 * - Bunny: grass hay is most of a rabbit's diet (House Rabbit Society Chicago, "Hay! The grass roots of the diet").
 * - Hen: scratch grains such as corn and oats (Oregon State PNW 477; poultry.extension.org "Feeding chickens").
 * - Duck: mallards eat mostly seeds and waste grain (Audubon field guide, Mallard).
 * - Mouse: house mice prefer seeds and grain (Nebraska Extension / ICWDM house mouse factsheet; Purdue Extension).
 * - Pig: corn is pigs' main energy feed (Iowa Pork Industry Center "Feedstuffs"); apples are its favorite in this game.
 * The herbivores (cow, horse, sheep, bunny) eat plants only, so they are the definite non-eaters of fish.
 */
export const EATS: Partial<Record<Food, CritterName[]>> = {
  hay: ['cow', 'horse', 'sheep', 'bunny'],
  fish: ['cat', 'bear'],
  seeds: ['duck', 'hen', 'mouse'],
  apple: ['pig', 'horse', 'bear'],
  corn: ['hen', 'pig', 'cow', 'horse'],
  oats: ['horse', 'sheep', 'hen'],
};
/** Animals that definitely do not eat the food: the only animals dealt as the wrong answer. */
export const NOT_EATS: Partial<Record<Food, CritterName[]>> = {
  hay: ['cat'],
  fish: ['cow', 'horse', 'sheep', 'bunny'],
  seeds: ['cat'],
  apple: ['cat'],
  corn: ['cat'],
  oats: ['cat'],
};
export const EATS_FOODS = Object.keys(EATS) as Food[];
export const eats = (animal: CritterName, food: Food) => !!EATS[food]?.includes(animal);

/**
 * Four questions, each a food (never the same one twice running), its favorite-holder and one more of its eaters, and
 * one definite non-eater, in a shuffled row.
 */
export function makeEatsRounds(rounds: number, rng: Rng): SnackRound[] {
  const out: SnackRound[] = [];
  for (let i = 0; i < rounds; i++) {
    const food = rng.pick(EATS_FOODS.filter((f) => f !== out.at(-1)?.food));
    const all = EATS[food]!;
    const fav = rng.pick(all.filter((a) => FAVORITE[a] === food));
    const other = rng.pick(all.filter((a) => a !== fav));
    const not = rng.pick(NOT_EATS[food]!);
    out.push({ animals: rng.shuffle([fav, other, not]), food });
  }
  return out;
}

/** Level 7: what a tap on an animal means: a new eater found, one already found (no miss), or a non-eater (a miss). */
export type EatsTap = 'found' | 'again' | 'wrong';
export const eatsTap = (food: Food, to: CritterName, found: CritterName[]): EatsTap =>
  !eats(to, food) ? 'wrong' : found.includes(to) ? 'again' : 'found';

/** Level 8: each animal's pile on the two-row blanket holds this many of its food, more than any animal wants. */
export const PAIR_PILE = 5;
/** Level 8: the two piles' rows are this far apart, more than a snack's 132-wide touch circle. */
export const ROW_STEP = 135;
/** Level 8: the most any one animal asks for, so its pile always has one to spare and overshooting is possible. */
export const PAIR_MAX = 4;

/**
 * Level 8, Their own snacks: three asks, each two animals with different favorites (never the same pair twice running)
 * and how many each wants, 1 to 4. The two never want the same number, so the sign's two rows of dots read apart.
 */
export function makePairsRounds(rounds: number, rng: Rng): SnackRound[] {
  const out: SnackRound[] = [];
  for (let i = 0; i < rounds; i++) {
    let animals: CritterName[];
    do animals = dealAnimals(ANIMALS, 2, rng);
    while (out.length && animals.every((a) => out.at(-1)!.animals.includes(a)));
    const a = rng.int(1, PAIR_MAX);
    let b = rng.int(1, PAIR_MAX - 1);
    if (b >= a) b++;
    out.push({ animals, wants: [a, b] });
  }
  return out;
}

/** Level 8: a snack dropped on an animal is eaten only when it is that animal's own food. Any number may be eaten. */
export const pairsDrop = (food: Food, to: CritterName): 'yum' | 'wrongFood' =>
  FAVORITE[to] === food ? 'yum' : 'wrongFood';

/**
 * Level 8's bell: right when every animal has exactly what it wants; otherwise the first animal in the row that is off,
 * with what it has and wants, and how many extras each animal sends back.
 */
export type PairsBell =
  { ok: true } | { ok: false; off: number; have: number; want: number; extras: number[] };
export function pairsBell(wants: number[], given: number[]): PairsBell {
  const off = wants.findIndex((w, i) => (given[i] ?? 0) !== w);
  if (off < 0) return { ok: true };
  return {
    ok: false,
    off,
    have: given[off] ?? 0,
    want: wants[off],
    extras: wants.map((w, i) => Math.max(0, (given[i] ?? 0) - w)),
  };
}
