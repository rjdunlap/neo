import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import { computeView } from '../../engine/view';
import {
  angleAt, applyPush, AUTHORED_TEMPT, authoredPush, authoredTogether, BELL_ONE, BELL_TWO, friendBox, heavyTempts, hookTargets, HOOKS, land,
  LENGTH, makeRound, nextBackTime, nextToPush, period, petCorner, phaseAt, PLANS, planFor, rectsOverlap, rightHook, roundFits, seatAt,
  shellButtons, STEPS, stillSwing, swingLayout, together, watchTime, WEIGHT, widestApart, type Hook, type Line, type Swing,
} from './logic';

const VIEWS = {
  landscape: computeView(1024, 768),
  portrait: computeView(768, 1024),
  phone: computeView(844, 390),
  notch: computeView(844, 390, { top: 0, right: 47, bottom: 21, left: 47 }),
};

/** Taps a swing at the given times, landing waiting pushes as the clock passes their back points. */
function play(level: number, taps: number[], start: Swing = stillSwing('middle', 'bunny'), until = Infinity) {
  let s = start;
  let pending: number | null = null;
  const heights: number[] = [s.steps];
  let rungAt: number | null = s.rung ? 0 : null;
  const flush = (t: number) => {
    if (pending !== null && pending <= t) {
      s = land(s, pending);
      pending = null;
      heights.push(s.steps);
      if (s.rung && rungAt === null) rungAt = t;
    }
  };
  for (const t of taps) {
    flush(t);
    const r = applyPush(s, t, level);
    if (r.landsAt === t) {
      s = r.swing;
      heights.push(s.steps);
      if (s.rung && rungAt === null) rungAt = t;
    } else if (r.landsAt !== null) {
      s = r.swing;
      pending = r.landsAt;
    }
  }
  flush(until);
  return { swing: s, heights, rungAt };
}

describe('the beat', () => {
  it('gives 1, 1.5 and 2 seconds, longer for a longer rope', () => {
    expect(period('short')).toBeCloseTo(1);
    expect(period('middle')).toBeCloseTo(1.5);
    expect(period('long')).toBeCloseTo(2);
    const byLength = [...HOOKS].sort((a, b) => LENGTH[a] - LENGTH[b]);
    for (let i = 1; i < byLength.length; i++) expect(period(byLength[i])).toBeGreaterThan(period(byLength[i - 1]));
  });

  it('takes only the hook: different heights cross the back point at the same times', () => {
    expect(period.length).toBe(1);
    for (const h of HOOKS) {
      for (let k = 0; k < 4; k++) {
        const t = k * period(h);
        expect(angleAt(h, 5, 0, t)).toBeCloseTo(-5);
        expect(angleAt(h, 25, 0, t)).toBeCloseTo(-25);
      }
    }
  });
});

describe('pushes', () => {
  it('level 1: four taps at any times ring the bell, and nothing lowers the height', () => {
    for (let seed = 1; seed <= 500; seed++) {
      const rng = new Rng(seed);
      const taps = [0, 1, 2, 3].map(() => rng.range(0, 10)).sort((a, b) => a - b);
      const { swing, heights } = play(1, taps);
      expect(swing.rung).toBe(true);
      expect(swing.steps).toBe(STEPS);
      for (let i = 1; i < heights.length; i++) expect(heights[i]).toBeGreaterThanOrEqual(heights[i - 1]);
    }
  });

  it('from rest the first push lands at once and starts the beat', () => {
    for (const level of [1, 2, 3]) {
      const r = applyPush(stillSwing('long', 'duck'), 3.3, level);
      expect(r.landsAt).toBe(3.3);
      expect(r.swing.t0).toBe(3.3);
      expect(r.swing.steps).toBe(1);
    }
  });

  it('levels 2–3: a tap waits for the back point, taps while one waits merge', () => {
    const s = stillSwing('middle', 'duck', 1, 0);
    const r = applyPush(s, 0.4, 2);
    expect(r.landsAt).toBeCloseTo(nextBackTime(s, 0.4));
    expect(r.landsAt).toBeCloseTo(1.5);
    expect(r.swing.steps).toBe(1);
    const again = applyPush(r.swing, 0.9, 2);
    expect(again.landsAt).toBeNull();
    expect(again.swing).toBe(r.swing);
  });

  it('levels 2–3: mashing never rings faster than one push per swing; one tap a swing rings in four', () => {
    for (let seed = 1; seed <= 300; seed++) {
      const rng = new Rng(seed);
      const mash = Array.from({ length: 80 }, () => rng.range(0, 8)).sort((a, b) => a - b);
      const { rungAt } = play(2, mash);
      // From still: one at once, then one at each of the next three back points (1.5 s apart).
      expect(rungAt).not.toBeNull();
      expect(rungAt! - mash[0]).toBeGreaterThanOrEqual(3 * 1.5 - 1e-9);
    }
    for (let seed = 1; seed <= 300; seed++) {
      const rng = new Rng(seed);
      const taps = [0, ...[0, 1, 2].map((k) => k * 1.5 + rng.range(0.01, 1.49))];
      const { swing } = play(3, taps);
      expect(swing.rung).toBe(true);
    }
  });

  it('the bell latches and a rung swing takes no push', () => {
    const { swing } = play(1, [0, 1, 2, 3]);
    expect(swing.rung).toBe(true);
    const r = applyPush(swing, 5, 1);
    expect(r.landsAt).toBeNull();
    expect(r.swing.rung).toBe(true);
    expect(land(swing, 6).rung).toBe(true);
  });

  it('level 2 authored duck starts swinging low, so three landed pushes ring it', () => {
    const duck = authoredPush(planFor(2)).swings[0];
    expect(duck.steps).toBe(1);
    expect(duck.t0).not.toBeNull();
    const { swing } = play(2, [0.2, 1.7, 3.2], duck);
    expect(swing.rung).toBe(true);
  });

  it('the level 1–3 hint pushes always raise height until the bell', () => {
    for (const p of PLANS.filter((q) => q.mode === 'push')) {
      let swings = authoredPush(p).swings;
      let t = 0;
      for (let guard = 0; guard < 20 && nextToPush(swings) >= 0; guard++) {
        const i = nextToPush(swings);
        const before = swings[i].steps;
        const target = swings[i].t0 === null ? t : nextBackTime(swings[i], t);
        swings = swings.map((s, j) => (j === i ? land(s, target) : s));
        expect(swings[i].steps).toBeGreaterThan(before);
        t = target + 0.1;
      }
      expect(swings.every((s) => s.rung)).toBe(true);
    }
  });
});

describe('together', () => {
  const line = (petHook: Hook): Line => ({ petHook, petFriend: 'bunny', petHeight: 0.8, hook: 'short', friend: 'bunny', height: 0.8 });

  it('matches only on the same hook, and names the side by rope length', () => {
    for (const a of HOOKS) for (const b of HOOKS) {
      const r = together(line(a), b);
      if (a === b) expect(r.match).toBe(true);
      else expect(r).toEqual({ match: false, side: LENGTH[b] < LENGTH[a] ? 'quicker' : 'slower' });
    }
  });

  it('matching hooks stay exactly together at any two heights; every wrong hook parts by at least 1', () => {
    for (const a of HOOKS) for (const b of HOOKS) {
      const watch = watchTime(line(a));
      expect(watch).toBeLessThanOrEqual(4);
      if (a === b) {
        for (let t = 0; t <= watch; t += 0.05) expect(Math.abs(angleAt(a, 0.45, 0, t) / 0.45 - angleAt(b, 1, 0, t))).toBeLessThan(1e-9);
      } else {
        expect(widestApart(a, b, watch)).toBeGreaterThanOrEqual(1);
      }
    }
    // Short and long share the long swing's back points, and still part.
    expect(phaseAt('short', 0, 2)).toBeCloseTo(phaseAt('long', 0, 2));
    expect(widestApart('short', 'long', 4)).toBeGreaterThanOrEqual(1);
  });

  it('weights and heights never change the answer', () => {
    const base = authoredTogether(planFor(4));
    for (const friend of ['mouse', 'bear'] as const) for (const height of [0.45, 1]) {
      for (const h of HOOKS) expect(together({ ...base, friend, height }, h)).toEqual(together(base, h));
    }
  });

  it('each authored first line has the right hook named, and its tempting hook gives the named side', () => {
    const named: Record<number, Hook> = { 4: 'long', 5: 'middle', 6: 'short' };
    for (const id of [4, 5, 6]) {
      const l = authoredTogether(planFor(id));
      expect(rightHook(l)).toBe(named[id]);
      expect(together(l, AUTHORED_TEMPT[id].hook)).toEqual({ match: false, side: AUTHORED_TEMPT[id].side });
    }
    expect(heavyTempts(authoredTogether(planFor(5)))).toBe(true);
  });
});

describe('generation', () => {
  it('meets every plan filter over 500 seeds, repeats a seed, and never falls back', () => {
    for (const p of PLANS) {
      for (let seed = 1; seed <= 500; seed++) {
        for (const authored of [true, false]) {
          const { round, fellBack } = makeRound(p, new Rng(seed), authored);
          expect(fellBack, `level ${p.id} seed ${seed}`).toBe(false);
          expect(roundFits(p, round)).toBe(true);
          expect(makeRound(p, new Rng(seed), authored).round).toEqual(round);
          if (round.kind === 'together') {
            for (const l of round.lines) expect(together(l, l.hook).match).toBe(false);
            if (p.id === 5) expect(round.lines.filter((l) => [WEIGHT[l.friend], WEIGHT[l.petFriend]].sort().join() === 'heavy,light').length).toBeGreaterThanOrEqual(2);
          } else if (p.two) {
            for (const l of round.lines) expect(period(l.swings[1].hook) / period(l.swings[0].hook)).not.toBeCloseTo(1);
          }
        }
      }
    }
  });

  it('level 3 swaps sides on its second line, and its pair always has a beat ratio of at least 1.4', () => {
    const { round } = makeRound(planFor(3), new Rng(7), true);
    if (round.kind !== 'push') throw new Error('push');
    expect(round.lines[0].swings.map((s) => s.hook)).toEqual(['short', 'long']);
    expect(round.lines[1].swings.map((s) => s.hook)).toEqual(['long', 'short']);
    expect(period('long') / period('short')).toBeGreaterThanOrEqual(1.4);
  });
});

describe('layout', () => {
  for (const [name, v] of Object.entries(VIEWS)) {
    for (const n of [1, 2] as const) {
      it(`${name}, ${n} swing${n > 1 ? 's' : ''}: arcs inside the view, clear of the pet and buttons, targets big and apart`, () => {
        const L = swingLayout(n, v);
        const bell = n === 1 ? BELL_ONE : BELL_TWO;
        expect(L.bell).toBe(bell);
        const keepOut = [petCorner(v), ...shellButtons(v)];
        for (const col of L.columns) {
          for (const h of HOOKS) {
            for (let a = -bell; a <= bell; a += 1) {
              const box = friendBox(seatAt(L, col, h, a));
              expect(box.x, `${h} ${a} left`).toBeGreaterThanOrEqual(0);
              expect(box.x + box.w, `${h} ${a} right`).toBeLessThanOrEqual(v.w);
              expect(box.y).toBeGreaterThanOrEqual(0);
              expect(box.y + box.h).toBeLessThanOrEqual(v.h);
              for (const k of keepOut) expect(rectsOverlap(box, k), `${name} ${h} ${a}`).toBe(false);
            }
            for (const p of [col.mitten[h], col.bell[h]]) {
              expect(p.x).toBeGreaterThan(30);
              expect(p.x).toBeLessThan(v.w - 30);
              expect(p.y).toBeGreaterThan(30);
              const dot = { x: p.x - 30, y: p.y - 30, w: 60, h: 60 };
              for (const k of keepOut) expect(rectsOverlap(dot, k), `${name} spot ${h}`).toBe(false);
            }
          }
          const hooks = Object.values(hookTargets(col));
          for (const [i, a] of hooks.entries()) {
            expect(a.r * 2).toBeGreaterThanOrEqual(100);
            for (const k of keepOut) expect(rectsOverlap({ x: a.x - a.r, y: a.y - a.r, w: a.r * 2, h: a.r * 2 }, k)).toBe(false);
            for (const b of hooks.slice(i + 1)) expect(Math.hypot(a.x - b.x, a.y - b.y)).toBeGreaterThanOrEqual(a.r + b.r);
          }
          expect(Math.min(col.zone.w, col.zone.h)).toBeGreaterThanOrEqual(100);
        }
        if (n === 2) {
          const [a, b] = L.columns;
          expect(rectsOverlap(a.zone, b.zone)).toBe(false);
          // The two arcs never meet.
          expect(seatAt(L, a, 'long', bell).x + 60).toBeLessThan(seatAt(L, b, 'long', -bell).x - 60);
        }
        expect(L.scale).toBeGreaterThan(300);
      });
    }
  }
});
