import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import { restPoints } from '../../creatures/companion';
import { SPECIES_IDS } from '../../creatures/species';
import { bubbleToTap, CARE_ONLY, CARE_SCENARIOS, choiceToTap, EVENTS, FACE_MAX_GROW, FACE_PARTS, faceFrame, FEELING_PLANS, FEELINGS, feelingRound, HELPERS, NEEDS, playDone, type Feeling } from './logic';

describe('Feelings Faces questions', () => {
  it('always offer the answer once among distinct choices, without repeating a prompt back to back', () => {
    for (const plan of FEELING_PLANS.filter((p) => p.mode !== 'play')) {
      for (let seed = 1; seed <= 200; seed++) {
        const qs = feelingRound(plan, new Rng(seed));
        expect(qs).toHaveLength(plan.rounds);
        qs.forEach((q, i) => {
          expect(q.options, `${plan.name} seed ${seed}`).toHaveLength(plan.choices);
          expect(new Set(q.options).size).toBe(q.options.length);
          expect(q.options.filter((o) => o === q.answer)).toHaveLength(1);
          if (i > 0) expect(q.prompt).not.toBe(qs[i - 1].prompt);
        });
      }
    }
  });

  it('matches each need and event to one unambiguous answer', () => {
    expect(new Set(Object.values(HELPERS)).size).toBe(NEEDS.length);
    expect(Object.keys(EVENTS)).toHaveLength(8);
    for (const feeling of Object.values(EVENTS)) expect(FEELINGS).toContain(feeling);
    // Every feeling has a happening that causes it, so a round can ask for each.
    for (const feeling of FEELINGS) expect(Object.values(EVENTS)).toContain(feeling);
    const help = feelingRound(FEELING_PLANS.find((p) => p.mode === 'help')!, new Rng(3));
    for (const q of help) expect(q.answer).toBe(HELPERS[q.prompt as keyof typeof HELPERS]);
  });

  it('shows four different happenings in a level-6 round, drawn from the whole pool', () => {
    const plan = FEELING_PLANS.find((p) => p.mode === 'why')!;
    const seen = new Set<string>();
    for (let seed = 1; seed <= 200; seed++) {
      const qs = feelingRound(plan, new Rng(seed));
      expect(new Set(qs.map((q) => q.prompt)).size).toBe(4);
      for (const q of qs) expect(q.answer).toBe(EVENTS[q.prompt as keyof typeof EVENTS]);
      qs.forEach((q) => seen.add(q.prompt));
    }
    expect(seen).toEqual(new Set(Object.keys(EVENTS)));
  });

  it('pairs each level-8 happening with a need and its helper, four different happenings a round', () => {
    for (const scenario of Object.values(CARE_SCENARIOS)) expect(HELPERS[scenario.need]).toBe(scenario.helper);
    // Between them the happenings ask for every helper, and the care-only ones never reach level 6.
    expect(new Set(Object.values(CARE_SCENARIOS).map((c) => c.helper))).toEqual(new Set(Object.values(HELPERS)));
    for (const e of CARE_ONLY) expect(Object.keys(EVENTS)).not.toContain(e);
    const plan = FEELING_PLANS.find((p) => p.mode === 'care')!;
    for (let seed = 1; seed <= 200; seed++) {
      const qs = feelingRound(plan, new Rng(seed));
      expect(qs).toHaveLength(4);
      expect(new Set(qs.map((q) => q.prompt)).size).toBe(4);
      // Four different happenings ask for at least three different helpers.
      expect(new Set(qs.map((q) => q.answer)).size).toBeGreaterThanOrEqual(3);
      for (const q of qs) {
        const scenario = CARE_SCENARIOS[q.prompt as keyof typeof CARE_SCENARIOS];
        expect(q.answer).toBe(scenario.helper);
        expect(q.options).toHaveLength(4);
        expect(new Set(q.options).size).toBe(4);
        expect(q.options[choiceToTap(q)]).toBe(scenario.helper);
      }
    }
  });

  it('shows every friend a different feeling on the friends level', () => {
    const plan = FEELING_PLANS.find((p) => p.mode === 'friends')!;
    for (const q of feelingRound(plan, new Rng(9))) expect([...q.options].sort()).toEqual([...FEELINGS].sort());
  });

  it("touches the one choice that answers every question, on every level and seed (the demonstration's finger)", () => {
    for (const plan of FEELING_PLANS.filter((p) => p.mode !== 'play')) {
      for (let seed = 1; seed <= 200; seed++) {
        for (const q of feelingRound(plan, new Rng(seed))) {
          const at = choiceToTap(q);
          expect(at, `${plan.name} seed ${seed}`).toBeGreaterThanOrEqual(0);
          expect(q.options[at]).toBe(q.answer);
          // The friends level deals each friend the feeling at their place, so the friend touched shows the one asked for.
          if (plan.mode === 'friends') expect(q.options.filter((o) => o === q.options[at])).toHaveLength(1);
          if (plan.mode === 'help') expect(q.options[at]).toBe(HELPERS[q.prompt as keyof typeof HELPERS]);
          if (plan.mode === 'why') expect(q.options[at]).toBe(EVENTS[q.prompt as keyof typeof EVENTS]);
        }
      }
    }
  });

  it('ends free play after every feeling and six taps, or twelve taps of anything', () => {
    expect(playDone(new Set(FEELINGS), 5)).toBe(false);
    expect(playDone(new Set(FEELINGS), 6)).toBe(true);
    expect(playDone(new Set<Feeling>(['happy', 'sad']), 11)).toBe(false);
    expect(playDone(new Set<Feeling>(['happy']), 12)).toBe(true);
  });

  it('plays free play for the demonstration by showing each feeling once, then finishing, with no wasted taps', () => {
    const tried = new Set<Feeling>();
    let taps = 0;
    const order: Feeling[] = [];
    while (!playDone(tried, taps) && taps < 20) {
      const f = bubbleToTap(tried, taps);
      order.push(f);
      tried.add(f);
      taps++;
    }
    expect(playDone(tried, taps)).toBe(true);
    expect(tried.size).toBe(FEELINGS.length);
    expect(taps).toBe(6);
    // The first four taps show four different feelings; only then does it repeat.
    expect(new Set(order.slice(0, 4)).size).toBe(4);
  });
});

describe('Feelings Faces cards frame the companion’s face (RW05 slice 2)', () => {
  it('grows every species’ face to fill the card, its parts inside the window, without blurring past the cap', () => {
    for (const s of SPECIES_IDS) {
      const points = FACE_PARTS.flatMap((p) => restPoints(s, p));
      expect(points.length, s).toBeGreaterThanOrEqual(5);
      for (const size of [150, 128]) {
        const f = faceFrame(points, size);
        expect(f.scale, s).toBeLessThanOrEqual(FACE_MAX_GROW);
        const on = points.map((p) => ({ x: p.x * f.scale + f.x, y: p.y * f.scale + f.y }));
        // Every part sits well inside the window (the bubble's is a circle of 74).
        for (const p of on) expect(Math.hypot(p.x, p.y), `${s} ${size}`).toBeLessThan(size / 2);
        // The face is at least a third of the card across: the pip's whole-body card gave the river's about 18 units.
        const span = Math.max(Math.max(...on.map((p) => p.x)) - Math.min(...on.map((p) => p.x)), Math.max(...on.map((p) => p.y)) - Math.min(...on.map((p) => p.y)));
        expect(span, `${s} ${size}`).toBeGreaterThan(size / 3);
      }
    }
  });
});
