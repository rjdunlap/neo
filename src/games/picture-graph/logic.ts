import type { CritterName } from '../../art/critter';
import type { Rng } from '../../engine/random';
import type { Band } from '../../progress/bands';
import type { BandLevels } from '../../progress/difficulty';

/**
 * Picture Graph: count the critters playing in a meadow and build a bar graph, one block per
 * critter, then answer questions by reading it: which has the most, how many more, how many in all.
 * The graph is made by the child, so the questions are about something she built. The last two
 * levels use a key: one block stands for two critters (or, at level 9, five tally marks), so the bars no longer match
 * a count of one, and the number of blocks is the tempting wrong answer.
 */
export type GraphMode =
  'build' | 'most' | 'more' | 'read' | 'scale' | 'scaleread' | 'tally' | 'line' | 'fives' | 'pair' | 'claim';

export interface GraphPlan {
  mode: GraphMode;
  kinds: number;
  /** Most blocks in one bar (which is the most critters of one kind when a block is one critter). */
  max: number;
  graphs: number;
  /** How many critters one block stands for: 1, 2 (the pairs levels' lines say "two") or 5 (the tally-card level's say "five"). */
  per: number;
  name: string;
  /** Lowest count; the tally level uses this to make the group of five visible. */
  min?: number;
}

export const PLANS: GraphPlan[] = [
  {
    mode: 'build',
    kinds: 2,
    max: 4,
    graphs: 2,
    per: 1,
    name: 'Count two kinds of critters and build their bars, one block each',
  },
  {
    mode: 'most',
    kinds: 3,
    max: 5,
    graphs: 2,
    per: 1,
    name: 'Build three bars, then: which has the most? the fewest?',
  },
  {
    mode: 'more',
    kinds: 3,
    max: 6,
    graphs: 2,
    per: 1,
    name: 'Build the graph, then: how many more ducks than pigs?',
  },
  {
    mode: 'read',
    kinds: 4,
    max: 6,
    graphs: 2,
    per: 1,
    name: 'A graph is already built: how many in all? which two are the same?',
  },
  {
    mode: 'scale',
    kinds: 3,
    max: 4,
    graphs: 2,
    per: 2,
    name: 'Each block is two critters: build the bars from the pairs, then how many more?',
  },
  {
    mode: 'scaleread',
    kinds: 3,
    max: 5,
    graphs: 2,
    per: 2,
    name: 'A graph where each block is two critters: how many in all? how many more?',
  },
  {
    mode: 'tally',
    kinds: 3,
    min: 4,
    max: 7,
    graphs: 1,
    per: 1,
    name: 'Record each kind in tally marks, grouping every five, then build and compare one graph',
  },
  // An easy entry with a high ID: real things from the shore lined up in rows, the step before blocks. Pre-K plays two kinds
  // and asks which row has the most; school plays three and then asks how many more (`lineKinds`, `lineQuestions`).
  {
    mode: 'line',
    kinds: 3,
    min: 2,
    max: 6,
    graphs: 2,
    per: 1,
    name: 'Line up shells, stones, sticks and feathers in rows by kind: which row has the most?',
  },
  // Tally cards stand where the meadow was: 10 to 35 of each kind in groups of five, and each block is five.
  {
    mode: 'fives',
    kinds: 3,
    min: 2,
    max: 7,
    graphs: 2,
    per: 5,
    name: 'A key of five: build the bars from tally cards, one block for each group of five, then how many more?',
  },
  // A tally card and three finished graphs: a plain one, one keyed by twos, and a plain trap as tall as the keyed one.
  {
    mode: 'pair',
    kinds: 3,
    max: 4,
    graphs: 2,
    per: 2,
    name: 'Two pictures, one meadow: which two graphs show the tally card? One has a key of two; one only looks the same',
  },
  // A finished graph and three things a friend says about the meadow, one at a time: stamp each yes, no, or the graph can't say.
  {
    mode: 'claim',
    kinds: 3,
    max: 6,
    graphs: 2,
    per: 1,
    name: 'What the graph can say: stamp what a friend says yes, no, or "the graph can\'t say" (it shows how many, not who came first)',
  },
];

export const LEVELS: BandLevels = {
  prek: { min: 1, max: 8, order: [8, 1, 2] },
  school: { min: 1, max: 11, order: [1, 2, 8, 3, 4, 5, 6, 7, 9, 10, 11] },
};

/** The levels with a scene of their own (`LineUp`, `TwoPictures`) rather than a graph she builds or reads. */
export const ownScene = (plan: GraphPlan) => plan.mode === 'line' || plan.mode === 'pair';

/** The levels whose graph is already built when the round opens, so there is nothing to build. */
export const prebuilt = (plan: GraphPlan) =>
  plan.mode === 'read' || plan.mode === 'scaleread' || plan.mode === 'claim';

/** The blocks each bar holds when it matches the critters. */
export const barsFor = (plan: GraphPlan, g: Graph): number[] => g.counts.map((n) => n / plan.per);

export const planFor = (level: number) => PLANS[Math.min(PLANS.length, Math.max(1, level)) - 1];

export const KINDS: CritterName[] = ['duck', 'pig', 'bunny', 'cat', 'cow', 'dog', 'bear'];

/** The meadow backdrop's seeds: one is picked for each round, so the hills and clouds change while the rule does not. */
export const MEADOWS = [81, 23, 142];

export interface Graph {
  kinds: CritterName[];
  counts: number[];
}

export type Question =
  | { ask: 'most' | 'fewest'; answer: number }
  | { ask: 'more'; a: number; b: number; answer: number }
  | { ask: 'total'; answer: number }
  | { ask: 'same'; answer: [number, number] }
  | { ask: 'claim'; claim: Claim };

/** Critters of each kind: from 1 block to max blocks, a whole number of blocks each. Levels that ask "most" or "fewest" never have ties at the top or bottom. */
export function makeGraph(plan: GraphPlan, rng: Rng): Graph {
  for (;;) {
    const kinds = rng.shuffle([...KINDS]).slice(0, plan.kinds);
    const counts = kinds.map(() => rng.int(plan.min ?? 1, plan.max) * plan.per);
    const top = Math.max(...counts);
    const low = Math.min(...counts);
    if (
      plan.mode === 'most' &&
      (counts.filter((c) => c === top).length > 1 || counts.filter((c) => c === low).length > 1)
    )
      continue;
    if (
      (plan.mode === 'more' ||
        plan.mode === 'scale' ||
        plan.mode === 'scaleread' ||
        plan.mode === 'tally' ||
        plan.mode === 'fives' ||
        plan.mode === 'pair' ||
        plan.mode === 'claim') &&
      new Set(counts).size < counts.length
    )
      continue;
    // Reading levels: exactly one pair of equal bars, for "which two are the same?".
    if (plan.mode === 'read') {
      const pairs = counts
        .flatMap((c, i) => counts.slice(i + 1).map((d, j) => (c === d ? [i, i + 1 + j] : null)))
        .filter(Boolean);
      if (pairs.length !== 1) continue;
    }
    return { kinds, counts };
  }
}

export function questionsFor(plan: GraphPlan, g: Graph, rng: Rng): Question[] {
  const c = g.counts;
  const more = (): Question => {
    const [a, b] = rng
      .shuffle(c.map((_, i) => i))
      .slice(0, 2)
      .sort((x, y) => c[y] - c[x]);
    return { ask: 'more', a, b, answer: c[a] - c[b] };
  };
  if (plan.mode === 'build') return [];
  if (plan.mode === 'claim') return claimsFor(g, rng).map((claim) => ({ ask: 'claim', claim }));
  if (plan.mode === 'most')
    return [
      { ask: 'most', answer: c.indexOf(Math.max(...c)) },
      { ask: 'fewest', answer: c.indexOf(Math.min(...c)) },
    ];
  if (plan.mode === 'more' || plan.mode === 'tally') return [more()];
  if (plan.mode === 'scale' || plan.mode === 'fives') return [more()];
  if (plan.mode === 'scaleread') return [{ ask: 'total', answer: c.reduce((s, x) => s + x, 0) }, more()];
  const pair = c
    .flatMap((x, i) => c.slice(i + 1).map((y, j) => (x === y ? [i, i + 1 + j] : null)))
    .find(Boolean) as [number, number];
  return [
    { ask: 'total', answer: c.reduce((s, x) => s + x, 0) },
    { ask: 'same', answer: pair },
  ];
}

/**
 * Number choices for a numeric answer: the answer and two neighbors. When a block stands for `per` critters the
 * answer counts critters, so the neighbors are whole numbers of blocks away, and the number of blocks (the
 * answer read straight off the bars, forgetting the key) is always among them. Without a key, "how many more"
 * passes the taller bar's count (`taller`): reading the taller bar instead of the difference is the classic slip,
 * so it is always offered, beside the answer and one neighbor.
 */
export function choicesFor(answer: number, rng: Rng, per = 1, taller?: number): number[] {
  if (per > 1) {
    const blocks = answer / per;
    const near = [answer - per, answer + per, answer + 2 * per].filter((n) => n >= per && n !== blocks);
    return rng.shuffle([answer, blocks, ...rng.shuffle(near)].slice(0, 3));
  }
  const near = [answer - 2, answer - 1, answer + 1, answer + 2].filter((n) => n >= 0 && n !== taller);
  if (taller !== undefined && taller !== answer) return rng.shuffle([answer, taller, rng.pick(near)]);
  return rng.shuffle([answer, ...rng.shuffle(near).slice(0, 2)]);
}

/** The taller bar's count in a "how many more" question without a key, offered as the tempting wrong answer. */
export const tallerCount = (plan: GraphPlan, g: Graph, q: Question) =>
  q.ask === 'more' && plan.per === 1 ? g.counts[q.a] : undefined;

/**
 * A tap on a bar while answering "which two are the same?". The first tap lifts that bar; a tap on the lifted bar
 * lowers it again, free; a tap on another bar makes the pair, right or wrong, and lowers the lifted one.
 */
export function sameTap(
  first: number | null,
  tapped: number,
  answer: [number, number],
): { first: number | null; result: 'lift' | 'lower' | 'right' | 'wrong' } {
  if (first === null) return { first: tapped, result: 'lift' };
  if (first === tapped) return { first: null, result: 'lower' };
  const pair = [first, tapped].sort((a, b) => a - b);
  const want = [...answer].sort((a, b) => a - b);
  return { first: null, result: pair[0] === want[0] && pair[1] === want[1] ? 'right' : 'wrong' };
}

/** The bars a "same" hint glows: the answer bar not yet lifted, or both when the lifted one is wrong or none is. */
export const sameHint = (first: number | null, answer: [number, number]) =>
  first !== null && answer.includes(first) ? answer.filter((i) => i !== first) : [...answer];

/**
 * What a hint shows after two misses on a number question, so she sees why: for "how many more", a line from the
 * shorter bar's top across the taller bar (`line`, in blocks) and the taller bar's blocks above it (`blocks`, as
 * column and block index); for "how many in all", every block.
 */
export function whyBlocks(
  q: Question,
  bars: number[],
): { line?: { from: number; to: number; at: number }; blocks: { kind: number; k: number }[] } {
  if (q.ask === 'more') {
    const blocks = Array.from({ length: bars[q.a] - bars[q.b] }, (_, j) => ({ kind: q.a, k: bars[q.b] + j }));
    return { line: { from: q.b, to: q.a, at: bars[q.b] }, blocks };
  }
  if (q.ask === 'total')
    return { blocks: bars.flatMap((n, kind) => Array.from({ length: n }, (_, k) => ({ kind, k }))) };
  return { blocks: [] };
}

/** A critter in the meadow is about this big (at the scale the game draws it), standing on its feet. */
export const CRITTER_W = 58;
export const CRITTER_H = 72;
/** Critters of one block's worth stand this far apart, side by side. */
export const GROUP_GAP = 56;

/** The meadow's room for critters' feet: clear of the key on the left, the number pads on the right and the graph's top (which is 422 above the bottom). */
export const meadowArea = (w: number, h: number) => ({
  left: 216,
  right: w - 236,
  top: 165,
  bottom: Math.min(h * 0.5, 370, h - 430),
});

/**
 * Where each critter stands when a block is one critter: one critter to a slot of the same grid pairs use, so no two
 * touch, none stands on the graph and the count is always what she sees. In the order of the graph's kinds.
 */
export function meadowSpots(
  g: Graph,
  w: number,
  h: number,
  rng: Rng,
): { kind: number; x: number; y: number }[] {
  const kinds = g.counts.flatMap((n, kind) => Array.from({ length: n }, () => kind));
  const spots = groupSpots(kinds.length, 1, meadowArea(w, h), rng);
  return kinds.map((kind, i) => ({ kind, ...spots[i] }));
}

export interface Spot {
  x: number;
  y: number;
}

/** The middle of a block's worth of critters, and the room it takes. */
export const groupSize = (per: number) => ({ w: (per - 1) * GROUP_GAP + CRITTER_W + 8, h: CRITTER_H + 12 });

/**
 * Where each block's worth of critters (a pair, when a block is two) stands: a shuffled grid of slots with a little
 * jitter, so it looks scattered but no two groups can touch and none leaves the area. Random placement ran out of
 * room for nine pairs in a meadow this small.
 */
export function groupSpots(
  n: number,
  per: number,
  area: ReturnType<typeof meadowArea>,
  rng: Rng,
  size = groupSize(per),
): Spot[] {
  const cols = Math.max(1, Math.floor((area.right - area.left) / size.w) + 1);
  const rows = Math.max(1, Math.floor((area.bottom - area.top) / size.h) + 1);
  const stepX = cols > 1 ? (area.right - area.left) / (cols - 1) : 0;
  const stepY = rows > 1 ? (area.bottom - area.top) / (rows - 1) : 0;
  const slots = rng.shuffle(Array.from({ length: cols * rows }, (_, i) => i)).slice(0, n);
  // A group moves at most half its spare room from its slot, and never out of the area (clamping only brings it back toward its slot).
  const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
  return slots.map((i) => ({
    x: clamp(
      area.left +
        (i % cols) * stepX +
        (stepX > size.w ? rng.range(-(stepX - size.w) / 2, (stepX - size.w) / 2) : 0),
      area.left,
      area.right,
    ),
    y: clamp(
      area.top +
        Math.floor(i / cols) * stepY +
        (stepY > size.h ? rng.range(-(stepY - size.h) / 2, (stepY - size.h) / 2) : 0),
      area.top,
      area.bottom,
    ),
  }));
}

/* Level 9, A key of five: a tally card per kind where the meadow was, its marks in groups of five, one group to a block. */

/** A group of five tally marks on a card takes this much room across. */
export const CARD_GROUP_W = 52;
/** Room at a card's start for the critter's face. */
export const CARD_FACE_W = 80;

/**
 * The tally cards: one row per kind, stacked where the meadow was, clear of the key on the left, the number pads on the
 * right and the graph panel below (its top is 412 above the bottom). `groupX(k)` and `rowY(r)` are centres.
 */
export function cardLayout(w: number, h: number, rows: number, groups: number) {
  const width = CARD_FACE_W + groups * CARD_GROUP_W + 16;
  const left = Math.max(170, w / 2 - 60 - width / 2);
  // Centred in the room between the corner buttons (150) and the graph panel, so a tall view has no gap above the graph.
  const room = h - 430 - 150;
  const rowH = Math.min(70, room / rows);
  const top = 150 + (room - rows * rowH) / 2;
  return {
    left,
    right: left + width,
    top,
    bottom: top + rows * rowH,
    rowH,
    faceX: left + CARD_FACE_W / 2,
    groupX: (k: number) => left + CARD_FACE_W + CARD_GROUP_W / 2 + k * CARD_GROUP_W,
    rowY: (r: number) => top + rowH / 2 + r * rowH,
  };
}

/** One touch a capable child makes: a block added to a bar, the check, a column answering "which?", or a number pad. */
export type GraphMove =
  | { do: 'add'; kind: number }
  | { do: 'check' }
  | { do: 'column'; kind: number }
  | { do: 'number'; n: number }
  | { do: 'stamp'; stamp: Stamp };

/**
 * What a capable child touches next, from what is on the screen. While she is building, she adds a block to a bar
 * that is short of its critters (never past it) and checks when every bar matches; once there is a question, she
 * answers it: the column for "most", "fewest" and (one tap, then the other) "same", the number pad for "how many
 * more" and "how many in all", the claim's stamp. Null when there is nothing to do yet, such as a reading level before its question arrives.
 */
export function graphMove(
  plan: GraphPlan,
  graph: Graph,
  bars: number[],
  question: Question | undefined,
  firstSame: number | null,
): GraphMove | null {
  if (question) {
    if (question.ask === 'same')
      return { do: 'column', kind: firstSame === null ? question.answer[0] : question.answer[1] };
    if (question.ask === 'most' || question.ask === 'fewest') return { do: 'column', kind: question.answer };
    if (question.ask === 'claim') return { do: 'stamp', stamp: question.claim.answer };
    return { do: 'number', n: question.answer };
  }
  if (prebuilt(plan)) return null;
  const short = bars.findIndex((n, i) => n < graph.counts[i] / plan.per);
  return short >= 0 ? { do: 'add', kind: short } : { do: 'check' };
}

/** What the ghost finger adds to the tally chart, then checks when each kind is recorded. */
export function tallyMove(graph: Graph, tallies: number[]): GraphMove {
  const short = tallies.findIndex((n, i) => n < graph.counts[i]);
  return short >= 0 ? { do: 'add', kind: short } : { do: 'check' };
}

/* Level 8, Line them up: things from the shore, each tapped into its kind's row of a tray, then the rows compared. */

export type ShoreThing = 'shell' | 'stone' | 'stick' | 'feather';
/** Real things from the shore; never litter. */
export const THINGS: ShoreThing[] = ['shell', 'stone', 'stick', 'feather'];
export const THING_NAMES: Record<ShoreThing, string> = {
  shell: 'shells',
  stone: 'stones',
  stick: 'sticks',
  feather: 'feathers',
};

export interface Shore {
  kinds: ShoreThing[];
  counts: number[];
}

/** Pre-K lines up two kinds, school three. */
export const lineKinds = (band: Band) => (band === 'school' ? 3 : 2);

/** Each kind's count, from the plan's min to max, all different, so "which row has the most?" and "how many more?" have one answer above nothing. */
export function makeShore(plan: GraphPlan, kinds: number, rng: Rng): Shore {
  for (;;) {
    const things = rng.shuffle([...THINGS]).slice(0, kinds);
    const counts = things.map(() => rng.int(plan.min ?? 1, plan.max));
    if (new Set(counts).size === counts.length) return { kinds: things, counts };
  }
}

/** Which row has the most; with three rows, then how many more of one kind than another. */
export function lineQuestions(shore: Shore, rng: Rng): Question[] {
  const c = shore.counts;
  const qs: Question[] = [{ ask: 'most', answer: c.indexOf(Math.max(...c)) }];
  if (c.length > 2) {
    const [a, b] = rng
      .shuffle(c.map((_, i) => i))
      .slice(0, 2)
      .sort((x, y) => c[y] - c[x]);
    qs.push({ ask: 'more', a, b, answer: c[a] - c[b] });
  }
  return qs;
}

/**
 * What the hint after two misses shows: lines joining the rows one to one, slot by slot (`links`: a slot and the rows that
 * have a thing there), and the things nothing matches (`glow`). For "most", every row is joined and the longest row's things
 * past the next longest glow; for "how many more", the two rows asked about, and the glowing things are the answer.
 */
export function lineHint(
  q: Question,
  counts: number[],
): { links: { k: number; rows: number[] }[]; glow: { row: number; k: number }[] } {
  const rows = q.ask === 'more' ? [q.a, q.b] : counts.map((_, i) => i);
  const top = q.ask === 'more' ? q.a : q.ask === 'most' ? q.answer : -1;
  if (top < 0) return { links: [], glow: [] };
  const next = Math.max(...rows.filter((r) => r !== top).map((r) => counts[r]));
  const links: { k: number; rows: number[] }[] = [];
  for (let k = 0; k < next; k++) links.push({ k, rows: rows.filter((r) => counts[r] > k) });
  const glow = Array.from({ length: counts[top] - next }, (_, j) => ({ row: top, k: next + j }));
  return { links, glow };
}

/** One touch a capable child makes at level 8: a thing on the sand, a row, or a number pad. */
export type LineMove =
  { do: 'thing'; index: number } | { do: 'row'; row: number } | { do: 'number'; n: number };

/** The ghost finger: each thing on the sand in turn, then the row with the most and the number for "how many more". */
export function lineMove(placed: readonly boolean[], question: Question | undefined): LineMove | null {
  const index = placed.indexOf(false);
  if (index >= 0) return { do: 'thing', index };
  if (!question) return null;
  if (question.ask === 'most') return { do: 'row', row: question.answer };
  if (question.ask === 'more') return { do: 'number', n: question.answer };
  return null;
}

/** A shore thing's tap square, and a tray slot's width. */
export const THING_SIZE = 100;
/** A tray row's height. */
export const ROW_H = 104;
/** Room in the tray for the row's picture before its slots. */
export const ROW_LABEL = 110;

/**
 * The tray at the bottom: one row per kind, its picture first, then a slot per thing, so the rows line up one to one.
 * Clear of the pet on the left; `slotX(k)` and `rowY(r)` are centres.
 */
export function trayLayout(w: number, h: number, rows: number, max: number) {
  const width = ROW_LABEL + max * THING_SIZE + 20;
  const left = Math.max(160, w / 2 - width / 2);
  const bottom = h - 24;
  const top = bottom - rows * ROW_H - 16;
  return {
    left,
    right: left + width,
    top,
    bottom,
    labelX: left + ROW_LABEL / 2 + 4,
    slotX: (k: number) => left + ROW_LABEL + 10 + THING_SIZE / 2 + k * THING_SIZE,
    rowY: (r: number) => top + 8 + ROW_H / 2 + r * ROW_H,
  };
}

/** The sand's room for things' centres: below the corner buttons, above the tray, each thing's tap square clear of the tray. */
export const shoreArea = (w: number, h: number, rows: number, max: number) => ({
  left: 150,
  right: w - 150,
  top: 168,
  bottom: trayLayout(w, h, rows, max).top - THING_SIZE / 2 - 10,
});

/** Where each thing lies on the sand: one to a grid slot a tap square wide, so no two squares overlap. In the order of the shore's kinds. */
export function shoreSpots(
  shore: Shore,
  plan: GraphPlan,
  w: number,
  h: number,
  rng: Rng,
): { kind: number; x: number; y: number }[] {
  const kinds = shore.counts.flatMap((n, kind) => Array.from({ length: n }, () => kind));
  const spots = groupSpots(kinds.length, 1, shoreArea(w, h, shore.kinds.length, plan.max), rng, {
    w: THING_SIZE,
    h: THING_SIZE,
  });
  return rng.shuffle(kinds.map((kind, i) => ({ kind, ...spots[i] })));
}

/* Level 10, Two pictures, one meadow: a tally card and three small finished graphs; she taps the two that show the card. */

export interface SmallGraph {
  /** Blocks in each bar, in the card's order of kinds. */
  bars: number[];
  /** How many critters a block stands for: 2 on the keyed graph, 1 on the others. */
  per: number;
}

export interface PairRound {
  /** The tally card: kinds and counts, every count a whole number of pairs. */
  card: Graph;
  /** The three graphs, left to right. */
  graphs: SmallGraph[];
  /** The two graphs that show the card (the plain one and the keyed one), left first. */
  answer: [number, number];
  keyed: number;
  /** The plain graph whose bars are as tall as the keyed one's: it shows half the critters. */
  trap: number;
}

/** The critters a small graph shows: each bar's blocks times its key. */
export const critters = (s: SmallGraph) => s.bars.map((b) => b * s.per);

/**
 * One round: a card of 2 to 8 critters of each kind (all different, in whole pairs), its plain graph, its graph keyed by
 * twos, and the trap, a plain graph with the keyed graph's heights, from another meadow. All three use the card's kinds in
 * the card's order, so only the key tells them apart. Shuffled left to right.
 */
export function makePairRound(plan: GraphPlan, rng: Rng): PairRound {
  const card = makeGraph(plan, rng);
  const plain: SmallGraph = { bars: [...card.counts], per: 1 };
  const keyed: SmallGraph = { bars: card.counts.map((n) => n / 2), per: 2 };
  const trap: SmallGraph = { bars: card.counts.map((n) => n / 2), per: 1 };
  const graphs = rng.shuffle([plain, keyed, trap]);
  const answer = [graphs.indexOf(plain), graphs.indexOf(keyed)].sort((a, b) => a - b) as [number, number];
  return { card, graphs, answer, keyed: graphs.indexOf(keyed), trap: graphs.indexOf(trap) };
}

/** Which gentle line a wrong pair gets: the keyed graph with the trap (the same heights, a different key) has its own. */
export const pairWhy = (round: PairRound, a: number, b: number): 'key' | 'look' =>
  [a, b].includes(round.keyed) && [a, b].includes(round.trap) ? 'key' : 'look';

/** The ghost finger: one right graph, then the other; a wrong first pick is tapped again to lower it. */
export function pairMove(round: PairRound, first: number | null): number {
  if (first === null) return round.answer[0];
  if (round.answer.includes(first)) return round.answer.find((i) => i !== first)!;
  return first;
}

/** Room for the tally card's marks: a group of five and three more. */
export const PAIR_CARD = { faceW: 80, marksW: 150, rowH: 56 };
/** The tallest bar a small graph draws, in blocks; the plain graph of eight critters fills it. */
export const PAIR_ROWS = 8;

/**
 * The tally card at the top, under the corner buttons, and three small graphs side by side below it, each a whole tap
 * target, clear of the pet on the left. `graphX(i)` is a graph's centre; `blockH` the height of a block on its grid.
 */
export function pairLayout(w: number, h: number, rows: number) {
  const cardW = PAIR_CARD.faceW + PAIR_CARD.marksW + 24;
  const card = {
    left: w / 2 - cardW / 2,
    right: w / 2 + cardW / 2,
    top: 150,
    bottom: 150 + rows * PAIR_CARD.rowH + 12,
  };
  const left = 160;
  const right = w - 24;
  const gap = 18;
  const gw = Math.min(300, (right - left - 2 * gap) / 3);
  const room = h - 24 - (card.bottom + 18);
  // A key strip above the grid and the faces below it.
  const blockH = Math.min(34, (room - 136) / PAIR_ROWS);
  const gh = PAIR_ROWS * blockH + 136;
  // Close under the card in a tall view, so the space left over is at the bottom, around the pet.
  const top = card.bottom + 18 + Math.min(30, (room - gh) / 2);
  const mid = (left + right) / 2;
  return {
    card: {
      ...card,
      rowY: (r: number) => card.top + 6 + PAIR_CARD.rowH / 2 + r * PAIR_CARD.rowH,
      faceX: card.left + PAIR_CARD.faceW / 2,
      marksX: card.left + PAIR_CARD.faceW + 8,
    },
    gw,
    gh,
    top,
    bottom: top + gh,
    blockH,
    /** The grid's baseline inside a graph: the faces sit below it. */
    base: top + gh - 60,
    graphX: (i: number) => mid + (i - 1) * (gw + gap),
  };
}

/* Level 11, What the graph can say: a finished graph and three claims, each stamped yes, no, or "the graph can't say". */

export type Stamp = 'yes' | 'no' | 'cant';
export const STAMPS: Stamp[] = ['yes', 'no', 'cant'];

/**
 * What the graph does not measure. Only things no child can settle from what she knows about animals: "the cows are the
 * biggest" or "the dogs are fastest" would be true in the world, so a child answering from that would take a miss for
 * knowing something; nobody knows which critters came first, are hungriest or sleepiest.
 */
export type CantSay = 'first' | 'hungriest' | 'sleepiest';
export const CANT_SAY: CantSay[] = ['first', 'hungriest', 'sleepiest'];

export type Claim =
  /** "There are more {a} than {b}." */
  | { say: 'more'; a: number; b: number; answer: 'yes' | 'no' }
  /** "The {a} are the most." */
  | { say: 'most'; a: number; answer: 'yes' | 'no' }
  /** "The {a} came first" (or are hungriest, sleepiest): about the kind with the tallest bar, the tempting yes. */
  | { say: 'cant'; a: number; about: CantSay; answer: 'cant' };

/** What the counts say about a claim: decided by the bars alone, or nothing for a thing the graph does not measure. */
export function claimTruth(counts: readonly number[], c: Claim): Stamp {
  if (c.say === 'more') return counts[c.a] > counts[c.b] ? 'yes' : 'no';
  if (c.say === 'most') return counts.every((n, i) => i === c.a || n < counts[c.a]) ? 'yes' : 'no';
  return 'cant';
}

/**
 * A graph's three claims, one of each answer: a yes, a no and a can't-say, in a seeded order. One decided claim is a
 * "more ... than ..." and the other a "the most", so the two are never one claim read backwards. The counts are all
 * different (the plan's distinct rule), so no claim is undecided by a tie.
 */
export function claimsFor(g: Graph, rng: Rng): Claim[] {
  const c = g.counts;
  const top = c.indexOf(Math.max(...c));
  const others = c.map((_, i) => i).filter((i) => i !== top);
  const moreClaim = (answer: 'yes' | 'no'): Claim => {
    const [x, y] = rng.shuffle(c.map((_, i) => i)).slice(0, 2);
    const [big, small] = c[x] > c[y] ? [x, y] : [y, x];
    return answer === 'yes'
      ? { say: 'more', a: big, b: small, answer }
      : { say: 'more', a: small, b: big, answer };
  };
  const moreYes = rng.chance(0.5);
  const claims: Claim[] = [
    moreClaim(moreYes ? 'yes' : 'no'),
    moreYes ? { say: 'most', a: rng.pick(others), answer: 'no' } : { say: 'most', a: top, answer: 'yes' },
    { say: 'cant', a: top, about: rng.pick(CANT_SAY), answer: 'cant' },
  ];
  return rng.shuffle(claims);
}

/** Which gentle line a wrong stamp gets: the graph can't say this one, the graph can say it, or look at the bars again. */
export function stampWhy(c: Claim, stamp: Stamp): 'right' | 'cant' | 'can' | 'look' {
  if (stamp === c.answer) return 'right';
  if (c.answer === 'cant') return 'cant';
  return stamp === 'cant' ? 'can' : 'look';
}

/** The bars a claim names, lit after a wrong stamp: the two compared, every bar for "the most", the one named for a can't-say. */
export const claimBars = (c: Claim, kinds: number): number[] =>
  c.say === 'more' ? [c.a, c.b] : c.say === 'most' ? Array.from({ length: kinds }, (_, i) => i) : [c.a];

/** A stamp's radius: 112 across, a whole tap target. */
export const STAMP_R = 56;

/** The three stamps down the right edge, under the corner buttons, clear of the graph; and the claim card over the graph. */
export function claimLayout(w: number, h: number) {
  const x = w - 100;
  const mid = Math.max(210 + 130, h * 0.45);
  return {
    stamp: (i: number) => ({ x, y: mid + (i - 1) * 140 }),
    // Just over the graph it talks about (whose panel starts at h - 412).
    card: { x: w / 2 - 60, y: Math.max(210, h - 412 - 110), w: 380, h: 130 },
  };
}
