import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import { computeView } from '../../engine/view';
import {
  angleAt,
  applyPush,
  ART_TOP,
  AUTHORED_TEMPT,
  BASKET_HALF,
  FRIENDS,
  friendHeight,
  GOALS,
  ropeOf,
  authoredPush,
  authoredTogether,
  BELL_ONE,
  BELL_TWO,
  friendBox,
  heavyTempts,
  hookTargets,
  HOOKS,
  land,
  LENGTH,
  makeRound,
  nextBackTime,
  nextToPush,
  period,
  petCorner,
  phaseAt,
  PLANS,
  planFor,
  rectsOverlap,
  rightHook,
  roundFits,
  seatAt,
  shellButtons,
  STEPS,
  stillSwing,
  swingLayout,
  together,
  watchTime,
  WEIGHT,
  widestApart,
  type Hook,
  type Line,
  type Swing,
  authoredRace,
  authoredRequest,
  backTimes,
  beatRatio,
  BIG,
  clapTimes,
  EVEN,
  firstBack,
  MARK_R,
  markerAt,
  raceTempts,
  raceWatch,
  requestStrip,
  SMALL,
  WANTED,
  type Race,
  type Request,
} from './logic';
import { stepLevel } from '../../progress/difficulty';

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
    for (let i = 1; i < byLength.length; i++)
      expect(period(byLength[i])).toBeGreaterThan(period(byLength[i - 1]));
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
  const line = (petHook: Hook): Line => ({
    petHook,
    petFriend: 'bunny',
    petHeight: 0.8,
    hook: 'short',
    friend: 'bunny',
    height: 0.8,
  });

  it('matches only on the same hook, and names the side by rope length', () => {
    for (const a of HOOKS)
      for (const b of HOOKS) {
        const r = together(line(a), b);
        if (a === b) expect(r.match).toBe(true);
        else expect(r).toEqual({ match: false, side: LENGTH[b] < LENGTH[a] ? 'quicker' : 'slower' });
      }
  });

  it('matching hooks stay exactly together at any two heights; every wrong hook parts by at least 1', () => {
    for (const a of HOOKS)
      for (const b of HOOKS) {
        const watch = watchTime(line(a));
        expect(watch).toBeLessThanOrEqual(4);
        if (a === b) {
          for (let t = 0; t <= watch; t += 0.05)
            expect(Math.abs(angleAt(a, 0.45, 0, t) / 0.45 - angleAt(b, 1, 0, t))).toBeLessThan(1e-9);
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
    for (const friend of ['mouse', 'bear'] as const)
      for (const height of [0.45, 1]) {
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
            if (p.id === 5)
              expect(
                round.lines.filter(
                  (l) => [WEIGHT[l.friend], WEIGHT[l.petFriend]].sort().join() === 'heavy,light',
                ).length,
              ).toBeGreaterThanOrEqual(2);
          } else if (round.kind === 'push' && p.two) {
            for (const l of round.lines)
              expect(period(l.swings[1].hook) / period(l.swings[0].hook)).not.toBeCloseTo(1);
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

describe('more friends and leaf goals', () => {
  const original = ['bunny', 'duck', 'mouse', 'bear', 'frog'] as const;
  const tallest = Math.max(...original.map(friendHeight));

  it('every rider is drawn at least 110 units tall, and no new one taller than the tallest of the first five', () => {
    for (const f of FRIENDS) {
      expect(friendHeight(f), f).toBeGreaterThanOrEqual(110);
      expect(friendHeight(f), f).toBeLessThanOrEqual(tallest);
    }
    // Heavier looks bigger: every heavy friend is drawn taller than every light one.
    for (const h of FRIENDS.filter((f) => WEIGHT[f] === 'heavy'))
      for (const l of FRIENDS.filter((f) => WEIGHT[f] === 'light'))
        expect(friendHeight(h), `${h} ${l}`).toBeGreaterThan(friendHeight(l));
    expect(Object.keys(ART_TOP).sort()).toEqual([...FRIENDS].sort());
  });

  it('on the short rope every rider rises no further above the hook than the first five do, and stays inside the view', () => {
    for (const [name, v] of Object.entries(VIEWS)) {
      const L = swingLayout(2, v);
      const firstOver = tallest - ropeOf(L, 'short');
      for (const col of L.columns) {
        for (const f of FRIENDS) {
          expect(friendHeight(f) - ropeOf(L, 'short'), `${name} ${f}`).toBeLessThanOrEqual(firstOver);
          for (const a of [-L.bell, 0, L.bell]) {
            const seat = seatAt(L, col, 'short', a);
            const top = { x: seat.x - 40, y: seat.y - friendHeight(f), w: 80, h: 20 };
            expect(top.y, `${name} ${f} ${a}`).toBeGreaterThanOrEqual(0);
            for (const k of shellButtons(v)) expect(rectsOverlap(top, k), `${name} ${f} ${a}`).toBe(false);
          }
        }
      }
    }
  });

  it('levels 5 and 6 pair light and heavy from the wider pool and reach every new friend; level 4 keeps same-kind pairs', () => {
    for (const id of [5, 6]) {
      const seen = new Set<string>();
      for (let seed = 1; seed <= 500; seed++) {
        const { round, fellBack } = makeRound(planFor(id), new Rng(seed), seed % 3 === 0);
        expect(fellBack).toBe(false);
        if (round.kind !== 'together') throw new Error('together');
        for (const l of round.lines) seen.add(l.friend).add(l.petFriend);
      }
      for (const f of ['cat', 'pig', 'cow']) expect(seen.has(f), `level ${id} ${f}`).toBe(true);
    }
    for (let seed = 1; seed <= 200; seed++) {
      const { round } = makeRound(planFor(4), new Rng(seed), false);
      if (round.kind !== 'together') throw new Error('together');
      for (const l of round.lines) expect(l.friend).toBe(l.petFriend);
    }
  });

  it('a push round has one goal kind, the authored round keeps the bell, and seeded rounds reach every kind', () => {
    for (const id of [1, 2, 3]) {
      const seen = new Set<string>();
      for (let seed = 1; seed <= 200; seed++) {
        const { round } = makeRound(planFor(id), new Rng(seed), false);
        if (round.kind !== 'push') throw new Error('push');
        seen.add(round.goal);
        expect(makeRound(planFor(id), new Rng(seed), true).round).toMatchObject({ goal: 'bell' });
      }
      expect([...seen].sort()).toEqual([...GOALS].sort());
    }
  });

  it("every goal sits at the arc's forward end inside the view, and the apple's basket is on the grass, clear of the swing and the pet", () => {
    for (const [name, v] of Object.entries(VIEWS)) {
      for (const n of [1, 2] as const) {
        const L = swingLayout(n, v);
        for (const col of L.columns) {
          for (const h of HOOKS) {
            const front = seatAt(L, col, h, L.bell);
            expect(col.bell[h].x, `${name} ${h}`).toBeGreaterThan(front.x);
            expect(col.bell[h].y).toBeLessThan(front.y);
            const b = col.basket[h];
            const box = {
              x: b.x - BASKET_HALF.w,
              y: b.y - BASKET_HALF.h,
              w: BASKET_HALF.w * 2,
              h: BASKET_HALF.h * 2,
            };
            expect(box.x).toBeGreaterThanOrEqual(0);
            expect(box.x + box.w).toBeLessThanOrEqual(v.w);
            expect(box.y + box.h).toBeLessThanOrEqual(v.h);
            expect(box.y, `${name} basket below the seats`).toBeGreaterThan(L.seatY + 12);
            expect(rectsOverlap(box, petCorner(v)), `${name} ${n} basket ${h}`).toBe(false);
          }
        }
      }
    }
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
            for (const k of keepOut)
              expect(rectsOverlap({ x: a.x - a.r, y: a.y - a.r, w: a.r * 2, h: a.r * 2 }, k)).toBe(false);
            for (const b of hooks.slice(i + 1))
              expect(Math.hypot(a.x - b.x, a.y - b.y)).toBeGreaterThanOrEqual(a.r + b.r);
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

describe('level 7: who comes back first?', () => {
  const plan = planFor(7);
  const races = (authored: boolean) =>
    Array.from({ length: 500 }, (_, i) => {
      const { round } = makeRound(plan, new Rng(i + 1), authored);
      if (round.kind !== 'predict') throw new Error('predict');
      return round.lines;
    });

  it('the shorter rope comes back first for every pair, whatever the weights and heights', () => {
    for (const a of HOOKS)
      for (const b of HOOKS) {
        if (a === b) continue;
        for (const fa of FRIENDS)
          for (const fb of FRIENDS)
            for (const ha of [SMALL, EVEN, BIG])
              for (const hb of [SMALL, EVEN, BIG]) {
                const race: Race = { hooks: [a, b], friends: [fa, fb], heights: [ha, hb] };
                const s = firstBack(race),
                  o = s === 0 ? 1 : 0;
                expect(LENGTH[race.hooks[s]]).toBeLessThan(LENGTH[race.hooks[o]]);
                // Released together from the back, the first back point reached is the shorter rope's.
                const back = (k: 0 | 1) =>
                  nextBackTime({ ...stillSwing(race.hooks[k], race.friends[k], 1, 0) }, 0.01);
                expect(back(s)).toBeLessThan(back(o));
              }
      }
  });

  it('the authored race is mouse on short (left) and bear on long, at one height', () => {
    expect(authoredRace()).toEqual({
      hooks: ['short', 'long'],
      friends: ['mouse', 'bear'],
      heights: [EVEN, EVEN],
    });
    const { round } = makeRound(plan, new Rng(3), true);
    if (round.kind !== 'predict') throw new Error('predict');
    expect(round.lines[0]).toEqual(authoredRace());
  });

  it('every race has two different hooks and friends; every round holds a tempting race; sides are seeded', () => {
    let shortRight = 0,
      heavyTempt = 0,
      pushTempt = 0;
    for (const authored of [true, false]) {
      for (const lines of races(authored)) {
        expect(lines).toHaveLength(3);
        for (const r of lines) {
          expect(r.hooks[0]).not.toBe(r.hooks[1]);
          expect(r.friends[0]).not.toBe(r.friends[1]);
          if (firstBack(r) === 1) shortRight++;
        }
        expect(lines.some(raceTempts)).toBe(true);
        for (const r of lines.filter(raceTempts)) {
          const s = firstBack(r),
            o = s === 0 ? 1 : 0;
          if (WEIGHT[r.friends[s]] === 'heavy' && WEIGHT[r.friends[o]] !== 'heavy') heavyTempt++;
          if (r.heights[s] > r.heights[o]) pushTempt++;
        }
      }
    }
    expect(shortRight).toBeGreaterThan(300);
    expect(heavyTempt).toBeGreaterThan(50);
    expect(pushTempt).toBeGreaterThan(50);
  });

  it('the watch lasts until the slower friend has come back once', () => {
    for (const lines of races(false))
      for (const r of lines) {
        expect(raceWatch(r)).toBeGreaterThanOrEqual(Math.max(period(r.hooks[0]), period(r.hooks[1])));
        expect(raceWatch(r)).toBeLessThanOrEqual(2.5);
      }
  });

  for (const [name, v] of Object.entries(VIEWS)) {
    it(`${name}: both friends are tap targets at least 110 tall, apart, and the paw stays in the view clear of the corners`, () => {
      const L = swingLayout(2, v);
      const keepOut = [petCorner(v), ...shellButtons(v)];
      for (const lines of races(true).slice(0, 60))
        for (const r of lines) {
          const boxes = [0, 1].map((k) =>
            friendBox(seatAt(L, L.columns[k], r.hooks[k], -r.heights[k] * L.bell)),
          );
          for (const b of boxes) {
            expect(b.h).toBeGreaterThanOrEqual(110);
            expect(b.w).toBeGreaterThanOrEqual(100);
            for (const k of keepOut) expect(rectsOverlap(b, k)).toBe(false);
          }
          expect(rectsOverlap(boxes[0], boxes[1])).toBe(false);
          for (const k of [0, 1])
            for (let a = -L.bell; a <= L.bell; a += 3) {
              const m = markerAt(seatAt(L, L.columns[k], r.hooks[k], a), r.friends[k]);
              expect(m.y - MARK_R, `${name} ${r.friends[k]} on ${r.hooks[k]}`).toBeGreaterThanOrEqual(0);
              expect(m.x - MARK_R).toBeGreaterThanOrEqual(0);
              expect(m.x + MARK_R).toBeLessThanOrEqual(v.w);
            }
        }
    });
  }
});

describe('level 8: twice as quick', () => {
  const plan = planFor(8);

  it('beatRatio is exactly 2 only for long with short and exactly ½ only for short with long', () => {
    for (const p of HOOKS)
      for (const h of HOOKS) {
        const r = beatRatio(p, h);
        expect(Math.abs(r - 2) < 1e-9).toBe(p === 'long' && h === 'short');
        expect(Math.abs(r - 0.5) < 1e-9).toBe(p === 'short' && h === 'long');
      }
  });

  it('each request has exactly one right hook, and every wrong hook says which way to go', () => {
    const lines: Line[] = [
      { ...authoredRequest() },
      {
        petHook: 'short',
        petFriend: 'cat',
        petHeight: EVEN,
        hook: 'middle',
        friend: 'cow',
        height: EVEN,
        request: 'half',
      },
      ...HOOKS.map((h): Line => ({
        petHook: h,
        petFriend: 'cat',
        petHeight: EVEN,
        hook: h,
        friend: 'cow',
        height: EVEN,
        request: 'together',
      })),
    ];
    for (const l of lines) {
      const right = HOOKS.filter((h) => together(l, h).match);
      expect(right).toEqual([rightHook(l)]);
      expect(Math.abs(beatRatio(l.petHook, rightHook(l)) - WANTED[l.request!])).toBeLessThan(1e-9);
      for (const h of HOOKS) {
        const t = together(l, h);
        if (t.match) continue;
        // "Quicker" means her rope must get longer to reach the asked-for beat.
        expect(t.side === 'quicker').toBe(LENGTH[h] < LENGTH[rightHook(l)]);
      }
    }
    expect(rightHook(lines[0])).toBe('short');
    expect(rightHook(lines[1])).toBe('long');
  });

  it('claps fire only when both swings are back at once, and every right pair claps inside its watch', () => {
    for (const p of HOOKS)
      for (const h of HOOKS) {
        for (const t of clapTimes(p, h, 6)) {
          expect(Math.abs(t / period(p) - Math.round(t / period(p)))).toBeLessThan(1e-9);
          expect(Math.abs(t / period(h) - Math.round(t / period(h)))).toBeLessThan(1e-9);
          expect(phaseAt(p, 0, t)).toBeCloseTo(-1);
          expect(phaseAt(h, 0, t)).toBeCloseTo(-1);
        }
      }
    for (const request of ['twice', 'half', 'together'] as Request[]) {
      for (const petHook of HOOKS) {
        const l: Line = {
          petHook,
          petFriend: 'cat',
          petHeight: EVEN,
          hook: petHook,
          friend: 'cow',
          height: EVEN,
          request,
        };
        if (Math.abs(beatRatio(petHook, rightHook(l)) - WANTED[request]) > 1e-9) continue;
        const claps = clapTimes(petHook, rightHook(l), watchTime(l));
        expect(claps.length, `${request} on ${petHook}`).toBeGreaterThanOrEqual(1);
        expect(backTimes(rightHook(l), watchTime(l)).length).toBeGreaterThanOrEqual(2);
      }
    }
    // A "half" line shows her long rope come back twice, so its second shared return is inside the watch.
    const half: Line = {
      petHook: 'short',
      petFriend: 'cat',
      petHeight: EVEN,
      hook: 'middle',
      friend: 'cow',
      height: EVEN,
      request: 'half',
    };
    expect(clapTimes('short', 'long', watchTime(half))).toEqual([2, 4]);
    // Levels 4–6 keep their watch: two of the pet's swings.
    for (const h of HOOKS)
      expect(watchTime({ ...half, petHook: h, request: undefined })).toBeCloseTo(Math.min(4, 2 * period(h)));
  });

  it('the authored first line asks bunny-on-long for twice, with her duck on the middle hook', () => {
    expect(authoredRequest()).toMatchObject({
      petHook: 'long',
      petFriend: 'bunny',
      hook: 'middle',
      friend: 'duck',
      request: 'twice',
    });
  });

  it('every round holds both requests and the together line, and every starting hook is wrong', () => {
    for (let seed = 1; seed <= 500; seed++)
      for (const authored of [true, false]) {
        const { round } = makeRound(plan, new Rng(seed), authored);
        if (round.kind !== 'together') throw new Error('together');
        expect(round.lines.map((l) => l.request).sort()).toEqual(['half', 'together', 'twice']);
        for (const l of round.lines) expect(together(l, l.hook).match).toBe(false);
        if (authored) expect(round.lines[0]).toEqual(authoredRequest());
      }
  });

  for (const [name, v] of Object.entries(VIEWS)) {
    it(`${name}: the request strip sits in the view under the pet's swing, clear of the pet and the swings`, () => {
      const L = swingLayout(2, v);
      const s = requestStrip(L);
      expect(s.x).toBeGreaterThanOrEqual(0);
      expect(s.y + s.h).toBeLessThanOrEqual(v.h);
      expect(rectsOverlap(s, petCorner(v)), name).toBe(false);
      for (const h of HOOKS)
        for (let a = -L.bell; a <= L.bell; a += 2)
          expect(rectsOverlap(s, friendBox(seatAt(L, L.columns[0], h, a)))).toBe(false);
    });
  }
});

describe('level order', () => {
  it("pre-K steps 3 → 7 → 4; school runs 4 to 8; level 7's window includes pre-K and school", async () => {
    const { swingPals } = await import('./index');
    const prek = swingPals.levels('prek');
    expect(stepLevel(3, 1, prek)).toBe(7);
    expect(stepLevel(7, 1, prek)).toBe(4);
    expect(stepLevel(4, -1, prek)).toBe(7);
    const school = swingPals.levels('school');
    expect([school.min, school.max]).toEqual([4, 8]);
    expect(stepLevel(6, 1, school)).toBe(7);
    expect(stepLevel(7, 1, school)).toBe(8);
    expect(swingPals.describeLevel?.(7)).toBe('Who comes back first?');
    expect(swingPals.describeLevel?.(8)).toBe('Twice as quick');
  });
});
