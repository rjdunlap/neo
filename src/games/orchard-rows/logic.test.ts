import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import { computeView } from '../../engine/view';
import {
  across,
  isBasketLevel,
  isPathLevel,
  makePathRound,
  partsOf,
  PATH_POOLS,
  pathBot,
  pathCell,
  pathChoices,
  pathHint,
  pathLayout,
  pathStep,
  planFor,
  QUESTIONS,
  rowsOf,
  skipCount,
  startPath,
  taskOf,
  unitOf,
  answerOf,
  type PathAction,
  type PathState,
  type PathTask,
} from './logic';
import {
  choicesFor,
  countGroup,
  makeOrchards,
  missingTrees,
  orchardLayout,
  PLANS,
  subtotals,
  total,
  turn,
} from './logic';
import {
  basketLayout,
  botStep,
  cellSize,
  deal,
  equalRows,
  frameKey,
  frameOf,
  framesFor,
  hintTarget,
  isPrime,
  makeRound,
  MIN_CELL,
  PET_CORNER,
  PRIME_SETS,
  rowRange,
  shapeOf,
  startPlay,
  step,
  TOP_CLEAR,
  type Action,
  type Box,
  type PlayState,
  type Round,
} from './logic';

describe('Orchard Rows', () => {
  it('draws two distinct valid arrays deterministically, with variety across seeds', () => {
    for (let level = 1; level <= 3; level++)
      for (let seed = 1; seed <= 100; seed++) {
        const boards = makeOrchards(level, new Rng(seed));
        expect(boards).toEqual(makeOrchards(level, new Rng(seed)));
        expect(boards).toHaveLength(2);
        expect(new Set(boards.map((o) => `${o.rows}x${o.columns}`)).size).toBe(2);
        for (const o of boards) {
          expect(o.rows).toBeGreaterThanOrEqual(2);
          expect(o.columns).toBeGreaterThanOrEqual(2);
          expect(Math.max(o.rows, o.columns)).toBeLessThanOrEqual(5);
          expect(PLANS[level - 1].shapes).toContainEqual(o);
        }
      }
    expect(makeOrchards(3, new Rng(1))).not.toEqual(makeOrchards(3, new Rng(2)));
  });
  it('fresh orchards: every pool shape fits 5 by 5 and is drawn; level 2 pairs no turns and no squares', () => {
    const key = (o: { rows: number; columns: number }) => `${o.rows}x${o.columns}`;
    expect(PLANS.slice(0, 3).map((p) => p.shapes.map(key).sort())).toEqual([
      ['2x2', '2x3', '3x2', '3x3', '4x2'],
      ['2x4', '2x5', '3x4', '4x3', '5x2'],
      ['3x5', '4x4', '4x5', '5x3', '5x4', '5x5'],
    ]);
    for (const plan of PLANS)
      for (const o of plan.shapes) expect(Math.max(o.rows, o.columns), key(o)).toBeLessThanOrEqual(5);
    for (const o of PLANS[1].shapes) expect(o.rows, `level 2 square ${key(o)}`).not.toBe(o.columns);
    for (let level = 1; level <= 3; level++) {
      const seen = new Set<string>();
      for (let seed = 1; seed <= 300; seed++) {
        const [a, b] = makeOrchards(level, new Rng(seed));
        seen.add(key(a));
        seen.add(key(b));
        if (level === 2) expect(key(b), `seed ${seed}`).not.toBe(key(turn(a)));
      }
      expect([...seen].sort()).toEqual(PLANS[level - 1].shapes.map(key).sort());
    }
  });
  it('regroups exactly the same quantity, and every subtotal adds one full group', () => {
    for (const plan of PLANS)
      for (const o of plan.shapes) {
        expect(total(turn(o))).toBe(total(o));
        expect(turn(turn(o))).toEqual(o);
        expect(subtotals(o).at(-1)).toBe(total(o));
        expect(subtotals(turn(o)).at(-1)).toBe(total(o));
        expect(subtotals(o).map((n, i, a) => n - (a[i - 1] ?? 0))).toEqual(Array(o.rows).fill(o.columns));
        expect(missingTrees(o)).toBe(o.columns);
        expect((o.rows - 1) * o.columns + missingTrees(o)).toBe(total(o));
      }
  });
  it('offers exactly one answer and valid, distinct decoys, including row/column confusion', () => {
    for (const plan of PLANS)
      for (const o of plan.shapes)
        for (let seed = 1; seed <= 30; seed++) {
          for (const answer of [total(o), missingTrees(o)]) {
            const pads = choicesFor(answer, new Rng(seed), answer === missingTrees(o) ? o.rows : undefined);
            expect(pads).toHaveLength(3);
            expect(new Set(pads).size).toBe(3);
            expect(pads.filter((n) => n === answer)).toHaveLength(1);
            expect(pads.every((n) => Number.isInteger(n) && n > 0)).toBe(true);
          }
          if (o.rows !== o.columns)
            expect(choicesFor(missingTrees(o), new Rng(seed), o.rows)).toContain(o.rows);
        }
  });
  it('allows any counting order, replay without double counting, and guards invalid rows', () => {
    const o = { rows: 3, columns: 4 };
    const counted = [2];
    expect(countGroup(counted, 2, o)).toEqual([2]);
    expect(countGroup(counted, -1, o)).toEqual([2]);
    expect(countGroup(counted, 3, o)).toEqual([2]);
    expect(countGroup(countGroup(counted, 0, o), 1, o)).toEqual([2, 0, 1]);
    expect(counted).toEqual([2]);
  });
  it('keeps row controls unscaled, at least 100 units, within four views and clear of the guide and choices', () => {
    for (const [w, h] of [
      [1024, 768],
      [768, 1024],
      [844, 390],
      [750, 369],
    ]) {
      const v = computeView(w, h);
      for (const plan of PLANS)
        for (const shape of plan.shapes)
          for (const o of [shape, turn(shape)]) {
            const l = orchardLayout(v.w, v.h, o);
            expect(l.width).toBeGreaterThanOrEqual(100);
            expect(l.rowHeight).toBe(100);
            expect(l.x - l.width / 2).toBeGreaterThanOrEqual(170);
            expect(l.x + l.width / 2).toBeLessThan(v.w - 195);
            expect(l.y).toBeGreaterThanOrEqual(210);
            expect(l.y + o.rows * l.rowHeight).toBeLessThanOrEqual(v.h - 40);
          }
    }
  });
});

describe('Orchard Rows levels 4–6', () => {
  const divisors = (n: number, min: number, max: number) => {
    const out: number[] = [];
    for (let r = min; r <= max; r++) if (n % r === 0) out.push(r);
    return out;
  };
  const run = (s: PlayState, actions: Action[]) => {
    const outcomes: string[] = [];
    for (const a of actions) {
      const r = step(s, a);
      s = r.state;
      outcomes.push(r.outcome);
    }
    return { s, outcomes };
  };
  const seeds = (n: number) => Array.from({ length: n }, (_, i) => i + 1);

  it('deals every row count in range without losing a sapling', () => {
    for (let n = 12; n <= 24; n++)
      for (const level of [4, 5, 6]) {
        const { min, max } = rowRange(level, n);
        for (let r = min; r <= max; r++) {
          const d = deal(n, r);
          expect(d.each * d.rows + d.left).toBe(n);
          expect(d.left).toBeLessThan(r);
        }
      }
  });
  it('lists right row counts like brute force; openings leave some over', () => {
    for (let n = 12; n <= 24; n++)
      for (const level of [4, 5]) {
        const range = rowRange(level, n);
        expect(equalRows(n, range)).toEqual(divisors(n, range.min, range.max));
      }
    expect(rowRange(4, 12).min).toBe(2);
    expect(rowRange(5, 12).min).toBe(1);
    expect(rowRange(6, 12).max).toBe(6);
    for (const seed of seeds(300))
      for (const level of [4, 5]) {
        const round = makeRound(level, new Rng(seed));
        for (const t of round.tasks) {
          const n = t.baskets[0];
          expect(n % t.open).not.toBe(0);
          const range = rowRange(level, n);
          expect(t.open).toBeGreaterThanOrEqual(range.min);
          expect(t.open).toBeLessThanOrEqual(range.max);
          if (level === 4) expect(equalRows(n, range).length).toBeGreaterThanOrEqual(2);
          expect(equalRows(n, range).length).toBeGreaterThanOrEqual(1);
        }
        if (level === 4) expect(round.tasks[0]).toEqual({ baskets: [12], open: 5 });
        expect(round.tasks).toHaveLength(level === 4 ? 2 : 1);
      }
  });
  it('frames match brute force, are reachable, and turn into each other', () => {
    for (let n = 12; n <= 24; n++) {
      const brute: [number, number][] = [];
      for (let a = 1; a <= n; a++) for (let b = a; b <= n; b++) if (a * b === n) brute.push([a, b]);
      expect(framesFor(n)).toEqual(brute);
      const range = rowRange(5, n);
      const reachable = new Set(equalRows(n, range).map((r) => frameKey(frameOf(n, r))));
      for (const f of framesFor(n)) expect(reachable.has(frameKey(f))).toBe(true);
      expect(frameOf(n, 1)).toEqual(frameOf(n, n));
      for (const r of divisors(n, 1, n)) expect(frameOf(n, r)).toEqual(frameOf(n, n / r));
    }
    const counts: Record<number, number> = { 12: 3, 16: 3, 18: 3, 20: 3, 24: 4 };
    for (const [n, c] of Object.entries(counts)) expect(framesFor(+n)).toHaveLength(c);
    for (const seed of seeds(300))
      expect(framesFor(makeRound(5, new Rng(seed)).tasks[0].baskets[0]).length).toBeLessThanOrEqual(4);
  });
  it('builds exactly 60 prime sets with one prime and an odd composite', () => {
    expect(PRIME_SETS).toHaveLength(60);
    expect(new Set(PRIME_SETS.map((s) => s.join(','))).size).toBe(60);
    for (const set of PRIME_SETS) {
      expect(set).toHaveLength(3);
      expect(set.filter(isPrime)).toHaveLength(1);
      expect([13, 17, 19, 23]).toContain(set.find(isPrime));
      expect(set.some((n) => n === 15 || n === 21)).toBe(true);
      for (const n of set) {
        expect(n).toBeGreaterThanOrEqual(12);
        expect(n).toBeLessThanOrEqual(24);
      }
    }
    for (let n = 12; n <= 24; n++) {
      const range = rowRange(6, n);
      const eq = equalRows(n, range);
      if (isPrime(n)) {
        expect(eq).toEqual([]);
        for (let r = range.min; r <= range.max; r++) expect(deal(n, r).left).toBeGreaterThan(0);
        expect(shapeOf(n)).toBeNull();
      } else {
        expect(eq.length).toBeGreaterThan(0);
        const sh = shapeOf(n)!;
        expect(sh.left).toBe(0);
        expect(sh.rows).toBe(eq[0]);
        expect(sh.rows * sh.each).toBe(n);
      }
    }
    expect(shapeOf(15)).toEqual({ rows: 3, each: 5, left: 0 });
  });
  it('is deterministic per seed; level 6 starts at {12,13,15} and changes prime', () => {
    for (const level of [4, 5, 6])
      for (const seed of seeds(300)) {
        const a = makeRound(level, new Rng(seed));
        expect(a).toEqual(makeRound(level, new Rng(seed)));
        expect(['apple', 'pear', 'plum']).toContain(a.sapling);
        if (level === 6) {
          expect(a.tasks).toHaveLength(2);
          expect([...a.tasks[0].baskets].sort((x, y) => x - y)).toEqual([12, 13, 15]);
          const p0 = a.tasks[0].baskets.find(isPrime)!;
          const p1 = a.tasks[1].baskets.find(isPrime)!;
          expect(p1).not.toBe(p0);
          expect(a.tasks[1].baskets.filter(isPrime)).toHaveLength(1);
          expect(PRIME_SETS.some((s) => [...s].sort().join() === [...a.tasks[1].baskets].sort().join())).toBe(
            true,
          );
        }
      }
    const second = new Set<number>();
    for (const seed of seeds(300)) {
      const t = makeRound(4, new Rng(seed)).tasks[1];
      const n = t.baskets[0];
      second.add(n);
      expect(equalRows(n, rowRange(4, n)).length, `basket ${n}`).toBeGreaterThanOrEqual(2);
      expect(n % t.open, `basket ${n} opens at ${t.open}`).not.toBe(0);
    }
    expect([...second].sort((x, y) => x - y)).toEqual([14, 15, 16, 18, 20, 21]);
    const fruit = new Set(seeds(300).map((s) => makeRound(4, new Rng(s)).sapling));
    expect(fruit.size).toBeGreaterThan(1);
    expect(
      new Set(seeds(300).map((s) => makeRound(6, new Rng(s)).tasks[1].baskets.join())).size,
    ).toBeGreaterThan(5);
  });

  describe('accounting', () => {
    const l4 = (n: number, open: number): Round => ({
      level: 4,
      sapling: 'apple',
      tasks: [{ baskets: [n], open }],
    });
    const l5 = (n: number, open: number): Round => ({
      level: 5,
      sapling: 'pear',
      tasks: [{ baskets: [n], open }],
    });
    const l6 = (b: number[]): Round => ({
      level: 6,
      sapling: 'plum',
      tasks: [
        { baskets: b, open: 2 },
        { baskets: [12, 17, 15], open: 2 },
      ],
    });

    it('arrows and range-end presses are free and stay in range', () => {
      for (const level of [4, 5]) {
        const round = level === 4 ? l4(16, 5) : l5(16, 3);
        let s = startPlay(round);
        const { min, max } = rowRange(level, 16);
        for (let i = 0; i < 20; i++) {
          s = step(s, { kind: 'up' }).state;
          expect(s.rows).toBeLessThanOrEqual(max);
        }
        expect(step(s, { kind: 'up' }).outcome).toBe('end');
        for (let i = 0; i < 20; i++) {
          s = step(s, { kind: 'down' }).state;
          expect(s.rows).toBeGreaterThanOrEqual(min);
        }
        expect(step(s, { kind: 'down' }).outcome).toBe('end');
        expect(s.rows).toBe(min);
        expect(s.misses).toBe(0);
        expect(s.hints).toBe(0);
        expect(s.wrongs).toBe(0);
      }
    });
    it('a leftover Plant is a miss; the second lights the glow with one hint, never more', () => {
      let s = startPlay(l4(16, 5));
      let r = step(s, { kind: 'plant' });
      expect(r.outcome).toBe('leftover');
      expect(r.state).toMatchObject({ misses: 1, hints: 0, glowing: false });
      r = step(r.state, { kind: 'plant' });
      expect(r.state).toMatchObject({ misses: 2, hints: 1, glowing: true });
      r = step(r.state, { kind: 'plant' });
      expect(r.state).toMatchObject({ misses: 3, hints: 1, glowing: true });
      s = r.state;
      expect(s.done).toBe(false);
    });
    it('level 4 plants the right rows, then the next basket starts fresh', () => {
      let s = startPlay(makeRound(4, new Rng(3)));
      const first = s.tasks[0].baskets[0];
      expect(first).toBe(12);
      s = run(s, [{ kind: 'plant' }]).s; // 5 rows leaves 2
      expect(s.misses).toBe(1);
      s = run(s, [{ kind: 'plant' }]).s;
      expect(s).toMatchObject({ misses: 2, hints: 1, glowing: true });
      s = run(s, [{ kind: 'down' }, { kind: 'down' }, { kind: 'plant' }]).s; // 3 rows
      expect(s.rows).toBe(s.tasks[1].open);
      expect(s).toMatchObject({ index: 1, glowing: false, wrongs: 0, misses: 2, hints: 1, done: false });
      const n = s.tasks[1].baskets[0];
      const right = equalRows(n, rowRange(4, n))[0];
      s = run(s, Array(Math.abs(right - s.rows)).fill({ kind: right > s.rows ? 'up' : 'down' })).s;
      const r = step(s, { kind: 'plant' });
      expect(r.outcome).toBe('planted');
      expect(r.state.done).toBe(true);
      expect(step(r.state, { kind: 'up' }).outcome).toBe('ignored');
    });
    it('level 5 counts found frames; repeats and turned shapes are free', () => {
      let s = startPlay(l5(12, 5));
      let r = run(s, [{ kind: 'down' }, { kind: 'down' }, { kind: 'down' }]); // 2 rows
      s = r.s;
      r = run(s, [{ kind: 'plant' }]);
      expect(r.outcomes).toEqual(['newshape']);
      r = run(r.s, [{ kind: 'plant' }]);
      expect(r.outcomes).toEqual(['already']);
      r = run(r.s, [{ kind: 'up' }, { kind: 'up' }, { kind: 'up' }, { kind: 'up' }]); // 6 rows: 6x2 is 2x6 turned
      expect(r.s.rows).toBe(6);
      r = run(r.s, [{ kind: 'plant' }]);
      expect(r.outcomes).toEqual(['turnedsame']);
      expect(r.s.found).toHaveLength(1);
      expect(r.s).toMatchObject({ misses: 0, hints: 0 });
      r = run(r.s, [{ kind: 'down' }, { kind: 'down' }, { kind: 'plant' }]); // 4 rows leaves 0? 12/4=3 yes
      expect(r.outcomes.at(-1)).toBe('newshape');
      r = run(r.s, [{ kind: 'down' }, { kind: 'down' }, { kind: 'down' }, { kind: 'plant' }]); // 1 row
      expect(r.outcomes.at(-1)).toBe('everydone');
      expect(r.s.done).toBe(true);
      expect(r.s).toMatchObject({ misses: 0, hints: 0 });
    });
    it('level 6 loads are free; the first wrong claim per basket is a miss; repeats replay', () => {
      let s = startPlay(l6([12, 13, 15]));
      expect(s.loaded).toBeNull();
      expect(step(s, { kind: 'claim' }).outcome).toBe('ignored');
      expect(step(s, { kind: 'up' }).outcome).toBe('ignored');
      expect(step(s, { kind: 'plant' }).outcome).toBe('ignored');
      let r = run(s, [
        { kind: 'load', basket: 0 },
        { kind: 'load', basket: 1 },
        { kind: 'load', basket: 0 },
        { kind: 'up' },
        { kind: 'down' },
        { kind: 'down' },
      ]);
      expect(r.s).toMatchObject({ misses: 0, hints: 0, loaded: 0 });
      expect(step(r.s, { kind: 'load', basket: 3 }).outcome).toBe('ignored');
      r = run(r.s, [{ kind: 'claim' }]);
      expect(r.outcomes).toEqual(['claimwrong']);
      expect(r.s).toMatchObject({ misses: 1, hints: 0 });
      r = run(r.s, [{ kind: 'claim' }, { kind: 'claim' }]);
      expect(r.outcomes).toEqual(['claimagain', 'claimagain']);
      expect(r.s).toMatchObject({ misses: 1, hints: 0, glowing: false });
      r = run(r.s, [{ kind: 'load', basket: 2 }, { kind: 'claim' }]);
      expect(r.outcomes[1]).toBe('claimwrong');
      expect(r.s).toMatchObject({ misses: 2, hints: 1, glowing: true });
      r = run(r.s, [{ kind: 'claim' }, { kind: 'load', basket: 1 }, { kind: 'claim' }]);
      expect(r.outcomes[2]).toBe('claimright');
      expect(r.s).toMatchObject({
        misses: 2,
        hints: 1,
        index: 1,
        loaded: null,
        glowing: false,
        wrongs: 0,
        shown: [],
      });
      r = run(r.s, [{ kind: 'load', basket: 1 }, { kind: 'claim' }]);
      expect(r.outcomes[1]).toBe('claimright');
      expect(r.s.done).toBe(true);
      expect(r.s.hints).toBe(1);
    });
    it('hints never exceed one per basket or set, and per-task counters reset', () => {
      for (const seed of seeds(100)) {
        const rng = new Rng(seed);
        for (const level of [4, 5, 6]) {
          let s = startPlay(makeRound(level, rng));
          for (let i = 0; i < 60 && !s.done; i++) {
            const idx = s.index;
            const before = s.hints;
            const a: Action =
              level === 6
                ? i % 3 === 0
                  ? { kind: 'load', basket: rng.int(0, 2) }
                  : { kind: 'claim' }
                : { kind: rng.pick(['plant', 'up', 'down', 'plant'] as const) };
            s = step(s, a).state;
            if (s.index === idx) expect(s.hints - before).toBeLessThanOrEqual(1);
          }
          expect(s.hints).toBeLessThanOrEqual(s.tasks.length);
          expect(s.hints).toBeLessThanOrEqual(s.misses);
        }
      }
    });
  });

  describe('help leads somewhere', () => {
    it('from every reachable rows value the hint path reaches a right plant within bound', () => {
      for (const level of [4, 5])
        for (let n = 12; n <= 24; n++) {
          const range = rowRange(level, n);
          if (equalRows(n, range).length === 0) continue;
          const frames = framesFor(n).map(frameKey);
          // Every subset of frames already found, but not all of them.
          for (let mask = 0; mask < (level === 5 ? 1 << frames.length : 1); mask++) {
            const found = level === 5 ? frames.filter((_, i) => mask & (1 << i)) : [];
            const reachableFrames = new Set(equalRows(n, range).map((r) => frameKey(frameOf(n, r))));
            if (level === 5 && [...reachableFrames].every((k) => found.includes(k))) continue;
            for (let r0 = range.min; r0 <= range.max; r0++) {
              let s: PlayState = {
                ...startPlay({ level, sapling: 'apple', tasks: [{ baskets: [n], open: r0 }] }),
                found,
                planted: [],
              };
              let steps = 0;
              for (;;) {
                const a = botStep(s)!;
                expect(a).not.toBeNull();
                if (a.kind === 'plant') break;
                expect(['up', 'down']).toContain(a.kind);
                const res = step(s, a);
                expect(res.outcome).toBe('moved');
                s = res.state;
                expect(s.rows).toBeGreaterThanOrEqual(range.min);
                expect(s.rows).toBeLessThanOrEqual(range.max);
                steps++;
                expect(steps).toBeLessThanOrEqual(Math.floor(n / 2));
              }
              expect(n % s.rows).toBe(0);
              if (level === 5) expect(found).not.toContain(frameKey(frameOf(n, s.rows)));
              const res = step(s, { kind: 'plant' });
              expect(['planted', 'newshape', 'everydone']).toContain(res.outcome);
              expect(res.state.misses).toBe(0);
            }
          }
        }
    });
    it('at level 6 help names the prime basket then its claim, from any loaded state', () => {
      for (const set of PRIME_SETS)
        for (const order of [set, [...set].reverse(), [set[1], set[2], set[0]]]) {
          const prime = order.findIndex(isPrime);
          for (const loaded of [null, 0, 1, 2]) {
            let s: PlayState = {
              ...startPlay({ level: 6, sapling: 'apple', tasks: [{ baskets: order, open: 2 }] }),
              loaded,
            };
            let steps = 0;
            while (hintTarget(s) !== 'claim') {
              expect(hintTarget(s)).toEqual({ basket: prime });
              s = step(s, botStep(s)!).state;
              expect(++steps).toBeLessThanOrEqual(1);
            }
            expect(s.loaded).toBe(prime);
            expect(step(s, { kind: 'claim' }).outcome).toBe('claimright');
          }
        }
    });
    it('help is null once finished', () => {
      const s = { ...startPlay(makeRound(4, new Rng(1))), done: true };
      expect(hintTarget(s)).toBeNull();
      expect(botStep(s)).toBeNull();
    });
  });

  it('the bot finishes every level with no misses or hints over 100 seeds', () => {
    for (const level of [4, 5, 6])
      for (const seed of seeds(100)) {
        let s = startPlay(makeRound(level, new Rng(seed)));
        let guard = 0;
        while (!s.done) {
          const a = botStep(s);
          expect(a).not.toBeNull();
          const r = step(s, a!);
          expect(r.outcome).not.toBe('ignored');
          expect(r.outcome).not.toBe('end');
          s = r.state;
          expect(++guard).toBeLessThan(200);
        }
        expect(s.misses).toBe(0);
        expect(s.hints).toBe(0);
        if (level === 5) expect(s.found).toHaveLength(framesFor(s.tasks[0].baskets[0]).length);
      }
  });

  describe('layout', () => {
    const views = [
      ['landscape', computeView(1024, 768)],
      ['portrait', computeView(768, 1024)],
      ['phone', computeView(844, 390)],
      ['phone insets', computeView(844, 390, { top: 0, right: 47, bottom: 21, left: 47 })],
    ] as const;
    const overlap = (a: Box, b: Box) =>
      a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
    const cases: [number, number][] = [
      [4, 0],
      [5, 3],
      [5, 4],
      [6, 0],
    ];
    it('keeps controls big, apart, and out of the pet corner and top strip', () => {
      for (const [name, v] of views)
        for (const [level, frames] of cases) {
          const L = basketLayout(v, level, frames);
          const tag = `${name} L${level}/${frames}`;
          expect(L, tag).not.toBeNull();
          if (!L) continue;
          const big = [L.up, L.down, L.card, L.act, ...(level === 6 ? L.baskets : [])];
          for (const b of big) {
            expect(b.w, tag).toBeGreaterThanOrEqual(100);
            expect(b.h, tag).toBeGreaterThanOrEqual(100);
          }
          expect(L.baskets).toHaveLength(level === 6 ? 3 : 1);
          expect(L.frames).toHaveLength(level === 5 ? frames : 0);
          const items = [L.up, L.down, L.card, L.act, ...L.baskets, ...L.frames];
          items.forEach((a, i) =>
            items.slice(i + 1).forEach((b) => expect(overlap(a, b), `${tag} ${i}`).toBe(false)),
          );
          for (const b of [...items, L.bed]) {
            expect(b.y, tag).toBeGreaterThanOrEqual(level === 6 || b !== L.bed ? TOP_CLEAR : 0);
            expect(b.x >= 0 && b.x + b.w <= v.w, tag).toBe(true);
            expect(b.y + b.h, tag).toBeLessThanOrEqual(v.h);
            expect(b.x < PET_CORNER.w && b.y + b.h > v.h - PET_CORNER.h, `${tag} pet corner`).toBe(false);
          }
          for (const b of [...L.baskets, ...L.frames, L.up, L.down, L.card, L.act])
            expect(b.y, tag).toBeGreaterThanOrEqual(TOP_CLEAR);
          for (const b of big) expect(overlap(L.bed, b), `${tag} bed`).toBe(false);
          for (const b of L.frames) expect(overlap(L.bed, b), `${tag} bed/frame`).toBe(false);
          for (const b of L.baskets) expect(overlap(L.bed, b), `${tag} bed/basket`).toBe(false);
          expect(L.bed.w).toBeGreaterThan(0);
          expect(L.bed.h).toBeGreaterThan(0);
        }
    });
    it('gives every reachable deal a cell of at least the minimum', () => {
      for (const [name, v] of views)
        for (const [level, frames] of cases) {
          const L = basketLayout(v, level, frames)!;
          const ns =
            level === 6 ? [...new Set(PRIME_SETS.flat())] : Array.from({ length: 13 }, (_, i) => i + 12);
          for (const n of ns) {
            const { min, max } = rowRange(level, n);
            for (let r = min; r <= max; r++) {
              if (level === 6 && r !== 1 && r < 2) continue;
              expect(cellSize(L.bed, deal(n, r)), `${name} L${level} n${n} r${r}`).toBeGreaterThanOrEqual(
                MIN_CELL,
              );
            }
          }
        }
    });
  });
});

describe('Orchard Rows levels 7-9: a path through the orchard', () => {
  const levels = [7, 8, 9] as const;
  const splitsOf = (level: 7 | 8 | 9, o: { rows: number }) =>
    level === 8 ? Array.from({ length: o.rows - 1 }, (_, i) => i + 1) : [PATH_POOLS[level].split];
  const eachCase = (fn: (level: 7 | 8 | 9, t: PathTask, tag: string) => void) => {
    for (const level of levels)
      for (const o of PATH_POOLS[level].shapes)
        for (const split of splitsOf(level, o))
          fn(level, { ...o, split }, `L${level} ${o.rows}x${o.columns} s${split}`);
  };

  it('pools hold the defined shapes and every whole is below 100', () => {
    expect(PATH_POOLS[7].shapes).toHaveLength(21);
    expect(PATH_POOLS[8].shapes).toHaveLength(16);
    expect(PATH_POOLS[9].shapes).toHaveLength(36);
    for (const o of PATH_POOLS[7].shapes) {
      expect(o.rows >= 7 && o.rows <= 9 && o.columns >= 3 && o.columns <= 9).toBe(true);
    }
    for (const o of PATH_POOLS[8].shapes) {
      expect(o.rows >= 6 && o.rows <= 9 && o.columns >= 6 && o.columns <= 9).toBe(true);
    }
    for (const o of PATH_POOLS[9].shapes) {
      expect(o.rows >= 2 && o.rows <= 5 && o.columns >= 11 && o.columns <= 19).toBe(true);
    }
    expect(PATH_POOLS[7].split).toBe(5);
    expect(PATH_POOLS[9].split).toBe(10);
    for (const level of levels)
      for (const o of PATH_POOLS[level].shapes) expect(o.rows * o.columns).toBeLessThan(100);
  });

  it('rounds are deterministic, hold two different orchards and open on the fixed example', () => {
    const first = { 7: [7, 4], 8: [7, 6], 9: [3, 14] } as const;
    for (const level of levels)
      for (let seed = 1; seed <= 300; seed++) {
        const r = makePathRound(level, new Rng(seed));
        expect(r).toEqual(makePathRound(level, new Rng(seed)));
        expect(r.tasks).toHaveLength(2);
        expect([r.tasks[0].rows, r.tasks[0].columns]).toEqual(first[level]);
        expect(r.tasks[0].split).toBe(PATH_POOLS[level].split);
        expect(`${r.tasks[0].rows}x${r.tasks[0].columns}`).not.toBe(
          `${r.tasks[1].rows}x${r.tasks[1].columns}`,
        );
        expect(PATH_POOLS[level].shapes).toContainEqual({
          rows: r.tasks[1].rows,
          columns: r.tasks[1].columns,
        });
        expect(r.fruit).toBeTruthy();
      }
    expect(
      new Set(Array.from({ length: 60 }, (_, i) => makePathRound(7, new Rng(i + 1)).tasks[1].columns)).size,
    ).toBeGreaterThan(2);
  });

  it('parts add to the whole, are above zero, and the first is larger at levels 7 and 9', () => {
    eachCase((level, t, tag) => {
      const [a, b] = partsOf(level, t);
      expect(a + b, tag).toBe(t.rows * t.columns);
      expect(a, tag).toBeGreaterThan(0);
      expect(b, tag).toBeGreaterThan(0);
      if (level !== 8) expect(a, tag).toBeGreaterThan(b);
      expect(rowsOf(level, t, 0) * unitOf(level, t, 0), tag).toBe(a);
      expect(rowsOf(level, t, 1) * unitOf(level, t, 1), tag).toBe(b);
    });
    expect(across(7) && across(8) && !across(9)).toBe(true);
  });

  it('pads: three distinct values in 1-99 with the answer among them, for every shape, split and question', () => {
    eachCase((level, t, tag) => {
      const [a, b] = partsOf(level, t);
      const answers = [a, b, a + b];
      for (let seed = 1; seed <= 50; seed++)
        QUESTIONS.forEach((kind, q) => {
          const pads = pathChoices(answers[q], kind, t, level, new Rng(seed));
          const at = `${tag} ${kind} seed ${seed}`;
          expect(pads, at).toHaveLength(3);
          expect(new Set(pads).size, at).toBe(3);
          expect(pads, at).toContain(answers[q]);
          for (const n of pads) {
            expect(n, at).toBeGreaterThanOrEqual(1);
            expect(n, at).toBeLessThanOrEqual(99);
          }
          if (kind === 'whole') expect(pads, at).toContain(Math.max(a, b));
          expect(pads, at).toEqual(pathChoices(answers[q], kind, t, level, new Rng(seed)));
        });
    });
  });

  it('pads: the named collisions still give three', () => {
    const cases: [number, PathTask][] = [
      [9, { rows: 3, columns: 15, split: 10 }],
      [9, { rows: 5, columns: 19, split: 10 }],
      [8, { rows: 6, columns: 6, split: 1 }],
      [8, { rows: 6, columns: 6, split: 5 }],
    ];
    for (const [level, t] of cases) {
      const [a, b] = partsOf(level, t);
      for (let seed = 1; seed <= 20; seed++)
        [a, b, a + b].forEach((ans, q) => {
          const pads = pathChoices(ans, QUESTIONS[q], t, level, new Rng(seed));
          expect(new Set(pads).size).toBe(3);
          expect(pads).toContain(ans);
          expect(pads.every((n) => n >= 1 && n <= 99)).toBe(true);
        });
    }
  });

  const play = (level: number, seed = 1) => startPath(makePathRound(level, new Rng(seed)));
  const apply = (s: PathState, ...as: PathAction[]) => as.reduce((st, a) => pathStep(st, a).state, s);

  it('arrows never leave 1..rows-1 and the ends are free', () => {
    for (let seed = 1; seed <= 30; seed++) {
      let s = play(8, seed);
      const rows = s.tasks[0].rows;
      for (let i = 0; i < rows + 3; i++) s = pathStep(s, { kind: 'up' }).state;
      expect(s.split).toBe(1);
      expect(pathStep(s, { kind: 'up' }).outcome).toBe('end');
      for (let i = 0; i < rows + 3; i++) {
        const r = pathStep(s, { kind: 'down' });
        s = r.state;
        expect(s.split).toBeGreaterThanOrEqual(1);
        expect(s.split).toBeLessThanOrEqual(rows - 1);
      }
      expect(s.split).toBe(rows - 1);
      const end = pathStep(s, { kind: 'down' });
      expect(end.outcome).toBe('end');
      expect(end.state).toEqual(s);
      expect(s.misses + s.hints).toBe(0);
    }
    const s = play(8);
    expect(pathStep(s, { kind: 'down' })).toMatchObject({ outcome: 'moved', state: { split: 2 } });
    expect(taskOf(pathStep(s, { kind: 'down' }).state).split).toBe(2);
  });

  it('accounting: every wrong pad is a miss; the second on a question is one hint; free actions count nothing', () => {
    for (const level of levels) {
      let s = play(level);
      s = apply(s, ...(level === 8 ? [{ kind: 'lay' } as PathAction] : []));
      for (let q = 0; q < 6; q++) {
        const ans = answerOf(s);
        const wrong = ans === 1 ? 2 : ans - 1;
        const m0 = s.misses,
          h0 = s.hints;
        let r = pathStep(s, { kind: 'pad', n: wrong });
        expect(r.outcome).toBe('wrong');
        expect(r.state.misses).toBe(m0 + 1);
        expect(r.state.hints).toBe(h0);
        expect(r.state.glowing).toBe(false);
        expect(pathHint(r.state)).toBeNull();
        r = pathStep(r.state, { kind: 'pad', n: wrong });
        expect(r.state.misses).toBe(m0 + 2);
        expect(r.state.hints).toBe(h0 + 1);
        expect(r.state.glowing).toBe(true);
        r = pathStep(r.state, { kind: 'pad', n: wrong });
        expect(r.state.misses).toBe(m0 + 3);
        expect(r.state.hints).toBe(h0 + 1);
        s = pathStep(r.state, { kind: 'pad', n: ans }).state;
        expect(s.wrongs).toBe(0);
        expect(s.glowing).toBe(false);
        if (s.done) break;
        if (level === 8 && s.question === 0 && !s.laid) s = apply(s, { kind: 'lay' });
      }
      expect(s.done).toBe(true);
      expect(s.hints).toBeLessThanOrEqual(6);
      expect(s.hints).toBe(6);
      const after = pathStep(s, { kind: 'pad', n: 1 });
      expect(after.outcome).toBe('ignored');
      expect(after.state).toEqual(s);
      expect(pathStep(s, { kind: 'sign', part: 0 }).outcome).toBe('ignored');
    }
  });

  it('free actions: lay, signs and arrows count nothing; signs ask before answered and recount after', () => {
    let s = play(7);
    let r = pathStep(s, { kind: 'sign', part: 1 });
    expect(r.outcome).toBe('ask');
    expect(r.state).toEqual(s);
    expect(pathStep(s, { kind: 'sign', part: 0 }).outcome).toBe('ask');
    s = pathStep(s, { kind: 'pad', n: answerOf(s) }).state;
    expect(pathStep(s, { kind: 'sign', part: 0 }).outcome).toBe('recount');
    expect(pathStep(s, { kind: 'sign', part: 1 }).outcome).toBe('ask');
    expect(pathStep(s, { kind: 'up' }).outcome).toBe('ignored');
    expect(pathStep(s, { kind: 'lay' }).outcome).toBe('ignored');
    const e = play(8);
    expect(pathStep(e, { kind: 'pad', n: 5 }).outcome).toBe('ignored');
    expect(pathStep(e, { kind: 'sign', part: 0 }).outcome).toBe('ignored');
    const laid = pathStep(e, { kind: 'lay' });
    expect(laid.outcome).toBe('laid');
    expect(laid.state.misses + laid.state.hints).toBe(0);
    expect(pathStep(laid.state, { kind: 'down' }).outcome).toBe('ignored');
  });

  it('level 8 accepts every split', () => {
    for (let seed = 1; seed <= 20; seed++) {
      const rows = play(8, seed).tasks[0].rows;
      for (let split = 1; split < rows; split++) {
        let s = play(8, seed);
        for (let i = 1; i < split; i++) s = apply(s, { kind: 'down' });
        s = apply(s, { kind: 'lay' });
        const w = s.tasks[0].rows * s.tasks[0].columns;
        const a = split * s.tasks[0].columns;
        for (const want of [a, w - a, w]) {
          expect(answerOf(s)).toBe(want);
          const r = pathStep(s, { kind: 'pad', n: want });
          expect(r.outcome).toBe('right');
          expect(r.state.misses).toBe(0);
          s = r.state;
        }
        expect(s.index).toBe(1);
        expect(s.laid).toBe(false);
        expect(s.split).toBe(s.tasks[1].split);
      }
    }
  });

  it('hint names the answer pad only while glowing, never before the path is laid, and following it answers', () => {
    for (const level of levels)
      for (let seed = 1; seed <= 20; seed++) {
        let s = play(level, seed);
        if (level === 8) {
          expect(pathHint(s)).toBeNull();
          s = apply(s, { kind: 'lay' });
        }
        expect(pathHint(s)).toBeNull();
        const wrong = answerOf(s) + 1;
        s = apply(s, { kind: 'pad', n: wrong }, { kind: 'pad', n: wrong });
        const hint = pathHint(s);
        expect(hint).toBe(answerOf(s));
        const r = pathStep(s, { kind: 'pad', n: hint! });
        expect(r.outcome).toBe('right');
        expect(r.state.question).toBe(1);
        expect(pathHint(r.state)).toBeNull();
      }
  });

  it('the bot finishes every level with no miss and lays level 8 at five', () => {
    for (const level of levels)
      for (let seed = 1; seed <= 100; seed++) {
        let s = play(level, seed);
        let laidAt = -1,
          guard = 0;
        for (let a = pathBot(s); a; a = pathBot(s)) {
          if (++guard > 200) throw new Error('bot loops');
          if (a.kind === 'lay') laidAt = s.split;
          const r = pathStep(s, a);
          expect(r.outcome, `L${level} seed ${seed}`).not.toBe('ignored');
          expect(r.outcome).not.toBe('wrong');
          s = r.state;
        }
        expect(s.done).toBe(true);
        expect(s.misses + s.hints).toBe(0);
        if (level === 8) expect(laidAt).toBe(5);
      }
  });

  it('routing and plans', () => {
    for (const l of levels) {
      expect(isBasketLevel(l)).toBe(false);
      expect(isPathLevel(l)).toBe(true);
    }
    for (const l of [4, 5, 6]) expect(isBasketLevel(l)).toBe(true);
    expect(planFor(7).name).toBe('A path at five: count each part, then the whole');
    expect(planFor(8).name).toBe('Choose the path: split the orchard, count each part and the whole');
    expect(planFor(9).name).toBe('A path at ten: rows of ten and the rest, then the whole');
    expect(() => makeRound(7, new Rng(1))).toThrow();
    expect(() => makeRound(9, new Rng(1))).toThrow();
    expect(skipCount(5, 4)).toBe('4, 8, 12, 16, 20');
  });

  it('layout: targets are big, clear of the pet, top strip and edges, and do not overlap', () => {
    const views = [
      ['landscape', computeView(1024, 768)],
      ['portrait', computeView(1024, 1365)],
      ['phone', computeView(1662, 768)],
      ['phone insets', computeView(1561, 768, { top: 0, right: 47, bottom: 21, left: 47 })],
    ] as const;
    const hit = (a: Box, b: Box) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
    for (const [name, v] of views)
      for (const level of levels) {
        const L = pathLayout(v, level);
        const tag = `${name} L${level}`;
        expect(L, tag).not.toBeNull();
        if (!L) continue;
        const targets = [
          ...L.signs,
          ...L.pads,
          ...[L.up, L.down, L.card, L.lay].filter((b): b is Box => !!b),
        ];
        expect(L.portrait).toBe(v.h > v.w);
        for (const b of [...L.signs, ...L.pads, ...[L.up, L.down, L.lay].filter((x): x is Box => !!x)]) {
          expect(b.w, tag).toBeGreaterThanOrEqual(100);
          expect(b.h, tag).toBeGreaterThanOrEqual(100);
        }
        for (const b of targets) {
          expect(b.x, tag).toBeGreaterThanOrEqual(0);
          expect(b.y, tag).toBeGreaterThanOrEqual(TOP_CLEAR);
          expect(b.x + b.w, tag).toBeLessThanOrEqual(v.w);
          expect(b.y + b.h, tag).toBeLessThanOrEqual(v.h);
          expect(b.x < PET_CORNER.w && b.y + b.h > v.h - PET_CORNER.h, `${tag} pet corner`).toBe(false);
          expect(hit(b, L.bed), `${tag} bed`).toBe(false);
        }
        expect(L.bed.x).toBeGreaterThanOrEqual(0);
        expect(L.bed.y + L.bed.h).toBeLessThanOrEqual(v.h);
        expect(L.bed.x + L.bed.w).toBeLessThanOrEqual(v.w);
        expect(L.bed.x < PET_CORNER.w && L.bed.y + L.bed.h > v.h - PET_CORNER.h, `${tag} bed pet`).toBe(
          false,
        );
        const groups: Box[][] = [[...L.pads, ...L.signs]];
        if (level === 8) groups.push([L.up!, L.card!, L.down!, L.lay!, ...L.signs]);
        else expect(L.up).toBeNull();
        for (const g of groups)
          for (let i = 0; i < g.length; i++)
            for (let j = i + 1; j < g.length; j++)
              expect(hit(g[i], g[j]), `${tag} overlap ${i}/${j}`).toBe(false);
        for (const o of PATH_POOLS[level].shapes)
          expect(pathCell(L.bed, level, o), `${tag} ${o.rows}x${o.columns}`).toBeGreaterThanOrEqual(MIN_CELL);
      }
  });
});
