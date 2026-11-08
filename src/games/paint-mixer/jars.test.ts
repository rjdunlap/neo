import { describe, it, expect } from 'vitest';
import { Rng } from '../../engine/random';
import { JAR_H, JAR_W, PAIRS, planFor, LEVELS, type Box } from './logic';
import {
  JARS,
  JAR_BASES,
  LID,
  inLid,
  makeJarRound,
  multipleOfBase,
  reveal,
  checkJars,
  firstWrong,
  namedJar,
  finishTaps,
  matchingSet,
  layoutJars,
} from './jars';

const SEEDS = Array.from({ length: 300 }, (_, i) => i * 7919 + 1);
const cases = SEEDS.flatMap((seed) => makeJarRound(new Rng(seed)));
const subsets = Array.from({ length: 16 }, (_, m) => [0, 1, 2, 3].map((i) => !!(m & (1 << i))));

describe('level 6: plan', () => {
  it('is a jars plan, the top of the school window', () => {
    expect(planFor(6).kind).toBe('jars');
    expect(LEVELS.school!.max).toBe(6);
  });
  it('same seed, same round', () => {
    for (const seed of SEEDS.slice(0, 40))
      expect(makeJarRound(new Rng(seed))).toEqual(makeJarRound(new Rng(seed)));
  });
});

describe('level 6: jar cases', () => {
  it('four distinct labels, counts 1-12, one to three matching and non-matching', () => {
    for (const c of cases) {
      expect(c.jars).toHaveLength(JARS);
      const labels = new Set(c.jars.map((j) => j.label.join(':')));
      expect(labels.size).toBe(4);
      for (const j of c.jars)
        for (const n of j.label) {
          expect(n).toBeGreaterThanOrEqual(1);
          expect(n).toBeLessThanOrEqual(12);
          expect(Number.isInteger(n)).toBe(true);
        }
      const m = c.jars.filter((j) => j.k !== null).length;
      expect(m).toBeGreaterThanOrEqual(1);
      expect(m).toBeLessThanOrEqual(3);
      expect(JARS - m).toBeGreaterThanOrEqual(1);
      expect(JARS - m).toBeLessThanOrEqual(3);
      expect(JAR_BASES.some((b) => b[0] === c.base[0] && b[1] === c.base[1])).toBe(true);
      expect(c.base[0] + c.base[1]).toBeLessThanOrEqual(5);
    }
  });
  it('matching jars are k x base with distinct k in 1..4 (k = 1 at most once); non-matches are unequal and have a kind', () => {
    for (const c of cases) {
      const ks = c.jars.filter((j) => j.k !== null).map((j) => j.k!);
      expect(new Set(ks).size).toBe(ks.length);
      for (const j of c.jars) {
        if (j.k !== null) {
          expect(j.k).toBeGreaterThanOrEqual(1);
          expect(j.k).toBeLessThanOrEqual(4);
          expect(j.label).toEqual([j.k * c.base[0], j.k * c.base[1]]);
          expect(j.kind).toBeNull();
          expect(multipleOfBase(c.base, j.label)).toBe(j.k);
        } else {
          expect(j.label[0] * c.base[1]).not.toBe(j.label[1] * c.base[0]);
          expect(['half-right', 'added', 'swapped']).toContain(j.kind);
          expect(multipleOfBase(c.base, j.label)).toBeNull();
        }
      }
    }
  });
  it('all kinds and several positions of the matching jars occur', () => {
    expect(new Set(cases.flatMap((c) => c.jars.map((j) => j.kind))).size).toBe(4);
    expect(new Set(cases.map((c) => matchingSet(c).join())).size).toBeGreaterThan(10);
  });
  it('a round has two cases with different pairs', () => {
    for (const seed of SEEDS) {
      const r = makeJarRound(new Rng(seed));
      expect(r).toHaveLength(2);
      expect(r[0].pair).not.toEqual(r[1].pair);
      for (const c of r)
        expect(PAIRS.some((p) => p.pair[0] === c.pair[0] && p.pair[1] === c.pair[1])).toBe(true);
    }
  });
  it('multipleOfBase needs equal cross-products and a whole factor', () => {
    expect(multipleOfBase([2, 3], [6, 9])).toBe(3);
    expect(multipleOfBase([2, 3], [3, 4.5])).toBeNull();
    expect(multipleOfBase([2, 3], [3, 5])).toBeNull();
    expect(multipleOfBase([2, 3], [3, 2])).toBeNull();
  });
});

describe('level 6: check', () => {
  it('exactly one correct set over all 16 subsets', () => {
    for (const c of cases) {
      const wins = subsets.filter((s) => checkJars(c, s).kind === 'match');
      expect(wins).toEqual([matchingSet(c)]);
    }
  });
  it('empty choice is empty; the leftmost wrong jar is named with its way', () => {
    for (const c of cases) {
      expect(checkJars(c, [false, false, false, false])).toEqual({ kind: 'empty' });
      for (const s of subsets) {
        const v = checkJars(c, s);
        if (!s.some(Boolean)) continue;
        const want = c.jars.findIndex((j, i) => (j.k !== null) !== s[i]);
        if (want < 0) {
          expect(v.kind).toBe('match');
          continue;
        }
        expect(v).toEqual({
          kind: 'wrong',
          jar: want,
          way: c.jars[want].k === null ? 'not-same' : 'one-more',
        });
        expect(firstWrong(c, s)).toBe(want);
      }
    }
  });
});

describe('level 6: reveal', () => {
  it('fills for every match, and circles a break for every non-match', () => {
    for (const c of cases)
      for (const j of c.jars) {
        const r = reveal(c.base, j.label);
        if (j.k !== null) {
          expect(r).toEqual({ kind: 'fills', k: j.k });
          continue;
        }
        const k1 = j.label[0] / c.base[0];
        const whole = Number.isInteger(k1) && k1 >= 1 && k1 <= 4;
        expect(r.kind).toBe(whole ? 'second' : 'first');
        if (r.kind === 'second') {
          expect(r.k).toBe(k1);
          expect(r.expected).toBe(k1 * c.base[1]);
          expect(r.expected).not.toBe(j.label[1]);
        }
      }
  });
  it('both circle kinds occur', () => {
    const kinds = new Set(cases.flatMap((c) => c.jars.map((j) => reveal(c.base, j.label).kind)));
    expect([...kinds].sort()).toEqual(['fills', 'first', 'second']);
  });
});

describe('level 6: help', () => {
  it('names the leftmost wrong jar, else the first matching jar', () => {
    for (const c of cases)
      for (const s of subsets) {
        const i = namedJar(c, s);
        const w = firstWrong(c, s);
        if (w >= 0) expect(i).toBe(w);
        else expect(i).toBe(c.jars.findIndex((j) => j.k !== null));
        expect(i).toBeGreaterThanOrEqual(0);
      }
  });
  it('from every subset, the finish taps reach the match (and only wrong jars are toggled)', () => {
    for (const c of cases)
      for (const s of subsets) {
        const taps = finishTaps(c, s);
        const after = s.slice();
        for (const i of taps) after[i] = !after[i];
        expect(checkJars(c, after).kind).toBe('match');
        expect(new Set(taps).size).toBe(taps.length);
        expect(taps).toEqual([...taps].sort((a, b) => a - b));
        if (checkJars(c, s).kind === 'match') expect(taps).toEqual([]);
      }
  });
});

describe('level 6: layout', () => {
  const views = [
    { w: 1024, h: 768 },
    { w: 768, h: 1024 },
    { w: 1024, h: 700 },
    { w: 700, h: 1024 },
  ];
  const hit = (a: Box, x0: number, y0: number, x1: number, y1: number) =>
    a.x - a.w / 2 < x1 && a.x + a.w / 2 > x0 && a.y - a.h / 2 < y1 && a.y + a.h / 2 > y0;
  const overlap = (a: Box, b: Box) => hit(a, b.x - b.w / 2, b.y - b.h / 2, b.x + b.w / 2, b.y + b.h / 2);
  it('the lid knob is at least 100 x 60 and inside its jar', () => {
    expect(LID.w).toBeGreaterThanOrEqual(100);
    expect(LID.h).toBeGreaterThanOrEqual(60);
    expect(LID.x - LID.w / 2).toBeGreaterThanOrEqual(-JAR_W / 2);
    expect(LID.x + LID.w / 2).toBeLessThanOrEqual(JAR_W / 2);
    expect(LID.y - LID.h / 2).toBeGreaterThanOrEqual(-JAR_H / 2);
    expect(LID.y + LID.h / 2).toBeLessThanOrEqual(JAR_H / 2);
    expect(inLid(0, -JAR_H / 2 + 30)).toBe(true);
    expect(inLid(0, JAR_H / 2 - 10)).toBe(false);
    expect(inLid(JAR_W / 2 - 5, -JAR_H / 2 + 30)).toBe(false);
  });
  for (const v of views) {
    it(`${v.w}x${v.h}: jars, Check, table and sample fit and stay clear`, () => {
      const l = layoutJars(v);
      expect(l.portrait).toBe(v.h > v.w);
      expect(l.jars).toHaveLength(4);
      const inputs = [...l.jars, l.check];
      for (const b of [...inputs, l.sample]) {
        expect(b.x - b.w / 2).toBeGreaterThanOrEqual(0);
        expect(b.y - b.h / 2).toBeGreaterThanOrEqual(0);
        expect(b.x + b.w / 2).toBeLessThanOrEqual(v.w);
        expect(b.y + b.h / 2).toBeLessThanOrEqual(v.h);
        expect(hit(b, 0, v.h - 170, 170, v.h)).toBe(false);
        expect(hit(b, 0, 0, 120, 120)).toBe(false);
        expect(hit(b, v.w - 120, 0, v.w, 120)).toBe(false);
      }
      for (const b of inputs) {
        expect(b.w).toBeGreaterThanOrEqual(100);
        expect(b.h).toBeGreaterThanOrEqual(100);
      }
      for (const j of l.jars) {
        expect(j.w).toBe(150);
        expect(j.h).toBe(190);
      }
      const t = l.table;
      expect(t.x - t.w / 2).toBeGreaterThanOrEqual(0);
      expect(t.y - t.h / 2).toBeGreaterThanOrEqual(0);
      expect(t.x + t.w / 2).toBeLessThanOrEqual(v.w);
      expect(t.y + t.h / 2).toBeLessThanOrEqual(v.h);
      expect(hit(t, 0, v.h - 170, 170, v.h)).toBe(false);
      const all: Box[] = [...l.jars, l.check, t, l.sample];
      for (let i = 0; i < all.length; i++)
        for (let j = i + 1; j < all.length; j++) expect(overlap(all[i], all[j]), `${i}/${j}`).toBe(false);
      if (l.portrait) {
        const xs = [...new Set(l.jars.map((j) => j.x))];
        const ys = [...new Set(l.jars.map((j) => j.y))];
        expect(xs).toHaveLength(2);
        expect(ys).toHaveLength(2);
      } else {
        expect(new Set(l.jars.map((j) => j.y)).size).toBe(1);
      }
    });
  }
});
