import { describe, expect, it } from 'vitest';
import { PENTATONIC, stepToMidi } from '../../audio/notes';
import { Rng } from '../../engine/random';
import {
  ANIMALS,
  BUNS,
  E_I_E_I_O,
  HAD_A,
  HAD_A_FARM,
  HOT_CROSS_BUNS,
  ONE_A_PENNY,
  OLD_MACDONALD,
  PLANS,
  TUNES,
  VOICES,
  farmAnimals,
  makeSong,
  nextInvite,
  pickTune,
  planFor,
} from './logic';

describe('the tune', () => {
  it('has one note for every sung syllable, so taps line up with a grown-up singing', () => {
    for (const p of [HAD_A_FARM, E_I_E_I_O, HAD_A]) expect(p.steps.length, p.syllables.join(' ')).toBe(p.syllables.length);
    expect(HAD_A_FARM.syllables.join(' ')).toBe('Old Mac Don ald had a farm');
    expect(E_I_E_I_O.syllables.join('')).toBe('EIEIO');
  });

  it('stays inside the island\'s pentatonic set, with no exception to the rule', () => {
    for (const p of [HAD_A_FARM, E_I_E_I_O, HAD_A]) {
      for (const step of p.steps) expect(PENTATONIC, `step ${step}`).toContain(stepToMidi(step) % 12);
    }
  });

  it('ends each line on the tonic or the fifth, so a verse sounds finished', () => {
    expect(stepToMidi(HAD_A_FARM.steps.at(-1)!) % 12).toBe(7);
    expect(stepToMidi(E_I_E_I_O.steps.at(-1)!) % 12).toBe(0);
    expect(stepToMidi(HAD_A.steps.at(-1)!) % 12).toBe(7);
  });
});

describe('the song', () => {
  it('is the short song: the opening, then one "And on that farm he had a ..." verse for each animal, one note each', () => {
    for (const verses of [1, 2, 3]) {
      const song = makeSong(ANIMALS.slice(0, verses));
      expect(song.length).toBe(HAD_A_FARM.steps.length + E_I_E_I_O.steps.length + verses * (HAD_A.steps.length + E_I_E_I_O.steps.length));
    }
  });

  it('answers once per verse, on the animal\'s name, in the order the animals came', () => {
    const order = ['duck', 'cow', 'dog'] as const;
    const song = makeSong(order);
    const answers = song.filter((n) => n.answers);
    expect(answers.map((n) => n.animal)).toEqual([...order]);
    expect(answers.map((n) => n.syllable)).toEqual(order.map((a) => VOICES[a].word));
  });

  it('ends a verse exactly once per verse and once in the opening, and ends on the last note', () => {
    const song = makeSong(['cow', 'pig']);
    expect(song.filter((n) => n.verseEnd).length).toBe(3);
    expect(song.at(-1)!.verseEnd).toBe(true);
  });

  it('numbers phrases so each is whole and its beads count up from 0', () => {
    const song = makeSong(['cow', 'pig', 'duck']);
    for (let i = 0; i < song.length; i++) {
      const n = song[i];
      expect(n.of).toBeGreaterThan(n.at);
      if (n.at > 0) expect(n.phrase).toBe(song[i - 1].phrase);
      else if (i > 0) expect(n.phrase).toBe(song[i - 1].phrase + 1);
    }
  });
});

describe('the plans', () => {
  it('grow from one animal to two, and only the last has her choose', () => {
    expect(PLANS.map((p) => p.verses)).toEqual([1, 2, 2]);
    expect(PLANS.map((p) => p.invite)).toEqual([false, false, true]);
    expect(planFor(0)).toBe(PLANS[0]);
    expect(planFor(99)).toBe(PLANS[2]);
  });

  it('keeps the longest song short enough for a small child and for the how-to demonstration', () => {
    for (const plan of PLANS) expect(makeSong(ANIMALS.slice(0, plan.verses)).length).toBeLessThanOrEqual(40);
  });

  it('draws different animals for every verse, the same for the same seed', () => {
    for (const plan of PLANS) {
      for (let seed = 0; seed < 50; seed++) {
        const a = farmAnimals(plan, new Rng(seed));
        expect(a.length).toBe(plan.verses);
        expect(new Set(a).size).toBe(plan.verses);
        expect(farmAnimals(plan, new Rng(seed))).toEqual(a);
      }
    }
  });

  it('shows every animal in a seeded draw somewhere, so no friend is left out', () => {
    const seen = new Set<string>();
    for (let seed = 0; seed < 60; seed++) farmAnimals(PLANS[1], new Rng(seed)).forEach((a) => seen.add(a));
    expect([...seen].sort()).toEqual([...ANIMALS].sort());
  });

  it('lets a helper invite friends one by one until the barn is full', () => {
    const plan = PLANS[2];
    const invited: (typeof ANIMALS)[number][] = [];
    for (let guard = 0; guard < 10; guard++) {
      const next = nextInvite(invited, plan);
      if (!next) break;
      expect(invited).not.toContain(next);
      invited.push(next);
    }
    expect(invited.length).toBe(plan.verses);
    expect(nextInvite(invited, plan)).toBeNull();
  });
});

describe('Old MacDonald, after the song became a tune', () => {
  it('sings exactly the notes it sang before: the opening, then "And on that farm he had a cow, E-I-E-I-O"', () => {
    const song = makeSong(['cow']);
    expect(song.map((n) => n.step)).toEqual([...HAD_A_FARM.steps, ...E_I_E_I_O.steps, ...HAD_A.steps, ...E_I_E_I_O.steps]);
    expect(song.map((n) => n.syllable).join(' ')).toBe('Old Mac Don ald had a farm E I E I O And on that farm he had a cow E I E I O');
    expect(makeSong(['cow'], OLD_MACDONALD)).toEqual(song);
  });
});

describe('Hot Cross Buns', () => {
  it('has one note for every sung syllable, with the words in order', () => {
    for (const p of [HOT_CROSS_BUNS, ONE_A_PENNY]) expect(p.steps.length, p.syllables.join(' ')).toBe(p.syllables.length);
    const song = makeSong(['pig'], BUNS);
    expect(song.map((n) => n.syllable).join(' ')).toBe('Hot cross buns Hot cross buns One a pen ny two a pen ny Hot cross buns');
  });

  it('is E D C, then C C C C, D D D D, inside the pentatonic set with no exception', () => {
    expect(HOT_CROSS_BUNS.steps.map((s) => stepToMidi(s) % 12)).toEqual([4, 2, 0]);
    for (const p of [HOT_CROSS_BUNS, ONE_A_PENNY]) for (const step of p.steps) expect(PENTATONIC, `step ${step}`).toContain(stepToMidi(step) % 12);
  });

  it('answers once per verse, on the last "buns", keeping the lyric; the friends come in order', () => {
    const order = ['dog', 'cat', 'duck'] as const;
    const song = makeSong(order, BUNS);
    const answers = song.filter((n) => n.answers);
    expect(answers.map((n) => n.animal)).toEqual([...order]);
    expect(answers.every((n) => n.syllable === 'buns')).toBe(true);
    // The opening has no friend and no answer, and a verse ends exactly where a friend answers.
    expect(song.slice(0, 6).every((n) => n.animal === null && !n.answers)).toBe(true);
    expect(song.filter((n) => n.verseEnd).length).toBe(order.length + 1);
    expect(song.filter((n) => n.verseEnd).map((n) => n.answers)).toEqual([false, true, true, true]);
    expect(song.at(-1)!.verseEnd).toBe(true);
  });

  it('is a short song with each friend\'s verse of eleven notes, and beads that fit the row', () => {
    for (const verses of [1, 2]) expect(makeSong(ANIMALS.slice(0, verses), BUNS).length).toBe(6 + verses * 11);
    for (const t of TUNES) for (const n of makeSong(ANIMALS.slice(0, 2), t)) expect(n.of).toBeLessThanOrEqual(8);
  });
});

describe('which tune a round sings', () => {
  it('is a seeded draw: the same seed sings the same tune, and both tunes turn up', () => {
    expect(pickTune(new Rng(7)).id).toBe(pickTune(new Rng(7)).id);
    const seen = new Set<string>();
    for (let seed = 1; seed <= 40; seed++) seen.add(pickTune(new Rng(seed)).id);
    expect([...seen].sort()).toEqual(['buns', 'macdonald']);
  });
});
