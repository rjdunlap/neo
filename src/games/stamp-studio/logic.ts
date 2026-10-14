import type { ColorName } from '../../art/palette';
import { STAMP_KINDS, type StampKindId } from '../../content/creations';
import { Rng } from '../../engine/random';
export { STAMP_KINDS };
export type StampKind = StampKindId;
export const STAMP_NAMES: Record<StampKind, string> = { star: 'A star', flower: 'A flower', fish: 'A fish', cat: 'A cat' };

/** Saved sticker seeds always use these original four kinds and colors, in their historical order. */
const STICKER_KINDS = STAMP_KINDS.slice(0, 4);
const STICKER_COLORS = ['purple', 'pink', 'blue', 'green'] as const;
export function stickerStamp(seed: number) {
  return { kind: new Rng(seed).pick(STICKER_KINDS), color: new Rng(seed + 3).pick(STICKER_COLORS) };
}
export interface Stamp { kind: StampKind; color: ColorName; x: number; y: number; size: number; turns: number }
export const LIMIT = 24;
export interface StampPlan {
  kinds: readonly StampKind[];
  color: boolean;
  move: boolean;
  transform: boolean;
  prompt: 'pats' | 'stars' | 'friends' | 'picture' | 'sizes' | 'garden' | 'story';
  name: string;
  /** Every stamp is pressed at this size, and this many of them finish the picture (the lap level). */
  pat?: { size: number; count: number };
}
/** Each pat is a stamp of 170 units across (the art's radius is 48 at size 1); the eighth finishes the picture. */
export const PAT = { size: 85 / 48, count: 8 } as const;
export const PLANS = [
  { kinds: ['star'], color: false, move: false, transform: false, prompt: 'stars', name: 'Press one kind of stamp onto a picture' },
  { kinds: ['cat', 'fish'], color: false, move: false, transform: false, prompt: 'friends', name: 'Make a picture with two kinds of stamps' },
  { kinds: ['star', 'flower', 'fish'], color: true, move: true, transform: false, prompt: 'picture', name: 'Choose colors, stamp, and rearrange a picture' },
  { kinds: ['star', 'flower', 'fish', 'cat'], color: true, move: true, transform: true, prompt: 'sizes', name: 'Turn stamps and make them big or small' },
  { kinds: ['star', 'flower', 'fish', 'cat'], color: true, move: true, transform: true, prompt: 'garden', name: 'Make an imaginary garden, then tell its story' },
  { kinds: ['star', 'flower', 'fish', 'cat'], color: true, move: true, transform: true, prompt: 'story', name: 'Make two friends on an adventure; every story is welcome' },
  // Easiest of all: placed first for lap by `order`, so it has the highest ID.
  { kinds: ['star'], color: false, move: false, transform: false, prompt: 'pats', name: 'Pat the paper: eight big soft stamps make a picture', pat: PAT },
] as const satisfies readonly StampPlan[];
export const planFor = (level: number) => PLANS[Math.max(0, Math.min(PLANS.length - 1, level - 1))];
/** Normalized coordinates leave room for the largest stamp, including after resizing. */
export function place(x: number, y: number, width: number, height: number) {
  return { x: Math.max(0, Math.min(1, (x - 70) / (width - 140))), y: Math.max(0, Math.min(1, (y - 70) / (height - 140))) };
}
export const pixel = (s: Pick<Stamp, 'x' | 'y'>, width: number, height: number) => ({ x: 70 + s.x * (width - 140), y: 70 + s.y * (height - 140) });

/** The colors on the color buttons, in order. */
export const STAMP_COLORS: ColorName[] = ['purple', 'blue', 'green', 'pink'];

/** Early rounds vary their existing tools without adding simultaneous choices. */
export function roundPlan(level: number, rng: Rng): { plan: StampPlan; color: ColorName } {
  const base = planFor(level);
  if (level > 3) return { plan: base, color: 'purple' };
  return {
    plan: { ...base, kinds: rng.shuffle([...STAMP_KINDS]).slice(0, base.kinds.length) },
    color: rng.pick(STAMP_COLORS),
  };
}

/** What the demonstration needs to see of the sheet to know its next move. */
export interface StampState {
  stamps: Pick<Stamp, 'x' | 'y' | 'size' | 'turns'>[];
  /** The stamp and color picked now. */
  kind: StampKind;
  color: ColorName;
}

export type StampMove =
  | { do: 'kind'; kind: StampKind }
  | { do: 'color'; color: ColorName }
  | { do: 'stamp'; x: number; y: number }
  | { do: 'turn' }
  | { do: 'grow' }
  | { do: 'move'; stamp: number; x: number; y: number }
  | { do: 'finish' };

/**
 * Where the demonstration presses its five stamps, in the sheet's own 0 to 1 coordinates. At the smallest sheet they are at least
 * 190 units apart, so no stamp lands on another (a stamp's touch circle is 55 units wide).
 */
/** Where the demonstration pats the paper at the lap level: two rows of four. */
export const PAT_SPOTS = [0.12, 0.37, 0.63, 0.88].flatMap(x => [{ x, y: 0.25 }, { x, y: 0.8 }]);
export const DEMO_SPOTS = [{ x: 0.15, y: 0.25 }, { x: 0.5, y: 0.2 }, { x: 0.85, y: 0.25 }, { x: 0.3, y: 0.8 }, { x: 0.7, y: 0.8 }] as const;
const DEMO_COLORS: ColorName[] = ['purple', 'blue', 'green', 'pink', 'purple'];
/** On a level where stamps move, the first stamp is carried to the middle. */
const DEMO_MOVE = { stamp: 0, x: 0.5, y: 0.55 } as const;

/**
 * The next thing a capable child does to make a small picture at this level, from the sheet as it is: choose a stamp (and color,
 * where the level has colors) for each of five presses, turn the third and make the fourth big where a level has those buttons,
 * carry the first to the middle where stamps move, then press the green arrow. Nothing here is a right or wrong answer.
 */
export function stampDemo(plan: StampPlan, st: StampState): StampMove {
  const n = st.stamps.length;
  if (plan.pat) return n < plan.pat.count ? { do: 'stamp', ...PAT_SPOTS[n] } : { do: 'finish' };
  const last = st.stamps[n - 1];
  if (plan.transform && n === 3 && last.turns === 0) return { do: 'turn' };
  if (plan.transform && n === 4 && last.size === 1) return { do: 'grow' };
  if (n < DEMO_SPOTS.length) {
    const kind = plan.kinds[n % plan.kinds.length];
    if (st.kind !== kind) return { do: 'kind', kind };
    if (plan.color && st.color !== DEMO_COLORS[n]) return { do: 'color', color: DEMO_COLORS[n] };
    return { do: 'stamp', ...DEMO_SPOTS[n] };
  }
  if (plan.move && Math.abs(st.stamps[DEMO_MOVE.stamp].x - DEMO_MOVE.x) > 0.02) return { do: 'move', ...DEMO_MOVE };
  return { do: 'finish' };
}
