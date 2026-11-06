import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import { computeView } from '../../engine/view';
import {
  boardsFor, brighterOf, CHECK, fartherOf, judgeFarther, judgeOrder, LANE_3, nearOrder, ORDER_SETS, orderBoardsFor, OrderMarks, PLANS, planFor, TASSEL,
  windowRings, closerHelp, CloserWalk, corners, CORE_R, farLayout, FarTally, GlowTaps, GLOW, haloRadius, haloRings, helpFor,
  HOME_CORNER, judgeBrighter, judgeMatch, LANES, LANE_H, look, movable, MIN_WINDOW, nearestStop, other, pairsFor, ringBox, ringHits, sideGlow,
  STOPS, STOP_GAP, readablyDifferent, type Board, type Lane, type Stop,
} from './logic';

const seeds = Array.from({ length: 500 }, (_, i) => i + 1);
const views = {
  landscape: computeView(1024, 768),
  portrait: computeView(768, 1024),
  phone: computeView(844, 390),
  notch: computeView(844, 390, { top: 0, right: 47, bottom: 21, left: 47 }),
};

describe('model', () => {
  it('look is strictly decreasing, halo radius decreasing, area proportional to look', () => {
    for (let i = 1; i < STOPS.length; i++) {
      expect(look(GLOW, STOPS[i])).toBeLessThan(look(GLOW, STOPS[i - 1]));
      expect(haloRadius(look(GLOW, STOPS[i]))).toBeLessThan(haloRadius(look(GLOW, STOPS[i - 1])));
    }
    const k = Math.PI * haloRadius(look(GLOW, 1)) ** 2 / look(GLOW, 1);
    for (const s of STOPS) expect(Math.PI * haloRadius(look(GLOW, s)) ** 2 / look(GLOW, s)).toBeCloseTo(k, 6);
  });
  it('core and side glow are constant', () => {
    expect(CORE_R).toBeGreaterThan(0);
    expect(sideGlow()).toEqual(sideGlow());
    expect(sideGlow().core).toBe(CORE_R + 6);
  });
});

describe('level 3 pairs', () => {
  it('two different legal pairs, brighter once in each lane, readably different', () => {
    for (const seed of seeds) for (const authored of [false, true]) {
      const ps = pairsFor(new Rng(seed), authored);
      expect(ps).toHaveLength(2);
      const keys = ps.map((p) => [Math.min(p.A, p.B), Math.max(p.A, p.B)].join('-'));
      expect(keys[0]).not.toBe(keys[1]);
      for (const k of keys) expect(k).not.toBe('3-4');
      expect(ps.map(brighterOf).sort()).toEqual(['A', 'B']);
      for (const p of ps) {
        expect(p.A).not.toBe(p.B);
        expect(readablyDifferent(p.A, p.B)).toBe(true);
        const hi = Math.max(look(GLOW, p.A), look(GLOW, p.B));
        const lo = Math.min(look(GLOW, p.A), look(GLOW, p.B));
        expect(hi / lo).toBeGreaterThanOrEqual(2);
        const near = brighterOf(p);
        expect(judgeBrighter(p, near)).toBe('right');
        expect(judgeBrighter(p, other(near))).toBe('dimmer');
        expect(helpFor(3, p)).toBe(near);
      }
    }
  });
  it('authored first pair is A=1, B=3', () => {
    for (const seed of seeds) expect(pairsFor(new Rng(seed), true)[0]).toEqual({ A: 1, B: 3 });
  });
  it('same seed gives same pairs', () => {
    expect(pairsFor(new Rng(9), false)).toEqual(pairsFor(new Rng(9), false));
  });
});

describe('level 4 boards', () => {
  it('legal boards, one same stop, others readably different, verdicts correct', () => {
    for (const seed of seeds) for (const authored of [false, true]) {
      const bs = boardsFor(new Rng(seed), authored);
      expect(bs).toHaveLength(2);
      for (const b of bs) {
        expect([1, 2]).toContain(b.r);
        expect(b.r === 2 ? [4] : [3, 4]).toContain(b.m);
        expect(movable(b)).toBe(other(b.ref));
        expect(STOPS.filter((s) => judgeMatch(b, s) === 'same')).toEqual([b.r]);
        for (const s of STOPS) {
          if (s === b.r) continue;
          expect(readablyDifferent(s, b.r)).toBe(true);
          expect(judgeMatch(b, s)).toBe(s < b.r ? 'too-bright' : 'too-dim');
        }
        expect(helpFor(4, b)).toBe(b.r);
      }
      expect(bs[0].ref).not.toBe(bs[1].ref);
      expect(bs[0].r).not.toBe(bs[1].r);
    }
  });
  it('authored first board is ref A r=2 m=4', () => {
    for (const seed of seeds) expect(boardsFor(new Rng(seed), true)[0]).toEqual({ ref: 'A', r: 2, m: 4 });
  });
  it('same seed gives same boards', () => {
    expect(boardsFor(new Rng(9), false)).toEqual(boardsFor(new Rng(9), false));
  });
});

describe('tally and help', () => {
  it('scripted board: wrong check, hint, hint again, right = 1 miss 1 hint', () => {
    const t = new FarTally();
    const b: Board = { ref: 'A', r: 2, m: 4 };
    t.next();
    expect(judgeMatch(b, 4)).toBe('too-dim');
    t.miss();
    expect(t.hint()).toBe(true);
    expect(t.hint()).toBe(false);
    expect(judgeMatch(b, helpFor(4, b))).toBe('same');
    expect([t.misses, t.hints]).toEqual([1, 1]);
  });
  it('hint counts once per item and resets on next', () => {
    const t = new FarTally();
    t.hint(); t.next();
    expect(t.hint()).toBe(true);
    expect(t.hints).toBe(2);
  });
  it('glow after two misses on the item in hand', () => {
    const t = new FarTally();
    t.miss();
    expect(t.glow).toBe(false);
    t.miss();
    expect(t.glow).toBe(true);
    t.next();
    expect(t.glow).toBe(false);
    expect(t.misses).toBe(2);
  });
  it('closerHelp from any start reaches both at stop 1', () => {
    for (const a of STOPS) for (const b of STOPS) {
      const at: Record<Lane, Stop> = { A: a, B: b };
      let steps = 0;
      for (let h = closerHelp(at); h; h = closerHelp(at)) {
        expect(h.to).toBeLessThan(at[h.lane]);
        expect(look(GLOW, h.to)).toBeGreaterThan(look(GLOW, at[h.lane]));
        at[h.lane] = h.to;
        expect(++steps).toBeLessThanOrEqual(6);
      }
      expect(at).toEqual({ A: 1, B: 1 });
    }
  });
});

describe('level 1 and 2 trackers', () => {
  it('GlowTaps: three counted taps finish once all back', () => {
    const g = new GlowTaps();
    expect(g.tap(0)).toBe(true);
    expect(g.tap(0)).toBe(false);
    expect(g.count).toBe(1);
    expect(g.tap(1)).toBe(true);
    expect(g.tap(2)).toBe(true);
    expect(g.done).toBe(false);
    g.back(0); g.back(1);
    expect(g.done).toBe(false);
    g.back(2);
    expect(g.done).toBe(true);
    expect(g.tap(0)).toBe(false);
    expect(g.count).toBe(3);
  });
  it('GlowTaps: repeats on one light count after it returns', () => {
    const g = new GlowTaps();
    for (let i = 0; i < 3; i++) {
      expect(g.tap(1)).toBe(true);
      g.back(1);
    }
    expect(g.done).toBe(true);
  });
  it('CloserWalk: cheer once per stop per light, dimmer away, done at both 1', () => {
    const w = new CloserWalk();
    expect(w.cross('A', 4, 3)).toBe('brighter');
    expect(w.cross('A', 3, 4)).toBe('dimmer');
    expect(w.cross('A', 4, 3)).toBeNull();
    expect(w.cross('B', 4, 3)).toBe('brighter');
    expect(w.cross('A', 3, 3)).toBeNull();
    for (const s of [3, 2, 1] as Stop[]) expect(look(GLOW, s)).toBeGreaterThan(look(GLOW, (s + 1) as Stop));
    expect(w.done).toBe(false);
    w.rest('A', 1);
    expect(w.done).toBe(false);
    w.rest('B', 1);
    expect(w.done).toBe(true);
  });
  it('nearestStop snaps', () => {
    const xs = [200, 400, 600, 800];
    expect(nearestStop(-50, xs)).toBe(1);
    expect(nearestStop(290, xs)).toBe(1);
    expect(nearestStop(310, xs)).toBe(2);
    expect(nearestStop(690, xs)).toBe(3);
    expect(nearestStop(5000, xs)).toBe(4);
    expect(nearestStop(600, xs)).toBe(3);
  });
});

describe('layout', () => {
  for (const [name, v] of Object.entries(views)) for (const level of [1, 2, 3, 4, 5, 6]) {
    it(`${name} level ${level}`, () => {
      const l = farLayout(v, level);
      expect(l).not.toBeNull();
      if (!l) return;
      const room = { x: 0, y: 0, w: v.w, h: v.h };
      const within = (a: { x: number; y: number; w: number; h: number }) =>
        a.x >= room.x && a.y >= room.y && a.x + a.w <= room.w && a.y + a.h <= room.h;
      expect(l.touchR).toBeGreaterThanOrEqual(level === 1 ? 80 : 60);
      expect(l.window.w).toBeGreaterThanOrEqual(MIN_WINDOW.w);
      expect(l.window.h).toBeGreaterThanOrEqual(MIN_WINDOW.h);
      expect(within(l.window)).toBe(true);
      for (let i = 1; i < l.stopX.length; i++) expect(l.stopX[i] - l.stopX[i - 1]).toBeGreaterThanOrEqual(STOP_GAP);
      if (level >= 2) {
        expect(l.stopX).toHaveLength(4);
        expect(Math.abs(l.laneY.B - l.laneY.A)).toBeGreaterThanOrEqual(LANE_H);
        expect(within(l.strip!)).toBe(true);
        expect(l.strip!.y + l.strip!.h).toBeLessThanOrEqual(l.window.y);
      }
      const touches = [
        ...(level >= 2 && level <= 4 ? LANES.flatMap((lane) => l.stopX.map((x) => ({ x, y: l.laneY[lane], r: l.touchR }))) : []),
        ...(level === 1 || level >= 3 && level !== 4 ? l.spots.map((s) => ({ ...s, r: l.touchR })) : []),
        ...(l.tassel ? [l.tassel] : []),
      ];
      for (const [i, a] of touches.entries()) for (const b of touches.slice(i + 1)) expect(Math.hypot(a.x - b.x, a.y - b.y)).toBeGreaterThanOrEqual(a.r + b.r);
      if (level >= 5) {
        expect(l.tassel!.r * 2).toBeGreaterThanOrEqual(TASSEL);
        const t = ringBox(l.tassel!);
        expect(t.x >= l.strip!.x && t.y >= l.strip!.y && t.x + t.w <= l.strip!.x + l.strip!.w && t.y + t.h <= l.strip!.y + l.strip!.h).toBe(true);
        // The display lights stay left of the tassel.
        expect(l.stopX[3] + 26).toBeLessThan(t.x);
        expect(l.spots).toHaveLength(level === 6 ? 3 : 2);
        expect(windowRings(l)).toHaveLength(level === 6 ? 3 : 2);
      } else expect(l.tassel).toBeNull();
      if (level === 6) {
        expect(l.lanes3).toHaveLength(3);
        for (let i = 1; i < 3; i++) expect(l.lanes3[i] - l.lanes3[i - 1]).toBeGreaterThanOrEqual(LANE_3);
        expect(l.lanes3[0] - LANE_3 / 2).toBeGreaterThanOrEqual(l.strip!.y);
        expect(l.lanes3[2] + LANE_3 / 2).toBeLessThanOrEqual(l.strip!.y + l.strip!.h);
        for (let i = 1; i < 3; i++) expect(l.spots[i].x - l.spots[i - 1].x).toBeGreaterThanOrEqual(240);
      }
      for (const c of touches) {
        expect(within(ringBox(c))).toBe(true);
        for (const k of corners(v)) expect(ringHits(c, k)).toBe(false);
      }
      for (const k of corners(v)) {
        const ov = (a: { x: number; y: number; w: number; h: number }) => a.x < k.x + k.w && k.x < a.x + a.w && a.y < k.y + k.h && k.y < a.y + a.h;
        expect(ov(l.window)).toBe(false);
        if (l.strip) expect(ov(l.strip)).toBe(false);
      }
      for (const h of haloRings(l)) {
        const b = ringBox(h);
        expect(b.x).toBeGreaterThanOrEqual(l.window.x);
        expect(b.y).toBeGreaterThanOrEqual(l.window.y);
        expect(b.x + b.w).toBeLessThanOrEqual(l.window.x + l.window.w);
        expect(b.y + b.h).toBeLessThanOrEqual(l.window.y + l.window.h);
        if (l.check) expect(ringHits(h, l.check)).toBe(false);
      }
      if (level === 4) {
        expect(l.check!.w).toBeGreaterThanOrEqual(CHECK);
        expect(l.check!.h).toBeGreaterThanOrEqual(CHECK);
        expect(within(l.check!)).toBe(true);
      } else expect(l.check).toBeNull();
      expect(HOME_CORNER.w).toBeGreaterThan(0);
    });
  }
  it('a tiny view returns null at every level', () => {
    for (const level of [1, 2, 3, 4, 5, 6]) expect(farLayout({ w: 600, h: 400, scale: 1 } as never, level)).toBeNull();
  });
});

describe('level 5 pairs', () => {
  it('the farther is the dimmer, once in each lane, and only it is accepted', () => {
    for (const seed of seeds) for (const authored of [false, true]) {
      const ps = pairsFor(new Rng(seed), authored);
      expect(ps.map(fartherOf).sort()).toEqual(['A', 'B']);
      for (const p of ps) {
        const far = fartherOf(p);
        expect(p[far]).toBeGreaterThan(p[other(far)]);
        expect(look(GLOW, p[other(far)]) / look(GLOW, p[far])).toBeGreaterThanOrEqual(2.25);
        expect(judgeFarther(p, far)).toBe('right');
        expect(judgeFarther(p, other(far))).toBe('nearer');
      }
    }
  });
});

describe('level 6 boards', () => {
  const allPicks = [[0, 1, 2], [0, 2, 1], [1, 0, 2], [1, 2, 0], [2, 0, 1], [2, 1, 0]];
  it('both stop sets, never already in order, exactly one accepted order, neighbours readable', () => {
    for (const seed of seeds) for (const authored of [false, true]) {
      const bs = orderBoardsFor(new Rng(seed), authored);
      expect(bs).toHaveLength(2);
      expect(bs.map((b) => [...b.stops].sort().join()).sort()).toEqual(ORDER_SETS.map((x) => x.join()).sort());
      for (const b of bs) {
        expect(b.stops[0] < b.stops[1] && b.stops[1] < b.stops[2]).toBe(false);
        expect(allPicks.filter((p) => judgeOrder(b, p) === 'right')).toEqual([nearOrder(b)]);
        const s = nearOrder(b).map((i) => b.stops[i]);
        for (let k = 1; k < 3; k++) expect(look(GLOW, s[k - 1]) / look(GLOW, s[k])).toBeGreaterThanOrEqual(2.25);
        for (const p of allPicks) {
          const v = judgeOrder(b, p);
          if (v !== 'right') expect(p[v]).not.toBe(nearOrder(b)[v]);
        }
      }
    }
    expect(orderBoardsFor(new Rng(3), true)[0].stops).toEqual([3, 1, 2]);
  });
  it('clearing a mark clears the later ones; locked marks stay', () => {
    const m = new OrderMarks({ stops: [3, 1, 2] });
    m.tap(2); m.tap(0); m.tap(1);
    expect(m.full).toBe(true);
    expect(m.tap(0)).toBe('cleared');
    expect(m.picks).toEqual([2]);
    expect(m.markOf(2)).toBe(1);
    expect(m.markOf(1)).toBe(0);
    const h = new OrderMarks({ stops: [3, 1, 2] });
    expect(h.hint()).toBe(1);
    expect(h.tap(1)).toBe('locked');
    expect(h.picks).toEqual([1]);
  });
  it('from any marks, hints lock a correct prefix and the board stays solvable', () => {
    for (const set of ORDER_SETS) for (const order of allPicks) {
      const b = { stops: order.map((i) => set[i]) as [Stop, Stop, Stop] };
      for (const start of [[], ...allPicks, [0], [1], [2], [0, 1], [2, 0], [1, 2]]) for (let hints = 1; hints <= 3; hints++) {
        const m = new OrderMarks(b);
        for (const s of start) m.tap(s);
        for (let k = 0; k < hints; k++) m.hint();
        expect(m.picks.slice(0, m.locked)).toEqual(nearOrder(b).slice(0, m.locked));
        // Following nextRight from here always finishes right.
        while (!m.full) m.tap(m.nextRight!);
        expect(judgeOrder(b, m.picks)).toBe('right');
      }
    }
  });
  it('a wrong pull keeps the right marks before the first wrong one', () => {
    const b: { stops: [Stop, Stop, Stop] } = { stops: [3, 1, 2] };
    const m = new OrderMarks(b);
    m.tap(1); m.tap(0); m.tap(2);
    expect(judgeOrder(b, m.picks)).toBe(1);
    m.dropWrong();
    expect(m.picks).toEqual([1]);
    expect(m.nextRight).toBe(2);
  });
  it('scripted board: wrong pull, hint, hint again, right pull = 1 miss 1 hint', () => {
    const b = orderBoardsFor(new Rng(4), false)[0];
    const m = new OrderMarks(b);
    const t = new FarTally();
    for (const s of [...nearOrder(b)].reverse()) m.tap(s);
    if (judgeOrder(b, m.picks) !== 'right') { t.miss(); m.dropWrong(); }
    if (t.hint()) m.hint(); else m.hint();
    if (t.hint()) m.hint(); else m.hint();
    while (!m.full) m.tap(m.nextRight!);
    expect(judgeOrder(b, m.picks)).toBe('right');
    expect([t.misses, t.hints]).toEqual([1, 1]);
  });
});

describe('plans', () => {
  it('levels 5 and 6 are named', () => {
    expect(PLANS.map((p) => p.level)).toEqual([1, 2, 3, 4, 5, 6]);
    expect(planFor(5).name).toMatch(/curtain/);
    expect(planFor(6).name).toMatch(/order/);
  });
});
