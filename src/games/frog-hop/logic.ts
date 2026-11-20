import type { Rng } from '../../engine/random';
import type { BandLevels } from '../../progress/difficulty';

/**
 * Frog Hop: a number line of lily pads. Find a number, then one more and one less, then adding
 * and taking away as hops along the line, then how many hops lie between two numbers, then a
 * longer line to 20, then splits a sum at ten, forward and back. Nine pads show at a time; on the long line the
 * view slides to fit. At the top of school the pads sit at quarters of a whole (Fraction Landings): hops of a quarter,
 * a half or a whole, then two hop sizes that reach the same lily. Last, count up to take away: `13 − 9` as the hops from 9 to
 * the flag on 13. Then over ten, your way: `8 + 5` with no cards, where a stop on 10 is hers to choose. Last, hop by tens:
 * the pads count 0, 10, 20 … 100 and `30 + 20` is two hops of ten.
 */
export type HopMode =
  | 'find'
  | 'next'
  | 'add'
  | 'back'
  | 'gap'
  | 'big'
  | 'make-ten'
  | 'back-ten'
  | 'frac-hop'
  | 'frac-match'
  | 'count-up'
  | 'your-way'
  | 'tens';

/** Fraction Landings: the pads are quarter ticks, 0 to 2. */
export const isFrac = (mode: HopMode) => mode === 'frac-hop' || mode === 'frac-match';

/** The two levels that split a trip at ten: a card for the hops to ten, then a pad for where the rest land. */
/** The levels whose whole answer is a number card for the hops between two pads. */
export const countsHops = (mode: HopMode) => mode === 'gap' || mode === 'count-up';

export const splitsAtTen = (mode: HopMode) => mode === 'make-ten' || mode === 'back-ten';

/** Over ten, your way: the pad she may stop on first. A tap there is never wrong. */
export const TEN = 10;

export interface HopPlan {
  mode: HopMode;
  /** Highest number on the line. */
  top: number;
  questions: number;
  name: string;
  /** Ticks per whole on the fraction levels (4: quarters); whole-number plans leave it out. */
  unit?: number;
  /**
   * What one pad is worth on the tens line (10); other plans leave it out. Questions, windows and slots stay counted in
   * pads (pad `i` reads `i × stride`), so only what is shown or said is multiplied.
   */
  stride?: number;
}

export const PLANS: HopPlan[] = [
  { mode: 'find', top: 8, questions: 5, name: 'Hop to a number on the line, 0 to 8' },
  { mode: 'next', top: 8, questions: 5, name: 'One more or one less: hop to the next number up or back' },
  {
    mode: 'add',
    top: 8,
    questions: 5,
    name: 'Start at a number and hop 1 to 4 more: where does the frog land?',
  },
  { mode: 'back', top: 8, questions: 5, name: 'Hop back 1 to 4: taking away on the line' },
  {
    mode: 'gap',
    top: 10,
    questions: 5,
    name: 'How many hops from one number to another? Choose a number card',
  },
  { mode: 'big', top: 20, questions: 5, name: 'A longer line to 20: hop on or back up to 6' },
  {
    mode: 'make-ten',
    top: 20,
    questions: 5,
    name: 'Hop to 10 first, then hop the rest of a sum that crosses 10',
  },
  {
    mode: 'back-ten',
    top: 20,
    questions: 5,
    name: 'Hop back to 10 first, then hop the rest of a take-away that crosses 10',
  },
  {
    mode: 'frac-hop',
    top: 8,
    unit: 4,
    questions: 5,
    name: 'Quarter and half hops along one whole: where does the frog land?',
  },
  {
    mode: 'frac-match',
    top: 8,
    unit: 4,
    questions: 5,
    name: 'Two hop sizes, one lily: how many hops of the other size reach the same place?',
  },
  {
    mode: 'count-up',
    top: 20,
    questions: 5,
    name: 'Count up to take away: 13 − 9 is the hops from 9 to 13. Choose a number card',
  },
  {
    mode: 'your-way',
    top: 20,
    questions: 5,
    name: 'Over ten, your way: a sum or take-away across 10, with a stop at 10 if she chooses',
  },
  {
    mode: 'tens',
    top: 10,
    stride: 10,
    questions: 5,
    name: 'Hop by tens: pads 0, 10, 20 … 100, start at 10 to 70 and hop 1 to 4 tens on or back',
  },
];

/** The number a pad shows and the frog says: its place on the line times the plan's stride. */
export const padValue = (plan: HopPlan, n: number) => n * (plan.stride ?? 1);

export const LEVELS: BandLevels = {
  preschool: { min: 1, max: 2 },
  prek: { min: 1, max: 4 },
  school: { min: 3, max: PLANS.length },
};

export const planFor = (level: number) => PLANS[Math.min(PLANS.length, Math.max(1, level)) - 1];

/** Pads visible at once. */
export const WINDOW = 9;

export interface HopQuestion {
  /** Where the frog starts. */
  start: number;
  /** The pad that answers it (for 'gap', where the frog ends up). */
  target: number;
  /** Signed hops from start to target. */
  hops: number;
  /** For 'next': whether it asks for one more or one less. */
  ask?: 'more' | 'less';
  /** First pad in view. */
  lo: number;
  /** On split-at-ten questions, the hops from `start` to ten. */
  toTen?: number;
  /** On split-at-ten questions, the hops after reaching ten. */
  remaining?: number;
  /** Fraction levels: ticks per hop (1 a quarter, 2 a half, 4 a whole) and how many hops. */
  jump?: number;
  count?: number;
  /** Fraction Match: the second hop size, and the card that answers it (`answer2 × jump2 = target`). */
  jump2?: number;
  answer2?: number;
}

/** The answer a child gives: a pad, for 'gap' the number of hops, for Fraction Match the hops of the second size. */
export const answerOf = (mode: HopMode, q: HopQuestion) =>
  countsHops(mode) ? Math.abs(q.hops) : mode === 'frac-match' ? q.answer2! : q.target;

/** Number cards offered on 'gap' levels. */
export const GAP_CARDS = [1, 2, 3, 4, 5, 6];

/**
 * Which spot answers a question, for the couch bot and the how-to card's ghost finger: a lily pad counted from the first one
 * in view, or on 'gap' levels (and Fraction Match's second stage) a number card by its place in `GAP_CARDS`. -1 when the
 * answer is not on screen.
 */
export function answerSlot(mode: HopMode, q: HopQuestion, lo: number, secondStage = false): number {
  const card = countsHops(mode) || (mode === 'frac-match' && secondStage);
  const slot = card ? GAP_CARDS.indexOf(answerOf(mode, q)) : q.target - lo;
  return slot >= 0 && slot < (card ? GAP_CARDS.length : WINDOW) ? slot : -1;
}

/** A pad's name on the fraction line, by tick: mixed numbers past one. */
const FRAC_NAMES = ['0', '¼', '½', '¾', '1', '1¼', '1½', '1¾', '2'];
const FRAC_WORDS = [
  'zero',
  'one quarter',
  'one half',
  'three quarters',
  'one',
  'one and a quarter',
  'one and a half',
  'one and three quarters',
  'two',
];
const NUMBER_WORDS = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight'];
export const fracName = (t: number) => FRAC_NAMES[t];
export const fracWords = (t: number) => FRAC_WORDS[t];
/** The landing counted in quarters ("two quarters"), offered only where it differs from the plain name (ticks 2, 4, 6, 8). */
export const quarterName = (t: number) => (t > 0 && t % 2 === 0 ? `${NUMBER_WORDS[t]} quarters` : undefined);
/** Counting quarter hops says "one quarter, two quarters…"; bigger hops say the plain landing name. */
export const hopWords = (t: number, jump: number) =>
  jump === 1 ? `${NUMBER_WORDS[t]} ${t === 1 ? 'quarter' : 'quarters'}` : fracWords(t);
/** A hop size: its glyph on the sign and its spoken word. */
export const sizeName = (jump: number) => (jump === 1 ? '¼' : jump === 2 ? '½' : '1');
export const sizeWord = (jump: number) => (jump === 1 ? 'quarter' : jump === 2 ? 'half' : 'whole');
/** "two halves", "one whole", "four quarters". */
export const hopsWords = (jump: number, count: number) =>
  `${NUMBER_WORDS[count]} ${count === 1 ? sizeWord(jump) : jump === 2 ? 'halves' : `${sizeWord(jump)}s`}`;
/** The spoken hops on a sign: "one half", or "one quarter, three times". */
export const hopPhrase = (jump: number, count: number) =>
  count === 1 ? `one ${sizeWord(jump)}` : `one ${sizeWord(jump)}, ${NUMBER_WORDS[count]} times`;

/** Fraction Hop cases: start tick, ticks per hop, hops. Every landing is inside 0 to 1. */
const FRAC_HOP_CASES: [number, number, number][] = [
  [0, 2, 1],
  [0, 1, 1],
  [0, 1, 2],
  [0, 1, 3],
  [0, 1, 4],
  [0, 2, 2],
  [1, 1, 1],
  [1, 1, 2],
  [1, 1, 3],
  [1, 2, 1],
  [2, 1, 1],
  [2, 1, 2],
  [2, 2, 1],
];
/** Fraction Match cases from 0: first size, hops, then the second size (the card is `target / jump2`). */
const FRAC_MATCH_CASES: [number, number, number][] = [
  [2, 2, 1],
  [2, 3, 1],
  [1, 4, 2],
  [4, 2, 2],
  [2, 4, 4],
  [1, 2, 2],
  [4, 1, 1],
  [2, 1, 1],
];

function fracQuestions(plan: HopPlan, rng: Rng): HopQuestion[] {
  const match = plan.mode === 'frac-match';
  const cases = match ? FRAC_MATCH_CASES : FRAC_HOP_CASES;
  const make = ([a, b, c]: [number, number, number]): HopQuestion => {
    if (match) {
      const target = a * b;
      return { start: 0, target, hops: target, lo: 0, jump: a, count: b, jump2: c, answer2: target / c };
    }
    return { start: a, target: a + b * c, hops: b * c, lo: 0, jump: b, count: c };
  };
  // Both open on the easiest case: one half hop from zero, or two halves then quarters.
  const [first, ...rest] = cases;
  for (;;) {
    const qs = [first, ...rng.shuffle([...rest]).slice(0, plan.questions - 1)].map(make);
    const repeats = qs.some(
      (q, i) =>
        i > 0 && (q.target === qs[i - 1].target || answerOf(plan.mode, q) === answerOf(plan.mode, qs[i - 1])),
    );
    const fair = match
      ? qs.some((q) => q.target > 4)
      : qs.filter((q) => q.jump === 2).length >= 2 && qs.some((q) => q.start > 0);
    if (!repeats && fair) return qs;
  }
}

function windowFor(top: number, a: number, b: number, rng: Rng): number {
  const min = Math.max(0, Math.max(a, b) - (WINDOW - 1));
  const max = Math.min(Math.min(a, b), top - (WINDOW - 1));
  return rng.int(min, Math.max(min, max));
}

/** Rounds of Count up that cross ten (the frog starts below 10 and the flag is past it); the rest stay in the teens. */
export const COUNT_UP_CROSSINGS = 3;
export const crossesTen = (q: HopQuestion) => q.start < 10 && q.target > 10;

export function makeQuestions(plan: HopPlan, rng: Rng): HopQuestion[] {
  if (isFrac(plan.mode)) return fracQuestions(plan, rng);
  if (plan.mode === 'count-up') return countUpQuestions(plan, rng);
  if (plan.mode === 'your-way') return yourWayQuestions(plan, rng);
  if (plan.mode === 'tens') return tensQuestions(plan, rng);
  const out: HopQuestion[] = [];
  let frog = 0;
  for (let i = 0; i < plan.questions; i++) {
    let q: HopQuestion;
    for (;;) {
      const top = plan.top;
      if (plan.mode === 'find') {
        const target = rng.int(0, top);
        q = { start: frog, target, hops: target - frog, lo: 0 };
      } else if (plan.mode === 'next') {
        const ask = rng.chance(0.5) ? 'more' : 'less';
        const start = ask === 'more' ? rng.int(0, top - 1) : rng.int(1, top);
        q = { start, target: start + (ask === 'more' ? 1 : -1), hops: ask === 'more' ? 1 : -1, ask, lo: 0 };
      } else if (plan.mode === 'add' || plan.mode === 'back') {
        const k = rng.int(1, 4);
        const start = plan.mode === 'add' ? rng.int(0, top - k) : rng.int(k, top);
        const hops = plan.mode === 'add' ? k : -k;
        q = { start, target: start + hops, hops, lo: 0 };
      } else if (plan.mode === 'gap') {
        const k = rng.int(1, 5);
        const start = rng.int(0, top - k);
        q = { start, target: start + k, hops: k, lo: 0 };
      } else if (plan.mode === 'big') {
        const k = rng.int(2, 6) * (rng.chance(0.6) ? 1 : -1);
        const start = k > 0 ? rng.int(0, top - k) : rng.int(-k, top);
        q = { start, target: start + k, hops: k, lo: 0 };
      } else if (plan.mode === 'back-ten') {
        // Mirror of make-ten: from 11–16 back 4–8, so the trip crosses 10 and stays inside nine pads.
        const start = rng.int(11, 16);
        const toTen = start - 10;
        const take = rng.int(Math.max(4, toTen + 1), 8);
        const remaining = take - toTen;
        q = { start, target: 10 - remaining, hops: -take, lo: 0, toTen, remaining };
      } else {
        // Keep the whole trip within the nine pads: first bridge to 10, then take 1–4 more.
        const start = rng.int(6, 9);
        const toTen = 10 - start;
        const remaining = rng.int(1, 4);
        q = { start, target: 10 + remaining, hops: toTen + remaining, lo: 0, toTen, remaining };
      }
      q.lo = windowFor(plan.top, q.start, q.target, rng);
      const prev = out[i - 1];
      // Never the same answer twice running, and the frog must actually move.
      if (q.target === q.start || (prev && answerOf(plan.mode, prev) === answerOf(plan.mode, q))) continue;
      break;
    }
    out.push(q);
    frog = q.target;
  }
  return out;
}

/**
 * Count up to take away (dive slice 4): `big − small` with big 11–20 and a difference of 1–6, so a card answers it and
 * both pads fit in view. The frog stands on the smaller number and a flag marks the bigger; the answer is the hops
 * between. Three of the five cross ten (where counting up beats counting back); never the same difference twice running.
 */
function countUpQuestions(plan: HopPlan, rng: Rng): HopQuestion[] {
  const cross = new Set(rng.shuffle([0, 1, 2, 3, 4]).slice(0, COUNT_UP_CROSSINGS));
  const out: HopQuestion[] = [];
  for (let i = 0; i < plan.questions; i++) {
    for (;;) {
      const k = rng.int(1, 6);
      // A crossing needs at least 2 hops (9 to 11).
      if (cross.has(i) && k < 2) continue;
      // Crossing: the frog starts at 9 or below and the flag is past 10. Otherwise both sit at 10 or above.
      const target = cross.has(i) ? rng.int(11, Math.min(plan.top, 9 + k)) : rng.int(10 + k, plan.top);
      const start = target - k;
      const q: HopQuestion = { start, target, hops: k, lo: 0 };
      q.lo = windowFor(plan.top, start, target, rng);
      const prev = out[i - 1];
      if (prev && (prev.hops === k || prev.target === target)) continue;
      out.push(q);
      break;
    }
  }
  return out;
}

/** Over ten, your way: how many of the five go back (take away); the rest go on. */
export const YOUR_WAY_BACKS = 2;

/**
 * Over ten, your way (dive slice 5): every trip crosses 10, forward from 5–9 by 4–8 or back from 11–15 by 4–8, so 10 lies
 * strictly between the start and the landing and is always in view as a stop she may choose. Two of the five go back,
 * the first goes on; never the same landing or the same split twice running.
 */
function yourWayQuestions(plan: HopPlan, rng: Rng): HopQuestion[] {
  const backs = new Set(rng.shuffle([1, 2, 3, 4]).slice(0, YOUR_WAY_BACKS));
  const out: HopQuestion[] = [];
  for (let i = 0; i < plan.questions; i++) {
    for (;;) {
      const back = backs.has(i);
      const start = back ? rng.int(11, 15) : rng.int(5, 9);
      const toTen = Math.abs(start - TEN);
      const k = rng.int(Math.max(4, toTen + 1), 8);
      const remaining = k - toTen;
      const hops = back ? -k : k;
      const q: HopQuestion = { start, target: start + hops, hops, lo: 0, toTen, remaining };
      q.lo = windowFor(plan.top, start, q.target, rng);
      const prev = out[i - 1];
      if (prev && (prev.target === q.target || (prev.toTen === toTen && prev.remaining === remaining)))
        continue;
      out.push(q);
      break;
    }
  }
  return out;
}

/** Hop by tens: how many of the five go back; the first goes on. */
export const TENS_BACKS = 2;

/**
 * Hop by tens (dive slice 7), in pads of ten: start on 10–70 (pads 1–7), hop 1–4 tens on or back, landing on 0–100. Two of
 * the five go back, the first goes on; never the same landing twice running, and at least one question slides the line
 * to show 100, so the end of the line is always seen.
 */
function tensQuestions(plan: HopPlan, rng: Rng): HopQuestion[] {
  for (;;) {
    const backs = new Set(rng.shuffle([1, 2, 3, 4]).slice(0, TENS_BACKS));
    const out: HopQuestion[] = [];
    for (let i = 0; i < plan.questions; i++) {
      for (;;) {
        const back = backs.has(i);
        const k = rng.int(1, 4);
        const start = back ? rng.int(Math.max(1, k), 7) : rng.int(1, Math.min(7, plan.top - k));
        const hops = back ? -k : k;
        const q: HopQuestion = { start, target: start + hops, hops, lo: 0 };
        q.lo = windowFor(plan.top, start, q.target, rng);
        const prev = out[i - 1];
        if (prev && prev.target === q.target) continue;
        out.push(q);
        break;
      }
    }
    if (out.some((q) => q.lo + WINDOW - 1 >= plan.top)) return out;
  }
}

/** Distinguish a direction mistake from counting the starting pad as a hop. */
export type HopMiss = 'correct' | 'forward' | 'backward' | 'one-more' | 'one-less' | 'count';
export function missKind(start: number, answer: number, chosen: number, card: boolean): HopMiss {
  if (chosen === answer) return 'correct';
  if (!card && (chosen - start) * (answer - start) <= 0) return answer > start ? 'forward' : 'backward';
  const direction = card ? 1 : Math.sign(answer - start);
  if (chosen === answer + direction) return 'one-more';
  if (chosen === answer - direction) return 'one-less';
  return 'count';
}

/**
 * A wrong pad on a fraction question, most telling first: behind the start; hops of the wrong size (one-tick hops for a
 * half or whole, half hops for a quarter); whole hops; one tick off (counting pads, not gaps); otherwise a miscount.
 */
export type FracMiss = 'correct' | 'backward' | 'size' | 'whole' | 'one-more' | 'one-less' | 'count';
export function fracMiss(start: number, jump: number, count: number, chosen: number): FracMiss {
  const target = start + jump * count;
  if (chosen === target) return 'correct';
  if (chosen <= start) return 'backward';
  if (chosen === start + (jump === 1 ? 2 : 1) * count) return 'size';
  if (jump < 4 && chosen === start + 4 * count) return 'whole';
  if (chosen === target + 1) return 'one-more';
  if (chosen === target - 1) return 'one-less';
  return 'count';
}

/** A wrong card at Fraction Match's second stage: the first stage's hop count is the telling slip. */
export function matchMiss(q: HopQuestion, chosen: number): 'correct' | 'same' | HopMiss {
  if (chosen === q.answer2) return 'correct';
  if (chosen === q.count) return 'same';
  return missKind(0, q.answer2!, chosen, true);
}

/** Both stages can show help; only the first demonstration charges a hint. */
export function hintCharge(wrongs: number, glowing: boolean, helped: boolean): number {
  return wrongs >= 2 && !glowing && !helped ? 1 : 0;
}

/** Keep the original seeded sticker draw separate from round content. */
export const stickerNumber = (rng: Rng) => rng.int(1, 9);

/**
 * Say the numbers (dive fresh 1): on the plain add and take-away levels (3, 4, 6 and the tens line, 13) a counted hop says the pad it lands
 * on ("5… 6… 7") and a tally dot rises over the frog for each hop. The levels whose answer is a count of hops (5, 7, 8 and
 * the fraction levels) keep counting "1, 2, 3".
 */
export const saysNumbers = (mode: HopMode) =>
  mode === 'add' || mode === 'back' || mode === 'big' || mode === 'tens';

/** The numerals a counted hop says, in order: every pad after the start, ending on the target. */
export function landingNumbers(start: number, target: number): number[] {
  const dir = Math.sign(target - start);
  return Array.from({ length: Math.abs(target - start) }, (_, i) => start + dir * (i + 1));
}

/** Dots under the numerals (dive fresh 6): levels 1 and 2, for a child who matches dots before she reads "6". */
export const showsDots = (mode: HopMode) => mode === 'find' || mode === 'next';

/** Dot spacing and radius under a pad, in pad units. */
export const DOT_GAP = 17;
export const DOT_R = 6;

/**
 * Where a numeral's dots sit, relative to the dot row's centre: fives grouped in a top row of five, the rest in a row
 * below starting at the left, like a five frame. 0 has no dots.
 */
export function dotLayout(n: number): { x: number; y: number }[] {
  return Array.from({ length: n }, (_, i) => ({
    x: ((i % 5) - 2) * DOT_GAP,
    y: Math.floor(i / 5) * DOT_GAP,
  }));
}

/**
 * Landmark flowers (dive fresh 7) on the benchmarks 5, 10, 15 and 20, from level 3, so 8 is "three after the flower".
 * Never on 0, the dot levels or the fraction line, where a pad is a quarter tick.
 */
export const flowerOn = (mode: HopMode, n: number) =>
  !showsDots(mode) && !isFrac(mode) && n > 0 && n % 5 === 0;

/**
 * Scenes (dive slice 6): each round draws one place for the line. The lily pond, stepping stones in a brook, a flower path
 * (the frog hops from bloom to bloom) and an evening pond with a moon and fireflies. Only the art changes: the pads, their
 * numerals, hit areas and the layout are the same in every scene (`hopLayout` takes no scene), and the sticker stays the lily pad.
 */
export const SCENES = ['pond', 'brook', 'flowers', 'evening'] as const;
export type HopScene = (typeof SCENES)[number];

/** The round's scene, drawn after its questions so the questions a seed makes never change. */
export const sceneFor = (rng: Rng): HopScene => rng.pick(SCENES);

/** A pad's step along the line, and its tap box: the step wide, 140 tall round its centre. */
export const PAD_STEP = 104;
export const PAD_HIT = { w: PAD_STEP, h: 140 };
/** A number card's tap box. */
export const CARD_HIT = { w: 112, h: 116 };
/** The sign's widest board (it widens to its sum) and its height. */
export const SIGN = { w: 720, h: 92, y: 150 };

export interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface HopLayout {
  /** The centre of the pad at each place in view, left to right. */
  pads: { x: number; y: number }[];
  /** The sign at its widest. */
  sign: Box;
  /** The number cards' centres, on the levels that use them. */
  cards: { x: number; y: number }[];
}

/** Held upright (768 wide) the nine pads cannot sit in one row at 100 units: they take a row of five and a row of four. */
export const UPRIGHT_PAD_ROW = 5;
export const UPRIGHT_PAD_PITCH = 140;
/** Upright, the row of pads and the next one are this far apart, room for the fraction line's "one whole" bracket between. */
const UPRIGHT_ROW_GAP = 250;

/**
 * Where the line, the sign and the number cards sit in a view. The card row starts right of the guide's corner
 * (`corner`, the bottom-left square the pet stands in) and keeps its 124-unit step while it fits. Held upright the line
 * folds into two rows (pads 0–4, then 5–8, reading like text) and the cards into two rows of three beside the guide; the
 * cards, the rows and the sign hang up from the bottom edge, so a tall phone's spare height is sky at the top.
 */
export function hopLayout(
  view: { w: number; h: number; upright?: true },
  mode: HopMode,
  corner = 200,
): HopLayout {
  const usesCards = countsHops(mode) || splitsAtTen(mode) || mode === 'frac-match';
  const n = usesCards ? GAP_CARDS.length : 0;
  if (view.upright && view.h > view.w * 1.1) {
    const cardsTop = view.h - (usesCards ? 248 : corner);
    const rowB = cardsTop - 24 - PAD_HIT.h / 2;
    const rowA = rowB - UPRIGHT_ROW_GAP;
    const x0 = view.w / 2 - 2 * UPRIGHT_PAD_PITCH;
    const pads = Array.from({ length: WINDOW }, (_, i) => ({
      x: x0 + (i % UPRIGHT_PAD_ROW) * UPRIGHT_PAD_PITCH,
      y: i < UPRIGHT_PAD_ROW ? rowA : rowB,
    }));
    const sign = { x: view.w / 2 - SIGN.w / 2, y: rowA - PAD_HIT.h / 2 - 30 - SIGN.h, w: SIGN.w, h: SIGN.h };
    const mid = (corner + 16 + CARD_HIT.w / 2 + view.w - 24 - CARD_HIT.w / 2) / 2;
    const cards = Array.from({ length: n }, (_, i) => ({
      x: mid + ((i % 3) - 1) * 124,
      y: view.h - (i < 3 ? 190 : 66),
    }));
    return { pads, sign, cards };
  }
  const y = view.h * (countsHops(mode) ? 0.56 : 0.62);
  const x0 = (view.w - (WINDOW - 1) * PAD_STEP) / 2;
  const pads = Array.from({ length: WINDOW }, (_, i) => ({ x: x0 + i * PAD_STEP, y }));
  const sign = { x: view.w / 2 - SIGN.w / 2, y: SIGN.y - SIGN.h / 2, w: SIGN.w, h: SIGN.h };
  const left = corner + 16 + CARD_HIT.w / 2;
  const right = view.w - 24 - CARD_HIT.w / 2;
  const step = Math.min(124, (right - left) / Math.max(1, n - 1));
  const mid = (left + right) / 2;
  const cards = Array.from({ length: n }, (_, i) => ({ x: mid + (i - (n - 1) / 2) * step, y: view.h - 90 }));
  return { pads, sign, cards };
}
