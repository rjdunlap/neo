import { critterSort } from './index';
import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import {
  COUNT_PARTS,
  COUNT_PLAN,
  countParts,
  morePart,
  countSpot,
  planFor,
  exampleIndices,
  examplePlaces,
  hasNeitherMat,
  hintFor,
  neitherMat,
  MAT_RX,
  MAT_RY,
  sortPlaceAt,
  hoopCenters,
  makeRound,
  nextToSort,
  OVERLAPPING,
  placeAt,
  placeOf,
  PLANS,
  ruleToTap,
  SEPARATE,
  ENTRY_RULES,
  RULES,
  rulesFor,
  spotFor,
  type Place,
  makePlantRound,
  SPROUT_PLANS,
  PICK_PLAN,
  makePickRound,
  offerKey,
  pairWorks,
  pickOrder,
} from './logic';
import { fits, HAVE_WORDS, type PlantRule, type Rule } from '../../learning/sorting/rules';

describe('Critter Sort fresh entry rules', () => {
  const colours = ENTRY_RULES.filter((r) => !RULES.includes(r));
  it('each colour fits exactly one animal, with or without a hat', () => {
    expect(colours).toEqual(['pink', 'orange', 'yellow']);
    const kinds = ['cow', 'duck', 'pig', 'cat', 'bear', 'dog', 'bunny'] as const;
    for (const r of colours) {
      const fitting = kinds.filter(
        (k) => fits({ kind: k, hat: false }, r) && fits({ kind: k, hat: true }, r),
      );
      expect(fitting).toHaveLength(1);
    }
  });
  it('only Just a few uses them, and every such round has two fitting critters, one in and one to carry', () => {
    const seen = new Set<string>();
    for (let seed = 1; seed <= 300; seed++) {
      const rng = new Rng(seed);
      for (const level of [1, 4, 5, 6]) {
        const plan = planFor(level);
        const r = makeRound(plan, rng);
        if (colours.includes(r.rules[0])) {
          expect(level).toBe(6);
          seen.add(r.rules[0]);
          const fit = r.critters.filter((c) => fits(c, r.rules[0]));
          expect(fit).toHaveLength(2);
          expect(r.critters.some((c) => !fits(c, r.rules[0]))).toBe(true);
        }
      }
    }
    expect([...seen].sort()).toEqual(['orange', 'pink', 'yellow']);
  });
});

describe('Critter Sort', () => {
  it('preserves the younger ladder and stable school IDs, with 10 between 9 and 11', () => {
    expect(critterSort.levels('preschool').order).toEqual([6, 1]);
    expect(critterSort.levels('prek').order).toEqual([6, 1, 12, 2, 3, 13]);
    expect(critterSort.levels('school').order).toEqual([2, 12, 3, 13, 4, 5, 7, 8, 9, 10, 11]);
    expect(critterSort.entryLevels).toEqual([6]);
    expect(PLANS).toHaveLength(9);
  });

  it('level 11 counts every disjoint part from placeOf and has exactly one greatest part across seeds', () => {
    expect(planFor(11)).toBe(COUNT_PLAN);
    expect(planFor(9)).toBe(PLANS[8]);
    const winners = new Set<string>();
    for (let seed = 1; seed <= 300; seed++) {
      const r = makeRound(COUNT_PLAN, new Rng(seed));
      expect(r).toEqual(makeRound(COUNT_PLAN, new Rng(seed)));
      expect(new Set(r.critters.map((c) => `${c.kind}${c.hat}`)).size).toBe(6);
      const counts = countParts(r.critters, r.rules);
      expect(Object.values(counts).sort()).toEqual([1, 2, 3]);
      const right = morePart(counts)!;
      winners.add(right);
      for (const part of COUNT_PARTS) {
        expect(counts[part]).toBe(r.critters.filter((c) => placeOf(c, r.rules) === part).length);
        expect(counts[right]).toBeGreaterThanOrEqual(counts[part]);
      }
      // Both the sorting bot and the final counting positions stay in their proper parts.
      for (const v of [
        { w: 1024, h: 768 },
        { w: 1024, h: 1365 },
      ]) {
        const centers = hoopCenters('two', 2, v);
        const points = COUNT_PARTS.flatMap((part) =>
          Array.from({ length: counts[part] }, (_, k) => {
            const p = countSpot(centers, part, k, counts[part]);
            expect(sortPlaceAt(centers, 'two', p.x, p.y)).toBe(part);
            return p;
          }),
        );
        for (let i = 0; i < points.length; i++)
          for (let j = i + 1; j < points.length; j++) {
            expect(Math.hypot(points[i].x - points[j].x, points[i].y - points[j].y)).toBeGreaterThan(108.8);
          }
      }
    }
    expect(winners).toEqual(new Set(COUNT_PARTS));
    expect(morePart({ left: 2, right: 2, out: 2 })).toBeNull();
  });

  it('separate hoops never overlap, and overlapping hoops really do', () => {
    const kinds = ['cow', 'duck', 'pig', 'cat', 'bear', 'dog', 'bunny'] as const;
    const all = kinds.flatMap((kind) => [
      { kind, hat: false },
      { kind, hat: true },
    ]);
    for (const [a, b] of SEPARATE) expect(all.some((c) => fits(c, a) && fits(c, b))).toBe(false);
    for (const [a, b] of OVERLAPPING) {
      expect(
        all.some((c) => fits(c, a) && fits(c, b)),
        `${a} ${b}`,
      ).toBe(true);
      expect(all.some((c) => fits(c, a) && !fits(c, b))).toBe(true);
      expect(all.some((c) => !fits(c, a) && fits(c, b))).toBe(true);
    }
  });

  it('every part of the diagram gets a critter, critters are all different, and only one rule fits a guess', () => {
    for (const plan of PLANS) {
      for (let seed = 1; seed <= 200; seed++) {
        const r = makeRound(plan, new Rng(seed));
        expect(r.critters).toHaveLength(plan.critters);
        expect(new Set(r.critters.map((c) => `${c.kind}${c.hat}${!!c.scarf}`)).size).toBe(plan.critters);
        const places = new Set(
          r.critters.map((c) => placeOf(c, r.rules, plan.mode === 'butnot' ? 'butnot' : plan.mode === 'not')),
        );
        expect(places.has('out')).toBe(true);
        expect(places.has('left')).toBe(true);
        if (plan.mode === 'two')
          (expect(places.has('right')).toBe(true), expect(places.has('both')).toBe(false));
        if (plan.mode === 'venn')
          (expect(places.has('both')).toBe(true), expect(places.has('right')).toBe(true));
        if (plan.mode === 'guess') {
          expect(r.options).toHaveLength(3);
          const sortsTheSame = r.options!.filter((o) =>
            r.critters.every((c) => fits(c, o) === fits(c, r.rules[0])),
          );
          expect(sortsTheSame).toEqual([r.rules[0]]);
        }
      }
    }
  });

  it('drops a critter on the middle of its part of the diagram, in every layout and at either screen size', () => {
    for (const plan of PLANS) {
      if (plan.mode === 'guess') continue;
      const hoops = ['one', 'not', 'resort', 'butnot'].includes(plan.mode) ? 1 : 2;
      const places: Place[] = ['one', 'not', 'resort', 'butnot'].includes(plan.mode)
        ? ['left']
        : plan.mode === 'two'
          ? ['left', 'right']
          : ['left', 'right', 'both'];
      for (const v of [
        { w: 1024, h: 768 },
        { w: 1366, h: 1024 },
        { w: 768, h: 1024 },
      ]) {
        const centers = hoopCenters(plan.mode, hoops, v);
        // k = 1 is the spot the ghost finger uses; 0 is the hint's glow.
        for (const place of places)
          for (const k of [0, 1])
            expect(
              placeAt(
                centers,
                spotFor(centers, plan.mode, place, k).x,
                spotFor(centers, plan.mode, place, k).y,
              ),
              `${plan.mode} ${place} ${k}`,
            ).toBe(place);
        // Back on the grass is never a part of the diagram.
        expect(placeAt(centers, v.w / 2, v.h - 40)).toBe('out');
      }
    }
  });

  it('has a bot that sorts every critter that fits a rule, carries none that fits neither, and finishes a round without a miss (what the ghost finger plays)', () => {
    for (const plan of PLANS) {
      if (plan.mode === 'guess') continue;
      for (let seed = 1; seed <= 100; seed++) {
        const round = makeRound(plan, new Rng(seed));
        const centers = hoopCenters(plan.mode, plan.mode === 'butnot' ? 1 : round.rules.length, {
          w: 1024,
          h: 768,
        });
        const not = plan.mode === 'butnot' ? 'butnot' : plan.mode === 'not';
        const sorters = round.critters.map((c) => ({ c, placed: null as Place | null }));
        let moves = 0;
        for (
          let next = nextToSort(sorters, round.rules, not);
          next;
          next = nextToSort(sorters, round.rules, not)
        ) {
          const spot = spotFor(centers, plan.mode, next.place, 1);
          // It lands where the game puts it right, and that is the part the critter belongs in.
          expect(placeAt(centers, spot.x, spot.y), `${plan.mode} seed ${seed}`).toBe(
            placeOf(next.who.c, round.rules, not),
          );
          next.who.placed = next.place;
          moves++;
        }
        const wanted = round.critters.filter((c) => placeOf(c, round.rules, not) !== 'out');
        expect(moves).toBe(wanted.length);
        expect(
          sorters.filter((s) => s.placed === null).every((s) => placeOf(s.c, round.rules, not) === 'out'),
        ).toBe(true);
      }
    }
  });

  it('level 7 leaves exactly one newcomer and visible examples in all four places; its bot and hint select only the newcomer', () => {
    const plan = PLANS[6];
    expect(plan.newcomer).toBe(true);
    const seen = new Set<Place>();
    for (let seed = 1; seed <= 300; seed++) {
      const round = makeRound(plan, new Rng(seed));
      expect(round).toEqual(makeRound(plan, new Rng(seed)));
      expect(round.newcomer).toBeGreaterThanOrEqual(0);
      const sorters = round.critters.map((c, i) => ({
        c,
        placed: i === round.newcomer ? null : placeOf(c, round.rules),
      }));
      const who = sorters[round.newcomer!];
      const place = placeOf(who.c, round.rules);
      seen.add(place);
      expect(new Set(sorters.filter((s) => s.placed).map((s) => s.placed))).toEqual(
        new Set(['left', 'right', 'both', 'out']),
      );
      expect(sorters.filter((s) => !s.placed)).toEqual([who]);
      const next = nextToSort(sorters, round.rules, false, true)!;
      expect(next).toEqual({ who, place });
      expect(hintFor(sorters, who, round.rules, false, true)).toBe(who);
      for (const v of [
        { w: 1024, h: 768 },
        { w: 768, h: 1024 },
      ]) {
        const centers = hoopCenters(plan.mode, 2, v);
        const target = spotFor(centers, plan.mode, place, 1);
        expect(sortPlaceAt(centers, plan.mode, target.x, target.y)).toBe(place);
      }
      who.placed = place;
      expect(nextToSort(sorters, round.rules, false, true)).toBeUndefined();
    }
    expect(seen).toEqual(new Set(['left', 'right', 'both', 'out']));
  });

  it('level 8 keeps six identical critters for two distinct splitting rules, with reachable bot answers on both passes', () => {
    const plan = PLANS[7];
    expect(plan.rounds).toBe(1);
    for (let seed = 1; seed <= 300; seed++) {
      const round = makeRound(plan, new Rng(seed));
      expect(round).toEqual(makeRound(plan, new Rng(seed)));
      expect(round.nextRule).toBeDefined();
      expect(round.critters.some((c) => fits(c, round.rules[0]) !== fits(c, round.nextRule!))).toBe(true);
      for (const rule of [round.rules[0], round.nextRule!]) {
        const sorters = round.critters.map((c) => ({ c, placed: null as Place | null }));
        expect(new Set(sorters.map((s) => placeOf(s.c, [rule])))).toEqual(new Set(['left', 'out']));
        for (
          let next = nextToSort(sorters, [rule], false, true);
          next;
          next = nextToSort(sorters, [rule], false, true)
        ) {
          const centers = hoopCenters(plan.mode, 1, { w: 1024, h: 768 });
          const target = spotFor(centers, plan.mode, next.place, 1);
          expect(sortPlaceAt(centers, plan.mode, target.x, target.y)).toBe(next.place);
          expect(hintFor(sorters, next.who, [rule], false, true)).toBe(next.who);
          next.who.placed = next.place;
        }
        expect(sorters.every((s) => s.placed)).toBe(true);
      }
    }
  });

  it('level 9 accepts exactly A and not B and supplies accepted, A-and-B, and neither witnesses', () => {
    const plan = PLANS[8];
    expect(plan.mode).toBe('butnot');
    const pairs = new Set<string>();
    for (let seed = 1; seed <= 400; seed++) {
      const r = makeRound(plan, new Rng(seed));
      expect(r).toEqual(makeRound(plan, new Rng(seed)));
      pairs.add(r.rules.join());
      const [a, b] = r.rules;
      expect(r.critters.some((c) => fits(c, a) && !fits(c, b))).toBe(true);
      expect(r.critters.some((c) => fits(c, a) && fits(c, b))).toBe(true);
      expect(r.critters.some((c) => !fits(c, a) && !fits(c, b))).toBe(true);
      const sorters = r.critters.map((c) => ({ c, placed: null as Place | null }));
      for (const s of sorters) {
        expect(placeOf(s.c, r.rules, 'butnot')).toBe(fits(s.c, a) && !fits(s.c, b) ? 'left' : 'out');
        expect(hintFor(sorters, s, r.rules, 'butnot', true)).toBe(s);
      }
      for (const v of [
        { w: 1024, h: 768 },
        { w: 768, h: 1024 },
      ]) {
        const centers = hoopCenters(plan.mode, 1, v);
        for (const s of sorters) {
          const place = placeOf(s.c, r.rules, 'butnot');
          const target = spotFor(centers, plan.mode, place, 1);
          expect(sortPlaceAt(centers, plan.mode, target.x, target.y)).toBe(place);
        }
      }
      for (
        let next = nextToSort(sorters, r.rules, 'butnot', true);
        next;
        next = nextToSort(sorters, r.rules, 'butnot', true)
      )
        next.who.placed = next.place;
      expect(sorters.every((s) => s.placed)).toBe(true);
      expect(makeRound(plan, new Rng(seed), r.rules.join()).rules.join()).not.toBe(r.rules.join());
    }
    expect(pairs.size).toBeGreaterThan(6);
  });

  it('makes the not hoop the complement of its pictured rule, leaving every pictured critter outside', () => {
    const plan = PLANS.find((p) => p.mode === 'not')!;
    for (let seed = 1; seed <= 200; seed++) {
      const round = makeRound(plan, new Rng(seed));
      for (const critter of round.critters) {
        expect(placeOf(critter, round.rules, true) === 'left').toBe(!fits(critter, round.rules[0]));
        expect(placeOf(critter, round.rules, true) === 'out').toBe(fits(critter, round.rules[0]));
      }
    }
  });

  it('makes the leaf mat an explicit, reachable outside answer, keeps bare grass free, and hints the missed outsider', () => {
    for (const plan of PLANS) {
      expect(hasNeitherMat(plan.mode)).toBe(['two', 'venn', 'not', 'resort', 'butnot'].includes(plan.mode));
      for (const v of [
        { w: 1024, h: 768 },
        { w: 1366, h: 768 },
        { w: 1024, h: 1366 },
      ]) {
        const centers = hoopCenters(plan.mode, ['two', 'venn'].includes(plan.mode) ? 2 : 1, v);
        expect(sortPlaceAt(centers, plan.mode, v.w / 2, v.h - 40)).toBeNull();
        if (!hasNeitherMat(plan.mode)) continue;
        const mat = neitherMat(centers);
        expect(mat.x - MAT_RX).toBeGreaterThan(150);
        expect(mat.x + MAT_RX).toBeLessThan(v.w);
        expect(mat.y - MAT_RY).toBeGreaterThan(centers[0].y + 150);
        expect(mat.y + MAT_RY).toBeLessThan(v.h - 120);
        // The whole 100-unit center target is accepted, with no hoop overlap.
        for (const [dx, dy] of [
          [-50, 0],
          [50, 0],
          [0, -50],
          [0, 50],
        ]) {
          expect(sortPlaceAt(centers, plan.mode, mat.x + dx, mat.y + 50 + dy)).toBe('out');
        }
        for (let seed = 1; seed <= 100; seed++) {
          const r = makeRound(plan, new Rng(seed));
          const not = plan.mode === 'butnot' ? 'butnot' : plan.mode === 'not';
          const examples = exampleIndices(plan, r);
          const sorters = r.critters.map((c, i) => ({
            c,
            placed: examples.includes(i) ? placeOf(c, r.rules, not) : (null as Place | null),
          }));
          const outsider = sorters.find((s) => placeOf(s.c, r.rules, not) === 'out')!;
          expect(hintFor(sorters, outsider, r.rules, not, true)).toBe(outsider);
          let moves = 0;
          for (
            let next = nextToSort(sorters, r.rules, not, true);
            next;
            next = nextToSort(sorters, r.rules, not, true)
          ) {
            const p = spotFor(centers, plan.mode, next.place, 1);
            expect(sortPlaceAt(centers, plan.mode, p.x, p.y)).toBe(next.place);
            next.who.placed = next.place;
            moves++;
          }
          expect(moves).toBe(plan.critters - examples.length);
          expect(sorters.every((s) => s.placed !== null)).toBe(true);
          for (let k = 0; k < 4; k++) {
            const p = spotFor(centers, plan.mode, 'out', k);
            expect(sortPlaceAt(centers, plan.mode, p.x, p.y)).toBe('out');
          }
        }
      }
    }
  });

  it('taps the picture of the true rule when the critters are already sorted', () => {
    const plan = PLANS.find((p) => p.mode === 'guess')!;
    for (let seed = 1; seed <= 100; seed++) {
      const round = makeRound(plan, new Rng(seed));
      expect(round.options).toContain(ruleToTap(round));
      expect(
        round.critters.every((c) => fits(c, ruleToTap(round)) === (placeOf(c, round.rules) === 'left')),
      ).toBe(true);
    }
  });

  it('the worked-example level leaves two to sort, one fits, and the hint points at the critter she missed', () => {
    const plan = PLANS[5];
    for (let seed = 1; seed <= 200; seed++) {
      const r = makeRound(plan, new Rng(seed));
      const inHoop = r.critters.filter((c) => placeOf(c, r.rules) === 'left');
      expect(inHoop).toHaveLength(2);
      const [example] = exampleIndices(plan, r);
      expect(example).toBeGreaterThanOrEqual(0);
      const sorters = r.critters.map((c, i) => ({ c, placed: i === example ? ('left' as Place) : null }));
      const miss = sorters.find((s) => !s.placed && placeOf(s.c, r.rules) === 'left')!;
      expect(hintFor(sorters, miss, r.rules)).toBe(miss);
      const stay = sorters.find((s) => placeOf(s.c, r.rules) === 'out')!;
      expect(hintFor(sorters, stay, r.rules)).toBe(miss);
    }
  });

  it('worked examples sit in their own places (each hoop, or the middle), leave at least two to carry, and the bot and hint never touch them', () => {
    for (const [level, places] of [
      [1, ['left']],
      [2, ['left', 'right']],
      [3, ['both']],
      [5, ['left']],
    ] as const) {
      const plan = PLANS[level - 1];
      expect(examplePlaces(plan.mode)).toEqual(places);
      const not = plan.mode === 'butnot' ? 'butnot' : plan.mode === 'not';
      for (let seed = 1; seed <= 200; seed++) {
        const r = makeRound(plan, new Rng(seed));
        const ex = exampleIndices(plan, r);
        expect(ex).toHaveLength(places.length);
        expect(new Set(ex).size).toBe(ex.length);
        ex.forEach((i, k) =>
          expect(placeOf(r.critters[i], r.rules, not), `level ${level} seed ${seed}`).toBe(places[k]),
        );
        const sorters = r.critters.map((c, i) => ({
          c,
          placed: ex.includes(i) ? placeOf(c, r.rules, not) : (null as Place | null),
        }));
        const loose = sorters.filter((s) => !s.placed && placeOf(s.c, r.rules, not) !== 'out');
        expect(loose.length).toBeGreaterThanOrEqual(2);
        // The hint after a miss on a critter that stays out points at a loose critter, never an example.
        const stay = sorters.find((s) => placeOf(s.c, r.rules, not) === 'out')!;
        expect(loose).toContain(hintFor(sorters, stay, r.rules, not));
        let moves = 0;
        for (let next = nextToSort(sorters, r.rules, not); next; next = nextToSort(sorters, r.rules, not)) {
          expect(ex.map((i) => sorters[i])).not.toContain(next.who);
          next.who.placed = next.place;
          moves++;
        }
        expect(moves).toBe(loose.length);
      }
    }
    // Already sorted rounds have no example to add.
    expect(exampleIndices(PLANS[3], makeRound(PLANS[3], new Rng(1)))).toEqual([]);
  });

  it('plant levels: signs are truthful, the family varies, colour is shared, and places are derivable', () => {
    expect(planFor(12)).toBe(SPROUT_PLANS[12]);
    expect(planFor(13)).toBe(SPROUT_PLANS[13]);
    expect(planFor(9)).toBe(PLANS[8]);
    for (const level of [12, 13] as const) {
      const plan = SPROUT_PLANS[level];
      for (let seed = 0; seed < 200; seed++) {
        const rng = new Rng(seed);
        let prev: string | undefined;
        const kinds = new Set<boolean>();
        for (let round = 0; round < plan.rounds; round++) {
          const r = makePlantRound(plan, rng, prev);
          prev = r.rules.join();
          const parent = r.parent!;
          for (const rule of r.rules as PlantRule[]) {
            // Every sign shows a value the big plant actually has.
            const parentHas =
              rule === 'round'
                ? parent.leaves === 'round'
                : rule === 'pointyleaf'
                  ? parent.leaves === 'pointy'
                  : parent.petals === rule;
            expect(parentHas).toBe(true);
            expect(HAVE_WORDS[rule]).toBeTruthy();
          }
          kinds.add(r.rules[0] === 'spotted' || r.rules[0] === 'plain');
          expect(r.critters).toHaveLength(plan.critters);
          expect(
            new Set(r.critters.map((c) => `${c.plant!.leaves}${c.plant!.petals}${c.plant!.pot}`)).size,
          ).toBe(plan.critters);
          const places = r.critters.map((c) => placeOf(c, r.rules));
          if (level === 12) {
            const matching = places.filter((p) => p !== 'out').length;
            expect(r.rules).toHaveLength(1);
            expect(matching).toBeGreaterThanOrEqual(2);
            expect(matching).toBeLessThanOrEqual(3);
            expect(places).toContain('out');
          } else {
            for (const part of ['left', 'right', 'both', 'out'] as Place[]) expect(places).toContain(part);
          }
          // Brute force: each place agrees with the two features against the big plant.
          r.critters.forEach((c, i) => {
            const leaf = c.plant!.leaves === parent.leaves;
            const petal = c.plant!.petals === parent.petals;
            if (level === 13) {
              const [a, b] = r.rules.map((rule) =>
                rule === 'round' || rule === 'pointyleaf' ? leaf : petal,
              );
              expect(places[i]).toBe(a && b ? 'both' : a ? 'left' : b ? 'right' : 'out');
            } else
              expect(places[i] !== 'out').toBe(
                r.rules[0] === 'round' || r.rules[0] === 'pointyleaf' ? leaf : petal,
              );
          });
          // A worked example sits in its place and a hint always leads to an unplaced plant.
          const ex = exampleIndices(plan, r);
          expect(ex).toHaveLength(level === 13 ? 1 : 1);
          expect(ex[0]).toBeGreaterThanOrEqual(0);
          const sorters = r.critters.map((c, i) => ({
            c,
            placed: ex.includes(i) ? placeOf(c, r.rules) : (null as Place | null),
          }));
          const mat = hasNeitherMat(plan.mode);
          let moves = 0;
          for (
            let next = nextToSort(sorters, r.rules, false, mat);
            next;
            next = nextToSort(sorters, r.rules, false, mat)
          ) {
            expect(next.place).toBe(placeOf(next.who.c, r.rules));
            next.who.placed = next.place;
            moves++;
          }
          expect(moves).toBeGreaterThan(0);
          const missed = sorters.find((x) => placeOf(x.c, r.rules) !== 'out')!;
          expect(
            hintFor(
              sorters.map((x) => ({ ...x, placed: null })),
              { ...missed, placed: null },
              r.rules,
              false,
              mat,
            ),
          ).toBeTruthy();
        }
        // Level 12's second round shows the other kind of feature.
        if (level === 12) expect(kinds.size).toBe(2);
      }
    }
  });

  it('plant rules never read the pot and critter rules ignore plants', () => {
    const c = {
      kind: 'cow' as const,
      hat: false,
      plant: { leaves: 'round' as const, petals: 'plain' as const, pot: 0 },
    };
    expect(fits(c, 'round')).toBe(true);
    expect(fits({ ...c, plant: { ...c.plant, pot: 4 } }, 'round')).toBe(true);
    expect(fits(c, 'spotted')).toBe(false);
    expect(fits({ kind: 'cow', hat: true }, 'round')).toBe(false);
    expect(fits(c, 'hat')).toBe(false);
  });
});

describe('Critter Sort scarf', () => {
  const scarfLevels = PLANS.map((p, i) => ({ p, level: i + 1 })).filter(({ p }) => p.scarf);

  it('is the third look on the newcomer, new-sign and this-but-not-that levels only', () => {
    expect(scarfLevels.map((s) => s.level)).toEqual([7, 8, 9]);
    expect(fits({ kind: 'cow', hat: false, scarf: true }, 'scarf')).toBe(true);
    expect(fits({ kind: 'cow', hat: true }, 'scarf')).toBe(false);
    expect(rulesFor(PLANS[0])).toEqual(RULES);
  });

  it('old levels never deal a scarf', () => {
    for (const plan of PLANS) {
      if (plan.scarf) continue;
      for (let seed = 1; seed <= 20; seed++)
        expect(makeRound(plan, new Rng(seed)).critters.some((c) => c.scarf !== undefined)).toBe(false);
    }
  });

  it('scarf rounds keep every place in play filled and use the scarf as a rule sometimes', () => {
    let sawScarfRule = false;
    for (const { p } of scarfLevels) {
      for (let seed = 1; seed <= 60; seed++) {
        const round = makeRound(p, new Rng(seed));
        if (round.rules.includes('scarf')) sawScarfRule = true;
        const keys = round.critters.map((c) => `${c.kind}${c.hat}${!!c.scarf}`);
        expect(new Set(keys).size).toBe(keys.length);
        const not = p.mode === 'butnot' ? 'butnot' : false;
        const places = new Set(round.critters.map((c) => placeOf(c, round.rules, not)));
        expect(places.has('out')).toBe(true);
        expect(places.has('left')).toBe(true);
        if (p.mode === 'venn') expect(places.has('both')).toBe(true);
      }
    }
    expect(sawScarfRule).toBe(true);
  });
});

describe('Critter Sort level 10: Pick the signs', () => {
  const seeds = Array.from({ length: 200 }, (_, i) => i);
  const PLACES: Place[] = ['left', 'right', 'both', 'out'];
  const orderedPairs = (o: readonly Rule[]): [Rule, Rule][] => {
    const out: [Rule, Rule][] = [];
    for (const a of o) for (const b of o) if (a !== b) out.push([a, b]);
    return out;
  };
  const pairsOf = (o: readonly Rule[]): [Rule, Rule][] => [
    [o[0], o[1]],
    [o[0], o[2]],
    [o[1], o[2]],
  ];

  it('every ordered pair of offered signs meets the offer constraints and places every critter', () => {
    for (const seed of seeds) {
      const r = makePickRound(PICK_PLAN, new Rng(seed));
      expect(r.rules).toEqual([]);
      expect(r.critters).toHaveLength(6);
      const pairs = orderedPairs(r.options!);
      expect(pairs).toHaveLength(6);
      for (const [a, b] of pairs) {
        expect(r.critters.some((c) => fits(c, a))).toBe(true);
        expect(r.critters.some((c) => fits(c, b))).toBe(true);
        expect(r.critters.some((c) => !fits(c, a) && !fits(c, b))).toBe(true);
        expect(r.critters.some((c) => fits(c, a) !== fits(c, b))).toBe(true);
        expect(pairWorks(r.critters, a, b)).toBe(true);
        for (const c of r.critters) expect(PLACES).toContain(placeOf(c, [a, b]));
      }
    }
  });

  it('offers three distinct rules from the plan and the choice changes the sort', () => {
    const allowed = rulesFor(PICK_PLAN);
    for (const seed of seeds) {
      const r = makePickRound(PICK_PLAN, new Rng(seed));
      expect(r.options).toHaveLength(3);
      expect(new Set(r.options).size).toBe(3);
      for (const o of r.options!) expect(allowed).toContain(o);
      const diagrams = pairsOf(r.options!).map(([a, b]) => r.critters.map((c) => placeOf(c, [a, b])).join());
      expect(new Set(diagrams).size).toBeGreaterThanOrEqual(2);
    }
  });

  it('is deterministic per seed', () => {
    for (const seed of seeds.slice(0, 20)) {
      expect(makePickRound(PICK_PLAN, new Rng(seed))).toEqual(makePickRound(PICK_PLAN, new Rng(seed)));
    }
  });

  it('round 2 never repeats round 1 offered set, and the six critters differ', () => {
    for (const seed of seeds) {
      const rng = new Rng(seed);
      const r1 = makePickRound(PICK_PLAN, rng);
      const r2 = makePickRound(PICK_PLAN, rng, offerKey(r1.options!));
      expect(offerKey(r2.options!)).not.toBe(offerKey(r1.options!));
      for (const r of [r1, r2]) {
        const keys = r.critters.map((c) => `${c.kind}|${c.hat}|${!!c.scarf}`);
        expect(new Set(keys).size).toBe(6);
      }
    }
  });

  it('hints lead somewhere from any partly sorted state under any chosen pair', () => {
    for (const seed of seeds) {
      const r = makePickRound(PICK_PLAN, new Rng(seed));
      for (const [a, b] of orderedPairs(r.options!)) {
        const rules = [a, b];
        for (let placedCount = 0; placedCount < 6; placedCount++) {
          for (const offset of [0, 3]) {
            const sorters = r.critters.map((c, i) => ({
              c,
              placed: (i + offset) % 6 < placedCount ? placeOf(c, rules) : null,
            }));
            const next = nextToSort(sorters, rules, false, true);
            expect(next).toBeDefined();
            expect(next!.who.placed).toBeNull();
            expect(PLACES).toContain(next!.place);
            expect(next!.place).toBe(placeOf(next!.who.c, rules));
            const missed = sorters.find((s) => !s.placed)!;
            expect(hintFor(sorters, missed, rules, false, true)).toBe(missed);
          }
        }
      }
    }
  });

  it('pickOrder returns two distinct offered rules', () => {
    for (const seed of seeds) {
      const r = makePickRound(PICK_PLAN, new Rng(seed));
      const [a, b] = pickOrder(r, new Rng(seed + 1000));
      expect(a).not.toBe(b);
      expect(r.options).toContain(a);
      expect(r.options).toContain(b);
    }
  });

  it('sits on the ladder between 9 and 11 without moving anything else', () => {
    expect(planFor(10)).toBe(PICK_PLAN);
    expect(planFor(9)).toBe(PLANS[8]);
    expect(planFor(11)).toBe(COUNT_PLAN);
    expect(critterSort.levels('school').order).toEqual([2, 12, 3, 13, 4, 5, 7, 8, 9, 10, 11]);
    expect(critterSort.levels('prek').order).toEqual([6, 1, 12, 2, 3, 13]);
    expect(critterSort.levels('preschool').order).toEqual([6, 1]);
  });
});
