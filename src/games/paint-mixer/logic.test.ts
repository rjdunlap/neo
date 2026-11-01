import { describe, it, expect } from 'vitest';
import { Rng } from '../../engine/random';
import { swatch } from '../../art/palette';
import {
  POTS, POT_COLOR, PAIRS, LEVELS, CAP, SOLVE_STEPS, planFor, makeRound, total, sizeFor, countsOf, sampleCounts, mix, distance,
  rows, completeBatches, lastIsLoose, check, glowFor, follow, solveFrom, layout, dropAt, emptyCounts,
  batchesFor, maxMultiple, potsFor, nearestMultiple, picture, ratioTable, aimFor, limitFor,
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
    const ratios = [1, 2, 3, 4].flatMap((l) => planFor(l).pool.map((c) => c));
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

// ---- levels 3 (fill to the line) and 4 (any amount, two ways) ----

describe('levels 3-4: pools, rounds and pots', () => {
  const WIDE = [[1, 2], [2, 1], [1, 3], [3, 1], [2, 3], [3, 2]];
  for (const level of [3, 4]) {
    it(`level ${level}: samples come from the wide pool with a stray pot, deterministically`, () => {
      const plan = planFor(level);
      for (const seed of SEEDS) {
        const round = makeRound(level, new Rng(seed));
        expect(round).toHaveLength(level === 3 ? 2 : 1);
        if (level === 3) expect(same(round[0].pair, round[1].pair)).toBe(false);
        for (const s of round) {
          expect(PAIRS.some((p) => same(p.pair, s.pair))).toBe(true);
          expect(WIDE.some((c) => c[0] === s.counts[0] && c[1] === s.counts[1])).toBe(true);
          expect(s.stray).toBeDefined();
          expect(s.pair).not.toContain(s.stray);
          expect(POTS).toContain(s.stray);
          expect([0, 1, 2]).toContain(s.strayAt);
          const pots = potsFor(s);
          expect(pots).toHaveLength(3);
          expect(new Set(pots).size).toBe(3);
          expect(pots).toContain(s.stray);
          expect(pots.filter((p) => p !== s.stray)).toEqual([s.pair[0], s.pair[1]]);
          expect(pots[s.strayAt!]).toBe(s.stray);
          expect(maxMultiple(s)).toBeGreaterThanOrEqual(2);
          if (level === 3) {
            const n = batchesFor(plan, s);
            expect(n).toBe(total(s) >= 5 ? 2 : 3);
            expect(sizeFor(plan, s)).toBe({ 3: 9, 4: 12, 5: 10 }[total(s)]);
            expect(sizeFor(plan, s)).toBeLessThanOrEqual(CAP);
            expect(sizeFor(plan, s) % total(s)).toBe(0);
          } else {
            expect(batchesFor(plan, s)).toBe(Infinity);
          }
        }
        expect(makeRound(level, new Rng(seed))).toEqual(round);
      }
    });
  }
  it('levels 1-2 have no stray and two pots', () => {
    for (const level of [1, 2]) for (const seed of SEEDS) for (const s of makeRound(level, new Rng(seed))) {
      expect(s.stray).toBeUndefined();
      expect(s.strayAt).toBeUndefined();
      expect(potsFor(s)).toEqual([s.pair[0], s.pair[1]]);
    }
  });
});

describe('levels 3-4: check', () => {
  const nearest = (s: Sample, v: Counts, done: number | null) => {
    let best = 0, gap = Infinity;
    for (let k = 1; k <= maxMultiple(s); k++) {
      if (k === done) continue;
      const d = Math.abs(v[s.pair[0]] - k * s.counts[0]) + Math.abs(v[s.pair[1]] - k * s.counts[1]);
      if (d < gap) { best = k; gap = d; }
    }
    return best;
  };
  /** An independent statement of the rule. */
  function expected(level: number, s: Sample, v: Counts, done: number | null) {
    const plan = planFor(level);
    const [pa, pb] = s.pair;
    const stray = POTS.find((p) => p !== pa && p !== pb && v[p] > 0);
    const a = v[pa], b = v[pb];
    const mult = !stray && a > 0 && a % s.counts[0] === 0 && b % s.counts[1] === 0 && a / s.counts[0] === b / s.counts[1] ? a / s.counts[0] : null;
    if (level === 3) {
      const n = batchesFor(plan, s);
      if (mult === n) return { kind: 'match' };
      if (mult !== null && mult < n) return { kind: 'moreSameWay' };
    } else if (mult !== null) {
      return mult === done ? { kind: 'sameWay' } : { kind: 'match' };
    }
    if (stray) return { kind: 'wrong', pot: stray, direction: 'stray' };
    if (a === 0 && b === 0) return { kind: 'wrong', pot: pa, direction: 'short' };
    const times = level === 3 ? batchesFor(plan, s) : nearest(s, v, done);
    const want = [a - times * s.counts[0], b - times * s.counts[1]];
    const i = Math.abs(want[1]) > Math.abs(want[0]) ? 1 : 0;
    return { kind: 'wrong', pot: s.pair[i], direction: want[i] > 0 ? 'too-many' : 'short' };
  }
  it('level 3: every count vector gets the rule-stated verdict', () => {
    for (const s of allSamples(3)) for (const v of vectors(12)) {
      expect(check(planFor(3), s, v), `${JSON.stringify(s)} ${JSON.stringify(v)}`).toEqual(expected(3, s, v, null));
    }
  });
  it('level 3: match exactly at the line, moreSameWay below it, never a miss for them', () => {
    const s: Sample = { pair: ['red', 'blue'], counts: [1, 2] };
    const c = (red: number, blue: number, white = 0): Counts => ({ red, yellow: 0, blue, white });
    expect(check(planFor(3), s, c(3, 6)).kind).toBe('match');
    expect(check(planFor(3), s, c(1, 2)).kind).toBe('moreSameWay');
    expect(check(planFor(3), s, c(2, 4)).kind).toBe('moreSameWay');
    expect(check(planFor(3), s, c(3, 6, 1))).toEqual({ kind: 'wrong', pot: 'white', direction: 'stray' });
    expect(check(planFor(3), s, c(3, 5))).toEqual({ kind: 'wrong', pot: 'blue', direction: 'short' });
    expect(check(planFor(3), s, c(4, 6))).toEqual({ kind: 'wrong', pot: 'red', direction: 'too-many' });
  });
  it('level 4: first way any multiple, second way a different one; every vector and done', () => {
    for (const s of allSamples(4)) for (const done of [null, ...Array.from({ length: maxMultiple(s) }, (_, i) => i + 1)]) for (const v of vectors(12)) {
      const got = check(planFor(4), s, v, done);
      expect(got.kind).not.toBe('moreSameWay');
      expect(got, `${JSON.stringify(s)} ${JSON.stringify(v)} done=${done}`).toEqual(expected(4, s, v, done));
    }
  });
  it('level 4: sameWay is not a miss kind, and nearestMultiple follows the summed-difference reading', () => {
    const s: Sample = { pair: ['red', 'white'], counts: [1, 2] };
    const c = (red: number, white: number): Counts => ({ red, yellow: 0, blue: 0, white });
    expect(check(planFor(4), s, c(2, 4), 2)).toEqual({ kind: 'sameWay' });
    expect(check(planFor(4), s, c(2, 4), 1)).toEqual({ kind: 'match' });
    expect(check(planFor(4), s, c(0, 0), null)).toEqual({ kind: 'wrong', pot: 'red', direction: 'short' });
    for (const sm of allSamples(4)) for (const done of [null, 1, 2]) for (const v of vectors(12)) {
      const k = nearestMultiple(sm, v, done);
      expect(k).toBe(nearest(sm, v, done));
      expect(k).toBeGreaterThanOrEqual(1);
      expect(k).toBeLessThanOrEqual(maxMultiple(sm));
      expect(k).not.toBe(done);
    }
    // a tie goes to the smaller multiple: (1,2) vs 1 copy (3,6)? 1x gap 2+4... use midway (2,3): |2-1|+|3-2| = 2, |2-2|+|3-4| = 1
    expect(nearestMultiple(s, c(2, 3))).toBe(2);
    expect(nearestMultiple(s, c(1, 3), null)).toBe(1); // |1-1|+|3-2| = 1 vs |1-2|+|3-4| = 2
    expect(nearestMultiple({ pair: ['red', 'white'], counts: [1, 1] }, c(3, 0))).toBe(1); // equal gaps 2 and 2? 1x:2+1=3, 2x:1+2=3 -> smaller
  });
});

describe('levels 3-4: help', () => {
  const walk = (level: number, s: Sample, v: Counts, first: boolean, done: number | null) => {
    const plan = planFor(level);
    let state = dropsFor(v, s, first);
    let reached = false, longest = state.length;
    // at most 2 × CAP moves (every drop out, a full bucket back), then the glow reads 'check': SOLVE_STEPS readings
    for (let i = 0; i < SOLVE_STEPS && !reached; i++) {
      const g = glowFor(plan, s, state, done);
      if (g.at === 'check') reached = true; else state = follow(g, state);
      longest = Math.max(longest, state.length);
    }
    return { reached, state, longest };
  };
  it('level 3: following the glow reaches a match within SOLVE_STEPS, never past the cap', () => {
    const all = vectors(12);
    const bad: string[] = [];
    for (const s of allSamples(3)) for (const v of all) for (const first of [true, false]) {
      const r = walk(3, s, v, first, null);
      const why = `${JSON.stringify(s)} ${dropsFor(v, s, first).join()}`;
      if (!r.reached) bad.push(`unreached ${why}`);
      else if (r.longest > CAP) bad.push(`past cap ${why}`);
      else if (check(planFor(3), s, countsOf(r.state)).kind !== 'match') bad.push(`no match ${why}`);
    }
    expect(bad.slice(0, 5), `${bad.length} failing starts`).toEqual([]);
  });
  it('level 4: following the glow reaches a match (a different amount when done) within SOLVE_STEPS, never past the cap', () => {
    const all = vectors(12);
    for (const s of allSamples(4)) for (const done of [null, ...Array.from({ length: maxMultiple(s) }, (_, i) => i + 1)]) for (const v of all) for (const first of [true, false]) {
      const r = walk(4, s, v, first, done);
      const why = `${JSON.stringify(s)} done=${done} ${dropsFor(v, s, first).join()}`;
      expect(r.reached, why).toBe(true);
      expect(r.longest, why).toBeLessThanOrEqual(CAP);
      expect(check(planFor(4), s, countsOf(r.state), done).kind, why).toBe('match');
    }
  });
  it('solveFrom (the ghost pour) never throws, even from a bucket of twelve stray drops', () => {
    for (const level of [3, 4]) for (const s of allSamples(level)) {
      const stray = POTS.find((p) => p !== s.pair[0] && p !== s.pair[1])!;
      const steps = solveFrom(planFor(level), s, Array<Pot>(CAP).fill(stray));
      expect(steps[steps.length - 1]).toEqual({ at: 'check' });
      expect(steps.length).toBeLessThanOrEqual(SOLVE_STEPS);
    }
  });
  it('solveFrom empty ends at check and matches; level 4 aims at 1 copy, then at 2 when 1 is done', () => {
    for (const level of [3, 4]) for (const s of allSamples(level)) {
      const plan = planFor(level);
      for (const done of level === 3 ? [null] : [null, 1]) {
        let state: Pot[] = [];
        const steps = solveFrom(plan, s, state, done);
        expect(steps[steps.length - 1]).toEqual({ at: 'check' });
        for (const g of steps) state = follow(g, state);
        expect(check(plan, s, countsOf(state), done).kind).toBe('match');
        const copies = level === 3 ? batchesFor(plan, s) : done === null ? 1 : 2;
        expect(countsOf(state)).toEqual({ ...emptyCounts(), [s.pair[0]]: copies * s.counts[0], [s.pair[1]]: copies * s.counts[1] });
        expect(limitFor(plan, s, emptyCounts(), done)).toBe(level === 3 ? batchesFor(plan, s) : copies);
      }
    }
    expect(aimFor(allSamples(4)[0], emptyCounts(), null)).toBe(1);
  });
});

describe('levels 3-4: picture and ratio table', () => {
  const rowsOf = (level: number, s: Sample, v: Counts) => rows(s, v, batchesFor(planFor(level), s));
  for (const level of [1, 2, 3, 4]) {
    it(`level ${level}: every drop sits inside the bucket, apart, and the counts add up`, () => {
      const plan = planFor(level);
      for (const s of allSamples(level)) for (const v of vectors(12)) {
        const pic = picture(plan, s, v);
        const why = `${JSON.stringify(s)} ${JSON.stringify(v)}`;
        const bad: string[] = [];
        for (const d of pic.drops) if (Math.abs(d.x) > 125 || d.y < -105 || d.y > 130) bad.push(`out of bucket ${JSON.stringify(d)}`);
        for (let i = 0; i < pic.drops.length; i++) for (let j = i + 1; j < pic.drops.length; j++) {
          if (Math.hypot(pic.drops[i].x - pic.drops[j].x, pic.drops[i].y - pic.drops[j].y) < 30) bad.push(`too close ${i} ${j}`);
        }
        const r = rowsOf(level, s, v);
        const inRows = r.rows.flat();
        if (pic.drops.filter((d) => d.filled && !d.loose).length !== inRows.filter((p) => p.filled).length) bad.push('filled count');
        if (pic.drops.filter((d) => d.loose).length !== r.loose.length) bad.push('loose count');
        if (level >= 3 && pic.drops.filter((d) => !d.filled).length !== inRows.filter((p) => !p.filled).length) bad.push('unfilled count');
        if (level === 3) {
          if (pic.line === null) bad.push('no line');
          else for (const d of pic.drops) if (d.loose ? d.y >= pic.line : d.y <= pic.line) bad.push(`line ${pic.line} vs ${JSON.stringify(d)}`);
        } else if (pic.line !== null) bad.push('unexpected line');
        if (bad.length) expect(bad, why).toEqual([]);
      }
    });
  }
  it('levels 3-4 draw no places for rows that have not started', () => {
    for (const level of [3, 4]) {
      const plan = planFor(level);
      for (const s of allSamples(level)) {
        for (const v of vectors(12)) {
          const r = rowsOf(level, s, v);
          const pic = picture(plan, s, v);
          const unfilled = pic.drops.filter((d) => !d.filled).length;
          // only the one started row can have empty places
          expect(unfilled).toBeLessThanOrEqual(total(s) - 1);
          r.rows.slice(0, -1).forEach((row) => expect(row.every((p) => p.filled)).toBe(true));
        }
        const top = level === 3 ? batchesFor(plan, s) : maxMultiple(s);
        for (let k = 0; k <= top; k++) {
          const v = { ...emptyCounts(), [s.pair[0]]: k * s.counts[0], [s.pair[1]]: k * s.counts[1] };
          const pic = picture(plan, s, v);
          expect(pic.drops.filter((d) => !d.filled)).toHaveLength(0);
          expect(pic.drops).toHaveLength(k * total(s));
        }
      }
    }
  });
  for (const level of [3, 4]) {
    it(`level ${level}: the ratio table has the right columns, values and filled count`, () => {
      const plan = planFor(level);
      for (const s of allSamples(level)) {
        const cols = level === 3 ? batchesFor(plan, s) : maxMultiple(s);
        for (const v of vectors(12)) {
          const t = ratioTable(plan, s, v);
          expect(t.columns).toBe(cols);
          expect(t.values).toHaveLength(cols);
          t.values.forEach((val, k) => expect(val).toEqual([(k + 1) * s.counts[0], (k + 1) * s.counts[1]]));
          expect(t.filled).toBe(Math.min(cols, completeBatches(s, v)));
          // a stray drop never fills a column
          const stray = POTS.find((p) => p !== s.pair[0] && p !== s.pair[1])!;
          expect(ratioTable(plan, s, { ...v, [stray]: v[stray] + 1 }).filled).toBe(t.filled);
        }
        for (let c = 1; c <= cols; c++) {
          const full = { ...emptyCounts(), [s.pair[0]]: c * s.counts[0], [s.pair[1]]: c * s.counts[1] };
          expect(ratioTable(plan, s, full).filled).toBe(c);
          expect(ratioTable(plan, s, { ...full, [s.pair[0]]: full[s.pair[0]] - 1 }).filled).toBe(c - 1);
          expect(ratioTable(plan, s, { ...full, [s.pair[1]]: full[s.pair[1]] - 1 }).filled).toBe(c - 1);
        }
        if (level === 3) {
          // drops past the line are loose and never raise it
          const n = batchesFor(plan, s);
          const over = { ...emptyCounts(), [s.pair[0]]: (n + 1) * s.counts[0], [s.pair[1]]: (n + 1) * s.counts[1] };
          expect(ratioTable(plan, s, over).filled).toBe(n);
        }
      }
    });
  }
});

describe('levels 3-4: layout with three pots and the table', () => {
  const views = [{ w: 1024, h: 768 }, { w: 768, h: 1024 }, { w: 1024, h: 700 }, { w: 700, h: 1024 }];
  const hit = (a: Box, x0: number, y0: number, x1: number, y1: number) => a.x - a.w / 2 < x1 && a.x + a.w / 2 > x0 && a.y - a.h / 2 < y1 && a.y + a.h / 2 > y0;
  const overlap = (a: Box, b: Box) => hit(a, b.x - b.w / 2, b.y - b.h / 2, b.x + b.w / 2, b.y + b.h / 2);
  for (const v of views) {
    it(`${v.w}x${v.h}: three pots and the table fit and stay clear`, () => {
      const l = layout(v, 3);
      expect(l.pots).toHaveLength(3);
      for (const b of [l.undo, l.tip, l.check, ...l.pots, l.jar]) {
        expect(b.w).toBeGreaterThanOrEqual(100);
        expect(b.h).toBeGreaterThanOrEqual(100);
        expect(b.x - b.w / 2).toBeGreaterThanOrEqual(0);
        expect(b.y - b.h / 2).toBeGreaterThanOrEqual(0);
        expect(b.x + b.w / 2).toBeLessThanOrEqual(v.w);
        expect(b.y + b.h / 2).toBeLessThanOrEqual(v.h);
        expect(hit(b, 0, v.h - 170, 170, v.h)).toBe(false);
        expect(hit(b, 0, 0, 120, 120)).toBe(false);
        expect(hit(b, v.w - 120, 0, v.w, 120)).toBe(false);
      }
      for (const o of [l.undo, l.tip, l.check, ...l.pots]) expect(overlap(l.bucket, o)).toBe(false);
      for (let i = 0; i < 3; i++) for (let j = i + 1; j < 3; j++) expect(overlap(l.pots[i], l.pots[j])).toBe(false);
      const t = l.table;
      expect(t.x - t.w / 2).toBeGreaterThanOrEqual(0);
      expect(t.y - t.h / 2).toBeGreaterThanOrEqual(0);
      expect(t.x + t.w / 2).toBeLessThanOrEqual(v.w);
      expect(t.y + t.h / 2).toBeLessThanOrEqual(v.h);
      expect(hit(t, 0, v.h - 170, 170, v.h)).toBe(false);
      expect(hit(t, 0, 0, 120, 120)).toBe(false);
      expect(hit(t, v.w - 120, 0, v.w, 120)).toBe(false);
      for (const o of [l.bucket, l.jar, l.undo, l.tip, l.check, ...l.pots]) expect(overlap(t, o), JSON.stringify(o)).toBe(false);
    });
  }
});
