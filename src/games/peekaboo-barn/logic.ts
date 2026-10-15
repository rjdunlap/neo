import type { Rng } from '../../engine/random';

// Saved stickers and the icon keep their original pool, even if play gains new friends.
export const STICKER_ANIMALS = ['cow', 'duck', 'pig', 'cat', 'dog', 'bunny', 'bear'] as const;
export const ANIMALS = [...STICKER_ANIMALS] as const;
export type Animal = (typeof ANIMALS)[number];

export interface PeekPlan {
  /** free: tap to reveal. find: animals peek, "where's the cow?". remember: they show, hide, then the question. */
  mode: 'free' | 'find' | 'remember';
  spots: number;
  /** Reveals (free) or questions (find, remember). */
  goal: number;
  /** One door: a single big house, and a touch anywhere opens it. */
  door?: boolean;
}

/** The lap entry below level 1; its saved ID follows the original eight (see `order` in the band table). */
export const ONE_DOOR_LEVEL = 16;
export const SELF_OPEN_SECONDS = 6;

export const PLANS: PeekPlan[] = [
  { mode: 'free', spots: 3, goal: 8 },
  { mode: 'free', spots: 4, goal: 12 },
  { mode: 'find', spots: 2, goal: 5 },
  { mode: 'find', spots: 3, goal: 6 },
  { mode: 'find', spots: 4, goal: 6 },
  { mode: 'remember', spots: 2, goal: 5 },
  { mode: 'remember', spots: 3, goal: 5 },
  { mode: 'remember', spots: 4, goal: 6 },
];

const ONE_DOOR: PeekPlan = { mode: 'free', spots: 1, goal: 6, door: true };

export const planFor = (level: number) => (level === ONE_DOOR_LEVEL ? ONE_DOOR : PLANS[Math.min(PLANS.length, Math.max(1, level)) - 1]);

/** A different animal behind each hiding place. */
export const deal = (rng: Rng, spots: number): Animal[] => rng.shuffle([...ANIMALS]).slice(0, spots);

/** Who to ask for: someone hiding now, and not the same friend as last time. */
export function pickTarget(rng: Rng, present: readonly Animal[], last: Animal | null): Animal {
  const fresh = present.filter((a) => a !== last);
  return rng.pick(fresh.length ? fresh : present);
}

/** Free play: someone new sneaks in, never the same as anyone already out. */
export const newcomer = (rng: Rng, taken: readonly Animal[]): Animal => rng.pick(ANIMALS.filter((a) => !taken.includes(a)));

/**
 * Which hiding place a capable child taps next, or null while she waits. Asked for someone (find, remember): the place that
 * hides them. Free play: the next place after the one she tapped last (so she visits them all) that has nobody out already.
 * `poses` are the places' poses left to right ('hidden', 'peek' or 'out'), `animals` who is behind each.
 */
export function spotToTap(plan: PeekPlan, poses: readonly string[], animals: readonly Animal[], target: Animal | null, last: number): number | null {
  if (plan.mode !== 'free') {
    const i = animals.indexOf(target as Animal);
    return target && i >= 0 ? i : null;
  }
  for (let k = 1; k <= poses.length; k++) {
    const i = (last + k) % poses.length;
    if (poses[i] !== 'out') return i;
  }
  return null;
}

export const COVER_NAMES = { hay: 'haystack', bush: 'bush', door: 'door', crate: 'crate', flowerpot: 'flowerpot', sunflower: 'sunflower', wheelbarrow: 'wheelbarrow', rock: 'rock', blanket: 'blanket', toybox: 'toy box', curtain: 'curtain', bed: 'bed', umbrella: 'umbrella', sandcastle: 'sandcastle', bucket: 'bucket', towel: 'towel' } as const;
export type CoverKind = keyof typeof COVER_NAMES;

/** Among overlapping hit boxes, choose the closest center; equal distances keep the left place. */
export function nearestSpot(x: number, y: number, spots: readonly { x: number; y: number; scale: number }[]): number | null {
  let best: number | null = null;
  let distance = Infinity;
  spots.forEach((s, i) => {
    const dx = (x - s.x) / s.scale;
    const dy = (y - s.y) / s.scale;
    if (Math.abs(dx) > 130 || dy < -340 || dy > 10) return;
    const d = Math.abs(x - s.x);
    if (d < distance) { best = i; distance = d; }
  });
  return best;
}

/** A nudge invites a touch, never awards a reveal or interrupts an animal already showing. */
export const shouldNudge = (plan: PeekPlan, idle: number, poses: readonly string[], busy: boolean) =>
  plan.mode === 'free' && !plan.door && idle >= SELF_OPEN_SECONDS && !busy && poses.every((pose) => pose === 'hidden');

/** One door opens by itself when she has not touched for a while; that reveal never counts toward the round. */
export const shouldSelfOpen = (plan: PeekPlan, idle: number, poses: readonly string[], busy: boolean) =>
  !!plan.door && idle >= SELF_OPEN_SECONDS && !busy && poses.every((pose) => pose === 'hidden');

export const SCENES = {
  barnyard: ['hay', 'bush', 'door', 'crate'],
  garden: ['flowerpot', 'sunflower', 'wheelbarrow', 'rock'],
  beach: ['umbrella', 'sandcastle', 'bucket', 'towel'],
  bedroom: ['blanket', 'toybox', 'curtain', 'bed'],
} as const satisfies Record<string, readonly CoverKind[]>;
export type SceneId = keyof typeof SCENES;

/** One seeded setting per round, with distinct places at every existing level. */
export function roundScene(rng: Rng, spots: number) {
  const id = rng.pick(Object.keys(SCENES) as SceneId[]);
  return { id, covers: rng.shuffle([...SCENES[id]]).slice(0, spots) };
}
