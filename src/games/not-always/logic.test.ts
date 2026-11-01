import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import {
  ATTRS, AUTHORED_1, AUTHORED_2, AUTHORED_3, breakers, COLORS, hasDecoy, isTrue, makeRound, notAlwaysLayout, PET_CORNER,
  Play, sameCard, sameClaim, type Attr, type Card, type Claim, type Rect, type Round,
} from './logic';

const SEEDS = 300;
const seeds = Array.from({ length: SEEDS }, (_, i) => i + 1);
const roundFor = (level: number, seed: number) => makeRound(level, new Rng(seed));
const distinct = (cards: Card[]) => cards.every((c, i) => cards.every((d, j) => i === j || !sameCard(c, d)));

/** Independent decoy check: some non-breaker is the only card differing from the rest on another dimension. */
const dimOf = (a: Attr) => (COLORS.includes(a as never) ? 'color' : a);
const val = (c: Card, d: string) => String((c as unknown as Record<string, unknown>)[d]);
function decoyIndependent(cards: Card[], claim: Claim): boolean {
  const br = breakers(cards, claim);
  const d0 = dimOf(claim.attr);
  return cards.some((c, i) => {
    if (br.includes(i)) return false;
    return ['color', 'hat', 'wings', 'spots'].some((d) => {
      if (d === d0) return false;
      const others = cards.filter((_, k) => k !== i).map((x) => val(x, d));
      return others.every((v) => v === others[0]) && val(c, d) !== others[0];
    });
  });
}

describe('authored rounds', () => {
  it('level 1 matches the definition table', () => {
    const r = AUTHORED_1;
    expect(r.cards).toHaveLength(4);
    expect(r.claims).toEqual([{ q: 'every', attr: 'hat' }, { q: 'every', attr: 'red' }, { q: 'every', attr: 'wings' }]);
    expect(breakers(r.cards, r.claims[0])).toEqual([2]);
    expect(breakers(r.cards, r.claims[1])).toEqual([3]);
    expect(breakers(r.cards, r.claims[2])).toEqual([0]);
  });
  it('level 2 has 5 distinct cards, three every claims, the true one second', () => {
    const r = AUTHORED_2;
    expect(r.cards).toHaveLength(5);
    expect(distinct(r.cards)).toBe(true);
    expect(r.claims).toHaveLength(3);
    expect(r.claims.map((c) => isTrue(r.cards, c))).toEqual([false, true, false]);
    for (const c of r.claims) { expect(c.q).toBe('every'); expect(hasDecoy(r.cards, c)).toBe(true); }
    for (const c of [r.claims[0], r.claims[2]]) expect(breakers(r.cards, c).length).toBeGreaterThanOrEqual(1);
  });
  it('level 3 has 4 distinct cards, two single-breaker claims, mends with one truth', () => {
    const r = AUTHORED_3;
    expect(r.cards).toHaveLength(4);
    expect(distinct(r.cards)).toBe(true);
    expect(r.claims).toHaveLength(2);
    r.claims.forEach((c, k) => {
      expect(breakers(r.cards, c)).toHaveLength(1);
      expect(r.mends[k]).toHaveLength(3);
      expect(r.mends[k].filter((m) => isTrue(r.cards, m))).toHaveLength(1);
      expect(r.mends[k].some((m) => sameClaim(m, { q: 'none', attr: c.attr }))).toBe(true);
    });
  });
  it('makeRound(level, rng, true) returns copies', () => {
    const pairs: [number, Round][] = [[1, AUTHORED_1], [2, AUTHORED_2], [3, AUTHORED_3]];
    for (const [lv, a] of pairs) {
      const r = makeRound(lv, new Rng(1), true);
      expect(r).toEqual(a);
      expect(r).not.toBe(a);
      expect(r.cards[0]).not.toBe(a.cards[0]);
      expect(r.claims[0]).not.toBe(a.claims[0]);
    }
  });
});

describe('level 1 rows', () => {
  it('has 4 distinct cards and 3 every claims with one different breaker each', () => {
    for (const s of seeds) {
      const r = roundFor(1, s);
      expect(r.level).toBe(1);
      expect(r.cards).toHaveLength(4);
      expect(distinct(r.cards)).toBe(true);
      expect(r.claims).toHaveLength(3);
      const bs = r.claims.map((c) => { expect(c.q).toBe('every'); const b = breakers(r.cards, c); expect(b).toHaveLength(1); return b[0]; });
      expect(new Set(bs).size).toBe(3);
    }
  });
  it('is deterministic per seed', () => {
    for (const lv of [1, 2, 3]) for (const s of [1, 7, 42, 99]) expect(roundFor(lv, s)).toEqual(roundFor(lv, s));
  });
});

describe('level 2 rows', () => {
  it('has 5 distinct cards, 3 every claims, 1 or 2 true, false ones with 1-2 breakers', () => {
    const counts = new Set<number>();
    const positions = new Set<number>();
    for (const s of seeds) {
      const r = roundFor(2, s);
      expect(r.cards).toHaveLength(5);
      expect(distinct(r.cards)).toBe(true);
      expect(r.claims).toHaveLength(3);
      const trues = r.claims.filter((c) => isTrue(r.cards, c));
      expect([1, 2]).toContain(trues.length);
      counts.add(trues.length);
      r.claims.forEach((c, k) => {
        expect(c.q).toBe('every');
        const n = breakers(r.cards, c).length;
        if (n === 0) positions.add(k); else { expect(n).toBeLessThanOrEqual(2); }
        const p = new Play(r);
        p.claim = k;
        expect(p.stamp().kind === 'every').toBe(n === 0);
      });
    }
    expect([...counts].every((n) => n === 1 || n === 2)).toBe(true);
    expect([...positions].sort()).toEqual([0, 1, 2]);
  });
  it('produces both one-true and two-true rows across seeds', () => {
    const counts = new Set(seeds.map((s) => { const r = roundFor(2, s); return r.claims.filter((c) => isTrue(r.cards, c)).length; }));
    expect([...counts].sort()).toEqual([1, 2]);
  });
});

describe('decoy rule', () => {
  // Two true claims leave five distinct cards differing on only two dimensions, where no card can be another's odd one
  // out, so the rule is checked on level 1 and on level 2's one-true rows.
  it('holds for every false claim at level 1 and in one-true level 2 rows, checked independently', () => {
    for (const lv of [1, 2]) for (const s of seeds) {
      const r = roundFor(lv, s);
      if (lv === 2 && r.claims.filter((c) => isTrue(r.cards, c)).length !== 1) continue;
      for (const c of r.claims) {
        if (isTrue(r.cards, c)) continue;
        expect(hasDecoy(r.cards, c)).toBe(true);
        expect(decoyIndependent(r.cards, c)).toBe(true);
      }
    }
  });
});

describe('level 3 mends', () => {
  it('has 4 distinct cards, 2 claims with one breaker, 3 mends with exactly one true', () => {
    for (const s of seeds) {
      const r = roundFor(3, s);
      expect(r.level).toBe(3);
      expect(r.cards).toHaveLength(4);
      expect(distinct(r.cards)).toBe(true);
      expect(r.claims).toHaveLength(2);
      expect(r.mends).toHaveLength(2);
      r.claims.forEach((c, k) => {
        expect(c.q).toBe('every');
        expect(breakers(r.cards, c)).toHaveLength(1);
        const m = r.mends[k];
        expect(m).toHaveLength(3);
        expect(m.filter((o) => isTrue(r.cards, o))).toHaveLength(1);
        for (const o of m) {
          expect(['every', 'none']).toContain(o.q);
          expect(ATTRS).toContain(o.attr);
          if (!isTrue(r.cards, o)) expect(breakers(r.cards, o).length).toBeGreaterThan(0);
        }
        expect(m.some((o) => sameClaim(o, { q: 'none', attr: c.attr }))).toBe(true);
      });
    }
  });
});

describe('accounting', () => {
  it('counts a fitting card tap as one miss, and two misses give one glow hint', () => {
    const p = new Play(makeRound(1, new Rng(1), true)); // claim 0 hat, breaker 2
    expect(p.tapCard(0)).toMatchObject({ kind: 'miss', why: 'fits', glow: false });
    expect(p.misses).toBe(1); expect(p.hints).toBe(0); expect(p.glowing).toBe(false);
    expect(p.tapCard(1)).toMatchObject({ kind: 'miss', glow: true });
    expect(p.misses).toBe(2); expect(p.hints).toBe(1); expect(p.glowing).toBe(true);
    expect(p.tapCard(0)).toMatchObject({ kind: 'miss', glow: false });
    expect(p.hints).toBe(1);
    expect(p.requestHint()).toBe(false);
    expect(p.hints).toBe(1);
    expect(p.tapCard(2)).toMatchObject({ kind: 'break', card: 2, next: 'claim' });
    expect(p.claim).toBe(1); expect(p.stepMisses).toBe(0); expect(p.glowing).toBe(false);
    expect(p.requestHint()).toBe(true);
    expect(p.requestHint()).toBe(false);
    expect(p.hints).toBe(2);
  });
  it('counts false stamps and card taps on a true claim, and stamping a true claim is right', () => {
    const p = new Play(makeRound(2, new Rng(1), true)); // red false, hat true, wings false
    expect(p.stamp()).toMatchObject({ kind: 'miss', why: 'stamp' });
    expect(p.misses).toBe(1);
    const br = breakers(p.round.cards, p.current)[0];
    expect(p.tapCard(br).kind).toBe('break');
    expect(p.stamp()).toMatchObject({ kind: 'every' });
    expect(p.claim).toBe(2);
    expect(p.misses).toBe(1);
    const q = new Play(makeRound(2, new Rng(1), true));
    q.claim = 1;
    expect(q.tapCard(0)).toMatchObject({ kind: 'miss', why: 'too' });
    expect(q.misses).toBe(1);
  });
  it('level 3: card taps in the mend phase are free, false mends miss, then done', () => {
    const p = new Play(makeRound(3, new Rng(1), true));
    expect(p.tapCard(2).kind).toBe('break');
    expect(p.phase).toBe('mend');
    expect(p.tapCard(0)).toEqual({ kind: 'free' });
    expect(p.misses).toBe(0);
    const t = p.target();
    expect(t?.kind).toBe('mend');
    const good = (t as { j: number }).j;
    const bad = [0, 1, 2].filter((j) => j !== good);
    expect(p.chooseMend(bad[0])).toMatchObject({ kind: 'miss', why: 'mend', glow: false });
    expect(p.chooseMend(bad[1])).toMatchObject({ kind: 'miss', why: 'mend', glow: true });
    expect(p.misses).toBe(2); expect(p.hints).toBe(1);
    expect(p.requestHint()).toBe(false);
    expect(p.chooseMend(good)).toMatchObject({ kind: 'mended', next: 'claim' });
    expect(p.phase).toBe('claim'); expect(p.claim).toBe(1);
    expect(p.requestHint()).toBe(true);
    expect(p.hints).toBe(2);
    p.tapCard(breakers(p.round.cards, p.current)[0]);
    expect(p.phase).toBe('mend');
    expect(p.requestHint()).toBe(true); // a fresh step
    expect(p.hints).toBe(3);
    p.chooseMend((p.target() as { j: number }).j);
    expect(p.phase).toBe('done');
    expect(p.target()).toBeNull();
    expect(p.tapCard(0)).toEqual({ kind: 'free' });
    expect(p.requestHint()).toBe(false);
  });
  it('levels 1 and 2 end in done after the last claim, misses never block', () => {
    for (const lv of [1, 2]) {
      const p = new Play(roundFor(lv, 5));
      for (let n = 0; n < p.round.claims.length; n++) {
        const t = p.target()!;
        // Two wrong taps first (a stamp on a false claim, or a card tap on a true one): they never block the answer.
        if (t.kind === 'stamp') { p.tapCard(0); p.tapCard(1); expect(p.stamp().kind).toBe('every'); }
        else if (t.kind === 'card') { p.stamp(); p.stamp(); expect(p.tapCard(t.i).kind).toBe('break'); }
      }
      expect(p.phase).toBe('done');
    }
  });
  it('stamp is free outside level 2', () => {
    expect(new Play(roundFor(1, 3)).stamp()).toEqual({ kind: 'free' });
  });
});

describe('hints lead somewhere', () => {
  it('following target() from the start finishes every level with no misses', () => {
    for (const lv of [1, 2, 3]) for (const s of seeds) {
      const p = new Play(roundFor(lv, s));
      for (let guard = 0; p.phase !== 'done' && guard < 20; guard++) {
        const t = p.target()!;
        if (t.kind === 'card') {
          expect(breakers(p.round.cards, p.current)).toContain(t.i);
          p.tapCard(t.i);
        } else if (t.kind === 'stamp') {
          expect(isTrue(p.round.cards, p.current)).toBe(true);
          p.stamp();
        } else {
          expect(isTrue(p.round.cards, p.options[t.j])).toBe(true);
          p.chooseMend(t.j);
        }
      }
      expect(p.phase).toBe('done');
      expect(p.misses).toBe(0);
      expect(p.hints).toBe(0);
    }
  });
  it('the target is the stamp exactly when the claim is true', () => {
    for (const s of seeds) {
      const p = new Play(roundFor(2, s));
      for (let k = 0; k < 3; k++) {
        p.claim = k;
        expect(p.target()!.kind === 'stamp').toBe(isTrue(p.round.cards, p.current));
      }
    }
  });
});

describe('layout', () => {
  const views = [{ w: 1024, h: 768 }, { w: 1366, h: 1024 }, { w: 768, h: 1024 }, { w: 1024, h: 1366 }];
  const overlap = (a: Rect, b: Rect) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
  for (const v of views) for (const lv of [1, 2, 3]) {
    it(`fits level ${lv} at ${v.w}x${v.h}`, () => {
      const l = notAlwaysLayout(v, lv);
      const named: [string, Rect][] = [['sign', l.sign], ['friend', l.friend], ...l.cards.map((r, i): [string, Rect] => [`card${i}`, r]),
        ...l.mends.map((r, i): [string, Rect] => [`mend${i}`, r])];
      if (l.stamp) named.push(['stamp', l.stamp]);
      expect(l.cards).toHaveLength(lv === 2 ? 5 : 4);
      expect(!!l.stamp).toBe(lv === 2);
      expect(l.mends).toHaveLength(lv === 3 ? 3 : 0);
      for (const [n, r] of named) {
        expect(r.w, n).toBeGreaterThanOrEqual(100);
        expect(r.h, n).toBeGreaterThanOrEqual(100);
        expect(r.x, n).toBeGreaterThanOrEqual(0);
        expect(r.y, n).toBeGreaterThanOrEqual(0);
        expect(r.x + r.w, n).toBeLessThanOrEqual(v.w);
        expect(r.y + r.h, n).toBeLessThanOrEqual(v.h);
        expect(r.x < PET_CORNER && r.y + r.h > v.h - PET_CORNER, `${n} in pet corner`).toBe(false);
        expect(r.x < 120 && r.y < 120, `${n} in home corner`).toBe(false);
      }
      const play = [...l.cards, ...l.mends, ...(l.stamp ? [l.stamp] : [])];
      play.forEach((a, i) => play.forEach((b, j) => { if (i < j) expect(overlap(a, b), `${i}/${j}`).toBe(false); }));
      for (const r of play) { expect(overlap(r, l.sign)).toBe(false); expect(overlap(r, l.friend)).toBe(false); }
    });
  }
});
