import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import { choicesFor, makeGraph, PLANS, questionsFor } from './logic';

describe('Picture Graph', () => {
  it('makes graphs whose questions have one clear answer', () => {
    for (const plan of PLANS) {
      for (let seed = 1; seed <= 300; seed++) {
        const rng = new Rng(seed);
        const g = makeGraph(plan, rng);
        expect(g.kinds).toHaveLength(plan.kinds);
        expect(new Set(g.kinds).size).toBe(plan.kinds);
        for (const n of g.counts) expect(n).toBeGreaterThanOrEqual(1), expect(n).toBeLessThanOrEqual(plan.max);
        for (const q of questionsFor(plan, g, rng)) {
          if (q.ask === 'most') expect(g.counts.filter((n) => n === g.counts[q.answer])).toHaveLength(1), expect(g.counts[q.answer]).toBe(Math.max(...g.counts));
          if (q.ask === 'fewest') expect(g.counts.filter((n) => n === g.counts[q.answer])).toHaveLength(1), expect(g.counts[q.answer]).toBe(Math.min(...g.counts));
          if (q.ask === 'more') expect(q.answer).toBe(g.counts[q.a] - g.counts[q.b]), expect(q.answer).toBeGreaterThan(0);
          if (q.ask === 'total') expect(q.answer).toBe(g.counts.reduce((s, n) => s + n, 0));
          if (q.ask === 'same') expect(g.counts[q.answer[0]]).toBe(g.counts[q.answer[1]]);
        }
      }
    }
    const ch = choicesFor(3, new Rng(1));
    expect(ch).toContain(3);
    expect(new Set(ch).size).toBe(3);
  });
});
