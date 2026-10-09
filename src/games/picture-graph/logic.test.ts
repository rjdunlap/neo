import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import { barsFor, choicesFor, CRITTER_H, CRITTER_W, graphMove, GROUP_GAP, groupSpots, makeGraph, meadowArea, PLANS, prebuilt, questionsFor, type Question } from './logic';

describe('Picture Graph', () => {
  it('makes graphs whose questions have one clear answer', () => {
    for (const plan of PLANS) {
      for (let seed = 1; seed <= 300; seed++) {
        const rng = new Rng(seed);
        const g = makeGraph(plan, rng);
        expect(g.kinds).toHaveLength(plan.kinds);
        expect(new Set(g.kinds).size).toBe(plan.kinds);
        for (const n of g.counts) expect(n).toBeGreaterThanOrEqual(plan.per), expect(n).toBeLessThanOrEqual(plan.max * plan.per), expect(n % plan.per).toBe(0);
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
        const read = prebuilt(plan);
        const bars = read ? barsFor(plan, graph) : graph.kinds.map(() => 0);
        const label = `${plan.name} seed ${seed}`;
        // Nothing to touch on a reading level until its question arrives; otherwise she builds.
        expect(graphMove(plan, graph, bars, undefined, null) === null, label).toBe(read);
        if (!read) {
          let taps = 0;
          for (let move = graphMove(plan, graph, bars, undefined, null); move && move.do !== 'check'; move = graphMove(plan, graph, bars, undefined, null)) {
            expect(move.do).toBe('add');
            if (move.do !== 'add') break;
            expect(bars[move.kind], `${label}: never past the critters`).toBeLessThan(graph.counts[move.kind] / plan.per);
            bars[move.kind]++;
            taps++;
          }
          expect(bars, label).toEqual(barsFor(plan, graph));
          expect(taps).toBe(barsFor(plan, graph).reduce((a, b) => a + b, 0));
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

describe('Picture Graph with a key: one block is two critters', () => {
  const scale = PLANS.filter((p) => p.per > 1);

  it('appends the two keyed levels after reading a graph, leaving the first four as they were', () => {
    expect(PLANS.map((p) => p.mode)).toEqual(['build', 'most', 'more', 'read', 'scale', 'scaleread']);
    expect(PLANS.slice(0, 4).every((p) => p.per === 1)).toBe(true);
    expect(scale.map((p) => p.per)).toEqual([2, 2]);
  });

  it('counts critters in whole blocks, with every kind a different height so "how many more" is never nothing', () => {
    for (const plan of scale) {
      for (let seed = 1; seed <= 400; seed++) {
        const g = makeGraph(plan, new Rng(seed));
        expect(g.counts.every((n) => n % plan.per === 0)).toBe(true);
        expect(new Set(g.counts).size).toBe(g.counts.length);
        expect(barsFor(plan, g)).toEqual(g.counts.map((n) => n / 2));
        expect(Math.max(...barsFor(plan, g))).toBeLessThanOrEqual(plan.max);
      }
    }
  });

  it('asks how many more after the build, and how many in all and how many more when reading, in critters', () => {
    for (let seed = 1; seed <= 300; seed++) {
      const [build, read] = scale;
      const g1 = makeGraph(build, new Rng(seed));
      expect(questionsFor(build, g1, new Rng(seed)).map((q) => q.ask)).toEqual(['more']);
      const g2 = makeGraph(read, new Rng(seed));
      const qs = questionsFor(read, g2, new Rng(seed));
      expect(qs.map((q) => q.ask)).toEqual(['total', 'more']);
      const total = qs[0] as Extract<Question, { ask: 'total' }>;
      expect(total.answer).toBe(g2.counts.reduce((a, b) => a + b, 0));
      expect(total.answer).toBe(2 * barsFor(read, g2).reduce((a, b) => a + b, 0));
      const more = qs[1] as Extract<Question, { ask: 'more' }>;
      expect(more.answer).toBe(g2.counts[more.a] - g2.counts[more.b]);
      expect(more.answer).toBe(2 * (barsFor(read, g2)[more.a] - barsFor(read, g2)[more.b]));
      expect(more.answer).toBeGreaterThanOrEqual(2);
    }
  });

  it('always offers the number of blocks as the wrong answer, and the other choices are whole blocks of critters away', () => {
    for (const answer of [2, 4, 6, 8, 10, 12, 18, 24, 30]) {
      for (let seed = 1; seed <= 100; seed++) {
        const cs = choicesFor(answer, new Rng(seed), 2);
        expect(cs).toHaveLength(3);
        expect(new Set(cs).size).toBe(3);
        expect(cs).toContain(answer);
        expect(cs).toContain(answer / 2);
        for (const n of cs) if (n !== answer / 2) expect(n % 2).toBe(0);
        for (const n of cs) expect(n).toBeGreaterThanOrEqual(1);
      }
    }
  });

  it('choicesFor with no key is unchanged: the answer and two neighbors', () => {
    const cs = choicesFor(5, new Rng(3));
    expect(cs).toContain(5);
    expect(new Set(cs).size).toBe(3);
    expect(cs.every((n) => Math.abs(n - 5) <= 2)).toBe(true);
  });

  it('the finger adds one block for each pair, never past its bar, and answers in critters', () => {
    const build = scale[0];
    for (let seed = 1; seed <= 200; seed++) {
      const graph = makeGraph(build, new Rng(seed));
      const bars = graph.kinds.map(() => 0);
      let taps = 0;
      for (let move = graphMove(build, graph, bars, undefined, null); move && move.do === 'add'; move = graphMove(build, graph, bars, undefined, null)) {
        bars[move.kind]++;
        taps++;
        expect(taps).toBeLessThanOrEqual(graph.counts.length * build.max);
      }
      expect(bars).toEqual(graph.counts.map((n) => n / 2));
      expect(graphMove(build, graph, bars, undefined, null)).toEqual({ do: 'check' });
    }
  });
});

describe('Picture Graph meadow: pairs of critters never hide each other', () => {
  const rect = (x: number, y: number) => ({ l: x - CRITTER_W / 2, r: x + CRITTER_W / 2, t: y - CRITTER_H, b: y });
  const touches = (a: ReturnType<typeof rect>, b: ReturnType<typeof rect>) => a.l < b.r && b.l < a.r && a.t < b.b && b.t < a.b;

  it('places every pair, in the area, clear of the key and the number pads, with no two critters touching', () => {
    const critters = (spots: { x: number; y: number }[]) => spots.flatMap((p) => [rect(p.x - GROUP_GAP / 2, p.y), rect(p.x + GROUP_GAP / 2, p.y)]);
    for (const [w, h] of [[1024, 768], [1366, 1024], [1600, 768], [1024, 1365]] as const) {
      const area = meadowArea(w, h);
      // The key sits at x 88 (124 wide) on the left and the pads are 124 wide centered 110 in from the right.
      for (const n of [1, 5, 9, 12]) {
        // Thousands of seeds times every pair of critters is too many `expect` calls for the suite's time limit
        // under load, so plain comparisons collect what is wrong and one `expect` per size reports the first few.
        const problems: string[] = [];
        for (let seed = 1; seed <= 300; seed++) {
          const spots = groupSpots(n, 2, area, new Rng(seed));
          const at = `${w}x${h} n=${n} seed ${seed}`;
          if (spots.length !== n) problems.push(`${at}: placed ${spots.length} pairs`);
          const cs = critters(spots);
          cs.forEach((c, i) => {
            if (c.l < 88 + 62 + 4) problems.push(`${at}: critter ${i} is not clear of the key`);
            if (c.r > w - 110 - 62 - 4) problems.push(`${at}: critter ${i} is not clear of the number pads`);
            if (c.t < area.top - CRITTER_H - 1) problems.push(`${at}: critter ${i} is above the area`);
            if (c.b > area.bottom + 1) problems.push(`${at}: critter ${i} is below the area`);
            if (c.b < area.top - 1) problems.push(`${at}: critter ${i} is wholly above the area`);
            // Two in a pair stand side by side on purpose; different pairs never touch.
            for (let j = i + 1; j < cs.length; j++) if (j >> 1 !== i >> 1 && touches(c, cs[j])) problems.push(`${at}: critters ${i} and ${j} touch`);
          });
        }
        expect(problems.slice(0, 5)).toEqual([]);
      }
    }
  });

  it('has room for every build the level can ask for, in the smallest view, with the graph panel below it', () => {
    const area = meadowArea(1024, 768);
    // The graph's panel starts 422 above the bottom of a 768-high view (see `draw` in index.ts); the feet stay above it.
    expect(area.bottom).toBeLessThanOrEqual(768 - 422);
    for (const plan of PLANS.filter((p) => p.per > 1 && !prebuilt(p))) {
      for (let seed = 1; seed <= 300; seed++) {
        const g = makeGraph(plan, new Rng(seed));
        const groups = g.counts.reduce((a, b) => a + b, 0) / plan.per;
        expect(groupSpots(groups, plan.per, area, new Rng(seed))).toHaveLength(groups);
      }
    }
  });
});
