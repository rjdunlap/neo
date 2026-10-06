import type { Rng } from '../../engine/random';

/**
 * Inchworm Measure: measuring length with units. Lay inchworms end to end along a leaf (they
 * snap into line, no gaps or overlaps), count them, then say the length; then compare two
 * things by measuring both; then read a ruler, including things that don't start at 0.
 */
export type MeasureMode = 'lay' | 'say' | 'compare' | 'ruler';

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
];

export const planFor = (level: number) => PLANS[Math.min(PLANS.length, Math.max(1, level)) - 1];

export type Thing = 'leaf' | 'pencil' | 'snake' | 'stick';

export interface Measure {
  thing: Thing;
  length: number;
  /** Compare levels: the second thing and its length. */
  other?: { thing: Thing; length: number };
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
      if (start + length > 10) continue;
      out.push({ thing, length, start });
    } else out.push({ thing, length });
  }
  return out;
}

/** Number choices: the answer and two near it (for ruler levels, include the "read the end" mistake). */
export function choices(m: Measure, mode: MeasureMode, rng: Rng): number[] {
  const answer = mode === 'compare' ? Math.abs(m.length - m.other!.length) : m.length;
  const tempting = mode === 'ruler' && m.start ? [m.start + m.length] : [];
  const near = [answer - 1, answer + 1, answer + 2].filter((n) => n >= 1 && !tempting.includes(n));
  return rng.shuffle([answer, ...tempting, ...rng.shuffle(near)].slice(0, 3));
}

export const answerOf = (m: Measure, mode: MeasureMode) => (mode === 'compare' ? Math.abs(m.length - m.other!.length) : m.length);
