import { describe, it, expect } from 'vitest';
import { Rng } from '../../engine/random';
import { CRITTERS } from '../../art/critter';
import {
  KINDS, COLOR_OF, WEDGES, WEDGE_DEG, EDGE_DEG, LEVELS, PICK_PAIRS, planFor, makeRound, countOf, sections, kindsOf,
  contiguous, betterOf, spin, stopRotation, wedgeAt, tally, tallest, layout, BIG, SMALL,
  type Kind, type Circle, type Box,
} from './logic';

const SEEDS = Array.from({ length: 300 }, (_, i) => i * 7919 + 1);

describe('plans', () => {
  it('level ranges', () => {
    expect(LEVELS).toEqual({ preschool: { min: 1, max: 2 }, prek: { min: 2, max: 3 }, school: { min: 3, max: 3 } });
  });
  it('plans ask see / most / pick', () => {
    expect([1, 2, 3].map((l) => planFor(l).ask)).toEqual(['see', 'most', 'pick']);
    expect([1, 2, 3].map((l) => planFor(l).sets)).toEqual([1, 2, 2]);
    expect([1, 2, 3].map((l) => planFor(l).spins)).toEqual([6, 8, 10]);
  });
  it('critter colours match the art', () => {
    for (const k of KINDS) expect(COLOR_OF[k]).toBe(CRITTERS[k].color);
  });
});

describe('wheels', () => {
  it('every level: six wedges, contiguous, no shared colour, deterministic', () => {
    for (const level of [1, 2, 3]) {
      for (const seed of SEEDS) {
        const round = makeRound(level, new Rng(seed));
        expect(round).toHaveLength(planFor(level).sets);
        for (const set of round) {
          expect(set.wheels).toHaveLength(level === 3 ? 2 : 1);
          for (const w of set.wheels) {
            expect(w).toHaveLength(WEDGES);
            expect(contiguous(w)).toBe(true);
            const kinds = [...new Set(w)];
            const colours = kinds.map((k) => COLOR_OF[k]);
            expect(new Set(colours).size).toBe(kinds.length);
            if (level < 3) {
              expect(kinds).toHaveLength(3);
              for (const k of kinds) expect(countOf(w, k)).toBe(2);
            }
          }
        }
        expect(makeRound(level, new Rng(seed))).toEqual(round);
      }
    }
  });

  it('level 3: favourite pairs, gap, better', () => {
    const seen = new Set<string>();
    const sides = new Set<number>();
    for (const seed of SEEDS) {
      const round = makeRound(3, new Rng(seed));
      for (const set of round) {
        const fav = set.favourite!;
        const [a, b] = set.wheels.map((w) => countOf(w, fav));
        expect(PICK_PAIRS.some(([x, y]) => (x === a && y === b) || (x === b && y === a))).toBe(true);
        expect(Math.abs(a - b)).toBeGreaterThanOrEqual(2);
        for (const c of [a, b]) { expect(c).toBeGreaterThanOrEqual(1); expect(c).toBeLessThanOrEqual(5); }
        expect(set.better).toBe(betterOf(set));
        expect(set.better).toBe(a > b ? 0 : 1);
        seen.add(`${Math.min(a, b)}-${Math.max(a, b)}`);
        sides.add(set.better!);
      }
      expect(round[0].favourite).not.toBe(round[1].favourite);
    }
    expect(seen.size).toBe(PICK_PAIRS.length);
    expect(sides).toEqual(new Set([0, 1]));
  });
});

describe('spin', () => {
  it('angle sits inside its wedge, clear of the lines', () => {
    const rng = new Rng(5);
    for (let i = 0; i < 5000; i++) {
      const s = spin(rng);
      expect(s.wedge).toBeGreaterThanOrEqual(0);
      expect(s.wedge).toBeLessThanOrEqual(5);
      expect(s.angle).toBeGreaterThanOrEqual(s.wedge * WEDGE_DEG + EDGE_DEG);
      expect(s.angle).toBeLessThanOrEqual((s.wedge + 1) * WEDGE_DEG - EDGE_DEG);
    }
  });
  it('is fair: each wedge about 1/6, a 5-1 wheel gives the big section about 5/6', () => {
    const rng = new Rng(2026);
    const N = 60000;
    const hits = Array(6).fill(0);
    const wheel: Kind[] = ['duck', 'duck', 'duck', 'duck', 'duck', 'pig'];
    let big = 0;
    for (let i = 0; i < N; i++) {
      const s = spin(rng);
      hits[s.wedge]++;
      if (wheel[s.wedge] === 'duck') big++;
    }
    for (const h of hits) expect(Math.abs(h / N - 1 / 6)).toBeLessThan(0.01);
    expect(Math.abs(big / N - 5 / 6)).toBeLessThan(0.01);
  });
  it('stopRotation moves forward and lands in the wedge', () => {
    const rng = new Rng(77);
    for (let i = 0; i < 2000; i++) {
      const from = rng.range(-20, 20);
      const s = spin(rng);
      const turns = rng.int(0, 6);
      const r = stopRotation(from, s.angle, turns);
      expect(r).toBeGreaterThan(from);
      expect(wedgeAt(r)).toBe(Math.floor(s.angle / WEDGE_DEG));
    }
  });
});

describe('tally', () => {
  it('sums and ties', () => {
    expect(tally(['duck', 'pig'], ['duck', 'duck', 'pig', 'cat'])).toEqual([2, 1]);
    expect(tallest([2, 3, 3])).toEqual([1, 2]);
    expect(tallest([4, 1, 2])).toEqual([0]);
    expect(tallest([0, 0, 0])).toEqual([0, 1, 2]);
  });
  it('eight spins of a level-2 wheel tally to 8 with at most two tied', () => {
    for (const seed of SEEDS) {
      const rng = new Rng(seed);
      const wheel = makeRound(2, rng)[0].wheels[0];
      const results = Array.from({ length: 8 }, () => wheel[spin(rng).wedge]);
      const counts = tally(kindsOf(wheel), results);
      expect(counts.reduce((a, b) => a + b, 0)).toBe(8);
      expect(tallest(counts).length).toBeLessThanOrEqual(2);
    }
  });
  it('sections and kindsOf', () => {
    const w: Kind[] = ['duck', 'duck', 'pig', 'cat', 'cat', 'cat'];
    expect(sections(w)).toEqual([{ kind: 'duck', start: 0, count: 2 }, { kind: 'pig', start: 2, count: 1 }, { kind: 'cat', start: 3, count: 3 }]);
    expect(kindsOf(w)).toEqual(['duck', 'pig', 'cat']);
    expect(contiguous(['duck', 'pig', 'duck', 'cat', 'cat', 'cat'])).toBe(false);
  });
});

describe('layout', () => {
  const circleHitsRect = (c: Circle, r: { x0: number; y0: number; x1: number; y1: number }) => {
    const dx = c.x - Math.max(r.x0, Math.min(c.x, r.x1));
    const dy = c.y - Math.max(r.y0, Math.min(c.y, r.y1));
    return dx * dx + dy * dy < c.r * c.r;
  };
  const rectOf = (b: Box) => ({ x0: b.x - b.w / 2, y0: b.y - b.h / 2, x1: b.x + b.w / 2, y1: b.y + b.h / 2 });
  const boxesHit = (a: Box, b: Box) => {
    const p = rectOf(a), q = rectOf(b);
    return p.x0 < q.x1 && q.x0 < p.x1 && p.y0 < q.y1 && q.y0 < p.y1;
  };
  const circlesHit = (a: Circle, b: Circle) => Math.hypot(a.x - b.x, a.y - b.y) < a.r + b.r;
  const inside = (r: { x0: number; y0: number; x1: number; y1: number }, v: { w: number; h: number }) =>
    r.x0 >= 0 && r.y0 >= 0 && r.x1 <= v.w && r.y1 <= v.h;
  const circleRect = (c: Circle) => ({ x0: c.x - c.r, y0: c.y - c.r, x1: c.x + c.r, y1: c.y + c.r });

  for (const [w, h] of [[1024, 768], [768, 1024], [1024, 700], [700, 1024]]) {
    for (const bars of [2, 3]) {
      it(`${w}x${h}, ${bars} bars`, () => {
        const view = { w, h };
        const L = layout(view, bars);
        expect(L.portrait).toBe(h > w);
        expect(L.columns).toHaveLength(bars);
        const pet = { x0: 0, y0: h - 170, x1: 170, y1: h };
        const corner = { x0: 0, y0: 0, x1: 120, y1: 120 };
        const circles = [L.spinner, ...L.pair];
        expect(L.spinner.r).toBe(BIG);
        for (const c of L.pair) expect(c.r).toBe(SMALL);
        for (const c of circles) {
          expect(inside(circleRect(c), view)).toBe(true);
          expect(circleHitsRect(c, pet)).toBe(false);
          expect(circleHitsRect(c, corner)).toBe(false);
        }
        for (const b of [...L.columns, L.favourite]) {
          expect(inside(rectOf(b), view)).toBe(true);
          const r = rectOf(b);
          expect(r.x0 < pet.x1 && pet.x0 < r.x1 && r.y0 < pet.y1 && pet.y0 < r.y1).toBe(false);
          expect(r.x0 < corner.x1 && corner.x0 < r.x1 && r.y0 < corner.y1 && corner.y0 < r.y1).toBe(false);
        }
        for (const c of L.columns) {
          expect(c.w).toBeGreaterThanOrEqual(100);
          expect(c.h).toBeGreaterThanOrEqual(100);
          expect(circleHitsRect(L.spinner, rectOf(c))).toBe(false);
        }
        L.columns.forEach((a, i) => L.columns.slice(i + 1).forEach((b) => expect(boxesHit(a, b)).toBe(false)));
        expect(circlesHit(L.pair[0], L.pair[1])).toBe(false);
        for (const c of L.pair) expect(circleHitsRect(c, rectOf(L.favourite))).toBe(false);
        if (L.portrait) for (const c of L.columns) expect(c.y - c.h / 2).toBeGreaterThanOrEqual(L.spinner.y + L.spinner.r);
      });
    }
  }
});
