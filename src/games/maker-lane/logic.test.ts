import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import {
  AUTHORED,
  CARDS_FOR,
  CHAINS,
  FORMS,
  HOME_CORNER,
  MAKERS,
  PET_CORNER,
  Play,
  STALL_H,
  STALL_W,
  cardChain,
  cardResult,
  chainOf,
  isProduct,
  makerFor,
  makerLaneLayout,
  nextForm,
  productOf,
  roundFor,
  stageOf,
  type Bundle,
  type Form,
  type Rect,
  type Thing,
} from './logic';

const seeds = Array.from({ length: 300 }, (_, i) => i + 1);
const distinct = <T>(xs: T[]) => new Set(xs).size === xs.length;
const THING_FORM: Record<Thing, Form> = { sock: 'sock', box: 'box', loaf: 'loaf', scarf: 'scarf' };
const bundlesOf = (level: 1 | 2, seed: number): readonly Bundle[] => {
  const r = roundFor(level, new Rng(seed));
  if (r.level === 3) throw new Error('level');
  return r.bundles;
};
const questionsOf = (seed: number) => {
  const r = roundFor(3, new Rng(seed));
  if (r.level !== 3) throw new Error('level');
  return r.questions;
};
const stalls = (b: Bundle) => b.stalls.map((m) => m.step);

describe('the graph', () => {
  it('has four chains of four makers and five forms, all distinct', () => {
    expect(CHAINS).toHaveLength(4);
    expect(MAKERS).toHaveLength(16);
    const all = CHAINS.flatMap((c) => [...FORMS[c]]);
    expect(all).toHaveLength(20);
    expect(distinct(all)).toBe(true);
    for (const c of CHAINS) expect(MAKERS.filter((m) => m.chain === c)).toHaveLength(4);
  });
  it('gives every non-product exactly one maker and every product none', () => {
    for (const f of CHAINS.flatMap((c) => [...FORMS[c]])) {
      if (isProduct(f)) expect(makerFor(f), f).toBeNull();
      else
        expect(
          MAKERS.filter((m) => m.accepts === f),
          f,
        ).toHaveLength(1);
    }
  });
  it('reaches each product from its beginning in exactly four steps', () => {
    for (const c of CHAINS) {
      let f: Form = FORMS[c][0];
      let n = 0;
      while (nextForm(f)) {
        f = nextForm(f)!;
        n++;
      }
      expect(n).toBe(4);
      expect(f).toBe(productOf(c));
    }
  });
});

describe('level 1 rounds', () => {
  it('has two distinct chains in chain order with the waving maker always the right one', () => {
    for (const s of seeds) {
      const bs = bundlesOf(1, s);
      expect(bs).toHaveLength(2);
      expect(bs[0].chain).not.toBe(bs[1].chain);
      for (const b of bs) {
        expect(stalls(b)).toEqual([1, 2, 3, 4]);
        expect(b.start).toBe(FORMS[b.chain][0]);
        const p = new Play({ level: 1, bundles: [b] });
        for (let k = 0; k < 4; k++) {
          const t = p.target()!;
          expect(b.stalls[t.i]).toBe(makerFor(p.form));
          expect(b.stalls[t.i].step).toBe(k + 1);
          p.send(t.i);
        }
        expect(p.done).toBe(true);
      }
    }
  });
});

describe('level 2 rounds', () => {
  it('has distinct chains, form-1 bundles, three stalls out of chain order, one acceptor at each step', () => {
    for (const s of seeds) {
      const bs = bundlesOf(2, s);
      expect(bs[0].chain).not.toBe(bs[1].chain);
      for (const b of bs) {
        expect(b.start).toBe(FORMS[b.chain][1]);
        expect(b.stalls).toHaveLength(3);
        expect([...stalls(b)].sort()).toEqual([2, 3, 4]);
        expect(stalls(b)).not.toEqual([2, 3, 4]);
        const p = new Play({ level: 2, bundles: [b] });
        while (!p.done) {
          expect(b.stalls.filter((m) => m.accepts === p.form)).toHaveLength(1);
          for (let i = 0; i < 3; i++) {
            const m = b.stalls[i];
            if (m.accepts === p.form || p.worked(i)) continue;
            expect(chainOf(m.accepts)).toBe(b.chain);
            expect(stageOf(m.accepts)).toBeGreaterThan(stageOf(p.form));
          }
          p.send(p.target()!.i);
        }
      }
    }
  });
  it('puts the first carry answer in each slot between 25% and 42% of rounds', () => {
    const counts = [0, 0, 0];
    let n = 0;
    for (const s of seeds)
      for (const b of bundlesOf(2, s)) {
        counts[new Play({ level: 2, bundles: [b] }).target()!.i]++;
        n++;
      }
    for (const c of counts) {
      expect(c / n).toBeGreaterThanOrEqual(0.25);
      expect(c / n).toBeLessThanOrEqual(0.42);
    }
  });
});

describe('level 3 rounds', () => {
  it('asks three distinct things with three distinct cards and exactly one right', () => {
    for (const s of seeds) {
      const qs = questionsOf(s);
      expect(qs).toHaveLength(3);
      expect(distinct(qs.map((q) => q.thing))).toBe(true);
      for (const q of qs) {
        expect(q.cards).toHaveLength(3);
        expect(distinct([...q.cards])).toBe(true);
        expect(q.cards).toContain(CARDS_FOR[q.thing].tempting);
        expect(q.cards).toContain(CARDS_FOR[q.thing].right);
        const same = q.cards.filter((c) => cardResult(c) === THING_FORM[q.thing]);
        expect(same).toHaveLength(1);
        expect(same[0]).toBe(CARDS_FOR[q.thing].right);
        for (const c of q.cards)
          if (c !== CARDS_FOR[q.thing].right) expect(cardResult(c)).not.toBe(THING_FORM[q.thing]);
        if (q.cards.includes('factory')) expect(['sock', 'box']).toContain(q.thing);
        if (q.thing === 'sock' || q.thing === 'box') expect(q.cards).not.toContain('cow');
        if (q.thing === 'sock' || q.thing === 'box') expect(q.cards).not.toContain('hen');
        for (const c of q.cards) if (c === 'cow' || c === 'hen') expect(cardChain(c)).toBeNull();
      }
    }
  });
  it('shows each wrong card as something other than the asked thing', () => {
    expect(cardResult('cow')).toBe('milk');
    expect(cardResult('hen')).toBe('egg');
    expect(cardResult('factory')).toBeNull();
    expect(cardResult('sheep')).toBe('scarf');
    expect(cardResult('cottonPlant')).toBe('sock');
  });
});

describe('accounting', () => {
  it('level 1 never misses, stalls refuse for free, and always finishes with zero misses', () => {
    for (const s of seeds) {
      const p = new Play(roundFor(1, new Rng(s)));
      expect(p.requestHint()).toBe(false);
      while (!p.done) {
        const t = p.target()!;
        const wrong = p.bundle!.stalls.findIndex((_, i) => i !== t.i && !p.worked(i));
        if (wrong >= 0) expect(p.send(wrong)).toEqual({ kind: 'free', why: 'notme' });
        p.send(t.i);
      }
      expect(p.misses).toBe(0);
      expect(p.hints).toBe(0);
    }
  });
  it('level 2 counts a refusal once, bubbles, frees repeats and worked stalls, and one hint per bundle', () => {
    for (const s of seeds) {
      const p = new Play(roundFor(2, new Rng(s)));
      const t = p.target()!;
      const [a, b] = [0, 1, 2].filter((i) => i !== t.i);
      expect(p.send(a)).toMatchObject({ kind: 'miss', glow: false });
      expect(p.send(a)).toEqual({ kind: 'free', why: 'bubble' });
      expect(p.misses).toBe(1);
      expect(p.send(b)).toMatchObject({ kind: 'miss', glow: true });
      expect(p.glowing).toBe(true);
      expect(p.hints).toBe(1);
      expect(p.requestHint()).toBe(false);
      expect(p.send(t.i)).toMatchObject({ kind: 'made', finished: false });
      expect(p.glowing).toBe(false);
      expect(p.send(t.i)).toEqual({ kind: 'free', why: 'worked' });
      // Show me again on the same bundle after the glow went out: lights, but no second hint.
      expect(p.requestHint()).toBe(true);
      expect(p.hints).toBe(1);
      while (p.index === 0) p.send(p.target()!.i);
      expect(p.misses).toBe(2);
      // Next bundle: a stray drop counts nothing; a fresh Show me is a new hint.
      expect(p.send(99)).toEqual({ kind: 'free', why: 'over' });
      expect(p.requestHint()).toBe(true);
      expect(p.hints).toBe(2);
      while (!p.done) p.send(p.target()!.i);
      expect(p.misses).toBe(2);
    }
  });
  it('level 3 counts a wrong card once, dims it, glows after two, and never blocks the right card', () => {
    for (const s of seeds) {
      const p = new Play(roundFor(3, new Rng(s)));
      const right = p.target()!.i;
      const [a, b] = [0, 1, 2].filter((i) => i !== right);
      expect(p.pick(a)).toMatchObject({ kind: 'miss', glow: false });
      expect(p.pick(a)).toEqual({ kind: 'free', why: 'dimmed' });
      expect(p.misses).toBe(1);
      expect(p.pick(b)).toMatchObject({ kind: 'miss', glow: true });
      expect(p.hints).toBe(1);
      expect(p.requestHint()).toBe(false);
      expect(p.pick(right)).toMatchObject({ kind: 'began', done: false });
      expect(p.index).toBe(1);
      expect(p.glowing).toBe(false);
      expect(p.requestHint()).toBe(true);
      expect(p.hints).toBe(2);
      while (!p.done) p.pick(p.target()!.i);
      expect(p.misses).toBe(2);
      expect(p.pick(0)).toEqual({ kind: 'free', why: 'over' });
    }
  });
});

describe('hints lead somewhere', () => {
  it('points at the one accepting stall and the right card', () => {
    for (const s of seeds) {
      for (const level of [1, 2] as const) {
        const p = new Play(roundFor(level, new Rng(s)));
        while (!p.done) {
          expect(p.bundle!.stalls[p.target()!.i]).toBe(makerFor(p.form));
          p.send(p.target()!.i);
        }
        expect(p.target()).toBeNull();
      }
      const q = new Play(roundFor(3, new Rng(s)));
      while (!q.done) {
        const t = q.target()!;
        expect(t.kind).toBe('card');
        expect(q.question!.cards[t.i]).toBe(CARDS_FOR[q.question!.thing].right);
        q.pick(t.i);
      }
    }
  });
});

describe('authored first rounds', () => {
  it('follow the definition', () => {
    const a1 = AUTHORED[1];
    const a2 = AUTHORED[2];
    const a3 = AUTHORED[3];
    if (a1.level === 3 || a2.level === 3 || a3.level !== 3) throw new Error('shape');
    expect(a1.bundles.map((b) => b.chain)).toEqual(['wool', 'wheat']);
    for (const b of a1.bundles) expect(stalls(b)).toEqual([1, 2, 3, 4]);
    expect(a2.bundles.map((b) => b.chain)).toEqual(['wool', 'tree']);
    expect(stalls(a2.bundles[0])).toEqual([4, 2, 3]);
    for (const b of a2.bundles) {
      expect(b.stalls).toHaveLength(3);
      expect(stalls(b)).not.toEqual([2, 3, 4]);
    }
    expect(a3.questions.map((q) => q.thing)).toEqual(['sock', 'box', 'loaf']);
    expect(a3.questions[0].cards).toContain('sheep');
    expect(a3.questions[1].cards).toContain('factory');
    expect(a3.questions[2].cards).toContain('cow');
    for (const q of a3.questions) {
      expect(q.cards.filter((c) => cardResult(c) === THING_FORM[q.thing])).toHaveLength(1);
      expect(q.cards).toContain(CARDS_FOR[q.thing].tempting);
    }
    for (const l of [1, 2, 3]) {
      const p = new Play(roundFor(l, new Rng(1), true));
      while (!p.done) {
        const t = p.target()!;
        if (t.kind === 'card') p.pick(t.i);
        else p.send(t.i);
      }
      expect(p.misses).toBe(0);
    }
  });
  it('is the same for the same seed', () => {
    for (const l of [1, 2, 3])
      for (const s of [1, 7, 99]) {
        expect(roundFor(l, new Rng(s))).toEqual(roundFor(l, new Rng(s)));
      }
  });
});

describe('layout', () => {
  const views = [
    { w: 1024, h: 768 },
    { w: 1366, h: 1024 },
    { w: 768, h: 1024 },
    { w: 1024, h: 1366 },
  ];
  const inside = (r: Rect, v: { w: number; h: number }) =>
    r.x >= 0 && r.y >= 0 && r.x + r.w <= v.w && r.y + r.h <= v.h;
  const hit = (a: Rect, b: Rect) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
  for (const v of views)
    for (const level of [1, 2, 3]) {
      it(`fits level ${level} at ${v.w}x${v.h}`, () => {
        const L = makerLaneLayout(v, level);
        const pet: Rect = { x: 0, y: v.h - PET_CORNER, w: PET_CORNER, h: PET_CORNER };
        const home: Rect = { x: 0, y: 0, w: HOME_CORNER, h: HOME_CORNER };
        const targets: Rect[] = [L.begin, ...L.stalls, ...L.cards, ...(L.frame ? [L.frame] : [])];
        L.spots.forEach((p) =>
          targets.push({ x: p.x - L.bundle / 2, y: p.y - L.bundle / 2, w: L.bundle, h: L.bundle }),
        );
        for (const r of targets) {
          expect(inside(r, v), JSON.stringify(r)).toBe(true);
          expect(hit(r, pet), `pet ${JSON.stringify(r)}`).toBe(false);
          expect(hit(r, home), `home ${JSON.stringify(r)}`).toBe(false);
        }
        expect(L.stalls).toHaveLength(level === 2 ? 3 : 4);
        if (level < 3) {
          expect(L.bundle).toBe(130);
          for (const r of [L.begin, ...L.stalls]) {
            expect(r.w).toBeGreaterThanOrEqual(160);
            expect(r.h).toBeGreaterThanOrEqual(220);
            expect(r.w).toBe(STALL_W);
            expect(r.h).toBe(STALL_H);
          }
          if (L.portrait) expect(L.rows).toBe(2);
        } else {
          expect(L.cards).toHaveLength(3);
          for (const c of L.cards) {
            expect(c.w).toBe(200);
            expect(c.h).toBe(200);
          }
        }
        const solid = level === 3 ? L.cards : [L.begin, ...L.stalls];
        for (let i = 0; i < solid.length; i++)
          for (let j = i + 1; j < solid.length; j++) expect(hit(solid[i], solid[j]), `${i}/${j}`).toBe(false);
        if (level === 3)
          for (const c of L.cards) {
            expect(hit(c, L.frame!)).toBe(false);
            for (const s of [L.begin, ...L.stalls]) expect(hit(c, s)).toBe(false);
          }
      });
    }
});
