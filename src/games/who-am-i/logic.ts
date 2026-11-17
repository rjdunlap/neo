import type { Rng } from '../../engine/random';
import type { View } from '../../engine/view';
import type { BandLevels } from '../../progress/difficulty';

/**
 * Who Am I?: a row of friends on the barn's stage, one clue at a time, and she turns over every friend a clue rules out
 * until one is left (levels 2–5), or taps the one friend a single clue fits (level 1). At level 6 she asks the questions:
 * the pet answers yes or no for a secret friend, and she turns over every friend the answer rules out. At level 7 she
 * makes the riddle: she picks a friend and gives true clue cards, and the pet turns the friends over. The trait table
 * below was checked against museum, university and government sources on 2026-10-24, and the "no" answers level 6 gives
 * on 2026-11-17 (docs/definitions/who-am-i.md, decisions 1 and 11).
 */

export type Group = 'mammal' | 'bird' | 'amphibian' | 'reptile' | 'fish';
export type Family = 'covering' | 'parts' | 'babies' | 'moving' | 'breathing';
export type Feature =
  | 'feathers'
  | 'fur'
  | 'shell'
  | 'scales'
  | 'smooth-skin'
  | 'wings'
  | 'beak'
  | 'fins'
  | 'four-legs'
  | 'two-legs'
  | 'eggs'
  | 'milk'
  | 'fly'
  | 'gills';
export type FriendId =
  | 'cow'
  | 'pig'
  | 'cat'
  | 'bear'
  | 'dog'
  | 'bunny'
  | 'duck'
  | 'owl'
  | 'penguin'
  | 'frog'
  | 'turtle'
  | 'fish'
  | 'bat';

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
  'smooth-skin': {
    family: 'covering',
    has: 'has smooth, wet skin',
    lacks: 'has no smooth, wet skin',
    noun: 'smooth, wet skin',
  },
  wings: { family: 'parts', has: 'has wings', lacks: 'has no wings', noun: 'wings' },
  beak: { family: 'parts', has: 'has a beak', lacks: 'has no beak', noun: 'a beak' },
  fins: { family: 'parts', has: 'has fins', lacks: 'has no fins', noun: 'fins' },
  'four-legs': { family: 'parts', has: 'has four legs', lacks: 'has no legs', noun: 'four' },
  'two-legs': { family: 'parts', has: 'has two legs', lacks: 'has no legs', noun: 'two' },
  eggs: { family: 'babies', has: 'lays eggs', lacks: "doesn't lay eggs", noun: 'eggs' },
  milk: {
    family: 'babies',
    has: 'feeds its babies milk',
    lacks: "doesn't feed its babies milk",
    noun: 'milk',
  },
  fly: { family: 'moving', has: 'can fly', lacks: "can't fly", noun: 'flying' },
  gills: {
    family: 'breathing',
    has: 'breathes under water with gills',
    lacks: 'has no gills',
    noun: 'gills',
  },
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
  penguin: {
    id: 'penguin',
    name: 'Penguin',
    group: 'bird',
    features: ['feathers', 'wings', 'beak', 'two-legs', 'eggs'],
  },
  frog: { id: 'frog', name: 'Frog', group: 'amphibian', features: ['smooth-skin', 'four-legs', 'eggs'] },
  turtle: { id: 'turtle', name: 'Turtle', group: 'reptile', features: ['shell', 'four-legs', 'eggs'] },
  fish: { id: 'fish', name: 'Fish', group: 'fish', features: ['scales', 'fins', 'eggs', 'gills'] },
  // The island's fruit bat, last so the earlier levels' seeded rounds are unchanged. Its clues say what this bat has and
  // does, never what all bats do.
  bat: { id: 'bat', name: 'Bat', group: 'mammal', features: ['fur', 'wings', 'two-legs', 'milk', 'fly'] },
};

export const FRIEND_IDS = Object.keys(FRIENDS) as FriendId[];

/** A group clue (level 5): "I'm a bird!" or "I'm a mammal!", the two groups with more than one friend. */
export type GroupClue = 'bird' | 'mammal';
export type Clue = Feature | GroupClue;
export const isGroup = (clue: Clue): clue is GroupClue => clue === 'bird' || clue === 'mammal';
/** The feature a group clue turns into once its hint has shown what the group means: it keeps exactly the same friends. */
export const GROUP_FEATURE: Record<GroupClue, Feature> = { bird: 'feathers', mammal: 'milk' };
/** The feature signs the group hint shows. */
export const GROUP_SIGNS: Record<GroupClue, readonly Feature[]> = {
  bird: ['feathers'],
  mammal: ['fur', 'milk'],
};

export const keeps = (clue: Clue, friend: FriendId) =>
  isGroup(clue) ? FRIENDS[friend].group === clue : FRIENDS[friend].features.includes(clue);

/** The friends in `remaining` the clue is false of. */
export const ruledOut = (remaining: readonly FriendId[], clue: Clue) =>
  remaining.filter((f) => !keeps(clue, f));

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

const ownIn = (friend: FriendId, family: Family) =>
  FRIENDS[friend].features.find((f) => FEATURES[f].family === family);

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
    if (keeps(other, friend))
      return { kind: 'not', name, has: FEATURES[other].has, clue: FEATURES[clue].noun };
    return { kind: 'no', name, lacks: 'has no legs' };
  }
  return { kind: 'no', name, lacks: FEATURES[clue].lacks };
}

/**
 * What a friend without a feature does, after its name, when an answer of "no" keeps it (level 6): "Cow has no feathers".
 * The leg questions say which count it is not, because a duck asked about four legs has legs.
 */
export function lacksText(feature: Feature): string {
  if (feature === 'four-legs') return "doesn't have four legs";
  if (feature === 'two-legs') return "doesn't have two legs";
  return FEATURES[feature].lacks;
}

/** The spoken line for tapping a friend a clue keeps: "Duck has feathers, so Duck stays!" */
export const staysText = (friend: FriendId, clue: Feature) => ({
  name: FRIENDS[friend].name,
  has: hasText(friend, clue),
});

/**
 * The spoken line for tapping a friend a group clue keeps: "Penguin has feathers, so Penguin is a bird. Penguin stays!".
 * `has` is the group's defining features as this friend has them; null for a friend in neither group.
 */
export function groupHas(friend: FriendId): { name: string; has: string; group: string } | null {
  const { name, group } = FRIENDS[friend];
  if (group === 'bird') return { name, has: hasText(friend, 'feathers'), group: 'a bird' };
  if (group === 'mammal')
    return { name, has: `${hasText(friend, 'fur')} and ${FEATURES.milk.has}`, group: 'a mammal' };
  return null;
}

// Levels ---------------------------------------------------------------------------------------------------------------

const BASIC: Feature[] = [
  'feathers',
  'fur',
  'shell',
  'fins',
  'smooth-skin',
  'wings',
  'beak',
  'four-legs',
  'two-legs',
];
const GROUPS: Feature[] = [...BASIC, 'scales', 'eggs', 'milk', 'gills'];
/** Level 4 adds flying, which never defines a group: that is the surprise. */
const SURPRISES: Feature[] = [...GROUPS, 'fly'];
/** Families whose features define the groups; level 3 asks for at least two such clues. */
export const DEFINING: readonly Family[] = ['covering', 'babies', 'breathing'];

export interface WhoPlan {
  level: number;
  name: string;
  /**
   * 'fit': tap the one friend the clue fits. 'turn': turn over the friends each clue rules out. 'ask': she asks the
   * questions and turns over the friends each answer rules out (level 6; the round has no clue list). 'riddle': she picks
   * a friend and gives the clues, and the pet turns the friends over (level 7; nothing is judged).
   */
  mode: 'fit' | 'turn' | 'ask' | 'riddle';
  friends: number;
  clues: number;
  allowed: readonly Feature[];
  /** The friends a gallery is drawn from; the bat arrives at level 4. */
  pool: readonly FriendId[];
  /** Friends every gallery has (level 4: the penguin and the bat). */
  include: readonly FriendId[];
  /** At least one clue must be a surprise step (`surpriseAt`). */
  surprise: boolean;
  /** At least this many groups among the gallery. */
  minGroups: number;
  /** At least this many clues from the defining families. */
  minDefining: number;
  /**
   * Who can be the answer. Only friends a round of exactly `clues` useful clues can end on: with the allowed features a bird or
   * the fish is picked out by its first clue at level 2, and only the frog and the turtle take three steps at level 3. At
   * level 4 a four-legged mammal cannot be it (fur and milk rule out the same friends, so it has two useful clues at most),
   * nor the penguin or the fish (each of their other features picks them out at once).
   */
  answers: readonly FriendId[];
  /** Level 5: the first clue is the answer's group, and one feature clue follows only if more than one friend still stands. */
  group?: boolean;
}

const MAMMALS: FriendId[] = ['cow', 'pig', 'cat', 'bear', 'dog', 'bunny'];
/** Everyone but the bat, in table order: levels 1–3 and the sticker draw from these, so neither changed when the bat came. */
export const BARN: FriendId[] = FRIEND_IDS.filter((f) => f !== 'bat');
const EARLY = { pool: BARN, include: [] as FriendId[], surprise: false };

export const PLANS: readonly WhoPlan[] = [
  {
    level: 1,
    name: 'One clue: tap the friend it fits, 3 friends',
    mode: 'fit',
    friends: 3,
    clues: 1,
    allowed: BASIC,
    minGroups: 1,
    minDefining: 0,
    answers: BARN,
    ...EARLY,
  },
  {
    level: 2,
    name: 'Turn them over: 2 clues, 4 friends',
    mode: 'turn',
    friends: 4,
    clues: 2,
    allowed: BASIC,
    minGroups: 1,
    minDefining: 0,
    answers: [...MAMMALS, 'frog', 'turtle'],
    ...EARLY,
  },
  {
    level: 3,
    name: 'Groups by features: 3 clues, 6 friends',
    mode: 'turn',
    friends: 6,
    clues: 3,
    allowed: GROUPS,
    minGroups: 4,
    minDefining: 2,
    answers: ['frog', 'turtle'],
    ...EARLY,
  },
  {
    level: 4,
    name: 'Surprises: the penguin and the bat, 3 clues, 6 friends',
    mode: 'turn',
    friends: 6,
    clues: 3,
    allowed: SURPRISES,
    minGroups: 3,
    minDefining: 1,
    answers: ['duck', 'owl', 'frog', 'turtle', 'bat'],
    pool: FRIEND_IDS,
    include: ['penguin', 'bat'],
    surprise: true,
  },
  {
    level: 5,
    name: 'Which group? The clue is a bird or a mammal, 6 friends',
    mode: 'turn',
    friends: 6,
    // At most two: the group, then one feature clue when the group leaves more than one friend.
    clues: 2,
    allowed: SURPRISES,
    minGroups: 3,
    minDefining: 0,
    // The frog, the turtle and the fish are never the answer: only a bird or a mammal has a group clue.
    answers: ['duck', 'owl', 'penguin', 'bat', ...MAMMALS],
    pool: FRIEND_IDS,
    include: ['penguin', 'bat'],
    surprise: true,
    group: true,
  },
  {
    level: 6,
    name: 'You ask: choose the questions, 6 friends',
    mode: 'ask',
    friends: 6,
    // She asks; the round has no clue list.
    clues: 0,
    allowed: SURPRISES,
    minGroups: 4,
    minDefining: 0,
    // Any friend can be the secret: yes and no together tell all six apart.
    answers: FRIEND_IDS,
    pool: FRIEND_IDS,
    include: [],
    surprise: false,
  },
  {
    level: 7,
    name: 'Make a riddle: choose clues until the pet finds your friend',
    mode: 'riddle',
    friends: 6,
    // She gives the clues; the round has no clue list.
    clues: 0,
    allowed: SURPRISES,
    minGroups: 4,
    minDefining: 0,
    // She can pick any friend: every one of the six has a tray of clues that leaves only it.
    answers: FRIEND_IDS,
    pool: FRIEND_IDS,
    include: ['penguin', 'bat'],
    surprise: false,
  },
];

export const LEVELS: BandLevels = { prek: { min: 1, max: 2 }, school: { min: 2, max: 7 } };

export const planFor = (level: number): WhoPlan =>
  PLANS[Math.min(PLANS.length, Math.max(1, Math.round(level))) - 1];

export interface WhoRound {
  gallery: FriendId[];
  /** The friend to be found. At level 7 it is hers to choose: the first friend until she picks, then her friend. */
  answer: FriendId;
  clues: Clue[];
}

/** The answer's allowed features are not all shared by any other friend in the gallery. */
export function distinguishable(
  answer: FriendId,
  gallery: readonly FriendId[],
  allowed: readonly Feature[],
): boolean {
  const own = FRIENDS[answer].features.filter((f) => allowed.includes(f));
  return gallery.every((g) => g === answer || own.some((f) => !keeps(f, g)));
}

/** A useful clue keeps the answer and rules out at least one friend still standing. */
export const useful = (clue: Clue, answer: FriendId, remaining: readonly FriendId[]) =>
  keeps(clue, answer) && ruledOut(remaining, clue).length > 0;

/**
 * A surprise step: a clue whose outcome differs from the shortcut "it flies or has wings, so it is a bird". `fly` while the
 * penguin stands (it has feathers and goes face down), `feathers` or `eggs` while the bat stands (it has wings and goes
 * face down), or `milk` while the bat and a bird both stand (the birds go, the bat stays). Names who the pet explains.
 */
export type Surprise = 'penguin' | 'bat';
export function surpriseAt(remaining: readonly FriendId[], clue: Clue): Surprise | null {
  // Level 5's group clues: the penguin left alone is the bird that cannot fly; otherwise "a bird" turns over the bat though
  // it flies, and "a mammal" keeps the bat while a bird goes.
  if (clue === 'bird') {
    const kept = remaining.filter((f) => keeps(clue, f));
    if (kept.length === 1 && kept[0] === 'penguin') return 'penguin';
    return remaining.includes('bat') ? 'bat' : null;
  }
  if (clue === 'mammal')
    return remaining.includes('bat') && remaining.some((f) => FRIENDS[f].group === 'bird') ? 'bat' : null;
  if (clue === 'fly' && remaining.includes('penguin')) return 'penguin';
  if (!remaining.includes('bat')) return null;
  if (clue === 'feathers' || clue === 'eggs') return 'bat';
  if (clue === 'milk' && remaining.some((f) => FRIENDS[f].group === 'bird')) return 'bat';
  return null;
}

/** The surprise at each clue of a round, in order (null where there is none). */
export function surprises(gallery: readonly FriendId[], clues: readonly Clue[]): (Surprise | null)[] {
  let left = [...gallery];
  return clues.map((c) => {
    const s = surpriseAt(left, c);
    left = left.filter((f) => keeps(c, f));
    return s;
  });
}

/** A clue list of exactly `n` useful clues that leaves only the answer, tried in a random order; null if there is none. */
function cluesFor(plan: WhoPlan, answer: FriendId, gallery: readonly FriendId[], rng: Rng): Feature[] | null {
  const search = (remaining: readonly FriendId[], chosen: Feature[]): Feature[] | null => {
    const options = rng.shuffle(plan.allowed.filter((c) => useful(c, answer, remaining)));
    for (const c of options) {
      const left = remaining.filter((f) => keeps(c, f));
      const list = [...chosen, c];
      if (list.length === plan.clues) {
        if (
          left.length === 1 &&
          list.filter((x) => DEFINING.includes(FEATURES[x].family)).length >= plan.minDefining &&
          (!plan.surprise || surprises(gallery, list).some(Boolean))
        )
          return list;
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

/** The four kinds of answer level 5 draws from with equal chances, before it draws a gallery that allows the kind. */
export const ANSWER_KINDS = ['flying-bird', 'penguin', 'bat', 'four-legged'] as const;
export type AnswerKind = (typeof ANSWER_KINDS)[number];
export const kindOf = (answer: FriendId): AnswerKind | null =>
  answer === 'penguin'
    ? 'penguin'
    : answer === 'bat'
      ? 'bat'
      : FRIENDS[answer].group === 'bird'
        ? 'flying-bird'
        : FRIENDS[answer].group === 'mammal'
          ? 'four-legged'
          : null;

const FLYERS: FriendId[] = ['duck', 'owl'];
const LONERS: FriendId[] = ['frog', 'turtle', 'fish'];

/**
 * Level 5: the kind of answer first, then a gallery that allows it (drawing the gallery first makes the bat the answer in
 * almost half the rounds). A flying bird is the gallery's only one; the penguin answers only with no duck or owl; a
 * four-legged mammal only when it is the gallery's only one; the bat in any gallery.
 */
function makeGroupRound(plan: WhoPlan, rng: Rng): WhoRound {
  const kind = rng.pick(ANSWER_KINDS);
  for (let attempt = 0; attempt < 400; attempt++) {
    const answer: FriendId =
      kind === 'flying-bird' ? rng.pick(FLYERS) : kind === 'four-legged' ? rng.pick(MAMMALS) : kind;
    const must = plan.include.filter((f) => f !== answer);
    const from =
      kind === 'bat'
        ? [...MAMMALS, ...FLYERS, ...LONERS]
        : kind === 'four-legged'
          ? [...FLYERS, ...LONERS]
          : [...MAMMALS, ...LONERS];
    const others = rng.shuffle(from).slice(0, plan.friends - 1 - must.length);
    const gallery = rng.shuffle([answer, ...must, ...others]);
    if (groupCount(gallery) < plan.minGroups) continue;
    const group = FRIENDS[answer].group as GroupClue;
    const clues: Clue[] = [group];
    const left = gallery.filter((f) => keeps(group, f));
    if (left.length > 1) {
      const options = plan.allowed.filter((c) => useful(c, answer, left));
      if (options.length === 0) continue;
      const next = rng.pick(options);
      if (left.filter((f) => keeps(next, f)).length !== 1) continue;
      clues.push(next);
    }
    return { gallery, answer, clues };
  }
  throw new Error(`who-am-i: no round for level ${plan.level}`);
}

/**
 * The seven kinds of friend the table can tell apart with yes and no: the six four-legged mammals are one kind (the same
 * row), and so are the duck and the owl.
 */
export const KINDS: readonly (readonly FriendId[])[] = [
  MAMMALS,
  FLYERS,
  ['penguin'],
  ['bat'],
  ['frog'],
  ['turtle'],
  ['fish'],
];

/** Level 6: one friend from each of six of the seven kinds (68 galleries), and any of the six is the secret. */
function makeAskRound(rng: Rng): WhoRound {
  const skip = rng.int(0, KINDS.length - 1);
  const gallery = rng.shuffle(KINDS.filter((_, k) => k !== skip).map((kind) => rng.pick(kind)));
  return { gallery, answer: rng.pick(gallery), clues: [] };
}

/**
 * Level 7: a level 6 gallery that always has the bat and never the frog, the turtle and the fish all together (36
 * galleries): a four-legged mammal, a flying bird, the penguin, the bat and two of the other three. The bat is there so
 * "I can fly" alone never picks out the duck or the owl; with all three of the others, and the questions a "no" cannot
 * safely answer taken away, only the shell would tell the turtle from the frog.
 */
function makeRiddleRound(rng: Rng): WhoRound {
  const skip = rng.pick(LONERS);
  const gallery = rng.shuffle<FriendId>([
    rng.pick(MAMMALS),
    rng.pick(FLYERS),
    'penguin',
    'bat',
    ...LONERS.filter((f) => f !== skip),
  ]);
  return { gallery, answer: gallery[0], clues: [] };
}

/** A seeded round for the level: the same seed gives the same round. Bounded; the rule tests prove it never runs out. */
export function makeRound(level: number, rng: Rng): WhoRound {
  const plan = planFor(level);
  if (plan.mode === 'ask') return makeAskRound(rng);
  if (plan.mode === 'riddle') return makeRiddleRound(rng);
  if (plan.group) return makeGroupRound(plan, rng);
  for (let attempt = 0; attempt < 400; attempt++) {
    const answer = rng.pick(plan.answers);
    if (plan.mode === 'fit') {
      // One clue the answer has, and two friends without it.
      const clue = rng.pick(plan.allowed.filter((c) => keeps(c, answer)));
      const others = rng.shuffle(plan.pool.filter((f) => !keeps(clue, f))).slice(0, plan.friends - 1);
      if (others.length < plan.friends - 1) continue;
      return { gallery: rng.shuffle([answer, ...others]), answer, clues: [clue] };
    }
    const apart = (f: FriendId) => distinguishable(answer, [answer, f], plan.allowed);
    const must = plan.include.filter((f) => f !== answer);
    if (!must.every(apart)) continue;
    const others = rng
      .shuffle(plan.pool.filter((f) => f !== answer && !must.includes(f) && apart(f)))
      .slice(0, plan.friends - 1 - must.length);
    if (others.length < plan.friends - 1 - must.length) continue;
    const gallery = rng.shuffle([answer, ...must, ...others]);
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
  /** Misses on the clue showing (levels 2–4) or in the round (level 1). */
  wrongHere: number;
  /** Help has been counted for this clue (levels 2–5) or this round (level 1). */
  helped: boolean;
  /** Level 5: the hint has shown what this group clue means, so it is now judged and explained as its feature clue. */
  meaning: boolean;
  /** Level 5: two more misses after the meaning made the ruled-out friends shimmer, with no further count. */
  shimmer: boolean;
  /** Surprises the pet has explained this round: each is said once, free. */
  explained: Set<Surprise>;
  done: boolean;
  /** Level 6: the question cards she can ask now (three, fewer only when fewer are left unasked). */
  tray: Feature[];
  /** Level 6: every question asked so far, in order, with the answer the pet gave. */
  asked: Asked[];
  /** Level 6: the answer she is turning friends over for; null while she is choosing a question. */
  current: Asked | null;
  /** Level 6: duds asked in a row; two show the question hint by itself. */
  duds: number;
  /** Levels 6 and 7: the question hint (6) or the clue hint (7) has been counted this round. */
  askHelped: boolean;
  /** Levels 6 and 7: draws the trays. */
  rng: Rng | null;
  /** Level 7: the gallery index of the friend she picked for the pet to guess; null until she picks. */
  picked: number | null;
  /** Level 7: the five clue cards dealt for her friend, in tray order. A given card leaves the tray; the rest stay put. */
  cards: Statement[];
  /** Level 7: the clues she has given, in her order. */
  given: Statement[];
}

/** `rng` draws level 6's question trays and level 7's clue trays; the other modes do not use it. */
export function startPlay(round: WhoRound, mode: WhoPlan['mode'], rng: Rng | null = null): WhoPlay {
  const p: WhoPlay = {
    round,
    mode,
    down: new Set(),
    clue: 0,
    misses: 0,
    hints: 0,
    wrongHere: 0,
    helped: false,
    meaning: false,
    shimmer: false,
    explained: new Set(),
    done: false,
    tray: [],
    asked: [],
    current: null,
    duds: 0,
    askHelped: false,
    rng,
    picked: null,
    cards: [],
    given: [],
  };
  if (mode === 'ask') p.tray = makeTray(round.gallery, askable(round.gallery), rng!);
  return p;
}

/** The friends still face up. */
export const standing = (p: WhoPlay) => p.round.gallery.filter((_, i) => !p.down.has(i));

/** The clue as it is judged and explained now: a group clue whose meaning has been shown is its feature clue. */
export function judged(p: WhoPlay): Clue {
  const clue = p.round.clues[p.clue];
  return isGroup(clue) && p.meaning ? GROUP_FEATURE[clue] : clue;
}

/** Gallery indices of the friends the help points at: the answer at level 1, every face-up friend the clue rules out after. */
export function helpTargets(p: WhoPlay): number[] {
  if (p.mode === 'fit') return [p.round.gallery.indexOf(p.round.answer)];
  if (p.mode === 'ask') {
    const cur = p.current;
    if (!cur) return [];
    return p.round.gallery.map((_, i) => i).filter((i) => !p.down.has(i) && !fits(cur, p.round.gallery[i]));
  }
  const clue = judged(p);
  return p.round.gallery.map((_, i) => i).filter((i) => !p.down.has(i) && !keeps(clue, p.round.gallery[i]));
}

export type TapOutcome =
  /** A tap after the round, or on nothing that counts. */
  | { kind: 'ignored' }
  /** A face-down friend: a free look. */
  | { kind: 'peek' }
  /**
   * The clue does not fit (level 1) or keeps this friend (levels 2–5). `helped` is true when this miss turned the help on
   * (counted); `group` is the reason on a group clue not yet explained; `shimmer` is true when, after a group clue's
   * meaning was shown, this miss made the ruled-out friends shimmer (not counted).
   */
  | {
      kind: 'miss';
      reason: Reason | null;
      stays: { name: string; has: string } | null;
      group: { name: string; has: string; group: string } | null;
      /** Level 6, after a no: "Cow has no feathers, so Cow stays!" */
      staysNo?: { name: string; lacks: string };
      helped: boolean;
      shimmer: boolean;
    }
  /** Level 6: a face-up friend tapped before any question is asked, or between answers. Never a miss. */
  | { kind: 'ask-first' }
  /**
   * A ruled-out friend turned over; `next` when that finished the clue and another arrives, `done` when one friend is left.
   * `surprise` names who the pet explains when the finished clue was a surprise step not yet explained (level 4); it counts nothing.
   */
  | { kind: 'flip'; next: boolean; done: boolean; surprise: Surprise | null }
  /** Level 1: the right friend. */
  | { kind: 'fit' };

/** Applies one tap on gallery index `i`, changing `p`. */
export function tap(p: WhoPlay, i: number): TapOutcome {
  // Level 7's friend cards go through `pickFriend`: nothing there is judged.
  if (p.done || p.mode === 'riddle' || i < 0 || i >= p.round.gallery.length) return { kind: 'ignored' };
  if (p.down.has(i)) return { kind: 'peek' };
  const friend = p.round.gallery[i];
  const miss = (
    r: Reason | null,
    stays: { name: string; has: string } | null,
    group: { name: string; has: string; group: string } | null = null,
    staysNo?: { name: string; lacks: string },
  ): TapOutcome => {
    p.misses++;
    p.wrongHere++;
    let helped = false,
      shimmer = false;
    if (p.wrongHere >= 2) {
      if (!p.helped) {
        helped = true;
        countHelp(p);
      } else if (p.meaning && !p.shimmer) {
        p.shimmer = true;
        shimmer = true;
      }
    }
    return { kind: 'miss', reason: r, stays, group, staysNo, helped, shimmer };
  };
  if (p.mode === 'ask') {
    const cur = p.current;
    if (!cur) return { kind: 'ask-first' };
    if (fits(cur, friend))
      return cur.yes
        ? miss(null, staysText(friend, cur.feature))
        : miss(null, null, null, { name: FRIENDS[friend].name, lacks: lacksText(cur.feature) });
    p.down.add(i);
    if (helpTargets(p).length > 0) return { kind: 'flip', next: false, done: false, surprise: null };
    p.current = null;
    p.wrongHere = 0;
    p.helped = false;
    if (standing(p).length === 1) {
      p.done = true;
      return { kind: 'flip', next: false, done: true, surprise: null };
    }
    p.tray = makeTray(standing(p), unasked(p), p.rng!);
    return { kind: 'flip', next: true, done: false, surprise: null };
  }
  const clue = judged(p);
  if (p.mode === 'fit') {
    if (friend === p.round.answer) {
      p.done = true;
      return { kind: 'fit' };
    }
    return miss(reason(friend, clue as Feature), null);
  }
  if (keeps(clue, friend))
    return isGroup(clue) ? miss(null, null, groupHas(friend)) : miss(null, staysText(friend, clue));
  p.down.add(i);
  if (helpTargets(p).length > 0) return { kind: 'flip', next: false, done: false, surprise: null };
  let surprise = surprises(p.round.gallery, p.round.clues)[p.clue];
  if (surprise && p.explained.has(surprise)) surprise = null;
  if (surprise) p.explained.add(surprise);
  if (p.clue === p.round.clues.length - 1) {
    p.done = true;
    return { kind: 'flip', next: false, done: true, surprise };
  }
  p.clue++;
  p.wrongHere = 0;
  p.helped = false;
  p.meaning = false;
  p.shimmer = false;
  return { kind: 'flip', next: true, done: false, surprise };
}

/** Counts the help for this clue. On a group clue it shows what the group means and the misses toward a shimmer start over. */
function countHelp(p: WhoPlay) {
  p.helped = true;
  p.hints++;
  if (isGroup(p.round.clues[p.clue])) {
    p.meaning = true;
    p.wrongHere = 0;
  }
}

/**
 * The pause sheet's Show a hint: counted once per round (level 1) or per clue (levels 2–5); true when this request counted.
 * At level 6 it is the question hint while she is choosing (once per round) and the shimmer while she is turning friends
 * over (once per answer). At level 7 it is the clue hint, once per round, and only after she has picked a friend.
 */
export function requestHelp(p: WhoPlay): boolean {
  if (p.done) return false;
  if (p.mode === 'riddle') {
    if (p.picked === null || p.askHelped) return false;
    p.askHelped = true;
    p.hints++;
    return true;
  }
  if (p.mode === 'ask' && !p.current) {
    if (p.askHelped) return false;
    p.askHelped = true;
    p.hints++;
    return true;
  }
  if (p.helped) return false;
  countHelp(p);
  return true;
}

/** What the ghost finger taps next: the right friend at level 1 (after one deliberate wrong tap), else the leftmost friend the clue rules out. */
export function botTap(p: WhoPlay, showedMiss: boolean): number | null {
  if (p.done || p.mode === 'riddle') return null;
  if (p.mode === 'fit') {
    const wrong = p.round.gallery.findIndex((f) => f !== p.round.answer);
    return !showedMiss && wrong >= 0 ? wrong : p.round.gallery.indexOf(p.round.answer);
  }
  return helpTargets(p)[0] ?? null;
}

// Level 6, You ask ------------------------------------------------------------------------------------------------------

/** A question she asked and the answer the pet gave; a dud told nobody apart. */
export interface Asked {
  feature: Feature;
  yes: boolean;
  dud: boolean;
}

/**
 * The questions a gallery can be asked. A no must be as safe as a yes, so six cells of the table are never denied:
 * `scales` is never asked (a bird's legs and a turtle's skin have scales), nor `beak` with the turtle (a turtle has a
 * beak), `gills` or `fins` with the frog (a tadpole has gills and a tail fin), `smooth-skin` with the fish (a fish's skin
 * is wet too) or `milk` with the penguin (a father emperor penguin feeds his chick a "crop milk"). The last two of these
 * came from the level 6 source check (docs/definitions/who-am-i.md).
 */
export function askable(gallery: readonly FriendId[]): Feature[] {
  const frog = gallery.includes('frog');
  return FEATURE_IDS.filter(
    (f) =>
      f !== 'scales' &&
      !(f === 'beak' && gallery.includes('turtle')) &&
      !((f === 'gills' || f === 'fins') && frog) &&
      !(f === 'smooth-skin' && gallery.includes('fish')) &&
      !(f === 'milk' && gallery.includes('penguin')) &&
      // Nor a question that is the same for all six from the start (the shell, with no turtle).
      gallery.some((g) => keeps(f, g)) &&
      gallery.some((g) => !keeps(f, g)),
  );
}

/** Whether an answer keeps a friend: after a yes, the friends with the feature; after a no, the friends without it. */
export const fits = (answer: { feature: Feature; yes: boolean }, friend: FriendId) =>
  keeps(answer.feature, friend) === answer.yes;

/** How evenly a question divides the friends: the size of the smaller side, 0 for a dud. */
export function evenness(feature: Feature, friends: readonly FriendId[]): number {
  const have = friends.filter((f) => keeps(feature, f)).length;
  return Math.min(have, friends.length - have);
}

/** A question splits when some of the friends have the feature and some do not: either answer turns someone over. */
export const splits = (feature: Feature, friends: readonly FriendId[]) => evenness(feature, friends) > 0;

/** The gallery's questions not yet asked. */
export const unasked = (p: WhoPlay) =>
  askable(p.round.gallery).filter((f) => !p.asked.some((a) => a.feature === f));

/**
 * Three question cards from `open` (the questions not yet asked) for the friends still standing. With three or more
 * that split: the most even split and two others that split. With fewer: every one that splits, and duds to fill, so
 * there is still a choice and it is now the real one.
 */
export function makeTray(friends: readonly FriendId[], open: readonly Feature[], rng: Rng): Feature[] {
  const split = open.filter((f) => splits(f, friends));
  if (split.length >= 3) {
    const top = Math.max(...split.map((f) => evenness(f, friends)));
    const best = rng.pick(split.filter((f) => evenness(f, friends) === top));
    const others = rng.shuffle(split.filter((f) => f !== best)).slice(0, 2);
    return rng.shuffle([best, ...others]);
  }
  const duds = rng.shuffle(open.filter((f) => !split.includes(f))).slice(0, 3 - split.length);
  return rng.shuffle([...split, ...duds]);
}

/** The tray card that splits the standing friends most evenly (the leftmost of equals): the question hint and the ghost finger's choice. */
export function bestQuestion(p: WhoPlay): Feature | null {
  const left = standing(p);
  let best: Feature | null = null;
  for (const f of p.tray)
    if (splits(f, left) && (!best || evenness(f, left) > evenness(best, left))) best = f;
  return best;
}

export type AskOutcome =
  /** Not a question now: the round is over, or the card is not in the tray. */
  | { kind: 'ignored' }
  /** Friends still need turning for the last answer: the pet says it again, free. */
  | { kind: 'repeat'; answer: Asked }
  /** The answer rules out at least one standing friend: she turns them over next. */
  | { kind: 'answer'; answer: Asked }
  /**
   * The same for everyone still standing: nobody turns over and the card is replaced. `hint` when it was the second dud
   * in a row, so the best question glows; `counted` when that glow was the round's one counted question hint.
   */
  | { kind: 'dud'; answer: Asked; hint: boolean; counted: boolean };

/** Asks the tray's question `feature`, changing `p`. Asking is never a miss. */
export function ask(p: WhoPlay, feature: Feature): AskOutcome {
  if (p.done || p.mode !== 'ask') return { kind: 'ignored' };
  if (p.current) return { kind: 'repeat', answer: p.current };
  const slot = p.tray.indexOf(feature);
  if (slot < 0) return { kind: 'ignored' };
  const left = standing(p);
  const answer: Asked = { feature, yes: keeps(feature, p.round.answer), dud: !splits(feature, left) };
  p.asked.push(answer);
  if (!answer.dud) {
    p.current = answer;
    p.duds = 0;
    p.wrongHere = 0;
    p.helped = false;
    return { kind: 'answer', answer };
  }
  // A dud's card is replaced where it lay; the questions that split are all in the tray already, so this is another dud.
  const spare = unasked(p).filter((f) => !p.tray.includes(f));
  const splitting = spare.filter((f) => splits(f, left));
  if (spare.length > 0) p.tray[slot] = p.rng!.pick(splitting.length > 0 ? splitting : spare);
  else p.tray.splice(slot, 1);
  p.duds++;
  const hint = p.duds >= 2;
  const counted = hint && !p.askHelped;
  if (counted) {
    p.askHelped = true;
    p.hints++;
  }
  return { kind: 'dud', answer, hint, counted };
}

export interface AskLayout extends GalleryLayout {
  /** The tray's cards, left to right (level 7 in portrait: a row of three over a row of two). */
  tray: Rect[];
}

export const TRAY_H = 110;
/** The corner column Home and "?" stand in upright: this wide, down to this far. */
const HOME_COLUMN = 115,
  HOME_BOTTOM = 214;
/** The most answers the strip shows: no chain of questions that split is longer (a rule test proves it). */
export const ASK_STRIP = 5;

/**
 * A stage with a tray of `n` cards: the six friend cards in two rows of three, the tray to the right of the pet's corner
 * (along the bottom in landscape, under the cards in portrait, where more than three cards make a row of three over the
 * rest), and room in the strip for five answers.
 */
function trayStage(v: View, n: number): AskLayout {
  const portrait = v.h > v.w;
  const sign: Rect = { x: v.w / 2 - 160, y: 24, w: 320, h: 130 };
  const strip: Rect[] = [];
  const gapS = portrait ? 16 : 14;
  for (let k = 0; k < ASK_STRIP; k++) {
    strip.push(
      portrait
        ? {
            x: v.w / 2 - (ASK_STRIP * THUMB + (ASK_STRIP - 1) * gapS) / 2 + k * (THUMB + gapS),
            // Five answers reach the left edge on a 768-wide phone area, so the row starts below Home and "?".
            y: Math.max(sign.y + sign.h + 16, v.w < 5 * THUMB + 4 * gapS + 2 * HOME_COLUMN ? HOME_BOTTOM : 0),
            w: THUMB,
            h: THUMB,
          }
        : { x: v.w - THUMB - 16, y: sign.y + sign.h + 20 + k * (THUMB + gapS), w: THUMB, h: THUMB },
    );
  }
  const gap = 16;
  const rows = portrait && n > 3 ? [3, n - 3] : [n];
  const block = rows.length * TRAY_H + (rows.length - 1) * gap;
  const left = portrait ? 30 : PET_CORNER + 20,
    right = portrait ? v.w - 30 : v.w - THUMB - 36;
  const top = portrait ? strip[0].y + THUMB + 30 : sign.y + sign.h + 30;
  const bottom = Math.min(v.h - 24 - block - gap, top + 2 * 300);
  const w = Math.min(170, (right - left - gap * 2) / 3);
  const h = Math.min(210, (bottom - top - gap) / 2);
  const x0 = (left + right) / 2 - (3 * w + 2 * gap) / 2;
  const y0 = top + Math.max(0, (bottom - top - (2 * h + gap)) / 2);
  const cards: Rect[] = [];
  for (let i = 0; i < 6; i++)
    cards.push({ x: x0 + (i % 3) * (w + gap), y: y0 + Math.floor(i / 3) * (h + gap), w, h });
  // The tray starts right of the pet's corner in both orientations, so it may sit beside it.
  const tLeft = PET_CORNER + 20,
    tRight = portrait ? v.w - 30 : right;
  const across = rows[0];
  const tw = Math.min(n > 3 ? 130 : 180, (tRight - tLeft - gap * (across - 1)) / across);
  const ty = Math.min(v.h - 24 - block, y0 + 2 * h + gap + 24);
  const tray: Rect[] = [];
  rows.forEach((count, r) => {
    const tx = (tLeft + tRight) / 2 - (count * tw + (count - 1) * gap) / 2;
    for (let k = 0; k < count; k++)
      tray.push({ x: tx + k * (tw + gap), y: ty + r * (TRAY_H + gap), w: tw, h: TRAY_H });
  });
  return { sign, strip, cards, tray };
}

/** Level 6's stage: the six cards and a tray of three question cards. */
export const askLayout = (v: View): AskLayout => trayStage(v, 3);

// Level 7, Make a riddle ------------------------------------------------------------------------------------------------

/** A clue card she can give: a feature her friend has ("I have wings") or, with `yes` false, one it lacks ("I can't fly"). */
export interface Statement {
  feature: Feature;
  yes: boolean;
}

/** How many clue cards her tray holds. */
export const RIDDLE_CARDS = 5;

/** Every statement the gallery's questions allow, as it is true of the friend. Only what a "no" can safely say is here. */
export const trueOf = (gallery: readonly FriendId[], friend: FriendId): Statement[] =>
  askable(gallery).map((feature) => ({ feature, yes: keeps(feature, friend) }));

/** The friends every one of the statements fits. */
export const fitting = (friends: readonly FriendId[], statements: readonly Statement[]) =>
  friends.filter((f) => statements.every((s) => fits(s, f)));

/**
 * A fair tray for her friend: five different statements, each true of it and safe to say, that together leave only her
 * friend, where no card does that alone (so a riddle is at least two clues), with at least one "I have" card and at least
 * one "I don't" card.
 */
export function validTray(
  gallery: readonly FriendId[],
  friend: FriendId,
  tray: readonly Statement[],
): boolean {
  const open = askable(gallery);
  const left = fitting(gallery, tray);
  return (
    tray.length === RIDDLE_CARDS &&
    new Set(tray.map((s) => s.feature)).size === RIDDLE_CARDS &&
    tray.every((s) => open.includes(s.feature) && fits(s, friend)) &&
    left.length === 1 &&
    left[0] === friend &&
    tray.every((s) => fitting(gallery, [s]).length > 1) &&
    tray.some((s) => s.yes) &&
    tray.some((s) => !s.yes)
  );
}

/** Every fair tray for the friend, each in table order. */
export function riddleTrays(gallery: readonly FriendId[], friend: FriendId): Statement[][] {
  const all = trueOf(gallery, friend);
  const out: Statement[][] = [];
  const grow = (from: number, chosen: Statement[]) => {
    if (chosen.length === RIDDLE_CARDS) {
      if (validTray(gallery, friend, chosen)) out.push(chosen);
      return;
    }
    for (let k = from; k < all.length; k++) grow(k + 1, [...chosen, all[k]]);
  };
  grow(0, []);
  return out;
}

/** A seeded fair tray for the friend, shuffled. Every friend of every level 7 gallery has one (a rule test counts them). */
export function riddleTray(gallery: readonly FriendId[], friend: FriendId, rng: Rng): Statement[] {
  const trays = riddleTrays(gallery, friend);
  if (trays.length === 0) throw new Error(`who-am-i: no riddle tray for ${friend}`);
  return rng.shuffle(rng.pick(trays));
}

/** The clue cards still in her tray, in tray order. */
export const riddleLeft = (p: WhoPlay) => p.cards.filter((s) => !p.given.includes(s));

export type PickOutcome =
  /** Not a pick now: the round is over, or this is not level 7. */
  | { kind: 'ignored' }
  /** A face-down friend: a free look. */
  | { kind: 'peek' }
  /** Her friend, with a fresh tray of clue cards; `changed` when she had picked another friend before. */
  | { kind: 'picked'; changed: boolean }
  /** The friend she has already picked: nothing changes. */
  | { kind: 'same' }
  /** She has given a clue, so her friend is settled. Never a miss. */
  | { kind: 'settled' };

/** She taps friend `i` at level 7: until her first clue this picks it, as often as she likes. */
export function pickFriend(p: WhoPlay, i: number): PickOutcome {
  if (p.done || p.mode !== 'riddle' || i < 0 || i >= p.round.gallery.length) return { kind: 'ignored' };
  if (p.down.has(i)) return { kind: 'peek' };
  if (p.given.length > 0) return { kind: 'settled' };
  if (p.picked === i) return { kind: 'same' };
  const changed = p.picked !== null;
  p.picked = i;
  p.round.answer = p.round.gallery[i];
  p.cards = riddleTray(p.round.gallery, p.round.answer, p.rng!);
  return { kind: 'picked', changed };
}

export type ClueOutcome =
  /** Not a clue now: the round is over, she has not picked, or the card is not in her tray. */
  | { kind: 'ignored' }
  /**
   * The pet turns over every standing friend the clue does not fit (`turned`, gallery indices; empty when the clue fits
   * everyone it was still thinking of) and thinks about who is `left`; `done` when only her friend is.
   */
  | { kind: 'clue'; statement: Statement; turned: number[]; left: FriendId[]; done: boolean };

/** She gives the tray's clue about `feature`, changing `p`. Every card is true, so no clue is ever a miss. */
export function giveClue(p: WhoPlay, feature: Feature): ClueOutcome {
  if (p.done || p.mode !== 'riddle' || p.picked === null) return { kind: 'ignored' };
  const statement = riddleLeft(p).find((s) => s.feature === feature);
  if (!statement) return { kind: 'ignored' };
  p.given.push(statement);
  const turned = p.round.gallery
    .map((_, i) => i)
    .filter((i) => !p.down.has(i) && !fits(statement, p.round.gallery[i]));
  for (const i of turned) p.down.add(i);
  const left = standing(p);
  p.done = left.length === 1;
  return { kind: 'clue', statement, turned, left, done: p.done };
}

/** How many standing friends a clue would turn over. */
export const turnsOver = (p: WhoPlay, s: Statement) => standing(p).filter((f) => !fits(s, f)).length;

/**
 * The tray card that turns over the most standing friends (the leftmost of equals): the clue hint and the ghost finger's
 * choice. While two friends stand one always turns somebody over, because the cards together leave only her friend.
 */
export function riddleHint(p: WhoPlay): Statement | null {
  let best: Statement | null = null;
  for (const s of riddleLeft(p)) if (turnsOver(p, s) > (best ? turnsOver(p, best) : 0)) best = s;
  return best;
}

/** Level 7's stage: level 6's with a tray of five clue cards (one row in landscape, three over two in portrait). */
export const riddleLayout = (v: View): AskLayout => trayStage(v, RIDDLE_CARDS);

// Layout ---------------------------------------------------------------------------------------------------------------

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface GalleryLayout {
  sign: Rect;
  /** Where the next clues-so-far thumbnail goes, one per earlier clue (100 units square). */
  strip: Rect[];
  cards: Rect[];
}

/** The pet's corner and the home button: nothing here may sit inside them. */
export const PET_CORNER = 150;
export const HOME_CORNER = 130;
export const THUMB = 100;

/**
 * Every rectangle on the stage for `n` friend cards. Three or four cards stand in one row; five or six in two rows of three.
 * In landscape the clues so far sit down the right edge; in portrait, in a row under the sign.
 */
export function galleryLayout(v: View, n: number): GalleryLayout {
  const portrait = v.h > v.w;
  const sign: Rect = { x: v.w / 2 - 160, y: 24, w: 320, h: 130 };
  const strip: Rect[] = [];
  for (let k = 0; k < 2; k++) {
    strip.push(
      portrait
        ? { x: v.w / 2 - THUMB - 8 + k * (THUMB + 16), y: sign.y + sign.h + 16, w: THUMB, h: THUMB }
        : { x: v.w - THUMB - 16, y: sign.y + sign.h + 20 + k * (THUMB + 14), w: THUMB, h: THUMB },
    );
  }
  const rows = n <= 4 ? 1 : 2;
  const cols = Math.ceil(n / rows);
  // In portrait the cards end above the pet's corner, so they can use the whole width.
  const left = portrait ? 30 : PET_CORNER + 20,
    right = portrait ? v.w - 30 : v.w - THUMB - 36;
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
    const r = Math.floor(i / cols),
      c = i % cols;
    cards.push({ x: x0 + c * (w + gap), y: y0 + r * (h + gap), w, h });
  }
  return { sign, strip, cards };
}
