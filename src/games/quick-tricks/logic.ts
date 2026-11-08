import type { ColorName } from '../../art/palette';
import type { Rng } from '../../engine/random';
import type { BandLevels } from '../../progress/difficulty';

/**
 * Quick Tricks, after WarioWare's tiny scenes, made calm: a little show of three tricks, each one
 * drag that changes something you can see, with a silly payoff, then on to the next when the child
 * is ready. Umbrella Up (above and below, then which leaf covers two), Sock Gobbler (matching color,
 * then color and pattern), Bridge Stretch (stretching all the way, then choosing a plank long enough).
 * The whole show is one round and one sticker.
 */
export type Trick = 'umbrella' | 'socks' | 'bridge';
export const TRICKS: Trick[] = ['umbrella', 'socks', 'bridge'];

export interface TricksPlan {
  /** Umbrella Up: one friend and one leaf, two friends and a choice of leaves, or three friends and two leaves that both go up. */
  friends: 1 | 2 | 3;
  /** Sock Gobbler: socks to choose from, and whether patterns matter as well as colors. */
  socks: number;
  patterns: boolean;
  /** Bridge Stretch: stretch the plank, choose one of three fixed planks, or fit two of them to two gaps. */
  bridge: 'stretch' | 'choose' | 'two';
  /** Whether letting go of a stretched plank short of the far side counts as a miss. */
  countShort: boolean;
  /** Whether a leaf dropped below the friends (in front of them) counts as a miss. */
  countBelow: boolean;
  /** Two at once (level 7): two leaves, two lost socks and two gaps, each trick done in two steps that are kept as they land. */
  two?: boolean;
  /** The tricks in this show, when not all three (A tiny show plays the leaf and the bridge only). */
  tricks?: Trick[];
  /**
   * A tiny show (level 8): a leaf anywhere over the friend's column keeps them dry, above or in front, and a stretch let go past
   * halfway snaps across, so nothing she does can count as a miss.
   */
  tiny?: boolean;
  name: string;
}

export const PLANS: TricksPlan[] = [
  {
    friends: 1,
    socks: 2,
    patterns: false,
    bridge: 'stretch',
    countShort: false,
    countBelow: false,
    name: 'A little show: keep Bunny dry, find a sock partner, stretch a bridge',
  },
  {
    friends: 1,
    socks: 3,
    patterns: false,
    bridge: 'stretch',
    countShort: true,
    countBelow: true,
    name: 'Leaf up high, three socks to choose from, stretch all the way across',
  },
  {
    friends: 2,
    socks: 4,
    patterns: true,
    bridge: 'choose',
    countShort: true,
    countBelow: true,
    name: 'Which leaf covers two, socks with the same color and pattern, a plank long enough',
  },
  {
    friends: 3,
    socks: 5,
    patterns: true,
    bridge: 'two',
    countShort: true,
    countBelow: true,
    two: true,
    name: 'Two at once: two leaves for three friends, two lost socks, two gaps to bridge',
  },
  {
    friends: 1,
    socks: 2,
    patterns: false,
    bridge: 'stretch',
    countShort: false,
    countBelow: false,
    tricks: ['umbrella', 'bridge'],
    tiny: true,
    name: 'A tiny show: a leaf over a friend, a bridge stretched past halfway',
  },
];

export const LEVELS: BandLevels = {
  // A tiny show (8) comes first for the youngest: two tricks, nothing counted.
  // The third show (9) comes last at every band; its amounts follow the band.
  toddler: { min: 1, max: 9, order: [8, 1, 9] },
  preschool: { min: 1, max: 9, order: [8, 1, 2, 3, 4, 9] },
  prek: { min: 2, max: 9, order: [2, 3, 4, 5, 6, 7, 9] },
  school: { min: 5, max: 9, order: [5, 6, 7, 9] },
};

/** The first show's levels: 1 to 3, the remix at level 7 and the tiny show at level 8 (levels 4 to 6 are the second show). */
export const planFor = (level: number) =>
  level === 8 ? PLANS[4] : level >= 7 ? PLANS[3] : PLANS[Math.min(3, Math.max(1, level)) - 1];

/** The tricks a show plays, in order. */
export const tricksFor = (plan: TricksPlan): Trick[] => plan.tricks ?? TRICKS;

// ----- Umbrella Up -----

export interface Leaf {
  width: number;
}

/** Leaves on offer: one big leaf for one friend; a small and a big leaf for two. */
export const leavesFor = (plan: TricksPlan): Leaf[] =>
  plan.friends === 1
    ? [{ width: 240 }]
    : plan.friends === 2
      ? [{ width: 200 }, { width: 400 }]
      : [{ width: 200 }, { width: 300 }];

/**
 * Friends standing in the rain, as x offsets from the scene's middle. With three, a close pair (only the wider leaf covers both) and
 * one friend further off (too far for the wider leaf to share with the pair), so the only way to keep all three dry is wide over the pair, small over the one.
 */
export const friendsFor = (plan: TricksPlan): number[] =>
  plan.friends === 1 ? [0] : plan.friends === 2 ? [-105, 105] : [-170, -20, 230];

/** A leaf held at x shelters a friend when the friend is well under it. */
export const shelters = (leafX: number, leaf: Leaf, friendX: number) =>
  Math.abs(leafX - friendX) <= leaf.width / 2 - 30;

export type LeafDrop = 'dry' | 'below' | 'partly' | 'away';

/**
 * Where a leaf landed: up over every friend, over some, too low (in front of them), or nowhere near.
 * `top` is the friends' head height and `sky` the cloud's bottom (y grows downward).
 */
export function judgeLeaf(
  leaf: Leaf,
  x: number,
  y: number,
  friends: readonly number[],
  top: number,
  sky: number,
): LeafDrop {
  const near = friends.some((f) => Math.abs(x - f) < leaf.width / 2 + 60);
  if (!near || y < sky - 40) return 'away';
  if (y > top + 20) return 'below';
  const covered = friends.filter((f) => shelters(x, leaf, f)).length;
  if (covered === friends.length) return 'dry';
  return covered > 0 ? 'partly' : 'away';
}

/**
 * Whether a leaf drop counts as a miss: a partly covering leaf does (it stays up instead at Two at once, where each leaf covers only
 * some friends), a leaf too low only once the plan says so.
 */
export const leafMiss = (plan: TricksPlan, drop: LeafDrop) =>
  drop === 'partly' ? !plan.two : drop === 'below' && plan.countBelow;

/** A tiny show takes a leaf in front of the friend as keeping them dry (it floats up over them); every other plan judges as it lands. */
export const leafLands = (plan: TricksPlan, drop: LeafDrop): LeafDrop =>
  plan.tiny && drop === 'below' ? 'dry' : drop;

/** Two at once: a leaf held up at an x offset (or not up yet). */
export type LeafUp = number | null;

/** The friends (indices) that no leaf held up covers yet. */
export function stillWet(plan: TricksPlan, up: readonly LeafUp[]): number[] {
  const leaves = leavesFor(plan);
  return friendsFor(plan)
    .map((f, i) => (up.some((x, l) => x !== null && shelters(x, leaves[l], f)) ? -1 : i))
    .filter((i) => i >= 0);
}

/**
 * Leaves that keep nobody dry the others don't: they float home, so a small leaf never hides under the wide one where a finger
 * cannot reach it. The leaf just placed goes home itself if it adds nothing; otherwise any other leaf it made idle does.
 */
export function idleLeaves(plan: TricksPlan, up: readonly LeafUp[], placed: number): number[] {
  const wet = stillWet(plan, up).length;
  const idle = (l: number) =>
    up[l] !== null &&
    stillWet(
      plan,
      up.map((u, k) => (k === l ? null : u)),
    ).length === wet;
  if (idle(placed)) return [placed];
  return up.flatMap((_, l) => (l !== placed && idle(l) ? [l] : []));
}

/** The one way to keep everyone dry at Two at once: the wider leaf over the pair's middle, the small leaf over the friend on their own. */
export function leafPlan(plan: TricksPlan): { leaf: number; x: number }[] {
  const [a, b, c] = friendsFor(plan);
  return [
    { leaf: 1, x: (a + b) / 2 },
    { leaf: 0, x: c },
  ];
}

/** The next leaf to move (or put up) at Two at once, and where: the first step of the plan not yet in place; null once all are dry. */
export function nextLeaf(plan: TricksPlan, up: readonly LeafUp[]): { leaf: number; x: number } | null {
  if (stillWet(plan, up).length === 0) return null;
  // A dragged leaf lands a fraction off where it was carried: within a few units it is in place.
  return leafPlan(plan).find((s) => up[s.leaf] === null || Math.abs(up[s.leaf]! - s.x) > 4) ?? null;
}

// ----- Sock Gobbler -----

export type Pattern = 'plain' | 'stripes' | 'dots';
export interface Sock {
  color: ColorName;
  pattern: Pattern;
}
export const SOCK_COLORS: ColorName[] = ['red', 'blue', 'yellow', 'green', 'purple', 'orange'];
export const sameSock = (a: Sock, b: Sock) => a.color === b.color && a.pattern === b.pattern;

/**
 * The monster's sock and the socks to choose from, with exactly one partner. When patterns matter,
 * one sock shares only the color and another only the pattern, so both have to be checked.
 */
export function makeSocks(plan: TricksPlan, rng: Rng): { held: Sock; choices: Sock[] } {
  const colors = rng.shuffle([...SOCK_COLORS]);
  const patterns: Pattern[] = rng.shuffle(['stripes', 'dots']);
  const held: Sock = { color: colors[0], pattern: plan.patterns ? patterns[0] : 'stripes' };
  const choices: Sock[] = [{ ...held }];
  if (plan.patterns) {
    choices.push({ color: held.color, pattern: patterns[1] });
    choices.push({ color: colors[1], pattern: held.pattern });
  }
  for (let i = 1; choices.length < plan.socks; i++)
    choices.push({
      color: colors[i + 1],
      pattern: plan.patterns ? rng.pick(['stripes', 'dots'] as Pattern[]) : 'stripes',
    });
  return { held, choices: rng.shuffle(choices) };
}

/**
 * Two at once: the monster holds two different socks, and exactly one of five matches each. Each held sock has a decoy of its colour
 * with the other pattern, and one more shares the first's pattern in a third colour.
 */
export function makeTwoSocks(rng: Rng): { held: [Sock, Sock]; choices: Sock[] } {
  const [c0, c1, c2] = rng.shuffle([...SOCK_COLORS]);
  const other = (p: Pattern): Pattern => (p === 'stripes' ? 'dots' : 'stripes');
  const pick = (): Pattern => rng.pick(['stripes', 'dots'] as Pattern[]);
  const a: Sock = { color: c0, pattern: pick() };
  const b: Sock = { color: c1, pattern: pick() };
  const choices: Sock[] = [
    { ...a },
    { ...b },
    { color: c0, pattern: other(a.pattern) },
    { color: c1, pattern: other(b.pattern) },
    { color: c2, pattern: a.pattern },
  ];
  return { held: [a, b], choices: rng.shuffle(choices) };
}

/** Which held sock this one partners (an index into `held`), skipping any already paired; -1 if none. */
export const partnerOf = (held: readonly Sock[], paired: readonly boolean[], sock: Sock) =>
  held.findIndex((h, i) => !paired[i] && sameSock(h, sock));

// ----- Bridge Stretch -----

/** The gap between the banks, and the planks on offer when choosing. Only one plank is long enough. */
export const GAP = 300;
export const plankLengths = (rng: Rng): number[] => rng.shuffle([GAP * 0.55, GAP * 0.8, GAP + 70]);
/** A plank (or a stretched one's end) reaches when it lands on the far bank, with a little to rest on. */
export const reaches = (length: number) => reachesGap(length, GAP);
export const reachesGap = (length: number, gap: number) => length >= gap + 30;
/** Whether a stretched plank let go at this length snaps across: all the way over, or at a tiny show past halfway. */
export const stretchReaches = (plan: TricksPlan, length: number) =>
  plan.tiny ? length > GAP / 2 : reaches(length);

/**
 * Two at once: one river with a narrow and a wide gap either side of a little island. The long plank reaches either gap, the middle
 * one only the narrow gap and the short one neither, so the only way across is middle on the narrow gap and long on the wide one.
 */
export const GAPS = [160, 260];
export const ISLAND = 100;
export const twoPlankLengths = (rng: Rng): number[] => rng.shuffle([130, 220, 330]);

/** The plank (index into lengths) each gap needs: the one assignment where every gap gets a different plank that reaches it. */
export function plankPlan(lengths: readonly number[]): number[] {
  const fits: number[][] = [];
  for (let a = 0; a < lengths.length; a++)
    for (let b = 0; b < lengths.length; b++)
      if (a !== b && reachesGap(lengths[a], GAPS[0]) && reachesGap(lengths[b], GAPS[1])) fits.push([a, b]);
  return fits[0];
}

/** Planks lying across the gaps: a plank index per gap, or null. */
export type OnGaps = (number | null)[];

/**
 * What the pet says when a plank is too short for a gap: if a plank already lying elsewhere could reach this gap and this one could
 * take its place, that one could move; otherwise just too short.
 */
export function bumpLine(
  lengths: readonly number[],
  plank: number,
  gap: number,
  on: OnGaps,
): 'move' | 'short' {
  return on.some(
    (p, g) =>
      g !== gap &&
      p !== null &&
      p !== plank &&
      reachesGap(lengths[p], GAPS[gap]) &&
      reachesGap(lengths[plank], GAPS[g]),
  )
    ? 'move'
    : 'short';
}

/**
 * The next plank to carry, and to which gap: the first gap without its planned plank that is empty (the plank may lie across the
 * other gap; lifting it frees that one). Null once both gaps hold their planks.
 */
export function nextPlank(lengths: readonly number[], on: OnGaps): { plank: number; gap: number } | null {
  const want = plankPlan(lengths);
  for (let g = 0; g < GAPS.length; g++)
    if (on[g] !== want[g] && on[g] === null) return { plank: want[g], gap: g };
  // A wrong plank sits on a gap whose own is needed elsewhere first: move the planned one for that gap (lifting the wrong one is free).
  const g = want.findIndex((p, i) => on[i] !== p);
  return g < 0 ? null : { plank: want[g], gap: g };
}

// ----- the cast -----

/** Who stands in the rain, and who crosses the bridge. Seeded, so a replay of a level is the same show with a new cast. */
export const RAIN_FRIENDS = ['bunny', 'duck', 'cat', 'pig'] as const;
export type RainFriend = (typeof RAIN_FRIENDS)[number];
export const CROSSERS = ['beetle', 'snail', 'ladybug'] as const;
export type Crosser = (typeof CROSSERS)[number];
/** The sock monster's fur: never a sock colour, so every sock stands out against it and colour stays the only thing judged. */
export const MONSTER_COLORS: ColorName[] = ['pink', 'teal', 'brown'];

export interface Cast {
  friends: RainFriend[];
  crosser: Crosser;
  monster: ColorName;
}

export function castFor(plan: TricksPlan, rng: Rng): Cast {
  return {
    friends: rng.shuffle([...RAIN_FRIENDS]).slice(0, plan.friends),
    crosser: rng.pick(CROSSERS),
    monster: rng.pick(MONSTER_COLORS),
  };
}

// ----- the demonstration -----

/** Where the demonstration holds the leaf that keeps every friend dry: the widest one that shelters them all, over their middle, at the height the rain rolls off. */
export function leafDrop(plan: TricksPlan, top: number): { leaf: number; x: number; y: number } {
  const friends = friendsFor(plan);
  const x = friends.reduce((a, b) => a + b, 0) / friends.length;
  const leaves = leavesFor(plan);
  const leaf = leaves.findIndex((l) => friends.every((f) => shelters(x, l, f)));
  return { leaf, x, y: top - 40 };
}

/** The sock that is the monster's partner (exactly one is). */
export const partnerSock = (held: Sock, choices: readonly Sock[]) =>
  choices.findIndex((s) => sameSock(s, held));

/** The plank that is long enough (exactly one is). */
export const plankToPlace = (lengths: readonly number[]) => lengths.findIndex(reaches);

/** Bridge Stretch's handle is let go this far from the near bank: past the far bank, with room to spare. */
export const STRETCH_TO = GAP + 60;
