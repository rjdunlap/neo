import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import { CHOICES, echoRest, GAP_SECONDS, judgeEcho, makeQuestions, makeRhythms, PLANS, RHYTHMS, SINGERS, singerToTap, tileFor, tune, type Gap } from './logic';

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

  it('touches every singer in free play, and the tile that shows the answer in the listening levels', () => {
    const free = PLANS[0];
    const heard = new Set(Array.from({ length: free.rounds }, (_, i) => singerToTap(i)));
    expect([...heard].sort()).toEqual([...SINGERS].sort());
    for (const plan of PLANS) {
      for (let seed = 1; seed <= 100; seed++) {
        for (const q of makeQuestions(plan, new Rng(seed))) expect(CHOICES[q.ask][tileFor(q)]).toBe(q.answer);
      }
    }
  });

  it('echoes every rhythm with a hand that cannot tap faster than its own tap-and-return', () => {
    // 0.87 s is the ghost finger's least time between two taps on one spot; a somewhat slower hand (to 1.2 s, past which a long gap would pass the game's 2.2 s patience) gets the same echo.
    for (const minGap of [0.87, 1, 1.2]) {
      for (const r of RHYTHMS) {
        const taps = [0];
        r.forEach((g, i) => taps.push(taps[i] + minGap + echoRest(g, minGap)));
        expect(judgeEcho(r, taps), `${r.join('')} at ${minGap}`).toBe(true);
        // The longest wait stays under the game's two-second patience (it judges 2.2 s after the last tap if taps are missing).
        for (let i = 1; i < taps.length; i++) expect(taps[i] - taps[i - 1]).toBeLessThan(2.2);
      }
    }
    expect(echoRest('S', 0.87)).toBeLessThan(echoRest('L', 0.87));
  });
});
