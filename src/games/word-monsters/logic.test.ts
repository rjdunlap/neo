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
  FOUR_LEVEL,
  FOUR_PLAN,
  FOUR_WORDS,
  capitalLookalike,
  lookalike,
  makeQuestions,
  MINE_LEVEL,
  MINE_PLAN,
  mineQuestions,
  myLetter,
  soundTwin,
  WHO_POOL,
  nextMonster,
  PLANS,
  sounded,
  WORDS,
  PICTURE_WORDS,
  SOUNDS,
  RIMES,
  TEAM_LEVEL,
  TEAM_PLAN,
  TEAM_SOUNDS,
  TEAM_SPELLINGS,
  TEAM_WORDS,
  TEAMS,
  teamMonsters,
  unitsOf,
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
    expect(levelsInOrder(LEVELS.school!)).toEqual([
      5,
      6,
      7,
      8,
      LAST_LEVEL,
      SLOW_LEVEL,
      REPAIR_LEVEL,
      FOUR_LEVEL,
      TEAM_LEVEL,
    ]);
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
    for (const plan of [...PLANS, LAST_PLAN, SLOW_PLAN, FOUR_PLAN]) {
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
    for (const plan of [...PLANS, LAST_PLAN, SLOW_PLAN, FOUR_PLAN]) {
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
    for (const plan of [...PLANS, LAST_PLAN, SLOW_PLAN, FOUR_PLAN]) {
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

  it('level 14 keeps the four sounds separate and offers one distinct, fair spare', () => {
    expect(planFor(FOUR_LEVEL)).toBe(FOUR_PLAN);
    expect(stepLevel(REPAIR_LEVEL, 1, LEVELS.school!)).toBe(FOUR_LEVEL);
    expect(FOUR_WORDS).toHaveLength(10);
    for (const word of FOUR_WORDS) {
      expect(SLOW_WORDS).not.toContain(word);
      expect(new Set(word).size, word).toBe(4);
      const picture = wordPicture(word);
      expect(picture.getBounds().width, word).toBeGreaterThan(120);
      picture.destroy({ children: true });
    }
    const seen = new Set<string>();
    for (let seed = 1; seed <= 100; seed++) {
      const questions = makeQuestions(FOUR_PLAN, new Rng(seed));
      expect(questions).toHaveLength(3);
      expect(new Set(questions.map((q) => q.answer)).size).toBe(3);
      for (const q of questions) {
        seen.add(q.answer);
        const units = unitsOf(q);
        expect(units).toEqual([...q.answer]);
        expect(new Set(q.monsters).size).toBe(5);
        for (const unit of units) expect(q.monsters).toContain(unit);
        const [spare] = q.monsters.filter((m) => !units.includes(m));
        expect(WHO_POOL).toContain(spare);
        for (const unit of units) {
          expect(lookalike(spare, unit), q.answer).toBe(false);
          expect(soundTwin(spare, unit), q.answer).toBe(false);
        }
      }
    }
    expect(seen).toEqual(new Set(FOUR_WORDS));
  });

  it('level 13 builds words where one monster wears a two-letter team and fills one box', () => {
    expect(planFor(TEAM_LEVEL)).toBe(TEAM_PLAN);
    expect(TEAM_PLAN).toMatchObject({ mode: 'team', rounds: 3, choices: 4 });
    expect(stepLevel(FOUR_LEVEL, 1, LEVELS.school!)).toBe(TEAM_LEVEL);
    for (const id of ['monster.team', 'monster.team.half', ...TEAMS.map((t) => `sound.${t}`)])
      expect(SCRIPT[id as keyof typeof SCRIPT], id).toBeDefined();
    for (const line of SCRIPT['monster.team']) expect(line).not.toContain('{sounds}');
    // Teams never join the single-letter pools, so no other level offers one.
    for (const t of TEAMS) {
      expect(ALPHABET).not.toContain(t);
      expect(WHO_POOL).not.toContain(t);
    }
    // The words: spelled by their units, one team at least, every team used, pictured, no mirror pair.
    const used = new Set<string>();
    for (const w of TEAM_WORDS) {
      const units = TEAM_SPELLINGS[w];
      expect(units.join(''), w).toBe(w);
      expect(new Set(units).size, w).toBe(units.length);
      const teams = units.filter((u) => u.length > 1);
      expect(teams.length, w).toBeGreaterThanOrEqual(1);
      for (const u of units) expect(u.length === 1 ? SOUNDS[u] : TEAM_SOUNDS[u], `${w} ${u}`).toBeDefined();
      teams.forEach((t) => used.add(t));
      expect([...w].filter((l) => 'bdpq'.includes(l)).length, w).toBeLessThanOrEqual(1);
      expect(w.includes('i') && w.includes('l'), w).toBe(false);
      expect(w, 'll is a second two-letter sound').not.toContain('ll');
      const p = wordPicture(w);
      expect(p.getBounds().width, w).toBeGreaterThan(120);
      p.destroy({ children: true });
    }
    expect([...used].sort()).toEqual([...TEAMS].sort());
    // The team sits first in some words and last in others, so where it goes is heard, not learned.
    const spots = new Set(TEAM_WORDS.map((w) => TEAM_SPELLINGS[w].findIndex((u) => u.length > 1)));
    expect(spots.size).toBeGreaterThan(1);
    // No other level's word lists take a team word.
    for (const w of [...LAST_WORDS, ...SLOW_WORDS, ...PICTURE_WORDS])
      for (const t of TEAMS) expect(w, w).not.toContain(t);
  });

  it('level 13 rounds: units fill the boxes, spares never complete a team or say its sound, half-team decoys appear', () => {
    let halves = 0;
    let rounds = 0;
    for (let seed = 1; seed <= 300; seed++) {
      const qs = makeQuestions(TEAM_PLAN, new Rng(seed));
      expect(qs).toHaveLength(TEAM_PLAN.rounds);
      expect(new Set(qs.map((q) => q.answer)).size).toBe(qs.length);
      // Three different teams when there are enough.
      expect(new Set(qs.map((q) => unitsOf(q).find((u) => u.length > 1))).size).toBe(TEAM_PLAN.rounds);
      for (const q of qs) {
        rounds++;
        const units = unitsOf(q);
        expect(units).toEqual(TEAM_SPELLINGS[q.answer as keyof typeof TEAM_SPELLINGS]);
        expect(q.monsters).toHaveLength(TEAM_PLAN.choices);
        for (const u of units)
          expect(
            q.monsters.filter((m) => m === u),
            u,
          ).toHaveLength(1);
        const spares = q.monsters.filter((m) => !units.includes(m));
        expect(spares).toHaveLength(TEAM_PLAN.choices - units.length);
        for (const s of spares) {
          expect(s).toHaveLength(1);
          expect(WHO_POOL).toContain(s);
          for (const u of units) {
            // Never a lone c or k beside ck: it would say the team's sound.
            expect(soundTwin(s, u), `${q.answer} ${s}`).toBe(false);
            if (u.length === 1) expect(lookalike(s, u), `${q.answer} ${s}`).toBe(false);
          }
        }
        for (const t of units.filter((u) => u.length > 1)) {
          const parts = spares.filter((s) => t.includes(s));
          expect(parts.length, `${q.answer}: both letters of ${t}`).toBeLessThanOrEqual(1);
          if (parts.length) halves++;
        }
        // The bot finishes the word box by box, team included.
        const ms = q.monsters.map((letter) => ({ letter, placed: false }));
        for (let filled = 0; filled < units.length; filled++) {
          const m = nextMonster(TEAM_PLAN, q, ms, filled, 0);
          expect(m?.letter).toBe(units[filled]);
          m!.placed = true;
        }
      }
    }
    expect(halves / rounds).toBeGreaterThan(0.25);
    expect(halves / rounds).toBeLessThan(0.75);
    // ck words offer neither c nor k as a spare.
    for (let seed = 1; seed <= 100; seed++)
      for (const m of teamMonsters(new Rng(seed), ['d', 'u', 'ck'], 4)) expect(['c', 'k']).not.toContain(m);
  });

  it("level 15 is toddler and preschool's My letter: placed between 1 and 2, and first for preschool", () => {
    expect(planFor(MINE_LEVEL)).toBe(MINE_PLAN);
    expect(levelsInOrder(LEVELS.toddler!)).toEqual([1, MINE_LEVEL, 2]);
    expect(levelsInOrder(LEVELS.preschool!)).toEqual([MINE_LEVEL, 2, 3, 4, 5]);
    expect(stepLevel(1, 1, LEVELS.toddler!)).toBe(MINE_LEVEL);
    expect(stepLevel(MINE_LEVEL, 1, LEVELS.toddler!)).toBe(2);
    for (const band of ['lap', 'prek', 'school'] as const) {
      expect(levelsInOrder(LEVELS[band]!)).not.toContain(MINE_LEVEL);
      // A save or pin carried into a band that does not list it lands on that band's own easiest level.
      expect(landing(MINE_LEVEL, LEVELS[band]!, [BIG_LEVEL, MINE_LEVEL])).toBe(
        levelsInOrder(LEVELS[band]!)[0],
      );
    }
    for (const id of [
      'monster.mine',
      'monster.mine.pip',
      'monster.mine.yes',
      'monster.mine.yes.pip',
      'monster.iam.name',
    ])
      expect(SCRIPT[id as keyof typeof SCRIPT], id).toBeDefined();
    // Asked and answered by letter name: no line on this level carries a sound.
    for (const id of [
      'monster.mine',
      'monster.mine.pip',
      'monster.mine.yes',
      'monster.mine.yes.pip',
      'monster.iam.name',
    ])
      for (const line of SCRIPT[id as keyof typeof SCRIPT] as readonly string[])
        expect(line).not.toContain('{sound}');
  });

  it("level 15 takes the first letter of her name, and Pip's p with no usable name", () => {
    expect(myLetter('Dana')).toMatchObject({ letter: 'd', own: true });
    expect(myLetter('  émile ')).toMatchObject({ letter: 'e', own: true });
    expect(myLetter('Zoë-Ann')).toMatchObject({ letter: 'z', own: true });
    for (const none of ['', '   ', '小明', '42', 'friend', 'Friend'])
      expect(myLetter(none), JSON.stringify(none)).toEqual({ letter: 'p', own: false, name: 'pip' });
  });

  it('level 15 offers her letter each time among two fair others: not in her name, no lookalike, a new place each time', () => {
    const names = [
      'Dana',
      'Bob',
      'Mia',
      'Wren',
      'Quinn',
      'Ezra',
      'Pip',
      '',
      'Olivia',
      'Nzinga',
      'Christopher Abernathy',
    ];
    for (const name of names) {
      const { letter, name: letters } = myLetter(name);
      for (let seed = 1; seed <= 200; seed++) {
        const qs = mineQuestions(MINE_PLAN, new Rng(seed), name);
        expect(qs).toHaveLength(MINE_PLAN.rounds);
        let before = -1;
        for (const q of qs) {
          expect(q.answer).toBe(letter);
          expect(q.monsters).toHaveLength(MINE_PLAN.choices);
          expect(new Set(q.monsters).size).toBe(MINE_PLAN.choices);
          expect(q.monsters.filter((l) => l === letter)).toHaveLength(1);
          for (const other of q.monsters.filter((l) => l !== letter)) {
            expect(letters.includes(other), `${name}: ${other} is in the name`).toBe(false);
            expect(lookalike(other, letter) || capitalLookalike(other, letter), `${name}: ${other}`).toBe(
              false,
            );
            expect(WHO_POOL).toContain(other);
          }
          const [a, b] = q.monsters.filter((l) => l !== letter);
          expect(lookalike(a, b) || capitalLookalike(a, b), `${name} ${a}${b}`).toBe(false);
          const at = q.monsters.indexOf(letter);
          expect(at, `${name} seed ${seed}`).not.toBe(before);
          before = at;
          // The ghost finger taps her letter.
          const ms = q.monsters.map((l) => ({ letter: l, placed: false }));
          expect(nextMonster(MINE_PLAN, q, ms, 0, 0)?.letter).toBe(letter);
        }
      }
    }
    // A name holding nearly the whole alphabet borrows its other letters rather than run short.
    const qs = mineQuestions(MINE_PLAN, new Rng(3), 'The quick brown fox jumps over the lazy dog');
    for (const q of qs) expect(new Set(q.monsters).size).toBe(MINE_PLAN.choices);
  });

  it('level 15 changes the spares between questions, so she looks for her letter rather than at the others', () => {
    let changed = 0;
    let pairs = 0;
    for (let seed = 1; seed <= 200; seed++) {
      const qs = mineQuestions(MINE_PLAN, new Rng(seed), 'Dana');
      for (let i = 1; i < qs.length; i++) {
        pairs++;
        const spares = (q: (typeof qs)[number]) =>
          q.monsters
            .filter((l) => l !== 'd')
            .sort()
            .join('');
        if (spares(qs[i]) !== spares(qs[i - 1])) changed++;
        expect(qs[i].monsters.filter((l) => l !== 'd' && qs[i - 1].monsters.includes(l))).toHaveLength(0);
      }
    }
    expect(changed).toBe(pairs);
  });
});
