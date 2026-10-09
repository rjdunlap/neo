import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import { bubbleToTap, choiceToTap, EVENTS, FEELING_PLANS, FEELINGS, feelingRound, HELPERS, NEEDS, playDone, type Feeling } from './logic';

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
    for (const feeling of Object.values(EVENTS)) expect(FEELINGS).toContain(feeling);
    expect(new Set(Object.values(EVENTS)).size).toBe(Object.keys(EVENTS).length);
    const help = feelingRound(FEELING_PLANS.find((p) => p.mode === 'help')!, new Rng(3));
    for (const q of help) expect(q.answer).toBe(HELPERS[q.prompt as keyof typeof HELPERS]);
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
