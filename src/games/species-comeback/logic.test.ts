import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import {
  NEEDS,
  NOTE_FITS,
  PLANS,
  REASONS,
  REASON_FITS,
  SITES,
  allowed,
  ancestors,
  best,
  blocking,
  byId,
  candidates,
  extend,
  fits,
  hatch,
  helpFor,
  judge,
  keeperPlans,
  kin,
  makeRound,
  missing,
  ordered,
  pickSites,
  plans,
  relatedPairs,
  sharedRelative,
  suits,
  tempting,
  usesEvery,
  type Pair,
  type Tree,
  type Turtle,
} from './logic';

/** The definition's first round: Fern and Reed with Moss, Brook and Willow; Sorrel and Pine with Dune and Ash. */
function firstTree(): Tree {
  const t = (
    id: number,
    name: string,
    sex: 'f' | 'm',
    parents: [number, number] | null,
    gen: number,
  ): Turtle => ({ id, name, sex, parents, gen, tint: 0 });
  return {
    turtles: [
      t(0, 'Fern', 'f', null, 0),
      t(1, 'Reed', 'm', null, 0),
      t(2, 'Sorrel', 'f', null, 0),
      t(3, 'Pine', 'm', null, 0),
      t(4, 'Moss', 'f', [0, 1], 1),
      t(5, 'Brook', 'm', [0, 1], 1),
      t(6, 'Willow', 'f', [0, 1], 1),
      t(7, 'Dune', 'm', [2, 3], 1),
      t(8, 'Ash', 'f', [2, 3], 1),
    ],
    nested: [],
  };
}

/** Level 2's: Moss and Dune nested and have Lichen and Marsh; a third family of Thistle and Sage. */
function secondTree(): Tree {
  const tree = firstTree();
  const t = (
    id: number,
    name: string,
    sex: 'f' | 'm',
    parents: [number, number] | null,
    gen: number,
  ): Turtle => ({ id, name, sex, parents, gen, tint: 0 });
  tree.turtles.push(
    t(9, 'Bramble', 'f', null, 0),
    t(10, 'Flint', 'm', null, 0),
    t(11, 'Thistle', 'm', [9, 10], 1),
    t(12, 'Sage', 'f', [9, 10], 1),
  );
  tree.turtles.push(t(13, 'Lichen', 'f', [4, 7], 2), t(14, 'Marsh', 'm', [4, 7], 2));
  tree.nested = [[4, 7]];
  return tree;
}

const seeds = (n: number) => Array.from({ length: n }, (_, i) => i * 7919 + 13);
const planKey = (plan: readonly Pair[]) =>
  plan
    .map((p) => p.join('-'))
    .sort()
    .join(',');
const sameSet = (a: readonly Pair[], b: readonly Pair[]) => planKey(a) === planKey(b);

describe('kin', () => {
  it('reads parents and grandparents', () => {
    const tree = secondTree();
    expect([...ancestors(tree, 0, 2)]).toEqual([]);
    expect([...ancestors(tree, 5, 2)].sort()).toEqual([0, 1]);
    expect([...ancestors(tree, 13, 2)].sort((a, b) => a - b)).toEqual([0, 1, 2, 3, 4, 7]);
  });

  it('is symmetric and catches siblings, cousins and an uncle, never strangers', () => {
    const tree = secondTree();
    for (const [a, b] of [
      [4, 5],
      [13, 14],
      [13, 5],
      [13, 8],
    ] as const) {
      expect(kin(tree, a, b, 2)).toBe(true);
      expect(kin(tree, b, a, 2)).toBe(true);
    }
    expect(kin(tree, 13, 5, 1)).toBe(false);
    expect(kin(tree, 0, 1, 2)).toBe(false);
    expect(kin(tree, 13, 11, 2)).toBe(false);
    expect(kin(tree, 5, 8, 2)).toBe(false);
  });

  it('names the shared relative and what she is to each', () => {
    const tree = secondTree();
    const sib = sharedRelative(tree, 4, 5)!;
    expect(byId(tree, sib.id).name).toBe('Fern');
    expect([sib.toA, sib.toB]).toEqual(['mother', 'mother']);
    const uncle = sharedRelative(tree, 5, 13)!;
    expect(byId(tree, uncle.id).name).toBe('Fern');
    expect([uncle.toA, uncle.toB]).toEqual(['mother', 'grandmother']);
  });
});

describe('pairs and plans', () => {
  it('rejects same-sex pairs, kin and a turtle already in a nest', () => {
    const tree = firstTree();
    expect(judge(tree, [], 4, 6, 1)).toBe('same-sex');
    expect(judge(tree, [], 4, 5, 1)).toBe('kin');
    expect(judge(tree, [[4, 7]], 8, 7, 1)).toBe('taken');
    expect(allowed(tree, [], 4, 7, 1)).toBe(true);
  });

  it('lists every maximal plan once, each valid', () => {
    const tree = firstTree();
    const all = plans(tree, 1);
    const keys = all.map((p) =>
      p
        .map((x) => x.join('-'))
        .sort()
        .join(','),
    );
    expect(new Set(keys).size).toBe(keys.length);
    for (const p of all) {
      const used = p.flat();
      expect(new Set(used).size).toBe(used.length);
      for (const [a, b] of p) expect(allowed(tree, [], a, b, 1)).toBe(true);
    }
    // The definition's two plans: Moss–Dune with Ash–Brook, and Willow–Dune with Ash–Brook.
    expect(keys).toContain(
      [
        [4, 7],
        [8, 5],
      ]
        .map((x) => x.join('-'))
        .sort()
        .join(','),
    );
    expect(keys).toContain(
      [
        [6, 7],
        [8, 5],
      ]
        .map((x) => x.join('-'))
        .sort()
        .join(','),
    );
    expect(best(tree, 1)).toBe(2);
  });

  it('candidates leave out founders and the pair who nested', () => {
    expect(candidates(secondTree()).sort((a, b) => a - b)).toEqual([5, 6, 8, 11, 12, 13, 14]);
  });
});

describe('rounds', () => {
  for (const p of PLANS.filter((x) => !x.keeper)) {
    it(`level ${p.level} meets its conditions over 500 seeds`, () => {
      for (const seed of seeds(500)) {
        const r = makeRound(p.level, new Rng(seed));
        const { tree } = r;
        expect(tree.turtles.filter((t) => t.gen === 0)).toHaveLength(p.founders * 2);
        expect(tree.turtles.filter((t) => t.gen === 1)).toHaveLength(p.young.reduce((a, b) => a + b, 0));
        const third = tree.turtles.filter((t) => t.gen === 2).length;
        expect(third).toBeGreaterThanOrEqual(p.third[0]);
        expect(third).toBeLessThanOrEqual(p.third[1]);
        expect(new Set(tree.turtles.map((t) => t.name)).size).toBe(tree.turtles.length);
        expect(candidates(tree).length).toBeLessThanOrEqual(10);
        expect(r.target).toBe(best(tree, p.depth));
        expect(plans(tree, p.depth).filter((x) => x.length === r.target).length).toBeGreaterThanOrEqual(2);
        const tempt = tempting(tree, p.depth);
        expect(tempt.length).toBeGreaterThan(0);
        if (p.depth === 2) expect(tempt.some(([a, b]) => !kin(tree, a, b, 1))).toBe(true);
        expect(fits(tree, p)).toBe(true);
        if (p.site) expect(r.sites).toHaveLength(3);
      }
    });
  }

  it('the same seed gives the same round', () => {
    for (const level of [1, 2, 3, 4])
      expect(makeRound(level, new Rng(42))).toEqual(makeRound(level, new Rng(42)));
  });
});

describe('help', () => {
  it('every prefix of a full plan extends', () => {
    for (const seed of seeds(60))
      for (const level of [1, 2]) {
        const r = makeRound(level, new Rng(seed));
        for (const full of plans(r.tree, r.plan.depth).filter((x) => x.length === r.target)) {
          for (let k = 0; k <= full.length; k++) {
            const done = extend(r.tree, full.slice(0, k), r.plan.depth, r.target);
            expect(done).not.toBeNull();
            expect(done!.slice(0, k)).toEqual(full.slice(0, k));
            for (const [a, b] of done!) expect(allowed(r.tree, [], a, b, r.plan.depth)).toBe(true);
          }
        }
      }
  });

  it('a blocked plan always has a nest to undo, and undoing as told reaches a plan that extends', () => {
    let blocked = 0;
    for (const seed of seeds(120))
      for (const level of [1, 2]) {
        const r = makeRound(level, new Rng(seed));
        const { tree } = r,
          depth = r.plan.depth;
        // Every short maximal plan is a dead end she could reach.
        for (const dead of plans(tree, depth).filter((x) => x.length < r.target)) {
          blocked++;
          let plan: Pair[] = dead.slice();
          expect(extend(tree, plan, depth, r.target)).toBeNull();
          let steps = 0;
          while (!extend(tree, plan, depth, r.target)) {
            const help = helpFor(tree, plan, depth, r.target);
            expect(help.kind).toBe('undo');
            if (help.kind !== 'undo') break;
            plan = plan.filter((_, i) => i !== help.nest);
            steps++;
          }
          expect(steps).toBeGreaterThan(0);
          if (dead.length === 1)
            expect(
              extend(
                tree,
                dead.filter((_, i) => i !== blocking(tree, dead, depth, r.target)),
                depth,
                r.target,
              ),
            ).not.toBeNull();
        }
      }
    expect(blocked).toBeGreaterThan(0);
  });

  it('points at the next good pair while the plan can finish, then at Spring', () => {
    const tree = firstTree();
    const h = helpFor(tree, [], 1, 2);
    expect(h.kind).toBe('pair');
    expect(
      helpFor(
        tree,
        [
          [4, 7],
          [8, 5],
        ],
        1,
        2,
      ).kind,
    ).toBe('spring');
  });
});

describe('hatching', () => {
  it('adds two hatchlings per nest with both parents and four grandparents', () => {
    const tree = secondTree();
    const plan: Pair[] = [ordered(tree, 13, 11), ordered(tree, 12, 5), ordered(tree, 8, 14)].filter(
      (p) => byId(tree, p[0]).sex === 'f',
    ) as Pair[];
    const before = tree.turtles.length;
    const born = hatch(tree, plan, new Rng(3));
    expect(born).toHaveLength(plan.length * 2);
    expect(tree.turtles.length).toBe(before + born.length);
    expect(new Set(tree.turtles.map((t) => t.name)).size).toBe(tree.turtles.length);
    for (const h of born) {
      expect(h.parents).not.toBeNull();
      const gp = new Set(h.parents!.flatMap((p) => byId(tree, p).parents ?? []));
      for (const g of gp) expect(ancestors(tree, h.id, 2).has(g)).toBe(true);
    }
  });

  it('never runs out of names, even at the largest tree', () => {
    for (const seed of seeds(100)) {
      const r = makeRound(2, new Rng(seed));
      const full = extend(r.tree, [], 2, r.target)!;
      hatch(r.tree, full, new Rng(seed));
      expect(r.tree.turtles.every((t) => !!t.name)).toBe(true);
      expect(new Set(r.tree.turtles.map((t) => t.name)).size).toBe(r.tree.turtles.length);
    }
  });
});

describe('sites', () => {
  it('two of the three suit and the third lacks exactly one need', () => {
    for (const seed of seeds(200)) {
      const s = pickSites(new Rng(seed));
      expect(s.filter(suits)).toHaveLength(2);
      const bad = s.filter((x) => !suits(x));
      expect(bad).toHaveLength(1);
      expect(missing(bad[0])).toHaveLength(1);
    }
  });

  it('every need is missing somewhere, and quiet never decides', () => {
    for (const n of NEEDS) expect(SITES.some((s) => missing(s).includes(n))).toBe(true);
    expect(SITES.some((s) => suits(s) && !s.features.includes('quiet'))).toBe(true);
    expect(SITES.some((s) => !suits(s) && s.features.includes('quiet'))).toBe(true);
  });
});

describe("the keeper's two plans (level 4)", () => {
  const rounds = seeds(500).map((seed) => makeRound(4, new Rng(seed)));

  it('draws four founder pairs, nine young and two nested pairs with two young each: nine candidates', () => {
    for (const { tree, plan } of rounds) {
      expect(plan.level).toBe(4);
      expect(tree.turtles.filter((t) => t.gen === 0)).toHaveLength(8);
      expect(tree.turtles.filter((t) => t.gen === 1)).toHaveLength(9);
      expect(tree.turtles.filter((t) => t.gen === 2)).toHaveLength(4);
      expect(tree.nested).toHaveLength(2);
      expect(new Set(tree.nested.flat()).size).toBe(4);
      for (const [f, m] of tree.nested) {
        expect([byId(tree, f).sex, byId(tree, m).sex]).toEqual(['f', 'm']);
        expect(kin(tree, f, m, 1)).toBe(false);
        expect(tree.turtles.filter((t) => t.parents?.[0] === f && t.parents?.[1] === m)).toHaveLength(2);
      }
      expect(tree.turtles.every((t) => !!t.name)).toBe(true);
      expect(new Set(tree.turtles.map((t) => t.name)).size).toBe(tree.turtles.length);
      expect(candidates(tree)).toHaveLength(9);
    }
  });

  it('Plan A is a largest sibling-free plan with a related pair, Plan B a largest plan with none, and A is larger', () => {
    for (const { tree, keeper } of rounds) {
      const k = keeper!;
      const loose = plans(tree, 1),
        strict = plans(tree, 2);
      expect(loose.some((x) => sameSet(x, k.a))).toBe(true);
      expect(strict.some((x) => sameSet(x, k.b))).toBe(true);
      expect(k.a.length).toBe(best(tree, 1));
      expect(k.b.length).toBe(best(tree, 2));
      expect(k.a.length).toBeGreaterThan(k.b.length);
      expect(k.a.length).toBeGreaterThanOrEqual(3);
      expect(k.a.length).toBeLessThanOrEqual(4);
      expect(k.b.length).toBeGreaterThanOrEqual(2);
      expect(k.b.length).toBeLessThanOrEqual(3);
      expect(relatedPairs(tree, k.a)).toBeGreaterThan(0);
      expect(relatedPairs(tree, k.b)).toBe(0);
      // Both follow the rule the level states: one mother and one father, never brother and sister, nobody twice.
      for (const plan of [k.a, k.b]) {
        expect(new Set(plan.flat()).size).toBe(plan.length * 2);
        for (const [f, m] of plan) {
          expect(judge(tree, [], f, m, 1)).toBe('ok');
          expect(byId(tree, f).sex).toBe('f');
        }
      }
      expect(keeperPlans(tree)).toEqual({ a: k.a, b: k.b });
    }
  });

  it('each note fits exactly one plan, the round asks for that plan, and both notes come up', () => {
    expect(NOTE_FITS).toEqual({ room: 'b', big: 'a' });
    const seen = new Set<string>();
    for (const { keeper, target, sites } of rounds) {
      const k = keeper!;
      seen.add(k.note);
      expect(k.fits).toBe(NOTE_FITS[k.note]);
      expect(target).toBe(k[k.fits].length);
      expect(sites).toHaveLength(3);
    }
    expect([...seen].sort()).toEqual(['big', 'room']);
  });

  it('the reason cards: the first fits A, the second fits B, and no plan in any seed uses every turtle', () => {
    expect(REASONS).toEqual(['more', 'apart', 'every']);
    expect(REASON_FITS).toEqual({ more: 'a', apart: 'b', every: null });
    for (const { tree, keeper } of rounds) {
      const k = keeper!;
      // What each card says is true of the plan it fits and false of the other.
      expect(k.a.length > k.b.length).toBe(true);
      expect(relatedPairs(tree, k.b) < relatedPairs(tree, k.a)).toBe(true);
      for (const plan of [...plans(tree, 1), ...plans(tree, 2)]) expect(usesEvery(tree, plan)).toBe(false);
    }
  });

  it('the chosen plan hatches two each without running out of names, and levels 1 to 3 never see the keeper', () => {
    for (const seed of seeds(100)) {
      const r = makeRound(4, new Rng(seed));
      const young = hatch(r.tree, r.keeper!.a, new Rng(seed));
      expect(young).toHaveLength(r.keeper!.a.length * 2);
      expect(r.tree.turtles.every((t) => !!t.name)).toBe(true);
      expect(new Set(r.tree.turtles.map((t) => t.name)).size).toBe(r.tree.turtles.length);
    }
    for (const level of [1, 2, 3]) expect(makeRound(level, new Rng(7)).keeper).toBeNull();
  });
});
