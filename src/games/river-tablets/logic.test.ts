import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import { computeView } from '../../engine/view';
import {
  CELLS, CELL, CRACK, JAR, ROW, arrive, askEnvelope, askTablet, briefFor, corners, crack, crackEnvelope, deliveryFor, envelopeTally,
  hintFor, isMixed, kindChanges, markCount, overlaps, penInvariant, press, pressRow, readBack, readyToTip, startEnvelope, startPen,
  startTablet, tabletDone, tabletLayout, tabletTally, tapJar, waiting,
  type EnvelopeBrief, type EnvelopeState, type Kind, type PenState, type RowsBrief, type TabletState, type TokensBrief,
} from './logic';

const SEEDS = Array.from({ length: 300 }, (_, i) => i);
const other = (k: Kind): Kind => (k === 'sheep' ? 'jar' : 'sheep');

describe('briefs', () => {
  it('level 1 draws 3-5 sheep with one colour each', () => {
    for (const s of SEEDS) {
      const b = briefFor(1, new Rng(s)) as TokensBrief;
      expect(b.id).toBe('tokens');
      expect(b.sheep).toBeGreaterThanOrEqual(3);
      expect(b.sheep).toBeLessThanOrEqual(5);
      expect(b.colors).toHaveLength(b.sheep);
    }
  });
  it('level 2 draws two envelopes of 3-6 tokens that differ', () => {
    for (const s of SEEDS) {
      const b = briefFor(2, new Rng(s)) as EnvelopeBrief;
      expect(b.envelopes).toHaveLength(2);
      for (const n of b.envelopes) {
        expect(n).toBeGreaterThanOrEqual(3);
        expect(n).toBeLessThanOrEqual(6);
      }
      expect(b.envelopes[0]).not.toBe(b.envelopes[1]);
    }
  });
  it('level 3 draws two mixed deliveries', () => {
    for (const s of SEEDS) {
      const b = briefFor(3, new Rng(s)) as RowsBrief;
      expect(b.deliveries).toHaveLength(2);
      for (const d of b.deliveries) {
        expect(isMixed(d)).toBe(true);
        expect(d.length).toBeGreaterThanOrEqual(4);
        expect(d.length).toBeLessThanOrEqual(6);
        const sheep = d.filter((k) => k === 'sheep').length;
        expect(sheep).toBeGreaterThanOrEqual(1);
        expect(d.length - sheep).toBeGreaterThanOrEqual(1);
        expect(sheep).toBeLessThanOrEqual(4);
        expect(d.length - sheep).toBeLessThanOrEqual(4);
        expect(kindChanges(d)).toBeGreaterThanOrEqual(2);
      }
    }
  });
  it('the same seed gives the same brief', () => {
    for (const level of [1, 2, 3]) for (const s of SEEDS.slice(0, 50)) expect(briefFor(level, new Rng(s))).toEqual(briefFor(level, new Rng(s)));
  });
  it('deliveryFor is mixed with the right counts for every allowed pair', () => {
    for (let sheep = 1; sheep <= 4; sheep++) for (let jars = 1; jars <= 4; jars++) {
      if (sheep + jars < 4 || sheep + jars > 6) continue;
      for (let s = 0; s < 50; s++) {
        const d = deliveryFor(sheep, jars, new Rng(s));
        expect(isMixed(d)).toBe(true);
        expect(readBack(d)).toEqual({ sheep, jar: jars });
      }
    }
  });
});

describe('level 1: one token each', () => {
  it('holds the invariant from every reachable state under random taps and arrivals', () => {
    for (const s of SEEDS) {
      const rng = new Rng(s);
      let p = startPen(rng.int(3, 5));
      expect(penInvariant(p)).toBe(true);
      for (let i = 0; i < 60; i++) {
        p = rng.chance(0.5) ? arrive(p) : tapJar(p).state;
        expect(penInvariant(p)).toBe(true);
      }
    }
  });
  it('a tap while a sheep walks is a wobble that changes nothing', () => {
    const p = startPen(4);
    const r = tapJar(p);
    expect(r.result).toBe('wobble');
    expect(r.state).toEqual(p);
    const q = tapJar(arrive(p)).state; // token, next sheep walking
    expect(q.walking).toBe(true);
    const r2 = tapJar(q);
    expect(r2.result).toBe('wobble');
    expect(r2.state).toEqual(q);
  });
  it('a tap with no untokened sheep and sheep still to come is a wobble', () => {
    const q = tapJar(arrive(startPen(3))).state;
    expect(q.tokens).toBe(1);
    expect(tapJar(q).result).toBe('wobble');
  });
  it('exactly one token per sheep, then one tip, then wobbles', () => {
    for (let sheep = 3; sheep <= 5; sheep++) {
      let p: PenState = startPen(sheep);
      for (let i = 0; i < sheep; i++) {
        expect(readyToTip(p)).toBe(false);
        p = arrive(p);
        const r = tapJar(p);
        expect(r.result).toBe('token');
        p = r.state;
        expect(p.tokens).toBe(i + 1);
        expect(p.walking).toBe(i + 1 < sheep);
        expect(penInvariant(p)).toBe(true);
      }
      expect(readyToTip(p)).toBe(true);
      const tip = tapJar(p);
      expect(tip.result).toBe('tip');
      expect(tip.state.tipped).toBe(true);
      expect(readyToTip(tip.state)).toBe(false);
      const after = tapJar(tip.state);
      expect(after.result).toBe('wobble');
      expect(after.state).toEqual(tip.state);
    }
  });
});

describe('level 2: marks on the envelope', () => {
  it('crack reports match, fewer, more with diff and paired', () => {
    for (let m = 0; m <= 8; m++) for (let t = 3; t <= 6; t++) {
      const c = crack(m, t);
      expect(c.verdict === 'match').toBe(m === t);
      expect(c.verdict).toBe(m === t ? 'match' : m < t ? 'fewer' : 'more');
      expect(c.diff).toBe(Math.abs(m - t));
      expect(c.paired).toBe(Math.min(m, t));
    }
  });
  it('pressing toggles a cell and twice restores the marks; eight cells hold a count of 6', () => {
    expect(CELLS).toBeGreaterThanOrEqual(6);
    expect(CELLS).toBe(8);
    for (let c = 0; c < CELLS; c++) {
      const e = startEnvelope(5);
      const once = press(e, c);
      expect(markCount(once)).toBe(1);
      expect(press(once, c).marks).toEqual(e.marks);
    }
    let e = startEnvelope(6);
    for (let c = 0; c < 6; c++) e = press(e, c);
    expect(crackEnvelope(e).crack.verdict).toBe('match');
  });
  it('pressing is impossible after a match', () => {
    let e = startEnvelope(3);
    for (let c = 0; c < 3; c++) e = press(e, c);
    e = crackEnvelope(e).state;
    expect(e.matched).toBe(true);
    for (let c = 0; c < CELLS; c++) expect(press(e, c).marks).toEqual(e.marks);
  });
  it('a miss counts, the glow waits for the second, and a match adds no miss', () => {
    let e = startEnvelope(4);
    const r1 = crackEnvelope(e);
    expect(r1.crack.verdict).toBe('fewer');
    expect(r1.state.misses).toBe(1);
    expect(r1.state.glowing).toBe(false);
    expect(r1.state.hinted).toBe(false);
    const r2 = crackEnvelope(r1.state);
    expect(r2.state.misses).toBe(2);
    expect(r2.state.glowing).toBe(true);
    expect(r2.state.hinted).toBe(true);
    e = r2.state;
    for (let c = 0; c < 4; c++) e = press(e, c);
    const ok = crackEnvelope(e);
    expect(ok.crack.verdict).toBe('match');
    expect(ok.state.matched).toBe(true);
    expect(ok.state.misses).toBe(2);
  });
  it('asking glows and hints at once', () => {
    const e = askEnvelope(startEnvelope(4));
    expect(e.glowing).toBe(true);
    expect(e.hinted).toBe(true);
    expect(e.misses).toBe(0);
  });
  it('hintFor presses an empty cell when fewer, lifts the last mark when more, null when equal', () => {
    expect(hintFor(startEnvelope(4))).toEqual({ cell: 0, action: 'press' });
    let e = startEnvelope(3);
    for (const c of [0, 1, 2]) e = press(e, c);
    expect(hintFor(e)).toBeNull();
    e = press(press(e, 5), 7);
    expect(hintFor(e)).toEqual({ cell: 7, action: 'lift' });
  });
  it('following the hint from any marking reaches a match in |marks - tokens| presses', () => {
    for (let t = 3; t <= 6; t++) {
      const patterns: boolean[][] = [];
      for (let k = 0; k <= 8; k++) patterns.push(Array.from({ length: 8 }, (_, i) => i < k));
      for (let k = 0; k <= 8; k++) patterns.push(Array.from({ length: 8 }, (_, i) => i >= 8 - k));
      for (let s = 0; s < 40; s++) {
        const rng = new Rng(s * 7 + t);
        patterns.push(Array.from({ length: 8 }, () => rng.chance(0.5)));
      }
      for (const marks of patterns) {
        let e: EnvelopeState = { ...startEnvelope(t), marks: marks.slice() };
        const expected = Math.abs(markCount(e) - t);
        let presses = 0;
        for (let guard = 0; guard < 20; guard++) {
          const h = hintFor(e);
          if (!h) break;
          const before = markCount(e);
          e = press(e, h.cell);
          expect(markCount(e)).toBe(before + (h.action === 'press' ? 1 : -1));
          presses++;
        }
        expect(presses).toBe(expected);
        expect(crackEnvelope(e).crack.verdict).toBe('match');
      }
    }
  });
  it('envelopeTally sums misses and counts hinted envelopes once each', () => {
    let a = startEnvelope(4);
    a = crackEnvelope(crackEnvelope(crackEnvelope(a).state).state).state; // 3 misses, hinted
    a = askEnvelope(a);
    let b = askEnvelope(startEnvelope(5));
    b = crackEnvelope(b).state; // 1 miss, hinted
    const c = startEnvelope(3);
    expect(envelopeTally([a, b, c])).toEqual({ misses: 4, hints: 2 });
    expect(envelopeTally([c])).toEqual({ misses: 0, hints: 0 });
  });
});

describe('level 3: which row', () => {
  const deliveries = (n: number) => Array.from({ length: n }, (_, s) => (briefFor(3, new Rng(s)) as RowsBrief).deliveries[s % 2]);

  it('accepts exactly the waiting good\'s row', () => {
    for (const d of deliveries(100)) {
      const s = startTablet(d);
      const good = waiting(s)!;
      expect(good).toBe(d[0]);
      const r = pressRow(s, good);
      expect(r.accepted).toBe(true);
      expect(r.state.placed).toBe(1);
      expect(r.state.rows[good]).toBe(1);
      expect(r.state.misses).toBe(0);
    }
  });
  it('a first wrong press changes neither placed nor rows and adds one miss', () => {
    const d: Kind[] = ['sheep', 'jar', 'sheep', 'jar'];
    const s = startTablet(d);
    const r = pressRow(s, 'jar');
    expect(r.accepted).toBe(false);
    expect(r.moved).toBe(false);
    expect(r.state.placed).toBe(0);
    expect(r.state.rows).toEqual(s.rows);
    expect(r.state.misses).toBe(1);
    expect(r.state.hinted).toBe(false);
    expect(r.state.glowing).toBeNull();
  });
  it('a second wrong press moves the good to its row and hints', () => {
    const d: Kind[] = ['sheep', 'jar', 'sheep', 'jar'];
    const r1 = pressRow(startTablet(d), 'jar');
    const r2 = pressRow(r1.state, 'jar');
    expect(r2.accepted).toBe(false);
    expect(r2.moved).toBe(true);
    expect(r2.state.placed).toBe(1);
    expect(r2.state.rows).toEqual({ sheep: 1, jar: 0 });
    expect(r2.state.misses).toBe(2);
    expect(r2.state.hinted).toBe(true);
    expect(r2.state.glowing).toBe('sheep');
    expect(r2.state.wrongOnCurrent).toBe(0);
  });
  it('later wrong presses still add misses, but a tablet counts at most one hint', () => {
    const d: Kind[] = ['sheep', 'jar', 'sheep', 'jar'];
    let s = startTablet(d);
    for (let i = 0; i < 4; i++) {
      const wrong = other(waiting(s)!);
      s = pressRow(s, wrong).state;
      s = pressRow(s, wrong).state;
    }
    expect(tabletDone(s)).toBe(true);
    expect(s.misses).toBe(8);
    expect(s.rows).toEqual(readBack(d));
    expect(tabletTally([s])).toEqual({ misses: 8, hints: 1 });
    const clean = startTablet(d);
    expect(tabletTally([s, clean, askTablet(clean)])).toEqual({ misses: 8, hints: 2 });
  });
  it('askTablet glows the waiting row and hints; unchanged when done', () => {
    const s = askTablet(startTablet(['jar', 'sheep', 'jar', 'sheep']));
    expect(s.glowing).toBe('jar');
    expect(s.hinted).toBe(true);
    expect(s.misses).toBe(0);
  });
  it('playing every delivery correctly ends with rows equal to the read-back, none above 4, no misses', () => {
    for (const d of deliveries(100)) {
      let s = startTablet(d);
      while (!tabletDone(s)) {
        const r = pressRow(s, waiting(s)!);
        expect(r.accepted).toBe(true);
        s = r.state;
      }
      expect(s.rows).toEqual(readBack(d));
      expect(s.rows.sheep).toBeLessThanOrEqual(4);
      expect(s.rows.jar).toBeLessThanOrEqual(4);
      expect(s.misses).toBe(0);
      expect(tabletTally([s])).toEqual({ misses: 0, hints: 0 });
    }
  });
  it('playing with mistakes still ends with rows equal to the read-back', () => {
    for (const d of deliveries(100)) {
      const rng = new Rng(d.length * 31 + d.indexOf('jar'));
      let s: TabletState = startTablet(d);
      while (!tabletDone(s)) {
        const good = waiting(s)!;
        s = pressRow(s, rng.chance(0.5) ? good : other(good)).state;
      }
      expect(s.rows).toEqual(readBack(d));
    }
  });
  it('pressing after the tablet is done is rejected without a miss', () => {
    const d: Kind[] = ['sheep', 'jar', 'sheep', 'jar'];
    let s = startTablet(d);
    while (!tabletDone(s)) s = pressRow(s, waiting(s)!).state;
    for (const k of ['sheep', 'jar'] as Kind[]) {
      const r = pressRow(s, k);
      expect(r.accepted).toBe(false);
      expect(r.moved).toBe(false);
      expect(r.state).toEqual(s);
      expect(r.state.misses).toBe(0);
    }
  });
});

describe('layout', () => {
  const views = [computeView(1024, 768), computeView(768, 1024)];
  it('is non-null with full-size targets clear of the corners', () => {
    for (const v of views) for (const level of [1, 2, 3]) {
      const l = tabletLayout(level, v);
      expect(l, `level ${level} ${v.w}x${v.h}`).not.toBeNull();
      for (const r of l!.inputs) {
        expect(Math.min(r.w, r.h)).toBeGreaterThanOrEqual(100);
        for (const c of corners(v)) expect(overlaps(r, c)).toBe(false);
      }
      for (const r of l!.cells ?? []) expect(Math.min(r.w, r.h)).toBeGreaterThanOrEqual(100);
    }
  });
  it('keeps the base sizes at or above 100', () => {
    expect(CELL).toBeGreaterThanOrEqual(100);
    expect(Math.min(JAR.w, JAR.h)).toBeGreaterThanOrEqual(100);
    expect(Math.min(CRACK.w, CRACK.h)).toBeGreaterThanOrEqual(100);
    expect(Math.min(ROW.w, ROW.h)).toBeGreaterThanOrEqual(100);
  });
  it('level 2 has 8 cells inside the ball, apart, and the crack clear of the ball', () => {
    for (const v of views) {
      const l = tabletLayout(2, v)!;
      expect(l.cells).toHaveLength(8);
      for (const c of l.cells!) {
        expect(c.x).toBeGreaterThanOrEqual(l.ball!.x);
        expect(c.y).toBeGreaterThanOrEqual(l.ball!.y);
        expect(c.x + c.w).toBeLessThanOrEqual(l.ball!.x + l.ball!.w);
        expect(c.y + c.h).toBeLessThanOrEqual(l.ball!.y + l.ball!.h);
      }
      l.cells!.forEach((a, i) => l.cells!.forEach((b, j) => { if (i < j) expect(overlaps(a, b)).toBe(false); }));
      expect(overlaps(l.crack!, l.ball!)).toBe(false);
    }
  });
  it('level 3 rows clear each other and the store', () => {
    for (const v of views) {
      const l = tabletLayout(3, v)!;
      expect(l.rows).toHaveLength(2);
      expect(overlaps(l.rows![0], l.rows![1])).toBe(false);
      for (const r of l.rows!) expect(overlaps(r, l.store!)).toBe(false);
    }
  });
  it('puts the crack and store below in portrait and beside in landscape', () => {
    const [land, port] = views;
    const l2p = tabletLayout(2, port)!;
    expect(l2p.crack!.y).toBeGreaterThanOrEqual(l2p.ball!.y + l2p.ball!.h);
    const l3p = tabletLayout(3, port)!;
    expect(l3p.store!.y).toBeGreaterThanOrEqual(l3p.rows![1].y + l3p.rows![1].h);
    const l2l = tabletLayout(2, land)!;
    expect(l2l.crack!.x).toBeGreaterThanOrEqual(l2l.ball!.x + l2l.ball!.w);
    const l3l = tabletLayout(3, land)!;
    expect(l3l.store!.x).toBeGreaterThanOrEqual(l3l.rows![0].x + l3l.rows![0].w);
  });
  it('fits a short wide phone view, because logical units scale', () => {
    for (const level of [1, 2, 3]) expect(tabletLayout(level, computeView(844, 390))).not.toBeNull();
  });
  it('returns null rather than throwing, or shrinks nothing, on a view too small', () => {
    const tiny = { ...computeView(1024, 768), w: 600, h: 300 };
    for (const level of [1, 2, 3]) {
      expect(() => tabletLayout(level, tiny)).not.toThrow();
      expect(tabletLayout(level, tiny)).toBeNull();
    }
  });
});

// ——— Levels 4–5 ———
import {
  ONE_CAP, SCATTER_COLS, SCATTER_ROWS, STRIP, TEN_CAP, askCheck, askTens, cartCount, cartOf, checkTally, chooseNumber, chooseVerdict,
  handIn, lift, lineUp, shortest, stamp, startCheck, startTens, tensHint, tensTally, value, verdictFor,
  type CheckBrief, type Cart, type CheckState, type Mark, type TensBrief, type TensState,
} from './logic';

const READINGS: { tens: number; ones: number }[] = [];
for (let t = 0; t <= TEN_CAP; t++) for (let o = 0; o <= ONE_CAP; o++) READINGS.push({ tens: t, ones: o });
const NS = Array.from({ length: 18 }, (_, i) => 12 + i);
const withReading = (n: number, r: { tens: number; ones: number }): TensState => ({ ...startTens(n), ...r });

describe('level 4 briefs', () => {
  it('draws two carts of 12-29 that differ, packed then spilled', () => {
    for (const s of SEEDS) {
      const b = briefFor(4, new Rng(s)) as TensBrief;
      expect(b.id).toBe('tens');
      const [a, c] = b.carts;
      expect(cartCount(a)).toBeGreaterThanOrEqual(12);
      expect(cartCount(a)).toBeLessThanOrEqual(29);
      expect(cartCount(c)).toBeGreaterThanOrEqual(12);
      expect(cartCount(c)).toBeLessThanOrEqual(29);
      expect(cartCount(a)).not.toBe(cartCount(c));
      expect(a.loose).toBeGreaterThanOrEqual(2);
      expect(a.loose).toBeLessThanOrEqual(9);
      expect(c.loose).toBeGreaterThanOrEqual(11);
      expect(c.loose).toBeLessThanOrEqual(19);
      expect(c.crates).toBeLessThanOrEqual(1);
      expect(c.crates).toBeGreaterThanOrEqual(0);
    }
  });
  it('scatters one distinct in-grid slot per loose basket', () => {
    for (const s of SEEDS) {
      const b = briefFor(4, new Rng(s)) as TensBrief;
      b.carts.forEach((cart, i) => {
        const slots = b.scatter[i];
        expect(slots).toHaveLength(cart.loose);
        expect(new Set(slots).size).toBe(slots.length);
        for (const x of slots) {
          expect(Number.isInteger(x)).toBe(true);
          expect(x).toBeGreaterThanOrEqual(0);
          expect(x).toBeLessThanOrEqual(SCATTER_COLS * SCATTER_ROWS - 1);
        }
      });
    }
  });
  it('is deterministic per seed', () => {
    for (const s of SEEDS) expect(briefFor(4, new Rng(s))).toEqual(briefFor(4, new Rng(s)));
  });
});

describe('level 5 briefs', () => {
  it('draws two counts of 12-29 that differ, each cart within 3, at least one off', () => {
    const seen = new Set<string>();
    for (const s of SEEDS) {
      const b = briefFor(5, new Rng(s)) as CheckBrief;
      expect(b.id).toBe('check');
      const [x, y] = b.deliveries;
      expect(x.t).not.toBe(y.t);
      let off = 0;
      for (const d of b.deliveries) {
        expect(d.t).toBeGreaterThanOrEqual(12);
        expect(d.t).toBeLessThanOrEqual(29);
        expect(Math.abs(d.c - d.t)).toBeLessThanOrEqual(3);
        expect(d.c).toBeGreaterThanOrEqual(0);
        expect(cartOf(d.c).loose).toBeLessThanOrEqual(9);
        if (d.c !== d.t) off++;
        const v = verdictFor(d.t, d.c);
        seen.add(`${v.verdict}${v.by}`);
      }
      expect(off).toBeGreaterThanOrEqual(1);
    }
    for (const by of [1, 2, 3]) {
      expect(seen.has(`short${by}`)).toBe(true);
      expect(seen.has(`extra${by}`)).toBe(true);
    }
    expect(seen.has('right0')).toBe(true);
  });
  it('is deterministic per seed', () => {
    for (const s of SEEDS) expect(briefFor(5, new Rng(s))).toEqual(briefFor(5, new Rng(s)));
  });
});

describe('tablet reading', () => {
  it('value ignores the order marks were pressed in', () => {
    const run = (seq: Mark[]) => seq.reduce((st, m) => stamp(st, m).state, startTens(20));
    const base: Mark[] = ['ten', 'ten', 'one', 'one', 'one', 'ten'];
    const perms = (a: Mark[]): Mark[][] => (a.length <= 1 ? [a] : a.flatMap((x, i) => perms([...a.slice(0, i), ...a.slice(i + 1)]).map((p) => [x, ...p])));
    for (const p of perms(base)) {
      const r = run(p);
      expect(value(r)).toBe(33);
      expect({ t: r.tens, o: r.ones }).toEqual({ t: 3, o: 3 });
    }
  });
  it('shortest(n) is the unique minimum of marks among readings of n within caps', () => {
    for (const n of NS) {
      const eq = READINGS.filter((r) => value(r) === n);
      const min = Math.min(...eq.map((r) => r.tens + r.ones));
      const best = eq.filter((r) => r.tens + r.ones === min);
      expect(best).toEqual([shortest(n)]);
    }
  });
  it('stamping at a cap changes nothing and reports capped; lift on empty is a no-op', () => {
    const full = withReading(20, { tens: TEN_CAP, ones: ONE_CAP });
    const a = stamp(full, 'ten');
    expect(a.capped).toBe(true);
    expect(a.state).toEqual(full);
    const b = stamp(full, 'one');
    expect(b.capped).toBe(true);
    expect(b.state).toEqual(full);
    expect(stamp(startTens(20), 'ten').capped).toBe(false);
    const empty = startTens(20);
    expect(lift(empty, 'ten')).toEqual(empty);
    expect(lift(empty, 'one')).toEqual(empty);
  });
});

describe('handing in a tablet', () => {
  it('the shortest reading matches; any other equal reading is longer, free, and tidied', () => {
    for (const n of NS) {
      for (const r of READINGS.filter((q) => value(q) === n)) {
        const out = handIn(withReading(n, r));
        const isShort = r.tens === shortest(n).tens && r.ones === shortest(n).ones;
        expect(out.result).toBe(isShort ? 'match' : 'longer');
        expect(out.state.misses).toBe(0);
        expect(out.state.hinted).toBe(false);
        expect(out.state.done).toBe(true);
        expect({ tens: out.state.tens, ones: out.state.ones }).toEqual(shortest(n));
      }
    }
  });
  it('unequal readings are one miss each, glow after the second, one hint per tablet', () => {
    for (const n of NS) {
      const r = READINGS.find((q) => value(q) !== n)!;
      let st = withReading(n, r);
      const first = handIn(st);
      expect(first.result).toBe('wrong');
      expect(first.state.misses).toBe(1);
      expect(first.state.glowing).toBe(false);
      expect(first.state.hinted).toBe(false);
      const second = handIn(first.state);
      expect(second.state.misses).toBe(2);
      expect(second.state.glowing).toBe(true);
      expect(second.state.hinted).toBe(true);
      const third = handIn(second.state);
      expect(third.state.misses).toBe(3);
      const other = withReading(n + 1, r);
      expect(tensTally([third.state, other])).toEqual({ misses: 3, hints: 1 });
      st = askTens(askTens(third.state));
      expect(tensTally([st, st])).toEqual({ misses: 6, hints: 2 });
      expect(tensTally([st]).hints).toBe(1);
    }
  });
  it('asking counts once per tablet', () => {
    const a = askTens(askTens(startTens(15)));
    expect(a.glowing).toBe(true);
    expect(tensTally([a, startTens(20)])).toEqual({ misses: 0, hints: 1 });
  });
});

describe('level 4 hint', () => {
  it('leads from every state to an equal reading within the distance to the shortest, never stamping at a cap', () => {
    for (const n of NS) {
      const T = shortest(n);
      for (const r of READINGS) {
        let st = withReading(n, r);
        const bound = Math.abs(r.tens - T.tens) + Math.abs(r.ones - T.ones);
        let steps = 0;
        while (value(st) !== n) {
          const h = tensHint(st);
          expect(h).not.toBe('handIn');
          if (h === 'stampTen') {
            expect(st.tens).toBeLessThan(TEN_CAP);
            st = stamp(st, 'ten').state;
          } else if (h === 'stampOne') {
            expect(st.ones).toBeLessThan(ONE_CAP);
            st = stamp(st, 'one').state;
          } else if (h === 'liftTen') {
            expect(st.tens).toBeGreaterThan(0);
            st = lift(st, 'ten');
          } else {
            expect(st.ones).toBeGreaterThan(0);
            st = lift(st, 'one');
          }
          steps++;
          expect(steps).toBeLessThanOrEqual(bound);
        }
        expect(tensHint(st)).toBe('handIn');
        expect(handIn(st).state.done).toBe(true);
      }
    }
  });
});

describe('level 5 checking', () => {
  const D = { t: 24, c: 21 };
  it('verdictFor names short, right or extra with the gap', () => {
    expect(verdictFor(24, 21)).toEqual({ verdict: 'short', by: 3 });
    expect(verdictFor(24, 24)).toEqual({ verdict: 'right', by: 0 });
    expect(verdictFor(24, 26)).toEqual({ verdict: 'extra', by: 2 });
  });
  it('right commits at once; short and extra only open', () => {
    const ok = chooseVerdict(startCheck({ t: 20, c: 20 }), 'right');
    expect(ok.result).toBe('right');
    expect(ok.state.done).toBe(true);
    const bad = chooseVerdict(startCheck(D), 'right');
    expect(bad.result).toBe('wrong');
    expect(bad.state.misses).toBe(1);
    for (const v of ['short', 'extra'] as const) {
      const o = chooseVerdict(startCheck(D), v);
      expect(o.result).toBe('none');
      expect(o.state.open).toBe(v);
      expect(o.state.misses).toBe(0);
      expect(o.state.done).toBe(false);
    }
  });
  it('changing an open verdict is free, and a number with none open commits nothing', () => {
    let st = startCheck(D);
    for (const v of ['extra', 'short', 'extra', 'short'] as const) st = chooseVerdict(st, v).state;
    expect(st.open).toBe('short');
    expect(st.misses).toBe(0);
    const n = chooseNumber(startCheck(D), 3);
    expect(n.result).toBe('none');
    expect(n.state).toEqual(startCheck(D));
  });
  it('every wrong committed pair is exactly one miss, and the right pair finishes', () => {
    for (const d of [-3, -2, -1, 0, 1, 2, 3]) {
      const cs = startCheck({ t: 20, c: 20 + d });
      const want = verdictFor(20, 20 + d);
      for (const v of ['short', 'extra'] as const) {
        for (const by of [1, 2, 3]) {
          const r = chooseNumber(chooseVerdict(cs, v).state, by);
          if (v === want.verdict && by === want.by) {
            expect(r.result).toBe('right');
            expect(r.state.done).toBe(true);
            expect(r.state.misses).toBe(0);
          } else {
            expect(r.result).toBe('wrong');
            expect(r.state.misses).toBe(1);
            expect(r.state.open).toBeNull();
          }
        }
      }
      const rr = chooseVerdict(cs, 'right');
      expect(rr.result).toBe(d === 0 ? 'right' : 'wrong');
    }
  });
  it('the lineup comes after the second miss; one hint per cart', () => {
    let st: CheckState = startCheck(D);
    st = chooseVerdict(st, 'right').state;
    expect(st.misses).toBe(1);
    expect(st.lined).toBe(false);
    expect(st.hinted).toBe(false);
    st = chooseVerdict(st, 'right').state;
    expect(st.misses).toBe(2);
    expect(st.lined).toBe(true);
    expect(st.hinted).toBe(true);
    st = chooseVerdict(st, 'right').state;
    expect(checkTally([st, startCheck(D)])).toEqual({ misses: 3, hints: 1 });
  });
  it('asking lines up once per cart', () => {
    const a = askCheck(askCheck(startCheck(D)));
    expect(a.lined).toBe(true);
    expect(checkTally([a, askCheck(startCheck(D))])).toEqual({ misses: 0, hints: 2 });
    expect(checkTally([a, startCheck(D)]).hints).toBe(1);
  });
});

describe('lineUp', () => {
  const check = (r: { tens: number; ones: number }, cart: Cart) => {
    const l = lineUp(r, cart);
    const count = cartCount(cart);
    const v = value(r);
    expect(l.gaps).toBe(Math.max(0, v - count));
    expect(l.extra).toBe(Math.max(0, count - v));
    const placed = l.tens.reduce((n, t) => n + t.filled, 0) + l.ones.filter(Boolean).length;
    expect(placed + l.extra).toBe(count);
    expect(l.tens).toHaveLength(r.tens);
    expect(l.ones).toHaveLength(r.ones);
  };
  it('level 5: shortest reading against the cart that came', () => {
    for (let t = 12; t <= 29; t++) for (let d = -3; d <= 3; d++) check(shortest(t), cartOf(t + d));
  });
  it('level 4: any reading within caps against any cart shape', () => {
    for (let crates = 0; crates <= 2; crates++) {
      for (let loose = 0; loose <= 19; loose++) {
        const cart = { crates, loose };
        if (cartCount(cart) < 12 || cartCount(cart) > 29) continue;
        for (const r of READINGS) check(r, cart);
      }
    }
  });
});

describe('levels 4-5 layout', () => {
  const views = [
    computeView(1024, 768),
    computeView(768, 1024),
    computeView(844, 390),
    computeView(844, 390, { top: 0, right: 47, bottom: 21, left: 47 }),
  ];
  for (const level of [4, 5]) {
    it(`level ${level} fits every view with full-size, non-overlapping targets`, () => {
      for (const v of views) {
        const l = tabletLayout(level, v);
        expect(l).not.toBeNull();
        if (!l) continue;
        for (const p of l.inputs) expect(Math.min(p.w, p.h)).toBeGreaterThanOrEqual(100);
        for (const c of l.crates!) {
          expect(Math.min(c.w, c.h)).toBeGreaterThanOrEqual(100);
          expect(c.x).toBeGreaterThanOrEqual(l.lane.x);
          expect(c.y).toBeGreaterThanOrEqual(l.lane.y);
          expect(c.x + c.w).toBeLessThanOrEqual(l.lane.x + l.lane.w);
          expect(c.y + c.h).toBeLessThanOrEqual(l.lane.y + l.lane.h);
        }
        for (const p of [...l.inputs, ...l.crates!, l.lane, l.lineup]) {
          for (const q of corners(v)) if (p !== l.lane && p !== l.lineup) expect(overlaps(p, q)).toBe(false);
        }
        const solo = l.inputs.filter((p) => p !== l.tablet);
        solo.forEach((p, i) => solo.forEach((q, j) => { if (i < j) expect(overlaps(p, q)).toBe(false); }));
        expect(STRIP.w).toBeGreaterThanOrEqual(10 * 40);
        if (level === 5) for (const p of l.inputs) expect(overlaps(p, l.lineup)).toBe(false);
      }
    });
  }
});
