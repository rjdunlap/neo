import { scoopShop } from '../games/scoop-shop';
import { soundGarden } from '../games/sound-garden';
import { eggCatch } from '../games/egg-catch';
import { describe, expect, it } from 'vitest';
import { landing, levelsInOrder, nextLevel, nextLevelOffer, stepLevel } from './difficulty';
import type { RoundRecord } from './save';

const round = (level: number, misses: number, hints = 0): RoundRecord => ({ level, misses, hints, seconds: 60, at: 0 });
const range = { min: 1, max: 6 };

describe('stepLevel', () => {
  it('moves one level at a time and stops at the ends of the band', () => {
    expect(stepLevel(3, 1, range)).toBe(4);
    expect(stepLevel(3, -1, range)).toBe(2);
    expect(stepLevel(6, 1, range)).toBe(6);
    expect(stepLevel(1, -1, range)).toBe(1);
    expect(stepLevel(4, -1, { min: 4, max: 9 })).toBe(4);
  });
});

describe('nextLevel', () => {
  it('steps up after two smooth rounds at the current level', () => {
    expect(nextLevel(2, [round(2, 0), round(2, 1)], range)).toBe(3);
  });

  it('needs two rounds at the new level before moving again', () => {
    expect(nextLevel(3, [round(2, 0), round(3, 0)], range)).toBe(3);
  });

  it('steps down after two struggling rounds', () => {
    expect(nextLevel(3, [round(3, 5), round(3, 0, 2)], range)).toBe(2);
  });

  it('holds steady on mixed rounds', () => {
    expect(nextLevel(3, [round(3, 0), round(3, 3)], range)).toBe(3);
  });

  it('stays inside the age band range', () => {
    expect(nextLevel(6, [round(6, 0), round(6, 0)], range)).toBe(6);
    expect(nextLevel(1, [round(1, 9), round(1, 9)], range)).toBe(1);
    expect(nextLevel(9, [], range)).toBe(6);
    expect(nextLevel(1, [], { min: 4, max: 9 })).toBe(4);
  });
});

describe('nextLevelOffer', () => {
  const range = { min: 2, max: 5 };
  it('offers the level above the one just played, up to the top of the range', () => {
    expect(nextLevelOffer(2, range)).toBe(3);
    expect(nextLevelOffer(4, range)).toBe(5);
    expect(nextLevelOffer(5, range)).toBeNull();
  });
});

describe('an explicit order apart from the level IDs', () => {
  // IDs 1-3 are hard; 4 is an easier level appended later, so the ladder runs 4, 1, 2, 3.
  const ordered = { min: 1, max: 4, order: [4, 1, 2, 3] };

  it('steps along the order, not the numbers', () => {
    expect(stepLevel(4, 1, ordered)).toBe(1);
    expect(stepLevel(1, -1, ordered)).toBe(4);
    expect(stepLevel(3, 1, ordered)).toBe(3);
    expect(stepLevel(4, -1, ordered)).toBe(4);
  });

  it('adapts along the order and keeps IDs in the history', () => {
    expect(nextLevel(4, [round(4, 0), round(4, 0)], ordered)).toBe(1);
    expect(nextLevel(1, [round(1, 5), round(1, 5)], ordered)).toBe(4);
    expect(nextLevel(3, [round(3, 0), round(3, 0)], ordered)).toBe(3);
  });

  it('offers the next harder level, and none at the hardest', () => {
    expect(nextLevelOffer(4, ordered)).toBe(1);
    expect(nextLevelOffer(2, ordered)).toBe(3);
    expect(nextLevelOffer(3, ordered)).toBeNull();
  });

  it('lists every level easiest first', () => {
    expect(levelsInOrder(ordered)).toEqual([4, 1, 2, 3]);
    expect(levelsInOrder({ min: 2, max: 4 })).toEqual([2, 3, 4]);
  });

  it('places a level outside the range at the nearest end', () => {
    expect(nextLevel(9, [], ordered)).toBe(3);
    expect(nextLevel(0, [], ordered)).toBe(4);
  });
});

describe('an order that skips level IDs', () => {
  // A pre-K band that keeps 3-9, then a new easy entry 13, leaving 10-12 to the school band.
  const skipping = { min: 3, max: 13, order: [13, 3, 4, 5, 6, 7, 8, 9] };

  it('steps over the left-out IDs', () => {
    expect(stepLevel(13, 1, skipping)).toBe(3);
    expect(stepLevel(9, 1, skipping)).toBe(9);
    expect(stepLevel(3, -1, skipping)).toBe(13);
    expect(nextLevelOffer(9, skipping)).toBeNull();
    expect(levelsInOrder(skipping)).toEqual([13, 3, 4, 5, 6, 7, 8, 9]);
  });

  it('puts a saved or pinned level that was left out on the nearest listed ID', () => {
    expect(nextLevel(10, [], skipping)).toBe(9);
    expect(nextLevel(12, [], skipping)).toBe(13);
    expect(nextLevel(11, [], { min: 1, max: 5, order: [1, 2, 4, 5] })).toBe(5);
    expect(nextLevel(3, [], { min: 1, max: 5, order: [1, 2, 4, 5] })).toBe(2);
  });

  it('adapts along the list and keeps IDs in the history', () => {
    expect(nextLevel(13, [round(13, 0), round(13, 0)], skipping)).toBe(3);
    expect(nextLevel(3, [round(3, 5), round(3, 5)], skipping)).toBe(13);
  });
});

it('Egg Catch keeps toddler IDs ordered 1,8,2, with safe birthdays and pins outside that window', () => {
  const range = eggCatch.levels('toddler');
  expect(levelsInOrder(range)).toEqual([1, 8, 2]);
  expect(nextLevel(1, [round(1, 0), round(1, 0)], range)).toBe(8);
  expect(nextLevel(8, [round(8, 0), round(8, 0)], range)).toBe(2);
  expect(nextLevel(2, [round(2, 5), round(2, 5)], range)).toBe(8);
  expect(nextLevel(8, [round(8, 5), round(8, 5)], range)).toBe(1);
  expect(nextLevelOffer(1, range)).toBe(8);
  expect(nextLevelOffer(8, range)).toBe(2);
  expect(nextLevelOffer(2, range)).toBeNull();
  expect(nextLevel(2, [], range)).toBe(2);
  for (const band of ['lap', 'preschool', 'prek', 'school'] as const) {
    const r = eggCatch.levels(band);
    expect(levelsInOrder(r)).not.toContain(8);
    expect(landing(8, r, eggCatch.entryLevels)).toBe(r.min);
  }
});


it('Egg Catch one-gate entry precedes the full tree without renumbering saved steps or pins', () => {
  for (const [band, order, before] of [['preschool', [2, 3, 9, 4], 3], ['prek', [3, 9, 4, 5], 3]] as const) {
    const range = eggCatch.levels(band);
    expect(levelsInOrder(range)).toEqual(order);
    expect(nextLevelOffer(before, range)).toBe(9);
    expect(nextLevelOffer(9, range)).toBe(4);
    expect(nextLevel(9, [round(9, 0), round(9, 0)], range)).toBe(4);
    expect(nextLevel(9, [round(9, 5), round(9, 5)], range)).toBe(3);
    expect(nextLevel(4, [], range)).toBe(4);
    expect(landing(9, range, eggCatch.entryLevels)).toBe(9);
  }
  for (const band of ['lap', 'toddler', 'school'] as const) {
    const range = eggCatch.levels(band);
    expect(levelsInOrder(range)).not.toContain(9);
    expect(landing(9, range, eggCatch.entryLevels)).toBe(levelsInOrder(range)[0]);
  }
});


it('adds repair and spring boards after the school pair without admitting younger entry IDs', () => {
  const range = eggCatch.levels('school');
  expect(levelsInOrder(range)).toEqual([4, 5, 6, 7, 10, 11]);
  expect(stepLevel(7, 1, range)).toBe(10);
  expect(stepLevel(10, 1, range)).toBe(11);
  expect(stepLevel(10, -1, range)).toBe(7);
  expect(nextLevelOffer(11, range)).toBeNull();
  for (const band of ['lap', 'toddler', 'preschool', 'prek'] as const) {
    expect(levelsInOrder(eggCatch.levels(band))).not.toContain(10);
    expect(levelsInOrder(eggCatch.levels(band))).not.toContain(11);
  }
});

it('Sound Garden lap enters at 8 then 1, preserving saved IDs and safe birthday entry', () => {
  const range = soundGarden.levels('lap');
  expect(levelsInOrder(range)).toEqual([8, 1]);
  expect(nextLevel(0, [], range)).toBe(8);
  expect(nextLevel(1, [], range)).toBe(1);
  expect(nextLevel(8, [round(8, 0), round(8, 0)], range)).toBe(1);
  expect(nextLevelOffer(8, range)).toBe(1);
  expect(nextLevelOffer(1, range)).toBeNull();
  for (const band of ['toddler', 'preschool', 'prek'] as const) {
    const r = soundGarden.levels(band);
    expect(levelsInOrder(r)).not.toContain(8);
    expect(landing(8, r, soundGarden.entryLevels)).toBe(levelsInOrder(r)[0]);
  }
});

describe('Scoop Shop younger entries', () => {
  it('steps through the teaching order without renumbering old IDs', () => {
    const lap = scoopShop.levels('lap');
    expect(levelsInOrder(lap)).toEqual([10, 1]);
    expect(nextLevel(10, [round(10, 0), round(10, 0)], lap)).toBe(1);
    expect(nextLevelOffer(1, lap)).toBeNull();
    expect(levelsInOrder(scoopShop.levels('toddler'))).toEqual([1, 2, 11, 3]);
    expect(levelsInOrder(scoopShop.levels('preschool'))).toEqual([2, 11, 3, 4, 5]);
    expect(stepLevel(2, 1, scoopShop.levels('toddler'))).toBe(11);
    expect(stepLevel(11, 1, scoopShop.levels('toddler'))).toBe(3);
    expect(stepLevel(11, -1, scoopShop.levels('preschool'))).toBe(2);
  });
  it('lands a birthday or lap pin at the next band’s easiest level', () => {
    for (const band of ['toddler', 'preschool', 'prek', 'school'] as const) {
      const range = scoopShop.levels(band);
      expect(landing(10, range, scoopShop.entryLevels)).toBe(levelsInOrder(range)[0]);
    }
    expect(landing(10, scoopShop.levels('lap'), scoopShop.entryLevels)).toBe(10);
  });
});

 it('keeps Scoop Shop saved IDs while inserting count-on and mixed counts into older bands', () => {
  expect(levelsInOrder(scoopShop.levels('prek'))).toEqual([3, 4, 12, 13, 5, 6]);
  expect(levelsInOrder(scoopShop.levels('school'))).toEqual([5, 12, 13, 6]);
  expect(stepLevel(4, 1, scoopShop.levels('prek'))).toBe(12);
  expect(stepLevel(13, 1, scoopShop.levels('school'))).toBe(6);
  expect(nextLevel(6, [], scoopShop.levels('school'))).toBe(6);
});
