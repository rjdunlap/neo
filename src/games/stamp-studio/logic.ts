import type { ColorName } from '../../art/palette';
export type StampKind = 'star' | 'flower' | 'fish' | 'cat';
export interface Stamp { kind: StampKind; color: ColorName; x: number; y: number; size: number; turns: number }
export const LIMIT = 24;
export const PLANS = [
  { kinds: ['star'], color: false, move: false, transform: false, prompt: 'stars', name: 'Press big stars onto a picture' },
  { kinds: ['cat', 'fish'], color: false, move: false, transform: false, prompt: 'friends', name: 'Make an animal picture with two stamps' },
  { kinds: ['star', 'flower', 'fish'], color: true, move: true, transform: false, prompt: 'picture', name: 'Choose colors, stamp, and rearrange a picture' },
  { kinds: ['star', 'flower', 'fish', 'cat'], color: true, move: true, transform: true, prompt: 'sizes', name: 'Turn stamps and make them big or small' },
  { kinds: ['star', 'flower', 'fish', 'cat'], color: true, move: true, transform: true, prompt: 'garden', name: 'Make an imaginary garden, then tell its story' },
  { kinds: ['star', 'flower', 'fish', 'cat'], color: true, move: true, transform: true, prompt: 'story', name: 'Make two friends on an adventure; every story is welcome' },
] as const;
export const planFor = (level: number) => PLANS[Math.max(0, Math.min(PLANS.length - 1, level - 1))];
/** Normalized coordinates leave room for the largest stamp, including after resizing. */
export function place(x: number, y: number, width: number, height: number) {
  return { x: Math.max(0, Math.min(1, (x - 70) / (width - 140))), y: Math.max(0, Math.min(1, (y - 70) / (height - 140))) };
}
export const pixel = (s: Pick<Stamp, 'x' | 'y'>, width: number, height: number) => ({ x: 70 + s.x * (width - 140), y: 70 + s.y * (height - 140) });
