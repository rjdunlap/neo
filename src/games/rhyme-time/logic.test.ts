import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import { FAMILIES, makeQuestions, PLANS, rhymes, wordToTap } from './logic';

describe('Rhyme Time', () => {
  it('never lists a word in two families', () => {
    const all = Object.values(FAMILIES).flat();
    expect(new Set(all).size).toBe(all.length);
  });

  it('has exactly the intended rhymes on screen: one match, one pair, or one odd one out', () => {
    for (const plan of PLANS) {
      for (let seed = 1; seed <= 300; seed++) {
        for (const q of makeQuestions(plan, new Rng(seed))) {
          expect(q.words).toHaveLength(plan.mode === 'odd' ? 4 : plan.choices);
          expect(new Set(q.words).size).toBe(q.words.length);
          for (const a of q.answer) expect(q.words).toContain(a);
          if (plan.mode === 'match') {
            expect(q.words.filter((w) => rhymes(w, q.prompt!))).toEqual(q.answer);
            expect(q.words).not.toContain(q.prompt);
          }
          if (plan.mode === 'pair') {
            const pairs = q.words.flatMap((a, i) => q.words.slice(i + 1).filter((b) => rhymes(a, b)).map((b) => [a, b]));
            expect(pairs).toHaveLength(1);
            expect([...pairs[0]].sort()).toEqual([...q.answer].sort());
          }
          if (plan.mode === 'odd') {
            const odd = q.words.filter((w) => q.words.every((o) => o === w || !rhymes(w, o)));
            expect(odd).toEqual(q.answer);
          }
        }
      }
    }
  });

  it("gives the ghost finger's bot only right taps: one for match and odd, a rhyming pair for pair", () => {
    for (const plan of PLANS) {
      for (let seed = 1; seed <= 100; seed++) {
        for (const q of makeQuestions(plan, new Rng(seed))) {
          const first = wordToTap(plan, q, null);
          expect(q.words).toContain(first);
          if (plan.mode !== 'pair') {
            expect(q.answer).toEqual([first]);
            continue;
          }
          const second = wordToTap(plan, q, first);
          expect(q.words).toContain(second);
          expect(rhymes(first, second)).toBe(true);
        }
      }
    }
  });
});
