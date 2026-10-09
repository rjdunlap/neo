import type { CritterName } from '../../art/critter';
import type { Rng } from '../../engine/random';

/**
 * Picture Graph: count the critters playing in a meadow and build a bar graph, one block per
 * critter, then answer questions by reading it: which has the most, how many more, how many in all.
 * The graph is made by the child, so the questions are about something she built. The last two
 * levels use a key: one block stands for two critters, so the bars no longer match a count of one,
 * and the number of blocks is the tempting wrong answer.
 */
export type GraphMode = 'build' | 'most' | 'more' | 'read' | 'scale' | 'scaleread';

export interface GraphPlan {
  mode: GraphMode;
  kinds: number;
  /** Most blocks in one bar (which is the most critters of one kind when a block is one critter). */
  max: number;
  graphs: number;
  /** How many critters one block stands for. Only 1 and 2 are built (the spoken lines say "two"). */
  per: number;
  name: string;
}

export const PLANS: GraphPlan[] = [
  { mode: 'build', kinds: 2, max: 4, graphs: 2, per: 1, name: 'Count two kinds of critters and build their bars, one block each' },
  { mode: 'most', kinds: 3, max: 5, graphs: 2, per: 1, name: 'Build three bars, then: which has the most? the fewest?' },
  { mode: 'more', kinds: 3, max: 6, graphs: 2, per: 1, name: 'Build the graph, then: how many more ducks than pigs?' },
  { mode: 'read', kinds: 4, max: 6, graphs: 2, per: 1, name: 'A graph is already built: how many in all? which two are the same?' },
  { mode: 'scale', kinds: 3, max: 4, graphs: 2, per: 2, name: 'Each block is two critters: build the bars from the pairs, then how many more?' },
  { mode: 'scaleread', kinds: 3, max: 5, graphs: 2, per: 2, name: 'A graph where each block is two critters: how many in all? how many more?' },
];

/** The levels whose graph is already built when the round opens, so there is nothing to build. */
export const prebuilt = (plan: GraphPlan) => plan.mode === 'read' || plan.mode === 'scaleread';

/** The blocks each bar holds when it matches the critters. */
export const barsFor = (plan: GraphPlan, g: Graph): number[] => g.counts.map((n) => n / plan.per);

export const planFor = (level: number) => PLANS[Math.min(PLANS.length, Math.max(1, level)) - 1];

export const KINDS: CritterName[] = ['duck', 'pig', 'bunny', 'cat', 'cow', 'dog'];

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
    const counts = kinds.map(() => rng.int(1, plan.max) * plan.per);
    const top = Math.max(...counts);
    const low = Math.min(...counts);
    if (plan.mode === 'most' && (counts.filter((c) => c === top).length > 1 || counts.filter((c) => c === low).length > 1)) continue;
    if ((plan.mode === 'more' || plan.mode === 'scale' || plan.mode === 'scaleread') && new Set(counts).size < counts.length) continue;
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
  if (plan.mode === 'more') return [more()];
  if (plan.mode === 'scale') return [more()];
  if (plan.mode === 'scaleread') return [{ ask: 'total', answer: c.reduce((s, x) => s + x, 0) }, more()];
  const pair = c.flatMap((x, i) => c.slice(i + 1).map((y, j) => (x === y ? [i, i + 1 + j] : null))).find(Boolean) as [number, number];
  return [{ ask: 'total', answer: c.reduce((s, x) => s + x, 0) }, { ask: 'same', answer: pair }];
}

/**
 * Number choices for a numeric answer: the answer and two neighbors. When a block stands for `per` critters the
 * answer counts critters, so the neighbors are whole numbers of blocks away, and the number of blocks (the
 * answer read straight off the bars, forgetting the key) is always among them.
 */
export function choicesFor(answer: number, rng: Rng, per = 1): number[] {
  if (per > 1) {
    const blocks = answer / per;
    const near = [answer - per, answer + per, answer + 2 * per].filter((n) => n >= per && n !== blocks);
    return rng.shuffle([answer, blocks, ...rng.shuffle(near)].slice(0, 3));
  }
  const near = [answer - 2, answer - 1, answer + 1, answer + 2].filter((n) => n >= 0);
  return rng.shuffle([answer, ...rng.shuffle(near).slice(0, 2)]);
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
