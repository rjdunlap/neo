import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import { computeView } from '../../engine/view';
import {
  BATCH,
  COLS,
  GRAINS,
  LAP_POURS,
  PLANS,
  RIM,
  answer,
  apply,
  bayChange,
  bayOf,
  blow,
  botStep,
  breezeHint,
  gainedBays,
  liftedColumns,
  puff,
  describeLandscape,
  emptyPail,
  hintAction,
  planFor,
  pour,
  restart,
  sandLayout,
  scoop,
  lapDone,
  startState,
  sum,
  type Rect,
  type SandAction,
  type SandState,
} from './logic';

const SEEDS = Array.from({ length: 300 }, (_, i) => i + 1);

const invariants = (s: SandState) => {
  expect(s.bucket + sum(s.h) + s.pail).toBe(GRAINS);
  expect(s.bucket).toBeGreaterThanOrEqual(0);
  expect(s.pail).toBeGreaterThanOrEqual(0);
  for (const v of s.h) {
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(RIM);
  }
  for (let i = 0; i < COLS - 1; i++) expect(Math.abs(s.h[i] - s.h[i + 1])).toBeLessThanOrEqual(1);
};

const random = (s: SandState, rng: Rng): SandAction => {
  const r = rng.int(0, 9);
  if (r === 0) return { pail: true };
  const bay = rng.int(0, s.plan.bays.length - 1);
  return r < 6 ? { pour: bay } : { scoop: bay };
};

describe('Sand Table: conservation and bounds', () => {
  for (const plan of PLANS) {
    it(`level ${plan.level}: 48 grains are always in the bucket, tray or pail, within the rim, neighbours within one`, () => {
      for (const seed of SEEDS) {
        const rng = new Rng(seed);
        const s = startState(plan.level, rng);
        invariants(s);
        for (let k = 0; k < 60; k++) {
          if (rng.int(0, 40) === 0) restart(s);
          else apply(s, random(s, rng));
          invariants(s);
        }
      }
    });
  }

  it('starts: each authored tray has neighbours within one and the bucket holds the rest', () => {
    expect(planFor(3).starts.map(sum)).toEqual([12, 18, 18, 16]);
    for (const p of PLANS)
      for (const t of p.starts) {
        expect(t).toHaveLength(COLS);
        const s = startState(p.level, new Rng(1));
        s.h = [...t];
        s.bucket = GRAINS - sum(t);
        invariants(s);
      }
  });

  it('settling finishes within a dozen moves for one batch (worst case logged)', () => {
    let worst = 0;
    for (const plan of PLANS)
      for (const seed of SEEDS) {
        const rng = new Rng(seed);
        const s = startState(plan.level, rng);
        for (let k = 0; k < 40; k++) {
          const a = random(s, rng);
          const r = apply(s, a);
          worst = Math.max(worst, r.events.filter((e) => e.kind === 'slide').length);
        }
      }
    console.log('Sand Table worst slides in one batch:', worst);
    expect(worst).toBeLessThanOrEqual(40);
  });

  it('is deterministic', () => {
    const run = () => {
      const rng = new Rng(7);
      const s = startState(3, rng);
      const out: unknown[] = [];
      for (let k = 0; k < 30; k++) out.push(apply(s, random(s, rng)).events);
      return [s.h, s.bucket, s.pail, out];
    };
    expect(run()).toEqual(run());
  });
});

describe('Sand Table: pours, scoops and the pail', () => {
  it("a pour drops three grains on its bay's pour columns", () => {
    const s = startState(2, new Rng(1));
    const r = pour(s, 1);
    expect(r.events.filter((e) => e.kind === 'drop').map((e) => (e as { col: number }).col)).toEqual([
      8, 9, 8,
    ]);
    expect(s.bucket).toBe(36 - BATCH);
    expect(s.flag).toBe(true);
  });

  it('a scoop takes the tallest column of its own bay, leftmost on a tie, and never another bay', () => {
    const s = startState(2, new Rng(1));
    s.h = [1, 2, 3, 3, 2, 1, 1, 2, 3, 4, 3, 2];
    s.bucket = GRAINS - sum(s.h);
    const right = s.h.slice(6).join();
    const r = scoop(s, 0);
    expect(r.events[0]).toEqual({ kind: 'lift', col: 2 });
    expect(s.h.slice(6).join()).toBe(right);
  });

  it('pouring with an empty bucket and scooping an empty bay change nothing and say empty', () => {
    const s = startState(1, new Rng(1));
    s.bucket = 0;
    s.pail = 0;
    const before = [...s.h];
    const p = pour(s, 0);
    expect(p.kind).toBe('empty');
    expect(s.h).toEqual(before);
    s.h = Array.from({ length: COLS }, () => 0);
    s.bucket = GRAINS;
    const sc = scoop(s, 0);
    expect(sc.kind).toBe('empty');
    expect(s.bucket).toBe(GRAINS);
  });

  it('a partial batch stops when the bucket runs out', () => {
    const s = startState(1, new Rng(1));
    s.bucket = 2;
    s.h = s.h.map(() => 1);
    s.pail = GRAINS - 2 - 12;
    const r = pour(s, 0);
    expect(r.moved).toBe(2);
    expect(s.bucket).toBe(0);
  });

  it('a lone peak slides down its sides; pressed against full neighbours, the extra spills into the pail and comes back', () => {
    const s = startState(3, new Rng(1));
    s.h = [...s.start];
    s.bucket = GRAINS - sum(s.h);
    s.pail = 0;
    let spilled = false;
    for (let k = 0; k < 40 && !spilled; k++) spilled = pour(s, 0).events.some((e) => e.kind === 'spill');
    expect(spilled).toBe(true);
    invariants(s);
    const had = s.pail;
    const back = emptyPail(s);
    expect(back.moved).toBe(had);
    expect(s.pail).toBe(0);
    invariants(s);
  });

  it('is recoverable: from any reached state a few pail taps and scoops leave the bucket able to pour again', () => {
    for (const plan of PLANS)
      for (const seed of SEEDS.slice(0, 80)) {
        const rng = new Rng(seed);
        const s = startState(plan.level, rng);
        for (let k = 0; k < 80; k++) apply(s, { pour: rng.int(0, plan.bays.length - 1) });
        emptyPail(s);
        for (let k = 0; k < 20 && s.bucket === 0; k++) scoop(s, rng.int(0, plan.bays.length - 1));
        expect(s.bucket).toBeGreaterThan(0);
      }
  });

  it('Start again restores the seeded tray exactly and keeps the flag', () => {
    const s = startState(3, new Rng(5));
    const start = [...s.start];
    pour(s, 1);
    scoop(s, 0);
    expect(s.flag).toBe(true);
    restart(s);
    expect(s.h).toEqual(start);
    expect(s.bucket).toBe(GRAINS - sum(start));
    expect(s.flag).toBe(true);
  });

  it('the flag is hidden until a grain moves', () => {
    const s = startState(1, new Rng(1));
    expect(s.flag).toBe(false);
    s.h = s.h.map(() => 0);
    s.bucket = GRAINS;
    scoop(s, 0);
    expect(s.flag).toBe(false);
    pour(s, 0);
    expect(s.flag).toBe(true);
  });
});

describe('Sand Table: the Show line', () => {
  it('names each kind for a known tray and some kind for every reachable tray', () => {
    expect(describeLandscape([1, 1, 1, 1, 2, 2, 2, 1, 1, 1, 1, 1])).toBe('flat');
    expect(describeLandscape([3, 2, 1, 2, 3, 2, 1, 1, 1, 1, 1, 1])).toBe('hills');
    expect(describeLandscape([0, 1, 2, 3, 4, 5, 4, 3, 2, 1, 0, 0])).toBe('tall');
    expect(describeLandscape([1, 2, 3, 3, 3, 2, 1, 1, 1, 1, 1, 1])).toBe('bumpy');
    for (const seed of SEEDS.slice(0, 100)) {
      const rng = new Rng(seed);
      const s = startState(3, rng);
      for (let k = 0; k < 20; k++) apply(s, random(s, rng));
      expect(['flat', 'hills', 'tall', 'bumpy']).toContain(describeLandscape(s.h));
    }
  });
});

describe('Sand Table: help and the ghost finger', () => {
  it('the hint pours into the lowest bay, then returns the pail, then scoops the tallest bay', () => {
    const s = startState(3, new Rng(2));
    s.h = [3, 3, 2, 2, 1, 1, 1, 1, 0, 0, 1, 1];
    s.bucket = GRAINS - sum(s.h);
    expect(hintAction(s)).toEqual({ pour: 2 });
    s.bucket = 0;
    s.pail = GRAINS - sum(s.h);
    expect(hintAction(s)).toEqual({ pail: true });
    s.pail = 0;
    s.bucket = 0;
    s.h[0] = 6;
    s.h[1] = 5;
    expect(hintAction(s)).toEqual({ scoop: 0 });
  });

  it('the bot reaches its flag at every level and every start, following the invitation at level 3', () => {
    for (const plan of PLANS.filter((p) => !p.breeze))
      for (const seed of SEEDS.slice(0, 120)) {
        const s = startState(plan.level, new Rng(seed));
        let taken = 0;
        for (; taken < 30; taken++) {
          const step = botStep(s, taken);
          if ('flag' in step) break;
          if ('breeze' in step || 'answer' in step) throw new Error('breeze step below level 4');
          apply(s, step);
          invariants(s);
        }
        expect(taken, `level ${plan.level} seed ${seed}`).toBeLessThan(30);
        expect(s.flag).toBe(true);
        if (plan.level === 3 && s.invite)
          expect(describeLandscape(s.h), `invite ${s.invite} seed ${seed}`).toBe(s.invite);
      }
  });

  it('level 3 never invites what the start already is', () => {
    for (const seed of SEEDS) {
      const s = startState(3, new Rng(seed));
      expect(describeLandscape(s.h)).not.toBe(s.invite);
    }
  });
});

const hit = (a: Rect, b: Rect, gap = 0) =>
  a.x < b.x + b.w + gap && b.x < a.x + a.w + gap && a.y < b.y + b.h + gap && b.y < a.y + a.h + gap;

describe('Sand Table: layout', () => {
  const views = {
    landscape: computeView(1024, 768),
    portrait: computeView(768, 1024),
    phone: computeView(844, 390),
    notch: computeView(844, 390, { top: 0, right: 47, bottom: 21, left: 47 }),
  };
  for (const [name, view] of Object.entries(views)) {
    for (const bays of [1, 2, 3]) {
      it(`fits ${bays} bay(s) in ${name}`, () => {
        const l = sandLayout(view, bays);
        const targets = [...l.bays, ...l.paddles, l.pail, l.flag];
        for (const r of targets) {
          expect(r.x).toBeGreaterThanOrEqual(0);
          expect(r.y).toBeGreaterThanOrEqual(0);
          expect(r.x + r.w).toBeLessThanOrEqual(view.w);
          expect(r.y + r.h).toBeLessThanOrEqual(view.h);
          expect(r.w).toBeGreaterThanOrEqual(100);
          expect(r.h).toBeGreaterThanOrEqual(100);
        }
        // Everything but the adjacent bays keeps 24 apart.
        const apart = [...l.paddles, l.pail, l.flag];
        for (let i = 0; i < apart.length; i++) {
          for (let j = i + 1; j < apart.length; j++) expect(hit(apart[i], apart[j], 23)).toBe(false);
          for (const b of l.bays) expect(hit(apart[i], b, 23)).toBe(false);
        }
        const pet: Rect = { x: 0, y: view.h - 170, w: 160, h: 170 };
        const home: Rect = { x: 0, y: 0, w: 110, h: 110 };
        for (const r of targets) {
          expect(hit(r, pet)).toBe(false);
          expect(hit(r, home)).toBe(false);
        }
        l.paddles.forEach((p, i) => {
          const cx = p.x + p.w / 2;
          expect(cx).toBeGreaterThanOrEqual(l.bays[i].x);
          expect(cx).toBeLessThanOrEqual(l.bays[i].x + l.bays[i].w);
        });
      });
    }
  }
});

describe('Sand Table level 4: the breeze', () => {
  const plan = planFor(4);
  const at = (hill: number, wind: 'left' | 'right') => {
    const s = startState(4, new Rng(1));
    s.wind = wind;
    s.hill = hill;
    s.h = wind === 'left' ? [...plan.starts[hill]] : [...plan.starts[hill]].reverse();
    s.bucket = GRAINS - sum(s.h);
    s.start = [...s.h];
    s.puff = null;
    return s;
  };
  const m = (c: number) => COLS - 1 - c;
  // The definition's frozen table: hill, lifted, hops (from, to), settle moves, after, answer bay.
  const TRACES = [
    {
      lifted: [1, 2, 3],
      hops: [
        [3, 5],
        [2, 6],
        [1, 6],
      ],
      slides: [[6, 7]],
      after: [1, 1, 2, 3, 3, 3, 2, 2, 1, 1, 1, 1],
      sums: [
        [10, 7, 4],
        [7, 10, 4],
      ],
      answer: 1,
    },
    {
      lifted: [1, 2, 3],
      hops: [
        [3, 5],
        [2, 6],
        [1, 6],
      ],
      slides: [[6, 7]],
      after: [1, 1, 2, 2, 2, 2, 1, 1, 1, 1, 1, 1],
      sums: [
        [9, 3, 4],
        [6, 6, 4],
      ],
      answer: 1,
    },
    {
      lifted: [4, 5, 6],
      hops: [
        [6, 8],
        [5, 9],
        [4, 9],
      ],
      slides: [[9, 10]],
      after: [1, 1, 1, 1, 1, 2, 3, 3, 3, 2, 2, 1],
      sums: [
        [4, 12, 5],
        [4, 9, 8],
      ],
      answer: 2,
    },
  ];
  const bays = (h: number[]) => plan.bays.map(([a, b]) => sum(h.slice(a, b + 1)));

  TRACES.forEach((t, hill) => {
    it(`hill ${hill}: the frozen trace, from the left and mirrored from the right`, () => {
      const s = at(hill, 'left');
      expect(liftedColumns(s.h, 'left')).toEqual(t.lifted);
      const r = puff(s);
      expect(r.lifted).toEqual(t.lifted);
      expect(
        r.events
          .filter((e) => e.kind === 'hop')
          .map((e) => [(e as { from: number }).from, (e as { to: number }).to]),
      ).toEqual(t.hops);
      expect(
        r.events
          .filter((e) => e.kind === 'slide')
          .map((e) => [(e as { from: number }).from, (e as { to: number }).to]),
      ).toEqual(t.slides);
      expect(r.events.some((e) => e.kind === 'spill')).toBe(false);
      expect(r.after).toEqual(t.after);
      expect([bays(r.before), bays(r.after)]).toEqual(t.sums);
      expect(gainedBays(plan, r.before, r.after)).toEqual([t.answer]);

      const q = at(hill, 'right');
      const rr = puff(q);
      expect(rr.lifted).toEqual(t.lifted.map(m));
      expect(rr.after).toEqual([...t.after].reverse());
      expect(
        rr.events
          .filter((e) => e.kind === 'hop')
          .map((e) => [(e as { from: number }).from, (e as { to: number }).to]),
      ).toEqual(t.hops.map(([a, b]) => [m(a), m(b)]));
      expect(gainedBays(plan, rr.before, rr.after)).toEqual([2 - t.answer]);
    });
  });

  it('the answer: one gaining bay per setup, every hop lands in it, never the upwind bay; all three bays are sometimes the answer', () => {
    const answers = new Set<number>();
    for (let hill = 0; hill < 3; hill++)
      for (const wind of ['left', 'right'] as const) {
        const s = at(hill, wind);
        const r = puff(s);
        const g = gainedBays(plan, r.before, r.after);
        expect(g).toHaveLength(1);
        answers.add(g[0]);
        for (const e of r.events) if (e.kind === 'hop') expect(bayOf(plan, e.to)).toBe(g[0]);
        expect(g[0]).not.toBe(wind === 'left' ? 0 : 2);
        for (let b = 0; b < 3; b++)
          if (b !== g[0]) expect(bayChange(plan, r.before, r.after, b)).not.toBe('gained');
        // reasons: the upwind lifted bay lost, an untouched bay is the same
        const lifted = bayOf(plan, r.lifted[0]);
        expect(bayChange(plan, r.before, r.after, lifted)).toBe('lost');
        expect(bayChange(plan, r.before, r.after, g[0])).toBe('gained');
      }
    expect([...answers].sort()).toEqual([0, 1, 2]);
    // an untouched bay in the hill-in-the-middle setup reads same
    const s = at(2, 'left');
    const r = puff(s);
    expect(bayChange(plan, r.before, r.after, 0)).toBe('same');
  });

  it('every seed starts on one of the six setups with the bucket holding the rest', () => {
    const seen = new Set<string>();
    for (const seed of SEEDS) {
      const s = startState(4, new Rng(seed));
      invariants(s);
      expect(s.puff).toBe(null);
      const base = plan.starts[s.hill];
      expect(s.h).toEqual(s.wind === 'left' ? [...base] : [...base].reverse());
      seen.add(`${s.hill}${s.wind}`);
    }
    expect(seen.size).toBe(6);
  });

  it('random trays from levels 1-3, both directions: conservation, bounds, downwind hops, at most 11 lifted, never the far wall', () => {
    for (let seed = 1; seed <= 2000; seed++) {
      const rng = new Rng(seed);
      const s = startState(rng.int(1, 3), rng);
      for (let k = 0; k < rng.int(0, 40); k++) apply(s, random(s, rng));
      for (const wind of ['left', 'right'] as const) {
        const t: SandState = { ...s, h: [...s.h] };
        const mirrorT: SandState = { ...s, h: [...s.h].reverse() };
        const r = blow(t, wind);
        invariants(t);
        expect(r.lifted.length).toBeLessThanOrEqual(11);
        expect(r.lifted).not.toContain(wind === 'left' ? COLS - 1 : 0);
        for (const e of r.events)
          if (e.kind === 'hop') expect(wind === 'left' ? e.to > e.from : e.to < e.from).toBe(true);
        // mirror: right = reverse, left-hand rule, reverse
        const r2 = blow(mirrorT, wind === 'left' ? 'right' : 'left');
        expect([...r2.after].reverse()).toEqual(r.after);
      }
    }
  });

  it('is deterministic, including after Start again', () => {
    const run = (seed: number) => {
      const s = startState(4, new Rng(seed));
      const first = puff(s);
      restart(s);
      expect(s.h).toEqual(first.before);
      const again = puff(s);
      expect(again).toEqual(first);
      return [s.hill, s.wind, first];
    };
    for (const seed of [1, 2, 3, 9]) expect(run(seed)).toEqual(run(seed));
  });

  it('accounting: two wrong pads and the path count misses 2, hints 2; no third hint; the free parts count nothing', () => {
    const s = at(2, 'left');
    expect(breezeHint(s)).toBe('breeze');
    expect(s.quiz).toMatchObject({ misses: 0, hints: 0 });
    puff(s);
    expect(answer(s, 0)).toEqual({ change: 'same', glow: false });
    expect(breezeHint(s)).toBe('path');
    expect(answer(s, 1)).toEqual({ change: 'lost', glow: true });
    expect(s.quiz).toMatchObject({ misses: 2, hints: 2 });
    expect(breezeHint(s)).toBe('glow');
    restart(s);
    puff(s);
    expect(s.quiz).toMatchObject({ misses: 2, hints: 2 });
    expect(answer(s, 2).change).toBe('gained');
    expect(s.quiz).toMatchObject({ misses: 2, hints: 2 });

    // one miss, then a hint request: misses 1, hints 1 (the scripted play's round)
    const t = at(0, 'right');
    puff(t);
    expect(answer(t, 2).change).toBe('lost');
    expect(breezeHint(t)).toBe('path');
    expect(answer(t, 1).change).toBe('gained');
    expect(t.quiz).toMatchObject({ misses: 1, hints: 1 });
  });

  it('the bot taps Breeze, then the gaining pad', () => {
    for (const seed of SEEDS.slice(0, 60)) {
      const s = startState(4, new Rng(seed));
      expect(botStep(s, 0)).toEqual({ breeze: true });
      const r = puff(s);
      const step = botStep(s, 1);
      expect(step).toEqual({ answer: gainedBays(plan, r.before, r.after)[0] });
      expect(answer(s, (step as { answer: number }).answer).change).toBe('gained');
    }
  });
});

describe('lap: a touch anywhere pours, and the round finishes after her pours', () => {
  it('lap applies at level 1 only; toddler level 1 is unchanged', () => {
    expect(startState(1, new Rng(1), true).lap).toBe(true);
    expect(startState(1, new Rng(1)).lap).toBe(false);
    expect(startState(2, new Rng(1), true).lap).toBe(false);
    const t = startState(1, new Rng(1));
    for (let k = 0; k < LAP_POURS + 2; k++) pour(t, 0);
    expect(lapDone(t)).toBe(false);
    expect(botStep(startState(1, new Rng(1)), 4)).toEqual({ scoop: 0 });
  });

  it('the bucket never runs dry before the round finishes, from every start, and the grains stay 48', () => {
    for (let seed = 1; seed <= 20; seed++) {
      const s = startState(1, new Rng(seed), true);
      let pours = 0;
      while (!lapDone(s)) {
        expect(botStep(s, pours)).toEqual({ pour: 0 });
        const r = pour(s, 0);
        pours++;
        expect(r.kind).toBe('ok');
        expect(r.moved).toBe(BATCH);
        expect(s.bucket).toBeGreaterThan(0);
        expect(sum(s.h) + s.bucket + s.pail).toBe(GRAINS);
      }
      expect(pours).toBe(LAP_POURS);
      expect(botStep(s, pours)).toEqual({ flag: true });
      // nothing spills at lap: the pail (and its line) never comes up
      expect(s.pail).toBe(0);
      expect(s.h.every((h) => h <= RIM)).toBe(true);
    }
  });

  it('Start again refills the bucket and keeps the pours already made', () => {
    const s = startState(1, new Rng(3), true);
    for (let k = 0; k < 5; k++) pour(s, 0);
    restart(s);
    expect(s.pours).toBe(5);
    expect(s.bucket).toBe(GRAINS - sum(s.start));
    for (let k = 0; k < LAP_POURS - 5; k++) expect(pour(s, 0).kind).toBe('ok');
    expect(lapDone(s)).toBe(true);
  });
});
