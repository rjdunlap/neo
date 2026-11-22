import type { Rng } from '../../engine/random';
import type { BandLevels } from '../../progress/difficulty';

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
export type TowerMode = 'tumble' | 'friend' | 'flag' | 'match' | 'stand' | 'reach' | 'mend';

export interface TowerPlan {
  mode: TowerMode;
  rounds: number;
  name: string;
}

export const PLANS: TowerPlan[] = [
  { mode: 'tumble', rounds: 2, name: 'Tap to stack blocks, then knock the tower down' },
  { mode: 'friend', rounds: 3, name: 'Stack until the tower is as tall as a friend, then knock it down' },
  { mode: 'flag', rounds: 3, name: 'Build up to the flag (3 to 6 blocks), then ring the bell' },
  {
    mode: 'match',
    rounds: 3,
    name: "Compare with Duck's tower: just as tall, one block taller, or one shorter",
  },
  {
    mode: 'stand',
    rounds: 3,
    name: 'Which tower will stand? Guess, then let go and see (a guess is never wrong)',
  },
  {
    mode: 'reach',
    rounds: 2,
    name: 'Stack blocks out past the table edge to touch the star without tipping',
  },
  {
    mode: 'mend',
    rounds: 2,
    name: 'Mend the leaning tower: move the top block so it stands, then let the ropes go',
  },
];

export const LEVELS: BandLevels = {
  lap: { min: 1, max: 2 },
  toddler: { min: 2, max: 3 },
  preschool: { min: 3, max: 4 },
  prek: { min: 4, max: 5 },
  // Mending one block is easier than level 6's open build, so school plays predict, mend, then reach.
  school: { min: 5, max: 7, order: [5, 7, 6] },
};

export const planFor = (level: number) => PLANS[Math.min(PLANS.length, Math.max(1, level)) - 1];

/** Eighths of a block in one block width. */
export const W = 8;

/**
 * Where a stack falls. `xs` are block middles from the bottom up, in eighths. The bottom block stands on the
 * ground (`edge` null: anything goes) or on a table at `edge`, extending inward from `direction` (default right). Returns the lowest block
 * that falls, taking everything above it along, or -1 if the whole stack stands.
 */
export function topples(xs: readonly number[], edge: number | null, direction: ReachDirection = 1): number {
  for (let k = 0; k < xs.length; k++) {
    const above = xs.slice(k);
    const middle = above.reduce((s, x) => s + x, 0) / above.length;
    if (k === 0) {
      if (edge !== null && direction * (middle - edge) >= 0) return 0;
    } else if (Math.abs(middle - xs[k - 1]) >= W / 2) return k;
  }
  return -1;
}

/** The middle of the blocks from `k` up: what has to be over block `k - 1`. */
export const middleFrom = (xs: readonly number[], k: number) =>
  xs.slice(k).reduce((s, x) => s + x, 0) / (xs.length - k);

// Measuring rounds --------------------------------------------------------------------------------

/** Friends, by how many blocks tall they stand. */
export const FRIEND_HEIGHT = { duck: 2, bunny: 3, pig: 4, bear: 5 } as const;
export type TowerFriend = keyof typeof FRIEND_HEIGHT;

export type Ask = 'same' | 'taller' | 'shorter';

export interface TowerRound {
  /** Blocks to stack (tumble, friend, flag), or what the child's tower should be (match). */
  target: number;
  friend?: TowerFriend;
  /** Match: the visitor's reference tower and what to make. */
  bear?: number;
  ask?: Ask;
}

export const targetFor = (bear: number, ask: Ask) =>
  bear + (ask === 'taller' ? 1 : ask === 'shorter' ? -1 : 0);

export function makeRounds(plan: TowerPlan, rng: Rng): TowerRound[] {
  const out: TowerRound[] = [];
  // Shuffle without replacement; refill in bounded work for longer caller-supplied plans.
  // If a new deck starts at the previous height, swap its first two cards, never reroll.
  let heights: number[] = [];
  let last: number | undefined;
  const fresh = () => {
    if (!heights.length) {
      heights = rng.shuffle([3, 4, 5, 6]);
      if (heights[0] === last) [heights[0], heights[1]] = [heights[1], heights[0]];
    }
    return (last = heights.shift()!);
  };
  const friends = rng.shuffle(Object.keys(FRIEND_HEIGHT) as TowerFriend[]);
  const asks = rng.shuffle<Ask>(['same', 'taller', 'shorter']);
  for (let r = 0; r < plan.rounds; r++) {
    if (plan.mode === 'tumble') out.push({ target: 6 });
    else if (plan.mode === 'friend') out.push({ target: FRIEND_HEIGHT[friends[r]], friend: friends[r] });
    else if (plan.mode === 'flag') out.push({ target: fresh() });
    else if (plan.mode === 'match') {
      const bear = fresh();
      out.push({ target: targetFor(bear, asks[r % 3]), bear, ask: asks[r % 3] });
    } else out.push({ target: 0 });
  }
  return out;
}

/** A tower that's too short or too tall, or just right. */
export const compare = (have: number, want: number): 'short' | 'tall' | 'right' =>
  have < want ? 'short' : have > want ? 'tall' : 'right';

// Which tower will stand? --------------------------------------------------------------------------

export interface StandRound {
  /** Block middles for each tower, bottom up, in eighths from the tower's own base. */
  towers: readonly (readonly number[])[];
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
  const falling = shapes.filter(
    (p) =>
      topples(tower(p), null) !== -1 &&
      (subtle ? Math.abs(reach(p) - reach(up)) <= 1 : reach(p) >= reach(up) + 2),
  );
  const down = rng.pick(falling);
  const dir = rng.chance(0.5) ? 1 : -1;
  const stands = rng.int(0, 1);
  const towers = stands === 0 ? [tower(up), tower(down)] : [tower(down), tower(up)];
  return { towers: towers.map((t) => t.map((x) => x * dir)), stands };
}

/** Canonical authored contrasts: equal blocks on the floor, positive lean. */
export const STAND_PAIRS = [
  { id: 'C1', up: [0, 1, 2], down: [0, 3, 6], fall: 1 },
  { id: 'C2', up: [0, 2, 3], down: [0, 2, 6], fall: 1 },
  { id: 'C3', up: [0, 1, 3], down: [0, 1, 6], fall: 2 },
  { id: 'M1', up: [0, 2, 5], down: [0, 1, 5], fall: 2 },
  { id: 'M2', up: [0, 2, 5], down: [0, 3, 5], fall: 1 },
  { id: 'M3', up: [0, 2, 4], down: [0, 0, 4], fall: 2 },
  { id: 'M4', up: [0, 3, 4], down: [0, 4, 4], fall: 1 },
] as const;
export type AuthoredStand = StandRound & { id: string; direction: number; color: number };
export function standVariant(
  pair: (typeof STAND_PAIRS)[number],
  direction: number,
  stands: number,
  color = 0,
): AuthoredStand {
  const towers = [pair.up, pair.down].map((t) => Object.freeze(t.map((x) => x * direction)));
  if (stands === 1) towers.reverse();
  return Object.freeze({ id: pair.id, direction, stands, color, towers: Object.freeze(towers) });
}

/** Finite shuffled pools, with one/two of each side and direction in every run. */
export function makeStandRounds(rng: Rng, school: boolean): AuthoredStand[] {
  const clear = rng.shuffle(STAND_PAIRS.slice(0, 3));
  const pairs = school ? [...clear.slice(0, 2), rng.pick(STAND_PAIRS.slice(3))] : clear;
  const sides = rng.shuffle([0, 1, rng.int(0, 1)]);
  const directions = rng.shuffle([-1, 1, rng.chance(0.5) ? 1 : -1]);
  return pairs.map((pair, i) => standVariant(pair, directions[i], sides[i], rng.int(0, 6)));
}

/** A release/replay records nothing; only Continue from a complete result records an observation. */
export class StandObservation {
  phase: 'held' | 'releasing' | 'result' | 'complete' = 'held';
  guess: number | null = null;
  observed = 0;
  release(guess: number): boolean {
    if (this.phase !== 'held' || (guess !== 0 && guess !== 1)) return false;
    this.guess = guess;
    this.phase = 'releasing';
    return true;
  }
  replay(): boolean {
    if (this.phase !== 'result') return false;
    this.phase = 'releasing';
    return true;
  }
  settle(): void {
    if (this.phase === 'releasing') this.phase = 'result';
  }
  continue(): boolean {
    if (this.phase !== 'result') return false;
    this.observed++;
    this.phase = this.observed === 3 ? 'complete' : 'held';
    this.guess = null;
    return true;
  }
}

// Reach the star -----------------------------------------------------------------------------------

export type ReachDirection = 1 | -1;
export type DirectedReachRound = ReachRound & { direction: ReachDirection };

/** Deal one outward reach on each side, keeping the original distances and budgets. */
export function makeReachRounds(rng: Rng): readonly DirectedReachRound[] {
  const directions = rng.shuffle<ReachDirection>([1, -1]);
  return Object.freeze(REACH.map((round, i) => Object.freeze({ ...round, direction: directions[i] })));
}

/** Project canonical outward eighths to screen units, and normalize before snapping. */
export const reachX = (u: number, edge: number, width: number, direction: ReachDirection) =>
  edge + (direction * u * width) / W;
export const reachDrop = (
  x: number,
  edge: number,
  width: number,
  direction: ReachDirection,
): number | null => {
  const u = (direction * (x - edge) * W) / width;
  return u < -2 * W || u > 1.6 * W ? null : reachSlot(u);
};

export interface ReachRound {
  blocks: number;
  /** How far past the table edge the star stands, in eighths. A block touches it with its outward side in canonical coordinates. */
  star: number;
}

/** Two blocks reaching half a block out (one block alone can't), then three reaching five eighths. */
export const REACH: ReachRound[] = [
  { blocks: 2, star: 4 },
  { blocks: 3, star: 5 },
];

/** Positions blocks can be dropped at, relative to the table edge (a little either side of it). */
export const SLOTS = Array.from({ length: 2 * W + W / 2 + 1 }, (_, i) => i - W - W / 2);

/** Snap a horizontal drag (in eighths) to the same domain searched by hints and the finger bot. */
export const reachSlot = (x: number) =>
  Math.max(SLOTS[0], Math.min(SLOTS[SLOTS.length - 1], Math.round(x))) || 0;

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
export const stackMove = (have: number, want: number): 'add' | 'ring' | 'take' =>
  have < want ? 'add' : have > want ? 'take' : 'ring';

/** On "which tower will stand?": the tower whose every block has its own middle and the middle of the blocks above over the block below. */
export const standingTower = (round: StandRound): number =>
  round.towers.findIndex((t) => topples(t, null) === -1);

/** On the mend level: where the top block goes (the hint's slot, which always stands). */
export const nextMend = (task: Pick<DirectedMend, 'tower'>): number => mendHint(task);

/** On the reach levels: where the next block goes (eighths from the table edge), or undefined when no way on is left from these blocks. */
export const nextReach = (placed: readonly number[], round: ReachRound): number | undefined =>
  finish(placed, round)?.[0];

// Mend the leaning tower ----------------------------------------------------------------------------

/**
 * Level 7: a tower that would tumble is held up by ropes; she slides only the top block along the block below, then
 * lets go. Authored canonical towers (leaning right, floor under the bottom block); every dealt tower falls from block
 * 1, and every task has failing slots on both sides of the standing window (docs/definitions/block-tower-mend.md).
 */
export interface MendTask {
  id: string;
  tower: readonly number[];
}

export const MEND_TASKS: readonly MendTask[] = Object.freeze([
  { id: 'T1', tower: [0, 3, 6] },
  { id: 'T2', tower: [0, 2, 6] },
  // The definition's T3 was [0, 4, 5], but its base alone falls (a middle on the edge), so the top block was a
  // counterweight, level 8's idea. Only bases [0, 2] and [0, 3] keep a standing base and fail both ways; [0, 3, 9]
  // deals the top block furthest out, so the mend is the longest slide back.
  { id: 'T3', tower: [0, 3, 9] },
  { id: 'Q1', tower: [0, 2, 5, 7] },
  { id: 'Q2', tower: [0, 2, 4, 8] },
  { id: 'Q3', tower: [0, 3, 4, 7] },
]);

/** A dealt task: the tower in screen-direction eighths (canonical times `direction`), and a block colour start. */
export interface DirectedMend {
  id: string;
  direction: ReachDirection;
  tower: readonly number[];
  color: number;
}

export const mendTask = (task: MendTask, direction: ReachDirection, color = 0): DirectedMend =>
  Object.freeze({
    id: task.id,
    direction,
    color,
    tower: Object.freeze(task.tower.map((x) => x * direction || 0)),
  });

/** The blocks that never move: everything under the top one. */
export const mendBase = (task: Pick<DirectedMend, 'tower'>) => task.tower.slice(0, -1);
/** Where the top block was dealt. */
export const mendStart = (task: Pick<DirectedMend, 'tower'>) => task.tower[task.tower.length - 1];

/** The top block's slots: within seven eighths of the block below, so it always rests on that block. */
export function mendDomain(task: Pick<DirectedMend, 'tower'>): number[] {
  const base = mendBase(task);
  const b = base[base.length - 1];
  return Array.from({ length: 2 * (W - 1) + 1 }, (_, i) => b - (W - 1) + i);
}

/** Snap a drop (in eighths) into the domain: the nearest whole slot, clamped to its ends. */
export function mendSlot(task: Pick<DirectedMend, 'tower'>, x: number): number {
  const d = mendDomain(task);
  return Math.max(d[0], Math.min(d[d.length - 1], Math.round(x))) || 0;
}

/** The domain slots where the whole tower stands. */
export const mendRepairs = (task: Pick<DirectedMend, 'tower'>): number[] =>
  mendDomain(task).filter((x) => topples([...mendBase(task), x], null) === -1);

/** The middle of the standing window (the one nearer the base when the count is even): the most room either side. */
export function mendHint(task: Pick<DirectedMend, 'tower'>): number {
  const r = mendRepairs(task);
  const lower = r[(r.length - 1) >> 1];
  const upper = r[r.length >> 1];
  const b = mendBase(task)[0];
  return Math.abs(lower - b) <= Math.abs(upper - b) ? lower : upper;
}

/** One three-block task then one four-block task, one leaning each way, with a seeded colour start. */
export function makeMendRounds(rng: Rng): readonly DirectedMend[] {
  const three = rng.pick(MEND_TASKS.slice(0, 3));
  const four = rng.pick(MEND_TASKS.slice(3));
  const directions = rng.shuffle<ReachDirection>([1, -1]);
  return Object.freeze([three, four].map((t, i) => mendTask(t, directions[i], rng.int(0, 6))));
}

/**
 * One task's state. Moves and undo work while `held`; Let go at the dealt slot releases nothing; a tumble is one
 * unsuccessful trial (never a miss), and two of them make the hint due. Watch again replays without counting.
 */
export class MendTrial {
  phase: 'held' | 'releasing' | 'result' | 'stood' = 'held';
  readonly start: number;
  top: number;
  moves: number[] = [];
  failed = 0;
  hinted = false;
  private replaying = false;
  constructor(readonly task: DirectedMend) {
    this.start = this.top = mendStart(task);
  }
  /** Records a move to `x` (already snapped); false for a move outside the domain, to the same slot, or while not held. */
  move(x: number): boolean {
    if (this.phase !== 'held' || x === this.top || !mendDomain(this.task).includes(x)) return false;
    // Back at the dealt slot is a fresh start: nothing left to undo.
    if (x === this.start) this.moves = [];
    else this.moves.push(this.top);
    this.top = x;
    return true;
  }
  undo(): boolean {
    if (this.phase !== 'held' || !this.moves.length) return false;
    this.top = this.moves.pop()!;
    return true;
  }
  get canUndo() {
    return this.phase === 'held' && this.moves.length > 0;
  }
  /** The tower as it stands now. */
  get tower(): number[] {
    return [...mendBase(this.task), this.top];
  }
  get stands() {
    return topples(this.tower, null) === -1;
  }
  /** False (and nothing released) at the dealt slot. */
  letGo(): boolean {
    if (this.phase !== 'held' || this.top === this.start) return false;
    this.phase = 'releasing';
    return true;
  }
  /** The release has played out: a stand ends the task, a tumble counts one trial (a replay counts nothing). */
  settle(): void {
    if (this.phase !== 'releasing') return;
    if (this.stands) this.phase = 'stood';
    else {
      if (!this.replaying) this.failed++;
      this.phase = 'result';
    }
    this.replaying = false;
  }
  watchAgain(): boolean {
    if (this.phase !== 'result') return false;
    this.phase = 'releasing';
    this.replaying = true;
    return true;
  }
  /** Ropes back on, top block where she left it. */
  tryAgain(): boolean {
    if (this.phase !== 'result') return false;
    this.phase = 'held';
    return true;
  }
  get hintDue() {
    return this.failed >= 2;
  }
}
