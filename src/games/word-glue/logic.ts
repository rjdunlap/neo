import type { Rng } from '../../engine/random';
import type { View } from '../../engine/view';

/**
 * Word Glue: two pictures join into a third, and the pet says the parts and the whole. Level 1 joins the only pair,
 * level 2 finds the two parts of an asked word among three pictures, level 3 keeps the second part (a house, a box, a
 * brush) and asks which first part makes the thing a friend needs. Every entry is a transparent compound whose parts
 * can both be drawn; nothing is printed. See docs/definitions/word-glue.md.
 */

export interface Compound {
  word: string;
  first: string;
  second: string;
  /** Who or what it is for, said after the word on level 3 and in level 2's miss ("a house for a dog"). */
  meaning: string;
  levels: readonly number[];
}

export const COMPOUNDS: readonly Compound[] = [
  { word: 'sunflower', first: 'sun', second: 'flower', meaning: 'a flower that turns to the sun', levels: [1, 2] },
  { word: 'cupcake', first: 'cup', second: 'cake', meaning: 'a little cake in a cup', levels: [1, 2] },
  { word: 'doghouse', first: 'dog', second: 'house', meaning: 'a house for a dog', levels: [1, 2, 3] },
  { word: 'toothbrush', first: 'tooth', second: 'brush', meaning: 'a brush for teeth', levels: [1, 2, 3] },
  { word: 'raincoat', first: 'rain', second: 'coat', meaning: 'a coat for the rain', levels: [1, 2] },
  { word: 'beehive', first: 'bee', second: 'hive', meaning: 'a home for bees', levels: [1, 2] },
  { word: 'sailboat', first: 'sail', second: 'boat', meaning: 'a boat with a sail', levels: [1, 2] },
  { word: 'mailbox', first: 'mail', second: 'box', meaning: 'a box for mail', levels: [1, 2, 3] },
  { word: 'birdhouse', first: 'bird', second: 'house', meaning: 'a house for a bird', levels: [3] },
  { word: 'dollhouse', first: 'doll', second: 'house', meaning: 'a house for a doll', levels: [3] },
  { word: 'toybox', first: 'toy', second: 'box', meaning: 'a box for toys', levels: [3] },
  { word: 'sandbox', first: 'sand', second: 'box', meaning: 'a box for sand', levels: [3] },
  { word: 'hairbrush', first: 'hair', second: 'brush', meaning: 'a brush for hair', levels: [3] },
  { word: 'paintbrush', first: 'paint', second: 'brush', meaning: 'a brush for paint', levels: [3] },
];

/** Opaque compounds the study ruled out of every meaning rung: a test checks none is in the table. */
export const OPAQUE = ['butterfly', 'hotdog', 'pineapple', 'starfish', 'rainbow', 'buttercup'] as const;

/** Single pictures that can sit beside an asked pair on level 2. */
export const POOL = ['moon', 'star', 'key', 'tree', 'car', 'hat', 'duck', 'frog', 'bell', 'spoon', 'shell', 'chair', 'jar'] as const;

/**
 * Real or rude words that must never be makeable on screen, in either order, from a pair of pictures shown together.
 * The definition's list, plus the joins the session's check of the parts and pool found (dictionary compounds and
 * common two-word names a child hears as one thing).
 */
export const DENY: readonly string[] = [
  // From the definition.
  'sunfish', 'sunhat', 'sunshine', 'sunset', 'sunrise', 'sunlight', 'sunbeam', 'sundog', 'moonflower', 'moonbeam', 'moonlight',
  'starfish', 'flowerpot', 'flowerbed', 'cupboard', 'teacup', 'pancake', 'catfish', 'dogfish', 'hotdog', 'dogbowl', 'dogbed',
  'houseboat', 'boathouse', 'housefly', 'treehouse', 'cathouse', 'bughouse', 'toothpaste', 'toothpick', 'raindrop', 'rainbow',
  'overcoat', 'bumblebee', 'beeswax', 'sailfish', 'mailbag', 'boxcar', 'hatbox', 'keyhole', 'keyboard', 'shellfish', 'seashell',
  'bellhop', 'doorbell', 'cowbell', 'armchair', 'highchair', 'footprint', 'football',
  // Added by the session's check (2026-10-24): real compounds and common two-word names makeable from a part and a picture.
  'sunbird', 'sunsail', 'sunchair', 'sunhouse', 'sunboat', 'bellflower', 'starflower', 'flowerbox', 'hairflower', 'beeflower',
  'paintcup', 'cakebox', 'mooncake', 'sandcake', 'dollcake', 'dogstar', 'dogcoat', 'dogbox', 'dogtoy', 'doghair',
  'dogbrush', 'dogbell', 'housekey', 'duckhouse', 'beehouse', 'toyhouse', 'shellhouse', 'carbrush', 'cupbrush', 'dollbrush',
  'toybrush', 'rainhat', 'raintree', 'rainfrog', 'rainbird', 'rainshell', 'carcoat', 'coattree', 'duckcoat', 'dollcoat',
  'mailcoat', 'beetree', 'beebox', 'beehat', 'hivebox', 'toyboat', 'duckboat', 'boathat', 'mailboat', 'shellboat', 'mailcar',
  'mailhat', 'housecoat', 'housepaint', 'dogtooth', 'boxtree', 'keybox', 'paintbox', 'birdbox', 'sandbee', 'moonsail',
];

export interface Plan {
  level: number;
  name: string;
}

export const PLANS: readonly Plan[] = [
  { level: 1, name: 'Stick them: join the only pair to make a new thing' },
  { level: 2, name: 'What do they make? Find the two pictures that make the asked word' },
  { level: 3, name: 'Who is it for? Join the friend who needs the thing in the middle' },
];

export const planFor = (level: number): Plan => PLANS.find((p) => p.level === level) ?? PLANS[0];

/** The level-3 heads, each with exactly three level-3 compounds. */
export const HEADS = ['house', 'box', 'brush'] as const;
export type Head = (typeof HEADS)[number];

const byWord = (word: string): Compound => {
  const c = COMPOUNDS.find((x) => x.word === word);
  if (!c) throw new Error(`no compound ${word}`);
  return c;
};

export const forHead = (head: string): Compound[] => COMPOUNDS.filter((c) => c.second === head && c.levels.includes(3));

/** The entry two pictures make, in either drag order, or null. */
export function makes(a: string, b: string): Compound | null {
  return COMPOUNDS.find((c) => (c.first === a && c.second === b) || (c.first === b && c.second === a)) ?? null;
}

/** Whether a joined string is a listed or denied word, in either order. */
export function forms(a: string, b: string): boolean {
  const words = new Set([...COMPOUNDS.map((c) => c.word), ...DENY]);
  return words.has(a + b) || words.has(b + a);
}

/** Every picture the game draws: all the parts and the pool. */
export const PICTURES: readonly string[] = [...new Set([...COMPOUNDS.flatMap((c) => [c.first, c.second]), ...POOL])];

export interface Ask {
  /** The thing this ask makes. */
  entry: Compound;
  /** The pictures on the table. At level 3 the head is first, then the three first parts, which stay put for the head's asks. */
  pictures: string[];
}

export interface Round {
  plan: Plan;
  asks: Ask[];
}

/** Level 2's valid distractors for an entry: no part-plus-distractor join is a listed or denied word. */
export function distractorsFor(entry: Compound): string[] {
  const parts = new Set(COMPOUNDS.flatMap((c) => [c.first, c.second]));
  const candidates = [...new Set([...POOL, ...parts])];
  return candidates.filter((d) => d !== entry.first && d !== entry.second && !forms(entry.first, d) && !forms(entry.second, d));
}

const AUTHORED_2: [string, string][] = [['doghouse', 'moon'], ['raincoat', 'key'], ['cupcake', 'star'], ['mailbox', 'duck'], ['sunflower', 'jar']];
const AUTHORED_1 = ['sunflower', 'doghouse', 'cupcake', 'beehive', 'sailboat'];

/** A round at `level`. `authored` gives the definition's first round (the how-to card and demonstration open on it). */
export function makeRound(level: number, rng: Rng, authored = false): Round {
  const plan = planFor(level);
  if (plan.level === 1) {
    const words = authored ? AUTHORED_1 : ['sunflower', ...rng.shuffle(COMPOUNDS.filter((c) => c.levels.includes(1) && c.word !== 'sunflower')).slice(0, 4).map((c) => c.word)];
    return { plan, asks: words.map((w) => byWord(w)).map((entry) => ({ entry, pictures: [entry.first, entry.second] })) };
  }
  if (plan.level === 2) {
    const picks: [Compound, string][] = authored
      ? AUTHORED_2.map(([w, d]) => [byWord(w), d])
      : rng.shuffle(COMPOUNDS.filter((c) => c.levels.includes(2))).slice(0, 5).map((entry) => [entry, rng.pick(distractorsFor(entry))]);
    return {
      plan,
      asks: picks.map(([entry, d], i) => ({ entry, pictures: authored && i === 0 ? ['dog', 'house', 'moon'] : rng.shuffle([entry.first, entry.second, d]) })),
    };
  }
  const heads: Head[] = authored ? ['house', 'brush'] : rng.shuffle([...HEADS]).slice(0, 2);
  const asks: Ask[] = [];
  for (const head of heads) {
    const entries = forHead(head);
    const firsts = authored ? entries.map((e) => e.first) : rng.shuffle(entries.map((e) => e.first));
    const asked = authored
      ? (head === 'house' ? ['birdhouse', 'dollhouse'] : ['toothbrush', 'paintbrush']).map(byWord)
      : rng.shuffle(entries).slice(0, 2);
    for (const entry of asked) asks.push({ entry, pictures: [head, ...firsts] });
  }
  return { plan, asks };
}

/* The play state ------------------------------------------------------------------------------- */

export interface GlueState {
  round: Round;
  /** The ask in play; `asks.length` once the round is done. */
  index: number;
  misses: number;
  hints: number;
  /** Distinct wrong pairs dropped on this ask (sorted "a+b"). */
  wrong: Set<string>;
  /** Every wrong drop on this ask, repeats included. */
  wrongDrops: number;
  /** The right pictures (level 2) or the asking friend (level 3) glow; a hint has been counted for this ask. */
  glow: boolean;
  done: boolean;
}

export const newState = (round: Round): GlueState => ({ round, index: 0, misses: 0, hints: 0, wrong: new Set(), wrongDrops: 0, glow: false, done: false });

export const currentAsk = (s: GlueState): Ask | null => (s.done ? null : s.round.asks[s.index]);

const pairKey = (a: string, b: string) => [a, b].sort().join('+');

/** The pair that makes the ask: the two parts at levels 1–2, the asked first part and the head at level 3. */
export function hintFor(s: GlueState): [string, string] | null {
  const ask = currentAsk(s);
  return ask ? [ask.entry.first, ask.entry.second] : null;
}

/** Which pictures can be dragged now: every one at levels 1–2, only the first parts at level 3. */
export function canDrag(s: GlueState, picture: string): boolean {
  const ask = currentAsk(s);
  if (!ask || !ask.pictures.includes(picture)) return false;
  return s.round.plan.level !== 3 || picture !== ask.pictures[0];
}

export type Outcome =
  | { kind: 'ignore' }
  | { kind: 'right'; entry: Compound }
  /** A supported join: a wrong drop after the glow and two earlier wrong drops makes the right thing with no further count. */
  | { kind: 'assist'; entry: Compound }
  | { kind: 'wrong'; made: Compound | null; counted: boolean; glowed: boolean };

/** What dropping picture `a` onto picture `b` would be, without changing anything. */
export function check(s: GlueState, a: string, b: string): Outcome['kind'] {
  const ask = currentAsk(s);
  if (!ask || a === b || !ask.pictures.includes(a) || !ask.pictures.includes(b)) return 'ignore';
  if (s.round.plan.level === 3 && (a === ask.pictures[0] || b !== ask.pictures[0])) return 'ignore';
  return makes(a, b) === ask.entry ? 'right' : 'wrong';
}

/** Drop picture `a` onto picture `b`: count it and move on to the next ask after a join. */
export function drop(s: GlueState, a: string, b: string): Outcome {
  const kind = check(s, a, b);
  const ask = currentAsk(s);
  if (kind === 'ignore' || !ask) return { kind: 'ignore' };
  if (kind === 'right') {
    advance(s);
    return { kind: 'right', entry: ask.entry };
  }
  // Level 1 has one pair on the table, so it cannot get here.
  if (s.glow && s.wrongDrops >= 2) {
    advance(s);
    return { kind: 'assist', entry: ask.entry };
  }
  s.wrongDrops++;
  const key = pairKey(a, b);
  const counted = !s.wrong.has(key);
  let glowed = false;
  if (counted) {
    s.wrong.add(key);
    s.misses++;
    if (s.wrong.size >= 2 && !s.glow) {
      s.glow = true;
      s.hints++;
      glowed = true;
    }
  }
  return { kind: 'wrong', made: makes(a, b), counted, glowed };
}

/** Show a hint: the right pictures glow, counted once per ask. Level 1 has nothing to get wrong and counts nothing. */
export function applyHint(s: GlueState): [string, string] | null {
  const pair = hintFor(s);
  if (!pair) return null;
  if (s.round.plan.level !== 1 && !s.glow) {
    s.glow = true;
    s.hints++;
  }
  return pair;
}

function advance(s: GlueState) {
  s.index++;
  s.wrong = new Set();
  s.wrongDrops = 0;
  s.glow = false;
  if (s.index >= s.round.asks.length) s.done = true;
}

/** Start again: the same round from its first ask, keeping misses and hints. */
export function restartState(s: GlueState) {
  if (s.done) return;
  s.index = 0;
  s.wrong = new Set();
  s.wrongDrops = 0;
  s.glow = false;
}

/* The table ------------------------------------------------------------------------------------ */

export interface Pt {
  x: number;
  y: number;
}

/** A picture card's side, and the made thing's size when it appears. */
export const CARD = 150;
export const MADE = 210;
/** The shelf's things along the top. */
export const SHELF = 84;
/** How far from a picture's centre a drop still lands on it. */
export const DROP_R = 140;

/**
 * Where the pictures sit for two (level 1), three (level 2) or four (level 3: the head in the middle, its three
 * first parts left, right and below) pictures, clear of the home button and the guide's corner.
 */
export function tableLayout(v: View, n: number): Pt[] {
  const cx = v.w / 2;
  if (n <= 2) {
    const y = v.h * 0.55;
    return [{ x: cx - 170, y }, { x: cx + 170, y }].slice(0, n);
  }
  if (n === 3) {
    const y = v.h * 0.55;
    return [{ x: cx - 260, y }, { x: cx, y }, { x: cx + 260, y }];
  }
  const y = v.h * 0.48;
  return [{ x: cx, y }, { x: cx - 300, y }, { x: cx + 300, y }, { x: cx, y: y + 215 }];
}

/** The centre of the table, where a made thing appears. */
export const tableCentre = (v: View, n: number): Pt => (n === 4 ? tableLayout(v, 4)[0] : { x: v.w / 2, y: v.h * 0.55 });

/** The shelf's slots along the top, one per ask. */
export function shelfLayout(v: View, n: number): Pt[] {
  const gap = SHELF + 16;
  return Array.from({ length: n }, (_, i) => ({ x: v.w / 2 + (i - (n - 1) / 2) * gap, y: 78 }));
}

/** The picture a drop at (x, y) lands on: the nearest within reach other than its own, among `targets`, or null. */
export function dropTarget(points: readonly Pt[], own: number, x: number, y: number, targets?: readonly number[]): number | null {
  let best: number | null = null;
  let bestD = DROP_R;
  points.forEach((p, i) => {
    if (i === own || (targets && !targets.includes(i))) return;
    const d = Math.hypot(p.x - x, p.y - y);
    if (d < bestD) {
      bestD = d;
      best = i;
    }
  });
  return best;
}
