import type { ParticleKind } from '../art/particles';
import { swatch } from '../art/palette';
import type { LandId } from './lands';

/** The sound a location's ground makes when tapped: an `sfx` call by name, with its argument where it takes one. */
export type TapSound =
  | { call: 'bell' | 'marimba' | 'pluck' | 'chirp'; steps: readonly number[] }
  | { call: 'splash' | 'whoosh' | 'sparkle' | 'brush' | 'boing' | 'gull' | 'ribbit' | 'squeak' }
  | { call: 'animal'; kinds: readonly ('cluck' | 'moo' | 'quack' | 'oink' | 'baa')[] };

/**
 * What tapping a location's own ground does (2026-11-28, "things happening" when you tap): a burst in the place's own
 * stuff and a sound. Never a round, never a way out, and the games, the resident and the corner buttons keep their own
 * taps over it.
 */
export interface GroundTap {
  kind: ParticleKind;
  colors: readonly number[];
  sound: TapSound;
  /** Pixels per second squared; negative floats up (bubbles, fireflies). */
  gravity: number;
  count: number;
  /** Up and fanned (the default), or all round. */
  fan?: boolean;
}

export const GROUND_TAPS: Record<LandId, GroundTap> = {
  'rainbow-meadow': {
    kind: 'heart',
    colors: [swatch.pink.fill, swatch.yellow.fill, swatch.purple.fill, swatch.orange.fill],
    sound: { call: 'chirp', steps: [10, 12, 14, 17] },
    gravity: -40,
    count: 7,
  },
  'counting-cove': {
    kind: 'dot',
    colors: [swatch.blue.fill, swatch.teal.fill, 0xffffff],
    sound: { call: 'splash' },
    gravity: 600,
    count: 14,
    fan: true,
  },
  'puzzle-peaks': {
    kind: 'dot',
    colors: [0xffffff, swatch.blue.light],
    sound: { call: 'whoosh' },
    gravity: 120,
    count: 16,
  },
  'bubble-beach': {
    kind: 'ring',
    colors: [swatch.teal.light, swatch.blue.light, 0xffffff],
    sound: { call: 'pluck', steps: [7, 9, 11, 14] },
    gravity: -90,
    count: 8,
    fan: true,
  },
  'music-mountain': {
    kind: 'note',
    colors: [swatch.purple.fill, swatch.blue.fill, swatch.red.fill],
    sound: { call: 'marimba', steps: [0, 2, 4, 7, 9] },
    gravity: -30,
    count: 5,
    fan: true,
  },
  treehouse: {
    kind: 'confetti',
    colors: [swatch.red.fill, swatch.yellow.fill, swatch.blue.fill, swatch.green.fill],
    sound: { call: 'brush' },
    gravity: 400,
    count: 14,
  },
  'cozy-village': {
    kind: 'confetti',
    colors: [swatch.orange.fill, swatch.yellow.fill, swatch.green.fill, swatch.brown.fill],
    sound: { call: 'chirp', steps: [8, 12, 15] },
    gravity: 140,
    count: 10,
  },
  'story-grove': {
    kind: 'star',
    colors: [swatch.yellow.fill, swatch.yellow.light],
    sound: { call: 'bell', steps: [9, 11, 14, 16] },
    gravity: -20,
    count: 9,
    fan: true,
  },
  'tinker-lab': {
    kind: 'star',
    colors: [swatch.yellow.fill, swatch.orange.fill, 0xffffff],
    sound: { call: 'sparkle' },
    gravity: 500,
    count: 12,
  },
  barnyard: {
    kind: 'confetti',
    colors: [swatch.yellow.fill, swatch.yellow.light, swatch.brown.light],
    sound: { call: 'animal', kinds: ['cluck', 'moo', 'quack', 'oink', 'baa'] },
    gravity: 300,
    count: 10,
  },
  'lantern-lake': {
    kind: 'ring',
    colors: [swatch.yellow.light, swatch.orange.light],
    sound: { call: 'bell', steps: [4, 7, 11] },
    gravity: -25,
    count: 4,
    fan: true,
  },
};

/** The n-th tap's sound in a place: a pitched sound walks its steps, an animal place takes its animals in turn. */
export function tapSound(sound: TapSound, n: number): { call: string; arg?: number | string } {
  if ('steps' in sound) return { call: sound.call, arg: sound.steps[n % sound.steps.length] };
  if ('kinds' in sound) return { call: sound.call, arg: sound.kinds[n % sound.kinds.length] };
  return { call: sound.call };
}
