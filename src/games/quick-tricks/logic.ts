import type { ColorName } from '../../art/palette';
import type { Rng } from '../../engine/random';

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
  /** Umbrella Up: one friend and one leaf, or two friends and a choice of leaves. */
  friends: 1 | 2;
  /** Sock Gobbler: socks to choose from, and whether patterns matter as well as colors. */
  socks: number;
  patterns: boolean;
  /** Bridge Stretch: stretch the plank, or choose one of three fixed planks. */
  bridge: 'stretch' | 'choose';
  /** Whether letting go of a stretched plank short of the far side counts as a miss. */
  countShort: boolean;
  name: string;
}

export const PLANS: TricksPlan[] = [
  { friends: 1, socks: 2, patterns: false, bridge: 'stretch', countShort: false, name: 'A little show: keep Bunny dry, find a sock partner, stretch a bridge' },
  { friends: 1, socks: 3, patterns: false, bridge: 'stretch', countShort: true, name: 'Leaf up high, three socks to choose from, stretch all the way across' },
  { friends: 2, socks: 4, patterns: true, bridge: 'choose', countShort: true, name: 'Which leaf covers two, socks with the same color and pattern, a plank long enough' },
];

export const planFor = (level: number) => PLANS[Math.min(PLANS.length, Math.max(1, level)) - 1];

// ----- Umbrella Up -----

export interface Leaf {
  width: number;
}

/** Leaves on offer: one big leaf for one friend; a small and a big leaf for two. */
export const leavesFor = (plan: TricksPlan): Leaf[] => (plan.friends === 1 ? [{ width: 240 }] : [{ width: 200 }, { width: 400 }]);

/** Friends standing in the rain, as x offsets from the scene's middle. */
export const friendsFor = (plan: TricksPlan): number[] => (plan.friends === 1 ? [0] : [-105, 105]);

/** A leaf held at x shelters a friend when the friend is well under it. */
export const shelters = (leafX: number, leaf: Leaf, friendX: number) => Math.abs(leafX - friendX) <= leaf.width / 2 - 30;

export type LeafDrop = 'dry' | 'below' | 'partly' | 'away';

/**
 * Where a leaf landed: up over every friend, over some, too low (in front of them), or nowhere near.
 * `top` is the friends' head height and `sky` the cloud's bottom (y grows downward).
 */
export function judgeLeaf(leaf: Leaf, x: number, y: number, friends: readonly number[], top: number, sky: number): LeafDrop {
  const near = friends.some((f) => Math.abs(x - f) < leaf.width / 2 + 60);
  if (!near || y < sky - 40) return 'away';
  if (y > top + 20) return 'below';
  const covered = friends.filter((f) => shelters(x, leaf, f)).length;
  if (covered === friends.length) return 'dry';
  return covered > 0 ? 'partly' : 'away';
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
  for (let i = 1; choices.length < plan.socks; i++) choices.push({ color: colors[i + 1], pattern: plan.patterns ? rng.pick(['stripes', 'dots'] as Pattern[]) : 'stripes' });
  return { held, choices: rng.shuffle(choices) };
}

// ----- Bridge Stretch -----

/** The gap between the banks, and the planks on offer when choosing. Only one plank is long enough. */
export const GAP = 300;
export const plankLengths = (rng: Rng): number[] => rng.shuffle([GAP * 0.55, GAP * 0.8, GAP + 70]);
/** A plank (or a stretched one's end) reaches when it lands on the far bank, with a little to rest on. */
export const reaches = (length: number) => length >= GAP + 30;
