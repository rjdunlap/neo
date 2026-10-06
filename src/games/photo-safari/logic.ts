import type { Rng } from '../../engine/random';

/**
 * Photo Safari, after Pokémon Snap: animals around the island are busy doing things in
 * different places. Tap one to take its photo. Requests grow from naming the animal to
 * what it's doing ("jumping") and where it is ("under the tree"), for verbs and positions.
 */
export type SafariMode = 'snap' | 'who' | 'doing' | 'where' | 'both';
export type Animal = 'cat' | 'dog' | 'bunny' | 'pig' | 'duck' | 'bear';
export type Action = 'jumping' | 'sleeping' | 'eating' | 'dancing';
export type Spot = 'tree' | 'bush' | 'rock' | 'pond';

export interface SafariPlan {
  mode: SafariMode;
  photos: number;
  /** Animals on screen per request. */
  animals: number;
  name: string;
}

export const PLANS: SafariPlan[] = [
  { mode: 'snap', photos: 6, animals: 3, name: 'Tap any animal to take its photo' },
  { mode: 'who', photos: 4, animals: 3, name: 'Photograph the animal named: "the pig"' },
  { mode: 'doing', photos: 4, animals: 3, name: 'Action words: "the bunny jumping"' },
  { mode: 'where', photos: 4, animals: 3, name: 'Place words: "the duck under the tree"' },
  { mode: 'both', photos: 4, animals: 3, name: 'Both: "the cat sleeping behind the bush"' },
];

export const planFor = (level: number) => PLANS[Math.min(PLANS.length, Math.max(1, level)) - 1];

export const ANIMALS: Animal[] = ['cat', 'dog', 'bunny', 'pig', 'duck', 'bear'];
export const ACTIONS: Action[] = ['jumping', 'sleeping', 'eating', 'dancing'];
export const SPOTS: Spot[] = ['tree', 'bush', 'rock', 'pond'];
export const PLACE_WORDS: Record<Spot, string> = { tree: 'under the tree', bush: 'behind the bush', rock: 'on the rock', pond: 'in the pond' };

export interface Sighting {
  animal: Animal;
  action: Action;
  spot: Spot;
}

export interface Scene {
  sightings: Sighting[];
  /** Which sighting is asked for (-1 for free snapping). */
  target: number;
}

/** What a request talks about at each level. */
const keys = (mode: SafariMode): (keyof Sighting)[] => (mode === 'who' ? ['animal'] : mode === 'doing' ? ['animal', 'action'] : mode === 'where' ? ['animal', 'spot'] : mode === 'both' ? ['animal', 'action', 'spot'] : []);

/** Does a sighting match the target on everything the request mentions? */
export function matches(mode: SafariMode, s: Sighting, target: Sighting): boolean {
  return keys(mode).every((k) => s[k] === target[k]);
}

/**
 * One scene: animals in different spots, exactly one matching the request. Distractors share
 * part of the description (the same animal doing something else, or in another place), so
 * the extra words matter.
 */
export function makeScene(plan: SafariPlan, rng: Rng): Scene {
  for (let tries = 0; tries < 200; tries++) {
    const spots = rng.shuffle([...SPOTS]).slice(0, plan.animals);
    const target: Sighting = { animal: rng.pick(ANIMALS), action: rng.pick(ACTIONS), spot: spots[0] };
    const sightings: Sighting[] = [target];
    for (const spot of spots.slice(1)) {
      let s: Sighting;
      switch (plan.mode) {
        case 'doing':
          s = { animal: rng.chance(0.7) ? target.animal : rng.pick(ANIMALS), action: rng.pick(ACTIONS.filter((a) => a !== target.action)), spot };
          break;
        case 'where':
          s = { animal: target.animal, action: rng.pick(ACTIONS), spot };
          break;
        case 'both':
          s = rng.chance(0.5)
            ? { animal: target.animal, action: target.action, spot }
            : { animal: target.animal, action: rng.pick(ACTIONS.filter((a) => a !== target.action)), spot };
          break;
        default:
          s = { animal: rng.pick(ANIMALS.filter((a) => !sightings.some((x) => x.animal === a))), action: rng.pick(ACTIONS), spot };
      }
      sightings.push(s);
    }
    const order = rng.shuffle(sightings.map((_, i) => i));
    const shuffled = order.map((i) => sightings[i]);
    const t = order.indexOf(0);
    if (plan.mode === 'snap') return { sightings: shuffled, target: -1 };
    if (shuffled.filter((s) => matches(plan.mode, s, shuffled[t])).length === 1) return { sightings: shuffled, target: t };
  }
  throw new Error('No scene');
}

/** "the bunny jumping behind the bush", for the voice. */
export function describe(mode: SafariMode, s: Sighting): string {
  const parts = [`the ${s.animal}`];
  if (mode === 'doing' || mode === 'both' || mode === 'snap') parts.push(s.action);
  if (mode === 'where' || mode === 'both') parts.push(PLACE_WORDS[s.spot]);
  return parts.join(' ');
}
