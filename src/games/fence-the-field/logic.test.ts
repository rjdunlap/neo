import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import {
  FULL,
  LEVELS,
  Misses,
  PLANS,
  PLOTS,
  RAILS,
  SYMMETRIES,
  best,
  canonical,
  completes,
  countOpen,
  describeLevel,
  drop,
  fits,
  gain,
  hint,
  kindOf,
  openPlots,
  openRails,
  petChoices,
  petReply,
  pickStart,
  readyPlots,
  runOf,
  runs,
  shortGive,
  sound,
  soundRails,
  transform,
  turnEndsOnLeaveTwo,
  value,
  type Pools,
} from './logic';
import pools from './pools.json';

const POOLS = pools as Pools;
const every = PLANS.flatMap((plan) => POOLS[plan.level].map((mask) => [plan.level, mask] as const));

/** The solver's answer the slow way: plain minimax with no memory, counting plots for the mover. */
function brute(mask: number): number {
  if (mask === FULL) return 0;
  let top = -Infinity;
  for (let e = 0; e < RAILS; e++) {
    if (mask & (1 << e)) continue;
    const k = completes(mask, e).length;
    const after = brute(mask | (1 << e));
    top = Math.max(top, k ? k + after : -after);
  }
  return top;
}

/** Play a round out: `hers` picks her rail, `pets` the pet's. Returns the plots she ends with. */
function playOut(start: number, hers: (m: number) => number, pets: (m: number) => number): number {
  let mask = start,
    her = 0,
    turn = true;
  while (mask !== FULL) {
    const e = turn ? hers(mask) : pets(mask);
    const k = completes(mask, e).length;
    mask |= 1 << e;
    if (turn) her += k;
    if (!k) turn = !turn;
  }
  return her;
}

describe('Fence the Field: the field and the solver', () => {
  it('has 24 rails, each beside one or two plots, and each plot four rails', () => {
    expect(openRails(0)).toHaveLength(24);
    expect(openPlots(0)).toBe(PLOTS);
    expect(readyPlots(0)).toEqual([]);
    // The top-left plot: its top, bottom, left and right rails close it, and only the fourth claims.
    const three = (1 << 0) | (1 << 3) | (1 << 12);
    expect(readyPlots(three)).toEqual([0]);
    expect(completes(three, 13)).toEqual([0]);
    expect(kindOf(three, 13)).toBe('claim');
  });

  it('agrees with a brute-force count on small positions', () => {
    const rng = new Rng(11);
    let checked = 0;
    for (const [, start] of every) {
      // Lay rails until seven are open, then compare.
      let mask = start;
      while (countOpen(mask) > 7) mask |= 1 << rng.pick(openRails(mask));
      expect(value(mask)).toBe(brute(mask));
      if (++checked >= 40) break;
    }
  });

  it('counts a target between none and all of the open plots, and a sound rail always exists', () => {
    for (const [, mask] of every) {
      expect(Number.isInteger(best(mask))).toBe(true);
      expect(best(mask)).toBeGreaterThanOrEqual(0);
      expect(best(mask)).toBeLessThanOrEqual(PLOTS);
      expect(soundRails(mask).length).toBeGreaterThan(0);
      for (const e of openRails(mask)) {
        expect(drop(mask, e)).toBeGreaterThanOrEqual(0);
        expect(gain(mask, e) === best(mask)).toBe(sound(mask, e));
      }
    }
  });

  it('keeps the value under each of the eight symmetries', () => {
    expect(new Set(SYMMETRIES.map((s) => s.join())).size).toBe(8);
    for (const s of SYMMETRIES) expect([...s].sort((a, b) => a - b)).toEqual([...Array(RAILS).keys()]);
    for (const [, mask] of every.slice(0, 30))
      for (let s = 0; s < 8; s++) {
        expect(value(transform(mask, s))).toBe(value(mask));
        expect(canonical(transform(mask, s))).toBe(canonical(mask));
      }
  });
});

describe('Fence the Field: the pools', () => {
  it('registers and describes all four levels', () => {
    expect(LEVELS).toEqual({ grownup: { min: 1, max: 4 } });
    expect(new Set(PLANS.map((p) => describeLevel(p.level))).size).toBe(4);
  });

  it('holds 60 distinct classes a level, each its own representative', () => {
    for (const plan of PLANS) {
      const pool = POOLS[plan.level];
      expect(pool).toHaveLength(60);
      expect(new Set(pool).size).toBe(60);
      for (const mask of pool) expect(canonical(mask)).toBe(mask);
    }
  });

  it.each(every)("level %i's position %i passes its level's test", (level, mask) => {
    expect(fits(level, mask)).toBe(true);
  });

  it('shows what each level teaches on the first rail', () => {
    for (const mask of POOLS[1]) {
      expect(readyPlots(mask).length).toBeGreaterThan(0);
      expect(soundRails(mask).every((e) => kindOf(mask, e) === 'claim')).toBe(true);
      expect(soundRails(mask).length).toBeLessThan(countOpen(mask));
      expect(hint(mask, 1).kind).toBe('claim');
    }
    for (const mask of POOLS[2]) {
      expect(readyPlots(mask)).toEqual([]);
      expect(soundRails(mask).every((e) => kindOf(mask, e) === 'safe')).toBe(true);
      expect(openRails(mask).some((e) => kindOf(mask, e) === 'give' && !sound(mask, e))).toBe(true);
      expect(hint(mask, 2).kind).toBe('safe');
    }
    for (const mask of POOLS[3]) {
      // Every rail gives; the hint gives the shortest run, a run of two by its middle rail.
      expect(openRails(mask).every((e) => kindOf(mask, e) === 'give')).toBe(true);
      const h = hint(mask, 3);
      expect(['run1', 'run2', 'run3', 'loop']).toContain(h.kind);
      expect(shortGive(mask, h.rail, true)).toBe(true);
      // And some give into a longer run costs a plot.
      const shortest = Math.min(...runs(mask).map((r) => r.plots.length));
      expect(openRails(mask).some((e) => !sound(mask, e) && runOf(mask, e)!.plots.length > shortest)).toBe(
        true,
      );
    }
  });

  it('level 4: only a leave-two finishes the turn well, and taking the whole run is played on until the pet takes plots', () => {
    for (const start of POOLS[4]) {
      expect(turnEndsOnLeaveTwo(start)).toBe(true);
      // The glow is a claim or the leave-two itself, and the line is the plan.
      expect(hint(start, 4).kind).toBe('leave-two');
      // Follow the hinted claims until the hint is the leave-two itself: then claiming the last two costs a plot.
      let mask = start;
      while (kindOf(mask, hint(mask, 4).rail) !== 'leave-two') {
        expect(kindOf(mask, hint(mask, 4).rail)).toBe('claim');
        mask |= 1 << hint(mask, 4).rail;
      }
      const greedy = openRails(mask).filter((e) => completes(mask, e).length && !sound(mask, e));
      expect(greedy.length).toBeGreaterThan(0);
      // Show me why plays her own claims and the rail she must give, then the pet's answer, which hands plots over.
      for (const e of greedy) {
        const reply = petReply(mask, e);
        expect(reply.steps[0].who).toBe('her');
        expect(reply.steps.at(-1)!.who).toBe('pet');
        expect(reply.handed).toBeGreaterThan(0);
      }
    }
  });

  it('deals a pool position under a symmetry, never the last class again', () => {
    const rng = new Rng(5);
    let last: number | undefined;
    for (let i = 0; i < 200; i++) {
      const start = pickStart(POOLS[2], rng, last);
      expect(start.klass).not.toBe(last);
      expect(canonical(start.mask)).toBe(start.klass);
      expect(start.target).toBe(best(start.klass));
      expect(fits(2, start.mask)).toBe(true);
      last = start.klass;
    }
  });
});

describe('Fence the Field: turns, misses and hints', () => {
  it('counts one miss for each distinct unsound rail at a position', () => {
    const m = new Misses();
    expect(m.count(5, 3)).toBe(true);
    expect(m.count(5, 3)).toBe(false);
    expect(m.count(5, 4)).toBe(true);
    expect(m.count(6, 3)).toBe(true);
  });

  it('hints only sound rails, and following them against a sound pet ends on her target', () => {
    const rng = new Rng(23);
    for (const [level, mask] of every) {
      const hinted = (m: number) => {
        const h = hint(m, level);
        expect(sound(m, h.rail)).toBe(true);
        return h.rail;
      };
      expect(playOut(mask, hinted, (m) => petChoices(m)[0])).toBe(best(mask));
      expect(playOut(mask, hinted, (m) => rng.pick(petChoices(m)))).toBe(best(mask));
    }
  });

  it('has the pet claim when a claim is sound, and play an unsound rail on until the pet has taken plots', () => {
    for (const [, mask] of every) {
      const choices = petChoices(mask);
      expect(choices.every((e) => sound(mask, e))).toBe(true);
      if (choices.some((e) => completes(mask, e).length))
        expect(choices.every((e) => completes(mask, e).length > 0)).toBe(true);
      for (const e of openRails(mask).filter((x) => !sound(mask, x))) {
        const reply = petReply(mask, e);
        let m = mask | (1 << e),
          handed = 0,
          who = completes(mask, e).length ? 'her' : 'pet';
        for (const step of reply.steps) {
          // Best play on both sides, turns passing on a rail that claims nothing.
          const k = completes(m, step.rail).length;
          expect(sound(m, step.rail)).toBe(true);
          expect(step.who).toBe(who);
          if (step.who === 'pet') handed += k;
          if (!k) who = who === 'her' ? 'pet' : 'her';
          m |= 1 << step.rail;
        }
        expect(reply.handed).toBe(handed);
        // It stops on her turn once the pet has taken a plot, or on the last rail; a costly rail always hands some.
        expect(handed).toBeGreaterThan(0);
        expect(m === FULL || who === 'her').toBe(true);
      }
    }
  });
});
