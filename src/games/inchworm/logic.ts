import type { Rng } from '../../engine/random';

/**
 * Inchworm Measure: measuring length with units. Lay inchworms end to end along a leaf (they
 * snap into line, no gaps or overlaps), count them, then say the length; then compare two
 * things by measuring both; then read a ruler, including things that don't start at 0; then
 * use the ruler to find how much longer one thing is than another (starting at different
 * marks), and how long two things are end to end.
 */
export type MeasureMode = 'lay' | 'say' | 'compare' | 'ruler' | 'rulerdiff' | 'rulersum';

/** The levels that read a ruler instead of laying worms. */
export const isRuler = (mode: MeasureMode) => mode === 'ruler' || mode === 'rulerdiff' || mode === 'rulersum';

/** The ruler runs from 0 to this mark. */
export const RULER = 10;

export interface MeasurePlan {
  mode: MeasureMode;
  /** Longest thing, in worms. */
  max: number;
  rounds: number;
  name: string;
}

export const PLANS: MeasurePlan[] = [
  { mode: 'lay', max: 4, rounds: 3, name: 'Lay inchworms end to end along a leaf, and count them' },
  { mode: 'say', max: 6, rounds: 3, name: 'Measure with worms, then pick how many worms long' },
  { mode: 'compare', max: 6, rounds: 3, name: 'Measure two things: which is longer, and by how many worms?' },
  { mode: 'ruler', max: 8, rounds: 4, name: 'Read a ruler, even when the pencil does not start at 0' },
  { mode: 'rulerdiff', max: 8, rounds: 4, name: 'Two things on one ruler, starting at different marks: how much longer is one?' },
  { mode: 'rulersum', max: 4, rounds: 4, name: 'Two things end to end on the ruler: how long are they together?' },
];

export const planFor = (level: number) => PLANS[Math.min(PLANS.length, Math.max(1, level)) - 1];

export type Thing = 'leaf' | 'pencil' | 'snake' | 'stick';

export interface Measure {
  thing: Thing;
  length: number;
  /** Compare levels: the second thing and its length. On the ruler levels it also says where on the ruler it starts. */
  other?: { thing: Thing; length: number; start?: number };
  /** Ruler levels: where on the ruler it starts. */
  start?: number;
}

const THINGS: Thing[] = ['leaf', 'pencil', 'snake', 'stick'];

export function makeMeasures(plan: MeasurePlan, rng: Rng): Measure[] {
  const out: Measure[] = [];
  while (out.length < plan.rounds) {
    const length = rng.int(2, plan.max);
    if (out.at(-1)?.length === length) continue;
    const thing = rng.pick(THINGS);
    if (plan.mode === 'compare') {
      const l2 = rng.int(2, plan.max);
      if (l2 === length) continue;
      out.push({ thing, length, other: { thing: rng.pick(THINGS.filter((t) => t !== thing)), length: l2 } });
    } else if (plan.mode === 'ruler') {
      // Half the time it starts at 0; otherwise a little way along (the classic mistake is reading the end).
      const start = out.length % 2 === 0 ? 0 : rng.int(1, 3);
      if (start + length > RULER) continue;
      out.push({ thing, length, start });
    } else if (plan.mode === 'rulerdiff') {
      const length2 = rng.int(2, plan.max);
      if (length2 === length) continue;
      const [s1, s2] = diffStarts(out.length, rng);
      if (s1 + length > RULER || s2 + length2 > RULER) continue;
      const m: Measure = { thing, length, start: s1, other: { thing: rng.pick(THINGS.filter((t) => t !== thing)), length: length2, start: s2 } };
      // Different starts must make the ends tell a different story from the lengths (and not the same story twice).
      if (s1 !== s2 && temptingReading(m, 'rulerdiff') === null) continue;
      if (out.length > 0 && answerOf(out[out.length - 1], 'rulerdiff') === answerOf(m, 'rulerdiff')) continue;
      out.push(m);
    } else if (plan.mode === 'rulersum') {
      const length2 = rng.int(2, plan.max);
      const start = out.length % 2 === 0 ? 0 : rng.int(1, 2);
      if (start + length + length2 > RULER) continue;
      if (out.length > 0 && answerOf(out[out.length - 1], 'rulersum') === length + length2) continue;
      out.push({ thing, length, start, other: { thing: rng.pick(THINGS.filter((t) => t !== thing)), length: length2, start: start + length } });
    } else out.push({ thing, length });
  }
  return out;
}

/**
 * Where the two things start on the ruler for "how much longer": round by round the same mark (0), one
 * of them along a little way, both along at different marks, then any two different marks.
 */
function diffStarts(round: number, rng: Rng): [number, number] {
  switch (round % 4) {
    case 0:
      return [0, 0];
    case 1:
      return rng.chance(0.5) ? [0, rng.int(1, 3)] : [rng.int(1, 3), 0];
    case 2:
      return [rng.int(1, 3), rng.int(1, 3)];
    default:
      return [rng.int(0, 3), rng.int(0, 3)];
  }
}

/**
 * The wrong reading a child is most likely to make, or null when there is not a likely one. Reading
 * where a thing ends instead of counting its spaces; the gap between two ends instead of between two
 * lengths; or the mark where the first of two things stops instead of the whole.
 */
export function temptingReading(m: Measure, mode: MeasureMode): number | null {
  if (mode === 'ruler') return m.start ? m.start + m.length : null;
  if (mode === 'rulerdiff') {
    const gap = Math.abs(m.start! + m.length - (m.other!.start! + m.other!.length));
    return gap >= 1 && gap !== answerOf(m, mode) ? gap : null;
  }
  if (mode === 'rulersum') return m.start ? m.start + m.length + m.other!.length : m.length;
  return null;
}

/** Number choices: the answer and two near it (for ruler levels, include the likely wrong reading). */
export function choices(m: Measure, mode: MeasureMode, rng: Rng): number[] {
  const answer = answerOf(m, mode);
  const t = temptingReading(m, mode);
  const tempting = t === null ? [] : [t];
  const near = [answer - 1, answer + 1, answer + 2].filter((n) => n >= 1 && !tempting.includes(n));
  return rng.shuffle([answer, ...tempting, ...rng.shuffle(near)].slice(0, 3));
}

export const answerOf = (m: Measure, mode: MeasureMode) =>
  mode === 'compare' || mode === 'rulerdiff' ? Math.abs(m.length - m.other!.length) : mode === 'rulersum' ? m.length + m.other!.length : m.length;

/** Which ruler spaces to light up when help is wanted: `row` is 0 for the first thing, 1 for the second; `from` is a ruler mark. */
export interface Span {
  row: 0 | 1;
  from: number;
  count: number;
}

/**
 * The spaces that lead to the answer: the ones a thing covers (a ruler level), both things' (end to
 * end), or, for "how much longer", the spaces the longer one covers beyond the shorter one's length.
 */
export function hintSpans(m: Measure, mode: MeasureMode): Span[] {
  if (mode === 'ruler') return [{ row: 0, from: m.start ?? 0, count: m.length }];
  if (mode === 'rulersum') return [{ row: 0, from: m.start ?? 0, count: m.length }, { row: 1, from: m.other!.start!, count: m.other!.length }];
  if (mode !== 'rulerdiff') return [];
  const firstLonger = m.length > m.other!.length;
  const longer = firstLonger ? { start: m.start ?? 0, length: m.length } : { start: m.other!.start ?? 0, length: m.other!.length };
  const shorter = Math.min(m.length, m.other!.length);
  return [{ row: firstLonger ? 0 : 1, from: longer.start + shorter, count: longer.length - shorter }];
}

/** The longer and the shorter thing of two, for the spoken question. */
export const longerShorter = (m: Measure): [Thing, Thing] => (m.length > m.other!.length ? [m.thing, m.other!.thing] : [m.other!.thing, m.thing]);
