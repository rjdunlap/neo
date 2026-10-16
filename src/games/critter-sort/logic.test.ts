import { critterSort } from './index';
import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import { exampleIndices, examplePlaces, fits, hasNeitherMat, hintFor, neitherMat, MAT_RX, MAT_RY, sortPlaceAt, hoopCenters, makeRound, nextToSort, OVERLAPPING, placeAt, placeOf, PLANS, ruleToTap, SEPARATE, spotFor, type Place } from './logic';

describe('Critter Sort', () => {
  it('preserves the younger ladder and stable school IDs, appending only 7 after 5', () => {
    expect(critterSort.levels('prek').order).toEqual([6, 1, 2, 3]);
    expect(critterSort.levels('school').order).toEqual([2, 3, 4, 5, 7]);
    expect(critterSort.entryLevels).toEqual([6]);
    expect(PLANS).toHaveLength(7);
  });

  it('separate hoops never overlap, and overlapping hoops really do', () => {
    const kinds = ['cow', 'duck', 'pig', 'cat', 'bear', 'dog', 'bunny'] as const;
    const all = kinds.flatMap((kind) => [{ kind, hat: false }, { kind, hat: true }]);
    for (const [a, b] of SEPARATE) expect(all.some((c) => fits(c, a) && fits(c, b))).toBe(false);
    for (const [a, b] of OVERLAPPING) {
      expect(all.some((c) => fits(c, a) && fits(c, b)), `${a} ${b}`).toBe(true);
      expect(all.some((c) => fits(c, a) && !fits(c, b))).toBe(true);
      expect(all.some((c) => !fits(c, a) && fits(c, b))).toBe(true);
    }
  });

  it('every part of the diagram gets a critter, critters are all different, and only one rule fits a guess', () => {
    for (const plan of PLANS) {
      for (let seed = 1; seed <= 200; seed++) {
        const r = makeRound(plan, new Rng(seed));
        expect(r.critters).toHaveLength(plan.critters);
        expect(new Set(r.critters.map((c) => `${c.kind}${c.hat}`)).size).toBe(plan.critters);
        const places = new Set(r.critters.map((c) => placeOf(c, r.rules, plan.mode === 'not')));
        expect(places.has('out')).toBe(true);
        expect(places.has('left')).toBe(true);
        if (plan.mode === 'two') expect(places.has('right')).toBe(true), expect(places.has('both')).toBe(false);
        if (plan.mode === 'venn') expect(places.has('both')).toBe(true), expect(places.has('right')).toBe(true);
        if (plan.mode === 'guess') {
          expect(r.options).toHaveLength(3);
          const sortsTheSame = r.options!.filter((o) => r.critters.every((c) => fits(c, o) === fits(c, r.rules[0])));
          expect(sortsTheSame).toEqual([r.rules[0]]);
        }
      }
    }
  });

  it('drops a critter on the middle of its part of the diagram, in every layout and at either screen size', () => {
    for (const plan of PLANS) {
      if (plan.mode === 'guess') continue;
      const hoops = plan.mode === 'one' || plan.mode === 'not' ? 1 : 2;
      const places: Place[] = plan.mode === 'one' || plan.mode === 'not' ? ['left'] : plan.mode === 'two' ? ['left', 'right'] : ['left', 'right', 'both'];
      for (const v of [{ w: 1024, h: 768 }, { w: 1366, h: 1024 }, { w: 768, h: 1024 }]) {
        const centers = hoopCenters(plan.mode, hoops, v);
        // k = 1 is the spot the ghost finger uses; 0 is the hint's glow.
        for (const place of places) for (const k of [0, 1]) expect(placeAt(centers, spotFor(centers, plan.mode, place, k).x, spotFor(centers, plan.mode, place, k).y), `${plan.mode} ${place} ${k}`).toBe(place);
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
        const centers = hoopCenters(plan.mode, round.rules.length, { w: 1024, h: 768 });
        const not = plan.mode === 'not';
        const sorters = round.critters.map((c) => ({ c, placed: null as Place | null }));
        let moves = 0;
        for (let next = nextToSort(sorters, round.rules, not); next; next = nextToSort(sorters, round.rules, not)) {
          const spot = spotFor(centers, plan.mode, next.place, 1);
          // It lands where the game puts it right, and that is the part the critter belongs in.
          expect(placeAt(centers, spot.x, spot.y), `${plan.mode} seed ${seed}`).toBe(placeOf(next.who.c, round.rules, not));
          next.who.placed = next.place;
          moves++;
        }
        const wanted = round.critters.filter((c) => placeOf(c, round.rules, not) !== 'out');
        expect(moves).toBe(wanted.length);
        expect(sorters.filter((s) => s.placed === null).every((s) => placeOf(s.c, round.rules, not) === 'out')).toBe(true);
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
      const sorters = round.critters.map((c, i) => ({ c, placed: i === round.newcomer ? null : placeOf(c, round.rules) }));
      const who = sorters[round.newcomer!];
      const place = placeOf(who.c, round.rules);
      seen.add(place);
      expect(new Set(sorters.filter(s => s.placed).map(s => s.placed))).toEqual(new Set(['left', 'right', 'both', 'out']));
      expect(sorters.filter(s => !s.placed)).toEqual([who]);
      const next = nextToSort(sorters, round.rules, false, true)!;
      expect(next).toEqual({ who, place });
      expect(hintFor(sorters, who, round.rules, false, true)).toBe(who);
      for (const v of [{ w: 1024, h: 768 }, { w: 768, h: 1024 }]) {
        const centers = hoopCenters(plan.mode, 2, v);
        const target = spotFor(centers, plan.mode, place, 1);
        expect(sortPlaceAt(centers, plan.mode, target.x, target.y)).toBe(place);
      }
      who.placed = place;
      expect(nextToSort(sorters, round.rules, false, true)).toBeUndefined();
    }
    expect(seen).toEqual(new Set(['left', 'right', 'both', 'out']));
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
      expect(hasNeitherMat(plan.mode)).toBe(['two', 'venn', 'not'].includes(plan.mode));
      for (const v of [{ w: 1024, h: 768 }, { w: 1366, h: 768 }, { w: 1024, h: 1366 }]) {
        const centers = hoopCenters(plan.mode, ['two', 'venn'].includes(plan.mode) ? 2 : 1, v);
        expect(sortPlaceAt(centers, plan.mode, v.w / 2, v.h - 40)).toBeNull();
        if (!hasNeitherMat(plan.mode)) continue;
        const mat = neitherMat(centers);
        expect(mat.x - MAT_RX).toBeGreaterThan(150);
        expect(mat.x + MAT_RX).toBeLessThan(v.w);
        expect(mat.y - MAT_RY).toBeGreaterThan(centers[0].y + 150);
        expect(mat.y + MAT_RY).toBeLessThan(v.h - 120);
        // The whole 100-unit center target is accepted, with no hoop overlap.
        for (const [dx, dy] of [[-50, 0], [50, 0], [0, -50], [0, 50]]) {
          expect(sortPlaceAt(centers, plan.mode, mat.x + dx, mat.y + 50 + dy)).toBe('out');
        }
        for (let seed = 1; seed <= 100; seed++) {
          const r = makeRound(plan, new Rng(seed));
          const not = plan.mode === 'not';
          const examples = exampleIndices(plan, r);
          const sorters = r.critters.map((c, i) => ({ c, placed: examples.includes(i) ? placeOf(c, r.rules, not) : null as Place | null }));
          const outsider = sorters.find((s) => placeOf(s.c, r.rules, not) === 'out')!;
          expect(hintFor(sorters, outsider, r.rules, not, true)).toBe(outsider);
          let moves = 0;
          for (let next = nextToSort(sorters, r.rules, not, true); next; next = nextToSort(sorters, r.rules, not, true)) {
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
      expect(round.critters.every((c) => fits(c, ruleToTap(round)) === (placeOf(c, round.rules) === 'left'))).toBe(true);
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
    for (const [level, places] of [[1, ['left']], [2, ['left', 'right']], [3, ['both']], [5, ['left']]] as const) {
      const plan = PLANS[level - 1];
      expect(examplePlaces(plan.mode)).toEqual(places);
      const not = plan.mode === 'not';
      for (let seed = 1; seed <= 200; seed++) {
        const r = makeRound(plan, new Rng(seed));
        const ex = exampleIndices(plan, r);
        expect(ex).toHaveLength(places.length);
        expect(new Set(ex).size).toBe(ex.length);
        ex.forEach((i, k) => expect(placeOf(r.critters[i], r.rules, not), `level ${level} seed ${seed}`).toBe(places[k]));
        const sorters = r.critters.map((c, i) => ({ c, placed: ex.includes(i) ? placeOf(c, r.rules, not) : (null as Place | null) }));
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
});
