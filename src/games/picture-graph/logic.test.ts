import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import { barsFor, choicesFor, CRITTER_H, CRITTER_W, graphMove, GROUP_GAP, groupSpots, KINDS, makeGraph, meadowArea, meadowSpots, MEADOWS, PLANS, prebuilt, questionsFor, sameHint, sameTap, tallerCount, tallyMove, whyBlocks, type Question } from './logic';

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
    expect(PLANS.slice(0, 6).map((p) => p.mode)).toEqual(['build', 'most', 'more', 'read', 'scale', 'scaleread']);
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

describe('Picture Graph level 7: tally, then graph', () => {
  const plan = PLANS[6];

  it('adds level 7 without changing the first six plans', () => {
    expect(PLANS.slice(0, 6).map((p) => p.mode)).toEqual(['build', 'most', 'more', 'read', 'scale', 'scaleread']);
    expect(plan).toMatchObject({ mode: 'tally', kinds: 3, min: 4, max: 7, per: 1, graphs: 1 });
  });

  it('generates distinct counts that exercise tally groups of five and fair comparisons', () => {
    for (let seed = 1; seed <= 500; seed++) {
      const graph = makeGraph(plan, new Rng(seed));
      expect(graph.counts.every((n) => n >= 4 && n <= 7)).toBe(true);
      expect(new Set(graph.counts).size).toBe(3);
      expect(tallyMove(graph, [0, 0, 0])).toEqual({ do: 'add', kind: 0 });
      const tallies = [...graph.counts];
      expect(tallyMove(graph, tallies)).toEqual({ do: 'check' });
      tallies[0]--;
      expect(tallyMove(graph, tallies)).toEqual({ do: 'add', kind: 0 });
      const question = questionsFor(plan, graph, new Rng(seed + 900)).at(0) as Extract<Question, { ask: 'more' }>;
      expect(question.ask).toBe('more');
      expect(question.answer).toBe(graph.counts[question.a] - graph.counts[question.b]);
      expect(question.answer).toBeGreaterThan(0);
    }
  });

  it('has a bot path from five-mark tallies through bars to the comparison', () => {
    for (let seed = 1; seed <= 300; seed++) {
      const rng = new Rng(seed);
      const graph = makeGraph(plan, rng);
      const tallies = [0, 0, 0];
      let move = tallyMove(graph, tallies);
      while (move.do === 'add') {
        tallies[move.kind]++;
        move = tallyMove(graph, tallies);
      }
      expect(tallies).toEqual(graph.counts);
      const bars = [0, 0, 0];
      move = graphMove(plan, graph, bars, undefined, null)!;
      while (move.do === 'add') {
        bars[move.kind]++;
        move = graphMove(plan, graph, bars, undefined, null)!;
      }
      expect(bars).toEqual(graph.counts);
      expect(move).toEqual({ do: 'check' });
      const q = questionsFor(plan, graph, rng)[0] as Extract<Question, { ask: 'more' }>;
      expect(graphMove(plan, graph, bars, q, null)).toEqual({ do: 'number', n: q.answer });
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

describe('Picture Graph fair meadows, visible first pick, hints that show why', () => {
  const VIEWS: [number, number][] = [[1024, 768], [1366, 1024], [1600, 768], [1024, 1365]];
  const sum = (a: number[]) => a.reduce((x, y) => x + y, 0);

  it('places every critter in the meadow for levels 1-3 and 7 at four views, never touching, clear of key and pads', () => {
    const problems: string[] = [];
    for (const pi of [0, 1, 2, 6]) {
      const plan = PLANS[pi];
      for (const [w, h] of VIEWS) {
        const area = meadowArea(w, h);
        for (let seed = 1; seed <= 300; seed++) {
          const rng = new Rng(seed);
          const g = makeGraph(plan, rng);
          const spots = meadowSpots(g, w, h, rng);
          const tag = `L${pi + 1} ${w}x${h} seed ${seed}`;
          if (spots.length !== sum(g.counts)) problems.push(`${tag}: count ${spots.length}`);
          g.counts.forEach((n, k) => spots.filter((s) => s.kind === k).length !== n && problems.push(`${tag}: kind ${k} count`));
          for (const [i, s] of spots.entries()) {
            if (s.x < area.left - 0.01 || s.x > area.right + 0.01 || s.y < area.top - 0.01 || s.y > area.bottom + 0.01) problems.push(`${tag}: ${i} outside area`);
            if (s.y > h - 430) problems.push(`${tag}: ${i} on graph panel`);
            if (s.x - CRITTER_W / 2 <= 88 + 62 + 4) problems.push(`${tag}: ${i} on key`);
            if (s.x + CRITTER_W / 2 >= w - 110 - 62 - 4) problems.push(`${tag}: ${i} on pads`);
            for (const t of spots.slice(i + 1)) {
              if (Math.abs(s.x - t.x) < CRITTER_W && Math.abs(s.y - t.y) < CRITTER_H) problems.push(`${tag}: ${i} touches another`);
            }
          }
          if (problems.length > 20) break;
        }
      }
    }
    expect(problems.slice(0, 20)).toEqual([]);
    for (const [w, h] of VIEWS) expect(groupSpots(18, 1, meadowArea(w, h), new Rng(5))).toHaveLength(18);
  });

  it('choicesFor with the taller bar offers three distinct choices holding the answer and the taller count', () => {
    const problems: string[] = [];
    let asked = 0;
    for (const pi of [2, 6]) {
      const plan = PLANS[pi];
      for (let seed = 1; seed <= 300; seed++) {
        const rng = new Rng(seed);
        const g = makeGraph(plan, rng);
        for (const q of questionsFor(plan, g, rng)) {
          if (q.ask !== 'more') continue;
          asked++;
          const taller = tallerCount(plan, g, q);
          const ch = choicesFor(q.answer, rng, 1, taller);
          if (taller === undefined || taller === q.answer) problems.push(`L${pi + 1} ${seed}: taller ${taller}`);
          if (new Set(ch).size !== 3 || !ch.includes(q.answer) || !ch.includes(taller as number) || ch.some((n) => n < 0)) problems.push(`L${pi + 1} ${seed}: ${ch} ans ${q.answer} taller ${taller}`);
        }
      }
    }
    expect(asked).toBe(600);
    expect(problems.slice(0, 10)).toEqual([]);
    // Undefined for keyed plans and for other questions.
    for (const pi of [4, 5]) {
      const rng = new Rng(3);
      const g = makeGraph(PLANS[pi], rng);
      for (const q of questionsFor(PLANS[pi], g, rng)) expect(tallerCount(PLANS[pi], g, q)).toBeUndefined();
    }
    const g4 = makeGraph(PLANS[3], new Rng(3));
    for (const q of questionsFor(PLANS[3], g4, new Rng(3))) expect(tallerCount(PLANS[3], g4, q)).toBeUndefined();
    // Without a taller bar: the answer plus neighbours within 2.
    for (let seed = 1; seed <= 100; seed++) {
      const ch = choicesFor(4, new Rng(seed), 1);
      expect(ch).toContain(4);
      expect(new Set(ch).size).toBe(3);
      for (const n of ch) expect(Math.abs(n - 4)).toBeLessThanOrEqual(2);
    }
  });

  it('sameTap lifts, lowers for free, and judges the pair in either order; sameHint points at progress', () => {
    const ans: [number, number] = [1, 3];
    expect(sameTap(null, 2, ans)).toEqual({ first: 2, result: 'lift' });
    expect(sameTap(2, 2, ans)).toEqual({ first: null, result: 'lower' });
    expect(sameTap(1, 3, ans)).toEqual({ first: null, result: 'right' });
    expect(sameTap(3, 1, ans)).toEqual({ first: null, result: 'right' });
    expect(sameTap(1, 2, ans)).toEqual({ first: null, result: 'wrong' });
    expect(sameTap(0, 2, ans)).toEqual({ first: null, result: 'wrong' });
    expect(sameHint(null, ans)).toEqual([1, 3]);
    expect(sameHint(1, ans)).toEqual([3]);
    expect(sameHint(3, ans)).toEqual([1]);
    expect(sameHint(2, ans)).toEqual([1, 3]);
  });

  it('whyBlocks shows the taller bar above the shorter one, every block for a total, nothing otherwise', () => {
    const problems: string[] = [];
    for (const pi of [2, 4, 5, 6, 3]) {
      const plan = PLANS[pi];
      for (let seed = 1; seed <= 100; seed++) {
        const rng = new Rng(seed);
        const g = makeGraph(plan, rng);
        const bars = barsFor(plan, g);
        for (const q of questionsFor(plan, g, rng)) {
          const w = whyBlocks(q, bars);
          const tag = `L${pi + 1} ${seed} ${q.ask}`;
          if (q.ask === 'more') {
            if (w.blocks.length !== bars[q.a] - bars[q.b]) problems.push(`${tag}: length`);
            if (plan.per === 2 && w.blocks.length * 2 !== q.answer) problems.push(`${tag}: key`);
            if (plan.per === 1 && w.blocks.length !== q.answer) problems.push(`${tag}: answer`);
            w.blocks.forEach((b, j) => (b.kind !== q.a || b.k !== bars[q.b] + j || b.k > bars[q.a] - 1) && problems.push(`${tag}: block ${j}`));
            if (!w.line || w.line.from !== q.b || w.line.to !== q.a || w.line.at !== bars[q.b]) problems.push(`${tag}: line`);
          } else if (q.ask === 'total') {
            if (w.blocks.length !== sum(bars)) problems.push(`${tag}: total`);
          } else if (w.blocks.length !== 0) problems.push(`${tag}: blocks`);
        }
      }
    }
    expect(problems.slice(0, 10)).toEqual([]);
    expect(whyBlocks({ ask: 'same', answer: [0, 1] }, [2, 2, 3]).blocks).toEqual([]);
    expect(whyBlocks({ ask: 'most', answer: 0 }, [2, 1]).blocks).toEqual([]);
  });

  it('has a bear among the critters, picked sometimes, and at least three distinct meadows', () => {
    expect(KINDS).toContain('bear');
    expect(new Set(MEADOWS).size).toBeGreaterThanOrEqual(3);
    let bears = 0;
    for (let seed = 1; seed <= 100; seed++) if (makeGraph(PLANS[2], new Rng(seed)).kinds.includes('bear')) bears++;
    expect(bears).toBeGreaterThan(0);
  });

  it('the bot taps the first same bar then the second, and the pair is right', () => {
    for (let seed = 1; seed <= 100; seed++) {
      const rng = new Rng(seed);
      const plan = PLANS[3];
      const g = makeGraph(plan, rng);
      const q = questionsFor(plan, g, rng).find((x) => x.ask === 'same')!;
      if (q.ask !== 'same') throw new Error('no same');
      const bars = barsFor(plan, g);
      const m1 = graphMove(plan, g, bars, q, null);
      expect(m1).toEqual({ do: 'column', kind: q.answer[0] });
      const m2 = graphMove(plan, g, bars, q, q.answer[0]);
      expect(m2).toEqual({ do: 'column', kind: q.answer[1] });
      expect(sameTap(q.answer[0], q.answer[1], q.answer).result).toBe('right');
    }
  });
});
