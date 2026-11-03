import type { CritterName } from '../../art/critter';
import type { Rng } from '../../engine/random';

/**
 * Picture Graph: count the critters playing in a meadow and build a bar graph, one block per
 * critter, then answer questions by reading it: which has the most, how many more, how many in all.
 * The graph is made by the child, so the questions are about something she built. The last two
 * levels use a key: one block stands for two critters, so the bars no longer match a count of one,
 * and the number of blocks is the tempting wrong answer.
 */
export type GraphMode = 'build' | 'most' | 'more' | 'read' | 'scale' | 'scaleread' | 'tally';

export interface GraphPlan {
  mode: GraphMode;
  kinds: number;
  /** Most blocks in one bar (which is the most critters of one kind when a block is one critter). */
  max: number;
  graphs: number;
  /** How many critters one block stands for. Only 1 and 2 are built (the spoken lines say "two"). */
  per: number;
  name: string;
  /** Lowest count; the tally level uses this to make the group of five visible. */
  min?: number;
}

export const PLANS: GraphPlan[] = [
  { mode: 'build', kinds: 2, max: 4, graphs: 2, per: 1, name: 'Count two kinds of critters and build their bars, one block each' },
  { mode: 'most', kinds: 3, max: 5, graphs: 2, per: 1, name: 'Build three bars, then: which has the most? the fewest?' },
  { mode: 'more', kinds: 3, max: 6, graphs: 2, per: 1, name: 'Build the graph, then: how many more ducks than pigs?' },
  { mode: 'read', kinds: 4, max: 6, graphs: 2, per: 1, name: 'A graph is already built: how many in all? which two are the same?' },
  { mode: 'scale', kinds: 3, max: 4, graphs: 2, per: 2, name: 'Each block is two critters: build the bars from the pairs, then how many more?' },
  { mode: 'scaleread', kinds: 3, max: 5, graphs: 2, per: 2, name: 'A graph where each block is two critters: how many in all? how many more?' },
  { mode: 'tally', kinds: 3, min: 4, max: 7, graphs: 1, per: 1, name: 'Record each kind in tally marks, grouping every five, then build and compare one graph' },
];

/** The levels whose graph is already built when the round opens, so there is nothing to build. */
export const prebuilt = (plan: GraphPlan) => plan.mode === 'read' || plan.mode === 'scaleread';

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
  | { ask: 'same'; answer: [number, number] };

/** Critters of each kind: from 1 block to max blocks, a whole number of blocks each. Levels that ask "most" or "fewest" never have ties at the top or bottom. */
export function makeGraph(plan: GraphPlan, rng: Rng): Graph {
  for (;;) {
    const kinds = rng.shuffle([...KINDS]).slice(0, plan.kinds);
    const counts = kinds.map(() => rng.int(plan.min ?? 1, plan.max) * plan.per);
    const top = Math.max(...counts);
    const low = Math.min(...counts);
    if (plan.mode === 'most' && (counts.filter((c) => c === top).length > 1 || counts.filter((c) => c === low).length > 1)) continue;
    if ((plan.mode === 'more' || plan.mode === 'scale' || plan.mode === 'scaleread' || plan.mode === 'tally') && new Set(counts).size < counts.length) continue;
    // Reading levels: exactly one pair of equal bars, for "which two are the same?".
    if (plan.mode === 'read') {
      const pairs = counts.flatMap((c, i) => counts.slice(i + 1).map((d, j) => (c === d ? [i, i + 1 + j] : null))).filter(Boolean);
      if (pairs.length !== 1) continue;
    }
    return { kinds, counts };
  }
}

export function questionsFor(plan: GraphPlan, g: Graph, rng: Rng): Question[] {
  const c = g.counts;
  const more = (): Question => {
    const [a, b] = rng.shuffle(c.map((_, i) => i)).slice(0, 2).sort((x, y) => c[y] - c[x]);
    return { ask: 'more', a, b, answer: c[a] - c[b] };
  };
  if (plan.mode === 'build') return [];
  if (plan.mode === 'most') return [{ ask: 'most', answer: c.indexOf(Math.max(...c)) }, { ask: 'fewest', answer: c.indexOf(Math.min(...c)) }];
  if (plan.mode === 'more' || plan.mode === 'tally') return [more()];
  if (plan.mode === 'scale') return [more()];
  if (plan.mode === 'scaleread') return [{ ask: 'total', answer: c.reduce((s, x) => s + x, 0) }, more()];
  const pair = c.flatMap((x, i) => c.slice(i + 1).map((y, j) => (x === y ? [i, i + 1 + j] : null))).find(Boolean) as [number, number];
  return [{ ask: 'total', answer: c.reduce((s, x) => s + x, 0) }, { ask: 'same', answer: pair }];
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
export const tallerCount = (plan: GraphPlan, g: Graph, q: Question) => (q.ask === 'more' && plan.per === 1 ? g.counts[q.a] : undefined);

/**
 * A tap on a bar while answering "which two are the same?". The first tap lifts that bar; a tap on the lifted bar
 * lowers it again, free; a tap on another bar makes the pair, right or wrong, and lowers the lifted one.
 */
export function sameTap(first: number | null, tapped: number, answer: [number, number]): { first: number | null; result: 'lift' | 'lower' | 'right' | 'wrong' } {
  if (first === null) return { first: tapped, result: 'lift' };
  if (first === tapped) return { first: null, result: 'lower' };
  const pair = [first, tapped].sort((a, b) => a - b);
  const want = [...answer].sort((a, b) => a - b);
  return { first: null, result: pair[0] === want[0] && pair[1] === want[1] ? 'right' : 'wrong' };
}

/** The bars a "same" hint glows: the answer bar not yet lifted, or both when the lifted one is wrong or none is. */
export const sameHint = (first: number | null, answer: [number, number]) => (first !== null && answer.includes(first) ? answer.filter((i) => i !== first) : [...answer]);

/**
 * What a hint shows after two misses on a number question, so she sees why: for "how many more", a line from the
 * shorter bar's top across the taller bar (`line`, in blocks) and the taller bar's blocks above it (`blocks`, as
 * column and block index); for "how many in all", every block.
 */
export function whyBlocks(q: Question, bars: number[]): { line?: { from: number; to: number; at: number }; blocks: { kind: number; k: number }[] } {
  if (q.ask === 'more') {
    const blocks = Array.from({ length: bars[q.a] - bars[q.b] }, (_, j) => ({ kind: q.a, k: bars[q.b] + j }));
    return { line: { from: q.b, to: q.a, at: bars[q.b] }, blocks };
  }
  if (q.ask === 'total') return { blocks: bars.flatMap((n, kind) => Array.from({ length: n }, (_, k) => ({ kind, k }))) };
  return { blocks: [] };
}

/** A critter in the meadow is about this big (at the scale the game draws it), standing on its feet. */
export const CRITTER_W = 58;
export const CRITTER_H = 72;
/** Critters of one block's worth stand this far apart, side by side. */
export const GROUP_GAP = 56;

/** The meadow's room for critters' feet: clear of the key on the left, the number pads on the right and the graph's top (which is 422 above the bottom). */
export const meadowArea = (w: number, h: number) => ({ left: 216, right: w - 236, top: 165, bottom: Math.min(h * 0.5, 370, h - 430) });

/**
 * Where each critter stands when a block is one critter: one critter to a slot of the same grid pairs use, so no two
 * touch, none stands on the graph and the count is always what she sees. In the order of the graph's kinds.
 */
export function meadowSpots(g: Graph, w: number, h: number, rng: Rng): { kind: number; x: number; y: number }[] {
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
export function groupSpots(n: number, per: number, area: ReturnType<typeof meadowArea>, rng: Rng): Spot[] {
  const size = groupSize(per);
  const cols = Math.max(1, Math.floor((area.right - area.left) / size.w) + 1);
  const rows = Math.max(1, Math.floor((area.bottom - area.top) / size.h) + 1);
  const stepX = cols > 1 ? (area.right - area.left) / (cols - 1) : 0;
  const stepY = rows > 1 ? (area.bottom - area.top) / (rows - 1) : 0;
  const slots = rng.shuffle(Array.from({ length: cols * rows }, (_, i) => i)).slice(0, n);
  // A group moves at most half its spare room from its slot, and never out of the area (clamping only brings it back toward its slot).
  const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
  return slots.map((i) => ({
    x: clamp(area.left + (i % cols) * stepX + (stepX > size.w ? rng.range(-(stepX - size.w) / 2, (stepX - size.w) / 2) : 0), area.left, area.right),
    y: clamp(area.top + Math.floor(i / cols) * stepY + (stepY > size.h ? rng.range(-(stepY - size.h) / 2, (stepY - size.h) / 2) : 0), area.top, area.bottom),
  }));
}

/** One touch a capable child makes: a block added to a bar, the check, a column answering "which?", or a number pad. */
export type GraphMove = { do: 'add'; kind: number } | { do: 'check' } | { do: 'column'; kind: number } | { do: 'number'; n: number };

/**
 * What a capable child touches next, from what is on the screen. While she is building, she adds a block to a bar
 * that is short of its critters (never past it) and checks when every bar matches; once there is a question, she
 * answers it: the column for "most", "fewest" and (one tap, then the other) "same", the number pad for "how many
 * more" and "how many in all". Null when there is nothing to do yet, such as a reading level before its question arrives.
 */
export function graphMove(plan: GraphPlan, graph: Graph, bars: number[], question: Question | undefined, firstSame: number | null): GraphMove | null {
  if (question) {
    if (question.ask === 'same') return { do: 'column', kind: firstSame === null ? question.answer[0] : question.answer[1] };
    if (question.ask === 'most' || question.ask === 'fewest') return { do: 'column', kind: question.answer };
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
