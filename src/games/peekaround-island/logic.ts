import type { CritterName } from '../../art/critter';
import type { Rng } from '../../engine/random';

/**
 * Peekaround Island, after Captain Toad's little dioramas: a round island turns a quarter at a
 * time, and whoever stands behind the big tree is hidden until you look from another side.
 *
 * The island has four spots, numbered 0–3 a quarter turn apart in the island's own frame. After
 * `turns` quarter turns, spot s faces direction (s + turns) mod 4 from where the child sits:
 * 0 is in front of the tree, 2 behind it, and 1 and 3 next to it. "In front" and "behind" are
 * always from the child's side, so turning the island changes who is where.
 */
export type PeekMode = 'find' | 'named' | 'who' | 'place' | 'two';

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
  { mode: 'place', rounds: 4, name: 'Put a friend behind, in front of, or next to the tree' },
  { mode: 'two', rounds: 2, name: 'Two directions at once, then the island turns around: who is in front now?' },
];

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
 * The next placement request: a where that some free spot fits, preferring one not asked yet so
 * all three words come up. Returns the spot it was chosen from (any spot with that where fits).
 */
export function nextRequest(free: number[], turns: number, asked: Where[], rng: Rng): { where: Where; spot: number } {
  const options = rng.shuffle(free.map((spot) => ({ spot, where: whereIs(spot, turns) })));
  return options.find((o) => !asked.includes(o.where)) ?? options[0];
}

/** Whether a drop on `spot` answers the request. */
export const fits = (where: Where, spot: number, turns: number) => whereIs(spot, turns) === where;

export interface PeekTouchFriend {
  name: CritterName;
  spot: number;
  want?: Where;
}

export type PeekTouch =
  | { kind: 'turn'; dir: 1 }
  | { kind: 'friend'; name: CritterName }
  | { kind: 'tile'; name: CritterName }
  | { kind: 'place'; name: CritterName; spot: number };

/** The next visible control a capable child uses for each of the five perspective modes. */
export function peekTouch(mode: PeekMode, turns: number, hider: CritterName | null, friends: readonly PeekTouchFriend[]): PeekTouch | null {
  if (mode === 'find' || mode === 'named') {
    const hidden = hider && friends.find((f) => f.name === hider && f.spot >= 0);
    if (!hidden) return null;
    return whereIs(hidden.spot, turns) === 'behind' ? { kind: 'turn', dir: 1 } : { kind: 'friend', name: hidden.name };
  }
  if (mode === 'who') return hider ? { kind: 'tile', name: hider } : null;
  const waiting = friends.find((f) => f.spot < 0 && f.want);
  if (!waiting) return null;
  const free = [0, 1, 2, 3].filter((spot) => !friends.some((f) => f.spot === spot));
  const spot = free.find((s) => fits(waiting.want!, s, turns));
  return spot === undefined ? null : { kind: 'place', name: waiting.name, spot };
}
