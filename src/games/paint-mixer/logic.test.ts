import { describe, it, expect } from 'vitest';
import { Rng } from '../../engine/random';
import { swatch } from '../../art/palette';
import {
  POTS, POT_COLOR, PAIRS, LEVELS, CAP, planFor, makeRound, total, sizeFor, countsOf, sampleCounts, mix, distance,
  rows, completeBatches, lastIsLoose, check, glowFor, follow, solveFrom, layout, dropAt, emptyCounts,
  type Pot, type Sample, type Counts, type Box,
} from './logic';

const SEEDS = Array.from({ length: 300 }, (_, i) => i * 7919 + 1);
const same = (a: readonly Pot[], b: readonly Pot[]) => a[0] === b[0] && a[1] === b[1];
const allSamples = (level: number): Sample[] =>
  PAIRS.flatMap(({ pair }) => planFor(level).pool.map((c): Sample => ({ pair, counts: [c[0], c[1]] })));
/** Every count vector over the four pots with at most `max` drops. */
function vectors(max: number): Counts[] {
  const out: Counts[] = [];
  for (let r = 0; r <= max; r++) for (let y = 0; r + y <= max; y++) for (let b = 0; r + y + b <= max; b++) for (let w = 0; r + y + b + w <= max; w++) out.push({ red: r, yellow: y, blue: b, white: w });
  return out;
}
/** Drops grouped by pot, the sample's pair first or last. */
function dropsFor(c: Counts, s: Sample, pairFirst: boolean): Pot[] {
  const inPair = POTS.filter((p) => p === s.pair[0] || p === s.pair[1]);
  const others = POTS.filter((p) => !inPair.includes(p));
  return (pairFirst ? [...inPair, ...others] : [...others, ...inPair]).flatMap((p) => Array<Pot>(c[p]).fill(p));
}

describe('colour', () => {
  it('pots equal the palette swatches', () => {
    for (const p of POTS) expect(POT_COLOR[p]).toBe(swatch[p].fill);
  });
  it('equal ratios mix to the identical colour', () => {
    const ratios = [1, 2].flatMap((l) => planFor(l).pool.map((c) => c));
    for (const { pair } of PAIRS) for (const r of ratios) {
      const base = emptyCounts(); base[pair[0]] = r[0]; base[pair[1]] = r[1];
      for (let k = 1; k <= 12; k++) {
        const big = emptyCounts(); big[pair[0]] = k * r[0]; big[pair[1]] = k * r[1];
        expect(mix(big)).toBe(mix(base));
      }
    }
  });
  it('authored pairs are not blue+yellow or yellow+white', () => {
    expect(PAIRS.some(({ pair }) => pair.includes('blue') && pair.includes('yellow'))).toBe(false);
    expect(PAIRS.some(({ pair }) => pair.includes('yellow') && pair.includes('white'))).toBe(false);
  });
  it('near ratios look different enough', () => {
    for (const { pair } of PAIRS) {
      const m = (a: number, b: number) => { const c = emptyCounts(); c[pair[0]] = a; c[pair[1]] = b; return mix(c)!; };
      expect(distance(m(1, 2), m(2, 3))).toBeGreaterThanOrEqual(1.5);
      expect(distance(m(1, 2), m(1, 1))).toBeGreaterThanOrEqual(4);
    }
  });
  it('distance to self is 0 and the empty bucket has no colour', () => {
    expect(distance(0xf2545b, 0xf2545b)).toBe(0);
    expect(mix(emptyCounts())).toBeUndefined();
  });
});

describe('pools, sizes and rounds', () => {
  it('levels 1-4 are planned', () => expect(LEVELS).toEqual({ school: { min: 1, max: 4 } }));
  for (const level of [1, 2]) {
    it(`level ${level}: samples come from the pool, sizes are whole multiples within the cap`, () => {
      const plan = planFor(level);
      expect(plan.level).toBe(level);
      for (const seed of SEEDS) {
        const round = makeRound(level, new Rng(seed));
        expect(round).toHaveLength(2);
        expect(same(round[0].pair, round[1].pair)).toBe(false);
        for (const s of round) {
          expect(PAIRS.some((p) => same(p.pair, s.pair))).toBe(true);
          expect(plan.pool.some((c) => c[0] === s.counts[0] && c[1] === s.counts[1])).toBe(true);
          const size = sizeFor(plan, s);
          expect(size % total(s)).toBe(0);
          expect(size).toBeLessThanOrEqual(CAP);
          if (level === 2) expect(size).toBe(2 * total(s));
        }
        expect(makeRound(level, new Rng(seed))).toEqual(round);
      }
    });
  }
});

describe('rows', () => {
  const samples: Sample[] = [
    { pair: ['red', 'yellow'], counts: [1, 2] }, { pair: ['blue', 'white'], counts: [2, 1] },
    { pair: ['red', 'blue'], counts: [1, 1] }, { pair: ['red', 'white'], counts: [1, 3] },
  ];
  const all = vectors(12);
  for (const limit of [1, 2, 6, Infinity]) {
    it(`limit ${limit}: in ratio iff a positive whole multiple within the limit; loose and complete follow the shares`, () => {
      for (const s of samples) for (const c of all) {
        const r = rows(s, c, limit);
        const [pa, pb] = s.pair;
        const k = Math.min(completeBatches(s, c), limit);
        expect(r.complete).toBe(k);
        expect(completeBatches(s, c)).toBe(Math.min(Math.floor(c[pa] / s.counts[0]), Math.floor(c[pb] / s.counts[1])));
        const unfilled = r.rows.some((row) => row.some((p) => !p.filled));
        const mult = c[pa] % s.counts[0] === 0 && c[pb] % s.counts[1] === 0 && c[pa] / s.counts[0] === c[pb] / s.counts[1]
          && POTS.every((p) => p === pa || p === pb || c[p] === 0);
        const kk = c[pa] / s.counts[0];
        const inRatio = !unfilled && r.loose.length === 0 && r.rows.length > 0;
        expect(inRatio).toBe(mult && kk > 0 && kk <= limit);
        const allowed = (i: 0 | 1) => Math.min(k + 1, limit) * s.counts[i];
        const expectLoose = Math.max(0, c[pa] - allowed(0)) + Math.max(0, c[pb] - allowed(1))
          + POTS.filter((p) => p !== pa && p !== pb).reduce((n, p) => n + c[p], 0);
        expect(r.loose.length).toBe(expectLoose);
        expect(rows(s, c, limit)).toEqual(r);
      }
    });
  }
});

describe('check', () => {
  const s: Sample = { pair: ['red', 'yellow'], counts: [1, 2] };
  const c = (red: number, yellow: number, blue = 0, white = 0): Counts => ({ red, yellow, blue, white });
  it('matches exactly batches x sample; moreSameWay only at level 2 for one copy', () => {
    expect(check(planFor(1), s, c(1, 2)).kind).toBe('match');
    expect(check(planFor(1), s, c(2, 4))).toMatchObject({ kind: 'wrong' });
    expect(check(planFor(2), s, c(2, 4)).kind).toBe('match');
    expect(check(planFor(2), s, c(1, 2)).kind).toBe('moreSameWay');
    expect(check(planFor(2), s, c(3, 6)).kind).toBe('wrong');
    for (const v of vectors(12)) {
      const k = check(planFor(1), s, v);
      expect(k.kind === 'match').toBe(v.red === 1 && v.yellow === 2 && !v.blue && !v.white);
      expect(k.kind).not.toBe('moreSameWay');
      const j = check(planFor(2), s, v);
      expect(j.kind === 'moreSameWay').toBe(v.red === 1 && v.yellow === 2 && !v.blue && !v.white);
    }
  });
  it('names the culprit', () => {
    expect(check(planFor(1), s, c(1, 2, 0, 1))).toEqual({ kind: 'wrong', pot: 'white', direction: 'stray' });
    expect(check(planFor(1), s, c(2, 2))).toEqual({ kind: 'wrong', pot: 'red', direction: 'too-many' });
    expect(check(planFor(1), s, c(1, 1))).toEqual({ kind: 'wrong', pot: 'yellow', direction: 'short' });
    expect(check(planFor(1), s, c(0, 1))).toEqual({ kind: 'wrong', pot: 'red', direction: 'short' });
    expect(check(planFor(1), s, c(0, 1)).kind).toBe('wrong');
    expect(check(planFor(1), s, c(2, 1))).toEqual({ kind: 'wrong', pot: 'red', direction: 'too-many' }); // tie goes to A
    expect(check(planFor(1), s, c(0, 0))).toEqual({ kind: 'wrong', pot: 'red', direction: 'short' });
  });
});

describe('help', () => {
  const s: Sample = { pair: ['red', 'yellow'], counts: [1, 2] };
  it('glow targets', () => {
    expect(glowFor(planFor(1), s, ['red', 'yellow', 'yellow'])).toEqual({ at: 'check' });
    expect(glowFor(planFor(1), s, ['red', 'blue'])).toEqual({ at: 'undo' });
    expect(glowFor(planFor(1), s, ['blue', 'red'])).toEqual({ at: 'tip' });
    expect(glowFor(planFor(1), s, ['red'])).toEqual({ at: 'pot', pot: 'yellow' });
    expect(lastIsLoose(s, ['red', 'red'], 1)).toBe(true);
  });
  for (const level of [1, 2]) {
    it(`level ${level}: following the glow reaches a match from every reachable state`, () => {
      const plan = planFor(level);
      const all = vectors(12);
      for (const s of allSamples(level)) for (const v of all) for (const first of [true, false]) {
        const start = dropsFor(v, s, first);
        let state = start;
        let done = false;
        for (let i = 0; i < 24 && !done; i++) {
          const g = glowFor(plan, s, state);
          if (g.at === 'check') done = true; else state = follow(g, state);
        }
        expect(done, `${JSON.stringify(s)} ${start.join()}`).toBe(true);
        expect(check(plan, s, countsOf(state)).kind).toBe('match');
      }
    });
    it(`level ${level}: solveFrom ends at check and yields a match`, () => {
      const plan = planFor(level);
      for (const s of allSamples(level)) {
        let state: Pot[] = [];
        const steps = solveFrom(plan, s, state);
        expect(steps[steps.length - 1]).toEqual({ at: 'check' });
        for (const g of steps) state = follow(g, state);
        expect(check(plan, s, countsOf(state)).kind).toBe('match');
        expect(countsOf(state)).toEqual({ ...sampleCounts(s), ...Object.fromEntries(s.pair.map((p, i) => [p, s.counts[i] * plan.batches])) });
      }
    });
  }
});

describe('layout', () => {
  const views = [{ w: 1024, h: 768 }, { w: 768, h: 1024 }, { w: 1024, h: 700 }, { w: 700, h: 1024 }];
  const hit = (a: Box, x0: number, y0: number, x1: number, y1: number) => a.x - a.w / 2 < x1 && a.x + a.w / 2 > x0 && a.y - a.h / 2 < y1 && a.y + a.h / 2 > y0;
  const overlap = (a: Box, b: Box) => hit(a, b.x - b.w / 2, b.y - b.h / 2, b.x + b.w / 2, b.y + b.h / 2);
  for (const v of views) {
    it(`${v.w}x${v.h}: boxes are big, inside, and clear of corners`, () => {
      const l = layout(v, 2);
      const inputs = [l.undo, l.tip, l.check, ...l.pots, l.jar];
      for (const b of inputs) {
        expect(b.w).toBeGreaterThanOrEqual(100);
        expect(b.h).toBeGreaterThanOrEqual(100);
        expect(b.x - b.w / 2).toBeGreaterThanOrEqual(0);
        expect(b.y - b.h / 2).toBeGreaterThanOrEqual(0);
        expect(b.x + b.w / 2).toBeLessThanOrEqual(v.w);
        expect(b.y + b.h / 2).toBeLessThanOrEqual(v.h);
        expect(hit(b, 0, v.h - 170, 170, v.h)).toBe(false);
        expect(hit(b, 0, 0, 120, 120)).toBe(false);
      }
      for (const p of l.pots) expect(p.w).toBeGreaterThanOrEqual(120);
      for (const o of [l.undo, l.tip, l.check, ...l.pots]) expect(overlap(l.bucket, o)).toBe(false);
      expect(l.bucket.w).toBe(320);
      expect(l.portrait).toBe(v.h > v.w);
      if (l.portrait) {
        expect(l.bucket.y - l.bucket.h / 2).toBeGreaterThanOrEqual(l.jar.y + l.jar.h / 2);
        for (const b of [l.undo, l.tip, l.check]) expect(b.y - b.h / 2).toBeGreaterThanOrEqual(l.bucket.y + l.bucket.h / 2);
      }
    });
  }
  it('twelve drops in rows of three stay apart and inside the bucket', () => {
    const pts = Array.from({ length: 12 }, (_, i) => dropAt(Math.floor(i / 3), i % 3, 3, 4));
    for (let i = 0; i < pts.length; i++) {
      expect(Math.abs(pts[i].x)).toBeLessThanOrEqual(130);
      expect(Math.abs(pts[i].y)).toBeLessThanOrEqual(130);
      for (let j = i + 1; j < pts.length; j++) expect(Math.hypot(pts[i].x - pts[j].x, pts[i].y - pts[j].y)).toBeGreaterThanOrEqual(30);
    }
  });
});
