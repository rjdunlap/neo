import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import { CHOICES, GAP_SECONDS, judgeEcho, makeQuestions, makeRhythms, PLANS, RHYTHMS, tune, type Gap } from './logic';

/** Tap times for a rhythm, with each gap stretched by a factor (a child's wobble). */
const play = (r: Gap[], wobble: number[] = []) => {
  const t = [0];
  r.forEach((g, i) => t.push(t[i] + GAP_SECONDS[g] * (wobble[i] ?? 1)));
  return t;
};

describe('Sound Garden', () => {
  it('asks balanced questions with the right answers, never three alike in a row', () => {
    for (const plan of PLANS) {
      for (let seed = 1; seed <= 200; seed++) {
        const qs = makeQuestions(plan, new Rng(seed));
        if (plan.mode === 'play' || plan.mode === 'echo') {
          expect(qs).toHaveLength(0);
          continue;
        }
        expect(qs).toHaveLength(plan.rounds);
        for (const q of qs) expect(CHOICES[q.ask]).toContain(q.answer);
        qs.slice(2).forEach((q, i) => expect(q.answer === qs[i].answer && q.answer === qs[i + 1].answer).toBe(false));
      }
    }
  });

  it('accepts a wobbly echo but not the wrong rhythm or tap count', () => {
    for (const r of RHYTHMS) {
      expect(judgeEcho(r, play(r)), r.join('')).toBe(true);
      expect(judgeEcho(r, play(r, [1.25, 0.85, 1.2]))).toBe(true);
      expect(judgeEcho(r, play([...r, 'S']))).toBe(false);
    }
    expect(judgeEcho(['L', 'S'], play(['S', 'L']))).toBe(false);
    expect(judgeEcho(['S', 'S'], play(['S', 'L']))).toBe(false);
    expect(judgeEcho(['S'], [0, 3])).toBe(false);
  });

  it('starts echo rounds short and goes up and down the scale', () => {
    const r = makeRhythms(4, new Rng(3));
    expect(r).toHaveLength(4);
    expect(r[0].length).toBeLessThanOrEqual(2);
    expect(tune('up')).toEqual([...tune('down')].reverse());
  });
});
