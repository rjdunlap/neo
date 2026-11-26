import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import { computeView } from '../../engine/view';
import { VOICE } from './voice';
import { FRIENDS, runShower, type Box } from './logic';
import {
  PATCH_CAPACITY,
  RULES,
  SIZES,
  canCheck,
  evidenceOf,
  fits,
  judge,
  makeMystery,
  mysteryCanFinish,
  mysteryCheck,
  mysteryFresh,
  mysteryHint,
  mysteryLayout,
  mysteryNext,
  mysteryRestart,
  mysteryRun,
  runPlan,
  setSlot,
  toggleMark,
  type MysteryState,
  type Rule,
  type Size,
} from './mystery';

const PLANS: Size[][] = [[2], [4], [2, 2], [2, 4], [4, 2], [4, 4]];
const round = (truth: Rule, start: Size[] = [4]) => ({ truth, friend: 'frog' as const, start });
const fresh = (truth: Rule, start: Size[] = [4]) => mysteryFresh(round(truth, start));
const withPlan = (s: MysteryState, plan: Size[]): MysteryState => ({ ...s, plan });
const subsets = (): Rule[][] => [['reset'], ['keep'], ['reset', 'keep']];

describe('level 8 outcome table', () => {
  const expected: Record<string, [number[], number[]]> = {
    '2': [[0], [0]],
    '4': [[2], [2]],
    '2,2': [
      [0, 0],
      [0, 2],
    ],
    '2,4': [
      [0, 2],
      [0, 4],
    ],
    '4,2': [
      [2, 0],
      [2, 2],
    ],
    '4,4': [
      [2, 2],
      [2, 4],
    ],
  };
  it('gives the table: pond per rain, reset then keep', () => {
    for (const plan of PLANS) {
      const [reset, keep] = expected[plan.join(',')];
      expect(runPlan('reset', plan).rains.map((r) => r.pond)).toEqual(reset);
      expect(runPlan('keep', plan).rains.map((r) => r.pond)).toEqual(keep);
    }
  });
  it('conserves water, keeps every amount even, and uses each unit once', () => {
    for (const rule of RULES)
      for (const plan of PLANS) {
        let stored = 0;
        for (const r of runPlan(rule, plan).rains) {
          const start = rule === 'reset' ? 0 : stored;
          expect(r.units + start).toBe(r.kept + r.pond);
          expect(r.kept).toBeLessThanOrEqual(PATCH_CAPACITY);
          expect(r.kept % 2).toBe(0);
          expect(r.pond % 2).toBe(0);
          expect(r.steps.map((x) => x.unit)).toEqual([...Array(r.units).keys()]);
          stored = r.kept;
        }
      }
  });
  it('matches runShower for the first rain on a fresh patch', () => {
    for (const size of SIZES)
      expect(runPlan('keep', [size]).rains[0].pond).toBe(
        runShower({ surface: 'soil', stored: 0 }, { water: 0 }, size).pond.water,
      );
  });
  it('only the second row can decide, and it does in every two-rain plan', () => {
    for (const plan of PLANS) {
      const [a, b] = [runPlan('reset', plan), runPlan('keep', plan)];
      expect(a.rains[0].pond).toBe(b.rains[0].pond);
      if (plan.length === 1) expect(a.rains.map((r) => r.pond)).toEqual(b.rains.map((r) => r.pond));
      else expect(a.rains[1].pond).not.toBe(b.rains[1].pond);
    }
  });
});

describe('level 8 fits and judge', () => {
  it('fits is both for one rain and exactly the truth for two', () => {
    for (const truth of RULES)
      for (const plan of PLANS) {
        const f = fits(evidenceOf(runPlan(truth, plan)));
        expect(f).toContain(truth);
        expect(f.length).toBe(plan.length === 1 ? 2 : 1);
      }
  });
  it('a deciding test exists for both truths', () => {
    for (const truth of RULES) {
      const deciding = PLANS.filter(
        (p) => p.length === 2 && fits(evidenceOf(runPlan(truth, p))).length === 1,
      );
      expect(deciding).toHaveLength(4);
    }
  });
  it('judge names ok exactly when marks equal fits, and one cause otherwise', () => {
    for (const truth of RULES)
      for (const plan of PLANS)
        for (const marks of subsets()) {
          const e = evidenceOf(runPlan(truth, plan));
          const f = fits(e);
          const j = judge(marks, e);
          const same = marks.length === f.length && marks.every((m) => f.includes(m));
          expect(j === 'ok').toBe(same);
          if (j === 'over') expect(plan.length === 1 && marks.length === 1).toBe(true);
          if (j === 'under') expect(plan.length === 2 && marks.length === 2).toBe(true);
          if (j === 'wrong') expect(marks.length === 1 && !f.includes(marks[0])).toBe(true);
        }
  });
});

describe('level 8 round state', () => {
  it('the empty slot compacts and cycles empty, small, big, empty', () => {
    let s = fresh('keep', []);
    expect(s.plan).toEqual([]);
    s = setSlot(s, 0);
    expect(s.plan).toEqual([2]);
    s = setSlot(s, 0);
    expect(s.plan).toEqual([4]);
    s = setSlot(s, 1);
    expect(s.plan).toEqual([4, 2]);
    s = setSlot(s, 0); // big -> empty: slot 2 moves up
    expect(s.plan).toEqual([2]);
    s = setSlot(fresh('keep', []), 1); // a filled second slot with an empty first compacts
    expect(s.plan).toEqual([2]);
  });
  it('run evidence is fresh whatever ran before, and slots never change evidence, marks or truth', () => {
    let s = mysteryRun(fresh('keep'));
    const first = s.evidence;
    s = toggleMark(setSlot(s, 1), 'reset');
    expect(s.evidence).toEqual(first);
    expect(s.marks).toEqual(['reset']);
    expect(s.truth).toBe('keep');
    const again = mysteryRun(withPlan(s, [4]));
    expect(again.evidence).toEqual(first);
    expect(again.runs).toBe(2);
    expect(again.marks).toEqual(['reset']);
  });
  it('an empty plan does not run', () => {
    const s = fresh('keep', []);
    expect(mysteryRun(s)).toBe(s);
  });
  it('marks are free before any run, and a check needs a run and a mark', () => {
    let s = toggleMark(fresh('keep'), 'keep');
    expect(s.marks).toEqual(['keep']);
    expect(canCheck(s)).toBe(false);
    s = mysteryRun(s);
    expect(canCheck(s)).toBe(true);
    expect(canCheck(toggleMark(s, 'keep'))).toBe(false);
    expect(s.misses).toBe(0);
  });
  it('an ok check on one rain is supported and never finishes; on two rains it reveals', () => {
    let s = mysteryRun(fresh('keep', [2]));
    s = toggleMark(toggleMark(s, 'reset'), 'keep');
    const one = mysteryCheck(s);
    expect(one.verdict).toEqual({ judgement: 'ok', reveal: false });
    expect(one.state.misses).toBe(0);
    expect(mysteryCanFinish(one.state)).toBe(false);
    let t = mysteryRun(withPlan(one.state, [4, 4]));
    t = { ...t, marks: ['keep'] };
    const two = mysteryCheck(t);
    expect(two.verdict).toEqual({ judgement: 'ok', reveal: true });
    expect(mysteryCanFinish(two.state)).toBe(true);
  });
  it('a failed check counts one miss, the same marks on the same run none, ghosts from the second miss and one hint once', () => {
    let s = toggleMark(mysteryRun(fresh('keep', [4])), 'reset');
    let r = mysteryCheck(s); // over: one card lit, both fit
    expect(r.verdict.judgement).toBe('over');
    expect(r.state.misses).toBe(1);
    expect(r.state.ghosts).toBe(false);
    r = mysteryCheck(r.state);
    expect(r.state.misses).toBe(1);
    s = toggleMark(toggleMark(r.state, 'reset'), 'keep');
    s = toggleMark(s, 'reset'); // reset again: marks are both?
    r = mysteryCheck({ ...s, marks: ['keep', 'reset'] });
    expect(r.verdict.judgement).toBe('ok'); // both fit a one-rain run
    // second distinct miss on the same run: only the other single card
    r = mysteryCheck({ ...r.state, marks: ['keep'] });
    expect(r.state.misses).toBe(2);
    expect(r.state.ghosts).toBe(true);
    expect(r.state.hints).toBe(1);
    const run2 = mysteryRun(withPlan(r.state, [4, 4]));
    expect(run2.ghosts).toBe(false);
    const wrong = mysteryCheck({ ...run2, marks: ['reset'] });
    expect(wrong.verdict.judgement).toBe('wrong');
    expect(wrong.state.misses).toBe(3);
    expect(wrong.state.ghosts).toBe(true);
    expect(wrong.state.hints).toBe(1);
    const under = mysteryCheck({ ...run2, marks: ['reset', 'keep'] });
    expect(under.verdict.judgement).toBe('under');
  });
  it('a bounded search ends with misses equal to the distinct failed checks', () => {
    type Act = 'run1' | 'run2' | 'reset' | 'keep' | 'check';
    const acts: Act[] = ['run1', 'run2', 'reset', 'keep', 'check'];
    const apply = (s: MysteryState, a: Act): MysteryState =>
      a === 'run1'
        ? mysteryRun(withPlan(s, [4]))
        : a === 'run2'
          ? mysteryRun(withPlan(s, [4, 4]))
          : a === 'check'
            ? mysteryCheck(s).state
            : toggleMark(s, a);
    const walk = (s: MysteryState, depth: number, keys: Set<string>) => {
      if (s.revealed) return;
      if (depth === 0) return;
      for (const a of acts) {
        const k = new Set(keys);
        if (a === 'check' && canCheck(s)) {
          const { verdict } = mysteryCheck(s);
          if (verdict.judgement !== 'ok') k.add(`${s.runs}:${s.marks.join('+')}`);
        }
        const n = apply(s, a);
        expect(n.misses).toBe(k.size);
        walk(n, depth - 1, k);
      }
    };
    walk(fresh('keep'), 5, new Set());
    walk(fresh('reset', [2]), 5, new Set());
  });
  it('from any state at most four Show me steps finish', () => {
    for (const truth of RULES)
      for (const start of [[2], [4]] as Size[][])
        for (const marks of subsets().concat([[]])) {
          for (const ran of [false, true]) {
            let s = withPlan({ ...fresh(truth, start), marks }, start);
            if (ran) s = mysteryRun(s);
            let steps = 0;
            while (!s.revealed && steps < 6) {
              const { state, hint } = mysteryHint(s);
              s = state;
              if (hint === 'test') s = mysteryRun(s);
              else if (hint === 'check') s = mysteryCheck(s).state;
              steps++;
            }
            expect(s.revealed).toBe(true);
            expect(steps).toBeLessThanOrEqual(3);
            expect(mysteryHint(s).hint).toBe('leaf');
          }
        }
  });
  it('the bot never misses and finishes on the leaf', () => {
    for (const truth of RULES)
      for (const start of [[2], [4]] as Size[][]) {
        let s = fresh(truth, start);
        for (let i = 0; i < 20 && !s.revealed; i++) {
          const n = mysteryNext(s);
          if (n.kind === 'cloud') s = mysteryRun(s);
          else if (n.kind === 'slot') s = setSlot(s, n.i);
          else if (n.kind === 'card') s = toggleMark(s, n.rule);
          else if (n.kind === 'check') s = mysteryCheck(s).state;
        }
        expect(s.revealed).toBe(true);
        expect(s.misses).toBe(0);
        expect(s.hints).toBe(0);
        expect(mysteryNext(s).kind).toBe('leaf');
      }
  });
  it('start again keeps the truth, misses, hints and runs', () => {
    let s = toggleMark(mysteryRun(fresh('keep')), 'reset');
    s = mysteryCheck(s).state;
    const r = mysteryRestart(s, round('keep'));
    expect(r.truth).toBe('keep');
    expect(r.misses).toBe(1);
    expect(r.runs).toBe(1);
    expect(r.evidence).toBeNull();
    expect(r.marks).toEqual([]);
    expect(r.plan).toEqual([4]);
  });
});

describe('level 8 rounds and lines', () => {
  it('the authored round is keep, the frog, a big rain; seeded rounds are one-rain starts', () => {
    expect(makeMystery(new Rng(1), true)).toEqual({ truth: 'keep', friend: 'frog', start: [4] });
    const truths = new Set<Rule>();
    for (let seed = 1; seed < 60; seed++) {
      const r = makeMystery(new Rng(seed), false);
      truths.add(r.truth);
      expect(FRIENDS).toContain(r.friend);
      expect(r.start).toHaveLength(1);
      expect(SIZES).toContain(r.start[0]);
    }
    expect(truths.size).toBe(2);
  });
  it('every line the scene says exists, and each rain narrates one pond clip', () => {
    const ids = [
      'rainmyst.instruct',
      'rainmyst.reset',
      'rainmyst.keep',
      'rainmyst.small',
      'rainmyst.big',
      'rainmyst.pick',
      'rainmyst.mark',
      'rainmyst.both.ok',
      'rainmyst.over',
      'rainmyst.under',
      'rainmyst.wrong',
      'rainmyst.reveal.reset',
      'rainmyst.reveal.keep',
      'rainmyst.hint.test',
      'rain.hint.check',
      'rain.done',
      'rain.again',
      'rain.pond.0',
      'rain.pond.2',
      'rain.pond.4',
    ];
    for (const id of ids) expect(Object.keys(VOICE), id).toContain(id);
    for (const rule of RULES)
      for (const plan of PLANS)
        for (const r of runPlan(rule, plan).rains)
          expect(Object.keys(VOICE)).toContain(`rain.pond.${r.pond}`);
  });
});

describe('level 8 layout', () => {
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
  const contains = (o: Box, i: Box) =>
    Math.abs(o.x - i.x) * 2 + i.w <= o.w && Math.abs(o.y - i.y) * 2 + i.h <= o.h;
  for (const [name, view] of Object.entries(views)) {
    it(`${name}: full-size targets clear of each other, Home, the guide and the pond`, () => {
      const l = mysteryLayout(view)!;
      expect(l).not.toBeNull();
      const targets = [l.cloud, ...l.slots, ...l.cards, l.check];
      const frame = { x: view.w / 2, y: view.h / 2, w: view.w, h: view.h };
      const home = { x: 60, y: 107.5, w: 120, h: 215 };
      const gh = view.upright ? 205 : 170;
      const guide = { x: 85, y: view.h - gh / 2, w: 170, h: gh };
      for (const [i, b] of [...targets, l.patch, l.pond].entries()) {
        expect(contains(frame, b)).toBe(true);
        expect(overlap(b, home)).toBe(false);
        expect(overlap(b, guide)).toBe(false);
        for (const o of [...targets, l.patch, l.pond].slice(i + 1)) expect(overlap(b, o), `${i}`).toBe(false);
      }
      for (const b of targets) expect(Math.min(b.w, b.h)).toBeGreaterThanOrEqual(100);
      const pics = [...l.badges, ...l.rows.flat()];
      for (const [i, p] of pics.entries()) {
        expect(contains(l.pond, p)).toBe(true);
        for (const o of pics.slice(i + 1)) expect(overlap(p, o)).toBe(false);
      }
      // The arrow runs from the patch to the tray without crossing a card or slot.
      const { x1, y1, x2, y2 } = l.arrow;
      for (const b of [...l.cards, ...l.slots]) {
        for (let t = 0; t <= 1; t += 0.05) {
          const p = { x: x1 + (x2 - x1) * t, y: y1 + (y2 - y1) * t, w: 1, h: 1 };
          expect(overlap(p, b)).toBe(false);
        }
      }
    });
  }
  it('returns null when the view cannot hold the layout', () => {
    expect(mysteryLayout({ w: 600, h: 400 })).toBeNull();
    expect(mysteryLayout({ w: 700, h: 1000, upright: true })).toBeNull();
  });
});
