import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import { SCRIPT } from '../../content/voice-script';
import {
  allRiddles, chipsFor, familyOf, FAMILIES, fitsBoth, guessFor, holds, makeQuestions, makeRiddles, makeTap, mateTags,
  PLANS, rhymes, spokenList, TAG_IDS, TAGS, wordToTap,
} from './logic';

describe('Rhyme Time', () => {
  it('never lists a word in two families', () => {
    const all = Object.values(FAMILIES).flat();
    expect(new Set(all).size).toBe(all.length);
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

  it('is deterministic per seed', () => {
    for (const li of levels) expect(makeRiddles(PLANS[li], new Rng(7))).toEqual(makeRiddles(PLANS[li], new Rng(7)));
  });

  it('has a pinned pool where every big family supplies answers and keys never answer', () => {
    const all = allRiddles();
    expect(all.length).toBe(102);
    const answered = new Set(all.map((r) => familyOf(r.answer)));
    for (const f of Object.keys(FAMILIES).filter((k) => FAMILIES[k].length >= 3)) expect(answered.has(f)).toBe(true);
    expect(all.some((r) => r.answer === 'key')).toBe(false);
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
        const hits = sound.flatMap((s) => meaning.map((t) => guessFor(r, s, t))).filter((g) => g === r.answer);
        expect(hits).toHaveLength(1);
        for (const s of sound) for (const t of meaning) expect(fitsBoth(r.words, s, t).length).toBeLessThanOrEqual(1);
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
    const ids = ['rhyme.riddle', 'rhyme.riddle2', 'rhyme.riddleClues', 'rhyme.riddleNoMeaning', 'rhyme.riddleNoRhyme', 'rhyme.riddleYes', 'rhyme.riddleHint', 'rhyme.make', 'rhyme.chipSound', 'rhyme.chipMeaning', 'rhyme.makeGuess', 'rhyme.makeWrong', 'rhyme.makeNone', 'rhyme.makeBoth', 'rhyme.makeHint'];
    for (const id of ids) expect(Object.keys(SCRIPT)).toContain(id);
  });
});
