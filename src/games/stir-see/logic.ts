import type { LineId } from '../../content/voice-script';
import type { BandLevels } from '../../progress/difficulty';
import type { Rng } from '../../engine/random';
import type { View } from '../../engine/view';

/**
 * Stir and See (docs/definitions/stir-and-see.md): a clear cup of water and a spoon. A spoonful of something is stirred in
 * and it vanishes into the water, sinks to the bottom and stays, or floats on top. The outcome table is authored, not
 * simulated, so every result can be tested. Nothing here is food or a drink, and no chemical change is shown anywhere.
 */

export type Outcome = 'vanish' | 'settle' | 'float';
export const OUTCOMES: Outcome[] = ['vanish', 'settle', 'float'];

export const MATERIALS = {
  sugar: { outcome: 'vanish', word: 'sugar', from: 1 },
  salt: { outcome: 'vanish', word: 'salt', from: 3 },
  sand: { outcome: 'settle', word: 'sand', from: 1 },
  pebble: { outcome: 'settle', word: 'pebble', from: 3 },
  leaf: { outcome: 'float', word: 'leaf', from: 2 },
  oil: { outcome: 'float', word: 'drop of oil', from: 3 },
} as const satisfies Record<string, { outcome: Outcome; word: string; from: number }>;
export type Material = keyof typeof MATERIALS;
export const ALL_MATERIALS = Object.keys(MATERIALS) as Material[];

export const outcomeOf = (m: Material): Outcome => MATERIALS[m].outcome;
export const wordOf = (m: Material) => MATERIALS[m].word;
/** The materials a level may use: level 1 has sugar and sand, level 2 adds the leaf, level 3 on has all six. */
export const poolFor = (level: number) => ALL_MATERIALS.filter((m) => MATERIALS[m].from <= level);
const ofOutcome = (pool: Material[], o: Outcome) => pool.filter((m) => outcomeOf(m) === o);

// The cup -----------------------------------------------------------------------------------------

/**
 * What is in one cup of plain water. A vanished material leaves its shimmer (it is still in there), a settled one a heap on
 * the bottom counted in spoons, and a floating one rides on top. The water level is not part of the state: nothing that
 * goes in changes it, so the cup never needs a volume rule.
 */
export interface Cup {
  shimmer: Material[];
  heap: { material: Material; spoons: number }[];
  floating: Material[];
}

export const emptyCup = (): Cup => ({ shimmer: [], heap: [], floating: [] });

/** One spoon of `m` stirred into the cup. Returns a new cup; the same material always does the same thing. */
export function stir(cup: Cup, m: Material): Cup {
  const next: Cup = {
    shimmer: [...cup.shimmer],
    heap: cup.heap.map((h) => ({ ...h })),
    floating: [...cup.floating],
  };
  const o = outcomeOf(m);
  if (o === 'vanish') {
    if (!next.shimmer.includes(m)) next.shimmer.push(m);
  } else if (o === 'settle') {
    const h = next.heap.find((h) => h.material === m);
    if (h) h.spoons++;
    else next.heap.push({ material: m, spoons: 1 });
  } else if (!next.floating.includes(m)) next.floating.push(m);
  return next;
}

/** A cup with one spoon of `m` in it, as a level-3 or level-5 cup arrives. */
export const cupOf = (m: Material) => stir(emptyCup(), m);

/** How many spoons have settled to the bottom of a cup. */
export const heapSpoons = (cup: Cup) => cup.heap.reduce((n, h) => n + h.spoons, 0);

// Levels --------------------------------------------------------------------------------------------

export type Mode = 'stir' | 'three' | 'find' | 'guess' | 'sort';

export interface Plan {
  mode: Mode;
  name: string;
}

export const PLANS: Plan[] = [
  { mode: 'stir', name: 'Stir it: tap the spoon to stir sugar, then sand, into a cup of water' },
  { mode: 'three', name: 'Three spoons: stir in three things and see one vanish, one sink and one float' },
  { mode: 'find', name: 'Which one disappears?: three stirred cups; find the one the picture asks for' },
  {
    mode: 'guess',
    name: 'What will it do?: say what you think, then stir it in and see (a guess is never wrong)',
  },
  { mode: 'sort', name: 'Sort the cups: look in each stirred cup and put it with vanished, sank or floated' },
];

export const stirPlan = (level: number) => PLANS[Math.max(0, Math.min(PLANS.length - 1, level - 1))];
export const describeLevel = (level: number) => stirPlan(level).name;

/** Levels 1–5 are defined; IDs from 6 are kept for How many spoons? and later rungs. */
export const TOP_LEVEL = 5;

export const LEVELS: BandLevels = {
  toddler: { min: 1, max: 2 },
  preschool: { min: 1, max: 4 },
  prek: { min: 3, max: 4 },
  school: { min: 4, max: TOP_LEVEL },
};

/** Level 1: sugar, then sand, every time. */
export const stirRound = (): Material[] => ['sugar', 'sand'];

/** Level 2: one of each outcome from the level-2 pool (sugar, sand, the leaf); the authored round in that order. */
export function threeRound(rng: Rng, authored: boolean): Material[] {
  if (authored) return ['sugar', 'sand', 'leaf'];
  const pool = poolFor(2);
  return rng.shuffle(OUTCOMES.map((o) => rng.pick(ofOutcome(pool, o))));
}

export interface Question {
  /** The three cups left to right, each with one spoon of a different outcome's material in it. */
  cups: Material[];
  /** The material the card pictures; exactly one cup holds it. */
  target: Material;
}

/**
 * Level 3: three questions, one asking for each outcome. Each shows three cups, one of each outcome, so exactly one cup
 * holds the material asked for and the others did something else with theirs. The authored first round asks for the cup
 * where it vanished, then settled, then floated.
 */
export function findRound(rng: Rng, authored: boolean): Question[] {
  if (authored)
    return [
      { cups: ['sand', 'sugar', 'leaf'], target: 'sugar' },
      { cups: ['oil', 'salt', 'pebble'], target: 'pebble' },
      { cups: ['leaf', 'sand', 'salt'], target: 'leaf' },
    ];
  const pool = poolFor(3);
  return rng.shuffle([...OUTCOMES]).map((asked) => {
    const cups = rng.shuffle(OUTCOMES.map((o) => rng.pick(ofOutcome(pool, o))));
    return { cups, target: cups.find((m) => outcomeOf(m) === asked)! };
  });
}

/** Level 4: four materials, one of each outcome and a repeat outcome with its other material, never two alike in a row. */
export function guessRound(rng: Rng, authored: boolean): Material[] {
  if (authored) return ['salt', 'pebble', 'leaf', 'sugar'];
  const pool = poolFor(4);
  for (;;) {
    const firsts = OUTCOMES.map((o) => rng.pick(ofOutcome(pool, o)));
    const again = rng.pick(OUTCOMES);
    const other = ofOutcome(pool, again).find((m) => !firsts.includes(m))!;
    const order = rng.shuffle([...firsts, other]);
    if (order.every((m, i) => i === 0 || outcomeOf(m) !== outcomeOf(order[i - 1]))) return order;
  }
}

/** Level 5: all six materials, so every outcome twice, never two alike in a row. */
export function sortRound(rng: Rng, authored: boolean): Material[] {
  if (authored) return ['salt', 'pebble', 'oil', 'sand', 'sugar', 'leaf'];
  for (;;) {
    const order = rng.shuffle([...ALL_MATERIALS]);
    if (order.every((m, i) => i === 0 || outcomeOf(m) !== outcomeOf(order[i - 1]))) return order;
  }
}

// What the voice says ------------------------------------------------------------------------------

/** The line after a spoon of `m` goes in. */
export const sayStir = (m: Material): LineId => `stirsee.${outcomeOf(m)}.${m}` as LineId;

/** The clue for the outcome a question asks about. */
export const hintFor = (o: Outcome): LineId => `stirsee.hint.${o}` as LineId;

// Level 3: which one? --------------------------------------------------------------------------------

/** The pet taps the right cup for her on the third wrong tap of a question. */
export const SUPPORTED_AT = 3;

export interface FindPick {
  right: boolean;
  /** Counted as a miss: a wrong cup, once per question per cup. */
  miss: boolean;
  /** A spoken clue follows a wrong tap. */
  hint: LineId | null;
  /** From the second wrong tap the right cup glows. */
  glow: boolean;
  /** The third wrong tap: the pet taps the right cup and the question finishes with help. */
  supported: boolean;
  /** The question is over (right, or supported), and the next one's turn begins. */
  done: boolean;
}

/**
 * Level 3's accounting, kept apart from the drawing so it can be tested. A wrong cup is one miss, counted once per question
 * per cup (tapping the same wrong cup again shows it again but counts nothing). Every wrong tap is a clue; the second makes
 * the right cup glow (one counted hint per question); the third is a supported finish. Show a hint glows the right cup and
 * counts one hint per question however often she asks.
 */
export class FindRound {
  index = 0;
  misses = 0;
  hints = 0;
  /** Wrong taps on the question in play, and the wrong cups already counted. */
  wrong = 0;
  readonly counted = new Set<number>();
  hinted = false;
  /** The outcomes the round has shown her (every cup she tapped, and the right one). */
  readonly seen = new Set<Outcome>();

  constructor(readonly questions: Question[]) {}

  get question(): Question {
    return this.questions[Math.min(this.index, this.questions.length - 1)];
  }

  get finished() {
    return this.index >= this.questions.length;
  }

  /** Where the right cup is in the row. */
  get answer() {
    return this.question.cups.indexOf(this.question.target);
  }

  hintLine(): LineId {
    return hintFor(outcomeOf(this.question.target));
  }

  /** She taps the cup at `i`. */
  tap(i: number): FindPick {
    if (this.finished)
      return { right: false, miss: false, hint: null, glow: false, supported: false, done: false };
    const q = this.question;
    this.seen.add(outcomeOf(q.cups[i]));
    if (i === this.answer) {
      this.next();
      return { right: true, miss: false, hint: null, glow: false, supported: false, done: true };
    }
    this.wrong++;
    const miss = !this.counted.has(i);
    if (miss) {
      this.counted.add(i);
      this.misses++;
    }
    const glow = this.wrong >= 2;
    if (glow && !this.hinted) {
      this.hinted = true;
      this.hints++;
    }
    const hint = this.hintLine();
    if (this.wrong >= SUPPORTED_AT) {
      this.seen.add(outcomeOf(q.target));
      this.next();
      return { right: false, miss, hint, glow: false, supported: true, done: true };
    }
    return { right: false, miss, hint, glow, supported: false, done: false };
  }

  /** Show a hint: the right cup glows and the clue is spoken; one counted hint per question. */
  ask(): { glow: number; hint: LineId } {
    const glow = this.answer;
    const hint = this.hintLine();
    if (!this.finished && !this.hinted) {
      this.hinted = true;
      this.hints++;
    }
    return { glow, hint };
  }

  private next() {
    this.index++;
    this.wrong = 0;
    this.counted.clear();
    this.hinted = false;
  }
}

// Level 4: what will it do? -----------------------------------------------------------------------------

/**
 * Level 4's record. She taps a picture card for what she thinks (and may change her mind until the spoon is tapped), then
 * the spoon shows what happens. A guess is a prediction, never an answer, so nothing is ever counted.
 */
export class GuessRound {
  index = 0;
  readonly misses = 0;
  readonly hints = 0;
  readonly record: { material: Material; guess: Outcome; result: Outcome }[] = [];
  guess: Outcome | null = null;

  constructor(readonly materials: Material[]) {}

  get material(): Material {
    return this.materials[Math.min(this.index, this.materials.length - 1)];
  }

  get finished() {
    return this.index >= this.materials.length;
  }

  choose(o: Outcome) {
    if (!this.finished) this.guess = o;
  }

  clear() {
    this.guess = null;
  }

  /** The spoon is tapped. Null while she has not guessed (the spoon waits). */
  test(): { material: Material; result: Outcome; match: boolean; line: LineId } | null {
    if (this.finished || !this.guess) return null;
    const material = this.material;
    const result = outcomeOf(material);
    const match = this.guess === result;
    this.record.push({ material, guess: this.guess, result });
    this.guess = null;
    this.index++;
    return { material, result, match, line: match ? 'stirsee.match' : 'stirsee.surprise' };
  }

  ask(): LineId {
    return 'stirsee.hint.guess';
  }
}

// Level 5: sort the cups ----------------------------------------------------------------------------------

export interface Filing {
  done: boolean;
  miss: boolean;
  hint: LineId | null;
  glow: boolean;
  supported: boolean;
  /** She filed before looking, so the game lets the cup settle first: every filing has its evidence. */
  looked: boolean;
  /** Where the cup belongs. */
  tray: Outcome;
}

/**
 * Level 5's accounting, shaped like Level 3's. A cup arrives just stirred, still swirling; a tap on it lets it settle and
 * shows what it holds, and that look is always free. Only a wrong tray counts: one miss each time and a spoken clue, a
 * glow (one counted hint per cup) from the second, and the pet's own filing on the third. Filing before looking is
 * allowed and judged; the cup settles first.
 */
export class SortRound {
  index = 0;
  misses = 0;
  hints = 0;
  wrong = 0;
  hinted = false;
  /** The cup in play has settled and shows what it holds. */
  looked = false;
  readonly seen = new Set<Outcome>();

  constructor(readonly materials: Material[]) {}

  get material(): Material {
    return this.materials[Math.min(this.index, this.materials.length - 1)];
  }

  get finished() {
    return this.index >= this.materials.length;
  }

  /** She taps the cup: it settles and shows its contents. Never counted. */
  look() {
    if (this.finished) return;
    this.looked = true;
    this.seen.add(outcomeOf(this.material));
  }

  file(tray: Outcome): Filing {
    const right = outcomeOf(this.material);
    if (this.finished)
      return {
        done: false,
        miss: false,
        hint: null,
        glow: false,
        supported: false,
        looked: false,
        tray: right,
      };
    const looked = !this.looked;
    if (looked) this.look();
    if (tray === right) {
      this.next();
      return { done: true, miss: false, hint: null, glow: false, supported: false, looked, tray: right };
    }
    this.misses++;
    this.wrong++;
    const glow = this.wrong >= 2;
    if (glow && !this.hinted) {
      this.hinted = true;
      this.hints++;
    }
    const hint = hintFor(right);
    if (this.wrong >= SUPPORTED_AT) {
      this.next();
      return { done: true, miss: true, hint, glow: false, supported: true, looked, tray: right };
    }
    return { done: false, miss: true, hint, glow, supported: false, looked, tray: right };
  }

  ask(): { glow: Outcome; hint: LineId; looked: boolean } {
    const looked = !this.finished && !this.looked;
    if (looked) this.look();
    if (!this.finished && !this.hinted) {
      this.hinted = true;
      this.hints++;
    }
    const right = outcomeOf(this.material);
    return { glow: right, hint: hintFor(right), looked };
  }

  private next() {
    this.index++;
    this.wrong = 0;
    this.hinted = false;
    this.looked = false;
  }
}

// Discoveries -----------------------------------------------------------------------------------------------

export type Discovery = 'vanishes' | 'settles' | 'floats' | 'still-there';
export const DISCOVERIES: Discovery[] = ['vanishes', 'settles', 'floats', 'still-there'];
export const discoveryOf = (o: Outcome): Discovery =>
  o === 'vanish' ? 'vanishes' : o === 'settle' ? 'settles' : 'floats';
/** The materials each outcome's journal card names. */
export const materialsOf = (o: Outcome) => ofOutcome(ALL_MATERIALS, o);

// Layout ------------------------------------------------------------------------------------------------------

export interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface CupLayout {
  /** The cups, left to right (one, or three at level 3). */
  cups: Box[];
  /** The spoon (stir, three and guess). */
  spoon: Box | null;
  /** Level 4's three picture cards, or level 5's three trays, in `OUTCOMES` order. */
  choices: Box[];
  /** Level 3's question card: a picture, not a target. */
  card: Box | null;
}

export const SPOON = 150;
export const CHOICE = 150;
export const BIG_CUP = { w: 240, h: 300 };
export const SMALL_CUP = { w: 180, h: 220 };

const box = (cx: number, cy: number, w: number, h = w): Box => ({ x: cx - w / 2, y: cy - h / 2, w, h });
const row = (cx: number, cy: number, size: number, gap: number) =>
  [-1, 0, 1].map((i) => box(cx + i * (size + gap), cy, size));

/**
 * Where everything goes. Sideways (the 1024 × 768 area or wider) the cup is in the middle and the bottom row sits right of
 * the guide's corner; upright (a phone on the 768-wide area, or an iPad) the cup is high, the choices under it and the
 * spoon alone at the bottom middle. Every target is at least 120 units and clear of Home and the guide.
 */
export function cupLayout(view: Pick<View, 'w' | 'h'>, mode: Mode): CupLayout {
  const { w, h } = view;
  const cx = w / 2;
  if (h > w) {
    // Upright there is height to spare, so everything is drawn larger than sideways (a phone's cup is about 165 pixels).
    const big = { w: Math.min(330, w * 0.43), h: Math.min(330, w * 0.43) * 1.25 };
    const small = { w: Math.min(210, (w - 120) / 3.3), h: Math.min(210, (w - 120) / 3.3) * 1.25 };
    const choice = Math.min(190, (w - 100) / 3.4);
    const spoon = Math.min(190, w * 0.25);
    const spoonY = h - 120 - spoon / 2;
    switch (mode) {
      case 'stir':
      case 'three':
        return {
          cups: [box(cx, Math.min(h * 0.42, spoonY - spoon / 2 - 60 - big.h / 2), big.w, big.h)],
          spoon: box(cx, spoonY, spoon),
          choices: [],
          card: null,
        };
      case 'guess': {
        const cupY = Math.max(220 + big.h / 2, h * 0.3);
        return {
          cups: [box(cx, cupY, big.w, big.h)],
          spoon: box(cx, spoonY, spoon),
          choices: row(cx, cupY + big.h / 2 + 50 + choice / 2, choice, 30),
          card: null,
        };
      }
      case 'find': {
        const card = 170;
        const cupY = Math.max(260 + card + small.h / 2, h * 0.5);
        return {
          cups: row(cx, cupY, small.w, 30).map((b) => box(b.x + b.w / 2, b.y + b.h / 2, small.w, small.h)),
          spoon: null,
          choices: [],
          card: box(cx, cupY - small.h / 2 - 80 - card / 2, card),
        };
      }
      case 'sort': {
        const cupY = Math.max(220 + big.h / 2, h * 0.32);
        return {
          cups: [box(cx, cupY, big.w, big.h)],
          spoon: null,
          choices: row(cx, cupY + big.h / 2 + 60 + choice / 2, choice, 30),
          card: null,
        };
      }
    }
  }
  const cy = h / 2;
  switch (mode) {
    case 'stir':
    case 'three':
      return {
        cups: [box(cx, cy - 30, BIG_CUP.w, BIG_CUP.h)],
        spoon: box(cx + BIG_CUP.w / 2 + 150, cy + 110, SPOON),
        choices: [],
        card: null,
      };
    case 'guess':
      return {
        cups: [box(cx - 60, cy - 80, BIG_CUP.w, BIG_CUP.h)],
        spoon: box(cx - 60 + BIG_CUP.w / 2 + 140, cy - 80, SPOON),
        choices: row(cx + 60, cy + 250, CHOICE - 10, 30),
        card: null,
      };
    case 'find':
      return {
        cups: row(cx, cy + 30, SMALL_CUP.w, 60).map((b) =>
          box(b.x + b.w / 2, b.y + b.h / 2, SMALL_CUP.w, SMALL_CUP.h),
        ),
        spoon: null,
        choices: [],
        card: box(cx, 140, 140),
      };
    case 'sort':
      return {
        cups: [box(cx, cy - 100, 220, 260)],
        spoon: null,
        choices: row(cx + 40, cy + 220, CHOICE, 40),
        card: null,
      };
  }
}

export const overlaps = (a: Box, b: Box) =>
  a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
