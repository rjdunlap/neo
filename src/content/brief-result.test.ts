import { describe, expect, it } from 'vitest';
import { GAMES } from '../games/registry';
import { BRIEF_RESULT_GAMES, briefResult, type BriefResultCase } from './brief-result';

const base: BriefResultCase = {
  on: true,
  guest: false,
  id: 'bubble-pop',
  earlierRounds: 3,
  made: false,
  discovered: false,
  grewForm: false,
  story: false,
  mix: false,
  daily: false,
  book: false,
};

describe('briefResult', () => {
  it('is short for a pilot game on a later round with the switch on', () => {
    for (const id of BRIEF_RESULT_GAMES) expect(briefResult({ ...base, id })).toBe(true);
  });

  it('is the full result in every other case', () => {
    const cases: Partial<BriefResultCase>[] = [
      { on: false },
      { guest: true },
      { id: 'duck-pond' },
      { earlierRounds: 0 },
      { made: true },
      { discovered: true },
      { grewForm: true },
      { story: true },
      { mix: true },
      { daily: true },
      { book: true },
    ];
    for (const c of cases) expect(briefResult({ ...base, ...c }), JSON.stringify(c)).toBe(false);
  });

  it('names only games that exist', () => {
    for (const id of BRIEF_RESULT_GAMES)
      expect(
        GAMES.some((g) => g.id === id),
        id,
      ).toBe(true);
  });
});
