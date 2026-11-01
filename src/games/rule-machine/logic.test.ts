import { describe, it, expect } from 'vitest';
import { Rng } from '../../engine/random';
import { CRITTERS } from '../../art/critter';
import { SCRIPT } from '../../content/voice-script';
import { HOW_TO } from '../../content/howto';
import {
  LEVELS, CREATURES, COLOR_OF, planFor, makeRound, canTake, dress, apply, fits, pads, counted, samePicture, isLook,
  layout, Score, MAX_COUNT, LOOKS, type LookMachine, type CountMachine, type Box, type NumRule,
} from './logic';

const SEEDS = Array.from({ length: 300 }, (_, i) => i * 7919 + 1);
const perm = (xs: number[], n: number) => [...xs].sort((a, b) => a - b).join() === Array.from({ length: n }, (_, i) => i).join();

describe('plans', () => {
  it('level ranges and names', () => {
    expect(LEVELS).toEqual({ prek: { min: 1, max: 1 }, school: { min: 2, max: 2 } });
    expect([1, 2].map((l) => planFor(l).level)).toEqual([1, 2]);
    for (const l of [1, 2]) expect(planFor(l).name.length).toBeGreaterThan(0);
  });
  it('colours match the art and there is no cow', () => {
    for (const c of CREATURES) expect(COLOR_OF[c]).toBe(CRITTERS[c].color);
    expect(CREATURES as readonly string[]).not.toContain('cow');
  });
});

describe('level 1 rounds', () => {
  it('deterministic, two different machines', () => {
    for (const seed of SEEDS) {
      const a = makeRound(1, new Rng(seed));
      expect(a).toEqual(makeRound(1, new Rng(seed)));
      expect(a).toHaveLength(2);
      expect((a[0].rule as { change: string }).change).not.toBe((a[1].rule as { change: string }).change);
    }
  });
  it('creatures, pictures and the right answer', () => {
    for (const seed of SEEDS) {
      for (const m of makeRound(1, new Rng(seed)) as LookMachine[]) {
        expect(isLook(m)).toBe(true);
        const all = [...m.walkers, ...m.waiting];
        expect(m.walkers).toHaveLength(3);
        expect(m.waiting).toHaveLength(2);
        expect(new Set(all).size).toBe(all.length);
        for (const c of all) expect(canTake(c, m.rule.change)).toBe(true);
        if (m.rule.change === 'blue') expect(all).not.toContain('pip');
        m.waiting.forEach((c, k) => {
          const ps = m.pictures[k];
          expect(ps).toHaveLength(3);
          for (let i = 0; i < 3; i++) for (let j = i + 1; j < 3; j++) expect(samePicture(ps[i], ps[j])).toBe(false);
          for (const p of ps) expect(p.creature).toBe(c);
          const right = ps.filter((p) => samePicture(p, dress(m.rule, c)));
          expect(right).toHaveLength(1);
          expect(ps.filter((p) => p.look === null)).toHaveLength(1);
          const other = ps.filter((p) => p.look !== null && p.look !== m.rule.change);
          expect(other).toHaveLength(1);
          expect(LOOKS).toContain(other[0].look);
          expect(canTake(c, other[0].look!)).toBe(true);
          // help leads somewhere: the right picture is findable
          expect(ps.findIndex((p) => samePicture(p, dress(m.rule, c)))).toBeGreaterThanOrEqual(0);
        });
      }
    }
  });
});

describe('level 2 rounds', () => {
  it('deterministic, +1 and +2, tray and pad orders', () => {
    for (const seed of SEEDS) {
      const r = makeRound(2, new Rng(seed)) as CountMachine[];
      expect(r).toEqual(makeRound(2, new Rng(seed)));
      expect(r.map((m) => (m.rule as NumRule).b).sort()).toEqual([1, 2]);
      for (const m of r) {
        expect(m.rule.a).toBe(1);
        expect([...m.tray].sort()).toEqual([1, 2, 3, 4, 5]);
        for (const n of m.tray) { const o = apply(m.rule, n); expect(o).toBeGreaterThanOrEqual(0); expect(o).toBeLessThanOrEqual(MAX_COUNT); }
        expect(m.padOrders).toHaveLength(planFor(2).predictions);
        for (const o of m.padOrders) expect(perm(o, 3)).toBe(true);
      }
    }
  });
  it('help leads to the right pad', () => {
    for (const seed of SEEDS) {
      for (const m of makeRound(2, new Rng(seed)) as CountMachine[]) {
        m.padOrders.forEach((order, k) => {
          const car = m.tray[k];
          expect(pads(apply(m.rule, car), order)[order.indexOf(0)]).toBe(apply(m.rule, car));
        });
      }
    }
  });
});

describe('pads, fits, apply', () => {
  it('three distinct values including the right one, once', () => {
    for (let right = 0; right <= 12; right++) {
      const p = pads(right);
      expect(new Set(p).size).toBe(3);
      expect(p).toContain(right);
      expect(p.filter((v) => v === right)).toHaveLength(1);
      for (const v of p) { expect(v).toBeGreaterThanOrEqual(0); expect(v).toBeLessThanOrEqual(12); }
      expect(pads(right, [2, 0, 1])).toEqual([p[2], p[0], p[1]]);
    }
    expect(pads(12)).toEqual([12, 11, 10]);
  });
  it('right 0 replaces the one below with two above', () => {
    expect(pads(0)).toEqual([0, 2, 1]);
  });
  it('apply and fits', () => {
    const r: NumRule = { kind: 'num', a: 1, b: 2 };
    expect(apply(r, 3)).toBe(5);
    expect(apply({ kind: 'num', a: 2, b: 1 }, 3)).toBe(7);
    expect(fits(r, [{ in: 1, out: 3 }, { in: 4, out: 6 }])).toBe(true);
    expect(fits(r, [{ in: 1, out: 3 }, { in: 4, out: 5 }])).toBe(false);
    expect(fits(r, [])).toBe(true);
  });
});

describe('counted', () => {
  it('level 1: first free, then counted; level 2: first two free', () => {
    const p1 = planFor(1), p2 = planFor(2);
    expect([0, 1].map((a) => counted(p1, a))).toEqual([false, true]);
    expect([0, 1, 2, 3].map((a) => counted(p2, a))).toEqual([false, false, true, true]);
  });
});

describe('Score', () => {
  it('right never counts; free wrong counts nothing', () => {
    const s = new Score();
    expect(s.answer(true, true)).toBe('right');
    expect(s.answer(false, false)).toBe('free');
    expect([s.misses, s.hints, s.glowing]).toEqual([0, 0, false]);
  });
  it('counted wrongs: miss, glow with hint, more misses, no more hints', () => {
    const s = new Score();
    expect(s.answer(false, true)).toBe('miss');
    expect([s.misses, s.hints, s.glowing]).toEqual([1, 0, false]);
    expect(s.answer(false, true)).toBe('glow');
    expect([s.misses, s.hints, s.glowing]).toEqual([2, 1, true]);
    s.answer(false, true);
    expect([s.misses, s.hints]).toEqual([3, 1]);
  });
  it('newAsk resets; a later glow on the same machine adds no hint; newMachine allows one', () => {
    const s = new Score();
    s.answer(false, true); s.answer(false, true);
    s.newAsk();
    expect([s.wrongs, s.glowing]).toEqual([0, false]);
    s.answer(false, true); s.answer(false, true);
    expect([s.misses, s.hints]).toEqual([4, 1]);
    s.newMachine();
    s.answer(false, true); s.answer(false, true);
    expect([s.misses, s.hints]).toEqual([6, 2]);
  });
  it('showMe lights the glow once with one hint; a second returns false', () => {
    const s = new Score();
    expect(s.showMe()).toBe(true);
    expect([s.glowing, s.hints]).toEqual([true, 1]);
    expect(s.showMe()).toBe(false);
    expect(s.hints).toBe(1);
  });
  it('showMe after a glow on the same machine counts nothing more', () => {
    const s = new Score();
    s.answer(false, true); s.answer(false, true);
    expect(s.showMe()).toBe(false);
    expect(s.hints).toBe(1);
    s.newAsk();
    expect(s.showMe()).toBe(true);
    expect(s.hints).toBe(1);
  });
});

const VIEWS = [{ w: 1024, h: 768 }, { w: 768, h: 1024 }, { w: 1024, h: 700 }, { w: 700, h: 1024 }];
const rect = (b: Box) => ({ l: b.x - b.w / 2, r: b.x + b.w / 2, t: b.y - b.h / 2, b: b.y + b.h / 2 });
const overlap = (a: Box, b: Box) => { const p = rect(a), q = rect(b); return p.l < q.r && q.l < p.r && p.t < q.b && q.t < p.b; };
const hits = (b: Box, x0: number, y0: number, x1: number, y1: number) => { const p = rect(b); return p.l < x1 && x0 < p.r && p.t < y1 && y0 < p.b; };

describe('layout', () => {
  for (const view of VIEWS) for (const level of [1, 2]) {
    it(`${view.w}x${view.h} level ${level}`, () => {
      const L = layout(view, level);
      expect(L.portrait).toBe(view.h > view.w);
      const inputs = [L.hopper, ...L.pads, ...(level === 2 ? L.tray : [])];
      for (const b of inputs) {
        expect(b.w).toBeGreaterThanOrEqual(100);
        expect(b.h).toBeGreaterThanOrEqual(100);
        const r = rect(b);
        expect(r.l).toBeGreaterThanOrEqual(0); expect(r.t).toBeGreaterThanOrEqual(0);
        expect(r.r).toBeLessThanOrEqual(view.w); expect(r.b).toBeLessThanOrEqual(view.h);
        expect(hits(b, 0, view.h - 170, 170, view.h)).toBe(false);
        expect(hits(b, 0, 0, 120, 120)).toBe(false);
        expect(hits(b, view.w - 120, 0, view.w, 120)).toBe(false);
      }
      for (let i = 0; i < 3; i++) for (let j = i + 1; j < 3; j++) expect(overlap(L.pads[i], L.pads[j])).toBe(false);
      if (level === 2) {
        for (let i = 0; i < 5; i++) for (let j = i + 1; j < 5; j++) expect(overlap(L.tray[i], L.tray[j])).toBe(false);
        for (const t of L.tray) for (const o of [L.body, L.hopper]) expect(overlap(t, o)).toBe(false);
      }
      for (const p of L.pads) for (const o of [L.body, L.hopper]) expect(overlap(p, o)).toBe(false);
      for (const c of L.columns) for (const o of [L.body, L.hopper]) expect(overlap(c, o)).toBe(false);
    });
  }
});

describe('wording guard', () => {
  it('no "=" in rm.* voice lines', () => {
    const keys = Object.keys(SCRIPT).filter((k) => k.startsWith('rm.'));
    for (const k of keys) for (const line of (SCRIPT as Record<string, readonly string[]>)[k]) expect(line, k).not.toContain('=');
  });
  it('how-to card exists and has no "="', () => {
    const card = HOW_TO['rule-machine'];
    expect(card).toBeDefined();
    expect(JSON.stringify(card)).not.toContain('=');
  });
});
