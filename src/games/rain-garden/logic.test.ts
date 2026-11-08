import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import { computeView } from '../../engine/view';
import {
  CAPACITY,
  LEVELS,
  PLANS,
  SHOWER,
  SURFACES,
  canFinish,
  enough,
  flip,
  freshState,
  makeRound,
  nextAction,
  planFor,
  rain,
  rainLayout,
  restartState,
  runPair,
  runShower,
  setSurface,
  trial,
  type Box,
  type RoundState,
  type Surface,
  ARRANGEMENTS,
  CHECK,
  ROUTE4,
  SIGN_H,
  SIGN_W,
  arrangementKey,
  check,
  flipBed,
  makeRoute,
  meets,
  nearest,
  routeFresh,
  routeHint,
  routeLayout,
  routeNext,
  routeRestart,
  runRoute,
  solutions,
  stepBed,
  tryRoute,
  type RouteRound,
  type RouteState,
} from './logic';

const SEEDS = Array.from({ length: 60 }, (_, i) => i * 7919 + 3);

describe('model', () => {
  for (const surface of SURFACES) {
    for (const initial of [0, 1, 2]) {
      it(`${surface}, ${initial} stored: conserves water after every step`, () => {
        const stored0 = Math.min(initial, CAPACITY[surface]);
        const r = runShower({ surface, stored: stored0 }, { water: 0 });
        expect(r.steps.length).toBe(SHOWER);
        expect(r.steps.map((s) => s.unit)).toEqual([0, 1, 2, 3]);
        let stored = stored0,
          pond = 0;
        for (const s of r.steps) {
          if (s.to === 'patch') stored++;
          else pond++;
          expect(stored).toBeLessThanOrEqual(CAPACITY[surface]);
          expect(stored + pond).toBe(stored0 + s.unit + 1);
        }
        expect(r.patch.stored).toBe(stored);
        expect(r.pond.water).toBe(pond);
        expect(r.patch.stored + r.pond.water).toBe(stored0 + SHOWER);
      });
    }
  }

  it('outcome table from fresh', () => {
    expect(trial('stone')).toMatchObject({ stored: 0, pond: 4 });
    expect(trial('soil')).toMatchObject({ stored: 2, pond: 2 });
    for (const s of SURFACES) expect(trial(s).stored).toBeLessThanOrEqual(CAPACITY[s]);
  });

  it('order of steps', () => {
    expect(trial('soil').steps.map((s) => s.to)).toEqual(['patch', 'patch', 'pond', 'pond']);
    expect(trial('stone').steps.map((s) => s.to)).toEqual(['pond', 'pond', 'pond', 'pond']);
  });

  it('flip swaps surfaces', () => {
    expect(flip('stone')).toBe('soil');
    expect(flip('soil')).toBe('stone');
  });
});

describe('fresh start', () => {
  it('rain is the same whatever the last trial left', () => {
    let s = freshState(makeRound(1, new Rng(1), true));
    const first = rain(s);
    s = first.state;
    const second = rain(s);
    expect(second.trials[0]).toEqual(first.trials[0]);
    expect(second.trials[0]).toEqual(trial('soil'));
  });

  it('setSurface resets current; restartState returns the same board from fresh', () => {
    for (const level of [1, 2, 3]) {
      const round = makeRound(level, new Rng(level), true);
      let s = rain(rain(freshState(round)).state).state;
      expect(setSurface(s, 0, 'stone').current).toBeNull();
      s = restartState(round);
      expect(s.surfaces).toEqual(round.start);
      expect(s.current).toBeNull();
      expect(s.bookmark).toBeNull();
      expect([s.compared, s.trials]).toEqual([0, 0]);
      expect(enough(s)).toBe(false);
      expect(rain(s).trials[0]).toEqual(trial(round.start[0]));
    }
  });
});

describe('level 2 fairness', () => {
  it('both patches get four units and the same surface gives identical results', () => {
    for (const a of SURFACES)
      for (const b of SURFACES) {
        const [l, r] = runPair(a, b);
        expect(l.steps.length).toBe(SHOWER);
        expect(r.steps.length).toBe(SHOWER);
        expect(l.stored + l.pond).toBe(SHOWER);
        expect(r.stored + r.pond).toBe(SHOWER);
        if (a === b) expect(l).toEqual(r);
        else expect(l).not.toEqual(r);
      }
  });

  it('rain at level 2 gives each patch its own fresh trial', () => {
    const s = freshState(makeRound(2, new Rng(1), true));
    expect(s.surfaces).toEqual(['stone', 'soil']);
    const r = rain(s);
    expect(r.trials).toEqual([trial('stone'), trial('soil')]);
    expect(r.state.current).toEqual(r.trials);
  });

  it('setSurface changes only that patch and resets current', () => {
    const s0 = rain(freshState(makeRound(2, new Rng(1), true))).state;
    const s1 = setSurface(s0, 0, 'soil');
    expect(s1.surfaces).toEqual(['soil', 'soil']);
    expect(s1.current).toBeNull();
    const s2 = setSurface(s0, 1, 'stone');
    expect(s2.surfaces).toEqual(['stone', 'stone']);
    expect(s2.current).toBeNull();
    const [l, r] = rain(s1).trials;
    expect(l).toEqual(r);
  });
});

describe('level 3 bookmark', () => {
  it('first rain sets the bookmark and leaves current null; it never changes after', () => {
    for (const start of SURFACES) {
      let s = freshState({ level: 3, start: [start], friend: 'frog', mirror: false });
      expect(canFinish(s)).toBe(false);
      s = rain(s).state;
      const mark = s.bookmark!;
      expect(mark).toEqual(trial(start));
      expect(s.current).toBeNull();
      expect(canFinish(s)).toBe(false);
      s = rain(s).state; // same surface again
      expect(s.bookmark).toBe(mark);
      expect(s.current).not.toBeNull();
      expect(canFinish(s)).toBe(false);
      s = setSurface(s, 0, flip(start));
      expect(s.bookmark).toBe(mark);
      expect(canFinish(s)).toBe(false);
      s = rain(s).state;
      expect(s.bookmark).toBe(mark);
      expect(canFinish(s)).toBe(true);
      s = setSurface(s, 0, start);
      expect(canFinish(s)).toBe(false);
      s = rain(s).state;
      expect(s.bookmark).toBe(mark);
      expect(canFinish(s)).toBe(false);
    }
  });
});

describe('canFinish and enough', () => {
  it('is false before any settled trial at each level, true after one at levels 1-2', () => {
    for (const level of [1, 2, 3]) {
      const s = freshState(makeRound(level, new Rng(5), true));
      expect(canFinish(s)).toBe(false);
      expect(enough(s)).toBe(false);
      if (level < 3) expect(canFinish(rain(s).state)).toBe(true);
    }
  });

  it('enough: third rain at level 1, second pair at level 2, second comparison at level 3', () => {
    let s = freshState(makeRound(1, new Rng(1), true));
    const seen: boolean[] = [];
    for (let i = 0; i < 3; i++) {
      s = rain(s).state;
      seen.push(enough(s));
    }
    expect(seen).toEqual([false, false, true]);

    s = freshState(makeRound(2, new Rng(1), true));
    s = rain(s).state;
    expect(enough(s)).toBe(false);
    s = rain(s).state;
    expect(enough(s)).toBe(true);
    expect(enough(setSurface(s, 0, 'soil'))).toBe(false);

    s = freshState(makeRound(3, new Rng(1), true));
    s = rain(s).state; // bookmark
    s = setSurface(s, 0, 'soil');
    s = rain(s).state; // compared 1
    expect(enough(s)).toBe(false);
    s = rain(s).state; // compared 2
    expect(enough(s)).toBe(true);
  });
});

describe('nextAction leads to a finish', () => {
  const follow = (s: RoundState): { done: boolean; steps: number } => {
    for (let steps = 0; steps < 6; steps++) {
      const a = nextAction(s);
      if (a.kind === 'leaf') return { done: canFinish(s), steps };
      if (a.kind === 'cloud') s = rain(s).state;
      else s = setSurface(s, a.patch, a.surface);
    }
    return { done: false, steps: 6 };
  };

  for (const level of [1, 2, 3] as const) {
    it(`level ${level}: authored round`, () => {
      const r = follow(freshState(makeRound(level, new Rng(1), true)));
      expect(r.done).toBe(true);
      expect(r.steps).toBeLessThanOrEqual(5);
    });
    it(`level ${level}: seeded rounds`, () => {
      for (const seed of SEEDS) {
        const round = makeRound(level, new Rng(seed), false);
        const r = follow(freshState(round));
        expect(r.done, `seed ${seed} ${round.start}`).toBe(true);
      }
    });
  }

  it('level 2 hint on identical ground changes the left tile', () => {
    let s = rain(freshState({ level: 2, start: ['soil', 'soil'], friend: 'duck', mirror: false })).state;
    expect(nextAction(s)).toEqual({ kind: 'tile', patch: 0, surface: 'stone' });
    s = setSurface(s, 0, 'stone');
    expect(nextAction(s)).toEqual({ kind: 'cloud' });
  });
});

describe('rounds and levels', () => {
  it('authored boards', () => {
    expect(makeRound(1, new Rng(1), true).start).toEqual(['soil']);
    expect(makeRound(2, new Rng(1), true).start).toEqual(['stone', 'soil']);
    expect(makeRound(3, new Rng(1), true).start).toEqual(['stone']);
  });

  it('seeded rounds use only stone and soil, with the right patch count', () => {
    for (const level of [1, 2, 3] as const) {
      for (const seed of SEEDS) {
        const r = makeRound(level, new Rng(seed), false);
        expect(r.level).toBe(level);
        expect(r.start.length).toBe(level === 2 ? 2 : 1);
        for (const s of r.start) expect(SURFACES).toContain(s as Surface);
        if (level !== 1) expect(r.mirror).toBe(false);
      }
    }
  });

  it('the same seed gives the same round', () => {
    for (const level of [1, 2, 3])
      for (const seed of SEEDS.slice(0, 10)) {
        expect(makeRound(level, new Rng(seed), false)).toEqual(makeRound(level, new Rng(seed), false));
      }
  });

  it('LEVELS and planFor', () => {
    expect(PLANS.map((p) => p.level)).toEqual([1, 2, 3, 4]);
    expect(planFor(0).level).toBe(1);
    expect(planFor(2.4).level).toBe(2);
    expect(planFor(99).level).toBe(4);
    expect(LEVELS).toEqual({
      toddler: { min: 1, max: 1 },
      preschool: { min: 1, max: 2 },
      prek: { min: 2, max: 3 },
      school: { min: 3, max: 4 },
    });
    for (const r of Object.values(LEVELS))
      for (let l = r!.min; l <= r!.max; l++) expect(planFor(l).level).toBe(l);
  });
});

describe('layout', () => {
  const VIEWS = {
    landscape: computeView(1024, 768),
    portrait: computeView(768, 1024),
    phone: computeView(844, 390),
    notch: computeView(844, 390, { top: 0, right: 47, bottom: 21, left: 47 }),
  };
  const overlap = (a: Box, b: Box) =>
    Math.abs(a.x - b.x) * 2 < a.w + b.w && Math.abs(a.y - b.y) * 2 < a.h + b.h;
  const inside = (b: Box, v: { w: number; h: number }) =>
    b.x - b.w / 2 >= 0 && b.y - b.h / 2 >= 0 && b.x + b.w / 2 <= v.w && b.y + b.h / 2 <= v.h;
  const corner = (b: Box, x0: number, y0: number, x1: number, y1: number) =>
    b.x - b.w / 2 < x1 && b.x + b.w / 2 > x0 && b.y - b.h / 2 < y1 && b.y + b.h / 2 > y0;

  const cases: [number, boolean][] = [
    [1, false],
    [2, false],
    [3, false],
    [1, true],
  ];
  for (const [name, v] of Object.entries(VIEWS)) {
    for (const [level, mirror] of cases) {
      it(`${name}, level ${level}${mirror ? ' mirrored' : ''}`, () => {
        const l = rainLayout(v, level, mirror)!;
        expect(l).not.toBeNull();
        expect(l.boards.length).toBe(level === 2 ? 2 : 1);
        expect(l.tiles.length).toBe(level === 1 ? 0 : 2);
        expect(!!l.bookmark).toBe(level === 3);
        const targets = [l.cloud, ...l.tiles, l.leaf];
        for (const b of targets) {
          expect(b.w).toBeGreaterThanOrEqual(100);
          expect(b.h).toBeGreaterThanOrEqual(100);
          expect(inside(b, v)).toBe(true);
          expect(corner(b, 0, 0, 120, 215)).toBe(false);
          expect(corner(b, 0, v.h - 170, 170, v.h)).toBe(false);
        }
        expect(l.cloud.w).toBeGreaterThanOrEqual(220);
        expect(l.cloud.h).toBeGreaterThanOrEqual(140);
        expect(l.leaf.w).toBeGreaterThanOrEqual(120);
        expect(l.leaf.h).toBeGreaterThanOrEqual(120);
        for (const t of l.tiles) {
          expect(t.w).toBeGreaterThanOrEqual(120);
          expect(t.h).toBeGreaterThanOrEqual(120);
        }
        for (let i = 0; i < targets.length; i++)
          for (let k = i + 1; k < targets.length; k++)
            expect(overlap(targets[i], targets[k]), `targets ${i}/${k}`).toBe(false);
        if (l.bookmark) {
          expect(inside(l.bookmark, v)).toBe(true);
          for (const t of targets) expect(overlap(l.bookmark, t)).toBe(false);
        }
        for (const b of l.boards) {
          expect(inside(b.patch, v)).toBe(true);
          expect(inside(b.pond, v)).toBe(true);
          expect(b.pockets.length).toBe(2);
          expect(b.slots.length).toBe(4);
          for (const p of [...b.pockets, ...b.slots]) {
            expect(p.w).toBeGreaterThanOrEqual(48);
            expect(p.h).toBeGreaterThanOrEqual(48);
            expect(inside(p, v)).toBe(true);
          }
          for (const t of l.tiles) {
            expect(overlap(t, b.pond), 'tile/pond').toBe(false);
            expect(overlap(t, b.patch), 'tile/patch').toBe(false);
          }
          expect(overlap(l.leaf, b.patch)).toBe(false);
          expect(overlap(l.leaf, b.pond)).toBe(false);
        }
      });
    }
  }

  it('returns null rather than shrink in a view that is too small', () => {
    expect(rainLayout({ w: 600, h: 400 }, 2)).toBeNull();
  });
});

// ---- level 4 ----

const k2 = (a: readonly Surface[]) => arrangementKey(a);
const round4 = (bed: 0 | 1, start: Surface[]): RouteRound => ({
  level: 4,
  bed,
  start,
  friend: 'frog',
  mirror: false,
});

describe('level 4 route', () => {
  it('conserves water along the route after every step', () => {
    for (const a of ARRANGEMENTS) {
      const t = runRoute(a);
      expect(t.steps.length).toBe(4);
      const kept = [0, 0];
      let pond = 0;
      for (const st of t.steps) {
        expect(st.path[0]).toBe(0);
        const end = st.path.at(-1)!;
        if (end === 'pond') pond++;
        else kept[end]++;
        expect(kept[0] + kept[1] + pond).toBe(st.unit + 1);
      }
      expect([kept, pond]).toEqual([t.stored, t.pond]);
    }
  });

  it('the outcome table, for both marked beds', () => {
    const table: [Surface[], number, number, number][] = [
      [['stone', 'soil'], 0, 2, 2],
      [['soil', 'stone'], 2, 0, 2],
      [['soil', 'soil'], 2, 2, 0],
      [['stone', 'stone'], 0, 0, 4],
    ];
    for (const [a, top, low, pond] of table)
      expect([runRoute(a).stored, runRoute(a).pond], k2(a)).toEqual([[top, low], pond]);
    expect(meets(runRoute(['stone', 'soil']), 1)).toEqual({ bed: true, pond: true });
    expect(meets(runRoute(['soil', 'stone']), 1)).toEqual({ bed: false, pond: true });
    expect(meets(runRoute(['soil', 'soil']), 1)).toEqual({ bed: true, pond: false });
    expect(meets(runRoute(['stone', 'stone']), 1)).toEqual({ bed: false, pond: true });
    expect(meets(runRoute(['soil', 'stone']), 0)).toEqual({ bed: true, pond: true });
    expect(meets(runRoute(['soil', 'soil']), 0)).toEqual({ bed: true, pond: false });
    expect(meets(runRoute(['stone', 'soil']), 0).bed).toBe(false);
    expect(meets(runRoute(['stone', 'stone']), 0).bed).toBe(false);
  });

  it('a drop passes a socket only when it is full or stone', () => {
    for (const a of ARRANGEMENTS) {
      const t = runRoute(a);
      const kept = [0, 0];
      for (const st of t.steps) {
        for (const at of st.path.slice(0, -1)) {
          const i = at as number;
          expect(a[i] === 'stone' || kept[i] === 2, `${k2(a)} unit ${st.unit}`).toBe(true);
        }
        const end = st.path.at(-1)!;
        if (end !== 'pond') kept[end]++;
        // Each hop follows the route.
        for (let j = 1; j < st.path.length; j++)
          expect(st.path[j]).toBe(ROUTE4[st.path[j - 1] as number].down);
      }
      if (a[0] === 'stone') for (const st of t.steps) expect(st.path.slice(0, 2)).toEqual([0, 1]);
    }
  });

  it('the judge passes exactly the arrangements solutions lists, one per variant', () => {
    for (const bed of [0, 1] as const) {
      const sols = solutions(bed).map(k2);
      expect(sols.length).toBe(1);
      for (const a of ARRANGEMENTS) {
        const r = check(routeFresh(round4(bed, a)), round4(bed, a));
        expect(r.verdict.result === 'pass', `${bed} ${k2(a)}`).toBe(sols.includes(k2(a)));
      }
    }
    expect(solutions(1).map(k2)).toEqual(['stone/soil']);
    expect(solutions(0).map(k2)).toEqual(['soil/stone']);
  });

  it('cause lines: dry when the marked bed misses, pond when only the pond does', () => {
    const cause = (bed: 0 | 1, a: Surface[]) =>
      check(routeFresh(round4(bed, a)), round4(bed, a)).verdict.cause;
    expect(cause(1, ['soil', 'stone'])).toBe('dry');
    expect(cause(1, ['stone', 'stone'])).toBe('dry');
    expect(cause(1, ['soil', 'soil'])).toBe('pond');
    expect(cause(0, ['stone', 'soil'])).toBe('dry');
    expect(cause(0, ['soil', 'soil'])).toBe('pond');
  });

  it('seeded rounds start failing in their own variant and have a solution; the authored round is soil over stone, low bed', () => {
    expect(makeRoute(new Rng(1), true)).toEqual({
      level: 4,
      bed: 1,
      start: ['soil', 'stone'],
      friend: 'frog',
      mirror: false,
    });
    const seen = new Set<string>();
    for (const seed of SEEDS) {
      const r = makeRoute(new Rng(seed), false);
      seen.add(`${r.bed}:${k2(r.start)}:${r.mirror}`);
      expect(solutions(r.bed).length).toBeGreaterThan(0);
      expect(check(routeFresh(r), r).verdict.result).not.toBe('pass');
      expect(makeRoute(new Rng(seed), false)).toEqual(r);
    }
    // Both variants, all three failing starts of each, and both sides appear.
    expect(seen.size).toBe(12);
  });

  it('hints preserve a solution: each worked step gets strictly closer, and at most two reach one', () => {
    const dist = (a: Surface[], b: Surface[]) => a.filter((x, i) => x !== b[i]).length;
    for (const bed of [0, 1] as const)
      for (const a of ARRANGEMENTS) {
        const r = round4(bed, a);
        let s = routeFresh(r);
        let steps = 0;
        while (stepBed(s.sockets, bed) !== null) {
          const before = dist(s.sockets, nearest(s.sockets, bed));
          const h = routeHint(s, r);
          expect(h.hint.kind).toBe('flip');
          s = h.state;
          expect(dist(s.sockets, nearest(s.sockets, bed))).toBeLessThan(before);
          steps++;
        }
        expect(steps).toBeLessThanOrEqual(2);
        expect(s.hints).toBe(steps);
        expect(check(s, r).verdict.result).toBe('pass');
        // On a passing arrangement the hint points at the Check, counted once.
        const p1 = routeHint(s, r).state;
        expect(routeHint(p1, r).state.hints).toBe(p1.hints);
        expect(p1.hints).toBe(steps + 1);
      }
  });

  it('accounting: a failed Check is one miss, the same arrangement again none, trials and flips none, the glow one hint once', () => {
    const r = round4(1, ['soil', 'stone']);
    let s = routeFresh(r);
    s = tryRoute(s);
    s = tryRoute(s);
    expect([s.misses, s.hints]).toEqual([0, 0]);
    let c = check(s, r);
    expect(c.verdict).toEqual({ result: 'miss', cause: 'dry' });
    s = c.state;
    expect([s.misses, s.hints, s.glow, s.current?.stored]).toEqual([1, 0, null, [2, 0]]);
    c = check(s, r);
    expect(c.verdict.result).toBe('again');
    s = flipBed(flipBed(c.state, 1, r.bed), 1, r.bed);
    expect(check(s, r).verdict.result).toBe('again');
    expect([s.misses, s.current]).toEqual([1, null]);
    // A second, different failing arrangement: the glow lights on the bed to change (one hint).
    s = flipBed(s, 1, r.bed); // soil/soil: the pond gets none
    c = check(s, r);
    s = c.state;
    expect([c.verdict.cause, s.misses, s.hints, s.glow]).toEqual(['pond', 2, 1, 0]);
    // A third failure moves the glow without counting again.
    s = flipBed(s, 0, r.bed);
    expect(s.glow).toBe(null); // stone/soil passes: nothing left to change
    s = flipBed(s, 1, r.bed); // stone/stone
    expect(s.glow).toBe(1);
    s = check(s, r).state;
    expect([s.misses, s.hints, s.glow]).toEqual([3, 1, 1]);
    // Passing.
    s = flipBed(s, 1, r.bed);
    c = check(s, r);
    expect(c.verdict.result).toBe('pass');
    expect([c.state.passed, c.state.misses, c.state.hints, c.state.glow]).toEqual([true, 3, 1, null]);
    expect(check(c.state, r).verdict.result).toBe('ignored');
  });

  it('fresh starts: a flip resets the run; Start again restores the start and keeps the counts', () => {
    const r = round4(1, ['soil', 'stone']);
    let s = check(tryRoute(routeFresh(r)), r).state;
    s = flipBed(s, 0, r.bed);
    expect([s.sockets, s.current]).toEqual([['stone', 'stone'], null]);
    s = tryRoute(s);
    const back = routeRestart(s, r);
    expect([back.sockets, back.current, back.misses]).toEqual([['soil', 'stone'], null, 1]);
  });

  it('the ghost finger reaches the passing Check from every start', () => {
    for (const bed of [0, 1] as const)
      for (const a of ARRANGEMENTS) {
        const r = round4(bed, a);
        let s: RouteState = routeFresh(r);
        let taps = 0;
        for (; taps < 8 && !s.passed; taps++) {
          const n = routeNext(s, r);
          if (n.kind === 'cloud') s = tryRoute(s);
          else if (n.kind === 'bed') s = flipBed(s, n.bed, r.bed);
          else {
            const c = check(s, r);
            s = c.state;
            expect(c.verdict.result).toBe('pass');
          }
        }
        expect(s.passed).toBe(true);
        expect([s.misses, s.hints]).toEqual([0, 0]);
      }
    // The authored round: cloud, top bed, low bed, cloud, Check.
    const r = round4(1, ['soil', 'stone']);
    let s = routeFresh(r);
    const seq: string[] = [];
    while (!s.passed) {
      const n = routeNext(s, r);
      seq.push(n.kind === 'bed' ? `bed${n.bed}` : n.kind);
      s = n.kind === 'cloud' ? tryRoute(s) : n.kind === 'bed' ? flipBed(s, n.bed, r.bed) : check(s, r).state;
    }
    expect(seq).toEqual(['cloud', 'bed0', 'bed1', 'cloud', 'check']);
  });
});

describe('level 4 layout', () => {
  const VIEWS = {
    landscape: computeView(1024, 768),
    portrait: computeView(768, 1024),
    phone: computeView(844, 390),
    notch: computeView(844, 390, { top: 0, right: 47, bottom: 21, left: 47 }),
  };
  const overlap = (a: Box, b: Box) =>
    Math.abs(a.x - b.x) * 2 < a.w + b.w && Math.abs(a.y - b.y) * 2 < a.h + b.h;
  const inside = (b: Box, v: { w: number; h: number }) =>
    b.x - b.w / 2 >= 0 && b.y - b.h / 2 >= 0 && b.x + b.w / 2 <= v.w && b.y + b.h / 2 <= v.h;
  const corner = (b: Box, x0: number, y0: number, x1: number, y1: number) =>
    b.x - b.w / 2 < x1 && b.x + b.w / 2 > x0 && b.y - b.h / 2 < y1 && b.y + b.h / 2 > y0;
  for (const [name, v] of Object.entries(VIEWS))
    for (const bed of [0, 1] as const)
      for (const mirror of [false, true]) {
        it(`${name}, ${bed ? 'low' : 'top'} bed marked${mirror ? ', mirrored' : ''}`, () => {
          const l = routeLayout(v, bed, mirror)!;
          expect(l).not.toBeNull();
          const targets = [l.cloud, l.beds[0].patch, l.beds[1].patch, l.check];
          const clearOfCorners = (b: Box) => {
            expect(corner(b, 0, 0, 120, 215)).toBe(false);
            expect(corner(b, 0, v.h - 170, 170, v.h)).toBe(false);
          };
          for (const b of targets) {
            expect(b.w).toBeGreaterThanOrEqual(100);
            expect(b.h).toBeGreaterThanOrEqual(100);
            expect(inside(b, v)).toBe(true);
            clearOfCorners(b);
          }
          expect([l.cloud.w >= 220, l.cloud.h >= 140, l.check.w >= CHECK, l.check.h >= CHECK]).toEqual([
            true,
            true,
            true,
            true,
          ]);
          for (const b of l.beds) {
            expect(b.patch.w).toBeGreaterThanOrEqual(240);
            expect(b.patch.h).toBeGreaterThanOrEqual(130);
          }
          for (let i = 0; i < targets.length; i++)
            for (let k = i + 1; k < targets.length; k++)
              expect(overlap(targets[i], targets[k]), `targets ${i}/${k}`).toBe(false);
          for (const sign of [l.bedSign, l.pondSign]) {
            expect([sign.w >= 130, sign.h >= 100, sign.w === SIGN_W, sign.h === SIGN_H]).toEqual([
              true,
              true,
              true,
              true,
            ]);
            expect(inside(sign, v)).toBe(true);
            clearOfCorners(sign);
            for (const t of targets) expect(overlap(sign, t)).toBe(false);
            expect(overlap(sign, l.pond)).toBe(false);
          }
          expect(overlap(l.bedSign, l.pondSign)).toBe(false);
          // The marked bed's sign stands beside it.
          const marked = l.beds[bed].patch;
          expect(Math.abs(l.bedSign.y - marked.y)).toBeLessThan(marked.h);
          for (const b of [...l.beds.flatMap((x) => x.pockets), ...l.slots]) {
            expect(b.w).toBeGreaterThanOrEqual(48);
            expect(b.h).toBeGreaterThanOrEqual(48);
            expect(inside(b, v)).toBe(true);
          }
          expect(l.slots.length).toBe(4);
          expect(inside(l.pond, v)).toBe(true);
          expect(corner(l.pond, 0, v.h - 170, 170, v.h)).toBe(false);
          for (const t of targets) expect(overlap(t, l.pond)).toBe(false);
          // The cloud hangs over the top bed; the low bed is downhill of it.
          expect(Math.abs(l.cloud.x - l.beds[0].patch.x)).toBeLessThan(1);
          expect((l.beds[1].patch.x - l.beds[0].patch.x) * (mirror ? -1 : 1)).toBeGreaterThan(0);
          expect(l.beds[1].patch.y).toBeGreaterThan(l.beds[0].patch.y);
        });
      }
  it('returns null rather than shrink', () => expect(routeLayout({ w: 600, h: 400 }, 1)).toBeNull());
});
