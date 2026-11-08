import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import {
  PETAL_COLORS,
  PLANS,
  acceptedClaim,
  always,
  buildingBud,
  builtBud,
  checkClaim,
  checkLooks,
  freshRound,
  lookCounts,
  looks,
  nextStep,
  planFor,
  routes,
  setupFor,
  support,
  type Copy,
  type Genotype,
  type Look,
  type Round,
  PAIRS_NAME,
  PAIR_POOLS,
  checkPairs,
  copiesKey,
  counterexample,
  levelName,
  pairsAlways,
  pairsNextStep,
  pairsSetupFor,
  type Pair,
  type PairsSetup,
  RECORD_SLOTS,
  WATERING,
  HIDDEN_NAME,
  GENOTYPES,
  candidates,
  checkCandidates,
  compatible,
  contradicts,
  couldTell,
  drawSprout,
  hiddenNextStep,
  hiddenSetupFor,
  tryRoom,
  type Candidate,
  type HiddenPhase,
  TESTERS,
  TESTER_NAME,
  cantTellSprouts,
  pickStep,
  testerRecord,
  BENCHES,
  BOT_PAIRS,
  BRIEF,
  MARKINGS,
  acceptedPairs,
  combinedRoutes,
  conservatorySetupFor,
  conservatoryStep,
  counterFor,
  failingRoute,
  guaranteed,
  helpPair,
  hiddenCopies,
  locusRoutes,
  looks2,
  plantKey,
  type Plant2,
  type Marking,
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
        expect(rs.map((x) => x.from)).toEqual([
          [0, 0],
          [0, 1],
          [1, 0],
          [1, 1],
        ]);
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
    expect(planFor(3).parents).toEqual([
      ['A', 'a'],
      ['A', 'a'],
    ]);
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
          const spottedLeft =
            s.left.includes('A') && !s.right.includes('A') ? true : !s.left.includes('A') ? false : null;
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
          r = {
            ...r,
            opened,
            built: [false, false],
            phase: buildingBud({ ...r, opened }) === null ? 'choose' : 'fan',
          };
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
    for (const level of [1, 2, 3])
      for (const seed of SEEDS) {
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
    expect(nextStep({ ...r0, opened: [true, true, true, false], built: [true, false] })).toMatchObject({
      build: 3,
      side: 1,
    });
  });
});

describe('builtBud', () => {
  it('finds the bud with the chosen from pair; null while a slot is empty', () => {
    const r0 = freshRound(setupFor(2, new Rng(7)));
    expect(builtBud(r0)).toBeNull();
    expect(builtBud({ ...r0, slots: [1, null] })).toBeNull();
    expect(builtBud({ ...r0, slots: [null, 0] })).toBeNull();
    for (const i of [0, 1] as const)
      for (const j of [0, 1] as const) {
        const idx = builtBud({ ...r0, slots: [i, j] });
        expect(idx).not.toBeNull();
        expect(r0.setup.routes[idx!].from).toEqual([i, j]);
      }
  });
});

describe('level 4: which pairs always make spotted?', () => {
  const key = (p: Pair) => `${copiesKey(p[0])}x${copiesKey(p[1])}`;
  const canon = (p: Pair) => [copiesKey(p[0]), copiesKey(p[1])].sort().join('x');
  const names = (pool: number) =>
    pairsAlways(PAIR_POOLS[pool], 'spotted').map((i) => key(PAIR_POOLS[pool][i]));

  it('pairsAlways matches the definition table', () => {
    expect(names(0)).toEqual(['AAxaa']);
    expect(names(1)).toEqual(['AAxAa']);
    expect(names(2)).toEqual(['AAxAA', 'AAxaa']);
  });

  it('every pool has an accepted and a rejected pair; pool C has two accepted', () => {
    expect(PAIR_POOLS).toHaveLength(3);
    PAIR_POOLS.forEach((pool, i) => {
      const n = pairsAlways(pool, 'spotted').length;
      expect(n).toBeGreaterThanOrEqual(1);
      expect(n).toBeLessThan(pool.length);
      if (i === 2) expect(n).toBe(2);
    });
  });

  it('counterexamples are real plain routes for rejected pairs; accepted pairs have none and four spotted routes', () => {
    for (const pool of PAIR_POOLS) {
      const ok = new Set(pairsAlways(pool, 'spotted'));
      pool.forEach((p, i) => {
        const c = counterexample(p);
        const rs = routes(p[0], p[1]);
        if (ok.has(i)) {
          expect(c).toBeNull();
          expect(rs).toHaveLength(4);
          expect(rs.every((r) => looks(r.sprout) === 'spotted')).toBe(true);
        } else {
          expect(c).not.toBeNull();
          expect(looks(c!.sprout)).toBe('plain');
          expect(rs).toContainEqual(c);
        }
      });
    }
  });

  it('pairsSetupFor deals three valid cards from one pool and reaches every pool', () => {
    const seen = new Set<number>();
    for (const seed of SEEDS) {
      const s = pairsSetupFor(new Rng(seed));
      seen.add(s.pool);
      expect(PAIR_POOLS[s.pool]).toBeDefined();
      expect(s.pairs).toHaveLength(3);
      expect(s.colors).toHaveLength(3);
      s.colors.forEach(([a, b]) => expect(a).not.toBe(b));
      expect(s.pairs.map(canon).sort()).toEqual(PAIR_POOLS[s.pool].map(canon).sort());
      const always = s.pairs.flatMap((p, i) =>
        routes(p[0], p[1]).every((r) => looks(r.sprout) === 'spotted') ? [i] : [],
      );
      expect([...s.accepted].sort()).toEqual(always);
      expect(s.accepted.size).toBe(pairsAlways(PAIR_POOLS[s.pool], 'spotted').length);
    }
    expect([...seen].sort()).toEqual([0, 1, 2]);
  });

  it('the same seed deals the same cards', () => {
    for (const seed of SEEDS.slice(0, 30)) {
      const a = pairsSetupFor(new Rng(seed));
      const b = pairsSetupFor(new Rng(seed));
      expect(b.pairs).toEqual(a.pairs);
      expect(b.colors).toEqual(a.colors);
      expect([...b.accepted]).toEqual([...a.accepted]);
    }
  });

  const subsets = (): number[][] =>
    Array.from({ length: 8 }, (_, m) => [0, 1, 2].filter((i) => m & (1 << i)));

  it('checkPairs accepts exactly the accepted set, in any order, duplicates ignored', () => {
    for (const seed of SEEDS) {
      const s = pairsSetupFor(new Rng(seed));
      for (const sub of subsets()) {
        const v = checkPairs(sub, s);
        const exact = sub.length === s.accepted.size && sub.every((i) => s.accepted.has(i));
        expect('ok' in v && v.ok).toBe(exact);
        if (!exact) expect(v.ok).toBe(false);
        if (!v.ok && 'extra' in v) {
          expect(s.accepted.has(v.extra)).toBe(false);
          expect(sub).toContain(v.extra);
          expect(looks(v.route.sprout)).toBe('plain');
          expect(routes(s.pairs[v.extra][0], s.pairs[v.extra][1])).toContainEqual(v.route);
        }
        if (!v.ok && 'missing' in v) {
          expect(s.accepted.has(v.missing)).toBe(true);
          expect(sub).not.toContain(v.missing);
        }
      }
      const acc = [...s.accepted];
      expect(checkPairs([...acc].reverse().concat(acc), s)).toEqual({ ok: true });
      for (const i of [0, 1, 2].filter((x) => !s.accepted.has(x))) {
        const v = checkPairs([...acc, i], s);
        expect(v).toMatchObject({ ok: false, extra: i });
      }
      for (const m of acc) {
        const v = checkPairs(
          acc.filter((x) => x !== m),
          s,
        );
        expect(v).toEqual({ ok: false, missing: m });
      }
    }
  });

  it('pool C: choosing only one of its two accepted cards is not ok', () => {
    let tested = 0;
    for (const seed of SEEDS) {
      const s: PairsSetup = pairsSetupFor(new Rng(seed));
      if (s.pool !== 2) continue;
      tested++;
      expect(s.accepted.size).toBe(2);
      for (const i of s.accepted) expect(checkPairs([i], s).ok).toBe(false);
    }
    expect(tested).toBeGreaterThan(0);
  });

  it('pairsNextStep walks choose then check from empty, and heals any starting subset within 4 steps', () => {
    for (const seed of SEEDS) {
      const s = pairsSetupFor(new Rng(seed));
      const empty = new Set<number>();
      const first = pairsNextStep(empty, s);
      expect(first).toHaveProperty('choose');
      for (const sub of subsets()) {
        const chosen = new Set(sub);
        let steps = 0;
        for (; steps < 4; steps++) {
          const st = pairsNextStep(chosen, s);
          if ('check' in st) break;
          if ('choose' in st) {
            expect(s.accepted.has(st.choose)).toBe(true);
            expect(chosen.has(st.choose)).toBe(false);
            chosen.add(st.choose);
          } else {
            expect(s.accepted.has(st.unchoose)).toBe(false);
            expect(chosen.has(st.unchoose)).toBe(true);
            chosen.delete(st.unchoose);
          }
        }
        expect('check' in pairsNextStep(chosen, s)).toBe(true);
        expect([...chosen].sort()).toEqual([...s.accepted].sort());
        expect(checkPairs(chosen, s)).toEqual({ ok: true });
      }
    }
  });

  it('copiesKey names a plant by its spot copies', () => {
    expect(copiesKey(g('A', 'A'))).toBe('AA');
    expect(copiesKey(g('A', 'a'))).toBe('Aa');
    expect(copiesKey(g('a', 'A'))).toBe('Aa');
    expect(copiesKey(g('a', 'a'))).toBe('aa');
  });

  it('levelName keeps levels 1-3 and names 4 and above as the pairs level', () => {
    for (const l of [1, 2, 3]) expect(levelName(l)).toBe(planFor(l).name);
    for (const l of [4]) expect(levelName(l)).toBe(PAIRS_NAME);
  });
});

describe('level 5: Hidden Sprouts', () => {
  const AA = GENOTYPES.AA,
    Aa = GENOTYPES.Aa,
    aa = GENOTYPES.aa;
  const spots3: Look[] = ['spotted', 'spotted', 'spotted'];
  const seeds300 = Array.from({ length: 300 }, (_, i) => i);

  it('candidates follow the record', () => {
    expect(candidates(aa, spots3)).toEqual(['AA', 'Aa']);
    expect(candidates(aa, [])).toEqual(['AA', 'Aa']);
    expect(candidates(aa, ['plain'])).toEqual(['Aa']);
    expect(candidates(aa, ['spotted', 'plain', 'spotted'])).toEqual(['Aa']);
  });

  it('authored cases are compatible with their truth; plain only in Aa, exactly once, in the second watering', () => {
    for (const seed of seeds300) {
      const s = hiddenSetupFor(new Rng(seed));
      const truth = GENOTYPES[s.truth];
      const plainFirst = s.first.filter((l) => l === 'plain').length;
      const plainSecond = s.second.filter((l) => l === 'plain').length;
      expect(s.first).toHaveLength(WATERING);
      expect(s.second).toHaveLength(WATERING);
      expect(compatible(truth, s.tester, s.first)).toBe(true);
      expect(compatible(truth, s.tester, [...s.first, ...s.second])).toBe(true);
      expect(plainFirst).toBe(0);
      expect(plainSecond).toBe(s.truth === 'Aa' ? 1 : 0);
      expect(copiesKey(s.hidden)).toBe(s.truth);
      expect(copiesKey(s.tester)).toBe('aa');
      expect(s.first.length + s.second.length).toBeLessThanOrEqual(RECORD_SLOTS);
      expect(contradicts(s.tester, s.first)).toBe(false);
      expect(contradicts(s.tester, [...s.first, ...s.second])).toBe(false);
      expect(candidates(s.tester, s.first)).toEqual(['AA', 'Aa']);
      expect(candidates(s.tester, [...s.first, ...s.second])).toEqual(
        s.truth === 'Aa' ? ['Aa'] : ['AA', 'Aa'],
      );
      expect([...s.order].sort()).toEqual(['AA', 'Aa']);
      expect(s.colors[0]).not.toBe(s.colors[1]);
    }
  });

  it('both cases and both card orders occur, and the same seed gives the same case', () => {
    const all = seeds300.map((seed) => hiddenSetupFor(new Rng(seed)));
    expect(new Set(all.map((s) => s.truth))).toEqual(new Set(['AA', 'Aa']));
    expect(new Set(all.map((s) => s.order[0]))).toEqual(new Set(['AA', 'Aa']));
    for (const seed of SEEDS) expect(hiddenSetupFor(new Rng(seed))).toEqual(hiddenSetupFor(new Rng(seed)));
  });

  it('a plain sprout against an AA tester contradicts', () => {
    expect(contradicts(AA, ['plain'])).toBe(true);
    expect(candidates(AA, ['plain'])).toEqual([]);
    expect(contradicts(AA, ['spotted'])).toBe(false);
  });

  it('compatible ignores order and count', () => {
    const a: Look[] = ['spotted', 'plain', 'spotted'];
    const b: Look[] = ['plain', 'plain', 'spotted', 'spotted', 'spotted', 'plain'];
    for (const c of [AA, Aa]) expect(compatible(c, aa, a)).toBe(compatible(c, aa, b));
    expect(compatible(Aa, aa, a)).toBe(true);
    expect(compatible(AA, aa, a)).toBe(false);
  });

  it('tryRoom keeps the record within eight at every phase', () => {
    const phases: HiddenPhase[] = ['water1', 'choose1', 'water2', 'choose2', 'done'];
    expect(tryRoom('water1', 0)).toBe(0);
    expect(tryRoom('done', 0)).toBe(0);
    for (const ph of phases)
      for (let len = 0; len <= RECORD_SLOTS; len++) {
        const room = tryRoom(ph, len);
        expect(room).toBeGreaterThanOrEqual(0);
        if (room > 0) expect(len + room).toBeLessThanOrEqual(RECORD_SLOTS);
      }
    // Fill the card with Try one at every chance: the second watering still fits.
    expect(tryRoom('choose1', WATERING)).toBe(RECORD_SLOTS - 2 * WATERING);
    const rec = WATERING + tryRoom('choose1', WATERING);
    expect(rec + WATERING).toBeLessThanOrEqual(RECORD_SLOTS);
    expect(tryRoom('choose2', RECORD_SLOTS)).toBe(0);
    expect(tryRoom('choose2', 2 * WATERING)).toBe(RECORD_SLOTS - 2 * WATERING);
  });

  it('Try one draws from the true copies never contradict the case, and plain never shows for AA', () => {
    for (const seed of seeds300) {
      const rng = new Rng(seed);
      const s = hiddenSetupFor(rng);
      const record: Look[] = [...s.first];
      let phase: HiddenPhase = 'choose1';
      for (let k = tryRoom(phase, record.length); k > 0; k = tryRoom(phase, record.length)) {
        const look = drawSprout(s.hidden, s.tester, rng);
        if (s.truth === 'AA') expect(look).toBe('spotted');
        record.push(look);
        expect(contradicts(s.tester, record)).toBe(false);
        expect(compatible(GENOTYPES[s.truth], s.tester, record)).toBe(true);
      }
      record.push(...s.second);
      phase = 'choose2';
      expect(record.length).toBeLessThanOrEqual(RECORD_SLOTS);
      for (let k = tryRoom(phase, record.length); k > 0; k = tryRoom(phase, record.length)) {
        record.push(drawSprout(s.hidden, s.tester, rng));
        expect(record.length).toBeLessThanOrEqual(RECORD_SLOTS);
        expect(contradicts(s.tester, record)).toBe(false);
      }
      expect(record.length).toBeLessThanOrEqual(RECORD_SLOTS);
    }
  });

  it('only a plain tester can tell the candidates apart', () => {
    expect(couldTell(aa)).toBe(true);
    expect(couldTell(AA)).toBe(false);
  });

  it('checkCandidates accepts exactly the fitting set and reports extra before missing', () => {
    const records: Look[][] = [[], spots3, ['spotted', 'plain'], ['plain']];
    const subsets: Candidate[][] = [[], ['AA'], ['Aa'], ['AA', 'Aa']];
    for (const rec of records) {
      const fit = candidates(aa, rec);
      for (const sub of subsets) {
        const v = checkCandidates(sub, aa, rec);
        const exact = sub.length === fit.length && sub.every((c) => fit.includes(c));
        expect('ok' in v && v.ok).toBe(exact);
      }
    }
    expect(checkCandidates(['AA'], aa, ['plain'])).toEqual({ ok: false, extra: 'AA' });
    // Extra wins even when something is also missing.
    expect(checkCandidates(['AA'], aa, ['plain'])).not.toHaveProperty('missing');
    expect(checkCandidates([], aa, ['plain'])).toEqual({ ok: false, missing: 'Aa' });
    expect(checkCandidates(['Aa'], aa, spots3)).toEqual({ ok: false, missing: 'AA' });
    expect(checkCandidates(['AA'], aa, spots3)).toEqual({ ok: false, missing: 'Aa' });
  });

  it('counterexamples: a missing candidate makes every look on the record; an extra AA has no plain route', () => {
    const records: Look[][] = [[], spots3, ['spotted', 'plain', 'spotted'], ['plain'], ['plain', 'spotted']];
    for (const rec of records)
      for (const sub of [[], ['AA'], ['Aa'], ['AA', 'Aa']] as Candidate[][]) {
        const v = checkCandidates(sub, aa, rec);
        if ('ok' in v && !v.ok && 'missing' in v) {
          const made = new Set(routes(GENOTYPES[v.missing], aa).map((r) => looks(r.sprout)));
          for (const look of rec) expect(made.has(look)).toBe(true);
        }
        if ('ok' in v && !v.ok && 'extra' in v) {
          const rs = routes(GENOTYPES[v.extra], aa);
          expect(rs.some((r) => looks(r.sprout) === 'plain')).toBe(false);
          expect(rec).toContain('plain');
          if (v.extra === 'AA') expect(counterexample([GENOTYPES.AA, aa])).toBeNull();
        }
      }
  });

  it('hiddenNextStep reaches a passing Check from any chosen set at every phase and case', () => {
    const subsets: Candidate[][] = [[], ['AA'], ['Aa'], ['AA', 'Aa']];
    for (const seed of SEEDS) {
      const s = hiddenSetupFor(new Rng(seed));
      for (const [phase, rec] of [
        ['choose1', s.first],
        ['choose2', [...s.first, ...s.second]],
      ] as [HiddenPhase, Look[]][])
        for (const sub of subsets) {
          const chosen = new Set<Candidate>(sub);
          let guard = 0;
          for (;;) {
            const st = hiddenNextStep(phase, chosen, s.tester, rec);
            expect(st).not.toBeNull();
            if (!st || 'check' in st) break;
            expect('water' in st).toBe(false);
            if ('choose' in st) chosen.add(st.choose);
            else if ('unchoose' in st) chosen.delete(st.unchoose);
            expect(++guard).toBeLessThan(6);
          }
          expect(checkCandidates(chosen, s.tester, rec)).toEqual({ ok: true });
        }
    }
    expect(hiddenNextStep('water1', new Set(), aa, [])).toEqual({ water: true });
    expect(hiddenNextStep('water2', new Set(), aa, spots3)).toEqual({ water: true });
    expect(hiddenNextStep('done', new Set(), aa, spots3)).toBeNull();
  });

  it('levelName names level 5 and leaves level 4 unchanged', () => {
    expect(levelName(5)).toBe('Hidden Sprouts');
    expect(levelName(5)).toBe(HIDDEN_NAME);
    expect(levelName(4)).toBe(PAIRS_NAME);
  });
});

describe('level 6: which plant could tell us?', () => {
  const AA = GENOTYPES.AA,
    aa = GENOTYPES.aa;
  const seeds300 = Array.from({ length: 300 }, (_, i) => i);

  it('only the plain tester could tell', () => {
    expect(couldTell(AA)).toBe(false);
    expect(couldTell(aa)).toBe(true);
  });

  it('under the spotted tester every way of both candidates is spotted', () => {
    for (const c of ['AA', 'Aa'] as const)
      for (const r of routes(GENOTYPES[c], AA)) expect(looks(r.sprout)).toBe('spotted');
  });

  it('under the plain tester the candidates differ exactly by plain', () => {
    const a = support(routes(GENOTYPES.AA, aa));
    const b = support(routes(GENOTYPES.Aa, aa));
    expect([...b].filter((l) => !a.has(l))).toEqual(['plain']);
    expect([...a].filter((l) => !b.has(l))).toEqual([]);
  });

  it('the spotted tester grows three spotted sprouts that both candidates fit', () => {
    const rec = cantTellSprouts(AA);
    expect(rec).toEqual(['spotted', 'spotted', 'spotted']);
    expect(candidates(AA, rec)).toEqual(['AA', 'Aa']);
    expect(contradicts(AA, rec)).toBe(false);
  });

  it('the bench holds both testers, seeded, with their own colours; level 5 has none and plays the same case', () => {
    const orders = new Set<string>();
    for (const seed of seeds300) {
      const s6 = hiddenSetupFor(new Rng(seed), 6);
      const s5 = hiddenSetupFor(new Rng(seed), 5);
      expect(s5.bench).toEqual([]);
      expect(hiddenSetupFor(new Rng(seed))).toEqual(s5);
      expect({ ...s6, bench: [] }).toEqual(s5);
      expect(s6.bench.map((b) => b.key).sort()).toEqual([...TESTERS].sort());
      // The plain tester keeps the record's tester colour; the spotted one differs from the hidden plant's and the plain one's.
      expect(s6.bench.find((b) => b.key === 'aa')!.color).toBe(s6.colors[1]);
      const spotted = s6.bench.find((b) => b.key === 'AA')!.color;
      expect(s6.colors).not.toContain(spotted);
      orders.add(s6.bench.map((b) => b.key).join());
    }
    expect(orders.size).toBe(2);
  });

  it('the plain tester grows six sprouts; the accepted set is candidates of that record, both or one spot copy', () => {
    let both = 0,
      one = 0;
    for (const seed of seeds300) {
      const s = hiddenSetupFor(new Rng(seed), 6);
      const rec = testerRecord(s);
      expect(rec.length).toBe(2 * WATERING);
      expect(rec.length).toBeLessThanOrEqual(RECORD_SLOTS);
      expect(compatible(s.hidden, aa, rec)).toBe(true);
      const fit = candidates(aa, rec);
      expect(fit).toContain(s.truth);
      expect(checkCandidates(fit, aa, rec)).toEqual({ ok: true });
      if (fit.length === 2) both++;
      else one++;
      // From the choice the ghost finger reaches a passing Check.
      const chosen = new Set<Candidate>();
      for (let i = 0; i < 4; i++) {
        const st = hiddenNextStep('choose2', chosen, aa, rec)!;
        if ('check' in st) break;
        if ('choose' in st) chosen.add(st.choose);
      }
      expect(checkCandidates(chosen, aa, rec)).toEqual({ ok: true });
    }
    expect(both).toBeGreaterThan(0);
    expect(one).toBeGreaterThan(0);
  });

  it('pickStep plants the plain tester, swapping the spotted one, then waters', () => {
    expect(pickStep(null)).toEqual({ plant: 'aa' });
    expect(pickStep('AA')).toEqual({ plant: 'aa' });
    expect(pickStep('aa')).toEqual({ water: true });
  });

  it('picking has no Try one and no ghost-finger step of its own in hiddenNextStep', () => {
    expect(tryRoom('pick', 0)).toBe(0);
    expect(tryRoom('pick', 3)).toBe(0);
    expect(hiddenNextStep('pick', new Set(), aa, [])).toBeNull();
    expect(tryRoom('choose2', 6)).toBe(2);
  });

  it('levelName names level 6 and leaves 5 unchanged', () => {
    expect(levelName(6)).toBe(TESTER_NAME);
    expect(levelName(6)).toBe('Which plant could tell us?');
    expect(levelName(5)).toBe(HIDDEN_NAME);
  });
});

describe('Patchwork Conservatory (levels 7-8)', () => {
  const LEVELS = [7, 8] as const;
  const pairsOf = (n: number) => {
    const o: [number, number][] = [];
    for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) o.push([i, j]);
    return o;
  };
  const setupOf = (level: 7 | 8, seed = 1) => conservatorySetupFor(level, new Rng(seed));
  const sup = (rs: { sprout: Genotype }[]) => new Set(rs.map((r) => looks(r.sprout)));

  it('accepted pairs match the tables', () => {
    expect(acceptedPairs(BENCHES[7])).toEqual([[0, 1]]);
    expect(acceptedPairs(BENCHES[8])).toEqual([
      [0, 1],
      [0, 2],
    ]);
  });

  it('rejected pairs name a real failing route, spots checked first', () => {
    for (const lv of LEVELS) {
      const bench = BENCHES[lv];
      const acc = acceptedPairs(bench);
      for (const p of pairsOf(bench.length)) {
        const f = failingRoute(bench[p[0]], bench[p[1]]);
        const isAcc = acc.some((a) => a[0] === p[0] && a[1] === p[1]);
        if (isAcc) {
          expect(f).toBeNull();
          continue;
        }
        expect(f).not.toBeNull();
        expect(BRIEF).toContain(f!.marking);
        expect(looks(f!.route.sprout)).toBe('plain');
        const spotsFail = locusRoutes(bench[p[0]], bench[p[1]], 'spots').some(
          (r) => looks(r.sprout) === 'plain',
        );
        expect(f!.marking).toBe(spotsFail ? 'spots' : 'rim');
      }
    }
  });

  it('every route of both markings shows for accepted pairs', () => {
    for (const lv of LEVELS)
      for (const [i, j] of acceptedPairs(BENCHES[lv]))
        for (const m of MARKINGS) {
          const rs = locusRoutes(BENCHES[lv][i], BENCHES[lv][j], m);
          expect(rs).toHaveLength(4);
          rs.forEach((r) => expect(looks(r.sprout)).toBe('spotted'));
        }
  });

  it('guaranteed agrees with brute force over the sixteen combined routes', () => {
    for (const lv of LEVELS)
      for (const [i, j] of pairsOf(BENCHES[lv].length)) {
        const cr = combinedRoutes(BENCHES[lv][i], BENCHES[lv][j]);
        expect(cr).toHaveLength(16);
        expect(guaranteed(BENCHES[lv][i], BENCHES[lv][j])).toBe(cr.every((c) => c.look.spots && c.look.rim));
      }
  });

  it('combined looks are the product of the two supports (independence)', () => {
    for (const lv of LEVELS)
      for (const [i, j] of pairsOf(BENCHES[lv].length)) {
        const [l, r] = [BENCHES[lv][i], BENCHES[lv][j]];
        const got = new Set(combinedRoutes(l, r).map((c) => `${c.look.spots}/${c.look.rim}`));
        const want = new Set<string>();
        for (const a of sup(locusRoutes(l, r, 'spots')))
          for (const b of sup(locusRoutes(l, r, 'rim'))) want.add(`${a === 'spotted'}/${b === 'spotted'}`);
        expect(got).toEqual(want);
      }
  });

  it('level 7 excludes the plant showing both traits; level 8 uses one', () => {
    const both = (p: Plant2) => {
      const l = looks2(p);
      return l.spots && l.rim;
    };
    const a7 = acceptedPairs(BENCHES[7]);
    expect(a7).toHaveLength(1);
    BENCHES[7].forEach((p, k) => {
      if (both(p)) expect(a7[0]).not.toContain(k);
    });
    expect(BENCHES[7].some(both)).toBe(true);
    const a8 = acceptedPairs(BENCHES[8]);
    expect(a8).toHaveLength(2);
    expect(a8.some((p) => p.some((k) => both(BENCHES[8][k])))).toBe(true);
  });

  it('counterFor points at a hider that shows the failing marking and carries a hidden copy', () => {
    for (const lv of LEVELS) {
      const s = setupOf(lv);
      for (const p of pairsOf(s.bench.length)) {
        const c = counterFor(s, p);
        if (s.accepted.some((a) => a[0] === p[0] && a[1] === p[1])) {
          expect(c).toBeNull();
          continue;
        }
        expect(c).not.toBeNull();
        expect(c!.marking).toBe(failingRoute(s.bench[p[0]], s.bench[p[1]])!.marking);
        const anyHet = p.some((k) => hiddenCopies(s.bench[k]).includes(c!.marking));
        if (c!.hider === null) {
          expect(anyHet).toBe(false);
          expect(c!.hidden).toEqual([]);
          continue;
        }
        expect(p).toContain(c!.hider);
        expect(looks2(s.bench[c!.hider])[c!.marking]).toBe(true);
        expect(hiddenCopies(s.bench[c!.hider])).toContain(c!.marking);
        expect(c!.hidden).toEqual(hiddenCopies(s.bench[c!.hider]));
      }
    }
  });

  it('counterFor gives the authored hiders', () => {
    const s7 = setupOf(7);
    for (const p of [
      [0, 2],
      [1, 2],
    ] as const) {
      const c = counterFor(s7, p)!;
      expect(c.hider).toBe(2);
      expect(c.hidden).toEqual(['spots', 'rim']);
    }
    const s8 = setupOf(8);
    expect(counterFor(s8, [0, 3])!.hider).toBeNull();
    for (const p of [
      [1, 2],
      [2, 3],
    ] as const) {
      const c = counterFor(s8, p)!;
      expect(c.hider).toBe(2);
      expect(c.hidden).toEqual(['spots']);
    }
  });

  it('helpPair leads to an accepted pair that keeps what is potted', () => {
    const s7 = setupOf(7),
      s8 = setupOf(8);
    expect(helpPair(s7, [null, null])).toEqual([0, 1]);
    expect(helpPair(s7, [2, null])).toEqual([0, 1]);
    expect(helpPair(s8, [null, null])).toEqual([0, 1]);
    expect(helpPair(s8, [2, null])).toEqual([0, 2]);
    expect(helpPair(s8, [null, 1])).toEqual([0, 1]);
    expect(helpPair(s8, [0, null])).toEqual([0, 1]);
    expect(helpPair(s8, [null, null], [0, 1])).toEqual([0, 2]);
    for (const s of [s7, s8])
      for (const pots of [
        [null, null],
        [0, null],
        [1, null],
        [2, null],
        [3, null],
        [0, 2],
      ] as (number | null)[][])
        for (const ex of [null, [0, 1]] as (number[] | null)[]) {
          if (ex && s.level === 7) continue;
          const h = helpPair(s, pots, ex);
          expect(s.accepted.some((a) => a[0] === h[0] && a[1] === h[1])).toBe(true);
        }
  });

  it('the ghost finger reaches a correct Check from empty or wrong pots', () => {
    for (const lv of LEVELS) {
      expect(
        acceptedPairs(BENCHES[lv]).some((a) => a[0] === BOT_PAIRS[lv][0] && a[1] === BOT_PAIRS[lv][1]),
      ).toBe(true);
      for (const start of [
        [null, null],
        [lv === 7 ? 2 : 3, null],
        [null, 2],
      ] as (number | null)[][]) {
        const pots = [...start];
        const seen = new Set<Marking>();
        let steps = 0,
          done = false,
          checked = false;
        while (steps++ < 8) {
          const st = conservatoryStep(lv, pots, seen, checked);
          if ('finish' in st) {
            done = true;
            break;
          }
          if ('unpot' in st) pots[pots.indexOf(st.unpot)] = null;
          else if ('pot' in st) pots[pots.indexOf(null)] = st.pot;
          else if ('lens' in st) seen.add(st.lens);
          else if ('check' in st) {
            expect([...pots].sort()).toEqual([...BOT_PAIRS[lv]].sort());
            expect(seen.size).toBe(2);
            checked = true;
          }
        }
        expect(done).toBe(true);
        expect(steps).toBeLessThanOrEqual(8);
      }
    }
    expect(conservatoryStep(7, [0, 1], new Set(), true)).toEqual({ finish: true });
  });

  it('seeded setups keep each plant, permute places, and give distinct colours', () => {
    const ms = (g: Genotype) => [...g].sort().join('');
    for (const lv of LEVELS)
      for (const seed of SEEDS) {
        const s = conservatorySetupFor(lv, new Rng(seed));
        expect(s.level).toBe(lv);
        expect(s.bench).toHaveLength(BENCHES[lv].length);
        s.bench.forEach((p, k) => {
          for (const m of MARKINGS) expect(ms(p[m])).toBe(ms(BENCHES[lv][k][m]));
        });
        expect([...s.places].sort()).toEqual(BENCHES[lv].map((_, i) => i));
        s.colors.forEach((c) => expect(PETAL_COLORS).toContain(c));
        expect(new Set(s.colors).size).toBe(s.colors.length);
        expect(s.accepted).toEqual(acceptedPairs(BENCHES[lv]));
        expect(s.accepted).toEqual(acceptedPairs(s.bench));
      }
    expect(conservatorySetupFor(7.4, new Rng(1)).level).toBe(7);
    expect(conservatorySetupFor(8, new Rng(1)).level).toBe(8);
    const a = conservatorySetupFor(8, new Rng(5)),
      b = conservatorySetupFor(8, new Rng(5));
    expect(a).toEqual(b);
  });

  it('levelName covers 7 and 8 distinctly', () => {
    const [n6, n7, n8] = [levelName(6), levelName(7), levelName(8)];
    expect(n7.length).toBeGreaterThan(0);
    expect(n8.length).toBeGreaterThan(0);
    expect(n7).not.toBe(n8);
    expect(n7).not.toBe(n6);
    expect(n8).not.toBe(n6);
  });

  it('plantKey names each plant by both markings', () => {
    expect(BENCHES[7].map(plantKey)).toEqual(['AA-bb', 'aa-BB', 'Aa-Bb']);
    expect(BENCHES[8].map(plantKey)).toEqual(['AA-bb', 'aa-BB', 'Aa-BB', 'aa-bb']);
    for (const seed of SEEDS.slice(0, 40)) {
      expect(conservatorySetupFor(7, new Rng(seed)).bench.map(plantKey)).toEqual(['AA-bb', 'aa-BB', 'Aa-Bb']);
      expect(conservatorySetupFor(8, new Rng(seed)).bench.map(plantKey)).toEqual([
        'AA-bb',
        'aa-BB',
        'Aa-BB',
        'aa-bb',
      ]);
    }
  });
});
