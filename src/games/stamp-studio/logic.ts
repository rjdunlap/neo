import { spread } from '../../engine/view';
import type { BandLevels } from '../../progress/difficulty';
import type { ColorName } from '../../art/palette';
import { STAMP_KINDS, type SceneId, type StampKindId } from '../../content/creations';
import { Rng } from '../../engine/random';
import { stepFromUnit } from '../../audio/notes';
import type { AnimalSound } from '../../audio/sfx';
import { leafOutline } from '../fossil-dig/logic';
export { STAMP_KINDS };
export type { SceneId };
export type StampKind = StampKindId;
export const STAMP_NAMES: Record<StampKind, string> = {
  star: 'A star',
  flower: 'A flower',
  fish: 'A fish',
  cat: 'A cat',
  duck: 'A duck',
  // Every name takes "A", so `animalWord` can drop two letters; a later "An apple" or "An ant" needs that revisited.
  whale: 'A whale',
  crab: 'A crab',
  starfish: 'A starfish',
  shell: 'A shell',
  boat: 'A boat',
  cow: 'A cow',
  pig: 'A pig',
  hen: 'A hen',
  barn: 'A barn',
  butterfly: 'A butterfly',
  ladybug: 'A ladybug',
  snail: 'A snail',
  sunflower: 'A sunflower',
  tree: 'A tree',
  moon: 'A moon',
  rocket: 'A rocket',
  planet: 'A planet',
  comet: 'A comet',
  ufo: 'A UFO',
};

/**
 * A stamp set: six stamps that belong together and the scene they stand on. Sets are all open from the start, nothing
 * unlocks. The four original stamps each joined a set (fish Sea, cat Farm, flower Garden, star Space); Plain stays as
 * blank paper with the classic four, in the sets row only.
 */
export interface StampSet {
  name: string;
  kinds: readonly StampKind[];
  scene: SceneId;
}
export const SETS = {
  sea: {
    name: 'Sea',
    kinds: ['fish', 'whale', 'crab', 'starfish', 'shell', 'boat'],
    scene: 'sea',
  },
  farm: {
    name: 'Farm',
    kinds: ['cat', 'cow', 'pig', 'duck', 'hen', 'barn'],
    scene: 'farm',
  },
  garden: {
    name: 'Garden',
    kinds: ['flower', 'butterfly', 'ladybug', 'snail', 'sunflower', 'tree'],
    scene: 'garden',
  },
  space: {
    name: 'Space',
    kinds: ['star', 'moon', 'rocket', 'planet', 'comet', 'ufo'],
    scene: 'space',
  },
} as const satisfies Record<string, StampSet>;
export type SetId = keyof typeof SETS;
export type SetChoice = 'plain' | SetId;
/** The sets a level 4–6 player can switch between from the sets button. */
export const SET_CHOICES: readonly SetChoice[] = ['plain', 'sea', 'farm', 'garden', 'space'];
/** The classic four stamps shown on plain paper at levels 4–6 before switching sets. */
export const CLASSIC_KINDS: readonly StampKind[] = ['star', 'flower', 'fish', 'cat'];
/** What a choice in the sets row shows: its label, stamp palette, and optional backdrop. */
export function setChoiceInfo(choice: SetChoice): {
  name: string;
  kinds: readonly StampKind[];
  scene?: SceneId;
} {
  if (choice === 'plain') return { name: 'Plain', kinds: CLASSIC_KINDS };
  const s = SETS[choice];
  return { name: s.name, kinds: s.kinds, scene: s.scene };
}
/** The backdrop each scene paints behind the stamps: where its horizon sits on the paper (0 top to 1 bottom). */
export const SCENES = {
  sea: { name: 'The sea', horizon: 0.82 },
  farm: { name: 'The farm', horizon: 0.42 },
  garden: { name: 'The garden', horizon: 0.5 },
  space: { name: 'Space', horizon: 0.88 },
} as const satisfies Record<SceneId, { name: string; horizon: number }>;
/** The sets a seeded round at levels 1–3 draws from: every set has its backdrop, so Plain gives way there. */
export const SEEDED_SETS: readonly SetId[] = ['sea', 'farm', 'garden', 'space'];
/** The stamps from before sets existed, which Follow the sparkle (level 10) still draws from on plain paper. */
export const PLAIN_KINDS: readonly StampKind[] = STAMP_KINDS.slice(0, 5);
/** Plain noun for a stamp kind ("duck", "cat", "fish"), used inside spoken prompts. */
export const animalWord = (kind: StampKind) => STAMP_NAMES[kind].slice(2);

/** Saved sticker seeds always use these original four kinds and colors, in their historical order. */
const STICKER_KINDS = STAMP_KINDS.slice(0, 4);
const STICKER_COLORS = ['purple', 'pink', 'blue', 'green'] as const;
export function stickerStamp(seed: number) {
  return { kind: new Rng(seed).pick(STICKER_KINDS), color: new Rng(seed + 3).pick(STICKER_COLORS) };
}
export interface Stamp {
  kind: StampKind;
  color: ColorName;
  x: number;
  y: number;
  size: number;
  turns: number;
}
export const LIMIT = 24;
export interface StampPlan {
  kinds: readonly StampKind[];
  color: boolean;
  move: boolean;
  transform: boolean;
  prompt:
    | 'pats'
    | 'sparkle'
    | 'stars'
    | 'friends'
    | 'picture'
    | 'sizes'
    | 'garden'
    | 'story'
    | 'leaf'
    | 'feet'
    | 'ask';
  name: string;
  /** Every stamp is pressed at this size, and this many of them finish the picture (the lap level). */
  pat?: { size: number; count: number };
  /** Follow the sparkle (level 10): a glowing spot shows where to tap; this many stamps finish the picture. */
  follow?: { count: number };
  /** Stamp a duck! (level 11): the voice asks for this many distinct animals in turn, then free play. */
  ask?: { count: number };
  /** A music-note button plays the picture back, left to right. */
  play?: boolean;
  /** The stamps on the paper are counted aloud, one to ten, each number once (levels 1–3, dive slice 3). */
  count?: boolean;
  /** Levels 4–6: a sets button lets her switch stamp sets and scenes freely (dive slice 6). */
  sets?: boolean;
  /** Trace Prints (levels 8–9): the paper is mud, and each maker presses its own shape; `count` prints finish the round. */
  trace?: { makers: readonly TraceMakerId[]; count: number; tilt: boolean };
}
/** Each pat is a stamp of 170 units across (the art's radius is 48 at size 1); the eighth finishes the picture. */
export const PAT = { size: 85 / 48, count: 8 } as const;
export const PLANS = [
  {
    kinds: ['star'],
    color: false,
    move: false,
    transform: false,
    prompt: 'stars',
    count: true,
    name: 'Press one kind of stamp onto a picture',
  },
  {
    kinds: ['cat', 'fish'],
    color: false,
    move: false,
    transform: false,
    prompt: 'friends',
    count: true,
    name: 'Make a picture with two kinds of stamps',
  },
  {
    kinds: ['star', 'flower', 'fish'],
    color: true,
    move: true,
    transform: false,
    prompt: 'picture',
    count: true,
    play: true,
    name: 'Choose colors, stamp, and rearrange a picture',
  },
  {
    kinds: ['star', 'flower', 'fish', 'cat'],
    color: true,
    move: true,
    transform: true,
    prompt: 'sizes',
    play: true,
    sets: true,
    name: 'Turn stamps and make them big or small',
  },
  {
    kinds: ['star', 'flower', 'fish', 'cat'],
    color: true,
    move: true,
    transform: true,
    prompt: 'garden',
    play: true,
    sets: true,
    name: 'Make an imaginary garden, then tell its story',
  },
  {
    kinds: ['star', 'flower', 'fish', 'cat'],
    color: true,
    move: true,
    transform: true,
    prompt: 'story',
    play: true,
    sets: true,
    name: 'Make two friends on an adventure; every story is welcome',
  },
  // Easiest of all: placed first for lap by `order`, so it has the highest ID.
  {
    kinds: ['star'],
    color: false,
    move: false,
    transform: false,
    prompt: 'pats',
    name: 'Pat the paper: eight big soft stamps make a picture',
    pat: PAT,
  },
  // Trace Prints: fresh prints in mud, appended so levels 1–7 keep their IDs (lap and toddler reach them through `order`).
  {
    kinds: [],
    color: false,
    move: false,
    transform: false,
    prompt: 'leaf',
    name: 'Leaf prints: pat the mud and the leaf leaves its shape',
    trace: { makers: ['leaf'], count: 8, tilt: true },
  },
  {
    kinds: [],
    color: false,
    move: false,
    transform: false,
    prompt: 'feet',
    name: 'Two feet: a duck foot and a cat paw each leave their own print',
    trace: { makers: ['duck', 'paw'], count: 10, tilt: false },
  },
  // Follow the sparkle: one glowing spot at a time, so it sits between levels 1 and 2 by `order` and has the highest ID.
  {
    kinds: ['star'],
    color: false,
    move: false,
    transform: false,
    prompt: 'sparkle',
    name: 'Follow the sparkle: tap the glowing spot and a stamp lands there',
    follow: { count: 5 },
  },
  // Stamp a duck!: three animal stamps with sounds; three asks in a round, then free (between 2 and 3 for toddler).
  {
    kinds: ['cat', 'fish', 'duck'],
    color: false,
    move: false,
    transform: false,
    prompt: 'ask',
    name: 'Stamp a duck!: find the animal the voice asks for',
    ask: { count: 3 },
  },
] as const satisfies readonly StampPlan[];
export const planFor = (level: number): StampPlan =>
  PLANS[Math.max(0, Math.min(PLANS.length - 1, level - 1))];
/** Normalized coordinates leave room for the largest stamp (or, with its margin, a whole print), including after resizing. */
export function place(x: number, y: number, width: number, height: number, margin = 70) {
  return {
    x: Math.max(0, Math.min(1, (x - margin) / (width - 2 * margin))),
    y: Math.max(0, Math.min(1, (y - margin) / (height - 2 * margin))),
  };
}
export const pixel = (s: Pick<Stamp, 'x' | 'y'>, width: number, height: number, margin = 70) => ({
  x: margin + s.x * (width - 2 * margin),
  y: margin + s.y * (height - 2 * margin),
});

/** Playing the picture: the lowest and highest scale steps (C4 to E5), and the longest gap between two notes. */
export const PLAY = { from: 0, count: 8, gap: 0.4, longest: 5.5 } as const;
export interface PlayNote {
  index: number;
  step: number;
  at: number;
}
/**
 * Play the picture: a scan from left to right, so stamps sound in x-order (ties, top first), each pitched by its height on the
 * pentatonic scale (higher on the paper sounds higher). Notes are evenly spaced, at most 0.4 s apart and never longer than 5.5 s
 * in all, so a full paper of 24 still plays in under 6 s. Nothing here is scored.
 */
export function playOrder(stamps: readonly Pick<Stamp, 'x' | 'y'>[]): PlayNote[] {
  const order = stamps.map((s, index) => ({ s, index })).sort((a, b) => a.s.x - b.s.x || a.s.y - b.s.y);
  const gap = order.length > 1 ? Math.min(PLAY.gap, PLAY.longest / (order.length - 1)) : 0;
  return order.map(({ s, index }, i) => ({
    index,
    step: stepFromUnit(1 - s.y, PLAY.from, PLAY.count),
    at: i * gap,
  }));
}

/**
 * Each stamp's own sound (dive slice 3), from what `sfx` already synthesizes. A pitched one rings a pentatonic step: the
 * step climbs with each press (`from` and the four above it, then round again), so a row of stars is a little tune.
 */
export type StampSound =
  { play: 'bell' | 'marimba'; from: number } | { play: 'splash' } | { play: 'animal'; animal: AnimalSound };
export const STAMP_SOUNDS: Record<StampKind, StampSound> = {
  star: { play: 'bell', from: 7 },
  flower: { play: 'marimba', from: 3 },
  fish: { play: 'splash' },
  cat: { play: 'animal', animal: 'meow' },
  duck: { play: 'animal', animal: 'quack' },
  whale: { play: 'splash' },
  crab: { play: 'splash' },
  starfish: { play: 'bell', from: 5 },
  shell: { play: 'marimba', from: 6 },
  boat: { play: 'marimba', from: 2 },
  cow: { play: 'animal', animal: 'moo' },
  pig: { play: 'animal', animal: 'oink' },
  hen: { play: 'animal', animal: 'cluck' },
  barn: { play: 'marimba', from: 1 },
  butterfly: { play: 'marimba', from: 7 },
  ladybug: { play: 'marimba', from: 4 },
  snail: { play: 'marimba', from: 0 },
  sunflower: { play: 'bell', from: 3 },
  tree: { play: 'marimba', from: 2 },
  moon: { play: 'bell', from: 4 },
  rocket: { play: 'marimba', from: 5 },
  planet: { play: 'bell', from: 1 },
  comet: { play: 'bell', from: 6 },
  ufo: { play: 'bell', from: 0 },
};
/** The scale step a pitched stamp rings on its `press`-th press (counting from 1), or null for an unpitched sound. */
export function stampStep(kind: StampKind, press: number): number | null {
  const sound = STAMP_SOUNDS[kind];
  return 'from' in sound ? sound.from + ((((press - 1) % 5) + 5) % 5) : null;
}

/** Counting aloud (levels 1–3): the paper's stamps are counted up to ten. */
export const COUNT_TO = 10;
export const COUNT_WORDS = [
  'One',
  'Two',
  'Three',
  'Four',
  'Five',
  'Six',
  'Seven',
  'Eight',
  'Nine',
  'Ten',
] as const;
/**
 * The number to say after a press leaves `onPaper` stamps on the paper, or null. Each number is said once a round (an
 * undo and a new press does not say it again), so the count never names more stamps than she can see, and after ten it
 * stays quiet. `said` is updated.
 */
export function countAloud(onPaper: number, said: Set<number>): string | null {
  if (onPaper < 1 || onPaper > COUNT_TO || said.has(onPaper)) return null;
  said.add(onPaper);
  return COUNT_WORDS[onPaper - 1];
}

/** The wake-up after the green arrow: each stamp bounces once, in the order it was placed, all done within `longest` s. */
export const WAKE = { gap: 0.3, bounce: 0.35, longest: 2.5 } as const;
/** When each of `count` stamps (in placement order) starts its bounce, and when the last bounce has ended. */
export function wakeSchedule(count: number): { at: number[]; end: number } {
  if (count < 1) return { at: [], end: 0 };
  const gap = count > 1 ? Math.min(WAKE.gap, (WAKE.longest - WAKE.bounce) / (count - 1)) : 0;
  const at = Array.from({ length: count }, (_, i) => i * gap);
  return { at, end: at[count - 1] + WAKE.bounce };
}

/** The shortest time between two unpitched wake-up sounds (meow, splash), so a crowded paper never stacks into a wail. */
export const WAKE_UNPITCHED_GAP = 0.5;
/**
 * Which stamps sound as they wake (all bounce): every pitched stamp, and an unpitched one only when at least
 * `WAKE_UNPITCHED_GAP` s have passed since the last unpitched sound. A short picture (0.3 s apart) still sounds every
 * other cat or fish at worst; a picture of different kinds keeps more.
 */
export function wakeSounds(kinds: readonly StampKind[], at: readonly number[]): boolean[] {
  let last = -Infinity;
  return kinds.map((kind, i) => {
    if ('from' in STAMP_SOUNDS[kind]) return true;
    if (at[i] - last < WAKE_UNPITCHED_GAP - 1e-9) return false;
    last = at[i];
    return true;
  });
}

/** The colors on the color buttons, in order: the six rainbow colors, then pink (dive slice 2). */
export const STAMP_COLORS: ColorName[] = ['red', 'orange', 'yellow', 'green', 'blue', 'purple', 'pink'];

/** The size button cycles a stamp middle, big, small, middle (dive slice 2); all inside the saved 0.5–2 clamp. */
export const STAMP_SIZES = { small: 0.7, middle: 1, big: 1.5 } as const;
/** The next size the size button gives a stamp; a size from an older picture (1.3) counts as big. */
export function nextSize(size: number): number {
  if (size < 0.85) return STAMP_SIZES.middle;
  if (size < 1.2) return STAMP_SIZES.big;
  return STAMP_SIZES.small;
}

/**
 * A stamp's outline: its color's line, except yellow, whose line is too pale on the cream paper (about 2:1), so it takes a
 * darker gold that reads at 3:1 or more.
 */
export const stampLine = (color: ColorName, line: number) => (color === 'yellow' ? YELLOW_LINE : line);
export const YELLOW_LINE = 0xa87a00;

/**
 * Follow the sparkle (level 10). The glow is `across` units wide at its smallest and its centre keeps `margin` from the
 * paper's edge, so the whole glow is on the paper. `w` and `h` are the smallest room the centres ever have, across and
 * down, in any layout (the upright paper is the narrowest, the sideways one the shortest), so spots `apart` units from
 * each other there are at least that far apart on every paper.
 */
export const SPARKLE = {
  across: 160,
  radius: 85,
  pulse: 0.05,
  margin: 90,
  apart: 200,
  w: 398,
  h: 298,
} as const;
/**
 * One round's sparkle spots, in the order they glow, as 0 to 1 positions inside the paper's `SPARKLE.margin`
 * (`sparklePixel`): the four corners and the middle, each nudged a little and shuffled, so every two are at least
 * `SPARKLE.apart` units apart on the smallest paper and no spot is used twice.
 */
export function sparkleSpots(rng: Rng): Pt[] {
  const nudge = (most: number) => rng.next() * most;
  const spots = [
    { x: nudge(0.05), y: nudge(0.05) },
    { x: 1 - nudge(0.05), y: nudge(0.05) },
    { x: nudge(0.05), y: 1 - nudge(0.05) },
    { x: 1 - nudge(0.05), y: 1 - nudge(0.05) },
    { x: 0.46 + nudge(0.08), y: 0.46 + nudge(0.08) },
  ];
  return rng.shuffle(spots);
}
/** Where a sparkle spot is on a paper of this size. */
export const sparklePixel = (spot: Pt, width: number, height: number) =>
  pixel(spot, width, height, SPARKLE.margin);
/** A tap inside the glow lands on its centre; a tap anywhere else stamps where it fell. Neither is a miss. */
export function sparkleTap(x: number, y: number, spot: Pt, width: number, height: number): Pt {
  const p = sparklePixel(spot, width, height);
  return Math.hypot(x - p.x, y - p.y) <= SPARKLE.radius ? p : { x, y };
}

/** Wrong presses on one ask before the asked stamp's button glows (Stamp a duck!, level 11). */
export const ASK_HINT_AFTER = 2;

/**
 * Three distinct asks for a Stamp a duck! round, starting on a kind different from `selected` so the child must
 * pick a new stamp right away (and every later ask differs from the stamp just placed to complete the one before).
 */
export function animalAsks(kinds: readonly StampKind[], selected: StampKind, rng: Rng): StampKind[] {
  const other = kinds.filter((k) => k !== selected);
  const first = rng.pick(other.length ? other : kinds);
  const rest = rng.shuffle(kinds.filter((k) => k !== first));
  return [first, ...rest];
}

/** Early rounds vary their existing tools without adding simultaneous choices. */
export function roundPlan(level: number, rng: Rng): { plan: StampPlan; color: ColorName; scene?: SceneId } {
  const base = planFor(level);
  if (base.ask) {
    return {
      plan: { ...base, kinds: rng.shuffle([...base.kinds]) },
      color: rng.pick(STAMP_COLORS),
    };
  }
  if (level > 3 && !base.follow) return { plan: base, color: 'purple' };
  // Levels 1–3 draw from one seeded set (Sea, Farm, Garden or Space); Follow the sparkle (level 10) keeps Plain.
  const picked = level <= 3 ? rng.pick(SEEDED_SETS) : undefined;
  const pool = picked ? SETS[picked].kinds : PLAIN_KINDS;
  const scene = picked ? SETS[picked].scene : undefined;
  return {
    plan: { ...base, kinds: rng.shuffle([...pool]).slice(0, base.kinds.length) },
    color: rng.pick(STAMP_COLORS),
    ...(scene ? { scene } : {}),
  };
}

/** What the demonstration needs to see of the sheet to know its next move. */
export interface StampState {
  stamps: Pick<Stamp, 'x' | 'y' | 'size' | 'turns'>[];
  /** The stamp and color picked now. */
  kind: StampKind;
  color: ColorName;
  /** Follow the sparkle: where the glowing spot is now, in the sheet's own 0 to 1 coordinates. */
  sparkle?: Pt;
  /** Stamp a duck!: the animal currently asked for, while asks remain. */
  ask?: StampKind;
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
export const PAT_SPOTS = [0.12, 0.37, 0.63, 0.88].flatMap((x) => [
  { x, y: 0.25 },
  { x, y: 0.8 },
]);
export const DEMO_SPOTS = [
  { x: 0.15, y: 0.25 },
  { x: 0.5, y: 0.2 },
  { x: 0.85, y: 0.25 },
  { x: 0.3, y: 0.8 },
  { x: 0.7, y: 0.8 },
] as const;
const DEMO_COLORS: ColorName[] = ['red', 'yellow', 'blue', 'pink', 'orange'];
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
  if (plan.follow)
    return n < plan.follow.count && st.sparkle ? { do: 'stamp', ...st.sparkle } : { do: 'finish' };
  if (plan.ask && st.ask) {
    if (st.kind !== st.ask) return { do: 'kind', kind: st.ask };
    return { do: 'stamp', ...DEMO_SPOTS[n % DEMO_SPOTS.length] };
  }
  const last = st.stamps[n - 1];
  if (plan.transform && n === 3 && last.turns === 0) return { do: 'turn' };
  if (plan.transform && n === 4 && last.size === 1) return { do: 'grow' };
  if (n < DEMO_SPOTS.length) {
    const kind = plan.kinds[n % plan.kinds.length];
    if (st.kind !== kind) return { do: 'kind', kind };
    if (plan.color && st.color !== DEMO_COLORS[n]) return { do: 'color', color: DEMO_COLORS[n] };
    return { do: 'stamp', ...DEMO_SPOTS[n] };
  }
  if (plan.move && Math.abs(st.stamps[DEMO_MOVE.stamp].x - DEMO_MOVE.x) > 0.02)
    return { do: 'move', ...DEMO_MOVE };
  return { do: 'finish' };
}

// ---- Trace Prints (levels 8–9): fresh prints in mud. Every touch is creative play: 0 misses, 0 hints, nothing kept. ----

export type TraceMakerId = 'leaf' | 'duck' | 'paw';
export const TRACE_MAKERS: Record<
  TraceMakerId,
  { name: string; across: number; toes: number; sound?: AnimalSound }
> = {
  leaf: { name: 'A leaf', across: 170, toes: 0 },
  duck: { name: 'Duck foot', across: 150, toes: 3, sound: 'quack' },
  paw: { name: 'Cat paw', across: 150, toes: 4, sound: 'meow' },
};
export interface Pt {
  x: number;
  y: number;
}
/** A maker's shape, centred on its bounds: filled outlines and circles (the print's dent) and inner lines (veins, toe and pad gaps). */
export interface TraceShape {
  polys: Pt[][];
  circles: (Pt & { r: number })[];
  lines: Pt[][];
}

function centred(shape: TraceShape, across: number): TraceShape {
  const xs: number[] = [],
    ys: number[] = [];
  for (const p of shape.polys.flat()) {
    xs.push(p.x);
    ys.push(p.y);
  }
  for (const c of shape.circles) {
    xs.push(c.x - c.r, c.x + c.r);
    ys.push(c.y - c.r, c.y + c.r);
  }
  const cx = (Math.min(...xs) + Math.max(...xs)) / 2,
    cy = (Math.min(...ys) + Math.max(...ys)) / 2;
  const k = across / (Math.max(...xs) - Math.min(...xs));
  const at = (p: Pt) => ({ x: (p.x - cx) * k, y: (p.y - cy) * k });
  return {
    polys: shape.polys.map((ps) => ps.map(at)),
    circles: shape.circles.map((c) => ({ ...at(c), r: c.r * k })),
    lines: shape.lines.map((ps) => ps.map(at)),
  };
}
const SHAPES: Record<TraceMakerId, TraceShape> = {
  // Fossil Dig's invented five-lobed leaf: a midrib to the top lobe and a vein to each of the other four.
  leaf: centred(
    {
      polys: [leafOutline('star')],
      circles: [],
      lines: [-90, -18, 54, 126, 198].map((deg) => {
        const a = (deg * Math.PI) / 180;
        return [
          { x: 0, y: 15 },
          { x: Math.cos(a) * 128 * 0.85, y: 15 + Math.sin(a) * 128 * 0.85 },
        ];
      }),
    },
    TRACE_MAKERS.leaf.across,
  ),
  // Three long webbed toes, taller than wide.
  duck: centred(
    {
      polys: [
        [
          { x: -14, y: 75 },
          { x: -75, y: -52 },
          { x: -62, y: -64 },
          { x: -32, y: -40 },
          { x: -11, y: -85 },
          { x: 11, y: -85 },
          { x: 32, y: -40 },
          { x: 62, y: -64 },
          { x: 75, y: -52 },
          { x: 14, y: 75 },
        ],
      ],
      circles: [],
      lines: [
        [
          { x: 0, y: 58 },
          { x: -64, y: -50 },
        ],
        [
          { x: 0, y: 58 },
          { x: 0, y: -74 },
        ],
        [
          { x: 0, y: 58 },
          { x: 64, y: -50 },
        ],
      ],
    },
    TRACE_MAKERS.duck.across,
  ),
  // One round pad and four round toes, wider than tall.
  paw: centred(
    {
      polys: [],
      circles: [
        { x: 0, y: 25, r: 38 },
        { x: -58, y: -22, r: 17 },
        { x: -22, y: -50, r: 17 },
        { x: 22, y: -50, r: 17 },
        { x: 58, y: -22, r: 17 },
      ],
      lines: [],
    },
    TRACE_MAKERS.paw.across,
  ),
};
export const traceShape = (id: TraceMakerId) => SHAPES[id];
/** The shape's width and height (before any tilt). */
export function traceBounds(id: TraceMakerId) {
  const s = SHAPES[id],
    xs: number[] = [],
    ys: number[] = [];
  for (const p of s.polys.flat()) {
    xs.push(p.x);
    ys.push(p.y);
  }
  for (const c of s.circles) {
    xs.push(c.x - c.r, c.x + c.r);
    ys.push(c.y - c.r, c.y + c.r);
  }
  return { w: Math.max(...xs) - Math.min(...xs), h: Math.max(...ys) - Math.min(...ys) };
}
/** The farthest any part of the shape reaches from its centre, so a print at any tilt stays inside this radius. */
export function traceReach(id: TraceMakerId) {
  const s = SHAPES[id];
  return Math.max(
    ...s.polys.flat().map((p) => Math.hypot(p.x, p.y)),
    ...s.circles.map((c) => Math.hypot(c.x, c.y) + c.r),
  );
}
/** How far a print's centre keeps from the mud's edge: at least half its width and 5 more, and never less than its reach, so the whole print stays on the mud. */
export const traceMargin = (id: TraceMakerId) =>
  Math.ceil(Math.max(TRACE_MAKERS[id].across / 2, traceReach(id))) + 5;
/** The seeded tilt of one leaf press, in degrees (the leaf and its print share it). */
export const TILTS = [-20, -10, 0, 10, 20] as const;
export const traceTilt = (rng: Rng) => rng.pick(TILTS);

/** One round's prints, in order, and whether the pair moment has been said. */
export interface TraceRound {
  prints: TraceMakerId[];
  paired: boolean;
  done: boolean;
}
export const traceRound = (): TraceRound => ({ prints: [], paired: false, done: false });
/**
 * Press one print. `pair` is true on the one press of a round that first makes every one of the plan's makers present (never at
 * level 8, which has one); undoing a print never makes it fire again. `finish` is true on the press that reaches the plan's count.
 */
export function tracePress(plan: NonNullable<StampPlan['trace']>, round: TraceRound, maker: TraceMakerId) {
  if (round.done) return { pair: false, finish: false };
  round.prints.push(maker);
  const pair = plan.makers.length > 1 && !round.paired && plan.makers.every((m) => round.prints.includes(m));
  if (pair) round.paired = true;
  const finish = round.prints.length >= plan.count;
  if (finish) round.done = true;
  return { pair, finish };
}
/** The back arrow smooths away the latest print. */
export const traceUndo = (round: TraceRound) => {
  if (!round.done) round.prints.pop();
};

export type TraceMove =
  { do: 'choose'; maker: TraceMakerId } | { do: 'press'; x: number; y: number } | { do: 'finish' };
/**
 * The ghost finger: level 8 pats `PAT_SPOTS` in order until the round ends itself; level 9 presses three duck prints, chooses the
 * paw, presses two paw prints, then taps the green arrow, so it shows choosing, both marks and the optional finish.
 */
export function traceDemo(
  plan: NonNullable<StampPlan['trace']>,
  st: { prints: readonly TraceMakerId[]; chosen: TraceMakerId },
): TraceMove {
  const n = st.prints.length;
  if (plan.makers.length === 1)
    return n < plan.count ? { do: 'press', ...PAT_SPOTS[n % PAT_SPOTS.length] } : { do: 'finish' };
  if (n >= 5) return { do: 'finish' };
  const want = n < 3 ? plan.makers[0] : plan.makers[1];
  return st.chosen !== want ? { do: 'choose', maker: want } : { do: 'press', ...DEMO_SPOTS[n] };
}

export const LEVELS: BandLevels = {
  lap: { min: 1, max: 10, order: [7, 8, 1, 10, 2] },
  toddler: { min: 2, max: 11, order: [9, 10, 2, 11, 3] },
  preschool: { min: 3, max: 5 },
  prek: { min: 4, max: 6 },
  school: { min: 5, max: 6 },
};

/** A round button's touch radius (`RoundButton`: its 48 radius and 14 more). */
export const BUTTON_REACH = 62;
/** A set-row button's radius and touch reach (116 across >= 100). */
export const SET_RADIUS = 44;
export const SET_REACH = SET_RADIUS + 14;
/** A color disc's radius; its touch radius is 14 more, so each disc is a target 108 units across. */
export const COLOR_RADIUS = 40;
export const COLOR_REACH = COLOR_RADIUS + 14;

/** Stamp choice button radius: 48 up to four stamps; 40 sideways or 36 upright for a six-stamp set (still >= 100 across). */
export function choiceButtonRadius(choices: number, upright?: true) {
  if (choices <= 4) return 48;
  return upright ? 36 : COLOR_RADIUS;
}

/**
 * Where the seven color discs sit along the top, between Home and "?" (their column ends at x 115) and the green arrow
 * (its reach starts 139 from the right edge): one row where seven fit without touching, from the 1024-wide sideways view up,
 * at most 125 apart; otherwise (an upright phone) two rows, four above and three below, each disc 108 apart and below the
 * row above, so the second row still ends above the paper (y 230).
 */
export function colorSpots(w: number) {
  const left = 115 + COLOR_REACH;
  const right = w - 139 - COLOR_REACH;
  const n = STAMP_COLORS.length;
  const gap = 2 * COLOR_REACH;
  if ((right - left) / (n - 1) >= gap) {
    const step = Math.min(125, (right - left) / (n - 1));
    return STAMP_COLORS.map((_, i) => ({ x: left + i * step, y: 60 }));
  }
  const top = Math.ceil(n / 2);
  return STAMP_COLORS.map((_, i) =>
    i < top ? { x: left + i * gap, y: 58 } : { x: left + gap / 2 + (i - top) * gap, y: 58 + gap },
  );
}

/**
 * Where the paper and the buttons sit in a view. Sideways: the paper between the left column (Home, "?", Sets, Play, the pet)
 * and the right one (Finish, Bin, Turn, Grow, Undo), the colours above it and the stamps below. On the narrow upright area
 * (chunk 31) the paper runs from the left edge below Home and "?", Play, Sets and Undo join the right column, and the stamps
 * take the whole bottom row right of the guide; the colours start 45 further left, clear of Finish.
 */
export function stampLayout(
  v: { w: number; h: number; upright?: true },
  choices: number,
  transform: boolean,
  setsCount = SET_CHOICES.length,
) {
  const tall = v.upright === true;
  const paper = tall
    ? { x: 20, y: 230, w: v.w - 190, h: v.h - 230 - 180 }
    : { x: 180, y: 135, w: v.w - 350, h: v.h - 290 };
  const col = v.w - 77;
  const choiceRadius = choiceButtonRadius(choices, v.upright);
  const choiceReach = choiceRadius + 14;
  const choiceXs =
    tall && choices > 4
      ? (() => {
          const left = 165 + choiceReach;
          const right = v.w - choiceReach;
          const step = (right - left) / Math.max(1, choices - 1);
          return Array.from({ length: choices }, (_, i) => left + i * step);
        })()
      : tall
        ? spread(choices, 165, v.w - 20, 135)
        : spread(choices, 185, v.w - 180, 135);
  const sets = tall ? { x: col, y: 340 } : { x: 88, y: 274 };
  const setStep = SET_REACH * 2 + 4;
  const setRow = tall
    ? Array.from({ length: setsCount }, (_, i) => {
        const cols = Math.min(3, setsCount);
        const colIdx = i % cols;
        const rowIdx = Math.floor(i / cols);
        const right = col - BUTTON_REACH - 8 - SET_REACH;
        return { x: right - (cols - 1 - colIdx) * setStep, y: sets.y + rowIdx * setStep };
      })
    : Array.from({ length: setsCount }, (_, i) => ({ x: 225 + i * setStep, y: sets.y }));
  return {
    paper,
    choiceRadius,
    choices: choiceXs.map((x) => ({ x, y: v.h - 77 })),
    colors: colorSpots(v.w),
    finish: { x: col, y: 65 },
    undo: { x: col, y: tall ? v.h - 237 : v.h - 77 },
    bin: { x: col, y: v.h / 2 - (transform ? 130 : 0) },
    turn: { x: col, y: v.h / 2 },
    grow: { x: col, y: v.h / 2 + 130 },
    // Sideways: left of the paper, between the hold-to-open help (y 160) and the pet.
    play: tall ? { x: col, y: 200 } : { x: 88, y: v.h / 2 + 20 },
    sets,
    setRow,
  };
}
