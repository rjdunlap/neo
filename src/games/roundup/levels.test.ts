import { expect, it } from 'vitest';
import { roundup } from './index';
import { landing, levelsInOrder, nextLevelOffer, stepLevel } from '../../progress/difficulty';
import { howToFor } from '../../content/howto';

it('places Shoo one between tap and shoo three without renumbering other bands', () => {
  const toddler = roundup.levels('toddler');
  expect(levelsInOrder(toddler)).toEqual([1, 10, 2, 3]);
  expect(roundup.entryLevels).toEqual([10]);
  expect(nextLevelOffer(1, toddler)).toBe(10);
  expect(nextLevelOffer(10, toddler)).toBe(2);
  expect(stepLevel(2, -1, toddler)).toBe(10);
  expect(levelsInOrder(roundup.levels('lap'))).toEqual([1]);
  expect(levelsInOrder(roundup.levels('preschool'))).toEqual([2, 3, 4, 5]);
  expect(levelsInOrder(roundup.levels('prek'))).toEqual([3, 4, 5, 6]);
  expect(landing(10, roundup.levels('preschool'), roundup.entryLevels)).toBe(2);
  const card = howToFor(roundup, 10)!;
  expect(JSON.stringify(card)).toContain('wide gate');
  expect(JSON.stringify(card)).toContain('second');
  expect(JSON.stringify(card)).not.toContain('ring the bell');
});
