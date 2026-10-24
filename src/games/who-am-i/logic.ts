import type { Rng } from '../../engine/random';
import type { View } from '../../engine/view';
import type { BandLevels } from '../../progress/difficulty';

/**
 * Who Am I?: a row of friends on the barn's stage, one clue at a time, and she turns over every friend a clue rules out
 * until one is left (levels 2–3), or taps the one friend a single clue fits (level 1). The trait table below was checked
 * against museum, university and government sources on 2026-10-24 (docs/definitions/who-am-i.md, decision 1).
 */

export type Group = 'mammal' | 'bird' | 'amphibian' | 'reptile' | 'fish';
export type Family = 'covering' | 'parts' | 'babies' | 'moving' | 'breathing';
export type Feature =
  | 'feathers' | 'fur' | 'shell' | 'scales' | 'smooth-skin'
  | 'wings' | 'beak' | 'fins' | 'four-legs' | 'two-legs'
  | 'eggs' | 'milk' | 'fly' | 'gills';
export type FriendId = 'cow' | 'pig' | 'cat' | 'bear' | 'dog' | 'bunny' | 'duck' | 'owl' | 'penguin' | 'frog' | 'turtle' | 'fish';

export interface FeatureInfo {
  family: Family;
  /** What a friend with it does, after its name: "has feathers", "lays eggs". */
  has: string;
  /** What a friend without it does, after its name: "has no wings", "can't fly". */
  lacks: string;
  /** The clue in a "not" reason: "Cow has fur, not feathers"; "Duck has two legs, not four". */
  noun: string;
}

export const FEATURES: Record<Feature, FeatureInfo> = {
  feathers: { family: 'covering', has: 'has feathers', lacks: 'has no feathers', noun: 'feathers' },
  fur: { family: 'covering', has: 'has fur', lacks: 'has no fur', noun: 'fur' },
  shell: { family: 'covering', has: 'has a hard shell', lacks: 'has no shell', noun: 'a shell' },
  scales: { family: 'covering', has: 'has scales', lacks: 'has no scales', noun: 'scales' },
  'smooth-skin': { family: 'covering', has: 'has smooth, wet skin', lacks: 'has no smooth, wet skin', noun: 'smooth, wet skin' },
  wings: { family: 'parts', has: 'has wings', lacks: 'has no wings', noun: 'wings' },
  beak: { family: 'parts', has: 'has a beak', lacks: 'has no beak', noun: 'a beak' },
  fins: { family: 'parts', has: 'has fins', lacks: 'has no fins', noun: 'fins' },
  'four-legs': { family: 'parts', has: 'has four legs', lacks: 'has no legs', noun: 'four' },
  'two-legs': { family: 'parts', has: 'has two legs', lacks: 'has no legs', noun: 'two' },
  eggs: { family: 'babies', has: 'lays eggs', lacks: "doesn't lay eggs", noun: 'eggs' },
  milk: { family: 'babies', has: 'feeds its babies milk', lacks: "doesn't feed its babies milk", noun: 'milk' },
  fly: { family: 'moving', has: 'can fly', lacks: "can't fly", noun: 'flying' },
  gills: { family: 'breathing', has: 'breathes under water with gills', lacks: 'has no gills', noun: 'gills' },
};

export const FEATURE_IDS = Object.keys(FEATURES) as Feature[];

export interface Friend {
  id: FriendId;
  /** Spoken, never shown as text to read. */
  name: string;
  group: Group;
  features: readonly Feature[];
}

const MAMMAL: Feature[] = ['fur', 'four-legs', 'milk'];
const BIRD: Feature[] = ['feathers', 'wings', 'beak', 'two-legs', 'eggs', 'fly'];

export const FRIENDS: Record<FriendId, Friend> = {
  cow: { id: 'cow', name: 'Cow', group: 'mammal', features: MAMMAL },
  pig: { id: 'pig', name: 'Pig', group: 'mammal', features: MAMMAL },
  cat: { id: 'cat', name: 'Cat', group: 'mammal', features: MAMMAL },
  bear: { id: 'bear', name: 'Bear', group: 'mammal', features: MAMMAL },
  dog: { id: 'dog', name: 'Dog', group: 'mammal', features: MAMMAL },
  bunny: { id: 'bunny', name: 'Bunny', group: 'mammal', features: MAMMAL },
  duck: { id: 'duck', name: 'Duck', group: 'bird', features: BIRD },
  owl: { id: 'owl', name: 'Owl', group: 'bird', features: BIRD },
  penguin: { id: 'penguin', name: 'Penguin', group: 'bird', features: ['feathers', 'wings', 'beak', 'two-legs', 'eggs'] },
  frog: { id: 'frog', name: 'Frog', group: 'amphibian', features: ['smooth-skin', 'four-legs', 'eggs'] },
  turtle: { id: 'turtle', name: 'Turtle', group: 'reptile', features: ['shell', 'four-legs', 'eggs'] },
  fish: { id: 'fish', name: 'Fish', group: 'fish', features: ['scales', 'fins', 'eggs', 'gills'] },
};

export const FRIEND_IDS = Object.keys(FRIENDS) as FriendId[];

export const keeps = (clue: Feature, friend: FriendId) => FRIENDS[friend].features.includes(clue);

/** The friends in `remaining` the clue is false of. */
export const ruledOut = (remaining: readonly FriendId[], clue: Feature) => remaining.filter((f) => !keeps(clue, f));

/** The pig's coat is bristly hair (its clue says "fur or hair"), so its own reason says hair. */
export function hasText(friend: FriendId, feature: Feature): string {
  if (friend === 'pig' && feature === 'fur') return 'has bristly hair';
  return FEATURES[feature].has;
}

/** The spoken line for tapping a friend a clue does not fit, from the clue's family; `kind` picks the voice template. */
export type Reason =
  | { kind: 'not'; name: string; has: string; clue: string }
  | { kind: 'no'; name: string; lacks: string }
  | { kind: 'instead'; name: string; lacks: string; has: string };

const ownIn = (friend: FriendId, family: Family) => FRIENDS[friend].features.find((f) => FEATURES[f].family === family);

export function reason(friend: FriendId, clue: Feature): Reason {
  const name = FRIENDS[friend].name;
  const family = FEATURES[clue].family;
  if (family === 'covering') {
    const own = ownIn(friend, 'covering')!;
    return { kind: 'not', name, has: hasText(friend, own), clue: FEATURES[clue].noun };
  }
  if (family === 'babies') {
    const own = ownIn(friend, 'babies')!;
    return { kind: 'instead', name, lacks: FEATURES[clue].lacks, has: hasText(friend, own) };
  }
  if (clue === 'four-legs' || clue === 'two-legs') {
    const other: Feature = clue === 'four-legs' ? 'two-legs' : 'four-legs';
    if (keeps(other, friend)) return { kind: 'not', name, has: FEATURES[other].has, clue: FEATURES[clue].noun };
    return { kind: 'no', name, lacks: 'has no legs' };
  }
  return { kind: 'no', name, lacks: FEATURES[clue].lacks };
}

/** The spoken line for tapping a friend a clue keeps: "Duck has feathers, so Duck stays!" */
export const staysText = (friend: FriendId, clue: Feature) => ({ name: FRIENDS[friend].name, has: hasText(friend, clue) });

// Levels ---------------------------------------------------------------------------------------------------------------

const BASIC: Feature[] = ['feathers', 'fur', 'shell', 'fins', 'smooth-skin', 'wings', 'beak', 'four-legs', 'two-legs'];
const GROUPS: Feature[] = [...BASIC, 'scales', 'eggs', 'milk', 'gills'];
/** Families whose features define the groups; level 3 asks for at least two such clues. */
export const DEFINING: readonly Family[] = ['covering', 'babies', 'breathing'];

export interface WhoPlan {
  level: number;
  name: string;
  /** 'fit': tap the one friend the clue fits. 'turn': turn over the friends each clue rules out. */
  mode: 'fit' | 'turn';
  friends: number;
  clues: number;
  allowed: readonly Feature[];
  /** At least this many groups among the gallery. */
  minGroups: number;
  /** At least this many clues from the defining families. */
  minDefining: number;
  /**
   * Who can be the answer. Only friends a round of exactly `clues` useful clues can end on: with the allowed features a bird or
   * the fish is picked out by its first clue at level 2, and only the frog and the turtle take three steps at level 3.
   */
  answers: readonly FriendId[];
}

const MAMMALS: FriendId[] = ['cow', 'pig', 'cat', 'bear', 'dog', 'bunny'];

export const PLANS: readonly WhoPlan[] = [
  { level: 1, name: 'One clue: tap the friend it fits, 3 friends', mode: 'fit', friends: 3, clues: 1, allowed: BASIC, minGroups: 1, minDefining: 0, answers: FRIEND_IDS },
  { level: 2, name: 'Turn them over: 2 clues, 4 friends', mode: 'turn', friends: 4, clues: 2, allowed: BASIC, minGroups: 1, minDefining: 0, answers: [...MAMMALS, 'frog', 'turtle'] },
  { level: 3, name: 'Groups by features: 3 clues, 6 friends', mode: 'turn', friends: 6, clues: 3, allowed: GROUPS, minGroups: 4, minDefining: 2, answers: ['frog', 'turtle'] },
];

export const LEVELS: BandLevels = { prek: { min: 1, max: 2 }, school: { min: 2, max: 3 } };

export const planFor = (level: number): WhoPlan => PLANS[Math.min(PLANS.length, Math.max(1, Math.round(level))) - 1];

export interface WhoRound {
  gallery: FriendId[];
  answer: FriendId;
  clues: Feature[];
}

/** The answer's allowed features are not all shared by any other friend in the gallery. */
export function distinguishable(answer: FriendId, gallery: readonly FriendId[], allowed: readonly Feature[]): boolean {
  const own = FRIENDS[answer].features.filter((f) => allowed.includes(f));
  return gallery.every((g) => g === answer || own.some((f) => !keeps(f, g)));
}

/** A useful clue keeps the answer and rules out at least one friend still standing. */
export const useful = (clue: Feature, answer: FriendId, remaining: readonly FriendId[]) =>
  keeps(clue, answer) && ruledOut(remaining, clue).length > 0;

/** A clue list of exactly `n` useful clues that leaves only the answer, tried in a random order; null if there is none. */
function cluesFor(plan: WhoPlan, answer: FriendId, gallery: readonly FriendId[], rng: Rng): Feature[] | null {
  const search = (remaining: readonly FriendId[], chosen: Feature[]): Feature[] | null => {
    const options = rng.shuffle(plan.allowed.filter((c) => useful(c, answer, remaining)));
    for (const c of options) {
      const left = remaining.filter((f) => keeps(c, f));
      const list = [...chosen, c];
      if (list.length === plan.clues) {
        if (left.length === 1 && list.filter((x) => DEFINING.includes(FEATURES[x].family)).length >= plan.minDefining) return list;
      } else if (left.length > 1) {
        const found = search(left, list);
        if (found) return found;
      }
    }
    return null;
  };
  return search(gallery, []);
}

const groupCount = (gallery: readonly FriendId[]) => new Set(gallery.map((g) => FRIENDS[g].group)).size;

/** A seeded round for the level: the same seed gives the same round. Bounded; the rule tests prove it never runs out. */
export function makeRound(level: number, rng: Rng): WhoRound {
  const plan = planFor(level);
  for (let attempt = 0; attempt < 400; attempt++) {
    const answer = rng.pick(plan.answers);
    if (plan.mode === 'fit') {
      // One clue the answer has, and two friends without it.
      const clue = rng.pick(plan.allowed.filter((c) => keeps(c, answer)));
      const others = rng.shuffle(FRIEND_IDS.filter((f) => !keeps(clue, f))).slice(0, plan.friends - 1);
      if (others.length < plan.friends - 1) continue;
      return { gallery: rng.shuffle([answer, ...others]), answer, clues: [clue] };
    }
    const others = rng.shuffle(FRIEND_IDS.filter((f) => f !== answer && distinguishable(answer, [answer, f], plan.allowed))).slice(0, plan.friends - 1);
    const gallery = rng.shuffle([answer, ...others]);
    if (groupCount(gallery) < plan.minGroups) continue;
    const clues = cluesFor(plan, answer, gallery, rng);
    if (clues) return { gallery, answer, clues };
  }
  throw new Error(`who-am-i: no round for level ${level}`);
}

// Play: what a tap does, kept here so the accounting and help can be tested without Pixi ---------------------------------

export interface WhoPlay {
  round: WhoRound;
  mode: WhoPlan['mode'];
  /** Gallery indices turned face down. */
  down: Set<number>;
  /** Which clue is showing. */
  clue: number;
  misses: number;
  hints: number;
  /** Misses on the clue showing (levels 2–3) or in the round (level 1). */
  wrongHere: number;
  /** Help has been counted for this clue (levels 2–3) or this round (level 1). */
  helped: boolean;
  done: boolean;
}

export const startPlay = (round: WhoRound, mode: WhoPlan['mode']): WhoPlay =>
  ({ round, mode, down: new Set(), clue: 0, misses: 0, hints: 0, wrongHere: 0, helped: false, done: false });

/** The friends still face up. */
export const standing = (p: WhoPlay) => p.round.gallery.filter((_, i) => !p.down.has(i));

/** Gallery indices of the friends the help points at: the answer at level 1, every face-up friend the clue rules out after. */
export function helpTargets(p: WhoPlay): number[] {
  if (p.mode === 'fit') return [p.round.gallery.indexOf(p.round.answer)];
  const clue = p.round.clues[p.clue];
  return p.round.gallery.map((_, i) => i).filter((i) => !p.down.has(i) && !keeps(clue, p.round.gallery[i]));
}

export type TapOutcome =
  /** A tap after the round, or on nothing that counts. */
  | { kind: 'ignored' }
  /** A face-down friend: a free look. */
  | { kind: 'peek' }
  /** The clue does not fit (level 1) or keeps this friend (levels 2–3). `helped` is true when this miss turned the help on. */
  | { kind: 'miss'; reason: Reason | null; stays: { name: string; has: string } | null; helped: boolean }
  /** A ruled-out friend turned over; `next` when that finished the clue and another arrives, `done` when one friend is left. */
  | { kind: 'flip'; next: boolean; done: boolean }
  /** Level 1: the right friend. */
  | { kind: 'fit' };

/** Applies one tap on gallery index `i`, changing `p`. */
export function tap(p: WhoPlay, i: number): TapOutcome {
  if (p.done || i < 0 || i >= p.round.gallery.length) return { kind: 'ignored' };
  if (p.down.has(i)) return { kind: 'peek' };
  const friend = p.round.gallery[i];
  const clue = p.round.clues[p.clue];
  const miss = (r: Reason | null, stays: { name: string; has: string } | null): TapOutcome => {
    p.misses++; p.wrongHere++;
    let helped = false;
    if (p.wrongHere >= 2 && !p.helped) { p.helped = true; p.hints++; helped = true; }
    return { kind: 'miss', reason: r, stays, helped };
  };
  if (p.mode === 'fit') {
    if (friend === p.round.answer) { p.done = true; return { kind: 'fit' }; }
    return miss(reason(friend, clue), null);
  }
  if (keeps(clue, friend)) return miss(null, staysText(friend, clue));
  p.down.add(i);
  if (helpTargets(p).length > 0) return { kind: 'flip', next: false, done: false };
  if (p.clue === p.round.clues.length - 1) { p.done = true; return { kind: 'flip', next: false, done: true }; }
  p.clue++; p.wrongHere = 0; p.helped = false;
  return { kind: 'flip', next: true, done: false };
}

/** The pause sheet's Show a hint: counted once per round (level 1) or per clue (levels 2–3); true when this request counted. */
export function requestHelp(p: WhoPlay): boolean {
  if (p.done || p.helped) return false;
  p.helped = true; p.hints++;
  return true;
}

/** What the ghost finger taps next: the right friend at level 1 (after one deliberate wrong tap), else the leftmost friend the clue rules out. */
export function botTap(p: WhoPlay, showedMiss: boolean): number | null {
  if (p.done) return null;
  if (p.mode === 'fit') {
    const wrong = p.round.gallery.findIndex((f) => f !== p.round.answer);
    return !showedMiss && wrong >= 0 ? wrong : p.round.gallery.indexOf(p.round.answer);
  }
  return helpTargets(p)[0] ?? null;
}

// Layout ---------------------------------------------------------------------------------------------------------------

export interface Rect { x: number; y: number; w: number; h: number }

export interface GalleryLayout {
  sign: Rect;
  /** Where the next clues-so-far thumbnail goes, one per earlier clue (90 units square). */
  strip: Rect[];
  cards: Rect[];
}

/** The pet's corner and the home button: nothing here may sit inside them. */
export const PET_CORNER = 150;
export const HOME_CORNER = 130;
export const THUMB = 90;

/**
 * Every rectangle on the stage for `n` friend cards. Three or four cards stand in one row; five or six in two rows of three.
 * In landscape the clues so far sit down the right edge; in portrait, in a row under the sign.
 */
export function galleryLayout(v: View, n: number): GalleryLayout {
  const portrait = v.h > v.w;
  const sign: Rect = { x: v.w / 2 - 160, y: 24, w: 320, h: 130 };
  const strip: Rect[] = [];
  for (let k = 0; k < 2; k++) {
    strip.push(portrait
      ? { x: v.w / 2 - THUMB - 8 + k * (THUMB + 16), y: sign.y + sign.h + 16, w: THUMB, h: THUMB }
      : { x: v.w - THUMB - 16, y: sign.y + sign.h + 20 + k * (THUMB + 14), w: THUMB, h: THUMB });
  }
  const rows = n <= 4 ? 1 : 2;
  const cols = Math.ceil(n / rows);
  const left = PET_CORNER + 20, right = portrait ? v.w - 30 : v.w - THUMB - 36;
  const top = portrait ? strip[0].y + THUMB + 30 : sign.y + sign.h + 30;
  const bottom = portrait ? Math.min(v.h - PET_CORNER - 20, top + rows * 300) : v.h - 30;
  const gap = 16;
  const w = Math.min(n <= 4 ? 200 : 170, (right - left - gap * (cols - 1)) / cols);
  const h = Math.min(n <= 4 ? 240 : 210, (bottom - top - gap * (rows - 1)) / rows);
  const rowW = cols * w + (cols - 1) * gap;
  const x0 = Math.max(left, (left + right) / 2 - rowW / 2);
  const y0 = top + Math.max(0, (bottom - top - (rows * h + (rows - 1) * gap)) / 2);
  const cards: Rect[] = [];
  for (let i = 0; i < n; i++) {
    const r = Math.floor(i / cols), c = i % cols;
    cards.push({ x: x0 + c * (w + gap), y: y0 + r * (h + gap), w, h });
  }
  return { sign, strip, cards };
}
