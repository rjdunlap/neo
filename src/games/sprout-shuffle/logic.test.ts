import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import {
  PETAL_COLORS, PLANS, acceptedClaim, always, buildingBud, builtBud, checkClaim, checkLooks, freshRound, lookCounts, looks, nextStep, planFor, routes, setupFor, support,
  type Copy, type Genotype, type Look, type Round,
} from './logic';

const SEEDS = Array.from({ length: 200 }, (_, i) => i);
const g = (a: Copy, b: Copy): Genotype => [a, b];

describe('looks and routes', () => {
  it('one spot copy is enough: AA, Aa, aA spotted; aa plain', () => {
    expect(looks(g('A', 'A'))).toBe('spotted');
    expect(looks(g('A', 'a'))).toBe('spotted');
    expect(looks(g('a', 'A'))).toBe('spotted');
    expect(looks(g('a', 'a'))).toBe('plain');
  });

  it('always gives four routes in fan order with distinct from pairs, never merged', () => {
    for (const l of [g('A', 'A'), g('A', 'a'), g('a', 'A'), g('a', 'a')])
      for (const r of [g('A', 'A'), g('A', 'a'), g('a', 'A'), g('a', 'a')]) {
        const rs = routes(l, r);
        expect(rs).toHaveLength(4);
        expect(rs.map((x) => x.from)).toEqual([[0, 0], [0, 1], [1, 0], [1, 1]]);
        rs.forEach((x) => expect(x.sprout).toEqual([l[x.from[0]], r[x.from[1]]]));
      }
    const dup = routes(g('A', 'A'), g('a', 'a'));
    expect(dup).toHaveLength(4);
    expect(dup.every((x) => looks(x.sprout) === 'spotted')).toBe(true);
  });

  it('counts looks for the known crosses', () => {
    expect(lookCounts(routes(g('A', 'a'), g('a', 'a')))).toEqual({ spotted: 2, plain: 2 });
    expect(lookCounts(routes(g('A', 'A'), g('a', 'a')))).toEqual({ spotted: 4, plain: 0 });
    const rs = routes(g('A', 'a'), g('A', 'a'));
    expect(lookCounts(rs)).toEqual({ spotted: 3, plain: 1 });
    const key = (s: Genotype) => (s[0] === s[1] ? s.join('') : 'Aa');
    const tally: Record<string, number> = {};
    rs.forEach((x) => (tally[key(x.sprout)] = (tally[key(x.sprout)] ?? 0) + 1));
    expect(tally).toEqual({ AA: 1, Aa: 2, aa: 1 });
  });

  it('lookCounts agrees with support, always', () => {
    for (const l of [g('A', 'A'), g('A', 'a'), g('a', 'a')])
      for (const r of [g('A', 'A'), g('A', 'a'), g('a', 'a')]) {
        const rs = routes(l, r);
        const c = lookCounts(rs);
        const s = support(rs);
        expect(s.has('spotted')).toBe(c.spotted > 0);
        expect(s.has('plain')).toBe(c.plain > 0);
        expect(always('spotted', rs)).toBe(c.spotted === 4);
        expect(always('plain', rs)).toBe(c.plain === 4);
      }
  });
});

describe('checkLooks', () => {
  const l2 = routes(g('A', 'a'), g('a', 'a'));
  const l1 = routes(g('A', 'A'), g('a', 'a'));

  it('level 1 and 2 crosses: always / support', () => {
    expect(always('spotted', l1)).toBe(true);
    expect(always('spotted', l2)).toBe(false);
    expect([...support(l2)].sort()).toEqual(['plain', 'spotted']);
  });

  it('level 2 accepts only {spotted, plain}; wrong sets return a real counterexample', () => {
    expect(checkLooks(['spotted', 'plain'], l2)).toEqual({ ok: true });
    const sets: Look[][] = [['spotted'], ['plain'], []];
    for (const set of sets) {
      const v = checkLooks(set, l2);
      expect(v.ok).toBe(false);
      if (v.ok === false && 'missing' in v) {
        expect(set).not.toContain(v.missing);
        expect(looks(v.route.sprout)).toBe(v.missing);
        expect(l2).toContain(v.route);
      } else throw new Error('expected a missing verdict');
    }
  });

  it('level 1: {spotted} ok, adding plain is extra', () => {
    expect(checkLooks(['spotted'], l1)).toEqual({ ok: true });
    expect(checkLooks(['spotted', 'plain'], l1)).toEqual({ ok: false, extra: 'plain' });
  });
});

describe('level 3 claim', () => {
  const aa = routes(g('A', 'a'), g('A', 'a'));

  it('Aa x Aa: looks {spotted 3, plain 1}, genotypes AA 1 / Aa 2 / aa 1', () => {
    expect(lookCounts(aa)).toEqual({ spotted: 3, plain: 1 });
    const tally: Record<string, number> = {};
    for (const x of aa) {
      const k = x.sprout[0] === x.sprout[1] ? x.sprout.join('') : 'Aa';
      tally[k] = (tally[k] ?? 0) + 1;
    }
    expect(tally).toEqual({ AA: 1, Aa: 2, aa: 1 });
  });

  it('the accepted claim is sometimes; always fails with the aa route as the counterexample', () => {
    expect(acceptedClaim(aa)).toBe('sometimes');
    expect(checkClaim('sometimes', aa)).toEqual({ ok: true });
    const v = checkClaim('always', aa);
    expect(v.ok).toBe(false);
    if (v.ok === false) {
      expect(v.route).not.toBeNull();
      expect(v.route!.sprout).toEqual(['a', 'a']);
      expect(looks(v.route!.sprout)).toBe('plain');
    }
  });

  it('every choose-always plan and seeded presentation has a contradicting counterexample', () => {
    for (const plan of PLANS.filter((p) => p.task === 'choose-always'))
      for (const seed of SEEDS) {
        const s = setupFor(plan.level, new Rng(seed));
        expect(acceptedClaim(s.routes)).toBe('sometimes');
        expect(checkClaim('sometimes', s.routes)).toEqual({ ok: true });
        const v = checkClaim('always', s.routes);
        expect(v.ok).toBe(false);
        if (v.ok === false) {
          expect(v.route).not.toBeNull();
          expect(s.routes).toContain(v.route);
          expect(looks(v.route!.sprout)).not.toBe('spotted');
        }
      }
  });

  it("level 1's cross accepts always, and rejects sometimes with no counterexample route", () => {
    const l1 = routes(g('A', 'A'), g('a', 'a'));
    expect(acceptedClaim(l1)).toBe('always');
    expect(checkClaim('always', l1)).toEqual({ ok: true });
    expect(checkClaim('sometimes', l1)).toEqual({ ok: false, route: null });
  });
});

describe('plans', () => {
  it('levels 1 to 3 exist, differ, and clamp', () => {
    expect(PLANS).toHaveLength(3);
    expect(new Set(PLANS.map((p) => p.name)).size).toBe(3);
    expect(planFor(0).level).toBe(1);
    expect(planFor(99).level).toBe(3);
    expect(planFor(1).task).toBe('open-all');
    expect(planFor(2).task).toBe('choose-could');
    expect(planFor(3).task).toBe('choose-always');
    expect(planFor(3).parents).toEqual([['A', 'a'], ['A', 'a']]);
  });
});

describe('setupFor', () => {
  it('seeds a valid presentation of each plan', () => {
    for (const level of [1, 2, 3]) {
      const sides = new Set<string>();
      const orders = new Set<string>();
      const builds = new Set<number>();
      for (const seed of SEEDS) {
        const s = setupFor(level, new Rng(seed));
        expect(s.colors[0]).not.toBe(s.colors[1]);
        s.colors.forEach((c) => expect(PETAL_COLORS).toContain(c));
        expect([...s.left, ...s.right].sort()).toEqual([...s.plan.parents[0], ...s.plan.parents[1]].sort());
        expect(s.routes).toEqual(routes(s.left, s.right));
        if (level === 1) expect(s.build).toEqual([]);
        else if (level === 2) {
          expect(s.build).toHaveLength(1);
          expect(s.build[0]).toBeGreaterThanOrEqual(0);
          expect(s.build[0]).toBeLessThanOrEqual(3);
          builds.add(s.build[0]);
        } else expect(s.build).toEqual([0, 1, 2, 3]);
        if (level < 3) {
          const spottedLeft = s.left.includes('A') && !s.right.includes('A') ? true : !s.left.includes('A') ? false : null;
          sides.add(spottedLeft ? 'left' : 'right');
          orders.add((spottedLeft ? s.left : s.right).join(''));
        } else {
          expect([...s.left].sort()).toEqual(['A', 'a']);
          expect([...s.right].sort()).toEqual(['A', 'a']);
          orders.add(s.left.join('') + '/' + s.right.join(''));
        }
        expect(setupFor(level, new Rng(seed))).toEqual(s);
      }
      if (level < 3) expect(sides).toEqual(new Set(['left', 'right']));
      if (level === 2) {
        expect(orders).toEqual(new Set(['Aa', 'aA']));
        expect(builds).toEqual(new Set([0, 1, 2, 3]));
      }
      if (level === 3) expect(orders).toEqual(new Set(['Aa/Aa', 'Aa/aA', 'aA/Aa', 'aA/aA']));
    }
  });
});

describe('freshRound', () => {
  it('level 1 opens no bud; level 2 opens three and leaves the built one closed; level 3 opens none', () => {
    for (const seed of SEEDS.slice(0, 50)) {
      const r1 = freshRound(setupFor(1, new Rng(seed)));
      expect(r1.opened).toEqual([false, false, false, false]);
      expect(r1.phase).toBe('give');
      expect(r1.claim).toBeNull();
      const s2 = setupFor(2, new Rng(seed));
      const r2 = freshRound(s2);
      expect(r2.opened.filter(Boolean)).toHaveLength(3);
      expect(r2.opened[s2.build[0]]).toBe(false);
      expect(buildingBud(r2)).toBe(s2.build[0]);
      const r3 = freshRound(setupFor(3, new Rng(seed)));
      expect(r3.opened).toEqual([false, false, false, false]);
      expect(r3.claim).toBeNull();
      expect(buildingBud(r3)).toBe(0);
    }
  });
});

describe('nextStep', () => {
  function walk(level: number, seed: number) {
    let r: Round = freshRound(setupFor(level, new Rng(seed)));
    const s = r.setup;
    let steps = 0;
    let builtCount = 0;
    while (r.phase !== 'done' && steps < 30) {
      const st = nextStep(r);
      if (st === null) throw new Error(`stuck in ${r.phase} at step ${steps}`);
      steps++;
      if ('give' in st) {
        const slots: [0 | 1 | null, 0 | 1 | null] = [r.slots[0], r.slots[1]];
        slots[st.give] = st.tile;
        r = { ...r, slots, phase: slots[0] !== null && slots[1] !== null ? 'fan' : 'give' };
      } else if ('open' in st) {
        const opened = r.opened.slice();
        opened[st.open] = true;
        r = { ...r, opened, phase: opened.every(Boolean) ? 'done' : 'fan' };
      } else if ('build' in st) {
        expect(st.build).toBe(buildingBud(r));
        expect(st.build).toBe(s.build[builtCount]);
        expect(st.tile).toBe(s.routes[st.build].from[st.side]);
        const built: [boolean, boolean] = [r.built[0], r.built[1]];
        built[st.side] = true;
        r = { ...r, built };
        if (built[0] && built[1]) {
          const opened = r.opened.slice();
          opened[st.build] = true;
          builtCount++;
          r = { ...r, opened, built: [false, false], phase: buildingBud({ ...r, opened }) === null ? 'choose' : 'fan' };
        }
      } else if ('claim' in st) {
        expect(r.phase).toBe('choose');
        r = { ...r, claim: st.claim };
      } else if ('choose' in st) {
        r = { ...r, chosen: new Set([...r.chosen, st.choose]) };
      } else {
        if (level === 3) expect(checkClaim(r.claim!, s.routes).ok).toBe(true);
        else expect(checkLooks(r.chosen, s.routes).ok).toBe(true);
        r = { ...r, phase: 'done' };
      }
    }
    return { r, steps, builtCount };
  }

  it('walking the steps finishes all three levels within 12 steps', () => {
    for (const level of [1, 2, 3]) for (const seed of SEEDS) {
      const { r, steps, builtCount } = walk(level, seed);
      expect(r.phase).toBe('done');
      expect(steps).toBeLessThanOrEqual(12);
      if (level >= 2) expect(r.opened.every(Boolean)).toBe(true);
      expect(builtCount).toBe(r.setup.build.length);
      if (level === 3) expect(r.claim).toBe('sometimes');
    }
  });

  it('never says check until the chosen set is accepted', () => {
    for (const seed of SEEDS.slice(0, 50)) {
      const setup = setupFor(2, new Rng(seed));
      const base: Round = { ...freshRound(setup), phase: 'choose', built: [true, true] };
      for (const chosen of [[], ['spotted'], ['plain'], ['spotted', 'plain']] as Look[][]) {
        const st = nextStep({ ...base, chosen: new Set(chosen) });
        const ok = checkLooks(chosen, setup.routes).ok;
        expect(st !== null && 'check' in st).toBe(ok && chosen.length > 0);
        if (!ok) expect(st !== null && 'choose' in st).toBe(true);
      }
    }
  });
});

describe('level 3 nextStep', () => {
  it('never says check until the claim is accepted; suggests the accepted claim otherwise', () => {
    for (const seed of SEEDS.slice(0, 50)) {
      const setup = setupFor(3, new Rng(seed));
      const base: Round = { ...freshRound(setup), phase: 'choose', opened: [true, true, true, true] };
      for (const claim of [null, 'always', 'sometimes'] as const) {
        const st = nextStep({ ...base, claim });
        if (claim === 'sometimes') expect(st).toEqual({ check: true });
        else expect(st).toEqual({ claim: 'sometimes' });
      }
    }
  });

  it('builds the buds in order, one at a time, from the route sources', () => {
    const r0: Round = { ...freshRound(setupFor(3, new Rng(5))), phase: 'fan' };
    expect(nextStep({ ...r0, opened: [true, false, false, false] })).toMatchObject({ build: 1, side: 0 });
    expect(nextStep({ ...r0, opened: [true, true, true, false], built: [true, false] })).toMatchObject({ build: 3, side: 1 });
  });
});

describe('builtBud', () => {
  it('finds the bud with the chosen from pair; null while a slot is empty', () => {
    const r0 = freshRound(setupFor(2, new Rng(7)));
    expect(builtBud(r0)).toBeNull();
    expect(builtBud({ ...r0, slots: [1, null] })).toBeNull();
    expect(builtBud({ ...r0, slots: [null, 0] })).toBeNull();
    for (const i of [0, 1] as const) for (const j of [0, 1] as const) {
      const idx = builtBud({ ...r0, slots: [i, j] });
      expect(idx).not.toBeNull();
      expect(r0.setup.routes[idx!].from).toEqual([i, j]);
    }
  });
});
