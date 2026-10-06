import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import { SCRIPT } from '../../content/voice-script';
import { ALPHABET, fits, FIRST_WORDS, lookalike, makeQuestions, PLANS, sounded, WORDS } from './logic';

describe('Word Monsters', () => {
  it('has a spoken sound for every letter', () => {
    for (const l of ALPHABET) expect(SCRIPT[`sound.${l}` as keyof typeof SCRIPT], l).toBeDefined();
  });

  it('always offers the answer, never twice, and never next to a lookalike', () => {
    for (const plan of PLANS) {
      for (let seed = 1; seed <= 200; seed++) {
        const qs = makeQuestions(plan, new Rng(seed));
        expect(qs).toHaveLength(plan.rounds);
        for (const q of qs) {
          expect(q.monsters).toHaveLength(plan.choices);
          expect(new Set(q.monsters).size).toBe(q.monsters.length);
          for (const l of q.answer) expect(q.monsters).toContain(l);
          // Spare letters never look like a letter already in play.
          const spares = q.monsters.filter((l) => !q.answer.includes(l));
          for (const s of spares) for (const o of q.monsters) expect(lookalike(s, o), `${s} ${o}`).toBe(false);
          if (plan.mode === 'first') expect(FIRST_WORDS[q.answer]).toBeDefined();
        }
        if (plan.mode !== 'build' && plan.mode !== 'spell' && plan.mode !== 'play') expect(new Set(qs.map((q) => q.answer)).size).toBe(qs.length);
      }
    }
  });

  it('fills a word left to right, sound by sound', () => {
    expect(WORDS.every((w) => w.length === 3)).toBe(true);
    expect(fits('cat', 0, 'c')).toBe(true);
    expect(fits('cat', 0, 'a')).toBe(false);
    expect(fits('cat', 2, 't')).toBe(true);
    expect(sounded('cat')).toBe('kuh, aah, tuh');
  });
});
