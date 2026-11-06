import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import { computeView } from '../../engine/view';
import {
  accepts, acceptedPlans, apply, blankTable, BUBBLE, BUTTON, CARD, cardOrder, check, complete, corners, decisionNow, extensions,
  FRIENDS, gapBetween, give, hintFor, insideView, key, LEVEL_COUNT, nextStep, overlaps, PAGE, pass, planFor, previewOf, replay,
  roll, specFor, stamp, Tally, targets, variationFor, VARIATIONS, whyNot, workshopLayout,
  type Action, type Friend, type LevelSpec, type Plan, type PlanId, type Trace, type Why,
} from './logic';

const LEVELS = [1, 2, 3];
const OWNS: Friend[] = ['A', 'B'];
const SEEDS = Array.from({ length: 40 }, (_, i) => i * 7919 + 1);

const CANDIDATES: Action[] = [
  ...(['pad', 'roller'] as const).flatMap((t) => (['A', 'B', 'both'] as const).map((to) => give(t, to))),
  pass('pad'), pass('roller'),
  ...(['pageA', 'pageB', 'banner'] as const).flatMap((s) => [stamp(s), roll(s)]),
];

function cases() {
  const out: { level: number; own: Friend; spec: LevelSpec; plan: Plan }[] = [];
  for (const level of LEVELS) for (const own of OWNS) {
    const spec = specFor(level, own);
    for (const id of spec.plans) out.push({ level, own, spec, plan: planFor(id, spec.cells, own) });
  }
  return out;
}

/** Every reachable trace (BFS over accepted candidate actions). */
function reachable(plan: Plan): Trace[] {
  const seen = new Map<string, Trace>();
  let frontier: Trace[] = [[]];
  seen.set('', []);
  while (frontier.length) {
    const next: Trace[] = [];
    for (const t of frontier) for (const a of CANDIDATES) {
      if (!accepts(plan, t, a)) continue;
      const n = [...t, a];
      const k = n.map(key).join('|');
      if (!seen.has(k)) { seen.set(k, n); next.push(n); }
    }
    frontier = next;
  }
  return [...seen.values()];
}

const sig = (t: Trace) => t.map(key).join('|');

describe('allowed traces', () => {
  it('every accepted card ends with both requests met, for both own friends', () => {
    for (const { spec, own, plan } of cases()) {
      if (!acceptedPlans(spec, own).includes(plan.id)) continue;
      expect(plan.traces.length).toBeGreaterThan(0);
      for (const tr of plan.traces) {
        const table = replay(tr);
        for (const f of FRIENDS) expect(check(table, spec.requests[f], f, spec.cells), `${plan.id} ${own} ${sig(tr)}`).toBe(true);
      }
    }
  });

  it('level 1 has exactly the two orders', () => {
    const plan = planFor('stampPass', 0);
    expect(plan.traces.map(sig).sort()).toEqual([
      'give:pad:A|stamp:pageA|pass:pad|stamp:pageB',
      'give:pad:B|stamp:pageB|pass:pad|stamp:pageA',
    ]);
    expect(acceptedPlans(specFor(1), 'B')).toEqual(['stampPass']);
  });

  it('level 2: turns and roll make banners of four with different traces', () => {
    const spec = specFor(2);
    expect(spec.cells).toBe(4);
    const turns = planFor('turns', spec.cells);
    const rolled = planFor('roll', spec.cells);
    expect(turns.traces).toHaveLength(2);
    expect(turns.traces[0]).toHaveLength(8);
    expect(rolled.traces).toHaveLength(1);
    expect(rolled.traces[0]).toHaveLength(5);
    for (const p of [turns, rolled]) for (const tr of p.traces) expect(replay(tr).marks.banner).toHaveLength(4);
    const a = rolled.traces.map(sig);
    for (const tr of turns.traces) expect(a).not.toContain(sig(tr));
    expect(acceptedPlans(spec, 'B').sort()).toEqual(['roll', 'turns']);
  });

  it('level 3 side by side has 12 traces covering assignments, orders and interleavings', () => {
    for (const own of OWNS) {
      const spec = specFor(3, own);
      const side = planFor('side', spec.cells, own);
      expect(side.traces).toHaveLength(12);
      expect(new Set(side.traces.map(sig)).size).toBe(12);
      for (const [tA, tB] of [['pad', 'roller'], ['roller', 'pad']] as const) {
        const withAssign = side.traces.filter((t) => sig(t).includes(`give:${tA}:A`) && sig(t).includes(`give:${tB}:B`));
        expect(withAssign).toHaveLength(6);
        for (const t of withAssign) {
          const idx = (k: string) => t.findIndex((a) => key(a) === k);
          const mA = replay(t).marks.pageA[0];
          expect(mA.tool).toBe(tA);
          expect(idx(`give:${tA}:A`)).toBeLessThan(t.findIndex((a) => a.k !== 'give' && (a as { surface: string }).surface === 'pageA'));
        }
        // give orders: A's give first and B's give first both occur
        expect(withAssign.some((t) => t[0].k === 'give' && (t[0] as { to: string }).to === 'A')).toBe(true);
        expect(withAssign.some((t) => t[0].k === 'give' && (t[0] as { to: string }).to === 'B')).toBe(true);
        // an interleaving where both gives precede both marks and one where they alternate
        expect(withAssign.some((t) => t[1].k === 'give')).toBe(true);
        expect(withAssign.some((t) => t[1].k !== 'give')).toBe(true);
      }
    }
  });

  it('banner-and-page plans accept either banner starter', () => {
    for (const own of OWNS) {
      const spec = specFor(3, own);
      for (const id of ['bannerThenPage', 'pageThenBanner'] as PlanId[]) {
        const plan = planFor(id, spec.cells, own);
        expect(plan.traces.length).toBeGreaterThanOrEqual(2);
        if (id === 'bannerThenPage') {
          const starters = plan.traces.map((t) => (t[0] as { to: Friend }).to).sort();
          expect(starters).toEqual(['A', 'B']);
        } else {
          // the banner may be started by either friend after the own page is stamped
          const bannerStarters = new Set(plan.traces.map((t) => replay(t).marks.banner[0].by));
          expect(bannerStarters).toEqual(new Set(['A', 'B']));
        }
        expect(acceptedPlans(spec, own)).toContain(id);
        expect(complete(plan, plan.traces[0])).toBe(true);
      }
    }
  });
});

describe('the draft that leaves a request out', () => {
  it('justBanner leaves the own-page request unmet and is the only card excluded at level 3', () => {
    for (const own of OWNS) {
      const spec = specFor(3, own);
      const p = previewOf(planFor('justBanner', spec.cells, own), spec);
      expect(p.ok).toBe(false);
      expect(p.met[own]).toBe(false);
      expect(p.met[own === 'A' ? 'B' : 'A']).toBe(true);
      expect([...spec.plans].filter((id) => !acceptedPlans(spec, own).includes(id))).toEqual(['justBanner']);
    }
  });

  it('every accepted level 3 trace has the own friend page marked only by that friend', () => {
    for (const own of OWNS) {
      const spec = specFor(3, own);
      for (const id of acceptedPlans(spec, own)) for (const tr of planFor(id, spec.cells, own).traces) {
        const marks = replay(tr).marks[own === 'A' ? 'pageA' : 'pageB'];
        expect(marks.length).toBe(1);
        expect(marks.every((m) => m.by === own)).toBe(true);
      }
    }
  });

  it('no accepted card at any level leaves a request unmet', () => {
    for (const level of LEVELS) for (const own of OWNS) {
      const spec = specFor(level, own);
      for (const id of acceptedPlans(spec, own)) expect(previewOf(planFor(id, spec.cells, own), spec).ok).toBe(true);
    }
  });
});

describe('refusals', () => {
  it('every candidate in every reachable trace is accepted, or refused with a reason, leaving the table alone', () => {
    const reasons: Why[] = ['full', 'notInPlan', 'waiting', 'turns', 'myStep', 'chooseFirst', 'later'];
    for (const { plan, spec } of cases()) {
      for (const tr of reachable(plan)) {
        const before = replay(tr);
        const snapshot = JSON.stringify(before);
        for (const a of CANDIDATES) {
          if (accepts(plan, tr, a)) { expect(extensions(plan, [...tr, a]).length).toBeGreaterThan(0); continue; }
          expect(reasons).toContain(whyNot(plan, tr, a, spec.cells));
          expect(JSON.stringify(replay(tr))).toBe(snapshot);
        }
      }
    }
  });

  it('apply never mutates its input table', () => {
    for (const { plan } of cases()) for (const tr of reachable(plan)) {
      const t = replay(tr);
      const snap = JSON.stringify(t);
      for (const a of CANDIDATES) { apply(t, a); expect(JSON.stringify(t)).toBe(snap); }
    }
    const blank = blankTable();
    apply(blank, stamp('banner'));
    expect(blank).toEqual(blankTable());
  });

  it('level 1 reasons', () => {
    const plan = planFor('stampPass', 0);
    expect(whyNot(plan, [give('pad', 'A')], stamp('pageB'), 0)).toBe('waiting');
    expect(whyNot(plan, [give('pad', 'A')], pass(), 0)).toBe('myStep');
    expect(whyNot(plan, [give('pad', 'A'), stamp('pageA')], stamp('pageA'), 0)).toBe('full');
    expect(whyNot(plan, [], pass(), 0)).toBe('chooseFirst');
    expect(whyNot(plan, [give('pad', 'A')], give('pad', 'B'), 0)).toBe('later');
    expect(whyNot(plan, [give('pad', 'A')], roll('pageA'), 0)).toBe('notInPlan');
  });

  it('level 2 turns reasons', () => {
    const plan = planFor('turns', 4);
    expect(whyNot(plan, [give('pad', 'A'), stamp('banner')], stamp('banner'), 4)).toBe('turns');
    expect(whyNot(plan, [give('pad', 'A')], stamp('pageA'), 4)).toBe('notInPlan');
    expect(whyNot(plan, [give('pad', 'A')], roll('banner'), 4)).toBe('notInPlan');
    expect(whyNot(plan, [], stamp('banner'), 4)).toBe('waiting');
    expect(whyNot(plan, [], pass(), 4)).toBe('chooseFirst');
    expect(whyNot(plan, [give('pad', 'A')], pass(), 4)).toBe('myStep');
    // full takes precedence over everything else
    const done = planFor('turns', 4).traces[0];
    expect(whyNot(plan, done, stamp('banner'), 4)).toBe('full');
  });

  it('level 2 roll refuses stamping and a second give', () => {
    const plan = planFor('roll', 4);
    expect(whyNot(plan, [give('roller', 'both')], stamp('banner'), 4)).toBe('notInPlan');
    expect(whyNot(plan, [give('roller', 'both')], give('roller', 'both'), 4)).toBe('later');
  });
});

describe('undo', () => {
  it('replaying the shortened trace equals the table before the last action, for every action kind', () => {
    const kinds = new Set<string>();
    for (const { plan } of cases()) for (const tr of plan.traces) {
      let t = blankTable();
      const states = [t];
      for (const a of tr) { t = apply(t, a); states.push(t); kinds.add(a.k); }
      for (let i = 1; i <= tr.length; i++) expect(replay(tr.slice(0, i - 1))).toEqual(states[i - 1]);
    }
    expect([...kinds].sort()).toEqual(['give', 'pass', 'roll', 'stamp']);
  });
});

describe('hints', () => {
  it('following nextStep from every reachable trace completes within the shortest remaining length', () => {
    for (const { plan } of cases()) for (const start of reachable(plan)) {
      const remaining = Math.min(...extensions(plan, start).map((t) => t.length - start.length));
      let tr: Trace = start;
      let steps = 0;
      while (!complete(plan, tr)) {
        const a = nextStep(plan, tr);
        expect(a).not.toBeNull();
        expect(accepts(plan, tr, a!)).toBe(true);
        tr = [...tr, a!];
        steps++;
        expect(steps).toBeLessThanOrEqual(remaining);
      }
      expect(steps).toBe(remaining);
      expect(nextStep(plan, tr)).toBeNull();
    }
  });

  it('hintFor in the plan phase returns an accepted card', () => {
    for (const level of [2, 3]) for (const own of OWNS) {
      const spec = specFor(level, own);
      const ok = acceptedPlans(spec, own);
      for (const sel of [null, ...spec.plans]) {
        const h = hintFor(spec, own, 'plan', sel, null, []);
        expect(h).toEqual({ card: sel && ok.includes(sel) ? sel : ok[0] });
        expect(ok).toContain((h as { card: PlanId }).card);
      }
    }
  });

  it('hintFor in the make phase is the next step, and null when complete', () => {
    const spec = specFor(2);
    const plan = planFor('roll', spec.cells);
    expect(hintFor(spec, 'B', 'make', 'roll', plan, [])).toEqual({ action: give('roller', 'both') });
    expect(hintFor(spec, 'B', 'make', 'roll', plan, plan.traces[0])).toBeNull();
  });
});

describe('accounting', () => {
  it('misses are always 0', () => {
    const t = new Tally();
    t.help('plan'); t.help('make'); t.unmetPreview(); t.unmetPreview();
    expect(t.misses).toBe(0);
  });

  it('each decision counts at most one hint; plan plus make is 2', () => {
    const t = new Tally();
    expect(t.help('plan')).toBe(true);
    expect(t.help('plan')).toBe(false);
    expect(t.hints).toBe(1);
    expect(t.help('make')).toBe(true);
    expect(t.help('make')).toBe(false);
    expect(t.hints).toBe(2);
  });

  it('decisionNow: level 1 plan is who gets the pad first', () => {
    expect(decisionNow(1, 'make', [])).toBe('plan');
    expect(decisionNow(1, 'make', [give('pad', 'A')])).toBe('make');
    expect(decisionNow(2, 'plan', [])).toBe('plan');
    expect(decisionNow(3, 'plan', [])).toBe('plan');
    expect(decisionNow(2, 'make', [])).toBe('make');
    expect(decisionNow(3, 'make', [])).toBe('make');
  });

  it('the pet doing both roles costs 2 hints at every level', () => {
    for (const level of LEVELS) {
      const t = new Tally();
      t.help(decisionNow(level, 'plan', []));
      t.help(decisionNow(level, 'make', level === 1 ? [] : [give('pad', 'A')]));
      if (level === 1) t.help(decisionNow(1, 'make', [give('pad', 'A')]));
      expect(t.hints).toBe(2);
    }
  });

  it('unmetPreview is false then true and never changes hints', () => {
    const t = new Tally();
    expect(t.unmetPreview()).toBe(false);
    expect(t.unmetPreview()).toBe(true);
    expect(t.unmetPreview()).toBe(true);
    expect(t.hints).toBe(0);
  });
});

describe('variations', () => {
  it('each level has at least three variations with two different critters, passing the trace rules', () => {
    for (const level of LEVELS) {
      const list = VARIATIONS[level];
      expect(list.length).toBeGreaterThanOrEqual(3);
      for (const v of list) {
        expect(v.cast[0]).not.toBe(v.cast[1]);
        const spec = specFor(level, v.own);
        const ok = acceptedPlans(spec, v.own);
        expect(ok.length).toBeGreaterThan(0);
        for (const id of ok) for (const tr of planFor(id, spec.cells, v.own).traces) {
          for (const f of FRIENDS) expect(check(replay(tr), spec.requests[f], f, spec.cells)).toBe(true);
        }
        if (level === 3) {
          expect(previewOf(planFor('justBanner', spec.cells, v.own), spec).ok).toBe(false);
          expect(ok).not.toContain('justBanner');
        }
      }
    }
    expect(LEVEL_COUNT).toBe(3);
  });

  it('variationFor: first is index 0, seeded stays within the list and is deterministic', () => {
    for (const level of LEVELS) {
      expect(variationFor(level, new Rng(5), true)).toBe(VARIATIONS[level][0]);
      for (const s of SEEDS) {
        const v = variationFor(level, new Rng(s), false);
        expect(VARIATIONS[level]).toContain(v);
        expect(variationFor(level, new Rng(s), false)).toBe(v);
      }
    }
  });

  it('cardOrder keeps all four cards at level 3, is deterministic, and keeps order elsewhere', () => {
    const spec = specFor(3);
    let differs = false;
    for (const s of SEEDS) {
      const o = cardOrder(spec, new Rng(s), false);
      expect([...o].sort()).toEqual([...spec.plans].sort());
      expect(cardOrder(spec, new Rng(s), false)).toEqual(o);
      if (o.join() !== spec.plans.join()) differs = true;
    }
    expect(differs).toBe(true);
    expect(cardOrder(spec, new Rng(3), true)).toEqual(spec.plans);
    expect(cardOrder(specFor(2), new Rng(3), false)).toEqual(specFor(2).plans);
  });
});

describe('layout', () => {
  const views = [
    ['landscape', computeView(1024, 768)],
    ['portrait', computeView(768, 1024)],
    ['phone', computeView(844, 390)],
    ['phone with insets', computeView(844, 390, { top: 0, right: 47, bottom: 21, left: 47 })],
  ] as const;

  const asks: { name: string; ask: Parameters<typeof workshopLayout>[1]; make: boolean }[] = [
    { name: 'plan 2 cards', ask: { level: 2, phase: 'plan', cards: 2 }, make: false },
    { name: 'plan 4 cards', ask: { level: 3, phase: 'plan', cards: 4 }, make: false },
  ];
  for (const { level, plan } of cases()) {
    asks.push({ name: `make L${level} ${plan.id}`, ask: { level, phase: 'make', surfaces: plan.surfaces, tools: plan.tools.length }, make: true });
  }

  for (const [vn, v] of views) {
    it(`${vn}: every ask is non-null with large, separated, in-view targets`, () => {
      const cs = corners(v);
      for (const { name, ask, make } of asks) {
        const l = workshopLayout(v, ask);
        expect(l, `${vn} ${name}`).not.toBeNull();
        for (const done of make ? [false, true] : [false]) {
          const ts = targets(l!, done);
          ts.forEach((t, i) => {
            const tag = `${vn} ${name} done=${done} #${i}`;
            expect(t.w, tag).toBeGreaterThanOrEqual(100);
            expect(t.h, tag).toBeGreaterThanOrEqual(100);
            expect(insideView(t, v), tag).toBe(true);
            for (const c of cs) expect(overlaps(t, c), `${tag} corner`).toBe(false);
            for (let j = i + 1; j < ts.length; j++) expect(gapBetween(t, ts[j]), `${tag} vs #${j}`).toBeGreaterThanOrEqual(30);
          });
        }
        for (const c of l!.cards) { expect(c.w).toBeGreaterThanOrEqual(280); expect(c.h).toBeGreaterThanOrEqual(180); }
        for (const b of [l!.bubbles.A, l!.bubbles.B]) { expect(b.w).toBeGreaterThanOrEqual(260); expect(b.h).toBeGreaterThanOrEqual(150); }
        for (const b of l!.buttons) { expect(b.w).toBeGreaterThanOrEqual(110); expect(b.h).toBeGreaterThanOrEqual(110); }
        if (l!.pages) for (const f of FRIENDS) { expect(l!.pages[f].w).toBeGreaterThanOrEqual(200); expect(l!.pages[f].h).toBeGreaterThanOrEqual(200); }
      }
    });
  }

  it('constants match the definition', () => {
    expect(CARD.w).toBeGreaterThanOrEqual(280);
    expect(BUBBLE.w).toBeGreaterThanOrEqual(260);
    expect(BUTTON.w).toBeGreaterThanOrEqual(110);
    expect(PAGE).toBeGreaterThanOrEqual(200);
  });
});
