import type { Rng } from '../../engine/random';

/**
 * Photo Safari, after Pokémon Snap: animals around the island are busy doing things in
 * different places. Tap one to take its photo. Requests grow from naming the animal to
 * what it's doing ("jumping") and where it is ("under the tree"), for verbs and positions.
 */
export type SafariMode = 'snap' | 'who' | 'doing' | 'where' | 'both' | 'not' | 'clues' | 'tell';
export type Animal = 'cat' | 'dog' | 'bunny' | 'pig' | 'duck' | 'bear';
export type Action = 'jumping' | 'sleeping' | 'eating' | 'dancing' | 'waving' | 'swimming';
export type Spot = 'tree' | 'bush' | 'rock' | 'pond';

export interface SafariPlan {
  mode: SafariMode;
  tell?: 'which' | 'both';
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

export const TELL_WHICH_LEVEL = 10;
export const TELL_BOTH_LEVEL = 11;
export const TELL_WHICH_PLAN: SafariPlan = { mode: 'tell', tell: 'which', photos: 4, animals: 3, name: 'Tell me which: tap the one picture word only the sparkly animal has, then Tell' };
export const TELL_BOTH_PLAN: SafariPlan = { mode: 'tell', tell: 'both', photos: 4, animals: 4, name: 'Tell me both: every picture word fits two, so tell a doing word and a place word together' };
const PLANS_BY_ID: Record<number, SafariPlan> = { ...Object.fromEntries(PLANS.map((p, i) => [i + 1, p])), 10: TELL_WHICH_PLAN, 11: TELL_BOTH_PLAN };
export const planFor = (level: number) => PLANS_BY_ID[level] ?? PLANS[Math.min(PLANS.length, Math.max(1, level)) - 1];

export const ANIMALS: Animal[] = ['cat', 'dog', 'bunny', 'pig', 'duck', 'bear'];
export const ACTIONS: Action[] = ['jumping', 'sleeping', 'eating', 'dancing', 'waving', 'swimming'];
/** A swimming animal must have water; other actions work at every spot. */
export const actionsAt = (spot: Spot): Action[] => ACTIONS.filter((a) => a !== 'swimming' || spot === 'pond');
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
    // Each action must occur at two distinct places, so pond-only swimming cannot be a clue.
    const [action, otherAction] = rng.shuffle(actionsAt('tree'));
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
  if (plan.mode === 'clues' || plan.mode === 'tell') {
    const [spot, otherSpot] = rng.shuffle([...SPOTS]);
    // Each action must occur at two distinct places, so pond-only swimming cannot be a clue.
    const [action, otherAction] = rng.shuffle(actionsAt('tree'));
    const animals = rng.shuffle([...ANIMALS]);
    // Neither clue suffices: one action-only, one place-only and one neither witness.
    const sightings: Sighting[] = [
      { animal: animals[0], action, spot },
      { animal: animals[1], action: otherAction, spot },
      { animal: animals[2], action, spot: otherSpot },
      { animal: animals[3], action: otherAction, spot: otherSpot },
    ];
    if (plan.tell === 'which') sightings.splice(rng.chance(0.5) ? 1 : 2, 1);
    const order = rng.shuffle(sightings.map((_, i) => i));
    return { sightings: order.map((i) => sightings[i]), target: order.indexOf(0) };
  }
  for (let tries = 0; tries < 200; tries++) {
    const spots = rng.shuffle([...SPOTS]).slice(0, plan.animals);
    const target: Sighting = { animal: rng.pick(ANIMALS), action: rng.pick(actionsAt(spots[0])), spot: spots[0] };
    const sightings: Sighting[] = [target];
    for (const spot of spots.slice(1)) {
      let s: Sighting;
      switch (plan.mode) {
        case 'doing':
          s = { animal: rng.chance(0.7) ? target.animal : rng.pick(ANIMALS), action: rng.pick(actionsAt(spot).filter((a) => a !== target.action)), spot };
          break;
        case 'where':
          s = { animal: target.animal, action: rng.pick(actionsAt(spot)), spot };
          break;
        case 'not':
          // Everyone else is doing the same thing; only the target is doing something different.
          // Distractors share an action across distinct spots, including dry land.
          s = { animal: rng.pick(ANIMALS), action: rng.pick(actionsAt('tree').filter((a) => a !== target.action)), spot };
          if (sightings.length > 1) s.action = sightings[1].action;
          break;
        default:
          s = { animal: rng.pick(ANIMALS.filter((a) => !sightings.some((x) => x.animal === a))), action: rng.pick(actionsAt(spot)), spot };
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
export function spotPosition(spot: Spot, sightings: Sighting[], w: number, h: number, ground = h * 0.78): SafariPoint {
  const shared = new Set(sightings.map((s) => s.spot)).size < sightings.length;
  const occupied = SPOTS.filter((s) => sightings.some((a) => a.spot === s));
  const x = shared ? (occupied.indexOf(spot) === 0 ? 0.3 : 0.76) : SPOT_X[spot];
  return { x: w * x, y: ground + (spot === 'rock' ? -56 : spot === 'pond' ? 26 : 0) };
}

export function sightingPositions(sightings: Sighting[], w: number, h: number, ground = h * 0.78): SafariPoint[] {
  return sightings.map((s, i) => {
    const at = spotPosition(s.spot, sightings, w, h, ground);
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

/** Descriptions contain at most one doing word and one place word. */
export type Chip = { kind: 'action'; value: Action } | { kind: 'spot'; value: Spot };
export const sameChip = (a: Chip, b: Chip): boolean => a.kind === b.kind && a.value === b.value;
export function chipsFor(scene: Scene, rng: Rng): Chip[] {
  return rng.shuffle([
    ...[...new Set(scene.sightings.map((s) => s.action))].map((value): Chip => ({ kind: 'action', value })),
    ...[...new Set(scene.sightings.map((s) => s.spot))].map((value): Chip => ({ kind: 'spot', value })),
  ]);
}
export function fits(chips: Chip[], sightings: Sighting[]): number[] {
  return sightings.flatMap((s, i) => chips.every((c) => s[c.kind] === c.value) ? [i] : []);
}
export function toggleChip(chosen: Chip[], chip: Chip): Chip[] {
  const rest = chosen.filter((c) => c.kind !== chip.kind);
  return chosen.some((c) => sameChip(c, chip)) ? rest : [...rest, chip];
}
export type TellResult = 'empty' | 'right' | 'too-little' | 'other' | 'other-many' | 'nobody';
export function judgeTell(chips: Chip[], scene: Scene): { result: TellResult; fits: number[] } {
  const found = fits(chips, scene.sightings);
  const result: TellResult = !chips.length ? 'empty' : !found.length ? 'nobody' : found.includes(scene.target)
    ? found.length === 1 ? 'right' : 'too-little' : found.length === 1 ? 'other' : 'other-many';
  return { result, fits: found };
}
export function fewestChips(scene: Scene): Chip[] {
  const t = scene.sightings[scene.target];
  const both: Chip[] = [{ kind: 'action', value: t.action }, { kind: 'spot', value: t.spot }];
  return both.find((c) => fits([c], scene.sightings).length === 1) ? [both.find((c) => fits([c], scene.sightings).length === 1)!] : both;
}
/** Remove contradictions before offering solver chips, so accepting help always works. */
export function tellHint(chosen: Chip[], scene: Scene): { chosen: Chip[]; glow: Chip[] } {
  const kept = chosen.filter((c) => fits([c], scene.sightings).includes(scene.target));
  return { chosen: kept, glow: fewestChips(scene).filter((c) => !kept.some((k) => sameChip(k, c))) };
}
export function chipPhrase(chips: Chip[]): string {
  const action = chips.find((c) => c.kind === 'action');
  const spot = chips.find((c) => c.kind === 'spot');
  return [action?.value, spot?.kind === 'spot' ? PLACE_WORDS[spot.value] : undefined].filter(Boolean).join(' ');
}
