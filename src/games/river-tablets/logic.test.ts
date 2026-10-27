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
