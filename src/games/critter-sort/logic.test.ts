import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import { fits, hoopCenters, makeRound, nextToSort, OVERLAPPING, placeAt, placeOf, PLANS, ruleToTap, SEPARATE, spotFor, type Place } from './logic';

describe('Critter Sort', () => {
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
        const places = new Set(r.critters.map((c) => placeOf(c, r.rules)));
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
      const hoops = plan.mode === 'one' ? 1 : 2;
      const places: Place[] = plan.mode === 'one' ? ['left'] : plan.mode === 'two' ? ['left', 'right'] : ['left', 'right', 'both'];
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
        const sorters = round.critters.map((c) => ({ c, placed: null as Place | null }));
        let moves = 0;
        for (let next = nextToSort(sorters, round.rules); next; next = nextToSort(sorters, round.rules)) {
          const spot = spotFor(centers, plan.mode, next.place, 1);
          // It lands where the game puts it right, and that is the part the critter belongs in.
          expect(placeAt(centers, spot.x, spot.y), `${plan.mode} seed ${seed}`).toBe(placeOf(next.who.c, round.rules));
          next.who.placed = next.place;
          moves++;
        }
        const wanted = round.critters.filter((c) => placeOf(c, round.rules) !== 'out');
        expect(moves).toBe(wanted.length);
        expect(sorters.filter((s) => s.placed === null).every((s) => placeOf(s.c, round.rules) === 'out')).toBe(true);
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
});
