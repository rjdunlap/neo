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
  | 'toes'
  | 'eyes'
  | 'mouth'
  | 'cheeks'
  | 'shoulders'
  | 'chin';
export type SaysMode = 'copy' | 'body' | 'pairs' | 'says' | 'freeze' | 'opposite' | 'pat';

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
/** The ten body words (level 2): the first five, then five more each friend can show (dive slice 2). */
export const BODY = [
  'nose',
  'tummy',
  'ears',
  'head',
  'toes',
  'eyes',
  'mouth',
  'cheeks',
  'shoulders',
  'chin',
] as const satisfies readonly Move[];
export type BodyWord = (typeof BODY)[number];

/**
 * Where on the body each word sits. Two words in a row never share a zone, so the mittens travel between them and show
 * which part is meant: the face is small on every friend (eyes, nose, mouth and chin sit close), so face words alternate
 * with the head or the body below it. A rule on words, not on one friend's drawing, so a seed deals the
 * same words to every friend (the test measures the travel on each species).
 */
export const BODY_ZONE: Record<BodyWord, 'face' | 'top' | 'body'> = {
  eyes: 'face',
  nose: 'face',
  mouth: 'face',
  cheeks: 'face',
  chin: 'face',
  ears: 'face',
  head: 'top',
  shoulders: 'body',
  tummy: 'body',
  // With the tummy: a friend with no feet (the glider) touches the floor just under its tummy.
  toes: 'body',
};

/**
 * Moves whose mittens land where a body word's do, so a round never deals both (the eyes are peekaboo's hiding place).
 * Dropped from the "Pet says" deck one side at a time, at random.
 */
export const CLASHES: [Move, Move][] = [['eyes', 'peekaboo']];

/**
 * The chant (level 2's last turn), the "head, shoulders, knees and toes" shape with words a blob can show: four words,
 * sung and touched. Each verse leaves one more word unsung from the front while the touch stays, until the last verse
 * goes all the way through with touches and no words at all. `CHANT_VERSES[v][i]` is whether word i is sung in verse v.
 */
export const CHANT_WORDS: BodyWord[] = ['head', 'shoulders', 'tummy', 'toes'];
export const CHANT_VERSES: boolean[][] = Array.from({ length: CHANT_WORDS.length + 1 }, (_, v) =>
  CHANT_WORDS.map((_, i) => i >= v),
);
/** The marimba note under each chant word: a step down the five-note scale as the hands go down the body. */
export const CHANT_STEPS = [9, 7, 5, 4];
export const CHANT_LINES = {
  head: 'says.chant.head',
  shoulders: 'says.chant.shoulders',
  tummy: 'says.chant.tummy',
  toes: 'says.chant.toes',
} satisfies Partial<Record<BodyWord, LineId>>;

/** How "Pet says" asks (level 4). `says` and `this` mean move; the rest are tricks, where she stays still. */
export type SaysCue = 'says' | 'this' | 'plain' | 'name' | 'that';
export const TRICK_CUES: SaysCue[] = ['plain', 'name', 'that'];

/** Other names a trick can borrow ("Bunny says: clap!"), never the pet's own or the child's. */
export const WRONG_NAMES = ['Bunny', 'Teddy', 'Ducky'];
export function wrongName(start: number, avoid: string[]): string {
  const no = new Set(avoid.map((a) => a.trim().toLowerCase()));
  for (let k = 0; k < WRONG_NAMES.length; k++) {
    const name = WRONG_NAMES[(start + k) % WRONG_NAMES.length];
    if (!no.has(name.toLowerCase())) return name;
  }
  return WRONG_NAMES[start % WRONG_NAMES.length];
}

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
  eyes: { word: 'point to your eyes', line: 'says.move.eyes' },
  mouth: { word: 'touch your mouth', line: 'says.move.mouth' },
  cheeks: { word: 'pat your cheeks', line: 'says.move.cheeks' },
  shoulders: { word: 'touch your shoulders', line: 'says.move.shoulders' },
  chin: { word: 'hold your chin', line: 'says.move.chin' },
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
  /** Where the mittens go for each body word. Mouth, chin and shoulders are not marked parts: they are placed from the nose, the neck and the body box. */
  targets: Record<BodyWord, Pair>;
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
  at: (part: 'nose' | 'tummy' | 'ears' | 'head' | 'feet' | 'eyes' | 'cheeks' | 'neck') => readonly Pt[],
  box: { x: number; y: number; width: number; height: number },
): SaysFrame {
  const cx = box.x + box.width / 2;
  const right = box.x + box.width;
  const floor = Math.min(0, box.y + box.height);
  const y = box.y + box.height * 0.62;
  const rest = { left: { x: box.x - 10, y }, right: { x: right + 10, y } };
  const one = (p: 'nose' | 'tummy' | 'head') => at(p)[0] ?? { x: cx, y };
  const h = box.height;
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
  const eyes = pair(at('eyes'), 18, { x: nose.x, y: nose.y - 8 });
  // Just below the nose; the chin cupped under that; the shoulders out from the neck (or above the tummy, where a friend
  // has no neck) toward the body's sides.
  const mouth = { x: nose.x, y: nose.y + Math.max(8, h * 0.09) };
  const chinY = mouth.y + Math.max(10, h * 0.08);
  const neck = at('neck')[0] ?? { x: tummy.x, y: tummy.y - h * 0.1 };
  const spread = Math.max(24, box.width * 0.32);
  return {
    rest,
    targets: {
      nose: { left: rest.left, right: nose },
      tummy: { left: { x: tummy.x - 38, y: tummy.y }, right: { x: tummy.x + 38, y: tummy.y } },
      ears: pair(at('ears'), 14, head),
      head: { left: rest.left, right: { x: head.x, y: head.y - 36 } },
      toes: pair(at('feet'), 40, { x: cx, y: floor }),
      // Pointing just outside each eye, so the eyes stay open (peekaboo covers them).
      eyes: {
        left: { x: eyes.left.x - 16, y: eyes.left.y },
        right: { x: eyes.right.x + 16, y: eyes.right.y },
      },
      mouth: { left: rest.left, right: mouth },
      cheeks: pair(at('cheeks'), 16, { x: nose.x, y: mouth.y }),
      shoulders: {
        left: { x: neck.x - spread, y: neck.y + h * 0.06 },
        right: { x: neck.x + spread, y: neck.y + h * 0.06 },
      },
      chin: { left: { x: mouth.x - 14, y: chinY }, right: { x: mouth.x + 14, y: chinY } },
    },
    eyes,
    clap: { left: { x: cx - 20, y: y - 17 }, right: { x: cx + 20, y: y - 17 } },
    up: { left: { x: cx - 70, y: box.y - 50 }, right: { x: cx + 70, y: box.y - 50 } },
    down: { left: { x: box.x - 22, y: floor - 30 }, right: { x: right + 22, y: floor - 30 } },
    wave: { x: right + 22, y: box.y + 40 },
    knock: 14,
  };
}

/** How much larger than its own drawing the friend stands, so every friend is about the pip's size on screen. */
export const petGrow = (b: { width: number; height: number }) =>
  Math.max(1, Math.min(2.2, 270 / b.height, 520 / b.width));

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
  {
    mode: 'body',
    turns: 6,
    name: 'Body words: point to your eyes, touch your shoulders, hold your chin; then the "head, shoulders, tummy, toes" chant',
  },
  {
    mode: 'pairs',
    turns: 4,
    name: 'Two moves in order, sometimes counted: "stomp three times, then hop like a frog"',
  },
  {
    mode: 'says',
    turns: 6,
    name: '"Pet says": move only when you hear the pet\'s name first; later a wrong name, and "do this, do that"',
  },
  {
    mode: 'freeze',
    turns: 4,
    name: 'Freeze dance: four tunes to bounce, sway or dance like a robot to, then freeze like a tree or a flamingo',
  },
  {
    mode: 'opposite',
    turns: 6,
    name: 'Opposite day: a sun means copy the pet, a moon means do the opposite (reach up high, so crouch down low)',
  },
];

export const LEVELS: BandLevels = {
  // Level 13, Pat the pet, is the easiest, so lap plays it first, then 1 and 2 (see `order`).
  lap: { min: 1, max: 13, order: [13, 1, 2] },
  toddler: { min: 1, max: 3 },
  preschool: { min: 2, max: 4 },
  prek: { min: 3, max: Math.min(10, PLANS.length) },
  // The school window opens at Opposite day (decision 1, 2026-10-23) and grows to 12 as the rule levels are built; a
  // school player's saved level lifts to 6.
  school: { min: 6, max: Math.min(12, PLANS.length) },
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
  /** "Pet says" level: how the pet asks; `says` is true exactly for `says` and `this`. */
  cue?: SaysCue;
  /** A wrong-name trick: where to start in `WRONG_NAMES` (see `wrongName`). */
  who?: number;
  /** Level 2's last turn: the chant's verses (`CHANT_VERSES`), with no single move. */
  chant?: boolean[][];
  /** Level 3: how many times to do each move, where one is asked (only countable moves, two or three). */
  counts?: (number | undefined)[];
  /** Level 5: the tune, how the pet dances to it, and the statue it freezes into. */
  dance?: Dance;
  /** Opposite day: the sun means copy the move, the moon means do its partner (which the pet reveals after the arrow). */
  sign?: 'sun' | 'moon';
}

// Opposite day (level 6, dive slice 5) -----------------------------------------------------------------

/** The move pairs Opposite day flips between: each move's partner is the one it is the opposite of. */
export const OPPOSITE_PAIRS: [Move, Move][] = [
  ['up', 'down'],
  ['head', 'toes'],
];
export const PARTNER: Partial<Record<Move, Move>> = Object.fromEntries(
  OPPOSITE_PAIRS.flatMap(([a, b]) => [
    [a, b],
    [b, a],
  ]),
);
export const partnerOf = (m: Move): Move => {
  const p = PARTNER[m];
  if (!p) throw new Error(`${m} has no opposite`);
  return p;
};
/** The first turns are suns, so copying is met before flipping. */
export const SUN_TURNS = 2;

/**
 * Six turns: two suns (copy me), then moons (do the opposite). Each turn draws from the other pair than the turn before,
 * so the move she just did as a reveal is never the next turn's ask.
 */
export function oppositeTurns(turns: number, rng: Rng): Turn[] {
  let pair = rng.int(0, OPPOSITE_PAIRS.length - 1);
  return Array.from({ length: turns }, (_, i) => {
    pair = (pair + 1) % OPPOSITE_PAIRS.length;
    return { moves: [rng.pick(OPPOSITE_PAIRS[pair])], sign: i < SUN_TURNS ? 'sun' : 'moon' };
  });
}

/** The levels with the held "once more" button, where a replayed turn counts one hint (decision 2): the rule levels. */
export const ONCE_MORE_MODES: SaysMode[] = ['says', 'opposite'];

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
    case 'body': {
      // Five of the ten words, never two in a row from one zone, then the chant.
      for (;;) {
        const words = rng.shuffle([...BODY]).slice(0, plan.turns - 1);
        if (words.some((w, i) => i > 0 && BODY_ZONE[w] === BODY_ZONE[words[i - 1]])) continue;
        return [...words.map((m): Turn => ({ moves: [m] })), { moves: [], chant: CHANT_VERSES }];
      }
    }
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
      // Two or three tricks, never first and never back to back, so the rule has a chance to settle in. The first trick
      // is the plain one (just the move); a wrong name or "do that" can come after it, and "do that" only once a
      // "do this" has shown what "do this" means.
      const count = rng.chance(0.3) ? 3 : 2;
      let tricks: number[];
      for (;;) {
        tricks = [...new Set(Array.from({ length: count }, () => rng.int(1, plan.turns - 1)))].sort(
          (a, b) => a - b,
        );
        if (tricks.length === count && tricks.every((t, k) => k === 0 || t - tricks[k - 1] >= 2)) break;
      }
      const cues: SaysCue[] = Array.from({ length: plan.turns }, () => 'says');
      tricks.forEach((t, k) => (cues[t] = k === 0 ? 'plain' : rng.pick(TRICK_CUES)));
      const firstThat = cues.indexOf('that');
      if (firstThat >= 0) {
        const room = cues.flatMap((c, i) => (c === 'says' && i > tricks[0] && i < firstThat ? [i] : []));
        if (room.length) cues[rng.pick(room)] = 'this';
        else cues[firstThat] = 'name';
      }
      let pool: Move[] = [...ALL_MOVES, ...BODY];
      for (const pair of CLASHES) {
        const drop = rng.pick(pair);
        pool = pool.filter((m) => m !== drop);
      }
      // Body words here keep level 2's rule too: never two in a row from one zone.
      const isWord = (m: Move): m is BodyWord => m in BODY_ZONE;
      let dealt: Move[];
      do dealt = deck(pool).slice(0, plan.turns);
      while (
        dealt.some(
          (m, i) =>
            i > 0 &&
            isWord(m) &&
            isWord(dealt[i - 1]) &&
            BODY_ZONE[m] === BODY_ZONE[dealt[i - 1] as BodyWord],
        )
      );
      return dealt.map((m, i): Turn => {
        const cue = cues[i];
        const turn: Turn = { moves: [m], says: cue === 'says' || cue === 'this', cue };
        if (cue === 'name') turn.who = rng.int(0, WRONG_NAMES.length - 1);
        return turn;
      });
    }
    case 'pat':
      return rng
        .shuffle([...PAT_MOVES])
        .slice(0, plan.turns)
        .map((m) => ({ moves: [m] }));
    case 'freeze':
      return makeDances(plan.turns, rng).map((dance) => ({ moves: [], dance }));
    case 'opposite':
      return oppositeTurns(plan.turns, rng);
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
