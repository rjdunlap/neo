import type { CritterName } from '../../art/critter';
import type { BackdropStyle } from '../../art/scenery';
import type { AnimalSound, BiteKind } from '../../audio/sfx';
import type { Rng } from '../../engine/random';
import { spread } from '../../engine/view';

/**
 * Animal Snack: farm friends and their favorite foods. Lap levels are cause and effect: tap an
 * animal and it munches its snack, or tap a snack and it floats to the animal who loves it. Then
 * "who eats grass?", giving each animal its food by dragging, and finally a number of snacks.
 */
export type SnackMode = 'munch' | 'float' | 'who' | 'match' | 'count';

export interface SnackPlan {
  mode: SnackMode;
  animals: number;
  /** Taps ('munch', 'float'), questions ('who', 'count') or foods to hand out ('match'). */
  rounds: number;
  name: string;
}

export const PLANS: SnackPlan[] = [
  { mode: 'munch', animals: 3, rounds: 6, name: 'Tap an animal: it says hello and munches its snack' },
  { mode: 'float', animals: 3, rounds: 6, name: 'Tap a snack: it floats to the animal who loves it' },
  { mode: 'who', animals: 3, rounds: 4, name: 'Who eats grass? or Who says moo? Tap the animal' },
  { mode: 'match', animals: 3, rounds: 3, name: 'Drag each snack to the animal who eats it' },
  { mode: 'count', animals: 3, rounds: 3, name: 'Give an animal 2 to 4 of its snack, then ring the bell' },
];

export const planFor = (level: number) => PLANS[Math.min(PLANS.length, Math.max(1, level)) - 1];

export type Food = 'hay' | 'grass' | 'bone' | 'fish' | 'seeds' | 'apple' | 'honey';

/** Food names in ordinary speech, and the countable thing drawn on the blanket. */
export const FOOD_WORDS: Record<Food, string> = { hay: 'hay', grass: 'grass', bone: 'bones', fish: 'fish', seeds: 'seeds', apple: 'apples', honey: 'honey' };
export const FOOD_UNITS: Record<Food, { one: string; many: string }> = {
  hay: { one: 'bale of hay', many: 'bales of hay' },
  grass: { one: 'tuft of grass', many: 'tufts of grass' },
  bone: { one: 'bone', many: 'bones' },
  fish: { one: 'fish', many: 'fish' },
  seeds: { one: 'handful of seeds', many: 'handfuls of seeds' },
  apple: { one: 'apple', many: 'apples' },
  honey: { one: 'pot of honey', many: 'pots of honey' },
};
export const countedFood = (food: Food, n: number) => FOOD_UNITS[food][n === 1 ? 'one' : 'many'];

/** Overlapping hit areas still select the closest body, within the same forgiving radius. */
export function nearestFriend(points: { x: number; y: number }[], x: number, y: number): number {
  let closest = -1;
  let distance = 114;
  points.forEach((p, i) => {
    const d = Math.hypot(p.x - x, p.y - y);
    if (d <= distance) { closest = i; distance = d; }
  });
  return closest;
}

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
  meadow: { name: 'the meadow', backdrop: { sky: [0x8fd3f7, 0xe9f7ff], hills: [0xc8ecb0, 0x9edb86], horizon: 0.5, clouds: 2, sun: true, seed: 73 }, spot: 'blanket' },
  orchard: { name: 'the orchard', backdrop: { sky: [0xa4dcf2, 0xf6f9e4], hills: [0xbfe49c, 0x8fcf6c], horizon: 0.5, clouds: 1, sun: true, seed: 41 }, spot: 'trough' },
  garden: { name: 'the kitchen garden', backdrop: { sky: [0xb3e0f7, 0xf0f8ff], hills: [0xcde6a6, 0xa6d27a], horizon: 0.5, clouds: 2, sun: true, seed: 58 }, spot: 'tub' },
  dusk: { name: 'the yard at dusk', backdrop: { sky: [0x3d4a8c, 0xf4a96e], hills: [0x6c7f6c, 0x4b5f4d], horizon: 0.5, clouds: 1, sun: false, seed: 19 }, spot: 'bowl' },
};
/** Picked after the rounds are dealt, so a seed's animals and questions are the same in every scene. */
export const sceneFor = (rng: Rng): Scene => rng.pick(SCENES);

/** Where the friends stand: their feet at 0.64 of the height, spread across the view, drawn at 0.6 scale. */
export const FRIEND_SCALE = 0.6;
/** A friend's body-centered tap circle, in its own (unscaled) units. */
export const FRIEND_HIT = { y: -125, r: 190 };
export const friendXs = (n: number, w: number) => spread(n, 200, w - 60, 270);
export const friendFeet = (h: number) => h * 0.64;

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


/** Who eats what: one food each, so every question has one answer. */
export const FAVORITE: Partial<Record<CritterName, Food>> = { cow: 'hay', bunny: 'grass', dog: 'bone', cat: 'fish', duck: 'seeds', pig: 'apple', bear: 'honey' };
export const ANIMALS = Object.keys(FAVORITE) as CritterName[];
/** How each food sounds when bitten: a crunch, a swish, a gnaw, a gulp, pecks or a lick. */
export const BITE: Record<Food, BiteKind> = { grass: 'swish', apple: 'crunch', hay: 'swish', bone: 'gnaw', fish: 'gulp', seeds: 'peck', honey: 'lick' };
/** Bites per snack, and the size left after each one: the last leaves nothing. */
export const BITE_SIZES = [0.7, 0.4, 0] as const;
export const eaterOf = (food: Food) => ANIMALS.find((a) => FAVORITE[a] === food)!;

/** Each animal's own voice. Every animal present has a different one, so a sound names exactly one animal. */
export const VOICE: Partial<Record<CritterName, AnimalSound>> = { cow: 'moo', bunny: 'hop', dog: 'woof', cat: 'meow', duck: 'quack', pig: 'oink', bear: 'growl' };
/** What the voice is called aloud. The bunny's hop is no sound she could name, so it is never the clue. */
export const SOUND_WORDS: Partial<Record<CritterName, string>> = { cow: 'moo', dog: 'woof', cat: 'meow', duck: 'quack', pig: 'oink', bear: 'grr' };
export const SOUNDERS = ANIMALS.filter((a) => SOUND_WORDS[a]);

export interface SnackRound {
  animals: CritterName[];
  /** 'who': the clue is the food (default) or the animal's sound; every second question uses the sound. */
  by?: 'food' | 'sound';
  /** The animal asked about ('who', 'count'), or none. */
  ask?: CritterName;
  /** 'count': how many snacks. */
  n?: number;
}

/** Animals for each round, never asking about the same animal twice running. */
export function makeRounds(plan: SnackPlan, rng: Rng): SnackRound[] {
  const out: SnackRound[] = [];
  const many = plan.mode === 'munch' || plan.mode === 'float' || plan.mode === 'match';
  // Free play and matching keep one set of animals; questions pick new animals each time.
  const fixed = rng.shuffle([...ANIMALS]).slice(0, plan.animals);
  for (let i = 0; i < (many ? 1 : plan.rounds); i++) {
    if (many) {
      out.push({ animals: fixed });
      continue;
    }
    const by = plan.mode === 'who' ? (i % 2 === 1 ? 'sound' : 'food') : undefined;
    let animals: CritterName[];
    let ask: CritterName;
    do {
      animals = rng.shuffle([...ANIMALS]).slice(0, plan.animals);
      // A sound question needs an animal that has a sound word; swap one in if the deal has none.
      if (by === 'sound' && !animals.some((a) => SOUND_WORDS[a])) animals[0] = rng.pick(SOUNDERS);
      ask = rng.pick(by === 'sound' ? animals.filter((a) => SOUND_WORDS[a]) : animals);
    } while (ask === out.at(-1)?.ask);
    out.push({ animals, ask, by, n: plan.mode === 'count' ? rng.int(2, 4) : undefined });
  }
  return out;
}

/** One touch of the ghost finger: an animal (by its place in the row), a snack on the blanket, a snack carried to an animal, or the bell. */
export type SnackTouch = { friend: number } | { snack: number } | { give: number; to: number } | 'bell';

/** What the table looks like to the finger. */
export interface SnackTable {
  friends: CritterName[];
  snacks: { food: Food; eaten: boolean }[];
  /** 'who' and 'count': the animal asked about; 'count': how many snacks it should get. */
  ask?: CritterName;
  n?: number;
  /** 'munch' and 'float': snacks eaten so far. */
  eatenCount: number;
}

/**
 * What a capable child touches next. Free play ('munch') visits each animal in turn; 'float' taps the next snack waiting;
 * 'who' taps the animal asked about; 'match' carries the next snack to the animal that eats it; 'count' gives the animal
 * exactly the number asked for and then rings the bell. It never touches the wrong animal or rings early.
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
      const to = t.friends.findIndex((a) => a === eaterOf(t.snacks[waiting].food));
      return to < 0 ? null : { give: waiting, to };
    }
    case 'count': {
      const fed = t.snacks.filter((s) => s.eaten).length;
      if (fed === t.n) return 'bell';
      return fed < (t.n ?? 0) && waiting >= 0 ? { snack: waiting } : null;
    }
  }
}
