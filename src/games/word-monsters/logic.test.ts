import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import { SCRIPT } from '../../content/voice-script';
import { ALPHABET, END_WORDS, fits, FIRST_WORDS, lookalike, makeQuestions, nextMonster, PLANS, sounded, WORDS } from './logic';

describe('Word Monsters', () => {
  it('has a spoken sound for every letter', () => {
    for (const l of ALPHABET) expect(SCRIPT[`sound.${l}` as keyof typeof SCRIPT], l).toBeDefined();
    expect(SCRIPT['monster.end']).toBeDefined();
  });

  it('always offers the answer, never twice, and never next to a lookalike', () => {
    for (const plan of PLANS) {
      for (let seed = 1; seed <= 200; seed++) {
        const qs = makeQuestions(plan, new Rng(seed));
        expect(qs).toHaveLength(plan.rounds);
        for (const q of qs) {
          expect(q.monsters).toHaveLength(plan.choices);
          expect(new Set(q.monsters).size).toBe(q.monsters.length);
          // Word families offer first sounds; the ending already stands in the slots.
          if (plan.mode === 'family') expect(q.fixed).toBe(q.answer.slice(1)), expect(q.monsters).toContain(q.answer[0]);
          else if (plan.mode === 'end') {
            expect(q.fixed).toBe(q.answer.slice(0, 2));
            expect(END_WORDS).toContain(q.answer);
            expect(q.monsters).toContain(q.answer[2]);
            expect(q.monsters.filter((letter) => END_WORDS.some((word) => word.startsWith(q.fixed!) && word[2] === letter))).toEqual([q.answer[2]]);
          }
          else for (const l of q.answer) expect(q.monsters).toContain(l);
          // Spare letters never look like a letter already in play.
          const spares = q.monsters.filter((l) => !q.answer.includes(l));
          for (const s of spares) for (const o of q.monsters) expect(lookalike(s, o), `${s} ${o}`).toBe(false);
          if (plan.mode === 'first') expect(FIRST_WORDS[q.answer]).toBeDefined();
        }
        if (plan.mode !== 'build' && plan.mode !== 'spell' && plan.mode !== 'play') expect(new Set(qs.map((q) => q.answer)).size).toBe(qs.length);
        if (plan.mode === 'family') expect(new Set(qs.map((q) => q.fixed)).size).toBe(2);
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

  it('has a bot that plays every level with no wrong tap and no wrong drop (what the ghost finger plays)', () => {
    for (const plan of PLANS) {
      for (let seed = 1; seed <= 100; seed++) {
        const questions = makeQuestions(plan, new Rng(seed));
        if (plan.mode === 'play') {
          // Free play: every monster in turn, round and round, until the round's taps are done.
          const monsters = questions[0].monsters.map((letter) => ({ letter, placed: false }));
          const heard = new Set<string>();
          for (let taps = 0; taps < plan.rounds; taps++) heard.add(nextMonster(plan, questions[0], monsters, 0, taps)!.letter);
          expect(heard.size, `${plan.mode} seed ${seed}`).toBe(Math.min(monsters.length, plan.rounds));
          continue;
        }
        for (const q of questions) {
          const building = plan.mode === 'build' || plan.mode === 'spell' || plan.mode === 'family' || plan.mode === 'end';
          // A word family's ending already stands in the slots, as monsters that cannot be picked up.
          const monsters = [...q.monsters.map((letter) => ({ letter, placed: false })), ...(q.fixed ?? '').split('').filter(Boolean).map((letter) => ({ letter, placed: true }))];
          if (!building) {
            const pick = nextMonster(plan, q, monsters, 0, 0);
            expect(pick?.letter, `${plan.mode} seed ${seed}`).toBe(q.answer);
            continue;
          }
          // Drop the letter for each empty slot in turn; the game takes it only if it is that slot's letter.
          let filled = plan.mode === 'end' ? 2 : 0;
          let drops = 0;
          while (filled < q.answer.length) {
            const pick = nextMonster(plan, q, monsters, filled, 0);
            expect(pick, `${plan.mode} ${q.answer} slot ${filled}`).toBeDefined();
            expect(pick!.placed).toBe(false);
            expect(fits(q.answer, filled, pick!.letter)).toBe(true);
            pick!.placed = true;
            // In a word family the first sound finishes the word, as in the game.
            filled = q.fixed ? q.answer.length : filled + 1;
            drops++;
          }
          expect(drops).toBe(q.fixed ? 1 : q.answer.length);
        }
      }
    }
  });
});
