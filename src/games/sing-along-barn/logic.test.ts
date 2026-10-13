import { describe, expect, it } from 'vitest';
import { PENTATONIC, stepToMidi } from '../../audio/notes';
import { Rng } from '../../engine/random';
import { ANIMALS, E_I_E_I_O, HAD_A, HAD_A_FARM, PLANS, VOICES, farmAnimals, makeSong, nextInvite, planFor } from './logic';

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
