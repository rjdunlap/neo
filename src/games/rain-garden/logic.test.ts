import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import { computeView } from '../../engine/view';
import {
  CAPACITY, LEVELS, PLANS, SHOWER, SURFACES, canFinish, enough, flip, freshState, makeRound, nextAction, planFor, rain, rainLayout,
  restartState, runPair, runShower, setSurface, trial, type Box, type RoundState, type Surface,
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
        let stored = stored0, pond = 0;
        for (const s of r.steps) {
          if (s.to === 'patch') stored++; else pond++;
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
    for (const a of SURFACES) for (const b of SURFACES) {
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
    for (let i = 0; i < 3; i++) { s = rain(s).state; seen.push(enough(s)); }
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
    for (const level of [1, 2, 3]) for (const seed of SEEDS.slice(0, 10)) {
      expect(makeRound(level, new Rng(seed), false)).toEqual(makeRound(level, new Rng(seed), false));
    }
  });

  it('LEVELS and planFor', () => {
    expect(PLANS.map((p) => p.level)).toEqual([1, 2, 3]);
    expect(planFor(0).level).toBe(1);
    expect(planFor(2.4).level).toBe(2);
    expect(planFor(99).level).toBe(3);
    expect(LEVELS).toEqual({ toddler: { min: 1, max: 1 }, preschool: { min: 1, max: 2 }, prek: { min: 2, max: 3 }, school: { min: 3, max: 3 } });
    for (const r of Object.values(LEVELS)) for (let l = r!.min; l <= r!.max; l++) expect(planFor(l).level).toBe(l);
  });
});

describe('layout', () => {
  const VIEWS = { landscape: computeView(1024, 768), portrait: computeView(768, 1024), phone: computeView(844, 390), notch: computeView(844, 390, { top: 0, right: 47, bottom: 21, left: 47 }) };
  const overlap = (a: Box, b: Box) => Math.abs(a.x - b.x) * 2 < a.w + b.w && Math.abs(a.y - b.y) * 2 < a.h + b.h;
  const inside = (b: Box, v: { w: number; h: number }) => b.x - b.w / 2 >= 0 && b.y - b.h / 2 >= 0 && b.x + b.w / 2 <= v.w && b.y + b.h / 2 <= v.h;
  const corner = (b: Box, x0: number, y0: number, x1: number, y1: number) => b.x - b.w / 2 < x1 && b.x + b.w / 2 > x0 && b.y - b.h / 2 < y1 && b.y + b.h / 2 > y0;

  const cases: [number, boolean][] = [[1, false], [2, false], [3, false], [1, true]];
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
        for (const t of l.tiles) { expect(t.w).toBeGreaterThanOrEqual(120); expect(t.h).toBeGreaterThanOrEqual(120); }
        for (let i = 0; i < targets.length; i++) for (let k = i + 1; k < targets.length; k++) expect(overlap(targets[i], targets[k]), `targets ${i}/${k}`).toBe(false);
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
