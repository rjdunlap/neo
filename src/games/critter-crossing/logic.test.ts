import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import { fits } from '../critter-sort/logic';
import { bestTest, consistent, gateKey, gateWords, makeRound, nextStep, passes, PLANS, planFor, sameGate, type CrossPlan, type CrossRound, type Gate } from './logic';

const hatBrown: Gate = { kind: 'and', rules: ['hat', 'brown'] };

describe('Critter Crossing', () => {
  it('lets a critter across by one rule, its opposite, or two rules together', () => {
    const bearHat = { kind: 'bear', hat: true } as const;
    const catBare = { kind: 'cat', hat: false } as const;
    expect(passes(bearHat, { kind: 'one', rule: 'hat' })).toBe(true);
    expect(passes(catBare, { kind: 'one', rule: 'hat' })).toBe(false);
    expect(passes(catBare, { kind: 'not', rule: 'hat' })).toBe(true);
    expect(passes(bearHat, hatBrown)).toBe(true);
    expect(passes({ kind: 'cat', hat: true }, hatBrown)).toBe(false);
    expect(passes({ kind: 'bear', hat: false }, hatBrown)).toBe(false);
    for (const k of ['cow', 'bear', 'dog'] as const) expect(passes({ kind: k, hat: false }, { kind: 'one', rule: 'floppy' })).toBe(fits({ kind: k, hat: false }, 'floppy'));
  });

  it('names a rule in words, and an "and" is the same either way round', () => {
    expect(gateWords({ kind: 'one', rule: 'hat' })).toBe('wearing a hat');
    expect(gateWords({ kind: 'not', rule: 'hat' })).toBe('not wearing a hat');
    expect(gateWords(hatBrown)).toBe('wearing a hat and brown');
    expect(sameGate(hatBrown, { kind: 'and', rules: ['brown', 'hat'] })).toBe(true);
    expect(gateKey({ kind: 'one', rule: 'hat' })).not.toBe(gateKey({ kind: 'not', rule: 'hat' }));
  });

  it('climbs: more critters to try, more pictures, more to try before guessing', () => {
    // From the first secret rule on (the visible level is a different kind of round).
    PLANS.slice(2).forEach((p, i) => {
      expect(p.critters, p.name).toBeGreaterThanOrEqual(PLANS[i + 1].critters);
      expect(p.minTests, p.name).toBeGreaterThanOrEqual(PLANS[i + 1].minTests);
    });
    expect(PLANS[0].mode).toBe('visible');
    for (const p of PLANS.filter((x) => x.mode === 'hidden')) {
      expect(p.options, p.name).toBeGreaterThanOrEqual(3);
      expect(p.minTests, p.name).toBeLessThan(p.critters);
    }
    expect(planFor(0)).toBe(PLANS[0]);
    expect(planFor(99)).toBe(PLANS.at(-1));
  });

  it('every round has some critters who cross and some who wait, all different', () => {
    for (const plan of PLANS) {
      for (let seed = 1; seed <= 80; seed++) {
        const r = makeRound(plan, new Rng(seed));
        expect(r.critters, plan.name).toHaveLength(plan.critters);
        expect(new Set(r.critters.map((c) => `${c.kind}${c.hat}`)).size).toBe(plan.critters);
        const yes = r.critters.filter((c) => passes(c, r.gate)).length;
        expect(yes, `${plan.name} #${seed}`).toBeGreaterThan(0);
        expect(yes, `${plan.name} #${seed}`).toBeLessThan(plan.critters);
      }
    }
  });

  it('a hidden rule can always be worked out: the true picture is offered and the rest are ruled out by the critters', () => {
    for (const plan of PLANS.filter((p) => p.mode === 'hidden')) {
      for (let seed = 1; seed <= 120; seed++) {
        const r = makeRound(plan, new Rng(seed));
        expect(r.options, plan.name).toHaveLength(plan.options);
        expect(r.options.filter((g) => sameGate(g, r.gate)), `${plan.name} #${seed}`).toHaveLength(1);
        expect(new Set(r.options.map(gateKey)).size).toBe(plan.options);
        const all = r.critters.map((c) => ({ c, passed: passes(c, r.gate) }));
        const left = consistent(r.options, all);
        expect(left, `${plan.name} #${seed}`).toHaveLength(1);
        expect(sameGate(left[0], r.gate)).toBe(true);
        // A wrong picture is wrong for a reason a critter shows.
        for (const g of r.options.filter((o) => !sameGate(o, r.gate))) expect(r.critters.some((c) => passes(c, g) !== passes(c, r.gate)), `${plan.name} #${seed}`).toBe(true);
      }
    }
  });

  it('the kinds of rule a level uses are the ones it says', () => {
    for (let seed = 1; seed <= 40; seed++) {
      expect(makeRound(PLANS[1], new Rng(seed)).options.every((g) => g.kind === 'one')).toBe(true);
      expect(makeRound(PLANS[3], new Rng(seed)).options.every((g) => g.kind === 'and')).toBe(true);
    }
    const kinds = new Set<string>();
    for (let seed = 1; seed <= 80; seed++) for (const g of makeRound(PLANS[4], new Rng(seed)).options) kinds.add(g.kind);
    expect([...kinds].sort()).toEqual(['and', 'not', 'one']);
  });

  it('does not repeat the last rule when asked not to', () => {
    for (let seed = 1; seed <= 40; seed++) {
      const first = makeRound(PLANS[1], new Rng(seed));
      expect(sameGate(makeRound(PLANS[1], new Rng(seed + 500), gateKey(first.gate)).gate, first.gate)).toBe(false);
    }
  });

  it('the most useful critter to try next narrows the pictures, and trying them one by one always gets there', () => {
    for (const plan of PLANS.filter((p) => p.mode === 'hidden')) {
      for (let seed = 1; seed <= 60; seed++) {
        const r = makeRound(plan, new Rng(seed));
        const tried: typeof r.critters = [];
        const evidence: { c: (typeof r.critters)[number]; passed: boolean }[] = [];
        let left = r.options.length;
        for (let step = 0; step < r.critters.length; step++) {
          const next = bestTest(r.critters, tried, r.options, evidence);
          if (!next) break;
          tried.push(next);
          evidence.push({ c: next, passed: passes(next, r.gate) });
          const now = consistent(r.options, evidence).length;
          expect(now, `${plan.name} #${seed}`).toBeLessThan(left + 1);
          left = now;
          // The true picture is never ruled out.
          expect(consistent(r.options, evidence).some((g) => sameGate(g, r.gate))).toBe(true);
        }
        expect(left, `${plan.name} #${seed}`).toBe(1);
        // Once one picture is left, no critter is worth trying.
        expect(bestTest(r.critters, tried, r.options, evidence)).toBeNull();
      }
    }
  });

  describe("the demonstration's finger", () => {
    /** Plays a round the way the game does: a critter sent to the gate crosses if it fits, and the finger goes on from what it saw. */
    const play = (round: CrossRound, plan: CrossPlan) => {
      const tried: { c: (typeof round.critters)[number]; passed: boolean }[] = [];
      for (let guard = 0; guard < round.critters.length + 3; guard++) {
        const step = nextStep(round, plan, tried);
        if (!step) return { tried, guess: null };
        if (step.do === 'guess') return { tried, guess: step.gate };
        expect(tried.some((t) => t.c === step.critter), 'a critter is sent only once').toBe(false);
        tried.push({ c: step.critter, passed: passes(step.critter, round.gate) });
      }
      throw new Error('the finger did not finish the round');
    };

    it('on a visible round sends exactly the critters that fit, and none that would be turned back', () => {
      const plan = PLANS.find((p) => p.mode === 'visible')!;
      for (let seed = 1; seed <= 300; seed++) {
        const round = makeRound(plan, new Rng(seed));
        const { tried, guess } = play(round, plan);
        expect(guess).toBeNull();
        expect(tried.every((t) => t.passed), `seed ${seed}`).toBe(true);
        expect(tried.length).toBe(round.critters.filter((c) => passes(c, round.gate)).length);
      }
    });

    it('on a hidden round tries critters until the true rule is the only one left, and guesses it once the button is awake', () => {
      for (const plan of PLANS.filter((p) => p.mode === 'hidden')) {
        for (let seed = 1; seed <= 400; seed++) {
          const round = makeRound(plan, new Rng(seed));
          const { tried, guess } = play(round, plan);
          expect(guess, `${plan.name} seed ${seed}`).not.toBeNull();
          expect(sameGate(guess!, round.gate), `${plan.name} seed ${seed}: guessed the true rule`).toBe(true);
          expect(tried.length, 'enough tried for the guess button to wake').toBeGreaterThanOrEqual(plan.minTests);
          expect(tried.length).toBeLessThanOrEqual(round.critters.length);
          // Its guess fits everything it saw, so it can never be a wrong answer.
          expect(consistent([guess!], tried)).toHaveLength(1);
        }
      }
    });

    it('does not try more critters than it needs once the rule is certain', () => {
      for (const plan of PLANS.filter((p) => p.mode === 'hidden')) {
        for (let seed = 1; seed <= 400; seed++) {
          const round = makeRound(plan, new Rng(seed));
          const { tried } = play(round, plan);
          const before = tried.slice(0, -1);
          // Dropping the last critter tried would have left it unfinished: not enough tried, or not yet certain.
          const needMore = before.length < plan.minTests || consistent(round.options, before).length > 1;
          expect(needMore, `${plan.name} seed ${seed}`).toBe(true);
        }
      }
    });

    it('sends a waiting critter when the evidence is already decisive but the button has not woken', () => {
      const plan = PLANS.find((p) => p.mode === 'hidden' && p.minTests >= 3)!;
      let sawDecisiveEarly = false;
      for (let seed = 1; seed <= 400; seed++) {
        const round = makeRound(plan, new Rng(seed));
        const tried: { c: (typeof round.critters)[number]; passed: boolean }[] = [];
        for (;;) {
          const step = nextStep(round, plan, tried);
          if (!step || step.do === 'guess') break;
          if (tried.length < plan.minTests && consistent(round.options, tried).length === 1) sawDecisiveEarly = true;
          tried.push({ c: step.critter, passed: passes(step.critter, round.gate) });
        }
      }
      expect(sawDecisiveEarly).toBe(true);
    });
  });
});
