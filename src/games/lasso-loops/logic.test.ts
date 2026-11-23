import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import { rangeFor } from '../../progress/difficulty';
import {
  choices,
  compareGuess,
  demoLoop,
  guessCards,
  hasLeaf,
  gridFor,
  inside,
  LEVELS,
  MAKE_JARS,
  MAKE_MAX,
  MAKE_MIN,
  MEADOW_MAX,
  makeCountLine,
  makeHint,
  makeLoop,
  makeNext,
  makeRound,
  makeTotal,
  nearestGroup,
  planFor,
  PLANS,
  rangeCards,
  rangeSide,
  scatter,
  SHIFT_PEAK_MAX,
  shiftHint,
  shiftMistake,
  shiftTarget,
  shiftTargets,
  type MakeState,
} from './logic';
import { VOICE } from './voice';

describe('Lasso Loops', () => {
  it('has enough fireflies for every jar, and a question whose answer is what was caught', () => {
    for (const plan of PLANS)
      for (let seed = 1; seed <= 300; seed++) {
        const r = makeRound(plan, new Rng(seed));
        const wanted = r.jars.reduce((s, n) => s + n, 0);
        // Level 8's three jars are room, not an order: its own test below.
        if (plan.mode !== 'make') expect(r.fireflies).toBeGreaterThanOrEqual(wanted);
        switch (plan.mode) {
          case 'free':
            expect(r.fireflies >= 6 && r.fireflies <= 9).toBe(true);
            expect(r.jars).toEqual([0, 0, 0, 0, 0, 0]);
            break;
          case 'exact':
            expect(r.jars.every((n) => n === 2 || n === 3)).toBe(true);
            expect(r.fireflies).toBeGreaterThan(wanted);
            break;
          case 'fives':
            expect(r.jars.every((n) => n === 5)).toBe(true);
            expect(r.answer).toBe(r.fireflies);
            expect(r.ones).toBe(r.fireflies - wanted);
            expect(r.jars.length >= 1 && r.jars.length <= 3).toBe(true);
            expect(r.ones >= 0 && r.ones <= 4).toBe(true);
            // An even round is 10 or 15, never a lone jar of 5.
            if (r.ones === 0) expect([10, 15]).toContain(r.answer);
            break;
          case 'tens':
            expect(r.jars.every((n) => n === 10)).toBe(true);
            expect(r.answer).toBe(10 * r.jars.length + r.ones);
            expect(r.ones).toBe(r.fireflies - wanted);
            expect(r.ones >= 0 && r.ones <= 9).toBe(true);
            if (plan.guess || plan.range) expect(r.ones >= 1 && r.jars.length >= 2).toBe(true);
            if (r.ones === 0) expect([20, 30]).toContain(r.answer);
            break;
          case 'groups':
            expect(r.answer).toBe(r.group!.count * r.group!.size);
            expect(r.jars).toEqual(Array(r.group!.count).fill(r.group!.size));
            // A few extras, so the last group still takes counting.
            expect(r.fireflies - wanted).toBeGreaterThanOrEqual(2);
            break;
        }
        if (r.answer !== null) {
          const c = choices(r, new Rng(seed));
          expect(c).toHaveLength(3);
          expect(c).toContain(r.answer);
          expect(new Set(c).size).toBe(3);
          for (const v of c) expect(v).toBeGreaterThan(0);
        }
      }
  });

  it('keeps estimation on its own 21–39 tens round, drawn exactly as before', () => {
    expect(PLANS.map((p) => p.mode)).toEqual([
      'free',
      'exact',
      'fives',
      'tens',
      'groups',
      'tens',
      'tens',
      'make',
      'make',
    ]);
    expect(PLANS[5].guess).toBe(true);
    expect(PLANS.slice(0, 5).every((p) => !p.guess)).toBe(true);
    expect(PLANS[6].range).toBe(true);
    expect(PLANS[6].guess).toBeUndefined();
    expect(PLANS.slice(0, 6).every((p) => !p.range)).toBe(true);
    for (const plan of [PLANS[5], PLANS[6]])
      for (let seed = 1; seed <= 300; seed++) {
        const a = new Rng(seed),
          b = new Rng(seed);
        const round = makeRound(plan, a);
        // The level-6 draw before teens and decades came to level 4.
        const tens = b.int(2, 3);
        const ones = b.int(1, 9);
        expect(round).toEqual({
          fireflies: 10 * tens + ones,
          jars: Array(tens).fill(10),
          answer: 10 * tens + ones,
          ones,
        });
        expect(choices(round, a)).toEqual(choices(round, b));
        expect(round.fireflies).toBeGreaterThanOrEqual(21);
        expect(round.fireflies).toBeLessThanOrEqual(39);
      }
  });

  it('mixes teens, decades and 21–39 at level 4, and even rounds at level 3', () => {
    const kinds = new Set<string>();
    for (let seed = 1; seed <= 300; seed++) {
      const r = makeRound(PLANS[3], new Rng(seed));
      kinds.add(r.jars.length === 1 ? 'teen' : r.ones === 0 ? 'decade' : 'mixed');
      if (r.jars.length === 1) expect(r.answer! >= 11 && r.answer! <= 19).toBe(true);
    }
    expect([...kinds].sort()).toEqual(['decade', 'mixed', 'teen']);
    const answers = new Set<number>();
    let even = 0;
    for (let seed = 1; seed <= 300; seed++) {
      const r = makeRound(PLANS[2], new Rng(seed));
      answers.add(r.answer!);
      if (r.ones === 0) even++;
    }
    for (const n of [6, 9, 10, 15, 19]) expect(answers).toContain(n);
    expect(even).toBeGreaterThan(15);
    expect(even).toBeLessThan(90);
    const flies = new Set<number>();
    for (let seed = 1; seed <= 100; seed++) flies.add(makeRound(PLANS[0], new Rng(seed)).fireflies);
    expect([...flies].sort()).toEqual([6, 7, 8, 9]);
  });

  it('never offers a swap that is not there: no 60 for 6, no 2 for 20', () => {
    for (const plan of [PLANS[2], PLANS[3]])
      for (let seed = 1; seed <= 300; seed++) {
        const r = makeRound(plan, new Rng(seed));
        const c = choices(r, new Rng(seed + 7));
        const n = r.answer!;
        for (const v of c)
          if (v !== n) {
            const near = [n + 10, n - 10, n + 1, n - 1];
            if (n >= 10 && n % 10 > 0) near.push((n % 10) * 10 + Math.floor(n / 10));
            expect(near, `${plan.name}, ${n}`).toContain(v);
          }
      }
  });

  it('offers one nearby ten and two widely separated estimates, without a fixed near-card position', () => {
    const positions = new Set<number>();
    for (let n = 21; n <= 39; n++)
      for (let seed = 1; seed <= 50; seed++) {
        const { cards, near } = guessCards(n, new Rng(seed));
        expect(cards).toHaveLength(3);
        expect(new Set(cards).size).toBe(3);
        expect(cards).toEqual([...cards].sort((a, b) => a - b));
        expect(Math.abs(near - n)).toBeLessThanOrEqual(5);
        expect(cards.filter((v) => Math.abs(v - n) < 10)).toEqual([near]);
        positions.add(cards.indexOf(near));
        for (const v of cards) {
          expect(v % 10).toBe(0);
          expect(v >= 10 && v <= 90).toBe(true);
          if (v !== near) expect(v <= n / 2 || v >= 2 * n).toBe(true);
          expect(compareGuess(v, n)).toBe(v === near ? 'close' : v < n ? 'more' : 'fewer');
        }
      }
    expect([...positions].sort()).toEqual([0, 1]);
    expect(compareGuess(20, 30)).toBe('more');
    expect(compareGuess(40, 30)).toBe('fewer');
    expect(compareGuess(21, 30)).toBe('close');
  });

  it('puts school at 3–9 and leaves the younger bands alone', () => {
    expect(rangeFor(LEVELS, 'school')).toEqual({ min: 3, max: 9 });
    expect(rangeFor(LEVELS, 'preschool')).toEqual({ min: 1, max: 3 });
    expect(rangeFor(LEVELS, 'prek')).toEqual({ min: 2, max: 4 });
  });

  it('offers five range cards with exactly one that could be right, and both sides ruled out', () => {
    const positions = new Set<number>();
    for (let n = 21; n <= 39; n++) {
      // The shelf rule is true: more than one jar of ten and at most four jars.
      expect(n > 10 && n <= 40).toBe(true);
      for (let seed = 1; seed <= 50; seed++) {
        const { cards, possible } = rangeCards(n, new Rng(seed));
        expect(cards).toHaveLength(5);
        expect(new Set(cards).size).toBe(5);
        expect(cards).toEqual([...cards].sort((a, b) => a - b));
        expect(cards.filter((g) => rangeSide(g) === 'possible')).toEqual([possible]);
        expect(possible).toBe(10 * Math.floor((n + 5) / 10));
        expect(Math.abs(possible - n)).toBeLessThanOrEqual(5);
        const few = cards.filter((g) => rangeSide(g) === 'few');
        const many = cards.filter((g) => rangeSide(g) === 'many');
        expect(few.length).toBeGreaterThanOrEqual(1);
        expect(many.length).toBeGreaterThanOrEqual(1);
        for (const g of few) expect([5, 10]).toContain(g);
        for (const g of many) expect([50, 60, 70, 80, 90]).toContain(g);
        // A card ruled out is never the count's own ten.
        for (const g of [...few, ...many]) expect(Math.abs(g - n)).toBeGreaterThan(5);
        positions.add(cards.indexOf(possible));
      }
    }
    expect([...positions].sort()).toEqual([1, 2]);
    expect([10, 11, 40, 41].map(rangeSide)).toEqual(['few', 'possible', 'possible', 'many']);
  });

  it('offers the swapped tens and ones as a choice when they differ', () => {
    let swapped = 0;
    for (let seed = 1; seed <= 200; seed++) {
      const r = makeRound(PLANS[5], new Rng(seed));
      const c = choices(r, new Rng(seed + 1000));
      const tens = Math.floor(r.answer! / 10);
      if (c.includes(r.ones * 10 + tens)) swapped++;
    }
    expect(swapped).toBeGreaterThan(40);
  });

  it('spreads fireflies one to a cell, inside the area', () => {
    const counts = new Set<number>();
    for (const plan of PLANS)
      for (let seed = 1; seed <= 300; seed++) counts.add(makeRound(plan, new Rng(seed)).fireflies);
    expect(Math.max(...counts)).toBeLessThanOrEqual(39);
    for (const n of counts)
      for (let seed = 1; seed <= 50; seed++) {
        const { cols, rows } = gridFor(n);
        expect(cols * rows).toBeGreaterThanOrEqual(n);
        const pts = scatter(n, new Rng(seed), cols, rows);
        expect(pts).toHaveLength(n);
        for (const p of pts) expect(p.x > 0 && p.x < 1 && p.y > 0 && p.y < 1).toBe(true);
        // Neighbors keep at least a little room between them for a loop to pass.
        for (let i = 0; i < n; i++)
          for (let j = i + 1; j < n; j++)
            expect(Math.hypot((pts[i].x - pts[j].x) * cols, (pts[i].y - pts[j].y) * rows)).toBeGreaterThan(
              0.5,
            );
      }
  });

  it('knows what a loop goes around, even a bent one', () => {
    const square = [
      { x: 0, y: 0 },
      { x: 10, y: 0 },
      { x: 10, y: 10 },
      { x: 0, y: 10 },
    ];
    expect(inside(square, { x: 5, y: 5 })).toBe(true);
    expect(inside(square, { x: 15, y: 5 })).toBe(false);
    // A "C" shape: its open middle is outside.
    const c = [
      { x: 0, y: 0 },
      { x: 10, y: 0 },
      { x: 10, y: 3 },
      { x: 3, y: 3 },
      { x: 3, y: 7 },
      { x: 10, y: 7 },
      { x: 10, y: 10 },
      { x: 0, y: 10 },
    ];
    expect(inside(c, { x: 1, y: 5 })).toBe(true);
    expect(inside(c, { x: 7, y: 5 })).toBe(false);
  });

  it('picks a close group of free fireflies for the hint', () => {
    const pts = scatter(12, new Rng(3), 6, 3);
    const free = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
    const g = nearestGroup(pts, free, 4);
    expect(g).toHaveLength(4);
    expect(new Set(g).size).toBe(4);
    for (const i of g) expect(free).toContain(i);
    expect(nearestGroup(pts, [1, 2], 3)).toEqual([]);
  });

  it("gives the demonstration a loop around exactly each jar's requested group", () => {
    for (const plan of PLANS)
      for (let seed = 1; seed <= 100; seed++) {
        const round = makeRound(plan, new Rng(seed));
        const grid = gridFor(round.fireflies);
        let points = scatter(round.fireflies, new Rng(seed + 1000), grid.cols, grid.rows).map((p) => ({
          x: p.x * 800,
          y: p.y * 420,
        }));
        if (plan.mode === 'make') {
          // The ghost finger: tens, then the ones, until the number is made.
          let state: MakeState = { jars: 0, leaf: 0 };
          for (let want = makeNext(round.target!, state); want; want = makeNext(round.target!, state)) {
            const move = demoLoop(points, want, 34);
            expect(move, `${plan.name}, seed ${seed}, loop of ${want}`).not.toBeNull();
            expect(move!.indices).toHaveLength(want);
            points = points.filter((_, i) => !move!.indices.includes(i));
            const step = makeLoop(state, want);
            if (!('next' in step)) throw new Error(`the bot's loop was let go`);
            state = step.next;
          }
          expect(makeTotal(state)).toBe(round.target);
          continue;
        }
        for (let jar = 0; jar < round.jars.length; jar++) {
          const want =
            plan.mode === 'free' ? Math.ceil(points.length / (round.jars.length - jar)) : round.jars[jar];
          const move = demoLoop(points, want, 34);
          expect(move, `${plan.name}, seed ${seed}, jar ${jar}`).not.toBeNull();
          const got = points.map((p, i) => (inside(move!.loop, p) ? i : -1)).filter((i) => i >= 0);
          expect(got).toEqual(move!.indices);
          expect(got).toHaveLength(want);
          points = points.filter((_, i) => !got.includes(i));
        }
      }
  });

  describe('level 8, Make the number', () => {
    const plan = planFor(8);

    it('has every target 13–36 and a meadow of at least three more, never over 39', () => {
      expect(plan.mode).toBe('make');
      expect(plan.shift).toBeUndefined();
      const seen = new Set<number>();
      for (let seed = 1; seed <= 3000; seed++) {
        const r = makeRound(plan, new Rng(seed));
        seen.add(r.target!);
        expect(r.target! >= MAKE_MIN && r.target! <= MAKE_MAX).toBe(true);
        expect(r.fireflies).toBeGreaterThanOrEqual(r.target! + 3);
        expect(r.fireflies).toBeLessThanOrEqual(MEADOW_MAX);
        expect(r.jars).toEqual(Array(MAKE_JARS).fill(10));
        expect(r.answer).toBeNull();
      }
      expect([...seen].sort((a, b) => a - b)).toEqual(
        Array.from({ length: MAKE_MAX - MAKE_MIN + 1 }, (_, i) => MAKE_MIN + i),
      );
    });

    it('lets go a loop of more than ten, fills a jar with ten and rests fewer on the leaf', () => {
      expect(makeLoop({ jars: 0, leaf: 0 }, 11)).toEqual({ kind: 'over' });
      expect(makeLoop({ jars: 1, leaf: 4 }, 10)).toEqual({ kind: 'jar', next: { jars: 2, leaf: 4 } });
      expect(makeLoop({ jars: 1, leaf: 4 }, 5)).toEqual({ kind: 'leaf', next: { jars: 1, leaf: 9 } });
      // Thirteen ones, caught as 9 and 4: ten of them regroup into a jar and three stay.
      expect(makeLoop({ jars: 0, leaf: 9 }, 4)).toEqual({ kind: 'regroup', next: { jars: 1, leaf: 3 } });
      expect(makeLoop({ jars: 0, leaf: 4 }, 6)).toEqual({ kind: 'regroup', next: { jars: 1, leaf: 0 } });
    });

    it('accepts every sequence of loops that catches the target, and three jars are always enough', () => {
      for (let seed = 1; seed <= 400; seed++) {
        const rng = new Rng(seed);
        const r = makeRound(plan, rng);
        // Random loops of 1–12 from the free fireflies, never past the target, until it is caught.
        let state: MakeState = { jars: 0, leaf: 0 };
        let caught = 0;
        while (caught < r.target!) {
          const got = Math.min(rng.int(1, 12), r.fireflies - caught);
          const step = makeLoop(state, got);
          if (got > 10) {
            expect(step.kind).toBe('over');
            continue;
          }
          if (caught + got > r.target!) continue;
          // No loop of ten or fewer is ever refused for want of a jar.
          if (!('next' in step)) throw new Error(`refused ${got} at ${caught}`);
          // A regroup moves exactly ten from the leaf to a jar.
          if (step.kind === 'regroup')
            expect(step.next).toEqual({ jars: state.jars + 1, leaf: state.leaf + got - 10 });
          state = step.next;
          caught += got;
          expect(makeTotal(state)).toBe(caught);
          expect(state.leaf).toBeLessThan(10);
          expect(state.jars).toBeLessThanOrEqual(MAKE_JARS);
        }
        // However it was caught, what the tick sees is the number's tens and ones.
        expect(state).toEqual({ jars: Math.floor(r.target! / 10), leaf: r.target! % 10 });
      }
      // The whole meadow, one firefly at a time, still fits: 39 is three jars and nine.
      let state: MakeState = { jars: 0, leaf: 0 };
      for (let k = 0; k < MEADOW_MAX; k++) {
        const step = makeLoop(state, 1);
        if (!('next' in step)) throw new Error(`refused at ${k}`);
        state = step.next;
      }
      expect(state).toEqual({ jars: 3, leaf: 9 });
    });

    it('gives a hint that can always be followed and ends at the number', () => {
      for (let seed = 1; seed <= 300; seed++) {
        const r = makeRound(plan, new Rng(seed));
        const n = r.target!;
        for (let jars = 0; jars <= MAKE_JARS; jars++)
          for (let leaf = 0; leaf <= 9; leaf++) {
            let state: MakeState = { jars, leaf };
            if (makeTotal(state) > r.fireflies) continue;
            if (makeTotal(state) === n) {
              expect(makeHint(n, state)).toBeNull();
              continue;
            }
            let steps = 0;
            for (let hint = makeHint(n, state); hint; hint = makeHint(n, state)) {
              expect(++steps).toBeLessThanOrEqual(4);
              const free = r.fireflies - makeTotal(state);
              if (hint.part === 'jar-add') {
                // Ten free fireflies and an empty jar are there to follow it.
                expect(free).toBeGreaterThanOrEqual(10);
                expect(makeLoop(state, 10).kind).toBe('jar');
                state = { jars: state.jars + 1, leaf: state.leaf };
              } else if (hint.part === 'more') {
                expect(hint.d >= 1 && hint.d <= 9 && hint.d <= free).toBe(true);
                const step = makeLoop(state, hint.d);
                if (!('next' in step)) throw new Error('the hinted loop was let go');
                state = step.next;
              } else if (hint.part === 'jar-remove') {
                expect(state.jars).toBeGreaterThan(0);
                state = { jars: state.jars - 1, leaf: state.leaf };
              } else {
                expect(state.leaf).toBeGreaterThan(0);
                state = { jars: state.jars, leaf: 0 };
              }
            }
            expect(makeTotal(state)).toBe(n);
          }
      }
    });

    it('counts a wrong tick aloud with a line that fits the jars and the leaf, and has every line it says', () => {
      expect(makeCountLine({ jars: 0, leaf: 0 })).toBe('none');
      expect(makeCountLine({ jars: 0, leaf: 7 })).toBe('ones');
      expect(makeCountLine({ jars: 1, leaf: 0 })).toBe('jar');
      expect(makeCountLine({ jars: 1, leaf: 5 })).toBe('teen');
      expect(makeCountLine({ jars: 2, leaf: 0 })).toBe('tens');
      expect(makeCountLine({ jars: 2, leaf: 5 })).toBe('both');
      const lines = VOICE as Record<string, string[]>;
      for (const k of ['none', 'ones', 'jar', 'teen', 'tens', 'both'])
        expect(lines[`lasso.make-count-${k}`]).toBeDefined();
      for (const k of ['jar-add', 'more', 'jar-remove', 'leaf-remove'])
        expect(lines[`lasso.make-hint-${k}`]).toBeDefined();
      for (const k of ['tens', 'teen', 'both']) expect(lines[`lasso.make-right-${k}`]).toBeDefined();
      // No line says "1 jars": the one-jar forms are their own lines.
      expect(lines['lasso.make-count-teen'][0]).toMatch(/^One jar/);
      expect(lines['lasso.make-count-jar'][0]).toMatch(/^One jar/);
    });
  });

  describe('level 9, Ten more, ten less', () => {
    const plan = planFor(9);
    const rounds = Array.from({ length: 3000 }, (_, i) => makeRound(plan, new Rng(i + 1)));

    it('is the top level: the jars start full, and ten more and ten less come once each in seeded order', () => {
      expect(plan.mode).toBe('make');
      expect(plan.shift).toBe(true);
      expect(PLANS).toHaveLength(9);
      const orders = new Set<string>();
      const starts = new Set<number>();
      for (const r of rounds) {
        const start = makeTotal(r.start!);
        const [first, second] = shiftTargets(r);
        orders.add(r.asks!.join());
        starts.add(start);
        expect([...r.asks!].sort()).toEqual(['less', 'more']);
        expect(first).toBe(shiftTarget(start, r.asks![0]));
        expect(r.target).toBe(first);
        // The second ask undoes the first: the round ends on the number it began with.
        expect(second).toBe(start);
        for (const n of [start, first]) {
          expect(n >= 11 && n <= 39).toBe(true);
          expect(Math.floor(n / 10)).toBeLessThanOrEqual(MAKE_JARS);
        }
        // There are ones on the leaf to leave alone, and the leaf never starts full.
        expect(r.start!.leaf >= 1 && r.start!.leaf <= 9).toBe(true);
        // The meadow holds every firefly of the larger number and at least three more, never over 39.
        const peak = Math.max(start, first);
        expect(peak).toBeLessThanOrEqual(SHIFT_PEAK_MAX);
        expect(r.fireflies).toBeGreaterThanOrEqual(peak + 3);
        expect(r.fireflies).toBeLessThanOrEqual(MEADOW_MAX);
        expect(r.jars).toEqual(Array(MAKE_JARS).fill(10));
        expect(hasLeaf(r)).toBe(true);
      }
      expect([...orders].sort()).toEqual(['less,more', 'more,less']);
      // Ten more first starts at 11–26, ten less first at 21–36.
      expect(Math.min(...starts)).toBe(11);
      expect(Math.max(...starts)).toBe(36);
    });

    it('never passes a change to the ones alone: only a whole jar in or out makes the number', () => {
      for (const r of rounds.slice(0, 300)) {
        let from = r.start!;
        for (const [i, target] of shiftTargets(r).entries()) {
          const passing: MakeState[] = [];
          for (let jars = 0; jars <= MAKE_JARS; jars++)
            for (let leaf = 0; leaf <= 9; leaf++) {
              const s = { jars, leaf };
              if (makeTotal(s) === target) passing.push(s);
              else if (jars === from.jars && leaf !== from.leaf) expect(shiftMistake(from, s)).toBe('ones');
              else expect(shiftMistake(from, s)).toBe('jar');
            }
          const to = { jars: from.jars + (r.asks![i] === 'more' ? 1 : -1), leaf: from.leaf };
          expect(passing).toEqual([to]);
          from = to;
        }
      }
    });

    it('gives a hint that can always be followed, moves one jar from the start and ends at the number', () => {
      for (const r of rounds.slice(0, 300)) {
        let from = r.start!;
        for (const target of shiftTargets(r)) {
          // From what is held when the ask is made, the hint (and the ghost finger) moves one jar and is done.
          const first = shiftHint(target, from)!;
          expect(first.part).toBe(target > makeTotal(from) ? 'jar-add' : 'jar-remove');
          for (let jars = 0; jars <= MAKE_JARS; jars++)
            for (let leaf = 0; leaf <= 9; leaf++) {
              let state: MakeState = { jars, leaf };
              if (makeTotal(state) > r.fireflies) continue;
              let steps = 0;
              for (let hint = shiftHint(target, state); hint; hint = shiftHint(target, state)) {
                expect(++steps).toBeLessThanOrEqual(5);
                const free = r.fireflies - makeTotal(state);
                if (hint.part === 'jar-add') {
                  expect(free).toBeGreaterThanOrEqual(10);
                  expect(makeLoop(state, 10).kind).toBe('jar');
                  state = { jars: state.jars + 1, leaf: state.leaf };
                } else if (hint.part === 'ones') {
                  // The loop rests on the leaf (no regroup) and leaves it holding the number's ones.
                  expect(hint.d >= 1 && hint.d <= free).toBe(true);
                  expect(makeLoop(state, hint.d)).toEqual({
                    kind: 'leaf',
                    next: { jars: state.jars, leaf: hint.r },
                  });
                  state = { jars: state.jars, leaf: hint.r };
                } else if (hint.part === 'jar-remove') {
                  expect(state.jars).toBeGreaterThan(0);
                  state = { jars: state.jars - 1, leaf: state.leaf };
                } else {
                  expect(state.leaf).toBeGreaterThan(0);
                  state = { jars: state.jars, leaf: 0 };
                }
              }
              expect(makeTotal(state)).toBe(target);
            }
          from = { jars: Math.floor(target / 10), leaf: target % 10 };
        }
      }
    });

    it('has every line it says, one each way', () => {
      const lines = VOICE as Record<string, string[]>;
      for (const ask of ['more', 'less'])
        for (const k of ['', 'ones-', 'jar-', 'right-'])
          expect(lines[`lasso.shift-${k}${ask}`]).toBeDefined();
      for (const k of ['ones', 'leaf-remove']) expect(lines[`lasso.shift-hint-${k}`]).toBeDefined();
      expect(lines['lasso.shift-ones-more'][0]).toMatch(/whole jar/);
    });
  });
});
