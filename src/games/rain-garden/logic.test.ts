import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import { computeView } from '../../engine/view';
import { captionPlace } from '../../ui/caption-layout';
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
  arrangements,
  board4,
  board6,
  compareWet,
  FRIENDS,
  predict,
  runTwo,
  wetCanFinish,
  wetFinish,
  wetFlip,
  wetFresh,
  wetHint,
  wetLayout,
  wetNext,
  wetRain,
  wetRestart,
  type RouteTrial,
  type WetState,
  BOARDS5,
  ROUTE5,
  narration,
  runBoard,
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
  BOARDS7,
  CARD,
  checkCards,
  checkTwo,
  flipTwo,
  nearest7,
  pickCard,
  pondOk,
  previewRain,
  solutions7,
  stepBed7,
  twoFresh,
  twoHint,
  twoNext,
  twoRestart,
  twoRound,
  type TwoBoard,
  type TwoState,
} from './logic';
import { VOICE } from './voice';

const distance = (a: readonly Surface[], b: readonly Surface[]) => a.filter((x, i) => x !== b[i]).length;

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
    expect(PLANS.map((p) => p.level)).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
    expect(planFor(0).level).toBe(1);
    expect(planFor(2.4).level).toBe(2);
    expect(planFor(99).level).toBe(8);
    expect(LEVELS).toEqual({
      toddler: { min: 1, max: 1 },
      preschool: { min: 1, max: 2 },
      prek: { min: 2, max: 3 },
      school: { min: 3, max: 8 },
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
    upright: computeView(390, 844, undefined, true),
    uprightTall: computeView(390, 900, undefined, true),
    uprightPad: computeView(768, 1024, undefined, true),
    uprightWide: computeView(430, 700, undefined, true),
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
          expect(corner(b, 0, v.h - (v.upright ? 205 : 170), 170, v.h)).toBe(false);
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

  it('hangs upright boards up from the bottom edge, so a tall phone leaves sky above', () => {
    for (const level of [1, 2, 3]) {
      const a = rainLayout(VIEWS.uprightPad, level)!;
      const b = rainLayout(VIEWS.uprightTall, level)!;
      const dy = VIEWS.uprightTall.h - VIEWS.uprightPad.h;
      expect(b.boards[0].pond.y - a.boards[0].pond.y).toBeCloseTo(dy);
      expect(b.cloud.y - a.cloud.y).toBeCloseTo(dy);
    }
  });

  it('returns null rather than shrink in a view that is too small', () => {
    expect(rainLayout({ w: 600, h: 400 }, 2)).toBeNull();
    expect(rainLayout({ w: 700, h: 900, upright: true }, 2)).toBeNull();
  });
});

// ---- level 4 ----

const k2 = (a: readonly Surface[]) => arrangementKey(a);
const round4 = (bed: 0 | 1, start: Surface[]): RouteRound => ({
  level: 4,
  board: board4(bed),
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
    expect(meets(runRoute(['stone', 'soil']), board4(1))).toEqual({ beds: [true], pond: true });
    expect(meets(runRoute(['soil', 'stone']), board4(1))).toEqual({ beds: [false], pond: true });
    expect(meets(runRoute(['soil', 'soil']), board4(1))).toEqual({ beds: [true], pond: false });
    expect(meets(runRoute(['stone', 'stone']), board4(1))).toEqual({ beds: [false], pond: true });
    expect(meets(runRoute(['soil', 'stone']), board4(0))).toEqual({ beds: [true], pond: true });
    expect(meets(runRoute(['soil', 'soil']), board4(0))).toEqual({ beds: [true], pond: false });
    expect(meets(runRoute(['stone', 'soil']), board4(0)).beds[0]).toBe(false);
    expect(meets(runRoute(['stone', 'stone']), board4(0)).beds[0]).toBe(false);
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
      const sols = solutions(board4(bed)).map(k2);
      expect(sols.length).toBe(1);
      for (const a of ARRANGEMENTS) {
        const r = check(routeFresh(round4(bed, a)), round4(bed, a));
        expect(r.verdict.result === 'pass', `${bed} ${k2(a)}`).toBe(sols.includes(k2(a)));
      }
    }
    expect(solutions(board4(1)).map(k2)).toEqual(['stone/soil']);
    expect(solutions(board4(0)).map(k2)).toEqual(['soil/stone']);
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
      board: board4(1),
      start: ['soil', 'stone'],
      friend: 'frog',
      mirror: false,
    });
    const seen = new Set<string>();
    for (const seed of SEEDS) {
      const r = makeRoute(new Rng(seed), false);
      seen.add(`${r.board.id}:${k2(r.start)}:${r.mirror}`);
      expect(solutions(r.board).length).toBeGreaterThan(0);
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
        while (stepBed(s.sockets, board4(bed)) !== null) {
          const before = dist(s.sockets, nearest(s.sockets, board4(bed)));
          const h = routeHint(s, r);
          expect(h.hint.kind).toBe('flip');
          s = h.state;
          expect(dist(s.sockets, nearest(s.sockets, board4(bed)))).toBeLessThan(before);
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
    s = tryRoute(s, r);
    s = tryRoute(s, r);
    expect([s.misses, s.hints]).toEqual([0, 0]);
    let c = check(s, r);
    expect(c.verdict).toEqual({ result: 'miss', cause: 'dry', need: 0 });
    s = c.state;
    expect([s.misses, s.hints, s.glow, s.current?.stored]).toEqual([1, 0, null, [2, 0]]);
    c = check(s, r);
    expect(c.verdict.result).toBe('again');
    s = flipBed(flipBed(c.state, 1, r.board), 1, r.board);
    expect(check(s, r).verdict.result).toBe('again');
    expect([s.misses, s.current]).toEqual([1, null]);
    // A second, different failing arrangement: the glow lights on the bed to change (one hint).
    s = flipBed(s, 1, r.board); // soil/soil: the pond gets none
    c = check(s, r);
    s = c.state;
    expect([c.verdict.cause, s.misses, s.hints, s.glow]).toEqual(['pond', 2, 1, 0]);
    // A third failure moves the glow without counting again.
    s = flipBed(s, 0, r.board);
    expect(s.glow).toBe(null); // stone/soil passes: nothing left to change
    s = flipBed(s, 1, r.board); // stone/stone
    expect(s.glow).toBe(1);
    s = check(s, r).state;
    expect([s.misses, s.hints, s.glow]).toEqual([3, 1, 1]);
    // Passing.
    s = flipBed(s, 1, r.board);
    c = check(s, r);
    expect(c.verdict.result).toBe('pass');
    expect([c.state.passed, c.state.misses, c.state.hints, c.state.glow]).toEqual([true, 3, 1, null]);
    expect(check(c.state, r).verdict.result).toBe('ignored');
  });

  it('fresh starts: a flip resets the run; Start again restores the start and keeps the counts', () => {
    const r = round4(1, ['soil', 'stone']);
    let s = check(tryRoute(routeFresh(r), r), r).state;
    s = flipBed(s, 0, r.board);
    expect([s.sockets, s.current]).toEqual([['stone', 'stone'], null]);
    s = tryRoute(s, r);
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
          if (n.kind === 'cloud') s = tryRoute(s, r);
          else if (n.kind === 'bed') s = flipBed(s, n.bed, r.board);
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
      s =
        n.kind === 'cloud'
          ? tryRoute(s, r)
          : n.kind === 'bed'
            ? flipBed(s, n.bed, r.board)
            : check(s, r).state;
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
    upright: computeView(390, 844, undefined, true),
    uprightTall: computeView(390, 900, undefined, true),
    uprightPad: computeView(768, 1024, undefined, true),
    uprightWide: computeView(430, 700, undefined, true),
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
          const l = routeLayout(v, board4(bed), mirror)!;
          expect(l).not.toBeNull();
          const targets = [l.cloud, l.beds[0].patch, l.beds[1].patch, l.check];
          const clearOfCorners = (b: Box) => {
            expect(corner(b, 0, 0, 120, 215)).toBe(false);
            expect(corner(b, 0, v.h - (v.upright ? 205 : 170), 170, v.h)).toBe(false);
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
          for (const sign of [...l.bedSigns, l.pondSign]) {
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
          expect(overlap(l.bedSigns[0], l.pondSign)).toBe(false);
          // The marked bed's sign stands beside it.
          const marked = l.beds[bed].patch;
          expect(Math.abs(l.bedSigns[0].y - marked.y)).toBeLessThan(marked.h);
          for (const b of [...l.beds.flatMap((x) => x.pockets), ...l.slots]) {
            expect(b.w).toBeGreaterThanOrEqual(48);
            expect(b.h).toBeGreaterThanOrEqual(48);
            expect(inside(b, v)).toBe(true);
          }
          expect(l.slots.length).toBe(4);
          expect(inside(l.pond, v)).toBe(true);
          expect(corner(l.pond, 0, v.h - (v.upright ? 205 : 170), 170, v.h)).toBe(false);
          for (const t of targets) expect(overlap(t, l.pond)).toBe(false);
          // The cloud hangs over the top bed; the low bed is downhill of it.
          expect(Math.abs(l.cloud.x - l.beds[0].patch.x)).toBeLessThan(1);
          expect((l.beds[1].patch.x - l.beds[0].patch.x) * (mirror && !v.upright ? -1 : 1)).toBeGreaterThan(
            0,
          );
          expect(l.beds[1].patch.y).toBeGreaterThan(l.beds[0].patch.y);
        });
      }
  it('returns null rather than shrink', () => expect(routeLayout({ w: 600, h: 400 }, board4(1))).toBeNull());
});

// ---- level 5 ----

const byId = (id: string) => BOARDS5.find((b) => b.id === id)!;
const round5 = (id: string, start: Surface[]): RouteRound => ({
  level: 5,
  board: byId(id),
  start,
  friend: 'frog',
  mirror: false,
});
/** Arrangement → kept per socket, pond, and the result: pass, the dry need's index in `marked`, or pond. */
type Row = [string, number[], number, 'pass' | 'pond' | number];
const TABLES: Record<string, Row[]> = {
  A: [
    ['stone/stone/stone', [0, 0, 0], 6, 0],
    ['stone/stone/soil', [0, 0, 2], 4, 0],
    ['stone/soil/stone', [0, 2, 0], 4, 1],
    ['stone/soil/soil', [0, 2, 2], 2, 'pass'],
    ['soil/stone/stone', [2, 0, 0], 4, 0],
    ['soil/stone/soil', [2, 0, 2], 2, 0],
    ['soil/soil/stone', [2, 2, 0], 2, 1],
    ['soil/soil/soil', [2, 2, 2], 0, 'pond'],
  ],
  B: [
    ['stone/stone/stone', [0, 0, 0], 6, 0],
    ['stone/stone/soil', [0, 0, 2], 4, 0],
    ['stone/soil/stone', [0, 2, 0], 4, 0],
    ['stone/soil/soil', [0, 2, 2], 2, 0],
    ['soil/stone/stone', [2, 0, 0], 4, 1],
    ['soil/stone/soil', [2, 0, 2], 2, 'pass'],
    ['soil/soil/stone', [2, 2, 0], 2, 1],
    ['soil/soil/soil', [2, 2, 2], 0, 'pond'],
  ],
  C: [
    ['stone/soil/stone', [0, 2, 0], 4, 0],
    ['stone/soil/soil', [0, 2, 2], 2, 'pass'],
    ['soil/soil/stone', [2, 2, 0], 2, 0],
    ['soil/soil/soil', [2, 2, 2], 0, 'pond'],
  ],
  D: [
    ['stone/stone/stone', [0, 0, 0], 6, 0],
    ['stone/stone/soil', [0, 0, 2], 4, 'pass'],
    ['soil/stone/stone', [2, 0, 0], 4, 0],
    ['soil/stone/soil', [2, 0, 2], 2, 'pass'],
  ],
  E: [
    ['stone/stone/stone', [0, 0, 0], 6, 0],
    ['stone/stone/soil', [0, 0, 2], 4, 0],
    ['stone/soil/stone', [0, 2, 0], 4, 'pass'],
    ['stone/soil/soil', [0, 2, 2], 2, 'pass'],
    ['soil/stone/stone', [2, 0, 0], 4, 0],
    ['soil/stone/soil', [2, 0, 2], 2, 0],
    ['soil/soil/stone', [2, 2, 0], 2, 'pass'],
    ['soil/soil/soil', [2, 2, 2], 0, 'pond'],
  ],
  F: [
    ['stone/stone/stone', [0, 0, 0], 4, 0],
    ['stone/stone/soil', [0, 0, 2], 2, 'pass'],
    ['stone/soil/stone', [0, 2, 0], 2, 0],
    ['stone/soil/soil', [0, 2, 2], 0, 'pond'],
    ['soil/stone/stone', [2, 0, 0], 2, 0],
    ['soil/stone/soil', [2, 0, 2], 0, 'pond'],
    ['soil/soil/stone', [2, 2, 0], 0, 0],
    ['soil/soil/soil', [2, 2, 0], 0, 0],
  ],
};
const parse = (k: string) => k.split('/') as Surface[];

describe('level 5 boards', () => {
  it('six well-formed boards: one chain to the pond, marked beds tappable, leaf uphill then flower, four or six drops', () => {
    expect(BOARDS5.map((b) => b.id)).toEqual(['A', 'B', 'C', 'D', 'E', 'F']);
    for (const b of BOARDS5) {
      expect(b.route).toEqual(ROUTE5);
      // Every socket is reached from socket 0 in order and the chain ends in the pond.
      let at: number | 'pond' = 0;
      const seen: number[] = [];
      while (at !== 'pond') {
        seen.push(at);
        at = b.route[at].down;
      }
      expect(seen).toEqual([0, 1, 2]);
      expect(b.marked.length).toBeGreaterThanOrEqual(1);
      expect(b.marked.length).toBeLessThanOrEqual(2);
      b.marked.forEach((m, i) => {
        expect(b.fixed[m.socket]).toBeNull();
        expect(m.marker).toBe(i === 0 ? 'leaf' : 'flower');
        if (i) expect(m.socket).toBeGreaterThan(b.marked[i - 1].socket);
      });
      expect([4, 6]).toContain(b.units);
    }
  });

  it('conserves water after every step and passes a socket only when it is stone or full', () => {
    for (const b of BOARDS5)
      for (const a of arrangements(b)) {
        const t = runBoard(a, b);
        expect(t.steps.length).toBe(b.units);
        const kept = [0, 0, 0];
        let pond = 0;
        for (const st of t.steps) {
          expect(st.path[0]).toBe(0);
          for (const at of st.path.slice(0, -1)) {
            const i = at as number;
            expect(a[i] === 'stone' || kept[i] === 2).toBe(true);
          }
          const end = st.path.at(-1)!;
          if (end === 'pond') pond++;
          else kept[end]++;
          expect(kept[0] + kept[1] + kept[2] + pond).toBe(st.unit + 1);
        }
        expect([kept, pond]).toEqual([t.stored, t.pond]);
      }
  });

  it('the six outcome tables: kept, pond and cause for every arrangement', () => {
    for (const b of BOARDS5) {
      const rows = TABLES[b.id];
      expect(arrangements(b).map(k2)).toEqual(rows.map((r) => r[0]));
      for (const [k, kept, pond, result] of rows) {
        const t = runBoard(parse(k), b);
        expect([t.stored, t.pond], `${b.id} ${k}`).toEqual([kept, pond]);
        const v = check(routeFresh(round5(b.id, parse(k))), round5(b.id, parse(k))).verdict;
        if (result === 'pass') expect(v.result, `${b.id} ${k}`).toBe('pass');
        else if (result === 'pond')
          expect([v.result, v.cause, v.need], `${b.id} ${k}`).toEqual(['miss', 'pond', null]);
        else expect([v.result, v.cause, v.need], `${b.id} ${k}`).toEqual(['miss', 'dry', result]);
      }
    }
  });

  it('the judge passes exactly what solutions lists: one answer, except two on D and three on E', () => {
    const counts = Object.fromEntries(BOARDS5.map((b) => [b.id, solutions(b).length]));
    expect(counts).toEqual({ A: 1, B: 1, C: 1, D: 2, E: 3, F: 1 });
    for (const b of BOARDS5) {
      const sols = solutions(b).map(k2);
      for (const a of arrangements(b))
        expect(check(routeFresh(round5(b.id, a)), round5(b.id, a)).verdict.result === 'pass').toBe(
          sols.includes(k2(a)),
        );
    }
  });

  it('seeded rounds start failing on their own board with fixed sockets in place; the authored round is A from soil/soil/stone', () => {
    expect(makeRoute(new Rng(1), true, 5)).toEqual(round5('A', ['soil', 'soil', 'stone']));
    const boards = new Set<string>();
    for (const seed of SEEDS) {
      const r = makeRoute(new Rng(seed), false, 5);
      boards.add(r.board.id);
      expect(r.mirror).toBe(false);
      r.board.fixed.forEach((f, i) => {
        if (f) expect(r.start[i]).toBe(f === 'tree' ? 'soil' : 'stone');
      });
      expect(arrangements(r.board).map(k2)).toContain(k2(r.start));
      expect(check(routeFresh(r), r).verdict.result).not.toBe('pass');
      expect(makeRoute(new Rng(seed), false, 5)).toEqual(r);
    }
    expect(boards.size).toBe(6);
  });

  it('hints preserve a solution: never a fixed socket, strictly closer, at most three steps (two with a fixed socket)', () => {
    for (const b of BOARDS5)
      for (const a of arrangements(b)) {
        const r = round5(b.id, a);
        let s = routeFresh(r);
        let steps = 0;
        while (stepBed(s.sockets, b) !== null) {
          const i = stepBed(s.sockets, b)!;
          expect(b.fixed[i]).toBeNull();
          const before = distance(s.sockets, nearest(s.sockets, b));
          s = routeHint(s, r).state;
          expect(distance(s.sockets, nearest(s.sockets, b))).toBeLessThan(before);
          steps++;
        }
        expect(steps).toBeLessThanOrEqual(b.fixed.some(Boolean) ? 2 : 3);
        expect(check(s, r).verdict.result).toBe('pass');
      }
    // Ties go to the first solution in enumeration order: E from soil/stone/soil is one flip from both
    // stone/soil/soil and soil/soil/stone... and stone/soil/soil comes first.
    expect(k2(nearest(parse('soil/stone/soil'), byId('E')))).toBe('stone/soil/soil');
    expect(k2(nearest(parse('stone/stone/stone'), byId('D')))).toBe('stone/stone/soil');
  });

  it('accounting at level 5: a fixed-socket tap changes and counts nothing; level 4 rules otherwise', () => {
    const r = round5('C', ['soil', 'soil', 'stone']);
    let s = check(tryRoute(routeFresh(r), r), r).state;
    expect([s.misses, s.hints]).toEqual([1, 0]);
    const same = flipBed(s, 1, r.board);
    expect(same).toBe(s);
    expect(check(s, r).verdict.result).toBe('again');
    s = flipBed(s, 2, r.board); // soil/[soil]/soil: the pond gets none
    s = check(s, r).state;
    expect([s.misses, s.hints, s.glow]).toEqual([2, 1, 0]);
    s = routeHint(s, r).state;
    expect([k2(s.sockets), s.hints, s.glow]).toEqual(['stone/soil/soil', 2, null]);
    const c = check(s, r);
    expect([c.verdict.result, c.state.misses, c.state.hints]).toEqual(['pass', 2, 2]);
  });

  it('the ghost finger reaches the passing Check from every start; on A: cloud, top bed, low bed, cloud, Check', () => {
    for (const b of BOARDS5)
      for (const a of arrangements(b)) {
        const r = round5(b.id, a);
        let s = routeFresh(r);
        for (let taps = 0; taps < 10 && !s.passed; taps++) {
          const n = routeNext(s, r);
          if (n.kind === 'cloud') s = tryRoute(s, r);
          else if (n.kind === 'bed') {
            expect(b.fixed[n.bed]).toBeNull();
            s = flipBed(s, n.bed, b);
          } else s = check(s, r).state;
        }
        expect([s.passed, s.misses, s.hints]).toEqual([true, 0, 0]);
      }
    const r = round5('A', ['soil', 'soil', 'stone']);
    let s = routeFresh(r);
    const seq: string[] = [];
    while (!s.passed) {
      const n = routeNext(s, r);
      seq.push(n.kind === 'bed' ? `bed${n.bed}` : n.kind);
      s =
        n.kind === 'cloud'
          ? tryRoute(s, r)
          : n.kind === 'bed'
            ? flipBed(s, n.bed, r.board)
            : check(s, r).state;
    }
    expect(seq).toEqual(['cloud', 'bed0', 'bed2', 'cloud', 'check']);
  });

  it('narration: one clip per reached socket from the top, the first dry one named once, then the pond; every clip exists', () => {
    const POS = ['top', 'middle', 'low'];
    for (const b of BOARDS5)
      for (const a of arrangements(b)) {
        const t = runBoard(a, b);
        const clips = narration(t, b);
        expect(clips.at(-1)).toBe(`rain.pond.${t.pond}`);
        for (const c of clips) expect(VOICE, c).toHaveProperty([c]);
        const none = clips.findIndex((c) => c.endsWith('.none'));
        // Sockets named are a prefix of the chain; nothing below the first one water missed.
        expect(clips.length - 1).toBe(none < 0 ? 3 : none + 1);
        clips.slice(0, -1).forEach((c, i) => {
          const f = b.fixed[i];
          if (f) expect(c.startsWith(`rain.${f}.`)).toBe(true);
          else expect(c.startsWith(`rain.bed.${POS[i]}.`)).toBe(true);
        });
      }
    expect(narration(runBoard(parse('soil/soil/stone'), byId('A')), byId('A'))).toEqual([
      'rain.bed.top.kept',
      'rain.bed.middle.kept',
      'rain.bed.low.stone',
      'rain.pond.2',
    ]);
    expect(narration(runBoard(parse('soil/soil/soil'), byId('F')), byId('F'))).toEqual([
      'rain.bed.top.kept',
      'rain.bed.middle.kept',
      'rain.bed.low.none',
      'rain.pond.0',
    ]);
  });
});

describe('level 5 layout', () => {
  const VIEWS = {
    landscape: computeView(1024, 768),
    portrait: computeView(768, 1024),
    phone: computeView(844, 390),
    notch: computeView(844, 390, { top: 0, right: 47, bottom: 21, left: 47 }),
    upright: computeView(390, 844, undefined, true),
    uprightTall: computeView(390, 900, undefined, true),
    uprightPad: computeView(768, 1024, undefined, true),
    uprightWide: computeView(430, 700, undefined, true),
  };
  const overlap = (a: Box, b: Box) =>
    Math.abs(a.x - b.x) * 2 < a.w + b.w && Math.abs(a.y - b.y) * 2 < a.h + b.h;
  const inside = (b: Box, v: { w: number; h: number }) =>
    b.x - b.w / 2 >= 0 && b.y - b.h / 2 >= 0 && b.x + b.w / 2 <= v.w && b.y + b.h / 2 <= v.h;
  const corner = (b: Box, x0: number, y0: number, x1: number, y1: number) =>
    b.x - b.w / 2 < x1 && b.x + b.w / 2 > x0 && b.y - b.h / 2 < y1 && b.y + b.h / 2 > y0;
  for (const [name, v] of Object.entries(VIEWS))
    for (const b of BOARDS5)
      it(`${name}, board ${b.id}`, () => {
        const l = routeLayout(v, b)!;
        expect(l).not.toBeNull();
        const targets = [l.cloud, ...l.beds.map((x) => x.patch), l.check];
        const clear = (x: Box) => {
          expect(corner(x, 0, 0, 120, 215)).toBe(false);
          expect(corner(x, 0, v.h - (v.upright ? 205 : 170), 170, v.h)).toBe(false);
          expect(inside(x, v)).toBe(true);
        };
        for (const t of targets) {
          expect(Math.min(t.w, t.h)).toBeGreaterThanOrEqual(100);
          clear(t);
        }
        expect(l.beds.length).toBe(3);
        for (const x of l.beds) expect([x.patch.w >= 240, x.patch.h >= 130]).toEqual([true, true]);
        for (let i = 0; i < targets.length; i++)
          for (let k = i + 1; k < targets.length; k++)
            expect(overlap(targets[i], targets[k]), `targets ${i}/${k}`).toBe(false);
        expect(l.bedSigns.length).toBe(b.marked.length);
        const signs = [...l.bedSigns, l.pondSign];
        for (const s of signs) {
          expect([s.w, s.h]).toEqual([SIGN_W, SIGN_H]);
          clear(s);
          for (const t of targets) expect(overlap(s, t)).toBe(false);
          expect(overlap(s, l.pond)).toBe(false);
        }
        for (let i = 0; i < signs.length; i++)
          for (let k = i + 1; k < signs.length; k++) expect(overlap(signs[i], signs[k])).toBe(false);
        // Each marked bed's sign stands beside it.
        b.marked.forEach((m, i) => {
          const p = l.beds[m.socket].patch;
          expect(Math.abs(l.bedSigns[i].y - p.y)).toBeLessThan(p.h);
        });
        expect(l.slots.length).toBe(6);
        for (const x of [...l.beds.flatMap((y) => y.pockets), ...l.slots]) {
          expect(Math.min(x.w, x.h)).toBeGreaterThanOrEqual(48);
          expect(inside(x, v)).toBe(true);
        }
        clear(l.pond);
        for (const t of targets) expect(overlap(t, l.pond)).toBe(false);
        expect(Math.abs(l.cloud.x - l.beds[0].patch.x)).toBeLessThan(1);
        for (let i = 1; i < 3; i++) expect(l.beds[i].patch.y).toBeGreaterThan(l.beds[i - 1].patch.y);
        expect(l.pond.y).toBeGreaterThan(l.beds[2].patch.y);
      });
  it('returns null rather than shrink', () => expect(routeLayout({ w: 600, h: 400 }, BOARDS5[0])).toBeNull());
});

const WET_OUTCOMES = [
  { ground: 'soil/soil', units: 4, first: [2, 2, 0], second: [2, 2, 4], pond: 'more', further: false },
  { ground: 'stone/soil', units: 4, first: [0, 2, 2], second: [0, 2, 4], pond: 'more', further: false },
  { ground: 'soil/stone', units: 4, first: [2, 0, 2], second: [2, 0, 4], pond: 'more', further: false },
  { ground: 'stone/stone', units: 4, first: [0, 0, 4], second: [0, 0, 4], pond: 'same', further: false },
  { ground: 'soil/soil', units: 2, first: [2, 0, 0], second: [2, 2, 0], pond: 'same', further: true },
  { ground: 'stone/soil', units: 2, first: [0, 2, 0], second: [0, 2, 2], pond: 'more', further: false },
  { ground: 'soil/stone', units: 2, first: [2, 0, 0], second: [2, 0, 2], pond: 'more', further: false },
  { ground: 'stone/stone', units: 2, first: [0, 0, 2], second: [0, 0, 2], pond: 'same', further: false },
] as const;

const total = (counts: readonly number[]) => counts.reduce((sum, n) => sum + n, 0);

describe('level 6 trials on dry and wet soil', () => {
  it.each(WET_OUTCOMES)(
    '$ground, $units drops: predicts the measured outcome and conserves both rains',
    (row) => {
      const board = board6(row.units);
      const sockets = parse(row.ground);
      const [first, second] = runTwo(sockets, board);
      expect([...first.stored, first.pond]).toEqual(row.first);
      expect([...second.stored, second.pond]).toEqual(row.second);
      expect(compareWet(first, second)).toEqual({ pond: row.pond, further: row.further });
      expect(second.pond).toBeGreaterThanOrEqual(first.pond);
      expect(total(second.stored) + first.pond + second.pond).toBe(2 * row.units);

      const checkShower = (shower: RouteTrial, start: readonly number[]) => {
        const kept = [...start];
        let pond = 0;
        expect(shower.steps.map((step) => step.unit)).toEqual(Array.from({ length: row.units }, (_, i) => i));
        for (const { path, unit } of shower.steps) {
          expect(path[0]).toBe(0);
          path.slice(0, -1).forEach((at, i) => {
            if (at === 'pond') throw new Error('A drop must stop at the pond');
            expect(kept[at]).toBe(CAPACITY[sockets[at]]);
            expect(path[i + 1]).toBe(board.route[at].down);
          });
          const end = path.at(-1)!;
          if (end === 'pond') pond++;
          else {
            kept[end]++;
            expect(kept[end]).toBeLessThanOrEqual(CAPACITY[sockets[end]]);
          }
          expect(total(kept) + pond).toBe(total(start) + unit + 1);
        }
        expect([kept, pond]).toEqual([shower.stored, shower.pond]);
        for (const [i, n] of kept.entries()) expect([0, 2]).toContain(n - start[i]);
      };
      checkShower(first, [0, 0]);
      checkShower(second, first.stored);
      expect(runRoute(sockets, board.route, board.units, first.stored)).toEqual(second);
      expect([...first.stored, first.pond]).toEqual(row.first);
    },
  );

  it('preserves fresh-start routes for levels 4 and 5', () => {
    for (const board of [board4(0), board4(1), ...BOARDS5])
      for (const sockets of arrangements(board))
        expect(
          runRoute(
            sockets,
            board.route,
            board.units,
            sockets.map(() => 0),
          ),
        ).toEqual(runBoard(sockets, board));
  });

  it.each(WET_OUTCOMES)('$ground, $units drops: names the correct beds and pond in both rains', (row) => {
    const board = board6(row.units);
    const sockets = parse(row.ground);
    const [first, second] = runTwo(sockets, board);
    for (const [trial, start] of [
      [first, [0, 0]],
      [second, first.stored],
    ] as const) {
      const clips = narration(trial, board, start);
      const expected: string[] = [];
      for (const [i, position] of ['top', 'low'].entries()) {
        const reached = trial.steps.some(({ path }) => path.includes(i));
        const result = !reached
          ? 'none'
          : sockets[i] === 'stone'
            ? 'stone'
            : start[i] === 2
              ? 'full'
              : 'kept';
        expected.push(`rain.bed.${position}.${result}`);
        if (!reached) break;
      }
      expected.push(`rain.pond.${trial.pond}`);
      expect(clips).toEqual(expected);
      expect(clips).not.toContain('rain.pond.6');
      for (const id of clips) expect(VOICE, id).toHaveProperty([id]);
    }
  });

  it('uses the authored contrast first and produces all eight board/ground pairs across stable seeds', () => {
    expect(makeRoute(new Rng(100), true, 6)).toEqual({
      level: 6,
      board: board6(4),
      start: ['soil', 'soil'],
      friend: 'frog',
      mirror: false,
    });
    const seen = new Set<string>();
    for (const seed of SEEDS) {
      const round = makeRoute(new Rng(seed), false, 6);
      expect(makeRoute(new Rng(seed), false, 6)).toEqual(round);
      expect(round.level).toBe(6);
      expect(round.start).toHaveLength(2);
      expect(round.start.every((surface) => SURFACES.includes(surface))).toBe(true);
      expect(FRIENDS).toContain(round.friend);
      expect(round.mirror).toBe(false);
      expect([2, 4]).toContain(round.board.units);
      expect(round.board.route).toEqual(ROUTE4);
      expect(round.board.fixed).toEqual([null, null]);
      expect(round.board.marked).toEqual([]);
      const fresh = wetFresh(round);
      expect(fresh).toMatchObject({
        first: null,
        second: null,
        prediction: null,
        hints: 0,
        sequences: 0,
      });
      expect(wetNext(fresh)).toBe('cloud');
      const first = wetRain(fresh, round);
      expect(wetNext(first)).toBe('cloud');
      const second = wetRain(first, round);
      expect(wetNext(second)).toBe('leaf');
      expect(wetFinish(second).finished).toBe(true);
      seen.add(`${round.start.join('/')}:${round.board.units}`);
    }
    expect(seen).toEqual(new Set(WET_OUTCOMES.map(({ ground, units }) => `${ground}:${units}`)));
  });
});

describe('level 6 wet round actions', () => {
  const round = makeRoute(new Rng(12), true, 6);
  const initial = wetFresh(round);
  const fresh = { first: null, second: null, prediction: null, pointing: null };

  it('starts fresh after a flip in every phase, a finished trial replay, or Start again', () => {
    const first = predict(wetRain(initial, round), 'more');
    const second = wetHint(wetRain(first, round));
    for (const s of [initial, first, second]) {
      for (const i of [0, 1]) {
        const flipped = wetFlip(s, i);
        expect(flipped).toMatchObject({ ...fresh, sequences: s.sequences, hints: s.hints });
        expect(flipped.sockets).toEqual(s.sockets.map((surface, j) => (i === j ? flip(surface) : surface)));
        expect(wetRain(flipped, round).first).toEqual(runBoard(flipped.sockets, round.board));
      }
      expect(wetRestart(s, round)).toMatchObject({
        ...fresh,
        sockets: round.start,
        sequences: s.sequences,
        hints: s.hints,
      });
    }
    const replay = wetRain(second, round);
    expect(replay).toMatchObject({ ...fresh, sockets: second.sockets, sequences: 1, hints: second.hints });
    expect(wetRain(replay, round).first).toEqual(first.first);
    expect(wetCanFinish(replay)).toBe(true);
  });

  it('keeps guesses optional, changeable and separate from the rain results and help count', () => {
    expect(predict(initial, 'more')).toEqual(initial);
    const wet = wetHint(wetRain(initial, round));
    const changed = predict(predict(wet, 'more'), 'same');
    expect(changed.prediction).toBe('same');
    const guess = wetRain(changed, round);
    const skip = wetRain(wet, round);
    expect(guess).toMatchObject({ first: skip.first, second: skip.second, hints: wet.hints, sequences: 1 });
    expect(guess.prediction).toBe('same');
    expect(skip.prediction).toBeNull();
    expect(predict(guess, 'more')).toEqual(guess);
    expect(compareWet(guess.first!, guess.second!).pond).toBe('more');
  });

  it('points to useful actions, counts each newly pointed action once, and finishes once', () => {
    const hinted = wetHint(initial);
    expect(wetNext(initial)).toBe('cloud');
    expect(hinted).toMatchObject({ pointing: 'cloud', hints: 1, first: null, second: null });
    expect(wetHint(hinted)).toEqual(hinted);
    expect(wetCanFinish(initial)).toBe(false);
    expect(wetFinish(initial)).toEqual(initial);

    const first = wetRain(hinted, round);
    expect(wetNext(first)).toBe('cloud');
    expect(wetHint(first)).toMatchObject({ pointing: 'cloud', hints: 2 });
    expect(wetCanFinish(first)).toBe(false);
    expect(wetFinish(first)).toEqual(first);

    const second = wetRain(first, round);
    expect(wetCanFinish(second)).toBe(true);
    expect(wetNext(second)).toBe('leaf');
    const leaf = wetHint(second);
    expect(leaf).toMatchObject({ pointing: 'leaf', hints: 2 });
    expect(wetHint(leaf)).toEqual(leaf);
    const finished = wetFinish(leaf);
    expect(finished).toMatchObject({ finished: true, hints: 2, sequences: 1 });
    expect(wetFinish(finished)).toEqual(finished);
    expect(wetRain(finished, round)).toEqual(finished);
    expect(wetFlip(finished, 0)).toEqual(finished);
    expect(wetHint(finished)).toEqual(finished);
    expect(wetRestart(finished, round)).toEqual(finished);
  });

  it('keeps storage, help and sequence counts consistent across bounded action sequences', () => {
    for (const units of [2, 4] as const) {
      const board = { ...round, board: board6(units) };
      const actions = {
        rain: (s: WetState) => wetRain(s, board),
        flipTop: (s: WetState) => wetFlip(s, 0),
        flipLow: (s: WetState) => wetFlip(s, 1),
        guessMore: (s: WetState) => predict(s, 'more'),
        guessSame: (s: WetState) => predict(s, 'same'),
        restart: (s: WetState) => wetRestart(s, board),
        hint: wetHint,
      };
      let states = [wetFresh(board)];
      for (let depth = 0; depth < 6; depth++) {
        const next = new Map<string, WetState>();
        for (const s of states) {
          for (const [name, action] of Object.entries(actions)) {
            const result = action(s);
            expect(result.sequences - s.sequences).toBe(name === 'rain' && s.first && !s.second ? 1 : 0);
            expect(result.hints - s.hints).toBe(name === 'hint' && s.pointing !== wetNext(s) ? 1 : 0);
            expect('misses' in result ? result.misses : 0).toBe(0);
            expect(wetCanFinish(result)).toBe(result.sequences > 0);
            const [first, second] = runTwo(result.sockets, board.board);
            if (result.first) expect(result.first).toEqual(first);
            if (result.second) expect(result.second).toEqual(second);
            if (!result.first) expect([result.second, result.prediction]).toEqual([null, null]);
            next.set(JSON.stringify(result), result);
          }
        }
        states = [...next.values()];
      }
    }
  });
});

describe('level 6 layout', () => {
  const views = {
    landscape: computeView(1024, 768),
    portrait: computeView(768, 1024),
    phone: computeView(844, 390),
    notch: computeView(844, 390, { top: 0, right: 47, bottom: 21, left: 47 }),
    upright: computeView(390, 844, undefined, true),
    uprightTall: computeView(390, 900, undefined, true),
    uprightPad: computeView(768, 1024, undefined, true),
    uprightWide: computeView(430, 700, undefined, true),
  };
  const overlap = (a: Box, b: Box) =>
    Math.abs(a.x - b.x) * 2 < a.w + b.w && Math.abs(a.y - b.y) * 2 < a.h + b.h;
  const contains = (outer: Box, inner: Box) =>
    Math.abs(outer.x - inner.x) * 2 + inner.w <= outer.w &&
    Math.abs(outer.y - inner.y) * 2 + inner.h <= outer.h;

  for (const [name, view] of Object.entries(views)) {
    it(`${name}: six full-size targets and two aligned, unobstructed pond rows`, () => {
      const layout = wetLayout(view);
      expect(layout).not.toBeNull();
      const { cloud, beds, check, pond, wet } = layout!;
      const targets = [cloud, ...beds.map(({ patch }) => patch), ...wet.predictions, check];
      expect(targets).toHaveLength(6);
      const { w, h } = view;
      const frame = { x: w / 2, y: h / 2, w, h };
      const home = { x: 60, y: 107.5, w: 120, h: 215 };
      const guideHeight = view.upright ? 205 : 170;
      const guide = { x: 85, y: h - guideHeight / 2, w: 170, h: guideHeight };
      for (const box of [...targets, pond]) {
        expect(contains(frame, box)).toBe(true);
        expect(overlap(box, home)).toBe(false);
        expect(overlap(box, guide)).toBe(false);
      }
      for (const [i, box] of targets.entries()) {
        expect(Math.min(box.w, box.h)).toBeGreaterThanOrEqual(100);
        for (const other of [...targets.slice(i + 1), pond]) expect(overlap(box, other)).toBe(false);
      }
      expect(wet.rows.map((row) => row.length)).toEqual([4, 4]);
      expect(wet.rows[0].map(({ x }) => x)).toEqual(wet.rows[1].map(({ x }) => x));
      expect(wet.rows[0][0].y).toBeLessThan(wet.rows[1][0].y);
      const pondPictures = [...wet.badges, ...wet.rows.flat()];
      expect(wet.badges).toHaveLength(2);
      wet.badges.forEach((badge, i) => {
        expect(badge.y).toBe(wet.rows[i][0].y);
        expect(badge.x).toBeLessThan(wet.rows[i][0].x);
      });
      for (const [i, picture] of pondPictures.entries()) {
        expect(contains(pond, picture)).toBe(true);
        for (const other of pondPictures.slice(i + 1)) expect(overlap(picture, other)).toBe(false);
      }
    });
  }
  it.each([computeView(390, 625, undefined, true), computeView(625, 390)])(
    'keeps the beds and pond rows visible beneath a fallback caption',
    (view) => {
      const caption = captionPlace(view, true);
      expect(caption.mode).toBe('bubble');
      const { x, y, w, h } = caption.band!;
      const bubble = { x: x + w / 2, y: y + h / 2, w, h };
      const layout = wetLayout(view)!;
      for (const part of [...layout.beds.map(({ patch }) => patch), layout.pond]) {
        expect(overlap(bubble, part)).toBe(false);
      }
    },
  );

  it('returns null when the board cannot keep its targets full size', () => {
    expect(wetLayout({ w: 600, h: 400 })).toBeNull();
    expect(wetLayout({ w: 700, h: 1000, upright: true })).toBeNull();
  });
});

const board7 = (id: string) => BOARDS7.find((b) => b.id === id)!;
/** Per board, the result of each of the eight arrangements (stone first, top socket first): b both fail, l only light, s only storm, p pass. */
const RESULTS7: Record<string, string> = {
  A: 'bbllssps',
  B: 'bsbslplb',
  C: 'blspblss',
  D: 'bbblspsp',
  E: 'bbssblpp',
  F: 'bbblblsp',
};
const ANSWERS7: Record<string, string[]> = {
  A: ['soil/soil/stone'],
  B: ['soil/stone/soil'],
  C: ['stone/soil/soil'],
  D: ['soil/stone/soil', 'soil/soil/soil'],
  E: ['soil/soil/stone', 'soil/soil/soil'],
  F: ['soil/soil/soil'],
};
const ALL7 = arrangements(BOARDS7[0].light);
const round7 = (id: string, start: Surface[]) => twoRound(board7(id), start, 'frog');
const resultOf = (id: string, a: Surface[]) => {
  const r = checkCards(a, board7(id));
  return r.light.ok && r.storm.ok ? 'p' : r.light.ok ? 's' : r.storm.ok ? 'l' : 'b';
};

describe('level 7 two rain cards', () => {
  it('the school window runs 3 to 8 and the plan is named', () => {
    expect(LEVELS.school).toEqual({ min: 3, max: 8 });
    expect(planFor(7).level).toBe(7);
    expect(PLANS).toHaveLength(8);
  });

  for (const b of BOARDS7) {
    it(`board ${b.id}: every arrangement's result and the answers match the tables`, () => {
      expect(ALL7.map((a) => resultOf(b.id, a)).join('')).toBe(RESULTS7[b.id]);
      expect(solutions7(b).map(arrangementKey)).toEqual(ANSWERS7[b.id]);
    });
    it(`board ${b.id}: both rains matter`, () => {
      const r = RESULTS7[b.id];
      expect(r).toContain('l');
      expect(r).toContain('s');
      expect(r).not.toMatch(/^b+$/);
      // The shared answers are a proper subset of each card's own answers.
      for (const card of [b.light, b.storm]) {
        const own = solutions(card).map(arrangementKey);
        expect(own.length).toBeGreaterThan(solutions7(b).length);
        for (const a of solutions7(b)) expect(own).toContain(arrangementKey(a));
      }
    });
    it(`board ${b.id}: conserves drops and keeps even amounts`, () => {
      for (const a of ALL7) {
        const r = checkCards(a, b);
        for (const [c, res] of [
          [b.light, r.light],
          [b.storm, r.storm],
        ] as const) {
          const t = res.trial;
          expect(t.steps).toHaveLength(c.units);
          expect(t.stored.reduce((x, y) => x + y, 0) + t.pond).toBe(c.units);
          for (const v of [...t.stored, t.pond]) expect(v % 2).toBe(0);
        }
      }
    });
    it(`board ${b.id}: from any failing start at most three flips reach an answer`, () => {
      for (const a of ALL7) {
        if (resultOf(b.id, a) === 'p') continue;
        let cur = a.slice();
        let n = 0;
        for (let i = stepBed7(cur, b); i !== null; i = stepBed7(cur, b), n++)
          cur = cur.map((x, k) => (k === i ? flip(x) : x));
        expect(resultOf(b.id, cur)).toBe('p');
        expect(n).toBeLessThanOrEqual(b.id === 'D' || b.id === 'E' ? 2 : 3);
        expect(n).toBe(distance(a, nearest7(a, b)));
      }
    });
  }

  it('table values: board A, the authored start and its answer', () => {
    const a = board7('A');
    const r = checkCards(['soil', 'soil', 'soil'], a);
    expect([r.light.trial.stored, r.light.trial.pond]).toEqual([[2, 2, 0], 0]);
    expect([r.storm.trial.stored, r.storm.trial.pond]).toEqual([[2, 2, 2], 0]);
    const w = checkCards(['soil', 'soil', 'stone'], a);
    expect([w.storm.trial.stored, w.storm.trial.pond]).toEqual([[2, 2, 0], 2]);
    const f = checkCards(['stone', 'stone', 'stone'], board7('F'));
    expect(f.storm.trial.pond).toBe(6);
    expect(f.storm.pond).toBe(false);
  });

  it('pond rules', () => {
    for (const n of [0, 1, 2, 3, 4, 6]) {
      expect(pondOk('any', n)).toBe(true);
      expect(pondOk('reach', n)).toBe(n >= 1);
      expect(pondOk('hold', n)).toBe(n <= 2);
    }
    // Levels 4 and 5 keep their pond rule.
    for (const b of [board4(0), board4(1), ...BOARDS5]) expect(b.pond).toBeUndefined();
    expect(meets(runBoard(['soil', 'soil'], board4(1)), board4(1)).pond).toBe(false);
  });

  it('every card has its rain: four and six drops, the light shower never has a pond rule', () => {
    for (const b of BOARDS7) {
      expect([b.light.units, b.storm.units]).toEqual([4, 6]);
      expect(b.light.pond).toBe('any');
      expect(b.storm.pond === 'reach' || b.storm.pond === 'hold').toBe(true);
    }
  });

  describe('state', () => {
    const start = (id: string, a: Surface[]) => {
      const round = round7(id, a);
      return { round, s: twoFresh(round) };
    };

    it('each rain starts fresh whatever ran before', () => {
      const { round, s } = start('A', ['soil', 'soil', 'soil']);
      const first = checkCards(s.sockets, round.two!);
      let t: TwoState = previewRain(pickCard(previewRain(s, round), 'storm'), round);
      t = previewRain(pickCard(t, 'light'), round);
      t = previewRain(pickCard(t, 'storm'), round);
      expect(t.trials[0]).toEqual(first.light.trial);
      expect(t.trials[1]).toEqual(first.storm.trial);
    });

    it('picks and previews are free and never touch the beds; a flip clears previews and ticks', () => {
      const { round, s } = start('A', ['soil', 'soil', 'soil']);
      let t = previewRain(pickCard(s, 'storm'), round);
      expect(t.sockets).toEqual(s.sockets);
      expect([t.misses, t.hints]).toEqual([0, 0]);
      const c = checkTwo(t, round).state;
      expect(c.verdicts).not.toEqual([null, null]);
      t = flipTwo(c, 2, round);
      expect(t.trials).toEqual([null, null]);
      expect(t.verdicts).toEqual([null, null]);
      expect(t.active).toBe(c.active);
      expect(t.sockets[2]).toBe('stone');
    });

    it('a failed Check counts one miss, the same garden again counts none, the glow comes from the second miss', () => {
      const { round, s } = start('A', ['soil', 'soil', 'soil']);
      const one = checkTwo(s, round);
      expect(one.verdict).toMatchObject({ result: 'miss', card: 'storm', cause: 'pond', both: false });
      expect([one.state.misses, one.state.hints, one.state.glow]).toEqual([1, 0, null]);
      expect(one.state.active).toBe('storm');
      const again = checkTwo(one.state, round);
      expect(again.verdict.result).toBe('again');
      expect(again.state.misses).toBe(1);
      const other = flipTwo(one.state, 0, round); // stone / soil / soil: fails light
      const two = checkTwo(other, round);
      expect(two.state.misses).toBe(2);
      expect([two.state.hints, two.state.glowShown]).toEqual([1, true]);
      expect(two.state.glow).toBe(stepBed7(two.state.sockets, round.two!));
      const three = checkTwo(flipTwo(two.state, 1, round), round);
      expect(three.state.misses).toBe(3);
      expect(three.state.hints).toBe(1);
    });

    it('causes: light is judged first, then dry (uphill-most), pond, over', () => {
      const dry = checkTwo(
        start('A', ['stone', 'stone', 'stone']).s,
        round7('A', ['stone', 'stone', 'stone']),
      );
      expect(dry.verdict).toMatchObject({ card: 'light', cause: 'dry', need: 0, both: true });
      const f = round7('F', ['stone', 'stone', 'stone']);
      expect(checkTwo(twoFresh(f), f).verdict).toMatchObject({
        card: 'light',
        cause: 'dry',
        need: 0,
        both: true,
      });
      const f2 = round7('F', ['soil', 'soil', 'stone']);
      expect(checkTwo(twoFresh(f2), f2).verdict).toMatchObject({
        card: 'storm',
        cause: 'dry',
        need: 0,
        both: false,
      });
      const d = round7('D', ['soil', 'soil', 'stone']);
      expect(checkTwo(twoFresh(d), d).verdict.cause).toBe('dry');
      const d2 = round7('D', ['soil', 'stone', 'stone']);
      expect(checkTwo(twoFresh(d2), d2).verdict).toMatchObject({ card: 'storm', cause: 'dry' });
      // Pond got none (reach) and over (hold) on boards where the beds are all met.
      const bPond = round7('B', ['soil', 'soil', 'soil']);
      expect(checkTwo(twoFresh(bPond), bPond).verdict).toMatchObject({ card: 'light', cause: 'dry' });
      const aPond = round7('A', ['soil', 'soil', 'soil']);
      expect(checkTwo(twoFresh(aPond), aPond).verdict.cause).toBe('pond');
      const over = round7('D', ['stone', 'soil', 'soil']);
      expect(checkTwo(twoFresh(over), over).verdict).toMatchObject({ card: 'light', cause: 'dry' });
      const dOver = round7('D', ['soil', 'stone', 'stone']);
      expect(checkCards(dOver.start, dOver.two!).storm.trial.pond).toBe(4);
      const hold = checkCards(['soil', 'stone', 'stone'], board7('D'));
      expect(hold.light.ok).toBe(true);
      expect(hold.storm.pond).toBe(false);
      const ok = checkTwo(
        twoFresh(round7('A', ['soil', 'soil', 'stone'])),
        round7('A', ['soil', 'soil', 'stone']),
      );
      expect(ok.verdict).toMatchObject({ result: 'pass', cause: null });
      expect(ok.state.verdicts).toEqual([true, true]);
    });

    it('an over-the-pond storm is named over', () => {
      // Board E: the storm needs the top bed and at most two in the pond; stone / soil / stone sends four.
      const e = round7('E', ['stone', 'soil', 'stone']);
      const r = checkCards(e.start, e.two!);
      expect([r.light.ok, r.storm.beds, r.storm.pond]).toEqual([true, [false], false]);
      const f = round7('F', ['stone', 'soil', 'soil']);
      expect(checkCards(f.start, f.two!).storm.ok).toBe(true);
    });

    it('Show me flips toward an answer, then points at the Check; three worked steps always finish', () => {
      for (const b of BOARDS7)
        for (const a of ALL7) {
          const round = twoRound(b, a.slice(), 'frog');
          let s = twoFresh(round);
          let steps = 0;
          while (!checkTwo(s, round).state.passed && steps < 5) {
            const h = twoHint(s, round);
            s = h.state;
            steps++;
            if (h.hint.kind === 'check') break;
          }
          const done = checkTwo(s, round);
          expect(done.state.passed).toBe(true);
          expect(s.hints).toBeLessThanOrEqual(4);
        }
    });

    it('Start again returns to the starting garden and clears previews; counts keep', () => {
      const { round, s } = start('A', ['soil', 'soil', 'soil']);
      const m = checkTwo(s, round).state;
      const f = previewRain(flipTwo(m, 2, round), round);
      const r = twoRestart(f, round);
      expect(r.sockets).toEqual(['soil', 'soil', 'soil']);
      expect([r.trials, r.verdicts, r.misses]).toEqual([[null, null], [null, null], 1]);
    });

    it('the ghost finger finishes every seeded round with the card, bed and check steps', () => {
      for (const seed of SEEDS) {
        const round = makeRoute(new Rng(seed), false, 7);
        let s = twoFresh(round);
        for (let i = 0; i < 20 && !s.passed; i++) {
          const n = twoNext(s, round);
          if (n.kind === 'cloud') s = previewRain(s, round);
          else if (n.kind === 'card') s = pickCard(s, n.card);
          else if (n.kind === 'bed') s = flipTwo(s, n.bed, round);
          else s = checkTwo(s, round).state;
        }
        expect(s.passed, `seed ${seed}`).toBe(true);
        expect(s.misses).toBe(0);
      }
    });
  });

  describe('seeding', () => {
    it('the authored round is board A from soil / soil / soil', () => {
      const r = makeRoute(new Rng(1), true, 7);
      expect([r.level, r.two!.id, r.start]).toEqual([7, 'A', ['soil', 'soil', 'soil']]);
      expect(resultOf('A', r.start)).toBe('s');
    });
    it('seeded rounds cover all six boards, start failing and are solvable', () => {
      const seen = new Set<string>();
      for (const seed of SEEDS) {
        const r = makeRoute(new Rng(seed), false, 7);
        seen.add(r.two!.id);
        expect(resultOf(r.two!.id, r.start)).not.toBe('p');
        expect(solutions7(r.two!).length).toBeGreaterThan(0);
      }
      expect([...seen].sort()).toEqual(['A', 'B', 'C', 'D', 'E', 'F']);
    });
  });

  describe('narration and lines', () => {
    it('each rain ends on the pond clip that matches it and every line exists', () => {
      for (const b of BOARDS7)
        for (const a of ALL7) {
          const r = checkCards(a, b);
          for (const res of [r.light, r.storm]) {
            const lines = narration(res.trial, res === r.light ? b.light : b.storm);
            expect(lines[lines.length - 1]).toBe(`rain.pond.${res.trial.pond}`);
            for (const id of lines) expect(id in VOICE, id).toBe(true);
          }
        }
      for (const id of [
        'rain.instruct.7',
        'rain.card.light',
        'rain.card.storm',
        'rain.miss7.light',
        'rain.miss7.storm',
        'rain.miss7.both',
        'rain.cause.dry',
        'rain.cause.pond',
        'rain.cause.over',
        'rain.check.yes.cards',
      ])
        expect(id in VOICE, id).toBe(true);
    });
  });

  describe('layout', () => {
    const VIEWS = {
      landscape: computeView(1024, 768),
      portrait: computeView(768, 1024),
      phone: computeView(844, 390),
      notch: computeView(844, 390, { top: 0, right: 47, bottom: 21, left: 47 }),
      upright: computeView(390, 844, undefined, true),
      uprightTall: computeView(390, 900, undefined, true),
      uprightPad: computeView(768, 1024, undefined, true),
      uprightWide: computeView(430, 700, undefined, true),
    };
    const overlap = (a: Box, b: Box) =>
      Math.abs(a.x - b.x) * 2 < a.w + b.w && Math.abs(a.y - b.y) * 2 < a.h + b.h;
    const inside = (b: Box, v: { w: number; h: number }) =>
      b.x - b.w / 2 >= 0 && b.y - b.h / 2 >= 0 && b.x + b.w / 2 <= v.w && b.y + b.h / 2 <= v.h;
    const corner = (b: Box, x0: number, y0: number, x1: number, y1: number) =>
      b.x - b.w / 2 < x1 && b.x + b.w / 2 > x0 && b.y - b.h / 2 < y1 && b.y + b.h / 2 > y0;
    // Every mark set that appears: the layout is measured with all three sockets marked, so a sign exists per bed.
    const all = (b: TwoBoard) => ({
      ...b.light,
      marked: [0, 1, 2].map((socket) => ({ socket, marker: 'leaf' as const })),
    });
    for (const [name, v] of Object.entries(VIEWS))
      it(`${name}: two cards, three signs and the board clear of each other`, () => {
        const l = routeLayout(v, all(BOARDS7[0]))!;
        expect(l).not.toBeNull();
        expect(l.cards).toHaveLength(2);
        const targets = [l.cloud, ...l.beds.map((x) => x.patch), l.check, ...l.cards!];
        const clear = (x: Box) => {
          expect(corner(x, 0, 0, 120, 215)).toBe(false);
          expect(corner(x, 0, v.h - (v.upright ? 205 : 170), 170, v.h)).toBe(false);
          expect(inside(x, v)).toBe(true);
        };
        for (const t of targets) {
          expect(Math.min(t.w, t.h)).toBeGreaterThanOrEqual(100);
          clear(t);
        }
        for (let i = 0; i < targets.length; i++)
          for (let k = i + 1; k < targets.length; k++)
            expect(overlap(targets[i], targets[k]), `targets ${i}/${k}`).toBe(false);
        expect(l.cards![0].w).toBe(CARD);
        expect(l.bedSigns).toHaveLength(3);
        const signs = [...l.bedSigns, l.pondSign];
        for (const s of signs) {
          clear(s);
          for (const t of targets) expect(overlap(s, t), 'sign over a target').toBe(false);
          expect(overlap(s, l.pond)).toBe(false);
        }
        for (let i = 0; i < signs.length; i++)
          for (let k = i + 1; k < signs.length; k++) expect(overlap(signs[i], signs[k])).toBe(false);
      });
    it('other boards carry no cards, and a view that cannot hold the board returns null', () => {
      expect(routeLayout(VIEWS.landscape, BOARDS5[0])!.cards).toBeUndefined();
      expect(routeLayout({ w: 600, h: 400 }, all(BOARDS7[0]))).toBeNull();
    });
  });
});
