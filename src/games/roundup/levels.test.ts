import { expect, it } from 'vitest';
import { roundup } from './index';
import { landing, levelsInOrder, nextLevelOffer, stepLevel } from '../../progress/difficulty';
import { howToFor } from '../../content/howto';

it('places Come along after tap for lap and toddler, before Shoo one', () => {
  const toddler = roundup.levels('toddler');
  const lap = roundup.levels('lap');
  expect(levelsInOrder(toddler)).toEqual([1, 11, 10, 2, 3]);
  expect(levelsInOrder(lap)).toEqual([1, 11]);
  expect(roundup.entryLevels).toEqual([10, 11]);
  expect(nextLevelOffer(1, toddler)).toBe(11);
  expect(nextLevelOffer(11, toddler)).toBe(10);
  expect(nextLevelOffer(1, lap)).toBe(11);
  expect(stepLevel(10, -1, toddler)).toBe(11);
  expect(stepLevel(11, -1, toddler)).toBe(1);
  expect(landing(11, roundup.levels('preschool'), roundup.entryLevels)).toBe(2);
  expect(landing(11, roundup.levels('prek'), roundup.entryLevels)).toBe(3);
  const card = JSON.stringify(howToFor(roundup, 11)!);
  expect(card).toContain('gather');
  expect(card).toContain('any order');
  expect(card).not.toContain('behind');
  expect(card).not.toContain('ring the bell');
});

it('places Shoo one between tap and shoo three without renumbering other bands', () => {
  const toddler = roundup.levels('toddler');
  expect(nextLevelOffer(10, toddler)).toBe(2);
  expect(stepLevel(2, -1, toddler)).toBe(10);
  expect(levelsInOrder(roundup.levels('preschool'))).toEqual([2, 3, 4, 5]);
  expect(levelsInOrder(roundup.levels('prek'))).toEqual([3, 4, 5, 6, 7, 8, 9]);
  expect(landing(10, roundup.levels('preschool'), roundup.entryLevels)).toBe(2);
  const card = howToFor(roundup, 10)!;
  expect(JSON.stringify(card)).toContain('wide gate');
  expect(JSON.stringify(card)).toContain('second');
  expect(JSON.stringify(card)).not.toContain('ring the bell');
});

it('keeps Make it fair below Fill it up, with no number on its sign', () => {
  expect(roundup.levels('prek').max).toBe(9);
  expect(roundup.levels('preschool').max).toBe(5);
  const card = JSON.stringify(howToFor(roundup, 8)!);
  expect(card).toContain('same number');
  expect(card).toContain('ring the bell');
  expect(card).toContain('empty pen');
  expect(card).not.toContain('cows');
});


it('offers Fill it up after Make it fair with a remainder-specific card', () => {
  expect(nextLevelOffer(8, roundup.levels('prek'))).toBe(9);
  expect(stepLevel(9, 1, roundup.levels('prek'))).toBe(9);
  const card = JSON.stringify(howToFor(roundup, 9)!);
  expect(card).toContain('already holds');
  expect(card).toContain('exactly its requested total');
  expect(card).toContain('recount');
});
