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
  OLD_MACDONALD_FULL,
  PLANS,
  TUNES,
  MARY,
  CLAIR,
  RAIN,
  ITSY,
  BOUNCE,
  VOICES,
  farmAnimals,
  makeSong,
  nextInvite,
  pickTune,
  planFor,
  tunesFor,
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
  it('grow from one animal to three, with her choosing all at once and then one verse at a time', () => {
    expect(PLANS.map((p) => p.verses)).toEqual([1, 2, 2, 3, 3, 2]);
    expect(PLANS.map((p) => p.invite)).toEqual([false, false, true, true, true, true]);
    expect(PLANS.map((p) => p.each)).toEqual([false, false, false, true, true, true]);
    expect(PLANS.map((p) => p.chooseTune)).toEqual([false, false, false, false, true, true]);
    expect(PLANS.map((p) => p.full)).toEqual([false, false, false, false, false, true]);
    expect(planFor(0)).toBe(PLANS[0]);
    expect(planFor(99)).toBe(PLANS[5]);
  });

  it('keeps the longest song short enough for a small child and for the how-to demonstration', () => {
    // Three Old MacDonald verses are 51 notes; the demonstration's 75 seconds are checked by `fingerdemo` at level 4.
    for (const plan of PLANS) for (const tune of TUNES) expect(makeSong(ANIMALS.slice(0, plan.verses), tune).length).toBeLessThanOrEqual(51);
    expect(makeSong(ANIMALS.slice(0, 2), OLD_MACDONALD).length).toBeLessThanOrEqual(40);
  });

  it('grows the song one verse at a time when she chooses each friend: every shorter song is the start of the longer', () => {
    for (const tune of TUNES) {
      const all = makeSong(ANIMALS.slice(0, 3), tune);
      for (let k = 0; k < 3; k++) {
        const part = makeSong(ANIMALS.slice(0, k), tune);
        expect(part).toEqual(all.slice(0, part.length));
        // The notes so far end on a verse's close (the opening's, or a friend's), where she is asked who is next.
        expect(part.at(-1)!.verseEnd).toBe(true);
        expect(part.filter((n) => n.verseEnd).length).toBe(k + 1);
      }
    }
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

describe('Mary Had a Little Lamb', () => {
  it('sings the lyric one syllable per note, answering on each friend\'s "lamb"', () => {
    const song = makeSong(ANIMALS.slice(0, 1), MARY);
    expect(song.map((n) => n.syllable).join(' ')).toBe('Ma ry had a lit tle lamb its fleece was white as snow lit tle lamb lit tle lamb its fleece was white as snow');
    expect(song.filter((n) => n.answers).length).toBe(1);
    expect(song.filter((n) => n.answers)[0].syllable).toBe('lamb');
    expect(song.length).toBe(13 + 12);
  });

  it('stays in the pentatonic set and opens on E D C', () => {
    for (const n of makeSong(ANIMALS.slice(0, 3), MARY)) expect([0, 1, 2, 3, 4]).toContain(n.step);
    expect(MARY.opening[0].steps.slice(0, 3)).toEqual([2, 1, 0]);
  });
});

describe('Au Clair de la Lune', () => {
  it('sings the lyric one syllable per note, answering on each friend\'s "mot"', () => {
    const song = makeSong(ANIMALS.slice(0, 1), CLAIR);
    expect(song.map((n) => n.syllable).join(' ')).toBe('Au clair de la lu ne mon a mi Pier rot Prê te moi ta plu me pour é cri re un mot');
    expect(song.filter((n) => n.answers).map((n) => n.syllable)).toEqual(['mot']);
    expect(song.length).toBe(11 + 12);
  });

  it('stays in the pentatonic set, opens on C C C D E D and fits a row of eight beads', () => {
    const song = makeSong(ANIMALS.slice(0, 3), CLAIR);
    for (const n of song) expect([0, 1, 2, 3, 4]).toContain(n.step);
    for (const n of song) expect(n.of).toBeLessThanOrEqual(8);
    expect(CLAIR.opening[0].steps).toEqual([0, 0, 0, 1, 2, 1]);
  });
});

describe('Rain, Rain, Go Away', () => {
  it('sings the lyric one syllable per note, answering on each friend\'s "play"', () => {
    const song = makeSong(ANIMALS.slice(0, 1), RAIN);
    expect(song.map((n) => n.syllable).join(' ')).toBe('Rain rain go a way come a gain an oth er day Rain rain go a way we want to play');
    expect(song.filter((n) => n.answers).map((n) => n.syllable)).toEqual(['play']);
    expect(song.length).toBe(12 + 9);
  });

  it('stays in the pentatonic set and fits a row of eight beads', () => {
    const song = makeSong(ANIMALS.slice(0, 3), RAIN);
    for (const n of song) expect([0, 1, 2, 3, 4]).toContain(n.step);
    for (const n of song) expect(n.of).toBeLessThanOrEqual(8);
  });
});

describe('The Itsy Bitsy Spider', () => {
  it('sings the lyric one syllable per note, answering on each friend\'s "spout"', () => {
    const song = makeSong(ANIMALS.slice(0, 1), ITSY);
    expect(song.map((n) => n.syllable).join(' ')).toBe('The it sy bit sy spi der climbed up the wa ter spout climbed up the wa ter spout');
    expect(song.filter((n) => n.answers).map((n) => n.syllable)).toEqual(['spout']);
    expect(song.length).toBe(13 + 6);
  });

  it('stays in the pentatonic set and fits a row of eight beads', () => {
    for (const n of makeSong(ANIMALS.slice(0, 3), ITSY)) {
      expect([0, 1, 2, 3, 4]).toContain(n.step);
      expect(n.of).toBeLessThanOrEqual(8);
    }
  });
});

describe('Bounce High, Bounce Low', () => {
  it('bounces the ball to Shiloh, then to each friend by name, one syllable per note', () => {
    const song = makeSong(['cow', 'duck'], BOUNCE);
    expect(song.map((n) => n.syllable).join(' ')).toBe(
      'Bounce high bounce low bounce the ball to Shi loh Bounce high bounce low bounce the ball to the cow Bounce high bounce low bounce the ball to the duck',
    );
    expect(song.filter((n) => n.answers).map((n) => n.syllable)).toEqual(['cow', 'duck']);
    expect(song.filter((n) => n.verseEnd)).toHaveLength(3);
    expect(song.length).toBe(10 + 10 + 10);
  });

  it('is sung on mi, sol and la alone, with "high" above "low"', () => {
    const song = makeSong(ANIMALS.slice(0, 3), BOUNCE);
    expect([...new Set(song.map((n) => n.step))].sort()).toEqual([2, 3, 4]);
    for (const n of song) expect(n.of).toBeLessThanOrEqual(8);
    const high = song.find((n) => n.syllable === 'high')!;
    const low = song.find((n) => n.syllable === 'low')!;
    expect(high.step).toBeGreaterThan(low.step);
  });
});

describe('which tune a round sings', () => {
  it('is a seeded draw: the same seed sings the same tune, and every tune turns up', () => {
    expect(pickTune(new Rng(7)).id).toBe(pickTune(new Rng(7)).id);
    const seen = new Set<string>();
    for (let seed = 1; seed <= 40; seed++) seen.add(pickTune(new Rng(seed)).id);
    expect([...seen].sort()).toEqual(['bounce', 'buns', 'clair', 'itsy', 'macdonald', 'mary', 'rain']);
  });
});

describe('the whole Old MacDonald verse', () => {
  const all = [OLD_MACDONALD_FULL.opening, OLD_MACDONALD_FULL.verse].flat();
  it('stays inside the pentatonic set, one note per syllable', () => {
    for (const p of all) {
      expect(p.syllables.length).toBe(p.steps.length);
      for (const step of p.steps) expect(PENTATONIC, `step ${step}`).toContain(stepToMidi(step) % 12);
    }
  });

  it('is the short verse plus the moo-moo lines and the first line again, 47 notes for each friend', () => {
    expect(makeSong(['cow'], OLD_MACDONALD_FULL).length).toBe(12 + 47);
    expect(makeSong(['cow', 'pig'], OLD_MACDONALD_FULL).length).toBe(12 + 94);
    // the notes before the moo-moo lines are exactly the short song's
    const short = makeSong(['cow'], OLD_MACDONALD);
    expect(makeSong(['cow'], OLD_MACDONALD_FULL).slice(0, short.length).map((n) => n.step)).toEqual(short.map((n) => n.step));
  });

  it('sings the friend\'s own sound on every moo, sounds on each, and still ends a verse exactly once', () => {
    const song = makeSong(['pig'], OLD_MACDONALD_FULL);
    const oinks = song.filter((n) => n.syllable === VOICES.pig.sound);
    expect(oinks).toHaveLength(2 + 2 + 1 + 1 + 2);
    expect(oinks.every((n) => n.answers)).toBe(true);
    expect(song.filter((n) => n.answers)).toHaveLength(oinks.length + 1);
    expect(song.filter((n) => n.verseEnd)).toHaveLength(2);
    expect(song.at(-1)!.verseEnd).toBe(true);
  });

  it('is offered only at the level that has it, beside Hot Cross Buns', () => {
    expect(tunesFor(PLANS[4])).toBe(TUNES);
    expect(tunesFor(PLANS[5])).toEqual([OLD_MACDONALD_FULL, BUNS, MARY, CLAIR, RAIN, ITSY, BOUNCE]);
  });
});
