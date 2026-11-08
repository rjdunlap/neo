import type { CritterName } from '../../art/critter';
import type { Rng } from '../../engine/random';
import type { BandLevels } from '../../progress/difficulty';

/**
 * Peekaround Island, after Captain Toad's little dioramas: a round island turns a quarter at a
 * time, and whoever stands behind the big tree is hidden until you look from another side.
 *
 * The island has four spots, numbered 0–3 a quarter turn apart in the island's own frame. After
 * `turns` quarter turns, spot s faces direction (s + turns) mod 4 from where the child sits:
 * 0 is in front of the tree, 2 behind it, and 1 and 3 next to it. "In front" and "behind" are
 * always from the child's side, so turning the island changes who is where.
 */
export type PeekMode = 'find' | 'named' | 'who' | 'place' | 'two' | 'see' | 'view' | 'sky';

export interface PeekPlan {
  mode: PeekMode;
  /** Scenes for find/named/who; placement requests for place; pairs of requests for two. */
  rounds: number;
  name: string;
}

export const PLANS: PeekPlan[] = [
  { mode: 'find', rounds: 3, name: 'Turn the island to find who is hiding behind the tree' },
  { mode: 'named', rounds: 3, name: 'Find the friend named: "where is the duck?" (two others are showing)' },
  { mode: 'who', rounds: 3, name: 'Three friends are showing: who is hiding behind the tree?' },
  { mode: 'place', rounds: 3, name: 'Put three friends behind, in front of, and next to the tree' },
  {
    mode: 'two',
    rounds: 2,
    name: 'Two directions at once, then before the island turns around: who will be in front?',
  },
  {
    mode: 'see',
    rounds: 3,
    name: "A picture stands on the island: who can't see it, with the tree in the way?",
  },
  {
    mode: 'view',
    rounds: 3,
    name: 'Three pictures of the island from three sides: which one shows what the duck sees from where it stands?',
  },
  { mode: 'sky', rounds: 3, name: 'From the sky: which map shows the island from above?' },
];

export const LEVELS: BandLevels = {
  toddler: { min: 1, max: 2 },
  preschool: { min: 2, max: 4 },
  prek: { min: 3, max: 7 },
  school: { min: 4, max: 8 },
};

export const planFor = (level: number) => PLANS[Math.min(PLANS.length, Math.max(1, level)) - 1];

export const FRIENDS: CritterName[] = ['duck', 'pig', 'cat', 'bunny', 'cow', 'dog', 'bear'];

export type Where = 'front' | 'behind' | 'next';

/** Spoken between "the duck is" and "the tree". */
export const WHERE_WORDS: Record<Where, string> = { front: 'in front of', behind: 'behind', next: 'next to' };

const mod4 = (n: number) => ((n % 4) + 4) % 4;

/** Where island spot `spot` is, seen from the child, after `turns` quarter turns. */
export function whereIs(spot: number, turns: number): Where {
  const facing = mod4(spot + turns);
  return facing === 0 ? 'front' : facing === 2 ? 'behind' : 'next';
}

/** The island spot that faces `facing` (0 front, 1 right, 2 behind, 3 left) after `turns`. */
export const spotFacing = (facing: number, turns: number) => mod4(facing - turns);

/** Friends on the island at the start of a find/named/who scene: who stands where, and who is asked about. */
export interface PeekScene {
  friends: CritterName[];
  /** The direction each friend faces from the child (0 front, 1 right, 2 behind, 3 left). */
  facing: number[];
  /** Index of the friend hiding behind the tree: the one to find or name. */
  hider: number;
}

/**
 * One hider behind the tree, plus friends in plain sight for the named (two more) and who (three
 * more) levels. The hider changes every scene, so no answer repeats.
 */
export function makeScene(plan: PeekPlan, rng: Rng, lastHider?: CritterName): PeekScene {
  const others = plan.mode === 'find' ? 0 : plan.mode === 'named' ? 2 : 3;
  const pool = rng.shuffle(FRIENDS.filter((f) => f !== lastHider));
  const hider = pool[0];
  const rest = rng.shuffle(FRIENDS.filter((f) => f !== hider)).slice(0, others);
  const sides = rng.shuffle([0, 1, 3]).slice(0, others);
  return { friends: [hider, ...rest], facing: [2, ...sides], hider: 0 };
}

/**
 * Level 6's scene: a picture stands on one spot and friends stand round it; only the friend directly across
 * the tree cannot see it. The picture faces her from the side or from behind the tree, never from the front,
 * because then the friend across would stand behind the crown where nobody can tap it. A picture at the side
 * has the friend in front as the other viewer; a picture behind has both side friends.
 */
export interface SeeScene {
  /** The picture's direction from the child (1 right, 2 behind, 3 left). */
  picture: number;
  friends: CritterName[];
  facing: number[];
  /** Index of the friend across the tree from the picture: the one who cannot see it. */
  blocked: number;
}

/** The picture's facings for a round of three scenes: each of right, behind and left once, shuffled. */
export const seeFacings = (rng: Rng) => rng.shuffle([1, 2, 3]);

/** Whether a friend on `viewer` can see a picture on `picture`: everyone can but the one across the tree. */
export const canSee = (picture: number, viewer: number) => mod4(viewer - picture) !== 2;

export function makeSeeScene(picture: number, rng: Rng, lastBlocked?: CritterName): SeeScene {
  const across = mod4(picture + 2);
  const others = picture === 2 ? [1, 3] : [0];
  const blocked = rng.pick(FRIENDS.filter((f) => f !== lastBlocked));
  const rest = rng.shuffle(FRIENDS.filter((f) => f !== blocked)).slice(0, others.length);
  return { picture, friends: [blocked, ...rest], facing: [across, ...others], blocked: 0 };
}

/**
 * Level 7's scene: three friends stand right of, behind and left of the tree (her own side stays empty), and
 * one of them, at the right or the left so she can see where it stands, is named. Three picture cards show the
 * island from each friend's side; the one from the named friend's side is right.
 */
export interface ViewScene {
  friends: CritterName[];
  /** The direction each friend faces from the child (1 right, 2 behind, 3 left). */
  facing: number[];
  /** Index of the friend named: the one whose view she picks. */
  viewer: number;
}

/** The named friend's side for a round of three scenes: right and left both, the third either. */
export const viewFacings = (rng: Rng) => rng.shuffle([1, 3, rng.pick([1, 3])]);

export function makeViewScene(viewerFacing: number, rng: Rng, lastViewer?: CritterName): ViewScene {
  const viewer = rng.pick(FRIENDS.filter((f) => f !== lastViewer));
  const rest = rng.shuffle(FRIENDS.filter((f) => f !== viewer)).slice(0, 2);
  return { friends: [viewer, ...rest], facing: [viewerFacing, 2, mod4(viewerFacing + 2)], viewer: 0 };
}

/**
 * What a friend standing on island spot `from` sees, looking at the tree: the flowers nearest them on their
 * left and right (flower i sits between spots i and i + 1), and where each other friend stands from there
 * (1 right, 2 behind the tree and hidden, 3 left). A friend is not in their own picture.
 */
export interface SideView {
  left: number;
  right: number;
  friends: { name: CritterName; facing: number }[];
}

export function viewFrom(from: number, friends: readonly { name: CritterName; spot: number }[]): SideView {
  return {
    left: mod4(from - 1),
    right: mod4(from),
    friends: friends
      .filter((f) => f.spot >= 0 && f.spot !== from)
      .map((f) => ({ name: f.name, facing: mod4(f.spot - from) }))
      .sort((a, b) => a.facing - b.facing),
  };
}

/**
 * Level 8: three little maps show the island from the sky, her side (the boat) at the bottom. The true map is
 * the island as it stands; the mirror swaps left and right (facings 1 and 3 trade), the classic copying error;
 * the turned map is the island a quarter turn round (`k`), a true view from a wrong side. Flowers (facings i + 0.5)
 * move with each map like the friends.
 */
export type SkyKind = 'true' | 'mirror' | 'turned';

/** Where something facing `facing` from her side appears on a map of `kind` (facings may be fractional). */
export function skyFacing(kind: SkyKind, facing: number, k: number): number {
  if (kind === 'mirror') return mod4(-facing);
  if (kind === 'turned') return mod4(facing + k);
  return mod4(facing);
}

/** A facing's place on a map of radius `r`, seen from above with her side at the bottom: `at()`'s projection on a circle. */
export function mapPoint(facing: number, r: number) {
  const a = facing * (Math.PI / 2);
  return { x: Math.sin(a) * r, y: Math.cos(a) * r };
}

export interface SkyScene {
  friends: CritterName[];
  /** The direction each friend faces from the child (0 front, 1 right, 2 behind, 3 left). */
  facing: number[];
  /** Index of the friend behind the tree, or null when everyone is in sight (scene 1). */
  hidden: number | null;
  /** The turned map's quarter turns: 1 or 3. */
  k: number;
  /** The three maps, shuffled. */
  maps: SkyKind[];
}

/** Two friends of one body colour would read as the same dot on a small map. */
const LOOKALIKES: [CritterName, CritterName][] = [
  ['cow', 'bunny'],
  ['dog', 'bear'],
];
export const lookalike = (a: CritterName, b: CritterName) =>
  LOOKALIKES.some(([x, y]) => (x === a && y === b) || (x === b && y === a));

/**
 * Scene `index` of level 8: everyone in sight on front and both sides (0), three with one behind the tree and
 * a side empty (1), then four with one behind (2). The friend behind never repeats back to back.
 */
export function makeSkyScene(index: number, rng: Rng, lastHider?: CritterName): SkyScene {
  const facing = index === 0 ? [0, 1, 3] : index === 1 ? [2, 0, rng.pick([1, 3])] : [2, 0, 1, 3];
  const hidden = index === 0 ? null : 0;
  const friends: CritterName[] = [];
  if (hidden !== null) friends.push(rng.pick(FRIENDS.filter((f) => f !== lastHider)));
  for (const f of rng.shuffle([...FRIENDS])) {
    if (friends.length === facing.length) break;
    if (!friends.some((x) => x === f || lookalike(x, f))) friends.push(f);
  }
  return {
    friends,
    facing,
    hidden,
    k: rng.pick([1, 3]),
    maps: rng.shuffle<SkyKind>(['true', 'mirror', 'turned']),
  };
}

/** What a map shows: each friend's place and each flower's (flower i at facing i + 0.5 + turns), as map facings. */
export function skyArrangement(
  kind: SkyKind,
  k: number,
  friends: readonly { name: CritterName; facing: number }[],
  turns = 0,
) {
  return {
    friends: Object.fromEntries(friends.map((f) => [f.name, skyFacing(kind, f.facing, k)])) as Record<
      string,
      number
    >,
    flowers: [0, 1, 2, 3].map((i) => skyFacing(kind, i + 0.5 + turns, k)),
  };
}

/** The island's own arrangement seen from above: friends on island spots after `turns`, with no map transform. */
export function islandArrangement(friends: readonly { name: CritterName; spot: number }[], turns: number) {
  return skyArrangement(
    'true',
    0,
    friends.filter((f) => f.spot >= 0).map((f) => ({ name: f.name, facing: mod4(f.spot + turns) })),
    turns,
  );
}

/** The quarter turns that bring island spot `spot` round to the front, the short way (2 from behind). */
export function turnToFront(spot: number, turns: number): number {
  const d = mod4(-spot - turns);
  return d === 3 ? -1 : d;
}

/** Whether a drop on `spot` answers the request. */
export const fits = (where: Where, spot: number, turns: number) => whereIs(spot, turns) === where;

/** A request is a real choice when some free spot fits it and some free spot does not. */
export const hasChoice = (free: readonly number[], turns: number, where: Where) =>
  free.some((s) => fits(where, s, turns)) && free.some((s) => !fits(where, s, turns));

/**
 * Whether the words not asked yet can still be asked one at a time with a real choice each, whichever
 * fitting spot she takes ("next to" fits either side).
 */
function canFinish(free: readonly number[], turns: number, asked: readonly Where[]): boolean {
  const left = (['front', 'behind', 'next'] as Where[]).filter((w) => !asked.includes(w));
  if (!left.length) return true;
  return left.some((w) => fairWord(free, turns, asked, w));
}

function fairWord(free: readonly number[], turns: number, asked: readonly Where[], where: Where): boolean {
  if (!hasChoice(free, turns, where)) return false;
  return free
    .filter((s) => fits(where, s, turns))
    .every((s) =>
      canFinish(
        free.filter((x) => x !== s),
        turns,
        [...asked, where],
      ),
    );
}

/**
 * Level 4's next placement request: a word not asked yet that leaves a spot that does not fit, chosen so the
 * remaining words still do whichever fitting spot she takes. With three friends and four spots this means
 * "next to" is never asked last (the two side spots would be all that is left). Returns a spot it was chosen
 * from (any spot with that where fits).
 */
export function nextRequest(
  free: number[],
  turns: number,
  asked: Where[],
  rng: Rng,
): { where: Where; spot: number } {
  const options = rng.shuffle(free.map((spot) => ({ spot, where: whereIs(spot, turns) })));
  return (
    options.find((o) => !asked.includes(o.where) && fairWord(free, turns, asked, o.where)) ??
    options.find((o) => !asked.includes(o.where)) ??
    options[0]
  );
}

/**
 * Level 5's pair of requests, made before a half turn: one friend goes behind (so the turn brings someone
 * round to the front), each friend has a free spot that does not fit, both can be placed in either order at
 * any fitting spot, and whatever is left over is not all one word (so the next pair is a choice too). From
 * the starting four spots this is always behind and next to; from the two left after the turn, behind and
 * next to again. The order the two are named is shuffled.
 */
export function nextPair(
  free: number[],
  turns: number,
  rng: Rng,
): [{ where: Where; spot: number }, { where: Where; spot: number }] {
  const behind = free.find((s) => whereIs(s, turns) === 'behind');
  const pairs: [{ where: Where; spot: number }, { where: Where; spot: number }][] = [];
  if (behind !== undefined) {
    for (const spot of rng.shuffle(free.filter((s) => s !== behind))) {
      const a = { where: 'behind' as Where, spot: behind };
      const b = { where: whereIs(spot, turns), spot };
      if (pairFair(free, turns, a.where, b.where)) pairs.push(rng.int(0, 1) ? [a, b] : [b, a]);
    }
  }
  if (pairs.length) return pairs[0];
  const a = nextRequest(free, turns, [], rng);
  return [
    a,
    nextRequest(
      free.filter((s) => s !== a.spot),
      turns,
      [a.where],
      rng,
    ),
  ];
}

/** Every way she can place the pair, in either order and at any fitting spot, and what is left after. */
export function pairPlacements(
  free: readonly number[],
  turns: number,
  a: Where,
  b: Where,
): { a: number; b: number; left: number[] }[] {
  const out: { a: number; b: number; left: number[] }[] = [];
  for (const sa of free.filter((s) => fits(a, s, turns))) {
    for (const sb of free.filter((s) => s !== sa && fits(b, s, turns)))
      out.push({ a: sa, b: sb, left: free.filter((s) => s !== sa && s !== sb) });
  }
  return out;
}

function pairFair(free: readonly number[], turns: number, a: Where, b: Where): boolean {
  if (!hasChoice(free, turns, a) || !hasChoice(free, turns, b)) return false;
  // Placing either one first, at any fitting spot, leaves a spot for the other.
  for (const [x, y] of [
    [a, b],
    [b, a],
  ] as const) {
    for (const s of free.filter((f) => fits(x, f, turns)))
      if (!free.some((f) => f !== s && fits(y, f, turns))) return false;
  }
  // After the half turn, what is left over still holds two different words.
  return pairPlacements(free, turns, a, b).every(
    ({ left }) => left.length < 2 || new Set(left.map((s) => whereIs(s, turns + 2))).size > 1,
  );
}

/** Level 2's help: ring the arrows while the friend asked for is behind the tree, and the friend once it is in view. */
export const namedHintTarget = (hiderSpot: number, turns: number): 'arrows' | 'hider' =>
  whereIs(hiderSpot, turns) === 'behind' ? 'arrows' : 'hider';

/**
 * Level 5's prediction: before a half turn, the friend who will be in front afterwards is the one behind the
 * tree now. Null when nobody stands behind.
 */
export function frontAfterHalfTurn<F extends { spot: number }>(
  friends: readonly F[],
  turns: number,
): F | null {
  return friends.find((f) => f.spot >= 0 && whereIs(f.spot, turns) === 'behind') ?? null;
}

export interface PeekTouchFriend {
  name: CritterName;
  spot: number;
  want?: Where;
}

export type PeekTouch =
  | { kind: 'turn'; dir: 1 }
  | { kind: 'friend'; name: CritterName }
  | { kind: 'tile'; name: CritterName }
  | { kind: 'place'; name: CritterName; spot: number }
  | { kind: 'map'; index: number };

/**
 * The next visible control a capable child uses for each perspective mode (in `see`, `hider` is the friend
 * who cannot see the picture; in `view`, the friend whose picture to choose). While level 5 asks
 * for a prediction (`predicting`), that is the picture of the friend behind the tree. In `sky`, the true map of `maps`.
 */
export function peekTouch(
  mode: PeekMode,
  turns: number,
  hider: CritterName | null,
  friends: readonly PeekTouchFriend[],
  predicting = false,
  maps: readonly SkyKind[] = [],
): PeekTouch | null {
  if (mode === 'sky') {
    const index = maps.indexOf('true');
    return index < 0 ? null : { kind: 'map', index };
  }
  if (predicting) {
    const front = frontAfterHalfTurn(friends, turns);
    return front ? { kind: 'tile', name: front.name } : null;
  }
  if (mode === 'find' || mode === 'named') {
    const hidden = hider && friends.find((f) => f.name === hider && f.spot >= 0);
    if (!hidden) return null;
    return whereIs(hidden.spot, turns) === 'behind'
      ? { kind: 'turn', dir: 1 }
      : { kind: 'friend', name: hidden.name };
  }
  if (mode === 'who' || mode === 'view') return hider ? { kind: 'tile', name: hider } : null;
  if (mode === 'see') {
    const blocked = hider && friends.find((f) => f.name === hider && f.spot >= 0);
    return blocked && whereIs(blocked.spot, turns) !== 'behind'
      ? { kind: 'friend', name: blocked.name }
      : null;
  }
  const waiting = friends.find((f) => f.spot < 0 && f.want);
  if (!waiting) return null;
  const free = [0, 1, 2, 3].filter((spot) => !friends.some((f) => f.spot === spot));
  const spot = free.find((s) => fits(waiting.want!, s, turns));
  return spot === undefined ? null : { kind: 'place', name: waiting.name, spot };
}
