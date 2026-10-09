import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import { choicesFor, graphMove, makeGraph, PLANS, questionsFor, type Question } from './logic';

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

  it("builds each bar exactly to its critters, checks, and answers every question rightly: the demonstration's finger", () => {
    for (const plan of PLANS) {
      for (let seed = 1; seed <= 300; seed++) {
        const rng = new Rng(seed);
        const graph = makeGraph(plan, rng);
        const read = plan.mode === 'read';
        const bars = read ? [...graph.counts] : graph.kinds.map(() => 0);
        const label = `${plan.name} seed ${seed}`;
        // Nothing to touch on a reading level until its question arrives; otherwise she builds.
        expect(graphMove(plan, graph, bars, undefined, null) === null, label).toBe(read);
        if (!read) {
          let taps = 0;
          for (let move = graphMove(plan, graph, bars, undefined, null); move && move.do !== 'check'; move = graphMove(plan, graph, bars, undefined, null)) {
            expect(move.do).toBe('add');
            if (move.do !== 'add') break;
            expect(bars[move.kind], `${label}: never past the critters`).toBeLessThan(graph.counts[move.kind]);
            bars[move.kind]++;
            taps++;
          }
          expect(bars, label).toEqual(graph.counts);
          expect(taps).toBe(graph.counts.reduce((a, b) => a + b, 0));
          expect(graphMove(plan, graph, bars, undefined, null)).toEqual({ do: 'check' });
        }
        for (const q of questionsFor(plan, graph, rng)) {
          let first: number | null = null;
          const answered: number[] = [];
          for (let n = 0; n < 3; n++) {
            const move = graphMove(plan, graph, bars, q, first);
            expect(move, label).not.toBeNull();
            if (move!.do === 'number') {
              expect((q as Extract<Question, { ask: 'more' | 'total' }>).answer, label).toBe(move!.n);
              break;
            }
            expect(move!.do, label).toBe('column');
            const kind = (move as { kind: number }).kind;
            if (q.ask === 'same') {
              answered.push(kind);
              if (first === null) first = kind;
              else break;
            } else {
              expect(kind, label).toBe(q.answer);
              break;
            }
          }
          if (q.ask === 'same') expect([...answered].sort(), label).toEqual([...q.answer].sort());
        }
      }
    }
  });
});
