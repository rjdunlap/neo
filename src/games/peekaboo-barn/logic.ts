import { CRITTERS, type CritterSpec } from '../../art/critter';
import type { AnimalSound } from '../../audio/sfx';
import type { Rng } from '../../engine/random';
import type { BandLevels } from '../../progress/difficulty';

// Saved stickers and the icon keep their original pool, even if play gains new friends.
export const STICKER_ANIMALS = ['cow', 'duck', 'pig', 'cat', 'dog', 'bunny', 'bear'] as const;
/** The farm four, drawn and voiced in `critter.ts` and `sfx` (built for Animal Snack). They join from `NEWCOMER_LEVEL`. */
export const NEW_ANIMALS = ['sheep', 'horse', 'hen', 'mouse'] as const;
export const ANIMALS = [...STICKER_ANIMALS, ...NEW_ANIMALS] as const;
export type Animal = (typeof ANIMALS)[number];

/** Each friend's own sound (`sfx.animal`) and the word said for it when it pops out. */
export const VOICES: Record<Animal, { sound: AnimalSound; word: string }> = {
  cow: { sound: 'moo', word: 'Moo' },
  duck: { sound: 'quack', word: 'Quack quack' },
  pig: { sound: 'oink', word: 'Oink oink' },
  cat: { sound: 'meow', word: 'Meow' },
  dog: { sound: 'woof', word: 'Woof woof' },
  bunny: { sound: 'hop', word: 'Hop hop' },
  bear: { sound: 'growl', word: 'Grrr' },
  sheep: { sound: 'baa', word: 'Baa' },
  horse: { sound: 'neigh', word: 'Neigh' },
  hen: { sound: 'cluck', word: 'Cluck cluck' },
  mouse: { sound: 'squeak', word: 'Squeak squeak' },
};

/** The first level whose pool holds the farm four; below it (and the entry levels) she meets the first seven words first. */
export const NEWCOMER_LEVEL = 4;

/** Who can hide at this level. Levels 1–3 and the entry levels keep the seven, so their seeds deal exactly as before. */
export const poolFor = (level: number): readonly Animal[] =>
  level === SOUND_LEVEL
    ? SOUND_ANIMALS
    : level >= NEWCOMER_LEVEL && !ENTRY_LEVELS.includes(level)
      ? ANIMALS
      : STICKER_ANIMALS;

export interface PeekPlan {
  /**
   * free: tap to reveal. find: animals peek, "where's the cow?". remember: they show, hide, then the question. clue: they
   * stand up over their places and a feeling or a part word picks one ("Who is sleepy?", "Find the one with spots!").
   * top: only the top of each head shows over the cover (ears, horns, a tuft), and she finds the one asked for by it.
   * pair: four animals stand up and she finds the one that matches both parts.
   * swap: they show and hide as in remember, then houses trade places in slow arcs, and she follows the one asked for.
   * went: one animal trots in and hops behind one of the houses while she watches; the others are empty.
   * sound: animals peek as in find, and the ask is a sound ("Who says moo?"), not a name.
   */
  mode: 'free' | 'find' | 'remember' | 'clue' | 'top' | 'swap' | 'pair' | 'went' | 'sound';
  spots: number;
  /** Reveals (free) or questions (find, remember). */
  goal: number;
  /** One door: a single big house, and a touch anywhere opens it. */
  door?: boolean;
  /** Switcheroo: how many times two houses trade places before the ask. */
  swaps?: number;
}

/** The lap entry below level 1; its saved ID follows the original eight (see `order` in the band table). */
export const ONE_DOOR_LEVEL = 16;
export const SELF_OPEN_SECONDS = 6;
/** Where did it go?: easier than level 3 (nobody to name or remember), so `order` places it between 2 and 3. */
export const WENT_LEVEL = 17;
/** Who says moo?: the sound is the question (Peekaboo Zoo's idea), so `order` places it between 3 and 4 for toddlers. */
export const SOUND_LEVEL = 18;
/** Easy rounds with IDs above the ladder, placed by a band's `order`. */
export const ENTRY_LEVELS: readonly number[] = [ONE_DOOR_LEVEL, WENT_LEVEL, SOUND_LEVEL];
/**
 * Who says moo? asks among the first seven, less the bunny: "hop hop" is what it does, not a voice. Every sound and word
 * here is its own (a rule test checks), so the sound asked names exactly one animal.
 */
export const SOUND_ANIMALS: readonly Animal[] = STICKER_ANIMALS.filter((a) => a !== 'bunny');
/** The asked sound as said mid-sentence: "Who says moo?", "Who says quack quack?". */
export const soundWord = (animal: Animal) => VOICES[animal].word.toLowerCase();

export const PLANS: PeekPlan[] = [
  { mode: 'free', spots: 3, goal: 8 },
  { mode: 'free', spots: 4, goal: 12 },
  { mode: 'find', spots: 2, goal: 5 },
  { mode: 'find', spots: 3, goal: 6 },
  { mode: 'find', spots: 4, goal: 6 },
  { mode: 'remember', spots: 2, goal: 5 },
  { mode: 'remember', spots: 3, goal: 5 },
  { mode: 'remember', spots: 4, goal: 6 },
  { mode: 'clue', spots: 3, goal: 5 },
  { mode: 'top', spots: 3, goal: 5 },
  { mode: 'top', spots: 4, goal: 6 },
  { mode: 'swap', spots: 3, goal: 5, swaps: 1 },
  { mode: 'swap', spots: 3, goal: 5, swaps: 2 },
  { mode: 'swap', spots: 4, goal: 5, swaps: 3 },
  { mode: 'pair', spots: 4, goal: 5 },
];

export const LEVELS: BandLevels = {
  // Level 16 (One door) is the easiest, so lap plays it first and then 1, 2 (see `order`).
  // Where did it go? (17) is her first question, after free play and before finding by name.
  lap: { min: 1, max: 17, order: [16, 1, 2, 17] },
  // Who says moo? (18) asks by sound among two, after finding by name among two (3) and before three (4).
  toddler: { min: 1, max: 18, order: [1, 2, 17, 3, 18, 4, 5] },
  preschool: { min: 4, max: 8 },
  // Four houses with three swaps and the two-clue questions are school only.
  prek: { min: 6, max: 13 },
  school: { min: 9, max: 15 },
};

const ONE_DOOR: PeekPlan = { mode: 'free', spots: 1, goal: 6, door: true };

const WENT: PeekPlan = { mode: 'went', spots: 2, goal: 4 };

const SOUND: PeekPlan = { mode: 'sound', spots: 2, goal: 5 };

export const planFor = (level: number) =>
  level === ONE_DOOR_LEVEL
    ? ONE_DOOR
    : level === WENT_LEVEL
      ? WENT
      : level === SOUND_LEVEL
        ? SOUND
        : PLANS[Math.min(PLANS.length, Math.max(1, level)) - 1];

/** Where did it go?: who trots in, and which house (left to right) it hops behind. Every other house is empty. */
export interface WentDeal {
  animal: Animal;
  house: number;
}

/**
 * One Where did it go? question: never the animal asked about last time (`last`), and never the same house three times
 * running (`recent` holds the houses of the questions so far), so watching, not a favourite side, finds it.
 */
export function dealWent(
  rng: Rng,
  spots: number,
  pool: readonly Animal[],
  last: Animal | null,
  recent: readonly number[] = [],
): WentDeal {
  const animal = pickTarget(rng, pool, last);
  const [a, b] = recent.slice(-2);
  const stuck = recent.length >= 2 && a === b ? b : -1;
  const houses = Array.from({ length: spots }, (_, i) => i).filter((i) => i !== stuck);
  return { animal, house: rng.pick(houses) };
}

/** Who is behind each house after the animal has hidden: the animal in its house, nobody (null) in the others. */
export const wentHouses = (d: WentDeal, spots: number): (Animal | null)[] =>
  Array.from({ length: spots }, (_, i) => (i === d.house ? d.animal : null));

/** A different animal behind each hiding place, from the level's pool (`poolFor`). */
export const deal = (rng: Rng, spots: number, pool: readonly Animal[]): Animal[] =>
  rng.shuffle([...pool]).slice(0, spots);

/** Who to ask for: someone hiding now, and not the same friend as last time. */
export function pickTarget(rng: Rng, present: readonly Animal[], last: Animal | null): Animal {
  const fresh = present.filter((a) => a !== last);
  return rng.pick(fresh.length ? fresh : present);
}

/**
 * Free play sometimes shows how a friend feels, and the voice names it: three feeling words a lap child can hear, all
 * drawn already by `Critter`. `sad` stays out of a lap toy.
 */
export const FEELINGS = ['sleepy', 'surprised', 'sing'] as const;
export type Feeling = (typeof FEELINGS)[number];
export const FEELING_WORDS: Record<Feeling, string> = {
  sleepy: 'sleepy',
  surprised: 'surprised',
  sing: 'singing',
};
/** About one reveal in three carries a feeling; the rest are simply happy. */
export const FEELING_CHANCE = 1 / 3;

/**
 * How the animal popping out feels, or null when it is simply happy. Free play only (levels 1–2): One door keeps the
 * lap entry simplest, and question levels name who, not how. Never the same feeling twice running.
 */
export function pickFeeling(rng: Rng, plan: PeekPlan, last: Feeling | null): Feeling | null {
  if (plan.mode !== 'free' || plan.door) return null;
  if (!rng.chance(FEELING_CHANCE)) return null;
  return rng.pick(FEELINGS.filter((f) => f !== last));
}

/** Free play: someone new sneaks in, never the same as anyone already out. */
export const newcomer = (rng: Rng, taken: readonly Animal[], pool: readonly Animal[]): Animal =>
  rng.pick(pool.filter((a) => !taken.includes(a)));

/**
 * Which hiding place a capable child taps next, or null while she waits. Asked for someone (find, remember): the place that
 * hides them. Free play: the next place after the one she tapped last (so she visits them all) that has nobody out already.
 * `poses` are the places' poses left to right ('hidden', 'peek' or 'out'), `animals` who is behind each (null: nobody).
 */
export function spotToTap(
  plan: PeekPlan,
  poses: readonly string[],
  animals: readonly (Animal | null)[],
  target: Animal | null,
  last: number,
): number | null {
  if (plan.mode !== 'free') {
    const i = animals.indexOf(target as Animal);
    return target && i >= 0 ? i : null;
  }
  for (let k = 1; k <= poses.length; k++) {
    const i = (last + k) % poses.length;
    if (poses[i] !== 'out') return i;
  }
  return null;
}

export const COVER_NAMES = {
  hay: 'haystack',
  bush: 'bush',
  door: 'door',
  crate: 'crate',
  flowerpot: 'flowerpot',
  sunflower: 'sunflower',
  wheelbarrow: 'wheelbarrow',
  rock: 'rock',
  blanket: 'blanket',
  toybox: 'toy box',
  curtain: 'curtain',
  bed: 'bed',
  umbrella: 'umbrella',
  sandcastle: 'sandcastle',
  bucket: 'bucket',
  towel: 'towel',
} as const;
export type CoverKind = keyof typeof COVER_NAMES;

/** Among overlapping hit boxes, choose the closest center; equal distances keep the left place. */
export function nearestSpot(
  x: number,
  y: number,
  spots: readonly { x: number; y: number; scale: number }[],
): number | null {
  let best: number | null = null;
  let distance = Infinity;
  spots.forEach((s, i) => {
    const dx = (x - s.x) / s.scale;
    const dy = (y - s.y) / s.scale;
    if (Math.abs(dx) > 130 || dy < -340 || dy > 10) return;
    const d = Math.abs(x - s.x);
    if (d < distance) {
      best = i;
      distance = d;
    }
  });
  return best;
}

/** A nudge invites a touch, never awards a reveal or interrupts an animal already showing. */
export const shouldNudge = (plan: PeekPlan, idle: number, poses: readonly string[], busy: boolean) =>
  plan.mode === 'free' &&
  !plan.door &&
  idle >= SELF_OPEN_SECONDS &&
  !busy &&
  poses.every((pose) => pose === 'hidden');

/** One door opens by itself when she has not touched for a while; that reveal never counts toward the round. */
export const shouldSelfOpen = (plan: PeekPlan, idle: number, poses: readonly string[], busy: boolean) =>
  !!plan.door && idle >= SELF_OPEN_SECONDS && !busy && poses.every((pose) => pose === 'hidden');

export const SCENES = {
  barnyard: ['hay', 'bush', 'door', 'crate'],
  garden: ['flowerpot', 'sunflower', 'wheelbarrow', 'rock'],
  beach: ['umbrella', 'sandcastle', 'bucket', 'towel'],
  bedroom: ['blanket', 'toybox', 'curtain', 'bed'],
} as const satisfies Record<string, readonly CoverKind[]>;
export type SceneId = keyof typeof SCENES;

/** One seeded setting per round, with distinct places at every existing level. */
export function roundScene(rng: Rng, spots: number) {
  const id = rng.pick(Object.keys(SCENES) as SceneId[]);
  return { id, covers: rng.shuffle([...SCENES[id]]).slice(0, spots) };
}

/**
 * Level 9's part words, each read from the animals' drawn parts in `CRITTERS` (so a clue is never about something the
 * picture does not show). Every animal holds at least one, so a wrong tap can always say something true about it.
 */
export const PARTS = {
  spots: { words: 'spots', has: (s: CritterSpec) => !!s.spots },
  horns: { words: 'horns', has: (s: CritterSpec) => !!s.horns },
  whiskers: { words: 'whiskers', has: (s: CritterSpec) => !!s.whiskers },
  wings: { words: 'wings', has: (s: CritterSpec) => !!s.wings },
  bill: { words: 'a bill', has: (s: CritterSpec) => s.snout === 'bill' },
  snout: { words: 'a round pink snout', has: (s: CritterSpec) => s.snout === 'pig' },
  long: { words: 'long ears', has: (s: CritterSpec) => s.ears === 'long' },
  pointy: { words: 'pointy ears', has: (s: CritterSpec) => s.ears === 'pointy' },
  floppy: { words: 'floppy ears', has: (s: CritterSpec) => s.ears === 'floppy' },
  // The mouse's big ears are drawn as circles too, so they count as round: a bear and a mouse together share them.
  round: { words: 'round ears', has: (s: CritterSpec) => s.ears === 'round' || s.ears === 'big' },
  // The farm four's own parts, after the first ten so the seven's facts (`factAbout`) are unchanged. No beak: a duck's
  // bill is a beak too, so "who has a beak?" would have two right answers.
  wool: { words: 'wool', has: (s: CritterSpec) => !!s.wool },
  mane: { words: 'a mane', has: (s: CritterSpec) => !!s.mane },
  comb: { words: 'a red comb', has: (s: CritterSpec) => !!s.comb },
} as const;
export type Part = keyof typeof PARTS;
export const PART_IDS = Object.keys(PARTS) as Part[];

export const hasPart = (animal: Animal, part: Part) => PARTS[part].has(CRITTERS[animal] as CritterSpec);

// White includes the sheep's cream fleece. The mouse's grey shade overrides its white palette entry.
const COATS = {
  white: { words: 'a white coat', has: (s: CritterSpec) => s.color === 'white' && (!s.shade || !!s.wool) },
  brown: { words: 'a brown coat', has: (s: CritterSpec) => s.color === 'brown' },
};
export const PAIR_FEATURES = { ...PARTS, ...COATS };
type PairFeature = keyof typeof PAIR_FEATURES;
export type CluePair = readonly [PairFeature, PairFeature];

export const hasFeature = (animal: Animal, feature: PairFeature) =>
  PAIR_FEATURES[feature].has(CRITTERS[animal]);

// A question needs four distinct roles: both clues, first only, second only, and neither.
const featureIds = Object.keys(PAIR_FEATURES) as PairFeature[];
const pairQuestions = featureIds.flatMap((first, i) =>
  featureIds.slice(i + 1).flatMap((second) => {
    const byMatch = [[], [], [], []] as Animal[][];
    for (const animal of ANIMALS) {
      const match = Number(hasFeature(animal, first)) + 2 * Number(hasFeature(animal, second));
      byMatch[match].push(animal);
    }
    if (byMatch.some((animals) => !animals.length)) return [];
    return byMatch[3].map((answer) => ({
      pair: [first, second] as CluePair,
      answer,
      decoys: byMatch.slice(0, 3),
    }));
  }),
);

export function dealPair(rng: Rng, last: Animal | null) {
  const { pair, answer, decoys } = rng.pick(pairQuestions.filter((question) => question.answer !== last));
  return { pair, answer, animals: rng.shuffle([answer, ...decoys.map((animals) => rng.pick(animals))]) };
}

export function pairFeedback(animal: Animal, [first, second]: CluePair) {
  if (hasFeature(animal, first)) return { fact: first, missing: second };
  if (hasFeature(animal, second)) return { fact: second, missing: first };
  return null;
}

/** Level 9's feeling clues: faces `Critter` draws and keeps. `surprised` stays out, since every critter pops up surprised. */
export const CLUE_FEELINGS = ['sleepy', 'sing'] as const satisfies readonly Feeling[];

export type Clue = { kind: 'feeling'; feeling: Feeling } | { kind: 'part'; part: Part };

/** The present animals a clue describes; `feelingOf` is the one animal showing the clue's feeling. */
export function holders(clue: Clue, present: readonly Animal[], feelingOf: Animal | null): Animal[] {
  if (clue.kind === 'feeling') return present.filter((a) => a === feelingOf);
  return present.filter((a) => hasPart(a, clue.part));
}

/** The parts exactly one present animal has. */
export const uniqueParts = (present: readonly Animal[]) =>
  PART_IDS.filter((p) => present.filter((a) => hasPart(a, p)).length === 1);

/** The round's rhythm: a feeling first (the dive's first round), then two parts, a feeling, a part. */
export const clueKindFor = (question: number): Clue['kind'] => (question % 3 === 0 ? 'feeling' : 'part');

export interface ClueDeal {
  animals: Animal[];
  clue: Clue;
  /** The one animal the clue describes, which she taps. */
  answer: Animal;
}

/**
 * One clue question: a deal of different animals and a clue that holds for exactly one of them, never answered by the
 * same animal as last time (`last`). A part question whose deal has no unique part is redealt.
 */
export function dealClue(
  rng: Rng,
  spots: number,
  kind: Clue['kind'],
  last: Animal | null,
  pool: readonly Animal[],
): ClueDeal {
  for (let tries = 0; tries < 200; tries++) {
    const animals = deal(rng, spots, pool);
    const choices = animals.filter((a) => a !== last);
    if (kind === 'feeling') {
      const answer = rng.pick(choices);
      return { animals, answer, clue: { kind, feeling: rng.pick(CLUE_FEELINGS) } };
    }
    const parts = uniqueParts(animals).filter((p) => choices.some((a) => hasPart(a, p)));
    if (!parts.length) continue;
    const part = rng.pick(parts);
    return { animals, answer: animals.find((a) => hasPart(a, part))!, clue: { kind, part } };
  }
  // Unreachable in practice (most deals have a unique part); a feeling clue is always answerable.
  const animals = deal(rng, spots, pool);
  const answer = animals.find((a) => a !== last) ?? animals[0];
  return { animals, answer, clue: { kind: 'feeling', feeling: 'sleepy' } };
}

/** Something true a wrong animal has, to say back to her: its first part in `PARTS` order. */
export const factAbout = (animal: Animal): Part => PART_IDS.find((p) => hasPart(animal, p))!;

/**
 * Levels 10–11 (Whose ears?): what shows of an animal over its cover in the `top` pose. The head's colour and whatever
 * stands up from it (ears and their colour, horns, a tuft, a mane, a comb, a curl of wool); the face stays hidden.
 */
export function topOf(animal: Animal): string {
  const s = CRITTERS[animal] as CritterSpec;
  return [
    s.color,
    s.ears ?? 'no ears',
    s.earColor ?? s.color,
    s.horns && 'horns',
    s.tuft && 'tuft',
    s.mane && 'mane',
    s.comb && 'comb',
    s.wool && 'wool',
  ]
    .filter(Boolean)
    .join(' ');
}

/** True when no two of these animals look the same from the top, so the one asked for can be told by its top alone. */
export const topsDiffer = (animals: readonly Animal[]) => new Set(animals.map(topOf)).size === animals.length;

/** A `top` round's deal: different animals whose tops all differ (redealt otherwise, should a lookalike join the pool). */
export function dealTops(rng: Rng, spots: number, pool: readonly Animal[]): Animal[] {
  for (let tries = 0; tries < 200; tries++) {
    const animals = deal(rng, spots, pool);
    if (topsDiffer(animals)) return animals;
  }
  // Unreachable with today's animals, whose tops all differ.
  return deal(rng, spots, pool);
}

/** Switcheroo: never more swaps than this, and never faster than this (seconds per swap; the dive's floor is 0.9). */
export const MAX_SWAPS = 3;
export const SWAP_SECONDS = 1.1;
/** The hint replays the swaps slower still. */
export const SLOW_SWAP_SECONDS = 1.6;

/** Two houses (place indices, left to right) that trade places. */
export type Swap = readonly [number, number];

/** Who stands where after the swaps: `order[i]` is what was in place i, moved with its house. */
export function applySwaps<T>(order: readonly T[], swaps: readonly Swap[]): T[] {
  const out = [...order];
  for (const [a, b] of swaps) [out[a], out[b]] = [out[b], out[a]];
  return out;
}

export interface SwapDeal {
  swaps: Swap[];
  /** The animal asked for: its house ends somewhere other than where it started. */
  answer: Animal;
  /** The place its house ends in. */
  finalIndex: number;
}

/**
 * One Switcheroo question over `animals` (left to right): `count` swaps of two different houses, never the same pair
 * twice running (which would undo itself and look broken), and an answer whose house ends somewhere new, never the last
 * question's answer when another will do. Redealt until such an answer exists.
 */
export function dealSwaps(
  rng: Rng,
  animals: readonly Animal[],
  count: number,
  last: Animal | null,
): SwapDeal {
  const n = animals.length;
  const swaps = Math.min(MAX_SWAPS, Math.max(1, count));
  for (let tries = 0; tries < 200; tries++) {
    const list: Swap[] = [];
    while (list.length < swaps) {
      const a = rng.int(0, n - 1);
      let b = rng.int(0, n - 2);
      if (b >= a) b++;
      const pair: Swap = a < b ? [a, b] : [b, a];
      const prev = list[list.length - 1];
      if (prev && prev[0] === pair[0] && prev[1] === pair[1]) continue;
      list.push(pair);
    }
    const after = applySwaps(animals, list);
    const moved = animals.filter((a, i) => after[i] !== a);
    const fresh = moved.filter((a) => a !== last);
    const pool = fresh.length ? fresh : moved;
    if (!pool.length) continue;
    const answer = rng.pick(pool);
    return { swaps: list, answer, finalIndex: after.indexOf(answer) };
  }
  // Unreachable: any single swap moves two animals.
  const list: Swap[] = [[0, 1]];
  return { swaps: list, answer: animals[0], finalIndex: 1 };
}
