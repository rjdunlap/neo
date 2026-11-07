import type { Rng } from '../../engine/random';
import type { BandLevels } from '../../progress/difficulty';

/**
 * Inchworm Measure: measuring length with units. Lay inchworms end to end along a leaf (they
 * snap into line, no gaps or overlaps), count them, then say the length; then compare two
 * things by measuring both; then read a ruler, including things that don't start at 0; then
 * use the ruler to find how much longer one thing is than another (starting at different
 * marks), and how long two things are end to end; and measure one thing with big worms, then little
 * worms, to see that a smaller unit makes a bigger count; and read a ruler snapped off below 0, where
 * the end mark is not the length; and tap one worm along a thing hop by hop, a chalk tick at the end of
 * each hop, then count the hops; and measure a thing longer than a short ruler by laying the ruler twice,
 * a chalk mark where the first lay ends, then adding the two parts.
 */
export type MeasureMode = 'lay' | 'say' | 'compare' | 'ruler' | 'rulerdiff' | 'rulersum' | 'units' | 'broken' | 'hop' | 'slide';

/** The levels that read a ruler instead of laying worms. */
export const isRuler = (mode: MeasureMode) => mode === 'ruler' || mode === 'rulerdiff' || mode === 'rulersum' || mode === 'broken';

/** The levels laid out with the smaller ruler unit and the pads along the bottom: the ruler levels, one worm hopping up to 8 long, and a thing up to 12 long under a short ruler. */
export const isWide = (mode: MeasureMode) => isRuler(mode) || mode === 'hop' || mode === 'slide';

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
  { mode: 'units', max: 6, rounds: 4, name: 'Measure one thing with big worms, then little worms: which number did the little worms make?' },
  { mode: 'broken', max: 7, rounds: 4, name: 'The broken ruler: no 0 to start from, so count the spaces it covers' },
  { mode: 'hop', max: 8, rounds: 3, name: 'One worm, hop by hop: tap it along, then count the chalk marks' },
  { mode: 'slide', max: 12, rounds: 3, name: 'Longer than the ruler: lay a short ruler twice, then add the two parts' },
];

export const LEVELS: BandLevels = {
  prek: { min: 1, max: 7, order: [1, 2, 7] },
  school: { min: 1, max: 10, order: [1, 2, 7, 9, 3, 4, 8, 5, 6, 10] },
};

/** Longer than the ruler: the short ruler's length (it reads 0 to this). */
export const SLIDE_RULER = { min: 4, max: 6 } as const;

/** One worm, hop by hop: the shortest thing, in hops. */
export const HOP_MIN = 3;

/** Big and little worms: how many little worms long each row's worm is (row 0 big, row 1 little). */
export const UNIT_SIZE = [2, 1] as const;

export const planFor = (level: number) => PLANS[Math.min(PLANS.length, Math.max(1, level)) - 1];

export type Thing = 'leaf' | 'pencil' | 'snake' | 'stick' | 'crayon' | 'carrot' | 'rope' | 'paintbrush' | 'feather';

export interface Measure {
  thing: Thing;
  length: number;
  /** Compare levels: the second thing and its length. On the ruler levels it also says where on the ruler it starts. */
  other?: { thing: Thing; length: number; start?: number };
  /** Ruler levels: where on the ruler it starts. */
  start?: number;
  /** Big and little worms: which row's count the pet asks for. */
  ask?: 'little' | 'big';
  /** Comparing two things: this round is two jumps in a sand pit (Bunny's first, Duck's second), not two things. */
  jump?: true;
  /** The broken ruler: the mark it snapped at (no marks below it). */
  brk?: number;
  /** Longer than the ruler: the short ruler's length, laid from 0 and then from this mark. */
  ruler?: number;
}

export const THINGS: Thing[] = ['leaf', 'pencil', 'snake', 'stick', 'crayon', 'carrot', 'rope', 'paintbrush', 'feather'];

/** Things not in the round before, so a thing never shows twice running. One draw either way, so lengths keep their seeds. */
const fresh = (out: readonly Measure[], not?: Thing) => {
  const last = out.at(-1);
  return THINGS.filter((t) => t !== not && t !== last?.thing && t !== last?.other?.thing);
};

export function makeMeasures(plan: MeasurePlan, rng: Rng): Measure[] {
  const out: Measure[] = [];
  if (plan.mode === 'units') return unitMeasures(plan, rng);
  if (plan.mode === 'broken') return brokenMeasures(plan, rng);
  if (plan.mode === 'hop') return hopMeasures(plan, rng);
  if (plan.mode === 'slide') return slideMeasures(plan, rng);
  while (out.length < plan.rounds) {
    const length = rng.int(2, plan.max);
    if (out.at(-1)?.length === length) continue;
    const thing = rng.pick(fresh(out));
    if (plan.mode === 'compare') {
      const l2 = rng.int(2, plan.max);
      if (l2 === length) continue;
      out.push({ thing, length, other: { thing: rng.pick(fresh(out, thing)), length: l2 } });
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
      const m: Measure = { thing, length, start: s1, other: { thing: rng.pick(fresh(out, thing)), length: length2, start: s2 } };
      // Different starts must make the ends tell a different story from the lengths (and not the same story twice).
      if (s1 !== s2 && temptingReading(m, 'rulerdiff') === null) continue;
      if (out.length > 0 && answerOf(out[out.length - 1], 'rulerdiff') === answerOf(m, 'rulerdiff')) continue;
      out.push(m);
    } else if (plan.mode === 'rulersum') {
      const length2 = rng.int(2, plan.max);
      const start = out.length % 2 === 0 ? 0 : rng.int(1, 2);
      if (start + length + length2 > RULER) continue;
      if (out.length > 0 && answerOf(out[out.length - 1], 'rulersum') === length + length2) continue;
      out.push({ thing, length, start, other: { thing: rng.pick(fresh(out, thing)), length: length2, start: start + length } });
    } else out.push({ thing, length });
  }
  // Comparing: one round of the three is two jumps in a sand pit, placed after the lengths are drawn so they keep their seeds.
  if (plan.mode === 'compare') out[rng.int(0, out.length - 1)].jump = true;
  return out;
}

/**
 * The broken ruler: snapped at a mark from 2 to 5, the thing starting at the break or up to two marks
 * past it and ending by 10. Four different lengths, so no two rounds share an answer.
 */
function brokenMeasures(plan: MeasurePlan, rng: Rng): Measure[] {
  const out: Measure[] = [];
  while (out.length < plan.rounds) {
    const brk = rng.int(2, 5);
    const start = rng.int(brk, brk + 2);
    const length = rng.int(2, Math.min(plan.max, RULER - start));
    if (out.some((m) => m.length === length)) continue;
    out.push({ thing: rng.pick(fresh(out)), length, start, brk });
  }
  return out;
}

/** One worm, hop by hop: lengths from 3 to the plan's max, never the same length or thing twice running. */
function hopMeasures(plan: MeasurePlan, rng: Rng): Measure[] {
  const out: Measure[] = [];
  while (out.length < plan.rounds) {
    const length = rng.int(HOP_MIN, plan.max);
    if (out.at(-1)?.length === length) continue;
    out.push({ thing: rng.pick(fresh(out)), length });
  }
  return out;
}

/** Longer than the ruler: a ruler 4 to 6 long and a thing from one more than it to twice it, never the same length twice running. */
function slideMeasures(plan: MeasurePlan, rng: Rng): Measure[] {
  const out: Measure[] = [];
  while (out.length < plan.rounds) {
    const ruler = rng.int(SLIDE_RULER.min, SLIDE_RULER.max);
    const length = rng.int(ruler + 1, Math.min(plan.max, 2 * ruler));
    if (out.at(-1)?.length === length) continue;
    out.push({ thing: rng.pick(fresh(out)), length, ruler });
  }
  return out;
}

/** Longer than the ruler: where the ruler's 0 goes on each lay (the thing's start, then the chalk mark). */
export const slideSlots = (m: Measure): [number, number] => [0, m.ruler!];

/**
 * One worm, hop by hop: the worm waits with its nose at the thing's start (mark 0), so hop k lays it over
 * space k and chalks a tick at mark k. No tick at 0: the ticks, the hops and the length are one number.
 */
export const hopTicks = (length: number) => Array.from({ length }, (_, k) => k + 1);

/**
 * Big and little worms: one stick measured twice, `b` big worms (2 or 3) on the first row and `2b` little
 * worms on the second. Never the same thing twice in a row and never three sticks of one length. The first
 * two sticks ask for the little worms' number; the last two ask one each way, in a seeded order.
 */
function unitMeasures(plan: MeasurePlan, rng: Rng): Measure[] {
  const out: Measure[] = [];
  while (out.length < plan.rounds) {
    const b = rng.int(2, Math.floor(plan.max / UNIT_SIZE[0]));
    const thing = rng.pick(THINGS.filter((t) => t !== out.at(-1)?.thing));
    if (out.filter((m) => m.length === b).length >= 2) continue;
    out.push({ thing, length: b, other: { thing, length: b * UNIT_SIZE[0] }, ask: 'little' });
  }
  const late: ('little' | 'big')[] = rng.shuffle(['little', 'big']);
  late.forEach((ask, i) => (out[2 + i].ask = ask));
  return out;
}

/**
 * Where the two things start on the ruler for "how much longer": round by round the same mark (0), one
 * of them along a little way, both along a little way (the same mark is possible, and then reading the ends
 * is right), then any two marks. `makeMeasures` skips a pair of starts whose ends would not tell a different story.
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
  if (mode === 'broken') return m.start! + m.length;
  // Reading only the second lay, and forgetting the first ruler's worth.
  if (mode === 'slide') return m.length - m.ruler!;
  if (mode === 'rulerdiff') {
    const gap = Math.abs(m.start! + m.length - (m.other!.start! + m.other!.length));
    return gap >= 1 && gap !== answerOf(m, mode) ? gap : null;
  }
  if (mode === 'rulersum') return m.start ? m.start + m.length + m.other!.length : m.length;
  return null;
}

/** Number choices: the answer and two near it (for ruler levels, include the likely wrong reading). */
export function choices(m: Measure, mode: MeasureMode, rng: Rng): number[] {
  // Big and little worms: just the two counts, shuffled so a pad's place never says which row it is.
  if (mode === 'units') return rng.shuffle([m.length, m.other!.length]);
  // The broken ruler: the spaces, the end mark, and the marks counted (one more than the spaces).
  if (mode === 'broken') return rng.shuffle([m.length, m.start! + m.length, m.length + 1]);
  // Longer than the ruler: the whole, the second part alone, and one next to the whole.
  if (mode === 'slide') return rng.shuffle([m.length, m.length - m.ruler!, m.length + rng.pick([-1, 1])]);
  const answer = answerOf(m, mode);
  const t = temptingReading(m, mode);
  const tempting = t === null ? [] : [t];
  const near = [answer - 1, answer + 1, answer + 2].filter((n) => n >= 1 && !tempting.includes(n));
  return rng.shuffle([answer, ...tempting, ...rng.shuffle(near)].slice(0, 3));
}

export const answerOf = (m: Measure, mode: MeasureMode) =>
  mode === 'units' ? (m.ask === 'big' ? m.length : m.other!.length) :
  mode === 'compare' || mode === 'rulerdiff' ? Math.abs(m.length - m.other!.length) : mode === 'rulersum' ? m.length + m.other!.length : m.length;

export type MeasureTouch = { kind: 'worm'; row: number } | { kind: 'hop' } | { kind: 'slide'; at: number } | { kind: 'answer'; value: number };

/**
 * The next real touch for a clean measuring round: fill each unfinished row, then choose its reading.
 * One worm, hop by hop: `worms[0]` counts the hops, so it taps the worm `length` times, then the pad.
 * Longer than the ruler: `worms[0]` counts the lays, so it lays the ruler at 0, then at the chalk mark, then taps the pad.
 */
export function measureTouch(m: Measure, mode: MeasureMode, worms: readonly number[]): MeasureTouch | null {
  if (isRuler(mode)) return { kind: 'answer', value: answerOf(m, mode) };
  if (mode === 'slide') return (worms[0] ?? 0) < 2 ? { kind: 'slide', at: slideSlots(m)[worms[0] ?? 0] } : { kind: 'answer', value: m.length };
  if (mode === 'hop') return (worms[0] ?? 0) < m.length ? { kind: 'hop' } : { kind: 'answer', value: m.length };
  const lengths = [m.length, ...(m.other ? [m.other.length] : [])];
  const row = lengths.findIndex((length, i) => (worms[i] ?? 0) < length);
  if (row >= 0) return { kind: 'worm', row };
  return mode === 'lay' ? null : { kind: 'answer', value: answerOf(m, mode) };
}

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
  if (mode === 'ruler' || mode === 'broken') return [{ row: 0, from: m.start ?? 0, count: m.length }];
  // Longer than the ruler: the first ruler's worth and the rest, as two parts.
  if (mode === 'slide') return [{ row: 0, from: 0, count: m.ruler! }, { row: 0, from: m.ruler!, count: m.length - m.ruler! }];
  if (mode === 'rulersum') return [{ row: 0, from: m.start ?? 0, count: m.length }, { row: 1, from: m.other!.start!, count: m.other!.length }];
  if (mode !== 'rulerdiff') return [];
  const firstLonger = m.length > m.other!.length;
  const longer = firstLonger ? { start: m.start ?? 0, length: m.length } : { start: m.other!.start ?? 0, length: m.other!.length };
  const shorter = Math.min(m.length, m.other!.length);
  return [{ row: firstLonger ? 0 : 1, from: longer.start + shorter, count: longer.length - shorter }];
}

/** The longer and the shorter thing of two, for the spoken question. */
export const longerShorter = (m: Measure): [Thing, Thing] => (m.length > m.other!.length ? [m.thing, m.other!.thing] : [m.other!.thing, m.thing]);
