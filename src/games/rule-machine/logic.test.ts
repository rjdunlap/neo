import { describe, it, expect } from 'vitest';
import { Rng } from '../../engine/random';
import { CRITTERS } from '../../art/critter';
import { SCRIPT } from '../../content/voice-script';
import { HOW_TO } from '../../content/howto';
import {
  LEVELS,
  CREATURES,
  COLOR_OF,
  planFor,
  makeRound,
  canTake,
  dress,
  apply,
  fits,
  pads,
  counted,
  samePicture,
  isLook,
  layout,
  Score,
  MAX_COUNT,
  LOOKS,
  WHAT_POOL,
  COVERED_POOL,
  sameRule,
  trapPartners,
  openCards,
  judgeCard,
  settlingCar,
  lastCar,
  BACK_POOL,
  validInputs,
  backTray,
  backAnswers,
  direction,
  CHAIN_TIMES,
  CHAIN_ADDS,
  chain,
  chainOk,
  chainCases,
  caseOrder,
  pairFor,
  makeChainRound,
  chainOptions,
  fitting,
  nextCard,
  pairCounted,
  spareCards,
  type Slots,
  type Row,
  type LookMachine,
  type CountMachine,
  type Box,
  type NumRule,
} from './logic';

const SEEDS = Array.from({ length: 300 }, (_, i) => i * 7919 + 1);
const perm = (xs: number[], n: number) =>
  [...xs].sort((a, b) => a - b).join() === Array.from({ length: n }, (_, i) => i).join();

describe('plans', () => {
  it('level ranges and names', () => {
    expect(LEVELS).toEqual({ prek: { min: 1, max: 1 }, school: { min: 2, max: 6 } });
    expect(planFor(6)).toMatchObject({ level: 6, id: 'chain', pair: true, machines: 2 });
    expect(planFor(6).name).toBe('Two machines: say what they make, then build a pair');
    expect([1, 2, 3, 4, 5].every((l) => !planFor(l).pair)).toBe(true);
    expect(planFor(5)).toMatchObject({
      level: 5,
      id: 'back',
      wanted: 2,
      tray: 5,
      shelf: 'none',
      machines: 2,
    });
    expect(planFor(5).name).toBe('Backwards: find the car that went in');
    expect([1, 2, 3, 4].map((l) => planFor(l).level)).toEqual([1, 2, 3, 4]);
    expect(planFor(3).id).toBe('what');
    expect(planFor(4).id).toBe('covered');
    for (const l of [1, 2, 3, 4]) expect(planFor(l).name.length).toBeGreaterThan(0);
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
          for (let i = 0; i < 3; i++)
            for (let j = i + 1; j < 3; j++) expect(samePicture(ps[i], ps[j])).toBe(false);
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
        for (const n of m.tray) {
          const o = apply(m.rule, n);
          expect(o).toBeGreaterThanOrEqual(0);
          expect(o).toBeLessThanOrEqual(MAX_COUNT);
        }
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

describe('level 3 rounds', () => {
  it('deterministic, two different pool rules, tray, shelf, pad orders', () => {
    for (const seed of SEEDS) {
      const r = makeRound(3, new Rng(seed)) as CountMachine[];
      expect(r).toEqual(makeRound(3, new Rng(seed)));
      expect(r).toHaveLength(2);
      expect(sameRule(r[0].rule as NumRule, r[1].rule as NumRule)).toBe(false);
      for (const m of r) {
        expect(WHAT_POOL.some((p) => sameRule(p, m.rule as NumRule))).toBe(true);
        expect(m.tray).toHaveLength(5);
        expect(new Set(m.tray).size).toBe(5);
        for (const n of m.tray) {
          expect(n).toBeGreaterThanOrEqual(1);
          expect(n).toBeLessThanOrEqual(9);
        }
        for (const p of WHAT_POOL)
          for (const n of m.tray) {
            const o = apply(p, n);
            expect(o).toBeGreaterThanOrEqual(0);
            expect(o).toBeLessThanOrEqual(MAX_COUNT);
          }
        expect(m.shelf).toHaveLength(3);
        for (const p of WHAT_POOL) expect(m.shelf.filter((c) => sameRule(c, p))).toHaveLength(1);
        expect(m.padOrders).toHaveLength(planFor(3).predictions);
        for (const o of m.padOrders) expect(perm(o, 3)).toBe(true);
      }
    }
  });
  it('any three distinct cars leave exactly one card, and each wrong card is ruled out by the newest row', () => {
    const ins = [1, 2, 3, 4, 5, 6, 7, 8, 9];
    for (const rule of WHAT_POOL)
      for (const a of ins)
        for (const b of ins)
          for (const c of ins) {
            if (a === b || b === c || a === c) continue;
            const rows: Row[] = [a, b, c].map((n) => ({ in: n, out: apply(rule, n) }));
            const shelf = WHAT_POOL.slice();
            expect(shelf.filter((card) => fits(card, rows))).toHaveLength(1);
            for (const card of shelf) {
              for (const row of rows)
                if (sameRule(card, rule)) expect(apply(card, row.in)).toBe(row.out);
                else expect(apply(card, row.in)).not.toBe(row.out);
              const v = judgeCard(card, shelf, rows);
              if (sameRule(card, rule)) expect(v).toEqual({ kind: 'right' });
              else expect(v).toEqual({ kind: 'ruled-out', row: 2 });
            }
          }
  });
});

const orderings = (xs: number[]): number[][] => {
  const out: number[][] = [[]];
  const rec = (cur: number[]) => {
    for (const x of xs)
      if (!cur.includes(x)) {
        const n = [...cur, x];
        out.push(n);
        rec(n);
      }
  };
  rec([]);
  return out;
};
const ALL_FEEDS = orderings([0, 1, 2, 3, 4]);

describe('level 4 covered machine', () => {
  it('every pool rule has at least two trap partners', () => {
    for (const rule of COVERED_POOL) expect(trapPartners(rule).length).toBeGreaterThanOrEqual(2);
  });
  it('rounds are deterministic with the rule and two trap partners on the shelf', () => {
    for (const seed of SEEDS) {
      const r = makeRound(4, new Rng(seed)) as CountMachine[];
      expect(r).toEqual(makeRound(4, new Rng(seed)));
      expect(r).toHaveLength(2);
      expect(sameRule(r[0].rule as NumRule, r[1].rule as NumRule)).toBe(false);
      for (const m of r) {
        const rule = m.rule as NumRule;
        expect(m.tray).toHaveLength(5);
        expect(perm(m.tray, 5)).toBe(true);
        expect(m.shelf).toHaveLength(3);
        for (let i = 0; i < 3; i++)
          for (let j = i + 1; j < 3; j++) expect(sameRule(m.shelf[i], m.shelf[j])).toBe(false);
        expect(m.shelf.filter((c) => sameRule(c, rule))).toHaveLength(1);
        const partners = trapPartners(rule);
        for (const c of m.shelf)
          if (!sameRule(c, rule)) expect(partners.some((p) => sameRule(p, c))).toBe(true);
        expect(m.padOrders).toHaveLength(planFor(4).predictions);
        for (const o of m.padOrders) expect(perm(o, 3)).toBe(true);
        // a trap car exists: a tray car on which two shelf cards agree
        const trap = m.tray.some((n) => new Set(m.shelf.map((c) => apply(c, n))).size < 3);
        expect(trap).toBe(true);
      }
    }
  });
  it('rows, verdicts and the settling car hold for every shelf and every feeding order', () => {
    for (const rule of COVERED_POOL) {
      const partners = trapPartners(rule);
      for (let i = 0; i < partners.length; i++)
        for (let j = i + 1; j < partners.length; j++) {
          const shelf = [rule, partners[i], partners[j]];
          for (const fed of ALL_FEEDS) {
            const rows: Row[] = fed.map((n) => ({ in: n, out: apply(rule, n) }));
            const open = openCards(shelf, rows);
            const tag = `${JSON.stringify(rule)} ${JSON.stringify(shelf)} fed ${fed.join('')}`;
            expect(
              open.some((c) => sameRule(c, rule)),
              tag,
            ).toBe(true);
            if (fed.length >= 2) expect(open, tag).toHaveLength(1);
            for (const card of shelf) {
              const v = judgeCard(card, shelf, rows);
              if (!fits(card, rows)) {
                expect(v.kind, tag).toBe('ruled-out');
                const row = (v as { row: number }).row;
                expect(apply(card, rows[row].in), tag).not.toBe(rows[row].out);
                for (let k = row + 1; k < rows.length; k++)
                  expect(apply(card, rows[k].in), tag).toBe(rows[k].out);
              } else if (open.length > 1) expect(v, tag).toEqual({ kind: 'still-open' });
              else expect(v, tag).toEqual({ kind: 'right' });
            }
            const unfed = [0, 1, 2, 3, 4].filter((n) => !fed.includes(n));
            const tray = [0, 1, 2, 3, 4];
            const s = settlingCar(shelf, rows, tray, fed, rule);
            if (open.length > 1 && unfed.length > 0) {
              expect(s, tag).not.toBeNull();
              expect(unfed, tag).toContain(s);
              const after = [...rows, { in: tray[s!], out: apply(rule, tray[s!]) }];
              expect(openCards(shelf, after), tag).toHaveLength(1);
            }
            if (open.length === 1) expect(s, tag).toBeNull();
          }
        }
    }
  });
  it('settlingCar works on shuffled trays', () => {
    for (const seed of SEEDS) {
      for (const m of makeRound(4, new Rng(seed)) as CountMachine[]) {
        const rule = m.rule as NumRule;
        const s = settlingCar(m.shelf, [], m.tray, [], rule);
        expect(s).not.toBeNull();
        const after = [{ in: m.tray[s!], out: apply(rule, m.tray[s!]) }];
        expect(openCards(m.shelf, after)).toHaveLength(1);
      }
    }
  });
});

describe('lastCar', () => {
  it('lowest-count unfed car, null when all fed, output within range', () => {
    for (const seed of SEEDS.slice(0, 60)) {
      for (const m of makeRound(4, new Rng(seed)) as CountMachine[]) {
        expect(lastCar(m.tray, [0, 1, 2, 3, 4])).toBeNull();
        for (const fed of ALL_FEEDS) {
          if (fed.length === 5) continue;
          const slot = lastCar(m.tray, fed);
          expect(slot).not.toBeNull();
          expect(fed).not.toContain(slot);
          const unfedCounts = m.tray.filter((_, i) => !fed.includes(i));
          expect(m.tray[slot!]).toBe(Math.min(...unfedCounts));
          for (const rule of COVERED_POOL) {
            const o = apply(rule, m.tray[slot!]);
            expect(o).toBeGreaterThanOrEqual(0);
            expect(o).toBeLessThanOrEqual(12);
          }
        }
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
      for (const v of p) {
        expect(v).toBeGreaterThanOrEqual(0);
        expect(v).toBeLessThanOrEqual(12);
      }
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
    expect(
      fits(r, [
        { in: 1, out: 3 },
        { in: 4, out: 6 },
      ]),
    ).toBe(true);
    expect(
      fits(r, [
        { in: 1, out: 3 },
        { in: 4, out: 5 },
      ]),
    ).toBe(false);
    expect(fits(r, [])).toBe(true);
  });
});

describe('counted', () => {
  it('level 1: first free, then counted; level 2: first two free', () => {
    const p1 = planFor(1),
      p2 = planFor(2);
    expect([0, 1].map((a) => counted(p1, a))).toEqual([false, true]);
    expect([0, 1, 2, 3].map((a) => counted(p2, a))).toEqual([false, false, true, true]);
    expect([0, 1, 2, 3].map((a) => counted(planFor(3), a))).toEqual([false, false, true, true]);
    expect(counted(planFor(4), 0)).toBe(true);
  });
});

describe('Score.peek', () => {
  it('counts one hint per machine', () => {
    const s = new Score();
    expect(s.peek()).toBe(true);
    expect(s.hints).toBe(1);
    expect(s.peek()).toBe(false);
    expect(s.hints).toBe(1);
    s.answer(false, true);
    s.answer(false, true);
    expect(s.hints).toBe(1);
    s.newMachine();
    expect(s.peek()).toBe(true);
    expect(s.hints).toBe(2);
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
    s.answer(false, true);
    s.answer(false, true);
    s.newAsk();
    expect([s.wrongs, s.glowing]).toEqual([0, false]);
    s.answer(false, true);
    s.answer(false, true);
    expect([s.misses, s.hints]).toEqual([4, 1]);
    s.newMachine();
    s.answer(false, true);
    s.answer(false, true);
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
    s.answer(false, true);
    s.answer(false, true);
    expect(s.showMe()).toBe(false);
    expect(s.hints).toBe(1);
    s.newAsk();
    expect(s.showMe()).toBe(true);
    expect(s.hints).toBe(1);
  });
});

const VIEWS = [
  { w: 1024, h: 768 },
  { w: 768, h: 1024 },
  { w: 1024, h: 700 },
  { w: 700, h: 1024 },
];
const rect = (b: Box) => ({ l: b.x - b.w / 2, r: b.x + b.w / 2, t: b.y - b.h / 2, b: b.y + b.h / 2 });
const overlap = (a: Box, b: Box) => {
  const p = rect(a),
    q = rect(b);
  return p.l < q.r && q.l < p.r && p.t < q.b && q.t < p.b;
};
const hits = (b: Box, x0: number, y0: number, x1: number, y1: number) => {
  const p = rect(b);
  return p.l < x1 && x0 < p.r && p.t < y1 && y0 < p.b;
};

describe('layout', () => {
  for (const view of VIEWS)
    for (const level of [1, 2, 3, 4]) {
      it(`${view.w}x${view.h} level ${level}`, () => {
        const L = layout(view, level);
        expect(L.portrait).toBe(view.h > view.w);
        const inputs = [L.hopper, ...L.pads, ...(level >= 2 ? L.tray : []), ...(level >= 3 ? L.shelf : [])];
        for (const b of inputs) {
          expect(b.w).toBeGreaterThanOrEqual(100);
          expect(b.h).toBeGreaterThanOrEqual(100);
          const r = rect(b);
          expect(r.l).toBeGreaterThanOrEqual(0);
          expect(r.t).toBeGreaterThanOrEqual(0);
          expect(r.r).toBeLessThanOrEqual(view.w);
          expect(r.b).toBeLessThanOrEqual(view.h);
          expect(hits(b, 0, view.h - 170, 170, view.h)).toBe(false);
          expect(hits(b, 0, 0, 120, 120)).toBe(false);
          expect(hits(b, view.w - 120, 0, view.w, 120)).toBe(false);
        }
        for (let i = 0; i < 3; i++)
          for (let j = i + 1; j < 3; j++) expect(overlap(L.pads[i], L.pads[j])).toBe(false);
        if (level >= 3) {
          expect(L.shelf).toHaveLength(3);
          for (let i = 0; i < 3; i++)
            for (let j = i + 1; j < 3; j++) expect(overlap(L.shelf[i], L.shelf[j])).toBe(false);
          for (const c of L.shelf) {
            for (const o of [...L.columns, L.body, L.hopper, ...L.pads, ...L.tray])
              expect(overlap(c, o)).toBe(false);
          }
        }
        if (level === 4) {
          const pk = rect(L.peek),
            bd = rect(L.body);
          expect(L.peek.w).toBeGreaterThanOrEqual(100);
          expect(L.peek.h).toBeGreaterThanOrEqual(100);
          expect(pk.l).toBeGreaterThanOrEqual(bd.l);
          expect(pk.r).toBeLessThanOrEqual(bd.r);
          expect(pk.t).toBeGreaterThanOrEqual(bd.t);
          expect(pk.b).toBeLessThanOrEqual(bd.b);
          for (const o of [L.hopper, ...L.columns]) expect(overlap(L.peek, o)).toBe(false);
        }
        if (level >= 2) {
          for (let i = 0; i < 5; i++)
            for (let j = i + 1; j < 5; j++) expect(overlap(L.tray[i], L.tray[j])).toBe(false);
          for (const t of L.tray) for (const o of [L.body, L.hopper]) expect(overlap(t, o)).toBe(false);
        }
        for (const p of L.pads) for (const o of [L.body, L.hopper]) expect(overlap(p, o)).toBe(false);
        for (const c of L.columns) for (const o of [L.body, L.hopper]) expect(overlap(c, o)).toBe(false);
        // Landscape with a shelf: the table and shelf keep clear of Home and the help button beneath it (about 110 across, 200 down).
        if (level >= 3 && !L.portrait)
          for (const b of [...L.columns, ...L.shelf]) {
            expect(hits(b, 0, 0, 110, 200)).toBe(false);
            expect(rect(b).r).toBeLessThanOrEqual(view.w - 10);
          }
      });
    }
});

describe('level 5 backwards', () => {
  const within = (n: number) => n >= 0 && n <= MAX_COUNT;
  it('every pool rule is strictly increasing on 0–12 and has at least five valid inputs', () => {
    expect(BACK_POOL).toHaveLength(7);
    for (const r of BACK_POOL) {
      for (let n = 0; n < MAX_COUNT; n++) expect(apply(r, n + 1)).toBeGreaterThan(apply(r, n));
      const v = validInputs(r);
      expect(v.length).toBeGreaterThanOrEqual(5);
      for (const n of v) expect(within(n) && within(apply(r, n))).toBe(true);
    }
    expect(validInputs({ kind: 'num', a: 1, b: 3 })).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
    expect(validInputs({ kind: 'num', a: 1, b: -2 })).toEqual([2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
    expect(validInputs({ kind: 'num', a: 2, b: 0 })).toEqual([0, 1, 2, 3, 4, 5, 6]);
    expect(validInputs({ kind: 'num', a: 3, b: 0 })).toEqual([0, 1, 2, 3, 4]);
  });
  it('every tray, by enumeration: five rising valid inputs, the answer, the look-alike car, one right car', () => {
    for (const r of BACK_POOL) {
      const valid = validInputs(r);
      const answers = backAnswers(r);
      expect(answers.length).toBeGreaterThanOrEqual(2);
      for (const answer of answers) {
        const out = apply(r, answer);
        expect(answer).toBeGreaterThanOrEqual(1);
        expect(out).toBeGreaterThanOrEqual(1);
        const tray = backTray(r, answer);
        expect(tray).toHaveLength(5);
        expect(new Set(tray).size).toBe(5);
        expect([...tray].sort((a, b) => a - b)).toEqual(tray);
        for (const n of tray) expect(valid).toContain(n);
        expect(tray).toContain(answer);
        if (valid.includes(out)) expect(tray, `look-alike ${out}`).toContain(out);
        expect(tray.filter((n) => apply(r, n) === out)).toEqual([answer]);
      }
    }
    // The definition's examples: 11 came out of +3 has no 11 car; 5 came out of +3 has a 5 car.
    expect(backTray({ kind: 'num', a: 1, b: 3 }, 8)).not.toContain(11);
    expect(backTray({ kind: 'num', a: 1, b: 3 }, 2)).toContain(5);
  });
  it('direction points from every wrong tray car toward the answer', () => {
    for (const r of BACK_POOL)
      for (const answer of backAnswers(r)) {
        const out = apply(r, answer);
        for (const n of backTray(r, answer)) {
          if (n === answer) continue;
          expect(direction(r, n, out)).toBe(n < answer ? 'more' : 'fewer');
        }
      }
  });
  it('rounds over 300 seeds: two different rules, two wanted cars each with different answers, deterministic', () => {
    const seen = new Set<string>();
    for (const seed of SEEDS) {
      const round = makeRound(5, new Rng(seed)) as CountMachine[];
      expect(makeRound(5, new Rng(seed))).toEqual(round);
      expect(round).toHaveLength(2);
      expect(sameRule(round[0].rule, round[1].rule)).toBe(false);
      for (const m of round) {
        expect(isLook(m)).toBe(false);
        expect(BACK_POOL.some((r) => sameRule(r, m.rule))).toBe(true);
        seen.add(`${m.rule.a},${m.rule.b}`);
        expect(m.shelf).toEqual([]);
        expect(m.padOrders).toEqual([]);
        const w = m.wanted!;
        expect(w).toHaveLength(2);
        expect(w[0].answer).not.toBe(w[1].answer);
        expect(m.tray).toEqual(w[0].tray);
        for (const q of w) {
          expect(q.out).toBe(apply(m.rule, q.answer));
          expect(q.tray).toEqual(backTray(m.rule, q.answer));
          expect(backAnswers(m.rule)).toContain(q.answer);
        }
      }
    }
    expect(seen.size).toBe(BACK_POOL.length);
  });
  it('accounting: a wrong car counts from the first, two light the glow, one hint per machine, the round ends', () => {
    expect(counted(planFor(5), 0)).toBe(true);
    expect(counted(planFor(5), 1)).toBe(true);
    for (const seed of SEEDS.slice(0, 60)) {
      const round = makeRound(5, new Rng(seed)) as CountMachine[];
      const score = new Score();
      let wrongSent = 0;
      for (const m of round) {
        score.newMachine();
        m.wanted!.forEach((w, ask) => {
          score.newAsk();
          // The worst child: every wrong car first, lowest to highest; the answer is then the only car left.
          const wrong = w.tray.filter((n) => n !== w.answer);
          expect(wrong).toHaveLength(4);
          wrong.forEach((_, i) => {
            const o = score.answer(false, counted(planFor(5), ask));
            wrongSent++;
            expect(o).toBe(i === 1 ? 'glow' : 'miss');
          });
          expect(score.glowing).toBe(true);
          expect(score.answer(true, true)).toBe('right');
          expect(score.glowing).toBe(false);
        });
      }
      expect(score.misses).toBe(wrongSent);
      expect(score.misses).toBe(16);
      expect(score.hints).toBe(2);
    }
  });
  it("layout: level 5 uses level 2's boxes", () => {
    for (const view of VIEWS) expect(layout(view, 5)).toEqual(layout(view, 2));
  });
  it('speech and the card: its lines exist and every pool card has a spoken name', () => {
    const script = SCRIPT as Record<string, readonly string[]>;
    for (const k of [
      'rm.instruct.5',
      'rm.back.ask',
      'rm.back.want',
      'rm.back.more',
      'rm.back.fewer',
      'rm.back.right',
      'rm.card.take-two',
    ])
      expect(script[k]?.[0]?.length, k).toBeGreaterThan(0);
    const card = HOW_TO['rule-machine'];
    expect(JSON.stringify(card.steps)).toContain('"from":5');
    expect(JSON.stringify(card.note)).toContain('"from":5');
  });
});

describe('level 6 two machines', () => {
  const within = (v: number) => v >= 1 && v <= 12;
  const cases = chainCases();
  it('chain runs the first rule, then the second', () => {
    expect(chain(CHAIN_TIMES[0], CHAIN_ADDS[0], 3)).toEqual({ mid: 6, out: 7 });
    expect(chain(CHAIN_ADDS[0], CHAIN_TIMES[0], 3)).toEqual({ mid: 4, out: 8 });
  });
  it('cases by enumeration: 51, within 1–12 both ways, a car to predict, and the two orders differ', () => {
    expect(cases).toHaveLength(51);
    // The one combination with no second car to predict is left out.
    expect(cases.some((c) => !c.timesFirst && c.t.a === 3 && c.s.b === 3)).toBe(false);
    expect(cases.some((c) => c.timesFirst && c.t.a === 2 && c.s.b === 1 && c.n === 5)).toBe(true);
    for (const c of cases) {
      const [first, second] = caseOrder(c);
      const w = chain(first, second, c.n),
        r = chain(second, first, c.n);
      for (const v of [w.mid, w.out, r.mid, r.out]) expect(within(v)).toBe(true);
      expect(w.out).not.toBe(r.out);
      expect(spareCards(c.s, c.n, r.out).length).toBeGreaterThanOrEqual(2);
    }
  });
  it('every pair of every case: predicted car, shelf, fitting and help', () => {
    for (const c of cases)
      for (const seed of [1, 2, 3, 4, 5, 6, 7, 8]) {
        const p = pairFor(c, new Rng(seed));
        expect(p.m).not.toBe(p.n);
        expect(chainOk(p.first, p.second, p.m)).toBe(true);
        expect(p.watched).toBe(chain(p.first, p.second, p.n).out);
        expect(p.target).toBe(chain(p.second, p.first, p.n).out);
        // Pads: three distinct counts within 0–12, the right one where `right` says.
        const o = chainOptions(p);
        expect(new Set(o.values).size).toBe(3);
        expect(o.values[o.right]).toBe(chain(p.first, p.second, p.m).out);
        // Shelf: ×2, ×3 and two different add or take cards, the pair's own among them.
        expect(p.shelf).toHaveLength(4);
        expect(
          p.shelf
            .filter((r) => r.a > 1)
            .map((r) => r.a)
            .sort(),
        ).toEqual([2, 3]);
        const adds = p.shelf.filter((r) => r.a === 1);
        expect(adds).toHaveLength(2);
        expect(adds[0].b).not.toBe(adds[1].b);
        expect(adds.some((r) => sameRule(r, c.s))).toBe(true);
        expect(sameRule(p.shelf[p.reversed[0]], p.second)).toBe(true);
        expect(sameRule(p.shelf[p.reversed[1]], p.first)).toBe(true);
        // Fitting: the reversed pair, never the watched order, never two add or take cards; one to four pairs.
        const fit = fitting(p.shelf, p.n, p.target);
        const has = (i: number, j: number) => fit.some((f) => f[0] === i && f[1] === j);
        expect(has(p.reversed[0], p.reversed[1])).toBe(true);
        expect(has(p.reversed[1], p.reversed[0])).toBe(false);
        expect(fit.length).toBeGreaterThanOrEqual(1);
        expect(fit.length).toBeLessThanOrEqual(4);
        for (const [i, j] of fit) {
          expect(i).not.toBe(j);
          expect(chain(p.shelf[i], p.shelf[j], p.n).out).toBe(p.target);
          expect(p.shelf[i].a > 1 || p.shelf[j].a > 1).toBe(true);
        }
        // Whatever makes the target is in the list (no pair is judged wrong for its middle count).
        for (let i = 0; i < 4; i++)
          for (let j = 0; j < 4; j++)
            if (i !== j && chain(p.shelf[i], p.shelf[j], p.n).out === p.target) expect(has(i, j)).toBe(true);
        // Help: from every slot state, following nextCard reaches a fitting pair in at most four moves.
        const states: Slots[] = [[null, null]];
        for (let i = 0; i < 4; i++) {
          states.push([i, null], [null, i]);
          for (let j = 0; j < 4; j++) if (i !== j) states.push([i, j]);
        }
        for (const start of states) {
          const slots: [number | null, number | null] = [start[0], start[1]];
          let moves = 0;
          for (;;) {
            const mv = nextCard(p.shelf, slots, p.n, p.target, p.reversed);
            if (!mv) break;
            expect(++moves).toBeLessThanOrEqual(4);
            if (mv.kind === 'lift') {
              expect(slots[mv.slot]).not.toBeNull();
              slots[mv.slot] = null;
            } else {
              expect(slots[mv.slot]).toBeNull();
              expect(slots).not.toContain(mv.card);
              slots[mv.slot] = mv.card;
            }
          }
          expect(has(slots[0]!, slots[1]!)).toBe(true);
        }
        // From empty slots the help builds the watched pair reversed.
        expect(nextCard(p.shelf, [null, null], p.n, p.target, p.reversed)).toEqual({
          kind: 'place',
          card: p.reversed[0],
          slot: 0,
        });
      }
  });
  it('rounds over 300 seeds: two pairs, opposite orders, different add or take cards, deterministic', () => {
    for (const seed of SEEDS) {
      const round = makeChainRound(new Rng(seed));
      expect(round).toEqual(makeChainRound(new Rng(seed)));
      expect(round).toHaveLength(2);
      const [a, b] = round;
      expect(a.first.a > 1).not.toBe(b.first.a > 1);
      const add = (p: (typeof round)[number]) => (p.first.a === 1 ? p.first : p.second).b;
      expect(add(a)).not.toBe(add(b));
      for (const p of round) {
        expect(p.n).toBeGreaterThanOrEqual(1);
        expect(p.n).toBeLessThanOrEqual(6);
        expect(perm(p.padOrder, 3)).toBe(true);
      }
    }
  });
  it('accounting: a wrong pad counts, the first pair is free, the second counts, two light the glow, one hint per pair', () => {
    expect(counted(planFor(6), 0)).toBe(true);
    expect([0, 1, 2].map(pairCounted)).toEqual([false, true, true]);
    const score = new Score();
    for (let pair = 0; pair < 2; pair++) {
      score.newMachine();
      // The prediction: two wrong pads, then the right one.
      expect(score.answer(false, counted(planFor(6), 0))).toBe('miss');
      expect(score.answer(false, counted(planFor(6), 0))).toBe('glow');
      expect(score.answer(true, true)).toBe('right');
      // The build: the first pair run is free, then two counted; the glow adds no second hint on this pair.
      score.newAsk();
      let runs = 0;
      expect(score.answer(false, pairCounted(runs++))).toBe('free');
      expect(score.answer(false, pairCounted(runs++))).toBe('miss');
      expect(score.answer(false, pairCounted(runs++))).toBe('glow');
      expect(score.showMe()).toBe(false);
      expect(score.answer(true, pairCounted(runs++))).toBe('right');
    }
    expect([score.misses, score.hints]).toEqual([8, 2]);
  });
  it('layout at the four views: hopper, slots, pads and shelf at least 100, on screen, clear of the pet, corners and each other', () => {
    for (const view of VIEWS) {
      const L = layout(view, 6);
      expect(L.portrait).toBe(view.h > view.w);
      expect(L.slots).toHaveLength(2);
      expect(L.shelf).toHaveLength(4);
      expect(L.slots[1].x - L.slots[0].x).toBe(230);
      const inputs = [L.hopper, ...L.slots, ...L.pads, ...L.shelf];
      for (const b of [...inputs, L.body, L.second!, L.chute, ...L.columns]) {
        const r = rect(b);
        expect(r.l).toBeGreaterThanOrEqual(0);
        expect(r.t).toBeGreaterThanOrEqual(0);
        expect(r.r).toBeLessThanOrEqual(view.w);
        expect(r.b).toBeLessThanOrEqual(view.h);
        expect(hits(b, 0, view.h - 170, 170, view.h)).toBe(false);
        expect(hits(b, 0, 0, 120, 120)).toBe(false);
        expect(hits(b, view.w - 120, 0, view.w, 120)).toBe(false);
      }
      for (const b of inputs) {
        expect(b.w).toBeGreaterThanOrEqual(100);
        expect(b.h).toBeGreaterThanOrEqual(100);
      }
      // The pads and the shelf share the bottom row in turn; each set is clear of itself and of everything above.
      for (const row of [L.pads, L.shelf]) {
        const all = [L.hopper, ...L.slots, ...row];
        for (let i = 0; i < all.length; i++)
          for (let j = i + 1; j < all.length; j++) expect(overlap(all[i], all[j])).toBe(false);
        for (const b of row)
          for (const o of [L.body, L.second!, L.chute, ...L.columns]) expect(overlap(b, o)).toBe(false);
      }
      for (const c of L.columns)
        for (const o of [L.body, L.second!, L.hopper, L.chute]) expect(overlap(c, o)).toBe(false);
      // Each slot sits on its own body's front, and the output car (110 wide) stays on screen.
      L.slots.forEach((sl, i) => {
        const b = rect(i === 0 ? L.body : L.second!),
          r = rect(sl);
        expect(r.l >= b.l && r.r <= b.r && r.t >= b.t && r.b <= b.b).toBe(true);
      });
      expect(L.out.x + 55).toBeLessThanOrEqual(view.w);
      expect(L.link!.x).toBe((L.slots[0].x + L.slots[1].x) / 2);
    }
  });
  it('speech and the card: its lines exist, and the how-to card and the describeLevel line cover level 6', () => {
    const script = SCRIPT as Record<string, readonly string[]>;
    for (const k of [
      'rm.instruct.6',
      'rm.chain.step.plus',
      'rm.chain.step.take',
      'rm.chain.step.twice',
      'rm.chain.step.three',
      'rm.chain.went-in',
      'rm.chain.goes-in',
      'rm.chain.build',
      'rm.chain.want',
      'rm.chain.other-way',
    ])
      expect(script[k]?.[0]?.length, k).toBeGreaterThan(0);
    const card = HOW_TO['rule-machine'];
    expect(JSON.stringify(card.steps)).toContain('"from":6');
    expect(JSON.stringify(card.note)).toContain('"from":6');
  });
});

describe('wording guard', () => {
  it('no "=" in rm.* voice lines', () => {
    const keys = Object.keys(SCRIPT).filter((k) => k.startsWith('rm.'));
    for (const k of keys)
      for (const line of (SCRIPT as Record<string, readonly string[]>)[k]) expect(line, k).not.toContain('=');
  });
  it('how-to card exists and has no "="', () => {
    const card = HOW_TO['rule-machine'];
    expect(card).toBeDefined();
    expect(JSON.stringify(card)).not.toContain('=');
  });
});
