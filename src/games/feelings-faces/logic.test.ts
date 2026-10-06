import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import { EVENTS, FEELING_PLANS, FEELINGS, feelingRound, HELPERS, NEEDS } from './logic';

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
});
