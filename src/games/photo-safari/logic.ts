import type { Rng } from '../../engine/random';

/**
 * Photo Safari, after Pokémon Snap: animals around the island are busy doing things in
 * different places. Tap one to take its photo. Requests grow from naming the animal to
 * what it's doing ("jumping") and where it is ("under the tree"), for verbs and positions.
 */
export type SafariMode = 'snap' | 'who' | 'doing' | 'where' | 'both' | 'not' | 'clues';
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
  { mode: 'not', photos: 4, animals: 3, name: 'Not: "the animal that is not sleeping"' },
  { mode: 'clues', photos: 4, animals: 4, name: 'Two clues, no name: combine what an animal is doing and where it is' },
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
  /** 'not' levels: what every other animal is doing. */
  notAction?: Action;
}

/** What a request talks about at each level. */
const keys = (mode: SafariMode): (keyof Sighting)[] => (mode === 'clues' ? ['action', 'spot'] : mode === 'who' ? ['animal'] : mode === 'not' ? ['action'] : mode === 'doing' ? ['animal', 'action'] : mode === 'where' ? ['animal', 'spot'] : mode === 'both' ? ['animal', 'action', 'spot'] : []);

/** Does a sighting match the target on everything the request mentions? */
export function matches(mode: SafariMode, s: Sighting, target: Sighting): boolean {
  return keys(mode).every((k) => s[k] === target[k]);
}

/**
 * One scene with exactly one match. Both-clue modes share places so that neither
 * the action nor the place alone identifies the target; other modes use distinct spots.
 */
export function makeScene(plan: SafariPlan, rng: Rng): Scene {
  if (plan.mode === 'both') {
    const [spot, otherSpot] = rng.shuffle([...SPOTS]);
    const [action, otherAction] = rng.shuffle([...ACTIONS]);
    const animal = rng.pick(ANIMALS);
    // Name alone and either name + action or name + place leave multiple matches.
    const sightings: Sighting[] = [
      { animal, action, spot },
      { animal, action: otherAction, spot },
      { animal, action, spot: otherSpot },
    ];
    const order = rng.shuffle([0, 1, 2]);
    return { sightings: order.map((i) => sightings[i]), target: order.indexOf(0) };
  }
  if (plan.mode === 'clues') {
    const [spot, otherSpot] = rng.shuffle([...SPOTS]);
    const [action, otherAction] = rng.shuffle([...ACTIONS]);
    const animals = rng.shuffle([...ANIMALS]);
    // Neither clue suffices: one action-only, one place-only and one neither witness.
    const sightings: Sighting[] = [
      { animal: animals[0], action, spot },
      { animal: animals[1], action: otherAction, spot },
      { animal: animals[2], action, spot: otherSpot },
      { animal: animals[3], action: otherAction, spot: otherSpot },
    ];
    const order = rng.shuffle([0, 1, 2, 3]);
    return { sightings: order.map((i) => sightings[i]), target: order.indexOf(0) };
  }
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
        case 'not':
          // Everyone else is doing the same thing; only the target is doing something different.
          s = { animal: rng.pick(ANIMALS), action: rng.pick(ACTIONS.filter((a) => a !== target.action)), spot };
          if (sightings.length > 1) s.action = sightings[1].action;
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
    if (shuffled.filter((s) => matches(plan.mode, s, shuffled[t])).length === 1) {
      return { sightings: shuffled, target: t, notAction: plan.mode === 'not' ? sightings[1].action : undefined };
    }
  }
  throw new Error('No scene');
}

/** "the bunny jumping behind the bush", for the voice. */
export function describe(mode: SafariMode, s: Sighting): string {
  const parts = [mode === 'clues' ? 'the animal' : `the ${s.animal}`];
  if (mode === 'clues' || mode === 'doing' || mode === 'both' || mode === 'snap' || mode === 'not') parts.push(s.action);
  if (mode === 'clues' || mode === 'where' || mode === 'both') parts.push(PLACE_WORDS[s.spot]);
  return parts.join(' ');
}

/** What the voice asks for: the target's description, or on 'not' levels the thing it isn't doing. */
export function request(mode: SafariMode, scene: Scene): string {
  if (mode === 'not') return `the animal that is not ${scene.notAction}`;
  return describe(mode, scene.sightings[scene.target]);
}

/** Which animal a capable child photographs next: the one asked for, or in free snapping each in turn. Always a right one. */
export const animalToTap = (scene: Scene, photos: number): number => (scene.target >= 0 ? scene.target : photos % scene.sightings.length);

export interface SafariPoint { x: number; y: number }
const SPOT_X: Record<Spot, number> = { tree: 0.24, bush: 0.45, rock: 0.66, pond: 0.86 };

/** Shared places get two broad, separated stages; the earlier single-place layout stays intact. */
export function spotPosition(spot: Spot, sightings: Sighting[], w: number, h: number): SafariPoint {
  const shared = new Set(sightings.map((s) => s.spot)).size < sightings.length;
  const occupied = SPOTS.filter((s) => sightings.some((a) => a.spot === s));
  const x = shared ? (occupied.indexOf(spot) === 0 ? 0.3 : 0.76) : SPOT_X[spot];
  return { x: w * x, y: h * 0.78 + (spot === 'rock' ? -56 : spot === 'pond' ? 26 : 0) };
}

export function sightingPositions(sightings: Sighting[], w: number, h: number): SafariPoint[] {
  return sightings.map((s, i) => {
    const at = spotPosition(s.spot, sightings, w, h);
    const peers = sightings.flatMap((other, j) => other.spot === s.spot ? [j] : []);
    return { x: at.x + (peers.length > 1 ? (peers.indexOf(i) === 0 ? -80 : 80) : 0), y: at.y };
  });
}

/** Nearest body centre wins overlapping forgiving circles, independently of draw order. */
export function nearestSighting(positions: SafariPoint[], point: SafariPoint): number {
  let nearest = -1;
  let distance = 95;
  positions.forEach((p, i) => {
    const d = Math.hypot(p.x - point.x, p.y - 60 - point.y);
    if (d < distance) { nearest = i; distance = d; }
  });
  return nearest;
}
