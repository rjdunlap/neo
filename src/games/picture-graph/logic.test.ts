import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import {
  claimBars,
  claimLayout,
  claimsFor,
  claimTruth,
  CANT_SAY,
  STAMP_R,
  STAMPS,
  stampWhy,
  critters,
  makePairRound,
  ownScene,
  pairLayout,
  pairMove,
  pairWhy,
  PAIR_ROWS,
  barsFor,
  cardLayout,
  CARD_GROUP_W,
  choicesFor,
  CRITTER_H,
  CRITTER_W,
  graphMove,
  GROUP_GAP,
  groupSpots,
  KINDS,
  makeGraph,
  meadowArea,
  meadowSpots,
  MEADOWS,
  PLANS,
  prebuilt,
  questionsFor,
  sameHint,
  sameTap,
  tallerCount,
  tallyMove,
  whyBlocks,
  lineHint,
  lineKinds,
  lineMove,
  lineQuestions,
  makeShore,
  planFor,
  shoreSpots,
  THING_SIZE,
  THINGS,
  trayLayout,
  type Question,
} from './logic';

describe('Picture Graph', () => {
  it('makes graphs whose questions have one clear answer', () => {
    for (const plan of PLANS.filter((p) => !ownScene(p))) {
      for (let seed = 1; seed <= 300; seed++) {
        const rng = new Rng(seed);
        const g = makeGraph(plan, rng);
        expect(g.kinds).toHaveLength(plan.kinds);
        expect(new Set(g.kinds).size).toBe(plan.kinds);
        for (const n of g.counts)
          (expect(n).toBeGreaterThanOrEqual(plan.per),
            expect(n).toBeLessThanOrEqual(plan.max * plan.per),
            expect(n % plan.per).toBe(0));
        for (const q of questionsFor(plan, g, rng)) {
          if (q.ask === 'most')
            (expect(g.counts.filter((n) => n === g.counts[q.answer])).toHaveLength(1),
              expect(g.counts[q.answer]).toBe(Math.max(...g.counts)));
          if (q.ask === 'fewest')
            (expect(g.counts.filter((n) => n === g.counts[q.answer])).toHaveLength(1),
              expect(g.counts[q.answer]).toBe(Math.min(...g.counts)));
          if (q.ask === 'more')
            (expect(q.answer).toBe(g.counts[q.a] - g.counts[q.b]), expect(q.answer).toBeGreaterThan(0));
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
    for (const plan of PLANS.filter((p) => !ownScene(p))) {
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
          for (
            let move = graphMove(plan, graph, bars, undefined, null);
            move && move.do !== 'check';
            move = graphMove(plan, graph, bars, undefined, null)
          ) {
            expect(move.do).toBe('add');
            if (move.do !== 'add') break;
            expect(bars[move.kind], `${label}: never past the critters`).toBeLessThan(
              graph.counts[move.kind] / plan.per,
            );
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
            if (move!.do === 'stamp') {
              expect(q.ask === 'claim' && claimTruth(graph.counts, q.claim), label).toBe(move!.stamp);
              break;
            }
            expect(move!.do, label).toBe('column');
            const kind = (move as { kind: number }).kind;
            if (q.ask === 'same') {
              answered.push(kind);
              if (first === null) first = kind;
              else break;
            } else {
              expect(kind, label).toBe((q as Extract<Question, { ask: 'most' | 'fewest' }>).answer);
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
  const scale = PLANS.filter((p) => p.per === 2 && !ownScene(p));

  it('appends the two keyed levels after reading a graph, leaving the first four as they were', () => {
    expect(PLANS.slice(0, 6).map((p) => p.mode)).toEqual([
      'build',
      'most',
      'more',
      'read',
      'scale',
      'scaleread',
    ]);
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
      for (
        let move = graphMove(build, graph, bars, undefined, null);
        move && move.do === 'add';
        move = graphMove(build, graph, bars, undefined, null)
      ) {
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
    expect(PLANS.slice(0, 6).map((p) => p.mode)).toEqual([
      'build',
      'most',
      'more',
      'read',
      'scale',
      'scaleread',
    ]);
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
      const question = questionsFor(plan, graph, new Rng(seed + 900)).at(0) as Extract<
        Question,
        { ask: 'more' }
      >;
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
  const rect = (x: number, y: number) => ({
    l: x - CRITTER_W / 2,
    r: x + CRITTER_W / 2,
    t: y - CRITTER_H,
    b: y,
  });
  const touches = (a: ReturnType<typeof rect>, b: ReturnType<typeof rect>) =>
    a.l < b.r && b.l < a.r && a.t < b.b && b.t < a.b;

  it('places every pair, in the area, clear of the key and the number pads, with no two critters touching', () => {
    const critters = (spots: { x: number; y: number }[]) =>
      spots.flatMap((p) => [rect(p.x - GROUP_GAP / 2, p.y), rect(p.x + GROUP_GAP / 2, p.y)]);
    for (const [w, h] of [
      [1024, 768],
      [1366, 1024],
      [1600, 768],
      [1024, 1365],
    ] as const) {
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
            for (let j = i + 1; j < cs.length; j++)
              if (j >> 1 !== i >> 1 && touches(c, cs[j]))
                problems.push(`${at}: critters ${i} and ${j} touch`);
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
    for (const plan of PLANS.filter((p) => p.per === 2 && !prebuilt(p) && !ownScene(p))) {
      for (let seed = 1; seed <= 300; seed++) {
        const g = makeGraph(plan, new Rng(seed));
        const groups = g.counts.reduce((a, b) => a + b, 0) / plan.per;
        expect(groupSpots(groups, plan.per, area, new Rng(seed))).toHaveLength(groups);
      }
    }
  });
});

describe('Picture Graph fair meadows, visible first pick, hints that show why', () => {
  const VIEWS: [number, number][] = [
    [1024, 768],
    [1366, 1024],
    [1600, 768],
    [1024, 1365],
  ];
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
          g.counts.forEach(
            (n, k) =>
              spots.filter((s) => s.kind === k).length !== n && problems.push(`${tag}: kind ${k} count`),
          );
          for (const [i, s] of spots.entries()) {
            if (
              s.x < area.left - 0.01 ||
              s.x > area.right + 0.01 ||
              s.y < area.top - 0.01 ||
              s.y > area.bottom + 0.01
            )
              problems.push(`${tag}: ${i} outside area`);
            if (s.y > h - 430) problems.push(`${tag}: ${i} on graph panel`);
            if (s.x - CRITTER_W / 2 <= 88 + 62 + 4) problems.push(`${tag}: ${i} on key`);
            if (s.x + CRITTER_W / 2 >= w - 110 - 62 - 4) problems.push(`${tag}: ${i} on pads`);
            for (const t of spots.slice(i + 1)) {
              if (Math.abs(s.x - t.x) < CRITTER_W && Math.abs(s.y - t.y) < CRITTER_H)
                problems.push(`${tag}: ${i} touches another`);
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
          if (taller === undefined || taller === q.answer)
            problems.push(`L${pi + 1} ${seed}: taller ${taller}`);
          if (
            new Set(ch).size !== 3 ||
            !ch.includes(q.answer) ||
            !ch.includes(taller as number) ||
            ch.some((n) => n < 0)
          )
            problems.push(`L${pi + 1} ${seed}: ${ch} ans ${q.answer} taller ${taller}`);
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
    for (const q of questionsFor(PLANS[3], g4, new Rng(3)))
      expect(tallerCount(PLANS[3], g4, q)).toBeUndefined();
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
            w.blocks.forEach(
              (b, j) =>
                (b.kind !== q.a || b.k !== bars[q.b] + j || b.k > bars[q.a] - 1) &&
                problems.push(`${tag}: block ${j}`),
            );
            if (!w.line || w.line.from !== q.b || w.line.to !== q.a || w.line.at !== bars[q.b])
              problems.push(`${tag}: line`);
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
    for (let seed = 1; seed <= 100; seed++)
      if (makeGraph(PLANS[2], new Rng(seed)).kinds.includes('bear')) bears++;
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

describe('Picture Graph level 8: Line them up', () => {
  const plan = PLANS[7];
  const VIEWS: [number, number][] = [
    [1024, 768],
    [1024, 1365],
    [1366, 1024],
    [1180, 820],
  ];

  it('appends level 8 after the first seven plans, which stay as they were', () => {
    expect(PLANS.slice(0, 8).map((p) => p.mode)).toEqual([
      'build',
      'most',
      'more',
      'read',
      'scale',
      'scaleread',
      'tally',
      'line',
    ]);
    expect(planFor(8)).toBe(plan);
    expect(lineKinds('prek')).toBe(2);
    expect(lineKinds('school')).toBe(3);
  });

  it('makes shores of real things with different counts, 2 to 6, that fit the tray', () => {
    for (const kinds of [2, 3]) {
      for (let seed = 1; seed <= 400; seed++) {
        const s = makeShore(plan, kinds, new Rng(seed));
        expect(s.kinds).toHaveLength(kinds);
        expect(new Set(s.kinds).size).toBe(kinds);
        for (const k of s.kinds) expect(THINGS).toContain(k);
        for (const n of s.counts)
          (expect(n).toBeGreaterThanOrEqual(2), expect(n).toBeLessThanOrEqual(plan.max));
        expect(new Set(s.counts).size).toBe(kinds);
      }
    }
    // Never litter: only things the sea leaves.
    expect([...THINGS].sort()).toEqual(['feather', 'shell', 'stick', 'stone']);
  });

  it('asks which row has the most at pre-K, then how many more at school, each with one answer', () => {
    for (let seed = 1; seed <= 300; seed++) {
      const two = makeShore(plan, 2, new Rng(seed));
      const q2 = lineQuestions(two, new Rng(seed));
      expect(q2.map((q) => q.ask)).toEqual(['most']);
      const three = makeShore(plan, 3, new Rng(seed));
      const q3 = lineQuestions(three, new Rng(seed));
      expect(q3.map((q) => q.ask)).toEqual(['most', 'more']);
      for (const q of [...q2, ...q3]) {
        const c = q2.includes(q) ? two.counts : three.counts;
        if (q.ask === 'most')
          (expect(c[q.answer]).toBe(Math.max(...c)),
            expect(c.filter((n) => n === c[q.answer])).toHaveLength(1));
        if (q.ask === 'more') {
          expect(q.answer).toBe(c[q.a] - c[q.b]);
          expect(q.answer).toBeGreaterThan(0);
          // The longer row's count is always offered: reading it instead of the difference is the slip.
          const ch = choicesFor(q.answer, new Rng(seed), 1, c[q.a]);
          (expect(ch).toContain(q.answer), expect(ch).toContain(c[q.a]), expect(new Set(ch).size).toBe(3));
          for (const n of ch) expect(n).toBeGreaterThanOrEqual(0);
        }
      }
    }
  });

  it('the hint joins the rows one to one and glows exactly the things nothing matches', () => {
    for (let seed = 1; seed <= 300; seed++) {
      const s = makeShore(plan, 3, new Rng(seed));
      for (const q of lineQuestions(s, new Rng(seed))) {
        const h = lineHint(q, s.counts);
        const top = q.ask === 'more' ? q.a : (q as { answer: number }).answer;
        for (const b of h.glow) (expect(b.row).toBe(top), expect(b.k).toBeLessThan(s.counts[top]));
        // Every link joins at least two rows that have a thing in that slot, and no glowing thing is linked.
        for (const l of h.links) {
          expect(l.rows.length).toBeGreaterThanOrEqual(2);
          for (const r of l.rows) expect(s.counts[r]).toBeGreaterThan(l.k);
          expect(h.glow.some((b) => b.k === l.k)).toBe(false);
        }
        if (q.ask === 'more')
          (expect(h.glow).toHaveLength(q.answer),
            expect(h.links.every((l) => l.rows.every((r) => r === q.a || r === q.b))).toBe(true));
        if (q.ask === 'most')
          expect(h.glow.length).toBe(s.counts[top] - Math.max(...s.counts.filter((_, i) => i !== top)));
      }
    }
  });

  it('lays every thing in a tap square of 100, none overlapping, clear of the corners and the tray, at four views', () => {
    for (const [w, h] of VIEWS) {
      for (const kinds of [2, 3]) {
        const t = trayLayout(w, h, kinds, plan.max);
        expect(t.left).toBeGreaterThanOrEqual(150);
        expect(t.right).toBeLessThanOrEqual(w - 20);
        expect(t.bottom).toBeLessThanOrEqual(h);
        expect(t.rowY(1) - t.rowY(0)).toBeGreaterThanOrEqual(100);
        expect(t.slotX(1) - t.slotX(0)).toBeGreaterThanOrEqual(100);
        expect(t.slotX(plan.max - 1) + THING_SIZE / 2).toBeLessThanOrEqual(t.right);
        for (let seed = 1; seed <= 200; seed++) {
          const s = makeShore(plan, kinds, new Rng(seed));
          const spots = shoreSpots(s, plan, w, h, new Rng(seed));
          expect(spots).toHaveLength(s.counts.reduce((a, n) => a + n, 0));
          for (let k = 0; k < s.kinds.length; k++)
            expect(spots.filter((p) => p.kind === k)).toHaveLength(s.counts[k]);
          for (const p of spots) {
            expect(p.y - THING_SIZE / 2).toBeGreaterThanOrEqual(110);
            expect(p.y + THING_SIZE / 2).toBeLessThanOrEqual(t.top);
            expect(p.x - THING_SIZE / 2).toBeGreaterThanOrEqual(90);
            expect(p.x + THING_SIZE / 2).toBeLessThanOrEqual(w - 90);
          }
          for (let i = 0; i < spots.length; i++)
            for (let j = i + 1; j < spots.length; j++) {
              const apart =
                Math.abs(spots[i].x - spots[j].x) >= THING_SIZE - 0.01 ||
                Math.abs(spots[i].y - spots[j].y) >= THING_SIZE - 0.01;
              expect(apart, `${w}x${h} seed ${seed}`).toBe(true);
            }
        }
      }
    }
  });

  it('the finger lines up every thing, then taps the most row and the right number', () => {
    for (let seed = 1; seed <= 100; seed++) {
      const s = makeShore(plan, 3, new Rng(seed));
      const placed = s.counts.flatMap((n) => Array.from({ length: n }, () => false));
      let taps = 0;
      for (let m = lineMove(placed, undefined); m; m = lineMove(placed, undefined)) {
        expect(m.do).toBe('thing');
        if (m.do === 'thing') placed[m.index] = true;
        taps++;
      }
      expect(taps).toBe(placed.length);
      const [most, more] = lineQuestions(s, new Rng(seed));
      expect(lineMove(placed, most)).toEqual({ do: 'row', row: (most as { answer: number }).answer });
      expect(lineMove(placed, more)).toEqual({ do: 'number', n: (more as { answer: number }).answer });
    }
  });
});

describe('Picture Graph level 9: A key of five', () => {
  const plan = PLANS[8];
  const VIEWS: [number, number][] = [
    [1024, 768],
    [1024, 1365],
    [1366, 1024],
    [1180, 820],
  ];

  it('appends level 9 after the first eight plans, which stay as they were', () => {
    expect(PLANS.slice(0, 9).map((p) => p.mode)).toEqual([
      'build',
      'most',
      'more',
      'read',
      'scale',
      'scaleread',
      'tally',
      'line',
      'fives',
    ]);
    expect(planFor(9)).toBe(plan);
    expect(plan.per).toBe(5);
    expect(prebuilt(plan)).toBe(false);
  });

  it('makes cards of 10 to 35 in whole fives, at most seven blocks, every kind different', () => {
    const seen = new Set<number>();
    for (let seed = 1; seed <= 500; seed++) {
      const g = makeGraph(plan, new Rng(seed));
      expect(g.kinds).toHaveLength(3);
      expect(new Set(g.counts).size).toBe(3);
      for (const n of g.counts) {
        expect(n % 5).toBe(0);
        expect(n).toBeGreaterThanOrEqual(10);
        expect(n).toBeLessThanOrEqual(35);
        seen.add(n);
      }
      expect(Math.max(...barsFor(plan, g))).toBeLessThanOrEqual(7);
    }
    expect(seen.size).toBe(6);
  });

  it('asks how many more in critters, offering the number of blocks and whole fives away', () => {
    for (let seed = 1; seed <= 300; seed++) {
      const rng = new Rng(seed);
      const g = makeGraph(plan, rng);
      const qs = questionsFor(plan, g, rng);
      expect(qs).toHaveLength(1);
      const q = qs[0] as Extract<Question, { ask: 'more' }>;
      expect(q.ask).toBe('more');
      expect(q.answer).toBe(g.counts[q.a] - g.counts[q.b]);
      expect(q.answer).toBeGreaterThan(0);
      const choices = choicesFor(q.answer, rng, plan.per, tallerCount(plan, g, q));
      expect(choices).toHaveLength(3);
      expect(new Set(choices).size).toBe(3);
      expect(choices).toContain(q.answer);
      expect(choices).toContain(q.answer / 5);
      for (const c of choices.filter((c) => c !== q.answer / 5)) expect(c % 5).toBe(0);
    }
  });

  it('the finger adds one block for each group of five, never one per mark, and answers in critters', () => {
    for (let seed = 1; seed <= 100; seed++) {
      const rng = new Rng(seed);
      const g = makeGraph(plan, rng);
      const bars = g.kinds.map(() => 0);
      let taps = 0;
      for (
        let m = graphMove(plan, g, bars, undefined, null);
        m && m.do === 'add';
        m = graphMove(plan, g, bars, undefined, null)
      ) {
        bars[m.kind]++;
        expect(bars[m.kind]).toBeLessThanOrEqual(g.counts[m.kind] / 5);
        taps++;
      }
      expect(graphMove(plan, g, bars, undefined, null)).toEqual({ do: 'check' });
      expect(bars).toEqual(barsFor(plan, g));
      expect(taps).toBe(g.counts.reduce((s, n) => s + n / 5, 0));
      const q = questionsFor(plan, g, rng)[0];
      expect(graphMove(plan, g, bars, q, null)).toEqual({
        do: 'number',
        n: (q as Extract<Question, { ask: 'more' }>).answer,
      });
    }
  });

  it('the hint for "how many more" glows the fives above the shorter bar', () => {
    const g = { kinds: KINDS.slice(0, 3), counts: [35, 10, 20] };
    const q: Question = { ask: 'more', a: 0, b: 1, answer: 25 };
    expect(whyBlocks(q, barsFor(plan, g)).blocks).toHaveLength(5);
  });

  it('lays the cards out with room for seven groups, clear of the key, the pads and the graph panel, at four views', () => {
    for (const [w, h] of VIEWS) {
      const c = cardLayout(w, h, plan.kinds, plan.max);
      expect(c.left).toBeGreaterThanOrEqual(88 + 62);
      expect(c.right).toBeLessThanOrEqual(w - 110 - 62);
      expect(c.top).toBeGreaterThanOrEqual(150);
      expect(c.bottom).toBeLessThanOrEqual(h - 412);
      expect(c.rowH).toBeGreaterThanOrEqual(56);
      expect(c.groupX(plan.max - 1) + CARD_GROUP_W / 2).toBeLessThanOrEqual(c.right);
      expect(c.rowY(plan.kinds - 1) + c.rowH / 2).toBeLessThanOrEqual(c.bottom);
    }
  });
});

describe('Picture Graph level 10, Two pictures, one meadow', () => {
  const plan = planFor(10);
  const same = (a: number[], b: number[]) => a.length === b.length && a.every((x, i) => x === b[i]);

  it('is the pair level, keyed by two, after the key of five', () => {
    expect(plan.mode).toBe('pair');
    expect(plan.per).toBe(2);
    expect(PLANS.slice(0, 9).map((p) => p.mode)).toEqual([
      'build',
      'most',
      'more',
      'read',
      'scale',
      'scaleread',
      'tally',
      'line',
      'fives',
    ]);
  });

  it('shows the card on exactly two graphs, the plain one and the keyed one; the trap is as tall as the keyed one', () => {
    for (let seed = 1; seed <= 400; seed++) {
      const r = makePairRound(plan, new Rng(seed));
      const label = `seed ${seed}`;
      expect(
        r.card.counts.every((n) => n % 2 === 0 && n >= 2 && n <= 8),
        label,
      ).toBe(true);
      expect(new Set(r.card.counts).size, label).toBe(r.card.counts.length);
      expect(r.graphs).toHaveLength(3);
      const keyed = r.graphs[r.keyed];
      const trap = r.graphs[r.trap];
      expect(keyed.per, label).toBe(2);
      expect(trap.per, label).toBe(1);
      expect(trap.bars, label).toEqual(keyed.bars);
      expect(critters(keyed), label).toEqual(r.card.counts);
      // Exactly one pair of graphs shows the card's critters, and it is the answer.
      const matching = [0, 1, 2].filter((i) => same(critters(r.graphs[i]), r.card.counts));
      expect(matching, label).toEqual(r.answer);
      expect(r.answer, label).toContain(r.keyed);
      expect(r.answer, label).not.toContain(r.trap);
      // Every bar fits the grid.
      for (const g of r.graphs) expect(Math.max(...g.bars), label).toBeLessThanOrEqual(PAIR_ROWS);
    }
  });

  it('puts the right pair in every position over the seeds, so where a graph stands never gives it away', () => {
    const seen = new Set<string>();
    for (let seed = 1; seed <= 200; seed++) seen.add(String(makePairRound(plan, new Rng(seed)).trap));
    expect(seen).toEqual(new Set(['0', '1', '2']));
  });

  it('gives the keyed graph with the trap its own line, and any other wrong pair the look line', () => {
    for (let seed = 1; seed <= 100; seed++) {
      const r = makePairRound(plan, new Rng(seed));
      const plain = r.answer.find((i) => i !== r.keyed)!;
      expect(pairWhy(r, r.keyed, r.trap)).toBe('key');
      expect(pairWhy(r, r.trap, r.keyed)).toBe('key');
      expect(pairWhy(r, plain, r.trap)).toBe('look');
      expect(sameTap(r.trap, r.keyed, r.answer).result).toBe('wrong');
      expect(sameTap(r.trap, plain, r.answer).result).toBe('wrong');
    }
  });

  it('the ghost finger taps the right pair, and lowers a wrong first pick', () => {
    for (let seed = 1; seed <= 200; seed++) {
      const r = makePairRound(plan, new Rng(seed));
      const a = pairMove(r, null);
      const lift = sameTap(null, a, r.answer);
      expect(lift.result).toBe('lift');
      expect(sameTap(lift.first, pairMove(r, lift.first), r.answer).result).toBe('right');
      expect(sameTap(r.trap, pairMove(r, r.trap), r.answer).result).toBe('lower');
    }
  });

  it('lays out the card and three graphs at least 100 wide, clear of the pet and corner buttons, inside every view', () => {
    for (const [w, h] of [
      [1024, 768],
      [1366, 1024],
      [1600, 768],
      [1024, 1365],
    ] as [number, number][]) {
      const t = pairLayout(w, h, plan.kinds);
      const label = `${w}x${h}`;
      expect(t.card.top, label).toBeGreaterThanOrEqual(150);
      expect(t.top, label).toBeGreaterThan(t.card.bottom);
      expect(t.bottom, label).toBeLessThanOrEqual(h - 20);
      expect(t.gw, label).toBeGreaterThanOrEqual(100);
      expect(t.graphX(0) - t.gw / 2, label).toBeGreaterThanOrEqual(160);
      expect(t.graphX(2) + t.gw / 2, label).toBeLessThanOrEqual(w - 20);
      expect(t.graphX(1) - t.gw / 2, label).toBeGreaterThan(t.graphX(0) + t.gw / 2);
      expect(t.blockH, label).toBeGreaterThanOrEqual(24);
      // The tallest plain bar stays under the key strip.
      expect(t.base - PAIR_ROWS * t.blockH, label).toBeGreaterThanOrEqual(t.top + 50);
    }
  });
});

describe('Picture Graph level 11, What the graph can say', () => {
  const plan = planFor(11);

  it('is the claim level: a finished graph of three kinds, all different, after Two pictures', () => {
    expect(plan.mode).toBe('claim');
    expect(prebuilt(plan)).toBe(true);
    expect(ownScene(plan)).toBe(false);
    expect(PLANS[9].mode).toBe('pair');
    expect(PLANS).toHaveLength(11);
  });

  it("gives each graph one yes, one no and one can't-say claim, each decided by the bars alone", () => {
    for (let seed = 1; seed <= 500; seed++) {
      const rng = new Rng(seed);
      const g = makeGraph(plan, rng);
      const label = `seed ${seed} counts ${g.counts}`;
      expect(new Set(g.counts).size, label).toBe(3);
      const qs = questionsFor(plan, g, rng);
      expect(qs, label).toHaveLength(3);
      const claims = qs.map((q) => (q.ask === 'claim' ? q.claim : null));
      expect(claims.every(Boolean), label).toBe(true);
      expect(claims.map((c) => c!.answer).sort(), label).toEqual(['cant', 'no', 'yes']);
      // One "more ... than" and one "the most": never one claim read backwards.
      expect(
        claims
          .filter((c) => c!.say !== 'cant')
          .map((c) => c!.say)
          .sort(),
        label,
      ).toEqual(['more', 'most']);
      for (const c of claims) {
        expect(claimTruth(g.counts, c!), label).toBe(c!.answer);
        if (c!.say === 'more') expect(c!.a, label).not.toBe(c!.b);
        if (c!.say === 'cant') {
          expect(CANT_SAY, label).toContain(c!.about);
          // About the tallest bar: the tempting yes, when "most" is not what the claim is about.
          expect(g.counts[c!.a], label).toBe(Math.max(...g.counts));
        }
      }
    }
  });

  it('puts each kind of claim first, second and third over the seeds, so the order never gives the answer away', () => {
    const seen = new Set<string>();
    for (let seed = 1; seed <= 200; seed++) {
      const rng = new Rng(seed);
      claimsFor(makeGraph(plan, rng), rng).forEach((c, i) => seen.add(`${c.answer}${i}`));
    }
    expect(seen.size).toBe(9);
    const abouts = new Set<string>();
    for (let seed = 1; seed <= 200; seed++) {
      const rng = new Rng(seed);
      for (const c of claimsFor(makeGraph(plan, rng), rng)) if (c.say === 'cant') abouts.add(c.about);
    }
    expect([...abouts].sort()).toEqual([...CANT_SAY].sort());
  });

  it('answers a wrong stamp with the line that helps, and lights the bars the claim names', () => {
    const more = { say: 'more', a: 0, b: 2, answer: 'yes' } as const;
    const most = { say: 'most', a: 1, answer: 'no' } as const;
    const cant = { say: 'cant', a: 2, about: 'first', answer: 'cant' } as const;
    expect(stampWhy(more, 'yes')).toBe('right');
    expect(stampWhy(more, 'no')).toBe('look');
    expect(stampWhy(more, 'cant')).toBe('can');
    expect(stampWhy(most, 'yes')).toBe('look');
    expect(stampWhy(cant, 'yes')).toBe('cant');
    expect(stampWhy(cant, 'no')).toBe('cant');
    expect(stampWhy(cant, 'cant')).toBe('right');
    expect(claimBars(more, 3)).toEqual([0, 2]);
    expect(claimBars(most, 3)).toEqual([0, 1, 2]);
    expect(claimBars(cant, 3)).toEqual([2]);
  });

  it('the ghost finger stamps the right answer', () => {
    for (let seed = 1; seed <= 100; seed++) {
      const rng = new Rng(seed);
      const g = makeGraph(plan, rng);
      for (const q of questionsFor(plan, g, rng)) {
        if (q.ask !== 'claim') throw new Error('claim level asks only claims');
        expect(graphMove(plan, g, barsFor(plan, g), q, null)).toEqual({
          do: 'stamp',
          stamp: claimTruth(g.counts, q.claim),
        });
      }
    }
  });

  it('lays out three whole stamps and the claim card clear of the graph, the pet and the corner buttons', () => {
    // The graph (as the game draws it): three columns 130 apart around w / 2 - 60, its panel from h - 412 to h - 30.
    for (const [w, h] of [
      [1024, 768],
      [1366, 1024],
      [1600, 768],
      [768, 1024],
      [1024, 1365],
    ] as [number, number][]) {
      const t = claimLayout(w, h);
      const label = `${w}x${h}`;
      const graphRight = w / 2 - 60 + 130 + 55 + 30;
      const graphTop = h - 412;
      expect(2 * STAMP_R, label).toBeGreaterThanOrEqual(100);
      STAMPS.forEach((_, i) => {
        const s = t.stamp(i);
        expect(s.y - STAMP_R, label).toBeGreaterThanOrEqual(140);
        expect(s.y + STAMP_R, label).toBeLessThanOrEqual(h - 20);
        expect(s.x + STAMP_R, label).toBeLessThanOrEqual(w - 20);
        expect(s.x - STAMP_R, label).toBeGreaterThan(graphRight);
        if (i) expect(s.y - t.stamp(i - 1).y, label).toBeGreaterThanOrEqual(2 * STAMP_R + 14);
      });
      expect(t.card.y - t.card.h / 2, label).toBeGreaterThanOrEqual(140);
      expect(t.card.y + t.card.h / 2, label).toBeLessThanOrEqual(graphTop);
      expect(t.card.x - t.card.w / 2, label).toBeGreaterThanOrEqual(100);
      expect(t.card.x + t.card.w / 2, label).toBeLessThan(t.stamp(0).x - STAMP_R);
    }
  });
});
