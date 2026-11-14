import type { LineId } from '../../content/voice-script';
import type { Rng } from '../../engine/random';
import type { BandLevels } from '../../progress/difficulty';
import { cream, grass, swatch, wood } from '../../art/palette';
import type { BackdropStyle } from '../../art/scenery';

/**
 * Pet Says, after Simon Says and action songs: the big pet does a move with a sound, and the child copies it
 * off the screen while a grown-up taps the arrow to go on. Nothing is judged automatically; this is co-play.
 * The ladder: copy single moves, body words ("touch your nose"), two moves in order, the "Pet says" rule
 * (move only when you hear "Pet says", which practices waiting), and a freeze dance.
 */
export type Move =
  | 'clap'
  | 'stomp'
  | 'wave'
  | 'jump'
  | 'spin'
  | 'wiggle'
  | 'up'
  | 'down'
  | 'peekaboo'
  | 'patacake'
  | 'tiptoe'
  | 'march'
  | 'frog'
  | 'cat'
  | 'duck'
  | 'bird'
  | 'tree'
  | 'shake'
  | 'nose'
  | 'tummy'
  | 'ears'
  | 'head'
  | 'toes';
export type SaysMode = 'copy' | 'body' | 'pairs' | 'says' | 'freeze' | 'pat';

/**
 * The moves in tiers (dive slice 3). Base is the first eight; social moves are the ones a one-year-old already plays
 * (pat-a-cake, peekaboo); walking and animal moves need a body that can travel and pretend; calm moves wind down.
 * The tiers partition every move the pet shows apart from the body words.
 */
export const TIERS = {
  base: ['clap', 'stomp', 'wave', 'jump', 'spin', 'wiggle', 'up', 'down'],
  social: ['peekaboo', 'patacake'],
  walking: ['tiptoe', 'march'],
  animal: ['frog', 'cat', 'duck', 'bird'],
  calm: ['tree', 'shake'],
} satisfies Record<string, Move[]>;
export type Tier = keyof typeof TIERS;

/** The first eight moves, the base tier. */
export const MOVES: Move[] = TIERS.base;
/** Every whole-body move, all tiers. */
export const ALL_MOVES: Move[] = Object.values(TIERS).flat();
/** Level 1 (and lap's copying) draws from base and social only, so a lap round never meets an animal move. */
export const FIRST_POOL: Move[] = [...TIERS.base, ...TIERS.social];
export const BODY: Move[] = ['nose', 'tummy', 'ears', 'head', 'toes'];

/** Spoken names, for "clap, then stomp" and "Pip says: wave". */
export const MOVE_CUES = {
  clap: { word: 'clap', line: 'says.move.clap' },
  stomp: { word: 'stomp', line: 'says.move.stomp' },
  wave: { word: 'wave', line: 'says.move.wave' },
  jump: { word: 'jump', line: 'says.move.jump' },
  spin: { word: 'turn around', line: 'says.move.spin' },
  wiggle: { word: 'wiggle', line: 'says.move.wiggle' },
  up: { word: 'reach up high', line: 'says.move.up' },
  down: { word: 'crouch down low', line: 'says.move.down' },
  peekaboo: { word: 'play peekaboo', line: 'says.move.peekaboo' },
  patacake: { word: 'pat-a-cake', line: 'says.move.patacake' },
  tiptoe: { word: 'tiptoe', line: 'says.move.tiptoe' },
  march: { word: 'march', line: 'says.move.march' },
  frog: { word: 'hop like a frog', line: 'says.move.frog' },
  cat: { word: 'stretch like a cat', line: 'says.move.cat' },
  duck: { word: 'waddle like a duck', line: 'says.move.duck' },
  bird: { word: 'flap like a bird', line: 'says.move.bird' },
  tree: { word: 'sway like a tree', line: 'says.move.tree' },
  shake: { word: 'shake it out', line: 'says.move.shake' },
  nose: { word: 'touch your nose', line: 'says.move.nose' },
  tummy: { word: 'pat your tummy', line: 'says.move.tummy' },
  ears: { word: 'touch your ears', line: 'says.move.ears' },
  head: { word: 'pat your head', line: 'says.move.head' },
  toes: { word: 'touch your toes', line: 'says.move.toes' },
} satisfies Record<Move, { word: string; line: LineId }>;

export const MOVE_WORDS = Object.fromEntries(
  Object.entries(MOVE_CUES).map(([id, cue]) => [id, cue.word]),
) as Record<Move, string>;

/**
 * Counts (level 3): the moves made of beats a child can count, and how many beats each does when no count is asked.
 * A pair turn may ask for two or three of one of these ("stomp three times, then clap"); the pet then does exactly that
 * many, counting aloud.
 */
export const BEATS = { clap: 3, stomp: 3, jump: 2, march: 4 } satisfies Partial<Record<Move, number>>;
export type Countable = keyof typeof BEATS;
export const isCountable = (m: Move): m is Countable => m in BEATS;
export const MAX_COUNT = 5;

/** How many beats the pet performs: the asked-for count, or the move's own number. */
export const beatsFor = (m: Countable, count?: number) => count ?? BEATS[m];

const COUNT_WORDS: Record<number, string> = { 2: 'two', 3: 'three', 4: 'four', 5: 'five' };

/** The spoken name of a move in a turn: "stomp three times" when a count is asked, else the plain word. */
export function cueWord(move: Move, count?: number): string {
  return count ? `${MOVE_WORDS[move]} ${COUNT_WORDS[count]} times` : MOVE_WORDS[move];
}

interface Pt {
  x: number;
  y: number;
}
type Pair = { left: Pt; right: Pt };

/**
 * Where the mittens go on this friend (RW05 slice 2), in the companion's units: built from its named parts and its body
 * box, so the sprout, the river and the glider each touch their own nose. The mittens float beside the body at rest
 * (the glider has no hands, and the river walks on its paws); a part a species lacks (the glider's feet) falls back to
 * the floor under it.
 */
export interface SaysFrame {
  rest: Pair;
  targets: Record<'nose' | 'tummy' | 'ears' | 'head' | 'toes', Pair>;
  /** Peekaboo: both mittens over the eyes (beside the nose where a friend's eyes are not marked). */
  eyes: Pair;
  clap: Pair;
  up: Pair;
  down: Pair;
  /** Where the right mitten waves, and how far it swings. */
  wave: Pt;
  /** How high the head pat knocks, above its target. */
  knock: number;
}

export function saysFrame(
  at: (part: 'nose' | 'tummy' | 'ears' | 'head' | 'feet' | 'eyes') => readonly Pt[],
  box: { x: number; y: number; width: number; height: number },
): SaysFrame {
  const cx = box.x + box.width / 2;
  const right = box.x + box.width;
  const floor = Math.min(0, box.y + box.height);
  const y = box.y + box.height * 0.62;
  const rest = { left: { x: box.x - 10, y }, right: { x: right + 10, y } };
  const one = (p: 'nose' | 'tummy' | 'head') => at(p)[0] ?? { x: cx, y };
  const sorted = (list: readonly Pt[]) => [...list].sort((a, b) => a.x - b.x);
  const pair = (list: readonly Pt[], spread: number, fallback: Pt): Pair => {
    const s = sorted(list);
    if (s.length >= 2) return { left: s[0], right: s[s.length - 1] };
    const p = s[0] ?? fallback;
    return { left: { x: p.x - spread, y: p.y }, right: { x: p.x + spread, y: p.y } };
  };
  const nose = one('nose');
  const head = one('head');
  const tummy = one('tummy');
  return {
    rest,
    targets: {
      nose: { left: rest.left, right: nose },
      tummy: { left: { x: tummy.x - 38, y: tummy.y }, right: { x: tummy.x + 38, y: tummy.y } },
      ears: pair(at('ears'), 14, head),
      head: { left: rest.left, right: { x: head.x, y: head.y - 36 } },
      toes: pair(at('feet'), 40, { x: cx, y: floor }),
    },
    eyes: pair(at('eyes'), 18, { x: nose.x, y: nose.y - 8 }),
    clap: { left: { x: cx - 20, y: y - 17 }, right: { x: cx + 20, y: y - 17 } },
    up: { left: { x: cx - 70, y: box.y - 50 }, right: { x: cx + 70, y: box.y - 50 } },
    down: { left: { x: box.x - 22, y: floor - 30 }, right: { x: right + 22, y: floor - 30 } },
    wave: { x: right + 22, y: box.y + 40 },
    knock: 14,
  };
}

/** Waiting is co-play, never a missed answer or automatic advance. */
export const shouldNudge = (idle: number, busy: boolean, finished: boolean) =>
  idle >= 10 && !busy && !finished;

/** Preserve the original color/pose draw order for owned stickers. */
export function stickerRecipe(rng: Rng) {
  return { color: rng.pick(['teal', 'pink', 'purple', 'orange'] as const), pose: rng.int(0, 2) };
}

export interface SaysPlan {
  mode: SaysMode;
  turns: number;
  name: string;
}

export const PLANS: SaysPlan[] = [
  {
    mode: 'copy',
    turns: 6,
    name: 'Copy the pet: clap, stomp, wave, jump, peekaboo, pat-a-cake (a grown-up taps the arrow)',
  },
  { mode: 'body', turns: 5, name: 'Body words: touch your nose, pat your tummy, touch your toes' },
  {
    mode: 'pairs',
    turns: 4,
    name: 'Two moves in order, sometimes counted: "stomp three times, then hop like a frog"',
  },
  { mode: 'says', turns: 6, name: '"Pet says": move only when you hear the pet\'s name first' },
  {
    mode: 'freeze',
    turns: 4,
    name: 'Freeze dance: four tunes to bounce, sway or dance like a robot to, then freeze like a tree or a flamingo',
  },
];

export const LEVELS: BandLevels = {
  // Level 13, Pat the pet, is the easiest, so lap plays it first, then 1 and 2 (see `order`).
  lap: { min: 1, max: 13, order: [13, 1, 2] },
  toddler: { min: 1, max: 3 },
  preschool: { min: 2, max: 4 },
  prek: { min: 3, max: 5 },
};

/**
 * Levels that sit apart from the numbered ladder (its IDs 6–12 are kept for the planned levels), placed by a band's `order`.
 * 13, Pat the pet, is lap's first: her touch (on the pet or anywhere) is the cue, so there is no arrow and nothing to copy.
 */
export const ENTRY_PLANS: Record<number, SaysPlan> = {
  13: {
    mode: 'pat',
    turns: 5,
    name: 'Pat the pet: a touch anywhere makes the pet do its next move (no arrow)',
  },
};

/** The moves a pat brings out: the easiest to watch, and the two social games she already plays. */
export const PAT_MOVES: Move[] = ['wave', 'clap', 'jump', 'wiggle', 'spin', 'peekaboo', 'patacake'];

export const planFor = (level: number) =>
  ENTRY_PLANS[level] ?? PLANS[Math.min(PLANS.length, Math.max(1, level)) - 1];

export interface Turn {
  moves: Move[];
  /** "Pet says" level: false is a trick, where the right thing to do is stay still. */
  says?: boolean;
  /** Level 3: how many times to do each move, where one is asked (only countable moves, two or three). */
  counts?: (number | undefined)[];
  /** Level 5: the tune, how the pet dances to it, and the statue it freezes into. */
  dance?: Dance;
}

export function makeTurns(plan: SaysPlan, rng: Rng): Turn[] {
  const deck = (pool: Move[]) => {
    const out: Move[] = [];
    while (out.length < plan.turns * 2) {
      for (const m of rng.shuffle([...pool])) if (m !== out[out.length - 1]) out.push(m);
    }
    return out;
  };
  switch (plan.mode) {
    case 'copy':
      return deck(FIRST_POOL)
        .slice(0, plan.turns)
        .map((m) => ({ moves: [m] }));
    case 'body':
      return rng
        .shuffle([...BODY])
        .slice(0, plan.turns)
        .map((m) => ({ moves: [m] }));
    case 'pairs': {
      // Each turn asks for at most one count, on a move made of beats, and about half the turns ask for one.
      const d = deck(ALL_MOVES);
      return Array.from({ length: plan.turns }, (_, i) => {
        const moves = [d[2 * i], d[2 * i + 1]];
        const slots = moves.flatMap((m, k) => (isCountable(m) ? [k] : []));
        if (!slots.length || !rng.chance(0.6)) return { moves };
        const counts: (number | undefined)[] = [undefined, undefined];
        counts[rng.pick(slots)] = rng.int(2, 3);
        return { moves, counts };
      });
    }
    case 'says': {
      // Two tricks, never first and never back to back, so the rule has a chance to settle in.
      for (;;) {
        const tricks = new Set([rng.int(1, plan.turns - 1), rng.int(1, plan.turns - 1)]);
        const list = [...tricks].sort((a, b) => a - b);
        if (list.length < 2 || list[1] - list[0] < 2) continue;
        return deck([...ALL_MOVES, ...BODY])
          .slice(0, plan.turns)
          .map((m, i) => ({ moves: [m], says: !tricks.has(i) }));
      }
    }
    case 'pat':
      return rng
        .shuffle([...PAT_MOVES])
        .slice(0, plan.turns)
        .map((m) => ({ moves: [m] }));
    case 'freeze':
      return makeDances(plan.turns, rng).map((dance) => ({ moves: [], dance }));
  }
}

/** How long the music plays before "freeze!": a few seconds, never the same twice in a row. */
export function danceSeconds(rng: Rng, last: number): number {
  for (;;) {
    const s = rng.int(3, 7);
    if (s !== last) return s;
  }
}

// The freeze dance (dive slice 4) ---------------------------------------------------------------------

/**
 * Four tunes of different feel, in pentatonic scale steps for `sfx.marimba` (0 = middle C, 5 = the C above), each with
 * its own beat. A step is a place on the five-note scale, so every note of every tune sounds good with the others.
 */
export const TUNES = {
  bounce: { beat: 0.3, steps: [5, 7, 9, 7, 5, 4, 5, 7, 9, 10, 9, 7] },
  sway: { beat: 0.46, steps: [5, 4, 2, 4, 5, 7, 5, 4, 2, 0, 2, 4] },
  shimmy: { beat: 0.22, steps: [7, 9, 7, 9, 10, 9, 7, 5, 7, 9, 7, 5, 4, 5, 7, 9] },
  march: { beat: 0.36, steps: [5, 5, 7, 5, 9, 9, 7, 5, 4, 4, 5, 7] },
} satisfies Record<string, { beat: number; steps: number[] }>;
export type Tune = keyof typeof TUNES;
export const TUNE_IDS = Object.keys(TUNES) as Tune[];
/** The lowest and highest scale steps a tune may use: the marimba's comfortable middle. */
export const TUNE_RANGE = { low: 0, high: 12 };

/** How the pet dances; each tune is danced in a style that suits its feel. */
export type DanceStyle = 'bounce' | 'sway' | 'twirl' | 'shimmy' | 'robot';
export const DANCE_STYLES: DanceStyle[] = ['bounce', 'sway', 'twirl', 'shimmy', 'robot'];
export const STYLES_FOR: Record<Tune, DanceStyle[]> = {
  bounce: ['bounce', 'twirl'],
  sway: ['sway', 'twirl'],
  shimmy: ['shimmy', 'robot'],
  march: ['robot', 'bounce'],
};

/** The statue the pet strikes when the music stops: "Freeze like a tree!" She can copy it, or freeze any way at all. */
export type Statue = 'tree' | 'icecream' | 'flamingo' | 'star' | 'teapot';
export const STATUES: Statue[] = ['tree', 'icecream', 'flamingo', 'star', 'teapot'];

export const STYLE_LINES = {
  bounce: 'says.style.bounce',
  sway: 'says.style.sway',
  twirl: 'says.style.twirl',
  shimmy: 'says.style.shimmy',
  robot: 'says.style.robot',
} satisfies Record<DanceStyle, LineId>;
export const STATUE_LINES = {
  tree: 'says.statue.tree',
  icecream: 'says.statue.icecream',
  flamingo: 'says.statue.flamingo',
  star: 'says.statue.star',
  teapot: 'says.statue.teapot',
} satisfies Record<Statue, LineId>;

export interface Dance {
  tune: Tune;
  style: DanceStyle;
  statue: Statue;
}

/**
 * A round's dances: every tune once in a new order (so two dances never share a tune), a style that suits each, never
 * the same style twice running, and a different statue each time.
 */
export function makeDances(count: number, rng: Rng): Dance[] {
  const tunes: Tune[] = [];
  while (tunes.length < count) tunes.push(...rng.shuffle([...TUNE_IDS]));
  const statues: Statue[] = [];
  while (statues.length < count) statues.push(...rng.shuffle([...STATUES]));
  const out: Dance[] = [];
  for (let i = 0; i < count; i++) {
    const tune = tunes[i];
    const fits = STYLES_FOR[tune].filter((s) => s !== out[i - 1]?.style);
    out.push({ tune, style: rng.pick(fits), statue: statues[i] });
  }
  return out;
}

/** Where the mittens go for each statue, from the friend's frame. */
export function statuePose(statue: Statue, f: SaysFrame): Pair {
  const cx = (f.up.left.x + f.up.right.x) / 2;
  const top = f.targets.head.right;
  switch (statue) {
    case 'tree':
      // Branches: both arms straight up.
      return f.up;
    case 'icecream':
      // A scoop on top: the mittens meet over the head.
      return { left: { x: cx - 22, y: top.y - 20 }, right: { x: cx + 22, y: top.y - 20 } };
    case 'flamingo':
      // One wing up high, the other tucked low: standing on one leg.
      return { left: f.down.left, right: f.up.right };
    case 'star':
      // Arms wide at the sides.
      return {
        left: { x: f.rest.left.x - 50, y: f.rest.left.y - 40 },
        right: { x: f.rest.right.x + 50, y: f.rest.right.y - 40 },
      };
    case 'teapot':
      // A handle on the hip and a spout up and out.
      return {
        left: { x: f.rest.left.x + 18, y: f.rest.left.y + 10 },
        right: { x: f.wave.x + 30, y: f.wave.y - 30 },
      };
  }
}

// Scenes (dive slice 4) -----------------------------------------------------------------------------

/** The places the pet plays, one per round by seed. Nothing in a round depends on which. */
export type Scene = 'meadow' | 'beach' | 'room' | 'snow' | 'evening';
export const SCENES = {
  meadow: {
    sky: [swatch.blue.light, cream],
    hills: [swatch.green.light, 0xc8ecb0, grass],
    horizon: 0.62,
    clouds: 3,
    sun: true,
    seed: 33,
  },
  beach: {
    sky: [swatch.blue.light, swatch.teal.light],
    hills: [swatch.teal.fill, swatch.blue.light, swatch.yellow.light],
    horizon: 0.64,
    clouds: 2,
    sun: true,
    seed: 41,
  },
  room: {
    sky: [swatch.yellow.light, cream],
    hills: [wood.light],
    horizon: 0.66,
    seed: 5,
  },
  snow: {
    sky: [swatch.blue.light, swatch.white.light],
    hills: [swatch.purple.light, swatch.white.light, swatch.white.fill],
    horizon: 0.62,
    clouds: 2,
    seed: 17,
  },
  evening: {
    sky: [swatch.purple.line, swatch.pink.light],
    hills: [swatch.purple.fill, swatch.blue.line, swatch.green.line],
    horizon: 0.64,
    seed: 23,
  },
} satisfies Record<Scene, BackdropStyle>;
export const SCENE_IDS = Object.keys(SCENES) as Scene[];
/** A round's place: drawn after its turns, so a seed deals the same moves it always has. */
export const pickScene = (rng: Rng): Scene => rng.pick(SCENE_IDS);

/** What a scene adds over its sky and hills: stars and a moon, a window and a rug, or snowflakes. */
export const SCENE_EXTRAS: Record<Scene, ('stars' | 'moon' | 'window' | 'rug' | 'flakes' | 'waves')[]> = {
  meadow: [],
  beach: ['waves'],
  room: ['window', 'rug'],
  snow: ['flakes'],
  evening: ['stars', 'moon'],
};

/** The pet stands with its feet this far above the bottom of the view (`resize` in index.ts). */
export const PET_FEET = 50;
