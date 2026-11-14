import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import { SCRIPT } from '../../content/voice-script';
import { landing, levelsInOrder, stepLevel } from '../../progress/difficulty';
import {
  ALPHABET,
  BIG_LEVEL,
  BIG_PLAN,
  LAST_LEVEL,
  LAST_PLAN,
  LAST_WORDS,
  LEVELS,
  REPAIR_LEVEL,
  REPAIR_PLAN,
  SLOW_LEVEL,
  SLOW_PLAN,
  SLOW_WORDS,
  bigLetters,
  planFor,
  END_WORDS,
  FAMILIES,
  fits,
  FIRST_WORDS,
  lookalike,
  makeQuestions,
  soundTwin,
  WHO_POOL,
  nextMonster,
  PLANS,
  sounded,
  WORDS,
  PICTURE_WORDS,
  SOUNDS,
  RIMES,
} from './logic';
import { wordPicture } from './pictures';

describe('Word Monsters', () => {
  it('level 9 opens lap with one big monster per touch, six different letters, each leaving a picture', () => {
    expect(planFor(BIG_LEVEL)).toBe(BIG_PLAN);
    expect(BIG_PLAN).toMatchObject({ mode: 'play', big: true, rounds: 6, choices: 1 });
    expect(levelsInOrder(LEVELS.lap!)).toEqual([BIG_LEVEL, 1]);
    expect(stepLevel(BIG_LEVEL, 1, LEVELS.lap!)).toBe(1);
    // A saved 9 carried into toddler starts toddler at its own level 1; no other band reaches 9.
    expect(landing(BIG_LEVEL, LEVELS.toddler!, [BIG_LEVEL])).toBe(1);
    for (const band of ['toddler', 'preschool', 'prek', 'school'] as const)
      expect(levelsInOrder(LEVELS[band]!)).not.toContain(BIG_LEVEL);
    // The ladder's levels 1–8 are unchanged; school skips lap's 9.
    expect(levelsInOrder(LEVELS.school!)).toEqual([5, 6, 7, 8, LAST_LEVEL, SLOW_LEVEL, REPAIR_LEVEL]);
    for (let level = 1; level <= PLANS.length; level++) expect(planFor(level)).toBe(PLANS[level - 1]);
    expect(SCRIPT['monster.big']).toBeDefined();
    for (let seed = 1; seed <= 200; seed++) {
      const letters = bigLetters(new Rng(seed));
      expect(letters).toHaveLength(BIG_PLAN.rounds);
      expect(new Set(letters).size).toBe(BIG_PLAN.rounds);
      for (const l of letters) {
        expect(FIRST_WORDS[l], l).toBeDefined();
        expect(SCRIPT[`sound.${l}` as keyof typeof SCRIPT], l).toBeDefined();
      }
    }
  });

  it('builds words for every short vowel, at least three each and evenly spread, none holding a mirror pair', () => {
    const counts = [...'aeiou'].map((v) => WORDS.filter((w) => w[1] === v).length);
    expect(Math.min(...counts)).toBeGreaterThanOrEqual(3);
    expect(Math.max(...counts) - Math.min(...counts)).toBeLessThanOrEqual(1);
    expect(new Set(WORDS).size).toBe(WORDS.length);
    for (const w of WORDS) {
      expect(w).toMatch(/^[a-z][aeiou][a-z]$/);
      // No mirror-image pair (b d p q) or i beside l inside one word: building it would ask her to tell them apart.
      expect([...w].filter((l) => 'bdpq'.includes(l)).length, w).toBeLessThanOrEqual(1);
      expect(w.includes('i') && w.includes('l'), w).toBe(false);
    }
    // Several start with a sound she can stretch while blending.
    expect(WORDS.filter((w) => 'fmnlrs'.includes(w[0])).length).toBeGreaterThanOrEqual(6);
  });

  it('keeps word families of at least three words that share the ending and start with a plain sound', () => {
    expect(RIMES).toEqual(expect.arrayContaining(['en', 'et', 'ug']));
    for (const rime of RIMES) {
      const words = FAMILIES[rime];
      expect(words.length, rime).toBeGreaterThanOrEqual(3);
      expect(new Set(words).size).toBe(words.length);
      for (const w of words) expect(w.slice(1), w).toBe(rime);
      for (const w of words) expect('qxyaeiou'.includes(w[0]), w).toBe(false);
    }
  });

  it('draws a picture for every word a building level can ask for', () => {
    const asked = new Set<string>([...WORDS, ...END_WORDS, ...RIMES.flatMap((r) => FAMILIES[r])]);
    expect(new Set(PICTURE_WORDS)).toEqual(asked);
    for (const word of PICTURE_WORDS) {
      const p = wordPicture(word);
      const b = p.getBounds();
      expect(b.width, word).toBeGreaterThan(120);
      expect(b.height, word).toBeGreaterThan(80);
      p.destroy({ children: true });
    }
  });

  it('has a spoken sound for every letter', () => {
    for (const l of ALPHABET) expect(SCRIPT[`sound.${l}` as keyof typeof SCRIPT], l).toBeDefined();
    expect(SCRIPT['monster.end']).toBeDefined();
  });

  it('always offers the answer, never twice, and never next to a lookalike', () => {
    for (const plan of [...PLANS, LAST_PLAN, SLOW_PLAN]) {
      for (let seed = 1; seed <= 200; seed++) {
        const qs = makeQuestions(plan, new Rng(seed));
        expect(qs).toHaveLength(plan.rounds);
        for (const q of qs) {
          expect(q.monsters).toHaveLength(plan.choices);
          expect(new Set(q.monsters).size).toBe(q.monsters.length);
          // Word families offer first sounds; the ending already stands in the slots.
          if (plan.mode === 'family')
            (expect(q.fixed).toBe(q.answer.slice(1)), expect(q.monsters).toContain(q.answer[0]));
          else if (plan.mode === 'end') {
            expect(q.fixed).toBe(q.answer.slice(0, 2));
            expect(END_WORDS).toContain(q.answer);
            expect(q.monsters).toContain(q.answer[2]);
            expect(
              q.monsters.filter((letter) =>
                END_WORDS.some((word) => word.startsWith(q.fixed!) && word[2] === letter),
              ),
            ).toEqual([q.answer[2]]);
          } else for (const l of q.answer) expect(q.monsters).toContain(l);
          // Spare letters never look like a letter already in play.
          const spares = q.monsters.filter((l) => !q.answer.includes(l));
          for (const s of spares)
            for (const o of q.monsters) expect(lookalike(s, o), `${s} ${o}`).toBe(false);
          if (plan.mode === 'first') expect(FIRST_WORDS[q.answer]).toBeDefined();
        }
        if (plan.mode !== 'build' && plan.mode !== 'spell' && plan.mode !== 'play')
          expect(new Set(qs.map((q) => q.answer)).size).toBe(qs.length);
        if (plan.mode === 'family') expect(new Set(qs.map((q) => q.fixed)).size).toBe(2);
      }
    }
  });

  it('never offers two letters with the same sound, and keeps q and x out of "who says"', () => {
    expect(soundTwin('c', 'k')).toBe(true);
    for (const plan of [...PLANS, LAST_PLAN, SLOW_PLAN]) {
      for (let seed = 1; seed <= 200; seed++) {
        for (const q of makeQuestions(plan, new Rng(seed))) {
          for (const a of q.monsters)
            for (const b of q.monsters) expect(soundTwin(a, b), `${plan.mode} ${a} ${b}`).toBe(false);
          if (plan.mode === 'who') expect(q.monsters.some((l) => 'qx'.includes(l))).toBe(false);
        }
      }
    }
    expect(WHO_POOL).not.toContain('q');
  });

  it('level 10 asks for the last sound of a pictured word, with varied endings and the first sound sometimes a decoy', () => {
    expect(planFor(LAST_LEVEL)).toBe(LAST_PLAN);
    expect(LAST_PLAN).toMatchObject({ mode: 'last', choices: 3 });
    expect(SCRIPT['monster.last']).toBeDefined();
    // A saved 8 steps up to 10; lap's 9 carried into school starts school at its easiest, never at the big monster.
    expect(stepLevel(8, 1, LEVELS.school!)).toBe(LAST_LEVEL);
    expect(landing(BIG_LEVEL, LEVELS.school!, [BIG_LEVEL])).toBe(5);
    for (const w of LAST_WORDS) {
      expect(PICTURE_WORDS, w).toContain(w);
      expect(w.endsWith('x'), w).toBe(false);
    }
    let firstDecoys = 0;
    let questions = 0;
    const ends = new Set<string>();
    for (let seed = 1; seed <= 300; seed++) {
      const qs = makeQuestions(LAST_PLAN, new Rng(seed));
      expect(qs).toHaveLength(LAST_PLAN.rounds);
      expect(new Set(qs.map((q) => q.word)).size).toBe(qs.length);
      for (const q of qs) {
        questions++;
        const word = q.word!;
        expect(LAST_WORDS, word).toContain(word);
        // The answer is the word's last letter, and only that monster says it.
        expect(q.answer).toBe(word[word.length - 1]);
        expect(q.monsters.filter((l) => SOUNDS[l] === SOUNDS[q.answer])).toEqual([q.answer]);
        expect(new Set(q.monsters.map((l) => SOUNDS[l])).size).toBe(q.monsters.length);
        expect(q.monsters.some((l) => 'qx'.includes(l))).toBe(false);
        ends.add(q.answer);
        if (word[0] !== q.answer && q.monsters.includes(word[0])) firstDecoys++;
      }
    }
    // Endings beyond t, g, n and p turn up, and the word's first sound is a decoy in a fair share of questions.
    expect(ends.size).toBeGreaterThanOrEqual(5);
    expect(firstDecoys / questions).toBeGreaterThan(0.3);
    expect(firstDecoys / questions).toBeLessThan(0.8);
  });

  it('level 11 builds a pictured word from the word alone: one box per sound, a spare unlike every needed letter', () => {
    expect(planFor(SLOW_LEVEL)).toBe(SLOW_PLAN);
    expect(SLOW_PLAN).toMatchObject({ mode: 'slow', rounds: 3, choices: 4 });
    expect(stepLevel(LAST_LEVEL, 1, LEVELS.school!)).toBe(SLOW_LEVEL);
    // The ask names the word and never its sounds.
    expect(SCRIPT['monster.slow']).toBeDefined();
    for (const line of SCRIPT['monster.slow']) expect(line).not.toContain('{sounds}');
    // More words than level 6 offers, every one pictured, one letter per sound, no letter twice, no mirror pair.
    expect(SLOW_WORDS.length).toBeGreaterThan(WORDS.length);
    for (const w of SLOW_WORDS) {
      expect(PICTURE_WORDS, w).toContain(w);
      expect(w.includes('x'), w).toBe(false);
      expect(new Set(w).size, w).toBe(w.length);
      for (const set of ['bdpq', 'il'])
        expect([...w].filter((l) => set.includes(l)).length, w).toBeLessThan(2);
    }
    expect(SLOW_WORDS).not.toContain('box');
    expect(SLOW_WORDS).not.toContain('pop');
    const vowels = new Set<string>();
    for (let seed = 1; seed <= 300; seed++) {
      const qs = makeQuestions(SLOW_PLAN, new Rng(seed));
      expect(qs).toHaveLength(SLOW_PLAN.rounds);
      expect(new Set(qs.map((q) => q.answer)).size).toBe(qs.length);
      for (const q of qs) {
        expect(SLOW_WORDS as readonly string[], q.answer).toContain(q.answer);
        expect(q.monsters).toHaveLength(SLOW_PLAN.choices);
        expect(new Set(q.monsters).size).toBe(q.monsters.length);
        for (const l of q.answer) expect(q.monsters, q.answer).toContain(l);
        const [spare] = q.monsters.filter((l) => !q.answer.includes(l));
        expect(spare, q.answer).toBeDefined();
        expect(WHO_POOL, spare).toContain(spare);
        for (const l of q.answer) {
          expect(SOUNDS[spare], `${q.answer} ${spare}`).not.toBe(SOUNDS[l]);
          expect(lookalike(spare, l), `${q.answer} ${spare}`).toBe(false);
        }
        vowels.add(q.answer[1]);
      }
    }
    expect(vowels.size).toBe(5);
  });

  it('repairs one sound per pictured word, with each position used once in a round', () => {
    expect(planFor(REPAIR_LEVEL)).toBe(REPAIR_PLAN);
    expect(stepLevel(SLOW_LEVEL, 1, LEVELS.school!)).toBe(REPAIR_LEVEL);
    for (let seed = 1; seed <= 300; seed++) {
      const questions = makeQuestions(REPAIR_PLAN, new Rng(seed));
      expect(questions.map((q) => q.repair?.slot).sort()).toEqual([0, 1, 2]);
      const words = new Set<string>();
      for (const q of questions) {
        const { word, slot } = q.repair!;
        words.add(q.answer);
        words.add(word);
        expect(PICTURE_WORDS).toContain(q.answer);
        expect(PICTURE_WORDS).toContain(word);
        expect([...q.answer].flatMap((letter, i) => (letter === word[i] ? [] : [i]))).toEqual([slot]);
        expect(soundTwin(q.answer[slot], word[slot])).toBe(false);
        expect(q.monsters).toHaveLength(REPAIR_PLAN.choices);
        expect(new Set(q.monsters).size).toBe(q.monsters.length);
        expect(q.monsters.filter((letter) => fits(q.answer, slot, letter))).toEqual([q.answer[slot]]);
        expect(q.monsters).not.toContain(word[slot]);
      }
      expect(words.size).toBe(6);
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
    for (const plan of [...PLANS, LAST_PLAN, SLOW_PLAN]) {
      for (let seed = 1; seed <= 100; seed++) {
        const questions = makeQuestions(plan, new Rng(seed));
        if (plan.mode === 'play') {
          // Free play: every monster in turn, round and round, until the round's taps are done.
          const monsters = questions[0].monsters.map((letter) => ({ letter, placed: false }));
          const heard = new Set<string>();
          for (let taps = 0; taps < plan.rounds; taps++)
            heard.add(nextMonster(plan, questions[0], monsters, 0, taps)!.letter);
          expect(heard.size, `${plan.mode} seed ${seed}`).toBe(Math.min(monsters.length, plan.rounds));
          continue;
        }
        for (const q of questions) {
          const building =
            plan.mode === 'build' ||
            plan.mode === 'spell' ||
            plan.mode === 'slow' ||
            plan.mode === 'family' ||
            plan.mode === 'end';
          // A word family's ending already stands in the slots, as monsters that cannot be picked up.
          const monsters = [
            ...q.monsters.map((letter) => ({ letter, placed: false })),
            ...(q.fixed ?? '')
              .split('')
              .filter(Boolean)
              .map((letter) => ({ letter, placed: true })),
          ];
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
