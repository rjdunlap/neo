import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import { SCRIPT } from '../../content/voice-script';
import {
  allRiddles,
  andList,
  ARGUABLE,
  basketFor,
  BASKETS,
  chipsFor,
  familySong,
  fails,
  familyOf,
  FAMILIES,
  fitsBoth,
  guessFor,
  holds,
  makeQuestions,
  makeRiddles,
  makeTap,
  makeTrays,
  mateTags,
  planFor,
  PLANS,
  rhymes,
  SCENES,
  sceneFor,
  spokenList,
  TAG_IDS,
  TAGS,
  wordToTap,
} from './logic';
import { rhymeTime } from './index';
import { levelsInOrder, stepLevel } from '../../progress/difficulty';

describe('Rhyme Time', () => {
  it('never lists a word in two families', () => {
    const all = Object.values(FAMILIES).flat();
    expect(new Set(all).size).toBe(all.length);
  });

  it('has 38 pictures in fifteen families, eight of them three-word groups', () => {
    expect(Object.keys(FAMILIES)).toHaveLength(15);
    expect(Object.values(FAMILIES).flat()).toHaveLength(38);
    expect(
      Object.keys(FAMILIES)
        .filter((f) => FAMILIES[f].length >= 3)
        .sort(),
    ).toEqual(['ail', 'ar', 'at', 'ear', 'ee', 'ock', 'og', 'ug']);
  });

  it('shows the fresh families in odd-one-out rounds', () => {
    const seen = new Set<string>();
    for (let seed = 1; seed <= 100; seed++)
      for (const q of makeQuestions(PLANS[3], new Rng(seed)))
        seen.add(familyOf(q.words.find((w) => !q.answer.includes(w))!));
    for (const f of ['ug', 'ock', 'ail']) expect(seen.has(f)).toBe(true);
  });

  it('has exactly the intended rhymes on screen: one match, one pair, or one odd one out', () => {
    for (const plan of PLANS.slice(0, 4)) {
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
            const pairs = q.words.flatMap((a, i) =>
              q.words
                .slice(i + 1)
                .filter((b) => rhymes(a, b))
                .map((b) => [a, b]),
            );
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
    for (const plan of PLANS.slice(0, 4)) {
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

describe('Rhyme Riddles (levels 5-7)', () => {
  const levels = [4, 5, 6];

  it('keeps exactly one shelf picture for both clues, with the rhyme clue alone not enough', () => {
    for (const li of levels) {
      const plan = PLANS[li];
      for (let seed = 1; seed <= 300; seed++) {
        const round = makeRiddles(plan, new Rng(seed));
        expect(round).toHaveLength(plan.questions);
        expect(new Set(round.map((r) => r.answer)).size).toBe(round.length);
        for (const r of round) {
          expect(fitsBoth(r.words, r.clueWord, r.tag)).toEqual([r.answer]);
          expect(r.words.filter((w) => rhymes(w, r.clueWord)).length).toBeGreaterThanOrEqual(2);
          expect(r.words.filter((w) => holds(w, r.tag)).length).toBeGreaterThanOrEqual(2);
          const fam = familyOf(r.answer);
          expect(familyOf(r.mate)).toBe(fam);
          expect(familyOf(r.clueWord)).toBe(fam);
          expect(new Set([r.clueWord, r.answer, r.mate]).size).toBe(3);
          expect(FAMILIES[fam].length).toBeGreaterThanOrEqual(3);
          expect(r.words).not.toContain(r.clueWord);
          expect(holds(r.trap, r.tag)).toBe(true);
          expect(familyOf(r.trap)).not.toBe(fam);
          expect(holds(r.answer, r.tag)).toBe(true);
          expect(holds(r.mate, r.tag)).toBe(false);
          expect(r.words).toHaveLength(li === 5 ? 4 : 3);
          expect(new Set(r.words).size).toBe(r.words.length);
          for (const w of [r.answer, r.mate, r.trap]) expect(r.words).toContain(w);
          if (li === 5) {
            expect(r.words).toContain(r.neutral);
            expect(holds(r.neutral!, r.tag)).toBe(false);
            expect(rhymes(r.neutral!, r.answer) || r.neutral === r.answer).toBe(false);
            expect(familyOf(r.neutral!)).not.toBe(fam);
            expect(familyOf(r.neutral!)).not.toBe(familyOf(r.trap));
          } else expect(r.neutral).toBeUndefined();
        }
      }
    }
  });

  it('never makes an arguable fit the neutral or mate that must fail a clue', () => {
    for (const r of allRiddles()) expect(fails(r.mate, r.tag)).toBe(true);
    for (let seed = 1; seed <= 300; seed++) {
      for (const r of makeRiddles(PLANS[5], new Rng(seed))) {
        expect(fails(r.neutral!, r.tag)).toBe(true);
        expect(ARGUABLE[r.tag] ?? []).not.toContain(r.neutral);
      }
    }
  });

  it('is deterministic per seed', () => {
    for (const li of levels)
      expect(makeRiddles(PLANS[li], new Rng(7))).toEqual(makeRiddles(PLANS[li], new Rng(7)));
  });

  it('has a pinned pool where every big family supplies answers and tagless pictures never answer', () => {
    const all = allRiddles();
    expect(all.length).toBe(178);
    const answered = new Set(all.map((r) => familyOf(r.answer)));
    for (const f of Object.keys(FAMILIES).filter((k) => FAMILIES[k].length >= 3))
      expect(answered.has(f)).toBe(true);
    for (const w of ['key', 'clock', 'snail']) expect(all.some((r) => r.answer === w)).toBe(false);
    // the fresh families (bug, sock and snail) each answer riddles
    for (const f of ['ug', 'ock', 'ail']) expect(answered.has(f)).toBe(true);
  });

  it('level 7 offers four chip pairs of which only the working one finds the answer', () => {
    for (let seed = 1; seed <= 300; seed++) {
      for (const r of makeRiddles(PLANS[6], new Rng(seed))) {
        expect(r.decoyWord).toBeDefined();
        expect(r.mateTag).toBeDefined();
        expect(rhymes(r.decoyWord!, r.trap)).toBe(true);
        expect(r.words).not.toContain(r.decoyWord);
        expect(holds(r.mate, r.mateTag!)).toBe(true);
        expect(holds(r.answer, r.mateTag!)).toBe(false);
        expect(holds(r.trap, r.mateTag!)).toBe(false);
        expect(mateTags(r)).toContain(r.mateTag);
        const { sound, meaning } = chipsFor(r);
        expect(sound).toEqual([r.clueWord, r.decoyWord]);
        expect(meaning).toEqual([r.tag, r.mateTag]);
        expect(guessFor(r, r.clueWord, r.tag)).toBe(r.answer);
        expect(guessFor(r, r.clueWord, r.mateTag!)).toBe(r.mate);
        expect(guessFor(r, r.decoyWord!, r.tag)).toBe(r.trap);
        expect(guessFor(r, r.decoyWord!, r.mateTag!)).toBeNull();
        const hits = sound
          .flatMap((s) => meaning.map((t) => guessFor(r, s, t)))
          .filter((g) => g === r.answer);
        expect(hits).toHaveLength(1);
        for (const s of sound)
          for (const t of meaning) expect(fitsBoth(r.words, s, t).length).toBeLessThanOrEqual(1);
        // the capable-child path reaches Guess within three taps
        let snd: string | null = null;
        let tg: typeof r.tag | null = null;
        let steps = 0;
        for (;;) {
          const t = makeTap(r, snd, tg);
          steps++;
          if (t === 'guess') break;
          if ('sound' in t) snd = t.sound;
          else tg = t.tag;
          expect(steps).toBeLessThan(3);
        }
        expect(steps).toBe(3);
        expect(guessFor(r, snd!, tg!)).toBe(r.answer);
      }
    }
  });

  it('gives every tag a clue sentence and a fact, with only real family words', () => {
    const family = new Set(Object.values(FAMILIES).flat());
    for (const id of TAG_IDS) {
      expect(TAGS[id].clue.length).toBeGreaterThan(1);
      expect(TAGS[id].clue.endsWith('.')).toBe(true);
      expect(TAGS[id].fact.length).toBeGreaterThan(0);
      for (const w of TAGS[id].words) expect(family.has(w)).toBe(true);
    }
  });

  it('speaks a shelf as a question', () => {
    expect(spokenList(['chair', 'pear', 'log'])).toBe('the chair, the pear or the log');
  });

  it('has every riddle voice line', () => {
    const ids = [
      'rhyme.riddle',
      'rhyme.riddle2',
      'rhyme.riddleClues',
      'rhyme.riddleNoMeaning',
      'rhyme.riddleNoRhyme',
      'rhyme.riddleYes',
      'rhyme.riddleHint',
      'rhyme.make',
      'rhyme.chipSound',
      'rhyme.chipMeaning',
      'rhyme.makeGuess',
      'rhyme.makeWrong',
      'rhyme.makeNone',
      'rhyme.makeBoth',
      'rhyme.makeHint',
    ];
    for (const id of ids) expect(Object.keys(SCRIPT)).toContain(id);
  });
});

describe('Silly pairs (level 8)', () => {
  const plan = PLANS[7];

  it('is level 8: three riders, four scenes', () => {
    expect(plan.mode).toBe('scene');
    expect(plan.choices).toBe(3);
    expect(plan.questions).toBe(4);
  });

  it('pairs every place with a rider that rhymes, each drawn, with an anchor and a preposition', () => {
    const family = new Set(Object.values(FAMILIES).flat());
    for (const s of SCENES) {
      expect(family.has(s.place) && family.has(s.rider)).toBe(true);
      expect(rhymes(s.place, s.rider)).toBe(true);
      expect(['in', 'on']).toContain(s.prep);
      expect(Number.isFinite(s.anchor.x) && Number.isFinite(s.anchor.y)).toBe(true);
    }
    expect(new Set(SCENES.map((s) => familyOf(s.place))).size).toBe(SCENES.length);
    expect(SCENES).toHaveLength(12);
  });

  it('never lets a distractor rhyme with the place or another distractor, and never repeats a place in a round', () => {
    for (let seed = 1; seed <= 300; seed++) {
      const qs = makeQuestions(plan, new Rng(seed));
      expect(qs).toHaveLength(4);
      expect(new Set(qs.map((q) => q.prompt)).size).toBe(4);
      for (const q of qs) {
        const scene = sceneFor(q.prompt!);
        expect(q.answer).toEqual([scene.rider]);
        expect(q.words).toHaveLength(3);
        expect(q.words).toContain(scene.rider);
        const others = q.words.filter((w) => w !== scene.rider);
        for (const w of others) expect(rhymes(w, q.prompt!) || w === q.prompt).toBe(false);
        expect(familyOf(others[0])).not.toBe(familyOf(others[1]));
        expect(wordToTap(plan, q, null)).toBe(scene.rider);
      }
    }
  });

  it('shows every scene across seeds, and the same seed gives the same round', () => {
    const seen = new Set<string>();
    for (let seed = 1; seed <= 100; seed++)
      for (const q of makeQuestions(plan, new Rng(seed))) seen.add(q.prompt!);
    expect(seen.size).toBe(SCENES.length);
    expect(makeQuestions(plan, new Rng(9))).toEqual(makeQuestions(plan, new Rng(9)));
  });

  it('sits second on both ladders, which still start where they did', () => {
    expect(levelsInOrder(rhymeTime.levels('prek'))).toEqual([1, 8, 2, 3, 5]);
    expect(levelsInOrder(rhymeTime.levels('school'))).toEqual([2, 8, 3, 4, 5, 6, 7, 10]);
    expect(stepLevel(1, 1, rhymeTime.levels('prek'))).toBe(8);
    expect(stepLevel(8, 1, rhymeTime.levels('prek'))).toBe(2);
    expect(stepLevel(2, 1, rhymeTime.levels('school'))).toBe(8);
    expect(stepLevel(8, -1, rhymeTime.levels('school'))).toBe(2);
    expect(rhymeTime.describeLevel(8)).toMatch(/Silly pairs/);
  });

  it('has its voice lines', () => {
    for (const id of ['rhyme.scene', 'rhyme.sceneYes', 'rhyme.sceneNo'])
      expect(Object.keys(SCRIPT)).toContain(id);
  });
});

describe('Silly pairs, two to choose (level 9, the preschool opening)', () => {
  const plan = planFor(9);

  it("is level 8's scenes with two pictures and three scenes", () => {
    expect(plan).toBe(PLANS[8]);
    expect(plan.mode).toBe('scene');
    expect(plan.choices).toBe(2);
    expect(plan.questions).toBe(3);
    expect(rhymeTime.describeLevel(9)).toMatch(/two to choose/);
  });

  it('offers the rider and one picture that does not rhyme with the place, three different places a round', () => {
    for (let seed = 1; seed <= 300; seed++) {
      const qs = makeQuestions(plan, new Rng(seed));
      expect(qs).toHaveLength(3);
      expect(new Set(qs.map((q) => q.prompt)).size).toBe(3);
      for (const q of qs) {
        const scene = sceneFor(q.prompt!);
        expect(q.answer).toEqual([scene.rider]);
        expect(q.words).toHaveLength(2);
        expect(q.words).toContain(scene.rider);
        const other = q.words.find((w) => w !== scene.rider)!;
        expect(familyOf(other)).not.toBe(familyOf(q.prompt!));
        expect(wordToTap(plan, q, null)).toBe(scene.rider);
      }
    }
  });

  it('puts the rider first and second across seeds', () => {
    const at = new Set<number>();
    for (let seed = 1; seed <= 50; seed++)
      for (const q of makeQuestions(plan, new Rng(seed))) at.add(q.words.indexOf(q.answer[0]));
    expect([...at].sort()).toEqual([0, 1]);
  });

  it('opens preschool and steps up to level 8; the older ladders skip it as an entry level', () => {
    const pre = rhymeTime.levels('preschool');
    expect(rhymeTime.bands).toContain('preschool');
    expect(levelsInOrder(pre)).toEqual([9, 8]);
    expect(stepLevel(9, 1, pre)).toBe(8);
    expect(stepLevel(8, -1, pre)).toBe(9);
    expect(rhymeTime.entryLevels).toEqual([9]);
    expect(levelsInOrder(rhymeTime.levels('prek'))).not.toContain(9);
    expect(levelsInOrder(rhymeTime.levels('school'))).not.toContain(9);
  });

  it('says the place twice and lists both pictures', () => {
    expect(SCRIPT['rhyme.scene2'][0]).toMatch(/\{place\}… \{place\}\. Who rhymes with \{place\}\? \{list\}/);
    expect(spokenList(['duck', 'cat'])).toBe('the duck or the cat');
  });
});

describe('Rhyme baskets (level 10)', () => {
  it('is level 10 on its own ID, two trays of six; level 9 is not baskets', () => {
    expect(planFor(10)).toBe(BASKETS);
    expect(BASKETS.mode).toBe('baskets');
    expect(BASKETS.questions).toBe(2);
    expect(planFor(9).mode).not.toBe('baskets');
    expect(planFor(8).mode).toBe('scene');
    expect(rhymeTime.describeLevel(10)).toMatch(/Rhyme baskets/);
  });

  it('tops the school ladder after the make-it riddle; pre-K never reaches it', () => {
    const school = rhymeTime.levels('school');
    expect(school.max).toBe(10);
    expect(levelsInOrder(school)).toEqual([2, 8, 3, 4, 5, 6, 7, 10]);
    expect(stepLevel(7, 1, school)).toBe(10);
    expect(stepLevel(10, -1, school)).toBe(7);
    expect(levelsInOrder(rhymeTime.levels('prek'))).not.toContain(10);
  });

  it('gives three distinct families per tray, each key with exactly two rhyming pictures, keys never in the tray', () => {
    for (let seed = 1; seed <= 300; seed++) {
      const trays = makeTrays(BASKETS, new Rng(seed));
      expect(trays).toHaveLength(2);
      const fams = trays.flatMap((t) => t.keys.map(familyOf));
      expect(new Set(fams).size).toBe(6);
      for (const t of trays) {
        expect(t.keys).toHaveLength(3);
        expect(t.words).toHaveLength(6);
        expect(new Set(t.words).size).toBe(6);
        for (const k of t.keys) expect(t.words).not.toContain(k);
        for (const w of t.words) {
          expect(t.keys.filter((k) => rhymes(k, w))).toHaveLength(1);
          const b = basketFor(w, t.keys);
          expect(b).toBeGreaterThanOrEqual(0);
          expect(rhymes(t.keys[b], w)).toBe(true);
        }
        for (const k of t.keys) expect(t.words.filter((w) => rhymes(k, w))).toHaveLength(2);
        for (const k of t.keys)
          expect(familySong(k).slice(1).sort()).toEqual(t.words.filter((w) => rhymes(k, w)).sort());
      }
    }
  });

  it('uses every three-word family across seeds, and the same seed gives the same round', () => {
    const seen = new Set<string>();
    for (let seed = 1; seed <= 100; seed++)
      for (const t of makeTrays(BASKETS, new Rng(seed))) for (const k of t.keys) seen.add(familyOf(k));
    expect(seen.size).toBe(8);
    expect(makeTrays(BASKETS, new Rng(4))).toEqual(makeTrays(BASKETS, new Rng(4)));
  });

  it('reads a basket list and a family aloud', () => {
    expect(andList(['cat', 'star', 'bug'])).toBe('cat, star and bug');
    expect(familySong('cat')[0]).toBe('cat');
    expect(familySong('cat')).toHaveLength(3);
  });

  it('has its voice lines', () => {
    for (const id of ['rhyme.baskets', 'rhyme.basketNo', 'rhyme.basketHint', 'rhyme.basketSong'])
      expect(Object.keys(SCRIPT)).toContain(id);
  });
});
