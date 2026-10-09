import type { Rng } from '../../engine/random';

/**
 * Block Tower, after stacking blocks, Jenga and Art of Balance: stack blocks and knock them down. The ladder grows
 * from tap-to-stack into measuring height in blocks, comparing towers, and a simple, explicit balance rule:
 *
 * **A block stays up when the middle of it and everything on top of it is over the block below** (or over the
 * table), and not right on its edge. That is the center-of-mass rule for equal blocks, stated so a child can
 * check it with a finger; a middle exactly on an edge counts as falling, as a real one would wobble off.
 * It is the only physics here; the tumble itself is a cartoon.
 *
 * Horizontal positions are in eighths of a block width, so every check is exact.
 */
export type TowerMode = 'tumble' | 'friend' | 'flag' | 'match' | 'stand' | 'reach';

export interface TowerPlan {
  mode: TowerMode;
  rounds: number;
  name: string;
}

export const PLANS: TowerPlan[] = [
  { mode: 'tumble', rounds: 2, name: 'Tap to stack blocks, then knock the tower down' },
  { mode: 'friend', rounds: 3, name: 'Stack until the tower is as tall as a friend, then knock it down' },
  { mode: 'flag', rounds: 3, name: 'Build up to the flag (3 to 6 blocks), then ring the bell' },
  { mode: 'match', rounds: 3, name: "Compare with Bear's tower: just as tall, one block taller, or one shorter" },
  { mode: 'stand', rounds: 3, name: 'Which tower will stand? Guess, then let go and see (a guess is never wrong)' },
  { mode: 'reach', rounds: 2, name: 'Stack blocks out past the table edge to touch the star without tipping' },
];

export const planFor = (level: number) => PLANS[Math.min(PLANS.length, Math.max(1, level)) - 1];

/** Eighths of a block in one block width. */
export const W = 8;

/**
 * Where a stack falls. `xs` are block middles from the bottom up, in eighths. The bottom block stands on the
 * ground (`edge` null: anything goes) or on a table whose right edge is at `edge`. Returns the lowest block
 * that falls, taking everything above it along, or -1 if the whole stack stands.
 */
export function topples(xs: readonly number[], edge: number | null): number {
  for (let k = 0; k < xs.length; k++) {
    const above = xs.slice(k);
    const middle = above.reduce((s, x) => s + x, 0) / above.length;
    if (k === 0) {
      if (edge !== null && middle >= edge) return 0;
    } else if (Math.abs(middle - xs[k - 1]) >= W / 2) return k;
  }
  return -1;
}

/** The middle of the blocks from `k` up: what has to be over block `k - 1`. */
export const middleFrom = (xs: readonly number[], k: number) => xs.slice(k).reduce((s, x) => s + x, 0) / (xs.length - k);

// Measuring rounds --------------------------------------------------------------------------------

/** Friends, by how many blocks tall they stand. */
export const FRIEND_HEIGHT = { duck: 2, bunny: 3, pig: 4, bear: 5 } as const;
export type TowerFriend = keyof typeof FRIEND_HEIGHT;

export type Ask = 'same' | 'taller' | 'shorter';

export interface TowerRound {
  /** Blocks to stack (tumble, friend, flag), or what the child's tower should be (match). */
  target: number;
  friend?: TowerFriend;
  /** Match: Bear's tower and what to make. */
  bear?: number;
  ask?: Ask;
}

export const targetFor = (bear: number, ask: Ask) => bear + (ask === 'taller' ? 1 : ask === 'shorter' ? -1 : 0);

export function makeRounds(plan: TowerPlan, rng: Rng): TowerRound[] {
  const out: TowerRound[] = [];
  let last = 0;
  const fresh = (min: number, max: number) => {
    let n = rng.int(min, max);
    for (let t = 0; n === last && t < 10; t++) n = rng.int(min, max);
    return (last = n);
  };
  const friends = rng.shuffle(Object.keys(FRIEND_HEIGHT) as TowerFriend[]);
  const asks = rng.shuffle<Ask>(['same', 'taller', 'shorter']);
  for (let r = 0; r < plan.rounds; r++) {
    if (plan.mode === 'tumble') out.push({ target: 6 });
    else if (plan.mode === 'friend') out.push({ target: FRIEND_HEIGHT[friends[r]], friend: friends[r] });
    else if (plan.mode === 'flag') out.push({ target: fresh(3, 6) });
    else if (plan.mode === 'match') {
      const bear = fresh(3, 6);
      out.push({ target: targetFor(bear, asks[r % 3]), bear, ask: asks[r % 3] });
    } else out.push({ target: 0 });
  }
  return out;
}

/** A tower that's too short or too tall, or just right. */
export const compare = (have: number, want: number): 'short' | 'tall' | 'right' => (have < want ? 'short' : have > want ? 'tall' : 'right');

// Which tower will stand? --------------------------------------------------------------------------

export interface StandRound {
  /** Block middles for each tower, bottom up, in eighths from the tower's own base. */
  towers: number[][];
  /** The one tower that stands. */
  stands: number;
}

/**
 * Two three-block towers that both lean the same way. One stands; the other's top blocks reach too far, so it
 * falls from the block that loses its support. Before school the falling tower leans clearly further; at early
 * school their tops reach almost as far, so only the middle-over-the-block-below rule tells them apart.
 */
export function makeStand(rng: Rng, subtle: boolean): StandRound {
  // Towers are [0, a, a + b]: each block a little further over than the one below.
  const shapes: [number, number][] = [];
  for (let a = 0; a <= 5; a++) for (let b = 0; b <= 5; b++) shapes.push([a, b]);
  const tower = ([a, b]: [number, number]) => [0, a, a + b];
  const reach = ([a, b]: [number, number]) => a + b;
  const standing = shapes.filter((p) => topples(tower(p), null) === -1 && reach(p) >= (subtle ? 4 : 2));
  const up = rng.pick(standing);
  const falling = shapes.filter((p) => topples(tower(p), null) !== -1 && (subtle ? Math.abs(reach(p) - reach(up)) <= 1 : reach(p) >= reach(up) + 2));
  const down = rng.pick(falling);
  const dir = rng.chance(0.5) ? 1 : -1;
  const stands = rng.int(0, 1);
  const towers = stands === 0 ? [tower(up), tower(down)] : [tower(down), tower(up)];
  return { towers: towers.map((t) => t.map((x) => x * dir)), stands };
}

// Reach the star -----------------------------------------------------------------------------------

export interface ReachRound {
  blocks: number;
  /** How far past the table edge the star stands, in eighths. A block touches it with its right side. */
  star: number;
}

/** Two blocks reaching half a block out (one block alone can't), then three reaching five eighths. */
export const REACH: ReachRound[] = [
  { blocks: 2, star: 4 },
  { blocks: 3, star: 5 },
];

/** Positions blocks can be dropped at, relative to the table edge (a little either side of it). */
export const SLOTS = Array.from({ length: 2 * W + W / 2 + 1 }, (_, i) => i - W - W / 2);

export const rightSide = (x: number) => x + W / 2;
export const reached = (xs: readonly number[], star: number) => xs.some((x) => rightSide(x) >= star);

/**
 * A way to finish from the blocks already placed: positions for the rest that stand and touch the star,
 * or null if there isn't one (then the top block should come off). Searches every slot; the stacks are tiny.
 */
export function finish(placed: readonly number[], round: ReachRound): number[] | null {
  if (topples(placed, 0) !== -1) return null;
  if (reached(placed, round.star)) return [];
  if (placed.length >= round.blocks) return null;
  for (const x of [...SLOTS].sort((a, b) => b - a)) {
    const rest = finish([...placed, x], round);
    if (rest) return [x, ...rest];
  }
  return null;
}

// What a capable child does next (the ghost finger on the how-to card follows these) ----------------------------

/** On the basket levels: add a block while the tower is short of the target, ring the bell when it is exactly right, take one back if it is tall. */
export const stackMove = (have: number, want: number): 'add' | 'ring' | 'take' => (have < want ? 'add' : have > want ? 'take' : 'ring');

/** On "which tower will stand?": the tower whose every block has its own middle and the middle of the blocks above over the block below. */
export const standingTower = (round: StandRound): number => round.towers.findIndex((t) => topples(t, null) === -1);

/** On the reach levels: where the next block goes (eighths from the table edge), or undefined when no way on is left from these blocks. */
export const nextReach = (placed: readonly number[], round: ReachRound): number | undefined => finish(placed, round)?.[0];
