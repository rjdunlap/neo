import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import {
  choices,
  compareGuess,
  demoLoop,
  guessCards,
  gridFor,
  inside,
  makeRound,
  nearestGroup,
  PLANS,
  scatter,
} from './logic';

describe('Lasso Loops', () => {
  it('has enough fireflies for every jar, and a question whose answer is what was caught', () => {
    for (const plan of PLANS)
      for (let seed = 1; seed <= 300; seed++) {
        const r = makeRound(plan, new Rng(seed));
        const wanted = r.jars.reduce((s, n) => s + n, 0);
        expect(r.fireflies).toBeGreaterThanOrEqual(wanted);
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
            if (plan.guess) expect(r.ones >= 1 && r.jars.length >= 2).toBe(true);
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
    expect(PLANS.map((p) => p.mode)).toEqual(['free', 'exact', 'fives', 'tens', 'groups', 'tens']);
    expect(PLANS[5].guess).toBe(true);
    expect(PLANS.slice(0, 5).every((p) => !p.guess)).toBe(true);
    for (let seed = 1; seed <= 300; seed++) {
      const a = new Rng(seed),
        b = new Rng(seed);
      const round = makeRound(PLANS[5], a);
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
});
