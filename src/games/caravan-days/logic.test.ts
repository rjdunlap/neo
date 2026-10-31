import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import { computeView } from '../../engine/view';
import {
  afterTooLong, applyHint, camelAt, caravanMap, choose, corners, go, good, goLive, hintFor, legSuns, legsOf, loadPlan, loadStart,
  loaded, nextLoad, nextPlanMove, overlaps, planPlan, planStart, reachable, reachPlan, roadLayout, safePlan, SKIN, sunPoints,
  swapPlan, swapStart, pickOffer, goSwap, swapHint, offersAt, worthPlan, worthStart, nextWorthMove, sell, total, better, planFor,
  type SwapState, type WorthPlan, type WorthStop,
  tapBale, tapCamel, tapStop, Tally, MIN_TARGET, type CaravanMap, type LoadPlan, type LoadState, type PlanState, type Rect,
} from './logic';

const SEEDS = Array.from({ length: 300 }, (_, i) => i + 1);
const VIEWS = {
  landscape: computeView(1024, 768),
  portrait: computeView(768, 1024),
  phone: computeView(844, 390),
  notch: computeView(844, 390, { top: 0, right: 47, bottom: 21, left: 47 }),
};

describe('plans', () => {
  it('level 1 draws 2 bales at toddler and 3-4 at preschool/prek with distinct colours', () => {
    const counts = new Set<number>();
    for (const s of SEEDS) {
      expect(loadPlan('toddler', new Rng(s)).bales).toBe(2);
      for (const band of ['preschool', 'prek'] as const) {
        const p = loadPlan(band, new Rng(s));
        expect(p.bales).toBeGreaterThanOrEqual(3);
        expect(p.bales).toBeLessThanOrEqual(4);
        counts.add(p.bales);
        expect(p.colors).toHaveLength(p.bales);
        expect(new Set(p.colors).size).toBe(p.bales);
      }
    }
    expect(counts).toEqual(new Set([3, 4]));
  });

  it('level 2 draws two roads, near 1-2 and far 3-4, on both sides, one branch reachable', () => {
    const sides = new Set<number>();
    for (const s of SEEDS) {
      const plan = reachPlan(new Rng(s));
      expect(plan.roads).toHaveLength(2);
      for (const r of plan.roads) {
        const near = Math.min(...r.suns);
        const far = Math.max(...r.suns);
        expect([1, 2]).toContain(near);
        expect([3, 4]).toContain(far);
        sides.add(r.suns.indexOf(near));
        expect(r.suns.filter((n) => n <= SKIN)).toHaveLength(1);
        expect(r.landmarks[0]).not.toBe(r.landmarks[1]);
      }
    }
    expect(sides).toEqual(new Set([0, 1]));
  });

  it('level 3 draws two maps with 2-3 oases per branch, legs 1-3 suns, one 3-sun leg on one branch', () => {
    const longSides = new Set<number>();
    for (const s of SEEDS) {
      const plan = planPlan(new Rng(s));
      expect(plan.maps).toHaveLength(2);
      for (const m of plan.maps) {
        for (const b of [0, 1] as const) {
          expect(m.branches[b].length).toBeGreaterThanOrEqual(2);
          expect(m.branches[b].length).toBeLessThanOrEqual(3);
        }
        expect(m.stops.filter((x) => x.kind === 'oasis')).toHaveLength(m.branches[0].length + m.branches[1].length);
        for (const l of m.legs) { expect(l.suns).toBeGreaterThanOrEqual(1); expect(l.suns).toBeLessThanOrEqual(3); }
        const threes = m.legs.filter((l) => l.suns === 3);
        expect(threes).toHaveLength(1);
        const on = (id: number) => m.branches.findIndex((ids) => ids.includes(id));
        const l3 = threes[0];
        const branchOf = on(l3.a) >= 0 ? on(l3.a) : on(l3.b);
        expect(branchOf).toBe(m.long);
        longSides.add(m.long);
        // each branch is a chain home -> ... -> city
        for (const ids of m.branches) {
          const chain = [m.home, ...ids, m.city];
          for (let i = 0; i + 1 < chain.length; i++) {
            expect(m.legs.filter((l) => l.a === chain[i] && l.b === chain[i + 1])).toHaveLength(1);
          }
        }
        expect(m.legs).toHaveLength(m.branches[0].length + m.branches[1].length + 2);
      }
    }
    expect(longSides).toEqual(new Set([0, 1]));
  });

  it('the same seed gives the same plan', () => {
    for (const s of SEEDS.slice(0, 50)) {
      expect(loadPlan('prek', new Rng(s))).toEqual(loadPlan('prek', new Rng(s)));
      expect(reachPlan(new Rng(s))).toEqual(reachPlan(new Rng(s)));
      expect(planPlan(new Rng(s))).toEqual(planPlan(new Rng(s)));
    }
  });
});

describe('level 1: kneel and load', () => {
  const plan: LoadPlan = { level: 1, bales: 3, colors: ['red', 'blue', 'green'], oasis: 'palm' };

  it('loaded never exceeds bales from any reachable state, and bales toggle on and off', () => {
    const rng = new Rng(7);
    for (let run = 0; run < 100; run++) {
      let s: LoadState = loadStart(plan);
      for (let k = 0; k < 40; k++) {
        s = rng.chance(0.4) ? tapCamel(plan, s).state : tapBale(s, rng.int(-1, plan.bales)).state;
        expect(loaded(s)).toBeLessThanOrEqual(plan.bales);
      }
    }
    let s = tapCamel(plan, loadStart(plan)).state;
    const on = tapBale(s, 1);
    expect(on.event).toBe('on');
    expect(loaded(on.state)).toBe(1);
    const off = tapBale(on.state, 1);
    expect(off.event).toBe('off');
    expect(loaded(off.state)).toBe(0);
    s = off.state;
    expect(tapBale(s, 9).event).toBe('none');
  });

  it('a bale tap while standing says tap-camel and changes nothing', () => {
    const s = loadStart(plan);
    const r = tapBale(s, 0);
    expect(r.event).toBe('tap-camel');
    expect(r.state).toEqual(s);
  });

  it('a camel tap kneeling with bales on the ground is one-more and changes nothing', () => {
    let s = tapCamel(plan, loadStart(plan)).state;
    expect(s.phase).toBe('kneeling');
    s = tapBale(s, 0).state;
    const r = tapCamel(plan, s);
    expect(r.event).toBe('one-more');
    expect(r.state).toEqual(s);
  });

  it('following nextLoad walks within bales + 2 taps, and taps while walking change nothing', () => {
    for (const bales of [2, 3, 4]) {
      const p: LoadPlan = { level: 1, bales, colors: ['red', 'blue', 'green', 'teal'].slice(0, bales) as LoadPlan['colors'], oasis: 'rock' };
      let s = loadStart(p);
      let taps = 0;
      while (s.phase !== 'walking') {
        const n = nextLoad(p, s)!;
        s = ('camel' in n ? tapCamel(p, s) : tapBale(s, n.bale)).state;
        taps++;
        expect(taps).toBeLessThanOrEqual(bales + 2);
      }
      expect(taps).toBe(bales + 2);
      expect(nextLoad(p, s)).toBeNull();
      expect(tapCamel(p, s)).toEqual({ state: s, event: 'none' });
      expect(tapBale(s, 0)).toEqual({ state: s, event: 'none' });
    }
  });
});

describe('level 2: can we reach it?', () => {
  it('choose is reachable iff suns <= SKIN, with over naming the difference; reachable() is that branch', () => {
    for (const s of SEEDS) {
      for (const road of reachPlan(new Rng(s)).roads) {
        for (const b of [0, 1] as const) {
          const r = choose(road, b);
          if (road.suns[b] <= SKIN) expect(r).toEqual({ reachable: true });
          else expect(r).toEqual({ reachable: false, over: road.suns[b] - SKIN });
        }
        const ok = reachable(road);
        expect(choose(road, ok).reachable).toBe(true);
        expect(choose(road, ok === 0 ? 1 : 0).reachable).toBe(false);
      }
    }
  });
});

const mapsOver = (n = 300): CaravanMap[] => Array.from({ length: n }, (_, i) => caravanMap(new Rng(i + 1)));
const maps = mapsOver();

describe('level 3: day by day across the map', () => {
  it('good contains home and city', () => {
    for (const m of maps) { const g = good(m); expect(g.has(m.home)).toBe(true); expect(g.has(m.city)).toBe(true); }
  });

  it('legSuns: adjacent is the road, skipping one oasis sums, otherwise null', () => {
    for (const m of maps) {
      for (const l of m.legs) { expect(legSuns(m, l.a, l.b)).toBe(l.suns); }
      for (const ids of m.branches) {
        const chain = [m.home, ...ids, m.city];
        for (let i = 0; i + 2 < chain.length; i++) {
          const a = legSuns(m, chain[i], chain[i + 1])!;
          const b = legSuns(m, chain[i + 1], chain[i + 2])!;
          expect(legSuns(m, chain[i], chain[i + 2])).toBe(a + b);
        }
        expect(legSuns(m, m.home, m.city)).toBeNull();
      }
      const [b0, b1] = m.branches;
      expect(legSuns(m, b0[0], b1[1])).toBeNull();
      expect(legSuns(m, b1[1], b0[0])).toBeNull();
      expect(legSuns(m, b0[0], b1[0])).toBeNull();
      expect(legSuns(m, b0[1], b0[0])).toBeNull();
    }
  });

  it('tapStop accepts only adjacent or one-skipped stops, takes flags out, and refuses after the city', () => {
    for (const m of maps.slice(0, 100)) {
      const all = m.stops.map((x) => x.id);
      // From an empty plan only stops with a legSuns from home are accepted.
      for (const id of all) {
        const r = tapStop(m, planStart(), id);
        if (id === m.home) expect(r.event).toBe('none');
        else expect(r.event).toBe(legSuns(m, m.home, id) === null ? 'not-adjacent' : 'flag');
        if (r.event !== 'flag') expect(r.state).toEqual(planStart());
      }
      const b = m.branches[0];
      let s = tapStop(m, planStart(), b[0]).state;
      s = tapStop(m, s, b[1]).state;
      expect(s.plan).toEqual([b[0], b[1]]);
      // tapping a flagged stop takes it and later flags out
      expect(tapStop(m, s, b[0]).state.plan).toEqual([]);
      expect(tapStop(m, s, b[1]).state.plan).toEqual([b[0]]);
      // home takes all out
      expect(tapStop(m, s, m.home)).toEqual({ state: { plan: [], walked: 0 }, event: 'take-out' });
      // flag to the city, then nothing more is accepted
      const done = safePlan(m).reduce((st, id) => tapStop(m, st, id).state, planStart());
      expect(lastCity(m, done)).toBe(true);
      for (const id of all) {
        if (done.plan.includes(id) || id === m.home) continue;
        const r = tapStop(m, done, id);
        expect(r.event).toBe('not-adjacent');
        expect(r.state).toEqual(done);
      }
    }
  });

  it('tapStop never flags a stop behind the last flag (a skipped oasis after passing it)', () => {
    for (const m of maps) {
      for (const st of allStates(m)) {
        const pos = (id: number) => (id === m.home ? -1 : id === m.city ? 99 : m.stops[id].index);
        for (let i = 1; i < st.plan.length; i++) {
          const a = st.plan[i - 1], b = st.plan[i];
          if (a !== m.city && b !== m.city) expect(pos(b), `plan ${st.plan}`).toBeGreaterThan(pos(a));
          expect(a).not.toBe(m.city);
        }
      }
    }
  });

  it('goLive only when the last flag is the city', () => {
    for (const m of maps.slice(0, 100)) {
      expect(goLive(m, planStart())).toBe(false);
      const safe = safePlan(m);
      let s = planStart();
      for (const id of safe) {
        s = tapStop(m, s, id).state;
        expect(goLive(m, s)).toBe(id === m.city);
      }
    }
  });

  it('go arrives iff every leg <= SKIN, else names the first over-long leg; afterTooLong keeps the flags before it', () => {
    let overs = 0;
    for (const m of maps) {
      for (const st of allStates(m)) {
        const legs = legsOf(m, st);
        const g = go(m, st);
        const first = legs.findIndex((n) => n > SKIN);
        if (first < 0) expect(g).toEqual({ arrived: true });
        else {
          overs++;
          expect(g).toEqual({ arrived: false, leg: first, suns: legs[first] });
          const after = afterTooLong(st, first);
          expect(after.plan).toEqual(st.plan.slice(0, first));
          expect(after.walked).toBe(first);
          expect(camelAt(m, after)).toBe(first ? st.plan[first - 1] : m.home);
        }
      }
    }
    expect(overs).toBeGreaterThan(0);
  });

  it('safePlan is always arrived and ends at the city', () => {
    for (const m of maps) {
      const s = safePlan(m).reduce((st, id) => tapStop(m, st, id).state, planStart());
      expect(s.plan).toEqual(safePlan(m));
      expect(go(m, s)).toEqual({ arrived: true });
      expect(goLive(m, s)).toBe(true);
    }
  });

  it('hintFor takes out the over-long leg first, else a good forward neighbour within the skin, else the last flag, else go', () => {
    for (const m of maps.slice(0, 100)) {
      const ok = good(m);
      for (const st of allStates(m)) {
        const h = hintFor(m, st);
        const g = go(m, st);
        const last = st.plan.length ? st.plan[st.plan.length - 1] : m.home;
        if (!g.arrived) { expect(h).toEqual({ takeOut: st.plan[g.leg] }); continue; }
        if (last === m.city) { expect(h).toEqual({ go: true }); continue; }
        const forwards = m.legs.filter((l) => l.a === last && l.suns <= SKIN && ok.has(l.b));
        if (forwards.length) {
          expect('flag' in h).toBe(true);
          const f = (h as { flag: number }).flag;
          expect(forwards.map((l) => l.b)).toContain(f);
          expect(tapStop(m, st, f).event).toBe('flag');
        } else expect(h).toEqual({ takeOut: last });
      }
    }
  });

  it('following hintFor from every reachable plan state arrives at the city within 2 x stops steps', () => {
    for (const m of maps.slice(0, 100)) {
      for (const st0 of allStates(m)) {
        let st = st0;
        let steps = 0;
        while (!(goLive(m, st) && go(m, st).arrived)) {
          const h = hintFor(m, st);
          expect('go' in h).toBe(false);
          const next = applyHint(m, st, h);
          expect(next).not.toEqual(st);
          st = next;
          steps++;
          expect(steps).toBeLessThanOrEqual(2 * m.stops.length);
        }
      }
    }
  });

  it('nextPlanMove follows the safe plan and backs out a stray flag', () => {
    for (const m of maps.slice(0, 100)) {
      const safe = safePlan(m);
      let s = planStart();
      for (const id of safe) {
        expect(nextPlanMove(m, s)).toEqual({ stop: id });
        s = tapStop(m, s, id).state;
      }
      expect(nextPlanMove(m, s)).toEqual({ go: true });
      // a stray first flag on the other branch is tapped to take it out
      const other = m.branches[m.long][0];
      const stray = tapStop(m, planStart(), other).state;
      expect(nextPlanMove(m, stray)).toEqual({ stop: other });
      // and following the moves from any state finishes
      for (const st0 of allStates(m).slice(0, 40)) {
        let st = st0;
        for (let i = 0; i < 30; i++) {
          const mv = nextPlanMove(m, st);
          if ('go' in mv) break;
          st = tapStop(m, st, mv.stop).state;
        }
        expect(nextPlanMove(m, st)).toEqual({ go: true });
      }
    }
  });
});

function lastCity(m: CaravanMap, s: PlanState) { return s.plan[s.plan.length - 1] === m.city; }

/** Every plan state reachable by tapStop from an empty plan (capped). */
function allStates(m: CaravanMap, cap = 400): PlanState[] {
  const seen = new Map<string, PlanState>();
  const queue: PlanState[] = [planStart()];
  while (queue.length && seen.size < cap) {
    const s = queue.shift()!;
    const key = s.plan.join(',');
    if (seen.has(key)) continue;
    seen.set(key, s);
    for (const stop of m.stops) {
      const r = tapStop(m, s, stop.id);
      if (r.event === 'flag') queue.push(r.state);
    }
  }
  return [...seen.values()];
}

describe('accounting', () => {
  it('two misses light the glow and count one hint; a third miss adds none', () => {
    const t = new Tally();
    t.miss();
    expect(t.glowing).toBe(false);
    expect(t.hints).toBe(0);
    t.miss();
    expect(t.glowing).toBe(true);
    expect(t.hints).toBe(1);
    t.miss();
    expect(t.hints).toBe(1);
    expect(t.misses).toBe(3);
  });

  it('help counts one hint once, even after misses', () => {
    const t = new Tally();
    t.help();
    t.help();
    expect(t.hints).toBe(1);
    expect(t.glowing).toBe(true);
    t.miss();
    t.miss();
    expect(t.hints).toBe(1);
  });

  it('next resets so the next road counts its own one hint', () => {
    const t = new Tally();
    t.miss(); t.miss();
    t.next();
    expect(t.glowing).toBe(false);
    expect(t.here).toBe(0);
    t.miss();
    expect(t.glowing).toBe(false);
    t.miss();
    expect(t.hints).toBe(2);
    expect(t.misses).toBe(4);
  });
});

describe('layout', () => {
  const inside = (r: Rect, v: { w: number; h: number }) => r.x >= 0 && r.y >= 0 && r.x + r.w <= v.w && r.y + r.h <= v.h;

  function checkInputs(inputs: Rect[], v: { w: number; h: number }, label: string) {
    const cs = corners(v as never);
    for (const r of inputs) {
      expect(r.w, label).toBeGreaterThanOrEqual(MIN_TARGET);
      expect(r.h, label).toBeGreaterThanOrEqual(MIN_TARGET);
      expect(inside(r, v), label).toBe(true);
      for (const c of cs) expect(overlaps(r, c), label).toBe(false);
    }
    for (let i = 0; i < inputs.length; i++) for (let j = i + 1; j < inputs.length; j++) expect(overlaps(inputs[i], inputs[j]), label).toBe(false);
  }

  for (const [name, v] of Object.entries(VIEWS)) {
    it(`levels 1-3 lay out at ${name}`, () => {
      for (const s of SEEDS.slice(0, 60)) {
        for (const band of ['toddler', 'preschool', 'prek'] as const) {
          const p = loadPlan(band, new Rng(s));
          const l = roadLayout(1, p, v, 0);
          expect(l, `L1 ${band} seed ${s}`).not.toBeNull();
          checkInputs([...l!.stops, ...l!.bales, l!.camel], v, `L1 ${band} seed ${s}`);
        }
        const rp = reachPlan(new Rng(s));
        for (const i of [0, 1]) {
          const l = roadLayout(2, rp, v, i);
          expect(l, `L2 seed ${s} road ${i}`).not.toBeNull();
          checkInputs(l!.stops, v, `L2 seed ${s}`);
        }
        const pp = planPlan(new Rng(s));
        for (const i of [0, 1]) {
          const l = roadLayout(3, pp, v, i);
          expect(l, `L3 seed ${s} map ${i}`).not.toBeNull();
          checkInputs([...l!.stops, l!.go!], v, `L3 seed ${s} map ${i}`);
          const m = pp.maps[i];
          const y0 = centre(l!.stops[m.branches[0][0]]).y;
          const y1 = centre(l!.stops[m.branches[1][0]]).y;
          expect(Math.abs(y1 - y0), `L3 branch gap seed ${s}`).toBeGreaterThanOrEqual(130);
        }
      }
    });
  }

  it('sunPoints gives one point per sun strictly between the ends', () => {
    const p = planPlan(new Rng(3));
    const l = roadLayout(3, p, VIEWS.landscape, 0)!;
    for (const road of l.roads) {
      const pts = sunPoints(road);
      expect(pts).toHaveLength(road.suns);
      const lo = Math.min(road.from.x, road.to.x), hi = Math.max(road.from.x, road.to.x);
      for (const pt of pts) {
        expect(pt.x).toBeGreaterThan(lo);
        expect(pt.x).toBeLessThan(hi);
      }
    }
  });
});

function centre(r: Rect) { return { x: r.x + r.w / 2, y: r.y + r.h / 2 }; }

describe('level 4: swap at the stop', () => {
  const roadsOf = (seed: number) => swapPlan(new Rng(seed)).roads;

  it('plans two legal roads with distinct wants, the next want offered once, and seeded decoys', () => {
    const sides = new Set<number>();
    for (const seed of SEEDS) {
      const plan = swapPlan(new Rng(seed));
      expect(plan.level).toBe(4);
      expect(plan.roads).toHaveLength(2);
      for (const r of plan.roads) {
        for (const l of r.legs) { expect(l).toBeGreaterThanOrEqual(1); expect(l).toBeLessThanOrEqual(SKIN); }
        expect(new Set(r.wants).size).toBe(3);
        expect(r.carry0).toBe(r.wants[0]);
        expect(r.offers[0].filter((g) => g === r.wants[1])).toHaveLength(1);
        expect(r.offers[1].filter((g) => g === r.wants[2])).toHaveLength(1);
        const d1 = r.offers[0].find((g) => g !== r.wants[1])!;
        const d2 = r.offers[1].find((g) => g !== r.wants[2])!;
        expect(d1 === r.wants[2] || !r.wants.includes(d1)).toBe(true);
        expect(d2).not.toBe(r.wants[2]);
        expect(d2).not.toBe(r.wants[1]);
        sides.add(r.offers[0].indexOf(r.wants[1]));
        sides.add(10 + r.offers[1].indexOf(r.wants[2]));
      }
      expect(plan.roads.some((r) => r.offers[0].includes(r.wants[2]))).toBe(true);
    }
    expect(sides).toEqual(new Set([0, 1, 10, 11]));
  });

  it('the same seed gives the same plan', () => {
    for (const seed of SEEDS.slice(0, 40)) expect(roadsOf(seed)).toEqual(roadsOf(seed));
  });

  it('exactly one of the four pick sequences reaches the city, and it is the hinted one', () => {
    for (const seed of SEEDS) for (const road of roadsOf(seed)) {
      const winners: string[] = [];
      for (const a of [0, 1] as const) for (const b of [0, 1] as const) {
        let st = pickOffer(road, swapStart(), a);
        const carried1 = st.carried!;
        const g1 = goSwap(road, st);
        if (g1.event === 'not-wanted') {
          expect(g1.wants).toBe(road.wants[1]);
          expect(g1.carried).toBe(carried1);
          expect(st).toEqual({ at: 1, carried: carried1 });
          expect(offersAt(road, st)).toEqual(road.offers[0]);
          continue;
        }
        expect(g1.event).toBe('wanted');
        if (g1.event !== 'wanted') continue;
        expect(g1.city).toBe(false);
        st = pickOffer(road, g1.state, b);
        const carried2 = st.carried!;
        const g2 = goSwap(road, st);
        if (g2.event === 'not-wanted') {
          expect(g2.wants).toBe(road.wants[2]);
          expect(g2.carried).toBe(carried2);
          expect(st).toEqual({ at: 2, carried: carried2 });
          expect(offersAt(road, st)).toEqual(road.offers[1]);
          continue;
        }
        expect(g2.event).toBe('wanted');
        if (g2.event === 'wanted') { expect(g2.city).toBe(true); winners.push(`${a}${b}`); }
      }
      expect(winners).toEqual([`${road.offers[0].indexOf(road.wants[1])}${road.offers[1].indexOf(road.wants[2])}`]);
    }
  });

  it('Go with nothing carried is pick-first, and the hint always leads to the city', () => {
    for (const seed of SEEDS) for (const road of roadsOf(seed)) {
      expect(goSwap(road, swapStart())).toEqual({ event: 'pick-first' });
      // every reachable state: at oasis 1 or 2, carrying nothing or either offer
      for (const at of [1, 2] as const) for (const carried of [null, ...road.offers[at - 1]]) {
        let st: SwapState = { at, carried };
        let steps = 0;
        while (st.at !== 3) {
          const h = swapHint(road, st)!;
          expect(h).not.toBeNull();
          if ('go' in h) {
            expect(st.carried).toBe(road.wants[st.at]);
            const r = goSwap(road, st);
            expect(r.event).toBe('wanted');
            if (r.event === 'wanted') st = r.state;
          } else {
            expect(offersAt(road, st)![h.side]).toBe(road.wants[st.at]);
            st = pickOffer(road, st, h.side);
          }
          expect(++steps).toBeLessThan(6);
        }
        expect(swapHint(road, st)).toBeNull();
      }
    }
  });
});

describe('level 5: worth more far away', () => {
  const stopOf = (n: number) => n as WorthStop;

  it('plans price rows, three-bale loads with different up counts, and ends-only named stops', () => {
    const rows = new Set<string>();
    const named = new Set<string>();
    for (const seed of SEEDS) {
      const p = worthPlan(new Rng(seed));
      expect(p.level).toBe(5);
      expect([[1, 2, 4], [1, 3, 5]]).toContainEqual(p.up);
      expect(p.down).toEqual([...p.up].reverse());
      rows.add(p.up.join());
      expect(p.loads[0][0]).not.toBe(p.loads[1][0]);
      for (const l of p.loads) expect(l[0] + l[1]).toBe(3);
      expect(p.named).not.toContain(2);
      expect([[1, 3], [3, 1]]).toContainEqual(p.named);
      named.add(p.named.join());
      expect(worthPlan(new Rng(seed))).toEqual(p);
    }
    expect(rows.size).toBe(2);
    expect(named.size).toBe(2);
  });

  it('the totals differ, are in 3..20, the better load reverses between cases, and selling reports both sums', () => {
    for (const seed of SEEDS) {
      const p: WorthPlan = worthPlan(new Rng(seed));
      for (const c of [0, 1]) {
        const stop = p.named[c];
        const t0 = total(p, 0, stop), t1 = total(p, 1, stop);
        expect(t0).not.toBe(t1);
        for (const t of [t0, t1]) { expect(t).toBeGreaterThanOrEqual(3); expect(t).toBeLessThanOrEqual(20); }
        const b = better(p, c);
        expect(total(p, b, stop)).toBe(Math.max(t0, t1));
        const w = b === 0 ? 1 : 0;
        expect(sell(p, c, b)).toEqual({ better: true, got: total(p, b, stop) });
        expect(sell(p, c, w)).toEqual({ better: false, got: total(p, w, stop), other: total(p, b, stop) });
      }
      expect(better(p, 0)).not.toBe(better(p, 1));
      expect(stopOf(p.named[0])).not.toBe(p.named[1]);
    }
  });

  it('the bot looks at the other load, then the better one, then Go, and never sends the smaller', () => {
    for (const seed of SEEDS) {
      const p = worthPlan(new Rng(seed));
      for (const c of [0, 1]) {
        const b = better(p, c);
        let st = worthStart();
        expect(st.looked).toBeNull();
        const seen = new Set<number>();
        const moves: string[] = [];
        for (let i = 0; i < 5; i++) {
          const m = nextWorthMove(p, c, st, seen);
          if ('go' in m) { moves.push('go'); expect(st.looked).toBe(b); break; }
          moves.push(String(m.load));
          seen.add(m.load);
          st = { looked: m.load };
        }
        expect(moves).toEqual([String(b === 0 ? 1 : 0), String(b), 'go']);
      }
    }
  });
});

describe('levels 4-5 plumbing and layout', () => {
  it('planFor names the new plans and leaves levels 1-3 alone', () => {
    expect(planFor(1).id).toBe('load');
    expect(planFor(2).id).toBe('reach');
    expect(planFor(3).id).toBe('plan');
    expect(planFor(4).id).toBe('swap');
    expect(planFor(5).id).toBe('worth');
  });

  it('every input is large, inside the view, clear of the corners and apart', () => {
    for (const [name, v] of Object.entries(VIEWS)) for (const seed of SEEDS.slice(0, 10)) {
      const cases: [number, ReturnType<typeof swapPlan> | ReturnType<typeof worthPlan>, number[]][] = [
        [4, swapPlan(new Rng(seed)), [0, 1]],
        [5, worthPlan(new Rng(seed)), [0]],
      ];
      for (const [level, plan, indexes] of cases) for (const index of indexes) {
        const lay = roadLayout(level, plan, v, index);
        expect(lay, `${name} level ${level} seed ${seed}`).not.toBeNull();
        const rects: Rect[] = [...(lay!.offers ?? []), ...(lay!.bubbles ?? []), ...(lay!.boards ?? []), ...(lay!.loads ?? []), lay!.go!];
        expect(rects.length).toBe(level === 4 ? 6 : 6);
        for (const r of rects) {
          expect(r.w).toBeGreaterThanOrEqual(MIN_TARGET);
          expect(r.h).toBeGreaterThanOrEqual(MIN_TARGET);
          expect(r.x).toBeGreaterThanOrEqual(0);
          expect(r.y).toBeGreaterThanOrEqual(0);
          expect(r.x + r.w).toBeLessThanOrEqual(v.w);
          expect(r.y + r.h).toBeLessThanOrEqual(v.h);
          for (const c of corners(v)) expect(overlaps(r, c)).toBe(false);
        }
        for (let i = 0; i < rects.length; i++) for (let j = i + 1; j < rects.length; j++) expect(overlaps(rects[i], rects[j])).toBe(false);
        if (lay!.offers) {
          const [a, b] = lay!.offers;
          expect(b.x - (a.x + a.w)).toBeGreaterThanOrEqual(40);
        }
      }
    }
  });
});

describe('levels 4-5: spoken slots', () => {
  it('every good and every reachable shell total has a line', async () => {
    const { SCRIPT } = await import('../../content/voice-script');
    const { GOODS, worthPlan, total } = await import('./logic');
    for (const g of GOODS) expect(SCRIPT[`cd.good.${g}` as keyof typeof SCRIPT]).toBeTruthy();
    for (const s of SEEDS) {
      const p = worthPlan(new Rng(s));
      for (const stop of [1, 2, 3] as const) for (const load of [0, 1] as const) {
        expect(SCRIPT[`cd.shells.${total(p, load, stop)}` as keyof typeof SCRIPT]).toBeTruthy();
      }
    }
  });
});
